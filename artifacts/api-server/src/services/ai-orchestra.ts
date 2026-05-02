/**
 * TITAN-94 AI ORCHESTRA — multi-model consensus engine.
 *
 * Sends a single prompt to every configured model in parallel, then
 * aggregates results: scores semantic agreement, picks consensus answer,
 * and surfaces dissenting points. The judge is the strongest available
 * model (Claude > GPT-4 > Gemini > heuristic).
 */
import https from "https";
import { logger } from "../lib/logger";
import { get as getSecret } from "./secrets";

export type ModelId = "gemini" | "openai" | "claude" | "openrouter";
export type ModelStatus = "ok" | "error" | "skip";

export interface ModelResponse {
  id: ModelId;
  name: string;
  status: ModelStatus;
  latencyMs: number;
  text: string;
  error?: string;
  agreement: number; // 0-1 vs consensus
}

export interface OrchestraResult {
  consensus: string;
  judge: string;
  agreementScore: number;          // 0-100
  models: ModelResponse[];
  dissent: Array<{ model: string; point: string }>;
  generatedAt: string;
}

// ─── Low-level HTTP ────────────────────────────────────────────────────
function postJson(opts: { host: string; path: string; headers: Record<string, string>; body: any; timeoutMs?: number }): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    const req = https.request({
      hostname: opts.host, path: opts.path, method: "POST",
      headers: { ...opts.headers, "Content-Length": Buffer.byteLength(body).toString() },
      timeout: opts.timeoutMs || 25000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8"))); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.write(body);
    req.end();
  });
}

// ─── Model adapters ────────────────────────────────────────────────────
async function callGemini(prompt: string, system: string): Promise<{ text: string }> {
  const key = await getSecret("GEMINI_API_KEY");
  if (!key) throw new Error("no key");
  const r = await postJson({
    host: "generativelanguage.googleapis.com",
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    headers: { "Content-Type": "application/json" },
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
    },
  });
  // Detect API-level errors (expired key, quota, etc.)
  if (r?.error) throw new Error(r.error.message || r.error.status || "API error");
  const finishReason = r?.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") throw new Error("safety block");
  return { text: r?.candidates?.[0]?.content?.parts?.[0]?.text || "" };
}

async function callOpenAI(prompt: string, system: string): Promise<{ text: string }> {
  const key = await getSecret("OPENAI_API_KEY");
  if (!key) throw new Error("no key");
  const r = await postJson({
    host: "api.openai.com",
    path: "/v1/chat/completions",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: {
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      temperature: 0.6, max_tokens: 1024,
    },
  });
  return { text: r?.choices?.[0]?.message?.content || "" };
}

async function callClaude(prompt: string, system: string): Promise<{ text: string }> {
  const key = await getSecret("ANTHROPIC_API_KEY");
  if (!key) throw new Error("no key");
  const r = await postJson({
    host: "api.anthropic.com",
    path: "/v1/messages",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024, system,
      messages: [{ role: "user", content: prompt }],
    },
  });
  return { text: r?.content?.[0]?.text || "" };
}

async function callOpenRouter(prompt: string, system: string): Promise<{ text: string }> {
  const key = await getSecret("OPENROUTER_API_KEY");
  if (!key) throw new Error("no key");
  const r = await postJson({
    host: "openrouter.ai",
    path: "/api/v1/chat/completions",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://replit.com", "X-Title": "TITAN-94" },
    body: {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      temperature: 0.6, max_tokens: 1024,
    },
  });
  if (r?.error) throw new Error(r.error.message || r.error.code || "API error");
  return { text: r?.choices?.[0]?.message?.content || "" };
}

const ADAPTERS: Record<ModelId, { name: string; call: (p: string, s: string) => Promise<{ text: string }>; weight: number }> = {
  claude:     { name: "Claude 3.5 Sonnet",   call: callClaude,     weight: 1.4 },
  openai:     { name: "GPT-4o-mini",         call: callOpenAI,     weight: 1.2 },
  gemini:     { name: "Gemini 2.0 Flash",    call: callGemini,     weight: 1.0 },
  openrouter: { name: "Llama-3.3-70B (OR)",  call: callOpenRouter, weight: 0.9 },
};

// ─── Consensus scoring (token Jaccard) ────────────────────────────────
function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-zа-яіїєґ0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ─── Public entry ─────────────────────────────────────────────────────
export async function runOrchestra(input: { prompt: string; system?: string; models?: ModelId[] }): Promise<OrchestraResult> {
  const system = input.system || "Ти — частина AI Orchestra TITAN-94. Дай чітку коротку відповідь українською. Без preamble. Якщо не знаєш — скажи прямо.";
  const ids: ModelId[] = input.models?.length ? input.models : (Object.keys(ADAPTERS) as ModelId[]);

  // Filter to those with a key configured
  const available: ModelId[] = [];
  for (const id of ids) {
    const keyName = ({ gemini: "GEMINI_API_KEY", openai: "OPENAI_API_KEY", claude: "ANTHROPIC_API_KEY", openrouter: "OPENROUTER_API_KEY" } as const)[id];
    if (await getSecret(keyName as any)) available.push(id);
  }

  if (available.length === 0) {
    return {
      consensus: "Жодна AI-модель не активована. Додай хоча б один ключ у Settings → Secrets (Gemini найшвидше отримати: aistudio.google.com).",
      judge: "system",
      agreementScore: 0,
      models: ids.map((id) => ({
        id, name: ADAPTERS[id].name, status: "skip" as ModelStatus, latencyMs: 0, text: "",
        error: "no API key", agreement: 0,
      })),
      dissent: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Parallel calls
  const responses: ModelResponse[] = await Promise.all(available.map(async (id) => {
    const t0 = Date.now();
    try {
      const { text } = await ADAPTERS[id].call(input.prompt, system);
      const trimmed = text.trim();
      if (!trimmed) throw new Error("empty response (safety filter or quota)");
      return { id, name: ADAPTERS[id].name, status: "ok" as ModelStatus, latencyMs: Date.now() - t0, text: trimmed, agreement: 0 };
    } catch (e: any) {
      logger.warn({ id, err: e.message }, "[ORCHESTRA] model failed");
      return { id, name: ADAPTERS[id].name, status: "error" as ModelStatus, latencyMs: Date.now() - t0, text: "", error: e.message, agreement: 0 };
    }
  }));

  const okOnes = responses.filter((r) => r.status === "ok" && r.text);
  if (okOnes.length === 0) {
    return {
      consensus: "Усі моделі повернули помилку. Перевір ключі в Settings.",
      judge: "system", agreementScore: 0, models: responses, dissent: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Score pairwise agreement
  const tokensByModel = new Map<ModelId, Set<string>>();
  for (const r of okOnes) tokensByModel.set(r.id, tokens(r.text));

  for (const r of okOnes) {
    let total = 0, n = 0;
    for (const r2 of okOnes) {
      if (r.id === r2.id) continue;
      total += jaccard(tokensByModel.get(r.id)!, tokensByModel.get(r2.id)!);
      n++;
    }
    r.agreement = n ? total / n : 1;
  }

  // Pick judge: highest weight × agreement
  const judge = okOnes.reduce((best, r) => {
    const score = ADAPTERS[r.id].weight * (0.5 + r.agreement);
    const bestScore = ADAPTERS[best.id].weight * (0.5 + best.agreement);
    return score > bestScore ? r : best;
  });

  const avgAgreement = okOnes.reduce((s, r) => s + r.agreement, 0) / okOnes.length;

  // Find dissenting points (responses with low agreement)
  const dissent = okOnes
    .filter((r) => r.id !== judge.id && r.agreement < 0.25 && r.text)
    .map((r) => ({ model: r.name, point: r.text.split("\n").find((l) => l.trim().length > 20)?.slice(0, 200) || r.text.slice(0, 200) }));

  return {
    consensus: judge.text,
    judge: judge.name,
    agreementScore: Math.round(avgAgreement * 100),
    models: responses,
    dissent,
    generatedAt: new Date().toISOString(),
  };
}
