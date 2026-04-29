import { Router, type IRouter } from "express";
import * as store from "../services/store";

const router: IRouter = Router();

// Aggregated activity by hour for last 24h — fed into recharts
router.get("/dashboard/chart", async (_req, res) => {
  const all = await store.listActivity(500);
  const now = Date.now();
  const HOUR = 3600 * 1000;
  const buckets: Array<{ t: number; hour: string; threats: number; scans: number; analysis: number; heal: number }> = [];

  for (let i = 23; i >= 0; i--) {
    const start = now - i * HOUR;
    const d = new Date(start);
    buckets.push({
      t: start,
      hour: `${d.getHours()}:00`,
      threats: 0, scans: 0, analysis: 0, heal: 0,
    });
  }

  for (const a of all) {
    const ts = new Date(a.createdAt as any).getTime();
    const hoursAgo = Math.floor((now - ts) / HOUR);
    if (hoursAgo < 0 || hoursAgo > 23) continue;
    const idx = 23 - hoursAgo;
    const t = (a.type || "").toUpperCase();
    if (t === "SCAN") buckets[idx].scans++;
    else if (t === "HEAL") buckets[idx].heal++;
    else if (t === "LEARN" || t === "ANALYSIS") buckets[idx].analysis++;
    else if (a.severity === "critical" || a.severity === "warning") buckets[idx].threats++;
  }

  res.json(buckets);
});

router.get("/dashboard/summary", async (_req, res) => {
  const [state, vCount] = await Promise.all([
    store.getAgentState(),
    store.vulnStats(),
  ]);
  res.json({
    activeThreats:  vCount.active ?? 0,
    healedThreats:  vCount.healed ?? 0,
    totalThreats:   vCount.total ?? 0,
    scanCycles:     state.scanCycles,
    healCycles:     state.healCycles,
    learnCycles:    state.learnCycles,
    knowledgeSize:  state.knowledgeSize,
    accuracy:       parseFloat(state.accuracy),
    accuracyPct:    (parseFloat(state.accuracy) * 100).toFixed(1),
    lastBlockSeqno: state.lastBlockSeqno ?? 0,
    uptime:         process.uptime(),
  });
});

export default router;
