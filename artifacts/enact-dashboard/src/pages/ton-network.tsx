import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Wifi, WifiOff, ExternalLink, RefreshCw, Activity,
  Shield, Code2, Wallet, BookOpen, Radio, Zap, Database,
  MessageCircle, TrendingUp, ChevronDown, ChevronRight,
  Trophy, Users, Coins, Lock,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 30000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

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

export default function TonNetworkPage() {
  const { data: infra, isFetching, refetch } = usePoll("/ton/infra-status", 60000);

  const services: any[] = infra?.services || [];
  const overallStatus = infra?.overallStatus || "operational";
  const statusMeta = STATUS_META[overallStatus] || STATUS_META.operational;
  const links = infra?.ecosystemLinks || {};
  const totalLinks: number = infra?.totalLinks || 0;

  const byCategory: Record<string, any[]> = {};
  for (const svc of services) {
    if (!byCategory[svc.category]) byCategory[svc.category] = [];
    byCategory[svc.category].push(svc);
  }

  const catOrder = ["status","validators","api","explorer","defi"];

  return (
    <div className="titan-page">
      {/* Header */}
      <div className="titan-page-header flex justify-between items-center">
        <div>
          <h1 className="titan-title">◈ TON ECOSYSTEM MONITOR</h1>
          <p className="titan-subtitle">
            Живий моніторинг · {totalLinks} ресурсів у бібліотеці · документація · інструменти
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 text-xs font-bold font-mono border rounded"
            style={{ color: statusMeta.color, borderColor: statusMeta.color + "50", background: statusMeta.bg }}>
            ● {statusMeta.label}
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="titan-btn titan-btn-sm">
            <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      <div className="titan-card p-4 mb-4" style={{ borderColor: statusMeta.color + "40", background: statusMeta.bg }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6" style={{ color: statusMeta.color }} />
            <div>
              <div className="text-sm font-bold" style={{ color: statusMeta.color }}>
                TON BLOCKCHAIN NETWORK · {statusMeta.label}
              </div>
              <div className="text-xs text-muted">
                {infra?.onlineCount ?? "—"} / {infra?.totalCount ?? "—"} сервісів онлайн
                {infra?.checkedAt && (
                  <span> · перевірено о {new Date(infra.checkedAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {catOrder.map(cat => {
              const svcs = byCategory[cat] || [];
              if (!svcs.length) return null;
              const Icon = CAT_ICONS[cat] || Globe;
              const col = CAT_COLORS[cat] || "#00FFFF";
              const up = svcs.filter((s: any) => s.online).length;
              return (
                <div key={cat} className="text-center">
                  <Icon className="w-4 h-4 mx-auto mb-0.5" style={{ color: col }} />
                  <div className="text-[10px] font-bold font-mono"
                    style={{ color: up === svcs.length ? "#00FF88" : up === 0 ? "#FF3355" : "#FF8C00" }}>
                    {up}/{svcs.length}
                  </div>
                  <div className="text-[9px] text-muted capitalize">{cat}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

      {/* Telegram status channels */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-primary" />
          <span className="titan-label">TELEGRAM СТАТУС-КАНАЛИ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { url: "https://t.me/tonstatus",        label: "@tonstatus",         desc: "Mainnet validator сповіщення",      color: "#00FFFF" },
            { url: "https://t.me/testnetstatus",    label: "@testnetstatus",     desc: "Testnet validator сповіщення",      color: "#FF8C00" },
            { url: "https://t.me/validators",       label: "@validators",        desc: "Бот для власників validators",      color: "#00FF88" },
            { url: "https://t.me/tonblockchain",    label: "@tonblockchain",     desc: "Офіційний канал TON",               color: "#9B5CFF" },
            { url: "https://t.me/TON_official_news",label: "@TON_official_news", desc: "Офіційні новини TON Foundation",    color: "#9B5CFF" },
            { url: "https://t.me/tondev",           label: "@tondev",            desc: "TON Dev спільнота розробників",     color: "#00FFFF" },
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

      {/* Full Ecosystem Documentation */}
      <div className="titan-card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="titan-label">TON ECOSYSTEM · ПОВНА БІБЛІОТЕКА</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">{totalLinks} посилань · {SECTION_ORDER.length} категорій</span>
            <a href="https://docs.ton.org/" target="_blank" rel="noopener"
               className="flex items-center gap-1 text-[10px] text-primary hover:underline">
              docs.ton.org <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        <div>
          {SECTION_ORDER.map(key => {
            const items = (links as any)[key];
            if (!items || !Array.isArray(items) || !items.length) return null;
            return <EcosystemSection key={key} sectionKey={key} items={items} />;
          })}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-muted opacity-40">
        Статус кожні 60с · TITAN-94 слідкує за TON мережею · Solo Deo Subjectus
      </div>
    </div>
  );
}
