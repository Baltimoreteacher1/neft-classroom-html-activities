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
