import os
import litellm
from dotenv import load_dotenv

# Полная очистка переменных прокси для текущего процесса
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

load_dotenv()
key = os.getenv("GOOGLE_API_KEY")

print(f"Ключ: {key[:10]}...")
print("Режим TUN активен. Пробую прямое соединение...")

try:
    # Используем v1 для надежности
    litellm.google_api_version = "v1"
    
    response = litellm.completion(
        model="gemini/gemini-1.5-flash",
        messages=[{"role": "user", "content": "Ты меня слышишь?"}],
        api_key=key,
        timeout=15
    )
    print("\n--- ЕСТЬ КОНТАКТ! ---")
    print("Ответ:", response.choices[0].message.content)

except Exception as e:
    print("\nОШИБКА:")
    print(e)
    print("\nЕсли видишь 'Connection refused', попробуй в Happ сменить сервер (например, с США на Нидерланды).")