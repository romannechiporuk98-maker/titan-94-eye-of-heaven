import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Briefcase, 
  PlusCircle, 
  ExternalLink,
  Shield,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Job Explorer", icon: Briefcase },
  { href: "/create", label: "Create Job", icon: PlusCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Activity className="h-6 w-6" />
            <span>ENACT Ops</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="mb-4 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Blockchain Context
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">TON Factory Contract</div>
              <a 
                href="https://tonviewer.com/EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                EQAF...ECjX <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Jetton Factory</div>
              <a 
                href="https://tonviewer.com/EQCgYmwi8uwrG7I6bI3Cdv0ct-bAB1jZ0DQ7C3dX3MYn6VTj" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                EQCg...VTj <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Default AI Evaluator
              </div>
              <div className="text-xs font-mono text-sidebar-foreground truncate" title="UQCDP52RhgJmylkjOBSJGqCsaTwRo9XFzrr6opHUg4mqkQAu">
                UQCD...QAu
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
