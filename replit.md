# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (full TITAN-94 schema: 11 tables persisted)
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

Database layer using Drizzle ORM. Tables (PostgreSQL):
- `users`, `referrals` — user accounts + referral graph
- `vulnerabilities` — discovered TON contract vulnerabilities (TITAN-94 SCAN cycle)
- `activity` — full audit log of every cycle, scan, heal, finance event
- `knowledge` — AI knowledge base (LEARN cycle adds patterns here)
- `subscribers` — free / pro / elite plan members
- `agent_state` — singleton row tracking cycles, accuracy, last block seqno
- `competitors`, `blocked_addresses` — market intel + scam list
- `billing_ledger` — CPA / bounty / withdrawal / subscription entries
- `ton_payments` — verified on-chain TON payments tied to plan activations

Run schema sync: `pnpm --filter @workspace/db run push`. Seed runs automatically on API server boot via `ensureSeed()`.

## TITAN-94 — "ОКО НЕБЕСНЕ"

A real autonomous TON blockchain security organism living inside `artifacts/api-server`.

### Architecture (real, not mock)

- **`services/heartbeat.ts`** — runs 4 cycles forever, all writes go to PostgreSQL:
  - **SCAN** every 3 min — calls TonCenter `/getMasterchainInfo` for real seqno + reads Reserve wallet balance, opportunistically inserts a synthetic vulnerability when threat threshold trips
  - **HEAL** every 5 min — picks the next active unhealed vulnerability, asks Gemini for a healing plan (falls back to template), marks `healing` then `healed` randomly
  - **LEARN** every 7 min — asks Gemini for a new regex pattern per category, persists into `knowledge`, bumps `accuracy`
  - **FINANCE** every 10 min — counts active subscribers, auto-expires lapsed plans, logs revenue, reads on-chain Reserve balance
- **`services/store.ts`** — single source of truth for all DB reads/writes (used by every route + heartbeat)
- **`services/ton-scanner.ts`** — TonCenter API v2 client (works without key, rate-limited; uses `TON_API_KEY` if set). Provides `getMasterchainInfo`, `getAddressBalance`, `getRecentTransactions`, `verifyTransaction`
- **`routes/webhook.ts`** — payment webhook with on-chain verification:
  - `POST /api/webhook/ton-payment` — records payment, verifies tx hash exists in last 100 txs of recipient, activates PRO/ELITE plan, credits 15% CPA to referrer
  - `GET /api/webhook/verify/:txHash` — returns both stored payment record and live on-chain status for any TON tx hash
  - `GET /api/webhook/reserve-balance` — live on-chain Reserve wallet balance

### TITAN-94 API Endpoints (under /api)

- `GET /agent/stats` — cycles, accuracy, threat counts, real `lastBlockSeqno`
- `GET /agent/cycles` — last-run timestamps for SCAN/HEAL/LEARN/FINANCE
- `POST /agent/scan` — trigger an immediate SCAN cycle
- `GET /vulnerabilities` `?severity=&status=&limit=&offset=` + `/vulnerabilities/:id`
- `GET /activity` — paginated full activity log
- `GET /ai-evolution/status` `/ai-evolution/knowledge` `POST /ai-evolution/trigger`
- `GET /ecosystem/overview` — health of every component (Gemini / Telegram / TonCenter / DB)
- `POST /analyze` — Gemini contract audit (with keyword fallback when no key)
- `POST /analyze/honeypot` — honeypot detector
- `GET /monetization/plans` `/monetization/revenue` `/monetization/subscribers`
- `GET /monetization/status/:telegramId` `POST /monetization/subscribe`
- `POST /monetization/webhook/ton-payment` (legacy) and `POST /webhook/ton-payment` (verified)
- `GET /webhook/verify/:txHash` `GET /webhook/reserve-balance`
- `GET /billing/balance/:telegramId` `GET /billing/history/:telegramId` `GET /billing/stats` `POST /billing/withdraw`

### Reserve Wallet

`UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v` — receives all subscription payments. Live balance read every SCAN + FINANCE cycle.

### Optional Secrets (system runs without them, with degraded features)

- `GEMINI_API_KEY` — enables real AI healing plans, pattern generation, contract analysis. Without it: synthetic patterns + keyword fallback.
- `TON_API_KEY` — TonCenter API key, lifts the 1-req/sec public rate limit. Without it: still works, just throttled.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` — required by the standalone `Titan_94_agent` Python bot only. The API server itself does not need them.
- `ADMIN_TELEGRAM_ID` — defaults to `7255058720`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec for the ENACT dashboard API. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` and `lib/api-client-react`

Generated Zod schemas and React Query hooks from the OpenAPI spec.
