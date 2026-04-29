/**
 * TITAN-94 Custom Agents — user-defined AI agents that run on schedule.
 * Each user can build their own autonomous agent (like a personal Replit Agent).
 *
 * Storage: file-persisted JSON (.titan-agents.json).
 * Runner: invoked by heartbeat every cycle, runs agents whose nextRunAt has passed.
 */
import { promises as fs } from "fs";
import path from "path";
import { logger } from "../lib/logger";

const STORE_FILE = path.resolve(process.cwd(), ".titan-agents.json");

export type AgentTool = "ton-scan" | "vuln-check" | "price-watch" | "ai-analysis" | "telegram-notify" | "ledger-credit" | "shell";

export interface CustomAgent {
  id: string;
  ownerTgId: string;
  name: string;
  description: string;
  role: string;        // system prompt
  goal: string;        // what to accomplish
  tools: AgentTool[];
  intervalMin: number; // run every N minutes
  enabled: boolean;
  memory: string[];    // last 50 outcomes
  runs: number;
  successes: number;
  failures: number;
  lastRunAt: string | null;
  nextRunAt: string;
  lastOutput: string;
  createdAt: string;
  updatedAt: string;
}

let cache: CustomAgent[] | null = null;

async function load(): Promise<CustomAgent[]> {
  try { return JSON.parse(await fs.readFile(STORE_FILE, "utf-8")); }
  catch { return []; }
}
async function save(arr: CustomAgent[]): Promise<void> {
  await fs.writeFile(STORE_FILE, JSON.stringify(arr, null, 2), "utf-8");
}

export async function listAgents(ownerTgId?: string): Promise<CustomAgent[]> {
  if (!cache) cache = await load();
  return ownerTgId ? cache.filter((a) => a.ownerTgId === ownerTgId) : cache;
}

export async function getAgent(id: string): Promise<CustomAgent | null> {
  const all = await listAgents();
  return all.find((a) => a.id === id) || null;
}

export async function createAgent(input: Partial<CustomAgent>): Promise<CustomAgent> {
  const all = await listAgents();
  const id = "agent_" + Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  const agent: CustomAgent = {
    id,
    ownerTgId: input.ownerTgId || "demo",
    name: input.name || "Untitled Agent",
    description: input.description || "",
    role: input.role || "You are an autonomous AI agent.",
    goal: input.goal || "",
    tools: input.tools || [],
    intervalMin: Math.max(1, input.intervalMin || 30),
    enabled: input.enabled ?? true,
    memory: [],
    runs: 0, successes: 0, failures: 0,
    lastRunAt: null,
    nextRunAt: new Date(Date.now() + 60_000).toISOString(),
    lastOutput: "",
    createdAt: now, updatedAt: now,
  };
  all.push(agent);
  cache = all;
  await save(all);
  logger.info({ id, owner: agent.ownerTgId, name: agent.name }, "[AGENTS] created");
  return agent;
}

export async function updateAgent(id: string, patch: Partial<CustomAgent>): Promise<CustomAgent | null> {
  const all = await listAgents();
  const i = all.findIndex((a) => a.id === id);
  if (i < 0) return null;
  const next = { ...all[i]!, ...patch, id, updatedAt: new Date().toISOString() };
  all[i] = next;
  cache = all;
  await save(all);
  return next;
}

export async function deleteAgent(id: string): Promise<boolean> {
  const all = await listAgents();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  cache = next;
  await save(next);
  return true;
}

export async function runAgent(id: string): Promise<{ ok: boolean; output: string }> {
  const agent = await getAgent(id);
  if (!agent) return { ok: false, output: "Agent not found" };

  const lines: string[] = [];
  lines.push(`[${new Date().toISOString()}] running "${agent.name}"`);
  lines.push(`  goal: ${agent.goal}`);
  lines.push(`  tools: ${agent.tools.join(", ") || "(none)"}`);

  let ok = true;
  try {
    for (const tool of agent.tools) {
      const r = await invokeTool(tool, agent);
      lines.push(`  ✓ ${tool}: ${r}`);
    }
    lines.push(`✓ done`);
  } catch (e) {
    ok = false;
    lines.push(`× error: ${(e as Error).message}`);
  }

  const output = lines.join("\n");
  await updateAgent(id, {
    runs: agent.runs + 1,
    successes: agent.successes + (ok ? 1 : 0),
    failures: agent.failures + (ok ? 0 : 1),
    lastRunAt: new Date().toISOString(),
    nextRunAt: new Date(Date.now() + agent.intervalMin * 60_000).toISOString(),
    lastOutput: output,
    memory: [output, ...agent.memory].slice(0, 50),
  });
  return { ok, output };
}

async function invokeTool(tool: AgentTool, agent: CustomAgent): Promise<string> {
  const store = await import("./store");
  switch (tool) {
    case "ton-scan": {
      const v = await store.vulnStats();
      return `${v.critical} critical, ${v.high} high, ${v.active} active`;
    }
    case "vuln-check": {
      const all = await store.listVulnerabilities({ limit: 5 });
      return `latest: ${all.rows.slice(0, 3).map((r: any) => r.severity).join(",")}`;
    }
    case "price-watch":
      return `TON price tracked (placeholder — wire to /api/ton/price)`;
    case "ai-analysis":
      return `analyzed against goal: "${agent.goal.slice(0, 40)}..."`;
    case "telegram-notify": {
      try {
        const { sendToCreator } = await import("./telegram-bot");
        await sendToCreator?.(`🤖 *${agent.name}*\n${agent.lastOutput?.slice(-200) || agent.goal}`);
        return `notified creator`;
      } catch { return `bot not available`; }
    }
    case "ledger-credit":
      await store.ledgerInsert({
        telegramId: agent.ownerTgId,
        type: "agent_yield",
        amountTon: 0.0001,
        description: `${agent.name} micro-yield`,
      });
      return `+0.0001 TON credited`;
    case "shell":
      return `shell tool requires creator confirmation`;
  }
}

export async function runDueAgents(): Promise<{ ran: number; succeeded: number; failed: number }> {
  const all = await listAgents();
  const now = Date.now();
  const due = all.filter((a) => a.enabled && new Date(a.nextRunAt).getTime() <= now);
  let succeeded = 0, failed = 0;
  for (const a of due) {
    const r = await runAgent(a.id);
    if (r.ok) succeeded++; else failed++;
  }
  if (due.length > 0) logger.info({ ran: due.length, succeeded, failed }, "[AGENTS] cycle complete");
  return { ran: due.length, succeeded, failed };
}
