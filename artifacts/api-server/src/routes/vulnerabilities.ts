import { Router, type IRouter } from "express";
import * as store from "../services/store";

const router: IRouter = Router();

router.get("/vulnerabilities", async (req, res) => {
  const { severity, status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 20, 200);
  const off = parseInt(offset) || 0;

  const [list, stats] = await Promise.all([
    store.listVulnerabilities({ severity, status, limit: lim, offset: off }),
    store.vulnStats(),
  ]);

  res.json({
    vulnerabilities: list.rows,
    total: list.total,
    stats: {
      critical: stats.critical, high: stats.high, medium: stats.medium, low: stats.low,
      active: stats.active, healing: stats.healing, healed: stats.healed,
      tvlAtRisk: stats.tvl_at_risk,
    },
    offset: off, limit: lim,
  });
});

router.get("/vulnerabilities/:id", async (req, res) => {
  const v = await store.findVulnerability(req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  res.json(v);
});

export default router;
