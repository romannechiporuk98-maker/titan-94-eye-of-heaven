/**
 * TITAN-94 AI Model Catalog
 * Returns tiered list of available AI models + supports single-model generate.
 */
import { Router, type IRouter } from "express";
import https from "https";
import { get as getSecret } from "../services/secrets";

const router: IRouter = Router();

export type ModelTier = "nano" | "free" | "balanced" | "powerful" | "ultra";

export interface ModelDef {
  id: string;
  name: string;
  tier: ModelTier;
  tierLabel: string;
  color: string;
  provider: "gemini" | "openai" | "anthropic" | "openrouter";
  secretKey: string;
  model: string;
  tokens: number;
  speed: string;
  desc: string;
}

export const ALL_MODELS: ModelDef[] = [
  // ── NANO — безкоштовні, крихітні, блискавичні ─────────────────────
  {
    id:        "phi3_mini",
    name:      "Phi-3 Mini",
    tier:      "nano",
    tierLabel: "NANO · FREE",
    color:     "#4B5563",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "microsoft/phi-3-mini-128k-instruct:free",
    tokens:    512,
    speed:     "~1s",
    desc:      "3.8B параметрів · миттєва відповідь · прості задачі",
  },
  {
    id:        "gemma3_1b",
    name:      "Gemma 3 1B",
    tier:      "nano",
    tierLabel: "NANO · FREE",
    color:     "#4B5563",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "google/gemma-3-1b-it:free",
    tokens:    512,
    speed:     "~1s",
    desc:      "1B параметрів Google · мінімальні ресурси · basic tasks",
  },
  // ── FREE — безкоштовні, пристойна якість ──────────────────────────
  {
    id:        "llama_8b",
    name:      "Llama 3.1 8B",
    tier:      "free",
    tierLabel: "FREE",
    color:     "#6B7280",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "meta-llama/llama-3.1-8b-instruct:free",
    tokens:    1024,
    speed:     "~2s",
    desc:      "8B параметрів Meta · хороший баланс ціна/якість",
  },
  {
    id:        "mistral_7b",
    name:      "Mistral 7B",
    tier:      "free",
    tierLabel: "FREE",
    color:     "#6B7280",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "mistralai/mistral-7b-instruct:free",
    tokens:    1024,
    speed:     "~2s",
    desc:      "7B Mistral AI · код та текст",
  },
  {
    id:        "gemma2_9b",
    name:      "Gemma 2 9B",
    tier:      "free",
    tierLabel: "FREE",
    color:     "#6B7280",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "google/gemma-2-9b-it:free",
    tokens:    1024,
    speed:     "~2s",
    desc:      "9B Google · покращена версія Gemma",
  },
  // ── BALANCED — оптимальний за ціна/якість/швидкість ───────────────
  {
    id:        "gemini_flash",
    name:      "Gemini 2.0 Flash",
    tier:      "balanced",
    tierLabel: "BALANCED",
    color:     "#9B5CFF",
    provider:  "gemini",
    secretKey: "GEMINI_API_KEY",
    model:     "gemini-2.0-flash",
    tokens:    2048,
    speed:     "~2s",
    desc:      "Google Gemini Flash · за замовчуванням TITAN-94",
  },
  {
    id:        "llama_70b",
    name:      "Llama 3.3 70B",
    tier:      "balanced",
    tierLabel: "BALANCED",
    color:     "#9B5CFF",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "meta-llama/llama-3.3-70b-instruct:free",
    tokens:    2048,
    speed:     "~4s",
    desc:      "70B Meta Llama · безкоштовно через OpenRouter",
  },
  {
    id:        "deepseek_r1_70b",
    name:      "DeepSeek R1 70B",
    tier:      "balanced",
    tierLabel: "BALANCED",
    color:     "#9B5CFF",
    provider:  "openrouter",
    secretKey: "OPENROUTER_API_KEY",
    model:     "deepseek/deepseek-r1-distill-llama-70b:free",
    tokens:    2048,
    speed:     "~5s",
    desc:      "DeepSeek R1 distill · chain-of-thought · безкоштовно",
  },
  // ── POWERFUL — висока якість, потрібні ключі ───────────────────────
  {
    id:        "gpt4o_mini",
    name:      "GPT-4o mini",
    tier:      "powerful",
    tierLabel: "POWERFUL",
    color:     "#00FFFF",
    provider:  "openai",
    secretKey: "OPENAI_API_KEY",
    model:     "gpt-4o-mini",
    tokens:    4096,
    speed:     "~3s",
    desc:      "OpenAI GPT-4o mini · відмінний для коду та аналізу",
  },
  {
    id:        "claude_haiku",
    name:      "Claude 3 Haiku",
    tier:      "powerful",
    tierLabel: "POWERFUL",
    color:     "#00FFFF",
    provider:  "anthropic",
    secretKey: "ANTHROPIC_API_KEY",
    model:     "claude-3-haiku-20240307",
    tokens:    4096,
    speed:     "~2s",
    desc:      "Anthropic · найшвидша Claude модель",
  },
  {
    id:        "gemini_15_pro",
    name:      "Gemini 1.5 Pro",
    tier:      "powerful",
    tierLabel: "POWERFUL",
    color:     "#00FFFF",
    provider:  "gemini",
    secretKey: "GEMINI_API_KEY",
    model:     "gemini-1.5-pro",
    tokens:    4096,
    speed:     "~4s",
    desc:      "Google · 1M context window · складні задачі",
  },
  // ── ULTRA — найпотужніші моделі ────────────────────────────────────
  {
    id:        "claude_sonnet",
    name:      "Claude 3.5 Sonnet",
    tier:      "ultra",
    tierLabel: "ULTRA",
    color:     "#FF8C00",
    provider:  "anthropic",
    secretKey: "ANTHROPIC_API_KEY",
    model:     "claude-3-5-sonnet-20241022",
    tokens:    8192,
    speed:     "~5s",
    desc:      "Anthropic · топ код + аналіз · краще ніж GPT-4o",
  },
  {
    id:        "gpt4o",
    name:      "GPT-4o",
    tier:      "ultra",
    tierLabel: "ULTRA",
    color:     "#FF8C00",
    provider:  "openai",
    secretKey: "OPENAI_API_KEY",
    model:     "gpt-4o",
    tokens:    8192,
    speed:     "~5s",
    desc:      "OpenAI · найрозумніша GPT модель з vision",
  },
  {
    id:        "gemini_25_pro",
    name:      "Gemini 2.5 Pro",
    tier:      "ultra",
    tierLabel: "ULTRA",
    color:     "#FF8C00",
    provider:  "gemini",
    secretKey: "GEMINI_API_KEY",
    model:     "gemini-2.5-pro-preview-05-06",
    tokens:    8192,
    speed:     "~6s",
    desc:      "Google · найновіша та найпотужніша Gemini",
  },
  {
    id:        "claude_opus",
    name:      "Claude 3 Opus",
    tier:      "ultra",
    tierLabel: "ULTRA",
    color:     "#FF8C00",
    provider:  "anthropic",
    secretKey: "ANTHROPIC_API_KEY",
    model:     "claude-3-opus-20240229",
    tokens:    8192,
    speed:     "~8s",
    desc:      "Anthropic · найпотужніший для складних міркувань",
  },
];

// ── Single-model generate ─────────────────────────────────────────────────

function postJsonModel(opts: { host: string; path: string; headers: Record<string, string>; body: any; timeoutMs?: number }): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(opts.body);
    const req = https.request({
      hostname: opts.host, path: opts.path, method: "POST",
      headers: { ...opts.headers, "Content-Length": Buffer.byteLength(body).toString() },
      timeout: opts.timeoutMs || 30000,
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

async function callModel(def: ModelDef, prompt: string, system: string): Promise<string> {
  const key = await getSecret(def.secretKey as any);
  if (!key) throw new Error(`${def.secretKey} не налаштований`);

  if (def.provider === "gemini") {
    const r = await postJsonModel({
      host: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${def.model}:generateContent?key=${key}`,
      headers: { "Content-Type": "application/json" },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: def.tokens },
      },
    });
    if (r?.error) throw new Error(r.error.message || r.error.status);
    return r?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (def.provider === "openai") {
    const r = await postJsonModel({
      host: "api.openai.com",
      path: "/v1/chat/completions",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: { model: def.model, messages: [{ role: "system", content: system }, { role: "user", content: prompt }], temperature: 0.7, max_tokens: def.tokens },
    });
    if (r?.error) throw new Error(r.error.message || r.error.code);
    return r?.choices?.[0]?.message?.content || "";
  }

  if (def.provider === "anthropic") {
    const r = await postJsonModel({
      host: "api.anthropic.com",
      path: "/v1/messages",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: { model: def.model, max_tokens: def.tokens, system, messages: [{ role: "user", content: prompt }] },
    });
    if (r?.error) throw new Error(r.error.message || r.error.type);
    return r?.content?.[0]?.text || "";
  }

  if (def.provider === "openrouter") {
    const r = await postJsonModel({
      host: "openrouter.ai",
      path: "/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://replit.com", "X-Title": "TITAN-94" },
      body: { model: def.model, messages: [{ role: "system", content: system }, { role: "user", content: prompt }], temperature: 0.7, max_tokens: def.tokens },
    });
    if (r?.error) throw new Error(r.error.message || r.error.code);
    return r?.choices?.[0]?.message?.content || "";
  }

  throw new Error(`unknown provider: ${def.provider}`);
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get("/nexus/models", async (_req, res) => {
  const models = await Promise.all(
    ALL_MODELS.map(async (m) => {
      const key = await getSecret(m.secretKey as any);
      return { ...m, available: !!key };
    })
  );
  res.json({ models, tiers: ["nano", "free", "balanced", "powerful", "ultra"] });
});

router.post("/nexus/generate-model", async (req, res) => {
  const { prompt, modelId, system = "Ти — AI асистент TITAN-94. Відповідай по суті, лаконічно. Якщо запит українською — відповідай українською." } = (req.body || {}) as { prompt?: string; modelId?: string; system?: string };

  if (!prompt?.trim())  return res.status(400).json({ error: "prompt required" });
  if (!modelId)         return res.status(400).json({ error: "modelId required" });

  const def = ALL_MODELS.find(m => m.id === modelId);
  if (!def) return res.status(400).json({ error: `unknown modelId: ${modelId}` });

  const t0 = Date.now();
  try {
    const text = await callModel(def, prompt, system);
    return res.json({ text, modelId, modelName: def.name, tier: def.tier, latencyMs: Date.now() - t0 });
  } catch (e: any) {
    return res.json({
      text: `⚠️ ${def.name} помилка: ${e.message}`,
      modelId, modelName: def.name, tier: def.tier, latencyMs: Date.now() - t0, error: e.message,
    });
  }
});

export default router;
