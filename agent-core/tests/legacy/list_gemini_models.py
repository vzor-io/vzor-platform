import httpx
import os
import json

api_key = os.environ.get("GEMINI_API_KEY")
proxy = "socks5h://127.0.0.1:12334"

async def list_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    async with httpx.AsyncClient(proxy=proxy, timeout=30.0) as client:
        response = await client.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nДоступные модели:")
            for model in data.get("models", []):
                name = model.get("name", "")
                supported_methods = model.get("supportedGenerationMethods", [])
                if "generateContent" in supported_methods:
                    print(f"  - {name.split('/')[-1]}")
        else:
            print(response.text)

import asyncio
asyncio.run(list_models())
