import { useParams } from "wouter";
import { useGetJob, getGetJobQueryKey } from "@workspace/api-client-react";
import { JobStateBadge } from "@/components/job-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowLeft, Clock, Copy, CheckCircle2, Activity } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LIFECYCLE_STATES = [
  "OPEN",
  "FUNDED",
  "SUBMITTED",
  "COMPLETED"
];

function CopyableText({ text, truncate = false }: { text: string, truncate?: boolean }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex items-center gap-2 group">
      <span className={cn("font-mono text-sm bg-secondary px-2 py-1 rounded", truncate && "truncate max-w-[200px] sm:max-w-md")}>
        {text}
      </span>
      <button 
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Copy"
      >
        {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function JobDetail() {
  const params = useParams<{ address: string }>();
  const address = params.address || "";
  
  const { data: job, isLoading, error } = useGetJob(address, {
    query: { queryKey: getGetJobQueryKey(address), enabled: !!address }
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Job Not Found</h2>
        <p className="text-muted-foreground">Could not load details for address {address}</p>
        <Link href="/jobs">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Explorer
          </Button>
        </Link>
      </div>
    );
  }

  const currentStateIndex = LIFECYCLE_STATES.indexOf(job.state);
  const isDisputed = job.state === "DISPUTED";
  const isCancelled = job.state === "CANCELLED";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Job #{job.jobId}</h1>
            <JobStateBadge state={job.state} className="text-sm px-2 py-1" />
            <span className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded">
              {job.type}
            </span>
          </div>
          <a 
            href={job.tonviewerUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-sm font-mono text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            {job.address} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-muted-foreground mb-1">Budget</div>
          <div className="text-3xl font-bold font-mono text-primary">
            {job.type === 'TON' ? job.budgetTon : job.budgetUsdt} {job.type}
          </div>
        </div>
      </div>

      {/* State Machine Visualization */}
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" /> Lifecycle State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-secondary -translate-y-1/2 z-0 hidden sm:block"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
              {LIFECYCLE_STATES.map((state, index) => {
                let statusClass = "bg-secondary text-muted-foreground border-secondary-border";
                let statusIcon = null;
                
                if (job.state === state) {
                  statusClass = "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20";
                } else if (currentStateIndex > index && !isDisputed && !isCancelled) {
                  statusClass = "bg-primary/20 text-primary border-primary/30";
                  statusIcon = <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-primary bg-background rounded-full" />;
                } else if ((isDisputed || isCancelled) && state === "COMPLETED") {
                  // If terminal state is not completed
                } else if (currentStateIndex > index || index === 0) {
                  statusClass = "bg-primary/20 text-primary border-primary/30";
                }

                if (isDisputed && state === "COMPLETED") {
                  if (job.state === "DISPUTED") {
                    return (
                      <div key="DISPUTED" className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-4 h-4 rounded-full bg-destructive border-2 border-destructive ring-4 ring-destructive/20 relative"></div>
                        <span className="text-xs font-bold text-destructive">DISPUTED</span>
                      </div>
                    );
                  }
                }
                
                if (isCancelled && state === "COMPLETED") {
                  if (job.state === "CANCELLED") {
                    return (
                      <div key="CANCELLED" className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-500 ring-4 ring-zinc-500/20 relative"></div>
                        <span className="text-xs font-bold text-zinc-400">CANCELLED</span>
                      </div>
                    );
                  }
                }

                return (
                  <div key={state} className="flex flex-col items-center gap-2 flex-1 bg-card/80 sm:bg-transparent py-2 sm:py-0 rounded">
                    <div className={cn("w-4 h-4 rounded-full border-2 relative transition-all", statusClass)}>
                      {statusIcon}
                    </div>
                    <span className={cn(
                      "text-xs font-bold tracking-wider", 
                      job.state === state ? "text-primary" : "text-muted-foreground"
                    )}>
                      {state}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm leading-relaxed border border-border/50 whitespace-pre-wrap">
                {job.descriptionText || <span className="text-muted-foreground italic">No description provided</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Description Hash:</span>
                <span className="text-xs font-mono text-muted-foreground truncate" title={job.descriptionHash}>
                  {job.descriptionHash}
                </span>
              </div>
            </div>

            {job.resultHash && (
              <div className="space-y-2 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Result Submitted
                </h3>
                <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border/50 break-all">
                  Hash: <a href={`https://tonviewer.com/${job.resultHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{job.resultHash}</a>
                </div>
                {job.submittedAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 
                    Submitted on {new Date(job.submittedAt * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</div>
                <CopyableText text={job.client} truncate />
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Provider</div>
                {job.provider ? (
                  <CopyableText text={job.provider} truncate />
                ) : (
                  <span className="text-xs italic text-muted-foreground bg-secondary/30 px-2 py-1 rounded inline-block">Unassigned</span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evaluator</div>
                <CopyableText text={job.evaluator} truncate />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Created</span>
                <span className="font-mono">{new Date(job.createdAt * 1000).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Execution Timeout</span>
                <span className="font-mono">{Math.floor(job.timeout / 3600)}h</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Eval Timeout</span>
                <span className="font-mono">{Math.floor(job.evalTimeout / 3600)}h</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
