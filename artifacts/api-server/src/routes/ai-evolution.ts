import { Router, type IRouter } from "express";
import * as store from "../services/store";
import { runLearn } from "../services/heartbeat";

const router: IRouter = Router();

router.get("/ai-evolution/status", async (_req, res) => {
  const [state, knowledge] = await Promise.all([store.getAgentState(), store.listKnowledge(100)]);
  const accuracy = parseFloat(state.accuracy);
  res.json({
    model:           "gemini-2.0-flash",
    fallback:        "keyword-v2",
    accuracy,
    accuracyPct:     (accuracy * 100).toFixed(1),
    learnCycles:     state.learnCycles,
    knowledgeSize:   state.knowledgeSize,
    patternsLearned: knowledge.length,
    categories:      [...new Set(knowledge.map((k) => k.category))],
    evolutionStage:
      state.learnCycles < 10 ? "Infant" :
      state.learnCycles < 50 ? "Learning" :
      state.learnCycles < 200 ? "Mature" : "Superintelligent",
    nextLearnIn: `${7 - (Math.floor(process.uptime() / 60) % 7)} min`,
    updatedAt:   new Date().toISOString(),
  });
});

router.get("/ai-evolution/knowledge", async (req, res) => {
  const { category, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const all = await store.listKnowledge(200);
  let result = category ? all.filter((k) => k.category === category) : all;
  const off = parseInt(offset) || 0;
  const lim = Math.min(parseInt(limit) || 20, 200);
  const avg = all.length ? (all.reduce((s, k) => s + parseFloat(k.confidence), 0) / all.length * 100).toFixed(1) : "0";
  res.json({
    patterns:      result.slice(off, off + lim),
    total:         result.length,
    categories:    [...new Set(all.map((k) => k.category))],
    avgConfidence: avg,
  });
});

router.post("/ai-evolution/trigger", async (_req, res) => {
  await runLearn();
  const s = await store.getAgentState();
  res.json({ success: true, message: "LEARN cycle executed", currentCycle: s.learnCycles });
});

router.get("/ecosystem/overview", async (_req, res) => {
  const s = await store.getAgentState();
  const [knCount, actCount] = await Promise.all([store.knowledgeCount(), store.activityCount()]);
  res.json({
    agents: [
      { name: "TITAN-94 Core",    status: "active", version: "4.0", role: "Security Scanner" },
      { name: "Gemini 2.0 Flash", status: process.env["GEMINI_API_KEY"] ? "active" : "inactive", version: "2.0", role: "AI Analysis" },
      { name: "TonCenter Scanner", status: process.env["TON_API_KEY"] ? "active (keyed)" : "active (rate-limited)", version: "1.0", role: "Blockchain Monitor" },
      { name: "Telegram Bot",     status: process.env["TELEGRAM_BOT_TOKEN"] ? "active" : "inactive", version: "1.0", role: "User Interface" },
    ],
    blockchain: { network: "TON Mainnet", status: "operational", subSecondFinality: true, lastSeqno: s.lastBlockSeqno },
    database:   { status: "operational", tables: 11, knowledgeSize: knCount, activityCount: actCount },
    heartbeat:  { cycles: s.cycles, healingCycles: s.healingCycles, learnCycles: s.learnCycles, financeCycles: s.financeCycles, uptime: process.uptime().toFixed(0) + "s" },
    updatedAt:  new Date().toISOString(),
  });
});

export default router;
