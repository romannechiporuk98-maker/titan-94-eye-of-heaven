
import asyncio
from fastapi import FastAPI
from app.scanner import loop

app = FastAPI()

@app.on_event("startup")
async def startup():
    asyncio.create_task(loop())

@app.get("/")
def root():
    return {"status": "running"}
