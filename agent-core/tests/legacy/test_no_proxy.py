import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_clean():
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"--- ТЕСТ БЕЗ ЯВНОГО ПРОКСИ (через системный TUN) ---")
    
    # Сначала проверим IP
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get("https://api64.ipify.org?format=json")
            print(f"Системный IP: {r.json()['ip']}")
        except Exception as e:
            print(f"Ошибка проверки IP: {e}")

        # Проверим Gemini (v1beta)
        url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": "Hi"}]}]}
        
        try:
            r = await client.post(url_beta, json=payload)
            print(f"Gemini v1beta Status: {r.status_code}")
            if r.status_code != 200:
                print(f"Response: {r.text[:200]}")
        except Exception as e:
            print(f"Gemini v1beta Failed: {e}")

        # Проверим Gemini (v1)
        url_v1 = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
        try:
            r = await client.post(url_v1, json=payload)
            print(f"Gemini v1 Status: {r.status_code}")
        except Exception as e:
            print(f"Gemini v1 Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_clean())
