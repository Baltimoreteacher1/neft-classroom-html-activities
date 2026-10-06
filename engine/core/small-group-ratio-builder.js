// Ratio-table builder — the student makes the table.
//
// Joel, 2026-10-06: students "should be able to create their own ratio tables
// as the problems continue (maybe blank tables after 1-2 practice that they put
// numbers into and they show the multiplication or division)."
//
// Learn It and Practice Together SHOW a finished table. From On My Own on, a
// problem whose figure is a ratio table gets this instead: the row labels and
// empty cells. The student types the ratio the problem gives, adds columns, and
// writes the × or ÷ on each arrow. The arrow under the table copies the one
// over it, because the move is the same for both quantities — that is the
// whole idea of an equivalent ratio.
//
// "Check my table" proves two things without knowing the student's route:
//   1. every step is consistent: the same × or ÷ takes EVERY row from one
//      column to the next, so every column is an equivalent ratio;
//   2. the table starts from the problem: each fully-given column of the
//      authored table appears as one of the student's columns.
// Any correct route passes (× 3 then × 4, or straight × 12; a unit-rate bridge).

import { numericValue } from "./small-group-build-figure-kit.js";
import { el, esc } from "./small-group-ui.js";

const MIN_COLS = 2;
const MAX_COLS = 5;

/** "3/4", "1 1/2", "0.6", "1,000", "$12" → number, or null. */
const num = (v) => numericValue(String(v ?? "").replace(/^\$/, ""));
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1e4) / 1e4));

/**
 * A figure the student can build: a ratio table whose authored cells are all
 * numbers or "?". A missing arrow (`null` in `scales`) separates two tables
 * drawn side by side — "Pack A | Pack B" comparisons — and each becomes its
 * own builder. Tables that leave cells blank on purpose stay drawn.
 */
export function canBuildRatioTable(fig) {
  if (fig?.kind !== "ratioTable" || !Array.isArray(fig.headers) || !Array.isArray(fig.rows))
    return false;
  return !fig.rows.some((r) => r.some((c) => c === null || c === ""));
}

/** Split a drawn table at its missing arrows: one { fig, name } per option. */
export function ratioTableSegments(fig) {
  const scales = Array.isArray(fig.scales) ? fig.scales : [];
  const parts = [[fig.rows[0]]];
  fig.rows.slice(1).forEach((col, i) => {
    if (scales.length && scales[i] === null) parts.push([col]);
    else parts.at(-1).push(col);
  });
  // "Pack A: first two columns. Pack B: last two." names the options.
  const names = String(fig.caption || "")
    .split(/\.\s*/)
    .map((sentence) => sentence.match(/^([^:]{1,30}):/)?.[1]?.trim())
    .filter(Boolean);
  return parts.map((rows, i) => ({
    fig: { ...fig, rows },
    name: parts.length > 1 ? names[i] || `Option ${i + 1}` : "",
  }));
}

/** The authored columns every student table must contain: the ones fully given. */
function givenColumns(fig) {
  return fig.rows
    .filter((col) => col.every((c) => String(c).trim() !== "?" && num(c) !== null))
    .map((col) => col.map((c) => num(c)));
}

export function checkRatioTable(fig, cols, ops) {
  const rows = fig.headers.length;
  const values = cols.map((col) => col.map((c) => num(c)));
  if (values.some((col) => col.some((v) => v === null)))
    return { ok: false, msg: "Fill every box with a number first." };
  const steps = [];
  for (let i = 0; i < values.length - 1; i++) {
    const op = ops[i] || {};
    const k = num(op.k);
    if (k === null || k === 0 || !op.sign)
      return { ok: false, msg: `Write × or ÷ and a number on arrow ${i + 1}.`, gap: i };
    for (let r = 0; r < rows; r++) {
      const want = op.sign === "×" ? values[i][r] * k : values[i][r] / k;
      if (!close(want, values[i + 1][r])) {
        const good = [];
        for (let q = 0; q < rows; q++) {
          const w = op.sign === "×" ? values[i][q] * k : values[i][q] / k;
          if (close(w, values[i + 1][q])) good.push(q);
        }
        const name = fig.headers[r];
        const msg = good.length
          ? `${op.sign} ${fmt(k)} works for ${fig.headers[good[0]]} (${fmt(values[i][good[0]])} → ${fmt(values[i + 1][good[0]])}) but not for ${name} (${fmt(values[i][r])} → ${fmt(values[i + 1][r])}). Do the same to both.`
          : `${fmt(values[i][r])} ${op.sign} ${fmt(k)} is ${fmt(want)}, not ${fmt(values[i + 1][r])} (${name}).`;
        return { ok: false, msg, gap: i };
      }
    }
    steps.push(`${op.sign} ${fmt(k)}`);
  }
  for (const given of givenColumns(fig)) {
    if (!values.some((col) => col.every((v, r) => close(v, given[r])))) {
      const fact = fig.headers.map((h, r) => `${h} ${fmt(given[r])}`).join(" | ");
      return {
        ok: false,
        msg: `Your steps work. Now put the problem's fact in one column: ${fact}.`,
      };
    }
  }
  return {
    ok: true,
    msg: `✓ Your table works. Every column is an equivalent ratio (${steps.join(", then ")}).`,
  };
}

/**
 * One editable table: the rows the authored figure labels, the student's
 * columns and arrows. Saves to `store` under `key` so a reload restores it.
 */
function oneTableBuilder(fig, { key, store, onResult, name = "" } = {}) {
  const wrap = el("div", "sgr-one");
  if (name) wrap.appendChild(el("p", "sgr-name", esc(name)));
  const saved = store?.get(key) || null;
  let cols = saved?.cols || [];
  let ops = saved?.ops || [];
  const start = Math.min(MAX_COLS, Math.max(MIN_COLS, cols.length || fig.rows.length));
  while (cols.length < start) cols.push(fig.headers.map(() => ""));
  while (ops.length < cols.length - 1) ops.push({ sign: "×", k: "" });

  const grid = el("div", "sgr-grid");
  const feedback = el("p", "sgr-fb");
  feedback.setAttribute("aria-live", "polite");
  const save = () => store?.set(key, { cols, ops });

  const opControl = (i, mirror) => {
    const box = el("div", `sgr-op${mirror ? " sgr-op-mirror" : ""}`);
    if (mirror) {
      box.innerHTML = `<svg class="sgr-arc" viewBox="0 0 100 22" width="100" height="22" aria-hidden="true"><path d="M6,2 Q50,28 94,2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M94,2 l-11,3 l5,8 z" fill="currentColor"/></svg><span class="sgr-mirror">${esc(ops[i].sign)} ${esc(ops[i].k || "?")}</span>`;
      return box;
    }
    const sign = el("select", "sgr-sign");
    sign.setAttribute("aria-label", `Arrow ${i + 1}: multiply or divide`);
    for (const s of ["×", "÷"]) {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      sign.appendChild(o);
    }
    sign.value = ops[i].sign;
    const k = el("input", "sgr-k");
    k.type = "text";
    k.inputMode = "decimal";
    k.autocomplete = "off";
    k.value = ops[i].k;
    k.setAttribute("aria-label", `Arrow ${i + 1}: by how much`);
    const sync = () => {
      ops[i] = { sign: sign.value, k: k.value.trim() };
      save();
      const m = grid.querySelector(`[data-mirror="${i}"] .sgr-mirror`);
      if (m) m.textContent = `${ops[i].sign} ${ops[i].k || "?"}`;
    };
    sign.addEventListener("change", sync);
    k.addEventListener("input", sync);
    const controls = el("div", "sgr-op-controls");
    controls.append(sign, k);
    box.append(controls);
    box.insertAdjacentHTML(
      "beforeend",
      `<svg class="sgr-arc" viewBox="0 0 100 22" width="100" height="22" aria-hidden="true"><path d="M6,20 Q50,-6 94,20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M94,20 l-11,-3 l5,-8 z" fill="currentColor"/></svg>`,
    );
    return box;
  };

  const render = () => {
    grid.innerHTML = "";
    grid.style.setProperty("--sgr-cols", String(cols.length));
    // Row 0: arrows over the gaps between columns.
    grid.appendChild(el("div", "sgr-corner"));
    cols.forEach((_, c) => {
      const slot = el("div", "sgr-gap-slot");
      if (c < cols.length - 1) slot.appendChild(opControl(c, false));
      grid.appendChild(slot);
    });
    // One row per quantity.
    fig.headers.forEach((h, r) => {
      grid.appendChild(el("div", "sgr-head", esc(h)));
      cols.forEach((col, c) => {
        const cell = el("input", "sgr-cell");
        cell.type = "text";
        cell.inputMode = "decimal";
        cell.autocomplete = "off";
        cell.value = col[r];
        cell.setAttribute("aria-label", `${h}, column ${c + 1}`);
        cell.addEventListener("input", () => {
          cols[c][r] = cell.value.trim();
          save();
        });
        grid.appendChild(cell);
      });
    });
    // Last row: the same arrows, mirrored — "do the same to both".
    grid.appendChild(el("div", "sgr-corner"));
    cols.forEach((_, c) => {
      const slot = el("div", "sgr-gap-slot");
      if (c < cols.length - 1) {
        const m = opControl(c, true);
        slot.dataset.mirror = String(c);
        slot.appendChild(m);
      }
      grid.appendChild(slot);
    });
    add.disabled = cols.length >= MAX_COLS;
    remove.disabled = cols.length <= MIN_COLS;
  };

  const row = el("div", "sgr-actions");
  const add = el("button", "btn ghost sgr-add", "+ Add a column");
  add.type = "button";
  add.addEventListener("click", () => {
    if (cols.length >= MAX_COLS) return;
    cols.push(fig.headers.map(() => ""));
    ops.push({ sign: "×", k: "" });
    save();
    render();
  });
  const remove = el("button", "btn ghost sgr-remove", "− Remove a column");
  remove.type = "button";
  remove.addEventListener("click", () => {
    if (cols.length <= MIN_COLS) return;
    cols.pop();
    ops.pop();
    save();
    render();
  });
  const check = el("button", "btn sgr-check", "Check my table");
  check.type = "button";
  check.addEventListener("click", () => {
    const result = checkRatioTable(fig, cols, ops);
    feedback.className = `sgr-fb ${result.ok ? "is-right" : "is-wrong"}`;
    feedback.textContent = result.msg;
    wrap.classList.toggle("is-ok", result.ok);
    store?.set(`${key}-ok`, result.ok);
    onResult?.(result.ok);
  });
  row.append(check, add, remove);
  render();
  wrap.append(grid, row, feedback);
  if (store?.get(`${key}-ok`)) {
    wrap.classList.add("is-ok");
    queueMicrotask(() => onResult?.(true));
    feedback.className = "sgr-fb is-right";
    feedback.textContent = "✓ Your table works.";
  }
  return wrap;
}

export const RATIO_BUILDER_CSS = `
.sgr{margin:0 0 14px;padding:14px 16px;border:2px dashed var(--sg-line);border-radius:var(--sg-radius);background:#fff}
.sgr.is-right{border-style:solid;border-color:var(--sg-good)}
.sgr-one + .sgr-one{margin-top:18px;padding-top:14px;border-top:1px solid var(--sg-line)}
.sgr-name{margin:0 0 4px;font-weight:700;font-size:17px;color:var(--sg-deep)}
.sgr-lead{margin:0 0 10px;font-size:17px}
.sgr-grid{display:inline-grid;grid-template-columns:max-content repeat(var(--sgr-cols),104px);align-items:stretch;max-width:100%;overflow-x:auto;padding:0 40px 0 0}
.sgr-head{display:flex;align-items:center;justify-content:flex-start;padding:8px 14px;font-weight:700;font-size:16px;text-align:center;background:var(--sg-soft);border:1.5px solid var(--sg-text,#1d2a36)}
.sgr-cell{min-height:48px;width:100%;box-sizing:border-box;text-align:center;font-size:19px;font-weight:600;border:1.5px solid var(--sg-text,#1d2a36);border-left-width:0;padding:4px}
.sgr-cell:focus{outline:3px solid var(--sg);outline-offset:-3px}
.sgr-gap-slot{position:relative;min-height:64px}
.sgr-op{position:absolute;left:100%;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;z-index:1;white-space:nowrap;color:var(--sg)}
.sgr-op-mirror{top:0;bottom:auto}
.sgr-op-controls{display:flex;gap:4px}
.sgr-arc{display:block;flex:0 0 auto;width:100px;height:22px;color:var(--sg)}
.sgr-sign{min-height:36px;font-size:18px;font-weight:700;border:2px solid var(--sg);border-radius:8px;background:#fff;color:var(--sg-deep)}
.sgr-k{width:50px;min-height:36px;font-size:18px;font-weight:700;text-align:center;border:2px solid var(--sg);border-radius:8px}
.sgr-mirror{color:var(--sg-deep);font-weight:700;font-size:17px}
.sgr-actions{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 0}
.sgr-fb{margin:10px 0 0;font-weight:700;font-size:17px;min-height:1em}
.sgr-fb.is-right{color:var(--sg-good-ink)}
.sgr-fb.is-wrong{color:var(--sg-bad-ink)}
@media print{.sgr-actions{display:none!important}}
`;

/**
 * The editable table(s) for one problem. `fig` is the authored ratio-table
 * figure; its headers label the rows and its numbers are only used to check.
 * A comparison figure becomes one table per option. Saves under `key`.
 */
export function ratioTableBuilder(fig, { key, store } = {}) {
  const wrap = el("div", "sgr");
  const segments = ratioTableSegments(fig);
  wrap.appendChild(
    el(
      "p",
      "sgr-lead",
      segments.length > 1
        ? "✏️ <b>Build a ratio table for each option.</b> Put in the numbers from the problem. Show × or ÷ on each arrow."
        : "✏️ <b>Build your ratio table.</b> Put in the numbers from the problem. Show × or ÷ on each arrow.",
    ),
  );
  const done = new Set();
  segments.forEach((seg, i) =>
    wrap.appendChild(
      oneTableBuilder(seg.fig, {
        key: segments.length > 1 ? `${key}-${i}` : key,
        store,
        name: seg.name,
        onResult: (ok) => {
          if (ok) done.add(i);
          else done.delete(i);
          wrap.classList.toggle("is-right", done.size === segments.length);
        },
      }),
    ),
  );
  return wrap;
}
