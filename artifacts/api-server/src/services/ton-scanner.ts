/**
 * TonCenter API client — reads real TON blockchain data.
 * Works without API key (rate-limited 1 req/sec) or with TON_API_KEY for higher limits.
 */
import https from "https";
import { logger } from "../lib/logger";

const HOST = "toncenter.com";
const KEY  = process.env.TON_API_KEY || "";

interface RpcResponse<T = any> { ok: boolean; result?: T; error?: string }

function rpc<T = any>(path: string): Promise<RpcResponse<T>> {
  return new Promise((resolve) => {
    const sep = path.includes("?") ? "&" : "?";
    const url = `/api/v2${path}${KEY ? `${sep}api_key=${KEY}` : ""}`;
    const req = https.request({
      hostname: HOST, path: url, method: "GET",
      headers: { "Accept": "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ ok: false, error: `parse: ${(e as Error).message}` }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.end();
  });
}

export interface MasterchainInfo {
  last: { workchain: number; shard: string; seqno: number };
  state_root_hash: string;
  init: { workchain: number; root_hash: string; file_hash: string };
}

export async function getMasterchainInfo(): Promise<MasterchainInfo | null> {
  const r = await rpc<MasterchainInfo>("/getMasterchainInfo");
  if (!r.ok) { logger.warn({ err: r.error }, "[TON] getMasterchainInfo failed"); return null; }
  return r.result ?? null;
}

export interface AddressInfo {
  balance: string;            // nano
  state: "active" | "uninitialized" | "frozen";
  last_transaction_id?: { lt: string; hash: string };
  block_id?: { workchain: number; shard: string; seqno: number };
  code?: string;
  data?: string;
}

export async function getAddressInfo(addr: string): Promise<AddressInfo | null> {
  const r = await rpc<AddressInfo>(`/getAddressInformation?address=${encodeURIComponent(addr)}`);
  if (!r.ok) return null;
  return r.result ?? null;
}

export async function getAddressBalance(addr: string): Promise<number | null> {
  const info = await getAddressInfo(addr);
  if (!info) return null;
  return parseInt(info.balance) / 1e9;
}

export interface TonTransaction {
  utime: number;
  transaction_id: { lt: string; hash: string };
  fee: string;
  in_msg?: { source: string; destination: string; value: string; message?: string };
  out_msgs?: Array<{ source: string; destination: string; value: string; message?: string }>;
}

export async function getRecentTransactions(addr: string, limit = 20): Promise<TonTransaction[]> {
  const r = await rpc<TonTransaction[]>(`/getTransactions?address=${encodeURIComponent(addr)}&limit=${limit}`);
  if (!r.ok || !r.result) return [];
  return r.result;
}

/** Verify that a tx with given hash exists on-chain */
export async function verifyTransaction(txHash: string, recipient: string): Promise<{
  found: boolean; tx?: TonTransaction; reason?: string;
}> {
  const txs = await getRecentTransactions(recipient, 100);
  const tx = txs.find((t) => t.transaction_id.hash === txHash || t.transaction_id.hash.toLowerCase() === txHash.toLowerCase());
  if (!tx) return { found: false, reason: "tx not in last 100 transactions of recipient" };
  return { found: true, tx };
}

/** Get current latest masterchain seqno (used by SCAN cycle) */
export async function getCurrentSeqno(): Promise<number | null> {
  const info = await getMasterchainInfo();
  return info?.last.seqno ?? null;
}

export const TON_API_HEALTHY = !!KEY;
