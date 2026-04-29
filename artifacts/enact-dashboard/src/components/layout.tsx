/**
 * TITAN-94 — Responsive Layout with theme + language switchers.
 *
 * - Desktop (>= md): static left sidebar + main content
 * - Mobile (< md):   compact top bar + slide-out drawer (hamburger)
 * - Theme: dark (default) / light, toggled via Sun-Moon button (top-right)
 * - Language: uk (default) / en / ru, toggled via globe button (top-right)
 *
 * Both prefs persist in localStorage via lib/ui-prefs.ts.
 */
import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  Activity, Briefcase, PlusCircle, ExternalLink,
  Eye, Shield, DollarSign, Brain, Heart, FileCode, Cpu,
  Dna, BarChart3, Sparkles, Bot, Code2, TrendingUp, Key, KeyRound, Crown,
  Menu, X, Sun, Moon, Languages, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, useLang, useTimezone, fmtClock, resolveTz, TZ_OPTIONS, t, type Lang } from "@/lib/ui-prefs";

type NavItem = { href: string; tkey: string; icon: typeof Cpu; group: "titan" | "agent" | "enact" };

const NAV_ITEMS: NavItem[] = [
  { href: "/",          tkey: "nav.command",   icon: Cpu,        group: "titan" },
  { href: "/threats",   tkey: "nav.threats",   icon: Shield,     group: "titan" },
  { href: "/contracts", tkey: "nav.contracts", icon: FileCode,   group: "titan" },
  { href: "/analyze",   tkey: "nav.analyze",   icon: Brain,      group: "titan" },
  { href: "/evolution", tkey: "nav.evolution", icon: Dna,        group: "titan" },
  { href: "/immune",    tkey: "nav.immune",    icon: Heart,      group: "titan" },
  { href: "/analytics", tkey: "nav.analytics", icon: BarChart3,  group: "titan" },
  { href: "/status",    tkey: "nav.status",    icon: Eye,        group: "titan" },
  { href: "/earn",      tkey: "nav.earn",      icon: DollarSign, group: "titan" },
  { href: "/autotrade", tkey: "nav.autotrade", icon: TrendingUp, group: "agent" },
  { href: "/builder",   tkey: "nav.builder",   icon: Bot,        group: "agent" },
  { href: "/developer", tkey: "nav.developer", icon: Code2,      group: "agent" },
  { href: "/nexus",     tkey: "nav.nexus",     icon: Sparkles,   group: "agent" },
  { href: "/settings",  tkey: "nav.settings",  icon: Key,        group: "agent" },
  { href: "/vault",     tkey: "nav.vault",     icon: KeyRound,   group: "agent" },
  { href: "/access",    tkey: "nav.access",    icon: Crown,      group: "agent" },
  { href: "/enact",     tkey: "nav.enact",     icon: Activity,   group: "enact" },
  { href: "/jobs",      tkey: "nav.jobs",      icon: Briefcase,  group: "enact" },
  { href: "/create",    tkey: "nav.create",    icon: PlusCircle, group: "enact" },
];

const GROUP_KEYS = { titan: "group.titan", agent: "group.agent", enact: "group.enact" } as const;
const GROUPS = ["titan", "agent", "enact"] as const;

/* ── Top-right control cluster: Theme + Language ─────────────────────── */
function PrefsCluster({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();
  const { tz, setTz } = useTimezone();
  const [openLang, setOpenLang] = useState(false);
  const [openTz,   setOpenTz]   = useState(false);
  const [now,      setNow]      = useState(() => new Date());
  const ref = useRef<HTMLDivElement>(null);

  // Live clock updates every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openLang && !openTz) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenLang(false); setOpenTz(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openLang, openTz]);

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "uk", label: "Українська", flag: "UA" },
    { code: "en", label: "English",    flag: "EN" },
    { code: "ru", label: "Русский",    flag: "RU" },
  ];
  const currentFlag = langs.find(l => l.code === lang)?.flag ?? "UA";
  const tzShort = tz === "auto"
    ? resolveTz("auto").split("/").pop()?.replace("_", " ") ?? "Local"
    : tz.split("/").pop()?.replace("_", " ") ?? tz;

  const btnSize = compact ? "p-1.5" : "p-2";
  const iconSize = "w-4 h-4";

  return (
    <div className="flex items-center gap-1" ref={ref}>
      {/* Live clock — desktop only (mobile sees per-tz clock inside the picker) */}
      <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded border tabular-nums"
        style={{
          borderColor: "rgba(0,255,255,0.2)",
          color: "rgba(207,255,255,0.85)",
          background: "transparent",
          fontSize: compact ? "10px" : "11px",
          fontFamily: "'Space Mono', monospace",
        }}
        title={`${tzShort} · ${resolveTz(tz)}`}>
        <Clock className="w-3 h-3 opacity-60" />
        <span>{fmtClock(now, tz)}</span>
      </div>

      {/* Theme toggle */}
      <button onClick={toggle}
        className={`${btnSize} rounded border transition-colors`}
        style={{
          borderColor: "rgba(0,255,255,0.3)",
          color: "var(--titan-primary, #00FFFF)",
          background: "transparent",
        }}
        aria-label={t("btn.theme", lang)}
        title={t("btn.theme", lang)}>
        {theme === "dark" ? <Sun className={iconSize} /> : <Moon className={iconSize} />}
      </button>

      {/* Timezone picker */}
      <div className="relative">
        <button onClick={() => { setOpenTz(o => !o); setOpenLang(false); }}
          className={`${btnSize} rounded border transition-colors flex items-center gap-1`}
          style={{
            borderColor: "rgba(0,255,255,0.3)",
            color: "var(--titan-primary, #00FFFF)",
            background: "transparent",
          }}
          aria-label={t("btn.tz", lang)}
          title={`${t("btn.tz", lang)} · ${tzShort}`}>
          <Clock className={iconSize} />
          <span className="text-[10px] font-bold tracking-wider hidden sm:inline">{tzShort.slice(0,3).toUpperCase()}</span>
        </button>
        {openTz && (
          <div className="absolute right-0 top-full mt-1 z-[100] min-w-[180px] border shadow-lg"
            style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.3)" }}>
            {TZ_OPTIONS.map(o => (
              <button key={o.value}
                onClick={() => { setTz(o.value); setOpenTz(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-cyan-400/10 transition-colors"
                style={{ color: o.value === tz ? "#00FFFF" : "rgba(207,255,255,0.7)" }}>
                <span className="flex-1">{o.label}</span>
                <span className="text-[10px] opacity-60 tabular-nums">{fmtClock(now, o.value)}</span>
                {o.value === tz && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Language picker */}
      <div className="relative">
        <button onClick={() => { setOpenLang(o => !o); setOpenTz(false); }}
          className={`${btnSize} rounded border transition-colors flex items-center gap-1`}
          style={{
            borderColor: "rgba(0,255,255,0.3)",
            color: "var(--titan-primary, #00FFFF)",
            background: "transparent",
          }}
          aria-label={t("btn.lang", lang)}
          title={t("btn.lang", lang)}>
          <Languages className={iconSize} />
          <span className="text-[10px] font-bold tracking-wider">{currentFlag}</span>
        </button>
        {openLang && (
          <div className="absolute right-0 top-full mt-1 z-[100] min-w-[140px] border shadow-lg"
            style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.3)" }}>
            {langs.map(l => (
              <button key={l.code}
                onClick={() => { setLang(l.code); setOpenLang(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-cyan-400/10 transition-colors"
                style={{ color: l.code === lang ? "#00FFFF" : "rgba(207,255,255,0.7)" }}>
                <span className="font-bold tracking-wider w-6">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span className="ml-auto text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { lang } = useLang();

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const SidebarContent = (
    <>
      <div className="h-14 flex items-center px-5 border-b shrink-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="flex flex-col">
          <span className="text-base font-bold leading-tight" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
          <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,255,255,0.4)" }}>{t("tag.security", lang)}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
          <span className="text-xs" style={{ color: "#00FF88" }}>{t("tag.live", lang)}</span>
        </div>
        {/* Close button (only mobile drawer) */}
        <button onClick={() => setDrawerOpen(false)}
          className="md:hidden ml-2 p-1.5 -mr-1 rounded text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-400/10"
          aria-label={t("btn.menu_close", lang)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {GROUPS.map(group => (
          <div key={group} className="mb-4">
            <div className="px-3 mb-1 text-xs font-bold tracking-widest" style={{ color: "rgba(0,255,255,0.4)" }}>
              ── {t(GROUP_KEYS[group], lang)} ──
            </div>
            {NAV_ITEMS.filter(n => n.group === group).map(item => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 hover:text-cyan-300")}
                  style={{
                    borderLeftColor: isActive ? "#00FFFF" : "transparent",
                    borderLeftWidth: "2px",
                    background: isActive ? "rgba(0,255,255,0.07)" : "transparent",
                    color: isActive ? "#00FFFF" : "rgba(207,255,255,0.6)",
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t(item.tkey, lang)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t text-xs shrink-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="mb-2" style={{ color: "rgba(0,255,255,0.4)" }}>── {t("tag.contracts", lang)} ──</div>
        <div className="space-y-1">
          <a href="https://tonviewer.com/EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 hover:underline truncate"
            style={{ color: "#00FFFF", fontSize: "10px" }}>
            ENACT Factory <ExternalLink className="w-2 h-2" />
          </a>
          <a href="https://tonviewer.com/UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{ color: "#00FF88", fontSize: "10px" }}>
            Reserve Fund <ExternalLink className="w-2 h-2" />
          </a>
        </div>
        <div className="mt-3" style={{ color: "rgba(207,255,255,0.4)", fontSize: "10px" }}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00FF88" }} />
            <span>{t("tag.organism", lang)}</span>
          </div>
          <div className="opacity-60 mt-1">Gemini 2.5 Flash · 4 Engines</div>
          <div className="opacity-60">Active</div>
        </div>
        <div className="mt-3 text-center" style={{ color: "rgba(207,255,255,0.25)", fontSize: "10px" }}>
          v4.0 · DEI GRATIA Роман
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r" style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)" }}>
        {SidebarContent}
      </aside>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[80] flex" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <aside className="relative w-72 max-w-[85vw] flex flex-col border-r animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)", boxShadow: "0 0 60px rgba(0,255,255,0.15)" }}>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* CRT scanlines overlay */}
      <div className="pointer-events-none fixed inset-0 z-50" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* MAIN AREA (with mobile top bar) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ background: "#030D18" }}>

        {/* MOBILE TOP BAR */}
        <div className="md:hidden h-12 flex items-center px-3 border-b shrink-0 z-40 gap-2"
          style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)" }}>
          <button onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded text-cyan-400 hover:bg-cyan-400/10"
            aria-label={t("btn.menu_open", lang)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
            <span className="text-[8px] tracking-widest leading-tight mt-0.5" style={{ color: "rgba(0,255,255,0.4)" }}>{t("tag.security", lang)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <PrefsCluster compact />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
              <span className="text-[10px]" style={{ color: "#00FF88" }}>{t("tag.live", lang)}</span>
            </div>
          </div>
        </div>

        {/* DESKTOP TOP BAR (just the prefs cluster) */}
        <div className="hidden md:flex h-10 items-center justify-end px-4 border-b shrink-0 z-40"
          style={{ background: "rgba(6,15,26,0.6)", borderColor: "rgba(0,255,255,0.1)" }}>
          <PrefsCluster />
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
