/**
 * TITAN-94 Binance Service — REST API integration.
 *
 * Provides:
 *  - fetchPrices()  — публічні ціни (без підпису)
 *  - fetchBalance() — баланс спот-акаунту (HMAC-підписаний запит)
 *  - ping()         — перевірка ключа
 *  - placeOrder()   — тестовий/реальний ордер (HMAC)
 *
 * Auth: BINANCE_API_KEY (header) + HMAC-SHA256(BINANCE_API_SECRET, queryString) → signature param.
 * All private requests go to /api/v3/* with timestamp + signature.
 */
import https from "https";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { getSync } from "./secrets";

const BASE = "api.binance.com";

// ─── HTTP helpers ──────────────────────────────────────────────────────────

function httpsGet<T = any>(path: string, headers: Record<string, string> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const opts = { hostname: BASE, path, method: "GET", headers: { "User-Agent": "TITAN-94/1.0", ...headers } };
    const req = https.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(new Error("Binance request timeout")); });
    req.end();
  });
}

function httpsPost<T = any>(path: string, body: string, headers: Record<string, string> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE, path, method: "POST",
      headers: { "User-Agent": "TITAN-94/1.0", "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body), ...headers },
    };
    const req = https.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(new Error("Binance request timeout")); });
    req.write(body);
    req.end();
  });
}

// ─── HMAC signature (required for all private endpoints) ──────────────────

function sign(secret: string, queryString: string): string {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

function signedQs(params: Record<string, string | number>, secret: string): string {
  const ts = Date.now();
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), timestamp: String(ts) }).toString();
  return `${qs}&signature=${sign(secret, qs)}`;
}

// ─── Credentials ──────────────────────────────────────────────────────────

export function hasKeys(): boolean {
  return !!(getSync("BINANCE_API_KEY") && getSync("BINANCE_API_SECRET"));
}

function apiKey(): string { return getSync("BINANCE_API_KEY"); }
function apiSecret(): string { return getSync("BINANCE_API_SECRET"); }
function authHeaders(): Record<string, string> { return { "X-MBX-APIKEY": apiKey() }; }

// ─── Public API (no auth) ─────────────────────────────────────────────────

export interface SymbolPrice { symbol: string; price: string }

// CoinGecko IDs mapped to Binance-style symbols (fallback when Binance geo-blocked)
const COINGECKO_IDS: Record<string, string> = {
  TONUSDT:  "the-open-network",
  BTCUSDT:  "bitcoin",
  ETHUSDT:  "ethereum",
  BNBUSDT:  "binancecoin",
  SOLUSDT:  "solana",
  DOGEUSDT: "dogecoin",
};

async function fetchPricesFromCoinGecko(symbols: string[]): Promise<Record<string, number>> {
  const ids = symbols.map(s => COINGECKO_IDS[s]).filter(Boolean);
  if (!ids.length) return {};
  try {
    const qs = `ids=${ids.join(",")}&vs_currencies=usd`;
    const data = await new Promise<any>((resolve, reject) => {
      const opts = { hostname: "api.coingecko.com", path: `/api/v3/simple/price?${qs}`, method: "GET",
        headers: { "User-Agent": "TITAN-94/1.0", "Accept": "application/json" } };
      const req = https.request(opts, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch(e){ reject(e); } });
      });
      req.on("error", reject);
      req.setTimeout(8000, () => req.destroy(new Error("CoinGecko timeout")));
      req.end();
    });
    const out: Record<string, number> = {};
    for (const sym of symbols) {
      const id = COINGECKO_IDS[sym];
      if (id && data[id]?.usd) out[sym] = data[id].usd;
    }
    return out;
  } catch (e: any) {
    logger.warn({ err: e.message }, "[BINANCE] CoinGecko fallback failed");
    return {};
  }
}

export interface FetchPricesResult {
  prices: Record<string, number>;
  source: "binance" | "coingecko" | "none";
  geoBlocked?: boolean;
}

export async function fetchPricesWithMeta(symbols: string[] = ["TONUSDT", "BTCUSDT", "ETHUSDT", "BNBUSDT"]): Promise<FetchPricesResult> {
  try {
    const qs = `symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const data = await httpsGet<any>(`/api/v3/ticker/price?${qs}`);
    // Binance returns { code: 0, msg: "Service unavailable..." } when geo-blocked
    if (data?.code === 0 && data?.msg?.includes("restricted location")) {
      logger.warn("[BINANCE] Geo-blocked — falling back to CoinGecko");
      const prices = await fetchPricesFromCoinGecko(symbols);
      return { prices, source: Object.keys(prices).length ? "coingecko" : "none", geoBlocked: true };
    }
    const out: Record<string, number> = {};
    for (const row of Array.isArray(data) ? data : []) {
      out[row.symbol] = parseFloat(row.price) || 0;
    }
    return { prices: out, source: "binance" };
  } catch (e: any) {
    logger.warn({ err: e.message }, "[BINANCE] fetchPrices failed — trying CoinGecko");
    const prices = await fetchPricesFromCoinGecko(symbols);
    return { prices, source: Object.keys(prices).length ? "coingecko" : "none" };
  }
}

export async function fetchPrices(symbols: string[] = ["TONUSDT", "BTCUSDT", "ETHUSDT", "BNBUSDT"]): Promise<Record<string, number>> {
  const { prices } = await fetchPricesWithMeta(symbols);
  return prices;
}

export interface Ticker24 {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export async function fetchTicker24(symbol: string): Promise<Ticker24 | null> {
  try {
    return await httpsGet<Ticker24>(`/api/v3/ticker/24hr?symbol=${symbol}`);
  } catch (e: any) {
    logger.warn({ err: e.message }, "[BINANCE] fetchTicker24 failed");
    return null;
  }
}

// ─── Server time / ping ──────────────────────────────────────────────────

export async function ping(): Promise<{ ok: boolean; serverTime?: number; latencyMs?: number; error?: string }> {
  if (!apiKey()) return { ok: false, error: "BINANCE_API_KEY not set" };
  const t0 = Date.now();
  try {
    // ping (just checks connectivity)
    await httpsGet("/api/v3/ping");
    // also verify key via account permissions
    const qs = signedQs({}, apiSecret());
    const acc = await httpsGet<any>(`/api/v3/account?${qs}`, authHeaders());
    if (acc.code && acc.code < 0) throw new Error(acc.msg || `Binance error ${acc.code}`);
    return { ok: true, latencyMs: Date.now() - t0, serverTime: Date.now() };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Account balance (private) ────────────────────────────────────────────

export interface AssetBalance { asset: string; free: string; locked: string; total: number }

export async function fetchBalance(minUsdt = 0.01): Promise<{ ok: boolean; balances?: AssetBalance[]; error?: string }> {
  if (!hasKeys()) return { ok: false, error: "Binance API keys not configured" };
  try {
    const qs = signedQs({}, apiSecret());
    const data = await httpsGet<any>(`/api/v3/account?${qs}`, authHeaders());
    if (data.code && data.code < 0) throw new Error(data.msg || `Binance error ${data.code}`);

    // Fetch current prices to calculate USDT values
    const prices = await fetchPrices();

    const balances: AssetBalance[] = (data.balances || [])
      .map((b: any) => {
        const free = parseFloat(b.free) || 0;
        const locked = parseFloat(b.locked) || 0;
        const total = free + locked;
        // Estimate USDT value
        const symbol = b.asset === "USDT" ? 1 : (prices[`${b.asset}USDT`] || 0);
        return { asset: b.asset, free: b.free, locked: b.locked, total, usdtValue: total * symbol };
      })
      .filter((b: any) => b.usdtValue >= minUsdt)
      .sort((a: any, b: any) => b.usdtValue - a.usdtValue);

    return { ok: true, balances };
  } catch (e: any) {
    logger.warn({ err: e.message }, "[BINANCE] fetchBalance failed");
    return { ok: false, error: e.message };
  }
}

// ─── Order placement (private) ────────────────────────────────────────────

export interface OrderResult { ok: boolean; orderId?: number; status?: string; error?: string; test?: boolean }

export async function placeOrder(opts: {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: string;
  price?: string;
  testOnly?: boolean;
}): Promise<OrderResult> {
  if (!hasKeys()) return { ok: false, error: "Binance API keys not configured" };
  try {
    const params: Record<string, string | number> = {
      symbol: opts.symbol,
      side: opts.side,
      type: opts.type,
      quantity: opts.quantity,
    };
    if (opts.type === "LIMIT" && opts.price) {
      params.price = opts.price;
      params.timeInForce = "GTC";
    }
    const qs = signedQs(params, apiSecret());
    const endpoint = opts.testOnly ? "/api/v3/order/test" : "/api/v3/order";
    const result = await httpsPost<any>(endpoint, qs, authHeaders());
    if (result.code && result.code < 0) throw new Error(result.msg || `Binance error ${result.code}`);
    return { ok: true, orderId: result.orderId, status: result.status, test: !!opts.testOnly };
  } catch (e: any) {
    logger.warn({ err: e.message, opts }, "[BINANCE] placeOrder failed");
    return { ok: false, error: e.message };
  }
}
