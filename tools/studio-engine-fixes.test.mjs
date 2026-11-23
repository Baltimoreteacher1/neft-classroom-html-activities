// Regression tests for the engine bugs reported by content authors (speech watchdog, early-sort, visual-match,
// conversation-studio language, concept-builder display). Pure logic plus jsdom click-throughs through the real
// mount contract. Run: node --test tools/studio-engine-fixes.test.mjs
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { mock, test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  feedbackText,
  freshRoot,
  loadActivity,
  press,
  setupDom,
  tick,
} from "./studio-engines-4-fixtures.mjs";

const STUDIO = resolve(new URL("..", import.meta.url).pathname, "bcpss-teachers/studio");
const mod = (rel) => import(pathToFileURL(resolve(STUDIO, rel)).href);
setupDom();

// A speech engine that accepts speak() and then never reports anything: the headless Chromium failure.
const spoken = [];
let cancels = 0;
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
const brokenEngine = {
  getVoices: () => [],
  addEventListener() {},
  cancel() {
    cancels += 1;
  },
  speak(u) {
    spoken.push(u);
  },
};
globalThis.speechSynthesis = brokenEngine;
const speech = await mod("core/speech.js");
const { createContext, createItemLoop } = await mod("engines/engine-core.js");

// ======================================================================= 1. speech watchdog
test("speak: a broken engine that never fires start or end still resolves, and cancels", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const before = cancels;
    let result = "pending";
    speech.speak("Look at the picture").then((v) => (result = v));
    await Promise.resolve();
    mock.timers.tick(2900);
    await Promise.resolve();
    assert.equal(result, "pending", "waits a little for the engine to start");
    mock.timers.tick(200);
    await Promise.resolve();
    assert.equal(result, false, "gives up when playback never starts");
    assert.ok(cancels > before + 1, "the stuck utterance is cancelled");
  } finally {
    mock.timers.reset();
  }
});

test("speak: playback that starts but never ends is cut at a reading-time limit; normal speech resolves true", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    let result = "pending";
    const text = "A short line.";
    speech.speak(text).then((v) => (result = v));
    await Promise.resolve();
    spoken.at(-1).onstart();
    mock.timers.tick(3500);
    await Promise.resolve();
    assert.equal(result, "pending", "started speech is not cut at the start limit");
    mock.timers.tick(speech.speechTimeouts(text).endMs);
    await Promise.resolve();
    assert.equal(result, false);

    let ok = "pending";
    speech.speak("Hello").then((v) => (ok = v));
    await Promise.resolve();
    spoken.at(-1).onstart();
    spoken.at(-1).onend();
    await Promise.resolve();
    assert.equal(ok, true);
  } finally {
    mock.timers.reset();
  }
});

test("speechTimeouts: longer text gets more time, capped", () => {
  const short = speech.speechTimeouts("Hi");
  const long = speech.speechTimeouts("word ".repeat(80));
  assert.ok(long.endMs > short.endMs);
  assert.ok(speech.speechTimeouts("x".repeat(100000)).endMs <= 60000);
});

// Everything below uses the browser-less path (speak resolves at once) so the click-throughs stay simple.
test("speech engine removed for the click-throughs", () => {
  delete globalThis.speechSynthesis;
  assert.equal(speech.canSpeak(), false);
});

async function mountEngine(activity, { tier = "dev" } = {}) {
  const root = freshRoot();
  const ctx = createContext({ root, activity, tier, onDone() {} });
  const engine = (await mod(`engines/${activity.engine}.js`)).default;
  await engine.mount(ctx);
  await tick(5);
  return { root, ctx };
}
const icon = (name, alt) => ({ kind: "icon", name, alt });
const envelope = (id, extra) => ({
  id,
  engine: "early-sort",
  title: "Fix test",
  grade: "K",
  band: "k-2",
  subject: "ela",
  standards: ["K.RF.2"],
  minutes: 5,
  intro: "Let's play together.",
  reflection: {
    prompt: "Tell someone one thing you did.",
    frames: { ee: ["I did"], dev: ["I did"], exp: ["I did"], br: [] },
  },
  ...extra,
});
const text = (root) => root.textContent;

// ======================================================================= 2a. early-sort: no "null"
test("early-sort: an absent grown-up box never prints the text null", async () => {
  const a = envelope("fix-null", {
    mode: "syllable-clap",
    prompt: "Clap the parts.",
    items: [{ id: "c1", word: "dog", visual: icon("dog", "A dog"), syllables: ["dog"] }],
  });
  const { root } = await mountEngine(a);
  assert.ok(!/null/.test(text(root)), "intro");
  press(root, "Let's start");
  assert.ok(!/null/.test(text(root)), "item screen");
  press(root, "Tap the beat");
  press(root, "That's all");
  await tick(20);
  press(root, "All done");
  assert.ok(!/null/.test(text(root)), "reflection screen");
});

// ======================================================================= 2b. third miss: model slot, hint separate
test("early-sort retryText: a hint-only misconception does not stand in for the model", async () => {
  const kit = await mod("engines/early-sort-kit.js");
  const spec = kit.loopItem({
    id: "x",
    model: "Dog starts with d.",
    misconceptions: [
      { pick: "cat", tag: "t", hint: "Listen to the first sound." },
      { pick: "cow", tag: "t", hint: "Listen again.", model: "Cow starts with k." },
    ],
  });
  const loop = createItemLoop(spec);
  loop.submit({ ok: false, pick: "cat" });
  loop.submit({ ok: false, pick: "cat" });
  const third = loop.submit({ ok: false, pick: "cat" });
  assert.equal(third.kind, "model");
  assert.equal(kit.retryText(third, spec, "cat"), "Listen to the first sound. Dog starts with d.");
  const loop2 = createItemLoop(spec);
  for (let i = 0; i < 2; i++) loop2.submit({ ok: false, pick: "cow" });
  const own = loop2.submit({ ok: false, pick: "cow" });
  assert.equal(kit.retryText(own, spec, "cow"), "Listen again. Cow starts with k.");
  const loop3 = createItemLoop(kit.loopItem({ id: "y" }));
  for (let i = 0; i < 2; i++) loop3.submit({ ok: false, pick: "z" });
  const none = loop3.submit({ ok: false, pick: "z" });
  assert.equal(kit.retryText(none, kit.loopItem({ id: "y" }), "z"), kit.DEFAULT_MODEL);
});

// ======================================================================= 2c. sound-match honours trial misconceptions
const soundActivity = () =>
  envelope("fix-sound", {
    mode: "sound-match",
    kind: "beginning",
    prompt: "Which picture starts like ball?",
    trials: [
      {
        id: "t1",
        cue: { word: "ball", visual: icon("ball", "A ball") },
        choices: [
          { id: "bus", word: "bus", visual: icon("bus", "A bus") },
          { id: "cup", word: "cup", visual: icon("cup", "A cup") },
        ],
        answer: "bus",
        misconceptions: [
          {
            pick: "cup",
            tag: "different-sound",
            hint: "Say ball, then cup. Do they start the same?",
          },
        ],
      },
    ],
  });
test("sound-match: a trial-level misconception hint reaches the child and the tag is recorded", async () => {
  const { root, ctx } = await mountEngine(soundActivity());
  press(root, "Let's start");
  const cup = () => root.querySelector('[data-choice="cup"]');
  cup().click();
  assert.match(feedbackText(root), /Say ball, then cup/);
  cup().click();
  cup().click();
  const third = feedbackText(root);
  assert.match(third, /Say ball, then cup/, "the hint leads the third-miss text");
  assert.match(third, /Let's do this one together\./, "the model follows the hint");
  root.querySelector('[data-choice="bus"]').click();
  assert.deepEqual([...ctx.items.values()][0].tags, ["different-sound"]);
});

// ======================================================================= 2d. picture-sort article
test("picture-sort: success text never says 'A apple' or 'A umbrella'", async () => {
  const items = ["apple", "elephant", "umbrella"].map((w) => ({
    id: w,
    word: w,
    visual: icon("star", `A ${w}`),
    category: "things",
  }));
  const a = envelope("fix-article", {
    mode: "picture-sort",
    prompt: "Sort the pictures.",
    categories: [
      { id: "things", label: "things", visual: icon("star", "Things") },
      { id: "other", label: "other", visual: icon("star", "Other") },
    ],
    items,
  });
  const { root } = await mountEngine(a);
  press(root, "Let's start");
  for (const it of items) {
    const word = root.querySelector(".st-es-itemcard .st-es-word").textContent;
    root.querySelector('[data-drop="things"]').click();
    const fb = root.querySelector(".st-es-fb").textContent;
    assert.ok(!/\bA (a|e|i|o|u)/i.test(fb), fb);
    assert.ok(fb.includes(word), fb);
    const last = [...root.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "All done",
    );
    press(root, last ? "All done" : "Next");
  }
});

// ======================================================================= 2e. syllable-clap chunks stay after the model
test("syllable-clap: the revealed parts stay on screen after the model, until the next tap", async () => {
  const a = envelope("fix-clap", {
    mode: "syllable-clap",
    prompt: "Clap the parts.",
    items: [
      {
        id: "c1",
        word: "butterfly",
        visual: icon("butterfly", "A butterfly"),
        syllables: ["but", "ter", "fly"],
      },
    ],
  });
  const { root } = await mountEngine(a);
  press(root, "Let's start");
  for (let i = 0; i < 3; i++) {
    press(root, "Tap the beat");
    press(root, "That's all");
    await tick(20);
  }
  const chunks = [...root.querySelectorAll(".st-es-chunk")].map((n) => n.textContent);
  assert.deepEqual(chunks, ["but", "ter", "fly"]);
  press(root, "Tap the beat");
  assert.equal(root.querySelectorAll(".st-es-chunk").length, 0, "a new tap starts a fresh count");
  assert.equal(root.querySelectorAll(".st-es-beat").length, 1);
});

// ======================================================================= 3. visual-match
const plants = async () => structuredClone(await loadActivity("g1-science-plant-parts-match"));
async function missThrice(activity) {
  const { root } = await mountEngine(activity);
  press(root, "Start matching");
  const slot = root.querySelector('[data-drop^="p:"]');
  const pairId = slot.dataset.drop.slice(2);
  const wrong = [...root.querySelectorAll("[data-chip]")].find(
    (c) => c.dataset.chip !== `c:${pairId}` && c.dataset.chip.startsWith("c:"),
  );
  for (let i = 0; i < 3; i++) {
    root.querySelector(`[data-chip="${wrong.dataset.chip}"]`).click();
    slot.querySelector(".st-vm-target").click();
  }
  return { root, pairId, wrongId: wrong.dataset.chip.slice(2) };
}
test("visual-match: the third miss prints 'Look at the model' once when no confusion carries a model", async () => {
  const a = await plants();
  for (const p of a.pairs) p.confusions = [];
  const { root } = await missThrice(a);
  const t = feedbackText(root);
  assert.equal((t.match(/look at the model/gi) || []).length, 1, t);
});
test("visual-match: a confusion with a hint but no model shows the pair explanation, not the hint, under the model label", async () => {
  const a = await plants();
  const { root, pairId, wrongId } = await (async () => {
    const probe = await missThrice(structuredClone(a));
    return probe;
  })();
  const pair = a.pairs.find((p) => p.id === pairId);
  const t = feedbackText(root);
  assert.equal((t.match(/look at the model/gi) || []).length, 1, t);
  assert.ok(t.includes(pair.why), t);
  const c = pair.confusions?.find((x) => x.pick === wrongId);
  if (c?.hint) assert.ok(!t.includes(c.hint), "hint is not presented as the model");
});
test("visual-match: an authored model that already starts with the label is not repeated", async () => {
  const vm = await mod("engines/visual-match-model.js");
  assert.equal(vm.stripModelLead("Look at the model. A seed is small."), "A seed is small.");
  assert.equal(vm.stripModelLead("A seed is small."), "A seed is small.");
});
test("visual-match: activity.speechLang is the language cards and terms are read in", async () => {
  const run = async (speechLang) => {
    const a = await plants();
    if (speechLang) a.speechLang = speechLang;
    const root = freshRoot();
    const ctx = createContext({ root, activity: a, tier: "dev", onDone() {} });
    const langs = [];
    ctx.speak = (t, o) => (langs.push(o?.lang), Promise.resolve(true));
    await (await mod("engines/visual-match.js")).default.mount(ctx);
    await tick(5);
    press(root, "Start matching");
    root.querySelector('[data-chip^="c:"]').click();
    return langs;
  };
  assert.deepEqual(await run("es-US"), ["es-US"]);
  assert.deepEqual(await run(undefined), ["en-US"], "default is unchanged");
});

// ======================================================================= 4. conversation-studio language
test("conversation: speechOpts prefers the line's lang, then the activity's speechLang, else the default", async () => {
  const { speechOpts, isLangTag } = await mod("engines/conversation-parts/conv-logic.js");
  assert.deepEqual(speechOpts({ speechLang: "es-US" }, { say: "Hola" }), { lang: "es-US" });
  assert.deepEqual(speechOpts({ speechLang: "es-US" }, { lang: "en-US" }), { lang: "en-US" });
  assert.deepEqual(speechOpts({}, { say: "Hi" }), {});
  assert.ok(isLangTag("es-US") && isLangTag("es") && !isLangTag("Spanish") && !isLangTag(""));
});
test("conversation: Listen and Hear an example pass the activity (or line) language to speak()", async () => {
  const a = structuredClone(await loadActivity("g6-vars-conversation"));
  a.speechLang = "es-US";
  const purpose = a.purposes[0];
  const turns = purpose.rehearsal.turns;
  const firstLearner = turns.find((t) => t.speaker === "you");
  const partnerTurn = turns.find((t) => t.speaker === "partner");
  partnerTurn.lang = "en-US";
  const calls = [];
  const root = freshRoot();
  const ctx = createContext({ root, activity: a, tier: "dev", onDone() {} });
  ctx.speak = (t, o) => (calls.push({ t, lang: o?.lang }), Promise.resolve(true));
  const moveById = (id) => a.moves.find((m) => m.id === id);
  const env = {
    ctx,
    activity: a,
    st: {},
    roles: a.roles,
    purpose: () => purpose,
    purposeOrFirst: () => purpose,
    moveById,
    loopFor: (id, o) => ctx.loop({ id, ...o }),
    settle() {},
    save() {},
    go() {},
  };
  const { rehearseStep } = await mod("engines/conversation-parts/conv-talk.js");
  const { pairView } = await mod("engines/conversation-parts/conv-pair.js");
  const step = rehearseStep(env);
  root.append(step.el);
  const click = (label) =>
    [...root.querySelectorAll("button")].find((b) => b.textContent.trim() === label).click();
  click("Listen");
  assert.deepEqual(
    calls.at(-1),
    { t: partnerTurn.say, lang: "en-US" },
    "a line's own lang beats the activity language",
  );
  partnerTurn.lang = undefined;
  click("Listen");
  assert.deepEqual(calls.at(-1), { t: partnerTurn.say, lang: "es-US" });
  click("Hear an example");
  assert.deepEqual(calls.at(-1), { t: moveById(firstLearner.moveId).example, lang: "es-US" });
  const pair = pairView(env, {});
  root.append(pair.el);
  [...root.querySelectorAll(".st-cv-pair button")]
    .find((b) => b.textContent.trim() === "Listen")
    ?.click();
  assert.equal(calls.at(-1).lang, "es-US");
  const none = structuredClone(a);
  delete none.speechLang;
  assert.equal(
    (await mod("engines/conversation-parts/conv-logic.js")).speechOpts(none, partnerTurn).lang,
    undefined,
  );
});
test("conversation: the validator accepts a language tag and rejects anything else", async () => {
  const CV = await mod("engines/conversation-parts/validate.js");
  const a = structuredClone(await loadActivity("g6-vars-conversation"));
  assert.deepEqual(await CV.validateConversationActivity(a), []);
  a.speechLang = "es-US";
  a.moves[0].lang = "es";
  assert.deepEqual(await CV.validateConversationActivity(a), []);
  a.speechLang = "Spanish";
  a.moves[0].lang = "xx yy";
  const problems = await CV.validateConversationActivity(a);
  assert.equal(problems.filter((m) => /language tag/.test(m)).length, 2, problems.join("|"));
});

// ======================================================================= 5. concept-builder
test("concept-builder: sentence() ends a sentence exactly once", async () => {
  const { sentence } = await mod("engines/concept-kinds/shared.js");
  assert.equal(sentence("mild to extreme: a, b."), "mild to extreme: a, b.");
  assert.equal(sentence("mild to extreme: a, b"), "mild to extreme: a, b.");
  assert.equal(sentence("Which one?"), "Which one?");
});
test("scale-sort: describe() text composed into feedback has no double period", async () => {
  const { sentence } = await mod("engines/concept-kinds/shared.js");
  const kind = (await mod("engines/concept-kinds/scale-sort.js")).default;
  const m = {
    axis: { low: "mild", high: "extreme" },
    items: [
      { id: "a", text: "It is cool." },
      { id: "b", text: "It is freezing." },
      { id: "c", text: "It is icy." },
    ],
  };
  const line = `That works. ${sentence(kind.describe(m, { order: ["a", "b", "c"] }))}`;
  assert.ok(!/\.\./.test(line), line);
});

const { Fraction, fmtFor } = await mod("engines/concept-kinds/rational.js");
test("fmtFor: item format beats model format; default stays a fraction", () => {
  const v = Fraction.parse("-7/5");
  assert.equal(fmtFor(v), "-7/5");
  assert.equal(fmtFor(v, {}, {}), "-7/5");
  assert.equal(fmtFor(v, undefined, { format: "decimal" }), "-1.40");
  assert.equal(fmtFor(v, { format: "decimal", decimals: 1 }, { format: "fraction" }), "-1.4");
  assert.equal(fmtFor(v, { format: "mixed" }), "-1 2/5");
});

test("graph-line: format:'decimal' prints decimals everywhere and the default is unchanged", async () => {
  const kind = (await mod("engines/concept-kinds/graph-line.js")).default;
  const base = {
    xLabel: "x",
    yLabel: "y",
    xmin: "-5",
    xmax: "5",
    ymin: "-5",
    ymax: "5",
    points: [
      { id: "A", label: "A", at: ["0", "0"] },
      { id: "B", label: "B", at: ["2", "1"] },
    ],
  };
  const state = { pts: { A: ["0", "1"], B: ["2", "6"] } };
  assert.match(kind.describe(base, state), /5\/2x \+ 1/);
  const dec = { ...base, format: "decimal", decimals: 1 };
  assert.match(kind.describe(dec, state), /y = 2\.5x \+ 1\.0/);
  assert.deepEqual(
    kind.validateModel({ ...dec, format: "percent" }).filter((p) => /format/.test(p)).length,
    1,
  );
  assert.deepEqual(kind.validateModel(dec), []);
  const v = kind.value(base, state);
  assert.equal(v.slope, "5/2", "value() stays exact");

  const root = freshRoot();
  const widget = kind.mount(root, { model: dec, state, onChange() {}, announce() {} });
  void widget;
  const status = root.querySelector(".st-cb-readout").textContent;
  assert.match(status, /2\.5x/);
  assert.ok(!/\d\/\d/.test(status), status);
  assert.ok(![...root.querySelectorAll(".st-cb-table td")].some((td) => /\//.test(td.textContent)));
  const root2 = freshRoot();
  kind.mount(root2, { model: base, state, onChange() {}, announce() {} });
  assert.match(root2.querySelector(".st-cb-readout").textContent, /5\/2x/);
});

test("process-model: format:'decimal' on the model or an item prints decimals; default prints fractions", async () => {
  const kind = (await mod("engines/concept-kinds/process-model.js")).default;
  const model = (extra = {}, vExtra = {}, oExtra = {}) => ({
    ...extra,
    variables: [
      {
        id: "v",
        label: "Amount",
        type: "slider",
        min: "-7/5",
        max: "5/2",
        step: "1/5",
        start: "-7/5",
        ...vExtra,
      },
    ],
    outputs: [
      {
        id: "o",
        label: "Result",
        min: "-7/5",
        max: "5/2",
        ...oExtra,
        rules: [
          { when: [{ var: "v", op: "ge", value: "0" }], value: "5/2", say: "High.", ruleId: "hi" },
          { when: [], value: "-7/5", say: "Low.", ruleId: "lo" },
        ],
      },
    ],
  });
  const s = { vars: { v: "-7/5" }, log: [] };
  assert.match(kind.describe(model(), s), /Amount -7\/5 gives Result -7\/5/);
  assert.match(
    kind.describe(model({ format: "decimal", decimals: 1 }), s),
    /Amount -1\.4 gives Result -1\.4/,
  );
  assert.match(
    kind.describe(model({}, { format: "decimal" }, {}), s),
    /Amount -1\.40 gives Result -7\/5/,
    "per-variable format",
  );
  assert.deepEqual(
    kind.validateModel(model({ format: "bogus" })).filter((p) => /format/.test(p)).length,
    1,
  );
  const root = freshRoot();
  kind.mount(root, {
    model: model({ format: "decimal", decimals: 1 }),
    state: s,
    onChange() {},
    announce() {},
  });
  assert.ok(!/\d\/\d/.test(root.textContent.replace(/gives/g, "")), root.textContent);
  assert.match(root.querySelector(".st-cb-pm-out strong").textContent, /Result: -1\.4/);
});

test("map-hotspots: a label already drawn in the picture is not printed again on the hotspot", async () => {
  const kind = (await mod("engines/concept-kinds/map-hotspots.js")).default;
  const model = (visualRegions, extra = {}) => ({
    visual: {
      kind: "map",
      alt: "A strip map of two regions side by side.",
      w: 200,
      h: 100,
      regions: visualRegions,
    },
    regions: [
      { id: "a", label: "Hills", rect: [0, 0, 100, 100] },
      { id: "b", label: "Coast", rect: [100, 0, 100, 100] },
    ],
    ...extra,
  });
  const labels = async (m) => {
    const root = freshRoot();
    await kind.mount(root, { model: m, state: { selected: [] }, onChange() {}, announce() {} });
    return [...root.querySelectorAll(".st-cb-region-text")].map((n) => n.textContent);
  };
  assert.deepEqual(
    await labels(
      model([
        { id: "a", label: "Hills", rect: [0, 0, 100, 100] },
        { id: "b", rect: [100, 0, 100, 100] },
      ]),
    ),
    ["Coast"],
    "only the label the picture lacks is drawn",
  );
  assert.deepEqual(
    await labels(model([{ id: "a", rect: [0, 0, 100, 100] }])),
    ["Hills", "Coast"],
    "unlabelled pictures keep the engine labels",
  );
  assert.deepEqual(await labels(model([], { showLabels: false })), []);
  const root = freshRoot();
  await kind.mount(root, {
    model: model([{ id: "a", label: "hills", rect: [0, 0, 100, 100] }]),
    state: { selected: [] },
    onChange() {},
    announce() {},
  });
  assert.equal(
    root.querySelector('[data-region="a"]').getAttribute("aria-label"),
    "Hills",
    "the hotspot keeps its accessible name",
  );
});
