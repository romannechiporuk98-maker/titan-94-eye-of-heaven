/**
 * TON Connect 2.0 helper utilities for TITAN-94.
 * Build payment transactions for any plan and send them through the connected wallet.
 */

export const RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

export interface PaymentTx {
  validUntil: number;
  messages: Array<{
    address: string;
    amount: string; // nano TON
    payload?: string; // optional base64 cell with comment
  }>;
}

/**
 * Create a TON Connect transaction for a plan purchase.
 * Returns the tx object you pass directly to tonConnectUI.sendTransaction(tx).
 *
 * Comment encoding: TON Connect requires the comment as a base64-encoded BoC cell.
 * For maximum compatibility we omit the payload and rely on the amount to identify the plan.
 * The TON-POLLER on the backend then matches the from-address + amount to the user.
 */
export function buildPaymentTx(plan: "pro" | "elite", _telegramId: string): PaymentTx {
  const amounts: Record<"pro" | "elite", number> = { pro: 5, elite: 20 };
  const amount = amounts[plan];
  return {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
    messages: [
      {
        address: RESERVE_WALLET,
        amount: String(amount * 1e9),
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
