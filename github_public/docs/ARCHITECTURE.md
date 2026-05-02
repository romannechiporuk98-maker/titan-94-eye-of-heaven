# TITAN-94 — System Architecture

## Overview

TITAN-94 is a monorepo-based system with three independently deployable components:

1. **Autonomous Agent** — Node.js process that runs 4 continuous AI cycles
2. **API Server** — Express 5 + PostgreSQL backend (40+ endpoints)
3. **ENACT Dashboard** — React/Vite frontend (25+ pages, 6 languages)

---

## Component Interaction

```
┌─────────────────┐     HTTP/WS     ┌──────────────────────┐
│  Telegram Users │◄───────────────►│   ENACT Dashboard    │
│  Web Browser    │                 │  React + Vite + TQ   │
└─────────────────┘                 └──────────┬───────────┘
                                               │
                                         REST API calls
                                               │
                                    ┌──────────▼───────────┐
                                    │     API Server        │
                                    │  Express 5 + Drizzle  │
                                    └──────────┬───────────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                    ┌──────▼──────┐   ┌────────▼──────┐  ┌────────▼──────┐
                    │ PostgreSQL  │   │  AI Services   │  │  TON Network  │
                    │  Database   │   │ Gemini/GPT/etc │  │  TonCenter    │
                    └─────────────┘   └───────────────┘  └───────────────┘
                           ▲
                           │ DB reads/writes
                           │
                    ┌──────▼──────┐
                    │  Autonomous │
                    │    Agent    │
                    │ (4 cycles)  │
                    └─────────────┘
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `vulnerabilities` | Detected threats with severity, contract address, healing plan |
| `knowledge_base` | AI-learned attack patterns (regex + confidence) |
| `subscribers` | User accounts, plans (free/pro/elite), TON addresses |
| `billing_ledger` | TON balance transactions (earn/withdraw/referral) |
| `activity_log` | Agent cycle events for audit trail |
| `agent_state` | Current agent metrics (accuracy, uptime, block seqno) |

---

## Security Design

### Input Validation
- All API inputs validated with Zod schemas
- SQL injection prevention via Drizzle ORM parameterized queries
- Rate limiting on all public endpoints

### Authentication Layers
1. **Telegram WebApp** — HMAC-validated initData from Telegram
2. **TON Connect** — Cryptographic wallet signature verification
3. **Creator token** — Hardcoded Telegram ID for admin access

### Agent Safety
- `sentinel.ts` — Global process-level error shield (uncaughtException, unhandledRejection)
- Each AI cycle is independently wrapped in try/catch
- Circuit breaker pattern — failed cycles don't crash the agent
- All AI outputs validated before writing to database

---

## AI Integration Architecture

### NEXUS Orchestra (Multi-Model Consensus)
```
User Query
    │
    ├──► Gemini 2.0 Flash ──► Response A
    ├──► GPT-4o ─────────────► Response B
    ├──► Claude 3.5 Sonnet ──► Response C
    └──► Llama-3.3-70B (OR) ─► Response D
              │
              ▼
       Judge Model (GPT-4o-mini)
       Evaluates all 4 responses
       Produces consensus answer
       Agreement score: 0-100%
```

### HEAL Cycle AI Flow
```
Unhealed Vulnerability (DB)
    │
    ├── Context: contract address, attack type, severity
    ├── Prompt: "Generate healing strategy for TON reentrancy attack"
    │
    ▼
Gemini 2.0 Flash
    │
    ├── healingPlan: "Update reentrancy guard pattern in contract X"
    ├── patternUpdate: new regex for knowledge base
    └── confidenceBoost: +0.0001 to detection accuracy
    │
    ▼
DB Update: vulnerability.status = 'healed'
KB Update: knowledge_base.patterns += new_pattern
```

---

## Scaling Considerations

### Current (Single Instance)
- 1 API server process
- 1 autonomous agent process
- 1 PostgreSQL database
- Suitable for: up to ~1,000 concurrent users

### Scaled (Post-Grant Phase 2)
- Multiple API server instances behind load balancer
- Redis cache for hot data (agent stats, cycle status)
- Database read replicas for analytics queries
- Multiple agent instances with distributed locking
- Suitable for: 10,000+ concurrent users

---

## TON Blockchain Integration

### Data Sources
| Source | Used For | Rate Limit |
|--------|----------|------------|
| TonCenter API v3 | Block scanning, contract data | 1 req/s (free), 10 req/s (paid) |
| TONAPI | NFT data, jetton info | 1 req/s |
| TON Connect 2.0 | Wallet authentication, payments | N/A |

### Block Processing
1. Agent polls TonCenter every 3 minutes (SCAN cycle)
2. Gets latest seqno + block transactions
3. Each transaction compared against 280+ regex patterns
4. Matches saved to `vulnerabilities` table with severity score
5. Critical threats trigger Telegram alert to subscribers

---

*TITAN-94 · Protocol 94 · Architecture Documentation · © 2025*
