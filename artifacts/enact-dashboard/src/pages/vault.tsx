/**
 * VAULT — passphrase-protected secret manager + Creator Control Panel.
 *
 * Логіка входу:
 *   /vault → екран пароля → після логіна 2 вкладки:
 *     [API КЛЮЧІ]     — список секретів організму
 *     [CREATOR PANEL] — повне управління: вибір юзера, навігація, швидкі дії
 *
 * CREATOR PANEL:
 *   Vault passphrase = creator authentication в браузері.
 *   Після логіна ти маєш повний доступ без Telegram.
 *   Кнопки ролей → встановлюють _dev_tg URL param → перезавантаження →
 *   вся SPA бачить реальний TG ID цього юзера.
 *
 * URL: /vault  (працює без Telegram — тільки passphrase)
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, Unlock, KeyRound, Save, Trash2, Loader2,
  ExternalLink, AlertCircle, CheckCircle2, Eye, EyeOff, LogOut,
  Send, Sparkles, Crown, User, Users, Code2, Shield,
  LayoutDashboard, Bot, Settings as SettingsIcon, MenuSquare,
  Terminal, Zap, BarChart3, Activity, Globe, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const TOK_KEY = "titan94.vault.token";
const CREATOR_ID = "7255058720";

type Status   = { initialized: boolean };
type Detected = { key: string | null; confidence: "high" | "medium" | "low"; candidates: string[] };
type SecretRow = {
  key: string; configured: boolean; source: string; hint: string;
  meta: { name: string; description: string; provider: string; getUrl: string; required: boolean; group: string };
};

const GROUP_ORDER = ["telegram", "ton", "ai", "trading", "social"];
const GROUP_LABELS: Record<string, string> = {
  telegram: "TELEGRAM", ton: "TON BLOCKCHAIN", ai: "AI ORCHESTRA",
  trading: "TRADING (BINANCE)", social: "SOCIAL POSTING",
};
const GROUP_COLOR: Record<string, string> = {
  telegram: "#00B5FF", ton: "#0098EA", ai: "#9B5CFF",
  trading: "#FFB860", social: "#FF66B3",
};

// ─── DEV USER SIMULATION ─────────────────────────────────────────────
type SimUser = { id: string; label: string; icon: typeof Crown; color: string; badge: string; desc: string };
const SIM_USERS: SimUser[] = [
  { id: CREATOR_ID,    label: "Roman Korol",  icon: Crown,  color: "#FF8C00", badge: "CREATOR", desc: "Повний доступ до всього" },
  { id: "1000000001",  label: "ELITE User",   icon: Shield, color: "#00FFFF", badge: "ELITE",   desc: "Підписка Elite — всі модулі" },
  { id: "1000000002",  label: "PRO User",     icon: User,   color: "#00FF88", badge: "PRO",     desc: "Підписка Pro" },
  { id: "1000000003",  label: "FREE User",    icon: Users,  color: "#6b7280", badge: "FREE",    desc: "Безкоштовний доступ" },
  { id: "1000000099",  label: "Developer",    icon: Code2,  color: "#A855F7", badge: "DEV",     desc: "Тестовий розробник" },
];

function getCurrentDevId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("_dev_tg");
}
function navigateAs(id: string, path = "/") {
  const url = new URL(window.location.href);
  url.pathname = (BASE || "") + path;
  url.searchParams.set("_dev_tg", id);
  window.location.href = url.toString();
}

// ─── QUICK LINKS for Creator Panel ────────────────────────────────────
const QUICK_LINKS = [
  { path: "/creator",    label: "Creator Panel",    icon: Crown,           color: "#FF8C00", desc: "Повна панель творця (7 вкладок)" },
  { path: "/",           label: "Command Center",   icon: LayoutDashboard, color: "#00FFFF", desc: "Головний центр управління" },
  { path: "/threats",    label: "Threats",          icon: Shield,          color: "#FF3355", desc: "Вразливості та загрози" },
  { path: "/analytics",  label: "Analytics",        icon: BarChart3,       color: "#00FF88", desc: "Аналітика та статистика" },
  { path: "/evolution",  label: "Evolution",        icon: Zap,             color: "#9B5CFF", desc: "AI еволюція організму" },
  { path: "/autotrade",  label: "Auto-Trade",       icon: Activity,        color: "#FFB860", desc: "Автоматична торгівля" },
  { path: "/nexus",      label: "NEXUS AI",         icon: Bot,             color: "#FF66B3", desc: "AI Hub" },
  { path: "/settings",   label: "Settings",         icon: SettingsIcon,    color: "#6b7280", desc: "Налаштування організму" },
  { path: "/developer",  label: "Developer Mode",   icon: Code2,           color: "#A855F7", desc: "Developer план" },
];

// ─── CREATOR PANEL TAB ────────────────────────────────────────────────
function CreatorPanelTab() {
  const currentDevId = getCurrentDevId();
  const currentSim = SIM_USERS.find(u => u.id === currentDevId);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8">

      {/* STATUS BANNER */}
      <div className="p-4 border rounded" style={{
        borderColor: "rgba(255,140,0,0.4)",
        background: "linear-gradient(135deg, rgba(255,140,0,0.05), rgba(155,92,255,0.05))",
      }}>
        <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: "rgba(255,140,0,0.7)" }}>
          ◈ VAULT AUTHENTICATED · CREATOR ACCESS GRANTED
        </div>
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 shrink-0" style={{ color: "#FF8C00", filter: "drop-shadow(0 0 8px #FF8C00)" }} />
          <div>
            <div className="font-bold tracking-wide" style={{ color: "#CFFFFF" }}>
              Vault пароль = повний доступ творця
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(207,255,255,0.6)" }}>
              Вибери роль для симуляції → відкрий будь-який розділ → контролюй все
            </div>
          </div>
        </div>
        {currentSim && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs" style={{ borderColor: "rgba(255,140,0,0.2)", color: currentSim.color }}>
            <currentSim.icon className="w-4 h-4" />
            <span className="font-bold">{currentSim.badge}</span>
            <span style={{ color: "rgba(207,255,255,0.7)" }}>·</span>
            <span style={{ color: "rgba(207,255,255,0.7)" }}>{currentSim.label}</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 border rounded" style={{ borderColor: `${currentSim.color}40`, color: currentSim.color }}>
              АКТИВНИЙ
            </span>
          </div>
        )}
        {!currentSim && (
          <div className="mt-3 pt-3 border-t text-[11px]" style={{ borderColor: "rgba(255,140,0,0.2)", color: "rgba(207,255,255,0.5)" }}>
            Роль не вибрана — вибери нижче щоб симулювати юзера в браузері
          </div>
        )}
      </div>

      {/* ROLE SELECTOR */}
      <div>
        <div className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "rgba(0,255,255,0.6)" }}>
          ── СИМУЛЯЦІЯ РОЛІ ──
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SIM_USERS.map((u) => {
            const Icon = u.icon;
            const active = currentDevId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => navigateAs(u.id, u.id === CREATOR_ID ? "/creator" : "/")}
                className="flex items-start gap-3 p-3 border rounded text-left transition-all hover:scale-[1.01]"
                style={{
                  borderColor: active ? u.color : "rgba(0,255,255,0.15)",
                  background: active ? `${u.color}12` : "rgba(0,255,255,0.02)",
                  boxShadow: active ? `0 0 20px ${u.color}20` : "none",
                }}>
                <div className="mt-0.5 p-2 rounded border" style={{ borderColor: `${u.color}40`, background: `${u.color}10` }}>
                  <Icon className="w-4 h-4" style={{ color: u.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: active ? u.color : "#CFFFFF" }}>{u.badge}</span>
                    {active && <span className="text-[9px] px-1.5 border rounded" style={{ borderColor: `${u.color}50`, color: u.color }}>✓ active</span>}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: active ? u.color : "rgba(207,255,255,0.6)" }}>{u.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(207,255,255,0.4)" }}>{u.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: `${u.color}60` }} />
              </button>
            );
          })}
        </div>
        {currentDevId && (
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("_dev_tg");
              window.location.href = url.toString();
            }}
            className="mt-3 text-[11px] px-3 py-2 border hover:bg-red-500/10 transition-colors"
            style={{ borderColor: "rgba(255,51,85,0.3)", color: "rgba(255,115,136,0.8)" }}>
            × Скинути симуляцію → demo_user
          </button>
        )}
      </div>

      {/* QUICK NAVIGATION */}
      <div>
        <div className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "rgba(0,255,255,0.6)" }}>
          ── ШВИДКА НАВІГАЦІЯ ──
        </div>
        <div className="text-[11px] mb-3" style={{ color: "rgba(207,255,255,0.5)" }}>
          Натискай на розділ щоб перейти з поточною роллю{" "}
          {currentSim ? <span style={{ color: currentSim.color }}>({currentSim.badge})</span> : <span style={{ color: "rgba(255,140,0,0.8)" }}>→ спочатку вибери роль вище</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {QUICK_LINKS.map(({ path, label, icon: Icon, color, desc }) => {
            const hovered = hoveredPath === path;
            return (
              <button
                key={path}
                onClick={() => navigateAs(currentDevId || CREATOR_ID, path)}
                onMouseEnter={() => setHoveredPath(path)}
                onMouseLeave={() => setHoveredPath(null)}
                className="flex items-center gap-3 px-4 py-3 border text-left transition-all"
                style={{
                  borderColor: hovered ? color : "rgba(0,255,255,0.12)",
                  background: hovered ? `${color}0D` : "transparent",
                }}>
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold" style={{ color: hovered ? color : "#CFFFFF" }}>{label}</div>
                  <div className="text-[10px]" style={{ color: "rgba(207,255,255,0.4)" }}>{desc}</div>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: `${color}60` }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* DEV TIP */}
      <div className="p-3 border text-[10px] leading-relaxed" style={{
        borderColor: "rgba(155,92,255,0.2)",
        background: "rgba(155,92,255,0.04)",
        color: "rgba(207,255,255,0.4)",
      }}>
        <Globe className="w-3 h-3 inline mr-1" style={{ color: "#9B5CFF" }} />
        <strong style={{ color: "rgba(207,255,255,0.7)" }}>Як це працює:</strong>{" "}
        При натисканні кнопки ролі або розділу URL отримує параметр <code style={{ color: "#9B5CFF" }}>?_dev_tg=ID</code>,
        сторінка перезавантажується, і весь застосунок бачить цей ID як реальний Telegram ID юзера.
        В реальному Telegram цей параметр ігнорується — там використовується справжній TG ID.
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────
export default function VaultPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState<string>("");
  const [pass,  setPass]  = useState<string>("");
  const [pass2, setPass2] = useState<string>("");
  const [reveal, setReveal] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "creator">("creator");

  useEffect(() => { try { setToken(window.localStorage.getItem(TOK_KEY) || ""); } catch {} }, []);
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);
  const saveToken = (t: string) => { setToken(t); try { window.localStorage.setItem(TOK_KEY, t); } catch {} };
  const clearToken = () => { setToken(""); try { window.localStorage.removeItem(TOK_KEY); } catch {} };

  const { data: status } = useQuery<Status>({
    queryKey: ["/vault/status"],
    queryFn: () => fetch(api("/vault/status")).then(r => r.json()),
  });
  const { data: secretsData } = useQuery<{ keys: SecretRow[] }>({
    queryKey: ["/vault/secrets", token],
    queryFn: () => fetch(api("/vault/secrets"), { headers }).then(r => r.json()),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const init = useMutation({
    mutationFn: (p: string) => fetch(api("/vault/init"), { method: "POST", headers, body: JSON.stringify({ pass: p }) }).then(r => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); return; }
      saveToken(d.token);
      toast({ title: "✓ Майстер-пароль створено · Vault розблоковано" });
      setPass(""); setPass2("");
    },
  });
  const login = useMutation({
    mutationFn: (p: string) => fetch(api("/vault/login"), { method: "POST", headers, body: JSON.stringify({ pass: p }) }).then(r => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); return; }
      saveToken(d.token);
      toast({ title: "✓ Vault розблоковано · Creator режим доступний" });
      setPass("");
    },
  });

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [pasteValue,  setPasteValue]  = useState<string>("");
  const [detected,    setDetected]    = useState<Detected | null>(null);

  const selected = useMemo<SecretRow | undefined>(
    () => secretsData?.keys?.find((k) => k.key === selectedKey),
    [secretsData, selectedKey]
  );
  useEffect(() => {
    if (!selectedKey && secretsData?.keys?.length) {
      const first = secretsData.keys.find((k) => !k.configured) || secretsData.keys[0];
      setSelectedKey(first!.key);
    }
  }, [secretsData, selectedKey]);

  const detectMut = useMutation({
    mutationFn: (value: string) => fetch(api("/vault/detect"), { method: "POST", headers, body: JSON.stringify({ value }) }).then(r => r.json()),
    onSuccess: (d) => setDetected(d),
  });
  useEffect(() => {
    if (pasteValue.trim().length < 8) { setDetected(null); return; }
    const id = setTimeout(() => detectMut.mutate(pasteValue.trim()), 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteValue]);

  const setMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      fetch(api("/vault/set"), { method: "POST", headers, body: JSON.stringify({ key, value }) }).then(r => r.json()),
    onSuccess: (d, vars) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); return; }
      let msg = `✓ ${vars.key} збережено`;
      if (d.reload?.ok) msg += " · Telegram бот перезапущено";
      toast({ title: msg });
      setPasteValue(""); setDetected(null);
      qc.invalidateQueries({ queryKey: ["/vault/secrets"] });
    },
  });
  const removeMut = useMutation({
    mutationFn: (key: string) => fetch(api(`/vault/${key}`), { method: "DELETE", headers }).then(r => r.json()),
    onSuccess: (_d, key) => { toast({ title: `✓ ${key} видалено` }); qc.invalidateQueries({ queryKey: ["/vault/secrets"] }); },
  });

  // ─── NOT LOGGED IN ──────────────────────────────────────────────────
  if (!token) {
    const initialized = status?.initialized;
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{ background: "radial-gradient(ellipse at top, #0a1628, #060F1A)", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>
        <div className="w-full max-w-md p-6 rounded-lg border"
          style={{ borderColor: "rgba(0,255,255,0.3)", background: "rgba(6,15,26,0.95)", boxShadow: "0 0 60px rgba(0,255,255,0.15)" }}>
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: "#00FFFF", filter: "drop-shadow(0 0 12px #00FFFF)" }} />
            <h1 className="text-2xl font-bold tracking-widest"
              style={{ background: "linear-gradient(90deg, #00FFFF, #9B5CFF, #FF8C00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ◈ TITAN-94 VAULT
            </h1>
            <p className="text-[10px] tracking-widest mt-1" style={{ color: "rgba(0,255,255,0.5)" }}>
              CREATOR ACCESS · ZERO-TG · PASSPHRASE ONLY
            </p>
          </div>

          {status === undefined ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : initialized ? (
            <>
              <div className="mb-4 p-3 border text-[11px]" style={{ borderColor: "rgba(255,140,0,0.25)", background: "rgba(255,140,0,0.04)", color: "rgba(255,184,96,0.8)" }}>
                <Crown className="w-3 h-3 inline mr-1" />
                Vault = Creator панель. Введи пароль → повний доступ без Telegram.
              </div>
              <div className="relative mb-3">
                <input type={reveal ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)}
                  placeholder="Майстер-пароль..."
                  onKeyDown={(e) => { if (e.key === "Enter" && pass.length >= 6) login.mutate(pass); }}
                  className="w-full px-3 py-3 pr-10 text-base bg-black/40 border outline-none focus:border-cyan-400"
                  style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }}
                  autoFocus
                />
                <button onClick={() => setReveal(!reveal)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-400">
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={() => login.mutate(pass)} disabled={pass.length < 6 || login.isPending}
                className="w-full py-3 font-bold tracking-widest border transition-all disabled:opacity-30"
                style={{ borderColor: "#00FFFF", color: "#00FFFF", background: "rgba(0,255,255,0.08)" }}>
                {login.isPending
                  ? <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  : <><Unlock className="w-4 h-4 inline mr-2" />РОЗБЛОКУВАТИ</>}
              </button>
            </>
          ) : (
            <>
              <div className="border p-3 mb-4 text-[11px]" style={{ borderColor: "rgba(255,140,0,0.4)", background: "rgba(255,140,0,0.05)", color: "#FFB860" }}>
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Vault ще не ініціалізовано. Створи майстер-пароль (мінімум 6 символів) — він дасть доступ до Creator Panel без Telegram.
              </div>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="Створи пароль (мін 6 симв)..."
                className="w-full px-3 py-3 text-base bg-black/40 border outline-none focus:border-cyan-400 mb-2"
                style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }} />
              <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)}
                placeholder="Підтверди пароль..."
                onKeyDown={(e) => { if (e.key === "Enter" && pass.length >= 6 && pass === pass2) init.mutate(pass); }}
                className="w-full px-3 py-3 text-base bg-black/40 border outline-none focus:border-cyan-400 mb-3"
                style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }} />
              {pass2 && pass !== pass2 && <div className="text-[11px] text-red-400 mb-2">× Паролі не співпадають</div>}
              <button onClick={() => init.mutate(pass)} disabled={pass.length < 6 || pass !== pass2 || init.isPending}
                className="w-full py-3 font-bold tracking-widest border transition-all disabled:opacity-30"
                style={{ borderColor: "#9B5CFF", color: "#9B5CFF", background: "rgba(155,92,255,0.08)" }}>
                {init.isPending
                  ? <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  : <><KeyRound className="w-4 h-4 inline mr-2" />СТВОРИТИ VAULT + CREATOR ACCESS</>}
              </button>
            </>
          )}

          <div className="mt-6 text-center text-[10px]" style={{ color: "rgba(207,255,255,0.4)" }}>
            5 невдалих спроб → IP блокується на 5 хвилин<br />Token живе 7 днів у твоєму браузері
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGGED IN ──────────────────────────────────────────────────────
  const keys = secretsData?.keys || [];
  const configured = keys.filter((k) => k.configured).length;
  const grouped = GROUP_ORDER
    .map((g) => ({ g, items: keys.filter((k) => k.meta.group === g) }))
    .filter((x) => x.items.length > 0);

  const detectMismatch = !!(
    detected && detected.key && selectedKey &&
    detected.key !== selectedKey &&
    !detected.candidates.includes(selectedKey)
  );

  const TABS: { k: "creator" | "keys"; label: string; icon: typeof Crown; color: string }[] = [
    { k: "creator", label: "CREATOR PANEL", icon: Crown,    color: "#FF8C00" },
    { k: "keys",    label: "API КЛЮЧІ",     icon: KeyRound, color: "#00FFFF" },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="flex items-center gap-3">
          <Unlock className="w-4 h-4 shrink-0" style={{ color: "#00FFFF" }} />
          <div className="text-sm font-bold tracking-widest" style={{ color: "#00FFFF" }}>VAULT</div>
          <div className="text-[10px] hidden sm:block" style={{ color: "rgba(0,255,255,0.4)" }}>
            {configured}/{keys.length} API
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1">
          {TABS.map(({ k, label, icon: Icon, color }) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest border transition-all"
              style={{
                borderColor: activeTab === k ? color : "rgba(0,255,255,0.12)",
                color: activeTab === k ? color : "rgba(207,255,255,0.45)",
                background: activeTab === k ? `${color}0F` : "transparent",
              }}>
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <button onClick={clearToken} className="text-[10px] px-2 py-1.5 border"
          style={{ borderColor: "rgba(255,51,85,0.35)", color: "#FF7388" }}>
          <LogOut className="w-3 h-3 inline mr-1" />Вийти
        </button>
      </div>

      {/* BODY */}
      {activeTab === "creator" ? (
        <CreatorPanelTab />
      ) : (
        /* API KEYS TAB — original split view */
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* LEFT RAIL */}
          <aside className="md:w-72 lg:w-80 shrink-0 md:border-r overflow-y-auto"
            style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(0,255,255,0.02)" }}>
            {grouped.map(({ g, items }) => (
              <div key={g} className="py-2">
                <div className="px-4 py-1.5 text-[10px] tracking-widest sticky top-0 z-10"
                  style={{ color: GROUP_COLOR[g], background: "rgba(3,13,24,0.95)", borderBottom: "1px solid rgba(0,255,255,0.05)" }}>
                  ── {GROUP_LABELS[g]} ──
                </div>
                {items.map((k) => {
                  const active = k.key === selectedKey;
                  return (
                    <button key={k.key}
                      onClick={() => { setSelectedKey(k.key); setPasteValue(""); setDetected(null); }}
                      className="w-full text-left px-4 py-2.5 flex items-start gap-3 border-l-2 transition-all"
                      style={{
                        borderLeftColor: active ? GROUP_COLOR[g] : "transparent",
                        background: active ? "rgba(0,255,255,0.06)" : "transparent",
                      }}>
                      <span className="mt-0.5 text-base leading-none" style={{ color: k.configured ? "#00FF88" : "rgba(207,255,255,0.25)" }}>●</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5" style={{ color: active ? "#FFFFFF" : "#CFFFFF" }}>
                          {k.meta.name}
                          {k.meta.required && !k.configured && (
                            <span className="text-[8px] px-1 py-0 border border-red-400/40 text-red-400">REQ</span>
                          )}
                        </div>
                        <div className="text-[10px] truncate font-mono mt-0.5" style={{ color: k.configured ? "#00FF88" : "rgba(207,255,255,0.35)" }}>
                          {k.configured ? k.hint : "(порожнє)"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>

          {/* RIGHT PANE */}
          <main className="flex-1 flex flex-col min-h-0 border-t md:border-t-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-xs" style={{ color: "rgba(207,255,255,0.4)" }}>
                Обери API зі списку зліва
              </div>
            ) : (
              <>
                <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] tracking-widest mb-1" style={{ color: GROUP_COLOR[selected.meta.group] }}>
                        {GROUP_LABELS[selected.meta.group]} · {selected.meta.provider}
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2" style={{ color: "#FFFFFF" }}>
                        {selected.meta.name}
                        {selected.configured ? (
                          <span className="text-[10px] px-2 py-0.5 border border-green-400/40 text-green-400 rounded">ACTIVE</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 border border-amber-400/40 text-amber-400 rounded">EMPTY</span>
                        )}
                      </h2>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(207,255,255,0.7)" }}>
                        {selected.meta.description}
                      </p>
                    </div>
                    <a href={selected.meta.getUrl} target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-1 px-3 py-2 border hover:bg-cyan-400/10 shrink-0"
                      style={{ borderColor: "rgba(0,255,255,0.4)", color: "#00FFFF" }}>
                      Отримати ключ <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {selected.configured && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px]">
                      <span style={{ color: "rgba(207,255,255,0.5)" }}>Поточне значення:</span>
                      <code className="px-2 py-1 bg-black/40 border font-mono" style={{ borderColor: "rgba(0,255,136,0.3)", color: "#00FF88" }}>
                        {selected.hint}
                      </code>
                      <span className="text-[10px] px-1.5 py-0.5 border" style={{ borderColor: "rgba(207,255,255,0.2)", color: "rgba(207,255,255,0.5)" }}>
                        {selected.source}
                      </span>
                      <button onClick={() => { if (confirm(`Видалити ${selected.meta.name}?`)) removeMut.mutate(selected.key); }}
                        className="ml-auto text-[11px] text-red-400 hover:underline">
                        <Trash2 className="w-3 h-3 inline mr-0.5" />Видалити
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                  <label className="text-[11px] tracking-widest flex items-center gap-2 mb-2" style={{ color: "rgba(0,255,255,0.7)" }}>
                    <Sparkles className="w-3 h-3" /> ВСТАВ КЛЮЧ ДЛЯ <span style={{ color: "#FFFFFF" }}>{selected.key}</span>
                  </label>
                  <textarea
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    placeholder={`Просто встав сюди значення для ${selected.meta.name}, або будь-який інший ключ — система розпізнає тип і запропонує переключитись...`}
                    rows={6}
                    className="w-full px-4 py-3 text-sm bg-black/40 border outline-none focus:border-cyan-400 font-mono"
                    style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }}
                  />
                  {detected && pasteValue.trim() && (
                    <div className="mt-3 p-3 border text-xs"
                      style={{
                        borderColor: detectMismatch ? "#FFB860" : detected.confidence === "high" ? "#00FF88" : "rgba(207,255,255,0.2)",
                        background:  detectMismatch ? "rgba(255,184,96,0.06)" : detected.confidence === "high" ? "rgba(0,255,136,0.05)" : "rgba(207,255,255,0.02)",
                      }}>
                      {detectMismatch ? (
                        <>
                          <AlertCircle className="w-3 h-3 inline mr-1 text-amber-400" />
                          Цей ключ більше схожий на <strong>{getKeyName(keys, detected.key!)}</strong> ({detected.confidence}).{" "}
                          <button onClick={() => setSelectedKey(detected.key!)} className="underline text-cyan-400 hover:text-cyan-300 ml-1">
                            Переключитись?
                          </button>
                        </>
                      ) : detected.key ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-400" />
                          Розпізнано формат: <strong>{getKeyName(keys, detected.key)}</strong> ({detected.confidence})
                          {detected.candidates.length > 1 && (
                            <span className="ml-2" style={{ color: "rgba(207,255,255,0.5)" }}>
                              альтернативи: {detected.candidates.filter((c) => c !== detected.key).map((c) => getKeyName(keys, c)).join(", ")}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "rgba(207,255,255,0.5)" }}>
                          Формат не визначено — все одно можеш зберегти як {selected.meta.name}.
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => setMut.mutate({ key: selectedKey, value: pasteValue.trim() })}
                      disabled={!pasteValue.trim() || setMut.isPending}
                      className="px-5 py-3 font-bold tracking-widest border transition-all disabled:opacity-30"
                      style={{ borderColor: "#00FF88", color: "#00FF88", background: "rgba(0,255,136,0.08)" }}>
                      {setMut.isPending ? <Loader2 className="w-4 h-4 inline animate-spin" /> : <><Save className="w-4 h-4 inline mr-2" />ЗБЕРЕГТИ</>}
                    </button>
                    {detectMismatch && detected?.key && (
                      <button
                        onClick={() => setMut.mutate({ key: detected.key!, value: pasteValue.trim() })}
                        disabled={setMut.isPending}
                        className="px-5 py-3 font-bold tracking-widest border"
                        style={{ borderColor: "#FFB860", color: "#FFB860", background: "rgba(255,184,96,0.08)" }}>
                        <Send className="w-4 h-4 inline mr-2" />ЗБЕРЕГТИ В {detected.key}
                      </button>
                    )}
                    <span className="text-[10px] ml-auto" style={{ color: "rgba(207,255,255,0.4)" }}>
                      Enter не зберігає · клавіша SAVE
                    </span>
                  </div>
                  <div className="mt-6 text-[10px] leading-relaxed" style={{ color: "rgba(207,255,255,0.35)" }}>
                    <p>Ключ зберігається в <code>.titan-secrets.json</code> на сервері організму.</p>
                    <p>Ніколи не показується в логах · Ніколи не передається третім сторонам.</p>
                    {selectedKey === "TELEGRAM_BOT_TOKEN" && (
                      <p className="mt-1 text-amber-400">При збереженні Telegram бот автоматично перезапуститься.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function getKeyName(keys: SecretRow[], key: string): string {
  return keys.find((k) => k.key === key)?.meta.name || key;
}
