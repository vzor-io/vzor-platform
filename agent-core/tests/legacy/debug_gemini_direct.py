import httpx
import os
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

async def check():
    proxy = "http://127.0.0.1:12334"
    api_key = os.getenv("GEMINI_API_KEY")
    
    # URL that LiteLLM used
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Write a short poem about a cat."}]
        }]
    }
    
    print(f"Testing URL: {url}")
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            resp = await client.post(url, json=payload, timeout=20.0)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
        except Exception as e:
            print(f"Failed: {e}")

    # Try with gemini-1.5-flash-latest
    url_latest = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
    print(f"\nTesting URL (latest): {url_latest}")
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            resp = await client.post(url_latest, json=payload, timeout=20.0)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check())
