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
   STUDIO SKIN — access-practice-lab palette: crisp cool-blue paper,
   deep navy, vibrant royal blue, fresh teal, clean slate borders.
   Matches https://eduwonderlab.com/access-practice-lab/
   ============================================================ */
:root {
  --st-paper: #f5f8fc;
  --st-surface: #ffffff;
  --st-soft: #eef3fa;
  --st-navy: #15487f;
  --st-navy-dark: #0f2b5c;
  --st-navy-tint: #e8f0fe;
  --st-brand: #2563eb;
  --st-brand-ink: #1b4fc9;
  --st-brand-deep: #163d9e;
  --st-brand-soft: #e8f0fe;
  --st-teal: #0b7a75;
  --st-teal-bright: #1fa6a2;
  --st-teal-tint: #e1f5f3;
  --st-teal-line: #94dfdc;
  --st-amber: #f59e0b;
  --st-amber-tint: #fef3c7;
  --st-green: #137336;
  --st-green-tint: #e6f6ec;
  --st-red: #b42318;
  --st-red-tint: #fdecea;
  --st-ink: #14263d;
  --st-ink-muted: #384a60;
  --st-border: #dbe3ee;
  --st-border-strong: #b9c7d9;
  --st-serif: "Fraunces", Georgia, "Iowan Old Style", serif;
  --st-sans: Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --st-shadow: 0 1px 3px rgba(20, 38, 61, 0.06), 0 4px 14px rgba(20, 38, 61, 0.05);
}

body { background: var(--st-paper) !important; color: var(--st-ink); }
.container { max-width: 1120px !important; }

/* ---- Header: compact navy bar ------------------------------ */
.hw-hero {
  background: linear-gradient(135deg, #15487f 0%, #0f2b5c 100%) !important;
  background-image: none !important;
  border-radius: 18px !important;
  border: 1px solid #1c5999 !important;
  border-bottom: 5px solid var(--st-teal-bright) !important;
  box-shadow: 0 4px 14px rgb(20 38 61 / 10%) !important;
}
.hw-hero-glow { display: none !important; }
.hw-hero h1, .hw-hero-titles h1 {
  font-family: var(--st-serif) !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
}
.hw-hero-emoji {
  background: rgba(255, 255, 255, 0.16) !important;
  border: 0 !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
.hw-hero-kicker { color: #fcd34d !important; opacity: 0.95; }

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
   ACCESS PRACTICE LAB PALETTE — clean, high-contrast, modern
   Matches https://eduwonderlab.com/access-practice-lab/
   No muddy browns: crisp cool-blue surface, clean slate lines,
   vibrant royal blue / deep studio navy, fresh teal accents.
   ============================================================ */
:root {
  --navy: #15487f;
  --navy-light: #1c5999;
  --teal: #0b7a75;
  --teal-ink: #0a6a66;
  --teal-light: #e1f5f3;
  --amber-light: #fef3c7;
  --st-paper: #f5f8fc;
  --st-surface: #ffffff;
  --st-soft: #eef3fa;
  --st-navy: #15487f;
  --st-navy-dark: #0f2b5c;
  --st-navy-tint: #e8f0fe;
  --st-brand: #2563eb;
  --st-brand-ink: #1b4fc9;
  --st-brand-soft: #e8f0fe;
  --st-teal: #0b7a75;
  --st-teal-bright: #1fa6a2;
  --st-teal-tint: #e1f5f3;
  --st-teal-line: #94dfdc;
  --st-amber: #f59e0b;
  --st-amber-tint: #fef3c7;
  --st-green: #137336;
  --st-green-tint: #e6f6ec;
  --st-red: #b42318;
  --st-red-tint: #fdecea;
  --st-ink: #14263d;
  --st-ink-muted: #384a60;
  --st-border: #dbe3ee;
  --st-border-strong: #b9c7d9;
}
body { background: #f5f8fc !important; color: #14263d !important; }

.hw-hero {
  background: linear-gradient(135deg, #15487f 0%, #0f2b5c 100%) !important;
  border: 1px solid #1c5999 !important;
  border-bottom: 5px solid #1fa6a2 !important;
  box-shadow: 0 4px 14px rgb(20 38 61 / 10%) !important;
}
.hw-hero-emoji { background: rgba(255, 255, 255, 0.16) !important; }
.hw-hero-kicker { color: #fcd34d !important; opacity: 0.95; }
.hw-hero .lang-selector-title, .hw-hero-lesson-meta, .hw-hero-lesson-meta .lang-en, .hw-hero-lesson-meta .lang-es { color: #e2eaf5 !important; }
.btn-primary { background: #2563eb !important; border-color: #1b4fc9 !important; color: #ffffff !important; }
.btn-primary:hover { background: #1b4fc9 !important; }
.hw-route-chooser, .hw-session-banner, .hw-mystery, .pctlab-stage { background: #ffffff !important; border-color: #dbe3ee !important; }
.hw-route-option.is-active { background: #e8f0fe !important; border-color: #2563eb !important; color: #1b4fc9 !important; }
.hw-grownup, .hw-huddle { background: #fffbeb !important; border-color: #f59e0b !important; color: #92400e !important; }
.family-big-idea-piece, .bridge-row.bridge-class, .homework-tab-extra { background: #e1f5f3 !important; border-color: #0b7a75 !important; }
.pctlab-chip, .hw-session-chip, .hw-conf-btn { background: #eef3fa !important; border-color: #dbe3ee !important; color: #14263d !important; }
.visual-representation-model { background: #e1f5f3 !important; border-color: #0b7a75 !important; }
.visual-representation-math { background: #fef3c7 !important; border-color: #f59e0b !important; }
.visual-representation-words { background: #eef3fa !important; border-color: #dbe3ee !important; }

/* Sidebar rail & buttons matching access-practice-lab */
.homework-tab-btn {
  color: #384a60 !important;
  background: #ffffff;
  border: 1px solid #dbe3ee;
}
.homework-tab-btn:hover {
  background: #f0f5fc !important;
  color: #14263d !important;
}
.homework-tab-btn.active {
  background: #e8f0fe !important;
  border-color: #2563eb !important;
  color: #1b4fc9 !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12) !important;
}
.hw-sub-rail-btn {
  color: #566a82 !important;
}
.hw-sub-rail-btn:hover {
  background: #f0f5fc !important;
  color: #14263d !important;
}
.hw-sub-rail-btn.is-active,
.hw-sub-rail-btn[aria-current="location"] {
  background: #e8f0fe !important;
  border-color: #2563eb !important;
  color: #1b4fc9 !important;
  font-weight: 700 !important;
}

/* ---- Click to Enlarge / Lightbox ------------------------------ */
.is-zoomable {
  cursor: zoom-in !important;
  transition: transform 0.15s ease, filter 0.15s ease;
}
.is-zoomable:hover {
  filter: brightness(0.97);
}
.is-zoomable:focus-visible {
  outline: 3px solid #2563eb !important;
  outline-offset: 3px !important;
}

.concept-zoom-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  min-height: 40px;
  margin-top: 10px;
  padding: 8px 18px;
  border: 1.5px solid #2563eb;
  border-radius: 999px;
  background: #e8f0fe;
  color: #1b4fc9;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.concept-zoom-btn:hover {
  background: #dbeafe;
  border-color: #1d4ed8;
}

.hw-lightbox-dialog {
  position: fixed;
  inset: 0;
  z-index: 100000;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow: hidden;
}
.hw-lightbox-dialog[open] {
  display: flex !important;
  align-items: center;
  justify-content: center;
}
.hw-lightbox-dialog:not([open]) {
  display: none !important;
}
.hw-lightbox-dialog::backdrop {
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
}
.hw-lightbox-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}
.hw-lightbox-close {
  position: absolute;
  top: 18px;
  right: 24px;
  z-index: 100001;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 20px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: background 0.15s;
}
.hw-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.38);
}
.hw-lightbox-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 94vw;
  max-height: 90vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.hw-lightbox-img {
  display: block;
  max-width: 92vw;
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  cursor: zoom-out;
}
.hw-lightbox-svg {
  display: block;
  width: min(92vw, 1100px);
  max-height: 86vh;
  height: auto;
  margin: auto;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  cursor: zoom-out;
}
body.hw-lightbox-open {
  overflow: hidden !important;
}
@media print {
  .hw-lightbox-dialog, .concept-zoom-btn {
    display: none !important;
  }
}

/* ---- ACCESS Lab Vertical Rail Layout (Desktop >= 860px) ---- */
@media (min-width: 860px) {
  .container {
    max-width: 1140px !important;
    padding: 24px 20px 60px !important;
  }
  .homework-tabs-shell {
    display: grid !important;
    grid-template-columns: 248px minmax(0, 1fr) !important;
    column-gap: 24px !important;
    row-gap: 0 !important;
    align-items: start !important;
  }
  .homework-tab-chrome {
    position: sticky !important;
    top: 20px !important;
    z-index: 40 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    padding: 14px 12px !important;
    background: var(--fp-page, #ffffff) !important;
    border: 1px solid var(--fp-rule, #e2e8f0) !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04) !important;
  }
  .homework-tab-chrome::before {
    content: "TONIGHT'S PATH";
    display: block;
    font-family: var(--font-display, -apple-system, sans-serif);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--fp-ink-soft, #64748b);
    padding: 2px 8px 6px;
    border-bottom: 1px solid var(--fp-rule, #e2e8f0);
    margin-bottom: 4px;
  }
  body.lang-mode-es .homework-tab-chrome::before {
    content: "RUTA DE HOY";
  }
  .hw-tab-meta-row {
    order: 10;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--fp-rule, #e2e8f0);
  }
  .homework-tab-bar {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .homework-tab-btn {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 10px !important;
    min-height: 46px !important;
    padding: 8px 12px !important;
    border: 1.5px solid transparent !important;
    border-radius: 12px !important;
    background: transparent !important;
    text-align: left !important;
    width: 100% !important;
    box-sizing: border-box !important;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease !important;
  }
  .homework-tab-btn:hover {
    background: var(--fp-wash, #f8fafc) !important;
  }
  .homework-tab-btn.is-active {
    background: var(--fp-unit-tint, #e0f2fe) !important;
    border-color: var(--fp-unit, #0284c7) !important;
    color: var(--fp-unit-ink, #0369a1) !important;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.12) !important;
  }
  .homework-tab-btn .tab-step {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 24px !important;
    height: 24px !important;
    border-radius: 999px !important;
    background: var(--fp-wash, #f1f5f9) !important;
    color: var(--fp-ink, #1e293b) !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    flex-shrink: 0 !important;
  }
  .homework-tab-btn.is-active .tab-step {
    background: var(--fp-unit-ink, #0369a1) !important;
    color: #ffffff !important;
  }
  .homework-tab-btn.is-done .tab-step {
    background: #16a34a !important;
    color: #ffffff !important;
  }
  .homework-tab-btn.is-done .tab-step::after {
    content: "✓";
    font-size: 12px;
  }
  .homework-tab-btn .tab-icon {
    display: inline-block !important;
    font-size: 16px !important;
    line-height: 1 !important;
    flex-shrink: 0 !important;
  }
  .homework-tab-btn .tab-label {
    flex: 1 !important;
    min-width: 0 !important;
    text-align: left !important;
    font-size: 13.5px !important;
    font-weight: 700 !important;
    color: inherit !important;
  }
  .homework-tab-btn .tab-en,
  .homework-tab-btn .tab-es {
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  body.lang-mode-es .homework-tab-btn .tab-en { display: none !important; }
  body:not(.lang-mode-es) .homework-tab-btn .tab-es { display: none !important; }

  .homework-tab-extra {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 10px !important;
    min-height: 44px !important;
    padding: 8px 12px !important;
    margin-left: 0 !important;
    margin-top: 6px !important;
    border: 1.5px dashed var(--fp-rule, #cbd5e1) !important;
    border-radius: 12px !important;
    background: var(--fp-wash, #f8fafc) !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .homework-tab-extra::before {
    display: none !important;
  }
  .homework-tab-extra .tab-extra-blurb {
    display: none !important;
  }
  .homework-tab-extra .tab-label {
    text-align: left !important;
    font-size: 13px !important;
    font-weight: 700 !important;
  }
  .homework-tab-track {
    order: -1;
    margin-bottom: 6px;
  }
  .homework-tab-panels {
    min-width: 0 !important;
  }
}

/* ---- Sub buttons in Rail (Desktop only) ---- */
@media (min-width: 860px) {
  .hw-sub-rail {
    display: none;
    flex-direction: column;
    gap: 3px;
    margin: 4px 0 8px 16px;
    padding-left: 10px;
    border-left: 2px solid var(--fp-rule, #e2e8f0);
  }
  .homework-tab-btn.is-active + .hw-sub-rail {
    display: flex !important;
  }
  .hw-sub-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--fp-ink-soft, #475569);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    width: 100%;
    box-sizing: border-box;
  }
  .hw-sub-btn:hover {
    background: var(--fp-wash, #f1f5f9);
    color: var(--fp-ink, #0f172a);
  }
  .hw-sub-btn.is-active {
    background: var(--fp-unit-tint, #e0f2fe);
    border-color: var(--fp-unit, #bae6fd);
    color: var(--fp-unit-ink, #0369a1);
    font-weight: 700;
  }
  .hw-sub-btn .sub-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
  .hw-sub-btn .sub-text {
    flex: 1;
    font-size: 13.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  body.lang-mode-es .hw-sub-btn .lang-en { display: none !important; }
  body:not(.lang-mode-es) .hw-sub-btn .lang-es { display: none !important; }
}

@keyframes hwTargetPulse {
  0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(2, 132, 199, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
}
.hw-nav-target {
  animation: hwTargetPulse 1.2s ease-out;
  border-radius: 14px;
}

@media (max-width: 859px) {
  .hw-sub-rail, .hw-sub-btn {
    display: none !important;
  }
}


`;

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
    dlg.setAttribute('aria-label', 'Enlarged view / Vista ampliada');
    dlg.innerHTML = '<div class="hw-lightbox-inner">' +
      '<button type="button" class="hw-lightbox-close" aria-label="Close / Cerrar">✕ <span class="lang-en">Close</span><span class="lang-es" lang="es">Cerrar</span></button>' +
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
    if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    if (!el.getAttribute('title')) {
      el.setAttribute('title', 'Click to enlarge / Clic para ampliar');
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

    var svgs = scope.querySelectorAll('.concept-visual-wrap svg, svg.concept-svg, svg.hw-model-svg, svg.hw-mini-model-svg, .hw-colearn-svg-stage svg, .concept-fallback-visual svg');
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
