"""
Прямой вызов Gemini API, обходя LiteLLM.
Решает проблему с Vertex AI misrouting.
"""
import os
import json
import httpx
from typing import AsyncIterator, List, Dict, Any


class DirectGeminiClient:
    """Прямой клиент для Google AI Studio Gemini API"""
    
    def __init__(self, api_key: str, proxy: str = None):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.proxy = proxy
        
    async def generate_content_stream(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Стриминговая генерация контента через Gemini API.
        
        Args:
            model: Имя модели (например, "gemini-1.5-flash")
            messages: Список сообщений в формате LangChain/LiteLLM
            **kwargs: Дополнительные параметры (temperature, max_tokens и т.д.)
        
        Yields:
            Текстовые чанки ответа
        """
        # Конвертируем сообщения в формат Gemini
        contents = self._convert_messages(messages)
        
        # Формируем URL
        clean_model = model.split("/")[-1]
        url = f"{self.base_url}/models/{clean_model}:streamGenerateContent?alt=sse"
        
        # Параметры запроса - БЕЗ ключа в URL (передаём через заголовок)
        params = {}
        
        # Тело запроса
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": kwargs.get("temperature", 0.7),
                "maxOutputTokens": kwargs.get("max_tokens", 8192),
            }
        }
        
        # Создаём клиент с прокси
        client_kwargs = {"timeout": 60.0}
        if self.proxy:
            client_kwargs["proxy"] = self.proxy
            
        async with httpx.AsyncClient(**client_kwargs) as client:
            async with client.stream(
                "POST",
                url,
                params=params,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                    # US region headers
                    "Accept-Language": "en-US,en;q=0.9",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://aistudio.google.com",
                    "Referer": "https://aistudio.google.com/"
                }
            ) as response:
                response.raise_for_status()
                
                # Парсим SSE stream
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # Убираем "data: "
                        if data_str.strip() == "[DONE]":
                            break
                            
                        try:
                            data = json.loads(data_str)
                            # Извлекаем текст из ответа Gemini
                            if "candidates" in data:
                                for candidate in data["candidates"]:
                                    if "content" in candidate:
                                        for part in candidate["content"].get("parts", []):
                                            if "text" in part:
                                                yield part["text"]
                        except json.JSONDecodeError:
                            continue
    
    async def generate_content(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        **kwargs
    ) -> str:
        """
        Не-стриминговая генерация контента.
        
        Args:
            model: Имя модели
            messages: Список сообщений
            **kwargs: Дополнительные параметры
            
        Returns:
            Полный текст ответа
        """
        # Конвертируем сообщения в формат Gemini
        contents = self._convert_messages(messages)
        
        # Формируем URL
        clean_model = model.split("/")[-1]
        url = f"{self.base_url}/models/{clean_model}:generateContent"
        
        # Параметры запроса - БЕЗ ключа
        params = {}
        
        # Тело запроса
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": kwargs.get("temperature", 0.7),
                "maxOutputTokens": kwargs.get("max_tokens", 8192),
            }
        }
        
        # Создаём клиент с прокси
        client_kwargs = {"timeout": 60.0}
        if self.proxy:
            client_kwargs["proxy"] = self.proxy
            
        async with httpx.AsyncClient(**client_kwargs) as client:
            response = await client.post(
                url,
                params=params,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                    # US region headers
                    "Accept-Language": "en-US,en;q=0.9",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://aistudio.google.com",
                    "Referer": "https://aistudio.google.com/"
                }
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Извлекаем текст из ответа
            full_text = ""
            if "candidates" in data:
                for candidate in data["candidates"]:
                    if "content" in candidate:
                        for part in candidate["content"].get("parts", []):
                            if "text" in part:
                                full_text += part["text"]
            
            return full_text
    
    def _convert_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Конвертирует сообщения из формата LangChain/LiteLLM в формат Gemini.
        
        Gemini ожидает:
        {
            "role": "user" | "model",
            "parts": [{"text": "..."}]
        }
        """
        contents = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            # Маппинг ролей
            if role == "system":
                # Gemini не поддерживает system, добавляем как user
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


# Глобальный клиент (инициализируется при импорте)
_gemini_client = None


def get_gemini_client(proxy: str = None) -> DirectGeminiClient:
    """Получить глобальный экземпляр клиента Gemini"""
    global _gemini_client
    
    if _gemini_client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        _gemini_client = DirectGeminiClient(api_key=api_key, proxy=proxy)
    
    return _gemini_client
