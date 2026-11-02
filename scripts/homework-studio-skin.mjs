/**
 * Studio skin for the family homework pages.
 *
 * Presentation only: palette, header, tab bar, cards, answer rows and the
 * one-question-at-a-time stepper are modelled on the Percent Practice Studio
 * (/math/unit-4/percent-practice-studio/). Every id, handler, data attribute and
 * saved-state key the page already uses is untouched, so Save/Resume, answer
 * checking, scoring and printing keep working.
 *
 * Interpolated at the END of the generator's <style> and shared <script>, so it
 * cascades last and ships in the hashed shared assets like the rest.
 */

import { readFileSync } from "node:fs";

// Paper, ink and the per-unit hue: the one source every family surface shares.
export const STUDIO_SKIN_JS = `
/* Helper: smooth scroll to element accounting for sticky rail and display:contents */
function scrollStudioTo(el) {
  if (!el) return;
  if (typeof revealLearnCardFor === 'function') revealLearnCardFor(el);
  var node = el;
  while (node && window.getComputedStyle(node).display === 'contents') {
    node = node.firstElementChild;
  }
  if (!node) node = el;
  var det = node.closest('details');
  if (det && !det.open) det.open = true;
  var rect = node.getBoundingClientRect();
  var targetY = window.pageYOffset + rect.top - 24;
  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
  node.classList.remove('hw-nav-target');
  void node.offsetWidth;
  node.classList.add('hw-nav-target');
  setTimeout(function () { node.classList.remove('hw-nav-target'); }, 1400);
}

/* Studio stepper: show ONE problem at a time per .problems-container, with
   numbered dots and Back/Next. Purely a view over the existing problem
   sections — answering, checking and saving are handled by the page as before. */
function initStudioStepper() {
  var containers = document.querySelectorAll('.problems-container');
  containers.forEach(function (box) {
    if (box.dataset.stepped) return;
    var items = Array.prototype.slice.call(box.querySelectorAll(':scope > .problem-section'));
    if (items.length < 2) return;
    box.dataset.stepped = '1';
    box.classList.add('hw-stepped');
    var idx = 0;
    var bar = document.createElement('div');
    bar.className = 'hw-stepper-bar';
    var dots = document.createElement('div');
    dots.className = 'hw-stepper-dots';
    dots.setAttribute('role', 'group');
    var nav = document.createElement('div');
    nav.className = 'hw-stepper-nav';
    var back = document.createElement('button');
    back.type = 'button';
    back.innerHTML = '← <span class="lang-en">Back</span><span class="lang-es" lang="es">Atrás</span>';
    var next = document.createElement('button');
    next.type = 'button';
    next.innerHTML = '<span class="lang-en">Next</span><span class="lang-es" lang="es">Siguiente</span> →';
    nav.appendChild(back);
    nav.appendChild(next);
    var dotEls = items.map(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'hw-stepper-dot';
      d.innerHTML = '<span class="hw-sr-only"><span class="lang-en">Problem </span><span class="lang-es" lang="es">Problema </span></span>' + (i + 1);
      d.addEventListener('click', function () { show(i); });
      dots.appendChild(d);
      return d;
    });
    bar.appendChild(dots);
    bar.appendChild(nav);
    box.parentNode.insertBefore(bar, box);
    function paint() {
      items.forEach(function (it, i) {
        it.classList.toggle('is-step-current', i === idx);
        var done = it.classList.contains('correct') || it.classList.contains('reviewed');
        dotEls[i].classList.toggle('is-done', done);
        dotEls[i].classList.toggle('is-current', i === idx);
        dotEls[i].setAttribute('aria-current', i === idx ? 'step' : 'false');
      });
      back.disabled = idx === 0;
      next.disabled = idx === items.length - 1;

      // Keep rail sub-buttons in sync with stepper index
      var checkRail = document.getElementById('hw_sub_check');
      if (checkRail) {
        var subBtns = checkRail.querySelectorAll('.hw-sub-btn:not(.hw-sub-extra-btn)');
        subBtns.forEach(function (b, bIdx) {
          var active = bIdx === idx;
          b.classList.toggle('is-active', active);
          if (active) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
      }
    }
    function show(i) { idx = Math.max(0, Math.min(items.length - 1, i)); paint(); }
    back.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    var mo = new MutationObserver(paint);
    items.forEach(function (it) { mo.observe(it, { attributes: true, attributeFilter: ['class'] }); });
    show(0);
  });
}

/* A vocabulary term is a <button>, an atomic inline box, so the browser may
   break the line between it and the punctuation after it ("per hundred" then
   "; scale the..." starting the next line). Keep the first punctuation
   character with its term. */
function glueTermPunctuation() {
  document.querySelectorAll('.obj-term').forEach(function (btn) {
    var next = btn.nextSibling;
    if (!next || next.nodeType !== 3 || !/^[;:,.!?)]/.test(next.nodeValue)) return;
    if (btn.parentNode.classList && btn.parentNode.classList.contains('obj-term-glue')) return;
    var tail = next.splitText(1);
    var glue = document.createElement('span');
    glue.className = 'obj-term-glue';
    glue.style.whiteSpace = 'nowrap';
    btn.parentNode.insertBefore(glue, btn);
    glue.appendChild(btn);
    glue.appendChild(next);
    void tail;
  });
}

var STUDIO_SUB_CONFIGS = {
  learn: [
    { id: 'case', icon: '🕵️', en: 'Case File', es: 'Expediente', sel: '#hw_case' },
    { id: 'talk', icon: '💬', en: '60-Sec Talk', es: 'Charla 60s', sel: '#hw_dinner_talk, .hw-dinner-talk, .dinner-talk-card' },
    { id: 'mystery', icon: '🔍', en: 'Mystery', es: 'Misterio', sel: '#hw_mystery, .hw-mystery' },
    { id: 'idea', icon: '💡', en: 'Big Idea', es: 'Idea principal', sel: '#hw_learn_idea .family-big-idea-piece, #hw_learn_idea > .section-title, #hw_learn_idea, .big-idea, .key-idea-banner' },
    { id: 'try', icon: '👆', en: 'Interactive Model', es: 'Modelo interactivo', sel: '#hw_learn_try, .family-visual-lab, .interactive-visual-host' },
    { id: 'quick', icon: '❓', en: 'Try Question', es: 'Pregunta rápida', sel: '#hw_learn_quick, .learn-quick-check' },
    { id: 'huddle', icon: '🎭', en: 'Warm-up Huddle', es: 'Calentamiento', sel: '#hw_huddle, .hw-huddle' }
  ],
  words: [
    { id: 'cards', icon: '📚', en: 'Flashcards', es: 'Tarjetas', sel: '.vocab-container, .vocab-card-grid' },
    { id: 'quiz', icon: '❓', en: 'Word Quiz', es: 'Prueba de palabras', sel: '#vocab_quiz, .vocab-quiz' },
    { id: 'match', icon: '🎯', en: 'Match Game', es: 'Juego de unir', sel: '#vocab_match_shell, .vocab-game-shell' }
  ],
  play: [
    { id: 'activity', icon: '🏡', en: 'Family Activity', es: 'Actividad familiar', sel: '.fam-act-corner, .fam-act-card' },
    { id: 'game', icon: '🎮', en: 'Math Games', es: 'Juegos familiares', sel: '#fam_game_break, .fam-game-card, .domino-game-wrap' }
  ],
  done: [
    { id: 'teach', icon: '🗣️', en: 'Teach It Back', es: 'Enséñalo tú', sel: '.hw-teach' },
    { id: 'confidence', icon: '🌱', en: 'Confidence Check', es: 'Confianza', sel: '#hw_conf_after, .hw-confidence' },
    { id: 'summary', icon: '📊', en: "Tonight Summary", es: 'Resumen', sel: '#hw_done_summary, .done-summary' },
    { id: 'signoff', icon: '✍️', en: 'Family Sign-off', es: 'Firma familiar', sel: '#parent_signoff_section, .parent-signoff-card, .hw-share, .homework-message-action' }
  ]
};

function initStudioSubRail() {
  var tabBtns = document.querySelectorAll('.homework-tab-btn');
  if (!tabBtns.length) return;

  tabBtns.forEach(function (btn) {
    var tabId = btn.dataset.tab;
    var rail = btn.nextElementSibling;
    if (!rail || !rail.classList.contains('hw-sub-rail')) {
      rail = document.createElement('div');
      rail.className = 'hw-sub-rail';
      rail.id = 'hw_sub_' + tabId;
      btn.parentNode.insertBefore(rail, btn.nextSibling);
    }

    if (tabId === 'check') {
      var coreBox = document.querySelector('#hw_panel_check .problems-container');
      var dots = coreBox && coreBox.previousElementSibling && coreBox.previousElementSibling.classList.contains('hw-stepper-bar')
        ? coreBox.previousElementSibling.querySelectorAll('.hw-stepper-dot')
        : [];
      var coreItems = coreBox ? coreBox.querySelectorAll(':scope > .problem-section') : [];
      var items = [];

      if (dots.length) {
        dots.forEach(function (dot, i) {
          items.push({
            icon: '✏️',
            en: 'Problem ' + (i + 1),
            es: 'Problema ' + (i + 1),
            action: function () {
              if (document.body.dataset.activeTab !== 'check' && typeof switchHomeworkTab === 'function') {
                switchHomeworkTab('check', { preventScroll: true });
              }
              dot.click();
              var stepperBar = coreBox.previousElementSibling && coreBox.previousElementSibling.classList.contains('hw-stepper-bar')
                ? coreBox.previousElementSibling
                : null;
              scrollStudioTo(stepperBar || coreItems[i] || coreBox);
            }
          });
        });
      } else if (coreItems.length) {
        coreItems.forEach(function (p, i) {
          items.push({
            icon: '✏️',
            en: 'Problem ' + (i + 1),
            es: 'Problema ' + (i + 1),
            action: function () {
              if (document.body.dataset.activeTab !== 'check' && typeof switchHomeworkTab === 'function') {
                switchHomeworkTab('check', { preventScroll: true });
              }
              scrollStudioTo(p);
            }
          });
        });
      }

      rail.innerHTML = '';
      items.forEach(function (item, idx) {
        var sBtn = document.createElement('button');
        sBtn.type = 'button';
        sBtn.className = 'hw-sub-btn' + (idx === 0 ? ' is-active' : '');
        sBtn.dataset.problemIdx = String(idx);
        sBtn.innerHTML = '<span class="sub-icon" aria-hidden="true">' + item.icon + '</span><span class="sub-text"><span class="lang-en">' + item.en + '</span><span class="lang-es" lang="es">' + item.es + '</span></span>';
        sBtn.addEventListener('click', function () {
          rail.querySelectorAll('.hw-sub-btn').forEach(function (b) { b.classList.remove('is-active'); });
          sBtn.classList.add('is-active');
          item.action();
        });
        rail.appendChild(sBtn);
      });

      var extraContainers = document.querySelectorAll('#hw_panel_check .problems-container');
      if (extraContainers.length > 1) {
        var extraBtn = document.createElement('button');
        extraBtn.type = 'button';
        extraBtn.className = 'hw-sub-btn hw-sub-extra-btn';
        extraBtn.innerHTML = '<span class="sub-icon" aria-hidden="true">⭐</span><span class="sub-text"><span class="lang-en">More Practice</span><span class="lang-es" lang="es">Más práctica</span></span>';
        extraBtn.addEventListener('click', function () {
          if (document.body.dataset.activeTab !== 'check' && typeof switchHomeworkTab === 'function') {
            switchHomeworkTab('check', { preventScroll: true });
          }
          rail.querySelectorAll('.hw-sub-btn').forEach(function (b) { b.classList.remove('is-active'); });
          extraBtn.classList.add('is-active');
          var moreBox = extraContainers[1];
          var moreDet = moreBox ? moreBox.closest('details') : null;
          if (moreDet) moreDet.open = true;
          var moreStepper = moreBox && moreBox.previousElementSibling && moreBox.previousElementSibling.classList.contains('hw-stepper-bar')
            ? moreBox.previousElementSibling
            : moreBox;
          scrollStudioTo(moreStepper || moreBox);
        });
        rail.appendChild(extraBtn);
      }
    } else if (STUDIO_SUB_CONFIGS[tabId]) {
      var cfg = STUDIO_SUB_CONFIGS[tabId];
      var panel = document.getElementById('hw_panel_' + tabId);
      var validItems = [];
      if (panel) {
        cfg.forEach(function (c) {
          var el = panel.querySelector(c.sel);
          if (el) validItems.push({ c: c, el: el });
        });
      }
      rail.innerHTML = '';
      validItems.forEach(function (v, idx) {
        var sBtn = document.createElement('button');
        sBtn.type = 'button';
        sBtn.className = 'hw-sub-btn' + (idx === 0 ? ' is-active' : '');
        sBtn.dataset.subId = v.c.id;
        sBtn.innerHTML = '<span class="sub-icon" aria-hidden="true">' + v.c.icon + '</span><span class="sub-text"><span class="lang-en">' + v.c.en + '</span><span class="lang-es" lang="es">' + v.c.es + '</span></span>';
        sBtn.addEventListener('click', function () {
          if (document.body.dataset.activeTab !== tabId && typeof switchHomeworkTab === 'function') {
            switchHomeworkTab(tabId, { preventScroll: true });
          }
          rail.querySelectorAll('.hw-sub-btn').forEach(function (b) { b.classList.remove('is-active'); });
          sBtn.classList.add('is-active');
          scrollStudioTo(v.el);
        });
        rail.appendChild(sBtn);
      });
    }
  });
}

/* Install tab scrolling: clicking any tab button smoothly scrolls to the top of that panel */
function installStudioTabScroll() {
  if (window.__studioTabScrollInstalled) return;
  window.__studioTabScrollInstalled = true;

  document.querySelectorAll('.homework-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = btn.dataset.tab;
      window.requestAnimationFrame(function () {
        var panel = document.getElementById('hw_panel_' + tabId);
        if (panel) scrollStudioTo(panel);
      });
    });
  });

  // Also enhance any in-page buttons that switch stops (e.g. .tab-flow-nav "Continue")
  var origSwitchHomeworkTab = window.switchHomeworkTab;
  if (typeof origSwitchHomeworkTab === 'function') {
    window.switchHomeworkTab = function (tabId, opts) {
      origSwitchHomeworkTab(tabId);
      if (window.hwTabsBooted && (!opts || !opts.preventScroll)) {
        window.requestAnimationFrame(function () {
          var panel = document.getElementById('hw_panel_' + tabId);
          if (panel) scrollStudioTo(panel);
        });
      }
    };
  }
}

/* Install scroll-spy: update active sub-button as student scrolls through sections */
function installStudioScrollSpy() {
  if (window.__studioScrollSpyInstalled) return;
  window.__studioScrollSpyInstalled = true;

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateActiveSubButton();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  function updateActiveSubButton() {
    var tabId = document.body.dataset.activeTab;
    if (!tabId || tabId === 'check') return;
    var rail = document.getElementById('hw_sub_' + tabId);
    if (!rail) return;
    var subBtns = Array.from(rail.querySelectorAll('.hw-sub-btn'));
    if (!subBtns.length) return;

    var panel = document.getElementById('hw_panel_' + tabId);
    if (!panel || panel.hidden) return;

    var targets = [];
    subBtns.forEach(function (btn) {
      var subId = btn.dataset.subId;
      var cfg = STUDIO_SUB_CONFIGS[tabId] && STUDIO_SUB_CONFIGS[tabId].find(function (c) { return c.id === subId; });
      if (cfg) {
        var el = panel.querySelector(cfg.sel);
        if (el) {
          while (el && window.getComputedStyle(el).display === 'contents') {
            el = el.firstElementChild;
          }
          if (el) targets.push({ btn: btn, el: el });
        }
      }
    });

    if (!targets.length) return;

    var currentBtn = targets[0].btn;
    for (var i = 0; i < targets.length; i++) {
      var top = targets[i].el.getBoundingClientRect().top;
      if (top <= 140) {
        currentBtn = targets[i].btn;
      } else {
        break;
      }
    }

    subBtns.forEach(function (b) {
      var active = b === currentBtn;
      b.classList.toggle('is-active', active);
      if (active) b.setAttribute('aria-current', 'location');
      else b.removeAttribute('aria-current');
    });
  }
}

function initHomeworkImageZoom() {
  if (window.__hwImageZoomInitialized) return;
  window.__hwImageZoomInitialized = true;

  var dlg = document.getElementById('hw_image_lightbox');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'hw_image_lightbox';
    dlg.className = 'hw-lightbox-dialog';
    dlg.dataset.ariaEn = 'Enlarged view';
    dlg.dataset.ariaEs = 'Vista ampliada';
    dlg.setAttribute('aria-label', document.documentElement.lang === 'es' ? dlg.dataset.ariaEs : dlg.dataset.ariaEn);
    dlg.innerHTML = '<div class="hw-lightbox-inner">' +
      '<button type="button" class="hw-lightbox-close" data-aria-en="Close" data-aria-es="Cerrar" aria-label="' + (document.documentElement.lang === 'es' ? 'Cerrar' : 'Close') + '"><span aria-hidden="true">✕</span> <span class="lang-en">Close</span><span class="lang-es" lang="es">Cerrar</span></button>' +
      '<div class="hw-lightbox-stage"></div>' +
      '</div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('.hw-lightbox-close') || e.target.closest('.hw-lightbox-stage')) {
        closeLightbox();
      }
    });

    dlg.addEventListener('close', function () {
      document.body.classList.remove('hw-lightbox-open');
      var stage = dlg.querySelector('.hw-lightbox-stage');
      if (stage) stage.replaceChildren();
      if (window.__hwLightboxOpener && window.__hwLightboxOpener.focus) {
        try { window.__hwLightboxOpener.focus(); } catch (_) {}
      }
      window.__hwLightboxOpener = null;
    });

    document.addEventListener('keydown', function (e) {
      if (dlg.open && e.key === 'Escape') {
        closeLightbox();
      }
    });
  }

  function closeLightbox() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') {
      if (dlg.open) dlg.close();
    } else {
      dlg.removeAttribute('open');
      dlg.hidden = true;
      document.body.classList.remove('hw-lightbox-open');
      var stage = dlg.querySelector('.hw-lightbox-stage');
      if (stage) stage.replaceChildren();
      if (window.__hwLightboxOpener && window.__hwLightboxOpener.focus) {
        try { window.__hwLightboxOpener.focus(); } catch (_) {}
      }
      window.__hwLightboxOpener = null;
    }
  }

  function openLightbox(node, opener) {
    if (!node || !dlg) return;
    window.__hwLightboxOpener = opener || node;
    var stage = dlg.querySelector('.hw-lightbox-stage');
    stage.replaceChildren();

    if (node.tagName === 'IMG') {
      var img = document.createElement('img');
      img.src = node.currentSrc || node.src;
      img.alt = node.alt || '';
      img.className = 'hw-lightbox-img';
      stage.appendChild(img);
    } else if (node.tagName === 'svg' || node.namespaceURI === 'http://www.w3.org/2000/svg') {
      var copy = node.cloneNode(true);
      copy.removeAttribute('id');
      copy.removeAttribute('width');
      copy.removeAttribute('height');
      copy.classList.remove('is-zoomable');
      copy.classList.add('hw-lightbox-svg');
      stage.appendChild(copy);
    }
    document.body.classList.add('hw-lightbox-open');
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.hidden = false;
      dlg.setAttribute('open', '');
    }
    setTimeout(function () {
      var closeBtn = dlg.querySelector('.hw-lightbox-close');
      if (closeBtn && closeBtn.focus) {
        try { closeBtn.focus(); } catch (_) {}
      }
    }, 0);
  }

  window.openHomeworkLightbox = openLightbox;

  function wireElement(el) {
    if (!el || el.dataset.zoomable === '1') return;
    if (el.closest('.hw-lightbox-dialog, [data-no-zoom], .annotator, button, a, label, input, textarea')) return;

    if (el.tagName === 'IMG') {
      var w = el.naturalWidth || el.width || parseInt(el.getAttribute('width') || '0', 10);
      var h = el.naturalHeight || el.height || parseInt(el.getAttribute('height') || '0', 10);
      if (w > 0 && w < 48 && h > 0 && h < 48) return;
    }

    el.dataset.zoomable = '1';
    el.classList.add('is-zoomable');
    // A decorative drawing (aria-hidden) still zooms on a tap but is never a focusable button.
    var decorative = !!el.closest('[aria-hidden="true"]');
    if (!decorative && !el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!decorative && !el.getAttribute('role')) el.setAttribute('role', 'button');
    if (!decorative && !el.getAttribute('title')) {
      el.dataset.titleEn = 'Click to enlarge';
      el.dataset.titleEs = 'Clic para ampliar';
      el.setAttribute('title', document.documentElement.lang === 'es' ? el.dataset.titleEs : el.dataset.titleEn);
    }

    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(el, el);
    });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(el, el);
      }
    });
  }

  function scanAndWire(root) {
    var scope = root || document;
    var imgs = scope.querySelectorAll('.vocab-thumb, .problem-visual-img, .problem-visual-wrap img, .vq-img, .obj-popup-img, #display_family_photo, #work_photo_preview, #pb_captured_img, .concept-visual-wrap img');
    imgs.forEach(wireElement);

    var svgs = scope.querySelectorAll('.concept-visual-wrap svg, svg.concept-svg, svg.hw-model-svg, svg.hw-mini-model-svg, .hw-colearn-svg-stage svg, .concept-fallback-visual svg, svg.cf-tag, svg.cf-line');
    svgs.forEach(wireElement);

    var zoomBtns = scope.querySelectorAll('.concept-zoom-btn');
    zoomBtns.forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = btn.closest('.concept-visual-wrap');
        var target = wrap && (wrap.querySelector('svg') || wrap.querySelector('img'));
        if (target) openLightbox(target, btn);
      });
    });
  }

  scanAndWire(document);

  var Observer = (typeof window !== 'undefined' && window.MutationObserver) || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
  if (Observer) {
    var mo = new Observer(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            scanAndWire(node);
          }
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
}

function bootStudioSkin() {
  initStudioStepper();
  glueTermPunctuation();
  initStudioSubRail();
  installStudioTabScroll();
  installStudioScrollSpy();
  initHomeworkImageZoom();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootStudioSkin);
} else {
  bootStudioSkin();
}
`;
