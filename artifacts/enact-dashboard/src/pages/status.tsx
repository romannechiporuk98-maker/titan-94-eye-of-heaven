import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, Zap, DollarSign, Eye, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api = (p: string) => `${BASE}/api${p}`;

function usePoll(path: string, ms = 5000) {
  return useQuery({ queryKey: [path], queryFn: () => fetch(api(path)).then(r => r.json()), refetchInterval: ms });
}

const CYCLE_ICONS: Record<string, any> = { SCAN: Eye, HEAL: Zap, LEARN: Brain, FINANCE: DollarSign };
const CYCLE_COLORS: Record<string, string> = { SCAN: "text-primary", HEAL: "text-safe", LEARN: "text-amber", FINANCE: "text-danger" };

export default function StatusPage() {
  const qc = useQueryClient();
  const { data: stats }  = usePoll("/agent/stats", 4000);
  const { data: cycles } = usePoll("/agent/cycles", 4000);
  const { data: act }    = usePoll("/activity?limit=8", 6000);

  const scan = useMutation({
    mutationFn: () => fetch(api("/agent/scan"), { method: "POST" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries(); },
  });

  const accuracy = stats ? (parseFloat(stats.accuracy || stats.aiAccuracy || "0.847") * 100).toFixed(1) : "84.7";
  const cyclesArr = cycles ? Object.values(cycles) : [];

  const severityColor: Record<string, string> = {
    critical: "text-danger", high: "text-danger", medium: "text-amber",
    success: "text-safe", info: "text-primary", low: "text-muted",
  };

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ AGENT STATUS</h1>
        <div className="flex items-center gap-2">
          <span className="titan-pulse" />
          <span className="text-safe text-sm font-mono">ONLINE</span>
          <button className="titan-btn titan-btn-sm ml-2" onClick={() => scan.mutate()} disabled={scan.isPending}>
            <RefreshCw className={`w-3 h-3 mr-1 ${scan.isPending ? "animate-spin" : ""}`} />SCAN
          </button>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
        {[
          { label: "ЦИКЛИ СКАНУВАННЯ", value: stats?.cycles ?? "...", icon: Eye,      color: "text-primary" },
          { label: "AI ТОЧНІСТЬ",       value: `${accuracy}%`,         icon: Brain,    color: "text-safe"    },
          { label: "ВРАЗЛИВОСТЕЙ",      value: stats?.threats?.total ?? "...", icon: Shield, color: "text-danger" },
          { label: "ЗАЛІКУВАВ",          value: stats?.threatsHealed ?? "...", icon: Zap,    color: "text-amber"  },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="titan-card text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Heartbeat Cycles */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <span className="titan-label">HEARTBEAT — 4 АВТОНОМНИХ ЦИКЛИ</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cyclesArr.map((c: any) => {
            const Icon = CYCLE_ICONS[c.name] || Activity;
            const color = CYCLE_COLORS[c.name] || "text-primary";
            const lastRun = c.lastRun ? new Date(c.lastRun).toLocaleTimeString() : "—";
            return (
              <div key={c.name} className="titan-cycle-card">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="titan-badge titan-badge-safe text-xs">ACTIVE</span>
                </div>
                <div className={`font-bold text-sm ${color}`}>{c.name}</div>
                <div className="text-xs text-muted mt-1">every {c.interval}</div>
                <div className="text-xs text-muted">runs: {c.cycles}</div>
                <div className="text-xs text-muted truncate">last: {lastRun}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="titan-card text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-safe" />
          <div className="text-xl font-bold text-safe">{stats?.knowledgeSize ?? "24"}</div>
          <div className="text-xs text-muted">KNOWLEDGE BASE</div>
        </div>
        <div className="titan-card text-center">
          <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold text-primary">{stats?.uptime ? Math.floor(parseFloat(stats.uptime) / 60) : 0}m</div>
          <div className="text-xs text-muted">UPTIME</div>
        </div>
        <div className="titan-card text-center">
          <Shield className="w-5 h-5 mx-auto mb-1 text-amber" />
          <div className="text-xl font-bold text-amber">{stats?.threats?.critical ?? 0}</div>
          <div className="text-xs text-muted">CRITICAL</div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <span className="titan-label">ACTIVITY FEED</span>
        </div>
        <div className="space-y-2">
          {(act?.activity || []).map((a: any, i: number) => (
            <div key={i} className="titan-activity-row">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-xs font-bold font-mono w-16 shrink-0 ${severityColor[a.severity] || "text-muted"}`}>[{a.type}]</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{a.title}</div>
                  <div className="text-xs text-muted truncate">{a.message}</div>
                </div>
              </div>
              <div className="text-xs text-muted shrink-0 ml-2">
                {new Date(a.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {(!act?.activity || act.activity.length === 0) && (
            <div className="text-center text-muted text-sm py-4">Очікую активності...</div>
          )}
        </div>
      </div>
    </div>
  );
}
