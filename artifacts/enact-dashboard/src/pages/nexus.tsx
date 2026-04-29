import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles, Send, Brain, CheckCircle2, AlertTriangle, Zap, Loader2,
  Users, Trophy, MessageSquare, Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

const MODES = [
  { id: "general",  icon: "✨", label: "Загальний" },
  { id: "website",  icon: "🌐", label: "Сайт"      },
  { id: "code",     icon: "💻", label: "Код"       },
  { id: "image",    icon: "🎨", label: "Зображення"},
  { id: "video",    icon: "🎬", label: "Відео"     },
  { id: "bot",      icon: "🤖", label: "Telegram"  },
  { id: "music",    icon: "🎵", label: "Музика"    },
  { id: "text",     icon: "✍",  label: "Текст"     },
];

const MODEL_COLORS: Record<string, string> = {
  Claude: "#FF8C00", "Claude 3.5 Sonnet": "#FF8C00",
  "GPT-4o-mini": "#00FFFF", "GPT-4o": "#00FFFF",
  "Gemini 2.0 Flash": "#9B5CFF", Gemini: "#9B5CFF",
  "Llama-3.3-70B (OR)": "#00FF88", "Llama-OR": "#00FF88",
};

export default function NexusPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("general");
  const [result, setResult] = useState<any>(null);

  const { data: status } = useQuery<any>({
    queryKey: ["/nexus/status"],
    queryFn: () => fetch(api("/nexus/status")).then(r => r.json()),
    refetchInterval: 30000,
  });

  const orchestra = useMutation({
    mutationFn: (b: { prompt: string; mode: string }) =>
      fetch(api("/nexus/orchestra"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }).then(r => r.json()),
    onSuccess: (d) => setResult(d),
    onError: (e: any) => toast({ title: "× " + e.message, variant: "destructive" }),
  });

  const send = () => {
    if (!prompt.trim() || orchestra.isPending) return;
    orchestra.mutate({ prompt: prompt.trim(), mode });
  };

  const active = status?.activeModels || [];
  const orchestraOn = !!status?.orchestraEnabled;

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
            <div className="text-[10px] tracking-[0.4em] text-purple-300/70 mb-1">MODULE 08 · MULTI-MODEL CONSENSUS ENGINE</div>
            <h1 className="text-3xl font-bold" style={{
              background: "linear-gradient(90deg, #9B5CFF, #00FFFF, #FF8C00)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ NEXUS · AI ORCHESTRA</h1>
            <p className="text-xs text-muted mt-1">4 моделі питаються одночасно · агрегація через consensus-judge · показ дисидентських думок</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted tracking-widest">ACTIVE</div>
            <div className={`text-2xl font-bold ${orchestraOn ? "text-safe" : active.length === 1 ? "text-amber" : "text-red-400"}`}>{active.length}/4</div>
            <div className="text-[10px] text-muted">{orchestraOn ? "ORCHESTRA" : active.length === 1 ? "SOLO MODE" : "OFFLINE"}</div>
          </div>
        </div>

        {/* Active models pills */}
        <div className="relative flex flex-wrap gap-1.5 mt-3">
          {["Gemini", "GPT-4o", "Claude", "Llama-OR"].map((m) => {
            const on = active.includes(m);
            const col = MODEL_COLORS[m] || "#6b7280";
            return (
              <span key={m} className="text-[10px] px-2 py-1 border font-mono"
                style={{
                  borderColor: on ? col : "rgba(255,255,255,0.1)",
                  background: on ? col + "15" : "rgba(0,0,0,0.3)",
                  color: on ? col : "#6b7280",
                }}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${on ? "" : "opacity-30"}`} style={{ background: col }}></span>
                {m}{on ? " · ONLINE" : " · NO KEY"}
              </span>
            );
          })}
        </div>
      </div>

      {/* INPUT */}
      <div className="titan-live-card p-4 mb-5">
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
        <div className="flex gap-2">
          <textarea
            className="titan-input flex-1 text-sm resize-none"
            rows={3}
            placeholder={
              orchestraOn
                ? "Запит → 4 моделі обговорять і повернуть консенсус..."
                : active.length === 0
                  ? "Додай хоча б один AI-ключ у Settings (Gemini найшвидше)..."
                  : "Запит → solo-режим..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          />
          <button type="button" onClick={send} disabled={orchestra.isPending || !prompt.trim()}
                  className="titan-btn titan-btn-amber px-4">
            {orchestra.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Zap className="w-4 h-4 mr-1" /> ASK ORCHESTRA</>}
          </button>
        </div>
        <div className="text-[10px] text-muted mt-1">⌘/Ctrl + Enter — швидка відправка</div>
      </div>

      {/* RESULT */}
      {orchestra.isPending && (
        <div className="titan-live-card p-8 text-center mb-5">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted">Опитую {active.length} моделей паралельно...</div>
          <div className="text-[10px] text-muted mt-1">consensus scoring · jaccard tokenization · weighted judge</div>
        </div>
      )}

      {result && !orchestra.isPending && (
        <div className="space-y-4 mb-5">
          {/* CONSENSUS */}
          <div className="titan-live-card p-4" style={{ borderColor: "rgba(0,255,136,0.4)" }}>
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-safe" />
                <span className="font-bold text-safe">CONSENSUS</span>
                <span className="text-[10px] text-muted">judge: <span className="text-amber">{result.judge}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">AGREEMENT</span>
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
              <span className="font-bold text-primary text-sm">МОДЕЛІ ({result.models.length})</span>
            </div>
            <div className="grid gap-2">
              {result.models.map((m: any) => {
                const col = MODEL_COLORS[m.name] || "#6b7280";
                return (
                  <details key={m.id} className="border" style={{ borderColor: col + "30", background: col + "05" }}>
                    <summary className="cursor-pointer p-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {m.status === "ok"   && <CheckCircle2 className="w-3 h-3 text-safe shrink-0" />}
                        {m.status === "error" && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                        {m.status === "skip"  && <Activity      className="w-3 h-3 text-muted shrink-0" />}
                        <span className="font-bold" style={{ color: col }}>{m.name}</span>
                        {m.status === "ok" && <span className="text-[9px] text-muted">{m.latencyMs}ms · agreement {(m.agreement * 100).toFixed(0)}%</span>}
                        {m.status === "error" && <span className="text-[9px] text-red-400">{m.error}</span>}
                        {m.status === "skip" && <span className="text-[9px] text-muted">no API key</span>}
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

      {!result && !orchestra.isPending && (
        <div className="titan-card text-center py-10 mb-5">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted">Постав запит вище — Orchestra опитає всі {active.length || 4} моделей паралельно і зведе відповіді в один консенсус.</p>
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
