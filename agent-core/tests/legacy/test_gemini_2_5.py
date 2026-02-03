"""
Тестируем точную конфигурацию из n8n:
- Host: https://generativelanguage.googleapis.com
- Model: gemini-2.5-flash
"""
import os
import httpx
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

async def test_gemini_2_5():
    """Тестируем модель gemini-2.5-flash как в n8n."""
    
    # Точная конфигурация из n8n
    base_url = "https://generativelanguage.googleapis.com/v1beta"
    model_name = "gemini-2.5-flash"
    
    url = f"{base_url}/models/{model_name}:generateContent"
    
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": "Скажи 'ВЗОР В СЕТИ' по-русски"}]
        }]
    }
    
    print(f"Testing n8n configuration:")
    print(f"URL: {url}")
    print(f"Model: {model_name}")
    print(f"{'='*60}\n")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": API_KEY
                }
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ SUCCESS! Response:")
                if "candidates" in data:
                    for candidate in data["candidates"]:
                        if "content" in candidate:
                            for part in candidate["content"].get("parts", []):
                                if "text" in part:
                                    print(part["text"])
                return True
            else:
                print(f"❌ FAILED: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

async def test_all_gemini_2_versions():
    """Тестируем все возможные версии Gemini 2.x."""
    
    models_to_test = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-exp-1206",  # Экспериментальная версия
    ]
    
    print(f"\n{'='*60}")
    print("Testing all Gemini 2.x models:")
    print(f"{'='*60}\n")
    
    for model in models_to_test:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        
        body = {
            "contents": [{
                "role": "user",
                "parts": [{"text": "Say 'OK'"}]
            }]
        }
        
        print(f"Testing: {model}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": API_KEY
                    }
                )
                
                if response.status_code == 200:
                    print(f"  ✅ SUCCESS!")
                    data = response.json()
                    if "candidates" in data:
                        for candidate in data["candidates"]:
                            if "content" in candidate:
                                for part in candidate["content"].get("parts", []):
                                    if "text" in part:
                                        print(f"  Response: {part['text']}")
                else:
                    print(f"  ❌ FAILED: {response.status_code}")
                    error_data = response.json()
                    if "error" in error_data:
                        print(f"  Error: {error_data['error'].get('message', 'Unknown')}")
                        
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
        
        print()
        await asyncio.sleep(1)

async def main():
    print(f"API Key present: {bool(API_KEY)}")
    print(f"API Key length: {len(API_KEY) if API_KEY else 0}\n")
    
    # Тестируем точную конфигурацию из n8n
    await test_gemini_2_5()
    
    # Тестируем все версии Gemini 2.x
    await test_all_gemini_2_versions()

if __name__ == "__main__":
    asyncio.run(main())
