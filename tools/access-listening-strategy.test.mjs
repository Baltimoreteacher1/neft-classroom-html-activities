#!/usr/bin/env node
// Listening Strategy Lab: pure logic (segments, purpose, trap diagnosis, local notes) and the
// rendered mode separation between "Learn with help" and "Try independently".
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  clearListenNotes,
  diagnoseListening,
  listeningPurpose,
  listeningSegments,
  listenNotesKey,
  loadListenNotes,
  saveListenNotes,
  signalParts,
} from "../access-practice-lab/src/learning.js";

// ── pure logic ────────────────────────────────────────────────────────────────
test("segments: sentences for a monologue, turns for a dialogue, titles kept whole", () => {
  assert.deepEqual(
    listeningSegments("Diego read 12 pages. Amara read 20 pages.").map((s) => [s.kind, s.text]),
    [
      ["sentence", "Diego read 12 pages."],
      ["sentence", "Amara read 20 pages."],
    ],
  );
  const turns = listeningSegments(
    "Mei: I think homework should be limited. It is stressful. Omar: Why one hour? Dr. Haddad: Sleep matters.",
  );
  assert.deepEqual(
    turns.map((s) => s.text),
    [
      "Mei: I think homework should be limited. It is stressful.",
      "Omar: Why one hour?",
      "Dr. Haddad: Sleep matters.",
    ],
  );
  assert.ok(turns.every((s) => s.kind === "turn"));
  assert.deepEqual(listeningSegments(""), []);
  assert.deepEqual(listeningSegments(undefined), []);
});

test("signal words are found as whole words and the authored text is preserved", () => {
  const parts = signalParts("First, stir. However, do not shake. Snot is gross.");
  assert.equal(
    parts.map((p) => p.text).join(""),
    "First, stir. However, do not shake. Snot is gross.",
  );
  assert.deepEqual(
    parts.filter((p) => p.signal).map((p) => p.text),
    ["First", "However", "not"],
  );
});

test("purpose comes from authored data first, then the skill tag, and is never invented", () => {
  assert.equal(listeningPurpose({ skill: "Identify a speaker's opinion" }).kind, "stance");
  assert.equal(listeningPurpose({ skill: "Sequence oral lab steps" }).kind, "sequence");
  assert.equal(
    listeningPurpose({ skill: "Identifying spoken numbers and quantities" }).kind,
    "quantity",
  );
  assert.equal(listeningPurpose({ skill: "Identify the main idea" }).kind, "gist");
  const authored = listeningPurpose({
    skill: "Identify the main idea",
    listenPurpose: { kind: "quantity", text: "Count the pages." },
    listenFor: ["two numbers"],
  });
  assert.equal(authored.kind, "quantity");
  assert.equal(authored.text, "Count the pages.");
  assert.deepEqual(authored.focus, ["two numbers"]);
  const focusOnly = listeningPurpose({
    skill: "Connect language to school places",
    listenFor: ["place words"],
  });
  assert.equal(focusOnly.kind, null);
  assert.deepEqual(focusOnly.focus, ["place words"]);
  assert.equal(listeningPurpose({ skill: "Connect language to school places" }), null);
});

const storm = {
  type: "multipleChoice",
  prompt: "Why will recess be indoors?",
  script:
    "Good morning, students. Here is a change to today's schedule. Recess will be held indoors today because there is lightning in the area, and it is not safe to be outside during a storm. Please report to the gym instead of the field.",
  options: [
    { id: "a", text: "Because the field was being cleaned after the big team party." },
    { id: "b", text: "Because there is lightning and a storm is not safe." },
    { id: "c", text: "Because the students asked to stay inside." },
  ],
  answer: "b",
};

test("diagnosis: a replaced detail is a late correction and points at the correcting part", () => {
  const d = diagnoseListening(storm, "a");
  assert.equal(d.trap, "late-correction");
  assert.equal(d.segment, 3);
  assert.match(d.message, /instead of the field/);
});

test("diagnosis: a negation the choice ignores", () => {
  const supplies = {
    type: "multiSelect",
    prompt: "What do you need for math today?",
    script: "For math today, you need a pencil and a ruler. You do not need crayons.",
    options: [
      { id: "a", text: "Crayons" },
      { id: "b", text: "A pencil" },
      { id: "c", text: "Scissors" },
      { id: "d", text: "A ruler" },
    ],
    answers: ["b", "d"],
  };
  const d = diagnoseListening(supplies, ["b", "a"]);
  assert.equal(d.trap, "missed-negation");
  assert.equal(d.segment, 1);
  assert.match(d.message, /“not”/);
});

test("diagnosis: an order item out of sequence prompts the part with the misplaced step", () => {
  const drill = {
    type: "order",
    script:
      "First, stop your work. Next, line up at the door. Then walk to the exit. Finally, wait outside.",
    items: [
      { id: "i1", text: "Stop your work" },
      { id: "i2", text: "Line up at the door" },
      { id: "i3", text: "Walk to the exit" },
      { id: "i4", text: "Wait outside" },
    ],
    answer: ["i1", "i2", "i3", "i4"],
  };
  const d = diagnoseListening(drill, ["i1", "i3", "i2", "i4"]);
  assert.equal(d.trap, "missed-sequence");
  assert.equal(d.segment, 1);
  assert.equal(diagnoseListening(drill, drill.answer), null);
});

test("diagnosis: a familiar heard word that does not answer the question", () => {
  const maya = {
    type: "multipleChoice",
    prompt: "Where will Maya go?",
    script: "After lunch, Maya will return her science notebook to the library.",
    options: [
      { id: "a", text: "to the library" },
      { id: "b", text: "to lunch" },
      { id: "c", text: "to science class" },
    ],
    answer: "a",
  };
  const d = diagnoseListening(maya, "b");
  assert.equal(d.trap, "familiar-word");
  assert.equal(d.word, "lunch");
  assert.match(d.message, /Where will Maya go\?/);
});

test("diagnosis: authored distractor metadata wins; silence when nothing clearly applies", () => {
  const authored = {
    ...storm,
    options: storm.options.map((o) => (o.id === "c" ? { ...o, distractor: "unsupported" } : o)),
  };
  assert.equal(diagnoseListening(authored, "c").trap, "unsupported");
  // An unknown tag is not a diagnosis; the rules then decide (here: nothing applies).
  const unheard = {
    type: "multipleChoice",
    prompt: "What color is the bus?",
    script: "The bus is yellow.",
    options: [
      { id: "a", text: "yellow" },
      { id: "b", text: "purple", distractor: "made-up-tag" },
    ],
    answer: "a",
  };
  assert.equal(diagnoseListening(unheard, "b"), null);
  assert.equal(diagnoseListening(storm, "b"), null, "a right answer is never diagnosed");
  assert.equal(diagnoseListening({ ...storm, script: "" }, "a"), null);
  assert.equal(diagnoseListening({ ...storm, type: "cloze" }, "a"), null);
});

test("diagnosis messages never claim a score, level or proficiency", () => {
  for (const id of ["a", "c"]) {
    const d = diagnoseListening(storm, id);
    if (d) assert.doesNotMatch(d.message, /proficien|WIDA|score|level|placement|predict/i);
  }
});

function memoryStore(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get: (k) => (map.has(k) ? map.get(k) : null),
    set: (k, v) => map.set(k, v),
    remove: (k) => map.delete(k),
    map,
  };
}

test("notes: saved per activity, clearable, and corrupt or missing storage never throws", () => {
  const store = memoryStore();
  assert.deepEqual(loadListenNotes(store, "x"), { main: "", details: "", signals: "" });
  saveListenNotes(store, "x", {
    main: "Plants need things",
    details: "sun, water",
    signals: "without",
  });
  assert.equal(loadListenNotes(store, "x").details, "sun, water");
  assert.deepEqual(
    loadListenNotes(store, "y"),
    { main: "", details: "", signals: "" },
    "notes are per activity",
  );
  clearListenNotes(store, "x");
  assert.equal(store.map.has(listenNotesKey("x")), false);
  saveListenNotes(store, "x", { main: "  " });
  assert.equal(store.map.has(listenNotesKey("x")), false, "empty notes leave nothing behind");
  assert.ok(
    !listenNotesKey("x").startsWith("accessPracticeLab:v1:"),
    "notes stay out of progress codes",
  );

  const corrupt = memoryStore({ [listenNotesKey("x")]: "{not json" });
  assert.deepEqual(loadListenNotes(corrupt, "x"), { main: "", details: "", signals: "" });
  const wrongShape = memoryStore({
    [listenNotesKey("x")]: JSON.stringify({ main: 4, details: ["a"], signals: "so" }),
  });
  assert.deepEqual(loadListenNotes(wrongShape, "x"), { main: "", details: "", signals: "so" });
  const broken = {
    get() {
      throw new Error("blocked");
    },
    set() {
      throw new Error("blocked");
    },
    remove() {
      throw new Error("blocked");
    },
  };
  assert.doesNotThrow(() => loadListenNotes(broken, "x"));
  assert.doesNotThrow(() => saveListenNotes(broken, "x", { main: "a" }));
  assert.doesNotThrow(() => clearListenNotes(broken, "x"));
  assert.doesNotThrow(() => loadListenNotes(null, "x"));
});

// ── rendered HTML: mode separation ────────────────────────────────────────────
const dom = new JSDOM('<main id="app"></main><div id="labLive"></div>', {
  url: "https://lab.test/access-practice-lab/",
});
// Fake read-aloud so the player and replay controls render; utterances "finish" immediately.
dom.window.speechSynthesis = {
  getVoices: () => [],
  speak: (u) => setTimeout(() => u.onend?.(), 0),
  cancel() {},
  addEventListener() {},
};
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = dom.window[key];
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
globalThis.CSS = { escape: (s) => String(s) };
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(
      await readFile(new URL(`../${String(url).replace(/^\//, "")}`, import.meta.url), "utf8"),
    ),
});
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { notePlay } = await import("../access-practice-lab/src/components.js");
const view = await import("../access-practice-lab/src/views/activity.js");
const ctx = {
  band: "3-5",
  prefs: {},
  route: {},
  rerender: async () => draw(),
  navigate(path) {
    history.replaceState({}, "", path);
    return draw();
  },
};
async function draw() {
  document.querySelector("#app").innerHTML = toHtml((await view.render(ctx)).html);
  view.mount(document.querySelector("#app"));
}
async function go(id, search = "") {
  ctx.route = { view: "activity", domain: "Listening", level: "A", id };
  history.replaceState({}, "", `/access-practice-lab/Listening/A/${id}${search}`);
  await draw();
}
const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
async function click(el) {
  assert.ok(el, "click target exists");
  view.onClick({ target: el, preventDefault() {} }, ctx);
  await settle();
}
const $ = (sel) => document.querySelector(sel);
const ITEM = "g35-l-a-who-read-more";
const HEARD = /12 pages last night|20 pages last night/;
const pick = (id) => click($(`[data-ans-choice][value="${id}"]`)?.closest("label.choice"));

test("Learn with help renders the strategy lab without putting the heard script on the page", async () => {
  localStorage.clear();
  await go(ITEM);
  assert.ok($(".listen-strategy"), "strategy lab present");
  assert.ok(
    $(".listen-strategy").textContent.includes("two numbers"),
    "authored listen-for focus shown",
  );
  assert.equal(document.querySelectorAll("[data-listen-note]").length, 3);
  assert.ok($("[data-clear-listen-notes]"));
  assert.equal($("[data-replay-seg]"), null, "no part replay before the first listen");
  notePlay(ITEM);
  await draw();
  assert.equal(
    document.querySelectorAll('[data-replay-seg^="bar:"]').length,
    2,
    "part replay after the first listen",
  );
  assert.doesNotMatch(
    document.querySelector("#app").innerHTML,
    HEARD,
    "no heard text before an answer",
  );
  assert.equal($(".transcript"), null);
});

test("Try independently hides strategy hints, transcript previews and signal highlights but keeps player controls", async () => {
  localStorage.clear();
  await go(ITEM, "?mode=independent");
  const page = () => document.querySelector("#app").innerHTML;
  for (const sel of [
    ".listen-strategy",
    ".strategy",
    "[data-listen-note]",
    "[data-replay-seg]",
    ".signal-word",
    ".listen-trap",
  ])
    assert.equal($(sel), null, `${sel} hidden before answering`);
  assert.doesNotMatch(page(), HEARD);
  assert.ok($("[data-listen]"), "play button kept");
  assert.ok($("[data-stop-audio]"), "stop control kept");
  assert.equal(document.querySelectorAll(".speed-btn[data-rate]").length, 2, "speed controls kept");
  await pick("b");
  await click($("[data-check]"));
  for (const sel of [
    ".listen-strategy",
    "[data-replay-seg]",
    ".signal-word",
    ".listen-trap",
    "[data-tag-signal]",
  ])
    assert.equal($(sel), null, `${sel} hidden after a miss`);
  assert.ok($(".transcript:not(.is-interactive)"), "plain transcript after answering");
  assert.ok(
    $("[data-stop-audio]") && $(".speed-btn[data-rate]"),
    "controls still there after answering",
  );
});

test("Learn with help: a distractor gets a diagnosis, the answer waits for the targeted replay", async () => {
  localStorage.clear();
  await go("g35-l-a-math-supplies"); // leave the item so its checked state from the previous test resets
  await go(ITEM);
  await pick("b");
  await click($("[data-check]"));
  const trap = $(".listen-trap");
  assert.ok(trap, "diagnosis shown");
  assert.match(trap.textContent, /Diego/);
  assert.ok($('[data-replay-seg="trap:0"]'), "targeted replay offered");
  assert.ok($(".transcript.is-interactive li.is-target"), "transcript marks the part to replay");

  await click($("[data-retry]"));
  await pick("b");
  await click($("[data-check]"));
  assert.match($(".listen-trap .fb-title").textContent, /Before you see the answer/);
  assert.equal($(".feedback.is-shown"), null, "answer held back before the replay");
  assert.equal($(".choice.is-answer"), null, "correct option not marked before the replay");

  await click($('[data-replay-seg="trap:0"]'));
  await settle(400);
  assert.ok($(".feedback.is-shown"), "answer revealed after the replay");
  assert.match($(".feedback.is-shown").textContent, /Amara/);
  assert.ok($(".choice.is-answer"), "correct option marked after the replay");
});

test("Learn with help: signal-word tags toggle with aria-pressed and notes persist locally", async () => {
  localStorage.clear();
  const lab = "g35-l-a-math-supplies";
  await go(lab);
  await pick("a");
  await click($("[data-check]"));
  const signal = $(".signal-word");
  assert.ok(signal, "signal words are taggable in the interactive transcript");
  assert.equal(signal.getAttribute("aria-pressed"), "false");
  await click(signal);
  assert.equal(
    $(`[data-tag-signal="${signal.dataset.tagSignal}"]`).getAttribute("aria-pressed"),
    "true",
  );
  const box = $('[data-listen-note="main"]');
  box.value = "Bring a pencil and a ruler";
  view.onInput({ target: box });
  assert.equal(
    JSON.parse(localStorage.getItem(listenNotesKey(lab))).main,
    "Bring a pencil and a ruler",
  );
  await click($("[data-clear-listen-notes]"));
  assert.equal(localStorage.getItem(listenNotesKey(lab)), null);
});
