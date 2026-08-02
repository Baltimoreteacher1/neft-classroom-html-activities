import os
import re
import random

ROOT = "/Users/joelneft/neft-classroom-html-activities"

def shuffle_opts_in_html(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    def replace_opts_block(match):
        opts_block = match.group(0)
        # Extract correct answer key (e.g. data-ans="a")
        ans_match = re.search(r'data-ans="([a-d])"', opts_block, re.IGNORECASE)
        if not ans_match:
            return opts_block
        
        orig_ans = ans_match.group(1).lower()

        # Extract all button options: <button class="opt"...>text</button>
        buttons = re.findall(r'<button[^>]*class="[^"]*opt[^"]*"[^>]*data-v="([a-d])"[^>]*>([\s\S]*?)<\/button>', opts_block, re.IGNORECASE)
        if len(buttons) < 2:
            return opts_block

        # Find which text corresponds to orig_ans
        correct_text = None
        other_buttons = []
        for key, text in buttons:
            if key.lower() == orig_ans:
                correct_text = text
            else:
                other_buttons.append(text)

        if not correct_text:
            return opts_block

        # Combine all texts and shuffle
        all_texts = [correct_text] + other_buttons
        # Use seed based on file_path and block content for deterministic shuffle
        rng = random.Random(file_path + opts_block[:50])
        rng.shuffle(all_texts)

        # Find new index of correct_text
        new_ans_idx = all_texts.index(correct_text)
        keys = ['a', 'b', 'c', 'd']
        new_ans_key = keys[new_ans_idx]

        # Reconstruct buttons
        new_buttons_html = []
        for i, text in enumerate(all_texts):
            k = keys[i]
            new_buttons_html.append(f'            <button class="opt" data-v="{k}">{text}</button>')

        # Replace data-ans in header
        new_block = re.sub(r'data-ans="[a-d]"', f'data-ans="{new_ans_key}"', opts_block, flags=re.IGNORECASE)
        # Replace buttons area
        buttons_combined = "\n".join(new_buttons_html)
        new_block = re.sub(r'(<button[^>]*class="[^"]*opt[^"]*"[\s\S]*?<\/button>\s*)+', f'\n{buttons_combined}\n          ', new_block, flags=re.IGNORECASE)

        return new_block

    # Match <div class="opts"...> ... </div>
    content = re.sub(r'<div[^>]*class="[^"]*opts[^"]*"[^>]*data-ans="[a-d]"[^>]*>[\s\S]*?<\/div>', replace_opts_block, content, flags=re.IGNORECASE)

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

shuffled_files = 0
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or "dist" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            p = os.path.join(root, file)
            if "readiness" in p or "warmup" in p or "get-ready" in p or "spiral-review" in p:
                if shuffle_opts_in_html(p):
                    shuffled_files += 1

print(f"Shuffled choices and updated data-ans in {shuffled_files} readiness HTML files!")
