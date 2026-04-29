/**
 * PROTOCOL-94 — hidden creator-only mirror page.
 * URL: /protocol-94 — accessible via direct link, NOT shown in nav.
 * Reflects every subsystem in real time. Commands: pulse, heal, kill-switch.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, Eye, Heart, Shield, AlertOctagon, Zap, Activity, Cpu,
  HardDrive, KeyRound, FileCheck, Loader2, Power, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const CREATOR_ID = "7255058720";

export default function Protocol94Page() {
  const tg = useMemo(() => getTgUser(), []);
  const isCreator = String(tg.id) === CREATOR_ID;
  const headers = { "x-telegram-id": String(tg.id), "Content-Type": "application/json" };
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/mirror/reflect"],
    queryFn: () => fetch(api("/mirror/reflect"), { headers }).then(r => r.json()),
    enabled: isCreator,
    refetchInterval: 5000,
  });

  const pulse = useMutation({
    mutationFn: () => fetch(api("/mirror/pulse"), { method: "POST", headers }).then(r => r.json()),
    onSuccess: () => { toast({ title: "✓ PULSE синхронізовано" }); haptic("success"); qc.invalidateQueries(); },
  });
  const heal = useMutation({
    mutationFn: () => fetch(api("/mirror/heal"), { method: "POST", headers }).then(r => r.json()),
    onSuccess: (d) => { toast({ title: `✓ Зцілено ${d.healedModules} модулів, знято ${d.clearedQuarantines} карантинів` }); haptic("success"); qc.invalidateQueries(); },
  });
  const kill = useMutation({
    mutationFn: (on: boolean) => fetch(api("/mirror/kill"), { method: "POST", headers, body: JSON.stringify({ on }) }).then(r => r.json()),
    onSuccess: (d) => { toast({ title: d.killSwitch ? "× KILL-SWITCH АКТИВНИЙ" : "✓ Захист знято", variant: d.killSwitch ? "destructive" : "default" }); haptic("warning"); qc.invalidateQueries(); },
  });

  if (!isCreator) {
    return (
      <div className="titan-page titan-grid-bg flex items-center justify-center min-h-[60vh]">
        <div className="titan-card text-center py-12 px-8 max-w-md">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" style={{ filter: "drop-shadow(0 0 20px #FF3355)" }} />
          <h2 className="text-2xl font-bold text-red-400 mb-2 tracking-widest">PROTOCOL · 94</h2>
          <p className="text-xs text-muted">Дзеркало доступне тільки творцю.<br/>TG ID: {tg.id}</p>
          <p className="text-[10px] text-muted/50 mt-4 tracking-widest">ACCESS DENIED · ORGANISM SHIELDED</p>
        </div>
      </div>
    );
  }

  const sentinel = data?.sentinel;
  const eye      = data?.eye;
  const integ    = data?.integrity || [];
  const secrets  = data?.secretsPresent || [];
  const orgState = data?.organism || "—";
  const killOn   = !!data?.killSwitch;

  const orgColor = orgState === "OPTIMAL" ? "#00FF88" : orgState === "DEGRADED" ? "#FF3355" : "#FF8C00";

  return (
    <div className="titan-page titan-grid-bg">
      {/* HERO */}
      <div className="relative overflow-hidden p-6 mb-5 rounded-lg" style={{
        background: "radial-gradient(ellipse at top right, rgba(255,51,85,0.15), transparent 60%), linear-gradient(135deg, rgba(0,255,255,0.08), rgba(155,92,255,0.08))",
        border: `1px solid ${orgColor}50`,
        boxShadow: `0 0 40px ${orgColor}20`,
      }}>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.6em] text-red-400/80 mb-1 flex items-center gap-2">
              <Eye className="w-3 h-3" /> CREATOR-ONLY · MIRROR LAYER
            </div>
            <h1 className="text-4xl font-bold tracking-tight" style={{
              background: `linear-gradient(90deg, ${orgColor}, #9B5CFF, #FF8C00)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ PROTOCOL · 94</h1>
            <p className="text-xs text-muted mt-1">Дзеркало організму. Бачу все. Виправляю все. Контролюю все.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted tracking-widest">ORGANISM</div>
            <div className="text-3xl font-bold" style={{ color: orgColor, filter: `drop-shadow(0 0 12px ${orgColor})` }}>{orgState}</div>
            {sentinel && <div className="text-[10px] text-muted">uptime {Math.floor((sentinel.uptime_s || 0) / 60)}m {Math.floor((sentinel.uptime_s || 0) % 60)}s</div>}
          </div>
        </div>

        {/* CMD BAR */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => pulse.mutate()}    disabled={pulse.isPending} className="titan-btn titan-btn-primary">
            {pulse.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1" /> PULSE</>}
          </button>
          <button onClick={() => heal.mutate()}     disabled={heal.isPending}  className="titan-btn titan-btn-amber">
            {heal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Heart className="w-3 h-3 mr-1" /> HEAL ALL</>}
          </button>
          <button onClick={() => { if (confirm(killOn ? "Вимкнути kill-switch?" : "АКТИВУВАТИ kill-switch? Усі публічні запити будуть заблоковані.")) kill.mutate(!killOn); }}
                  className="titan-btn" style={{
                    borderColor: killOn ? "#00FF88" : "#FF3355",
                    color: killOn ? "#00FF88" : "#FF3355",
                  }}>
            <Power className="w-3 h-3 mr-1" /> {killOn ? "LIFT KILL-SWITCH" : "ARM KILL-SWITCH"}
          </button>
        </div>
      </div>

      {isLoading && <div className="titan-card text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}

      {/* GRID */}
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <div className="titan-live-card p-3 col-span-1">
          <div className="flex items-center gap-2 text-xs mb-2"><Cpu className="w-4 h-4 text-primary" /><span className="font-bold">SENTINEL · CORE</span></div>
          {sentinel && (
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted">RSS</span><span>{sentinel.rss_mb} MB</span></div>
              <div className="flex justify-between"><span className="text-muted">Heap</span><span>{sentinel.heap_used_mb} MB</span></div>
              <div className="flex justify-between"><span className="text-muted">Caught errors</span><span className={sentinel.counters.caught_errors > 0 ? "text-amber" : "text-safe"}>{sentinel.counters.caught_errors}</span></div>
              <div className="flex justify-between"><span className="text-muted">Auto-heals</span><span className="text-safe">{sentinel.counters.auto_heals}</span></div>
              <div className="flex justify-between"><span className="text-muted">Rate-limited</span><span>{sentinel.counters.rate_limited}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tracked IPs</span><span>{sentinel.counters.tracked_ips}</span></div>
            </div>
          )}
        </div>

        <div className="titan-live-card p-3 col-span-1">
          <div className="flex items-center gap-2 text-xs mb-2"><Eye className="w-4 h-4 text-purple-400" /><span className="font-bold">ОКО БОГА</span></div>
          {eye && (
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted">Awareness</span><span className="text-purple-300">{eye.awarenessLevel}</span></div>
              <div className="flex justify-between"><span className="text-muted">Total observed</span><span>{eye.totalObservations}</span></div>
              <div className="flex justify-between"><span className="text-muted">Unique categories</span><span>{eye.uniqueCategories}</span></div>
              {eye.categories?.slice(0, 3).map((c: any) => (
                <div key={c.category} className="flex justify-between text-[10px] text-muted">
                  <span>{c.category}</span><span>{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="titan-live-card p-3 col-span-1">
          <div className="flex items-center gap-2 text-xs mb-2"><KeyRound className="w-4 h-4 text-amber" /><span className="font-bold">SECRETS · STATUS</span></div>
          <div className="space-y-1 text-[10px] font-mono">
            {secrets.map((s: any) => (
              <div key={s.key} className="flex justify-between gap-2">
                <span className="text-muted truncate">{s.key.replace(/_API_KEY$|_KEY$|_TOKEN$/, "")}</span>
                <span className={s.configured ? "text-safe" : "text-muted/50"}>
                  {s.configured ? `● ${s.source}` : "○ none"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODULES */}
      {sentinel?.modules?.length > 0 && (
        <div className="titan-live-card p-4 mb-5">
          <div className="flex items-center gap-2 text-xs mb-3"><Activity className="w-4 h-4 text-primary" /><span className="font-bold">МОДУЛІ ({sentinel.modules.length})</span></div>
          <div className="grid sm:grid-cols-2 gap-2">
            {sentinel.modules.map((m: any) => {
              const col = m.state === "healthy" || m.state === "recovered" ? "#00FF88"
                        : m.state === "degraded" ? "#FF8C00" : "#FF3355";
              return (
                <div key={m.name} className="border p-2 text-[11px]" style={{ borderColor: col + "30", background: col + "05" }}>
                  <div className="flex justify-between font-bold">
                    <span style={{ color: col }}>● {m.name}</span>
                    <span className="text-[9px] text-muted">{m.state}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>OK: {m.successes}</span>
                    <span>FAIL: {m.failures}</span>
                  </div>
                  {m.lastError && <div className="text-[10px] text-red-400 mt-1 truncate" title={m.lastError}>last: {m.lastError}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HEARTBEATS */}
      {sentinel?.beats?.length > 0 && (
        <div className="titan-live-card p-4 mb-5">
          <div className="flex items-center gap-2 text-xs mb-3"><Heart className="w-4 h-4 text-red-400 animate-pulse" /><span className="font-bold">СЕРЦЕБИТТЯ ({sentinel.beats.length} циклів)</span></div>
          <div className="grid sm:grid-cols-2 gap-1 text-[11px] font-mono">
            {sentinel.beats.map((b: any) => (
              <div key={b.name} className="flex justify-between border-b border-white/5 py-1">
                <span className={b.healthy ? "text-safe" : "text-red-400"}>● {b.name}</span>
                <span className="text-muted">{Math.round(b.ageMs / 1000)}s ago / {Math.round(b.intervalMs / 1000)}s cycle</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTEGRITY */}
      <div className="titan-live-card p-4 mb-5">
        <div className="flex items-center gap-2 text-xs mb-3"><FileCheck className="w-4 h-4 text-cyan-400" /><span className="font-bold">ЦІЛІСНІСТЬ ФАЙЛІВ ({integ.length})</span></div>
        <div className="space-y-1 text-[10px] font-mono">
          {integ.map((f: any) => (
            <div key={f.path} className="flex justify-between gap-2">
              <span className="text-muted truncate">{f.path.replace(/^artifacts\/api-server\/src\//, "")}</span>
              <span className={f.sha256 ? "text-safe" : "text-red-400"}>
                {f.sha256 ? `${f.sha256} · ${f.bytes}b` : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT EYE EVENTS */}
      {eye?.recent?.length > 0 && (
        <div className="titan-live-card p-4">
          <div className="flex items-center gap-2 text-xs mb-3"><Sparkles className="w-4 h-4 text-purple-400" /><span className="font-bold">ОСТАННІ СПОСТЕРЕЖЕННЯ ({eye.recent.length})</span></div>
          <div className="space-y-1 text-[10px] font-mono max-h-64 overflow-auto">
            {eye.recent.slice(0, 30).map((r: any, i: number) => (
              <div key={i} className="flex justify-between gap-2 border-b border-white/5 py-1">
                <span className="text-purple-300">{r.cat}</span>
                <span className="text-muted truncate">{r.fp.slice(0, 12)}…</span>
                <span className="text-muted text-right">{new Date(r.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
