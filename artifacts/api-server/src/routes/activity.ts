import { Router, type IRouter } from "express";
import * as store from "../services/store";

const router: IRouter = Router();

router.get("/activity", async (req, res) => {
  const { limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 20, 200);
  const off = parseInt(offset) || 0;
  const [rows, total] = await Promise.all([store.listActivity(lim, off), store.activityCount()]);
  res.json({ activity: rows, total, offset: off, limit: lim });
});

export default router;
