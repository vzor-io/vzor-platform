"""
Проверка TUN режима - прямое подключение без прокси
"""
import httpx
from python.helpers.dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

async def test_tun():
    print("Проверка TUN режима (без прокси)...\n")
    
    # БЕЗ ПРОКСИ - TUN должен маскировать всё автоматически
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Проверка IP
        ip_resp = await client.get("https://api64.ipify.org?format=json")
        ip = ip_resp.json().get("ip", "UNKNOWN")
        print(f"Текущий IP: {ip}")
        
        if ip.startswith("89.110"):
            print("❌ TUN не работает - показывает российский IP!")
            print("Включи TUN режим в Hiddify/Happ")
            return False
        
        print(f"✅ TUN работает! IP замаскирован: {ip}\n")
        
        # 2. Тест Gemini API
        print("Тестирую Gemini API...")
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        body = {
            "contents": [{
                "role": "user",
                "parts": [{"text": "Скажи 'ВЗОР В СЕТИ, КОМАНДИР'"}]
            }]
        }
        
        gemini_resp = await client.post(
            url,
            json=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            }
        )
        
        print(f"Gemini Status: {gemini_resp.status_code}")
        
        if gemini_resp.status_code == 200:
            data = gemini_resp.json()
            print("\n🎉 УСПЕХ! Gemini ответил:")
            print(data)
            return True
        else:
            print(f"Ошибка: {gemini_resp.text}")
            return False

asyncio.run(test_tun())
