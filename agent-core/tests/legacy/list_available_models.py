"""
Получаем список доступных моделей Gemini для текущего API ключа.
"""
import os
import httpx
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

async def list_models(api_version):
    """Получить список доступных моделей для данной версии API."""
    base_url = f"https://generativelanguage.googleapis.com/{api_version}"
    url = f"{base_url}/models"
    
    print(f"\n{'='*60}")
    print(f"Listing models for API version: {api_version}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers={
                    "x-goog-api-key": API_KEY
                }
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                
                print(f"\n✅ Found {len(models)} models:")
                print(f"{'='*60}")
                
                for model in models:
                    name = model.get("name", "Unknown")
                    display_name = model.get("displayName", "Unknown")
                    supported_methods = model.get("supportedGenerationMethods", [])
                    
                    print(f"\nModel: {name}")
                    print(f"  Display Name: {display_name}")
                    print(f"  Supported Methods: {', '.join(supported_methods)}")
                    
                    # Проверяем, поддерживает ли модель generateContent
                    if "generateContent" in supported_methods:
                        print(f"  ✅ Supports generateContent")
                    else:
                        print(f"  ❌ Does NOT support generateContent")
                
                return models
            else:
                print(f"❌ FAILED: {response.status_code}")
                print(f"Response: {response.text}")
                return []
                
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return []

async def main():
    print(f"API Key present: {bool(API_KEY)}")
    print(f"API Key length: {len(API_KEY) if API_KEY else 0}")
    
    # Проверяем обе версии API
    v1_models = await list_models("v1")
    await asyncio.sleep(1)
    v1beta_models = await list_models("v1beta")
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"v1 models: {len(v1_models)}")
    print(f"v1beta models: {len(v1beta_models)}")
    
    # Найдем модели, которые поддерживают generateContent
    print(f"\n{'='*60}")
    print("Models that support generateContent:")
    print(f"{'='*60}")
    
    all_models = v1_models + v1beta_models
    working_models = []
    
    for model in all_models:
        supported_methods = model.get("supportedGenerationMethods", [])
        if "generateContent" in supported_methods:
            name = model.get("name", "Unknown")
            working_models.append(name)
            print(f"✅ {name}")
    
    if not working_models:
        print("❌ No models support generateContent!")
        print("\nThis could mean:")
        print("1. API key doesn't have access to Gemini models")
        print("2. Account region restrictions")
        print("3. API key permissions issue")

if __name__ == "__main__":
    asyncio.run(main())
