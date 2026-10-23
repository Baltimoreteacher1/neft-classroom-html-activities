// Class Pulse inside a studio (assets/studio/pulse.js + its hooks in insight.js): the snapshot is read from what the runtime saved,
// the code decodes back to it, the exit-card slot and "My thinking" show the code with a copy button and the Family Window question,
// and "Copy my results" carries both. Nothing in the code names a student.
//   node tools/studio-pulse-ui.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const { traps } = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/misconceptions.json"), "utf8"),
);
const dom = new JSDOM(
  `<!doctype html><body data-features="insight share"><div class="header-actions"></div><button data-open-think>map</button><div id="complete-banner"><div class="pulse-slot" data-pulse-slot></div></div></body>`,
  { runScripts: "outside-only", url: "https://example.test/" },
);
const w = dom.window;
const handlers = {};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
w.StudioRT = {
  util: { esc, es: (s) => (s ? `<span class="es-text" lang="es">${esc(s)}</span>` : "") },
};
w.StudioBus = { on: (ev, fn) => (handlers[ev] = fn) };
w.StudioStore = { passport: { update() {} }, clear() {} };
const load = (rel) => w.eval(readFileSync(join(REPO_ROOT, rel), "utf8"));
load("assets/studio/attempts.js");
load("assets/studio/pulse-core.js");
load("assets/studio/pulse.js");
load("assets/studio/insight.js");

const [trapA, trapB] = ["stat-mean-out-of-range", "rate-not-per-one"];
assert.ok(traps[trapA] && traps[trapB]);
const state = {
  misses: {
    [trapA]: { n: 4, say: "x" },
    [trapB]: { n: 2, say: "y" },
    "skill:some words": { n: 9, say: "z", auto: true },
  },
  missLog: [],
  calib: { t2i2: { c: 3, ok: false }, t2i3: { c: 3, ok: true }, t1i1: { c: 1, ok: false } },
  att: { t1i1: 0, t1i2: 1, t2i1: 3, t2i2: 2 },
  hints: { t1i1: 0, t1i2: 0, t2i1: 0, t2i2: 1 },
  owed: { t2i1: 2 },
  flag: { t2i1: "teacher" },
  stats: { tries: 7, first: 3, best: 2, hints: 1, reps: 0 },
  acts: {},
  solved1: { t1i1: true, t1i2: true },
  solved2: { t2i1: true, t2i2: true },
  solved3: {},
  solved4: {},
  solved5: {},
};
const items = (n) => Array.from({ length: n }, () => ({}));
const sections = [
  { items: items(4) },
  { items: items(4) },
  { items: items(3) },
  { items: items(3) },
  { items: items(3) },
];
const solvedMap = (t) =>
  Object.fromEntries(Object.entries(state[`solved${t}`]).filter(([k]) => !state.owed[k]));
const trapData = Object.fromEntries(
  [trapA, trapB].map((id) => [
    id,
    { n: traps[id].name, nEs: traps[id].nameEs, fix: traps[id].fix, fixEs: traps[id].fixEs },
  ]),
);
const runtime = {
  api: {
    state,
    data: { lesson: "2-3", mode: "practice", storageKey: "k", traps: trapData },
    sections,
    solvedMap,
    progress() {},
    save() {},
  },
};
w.StudioLearner = { forLesson: () => [{ seal: 1 }, { seal: 1 }, { seal: 3 }, { seal: 0 }] };
w.StudioInsight.init(runtime);
w.StudioPulse.init(runtime);

// ---- the snapshot reads what the runtime saved ---------------------------------------------------------------------
const snap = JSON.parse(JSON.stringify(w.StudioPulse.snapshot()));
assert.equal(snap.lesson, "2-3");
assert.deepEqual(snap.done, [2, 1, 0, 0, 0], "an owed (guessed, unproved) item is not done");
assert.deepEqual(
  snap.tiers,
  { clean: 1, assisted: 1, guessed: 2 },
  "tiers come from misses and hints at the studio's own policy",
);
assert.deepEqual(snap.certain, [{ tab: 2, i: 2 }], "Certain and wrong, found by item position");
assert.deepEqual(snap.flags, [{ kind: "teacher", tab: 2, i: 1 }]);
assert.deepEqual(snap.guessed, [
  { tab: 2, i: 1 },
  { tab: 2, i: 2 },
]);
assert.deepEqual(snap.seals, [2, 0, 1]);

// ---- the code decodes back to it --------------------------------------------------------------------------------------
const code = w.StudioPulse.code();
assert.ok(code.length > 20 && code.length <= 120, `code ${code}`);
const d = JSON.parse(JSON.stringify(w.StudioPulseCore.decode(code)));
assert.equal(d.ok, true);
const p = d.pulse;
assert.equal(p.lesson, "2-3");
assert.deepEqual([p.clean, p.assisted, p.guessed, p.certain, p.fTeacher], [1, 1, 2, 1, 1]);
assert.deepEqual(p.traps, [
  { h: w.StudioPulseCore.trapHash(trapA), n: 4 },
  { h: w.StudioPulseCore.trapHash(trapB), n: 2 },
]);
assert.deepEqual(
  p.focus.map((f) => f.kind),
  ["teacher", "certain"],
);
assert.ok(
  !/[a-z]{4,}/.test(code.replace(/-/g, "").toLowerCase().replace(/[0-9]/g, "")) ||
    /^[0-9A-Z-]+$/.test(code),
  "only code characters",
);

// ---- the exit-card slot (filled at init and again on `complete`) and My thinking ------------------------------------------
const slot = w.document.querySelector("[data-pulse-slot]");
assert.ok(slot.textContent.includes(code), "the exit card shows the code");
assert.ok(slot.querySelector("[data-pulse-copy]"), "with a copy button");
const ask = slot.querySelector(".pulse-ask")?.textContent || "";
assert.ok(
  ask.includes("Ask at home") && ask.includes("Pregunta en casa"),
  "and the Family Window, in both languages",
);
assert.ok(
  ask.includes(traps[trapA].fix) && ask.includes(traps[trapA].fixEs),
  "built from the most frequent trap's quick fix",
);
assert.ok(!ask.includes(traps[trapB].fix), "not from a less frequent one");
slot.innerHTML = "";
handlers.complete({ lesson: "2-3", mode: "practice" });
assert.ok(slot.textContent.includes(code), "a finished studio refills the slot");

w.document.querySelector("[data-open-think]").click();
const dlg = w.document.querySelector("#studio-think");
assert.ok(dlg.querySelector("[data-copy]"), "Copy my results is still there");
assert.ok(
  dlg.querySelector("[data-pulse-copy]"),
  "with the class code and its own copy button beside it",
);

// ---- Copy my results carries the code and the question -----------------------------------------------------------------
const share = w.StudioInsight.shareText();
assert.ok(share.includes(`Class code: ${code}`));
assert.ok(share.includes("Ask at home:") && share.includes("Pregunta en casa:"));
assert.ok(share.includes("Still working on:"), "the existing lines are unchanged");
// no student identity anywhere
assert.ok(
  !/@|name:/i.test(share.replace(/Ask at home[^\n]*/g, "")),
  "no name or email in the note",
);

// ---- copy button copies the bare code ------------------------------------------------------------------------------------
let copied = "";
Object.defineProperty(w.navigator, "clipboard", {
  value: { writeText: (t) => ((copied = t), Promise.resolve()) },
  configurable: true,
});
slot.querySelector("[data-pulse-copy]").click();
assert.equal(copied, code);

// ---- a studio with nothing yet: a code, no Family Window ---------------------------------------------------------------------
state.misses = {};
const quiet = w.StudioPulse.boxHtml();
assert.ok(quiet.includes("pulse-code") && !quiet.includes("pulse-ask"));
assert.equal(w.StudioPulse.shareLines().length, 1);
// a lesson id the code cannot carry never breaks the studio
runtime.api.data.lesson = "banana";
assert.equal(w.StudioPulse.code(), "");
assert.doesNotThrow(() => w.StudioPulse.boxHtml());
console.log("studio pulse ui: OK");

// ---- Unit 4's hand-built pages: the same code from their own saved state ------------------------------------------------------
{
  const u4 = new JSDOM(
    `<!doctype html><body><div class="header-actions"></div><script type="application/json" id="u4-traps">${JSON.stringify(
      Object.fromEntries(
        ["percent-base-not-100", "ratio-as-difference"].map((id) => [
          id,
          { name: id, nameEs: id, fix: traps[id].fix, fixEs: traps[id].fixEs },
        ]),
      ),
    )}</script><div id="slot-host"></div></body>`,
    {
      runScripts: "outside-only",
      url: "https://example.test/math/unit-4/4-3-practice-studio-challenging/",
    },
  );
  const x = u4.window;
  const run = (rel) => x.eval(readFileSync(join(REPO_ROOT, rel), "utf8"));
  const solved = {
    solved1: { a: true, b: true, rand9: true },
    solved2: { c: true },
    solved3: {},
    solved4: {},
    solved5: {},
  };
  x.U4Studio = { withCfg: (fn) => fn({ state: solved }), dialog() {} };
  run("assets/studio/pulse-core.js");
  run("assets/studio/pulse.js"); // already on the page: the lazy loader skips the network
  run("assets/u4-studio-thinking.js");
  for (const [tag, id] of [
    ["percent-base-not-100", "a"],
    ["percent-base-not-100", "b"],
    ["ratio-as-difference", "c"],
    ["not-in-this-page", "d"],
  ])
    x.document.dispatchEvent(
      new x.CustomEvent("u4:miss", { detail: { id, choice: 1, tag, tab: 1 } }),
    );
  const s = JSON.parse(JSON.stringify(x.U4Thinking.snapshot()));
  assert.equal(s.lesson, "4-3");
  assert.equal(s.mode, "challenge");
  assert.equal(s.u4, true);
  assert.deepEqual(s.done, [2, 1, 0, 0, 0], "random extra-practice items are not counted");
  assert.deepEqual(
    s.misses,
    { "percent-base-not-100": { n: 2 }, "ratio-as-difference": { n: 1 } },
    "only traps the page names",
  );
  x.document.querySelector("#slot-host").innerHTML = x.U4Thinking.exitHtml();
  await new Promise((r) => setTimeout(r, 20));
  const box = x.document.querySelector("[data-pulse-slot]");
  assert.ok(box.querySelector(".pulse-code"), "the Unit 4 exit card gets a code");
  assert.ok(
    box.querySelector(".pulse-ask")?.textContent.includes(traps["percent-base-not-100"].fix),
    "and the Family Window from its top trap",
  );
  const back = JSON.parse(
    JSON.stringify(x.StudioPulseCore.decode(box.querySelector(".pulse-code").textContent)),
  );
  assert.equal(back.ok, true);
  assert.equal(back.pulse.u4, true);
  assert.equal(back.pulse.lesson, "4-3");
  assert.equal(back.pulse.mode, "challenge");
  assert.equal(
    back.pulse.clean + back.pulse.assisted + back.pulse.guessed,
    0,
    "no tier counts claimed",
  );
}
console.log("unit 4 pulse: OK");
