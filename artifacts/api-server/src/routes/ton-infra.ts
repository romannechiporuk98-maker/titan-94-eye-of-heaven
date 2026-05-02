/**
 * TON Infrastructure Status Monitor
 * Checks live availability of TON ecosystem services.
 * Results are cached for 60s to avoid hammering external services.
 */
import { Router, type IRouter } from "express";
import https from "https";
import http from "http";

const router: IRouter = Router();

// ── Resource definitions ──────────────────────────────────────────────────

export const TON_STATUS_SERVICES = [
  {
    id: "tonstat",
    label: "TON Status",
    url: "https://tonstat.us/",
    desc: "HTTP and ADNL server availability and performance",
    category: "status",
  },
  {
    id: "toncenter_status",
    label: "TonCenter Status",
    url: "https://status.toncenter.com/",
    desc: "Low-level metrics: latencies, rates, loads",
    category: "status",
  },
  {
    id: "validators_official",
    label: "Validators Official",
    url: "https://validators.ton.org/",
    desc: "Official validation dashboard",
    category: "validators",
  },
  {
    id: "tonscan_validation",
    label: "TONScan Validation",
    url: "https://tonscan.com/validation",
    desc: "Validation dashboard with pretty UI",
    category: "validators",
  },
  {
    id: "toncenter_api",
    label: "TonCenter API",
    url: "https://toncenter.com/api/v2/getMasterchainInfo",
    desc: "Main public TON API endpoint",
    category: "api",
  },
  {
    id: "tonviewer",
    label: "TONViewer Explorer",
    url: "https://tonviewer.com/",
    desc: "Primary TON blockchain explorer",
    category: "explorer",
  },
  {
    id: "tonscan",
    label: "TONScan Explorer",
    url: "https://tonscan.com/",
    desc: "Alternative TON blockchain explorer",
    category: "explorer",
  },
  {
    id: "tonapi",
    label: "TONAPI",
    url: "https://tonapi.io/v2/blockchain/masterchain-head",
    desc: "TONAPI.io blockchain data endpoint",
    category: "api",
  },
];

export const TON_ECOSYSTEM_LINKS = {
  docs: [
    { label: "Start Here", url: "https://docs.ton.org/start-here", desc: "First steps with TON" },
    { label: "First Smart Contract", url: "https://docs.ton.org/first-smart-contract", desc: "Your first TON smart contract" },
    { label: "Coming from Ethereum", url: "https://docs.ton.org/from-ethereum", desc: "TON vs Ethereum guide" },
  ],
  ai: [
    { label: "Agentic MCP Server", url: "https://docs.ton.org/ecosystem/ai/mcp", desc: "AI agent MCP integration" },
    { label: "Agentic Wallets", url: "https://docs.ton.org/ecosystem/ai/wallets", desc: "AI-controlled wallets" },
  ],
  wallets: [
    { label: "Tonkeeper", url: "https://docs.ton.org/ecosystem/wallet-apps/tonkeeper", desc: "Primary TON wallet" },
    { label: "Web Wallets", url: "https://docs.ton.org/ecosystem/wallet-apps/web", desc: "Browser-based wallets" },
    { label: "Deep Links", url: "https://docs.ton.org/ecosystem/wallet-apps/deep-links", desc: "TON deep link format" },
    { label: "Addresses Workflow", url: "https://docs.ton.org/ecosystem/wallet-apps/addresses-workflow", desc: "Address formats & conversion" },
  ],
  explorers: [
    { label: "Explorers Overview", url: "https://docs.ton.org/ecosystem/explorers/overview", desc: "All TON block explorers" },
    { label: "Tonviewer Docs", url: "https://docs.ton.org/ecosystem/explorers/tonviewer", desc: "Tonviewer integration guide" },
  ],
  apis: [
    { label: "SDKs", url: "https://docs.ton.org/ecosystem/sdks", desc: "Official TON SDKs" },
    { label: "API Overview", url: "https://docs.ton.org/ecosystem/api/overview", desc: "Available API options" },
    { label: "TonCenter API", url: "https://docs.ton.org/ecosystem/api/toncenter", desc: "TonCenter v2/v3 API" },
    { label: "Price API", url: "https://docs.ton.org/ecosystem/api/price", desc: "TON price data API" },
  ],
  infrastructure: [
    { label: "Sub-second Finality", url: "https://docs.ton.org/ecosystem/subsecond", desc: "TON's instant finality" },
    { label: "Network Status", url: "https://docs.ton.org/ecosystem/status", desc: "Official status resources" },
    { label: "Analytics", url: "https://docs.ton.org/ecosystem/analytics", desc: "On-chain analytics tools" },
    { label: "Bridges", url: "https://docs.ton.org/ecosystem/bridges", desc: "TON cross-chain bridges" },
  ],
  oracles: [
    { label: "Oracles Overview", url: "https://docs.ton.org/ecosystem/oracles/overview", desc: "Price oracles on TON" },
    { label: "Pyth Oracle", url: "https://docs.ton.org/ecosystem/oracles/pyth", desc: "Pyth price feed integration" },
    { label: "RedStone Oracle", url: "https://docs.ton.org/ecosystem/oracles/redstone", desc: "RedStone data feeds" },
  ],
  tonConnect: [
    { label: "TON Connect Overview", url: "https://docs.ton.org/ecosystem/ton-connect/overview", desc: "Universal wallet connection" },
    { label: "dApp Integration", url: "https://docs.ton.org/ecosystem/ton-connect/dapp", desc: "Connect wallet to dApp" },
    { label: "Wallet Integration", url: "https://docs.ton.org/ecosystem/ton-connect/wallet", desc: "Add TON Connect to wallet" },
    { label: "Manifest", url: "https://docs.ton.org/ecosystem/ton-connect/manifest", desc: "App manifest format" },
  ],
  appKit: [
    { label: "AppKit Overview", url: "https://docs.ton.org/ecosystem/appkit/overview", desc: "High-level TON SDK" },
    { label: "Toncoin", url: "https://docs.ton.org/ecosystem/appkit/toncoin", desc: "Send/receive TON" },
    { label: "Jettons", url: "https://docs.ton.org/ecosystem/appkit/jettons", desc: "Fungible token standard" },
    { label: "NFTs", url: "https://docs.ton.org/ecosystem/appkit/nfts", desc: "Non-fungible tokens" },
    { label: "Stake", url: "https://docs.ton.org/ecosystem/appkit/stake", desc: "Staking integration" },
  ],
  tma: [
    { label: "TMA Overview", url: "https://docs.ton.org/ecosystem/tma/overview", desc: "Telegram Mini Apps" },
    { label: "Create Mini App", url: "https://docs.ton.org/ecosystem/tma/create-mini-app", desc: "Build your first TMA" },
  ],
  tonPay: [
    { label: "TON Pay Overview", url: "https://docs.ton.org/ecosystem/ton-pay/overview", desc: "Payment processing on TON" },
    { label: "Quick Start", url: "https://docs.ton.org/ecosystem/ton-pay/quick-start", desc: "Accept TON payments fast" },
    { label: "API Reference", url: "https://docs.ton.org/ecosystem/ton-pay/api-reference", desc: "TON Pay REST API" },
    { label: "Webhooks", url: "https://docs.ton.org/ecosystem/ton-pay/webhooks", desc: "Payment event webhooks" },
    { label: "On-ramp", url: "https://docs.ton.org/ecosystem/ton-pay/on-ramp", desc: "Fiat to TON conversion" },
  ],
  telegramChannels: [
    { label: "@tonstatus", url: "https://t.me/tonstatus", desc: "Mainnet validator alerts" },
    { label: "@testnetstatus", url: "https://t.me/testnetstatus", desc: "Testnet validator alerts" },
    { label: "@validators", url: "https://t.me/validators", desc: "Validator owner tracking bot" },
  ],
};

// ── Simple HTTP ping ──────────────────────────────────────────────────────

function pingUrl(url: string, timeoutMs = 6000): Promise<{ ok: boolean; statusCode: number | null; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      { method: "HEAD", hostname: parsed.hostname, path: parsed.pathname + parsed.search, port: parsed.port || (parsed.protocol === "https:" ? 443 : 80), headers: { "User-Agent": "TITAN-94/4.0 (+https://t.me/TITAN94_BOT)" } },
      (res) => {
        res.resume();
        const latencyMs = Date.now() - start;
        const ok = (res.statusCode ?? 0) < 400;
        resolve({ ok, statusCode: res.statusCode ?? null, latencyMs });
      }
    );
    req.on("error", () => resolve({ ok: false, statusCode: null, latencyMs: Date.now() - start }));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ ok: false, statusCode: null, latencyMs: timeoutMs }); });
    req.end();
  });
}

// ── Cache layer (60s TTL) ─────────────────────────────────────────────────

interface CachedResult {
  data: any;
  expiresAt: number;
}
let cache: CachedResult | null = null;

async function getInfraStatus() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const results = await Promise.all(
    TON_STATUS_SERVICES.map(async (svc) => {
      const ping = await pingUrl(svc.url, 5000);
      return {
        id: svc.id,
        label: svc.label,
        url: svc.url,
        desc: svc.desc,
        category: svc.category,
        online: ping.ok,
        statusCode: ping.statusCode,
        latencyMs: ping.latencyMs,
        checkedAt: new Date().toISOString(),
      };
    })
  );

  const online = results.filter((r) => r.online).length;
  const total = results.length;
  const overallStatus = online === total ? "operational" : online >= total * 0.7 ? "degraded" : "outage";

  const data = {
    overallStatus,
    onlineCount: online,
    totalCount: total,
    services: results,
    checkedAt: new Date().toISOString(),
    ecosystemLinks: TON_ECOSYSTEM_LINKS,
  };

  cache = { data, expiresAt: Date.now() + 60_000 };
  return data;
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get("/ton/infra-status", async (_req, res) => {
  try {
    const status = await getInfraStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to check TON infrastructure", detail: String(err) });
  }
});

router.get("/ton/ecosystem-links", (_req, res) => {
  res.json({ links: TON_ECOSYSTEM_LINKS, updatedAt: new Date().toISOString() });
});

export default router;
