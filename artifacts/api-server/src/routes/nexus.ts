import { Router, type IRouter } from "express";
import https from "https";

const GEMINI_KEY = process.env["GEMINI_API_KEY"] || "";

async function gemini(prompt: string, system?: string): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: (system ? system + "\n\n" : "") + prompt }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          resolve(j?.candidates?.[0]?.content?.parts?.[0]?.text ?? null);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
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

router.get("/nexus/status", (_req, res) => {
  res.json({
    online: true,
    model: "gemini-2.0-flash",
    keyConfigured: !!GEMINI_KEY,
    modes: Object.keys(SYSTEMS),
  });
});

router.post("/nexus/generate", async (req, res) => {
  const { prompt, mode = "general" } = (req.body || {}) as { prompt?: string; mode?: string };
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt required" });
  }
  const system = SYSTEMS[mode] || SYSTEMS["general"];
  const reply = await gemini(prompt, system);
  if (reply) {
    return res.json({ reply, model: "gemini-2.0-flash", mode });
  }
  // Fallback when no API key
  res.json({
    reply: `⚠️ NEXUS у fallback-режимі (немає GEMINI_API_KEY).\n\nЗапит [${mode}]: «${prompt}»\n\nДодай GEMINI_API_KEY у secrets і перезапусти API щоб активувати повноцінного мультимедійного агента (Gemini 2.0 Flash).`,
    model: "fallback",
    mode,
  });
});

export default router;
