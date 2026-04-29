import { useState, useEffect, useRef, useCallback } from "react";

// ─── Telegram WebApp SDK shim ───────────────────────────────────────────────
const tg = typeof window !== "undefined" && window.Telegram?.WebApp
  ? window.Telegram.WebApp
  : { ready: () => {}, expand: () => {}, MainButton: { hide: () => {} }, themeParams: {}, colorScheme: "dark" };

// ─── Capability cards ────────────────────────────────────────────────────────
const CAPABILITIES = [
  { id: "website",  icon: "🌐", label: "Сайт",       color: "#00d4ff", desc: "Генерація сайтів та лендінгів" },
  { id: "code",     icon: "💻", label: "Код",         color: "#7fff00", desc: "Будь-яка мова програмування" },
  { id: "image",    icon: "🎨", label: "Зображення",  color: "#ff6bff", desc: "AI-генерація картинок" },
  { id: "video",    icon: "🎬", label: "Відео",       color: "#ff9f43", desc: "Сценарій, монтаж, анімація" },
  { id: "film",     icon: "🎥", label: "Фільм",       color: "#ff4757", desc: "Повний кіно-пайплайн" },
  { id: "bot",      icon: "🤖", label: "Telegram Бот",color: "#1dd1a1", desc: "Створення ботів і TMA" },
  { id: "music",    icon: "🎵", label: "Музика",      color: "#feca57", desc: "Генерація треків та звуків" },
  { id: "text",     icon: "✍️", label: "Текст",       color: "#a29bfe", desc: "Статті, сценарії, SEO" },
];

// ─── System prompt builder ───────────────────────────────────────────────────
function buildSystemPrompt(mode) {
  const base = `Ти — NEXUS, найпотужніший мультимедійний AI-агент. Ти відповідаєш ВИКЛЮЧНО українською мовою.
Ти вмієш: створювати сайти (HTML/CSS/JS/React), писати код будь-якою мовою, генерувати сценарії для відео та фільмів, описувати промпти для генерації зображень (Midjourney/DALL-E/Stable Diffusion), створювати Telegram-ботів і TMA (Mini Apps), писати музичні тексти та описи треків, генерувати SEO-тексти та статті.
Стиль відповіді: лаконічно, по суті, з конкретним результатом. Якщо запит на код — дай повний робочий код. Якщо на зображення — дай детальний промпт англійською + опис українською. Якщо на відео — дай покроковий сценарій.`;

  const modeMap = {
    website: "Зараз режим САЙТ. Генеруй повний HTML/CSS/JS або React код. Додавай коментарі. Код має бути production-ready.",
    code:    "Зараз режим КОД. Пиши чистий, оптимізований код з поясненнями. Використовуй найкращі практики.",
    image:   "Зараз режим ЗОБРАЖЕННЯ. Генеруй детальні англомовні промпти для Midjourney/DALL-E. Формат: **Prompt:** ... **Style:** ... **Negative:** ...",
    video:   "Зараз режим ВІДЕО. Створюй покрокові сценарії: таймкод, кадр, текст, звук, ефекти.",
    film:    "Зараз режим ФІЛЬМ. Повний кіно-пайплайн: ідея → синопсис → сценарій → раскадровка → бюджет.",
    bot:     "Зараз режим TELEGRAM BOT/TMA. Генеруй повний код на Python (aiogram) або JS (telegraf), включно з деплоєм на Railway/Vercel.",
    music:   "Зараз режим МУЗИКА. Створюй тексти пісень, промпти для Suno/Udio, описи жанру та інструментів.",
    text:    "Зараз режим ТЕКСТ. Пиши структуровані тексти: статті, пости, SEO-контент з мета-тегами.",
  };

  return base + (mode ? "\n\n" + (modeMap[mode] || "") : "");
}

// ─── API call ────────────────────────────────────────────────────────────────
async function callClaude(messages, mode) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: buildSystemPrompt(mode),
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("\n") || "Помилка відповіді";
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="code-block"><span class="lang">${lang || "code"}</span><code>${code.replace(/</g,"&lt;")}</code></pre>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s(.+)/gm, "<h3>$1</h3>")
    .replace(/\n/g, "<br/>");
}

// ─── Components ──────────────────────────────────────────────────────────────
function CapabilityPill({ cap, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? cap.color : "rgba(255,255,255,0.06)",
        border: `1px solid ${active ? cap.color : "rgba(255,255,255,0.12)"}`,
        color: active ? "#000" : "#ccc",
        borderRadius: 24,
        padding: "6px 14px",
        fontSize: 13,
        fontFamily: "'Space Mono', monospace",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        transition: "all 0.2s",
        fontWeight: active ? 700 : 400,
        boxShadow: active ? `0 0 12px ${cap.color}88` : "none",
      }}
    >
      <span>{cap.icon}</span>
      {cap.label}
    </button>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg,#00d4ff,#7fff00)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 4,
        }}>⚡</div>
      )}
      <div style={{
        maxWidth: "82%",
        background: isUser
          ? "linear-gradient(135deg,#1e3a5f,#0d2137)"
          : "rgba(255,255,255,0.05)",
        border: isUser
          ? "1px solid rgba(0,212,255,0.3)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 14,
        lineHeight: 1.6,
        color: "#e8e8e8",
        fontFamily: "'Space Mono', monospace",
        wordBreak: "break-word",
      }}
        dangerouslySetInnerHTML={{ __html: isUser ? msg.content : renderMarkdown(msg.content) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg,#00d4ff,#7fff00)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
      }}>⚡</div>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px 18px 18px 4px",
        padding: "12px 18px",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#00d4ff",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function NexusAgent() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [mode, setMode]           = useState(null);
  const [showCaps, setShowCaps]   = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    tg.ready();
    tg.expand();
    // Welcome message
    setMessages([{
      role: "assistant",
      content: `🚀 **NEXUS запущено!**\n\nЯ твій мультимедійний AI-агент. Можу:\n\n🌐 Створювати сайти\n💻 Писати код\n🎨 Генерувати зображення\n🎬 Робити відео-сценарії\n🎥 Повний кіно-пайплайн\n🤖 Telegram боти & TMA\n🎵 Музику та тексти\n✍️ Статті та SEO\n\nОбери режим або просто запитай!`,
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setShowCaps(false);

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const apiMessages = history.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(apiMessages, mode);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Помилка з'єднання. Спробуй ще раз." }]);
    }
    setLoading(false);
  }, [input, loading, messages, mode]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const activeCapability = CAPABILITIES.find(c => c.id === mode);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #090e1a; }
        @keyframes pulse {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glow {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-anim { animation: slideUp 0.25s ease; }
        pre.code-block {
          background: #0a0a0a;
          border: 1px solid rgba(0,212,255,0.2);
          border-radius: 10px;
          padding: 12px;
          overflow-x: auto;
          font-size: 12px;
          position: relative;
          margin: 8px 0;
          white-space: pre-wrap;
        }
        .lang {
          position: absolute; top: 6px; right: 10px;
          font-size: 10px; color: #00d4ff; opacity: 0.7;
        }
        code { font-family: 'Space Mono', monospace; color: #7fff00; }
        h3 { color: #00d4ff; margin: 6px 0; font-family: 'Orbitron', sans-serif; font-size: 13px; }
        strong { color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 4px; }
        textarea { resize: none; }
        textarea:focus { outline: none; }
      `}</style>

      <div style={{
        height: "100dvh",
        background: "linear-gradient(160deg,#060c1c 0%,#090e1a 60%,#05101f 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Space Mono', monospace",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Scanline effect */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(0,212,255,0.15)",
          background: "rgba(6,12,28,0.9)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "linear-gradient(135deg,#00d4ff 0%,#7fff00 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: "0 0 20px rgba(0,212,255,0.5)",
                animation: "glow 3s ease-in-out infinite",
              }}>⚡</div>
              <div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 16, fontWeight: 900,
                  background: "linear-gradient(90deg,#00d4ff,#7fff00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: 2,
                }}>NEXUS</div>
                <div style={{ fontSize: 10, color: "#7fff00", opacity: 0.7, letterSpacing: 1 }}>
                  MULTIMEDIA AI AGENT
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 10, color: "#00d4ff",
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              borderRadius: 20, padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#7fff00",
                boxShadow: "0 0 6px #7fff00",
                animation: "glow 2s ease-in-out infinite",
                display: "inline-block",
              }} />
              ONLINE
            </div>
          </div>

          {/* Mode pills */}
          <div style={{
            display: "flex", gap: 6, marginTop: 10,
            overflowX: "auto", paddingBottom: 2,
          }}>
            {CAPABILITIES.map(cap => (
              <CapabilityPill
                key={cap.id}
                cap={cap}
                active={mode === cap.id}
                onClick={() => {
                  setMode(prev => prev === cap.id ? null : cap.id);
                  setShowCaps(false);
                }}
              />
            ))}
          </div>

          {/* Active mode banner */}
          {activeCapability && (
            <div style={{
              marginTop: 8,
              padding: "6px 12px",
              background: `${activeCapability.color}15`,
              border: `1px solid ${activeCapability.color}44`,
              borderRadius: 8,
              fontSize: 11,
              color: activeCapability.color,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{activeCapability.icon}</span>
              <span>Режим: <strong>{activeCapability.label}</strong> — {activeCapability.desc}</span>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "16px 14px",
          zIndex: 1,
        }}>
          {/* Capability showcase when fresh */}
          {showCaps && messages.length <= 1 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 8, marginBottom: 16,
            }}>
              {CAPABILITIES.map(cap => (
                <button
                  key={cap.id}
                  onClick={() => {
                    setMode(cap.id);
                    setShowCaps(false);
                    setInput(`Допоможи мені з ${cap.label.toLowerCase()}`);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${cap.color}33`,
                    borderRadius: 12,
                    padding: "10px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{cap.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cap.color, fontFamily: "'Space Mono',monospace" }}>{cap.label}</div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{cap.desc}</div>
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="msg-anim">
              <Message msg={msg} />
            </div>
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(0,212,255,0.12)",
          background: "rgba(6,12,28,0.95)",
          backdropFilter: "blur(16px)",
          zIndex: 10,
        }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(0,212,255,0.25)",
            borderRadius: 16,
            padding: "8px 8px 8px 14px",
            transition: "border-color 0.2s",
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                mode
                  ? `Запит для режиму ${CAPABILITIES.find(c=>c.id===mode)?.label}...`
                  : "Запитай NEXUS про що завгодно..."
              }
              rows={1}
              style={{
                flex: 1, background: "transparent",
                border: "none", color: "#e8e8e8",
                fontSize: 14, lineHeight: 1.5,
                fontFamily: "'Space Mono', monospace",
                maxHeight: 120,
                minHeight: 22,
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: input.trim() && !loading
                  ? "linear-gradient(135deg,#00d4ff,#7fff00)"
                  : "rgba(255,255,255,0.08)",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
                transition: "all 0.2s",
                boxShadow: input.trim() && !loading ? "0 0 16px rgba(0,212,255,0.4)" : "none",
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>

          <div style={{
            textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)",
            marginTop: 8, letterSpacing: 0.5,
          }}>
            NEXUS v4 · Powered by Claude · Telegram Mini App
          </div>
        </div>
      </div>
    </>
  );
}
