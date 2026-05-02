import { Router, type IRouter } from "express";
import { isBotEnabled, sendNotification, sendCriticalAlert, broadcastToSubscribers } from "../services/telegram-bot";
import { runTonPoller } from "../services/ton-poller";

const router: IRouter = Router();
// Read dynamically so vault updates take effect without server restart
function getAdminToken(): string { return process.env["TELEGRAM_ADMIN_CHAT_ID"] || "7255058720"; }

router.get("/telegram/status", (_req, res) => {
  res.json({
    enabled: isBotEnabled(),
    botUsername: process.env["TELEGRAM_BOT_USERNAME"] || "Titan_94_agent_bot",
    appUrl: process.env["PUBLIC_APP_URL"] || null,
    note: isBotEnabled() ? "Bot is running" : "Set TELEGRAM_BOT_TOKEN to enable",
  });
});

router.post("/telegram/notify", async (req, res) => {
  const { telegramId, text, adminToken } = req.body || {};
  if (adminToken !== getAdminToken()) return res.status(403).json({ error: "Forbidden" });
  if (!telegramId || !text) return res.status(400).json({ error: "telegramId and text required" });
  const ok = await sendNotification(String(telegramId), String(text));
  res.json({ sent: ok });
});

router.post("/telegram/broadcast", async (req, res) => {
  const { text, plan, adminToken } = req.body || {};
  if (adminToken !== getAdminToken()) return res.status(403).json({ error: "Forbidden" });
  if (!text) return res.status(400).json({ error: "text required" });
  const result = await broadcastToSubscribers(String(text), (plan || "elite") as any);
  res.json(result);
});

router.post("/telegram/alert", async (req, res) => {
  const { title, message, severity, adminToken } = req.body || {};
  if (adminToken !== getAdminToken()) return res.status(403).json({ error: "Forbidden" });
  if (!title || !message) return res.status(400).json({ error: "title and message required" });
  const ok = await sendCriticalAlert(String(title), String(message), severity || "high");
  res.json({ sent: ok });
});

router.post("/ton/poll-now", async (_req, res) => {
  const result = await runTonPoller();
  res.json({ ...result, polledAt: new Date().toISOString() });
});

export default router;
