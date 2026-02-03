import os
import google.generativeai as genai
import socket
from dotenv import load_dotenv

load_dotenv()

# Force IPv4 preference for the current process
def force_ipv4():
    old_getaddrinfo = socket.getaddrinfo
    def new_getaddrinfo(*args, **kwargs):
        res = old_getaddrinfo(*args, **kwargs)
        return [r for r in res if r[0] == socket.AF_INET]
    socket.getaddrinfo = new_getaddrinfo

force_ipv4()

def test_native():
    api_key = os.getenv("GEMINI_API_KEY")
    print("--- TESTING NATIVE GOOGLE-GENERATIVEAI (IPv4 Forced) ---")
    
    # Try to check IP via simple socket just for info
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        print(f"Local IP for 8.8.8.8: {s.getsockname()[0]}")
        s.close()
    except:
        pass

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        print("Sending request to Gemini...")
        response = model.generate_content("Say 'VZOR IS ONLINE' if you can hear me.")
        print("Response received!")
        print(f"Content: {response.text}")
        print(">>> SUCCESS! NATIVE LIBRARY WORKS! <<<")
    except Exception as e:
        print(f"Native Test Failed: {e}")
        # Print more details if possible
        if hasattr(e, 'status_code'):
             print(f"Status Code: {e.status_code}")

if __name__ == "__main__":
    test_native()
