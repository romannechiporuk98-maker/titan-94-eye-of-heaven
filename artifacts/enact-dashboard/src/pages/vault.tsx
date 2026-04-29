/**
 * VAULT — passphrase-protected secret manager (split-view chat-style).
 *
 *   ┌──────────────┬─────────────────────────────────────┐
 *   │ API list     │  Selected key context              │
 *   │ (left rail)  │  - description + GET link          │
 *   │ click to     │  - paste textarea                  │
 *   │ activate     │  - auto-detect mismatch warning    │
 *   │              │  - SAVE button                     │
 *   └──────────────┴─────────────────────────────────────┘
 *
 * URL: /vault     (works without Telegram — passphrase only)
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, Unlock, KeyRound, Save, Trash2, Loader2,
  ExternalLink, AlertCircle, CheckCircle2, Eye, EyeOff, LogOut,
  Send, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const TOK_KEY = "titan94.vault.token";

type Status   = { initialized: boolean };
type Detected = { key: string | null; confidence: "high" | "medium" | "low"; candidates: string[] };
type SecretRow = { key: string; configured: boolean; source: string; hint: string; meta: { name: string; description: string; provider: string; getUrl: string; required: boolean; group: string; } };

const GROUP_ORDER = ["telegram", "ton", "ai", "trading", "social"];
const GROUP_LABELS: Record<string, string> = {
  telegram: "TELEGRAM",
  ton:      "TON BLOCKCHAIN",
  ai:       "AI ORCHESTRA",
  trading:  "TRADING (BINANCE)",
  social:   "SOCIAL POSTING",
};
const GROUP_COLOR: Record<string, string> = {
  telegram: "#00B5FF",
  ton:      "#0098EA",
  ai:       "#9B5CFF",
  trading:  "#FFB860",
  social:   "#FF66B3",
};

export default function VaultPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState<string>("");
  const [pass,  setPass]  = useState<string>("");
  const [pass2, setPass2] = useState<string>("");
  const [reveal, setReveal] = useState(false);

  useEffect(() => { try { setToken(window.localStorage.getItem(TOK_KEY) || ""); } catch {} }, []);
  const headers = useMemo(() => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  const saveToken = (t: string) => { setToken(t); try { window.localStorage.setItem(TOK_KEY, t); } catch {} };
  const clearToken = () => { setToken(""); try { window.localStorage.removeItem(TOK_KEY); } catch {} };

  // 1. Vault status
  const { data: status } = useQuery<Status>({
    queryKey: ["/vault/status"],
    queryFn: () => fetch(api("/vault/status")).then(r => r.json()),
  });

  // 2. Secrets list (when logged in)
  const { data: secretsData } = useQuery<{ keys: SecretRow[] }>({
    queryKey: ["/vault/secrets", token],
    queryFn: () => fetch(api("/vault/secrets"), { headers }).then(r => r.json()),
    enabled: !!token,
    refetchInterval: 15000,
  });

  // 3. Login / Init
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
      toast({ title: "✓ Vault розблоковано" });
      setPass("");
    },
  });

  // 4. Selected key + paste state
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [pasteValue,  setPasteValue]  = useState<string>("");
  const [detected,    setDetected]    = useState<Detected | null>(null);

  const selected = useMemo<SecretRow | undefined>(
    () => secretsData?.keys?.find((k) => k.key === selectedKey),
    [secretsData, selectedKey]
  );

  // Auto-select first non-configured key on first load
  useEffect(() => {
    if (!selectedKey && secretsData?.keys?.length) {
      const first = secretsData.keys.find((k) => !k.configured) || secretsData.keys[0];
      setSelectedKey(first!.key);
    }
  }, [secretsData, selectedKey]);

  // Detect on paste change
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

  // ─── UI: not logged in ─────────────────────────────────────────────
  if (!token) {
    const initialized = status?.initialized;
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "radial-gradient(ellipse at top, #0a1628, #060F1A)", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>
        <div className="w-full max-w-md p-6 rounded-lg border" style={{ borderColor: "rgba(0,255,255,0.3)", background: "rgba(6,15,26,0.95)", boxShadow: "0 0 60px rgba(0,255,255,0.15)" }}>
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: "#00FFFF", filter: "drop-shadow(0 0 12px #00FFFF)" }} />
            <h1 className="text-2xl font-bold tracking-widest" style={{ background: "linear-gradient(90deg, #00FFFF, #9B5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ◈ TITAN-94 VAULT
            </h1>
            <p className="text-[10px] tracking-widest mt-1" style={{ color: "rgba(0,255,255,0.5)" }}>
              MOBILE · PASSPHRASE · ZERO-TG
            </p>
          </div>

          {status === undefined ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : initialized ? (
            <>
              <p className="text-xs text-center mb-4" style={{ color: "rgba(207,255,255,0.7)" }}>
                Введи майстер-пароль щоб керувати API ключами організму.
              </p>
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
                {login.isPending ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <><Unlock className="w-4 h-4 inline mr-2" />РОЗБЛОКУВАТИ</>}
              </button>
            </>
          ) : (
            <>
              <div className="border p-3 mb-4 text-[11px]" style={{ borderColor: "rgba(255,140,0,0.4)", background: "rgba(255,140,0,0.05)", color: "#FFB860" }}>
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Vault ще не ініціалізовано. Створи майстер-пароль (мінімум 6 символів) — він стане єдиним способом зайти з мобільного без Telegram.
              </div>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Створи пароль (мін 6 симв)..."
                className="w-full px-3 py-3 text-base bg-black/40 border outline-none focus:border-cyan-400 mb-2"
                style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }} />
              <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Підтверди пароль..."
                onKeyDown={(e) => { if (e.key === "Enter" && pass.length >= 6 && pass === pass2) init.mutate(pass); }}
                className="w-full px-3 py-3 text-base bg-black/40 border outline-none focus:border-cyan-400 mb-3"
                style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }} />
              {pass2 && pass !== pass2 && <div className="text-[11px] text-red-400 mb-2">× Паролі не співпадають</div>}
              <button onClick={() => init.mutate(pass)} disabled={pass.length < 6 || pass !== pass2 || init.isPending}
                className="w-full py-3 font-bold tracking-widest border transition-all disabled:opacity-30"
                style={{ borderColor: "#9B5CFF", color: "#9B5CFF", background: "rgba(155,92,255,0.08)" }}>
                {init.isPending ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <><KeyRound className="w-4 h-4 inline mr-2" />СТВОРИТИ VAULT</>}
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

  // ─── UI: logged in — split view ────────────────────────────────────
  const keys = secretsData?.keys || [];
  const configured = keys.filter((k) => k.configured).length;
  const grouped = GROUP_ORDER.map((g) => ({ g, items: keys.filter((k) => k.meta.group === g) })).filter((x) => x.items.length > 0);

  // Detect mismatch: pasted value matches a different key than the one selected
  const detectMismatch = !!(detected && detected.key && selectedKey && detected.key !== selectedKey
    && !detected.candidates.includes(selectedKey));

  return (
    <div className="h-screen flex flex-col" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        <div className="flex items-center gap-3">
          <Unlock className="w-5 h-5" style={{ color: "#00FFFF" }} />
          <div>
            <div className="text-base sm:text-lg font-bold tracking-widest" style={{ color: "#00FFFF" }}>VAULT</div>
            <div className="text-[10px] tracking-widest" style={{ color: "rgba(0,255,255,0.5)" }}>{configured}/{keys.length} активовано</div>
          </div>
        </div>
        <button onClick={clearToken} className="text-xs px-3 py-2 border" style={{ borderColor: "rgba(255,51,85,0.4)", color: "#FF7388" }}>
          <LogOut className="w-3 h-3 inline mr-1" />Вийти
        </button>
      </div>

      {/* SPLIT BODY */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* LEFT RAIL — list of APIs */}
        <aside className="md:w-72 lg:w-80 shrink-0 md:border-r overflow-y-auto" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(0,255,255,0.02)" }}>
          {grouped.map(({ g, items }) => (
            <div key={g} className="py-2">
              <div className="px-4 py-1.5 text-[10px] tracking-widest sticky top-0 z-10"
                style={{ color: GROUP_COLOR[g], background: "rgba(3,13,24,0.95)", borderBottom: "1px solid rgba(0,255,255,0.05)" }}>
                ── {GROUP_LABELS[g]} ──
              </div>
              {items.map((k) => {
                const active = k.key === selectedKey;
                return (
                  <button key={k.key} onClick={() => { setSelectedKey(k.key); setPasteValue(""); setDetected(null); }}
                    className="w-full text-left px-4 py-2.5 flex items-start gap-3 border-l-2 transition-all"
                    style={{
                      borderLeftColor: active ? GROUP_COLOR[g] : "transparent",
                      background: active ? "rgba(0,255,255,0.06)" : "transparent",
                    }}>
                    <span className="mt-0.5 text-base leading-none" style={{ color: k.configured ? "#00FF88" : "rgba(207,255,255,0.25)" }}>●</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5" style={{ color: active ? "#FFFFFF" : "#CFFFFF" }}>
                        {k.meta.name}
                        {k.meta.required && !k.configured && <span className="text-[8px] px-1 py-0 border border-red-400/40 text-red-400">REQ</span>}
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

        {/* RIGHT PANE — selected key context */}
        <main className="flex-1 flex flex-col min-h-0 border-t md:border-t-0" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-xs" style={{ color: "rgba(207,255,255,0.4)" }}>
              Обери API зі списку зліва
            </div>
          ) : (
            <>
              {/* Context header */}
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

              {/* Paste area — chat-style */}
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

                {/* Auto-detect feedback */}
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

                {/* SAVE button */}
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
                  {selectedKey === "TELEGRAM_BOT_TOKEN" && <p className="mt-1 text-amber-400">При збереженні Telegram бот автоматично перезапуститься.</p>}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function getKeyName(keys: SecretRow[], key: string): string {
  return keys.find((k) => k.key === key)?.meta.name || key;
}
