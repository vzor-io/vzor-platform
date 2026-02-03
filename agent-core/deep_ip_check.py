import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    proxy = "http://127.0.0.1:12334"
    urls = [
        "https://api64.ipify.org?format=json",
        "https://ifconfig.me/ip",
        "https://ipinfo.io/ip",
        "https://icanhazip.com"
    ]
    
    print(f"--- ПРОВЕРКА УТЕЧКИ IP ЧЕРЕЗ {proxy} ---")
    async with httpx.AsyncClient(proxy=proxy, timeout=10.0) as client:
        for url in urls:
            try:
                r = await client.get(url)
                ip = r.text.strip()
                print(f"{url}: {ip} {'[LEAK!]' if '89.110.68' in ip else '[OK]'}")
            except Exception as e:
                print(f"{url}: Failed ({e})")

    # Check Gemini reachability again
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    async with httpx.AsyncClient(proxy=proxy, timeout=10.0) as client:
        try:
            r = await client.get(url)
            print(f"\nGemini Models List Status: {r.status_code}")
            if r.status_code == 200:
                print(">>> VPN РАБОТАЕТ ДЛЯ GOOGLE! <<<")
            else:
                print(f"Gemini Error: {r.text[:200]}")
        except Exception as e:
            print(f"Gemini Request Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check())
