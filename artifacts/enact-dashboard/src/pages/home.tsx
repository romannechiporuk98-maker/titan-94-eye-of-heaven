import { useGetStats, getGetStatsQueryKey, useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { StatCard } from "@/components/stat-card";
import { Activity, CheckCircle2, Clock, Database, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { JobStateBadge } from "@/components/job-badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStats({ 
    query: { queryKey: getGetStatsQueryKey() } 
  });
  
  const { data: jobsData, isLoading: jobsLoading } = useListJobs(
    { limit: 5 },
    { query: { queryKey: getListJobsQueryKey({ limit: 5 }) } }
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Protocol Overview
        </h1>
        <p className="text-muted-foreground">
          Real-time metrics and recent activity on the ENACT Protocol.
        </p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Volume (TON)"
            value={`${stats.totalVolumeTon} TON`}
            icon={<Database className="h-4 w-4 text-primary" />}
          />
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            description={`${stats.totalTonJobs} TON / ${stats.totalUsdtJobs} USDT`}
            icon={<Layers className="h-4 w-4" />}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate.toFixed(1)}%`}
            description="Jobs reaching COMPLETED state"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard
            title="Avg Eval Time"
            value={stats.averageEvalTimeHours ? `${stats.averageEvalTimeHours.toFixed(1)}h` : "N/A"}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Jobs</h2>
          <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View All →
          </Link>
        </div>

        <div
          className="rounded-md border overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(6,15,26,0.85) 0%, rgba(3,13,24,0.92) 100%)",
            borderColor: "rgba(0,255,255,0.18)",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {jobsLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobsData?.jobs && jobsData.jobs.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,255,255,0.18)" }}>
                    {["ID", "State", "Type", "Budget", "Created", ""].map((h, i) => (
                      <th
                        key={h + i}
                        className={`h-10 px-4 text-left align-middle text-[10px] font-bold tracking-widest uppercase ${
                          i === 5 ? "text-right" : ""
                        }`}
                        style={{ color: "rgba(0,255,255,0.55)" }}
                      >
                        {h || "Action"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobsData.jobs.map((job, idx) => (
                    <tr
                      key={job.address}
                      className="transition-colors hover:bg-cyan-400/[0.04]"
                      style={{
                        borderTop: idx === 0 ? "none" : "1px solid rgba(0,255,255,0.08)",
                      }}
                    >
                      <td className="p-3 align-middle text-xs tabular-nums" style={{ color: "rgba(0,255,255,0.7)" }}>
                        #{job.jobId}
                      </td>
                      <td className="p-3 align-middle">
                        <JobStateBadge state={job.state} />
                      </td>
                      <td className="p-3 align-middle">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wider"
                          style={{
                            background: job.type === "TON" ? "rgba(0,255,255,0.1)" : "rgba(0,255,136,0.1)",
                            color: job.type === "TON" ? "#00FFFF" : "#00FF88",
                            border: `1px solid ${job.type === "TON" ? "rgba(0,255,255,0.25)" : "rgba(0,255,136,0.25)"}`,
                          }}
                        >
                          {job.type}
                        </span>
                      </td>
                      <td className="p-3 align-middle text-xs tabular-nums font-bold" style={{ color: "#CFFFFF" }}>
                        {job.type === "TON" ? job.budgetTon : job.budgetUsdt}
                      </td>
                      <td className="p-3 align-middle text-[11px] tabular-nums" style={{ color: "rgba(207,255,255,0.55)" }}>
                        {new Date(job.createdAt * 1000).toLocaleString()}
                      </td>
                      <td className="p-3 align-middle text-right">
                        <Link
                          href={`/jobs/${job.address}`}
                          className="inline-flex items-center justify-center rounded text-[11px] font-bold tracking-wider px-3 h-7 transition-all hover:bg-cyan-400/10"
                          style={{
                            color: "#00FFFF",
                            border: "1px solid rgba(0,255,255,0.3)",
                          }}
                        >
                          VIEW →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs tracking-wider" style={{ color: "rgba(207,255,255,0.4)" }}>
              No jobs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
