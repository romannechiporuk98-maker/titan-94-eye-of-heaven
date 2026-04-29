import { Router, type IRouter } from "express";
import * as store from "../services/store";
import { runScan, getStartedAt } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/agent/stats", async (_req, res) => {
  const [state, stats, actCount, knCount] = await Promise.all([
    store.getAgentState(),
    store.vulnStats(),
    store.activityCount(),
    store.knowledgeCount(),
  ]);

  const accuracy = parseFloat(state.accuracy);
  res.json({
    cycles:        state.cycles,
    healingCycles: state.healingCycles,
    learnCycles:   state.learnCycles,
    financeCycles: state.financeCycles,
    accuracy,
    aiAccuracy:    accuracy,
    threatsHealed: state.threatsHealed,
    knowledgeSize: knCount,
    uptime:        process.uptime(),
    startedAt:     getStartedAt(),
    lastBlockSeqno: state.lastBlockSeqno,
    threats: {
      total:    stats.total,
      active:   stats.active,
      healing:  stats.healing,
      healed:   stats.healed,
      critical: stats.critical,
      high:     stats.high,
      medium:   stats.medium,
      low:      stats.low,
      tvlAtRisk: stats.tvl_at_risk,
    },
    activityCount: actCount,
    status:  "running",
    version: "4.0-OMNIPOTENT",
  });
});

router.get("/agent/cycles", async (_req, res) => {
  const s = await store.getAgentState();
  res.json({
    scan:    { name: "SCAN",    interval: "3min",  lastRun: s.lastScan,    cycles: s.cycles,        status: "active" },
    heal:    { name: "HEAL",    interval: "5min",  lastRun: s.lastHeal,    cycles: s.healingCycles, status: "active" },
    learn:   { name: "LEARN",   interval: "7min",  lastRun: s.lastLearn,   cycles: s.learnCycles,   status: "active" },
    finance: { name: "FINANCE", interval: "10min", lastRun: s.lastFinance, cycles: s.financeCycles, status: "active" },
  });
});

router.post("/agent/scan", async (_req, res) => {
  await runScan();
  const s = await store.getAgentState();
  res.json({ success: true, message: "Scan triggered", cycle: s.cycles, lastBlockSeqno: s.lastBlockSeqno, timestamp: s.lastScan });
});

export default router;
