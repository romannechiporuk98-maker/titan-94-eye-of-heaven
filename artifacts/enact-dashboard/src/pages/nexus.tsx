import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLang, t } from "@/lib/ui-prefs";
import {
  Sparkles, Send, Brain, CheckCircle2, AlertTriangle, Zap, Loader2,
  Users, Trophy, MessageSquare, Activity, Key, ExternalLink,
  ChevronDown, ChevronRight, Cpu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

const MODES_BASE = [
  { id: "general",  icon: "✨", key: "mode.general"  },
  { id: "website",  icon: "🌐", key: "mode.website"  },
  { id: "code",     icon: "💻", key: "mode.code"     },
  { id: "image",    icon: "🎨", key: "mode.image"    },
  { id: "video",    icon: "🎬", key: "mode.video"    },
  { id: "bot",      icon: "🤖", key: "mode.bot"      },
  { id: "music",    icon: "🎵", key: "mode.music"    },
  { id: "text",     icon: "✍",  key: "mode.text"     },
];

const TIER_META: Record<string, { label: string; color: string; bg: string; order: number }> = {
  nano:     { label: "NANO",     color: "#4B5563", bg: "rgba(75,85,99,0.08)",    order: 0 },
  free:     { label: "FREE",     color: "#6B7280", bg: "rgba(107,114,128,0.08)", order: 1 },
  balanced: { label: "BALANCED", color: "#9B5CFF", bg: "rgba(155,92,255,0.08)",  order: 2 },
  powerful: { label: "POWERFUL", color: "#00FFFF", bg: "rgba(0,255,255,0.08)",   order: 3 },
  ultra:    { label: "ULTRA",    color: "#FF8C00", bg: "rgba(255,140,0,0.08)",   order: 4 },
};

const TIER_SPEED_BARS: Record<string, number> = {
  nano: 1, free: 2, balanced: 3, powerful: 4, ultra: 5,
};

const MODEL_COLORS: Record<string, string> = {
  Claude: "#FF8C00", "Claude 3.5 Sonnet": "#FF8C00",
  "GPT-4o-mini": "#00FFFF", "GPT-4o": "#00FFFF",
  "Gemini 2.0 Flash": "#9B5CFF", Gemini: "#9B5CFF",
  "Llama-3.3-70B (OR)": "#00FF88", "Llama-OR": "#00FF88",
};

function SpeedBar({ tier }: { tier: string }) {
  const filled = TIER_SPEED_BARS[tier] || 1;
  const color = TIER_META[tier]?.color || "#4B5563";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="w-1 h-2.5 rounded-sm"
          style={{ background: i <= filled ? color : "rgba(255,255,255,0.1)" }} />
      ))}
    </div>
  );
}

export default function NexusPage() {
  const { lang } = useLang();
  const { toast } = useToast();
  const MODES = MODES_BASE.map(m => ({ ...m, label: t(m.key, lang) }));
  const [prompt, setPrompt]       = useState("");
  const [mode, setMode]           = useState("general");
  const [result, setResult]       = useState<any>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [singleResult, setSingleResult] = useState<any>(null);
  const [tab, setTab] = useState<"orchestra"|"single">("orchestra");

  const { data: status } = useQuery<any>({
    queryKey: ["/nexus/status"],
    queryFn: () => fetch(api("/nexus/status")).then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: modelsData } = useQuery<any>({
    queryKey: ["/nexus/models"],
    queryFn: () => fetch(api("/nexus/models")).then(r => r.json()),
    staleTime: 60000,
  });

  const models = useMemo<any[]>(() => modelsData?.models || [], [modelsData]);
  const availableModels = useMemo(() => models.filter((m: any) => m.available), [models]);
  const tierGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const m of models) {
      if (!groups[m.tier]) groups[m.tier] = [];
      groups[m.tier].push(m);
    }
    return groups;
  }, [models]);

  const selectedModel = useMemo(
    () => models.find((m: any) => m.id === selectedModelId) || null,
    [models, selectedModelId]
  );

  const orchestra = useMutation({
    mutationFn: (b: { prompt: string; mode: string }) =>
      fetch(api("/nexus/orchestra"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then(r => r.json()),
    onSuccess: (d) => setResult(d),
    onError: (e: any) => toast({ title: "× " + e.message, variant: "destructive" }),
  });

  const singleGenerate = useMutation({
    mutationFn: (b: { prompt: string; modelId: string }) =>
      fetch(api("/nexus/generate-model"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then(r => r.json()),
    onSuccess: (d) => setSingleResult(d),
    onError: (e: any) => toast({ title: "× " + e.message, variant: "destructive" }),
  });

  const send = () => {
    if (!prompt.trim()) return;
    if (tab === "orchestra") {
      if (orchestra.isPending) return;
      orchestra.mutate({ prompt: prompt.trim(), mode });
    } else {
      if (!selectedModelId) {
        toast({ title: "Оберіть модель", variant: "destructive" });
        return;
      }
      if (singleGenerate.isPending) return;
      singleGenerate.mutate({ prompt: prompt.trim(), modelId: selectedModelId });
    }
  };

  const active = status?.activeModels || [];
  const orchestraOn = !!status?.orchestraEnabled;
  const isPending = tab === "orchestra" ? orchestra.isPending : singleGenerate.isPending;
  const currentResult = tab === "orchestra" ? result : singleResult;

  return (
    <div className="titan-page titan-grid-bg">
      {/* HERO */}
      <div className="relative overflow-hidden p-5 mb-5 rounded-lg" style={{
        background: "linear-gradient(135deg, rgba(155,92,255,0.10), rgba(0,255,255,0.06), rgba(255,140,0,0.08))",
        border: "1px solid rgba(155,92,255,0.3)",
      }}>
        <div className="absolute top-0 right-0 opacity-10"><Brain className="w-48 h-48 text-purple-400" /></div>
        <div className="relative flex justify-between items-start gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-purple-300/70 mb-1">{t("page.nexus.module", lang)}</div>
            <h1 className="text-3xl font-bold" style={{
              background: "linear-gradient(90deg, #9B5CFF, #00FFFF, #FF8C00)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ NEXUS · AI ORCHESTRA</h1>
            <p className="text-xs text-muted mt-1">
              {availableModels.length}/{models.length} {t("page.nexus.avail", lang)} ·{" "}
              {tab === "orchestra" ? t("page.nexus.parallel", lang) : t("page.nexus.solo_mode", lang)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-muted tracking-widest">ACTIVE</div>
            <div className={`text-2xl font-bold ${orchestraOn ? "text-safe" : active.length === 1 ? "text-amber" : "text-red-400"}`}>{active.length}/4</div>
            <div className="text-[10px] text-muted">{orchestraOn ? "ORCHESTRA" : active.length === 1 ? "SOLO MODE" : "OFFLINE"}</div>
          </div>
        </div>

        {/* Active model pills */}
        <div className="relative flex flex-wrap gap-1.5 mt-3">
          {["Gemini", "GPT-4o", "Claude", "Llama-OR"].map((m) => {
            const on = active.includes(m);
            const expired = m === "Gemini" && status?.geminiExpired;
            const col = MODEL_COLORS[m] || "#6b7280";
            return (
              <span key={m} className="text-[10px] px-2 py-1 border font-mono"
                style={{
                  borderColor: expired ? "#FF3355" : on ? col : "rgba(255,255,255,0.1)",
                  background: expired ? "rgba(255,51,85,0.12)" : on ? col + "15" : "rgba(0,0,0,0.3)",
                  color: expired ? "#FF3355" : on ? col : "#6b7280",
                }}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${on && !expired ? "" : "opacity-30"}`} style={{ background: expired ? "#FF3355" : col }}></span>
                {m}{expired ? " · KEY EXPIRED" : on ? " · ONLINE" : " · NO KEY"}
              </span>
            );
          })}
        </div>
      </div>

      {/* GEMINI KEY EXPIRED BANNER */}
      {status?.geminiExpired && (
        <div className="titan-live-card p-4 mb-4 flex items-start gap-3" style={{
          borderColor: "rgba(255,51,85,0.5)", background: "rgba(255,51,85,0.08)",
        }}>
          <Key className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-red-400 text-sm mb-1">❌ {t("page.nexus.key_exp", lang)}</div>
            <p className="text-xs text-muted mb-2">{t("page.nexus.key_exp_d", lang)}</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 titan-btn titan-btn-amber text-xs px-3 py-1.5">
                <ExternalLink className="w-3 h-3" /> {t("page.nexus.get_key", lang)}
              </a>
              <a href="./settings" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border transition"
                 style={{ borderColor: "rgba(0,255,255,0.3)", color: "#00FFFF" }}>
                <Key className="w-3 h-3" /> Settings → API Vault
              </a>
            </div>
          </div>
        </div>
      )}

      {/* === AI MODEL SELECTOR ============================================ */}
      <div className="titan-card mb-5">
        <button onClick={() => setModelPickerOpen(o => !o)}
          className="w-full flex items-center gap-2 text-left">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="titan-label flex-1">ВИБІР AI МОДЕЛІ · {models.length} ДОСТУПНИХ</span>
          <span className="text-[10px] text-muted mr-2">від слабкіших до найпотужніших</span>
          {modelPickerOpen
            ? <ChevronDown className="w-3 h-3 text-muted" />
            : <ChevronRight className="w-3 h-3 text-muted" />
          }
        </button>

        {modelPickerOpen && (
          <div className="mt-4 space-y-3">
            {["nano","free","balanced","powerful","ultra"].map(tier => {
              const tierModels = tierGroups[tier] || [];
              if (!tierModels.length) return null;
              const meta = TIER_META[tier];
              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SpeedBar tier={tier} />
                    <span className="text-[10px] font-bold font-mono tracking-widest" style={{ color: meta.color }}>
                      ── {meta.label}
                    </span>
                    {tier === "balanced" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: meta.color + "25", color: meta.color }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {tierModels.map((m: any) => {
                      const selected = selectedModelId === m.id;
                      const notAvail = !m.available;
                      return (
                        <button key={m.id}
                          onClick={() => { setSelectedModelId(m.id); setTab("single"); }}
                          disabled={notAvail}
                          className="flex items-start gap-2 p-2 rounded border text-left transition-all"
                          style={{
                            borderColor:  selected ? meta.color : notAvail ? "rgba(255,255,255,0.06)" : meta.color + "30",
                            background:   selected ? meta.bg : notAvail ? "rgba(0,0,0,0.2)" : "transparent",
                            opacity:      notAvail ? 0.45 : 1,
                            cursor:       notAvail ? "not-allowed" : "pointer",
                          }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold" style={{ color: notAvail ? "#6b7280" : meta.color }}>
                                {m.name}
                              </span>
                              {selected && <span className="text-[9px] font-bold text-safe">✓ {t("common.active", lang)}</span>}
                              {notAvail && <span className="text-[9px] text-red-400">NO KEY</span>}
                            </div>
                            <div className="text-[10px] text-muted mt-0.5 leading-tight">{m.desc}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[9px] font-mono text-muted">{m.speed}</div>
                            <div className="text-[9px] font-mono" style={{ color: meta.color }}>
                              {(m.tokens/1024).toFixed(0)}K
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="text-[10px] text-muted pt-1 border-t" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
              NANO/FREE — через OpenRouter (потрібен OPENROUTER_API_KEY) ·
              BALANCED — Gemini key або OpenRouter ·
              POWERFUL/ULTRA — потрібні ключі OpenAI, Anthropic або Gemini
            </div>
          </div>
        )}

        {/* Selected model preview */}
        {selectedModel && !modelPickerOpen && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded border"
            style={{ borderColor: TIER_META[selectedModel.tier]?.color + "40", background: TIER_META[selectedModel.tier]?.bg }}>
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: TIER_META[selectedModel.tier]?.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold" style={{ color: TIER_META[selectedModel.tier]?.color }}>
                {selectedModel.name}
                <span className="ml-2 text-[9px] font-mono opacity-60">{selectedModel.tierLabel}</span>
              </div>
              <div className="text-[10px] text-muted">{selectedModel.desc}</div>
            </div>
            <button onClick={() => setSelectedModelId(null)}
              className="text-[9px] text-muted hover:text-danger transition px-2">× скасувати</button>
          </div>
        )}
      </div>

      {/* === MODE + TABS ================================================== */}
      <div className="titan-live-card p-4 mb-5">
        {/* Orchestra / Single tabs */}
        <div className="flex gap-1 mb-3 border-b pb-2" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
          <button onClick={() => setTab("orchestra")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border transition"
            style={{
              borderColor: tab === "orchestra" ? "#9B5CFF" : "rgba(0,255,255,0.15)",
              background:  tab === "orchestra" ? "rgba(155,92,255,0.1)" : "transparent",
              color:       tab === "orchestra" ? "#9B5CFF" : "#6b7280",
            }}>
            <Users className="w-3 h-3" /> {t("page.nexus.orchestra", lang)} ({active.length})
          </button>
          <button onClick={() => { setTab("single"); if (!selectedModelId && availableModels[0]) setSelectedModelId(availableModels[0].id); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border transition"
            style={{
              borderColor: tab === "single" ? "#00FFFF" : "rgba(0,255,255,0.15)",
              background:  tab === "single" ? "rgba(0,255,255,0.1)" : "transparent",
              color:       tab === "single" ? "#00FFFF" : "#6b7280",
            }}>
            <Cpu className="w-3 h-3" />
            SOLO {selectedModel ? `· ${selectedModel.name}` : `(${t("page.nexus.pick_model", lang)})`}
          </button>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className="text-xs px-3 py-1.5 border transition"
              style={{
                borderColor: mode === m.id ? "#00FFFF" : "rgba(0,255,255,0.15)",
                background: mode === m.id ? "rgba(0,255,255,0.1)" : "transparent",
                color: mode === m.id ? "#00FFFF" : "#9ca3af",
              }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div className="flex gap-2">
          <textarea
            className="titan-input flex-1 text-sm resize-none"
            rows={3}
            placeholder={
              tab === "orchestra"
                ? orchestraOn ? "Запит → 4 AI паралельно → consensus..." : "Solo режим (додай більше ключів для Orchestra)..."
                : selectedModel ? `Запит → ${selectedModel.name} (${selectedModel.tierLabel})...` : "Спочатку оберіть модель вище..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          />
          <button type="button" onClick={send} disabled={isPending || !prompt.trim()}
                  className="titan-btn titan-btn-amber px-4">
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : tab === "orchestra"
                ? <><Zap className="w-4 h-4 mr-1" /> ORCHESTRA</>
                : <><Send className="w-4 h-4 mr-1" /> SOLO</>
            }
          </button>
        </div>
        <div className="text-[10px] text-muted mt-1">{t("page.nexus.quick_send", lang)}</div>
      </div>

      {/* LOADING */}
      {isPending && (
        <div className="titan-live-card p-8 text-center mb-5">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted">
            {tab === "orchestra"
              ? `Опитую ${active.length} моделей паралельно...`
              : `${selectedModel?.name || "Модель"} думає...`
            }
          </div>
          <div className="text-[10px] text-muted mt-1">
            {tab === "orchestra" ? "consensus scoring · jaccard tokenization · weighted judge" : `Tier: ${selectedModel?.tierLabel} · ~${selectedModel?.speed}`}
          </div>
        </div>
      )}

      {/* SINGLE MODEL RESULT */}
      {tab === "single" && singleResult && !singleGenerate.isPending && (
        <div className="space-y-4 mb-5">
          <div className="titan-live-card p-4" style={{ borderColor: TIER_META[singleResult.tier]?.color + "40" || "rgba(0,255,255,0.4)" }}>
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5" style={{ color: TIER_META[singleResult.tier]?.color || "#00FFFF" }} />
                <span className="font-bold" style={{ color: TIER_META[singleResult.tier]?.color || "#00FFFF" }}>
                  {singleResult.modelName}
                </span>
                <span className="text-[10px] text-muted">{singleResult.latencyMs}ms</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 font-bold font-mono rounded"
                style={{
                  background: TIER_META[singleResult.tier]?.bg || "transparent",
                  color:      TIER_META[singleResult.tier]?.color || "#00FFFF",
                }}>
                {TIER_META[singleResult.tier]?.label || singleResult.tier?.toUpperCase()}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{singleResult.text}</div>
          </div>
        </div>
      )}

      {/* ORCHESTRA RESULT */}
      {tab === "orchestra" && result && !orchestra.isPending && (
        <div className="space-y-4 mb-5">
          {/* CONSENSUS */}
          <div className="titan-live-card p-4" style={{ borderColor: "rgba(0,255,136,0.4)" }}>
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-safe" />
                <span className="font-bold text-safe">{t("page.nexus.orchestra", lang).toUpperCase()}</span>
                <span className="text-[10px] text-muted">{t("page.nexus.judge", lang)}: <span className="text-amber">{result.judge}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">{t("page.nexus.agreement", lang)}</span>
                <div className="w-24 h-1.5 bg-black/40 overflow-hidden">
                  <div className="h-full" style={{
                    width: `${result.agreementScore}%`,
                    background: result.agreementScore > 70 ? "#00FF88" : result.agreementScore > 40 ? "#FF8C00" : "#FF3355",
                  }} />
                </div>
                <span className="text-xs font-bold" style={{
                  color: result.agreementScore > 70 ? "#00FF88" : result.agreementScore > 40 ? "#FF8C00" : "#FF3355",
                }}>{result.agreementScore}%</span>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{result.consensus}</div>
          </div>

          {/* DISSENT */}
          {result.dissent?.length > 0 && (
            <div className="titan-live-card p-4" style={{ borderColor: "rgba(255,140,0,0.3)" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber" />
                <span className="font-bold text-amber text-sm">ДИСИДЕНТСЬКІ ДУМКИ ({result.dissent.length})</span>
              </div>
              <div className="space-y-2">
                {result.dissent.map((d: any, i: number) => (
                  <div key={i} className="text-xs p-2 border-l-2 bg-amber/5" style={{ borderColor: "#FF8C00" }}>
                    <div className="text-amber text-[10px] mb-1">{d.model}</div>
                    <div className="text-muted">{d.point}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PER-MODEL BREAKDOWN */}
          <div className="titan-live-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-sm">{t("page.nexus.models_lbl", lang)} ({result.models.length})</span>
            </div>
            <div className="grid gap-2">
              {result.models.map((m: any) => {
                const col = MODEL_COLORS[m.name] || "#6b7280";
                return (
                  <details key={m.id} className="border" style={{ borderColor: col + "30", background: col + "05" }}>
                    <summary className="cursor-pointer p-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {m.status === "ok"    && <CheckCircle2  className="w-3 h-3 text-safe shrink-0" />}
                        {m.status === "error" && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                        {m.status === "skip"  && <Activity      className="w-3 h-3 text-muted shrink-0" />}
                        <span className="font-bold" style={{ color: col }}>{m.name}</span>
                        {m.status === "ok"    && <span className="text-[9px] text-muted">{m.latencyMs}ms · agreement {(m.agreement * 100).toFixed(0)}%</span>}
                        {m.status === "error" && <span className="text-[9px] text-red-400">{m.error}</span>}
                        {m.status === "skip"  && <span className="text-[9px] text-muted">no API key</span>}
                      </div>
                    </summary>
                    {m.text && (
                      <div className="p-2 pt-0 text-xs whitespace-pre-wrap text-muted border-t" style={{ borderColor: col + "20" }}>
                        {m.text}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!currentResult && !isPending && (
        <div className="titan-card text-center py-10 mb-5">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-50" />
          {tab === "orchestra"
            ? <p className="text-sm text-muted">Orchestra опитає всі {active.length || 4} моделей паралельно і зведе відповіді в консенсус.</p>
            : <p className="text-sm text-muted">Обери модель зверху (від Nano до Ultra) та введи запит.</p>
          }
          {active.length === 0 && (
            <a href="./settings" className="inline-block mt-3 titan-btn titan-btn-amber">
              <MessageSquare className="w-4 h-4 mr-1 inline" /> Додати API ключі
            </a>
          )}
        </div>
      )}
    </div>
  );
}
