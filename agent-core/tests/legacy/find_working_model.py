"""
Тест всех доступных моделей Gemini через TUN
"""
import httpx
from python.helpers.dotenv import load_dotenv
import os
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

# Все возможные варианты моделей
models_to_test = [
    ("v1beta", "gemini-pro"),
    ("v1beta", "gemini-1.5-pro"),
    ("v1beta", "gemini-1.5-flash"),
    ("v1beta", "gemini-1.5-flash-001"),
    ("v1beta", "gemini-1.5-flash-002"),
    ("v1", "gemini-pro"),
    ("v1", "gemini-1.5-pro"),
]

async def test_model(version, model):
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent"
    body = {"contents": [{"role": "user", "parts": [{"text": "Скажи 'ВЗОР В СЕТИ, КОМАНДИР'"}]}]}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key
                }
            )
            
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return f"✅ {version}/{model}: {text[:50]}"
            else:
                return f"❌ {version}/{model}: {resp.status_code}"
    except Exception as e:
        return f"❌ {version}/{model}: {str(e)[:30]}"

async def main():
    print("Поиск рабочей модели Gemini...\n")
    
    for version, model in models_to_test:
        result = await test_model(version, model)
        print(result)
        
        if "✅" in result:
            print(f"\n🎉 НАЙДЕНА РАБОЧАЯ МОДЕЛЬ: {version}/{model}")
            return f"{version}/{model}"
    
    print("\n❌ Ни одна модель не работает")
    return None

asyncio.run(main())
