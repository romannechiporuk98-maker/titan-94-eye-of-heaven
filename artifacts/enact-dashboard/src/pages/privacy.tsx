/**
 * PRIVACY POLICY — обов'язкова сторінка для Telegram Mini App.
 * URL: /privacy — публічна, посилається з BotFather та About сторінки.
 */
import { Lock, Database, Eye, Shield, Mail, FileText, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/ui-prefs";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");

function S(lang: string, uk: string, en: string, ru: string) {
  if (lang === "en") return en;
  if (lang === "ru") return ru;
  return uk;
}

function Section({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="titan-card mb-4" style={{ borderColor: color + "25" }}>
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color }}>
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      <div className="space-y-2 text-xs text-muted leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const { lang } = useLang();
  const L = (uk: string, en: string, ru: string) => S(lang, uk, en, ru);

  return (
    <div className="titan-page titan-grid-bg">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-lg p-5 mb-5" style={{
        background: "linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,255,255,0.05))",
        border: "1px solid rgba(0,255,136,0.25)",
      }}>
        <Lock className="absolute top-3 right-4 w-20 h-20 text-safe opacity-10" />
        <div className="text-[10px] tracking-[0.5em] text-safe/60 mb-2">LEGAL · PRIVACY POLICY</div>
        <h1 className="text-2xl font-bold text-safe mb-1">
          {L("Політика конфіденційності", "Privacy Policy", "Политика конфиденциальности")}
        </h1>
        <p className="text-xs text-muted">
          TITAN-94 · {L("Остання редакція:", "Last updated:", "Последняя редакция:")} 01.05.2025
        </p>
        <p className="text-xs text-muted mt-2 leading-relaxed max-w-xl">
          {L(
            "Ця сторінка пояснює, які дані збирає TITAN-94, як вони використовуються та захищаються. Ми поважаємо вашу приватність і зберігаємо мінімум необхідних даних.",
            "This page explains what data TITAN-94 collects, how it is used and protected. We respect your privacy and store the minimum necessary data.",
            "Эта страница объясняет, какие данные собирает TITAN-94, как они используются и защищаются. Мы уважаем вашу конфиденциальность и храним минимум необходимых данных.",
          )}
        </p>
      </div>

      {/* DATA WE COLLECT */}
      <Section icon={Database} color="#00FFFF" title={L("Які дані ми збираємо", "What data we collect", "Какие данные мы собираем")}>
        <p className="font-bold text-foreground">{L("Ми збираємо тільки:", "We collect only:", "Мы собираем только:")}</p>
        <ul className="space-y-1 pl-2">
          {[
            L("✓ Telegram ID (числовий ідентифікатор) — для аутентифікації та підписки", "✓ Telegram ID (numeric identifier) — for authentication and subscription", "✓ Telegram ID (числовой идентификатор) — для аутентификации и подписки"),
            L("✓ Username (нікнейм у Telegram) — для відображення у профілі", "✓ Username (Telegram nickname) — for profile display", "✓ Username (никнейм в Telegram) — для отображения в профиле"),
            L("✓ Дата першого входу — для статистики активних користувачів", "✓ First login date — for active user statistics", "✓ Дата первого входа — для статистики активных пользователей"),
            L("✓ Обраний план підписки та дата оплати — для надання послуги", "✓ Selected subscription plan and payment date — to provide the service", "✓ Выбранный план подписки и дата оплаты — для предоставления услуги"),
            L("✓ Реферальний код (якщо використовувався) — для програми рефералів", "✓ Referral code (if used) — for the referral program", "✓ Реферальный код (если использовался) — для реферальной программы"),
          ].map((item) => <li key={item} className="pl-2 border-l" style={{ borderColor: "#00FFFF40" }}>{item}</li>)}
        </ul>
      </Section>

      {/* WHAT WE DON'T COLLECT */}
      <Section icon={Shield} color="#00FF88" title={L("Що ми НЕ збираємо", "What we do NOT collect", "Что мы НЕ собираем")}>
        <ul className="space-y-1 pl-2">
          {[
            L("❌ Seed-фрази, приватні ключі або паролі від гаманців", "❌ Seed phrases, private keys or wallet passwords", "❌ Seed-фразы, приватные ключи или пароли от кошельков"),
            L("❌ Особисті повідомлення з Telegram", "❌ Personal messages from Telegram", "❌ Личные сообщения из Telegram"),
            L("❌ Номер телефону або email", "❌ Phone number or email", "❌ Номер телефона или email"),
            L("❌ Геолокація", "❌ Geolocation", "❌ Геолокация"),
            L("❌ Файли, медіа або контакти з пристрою", "❌ Files, media or contacts from your device", "❌ Файлы, медиа или контакты с устройства"),
            L("❌ Активність в інших застосунках", "❌ Activity in other applications", "❌ Активность в других приложениях"),
          ].map((item) => <li key={item} className="pl-2 border-l" style={{ borderColor: "#00FF8840" }}>{item}</li>)}
        </ul>
      </Section>

      {/* HOW WE USE DATA */}
      <Section icon={Eye} color="#9B5CFF" title={L("Як ми використовуємо дані", "How we use the data", "Как мы используем данные")}>
        <p>{L("Зібрані дані використовуються виключно для:", "Collected data is used exclusively for:", "Собранные данные используются исключительно для:")}</p>
        <ul className="space-y-1 pl-2">
          {[
            L("Аутентифікації — перевірка, що ви це ви (через Telegram initData)", "Authentication — verifying that you are you (via Telegram initData)", "Аутентификации — проверка, что вы это вы (через Telegram initData)"),
            L("Надання послуги — відображення вашого плану підписки та відповідних функцій", "Service provision — displaying your subscription plan and corresponding features", "Предоставления услуги — отображение вашего плана подписки и соответствующих функций"),
            L("Реферальної програми — нарахування бонусів", "Referral program — bonus crediting", "Реферальной программы — начисление бонусов"),
            L("Агрегованої анонімної статистики (кількість активних користувачів по планах)", "Aggregated anonymous statistics (number of active users per plan)", "Агрегированной анонимной статистики (количество активных пользователей по планам)"),
          ].map((item) => <li key={item} className="pl-2 border-l" style={{ borderColor: "#9B5CFF40" }}>{item}</li>)}
        </ul>
        <p className="mt-2 font-bold text-foreground">
          {L("Ми ніколи не продаємо та не передаємо ваші дані третім особам.", "We never sell or share your data with third parties.", "Мы никогда не продаём и не передаём ваши данные третьим лицам.")}
        </p>
      </Section>

      {/* TON & BLOCKCHAIN */}
      <Section icon={Lock} color="#FF8C00" title={L("Блокчейн та гаманець", "Blockchain & wallet", "Блокчейн и кошелёк")}>
        <p>
          {L(
            "TON Connect використовується виключно для підтвердження оплати підписки. Ми отримуємо адресу гаманця тільки після того, як ви явно підписуєте транзакцію через Tonkeeper або інший TON-гаманець.",
            "TON Connect is used exclusively to confirm subscription payments. We receive your wallet address only after you explicitly sign a transaction via Tonkeeper or another TON wallet.",
            "TON Connect используется исключительно для подтверждения оплаты подписки. Мы получаем адрес кошелька только после того, как вы явно подписываете транзакцию через Tonkeeper или другой TON-кошелёк.",
          )}
        </p>
        <p>
          {L(
            "Адреса гаманця зберігається лише для верифікації транзакцій і перевірки активної підписки. Ми не ініціюємо транзакції без вашого підтвердження.",
            "The wallet address is stored only to verify transactions and check the active subscription. We do not initiate transactions without your confirmation.",
            "Адрес кошелька хранится только для верификации транзакций и проверки активной подписки. Мы не инициируем транзакции без вашего подтверждения.",
          )}
        </p>
      </Section>

      {/* API KEYS */}
      <Section icon={Lock} color="#FF3355" title={L("API ключі в Settings", "API keys in Settings", "API ключи в Settings")}>
        <p>
          {L(
            "Якщо ви вводите API ключі (Gemini, Binance тощо) через Settings → API Vault, вони зберігаються на сервері у зашифрованому вигляді і використовуються виключно для роботи функцій TITAN-94. Ці ключі доступні тільки власнику (адміністратору) системи.",
            "If you enter API keys (Gemini, Binance etc.) via Settings → API Vault, they are stored on the server in encrypted form and used exclusively to operate TITAN-94 features. These keys are accessible only to the system owner (administrator).",
            "Если вы вводите API ключи (Gemini, Binance и т.д.) через Settings → API Vault, они хранятся на сервере в зашифрованном виде и используются исключительно для работы функций TITAN-94. Эти ключи доступны только владельцу (администратору) системы.",
          )}
        </p>
        <p className="font-bold text-foreground">
          {L("Пересічні користувачі не мають доступу до Settings і не можуть переглядати ключі.", "Regular users do not have access to Settings and cannot view the keys.", "Обычные пользователи не имеют доступа к Settings и не могут просматривать ключи.")}
        </p>
      </Section>

      {/* DATA RETENTION */}
      <Section icon={Database} color="#6b7280" title={L("Зберігання та видалення", "Storage & deletion", "Хранение и удаление")}>
        <p>
          {L(
            "Дані зберігаються на сервері (Replit EU region) поки ви є активним користувачем. Для видалення всіх ваших даних зверніться до підтримки через Telegram бот.",
            "Data is stored on the server (Replit EU region) while you are an active user. To delete all your data, contact support via the Telegram bot.",
            "Данные хранятся на сервере (Replit EU region) пока вы являетесь активным пользователем. Для удаления всех ваших данных обратитесь в поддержку через Telegram бот.",
          )}
        </p>
        <p>
          {L(
            "Вразливості, знайдені AI на блокчейні, зберігаються анонімно і не прив'язані до вашого акаунту.",
            "Vulnerabilities found by AI on the blockchain are stored anonymously and are not linked to your account.",
            "Уязвимости, найденные AI на блокчейне, хранятся анонимно и не привязаны к вашему аккаунту.",
          )}
        </p>
      </Section>

      {/* CONTACT */}
      <Section icon={Mail} color="#00FFFF" title={L("Контакти", "Contact", "Контакты")}>
        <p>
          {L(
            "З питань щодо конфіденційності та запитами на видалення даних звертайтесь через бот або відповідний Telegram канал.",
            "For privacy questions and data deletion requests, contact us via the bot or relevant Telegram channel.",
            "По вопросам конфиденциальности и запросам на удаление данных обращайтесь через бот или соответствующий Telegram канал.",
          )}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <a href="https://t.me/TITAN94_BOT" target="_blank" rel="noopener"
             className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border"
             style={{ borderColor: "rgba(0,255,255,0.3)", color: "#00FFFF" }}>
            <ExternalLink className="w-3 h-3" /> @TITAN94_BOT
          </a>
          <Link href={`${BASE}/about`}
             className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border"
             style={{ borderColor: "rgba(0,255,255,0.2)", color: "#6b7280" }}>
            <FileText className="w-3 h-3" /> {L("Про систему", "About", "О системе")}
          </Link>
        </div>
      </Section>

      <div className="text-center text-[10px] text-muted/40 tracking-widest py-4">
        TITAN-94 · ОКО НЕБЕСНЕ · PRIVACY POLICY v1.0 · 2025
      </div>
    </div>
  );
}
