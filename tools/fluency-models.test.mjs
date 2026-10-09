// Fluency Lab interactive models: the model shows the structure and the student enters the
// numbers. No answer (product, landing, total, unit value, …) may appear until the student types it.
// Decision: data/product-decisions.json "fluency-models-student-enters-the-math" (Joel, 2026-10-09).
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=h></div>");
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document }))
  Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
const m = await import("../math/fluency-lab/trail-pictures.js");
const h = document.querySelector("#h");
const type = (el, v) => {
  el.value = v;
  m.handleModelInput(el);
};
const tap = (sel) => m.handleModelTap(h.querySelector(sel));
const fails = [];
const ok = (c, msg) => c || fails.push(msg);
// area: 34 x 7 never shows 238 until typed
h.innerHTML = m.interactivePicture({ type: "array", a: 34, b: 7, split: 30 });
ok(!h.textContent.includes("238") && !h.textContent.includes("210"), "area leaks");
const ins = h.querySelectorAll(".tp-in");
type(ins[0], "210");
type(ins[1], "28");
type(ins[2], "238");
ok(
  [...ins].every((i) => i.classList.contains("ok")),
  "area boxes check",
);
// number line 364 + 107: landing hidden until typed
h.innerHTML = m.interactivePicture({ type: "numberline", start: 364, jumps: [100, 7] });
tap('[data-hop-size="100"]');
ok(!h.querySelector("svg").textContent.includes("464"), "line leaks landing");
ok(h.querySelector('[data-hop-size="1"]').disabled, "next jump locked until landing typed");
type(h.querySelector('[data-then="landing"]'), "464");
ok(
  h.querySelector("svg").textContent.includes("464") &&
    !h.querySelector('[data-hop-size="1"]').disabled,
  "landing confirmed unlocks",
);
// groups: 490 ÷ 5
h.innerHTML = m.interactivePicture({ type: "numberline", start: 0, jumps: [490], group: 5 });
ok(!/98/.test(h.textContent), "groups leak");
// ratio
h.innerHTML = m.interactivePicture({ type: "ratioTable", a: 3, b: 5, labels: ["A", "B"] });
tap('[data-scale="4"]');
ok(!h.querySelector("table").textContent.includes("20"), "ratio leaks");
const r = h.querySelectorAll('[data-then="ratio"]');
type(r[0], "12");
type(r[1], "20");
ok(h.querySelector("table").textContent.includes("20"), "ratio column saved");
// percent
h.innerHTML = m.interactivePicture({ type: "percentBar", whole: 24, percent: 75 });
ok(!/18/.test(h.textContent), "percent leaks");
type(h.querySelector('[data-then="percent"]'), "6");
ok(!h.querySelector("[data-cell-index]").disabled, "percent unlock");
// power
h.innerHTML = m.interactivePicture({ type: "power", base: 4, exponent: 3 });
ok(!/64/.test(h.textContent), "power leaks");
type(h.querySelector('[data-then="power"]'), "16");
ok(h.querySelectorAll('[data-then="power"]').length === 2, "power next row");
// lcm
h.innerHTML = m.interactivePicture({ type: "lists", a: 4, b: 6, find: "lcm" });
for (const v of ["4", "8", "12"]) type(h.querySelector('[data-multiple-of="4"]'), v);
for (const v of ["6", "12"]) type(h.querySelector('[data-multiple-of="6"]'), v);
ok(h.querySelector('[data-chip="12"].shared'), "lcm shared lights");
// gcf
h.innerHTML = m.interactivePicture({ type: "lists", a: 12, b: 18, find: "gcf" });
h.querySelector('[data-factor-of="12"]').value = "6";
tap('[data-add-factor="12"]');
h.querySelector('[data-factor-of="18"]').value = "6";
tap('[data-add-factor="18"]');
ok(h.querySelector('[data-chip="6"].shared'), "gcf shared");
h.querySelector('[data-factor-of="18"]').value = "5";
tap('[data-add-factor="18"]');
ok(/not a factor/.test(h.textContent), "gcf rejects non-factor");
// coins / perimeter / layers / square no totals
h.innerHTML = m.interactivePicture({ type: "coins", counts: [3, 1, 2, 1] });
tap("[data-coin]");
ok(
  !/¢:|cents|\b25\b.*\b25\b/.test(h.querySelector(".tp-readout").textContent) &&
    /Coins counted: 1/.test(h.textContent),
  "coins",
);
h.innerHTML = m.interactivePicture({ type: "layers", a: 3, b: 4, height: 5 });
ok(!/12|60/.test(h.textContent), "layers leak");
h.innerHTML = m.interactivePicture({ type: "square", square: 49 });
for (let i = 0; i < 6; i++) tap('[data-square-step="1"]');
ok(/Side: 7/.test(h.textContent) && !/= 49/.test(h.textContent), "square");
if (fails.length) {
  console.error(`Fluency models failed (${fails.length}):`);
  for (const fail of fails) console.error(`  - ${fail}`);
  process.exit(1);
}
console.log("fluency-models: no model shows an answer until the student enters it");
