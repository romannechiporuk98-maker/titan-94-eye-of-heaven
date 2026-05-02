import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.label ?? "unknown", error.message, info.componentStack?.slice(0, 300));
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="p-3 flex items-center gap-2 text-xs"
          style={{ border: "1px solid rgba(255,51,85,0.3)", background: "rgba(255,51,85,0.05)", borderRadius: 4 }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#FF3355" }} />
          <span className="font-mono truncate" style={{ color: "#FF3355" }}>
            {this.state.error?.message ?? "Component error"}
          </span>
          <button onClick={this.reset} className="ml-auto shrink-0 text-muted hover:text-foreground transition">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <div className="titan-card my-4"
        style={{ borderColor: "rgba(255,51,85,0.3)", background: "rgba(255,51,85,0.04)" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FF3355" }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold tracking-wider mb-1" style={{ color: "#FF3355" }}>
              ⚠ {this.props.label ?? "MODULE ERROR"} — ISOLATED
            </div>
            <div className="text-xs text-muted font-mono break-all mb-2">
              {this.state.error?.message ?? "Unknown error"}
            </div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Цей модуль ізольовано. Решта системи продовжує працювати.
            </div>
          </div>
          <button onClick={this.reset} className="titan-btn titan-btn-sm shrink-0"
            style={{ borderColor: "rgba(255,51,85,0.4)", color: "#FF3355" }}>
            <RefreshCw className="w-3 h-3 mr-1" />Retry
          </button>
        </div>
      </div>
    );
  }
}
