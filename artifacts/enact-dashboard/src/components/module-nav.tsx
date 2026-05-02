/**
 * ModuleNav — persistent next / skip navigation bar.
 * Shows at the bottom of every page so the user can move between modules
 * even when one module is broken or the user just wants to explore.
 */
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout";
import { useLang, t } from "@/lib/ui-prefs";

export function ModuleNav() {
  const [location, navigate] = useLocation();
  const { lang } = useLang();

  const idx = NAV_ITEMS.findIndex((item) => item.href === location);
  if (idx === -1) return null;

  const prev = idx > 0 ? NAV_ITEMS[idx - 1] : null;
  const next = idx < NAV_ITEMS.length - 1 ? NAV_ITEMS[idx + 1] : null;
  const skip = idx < NAV_ITEMS.length - 2 ? NAV_ITEMS[idx + 2] : null;

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    fontSize: 11,
    fontFamily: "'Space Mono', monospace",
    border: "1px solid rgba(0,255,255,0.18)",
    background: "rgba(0,255,255,0.04)",
    color: "rgba(0,255,255,0.65)",
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.05em",
    borderRadius: 2,
  };

  const skipStyle: React.CSSProperties = {
    ...btnBase,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 32,
        paddingTop: 14,
        borderTop: "1px solid rgba(0,255,255,0.09)",
      }}
    >
      {/* ← Назад */}
      <div>
        {prev ? (
          <button
            style={btnBase}
            onClick={() => navigate(prev.href)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#00FFFF";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,255,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,255,255,0.65)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,255,0.18)";
            }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
            {t(prev.tkey, lang)}
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* counter */}
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace" }}>
        {idx + 1} / {NAV_ITEMS.length}
      </span>

      {/* Далі + Пропустити */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {next && (
          <button
            style={btnBase}
            onClick={() => navigate(next.href)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#00FFFF";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,255,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,255,255,0.65)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,255,0.18)";
            }}
          >
            {lang === "uk" ? "Далі" : lang === "ru" ? "Далее" : "Next"}
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        )}
        {skip && (
          <button
            style={skipStyle}
            onClick={() => navigate(skip.href)}
            title={`Skip to: ${t(skip.tkey, lang)}`}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
            }}
          >
            {lang === "uk" ? "Пропустити" : lang === "ru" ? "Пропустить" : "Skip"}
            <ChevronsRight style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>
    </nav>
  );
}
