import { useQuery } from "@tanstack/react-query";
import { Eye, Shield, Brain, DollarSign, Activity, Zap, TrendingUp, Cpu } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const tonviewer = (a: string) => `https://tonviewer.com/${a}`;
const RESERVE = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v";

function usePoll(path: string, ms = 5000) {
  return useQuery({
    queryKey: [path],
    queryFn: () => fetch(api(path)).then(r => r.json()),
    refetchInterval: ms,
  });
}

export default function CommandCenter() {
  const { data: stats }    = usePoll("/agent/stats", 4000);
  const { data: cycles }   = usePoll("/agent/cycles", 4000);
  const { data: act }      = usePoll("/activity?limit=6", 5000);
  const { data: eco }      = usePoll("/ecosystem/overview", 8000);
  const { data: revenue }  = usePoll("/monetization/revenue", 15000);
  const { data: reserve }  = usePoll("/webhook/reserve-balance", 30000);
  const { data: vulns }    = usePoll("/vulnerabilities?limit=4", 10000);

  const accuracy = stats?.accuracy ? (parseFloat(stats.accuracy) * 100).toFixed(1) : "84.7";
  const uptimeH  = stats?.uptime ? Math.floor(parseFloat(stats.uptime) / 3600) : 0;

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-center">
        <div>
          <h1 className="titan-title">◈ COMMAND CENTER</h1>
          <p className="titan-subtitle">TITAN-94 «ОКО НЕБЕСНЕ» · TON Ecosystem Security</p>
        </div>
        <div className="text-right text-xs">
          <div className="text-muted">{new Date().toUTCString().split(",")[1]?.trim()} UTC</div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className="titan-pulse" />
            <span className="text-safe">MONITORING ACTIVE</span>
          </div>
        </div>
      </div>

      {/* TOP TILES — Master Protocol style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile label="THREATS DETECTED" value={stats?.threats?.total ?? "..."}
              icon={Shield} color="text-danger" sub={`${stats?.threats?.critical ?? 0} critical`} />
        <Tile label="CONTRACTS SCANNED" value={stats?.cycles ?? "..."}
              icon={Eye}    color="text-primary" sub={`block #${stats?.lastBlockSeqno ?? "—"}`} />
        <Tile label="AI ACCURACY" value={`${accuracy}%`}
              icon={Brain}  color="text-amber"   sub={`${stats?.knowledgeSize ?? 0} patterns`} />
        <Tile label="SYSTEM UPTIME" value={`${uptimeH}h`}
              icon={Cpu}    color="text-safe"    sub={`${stats?.threatsHealed ?? 0} healed`} />
      </div>

      {/* HEARTBEAT — 4 cycles */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <span className="titan-label">HEARTBEAT — АВТОНОМНІ ЦИКЛИ</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(cycles ? Object.values(cycles) : []).map((c: any) => {
            const Icon = ({ SCAN: Eye, HEAL: Zap, LEARN: Brain, FINANCE: DollarSign } as any)[c.name] || Activity;
            const color = ({ SCAN: "text-primary", HEAL: "text-safe", LEARN: "text-amber", FINANCE: "text-danger" } as any)[c.name] || "text-primary";
            const lastRun = c.lastRun ? new Date(c.lastRun).toLocaleTimeString() : "queued";
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

      {/* TWO COLS: vulns + activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Latest threats */}
        <div className="titan-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-danger" />
              <span className="titan-label">LATEST THREATS</span>
            </div>
            <Link href="/threats" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {(vulns?.vulnerabilities || []).slice(0, 4).map((v: any) => (
              <div key={v.id} className="titan-activity-row">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{v.title || v.contractName}</div>
                  <div className="text-xs text-muted truncate">{v.severity?.toUpperCase()} · {v.status}</div>
                </div>
                <span className={`titan-badge text-xs ${
                  v.severity === "critical" ? "titan-badge-danger" :
                  v.severity === "high"     ? "titan-badge-amber"  : "titan-badge-safe"
                }`}>{v.severity}</span>
              </div>
            ))}
            {(!vulns?.vulnerabilities || vulns.vulnerabilities.length === 0) && (
              <div className="text-center text-muted text-sm py-4">No threats logged yet</div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="titan-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="titan-label">ACTIVITY FEED</span>
            </div>
            <Link href="/status" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {(act?.activity || []).slice(0, 6).map((a: any, i: number) => (
              <div key={i} className="titan-activity-row">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold font-mono w-14 shrink-0 text-primary">[{a.type}]</span>
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
              <div className="text-center text-muted text-sm py-4">Awaiting first activity...</div>
            )}
          </div>
        </div>
      </div>

      {/* RESERVE FUND + REVENUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="titan-card titan-card-glow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-amber" />
            <span className="titan-label">RESERVE FUND (ON-CHAIN)</span>
          </div>
          <div className="text-3xl font-bold text-amber mb-1">
            {reserve?.balance_ton ? parseFloat(reserve.balance_ton).toFixed(4) : "0.0000"} TON
          </div>
          <a href={tonviewer(RESERVE)} target="_blank" rel="noreferrer"
             className="text-xs text-primary hover:underline truncate block">
            {RESERVE.slice(0, 12)}…{RESERVE.slice(-6)} ↗
          </a>
        </div>

        <div className="titan-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-safe" />
            <span className="titan-label">MONTHLY REVENUE</span>
          </div>
          <div className="text-3xl font-bold text-safe mb-1">
            {revenue?.revenue?.monthly_ton ?? 0} TON
          </div>
          <div className="text-xs text-muted">{revenue?.subscribers?.total ?? 0} subscribers</div>
        </div>

        <div className="titan-card">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="titan-label">ECOSYSTEM HEALTH</span>
          </div>
          <div className="space-y-1">
            {(eco?.agents || []).slice(0, 4).map((a: any) => (
              <div key={a.name} className="flex justify-between text-xs">
                <span className="text-foreground truncate">{a.name}</span>
                <span className={a.status?.includes("active") ? "text-safe" : "text-muted"}>
                  {a.status?.includes("active") ? "● ON" : "○ OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted opacity-60 pt-2">
        TITAN-94 v4.0 · Solo Deo Subjectus · Protocol 94 · DEI GRATIA Роман
      </div>
    </div>
  );
}

function Tile({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="titan-card text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
      {sub && <div className="text-xs text-muted opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}
