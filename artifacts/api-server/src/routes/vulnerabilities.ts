import { Router, type IRouter } from "express";
import { vulnerabilities } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/vulnerabilities", (req, res) => {
  const { severity, status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  let result = [...vulnerabilities];
  if (severity) result = result.filter(v => v.severity === severity);
  if (status)   result = result.filter(v => v.status === status);
  const total = result.length;
  const page  = result.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  const stats = {
    critical: vulnerabilities.filter(v => v.severity === "critical").length,
    high:     vulnerabilities.filter(v => v.severity === "high").length,
    medium:   vulnerabilities.filter(v => v.severity === "medium").length,
    low:      vulnerabilities.filter(v => v.severity === "low").length,
    active:   vulnerabilities.filter(v => v.status === "active").length,
    healed:   vulnerabilities.filter(v => v.status === "healed").length,
    tvlAtRisk: vulnerabilities.filter(v => v.status === "active").reduce((s, v) => s + parseFloat(v.tvlAtRisk || "0"), 0).toFixed(0),
  };
  res.json({ vulnerabilities: page, total, stats, offset: parseInt(offset), limit: parseInt(limit) });
});

router.get("/vulnerabilities/:id", (req, res) => {
  const v = vulnerabilities.find(v => String(v.id) === req.params.id || v.externalId === req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  res.json(v);
});

export default router;
