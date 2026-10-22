/**
 * Styles for the family experience layer. Appended after every other homework
 * stylesheet so it wins by order, not by !important, wherever it can.
 *
 * Type floor: nothing a family has to read is under 14px; labels are 13px at the
 * very smallest. Touch targets are 44px or more. Motion is opt-in
 * (prefers-reduced-motion: no-preference) and never carries meaning on its own.
 */
export const EXPERIENCE_CSS = `
/* ── Family experience layer ────────────────────────────────────────────── */
.hw-sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.hw-eyebrow { margin: 0 0 4px; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--teal-ink, #0c6f6b); }

/* Skip link: visible only on keyboard focus. */
.hw-skip { position: absolute; left: 8px; top: -64px; z-index: 10060; padding: 12px 18px; border-radius: 12px; background: var(--navy, #12355b); color: #fff; font-weight: 800; text-decoration: none; }
.hw-skip .lang-en, .hw-skip .lang-es { color: inherit; }
.hw-skip:focus { top: 8px; outline: 3px solid var(--amber, #f2c15b); outline-offset: 2px; }
@media print { .hw-skip { display: none; } }

/* Language first: the picker is the first thing in the hero on a phone. */
@media (max-width: 640px) {
  .hw-hero-body > .hw-hero-controls { order: 0; }
  .hw-hero-body > .hw-tonight { order: 4; }
  .lang-selector-title { display: block; margin: 0 0 6px; font-size: 14px; font-weight: 800; }
  .hw-hero .lang-selector-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .hw-hero .lang-toggle-btn { flex: none; width: 100%; min-height: 44px; padding: 8px 6px; font-size: 14px; line-height: 1.2; justify-content: center; }
}

@media (max-width: 640px) {
  /* The hero keeps what a family needs to start: language, lesson, big idea, time, path. */
  .hw-hero-kicker, .hw-hero-subtitle { display: none; }
  .lang-mode-bilingual .hw-hero-lesson-meta .lang-es { display: none; }
  .hw-route-chooser .hw-route-heading > div > p { display: block; margin: 4px 0 0; font-size: 15px; }
}
.lang-mode-bilingual .hw-hero-lesson-title .lang-es, .lang-mode-bilingual .hw-hero-titles .lang-es { font-size: .86em; }
#hw_resume_note { font-size: 15px; line-height: 1.4; }
@media (max-width: 640px) { .hw-route-icon { display: none; } }
.hw-session-short { display: none; }
@media (max-width: 640px) {
  /* A phone shows the two-session stepper and nothing else of the banner. */
  .hw-session-full { display: none; }
  .hw-session-short { display: inline; }
  .hw-session-sentence { display: none; }
  .hw-session-banner { padding: 8px 10px; }
  .hw-route-chooser .hw-route-heading h2 { font-size: 19px; line-height: 1.3; }
  .hw-route-chooser #hw_route_note { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
.lang-btn-short { display: none; }
@media (max-width: 640px) { .lang-btn-long { display: none; } .lang-btn-short { display: inline; } }
body[data-active-tab="check"] .ls-launcher { bottom: calc(92px + env(safe-area-inset-bottom, 0px)); }

/* Tonight at a glance. */
.hw-tonight { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; padding: 0; list-style: none; }
.hw-tonight li { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .32); background: rgba(255, 255, 255, .14); color: #fff; font-size: 15px; font-weight: 700; line-height: 1.25; }

/* Bilingual layout utilities. The page shows both languages in "bilingual" mode; tight
   components choose how: stacked (hw-stack) or on one line (hw-inline). Never mid-word. */
.lang-mode-bilingual .hw-stack .lang-en, .lang-mode-bilingual .hw-stack .lang-es { display: block; }
.hw-stack .lang-es::before, .hw-stack .lang-es::after { content: none !important; }
.lang-mode-bilingual .hw-stack .lang-es { margin: 0; padding: 0; border: 0; font-size: max(13px, .92em); opacity: .9; }
.hw-stack, .hw-stack * { overflow-wrap: normal; word-break: normal; hyphens: manual; }
.lang-mode-bilingual .hw-inline .lang-en, .lang-mode-bilingual .hw-inline .lang-es { display: inline; margin: 0; padding: 0; border: 0; background: none; }
.lang-mode-bilingual .hw-inline .lang-es::before { content: " · "; }

/* Route chooser: names fit their chips; the recommended route is marked. */
.hw-route-option { position: relative; }
.hw-route-option .hw-route-copy strong { overflow-wrap: normal; word-break: normal; hyphens: manual; }
.hw-route-copy strong .lang-en, .hw-route-copy strong .lang-es { display: block; }
.hw-route-copy strong .lang-es::before { content: none; }
.hw-route-time { padding-inline: 10px; }
.lang-mode-bilingual .hw-route-copy strong .lang-es { margin: 0; padding: 0; border: 0; font-size: 13px; font-weight: 600; opacity: .85; }
.hw-route-badge { position: absolute; top: 4px; right: 6px; font-size: 13px; line-height: 1; color: var(--amber-ink, #8a5a00); }
@media (max-width: 640px) {
  .hw-route-option .hw-route-time small { font-size: 13px; }
  .hw-route-option .hw-route-copy strong { font-size: 14px; }
}

/* Bottom bar on the Check stop: goal on one row, the two actions on the next. */
.bottom-status-bar .score-text { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 14px; }
.bottom-status-bar .hw-goal-label { font-weight: 800; line-height: 1.2; }
@media (max-width: 640px) {
  .bottom-status-bar .status-bar-wrapper { flex-wrap: wrap; gap: 8px; padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
  .bottom-status-bar .score-progress-container { flex: 1 1 calc(100% - 60px); min-width: 0; }
  .bottom-status-bar .action-buttons { flex: 1 1 100%; display: grid; grid-template-columns: 1fr 1.5fr; gap: 8px; }
  .bottom-status-bar .action-buttons .btn { min-height: 48px; padding: 6px 10px; font-size: 15px; line-height: 1.2; white-space: normal; }
}

/* The goal meter. */
.hw-pips { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }
.hw-pip { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--navy, #12355b); background: transparent; box-sizing: border-box; transition: background-color .2s ease, transform .2s ease; }
.hw-pip.is-on { background: var(--teal, #1fa6a2); border-color: var(--teal-ink, #0c6f6b); }
.hw-pips-bar .hw-pip { width: 14px; height: 14px; }
.hw-goal-card { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: 0 0 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid var(--teal, #1fa6a2); background: var(--teal-light, #e6f6f3); }
.hw-goal-card p { margin: 0; font-size: 17px; line-height: 1.45; flex: 1 1 260px; }
.hw-goal-card .hw-pip { width: 24px; height: 24px; }
.hw-bonus { font-size: 15px; font-weight: 700; color: var(--teal-ink, #0c6f6b); }
.hw-bonus[hidden] { display: none; }

/* Mystery challenge. */
.hw-mystery { display: flex; gap: 14px; align-items: flex-start; margin: 16px 0; padding: 16px; border-radius: 16px; border: 2px dashed var(--navy, #12355b); background: #f6f8fb; }
.hw-mystery.is-unlocked { border-style: solid; border-color: var(--teal-ink, #0c6f6b); background: var(--teal-light, #e6f6f3); }
.hw-mystery-lock { font-size: 40px; line-height: 1; flex: 0 0 auto; }
.hw-mystery h3 { margin: 0 0 6px; font-size: 20px; line-height: 1.3; color: var(--navy, #12355b); }
.hw-mystery-stem { margin: 0 0 8px; font-size: 19px; line-height: 1.45; font-weight: 700; }
.hw-mystery-status { margin: 0 0 8px; font-size: 16px; }
.hw-mystery-open { min-height: 48px; padding: 10px 18px; border-radius: 12px; border: 0; background: var(--navy, #12355b); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
.hw-mystery-open[hidden] { display: none; }
.hw-mystery-open:focus-visible, .hw-conf-btn:focus-visible, .hw-share-win:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
body[data-homework-route="quick"] .hw-mystery { display: none; }
.hw-spotlight { outline: 4px solid var(--amber, #f2c15b); outline-offset: 4px; border-radius: 14px; }
@media (prefers-reduced-motion: no-preference) {
  .hw-mystery.is-unlocked .hw-mystery-lock { animation: hw-unlock .6s ease-out 1; }
  @keyframes hw-unlock { 0% { transform: scale(.8) rotate(-12deg); } 60% { transform: scale(1.2) rotate(6deg); } 100% { transform: none; } }
}

/* Confidence: a plant that grows. */
.hw-confidence { margin: 16px 0; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--border, #cfd8e3); background: #fff; }
.hw-confidence h3 { margin: 0 0 10px; font-size: 18px; line-height: 1.35; color: var(--navy, #12355b); }
.hw-conf-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.hw-conf-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 76px; padding: 8px 6px; border-radius: 14px; border: 2px solid #b8c7d6; background: #f3f7fa; color: var(--navy, #12355b); font: inherit; font-size: 14px; font-weight: 700; line-height: 1.2; text-align: center; cursor: pointer; }
.hw-conf-btn.is-on { border-color: var(--teal-ink, #0c6f6b); background: var(--teal-light, #e6f6f3); box-shadow: inset 0 0 0 1px var(--teal-ink, #0c6f6b); }
.hw-conf-icon { font-size: 28px; line-height: 1; }
.hw-conf-note, .hw-conf-growth { margin: 8px 0 0; font-size: 14px; color: var(--muted, #4a5b6c); }
.hw-conf-growth { font-size: 17px; font-weight: 700; color: var(--teal-ink, #0c6f6b); }
.hw-conf-growth:empty { display: none; }

/* Grown-up drawer: one place, one preview line. */
.hw-grownup { margin: 16px 0; border: 2px solid var(--amber, #f2c15b); border-radius: 16px; background: var(--amber-light, #fef7e0); }
.hw-grownup > summary { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 14px; cursor: pointer; list-style: none; }
.hw-grownup > summary::-webkit-details-marker { display: none; }
.hw-grownup > summary:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
.hw-grownup-icon { font-size: 28px; }
.hw-grownup-text { flex: 1; display: grid; gap: 2px; min-width: 0; }
.hw-grownup-text small { font-size: 15px; line-height: 1.4; color: var(--ink, #21313f); }
.hw-grownup-chev { font-size: 18px; transition: transform .15s ease; }
.hw-grownup[open] .hw-grownup-chev { transform: rotate(180deg); }
.hw-grownup-body { padding: 0 14px 14px; display: grid; gap: 14px; }
.hw-grownup-body > * { margin: 0; }
.hw-grownup .parent-quick-title { display: none; }
.hw-grownup[open] .hw-grownup-text small { display: none; }

/* Teach it back. */
.hw-teach { margin: 0 0 18px; padding: 16px; border-radius: 16px; border: 2px solid var(--navy, #12355b); background: #fff; }
.hw-teach h3 { margin: 0 0 10px; font-size: 22px; color: var(--navy, #12355b); }
.hw-teach-steps { margin: 0; padding-left: 22px; display: grid; gap: 10px; font-size: 17px; line-height: 1.5; }
.hw-teach-words { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 0; padding: 0; list-style: none; }
.hw-teach-words li { padding: 6px 12px; border-radius: 999px; background: var(--teal-light, #e6f6f3); border: 1px solid var(--teal, #1fa6a2); font-size: 15px; }

.hw-nights { margin: 0 0 18px; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--border, #cfd8e3); background: #fff; }
.hw-nights h3 { margin: 0 0 10px; font-size: 18px; color: var(--navy, #12355b); }
.hw-nights-week { display: flex; gap: 8px; margin: 0 0 10px; padding: 0; list-style: none; }
.hw-night { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #b8c7d6; background: #f3f7fa; color: var(--navy, #12355b); font-weight: 800; font-size: 15px; }
.hw-night.is-on { border-color: var(--teal-ink, #0c6f6b); background: var(--teal, #1fa6a2); color: #fff; }
.hw-nights-streak { margin: 0; font-size: 18px; font-weight: 800; color: var(--teal-ink, #0c6f6b); }
.hw-nights-note { margin: 6px 0 0; font-size: 14px; color: var(--muted, #4a5b6c); }
.hw-share { margin: 16px 0; }
.hw-share-win { min-height: 48px; }
.hw-share-note { margin: 6px 0 0; font-size: 14px; color: var(--muted, #4a5b6c); }

/* Math Dominoes: a tile that carries words shows both languages, one under the other. */
.lang-mode-bilingual .fam-dom-half .lang-en, .lang-mode-bilingual .fam-dom-half .lang-es { display: block; }
.fam-dom-half .lang-es::before { content: none !important; }
.lang-mode-bilingual .fam-dom-half .lang-es { margin: 2px 0 0; padding: 0; border: 0; font-size: 14px; font-weight: 600; opacity: .88; }

/* Toast and dialog. */
.hw-toast { position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 10050; max-width: min(92vw, 520px); padding: 12px 18px; border-radius: 14px; background: var(--navy, #12355b); color: #fff; font-size: 16px; font-weight: 700; line-height: 1.4; box-shadow: 0 8px 24px rgba(8, 27, 46, .35); }
.hw-toast[hidden] { display: none; }
dialog.hw-dialog { width: min(92vw, 420px); padding: 20px; border: 0; border-radius: 16px; color: var(--ink, #21313f); background: #fff; box-shadow: 0 16px 48px rgba(8, 27, 46, .4); }
dialog.hw-dialog::backdrop { background: rgba(8, 27, 46, .55); }
dialog.hw-dialog p { margin: 0 0 16px; font-size: 18px; line-height: 1.45; }
.hw-dialog-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.hw-dialog-actions .btn { min-height: 48px; }

/* The photobooth is a tool beside Done, not a stop: icon and name only. */
.homework-tab-extra .tab-extra-blurb { display: none; }

/* Type floor: reading text and controls are 14px or more; uppercase labels and tab names are 13px.
   The browser sweep (tools/validate-family-experience-browser.mjs) fails the build below this. */
.btn-sm, .btn-read-aloud, .hw-listen, .btn-listen-prob, .vocab-speak-btn, .vocab-btn-label,
.btn-feeling, .help-pop-btn, .flip-prompt, .flip-back-prompt, .vocab-visual-hint, .vocab-back-visual, .vocab-def-es,
.coach-ladder-step, .problem-coach-ladder, .parent-coach-prompt, .family-problem-tip, .fam-act-materials, .fam-act-time,
.fam-mission-complete, .visual-coach-box, .high-five-labels, .achieve-name, .done-problem-chip, .streak-text,
.hw-standard-desc, .hw-standard-summary, .bridge-label, .learning-words-label, .chip-label-en, .chip-label-es,
.hw-session-name, .hw-route-time small, .star-chip, .powerup-badge-star, .hw-conf-label, .hw-goal-label,
.bilingual-col .lang-label, .learning-word-chips li, .hw-answer-key-label, .hw-answer-key-label .lang-en, .hw-answer-key-label .lang-es,
.family-mission-status, .family-mission-status .lang-en, .family-mission-status .lang-es, .word-bank-label, .word-bank-label .lang-en,
.word-bank-label .lang-es, .tool-presets-label, .tool-presets-label .lang-en, .tool-presets-label .lang-es,
.wb-preset-btn, .wb-preset-btn .lang-en, .wb-preset-btn .lang-es, .workbench-drawer-text small, .workbench-drawer-text small .lang-en, .workbench-drawer-text small .lang-es,
.problem-coach-ladder .lang-en, .problem-coach-ladder .lang-es, .visual-coach-box .lang-en, .visual-coach-box .lang-es,
.high-five-labels .lang-en, .high-five-labels .lang-es { font-size: 14px !important; }
.problem-type-badge, .vocab-back-badge, .spotlight-badge, .powerup-tag, .visual-lab-kicker, .fam-act-badge,
.fam-game-badge, .hw-hero-bigidea-label, .lang-selector-title, .lang-tag, .tab-en, .tab-es,
.hw-hero-lesson-meta, .section-title .lang-es, .powerup-letter, .coach-step-number, .fam-act-step-num { font-size: 13px !important; }
.hw-hero-lesson-meta { font-size: 14px !important; }
/* Control and data labels inside the visual labs (percent, equation, unit-rate, dot plot, ...)
   were authored at 10.9-12.8px. They are read on a phone, so they get the label floor. The
   browser sweep (validate:family-experience-browser) names any new lab label that is under it. */
.urlab-badge, .bplab-leg, .sdlab-mlabel, .fdiv-step-num, .cpl-chip, .urlab-field span, .sdlab-datalabel,
.ldl-field span, .eqlab-field span, .tdl-rowlab, .pki-cb-field label, .nlex-tip, .ldl-cycle, .bplab-datalabel,
.pwrlab-field span, .pctlab-field span, .stepslv-problabel, .atx-badge, .tdl-fill, .hglab-datalabel, .hglab-tip,
.ldl-alabel, .dp-hint, .clt-step-num { font-size: 13px !important; }
.vq-stars { flex-wrap: wrap; }
/* Engine visuals set their label rows inline at .8rem (12.8px). */
.interactive-visual [style*="font-size:.8rem"] { font-size: 13px !important; }

/* Nothing may be wider than the phone. Buttons wrap their two languages instead of running off
   the screen, link rows wrap, and wide tables and diagrams scroll inside their own frame. */
.learn-jump-row { flex-wrap: wrap; }
.learn-jump-row a { white-space: normal; }
.tab-panel-inner .btn, .tab-panel-inner button { max-width: 100%; white-space: normal; }
.decimal-place-grid, .hw-visual-frame, .family-discount-visual, .problem-visual-wrap { max-width: 100%; overflow-x: auto; }
.dec-grid-table th, .dec-grid-table th small, .dec-grid-table td { font-size: 13px; }
.family-discount-equation small, .family-discount-visual small, .hw-graph-controls, .hw-graph-controls .lang-en,
.hw-graph-controls .lang-es, .hw-graph-reset, .hw-graph-reset .lang-en, .hw-graph-reset .lang-es { font-size: 14px !important; }
.family-discount-equation small { font-size: 13px !important; }

@media print {
  .hw-nights, .hw-tonight, .hw-mystery, .hw-confidence, .hw-grownup, .hw-teach, .hw-share, .hw-toast, dialog.hw-dialog, .hw-goal-card { display: none !important; }
}
`;
