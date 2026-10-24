// Studio widget platform (assets/studio/focus.js, the "studio v4 platform" block in clarity.css, StudioAct.coach):
// what can be proved without a browser. The layout itself (FABs, Check reach, label sizes) is driven by
// tools/verify-studio-layout-browser.mjs.
//   node tools/studio-platform.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

/** A window with the studio's shared kit, the figure kit, the item kinds and the platform layer. */
function makeWindow() {
  const dom = new JSDOM(
    `<!doctype html><html><body><main class="main-container"><section class="tab-panel active"><div class="stage-card" id="stage-1"><div class="item-head"><span class="item-tools"></span></div><div class="item-body"></div></div></section></main></body></html>`,
    {
      runScripts: "outside-only",
      pretendToBeVisual: true,
      url: "https://eduwonderlab.com/math/practice-studio/3-3/",
    },
  );
  const w = dom.window;
  w.matchMedia = () => ({ matches: false });
  // jsdom has no modal dialog: the smallest stand-in that keeps open/close/Escape semantics the platform relies on
  w.HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
    w.document.body.dataset.modal = "1";
  };
  w.HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    delete w.document.body.dataset.modal;
    this.dispatchEvent(new w.Event("close"));
  };
  for (const f of [
    "assets/studio-gen/core.js",
    "assets/studio-act/core.js",
    "assets/studio-viz.js",
    "assets/studio-viz-geo.js",
    "assets/studio-viz-model.js",
    "assets/studio/kinds-basic.js",
    "assets/studio/focus.js",
  ])
    w.eval(read(f));
  return w;
}

/** Mount one item of a kind into the stage the way runtime.js does (host = .item-body, the head's tools beside it). */
function mount(w, it, kind = it.k) {
  const host = w.document.querySelector(".item-body");
  host.innerHTML = "";
  const calls = { solve: 0, miss: 0, saved: 0 };
  const ctx = {
    it,
    tab: 1,
    host,
    state: {
      notes: {},
      cells: {},
      picks: {},
      hints: {},
      acts: {},
      rubric: {},
      sorts: {},
      ticks: {},
      lines: {},
      matches: {},
    },
    solved: false,
    es: () => false,
    save: () => calls.saved++,
    say: () => {},
    fb: () => {},
    misses: () => 0,
    hintBlock: () => "",
    openHint: () => {},
    showSolved: () => {},
    solve: () => calls.solve++,
    miss: () => calls.miss++,
  };
  w.StudioRT.kinds[kind].mount(ctx);
  return { ctx, host, calls };
}
const input = (w, el, value) => {
  el.value = value;
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};

/* ---- StudioAct.coach: a kind registers up to three bilingual steps ---------------------------------------------------- */
{
  const w = makeWindow();
  const A = w.StudioAct;
  assert.equal(
    A.coachSteps("nothing"),
    null,
    "a kind that registers nothing has no steps of its own",
  );
  A.coach("demo", [{ icon: "👀", en: "Look.", es: "Mira." }]);
  assert.equal(
    JSON.stringify(A.coachSteps("demo")),
    JSON.stringify([{ icon: "👀", en: "Look.", es: "Mira." }]),
  );
  const bad = [
    [],
    [
      { icon: "1", en: "a", es: "a" },
      { icon: "2", en: "b", es: "b" },
      { icon: "3", en: "c", es: "c" },
      { icon: "4", en: "d", es: "d" },
    ],
    [{ icon: "👀", en: "No Spanish." }],
    [{ en: "No icon.", es: "Sin icono." }],
    "not a list",
  ];
  for (const steps of bad)
    assert.throws(() => A.coach("bad", steps), /StudioAct: coach/, JSON.stringify(steps));
}

/* ---- wrapLabel: a long caption becomes short lines, in order, no word cut ---------------------------------------------- */
{
  const w = makeWindow();
  const { wrapLabel } = w.StudioFocus;
  const text = "Each full strip = 1 unit, divided into 4 equal parts";
  for (const room of [120, 200, 300]) {
    const lines = wrapLabel(text, 6, room);
    assert.equal(lines.join(" "), text, "the words come back in order, none lost or cut");
    for (const l of lines)
      assert.ok(l.split(" ").length === 1 || l.length * 6 <= room, `"${l}" fits ${room}`);
  }
  assert.equal(
    JSON.stringify(wrapLabel("Quotient", 6, 10)),
    '["Quotient"]',
    "one long word stays one line",
  );
  assert.equal(
    JSON.stringify(wrapLabel("short one", 6, 400)),
    '["short one"]',
    "a caption that fits is not split",
  );
}

/* ---- the blank cell takes the answer; the "?" box stays as the fallback ----------------------------------------------- */
{
  const w = makeWindow();
  const item = {
    k: "num",
    id: "t3",
    q: "What real length matches a 35 cm photo?",
    a: "14",
    viz: {
      t: "table",
      hd: ["Real (cm)", "Photo (cm)"],
      rows: [
        ["2", "5"],
        ["4", "10"],
        ["6", "15"],
        ["", "35"],
      ],
      blank: [[3, 0]],
    },
  };
  const { host, calls } = mount(w, item);
  w.StudioFocus.decorate();
  const wrap = host.querySelector('.viz-host[data-viz="table"]');
  assert.ok(wrap, "the figure host names its figure type");
  const main = host.querySelector("input.num-input:not(.viz-cell)");
  const cell = wrap.querySelector("input.viz-cell");
  assert.ok(main && cell, "the table's blank cell is an input and the ? box is still there");
  assert.match(cell.getAttribute("aria-label"), /empty box/i, "the cell has an accessible name");
  assert.equal(wrap.querySelectorAll("input.viz-cell").length, 1, "one blank, one input");
  w.StudioFocus.decorate();
  assert.equal(wrap.querySelectorAll("input.viz-cell").length, 1, "decorating again adds nothing");

  input(w, cell, "9");
  assert.equal(main.value, "9", "typing in the cell fills the ? box");
  input(w, main, "11");
  assert.equal(cell.value, "11", "typing in the ? box fills the cell");
  input(w, cell, "14");
  cell.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(
    calls.solve,
    1,
    "Enter in the cell checks the answer exactly as Enter in the ? box does",
  );
  input(w, wrap.querySelector("input.viz-cell") || cell, "14");
  assert.equal(calls.miss, 0, "a right answer typed in the cell is not a miss");
}
{
  const w = makeWindow();
  const wrong = {
    k: "num",
    id: "t4",
    q: "q",
    a: "9",
    viz: {
      t: "table",
      hd: ["a", "b"],
      rows: [
        ["1", "2"],
        ["2", "4"],
      ],
      blank: [[1, 0]],
    },
  };
  const { host, calls } = mount(w, wrong);
  w.StudioFocus.decorate();
  const cell = host.querySelector("input.viz-cell");
  input(w, cell, "5");
  cell.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(calls.miss, 1, "a wrong answer typed in the cell is graded as a miss, not skipped");
  assert.equal(calls.solve, 0);
}
for (const [name, viz] of [
  [
    "no blank",
    {
      t: "table",
      hd: ["a", "b"],
      rows: [
        ["1", "2"],
        ["2", "4"],
      ],
    },
  ],
  [
    "two blanks",
    {
      t: "table",
      hd: ["a", "b"],
      rows: [
        ["1", "2"],
        ["", ""],
      ],
      blank: [
        [1, 0],
        [1, 1],
      ],
    },
  ],
]) {
  const w = makeWindow();
  const { host } = mount(w, { k: "num", id: "t5", q: "q", a: "1", viz });
  w.StudioFocus.decorate();
  assert.equal(
    host.querySelectorAll("input.viz-cell").length,
    0,
    `${name}: nothing to type into the figure`,
  );
}

/* ---- scale arrows: opt-in, between the rows, never filled in ----------------------------------------------------------- */
{
  const w = makeWindow();
  const { host } = mount(w, {
    k: "mc",
    id: "t6",
    q: "Is the table equivalent?",
    c: ["yes", "no", "maybe"],
    a: 0,
    viz: {
      t: "table",
      hd: ["Clues", "Prints"],
      rows: [
        ["2", "3"],
        ["4", "6"],
        ["6", "9"],
        ["8", "11"],
      ],
    },
  });
  w.StudioFocus.decorate();
  const pills = [...host.querySelectorAll(".viz-host .scale-pill")];
  const toggle =
    host.parentElement.querySelector(".viz-tools button") ||
    host.querySelector(".viz-tools button");
  assert.ok(toggle, "a table figure offers the scale arrows");
  assert.equal(pills.length, 3, "one arrow box between each pair of rows (4 rows, 3 gaps)");
  assert.ok(
    pills.every((p) => p.hidden),
    "off until the student asks",
  );
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  toggle.click();
  assert.ok(
    pills.every((p) => !p.hidden),
    "on after the toggle",
  );
  assert.ok(
    pills.every((p) => p.querySelector("input").value === ""),
    "never auto-filled",
  );
  assert.match(pills[0].querySelector("input").getAttribute("aria-label"), /row 1 to row 2/);
  toggle.click();
  assert.ok(
    pills.every((p) => p.hidden),
    "off again",
  );
}

/* ---- Full screen: the item's own node moves into a dialog and comes back ---------------------------------------------- */
{
  const w = makeWindow();
  const body = w.document.querySelector(".item-body");
  body.innerHTML = `<p class="item-q">Q</p><div class="answer-zone"><div class="act-host" data-act="sizer"><div class="sz"><div class="sz-bar"><button type="button">Check</button></div></div></div></div><div class="item-fb"></div>`;
  const marker = body.querySelector(".act-host");
  marker.expando = "same instance";
  w.StudioFocus.decorate();
  const open = w.document.querySelector(".focus-open-btn");
  assert.ok(open, "an item with a widget gets a Full screen button in its tools");
  assert.equal(w.document.querySelectorAll(".focus-open-btn").length, 1);
  w.StudioFocus.decorate();
  assert.equal(
    w.document.querySelectorAll(".focus-open-btn").length,
    1,
    "decorating again adds no second button",
  );
  assert.ok(
    marker.querySelector(".sz-bar").classList.contains("check-bar"),
    "the row holding Check is marked so CSS keeps it on screen",
  );

  open.click();
  const dlg = w.document.querySelector("dialog.focus-sheet");
  assert.ok(dlg?.hasAttribute("open"), "the sheet is a dialog and it is open");
  assert.equal(
    dlg.querySelector(".act-host"),
    marker,
    "the same widget node is inside the sheet (not re-mounted)",
  );
  assert.equal(dlg.querySelector(".act-host").expando, "same instance");
  assert.ok(w.document.querySelector(".focus-hole"), "the stage says where the activity went");
  assert.ok(w.StudioFocus.isOpen());
  assert.match(dlg.getAttribute("aria-labelledby"), /focus-title/);

  dlg.querySelector("[data-focus-done]").click();
  assert.ok(!w.document.querySelector("dialog.focus-sheet"), "Done closes and removes the sheet");
  assert.ok(!w.document.querySelector(".focus-hole"), "the placeholder is gone");
  assert.equal(
    w.document.querySelector(".item-body .act-host"),
    marker,
    "the node is back where it was",
  );
  assert.equal(w.document.activeElement, open, "focus returns to the Full screen button");
  assert.ok(!w.StudioFocus.isOpen());
}

/* ---- dead tab stops --------------------------------------------------------------------------------------------------------- */
{
  const w = makeWindow();
  w.document.querySelector(".item-body").innerHTML =
    `<input id="a" readonly value="6"><input id="b" value="1">`;
  w.StudioFocus.decorate();
  const a = w.document.getElementById("a");
  const b = w.document.getElementById("b");
  assert.equal(a.getAttribute("tabindex"), "-1", "a read-only box is not a tab stop");
  assert.equal(b.getAttribute("tabindex"), null, "an editable box is untouched");
  a.removeAttribute("readonly");
  w.StudioFocus.decorate();
  assert.equal(a.getAttribute("tabindex"), null, "a box that becomes editable is a tab stop again");
}

/* ---- the first-touch coach: three skippable steps, once per device ---------------------------------------------------------- */
{
  const w = makeWindow();
  const store = {};
  w.EWLComfort = { get: (k) => store[k], set: (k, v) => (store[k] = v) };
  w.document.querySelector(".item-body").innerHTML =
    `<div class="answer-zone"><div class="act-host" data-act="sizer"><button type="button">Go</button></div></div>`;
  w.StudioAct.coach("sizer", [
    { icon: "📏", en: "Slide the handle.", es: "Mueve el control." },
    { icon: "🔢", en: "Read the number.", es: "Lee el número." },
  ]);
  w.StudioFocus.decorate();
  const card = w.document.querySelector(".coach");
  assert.ok(card, "the first time a kind mounts, the coach appears");
  assert.match(card.textContent, /Slide the handle/);
  assert.match(card.textContent, /Step 1 of 2/);
  card.querySelector("[data-coach-next]").click();
  assert.match(w.document.querySelector(".coach").textContent, /Read the number/);
  w.document.querySelector(".coach [data-coach-next]").click();
  assert.ok(!w.document.querySelector(".coach"), "the last step ends the coach");
  assert.equal(
    JSON.stringify(store.coached),
    '{"sizer":1}',
    "what was shown is remembered with the comfort settings",
  );
  w.document.querySelector(".act-host").removeAttribute("data-coach");
  w.StudioFocus.decorate();
  assert.ok(!w.document.querySelector(".coach"), "it does not come back on this device");
}
{
  const w = makeWindow();
  const store = {};
  w.EWLComfort = { get: (k) => store[k], set: (k, v) => (store[k] = v) };
  w.document.querySelector(".item-body").innerHTML =
    `<div class="answer-zone"><div class="act-host" data-act="faces"><button type="button">Go</button></div></div>`;
  w.StudioFocus.decorate();
  assert.match(
    w.document.querySelector(".coach").textContent,
    /Step 1 of 3/,
    "a kind with no steps of its own gets three generic ones",
  );
  w.document.querySelector(".coach [data-coach-skip]").click();
  assert.ok(!w.document.querySelector(".coach"), "Skip closes it");
  assert.equal(JSON.stringify(store.coached), '{"faces":1}', "a skip is remembered too");
}

/* ---- the layout rules the browser script relies on exist ---------------------------------------------------------------------- */
{
  const css = read("assets/studio/clarity.css");
  const block = css.slice(css.indexOf("studio v4 platform layout"));
  assert.ok(block.length > 500, "the platform block is in clarity.css");
  for (const [what, re] of [
    [
      "one-row section trail on a phone",
      /@media \(max-width: 400px\)[\s\S]*?\.tab-list[\s\S]*?flex-wrap: nowrap/,
    ],
    [
      "the trail scrolls away on a short laptop screen",
      /@media \(max-height: 800px\) and \(min-width: 401px\)[\s\S]*?\.tab-bar[\s\S]*?position: static/,
    ],
    ["icon-only floating buttons on a phone", /#nsr-launcher \.nsr-launcher-label/],
    [
      "floating buttons hide over a widget",
      /body\.studio-fab-hidden #nsr-root[\s\S]*?visibility: hidden/,
    ],
    ["the lab's check bar is sticky", /\.lab-goalbar \{[\s\S]*?position: sticky/],
    ["the activity's check row is sticky", /\.act-host \.check-bar \{[\s\S]*?position: sticky/],
    [
      "the picture comes before the check bar",
      /lab-item > \.answer-zone \{\s*order: 3[\s\S]*?lab-item > \.lab-goalbar \{\s*order: 5/,
    ],
    ["forced colours", /forced-colors: active\) \{[\s\S]*?focus-sheet/],
  ])
    assert.match(block, re, what);
  assert.doesNotMatch(block.replace(/\/\*[\s\S]*?\*\//g, ""), /`/, "no backticks in the CSS block");
  for (const m of block.matchAll(/\/\*([\s\S]*?)\*\//g))
    assert.ok(!m[1].includes("`"), "no backticks inside CSS comments");
}
{
  const src = read("scripts/generate-practice-studios.mjs");
  const at = (f) => src.indexOf(`"assets/studio/${f}.js"`);
  assert.ok(at("focus") > at("chrome"), "focus.js loads after chrome.js");
  assert.ok(at("focus") < at("quest-model"), "focus.js loads with the other studio scripts");
}

console.log(
  "studio-platform: coach, label wrapping, cell entry, scale arrows, Full screen, tab stops and the layout rules hold.",
);
