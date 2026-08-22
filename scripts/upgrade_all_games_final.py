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

font_tags = '''    <link rel="stylesheet" href="/assets/fonts/inter-outfit-0cbcac.css" />
    <link rel="stylesheet" href="/shared/arcade-enhanced-styles.css" />'''

script_block = '''<script>
(function() {
  window.ewlShowMasteryModal = function(opts) {
    opts = opts || {};
    var existing = document.getElementById('ewl-mastery-modal');
    if (existing) existing.remove();
    
    var score = opts.score || 1000;
    var stars = opts.stars || 3;
    var accuracy = opts.accuracy || 100;
    var title = opts.title || 'Mastery Achieved!';
    var starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    
    var overlay = document.createElement('div');
    overlay.id = 'ewl-mastery-modal';
    overlay.className = 'ewl-mastery-overlay';
    overlay.innerHTML = `
      <div class="ewl-mastery-card">
        <div class="ewl-mastery-stars">\${starStr}</div>
        <div class="ewl-mastery-title">\${title}</div>
        <div class="ewl-mastery-subtitle">Publisher Quality Achievement Unlocked</div>
        <div class="ewl-mastery-stats">
          <div class="ewl-stat-box">
            <div class="ewl-stat-num">\${score}</div>
            <div class="ewl-stat-lbl">Final Score</div>
          </div>
          <div class="ewl-stat-box">
            <div class="ewl-stat-num">\${accuracy}%</div>
            <div class="ewl-stat-lbl">Accuracy</div>
          </div>
        </div>
        <div class="ewl-mastery-actions">
          <button class="ewl-mastery-btn ewl-btn-primary" onclick="location.reload()">Play Again</button>
          <a class="ewl-mastery-btn ewl-btn-secondary" href="/math/games/">Arcade Hub</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (window.SFX && SFX.win) try { SFX.win(); } catch(e){}
  };
})();
</script>'''

for rel_path in all_game_paths:
    full_path = os.path.join(repo_dir, rel_path)
    if not os.path.exists(full_path): continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Inject the font bundle if missing. The test is the LINK THIS
    #    SCRIPT WRITES, not the CDN host it used to write: once a page is
    #    self-hosted, 'fonts.googleapis.com' is absent and a host test
    #    re-injects a second stylesheet on every run.
    if '/assets/fonts/' not in html:
        html = html.replace('</head>', f'{font_tags}\n</head>')

    # 2. Inject Stylesheet if missing
    if 'arcade-enhanced-styles.css' not in html:
        html = html.replace('</head>', f'    <link rel="stylesheet" href="/shared/arcade-enhanced-styles.css" />\n</head>')

    # 3. Inject Mastery Modal script if missing
    if 'window.ewlShowMasteryModal' not in html:
        html = html.replace('</body>', f'{script_block}\n</body>')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Upgraded game file: {rel_path}")

print("Done upgrading all game files!")
