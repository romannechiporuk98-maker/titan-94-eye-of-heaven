import { Router, type IRouter } from "express";
import * as ton from "../services/ton-scanner";
import * as store from "../services/store";

const router: IRouter = Router();

const RESERVE = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

// TON Connect manifest — referenced by frontend at /api/ton/connect-manifest
router.get("/ton/connect-manifest", (req, res) => {
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const url = `${proto}://${host}`;
  res.json({
    url,
    name: "TITAN-94 ОКО НЕБЕСНЕ",
    iconUrl: `${url}/favicon.svg`,
    termsOfUseUrl: `${url}/terms`,
    privacyPolicyUrl: `${url}/privacy`,
  });
});

// Wallet info for any TON address
router.get("/ton/wallet/:address", async (req, res) => {
  const addr = req.params.address;
  try {
    const [info, txs] = await Promise.all([
      ton.getAddressInfo(addr),
      ton.getRecentTransactions(addr, 10),
    ]);
    res.json({
      address: addr,
      balance_ton: info ? parseInt(info.balance) / 1e9 : null,
      state: info?.state || "unknown",
      lastSeqno: info?.last_transaction_id?.lt,
      transactions: txs.slice(0, 10).map((t) => ({
        utime: t.utime,
        hash: t.transaction_id.hash,
        amount_ton: t.in_msg ? parseInt(t.in_msg.value) / 1e9 : 0,
        from: t.in_msg?.source,
        comment: t.in_msg?.message,
      })),
    });
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});

// Reserve wallet shortcut
router.get("/ton/reserve", async (_req, res) => {
  const balance = await ton.getAddressBalance(RESERVE).catch(() => null);
  const txs = await ton.getRecentTransactions(RESERVE, 10).catch(() => []);
  const incoming = txs.filter((t) => t.in_msg && parseInt(t.in_msg.value) > 0);
  res.json({
    address: RESERVE,
    balance_ton: balance,
    last_incoming: incoming.slice(0, 5).map((t) => ({
      hash: t.transaction_id.hash,
      amount_ton: parseInt(t.in_msg!.value) / 1e9,
      from: t.in_msg?.source,
      comment: t.in_msg?.message,
      time: new Date(t.utime * 1000).toISOString(),
    })),
  });
});

// Generate a tonkeeper deep-link for any plan/user
router.get("/ton/payment-link/:plan/:telegramId", (req, res) => {
  const { plan, telegramId } = req.params;
  const amounts: Record<string, number> = { pro: 5, elite: 20 };
  const amount = amounts[plan];
  if (!amount) return res.status(400).json({ error: "Plan must be 'pro' or 'elite'" });
  const link = `https://app.tonkeeper.com/transfer/${RESERVE}?amount=${amount * 1e9}&text=tg:${telegramId}:${plan}`;
  res.json({
    plan, amount_ton: amount, telegramId,
    tonkeeperLink: link,
    tonhubLink: `https://tonhub.com/transfer/${RESERVE}?amount=${amount * 1e9}&text=tg:${telegramId}:${plan}`,
    qrPayload: `ton://transfer/${RESERVE}?amount=${amount * 1e9}&text=tg:${telegramId}:${plan}`,
    comment: `tg:${telegramId}:${plan}`,
    reserve: RESERVE,
  });
});

// Check on-chain status of a particular subscription payment
router.get("/ton/payment-status/:telegramId", async (req, res) => {
  const id = req.params.telegramId;
  const sub = await store.getSubscriber(id);
  res.json({
    telegramId: id,
    plan: sub?.plan ?? "free",
    isActive: sub?.isActive ?? false,
    expiresAt: sub?.expiresAt,
    daysLeft: sub?.expiresAt ? Math.max(0, Math.floor((sub.expiresAt.getTime() - Date.now()) / 86400000)) : 0,
  });
});

export default router;
