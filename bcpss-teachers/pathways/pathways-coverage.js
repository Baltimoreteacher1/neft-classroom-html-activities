// Standards coverage section for the Year map (string renderer). Data: data/bcpss-standards-coverage.json, written by
// tools/content/standards-coverage-report.mjs from the seed and the repo's CCSS-M list. Math only: no code list exists
// for the other subjects, so none is shown or invented. "Listed" is not "taught well": it only says a unit names the code.
import { esc } from "./pathways-util.js";

const unitNo = (id) => (String(id).match(/-u(\d+)$/) || [])[1] || id;

const codeRow = (r, withUnits) =>
  `<li><code>${esc(r.code)}</code>${r.mccrs2025 ? ` <span class="pw-muted">(MD 2025: ${esc(r.mccrs2025)})</span>` : ""}${
    withUnits && r.units.length ? ` <span class="pw-muted">Unit ${esc(r.units.map(unitNo).join(", "))}</span>` : ""
  }</li>`;

/** HTML for one grade, or "" when the report has no such grade. */
export function renderCoverage(report, grade) {
  const g = report?.grades?.find((x) => x.grade === grade);
  if (!g) return "";
  return `<section class="pw-coverage" aria-labelledby="pwCovH" data-coverage-grade="${esc(g.grade)}">
    <h3 id="pwCovH">Standards coverage (Math, CCSS)</h3>
    <p class="pw-small"><strong>${g.in_studio_count} of ${g.reference_count}</strong> Grade ${esc(g.grade)} math standards are listed by a Studio unit; <strong>${g.not_in_studio_count}</strong> are not. Listing a standard does not mean it is fully taught. Draft: the unit assignments have not been reviewed.</p>
    <details><summary>In the Studio (${g.in_studio_count})</summary><ul class="pw-codes">${g.in_studio.map((r) => codeRow(r, true)).join("")}</ul></details>
    <details><summary>Not in the Studio (${g.not_in_studio_count})</summary><ul class="pw-codes">${g.not_in_studio.map((r) => codeRow(r, false)).join("")}</ul></details>
  </section>`;
}
