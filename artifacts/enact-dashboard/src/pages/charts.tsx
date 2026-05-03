import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, RefreshCw, ChevronDown,
  BarChart2, Activity, Zap,
} from "lucide-react";
import { useLang, t } from "@/lib/ui-prefs";

// ── CoinGecko coin IDs ────────────────────────────────────────────────────────
const PAIRS = [
  { symbol: "TON/USDT",  id: "the-open-network",  color: "#0088CC", icon: "💎" },
  { symbol: "BTC/USDT",  id: "bitcoin",            color: "#FF8C00", icon: "₿" },
  { symbol: "ETH/USDT",  id: "ethereum",           color: "#9B5CFF", icon: "Ξ" },
  { symbol: "BNB/USDT",  id: "binancecoin",        color: "#FFD700", icon: "⬡" },
  { symbol: "SOL/USDT",  id: "solana",             color: "#00FFA3", icon: "◎" },
  { symbol: "NOT/USDT",  id: "notcoin",            color: "#FF3355", icon: "✕" },
  { symbol: "DOGS/USDT", id: "dogs-2",             color: "#FF8C42", icon: "🐕" },
];

const TIMEFRAMES = [
  { label: "1Д",   key: "1D",  days: "1",   interval: "hourly" },
  { label: "7Д",   key: "7D",  days: "7",   interval: "daily"  },
  { label: "30Д",  key: "30D", days: "30",  interval: "daily"  },
  { label: "90Д",  key: "90D", days: "90",  interval: "daily"  },
  { label: "1Р",   key: "1Y",  days: "365", interval: "daily"  },
];

// ── API proxy helpers (avoids CORS issues) ────────────────────────────────────
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const apiUrl = (path: string) => `${BASE}/api${path}`;

function useOHLC(coinId: string, days: string) {
  return useQuery<number[][]>({
    queryKey: ["ohlc", coinId, days],
    queryFn: async () => {
      const r = await fetch(apiUrl(`/market/ohlc?coinId=${coinId}&days=${days}`));
      if (!r.ok) throw new Error("Rate limited");
      return r.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

// Derive ticker from OHLC data (same klines already cached on server)
function useTickerFromOHLC(candles: Candle[]) {
  if (!candles.length) return { price: null, change24h: null, vol24h: null };
  const last   = candles[candles.length - 1];
  const first  = candles[0];
  const price  = last.c;
  const change24h = ((last.c - first.o) / first.o) * 100;
  return { price, change24h, vol24h: null };
}

// ── SVG Candlestick Chart ─────────────────────────────────────────────────────
interface Candle { ts: number; o: number; h: number; l: number; c: number }

function CandlestickChart({ data, color, height = 300 }: { data: Candle[]; color: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; candle: Candle } | null>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const obs = new ResizeObserver(e => setWidth(e[0]?.contentRect.width ?? 600));
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
    return () => obs.disconnect();
  }, []);

  if (!data.length) return (
    <div style={{ height }} className="flex items-center justify-center text-muted text-sm">
      <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Завантаження даних...
    </div>
  );

  const pad = { top: 20, bottom: 40, left: 70, right: 20 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const prices = data.flatMap(c => [c.h, c.l]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const candleW = Math.max(3, Math.min(18, (chartW / data.length) * 0.7));
  const spacing = chartW / data.length;

  const toY = (p: number) => pad.top + chartH - ((p - minP) / range) * chartH;
  const toX = (i: number) => pad.left + i * spacing + spacing / 2;

  // Price grid lines
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const price = minP + (range / (gridCount - 1)) * i;
    const y = toY(price);
    return { price, y };
  });

  // Format price nicely
  const fmt = (p: number) =>
    p >= 1000 ? `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}` :
    p >= 1    ? `$${p.toFixed(2)}` :
    `$${p.toFixed(4)}`;

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        onMouseLeave={() => setTooltip(null)}
        style={{ fontFamily: "'Space Mono', monospace", overflow: "visible" }}
      >
        {/* Grid lines */}
        {gridLines.map(({ price, y }, i) => (
          <g key={i}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y}
              stroke="rgba(0,255,255,0.07)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={pad.left - 4} y={y + 4} textAnchor="end"
              fontSize={9} fill="rgba(207,255,255,0.45)">{fmt(price)}</text>
          </g>
        ))}

        {/* Candles */}
        {data.map((c, i) => {
          const x     = toX(i);
          const isUp  = c.c >= c.o;
          const clr   = isUp ? "#00FF88" : "#FF3355";
          const bodyT = toY(Math.max(c.o, c.c));
          const bodyB = toY(Math.min(c.o, c.c));
          const bodyH = Math.max(1, bodyB - bodyT);
          const wickT = toY(c.h);
          const wickB = toY(c.l);

          return (
            <g key={i}
              onMouseEnter={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, candle: c });
              }}
            >
              {/* Wick */}
              <line x1={x} x2={x} y1={wickT} y2={wickB} stroke={clr} strokeWidth={1} opacity={0.8} />
              {/* Body */}
              <rect x={x - candleW / 2} y={bodyT} width={candleW} height={bodyH}
                fill={clr} opacity={0.9} rx={0.5} />
              {/* Hover zone */}
              <rect x={x - spacing / 2} y={pad.top} width={spacing} height={chartH}
                fill="transparent" cursor="crosshair" />
            </g>
          );
        })}

        {/* X axis labels */}
        {data.filter((_, i) => i % Math.ceil(data.length / 8) === 0).map((c, i, arr) => {
          const origIdx = data.indexOf(c);
          const x = toX(origIdx);
          const d = new Date(c.ts);
          const label = data.length <= 48
            ? d.toLocaleTimeString("uk", { hour: "2-digit", minute: "2-digit" })
            : d.toLocaleDateString("uk", { day: "2-digit", month: "short" });
          return (
            <text key={i} x={x} y={height - 8} textAnchor="middle"
              fontSize={9} fill="rgba(207,255,255,0.4)">{label}</text>
          );
        })}

        {/* Tooltip crosshair */}
        {tooltip && (
          <line x1={tooltip.x} x2={tooltip.x} y1={pad.top} y2={height - pad.bottom}
            stroke="rgba(0,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: Math.min(tooltip.x + 10, width - 160),
          top: Math.max(10, tooltip.y - 80),
          background: "#060F1A",
          border: "1px solid rgba(0,255,255,0.3)",
          padding: "8px 12px",
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 150,
        }}>
          <div style={{ color: "rgba(207,255,255,0.6)", marginBottom: 4, fontSize: 10 }}>
            {new Date(tooltip.candle.ts).toLocaleString("uk")}
          </div>
          {[
            ["O", fmt(tooltip.candle.o)],
            ["H", fmt(tooltip.candle.h)],
            ["L", fmt(tooltip.candle.l)],
            ["C", fmt(tooltip.candle.c)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "rgba(207,255,255,0.5)" }}>{k}</span>
              <span style={{ color: tooltip.candle.c >= tooltip.candle.o ? "#00FF88" : "#FF3355", fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Volume bar chart ──────────────────────────────────────────────────────────
function VolumeChart({ data, height = 60 }: { data: Candle[]; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const obs = new ResizeObserver(e => setWidth(e[0]?.contentRect.width ?? 600));
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
    return () => obs.disconnect();
  }, []);

  if (!data.length) return null;
  const pad = { left: 70, right: 20, top: 4, bottom: 4 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const vols = data.map(c => Math.abs(c.h - c.l) * ((c.c + c.o) / 2));
  const maxV = Math.max(...vols, 1);
  const spacing = chartW / data.length;
  const barW = Math.max(2, spacing * 0.7);

  return (
    <svg ref={svgRef} width="100%" height={height}>
      <text x={pad.left - 4} y={pad.top + 10} textAnchor="end" fontSize={9} fill="rgba(207,255,255,0.3)">VOL</text>
      {data.map((c, i) => {
        const x = pad.left + i * spacing + spacing / 2;
        const h = (vols[i] / maxV) * chartH;
        const isUp = c.c >= c.o;
        return (
          <rect key={i} x={x - barW / 2} y={height - pad.bottom - h} width={barW} height={Math.max(1, h)}
            fill={isUp ? "rgba(0,255,136,0.4)" : "rgba(255,51,85,0.4)"} />
        );
      })}
    </svg>
  );
}

// ── Pair selector dropdown ─────────────────────────────────────────────────────
function PairSelector({ pairs, selected, onSelect }: {
  pairs: typeof PAIRS; selected: typeof PAIRS[0]; onSelect: (p: typeof PAIRS[0]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "rgba(0,255,255,0.05)",
          border: `1px solid ${selected.color}40`,
          color: selected.color,
          fontFamily: "'Space Mono', monospace",
          fontWeight: "bold", fontSize: 14,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 18 }}>{selected.icon}</span>
        <span>{selected.symbol}</span>
        <ChevronDown style={{ width: 14, height: 14, marginLeft: 4 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 100, minWidth: 200,
          background: "#060F1A", border: "1px solid rgba(0,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {pairs.map(p => (
            <button key={p.id}
              onClick={() => { onSelect(p); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", width: "100%", textAlign: "left",
                background: p.id === selected.id ? `${p.color}10` : "transparent",
                color: p.id === selected.id ? p.color : "rgba(207,255,255,0.8)",
                borderBottom: "1px solid rgba(0,255,255,0.07)",
                fontFamily: "'Space Mono', monospace", fontSize: 13,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ fontWeight: "bold" }}>{p.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Charts page ──────────────────────────────────────────────────────────
export default function ChartsPage() {
  const { lang } = useLang();
  const [pair, setPair]   = useState(PAIRS[0]);
  const [tf, setTf]       = useState(TIMEFRAMES[1]);
  const [dropOpen, setDropOpen] = useState(false);

  const { data: raw, isLoading: ohlcLoading, error: ohlcError, refetch } = useOHLC(pair.id, tf.days);

  // Convert OHLC to Candle[]
  const candles = useMemo<Candle[]>(() => {
    if (!Array.isArray(raw)) return [];
    return raw.map(([ts, o, h, l, c]) => ({ ts, o, h, l, c }));
  }, [raw]);

  // Derive ticker from the OHLC data (no extra API call needed)
  const { price, change24h, vol24h } = useTickerFromOHLC(candles);
  const mcap = null;

  const isUp = change24h != null ? change24h >= 0 : true;
  const priceColor = isUp ? "#00FF88" : "#FF3355";

  const fmt = (n: number) =>
    n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` :
    n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` :
    n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` :
    n >= 1    ? `$${n.toFixed(2)}` :
    `$${n.toFixed(4)}`;

  return (
    <div className="titan-page" onClick={() => setDropOpen(false)}>
      {/* Header */}
      <div className="titan-page-header">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6" style={{ color: pair.color }} />
          <h1 className="titan-title">◈ {t("page.charts.title", lang)}</h1>
        </div>
        <p className="titan-subtitle">{t("page.charts.sub", lang)}</p>
      </div>

      {/* Pair + Timeframe selectors */}
      <div className="titan-card mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pair selector */}
          <PairSelector pairs={PAIRS} selected={pair} onSelect={p => { setPair(p); }} />

          {/* Timeframe tabs */}
          <div className="flex gap-1">
            {TIMEFRAMES.map(tfOpt => (
              <button key={tfOpt.key}
                onClick={() => setTf(tfOpt)}
                style={{
                  padding: "6px 12px", fontSize: 11,
                  fontFamily: "'Space Mono', monospace", fontWeight: "bold",
                  background: tf.key === tfOpt.key ? `${pair.color}20` : "transparent",
                  border: `1px solid ${tf.key === tfOpt.key ? pair.color : "rgba(0,255,255,0.2)"}`,
                  color: tf.key === tfOpt.key ? pair.color : "rgba(207,255,255,0.6)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{tfOpt.label}</button>
            ))}
            <button onClick={() => refetch()}
              className="p-1.5 border"
              style={{ borderColor: "rgba(0,255,255,0.2)", color: "rgba(0,255,255,0.6)" }}
              title="Оновити"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ohlcLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Price ticker */}
        {price != null && (
          <div className="flex flex-wrap items-end gap-6 mt-4 pb-3 border-b" style={{ borderColor: "rgba(0,255,255,0.1)" }}>
            {/* Main price */}
            <div>
              <div className="text-[10px] tracking-widest text-muted mb-1">{pair.symbol} · {t("page.charts.price", lang)}</div>
              <div className="text-4xl font-bold tabular-nums" style={{ color: priceColor, fontFamily: "'Space Mono', monospace" }}>
                {fmt(price)}
              </div>
            </div>
            {/* 24h change */}
            <div>
              <div className="text-[10px] tracking-widest text-muted mb-1">24Г ЗМІНА</div>
              <div className="flex items-center gap-1 text-xl font-bold" style={{ color: priceColor, fontFamily: "'Space Mono', monospace" }}>
                {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {change24h != null ? `${isUp ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
              </div>
            </div>
            {/* Volume */}
            {vol24h != null && (
              <div>
                <div className="text-[10px] tracking-widest text-muted mb-1">24Г ОБ'ЄМ</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "rgba(207,255,255,0.8)", fontFamily: "'Space Mono', monospace" }}>
                  {fmt(vol24h)}
                </div>
              </div>
            )}
            {/* Market cap */}
            {mcap != null && (
              <div>
                <div className="text-[10px] tracking-widest text-muted mb-1">МАР. КАП</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "rgba(207,255,255,0.8)", fontFamily: "'Space Mono', monospace" }}>
                  {fmt(mcap)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="titan-card mb-4" style={{ padding: "16px 8px 8px 8px" }}>
        {ohlcError ? (
          <div className="text-center py-12 text-sm" style={{ color: "#FF3355" }}>
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t("page.charts.rate_limit", lang)}</p>
            <button onClick={() => refetch()} className="titan-btn mt-3 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Спробувати знову
            </button>
          </div>
        ) : (
          <>
            <CandlestickChart data={candles} color={pair.color} height={320} />
            <div style={{ marginTop: 4 }}>
              <VolumeChart data={candles} height={60} />
            </div>
          </>
        )}
      </div>

      {/* Other pairs quick view */}
      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: "#FF8C00" }} />
          <span className="titan-label">{t("page.charts.watchlist", lang)}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PAIRS.map(p => (
            <button key={p.id}
              onClick={() => setPair(p)}
              style={{
                padding: "10px 12px", textAlign: "left",
                background: p.id === pair.id ? `${p.color}15` : "rgba(255,255,255,0.02)",
                border: `1px solid ${p.id === pair.id ? p.color + "60" : "rgba(0,255,255,0.1)"}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 14 }}>{p.icon}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: "bold", color: p.color }}>{p.symbol}</span>
              </div>
              <PairTicker coinId={p.id} color={p.color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PairTicker({ coinId, color }: { coinId: string; color: string }) {
  // Use 1D OHLC to get price (last candle close) — reuses server-side cache
  const { data: raw } = useQuery<number[][]>({
    queryKey: ["ohlc", coinId, "1"],
    queryFn: async () => {
      const r = await fetch(apiUrl(`/market/ohlc?coinId=${coinId}&days=1`));
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 0,
  });
  if (!raw || !raw.length) return <div style={{ fontSize: 10, color: "rgba(207,255,255,0.3)" }}>—</div>;
  const last  = raw[raw.length - 1];
  const first = raw[0];
  const price = last[4];
  const ch    = ((last[4] - first[1]) / first[1]) * 100;
  const isUp  = ch >= 0;
  const fmt   = (n: number) => n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: "bold", fontFamily: "'Space Mono', monospace", color }}>{fmt(price)}</div>
      <div style={{ fontSize: 10, color: isUp ? "#00FF88" : "#FF3355" }}>
        {isUp ? "▲" : "▼"} {Math.abs(ch).toFixed(2)}%
      </div>
    </div>
  );
}
