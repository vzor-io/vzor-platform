#!/usr/bin/env python3
"""Тест стабильных моделей Gemini 1.5 с новым ключом"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
]

print(f"🔑 Используем ключ: {api_key[:20]}...")
print("🌐 Имитируем запрос из AI Studio...\n")

for model in models:
    print(f"🧪 Тестируем {model}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
        "Origin": "https://aistudio.google.com",
        "Referer": "https://aistudio.google.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
        
        if response.status_code == 200:
            print(f"   ✅ УСПЕХ! Ответ: {response.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '').strip()}")
        elif response.status_code == 429:
            print(f"   ⏳ КВОТА ИСЧЕРПАНА (429). Значит модель доступна!")
        else:
            print(f"   ❌ Код {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print(f"   💥 Ошибка: {e}")
    print("-" * 50)
