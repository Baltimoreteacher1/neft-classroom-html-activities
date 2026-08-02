import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

def fix_vocab_html_paths(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Fix any src="/assets/vocab-images/XYZ" that lost its .svg extension or got wrapped
    content = re.sub(r'src="([^"]*)/assets/vocab-images/([^".]+)"', r'src="\1/assets/vocab-images/\2.svg"', content)
    content = re.sub(r'src="\.\./\.\./assets/vocab-images/([^".]+)"', r'src="../../assets/vocab-images/\1.svg"', content)
    
    # Fix any double .svg.svg if created
    content = content.replace(".svg.svg", ".svg")

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

fixed = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file == "vocab.html" or file.endswith(".html"):
            p = os.path.join(root, file)
            if fix_vocab_html_paths(p):
                fixed += 1

print(f"Restored vocab image src paths across {fixed} HTML files.")
