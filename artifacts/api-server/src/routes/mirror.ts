/**
 * Protocol-94 / Mirror endpoints. Creator-only.
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as mirror from "../services/mirror";
import * as eye from "../services/eye";
import * as creator from "../services/creator";

const router: IRouter = Router();

function requireCreator(req: Request, res: Response, next: NextFunction) {
  const id = String(req.headers["x-telegram-id"] || req.headers["x-creator-id"] || req.query["tg"] || "");
  if (!creator.isCreator(id)) return res.status(403).json({ error: "Forbidden — Protocol-94 access denied" });
  next();
}

// Reflective snapshot of entire organism
router.get("/mirror/reflect", requireCreator, async (_req, res) => {
  res.json(await mirror.reflect());
});

// Convergence pulse — forces immediate sync
router.post("/mirror/pulse", requireCreator, (_req, res) => {
  res.json(mirror.pulse());
});

// Heal: lifts quarantines, resets failure counters
router.post("/mirror/heal", requireCreator, (_req, res) => {
  res.json(mirror.heal());
});

// Kill-switch toggle — emergency shutdown of public traffic
router.post("/mirror/kill", requireCreator, (req, res) => {
  const { on } = (req.body || {}) as { on?: boolean };
  mirror.setKillSwitch(!!on);
  res.json({ ok: true, killSwitch: !!on });
});

// Eye of God — public read-only awareness (anyone can see the world counts)
router.get("/eye/world", (_req, res) => {
  res.json(eye.worldView());
});

router.delete("/eye/category/:cat", requireCreator, (req, res) => {
  const removed = eye.clearCategory(req.params.cat);
  res.json({ removed });
});

export default router;
