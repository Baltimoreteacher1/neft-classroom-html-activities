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

font_tags = '''  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">'''

publisher_header = '''      <!-- EWL Universal Arcade Enhancements Header -->
      <div class="ewl-arcade-header-bar">
        <div class="ewl-arcade-title-group">
          <a href="/math/games/" class="ewl-back-hub-btn">⬅️ Arcade Hub</a>
          <span class="ewl-arcade-badge ewl-badge-l1" id="ewl-level-badge">⭐ Level 1: Guided Support</span>
          <span style="font-size: 13px; font-weight: 600; opacity: 0.85;">| EduWonderLab Interactive Arcade</span>
        </div>
        <div class="ewl-arcade-controls">
          <button type="button" class="ewl-btn-toggle active" id="ewl-btn-l1" onclick="if(window.ewlSetLevel) window.ewlSetLevel(1)">L1 Support</button>
          <button type="button" class="ewl-btn-toggle" id="ewl-btn-l2" onclick="if(window.ewlSetLevel) window.ewlSetLevel(2)">L2 Challenge</button>
          <button type="button" class="ewl-sound-toggle-btn" id="ewl-btn-sound" onclick="if(window.GameFX && window.GameFX.AudioSynth){ window.GameFX.AudioSynth.muted = !window.GameFX.AudioSynth.muted; this.innerText = window.GameFX.AudioSynth.muted ? '🔇 Muted' : '🔊 Sound On'; }">🔊 Sound On</button>
          <button type="button" class="ewl-btn-toggle" id="ewl-btn-lang" onclick="if(window.ewlToggleLang) window.ewlToggleLang()">🌐 EN / ES</button>
        </div>
      </div>'''

mastery_script = '''  <script>
    (function() {
      window.ewlShowMasteryModal = function(opts) {
        opts = opts || {};
        const score = opts.score || 0;
        const maxScore = opts.maxScore || 1000;
        const stars = opts.stars || (score >= maxScore * 0.8 ? 3 : score >= maxScore * 0.5 ? 2 : 1);
        const accuracy = opts.accuracy != null ? opts.accuracy : Math.min(100, Math.round((score / Math.max(1, maxScore)) * 100));
        const gameTitle = opts.title || "Unit Game Complete!";
        const nextUrl = opts.nextUrl || "/math/games/";

        const starStr = "⭐".repeat(stars) + "☆".repeat(3 - stars);
        
        const modalHtml = `
          <div class="ewl-mastery-overlay" id="ewl-mastery-modal">
            <div class="ewl-mastery-card">
              <div class="ewl-mastery-stars">${starStr}</div>
              <h2 class="ewl-mastery-title">${gameTitle}</h2>
              <p class="ewl-mastery-subtitle">Grade 6 Math Review Mastery Achieved!</p>
              <div class="ewl-mastery-stats">
                <div class="ewl-stat-box">
                  <div class="ewl-stat-num">${score}</div>
                  <div class="ewl-stat-lbl">Final Score</div>
                </div>
                <div class="ewl-stat-box">
                  <div class="ewl-stat-num">${accuracy}%</div>
                  <div class="ewl-stat-lbl">Accuracy</div>
                </div>
              </div>
              <div class="ewl-mastery-actions">
                <button class="ewl-mastery-btn ewl-btn-secondary" onclick="location.reload()">🔄 Play Again</button>
                <button class="ewl-mastery-btn ewl-btn-primary" onclick="location.href='${nextUrl}'">🎮 More Games</button>
              </div>
            </div>
          </div>
        `;
        const existing = document.getElementById("ewl-mastery-modal");
        if (existing) existing.remove();
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        
        if (window.GameFX && window.GameFX.AudioSynth) {
          try { window.GameFX.AudioSynth.playSuccess(); } catch(e){}
        }
        if (window.GameFX && window.GameFX.burst) {
          try { window.GameFX.burst(window.innerWidth / 2, window.innerHeight / 3); } catch(e){}
        }
      };
    })();
  </script>'''

updated_count = 0

for rel_path in all_game_paths:
    full_path = os.path.join(repo_dir, rel_path)
    if not os.path.exists(full_path):
        print(f"Skipping missing file: {rel_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Inject Google Fonts in <head> if missing
    if 'fonts.googleapis.com' not in html:
        html = html.replace('</head>', f'{font_tags}\n</head>')

    # 2. Replace or inject publisher header bar
    header_pattern = r'<!-- EWL Universal Arcade Enhancements Header -->[\s\S]*?</div>\s*</div>'
    if re.search(header_pattern, html):
        html = re.sub(header_pattern, publisher_header, html)
    elif '<div class="ewl-arcade-header-bar"' in html:
        # replace old ewl-arcade-header-bar div
        old_bar = re.search(r'<div class="ewl-arcade-header-bar"[\s\S]*?</div>\s*</div>', html)
        if old_bar:
            html = html.replace(old_bar.group(0), publisher_header)
    else:
        # inject header bar right after <body> or at top of #wrap
        if '<div id="wrap">' in html:
            html = html.replace('<div id="wrap">', f'<div id="wrap">\n{publisher_header}')
        elif '<main' in html:
            html = html.replace('<main', f'{publisher_header}\n<main')
        elif '<body>' in html:
            html = html.replace('<body>', f'<body>\n{publisher_header}')

    # 3. Inject mastery script before </body> if missing
    if 'window.ewlShowMasteryModal' not in html:
        html = html.replace('</body>', f'{mastery_script}\n</body>')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    updated_count += 1
    print(f"Successfully upgraded: {rel_path}")

print(f"\nDone! Upgraded {updated_count} game files to publisher standards.")
