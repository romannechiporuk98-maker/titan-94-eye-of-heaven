import { Router, type IRouter } from "express";
import { fetchFactoryEvents, computeStats } from "../lib/ton";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const jobs = await fetchFactoryEvents(50, 0);
  const stats = computeStats(jobs);
  res.json({ ...stats, source: jobs.length > 0 ? "live" : "empty", updatedAt: new Date().toISOString() });
});

export default router;
