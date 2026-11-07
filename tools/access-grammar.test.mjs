// Grammar check-in → numbered practice packs (Language Page feature #9). The packs' sentences are held to the
// real errors.js detectors: every correct sentence passes its pack's detectors, and `trips` lists exactly the
// wrong sentences a detector catches, so the content and the detectors cannot drift apart.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const { packs } = JSON.parse(readFileSync(new URL("content/grammar/packs.json", LAB), "utf8"));
const g = await import("../access-practice-lab/src/lang/grammar.js");
const { detect, DETECTOR_IDS } = await import("../access-practice-lab/src/lang/errors.js");

const items = packs.flatMap((p) => [...p.diagnostic, ...p.practice].map((item) => ({ p, item })));
const allRight = () =>
  Object.fromEntries(packs.flatMap((p) => p.diagnostic.map((it, i) => [`${p.n}:${i}`, it.answer])));

test("seven numbered packs in the named order, each with 2 check-in and 5 practice items, bilingual", () => {
  assert.deepEqual(
    packs.map((p) => [p.n, p.id]),
    [
      [1, "articles"],
      [2, "plurals"],
      [3, "possessives"],
      [4, "pronouns"],
      [5, "prepositions"],
      [6, "negation"],
      [7, "questions"],
    ],
  );
  for (const p of packs) {
    assert.equal(p.diagnostic.length, 2, p.id);
    assert.equal(p.practice.length, 5, p.id);
    for (const o of [p.title, p.rule, ...p.practice.map((x) => x.why)]) {
      assert.ok(o.en && o.es && o.en !== o.es, `${p.id} needs English and Spanish`);
    }
    for (const id of p.detectors)
      assert.ok(DETECTOR_IDS.includes(id), `${p.id}: unknown detector ${id}`);
  }
});

test("every item has three different sentences and one valid answer; answers are not all in one position", () => {
  const positions = new Set();
  for (const { p, item } of items) {
    assert.equal(new Set(item.choices).size, 3, p.id);
    assert.ok([0, 1, 2].includes(item.answer), p.id);
    positions.add(item.answer);
  }
  assert.equal(positions.size, 3);
});

test("correct sentences pass the errors.js detectors; trips match what the detectors really catch", () => {
  for (const { p, item } of items) {
    const right = item.choices[item.answer];
    assert.deepEqual(
      detect(right)
        .filter((h) => h.confidence === "high")
        .map((h) => h.id),
      [],
      `"${right}" is marked correct but a detector flags it`,
    );
    const caught = item.choices
      .map((c, i) =>
        detect(c).some((h) => h.confidence === "high" && p.detectors.includes(h.id)) ? i : null,
      )
      .filter((i) => i !== null && i !== item.answer);
    assert.deepEqual(item.trips, caught, `${p.id}: trips out of date for "${right}"`);
  }
});

test("a practice hint is the rule, and the why never repeats the right sentence word for word", () => {
  for (const p of packs)
    for (const item of p.practice)
      assert.ok(!item.why.en.includes(item.choices[item.answer]), p.id);
});

test("the route follows check-in misses and writing-sample detector hits, in pack order", () => {
  assert.deepEqual(g.route(packs, { answers: allRight() }), []);
  const answers = { ...allRight(), "6:0": 0, "2:1": 0 };
  assert.deepEqual(
    g.route(packs, { answers }).map((r) => [r.n, r.misses]),
    [
      [2, 1],
      [6, 1],
    ],
  );
  const sample =
    "Yesterday I eat a apple at lunch with my friends. Then we played soccer on the field for a long time after school.";
  const plan = g.route(packs, { answers: allRight(), sample });
  assert.deepEqual(
    plan.map((r) => r.n),
    [1],
  );
  assert.equal(plan[0].hits[0].text.toLowerCase(), "a apple");
  assert.deepEqual(g.sampleNeeds(packs, "a apple"), {}, "too short a sample is not evidence");
  const done = g.route(packs, { answers, done: { 2: true } });
  assert.equal(g.nextPack(done).n, 6);
});

test("a pack is done only when every practice item is answered right", () => {
  const p = packs[0];
  const picks = Object.fromEntries(p.practice.map((it, i) => [i, it.answer]));
  assert.ok(g.packDone(p, picks));
  assert.ok(!g.packDone(p, { ...picks, 0: (p.practice[0].answer + 1) % 3 }));
});

test("saved state is read defensively", () => {
  assert.deepEqual(g.normalizeGrammar("x"), {
    answers: {},
    sample: "",
    finished: false,
    date: "",
    packs: {},
  });
  assert.deepEqual(
    g.normalizeGrammar({ answers: { "1:0": "a", "1:1": 2 }, packs: { x: {}, 3: { done: true } } })
      .packs,
    {
      3: { picks: {}, done: true },
    },
  );
});

test("the view renders the check-in, the route and a pack in all three language modes", async () => {
  const dom = new JSDOM("<body></body>", {
    url: "https://example.test/access-practice-lab/grammar",
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () =>
      JSON.parse(
        readFileSync(
          new URL(`content/${String(url).split("/content/")[1].split("?")[0]}`, LAB),
          "utf8",
        ),
      ),
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  const view = await import("../access-practice-lab/src/views/grammar.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  for (const lang of ["en", "es", "bi"]) {
    const ctx = { prefs: { lang }, route: { view: "grammar", id: "" }, band: "6-8" };
    let out = await view.render(ctx);
    document.body.innerHTML = toHtml(out.html);
    assert.equal(document.querySelectorAll('[data-gc="7:1"]').length, 3, lang);
    out = await view.render({ ...ctx, route: { view: "grammar", id: "6" } });
    document.body.innerHTML = toHtml(out.html);
    assert.equal(document.querySelectorAll('[data-gp="4"]').length, 3, lang);
    assert.doesNotMatch(document.body.textContent, /WIDA level|Lexile|%/);
  }
  dom.window.localStorage.setItem(
    g.GRAMMAR_KEY,
    JSON.stringify({ answers: { ...allRight(), "7:0": 0 }, finished: true }),
  );
  const out = await view.render({
    prefs: { lang: "es" },
    route: { view: "grammar", id: "" },
    band: "6-8",
  });
  document.body.innerHTML = toHtml(out.html);
  assert.ok(document.querySelector('.grammar-route a[href$="/grammar/7"]'));
  assert.match(document.body.textContent, /Empezar el paquete 7/);
});
