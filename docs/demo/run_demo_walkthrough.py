import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("DEMO_BASE_URL", "https://frontend-one-pearl-50.vercel.app")
OUTPUT_DIR = Path("/Users/lakshyagupta/Desktop/productspace_hackathon/docs/demo")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def run():
    print(f"Launching Playwright QA against: {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        # 1. Landing Page
        print("1. Capturing Landing Page...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "01_landing_page.png"), full_page=False)

        # 2. How Reel Works
        print("2. Capturing How Reel Works Traceability Map...")
        page.goto(f"{BASE_URL}/how-it-works", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "02_how_it_works.png"), full_page=False)

        # 3. Ingestion Pipeline
        print("3. Capturing Ingest Screen & Live Progression...")
        page.goto(f"{BASE_URL}/app/ingest", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "03_ingest_podcast.png"), full_page=False)

        # 4. Clip Selection with Reasons
        print("4. Capturing Clip Selection & 8-Signal Breakdown...")
        page.goto(f"{BASE_URL}/app/clips", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "04_clips_reasons.png"), full_page=False)

        # 5. Platform-Tailored Copy
        print("5. Capturing Platform Copy Engine & WYSIWYG Previews...")
        page.goto(f"{BASE_URL}/app/copy", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "05_platform_copy.png"), full_page=False)

        # 6. Brand Voice Memory
        print("6. Capturing Brand Voice Memory & Diff Citations...")
        page.goto(f"{BASE_URL}/app/voice-memory", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "06_voice_memory.png"), full_page=False)

        # 7. Content Calendar
        print("7. Capturing Content Calendar & IST Slots...")
        page.goto(f"{BASE_URL}/app/calendar", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "07_content_calendar.png"), full_page=False)

        # 8. Performance Feedback Loop
        print("8. Capturing Performance Feedback Loop & Causal Feed...")
        page.goto(f"{BASE_URL}/app/performance", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "08_performance_loop.png"), full_page=False)

        # 9. Brand Kit & Palette
        print("9. Capturing Brand Kit & Swatches...")
        page.goto(f"{BASE_URL}/app/brand", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "09_brand_kit.png"), full_page=False)

        # 10. Voice Studio Panel
        print("10. Capturing Wispr Flow Voice Studio (Raw vs Cleaned)...")
        page.goto(f"{BASE_URL}/app/voice-studio", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=str(OUTPUT_DIR / "10_voice_studio.png"), full_page=False)

        browser.close()
        print("All 10 walkthrough screenshots captured successfully!")

if __name__ == "__main__":
    run()
