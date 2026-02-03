import os, requests
proxy = "http://127.0.0.1:12334"
proxies = {"http": proxy, "https": proxy}

def check_service(url, label, use_proxy=False):
    try:
        if use_proxy:
            resp = requests.get(url, proxies=proxies, timeout=5)
        else:
            resp = requests.get(url, timeout=5)
        
        status = resp.status_code
        text = resp.text.strip()[:100]
        print(f"[{label}] Proxy: {use_proxy} | Status: {status} | Out: {text}")
    except Exception as e:
        print(f"[{label}] Proxy: {use_proxy} | Error: {e}")

if __name__ == "__main__":
    print("--- Detailed Proxy/Network Diagnostic ---")
    
    # Check IP
    check_service("https://ifconfig.me/ip", "IFCONFIG.ME", use_proxy=False)
    check_service("https://ifconfig.me/ip", "IFCONFIG.ME", use_proxy=True)
    
    check_service("https://api64.ipify.org", "IPIFY", use_proxy=False)
    check_service("https://api64.ipify.org", "IPIFY", use_proxy=True)

    # Check Gemini API accessibility (without Key, just to see if we get 403 or 400)
    # 400 location error usually happens before 403 API key error in blocked regions
    check_service("https://generativelanguage.googleapis.com/v1beta/models", "GEMINI_BASE", use_proxy=False)
    check_service("https://generativelanguage.googleapis.com/v1beta/models", "GEMINI_BASE", use_proxy=True)
    
    print("--- End Diagnostic ---")
