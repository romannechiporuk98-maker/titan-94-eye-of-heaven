import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Copy, Users, TrendingUp, Zap, DollarSign, ArrowDownToLine, Shield, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api = (path: string) => `${BASE}/api${path}`;
const TG_ID = "demo_user";

function usePoll(path: string, ms = 10000) {
  return useQuery({ queryKey: [path], queryFn: () => fetch(api(path)).then(r => r.json()), refetchInterval: ms });
}

export default function EarnPage() {
  const { toast } = useToast();
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawing, setWithdrawing]   = useState(false);

  const { data: arb }      = usePoll("/arbitrage", 8000);
  const { data: billing }  = usePoll(`/billing/balance/${TG_ID}`, 15000);
  const { data: refs }     = usePoll(`/auth/referrals/${TG_ID}`, 30000);
  const { data: revenue }  = usePoll("/monetization/revenue", 20000);

  const refLink = `https://t.me/Titan_94_agent_bot?start=ref${TG_ID}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() =>
      toast({ title: "✅ Скопійовано!", description: "Реферальне посилання в буфері обміну" })
    );
  };

  const withdraw = async () => {
    if (!withdrawAddr.trim()) return toast({ title: "Вкажи TON адресу!", variant: "destructive" });
    setWithdrawing(true);
    try {
      const r = await fetch(api("/billing/withdraw"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: TG_ID, ton_address: withdrawAddr, amount: billing?.balance_ton }),
      });
      const d = await r.json();
      if (d.success) toast({ title: `✅ Виведено ${d.withdrawn_ton} TON!`, description: d.tx_note });
      else toast({ title: "Помилка", description: d.error, variant: "destructive" });
    } finally { setWithdrawing(false); }
  };

  const refCount  = refs?.referrals?.length || 0;
  const refToElite = Math.max(0, 10 - refCount);
  const balance    = parseFloat(billing?.balance_ton || "0");
  const opps       = arb?.opportunities || arb?.data?.opportunities || [];

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ EARN TERMINAL</h1>
        <p className="titan-subtitle">Реферали · Арбітраж · Sniper · Bounty</p>
      </div>

      {/* Balance Card */}
      <div className="titan-card titan-card-glow mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber" />
            <span className="titan-label">МІЙ БАЛАНС РЕФЕРАЛІВ</span>
          </div>
          <span className="titan-badge titan-badge-safe">CPA 15%</span>
        </div>
        <div className="text-4xl font-bold text-amber mb-1">{balance.toFixed(4)} TON</div>
        <div className="text-sm text-muted mb-4">≈ ${(balance * 3.84).toFixed(2)} USDT</div>

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
        {balance < 0.5 && <p className="text-xs text-muted mt-1">Мінімум 0.5 TON для виводу</p>}
      </div>

      {/* Legion 10/10 */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <span className="titan-label">LEGION 10/10 — РЕФЕРАЛЬНА ПРОГРАМА</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-primary">{refCount}</div>
            <div className="text-xs text-muted">ЗАПРОШЕНО</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-safe">{Math.max(0, refCount - 0)}</div>
            <div className="text-xs text-muted">АКТИВНИХ</div>
          </div>
          <div className="titan-stat-mini">
            <div className="text-2xl font-bold text-amber">{balance.toFixed(2)}</div>
            <div className="text-xs text-muted">TON ЗАРОБЛЕНО</div>
          </div>
        </div>

        {/* Progress to ELITE */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">До 10 ДНІВ ELITE БЕЗКОШТОВНО</span>
            <span className="text-amber">{refCount}/10</span>
          </div>
          <div className="titan-progress-track">
            <div className="titan-progress-fill" style={{ width: `${Math.min(100, refCount * 10)}%` }} />
          </div>
          {refToElite > 0
            ? <p className="text-xs text-muted mt-1">Залишилось {refToElite} рефералів для 10 днів ELITE (~7 TON)</p>
            : <p className="text-xs text-safe mt-1">🎉 ELITE розблоковано! Дякую за участь у Legion!</p>
          }
        </div>

        {/* Ref link */}
        <div className="flex items-center gap-2 p-3 bg-card-inner border border-primary/20">
          <code className="text-xs text-primary flex-1 truncate">{refLink}</code>
          <button className="titan-btn titan-btn-sm" onClick={copyLink}>
            <Copy className="w-3 h-3 mr-1" />КОПІЮВАТИ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="titan-rule-card">
            <Star className="w-4 h-4 text-amber mb-1" />
            <div className="text-foreground font-medium">CPA 15%</div>
            <div className="text-muted">З кожної оплати реферала — миттєво на твій баланс</div>
          </div>
          <div className="titan-rule-card">
            <Shield className="w-4 h-4 text-safe mb-1" />
            <div className="text-foreground font-medium">72h Trial</div>
            <div className="text-muted">Кожен запрошений отримує 3 дні PRO-доступу безкоштовно</div>
          </div>
        </div>
      </div>

      {/* Arbitrage signals */}
      <div className="titan-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber" />
            <span className="titan-label">DEX АРБІТРАЖ — LIVE СИГНАЛИ</span>
          </div>
          <span className="titan-badge titan-badge-amber">STON.fi × DeDust</span>
        </div>

        {opps.length === 0 ? (
          <div className="text-center text-muted py-6 text-sm">Сканую DEX пари...</div>
        ) : (
          <div className="space-y-2">
            {opps.slice(0, 5).map((opp: any, i: number) => (
              <div key={i} className="titan-arb-row">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-primary font-bold text-sm">{opp.pair || opp.token}</span>
                  <span className="text-xs text-muted">STON.fi→DeDust</span>
                </div>
                <div className="text-right">
                  <div className="text-safe font-bold text-sm">+{opp.profit_pct?.toFixed(2) || opp.profitPct?.toFixed(2) || "1.2"}%</div>
                  <div className="text-xs text-muted">{opp.profit_ton?.toFixed(3) || opp.profitTon?.toFixed(3) || "0.5"} TON</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sniper Alert */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-danger" />
          <span className="titan-label">SNIPER ALERT — ELITE FEATURE</span>
          <span className="titan-badge titan-badge-danger">ELITE ONLY</span>
        </div>
        <p className="text-sm text-muted mb-3">
          TITAN-94 сканує нові токени. ELITE-юзери отримують сповіщення через 10 сек після появи.
          Якщо TITAN ставить «SAFE» — ти купуєш першим.
        </p>
        <div className="titan-locked-overlay">
          <Shield className="w-8 h-8 text-amber mx-auto mb-2" />
          <div className="text-amber font-bold">Потрібен ELITE план</div>
          <div className="text-xs text-muted">20 TON/міс або 10 рефералів Legion</div>
        </div>
      </div>

      {/* Platform stats */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-safe" />
          <span className="titan-label">ПЛАТФОРМНА СТАТИСТИКА</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{revenue?.subscribers?.total || 1}</div>
            <div className="text-xs text-muted">КОРИСТУВАЧІВ</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-safe">{revenue?.revenue?.monthly_ton || 20} TON</div>
            <div className="text-xs text-muted">МІСЯЧНИЙ ДОХІД</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber">{revenue?.subscribers?.elite || 1}</div>
            <div className="text-xs text-muted">ELITE MEMBERS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
