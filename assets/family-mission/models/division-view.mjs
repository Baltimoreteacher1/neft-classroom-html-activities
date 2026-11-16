// Pictures for the "division" family: the long-division board (answer on top, dividend under the
// bar, then multiply / subtract / bring-down rows) and the equal groups of a fraction of a whole
// number. Every cell is plain text; shape, labels and underlines carry the meaning, not colour.
import { h, t } from "./core.mjs";
import { num } from "./division-math.mjs";
import { boardLabel, STR } from "./division-text.mjs";

const cell = (v, cls = "") => h("span", { class: `fm-div-cell${cls ? ` ${cls}` : ""}` }, v);
const blank = (cols) => Array.from({ length: cols }, () => ({ v: null, cls: "" }));

/** Writes `text` right-aligned so its last digit sits in column `end`. */
function place(cells, text, end, cls = "") {
  const start = end - text.length + 1;
  [...text].forEach((ch, i) => {
    if (cells[start + i]) cells[start + i] = { v: ch, cls };
  });
}

function row(pl, kind, cells, { gutter = false, minus = false } = {}) {
  const decimal = pl.mode === "decimal";
  const kids = [
    h("span", { class: `fm-div-gut${gutter ? "" : " is-ghost"}`, "aria-hidden": gutter ? null : "true" }, num(pl.B), minus ? h("span", { class: "fm-div-minus" }, "−") : null),
  ];
  cells.forEach((c, i) => {
    kids.push(cell(c.v, c.cls));
    if (decimal && i === pl.pointAfter) kids.push(h("span", { class: "fm-div-pt", "aria-hidden": "true" }, kind.point || null));
  });
  return h("div", { class: `fm-div-row is-${kind.name}` }, ...kids);
}

/** The long-division board for the steps taken so far. */
export function boardView(d, L) {
  const pl = d.plan;
  const first = pl.cycles[0].pos;
  const cur = d.next?.k ?? null;
  const rows = [];

  const q = blank(pl.cols);
  d.prog.forEach((n, k) => n >= 1 && place(q, String(pl.cycles[k].q), pl.cycles[k].pos, "is-digit"));
  if (pl.mode === "decimal" && d.prog[0] >= 1) {
    for (let c = Math.max(pl.pointAfter, 0); c < first; c++) q[c] = { v: "0", cls: "is-digit" };
  }
  rows.push(row(pl, { name: "quotient", point: d.point ? "." : null }, q));

  const top = blank(pl.cols);
  [...pl.digits].forEach((ch, c) => {
    top[c] = { v: ch, cls: cur === 0 && d.prog[0] === 0 && c <= first ? "is-work" : "" };
  });
  pl.cycles.forEach((cy, k) => {
    if (k > 0 && d.prog[k - 1] >= 4) top[cy.pos] = { v: pl.digits[cy.pos] ?? "0", cls: k === cur ? "is-work" : cy.pos >= pl.digits.length ? "is-added" : "" };
  });
  rows.push(row(pl, { name: "dividend", point: pl.mode === "decimal" ? "." : null }, top, { gutter: true }));

  pl.cycles.forEach((cy, k) => {
    const n = d.prog[k];
    if (n >= 2) {
      const p = blank(pl.cols);
      place(p, String(cy.product), cy.pos, "is-ruled");
      rows.push(row(pl, { name: "product" }, p, { minus: true }));
    }
    if (n >= 3) {
      const l = blank(pl.cols);
      place(l, String(cy.left), cy.pos);
      if (n >= 4) l[cy.pos + 1] = { v: String(cy.bring), cls: "is-brought" };
      rows.push(row(pl, { name: "left" }, l));
    }
  });
  return h("div", { class: "fm-div-board", role: "img", "aria-label": boardLabel(d, L) }, ...rows);
}

// ── Equal groups ─────────────────────────────────────────────────────────────

const dots = (n) => h("span", { class: "fm-div-dots", "aria-hidden": "true" }, ...Array.from({ length: n }, () => h("span", { class: "fm-div-dot" })));

/** All the objects in one pile, or (after splitting) one tappable card per equal group. */
export function groupsView(d, L, readonly) {
  const { whole, unit } = d.problem;
  const what = unit ? ` ${t(L, unit)}` : "";
  if (!d.split) {
    return h("div", { class: "fm-div-groups is-pile" }, h("div", { class: "fm-div-group is-pile" }, dots(whole), h("span", { class: "fm-div-cap" }, `${whole}${what} ${t(L, STR.pile)}`)));
  }
  const cards = Array.from({ length: d.groups }, (_, i) => {
    const on = d.taken.includes(i);
    const status = t(L, on ? STR.taken : STR.left);
    const name = `${t(L, { en: "Group", es: "Grupo" })} ${i + 1}`;
    const kids = [dots(d.each), h("span", { class: "fm-div-cap" }, `${name}: ${d.each}${what}`), h("span", { class: "fm-div-tag" }, status)];
    const cls = `fm-div-group${on ? " is-taken" : ""}`;
    if (readonly) return h("div", { class: cls }, ...kids);
    return h("button", { type: "button", class: `fm-btn ${cls}`, "aria-pressed": String(on), "aria-label": `${name}: ${d.each}${what}, ${status}`, "data-group": String(i) }, ...kids);
  });
  return h("div", { class: "fm-div-groups", role: "group", "aria-label": t(L, STR.groupsLabel) }, ...cards);
}
