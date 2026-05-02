import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, Brain, Zap, DollarSign, Eye, TrendingUp, Shield,
  RefreshCw, ChevronDown, ChevronRight, BookOpen, Info,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api = (p: string) => `${BASE}/api${p}`;

function usePoll(path: string, ms = 5000) {
  return useQuery({ queryKey: [path], queryFn: () => fetch(api(path)).then(r => r.json()), refetchInterval: ms });
}

const CYCLE_META: Record<string, {
  icon: any; colorClass: string; colorHex: string;
  nameUk: string; whatItDoes: string; whatItFixes: string; interval: string;
}> = {
  SCAN: {
    icon: Eye, colorClass: "text-primary", colorHex: "#00FFFF",
    nameUk: "СКАНУВАННЯ БЛОКЧЕЙНУ",
    interval: "кожні 3 хв",
    whatItDoes: "Читає останній блок TON mainchain через TonCenter/TonAPI. Порівнює транзакції з базою відомих патернів атак (reentrancy, overflow, fake burn, drain тощо).",
    whatItFixes: "Виявляє нові вразливості: підозрілі контракти, аномальні транзакції, відомі вектори атак. Записує їх у таблицю зі статусом «active» для подальшого HEAL.",
  },
  HEAL: {
    icon: Zap, colorClass: "text-safe", colorHex: "#00FF88",
    nameUk: "САМО-ВІДНОВЛЕННЯ",
    interval: "кожні 5 хв",
    whatItDoes: "Вибирає наступну невиліковану вразливість (status=active). Запускає AI (Gemini 2.0 Flash) для аналізу: визначає тип атаки, генерує healingPlan.",
    whatItFixes: "Оновлює knowledge base новим патерном атаки. Підвищує точність детекції. Змінює статус вразливості на «healed». Надсилає алерт адміністратору в Telegram.",
  },
  LEARN: {
    icon: Brain, colorClass: "text-amber", colorHex: "#FF8C00",
    nameUk: "НАВЧАННЯ AI",
    interval: "кожні 7 хв",
    whatItDoes: "Аналізує всі нещодавно виліковані вразливості. AI витягує нові паттерни атак і захисні правила з накопиченого досвіду.",
    whatItFixes: "Розширює knowledge base новими записами. Accuracy агента зростає на +0.0001 за цикл. Покращує майбутнє виявлення схожих вразливостей.",
  },
  FINANCE: {
    icon: DollarSign, colorClass: "text-danger", colorHex: "#FF3355",
    nameUk: "ФІНАНСОВИЙ МОНІТОРИНГ",
    interval: "кожні 10 хв",
    whatItDoes: "Перевіряє баланс резервного гаманця, підписки користувачів, реферальні нарахування. Оновлює статистику доходів.",
    whatItFixes: "Фіксує нові підписки (PRO/ELITE/DEVELOPER), нараховує реферальні бонуси. Оновлює FINANCE звіт для Creator панелі.",
  },
};

/* ── Expandable cycle card ──────────────────────────────────────────── */
function CycleCard({ c }: { c: any }) {
  const [open, setOpen] = useState(false);
  const meta = CYCLE_META[c.name] || {
    icon: Activity, colorClass: "text-primary", colorHex: "#00FFFF",
    nameUk: c.name, interval: c.interval, whatItDoes: "—", whatItFixes: "—",
  };
  const Icon = meta.icon;
  const lastRun = c.lastRun ? new Date(c.lastRun).toLocaleTimeString() : "—";
  const nextRun = c.lastRun
    ? (() => {
        const mins = parseInt(c.interval) || 5;
        const next = new Date(new Date(c.lastRun).getTime() + mins * 60_000);
        return next > new Date() ? next.toLocaleTimeString() : "зараз";
      })()
    : "—";

  return (
    <div className="border rounded mb-2" style={{ borderColor: meta.colorHex + "30", background: meta.colorHex + "05" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 ${meta.colorClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${meta.colorClass}`}>{c.name}</span>
            <span className="text-[10px] text-muted">· {meta.nameUk}</span>
            <span className="ml-auto titan-badge titan-badge-safe text-[10px]">● ACTIVE</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted">
            <span>Запусків: <b className="text-foreground">{c.cycles}</b></span>
            <span>Інтервал: <b className="text-foreground">{meta.interval}</b></span>
            <span>Останній: <b className="text-foreground">{lastRun}</b></span>
            <span>Наступний: <b style={{ color: meta.colorHex }}>{nextRun}</b></span>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t" style={{ borderColor: meta.colorHex + "20" }}>
          <div>
            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: meta.colorHex }}>
              <Info className="inline w-3 h-3 mr-1" />ЩО РОБИТЬ ЦЕЙ ЦИКЛ
            </div>
            <p className="text-xs text-muted leading-relaxed">{meta.whatItDoes}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: meta.colorHex }}>
              <Zap className="inline w-3 h-3 mr-1" />ЩО ВИПРАВЛЯЄ / ПОКРАЩУЄ
            </div>
            <p className="text-xs text-muted leading-relaxed">{meta.whatItFixes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── How it all works (top-level guide) ─────────────────────────────── */
function AgentGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="titan-card mb-4" style={{ borderColor: "rgba(0,255,255,0.2)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">Що робить TITAN-94 агент? (інструкція)</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>
      {open && (
        <div className="mt-4 text-xs text-muted leading-relaxed space-y-2">
          <p>
            <b className="text-foreground">TITAN-94 — автономний AI-агент</b> для моніторингу безпеки TON блокчейну.
            Він працює безперервно 24/7 і виконує 4 цикли по черзі:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "SCAN", col: "#00FFFF", text: "Читає нові блоки → шукає вразливості" },
              { name: "HEAL", col: "#00FF88", text: "Вибирає загрозу → AI генерує план → виправляє" },
              { name: "LEARN", col: "#FF8C00", text: "Аналізує досвід → покращує точність" },
              { name: "FINANCE", col: "#FF3355", text: "Перевіряє баланс → нараховує підписки" },
            ].map(({ name, col, text }) => (
              <div key={name} className="p-2 border rounded" style={{ borderColor: col + "30" }}>
                <div className="font-bold text-[11px] mb-1" style={{ color: col }}>{name}</div>
                <div>{text}</div>
              </div>
            ))}
          </div>
          <p>
            Натисни на кожен цикл нижче, щоб побачити детально — що він робить і що виправляє прямо зараз.
          </p>
        </div>
      )}
    </div>
  );
}

const severityColor: Record<string, string> = {
  critical: "text-danger", high: "text-danger", medium: "text-amber",
  success: "text-safe", info: "text-primary", low: "text-muted",
};

const TYPE_COLOR: Record<string, string> = {
  SCAN: "#00FFFF", HEAL: "#00FF88", LEARN: "#FF8C00", FINANCE: "#FF3355",
};

export default function StatusPage() {
  const qc = useQueryClient();
  const { data: stats }  = usePoll("/agent/stats", 4000);
  const { data: cycles } = usePoll("/agent/cycles", 4000);
  const { data: act }    = usePoll("/activity?limit=12", 6000);

  const scan = useMutation({
    mutationFn: () => fetch(api("/agent/scan"), { method: "POST" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries(); },
  });

  const accuracy = stats ? (parseFloat(stats.accuracy || stats.aiAccuracy || "0.847") * 100).toFixed(1) : "84.7";
  const cyclesArr = cycles ? Object.values(cycles) as any[] : [];

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ AGENT STATUS</h1>
        <div className="flex items-center gap-2">
          <span className="titan-pulse" />
          <span className="text-safe text-sm font-mono">ONLINE</span>
          <button className="titan-btn titan-btn-sm ml-2" onClick={() => scan.mutate()} disabled={scan.isPending}>
            <RefreshCw className={`w-3 h-3 mr-1 ${scan.isPending ? "animate-spin" : ""}`} />SCAN
          </button>
        </div>
      </div>

      {/* Agent guide */}
      <AgentGuide />

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
        {[
          { label: "ЦИКЛИ СКАНУВАННЯ", value: stats?.cycles ?? "...", icon: Eye,      color: "text-primary", hint: "Загальна кількість SCAN циклів з моменту запуску" },
          { label: "ТОЧНІСТЬ AI",       value: `${accuracy}%`,         icon: Brain,    color: "text-safe",    hint: "Точність детекції: зростає +0.0001 за кожен LEARN цикл" },
          { label: "ВРАЗЛИВОСТЕЙ",      value: stats?.threats?.total ?? "...", icon: Shield, color: "text-danger", hint: "Всього знайдено вразливостей з початку роботи" },
          { label: "ВИЛІКУВАНО",        value: stats?.threatsHealed ?? "...", icon: Zap,    color: "text-amber",  hint: "Вразливостей успішно оброблено HEAL циклом" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="titan-card text-center" title={s.hint}>
              <Icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Heartbeat Cycles — expandable detail */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="titan-label">HEARTBEAT — 4 АВТОНОМНИХ ЦИКЛИ</span>
          <span className="text-[10px] text-muted ml-2">← натисни на цикл для деталей</span>
        </div>
        {cyclesArr.map((c: any) => <CycleCard key={c.name} c={c} />)}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="titan-card text-center" title="Кількість вивчених патернів атак у knowledge base">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-safe" />
          <div className="text-xl font-bold text-safe">{stats?.knowledgeSize ?? "—"}</div>
          <div className="text-xs text-muted">KNOWLEDGE BASE</div>
          <div className="text-[10px] text-muted/60 mt-0.5">патернів атак</div>
        </div>
        <div className="titan-card text-center" title="Час роботи агента з моменту останнього запуску">
          <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold text-primary">
            {stats?.uptime ? Math.floor(parseFloat(stats.uptime) / 60) : 0}m
          </div>
          <div className="text-xs text-muted">UPTIME</div>
          <div className="text-[10px] text-muted/60 mt-0.5">з останнього запуску</div>
        </div>
        <div className="titan-card text-center" title="Критичних вразливостей виявлено (CRITICAL severity)">
          <Shield className="w-5 h-5 mx-auto mb-1 text-amber" />
          <div className="text-xl font-bold text-amber">{stats?.threats?.critical ?? 0}</div>
          <div className="text-xs text-muted">CRITICAL</div>
          <div className="text-[10px] text-muted/60 mt-0.5">вразливостей</div>
        </div>
      </div>

      {/* Activity feed — with type colors */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <span className="titan-label">АКТИВНІСТЬ АГЕНТА</span>
          <span className="text-[10px] text-muted ml-auto">останні події по всіх циклах</span>
        </div>
        <div className="space-y-1.5">
          {(act?.activity || []).map((a: any, i: number) => (
            <div key={i} className="titan-activity-row">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="text-[10px] font-bold font-mono w-16 shrink-0 text-center py-0.5 rounded"
                  style={{
                    color: TYPE_COLOR[a.type] || "#6b7280",
                    background: (TYPE_COLOR[a.type] || "#6b7280") + "15",
                    border: `1px solid ${(TYPE_COLOR[a.type] || "#6b7280")}30`,
                  }}>
                  {a.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground truncate">{a.title}</div>
                  {a.message && <div className="text-xs text-muted truncate">{a.message}</div>}
                </div>
              </div>
              <div className="text-xs text-muted shrink-0 ml-2 text-right">
                <div>{new Date(a.createdAt).toLocaleTimeString()}</div>
                {a.severity && (
                  <div className={`text-[10px] ${severityColor[a.severity] || "text-muted"}`}>
                    {a.severity}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!act?.activity || act.activity.length === 0) && (
            <div className="text-center text-muted text-sm py-4">Очікую активності агента...</div>
          )}
        </div>
      </div>
    </div>
  );
}
