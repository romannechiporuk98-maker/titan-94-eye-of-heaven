/**
 * TON Infrastructure Status Monitor + Full Ecosystem Links
 * Checks live availability of TON ecosystem services.
 * Results are cached for 60s to avoid hammering external services.
 */
import { Router, type IRouter } from "express";
import https from "https";
import http from "http";

const router: IRouter = Router();

// ── Service definitions ───────────────────────────────────────────────────

export const TON_STATUS_SERVICES = [
  { id: "tonstat",            label: "TON Status",              url: "https://tonstat.us/",                                   desc: "HTTP та ADNL доступність і продуктивність",                category: "status"     },
  { id: "toncenter_status",   label: "TonCenter Status",        url: "https://status.toncenter.com/",                         desc: "Low-level метрики: затримки, швидкості, навантаження",     category: "status"     },
  { id: "validators_official",label: "Validators Official",     url: "https://validators.ton.org/",                           desc: "Офіційна панель управління валідацією",                    category: "validators" },
  { id: "tonscan_validation",  label: "TONScan Validation",     url: "https://tonscan.com/validation",                        desc: "Панель валідації з красивим UI",                          category: "validators" },
  { id: "toncenter_api",       label: "TonCenter API",          url: "https://toncenter.com/api/v2/getMasterchainInfo",        desc: "Головний публічний TON API endpoint",                     category: "api"        },
  { id: "tonapi",              label: "TONAPI.io",              url: "https://tonapi.io/v2/blockchain/masterchain-head",       desc: "TONAPI.io — блокчейн дані та аналітика",                  category: "api"        },
  { id: "tonviewer",           label: "TONViewer Explorer",     url: "https://tonviewer.com/",                                desc: "Основний TON blockchain explorer",                        category: "explorer"   },
  { id: "tonscan",             label: "TONScan Explorer",       url: "https://tonscan.com/",                                  desc: "Альтернативний TON blockchain explorer",                  category: "explorer"   },
  { id: "getgems",             label: "GetGems NFT",            url: "https://getgems.io/",                                   desc: "Основний NFT маркетплейс TON",                            category: "defi"       },
  { id: "dedust",              label: "DeDust DEX",             url: "https://dedust.io/",                                    desc: "Децентралізована біржа на TON",                           category: "defi"       },
  { id: "ston_fi",             label: "STON.fi DEX",            url: "https://ston.fi/",                                      desc: "AMM DEX — найбільша ліквідність TON",                     category: "defi"       },
];

// ── Massive TON Ecosystem Links Library ──────────────────────────────────

export const TON_ECOSYSTEM_LINKS = {
  // ── Getting Started ────────────────────────────────────────────────────
  gettingStarted: [
    { label: "Start Here",                    url: "https://docs.ton.org/start-here",                                       desc: "Перші кроки з TON блокчейном" },
    { label: "First Smart Contract",          url: "https://docs.ton.org/first-smart-contract",                             desc: "Напиши перший TON смарт-контракт" },
    { label: "Coming from Ethereum",          url: "https://docs.ton.org/from-ethereum",                                    desc: "Порівняння TON та Ethereum для розробників" },
    { label: "TON Concepts",                  url: "https://docs.ton.org/learn/tvm-and-fif/tvm-overview",                   desc: "TVM, Cells, Stack-машина" },
    { label: "TON Whitepaper",               url: "https://docs.ton.org/ton.pdf",                                           desc: "Офіційний whitepaper TON блокчейну" },
    { label: "TON Lite",                      url: "https://github.com/ton-blockchain/ton",                                  desc: "Нода TON з відкритим кодом" },
    { label: "TON Testnet Faucet",           url: "https://t.me/testgiver_ton_bot",                                        desc: "Безкоштовні TON для тестнету" },
  ],
  // ── AI & Agentic ──────────────────────────────────────────────────────
  ai: [
    { label: "Agentic MCP Server",            url: "https://docs.ton.org/ecosystem/ai/mcp",                                  desc: "AI агент MCP інтеграція з TON" },
    { label: "Agentic Wallets",               url: "https://docs.ton.org/ecosystem/ai/wallets",                              desc: "AI-керовані гаманці TON" },
    { label: "TON AI Roadmap",                url: "https://blog.ton.org/ai-roadmap",                                        desc: "Дорожня карта AI для TON екосистеми" },
    { label: "LangChain TON Plugin",          url: "https://github.com/ton-society/langchain-ton",                           desc: "Плагін для LangChain — взаємодія з TON" },
    { label: "TON AI Grants",                 url: "https://society.ton.org/grants",                                         desc: "Гранти для AI-проєктів на TON" },
    { label: "Blueprint AI (ton-ai-sdk)",     url: "https://github.com/ton-org/blueprint",                                   desc: "Blueprint framework для розробки контрактів" },
  ],
  // ── Grants & Funding ──────────────────────────────────────────────────
  grants: [
    { label: "TON Grants Portal",             url: "https://society.ton.org/grants",                                         desc: "Головний портал грантів TON Foundation" },
    { label: "Grants GitHub",                 url: "https://github.com/ton-society/grants-and-bounties",                     desc: "GitHub: заявки та баунті" },
    { label: "Apply for Grant",               url: "https://github.com/ton-society/grants-and-bounties/issues/new/choose",   desc: "Подати заявку на грант TON" },
    { label: "Infrastructure Grants",         url: "https://github.com/ton-society/grants-and-bounties/issues?q=infrastructure", desc: "Гранти на інфраструктуру блокчейну" },
    { label: "Security Bounties",             url: "https://github.com/ton-society/grants-and-bounties/issues?q=security",   desc: "Виплати за знайдені вразливості" },
    { label: "TON Society",                   url: "https://society.ton.org/",                                               desc: "Спільнота та гранти TON" },
    { label: "TON Foundation",                url: "https://ton.org/grants",                                                  desc: "Офіційна сторінка грантів" },
    { label: "Ecosystem Fund",                url: "https://blog.ton.org/ton-ecosystem-fund",                                 desc: "Фонд екосистеми TON на $90M" },
    { label: "Grant Criteria",                url: "https://github.com/ton-society/grants-and-bounties/blob/main/grants/GRANT_REQUIREMENTS.md", desc: "Вимоги до заявок на грант" },
  ],
  // ── Wallets ──────────────────────────────────────────────────────────
  wallets: [
    { label: "Tonkeeper",                     url: "https://docs.ton.org/ecosystem/wallet-apps/tonkeeper",                   desc: "Основний гаманець TON — iOS/Android" },
    { label: "Web Wallets",                   url: "https://docs.ton.org/ecosystem/wallet-apps/web",                         desc: "Браузерні гаманці TON" },
    { label: "Deep Links",                    url: "https://docs.ton.org/ecosystem/wallet-apps/deep-links",                  desc: "Формат deep link для TON" },
    { label: "Addresses Workflow",            url: "https://docs.ton.org/ecosystem/wallet-apps/addresses-workflow",          desc: "Формати адрес та конвертація" },
    { label: "My TON Wallet",                 url: "https://mytonwallet.io/",                                                desc: "Web/Desktop гаманець TON" },
    { label: "OpenMask",                      url: "https://www.openmask.app/",                                              desc: "Браузерний extension-гаманець" },
    { label: "TON Wallet Contract",           url: "https://docs.ton.org/participate/wallets/contracts",                     desc: "Смарт-контракт гаманця TON" },
  ],
  // ── Explorers ────────────────────────────────────────────────────────
  explorers: [
    { label: "Explorers Overview",            url: "https://docs.ton.org/ecosystem/explorers/overview",                      desc: "Всі TON block explorers" },
    { label: "Tonviewer Docs",                url: "https://docs.ton.org/ecosystem/explorers/tonviewer",                     desc: "Tonviewer — інтеграційний гід" },
    { label: "TONScan",                       url: "https://tonscan.com/",                                                   desc: "Повний explorer транзакцій та адрес" },
    { label: "TONViewer",                     url: "https://tonviewer.com/",                                                  desc: "Сучасний explorer з деталями контрактів" },
    { label: "TONAPI Explorer",               url: "https://tonapi.io/",                                                     desc: "Explorer від команди TONAPI" },
    { label: "3xpl.com TON",                  url: "https://3xpl.com/ton",                                                   desc: "Міжланцюжковий explorer з TON" },
  ],
  // ── APIs & SDKs ───────────────────────────────────────────────────────
  apis: [
    { label: "SDKs Overview",                 url: "https://docs.ton.org/ecosystem/sdks",                                    desc: "Офіційні TON SDK для всіх мов" },
    { label: "API Overview",                  url: "https://docs.ton.org/ecosystem/api/overview",                            desc: "Доступні API опції для TON" },
    { label: "TonCenter API v2",              url: "https://toncenter.com/api/v2/",                                          desc: "REST API для TON — основний" },
    { label: "TonCenter API v3",              url: "https://toncenter.com/api/v3/",                                          desc: "REST API TON нового покоління" },
    { label: "TONAPI REST",                   url: "https://docs.tonconsole.com/tonapi/rest-api",                             desc: "TONAPI — розширений блокчейн API" },
    { label: "Price API",                     url: "https://docs.ton.org/ecosystem/api/price",                               desc: "API ціни TON в реальному часі" },
    { label: "ton-core (TypeScript)",         url: "https://github.com/ton-org/ton-core",                                    desc: "Низькорівнева TypeScript бібліотека TON" },
    { label: "TonLib (C++)",                  url: "https://github.com/ton-blockchain/ton/tree/master/tonlib",                desc: "Нативна C++ бібліотека TON" },
    { label: "PyTON / tonutils-go",          url: "https://github.com/xssnick/tonutils-go",                                  desc: "Go SDK для TON" },
    { label: "ton4j (Java)",                  url: "https://github.com/neodix42/ton4j",                                      desc: "Java SDK для TON" },
  ],
  // ── Infrastructure ────────────────────────────────────────────────────
  infrastructure: [
    { label: "Sub-second Finality",           url: "https://docs.ton.org/ecosystem/subsecond",                               desc: "Миттєва фіналізація TON" },
    { label: "Network Status",                url: "https://docs.ton.org/ecosystem/status",                                  desc: "Офіційні статус-ресурси" },
    { label: "Analytics Tools",               url: "https://docs.ton.org/ecosystem/analytics",                               desc: "Аналітика on-chain TON" },
    { label: "Bridges (TON↔ETH)",            url: "https://docs.ton.org/ecosystem/bridges",                                  desc: "Крос-чейн мости TON" },
    { label: "Sharding",                      url: "https://docs.ton.org/learn/overviews/ton-blockchain",                    desc: "Динамічний шардинг TON" },
    { label: "Masterchain",                   url: "https://docs.ton.org/learn/overviews/ton-blockchain#masterchain",        desc: "Мастерчейн: координація шардів" },
    { label: "Validators Guide",              url: "https://docs.ton.org/participate/run-nodes/full-node",                   desc: "Запуск повної ноди TON" },
    { label: "Liteserver Setup",              url: "https://docs.ton.org/participate/run-nodes/liteserver",                  desc: "Запуск liteserver для API" },
    { label: "TON DNS",                       url: "https://dns.ton.org/",                                                   desc: "Децентралізована система доменів TON" },
    { label: "TON Storage",                   url: "https://docs.ton.org/participate/ton-storage/storage-daemon",            desc: "Децентралізоване сховище файлів" },
  ],
  // ── DeFi & Finance ────────────────────────────────────────────────────
  defi: [
    { label: "STON.fi DEX",                   url: "https://ston.fi/",                                                       desc: "AMM DEX — найбільша ліквідність TON" },
    { label: "DeDust DEX",                    url: "https://dedust.io/",                                                     desc: "Децентралізована біржа TON" },
    { label: "Evaa Finance",                  url: "https://evaa.finance/",                                                  desc: "Lending protocol на TON" },
    { label: "Storm Trade",                   url: "https://storm.tg/",                                                      desc: "Perp DEX на TON" },
    { label: "TON Staking",                   url: "https://docs.ton.org/participate/nominators",                            desc: "Стейкінг TON через номінаторів" },
    { label: "Liquid Staking (tsTON)",        url: "https://tonstakers.com/",                                                desc: "Liquid staking на TON" },
    { label: "Jetton Standard (TEP-74)",      url: "https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md", desc: "Стандарт токенів TON (аналог ERC-20)" },
    { label: "TON Prices (CoinGecko)",        url: "https://www.coingecko.com/en/coins/toncoin",                             desc: "Ціна TON на CoinGecko" },
  ],
  // ── NFTs & Gaming ─────────────────────────────────────────────────────
  nftsGaming: [
    { label: "GetGems NFT Marketplace",       url: "https://getgems.io/",                                                    desc: "Основний NFT маркетплейс TON" },
    { label: "Fragment.com",                  url: "https://fragment.com/",                                                  desc: "Telegram usernames та Numbers NFT" },
    { label: "NFT Standard (TEP-62)",         url: "https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md", desc: "Стандарт NFT TON" },
    { label: "AppKit: NFTs",                  url: "https://docs.ton.org/ecosystem/appkit/nfts",                             desc: "Робота з NFT через AppKit" },
    { label: "Notcoin",                       url: "https://notco.in/",                                                      desc: "Перша hit-гра TON екосистеми" },
    { label: "TON Play (Gaming)",             url: "https://ton.app/games",                                                  desc: "Ігри на платформі TON" },
  ],
  // ── Oracles ───────────────────────────────────────────────────────────
  oracles: [
    { label: "Oracles Overview",              url: "https://docs.ton.org/ecosystem/oracles/overview",                        desc: "Цінові оракули на TON" },
    { label: "Pyth Oracle",                   url: "https://docs.ton.org/ecosystem/oracles/pyth",                            desc: "Pyth price feed — інтеграція" },
    { label: "RedStone Oracle",               url: "https://docs.ton.org/ecosystem/oracles/redstone",                        desc: "RedStone дата-фіди" },
    { label: "Chainlink on TON",              url: "https://docs.ton.org/ecosystem/oracles/chainlink",                       desc: "Chainlink оракул (якщо є)" },
  ],
  // ── TON Connect ──────────────────────────────────────────────────────
  tonConnect: [
    { label: "TON Connect Overview",          url: "https://docs.ton.org/ecosystem/ton-connect/overview",                    desc: "Універсальне з'єднання гаманця" },
    { label: "dApp Integration",              url: "https://docs.ton.org/ecosystem/ton-connect/dapp",                        desc: "Підключення гаманця до dApp" },
    { label: "Wallet Integration",            url: "https://docs.ton.org/ecosystem/ton-connect/wallet",                      desc: "Додати TON Connect у гаманець" },
    { label: "TON Connect Manifest",          url: "https://docs.ton.org/ecosystem/ton-connect/manifest",                    desc: "Формат маніфесту додатку" },
    { label: "@tonconnect/ui-react",          url: "https://www.npmjs.com/package/@tonconnect/ui-react",                     desc: "React компонент для TON Connect" },
    { label: "TON Connect SDK",               url: "https://github.com/ton-connect/sdk",                                     desc: "GitHub: офіційний SDK TON Connect" },
  ],
  // ── AppKit ────────────────────────────────────────────────────────────
  appKit: [
    { label: "AppKit Overview",               url: "https://docs.ton.org/ecosystem/appkit/overview",                         desc: "High-level TON SDK" },
    { label: "Toncoin Transfers",             url: "https://docs.ton.org/ecosystem/appkit/toncoin",                          desc: "Відправка/отримання TON" },
    { label: "Jettons (TEP-74)",              url: "https://docs.ton.org/ecosystem/appkit/jettons",                          desc: "Стандарт fungible токенів" },
    { label: "NFTs (TEP-62)",                 url: "https://docs.ton.org/ecosystem/appkit/nfts",                             desc: "Non-fungible токени TON" },
    { label: "Staking via AppKit",            url: "https://docs.ton.org/ecosystem/appkit/stake",                            desc: "Стейкінг через AppKit" },
    { label: "Subscriptions",                 url: "https://docs.ton.org/ecosystem/appkit/subscriptions",                    desc: "Автоматичні підписки TON" },
  ],
  // ── TMA (Telegram Mini Apps) ──────────────────────────────────────────
  tma: [
    { label: "TMA Overview",                  url: "https://docs.ton.org/ecosystem/tma/overview",                            desc: "Telegram Mini Apps на TON" },
    { label: "Create Mini App",               url: "https://docs.ton.org/ecosystem/tma/create-mini-app",                    desc: "Створи перший TMA" },
    { label: "Telegram SDK (twa-dev)",        url: "https://github.com/twa-dev/SDK",                                        desc: "SDK для TWA розробки" },
    { label: "@telegram-apps/sdk",            url: "https://www.npmjs.com/package/@telegram-apps/sdk",                      desc: "Офіційний Telegram Apps SDK" },
    { label: "TMA Examples",                  url: "https://github.com/ton-community/tma-example",                           desc: "Приклади Telegram Mini Apps" },
    { label: "TMA Boilerplate",               url: "https://github.com/ton-community/twa-template",                          desc: "Стартовий шаблон TWA" },
    { label: "Telegram Stars Payments",       url: "https://core.telegram.org/bots/payments",                                desc: "Прийом платежів через Telegram Stars" },
  ],
  // ── TON Pay ───────────────────────────────────────────────────────────
  tonPay: [
    { label: "TON Pay Overview",              url: "https://docs.ton.org/ecosystem/ton-pay/overview",                        desc: "Процесинг платежів TON" },
    { label: "Quick Start",                   url: "https://docs.ton.org/ecosystem/ton-pay/quick-start",                     desc: "Швидке прийняття TON-платежів" },
    { label: "API Reference",                 url: "https://docs.ton.org/ecosystem/ton-pay/api-reference",                   desc: "TON Pay REST API" },
    { label: "Webhooks",                      url: "https://docs.ton.org/ecosystem/ton-pay/webhooks",                        desc: "Вебхуки подій платежів" },
    { label: "On-ramp (Fiat→TON)",           url: "https://docs.ton.org/ecosystem/ton-pay/on-ramp",                         desc: "Конвертація фіат → TON" },
    { label: "TON Payments (Channels)",       url: "https://docs.ton.org/develop/dapps/asset-processing/payment-processing", desc: "Обробка TON-платежів вручну" },
  ],
  // ── Security ─────────────────────────────────────────────────────────
  security: [
    { label: "Smart Contract Security",       url: "https://docs.ton.org/develop/smart-contracts/guidelines/security-measures", desc: "Рекомендації з безпеки смарт-контрактів" },
    { label: "TON Security Audits",           url: "https://github.com/ton-blockchain/bug-bounty",                           desc: "Bug bounty програма TON" },
    { label: "FunC Security Pitfalls",        url: "https://docs.ton.org/develop/func/security-pitfalls",                   desc: "Типові помилки безпеки у FunC" },
    { label: "CertiK TON Reports",            url: "https://www.certik.com/leaderboard?search=ton",                         desc: "Аудити безпеки CertiK для TON" },
    { label: "Cantina TON Audits",            url: "https://cantina.xyz/portfolio",                                          desc: "Аудити безпеки Cantina" },
    { label: "SlowMist TON",                  url: "https://github.com/slowmist/Knowledge-Base/tree/master/TON",             desc: "SlowMist база знань з TON безпеки" },
    { label: "TON Vulnerability DB",          url: "https://github.com/ton-community/awesome-ton#security",                  desc: "Awesome TON — секція безпеки" },
    { label: "Rug Pull Checklist",            url: "https://docs.ton.org/develop/smart-contracts/guidelines/security-measures#rug-pull", desc: "Чеклист для аудиту на rug pull" },
  ],
  // ── Smart Contracts ──────────────────────────────────────────────────
  smartContracts: [
    { label: "FunC Language",                 url: "https://docs.ton.org/develop/func/overview",                             desc: "Мова FunC для смарт-контрактів TON" },
    { label: "Tact Language",                 url: "https://docs.tact-lang.org/",                                            desc: "Tact — зручна мова для TON контрактів" },
    { label: "Blueprint Framework",           url: "https://github.com/ton-org/blueprint",                                   desc: "Тест/деплой фреймворк для контрактів" },
    { label: "Sandbox Testing",               url: "https://github.com/ton-community/sandbox",                               desc: "Локальний sandbox для тестування" },
    { label: "TON Compiler",                  url: "https://docs.ton.org/develop/func/compiler",                             desc: "Компілятор FunC контрактів" },
    { label: "Contract Examples",             url: "https://github.com/ton-community/ton-contract-executor",                  desc: "Приклади смарт-контрактів TON" },
    { label: "Jetton Minter Template",        url: "https://github.com/ton-blockchain/minter",                               desc: "Шаблон деплою Jetton (TEP-74)" },
    { label: "TEPs (Standards)",              url: "https://github.com/ton-blockchain/TEPs",                                  desc: "TON Enhancement Proposals — стандарти" },
  ],
  // ── Community & Resources ─────────────────────────────────────────────
  community: [
    { label: "TON Docs",                      url: "https://docs.ton.org/",                                                  desc: "Офіційна документація TON" },
    { label: "TON Blog",                      url: "https://blog.ton.org/",                                                  desc: "Офіційний блог TON Foundation" },
    { label: "Awesome TON (GitHub)",          url: "https://github.com/ton-community/awesome-ton",                           desc: "Curated список ресурсів TON" },
    { label: "TON Dev Chat (TG)",             url: "https://t.me/tondev",                                                    desc: "Telegram чат розробників TON" },
    { label: "TON Dev EN (TG)",               url: "https://t.me/tondev_eng",                                                desc: "TON Dev — англомовна спільнота" },
    { label: "TON Overflow (Q&A)",            url: "https://answers.ton.org/",                                               desc: "Stack Overflow для TON розробників" },
    { label: "TON Research Forum",            url: "https://github.com/ton-blockchain/ton/discussions",                      desc: "Технічні обговорення TON" },
    { label: "TON GitHub",                    url: "https://github.com/ton-blockchain",                                      desc: "Офіційний GitHub TON Blockchain" },
    { label: "ton-community GitHub",          url: "https://github.com/ton-community",                                       desc: "Спільнотний GitHub TON" },
  ],
  // ── Telegram Status Channels ─────────────────────────────────────────
  telegramChannels: [
    { label: "@tonstatus",                    url: "https://t.me/tonstatus",                                                 desc: "Mainnet validator сповіщення" },
    { label: "@testnetstatus",                url: "https://t.me/testnetstatus",                                             desc: "Testnet validator сповіщення" },
    { label: "@validators",                   url: "https://t.me/validators",                                                desc: "Бот для власників validators" },
    { label: "@tonblockchain",                url: "https://t.me/tonblockchain",                                             desc: "Офіційний канал TON" },
    { label: "@TON_official_news",            url: "https://t.me/TON_official_news",                                        desc: "Офіційні новини TON" },
    { label: "@tondev",                       url: "https://t.me/tondev",                                                    desc: "TON Dev Telegram спільнота" },
  ],
};

// ── Simple HTTP ping ──────────────────────────────────────────────────────

function pingUrl(url: string, timeoutMs = 6000): Promise<{ ok: boolean; statusCode: number | null; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        method: "HEAD", hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        headers: { "User-Agent": "TITAN-94/4.0 (+https://t.me/TITAN94_BOT)" },
      },
      (res) => {
        res.resume();
        const latencyMs = Date.now() - start;
        const ok = (res.statusCode ?? 0) < 400;
        resolve({ ok, statusCode: res.statusCode ?? null, latencyMs });
      }
    );
    req.on("error", () => resolve({ ok: false, statusCode: null, latencyMs: Date.now() - start }));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ ok: false, statusCode: null, latencyMs: timeoutMs }); });
    req.end();
  });
}

// ── Cache layer (60s TTL) ─────────────────────────────────────────────────

interface CachedResult { data: any; expiresAt: number; }
let cache: CachedResult | null = null;

async function getInfraStatus() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const results = await Promise.all(
    TON_STATUS_SERVICES.map(async (svc) => {
      const ping = await pingUrl(svc.url, 5000);
      return { id: svc.id, label: svc.label, url: svc.url, desc: svc.desc, category: svc.category,
        online: ping.ok, statusCode: ping.statusCode, latencyMs: ping.latencyMs,
        checkedAt: new Date().toISOString() };
    })
  );

  const online = results.filter((r) => r.online).length;
  const total = results.length;
  const overallStatus = online === total ? "operational" : online >= total * 0.7 ? "degraded" : "outage";

  const data = {
    overallStatus, onlineCount: online, totalCount: total,
    services: results, checkedAt: new Date().toISOString(),
    ecosystemLinks: TON_ECOSYSTEM_LINKS,
    totalLinks: Object.values(TON_ECOSYSTEM_LINKS).reduce((s, arr) => s + arr.length, 0),
    categoryCounts: Object.fromEntries(
      Object.entries(TON_ECOSYSTEM_LINKS).map(([k, v]) => [k, v.length])
    ),
  };

  cache = { data, expiresAt: Date.now() + 60_000 };
  return data;
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get("/ton/infra-status", async (_req, res) => {
  try {
    res.json(await getInfraStatus());
  } catch (err) {
    res.status(500).json({ error: "Failed to check TON infrastructure", detail: String(err) });
  }
});

router.get("/ton/ecosystem-links", (_req, res) => {
  res.json({ links: TON_ECOSYSTEM_LINKS, updatedAt: new Date().toISOString() });
});

export default router;
