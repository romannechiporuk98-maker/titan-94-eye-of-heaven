/**
 * TON Connect 2.0 helper utilities for TITAN-94.
 * Build payment transactions for any plan and send them through the connected wallet.
 */

export const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

export interface PaymentTx {
  validUntil: number;
  messages: Array<{
    address: string;
    amount: string;
    payload?: string;
  }>;
}

/**
 * Encode a UTF-8 text comment as a base64 TON BoC (Bag of Cells).
 *
 * Cell data layout:
 *   [op=0x00000000 (4 bytes)] [UTF-8 text bytes]
 *
 * BoC layout (generic single-root, no index, no CRC32):
 *   magic(4) | flags(1) | off_bytes(1) | cells(1) | roots(1) | absent(1)
 *   | tot_size(1) | root_idx(1) | d1(1) | d2(1) | data(N)
 */
function buildCommentBoc(text: string): string {
  const textBytes = new TextEncoder().encode(text.slice(0, 120));
  const dataLen   = 4 + textBytes.length; // op(4) + text

  const cellData = new Uint8Array(dataLen);
  // bytes 0-3 stay 0x00 (text-comment op code)
  cellData.set(textBytes, 4);

  // Cell descriptor: d1=0x00 (ordinary, no refs), d2=2*dataLen (byte-aligned)
  const cellBytes = new Uint8Array(2 + dataLen);
  cellBytes[0] = 0x00;
  cellBytes[1] = dataLen * 2;
  cellBytes.set(cellData, 2);

  // BoC header
  const hdr = new Uint8Array([
    0xb5, 0xee, 0x9c, 0x72, // magic
    0x01,                   // flags: size_bytes=1, no idx, no crc, no cache
    0x01,                   // off_bytes=1
    0x01,                   // cells_num=1
    0x01,                   // roots_num=1
    0x00,                   // absent_num=0
    cellBytes.length & 0xff, // tot_cells_size
    0x00,                   // root[0] = cell index 0
  ]);

  const boc = new Uint8Array(hdr.length + cellBytes.length);
  boc.set(hdr);
  boc.set(cellBytes, hdr.length);

  let binary = "";
  for (let i = 0; i < boc.length; i++) binary += String.fromCharCode(boc[i]);
  return btoa(binary);
}

/**
 * Create a TON Connect transaction for a plan purchase.
 *
 * Comment format: TITAN94_<telegramId>_<plan>
 * Encoded as a BoC cell payload so the on-chain comment is machine-readable
 * by the TON-POLLER for deterministic plan matching — even if two users pay
 * the same amount at the same time.
 *
 * Returns the tx object to pass directly to tonConnectUI.sendTransaction(tx).
 */
export function buildPaymentTx(
  plan: "pro" | "elite" | "developer",
  telegramId: string,
  customAmountTon?: number,
): PaymentTx {
  const defaultAmounts: Record<string, number> = { pro: 5, elite: 20, developer: 1000 };
  const amount = customAmountTon ?? defaultAmounts[plan] ?? 5;

  const comment = `TITAN94_${telegramId}_${plan}`;
  const payload  = buildCommentBoc(comment);

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: RESERVE_WALLET,
        amount:  String(Math.round(amount * 1e9)),
        payload,
      },
    ],
  };
}

/**
 * Format nano-TON to human readable
 */
export function formatTon(nano: string | number, decimals = 4): string {
  const n = typeof nano === "string" ? parseInt(nano) : nano;
  return (n / 1e9).toFixed(decimals);
}

/**
 * Shorten a TON address for display
 */
export function shortAddr(addr?: string | null, prefix = 6, suffix = 4): string {
  if (!addr) return "—";
  if (addr.length <= prefix + suffix + 3) return addr;
  return `${addr.slice(0, prefix)}…${addr.slice(-suffix)}`;
}
