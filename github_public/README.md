# TITAN-94 «ОКО НЕБЕСНЕ» 🛡️

**Autonomous AI Security Organism for the TON Blockchain**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://typescriptlang.org)
[![TON](https://img.shields.io/badge/Blockchain-TON-blue.svg)](https://ton.org)
[![Status](https://img.shields.io/badge/Status-Live%20Production-brightgreen.svg)]()

> TITAN-94 continuously scans TON smart contracts for vulnerabilities, heals them using AI-powered strategies, monitors TON infrastructure health, and generates revenue — 24/7, without human intervention.

---

## Live Stats

| Metric | Value |
|--------|-------|
| Threats Detected | 172+ |
| Threats Healed | 104+ |
| Detection Accuracy | 90.3% |
| Knowledge Patterns | 280+ |
| TON Blocks Analyzed | 64M+ |
| Languages Supported | 6 |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  TITAN-94 ECOSYSTEM                  │
│                                                       │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Autonomous  │    │      ENACT Dashboard      │   │
│  │    Agent     │◄──►│   React + Vite + TanStack │   │
│  │  (Node.js)   │    │      25+ pages, 6 langs   │   │
│  └──────┬───────┘    └──────────────────────────┘   │
│         │                          ▲                  │
│  ┌──────▼───────────────────────── │ ───────────┐    │
│  │           API Server            │            │    │
│  │     Express 5 + PostgreSQL      │            │    │
│  │        40+ endpoints            │            │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  AI Models: Gemini 2.0 Flash | GPT-4o | Claude 3.5  │
│  Blockchain: TonCenter API v3 + TONAPI + TON Connect │
└─────────────────────────────────────────────────────┘
```

### Autonomous Cycles

| Cycle | Interval | Description |
|-------|----------|-------------|
| **SCAN** | 3 min | Reads new TON blocks, detects vulnerabilities via pattern matching |
| **HEAL** | 5 min | AI-powered vulnerability remediation via Gemini |
| **LEARN** | 7 min | Extracts new attack patterns, grows knowledge base |
| **FINANCE** | 10 min | Subscription management, revenue tracking |

---

## Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL 16+
- Gemini API key (for HEAL/LEARN cycles)
- Telegram Bot Token (for notifications)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/titan-94.git
cd titan-94

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# 4. Set up the database
pnpm --filter @workspace/api-server run db:migrate

# 5. Start the API server
pnpm --filter @workspace/api-server run dev

# 6. Start the dashboard
pnpm --filter @workspace/enact-dashboard run dev

# 7. Start the autonomous agent
cd Titan_94_agent && node agent.js
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/titan94

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key        # Optional: GPT-4o
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional: Claude
OPENROUTER_API_KEY=your_or_api_key        # Optional: Llama via OpenRouter

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Binance (for auto-trade feature)
BINANCE_API_KEY=your_binance_key          # Optional
BINANCE_API_SECRET=your_binance_secret    # Optional

# Server
PORT=8080
NODE_ENV=production
```

---

## Project Structure

```
titan-94/
├── artifacts/
│   ├── api-server/          # Express 5 API (port 8080)
│   │   ├── src/
│   │   │   ├── routes/      # 30+ route files
│   │   │   ├── services/    # Business logic (heartbeat, store, etc.)
│   │   │   └── index.ts     # Server entry point
│   └── enact-dashboard/     # React + Vite frontend
│       └── src/
│           ├── pages/       # 25+ page components
│           ├── components/  # Shared components (layout, splash, etc.)
│           └── lib/         # Utils (ui-prefs, telegram, etc.)
├── lib/
│   ├── api-spec/            # OpenAPI specification
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + migrations
├── Titan_94_agent/          # Autonomous agent (standalone)
│   ├── agent.js             # Main agent logic (~800 lines)
│   └── contracts/           # TON smart contracts (.tact)
└── grant_titan94/           # Grant application materials
```

---

## API Reference

Base URL: `https://your-domain.com/api`

### Key Endpoints

```
GET  /api/agent/stats          # Agent performance metrics
GET  /api/agent/cycles         # Cycle execution history
GET  /api/vulnerabilities      # Threat registry (paginated)
POST /api/vulnerabilities/heal # Trigger HEAL cycle for specific vuln
GET  /api/ton/chain-stats      # TON blockchain metrics
GET  /api/ton/infra-status     # TON ecosystem health (11 services)
GET  /api/nexus/models         # Available AI models
POST /api/nexus/orchestra      # Multi-model AI consensus query
POST /api/auth/register        # Register/update user
POST /api/auth/web3-connect    # Register via TON wallet (no Telegram)
GET  /api/billing/balance/:id  # User balance in TON
```

Full API documentation: [docs/API.md](docs/API.md)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) before submitting.

---

## License

MIT License — see [LICENSE](LICENSE) file.

---

## Grant

This project is supported by [TON Foundation Ecosystem Fund](https://society.ton.org/grants).  
See [grant_titan94/](../grant_titan94/) for grant materials.

---

## Contact

- **Developer:** DEI GRATIA Roman
- **Telegram:** @Cryptoagentton
- **Bot:** @Titan_94_agent_bot

---

*TITAN-94 · Protocol 94 · DEI GRATIA · © 2025 · Built for TON*
