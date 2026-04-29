import { useQuery } from "@tanstack/react-query";
import { Heart, Zap, Shield, Activity, CheckCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 5000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

export default function ImmunePage() {
  const { data: stats }  = usePoll("/agent/stats", 4000);
  const { data: cycles } = usePoll("/agent/cycles", 4000);
  const { data: vulns }  = usePoll("/vulnerabilities?limit=20", 6000);
  const { data: act }    = usePoll("/activity?limit=20", 5000);

  const all      = vulns?.vulnerabilities || [];
  const active   = all.filter((v: any) => v.status === "active").length;
  const healing  = all.filter((v: any) => v.status === "healing").length;
  const healed   = all.filter((v: any) => v.status === "healed").length;
  const total    = all.length || 1;
  const healPct  = ((healed / total) * 100).toFixed(0);

  const healCycle = cycles?.HEAL || cycles?.heal || {};
  const healEvents = (act?.activity || []).filter((a: any) =>
    a.type === "HEAL" || a.title?.toLowerCase().includes("heal")
  );

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ IMMUNE SYSTEM</h1>
        <p className="titan-subtitle">Auto-healing · самовідновлення вразливостей</p>
      </div>

      {/* Vital signs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Vital label="HEALED" value={healed} icon={CheckCircle} color="text-safe" />
        <Vital label="HEALING" value={healing} icon={Zap} color="text-amber" />
        <Vital label="ACTIVE THREATS" value={active} icon={Shield} color="text-danger" />
        <Vital label="HEAL RATE" value={`${healPct}%`} icon={Heart} color="text-primary" />
      </div>

      {/* HEAL cycle status */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-safe titan-pulse" />
          <span className="titan-label">HEAL CYCLE — IMMUNE RESPONSE</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-safe">{healCycle.cycles ?? 0}</div>
            <div className="text-xs text-muted">CYCLES RUN</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{healCycle.interval ?? "5 min"}</div>
            <div className="text-xs text-muted">INTERVAL</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-amber">
              {healCycle.lastRun ? new Date(healCycle.lastRun).toLocaleTimeString() : "queued"}
            </div>
            <div className="text-xs text-muted">LAST RUN</div>
          </div>
        </div>

        {/* Health bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">SYSTEM HEALTH</span>
            <span className="text-safe">{healPct}%</span>
          </div>
          <div className="titan-progress-track">
            <div className="titan-progress-fill" style={{ width: `${healPct}%`, background: "#00FF88" }} />
          </div>
        </div>
      </div>

      {/* Healing log */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-safe" />
          <span className="titan-label">HEALING LOG</span>
        </div>
        <div className="space-y-2">
          {healEvents.length === 0 && (
            <div className="text-center text-muted text-sm py-6">Immune system idle — no threats to heal</div>
          )}
          {healEvents.map((e: any, i: number) => (
            <div key={i} className="titan-activity-row">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Heart className="w-3 h-3 text-safe shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{e.title}</div>
                  <div className="text-xs text-muted truncate">{e.message}</div>
                </div>
              </div>
              <div className="text-xs text-muted shrink-0">
                {new Date(e.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted opacity-60">
        Immune cycle runs every 5 minutes · auto-resolves matched vulnerabilities · Solo Deo Subjectus
      </div>
    </div>
  );
}

function Vital({ label, value, icon: Icon, color }: any) {
  return (
    <div className="titan-card text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
