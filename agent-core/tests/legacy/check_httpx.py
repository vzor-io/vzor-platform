import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def check():
    proxy = "http://127.0.0.1:12334"
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Check IP
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            ip_resp = await client.get("https://api64.ipify.org?format=json")
            print(f"IP through proxy: {ip_resp.json()['ip']}")
        except Exception as e:
            print(f"IP Check failed: {e}")

    # Check Model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key={api_key}"
    print(f"Checking model at: {url}")
    
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(check())
