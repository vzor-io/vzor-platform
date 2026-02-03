from playwright.sync_api import sync_playwright
import time

def run():
    print("🕵️ Agent Eyes: Launching local verification...")
    with sync_playwright() as p:
        # Launch browser (headless but on the user's metal)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Go to the local app
        print("🌍 Navigating to http://localhost:5173 ...")
        page.goto("http://localhost:5173")
        
        # Wait for React to render (Red screen or Panels)
        page.wait_for_timeout(3000) 
        
        # Capture
        path = "ui_proof.png"
        page.screenshot(path=path)
        print(f"📸 Screenshot captured: {path}")
        
        title = page.title()
        print(f"📑 Page Title: {title}")

        # READ THE PAGE CONTENT (Self-Correction)
        content = page.evaluate("document.body.innerText")
        print("📝 PAGE CONTENT START:")
        print(content)
        print("📝 PAGE CONTENT END")
        
        browser.close()

if __name__ == "__main__":
    run()
