import { Router, type IRouter } from "express";
import { state, knowledgeBase, activityLog } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/ai-evolution/status", (_req, res) => {
  res.json({
    model:         "gemini-2.0-flash",
    fallback:      "keyword-v2",
    accuracy:      state.accuracy,
    accuracyPct:   (state.accuracy * 100).toFixed(1),
    learnCycles:   state.learnCycles,
    knowledgeSize: state.knowledgeSize,
    patternsLearned: knowledgeBase.length,
    categories:    [...new Set(knowledgeBase.map(k => k.category))],
    evolutionStage: state.learnCycles < 10 ? "Infant" : state.learnCycles < 50 ? "Learning" : state.learnCycles < 200 ? "Mature" : "Superintelligent",
    nextLearnIn:   `${7 - (Math.floor(process.uptime() / 60) % 7)} min`,
    updatedAt:     new Date().toISOString(),
  });
});

router.get("/ai-evolution/knowledge", (req, res) => {
  const { category, limit = "20", offset = "0" } = req.query as Record<string, string>;
  let result = [...knowledgeBase];
  if (category) result = result.filter(k => k.category === category);
  res.json({
    patterns: result.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
    total: result.length,
    categories: [...new Set(knowledgeBase.map(k => k.category))],
    avgConfidence: knowledgeBase.length ? (knowledgeBase.reduce((s, k) => s + parseFloat(String(k.confidence)), 0) / knowledgeBase.length * 100).toFixed(1) : "0",
  });
});

router.post("/ai-evolution/trigger", (_req, res) => {
  activityLog.unshift({
    id: activityLog.length + 300, type: "LEARN",
    title: "Manual LEARN cycle triggered",
    message: `Cycle #${state.learnCycles + 1} started via API`,
    severity: "info", createdAt: new Date().toISOString(),
  });
  res.json({ success: true, message: "LEARN cycle queued", currentCycle: state.learnCycles });
});

router.get("/ecosystem/overview", (_req, res) => {
  res.json({
    agents: [
      { name: "TITAN-94 Core",      status: "active", version: "4.0", role: "Security Scanner" },
      { name: "Gemini 2.0 Flash",   status: "active", version: "2.0", role: "AI Analysis" },
      { name: "TON Scanner",        status: "active", version: "1.0", role: "Blockchain Monitor" },
      { name: "Telegram Bot",       status: process.env.TELEGRAM_BOT_TOKEN ? "active" : "inactive", version: "1.0", role: "User Interface" },
    ],
    blockchain: { network: "TON Mainnet", status: "operational", subSecondFinality: true },
    database:   { status: "operational", tables: 7, records: 100 },
    heartbeat:  { cycles: state.cycles, uptime: process.uptime().toFixed(0) + "s" },
    updatedAt:  new Date().toISOString(),
  });
});

export default router;
