import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def check_url(client, url, label):
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    try:
        resp = await client.post(url, json=payload, timeout=10.0)
        print(f"[{label}] Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"!!! SUCCESS WITH {label} !!!")
            return True
        else:
            print(f"   Error: {resp.text[:150]}")
    except Exception as e:
        print(f"[{label}] Failed: {e}")
    return False

async def main():
    api_key = os.getenv("GEMINI_API_KEY")
    proxy = "http://127.0.0.1:12334"
    
    # We test both with and without proxy because of the 'dual tunnel' complexity
    configs = [
        ("Direct (TUN)", None),
        ("Proxy 12334", proxy)
    ]
    
    versions = ["v1", "v1beta"]
    models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]
    
    for config_name, proxy_url in configs:
        print(f"\n>>>> TESTING CONFIG: {config_name}")
        async with httpx.AsyncClient(proxy=proxy_url) as client:
            # Check IP
            try:
                ip_r = await client.get("https://api64.ipify.org?format=json")
                print(f"   Current IP: {ip_r.json()['ip']}")
            except:
                print("   IP Check Failed")
                
            for v in versions:
                for m in models:
                    url = f"https://generativelanguage.googleapis.com/{v}/models/{m}:generateContent?key={api_key}"
                    await check_url(client, url, f"{v} | {m}")

if __name__ == "__main__":
    asyncio.run(main())
