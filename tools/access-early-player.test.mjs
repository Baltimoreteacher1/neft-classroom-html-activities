// K–3 grade bands and the audio-first player (access-practice-lab/src/bands.js, src/early/player.js).
// Pure band logic, the spoken plan, and the player mounted in JSDOM on a real grades 3–5 activity: directions are
// spoken, replay is the only help, a wrong answer keeps every choice and never shows the answer, and the result is
// written to the same practice record the classic page uses.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!doctype html><body><main id='app'></main><div id='labLive'></div></body>",
  { url: "https://thelanguagepage.com/access-practice-lab/Listening/A/x?grades=4-5" },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.location = dom.window.location;
globalThis.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
const spoken = [];
// A speech engine that records what it was asked to say and finishes at once.
dom.window.speechSynthesis = {
  speak: (u) => (spoken.push({ text: u.text, lang: u.lang }), setTimeout(() => u.onend?.(), 0)),
  cancel() {},
  getVoices: () => [],
};
dom.window.SpeechSynthesisUtterance = class {
  constructor(t) {
    this.text = t;
  }
};
globalThis.SpeechSynthesisUtterance = dom.window.SpeechSynthesisUtterance;
globalThis.speechSynthesis = dom.window.speechSynthesis;

const B = await import("../access-practice-lab/src/bands.js");
const P = await import("../access-practice-lab/src/early/player.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const store = await import("../access-practice-lab/src/store.js");
const { loadBand } = await import("./lib/access-lab-content.mjs");

test("band registry: picker ids, content bands, id prefixes", () => {
  assert.deepEqual(B.CONTENT_BANDS, ["K", "1", "2-3", "3-5", "6-8"]);
  assert.equal(B.normalizeBand("4-5"), "3-5");
  assert.equal(B.normalizeBand("3-5"), "3-5");
  assert.equal(B.normalizeBand("K"), "K");
  assert.equal(B.normalizeBand("9-12"), "");
  assert.equal(B.bandOfId("gk-story-garden"), "K");
  assert.equal(B.bandOfId("g1-l-a-pet"), "1");
  assert.equal(B.bandOfId("g23-s-a-park"), "2-3");
  assert.equal(B.bandOfId("g35-l-a-classroom-place"), "3-5");
  assert.equal(B.bandOfId("listening-a-1"), "6-8");
  const picker = B.gradeBandsIndex(B.CONTENT_BANDS).map((b) => b.id);
  assert.deepEqual(
    picker,
    ["K", "1", "2-3", "4-5", "6-8"],
    "homepage picker ids are exactly K, 1, 2-3, 4-5, 6-8",
  );
  for (const b of B.gradeBandsIndex(B.CONTENT_BANDS))
    assert.equal(B.normalizeBand(b.id), b.contentBand);
});

test("audio-first is a band setting: on for K–3 by default, a stored choice wins", () => {
  for (const b of ["K", "1", "2-3"]) assert.equal(B.audioFirstOn({}, b), true);
  for (const b of ["3-5", "6-8"]) assert.equal(B.audioFirstOn({}, b), false);
  assert.equal(B.audioFirstOn({ audioFirst: { K: false } }, "K"), false);
  assert.equal(B.audioFirstOn({ audioFirst: { "3-5": true } }, "3-5"), true);
  const a = { type: "multipleChoice" };
  assert.equal(P.usesAudioFirst({}, "1", a, ""), true);
  assert.equal(
    P.usesAudioFirst({}, "1", a, "?view=classic"),
    false,
    "?view=classic opens the classic page",
  );
  assert.equal(
    P.usesAudioFirst({}, "1", { type: "cloze" }, ""),
    false,
    "types without a picture presentation stay classic",
  );
});

test("spoken plan: directions, the heard text and the question; Spanish by language mode", () => {
  const a = {
    directions: "Listen.",
    directionsEs: "Escucha.",
    script: "Mia waters the beans.",
    prompt: "Who waters?",
    promptEs: "¿Quién riega?",
  };
  const en = P.spokenPlan(a, "Listening", "en");
  assert.deepEqual(en, [
    { lang: "en-US", lines: ["Listen.", "Mia waters the beans.", "Who waters?"] },
  ]);
  assert.deepEqual(
    P.spokenPlan(a, "Listening", "es").map((g) => g.lang),
    ["es-US", "en-US"],
  );
  assert.deepEqual(
    P.spokenPlan(a, "Listening", "bi").map((g) => g.lang),
    ["en-US", "es-US"],
  );
  assert.ok(
    !P.spokenPlan(a, "Reading", "en")[0].lines.includes("Mia waters the beans."),
    "only Listening speaks a script",
  );
});

test("progress keys: 6-8 unprefixed, every other band under g<band>; allRecords and export see them", () => {
  assert.equal(store.progressKey("6-8", "Listening", "A"), "accessPracticeLab:v1:Listening:A");
  assert.equal(store.progressKey("3-5", "Listening", "A"), "accessPracticeLab:v1:g3-5:Listening:A");
  assert.equal(store.progressKey("K", "Speaking", "A"), "accessPracticeLab:v1:gK:Speaking:A");
  store.saveRecord("2-3", "Reading", "B", {
    ...store.loadRecord("2-3", "Reading", "B"),
    complete: ["g23-r-b-x"],
  });
  const rec = store.allRecords().find((r) => r.band === "2-3");
  assert.ok(rec && rec.domain === "Reading" && rec.level === "B");
  const code = store.exportCode();
  const json = decodeURIComponent(escape(atob(code.slice("ACCESS1.".length))));
  assert.ok(json.includes("g2-3:Reading:B"), "the Passport export carries early-band progress");
  localStorage.clear();
  store.importCode(code);
  assert.ok(
    store.loadRecord("2-3", "Reading", "B").complete.includes("g23-r-b-x"),
    "and imports it back",
  );
  localStorage.clear();
});

function mountPlayer(band, activity, domain, level, mode = "en") {
  const I = makeI18n(mode, "en");
  const saved = [];
  const cur = {
    band,
    domain,
    level,
    activity,
    list: [activity],
    index: 0,
    record: store.loadRecord(band, domain, level),
  };
  const ctx = {
    band,
    prefs: {},
    setPrefs() {},
    rerender() {
      draw();
    },
  };
  const save = () => saved.push(JSON.parse(JSON.stringify(cur.record)));
  const root = document.getElementById("app");
  function draw() {
    root.innerHTML = toHtml(P.render(ctx, I, cur, { nav: "" }).html);
  }
  draw();
  const click = (sel) => {
    const el = root.querySelector(sel);
    assert.ok(el, `missing ${sel}`);
    return P.onClick({ target: el }, ctx, I, cur, save);
  };
  return { root, cur, ctx, I, click, saved };
}

const g35 = loadBand("3-5").find((d) => d.domain === "Listening").data;
const mc = g35.levels.A.activities.find(
  (a) => a.type === "multipleChoice" && a.options.every((o) => o.visual || o.picture),
);

test("player: big replay, picture choices with a speaker each, no hints; a miss keeps every choice", async () => {
  assert.ok(mc, "a grades 3–5 picture multiple-choice activity exists");
  const { root, cur, click, saved } = mountPlayer("3-5", mc, "Listening", "A");
  assert.ok(root.querySelector("[data-early-replay]"), "replay button");
  assert.ok(root.querySelector("[data-early-story]"), "Listening offers 'hear the story again'");
  const picks = root.querySelectorAll("[data-early-pick]");
  assert.equal(picks.length, mc.options.length);
  assert.equal(
    root.querySelectorAll("[data-early-say-opt]").length,
    mc.options.length,
    "every choice can be heard",
  );
  assert.ok(!root.textContent.includes(mc.hint), "no hint text in the audio-first player");
  assert.ok(
    !root.textContent.includes(String(mc.script).slice(0, 40)),
    "the heard text is never printed",
  );
  for (const b of root.querySelectorAll("button.early-pick, .early-big"))
    assert.ok(b.className.includes("early"), "large-target classes");
  const wrong = mc.options.find((o) => o.id !== mc.answer);
  click(`[data-early-pick="${wrong.id}"]`);
  click("[data-early-check]");
  assert.equal(
    root.querySelectorAll("[data-early-pick]").length,
    mc.options.length,
    "all choices remain after a miss",
  );
  const fb = root.querySelector(".early-feedback").textContent;
  assert.ok(/Not yet/.test(fb));
  assert.ok(
    !fb.includes(mc.options.find((o) => o.id === mc.answer).text),
    "a miss never shows the right answer",
  );
  click(`[data-early-pick="${mc.answer}"]`);
  click("[data-early-check]");
  assert.ok(/Yes!/.test(root.querySelector(".early-feedback").textContent));
  const result = cur.record.results[mc.id];
  assert.equal(result.ok, true);
  assert.equal(
    result.evidence,
    "supported",
    "success after a miss is supported, never independent",
  );
  assert.equal(result.mode, "audio-first");
  assert.ok(cur.record.complete.includes(mc.id));
  assert.ok(saved.length >= 2);
  localStorage.clear();
});

test("player speaks directions on open, in Spanish first in Español mode", async () => {
  spoken.length = 0;
  const a = {
    ...mc,
    id: "g35-test-spoken",
    directionsEs: "Escucha y toca un dibujo.",
    promptEs: "¿Qué oíste?",
  };
  const { root, ctx, I, cur } = mountPlayer("3-5", a, "Listening", "A", "es");
  P.mount(root, ctx, I, cur);
  await new Promise((r) => setTimeout(r, 2500));
  assert.ok(spoken.length >= 3, `spoke ${spoken.length} lines`);
  assert.equal(spoken[0].text, "Escucha y toca un dibujo.");
  assert.equal(spoken[0].lang, "es-US");
  assert.ok(spoken.some((s) => s.text === a.directions && s.lang === "en-US"));
  P.unmount();
});

test("speaking and paper writing: model student, recorder, print page, practiced (not scored)", () => {
  const speakA = {
    id: "g23-test-talk",
    type: "constructed",
    title: "Talk",
    directions: "Tell about the park.",
    prompt: "What do you see?",
    frames: ["I see ___."],
    modelStudent: { name: "Leo", text: "I see a slide." },
    taskLevel: 1,
    scene: "playground",
  };
  const s = mountPlayer("2-3", speakA, "Speaking", "A");
  assert.ok(s.root.querySelector("[data-early-model]").textContent.includes("Leo"));
  assert.ok(s.root.querySelector(".early-scene svg title"), "scene drawn with a title");
  assert.ok(/practice task, not a test level/.test(s.root.textContent));
  s.click("[data-early-done]");
  assert.equal(s.cur.record.results[speakA.id].evidence, "practiced");
  assert.equal(s.cur.record.results[speakA.id].total, 0, "speaking is never auto-scored");
  const writeA = {
    id: "g23-test-write",
    type: "constructed",
    title: "Write",
    directions: "Write about lunch.",
    prompt: "What do you eat?",
    frames: ["I eat ___."],
    wordBank: ["apple", "rice"],
    scene: "lunch-share",
  };
  const w = mountPlayer("2-3", writeA, "Writing", "A");
  const paper = w.root.querySelector(".early-paper");
  assert.ok(
    paper && paper.querySelectorAll(".early-paper-line").length === 5,
    "grades 2–3 get five handwriting lines",
  );
  assert.ok(paper.textContent.includes("apple · rice"));
  assert.ok(w.root.querySelector("[data-early-print]"));
  localStorage.clear();
});
