import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

def clean_vocab_html(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Remove any <span class="vocab-word"...> from inside src="..." and alt="..." attributes
    def clean_attr(m):
        attr_name = m.group(1)
        val = m.group(2)
        clean_val = re.sub(r'<span[^>]*class="[^"]*vocab-word[^"]*"[^>]*>(.*?)<\/span>', r'\1', val)
        return f'{attr_name}="{clean_val}"'

    content = re.sub(r'(src|alt)="([^"]*<span[^>]*vocab-word[^"]*"[^>]*>[\s\S]*?<\/span>[^"]*)"', clean_attr, content)

    # Also clean up any double .svg.svg
    content = content.replace(".svg.svg", ".svg")

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

cleaned = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file == "vocab.html":
            p = os.path.join(root, file)
            if clean_vocab_html(p):
                cleaned += 1

print(f"Cleaned {cleaned} vocab.html files.")
