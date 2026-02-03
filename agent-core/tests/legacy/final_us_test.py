"""
Финальный тест с полной американской конфигурацией
"""
import httpx
import os
import asyncio

# Устанавливаем американские переменные окружения
os.environ["LANG"] = "en_US.UTF-8"
os.environ["TZ"] = "America/New_York"

api_key = "AIzaSyCTzHm63DhKEj5_xTd0TJAe4frN4M6rsdo"

async def final_test():
    print("🇺🇸 Финальный тест с полной US конфигурацией\n")
    
    # Используем Google DNS (8.8.8.8) явно
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Проверка IP
        ip_resp = await client.get("https://api64.ipify.org?format=json")
        ip = ip_resp.json().get("ip")
        print(f"IP: {ip}")
        
        # Тест Gemini с полными US заголовками
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        resp = await client.get(
            url,
            headers={
                "x-goog-api-key": api_key,
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Origin": "https://aistudio.google.com",
                "Referer": "https://aistudio.google.com/",
                "Accept": "application/json",
                "DNT": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site"
            }
        )
        
        print(f"Status: {resp.status_code}\n")
        
        if resp.status_code == 200:
            data = resp.json()
            models = [m["name"].split("/")[-1] for m in data.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
            print(f"✅ УСПЕХ! Доступно моделей: {len(models)}")
            print(f"Модели: {', '.join(models[:5])}")
        else:
            print(f"❌ Ошибка:\n{resp.text}")

asyncio.run(final_test())
