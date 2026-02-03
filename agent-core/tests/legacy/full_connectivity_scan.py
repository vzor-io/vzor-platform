import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_method(name, proxy=None, version="v1beta"):
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/{version}/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    
    print(f"\n--- Testing: {name} ({version}) ---")
    if proxy:
        print(f"Using proxy: {proxy}")
        client = httpx.AsyncClient(proxy=proxy, timeout=10.0)
    else:
        print(f"Using Direct Connection (System Default)")
        client = httpx.AsyncClient(timeout=10.0)
        
    async with client:
        try:
            # Check IP first
            ip_resp = await client.get("https://api64.ipify.org?format=json")
            ip = ip_resp.json()['ip']
            print(f"Detected IP: {ip}")
            
            # Send request
            resp = await client.post(url, json=payload)
            print(f"Status CODE: {resp.status_code}")
            if resp.status_code == 200:
                print(">>> SUCCESS! THIS METHOD WORKS! <<<")
                return True
            else:
                print(f"Response error: {resp.text[:200]}")
        except Exception as e:
            print(f"Error: {e}")
    return False

async def main():
    # Attempt list
    # 1. Direct v1beta
    await test_method("Direct v1beta", None, "v1beta")
    # 2. Direct v1
    await test_method("Direct v1", None, "v1")
    # 3. Proxy 12334 (HTTP)
    await test_method("HTTP Proxy v1beta", "http://127.0.0.1:12334", "v1beta")
    # 4. Proxy SOCKS5 (Hiddify usually has SOCKS on 12334 too)
    await test_method("SOCKS5 Proxy v1beta", "socks5://127.0.0.1:12334", "v1beta")

if __name__ == "__main__":
    asyncio.run(main())
