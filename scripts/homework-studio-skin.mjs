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

export const STUDIO_SKIN_CSS = `
/* ============================================================
   STUDIO SKIN — navy / teal / warm paper, serif headings
   ============================================================ */
:root {
  --st-paper: #f7f4ec;
  --st-surface: #ffffff;
  --st-soft: #faf8f3;
  --st-navy: #17324d;
  --st-navy-dark: #0f2337;
  --st-navy-tint: #e8f0f7;
  --st-teal: #0f766e;
  --st-teal-bright: #1fa6a2;
  --st-teal-tint: #e3f6f5;
  --st-teal-line: #94dfdc;
  --st-amber: #b45309;
  --st-amber-tint: #fef3c7;
  --st-green: #047857;
  --st-green-tint: #ecfdf5;
  --st-red: #b91c1c;
  --st-red-tint: #fef2f2;
  --st-ink: #1e293b;
  --st-ink-muted: #475569;
  --st-border: #d8d3c6;
  --st-serif: Georgia, "Iowan Old Style", serif;
  --st-shadow: 0 2px 8px rgba(23, 50, 77, 0.06), 0 1px 2px rgba(23, 50, 77, 0.04);
}

body { background: var(--st-paper) !important; color: var(--st-ink); }
.container { max-width: 1120px !important; }

/* ---- Header: compact navy bar ------------------------------ */
.hw-hero {
  background: var(--st-navy) !important;
  background-image: none !important;
  border-radius: 16px !important;
  border-bottom: 4px solid var(--st-teal-bright);
  box-shadow: var(--st-shadow) !important;
}
.hw-hero-glow { display: none !important; }
.hw-hero h1, .hw-hero-titles h1 {
  font-family: var(--st-serif) !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
}
.hw-hero-emoji {
  background: var(--st-teal) !important;
  border: 0 !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
.hw-hero-kicker { color: #fcd34d !important; }

@media (min-width: 900px) {
  /* Title block left, language picker right on the same two rows; everything
     below (lesson line, notes, lead, route chooser) spans the full width so no
     hairline or paragraph stops short and leaves an empty right edge. */
  .hw-hero-body {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 24px;
    align-items: start;
  }
  .hw-hero-body > * { grid-column: 1 / -1; }
  .hw-hero-body > .hw-hero-kicker { grid-column: 1; grid-row: 1; }
  .hw-hero-body > .hw-hero-head { grid-column: 1; grid-row: 2; border-bottom: 0 !important; }
  .hw-hero-body > .hw-hero-controls { grid-column: 2; grid-row: 1 / span 2; align-self: center; }
  .hw-hero-controls .lang-selector-title { display: none; }
  .hw-hero-lead { max-width: none !important; }
}

/* ---- Tab 1 = the concept: model on the left, plain steps on the right ---- */
@media (min-width: 1000px) {
  /* Two columns. The model card spans every row the concept column uses (up to
     12), so it can never grow past the column and cover what follows; row gaps
     come from the right-hand blocks' own bottom margin, so unused rows add no
     height. The "need more help" row and Continue sit below both columns. */
  #hw_panel_learn {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    column-gap: 24px;
    row-gap: 0;
    align-items: start;
  }
  #hw_panel_learn > .learn-big-idea-block,
  #hw_panel_learn .big-idea { display: contents; }
  #hw_panel_learn > .learn-jump-row { display: none; }
  #hw_panel_learn > * { grid-column: 2; min-width: 0; }
  #hw_panel_learn > .learn-summary-block,
  #hw_panel_learn .learn-big-idea-block > *,
  #hw_panel_learn .big-idea > *,
  #hw_panel_learn > .learn-extended-block { margin: 0 0 18px !important; }
  #hw_panel_learn > #hw_learn_try {
    grid-column: 1;
    grid-row: 1 / span 12;
    position: static;
    margin-bottom: 18px !important;
  }
  #hw_panel_learn .concept-visual-wrap { order: 8; }
  #hw_panel_learn > .tab-help-row,
  #hw_panel_learn > .tab-flow-nav { grid-column: 1 / -1; grid-row: 13; }
  #hw_panel_learn > .tab-flow-nav { grid-row: 14; }
  #hw_panel_learn > .learn-summary-block > div:first-child {
    flex-wrap: nowrap !important;
    margin-bottom: 12px !important;
    padding: 0 16px 0 0;
    background: var(--st-surface);
    border: 1px solid var(--st-border);
    border-left: 5px solid var(--st-navy);
    border-radius: 14px;
    box-shadow: var(--st-shadow);
  }
  #hw_panel_learn > .learn-summary-block > div:first-child .section-title {
    flex: 1 1 auto; border: 0; box-shadow: none; background: transparent;
  }
  #hw_panel_learn .section-title { width: 100%; box-sizing: border-box; }
  /* The heading above the banner already has a Listen button that reads the same sentence. */
  #hw_panel_learn .key-idea-banner .btn-read-aloud { display: none !important; }
}

.hw-hero .hw-hero-titles h1,
.hw-hero .hw-hero-titles .welcome-title-en,
.hw-hero .hw-hero-titles .welcome-title-es { font-size: clamp(1.5rem, 2.6vw, 2rem) !important; line-height: 1.15 !important; }

/* ---- Interactive model card (studio "grid-card") --------------- */
.family-visual-lab {
  margin: 0 !important;
  border: 1px solid var(--st-border) !important;
  border-radius: 16px !important;
  box-shadow: var(--st-shadow) !important;
  background: var(--st-surface) !important;
}
.family-visual-lab .visual-lab-heading,
.family-visual-lab .visual-lab-layout,
.family-visual-lab .visual-representation-grid { grid-template-columns: minmax(0, 1fr) !important; }
.family-visual-lab .visual-representation-card { min-height: 0 !important; }
.family-visual-lab h2, .family-visual-lab h3 { font-family: var(--st-serif) !important; color: var(--st-navy) !important; }

/* ---- Tab bar ------------------------------------------------ */
.homework-tab-chrome {
  background: var(--st-surface) !important;
  border: 1px solid var(--st-border) !important;
  border-radius: 14px !important;
  box-shadow: var(--st-shadow) !important;
}
.homework-tab-bar { background: transparent !important; gap: 4px; }
.homework-tab-btn {
  background: transparent !important;
  color: var(--st-ink-muted) !important;
  border: 0 !important;
  border-bottom: 3px solid transparent !important;
  border-radius: 10px 10px 0 0 !important;
  box-shadow: none !important;
}
.homework-tab-btn .tab-icon { display: none !important; }
.homework-tab-btn .tab-step {
  display: inline-grid !important;
  place-items: center;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--st-navy-tint) !important;
  color: var(--st-navy) !important;
  font-weight: 800;
}
.homework-tab-btn .tab-label { font-weight: 800; color: var(--st-navy) !important; }
.homework-tab-btn.is-active {
  background: var(--st-teal-tint) !important;
  border-bottom-color: var(--st-teal) !important;
}
.homework-tab-btn.is-active .tab-step {
  background: var(--st-navy) !important;
  color: #fff !important;
}

/* ---- Section headings = studio "topic strip" ---------------- */
.tab-panel-inner > .section-title,
.tab-panel-inner .section-title {
  background: var(--st-surface);
  border: 1px solid var(--st-border);
  border-left: 5px solid var(--st-navy);
  border-radius: 14px;
  padding: 14px 20px;
  font-family: var(--st-serif) !important;
  color: var(--st-navy) !important;
  box-shadow: var(--st-shadow);
}

/* The amber dot the old section titles carried. */
.section-title::before { display: none !important; }

/* ---- Cards -------------------------------------------------- */
.card, .problem-section.card, .guided-section.card {
  background: var(--st-surface) !important;
  border: 1px solid var(--st-border) !important;
  border-radius: 16px !important;
  box-shadow: var(--st-shadow) !important;
}

/* ---- Question card ----------------------------------------- */
.problem-number-badge {
  color: var(--st-teal) !important;
  background: transparent !important;
  font-size: 15px !important;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.problem-type-badge {
  background: var(--st-navy-tint) !important;
  color: var(--st-navy) !important;
  border-radius: 999px !important;
}
.problem-stem {
  font-size: 24px !important;
  font-weight: 700 !important;
  color: var(--st-navy-dark);
}

/* Answer rows: lettered, bordered, one per line */
.mc-options { counter-reset: st-choice; display: grid; gap: 10px; }
.mc-option-label {
  counter-increment: st-choice;
  display: flex !important;
  align-items: center;
  gap: 14px;
  background: var(--st-soft) !important;
  border: 2px solid var(--st-border) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 21px !important;
  transition: border-color .15s, background .15s;
}
.mc-option-label:hover { border-color: var(--st-teal-bright) !important; background: var(--st-teal-tint) !important; }
.mc-option-label .custom-radio {
  position: relative;
  flex: 0 0 34px;
  width: 34px; height: 34px;
  border-radius: 50%;
  border: 2px solid var(--st-navy) !important;
  background: #fff !important;
  display: grid; place-items: center;
}
.mc-option-label .custom-radio::before {
  content: counter(st-choice, upper-alpha);
  font-size: 15px; font-weight: 800; color: var(--st-navy);
}
.mc-option-label .custom-radio::after { display: none !important; }
.mc-option-label input[type="radio"]:checked ~ .custom-radio {
  background: var(--st-navy) !important;
}
.mc-option-label input[type="radio"]:checked ~ .custom-radio::before { color: #fff; }
.mc-option-label.is-correct {
  border-color: var(--st-green) !important;
  background: var(--st-green-tint) !important;
}
.mc-option-label.is-incorrect {
  border-color: var(--st-red) !important;
  background: var(--st-red-tint) !important;
}

/* ---- One-question-at-a-time stepper ------------------------- */
.hw-stepper-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  background: var(--st-surface);
  border: 1px solid var(--st-border);
  border-radius: 14px;
  padding: 10px 14px;
  margin: 0 0 14px;
  box-shadow: var(--st-shadow);
}
.hw-stepper-dots { display: flex; gap: 8px; flex-wrap: wrap; }
.hw-stepper-dot {
  min-width: 40px; height: 40px;
  border-radius: 10px;
  border: 1.5px solid var(--st-border);
  background: var(--st-soft);
  color: var(--st-navy);
  font: 800 16px/1 var(--st-serif);
  cursor: pointer;
}
.hw-stepper-dot.is-current { background: var(--st-navy); border-color: var(--st-navy); color: #fff; }
.hw-stepper-dot.is-done { background: var(--st-green-tint); border-color: var(--st-green); color: var(--st-green); }
.hw-stepper-dot.is-current.is-done { background: var(--st-navy); color: #fff; }
.hw-stepper-nav { display: flex; gap: 8px; }
.hw-stepper-nav button {
  min-height: 40px; padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid var(--st-navy);
  background: #fff; color: var(--st-navy);
  font-weight: 800; font-size: 16px; cursor: pointer;
}
.hw-stepper-nav button:disabled { opacity: .4; cursor: default; }
.problems-container.hw-stepped .problem-section:not(.is-step-current) { display: none; }

@media print {
  .hw-stepper-bar { display: none !important; }
  .problems-container.hw-stepped .problem-section:not(.is-step-current) { display: block; }
}
`;

export const STUDIO_SKIN_JS = `
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
      d.textContent = String(i + 1);
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
document.addEventListener('DOMContentLoaded', function () {
  initStudioStepper();
  glueTermPunctuation();
});
`;
