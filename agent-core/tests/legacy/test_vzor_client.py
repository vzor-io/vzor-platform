#!/usr/bin/env python3
"""Тест через DirectGeminiClient для полной имитации работы агента"""
import os
import asyncio
import json
from dotenv import load_dotenv

# Добавляем путь к core, если нужно
import sys
sys.path.append(os.path.join(os.getcwd(), "core"))

from gemini_direct import get_gemini_client

load_dotenv()

async def test_direct():
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"🔑 Используем ключ: {api_key[:20]}...")
    
    # Пытаемся использовать прокси, который прописан в коде
    proxy = "socks5h://127.0.0.1:12334"
    client = get_gemini_client(proxy=proxy)
    
    models = [
        "gemini-2.0-flash-exp",
        "gemini-exp-1206",
        "gemini-3-pro-preview",
        "gemini-2.5-pro",
    ]
    
    for model in models:
        print(f"\n🧪 Тестируем {model} через DirectGeminiClient...")
        messages = [{"role": "user", "content": "Say 'VZOR ONLINE'"}]
        
        try:
            # Используем не-стриминговый метод для простоты
            response = await client.generate_content(model=model, messages=messages)
            print(f"   ✅ УСПЕХ! Ответ: {response.strip()}")
            break # Если хоть одна заработала - супер
        except Exception as e:
            print(f"   ❌ Ошибка: {str(e)[:200]}")

if __name__ == "__main__":
    asyncio.run(test_direct())
