/**
 * TITAN-94 — Responsive Layout
 *
 * Desktop (>= md): static left sidebar + main content
 * Mobile (< md):   compact top bar + slide-out drawer (hamburger)
 *
 * The drawer locks body scroll when open and closes on route change / tap
 * outside, matching native Telegram Mini App expectations.
 */
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Activity, Briefcase, PlusCircle, ExternalLink,
  Eye, Shield, DollarSign, Brain, Heart, FileCode, Cpu,
  Dna, BarChart3, Sparkles, Bot, Code2, TrendingUp, Key, KeyRound, Crown,
  Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          label: "Command Center",  icon: Cpu,        group: "TITAN-94" },
  { href: "/threats",   label: "Threats",         icon: Shield,     group: "TITAN-94" },
  { href: "/contracts", label: "Smart Contracts", icon: FileCode,   group: "TITAN-94" },
  { href: "/analyze",   label: "Neural Hub",      icon: Brain,      group: "TITAN-94" },
  { href: "/evolution", label: "Evolution",       icon: Dna,        group: "TITAN-94" },
  { href: "/immune",    label: "Immune System",   icon: Heart,      group: "TITAN-94" },
  { href: "/analytics", label: "Analytics",       icon: BarChart3,  group: "TITAN-94" },
  { href: "/status",    label: "Agent Status",    icon: Eye,        group: "TITAN-94" },
  { href: "/earn",      label: "Earnings",        icon: DollarSign, group: "TITAN-94" },
  { href: "/autotrade", label: "Auto-Trade",      icon: TrendingUp, group: "AGENT" },
  { href: "/builder",   label: "Agent Forge",     icon: Bot,        group: "AGENT" },
  { href: "/developer", label: "Developer Mode",  icon: Code2,      group: "AGENT" },
  { href: "/nexus",     label: "NEXUS AI",        icon: Sparkles,   group: "AGENT" },
  { href: "/settings",  label: "API Vault",       icon: Key,        group: "AGENT" },
  { href: "/vault",     label: "Mobile Vault",    icon: KeyRound,   group: "AGENT" },
  { href: "/access",    label: "Access Tiers",    icon: Crown,      group: "AGENT" },
  { href: "/enact",     label: "ENACT Overview",  icon: Activity,   group: "ENACT" },
  { href: "/jobs",      label: "Job Explorer",    icon: Briefcase,  group: "ENACT" },
  { href: "/create",    label: "Create Job",      icon: PlusCircle, group: "ENACT" },
];

const groups = [...new Set(NAV_ITEMS.map(n => n.group))];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,255,255,0.4)" }}>SECURITY CORE</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
          <span className="text-xs" style={{ color: "#00FF88" }}>LIVE</span>
        </div>
        {/* Close button (only mobile drawer) */}
        <button onClick={() => setDrawerOpen(false)}
          className="md:hidden ml-2 p-1.5 -mr-1 rounded text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-400/10"
          aria-label="Закрити меню">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {groups.map(group => (
          <div key={group} className="mb-4">
            <div className="px-3 mb-1 text-xs font-bold tracking-widest" style={{ color: "rgba(0,255,255,0.4)" }}>
              ── {group} ──
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
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t text-xs shrink-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="mb-2" style={{ color: "rgba(0,255,255,0.4)" }}>── CONTRACTS ──</div>
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
            <span>ORGANISM ONLINE</span>
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
        <div className="md:hidden h-12 flex items-center px-3 border-b shrink-0 z-40"
          style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)" }}>
          <button onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded text-cyan-400 hover:bg-cyan-400/10"
            aria-label="Відкрити меню">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-2 flex flex-col">
            <span className="text-sm font-bold leading-none" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
            <span className="text-[8px] tracking-widest leading-tight mt-0.5" style={{ color: "rgba(0,255,255,0.4)" }}>SECURITY CORE</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
            <span className="text-[10px]" style={{ color: "#00FF88" }}>LIVE</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
