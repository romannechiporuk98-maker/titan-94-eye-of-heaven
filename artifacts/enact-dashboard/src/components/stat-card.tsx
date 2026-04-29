import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * TITAN-94 cyberpunk stat card.
 * Uses inline cyber palette so it stays consistent on every theme/route
 * and doesn't get clobbered by Tailwind shadcn light tokens.
 */
export function StatCard({ title, value, description, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 transition-all backdrop-blur",
        "hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.08)]",
        className
      )}
      style={{
        background: "linear-gradient(180deg, rgba(6,15,26,0.85) 0%, rgba(3,13,24,0.9) 100%)",
        borderColor: "rgba(0,255,255,0.15)",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] font-medium tracking-wider uppercase"
          style={{ color: "rgba(207,255,255,0.55)" }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ color: "rgba(0,255,255,0.7)" }}>
            {icon}
          </span>
        )}
      </div>
      <div
        className="text-2xl font-bold tabular-nums leading-tight"
        style={{ color: "#CFFFFF", textShadow: "0 0 12px rgba(0,255,255,0.25)" }}
      >
        {value}
      </div>
      {description && (
        <div
          className="text-[10px] mt-1.5 tracking-wide"
          style={{ color: "rgba(207,255,255,0.45)" }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
