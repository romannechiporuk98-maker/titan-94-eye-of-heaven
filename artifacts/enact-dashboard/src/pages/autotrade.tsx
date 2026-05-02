import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Play, Pause, X, Plus, Zap, Shield,
  Target, Activity, Crosshair, BarChart3, Loader2, AlertTriangle, Crown,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

type Strategy = "arbitrage" | "sniper" | "momentum" | "dca";
type Risk = "low" | "medium" | "high" | "yolo";

const STRATEGY_ICONS = { arbitrage: BarChart3, sniper: Crosshair, momentum: TrendingUp, dca: Target };
const STRATEGY_COLORS = { arbitrage: "#00FFFF", sniper: "#FF3355", momentum: "#FF8C00", dca: "#00FF88" };
const RISK_COLORS: Record<Risk, string> = { low: "#00FF88", medium: "#FFD700", high: "#FF8C00", yolo: "#FF3355" };

export default function AutoTradePage() {
  const tg = useMemo(() => getTgUser(), []);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openWizard, setOpenWizard] = useState(false);

  const { data: meta }      = useQuery<any>({ queryKey: ["/autotrade/meta"], queryFn: () => fetch(api("/autotrade/meta")).then(r => r.json()) });
  const { data: price }     = useQuery<any>({ queryKey: ["/autotrade/price"], queryFn: () => fetch(api("/autotrade/price")).then(r => r.json()), refetchInterval: 30000 });
  const { data: stats }     = useQuery<any>({ queryKey: ["/autotrade/stats"], queryFn: () => fetch(api("/autotrade/stats")).then(r => r.json()), refetchInterval: 5000 });
  const { data: positions } = useQuery<any>({ queryKey: [`/autotrade/positions?owner=${tg.id}`], queryFn: () => fetch(api(`/autotrade/positions?owner=${tg.id}`)).then(r => r.json()), refetchInterval: 5000 });

  const open = useMutation({
    mutationFn: (b: any) => fetch(api("/autotrade/open"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...b, ownerTgId: tg.id }) }).then(r => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); haptic("error"); return; }
      toast({ title: `✓ Стратегію ${d.strategy.toUpperCase()} активовано · ${d.depositTon} TON` }); haptic("success");
      setOpenWizard(false);
      qc.invalidateQueries();
    },
  });
  const closePos = useMutation({
    mutationFn: (id: string) => fetch(api(`/autotrade/${id}/close`), { method: "POST" }).then(r => r.json()),
    onSuccess: (d) => { toast({ title: `✓ Закрито · ${d.finalTon?.toFixed(4)} TON повернуто на баланс` }); haptic("success"); qc.invalidateQueries(); },
  });
  const togglePos = useMutation({
    mutationFn: ({ id, paused }: { id: string; paused: boolean }) => fetch(api(`/autotrade/${id}/pause`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused, reason: "manual" }) }).then(r => r.json()),
    onSuccess: () => { haptic("light"); qc.invalidateQueries(); },
  });
  const runNow = useMutation({
    mutationFn: () => fetch(api("/autotrade/run-cycle"), { method: "POST" }).then(r => r.json()),
    onSuccess: (d) => { toast({ title: `⚡ Cycle: ${d.trades} trades · ${d.healed} healed` }); qc.invalidateQueries(); },
  });

  const list: any[] = positions?.positions || [];

  return (
    <div className="titan-page titan-grid-bg">
      {/* HERO */}
      <div className="relative overflow-hidden p-5 mb-5 rounded-lg" style={{
        background: "linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,255,0.06), rgba(255,140,0,0.10))",
        border: "1px solid rgba(0,255,136,0.3)",
      }}>
        <div className="absolute top-0 right-0 opacity-10"><Activity className="w-48 h-48 text-safe" /></div>
        <div className="relative flex justify-between items-start gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-safe/70 mb-1">MODULE 07 · SELF-HEALING TRADING ENGINE</div>
            <h1 className="text-3xl font-bold" style={{
              background: "linear-gradient(90deg, #00FF88, #00FFFF, #FF8C00)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ АВТОТРЕЙДИНГ ON-CHAIN</h1>
            <p className="text-xs text-muted mt-1">4 стратегії · 4 рівні ризику · self-heal після 5 збитків · auto-sync з блокчейном</p>
            <div className="flex gap-3 mt-3">
              <button onClick={() => setOpenWizard(true)} className="titan-btn titan-btn-amber">
                <Plus className="w-4 h-4 mr-1" /> ВІДКРИТИ ПОЗИЦІЮ
              </button>
              <button onClick={() => runNow.mutate()} disabled={runNow.isPending} className="titan-btn">
                {runNow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />} RUN CYCLE
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted tracking-widest">TON · LIVE</div>
            <div className="text-3xl font-bold text-safe titan-counter" key={price?.ton_usdt}>${price?.ton_usdt?.toFixed(4) || "—"}</div>
            <div className="text-[10px] text-muted">STON.fi ${price?.stonfi_ton_usdt?.toFixed(4) || "—"}</div>
            <div className="text-[10px] text-muted">DeDust ${price?.dedust_ton_usdt?.toFixed(4) || "—"}</div>
            {price?.binance_ton_usdt && <div className="text-[10px] text-amber">Binance ${price.binance_ton_usdt?.toFixed(4)}</div>}
            <div className="text-[10px] text-amber">spread {price?.spread_bps?.toFixed(0) || 0} bps</div>
          </div>
        </div>
      </div>

      {/* GLOBAL P&L */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiTile label="POSITIONS"      value={stats?.positions ?? 0}                          sub={`${stats?.activePositions ?? 0} active`} icon={Target} color="#00FFFF" />
        <KpiTile label="TOTAL DEPOSIT"  value={`${(stats?.totalDeposit ?? 0).toFixed(4)} TON`} sub={`≈ $${((stats?.totalDeposit ?? 0) * (price?.ton_usdt || 0)).toFixed(2)}`} icon={Shield} color="#FF8C00" />
        <KpiTile label="CURRENT VALUE"  value={`${(stats?.totalCurrent ?? 0).toFixed(4)} TON`} sub={`≈ $${((stats?.totalCurrent ?? 0) * (price?.ton_usdt || 0)).toFixed(2)}`} icon={Crown} color="#9B5CFF" />
        <KpiTile label="TOTAL P&L"      value={`${(stats?.totalPnL ?? 0) >= 0 ? "+" : ""}${(stats?.totalPnL ?? 0).toFixed(4)} TON`} sub={`${(stats?.pnlPct ?? 0).toFixed(2)}%`} icon={(stats?.totalPnL ?? 0) >= 0 ? TrendingUp : TrendingDown} color={(stats?.totalPnL ?? 0) >= 0 ? "#00FF88" : "#FF3355"} />
      </div>

      {/* POSITIONS LIST */}
      {list.length === 0 ? (
        <div className="titan-live-card text-center py-12 mb-5">
          <Activity className="w-12 h-12 text-muted mx-auto mb-3 animate-pulse" />
          <p className="text-muted mb-2">У тебе ще нема активних позицій.</p>
          <p className="text-xs text-muted mb-4">Натисни "Відкрити позицію" — обери стратегію, рівень ризику та суму депозиту в TON.</p>
          <button onClick={() => setOpenWizard(true)} className="titan-btn titan-btn-amber">
            <Plus className="w-4 h-4 mr-1" /> СТАРТУВАТИ
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          {list.map((p) => <PositionCard key={p.id} pos={p} onClose={() => closePos.mutate(p.id)} onToggle={() => togglePos.mutate({ id: p.id, paused: !p.paused })} />)}
        </div>
      )}

      {/* HONEST DISCLAIMER */}
      <div className="titan-card text-xs" style={{ borderColor: "rgba(255,140,0,0.3)" }}>
        <div className="flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div className="text-muted">
            <strong className="text-amber">Чесний дисклеймер:</strong> Це paper-trading на реальних цінах STON.fi і DeDust. Реальна торгівля on-chain потребує підключеного TON Connect-гаманця і твого підпису для кожної транзакції — це наступний крок (in dev).
            Очікувані повернення: <span className="text-safe">DCA 5–15%/міс</span>, <span className="text-amber">ARBITRAGE 10–40%/міс</span>, <span className="text-amber">MOMENTUM 15–60%/міс</span>, <span className="text-red-400">SNIPER -50% / +200% (high vol)</span>. Обіцянки x10/день — нереалістичні і характерні для скам-проектів. TITAN-94 не обіцяє неможливого.
          </div>
        </div>
      </div>

      {/* WIZARD */}
      {openWizard && meta && <Wizard meta={meta} onCancel={() => setOpenWizard(false)} onSubmit={(b) => open.mutate(b)} />}
    </div>
  );
}

function KpiTile({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="titan-live-card p-4">
      <div className="flex justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-muted">{label}</div>
          <div className="text-2xl font-bold mt-1 titan-counter" style={{ color }} key={String(value)}>{value}</div>
          <div className="text-[10px] text-muted mt-1">{sub}</div>
        </div>
        <Icon className="w-7 h-7 opacity-40" style={{ color }} />
      </div>
    </div>
  );
}

function PositionCard({ pos, onClose, onToggle }: { pos: any; onClose: () => void; onToggle: () => void }) {
  const Icon = (STRATEGY_ICONS as any)[pos.strategy] || Activity;
  const col  = (STRATEGY_COLORS as any)[pos.strategy] || "#00FFFF";
  const pnlPos = pos.pnlTon >= 0;
  const winRate = pos.trades ? Math.round((pos.wins / pos.trades) * 100) : 0;
  const data = (pos.history || []).slice(0, 30).reverse().map((h: any, i: number) => ({ i, p: h.price }));

  return (
    <div className="titan-live-card p-4" style={{ borderColor: col + "55" }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: col }} />
          <div>
            <div className="font-bold text-sm" style={{ color: col }}>{pos.strategy.toUpperCase()}</div>
            <div className="text-[10px] text-muted">risk: <span className="font-bold" style={{ color: RISK_COLORS[pos.risk as Risk] }}>{pos.risk.toUpperCase()}</span> · {pos.id.slice(0, 12)}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onToggle} className="text-amber" title={pos.paused ? "Resume" : "Pause"}>
            {pos.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="text-red-400" title="Close (cash out)"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div><div className="text-[9px] text-muted">DEPOSIT</div><div className="text-sm font-bold">{pos.depositTon.toFixed(4)} TON</div></div>
        <div><div className="text-[9px] text-muted">CURRENT</div><div className="text-sm font-bold">{pos.currentTon.toFixed(4)}</div></div>
        <div><div className="text-[9px] text-muted">P&L</div><div className={`text-sm font-bold ${pnlPos ? "text-safe" : "text-red-400"}`}>{pnlPos ? "+" : ""}{pos.pnlTon.toFixed(4)}<br/><span className="text-[9px]">{pos.pnlPct.toFixed(2)}%</span></div></div>
      </div>

      <div className="h-12 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${pos.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.5}/>
                <stop offset="100%" stopColor={col} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="p" stroke={col} fill={`url(#g-${pos.id})`} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
        <div><div className="text-muted">TRADES</div><div className="font-bold">{pos.trades}</div></div>
        <div><div className="text-muted">WIN%</div><div className="font-bold text-safe">{winRate}%</div></div>
        <div><div className="text-muted">STREAK</div><div className={`font-bold ${pos.consecutiveLosses > 2 ? "text-amber" : ""}`}>-{pos.consecutiveLosses}</div></div>
        <div><div className="text-muted">HEAL</div><div className="font-bold text-amber">{pos.selfHealCount}</div></div>
      </div>

      {pos.paused && (
        <div className="mt-2 text-[10px] p-2 border" style={{ borderColor: "rgba(255,140,0,0.4)", background: "rgba(255,140,0,0.05)", color: "#FF8C00" }}>
          ⏸ {pos.pausedReason}
        </div>
      )}
    </div>
  );
}

function Wizard({ meta, onCancel, onSubmit }: { meta: any; onCancel: () => void; onSubmit: (b: any) => void }) {
  const [strategy, setStrategy] = useState<Strategy>("arbitrage");
  const [risk, setRisk] = useState<Risk>("medium");
  const [deposit, setDeposit] = useState(1);
  const stratMeta = meta.strategies[strategy];
  const expectedRange = stratMeta?.expectedDailyBps?.[risk] || [0, 0];
  const projectedDay = (expectedRange[0] + expectedRange[1]) / 2;
  const projectedDayTon = deposit * (projectedDay / 10000);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="titan-live-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5" style={{ background: "#060F1A" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-amber" /> Відкрити позицію</h2>
          <button onClick={onCancel} className="text-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted mb-2 block">1. ОБЕРИ СТРАТЕГІЮ</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(meta.strategies) as Strategy[]).map((s) => {
              const m = meta.strategies[s];
              const Icon = (STRATEGY_ICONS as any)[s] || Activity;
              const col = (STRATEGY_COLORS as any)[s] || "#00FFFF";
              return (
                <button key={s} type="button" onClick={() => setStrategy(s)}
                  className="text-left p-3 border transition"
                  style={{
                    borderColor: strategy === s ? col : "rgba(0,255,255,0.15)",
                    background: strategy === s ? col + "10" : "transparent",
                  }}>
                  <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" style={{ color: col }} /><span className="font-bold text-sm" style={{ color: col }}>{m.name}</span></div>
                  <div className="text-[10px] text-muted">{m.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted mb-2 block">2. РІВЕНЬ РИЗИКУ</label>
          <div className="grid grid-cols-4 gap-2">
            {(meta.riskLevels as Risk[]).map((r) => {
              const range = stratMeta?.expectedDailyBps?.[r] || [0, 0];
              return (
                <button key={r} type="button" onClick={() => setRisk(r)}
                  className="text-center p-2 border transition"
                  style={{
                    borderColor: risk === r ? RISK_COLORS[r] : "rgba(0,255,255,0.15)",
                    background: risk === r ? RISK_COLORS[r] + "10" : "transparent",
                  }}>
                  <div className="font-bold text-xs uppercase" style={{ color: RISK_COLORS[r] }}>{r}</div>
                  <div className="text-[9px] text-muted">{(range[0] / 100).toFixed(2)}–{(range[1] / 100).toFixed(2)}% / day</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted mb-2 block">3. ДЕПОЗИТ (TON)</label>
          <div className="flex gap-2">
            <input type="number" step="0.1" min={0.1} max={10000}
              className="titan-input flex-1" value={deposit}
              onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} />
            {[1, 5, 10, 50, 100].map((amt) => (
              <button key={amt} type="button" onClick={() => setDeposit(amt)} className="titan-btn titan-btn-sm">{amt}</button>
            ))}
          </div>
        </div>

        <div className="titan-card mb-4 p-3" style={{ background: "rgba(0,255,136,0.04)" }}>
          <div className="text-xs text-muted mb-1">ОЧІКУВАНЕ ПОВЕРНЕННЯ</div>
          <div className="text-sm">
            ≈ <span className="text-safe font-bold">{projectedDayTon.toFixed(4)} TON / день</span> ·
            ≈ <span className="text-amber font-bold">{(projectedDayTon * 30).toFixed(4)} TON / місяць</span>
          </div>
          <div className="text-[10px] text-muted mt-1">Self-heal: позиція автоматично паузиться після 5 збитків поспіль і AI re-tune'ує параметри. Auto-resume через 10 хв.</div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="titan-btn flex-1">СКАСУВАТИ</button>
          <button type="button" onClick={() => onSubmit({ strategy, risk, depositTon: deposit })}
                  disabled={deposit <= 0} className="titan-btn titan-btn-amber flex-1">
            <Zap className="w-4 h-4 mr-1" /> АКТИВУВАТИ ({deposit} TON)
          </button>
        </div>
      </div>
    </div>
  );
}
