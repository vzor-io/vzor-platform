import os, requests
proxy = "http://127.0.0.1:12334"
proxies = {"http": proxy, "https": proxy}
# OPENROUTER_API_KEY might be in env
api_key = os.environ.get("OPENROUTER_API_KEY") 

def test_openrouter():
    if not api_key:
        print("No OPENROUTER_API_KEY found.")
        return
        
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://agent-zero.ai/",
        "X-Title": "Agent Zero"
    }
    data = {
        "model": "google/gemini-flash-1.5",
        "messages": [{"role": "user", "content": "hi"}]
    }
    try:
        resp = requests.post(url, headers=headers, json=data, proxies=proxies, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"SUCCESS! -> {resp.json()['choices'][0]['message']['content'][:20]}...")
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_openrouter()
