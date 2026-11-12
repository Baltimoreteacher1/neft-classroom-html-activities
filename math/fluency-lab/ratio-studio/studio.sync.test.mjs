// Ratio Studio, driven through its own controls in a DOM: for every combination of starting quantities, scale
// factor, units and comparison, each representation the page draws (table, both double number lines, graph,
// counters, tape, comparison readout, rate) is read back and checked against arithmetic done HERE, independently
// of engine.js. Then every number-line tick and graph point is clicked and must rescale the whole page.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, { url: "https://eduwonderlab.com/math/fluency-lab/ratio-studio/" });
for (const k of ["window", "document", "location", "localStorage", "sessionStorage", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent", "Node"])
  globalThis[k] = dom.window[k];
await import("./studio.js");

const $ = (s) => document.querySelector(s);
const all = (s) => [...document.querySelectorAll(s)];
const val = (t) => {
  const s = String(t).trim();
  if (s.includes("/")) {
    const [n, d] = s.split("/").map(Number);
    return n / d;
  }
  return Number(s);
};
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const change = (id, v) => {
  const el = $(`#${id}`);
  el.value = v;
  el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
};
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const DEFAULT_FACTORS = [1, 2, 3, 4];

function check(a, b, f, sameUnit, label) {
  const ks = [...new Set([...DEFAULT_FACTORS, f])].sort((x, y) => x - y);
  const kmax = ks.at(-1);
  // 1. Ratio table: one row per factor, exact products, the current factor marked.
  const rows = all("#models table tbody tr");
  assert.equal(rows.length, ks.length, `${label}: table rows`);
  rows.forEach((tr, i) => {
    const [k, x, y] = [...tr.children].map((td) => td.textContent.replace("×", ""));
    assert.ok(near(val(k), ks[i]) && near(val(x), a * ks[i]) && near(val(y), b * ks[i]), `${label}: row ${i} = ${tr.textContent}`);
    assert.equal(tr.classList.contains("current"), near(ks[i], f), `${label}: row ${i} current mark`);
  });
  // 2. Double number lines: same ticks in the same places on both lines, placed to scale (k ÷ largest k).
  const lines = all("#models .line.scaled");
  assert.equal(lines.length, 2, `${label}: two number lines`);
  const ticks = lines.map((line) => [...line.querySelectorAll(".numberline-point")]);
  ks.forEach((k, i) => {
    for (const [j, q] of [[0, a], [1, b]]) {
      const t = ticks[j][i];
      assert.ok(near(val(t.textContent), q * k), `${label}: line ${j} tick ${i} reads ${t.textContent}`);
      assert.ok(near(Number.parseFloat(t.style.left), (100 * k) / kmax, 1e-3), `${label}: line ${j} tick ${i} at ${t.style.left}`);
      assert.equal(t.getAttribute("aria-pressed"), String(near(k, f)), `${label}: line ${j} tick ${i} pressed`);
    }
  });
  // 3. Graph: one scale for both axes; ticks are evenly spaced from 0, the last tick is the first at or above the
  //    largest plotted value, and every point sits at (a·k, b·k) on that scale.
  const largest = Math.max(a, b) * kmax;
  const graph = $('#models svg[aria-label^="Graph of paired quantities"]');
  const tickVals = [...graph.querySelectorAll('g[aria-hidden="true"] text')].filter((_, i) => i % 2 === 0).map((t) => val(t.textContent));
  assert.equal(tickVals[0], 0, `${label}: axis starts at 0`);
  const step = tickVals[1] - tickVals[0];
  tickVals.forEach((t, i) => assert.ok(near(t, i * step), `${label}: evenly spaced ticks ${tickVals}`));
  const top = tickVals.at(-1);
  assert.ok(top >= largest - 1e-9 && tickVals.at(-2) < largest + 1e-9 - (largest === top ? 0 : 0), `${label}: axis ends at the first tick ≥ ${largest} (${tickVals})`);
  assert.ok(tickVals.length <= 6, `${label}: at most five tick steps`);
  const circles = [...graph.querySelectorAll(".ratio-point circle")];
  assert.equal(circles.length, ks.length, `${label}: one point per row`);
  circles.forEach((c, i) => {
    assert.ok(near(Number(c.getAttribute("cx")), 70 + ((a * ks[i]) / top) * 150, 1e-6), `${label}: point ${i} x`);
    assert.ok(near(Number(c.getAttribute("cy")), 190 - ((b * ks[i]) / top) * 150, 1e-6), `${label}: point ${i} y`);
  });
  // 4. Counters and tape show the scaled pair.
  const counters = all("#models .counters");
  if (Number.isInteger(a * f) && a * f <= 24 && Number.isInteger(b * f) && b * f <= 24) {
    assert.equal(counters[0].children.length, a * f, `${label}: first counters`);
    assert.equal(counters[1].children.length, b * f, `${label}: second counters`);
  }
  const tapes = all("#models .tape");
  for (const [j, q] of [[0, a], [1, b]]) {
    const parts = [...tapes[j].children].map((s) => val(s.textContent));
    const total = Number.isInteger(q) && q <= 12 ? parts.length * f : parts[0];
    if (q > 0) assert.ok(near(total, q * f), `${label}: tape ${j} totals ${q * f}`);
  }
  // 5. Comparisons: part-to-total exists only when both quantities share a unit; each readout is exact.
  const buttons = all("#models [data-comparison]");
  assert.equal(buttons.length, sameUnit ? 4 : 2, `${label}: comparison choices`);
  for (const id of buttons.map((x) => x.dataset.comparison)) {
    click($(`#models [data-comparison="${id}"]`));
    const out = $("#comparison-output strong").textContent;
    const [l, r] = out.split("=")[1].split(":").map((t) => val(t));
    const want = { "part-to-part": [a * f, b * f], "reverse-part-to-part": [b * f, a * f], "first-to-whole": [a * f, (a + b) * f], "second-to-whole": [b * f, (a + b) * f] }[id];
    assert.ok(near(l, want[0]) && near(r, want[1]), `${label}: ${id} reads ${out}`);
  }
  click($('#models [data-comparison="part-to-part"]'));
  // 6. Rate: second per first, the same in every row.
  const rate = all("#models article").find((x) => /Rate and equation/.test(x.textContent)).querySelector("p").textContent;
  if (a > 0) assert.ok(near(val(rate.split(" ")[0]), b / a), `${label}: rate ${rate}`);
  else assert.match(rate, /No rate/);
}

const STARTS = ["0", "1", "2", "3", "6", "5/2", "0.75"];
const FACTORS = ["1", "2", "7", "5/2", "1/2"];
let states = 0;
for (const sameUnit of [true, false]) {
  change("unit-a", "counters");
  change("unit-b", sameUnit ? "counters" : "dollars");
  for (const as of STARTS)
    for (const bs of STARTS) {
      if (as === "0" && bs === "0") continue;
      change("amount-a", as);
      change("amount-b", bs);
      for (const fs of FACTORS) {
        change("factor", fs);
        assert.equal($("#error").textContent, "", `error for ${as}:${bs} ×${fs}`);
        check(val(as), val(bs), val(fs), sameUnit, `${as}:${bs} ×${fs} ${sameUnit ? "same" : "mixed"} units`);
        states += 1;
      }
    }
}
// 7. Every tick and every point is a control: selecting one rescales every representation to its factor.
change("unit-b", "counters");
change("amount-a", "2");
change("amount-b", "3");
change("factor", "7");
// A typed factor (×7) is shown as a transient row; once another factor is chosen it is gone, while the saved
// paired points stay.
assert.ok($('#models [data-ratio-control="graph"][data-ratio-factor="7"]'), "typed factor is drawn");
for (const control of ["numberline", "graph"]) {
  for (const k of DEFAULT_FACTORS.map(String)) {
    click($(`#models [data-ratio-control="${control}"][data-ratio-factor="${k}"]`));
    assert.equal($("#factor").value, k, `${control} ${k} sets the factor`);
    check(2, 3, val(k), true, `${control} ${k}`);
    assert.equal($('#models [data-ratio-factor="7"]'), null, "the transient ×7 row is gone");
    states += 1;
  }
}
console.log(`ratio studio: ${states} states, every representation recomputed independently`);
dom.window.close();
