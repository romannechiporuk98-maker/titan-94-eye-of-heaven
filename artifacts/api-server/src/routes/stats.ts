import { Router, type IRouter } from "express";
import { getDemoJobs, computeStats } from "../lib/ton";

const router: IRouter = Router();

router.get("/stats", (_req, res) => {
  const jobs = getDemoJobs();
  const stats = computeStats(jobs);
  res.json(stats);
});

export default router;
