#!/usr/bin/env python3
"""Тест подключения к DeepSeek API"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")
model = os.getenv("CHAT_MODEL")

print(f"🔑 Using API Key: {api_key[:10]}...")
print(f"🧠 Using Model: {model}")

url = "https://api.deepseek.com/chat/completions"

payload = {
    "model": model.split("/")[-1], # убираем префикс deepseek/ если есть
    "messages": [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello! Just say 'DeepSeek is Online'"}
    ],
    "stream": False
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

print("\n🚀 Sending request to DeepSeek...")

try:
    # DeepSeek обычно не требует прокси из РФ, но проверим напрямую
    response = httpx.post(url, json=payload, headers=headers, timeout=30.0)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ SUCCESS!")
        print(f"Response: {data['choices'][0]['message']['content']}")
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n💥 EXCEPTION: {e}")
