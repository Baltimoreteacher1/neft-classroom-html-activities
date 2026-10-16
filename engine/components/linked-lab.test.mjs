#!/usr/bin/env node
/* =============================================================================
 * linked-lab.test.mjs — the pictures must AGREE, not merely sit side by side.
 * -----------------------------------------------------------------------------
 * The point of linking a ratio table, a double number line, a tape, a bar and a
 * hundred grid is that they are one relationship. So these tests read the
 * numbers back out of the rendered DOM and compare them: column k of the table,
 * pair k of the line and the tape's groups must hold the same values, for every
 * scale, whichever picture the student changed. Model-less behaviour is pinned
 * separately in linked-compat.test.mjs.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
});

const { createLinkedModel, pairAt, percentOf, shadedSquares, columns } = await import(
  "./linked-model.js"
);
const { renderRatioTableBuilder } = await import("./ratio-table-builder.js");
const { renderTapeDiagram } = await import("./tape-diagram-lab.js");
const { renderPercentGridLab } = await import("./percent-grid-lab.js");
const { renderBarModel } = await import("./bar-model.js");
const { renderLinkedLab, judgeIdea } = await import("./linked-lab.js");

const ACCENT = "#1d4ed8";
const STEPS = 6;
const host = () => document.body.appendChild(document.createElement("div"));
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const num = (text) => Number(String(text).replace(/[^\d.]/g, ""));

/** Count how often the model announces a change. */
function listen(model) {
  const heard = [];
  model.subscribe((state, meta) => heard.push({ state, meta }));
  return heard;
}

function typeRatio(h, a, b) {
  h.querySelector('[data-inp="a"]').value = String(a);
  h.querySelector('[data-inp="b"]').value = String(b);
  click(h.querySelector(".rtlab-go"));
}

const ratioRows = (state) => [
  {
    label: "A",
    parts: Array.from({ length: state.k }, () => ({ value: state.a, label: String(state.a) })),
  },
  {
    label: "B",
    parts: Array.from({ length: state.k }, () => ({ value: state.b, label: String(state.b) })),
  },
];

// ── readers: what a student would see, taken out of the DOM ───────────────────
const tableColumns = (h) => {
  const [rowA, rowB] = [...h.querySelectorAll(".rtlab-table tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => num(td.textContent)),
  );
  return rowA.map((x, i) => ({ k: i + 1, x, y: rowB[i] }));
};
const activeTableColumn = (h) => {
  const cells = [...h.querySelectorAll("td.rtlab-active")].map((td) => num(td.textContent));
  return cells.length ? { x: cells[0], y: cells[1] } : null;
};
/** Tick pairs from the double number line: labels sharing an x are one pair. */
const lineTicks = (h) => {
  const byX = new Map();
  for (const t of h.querySelectorAll("svg.rtlab-dnl text[x][text-anchor='middle']")) {
    const x = t.getAttribute("x");
    if (!byX.has(x)) byX.set(x, []);
    byX.get(x).push({ value: num(t.textContent), fill: t.getAttribute("fill") });
  }
  return [...byX.values()].map(([top, bottom]) => ({
    x: top.value,
    y: bottom.value,
    active: top.fill === ACCENT,
  }));
};
const tapeState = (h) => {
  const [top, bottom] = [...h.querySelectorAll(".tdl-track")].map((track) =>
    [...track.querySelectorAll(".tdl-fill")].map((f) => num(f.textContent)),
  );
  return { groups: top.length, a: top[0], b: bottom[0], aSame: new Set(top).size === 1 };
};

// ── model ↔ table ↔ line ↔ tape ───────────────────────────────────────────────

test("a linked table waits for the student: no invented ratio, no default 2 : 3", () => {
  const model = createLinkedModel();
  const h = host();
  renderRatioTableBuilder(h, { model, a: 2, b: 3 });
  assert.equal(h.querySelector('[data-inp="a"]').value, "");
  assert.equal(h.querySelector('[data-inp="b"]').value, "");
  assert.equal(h.querySelector(".rtlab-table"), null);
  assert.ok(h.querySelector(".rtlab-wait"), "no invitation to type a ratio");
  click(h.querySelector(".rtlab-go")); // Build with nothing typed
  assert.equal(model.get().a, null, "an empty Build must not write a number");
  assert.equal(h.querySelector(".rtlab-table"), null);
});

test("what the student types is exactly what the model holds", () => {
  const model = createLinkedModel();
  const heard = listen(model);
  const h = host();
  renderRatioTableBuilder(h, { model, steps: STEPS });
  typeRatio(h, 4, 9);
  assert.deepEqual(
    { a: model.get().a, b: model.get().b },
    { a: 4, b: 9 },
    "the model must hold the typed pair",
  );
  assert.equal(heard.length, 1, "one Build is one announcement");
});

test("table column k == double number line pair k, for every column", () => {
  const model = createLinkedModel();
  const h = host();
  renderRatioTableBuilder(h, { model, steps: STEPS });
  typeRatio(h, 3, 5);
  const ticks = lineTicks(h);
  assert.equal(ticks.length, STEPS + 1, "line draws 0 through ×steps");
  assert.deepEqual(ticks[0], { x: 0, y: 0, active: false }, "both scales start at zero");
  for (const col of tableColumns(h)) {
    assert.deepEqual(
      { x: ticks[col.k].x, y: ticks[col.k].y },
      { x: col.x, y: col.y },
      `column ×${col.k} disagrees with pair ${col.k} on the line`,
    );
  }
  assert.deepEqual(tableColumns(h), columns(model.get(), STEPS));
});

test("picking a column moves every view to that scale: table, line, tape", () => {
  const model = createLinkedModel();
  const t = host();
  const p = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  typeRatio(t, 3, 5);
  renderTapeDiagram(p, { model, rows: ratioRows(model.get()) });
  assert.deepEqual(tapeState(p), { groups: 1, a: 3, b: 5, aSame: true });

  for (let k = 1; k <= STEPS; k += 1) {
    click(t.querySelector(`.rtlab-col[data-k="${k}"]`));
    const want = pairAt(model.get());
    assert.equal(model.get().k, k);
    assert.deepEqual(activeTableColumn(t), want, `table at ×${k}`);
    const active = lineTicks(t).filter((tick) => tick.active);
    assert.equal(active.length, 1, `exactly one pair is marked on the line at ×${k}`);
    assert.deepEqual({ x: active[0].x, y: active[0].y }, want, `line at ×${k}`);
    const tape = tapeState(p);
    assert.equal(tape.groups, k, `tape groups at ×${k}`);
    assert.deepEqual({ a: tape.a, b: tape.b }, { a: 3, b: 5 }, "each tape group is the base ratio");
    // k groups of (a : b) total the table's column: the same two numbers.
    assert.deepEqual({ x: tape.a * tape.groups, y: tape.b * tape.groups }, want);
    assert.equal(
      p.querySelector(".tdl-hint").textContent,
      `Read the bars: each group is 3 to 5, and there are ${k} group${k === 1 ? "" : "s"}.`,
    );
  }
});

test("adding a group on the tape moves the table and the line to that column", () => {
  const model = createLinkedModel();
  const t = host();
  const p = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  typeRatio(t, 2, 7);
  renderTapeDiagram(p, { model, rows: ratioRows(model.get()) });
  click(p.querySelector(".tdl-more"));
  click(p.querySelector(".tdl-more"));
  assert.equal(model.get().k, 3);
  assert.deepEqual(activeTableColumn(t), { x: 6, y: 21 });
  assert.deepEqual(lineTicks(t).find((tick) => tick.active), { x: 6, y: 21, active: true });
  click(p.querySelector(".tdl-fewer"));
  assert.equal(model.get().k, 2);
  assert.deepEqual(activeTableColumn(t), { x: 4, y: 14 });
});

test("changing the ratio in the table redraws the tape from the student's numbers", () => {
  const model = createLinkedModel();
  const t = host();
  const p = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  typeRatio(t, 3, 5);
  renderTapeDiagram(p, { model, rows: ratioRows(model.get()) });
  click(t.querySelector('.rtlab-col[data-k="2"]'));
  typeRatio(t, 4, 1);
  assert.deepEqual(tapeState(p), { groups: 2, a: 4, b: 1, aSame: true }, "tape kept k, took 4 : 1");
  assert.ok(p.querySelector(".tdl-explore-read").textContent.includes("2 groups of 4 : 1 → 8 : 2"));
});

test("a click on a column is one announcement, and nothing echoes back", () => {
  const model = createLinkedModel();
  const t = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  typeRatio(t, 3, 5);
  const p = host();
  renderTapeDiagram(p, { model, rows: ratioRows(model.get()) });
  const heard = listen(model);
  click(t.querySelector('.rtlab-col[data-k="4"]'));
  assert.equal(heard.length, 1);
  click(p.querySelector(".tdl-more"));
  assert.equal(heard.length, 2, "one tape click is one announcement");
  click(t.querySelector('.rtlab-col[data-k="2"]'));
  assert.equal(heard.length, 3, "a different column is one more announcement");
  click(t.querySelector('.rtlab-col[data-k="2"]'));
  assert.equal(heard.length, 3, "choosing the column already chosen announces nothing");
});

test("keyboard focus stays on the column header the student just chose", () => {
  const model = createLinkedModel();
  const t = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  typeRatio(t, 3, 5);
  const header = t.querySelector('.rtlab-col[data-k="3"]');
  header.focus();
  click(header);
  assert.equal(document.activeElement?.getAttribute("data-k"), "3");
  assert.equal(document.activeElement?.getAttribute("aria-pressed"), "true");
});

// ── grid and bar ──────────────────────────────────────────────────────────────

test("shading squares writes the student's n : (100 - n) and every view follows", () => {
  const model = createLinkedModel();
  const t = host();
  const g = host();
  renderRatioTableBuilder(t, { model, steps: STEPS });
  renderPercentGridLab(g, { model });
  for (const cell of [...g.querySelectorAll(".pgl-cell")].slice(0, 40)) click(cell);
  assert.deepEqual(model.get(), { a: 40, b: 60, k: 1, relation: "part-part" });
  assert.equal(t.querySelector('[data-inp="a"]').value, "40");
  assert.equal(t.querySelector('[data-inp="b"]').value, "60");
  assert.deepEqual(tableColumns(t)[0], { k: 1, x: 40, y: 60 });
  assert.equal(percentOf(model.get()), 40);
});

test("read as a part of a whole, the same shading is n : 100", () => {
  const model = createLinkedModel({ relation: "part-whole" });
  const g = host();
  renderPercentGridLab(g, { model });
  for (const cell of [...g.querySelectorAll(".pgl-cell")].slice(0, 25)) click(cell);
  assert.deepEqual(model.get(), { a: 25, b: 100, k: 1, relation: "part-whole" });
});

test("a ratio set elsewhere shades the grid, and clearing the grid clears the model", () => {
  const model = createLinkedModel();
  const g = host();
  renderPercentGridLab(g, { model });
  assert.equal(g.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 0, "starts blank");
  model.set({ a: 1, b: 4, relation: "part-whole" }, "table");
  assert.equal(g.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 25);
  assert.equal(g.querySelector(".pgl-read").textContent, "25 of 100 squares shaded");
  model.set({ a: 1, b: 7, relation: "part-part" }, "table");
  assert.equal(g.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 13);
  assert.match(g.querySelector(".pgl-read").textContent, /exactly 12\.5%/, "rounding is disclosed");
  click(g.querySelector('[data-el="reset"]'));
  assert.equal(model.get().a, null, "Reset on the grid forgets the ratio everywhere");
});

test("the grid, the bar and the model report one percent for any ratio and any scale", () => {
  for (const relation of ["part-part", "part-whole"]) {
    for (const [a, b] of [
      [2, 3],
      [3, 8],
      [1, 4],
      [7, 20],
    ]) {
      const model = createLinkedModel({ relation });
      const g = host();
      const b1 = host();
      renderPercentGridLab(g, { model });
      renderBarModel(b1, { model });
      model.set({ a, b }, "table");
      for (let k = 1; k <= 8; k += 1) {
        model.set({ k }, "tape");
        const state = model.get();
        assert.equal(
          g.querySelectorAll('.pgl-cell[aria-pressed="true"]').length,
          shadedSquares(state),
          `${relation} ${a}:${b} ×${k}: grid`,
        );
        const said = b1.querySelector('[role="status"]').textContent;
        assert.ok(said.includes(`${percentOf(state)}%`), `${relation} ${a}:${b} ×${k}: bar says "${said}"`);
      }
    }
  }
});

test("the bar draws the student's own pair at the chosen scale and prints no total", () => {
  const model = createLinkedModel();
  const b1 = host();
  // `whole` is what an authored ratio bar prints as a total; a linked bar ignores it.
  const handle = renderBarModel(b1, { model, whole: 99, labelA: "juice", labelB: "water" });
  assert.equal(b1.querySelectorAll(".bm-seg").length, 0, "empty until the student enters a ratio");
  assert.equal(typeof handle.destroy, "function");
  model.set({ a: 2, b: 3, k: 3 }, "table");
  const segs = [...b1.querySelectorAll(".bm-seg")];
  assert.deepEqual(
    segs.map((s) => s.textContent.trim()),
    ["juice: 6", "water: 9"],
  );
  assert.deepEqual(
    segs.map((s) => Number.parseFloat(s.style.flex)),
    [40, 60],
    "proportions are the base ratio at every scale",
  );
  assert.equal(b1.querySelector(".bm-total"), null, "a linked bar never prints a total");
  model.set({ relation: "part-whole" }, "lab");
  assert.deepEqual(
    [...b1.querySelectorAll(".bm-seg")].map((s) => s.textContent.trim()),
    ["juice: 6 of 9", "rest of the water"],
  );
  model.set({ a: 5, b: 4 }, "table");
  assert.equal(b1.querySelectorAll(".bm-seg").length, 1, "more than the whole has no remainder");
  handle.destroy();
  assert.equal(b1.querySelector(".card"), null);
});

// ── components a model must NOT reach ─────────────────────────────────────────

test("authored tape shapes with no ratio, and a bar's answer path, ignore a model", () => {
  const model = createLinkedModel({ a: 2, b: 3 });
  const before = model.get();
  const h = host();
  const row = (label, ...v) => ({ label, parts: v.map((x) => ({ value: x, label: String(x) })) });
  renderTapeDiagram(h, { model, rows: [row("total", 24), row("parts", 6, 6, 6, 6)] });
  h.querySelector(".tdl-input").value = "4";
  click(h.querySelector(".tdl-check"));
  assert.ok(h.querySelector(".tdl-input").disabled, "the whole/parts question still solves");
  const bar = host();
  const handle = renderBarModel(bar, {
    model,
    bars: [
      { label: "x", value: 3 },
      { label: "y", value: 4 },
    ],
    totalLabel: "T",
    questionText: "q?",
    answer: 7,
  });
  assert.equal(handle, undefined, "a lesson question is never linked");
  assert.deepEqual(model.get(), before, "neither one touched the model");
});

test("destroying a view releases its subscription — no listener outlives its picture", () => {
  const real = createLinkedModel();
  let live = 0;
  const counted = {
    ...real,
    subscribe(fn) {
      live += 1;
      const off = real.subscribe(fn);
      return () => {
        live -= 1;
        off();
      };
    },
  };
  const row = (label, v) => ({ label, parts: [{ value: v, label: String(v) }] });
  const handles = [
    renderRatioTableBuilder(host(), { model: counted }),
    renderPercentGridLab(host(), { model: counted }),
    renderBarModel(host(), { model: counted }),
  ];
  real.set({ a: 2, b: 3 });
  handles.push(
    renderTapeDiagram(host(), { model: counted, rows: [row("A", 2), row("B", 3)] }),
  );
  assert.ok(live >= 4, `expected four subscriptions, saw ${live}`);
  for (const handle of handles) handle.destroy();
  assert.equal(live, 0, "a destroyed view is still subscribed");
});

// ── the lab ───────────────────────────────────────────────────────────────────

const stays = (h) => h.querySelector("select[id$='-stays']");
const changes = (h) => h.querySelector("select[id$='-changes']");
const said = (h) => h.querySelector(".ll-said");

test("the lab opens empty: not one lesson number in any picture", () => {
  const h = host();
  const lab = renderLinkedLab(h, { mode: "ratio" });
  assert.equal(h.querySelector(".rtlab-table"), null);
  assert.equal(h.querySelectorAll(".tdl-track").length, 0);
  assert.equal(h.querySelectorAll(".bm-seg").length, 0);
  assert.equal(h.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 0);
  assert.equal(h.querySelector('[data-inp="a"]').value, "");
  lab.destroy();
  assert.equal(h.querySelector(".ll"), null);
});

test("one ratio typed in the lab shows up in all five pictures", () => {
  const h = host();
  renderLinkedLab(h, { mode: "ratio" });
  typeRatio(h, 2, 3);
  assert.deepEqual(tableColumns(h)[0], { k: 1, x: 2, y: 3 });
  assert.deepEqual(tapeState(h), { groups: 1, a: 2, b: 3, aSame: true });
  assert.deepEqual(
    [...h.querySelectorAll(".bm-seg")].map((s) => s.textContent.trim()),
    ["A: 2", "B: 3"],
  );
  assert.equal(h.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 40);

  click(h.querySelector('.rtlab-col[data-k="4"]'));
  assert.deepEqual(tapeState(h), { groups: 4, a: 2, b: 3, aSame: true });
  assert.deepEqual(lineTicks(h).find((tick) => tick.active), { x: 8, y: 12, active: true });
  assert.deepEqual(
    [...h.querySelectorAll(".bm-seg")].map((s) => s.textContent.trim()),
    ["A: 8", "B: 12"],
  );
  assert.equal(
    h.querySelectorAll('.pgl-cell[aria-pressed="true"]').length,
    40,
    "scaling never changes the share",
  );
});

test("reading A : B as a part of a whole reshades the grid and redraws the bar", () => {
  const h = host();
  renderLinkedLab(h, { mode: "ratio" });
  typeRatio(h, 1, 4);
  assert.equal(h.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 20, "two parts: 1/5");
  const whole = h.querySelector('input[value="part-whole"]');
  whole.checked = true;
  whole.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(h.querySelectorAll('.pgl-cell[aria-pressed="true"]').length, 25, "part of whole: 1/4");
  assert.deepEqual(
    [...h.querySelectorAll(".bm-seg")].map((s) => s.textContent.trim()),
    ["A: 1 of 4", "rest of the B"],
  );
});

test("percent mode starts as a part of a whole and shading the grid fills the table", () => {
  const h = host();
  renderLinkedLab(h, { mode: "percent" });
  assert.equal(h.querySelector('input[value="part-whole"]').checked, true);
  for (const cell of [...h.querySelectorAll(".pgl-cell")].slice(0, 30)) click(cell);
  assert.deepEqual(tableColumns(h)[0], { k: 1, x: 30, y: 100 });
  assert.deepEqual(tapeState(h), { groups: 1, a: 30, b: 100, aSame: true });
});

test("clearing the grid empties the tape instead of leaving a stale one", () => {
  const h = host();
  renderLinkedLab(h, { mode: "ratio" });
  typeRatio(h, 2, 3);
  assert.equal(h.querySelectorAll(".tdl-track").length, 2);
  click(h.querySelector('[data-el="reset"]'));
  assert.equal(h.querySelectorAll(".tdl-track").length, 0);
  assert.ok(h.querySelector(".ll-wait"));
  typeRatio(h, 5, 2);
  assert.deepEqual(tapeState(h), { groups: 1, a: 5, b: 2, aSame: true });
});

test("two labs on one page do not share a model or an id", () => {
  const h1 = host();
  const h2 = host();
  renderLinkedLab(h1, { mode: "ratio" });
  renderLinkedLab(h2, { mode: "ratio" });
  typeRatio(h1, 2, 3);
  assert.equal(h2.querySelector(".rtlab-table"), null);
  const ids = [...document.querySelectorAll(".ll [id]")].map((el) => el.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids");
});

test("What stays the same? What changes? — feedback reads the student's own ratio", () => {
  const empty = createLinkedModel().get();
  assert.match(judgeIdea("ratio", "scale", empty), /Type a ratio first/);
  const state = createLinkedModel({ a: 2, b: 3 }).get();
  assert.match(judgeIdea("", "scale", state), /Pick one thing/);
  assert.match(judgeIdea("ratio", "ratio", state), /Pick one thing/);
  for (const changing of ["amountA", "amountB", "scale"]) {
    assert.match(judgeIdea("ratio", changing, state), /still 2 : 3/);
  }
  for (const staying of ["amountA", "amountB", "scale"]) {
    const reply = judgeIdea(staying, "ratio", state);
    assert.match(reply, /Look again/);
    assert.ok(!/2 : 3/.test(reply), "a wrong guess must not be handed the answer");
  }
});

test("the check button answers in the page, in both languages", () => {
  const h = host();
  renderLinkedLab(h, { mode: "ratio" });
  typeRatio(h, 2, 3);
  stays(h).value = "ratio";
  changes(h).value = "amountB";
  click(h.querySelector(".ll-check"));
  assert.match(said(h).textContent, /still 2 : 3/);
  assert.match(said(h).textContent, /sigue siendo 2 : 3/);
  assert.equal(said(h).getAttribute("aria-live"), "polite");
});

test("every English line in the lab has a Spanish sibling", () => {
  const h = host();
  renderLinkedLab(h, { mode: "percent", labelA: "Part", labelB: "Whole" });
  const stacks = h.querySelectorAll(".i18n-stack");
  assert.ok(stacks.length >= 8, `only ${stacks.length} bilingual lines`);
  for (const stack of stacks) {
    assert.ok(stack.querySelector('.i18n-en[lang="en"]')?.textContent.trim(), "empty English");
    assert.ok(stack.querySelector('.i18n-es[lang="es"]')?.textContent.trim(), "empty Spanish");
  }
});

test("controls are native, labelled and big enough to tap", () => {
  const h = host();
  renderLinkedLab(h, { mode: "ratio" });
  typeRatio(h, 2, 3);
  for (const control of h.querySelectorAll("button, input, select")) {
    assert.ok(
      ["BUTTON", "INPUT", "SELECT"].includes(control.tagName),
      "controls are native elements, so keyboard and screen readers work",
    );
    const name =
      control.getAttribute("aria-label") ||
      control.textContent.trim() ||
      control.closest("label")?.textContent.trim() ||
      control.id;
    assert.ok(name, `unnamed control: ${control.outerHTML.slice(0, 80)}`);
  }
  const css = document.getElementById("linked-lab-styles").textContent;
  assert.match(css, /min-height:44px/);
  assert.match(document.getElementById("rtlab-styles").textContent, /\.rtlab-col\{min-width:44px;min-height:44px/);
});
