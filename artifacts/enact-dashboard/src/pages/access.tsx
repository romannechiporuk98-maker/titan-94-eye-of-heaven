/**
 * ACCESS — three-tier collaboration / monetization page.
 *
 * Designed as the public-facing pitch surface for the TON / Telegram grant:
 *   - SCOUT (free)        — viral on-ramp, full read-only watchtower
 *   - GUARDIAN (5 TON/mo) — active defense + AI orchestra + auto-trade
 *   - TITAN (20 TON/mo)   — predator mode: arbitrage, sniper, custom forge
 *
 * Hidden 4th tier (DEV / 1000 TON lifetime) is auto-revealed for creator only.
 *
 * Pays via TON Connect OR Telegram Stars (key grant requirement).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Shield, Eye, Crown, Cpu, Check, X, Sparkles, Zap, Star,
  Bot, TrendingUp, Brain, Lock, Crosshair, Radio, Code2, Infinity,
  Activity, ChevronRight, FileCode, Rocket, ArrowRight,
} from "lucide-react";
import { getTgUser, isCreator, haptic, openTelegramLink } from "@/lib/telegram";

type Mode = "monthly" | "yearly";

interface Tier {
  id: "scout" | "guardian" | "titan" | "developer";
  name: string;
  tagline: string;
  ton: number;        // monthly price in TON
  stars: number;      // Telegram Stars equivalent (~150 stars per 1 TON at writing)
  color: string;
  glow: string;
  icon: any;
  hero: string;       // Ukrainian one-liner
  cta: string;
  modules: { name: string; description: string; included: boolean }[];
  limits: { metric: string; value: string }[];
  highlight?: boolean;
  hidden?: boolean;
}

const MODULES_ALL = [
  { id: "watch",     name: "Watchtower",        icon: Eye },
  { id: "alerts",    name: "Telegram Alerts",   icon: Radio },
  { id: "ai",        name: "AI Orchestra",      icon: Brain },
  { id: "vault",     name: "Mobile Vault",      icon: Lock },
  { id: "trade",     name: "Auto-Trade",        icon: TrendingUp },
  { id: "arb",       name: "Arbitrage Bot",     icon: Activity },
  { id: "sniper",    name: "Sniper Engine",     icon: Crosshair },
  { id: "forge",     name: "Agent Forge",       icon: Bot },
  { id: "nexus",     name: "NEXUS Co-Pilot",    icon: Sparkles },
  { id: "api",       name: "Public API",        icon: Code2 },
  { id: "evolve",    name: "Self-Evolution",    icon: Cpu },
  { id: "whitelabel",name: "White-label",       icon: FileCode },
];

const TIERS: Tier[] = [
  {
    id: "scout",
    name: "SCOUT",
    tagline: "ОКО НЕБЕСНЕ для всіх",
    ton: 0,
    stars: 0,
    color: "#00B5FF",
    glow: "rgba(0,181,255,0.5)",
    icon: Eye,
    hero: "Дивись, дізнавайся, ділись. Пасивний моніторинг назавжди безкоштовно.",
    cta: "Активувати безкоштовно",
    modules: [
      { name: "Watchtower",      description: "Моніторинг до 3 контрактів", included: true },
      { name: "Telegram Alerts", description: "Push-сповіщення про загрози", included: true },
      { name: "Mobile Vault",    description: "Vault з 1 ключем",          included: true },
      { name: "Спільнота",       description: "Чат TITAN-94",               included: true },
      { name: "AI Orchestra",    description: "—",                          included: false },
      { name: "Auto-Trade",      description: "—",                          included: false },
      { name: "Sniper",          description: "—",                          included: false },
    ],
    limits: [
      { metric: "Контракти",   value: "3" },
      { metric: "Скани/добу",  value: "10" },
      { metric: "AI-запити",   value: "—" },
      { metric: "Підтримка",   value: "Спільнота" },
    ],
  },
  {
    id: "guardian",
    name: "GUARDIAN",
    tagline: "Активний захист гаманця",
    ton: 5,
    stars: 750,
    color: "#9B5CFF",
    glow: "rgba(155,92,255,0.55)",
    icon: Shield,
    hero: "AI-Orchestra + Auto-Trade. Твій агент торгує і захищає 24/7 без сну.",
    cta: "Стати Guardian",
    highlight: true,
    modules: [
      { name: "Все зі SCOUT",      description: "+ необмежено",                  included: true },
      { name: "AI Orchestra",      description: "Gemini + Claude + GPT-4o",      included: true },
      { name: "Auto-Trade Binance",description: "Spot BTC/ETH/USDT/TON",         included: true },
      { name: "Mobile Vault",      description: "Усі 10 API-ключів",             included: true },
      { name: "Public API",        description: "1000 викликів/добу",            included: true },
      { name: "Priority Alerts",   description: "<3 сек реакція",                included: true },
      { name: "Sniper Engine",     description: "—",                             included: false },
    ],
    limits: [
      { metric: "Контракти",   value: "∞" },
      { metric: "Скани/добу",  value: "1 000" },
      { metric: "AI-запити",   value: "500/добу" },
      { metric: "Підтримка",   value: "Email <24h" },
    ],
  },
  {
    id: "titan",
    name: "TITAN",
    tagline: "Predator mode — все, що організм вміє",
    ton: 20,
    stars: 3000,
    color: "#FFD43A",
    glow: "rgba(255,212,58,0.55)",
    icon: Crown,
    hero: "Sniper + Arbitrage + Agent Forge. Створюй власних агентів, лови альфу.",
    cta: "Розкрити Titan",
    modules: [
      { name: "Все з GUARDIAN",     description: "+ Pro модулі",          included: true },
      { name: "Sniper Engine",      description: "Ловить Jetton до листингу", included: true },
      { name: "Arbitrage Bot",      description: "Cross-DEX TON ↔ Binance",   included: true },
      { name: "Agent Forge",        description: "Custom AI-агенти",      included: true },
      { name: "NEXUS Co-Pilot",     description: "Голосовий командний AI", included: true },
      { name: "White-label",        description: "Свій бренд / бот",      included: true },
      { name: "Direct Creator Chat",description: "Прямий канал з Romanом",included: true },
    ],
    limits: [
      { metric: "Контракти",   value: "∞" },
      { metric: "Скани/добу",  value: "∞" },
      { metric: "AI-запити",   value: "∞" },
      { metric: "Підтримка",   value: "Telegram <1h" },
    ],
  },
  {
    id: "developer",
    name: "DEVELOPER",
    tagline: "Sovereign Mode — повний контроль",
    ton: 1000,
    stars: 150000,
    color: "#FF66B3",
    glow: "rgba(255,102,179,0.55)",
    icon: Cpu,
    hero: "Lifetime · Self-Evolution unlocked · Source access · Co-creator status",
    cta: "Запросити доступ",
    hidden: true,
    modules: [
      { name: "ВСЕ З TITAN",          description: "довічно · ніяких лімітів",   included: true },
      { name: "Self-Evolution",       description: "Організм перепрограмовує себе", included: true },
      { name: "Mirror Protocol-94",   description: "Kill-switch у твоїх руках",  included: true },
      { name: "Source-code Access",   description: "Читай ядро організму",       included: true },
      { name: "Revenue Share 50%",    description: "Половина CPA назавжди",      included: true },
      { name: "Co-Creator Brand",     description: "Твоє ім'я в DEI GRATIA",     included: true },
    ],
    limits: [
      { metric: "Період",      value: "Lifetime" },
      { metric: "Все",         value: "∞" },
      { metric: "AI-запити",   value: "∞" },
      { metric: "Підтримка",   value: "Crio-канал" },
    ],
  },
];

export default function AccessPage() {
  const [mode, setMode] = useState<Mode>("monthly");
  const tg = useMemo(() => getTgUser(), []);
  const [showDev, setShowDev] = useState(false);
  useEffect(() => { setShowDev(isCreator(tg.id)); }, [tg.id]);

  const visible = TIERS.filter((t) => !t.hidden || showDev);

  const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  function pay(tier: Tier, method: "ton" | "stars") {
    haptic("medium");
    if (tier.ton === 0) {
      window.location.href = BASE_URL + "/";
      return;
    }
    if (method === "ton") {
      // Earn page has the full TON Connect payment flow
      window.location.href = BASE_URL + `/earn?tier=${tier.id}&mode=${mode}`;
    } else {
      // Telegram Stars → bot deeplink (works inside TG)
      const starsCount = mode === "yearly" ? Math.round(tier.stars * 12 * 0.8) : tier.stars;
      const link = `https://t.me/Titan_94_agent_bot?start=stars_${tier.id}_${starsCount}`;
      openTelegramLink(link);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>
      {/* Animated cosmic background */}
      <div className="fixed inset-0 pointer-events-none opacity-50" style={{
        background: `
          radial-gradient(circle at 20% 0%, rgba(0,255,255,0.08), transparent 50%),
          radial-gradient(circle at 80% 30%, rgba(155,92,255,0.10), transparent 55%),
          radial-gradient(circle at 50% 100%, rgba(255,212,58,0.06), transparent 50%)
        `
      }} />

      {/* HERO ──────────────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 pt-12 pb-10 max-w-6xl mx-auto">
        <Link href="/" className="text-[11px] tracking-widest text-cyan-400/70 hover:text-cyan-300 inline-flex items-center gap-1 mb-8">
          ◀ ПОВЕРНУТИСЬ ДО ОРГАНІЗМУ
        </Link>

        <div className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "rgba(0,255,255,0.6)" }}>
          ◈ TITAN-94 · ACCESS PROTOCOL · v4.0
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight mb-4 tracking-tight">
          <span style={{ background: "linear-gradient(90deg, #00FFFF 0%, #9B5CFF 50%, #FFD43A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Три рівні
          </span>
          <br />
          <span style={{ color: "#CFFFFF" }}>одного організму</span>
        </h1>
        <p className="text-base sm:text-lg max-w-2xl leading-relaxed" style={{ color: "rgba(207,255,255,0.7)" }}>
          Модульний доступ до сувереного AI-захисника TON. Плати тільки за те, що використовуєш — у TON або Telegram Stars.
          Анти-крихкість як архітектурний принцип, не маркетинг.
        </p>

        {/* Stats strip — grant signal */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { v: "10",   l: "API ключів"   },
            { v: "5",    l: "AI моделей"   },
            { v: "24/7", l: "Self-healing" },
            { v: "0%",   l: "Custody коштів" },
          ].map((s) => (
            <div key={s.l} className="border p-3 rounded backdrop-blur-sm" style={{ borderColor: "rgba(0,255,255,0.2)", background: "rgba(0,255,255,0.03)" }}>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: "#00FFFF" }}>{s.v}</div>
              <div className="text-[10px] tracking-widest mt-1" style={{ color: "rgba(207,255,255,0.5)" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex border" style={{ borderColor: "rgba(0,255,255,0.3)" }}>
            {(["monthly","yearly"] as Mode[]).map((m) => (
              <button key={m} onClick={() => { haptic("selection"); setMode(m); }}
                className="px-5 py-2 text-xs tracking-widest transition-all"
                style={{
                  background: mode === m ? "rgba(0,255,255,0.12)" : "transparent",
                  color:      mode === m ? "#00FFFF" : "rgba(207,255,255,0.5)",
                }}>
                {m === "monthly" ? "ЩОМІСЯЦЯ" : "РІК −20%"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TIERS GRID ─────────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 pb-12 max-w-6xl mx-auto">
        <div className={`grid gap-5 ${visible.length === 4 ? "lg:grid-cols-4 md:grid-cols-2" : "lg:grid-cols-3 md:grid-cols-2"}`}>
          {visible.map((t) => <TierCard key={t.id} tier={t} mode={mode} onPay={pay} />)}
        </div>

        {!showDev && (
          <div className="mt-6 text-center">
            <button onClick={() => { haptic("light"); setShowDev(true); }}
              className="text-[10px] tracking-widest opacity-30 hover:opacity-100 transition-opacity">
              ◈ показати приховане
            </button>
          </div>
        )}
      </section>

      {/* MODULE MATRIX ──────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 pb-12 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Що в кожному рівні</h2>
        <p className="text-xs mb-6" style={{ color: "rgba(207,255,255,0.5)" }}>Модульна архітектура — підключай тільки те, що потрібно.</p>

        <div className="overflow-x-auto border rounded" style={{ borderColor: "rgba(0,255,255,0.2)", background: "rgba(0,255,255,0.02)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
                <th className="text-left p-3 font-bold" style={{ color: "rgba(207,255,255,0.6)" }}>МОДУЛЬ</th>
                {TIERS.filter((t) => !t.hidden || showDev).map((t) => (
                  <th key={t.id} className="text-center p-3 font-bold tracking-widest" style={{ color: t.color }}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES_ALL.map((m, idx) => {
                const includedIn = (tier: Tier["id"]) => moduleIncludedIn(m.id, tier);
                return (
                  <tr key={m.id} className={idx % 2 === 0 ? "bg-cyan-400/[0.02]" : ""}>
                    <td className="p-3 font-bold flex items-center gap-2"><m.icon className="w-3.5 h-3.5 text-cyan-400/70" />{m.name}</td>
                    {TIERS.filter((t) => !t.hidden || showDev).map((t) => (
                      <td key={t.id} className="text-center p-3">
                        {includedIn(t.id)
                          ? <Check className="w-4 h-4 inline" style={{ color: t.color }} />
                          : <X className="w-3.5 h-3.5 inline opacity-20" />}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRANT PITCH ───────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 pb-16 max-w-6xl mx-auto">
        <div className="border rounded-lg p-6 sm:p-8" style={{ borderColor: "rgba(155,92,255,0.3)", background: "linear-gradient(135deg, rgba(155,92,255,0.04), rgba(0,255,255,0.04))" }}>
          <div className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "#9B5CFF" }}>◈ ЧОМУ TON ОБЕРЕ TITAN-94</div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-6">Ми не просто додаток. Ми імунна система екосистеми.</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Shield,    t: "Native TON-first",      d: "TON Connect, TonAPI, Jetton-сканер, smart contract verification — вбудовано в ядро, не порт." },
              { icon: Bot,       t: "Telegram-native UX",    d: "Mini App + Bot з повною initData HMAC-валідацією. Stars + TON Connect — обидва платіжні рейки." },
              { icon: Brain,     t: "Self-Healing AI",       d: "5 AI-моделей у консенсусі, авто-латання вразливостей, Sentinel rate-limit, kill-switch Mirror Protocol-94." },
              { icon: TrendingUp,t: "Real Revenue, Day 1",   d: "Не запит на грант для MVP — реальні $5/$20 підписки, 15% CPA, оплата підтверджена on-chain." },
              { icon: Infinity,  t: "Anti-fragile by Design",d: "Mirror, Sentinel, Eye, Splash — 4 захисні шари. Кожен модуль ізольований, можна замінити вживу." },
              { icon: Rocket,    t: "Виходить за межі TON",  d: "Binance Spot, OpenRouter, Twitter Posting — TON у центрі мульти-чейн стратегії." },
            ].map((x) => (
              <div key={x.t} className="border p-4 rounded" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(0,255,255,0.02)" }}>
                <x.icon className="w-5 h-5 mb-2" style={{ color: "#00FFFF" }} />
                <div className="font-bold mb-1.5">{x.t}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: "rgba(207,255,255,0.6)" }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER ────────────────────────────────────── */}
      <section className="relative px-6 sm:px-10 pb-20 max-w-4xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl font-bold mb-3">Один організм. Три рівні. Нескінченна еволюція.</h3>
        <p className="text-sm mb-6" style={{ color: "rgba(207,255,255,0.6)" }}>Скасувати можна будь-якої миті · Refund 7 днів · Custody = твоя</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/earn" className="px-6 py-3 font-bold tracking-widest border inline-flex items-center gap-2"
            style={{ borderColor: "#00FFFF", color: "#00FFFF", background: "rgba(0,255,255,0.08)" }}>
            ОПЛАТИТИ В TON <ArrowRight className="w-4 h-4" />
          </Link>
          <button onClick={() => openTelegramLink("https://t.me/Titan_94_agent_bot?start=tiers")}
            className="px-6 py-3 font-bold tracking-widest border inline-flex items-center gap-2"
            style={{ borderColor: "#FFD43A", color: "#FFD43A", background: "rgba(255,212,58,0.08)" }}>
            <Star className="w-4 h-4" /> ОПЛАТИТИ TG STARS
          </button>
        </div>
        <div className="mt-8 text-[10px] tracking-widest" style={{ color: "rgba(207,255,255,0.3)" }}>
          DEI GRATIA · ROMAN · TITAN-94 · ОКО НЕБЕСНЕ
        </div>
      </section>
    </div>
  );
}

// ─── TIER CARD ──────────────────────────────────────────────────────
function TierCard({ tier, mode, onPay }: { tier: Tier; mode: Mode; onPay: (t: Tier, m: "ton" | "stars") => void }) {
  const Icon = tier.icon;
  const price = mode === "yearly" ? Math.round(tier.ton * 12 * 0.8) : tier.ton;
  const stars = mode === "yearly" ? Math.round(tier.stars * 12 * 0.8) : tier.stars;
  const period = tier.id === "developer" ? "lifetime" : (mode === "yearly" ? "/ рік" : "/ місяць");

  return (
    <div className="relative group">
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-[9px] tracking-[0.25em] font-bold rounded"
          style={{ background: tier.color, color: "#030D18" }}>
          НАЙПОПУЛЯРНІШЕ
        </div>
      )}
      <div className="relative h-full p-6 rounded-lg border transition-all duration-300 group-hover:-translate-y-1"
        style={{
          borderColor: tier.highlight ? tier.color : "rgba(0,255,255,0.2)",
          background: tier.highlight
            ? `linear-gradient(180deg, ${tier.color}10, rgba(3,13,24,0.95))`
            : "rgba(3,13,24,0.7)",
          boxShadow: tier.highlight ? `0 0 50px ${tier.glow}` : "none",
        }}>

        {/* glow on hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `0 0 60px ${tier.glow} inset, 0 0 40px ${tier.glow}` }} />

        <div className="relative">
          {/* Icon */}
          <div className="inline-flex p-3 rounded mb-4" style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40` }}>
            <Icon className="w-7 h-7" style={{ color: tier.color, filter: `drop-shadow(0 0 8px ${tier.glow})` }} />
          </div>

          {/* Name */}
          <div className="text-xs tracking-[0.3em] mb-1" style={{ color: tier.color }}>◈ TIER</div>
          <div className="text-2xl font-bold tracking-wider mb-1">{tier.name}</div>
          <div className="text-[11px] mb-5" style={{ color: "rgba(207,255,255,0.6)" }}>{tier.tagline}</div>

          {/* Price */}
          <div className="mb-1 flex items-baseline gap-2">
            {tier.ton === 0 ? (
              <span className="text-3xl font-bold" style={{ color: tier.color }}>FREE</span>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-bold" style={{ color: tier.color }}>{price}</span>
                <span className="text-sm" style={{ color: "rgba(207,255,255,0.5)" }}>TON</span>
              </>
            )}
            <span className="text-[10px] ml-1" style={{ color: "rgba(207,255,255,0.4)" }}>{period}</span>
          </div>
          {tier.stars > 0 && (
            <div className="text-[10px] mb-4 flex items-center gap-1" style={{ color: "rgba(255,212,58,0.7)" }}>
              <Star className="w-3 h-3" /> або {stars.toLocaleString()} Telegram Stars
            </div>
          )}
          {tier.ton === 0 && <div className="h-4 mb-4" />}

          {/* Hero line */}
          <p className="text-[12px] leading-relaxed mb-5 min-h-[3em]" style={{ color: "rgba(207,255,255,0.75)" }}>
            {tier.hero}
          </p>

          {/* Modules list */}
          <ul className="space-y-2 mb-5">
            {tier.modules.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                {m.included
                  ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tier.color }} />
                  : <X className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-25" />}
                <span style={{ color: m.included ? "#CFFFFF" : "rgba(207,255,255,0.3)" }}>
                  <strong>{m.name}</strong>
                  {m.description && m.description !== "—" && (
                    <span className="ml-1" style={{ color: "rgba(207,255,255,0.5)" }}>· {m.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* Limits grid */}
          <div className="grid grid-cols-2 gap-2 mb-5 pt-3 border-t" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
            {tier.limits.map((l) => (
              <div key={l.metric}>
                <div className="text-[9px] tracking-widest" style={{ color: "rgba(207,255,255,0.4)" }}>{l.metric}</div>
                <div className="text-xs font-bold" style={{ color: tier.color }}>{l.value}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={() => onPay(tier, "ton")}
            className="w-full py-3 font-bold tracking-widest border transition-all hover:bg-white/5 mb-2"
            style={{ borderColor: tier.color, color: tier.color, background: tier.highlight ? `${tier.color}10` : "transparent" }}>
            {tier.cta}
            <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
          {tier.ton > 0 && (
            <button onClick={() => onPay(tier, "stars")}
              className="w-full py-2 text-[10px] tracking-widest opacity-60 hover:opacity-100 transition-opacity inline-flex items-center justify-center gap-1">
              <Star className="w-3 h-3" /> або {stars.toLocaleString()} Telegram Stars
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── module → which tiers include it ────────────────────────────────
function moduleIncludedIn(modId: string, tier: Tier["id"]): boolean {
  const matrix: Record<string, Tier["id"][]> = {
    watch:      ["scout","guardian","titan","developer"],
    alerts:     ["scout","guardian","titan","developer"],
    vault:      ["scout","guardian","titan","developer"],
    ai:         ["guardian","titan","developer"],
    trade:      ["guardian","titan","developer"],
    api:        ["guardian","titan","developer"],
    arb:        ["titan","developer"],
    sniper:     ["titan","developer"],
    forge:      ["titan","developer"],
    nexus:      ["titan","developer"],
    whitelabel: ["titan","developer"],
    evolve:     ["developer"],
  };
  return (matrix[modId] || []).includes(tier);
}
