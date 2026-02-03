#!/usr/bin/env python3
"""Глобальный сканер всех имен моделей Gemini"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

base_models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp",
    "gemini-exp-1206",
    "gemini-3-pro-preview",
    "gemini-2.5-pro",
]

# Варианты префиксов
prefixes = ["", "models/"]

print(f"🔑 Используем ключ: {api_key[:20]}...")

for base in base_models:
    for pref in prefixes:
        model = f"{pref}{base}"
        print(f"🧪 {model}...", end=" ", flush=True)
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{base}:generateContent"
        params = {"key": api_key}
        payload = {"contents": [{"parts": [{"text": "hi"}]}]}
        
        try:
            response = httpx.post(url, json=payload, params=params, timeout=5.0)
            if response.status_code == 200:
                print("✅ 200 OK!")
            elif response.status_code == 429:
                print("⏳ 429 Quota")
            elif response.status_code == 400:
                msg = response.json().get("error", {}).get("message", "")
                if "location" in msg.lower(): print("🚫 Geo")
                elif "expired" in msg.lower(): print("🔑 Expired")
                else: print(f"❌ 400: {msg[:30]}")
            elif response.status_code == 404:
                print("❓ 404")
            else:
                print(f"❗ {response.status_code}")
        except Exception as e:
            print(f"💥 {str(e)[:20]}")
