# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (provisioned but schema is empty — all data comes from TON blockchain)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind v4, shadcn/ui, wouter, TanStack Query)

## Project: ENACT Protocol Dashboard

A web dashboard explorer for the [ENACT Protocol](https://www.enact.info) — a trustless on-chain escrow system enabling AI agents to create jobs, lock funds, deliver work, and get paid on the TON blockchain.

### Key Features

- **Protocol Overview**: Real-time stats (total volume, job counts, completion rate, avg eval time)
- **Job Explorer**: Browse and filter all ENACT jobs with state badges (OPEN, FUNDED, SUBMITTED, COMPLETED, DISPUTED, CANCELLED)
- **Job Detail**: Full lifecycle timeline, address info, links to TON explorer (tonviewer.com)
- **Create Job**: Form that generates a Tonkeeper deeplink to sign the transaction with your TON wallet

### ENACT Protocol Context

- **JobFactory**: `EQAFHodWCzrYJTbrbJp1lMDQLfypTHoJCd0UcerjsdxPECjX`
- **JettonJobFactory (USDT)**: `EQCgYmwi8uwrG7I6bI3Cdv0ct-bAB1jZ0DQ7C3dX3MYn6VTj`
- **Default AI Evaluator**: `UQCDP52RhgJmylkjOBSJGqCsaTwRo9XFzrr6opHUg4mqkQAu`
- **Job States**: OPEN → FUNDED → SUBMITTED → COMPLETED | DISPUTED | CANCELLED
- **0% protocol fee** — all funds go to the provider

## Project: Titan_94 Autonomous TON AI Agent

A self-contained autonomous agent (`Titan_94_agent/`) that runs outside the pnpm monorepo. It uses its own `npm` + `node_modules`.

### Key Features

- **Gemini AI Core**: Contract vulnerability analysis + Telegram message classification
- **TON Scanner**: Monitors newly deployed contracts via TONAPI, runs Bug Bounty scans every 5 min
- **Bug Bounty Hunter**: Deduplicates and tracks findings (critical/high/medium/low)
- **Telegram Bot**: `/scan <addr>`, `/status`, `/report`, `/bounty` commands + auto-broadcasts
- **Autonomous Loop**: Scan cycle (5 min) + report cycle (1 hour) — runs 24/7
- **Health Server**: `GET /health` on port 3000

### Smart Contracts (Tact)

- `GenesisTitan.tact` — Knowledge hash storage + self-funding (20% balance → owner)
- `Titan94Agent.tact` — Counter + owner access control

### Titan_94 Required Secrets

```
GEMINI_API_KEY           — Google AI Studio
TELEGRAM_BOT_TOKEN       — @BotFather
TELEGRAM_ADMIN_CHAT_ID   — Your Telegram ID
TON_API_KEY              — toncenter.com (optional)
TONAPI_KEY               — tonapi.io (optional)
TON_MNEMONIC             — 24-word wallet mnemonic (optional)
```

### Workflow

`Titan_94: Autonomous Agent` — runs `cd Titan_94_agent && node agent.js`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   └── enact-dashboard/    # React + Vite frontend (port 20474)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── Titan_94_agent/         # Autonomous TON AI Agent (standalone npm project)
│   ├── agent.js            # Main entry point — all modules in one file
│   ├── contracts/          # GenesisTitan.tact, Titan94Agent.tact
│   ├── package.json        # telegraf, @ton/*, @google/generative-ai
│   ├── .env.example        # All required environment variables
│   └── README.md           # Architecture + hackathon docs
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/healthz` — Health check
- `GET /api/jobs` — List jobs (with ?state=, ?type=, ?limit=, ?offset= filters)
- `GET /api/jobs/:address` — Get job details by contract address
- `POST /api/jobs/create-link` — Generate Tonkeeper deeplink for job creation
- `GET /api/stats` — Protocol aggregate statistics

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for validation.

- `src/routes/jobs.ts` — ENACT job routes
- `src/routes/stats.ts` — Protocol statistics
- `src/lib/ton.ts` — TON blockchain helper, ENACT factory addresses, demo data

### `artifacts/enact-dashboard` (`@workspace/enact-dashboard`)

React + Vite frontend for the ENACT dashboard.

- `src/pages/home.tsx` — Protocol overview with stats
- `src/pages/jobs.tsx` — Job explorer with filters
- `src/pages/job-detail.tsx` — Individual job detail page
- `src/pages/create-job.tsx` — Create job form with Tonkeeper deeplink

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM. Schema is empty (no DB tables needed — all data is on-chain).

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec for the ENACT dashboard API. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` and `lib/api-client-react`

Generated Zod schemas and React Query hooks from the OpenAPI spec.
