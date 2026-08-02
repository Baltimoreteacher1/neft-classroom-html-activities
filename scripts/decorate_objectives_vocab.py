import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

TARGET_WORDS = [
    "base", "bases", "trapezoid", "parallelogram", "triangle", "rectangle",
    "area", "perimeter", "volume", "height", "width", "length", "ratio",
    "unit rate", "percent", "equation", "expression", "variable", "factor"
]

def decorate_objectives_in_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Find objective sections, card elements, or header blocks
    def process_obj_block(match):
        block = match.group(0)
        for word in TARGET_WORDS:
            pattern = re.compile(r'\b(' + re.escape(word) + r')\b', re.IGNORECASE)
            # Only decorate if not inside existing tags/spans
            def replace_word(m):
                w = m.group(1)
                clean_key = w.lower()
                return f'<span class="vocab-word" data-vocab="{clean_key}" style="border-bottom:2px dotted #0284C7; color:#0284C7; font-weight:800; cursor:pointer;" onclick="openVocabModal(\'{clean_key}\')">{w}</span>'
            
            # Avoid double-decorating
            if 'data-vocab="' + word.lower() + '"' not in block:
                block = pattern.sub(replace_word, block)
        return block

    # Match objective blocks, cards, action targets, language objectives
    content = re.sub(r'(<div[^>]*class="[^"]*(?:objective|action-target|talk-about-it|learning-goal|header|card)[^"]*"[^>]*>[\s\S]*?<\/div>)', process_obj_block, content, flags=re.IGNORECASE)
    content = re.sub(r'(<section[^>]*class="[^"]*(?:objective|objectives|overview|header)[^"]*"[^>]*>[\s\S]*?<\/section>)', process_obj_block, content, flags=re.IGNORECASE)

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

modified_count = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            p = os.path.join(root, file)
            if decorate_objectives_in_file(p):
                modified_count += 1

print(f"Decorated objective vocabulary terms across {modified_count} HTML files!")
