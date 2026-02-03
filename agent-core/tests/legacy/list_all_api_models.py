#!/usr/bin/env python3
"""Листинг всех доступных моделей через API"""
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
        print("✅ Список получен успешно!\n")
        print(f"{'Name':<40} | {'DisplayName':<40}")
        print("-" * 83)
        for model in data.get("models", []):
            name = model.get("name", "").replace("models/", "")
            display_name = model.get("displayName", "")
            print(f"{name:<40} | {display_name:<40}")
    else:
        print(f"❌ Ошибка {response.status_code}: {response.text}")
except Exception as e:
    print(f"💥 Исключение: {e}")
