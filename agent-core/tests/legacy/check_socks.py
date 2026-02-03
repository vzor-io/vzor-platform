import httpx
import asyncio

async def check():
    proxy = "socks5h://127.0.0.1:12334"
    print(f"Testing SOCKS5h proxy: {proxy}")
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            resp = await client.get("https://ifconfig.me/ip", timeout=10.0)
            print(f"IP detected: {resp.text.strip()}")
            
            # Also test Google reachability
            resp = await client.get("https://generativelanguage.googleapis.com/v1beta/models", timeout=10.0)
            print(f"Gemini API Status: {resp.status_code}")
            print(f"Snippet: {resp.text[:100]}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check())
