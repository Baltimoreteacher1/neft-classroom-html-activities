// Pure-logic checks for the Fluency Lab tour: saved state, the first-visit decision, launch-URL rules,
// step copy in both languages and audiences, anchor selectors against index.html, and the demo math.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEMOS, HINT_FACTS, TENFRAME_FACTS, demoHtml } from "./tour-demos.js";
import {
  AUDIENCES,
  TOUR_KEY,
  createStore,
  defaultState,
  hasLaunchIntent,
  hasSavedProgress,
  isPartial,
  loadState,
  parseState,
  partialAudience,
  requestedTour,
  saveState,
  shouldOffer,
  stateExists,
} from "./tour-state.js";
import { BUBBLES, STEPS, UI, ui } from "./tour-steps.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const memory = () => {
  const data = new Map();
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => void data.set(key, String(value)),
  };
};
const broken = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};

// ---- State: parsing is total and migration-safe ----
assert.equal(TOUR_KEY, "ewl-fluency-tour-v1");
assert.deepEqual(parseState(null), defaultState());
assert.deepEqual(parseState("not json"), defaultState());
assert.deepEqual(parseState("[1,2]"), defaultState());
assert.deepEqual(parseState('"text"'), defaultState());
const messy = parseState({
  v: 9,
  offerDismissed: "yes",
  audience: "teacher",
  steps: { student: { index: -4, done: 1 }, family: { index: "3", done: true }, extra: {} },
});
assert.equal(messy.v, 1);
assert.equal(messy.offerDismissed, false, "only literal true counts");
assert.equal(messy.audience, null);
assert.deepEqual(messy.steps.student, { index: 0, done: false });
assert.deepEqual(messy.steps.family, { index: 3, done: true });
assert.equal(parseState({ steps: { student: { index: 1e9 } } }).steps.student.index, 99);
assert.deepEqual(Object.keys(parseState({ name: "Sam", steps: {} })).sort(), ["audience", "offerDismissed", "steps", "v"]);

// ---- State: storage round trip, failures, and the in-memory fallback ----
const storage = memory();
assert.equal(stateExists(storage), false);
assert.equal(saveState(storage, { ...defaultState(), offerDismissed: true, audience: "family" }), true);
assert.equal(stateExists(storage), true);
assert.equal(loadState(storage).audience, "family");
assert.equal(saveState(broken, defaultState()), false);
assert.equal(stateExists(broken), false);
assert.deepEqual(loadState(broken), defaultState());
const offline = createStore(broken);
offline.dismissOffer();
offline.setStep("student", 4);
assert.equal(offline.get().offerDismissed, true, "state survives in memory when storage throws");
assert.equal(offline.get().steps.student.index, 4);
const store = createStore(memory());
store.setAudience("family");
store.setStep("family", 3);
assert.equal(isPartial(store.get(), "family", STEPS.family.length), true);
assert.equal(partialAudience(store.get(), { student: 9, family: 8 }), "family");
store.finish("family", 7);
assert.equal(isPartial(store.get(), "family", STEPS.family.length), false, "finished tours are not partial");
store.setStep("student", 0);
assert.equal(isPartial(store.get(), "student", 9), false, "step 1 is not partial");
store.setStep("student", 2);
store.reset("student");
assert.deepEqual(store.get().steps.student, { index: 0, done: false });

// ---- Returning users and launch URLs ----
assert.equal(hasSavedProgress([]), false);
assert.equal(hasSavedProgress(["ewl-fluency-profiles-v1", "ewl-fluency-lang-v1", "ewl-fluency-settings-v1:grade"]), false);
assert.equal(hasSavedProgress(["ewl-fluency-tour-v1", "ewl-fluency-family-adventure-v1", "ewl-family-expedition-v1"]), false);
for (const key of ["ewl-fluency-progress-v1", "ewl-fluency-tutor-v2", "ewl-fluency-session-v2", "ewl-fluency-tutor-v2:profile-2", "ewl-fluency-rewards-v1"]) {
  assert.equal(hasSavedProgress(["ewl-fluency-profiles-v1", key]), true, key);
}
assert.equal(hasLaunchIntent("?grade=3", ""), false);
for (const search of ["?start=daily", "?grade=3&skill=3:x", "?view=path", "?view=notebook"]) assert.equal(hasLaunchIntent(search, ""), true, search);
assert.equal(hasLaunchIntent("", "#assignment=abc"), true);
assert.equal(hasLaunchIntent("", "#top"), false);
assert.equal(requestedTour("?tour=family"), "family");
assert.equal(requestedTour("?grade=2&tour=student"), "student");
assert.equal(requestedTour("?tour=admin"), null);
assert.equal(requestedTour(""), null);

const first = { stateSaved: false, state: defaultState(), storageKeys: ["ewl-fluency-profiles-v1"], search: "?grade=1", hash: "", workspaceVisible: false, tourOpen: false };
assert.equal(shouldOffer(first), true, "a truly first visit gets the offer");
assert.equal(shouldOffer({ ...first, stateSaved: true }), false, "tour state already present");
assert.equal(shouldOffer({ ...first, state: { ...defaultState(), offerDismissed: true } }), false, "dismissed stays dismissed");
assert.equal(shouldOffer({ ...first, storageKeys: [...first.storageKeys, "ewl-fluency-progress-v1"] }), false, "returning user");
assert.equal(shouldOffer({ ...first, search: "?grade=3&skill=3:x" }), false);
assert.equal(shouldOffer({ ...first, search: "?start=daily" }), false);
assert.equal(shouldOffer({ ...first, search: "?view=path" }), false);
assert.equal(shouldOffer({ ...first, hash: "#assignment=abc" }), false);
assert.equal(shouldOffer({ ...first, workspaceVisible: true }), false, "never over practice");
assert.equal(shouldOffer({ ...first, tourOpen: true }), false);

// ---- Steps: both audiences, both languages, same shape ----
assert.deepEqual([...AUDIENCES].sort(), ["family", "student"]);
assert.ok(STEPS.student.length >= 8 && STEPS.family.length >= 8);
for (const audience of AUDIENCES) {
  const ids = new Set();
  for (const step of STEPS[audience]) {
    assert.ok(!ids.has(step.id), `${audience}: duplicate id ${step.id}`);
    ids.add(step.id);
    for (const lang of ["en", "es"]) {
      const copy = step[lang];
      assert.ok(copy?.title?.trim(), `${audience}/${step.id}: ${lang} title`);
      assert.ok(Array.isArray(copy?.body) && copy.body.length >= 1 && copy.body.every((line) => line.trim()), `${audience}/${step.id}: ${lang} body`);
    }
    assert.notEqual(step.en.title, step.es.title, `${audience}/${step.id}: Spanish title is translated`);
    assert.ok(step.anchor === null || typeof step.anchor === "string", `${audience}/${step.id}: anchor`);
    if (step.demo) assert.ok(DEMOS[step.demo], `${audience}/${step.id}: demo ${step.demo} exists`);
    if (step.link) assert.ok(step.link.href && step.link.en && step.link.es, `${audience}/${step.id}: link in both languages`);
  }
}
assert.equal(STEPS.student.length, new Set(STEPS.student.map((step) => step.id)).size);
const demoCount = new Set([...STEPS.student, ...STEPS.family].map((step) => step.demo).filter(Boolean));
assert.ok(demoCount.has("tenframe") && demoCount.has("hints"), "both guided demos are used");
assert.ok(STEPS.family.some((step) => step.anchor === null), "the coaching step has no anchor");
assert.equal(STEPS.family.at(-1).link.href, "./family-adventure/", "family tour ends on the Expedition");
const familyTail = STEPS.family.at(-1).link;
assert.ok(familyTail.es.startsWith("Abrir"));
// Student steps may only point at things on the library view.
const studentIds = STEPS.student.map((step) => step.id);
for (const id of ["welcome", "grade", "today", "library", "games", "mistakes", "progress", "settings", "language"]) assert.ok(studentIds.includes(id), `student step ${id}`);
const familyIds = STEPS.family.map((step) => step.id);
for (const id of ["learner", "grade", "today", "help", "progress", "tonight", "language", "expedition"]) assert.ok(familyIds.includes(id), `family step ${id}`);
// Family Spanish addresses "ustedes"; student Spanish addresses "tú" (never the plural imperative of "ustedes").
const spanish = (steps) => steps.map((step) => `${step.es.title} ${step.es.body.join(" ")}`).join(" ");
assert.match(spanish(STEPS.family), /\b(Elijan|Siéntense|Pregunten|Usen|Abran|Vean)\b/);
assert.doesNotMatch(spanish(STEPS.student), /\b(Elijan|Siéntense|Pregunten|Usen|Abran|Vean|ustedes)\b/);
assert.match(spanish(STEPS.student), /\b(Elige|Empieza|Toca|Mira|Abre|Usa)\b/);

// ---- Anchors exist in index.html unless they are marked dynamic ----
function selectorInHtml(selector) {
  const tokens = [...selector.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)="([^"]+)"\]/g)];
  assert.ok(tokens.length, `selector parsed: ${selector}`);
  return tokens.every(([, id, className, attr, value]) => {
    if (id) return html.includes(`id="${id}"`);
    if (className) return new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`).test(html);
    return html.includes(`${attr}="${value}"`);
  });
}
const anchored = [...STEPS.student, ...STEPS.family, ...BUBBLES].filter((step) => step.anchor);
for (const step of anchored) {
  if (step.dynamic) continue;
  assert.ok(selectorInHtml(step.anchor), `anchor ${step.anchor} is in index.html`);
}
assert.ok(anchored.some((step) => step.dynamic), "the dashboard card is the one dynamic anchor");
for (const step of anchored.filter((entry) => entry.dynamic)) assert.ok(step.anchor.startsWith("#personal-dashboard"), `${step.anchor} lives in the dashboard`);
assert.equal(BUBBLES.length, 3);
for (const bubble of BUBBLES) {
  assert.ok(selectorInHtml(bubble.host), `bubble host ${bubble.host}`);
  for (const lang of ["en", "es"]) assert.ok(bubble[lang].title && bubble[lang].body.length, `${bubble.id} ${lang}`);
}

// ---- The page wires the tour in ----
assert.match(html, /<link rel="stylesheet" href="\.\/tour\/tour\.css" \/>/);
assert.match(html, /<script type="module" src="\.\/tour\/tour\.js"><\/script>/);
assert.match(html, /<button id="tour-open"[^>]*data-i18n>Show me how<\/button>/);
assert.ok(html.indexOf("./tour/tour.js") < html.indexOf("./app.js"), "tour reads the launch URL before the app rewrites it");
assert.ok(html.indexOf('id="tour-open"') > html.indexOf('href="./family/"'), "button sits with the family links");

// ---- Interface strings: same keys, same placeholders ----
assert.deepEqual(Object.keys(UI.en).sort(), Object.keys(UI.es).sort());
const holes = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
for (const key of Object.keys(UI.en)) assert.equal(holes(UI.en[key]), holes(UI.es[key]), `placeholders: ${key}`);
assert.equal(ui("es", "stepOf", { n: 2, total: 9 }), "Paso 2 de 9");
assert.equal(ui("fr", "next"), "Next", "unknown language falls back to English");

// ---- Demo math is correct, and each demo has a text equivalent in both languages ----
const { start, addend, toTen, rest } = TENFRAME_FACTS;
assert.equal(start + toTen, 10, "7 + 3 fills the ten-frame");
assert.equal(toTen + rest, addend, "the 5 splits into 3 and 2");
assert.equal(10 + rest, start + addend);
assert.equal(start + addend, 12);
assert.equal(HINT_FACTS.a + HINT_FACTS.toTen, 10, "8 + 2 = 10");
assert.equal(HINT_FACTS.toTen + HINT_FACTS.rest, HINT_FACTS.b, "5 = 2 + 3");
assert.equal(10 + HINT_FACTS.rest, HINT_FACTS.a + HINT_FACTS.b);
assert.notEqual(HINT_FACTS.slip, HINT_FACTS.a + HINT_FACTS.b, "the first try is a slip");
for (const lang of ["en", "es"]) {
  const frame = demoHtml("tenframe", lang);
  assert.equal((frame.match(/class="td-dot td-a"/g) || []).length, 7);
  assert.equal((frame.match(/class="td-dot td-b"/g) || []).length, 3);
  assert.equal((frame.match(/class="td-dot td-c"/g) || []).length, 2);
  assert.equal((frame.match(/class="td-frame"/g) || []).length, 2);
  assert.equal((frame.match(/class="td-cell"/g) || []).length, 20);
  assert.match(frame, /7 \+ 3 = 10/);
  assert.match(frame, /10 \+ 2 = 12/);
  assert.match(frame, /7 \+ 5 = 12/);
  const ladder = demoHtml("hints", lang);
  for (const line of ["8 + 5 = 12", "8 + 2 = 10", "10 + 3 = 13", "8 + 5 = 13"]) assert.ok(ladder.includes(line), `${lang}: ${line}`);
  assert.equal((ladder.match(/<g class="td-row /g) || []).length, 4, "four rungs: try, hint, retry, success");
  for (const markup of [frame, ladder]) {
    assert.match(markup, /<figcaption class="tour-demo-text">[^<]{40,}/, "visible text equivalent");
    assert.match(markup, /aria-hidden="true"/, "drawing is hidden from assistive tech");
    assert.match(markup, /role="group" aria-label="[^"]+"/);
    assert.match(markup, /class="tour-demo-toggle" aria-pressed="false"/, "pause control");
  }
}
assert.notEqual(demoHtml("tenframe", "en"), demoHtml("tenframe", "es"));
assert.equal(demoHtml("nope", "en"), "");

console.log(`Tour passed: state, offer rules, ${STEPS.student.length} student + ${STEPS.family.length} family steps in 2 languages, ${anchored.length} anchors, demo math`);
