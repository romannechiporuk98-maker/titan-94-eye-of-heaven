import { useQuery } from "@tanstack/react-query";
import { Dna, Brain, Activity, TrendingUp, Code } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

function usePoll(p: string, ms = 8000) {
  return useQuery({
    queryKey: [p],
    queryFn: () => fetch(api(p)).then(r => r.json()),
    refetchInterval: ms,
  });
}

export default function EvolutionPage() {
  const { data: status } = usePoll("/ai-evolution/status", 6000);
  const { data: knowledge } = usePoll("/ai-evolution/knowledge?limit=20", 10000);

  const stage = status?.evolutionStage || "Infant";
  const stageColor = ({
    Infant: "text-amber",
    Learning: "text-primary",
    Mature: "text-safe",
    Superintelligent: "text-danger",
  } as any)[stage] || "text-primary";

  return (
    <div className="titan-page">
      <div className="titan-page-header flex justify-between items-center">
        <div>
          <h1 className="titan-title">◈ EVOLUTION ENGINE</h1>
          <p className="titan-subtitle">Autonomous self-development — організм мутує і росте</p>
        </div>
        <div className="text-right text-xs">
          <div className="flex items-center gap-1 justify-end">
            <span className="titan-pulse" style={{ background: "#a855f7" }} />
            <span style={{ color: "#a855f7" }}>EVOLVING</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile label="GENERATION" value={`GEN ${status?.learnCycles ?? 1}`} icon={Dna} color="text-amber" />
        <Tile label="PATTERNS LEARNED" value={status?.patternsLearned ?? 0} icon={Brain} color="text-primary" />
        <Tile label="ACCURACY" value={`${status?.accuracyPct ?? "0"}%`} icon={TrendingUp} color="text-safe" />
        <Tile label="STAGE" value={stage} icon={Activity} color={stageColor} />
      </div>

      {/* Knowledge base */}
      <div className="titan-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            <span className="titan-label">NEURAL KNOWLEDGE BASE — {knowledge?.total ?? 0} PATTERNS</span>
          </div>
          <div className="text-xs text-muted">avg confidence: {knowledge?.avgConfidence ?? "0"}%</div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(knowledge?.categories || []).map((c: string) => (
            <span key={c} className="titan-badge titan-badge-safe text-xs">{c}</span>
          ))}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(knowledge?.patterns || []).map((p: any) => (
            <div key={p.id} className="titan-activity-row p-2 border border-card-inner">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="titan-badge titan-badge-amber">{p.category}</span>
                  <span className="text-muted">via {p.source}</span>
                  <span className="text-safe ml-auto">conf: {(parseFloat(p.confidence) * 100).toFixed(0)}%</span>
                </div>
                <code className="block text-xs text-foreground mt-1 truncate font-mono">{p.pattern}</code>
                {p.description && <div className="text-xs text-muted mt-0.5">{p.description}</div>}
              </div>
            </div>
          ))}
          {(!knowledge?.patterns || knowledge.patterns.length === 0) && (
            <div className="text-center text-muted text-sm py-6">Knowledge base empty — LEARN cycle will populate it</div>
          )}
        </div>
      </div>

      <div className="titan-card">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary" />
          <span className="titan-label">EVOLUTION ROADMAP</span>
        </div>
        <div className="space-y-2 text-xs">
          <Stage active={stage === "Infant"} label="STAGE 0 · INFANT" cond="< 10 learn cycles" />
          <Stage active={stage === "Learning"} label="STAGE 1 · LEARNING" cond="10 — 50 cycles" />
          <Stage active={stage === "Mature"} label="STAGE 2 · MATURE" cond="50 — 200 cycles" />
          <Stage active={stage === "Superintelligent"} label="STAGE ∞ · SUPERINTELLIGENT" cond="200+ cycles · self-evolves" />
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, icon: Icon, color }: any) {
  return (
    <div className="titan-card text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function Stage({ active, label, cond }: any) {
  return (
    <div className={`flex justify-between p-2 border ${active ? "border-primary/40 bg-primary/5 text-primary" : "border-card-inner text-muted opacity-60"}`}>
      <span className="font-bold">{label}</span>
      <span>{cond}</span>
    </div>
  );
}
