#!/usr/bin/env python3
"""
TITAN-94 «ОКО НЕБЕСНЕ» — Telegram Bot
Повний функціонал: scan, analyze, honeypot, threats, market, earn
"""
import os
import json
import logging
import requests
import telebot
from telebot import types

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TITAN-94-BOT")

BOT_TOKEN    = os.environ.get("TELEGRAM_BOT_TOKEN", "")
GEMINI_KEY   = os.environ.get("GEMINI_API_KEY", "")
API_BASE     = os.environ.get("TITAN_API_URL", "http://localhost:8080/api")
ADMIN_ID     = int(os.environ.get("ADMIN_TELEGRAM_ID", "7255058720"))
RESERVE_WALLET = "UQC8seFr9xyA47kG2OIDRnKST8_1qPw3EN5pk6XlKLuNl-8v"
WEB_APP_URL  = os.environ.get("WEB_APP_URL", "https://wilted-familiar-cable--titangenesis94.replit.app")
BOT_USERNAME = "Titan_94_agent_bot"

if not BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN not set! Please add it to Replit Secrets.")
    exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")

# ─── API helpers ─────────────────────────────────────────────────────
def api_get(path: str, timeout=8):
    try:
        r = requests.get(f"{API_BASE}{path}", timeout=timeout)
        return r.json() if r.ok else None
    except Exception as e:
        logger.warning(f"API GET {path}: {e}")
        return None

def api_post(path: str, data: dict, timeout=15):
    try:
        r = requests.post(f"{API_BASE}{path}", json=data, timeout=timeout)
        return r.json() if r.ok else None
    except Exception as e:
        logger.warning(f"API POST {path}: {e}")
        return None

def gemini_ask(prompt: str, max_tokens=400) -> str:
    if not GEMINI_KEY:
        return "⚠️ GEMINI_API_KEY не налаштований. Додай у Replit → Secrets."
    try:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}],
                  "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.3}},
            timeout=15
        )
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"❌ Gemini помилка: {e}"

# ─── /start ──────────────────────────────────────────────────────────
@bot.message_handler(commands=["start"])
def cmd_start(msg: types.Message):
    uid = msg.from_user.id
    username = msg.from_user.username or str(uid)

    # Register user
    ref_id = None
    if msg.text and "ref" in msg.text:
        parts = msg.text.split("ref")
        if len(parts) > 1:
            ref_id = parts[1].strip()

    api_post("/auth/register", {
        "telegram_id": str(uid), "username": username,
        "referred_by": ref_id
    })

    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("◈ TITAN Terminal", web_app=types.WebAppInfo(url=WEB_APP_URL)),
        types.InlineKeyboardButton("📊 Статистика", callback_data="stats"),
        types.InlineKeyboardButton("👁️ Сканувати", callback_data="scan"),
        types.InlineKeyboardButton("⚠️ Загрози", callback_data="threats"),
        types.InlineKeyboardButton("💹 Арбітраж", callback_data="market"),
        types.InlineKeyboardButton("💰 Заробити", callback_data="earn"),
    )

    is_admin = uid == ADMIN_ID
    plan_text = "👑 <b>ELITE</b> (Admin)" if is_admin else "🆓 FREE (72h Trial активовано)"
    ref_link = f"https://t.me/{BOT_USERNAME}?start=ref{uid}"

    bot.send_message(msg.chat.id,
        f"⚡ <b>TITAN-94 «ОКО НЕБЕСНЕ»</b> активовано!\n\n"
        f"Суверенний AI-агент безпеки TON блокчейну.\n"
        f"Скануює · Лікує · Захищає · Заробляє\n\n"
        f"🎯 Твій план: {plan_text}\n"
        f"💼 Reserve Wallet: <code>{RESERVE_WALLET[:20]}...</code>\n\n"
        f"🔗 Реферальне посилання:\n<code>{ref_link}</code>\n\n"
        f"<i>Solo Deo Subjectus · DEI GRATIA</i>",
        reply_markup=kb
    )

# ─── /stats ──────────────────────────────────────────────────────────
@bot.message_handler(commands=["stats"])
def cmd_stats(msg: types.Message):
    s = api_get("/agent/stats")
    if not s:
        return bot.send_message(msg.chat.id, "❌ API недоступний. Перевір workflow API Server.")
    acc = float(s.get("accuracy") or s.get("aiAccuracy") or 0.847) * 100
    threats = s.get("threats", {})
    bot.send_message(msg.chat.id,
        f"📊 <b>TITAN-94 СТАТИСТИКА</b>\n\n"
        f"🔄 Цикли сканування: <b>{s.get('cycles', 0)}</b>\n"
        f"⚡ Healing cycles: <b>{s.get('healingCycles', 0)}</b>\n"
        f"🧠 Learn cycles: <b>{s.get('learnCycles', 0)}</b>\n"
        f"💰 Finance cycles: <b>{s.get('financeCycles', 0)}</b>\n\n"
        f"🎯 AI Точність: <b>{acc:.1f}%</b>\n"
        f"📚 Knowledge base: <b>{s.get('knowledgeSize', 0)}</b> паттернів\n"
        f"✅ Вразливостей залікувано: <b>{s.get('threatsHealed', 0)}</b>\n\n"
        f"⚠️ Активних загроз: <b>{threats.get('active', 0)}</b>\n"
        f"🔴 Critical: <b>{threats.get('critical', 0)}</b>\n\n"
        f"⏱ Uptime: <b>{int(float(s.get('uptime', 0)) // 60)} хв</b>"
    )

# ─── /scan ────────────────────────────────────────────────────────────
@bot.message_handler(commands=["scan"])
def cmd_scan(msg: types.Message):
    bot.send_message(msg.chat.id, "👁️ <b>Запускаю сканування TON мережі...</b>")
    result = api_post("/agent/scan", {})
    if result and result.get("success"):
        bot.send_message(msg.chat.id,
            f"✅ <b>Сканування завершено</b>\n\n"
            f"🔄 Цикл #<b>{result.get('cycle', '?')}</b>\n"
            f"⏰ {result.get('timestamp', 'now')}\n\n"
            f"Перевір <b>/threats</b> для нових загроз."
        )
    else:
        bot.send_message(msg.chat.id, "❌ Помилка запуску сканування. Перевір API Server.")

# ─── /analyze ────────────────────────────────────────────────────────
@bot.message_handler(commands=["analyze"])
def cmd_analyze(msg: types.Message):
    parts = msg.text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return bot.send_message(msg.chat.id, "📝 Використання: <code>/analyze EQ...</code>")

    address = parts[1].strip()
    bot.send_message(msg.chat.id, f"🔍 <b>Аналізую контракт:</b>\n<code>{address}</code>\n\n⏳ Gemini AI працює...")

    result = api_post("/analyze", {"address": address})
    if not result:
        return bot.send_message(msg.chat.id, "❌ Помилка аналізу.")

    sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵", "none": "✅"}.get(result.get("severity", ""), "⚪")
    vulns = result.get("vulnerabilities", [])
    vuln_text = "\n".join(f"  • [{v.get('severity','?').upper()}] {v.get('type','?')}" for v in vulns[:3]) or "  • Не виявлено"

    bot.send_message(msg.chat.id,
        f"🛡️ <b>TITAN-94 AUDIT REPORT</b>\n\n"
        f"📍 <code>{address[:24]}...</code>\n\n"
        f"{sev_emoji} Severity: <b>{result.get('severity', '?').upper()}</b>\n"
        f"📊 Score: <b>{result.get('score', 0)}/100</b>\n\n"
        f"⚠️ <b>Вразливості:</b>\n{vuln_text}\n\n"
        f"📋 <i>{result.get('summary', '')[:200]}</i>\n\n"
        f"💡 {result.get('recommendation', '')[:150]}"
    )

# ─── /honeypot ───────────────────────────────────────────────────────
@bot.message_handler(commands=["honeypot"])
def cmd_honeypot(msg: types.Message):
    parts = msg.text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return bot.send_message(msg.chat.id, "📝 Використання: <code>/honeypot EQ...</code>")

    address = parts[1].strip()
    bot.send_message(msg.chat.id, f"🍯 <b>HoneyPot перевірка:</b>\n<code>{address}</code>")

    result = api_post("/analyze/honeypot", {"address": address})
    if not result:
        return bot.send_message(msg.chat.id, "❌ Помилка перевірки.")

    is_hp = result.get("is_honeypot", False)
    conf  = int(float(result.get("confidence", 0)) * 100)
    flags = "\n".join(f"  🚩 {f}" for f in result.get("red_flags", [])[:3]) or "  • Немає"

    bot.send_message(msg.chat.id,
        f"{'🚨 HONEYPOT ВИЯВЛЕНО!' if is_hp else '✅ Honeypot не виявлено'}\n\n"
        f"📊 Впевненість: <b>{conf}%</b>\n"
        f"⚡ Ризик: <b>{result.get('risk_level', '?').upper()}</b>\n"
        f"{'🚫' if not result.get('safe_to_interact') else '✅'} Взаємодія: <b>{'НЕБЕЗПЕЧНО' if not result.get('safe_to_interact') else 'БЕЗПЕЧНО'}</b>\n\n"
        f"🚩 Red flags:\n{flags}\n\n"
        f"<i>{result.get('verdict', '')}</i>"
    )

# ─── /threats ────────────────────────────────────────────────────────
@bot.message_handler(commands=["threats"])
def cmd_threats(msg: types.Message):
    data = api_get("/vulnerabilities?limit=5&status=active")
    if not data:
        return bot.send_message(msg.chat.id, "❌ Помилка завантаження загроз.")

    vulns = data.get("vulnerabilities", [])
    stats = data.get("stats", {})

    text = (
        f"⚠️ <b>АКТИВНІ ЗАГРОЗИ TITAN-94</b>\n\n"
        f"🔴 Critical: <b>{stats.get('critical', 0)}</b> | "
        f"🟠 High: <b>{stats.get('high', 0)}</b> | "
        f"💰 TVL: <b>{int(float(stats.get('tvlAtRisk', 0))):,} TON</b>\n\n"
    )

    sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵"}
    for v in vulns[:5]:
        e = sev_emoji.get(v.get("severity", ""), "⚪")
        text += f"{e} <b>{v.get('title', '')}</b>\n"
        text += f"   Protocol: {v.get('protocol', '?')} | TVL: {float(v.get('tvlAtRisk', 0)):,.0f} TON\n\n"

    if not vulns:
        text += "✅ Активних загроз не виявлено!\n"

    bot.send_message(msg.chat.id, text)

# ─── /market ─────────────────────────────────────────────────────────
@bot.message_handler(commands=["market"])
def cmd_market(msg: types.Message):
    data = api_get("/arbitrage")
    if not data:
        return bot.send_message(msg.chat.id, "❌ Помилка завантаження арбітражу.")

    opps = data.get("opportunities") or data.get("data", {}).get("opportunities", [])
    text = "💹 <b>DEX АРБІТРАЖ — LIVE СИГНАЛИ</b>\n\nSTON.fi ↔ DeDust\n\n"

    for opp in opps[:5]:
        pair    = opp.get("pair") or opp.get("token", "?")
        profit  = opp.get("profit_pct") or opp.get("profitPct") or 0
        ton_val = opp.get("profit_ton") or opp.get("profitTon") or 0
        text += f"📊 <b>{pair}</b>: +{float(profit):.2f}% (+{float(ton_val):.3f} TON)\n"

    if not opps:
        text += "⏳ Сканую можливості...\n"

    text += f"\n💼 Reserve: <code>{RESERVE_WALLET[:20]}...</code>\n"
    text += "\n<i>Схеми заробітку: підписки PRO/ELITE, арбітраж, реферали CPA 15%</i>"
    bot.send_message(msg.chat.id, text)

# ─── /wallet ─────────────────────────────────────────────────────────
@bot.message_handler(commands=["wallet"])
def cmd_wallet(msg: types.Message):
    data = api_get("/ton/wallet")
    balance = data.get("balance_ton", "?") if data else "?"
    bot.send_message(msg.chat.id,
        f"💼 <b>RESERVE FUND</b>\n\n"
        f"📍 <code>{RESERVE_WALLET}</code>\n\n"
        f"💰 Баланс: <b>{balance} TON</b>\n\n"
        f"🔗 <a href='https://tonviewer.com/{RESERVE_WALLET}'>Переглянути на TON Viewer</a>"
    )

# ─── /earn ───────────────────────────────────────────────────────────
@bot.message_handler(commands=["earn"])
def cmd_earn(msg: types.Message):
    uid = str(msg.from_user.id)
    billing = api_get(f"/billing/balance/{uid}")
    refs    = api_get(f"/auth/referrals/{uid}")
    balance = float((billing or {}).get("balance_ton", 0))
    ref_count = len((refs or {}).get("referrals", []))
    ref_link  = f"https://t.me/{BOT_USERNAME}?start=ref{uid}"

    bot.send_message(msg.chat.id,
        f"💰 <b>EARN TERMINAL</b>\n\n"
        f"💎 Баланс рефералів: <b>{balance:.4f} TON</b>\n"
        f"👥 Запрошено: <b>{ref_count}/10</b> (Legion 10/10)\n"
        f"📈 CPA: <b>15%</b> з кожної оплати реферала\n\n"
        f"🔗 Твоє посилання:\n<code>{ref_link}</code>\n\n"
        f"{'✅ 10 рефералів = 10 днів ELITE безкоштовно!' if ref_count >= 10 else f'⏳ Ще {10 - ref_count} для ELITE'}\n\n"
        f"💡 Поспішай — ринок TON росте!"
    )

# ─── /heal ───────────────────────────────────────────────────────────
@bot.message_handler(commands=["heal"])
def cmd_heal(msg: types.Message):
    data = api_get("/vulnerabilities?status=active&limit=1")
    vulns = (data or {}).get("vulnerabilities", [])
    if not vulns:
        return bot.send_message(msg.chat.id, "✅ Активних вразливостей для лікування немає!")

    v = vulns[0]
    bot.send_message(msg.chat.id, f"⚡ <b>Генерую healing план через Gemini AI...</b>")

    plan = gemini_ask(
        f"Generate a 3-step healing plan for TON smart contract vulnerability: {v.get('title')} "
        f"(category: {v.get('category')}, severity: {v.get('severity')}). Be specific and concise.",
        max_tokens=250
    )

    bot.send_message(msg.chat.id,
        f"⚡ <b>HEALING PLAN</b>\n\n"
        f"🎯 {v.get('title', '')}\n"
        f"📍 Protocol: {v.get('protocol', '?')}\n\n"
        f"📋 <b>План виправлення:</b>\n{plan[:500]}"
    )

# ─── Callback buttons ────────────────────────────────────────────────
@bot.callback_query_handler(func=lambda c: True)
def handle_callback(call: types.CallbackQuery):
    data = call.data
    bot.answer_callback_query(call.id)
    msg_mock = call.message
    msg_mock.from_user = call.from_user
    msg_mock.text = f"/{data}"
    {
        "stats":   lambda: cmd_stats(msg_mock),
        "scan":    lambda: cmd_scan(msg_mock),
        "threats": lambda: cmd_threats(msg_mock),
        "market":  lambda: cmd_market(msg_mock),
        "earn":    lambda: cmd_earn(msg_mock),
    }.get(data, lambda: None)()

# ─── AI fallback for any text ────────────────────────────────────────
@bot.message_handler(func=lambda m: True)
def ai_fallback(msg: types.Message):
    text = msg.text or ""
    if len(text) < 3:
        return
    answer = gemini_ask(
        f"You are TITAN-94, an expert TON blockchain security AI assistant. "
        f"User asks: {text}\nAnswer in the same language as the user (Ukrainian/English). "
        f"Be concise (max 200 words). Use relevant TON/crypto context.",
        max_tokens=300
    )
    bot.send_message(msg.chat.id, f"🤖 <b>TITAN AI:</b>\n\n{answer}")

# ─── Main ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("♥ TITAN-94 Telegram Bot started")
    logger.info(f"Bot: @{BOT_USERNAME}")
    logger.info(f"Admin TG ID: {ADMIN_ID}")
    logger.info(f"Web App: {WEB_APP_URL}")
    logger.info(f"API: {API_BASE}")
    bot.infinity_polling(timeout=25, long_polling_timeout=20)
