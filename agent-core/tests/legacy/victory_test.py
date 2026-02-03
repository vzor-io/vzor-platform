import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

def test_requests():
    api_key = os.getenv("GEMINI_API_KEY")
    proxy = "http://127.0.0.1:12334"
    proxies = {"http": proxy, "https": proxy}
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": "Hi"}]}]}
    
    print("--- TESTING WITH REQUESTS + BROWSER HEADERS ---")
    try:
        # Check IP
        ip_r = requests.get("https://api64.ipify.org?format=json", proxies=proxies, timeout=10)
        print(f"IP: {ip_r.json()['ip']}")
        
        # Send Request
        resp = requests.post(url, json=payload, headers=headers, proxies=proxies, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(">>> VICTORY! DIRECT GEMINI WORKS! <<<")
            print(f"Response: {resp.json()['candidates'][0]['content']['parts'][0]['text']}")
        else:
            print(f"Error: {resp.text[:500]}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_requests()
