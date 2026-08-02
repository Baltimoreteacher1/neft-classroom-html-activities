import os
import re

files_to_fix = [
    "math/statistics/histogram-master-lab/index.html",
    "math/unit-10/projects/world-architect/index.html",
    "math/unit-5/supplemental/world-architect-project/index.html",
    "neft-data-studio/index.html",
    "personal/leia/speech-screener/index.html",
    "reveal-evidence-studio/index.html",
    "teacher-data-dashboard/index.html",
    "wida-access/speaking/index.html",
    "wida-access/writing/index.html"
]

ROOT = "/Users/joelneft/neft-classroom-html-activities"

for rel in files_to_fix:
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove erroneously injected script tags from inside JS literals/scripts
    # Find any script tag injected before non-final </body>
    # First, strip all math-workbench-launcher and formula-popup script tags from content
    content = content.replace('  <script src="/assets/math-workbench-launcher.js" defer></script>\n  <script src="/assets/formula-popup.js" defer></script>\n', '')
    content = content.replace('<script src="/assets/math-workbench-launcher.js" defer></script>', '')
    content = content.replace('<script src="/assets/formula-popup.js" defer></script>', '')
    
    # Now append them properly before the LAST </body> tag in the file
    last_body_idx = content.rfind("</body>")
    if last_body_idx != -1:
        content = content[:last_body_idx] + '  <script src="/assets/math-workbench-launcher.js" defer></script>\n  <script src="/assets/formula-popup.js" defer></script>\n' + content[last_body_idx:]
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed the 9 files.")
