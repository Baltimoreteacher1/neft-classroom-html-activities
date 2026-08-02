import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

VOCAB_LIST = [
    "add", "subtract", "multiply", "divide", "half", "rectangle", "trapezoid",
    "parallelogram", "triangle", "area", "perimeter", "volume", "fraction",
    "ratio", "unit rate", "equation", "expression", "variable", "factor",
    "gcf", "lcm", "reciprocal", "percent", "coordinate plane", "quadrant", "origin"
]

def clean_and_fix_script_tags(content):
    # Remove any misplaced formula-popup or math-workbench script tags anywhere in the file
    content = content.replace('  <script src="/assets/math-workbench-launcher.js" defer></script>\n  <script src="/assets/formula-popup.js" defer></script>\n', '')
    content = content.replace('<script src="/assets/math-workbench-launcher.js" defer></script>', '')
    content = content.replace('<script src="/assets/formula-popup.js" defer></script>', '')
    
    # Place them safely right before the LAST </body> tag in the document
    last_body = content.rfind("</body>")
    if last_body != -1:
        content = content[:last_body] + '  <script src="/assets/math-workbench-launcher.js" defer></script>\n  <script src="/assets/formula-popup.js" defer></script>\n' + content[last_body:]
    return content

def decorate_get_ready_vocab(content):
    # Target readiness panels, vcards, vgrid, get-ready sections
    def format_vterm(match):
        term = match.group(1).strip()
        clean_word = re.sub(r'<[^>]+>', '', term).lower()
        return f'<h3 class="vterm" style="cursor:pointer;" onclick="openVocabModal(\'{clean_word}\')"><span class="vocab-word" data-vocab="{clean_word}" style="border-bottom: 2px dotted #0284C7; color: #0284C7; font-weight: 800; cursor: pointer;">{term}</span> 🔍</h3>'

    # Match h3 class="vterm">word</h3>
    content = re.sub(r'<h3[^>]*class="[^"]*vterm[^"]*"[^>]*>(.*?)<\/h3>', format_vterm, content, flags=re.IGNORECASE)

    # Format vcard buttons / click handlers
    def format_vcard(match):
        vcard_html = match.group(0)
        # Extract term if present
        term_match = re.search(r'data-vocab="([^"]+)"', vcard_html)
        if term_match:
            term = term_match.group(1)
        else:
            term_search = re.search(r'class="vterm"[^>]*>(.*?)<\/h3>', vcard_html, re.IGNORECASE)
            term = re.sub(r'<[^>]+>', '', term_search.group(1)).strip().lower() if term_search else "vocab"
        
        if 'openVocabModal' not in vcard_html:
            vcard_html = vcard_html.replace('class="vcard"', f'class="vcard" style="cursor:pointer;" onclick="openVocabModal(\'{term}\')"')
        return vcard_html

    content = re.sub(r'<div[^>]*class="[^"]*vcard[^"]*"[^>]*>[\s\S]*?<\/div>', format_vcard, content, flags=re.IGNORECASE)

    return content

files_modified = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                original = f.read()

            content = clean_and_fix_script_tags(original)
            
            # If it's a readiness or get-ready page/section, decorate vocab
            if "readiness" in path or "get-ready" in content.lower() or "vgrid" in content:
                content = decorate_get_ready_vocab(content)

            if content != original:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                files_modified += 1

print(f"Processed repository: fixed script tags and decorated Get Ready vocabulary across {files_modified} HTML files.")
