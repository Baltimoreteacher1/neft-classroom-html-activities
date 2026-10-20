/**
 * The printed family homework sheet.
 *
 * Many families print this page rather than open the .docx. Until now Ctrl+P
 * printed the whole interactive page: the language switcher, Listen buttons, a
 * live Percent Lab, hint ladders, check buttons and a "Show my work" pad drawn
 * as a screen widget — 24 pages for lesson 4-3. This is the one print layer for
 * the default print and for "Print problems only": a single column of 12pt+
 * type on white, a Name / Date line, the lesson's idea for the grown-up, then
 * every problem with ruled space to answer by hand.
 *
 * It prints nothing a student should not carry home on paper: no answer key, no
 * hint text, no check feedback. Models and diagrams inside a problem stay.
 *
 * The three special sheets (`print-answer-sheet`, `print-domino-sheet`,
 * `print-refrigerator-sheet`) are separate documents with their own rules, so
 * this layer stands aside for them.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The sheet header: hidden on screen, shown when printing. Lives outside the
 * hero (which is screen-only) so "Print problems only" keeps it too.
 */
export function renderPrintHead({ unitLabel, lessonTitle, pageLabel }) {
  const bi = (en, es) =>
    `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;
  return `
    <section class="hw-print-head" aria-hidden="true">
      <p class="hw-print-kicker">${bi(unitLabel.en, unitLabel.es)} · ${bi(pageLabel.en, pageLabel.es)}</p>
      <p class="hw-print-title">${bi(lessonTitle.en, lessonTitle.es)}</p>
      <p class="hw-print-name">
        <span class="hw-print-field">${bi("Name", "Nombre")}<i></i></span>
        <span class="hw-print-field hw-print-field-short">${bi("Date", "Fecha")}<i></i></span>
      </p>
      <p class="hw-print-note">${bi(
        "Optional practice. Try each problem first, then talk it over with a grown-up.",
        "Práctica opcional. Intenta cada problema primero y luego conversa con un adulto.",
      )}</p>
    </section>`;
}

const SHEET =
  "body:not(.print-answer-sheet):not(.print-domino-sheet):not(.print-refrigerator-sheet)";

export const PRINT_CSS = `
/* ===== Family homework print sheet (scripts/lib/homework-print.mjs) ===== */
.hw-print-head, .hw-print-choices { display: none; }
@page { size: letter; margin: 14mm 13mm 16mm; }
@media print {
  ${SHEET} { background: #fff !important; color: #000 !important; padding: 0 !important;
    font-size: 12pt !important; line-height: 1.4 !important; }
  ${SHEET} .container { max-width: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
  ${SHEET} * { box-shadow: none !important; text-shadow: none !important; animation: none !important; }
  ${SHEET} a { color: #000 !important; text-decoration: none !important; }
  ${SHEET} .card, ${SHEET} .card-ish, ${SHEET} .problem-section, ${SHEET} .practice-tier-head,
  ${SHEET} .learn-summary-block, ${SHEET} .learn-big-idea-block, ${SHEET} .parent-quick-card,
  ${SHEET} .bilingual-col { background: #fff !important; color: #000 !important; border-color: #777 !important; }
  ${SHEET} .container p, ${SHEET} .container li, ${SHEET} .container label,
  ${SHEET} .container td, ${SHEET} .container th, ${SHEET} .choice-text, ${SHEET} .problem-stem,
  ${SHEET} .learning-big, ${SHEET} .learning-sub { font-size: 12pt !important; line-height: 1.4 !important; color: #000 !important; }
  ${SHEET} .container small, ${SHEET} .lang-label, ${SHEET} .hw-print-kicker { font-size: 12pt !important; }
  ${SHEET} h1, ${SHEET} h2, ${SHEET} h3 { color: #000 !important; break-after: avoid; }
  ${SHEET} .section-title { font-size: 15pt !important; margin: 4mm 0 2mm !important; }
  ${SHEET} .practice-tier-title { font-size: 14pt !important; }

  /* Header: title, Name / Date on ruled lines */
  ${SHEET} .hw-print-head { display: block; margin: 0 0 5mm; padding-bottom: 3mm; border-bottom: 1.5pt solid #000; }
  ${SHEET} .hw-print-kicker { margin: 0 0 1mm; font-weight: 700; letter-spacing: .02em; }
  ${SHEET} .hw-print-title { margin: 0 0 4mm; font-size: 20pt !important; font-weight: 800; line-height: 1.2 !important; }
  ${SHEET} .hw-print-name { display: flex; gap: 10mm; margin: 0 0 3mm; align-items: flex-end; }
  ${SHEET} .hw-print-field { flex: 1 1 70%; display: flex; align-items: flex-end; gap: 2mm; font-weight: 700; white-space: nowrap; }
  ${SHEET} .hw-print-field-short { flex: 1 1 30%; }
  ${SHEET} .hw-print-field i { flex: 1; border-bottom: 1pt solid #000; height: 7mm; }
  ${SHEET} .hw-print-note { margin: 0; font-style: italic; }

  /* A panel is far taller than a page. Forcing it to stay whole pushed the
     problems to a new page and left the end of the Learn panel alone on one. */
  ${SHEET} .tab-panel-inner { break-inside: auto !important; page-break-inside: auto !important; }

  /* Interactive-only chrome never reaches paper */
  ${SHEET} .hw-hero, ${SHEET} .homework-tab-chrome, ${SHEET} .hw-rail, ${SHEET} .hw-listen-bar,
  ${SHEET} .btn-read-aloud, ${SHEET} .btn-listen-prob, ${SHEET} .hw-listen, ${SHEET} .bridge-listen,
  ${SHEET} .lang-selector-card, ${SHEET} .stars-to-win-bar, ${SHEET} .live-streak-banner,
  ${SHEET} .goal-reached-banner, ${SHEET} .scratchpad-inline-toggle, ${SHEET} .interactive-scratchpad,
  ${SHEET} .hw-stepper-bar, ${SHEET} .problem-hint-row, ${SHEET} .problem-coach-ladder,
  ${SHEET} .problem-check-row, ${SHEET} .problem-check-result, ${SHEET} .feedback,
  ${SHEET} .problem-feedback, ${SHEET} .solution-explanation, ${SHEET} .hw-answer-key,
  ${SHEET} .family-problem-tip, ${SHEET} .family-hint-box, ${SHEET} .tab-flow-nav,
  ${SHEET} .hw-draw-clear, ${SHEET} .drag-controls, ${SHEET} .mobile-cat-select,
  ${SHEET} .drag-handle, ${SHEET} .learn-jump-row, ${SHEET} .learn-extended-block,
  ${SHEET} .hw-huddle, ${SHEET} .tab-help-row, ${SHEET} .help-pop-btn, ${SHEET} .bridge-card,
  ${SHEET} details:not([open]):not(.hw-workspace-toggle), ${SHEET} .hw-quick-optional, ${SHEET} .more-practice:not([open]), ${SHEET} .hw-help-drawer,
  ${SHEET} .help-modal-overlay, ${SHEET} .bottom-status-bar, ${SHEET} .ls-launcher,
  ${SHEET} .ls-panel, ${SHEET} .mathpad, ${SHEET} .mathpad-fab, ${SHEET} .hw-stuck-fab,
  ${SHEET} .workbench-drawer, ${SHEET} .hw-tools-menu, ${SHEET} .parent-signoff-container,
  ${SHEET} .hw-session-banner, ${SHEET} .cga-card,
  ${SHEET} #hw_panel_check > p.bilingual-block:not(.quick-check-time),
  ${SHEET} [data-tab-panel="words"], ${SHEET} [data-tab-panel="play"],
  ${SHEET} [data-tab-panel="photobooth"],
  ${SHEET} #hw_panel_done > *:not(.print-only-certificate) { display: none !important; }

  /* Vocabulary buttons read as plain words on paper */
  ${SHEET} .obj-term { border: 0 !important; background: none !important; color: inherit !important;
    font: inherit !important; padding: 0 !important; text-decoration: underline; text-decoration-style: dotted; }

  /* Problems: keep each together, leave room to write */
  ${SHEET} .problem-section { break-inside: avoid; margin: 0 0 6mm !important; padding: 3mm 4mm !important;
    border: 1pt solid #777 !important; border-radius: 2mm !important; }
  ${SHEET} .problem-header-row { display: flex; gap: 3mm; align-items: center; break-after: avoid; }
  ${SHEET} .problem-number-badge { background: #fff !important; color: #000 !important;
    border: 1.5pt solid #000 !important; min-width: 8mm; text-align: center; }
  ${SHEET} .problem-type-badge, ${SHEET} .practice-tier-badge { background: #fff !important; color: #000 !important;
    border: 1pt solid #777 !important; font-size: 11pt !important; }
  ${SHEET} .problem-stem { font-weight: 700; break-after: avoid; }
  ${SHEET} .practice-tier { margin-bottom: 5mm; }
  ${SHEET} .practice-tier-head { padding: 2mm 3mm !important; border: 1pt solid #777; break-after: avoid; }
  ${SHEET} .mc-options { display: block !important; }
  ${SHEET} .mc-option-label { display: flex !important; align-items: center; gap: 3mm; margin: 0 0 2mm !important;
    padding: 1.5mm 3mm !important; background: #fff !important; border: 1pt solid #777 !important;
    border-radius: 2mm !important; min-height: 9mm; break-inside: avoid; }
  ${SHEET} .custom-radio { border: 1.5pt solid #000 !important; background: #fff !important; flex: none; }

  /* Answer fields become ruled lines */
  ${SHEET} input[type="text"], ${SHEET} input[type="number"], ${SHEET} input:not([type]),
  ${SHEET} .table-input, ${SHEET} .custom-input {
    border: 0 !important; border-bottom: 1pt solid #000 !important; border-radius: 0 !important;
    background: transparent !important; min-width: 30mm; height: 9mm; font-size: 12pt !important;
    color: #000 !important; box-shadow: none !important; }
  ${SHEET} select, ${SHEET} .matching-select { appearance: none; -webkit-appearance: none;
    border: 0 !important; border-bottom: 1pt solid #000 !important; border-radius: 0 !important;
    background: transparent !important; min-width: 40mm; height: 9mm; font-size: 12pt !important; color: #000 !important; }
  ${SHEET} textarea { appearance: none; -webkit-appearance: none; resize: none; overflow: visible;
    border: 0 !important; border-radius: 0 !important;
    min-height: 36mm; width: 100% !important; font-size: 12pt !important; line-height: 8mm !important;
    color: #000 !important; padding: 0 !important;
    background: repeating-linear-gradient(to bottom, transparent 0, transparent calc(8mm - 1pt), #777 calc(8mm - 1pt), #777 8mm) !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${SHEET} .fill-table { border-collapse: collapse; width: 100%; }
  ${SHEET} .fill-table th, ${SHEET} .fill-table td { border: 1pt solid #000 !important; padding: 2mm !important;
    background: #fff !important; color: #000 !important; }
  ${SHEET} .drag-card { border: 1pt solid #000 !important; background: #fff !important; display: inline-block; margin: 0 2mm 2mm 0; padding: 1mm 3mm; }
  ${SHEET} .drag-column { border: 1pt solid #000 !important; background: #fff !important; min-height: 28mm; }
  ${SHEET} .matching-row { break-inside: avoid; }

  /* Work space and models: keep the picture, drop the controls */
  ${SHEET} .hw-workspace-toggle { border: 0 !important; background: none !important; }
  ${SHEET} .hw-workspace-toggle > summary { list-style: none; font-weight: 700; font-size: 12pt !important;
    border: 0 !important; background: none !important; padding: 0 !important; margin: 0 0 1mm; }
  ${SHEET} textarea::placeholder, ${SHEET} input::placeholder { color: transparent !important; }
  ${SHEET} select:has(option:checked[value=""]) { color: transparent !important; }
  ${SHEET} .drag-source-header { display: none !important; }
  ${SHEET} .more-practice { border: 0 !important; padding: 0 !important; background: none !important; }
  ${SHEET} .more-practice > summary { list-style: none; font-weight: 700; font-size: 14pt !important;
    border: 0 !important; background: none !important; padding: 0 !important; }
  ${SHEET} .more-practice > summary::-webkit-details-marker { display: none; }
  ${SHEET} .hw-print-choices { display: block; list-style: upper-alpha; margin: 3mm 0 0; padding-left: 9mm; font-size: 12pt !important; }
  ${SHEET} .hw-print-choices li { margin: 0 0 1mm; }
  ${SHEET} .hw-workspace-toggle > summary::-webkit-details-marker { display: none; }
  ${SHEET} .hw-workspace { display: grid !important; grid-template-columns: 1fr 1fr; gap: 4mm; align-items: start; }
  ${SHEET} .hw-visual-frame { border: 1pt dashed #777 !important; background: #fff !important; min-height: 36mm; }
  ${SHEET} .hw-visual-frame svg, ${SHEET} .concept-svg, ${SHEET} .family-big-idea-visual svg { max-width: 100%; height: auto; }
  ${SHEET} .hw-work { margin: 0; }
  ${SHEET} .hw-work-label { font-weight: 700; font-size: 12pt !important; }
}
`;

/**
 * A matching row is a drop-down on screen and prints as one blank line, so paper
 * has no list of things to match to. Before printing, write the lettered
 * choices once under the pairs (students write the letter on each line); take
 * them away afterwards.
 */
export const PRINT_JS = `
window.addEventListener("beforeprint", function () {
  document.querySelectorAll(".matching-pairs").forEach(function (pairs) {
    var select = pairs.querySelector("select");
    if (!select || pairs.parentNode.querySelector(".hw-print-choices")) return;
    var texts = Array.prototype.filter.call(select.options, function (o) { return o.value; })
      .map(function (o) { return o.textContent.trim(); });
    if (!texts.length) return;
    var list = document.createElement("ol");
    list.className = "hw-print-choices";
    texts.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      list.appendChild(li);
    });
    pairs.insertAdjacentElement("afterend", list);
  });
});
window.addEventListener("afterprint", function () {
  document.querySelectorAll(".hw-print-choices").forEach(function (n) { n.remove(); });
});
`;
