#!/usr/bin/env python3
"""Тест Gemini 3.x моделей"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Gemini 3.x модели
models_to_test = [
    "gemini-3.0-flash",
    "gemini-3-flash",
    "gemini-3.0-flash-exp",
    "gemini-3-flash-exp",
    "gemini-3.0-flash-latest",
]

print(f"🔑 Используем ключ: {api_key[:20]}...\n")
print("=" * 70)

for model in models_to_test:
    print(f"\n🧪 Тестируем: {model}")
    print("-" * 70)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Привет! Ответь одним словом."}]
        }]
    }
    
    headers = {"Content-Type": "application/json"}
    params = {"key": api_key}
    
    try:
        response = httpx.post(url, json=payload, headers=headers, params=params, timeout=10.0)
        
        if response.status_code == 200:
            print(f"✅ РАБОТАЕТ! Статус: {response.status_code}")
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print(f"📝 Ответ: {text}")
            print(f"\n🎉 МОДЕЛЬ {model} ДОСТУПНА И РАБОТАЕТ!")
            break  # Нашли рабочую модель!
        elif response.status_code == 429:
            print(f"⏳ КВОТА ИСЧЕРПАНА (429)")
            print(f"   Модель доступна, но нужно подождать")
        elif response.status_code == 400:
            error_data = response.json()
            message = error_data.get("error", {}).get("message", "")
            if "location" in message.lower() or "region" in message.lower():
                print(f"🚫 ГЕОБЛОК: {message[:150]}...")
            else:
                print(f"❌ ОШИБКА 400: {message[:150]}...")
        elif response.status_code == 404:
            print(f"❓ МОДЕЛЬ НЕ НАЙДЕНА (404)")
        else:
            print(f"❌ Статус {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print(f"💥 Исключение: {str(e)[:150]}")

print("\n" + "=" * 70)
print("✅ Тестирование завершено!")
