import os
import asyncio
import litellm
import httpx

# Настройка прокси
proxy = "http://127.0.0.1:12334"

# Включаем логирование
os.environ["LITELLM_LOG"] = "DEBUG"

async def test():
    api_key = os.environ.get("GEMINI_API_KEY") or "AIzaSyBnTD6hr7azytBkthjRrAUNxCzN-kh3kI8"
    
    # 1. Попытка через OPENAI-совместимый эндпоинт (иногда он менее строг к IP)
    print("--- Testing OpenAI-compatible route ---")
    try:
        resp = await litellm.acompletion(
            model="openai/gemini-1.5-flash", 
            messages=[{"role": "user", "content": "hi"}],
            api_key=api_key,
            api_base="https://generativelanguage.googleapis.com/v1beta/openai",
            headers={"x-goog-api-version": "v1beta"},
            http_client=httpx.AsyncClient(mounts={
                "http://": httpx.HTTPTransport(proxy=proxy),
                "https://": httpx.HTTPTransport(proxy=proxy),
            })
        )
        print("Success (OpenAI route)!")
        print(resp.choices[0].message.content)
        return
    except Exception as e:
        print(f"Failed (OpenAI route): {e}")

    # 2. Попытка через нативный gemini провайдер с ЯВНЫМ указанием базового URL
    print("\n--- Testing Native Gemini route with explicit v1beta ---")
    try:
        resp = await litellm.acompletion(
            model="gemini/gemini-1.5-flash",
            messages=[{"role": "user", "content": "hi"}],
            api_key=api_key,
            api_base="https://generativelanguage.googleapis.com/v1beta",
            http_client=httpx.AsyncClient(mounts={
                "http://": httpx.HTTPTransport(proxy=proxy),
                "https://": httpx.HTTPTransport(proxy=proxy),
            })
        )
        print("Success (Native route)!")
        print(resp.choices[0].message.content)
    except Exception as e:
        print(f"Failed (Native route): {e}")

if __name__ == "__main__":
    asyncio.run(test())
