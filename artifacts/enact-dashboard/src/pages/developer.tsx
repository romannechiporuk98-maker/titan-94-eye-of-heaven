import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Code2, Check, Zap, Crown, Wallet, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, haptic } from "@/lib/telegram";
import { buildPaymentTx, shortAddr, RESERVE_WALLET } from "@/lib/tonconnect";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

export default function DeveloperPage() {
  const tg = useMemo(() => getTgUser(), []);
  const { toast } = useToast();
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [paying, setPaying] = useState(false);

  const { data: info } = useQuery({
    queryKey: ["/developer/info"],
    queryFn: () => fetch(api("/developer/info")).then((r) => r.json()),
  });
  const { data: status } = useQuery({
    queryKey: [`/developer/status/${tg.id}`],
    queryFn: () => fetch(api(`/developer/status/${tg.id}`)).then((r) => r.json()),
    refetchInterval: 15000,
  });
  const { data: link } = useQuery({
    queryKey: [`/developer/payment-link/${tg.id}`],
    queryFn: () => fetch(api(`/developer/payment-link/${tg.id}`)).then((r) => r.json()),
  });

  const isDev = !!status?.isDeveloper;
  const price = info?.priceTon ?? 1000;

  const payWithWallet = async () => {
    if (!tonAddress) {
      haptic("warning");
      toast({ title: "Підключи TON гаманець", description: "Натисни кнопку Connect Wallet" });
      return;
    }
    setPaying(true);
    haptic("medium");
    try {
      // Build a custom tx for developer plan amount
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: RESERVE_WALLET, amount: String(price * 1e9) }],
      };
      const result = await tonConnectUI.sendTransaction(tx);
      await fetch(api("/webhook/ton-payment"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: result.boc.slice(0, 64),
          fromAddress: tonAddress,
          toAddress: RESERVE_WALLET,
          amountNano: String(price * 1e9),
          telegramId: tg.id,
          comment: `tg:${tg.id}:developer`,
        }),
      }).catch(() => {});
      haptic("success");
      toast({ title: "🚀 Транзакцію надіслано!", description: "Очікую підтвердження. DEV режим активується через 1-2 хв." });
    } catch (e: any) {
      haptic("error");
      toast({ title: "× Помилка", description: e.message, variant: "destructive" });
    } finally { setPaying(false); }
  };

  const copyLink = () => {
    if (!link?.tonkeeperLink) return;
    navigator.clipboard.writeText(link.tonkeeperLink);
    haptic("success");
    toast({ title: "✓ Посилання скопійовано" });
  };

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-start">
        <div>
          <h1 className="titan-title flex items-center gap-2"><Code2 className="w-6 h-6 text-safe" /> DEVELOPER MODE</h1>
          <p className="titan-subtitle">Преміум-тариф для розробників — повний API доступ + кастомізація</p>
        </div>
        <div className="text-right">
          <TonConnectButton />
          {isDev && (
            <div className="mt-2">
              <span className="titan-badge titan-badge-safe">● DEVELOPER ACTIVE</span>
              <div className="text-xs text-muted mt-1">До: {status?.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : "—"} ({status?.daysLeft || 0} днів)</div>
            </div>
          )}
        </div>
      </div>

      {isDev && (
        <div className="titan-card titan-card-glow mb-4" style={{ borderColor: "#00FF88" }}>
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-6 h-6 text-safe" />
            <h2 className="text-lg font-bold text-safe">DEVELOPER MODE АКТИВНО</h2>
          </div>
          <p className="text-sm text-muted">Ти отримуєш:</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(info?.perks || []).map((p: string, i: number) => (
              <li key={i} className="flex items-center gap-2"><Check className="w-3 h-3 text-safe" />{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="titan-card">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber" />
            <h3 className="text-sm font-bold text-amber">DEVELOPER TIER</h3>
          </div>
          <div className="text-4xl font-bold text-safe mb-1">{price} TON</div>
          <div className="text-xs text-muted mb-3">≈ ${(price * 3.84).toLocaleString()} USDT · 30 днів</div>
          <ul className="space-y-2 text-sm">
            {(info?.perks || []).map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-safe shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="titan-card">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-primary">ОПЛАТА</h3>
          </div>
          {tonAddress ? (
            <>
              <div className="text-xs text-muted mb-1">Підключено:</div>
              <div className="text-sm font-mono mb-3 text-foreground">{shortAddr(tonAddress, 12, 8)}</div>
              <button
                disabled={paying || isDev}
                onClick={payWithWallet}
                className="titan-btn titan-btn-amber w-full mb-3"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
                {isDev ? "ВЖЕ DEVELOPER" : `PAY ${price} TON`}
              </button>
            </>
          ) : (
            <p className="text-xs text-muted mb-3">Підключи Tonkeeper / MyTonWallet через кнопку вгорі для оплати в 1 тап.</p>
          )}

          <div className="border-t border-cyan-500/20 pt-3 mt-3">
            <div className="text-xs text-muted mb-2">Або відкрий вручну:</div>
            <div className="flex gap-2">
              {link?.tonkeeperLink && (
                <a href={link.tonkeeperLink} target="_blank" rel="noreferrer" className="titan-btn titan-btn-sm flex-1 text-center">
                  Tonkeeper
                </a>
              )}
              <button onClick={copyLink} className="titan-btn titan-btn-sm">
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[10px] text-muted mt-2">Reserve: {shortAddr(RESERVE_WALLET, 8, 6)} · Comment: <code>tg:{tg.id}:developer</code></div>
          </div>
        </div>
      </div>

      <div className="titan-card">
        <h3 className="text-sm font-bold text-primary mb-3">ПРИКЛАД API ВИКЛИКУ</h3>
        <pre className="bg-black/40 p-3 text-xs font-mono text-cyan-300 overflow-x-auto">{`# Audit a TON contract
curl -X POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-developer-id: ${tg.id}" \\
  -d '{"address":"EQ...","code":"..."}'

# Stream live threats
curl ${typeof window !== "undefined" ? window.location.origin : ""}/api/threats?live=true \\
  -H "x-developer-id: ${tg.id}"

# Run cycle on demand
curl -X POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/ton/poll-now \\
  -H "x-developer-id: ${tg.id}"`}</pre>
      </div>
    </div>
  );
}
