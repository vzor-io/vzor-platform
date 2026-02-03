import httpx
from python.helpers.dotenv import load_dotenv
import os
import json
import asyncio

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

async def list_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    # БЕЗ прокси для теста
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nДоступные модели для generateContent:")
            for model in data.get("models", []):
                name = model.get("name", "")
                supported_methods = model.get("supportedGenerationMethods", [])
                if "generateContent" in supported_methods:
                    print(f"  - {name}")
        else:
            print(response.text)

asyncio.run(list_models())
