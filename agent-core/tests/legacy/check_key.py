from python.helpers.dotenv import load_dotenv
import os

load_dotenv()

key = os.environ.get("GEMINI_API_KEY", "")
print(f"Key present: {bool(key)}")
print(f"Key length: {len(key)}")
print(f"Key starts with: {key[:10] if key else 'NONE'}")
