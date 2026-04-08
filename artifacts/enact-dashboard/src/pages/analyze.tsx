import { useState } from "react";
import { Search, Zap, AlertTriangle, CheckCircle, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api = (p: string) => `${BASE}/api${p}`;

type Mode = "contract" | "honeypot";

const PROGRESS_LABELS = [
  { from: 0,  to: 30,  label: "⚡ ХАОС — Парсинг сирих даних..." },
  { from: 30, to: 80,  label: "🔍 ПОШУК — Порівняння з knowledge base..." },
  { from: 80, to: 99,  label: "🧬 СИНТЕЗ — Генерація звіту Gemini AI..." },
  { from: 99, to: 100, label: "✅ ТРІУМФ — Аналіз завершено!" },
];

function getProgressLabel(p: number) {
  return PROGRESS_LABELS.find(l => p >= l.from && p <= l.to)?.label || "";
}

export default function AnalyzePage() {
  const { toast } = useToast();
  const [mode, setMode]       = useState<Mode>("contract");
  const [address, setAddress] = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]   = useState<any>(null);

  const animateProgress = (cb: () => Promise<any>) => {
    setProgress(0); setResult(null);
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(95, p + (p < 30 ? 3 : p < 80 ? 1.5 : 0.5));
      setProgress(Math.floor(p));
    }, 200);
    return cb().finally(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setProgress(0), 3000);
    });
  };

  const analyze = async () => {
    if (!address.trim() && !code.trim())
      return toast({ title: "Вкажи адресу або код!", variant: "destructive" });
    setLoading(true);
    try {
      await animateProgress(async () => {
        const path = mode === "honeypot" ? "/analyze/honeypot" : "/analyze";
        const r = await fetch(api(path), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: address.trim() || undefined, code: code.trim() || undefined }),
        });
        const d = await r.json();
        setResult(d);
      });
    } catch (e: any) {
      toast({ title: "Помилка запиту", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-safe" : s >= 50 ? "text-amber" : "text-danger";
  const sevColor: Record<string, string> = { critical: "text-danger", high: "text-orange-400", medium: "text-amber", low: "text-primary", none: "text-safe" };

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ NEURAL ANALYSIS</h1>
        <p className="titan-subtitle">Gemini AI · Smart Contract Auditor · HoneyPot Detector</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button className={`titan-mode-btn ${mode === "contract" ? "active" : ""}`} onClick={() => setMode("contract")}>
          <Shield className="w-4 h-4 mr-1" />CONTRACT AUDIT
        </button>
        <button className={`titan-mode-btn ${mode === "honeypot" ? "active" : ""}`} onClick={() => setMode("honeypot")}>
          <AlertTriangle className="w-4 h-4 mr-1" />HONEYPOT CHECK
        </button>
      </div>

      {/* Input */}
      <div className="titan-card mb-6">
        <input
          className="titan-input w-full mb-3"
          placeholder="EQ... або UQ... (адреса контракту)"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <textarea
          className="titan-input w-full h-32 mb-3 resize-none font-mono text-xs"
          placeholder="// Вставте Tact/FunC код контракту (необов'язково)"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button className="titan-btn titan-btn-primary w-full" onClick={analyze} disabled={loading}>
          {loading ? (
            <><Activity className="w-4 h-4 mr-2 animate-spin" />АНАЛІЗУЮ...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" />{mode === "honeypot" ? "DETECT HONEYPOT" : "AUDIT CONTRACT"}</>
          )}
        </button>
      </div>

      {/* Progress animation */}
      {(loading || progress > 0) && (
        <div className={`titan-card mb-6 ${progress === 100 ? "titan-flash-success" : ""}`}>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-primary font-mono">{getProgressLabel(progress)}</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <div className="titan-progress-track">
            <div
              className="titan-progress-fill transition-all duration-200"
              style={{ width: `${progress}%`, background: progress === 100 ? "#00FF88" : "#00FFFF" }}
            />
          </div>
          {progress === 100 && (
            <div className="text-center text-safe font-bold text-lg mt-3 animate-pulse">
              ✅ АНАЛІЗ ЗАВЕРШЕНО!
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {mode === "honeypot" ? (
            <div className={`titan-card border-2 ${result.is_honeypot ? "border-danger/60" : "border-safe/60"}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.is_honeypot
                  ? <AlertTriangle className="w-8 h-8 text-danger" />
                  : <CheckCircle className="w-8 h-8 text-safe" />
                }
                <div>
                  <div className={`text-xl font-bold ${result.is_honeypot ? "text-danger" : "text-safe"}`}>
                    {result.is_honeypot ? "⚠️ HONEYPOT ВИЯВЛЕНО!" : "✅ HONEYPOT НЕ ВИЯВЛЕНО"}
                  </div>
                  <div className="text-sm text-muted">{result.verdict}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center titan-stat-mini">
                  <div className={`text-2xl font-bold ${result.is_honeypot ? "text-danger" : "text-safe"}`}>
                    {((result.confidence || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted">CONFIDENCE</div>
                </div>
                <div className="text-center titan-stat-mini">
                  <div className={`text-2xl font-bold ${result.safe_to_interact ? "text-safe" : "text-danger"}`}>
                    {result.safe_to_interact ? "SAFE" : "DANGER"}
                  </div>
                  <div className="text-xs text-muted">VERDICT</div>
                </div>
              </div>
              {result.red_flags?.length > 0 && (
                <div>
                  <div className="titan-label mb-2">RED FLAGS</div>
                  <div className="space-y-1">
                    {result.red_flags.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-3 h-3 text-danger shrink-0" />
                        <span className="text-danger">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="titan-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="titan-label">AUDIT RESULT</span>
                  </div>
                  <div className={`text-3xl font-bold ${scoreColor(result.score || 0)}`}>
                    {result.score || 0}/100
                  </div>
                </div>
                <p className="text-sm text-foreground mb-3">{result.summary}</p>
                <div className="titan-progress-track mb-2">
                  <div className="titan-progress-fill" style={{ width: `${result.score || 0}%`, background: result.score >= 80 ? "#00FF88" : result.score >= 50 ? "#FF8C00" : "#FF3355" }} />
                </div>
                {result.recommendation && (
                  <div className="mt-3 p-2 border border-primary/20 bg-primary/5 text-xs text-primary">
                    <Zap className="w-3 h-3 inline mr-1" />{result.recommendation}
                  </div>
                )}
              </div>

              {result.vulnerabilities?.length > 0 && (
                <div className="titan-card">
                  <div className="titan-label mb-3">ВИЯВЛЕНІ ВРАЗЛИВОСТІ ({result.vulnerabilities.length})</div>
                  <div className="space-y-2">
                    {result.vulnerabilities.map((v: any, i: number) => (
                      <div key={i} className="p-2 border border-border bg-card/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${sevColor[v.severity] || "text-muted"}`}>[{v.severity?.toUpperCase()}]</span>
                          <span className="text-sm font-medium text-foreground">{v.type}</span>
                        </div>
                        <div className="text-xs text-muted">{v.description}</div>
                        {v.impact && <div className="text-xs text-danger mt-0.5">Impact: {v.impact}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
