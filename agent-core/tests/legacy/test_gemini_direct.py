import httpx
from python.helpers.dotenv import load_dotenv
import os
import json
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
proxy = "http://127.0.0.1:12334"  # HTTP вместо SOCKS5h

async def test_gemini():
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": "Скажи 'ВЗОР В СЕТИ, КОМАНДИР'"}]
        }]
    }
    
    async with httpx.AsyncClient(proxy=proxy, timeout=30.0) as client:
        response = await client.post(
            url,
            json=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            }
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ УСПЕХ!")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(response.text)

asyncio.run(test_gemini())
