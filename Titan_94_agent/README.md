# 🤖 Titan_94 — Autonomous TON AI Agent

> An autonomous AI agent that hunts smart contract vulnerabilities on the TON blockchain, classifies ecosystem activity, and delivers real-time intelligence via Telegram — powered by Gemini AI.

---

## 🏆 Hackathon Project Overview

**Titan_94** is a fully autonomous agent that runs 24/7 without human intervention. It combines the power of Google Gemini AI with TON blockchain monitoring and Telegram automation to create a self-sustaining security intelligence system.

### Core Value Proposition
- **Bug Bounty Automation**: Continuously scans newly deployed TON contracts for vulnerabilities
- **AI-Powered Analysis**: Gemini 2.0 Flash analyzes contract code for security issues
- **Real-Time Alerts**: Instantly notifies via Telegram when critical vulnerabilities are found
- **TON Ecosystem Intelligence**: Classifies and tracks all significant events in the TON ecosystem
- **Zero Maintenance**: Runs autonomously — starts, scans, reports, and recovers from errors without intervention

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     TITAN_94 AGENT                       │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Gemini Core│    │ TON Scanner │    │  Bug Bounty │  │
│  │  (AI Brain) │◄──►│ (Blockchain)│◄──►│   Hunter    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │              Autonomous Event Loop                  │  │
│  │  Scan every 5min → Analyze → Alert → Report/1hr   │  │
│  └──────────────────────────┬──────────────────────── ┘  │
│                             │                            │
│  ┌──────────────────────────▼──────────────────────── ┐  │
│  │              Telegram Agent                         │  │
│  │  Commands: /scan /status /report /bounty           │  │
│  └─────────────────────────────────────────────────── ┘  │
└──────────────────────────────────────────────────────────┘
```

### Key Modules

| Module | File | Responsibility |
|--------|------|----------------|
| `GeminiCore` | `agent.js` | AI analysis — contract security + message classification |
| `TonScanner` | `agent.js` | TON blockchain monitoring via TONAPI |
| `BugBountyHunter` | `agent.js` | Tracks, deduplicates and formats vulnerability findings |
| `TelegramAgent` | `agent.js` | Bot commands + alert broadcasting |
| `AutonomousLoop` | `agent.js` | 24/7 scan + report cycles |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd Titan_94_agent
npm install
```

### 2. Set environment variables (Replit Secrets)
```
GEMINI_API_KEY       — From https://aistudio.google.com/app/apikey
TELEGRAM_BOT_TOKEN   — From @BotFather on Telegram
TELEGRAM_ADMIN_CHAT_ID — Your Telegram chat ID (from @userinfobot)
TON_API_KEY          — From https://toncenter.com (optional but recommended)
```

### 3. Run the agent
```bash
npm start
```

The agent will:
1. Initialize Gemini AI and TON connection
2. Launch the Telegram bot
3. Send a startup notification to your Telegram
4. Begin the autonomous scan → analyze → report loop

---

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + command list |
| `/scan <address>` | Deep-scan any TON contract with Gemini AI |
| `/status` | Agent stats: scanned, found, model info |
| `/report` | Generate an on-demand AI intelligence report |
| `/bounty` | Bug bounty findings summary |
| `/ping` | Check agent is alive |

**Natural language**: Send any message to the bot and it will classify it (scam/alpha/defi/ton/ai/neutral).

---

## 🔐 Smart Contracts

### GenesisTitan.tact
- Stores an AI knowledge hash on-chain
- Self-funding: autonomously refills compute budget from contract balance
- Updateable by the AI operator (owner)

### Titan94Agent.tact
- Simple counter + owner pattern
- Foundation for future autonomous on-chain actions

### Deploy to TON Mainnet
```bash
npm run build           # Compile Tact contracts
npm run deploy:mainnet  # Deploy GenesisTitan (requires TON_MNEMONIC)
```

---

## 🛡️ Security Analysis Capabilities

Titan_94 detects the following vulnerability classes in TON smart contracts:

- **Unchecked Sends** — Funds sent without validation
- **Missing Access Control** — No `require(sender() == owner)` guards
- **Balance Drain Risks** — Direct balance exposure
- **Reentrancy Patterns** — Unsafe cross-contract calls
- **Integer Overflow** — Unchecked arithmetic
- **Improper Bounce Handling** — TON-specific: missing bounce handlers
- **Front-Running Vulnerabilities** — State changes before value transfer

Each finding includes: severity (critical/high/medium/low), affected code location, impact description, and remediation advice.

---

## 📊 Autonomous Operation

The agent runs two independent cycles:

**Scan Cycle** (every 5 minutes):
1. Fetches recently deployed TON contracts via TONAPI
2. For each contract: fetches source/bytecode → sends to Gemini for analysis
3. Critical/High findings → immediate Telegram alert
4. All findings stored in memory for reporting

**Report Cycle** (every 1 hour):
1. Aggregates all findings from the past hour
2. Sends to Gemini to generate a human-readable intelligence report
3. Broadcasts to admin chat + report channel

---

## ⚙️ Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Required for AI analysis |
| `GEMINI_MODEL` | `gemini-2.0-flash` | AI model to use |
| `TELEGRAM_BOT_TOKEN` | — | Bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | — | Where to send alerts |
| `TELEGRAM_REPORT_CHANNEL` | — | Optional broadcast channel |
| `TON_NETWORK` | `mainnet` | `mainnet` or `testnet` |
| `TON_API_KEY` | — | TonCenter API key |
| `TONAPI_KEY` | — | TONAPI.io key for contract data |
| `TON_MNEMONIC` | — | Wallet mnemonic (optional) |
| `SCAN_INTERVAL_MS` | `300000` | Scan frequency (ms) |
| `REPORT_INTERVAL_MS` | `3600000` | Report frequency (ms) |
| `BUG_BOUNTY_MODE` | `true` | Enable autonomous scanning |

---

## 🔄 Error Resilience

- All network requests have timeouts
- Gemini failures fall back to keyword analysis
- TON connection errors are logged and retried on next cycle
- Telegram send errors are caught and logged (never crash the agent)
- Graceful SIGINT/SIGTERM shutdown with final notification

---

## 📡 Health Check

The agent exposes a health endpoint:
```
GET /health → { status: "ok", scanned: N, vulnerabilities: N, ... }
```

---

## 🛣️ Roadmap

- [ ] On-chain vulnerability registry (store findings in GenesisTitan)
- [ ] Auto-submission to TON Bug Bounty portal
- [ ] Multi-agent coordination via ENACT Protocol
- [ ] Historical analysis and trend detection
- [ ] Web dashboard integration

---

*Built for the TON ecosystem hackathon. Titan_94 — intelligence at the speed of the blockchain.*
