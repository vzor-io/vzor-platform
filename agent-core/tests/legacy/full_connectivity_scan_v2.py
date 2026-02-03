import httpx
import os
import asyncio
import traceback
from dotenv import load_dotenv

load_dotenv()

async def test_method(name, proxy=None, version="v1beta", model="gemini-1.5-flash"):
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": "Hi"}]}]}
    
    print(f"\n--- Testing: {name} | Version: {version} | Model: {model} ---")
    
    try:
        # Use httpx with or without proxy
        if proxy:
            transports = {"http://": httpx.AsyncHTTPTransport(proxy=proxy), "https://": httpx.AsyncHTTPTransport(proxy=proxy)}
            client = httpx.AsyncClient(mounts=transports, timeout=10.0)
        else:
            client = httpx.AsyncClient(timeout=10.0)
            
        async with client:
            # Check IP
            try:
                ip_resp = await client.get("https://api64.ipify.org?format=json")
                print(f"IP: {ip_resp.json()['ip']}")
            except Exception as e:
                print(f"IP Check Failed: {e}")
            
            # Send Request
            resp = await client.post(url, json=payload)
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error Body: {resp.text[:300]}")
            else:
                print(">>> SUCCESS! <<<")
                return True
    except Exception:
        print(f"Method {name} crashed:")
        traceback.print_exc()
    return False

async def main():
    # 1. Direct (v1beta)
    await test_method("Direct", version="v1beta")
    
    # 2. HTTP Proxy (v1beta)
    await test_method("HTTP Proxy", proxy="http://127.0.0.1:12334", version="v1beta")
    
    # 3. Model variant check
    await test_method("Direct (latest)", model="gemini-1.5-flash-latest", version="v1beta")
    
    # 4. v1 version check
    await test_method("Direct (v1)", version="v1")

if __name__ == "__main__":
    asyncio.run(main())
