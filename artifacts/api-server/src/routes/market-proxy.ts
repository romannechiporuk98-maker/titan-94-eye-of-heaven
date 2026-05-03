/**
 * TITAN-94 · Market Data Proxy
 * Proxies CoinGecko and TonAPI requests to bypass browser CORS restrictions.
 * Server-side calls have no CORS limitations.
 */
import { Router, type IRouter } from "express";
import https from "https";

const router: IRouter = Router();

// ── Generic HTTPS GET with caching ────────────────────────────────────────────
const CACHE: Record<string, { data: any; expiresAt: number; status: number }> = {};

function httpsGet(host: string, path: string, timeoutMs = 10000): Promise<{ data: any; status: number }> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: host,
        path,
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "TITAN-94/4.0 (market-proxy)",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            resolve({ data, status: res.statusCode ?? 200 });
          } catch {
            resolve({ data: null, status: res.statusCode ?? 500 });
          }
        });
      }
    );
    req.on("error", () => resolve({ data: null, status: 502 }));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ data: null, status: 504 }); });
    req.end();
  });
}

async function cachedGet(
  cacheKey: string,
  ttlMs: number,
  host: string,
  path: string,
): Promise<{ data: any; status: number; cached: boolean }> {
  const now = Date.now();
  if (CACHE[cacheKey] && CACHE[cacheKey].expiresAt > now) {
    return { data: CACHE[cacheKey].data, status: CACHE[cacheKey].status, cached: true };
  }
  const result = await httpsGet(host, path);
  if (result.data != null && result.status < 400) {
    CACHE[cacheKey] = { data: result.data, expiresAt: now + ttlMs, status: result.status };
  }
  return { ...result, cached: false };
}

// ── Binance → CoinGecko ID mapping ───────────────────────────────────────────
const CG_TO_BINANCE: Record<string, string> = {
  "the-open-network": "TONUSDT",
  "bitcoin":          "BTCUSDT",
  "ethereum":         "ETHUSDT",
  "binancecoin":      "BNBUSDT",
  "solana":           "SOLUSDT",
  "notcoin":          "NOTUSDT",
  "dogs-2":           "DOGSUSDT",
};

// Binance interval mapping by days
function binanceInterval(days: string): string {
  const d = parseInt(days);
  if (d <= 1)   return "1h";
  if (d <= 7)   return "4h";
  if (d <= 30)  return "1d";
  if (d <= 90)  return "1d";
  return "1w";
}

// Binance limit by days
function binanceLimit(days: string): number {
  const d = parseInt(days);
  if (d <= 1)   return 24;
  if (d <= 7)   return 42;
  if (d <= 30)  return 30;
  if (d <= 90)  return 90;
  return 52;
}

// ── Binance: OHLC candlestick data (no rate limits on public API) ─────────────
// GET /api/market/ohlc?coinId=bitcoin&days=7
router.get("/market/ohlc", async (req, res) => {
  const coinId = String(req.query.coinId || "the-open-network").replace(/[^a-z0-9-]/gi, "");
  const days   = String(req.query.days || "7").replace(/[^0-9]/g, "");
  const key    = `ohlc:${coinId}:${days}`;
  const ttl    = parseInt(days) <= 1 ? 60_000 : 300_000;

  const symbol   = CG_TO_BINANCE[coinId] || "TONUSDT";
  const interval = binanceInterval(days);
  const limit    = binanceLimit(days);
  const path     = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const { data, status, cached } = await cachedGet(key, ttl, "api.binance.com", path);
  if (!data || !Array.isArray(data)) {
    // fallback: try CoinGecko
    const cgPath = `/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    const fallback = await cachedGet(`cg-${key}`, ttl, "api.coingecko.com", cgPath);
    if (!fallback.data) { res.status(status || 429).json({ error: "upstream_error", status }); return; }
    res.set("X-Cache", "MISS-FALLBACK");
    res.json(fallback.data);
    return;
  }

  // Convert Binance klines [openTime, open, high, low, close, vol, closeTime, ...]
  // to CoinGecko OHLC format [timestamp, open, high, low, close]
  const ohlc = (data as any[]).map((k: any) => [
    parseInt(k[0]),        // openTime ms
    parseFloat(k[1]),      // open
    parseFloat(k[2]),      // high
    parseFloat(k[3]),      // low
    parseFloat(k[4]),      // close
  ]);

  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(ohlc);
});

// ── Price: derived from klines (last close) + 24h stats ──────────────────────
// Uses Binance klines (which work). Extracts price from last candle.
// GET /api/market/price?ids=bitcoin,ethereum&vs_currencies=usd
router.get("/market/price", async (req, res) => {
  const ids = String(req.query.ids || "the-open-network").replace(/[^a-z0-9-,]/gi, "").split(",").filter(Boolean);

  const results: Record<string, any> = {};

  await Promise.all(ids.map(async (coinId) => {
    const symbol = CG_TO_BINANCE[coinId];
    if (!symbol) return;
    // Use 1h interval for last 26 candles = about 24h of data for 24h change
    const key24h = `klines-24h:${coinId}`;
    const { data } = await cachedGet(key24h, 60_000, "api.binance.com", `/api/v3/klines?symbol=${symbol}&interval=1h&limit=26`);

    if (!data || !Array.isArray(data) || data.length < 2) return;

    const last    = data[data.length - 1];
    const first   = data[0];
    const price   = parseFloat(last[4]);  // close
    const open24h = parseFloat(first[1]); // open of 24h ago
    const change  = ((price - open24h) / open24h) * 100;
    const vol     = data.reduce((sum: number, k: any) => sum + parseFloat(k[7]), 0); // sum of quoteAssetVolume

    results[coinId] = {
      usd:            price,
      usd_24h_change: change,
      usd_24h_vol:    vol,
      usd_market_cap: null,
    };
  }));

  res.json(results);
});

// ── CoinGecko: global market overview ─────────────────────────────────────────
router.get("/market/global", async (_req, res) => {
  const { data, status, cached } = await cachedGet("global", 120_000, "api.coingecko.com", "/api/v3/global");
  if (!data) { res.status(status || 502).json({ error: "upstream_error" }); return; }
  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(data);
});

// ── TonAPI: wallet account info ───────────────────────────────────────────────
// GET /api/market/ton-account/:address
router.get("/market/ton-account/:address", async (req, res) => {
  const addr = encodeURIComponent(req.params.address);
  const { data, status, cached } = await cachedGet(
    `ton-acct:${addr}`, 30_000,
    "tonapi.io", `/v2/accounts/${addr}`
  );
  if (!data) { res.status(status || 502).json({ error: "upstream_error" }); return; }
  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(data);
});

// ── TonAPI: jettons (tokens) ──────────────────────────────────────────────────
router.get("/market/ton-jettons/:address", async (req, res) => {
  const addr = encodeURIComponent(req.params.address);
  const { data, status, cached } = await cachedGet(
    `ton-jet:${addr}`, 60_000,
    "tonapi.io", `/v2/accounts/${addr}/jettons?limit=50&currencies=usd`
  );
  if (!data) { res.status(status || 502).json({ error: "upstream_error" }); return; }
  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(data);
});

// ── TonAPI: NFTs ──────────────────────────────────────────────────────────────
router.get("/market/ton-nfts/:address", async (req, res) => {
  const addr = encodeURIComponent(req.params.address);
  const { data, status, cached } = await cachedGet(
    `ton-nft:${addr}`, 120_000,
    "tonapi.io", `/v2/accounts/${addr}/nfts?limit=50`
  );
  if (!data) { res.status(status || 502).json({ error: "upstream_error" }); return; }
  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(data);
});

// ── TonAPI: events (transactions) ─────────────────────────────────────────────
router.get("/market/ton-events/:address", async (req, res) => {
  const addr = encodeURIComponent(req.params.address);
  const { data, status, cached } = await cachedGet(
    `ton-ev:${addr}`, 30_000,
    "tonapi.io", `/v2/accounts/${addr}/events?limit=20`
  );
  if (!data) { res.status(status || 502).json({ error: "upstream_error" }); return; }
  res.set("X-Cache", cached ? "HIT" : "MISS");
  res.json(data);
});

export default router;
