/**
 * VAULT — passphrase-based mobile access to API key management.
 * Lets the creator manage secrets from any device (mobile, browser, no Telegram needed).
 *
 *   POST /api/vault/init     {pass}             → create master passphrase (only if none set)
 *   POST /api/vault/login    {pass}             → returns Bearer token (7 days)
 *   GET  /api/vault/status   (Bearer)           → exists?, secrets list
 *   POST /api/vault/detect   (Bearer) {value}   → auto-detect which secret it belongs to
 *   POST /api/vault/set      (Bearer) {key,value} → save secret
 *   DELETE /api/vault/:key   (Bearer)           → remove secret
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as secrets from "../services/secrets";
import * as auth from "../services/vault-auth";

const router: IRouter = Router();

// 5 wrong passphrase attempts per IP per 5min
const failures = new Map<string, { count: number; until: number }>();
function ipKey(req: Request): string { return String(req.ip || req.headers["x-forwarded-for"] || "?"); }
function checkBan(req: Request, res: Response): boolean {
  const k = ipKey(req); const now = Date.now();
  const f = failures.get(k);
  if (f && f.until > now && f.count >= 5) {
    res.status(429).json({ error: "Too many failed attempts. Try again in " + Math.ceil((f.until - now) / 1000) + "s." });
    return true;
  }
  return false;
}
function recordFail(req: Request) {
  const k = ipKey(req); const f = failures.get(k);
  const now = Date.now();
  if (!f || f.until < now) failures.set(k, { count: 1, until: now + 5 * 60 * 1000 });
  else failures.set(k, { count: f.count + 1, until: f.until });
}

async function requireToken(req: Request, res: Response, next: NextFunction) {
  const token = auth.bearerFromReq(req);
  const v = auth.verifyToken(token);
  if (!v.valid) return res.status(401).json({ error: "Invalid or expired vault token" });
  next();
}

// Public: tells frontend whether vault has been initialized
router.get("/vault/status", async (_req, res) => {
  const has = await secrets.hasPassphrase();
  res.json({ initialized: has });
});

// First-time setup
router.post("/vault/init", async (req, res) => {
  if (await secrets.hasPassphrase()) {
    return res.status(409).json({ error: "Passphrase already set. Use /login or contact creator to reset." });
  }
  const { pass } = (req.body || {}) as { pass?: string };
  if (!pass || pass.length < 6) return res.status(400).json({ error: "Passphrase must be at least 6 characters" });
  await secrets.setPassphrase(pass);
  const { token, expiresAt } = auth.issueToken();
  res.json({ ok: true, token, expiresAt });
});

// Login with existing passphrase
router.post("/vault/login", async (req, res) => {
  if (checkBan(req, res)) return;
  const { pass } = (req.body || {}) as { pass?: string };
  if (!await secrets.hasPassphrase()) {
    return res.status(409).json({ error: "Vault not initialized. Use /vault/init first.", needsInit: true });
  }
  const ok = await secrets.verifyPassphrase(pass || "");
  if (!ok) {
    recordFail(req);
    return res.status(401).json({ error: "Wrong passphrase" });
  }
  failures.delete(ipKey(req));
  const { token, expiresAt } = auth.issueToken();
  res.json({ ok: true, token, expiresAt });
});

// Authenticated: list all secrets
router.get("/vault/secrets", requireToken, async (_req, res) => {
  res.json({ keys: await secrets.statusAll() });
});

// Auto-detect which secret a pasted value belongs to
router.post("/vault/detect", requireToken, async (req, res) => {
  const { value } = (req.body || {}) as { value?: string };
  const r = secrets.detectSecretKey(value || "");
  res.json(r);
});

// Save a secret
router.post("/vault/set", requireToken, async (req, res) => {
  const { key, value } = (req.body || {}) as { key?: string; value?: string };
  if (!key || !secrets.SECRET_KEYS.includes(key as any)) return res.status(400).json({ error: "Invalid key" });
  if (typeof value !== "string") return res.status(400).json({ error: "value must be string" });
  await secrets.set(key as any, value);
  let reload: any = null;
  if (key === "TELEGRAM_BOT_TOKEN" && value.trim()) {
    try {
      const { reloadTelegramBot } = await import("../services/telegram-bot");
      reload = await reloadTelegramBot();
    } catch (e: any) { reload = { ok: false, reason: e.message }; }
  }
  res.json({ ok: true, key, configured: !!value.trim(), reload });
});

router.delete("/vault/:key", requireToken, async (req, res) => {
  const { key } = req.params;
  if (!secrets.SECRET_KEYS.includes(key as any)) return res.status(400).json({ error: "Invalid key" });
  await secrets.remove(key as any);
  res.json({ ok: true });
});

export default router;
