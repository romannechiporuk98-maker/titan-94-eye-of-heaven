/**
 * TITAN-94 Binance Routes — prices, balance, account info.
 *
 * Public:  GET /api/binance/prices
 * Creator: GET /api/binance/status
 *          GET /api/binance/balance
 *          GET /api/binance/ticker/:symbol
 *          POST /api/binance/order/test
 */
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import * as binance from "../services/binance";
import * as creator from "../services/creator";
import * as vaultAuth from "../services/vault-auth";

const router: IRouter = Router();

function requireCreator(req: Request, res: Response, next: NextFunction) {
  const id = String(req.headers["x-telegram-id"] || req.headers["x-creator-id"] || req.query["tg"] || "");
  if (creator.isCreator(id)) return next();
  const t = vaultAuth.bearerFromReq(req);
  if (t && vaultAuth.verifyToken(t).valid) return next();
  return res.status(403).json({ error: "Forbidden — creator only" });
}

// ─── Public: market prices ─────────────────────────────────────────────────

router.get("/binance/prices", async (_req, res) => {
  const prices = await binance.fetchPrices(["TONUSDT", "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]);
  res.json({
    ok: true,
    keysConfigured: binance.hasKeys(),
    prices,
    fetchedAt: new Date().toISOString(),
  });
});

// ─── 24h ticker for a single symbol ───────────────────────────────────────

router.get("/binance/ticker/:symbol", async (req, res) => {
  const symbol = (req.params.symbol || "TONUSDT").toUpperCase();
  const ticker = await binance.fetchTicker24(symbol);
  if (!ticker) return res.status(502).json({ error: "Failed to fetch ticker from Binance" });
  res.json(ticker);
});

// ─── Creator: connection status + ping ────────────────────────────────────

router.get("/binance/status", requireCreator, async (_req, res) => {
  const configured = binance.hasKeys();
  if (!configured) {
    return res.json({ ok: false, configured: false, message: "Binance API keys not configured. Add BINANCE_API_KEY and BINANCE_API_SECRET in Vault → API Keys." });
  }
  const result = await binance.ping();
  res.json({ configured, ...result });
});

// ─── Creator: account balances ────────────────────────────────────────────

router.get("/binance/balance", requireCreator, async (req, res) => {
  const minUsdt = parseFloat(String(req.query.min || "0.01"));
  const result = await binance.fetchBalance(minUsdt);
  res.json(result);
});

// ─── Creator: test order (no funds actually moved) ────────────────────────

router.post("/binance/order/test", requireCreator, async (req, res) => {
  const { symbol, side, type, quantity, price } = req.body || {};
  if (!symbol || !side || !type || !quantity) {
    return res.status(400).json({ error: "symbol, side, type, quantity required" });
  }
  const result = await binance.placeOrder({ symbol, side, type, quantity, price, testOnly: true });
  res.json(result);
});

export default router;
