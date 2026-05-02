/**
 * TITAN-94 — Auth routes
 *
 * POST /api/auth/register      — Telegram-based registration (upsert subscriber)
 * POST /api/auth/web3-connect  — TON wallet registration (no Telegram required)
 * GET  /api/auth/status/:id    — Check auth status for a wallet or telegram ID
 */
import { Router, type IRouter } from "express";
import * as store from "../services/store";

const router: IRouter = Router();

/**
 * POST /api/auth/register
 * Standard Telegram WebApp registration. Creates/updates subscriber record.
 */
router.post("/auth/register", async (req, res) => {
  const { telegram_id, username, plan, ton_address, referred_by } = req.body || {};
  if (!telegram_id) return res.status(400).json({ error: "telegram_id required" });

  const id = String(telegram_id);
  try {
    const subscriber = await store.upsertSubscriber({
      telegramId: id,
      username:   username ? String(username) : null,
      plan:       (plan === "pro" || plan === "elite") ? plan : "free",
      tonAddress: ton_address ? String(ton_address) : null,
      referredBy: referred_by ? String(referred_by) : null,
    });
    res.json({ ok: true, subscriber });
  } catch (err: any) {
    req.log?.error(err, "auth/register failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/web3-connect
 * Autonomous Web3 registration — no Telegram required.
 * Accepts a TON wallet address, creates or updates a subscriber using
 * the wallet address as the unique identifier (prefixed with "w3_").
 *
 * Body: { walletAddress: string, username?: string }
 * Returns: { ok: true, subscriber, isNew: boolean }
 */
router.post("/auth/web3-connect", async (req, res) => {
  const { walletAddress, username } = req.body || {};
  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "walletAddress required" });
  }

  // Sanitize: accept only UQ/EQ/0: TON address formats
  const addr = walletAddress.trim();
  if (!/^(UQ|EQ|0:)[A-Za-z0-9_\-]{40,70}$/.test(addr)) {
    return res.status(400).json({ error: "Invalid TON wallet address format" });
  }

  // Use "w3_<short>" as telegram_id placeholder for wallet-only users
  const syntheticId = `w3_${addr.slice(0, 6)}_${addr.slice(-6)}`;

  try {
    const existing = await store.getSubscriber(syntheticId);
    const isNew = !existing;

    const subscriber = await store.upsertSubscriber({
      telegramId: syntheticId,
      username:   username ? String(username).slice(0, 64) : null,
      plan:       existing?.plan ?? "free",
      tonAddress: addr,
    });

    res.json({
      ok:         true,
      isNew,
      subscriber: {
        id:         subscriber.telegramId,
        plan:       subscriber.plan,
        tonAddress: subscriber.tonAddress,
        username:   subscriber.username,
        createdAt:  subscriber.createdAt,
      },
    });
  } catch (err: any) {
    req.log?.error(err, "auth/web3-connect failed");
    res.status(500).json({ error: "Web3 auth failed" });
  }
});

/**
 * GET /api/auth/status/:identifier
 * Check if a user (by telegram_id or wallet address) is registered.
 */
router.get("/auth/status/:identifier", async (req, res) => {
  const raw = req.params.identifier;
  if (!raw) return res.status(400).json({ error: "identifier required" });

  try {
    // Could be a wallet address or a telegram ID
    const isWallet = /^(UQ|EQ|0:)/.test(raw);
    const lookupId = isWallet
      ? `w3_${raw.slice(0, 6)}_${raw.slice(-6)}`
      : raw;

    const subscriber = await store.getSubscriber(lookupId);
    if (!subscriber) {
      return res.json({ registered: false, identifier: raw });
    }
    res.json({
      registered: true,
      plan:       subscriber.plan,
      tonAddress: subscriber.tonAddress,
      isActive:   subscriber.isActive,
    });
  } catch (err: any) {
    req.log?.error(err, "auth/status failed");
    res.status(500).json({ error: "Status check failed" });
  }
});

export default router;
