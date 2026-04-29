/**
 * VAULT — mobile-first passphrase-protected secret manager.
 * Works WITHOUT Telegram — anyone with the master passphrase can manage all keys.
 * Auto-detects the type of pasted API key.
 *
 * URL: /vault
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, Unlock, KeyRound, Sparkles, Save, Trash2, Loader2,
  ExternalLink, AlertCircle, CheckCircle2, Eye, EyeOff, LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const TOK_KEY = "titan94.vault.token";

type Status   = { initialized: boolean };
type Detected = { key: string | null; confidence: "high" | "medium" | "low"; candidates: string[] };

const GROUP_LABELS: Record<string, string> = {
  telegram: "TELEGRAM",
  ton:      "TON BLOCKCHAIN",
  ai:       "AI ORCHESTRA",
  trading:  "TRADING (BINANCE)",
  social:   "SOCIAL POSTING",
};

export default function VaultPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState<string>("");
  const [pass,  setPass]  = useState<string>("");
  const [pass2, setPass2] = useState<string>("");
  const [pasted, setPasted] = useState<string>("");
  const [reveal, setReveal] = useState(false);

  useEffect(() => { try { setToken(window.localStorage.getItem(TOK_KEY) || ""); } catch {} }, []);
  const headers = useMemo(() => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  const saveToken = (t: string) => { setToken(t); try { window.localStorage.setItem(TOK_KEY, t); } catch {} };
  const clearToken = () => { setToken(""); try { window.localStorage.removeItem(TOK_KEY); } catch {} };

  // 1. Vault initialization status
  const { data: status } = useQuery<Status>({
    queryKey: ["/vault/status"],
    queryFn: () => fetch(api("/vault/status")).then(r => r.json()),
    refetchInterval: false,
  });

  // 2. Secrets list (only if logged in)
  const { data: secretsData } = useQuery<{ keys: any[] }>({
    queryKey: ["/vault/secrets", token],
    queryFn: () => fetch(api("/vault/secrets"), { headers }).then(r => r.json()),
    enabled: !!token,
    refetchInterval: 15000,
  });

  // 3. Login / Init mutations
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

  // 4. Auto-detect + save
  const [detected, setDetected] = useState<Detected | null>(null);
  const [chosenKey, setChosenKey] = useState<string>("");
  const detect = useMutation({
    mutationFn: (value: string) => fetch(api("/vault/detect"), { method: "POST", headers, body: JSON.stringify({ value }) }).then(r => r.json()),
    onSuccess: (d) => { setDetected(d); if (d.key) setChosenKey(d.key); },
  });
  const setKey = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      fetch(api("/vault/set"), { method: "POST", headers, body: JSON.stringify({ key, value }) }).then(r => r.json()),
    onSuccess: (d, vars) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); return; }
      let msg = `✓ ${vars.key} збережено`;
      if (d.reload?.ok) msg += " · Telegram бот перезапущено";
      toast({ title: msg });
      setPasted(""); setDetected(null); setChosenKey("");
      qc.invalidateQueries({ queryKey: ["/vault/secrets"] });
    },
  });
  const remove = useMutation({
    mutationFn: (key: string) => fetch(api(`/vault/${key}`), { method: "DELETE", headers }).then(r => r.json()),
    onSuccess: (_d, key) => { toast({ title: `✓ ${key} видалено` }); qc.invalidateQueries({ queryKey: ["/vault/secrets"] }); },
  });

  // ─── UI: not logged in ────────────────────────────────────────
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

  // ─── UI: logged in ────────────────────────────────────────────
  const keys = secretsData?.keys || [];
  const groups = ["telegram", "ton", "ai", "trading", "social"];
  const configured = keys.filter((k: any) => k.configured).length;

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6" style={{ background: "#030D18", color: "#CFFFFF", fontFamily: "'Space Mono', monospace" }}>
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-widest" style={{ color: "#00FFFF" }}>
              <Unlock className="inline w-5 h-5 mr-2" />VAULT
            </h1>
            <div className="text-[10px] tracking-widest mt-0.5" style={{ color: "rgba(0,255,255,0.5)" }}>
              {configured}/{keys.length} активовано
            </div>
          </div>
          <button onClick={clearToken} className="text-xs px-3 py-2 border" style={{ borderColor: "rgba(255,51,85,0.4)", color: "#FF7388" }}>
            <LogOut className="w-3 h-3 inline mr-1" />Вийти
          </button>
        </div>

        {/* PASTE BOX — main UX */}
        <div className="border p-4 mb-4 rounded" style={{ borderColor: "rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.04)" }}>
          <div className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: "#00FFFF" }}>
            <Sparkles className="w-4 h-4" /> ВСТАВ КЛЮЧ — Я САМ ЗРОЗУМІЮ КУДИ
          </div>
          <textarea
            value={pasted}
            onChange={(e) => { setPasted(e.target.value); if (e.target.value.length > 10) detect.mutate(e.target.value); else setDetected(null); }}
            placeholder="Просто встав сюди будь-який API ключ (OpenAI, Claude, Binance, Telegram, Gemini...) — система розпізнає тип і запропонує куди зберегти"
            rows={3}
            className="w-full px-3 py-2 text-sm bg-black/40 border outline-none focus:border-cyan-400 font-mono"
            style={{ borderColor: "rgba(0,255,255,0.3)", color: "#CFFFFF" }}
          />
          {detected && (
            <div className="mt-3 p-3 border" style={{ borderColor: detected.confidence === "high" ? "#00FF88" : "#FF8C00", background: detected.confidence === "high" ? "rgba(0,255,136,0.05)" : "rgba(255,140,0,0.05)" }}>
              {detected.key ? (
                <>
                  <div className="text-[11px] mb-2">
                    {detected.confidence === "high" ? <CheckCircle2 className="w-3 h-3 inline mr-1 text-safe" /> : <AlertCircle className="w-3 h-3 inline mr-1 text-amber" />}
                    Розпізнано як: <span className="font-bold">{getMeta(keys, detected.key)?.name || detected.key}</span>
                    <span className="text-muted ml-2">({detected.confidence})</span>
                  </div>
                  {detected.candidates.length > 1 && (
                    <select value={chosenKey} onChange={(e) => setChosenKey(e.target.value)} className="w-full mb-2 px-2 py-1.5 text-xs bg-black/40 border" style={{ borderColor: "rgba(0,255,255,0.2)", color: "#CFFFFF" }}>
                      {detected.candidates.map((k: string) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  )}
                  <button onClick={() => setKey.mutate({ key: chosenKey || detected.key!, value: pasted })}
                    disabled={setKey.isPending}
                    className="w-full py-2 text-xs font-bold border" style={{ borderColor: "#00FF88", color: "#00FF88", background: "rgba(0,255,136,0.08)" }}>
                    {setKey.isPending ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : <><Save className="w-3 h-3 inline mr-1" />ЗБЕРЕГТИ В {chosenKey || detected.key}</>}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[11px] mb-2 text-amber">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Не зміг розпізнати тип ключа. Вибери вручну:
                  </div>
                  <select value={chosenKey} onChange={(e) => setChosenKey(e.target.value)} className="w-full mb-2 px-2 py-1.5 text-xs bg-black/40 border" style={{ borderColor: "rgba(0,255,255,0.2)", color: "#CFFFFF" }}>
                    <option value="">— оберіть ключ —</option>
                    {keys.map((k: any) => <option key={k.key} value={k.key}>{k.meta.name}</option>)}
                  </select>
                  <button onClick={() => chosenKey && setKey.mutate({ key: chosenKey, value: pasted })}
                    disabled={!chosenKey || setKey.isPending}
                    className="w-full py-2 text-xs font-bold border disabled:opacity-30" style={{ borderColor: "#9B5CFF", color: "#9B5CFF", background: "rgba(155,92,255,0.08)" }}>
                    <Save className="w-3 h-3 inline mr-1" />ЗБЕРЕГТИ ВРУЧНУ
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* GROUPED KEY LIST */}
        {groups.map((g) => {
          const groupKeys = keys.filter((k: any) => k.meta.group === g);
          if (groupKeys.length === 0) return null;
          return (
            <div key={g} className="mb-4">
              <div className="text-[10px] tracking-widest mb-2 px-1" style={{ color: "rgba(0,255,255,0.5)" }}>
                ── {GROUP_LABELS[g]} ──
              </div>
              <div className="space-y-2">
                {groupKeys.map((k: any) => (
                  <div key={k.key} className="border p-3 rounded" style={{ borderColor: k.configured ? "rgba(0,255,136,0.3)" : "rgba(207,255,255,0.15)", background: k.configured ? "rgba(0,255,136,0.04)" : "rgba(207,255,255,0.02)" }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span style={{ color: k.configured ? "#00FF88" : "rgba(207,255,255,0.4)" }}>●</span>
                          <span className="truncate">{k.meta.name}</span>
                          {k.meta.required && <span className="text-[9px] px-1.5 py-0.5 border border-red-400/40 text-red-400">REQUIRED</span>}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "rgba(207,255,255,0.5)" }}>
                          {k.meta.description}
                        </div>
                        <div className="text-[10px] mt-1 font-mono" style={{ color: k.configured ? "#00FF88" : "rgba(207,255,255,0.3)" }}>
                          {k.hint} {k.configured && `· ${k.source}`}
                        </div>
                      </div>
                      <a href={k.meta.getUrl} target="_blank" rel="noreferrer"
                        className="text-[10px] flex items-center gap-0.5 text-cyan-400 hover:underline shrink-0 px-2 py-1 border border-cyan-400/30">
                        Get <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    {k.configured && (
                      <button onClick={() => { if (confirm(`Видалити ${k.meta.name}?`)) remove.mutate(k.key); }}
                        className="text-[10px] text-red-400 hover:underline mt-1">
                        <Trash2 className="w-2.5 h-2.5 inline mr-0.5" />Видалити
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="text-[10px] text-center mt-6 pb-6" style={{ color: "rgba(207,255,255,0.3)" }}>
          Ключі шифруються в .titan-secrets.json · НЕ показуються в логах · НЕ передаються наружу
        </div>
      </div>
    </div>
  );
}

function getMeta(keys: any[], k: string): any {
  return keys.find((x) => x.key === k)?.meta;
}
