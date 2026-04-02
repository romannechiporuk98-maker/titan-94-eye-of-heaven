import { Badge } from "@/components/ui/badge";
import { JobState } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";

interface JobStateBadgeProps {
  state: JobState;
  className?: string;
}

export function JobStateBadge({ state, className }: JobStateBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-mono text-xs uppercase tracking-wider py-0.5",
        state === "OPEN" && "border-blue-500/30 text-blue-400 bg-blue-500/10",
        state === "FUNDED" && "border-amber-500/30 text-amber-400 bg-amber-500/10",
        state === "SUBMITTED" && "border-purple-500/30 text-purple-400 bg-purple-500/10",
        state === "COMPLETED" && "border-green-500/30 text-green-400 bg-green-500/10",
        state === "DISPUTED" && "border-red-500/30 text-red-400 bg-red-500/10",
        state === "CANCELLED" && "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
        className
      )}
    >
      {state}
    </Badge>
  );
}
