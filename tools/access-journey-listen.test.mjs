// Active Listening Laboratory: the pure `listen` engine (src/journey/engines/listen.js) and its UI
// (src/journey/ui/listen.js) driven in jsdom. Contract: access-practice-lab/JOURNEY.md ("ListenTask").
import assert from "node:assert/strict";
import test from "node:test";
import m08 from "../access-practice-lab/src/content/journey/m08.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import * as E from "../access-practice-lab/src/journey/engines/listen.js";
import { mount, render } from "../access-practice-lab/src/journey/ui/listen.js";
import { toHtml } from "../access-practice-lab/src/util.js";

let JSDOM = null;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  JSDOM = null;
}

const m8 = {
  "3-5": m08.bands["3-5"].understand.listen,
  "6-8": m08.bands["6-8"].understand.listen,
};

const S = (ids) =>
  ids.map((id, i) => ({ id: `u${i + 1}`, text: `Sentence about ${id}.`, signal: id }));
const arrange = () => ({
  kind: "listen",
  mode: "arrange",
  title: "Arrange",
  script: S(["first", "next", "last"]),
  items: [
    { id: "a", label: "Card A", glyph: "A" },
    { id: "b", label: "Card B", glyph: "B" },
    { id: "c", label: "Card C", glyph: "C" },
  ],
  targets: [
    { id: "p1", label: "Step 1" },
    { id: "p2", label: "Step 2" },
    { id: "p3", label: "Step 3" },
  ],
  expect: [
    { item: "a", target: "p1", utterance: "u1" },
    { item: "b", target: "p2", utterance: "u2" },
    { item: "c", target: "p3", utterance: "u3" },
  ],
  visuals: { u1: "Picture of A", u2: "Picture of B", u3: "Picture of C" },
  xray: { keywords: [], sequence: ["next"], cause: [], referents: [] },
});
const follow = () => ({
  ...arrange(),
  mode: "follow",
  title: "Follow",
  targets: [
    { id: "p1", label: "Do 1" },
    { id: "p2", label: "Do 2" },
    { id: "p3", label: "Do 3" },
  ],
});
const placeT = () => ({
  kind: "listen",
  mode: "place",
  title: "Place",
  grid: { cols: 2, rows: 2 },
  script: S(["north", "south"]),
  items: [
    { id: "tree", label: "Tree", glyph: "T" },
    { id: "pond", label: "Pond", glyph: "P" },
  ],
  targets: [
    { id: "nw", label: "Northwest" },
    { id: "ne", label: "Northeast" },
    { id: "sw", label: "Southwest" },
    { id: "se", label: "Southeast" },
  ],
  expect: [
    { item: "tree", target: "ne", utterance: "u1" },
    { item: "pond", target: "sw", utterance: "u2" },
  ],
  visuals: { u1: "Top right highlighted", u2: "Bottom left highlighted" },
});
const sortT = () => ({
  kind: "listen",
  mode: "sort",
  title: "Sort",
  script: S(["hot", "cold"]),
  items: [
    { id: "sun", label: "Sun", glyph: "S" },
    { id: "fire", label: "Fire", glyph: "F" },
    { id: "ice", label: "Ice", glyph: "I" },
  ],
  targets: [
    { id: "hot", label: "Hot" },
    { id: "cold", label: "Cold" },
  ],
  expect: [
    { item: "sun", target: "hot", utterance: "u1" },
    { item: "fire", target: "hot", utterance: "u1" },
    { item: "ice", target: "cold", utterance: "u2" },
  ],
  visuals: { u1: "Red glow", u2: "Blue frost" },
  xray: {
    keywords: ["hot"],
    sequence: [],
    cause: [],
    referents: [{ phrase: "Sentence", means: "the sentence" }],
  },
  final: {
    title: "Sort again",
    script: [
      { id: "f1", text: "Warm sand and wool.", signal: "Warm" },
      { id: "f2", text: "Snow and ice.", signal: "Snow" },
    ],
    items: [
      { id: "sand", label: "Sand", glyph: "S" },
      { id: "snow", label: "Snow", glyph: "N" },
    ],
    targets: [
      { id: "w", label: "Warm" },
      { id: "k", label: "Cold" },
    ],
    expect: [
      { item: "sand", target: "w", utterance: "f1" },
      { item: "snow", target: "k", utterance: "f2" },
    ],
  },
});
const withFinal = (task) => ({
  ...task,
  final: {
    title: "Final",
    script: [
      { id: "f1", text: "Alpha comes first.", signal: "first" },
      { id: "f2", text: "Beta comes last.", signal: "last" },
    ],
    items: [
      { id: "x", label: "Alpha", glyph: "X" },
      { id: "y", label: "Beta", glyph: "Y" },
    ],
    targets: [
      { id: "q1", label: "Slot 1" },
      { id: "q2", label: "Slot 2" },
    ],
    expect: [
      { item: "x", target: "q1", utterance: "f1" },
      { item: "y", target: "q2", utterance: "f2" },
    ],
  },
});

const solve = (task, state) => {
  let s = state;
  for (const r of E.resolveTask(task, { final: state.final }).expect)
    s = E.place(s, r.item, r.target);
  return s;
};

// ---- pure layer -----------------------------------------------------------------------------------------------

test("m08: grade 3-5 sort and grade 6-8 place, and both finals, validate and score", () => {
  assert.equal(m8["3-5"].mode, "sort");
  assert.equal(m8["6-8"].mode, "place");
  for (const band of ["3-5", "6-8"]) {
    for (const final of [false, true]) {
      const task = m8[band];
      const s = E.init(task, { final });
      assert.equal(E.check(task, s).allCorrect, false, "nothing placed is not correct");
      assert.deepEqual(E.unplaced(task, s).length, E.resolveTask(task, { final }).expect.length);
      const done = solve(task, s);
      const c = E.check(task, done);
      assert.equal(c.allCorrect, true, `${band} final=${final}`);
      assert.equal(c.firstWrong, null);
      assert.equal(E.doneCriteria(task, done).met, true);
    }
  }
  assert.equal(E.resolveTask(m8["6-8"], { final: true }).mode, "arrange");
  assert.deepEqual(E.xrayLayers(m8["3-5"], { final: true }), []);
});

test("m08 6-8 place uses its grid and compass labels", () => {
  const t = m8["6-8"];
  assert.equal(t.grid.cols * t.grid.rows, t.targets.length);
  assert.deepEqual(
    t.targets.map((x) => E.compassHint(x.label)),
    ["NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"],
  );
  assert.equal(E.compassHint("Step 2"), null);
});

test("every mode places, moves and scores", () => {
  for (const make of [arrange, follow, placeT, sortT]) {
    const task = make();
    const s0 = E.init(task);
    const s1 = E.select(s0, task.items[0].id);
    assert.equal(s1.selected, task.items[0].id);
    const solved = solve(task, s0);
    assert.equal(E.check(task, solved).allCorrect, true, task.mode);
    const wrong = E.place(
      solved,
      task.expect[0].item,
      task.targets.find((x) => x.id !== task.expect[0].target).id,
    );
    assert.equal(E.check(task, wrong).allCorrect, false);
    assert.equal(E.check(task, wrong).firstWrong.item, task.expect[0].item);
    assert.equal(E.place(wrong, task.expect[0].item, null).placed[task.expect[0].item], null);
  }
});

test("single-slot modes send the old card back; sort bins hold several", () => {
  const a = E.init(arrange());
  const two = E.place(E.place(a, "a", "p1"), "b", "p1");
  assert.equal(two.placed.a, null);
  assert.equal(two.placed.b, "p1");
  const s = E.place(E.place(E.init(sortT()), "sun", "hot"), "fire", "hot");
  assert.deepEqual(E.itemsIn(s, "hot"), ["sun", "fire"]);
  assert.throws(() => E.place(a, "nope", "p1"), /unknown item/);
  assert.throws(() => E.place(a, "a", "nope"), /unknown target/);
});

test("submit needs every card placed and counts a try only for a changed wrong placement", () => {
  const task = arrange();
  let s = E.place(E.init(task), "a", "p2");
  const early = E.submit(task, s);
  assert.equal(early.ready, false);
  assert.deepEqual(early.missing.sort(), ["b", "c"]);
  assert.deepEqual(early.state.tries, {});
  s = E.place(E.place(s, "b", "p1"), "c", "p3");
  const r1 = E.submit(task, s);
  assert.equal(r1.ready, true);
  assert.equal(r1.state.tries.a, 1);
  assert.equal(r1.state.tries.b, 1);
  assert.equal(r1.state.tries.c, undefined);
  assert.equal(E.submit(task, r1.state).state.tries.a, 1, "same placement is not a new try");
});

// Put every card where `where` says ({ cardId: targetId }) in one move set, then press Check.
const attempt = (task, state, where) => {
  let s = state;
  for (const id of Object.keys(s.placed)) s = E.place(s, id, null);
  for (const [id, target] of Object.entries(where)) s = E.place(s, id, target);
  return E.submit(task, s).state;
};

test("graduated repair: replay, then signal word, then visual, always another try", () => {
  const task = arrange();
  let s = attempt(task, E.init(task), { a: "p2", b: "p1", c: "p3" });
  const f1 = E.feedbackFor(task, s, "a");
  assert.deepEqual(
    [f1.level, f1.kind, f1.utterance, f1.text, f1.signal, f1.visual],
    [1, "replay", "u1", "Sentence about first.", null, null],
  );
  s = attempt(task, s, { a: "p3", b: "p2", c: "p1" });
  const f2 = E.feedbackFor(task, s, "a");
  assert.deepEqual([f2.level, f2.kind, f2.signal, f2.visual], [2, "signal", "first", null]);
  s = attempt(task, s, { a: "p2", b: "p1", c: "p3" });
  const f3 = E.feedbackFor(task, s, "a");
  assert.deepEqual([f3.level, f3.kind, f3.visual], [3, "visual", "Picture of A"]);
  assert.ok(f3.actions.includes("try-another") && f3.canTryAgain);
  s = attempt(task, s, { a: "p3", b: "p2", c: "p1" });
  assert.equal(E.feedbackFor(task, s, "a").level, 3, "stays at the last rung");
  assert.equal(E.feedbackFor(task, E.init(task), "a"), null, "no wrong action yet");
  s = attempt(task, s, { a: "p1", b: "p2", c: "p3" });
  assert.equal(E.check(task, s).allCorrect, true, "another try is always allowed");
});

test("independent feedback withholds sentence, signal, visual and the utterance id", () => {
  const task = arrange();
  let s = attempt(task, E.init(task), { a: "p2", b: "p1", c: "p3" });
  s = attempt(task, s, { a: "p3", b: "p2", c: "p1" });
  s = attempt(task, s, { a: "p2", b: "p1", c: "p3" });
  const f = E.feedbackFor(task, s, "a", { independent: true });
  assert.deepEqual(
    [f.level, f.kind, f.text, f.signal, f.visual, f.utterance],
    [0, "independent", null, null, null, null],
  );
  assert.deepEqual(f.actions, ["listen-again", "try-another"]);
  const sort = sortT();
  const bad = attempt(sort, E.init(sort, { final: true }), { sand: "k", snow: "w" });
  assert.equal(
    E.feedbackFor(sort, bad, "sand").kind,
    "independent",
    "the final check is always independent",
  );
});

test("expect rows that repeat an item (or give two items one ordered slot) are invalid input", () => {
  const dupItem = arrange();
  dupItem.expect.push({ item: "a", target: "p2", utterance: "u2" });
  assert.throws(() => E.init(dupItem), /twice/);
  const dupTarget = arrange();
  dupTarget.expect[1].target = "p1";
  assert.throws(() => E.init(dupTarget), /unique targets/);
  const dupPlace = placeT();
  dupPlace.expect[1].target = "ne";
  assert.throws(() => E.init(dupPlace), /unique targets/);
  assert.doesNotThrow(() => E.init(sortT()), "sort bins legitimately share a target");
  const badU = arrange();
  badU.expect[0].utterance = "u9";
  assert.throws(() => E.init(badU), /unknown utterance/);
  const badGrid = placeT();
  badGrid.grid = { cols: 3, rows: 3 };
  assert.throws(() => E.init(badGrid), /needs 9 targets/);
  assert.throws(() => E.init({ ...arrange(), mode: "dance" }), /mode must be/);
});

test("x-ray layers, overlap handling and signal highlight", () => {
  const layers = E.xrayLayers(m8["3-5"]);
  assert.deepEqual(
    layers.map((l) => l.id),
    ["keywords", "cause", "referents"],
  );
  const u5 = layers.flatMap((l) => l.marks.u5 || []);
  const runs = E.segments(m8["3-5"].script[4].text, u5);
  assert.ok(runs.some((r) => r.kind === "cause" && r.text === "because"));
  assert.ok(runs.some((r) => r.kind === "referents" && r.note === "the sunlight"));
  assert.equal(runs.map((r) => r.text).join(""), m8["3-5"].script[4].text);
  const withSpeakers = {
    ...arrange(),
    script: [
      { id: "u1", text: "Hi.", speaker: "Ana" },
      { id: "u2", text: "Yes.", speaker: "Ben" },
      { id: "u3", text: "Ok.", speaker: "Ben" },
    ],
  };
  const sp = E.xrayLayers(withSpeakers).find((l) => l.id === "speakers");
  assert.deepEqual(Object.keys(sp.marks), ["u1", "u2"]);
  assert.deepEqual(
    E.highlightSignal("Bed 2 gets only two hours.", "two hours").map((r) => r.signal),
    [false, true, false],
  );
  assert.equal(E.highlightSignal("No match here", "zzz").length, 1);
});

test("ledger entry: mission/Listening, first vs transfer, independent only without help", () => {
  const base = { missionId: "m08", band: "6-8", klu: "Explain", correct: 4, total: 4, tries: 2 };
  const p1 = E.ledgerEntry({ ...base, part: 1, helps: ["xray", "signal"] });
  assert.deepEqual(
    [p1.src, p1.task, p1.domain, p1.use, p1.kind, p1.stage],
    ["mission", "m08.understand", "Listening", "Explain", "first", "supported"],
  );
  assert.deepEqual(p1.supports, { coach: true, hint: true });
  const p2 = E.ledgerEntry({ ...base, part: 2, helps: [] });
  assert.deepEqual([p2.kind, p2.stage], ["transfer", "independent"]);
  assert.equal(E.ledgerEntry({ ...base, part: 2, helps: ["transcript"] }).stage, "supported");
  assert.equal(E.ledgerEntry({ ...base, part: 1, helps: [] }).stage, "supported");
});

// ---- jsdom UI -------------------------------------------------------------------------------------------------

const jsdom = JSDOM ? test : (name, fn) => test(name, { skip: "jsdom is not installed" }, fn);

function setup({ speech = true } = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', {
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const spoken = [];
  if (speech) {
    window.speechSynthesis = {
      speak: (u) => {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(), 0);
      },
      cancel() {},
      getVoices: () => [],
    };
  }
  Object.assign(globalThis, { window, document: window.document });
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  return { dom, root: window.document.getElementById("root"), spoken, window };
}

function mk(task, over = {}, opts = {}) {
  const ctx = setup(opts);
  const calls = { help: [], ledger: [], done: [], announce: [] };
  const env = {
    I: makeI18n("en"),
    band: "6-8",
    support: "B",
    independent: false,
    missionId: "m08",
    step: "understand",
    mission: { klu: "Explain" },
    pack: { understand: { listen: task } },
    data: {},
    update(patch) {
      Object.assign(env.data, patch);
      if (!opts.noRerender) {
        ctx.root.innerHTML = toHtml(render(task, env));
        mount(ctx.root, env);
      }
    },
    help: (id) => calls.help.push(id),
    done: (r) => calls.done.push(r),
    ledger: (e) => calls.ledger.push(e),
    announce: (m) => calls.announce.push(m),
    ...over,
  };
  ctx.root.innerHTML = toHtml(render(task, env));
  mount(ctx.root, env);
  const $ = (sel) => ctx.root.querySelector(sel);
  const $$ = (sel) => [...ctx.root.querySelectorAll(sel)];
  const click = (sel) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    assert.ok(el, `missing ${sel}`);
    el.click();
  };
  // Select a card (picking it up first when it is already on a target), then activate the target.
  const placeCard = (item, target) => {
    const at = env.data.listen?.state.placed[item];
    if (at && !$(`.jl-pool [data-item="${item}"]`))
      click($(`[data-cell="${at}"] [data-item="${item}"]`) ?? `[data-target="${at}"]`);
    else click(`.jl-pool [data-item="${item}"]`);
    click(`[data-target="${target}"]`);
  };
  const solveUI = (t) => {
    for (const r of t.expect) placeCard(r.item, r.target);
  };
  return { ...ctx, env, calls, $, $$, click, placeCard, solveUI };
}

const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));

jsdom("each mode renders keyboard-operable buttons and no transcript before help", () => {
  for (const make of [arrange, follow, placeT, sortT]) {
    const task = make();
    const ui = mk(task);
    const text = ui.root.textContent;
    for (const u of task.script)
      assert.ok(!text.includes(u.text), `${task.mode}: transcript shown before help`);
    assert.equal(ui.$$("[data-act='play']").length, task.script.length);
    assert.ok(ui.$("[data-act='play-all']"));
    assert.equal(ui.$$(".jl-target").length, task.targets.length);
    assert.equal(ui.$$(".jl-item").length, task.items.length);
    for (const el of ui.$$("[data-act]"))
      assert.equal(el.tagName, "BUTTON", `${task.mode}: ${el.outerHTML.slice(0, 60)}`);
    for (const el of ui.$$(".jl-item")) assert.equal(el.getAttribute("aria-pressed"), "false");
    for (const el of ui.$$(".jl-target")) assert.match(el.getAttribute("aria-label"), /empty/);
    assert.equal(ui.$$("[onclick],[draggable]").length, 0);
    assert.equal(ui.$(".jl").dataset.mode, task.mode);
  }
  const pl = mk(placeT());
  assert.equal(pl.$(".jl-grid").style.getPropertyValue("--cols"), "2");
  assert.ok(pl.$$(".jl-compass").length === 4);
  assert.ok(mk(follow()).$(".jl-bench"));
  assert.ok(mk(sortT()).$(".jl-bins"));
});

jsdom("select then place: aria-pressed, target label holds the card, live announcement", () => {
  const ui = mk(arrange());
  ui.click('[data-item="a"]');
  assert.equal(ui.$('[data-item="a"]').getAttribute("aria-pressed"), "true");
  assert.match(ui.$('[data-target="p1"]').getAttribute("aria-label"), /Press to place Card A here/);
  ui.click('[data-target="p1"]');
  assert.match(ui.$('[data-target="p1"]').getAttribute("aria-label"), /holds Card A/);
  assert.equal(ui.$$(".jl-pool .jl-item").length, 2);
  assert.ok(ui.calls.announce.some((m) => /Card A placed in Step 1/.test(m)));
  assert.equal(document.activeElement.dataset.target, "p1", "focus stays on the target");
  ui.click('[data-target="p1"]'); // pick it up again
  assert.equal(ui.$(".jl-pool").textContent.includes("Card A"), true);
  assert.equal(ui.$('[data-item="a"]').getAttribute("aria-pressed"), "true");
  assert.deepEqual(ui.env.data.listen.state.placed.a, null);
  ui.click('[data-target="p2"]'); // moved
  assert.equal(ui.env.data.listen.state.placed.a, "p2");
});

jsdom("arrow keys move focus between targets (grid moves by rows)", () => {
  const key = (el, k) =>
    el.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
    );
  const ui = mk(arrange());
  ui.$('[data-target="p1"]').focus();
  key(document.activeElement, "ArrowRight");
  assert.equal(document.activeElement.dataset.target, "p2");
  key(document.activeElement, "ArrowLeft");
  assert.equal(document.activeElement.dataset.target, "p1");
  const g = mk(placeT());
  g.$('[data-target="nw"]').focus();
  key(document.activeElement, "ArrowDown");
  assert.equal(document.activeElement.dataset.target, "sw");
  key(document.activeElement, "ArrowRight");
  assert.equal(document.activeElement.dataset.target, "se");
});

jsdom(
  "Listen speaks one sentence; Play all speaks the script; nothing plays by itself",
  async () => {
    const ui = mk(arrange());
    assert.deepEqual(ui.spoken, []);
    ui.click('[data-act="play"][data-u="u2"]');
    await tick(400); // speak() pauses 280ms after a sentence before it resolves
    assert.deepEqual(ui.spoken, ["Sentence about next."]);
    assert.match(ui.$("[data-jl-status]").textContent, /Finished/);
    ui.click('[data-act="play-all"]');
    await tick(1000);
    assert.deepEqual(ui.spoken.slice(1), [
      "Sentence about first.",
      "Sentence about next.",
      "Sentence about last.",
    ]);
    assert.equal(ui.calls.help.length, 0, "listening again is not a support");
    assert.equal(ui.env.data.listen, undefined, "playing audio alone changes nothing to persist");
  },
);

jsdom(
  "wrong answer shows replay, then signal in the caption, then the visual; helps are recorded",
  () => {
    const task = arrange();
    const ui = mk(task);
    ui.placeCard("a", "p2");
    ui.placeCard("b", "p1");
    ui.placeCard("c", "p3");
    ui.click('[data-act="check"]');
    let fix = ui.$('[data-fix="a"]');
    assert.ok(fix, "repair card for the wrong card");
    assert.equal(fix.dataset.level, "1");
    assert.ok(
      fix.querySelector('[data-act="play"][data-u="u1"]'),
      "replay button for its sentence",
    );
    assert.ok(!fix.textContent.includes("Sentence about first"), "sentence not shown at level 1");
    assert.equal(ui.$$('[data-result="wrong"]').length, 2);
    assert.equal(ui.$$('[data-result="ok"]').length, 1);
    ui.placeCard("a", "p3");
    ui.placeCard("c", "p2");
    ui.click('[data-act="check"]');
    fix = ui.$('[data-fix="a"]');
    assert.equal(fix.dataset.level, "2");
    assert.equal(fix.querySelector("mark.jl-signal").textContent, "first");
    assert.ok(!fix.textContent.includes("Picture of A"));
    assert.ok(ui.calls.help.includes("signal"));
    ui.placeCard("c", "p3");
    ui.placeCard("a", "p2");
    ui.click('[data-act="check"]');
    fix = ui.$('[data-fix="a"]');
    assert.equal(fix.dataset.level, "3");
    assert.ok(fix.querySelector(".jl-visual").textContent.includes("Picture of A"));
    assert.ok(ui.calls.help.includes("visual"));
    assert.ok(fix.querySelector('[data-act="try-another"]'));
    ui.click(fix.querySelector('[data-act="try-another"]'));
    assert.equal(ui.env.data.listen.state.selected, "a");
    assert.equal(ui.calls.done.length, 0);
  },
);

jsdom(
  "part 1 then the independent final: ledger per part, done result, no supports in the final",
  () => {
    const task = withFinal(arrange());
    const ui = mk(task);
    ui.click('[data-act="check"]');
    assert.ok(ui.calls.announce.some((m) => /Place every card first/.test(m)));
    ui.solveUI(task);
    ui.click('[data-act="check"]');
    assert.equal(ui.$(".jl").dataset.phase, "bridge");
    assert.equal(ui.calls.ledger.length, 1);
    assert.equal(ui.calls.ledger[0].kind, "first");
    assert.equal(ui.calls.done.length, 0);
    ui.click('[data-act="start-final"]');
    assert.equal(ui.$(".jl").dataset.part, "2");
    assert.equal(ui.$(".jl-helps"), null, "no help toggles in the final");
    assert.ok(!ui.root.textContent.includes("Alpha comes first"));
    ui.placeCard("x", "q2");
    ui.placeCard("y", "q1");
    ui.click('[data-act="check"]');
    const fix = ui.$('[data-fix="x"]');
    assert.ok(fix);
    assert.equal(fix.dataset.level, "0");
    assert.ok(
      !fix.querySelector(".jl-caption") &&
        !fix.querySelector(".jl-visual") &&
        !fix.querySelector('[data-act="play"]'),
    );
    assert.ok(
      fix.querySelector('[data-act="play-all"]') && fix.querySelector('[data-act="try-another"]'),
    );
    assert.deepEqual(
      [...fix.querySelectorAll("button")].map((b) => b.dataset.act),
      ["play-all", "try-another"],
    );
    ui.placeCard("x", "q1");
    ui.placeCard("y", "q2");
    ui.click('[data-act="check"]');
    assert.equal(ui.$(".jl").dataset.phase, "done");
    assert.equal(ui.calls.ledger.length, 2);
    assert.deepEqual(
      [ui.calls.ledger[1].kind, ui.calls.ledger[1].stage],
      ["transfer", "independent"],
    );
    assert.equal(ui.calls.done.length, 1);
    assert.deepEqual(ui.calls.done[0], {
      correct: 2,
      total: 2,
      tries: 2,
      supportsUsed: [],
      finalIndependent: true,
    });
  },
);

jsdom(
  "a task without a final finishes after part 1; env.independent shows no supports at all",
  () => {
    const task = arrange();
    const ui = mk(task, { independent: true, support: "A" });
    assert.equal(ui.$(".jl-helps"), null);
    ui.solveUI(task);
    ui.click('[data-act="check"]');
    assert.equal(ui.calls.done.length, 1);
    assert.equal(ui.calls.done[0].finalIndependent, false);
    assert.equal(ui.calls.ledger[0].stage, "independent");
  },
);

jsdom(
  "support modes only change which helps are offered; x-ray overlays captions and marks supported",
  () => {
    const task = sortT();
    const a = mk(task, { support: "A" });
    assert.ok(a.$("div.jl-helps"), "A: offered up front");
    assert.ok(a.$('[data-act="xray"]') && a.$('[data-act="visuals"]'));
    assert.equal(a.$$(".jl-caption").length, 0);
    a.click('[data-act="xray"]');
    assert.ok(a.$$(".jl-caption").length === task.script.length);
    assert.ok(a.$(".jl-caption mark.jl-k-keywords"));
    assert.ok(a.$(".jl-legend"));
    assert.deepEqual(a.calls.help, ["xray"]);
    a.click('[data-act="visuals"]');
    assert.equal(a.$$(".jl-visual").length, 2);
    const b = mk(task, { support: "B" });
    assert.ok(b.$("details.jl-helps"), "B: on request");
    assert.equal(b.$("details.jl-helps").open, false);
    assert.equal(mk(task, { support: "C" }).$(".jl-helps"), null);
    const c = mk(task, { support: "C" });
    assert.equal(c.$('[data-act="xray"]'), null);
  },
);

jsdom("sort mode: bins hold several cards, picking one up and moving it works", () => {
  const task = sortT();
  const ui = mk(task);
  ui.placeCard("sun", "hot");
  ui.placeCard("fire", "hot");
  assert.equal(ui.$$('[data-cell="hot"] .jl-bin-items .jl-item').length, 2);
  assert.match(ui.$('[data-target="hot"]').getAttribute("aria-label"), /holds Sun, Fire/);
  ui.click('[data-cell="hot"] [data-item="fire"]');
  assert.equal(ui.env.data.listen.state.selected, "fire");
  ui.click('[data-target="cold"]');
  assert.equal(ui.env.data.listen.state.placed.fire, "cold");
});

jsdom(
  "speech unavailable: honest message, Read it instead reveals sentences and marks supported",
  () => {
    const task = arrange();
    const ui = mk(task, {}, { speech: false });
    assert.match(ui.root.textContent, /cannot play/);
    assert.equal(ui.$$("[data-act='play']").length, 0);
    assert.equal(ui.$$("[data-act='play-all']").length, 0);
    for (const u of task.script) assert.ok(!ui.root.textContent.includes(u.text));
    ui.click('[data-act="read-instead"]');
    assert.deepEqual(ui.calls.help, ["transcript"]);
    for (const u of task.script)
      assert.ok(ui.root.textContent.includes(u.text), "sentences revealed");
    assert.equal(ui.$('[data-act="read-instead"]'), null);
    ui.solveUI(task);
    ui.click('[data-act="check"]');
    assert.equal(ui.calls.done.length, 1);
    assert.deepEqual(ui.calls.done[0].supportsUsed, ["transcript"]);
    assert.equal(ui.calls.ledger[0].stage, "supported");
  },
);

jsdom("works without a shell rerender and resumes from env.data.listen", () => {
  const task = sortT();
  const ui = mk(task, {}, { noRerender: true });
  ui.placeCard("sun", "hot");
  assert.match(ui.$('[data-target="hot"]').getAttribute("aria-label"), /holds Sun/);
  const saved = ui.env.data.listen;
  assert.equal(saved.state.placed.sun, "hot");
  const again = mk(task, { data: { listen: JSON.parse(JSON.stringify(saved)) } });
  assert.match(again.$('[data-target="hot"]').getAttribute("aria-label"), /holds Sun/);
  assert.ok(!again.$(".jl-pool").textContent.includes("Sun"));
  const stale = mk(task, { data: { listen: { phase: "play", part: 2, state: saved.state } } });
  assert.equal(
    stale.$(".jl").dataset.part,
    "1",
    "saved state that does not match the task is discarded, not trusted",
  );
});

jsdom("a repeated mount does not stack listeners", () => {
  const task = arrange();
  const ui = mk(task);
  mount(ui.root, ui.env);
  mount(ui.root, ui.env);
  ui.click('[data-item="a"]');
  assert.equal(
    ui.env.data.listen.state.selected,
    "a",
    "one click selects once, not select-then-deselect",
  );
});

jsdom("m08 packs play end to end in the UI (3-5 sort, 6-8 place, both finals)", () => {
  for (const band of ["3-5", "6-8"]) {
    const task = m8[band];
    const ui = mk(task, { band, pack: { understand: { listen: task } } });
    ui.solveUI(task);
    ui.click('[data-act="check"]');
    assert.equal(ui.$(".jl").dataset.phase, "bridge", band);
    ui.click('[data-act="start-final"]');
    ui.solveUI(E.resolveTask(task, { final: true }));
    ui.click('[data-act="check"]');
    assert.equal(ui.calls.done.length, 1, band);
    assert.equal(ui.calls.done[0].finalIndependent, true);
  }
});
