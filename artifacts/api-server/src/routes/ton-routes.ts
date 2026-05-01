import { Router, type IRouter } from "express";
import * as tonScanner from "../services/ton-scanner";

const router: IRouter = Router();
const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

router.get("/ton/network", async (_req, res) => {
  const seqno = await tonScanner.getCurrentSeqno().catch(() => null);
  res.json({
    network: process.env.TON_NETWORK || "mainnet",
    masterchain: {
      seqno: seqno ?? null,
      time: Math.floor(Date.now() / 1000),
    },
    subSecondFinality: true,
    status: seqno ? "operational" : "degraded",
    updatedAt: new Date().toISOString(),
  });
});

router.get("/ton/wallet", async (_req, res) => {
  const [info, txs] = await Promise.all([
    tonScanner.getAddressInfo(RESERVE_WALLET).catch(() => null),
    tonScanner.getRecentTransactions(RESERVE_WALLET, 5).catch(() => []),
  ]);
  res.json({
    address: RESERVE_WALLET,
    balance_ton: info ? (parseInt(info.balance) / 1e9) : null,
    balance_nano: info?.balance ?? null,
    state: info?.state ?? "unknown",
    last_tx: txs[0]?.transaction_id?.hash ?? null,
    updatedAt: new Date().toISOString(),
  });
});

router.get("/ton/transactions", async (_req, res) => {
  const txs = await tonScanner.getRecentTransactions(RESERVE_WALLET, 20).catch(() => []);
  res.json({
    address: RESERVE_WALLET,
    transactions: txs.map((t) => ({
      hash: t.transaction_id.hash,
      utime: t.utime,
      from: t.in_msg?.source ?? null,
      value_ton: t.in_msg?.value ? (parseInt(t.in_msg.value) / 1e9) : 0,
      comment: t.in_msg?.message ?? null,
    })),
    updatedAt: new Date().toISOString(),
  });
});

router.get("/ton/contract/:address", async (req, res) => {
  const { address } = req.params;
  const info = await tonScanner.getAddressInfo(address).catch(() => null);
  res.json({
    address,
    balance_ton: info ? (parseInt(info.balance) / 1e9) : null,
    state: info?.state ?? "unknown",
    updatedAt: new Date().toISOString(),
  });
});

router.get("/ton/smart-wallets", (_req, res) => {
  res.json({
    smart_wallets: [],
    note: "Real whale tracking requires TONAPI_KEY with indexer access",
    mirror_mode: "ELITE only",
    last_updated: new Date().toISOString(),
  });
});

export default router;
