/**
 * Vault token issuance — HMAC-signed bearer tokens.
 * Lets the creator authenticate from any device (mobile, browser, etc.) using a passphrase
 * without requiring Telegram WebApp initData.
 *
 * Token format:  base64url(payload).hex(hmac_sha256(payload, SESSION_SECRET))
 *   payload = JSON {sub: "vault", exp: <unix-sec>, iat: <unix-sec>}
 */
import crypto from "crypto";

const SECRET = process.env["SESSION_SECRET"] || "titan94-fallback-secret-change-me";
const TTL_SEC = 7 * 24 * 60 * 60; // 7 days

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Buffer {
  const pad = (4 - s.length % 4) % 4;
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad), "base64");
}
function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function issueToken(): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TTL_SEC;
  const payload = JSON.stringify({ sub: "vault", iat: now, exp });
  const enc = b64url(Buffer.from(payload, "utf-8"));
  const sig = sign(enc);
  return { token: `${enc}.${sig}`, expiresAt: exp };
}

export function verifyToken(token: string): { valid: boolean; expiresAt?: number } {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [enc, sig] = parts;
  if (sign(enc!) !== sig) return { valid: false };
  try {
    const payload = JSON.parse(b64urlDecode(enc!).toString("utf-8"));
    if (payload.sub !== "vault") return { valid: false };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return { valid: false };
    return { valid: true, expiresAt: payload.exp };
  } catch {
    return { valid: false };
  }
}

/** Extract Bearer token from Authorization header */
export function bearerFromReq(req: any): string {
  const auth = String(req.headers["authorization"] || "");
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}
