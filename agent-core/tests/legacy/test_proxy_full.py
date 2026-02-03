import httpx
import asyncio

async def check():
    proxy = "http://127.0.0.1:12334"
    urls = [
        "https://api64.ipify.org?format=json",
        "https://www.google.com",
        "https://generativelanguage.googleapis.com/v1beta/models?key=DUMMY"
    ]
    
    print(f"Testing proxy: {proxy}")
    async with httpx.AsyncClient(proxy=proxy) as client:
        for url in urls:
            print(f"\nTesting: {url}")
            try:
                resp = await client.get(url, timeout=10.0)
                print(f"Status: {resp.status_code}")
                if "ipify" in url:
                    print(f"IP detected: {resp.json().get('ip')}")
                elif "google.com" in url:
                    print(f"Reachability: OK")
                else:
                    print(f"Response snippet: {resp.text[:200]}")
            except Exception as e:
                print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check())
