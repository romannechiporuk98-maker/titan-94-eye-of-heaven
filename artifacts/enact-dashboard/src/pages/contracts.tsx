import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCode, Search, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;
const tonviewer = (a: string) => `https://tonviewer.com/${a}`;

export default function ContractsPage() {
  const qc = useQueryClient();
  const [addr, setAddr] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data: list } = useQuery({
    queryKey: ["/vulnerabilities", filter],
    queryFn: () => fetch(api(`/vulnerabilities${filter !== "all" ? `?severity=${filter}` : ""}`)).then(r => r.json()),
    refetchInterval: 8000,
  });

  const audit = useMutation({
    mutationFn: (address: string) =>
      fetch(api("/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, code: "" }),
      }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/vulnerabilities"] }); setAddr(""); },
  });

  const items = list?.vulnerabilities || [];

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ SMART CONTRACTS</h1>
        <p className="titan-subtitle">Аудит та реєстр TON смарт-контрактів</p>
      </div>

      {/* Quick audit */}
      <div className="titan-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-primary" />
          <span className="titan-label">QUICK AUDIT</span>
        </div>
        <div className="flex gap-2">
          <input
            className="titan-input flex-1"
            placeholder="EQ... або UQ... TON contract address"
            value={addr}
            onChange={e => setAddr(e.target.value)}
          />
          <button
            className="titan-btn"
            onClick={() => addr.trim() && audit.mutate(addr.trim())}
            disabled={!addr.trim() || audit.isPending}
          >
            {audit.isPending ? "Сканую..." : "СКАНУВАТИ"}
          </button>
        </div>
        {audit.data && (
          <div className="mt-3 p-3 bg-card-inner border border-primary/20 text-xs">
            <div className="font-bold text-primary mb-1">Verdict: {audit.data.verdict || audit.data.summary}</div>
            <div className="text-muted">Risk: {audit.data.risk_level || audit.data.severity || "n/a"}</div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["all", "critical", "high", "medium", "low"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`titan-badge text-xs cursor-pointer ${
              filter === f ? "titan-badge-amber" : "titan-badge-safe opacity-60"
            }`}
          >{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Contracts list */}
      <div className="titan-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <span className="titan-label">SCANNED CONTRACTS — {list?.total ?? 0} TOTAL</span>
          </div>
        </div>
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-center text-muted text-sm py-8">No contracts match this filter</div>
          )}
          {items.map((v: any) => (
            <div key={v.id} className="titan-activity-row flex-col items-stretch gap-2 p-3 border border-card-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {v.severity === "critical" || v.severity === "high"
                    ? <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                    : <CheckCircle  className="w-4 h-4 text-safe shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{v.title}</div>
                    <div className="text-xs text-muted truncate">{v.contractName ?? "—"} · {v.category ?? "vuln"}</div>
                  </div>
                </div>
                <span className={`titan-badge text-xs shrink-0 ${
                  v.severity === "critical" ? "titan-badge-danger" :
                  v.severity === "high"     ? "titan-badge-amber"  : "titan-badge-safe"
                }`}>{v.severity}</span>
              </div>
              {v.description && <div className="text-xs text-muted">{v.description}</div>}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">status: <span className={
                  v.status === "healed"  ? "text-safe" :
                  v.status === "healing" ? "text-amber" : "text-danger"
                }>{v.status}</span></span>
                {v.contractAddress && (
                  <a href={tonviewer(v.contractAddress)} target="_blank" rel="noreferrer"
                     className="flex items-center gap-1 text-primary hover:underline">
                    {v.contractAddress.slice(0, 8)}…{v.contractAddress.slice(-4)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
