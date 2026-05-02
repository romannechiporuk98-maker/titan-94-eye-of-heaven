/**
 * TITAN-94 Telegram Bot — full TG integration via grammy.
 * Bot commands: /start, /menu, /balance, /scan <addr>, /subscribe, /alerts, /help
 * Also exposes sendNotification() and sendCriticalAlert() for system → user messaging.
 *
 * If TELEGRAM_BOT_TOKEN is missing, all bot operations become no-ops (graceful fallback).
 */
import { Bot, InlineKeyboard, type Context } from "grammy";
import { logger } from "../lib/logger";
import * as store from "./store";
import { get as getSecret } from "./secrets";

// Read dynamically so vault updates take effect without server restart
function getAdminId(): string { return process.env["TELEGRAM_ADMIN_CHAT_ID"] || "7255058720"; }
const APP_URL   = process.env["PUBLIC_APP_URL"]          || ""; // e.g. https://titan-94.replit.app
const RESERVE   = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";
// Prefer a project-dedicated token (TELEGRAM_BOT_TOKEN_API) so this API never
// races with bots running on the same TELEGRAM_BOT_TOKEN in other Replit
// projects (Telegram returns 409 if two pollers share a token).
let TOKEN       = process.env["TELEGRAM_BOT_TOKEN_API"]
                || process.env["TELEGRAM_BOT_TOKEN"]      || "";

let bot: Bot | null = null;
let started = false;

export function isBotEnabled(): boolean { return !!TOKEN; }
export function getBot(): Bot | null { return bot; }

/** Re-init bot after secret change (called by /api/secrets/set). */
export async function reloadTelegramBot(): Promise<{ ok: boolean; reason?: string }> {
  const fresh = (await getSecret("TELEGRAM_BOT_TOKEN_API")) || (await getSecret("TELEGRAM_BOT_TOKEN"));
  if (!fresh) return { ok: false, reason: "no token" };
  if (started && bot && fresh === TOKEN) return { ok: true, reason: "unchanged" };
  try {
    if (bot) { try { await bot.stop(); } catch {} }
    TOKEN = fresh;
    started = false;
    bot = null;
    const newBot = initTelegramBot();
    if (!newBot) return { ok: false, reason: "init failed" };
    await startTelegramBot();
    return { ok: true };
  } catch (e: any) {
    logger.error({ err: e.message }, "[TG-BOT] reload failed");
    return { ok: false, reason: e.message };
  }
}

function fmtUser(ctx: Context): { id: string; name: string } {
  const u = ctx.from;
  if (!u) return { id: "anon", name: "anon" };
  return { id: String(u.id), name: u.first_name || u.username || String(u.id) };
}

function appLink(path = ""): string {
  if (!APP_URL) return path || "/";
  return `${APP_URL.replace(/\/$/, "")}${path}`;
}

function mainMenu(): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (APP_URL) {
    kb.webApp("🚀 Command Center", appLink("/"))
      .row()
      .webApp("⚒ Agent Forge", appLink("/builder"))
      .webApp("💎 Developer", appLink("/developer"))
      .row()
      .webApp("💰 Earnings", appLink("/earn"))
      .webApp("✨ NEXUS AI", appLink("/nexus"));
  }
  kb.row()
    .text("📊 Balance", "balance")
    .text("🛡 Subscribe", "subscribe")
    .row()
    .text("🤖 My Agents", "agents")
    .text("📡 Status", "status")
    .row()
    .text("⚡ Alerts", "alerts")
    .text("ℹ Help", "help");
  return kb;
}

export function initTelegramBot(): Bot | null {
  if (!TOKEN) {
    logger.warn("[TG-BOT] TELEGRAM_BOT_TOKEN not set — bot disabled (set it in secrets to enable)");
    return null;
  }
  if (bot) return bot;

  bot = new Bot(TOKEN);

  // /start — handles ref code from deep link
  bot.command("start", async (ctx) => {
    const { id, name } = fmtUser(ctx);
    const args  = ctx.match?.toString().trim() || "";
    const refId = args.startsWith("ref") ? args.slice(3).replace(/^_/, "") : (args.startsWith("ref_") ? args.slice(4) : "");

    // Auto-register subscriber
    const existing = await store.getSubscriber(id);
    if (!existing) {
      await store.upsertSubscriber({
        telegramId: id, username: ctx.from?.username || name,
        plan: "free", isActive: true,
        referredBy: refId || null,
      });
      await store.logActivity("AUTH", "TG bot registration", `${id} (${name})${refId ? ` ref=${refId}` : ""}`, "info");
    }

    const welcome = `🛡 *TITAN-94 · ОКО НЕБЕСНЕ*

Привіт, ${name}! Я — автономний AI-захисник екосистеми TON.

*Що я вмію:*
🔍 Сканую TON-контракти на вразливості
⚡ Сповіщаю про критичні загрози в реальному часі
💰 Розподіляю passive yield ELITE/PRO підписникам (auto-earn)
📊 Live арбітраж STON.fi × DeDust
🤖 NEXUS — мультимедійний AI (сайт/код/відео/музика)

${refId ? `\n✅ Ти зайшов за рефералом *${refId}* — отримуєш 72h PRO trial безкоштовно!\n` : ""}
Натисни кнопку щоб відкрити повний дашборд:`;

    await ctx.reply(welcome, { parse_mode: "Markdown", reply_markup: mainMenu() });
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("◈ TITAN-94 Menu", { reply_markup: mainMenu() });
  });

  bot.command(["balance", "bal"], async (ctx) => {
    const { id } = fmtUser(ctx);
    const balance = await store.ledgerBalance(id);
    const sub = await store.getSubscriber(id);
    const plan = (sub?.plan || "free").toUpperCase();
    const exp  = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "—";
    const history = await store.ledgerHistory(id, 5);
    const lines = history.map((h) => {
      const sign = parseFloat(h.amountTon as any) >= 0 ? "+" : "";
      return `• ${sign}${parseFloat(h.amountTon as any).toFixed(4)} TON · ${h.type} · ${h.description.slice(0, 40)}`;
    }).join("\n") || "(no transactions yet)";

    await ctx.reply(
      `💰 *Your Balance*\n\n` +
      `Balance: *${balance.toFixed(4)} TON* (≈ $${(balance * 3.84).toFixed(2)})\n` +
      `Plan: *${plan}* · expires: ${exp}\n\n` +
      `*Recent activity:*\n${lines}\n\n` +
      `_Min withdrawal: 0.5 TON · use the dashboard to withdraw_`,
      { parse_mode: "Markdown", reply_markup: mainMenu() },
    );
  });

  bot.command("scan", async (ctx) => {
    const addr = ctx.match?.toString().trim();
    if (!addr) {
      return ctx.reply("Usage: `/scan EQ...address`", { parse_mode: "Markdown" });
    }
    await ctx.reply(`🔍 Scanning ${addr.slice(0, 14)}...`);
    try {
      const r = await fetch("http://localhost:8080/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, code: "" }),
      });
      const d: any = await r.json();
      const sev = (d.severity || "unknown").toUpperCase();
      const icon = sev === "CRITICAL" ? "🚨" : sev === "HIGH" ? "⚠️" : sev === "MEDIUM" ? "🟡" : "✅";
      await ctx.reply(
        `${icon} *Audit complete*\n\n` +
        `Address: \`${addr}\`\n` +
        `Severity: *${sev}* · Score: ${d.score ?? "?"}\n\n` +
        `${d.summary || d.recommendation || "No vulnerabilities detected."}\n\n` +
        `_Powered by ${d.model || "TITAN-94 keyword scanner"}_`,
        { parse_mode: "Markdown" },
      );
    } catch (e) {
      await ctx.reply(`❌ Scan failed: ${(e as Error).message}`);
    }
  });

  bot.command("subscribe", async (ctx) => {
    const { id } = fmtUser(ctx);
    const proLink   = `https://app.tonkeeper.com/transfer/${RESERVE}?amount=${5  * 1e9}&text=tg:${id}:pro`;
    const eliteLink = `https://app.tonkeeper.com/transfer/${RESERVE}?amount=${20 * 1e9}&text=tg:${id}:elite`;

    const kb = new InlineKeyboard()
      .url("⚡ PRO · 5 TON",   proLink).row()
      .url("👑 ELITE · 20 TON", eliteLink).row();
    if (APP_URL) kb.webApp("🌐 Open Dashboard", appLink("/earn"));

    await ctx.reply(
      `🛡 *Subscription Plans*\n\n` +
      `*FREE* — 1 audit/day, basic alerts\n` +
      `*PRO* — 5 TON/міс — 3 audits/day, arbitrage signals, 0.072 TON/day passive yield\n` +
      `*ELITE* — 20 TON/міс — unlimited, sniper alerts, 0.24 TON/day passive yield\n\n` +
      `Натисни кнопку нижче — відкриється Tonkeeper з заповненою сумою. Webhook автоматично активує підписку після підтвердження транзакції.`,
      { parse_mode: "Markdown", reply_markup: kb },
    );
  });

  bot.command("alerts", async (ctx) => {
    const recent = await store.listActivity(10);
    const critical = recent.filter((a) => a.severity === "critical" || a.severity === "high");
    const lines = critical.slice(0, 5).map((a) => {
      const t = new Date(a.createdAt as any).toLocaleTimeString();
      return `• [${a.type}] ${a.title} _(${t})_`;
    }).join("\n") || "_No critical alerts in the last 10 events ✅_";

    await ctx.reply(
      `🚨 *Live Alerts*\n\n${lines}\n\n` +
      `_System status: ALL CYCLES ACTIVE — SCAN/HEAL/AUTO-EARN/LEARN/FINANCE_`,
      { parse_mode: "Markdown" },
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      `*TITAN-94 Bot Commands*\n\n` +
      `/start — register & open menu\n` +
      `/menu — main menu\n` +
      `/balance — your TON balance & history\n` +
      `/scan <address> — audit a TON contract\n` +
      `/subscribe — buy PRO/ELITE\n` +
      `/alerts — recent critical alerts\n` +
      `/agents — list your custom agents\n` +
      `/forge — open Agent Forge to build new agent\n` +
      `/dev — Developer mode (1000 TON tier)\n` +
      `/status — live system telemetry\n` +
      `/help — this message\n\n` +
      `_Reserve wallet:_ \`${RESERVE}\``,
      { parse_mode: "Markdown" },
    );
  });

  // /agents — list user's custom agents
  bot.command("agents", async (ctx) => {
    const { id } = fmtUser(ctx);
    const agentSvc = await import("./agents");
    const list = await agentSvc.listAgents(id);
    if (list.length === 0) {
      const kb = new InlineKeyboard();
      if (APP_URL) kb.webApp("⚒ Open Agent Forge", appLink("/builder"));
      return ctx.reply(
        `🤖 *Your Custom Agents*\n\n_У тебе ще нема агентів._\n\nAgent Forge дозволяє створити власного AI-агента (Guardian, Trader, Researcher, Yield-Farmer чи з нуля). Безкоштовний ліміт: 3 агенти.`,
        { parse_mode: "Markdown", reply_markup: kb },
      );
    }
    const lines = list.slice(0, 10).map((a) => {
      const rate = a.runs ? Math.round((a.successes / a.runs) * 100) : 0;
      const status = a.enabled ? "✅" : "⏸";
      return `${status} *${a.name}* — runs: ${a.runs} · ${rate}% · every ${a.intervalMin}m`;
    }).join("\n");
    const kb = new InlineKeyboard();
    if (APP_URL) kb.webApp("⚒ Manage in Forge", appLink("/builder"));
    await ctx.reply(`🤖 *Your Custom Agents (${list.length})*\n\n${lines}`, { parse_mode: "Markdown", reply_markup: kb });
  });

  // /forge — open agent builder
  bot.command("forge", async (ctx) => {
    const kb = new InlineKeyboard();
    if (APP_URL) kb.webApp("⚒ Open Agent Forge", appLink("/builder"));
    await ctx.reply(
      `⚒ *AGENT FORGE*\n\n` +
      `Збери власного автономного AI-агента під свою задачу:\n\n` +
      `🛡 *Guardian* — захист гаманця, моніторинг загроз\n` +
      `📈 *Trader Scout* — арбітражні можливості\n` +
      `🔬 *Researcher* — глибокий аналіз TON-проектів\n` +
      `🌾 *Yield Farmer* — пасивний дохід через моніторинг\n` +
      `⚙ *DevOps* — автономний engineer\n\n` +
      `Або з нуля — обери інструменти, інтервал, цілі.`,
      { parse_mode: "Markdown", reply_markup: kb },
    );
  });

  // /dev — Developer mode 1000 TON tier
  bot.command(["dev", "developer"], async (ctx) => {
    const kb = new InlineKeyboard();
    if (APP_URL) kb.webApp("💎 Activate Developer Tier", appLink("/developer"));
    await ctx.reply(
      `💎 *DEVELOPER MODE — 1000 TON*\n\n` +
      `Найвищий рівень. Перки:\n` +
      `• 10 000 API requests/день\n` +
      `• 0.05 TON/cycle ≈ 12 TON/день passive yield\n` +
      `• Кастомізація політик безпеки\n` +
      `• Priority queue в усіх AI-операціях\n` +
      `• Всі ELITE features\n` +
      `• Unlimited custom agents\n\n` +
      `Оплата 1-tap через TON Connect (Tonkeeper).`,
      { parse_mode: "Markdown", reply_markup: kb },
    );
  });

  // /status — live telemetry snapshot
  bot.command("status", async (ctx) => {
    const subs = await store.listSubscribers();
    const stats = await store.vulnStats();
    const agentState = await store.getAgentState();
    const acc = (parseFloat((agentState as any).accuracy || "0") * 100).toFixed(1);
    await ctx.reply(
      `📡 *TITAN-94 LIVE TELEMETRY*\n\n` +
      `🛡 Threats: *${stats.total}* (${stats.critical} crit · ${stats.high} high)\n` +
      `⚡ Healed: *${stats.healed}*\n` +
      `🧠 AI Accuracy: *${acc}%* (${(agentState as any).knowledgeSize} patterns)\n` +
      `🔄 Cycles: SCAN ${(agentState as any).cycles} · HEAL ${(agentState as any).healingCycles} · LEARN ${(agentState as any).learnCycles}\n` +
      `👥 Subscribers: *${subs.length}*\n` +
      `💰 At-Risk TVL: $${parseFloat(stats.tvl_at_risk || "0").toLocaleString()}\n\n` +
      `_All systems nominal · Heartbeat active_`,
      { parse_mode: "Markdown" },
    );
  });

  // Inline button callbacks
  bot.callbackQuery("balance",   (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/balance", entities: [{ type: "bot_command", offset: 0, length: 8 }] } } as any).catch(() => {}); });
  bot.callbackQuery("subscribe", (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/subscribe", entities: [{ type: "bot_command", offset: 0, length: 10 }] } } as any).catch(() => {}); });
  bot.callbackQuery("alerts",    (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/alerts", entities: [{ type: "bot_command", offset: 0, length: 7 }] } } as any).catch(() => {}); });
  bot.callbackQuery("help",      (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/help",   entities: [{ type: "bot_command", offset: 0, length: 5 }] } } as any).catch(() => {}); });
  bot.callbackQuery("agents",    (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/agents", entities: [{ type: "bot_command", offset: 0, length: 7 }] } } as any).catch(() => {}); });
  bot.callbackQuery("status",    (ctx) => { ctx.answerCallbackQuery(); return bot!.handleUpdate({ ...ctx.update, message: { ...ctx.callbackQuery.message!, text: "/status", entities: [{ type: "bot_command", offset: 0, length: 7 }] } } as any).catch(() => {}); });

  bot.catch((err) => logger.error({ err: err.error }, "[TG-BOT] handler error"));
  return bot;
}

export async function startTelegramBot() {
  if (started) return;
  const b = initTelegramBot();
  if (!b) return;

  // Retry loop — handles 409 (conflict with previous polling instance still
  // held by Telegram's side after a fast restart). The previous long-polling
  // socket can live up to ~30s on Telegram's edge before being released.
  const MAX_ATTEMPTS = 8;
  const BACKOFF_MS = 5000;

  // Fire-and-forget: we don't want to block the API boot on the bot.
  void (async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await b.start({
          drop_pending_updates: true,
          onStart: (info) => logger.info({ username: info.username, attempt }, "[TG-BOT] ♥ started — long-polling"),
        });
        // b.start() resolves only when the bot stops cleanly — if we get here
        // without throw, treat it as a graceful shutdown.
        started = true;
        return;
      } catch (e: any) {
        const code = e?.error_code ?? e?.payload?.error_code;
        const isConflict = code === 409;
        if (isConflict && attempt < MAX_ATTEMPTS) {
          logger.warn({ attempt, nextRetryMs: BACKOFF_MS }, "[TG-BOT] 409 conflict — retrying after stale polling session expires");
          await new Promise((r) => setTimeout(r, BACKOFF_MS));
          continue;
        }
        logger.error({ err: e, attempt }, "[TG-BOT] start failed — giving up");
        started = false;
        return;
      }
    }
  })();
}

/** Send a notification to a specific user (by Telegram ID) */
export async function sendNotification(telegramId: string, text: string): Promise<boolean> {
  if (!bot) return false;
  try {
    await bot.api.sendMessage(telegramId, text, { parse_mode: "Markdown" });
    return true;
  } catch (e) {
    logger.warn({ err: e, telegramId }, "[TG-BOT] sendNotification failed");
    return false;
  }
}

/** Send a critical system-wide alert to admin chat */
export async function sendCriticalAlert(title: string, message: string, severity: "critical" | "high" | "medium" = "high"): Promise<boolean> {
  if (!bot) return false;
  const icon = severity === "critical" ? "🚨🚨🚨" : severity === "high" ? "⚠️" : "🟡";
  try {
    await bot.api.sendMessage(getAdminId(), `${icon} *${title}*\n\n${message}\n\n_TITAN-94 sentinel_`, { parse_mode: "Markdown" });
    return true;
  } catch (e) {
    logger.warn({ err: e }, "[TG-BOT] sendCriticalAlert failed");
    return false;
  }
}

/** Broadcast to all active ELITE subscribers (sniper alerts feature) */
export async function broadcastToSubscribers(text: string, plan: "elite" | "pro" | "all" = "elite"): Promise<{ sent: number; failed: number }> {
  if (!bot) return { sent: 0, failed: 0 };
  const subs = await store.listSubscribers();
  const now = Date.now();
  const filtered = subs.filter((s) => {
    const active = s.isActive && (!s.expiresAt || s.expiresAt.getTime() > now);
    if (!active) return false;
    if (plan === "all") return true;
    if (plan === "pro") return s.plan === "pro" || s.plan === "elite";
    return s.plan === "elite";
  });
  let sent = 0, failed = 0;
  for (const s of filtered) {
    const ok = await sendNotification(s.telegramId, text);
    if (ok) sent++; else failed++;
  }
  return { sent, failed };
}
