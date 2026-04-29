
import httpx
from app.config import TON_API, TON_API_KEY

async def get_transactions(address):
    url = f"{TON_API}/getTransactions"
    params = {"address": address, "limit": 10, "api_key": TON_API_KEY}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        return r.json()
