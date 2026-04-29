import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { isBotEnabled, getBot } from "../services/telegram-bot";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health/bot", async (_req, res) => {
  const enabled = isBotEnabled();
  const b = getBot();
  let me: any = null;
  try {
    if (enabled && b) {
      me = await b.api.getMe();
    }
  } catch (e) { /* ignore */ }
  res.json({
    enabled,
    online: !!(enabled && me),
    botUsername: me?.username || null,
    botName: me?.first_name || null,
    canJoinGroups: me?.can_join_groups ?? null,
    timestamp: new Date().toISOString(),
  });
});

export default router;
