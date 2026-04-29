
import httpx
from app.config import TG_TOKEN, TG_CHAT_ID

async def send(msg):
    url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        await client.post(url, json={"chat_id": TG_CHAT_ID, "text": msg})
