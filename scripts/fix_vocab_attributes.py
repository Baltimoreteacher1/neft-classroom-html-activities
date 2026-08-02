import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

TARGET_WORDS = [
    "base", "bases", "trapezoid", "parallelogram", "triangle", "rectangle",
    "area", "perimeter", "volume", "height", "ratio", "percent", "equation", "expression", "variable"
]

def fix_and_clean_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # 1. Clean up any corrupted tags inside HTML attributes (e.g., width="<span...", src="<span...", alt="<span...")
    content = re.sub(r'="[^"]*<span[^>]*vocab-word[^>]*>(.*?)<\/span>[^"]*"', lambda m: f'="{m.group(1)}"', content)
    content = re.sub(r'src="[^"]*<span[^>]*vocab-word[^>]*>(.*?)<\/span>[^"]*"', lambda m: f'src="{m.group(1)}"', content)

    # 2. Function to safely replace words ONLY outside HTML tags
    def decorate_text_nodes(html_str):
        # Split html by tags <...>
        tokens = re.split(r'(<[^>]+>)', html_str)
        for i in range(len(tokens)):
            # If odd index, it's an HTML tag; skip!
            if i % 2 == 1:
                continue
            # Even index: text node!
            text = tokens[i]
            if not text.strip():
                continue
            for word in TARGET_WORDS:
                pattern = re.compile(r'\b(' + re.escape(word) + r')\b', re.IGNORECASE)
                text = pattern.sub(r'<span class="vocab-word" data-vocab="\1" style="border-bottom:2px dotted #0284C7; color:#0284C7; font-weight:800; cursor:pointer;" onclick="openVocabModal(\'\1\')">\1</span>', text)
            tokens[i] = text
        return "".join(tokens)

    # Apply only inside objectives / goals / action targets / learn-it sections
    def decorate_section(match):
        section_html = match.group(0)
        return decorate_text_nodes(section_html)

    content = re.sub(r'(<div[^>]*class="[^"]*(?:objective|action-target|talk-about-it|learning-goal)[^"]*"[^>]*>[\s\S]*?<\/div>)', decorate_section, content, flags=re.IGNORECASE)
    content = re.sub(r'(<section[^>]*class="[^"]*(?:objective|objectives|overview)[^"]*"[^>]*>[\s\S]*?<\/section>)', decorate_section, content, flags=re.IGNORECASE)

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            p = os.path.join(root, file)
            if fix_and_clean_file(p):
                count += 1

print(f"Cleaned and safely decorated objective text nodes across {count} HTML files!")
