"""
Облачный прокси для Gemini API
Использует публичный CORS proxy для обхода региональных ограничений
"""
import httpx
import os
import asyncio
import json

class CloudProxyGeminiClient:
    """Клиент Gemini через облачный прокси"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        # Используем публичные CORS прокси
        self.proxies = [
            "https://corsproxy.io/?",
            "https://api.allorigins.win/raw?url=",
            "https://cors-anywhere.herokuapp.com/",
        ]
    
    async def generate_content(self, model: str, messages: list, **kwargs) -> str:
        """Генерация контента через облачный прокси"""
        
        # Конвертируем сообщения
        contents = self._convert_messages(messages)
        
        # URL для запроса
        clean_model = model.split("/")[-1]
        target_url = f"{self.base_url}/models/{clean_model}:generateContent"
        
        # Тело запроса
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": kwargs.get("temperature", 0.7),
                "maxOutputTokens": kwargs.get("max_tokens", 8192),
            }
        }
        
        # Пробуем каждый прокси
        for proxy_url in self.proxies:
            try:
                print(f"Пробую прокси: {proxy_url[:30]}...")
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # Формируем URL через прокси
                    full_url = f"{proxy_url}{target_url}"
                    
                    response = await client.post(
                        full_url,
                        json=body,
                        headers={
                            "Content-Type": "application/json",
                            "x-goog-api-key": self.api_key,
                            "Accept-Language": "en-US,en;q=0.9",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        print(f"✅ Успех через {proxy_url[:30]}")
                        return text
                    else:
                        print(f"  Статус: {response.status_code}")
                        
            except Exception as e:
                print(f"  Ошибка: {str(e)[:50]}")
                continue
        
        raise Exception("Все облачные прокси не сработали")
    
    def _convert_messages(self, messages: list) -> list:
        """Конвертация сообщений в формат Gemini"""
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                gemini_role = "user"
                content = f"[System]: {content}"
            elif role == "assistant":
                gemini_role = "model"
            else:
                gemini_role = "user"
            
            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}]
            })
        
        return contents


# Тест
async def test_cloud_proxy():
    api_key = "AIzaSyCTzHm63DhKEj5_xTd0TJAe4frN4M6rsdo"
    client = CloudProxyGeminiClient(api_key)
    
    print("Тест облачного прокси для Gemini API\n")
    
    messages = [{
        "role": "user",
        "content": "Скажи 'ВЗОР В СЕТИ, КОМАНДИР'"
    }]
    
    try:
        response = await client.generate_content("gemini-1.5-flash", messages)
        print(f"\n🎉 ОТВЕТ GEMINI:\n{response}")
        return True
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_cloud_proxy())
