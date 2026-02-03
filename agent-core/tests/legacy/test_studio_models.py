#!/usr/bin/env python3
"""Тест моделей из Google AI Studio"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Модели из AI Studio (разные варианты именования)
models_to_test = [
    # Gemini 3 Preview
    "gemini-3-flash-preview",
    "gemini-3.0-flash-preview",
    "gemini-3-pro-preview",
    "gemini-3.0-pro-preview",
    
    # Gemini 2.5
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    
    # Экспериментальные
    "gemini-2.0-flash-exp",
    "gemini-exp-1206",
    "gemini-exp-1114",
]

print(f"🔑 Используем ключ: {api_key[:20]}...\n")
print("=" * 70)

working_models = []

for model in models_to_test:
    print(f"\n🧪 Тестируем: {model}")
    print("-" * 70)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Привет"}]
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
            print(f"📝 Ответ: {text[:100]}")
            working_models.append(model)
        elif response.status_code == 429:
            print(f"⏳ КВОТА ИСЧЕРПАНА (429) - но модель существует!")
            working_models.append(f"{model} (quota)")
        elif response.status_code == 400:
            error_data = response.json()
            message = error_data.get("error", {}).get("message", "")
            if "location" in message.lower() or "region" in message.lower():
                print(f"🚫 ГЕОБЛОК")
            else:
                print(f"❌ ОШИБКА 400: {message[:100]}...")
        elif response.status_code == 404:
            print(f"❓ НЕ НАЙДЕНА (404)")
        else:
            print(f"❌ Статус {response.status_code}")
            
    except Exception as e:
        print(f"💥 Исключение: {str(e)[:100]}")

print("\n" + "=" * 70)
print("✅ Тестирование завершено!\n")

if working_models:
    print("🎉 РАБОЧИЕ МОДЕЛИ:")
    for m in working_models:
        print(f"   ✓ {m}")
else:
    print("😔 Рабочих моделей не найдено")
