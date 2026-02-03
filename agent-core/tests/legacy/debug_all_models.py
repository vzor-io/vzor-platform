#!/usr/bin/env python3
"""Детальный список всех доступных моделей и их описание"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"🔑 Используем ключ: {api_key[:20]}...\n")

url = f"https://generativelanguage.googleapis.com/v1beta/models"
params = {"key": api_key}

try:
    response = httpx.get(url, params=params, timeout=10.0)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Найдено моделей: {len(data.get('models', []))}\n")
        print(f"{'Name':<40} | {'Methods'}")
        print("-" * 70)
        for m in data.get("models", []):
            name = m.get("name", "").replace("models/", "")
            methods = ",".join(m.get("supportedGenerationMethods", []))
            print(f"{name:<40} | {methods}")
    else:
        print(f"❌ Ошибка {response.status_code}: {response.text}")
except Exception as e:
    print(f"💥 Исключение: {e}")
