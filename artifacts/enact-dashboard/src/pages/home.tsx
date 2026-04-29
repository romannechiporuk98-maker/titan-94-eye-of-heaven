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

        <div className="rounded-md border border-border bg-card">
          {jobsLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobsData?.jobs && jobsData.jobs.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">State</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Budget</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {jobsData.jobs.map((job) => (
                    <tr key={job.address} className="border-b border-border transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-mono">#{job.jobId}</td>
                      <td className="p-4 align-middle">
                        <JobStateBadge state={job.state} />
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                          {job.type}
                        </span>
                      </td>
                      <td className="p-4 align-middle font-mono">
                        {job.type === 'TON' ? job.budgetTon : job.budgetUsdt}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {new Date(job.createdAt * 1000).toLocaleString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link href={`/jobs/${job.address}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No jobs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
