import os
import re

ROOT = "/Users/joelneft/neft-classroom-html-activities"

# Common vocabulary dictionary for 6th grade math
VOCAB_WORDS = [
    "factor", "greatest common factor", "gcf", "least common multiple", "lcm",
    "fraction", "reciprocal", "numerator", "denominator", "quotient",
    "ratio", "rate", "unit rate", "equivalent ratio", "double number line",
    "expression", "distributive property", "term", "coefficient", "constant",
    "equation", "variable", "isolate", "inverse operation",
    "surface area", "net", "prism", "triangular prism", "vertex", "face",
    "coordinate plane", "quadrant", "x-axis", "y-axis", "origin", "ordered pair",
    "mean", "median", "mode", "range", "box plot", "iqr", "interquartile range", "outlier"
]

def process_html_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    modified = False

    # 1. Inject formula-popup.js script tag if missing
    if "formula-popup.js" not in content and "</body>" in content:
        content = content.replace("</body>", '  <script src="/assets/math-workbench-launcher.js" defer></script>\n  <script src="/assets/formula-popup.js" defer></script>\n</body>')
        modified = True

    # 2. Inject Content Objective Action Target ("Think About It") below "Talk About It" if missing
    if "Talk About It" in content or "talk-about-it" in content:
        if "action-target-card" not in content:
            # Pattern matching talk about it card/container
            pattern = re.compile(r'(<div[^>]*class="[^"]*talk-about-it[^"]*"[^>]*>[\s\S]*?<\/div>)', re.IGNORECASE)
            def add_action_target(match):
                talk_block = match.group(1)
                action_card = """\n<!-- Content Objective Action Target Corollary -->
<div class="action-target-card" style="background:#F0FDF4; border:1px solid #86EFAC; border-radius:14px; padding:14px 18px; margin-top:12px; font-family:'Nunito', sans-serif;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
    <span style="background:#0D9488; color:#FFF; font-size:0.75rem; font-weight:900; padding:2px 8px; border-radius:8px; text-transform:uppercase;">Think About It</span>
    <h4 style="margin:0; font-weight:900; font-size:0.95rem; color:#065F46;">Content Objective Action Target</h4>
  </div>
  <p style="margin:0; font-size:0.88rem; color:#0F172A; line-height:1.5;">
    <strong>I can apply this strategy step-by-step:</strong> Represent the problem with a visual model, perform inverse operations or scaling, and verify my solution.
  </p>
</div>"""
                return talk_block + action_card

            content, count = pattern.subn(add_action_target, content)
            if count > 0:
                modified = True

    # 3. Decorate vocabulary words in "Learn It" and "Notes" sections if not already decorated
    def decorate_vocab_section(match):
        section_html = match.group(0)
        # Avoid double-decorating
        for word in VOCAB_WORDS:
            pattern_word = re.compile(r'\b(' + re.escape(word) + r')\b', re.IGNORECASE)
            # Only replace if not inside HTML tags or existing vocab spans
            if not re.search(r'<span[^>]*vocab-word[^>]*>.*?'+re.escape(word)+r'.*?<\/span>', section_html, re.IGNORECASE):
                section_html = pattern_word.sub(r'<span class="vocab-word" data-vocab="\1" style="border-bottom:2px dotted #0284C7; color:#0284C7; font-weight:800; cursor:pointer;" onclick="if(window.openFormulaModal) window.openFormulaModal(\'area_rectangle\')">\1</span>', section_html, count=1)
        return section_html

    # Match learn-it or notes sections
    content = re.sub(r'(<section[^>]*class="[^"]*(?:learn-it|notes|guided-notes)[^"]*"[^>]*>[\s\S]*?<\/section>)', decorate_vocab_section, content, flags=re.IGNORECASE)

    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

processed = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            full_path = os.path.join(root, file)
            if process_html_file(full_path):
                processed += 1

print(f"Successfully processed {processed} HTML lesson files with formula popups, Action Targets, and Learn It / Notes vocabulary formatting!")
