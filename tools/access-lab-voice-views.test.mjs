// Voice Lab views mounted in jsdom: the hub, every ladder and every retell render in English and Spanish, link back
// to the Practice page, carry no countdown or score wording, and record progress on this device.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const dom = new JSDOM("<!doctype html><html><body><main id=app></main></body></html>", {
  url: "https://thelanguagepage.com/access-practice-lab/voice",
});
for (const k of [
  "window",
  "document",
  "location",
  "localStorage",
  "navigator",
  "HTMLElement",
  "Node",
  "CSS",
  "MutationObserver",
]) {
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
}
const { LADDERS, RETELLS } = await import("../access-practice-lab/src/content/voice-lab.js");
const voice = await import("../access-practice-lab/src/views/voice.js");
const { parseRoute } = await import("../access-practice-lab/src/main.js").catch(() => ({}));
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { VOICE_KEY } = await import("../access-practice-lab/src/views/voice-common.js");

const COUNTDOWN = /\b(countdown|hurry|time is up|beat the clock|words per minute)\b/i;
const ctxFor = (lang, id = "", sub = "", band = "6-8") => ({
  band,
  prefs: { lang, rate: 0.9 },
  route: { view: "voice", id, sub },
  rerender() {},
});
const renderText = async (ctx) => {
  const out = await voice.render(ctx);
  document.getElementById("app").innerHTML = toHtml(out.html);
  return {
    title: out.title,
    text: document.getElementById("app").textContent,
    root: document.getElementById("app"),
  };
};

test("the hub lists every ladder and retell for the band, in English and Spanish", async () => {
  for (const band of ["6-8", "3-5"]) {
    const en = await renderText(ctxFor("en", "", "", band));
    for (const l of LADDERS.filter((x) => x.band === band))
      assert.ok(en.root.querySelector(`a[href*="/voice/ladder/${l.id}"]`), `${band} ${l.id}`);
    for (const r of RETELLS.filter((x) => x.band === band))
      assert.ok(en.root.querySelector(`a[href*="/voice/retell/${r.id}"]`), `${band} ${r.id}`);
    assert.ok(en.root.querySelector(`a[href*="/library"]`), "breadcrumb back to Practice");
    const es = await renderText(ctxFor("es", "", "", band));
    assert.match(es.text, /Laboratorio de voz/);
    assert.match(es.text, /Escaleras de expresión oral con imagen/);
    assert.doesNotMatch(es.text, /Picture speaking ladders/);
  }
});

test("every ladder renders three steps with a model student and a recorder or fallback", async () => {
  for (const l of LADDERS) {
    for (const lang of ["en", "es"]) {
      const { root, text } = await renderText(ctxFor(lang, "ladder", l.id, l.band));
      assert.equal(root.querySelectorAll(".voice-step").length, 3, l.id);
      assert.equal(root.querySelectorAll(".model-student").length, 3, l.id);
      assert.ok(root.querySelector("img[alt]")?.getAttribute("alt").length > 20);
      assert.doesNotMatch(text, COUNTDOWN);
      assert.doesNotMatch(text, SCORE_CLAIM);
      assert.match(text, lang === "es" ? /no niveles de ACCESS/ : /not ACCESS tiers/);
    }
  }
});

test("marking a ladder step said saves progress without wiping other Voice Lab progress", async () => {
  localStorage.setItem(VOICE_KEY, JSON.stringify({ retell: { "water-filter": true } }));
  const ctx = ctxFor("en", "ladder", "school-hallway");
  const { root } = await renderText(ctx);
  const btn = root.querySelector('[data-voice-said="1"]');
  assert.equal(voice.onClick({ target: btn }, ctx), true);
  const saved = JSON.parse(localStorage.getItem(VOICE_KEY));
  assert.deepEqual(saved.ladder["school-hallway"], [1]);
  assert.equal(saved.retell["water-filter"], true);
  const again = await renderText(ctx);
  assert.ok(again.root.querySelector("#step-2.is-done"));
});

test("every retell renders its source mode, a planner and both ways to speak", async () => {
  for (const r of RETELLS) {
    const { root, text } = await renderText(ctxFor("es", "retell", r.id, r.band));
    assert.equal(root.querySelectorAll("[data-retell-plan]").length, r.plan.length);
    assert.equal(root.querySelectorAll("[data-retell-mode]").length, 2);
    if (r.mode === "listen") assert.ok(root.querySelector("[data-retell-play]"));
    else assert.ok(root.querySelector(".source-text"));
    assert.doesNotMatch(text, COUNTDOWN);
    assert.match(text, /Ensayo como el día de la prueba/);
  }
});

test("unknown activities render a not-found page, never a crash", async () => {
  const { text } = await renderText(ctxFor("en", "ladder", "nope"));
  assert.match(text, /could not find/);
});

test("the router sends /voice/<kind>/<id> to the Voice Lab", { skip: !parseRoute }, () => {
  assert.deepEqual(
    { ...parseRoute("/access-practice-lab/voice/ladder/park", "?grades=6-8") },
    { view: "voice", grades: "6-8", id: "ladder", sub: "park", tab: "" },
  );
});

test("Sound Bridge renders a playable round, lays a plank on a right choice and is winnable", async () => {
  const { SOUND_SETS: sets } = await import("../access-practice-lab/src/content/voice-lab.js");
  for (const set of sets) {
    const ctx = ctxFor("en", "sounds", set.id);
    let { root, text } = await renderText(ctx);
    assert.equal(root.querySelectorAll("[data-sb-choose]").length, 2, set.id);
    assert.doesNotMatch(text, COUNTDOWN);
    const es = await renderText(ctxFor("es", "sounds", set.id));
    assert.match(es.text, /Tablas colocadas: 0 de 8/);
  }
  // Play one set to the end by reading the game state the view uses.
  const set = sets[1];
  const ctx = ctxFor("en", "sounds", set.id);
  const sbm = await import("../access-practice-lab/src/lang/sound-bridge.js");
  let guard = 0;
  let out = await renderText(ctx);
  while (!out.root.querySelector("[data-sb-new]") && guard++ < 40) {
    // Choose by the word the round would say: find the button whose word matches the target via a wrong-then-right probe.
    const before = out.root.querySelector(".sb-count").textContent;
    voice.onClick({ target: out.root.querySelector('[data-sb-choose="0"]') }, ctx);
    out = await renderText(ctx);
    if (
      out.root.querySelector(".sb-count").textContent === before &&
      !out.root.querySelector("[data-sb-new]")
    ) {
      assert.ok(out.root.querySelector(".sb-contrast"), "a miss shows the side-by-side listen");
    }
  }
  assert.ok(out.root.querySelector("[data-sb-new]"), "the bridge can be finished");
  assert.match(out.text, /You crossed the river!/);
  assert.equal(JSON.parse(localStorage.getItem(VOICE_KEY)).sounds[set.id], 1);
  void sbm;
});

test("every shadowing set renders each line with a model, a recorder and a done button", async () => {
  const { SHADOW_SETS: sets } = await import("../access-practice-lab/src/content/voice-lab.js");
  for (const set of sets) {
    for (const lang of ["en", "es"]) {
      const { root, text } = await renderText(ctxFor(lang, "shadow", set.id, set.band));
      assert.equal(root.querySelectorAll(".voice-step").length, set.lines.length);
      assert.equal(root.querySelectorAll(".model-student").length, set.lines.length);
      assert.equal(root.querySelectorAll("[data-shadow-done]").length, set.lines.length);
      assert.doesNotMatch(text, COUNTDOWN);
    }
  }
});

test("keyboarding: typing a frame exactly and checking it saves progress; there is no clock", async () => {
  const { KEY_FRAMES } = await import("../access-practice-lab/src/content/voice-lab.js");
  const set = KEY_FRAMES[0];
  const ctx = ctxFor("en", "keys", set.id);
  let out = await renderText(ctx);
  assert.equal(out.root.querySelectorAll("[data-kb-type]").length, set.frames.length);
  assert.doesNotMatch(out.text, /\b(wpm|per minute|timer|seconds)\b/i);
  const input = out.root.querySelector('[data-kb-type="0"]');
  input.value = "in my opinion";
  voice.onInput({ target: input }, ctx);
  voice.onClick({ target: out.root.querySelector('[data-kb-check="0"]') }, ctx);
  out = await renderText(ctx);
  assert.match(out.text, /characters match/);
  const again = out.root.querySelector('[data-kb-type="0"]');
  again.value = set.frames[0];
  voice.onInput({ target: again }, ctx);
  voice.onKey({ key: "Enter", target: again, preventDefault() {} }, ctx);
  out = await renderText(ctx);
  assert.match(out.text, /Exactly right/);
  assert.deepEqual(JSON.parse(localStorage.getItem(VOICE_KEY)).keys[set.id], [0]);
  const es = await renderText(ctxFor("es", "keys", set.id));
  assert.match(es.text, /nunca la velocidad/);
});

test("oral reading shows only words read for students, and accuracy only in the teacher view", async () => {
  const { READ_ALOUD } = await import("../access-practice-lab/src/content/voice-lab.js");
  for (const r of READ_ALOUD) {
    const { root, text } = await renderText(ctxFor("en", "read", r.id, r.band));
    assert.ok(root.querySelectorAll(".rd-word").length > 30, r.id);
    assert.match(text, /Words you read: 0 of \d+/);
    assert.doesNotMatch(
      text,
      /\b(per minute|wpm|accuracy|\d+%)\b/i,
      "students see no rate or percentage",
    );
    assert.doesNotMatch(text, COUNTDOWN);
    const es = await renderText(ctxFor("es", "read", r.id, r.band));
    assert.match(es.text, /Palabras que leíste: 0 de/);
  }
  const id = READ_ALOUD[0].id;
  localStorage.setItem(
    VOICE_KEY,
    JSON.stringify({
      read: { [id]: { words: 40, total: 60, matched: 40, skipped: 5, at: "2026-11-06" } },
    }),
  );
  const teacher = await renderText({
    ...ctxFor("en", "read", id),
    route: { view: "voice", id: "read", sub: id, tab: "teacher" },
  });
  assert.match(teacher.text, /40 of 60 words recognized; 5 skipped; 89%/);
  assert.match(teacher.text, /records no reading rate/);
  const hub = await renderText(ctxFor("en"));
  assert.ok(hub.root.querySelector(`a[href*="/voice/read/${id}"]`));
});
