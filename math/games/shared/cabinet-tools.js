/* Keep existing save, hint and passport tools reachable without covering play.
 * Universal Next-Gen Arcade Enhancements across ALL 11 arcade worlds:
 * Two-Seat Co-Op Mode, Generative Ambient Chords, Socratic Turn & Talk, Peer Challenges.
 */
(function () {
  'use strict';
  let attempts = 0;

  // Ensure ArcadeFX is loaded
  if (!window.ArcadeFX && !document.querySelector('script[src*="arcade-fx-engine.js"]')) {
    const s = document.createElement('script');
    s.src = '/math/games/shared/arcade-fx-engine.js';
    document.head.appendChild(s);
  }

  function mountUniversalBar() {
    if (document.getElementById('universal-arcade-toolbar') || document.querySelector('.rr-pro-toolbar')) return;
    const canvas = document.querySelector('canvas') || document.querySelector('.cabinet-console');
    if (!canvas) return;

    const bar = document.createElement('div');
    bar.id = 'universal-arcade-toolbar';
    bar.className = 'universal-arcade-toolbar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Next-Gen Arcade Tools');

    bar.innerHTML = `
      <div class="universal-arcade-group">
        <button type="button" class="universal-arcade-btn" id="uni-btn-coop" onclick="window.ewlToggleUniversalCoop()">
          👥 <span>Two-Seat Co-Op</span>
        </button>
        <button type="button" class="universal-arcade-btn" onclick="window.ewlOpenUniversalTalk()">
          🗣️ <span>Turn & Talk</span>
        </button>
      </div>
      <div class="universal-arcade-group">
        <button type="button" class="universal-arcade-btn" id="uni-btn-ambient" onclick="window.ewlToggleUniversalAmbient()">
          🎵 <span>Calm Chords: OFF</span>
        </button>
      </div>
    `;

    const hud = document.createElement('div');
    hud.id = 'universal-coop-hud';
    hud.className = 'universal-coop-hud';
    hud.innerHTML = `
      <div class="universal-pilot-badge universal-pilot-1">
        <span>🚀 Pilot 1 (Inputs / Lead):</span> <span>Keys A / W / Drag</span>
      </div>
      <span style="font-size:0.8rem; color:#93c5fd; font-weight:700;">🤝 Partner Flight: Coordinate before Lock In!</span>
      <div class="universal-pilot-badge universal-pilot-2">
        <span>🛠️ Pilot 2 (Strategy / Check):</span> <span>Keys ← / → / Enter</span>
      </div>
    `;

    canvas.parentNode.insertBefore(bar, canvas);
    canvas.parentNode.insertBefore(hud, canvas);
  }

  window.ewlToggleUniversalCoop = function() {
    const hud = document.getElementById('universal-coop-hud');
    const btn = document.getElementById('uni-btn-coop');
    if (!hud || !btn) return;
    const isShowing = hud.classList.toggle('show');
    btn.classList.toggle('active', isShowing);
    if (window.ArcadeFX && window.ArcadeFX.playSFX) window.ArcadeFX.playSFX('click');
  };

  window.ewlToggleUniversalAmbient = function() {
    if (!window.ArcadeFX) return;
    const btn = document.getElementById('uni-btn-ambient');
    if (!window.ArcadeFX.isAmbientActive()) {
      window.ArcadeFX.startAmbient();
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = '🎵 <span>Calm Chords: ON</span>';
      }
    } else {
      window.ArcadeFX.stopAmbient();
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '🎵 <span>Calm Chords: OFF</span>';
      }
    }
  };

  window.ewlOpenUniversalTalk = function() {
    if (window.ArcadeFX && window.ArcadeFX.showMathTalkPrompt) {
      window.ArcadeFX.showMathTalkPrompt({
        titleEn: "Partner Talk: Reasoning with Models",
        titleEs: "Charla con tu Pareja: Razonar con Modelos",
        questionEn: "Turn to your partner: How does your on-screen visual model prove that your answer makes sense?",
        questionEs: "Pregunta a tu compañero: ¿Cómo demuestra tu modelo visual que tu respuesta tiene sentido?",
        stemEn: "Sentence Stem: 'I know my solution is correct because the model shows that...'",
        stemEs: "Estructura: 'Sé que mi solución es correcta porque el modelo muestra que...'"
      });
    }
  };

  function mount() {
    mountUniversalBar();
    const area = document.querySelector('.cabinet-console, #wrap, .container') || document.body;
    if (!area) { if (attempts++ < 12) setTimeout(mount, 100); return; }
    if (area.querySelector(".cabinet-tools")) return;
    const tools = document.createElement('aside');
    tools.className = 'cabinet-tools'; tools.setAttribute('aria-label','Practice tools');
    area.append(tools);
    function relocate() {
      document.querySelectorAll('.ntp-pill, .nt-hl-root, #nsr-root, .mwb-launcher-nav').forEach(node => {
        if (node.parentNode !== tools) tools.append(node);
      });
    }
    relocate();
    const observer = new MutationObserver(relocate);
    observer.observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState !== 'complete') window.addEventListener('load',mount,{once:true}); else mount();
})();
