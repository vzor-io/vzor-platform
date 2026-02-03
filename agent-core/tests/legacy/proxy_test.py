import httpx
import asyncio

async def diagnose():
    proxy = "http://127.0.0.1:12334"
    print(f"--- ДИАГНОСТИКА ПРОКСИ ДЛЯ ВЗОРА ---")
    print(f"Прокси: {proxy}")
    
    async with httpx.AsyncClient(proxy=proxy) as client:
        # Test 1: External IP
        try:
            r = await client.get("https://api64.ipify.org?format=json", timeout=10)
            ip = r.json().get('ip')
            print(f"[TEST 1] Внешний IP через прокси: {ip}")
            if "89.110.68" in ip:
                print(">>> КРИТИЧЕСКАЯ ОШИБКА: IP определяется как РОССИЙСКИЙ. Прокси не работает.")
            else:
                print(">>> OK: IP успешно замаскирован.")
        except Exception as e:
            print(f"[TEST 1] Ошибка проверки IP: {e}")

        # Test 2: Reachability of Gemini
        try:
            r = await client.get("https://generativelanguage.googleapis.com/v1beta/models?key=DUMMY", timeout=10)
            print(f"[TEST 2] Доступ к Google API: {r.status_code}")
            if r.status_code == 400 and "User location is not supported" in r.text:
                print(">>> КРИТИЧЕСКАЯ ОШИБКА: Google блокирует запросы из-за геопозиции.")
            else:
                print(">>> OK: Google API достижимо (или ошибка ключа, что нормально).")
        except Exception as e:
            print(f"[TEST 2] Ошибка доступа к Google API: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose())
