import httpx
import asyncio

async def test_port(port):
    proxy = f"http://127.0.0.1:{port}"
    print(f"\n--- TESTING PORT: {port} ---")
    async with httpx.AsyncClient(proxy=proxy, timeout=5.0) as client:
        try:
            r = await client.get("https://api64.ipify.org?format=json")
            ip = r.json()['ip']
            print(f"IP: {ip} {'[MASKED]' if '89.110.68' not in ip else '[LEAKED]'}")
        except Exception as e:
            print(f"Port {port} failed IP check")

        try:
            # Use a simple endpoint to check reachability
            r = await client.get("https://www.google.com")
            print(f"Google: {r.status_code} OK")
        except Exception as e:
            print(f"Port {port} failed Google check")

async def main():
    ports = [12334, 8964, 16450, 16756]
    for p in ports:
        await test_port(p)

if __name__ == "__main__":
    asyncio.run(main())
