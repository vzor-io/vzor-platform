import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

print(f"Использую ключ: {api_key[:10]}...")

# Настройка
genai.configure(api_key=api_key)

try:
    # Пробуем получить список доступных моделей напрямую
    print("Запрашиваю список моделей у Google...")
    available_models = [m.name for m in genai.list_models()]
    print("Доступные модели:", available_models)
    
    if 'models/gemini-1.5-flash' in available_models or 'models/gemini-pro' in available_models:
        print("\n--- СВЯЗЬ ЕСТЬ! Пробую отправить сообщение... ---")
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Привет! Напиши: 'Связь установлена'")
        print("ОТВЕТ:", response.text)
    else:
        print("\nОШИБКА: Твоему ключу не доступны модели Gemini.")
        
except Exception as e:
    print(f"\nКРИТИЧЕСКАЯ ОШИБКА: {e}")