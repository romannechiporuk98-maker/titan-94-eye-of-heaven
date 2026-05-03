/**
 * TITAN-94 — Responsive Layout with timezone + language switchers.
 *
 * - Desktop (>= md): static left sidebar + main content
 * - Mobile (< md):   compact top bar + slide-out drawer (hamburger)
 * - Nav visibility controlled by creator settings (fetched from /api/creator/public-settings)
 * - Each nav item has an info (ℹ) button that shows description + user instructions
 */
import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TonConnectButton, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import {
  Activity, Briefcase, PlusCircle, ExternalLink,
  Eye, Shield, DollarSign, Brain, Heart, FileCode, Cpu,
  Dna, BarChart3, Sparkles, Bot, Code2, TrendingUp, Key, KeyRound, Crown,
  Menu, X, Languages, Clock, Info, BookOpen, Globe, Trophy, CandlestickChart, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, useTimezone, fmtClock, resolveTz, TZ_OPTIONS, t, type Lang } from "@/lib/ui-prefs";

export type NavGroup = "titan" | "agent" | "enact";

export type NavItem = {
  href: string;
  tkey: string;
  icon: typeof Cpu;
  group: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/",          tkey: "nav.command",   icon: Cpu,        group: "titan" },
  { href: "/threats",   tkey: "nav.threats",   icon: Shield,     group: "titan" },
  { href: "/contracts", tkey: "nav.contracts", icon: FileCode,   group: "titan" },
  { href: "/analyze",   tkey: "nav.analyze",   icon: Brain,      group: "titan" },
  { href: "/evolution", tkey: "nav.evolution", icon: Dna,        group: "titan" },
  { href: "/immune",    tkey: "nav.immune",    icon: Heart,      group: "titan" },
  { href: "/analytics", tkey: "nav.analytics", icon: BarChart3,  group: "titan" },
  { href: "/status",      tkey: "nav.status",      icon: Eye,        group: "titan" },
  { href: "/ton-network", tkey: "nav.ton_network", icon: Globe,      group: "titan" },
  { href: "/grant",       tkey: "nav.grant",       icon: Trophy,     group: "titan" },
  { href: "/earn",        tkey: "nav.earn",        icon: DollarSign, group: "titan" },
  { href: "/charts",    tkey: "nav.charts",    icon: CandlestickChart, group: "titan" },
  { href: "/ton-wallet",tkey: "nav.ton_wallet",icon: Wallet,     group: "titan" },
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
const GROUPS: NavGroup[] = ["titan", "agent", "enact"];

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");

function useNavVisibility(): Record<string, boolean> {
  const { data } = useQuery<{ navVisibility: Record<string, boolean> }>({
    queryKey: ["public-nav-settings"],
    queryFn: () => fetch(`${BASE}/api/creator/public-settings`).then((r) => r.json()),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  return data?.navVisibility ?? {};
}

/* ── Info Modal ─────────────────────────────────────────────────────────── */
function InfoModal({ item, lang, onClose }: { item: NavItem; lang: Lang; onClose: () => void }) {
  const label = t(item.tkey, lang);
  const desc  = t(item.tkey + ".desc", lang);
  const instr = t(item.tkey + ".instr", lang);
  const hasDesc  = !desc.startsWith("nav.");
  const hasInstr = !instr.startsWith("nav.");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-lg border p-5 shadow-2xl"
        style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.3)", boxShadow: "0 0 40px rgba(0,255,255,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <item.icon className="w-4 h-4" style={{ color: "#00FFFF" }} />
            <span className="font-bold text-sm" style={{ color: "#00FFFF" }}>{label}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white transition-colors" style={{ color: "rgba(207,255,255,0.5)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {hasDesc && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1.5 text-xs font-bold tracking-wider" style={{ color: "rgba(0,255,255,0.6)" }}>
              <Info className="w-3 h-3" />{t("info.how_it_works", lang)}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(207,255,255,0.8)" }}>{desc}</p>
          </div>
        )}

        {/* Instructions */}
        {hasInstr && (
          <div className="pt-3 border-t" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
            <div className="flex items-center gap-1 mb-1.5 text-xs font-bold tracking-wider" style={{ color: "rgba(255,140,0,0.8)" }}>
              <BookOpen className="w-3 h-3" />{t("info.instructions", lang)} · {t("info.for_users", lang)}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(207,255,255,0.7)" }}>{instr}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-1.5 text-xs font-bold border transition-colors hover:bg-cyan-500/10"
          style={{ borderColor: "rgba(0,255,255,0.3)", color: "rgba(0,255,255,0.7)" }}
        >
          {t("info.close", lang)}
        </button>
      </div>
    </div>
  );
}

/* ── TON Wallet Connection Chip ──────────────────────────────────────────── */
function TonWalletChip({ compact = false }: { compact?: boolean }) {
  const address    = useTonAddress();
  const wallet     = useTonWallet();
  const short      = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null;
  const deviceName = (wallet as any)?.device?.appName ?? null;

  if (!address) {
    return (
      <div
        style={{
          "--tc-button-background": "transparent",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 50,
          minWidth: compact ? "90px" : "120px",
        } as any}
      >
        <TonConnectButton
          style={{
            "--tc-button-background":     "transparent",
            "--tc-button-border-radius":  "4px",
            "--tc-button-font-size":      compact ? "9px" : "10px",
            "--tc-button-color":          "#00FFFF",
            display:                      "flex",
          } as any}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border rounded"
      style={{
        borderColor: "rgba(0,255,255,0.35)",
        background: "rgba(0,255,255,0.06)",
        fontFamily: "'Space Mono', monospace",
        fontSize: compact ? "9px" : "10px",
      }}>
      <span style={{ color: "#00FFFF" }}>◈</span>
      <span className="font-bold" style={{ color: "#00FF88" }}>{short}</span>
      {deviceName && !compact && (
        <span className="opacity-50" style={{ color: "rgba(207,255,255,0.6)" }}>· {deviceName}</span>
      )}
    </div>
  );
}

/* ── Top-right control cluster: Timezone + Language ─────────────────────── */
function PrefsCluster({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const { tz, setTz } = useTimezone();
  const [openLang, setOpenLang] = useState(false);
  const [openTz,   setOpenTz]   = useState(false);
  const [now,      setNow]      = useState(() => new Date());
  const ref = useRef<HTMLDivElement>(null);

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
    { code: "de", label: "Deutsch",    flag: "DE" },
    { code: "tr", label: "Türkçe",     flag: "TR" },
    { code: "zh", label: "中文",        flag: "ZH" },
  ];
  const currentFlag = langs.find(l => l.code === lang)?.flag ?? "UA";
  const tzShort = tz === "auto"
    ? resolveTz("auto").split("/").pop()?.replace("_", " ") ?? "Local"
    : tz.split("/").pop()?.replace("_", " ") ?? tz;

  const btnSize = compact ? "p-1.5" : "p-2";
  const iconSize = "w-4 h-4";

  return (
    <div className="flex items-center gap-1" ref={ref}>
      {/* Live clock */}
      <div
        className="hidden md:flex items-center gap-1 px-2 py-1 rounded border tabular-nums"
        style={{
          borderColor: "rgba(0,255,255,0.2)",
          color: "rgba(207,255,255,0.85)",
          background: "transparent",
          fontSize: compact ? "10px" : "11px",
          fontFamily: "'Space Mono', monospace",
        }}
        title={`${tzShort} · ${resolveTz(tz)}`}
      >
        <Clock className="w-3 h-3 opacity-60" />
        <span>{fmtClock(now, tz, lang)}</span>
      </div>

      {/* Timezone picker */}
      <div className="relative">
        <button
          onClick={() => { setOpenTz(o => !o); setOpenLang(false); }}
          className={`${btnSize} rounded border transition-colors flex items-center gap-1`}
          style={{ borderColor: "rgba(0,255,255,0.3)", color: "var(--titan-primary, #00FFFF)", background: "transparent" }}
          aria-label={t("btn.tz", lang)}
          title={`${t("btn.tz", lang)} · ${tzShort}`}
        >
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
                <span className="text-[10px] opacity-60 tabular-nums">{fmtClock(now, o.value, lang)}</span>
                {o.value === tz && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Language picker */}
      <div className="relative">
        <button
          onClick={() => { setOpenLang(o => !o); setOpenTz(false); }}
          className={`${btnSize} rounded border transition-colors flex items-center gap-1`}
          style={{ borderColor: "rgba(0,255,255,0.3)", color: "var(--titan-primary, #00FFFF)", background: "transparent" }}
          aria-label={t("btn.lang", lang)}
          title={t("btn.lang", lang)}
        >
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

/** Returns true when running inside a real Telegram Mini App context */
function useIsTMA(): boolean {
  const [isTMA, setIsTMA] = useState(false);
  useEffect(() => {
    try {
      const wa = (window as any).Telegram?.WebApp;
      // isExpanded or initDataUnsafe.user being present means real TMA
      setIsTMA(!!(wa?.initDataUnsafe?.user || wa?.initData));
    } catch {}
  }, []);
  return isTMA;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoItem,   setInfoItem]   = useState<NavItem | null>(null);
  const { lang } = useLang();
  const navVis = useNavVisibility();
  const isTMA  = useIsTMA();

  useEffect(() => { setDrawerOpen(false); }, [location]);
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Filtered nav: item is visible unless creator explicitly set it to false
  const visibleNav = NAV_ITEMS.filter(item => navVis[item.href] !== false);

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
        <button
          onClick={() => setDrawerOpen(false)}
          className="md:hidden ml-2 p-1.5 -mr-1 rounded text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-400/10"
          aria-label={t("btn.menu_close", lang)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {GROUPS.map(group => {
          const groupItems = visibleNav.filter(n => n.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="mb-4">
              <div className="px-3 mb-1 text-xs font-bold tracking-widest" style={{ color: "rgba(0,255,255,0.4)" }}>
                ── {t(GROUP_KEYS[group], lang)} ──
              </div>
              {groupItems.map(item => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;
                const hasDesc = !t(item.tkey + ".desc", lang).startsWith("nav.");
                return (
                  <div key={item.href} className="flex items-center group/nav">
                    <Link
                      href={item.href}
                      className={cn("flex-1 flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 hover:text-cyan-300")}
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
                    {hasDesc && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setInfoItem(item); }}
                        className="shrink-0 p-1.5 mr-1 rounded opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-cyan-500/15"
                        style={{ color: "rgba(0,255,255,0.5)" }}
                        title={t("info.how_it_works", lang)}
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs shrink-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="mb-2" style={{ color: "rgba(0,255,255,0.4)" }}>── {t("tag.contracts", lang)} ──</div>
        <div className="space-y-1">
          <a
            href="https://tonviewer.com/EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 hover:underline truncate"
            style={{ color: "#00FFFF", fontSize: "10px" }}
          >
            ENACT Factory <ExternalLink className="w-2 h-2" />
          </a>
          <a
            href="https://tonviewer.com/UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{ color: "#00FF88", fontSize: "10px" }}
          >
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
        <div className="mt-3 flex gap-2 flex-wrap">
          <Link href="/about"
            className="text-[10px] hover:underline transition-colors"
            style={{ color: "rgba(0,255,255,0.35)" }}>
            {t("nav.about", lang)}
          </Link>
          <span style={{ color: "rgba(0,255,255,0.15)", fontSize: "10px" }}>·</span>
          <Link href="/privacy"
            className="text-[10px] hover:underline transition-colors"
            style={{ color: "rgba(0,255,255,0.35)" }}>
            {t("nav.privacy", lang)}
          </Link>
        </div>
        <div className="mt-2 text-center" style={{ color: "rgba(207,255,255,0.25)", fontSize: "10px" }}>
          v4.0 · © DEI GRATIA · Роман
        </div>
        <div className="text-center mt-0.5" style={{ color: "rgba(0,255,255,0.15)", fontSize: "9px" }}>
          Всі права захищені · TON Mainnet
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
          <aside
            className="relative w-72 max-w-[85vw] flex flex-col border-r animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)", boxShadow: "0 0 60px rgba(0,255,255,0.15)" }}
          >
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* CRT scanlines overlay */}
      <div className="pointer-events-none fixed inset-0 z-50" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Info Modal (above everything else) */}
      {infoItem && (
        <InfoModal item={infoItem} lang={lang} onClose={() => setInfoItem(null)} />
      )}

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ background: "#030D18" }}>

        {/* MOBILE TOP BAR — hidden in TMA (Telegram has its own header) */}
        {!isTMA && (
          <div className="md:hidden h-12 flex items-center px-3 border-b shrink-0 z-40 gap-2"
            style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)" }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 rounded text-cyan-400 hover:bg-cyan-400/10"
              aria-label={t("btn.menu_open", lang)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
              <span className="text-[8px] tracking-widest leading-tight mt-0.5" style={{ color: "rgba(0,255,255,0.4)" }}>{t("tag.security", lang)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <TonWalletChip compact />
              <PrefsCluster compact />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
                <span className="text-[10px]" style={{ color: "#00FF88" }}>{t("tag.live", lang)}</span>
              </div>
            </div>
          </div>
        )}

        {/* TMA TOP STRIP — ultra-slim bar with menu + wallet for TMA */}
        {isTMA && (
          <div className="md:hidden h-10 flex items-center px-3 shrink-0 z-40 gap-2"
            style={{ background: "#060F1A", borderBottom: "1px solid rgba(0,255,255,0.1)" }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 -ml-1 rounded text-cyan-400 hover:bg-cyan-400/10"
              aria-label={t("btn.menu_open", lang)}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
            <div className="ml-auto flex items-center gap-1.5">
              <TonWalletChip compact />
              <PrefsCluster compact />
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
            </div>
          </div>
        )}

        {/* DESKTOP TOP BAR */}
        <div className="hidden md:flex h-10 items-center justify-end px-4 border-b shrink-0 z-40 gap-2"
          style={{ background: "rgba(6,15,26,0.6)", borderColor: "rgba(0,255,255,0.1)" }}>
          <TonWalletChip />
          <PrefsCluster />
        </div>

        <div className="flex-1 overflow-y-auto tma-scroll">
          {children}
        </div>
      </main>
    </div>
  );
}
