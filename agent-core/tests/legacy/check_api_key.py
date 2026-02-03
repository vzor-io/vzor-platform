"""
Проверка валидности API ключа через список моделей
"""
import httpx
from python.helpers.dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

async def check_api_key():
    print(f"API Key: {api_key[:20]}...")
    print("\nПроверка через /models endpoint...\n")
    
    # Пробуем получить список моделей
    url = "https://generativelanguage.googleapis.com/v1beta/models"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            url,
            headers={"x-goog-api-key": api_key}
        )
        
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            models = data.get("models", [])
            print(f"\n✅ API ключ валиден! Доступно моделей: {len(models)}\n")
            print("Модели с поддержкой generateContent:")
            for model in models:
                name = model.get("name", "")
                methods = model.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    print(f"  - {name.split('/')[-1]}")
        else:
            print(f"\n❌ Ошибка: {resp.text}")

asyncio.run(check_api_key())
