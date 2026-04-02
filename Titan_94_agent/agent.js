"use strict";
/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              TITAN_94 — Autonomous TON AI Agent                     ║
 * ║  Powered by: Gemini AI · TON Blockchain · Telegram Bot              ║
 * ║  Mission: Bug Bounty hunting + TON ecosystem intelligence           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

const { Telegraf, Markup } = require("telegraf");
const { TonClient, WalletContractV4, Address, toNano } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

// ═══════════════════════════════════════════════════════════════════════
// CONFIG — all from environment variables
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
        reportChannelId: process.env.TELEGRAM_REPORT_CHANNEL || "",
    },
    ton: {
        endpoint: process.env.TON_ENDPOINT || "https://toncenter.com/api/v2/jsonRPC",
        apiKey: process.env.TON_API_KEY || "",
        tonapiKey: process.env.TONAPI_KEY || "",
        mnemonic: (process.env.TON_MNEMONIC || "").split(" ").filter(Boolean),
        contractAddress: process.env.TITAN_CONTRACT_ADDRESS || "",
        network: process.env.TON_NETWORK || "mainnet",
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || "",
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    },
    agent: {
        scanIntervalMs: parseInt(process.env.SCAN_INTERVAL_MS || "300000"),   // 5 min
        reportIntervalMs: parseInt(process.env.REPORT_INTERVAL_MS || "3600000"), // 1 hour
        bugBountyMode: process.env.BUG_BOUNTY_MODE !== "false",
        maxContractsPerScan: parseInt(process.env.MAX_CONTRACTS || "10"),
    },
};

// ═══════════════════════════════════════════════════════════════════════
// GEMINI CORE — AI intelligence (contract analysis + message classify)
// ═══════════════════════════════════════════════════════════════════════
class GeminiCore {
    constructor() {
        this.ready = false;
        this.genAI = null;
        this.model = null;
        this.stats = { calls: 0, errors: 0 };
    }

    init() {
        if (!CONFIG.gemini.apiKey) {
            console.warn("[Gemini] ⚠️  No GEMINI_API_KEY — using keyword fallback mode.");
            return;
        }
        try {
            this.genAI = new GoogleGenerativeAI(CONFIG.gemini.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: CONFIG.gemini.model });
            this.ready = true;
            console.log(`[Gemini] ✅ Ready — model: ${CONFIG.gemini.model}`);
        } catch (e) {
            console.error("[Gemini] Init failed:", e.message);
        }
    }

    async ask(prompt, timeoutMs = 15000) {
        if (!this.ready) return null;
        this.stats.calls++;

        return new Promise(async (resolve) => {
            const timer = setTimeout(() => {
                this.stats.errors++;
                resolve(null);
            }, timeoutMs);

            try {
                const result = await this.model.generateContent(prompt);
                clearTimeout(timer);
                resolve(result.response.text());
            } catch (e) {
                clearTimeout(timer);
                this.stats.errors++;
                console.warn("[Gemini] Request failed:", e.message);
                resolve(null);
            }
        });
    }

    async analyzeContract(code, address) {
        const prompt = `You are a TON blockchain smart contract security auditor.
Analyze the following Tact/FunC contract code for security vulnerabilities.

Contract address: ${address}
Contract source code:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Provide a structured JSON response with:
{
  "severity": "critical|high|medium|low|none",
  "vulnerabilities": [
    { "type": "string", "description": "string", "line": "optional string", "impact": "string" }
  ],
  "score": 0-100,
  "summary": "1-2 sentence summary",
  "recommendation": "brief fix recommendation"
}

Respond with JSON only. Check for: reentrancy, access control issues, integer overflow, unchecked sends, improper state management, front-running, and TON-specific issues like wrong bounce handling.`;

        const raw = await this.ask(prompt);
        if (!raw) return this.keywordContractScan(code, address);

        try {
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return { severity: "unknown", vulnerabilities: [], score: 50, summary: raw.slice(0, 200), recommendation: "" };
        }
    }

    async classifyMessage(text) {
        const categories = ["scam", "alpha", "ton", "ai", "defi", "neutral"];
        const prompt = `Classify this TON/crypto Telegram message into exactly one category: ${categories.join(" | ")}.
Also rate confidence 0.0-1.0.

Message: "${text.slice(0, 400)}"

Respond JSON only: {"category":"...","confidence":0.0,"reason":"1 sentence"}`;

        const raw = await this.ask(prompt, 8000);
        if (!raw) return this.keywordClassify(text);

        try {
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return { ...JSON.parse(cleaned), model: CONFIG.gemini.model };
        } catch {
            return this.keywordClassify(text);
        }
    }

    async generateReport(findings, period = "hourly") {
        if (!findings.length) return "No significant findings this period.";
        const prompt = `You are Titan_94, an AI agent monitoring the TON blockchain ecosystem.
Generate a concise ${period} intelligence report for Telegram based on these findings:

${JSON.stringify(findings.slice(0, 20), null, 2)}

Format for Telegram (use emojis, keep under 500 chars):
- 🎯 Key findings
- ⚠️ Threats detected
- 💡 Opportunities
- 📊 Stats line`;

        const report = await this.ask(prompt);
        return report || this.buildFallbackReport(findings, period);
    }

    keywordContractScan(code, address) {
        const lower = code.toLowerCase();
        const vulns = [];
        if (lower.includes("send(") && !lower.includes("require(")) {
            vulns.push({ type: "Unchecked Send", description: "Send without require check", impact: "Funds loss" });
        }
        if (lower.includes("self.balance") && lower.includes("send(")) {
            vulns.push({ type: "Balance Drain Risk", description: "Direct balance send", impact: "Medium" });
        }
        if (!lower.includes("require(sender()")) {
            vulns.push({ type: "Missing Auth", description: "No sender auth check found", impact: "Unauthorized access" });
        }
        const severity = vulns.length > 2 ? "high" : vulns.length > 0 ? "medium" : "none";
        return { severity, vulnerabilities: vulns, score: Math.max(0, 80 - vulns.length * 20), summary: `Keyword scan: ${vulns.length} potential issues`, recommendation: "Manual audit recommended" };
    }

    keywordClassify(text) {
        const lower = text.toLowerCase();
        const signals = {
            scam: ["scam", "rug", "hack", "drain", "phish", "fake", "fraud", "send ton", "double your"],
            alpha: ["alpha", "gem", "100x", "presale", "ido", "listing", "partnership", "launch"],
            ton: ["ton", "toncoin", "tonkeeper", "tact", "func", "blueprint", "tonapi"],
            ai: ["ai", "neural", "gpt", "llm", "agent", "claude", "gemini", "autonomous"],
            defi: ["swap", "liquidity", "yield", "farm", "stake", "dex", "tvl", "apy"],
        };
        let best = "neutral", bestScore = 0;
        for (const [cat, kws] of Object.entries(signals)) {
            const score = kws.filter(k => lower.includes(k)).length;
            if (score > bestScore) { best = cat; bestScore = score; }
        }
        return { category: best, confidence: Math.min(bestScore * 0.2, 0.9), reason: "Keyword match", model: "keyword-v2" };
    }

    buildFallbackReport(findings, period) {
        const critical = findings.filter(f => f.severity === "critical" || f.severity === "high").length;
        const total = findings.length;
        return `📊 Titan_94 ${period} Report\n⚠️ High/Critical: ${critical}\n📋 Total findings: ${total}\n🤖 Model: keyword-v2 (fallback)`;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// TON SCANNER — blockchain monitoring + contract analysis
// ═══════════════════════════════════════════════════════════════════════
class TonScanner {
    constructor(gemini) {
        this.gemini = gemini;
        this.client = null;
        this.wallet = null;
        this.scannedAddresses = new Set();
        this.stats = { scanned: 0, vulnerabilities: 0, errors: 0 };
    }

    async init() {
        try {
            this.client = new TonClient({
                endpoint: CONFIG.ton.endpoint,
                apiKey: CONFIG.ton.apiKey || undefined,
            });

            if (CONFIG.ton.mnemonic.length >= 24) {
                const keyPair = await mnemonicToPrivateKey(CONFIG.ton.mnemonic);
                this.wallet = this.client.open(
                    WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
                );
                const addr = this.wallet.address.toString({ urlSafe: true, bounceable: false });
                const balance = await this.wallet.getBalance().catch(() => 0n);
                console.log(`[TON] ✅ Wallet: ${addr}`);
                console.log(`[TON] 💰 Balance: ${(Number(balance) / 1e9).toFixed(4)} TON`);
            } else {
                console.warn("[TON] No mnemonic — read-only mode.");
            }
        } catch (e) {
            console.error("[TON] Init error:", e.message);
        }
    }

    async fetchContractCode(address) {
        if (!CONFIG.ton.tonapiKey && !CONFIG.ton.apiKey) return null;

        const baseUrl = CONFIG.ton.network === "testnet"
            ? "https://testnet.tonapi.io"
            : "https://tonapi.io";

        return this.httpGet(`${baseUrl}/v2/accounts/${encodeURIComponent(address)}/source`);
    }

    async fetchAccountInfo(address) {
        const baseUrl = CONFIG.ton.network === "testnet"
            ? "https://testnet.tonapi.io"
            : "https://tonapi.io";

        const headers = {};
        if (CONFIG.ton.tonapiKey) headers["Authorization"] = `Bearer ${CONFIG.ton.tonapiKey}`;

        return this.httpGet(`${baseUrl}/v2/accounts/${encodeURIComponent(address)}`, headers);
    }

    async fetchRecentContracts() {
        const baseUrl = CONFIG.ton.network === "testnet"
            ? "https://testnet.tonapi.io"
            : "https://tonapi.io";

        const headers = {};
        if (CONFIG.ton.tonapiKey) headers["Authorization"] = `Bearer ${CONFIG.ton.tonapiKey}`;

        try {
            const data = await this.httpGet(`${baseUrl}/v2/events?account_id=-1&limit=50`, headers);
            if (!data?.events) return [];

            return data.events
                .filter(e => e.actions?.some(a => a.type === "ContractDeploy"))
                .map(e => {
                    const deploy = e.actions?.find(a => a.type === "ContractDeploy");
                    return deploy?.ContractDeploy?.address;
                })
                .filter(Boolean)
                .slice(0, CONFIG.agent.maxContractsPerScan);
        } catch (e) {
            console.warn("[TON] fetchRecentContracts error:", e.message);
            return this.getDemoAddresses();
        }
    }

    getDemoAddresses() {
        return [
            "EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX",
            "EQCgYmwi8uwrG7I6bI3Cdv0ct-bAB1jZ0DQ7C3dX3MYn6VTj",
        ];
    }

    async scanAddress(address) {
        if (this.scannedAddresses.has(address)) return null;
        this.scannedAddresses.add(address);
        this.stats.scanned++;

        try {
            const info = await this.fetchAccountInfo(address);
            const codeSource = await this.fetchContractCode(address);

            const codeToAnalyze = codeSource?.code || info?.code || `// Contract at ${address}\n// No source available — analyzing bytecode structure`;

            const analysis = await this.gemini.analyzeContract(codeToAnalyze, address);

            if (["critical", "high", "medium"].includes(analysis.severity)) {
                this.stats.vulnerabilities++;
            }

            return {
                address,
                timestamp: new Date().toISOString(),
                balance: info?.balance ? (Number(info.balance) / 1e9).toFixed(4) : "?",
                status: info?.status || "unknown",
                ...analysis,
            };
        } catch (e) {
            this.stats.errors++;
            console.warn(`[TON] Scan error ${address}:`, e.message);
            return null;
        }
    }

    async runBountyRound() {
        console.log("[BugBounty] 🔍 Starting scan round...");
        const addresses = await this.fetchRecentContracts();
        const results = [];

        for (const addr of addresses) {
            const result = await this.scanAddress(addr);
            if (result) results.push(result);
            await sleep(1000);
        }

        const found = results.filter(r => ["critical", "high"].includes(r.severity));
        console.log(`[BugBounty] Round complete: ${results.length} scanned, ${found.length} high/critical`);
        return results;
    }

    httpGet(url, headers = {}) {
        return new Promise((resolve, reject) => {
            const proto = url.startsWith("https") ? https : http;
            const req = proto.get(url, { headers: { "Content-Type": "application/json", ...headers } }, res => {
                let data = "";
                res.on("data", c => (data += c));
                res.on("end", () => {
                    try { resolve(JSON.parse(data)); }
                    catch { resolve(null); }
                });
            });
            req.on("error", reject);
            req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BUG BOUNTY HUNTER — tracks and formats findings
// ═══════════════════════════════════════════════════════════════════════
class BugBountyHunter {
    constructor() {
        this.findings = [];
        this.submitted = new Set();
        this.stats = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    }

    addFinding(scanResult) {
        if (!scanResult || this.submitted.has(scanResult.address)) return null;

        const finding = {
            id: crypto.randomBytes(4).toString("hex"),
            ...scanResult,
            reportedAt: new Date().toISOString(),
        };

        this.findings.push(finding);
        this.submitted.add(scanResult.address);
        this.stats.total++;
        if (scanResult.severity) this.stats[scanResult.severity] = (this.stats[scanResult.severity] || 0) + 1;

        return finding;
    }

    formatAlert(finding) {
        const icons = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢", none: "✅", unknown: "⚪" };
        const icon = icons[finding.severity] || "⚪";
        const vulnList = (finding.vulnerabilities || [])
            .slice(0, 3)
            .map(v => `  • <b>${v.type}</b>: ${v.description}`)
            .join("\n") || "  No specific vulnerabilities found.";

        return `${icon} <b>TITAN_94 Security Alert</b>

📍 Contract: <code>${finding.address}</code>
⚡ Severity: <b>${(finding.severity || "unknown").toUpperCase()}</b>
💰 Balance: ${finding.balance} TON
📊 Security Score: ${finding.score ?? "?"}/100

🔍 <b>Findings:</b>
${vulnList}

📝 ${finding.summary || "Analysis complete"}

🔗 <a href="https://tonviewer.com/${finding.address}">View on TONviewer</a>
<i>ID: ${finding.id} | ${new Date(finding.reportedAt).toUTCString()}</i>`;
    }

    formatStatusReport() {
        return `📊 <b>Bug Bounty Stats</b>

🔴 Critical: ${this.stats.critical || 0}
🟠 High: ${this.stats.high || 0}
🟡 Medium: ${this.stats.medium || 0}
🟢 Low: ${this.stats.low || 0}
📋 Total: ${this.stats.total}

Last ${Math.min(this.findings.length, 5)} findings:
${this.findings.slice(-5).map(f => `  ${f.id}: ${f.address.slice(0, 12)}... [${f.severity}]`).join("\n") || "  None yet"}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// DEDUP ENGINE — prevents double-processing messages
// ═══════════════════════════════════════════════════════════════════════
class DedupEngine {
    constructor(ttlMs = 3600000) {
        this.seen = new Map();
        this.ttlMs = ttlMs;
    }

    isNew(key, text) {
        this.gc();
        const hash = crypto.createHash("sha256")
            .update(`${key}::${text.trim().toLowerCase()}`)
            .digest("hex");
        if (this.seen.has(hash)) return false;
        this.seen.set(hash, Date.now());
        return true;
    }

    gc() {
        const now = Date.now();
        for (const [h, ts] of this.seen) {
            if (now - ts > this.ttlMs) this.seen.delete(h);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// TELEGRAM BOT — command interface + alert broadcaster
// ═══════════════════════════════════════════════════════════════════════
class TelegramAgent {
    constructor(scanner, bountyHunter, gemini) {
        this.scanner = scanner;
        this.bounty = bountyHunter;
        this.gemini = gemini;
        this.bot = null;
        this.ready = false;
        this.messageQueue = [];
    }

    init() {
        if (!CONFIG.telegram.botToken) {
            console.warn("[Telegram] ⚠️  No TELEGRAM_BOT_TOKEN — bot disabled.");
            return;
        }

        try {
            this.bot = new Telegraf(CONFIG.telegram.botToken);
            this.registerCommands();
            this.bot.catch((err) => console.error("[Telegram] Bot error:", err.message));
            this.bot.launch({ dropPendingUpdates: true });
            this.ready = true;
            console.log("[Telegram] ✅ Bot launched and listening.");
        } catch (e) {
            console.error("[Telegram] Launch failed:", e.message);
        }
    }

    registerCommands() {
        const bot = this.bot;

        bot.start(ctx => ctx.replyWithHTML(
            `🤖 <b>Titan_94 Agent</b> — TON AI Security Bot

I autonomously scan the TON blockchain for vulnerabilities and classify ecosystem activity.

<b>Commands:</b>
/scan &lt;address&gt; — Scan a contract for vulnerabilities
/status — Agent status & stats
/report — Latest security report
/bounty — Bug bounty findings summary
/help — Show this message

Powered by Gemini AI 🔮`
        ));

        bot.help(ctx => ctx.replyWithHTML(
            `<b>Titan_94 Commands:</b>
/scan &lt;address&gt; — Deep scan a TON contract
/status — View agent stats and current model
/report — Generate an AI intelligence report
/bounty — Bug bounty findings summary
/ping — Check if agent is alive`
        ));

        bot.command("ping", ctx => ctx.reply("🟢 Online — Titan_94 is running."));

        bot.command("status", async ctx => {
            const netInfo = `Network: ${CONFIG.ton.network.toUpperCase()}`;
            const aiInfo = this.gemini.ready
                ? `🔮 Gemini ${CONFIG.gemini.model}`
                : "⚠️ Keyword fallback";
            ctx.replyWithHTML(
                `📊 <b>Titan_94 Status</b>

🟢 Agent: Running
${aiInfo}
🔗 ${netInfo}
📋 Scanned: ${this.scanner.stats.scanned}
🐛 Vulnerabilities found: ${this.scanner.stats.vulnerabilities}
❌ Scan errors: ${this.scanner.stats.errors}
🤖 Gemini calls: ${this.gemini.stats.calls} (${this.gemini.stats.errors} errors)
📦 Bug bounty findings: ${this.bounty.stats.total}

⏰ ${new Date().toUTCString()}`
            );
        });

        bot.command("scan", async ctx => {
            const args = ctx.message.text.split(/\s+/).slice(1);
            const address = args[0];

            if (!address) {
                return ctx.reply("Usage: /scan <TON_address>\nExample: /scan EQAFHodW...");
            }

            await ctx.reply(`🔍 Scanning ${address.slice(0, 16)}...`);

            try {
                const result = await this.scanner.scanAddress(address);
                if (!result) return ctx.reply("⚠️ Already scanned or no data available.");

                const finding = this.bounty.addFinding(result);
                if (finding) {
                    await ctx.replyWithHTML(this.bounty.formatAlert(finding), { disable_web_page_preview: true });
                } else {
                    await ctx.reply("Address already in database.");
                }
            } catch (e) {
                ctx.reply(`❌ Scan failed: ${e.message}`);
            }
        });

        bot.command("report", async ctx => {
            await ctx.reply("📝 Generating AI report...");
            try {
                const recent = this.bounty.findings.slice(-20);
                const report = await this.gemini.generateReport(recent, "on-demand");
                await ctx.replyWithHTML(`📊 <b>Titan_94 Intelligence Report</b>\n\n${report}`);
            } catch (e) {
                ctx.reply("❌ Report generation failed.");
            }
        });

        bot.command("bounty", ctx => ctx.replyWithHTML(this.bounty.formatStatusReport()));

        bot.on("text", async ctx => {
            if (ctx.message.text.startsWith("/")) return;
            const text = ctx.message.text;
            const senderId = String(ctx.from?.id || "anon");

            try {
                const classification = await this.gemini.classifyMessage(text);
                const icons = { scam: "⚠️ SCAM", alpha: "💎 ALPHA", ton: "💎 TON", ai: "🤖 AI", defi: "💱 DeFi", neutral: "📄" };
                const label = icons[classification.category] || classification.category.toUpperCase();
                await ctx.reply(`${label} [${(classification.confidence * 100).toFixed(0)}%] — ${classification.reason || ""}`);
            } catch {
                // Silently ignore classification errors
            }
        });
    }

    async broadcast(htmlMessage) {
        if (!this.ready) return;
        const targets = [CONFIG.telegram.adminChatId, CONFIG.telegram.reportChannelId].filter(Boolean);

        for (const chatId of targets) {
            try {
                await this.bot.telegram.sendMessage(chatId, htmlMessage, {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                });
            } catch (e) {
                console.warn(`[Telegram] Broadcast to ${chatId} failed:`, e.message);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// AUTONOMOUS LOOP — the heartbeat of Titan_94
// ═══════════════════════════════════════════════════════════════════════
class AutonomousLoop {
    constructor(scanner, bounty, tg, gemini) {
        this.scanner = scanner;
        this.bounty = bounty;
        this.tg = tg;
        this.gemini = gemini;
        this.running = false;
        this.scanTimer = null;
        this.reportTimer = null;
        this.hourlyFindings = [];
    }

    start() {
        this.running = true;
        console.log(`[Loop] 🔄 Autonomous loop started.`);
        console.log(`[Loop] Scan interval: ${CONFIG.agent.scanIntervalMs / 60000}m | Report interval: ${CONFIG.agent.reportIntervalMs / 60000}m`);

        // Run an immediate first scan
        this.runScanCycle().catch(e => console.error("[Loop] First scan error:", e.message));

        // Schedule recurring scans
        this.scanTimer = setInterval(() => {
            this.runScanCycle().catch(e => console.error("[Loop] Scan error:", e.message));
        }, CONFIG.agent.scanIntervalMs);

        // Schedule recurring reports
        this.reportTimer = setInterval(() => {
            this.runReportCycle().catch(e => console.error("[Loop] Report error:", e.message));
        }, CONFIG.agent.reportIntervalMs);
    }

    async runScanCycle() {
        if (!CONFIG.agent.bugBountyMode) return;

        try {
            const results = await this.scanner.runBountyRound();

            for (const result of results) {
                const finding = this.bounty.addFinding(result);
                if (!finding) continue;

                this.hourlyFindings.push(finding);

                // Alert immediately on critical/high
                if (["critical", "high"].includes(finding.severity)) {
                    const alertMsg = this.bounty.formatAlert(finding);
                    await this.tg.broadcast(alertMsg);
                    console.log(`[Alert] 🚨 ${finding.severity.toUpperCase()} vulnerability at ${finding.address}`);
                }
            }
        } catch (e) {
            console.error("[Loop] Scan cycle error:", e.message);
        }
    }

    async runReportCycle() {
        if (!this.hourlyFindings.length && this.bounty.findings.length === 0) return;

        try {
            const toReport = this.hourlyFindings.splice(0);
            const report = await this.gemini.generateReport(toReport.length ? toReport : this.bounty.findings.slice(-10), "hourly");
            const full = `📊 <b>Titan_94 Hourly Report</b>\n\n${report}\n\n🕐 ${new Date().toUTCString()}`;
            await this.tg.broadcast(full);
            console.log("[Loop] 📤 Hourly report sent.");
        } catch (e) {
            console.error("[Loop] Report cycle error:", e.message);
        }
    }

    stop() {
        this.running = false;
        if (this.scanTimer) clearInterval(this.scanTimer);
        if (this.reportTimer) clearInterval(this.reportTimer);
        console.log("[Loop] Stopped.");
    }
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH CHECK SERVER — for uptime monitoring
// ═══════════════════════════════════════════════════════════════════════
function startHealthServer(agent) {
    const port = parseInt(process.env.PORT || "3000");
    http.createServer((req, res) => {
        if (req.url === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                status: "ok",
                agent: "Titan_94",
                uptime: process.uptime(),
                gemini: agent.gemini.ready,
                telegram: agent.tg.ready,
                scanned: agent.scanner.stats.scanned,
                vulnerabilities: agent.scanner.stats.vulnerabilities,
                bountyFindings: agent.bounty.stats.total,
                timestamp: new Date().toISOString(),
            }));
        } else {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Titan_94 Agent — OK");
        }
    }).listen(port, "0.0.0.0", () => {
        console.log(`[Health] ✅ Server listening on :${port}/health`);
    });
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN AGENT — orchestrates everything
// ═══════════════════════════════════════════════════════════════════════
class Titan94Agent {
    constructor() {
        this.gemini = new GeminiCore();
        this.scanner = new TonScanner(this.gemini);
        this.bounty = new BugBountyHunter();
        this.tg = new TelegramAgent(this.scanner, this.bounty, this.gemini);
        this.loop = new AutonomousLoop(this.scanner, this.bounty, this.tg, this.gemini);
    }

    async start() {
        console.log("╔══════════════════════════════════════════╗");
        console.log("║       TITAN_94 — Autonomous TON Agent    ║");
        console.log("║    Gemini AI · TON · Telegram · BugBounty ║");
        console.log("╚══════════════════════════════════════════╝");
        console.log(`[Boot] 🚀 Starting at ${new Date().toISOString()}`);
        console.log(`[Boot] Network: ${CONFIG.ton.network.toUpperCase()}`);

        this.gemini.init();
        await this.scanner.init();
        this.tg.init();

        startHealthServer(this);

        await this.tg.broadcast(
            `🚀 <b>Titan_94 Agent Started</b>\n\n` +
            `🔮 AI: ${this.gemini.ready ? `Gemini ${CONFIG.gemini.model}` : "Keyword fallback"}\n` +
            `🔗 Network: ${CONFIG.ton.network.toUpperCase()}\n` +
            `🐛 Bug Bounty: ${CONFIG.agent.bugBountyMode ? "✅ Active" : "❌ Disabled"}\n` +
            `⏰ ${new Date().toUTCString()}`
        );

        this.loop.start();

        // Graceful shutdown
        const shutdown = async (sig) => {
            console.log(`\n[Boot] Received ${sig} — shutting down gracefully...`);
            this.loop.stop();
            if (this.tg.bot) {
                await this.tg.broadcast("⛔ Titan_94 Agent stopping...").catch(() => {});
                this.tg.bot.stop(sig);
            }
            process.exit(0);
        };
        process.once("SIGINT", () => shutdown("SIGINT"));
        process.once("SIGTERM", () => shutdown("SIGTERM"));

        console.log("[Boot] ✅ All systems online. Running autonomously...\n");
    }
}

// ═══════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════
const agent = new Titan94Agent();
agent.start().catch(err => {
    console.error("❌ Fatal agent error:", err);
    process.exit(1);
});
