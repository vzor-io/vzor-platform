#!/usr/bin/env python3
"""Тест стабильной модели 1.5 Flash 8-B с разными версиями API"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Пробуем разные эндпоинты для 1.5 Flash 8B
versions = ["v1beta", "v1"]
model = "gemini-1.5-flash-8b"

print(f"🔑 Используем ключ: {api_key[:20]}...")

for ver in versions:
    print(f"\n🧪 Тестируем {model} через API {ver}...")
    url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent"
    
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
        "Origin": "https://aistudio.google.com",
        "Referer": "https://aistudio.google.com/",
    }
    
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
        
        if response.status_code == 200:
            print(f"   ✅ УСПЕХ! Ответ: {response.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '').strip()}")
        elif response.status_code == 429:
            print(f"   ⏳ КВОТА ИСЧЕРПАНА (429).")
        else:
            print(f"   ❌ Код {response.status_code}: {response.json().get('error', {}).get('message', 'Unknown error')}")
            
    except Exception as e:
        print(f"   💥 Ошибка: {e}")
