import { useState, useMemo, useRef, useEffect, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Crown, Settings as SettingsIcon, Users, Activity, Power, Send,
  Terminal, Bot, Check, X, Loader2, Save, RotateCcw, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, isCreator, haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (path: string) => `${BASE}/api${path}`;

function useCreatorAuth() {
  const tg = getTgUser();
  return { tgId: tg.id, isCreator: isCreator(tg.id), name: tg.name };
}

function authHeaders(tgId: string): HeadersInit {
  return { "Content-Type": "application/json", "x-telegram-id": tgId };
}

interface AiMessage { role: "user" | "assistant"; content: string; executable?: any; needsConfirm?: boolean; ts: number }

export default function CreatorPage() {
  const auth = useCreatorAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"ai" | "settings" | "users" | "terminal" | "broadcast">("ai");
  const [reveal, setReveal] = useState(false);

  // Redirect non-creators away
  useEffect(() => {
    if (!auth.isCreator) {
      const t = setTimeout(() => setLocation("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [auth.isCreator, setLocation]);

  if (!auth.isCreator) {
    return (
      <div className="titan-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="titan-card" style={{ maxWidth: 480, textAlign: "center" }}>
          <X className="w-12 h-12 mx-auto text-red-500 mb-3" />
          <h1 className="text-2xl font-bold mb-2 text-red-400">ACCESS DENIED</h1>
          <p className="text-muted">Цей розділ доступний тільки творцю TITAN-94.</p>
          <p className="text-xs text-muted mt-3">TG ID: {auth.tgId} · Перенаправлення на головну...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-start">
        <div>
          <h1 className="titan-title flex items-center gap-2"><Crown className="w-6 h-6 text-amber" /> CREATOR · GOD-MODE</h1>
          <p className="titan-subtitle">AI Engineer · Settings · Users · Terminal · Broadcast — нікому не видно</p>
        </div>
        <div className="text-right text-xs">
          <div className="titan-badge titan-badge-amber">● CREATOR</div>
          <div className="text-muted mt-1">{auth.name} ({auth.tgId})</div>
          <button onClick={() => setReveal(!reveal)} className="text-xs text-muted hover:text-primary mt-1 flex items-center gap-1 ml-auto">
            {reveal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {reveal ? "Hide" : "Show"} sensitive
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        {[
          { k: "ai",        l: "AI Engineer", i: Bot },
          { k: "settings",  l: "Settings",    i: SettingsIcon },
          { k: "users",     l: "Users",       i: Users },
          { k: "terminal",  l: "Terminal",    i: Terminal },
          { k: "broadcast", l: "Broadcast",   i: Send },
        ].map(({ k, l, i: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`flex items-center gap-1 px-4 py-2 text-xs font-bold transition ${tab === k ? "text-amber border-b-2 border-amber" : "text-muted hover:text-primary"}`}
          >
            <Icon className="w-3 h-3" />{l}
          </button>
        ))}
      </div>

      {tab === "ai"        && <AiEngineerTab tgId={auth.tgId} />}
      {tab === "settings"  && <SettingsTab tgId={auth.tgId} qc={qc} toast={toast} />}
      {tab === "users"     && <UsersTab tgId={auth.tgId} reveal={reveal} toast={toast} qc={qc} />}
      {tab === "terminal"  && <TerminalTab tgId={auth.tgId} />}
      {tab === "broadcast" && <BroadcastTab tgId={auth.tgId} toast={toast} />}
    </div>
  );
}

// ─────────────────── AI ENGINEER ───────────────────
function AiEngineerTab({ tgId }: { tgId: string }) {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: "Готовий, творцю. Скажи що зробити — я підготую команду чи правки. Натиснеш ✓ — виконаю.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy]   = useState(false);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    haptic("light");
    setMessages((m) => [...m, { role: "user", content: text, ts: Date.now() }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch(api("/creator/ai/chat"), {
        method: "POST",
        headers: authHeaders(tgId),
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });
      const d = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: d.reply || d.error || "(empty)", executable: d.executable, needsConfirm: d.needsConfirm, ts: Date.now() }]);
      haptic("success");
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `× ${e.message}`, ts: Date.now() }]);
      haptic("error");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (msg: AiMessage, ok: boolean) => {
    if (!ok) {
      haptic("warning");
      setMessages((m) => [...m, { role: "assistant", content: "× Скасовано творцем.", ts: Date.now() }]);
      return;
    }
    if (!msg.executable) return;
    haptic("medium");
    setRunning(true);
    try {
      const r = await fetch(api("/creator/ai/run"), {
        method: "POST",
        headers: authHeaders(tgId),
        body: JSON.stringify(msg.executable),
      });
      const d = await r.json();
      const out = msg.executable.type === "exec"
        ? `✓ exit=${d.exitCode}\n--- stdout ---\n${(d.stdout || "(empty)").slice(0, 2000)}\n--- stderr ---\n${(d.stderr || "(empty)").slice(0, 1000)}`
        : `✓ HTTP ${d.status}\n${JSON.stringify(d.response, null, 2).slice(0, 2000)}`;
      setMessages((m) => [...m, { role: "assistant", content: out, ts: Date.now() }]);
      haptic("success");
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `× ${e.message}`, ts: Date.now() }]);
      haptic("error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="titan-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2 mb-3" style={{ background: "#020812", borderRadius: 4 }}>
        {messages.map((m, i) => (
          <div key={i} className={`p-3 ${m.role === "user" ? "text-right" : ""}`}>
            <div className="text-[10px] text-muted mb-1">{m.role === "user" ? "ТВОРЕЦЬ" : "AI ENGINEER"} · {new Date(m.ts).toLocaleTimeString()}</div>
            <div className={`inline-block max-w-[90%] p-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-amber-500/5 border border-amber-500/20"}`}>
              {m.content}
            </div>
            {m.executable && (
              <div className="mt-2 inline-block">
                <div className="text-xs text-muted mb-1">Готова до виконання:</div>
                <div className="bg-black/40 px-3 py-2 text-xs font-mono text-amber border border-amber/30 mb-2">
                  {m.executable.type === "exec"
                    ? `$ ${m.executable.command}`
                    : `${m.executable.method} ${m.executable.path} ${m.executable.body ? "+ body" : ""}`}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => confirm(m, true)}  disabled={running} className="titan-btn titan-btn-amber titan-btn-sm">
                    {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} ВИКОНАТИ
                  </button>
                  <button onClick={() => confirm(m, false)} disabled={running} className="titan-btn titan-btn-sm">
                    <X className="w-3 h-3" /> СКАСУВАТИ
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="text-center text-muted text-xs"><Loader2 className="w-4 h-4 inline animate-spin" /> AI думає...</div>}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="titan-input flex-1"
          placeholder="Скажи що зробити: 'зміни ціну PRO на 7 TON' / 'покажи список юзерів' / 'перезапусти ton-poller'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          autoFocus
        />
        <button type="submit" disabled={busy || !input.trim()} className="titan-btn titan-btn-amber">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} ВІДПРАВИТИ
        </button>
      </form>
      <p className="text-[11px] text-muted mt-2">
        Швидкі команди: «redeploy», «list users», «set elite price 25», «grant pro to 12345 30 days», «run auto-earn now», «show last 10 errors»
      </p>
    </div>
  );
}

// ─────────────────── SETTINGS ───────────────────
function SettingsTab({ tgId, qc, toast }: { tgId: string; qc: any; toast: any }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/creator/settings", tgId],
    queryFn: () => fetch(api("/creator/settings"), { headers: authHeaders(tgId) }).then((r) => r.json()),
  });
  const [draft, setDraft] = useState<any>(null);
  useEffect(() => { if (settings && !draft) setDraft(settings); }, [settings]);

  const save = useMutation({
    mutationFn: (patch: any) => fetch(api("/creator/settings"), { method: "POST", headers: authHeaders(tgId), body: JSON.stringify(patch) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/creator/settings", tgId] }); toast({ title: "✓ Збережено" }); haptic("success"); },
    onError: (e: any) => { toast({ title: "× Помилка", description: e.message, variant: "destructive" }); haptic("error"); },
  });

  const reset = useMutation({
    mutationFn: () => fetch(api("/creator/settings/reset"), { method: "POST", headers: authHeaders(tgId) }).then((r) => r.json()),
    onSuccess: (d) => { setDraft(d); qc.invalidateQueries({ queryKey: ["/creator/settings", tgId] }); toast({ title: "↻ Скинуто до дефолтів" }); },
  });

  if (isLoading || !draft) return <div className="titan-card text-center text-muted py-12"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>;

  const Field = ({ label, k, type = "number", step = "any" }: { label: string; k: string; type?: string; step?: string }) => (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input
        type={type} step={step}
        className="titan-input w-full"
        value={draft[k] ?? ""}
        onChange={(e) => setDraft({ ...draft, [k]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
      />
    </div>
  );
  const Toggle = ({ label, k }: { label: string; k: string }) => (
    <label className="flex items-center justify-between p-2 border border-cyan-500/20 cursor-pointer hover:bg-cyan-500/5">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={!!draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })} className="accent-amber-500" />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="titan-card">
        <h3 className="text-sm font-bold text-amber mb-3">ЦІНИ ПІДПИСОК (TON)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="PRO" k="proPriceTon" />
          <Field label="ELITE" k="elitePriceTon" />
          <Field label="DEVELOPER" k="developerPriceTon" />
          <Field label="Free Trial (год)" k="freeTrialHours" />
        </div>
      </div>

      <div className="titan-card">
        <h3 className="text-sm font-bold text-amber mb-3">AUTO-EARN RATES (TON / cycle)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="PRO/cycle"       k="proPerCycle" />
          <Field label="ELITE/cycle"     k="elitePerCycle" />
          <Field label="DEV/cycle"       k="developerPerCycle" />
          <Field label="Інтервал (хв)"   k="autoEarnIntervalMin" />
        </div>
        <div className="text-[11px] text-muted mt-2">
          ELITE/день: <span className="text-amber font-bold">{(draft.elitePerCycle * (1440 / draft.autoEarnIntervalMin)).toFixed(3)} TON</span>
          {" · "}
          PRO/день: <span className="text-primary font-bold">{(draft.proPerCycle * (1440 / draft.autoEarnIntervalMin)).toFixed(3)} TON</span>
          {" · "}
          DEV/день: <span className="text-safe font-bold">{(draft.developerPerCycle * (1440 / draft.autoEarnIntervalMin)).toFixed(3)} TON</span>
        </div>
      </div>

      <div className="titan-card">
        <h3 className="text-sm font-bold text-amber mb-3">ВИВОДИ + РЕФЕРАЛИ</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min withdrawal (TON)" k="minWithdrawalTon" />
          <Field label="CPA %" k="cpaPct" />
        </div>
      </div>

      <div className="titan-card">
        <h3 className="text-sm font-bold text-amber mb-3">CYCLES TOGGLES</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Toggle label="SCAN cycle"      k="scanCycleEnabled" />
          <Toggle label="HEAL cycle"      k="healCycleEnabled" />
          <Toggle label="LEARN cycle"     k="learnCycleEnabled" />
          <Toggle label="AUTO-EARN cycle" k="autoEarnEnabled" />
          <Toggle label="TON-POLLER"      k="tonPollerEnabled" />
          <Toggle label="Telegram BOT"    k="tgBotEnabled" />
        </div>
      </div>

      <div className="titan-card">
        <h3 className="text-sm font-bold text-amber mb-3">БРЕНДИНГ + ВИПЛАТА</h3>
        <div className="space-y-3">
          <Field label="Reserve TON Address" k="reserveAddress" type="text" />
          <div>
            <label className="text-xs text-muted block mb-1">Welcome Message (Telegram bot /start)</label>
            <textarea
              className="titan-input w-full"
              rows={3}
              value={draft.welcomeMessage || ""}
              onChange={(e) => setDraft({ ...draft, welcomeMessage: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-card p-3 border-t border-amber-500/30" style={{ background: "#060F1A" }}>
        <button className="titan-btn titan-btn-amber flex-1" onClick={() => save.mutate(draft)} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          ЗБЕРЕГТИ ЗМІНИ
        </button>
        <button className="titan-btn" onClick={() => reset.mutate()} disabled={reset.isPending}>
          <RotateCcw className="w-4 h-4 mr-1" />Reset
        </button>
      </div>
    </div>
  );
}

// ─────────────────── USERS ───────────────────
function UsersTab({ tgId, reveal, toast, qc }: { tgId: string; reveal: boolean; toast: any; qc: any }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/creator/users", tgId],
    queryFn: () => fetch(api("/creator/users?limit=500"), { headers: authHeaders(tgId) }).then((r) => r.json()),
  });
  const [granting, setGranting] = useState<string | null>(null);
  const [grantPlan, setGrantPlan] = useState<"pro" | "elite" | "developer">("pro");
  const [grantDays, setGrantDays] = useState(30);

  const grant = async (uid: string) => {
    haptic("medium");
    const r = await fetch(api(`/creator/user/${uid}/grant`), {
      method: "POST", headers: authHeaders(tgId),
      body: JSON.stringify({ plan: grantPlan, days: grantDays, reason: "Manual grant by creator" }),
    });
    const d = await r.json();
    if (d.success) { toast({ title: `✓ ${grantPlan.toUpperCase()} → ${uid}` }); haptic("success"); refetch(); qc.invalidateQueries(); }
    else { toast({ title: "× Помилка", description: d.error, variant: "destructive" }); haptic("error"); }
    setGranting(null);
  };

  if (isLoading) return <div className="titan-card text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  const users: any[] = data?.users || [];

  return (
    <div className="titan-card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-amber">ВСІ КОРИСТУВАЧІ ({data?.total || 0})</h3>
        <button onClick={() => refetch()} className="titan-btn titan-btn-sm">↻ Refresh</button>
      </div>
      <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-cyan-500/20">
              <th className="text-left p-2">TG ID</th>
              <th className="text-left p-2">Username</th>
              <th className="text-left p-2">Plan</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Expires</th>
              <th className="text-left p-2">TON Wallet</th>
              <th className="text-left p-2">Ref by</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.telegramId} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                <td className="p-2 font-mono">{reveal ? u.telegramId : u.telegramId?.slice(0, 4) + "***"}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">
                  <span className={`titan-badge ${u.plan === "elite" ? "titan-badge-amber" : u.plan === "developer" ? "titan-badge-safe" : ""}`}>
                    {u.plan?.toUpperCase()}
                  </span>
                </td>
                <td className="p-2">{u.isActive ? "✓" : "×"}</td>
                <td className="p-2">{u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : "—"}</td>
                <td className="p-2 font-mono text-[10px]">{u.tonAddress ? (reveal ? u.tonAddress.slice(0, 14) + "..." : "***") : "—"}</td>
                <td className="p-2">{u.referredBy || "—"}</td>
                <td className="p-2">
                  {granting === u.telegramId ? (
                    <div className="flex gap-1 items-center">
                      <select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value as any)} className="text-xs px-1 bg-black/40">
                        <option value="pro">PRO</option>
                        <option value="elite">ELITE</option>
                        <option value="developer">DEV</option>
                      </select>
                      <input type="number" value={grantDays} onChange={(e) => setGrantDays(parseInt(e.target.value))} className="w-12 text-xs px-1 bg-black/40" />
                      <button onClick={() => grant(u.telegramId)} className="text-amber"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setGranting(null)} className="text-muted"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setGranting(u.telegramId)} className="text-xs text-amber hover:text-amber-300">+ grant</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────── TERMINAL ───────────────────
function TerminalTab({ tgId }: { tgId: string }) {
  const [history, setHistory] = useState<{ cmd: string; out: string; ok: boolean; ts: number }[]>([]);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    const c = cmd.trim();
    if (!c || busy) return;
    haptic("light");
    setBusy(true);
    setCmd("");
    try {
      const r = await fetch(api("/creator/exec"), {
        method: "POST", headers: authHeaders(tgId),
        body: JSON.stringify({ command: c, timeout: 30000 }),
      });
      const d = await r.json();
      const out = `${d.stdout || ""}${d.stderr ? "\n[stderr]\n" + d.stderr : ""}`;
      setHistory((h) => [...h, { cmd: c, out: out.trim() || "(no output)", ok: d.exitCode === 0, ts: Date.now() }]);
      haptic(d.exitCode === 0 ? "success" : "error");
    } catch (err: any) {
      setHistory((h) => [...h, { cmd: c, out: err.message, ok: false, ts: Date.now() }]);
      haptic("error");
    } finally { setBusy(false); }
  };

  const quick = ["ls -la", "git status", "pnpm --filter @workspace/api-server run build", "ps aux | grep node | head", "df -h"];

  return (
    <div className="titan-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-amber" />
        <span className="text-xs text-muted">SHELL — cwd: project root · timeout 30s · max 4MB output</span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto space-y-2 p-3 mb-3 font-mono text-xs" style={{ background: "#000", borderRadius: 4 }}>
        {history.length === 0 && <div className="text-muted">Готовий до команд. Спробуй: ls, ps, pnpm run build...</div>}
        {history.map((h, i) => (
          <div key={i}>
            <div className={h.ok ? "text-amber" : "text-red-400"}>$ {h.cmd}</div>
            <pre className="text-cyan-300 whitespace-pre-wrap break-all">{h.out}</pre>
          </div>
        ))}
        {busy && <div className="text-amber"><Loader2 className="w-3 h-3 inline animate-spin" /> Виконую...</div>}
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {quick.map((q) => (
          <button key={q} onClick={() => setCmd(q)} className="text-[10px] px-2 py-1 bg-black/40 border border-cyan-500/20 hover:bg-cyan-500/10">{q}</button>
        ))}
      </div>
      <form onSubmit={run} className="flex gap-2">
        <span className="text-amber font-mono pt-2">$</span>
        <input
          className="titan-input flex-1 font-mono"
          placeholder="ls -la / git status / pnpm run build ..."
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          disabled={busy}
          autoFocus
        />
        <button type="submit" disabled={busy} className="titan-btn titan-btn-amber">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />} RUN
        </button>
      </form>
    </div>
  );
}

// ─────────────────── BROADCAST ───────────────────
function BroadcastTab({ tgId, toast }: { tgId: string; toast: any }) {
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<"all" | "elite" | "pro">("elite");
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!confirm(`Надіслати "${text.slice(0, 60)}..." всім ${plan.toUpperCase()} підписникам?`)) return;
    haptic("medium");
    setBusy(true);
    try {
      const r = await fetch(api("/telegram/broadcast"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, plan, adminToken: tgId }),
      });
      const d = await r.json();
      toast({ title: `✓ Надіслано ${d.sent || 0} · failed ${d.failed || 0}` });
      haptic("success");
      setText("");
    } catch (e: any) {
      toast({ title: "× Помилка", description: e.message, variant: "destructive" });
      haptic("error");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={send} className="titan-card space-y-3">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5 text-amber" />
        <h3 className="text-sm font-bold text-amber">TELEGRAM BROADCAST</h3>
      </div>
      <p className="text-xs text-muted">Надішли повідомлення всім активним підписникам через Telegram бота. Markdown підтримується (*bold*, _italic_, `code`).</p>
      <div className="flex gap-2">
        <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="titan-input">
          <option value="elite">ELITE only</option>
          <option value="pro">PRO + ELITE</option>
          <option value="all">All active</option>
        </select>
      </div>
      <textarea
        className="titan-input w-full"
        rows={6}
        placeholder="🚨 *Critical alert*&#10;&#10;Виявлено нову загрозу для контракту EQ...&#10;Перевірте /scan ваші активи."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" disabled={busy || !text.trim()} className="titan-btn titan-btn-amber w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
        НАДІСЛАТИ {plan.toUpperCase()} ПІДПИСНИКАМ
      </button>
    </form>
  );
}
