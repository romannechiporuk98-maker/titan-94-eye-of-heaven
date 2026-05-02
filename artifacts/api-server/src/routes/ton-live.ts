/**
 * TITAN-94 · Live TON Blockchain Data
 * Real-time data from TonCenter API v2 + TONAPI.io
 * No API key required for basic usage.
 */
import { Router, type IRouter } from "express";
import https from "https";

const router: IRouter = Router();

// ── Generic HTTPS GET ─────────────────────────────────────────────────────
function getJson(host: string, path: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path, method: "GET", headers: { "Accept": "application/json", "User-Agent": "TITAN-94/4.0" } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8"))); }
          catch { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// ── Cache layer ───────────────────────────────────────────────────────────
const CACHE: Record<string, { data: any; expiresAt: number }> = {};
function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (CACHE[key] && CACHE[key].expiresAt > now) return Promise.resolve(CACHE[key].data);
  return fn().then((data) => { CACHE[key] = { data, expiresAt: now + ttlMs }; return data; });
}

// ── Data fetchers ─────────────────────────────────────────────────────────
async function fetchChainStats() {
  const [masterchain, validators, rates] = await Promise.all([
    getJson("toncenter.com", "/api/v2/getMasterchainInfo"),
    getJson("tonapi.io",     "/v2/blockchain/validators"),
    getJson("tonapi.io",     "/v2/rates?tokens=ton&currencies=usd,uah,eur"),
  ]);

  const seqno       = masterchain?.result?.last?.seqno ?? null;
  const valCount    = validators?.validators?.length ?? null;
  const priceUSD    = rates?.rates?.TON?.prices?.USD ?? null;
  const priceUAH    = rates?.rates?.TON?.prices?.UAH ?? null;
  const priceEUR    = rates?.rates?.TON?.prices?.EUR ?? null;
  const diff24h     = rates?.rates?.TON?.diff_24h?.USD ?? null;
  const diff7d      = rates?.rates?.TON?.diff_7d?.USD ?? null;

  return {
    seqno,
    validators: valCount,
    price: { usd: priceUSD, uah: priceUAH, eur: priceEUR, diff24h, diff7d },
    network: "mainnet",
    subSecondFinality: true,
    checkedAt: new Date().toISOString(),
  };
}

async function fetchContractInfo(address: string) {
  const [toncenterInfo, tonapiAccount, tonapiTxs, tonapiJetton] = await Promise.all([
    getJson("toncenter.com", `/api/v2/getAddressInformation?address=${encodeURIComponent(address)}`),
    getJson("tonapi.io",     `/v2/accounts/${encodeURIComponent(address)}`),
    getJson("tonapi.io",     `/v2/accounts/${encodeURIComponent(address)}/transactions?limit=5`),
    getJson("tonapi.io",     `/v2/jettons/${encodeURIComponent(address)}`).catch(() => null),
  ]);

  const tc = toncenterInfo?.result ?? {};
  const ta = tonapiAccount ?? {};
  const txs = tonapiTxs?.transactions ?? [];

  const balanceNano = tc.balance ?? ta.balance ?? "0";
  const balanceTon  = parseInt(balanceNano || "0") / 1e9;

  // Detect contract type
  let contractType = "unknown";
  if (ta.interfaces?.length) {
    const ifaces = ta.interfaces as string[];
    if (ifaces.some((i) => i.includes("jetton_minter"))) contractType = "jetton_minter";
    else if (ifaces.some((i) => i.includes("jetton_wallet"))) contractType = "jetton_wallet";
    else if (ifaces.some((i) => i.includes("nft_collection"))) contractType = "nft_collection";
    else if (ifaces.some((i) => i.includes("nft_item"))) contractType = "nft_item";
    else if (ifaces.some((i) => i.includes("wallet"))) contractType = "wallet";
    else contractType = ifaces[0] || "contract";
  } else if (tc.state === "active" && tc.code) {
    contractType = "contract";
  } else if (tc.state === "active") {
    contractType = "wallet";
  }

  // Risk signals
  const riskFlags: string[] = [];
  if (balanceTon > 10000) riskFlags.push("HIGH_BALANCE");
  if (!tc.code && tc.state === "active") riskFlags.push("NO_CODE");
  if (tc.state === "frozen") riskFlags.push("FROZEN");
  if (ta.is_scam) riskFlags.push("SCAM_FLAGGED");

  const recentTxs = txs.slice(0, 5).map((tx: any) => ({
    hash:     tx.hash,
    utime:    tx.utime,
    lt:       tx.lt,
    inValue:  tx.in_msg?.value ? parseInt(tx.in_msg.value) / 1e9 : 0,
    inFrom:   tx.in_msg?.source?.address ?? null,
    fees:     tx.total_fees ? parseInt(tx.total_fees) / 1e9 : 0,
    success:  tx.success ?? true,
  }));

  return {
    address,
    balanceTon,
    balanceNano: tc.balance ?? ta.balance,
    state:       tc.state ?? (ta.status === "active" ? "active" : "uninitialized"),
    contractType,
    hasCode:     !!tc.code || !!ta.code?.hash,
    interfaces:  ta.interfaces ?? [],
    isScam:      !!ta.is_scam,
    name:        ta.name ?? tonapiJetton?.metadata?.name ?? null,
    symbol:      tonapiJetton?.metadata?.symbol ?? null,
    image:       ta.icon ?? tonapiJetton?.metadata?.image ?? null,
    riskFlags,
    riskScore:   riskFlags.length,
    recentTxs,
    explorerUrl: `https://tonviewer.com/${address}`,
    tonscanUrl:  `https://tonscan.com/address/${address}`,
    checkedAt:   new Date().toISOString(),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get("/ton/chain-stats", async (_req, res) => {
  try {
    const stats = await cached("chain-stats", 15_000, fetchChainStats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "chain stats unavailable", detail: String(err) });
  }
});

router.get("/ton/lookup/:address", async (req, res) => {
  const { address } = req.params;
  if (!address || address.length < 10) return res.status(400).json({ error: "invalid address" });
  try {
    const info = await cached(`lookup:${address}`, 30_000, () => fetchContractInfo(address));
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: "lookup failed", detail: String(err) });
  }
});

export default router;
