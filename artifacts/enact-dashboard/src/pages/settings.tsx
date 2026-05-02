import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Key, ShieldCheck, ShieldAlert, ExternalLink, Eye, EyeOff,
  Save, Trash2, Loader2, CheckCircle2, AlertCircle, Lock, Settings as SettingsIcon,
  TrendingUp, Wallet, Zap, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTgUser, haptic } from "@/lib/telegram";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const CREATOR_ID = "7255058720";

export default function SettingsPage() {
  const tg = useMemo(() => getTgUser(), []);
  const isCreator = String(tg.id) === CREATOR_ID;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts]     = useState<Record<string, string>>({});

  const headers = { "x-telegram-id": String(tg.id), "Content-Type": "application/json" };

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/secrets/status"],
    queryFn: () => fetch(api("/secrets/status"), { headers }).then(r => r.json()),
    enabled: isCreator,
    refetchInterval: 15000,
  });

  const setKey = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      fetch(api("/secrets/set"), { method: "POST", headers, body: JSON.stringify({ key, value }) }).then(r => r.json()),
    onSuccess: (d, vars) => {
      if (d.error) { toast({ title: "× " + d.error, variant: "destructive" }); haptic("error"); return; }
      let msg = `✓ ${vars.key} ${d.configured ? "збережено" : "видалено"}`;
      if (d.reload?.ok) msg += " · бот перезапущено";
      else if (d.reload?.reason) msg += " · бот: " + d.reload.reason;
      toast({ title: msg }); haptic("success");
      setDrafts((p) => ({ ...p, [vars.key]: "" }));
      qc.invalidateQueries();
    },
  });
  const removeKey = useMutation({
    mutationFn: (key: string) => fetch(api(`/secrets/${key}`), { method: "DELETE", headers }).then(r => r.json()),
    onSuccess: (_d, key) => { toast({ title: `✓ ${key} видалено` }); haptic("warning"); qc.invalidateQueries(); },
  });

  if (!isCreator) {
    return (
      <div className="titan-page">
        <div className="titan-card text-center py-16">
          <Lock className="w-12 h-12 text-amber mx-auto mb-3" />
          <h2 className="text-xl font-bold text-amber mb-2">DOORS LOCKED</h2>
          <p className="text-muted text-xs">Settings доступні тільки творцю TITAN-94 (TG ID: {CREATOR_ID}).<br/>Твій ID: {tg.id}</p>
        </div>
      </div>
    );
  }

  const keys: any[] = data?.keys || [];
  const configured = keys.filter((k) => k.configured).length;
  const required = keys.filter((k) => k.meta?.required && !k.configured).length;

  return (
    <div className="titan-page titan-grid-bg">
      {/* HERO */}
      <div className="relative overflow-hidden p-5 mb-5 rounded-lg" style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.08), rgba(155,92,255,0.08))",
        border: "1px solid rgba(0,255,255,0.3)",
      }}>
        <div className="absolute top-0 right-0 opacity-10"><Key className="w-48 h-48 text-primary" /></div>
        <div className="relative">
          <div className="text-[10px] tracking-[0.4em] text-primary/70 mb-1">CREATOR PANEL · API KEYS VAULT</div>
          <h1 className="text-3xl font-bold" style={{
            background: "linear-gradient(90deg, #00FFFF, #9B5CFF, #FF8C00)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>◈ SECRETS · COMMAND VAULT</h1>
          <p className="text-xs text-muted mt-1">Усі API-ключі в одному місці. Зміни — миттєві: бот перезапускається автоматично.</p>
          <div className="flex gap-3 mt-3 text-xs">
            <span className="text-safe"><CheckCircle2 className="inline w-3 h-3 mr-1" />{configured}/{keys.length} активовано</span>
            {required > 0 && <span className="text-red-400"><AlertCircle className="inline w-3 h-3 mr-1" />{required} критичних відсутні</span>}
          </div>
        </div>
      </div>

      {isLoading && <div className="titan-card text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}
      {error    && <div className="titan-card text-red-400">Помилка завантаження: {String(error)}</div>}

      <div className="grid gap-3">
        {keys.map((k) => {
          const draft = drafts[k.key] ?? "";
          const isRevealed = revealed[k.key];
          return (
            <div key={k.key} className="titan-live-card p-4" style={{
              borderColor: k.configured ? "rgba(0,255,136,0.4)" : k.meta?.required ? "rgba(255,51,85,0.4)" : "rgba(0,255,255,0.18)",
            }}>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {k.configured
                      ? <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
                      : <ShieldAlert className={`w-4 h-4 shrink-0 ${k.meta?.required ? "text-red-400" : "text-muted"}`} />}
                    <h3 className="font-bold text-sm">{k.meta.name}</h3>
                    <code className="text-[10px] text-amber bg-amber/10 px-1.5 py-0.5 rounded">{k.key}</code>
                    {k.meta.required && !k.configured && <span className="text-[9px] text-red-400 uppercase">required</span>}
                    {k.configured && <span className="text-[9px] text-safe uppercase">{k.source === "override" ? "ui-override" : "env"}</span>}
                  </div>
                  <p className="text-[11px] text-muted mt-1">{k.meta.description}</p>
                  <div className="text-[10px] text-muted mt-1">
                    Provider: <span className="text-foreground">{k.meta.provider}</span> ·{" "}
                    <a href={k.meta.getUrl} target="_blank" rel="noopener" className="text-primary inline-flex items-center gap-0.5">
                      Get key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                {k.configured && (
                  <div className="text-right text-[10px] text-muted whitespace-nowrap">
                    <div>{isRevealed ? <span className="text-safe font-mono">{k.hint}</span> : <span className="font-mono">••••••••••••</span>}</div>
                    <button onClick={() => setRevealed((p) => ({ ...p, [k.key]: !p[k.key] }))} className="text-primary text-[10px] inline-flex items-center gap-1 mt-0.5">
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {isRevealed ? "hide" : "show hint"}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type={isRevealed ? "text" : "password"}
                  className="titan-input flex-1 text-xs font-mono"
                  placeholder={k.configured ? "Введи новий ключ щоб замінити..." : `Встав ${k.meta.name}...`}
                  value={draft}
                  onChange={(e) => setDrafts((p) => ({ ...p, [k.key]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setKey.mutate({ key: k.key, value: draft })}
                  disabled={!draft.trim() || setKey.isPending}
                  className="titan-btn titan-btn-amber"
                >
                  {setKey.isPending && setKey.variables?.key === k.key
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <><Save className="w-3 h-3 mr-1" /> Save</>}
                </button>
                {k.configured && (
                  <button
                    type="button"
                    onClick={() => { if (confirm(`Видалити ${k.key}?`)) removeKey.mutate(k.key); }}
                    className="titan-btn titan-btn-danger"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BINANCE CONNECTION STATUS */}
      <BinancePanel headers={headers} isCreator={isCreator} />

      <div className="titan-card mt-5 text-xs text-muted" style={{ borderColor: "rgba(0,255,255,0.2)" }}>
        <div className="flex gap-2 items-start">
          <SettingsIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-primary">Як це працює:</strong> ключі зберігаються локально в <code>.titan-secrets.json</code>, а не в process env. Override має пріоритет над env-змінними. Telegram бот рестартується автоматично коли його токен змінюється — без перезапуску сервера. Інші ключі (Gemini, Claude, GPT) застосовуються одразу при наступному запиті.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BINANCE CONNECTION PANEL ────────────────────────────────────────────────
function BinancePanel({ headers, isCreator }: { headers: Record<string, string>; isCreator: boolean }) {
  const { data: status, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["/binance/status"],
    queryFn: () => fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api/binance/status`, { headers }).then(r => r.json()),
    enabled: isCreator,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { data: prices } = useQuery<any>({
    queryKey: ["/binance/prices"],
    queryFn: () => fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api/binance/prices`).then(r => r.json()),
    refetchInterval: 30_000,
    enabled: isCreator,
  });
  const { data: balance, refetch: refetchBal, isFetching: balFetching } = useQuery<any>({
    queryKey: ["/binance/balance"],
    queryFn: () => fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api/binance/balance`, { headers }).then(r => r.json()),
    enabled: isCreator && !!status?.ok,
    staleTime: 60_000,
  });

  if (!isCreator) return null;

  const p = prices?.prices || {};

  return (
    <div className="titan-live-card p-4 mt-5" style={{
      borderColor: status?.ok ? "rgba(0,255,136,0.4)" : "rgba(255,140,0,0.3)",
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber" />
          <span className="font-bold text-amber">BINANCE CONNECTION</span>
          {status?.ok
            ? <span className="text-[10px] text-safe border border-safe/40 px-1.5 py-0.5">● ONLINE</span>
            : <span className="text-[10px] text-amber border border-amber/40 px-1.5 py-0.5">○ {status?.configured ? "ERROR" : "NOT CONFIGURED"}</span>}
        </div>
        <button onClick={() => { refetch(); refetchBal(); }} disabled={isFetching}
          className="titan-btn titan-btn-sm text-[10px]">
          {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </button>
      </div>

      {isLoading && <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>}

      {!isLoading && !status?.configured && (
        <div className="text-xs text-muted p-3 border border-amber/20 bg-amber/5">
          Додай <code className="text-amber">BINANCE_API_KEY</code> та <code className="text-amber">BINANCE_API_SECRET</code> вище, щоб активувати Binance трейдинг.
        </div>
      )}

      {status?.configured && (
        <>
          {/* Ping info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
              <div className="text-[10px] text-muted">LATENCY</div>
              <div className="text-lg font-bold text-safe">{status?.latencyMs ? `${status.latencyMs}ms` : "—"}</div>
            </div>
            <div className="text-center p-2 border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
              <div className="text-[10px] text-muted">STATUS</div>
              <div className={`text-lg font-bold ${status?.ok ? "text-safe" : "text-red-400"}`}>{status?.ok ? "OK" : "FAIL"}</div>
            </div>
          </div>

          {status?.error && (
            <div className="text-xs text-red-400 p-2 border border-red-400/30 bg-red-400/5 mb-4">{status.error}</div>
          )}

          {/* Live prices */}
          <div className="mb-4">
            <div className="text-[10px] text-muted tracking-widest mb-2">LIVE PRICES · BINANCE CEX</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { sym: "TONUSDT", label: "TON", col: "#00FFFF" },
                { sym: "BTCUSDT", label: "BTC", col: "#FF8C00" },
                { sym: "ETHUSDT", label: "ETH", col: "#9B5CFF" },
                { sym: "BNBUSDT", label: "BNB", col: "#FFD43A" },
              ].map(({ sym, label, col }) => (
                <div key={sym} className="text-center p-2 border" style={{ borderColor: col + "33" }}>
                  <div className="text-[10px] font-bold" style={{ color: col }}>{label}</div>
                  <div className="text-sm font-mono mt-0.5" style={{ color: col }}>
                    {p[sym] ? `$${p[sym].toFixed(sym === "TONUSDT" ? 4 : 0)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account balance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-muted tracking-widest flex items-center gap-1">
                <Wallet className="w-3 h-3" /> SPOT ACCOUNT BALANCE
              </div>
              {balFetching && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
            </div>
            {balance?.ok && balance.balances?.length > 0 ? (
              <div className="space-y-1.5">
                {balance.balances.slice(0, 8).map((b: any) => (
                  <div key={b.asset} className="flex justify-between text-xs p-2 border" style={{ borderColor: "rgba(0,255,255,0.12)" }}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber" />
                      <span className="font-bold text-amber">{b.asset}</span>
                      {parseFloat(b.locked) > 0 && <span className="text-[9px] text-muted">({parseFloat(b.locked).toFixed(4)} locked)</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-safe">{parseFloat(b.free).toFixed(4)}</span>
                      {b.usdtValue > 0 && <span className="text-[10px] text-muted ml-1">≈${b.usdtValue.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : balance?.ok && balance.balances?.length === 0 ? (
              <div className="text-xs text-muted p-2">Баланс нульовий або всі активи &lt; $0.01</div>
            ) : balance?.error ? (
              <div className="text-xs text-red-400 p-2">{balance.error}</div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
