
import asyncio
from app.ton_api import get_transactions
from app.smart_money import analyze_wallet
from app.anti_scam import check_scam
from app.sniper import detect_new_token
from bot.telegram import send

WATCH_WALLETS = ["EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"]

async def loop():
    while True:
        for wallet in WATCH_WALLETS:
            data = await get_transactions(wallet)
            txs = data.get("result", [])

            res = analyze_wallet(wallet, txs)
            if res:
                await send(f"SMART MONEY\nWallet: {res['wallet']}\nWinrate: {res['winrate']}%")

            for tx in txs:
                scam = check_scam(tx)
                if scam["risk"] > 80:
                    await send(f"SCAM ALERT: {scam}")

                if detect_new_token(tx):
                    await send("NEW TOKEN → SNIPE OPPORTUNITY")

        await asyncio.sleep(10)
