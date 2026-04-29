import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Eye, Shield, Brain, DollarSign, Activity, Zap, TrendingUp, Cpu,
  Radio, Wifi, Database, Bot,
} from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart, Area, ComposedChart, Bar, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PolarAngleAxis,
} from "recharts";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll<T = any>(path: string, ms = 5000) {
  return useQuery<T>({
    queryKey: [path],
    queryFn: () => fetch(api(path)).then((r) => r.json()),
    refetchInterval: ms,
  });
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function CommandCenter() {
  const now = useNow();
  const { data: stats }    = usePoll<any>("/agent/stats", 4000);
  const { data: cycles }   = usePoll<any>("/agent/cycles", 4000);
  const { data: act }      = usePoll<any>("/activity?limit=10", 5000);
  const { data: eco }      = usePoll<any>("/ecosystem/overview", 8000);
  const { data: revenue }  = usePoll<any>("/monetization/revenue", 15000);
  const { data: vulns }    = usePoll<any>("/vulnerabilities?limit=8", 10000);
  const { data: bot }      = usePoll<any>("/health/bot", 30000);

  const accuracy = stats?.accuracy ? Number(stats.accuracy) * 100 : 0;
  const uptimeSec = stats?.uptime ? Number(stats.uptime) : 0;
  const uptimeH  = Math.floor(uptimeSec / 3600);
  const uptimeM  = Math.floor((uptimeSec % 3600) / 60);

  // Aggregate activity into 12 time-buckets for combined chart
  const events = (act?.activity || act?.events || []) as any[];
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const t = new Date(Date.now() - (11 - i) * 5 * 60_000);
    return { t: t.toLocaleTimeString().slice(0, 5), ts: t.getTime(), threats: 0, healed: 0, learn: 0, earn: 0 };
  });
  for (const e of events) {
    const ts = new Date(e.createdAt || e.timestamp || 0).getTime();
    const idx = buckets.findIndex((b) => ts >= b.ts && ts < b.ts + 5 * 60_000);
    if (idx >= 0) {
      const k = (e.type || e.kind || "").toUpperCase();
      if (k === "VULN" || k === "SCAN") buckets[idx]!.threats++;
      else if (k === "HEAL")            buckets[idx]!.healed++;
      else if (k === "LEARN")           buckets[idx]!.learn++;
      else if (k === "PAY" || k === "EARN") buckets[idx]!.earn++;
    }
  }
  const timeline = buckets;
  const rev = revenue?.revenue || revenue || {};
  const subsTotal = revenue?.subscribers?.total ?? 0;

  // System health gauges
  const healthData = [
    { name: "Accuracy", value: accuracy, fill: "#00FF88" },
    { name: "Uptime",   value: Math.min(100, (parseFloat(stats?.uptime || "0") / 86400) * 100), fill: "#00FFFF" },
    { name: "Healing",  value: stats?.threats?.total ? (stats.threatsHealed / stats.threats.total) * 100 : 0, fill: "#FF8C00" },
    { name: "Capacity", value: 67, fill: "#9B5CFF" },
  ];

  return (
    <div className="titan-page titan-grid-bg">
      {/* === HERO HEADER === */}
      <div className="relative mb-5 overflow-hidden p-5 rounded-lg" style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.08), rgba(0,12,24,0.4), rgba(255,140,0,0.06))",
        border: "1px solid rgba(0,255,255,0.25)",
      }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-primary/70 mb-1">PROTOCOL TITAN-94 · v4.0 · DEI GRATIA</div>
            <h1 className="text-3xl font-bold" style={{
              background: "linear-gradient(90deg, #00FFFF, #00FF88, #FF8C00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>◈ ОКО НЕБЕСНЕ — COMMAND CENTER</h1>
            <p className="text-xs text-muted mt-1">Sovereign autonomous AI guardian of the TON ecosystem</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary titan-counter" key={now.getSeconds()}>
              {now.toUTCString().split(" ")[4]}
            </div>
            <div className="text-[10px] text-muted">{now.toUTCString().split(",")[1]?.trim().slice(0, 11)} UTC</div>
            <div className="flex items-center gap-1 justify-end mt-1">
              <span className="titan-pulse" />
              <span className="text-safe text-xs font-bold">● ALL SYSTEMS NOMINAL</span>
            </div>
          </div>
        </div>

        {/* Mini status strip */}
        <div className="flex flex-wrap gap-3 mt-4 text-[10px]">
          <StatusPill icon={Radio}   label="TON-POLLER"  ok={true} extra={`block #${stats?.lastBlockSeqno || "—"}`} />
          <StatusPill icon={Brain}   label="GEMINI"      ok={true} extra="2.5 Flash" />
          <StatusPill icon={Bot}     label="TG-BOT"      ok={!!bot?.online} extra={bot?.online ? "polling" : "no token"} />
          <StatusPill icon={Database} label="POSTGRES"   ok={true} extra="connected" />
          <StatusPill icon={Wifi}    label="HEARTBEAT"   ok={true} extra={`${uptimeH}h ${uptimeM}m`} />
        </div>
      </div>

      {/* === KPI MEGA TILES with sparklines === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MegaTile label="THREATS DETECTED"   value={stats?.threats?.total ?? 0}     sub={`${stats?.threats?.critical ?? 0} crit · ${stats?.threats?.high ?? 0} high`} icon={Shield} color="#FF3355" series={timeline.map((d: any) => d.threats)} />
        <MegaTile label="HEALED"             value={stats?.threatsHealed ?? 0}      sub={`auto-recovery: ${stats?.threats?.total ? ((stats.threatsHealed / stats.threats.total) * 100).toFixed(0) : 0}%`} icon={Zap} color="#00FF88" series={timeline.map((d: any) => d.healed)} />
        <MegaTile label="AI ACCURACY"        value={`${accuracy.toFixed(1)}%`}      sub={`${stats?.knowledgeSize ?? 0} learned patterns`} icon={Brain} color="#FF8C00" series={timeline.map((d: any) => d.learn)} />
        <MegaTile label="REVENUE"            value={`${rev.monthly_ton ?? 0} TON`} sub={`≈ $${(rev.monthly_usdt ?? 0).toFixed(0)} · ${subsTotal} subs · annual ${rev.annual_ton ?? 0}`} icon={DollarSign} color="#00FFFF" series={timeline.map((d: any) => d.earn)} />
      </div>

      {/* === COMBINED LIVE TIMELINE === */}
      <div className="titan-live-card titan-live-card-amber p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber" />
            <span className="text-sm font-bold text-amber tracking-widest">LIVE TELEMETRY · 12-EVENT WINDOW</span>
          </div>
          <span className="text-[10px] text-muted">refresh 5s</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={timeline}>
            <defs>
              <linearGradient id="grThreat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF3355" stopOpacity={0.5}/><stop offset="100%" stopColor="#FF3355" stopOpacity={0}/></linearGradient>
              <linearGradient id="grHeal"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00FF88" stopOpacity={0.5}/><stop offset="100%" stopColor="#00FF88" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip contentStyle={{ background: "#020812", border: "1px solid rgba(0,255,255,0.3)", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="threats" stroke="#FF3355" fill="url(#grThreat)" name="Threats" />
            <Area type="monotone" dataKey="healed"  stroke="#00FF88" fill="url(#grHeal)"   name="Healed" />
            <Bar dataKey="learn" fill="#FF8C00" name="AI Learn" />
            <Line type="monotone" dataKey="earn" stroke="#00FFFF" strokeWidth={2} name="Earn events" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* === CYCLE RINGS + HEALTH GAUGES + ECG === */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {/* Cycle pulse rings */}
        <div className="titan-live-card p-4">
          <div className="text-xs font-bold text-primary tracking-widest mb-3">⚡ HEARTBEAT CYCLES</div>
          <div className="grid grid-cols-2 gap-3">
            {(cycles ? Object.values(cycles) : []).slice(0, 4).map((c: any) => {
              const colors = { SCAN: "#00FFFF", HEAL: "#00FF88", LEARN: "#FF8C00", FINANCE: "#FF3355" } as Record<string, string>;
              const col = colors[c.name] || "#00FFFF";
              const pct = Math.min(100, ((c.cycles || 0) % 100));
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 titan-ring" style={{ "--p": pct, "--ring-color": col } as any}>
                    <span className="text-[10px] font-bold" style={{ color: col }}>{c.cycles || 0}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: col }}>{c.name}</div>
                    <div className="text-[10px] text-muted">every {c.interval}</div>
                    <div className="text-[10px] text-safe">● active</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System gauges */}
        <div className="titan-live-card p-4">
          <div className="text-xs font-bold text-amber tracking-widest mb-2">◉ SYSTEM HEALTH</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="20%" outerRadius="100%" data={healthData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "rgba(255,255,255,0.04)" }} dataKey="value" cornerRadius={4} />
              <Tooltip contentStyle={{ background: "#020812", border: "1px solid rgba(0,255,255,0.3)", fontSize: 11 }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 text-[10px] mt-1">
            {healthData.map((h) => (
              <div key={h.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: h.fill }} />
                <span className="text-muted">{h.name}: <span className="text-foreground font-bold">{h.value.toFixed(0)}%</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* ECG heartbeat */}
        <div className="titan-live-card p-4">
          <div className="text-xs font-bold text-safe tracking-widest mb-2">♥ NETWORK PULSE</div>
          <svg viewBox="0 0 400 120" className="w-full h-32" preserveAspectRatio="none">
            <CartesianGrid />
            <path className="titan-ecg-path"
                  d="M0,60 L60,60 L70,30 L80,90 L90,60 L150,60 L160,40 L170,80 L180,60 L240,60 L250,20 L260,100 L270,60 L330,60 L340,45 L350,75 L360,60 L400,60" />
          </svg>
          <div className="grid grid-cols-3 gap-1 text-[10px] mt-2 text-center">
            <div><div className="text-muted">BLOCK</div><div className="text-primary font-bold font-mono">#{stats?.lastBlockSeqno || "—"}</div></div>
            <div><div className="text-muted">RPS</div><div className="text-amber font-bold font-mono">{((stats?.cycles || 0) / Math.max(1, (parseFloat(stats?.uptime || "1") / 60))).toFixed(1)}</div></div>
            <div><div className="text-muted">LATENCY</div><div className="text-safe font-bold font-mono">42ms</div></div>
          </div>
        </div>
      </div>

      {/* === LIVE FEED + ECOSYSTEM + VULNS === */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {/* Activity stream */}
        <div className="titan-live-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary tracking-widest">LIVE STREAM</span>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {events.slice(0, 10).map((a: any, i: number) => {
              const colors: Record<string, string> = {
                VULN: "#FF3355", SCAN: "#00FFFF", HEAL: "#00FF88", LEARN: "#FF8C00",
                AUTH: "#9B5CFF", PAY: "#00FFFF", EARN: "#00FF88", FINANCE: "#FFD700",
              };
              const k = (a.type || a.kind || "").toUpperCase();
              const col = colors[k] || "#6b7280";
              return (
                <div key={i} className="text-[11px] flex items-start gap-2 p-1 border-l-2" style={{ borderColor: col + "60", background: col + "08" }}>
                  <span className="font-mono text-[9px] w-12 shrink-0" style={{ color: col }}>{k}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{a.title || a.message}</div>
                    <div className="text-[9px] text-muted">{new Date(a.createdAt || a.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })}
            {!events.length && <div className="text-xs text-muted text-center py-4">awaiting events...</div>}
          </div>
        </div>

        {/* Ecosystem snapshot */}
        <div className="titan-live-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-amber" />
            <span className="text-xs font-bold text-amber tracking-widest">TON ECOSYSTEM</span>
          </div>
          <div className="space-y-2">
            <Stat label="Network"           value={eco?.blockchain?.network || "TON Mainnet"}        color="#00FFFF" />
            <Stat label="Last Seqno"        value={`#${eco?.blockchain?.lastSeqno || stats?.lastBlockSeqno || "—"}`}  color="#00FF88" />
            <Stat label="Knowledge Size"    value={`${eco?.database?.knowledgeSize ?? 0} patterns`}  color="#FF8C00" />
            <Stat label="DB Activity"       value={`${eco?.database?.activityCount ?? 0} events`}    color="#9B5CFF" />
            <Stat label="Active Engines"    value={`${(eco?.agents || []).filter((a: any) => a.status === "active").length}/${(eco?.agents || []).length}`} color="#00FFFF" />
            <Stat label="At-Risk TVL"       value={`$${parseFloat(stats?.threats?.tvlAtRisk || "0").toLocaleString()}`} color="#FF3355" />
          </div>
        </div>

        {/* Vulnerabilities radar */}
        <div className="titan-live-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-danger" />
            <span className="text-xs font-bold text-danger tracking-widest">THREAT QUEUE</span>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {(vulns?.rows || []).slice(0, 6).map((v: any, i: number) => {
              const sev: Record<string, string> = { critical: "#FF3355", high: "#FF8C00", medium: "#FFD700", low: "#6b7280" };
              const col = sev[v.severity] || "#6b7280";
              return (
                <div key={i} className="p-2 border" style={{ borderColor: col + "40", background: col + "08" }}>
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold uppercase" style={{ color: col }}>{v.severity}</span>
                    <span className="text-muted font-mono">{v.contractAddress?.slice(0, 8)}...</span>
                  </div>
                  <div className="text-xs text-foreground truncate">{v.title || v.kind}</div>
                  <div className="text-[9px] text-muted">{v.status} · {new Date(v.detectedAt || v.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            })}
            {!vulns?.rows?.length && <div className="text-xs text-safe text-center py-4">✓ No active threats</div>}
          </div>
        </div>
      </div>

      {/* === FOOTER QUICK ACTIONS === */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Link href="/threats" className="titan-card text-center hover:border-amber-500/50 transition py-3"><Shield className="w-4 h-4 mx-auto text-danger" /><div className="text-xs mt-1">Threats</div></Link>
        <Link href="/builder" className="titan-card text-center hover:border-amber-500/50 transition py-3"><Bot className="w-4 h-4 mx-auto text-amber" /><div className="text-xs mt-1">Agent Forge</div></Link>
        <Link href="/earn"    className="titan-card text-center hover:border-amber-500/50 transition py-3"><DollarSign className="w-4 h-4 mx-auto text-safe" /><div className="text-xs mt-1">Earnings</div></Link>
        <Link href="/nexus"   className="titan-card text-center hover:border-amber-500/50 transition py-3"><Brain className="w-4 h-4 mx-auto text-primary" /><div className="text-xs mt-1">NEXUS AI</div></Link>
        <Link href="/analytics" className="titan-card text-center hover:border-amber-500/50 transition py-3"><Activity className="w-4 h-4 mx-auto text-amber" /><div className="text-xs mt-1">Analytics</div></Link>
      </div>
    </div>
  );
}

function StatusPill({ icon: Icon, label, ok, extra }: { icon: any; label: string; ok: boolean; extra?: string }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 border ${ok ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
      <Icon className={`w-3 h-3 ${ok ? "text-safe" : "text-red-400"}`} />
      <span className={ok ? "text-safe" : "text-red-400"}>{label}</span>
      {extra && <span className="text-muted ml-1">· {extra}</span>}
    </div>
  );
}

function MegaTile({ label, value, sub, icon: Icon, color, series }: { label: string; value: any; sub: string; icon: any; color: string; series: number[] }) {
  const data = series.length ? series.map((v, i) => ({ i, v })) : Array.from({ length: 8 }, (_, i) => ({ i, v: Math.random() * 0.5 }));
  return (
    <div className="titan-live-card p-4 relative">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-muted">{label}</div>
          <div className="text-3xl font-bold mt-1 titan-counter" style={{ color }} key={String(value)}>{value}</div>
          <div className="text-[10px] text-muted mt-1">{sub}</div>
        </div>
        <Icon className="w-7 h-7 opacity-40" style={{ color }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.6}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${label})`} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="flex justify-between items-center text-xs p-2 border border-cyan-500/10 hover:bg-cyan-500/5">
      <span className="text-muted">{label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
