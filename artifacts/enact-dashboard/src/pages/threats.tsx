import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { useLang, t } from "@/lib/ui-prefs";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api = (p: string) => `${BASE}/api${p}`;

const SEV_COLOR: Record<string, string> = {
  critical: "text-danger border-danger/40 bg-danger/10",
  high:     "text-orange-400 border-orange-400/40 bg-orange-400/10",
  medium:   "text-amber border-amber/40 bg-amber/10",
  low:      "text-primary border-primary/40 bg-primary/10",
  info:     "text-muted border-border bg-card",
};
const STATUS_COLOR: Record<string, string> = {
  active:  "text-danger",
  healing: "text-amber",
  healed:  "text-safe",
};

export default function ThreatsPage() {
  const { lang } = useLang();
  const [severity, setSeverity] = useState("");
  const [status, setStatus]     = useState("");

  const params  = new URLSearchParams({ ...(severity && { severity }), ...(status && { status }), limit: "30" });
  const { data, isLoading } = useQuery({
    queryKey: ["/vulnerabilities", severity, status],
    queryFn: () => fetch(api(`/vulnerabilities?${params}`)).then(r => r.json()),
    refetchInterval: 10000,
  });

  const vulns = data?.vulnerabilities || [];
  const stats = data?.stats || {};

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ {t("page.threats.title", lang)}</h1>
        <span className="titan-badge titan-badge-danger">{stats.active || 0} {t("common.active", lang)}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
        {[
          { label: "CRITICAL",  val: stats.critical || 0, c: "text-danger" },
          { label: "HIGH",      val: stats.high     || 0, c: "text-orange-400" },
          { label: "MEDIUM",    val: stats.medium   || 0, c: "text-amber" },
          { label: "HEALED",    val: stats.healed   || 0, c: "text-safe" },
        ].map(s => (
          <div key={s.label} className="titan-card text-center">
            <div className={`text-2xl font-bold ${s.c}`}>{s.val}</div>
            <div className="text-xs text-muted">{s.label === "HEALED" ? t("common.healed_lbl", lang) : s.label}</div>
          </div>
        ))}
      </div>

      {/* TVL at risk */}
      {stats.tvlAtRisk && (
        <div className="titan-card mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-danger" />
          <div>
            <div className="text-danger font-bold text-lg">{parseInt(stats.tvlAtRisk).toLocaleString()} TON {t("common.at_risk", lang)}</div>
            <div className="text-xs text-muted">{t("page.threats.tvl_risk", lang)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-muted mt-2" />
        {["", "critical", "high", "medium", "low"].map(s => (
          <button key={s} className={`titan-filter-btn ${severity === s ? "active" : ""}`} onClick={() => setSeverity(s)}>
            {s || t("common.all", lang)}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {["", "active", "healing", "healed"].map(s => (
          <button key={s} className={`titan-filter-btn ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
            {s ? s.toUpperCase() : t("common.all_status", lang)}
          </button>
        ))}
      </div>

      {/* Vulnerabilities list */}
      {isLoading ? (
        <div className="text-center text-muted py-10">{t("page.threats.scanning", lang)}</div>
      ) : (
        <div className="space-y-3">
          {vulns.map((v: any) => (
            <div key={v.id} className={`titan-card border ${SEV_COLOR[v.severity]?.split(" ")[1] || "border-border"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 border ${SEV_COLOR[v.severity] || ""}`}>
                      {v.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted">{v.externalId}</span>
                  </div>
                  <div className="font-bold text-sm text-foreground">{v.title}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold shrink-0 ${STATUS_COLOR[v.status] || "text-muted"}`}>
                  {v.status === "healed" ? <CheckCircle className="w-3 h-3" /> : v.status === "healing" ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {v.status?.toUpperCase()}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted mb-2">
                {v.protocol && <span>Protocol: <span className="text-foreground">{v.protocol}</span></span>}
                {v.category && <span>Type: <span className="text-foreground">{v.category}</span></span>}
                {v.tvlAtRisk && <span>TVL: <span className="text-danger">{parseFloat(v.tvlAtRisk).toLocaleString()} TON</span></span>}
              </div>
              {v.contractAddress && (
                <div className="text-xs font-mono text-primary truncate mb-1">{v.contractAddress}</div>
              )}
              {v.healingPlan && (
                <div className="mt-2 p-2 bg-safe/5 border border-safe/20 text-xs text-safe">
                  <Shield className="w-3 h-3 inline mr-1" />
                  {v.healingPlan}
                </div>
              )}
              <div className="text-xs text-muted mt-2">
                {new Date(v.discoveredAt).toLocaleString()}
              </div>
            </div>
          ))}
          {vulns.length === 0 && (
            <div className="text-center text-muted py-10">{t("page.threats.none", lang)}</div>
          )}
        </div>
      )}
    </div>
  );
}
