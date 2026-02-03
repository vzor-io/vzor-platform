import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def list_models():
    proxy = "http://127.0.0.1:12334"
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    print(f"Listing models with real key...")
    async with httpx.AsyncClient(proxy=proxy) as client:
        try:
            resp = await client.get(url, timeout=20.0)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                for m in models:
                    print(f"- {m['name']} (Methods: {m['supportedGenerationMethods']})")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
