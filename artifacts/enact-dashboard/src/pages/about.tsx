/**
 * ABOUT — детальний опис TITAN-94 для нових користувачів.
 * URL: /about — публічна сторінка, доступна без авторизації.
 */
import { ExternalLink, Shield, Brain, Eye, Zap, DollarSign, Lock, Server, Heart, Globe, Mail, FileText } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/ui-prefs";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");

type Lang = "uk" | "en" | "ru";

function S(lang: string, uk: string, en: string, ru: string) {
  if (lang === "en") return en;
  if (lang === "ru") return ru;
  return uk;
}

export default function AboutPage() {
  const { lang } = useLang();
  const L = (uk: string, en: string, ru: string) => S(lang, uk, en, ru);

  return (
    <div className="titan-page titan-grid-bg">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-lg p-6 mb-6" style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.08), rgba(155,92,255,0.06), rgba(255,140,0,0.05))",
        border: "1px solid rgba(0,255,255,0.25)",
      }}>
        <div className="text-[10px] tracking-[0.5em] text-primary/60 mb-2">ABOUT · TITAN-94 · ОКО НЕБЕСНЕ</div>
        <h1 className="text-3xl font-bold mb-2" style={{
          background: "linear-gradient(90deg, #00FFFF, #9B5CFF)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {L("Що таке TITAN-94?", "What is TITAN-94?", "Что такое TITAN-94?")}
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          {L(
            "TITAN-94 — це автономний AI-моніторинг безпеки для блокчейну TON. Система у реальному часі аналізує транзакції, смарт-контракти та on-chain активність для виявлення загроз і вразливостей.",
            "TITAN-94 is an autonomous AI security monitor for the TON blockchain. The system analyzes transactions, smart contracts and on-chain activity in real time to detect threats and vulnerabilities.",
            "TITAN-94 — автономный AI-мониторинг безопасности блокчейна TON. Система в реальном времени анализирует транзакции, смарт-контракты и on-chain активность для обнаружения угроз и уязвимостей.",
          )}
        </p>
      </div>

      {/* WHAT IT DOES */}
      <div className="titan-card mb-4">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {L("Що робить система", "What the system does", "Что делает система")}
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            {
              icon: Eye, color: "#00FFFF",
              title: L("Сканування блокчейну", "Blockchain scanning", "Сканирование блокчейна"),
              text: L(
                "Кожні 3 хвилини система читає нові блоки TON mainchain через публічний API TonCenter/TonAPI. Аналізує транзакції на відомі патерни вразливостей.",
                "Every 3 minutes the system reads new TON mainchain blocks via the public TonCenter/TonAPI. Analyzes transactions for known vulnerability patterns.",
                "Каждые 3 минуты система читает новые блоки TON mainchain через публичный API TonCenter/TonAPI. Анализирует транзакции на известные паттерны уязвимостей.",
              ),
            },
            {
              icon: Brain, color: "#9B5CFF",
              title: L("AI-аналіз загроз", "AI threat analysis", "AI-анализ угроз"),
              text: L(
                "Виявлені загрози аналізуються через Google Gemini 2.0 Flash та NEXUS Orchestra (до 4 моделей одночасно). AI оцінює критичність, рекомендує дії.",
                "Detected threats are analyzed via Google Gemini 2.0 Flash and NEXUS Orchestra (up to 4 models simultaneously). AI assesses criticality and recommends actions.",
                "Обнаруженные угрозы анализируются через Google Gemini 2.0 Flash и NEXUS Orchestra (до 4 моделей одновременно). AI оценивает критичность и рекомендует действия.",
              ),
            },
            {
              icon: Shield, color: "#00FF88",
              title: L("Self-healing цикл", "Self-healing cycle", "Self-healing цикл"),
              text: L(
                "Кожні 5 хвилин система намагається автоматично «вилікувати» знайдені вразливості — оновлює knowledge base, покращує точність детекції.",
                "Every 5 minutes the system tries to automatically \"heal\" found vulnerabilities — updates the knowledge base, improves detection accuracy.",
                "Каждые 5 минут система пытается автоматически «вылечить» найденные уязвимости — обновляет knowledge base, улучшает точность детекции.",
              ),
            },
            {
              icon: Zap, color: "#FF8C00",
              title: L("Telegram сповіщення", "Telegram notifications", "Telegram уведомления"),
              text: L(
                "Критичні загрози надсилаються адміністратору прямо в Telegram. Налаштовується через Settings → TELEGRAM_ADMIN_CHAT_ID.",
                "Critical threats are sent to the administrator directly in Telegram. Configurable via Settings → TELEGRAM_ADMIN_CHAT_ID.",
                "Критические угрозы отправляются администратору прямо в Telegram. Настраивается через Settings → TELEGRAM_ADMIN_CHAT_ID.",
              ),
            },
          ].map((f) => (
            <div key={f.title} className="p-3 border rounded" style={{ borderColor: f.color + "25", background: f.color + "06" }}>
              <div className="flex items-center gap-2 mb-2">
                <f.icon className="w-4 h-4 shrink-0" style={{ color: f.color }} />
                <span className="text-sm font-bold" style={{ color: f.color }}>{f.title}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT IT IS NOT */}
      <div className="titan-card mb-4" style={{ borderColor: "rgba(0,255,136,0.25)" }}>
        <h2 className="text-base font-bold text-safe mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          {L("Що система НЕ робить", "What the system does NOT do", "Что система НЕ делает")}
        </h2>
        <div className="space-y-2">
          {[
            L("❌ Не зберігає і не запитує ваш seed-фразу або приватний ключ гаманця", "❌ Does not store or request your seed phrase or wallet private key", "❌ Не хранит и не запрашивает вашу seed-фразу или приватный ключ кошелька"),
            L("❌ Не проводить транзакції від вашого імені без явної вашої ухвали", "❌ Does not execute transactions on your behalf without explicit approval", "❌ Не проводит транзакции от вашего имени без явного вашего одобрения"),
            L("❌ Не обіцяє гарантованих прибутків — автотрейдинг є ризикованим і за замовчуванням вимкнений", "❌ Does not promise guaranteed profits — autotrading is risky and disabled by default", "❌ Не обещает гарантированных прибылей — автотрейдинг рискован и по умолчанию выключен"),
            L("❌ Не є інвестиційним сервісом — не давай систему поради і не несе відповідальності за торгові рішення", "❌ Is not an investment service — gives no financial advice and bears no responsibility for trading decisions", "❌ Не является инвестиционным сервисом — не даёт финансовых советов и не несёт ответственности за торговые решения"),
            L("❌ Не збирає особисті дані крім Telegram ID і username (публічні)", "❌ Does not collect personal data beyond Telegram ID and username (public)", "❌ Не собирает личные данные кроме Telegram ID и username (публичных)"),
          ].map((item) => (
            <div key={item} className="text-xs text-muted p-2 border-l-2 bg-safe/5" style={{ borderColor: "#00FF88" }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* SUBSCRIPTION */}
      <div className="titan-card mb-4">
        <h2 className="text-base font-bold text-amber mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          {L("Модель монетизації", "Business model", "Модель монетизации")}
        </h2>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          {L(
            "TITAN-94 використовує прозору підписну модель. Базовий моніторинг безкоштовний. Розширені функції (пріоритетний HEAL, авто-трейдинг, NEXUS Orchestra) доступні за підпискою.",
            "TITAN-94 uses a transparent subscription model. Basic monitoring is free. Advanced features (priority HEAL, autotrading, NEXUS Orchestra) are available by subscription.",
            "TITAN-94 использует прозрачную подписную модель. Базовый мониторинг бесплатен. Расширенные функции (приоритетный HEAL, авто-трейдинг, NEXUS Orchestra) доступны по подписке.",
          )}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { plan: "FREE",      price: "0 TON",   col: "#6b7280", features: L("Базовий моніторинг", "Basic monitoring", "Базовый мониторинг") },
            { plan: "PRO",       price: "5 TON/міс", col: "#00FFFF", features: L("NEXUS AI + Сповіщення", "NEXUS AI + Notifications", "NEXUS AI + Уведомления") },
            { plan: "ELITE",     price: "20 TON/міс", col: "#FF8C00", features: L("Авто-трейдинг + Earn", "Autotrading + Earn", "Авто-трейдинг + Earn") },
            { plan: "DEVELOPER", price: "1000 TON", col: "#9B5CFF", features: L("Повний API доступ", "Full API access", "Полный API доступ") },
          ].map((p) => (
            <div key={p.plan} className="p-3 border text-center" style={{ borderColor: p.col + "40", background: p.col + "08" }}>
              <div className="text-xs font-bold mb-1" style={{ color: p.col }}>{p.plan}</div>
              <div className="text-sm font-bold text-foreground mb-1">{p.price}</div>
              <div className="text-[10px] text-muted">{p.features}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2">
          {L(
            "Оплата проходить через TON-гаманець (Tonkeeper) — без реєстрації, без банківських карт. Транзакції верифікуються on-chain.",
            "Payment is via TON wallet (Tonkeeper) — no registration, no bank cards. Transactions are verified on-chain.",
            "Оплата через TON-кошелёк (Tonkeeper) — без регистрации, без банковских карт. Транзакции верифицируются on-chain.",
          )}
        </p>
      </div>

      {/* TECH STACK */}
      <div className="titan-card mb-4">
        <h2 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
          <Server className="w-4 h-4" />
          {L("Технологічний стек", "Technology stack", "Технологический стек")}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Backend",      "Node.js 24, Express 5, PostgreSQL, Drizzle ORM"],
            ["Frontend",     "React 18, Vite, Tailwind v4, TanStack Query"],
            ["Blockchain",   "TON mainchain, TonCenter API, TonAPI, TON Connect"],
            ["AI",           "Google Gemini 2.0 Flash, OpenRouter (Llama-3.3)"],
            ["Hosting",      "Replit (EU region), автоматичні бекапи БД"],
            ["Auth",         "Telegram WebApp initData (не зберігаємо паролі)"],
          ].map(([k, v]) => (
            <div key={k} className="p-2 border" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
              <div className="text-[10px] text-muted tracking-widest mb-0.5">{k}</div>
              <div className="text-primary/80 font-mono text-[11px]">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COMMUNITY & LINKS */}
      <div className="titan-card mb-4">
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {L("Посилання та спільнота", "Links & community", "Ссылки и сообщество")}
        </h2>
        <div className="space-y-2">
          {[
            {
              label: L("TON Blockchain (офіційний)", "TON Blockchain (official)", "TON Blockchain (официальный)"),
              url: "https://ton.org",
              color: "#0098EA",
            },
            {
              label: L("TON Viewer — перегляд on-chain транзакцій", "TON Viewer — view on-chain transactions", "TON Viewer — просмотр on-chain транзакций"),
              url: "https://tonviewer.com",
              color: "#00FFFF",
            },
            {
              label: L("ENACT Protocol — ринок AI завдань на TON", "ENACT Protocol — AI task market on TON", "ENACT Protocol — рынок AI задач на TON"),
              url: "https://github.com",
              color: "#9B5CFF",
            },
          ].map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-between p-3 border transition hover:border-primary/40"
               style={{ borderColor: "rgba(0,255,255,0.15)" }}>
              <span className="text-xs" style={{ color: l.color }}>{l.label}</span>
              <ExternalLink className="w-3 h-3 text-muted shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* CONTACT */}
      <div className="titan-card mb-4" style={{ borderColor: "rgba(255,140,0,0.2)" }}>
        <h2 className="text-base font-bold text-amber mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {L("Підтримка та контакти", "Support & contacts", "Поддержка и контакты")}
        </h2>
        <div className="space-y-2 text-xs text-muted">
          <p>{L(
            "Маєш питання, знайшов баг або хочеш запропонувати функцію — звертайся через Telegram боту або в групу підтримки.",
            "Have questions, found a bug, or want to propose a feature — reach out via the Telegram bot or support group.",
            "Есть вопросы, нашёл баг или хочешь предложить функцию — обращайся через Telegram бот или в группу поддержки.",
          )}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="https://t.me/TITAN94_BOT" target="_blank" rel="noopener"
               className="inline-flex items-center gap-1 titan-btn titan-btn-sm text-xs">
              <Heart className="w-3 h-3" /> {L("Бот підтримки", "Support bot", "Бот поддержки")}
            </a>
            <Link href={`${BASE}/privacy`}
               className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border transition"
               style={{ borderColor: "rgba(0,255,255,0.2)", color: "#00FFFF" }}>
              <FileText className="w-3 h-3" /> {L("Політика конфіденційності", "Privacy Policy", "Политика конфиденциальности")}
            </Link>
          </div>
        </div>
      </div>

      {/* VERSION */}
      <div className="text-center text-[10px] text-muted/40 tracking-widest py-4">
        TITAN-94 · ОКО НЕБЕСНЕ · v2.0 · TON BLOCKCHAIN SECURITY ORGANISM<br />
        {L(
          "Система надається «як є». Користуючись нею, ви приймаєте умови використання та політику конфіденційності.",
          "System provided \"as is\". By using it, you accept the terms of use and privacy policy.",
          "Система предоставляется «как есть». Используя её, вы принимаете условия использования и политику конфиденциальности.",
        )}
      </div>
    </div>
  );
}
