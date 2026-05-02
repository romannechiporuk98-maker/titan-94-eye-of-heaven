import { useState, useMemo } from "react";
import { useLang, t } from "@/lib/ui-prefs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy, Users, TrendingUp, Zap, DollarSign, ArrowDownToLine,
  Shield, Star, Sparkles, Crown, Send, Wallet,
} from "lucide-react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, haptic } from "@/lib/telegram";
import { buildPaymentTx, shortAddr, RESERVE_WALLET } from "@/lib/tonconnect";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (path: string) => `${BASE}/api${path}`;

function usePoll(path: string | null, ms = 10000) {
  return useQuery({
    queryKey: [path],
    queryFn: () => fetch(api(path!)).then(r => r.json()),
    refetchInterval: ms,
    enabled: !!path,
  });
}

export default function EarnPage() {
  const { lang } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const tg = useMemo(() => getTgUser(), []);
  const TG_ID = tg.id;

  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawing, setWithdrawing]   = useState(false);
  const [subscribing, setSubscribing]   = useState<string | null>(null);
  const [paying, setPaying]             = useState<string | null>(null);

  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const { data: arb }       = usePoll("/arbitrage", 8000);
  const { data: billing }   = usePoll(`/billing/balance/${TG_ID}`, 8000);
  const { data: refs }      = usePoll(`/auth/referrals/${TG_ID}`, 30000);
  const { data: revenue }   = usePoll("/monetization/revenue", 20000);
  const { data: autoEarn }  = usePoll("/billing/auto-earn/stats", 15000);
  const { data: myEarn }    = usePoll(`/billing/auto-earn/${TG_ID}`, 12000);
  const { data: subStatus } = usePoll(`/monetization/status/${TG_ID}`, 20000);

  const refLink = `https://t.me/Titan_94_agent_bot?start=ref${TG_ID}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      haptic("success");
      toast({ title: t("page.earn.copied", lang), description: t("page.earn.ref_copy", lang) });
    });
  };

  const copyReserve = () => {
    navigator.clipboard.writeText(RESERVE_WALLET).then(() => {
      haptic("light");
      toast({ title: "✅ Адресу скопійовано!" });
    });
  };

  const withdraw = async () => {
    if (!withdrawAddr.trim()) {
      haptic("error");
      return toast({ title: "Вкажи TON адресу!", variant: "destructive" });
    }
    setWithdrawing(true);
    haptic("medium");
    try {
      const r = await fetch(api("/billing/withdraw"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: TG_ID, ton_address: withdrawAddr, amount: balance }),
      });
      const d = await r.json();
      if (d.success) {
        haptic("success");
        toast({ title: `✅ Виведено ${d.withdrawn_ton} TON!`, description: d.tx_note });
        qc.invalidateQueries({ queryKey: [`/billing/balance/${TG_ID}`] });
      } else {
        haptic("error");
        toast({ title: "Помилка", description: d.error, variant: "destructive" });
      }
    } catch (e: any) {
      haptic("error");
      toast({ title: "Мережа", description: e.message, variant: "destructive" });
    } finally { setWithdrawing(false); }
  };

  const payWithWallet = async (plan: "pro" | "elite") => {
    if (!tonAddress) {
      haptic("warning");
      toast({ title: "Підключи TON гаманець", description: "Натисни кнопку 'Connect Wallet' вище" });
      return;
    }
    setPaying(plan);
    haptic("medium");
    try {
      const tx = buildPaymentTx(plan, TG_ID);
      const result = await tonConnectUI.sendTransaction(tx);
      // Notify backend so it can speed up activation
      await fetch(api("/webhook/ton-payment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: result.boc.slice(0, 64),
          fromAddress: tonAddress,
          toAddress: RESERVE_WALLET,
          amountNano: String((plan === "pro" ? 5 : 20) * 1e9),
          telegramId: TG_ID,
          comment: `tg:${TG_ID}:${plan}`,
        }),
      }).catch(() => {});
      haptic("success");
      toast({
        title: `🚀 Транзакцію надіслано!`,
        description: "Очікую підтвердження в мережі (1-2 хв). Підписка активується автоматично.",
      });
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: [`/monetization/status/${TG_ID}`] });
        qc.invalidateQueries({ queryKey: [`/billing/auto-earn/${TG_ID}`] });
      }, 5000);
    } catch (e: any) {
      haptic("error");
      if (String(e?.message || "").toLowerCase().includes("reject")) {
        toast({ title: "Транзакцію відхилено", description: "Користувач скасував у гаманці", variant: "destructive" });
      } else {
        toast({ title: "Помилка платежу", description: e.message || "Невідома", variant: "destructive" });
      }
    } finally { setPaying(null); }
  };

  const subscribe = async (plan: "pro" | "elite") => {
    setSubscribing(plan);
    haptic("medium");
    try {
      const r = await fetch(api("/monetization/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: TG_ID, plan }),
      });
      const d = await r.json();
      if (d.success || d.subscriber) {
        haptic("success");
        toast({
          title: `🚀 ${plan.toUpperCase()} активовано!`,
          description: d.note || `Дійсно до ${d.expiresAt || "30 днів"}`,
        });
        qc.invalidateQueries({ queryKey: [`/monetization/status/${TG_ID}`] });
        qc.invalidateQueries({ queryKey: [`/billing/auto-earn/${TG_ID}`] });
      } else if (d.payment_required) {
        haptic("warning");
        toast({
          title: `Оплати ${d.amount_ton} TON`,
          description: `на ${RESERVE_WALLET.slice(0, 12)}... з коментарем "${d.payment_comment}"`,
        });
      } else {
        haptic("error");
        toast({ title: "Помилка", description: d.error || "Невідома", variant: "destructive" });
      }
    } catch (e: any) {
      haptic("error");
      toast({ title: "Мережа", description: e.message, variant: "destructive" });
    } finally { setSubscribing(null); }
  };

  const refCount   = refs?.referrals?.length || refs?.total || 0;
  const refToElite = Math.max(0, 10 - refCount);
  const balance    = parseFloat(billing?.balance_ton || billing?.balance || "0");
  const opps       = arb?.opportunities || arb?.data?.opportunities || [];
  const myAutoEarn = parseFloat(myEarn?.autoEarnTotal || "0");
  const myPlan     = subStatus?.plan || myEarn?.plan || "free";
  const isElite    = myPlan === "elite";
  const isPro      = myPlan === "pro";

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-start gap-3">
        <div>
          <h1 className="titan-title">◈ EARN TERMINAL</h1>
          <p className="titan-subtitle">Авто-заробіток · Реферали · Арбітраж · Withdraw</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TonConnectButton />
          <div className="text-right text-xs">
            <div className={`titan-badge ${tg.isReal ? "titan-badge-safe" : "titan-badge-amber"}`}>
              {tg.isReal ? "● TMA" : "◌ DEMO"}
            </div>
            <div className="text-muted mt-1 truncate max-w-[140px]">{tg.name}</div>
          </div>
        </div>
      </div>

      {/* ─── TON CONNECT WALLET ─── */}
      <div className="titan-card mb-4" style={{ borderColor: tonAddress ? "#00FF88" : "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className={`w-5 h-5 ${tonAddress ? "text-safe" : "text-muted"}`} />
            <span className="titan-label">TON CONNECT — ПЛАТЕЖІ В 1 ТАП</span>
          </div>
          <span className={`titan-badge ${tonAddress ? "titan-badge-safe" : ""}`}>
            {tonAddress ? "● CONNECTED" : "◌ NOT CONNECTED"}
          </span>
        </div>
        {tonAddress ? (
          <>
            <div className="text-sm text-foreground font-mono mb-3">{shortAddr(tonAddress, 10, 8)}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="titan-btn"
                onClick={() => payWithWallet("pro")}
                disabled={paying !== null}
              >
                <Zap className="w-4 h-4 mr-1" />
                Pay 5 TON · PRO {paying === "pro" && "..."}
              </button>
              <button
                className="titan-btn titan-btn-amber"
                onClick={() => payWithWallet("elite")}
                disabled={paying !== null}
              >
                <Crown className="w-4 h-4 mr-1" />
                Pay 20 TON · ELITE {paying === "elite" && "..."}
              </button>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Натисни — гаманець відкриється з готовою транзакцією. TON-POLLER підтвердить on-chain і активує підписку через 1-2 хв.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted">
            Підключи Tonkeeper / MyTonWallet / Tonhub через кнопку вгорі — і плати за PRO/ELITE одним тапом без копіювання адрес.
          </p>
        )}
      </div>

      {/* ─── AUTO-EARN PASSIVE YIELD ─── */}
      <div className="titan-card titan-card-glow mb-4" style={{ borderColor: isElite ? "#FFB800" : isPro ? "#00FFFF" : "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${isElite ? "text-amber" : isPro ? "text-primary" : "text-muted"}`} />
            <span className="titan-label">АВТОМАТИЧНИЙ ЗАРОБІТОК — кожні 6хв</span>
          </div>
          <span className={`titan-badge ${isElite ? "titan-badge-amber" : isPro ? "titan-badge-safe" : ""}`}>
            {myPlan.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="titan-stat-mini">
            <div className="text-lg font-bold text-amber">{myAutoEarn.toFixed(6)}</div>
            <div className="text-[10px] text-muted">МІЙ AUTO-EARN TON</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-lg font-bold text-safe">{myEarn?.nextEarn?.toFixed(4) || "0.0000"}</div>
            <div className="text-[10px] text-muted">ЗА НАСТУПНИЙ ЦИКЛ</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-lg font-bold text-primary">{myEarn?.autoEarnEvents || 0}</div>
            <div className="text-[10px] text-muted">ЦИКЛІВ ОТРИМАНО</div>
          </div>
        </div>

        {!isPro && !isElite && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              className="titan-btn"
              onClick={() => subscribe("pro")}
              disabled={subscribing !== null}
            >
              <Zap className="w-4 h-4 mr-1" />
              PRO · 5 TON/міс {subscribing === "pro" && "..."}
            </button>
            <button
              className="titan-btn titan-btn-amber"
              onClick={() => subscribe("elite")}
              disabled={subscribing !== null}
            >
              <Crown className="w-4 h-4 mr-1" />
              ELITE · 20 TON/міс {subscribing === "elite" && "..."}
            </button>
          </div>
        )}

        <div className="mt-3 text-[11px] text-muted">
          Загальний пул: <span className="text-foreground font-bold">{autoEarn?.perDayDistribution || "0"} TON/день</span>
          {" · "}
          {autoEarn?.activeSubscribers?.total || 0} активних
          {" · "}
          ELITE отримує {autoEarn?.perDay?.elite || "0.24"} TON/день, PRO — {autoEarn?.perDay?.pro || "0.072"} TON/день
        </div>
      </div>

      {/* ─── BALANCE + WITHDRAW ─── */}
      <div className="titan-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber" />
            <span className="titan-label">ЗАГАЛЬНИЙ БАЛАНС</span>
          </div>
          <span className="titan-badge titan-badge-safe">CPA 15% + AUTO-EARN</span>
        </div>
        <div className="text-4xl font-bold text-amber mb-1">{balance.toFixed(4)} TON</div>
        <div className="text-sm text-muted mb-3">≈ ${(balance * 3.84).toFixed(2)} USDT</div>

        <div className="flex gap-2">
          <input
            className="titan-input flex-1"
            placeholder="EQ... (TON адреса для виводу)"
            value={withdrawAddr}
            onChange={e => setWithdrawAddr(e.target.value)}
          />
          <button
            className="titan-btn titan-btn-amber"
            onClick={withdraw}
            disabled={withdrawing || balance < 0.5}
          >
            <ArrowDownToLine className="w-4 h-4 mr-1" />
            {withdrawing ? "..." : "ВИВЕСТИ"}
          </button>
        </div>
        {balance < 0.5 && <p className="text-xs text-muted mt-1">Мінімум 0.5 TON для виводу. Чекай поки auto-earn накопичить.</p>}
      </div>

      {/* ─── PAYMENT ADDRESS ─── */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Send className="w-5 h-5 text-primary" />
          <span className="titan-label">RESERVE FUND — куди платити за PRO/ELITE</span>
        </div>
        <div className="flex gap-2 items-center p-2 bg-card-inner border border-primary/20">
          <code className="text-xs text-primary flex-1 truncate font-mono">{RESERVE_WALLET}</code>
          <button className="titan-btn titan-btn-sm" onClick={copyReserve}>
            <Copy className="w-3 h-3 mr-1" />КОПІЮВАТИ
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Надішли 5 TON (PRO) або 20 TON (ELITE) з коментарем <code className="text-primary">tg:{TG_ID}</code> — webhook автоматично активує підписку.
        </p>
      </div>

      {/* ─── LEGION 10/10 REFERRAL ─── */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <span className="titan-label">LEGION 10/10 — РЕФЕРАЛЬНА ПРОГРАМА</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-primary">{refCount}</div>
            <div className="text-xs text-muted">ЗАПРОШЕНО</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-safe">{refCount}</div>
            <div className="text-xs text-muted">АКТИВНИХ</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-amber">{balance.toFixed(2)}</div>
            <div className="text-xs text-muted">TON ВСЬОГО</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">До 10 ДНІВ ELITE БЕЗКОШТОВНО</span>
            <span className="text-amber">{refCount}/10</span>
          </div>
          <div className="titan-progress-track">
            <div className="titan-progress-fill" style={{ width: `${Math.min(100, refCount * 10)}%` }} />
          </div>
          {refToElite > 0
            ? <p className="text-xs text-muted mt-1">Залишилось {refToElite} рефералів для 10 днів ELITE</p>
            : <p className="text-xs text-safe mt-1">🎉 ELITE розблоковано безкоштовно!</p>
          }
        </div>

        <div className="flex items-center gap-2 p-2 bg-card-inner border border-primary/20">
          <code className="text-xs text-primary flex-1 truncate">{refLink}</code>
          <button className="titan-btn titan-btn-sm" onClick={copyLink}>
            <Copy className="w-3 h-3 mr-1" />КОПІЮВАТИ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="titan-rule-card">
            <Star className="w-4 h-4 text-amber mb-1" />
            <div className="text-foreground font-medium">CPA 15%</div>
            <div className="text-muted">З кожної оплати реферала — миттєво на твій баланс</div>
          </div>
          <div className="titan-rule-card">
            <Shield className="w-4 h-4 text-safe mb-1" />
            <div className="text-foreground font-medium">72h Trial</div>
            <div className="text-muted">Кожен запрошений отримує 3 дні PRO безкоштовно</div>
          </div>
        </div>
      </div>

      {/* ─── ARBITRAGE ─── */}
      <div className="titan-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber" />
            <span className="titan-label">DEX АРБІТРАЖ — LIVE</span>
          </div>
          <span className="titan-badge titan-badge-amber">STON.fi × DeDust</span>
        </div>
        {opps.length === 0 ? (
          <div className="text-center text-muted py-4 text-sm">Сканую DEX пари...</div>
        ) : (
          <div className="space-y-2">
            {opps.slice(0, 5).map((opp: any, i: number) => (
              <div key={i} className="titan-activity-row">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-primary font-bold text-sm">{opp.pair || opp.token}</span>
                  <span className="text-xs text-muted">STON.fi → DeDust</span>
                </div>
                <div className="text-right">
                  <div className="text-safe font-bold text-sm">+{(opp.profit_pct || opp.profitPct || opp.spread_pct || 1.2).toFixed?.(2) || "1.20"}%</div>
                  <div className="text-xs text-muted">{(opp.profit_ton || opp.profitTon || 0.5).toFixed?.(3) || "0.500"} TON</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── REVENUE STATS ─── */}
      {revenue && (
        <div className="titan-card">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-safe" />
            <span className="titan-label">ПЛАТФОРМА — RECURRING REVENUE</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="titan-stat-mini">
              <div className="text-xl font-bold text-safe">{revenue.monthly_ton || 0} TON</div>
              <div className="text-[10px] text-muted">MRR</div>
            </div>
            <div className="titan-stat-mini">
              <div className="text-xl font-bold text-primary">{revenue.subscribers?.elite || 0}</div>
              <div className="text-[10px] text-muted">ELITE АКТИВНИХ</div>
            </div>
            <div className="titan-stat-mini">
              <div className="text-xl font-bold text-amber">{revenue.subscribers?.pro || 0}</div>
              <div className="text-[10px] text-muted">PRO АКТИВНИХ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
