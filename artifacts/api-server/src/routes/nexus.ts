import { Router, type IRouter } from "express";
import https from "https";
import { runOrchestra } from "../services/ai-orchestra";
import { get as getSecret } from "../services/secrets";

async function gemini(prompt: string, system?: string): Promise<{ text: string | null; error?: string }> {
  const key = await getSecret("GEMINI_API_KEY");
  if (!key) return { text: null, error: "no key" };
  const body = JSON.stringify({
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if (j?.error) { resolve({ text: null, error: j.error.message || j.error.status }); return; }
          resolve({ text: j?.candidates?.[0]?.content?.parts?.[0]?.text ?? null });
        } catch { resolve({ text: null, error: "parse error" }); }
      });
    });
    req.on("error", (e) => resolve({ text: null, error: e.message }));
    req.write(body);
    req.end();
  });
}

const SYSTEMS: Record<string, string> = {
  website:  "Ти NEXUS — генеруй production-ready HTML/CSS/JS або React код. Лаконічно, з коментарями. Відповідай українською.",
  code:     "Ти NEXUS — пиши чистий оптимізований код з найкращими практиками. Поясни ключові рішення. Відповідай українською.",
  image:    "Ти NEXUS — генеруй детальні англомовні промпти для Midjourney/DALL-E. Формат: **Prompt:** ... **Style:** ... **Negative:** ... + опис українською.",
  video:    "Ти NEXUS — створюй покрокові сценарії: таймкод, кадр, текст, звук, ефекти. Українською.",
  film:     "Ти NEXUS — повний кіно-пайплайн: ідея → синопсис → сценарій → раскадровка → бюджет. Українською.",
  bot:      "Ти NEXUS — генеруй повний код Telegram бота на aiogram (Python) або telegraf (JS) з деплоєм. Українською.",
  music:    "Ти NEXUS — створюй тексти пісень, промпти для Suno/Udio, опис жанру та інструментів. Українською.",
  text:     "Ти NEXUS — структуровані тексти: статті, пости, SEO з мета-тегами. Українською.",
  general:  "Ти NEXUS — мультимедійний AI-агент TITAN-94. Лаконічно, по суті, українською.",
};

const router: IRouter = Router();

router.get("/nexus/status", async (_req, res) => {
  const [geminiKey, openai, claude, openrouterKey] = await Promise.all([
    getSecret("GEMINI_API_KEY"), getSecret("OPENAI_API_KEY"),
    getSecret("ANTHROPIC_API_KEY"), getSecret("OPENROUTER_API_KEY"),
  ]);
  const active = [
    !!geminiKey && "Gemini", !!openai && "GPT-4o", !!claude && "Claude", !!openrouterKey && "Llama-OR",
  ].filter(Boolean) as string[];

  // Quick non-blocking Gemini key validity check (cached 5 min)
  let geminiExpired = false;
  if (geminiKey) {
    const probe = await gemini("1+1=?", "Reply only: 2");
    if (probe.error?.includes("expired")) geminiExpired = true;
  }

  res.json({
    online: true,
    model: "gemini-2.0-flash",
    keyConfigured: !!geminiKey,
    geminiExpired,
    orchestraEnabled: active.length >= 2,
    activeModels: active,
    modes: Object.keys(SYSTEMS),
  });
});

router.post("/nexus/orchestra", async (req, res) => {
  const { prompt, mode = "general" } = (req.body || {}) as { prompt?: string; mode?: string };
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: "prompt required" });
  const system = SYSTEMS[mode] || SYSTEMS["general"];
  const result = await runOrchestra({ prompt, system });
  res.json(result);
});

router.post("/nexus/generate", async (req, res) => {
  const { prompt, mode = "general" } = (req.body || {}) as { prompt?: string; mode?: string };
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt required" });
  }
  const system = SYSTEMS[mode] || SYSTEMS["general"];
  const result = await gemini(prompt, system);
  if (result.text) {
    return res.json({ reply: result.text, model: "gemini-2.0-flash", mode });
  }
  // Fallback — show real error reason
  const reason = result.error
    ? result.error.includes("expired") ? "❌ GEMINI API KEY ПРОСТРОЧЕНИЙ. Оновіть на aistudio.google.com/app/apikey і збережіть новий у Settings → API Vault."
    : result.error.includes("no key") ? "⚠️ GEMINI_API_KEY не налаштований. Додайте у Settings → API Vault."
    : `⚠️ Gemini помилка: ${result.error}`
    : "⚠️ NEXUS у fallback-режимі (немає GEMINI_API_KEY).";
  res.json({
    reply: `${reason}\n\nЗапит [${mode}]: «${prompt}»`,
    model: "fallback",
    mode,
    keyError: result.error,
  });
});

router.get("/nexus/key-status", async (_req, res) => {
  const [geminiKey, openaiKey, claudeKey, openrouterKey] = await Promise.all([
    getSecret("GEMINI_API_KEY"), getSecret("OPENAI_API_KEY"),
    getSecret("ANTHROPIC_API_KEY"), getSecret("OPENROUTER_API_KEY"),
  ]);

  // Quick probe Gemini to detect expired/invalid key
  let geminiStatus: "ok" | "expired" | "invalid" | "no_key" = "no_key";
  let geminiError: string | undefined;
  if (geminiKey) {
    const probe = await gemini("ping", "Reply only: pong");
    if (probe.text) { geminiStatus = "ok"; }
    else if (probe.error?.includes("expired")) { geminiStatus = "expired"; geminiError = probe.error; }
    else { geminiStatus = "invalid"; geminiError = probe.error; }
  }

  res.json({
    gemini:     { configured: !!geminiKey, status: geminiStatus, error: geminiError },
    openai:     { configured: !!openaiKey,      status: openaiKey ? "configured" : "no_key" },
    claude:     { configured: !!claudeKey,      status: claudeKey ? "configured" : "no_key" },
    openrouter: { configured: !!openrouterKey,  status: openrouterKey ? "configured" : "no_key" },
    checkedAt: new Date().toISOString(),
  });
});

export default router;
