/**
 * TITAN-94 Webhook router
 * - POST /api/webhook/ton-payment      : record + activate plan (with on-chain verification if possible)
 * - GET  /api/webhook/verify/:txHash   : verify a tx hash exists on the Reserve wallet
 */
import { Router, type IRouter } from "express";
import * as store from "../services/store";
import * as ton from "../services/ton-scanner";
import { creditCPA } from "./billing";

const router: IRouter = Router();
const RESERVE = store.RESERVE;

router.post("/webhook/ton-payment", async (req, res) => {
  const { txHash, fromAddress, toAddress, amountNano, telegramId, comment } = req.body || {};
  if (!txHash || !amountNano) return res.status(400).json({ error: "txHash and amountNano required" });

  // Try on-chain verification (best-effort, works without API key but rate-limited)
  let verified = false;
  let onChainAmount: number | null = null;
  try {
    const v = await ton.verifyTransaction(txHash, toAddress || RESERVE);
    if (v.found && v.tx) {
      verified = true;
      const inMsg = v.tx.in_msg;
      if (inMsg?.value) onChainAmount = parseInt(inMsg.value) / 1e9;
    }
  } catch { /* keep verified=false, fall back to provided amount */ }

  const declaredTon = parseInt(amountNano) / 1e9;
  const tonAmount   = onChainAmount ?? declaredTon;

  let plan: "pro" | "elite" | null = null;
  if (tonAmount >= 4.5 && tonAmount <= 5.5) plan = "pro";
  if (tonAmount >= 19  && tonAmount <= 21)  plan = "elite";

  await store.recordTonPayment({
    txHash, fromAddress: fromAddress ?? "unknown", toAddress: toAddress || RESERVE,
    amountNano: String(amountNano), comment, telegramId: telegramId ? String(telegramId) : undefined,
    planActivated: plan ?? undefined, verified,
  });

  if (!plan) {
    return res.status(400).json({
      ok: false, error: `Amount ${tonAmount} TON does not match any plan (5=PRO, 20=ELITE)`,
      verified, onChainAmount,
    });
  }

  const id = String(telegramId || fromAddress);
  const existing = await store.getSubscriber(id);
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  await store.upsertSubscriber({
    telegramId: id, username: existing?.username || id,
    plan, tonAddress: fromAddress, expiresAt, isActive: true,
    referredBy: existing?.referredBy ?? null,
  });

  await store.ledgerInsert({
    telegramId: id, type: "subscription", amountTon: tonAmount,
    description: `${plan.toUpperCase()} subscription`, txHash,
  });

  if (existing?.referredBy) {
    await creditCPA(existing.referredBy, tonAmount, `${id} subscribed to ${plan.toUpperCase()}`, txHash);
  }

  await store.logActivity(
    "FINANCE", `${plan.toUpperCase()} activated${verified ? " (on-chain verified)" : ""}`,
    `${id} paid ${tonAmount} TON · tx ${txHash.slice(0, 10)}...`,
    "success", { telegramId: id, plan, tonAmount, verified, txHash },
  );

  res.json({ success: true, plan, expiresAt, ton: tonAmount, txHash, verified, onChainAmount });
});

router.get("/webhook/verify/:txHash", async (req, res) => {
  const txHash = req.params.txHash;
  const recipient = (req.query.address as string) || RESERVE;

  // Check if we have it persisted first
  const stored = await store.findPayment(txHash);

  // Always also verify on-chain
  let onChain: any = { found: false };
  try {
    const v = await ton.verifyTransaction(txHash, recipient);
    if (v.found && v.tx) {
      onChain = {
        found:    true,
        utime:    v.tx.utime,
        amountTon: v.tx.in_msg ? parseInt(v.tx.in_msg.value) / 1e9 : null,
        from:     v.tx.in_msg?.source,
        to:       v.tx.in_msg?.destination,
        comment:  v.tx.in_msg?.message,
        fee:      v.tx.fee,
      };
    } else {
      onChain.reason = v.reason;
    }
  } catch (e) {
    onChain.error = (e as Error).message;
  }

  res.json({
    txHash,
    recipient,
    stored: stored ? {
      verified: stored.verified, planActivated: stored.planActivated,
      amountTon: stored.amountTon, telegramId: stored.telegramId, createdAt: stored.createdAt,
    } : null,
    onChain,
    checkedAt: new Date().toISOString(),
  });
});

router.get("/webhook/reserve-balance", async (_req, res) => {
  try {
    const balance = await ton.getAddressBalance(RESERVE);
    res.json({ address: RESERVE, balance_ton: balance, source: process.env["TON_API_KEY"] ? "toncenter (keyed)" : "toncenter (free)", checkedAt: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});

export default router;
