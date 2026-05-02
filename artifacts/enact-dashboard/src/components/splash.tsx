/**
 * SPLASH — first-visit greeting with language selection.
 * Phase 1: language picker (shows 6 languages as flag cards)
 * Phase 2: greeting in the selected language + feature pills
 * Phase 3: fade-out and dismiss
 *
 * Re-show: add ?splash=1 to URL. Suppress: ?splash=0.
 * Respects LangProvider — setLang propagates to all components instantly.
 */
import { useEffect, useState } from "react";
import { Sparkles, Shield, Eye, Brain, Zap } from "lucide-react";
import { useLang, t, type Lang } from "@/lib/ui-prefs";

const STORAGE_KEY = "titan94.splash.seen";

const LANG_OPTIONS: { code: Lang; flag: string; name: string }[] = [
  { code: "uk", flag: "🇺🇦", name: "Українська" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
];

const FEATURES = [
  { icon: Eye,      key: "EYE OF GOD",    col: "#00FFFF" },
  { icon: Brain,    key: "AI ORCHESTRA",  col: "#9B5CFF" },
  { icon: Shield,   key: "SELF-HEALING",  col: "#00FF88" },
  { icon: Zap,      key: "AUTO-TRADE",    col: "#FF8C00" },
  { icon: Sparkles, key: "PROTOCOL-94",   col: "#FF3355" },
];

type Phase = "lang" | "intro" | "exit";

export function Splash() {
  const { lang, setLang } = useLang();
  const [visible, setVisible]   = useState(false);
  const [phase, setPhase]       = useState<Phase>("lang");
  const [chosen, setChosen]     = useState<Lang | null>(null);
  const [hovered, setHovered]   = useState<Lang | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (/(settings|protocol-94|vault|access|creator|developer|builder)/i.test(path)) return;
    const qs    = new URLSearchParams(window.location.search);
    if (qs.get("splash") === "0") return;
    const force = qs.has("splash") && qs.get("splash") !== "0";
    const seen  = window.localStorage.getItem(STORAGE_KEY);
    if (force || !seen) {
      setVisible(true);
      try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    }
  }, []);

  const pickLang = (l: Lang) => {
    setChosen(l);
    setLang(l);
    setPhase("intro");
    setTimeout(() => setPhase("exit"),  4000);
    setTimeout(() => setVisible(false), 4800);
  };

  const activeLang = chosen || lang;

  useEffect(() => {
    if (phase !== "lang" || !visible) return;
    const timer = setTimeout(() => pickLang(lang), 8000);
    return () => clearTimeout(timer);
  }, [phase, visible, lang]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700"
      style={{
        background: "radial-gradient(ellipse at center, #0a1628 0%, #060F1A 60%, #000 100%)",
        opacity: phase === "exit" ? 0 : 1,
      }}
    >
      {/* animated grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: "linear-gradient(#00FFFF12 1px, transparent 1px), linear-gradient(90deg, #00FFFF12 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "titanGrid 20s linear infinite",
      }} />

      {/* concentric pulses */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute rounded-full border pointer-events-none"
          style={{
            width: 340, height: 340,
            borderColor: ["#00FFFF", "#9B5CFF", "#FF8C00"][i],
            opacity: 0.35,
            animation: `titanPulse 3s ease-out ${i * 0.7}s infinite`,
          }}
        />
      ))}

      <div className="relative text-center px-4 max-w-md w-full">
        {/* core symbol — always visible */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(circle, #00FFFF40, transparent 70%)",
            filter: "blur(20px)",
            transform: "scale(1.5)",
            animation: "titanGlow 2s ease-in-out infinite alternate",
          }} />
          <div className="relative w-20 h-20 flex items-center justify-center" style={{
            border: "2px solid #00FFFF",
            transform: "rotate(45deg)",
            background: "linear-gradient(135deg, rgba(0,255,255,0.1), rgba(155,92,255,0.1))",
            boxShadow: "0 0 40px #00FFFF80, inset 0 0 20px #00FFFF40",
          }}>
            <span className="text-2xl font-bold font-mono" style={{ transform: "rotate(-45deg)", color: "#00FFFF", textShadow: "0 0 20px #00FFFF" }}>94</span>
          </div>
        </div>

        <div className="text-[10px] tracking-[0.5em] mb-4"
             style={{ color: "rgba(0,255,255,0.6)", animation: "titanFadeIn 0.8s ease-out 0.1s both" }}>
          {t("splash.tagline", activeLang)}
        </div>

        {/* ── PHASE: Language picker ──────────────────────────── */}
        {phase === "lang" && (
          <div style={{ animation: "titanFadeIn 0.6s ease-out 0.2s both" }}>
            <div className="text-xs font-bold tracking-[0.3em] mb-4" style={{ color: "#FF8C00" }}>
              {t("splash.choose_lang", activeLang)}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {LANG_OPTIONS.map((opt) => {
                const isHov = hovered === opt.code;
                return (
                  <button
                    key={opt.code}
                    onClick={() => pickLang(opt.code)}
                    onMouseEnter={() => setHovered(opt.code)}
                    onMouseLeave={() => setHovered(null)}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded transition-all duration-200 font-mono"
                    style={{
                      border: `1px solid ${isHov ? "#00FFFF" : "rgba(0,255,255,0.2)"}`,
                      background: isHov ? "rgba(0,255,255,0.12)" : "rgba(0,0,0,0.4)",
                      transform: isHov ? "scale(1.04)" : "scale(1)",
                      boxShadow: isHov ? "0 0 16px rgba(0,255,255,0.3)" : "none",
                    }}
                  >
                    <span className="text-2xl leading-none">{opt.flag}</span>
                    <span className="text-[11px]" style={{ color: isHov ? "#00FFFF" : "rgba(255,255,255,0.7)" }}>
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-muted/50 tracking-widest mb-3">
              auto-select in 8s · click to choose
            </div>
            <button
              onClick={() => { setPhase("exit"); setTimeout(() => setVisible(false), 700); }}
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.28)",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "4px 14px",
                cursor: "pointer",
                letterSpacing: "0.2em",
                fontFamily: "'Space Mono', monospace",
                borderRadius: 2,
              }}
            >
              SKIP →
            </button>
          </div>
        )}

        {/* ── PHASE: Greeting ─────────────────────────────────── */}
        {phase === "intro" && (
          <>
            <h1 className="text-4xl md:text-5xl font-bold mb-3"
                style={{
                  background: "linear-gradient(90deg, #00FFFF, #9B5CFF, #FF8C00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "titanFadeIn 0.7s ease-out both",
                  filter: "drop-shadow(0 0 16px rgba(0,255,255,0.4))",
                }}>
              {t("splash.greeting", activeLang)}
            </h1>
            <p className="text-sm text-muted max-w-xs mx-auto mb-5"
               style={{ animation: "titanFadeIn 0.8s ease-out 0.25s both" }}>
              {t("splash.desc", activeLang)}
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 mb-4"
                 style={{ animation: "titanFadeIn 0.8s ease-out 0.5s both" }}>
              {FEATURES.map((f) => (
                <span key={f.key} className="text-[10px] px-2.5 py-1 border font-mono"
                      style={{ borderColor: f.col + "60", color: f.col, background: f.col + "10" }}>
                  <f.icon className="inline w-3 h-3 mr-1" />{f.key}
                </span>
              ))}
            </div>

            <div className="text-[9px] tracking-widest mt-2"
                 style={{ color: "rgba(255,255,255,0.3)", animation: "titanFadeIn 0.8s ease-out 0.9s both" }}>
              {t("splash.boot", activeLang)}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes titanGrid   { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        @keyframes titanPulse  { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes titanGlow   { from { opacity: 0.5; } to { opacity: 1; } }
        @keyframes titanFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
