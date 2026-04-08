import { Link, useLocation } from "wouter";
import {
  Activity, Briefcase, PlusCircle, ExternalLink,
  Eye, Shield, Search, DollarSign, Zap, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",        label: "ENACT Overview",  icon: Activity,   group: "ENACT" },
  { href: "/jobs",    label: "Job Explorer",    icon: Briefcase,  group: "ENACT" },
  { href: "/create",  label: "Create Job",      icon: PlusCircle, group: "ENACT" },
  { href: "/status",  label: "Agent Status",    icon: Eye,        group: "TITAN-94" },
  { href: "/threats", label: "Threats Matrix",  icon: Shield,     group: "TITAN-94" },
  { href: "/analyze", label: "Neural Analysis", icon: Search,     group: "TITAN-94" },
  { href: "/earn",    label: "Earn Terminal",   icon: DollarSign, group: "TITAN-94" },
];

const groups = [...new Set(NAV_ITEMS.map(n => n.group))];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>

      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r" style={{ background: "#060F1A", borderColor: "rgba(0,255,255,0.15)" }}>

        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "#00FFFF" }}>◈ TITAN-94</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
            <span className="text-xs" style={{ color: "#00FF88" }}>LIVE</span>
          </div>
        </div>

        {/* Nav */}
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
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "text-cyan-400 border-l-2"
                        : "hover:text-cyan-300"
                    )}
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

        {/* Footer */}
        <div className="p-4 border-t text-xs" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
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
          <div className="mt-3 text-center" style={{ color: "rgba(207,255,255,0.25)", fontSize: "10px" }}>
            v4.0 · DEI GRATIA Роман
          </div>
        </div>
      </aside>

      {/* CRT scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden" style={{ background: "#030D18" }}>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
