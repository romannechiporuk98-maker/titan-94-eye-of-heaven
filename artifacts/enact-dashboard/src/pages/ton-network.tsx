/**
 * TITAN-94 · TON Network · Модульна інтеграція
 * © DEI GRATIA · Roman · All rights reserved.
 *
 * Модулі:
 * 1. Live Chain Stats  — реальні дані з TonCenter + TONAPI
 * 2. Contract Scanner  — аналіз адреси через TonCenter + TONAPI
 * 3. Services Monitor  — 11 сервісів TON у реальному часі
 * 4. Ecosystem Library — 129 посилань у 18 категоріях
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Wifi, WifiOff, ExternalLink, RefreshCw, Activity,
  Shield, Code2, Wallet, BookOpen, Radio, Zap, Database,
  MessageCircle, TrendingUp, ChevronDown, ChevronRight,
  Trophy, Users, Coins, Lock, Search, AlertTriangle,
  CheckCircle, Cpu, Copy, Check,
} from "lucide-react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 30000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  operational: { label: "OPERATIONAL", color: "#00FF88", bg: "rgba(0,255,136,0.08)" },
  degraded:    { label: "DEGRADED",    color: "#FF8C00", bg: "rgba(255,140,0,0.08)" },
  outage:      { label: "OUTAGE",      color: "#FF3355", bg: "rgba(255,51,85,0.08)" },
};

const CAT_ICONS: Record<string, any> = {
  status:     Activity,
  validators: Shield,
  api:        Database,
  explorer:   Globe,
  defi:       TrendingUp,
};
const CAT_COLORS: Record<string, string> = {
  status:     "#00FFFF",
  validators: "#00FF88",
  api:        "#FF8C00",
  explorer:   "#9B5CFF",
  defi:       "#FF3355",
};

const SECTION_META: Record<string, { icon: any; label: string; color: string }> = {
  gettingStarted:  { icon: BookOpen,      label: "Початок · Перші кроки",              color: "#00FFFF" },
  ai:              { icon: Zap,           label: "AI & Agentic",                        color: "#9B5CFF" },
  grants:          { icon: Trophy,        label: "Гранти · Фінансування",               color: "#FF8C00" },
  wallets:         { icon: Wallet,        label: "Wallet Apps",                         color: "#00FF88" },
  explorers:       { icon: Globe,         label: "Explorers",                           color: "#9B5CFF" },
  apis:            { icon: Code2,         label: "SDKs / APIs",                         color: "#FF8C00" },
  infrastructure:  { icon: Activity,      label: "Інфраструктура мережі",              color: "#00FFFF" },
  defi:            { icon: TrendingUp,    label: "DeFi · Фінанси",                     color: "#FF3355" },
  nftsGaming:      { icon: Coins,         label: "NFT · Gaming",                        color: "#FF8C00" },
  oracles:         { icon: TrendingUp,    label: "Oracles · Цінові дані",              color: "#00FF88" },
  security:        { icon: Lock,          label: "Безпека · Аудити",                   color: "#FF3355" },
  smartContracts:  { icon: Code2,         label: "Smart Contracts · FunC / Tact",      color: "#9B5CFF" },
  tonConnect:      { icon: Wifi,          label: "TON Connect",                         color: "#00FFFF" },
  appKit:          { icon: Code2,         label: "AppKit",                              color: "#FF8C00" },
  tma:             { icon: MessageCircle, label: "Telegram Mini Apps (TMA)",            color: "#9B5CFF" },
  tonPay:          { icon: Shield,        label: "TON Pay · Платежі",                  color: "#00FF88" },
  community:       { icon: Users,         label: "Спільнота · Ресурси",                color: "#00FFFF" },
  telegramChannels:{ icon: Radio,         label: "Telegram · Статус-канали",           color: "#9B5CFF" },
};

const SECTION_ORDER = [
  "gettingStarted","ai","grants","wallets","explorers","apis",
  "infrastructure","defi","nftsGaming","oracles","security",
  "smartContracts","tonConnect","appKit","tma","tonPay","community","telegramChannels",
];

/* ══════════════════════════════════════════════════════
   MODULE 1 · LIVE CHAIN STATS
══════════════════════════════════════════════════════ */
function ModuleChainStats() {
  const { data: chain, isFetching, refetch } = useQuery({
    queryKey: ["/ton/chain-stats"],
    queryFn: () => fetch(api("/ton/chain-stats")).then(r => r.json()),
    refetchInterval: 20_000,
  });

  const tonAddress = useTonAddress();

  const tiles = [
    { label: "MASTERCHAIN BLOCK", value: chain?.seqno ? `#${chain.seqno.toLocaleString()}` : "—", sub: "real-time · TonCenter", color: "#00FFFF", icon: Cpu },
    { label: "ACTIVE VALIDATORS", value: chain?.validators ? String(chain.validators) : "—",       sub: "TON proof-of-stake",   color: "#00FF88", icon: Shield },
    { label: "TON / USD",         value: chain?.price?.usd ? `$${chain.price.usd.toFixed(4)}` : "—",sub: chain?.price?.diff24h ? `24h ${chain.price.diff24h}` : "TONAPI live", color: "#FF8C00", icon: Coins },
    { label: "TON / UAH",         value: chain?.price?.uah ? `₴${chain.price.uah.toFixed(2)}` : "—",sub: chain?.price?.diff7d ? `7d ${chain.price.diff7d}` : "TONAPI live",  color: "#9B5CFF", icon: TrendingUp },
  ];

  return (
    <div className="titan-card mb-4 p-0 overflow-hidden">
      {/* Module header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(0,255,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#00FFFF" }} />
          <span className="text-xs font-bold tracking-widest" style={{ color: "#00FFFF" }}>
            MODULE 1 · LIVE CHAIN STATS
          </span>
          <span className="text-[9px] px-1.5 py-0.5 border rounded font-mono" style={{ color: "#00FF88", borderColor: "rgba(0,255,136,0.3)" }}>
            MAINNET
          </span>
        </div>
        <div className="flex items-center gap-2">
          {chain?.checkedAt && (
            <span className="text-[10px] text-muted hidden md:inline">
              {new Date(chain.checkedAt).toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => refetch()} disabled={isFetching} className="text-muted hover:text-primary transition-colors">
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} className={`p-4 ${i < tiles.length - 1 ? "border-r" : ""}`}
              style={{ borderColor: "rgba(0,255,255,0.08)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3 h-3" style={{ color: t.color }} />
                <span className="text-[9px] tracking-wider font-bold" style={{ color: `${t.color}99` }}>{t.label}</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: t.color }}>{t.value}</div>
              <div className="text-[10px] mt-1" style={{ color: "rgba(207,255,255,0.4)" }}>{t.sub}</div>
            </div>
          );
        })}
      </div>

      {/* TON Connect status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-t text-[10px]"
        style={{ borderColor: "rgba(0,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
        <Wallet className="w-3 h-3" style={{ color: tonAddress ? "#00FF88" : "#FF8C00" }} />
        <span style={{ color: "rgba(207,255,255,0.5)" }}>TON CONNECT:</span>
        {tonAddress ? (
          <span className="font-mono font-bold" style={{ color: "#00FF88" }}>
            ✓ {tonAddress.slice(0, 6)}…{tonAddress.slice(-6)}
          </span>
        ) : (
          <span style={{ color: "#FF8C00" }}>підключи гаманець через кнопку вгорі →</span>
        )}
        <span className="ml-auto" style={{ color: "rgba(207,255,255,0.3)" }}>
          © DEI GRATIA · TITAN-94 · Всі права захищені
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODULE 2 · CONTRACT SCANNER
══════════════════════════════════════════════════════ */
function ModuleContractScanner() {
  const [input,   setInput]   = useState("");
  const [address, setAddress] = useState("");
  const [copied,  setCopied]  = useState(false);

  const { data, isFetching, error } = useQuery({
    queryKey: ["/ton/lookup", address],
    queryFn: () => fetch(api(`/ton/lookup/${encodeURIComponent(address)}`)).then(r => r.json()),
    enabled: !!address,
    retry: false,
  });

  const scan = () => {
    const a = input.trim();
    if (a.length >= 10) setAddress(a);
  };

  const copyAddr = (val: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const TYPE_COLORS: Record<string, string> = {
    wallet:         "#00FF88",
    contract:       "#00FFFF",
    jetton_minter:  "#FF8C00",
    jetton_wallet:  "#FF8C00",
    nft_collection: "#9B5CFF",
    nft_item:       "#9B5CFF",
    unknown:        "#6b7280",
  };
  const typeColor = data?.contractType ? (TYPE_COLORS[data.contractType] || "#00FFFF") : "#00FFFF";

  return (
    <div className="titan-card mb-4 p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(0,255,136,0.04)" }}>
        <Search className="w-4 h-4" style={{ color: "#00FF88" }} />
        <span className="text-xs font-bold tracking-widest" style={{ color: "#00FF88" }}>
          MODULE 2 · CONTRACT SCANNER
        </span>
        <span className="text-[9px] px-1.5 py-0.5 border rounded font-mono" style={{ color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }}>
          TonCenter + TONAPI
        </span>
      </div>

      <div className="p-4">
        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            className="titan-input flex-1 font-mono text-xs"
            placeholder="EQ… або UQ… — TON адреса контракту або гаманця"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && scan()}
          />
          <button
            className="titan-btn"
            onClick={scan}
            disabled={input.trim().length < 10 || isFetching}
          >
            {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            <span className="ml-1">{isFetching ? "Сканую..." : "SCAN"}</span>
          </button>
        </div>

        {/* Quick example addresses */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            { label: "ENACT Factory",  addr: "EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX" },
            { label: "Reserve Fund",   addr: "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v" },
            { label: "STON.fi Router", addr: "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTDGyiySPHgCFoL7Fz" },
          ].map(ex => (
            <button key={ex.addr}
              onClick={() => { setInput(ex.addr); setAddress(ex.addr); }}
              className="text-[10px] px-2 py-0.5 border rounded hover:bg-cyan-500/10 transition font-mono"
              style={{ borderColor: "rgba(0,255,255,0.25)", color: "rgba(0,255,255,0.7)" }}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 border rounded text-xs mb-3" style={{ borderColor: "rgba(255,51,85,0.3)", background: "rgba(255,51,85,0.06)", color: "#FF3355" }}>
            Помилка сканування. Перевір адресу.
          </div>
        )}

        {/* Results */}
        {data && !data.error && (
          <div className="space-y-3">
            {/* Address + type */}
            <div className="p-3 border rounded" style={{ borderColor: `${typeColor}40`, background: `${typeColor}08` }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {data.riskScore > 0
                    ? <AlertTriangle className="w-4 h-4" style={{ color: "#FF8C00" }} />
                    : <CheckCircle  className="w-4 h-4" style={{ color: "#00FF88" }} />
                  }
                  <span className="text-xs font-bold uppercase font-mono" style={{ color: typeColor }}>
                    {data.contractType || "unknown"}
                  </span>
                  {data.name && <span className="text-xs text-muted">· {data.name}</span>}
                  {data.symbol && <span className="text-xs font-bold" style={{ color: "#FF8C00" }}>{data.symbol}</span>}
                  {data.isScam && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(255,51,85,0.2)", color: "#FF3355" }}>
                      ⚠ SCAM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={data.explorerUrl} target="_blank" rel="noopener"
                    className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: "#00FFFF" }}>
                    TONViewer <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a href={data.tonscanUrl} target="_blank" rel="noopener"
                    className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: "#9B5CFF" }}>
                    TONScan <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "rgba(207,255,255,0.5)" }}>
                <span className="truncate">{data.address}</span>
                <button onClick={() => copyAddr(data.address)} className="shrink-0 hover:text-primary transition-colors">
                  {copied ? <Check className="w-3 h-3 text-safe" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { k: "Баланс",   v: `${data.balanceTon?.toFixed(4) ?? 0} TON`,         c: "#00FFFF" },
                { k: "Стан",     v: data.state ?? "—",                                   c: data.state === "active" ? "#00FF88" : "#FF8C00" },
                { k: "Код",      v: data.hasCode ? "✓ є код" : "✗ немає",               c: data.hasCode ? "#00FF88" : "#6b7280" },
                { k: "Ризик",    v: data.riskScore > 0 ? `${data.riskScore} флагів` : "✓ чисто", c: data.riskScore > 0 ? "#FF8C00" : "#00FF88" },
              ].map(s => (
                <div key={s.k} className="p-2 border rounded text-center" style={{ borderColor: "rgba(0,255,255,0.12)" }}>
                  <div className="text-[9px] text-muted mb-0.5">{s.k}</div>
                  <div className="text-xs font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Risk flags */}
            {data.riskFlags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.riskFlags.map((f: string) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 border rounded font-mono font-bold"
                    style={{ borderColor: "rgba(255,140,0,0.4)", background: "rgba(255,140,0,0.1)", color: "#FF8C00" }}>
                    ⚑ {f}
                  </span>
                ))}
              </div>
            )}

            {/* Interfaces */}
            {data.interfaces?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.interfaces.map((i: string) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 border rounded font-mono"
                    style={{ borderColor: "rgba(0,255,255,0.2)", color: "rgba(0,255,255,0.6)" }}>
                    {i}
                  </span>
                ))}
              </div>
            )}

            {/* Recent transactions */}
            {data.recentTxs?.length > 0 && (
              <div>
                <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "rgba(0,255,255,0.5)" }}>
                  ОСТАННІ ТРАНЗАКЦІЇ
                </div>
                <div className="space-y-1">
                  {data.recentTxs.slice(0, 5).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 border-l-2 text-[10px]"
                      style={{ borderColor: tx.success ? "rgba(0,255,136,0.4)" : "rgba(255,51,85,0.4)", background: tx.success ? "rgba(0,255,136,0.03)" : "rgba(255,51,85,0.03)" }}>
                      <span className="font-mono text-muted">{new Date(tx.utime * 1000).toLocaleTimeString()}</span>
                      <span className="font-bold" style={{ color: tx.inValue > 0 ? "#00FF88" : "#6b7280" }}>
                        {tx.inValue > 0 ? `+${tx.inValue.toFixed(4)}` : "—"} TON
                      </span>
                      <span className="font-mono text-muted truncate">{tx.hash?.slice(0, 12)}…</span>
                      <a href={`https://tonviewer.com/transaction/${tx.hash}`} target="_blank" rel="noopener"
                        className="ml-auto shrink-0 hover:text-primary transition-colors text-muted">
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!address && (
          <div className="text-center py-6 text-muted text-xs">
            Введи TON адресу вище або вибери приклад → реальний on-chain аналіз через TonCenter + TONAPI
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODULE 3 · SERVICES MONITOR (existing)
══════════════════════════════════════════════════════ */
function ServiceRow({ svc }: { svc: any }) {
  const Icon = CAT_ICONS[svc.category] || Globe;
  const col  = CAT_COLORS[svc.category] || "#00FFFF";
  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-b-0"
      style={{ borderColor: "rgba(0,255,255,0.07)" }}>
      <Icon className="w-4 h-4 shrink-0" style={{ color: col }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground">{svc.label}</span>
          {svc.latencyMs && svc.online && (
            <span className="text-[10px] text-muted">{svc.latencyMs}ms</span>
          )}
        </div>
        <div className="text-[10px] text-muted truncate">{svc.desc}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {svc.online !== undefined ? (
          <div className="flex items-center gap-1">
            {svc.online
              ? <Wifi    className="w-3 h-3 text-safe"   />
              : <WifiOff className="w-3 h-3 text-danger" />
            }
            <span className={`text-[10px] font-bold font-mono ${svc.online ? "text-safe" : "text-danger"}`}>
              {svc.online ? "UP" : "DOWN"}
            </span>
          </div>
        ) : <span className="text-[10px] text-muted">—</span>}
        <a href={svc.url} target="_blank" rel="noopener"
           className="p-1 text-muted hover:text-primary transition-colors">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODULE 4 · ECOSYSTEM LIBRARY (existing)
══════════════════════════════════════════════════════ */
function EcosystemSection({ sectionKey, items }: { sectionKey: string; items: any[] }) {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[sectionKey] || { icon: Globe, label: sectionKey, color: "#00FFFF" };
  const Icon = meta.icon;

  return (
    <div className="border rounded mb-1.5" style={{ borderColor: meta.color + "25" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors">
        <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
        <span className="text-xs font-bold flex-1" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-[10px] text-muted mr-2">{items.length}</span>
        {open
          ? <ChevronDown  className="w-3 h-3 text-muted" />
          : <ChevronRight className="w-3 h-3 text-muted" />
        }
      </button>
      {open && (
        <div className="border-t" style={{ borderColor: meta.color + "15" }}>
          {items.map((item: any, i: number) => (
            <a key={i} href={item.url} target="_blank" rel="noopener"
               className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </div>
                {item.desc && (
                  <div className="text-[10px] text-muted">{item.desc}</div>
                )}
              </div>
              <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function TonNetworkPage() {
  const { data: infra, isFetching, refetch } = usePoll("/ton/infra-status", 60000);
  const [_tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  const services: any[]   = infra?.services || [];
  const overallStatus     = infra?.overallStatus || "operational";
  const statusMeta        = STATUS_META[overallStatus] || STATUS_META.operational;
  const links             = infra?.ecosystemLinks || {};
  const totalLinks: number = infra?.totalLinks || 0;

  const byCategory: Record<string, any[]> = {};
  for (const svc of services) {
    if (!byCategory[svc.category]) byCategory[svc.category] = [];
    byCategory[svc.category].push(svc);
  }
  const catOrder = ["status","validators","api","explorer","defi"];

  return (
    <div className="titan-page">

      {/* ── PAGE HEADER ── */}
      <div className="titan-page-header flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: "rgba(0,255,255,0.4)" }}>
            © DEI GRATIA · ROMAN · TITAN-94 · TON MAINNET
          </div>
          <h1 className="titan-title">◈ TON ECOSYSTEM · ІНТЕГРАЦІЯ</h1>
          <p className="titan-subtitle">
            4 модулі · {totalLinks} ресурсів · live chain data · contract scanner · TON Connect
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* TON Connect status */}
          {tonAddress ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-mono"
              style={{ borderColor: "rgba(0,255,136,0.4)", background: "rgba(0,255,136,0.06)", color: "#00FF88" }}>
              <Wallet className="w-3 h-3" />
              {tonAddress.slice(0, 6)}…{tonAddress.slice(-6)}
            </div>
          ) : (
            <button
              onClick={() => _tonConnectUI.openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-bold tracking-wider transition hover:bg-cyan-500/10"
              style={{ borderColor: "rgba(0,255,255,0.4)", color: "#00FFFF" }}>
              <Wallet className="w-3 h-3" />
              CONNECT WALLET
            </button>
          )}
          <div className="px-3 py-1 text-xs font-bold font-mono border rounded"
            style={{ color: statusMeta.color, borderColor: statusMeta.color + "50", background: statusMeta.bg }}>
            ● {statusMeta.label}
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="titan-btn titan-btn-sm">
            <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODULE 1 · LIVE CHAIN STATS
      ══════════════════════════════════════════════════════ */}
      <ModuleChainStats />

      {/* ══════════════════════════════════════════════════════
          MODULE 2 · CONTRACT SCANNER
      ══════════════════════════════════════════════════════ */}
      <ModuleContractScanner />

      {/* ══════════════════════════════════════════════════════
          MODULE 3 · SERVICES MONITOR
      ══════════════════════════════════════════════════════ */}
      <div className="titan-card mb-4 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(255,140,0,0.04)" }}>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: "#FF8C00" }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: "#FF8C00" }}>
              MODULE 3 · SERVICES MONITOR
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: statusMeta.color }}>
            {infra?.onlineCount ?? "—"}/{infra?.totalCount ?? "—"} UP · {statusMeta.label}
          </span>
        </div>

        {/* Summary bar */}
        <div className="flex gap-3 flex-wrap px-4 py-3 border-b" style={{ borderColor: "rgba(0,255,255,0.08)" }}>
          {catOrder.map(cat => {
            const svcs = byCategory[cat] || [];
            if (!svcs.length) return null;
            const Icon = CAT_ICONS[cat] || Globe;
            const col = CAT_COLORS[cat] || "#00FFFF";
            const up = svcs.filter((s: any) => s.online).length;
            return (
              <div key={cat} className="flex items-center gap-1.5 text-[10px]">
                <Icon className="w-3 h-3" style={{ color: col }} />
                <span style={{ color: up === svcs.length ? "#00FF88" : up === 0 ? "#FF3355" : "#FF8C00" }}>
                  {up}/{svcs.length}
                </span>
                <span className="text-muted capitalize">{cat}</span>
              </div>
            );
          })}
          {infra?.checkedAt && (
            <span className="ml-auto text-[10px] text-muted hidden md:inline">
              перевірено {new Date(infra.checkedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 p-4 gap-4">
          {catOrder.map(cat => {
            const svcs = byCategory[cat];
            if (!svcs?.length) return null;
            const Icon = CAT_ICONS[cat] || Globe;
            const col = CAT_COLORS[cat] || "#00FFFF";
            const catLabel: Record<string, string> = {
              status: "СТАТУС-СТОРІНКИ", validators: "VALIDATORS", api: "APIs",
              explorer: "EXPLORERS", defi: "DeFi PROTOCOLS",
            };
            return (
              <div key={cat} className="titan-card p-0 overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
                  <Icon className="w-4 h-4" style={{ color: col }} />
                  <span className="titan-label text-xs">{catLabel[cat] || cat.toUpperCase()}</span>
                  <span className="ml-auto text-[10px] font-mono" style={{ color: col }}>
                    {svcs.filter((s: any) => s.online).length}/{svcs.length} UP
                  </span>
                </div>
                {svcs.map((svc: any) => <ServiceRow key={svc.id} svc={svc} />)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Telegram status channels */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-primary" />
          <span className="titan-label">TELEGRAM СТАТУС-КАНАЛИ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { url: "https://t.me/tonstatus",         label: "@tonstatus",          desc: "Mainnet validator сповіщення",   color: "#00FFFF" },
            { url: "https://t.me/testnetstatus",     label: "@testnetstatus",      desc: "Testnet validator сповіщення",   color: "#FF8C00" },
            { url: "https://t.me/validators",        label: "@validators",         desc: "Бот для власників validators",   color: "#00FF88" },
            { url: "https://t.me/tonblockchain",     label: "@tonblockchain",      desc: "Офіційний канал TON",            color: "#9B5CFF" },
            { url: "https://t.me/TON_official_news", label: "@TON_official_news",  desc: "Офіційні новини TON Foundation", color: "#9B5CFF" },
            { url: "https://t.me/tondev",            label: "@tondev",             desc: "TON Dev спільнота розробників",  color: "#00FFFF" },
          ].map(ch => (
            <a key={ch.url} href={ch.url} target="_blank" rel="noopener"
               className="flex items-center gap-2 p-2.5 border rounded hover:bg-white/5 transition group"
               style={{ borderColor: ch.color + "30" }}>
              <MessageCircle className="w-4 h-4 shrink-0" style={{ color: ch.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold group-hover:text-primary transition" style={{ color: ch.color }}>
                  {ch.label}
                </div>
                <div className="text-[10px] text-muted">{ch.desc}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary transition shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODULE 4 · ECOSYSTEM LIBRARY (129 ресурсів)
      ══════════════════════════════════════════════════════ */}
      <div className="titan-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)", background: "rgba(155,92,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: "#9B5CFF" }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: "#9B5CFF" }}>
              MODULE 4 · ECOSYSTEM LIBRARY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">{totalLinks} посилань · {SECTION_ORDER.length} категорій</span>
            <a href="https://docs.ton.org/" target="_blank" rel="noopener"
               className="flex items-center gap-1 text-[10px] text-primary hover:underline">
              docs.ton.org <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        <div className="p-4">
          {SECTION_ORDER.map(key => {
            const items = (links as any)[key];
            if (!items || !Array.isArray(items) || !items.length) return null;
            return <EcosystemSection key={key} sectionKey={key} items={items} />;
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-muted opacity-40">
        © DEI GRATIA · ROMAN · TITAN-94 ОКО НЕБЕСНЕ · Всі права захищені · TON Mainnet · Solo Deo Subjectus
      </div>
    </div>
  );
}
