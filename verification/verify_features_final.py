from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5175")
            page.goto("http://localhost:5175")

            # 1. Check Menu
            print("Waiting for menu...")
            page.wait_for_selector("text=Der Luther Lauf", timeout=10000)
            print("Menu loaded")

            # 2. Check "Atelier" button and open it
            print("Opening Art Studio...")
            page.click("text=Atelier (KI-Tools)")
            page.wait_for_selector("text=Kirchen-Atelier")
            print("Art Studio opened")

            # 3. Check new "Zeichnen" tab
            print("Checking Drawing tab...")
            page.click("text=Zeichnen")
            page.wait_for_selector("text=Farbe")
            print("Drawing tab active")

            # 4. Close Art Studio
            print("Closing Art Studio...")
            page.click("text=×")

            # 5. Check "Reichskarte" button and open it
            print("Opening Map...")
            page.click("text=Reichskarte")
            page.wait_for_selector("text=Karte des Reiches")
            print("Map opened")

            # 6. Screenshot
            page.screenshot(path="verification/frontend_check.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
