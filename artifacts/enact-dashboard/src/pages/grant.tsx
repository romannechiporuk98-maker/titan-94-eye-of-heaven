import { useState } from "react";
import {
  Trophy, ExternalLink, ChevronDown, ChevronRight,
  Shield, Brain, Globe, Zap, FileText, CheckCircle2,
  DollarSign, Users, Code2, Activity, Copy, Check,
} from "lucide-react";

const GRANT_CATEGORIES = [
  {
    id: "infrastructure",
    icon: Activity,
    color: "#00FFFF",
    title: "Infrastructure",
    budget: "$10,000 – $50,000",
    desc: "Ноди, моніторинг, інструменти, аналітика блокчейну. TITAN-94 підходить ідеально — автономний AI-агент безпеки для TON.",
    fit: "TITAN-94",
    tags: ["нода", "моніторинг", "API", "аналітика"],
  },
  {
    id: "security",
    icon: Shield,
    color: "#00FF88",
    title: "Security & Auditing",
    budget: "$5,000 – $30,000",
    desc: "Інструменти аудиту, сканери вразливостей, автоматизований захист смарт-контрактів.",
    fit: "TITAN-94 Security Core",
    tags: ["аудит", "вразливості", "захист", "AI-scan"],
  },
  {
    id: "ai",
    icon: Brain,
    color: "#9B5CFF",
    title: "AI & Agentic Tools",
    budget: "$10,000 – $100,000",
    desc: "AI-агенти, MCP-сервери, автономні системи для TON блокчейну.",
    fit: "TITAN-94 Autonomous Agent",
    tags: ["AI", "агент", "MCP", "автономія"],
  },
  {
    id: "developer_tools",
    icon: Code2,
    color: "#FF8C00",
    title: "Developer Tools",
    budget: "$5,000 – $30,000",
    desc: "SDK, фреймворки, дашборди для розробників. ENACT Dashboard — інструмент для моніторингу TON.",
    fit: "ENACT Dashboard",
    tags: ["SDK", "дашборд", "UI", "API"],
  },
];

const CHECKLIST = [
  { done: true,  text: "Open-source код (GitHub репозиторій)" },
  { done: true,  text: "Робочий продукт (deployed MVP)" },
  { done: true,  text: "Реальна цінність для TON екосистеми" },
  { done: true,  text: "Автономний AI-агент для безпеки TON" },
  { done: true,  text: "Моніторинг TON інфраструктури в реальному часі" },
  { done: true,  text: "Telegram інтеграція (бот + сповіщення)" },
  { done: true,  text: "ENACT Protocol інтеграція (TON smart jobs)" },
  { done: false, text: "Верифікація через TON Connect (гаманець)" },
  { done: false, text: "Публічна документація / whitepaper" },
  { done: false, text: "Відкрита roadmap на GitHub" },
];

const TEMPLATE = `# TITAN-94 «ОКО НЕБЕСНЕ» — Grant Application

## Project Overview
TITAN-94 is an autonomous AI security organism for the TON blockchain. It continuously scans smart contracts for vulnerabilities, applies AI-powered healing strategies, monitors TON network infrastructure, and generates revenue through automated blockchain security services.

## Problem Statement
The TON ecosystem lacks autonomous, AI-powered security monitoring tools. Smart contracts are deployed without continuous surveillance, leaving billions of dollars at risk from known vulnerabilities (reentrancy, integer overflow, access control flaws).

## Solution
TITAN-94 is a 24/7 autonomous security agent that:
- **Scans** TON smart contracts using multi-vector threat detection
- **Heals** vulnerabilities using AI-generated fix strategies (Gemini, GPT-4o, Claude)
- **Monitors** TON ecosystem infrastructure (validators, APIs, explorers) in real-time
- **Alerts** via Telegram bot with instant notifications
- **Learns** from each interaction to improve detection accuracy

## Technical Stack
- **Agent**: Node.js autonomous agent with 4 parallel AI cycles (SCAN/HEAL/LEARN/FINANCE)
- **AI Models**: Multi-model consensus (Gemini 2.0 Flash, GPT-4o, Claude 3.5 Sonnet, Llama-3.3-70B)
- **Blockchain**: TON mainnet integration via TonCenter API + TONAPI
- **Database**: PostgreSQL with Drizzle ORM (threat tracking, knowledge base, earnings)
- **Dashboard**: React + Vite + TanStack Query (ENACT Dashboard)
- **Bot**: Telegram bot for alerts and subscriber management

## Grant Category
[ ] Infrastructure & Developer Tools
[ ] AI & Agentic Tools  
[ ] Security & Auditing

## Requested Amount
$20,000 USD (equivalent in TON)

## Milestones
1. **Month 1** ($5,000): Public GitHub repo + full documentation + whitepaper
2. **Month 2** ($8,000): TON Connect integration + public API for security scanning
3. **Month 3** ($7,000): SDK release for other developers to integrate TITAN-94 security

## Team
Solo developer — full-stack AI engineer with TON blockchain experience.

## Links
- Dashboard: [deployed URL]
- Telegram Bot: @TITAN94_BOT
- GitHub: [repo URL]

## Why TON?
TON is the fastest-growing blockchain ecosystem with Telegram's 900M user base. Security infrastructure is critical for this growth. TITAN-94 protects TON users and projects proactively.
`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-3 py-1.5 text-xs border transition"
      style={{ borderColor: copied ? "rgba(0,255,136,0.5)" : "rgba(0,255,255,0.3)", color: copied ? "#00FF88" : "#00FFFF" }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Скопійовано!" : "Копіювати шаблон"}
    </button>
  );
}

function AccordionSection({ title, icon: Icon, color, children }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded mb-2" style={{ borderColor: color + "30" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        <span className="text-xs font-bold flex-1" style={{ color }}>{title}</span>
        {open ? <ChevronDown className="w-3 h-3 text-muted" /> : <ChevronRight className="w-3 h-3 text-muted" />}
      </button>
      {open && <div className="border-t p-3" style={{ borderColor: color + "20" }}>{children}</div>}
    </div>
  );
}

export default function GrantPage() {
  const [activeTab, setActiveTab] = useState<"overview"|"checklist"|"template">("overview");

  return (
    <div className="titan-page">
      <div className="titan-page-header">
        <h1 className="titan-title">◈ TON GRANT APPLICATION</h1>
        <p className="titan-subtitle">
          Фінансування від TON Foundation · Ecosystem Fund $90M · AI & Infrastructure категорії
        </p>
      </div>

      {/* Hero banner */}
      <div className="p-4 rounded border mb-5" style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.06), rgba(155,92,255,0.06), rgba(0,255,136,0.04))",
        borderColor: "rgba(0,255,255,0.25)",
      }}>
        <div className="flex items-center gap-4 flex-wrap">
          <Trophy className="w-10 h-10 text-amber shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground mb-1">
              TON Foundation Ecosystem Fund · $90M Виділено
            </div>
            <p className="text-xs text-muted">
              TON Foundation фінансує проєкти в категоріях: AI, Infrastructure, DeFi, Security, TMA, Developer Tools.
              TITAN-94 підходить для категорій <strong className="text-primary">AI & Agentic</strong> та <strong className="text-safe">Security & Infrastructure</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <a href="https://society.ton.org/grants" target="_blank" rel="noopener"
               className="flex items-center gap-1.5 titan-btn titan-btn-sm text-xs px-3 py-1.5">
              <ExternalLink className="w-3 h-3" /> Портал грантів
            </a>
            <a href="https://github.com/ton-society/grants-and-bounties/issues/new/choose" target="_blank" rel="noopener"
               className="flex items-center gap-1.5 text-xs px-3 py-1.5 border transition"
               style={{ borderColor: "rgba(0,255,136,0.4)", color: "#00FF88" }}>
              <FileText className="w-3 h-3" /> Подати заявку
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "rgba(0,255,255,0.15)" }}>
        {[
          { id: "overview",  label: "Огляд грантів" },
          { id: "checklist", label: "Чеклист готовності" },
          { id: "template",  label: "Шаблон заявки" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="px-4 py-2 text-xs font-bold border-b-2 transition-all"
            style={{
              borderColor: activeTab === tab.id ? "#00FFFF" : "transparent",
              color: activeTab === tab.id ? "#00FFFF" : "#6b7280",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Grant categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GRANT_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="titan-card p-4" style={{ borderColor: cat.color + "30" }}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: cat.color + "15", color: cat.color }}>
                          {cat.budget}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2">{cat.desc}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-muted">Відповідає:</span>
                        <span className="text-[10px] font-bold text-primary">{cat.fit}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {cat.tags.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 border rounded"
                            style={{ borderColor: cat.color + "30", color: cat.color + "cc" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How the grant process works */}
          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="titan-label">ЯК ОТРИМАТИ ГРАНТ — 5 КРОКІВ</span>
            </div>
            <div className="space-y-2">
              {[
                { step: "01", title: "Відкрий GitHub issue",      desc: "Перейди на github.com/ton-society/grants-and-bounties → Issues → New Issue → вибери шаблон Grant Application",   link: "https://github.com/ton-society/grants-and-bounties/issues/new/choose" },
                { step: "02", title: "Заповни шаблон",            desc: "Опиши проблему, рішення, технічний стек, команду та milestone-бюджет. Використай наш шаблон нижче.",              link: null },
                { step: "03", title: "Очікуй рев'ю (1-2 тижні)", desc: "TON Foundation team перевірить заявку. Можуть задати уточнюючі питання через коментарі до issue.",               link: null },
                { step: "04", title: "Підпиши договір",           desc: "Після схвалення — підписуєш грантову угоду та отримуєш перший транш.",                                           link: null },
                { step: "05", title: "Виконай milestones",        desc: "Кожен milestone = нова виплата. Звіт через GitHub або форму.",                                                    link: "https://society.ton.org/grants" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3 p-2 rounded hover:bg-white/2">
                  <span className="text-xs font-bold font-mono text-primary shrink-0 w-6 mt-0.5">{s.step}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">{s.title}</div>
                    <div className="text-[10px] text-muted mt-0.5">{s.desc}</div>
                  </div>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener"
                       className="text-primary hover:text-primary/70 transition shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Useful links */}
          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span className="titan-label">КОРИСНІ ПОСИЛАННЯ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {[
                { label: "society.ton.org/grants",                  url: "https://society.ton.org/grants",                                                      color: "#00FFFF" },
                { label: "GitHub: grants-and-bounties",             url: "https://github.com/ton-society/grants-and-bounties",                                   color: "#00FFFF" },
                { label: "Подати заявку (GitHub Issue)",             url: "https://github.com/ton-society/grants-and-bounties/issues/new/choose",                 color: "#00FF88" },
                { label: "Grant Requirements (GRANT_REQUIREMENTS)", url: "https://github.com/ton-society/grants-and-bounties/blob/main/grants/GRANT_REQUIREMENTS.md", color: "#FF8C00" },
                { label: "Ecosystem Fund ($90M)",                   url: "https://blog.ton.org/ton-ecosystem-fund",                                               color: "#9B5CFF" },
                { label: "Security Bounties",                       url: "https://github.com/ton-society/grants-and-bounties/issues?q=security",                  color: "#FF3355" },
                { label: "Infrastructure Grants",                   url: "https://github.com/ton-society/grants-and-bounties/issues?q=infrastructure",            color: "#00FFFF" },
                { label: "AI & Agentic Grants",                     url: "https://github.com/ton-society/grants-and-bounties/issues?q=ai",                        color: "#9B5CFF" },
              ].map(l => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener"
                   className="flex items-center gap-2 p-2 border rounded hover:bg-white/5 transition group"
                   style={{ borderColor: l.color + "25" }}>
                  <ExternalLink className="w-3 h-3 shrink-0" style={{ color: l.color }} />
                  <span className="text-[11px] text-muted group-hover:text-foreground transition truncate">{l.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Funding amounts info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Мін. грант",    value: "$5,000",   color: "#00FF88", icon: DollarSign },
              { label: "Макс. грант",   value: "$100,000", color: "#FF8C00", icon: Trophy },
              { label: "Фонд загалом",  value: "$90M",     color: "#00FFFF", icon: Users },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="titan-card p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[9px] text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-safe" />
              <span className="titan-label">ГОТОВНІСТЬ TITAN-94 ДО ГРАНТУ</span>
              <span className="ml-auto text-[10px] font-mono text-safe">
                {CHECKLIST.filter(c => c.done).length}/{CHECKLIST.length} виконано
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-black/40 rounded mb-4">
              <div className="h-full rounded transition-all"
                style={{
                  width: `${(CHECKLIST.filter(c => c.done).length / CHECKLIST.length) * 100}%`,
                  background: "linear-gradient(90deg, #00FF88, #00FFFF)",
                }} />
            </div>

            <div className="space-y-2">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded"
                  style={{ background: item.done ? "rgba(0,255,136,0.04)" : "rgba(255,255,255,0.02)" }}>
                  <div className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center ${item.done ? "bg-safe/20" : "bg-white/10"}`}>
                    {item.done
                      ? <CheckCircle2 className="w-3 h-3 text-safe" />
                      : <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    }
                  </div>
                  <span className={`text-xs ${item.done ? "text-foreground" : "text-muted"}`}>{item.text}</span>
                  {!item.done && <span className="ml-auto text-[9px] text-amber font-bold">ПОТРІБНО</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber" />
              <span className="titan-label">ЩО ПОТРІБНО ЗРОБИТИ ДЛЯ ГРАНТУ</span>
            </div>
            <div className="space-y-2 text-xs text-muted">
              {[
                { t: "1. Відкрий GitHub репозиторій", d: "Publish код на GitHub (навіть приватний → зроби публічним для гранту)" },
                { t: "2. Додай README та документацію", d: "Опиши що робить проєкт, як запустити, архітектуру" },
                { t: "3. Інтегруй TON Connect", d: "Дозволь підключення гаманця через TON Connect — це стандарт TON dApps" },
                { t: "4. Напиши roadmap", d: "GitHub Projects або ROADMAP.md — що буде в наступних версіях" },
                { t: "5. Заповни шаблон заявки", d: "Вкладка 'Шаблон заявки' → скопіюй, заповни, вставив в GitHub Issue" },
              ].map(item => (
                <div key={item.t} className="p-2 border-l-2" style={{ borderColor: "#FF8C00" }}>
                  <div className="font-bold text-amber text-[11px]">{item.t}</div>
                  <div className="mt-0.5">{item.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE TAB */}
      {activeTab === "template" && (
        <div className="titan-card p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="titan-label">ШАБЛОН ЗАЯВКИ НА ГРАНТ</span>
            </div>
            <div className="flex gap-2">
              <CopyButton text={TEMPLATE} />
              <a href="https://github.com/ton-society/grants-and-bounties/issues/new/choose"
                 target="_blank" rel="noopener"
                 className="flex items-center gap-1 px-3 py-1.5 text-xs border transition"
                 style={{ borderColor: "rgba(0,255,136,0.4)", color: "#00FF88" }}>
                <ExternalLink className="w-3 h-3" /> Відкрити GitHub Issue
              </a>
            </div>
          </div>
          <div className="text-xs text-muted mb-3 p-2 border rounded" style={{ borderColor: "rgba(255,140,0,0.25)", background: "rgba(255,140,0,0.04)" }}>
            <strong className="text-amber">Інструкція:</strong> Скопіюй шаблон → відкрий GitHub Issue у ton-society/grants-and-bounties → вибери "Grant Application" → вставте та відредагуй під свій проєкт
          </div>
          <pre className="text-[11px] text-muted whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto p-3 rounded"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,255,0.1)" }}>
            {TEMPLATE}
          </pre>
        </div>
      )}

      <div className="mt-4 text-center text-xs text-muted opacity-40">
        TITAN-94 — Autonomous AI Security Organism · TON Blockchain · Ecosystem Fund Candidate
      </div>
    </div>
  );
}
