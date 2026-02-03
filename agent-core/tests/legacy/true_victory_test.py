import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

def victory_direct():
    api_key = os.getenv("GEMINI_API_KEY")
    proxy = "http://127.0.0.1:12334"
    proxies = {"http": proxy, "https": proxy}
    
    # We will test v1 (STABLE) instead of v1beta
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Hello! Confirm that you can hear me."}]
        }]
    }
    
    print("--- ПОПЫТКА ПРЯМОЙ ПОБЕДЫ (v1 STABLE) ---")
    try:
        resp = requests.post(url, json=payload, timeout=20)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(">>> УРА! ПРЯМОЕ ПОДКЛЮЧЕНИЕ РАБОТАЕТ! <<<")
            print(f"Ответ: {resp.json()['candidates'][0]['content']['parts'][0]['text']}")
        else:
            print(f"Ошибка v1: {resp.text[:500]}")
            
            # Если v1 не сработал, попробуем v1beta но с расширенным ID
            print("\nПробуем v1beta с моделью 001...")
            url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key={api_key}"
            resp_beta = requests.post(url_beta, json=payload, timeout=20)
            print(f"Status (beta-001): {resp_beta.status_code}")
            if resp_beta.status_code == 200:
                print(">>> ПОБЕДА ЧЕРЕЗ v1beta-001! <<<")
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    victory_direct()
