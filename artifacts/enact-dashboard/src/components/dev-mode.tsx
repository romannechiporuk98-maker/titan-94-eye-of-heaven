/**
 * DEV MODE SELECTOR — показується ТІЛЬКИ в режимі розробки (не в production).
 *
 * В production (deployed) цей компонент повністю відключений.
 * В dev-режимі (локально, поза Telegram) дозволяє симулювати різних юзерів.
 * Кнопка додає ?_dev_tg=<ID> до URL → telegram.ts підхоплює → app
 * поводиться як ніби зайшов реальний TG-юзер з цим ID.
 */
import { useState, useEffect } from "react";
import { getTgUser } from "@/lib/telegram";
import { Crown, User, Users, Code2, ChevronDown, ChevronUp, X } from "lucide-react";

type SimUser = { id: string; label: string; icon: typeof Crown; color: string; badge: string };

const SIM_USERS: SimUser[] = [
  { id: "7255058720", label: "Roman (Творець)",  icon: Crown,  color: "#FF8C00", badge: "CREATOR" },
  { id: "1000000001", label: "ELITE юзер",       icon: User,   color: "#00FFFF", badge: "ELITE"   },
  { id: "1000000002", label: "PRO юзер",         icon: User,   color: "#00FF88", badge: "PRO"     },
  { id: "1000000003", label: "FREE юзер",        icon: Users,  color: "#6b7280", badge: "FREE"    },
  { id: "1000000099", label: "Developer",        icon: Code2,  color: "#A855F7", badge: "DEV"     },
];

const DISMISSED_KEY = "titan94.devmode.dismissed";

function getCurrentDevId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("_dev_tg");
}

function switchUser(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("_dev_tg", id);
  else url.searchParams.delete("_dev_tg");
  window.location.href = url.toString();
}

export function DevModeOverlay() {
  // ─── PRODUCTION GUARD: never show in production ───────────────────────────
  if (import.meta.env.PROD) return null;

  const user = getTgUser();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!window.localStorage.getItem(DISMISSED_KEY); } catch { return false; }
  });

  const currentDevId = getCurrentDevId();
  const currentSim = SIM_USERS.find(u => u.id === currentDevId);

  // Also hide if this is a real Telegram session (even in dev)
  if (user.isReal || dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[500] font-mono"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {/* Expanded panel */}
      {open && (
        <div
          className="border-t border-l border-r mx-4 mb-0 rounded-t-lg overflow-hidden"
          style={{ background: "#060F1A", borderColor: "rgba(255,140,0,0.4)", boxShadow: "0 -8px 32px rgba(255,140,0,0.15)" }}
        >
          <div className="px-4 pt-3 pb-2 text-xs" style={{ color: "rgba(207,255,255,0.6)" }}>
            <span className="font-bold text-amber-400">⚠ DEV MODE</span>
            {" "}— симулюй різних юзерів для тестування. В реальному Telegram цей банер не видно.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 pb-3">
            {SIM_USERS.map((u) => {
              const Icon = u.icon;
              const active = currentDevId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded border text-xs transition-all"
                  style={{
                    borderColor: active ? u.color : "rgba(0,255,255,0.2)",
                    background: active ? `${u.color}18` : "transparent",
                    color: active ? u.color : "rgba(207,255,255,0.7)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: u.color }} />
                  <span className="text-[10px] font-bold">{u.badge}</span>
                  <span className="text-[9px] text-center leading-tight">{u.label}</span>
                  {active && <span className="text-[9px]">✓ активний</span>}
                </button>
              );
            })}
          </div>
          {currentDevId && (
            <div className="px-4 pb-3 flex gap-2">
              <button
                onClick={() => switchUser(null)}
                className="text-[10px] px-3 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                × Скинути (demo_user)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t cursor-pointer"
        style={{
          background: "#060F1A",
          borderColor: "rgba(255,140,0,0.3)",
          boxShadow: open ? "none" : "0 -4px 16px rgba(255,140,0,0.1)",
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-400 font-bold text-[10px] tracking-widest">⚡ DEV MODE</span>
          <span style={{ color: "rgba(207,255,255,0.5)" }}>·</span>
          {currentSim ? (
            <span className="flex items-center gap-1" style={{ color: currentSim.color }}>
              <currentSim.icon className="w-3 h-3" />
              <span className="font-bold">{currentSim.badge}</span>
              <span style={{ color: "rgba(207,255,255,0.6)" }}>{currentSim.label}</span>
            </span>
          ) : (
            <span style={{ color: "rgba(207,255,255,0.5)" }}>
              ID: <span className="text-red-400">demo_user</span>
              <span className="ml-1 text-[10px]">→ натисни щоб вибрати юзера</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: "rgba(207,255,255,0.4)" }}>
            {open ? "сховати" : "вибрати юзера"}
          </span>
          {open
            ? <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,140,0,0.7)" }} />
            : <ChevronUp   className="w-4 h-4" style={{ color: "rgba(255,140,0,0.7)" }} />
          }
          <button
            onClick={(e) => {
              e.stopPropagation();
              try { window.localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
              setDismissed(true);
            }}
            className="p-0.5 hover:text-white transition-colors"
            style={{ color: "rgba(207,255,255,0.3)" }}
            title="Сховати назавжди"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
