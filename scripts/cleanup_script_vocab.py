import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

def clean_script_blocks(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Function to clean inline <script> and <style> blocks from any injected vocab spans
    def clean_js_block(match):
        js = match.group(0)
        # Remove any <span class="vocab-word"...>wrapper</span> and revert to inner text
        js = re.sub(r'<span[^>]*class="[^"]*vocab-word[^"]*"[^>]*>(.*?)<\/span>', r'\1', js)
        return js

    content = re.sub(r'<script[\s\S]*?<\/script>', clean_js_block, content, flags=re.IGNORECASE)
    content = re.sub(r'<style[\s\S]*?<\/style>', clean_js_block, content, flags=re.IGNORECASE)

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

modified = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            p = os.path.join(root, file)
            if clean_script_blocks(p):
                modified += 1

print(f"Cleaned JS script and style blocks across {modified} HTML files.")
