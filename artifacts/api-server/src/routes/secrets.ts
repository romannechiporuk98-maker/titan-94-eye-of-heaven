/**
 * Secrets management API — creator only.
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as secrets from "../services/secrets";
import * as creator from "../services/creator";
import * as vaultAuth from "../services/vault-auth";

const router: IRouter = Router();

function requireCreator(req: Request, res: Response, next: NextFunction) {
  // Accept either a TG creator ID OR a valid vault Bearer token (mobile/no-TG access)
  const id = String(req.headers["x-telegram-id"] || req.headers["x-creator-id"] || req.query["tg"] || "");
  if (creator.isCreator(id)) return next();
  const t = vaultAuth.bearerFromReq(req);
  if (t && vaultAuth.verifyToken(t).valid) return next();
  return res.status(403).json({ error: "Forbidden — creator only", hint: "Use vault passphrase via /vault" });
}

router.get("/secrets/status", requireCreator, async (_req, res) => {
  res.json({ keys: await secrets.statusAll() });
});

router.post("/secrets/set", requireCreator, async (req, res) => {
  const { key, value } = (req.body || {}) as { key?: string; value?: string };
  if (!key || !secrets.SECRET_KEYS.includes(key as any)) {
    return res.status(400).json({ error: "Invalid key" });
  }
  if (typeof value !== "string") return res.status(400).json({ error: "value must be string" });
  await secrets.set(key as any, value);

  // Auto-reload Telegram bot when its token changes
  let reload: any = null;
  if (key === "TELEGRAM_BOT_TOKEN" && value.trim()) {
    try {
      const { reloadTelegramBot } = await import("../services/telegram-bot");
      reload = await reloadTelegramBot();
    } catch (e: any) {
      reload = { ok: false, reason: e.message };
    }
  }

  res.json({ ok: true, key, configured: !!value.trim(), reload });
});

router.delete("/secrets/:key", requireCreator, async (req, res) => {
  const { key } = req.params;
  if (!secrets.SECRET_KEYS.includes(key as any)) return res.status(400).json({ error: "Invalid key" });
  await secrets.remove(key as any);
  res.json({ ok: true });
});

export default router;
