import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Wifi, WifiOff, ExternalLink, RefreshCw, Activity,
  Shield, Code2, Wallet, BookOpen, Radio, Zap, Database,
  MessageCircle, TrendingUp, ChevronDown, ChevronRight,
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
  operational: { label: "OPERATIONAL",  color: "#00FF88", bg: "rgba(0,255,136,0.08)" },
  degraded:    { label: "DEGRADED",     color: "#FF8C00", bg: "rgba(255,140,0,0.08)" },
  outage:      { label: "OUTAGE",       color: "#FF3355", bg: "rgba(255,51,85,0.08)" },
};

const CAT_ICONS: Record<string, any> = {
  status:     Activity,
  validators: Shield,
  api:        Database,
  explorer:   Globe,
};
const CAT_COLORS: Record<string, string> = {
  status:     "#00FFFF",
  validators: "#00FF88",
  api:        "#FF8C00",
  explorer:   "#9B5CFF",
};

const SECTION_ICONS: Record<string, any> = {
  docs:             BookOpen,
  ai:               Zap,
  wallets:          Wallet,
  explorers:        Globe,
  apis:             Code2,
  infrastructure:   Activity,
  oracles:          TrendingUp,
  tonConnect:       Wifi,
  appKit:           Code2,
  tma:              MessageCircle,
  tonPay:           Shield,
  telegramChannels: Radio,
};

const SECTION_LABELS: Record<string, string> = {
  docs:             "Документація · Початок",
  ai:               "AI & Agentic",
  wallets:          "Wallet Apps",
  explorers:        "Explorers",
  apis:             "SDKs / APIs",
  infrastructure:   "Інфраструктура мережі",
  oracles:          "Oracles · Цінові дані",
  tonConnect:       "TON Connect",
  appKit:           "AppKit",
  tma:              "Telegram Mini Apps (TMA)",
  tonPay:           "TON Pay · Платежі",
  telegramChannels: "Telegram · Статус-канали",
};

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
              ? <Wifi className="w-3 h-3 text-safe" />
              : <WifiOff className="w-3 h-3 text-danger" />
            }
            <span className={`text-[10px] font-bold font-mono ${svc.online ? "text-safe" : "text-danger"}`}>
              {svc.online ? "UP" : "DOWN"}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-muted">—</span>
        )}
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
  const Icon = SECTION_ICONS[sectionKey] || Globe;
  const label = SECTION_LABELS[sectionKey] || sectionKey;

  return (
    <div className="border rounded mb-2" style={{ borderColor: "rgba(0,255,255,0.12)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-cyan-500/5 transition-colors"
      >
        <Icon className="w-4 h-4 shrink-0 text-primary" />
        <span className="text-xs font-bold text-foreground flex-1">{label}</span>
        <span className="text-[10px] text-muted mr-2">{items.length} ресурсів</span>
        {open ? <ChevronDown className="w-3 h-3 text-muted" /> : <ChevronRight className="w-3 h-3 text-muted" />}
      </button>
      {open && (
        <div className="border-t" style={{ borderColor: "rgba(0,255,255,0.07)" }}>
          {items.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 px-4 py-2 hover:bg-cyan-500/5 transition-colors group"
            >
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

  const byCategory: Record<string, any[]> = {};
  for (const svc of services) {
    if (!byCategory[svc.category]) byCategory[svc.category] = [];
    byCategory[svc.category].push(svc);
  }

  const sectionOrder = [
    "docs","ai","wallets","explorers","apis","infrastructure",
    "oracles","tonConnect","appKit","tma","tonPay","telegramChannels",
  ];

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-center">
        <div>
          <h1 className="titan-title">◈ TON ECOSYSTEM MONITOR</h1>
          <p className="titan-subtitle">Живий моніторинг мережі · документація · ресурси TON</p>
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
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(byCategory).map(([cat, svcs]) => {
              const Icon = CAT_ICONS[cat] || Globe;
              const col = CAT_COLORS[cat] || "#00FFFF";
              const up = svcs.filter((s: any) => s.online).length;
              return (
                <div key={cat} className="text-center">
                  <Icon className="w-4 h-4 mx-auto mb-0.5" style={{ color: col }} />
                  <div className="text-[10px] font-bold font-mono" style={{ color: up === svcs.length ? "#00FF88" : "#FF3355" }}>
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

        {/* Status pages */}
        <div className="titan-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
            <Activity className="w-4 h-4 text-primary" />
            <span className="titan-label text-xs">СТАТУС-СТОРІНКИ</span>
            <a href="https://docs.ton.org/ecosystem/status" target="_blank" rel="noopener"
               className="ml-auto text-muted hover:text-primary">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {byCategory["status"]?.map((svc: any) => <ServiceRow key={svc.id} svc={svc} />) || (
            <div className="p-4 text-xs text-muted text-center">Завантаження...</div>
          )}
        </div>

        {/* Validators */}
        <div className="titan-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
            <Shield className="w-4 h-4 text-safe" />
            <span className="titan-label text-xs">VALIDATORS</span>
          </div>
          {byCategory["validators"]?.map((svc: any) => <ServiceRow key={svc.id} svc={svc} />) || (
            <div className="p-4 text-xs text-muted text-center">Завантаження...</div>
          )}
        </div>

        {/* APIs */}
        <div className="titan-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
            <Database className="w-4 h-4 text-amber" />
            <span className="titan-label text-xs">APIs</span>
          </div>
          {byCategory["api"]?.map((svc: any) => <ServiceRow key={svc.id} svc={svc} />) || (
            <div className="p-4 text-xs text-muted text-center">Завантаження...</div>
          )}
        </div>

        {/* Explorers */}
        <div className="titan-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
            <Globe className="w-4 h-4" style={{ color: "#9B5CFF" }} />
            <span className="titan-label text-xs">EXPLORERS</span>
          </div>
          {byCategory["explorer"]?.map((svc: any) => <ServiceRow key={svc.id} svc={svc} />) || (
            <div className="p-4 text-xs text-muted text-center">Завантаження...</div>
          )}
        </div>
      </div>

      {/* Telegram status channels quick access */}
      <div className="titan-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-primary" />
          <span className="titan-label">TELEGRAM СТАТУС-КАНАЛИ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { url: "https://t.me/tonstatus",      label: "@tonstatus",      desc: "Сповіщення для mainnet validators", color: "#00FFFF" },
            { url: "https://t.me/testnetstatus",  label: "@testnetstatus",  desc: "Сповіщення для testnet validators", color: "#FF8C00" },
            { url: "https://t.me/validators",     label: "@validators",     desc: "Бот для власників validators",      color: "#00FF88" },
          ].map(ch => (
            <a key={ch.url} href={ch.url} target="_blank" rel="noopener"
               className="flex items-center gap-3 p-3 border rounded hover:bg-cyan-500/5 transition-colors group"
               style={{ borderColor: ch.color + "30" }}>
              <MessageCircle className="w-4 h-4 shrink-0" style={{ color: ch.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold group-hover:text-primary transition-colors" style={{ color: ch.color }}>
                  {ch.label}
                </div>
                <div className="text-[10px] text-muted">{ch.desc}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* TON Ecosystem Documentation */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="titan-label">TON ECOSYSTEM ДОКУМЕНТАЦІЯ</span>
          <a href="https://docs.ton.org/" target="_blank" rel="noopener"
             className="ml-auto flex items-center gap-1 text-[10px] text-primary hover:underline">
            docs.ton.org <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div>
          {sectionOrder.map(key => {
            const items = (links as any)[key];
            if (!items || !Array.isArray(items) || items.length === 0) return null;
            return <EcosystemSection key={key} sectionKey={key} items={items} />;
          })}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-muted opacity-50">
        Статус перевіряється кожні 60 секунд · TITAN-94 слідкує за здоров'ям TON мережі · Solo Deo Subjectus
      </div>
    </div>
  );
}
