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
const FAMILY_PAPER_CSS = readFileSync(
  new URL("../assets/family-paper.css", import.meta.url),
  "utf8",
);

export const STUDIO_SKIN_CSS = `${FAMILY_PAPER_CSS}
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

/* ============================================================
   FAMILY PAPER — one paper, one ink, one hue per unit.
   Remaps the unit theme onto assets/family-paper.css so every
   lesson reads as the same product; three surfaces only:
   white card, unit-tint key idea, one grown-up highlight.
   ============================================================ */
:root {
  --navy: var(--fp-ink);
  --navy-light: var(--fp-ink-soft);
  --teal: var(--fp-unit);
  --teal-ink: var(--fp-unit-ink);
  --teal-light: var(--fp-unit-tint);
  --amber-light: var(--fp-note);
  --st-paper: var(--fp-paper);
  --st-soft: var(--fp-wash);
  --st-navy: var(--fp-ink);
  --st-navy-tint: var(--fp-wash);
  --st-teal: var(--fp-unit-ink);
  --st-teal-bright: var(--fp-unit);
  --st-teal-tint: var(--fp-unit-tint);
  --st-teal-line: var(--fp-unit);
  --st-border: var(--fp-rule);
  --st-serif: var(--fp-serif);
}
.hw-hero {
  background: var(--fp-unit-ink) !important;
  border: 0 !important;
  border-bottom: 5px solid var(--fp-unit) !important;
}
.hw-hero-emoji { background: rgba(255, 255, 255, 0.16) !important; }
.hw-hero-kicker { color: #fff !important; opacity: 0.88; }
.hw-hero .lang-selector-title, .hw-hero-lesson-meta, .hw-hero-lesson-meta .lang-en, .hw-hero-lesson-meta .lang-es { color: #f6f1ea !important; }
.btn-primary { background: var(--fp-unit-ink) !important; border-color: var(--fp-unit-ink) !important; }
.hw-route-chooser, .hw-session-banner, .hw-mystery, .pctlab-stage { background: var(--fp-page) !important; border-color: var(--fp-rule) !important; }
.hw-route-option.is-active { background: var(--fp-unit-tint) !important; border-color: var(--fp-unit) !important; }
.hw-grownup, .hw-huddle { background: var(--fp-note) !important; border-color: var(--fp-note-ink) !important; color: var(--fp-note-ink); }
.family-big-idea-piece, .bridge-row.bridge-class, .homework-tab-extra { background: var(--fp-unit-tint) !important; }
.pctlab-chip, .hw-session-chip, .hw-conf-btn { background: var(--fp-wash); border-color: var(--fp-rule); }
.visual-representation-model { background: var(--fp-unit-tint); }
.visual-representation-math { background: var(--fp-note); }
.visual-representation-words { background: var(--fp-wash); }

/* ---- Tonight's Path Top Scrolling & Navigation Bar ---- */
.container {
  max-width: 1040px !important;
  padding: 16px 20px 60px !important;
}
.homework-tabs-shell {
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  width: 100% !important;
}
.homework-tab-chrome {
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  padding: 10px 16px 10px !important;
  background: var(--fp-page, #ffffff) !important;
  border: 1px solid var(--fp-rule, #e2e8f0) !important;
  border-radius: 0 0 16px 16px !important;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.homework-tab-chrome::before {
  content: "TONIGHT'S PATH";
  display: inline-block;
  font-family: var(--font-display, -apple-system, sans-serif);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--fp-ink-soft, #64748b);
  padding: 0 4px 2px;
}
body.lang-mode-es .homework-tab-chrome::before {
  content: "RUTA DE HOY";
}
.homework-tab-track {
  width: 100%;
  height: 3px;
  background: var(--fp-rule, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 0 4px;
}
.homework-tab-track-fill {
  display: block;
  height: 100%;
  width: 0%;
  background: var(--fp-unit, #0284c7);
  transition: width 0.25s ease;
}
.homework-tab-bar {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 2px 0 4px !important;
  background: transparent !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
}
.homework-tab-bar::-webkit-scrollbar { display: none; }

.homework-tab-btn {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  min-height: 44px !important;
  padding: 6px 14px !important;
  border: 1.5px solid var(--fp-rule, #cbd5e1) !important;
  border-radius: 999px !important;
  background: var(--fp-wash, #f8fafc) !important;
  color: var(--fp-ink, #1e293b) !important;
  text-align: center !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
  transition: all 0.15s ease !important;
}
.homework-tab-btn:hover {
  background: #ffffff !important;
  border-color: var(--fp-unit, #0284c7) !important;
}
.homework-tab-btn.is-active {
  background: var(--fp-unit-ink, #0369a1) !important;
  border-color: var(--fp-unit-ink, #0369a1) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(3, 105, 161, 0.25) !important;
}
.homework-tab-btn .tab-step {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  height: 22px !important;
  border-radius: 999px !important;
  background: rgba(15, 23, 42, 0.08) !important;
  color: inherit !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  flex-shrink: 0 !important;
}
.homework-tab-btn.is-active .tab-step {
  background: #ffffff !important;
  color: var(--fp-unit-ink, #0369a1) !important;
}
.homework-tab-btn.is-done .tab-step {
  background: #16a34a !important;
  color: #ffffff !important;
}
.homework-tab-btn.is-done .tab-step::after {
  content: "✓";
  font-size: 11px;
}
.homework-tab-btn .tab-icon {
  display: inline-block !important;
  font-size: 15px !important;
  line-height: 1 !important;
  flex-shrink: 0 !important;
}
.homework-tab-btn .tab-label {
  font-size: 13.5px !important;
  font-weight: 700 !important;
  color: inherit !important;
}
.homework-tab-btn .tab-en,
.homework-tab-btn .tab-es {
  display: inline-block !important;
}
body.lang-mode-es .homework-tab-btn .tab-en { display: none !important; }
body:not(.lang-mode-es) .homework-tab-btn .tab-es { display: none !important; }

.homework-tab-extra {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
  min-height: 44px !important;
  padding: 6px 14px !important;
  border: 1.5px dashed var(--fp-rule, #cbd5e1) !important;
  border-radius: 999px !important;
  background: var(--fp-wash, #f8fafc) !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}
.homework-tab-extra::before, .homework-tab-extra .tab-extra-blurb { display: none !important; }
.homework-tab-extra .tab-label { font-size: 13px !important; font-weight: 700 !important; }

.hw-tab-meta-row {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* ---- Horizontal Sub-Button Rails at the Top ---- */
.hw-sub-bar-container {
  width: 100%;
}
.hw-sub-rail {
  display: none !important;
}
.hw-sub-rail.is-active-rail {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 6px 2px 2px !important;
  margin-top: 4px !important;
  border-top: 1px solid var(--fp-rule, #e2e8f0) !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
}
.hw-sub-rail::-webkit-scrollbar { display: none; }

.hw-sub-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 5px 12px !important;
  min-height: 32px !important;
  border-radius: 999px !important;
  border: 1px solid var(--fp-rule, #cbd5e1) !important;
  background: var(--fp-wash, #f8fafc) !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: var(--fp-ink-soft, #475569) !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  transition: all 0.15s ease !important;
}
.hw-sub-btn:hover {
  background: #ffffff !important;
  border-color: var(--fp-unit, #0284c7) !important;
  color: var(--fp-ink, #0f172a) !important;
}
.hw-sub-btn.is-active {
  background: var(--fp-unit-tint, #e0f2fe) !important;
  border-color: var(--fp-unit, #0284c7) !important;
  color: var(--fp-unit-ink, #0369a1) !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 4px rgba(2, 132, 199, 0.16) !important;
}
.hw-sub-btn .sub-icon { font-size: 13px !important; flex-shrink: 0 !important; }
.hw-sub-btn .sub-text { font-size: 13.5px !important; white-space: nowrap !important; }
body.lang-mode-es .hw-sub-btn .lang-en { display: none !important; }
body:not(.lang-mode-es) .hw-sub-btn .lang-es { display: none !important; }

@keyframes hwTargetPulse {
  0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(2, 132, 199, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
}
.hw-nav-target {
  animation: hwTargetPulse 1.2s ease-out;
  border-radius: 14px;
}
`;

export const STUDIO_SKIN_JS = `
/* Helper: smooth scroll to element accounting for sticky top bar and display:contents */
function scrollStudioTo(el) {
  if (!el) return;
  var node = el;
  while (node && window.getComputedStyle(node).display === 'contents') {
    node = node.firstElementChild;
  }
  if (!node) node = el;
  var det = node.closest('details');
  if (det && !det.open) det.open = true;
  var chrome = document.querySelector('.homework-tab-chrome');
  var headerH = chrome ? chrome.offsetHeight : 90;
  var rect = node.getBoundingClientRect();
  var targetY = window.pageYOffset + rect.top - headerH - 12;
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
    { id: 'talk', icon: '💬', en: '60-Sec Talk', es: 'Charla 60s', sel: '#hw_dinner_talk, .hw-dinner-talk, .dinner-talk-card' },
    { id: 'idea', icon: '💡', en: 'Big Idea', es: 'Idea principal', sel: '#hw_learn_idea .family-big-idea-piece, #hw_learn_idea > .section-title, #hw_learn_idea, .big-idea, .key-idea-banner' },
    { id: 'try', icon: '👆', en: 'Interactive Model', es: 'Modelo interactivo', sel: '#hw_learn_try, .family-visual-lab, .interactive-visual-host' },
    { id: 'quick', icon: '❓', en: 'Try Question', es: 'Pregunta rápida', sel: '#hw_learn_quick, .learn-quick-check' }
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

function updateActiveSubRail(activeTabId) {
  if (!activeTabId) {
    var activeBtn = document.querySelector('.homework-tab-btn.is-active');
    activeTabId = (activeBtn && activeBtn.dataset.tab) || document.body.dataset.activeTab || 'learn';
  }
  document.querySelectorAll('.hw-sub-rail').forEach(function (r) {
    var isActive = r.id === ('hw_sub_' + activeTabId);
    r.classList.toggle('is-active-rail', isActive);
  });
}

function initStudioSubRail() {
  var chrome = document.querySelector('.homework-tab-chrome');
  var tabBar = document.querySelector('.homework-tab-bar');
  if (!chrome || !tabBar) return;

  var subBar = document.getElementById('hw_sub_bar');
  if (!subBar) {
    subBar = document.createElement('div');
    subBar.id = 'hw_sub_bar';
    subBar.className = 'hw-sub-bar-container';
    chrome.appendChild(subBar);
  }

  var tabBtns = document.querySelectorAll('.homework-tab-btn');
  if (!tabBtns.length) return;

  tabBtns.forEach(function (btn) {
    var tabId = btn.dataset.tab;
    var rail = document.getElementById('hw_sub_' + tabId);
    if (!rail) {
      rail = document.createElement('div');
      rail.className = 'hw-sub-rail';
      rail.id = 'hw_sub_' + tabId;
      subBar.appendChild(rail);
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
        sBtn.innerHTML = '<span class="sub-icon">' + item.icon + '</span><span class="sub-text"><span class="lang-en">' + item.en + '</span><span class="lang-es" lang="es">' + item.es + '</span></span>';
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
        extraBtn.innerHTML = '<span class="sub-icon">⭐</span><span class="sub-text"><span class="lang-en">More Practice</span><span class="lang-es" lang="es">Más práctica</span></span>';
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
        sBtn.innerHTML = '<span class="sub-icon">' + v.c.icon + '</span><span class="sub-text"><span class="lang-en">' + v.c.en + '</span><span class="lang-es" lang="es">' + v.c.es + '</span></span>';
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

  updateActiveSubRail();
}

/* Install tab scrolling: clicking any tab button smoothly scrolls to the top of that panel */
function installStudioTabScroll() {
  if (window.__studioTabScrollInstalled) return;
  window.__studioTabScrollInstalled = true;

  document.querySelectorAll('.homework-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = btn.dataset.tab;
      updateActiveSubRail(tabId);
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
      updateActiveSubRail(tabId);
      if (window.hwTabsBooted && (!opts || !opts.preventScroll)) {
        window.requestAnimationFrame(function () {
          var panel = document.getElementById('hw_panel_' + tabId);
          if (panel) scrollStudioTo(panel);
        });
      }
    };
  }

  // Observe active tab changes
  var bodyObs = new MutationObserver(function () {
    updateActiveSubRail();
  });
  bodyObs.observe(document.body, { attributes: true, attributeFilter: ['data-active-tab'] });
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

    var chrome = document.querySelector('.homework-tab-chrome');
    var headerH = chrome ? chrome.offsetHeight : 90;
    var currentBtn = targets[0].btn;
    for (var i = 0; i < targets.length; i++) {
      var top = targets[i].el.getBoundingClientRect().top;
      if (top <= headerH + 60) {
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

function bootStudioSkin() {
  initStudioStepper();
  glueTermPunctuation();
  initStudioSubRail();
  installStudioTabScroll();
  installStudioScrollSpy();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootStudioSkin);
} else {
  bootStudioSkin();
}
`;
