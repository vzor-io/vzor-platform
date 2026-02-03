"""
Полное сканирование VPN портов и протоколов для Gemini API
"""
import httpx
from python.helpers.dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

# Все возможные комбинации портов и протоколов
PORTS = [12334, 8964, 16450, 16756, 1080, 10808, 10809]
PROTOCOLS = ["http", "socks5", "socks5h"]

async def test_proxy_combo(protocol, port):
    """Тестирует конкретную комбинацию протокол+порт"""
    proxy = f"{protocol}://127.0.0.1:{port}"
    
    try:
        # Тест 1: Проверка IP
        async with httpx.AsyncClient(proxy=proxy, timeout=5.0) as client:
            ip_response = await client.get("https://api64.ipify.org?format=json")
            detected_ip = ip_response.json().get("ip", "UNKNOWN")
            
            # Если IP российский, пропускаем
            if detected_ip.startswith("89.110"):
                return None
            
            # Тест 2: Gemini API
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            body = {
                "contents": [{
                    "role": "user",
                    "parts": [{"text": "Hi"}]
                }]
            }
            
            gemini_response = await client.post(
                url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key
                },
                timeout=10.0
            )
            
            return {
                "proxy": proxy,
                "ip": detected_ip,
                "gemini_status": gemini_response.status_code,
                "gemini_response": gemini_response.text[:200]
            }
    except Exception as e:
        return None

async def scan_all():
    print("🔍 Сканирование всех VPN комбинаций...\n")
    
    tasks = []
    for protocol in PROTOCOLS:
        for port in PORTS:
            tasks.append(test_proxy_combo(protocol, port))
    
    results = await asyncio.gather(*tasks)
    
    print("✅ РАБОЧИЕ КОМБИНАЦИИ:\n")
    working = [r for r in results if r is not None]
    
    if not working:
        print("❌ Ни одна комбинация не работает!")
    else:
        for result in working:
            print(f"Proxy: {result['proxy']}")
            print(f"  IP: {result['ip']}")
            print(f"  Gemini Status: {result['gemini_status']}")
            print(f"  Response: {result['gemini_response']}")
            print()

asyncio.run(scan_all())
