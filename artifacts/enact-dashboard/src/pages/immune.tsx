import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang, t } from "@/lib/ui-prefs";
import {
  Heart, Zap, Shield, Activity, CheckCircle, ChevronDown, ChevronRight,
  AlertTriangle, ExternalLink, Clock, Target, BookOpen, Info,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 5000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

const SEV_COLOR: Record<string, string> = {
  critical: "#FF3355", high: "#FF3355", medium: "#FF8C00", low: "#00FFFF", info: "#6b7280",
};
const SEV_BG: Record<string, string> = {
  critical: "rgba(255,51,85,0.1)", high: "rgba(255,51,85,0.1)",
  medium: "rgba(255,140,0,0.1)", low: "rgba(0,255,255,0.06)", info: "rgba(107,114,128,0.1)",
};
const STATUS_COLOR: Record<string, string> = {
  healed: "#00FF88", healing: "#FF8C00", active: "#FF3355",
};

/* ── How it works expandable explanation ─────────────────────────── */
function HowItWorks() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="titan-card mb-4" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-safe" />
          <span className="text-sm font-bold text-safe">{t("page.immune.how_works", lang)}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Імунна система TITAN-94 автоматично знаходить і виправляє вразливості у блокчейні TON. Ось покроково що відбувається:
          </p>
          {[
            {
              step: "1", color: "#00FFFF", icon: Target,
              title: "SCAN (кожні 3 хв) → виявляє вразливість",
              text: "Агент читає новий блок TON mainchain. Порівнює транзакції з базою відомих патернів атак (reentrancy, overflow, fake burn тощо). Якщо збіг — записує нову вразливість у базу зі статусом «active».",
            },
            {
              step: "2", color: "#9B5CFF", icon: Activity,
              title: "AI аналіз → оцінює небезпеку",
              text: "Gemini 2.0 Flash аналізує вразливість: визначає тип атаки, оцінює критичність (critical/high/medium/low), підраховує TVL під ризиком. Генерує конкретний план усунення (healingPlan).",
            },
            {
              step: "3", color: "#FF8C00", icon: Zap,
              title: "HEAL (кожні 5 хв) → виправляє",
              text: "Вибирає наступну невиліковану вразливість. Виконує healing plan: оновлює knowledge base новим патерном, підвищує точність детекції для цього типу атаки. Змінює статус на «healed».",
            },
            {
              step: "4", color: "#00FF88", icon: CheckCircle,
              title: "LEARN (кожні 7 хв) → навчається",
              text: "Аналізує всі виліковані вразливості і витягує нові патерни. Записує у knowledge base. Точність (accuracy) агента зростає на +0.0001 за кожен цикл.",
            },
          ].map(({ step, color, icon: Icon, title, text }) => (
            <div key={step} className="flex gap-3">
              <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border text-xs font-bold"
                style={{ borderColor: color, color, background: color + "15" }}>
                {step}
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{ color }}>
                  <Icon className="inline w-3 h-3 mr-1" />{title}
                </div>
                <p className="text-xs text-muted leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
          <div className="text-[10px] text-muted p-2 border-l-2 mt-2" style={{ borderColor: "#00FF88" }}>
            ⚠️ Увага: «виліковування» означає оновлення knowledge base і правил детекції, а НЕ безпосередню зміну смарт-контрактів. Реальне виправлення вразливого контракту потребує дій від команди протоколу.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Vulnerability detail row ─────────────────────────────────────── */
function VulnRow({ v }: { v: any }) {
  const [open, setOpen] = useState(false);
  const sev = (v.severity || "info").toLowerCase();
  const col = SEV_COLOR[sev] || "#6b7280";
  const bg  = SEV_BG[sev]  || "transparent";
  const stCol = STATUS_COLOR[v.status] || "#6b7280";

  const healSteps: string[] = v.healingPlan
    ? v.healingPlan.split(/\d+\.\s+/).filter(Boolean).map((s: string) => s.trim())
    : [];

  return (
    <div className="border rounded mb-2" style={{ borderColor: col + "30", background: bg }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        {/* Severity badge */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-mono"
          style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>
          {(v.severity || "?").toUpperCase()}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-foreground truncate">{v.title}</div>
          <div className="text-[10px] text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{v.category || "Unknown"}</span>
            {v.contractAddress && (
              <span className="font-mono truncate max-w-[120px]" style={{ color: "#00FFFF" }}>
                {v.contractAddress.slice(0, 8)}…{v.contractAddress.slice(-4)}
              </span>
            )}
            {v.tvlAtRisk && parseFloat(v.tvlAtRisk) > 0 && (
              <span className="text-amber">TVL: {parseFloat(v.tvlAtRisk).toFixed(0)} TON</span>
            )}
          </div>
        </div>

        {/* Status */}
        <span className="text-[10px] font-bold shrink-0 font-mono" style={{ color: stCol }}>
          {v.status === "healed" ? "✓ HEALED" : v.status === "healing" ? "⚡ HEALING" : "● ACTIVE"}
        </span>

        {open ? <ChevronDown className="w-3 h-3 text-muted shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: col + "20" }}>
          {/* IDs & dates */}
          <div className="grid grid-cols-2 gap-2 text-[10px] mt-3">
            <div>
              <div className="text-muted tracking-wider mb-0.5">ID</div>
              <div className="font-mono text-primary">{v.externalId || `#${v.id}`}</div>
            </div>
            <div>
              <div className="text-muted tracking-wider mb-0.5">{t("common.protocol", lang)}</div>
              <div className="font-mono">{v.protocol || "Unknown"}</div>
            </div>
            <div>
              <div className="text-muted tracking-wider mb-0.5">ВИЯВЛЕНО</div>
              <div className="font-mono">{v.discoveredAt ? new Date(v.discoveredAt).toLocaleString() : "—"}</div>
            </div>
            {v.healedAt && (
              <div>
                <div className="text-muted tracking-wider mb-0.5">ВИЛІКОВАНО</div>
                <div className="font-mono text-safe">{new Date(v.healedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Contract link */}
          {v.contractAddress && (
            <div>
              <div className="text-[10px] text-muted tracking-wider mb-1">КОНТРАКТ / АДРЕСА</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-primary break-all">{v.contractAddress}</span>
                <a href={`https://tonviewer.com/${v.contractAddress}`} target="_blank" rel="noopener"
                   className="shrink-0 p-1 hover:text-primary transition-colors text-muted">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Healing plan steps */}
          {healSteps.length > 0 && (
            <div>
              <div className="text-[10px] text-muted tracking-wider mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-safe" /> {t("page.threats.heal_plan", lang)}
              </div>
              <div className="space-y-1">
                {healSteps.map((step, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "#00FF8820", color: "#00FF88", border: "1px solid #00FF8840" }}>
                      {i + 1}
                    </span>
                    <span className="text-muted leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!v.healingPlan && (
            <div className="text-[10px] text-muted italic">
              Healing plan буде згенерований при наступному HEAL циклі (кожні 5 хвилин)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImmunePage() {
  const { lang } = useLang();
  const { data: stats }  = usePoll("/agent/stats", 4000);
  const { data: cycles } = usePoll("/agent/cycles", 4000);
  const { data: vulns }  = usePoll("/vulnerabilities?limit=50", 6000);
  const { data: act }    = usePoll("/activity?limit=30", 5000);
  const [filter, setFilter] = useState<"all" | "active" | "healing" | "healed">("all");

  const all      = (vulns?.vulnerabilities || []) as any[];
  const active   = all.filter((v) => v.status === "active").length;
  const healing  = all.filter((v) => v.status === "healing").length;
  const healed   = all.filter((v) => v.status === "healed").length;
  const total    = all.length || 1;
  const healPct  = Math.round((healed / total) * 100);

  const healCycle  = (cycles?.HEAL || cycles?.heal || {}) as any;
  const healEvents = ((act?.activity || []) as any[]).filter((a) =>
    a.type === "HEAL" || a.title?.toLowerCase().includes("heal")
  );

  // Currently healing (most recent active/healing with a healingPlan)
  const currentTarget = all.find((v) => v.status === "healing") ||
    all.find((v) => v.status === "active" && v.healingPlan) ||
    null;

  const filtered = filter === "all" ? all : all.filter((v) => v.status === filter);

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ {t("page.immune.title", lang)}</h1>
        <p className="titan-subtitle">{t("page.immune.subtitle", lang)}</p>
      </div>

      {/* How it works */}
      <HowItWorks />

      {/* Vital signs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Vital label="ВИЛІКОВАНО" value={healed}          icon={CheckCircle} color="text-safe"   />
        <Vital label="ЛІКУЄТЬСЯ"  value={healing}         icon={Zap}         color="text-amber"  />
        <Vital label="АКТИВНИХ"   value={active}          icon={Shield}      color="text-danger" />
        <Vital label="РІВЕНЬ ЗДОРОВ'Я" value={`${healPct}%`} icon={Heart}   color="text-primary"/>
      </div>

      {/* HEAL cycle status */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-safe titan-pulse" />
          <span className="titan-label">HEAL CYCLE — АВТОІМУННИЙ ВІДГУК</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-safe">{healCycle.cycles ?? 0}</div>
            <div className="text-xs text-muted">ЦИКЛІВ ВИКОНАНО</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{healCycle.interval ?? "5min"}</div>
            <div className="text-xs text-muted">ІНТЕРВАЛ</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-amber">
              {healCycle.lastRun ? new Date(healCycle.lastRun).toLocaleTimeString() : "queued"}
            </div>
            <div className="text-xs text-muted">ОСТАННІЙ ЗАПУСК</div>
          </div>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted">SYSTEM HEALTH</span>
          <span className="text-safe">{healPct}%</span>
        </div>
        <div className="titan-progress-track">
          <div className="titan-progress-fill" style={{ width: `${healPct}%`, background: "#00FF88" }} />
        </div>
      </div>

      {/* Currently healing target */}
      {currentTarget && (
        <div className="titan-live-card p-4 mb-4" style={{ borderColor: "rgba(255,140,0,0.5)", background: "rgba(255,140,0,0.05)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber animate-pulse" />
            <span className="text-sm font-bold text-amber">⚡ ЗАРАЗ ЛІКУЄТЬСЯ — ЦІЛЬ АГЕНТА</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <div className="text-muted tracking-wider text-[10px] mb-1">ВРАЗЛИВІСТЬ</div>
              <div className="font-bold text-foreground">{currentTarget.title}</div>
            </div>
            <div>
              <div className="text-muted tracking-wider text-[10px] mb-1">ТИП / КАТЕГОРІЯ</div>
              <div className="font-bold" style={{ color: SEV_COLOR[currentTarget.severity?.toLowerCase()] || "#6b7280" }}>
                {(currentTarget.severity || "?").toUpperCase()} · {currentTarget.category || "Unknown"}
              </div>
            </div>
            {currentTarget.contractAddress && (
              <div>
                <div className="text-muted tracking-wider text-[10px] mb-1">КОНТРАКТ TON</div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-primary text-[11px]">
                    {currentTarget.contractAddress.slice(0, 12)}…
                  </span>
                  <a href={`https://tonviewer.com/${currentTarget.contractAddress}`} target="_blank" rel="noopener"
                     className="text-muted hover:text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
            {currentTarget.tvlAtRisk && parseFloat(currentTarget.tvlAtRisk) > 0 && (
              <div>
                <div className="text-muted tracking-wider text-[10px] mb-1">TVL ПІД РИЗИКОМ</div>
                <div className="font-bold text-amber">{parseFloat(currentTarget.tvlAtRisk).toFixed(2)} TON</div>
              </div>
            )}
          </div>
          {currentTarget.healingPlan && (
            <div>
              <div className="text-[10px] text-muted tracking-wider mb-2">ЩО РОБИТЬ AI:</div>
              <div className="space-y-1">
                {currentTarget.healingPlan.split(/\d+\.\s+/).filter(Boolean).map((step: string, i: number) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full font-bold"
                      style={{ background: "#FF8C0020", color: "#FF8C00", border: "1px solid #FF8C0040", fontSize: "9px" }}>
                      {i + 1}
                    </span>
                    <span className="text-muted leading-relaxed">{step.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vulnerability list with filter */}
      <div className="titan-card mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="titan-label">ВСІ ВРАЗЛИВОСТІ ({all.length})</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["all", "active", "healing", "healed"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="text-[10px] px-2 py-1 border font-mono transition"
                style={{
                  borderColor: filter === f ? "#00FFFF" : "rgba(0,255,255,0.15)",
                  background: filter === f ? "rgba(0,255,255,0.1)" : "transparent",
                  color: filter === f ? "#00FFFF" : "#6b7280",
                }}>
                {f.toUpperCase()} {f !== "all" ? `(${all.filter(v => v.status === f).length})` : `(${all.length})`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-muted text-sm py-8 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-safe opacity-40" />
            {filter === "active" ? "Немає активних загроз — система чиста" : "Нічого не знайдено"}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {filtered.map((v: any) => (
            <VulnRow key={v.id} v={v} />
          ))}
        </div>
      </div>

      {/* Healing activity log */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-safe" />
          <span className="titan-label">ЛОГ HEALING ПОДІЙ</span>
          <span className="text-[10px] text-muted ml-auto">останні {healEvents.length}</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {healEvents.length === 0 && (
            <div className="text-center text-muted text-sm py-6 flex flex-col items-center gap-1">
              <Clock className="w-6 h-6 opacity-30" />
              Наступний HEAL цикл через ~5 хвилин
            </div>
          )}
          {healEvents.map((e: any, i: number) => (
            <div key={i} className="titan-activity-row">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Heart className="w-3 h-3 text-safe shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{e.title}</div>
                  <div className="text-xs text-muted truncate">{e.message}</div>
                </div>
              </div>
              <div className="text-xs text-muted shrink-0">
                {new Date(e.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-muted opacity-60">
        HEAL цикл запускається кожні 5 хвилин · Автоматично оновлює knowledge base · Solo Deo Subjectus
      </div>
    </div>
  );
}

function Vital({ label, value, icon: Icon, color }: any) {
  return (
    <div className="titan-card text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
