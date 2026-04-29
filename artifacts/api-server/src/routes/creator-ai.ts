/**
 * Creator AI Engineer + secure command-line + file operations.
 * All endpoints require creator auth (x-telegram-id header maps to creator ID).
 *
 * Security: blocks rm -rf /, dotfile writes outside project, absolute paths outside repo root.
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import * as creator from "../services/creator";
import * as store from "../services/store";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const PROJECT_ROOT = process.cwd().replace(/\/artifacts\/api-server$/, "");
const GEMINI_KEY = process.env["GEMINI_API_KEY"] || "";

function requireCreator(req: Request, res: Response, next: NextFunction) {
  const id = String(req.headers["x-telegram-id"] || req.headers["x-creator-id"] || req.query["tg"] || "");
  if (!creator.isCreator(id)) return res.status(403).json({ error: "Forbidden — creator only" });
  (req as any).creatorId = id;
  next();
}

// ─── Safe path resolver ──────────────────────────────────────────────────
function safePath(rel: string): string | null {
  if (!rel || typeof rel !== "string") return null;
  const clean = rel.replace(/^\/+/, "");
  const abs = path.resolve(PROJECT_ROOT, clean);
  if (!abs.startsWith(PROJECT_ROOT)) return null;
  // Block sensitive locations
  if (/\.(env|local-creator-settings)/i.test(abs)) return null;
  return abs;
}

// ─── File operations ─────────────────────────────────────────────────────
router.get("/creator/file", requireCreator, async (req, res) => {
  const rel = String(req.query.path || "");
  const abs = safePath(rel);
  if (!abs) return res.status(400).json({ error: "Invalid path (must stay inside project)" });
  try {
    const stat = await fs.stat(abs);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(abs, { withFileTypes: true });
      return res.json({
        type: "dir",
        path: rel,
        entries: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
        })).sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1),
      });
    }
    const buf = await fs.readFile(abs, "utf-8");
    return res.json({ type: "file", path: rel, size: stat.size, content: buf });
  } catch (e) {
    res.status(404).json({ error: (e as Error).message });
  }
});

router.post("/creator/file", requireCreator, async (req, res) => {
  const { path: rel, content } = req.body || {};
  const abs = safePath(rel);
  if (!abs) return res.status(400).json({ error: "Invalid path" });
  if (typeof content !== "string") return res.status(400).json({ error: "content required (string)" });
  try {
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf-8");
    const id = (req as any).creatorId;
    await store.logActivity("CREATOR", `Wrote file ${rel}`, `${content.length} bytes by ${id}`, "info");
    res.json({ success: true, path: rel, bytes: content.length });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Shell command execution ─────────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,
  /:\(\)\{:\|:&\};:/,    // fork bomb
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /chmod\s+-R\s+777\s+\//,
  /shutdown\b|reboot\b|halt\b/,
  /\$\(\s*curl/,
];

router.post("/creator/exec", requireCreator, async (req, res) => {
  const { command, timeout } = req.body || {};
  if (!command || typeof command !== "string") return res.status(400).json({ error: "command required" });
  if (BLOCKED_PATTERNS.some((p) => p.test(command))) {
    return res.status(400).json({ error: "Blocked: dangerous command pattern" });
  }
  const id = (req as any).creatorId;
  await store.logActivity("CREATOR", `Exec: ${command.slice(0, 80)}`, `by ${id}`, "info");

  exec(command, { cwd: PROJECT_ROOT, timeout: Math.min(parseInt(timeout) || 15000, 60000), maxBuffer: 1024 * 1024 * 4 }, (err, stdout, stderr) => {
    res.json({
      command,
      exitCode: err ? (err.code as number) ?? 1 : 0,
      stdout: stdout?.toString() || "",
      stderr: stderr?.toString() || "",
      durationMs: 0,
    });
  });
});

// ─── AI Engineer chat (Gemini) ───────────────────────────────────────────
const SYSTEM_PROMPT = `Ти — AI Engineer для творця проекту TITAN-94 "ОКО НЕБЕСНЕ" (автономний AI security agent для TON blockchain).
Твоя роль: швидко реагувати на команди творця (Romana), допомагати з кодом, файлами, налаштуваннями.

Архітектура:
- Backend: Node.js/Express/TypeScript (artifacts/api-server)
- Frontend: React/Vite (artifacts/enact-dashboard)
- DB: PostgreSQL через Drizzle (lib/db)
- Telegram bot: grammy
- TON: TonCenter API + TON Connect 2.0
- AI: Gemini 2.0 Flash через NEXUS

Цикли:
- SCAN (3хв) - читає TON блокчейн
- HEAL (5хв) - лікує вразливості
- AUTO-EARN (6хв) - passive yield ELITE 0.001 TON, PRO 0.0003 TON, DEV 0.05 TON/cycle
- LEARN (7хв) - вчиться regex patterns
- FINANCE (10хв) - моніторить підписників
- TON-POLLER (2хв) - сканує Reserve Wallet платежі

Endpoints керування:
- GET/POST /api/creator/settings - редагує ціни/rates/toggles
- POST /api/creator/file - запис файлу
- POST /api/creator/exec - shell команди
- POST /api/creator/user/:id/grant - видати plan вручну
- POST /api/creator/cycle/run/:cycle - запустити цикл негайно

ВАЖЛИВО:
- Відповідай коротко українською (як творець спілкується)
- Якщо команда виконувана — пропонуй точну shell команду чи API виклик
- Завжди показуй що саме зробиш ПЕРЕД виконанням
- Формат для виконання: пиши в кінці блок \`\`\`exec команда\`\`\` для shell або \`\`\`api METHOD /path BODY\`\`\` для API
- Якщо є питання — заверши \`?\` (творець відповість ✓ або ×)
- Без emoji крім ✓ ×`;

router.post("/creator/ai/chat", requireCreator, async (req, res) => {
  const { messages, command } = req.body || {};
  const userMsg = command || (messages && messages[messages.length - 1]?.content) || "";
  if (!userMsg) return res.status(400).json({ error: "command or messages required" });

  if (!GEMINI_KEY) {
    // Fallback engineer reply
    return res.json({
      reply: `[FALLBACK MODE — нема GEMINI_API_KEY]\n\nТвоя команда: "${userMsg}"\n\nЯ можу виконати:\n- shell: POST /api/creator/exec body={"command":"..."}\n- file write: POST /api/creator/file body={"path":"...","content":"..."}\n- settings: POST /api/creator/settings body={"proPriceTon":7,...}\n\nДодай GEMINI_API_KEY у secrets для повного AI Engineer режиму.`,
      model: "fallback",
      executable: null,
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`;
    const history = (messages || []).slice(-10).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    if (command) history.push({ role: "user", parts: [{ text: command }] });

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: history,
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });
    const data: any = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";

    // Extract executable from response
    const execMatch = reply.match(/```exec\n([\s\S]*?)\n```/);
    const apiMatch  = reply.match(/```api\s+(\w+)\s+(\S+)([\s\S]*?)```/);

    res.json({
      reply,
      model: "gemini-2.0-flash-exp",
      executable: execMatch ? { type: "exec", command: execMatch[1].trim() }
                : apiMatch  ? { type: "api", method: apiMatch[1], path: apiMatch[2], body: apiMatch[3].trim() }
                : null,
      needsConfirm: reply.trim().endsWith("?") || !!execMatch || !!apiMatch,
    });
  } catch (e) {
    logger.error(e, "[CREATOR-AI] chat error");
    res.status(500).json({ error: (e as Error).message });
  }
});

// AI executes confirmed action
router.post("/creator/ai/run", requireCreator, async (req, res) => {
  const { type, command, method, path: apiPath, body } = req.body || {};
  if (type === "exec" && command) {
    if (BLOCKED_PATTERNS.some((p) => p.test(command))) return res.status(400).json({ error: "Blocked dangerous command" });
    return new Promise<void>((resolve) => {
      exec(command, { cwd: PROJECT_ROOT, timeout: 30000, maxBuffer: 1024 * 1024 * 4 }, (err, stdout, stderr) => {
        res.json({ type: "exec", exitCode: err ? (err.code ?? 1) : 0, stdout: stdout?.toString() || "", stderr: stderr?.toString() || "" });
        resolve();
      });
    });
  }
  if (type === "api" && method && apiPath) {
    const url = `http://localhost:8080${apiPath.startsWith("/api") ? apiPath : "/api" + apiPath}`;
    try {
      const r = await fetch(url, {
        method: method.toUpperCase(),
        headers: { "Content-Type": "application/json", "x-telegram-id": String(req.headers["x-telegram-id"] || "") },
        body: ["GET", "DELETE"].includes(method.toUpperCase()) ? undefined : (body && body.trim() !== "" ? body : "{}"),
      });
      const data = await r.json().catch(() => ({}));
      return res.json({ type: "api", status: r.status, response: data });
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
  res.status(400).json({ error: "type must be 'exec' or 'api'" });
});

export default router;
