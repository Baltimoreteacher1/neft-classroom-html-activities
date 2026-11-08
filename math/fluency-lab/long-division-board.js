// The worked long-division bracket, drawn as a grid: divisor ) dividend, quotient on top, and one
// "multiply, subtract, bring down" block per quotient digit. Static (no inputs): the typed practice board
// is long-division-model.js. A model that is not `worked` draws only the empty bracket so practice never shows the answer.
import { longDivisionWork } from "./long-division-work.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const cell = (text, col, row, cls = "") =>
  `<span class="ldb-cell ${cls}" style="grid-column:${col};grid-row:${row}">${esc(text)}</span>`;

// One whole number per cell, spread over the columns of its digits, so each number is a single thing to tap and read.
const numberCell = (value, endCol, row, cls) => {
  const start = endCol - String(value).length + 1;
  return `<span class="ldb-cell ldb-num ${cls}" style="grid-column:${start} / ${endCol + 1};grid-row:${row}">${esc(value)}</span>`;
};

// `stage` (a lesson that reveals the work step by step): the quotient digit and product of cycle i appear at stage
// 1 + 2i, its difference and brought-down digit at 2 + 2i, the remainder label at the end. No stage shows everything.
export function longDivisionBoard(dividend, divisor, { worked = false, stage } = {}) {
  const work = longDivisionWork(dividend, divisor);
  const { digits, cycles, quotient, remainder } = work;
  const staged = Number.isFinite(stage);
  const shows = (needed) => !staged || stage >= needed;
  const showWork = worked || staged;
  const offset = 2; // column 1 holds the divisor, column 2 the bracket edge
  const col = (index) => index + offset + 1;
  const columns = digits.length + 1;
  const cells = [
    cell(divisor, 1, 2, "ldb-divisor"),
    numberCell(dividend, col(digits.length - 1), 2, "ldb-dividend ldb-first"),
  ];
  if (showWork) {
    cycles.forEach((cycle, i) => {
      const productRow = 3 + i * 2;
      if (shows(1 + 2 * i)) {
        cells.push(numberCell(cycle.product, col(cycle.index), productRow, "ldb-product"));
      }
      if (shows(2 + 2 * i)) {
        cells.push(
          numberCell(
            cycle.remainder,
            col(cycle.index),
            productRow + 1,
            `ldb-diff${i === cycles.length - 1 ? " ldb-final" : ""}`,
          ),
        );
        if (cycle.next !== null)
          cells.push(cell(cycle.next, col(cycle.index) + 1, productRow + 1, "ldb-bring"));
      }
    });
    const shown = cycles.filter((_, i) => shows(1 + 2 * i));
    if (shown.length)
      cells.push(
        numberCell(shown.map((c) => c.qDigit).join(""), col(shown.at(-1).index), 1, "ldb-quotient"),
      );
    if (remainder > 0 && shows(2 * cycles.length + 1))
      cells.push(cell(`R ${remainder}`, col(digits.length - 1) + 1, 1, "ldb-remainder"));
  }
  const rows = showWork ? 2 + cycles.length * 2 : 2;
  const label = showWork
    ? `Long division: ${dividend} divided by ${divisor}${staged ? "" : ` is ${quotient}${remainder ? ` remainder ${remainder}` : ""}`}`
    : `Long division bracket: ${divisor} outside, ${dividend} inside`;
  return `<div class="ldb-static ${showWork ? "is-worked" : ""}" role="img" aria-label="${esc(label)}"><div class="ldb-grid" style="grid-template-columns:auto 1.2ch repeat(${columns}, var(--ldb-w));grid-template-rows:repeat(${rows}, 1.5em)">${cells.join("")}</div></div>`;
}

// A staged model (a lesson) follows the lesson step it is drawn for; any other model is the empty bracket unless worked.
export const longDivisionPicture = (model, step) =>
  longDivisionBoard(model.dividend, model.divisor, {
    worked: Boolean(model.worked),
    stage: model.staged ? Number(step) || 0 : undefined,
  });
