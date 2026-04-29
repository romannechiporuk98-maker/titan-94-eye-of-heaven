import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

const CAPABILITIES = [
  { id: "website",  icon: "🌐", label: "Сайт",        color: "#00FFFF" },
  { id: "code",     icon: "💻", label: "Код",         color: "#7fff00" },
  { id: "image",    icon: "🎨", label: "Зображення",  color: "#ff6bff" },
  { id: "video",    icon: "🎬", label: "Відео",       color: "#ff9f43" },
  { id: "film",     icon: "🎥", label: "Фільм",       color: "#ff4757" },
  { id: "bot",      icon: "🤖", label: "Telegram",    color: "#1dd1a1" },
  { id: "music",    icon: "🎵", label: "Музика",      color: "#feca57" },
  { id: "text",     icon: "✍️", label: "Текст",       color: "#a29bfe" },
];

type Msg = { role: "user" | "assistant"; content: string };

function renderMd(text: string) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="nx-code"><span class="nx-lang">${lang || "code"}</span><code>${code.replace(/</g, "&lt;")}</code></pre>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s(.+)$/gm, "<h3>$1</h3>")
    .replace(/\n/g, "<br/>");
}

export default function NexusPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<string | null>(null);
  const [keyOk, setKeyOk]       = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(api("/nexus/status")).then(r => r.json()).then((s) => setKeyOk(!!s.keyConfigured));
    setMessages([{
      role: "assistant",
      content: `🚀 **NEXUS — мультимедійний AI-агент TITAN-94**\n\nЯ можу:\n\n🌐 Сайти · 💻 Код · 🎨 Зображення · 🎬 Відео · 🎥 Фільми\n🤖 Telegram боти · 🎵 Музика · ✍️ Тексти\n\nОбери режим або просто запитай українською.`,
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(api("/nexus/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, mode: mode || "general" }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "⚠️ Порожня відповідь" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Помилка з'єднання з NEXUS" }]);
    }
    setLoading(false);
  }, [input, loading, mode]);

  return (
    <div className="titan-page flex flex-col h-full">
      <style>{`
        .nx-code { background: #050a14; border: 1px solid rgba(0,255,255,0.2); border-radius: 6px; padding: 10px; overflow-x: auto; font-size: 11px; position: relative; margin: 6px 0; white-space: pre-wrap; }
        .nx-lang { position: absolute; top: 4px; right: 8px; font-size: 9px; color: #00FFFF; opacity: 0.6; }
        .nx-msg code { font-family: 'Space Mono', monospace; color: #7fff00; }
        .nx-msg h3 { color: #00FFFF; margin: 4px 0; font-size: 12px; }
        .nx-msg strong { color: #ffffff; }
      `}</style>

      <div className="titan-page-header flex justify-between items-center">
        <div>
          <h1 className="titan-title">◈ NEXUS — AI MULTIMEDIA AGENT</h1>
          <p className="titan-subtitle">
            Gemini 2.0 Flash · {keyOk === null ? "perевірка..." : keyOk ? "● ONLINE" : "⚠ fallback (no key)"}
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-amber" />
      </div>

      {/* Capability pills */}
      <div className="titan-card mb-4">
        <div className="flex flex-wrap gap-2">
          {CAPABILITIES.map((c) => {
            const active = mode === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setMode(active ? null : c.id)}
                className="text-xs px-3 py-1.5 rounded-full transition-all border"
                style={{
                  background: active ? c.color : "rgba(255,255,255,0.04)",
                  borderColor: active ? c.color : "rgba(255,255,255,0.12)",
                  color: active ? "#000" : "#cfffff",
                  fontWeight: active ? 700 : 400,
                  boxShadow: active ? `0 0 12px ${c.color}88` : "none",
                }}
              >{c.icon} {c.label}</button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="titan-card flex-1 overflow-y-auto mb-4 min-h-0">
        <div className="space-y-3">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-full mr-2 mt-1 flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#00FFFF,#00FF88)" }}>⚡</div>
                )}
                <div
                  className="nx-msg max-w-[82%] px-3 py-2 text-xs leading-relaxed"
                  style={{
                    background: isUser ? "linear-gradient(135deg,#1e3a5f,#0d2137)" : "rgba(0,255,255,0.04)",
                    border: `1px solid ${isUser ? "rgba(0,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    color: "#e8e8e8",
                    fontFamily: "'Space Mono', monospace",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: isUser ? m.content : renderMd(m.content) }}
                />
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background: "linear-gradient(135deg,#00FFFF,#00FF88)" }}>⚡</div>
              <div className="px-3 py-2 text-xs" style={{ background: "rgba(0,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px" }}>
                <span className="titan-pulse mr-1" />
                <span className="titan-pulse mr-1" style={{ animationDelay: "0.2s" }} />
                <span className="titan-pulse" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          className="titan-input flex-1 resize-none"
          rows={2}
          placeholder={mode ? `[${mode}] напиши що згенерувати...` : "Запитай NEXUS..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button
          className="titan-btn shrink-0 flex items-center gap-1"
          onClick={send}
          disabled={!input.trim() || loading}
        >
          <Send className="w-4 h-4" /> SEND
        </button>
      </div>
    </div>
  );
}
