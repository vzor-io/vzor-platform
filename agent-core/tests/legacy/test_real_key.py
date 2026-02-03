#!/usr/bin/env python3
"""Простой тест реального API ключа из .env"""
import os
import httpx
from dotenv import load_dotenv

# Загружаем .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Используем ключ: {api_key[:20]}...")

# Простой запрос к Gemini API
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

payload = {
    "contents": [{
        "parts": [{"text": "Привет! Ответь одним словом: работаешь?"}]
    }]
}

headers = {
    "Content-Type": "application/json",
}

params = {
    "key": api_key
}

print("\n🔍 Тестируем подключение к Gemini API...")
print(f"URL: {url}")

try:
    response = httpx.post(url, json=payload, headers=headers, params=params, timeout=30.0)
    print(f"\n✅ Статус: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        print(f"📝 Ответ Gemini: {text}")
        print("\n🎉 API КЛЮЧ РАБОТАЕТ!")
    else:
        print(f"❌ Ошибка: {response.text}")
        
except Exception as e:
    print(f"❌ Исключение: {e}")
