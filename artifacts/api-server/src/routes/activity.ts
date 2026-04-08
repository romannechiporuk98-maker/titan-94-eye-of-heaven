import { Router, type IRouter } from "express";
import { activityLog } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/activity", (req, res) => {
  const { type, severity, limit = "20", offset = "0" } = req.query as Record<string, string>;
  let result = [...activityLog];
  if (type)     result = result.filter(a => a.type === type.toUpperCase());
  if (severity) result = result.filter(a => a.severity === severity);
  const total = result.length;
  const page  = result.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({ activity: page, total, offset: parseInt(offset), limit: parseInt(limit) });
});

export default router;
