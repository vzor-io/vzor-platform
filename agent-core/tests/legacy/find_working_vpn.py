"""
Тест портов с реальным Gemini API вызовом
"""
import httpx
from python.helpers.dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
ports = [12334, 8964, 16450, 16756]

async def test_port(port):
    """Тестирует порт с Gemini API"""
    print(f"\n🔍 Тестирую порт {port}...")
    
    for protocol in ["http", "socks5h"]:
        proxy = f"{protocol}://127.0.0.1:{port}"
        
        try:
            async with httpx.AsyncClient(proxy=proxy, timeout=10.0) as client:
                # Проверка IP
                ip_resp = await client.get("https://api64.ipify.org?format=json")
                ip = ip_resp.json().get("ip", "UNKNOWN")
                print(f"  {protocol}: IP = {ip}", end="")
                
                # Если IP российский, пропускаем Gemini тест
                if ip.startswith("89.110"):
                    print(" [LEAKED]")
                    continue
                
                # Тест Gemini
                url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
                body = {"contents": [{"role": "user", "parts": [{"text": "Hi"}]}]}
                
                gemini_resp = await client.post(
                    url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key
                    }
                )
                
                print(f" → Gemini: {gemini_resp.status_code}")
                
                if gemini_resp.status_code == 200:
                    print(f"    ✅ РАБОТАЕТ! Используй: {proxy}")
                    return proxy
                elif gemini_resp.status_code != 404:
                    print(f"    Response: {gemini_resp.text[:100]}")
                    
        except Exception as e:
            print(f"  {protocol}: Error - {str(e)[:50]}")
    
    return None

async def main():
    print("Поиск рабочей конфигурации VPN для Gemini...\n")
    
    for port in ports:
        result = await test_port(port)
        if result:
            print(f"\n🎉 НАЙДЕНА РАБОЧАЯ КОНФИГУРАЦИЯ: {result}")
            return result
    
    print("\n❌ Ни один порт не работает с Gemini API")
    return None

asyncio.run(main())
