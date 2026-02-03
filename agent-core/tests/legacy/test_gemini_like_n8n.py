"""
Тестируем Gemini API с разными конфигурациями, чтобы найти рабочую.
n8n успешно работает, значит проблема в нашей конфигурации.
"""
import os
import httpx
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

async def test_gemini_config(api_version, model_name, use_stream=False):
    """
    Тестирует конкретную конфигурацию Gemini API.
    
    Args:
        api_version: "v1" или "v1beta"
        model_name: имя модели (например, "gemini-1.5-flash", "gemini-pro")
        use_stream: использовать ли streaming
    """
    base_url = f"https://generativelanguage.googleapis.com/{api_version}"
    
    # Формируем URL
    endpoint = "streamGenerateContent" if use_stream else "generateContent"
    url = f"{base_url}/models/{model_name}:{endpoint}"
    
    # Тело запроса
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": "Say 'VZOR ONLINE' in Russian"}]
        }]
    }
    
    print(f"\n{'='*60}")
    print(f"Testing: {api_version} | {model_name} | stream={use_stream}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if use_stream:
                # Streaming request
                async with client.stream(
                    "POST",
                    url,
                    json=body,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": API_KEY
                    }
                ) as response:
                    print(f"Status: {response.status_code}")
                    if response.status_code == 200:
                        print("✅ SUCCESS! Response:")
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str.strip() != "[DONE]":
                                    try:
                                        data = json.loads(data_str)
                                        if "candidates" in data:
                                            for candidate in data["candidates"]:
                                                if "content" in candidate:
                                                    for part in candidate["content"].get("parts", []):
                                                        if "text" in part:
                                                            print(part["text"], end="")
                                    except:
                                        pass
                        print()
                        return True
                    else:
                        print(f"❌ FAILED: {response.status_code}")
                        print(f"Response: {await response.aread()}")
                        return False
            else:
                # Non-streaming request
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

async def main():
    print(f"API Key present: {bool(API_KEY)}")
    print(f"API Key length: {len(API_KEY) if API_KEY else 0}")
    
    # Тестируем разные комбинации
    configs = [
        # v1 API
        ("v1", "gemini-1.5-flash", False),
        ("v1", "gemini-1.5-flash-latest", False),
        ("v1", "gemini-1.5-pro", False),
        ("v1", "gemini-pro", False),
        
        # v1beta API
        ("v1beta", "gemini-1.5-flash", False),
        ("v1beta", "gemini-1.5-flash-latest", False),
        ("v1beta", "gemini-1.5-pro", False),
        ("v1beta", "gemini-pro", False),
        
        # Streaming (только для рабочих конфигураций)
        ("v1", "gemini-1.5-flash", True),
        ("v1beta", "gemini-1.5-flash", True),
    ]
    
    successful_configs = []
    
    for api_version, model_name, use_stream in configs:
        success = await test_gemini_config(api_version, model_name, use_stream)
        if success:
            successful_configs.append((api_version, model_name, use_stream))
        await asyncio.sleep(1)  # Небольшая задержка между запросами
    
    print(f"\n{'='*60}")
    print("SUMMARY - Successful Configurations:")
    print(f"{'='*60}")
    if successful_configs:
        for api_version, model_name, use_stream in successful_configs:
            stream_str = "streaming" if use_stream else "non-streaming"
            print(f"✅ {api_version} | {model_name} | {stream_str}")
    else:
        print("❌ No successful configurations found")

if __name__ == "__main__":
    asyncio.run(main())
