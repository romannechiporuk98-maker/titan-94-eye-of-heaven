import { Router, type IRouter } from "express";
import { state, vulnerabilities, activityLog, knowledgeBase } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/agent/stats", (_req, res) => {
  const active   = vulnerabilities.filter((v) => v.status === "active").length;
  const healed   = vulnerabilities.filter((v) => v.status === "healed").length;
  const critical = vulnerabilities.filter((v) => v.severity === "critical").length;
  const high     = vulnerabilities.filter((v) => v.severity === "high").length;

  res.json({
    cycles:        state.cycles,
    healingCycles: state.healingCycles,
    learnCycles:   state.learnCycles,
    financeCycles: state.financeCycles,
    accuracy:      state.accuracy,
    aiAccuracy:    state.accuracy,
    threatsHealed: state.threatsHealed,
    knowledgeSize: state.knowledgeSize,
    uptime:        process.uptime(),
    startedAt:     state.startedAt,
    threats:       { total: vulnerabilities.length, active, healed, critical, high },
    activityCount: activityLog.length,
    status:        "running",
    version:       "4.0-OMNIPOTENT",
  });
});

router.get("/agent/cycles", (_req, res) => {
  res.json({
    scan:    { name: "SCAN",    interval: "3min",  lastRun: state.lastScan,    cycles: state.cycles,        status: "active" },
    heal:    { name: "HEAL",    interval: "5min",  lastRun: state.lastHeal,    cycles: state.healingCycles, status: "active" },
    learn:   { name: "LEARN",   interval: "7min",  lastRun: state.lastLearn,   cycles: state.learnCycles,   status: "active" },
    finance: { name: "FINANCE", interval: "10min", lastRun: state.lastFinance, cycles: state.financeCycles, status: "active" },
  });
});

router.post("/agent/scan", async (_req, res) => {
  // Trigger an immediate synthetic scan entry
  const blockNum = 47291034 + state.cycles + 1;
  activityLog.unshift({
    id: activityLog.length + 100,
    type: "SCAN", title: "Manual scan triggered",
    message: `Block #${blockNum} — manual scan via API`,
    severity: "info", createdAt: new Date().toISOString(),
  });
  state.cycles++;
  state.lastScan = new Date().toISOString();

  res.json({ success: true, message: "Scan triggered", cycle: state.cycles, timestamp: state.lastScan });
});

export default router;
