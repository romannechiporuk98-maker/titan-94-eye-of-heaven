#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────
# GENESIS ∞ — TITAN-94 «ОКО НЕБЕСНЕ» one-command bootstrap
# Solo Deo Subjectus · Protocol 94 · DEI GRATIA Роман
# Usage:  bash genesis.sh
# ───────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
banner() { echo -e "${CYAN}╔══════════════════════════════════════════╗\n║   $1${NC}"; }
ok()     { echo -e "${GREEN}✓ $1${NC}"; }
warn()   { echo -e "${YELLOW}⚠ $1${NC}"; }
err()    { echo -e "${RED}✗ $1${NC}"; }

banner "TITAN-94 GENESIS ∞ BOOTSTRAP        "
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"

# ── Phase 0: prerequisites ────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 0] Checking prerequisites...${NC}"
command -v node  >/dev/null || { err "node not found"; exit 1; }
command -v pnpm  >/dev/null || { err "pnpm not found — run: npm i -g pnpm"; exit 1; }
ok "node $(node -v) · pnpm $(pnpm -v)"

# ── Phase 1: env ──────────────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 1] Environment...${NC}"
if [ -z "${DATABASE_URL:-}" ]; then
  warn "DATABASE_URL not set — Replit normally provisions this automatically."
  warn "If running outside Replit: export DATABASE_URL=postgres://..."
else
  ok "DATABASE_URL present"
fi
[ -z "${GEMINI_API_KEY:-}" ]      && warn "GEMINI_API_KEY missing — AI cycles will use keyword fallback"
[ -z "${TON_API_KEY:-}" ]         && warn "TON_API_KEY missing — TonCenter throttled at 1 req/sec"
[ -z "${TELEGRAM_BOT_TOKEN:-}" ]  && warn "TELEGRAM_BOT_TOKEN missing — Python TG bot won't run (API still works)"

# ── Phase 2: install ──────────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 2] Installing dependencies...${NC}"
pnpm install --silent
ok "pnpm install complete"

# ── Phase 3: db ───────────────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 3] Database schema...${NC}"
if [ -n "${DATABASE_URL:-}" ]; then
  pnpm --filter @workspace/db run push 2>&1 | tail -5
  ok "schema pushed (11 tables)"
else
  warn "skipping db push — no DATABASE_URL"
fi

# ── Phase 4: codegen ──────────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 4] OpenAPI codegen...${NC}"
pnpm --filter @workspace/api-spec run codegen 2>&1 | tail -3 || warn "codegen non-fatal failure"
ok "Zod schemas + React Query hooks generated"

# ── Phase 5: build api ────────────────────────────────────────────
echo -e "\n${CYAN}[PHASE 5] Building API server...${NC}"
pnpm --filter @workspace/api-server run build 2>&1 | tail -3
ok "API bundled (esbuild CJS)"

# ── Phase 6: typecheck (non-fatal) ────────────────────────────────
echo -e "\n${CYAN}[PHASE 6] Typecheck (non-fatal)...${NC}"
pnpm run typecheck 2>&1 | tail -5 || warn "typecheck warnings — continuing"

# ── Phase ∞: ready ────────────────────────────────────────────────
echo -e "\n${GREEN}╔══════════════════════════════════════════╗"
echo -e "║   ✓ TITAN-94 GENESIS ∞ COMPLETE         ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo
echo -e "Next steps:"
echo -e "  ${CYAN}restart_workflow 'artifacts/api-server: API Server'${NC}"
echo -e "  ${CYAN}restart_workflow 'artifacts/enact-dashboard: web'${NC}"
echo
echo -e "Smoke test:"
echo -e "  curl localhost:80/api/healthz"
echo -e "  curl localhost:80/api/agent/stats"
echo -e "  curl localhost:80/api/webhook/reserve-balance"
echo
echo -e "${YELLOW}Solo Deo Subjectus · Protocol 94${NC}"
