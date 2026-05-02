import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { TrendingUp, Activity, Brain, Shield } from "lucide-react";
import { useLang, t } from "@/lib/ui-prefs";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 30000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

export default function AnalyticsPage() {
  const { lang } = useLang();
  const { data: chart }   = usePoll("/dashboard/chart", 30000);
  const { data: summary } = usePoll("/dashboard/summary", 8000);
  const { data: arb }     = usePoll("/arbitrage", 20000);

  const data = Array.isArray(chart) ? chart : [];
  const arbItems = arb?.opportunities || [];

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ {t("page.analytics.title", lang)}</h1>
        <p className="titan-subtitle">{t("page.analytics.sub", lang)}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="SCAN" value={summary?.scanCycles ?? 0} icon={Activity} color="text-primary" />
        <Stat label="HEAL" value={summary?.healCycles ?? 0} icon={Shield} color="text-safe" />
        <Stat label="LEARN" value={summary?.learnCycles ?? 0} icon={Brain} color="text-amber" />
        <Stat label={t("common.accuracy", lang)} value={`${summary?.accuracyPct ?? "0"}%`} icon={TrendingUp} color="text-safe" />
      </div>

      {/* Activity chart */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <span className="titan-label">{t("page.analytics.24h", lang)}</span>
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#00FFFF" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00FFFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#00FF88" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLearn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#FFB800" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#FF4466" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FF4466" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,255,255,0.07)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke="rgba(207,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(207,255,255,0.4)" fontSize={10} />
              <Tooltip contentStyle={{ background: "#060F1A", border: "1px solid rgba(0,255,255,0.3)", fontSize: 12 }} />
              <Area type="monotone" dataKey="scans"    stroke="#00FFFF" fill="url(#gScan)" strokeWidth={2} />
              <Area type="monotone" dataKey="heal"     stroke="#00FF88" fill="url(#gHeal)" strokeWidth={2} />
              <Area type="monotone" dataKey="analysis" stroke="#FFB800" fill="url(#gLearn)" strokeWidth={2} />
              <Area type="monotone" dataKey="threats"  stroke="#FF4466" fill="url(#gThreat)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arbitrage signals */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber" />
          <span className="titan-label">{t("page.analytics.arb", lang)} — STON.fi × DeDust</span>
        </div>
        <div className="space-y-2">
          {arbItems.length === 0 && (
            <div className="text-center text-muted text-sm py-4">{t("common.scanning", lang)}</div>
          )}
          {arbItems.slice(0, 8).map((o: any, i: number) => (
            <div key={i} className="titan-activity-row">
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{o.pair}</div>
                <div className="text-xs text-muted">
                  {o.dex_a}: ${o.price_a?.toFixed(4)} → {o.dex_b}: ${o.price_b?.toFixed(4)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${parseFloat(o.spread_pct) > 1 ? "text-safe" : "text-amber"}`}>
                  +{parseFloat(o.spread_pct).toFixed(2)}%
                </div>
                <div className="text-xs text-muted">spread</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="titan-card text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
