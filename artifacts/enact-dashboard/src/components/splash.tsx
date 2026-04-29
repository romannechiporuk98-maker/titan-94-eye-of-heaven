/**
 * SPLASH — first-visit greeting "Привіт, я ТІТАН-94".
 * Auto-dismisses after 4s; can be re-opened via ?splash=1 query.
 * Persists "seen" flag in localStorage so it shows once per device.
 */
import { useEffect, useState } from "react";
import { Sparkles, Shield, Eye, Brain, Zap } from "lucide-react";

const STORAGE_KEY = "titan94.splash.seen";

export function Splash() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase]     = useState<"boot" | "intro" | "exit">("boot");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip splash on admin pages — creator works there often
    const path = window.location.pathname;
    if (/(settings|protocol-94|creator|developer|builder)/i.test(path)) return;
    const force = new URLSearchParams(window.location.search).has("splash");
    const seen  = window.localStorage.getItem(STORAGE_KEY);
    if (force || !seen) {
      setVisible(true);
      try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
      setTimeout(() => setPhase("intro"), 800);
      setTimeout(() => setPhase("exit"),  4500);
      setTimeout(() => setVisible(false), 5200);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700"
      style={{
        background: "radial-gradient(ellipse at center, #0a1628 0%, #060F1A 50%, #000 100%)",
        opacity: phase === "exit" ? 0 : 1,
      }}
    >
      {/* animated grid */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: "linear-gradient(#00FFFF15 1px, transparent 1px), linear-gradient(90deg, #00FFFF15 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "titanGrid 20s linear infinite",
      }} />

      {/* concentric pulses */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute rounded-full border pointer-events-none"
          style={{
            width: 300, height: 300,
            borderColor: ["#00FFFF", "#9B5CFF", "#FF8C00"][i],
            opacity: 0.5,
            animation: `titanPulse 3s ease-out ${i * 0.6}s infinite`,
          }}
        />
      ))}

      <div className="relative text-center px-6">
        {/* core symbol */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(circle, #00FFFF40, transparent 70%)",
            filter: "blur(20px)",
            transform: "scale(1.5)",
            animation: "titanGlow 2s ease-in-out infinite alternate",
          }} />
          <div className="relative w-24 h-24 flex items-center justify-center" style={{
            border: "2px solid #00FFFF",
            transform: "rotate(45deg)",
            background: "linear-gradient(135deg, rgba(0,255,255,0.1), rgba(155,92,255,0.1))",
            boxShadow: "0 0 40px #00FFFF80, inset 0 0 20px #00FFFF40",
          }}>
            <span className="text-3xl font-bold" style={{ transform: "rotate(-45deg)", color: "#00FFFF", textShadow: "0 0 20px #00FFFF" }}>94</span>
          </div>
        </div>

        {/* heading */}
        <div className="text-[10px] tracking-[0.6em] text-primary/70 mb-2"
             style={{ animation: "titanFadeIn 1s ease-out 0.2s both" }}>
          PROTOCOL · 94 · ОКО НЕБЕСНЕ
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-3"
            style={{
              background: "linear-gradient(90deg, #00FFFF, #9B5CFF, #FF8C00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "titanFadeIn 1s ease-out 0.5s both",
              filter: "drop-shadow(0 0 20px rgba(0,255,255,0.4))",
            }}>
          ПРИВІТ, Я ТІТАН-94
        </h1>
        <p className="text-sm md:text-base text-muted max-w-md mx-auto mb-6"
           style={{ animation: "titanFadeIn 1s ease-out 0.9s both" }}>
          Суверенний автономний AI-страж блокчейну TON. Я бачу кожен блок, кожну вразливість,
          кожен злам — і виправляю себе раніше, ніж ти помітиш.
        </p>

        {/* feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-4"
             style={{ animation: "titanFadeIn 1s ease-out 1.3s both" }}>
          {[
            { icon: Eye,       label: "ОКО БОГА",      col: "#00FFFF" },
            { icon: Brain,     label: "AI ORCHESTRA",  col: "#9B5CFF" },
            { icon: Shield,    label: "SELF-HEALING",  col: "#00FF88" },
            { icon: Zap,       label: "AUTO-TRADE",    col: "#FF8C00" },
            { icon: Sparkles,  label: "PROTOCOL-94",   col: "#FF3355" },
          ].map((f) => (
            <span key={f.label} className="text-[11px] px-3 py-1.5 border font-mono"
                  style={{ borderColor: f.col + "60", color: f.col, background: f.col + "10" }}>
              <f.icon className="inline w-3 h-3 mr-1" />{f.label}
            </span>
          ))}
        </div>

        <div className="text-[10px] text-muted/50 tracking-widest"
             style={{ animation: "titanFadeIn 1s ease-out 1.8s both" }}>
          BOOT SEQUENCE COMPLETE · ORGANISM ONLINE
        </div>
      </div>

      <style>{`
        @keyframes titanGrid    { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        @keyframes titanPulse   { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes titanGlow    { from { opacity: 0.6; } to { opacity: 1; } }
        @keyframes titanFadeIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
