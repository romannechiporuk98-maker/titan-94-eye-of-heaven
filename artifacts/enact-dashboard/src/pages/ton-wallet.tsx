import { useState, useMemo, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, RefreshCw, ExternalLink, Copy, Image as ImageIcon,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  CircleDollarSign, Gem, History, ShieldCheck, Send, Loader2, AlertCircle,
} from "lucide-react";
import { TonConnectButton, useTonAddress, useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useToast } from "@/hooks/use-toast";
import { useLang, t, type Lang } from "@/lib/ui-prefs";
import { haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const apiUrl = (path: string) => `${BASE}/api${path}`;

// ── API proxy fetchers (no CORS issues) ────────────────────────────────────────
function useTonAccount(address: string | null) {
  return useQuery<any>({
    queryKey: ["ton-account", address],
    queryFn: () => fetch(apiUrl(`/market/ton-account/${address}`)).then(r => r.json()),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}
function useTonJettons(address: string | null) {
  return useQuery<any>({
    queryKey: ["ton-jettons", address],
    queryFn: () => fetch(apiUrl(`/market/ton-jettons/${address}`)).then(r => r.json()),
    enabled: !!address,
    refetchInterval: 60_000,
  });
}
function useTonNFTs(address: string | null) {
  return useQuery<any>({
    queryKey: ["ton-nfts", address],
    queryFn: () => fetch(apiUrl(`/market/ton-nfts/${address}`)).then(r => r.json()),
    enabled: !!address,
    refetchInterval: 120_000,
  });
}
function useTonTransactions(address: string | null) {
  return useQuery<any>({
    queryKey: ["ton-txs", address],
    queryFn: () => fetch(apiUrl(`/market/ton-events/${address}`)).then(r => r.json()),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}
function useTonPrice() {
  return useQuery<number | null>({
    queryKey: ["ton-price-usd"],
    queryFn: async () => {
      const r = await fetch(apiUrl("/market/ohlc?coinId=the-open-network&days=1"));
      if (!r.ok) return null;
      const data: number[][] = await r.json();
      if (!Array.isArray(data) || !data.length) return null;
      return data[data.length - 1][4]; // last candle close price
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 0,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const nanoToTon = (n: string | number) => Number(n) / 1e9;
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;
const fmtTon    = (t: number) => t >= 1000 ? t.toLocaleString("uk", { maximumFractionDigits: 2 }) : t.toFixed(4);
const fmtUsd    = (u: number) => u >= 1000 ? `$${u.toLocaleString("uk", { maximumFractionDigits: 0 })}` : `$${u.toFixed(2)}`;

// ── Connect prompt ────────────────────────────────────────────────────────────
function ConnectPrompt({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="absolute inset-0 blur-2xl opacity-20 rounded-full" style={{ background: "#0088CC", transform: "scale(1.5)" }} />
        <Wallet className="w-20 h-20 relative" style={{ color: "#0088CC" }} />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#00FFFF" }}>{t("wallet.connect_title", lang)}</h2>
        <p className="text-sm text-muted max-w-xs">{t("wallet.connect_desc", lang)}</p>
      </div>
      <div style={{ transform: "scale(1.2)", transformOrigin: "center" }}>
        <TonConnectButton />
      </div>
      <div className="flex gap-4 text-xs text-muted mt-2">
        {["Tonkeeper", "MyTonWallet", "Tonhub", "OpenMask"].map(w => (
          <span key={w} className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-safe" /> {w}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({ address, account, priceData, lang, onCopy }: {
  address: string; account: any; priceData: number | null; lang: Lang; onCopy: (v: string) => void;
}) {
  const tonBalance = account?.balance != null ? nanoToTon(account.balance) : null;
  const tonPrice   = priceData ?? null;
  const tonChange  = null;
  const usdBalance = tonBalance != null && tonPrice != null ? tonBalance * tonPrice : null;
  const isUp = tonChange != null ? (tonChange as number) >= 0 : true;

  return (
    <div className="titan-live-card p-5" style={{ background: "linear-gradient(135deg, rgba(0,136,204,0.12), rgba(0,255,255,0.06), rgba(0,0,0,0))", borderColor: "rgba(0,136,204,0.4)" }}>
      {/* Wallet identity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,136,204,0.2)", border: "1px solid rgba(0,136,204,0.4)" }}>
            <Wallet className="w-4 h-4" style={{ color: "#0088CC" }} />
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-muted">{t("wallet.my_wallet", lang)}</div>
            <button onClick={() => onCopy(address)} className="flex items-center gap-1 hover:text-primary transition-colors">
              <span className="font-mono text-xs" style={{ color: "#00FFFF" }}>{shortAddr(address)}</span>
              <Copy className="w-3 h-3 text-muted" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`https://tonviewer.com/${address}`} target="_blank" rel="noopener"
            className="titan-btn titan-btn-sm flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> TONViewer
          </a>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-[10px] tracking-[0.3em] text-muted mb-1">{t("wallet.total_balance", lang)}</div>
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold tabular-nums" style={{ color: "#0088CC", fontFamily: "'Space Mono', monospace" }}>
            {tonBalance != null ? fmtTon(tonBalance) : "—"} <span className="text-2xl">TON</span>
          </div>
          {usdBalance != null && (
            <div className="text-xl text-muted mb-1 font-mono">{fmtUsd(usdBalance)}</div>
          )}
        </div>
        {tonPrice != null && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted">TON = {fmtUsd(tonPrice)}</span>
            {tonChange != null && (
              <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: isUp ? "#00FF88" : "#FF3355" }}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? "+" : ""}{tonChange.toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Account stats */}
      {account && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("wallet.status", lang), value: account.status === "active" ? "✓ ACTIVE" : account.status?.toUpperCase() || "—", color: "#00FF88" },
            { label: "INTERFACETYPE", value: account.interfaces?.[0] || "wallet", color: "#0088CC" },
            { label: "LAST TX", value: account.last_activity ? new Date(account.last_activity * 1000).toLocaleDateString("uk") : "—", color: "rgba(207,255,255,0.7)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 rounded" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,255,0.1)" }}>
              <div className="text-[9px] tracking-widest text-muted mb-1">{label}</div>
              <div className="text-xs font-bold font-mono truncate" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Jettons (tokens) list ─────────────────────────────────────────────────────
function JettonsPanel({ jettonsData, tonPrice, lang }: { jettonsData: any; tonPrice: number | null; lang: Lang }) {
  const items: any[] = jettonsData?.balances || [];
  if (!items.length) return (
    <div className="text-center py-8 text-muted text-sm">{t("wallet.no_tokens", lang)}</div>
  );

  return (
    <div className="space-y-2">
      {items.map((j, i) => {
        const decimals = j.jetton?.decimals ?? 9;
        const amount   = Number(j.balance) / Math.pow(10, decimals);
        const symbol   = j.jetton?.symbol || "??";
        const name     = j.jetton?.name || symbol;
        const image    = j.jetton?.image || null;
        const priceUsd = j.price?.prices?.USD ?? null;
        const usdVal   = priceUsd && amount ? amount * priceUsd : null;
        const verif    = j.jetton?.verification;

        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded"
            style={{ background: "rgba(0,255,255,0.02)", border: "1px solid rgba(0,255,255,0.08)" }}>
            {/* Token icon */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "rgba(0,136,204,0.15)", border: "1px solid rgba(0,255,255,0.15)" }}>
              {image ? (
                <img src={image} alt={symbol} className="w-full h-full object-cover rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>{symbol.slice(0, 2)}</span>
              )}
            </div>

            {/* Name + amount */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold truncate" style={{ color: "#00FFFF" }}>{symbol}</span>
                {verif === "whitelist" && <ShieldCheck className="w-3 h-3 text-safe shrink-0" />}
              </div>
              <div className="text-[10px] text-muted truncate">{name}</div>
            </div>

            {/* Amount + USD */}
            <div className="text-right shrink-0">
              <div className="font-mono text-sm font-bold" style={{ color: "#00FFFF" }}>
                {amount >= 1e6 ? `${(amount / 1e6).toFixed(2)}M` :
                 amount >= 1000 ? `${(amount / 1000).toFixed(2)}K` :
                 amount.toFixed(amount < 1 ? 4 : 2)}
              </div>
              {usdVal != null && (
                <div className="text-[10px] text-muted">{fmtUsd(usdVal)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── NFT grid ──────────────────────────────────────────────────────────────────
function NFTGrid({ nftData, lang }: { nftData: any; lang: Lang }) {
  const items: any[] = nftData?.nft_items || [];
  if (!items.length) return (
    <div className="text-center py-8 text-muted text-sm">{t("wallet.no_nfts", lang)}</div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((nft, i) => {
        const name    = nft.metadata?.name || `NFT #${i + 1}`;
        const image   = nft.previews?.find((p: any) => p.resolution === "100x100")?.url
                     || nft.previews?.[0]?.url
                     || nft.metadata?.image || null;
        const coll    = nft.collection?.name || null;
        const floor   = nft.sale?.price?.value ? nanoToTon(nft.sale.price.value) : null;

        return (
          <a key={i}
            href={`https://tonviewer.com/${nft.address}`} target="_blank" rel="noopener"
            style={{
              display: "block", textDecoration: "none",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,255,255,0.12)",
              borderRadius: 4,
              overflow: "hidden",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,255,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,255,0.12)"; }}
          >
            {/* NFT image */}
            <div style={{ aspectRatio: "1", background: "rgba(0,136,204,0.08)", position: "relative" }}>
              {image ? (
                <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon style={{ width: 32, height: 32, color: "rgba(0,255,255,0.2)" }} />
                </div>
              )}
            </div>
            {/* NFT info */}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#00FFFF", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {name}
              </div>
              {coll && (
                <div style={{ fontSize: 9, color: "rgba(207,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coll}</div>
              )}
              {floor != null && (
                <div style={{ fontSize: 10, color: "#FFD700", marginTop: 4 }}>⚡ {fmtTon(floor)} TON</div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── Transactions ───────────────────────────────────────────────────────────────
function TxPanel({ txData, address, lang }: { txData: any; address: string; lang: Lang }) {
  const events: any[] = txData?.events || [];
  if (!events.length) return (
    <div className="text-center py-8 text-muted text-sm">{t("wallet.no_txs", lang)}</div>
  );

  return (
    <div className="space-y-2">
      {events.slice(0, 20).map((ev, i) => {
        const ts      = ev.timestamp ? new Date(ev.timestamp * 1000) : null;
        const actions = ev.actions || [];
        const isOut   = ev.is_scam === false && actions.some((a: any) => a?.ton_transfer?.sender?.address === address);
        const action  = actions[0];
        let amount = null, counterpart = null;

        if (action?.ton_transfer) {
          amount = nanoToTon(action.ton_transfer.amount || 0);
          counterpart = isOut ? action.ton_transfer.recipient?.address : action.ton_transfer.sender?.address;
        } else if (action?.jetton_transfer) {
          const jt = action.jetton_transfer;
          const dec = jt.jetton?.decimals ?? 9;
          amount = (Number(jt.amount) / Math.pow(10, dec));
          counterpart = isOut ? jt.recipient?.address : jt.sender?.address;
        }

        const evType = action?.type || "Unknown";

        return (
          <div key={i} className="flex items-center gap-3 p-3"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,255,255,0.07)", borderRadius: 4 }}>
            {/* Direction icon */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: isOut ? "rgba(255,51,85,0.15)" : "rgba(0,255,136,0.15)" }}>
              {isOut
                ? <ArrowUpRight className="w-4 h-4" style={{ color: "#FF3355" }} />
                : <ArrowDownLeft className="w-4 h-4" style={{ color: "#00FF88" }} />}
            </div>

            {/* Tx info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold" style={{ color: isOut ? "#FF3355" : "#00FF88" }}>
                {isOut ? t("wallet.tx_sent", lang) : t("wallet.tx_received", lang)}
                {" · "}
                <span style={{ color: "rgba(207,255,255,0.5)", fontWeight: "normal" }}>
                  {evType.replace("TonTransfer", "TON").replace("JettonTransfer", "Jetton").replace("NftItemTransfer", "NFT")}
                </span>
              </div>
              {counterpart && (
                <div className="text-[10px] font-mono text-muted">{shortAddr(counterpart)}</div>
              )}
              {ts && (
                <div className="text-[10px] text-muted">{ts.toLocaleString("uk")}</div>
              )}
            </div>

            {/* Amount */}
            {amount != null && (
              <div className="text-right shrink-0">
                <div className="font-mono text-sm font-bold" style={{ color: isOut ? "#FF3355" : "#00FF88" }}>
                  {isOut ? "−" : "+"}{amount.toFixed(amount < 1 ? 4 : 2)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Send TON panel ────────────────────────────────────────────────────────────
function SendTonPanel({ balance, lang, toast }: { balance: number | null; lang: Lang; toast: any }) {
  const [tonConnectUI] = useTonConnectUI();
  const [to,      setTo]      = useState("");
  const [amount,  setAmount]  = useState("");
  const [comment, setComment] = useState("");
  const [busy,    setBusy]    = useState(false);
  const [ok,      setOk]      = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!to.trim() || !amt || amt < 0.01) return;
    haptic("medium");
    setBusy(true);
    setOk(false);
    try {
      const nanoAmt = Math.floor(amt * 1e9).toString();
      const payload: any = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: to.trim(),
          amount: nanoAmt,
          ...(comment.trim() ? {
            payload: btoa(
              "\x00\x00\x00\x00" +
              Array.from(new TextEncoder().encode(comment.trim())).map(b => String.fromCharCode(b)).join("")
            ),
          } : {}),
        }],
      };
      await tonConnectUI.sendTransaction(payload);
      setOk(true);
      haptic("success");
      toast({ title: t("wallet.send_success", lang) });
      setTo(""); setAmount(""); setComment("");
    } catch (err: any) {
      haptic("error");
      toast({ title: `× ${err?.message || t("common.error", lang)}`, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div style={{ padding: "12px 16px", background: "rgba(0,136,204,0.07)", border: "1px solid rgba(0,136,204,0.25)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
        <Send className="w-5 h-5 shrink-0" style={{ color: "#0088CC" }} />
        <div>
          <div className="text-sm font-bold" style={{ color: "#0088CC" }}>{t("wallet.send_title", lang)}</div>
          {balance != null && (
            <div className="text-[10px] text-muted">{t("wallet.total_balance", lang)}: {fmtTon(balance)} TON</div>
          )}
        </div>
      </div>

      {/* Recipient */}
      <div>
        <label className="block text-[11px] tracking-widest text-muted mb-1.5 font-bold">
          {t("wallet.send_to", lang).toUpperCase()}
        </label>
        <input
          type="text"
          value={to}
          onChange={e => setTo(e.target.value)}
          required
          placeholder={t("wallet.send_addr_hint", lang)}
          className="titan-input w-full font-mono text-xs"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-[11px] tracking-widest text-muted mb-1.5 font-bold">
          {t("wallet.send_amount", lang).toUpperCase()}
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="titan-input flex-1 font-mono text-sm"
            style={{ fontFamily: "'Space Mono', monospace" }}
          />
          <span className="text-sm font-bold" style={{ color: "#0088CC" }}>TON</span>
        </div>
        <div className="text-[9px] text-muted mt-0.5">{t("wallet.send_min", lang)}</div>
        {/* Quick amount buttons */}
        <div className="flex gap-1.5 mt-2">
          {["0.5", "1", "5", "10"].map(q => (
            <button key={q} type="button"
              onClick={() => setAmount(q)}
              className="titan-btn titan-btn-sm text-[10px]"
              style={{ padding: "2px 8px", opacity: amount === q ? 1 : 0.6 }}>
              {q}
            </button>
          ))}
          {balance != null && (
            <button type="button"
              onClick={() => setAmount(Math.max(0, balance - 0.05).toFixed(4))}
              className="titan-btn titan-btn-sm text-[10px]"
              style={{ padding: "2px 8px" }}>
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-[11px] tracking-widest text-muted mb-1.5 font-bold">
          {t("wallet.send_comment", lang).toUpperCase()}
        </label>
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t("wallet.send_comment", lang)}
          maxLength={120}
          className="titan-input w-full text-xs"
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 rounded text-[10px]"
        style={{ background: "rgba(255,140,0,0.05)", border: "1px solid rgba(255,140,0,0.2)" }}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#FF8C00" }} />
        <span className="text-muted">{t("common.sign_in_wallet", lang)}</span>
      </div>

      {/* Submit */}
      <button type="submit" disabled={busy || !to.trim() || !amount}
        className="titan-btn w-full flex items-center justify-center gap-2 py-2.5"
        style={{
          background: "rgba(0,136,204,0.15)",
          border: "1px solid rgba(0,136,204,0.5)",
          color: "#0088CC",
          fontWeight: "bold",
          opacity: busy || !to.trim() || !amount ? 0.5 : 1,
        }}>
        {busy
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Send className="w-4 h-4" />}
        {busy ? t("common.loading", lang) : t("wallet.send_confirm", lang)}
      </button>

      {ok && (
        <div className="text-xs text-center p-2 rounded" style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "#00FF88" }}>
          ✓ {t("wallet.send_success", lang)}
        </div>
      )}
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type WalletTab = "overview" | "tokens" | "nfts" | "history" | "send";

export default function TonWalletPage() {
  const { lang } = useLang();
  const { toast } = useToast();
  const address = useTonAddress();
  const wallet  = useTonWallet();
  const [tab, setTab] = useState<WalletTab>("overview");

  const { data: account,  refetch: refAcct,   isFetching: loadAcct }  = useTonAccount(address || null);
  const { data: jettons,  refetch: refJettons, isFetching: loadJet }   = useTonJettons(address || null);
  const { data: nfts,     refetch: refNfts,    isFetching: loadNft }   = useTonNFTs(address || null);
  const { data: txs,      refetch: refTxs,     isFetching: loadTxs }   = useTonTransactions(address || null);
  const { data: priceData } = useTonPrice();

  const isLoading = loadAcct || loadJet || loadNft || loadTxs;

  const copy = (v: string) => {
    navigator.clipboard.writeText(v).catch(() => {});
    haptic("light");
    toast({ title: "✓ Скопійовано" });
  };

  const tonBalance = account?.balance != null ? nanoToTon(account.balance) : null;

  const tabs: { key: WalletTab; label: string; icon: any; count?: number }[] = [
    { key: "overview",  label: t("wallet.tab.overview", lang),  icon: Wallet },
    { key: "tokens",    label: t("wallet.tab.tokens", lang),    icon: CircleDollarSign, count: jettons?.balances?.length },
    { key: "nfts",      label: t("wallet.tab.nfts", lang),      icon: Gem,              count: nfts?.nft_items?.length },
    { key: "history",   label: t("wallet.tab.history", lang),   icon: History,          count: txs?.events?.length },
    { key: "send",      label: t("wallet.send_tab", lang),       icon: Send },
  ];

  return (
    <div className="titan-page">
      {/* Header */}
      <div className="titan-page-header">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6" style={{ color: "#0088CC" }} />
          <h1 className="titan-title">◈ {t("wallet.title", lang)}</h1>
        </div>
        <p className="titan-subtitle">{t("wallet.sub", lang)}</p>
      </div>

      {!address ? (
        <ConnectPrompt lang={lang} />
      ) : (
        <>
          {/* Balance card always visible */}
          <div className="mb-4">
            <BalanceCard
              address={address}
              account={account}
              priceData={priceData}
              lang={lang}
              onCopy={copy}
            />
          </div>

          {/* Refresh bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-muted tracking-widest">
              {wallet && `${(wallet as any).device?.appName ?? "Wallet"} · `}
              {address ? shortAddr(address) : ""}
            </div>
            <button
              onClick={() => { refAcct(); refJettons(); refNfts(); refTxs(); haptic("light"); }}
              disabled={isLoading}
              className="titan-btn titan-btn-sm flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              {t("btn.refresh", lang)}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b overflow-x-auto" style={{ borderColor: "rgba(0,136,204,0.2)" }}>
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors ${tab === key ? "border-b-2" : "text-muted hover:text-primary"}`}
                style={tab === key ? { color: "#0088CC", borderColor: "#0088CC" } : {}}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count != null && count > 0 && (
                  <span className="ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                    style={{ background: tab === key ? "rgba(0,136,204,0.2)" : "rgba(0,255,255,0.08)", color: tab === key ? "#0088CC" : "rgba(207,255,255,0.5)" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="titan-card">
            {tab === "overview" && (
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: CircleDollarSign, label: t("wallet.tab.tokens", lang), value: jettons?.balances?.length ?? "—", color: "#00FFFF" },
                    { icon: Gem,              label: "NFT",                         value: nfts?.nft_items?.length ?? "—",   color: "#9B5CFF" },
                    { icon: History,          label: t("wallet.tx_count", lang),    value: txs?.events?.length ?? "—",       color: "#FF8C00" },
                    { icon: ShieldCheck,      label: t("wallet.status", lang),      value: account?.status === "active" ? "✓ OK" : "—", color: "#00FF88" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="text-center p-3 rounded"
                      style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                      <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
                      <div className="text-[10px] text-muted">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Top tokens preview */}
                {(jettons?.balances?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted tracking-widest">{t("wallet.top_tokens", lang)}</span>
                      <button onClick={() => setTab("tokens")} className="text-[10px] text-primary hover:underline">{t("wallet.see_all", lang)}</button>
                    </div>
                    <JettonsPanel jettonsData={{ balances: jettons?.balances?.slice(0, 5) }} tonPrice={priceData ?? undefined} lang={lang} />
                  </div>
                )}

                {/* Recent tx preview */}
                {(txs?.events?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted tracking-widest">{t("wallet.recent_txs", lang)}</span>
                      <button onClick={() => setTab("history")} className="text-[10px] text-primary hover:underline">{t("wallet.see_all", lang)}</button>
                    </div>
                    <TxPanel txData={{ events: txs?.events?.slice(0, 5) }} address={address} lang={lang} />
                  </div>
                )}
              </div>
            )}

            {tab === "tokens" && (
              <JettonsPanel jettonsData={jettons} tonPrice={priceData ?? undefined} lang={lang} />
            )}

            {tab === "nfts" && (
              <NFTGrid nftData={nfts} lang={lang} />
            )}

            {tab === "history" && (
              <TxPanel txData={txs} address={address} lang={lang} />
            )}

            {tab === "send" && (
              <SendTonPanel balance={tonBalance} lang={lang} toast={toast} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
