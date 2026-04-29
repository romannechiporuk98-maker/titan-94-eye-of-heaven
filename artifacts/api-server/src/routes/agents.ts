/**
 * Custom Agent Builder API — let users build their own autonomous agents.
 */
import { Router, type IRouter } from "express";
import * as agents from "../services/agents";
import * as creator from "../services/creator";

const router: IRouter = Router();

const TOOL_CATALOG = [
  { id: "ton-scan",          name: "TON Blockchain Scanner",  description: "Сканує мережу TON на аномалії", needsPro: false },
  { id: "vuln-check",        name: "Vulnerability Checker",   description: "Перевіряє нові вразливості", needsPro: false },
  { id: "price-watch",       name: "Price Watcher",           description: "Моніторить ціни TON / Jetton", needsPro: false },
  { id: "ai-analysis",       name: "AI Analysis (Gemini)",    description: "AI-аналіз проти цілі агента", needsPro: true },
  { id: "telegram-notify",   name: "Telegram Notifier",       description: "Шле повідомлення власнику в TG", needsPro: false },
  { id: "ledger-credit",     name: "Ledger Credit",           description: "Нараховує TON за успішне виконання", needsPro: true },
  { id: "shell",             name: "Shell Executor",          description: "Виконує shell-команди (creator-only)", needsPro: false, creatorOnly: true },
];

const ROLE_TEMPLATES = [
  {
    id: "guardian",
    name: "🛡 Guardian",
    role: "You are a vigilant security guardian for TON blockchain assets.",
    goal: "Monitor my wallet and notify on suspicious activity",
    tools: ["ton-scan", "vuln-check", "telegram-notify"],
    intervalMin: 5,
  },
  {
    id: "trader",
    name: "📈 Trader Scout",
    role: "You are a profitable arbitrage scout for TON DEXes.",
    goal: "Find arbitrage opportunities and notify me",
    tools: ["price-watch", "ai-analysis", "telegram-notify"],
    intervalMin: 10,
  },
  {
    id: "researcher",
    name: "🔬 Researcher",
    role: "You are a deep research analyst for TON projects.",
    goal: "Daily deep-dive into one trending TON project",
    tools: ["ton-scan", "ai-analysis", "telegram-notify"],
    intervalMin: 60,
  },
  {
    id: "yield-farmer",
    name: "🌾 Yield Farmer",
    role: "You are a passive income optimizer for TON.",
    goal: "Earn small TON yield from monitoring tasks",
    tools: ["ton-scan", "ledger-credit", "telegram-notify"],
    intervalMin: 30,
  },
  {
    id: "ops",
    name: "⚙ DevOps",
    role: "You are an autonomous DevOps engineer for the platform.",
    goal: "Keep system healthy, alert on errors",
    tools: ["shell", "telegram-notify"],
    intervalMin: 15,
  },
];

router.get("/agents/catalog", (_req, res) => {
  res.json({ tools: TOOL_CATALOG, templates: ROLE_TEMPLATES });
});

router.get("/agents", async (req, res) => {
  const owner = req.query.owner ? String(req.query.owner) : undefined;
  const list = await agents.listAgents(owner);
  res.json({ total: list.length, agents: list });
});

router.get("/agents/:id", async (req, res) => {
  const a = await agents.getAgent(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(a);
});

router.post("/agents", async (req, res) => {
  const { ownerTgId } = req.body || {};
  if (!ownerTgId) return res.status(400).json({ error: "ownerTgId required" });
  // Limit non-creators to 3 agents
  if (!creator.isCreator(ownerTgId)) {
    const existing = await agents.listAgents(ownerTgId);
    if (existing.length >= 3) return res.status(400).json({ error: "Free limit: 3 agents max. Upgrade to PRO/ELITE/Developer for more." });
  }
  const a = await agents.createAgent(req.body);
  res.json(a);
});

router.patch("/agents/:id", async (req, res) => {
  const a = await agents.updateAgent(req.params.id, req.body);
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(a);
});

router.delete("/agents/:id", async (req, res) => {
  const ok = await agents.deleteAgent(req.params.id);
  res.json({ success: ok });
});

router.post("/agents/:id/run", async (req, res) => {
  const r = await agents.runAgent(req.params.id);
  res.json(r);
});

router.post("/agents/:id/toggle", async (req, res) => {
  const a = await agents.getAgent(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  const upd = await agents.updateAgent(req.params.id, { enabled: !a.enabled });
  res.json(upd);
});

export default router;
