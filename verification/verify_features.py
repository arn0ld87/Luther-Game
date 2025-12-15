from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173")
            page.goto("http://localhost:5173")

            # 1. Check Menu
            print("Waiting for menu...")
            # Taking a screenshot if it fails might help
            try:
                page.wait_for_selector("text=Der Luther Lauf", timeout=5000)
                print("Menu loaded")
            except Exception as e:
                print(f"Menu load failed: {e}")
                page.screenshot(path="verification/debug_menu.png")
                return

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
            # The close button might be an X or specific text. In my code it is "&times;" which renders as X or ×.
            # I used aria-label="Schließen" in one version? Or text-xl &times;
            # In `ArtStudio.tsx`: <button onClick={handleClose} ...>&times;</button>
            # Playwright might see it as text "×" or just click the button class.
            # Let's try finding by role button and index or text.
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
