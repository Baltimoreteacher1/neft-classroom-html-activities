
window.__hwAlgEq = function (a, b) {
  function ev(raw, vars) {
    var s = String(raw || '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    if (!s || s.length > 80 || /[^0-9a-zA-Z.+\-*/^()]/.test(s)) return null;
    var i = 0;
    function pE() { var l = pT(); while (l != null && (s[i] === '+' || s[i] === '-')) { var op = s[i++], r = pT(); l = r == null ? null : op === '+' ? l + r : l - r; } return l; }
    function pT() { var l = pP(); while (l != null) { var c = s[i]; if (c === '*' || c === '/') { i++; var r = pP(); l = r == null || (c === '/' && Math.abs(r) < 1e-12) ? null : c === '*' ? l * r : l / r; } else if (c && /[a-zA-Z(]/.test(c)) { var r2 = pP(); l = r2 == null ? null : l * r2; } else break; } return l; }
    function pP() { var x = pU(); if (x == null || s[i] !== '^') return x; i++; var e = pP(); return e == null ? null : Math.pow(x, e); }
    function pU() { if (s[i] === '-') { i++; var v = pU(); return v == null ? null : -v; } if (s[i] === '+') { i++; return pU(); } return pA(); }
    function pA() { if (s[i] === '(') { i++; var v = pE(); return v != null && s[i] === ')' ? (i++, v) : null; } var nm = s.slice(i).match(/^(?:\d+\.?\d*|\.\d+)/); if (nm) { i += nm[0].length; return Number(nm[0]); } var vm = s.slice(i).match(/^[a-zA-Z]/); if (vm) { i++; return Object.prototype.hasOwnProperty.call(vars, vm[0].toLowerCase()) ? vars[vm[0].toLowerCase()] : null; } return null; }
    var res = pE(); return i === s.length && isFinite(res) ? res : null;
  }
  var vA = (String(a).match(/[a-zA-Z]/g) || []).map(function (c) { return c.toLowerCase(); });
  var vB = (String(b).match(/[a-zA-Z]/g) || []).map(function (c) { return c.toLowerCase(); });
  if (!vA.length || !vB.length) return false;
  var sA = Array.from(new Set(vA)).sort().join(','), sB = Array.from(new Set(vB)).sort().join(',');
  if (sA !== sB) return false;
  var probes = [2.3, 5.7, 11.1];
  for (var p = 0; p < probes.length; p++) {
    var vars = {}; sA.split(',').forEach(function (v, idx) { vars[v] = probes[p] + idx * 1.7; });
    var va = ev(a, vars), vb = ev(b, vars);
    if (va == null || vb == null || Math.abs(va - vb) >= 1e-6) return false;
  }
  return true;
};
/* ── Family Math Quest (Solo / Learn Together / Student Teaches) ─────── */
window.__hwSetQuestMode = function (mode) {
  var host = document.getElementById('hw_family_quest');
  if (!host) return;
  host.setAttribute('data-fq-mode', mode);
  host.querySelectorAll('[data-fq-btn]').forEach(function (b) {
    var on = b.getAttribute('data-fq-btn') === mode;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  host.querySelectorAll('[data-fq-panel]').forEach(function (p) {
    p.hidden = p.getAttribute('data-fq-panel') !== mode;
  });
};
;(function initFamilyQuest() {
  function boot() {
    var host = document.getElementById('hw_family_quest');
    if (!host || host.dataset.fqBooted) return;
    host.dataset.fqBooted = '1';
    var bi = function (en, es) { return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>'; };
    var pEn = host.getAttribute('data-fq-prompt-en') || '';
    var pEs = host.getAttribute('data-fq-prompt-es') || pEn;
    var lEn = host.getAttribute('data-fq-listen-en') || 'Listen for how your student explains what changes, what stays the same, and why the answer makes sense.';
    var lEs = host.getAttribute('data-fq-listen-es') || 'Escucha cómo explica qué cambia, qué se queda igual y por qué la respuesta tiene sentido.';
    host.innerHTML =
      '<div class="fq-head"><div><p class="fq-kicker">' + bi('Optional Learning Mode', 'Modo de aprendizaje opcional') + '</p>' +
      '<h3 class="fq-title" id="fq_title">' + bi('How are you working right now?', '¿Cómo están trabajando ahora?') + '</h3></div>' +
      '<div class="fq-modes" role="group" aria-labelledby="fq_title">' +
        '<button type="button" class="fq-mode-btn is-active" data-fq-btn="solo" aria-pressed="true" data-act="hwSetQuestMode" data-args="[&quot;solo&quot;]"><span aria-hidden="true">🎧</span> ' + bi('Student Solo', 'Estudiante solo') + '</button>' +
        '<button type="button" class="fq-mode-btn" data-fq-btn="together" aria-pressed="false" data-act="hwSetQuestMode" data-args="[&quot;together&quot;]"><span aria-hidden="true">🤝</span> ' + bi('Learn Together', 'Aprender juntos') + '</button>' +
        '<button type="button" class="fq-mode-btn" data-fq-btn="teaches" aria-pressed="false" data-act="hwSetQuestMode" data-args="[&quot;teaches&quot;]"><span aria-hidden="true">💡</span> ' + bi('Student Teaches', 'Estudiante enseña') + '</button>' +
      '</div></div>' +
      '<div class="fq-panel" data-fq-panel="solo"><p>' + bi('Work at your own pace. Use the interactive model above to test numbers and check your thinking.', 'Trabaja a tu propio ritmo. Usa el modelo interactivo de arriba para probar números y comprobar tu idea.') + '</p></div>' +
      '<div class="fq-panel" data-fq-panel="together" hidden><p class="fq-prompt"><strong>' + bi('Ask your student:', 'Pregúntale a tu estudiante:') + '</strong> ' + bi(pEn, pEs) + '</p>' +
        '<div class="fq-prompts-extra"><span>' + bi('• Ask what changes when the number increases.', '• Pregunta qué cambia cuando el número aumenta.') + '</span><span>' + bi('• Ask whether the answer makes sense in the story.', '• Pregunta si la respuesta tiene sentido en la historia.') + '</span></div></div>' +
      '<div class="fq-panel" data-fq-panel="teaches" hidden><p class="fq-prompt"><strong>' + bi('Student challenge:', 'Reto para el estudiante:') + '</strong> ' + bi('Explain the model in your own words (in English or Spanish). Show one example and explain why it works.', 'Explica el modelo con tus propias palabras (en español o inglés). Muestra un ejemplo y explica por qué funciona.') + '</p>' +
        '<p class="fq-listen"><strong>' + bi('What to listen for (for family):', 'Qué escuchar (para la familia):') + '</strong> ' + bi(lEn, lEs) + '</p></div>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ── Math Mystery Network ────────────────────────────────────────────── */
(function initMathMystery() {
  function boot() {
    var root = document.getElementById('hw_math_mystery_studio');
    if (!root || root.dataset.mmBooted) return;
    root.dataset.mmBooted = '1';
    var dataEl = document.getElementById('hw_mystery_data');
    var data;
    try { data = JSON.parse((dataEl && dataEl.textContent) || root.getAttribute('data-mystery') || '{}'); } catch (e) { return; }

    var saved = (typeof window.hwMissionRead === 'function') ? window.hwMissionRead('mystery', {}) : {};

    // Clue toggle
    root.querySelectorAll('[data-mm-clue]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var body = btn.querySelector('.mm-clue-body');
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (body) body.hidden = open;
      });
    });

    function showResolved(msgEn, msgEs) {
      var res = root.querySelector('[data-mm-resolved]');
      if (!res) return;
      res.hidden = false;
      res.innerHTML = '<span class="lang-en">' + msgEn + '</span><span class="lang-es" lang="es">' + (msgEs || msgEn) + '</span>';
      if (typeof window.hwMissionWrite === 'function') {
        window.hwMissionWrite('mystery', { solved: true, title: data.titleEn || '' });
      }
      if (typeof window.__hwRenderLearningReplay === 'function') window.__hwRenderLearningReplay();
    }

    if (saved && saved.solved) {
      var s2 = root.querySelector('[data-mm-stage="2"]');
      if (s2) s2.hidden = false;
      var msgEn = (data.step2 && data.step2.resolveEn) || 'Mystery solved!';
      var msgEs = (data.step2 && data.step2.resolveEs) || '¡Misterio resuelto!';
      showResolved(msgEn, msgEs);
    }

    // Step 1 options
    root.querySelectorAll('[data-mm-opt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-mm-opt');
        var opt = (data.step1 && data.step1.options || []).filter(function (o) { return o.id === id; })[0];
        if (!opt) return;
        root.querySelectorAll('[data-mm-opt]').forEach(function (b) {
          b.classList.remove('is-right', 'is-wrong');
        });
        var fb = root.querySelector('[data-mm-fb="1"]');
        if (fb) {
          fb.hidden = false;
          fb.className = 'mm-feedback ' + (opt.correct ? 'is-right' : 'is-wrong');
          fb.innerHTML = '<span class="lang-en">' + (opt.fbEn || '') + '</span><span class="lang-es" lang="es">' + (opt.fbEs || opt.fbEn || '') + '</span>';
        }
        if (opt.correct) {
          btn.classList.add('is-right');
          var st2 = root.querySelector('[data-mm-stage="2"]');
          if (st2) {
            st2.hidden = false;
            var inp = st2.querySelector('[data-mm-answer]');
            if (inp) inp.focus();
          } else {
            showResolved(opt.fbEn || 'Mystery solved!', opt.fbEs || '¡Misterio resuelto!');
          }
        } else {
          btn.classList.add('is-wrong');
        }
      });
    });

    // Step 2 numeric check
    var chk = root.querySelector('[data-mm-check]');
    var inp = root.querySelector('[data-mm-answer]');
    if (chk && inp && data.step2) {
      var verify = function () {
        var val = parseFloat(String(inp.value || '').trim());
        var fb2 = root.querySelector('[data-mm-fb="2"]');
        if (!isFinite(val)) {
          if (fb2) {
            fb2.hidden = false;
            fb2.className = 'mm-feedback is-wrong';
            fb2.innerHTML = '<span class="lang-en">Enter a number first.</span><span class="lang-es" lang="es">Escribe un número primero.</span>';
          }
          return;
        }
        if (Math.abs(val - Number(data.step2.answer)) < 1e-6) {
          if (fb2) fb2.hidden = true;
          showResolved(data.step2.resolveEn, data.step2.resolveEs);
        } else {
          if (fb2) {
            fb2.hidden = false;
            fb2.className = 'mm-feedback is-wrong';
            fb2.innerHTML = '<span class="lang-en">Not quite ($' + val + '). ' + (data.step2.hintEn || '') + '</span><span class="lang-es" lang="es">Todavía no ($' + val + '). ' + (data.step2.hintEs || data.step2.hintEn || '') + '</span>';
          }
        }
      };
      chk.addEventListener('click', verify);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ── Explain My Thinking Studio ──────────────────────────────────────── */
(function initExplainStudio() {
  function boot() {
    var root = document.getElementById('hw_explain_studio');
    if (!root || root.dataset.exBooted) return;
    root.dataset.exBooted = '1';

    var baseId = root.getAttribute('data-ex-lesson') || '';
    var is65 = baseId === '6-5';
    var vocab = [];
    try { vocab = JSON.parse(root.getAttribute('data-ex-vocab') || '[]'); } catch (e) {}

    var fBegEn = is65 ? 'I changed t, and I noticed the cost ___.' : 'I changed ___, and I noticed ___.';
    var fBegEs = is65 ? 'Cambié t y noté que el costo ___.' : 'Cambié ___ y noté ___.';
    var fDevEn = is65 ? 'When tickets increase, cost changes by $12 per ticket because ___.' : 'When ___ increases, ___ changes because ___.';
    var fDevEs = is65 ? 'Cuando aumentan los boletos, el costo cambia $12 por boleto porque ___.' : 'Cuando ___ aumenta, ___ cambia porque ___.';
    var fExpEn = is65 ? 'The expression 12t + 50 represents the situation because 12t is ___ and 50 is ___.' : 'The expression or model represents the situation because ___.';
    var fExpEs = is65 ? 'La expresión 12t + 50 representa la situación porque 12t es ___ y 50 es ___.' : 'La expresión o modelo representa la situación porque ___.';
    var tiles = is65 ? ['12', 't', '+', '50', '=', '86 (at t=3)'] : ['Variable', '×', 'Rate', '+', 'Fixed', '=', 'Total'];

    var bi = function (en, es) { return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>'; };
    var wordsHtml = vocab.length
      ? '<div class="ex-wordbank" role="group" aria-label="Word bank"><span class="ex-wb-label">' + bi('Math words:', 'Palabras:') + '</span>' +
        vocab.map(function (v) { return '<button type="button" class="ex-word-chip" data-ex-word="' + v.en + '">' + v.en + (v.es && v.es !== v.en ? ' / ' + v.es : '') + '</button>'; }).join('') +
        '</div>'
      : '';

    root.innerHTML =
      '<div class="ex-head">' +
        '<p class="ex-eyebrow">' + bi('Explain My Thinking Studio', 'Estudio: Explica tu razonamiento') + '</p>' +
        '<h3 class="ex-title" id="ex_title">' + bi('Show how you know it makes sense', 'Muestra cómo sabes que tiene sentido') + '</h3>' +
        '<p class="ex-sub">' + bi('Write, draw, or arrange tiles in English or Spanish. Your thinking matters more than spelling.', 'Escribe, dibuja o ordena fichas en español o inglés. Tu razonamiento importa más que la ortografía.') + '</p>' +
      '</div>' +
      '<div class="ex-mode-tabs" role="tablist" aria-label="Explanation format">' +
        '<button type="button" class="ex-mode-tab is-active" role="tab" aria-selected="true" data-ex-tab="write"><span aria-hidden="true">✍️</span> ' + bi('Write & Frames', 'Escribir con apoyos') + '</button>' +
        '<button type="button" class="ex-mode-tab" role="tab" aria-selected="false" data-ex-tab="draw"><span aria-hidden="true">🎨</span> ' + bi('Draw & Annotate', 'Dibujar y anotar') + '</button>' +
        '<button type="button" class="ex-mode-tab" role="tab" aria-selected="false" data-ex-tab="arrange"><span aria-hidden="true">🧩</span> ' + bi('Arrange Model', 'Ordenar modelo') + '</button>' +
      '</div>' +
      '<div class="ex-pane" data-ex-pane="write">' +
        '<div class="ex-wida-row" role="group" aria-label="Sentence support level">' +
          '<span class="ex-wida-lbl">' + bi('Language support:', 'Apoyo de idioma:') + '</span>' +
          '<button type="button" class="ex-frame-btn" data-ex-frame-en="' + fBegEn + '" data-ex-frame-es="' + fBegEs + '">' + bi('Starter', 'Inicial') + '</button>' +
          '<button type="button" class="ex-frame-btn" data-ex-frame-en="' + fDevEn + '" data-ex-frame-es="' + fDevEs + '">' + bi('Builder', 'En desarrollo') + '</button>' +
          '<button type="button" class="ex-frame-btn" data-ex-frame-en="' + fExpEn + '" data-ex-frame-es="' + fExpEs + '">' + bi('Full', 'Completo') + '</button>' +
        '</div>' +
        wordsHtml +
        '<label class="ex-textarea-lbl" for="ex_text_input">' + bi('Your explanation (saved on this device):', 'Tu explicación (se guarda en este dispositivo):') + '</label>' +
        '<textarea id="ex_text_input" class="ex-textarea" rows="3" maxlength="600" data-ex-text placeholder="' + fDevEn + '"></textarea>' +
        '<div class="ex-actions"><button type="button" class="btn btn-primary" data-ex-check>' + bi('Check my math idea', 'Revisar mi idea matemática') + '</button></div>' +
        '<p class="ex-feedback" data-ex-fb role="status" aria-live="polite" hidden></p>' +
      '</div>' +
      '<div class="ex-pane" data-ex-pane="draw" hidden>' +
        '<div class="ex-draw-bar">' +
          '<button type="button" class="ex-tool-btn is-active" data-ex-tool="pen">' + bi('Pen', 'Lápiz') + '</button>' +
          '<button type="button" class="ex-tool-btn" data-ex-tool="eraser">' + bi('Eraser', 'Borrador') + '</button>' +
          '<button type="button" class="ex-tool-btn" data-ex-stamp="t">t</button>' +
          '<button type="button" class="ex-tool-btn" data-ex-stamp="+ 50">+ 50</button>' +
          '<button type="button" class="ex-tool-btn" data-ex-undo>' + bi('Undo', 'Deshacer') + '</button>' +
          '<button type="button" class="ex-tool-btn" data-ex-clear>' + bi('Clear', 'Borrar') + '</button>' +
        '</div>' +
        '<canvas class="ex-canvas" id="ex_draw_canvas" width="560" height="220" aria-label="Interactive math drawing board"></canvas>' +
        '<p class="ex-kb-alt">' + bi('Prefer typing? Switch to Write & Frames or Arrange Model anytime.', '¿Prefieres escribir? Cambia a Escribir u Ordenar modelo cuando quieras.') + '</p>' +
      '</div>' +
      '<div class="ex-pane" data-ex-pane="arrange" hidden>' +
        '<p class="ex-arr-hint">' + bi('Click tiles in order to build your mathematical explanation:', 'Toca las fichas en orden para construir tu explicación:') + '</p>' +
        '<div class="ex-tile-bank">' + tiles.map(function (t) { return '<button type="button" class="ex-tile" data-ex-tile="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
        '<div class="ex-tile-tray" data-ex-tray aria-live="polite"><span class="ex-tray-empty">' + bi('Your arranged model appears here…', 'Tu modelo ordenado aparece aquí…') + '</span></div>' +
        '<div class="ex-actions"><button type="button" class="ex-tool-btn" data-ex-tray-clear>' + bi('Reset tiles', 'Reiniciar fichas') + '</button></div>' +
      '</div>';

    // Mode tabs
    root.querySelectorAll('[data-ex-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-ex-tab');
        root.querySelectorAll('[data-ex-tab]').forEach(function (t) {
          var on = t.getAttribute('data-ex-tab') === target;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        root.querySelectorAll('[data-ex-pane]').forEach(function (p) {
          p.hidden = p.getAttribute('data-ex-pane') !== target;
        });
      });
    });

    var ta = root.querySelector('[data-ex-text]');
    var savedEx = (typeof window.hwMissionRead === 'function') ? window.hwMissionRead('explain', {}) : {};
    if (ta && savedEx && savedEx.text) ta.value = savedEx.text;

    if (ta) {
      ta.addEventListener('input', function () {
        if (typeof window.hwMissionWrite === 'function') {
          window.hwMissionWrite('explain', { text: ta.value, tiles: (savedEx && savedEx.tiles) || [] });
        }
        if (typeof window.__hwRenderLearningReplay === 'function') window.__hwRenderLearningReplay();
      });
    }

    // Sentence frames
    root.querySelectorAll('[data-ex-frame-en]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!ta) return;
        var isEs = document.body.classList.contains('lang-mode-es');
        var frame = isEs ? (btn.getAttribute('data-ex-frame-es') || btn.getAttribute('data-ex-frame-en')) : btn.getAttribute('data-ex-frame-en');
        ta.value = frame;
        ta.dispatchEvent(new Event('input'));
        ta.focus();
      });
    });

    // Word bank chips
    root.querySelectorAll('[data-ex-word]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!ta) return;
        var w = btn.getAttribute('data-ex-word');
        ta.value = (ta.value ? ta.value.replace(/s*$/, ' ') : '') + w + ' ';
        ta.dispatchEvent(new Event('input'));
        ta.focus();
      });
    });

    // Concept-vs-language feedback check
    var checkBtn = root.querySelector('[data-ex-check]');
    var fb = root.querySelector('[data-ex-fb]');
    if (checkBtn && ta && fb) {
      checkBtn.addEventListener('click', function () {
        var txt = String(ta.value || '').trim();
        fb.hidden = false;
        if (txt.length < 12) {
          fb.className = 'ex-feedback is-nudge';
          fb.innerHTML = '<span class="lang-en">Add a little more detail about what changes or stays the same.</span><span class="lang-es" lang="es">Agrega un poco más de detalle sobre qué cambia o qué se queda igual.</span>';
          return;
        }
        var hasMath = /[0-9]|variable|constant|fixed|rate|equal|times|plus|each|cambia|constante|fijo|igual|cada|boleto|ticket/i.test(txt);
        fb.className = 'ex-feedback is-good';
        if (hasMath) {
          fb.innerHTML = '<span class="lang-en">Strong mathematical reasoning! You connected quantities and relationships. Language mechanics never lower your math score.</span><span class="lang-es" lang="es">¡Buen razonamiento matemático! Conectaste cantidades y relaciones. La ortografía nunca baja tu matemática.</span>';
        } else {
          fb.innerHTML = '<span class="lang-en">Good start! Try naming a specific number, variable, or operation to make your math proof even clearer.</span><span class="lang-es" lang="es">¡Buen comienzo! Intenta nombrar un número, variable u operación para que tu prueba sea más clara.</span>';
        }
      });
    }

    // Draw & Annotate Canvas
    var canvas = document.getElementById('ex_draw_canvas');
    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var tool = 'pen';
      var drawing = false;
      var history = [];
      var saveHist = function () {
        try { history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (history.length > 15) history.shift(); } catch (e) {}
      };
      var pos = function (e) {
        var r = canvas.getBoundingClientRect();
        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (cx - r.left) * (canvas.width / r.width), y: (cy - r.top) * (canvas.height / r.height) };
      };
      var start = function (e) {
        saveHist();
        drawing = true;
        var p = pos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      };
      var move = function (e) {
        if (!drawing) return;
        e.preventDefault();
        var p = pos(e);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#102a43';
        ctx.lineWidth = tool === 'eraser' ? 16 : 3;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      };
      var end = function () { drawing = false; };
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);

      root.querySelectorAll('[data-ex-tool]').forEach(function (b) {
        b.addEventListener('click', function () {
          tool = b.getAttribute('data-ex-tool');
          root.querySelectorAll('[data-ex-tool]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        });
      });
      root.querySelectorAll('[data-ex-stamp]').forEach(function (b) {
        b.addEventListener('click', function () {
          saveHist();
          ctx.fillStyle = '#1b8a83';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(b.getAttribute('data-ex-stamp'), 30 + (history.length * 42) % 420, 110);
        });
      });
      var undoBtn = root.querySelector('[data-ex-undo]');
      if (undoBtn) undoBtn.addEventListener('click', function () {
        var img = history.pop();
        if (img) ctx.putImageData(img, 0, 0);
      });
      var clearBtn = root.querySelector('[data-ex-clear]');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        saveHist();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    // Arrange Model tiles
    var tray = root.querySelector('[data-ex-tray]');
    var arranged = (savedEx && Array.isArray(savedEx.tiles)) ? savedEx.tiles.slice() : [];
    var renderTray = function () {
      if (!tray) return;
      if (!arranged.length) {
        tray.innerHTML = '<span class="ex-tray-empty"><span class="lang-en">Your arranged model appears here…</span><span class="lang-es" lang="es">Tu modelo ordenado aparece aquí…</span></span>';
      } else {
        tray.innerHTML = arranged.map(function (t) { return '<span class="ex-tray-chip">' + t + '</span>'; }).join('');
      }
    };
    renderTray();
    root.querySelectorAll('[data-ex-tile]').forEach(function (b) {
      b.addEventListener('click', function () {
        arranged.push(b.getAttribute('data-ex-tile'));
        renderTray();
        if (typeof window.hwMissionWrite === 'function') window.hwMissionWrite('explain', { text: ta ? ta.value : '', tiles: arranged });
      });
    });
    var trayClr = root.querySelector('[data-ex-tray-clear]');
    if (trayClr) trayClr.addEventListener('click', function () {
      arranged = [];
      renderTray();
      if (typeof window.hwMissionWrite === 'function') window.hwMissionWrite('explain', { text: ta ? ta.value : '', tiles: [] });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ── Learning Replay (Real Evidence Only) ────────────────────────────── */
window.__hwRenderLearningReplay = function () {
  var host = document.getElementById('hw_learning_replay');
  if (!host) return;
  if (!host.dataset.lrBuilt) {
    host.dataset.lrBuilt = '1';
    var askEn = host.getAttribute('data-lr-ask-en') || '';
    var askEs = host.getAttribute('data-lr-ask-es') || askEn;
    var bi = function (en, es) { return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>'; };
    host.innerHTML =
      '<div class="lr-head"><p class="lr-eyebrow">' + bi('Learning Replay', 'Recorrido de tu aprendizaje') + '</p>' +
      '<h3 class="lr-title" id="lr_title">' + bi('What your work today actually shows', 'Lo que muestra tu trabajo de hoy') + '</h3></div>' +
      '<ol class="lr-timeline" id="hw_lr_timeline" aria-live="polite"><li class="lr-item lr-item--empty">' +
      bi('Your real steps appear here as you explore the model, solve problems, and explain your thinking.', 'Tus pasos reales aparecen aquí conforme exploras el modelo, resuelves problemas y explicas tu idea.') +
      '</li></ol>' +
      '<aside class="lr-family-summary" aria-labelledby="lr_fam_title"><h4 id="lr_fam_title">' + bi('Optional Family Summary', 'Resumen opcional para la familia') + '</h4>' +
      '<p class="lr-ask"><strong>' + bi('Ask your student:', 'Pregúntale a tu estudiante:') + '</strong> ' + bi(askEn, askEs) + '</p></aside>';
  }
  var list = document.getElementById('hw_lr_timeline');
  if (!list || typeof window.hwMissionSnapshot !== 'function') return;
  var snap = window.hwMissionSnapshot();
  var items = [];

  // 1. Confidence before
  try {
    var confKey = (typeof window.hwKey === 'function') ? window.hwKey('conf_before') : null;
    var cb = confKey ? localStorage.getItem(confKey) : null;
    if (cb) {
      var icons = { '1': '🌱', '2': '🌿', '3': '🌳' };
      items.push({
        tagEn: 'At first',
        tagEs: 'Al inicio',
        en: 'You checked in at ' + (icons[cb] || '🌱') + ' before starting.',
        es: 'Marcaste tu confianza inicial (' + (icons[cb] || '🌱') + ').',
      });
    }
  } catch (e) {}

  // 2. Practice & mistakes corrected
  var probs = snap.problems || {};
  var solvedCount = 0;
  var fixedCount = 0;
  var firstWrong = null;
  Object.keys(probs).forEach(function (k) {
    var p = probs[k];
    if (p && p.done) solvedCount++;
    if (p && p.done && p.wrong > 0) {
      fixedCount++;
      if (!firstWrong && p.picks && p.picks.length) firstWrong = p.picks[0];
    }
  });
  if (solvedCount > 0) {
    items.push({
      tagEn: 'You practiced',
      tagEs: 'Practicaste',
      en: 'You solved ' + solvedCount + ' practice problem' + (solvedCount === 1 ? '' : 's') + '.',
      es: 'Resolviste ' + solvedCount + ' problema' + (solvedCount === 1 ? '' : 's') + ' de práctica.',
    });
  }
  if (fixedCount > 0) {
    items.push({
      tagEn: 'You improved',
      tagEs: 'Mejoraste',
      en: 'You caught and corrected ' + fixedCount + ' mistake' + (fixedCount === 1 ? '' : 's') + (firstWrong && firstWrong.en ? ' (' + firstWrong.en + ')' : '') + '.',
      es: 'Detectaste y corregiste ' + fixedCount + ' error' + (fixedCount === 1 ? '' : 'es') + '.',
    });
  }

  // 3. Mystery
  var mys = (typeof window.hwMissionRead === 'function') ? window.hwMissionRead('mystery', {}) : {};
  if (mys && mys.solved) {
    items.push({
      tagEn: 'You applied it',
      tagEs: 'Lo aplicaste',
      en: 'You cracked the Math Mystery: ' + (mys.title || 'completed') + '.',
      es: 'Resolviste el Misterio Matemático.',
    });
  }

  // 4. Explanation
  var ex = (typeof window.hwMissionRead === 'function') ? window.hwMissionRead('explain', {}) : {};
  if (ex && ex.text && ex.text.trim().length >= 8) {
    items.push({
      tagEn: 'You explained',
      tagEs: 'Explicaste',
      en: 'You wrote your own mathematical explanation.',
      es: 'Escribiste tu propia explicación matemática.',
    });
  }

  if (!items.length) return;
  list.innerHTML = items.map(function (it) {
    return '<li class="lr-item"><span class="lr-tag"><span class="lang-en">' + it.tagEn + '</span><span class="lang-es" lang="es">' + it.tagEs + '</span></span><span class="lr-text"><span class="lang-en">' + it.en + '</span><span class="lang-es" lang="es">' + it.es + '</span></span></li>';
  }).join('');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.__hwRenderLearningReplay);
else window.__hwRenderLearningReplay();
