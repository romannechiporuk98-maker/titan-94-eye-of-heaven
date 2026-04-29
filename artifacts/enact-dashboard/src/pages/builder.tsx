import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot, Plus, Play, Pause, Trash2, Settings as SettingsIcon, Sparkles,
  Activity, Check, X, Loader2, Zap, Brain, Wrench,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, isCreator, haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

interface Tool { id: string; name: string; description: string; needsPro?: boolean; creatorOnly?: boolean }
interface Template { id: string; name: string; role: string; goal: string; tools: string[]; intervalMin: number }
interface Agent {
  id: string; ownerTgId: string; name: string; description: string; role: string; goal: string;
  tools: string[]; intervalMin: number; enabled: boolean;
  runs: number; successes: number; failures: number;
  lastRunAt: string | null; nextRunAt: string; lastOutput: string;
  createdAt: string; updatedAt: string;
}

export default function BuilderPage() {
  const tg = useMemo(() => getTgUser(), []);
  const isOwner = isCreator(tg.id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);

  const { data: catalog } = useQuery<{ tools: Tool[]; templates: Template[] }>({
    queryKey: ["/agents/catalog"],
    queryFn: () => fetch(api("/agents/catalog")).then((r) => r.json()),
  });
  const { data: list, refetch } = useQuery<{ total: number; agents: Agent[] }>({
    queryKey: [`/agents?owner=${tg.id}`],
    queryFn: () => fetch(api(`/agents?owner=${tg.id}`)).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const create = useMutation({
    mutationFn: (body: any) => fetch(api("/agents"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ownerTgId: tg.id }),
    }).then((r) => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); haptic("error"); return; }
      toast({ title: "✓ Агента створено: " + d.name }); haptic("success");
      setCreating(false);
      qc.invalidateQueries({ queryKey: [`/agents?owner=${tg.id}`] });
    },
  });

  const runNow = async (id: string) => {
    haptic("medium");
    const r = await fetch(api(`/agents/${id}/run`), { method: "POST" }).then((r) => r.json());
    toast({ title: r.ok ? "✓ Виконано" : "× Помилка", description: r.output?.slice(-200) });
    haptic(r.ok ? "success" : "error");
    refetch();
  };
  const toggle = async (id: string) => {
    haptic("light");
    await fetch(api(`/agents/${id}/toggle`), { method: "POST" });
    refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Видалити агента назавжди?")) return;
    haptic("warning");
    await fetch(api(`/agents/${id}`), { method: "DELETE" });
    refetch();
    setSelected(null);
  };

  return (
    <div className="titan-page">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-lg p-6 mb-6" style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.08), rgba(0,255,136,0.06), rgba(255,140,0,0.08))",
        border: "1px solid rgba(0,255,255,0.2)",
      }}>
        <div className="absolute top-0 right-0 opacity-20"><Bot className="w-48 h-48" /></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber" />
            <span className="text-xs font-bold tracking-widest text-amber">AGENT FORGE · POWERED BY TITAN-94</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Створюй власних AI агентів</h1>
          <p className="text-sm text-muted max-w-xl">
            Збери автономного агента під свою задачу: захист гаманця, моніторинг цін, арбітраж, дослідження TON-проектів.
            Агенти працюють самі за розкладом, шлють тобі звіти в Telegram, нараховують TON за виконані задачі.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => setCreating(true)} className="titan-btn titan-btn-amber">
              <Plus className="w-4 h-4 mr-1" /> СТВОРИТИ АГЕНТА
            </button>
            <span className="text-xs text-muted">
              {list?.total || 0} {isOwner ? "(unlimited as creator)" : "/ 3 agents (free limit)"}
            </span>
          </div>
        </div>
      </div>

      {/* AGENT GRID */}
      {!list?.agents.length && !creating && (
        <div className="titan-card text-center py-12">
          <Bot className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">У тебе ще нема агентів. Натисни "Створити агента" та обери шаблон або з нуля.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {list?.agents.map((a) => {
          const successRate = a.runs ? Math.round((a.successes / a.runs) * 100) : 0;
          return (
            <div key={a.id} className={`titan-card hover:border-amber-500/50 transition cursor-pointer ${selected?.id === a.id ? "border-amber-500" : ""}`}
                 onClick={() => setSelected(a)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.enabled ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}></span>
                    {a.name}
                  </div>
                  <div className="text-[10px] text-muted">{a.description?.slice(0, 50) || "no description"}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); runNow(a.id); }} className="text-amber hover:text-amber-300" title="Run now"><Play className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); toggle(a.id); }}  className="text-primary" title="Pause/Resume">{a.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(a.id); }}  className="text-red-400" title="Delete"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="text-xs text-muted line-clamp-2 mb-3">{a.goal}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div><div className="text-muted">RUNS</div><div className="text-primary font-bold">{a.runs}</div></div>
                <div><div className="text-muted">SUCCESS</div><div className="text-safe font-bold">{successRate}%</div></div>
                <div><div className="text-muted">EVERY</div><div className="text-amber font-bold">{a.intervalMin}m</div></div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {a.tools.slice(0, 4).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 border border-cyan-500/30 text-cyan-300">{t}</span>
                ))}
              </div>
              {a.lastRunAt && (
                <div className="text-[10px] text-muted mt-2">Last: {new Date(a.lastRunAt).toLocaleTimeString()}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* AGENT DETAIL */}
      {selected && <AgentDetail agent={selected} onClose={() => setSelected(null)} />}

      {/* CREATE WIZARD */}
      {creating && catalog && (
        <CreateWizard
          tools={catalog.tools}
          templates={catalog.templates}
          onCancel={() => setCreating(false)}
          onSubmit={(b) => create.mutate(b)}
          isCreator={isOwner}
        />
      )}
    </div>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  return (
    <div className="titan-card mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-amber" /> {agent.name}</h2>
          <div className="text-xs text-muted">{agent.description}</div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted mb-1">GOAL</div>
          <div className="text-sm bg-black/30 p-3 border border-cyan-500/20">{agent.goal}</div>
          <div className="text-xs text-muted mt-3 mb-1">ROLE</div>
          <div className="text-xs bg-black/30 p-3 border border-cyan-500/20 italic">{agent.role}</div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">LAST OUTPUT</div>
          <pre className="text-xs bg-black/40 p-3 border border-cyan-500/20 overflow-auto max-h-48 whitespace-pre-wrap">{agent.lastOutput || "(no runs yet)"}</pre>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="titan-stat-mini"><div className="text-muted text-[10px]">RUNS</div><div className="text-lg font-bold">{agent.runs}</div></div>
            <div className="titan-stat-mini"><div className="text-muted text-[10px]">✓</div><div className="text-lg font-bold text-safe">{agent.successes}</div></div>
            <div className="titan-stat-mini"><div className="text-muted text-[10px]">×</div><div className="text-lg font-bold text-red-400">{agent.failures}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateWizard({
  tools, templates, onCancel, onSubmit, isCreator,
}: {
  tools: Tool[]; templates: Template[]; onCancel: () => void; onSubmit: (b: any) => void; isCreator: boolean;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tpl, setTpl] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [intervalMin, setIntervalMin] = useState(30);

  const useTpl = (t: Template) => {
    setTpl(t); setName(t.name); setRole(t.role); setGoal(t.goal); setSelectedTools(t.tools); setIntervalMin(t.intervalMin);
    setStep(2);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, role, goal, tools: selectedTools, intervalMin });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="titan-card max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ background: "#060F1A" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber" /> Створити агента — Крок {step}/3
          </h2>
          <button onClick={onCancel} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
        </div>

        {step === 1 && (
          <>
            <p className="text-xs text-muted mb-3">Обери шаблон або почни з нуля</p>
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <button key={t.id} type="button" onClick={() => useTpl(t)}
                        className="text-left titan-card hover:border-amber-500 transition">
                  <div className="font-bold mb-1">{t.name}</div>
                  <div className="text-xs text-muted mb-2">{t.goal}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.tools.map((x) => <span key={x} className="text-[9px] px-1 border border-cyan-500/30 text-cyan-300">{x}</span>)}
                  </div>
                  <div className="text-[10px] text-muted mt-2">кожні {t.intervalMin} хв</div>
                </button>
              ))}
              <button type="button" onClick={() => setStep(2)} className="titan-card border-dashed text-muted hover:text-primary text-center">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">З нуля</div>
                <div className="text-[10px]">Власна конфігурація</div>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-3">
            <div>
              <label className="text-xs text-muted">Назва</label>
              <input className="titan-input w-full" value={name} onChange={(e) => setName(e.target.value)} required placeholder="My TON Guardian" />
            </div>
            <div>
              <label className="text-xs text-muted">Опис</label>
              <input className="titan-input w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Що цей агент робить?" />
            </div>
            <div>
              <label className="text-xs text-muted">Роль (system prompt)</label>
              <textarea className="titan-input w-full" rows={2} value={role} onChange={(e) => setRole(e.target.value)} required
                        placeholder="You are a vigilant security guardian for TON..." />
            </div>
            <div>
              <label className="text-xs text-muted">Ціль</label>
              <textarea className="titan-input w-full" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} required
                        placeholder="Monitor my wallet and notify on suspicious activity" />
            </div>
            <div>
              <label className="text-xs text-muted">Інтервал (хв)</label>
              <input type="number" min={1} max={1440} className="titan-input w-full" value={intervalMin}
                     onChange={(e) => setIntervalMin(parseInt(e.target.value) || 30)} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="titan-btn">← Шаблони</button>
              <button type="submit" className="titan-btn titan-btn-amber flex-1">Далі: Інструменти →</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-muted">Обери інструменти, які агент може використовувати</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tools.map((t) => {
                const checked = selectedTools.includes(t.id);
                const blocked = t.creatorOnly && !isCreator;
                return (
                  <label key={t.id} className={`flex items-start gap-3 p-3 border cursor-pointer transition ${
                    blocked ? "opacity-40 cursor-not-allowed" :
                    checked ? "border-amber-500 bg-amber-500/5" : "border-cyan-500/20 hover:border-cyan-500/50"
                  }`}>
                    <input type="checkbox" disabled={blocked} checked={checked}
                           onChange={() => setSelectedTools(checked ? selectedTools.filter((x) => x !== t.id) : [...selectedTools, t.id])} />
                    <div className="flex-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        {t.name}
                        {t.needsPro && <span className="text-[9px] text-amber border border-amber/50 px-1">PRO+</span>}
                        {t.creatorOnly && <span className="text-[9px] text-red-400 border border-red-400/50 px-1">CREATOR</span>}
                      </div>
                      <div className="text-xs text-muted">{t.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="titan-btn">← Назад</button>
              <button type="submit" disabled={selectedTools.length === 0} className="titan-btn titan-btn-amber flex-1">
                <Zap className="w-4 h-4 mr-1" /> ЗАПУСТИТИ АГЕНТА
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
