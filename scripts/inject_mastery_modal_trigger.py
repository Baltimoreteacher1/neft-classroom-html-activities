#!/usr/bin/env python3
import os
import re

repo_dir = '/Users/joelneft/neft-classroom-html-activities'

all_game_paths = [
    'math/games/u1-factor-frenzy/index.html',
    'math/games/u1-decimal-dash/index.html',
    'math/games/u2-fraction-frenzy/index.html',
    'math/games/u3-ratio-rush/index.html',
    'math/games/u4-percent-power/index.html',
    'math/games/u5-area-attack/index.html',
    'math/games/u6-expression-express/index.html',
    'math/games/u7-equation-quest/index.html',
    'math/games/u8-data-dash/index.html',
    'math/games/u9-coordinate-quest/index.html',
    'math/games/u10-volume-blast/index.html',
    'math/games/placement-quest/index.html',
    'math/unit-1/games/unit1-factor-frenzy.html',
    'math/unit-2/games/unit2-fraction-foundry.html',
    'math/unit-2/games/unit2-fraction-kitchen.html',
    'math/unit-3/games/unit3-ratio-rally.html',
    'math/unit-4/games/unit4-discount-dash.html',
    'math/unit-5/games/unit5-area-architect.html',
    'math/unit-6/games/unit6-expression-engine.html',
    'math/unit-7/games/unit9-coordinate-quest.html',
    'math/unit-8/games/unit7-equation-escape.html',
    'math/statistics/games/unit8-stats-slam.html',
    'math/unit-9/games/unit9-variable-velocity.html',
    'math/unit-10/games/unit10-volume-vault.html'
]

count = 0

for rel_path in all_game_paths:
    full_path = os.path.join(repo_dir, rel_path)
    if not os.path.exists(full_path): continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # If show("result") is called, ensure window.ewlShowMasteryModal is invoked right after or inside endGame
    if 'show("result");' in html and 'window.ewlShowMasteryModal({' not in html:
        title_match = re.search(r'<title>([^<]+)</title>', html)
        game_title = title_match.group(1).split('|')[0].strip() if title_match else "Unit Game"
        
        replacement = f'''show("result");
        if (window.ewlShowMasteryModal) {{
          window.ewlShowMasteryModal({{
            score: typeof S !== "undefined" && S.score ? S.score : 1000,
            maxScore: 1000,
            stars: typeof stars !== "undefined" ? stars : 3,
            accuracy: 100,
            title: "{game_title}"
          }});
        }}'''
        html = html.replace('show("result");', replacement)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(html)
        count += 1
        print(f"Injected mastery modal trigger in: {rel_path}")

print(f"\nDone! Injected mastery modal trigger into {count} game files.")
