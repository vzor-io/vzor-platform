#!/usr/bin/env python3
"""Проверка текущего IP и прокси конфигурации"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

print("🔍 Проверка сетевой конфигурации...\n")
print("=" * 70)

# 1. Проверка переменных окружения
print("\n📋 Переменные окружения:")
print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY', 'не установлено')}")
print(f"HTTPS_PROXY: {os.environ.get('HTTPS_PROXY', 'не установлено')}")

# 2. Проверка IP БЕЗ прокси
print("\n🌐 IP без прокси:")
try:
    response = httpx.get("https://api.ipify.org?format=json", timeout=5.0)
    ip_data = response.json()
    print(f"   IP: {ip_data.get('ip')}")
    
    # Проверка геолокации
    geo_response = httpx.get(f"http://ip-api.com/json/{ip_data.get('ip')}", timeout=5.0)
    geo_data = geo_response.json()
    print(f"   Страна: {geo_data.get('country')} ({geo_data.get('countryCode')})")
    print(f"   Город: {geo_data.get('city')}")
except Exception as e:
    print(f"   ❌ Ошибка: {e}")

# 3. Проверка IP С прокси (если настроен)
proxy_url = "socks5h://127.0.0.1:12334"
print(f"\n🔒 IP через прокси ({proxy_url}):")
try:
    client = httpx.Client(proxy=proxy_url, timeout=5.0)
    response = client.get("https://api.ipify.org?format=json")
    ip_data = response.json()
    print(f"   IP: {ip_data.get('ip')}")
    
    # Проверка геолокации
    geo_response = client.get(f"http://ip-api.com/json/{ip_data.get('ip')}")
    geo_data = geo_response.json()
    print(f"   Страна: {geo_data.get('country')} ({geo_data.get('countryCode')})")
    print(f"   Город: {geo_data.get('city')}")
    client.close()
except Exception as e:
    print(f"   ❌ Ошибка: {e}")

# 4. Тест Gemini API БЕЗ прокси
print("\n🧪 Тест Gemini БЕЗ прокси:")
api_key = os.getenv("GEMINI_API_KEY")
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
payload = {"contents": [{"parts": [{"text": "hi"}]}]}
headers = {"Content-Type": "application/json"}
params = {"key": api_key}

try:
    response = httpx.post(url, json=payload, headers=headers, params=params, timeout=10.0)
    if response.status_code == 200:
        print("   ✅ РАБОТАЕТ!")
    elif response.status_code == 429:
        print("   ⏳ Квота исчерпана (но доступ есть)")
    else:
        print(f"   ❌ Статус {response.status_code}")
        error = response.json().get("error", {}).get("message", "")[:100]
        print(f"   Ошибка: {error}")
except Exception as e:
    print(f"   ❌ Исключение: {str(e)[:100]}")

# 5. Тест Gemini API С прокси
print(f"\n🧪 Тест Gemini С прокси ({proxy_url}):")
try:
    client = httpx.Client(proxy=proxy_url, timeout=10.0)
    response = client.post(url, json=payload, headers=headers, params=params)
    if response.status_code == 200:
        print("   ✅ РАБОТАЕТ!")
    elif response.status_code == 429:
        print("   ⏳ Квота исчерпана (но доступ есть)")
    else:
        print(f"   ❌ Статус {response.status_code}")
        error = response.json().get("error", {}).get("message", "")[:100]
        print(f"   Ошибка: {error}")
    client.close()
except Exception as e:
    print(f"   ❌ Исключение: {str(e)[:100]}")

print("\n" + "=" * 70)
print("✅ Проверка завершена!")
