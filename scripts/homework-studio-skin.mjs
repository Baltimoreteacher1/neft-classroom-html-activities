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
    /* Dots go back to any problem; the one button moves forward. Two Back/Next pairs on a step read as a loop. */
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
    /* Today's mission shows three problems and the rest stay hidden: the stepper counts and steps
       over the ones that are on screen, so the dots always match the goal a family reads. */
    var shown = function () { return items.filter(function (it) { return !it.hidden; }); };
    function paint() {
      var visible = shown();
      if (items[idx] && items[idx].hidden && visible.length) idx = items.indexOf(visible[0]);
      var pos = visible.indexOf(items[idx]);
      items.forEach(function (it, i) {
        it.classList.toggle('is-step-current', i === idx);
        var done = it.classList.contains('correct') || it.classList.contains('reviewed');
        dotEls[i].hidden = it.hidden;
        dotEls[i].textContent = '';
        dotEls[i].innerHTML = '<span class="hw-sr-only"><span class="lang-en">Problem </span><span class="lang-es" lang="es">Problema </span></span>' + (it.getAttribute('data-role') || (visible.indexOf(it) + 1));
        dotEls[i].classList.toggle('is-done', done);
        dotEls[i].classList.toggle('is-current', i === idx);
        dotEls[i].setAttribute('aria-current', i === idx ? 'step' : 'false');
      });
      back.disabled = pos <= 0;
      next.disabled = pos >= visible.length - 1;

      // Keep rail sub-buttons in sync with stepper index
      var checkRail = document.getElementById('hw_sub_check');
      if (checkRail) {
        var subBtns = checkRail.querySelectorAll('.hw-sub-btn:not(.hw-sub-extra-btn)');
        subBtns.forEach(function (b, bIdx) {
          var active = bIdx === idx;
          b.classList.toggle('is-active', active);
          b.hidden = !!(items[bIdx] && items[bIdx].hidden);
          if (active) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
      }
    }
    function show(i) { idx = Math.max(0, Math.min(items.length - 1, i)); paint(); }
    function step(delta) {
      var visible = shown();
      var target = visible[visible.indexOf(items[idx]) + delta];
      if (target) show(items.indexOf(target));
    }
    back.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    var mo = new MutationObserver(paint);
    items.forEach(function (it) { mo.observe(it, { attributes: true, attributeFilter: ['class', 'hidden'] }); });
    window.__hwStepperPaints = (window.__hwStepperPaints || []).concat([paint]);
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
  installStudioTabScroll();
  initHomeworkImageZoom();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootStudioSkin);
} else {
  bootStudioSkin();
}
`;
