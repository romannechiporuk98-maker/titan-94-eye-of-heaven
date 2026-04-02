import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { JobStateBadge } from "@/components/job-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, Filter } from "lucide-react";
import { JobState, ListJobsState, ListJobsType } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Jobs() {
  const [stateFilter, setStateFilter] = useState<ListJobsState | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ListJobsType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const queryParams = {
    ...(stateFilter !== "ALL" ? { state: stateFilter } : {}),
    ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
    limit: 50
  };

  const { data, isLoading } = useListJobs(queryParams, {
    query: { queryKey: getListJobsQueryKey(queryParams) }
  });

  const jobs = data?.jobs || [];
  
  // Client-side search filtering
  const filteredJobs = jobs.filter(job => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      job.address.toLowerCase().includes(searchLower) ||
      job.client.toLowerCase().includes(searchLower) ||
      job.jobId.toString().includes(searchLower)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Explorer</h1>
        <p className="text-muted-foreground">
          Browse and filter all jobs created on the ENACT Protocol.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID or Address..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={stateFilter} 
            onValueChange={(val) => setStateFilter(val as ListJobsState | "ALL")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              {Object.values(JobState).map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={typeFilter} 
            onValueChange={(val) => setTypeFilter(val as ListJobsType | "ALL")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="TON">TON</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/20">
              <tr className="border-b border-border transition-colors">
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">ID</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">State</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Budget</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Address</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="p-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.address} className="border-b border-border transition-colors hover:bg-muted/50 group cursor-pointer">
                    <td className="px-6 py-4 align-middle font-mono font-medium text-foreground">
                      <Link href={`/jobs/${job.address}`}>
                        #{job.jobId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <Link href={`/jobs/${job.address}`}>
                        <JobStateBadge state={job.state} />
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <Link href={`/jobs/${job.address}`}>
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-secondary-foreground border border-secondary-border">
                          {job.type}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle font-mono">
                      <Link href={`/jobs/${job.address}`}>
                        {job.type === 'TON' ? job.budgetTon : job.budgetUsdt}
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <Link href={`/jobs/${job.address}`}>
                        <span className="font-mono text-xs text-muted-foreground" title={job.address}>
                          {job.address.slice(0, 6)}...{job.address.slice(-4)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle text-muted-foreground">
                      <Link href={`/jobs/${job.address}`}>
                        {new Date(job.createdAt * 1000).toLocaleString(undefined, { 
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <Link href={`/jobs/${job.address}`} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-muted-foreground">
                    No jobs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
