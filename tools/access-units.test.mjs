// Thematic Units: content contract, progress logic (migration safe), routes, and every unit page rendered in jsdom
// in English, Spanish and bilingual mode. node --test tools/access-units.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { CONTENT_DIR, LAB_DIR } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";
import { UNIT_COUNTS } from "./lib/access-units-rules.mjs";
import { activityMap, checkAll } from "./validate-access-units.mjs";

const dom = new JSDOM('<!doctype html><html lang="en"><body><main id="app"></main></body></html>', {
  url: "https://thelanguagepage.com/access-practice-lab/units",
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
  "Event",
])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
globalThis.fetch = async (url) => {
  const rel = String(url).replace(/^\/access-practice-lab\//, "");
  try {
    const body = readFileSync(join(LAB_DIR, rel), "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const U = await import("../access-practice-lab/src/lang/units.js");
const units = await import("../access-practice-lab/src/views/units.js");
const { parseRoute } = await import("../access-practice-lab/src/main.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { assignmentPath, ID_OK } = await import("../access-practice-lab/src/class/assign.js");

const read = (band) =>
  JSON.parse(readFileSync(join(CONTENT_DIR, "units", `g${band}.json`), "utf8"));
const BANDS = Object.keys(UNIT_COUNTS);
const EMOJI = /\p{Extended_Pictographic}/u;
const CLOCK = /\b(countdown|timer|beat the clock|hurry|words per minute)\b/i;

const ctxFor = (band, lang, id = "", sub = "", tab = "") => ({
  band,
  prefs: { lang, rate: 0.9 },
  route: { view: "units", id, sub, tab },
  rerenders: 0,
  rerender() {
    this.rerenders++;
  },
  navigate() {},
});
async function show(ctx) {
  const out = await units.render(ctx);
  const root = document.getElementById("app");
  root.innerHTML = toHtml(out.html);
  return { title: out.title, root, text: root.textContent };
}
const click = (selector, ctx) => {
  const el = document.querySelector(selector);
  assert.ok(el, `missing ${selector}`);
  return units.onClick({ target: el }, ctx);
};

test("the unit content passes the contract (8 units for 6-8, 6 for 3-5, every activity id exists)", () => {
  const problems = checkAll(activityMap());
  assert.deepEqual(problems, []);
  for (const band of BANDS) assert.equal(read(band).units.length, UNIT_COUNTS[band]);
});

test("each unit is 5 lessons plus a project with a product, audience and rubric, and sequences all four domains", () => {
  const acts = activityMap();
  for (const band of BANDS)
    for (const u of read(band).units) {
      assert.equal(u.lessons.length, 5, u.id);
      assert.ok(u.task.product.en && u.task.audience.en && u.task.rubric.length === 4, u.id);
      const domains = new Set(
        u.lessons.flatMap((l) =>
          l.steps.filter((s) => s.t === "activity").map((s) => acts.get(s.id).domain),
        ),
      );
      assert.equal(domains.size, 4, `${u.id}: ${[...domains]}`);
      assert.equal(u.pacing.filter((p) => p.ref === "task").length >= 2, true, u.id);
    }
});

test("no unit text makes a score claim, uses emoji or sets a clock", () => {
  for (const band of BANDS) {
    const text = JSON.stringify(read(band));
    assert.doesNotMatch(text, SCORE_CLAIM);
    assert.doesNotMatch(text, CLOCK);
    assert.equal(EMOJI.test(text), false);
  }
});

test("routes: /units, /units/<unit>, /units/<unit>/<lesson> parse, with ?tab", () => {
  assert.deepEqual(parseRoute("/access-practice-lab/units", "").view, "units");
  const r = parseRoute("/access-practice-lab/units/energy-inventions/3", "?grades=6-8&tab=plan");
  assert.equal(r.view, "units");
  assert.equal(r.id, "energy-inventions");
  assert.equal(r.sub, "3");
  assert.equal(r.tab, "plan");
});

test("saved progress is read defensively and old or damaged records never throw", () => {
  const junk = [
    null,
    "x",
    [],
    { units: [] },
    { units: { "bad id!": {} } },
    {
      units: {
        u: {
          steps: { 9: [1] },
          ans: { "x:y": 1, "a:0": { pick: "no" } },
          level: "huge",
          task: { rubric: { 9: 2, 1: 7 } },
          cert: { at: 5 },
        },
      },
    },
  ];
  for (const raw of junk) {
    const s = U.normalizeUnits(raw);
    assert.equal(s.v, 1);
    for (const rec of Object.values(s.units)) {
      assert.deepEqual(rec.steps, {});
      assert.deepEqual(rec.ans, {});
      assert.equal(rec.level, "on");
      assert.deepEqual(rec.task.rubric, {});
      assert.equal(rec.cert, null);
    }
  }
  const keep = U.normalizeUnits({
    units: { "ocean-systems": { steps: { 2: [0, 1, 1] }, level: "easier", text: { w1: "hello" } } },
  });
  assert.deepEqual(keep.units["ocean-systems"].steps, { 2: [0, 1] });
  assert.equal(keep.units["ocean-systems"].level, "easier");
  assert.equal(keep.units["ocean-systems"].text.w1, "hello");
  assert.equal(U.loadUnitsState({ getItem: () => "{broken" }).v, 1);
});

test("saving unit progress touches only its own key", () => {
  localStorage.clear();
  localStorage.setItem("accessPracticeLab:v1:prefs", '{"lang":"es"}');
  const state = U.loadUnitsState();
  U.unitRecord(state, "ocean-systems").level = "richer";
  assert.equal(U.saveUnitsState(state), true);
  assert.equal(localStorage.getItem("accessPracticeLab:v1:prefs"), '{"lang":"es"}');
  assert.equal(U.loadUnitsState().units["ocean-systems"].level, "richer");
  assert.equal(U.UNITS_KEY.startsWith("accessPracticeLab:v1:"), true);
});

test("class assignments use the platform's id and path rules, one per lesson and project", () => {
  for (const band of BANDS) {
    const rows = U.unitAssignmentRows(read(band).units, band);
    assert.equal(rows.length, read(band).units.length * 6);
    for (const r of rows) {
      assert.match(r.id, ID_OK, r.id);
      assert.match(r.path, /^\/[\w\-./?=&%]{0,200}$/, r.path);
      assert.ok(r.title.length <= 80);
    }
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  }
  assert.equal(assignmentPath("6-8", "Reading", "B", "x"), "/access-practice-lab/Reading/B/x");
});

test("key words in a text become tappable and the vocabulary cloze keeps the sentence", () => {
  const u = read("6-8").units[0];
  const segs = U.highlightTerms(u.texts.anchor.on, u.vocab);
  assert.ok(
    segs.some((s) => s.term !== undefined),
    "at least one key word is highlighted",
  );
  assert.equal(
    segs.map((s) => s.text).join(""),
    u.texts.anchor.on,
    "highlighting never changes the text",
  );
  const withCloze = u.vocab.filter((v) => U.vocabCloze(v));
  assert.ok(withCloze.length >= 4);
  for (const v of withCloze) {
    const c = U.vocabCloze(v);
    assert.ok(!new RegExp(`\\b${v.term}\\b`, "i").test(c.before + c.after), `${v.term} is blanked`);
  }
});

for (const band of BANDS) {
  test(`${band}: hub, overview, tabs, packet and every lesson render in English, Spanish and bilingual`, async () => {
    const { units: list } = read(band);
    for (const lang of ["en", "es", "bi"]) {
      localStorage.clear();
      const hub = await show(ctxFor(band, lang));
      assert.equal(hub.root.querySelectorAll(".un-card").length, list.length);
      assert.doesNotMatch(hub.text, CLOCK);
      for (const u of list) {
        const o = await show(ctxFor(band, lang, u.id));
        assert.ok(o.root.querySelector(".un-map-wide a.un-stop"), "map");
        assert.equal(o.root.querySelectorAll(".un-map-wide a.un-stop").length, 7);
        assert.equal(o.root.querySelectorAll(".un-lesson-card").length, 5);
        assert.equal(o.root.querySelectorAll(".un-vocab-item").length, 8);
        for (const tab of ["family", "plan"]) {
          const t = await show(ctxFor(band, lang, u.id, "", tab));
          assert.ok(t.text.length > 500, `${u.id} ${tab}`);
        }
        for (const l of u.lessons) {
          const page = await show(ctxFor(band, lang, u.id, l.id));
          assert.equal(
            page.root.querySelectorAll(".un-step").length,
            l.steps.length,
            `${u.id} lesson ${l.id}`,
          );
          assert.ok(page.root.querySelector("h1"), "h1");
          assert.equal(
            page.root.querySelectorAll("[data-u-draft], .un-act, .un-q, .un-word").length > 0,
            true,
          );
          for (const a of l.steps.filter((s) => s.t === "activity"))
            assert.ok(
              page.root.querySelector(`a[href*="/${a.id}?grades=${band}"]`),
              `link to ${a.id}`,
            );
          assert.doesNotMatch(page.text, CLOCK);
          assert.doesNotMatch(page.text, SCORE_CLAIM);
        }
        const task = await show(ctxFor(band, lang, u.id, "task"));
        assert.equal(task.root.querySelectorAll(".un-rubric-row").length, 4);
        const pk = await show(ctxFor(band, lang, u.id, "packet"));
        assert.equal(pk.root.querySelectorAll(".un-pk-lesson").length, 5);
        assert.ok(pk.root.querySelector("[data-print]"));
        const cert = await show(ctxFor(band, lang, u.id, "certificate"));
        assert.ok(cert.root.querySelector(".un-lock"), "no certificate before the unit is done");
      }
      if (lang === "es") assert.match(hub.text, /Unidades/);
    }
  });
}

test("a learner works through a lesson: answers, vocabulary, writing, reflection, then the project and certificate", async () => {
  localStorage.clear();
  const band = "6-8";
  const u = read(band).units[0];
  const ctx = ctxFor(band, "en", u.id, "1");
  await show(ctx);
  // a wrong answer is not final, is crossed out and does not reveal the answer; the right one finishes it
  const l1 = u.lessons[0];
  const readStep = l1.steps.find((s) => s.t === "read" || s.t === "listen");
  const q = u.texts[readStep.text].questions[0];
  const wrong = q.choices.findIndex((_, i) => i !== q.answer);
  assert.equal(click(`[data-u-ans="${readStep.text}:0|${wrong}"]`, ctx), true);
  let page = await show(ctx);
  assert.ok(page.root.querySelector(`[data-u-ans="${readStep.text}:0|${wrong}"][disabled]`));
  assert.equal(page.root.querySelector(".un-choice.is-right"), null);
  click(`[data-u-ans="${readStep.text}:0|${q.answer}"]`, ctx);
  page = await show(ctx);
  assert.ok(page.root.querySelector(".un-choice.is-right"));
  const saved = U.loadUnitsState().units[u.id];
  assert.equal(saved.ans[`${readStep.text}:0`].ok, true);
  assert.equal(saved.ans[`${readStep.text}:0`].tries, 2);
  // drafts are saved as the learner types, never lost on re-render
  const writeLesson = u.lessons.find((l) => l.steps.some((s) => s.t === "write"));
  const w = writeLesson.steps.find((s) => s.t === "write");
  const wctx = ctxFor(band, "en", u.id, writeLesson.id);
  await show(wctx);
  const box = document.querySelector(`[data-u-draft="${w.task}"]`);
  box.value = "Energy from the wind can turn a turbine and make electricity for homes.";
  units.onInput({ target: box }, wctx);
  assert.match(U.loadUnitsState().units[u.id].text[w.task], /turbine/);
  await show(wctx);
  assert.match(document.querySelector(`[data-u-draft="${w.task}"]`).value, /turbine/);
  assert.match(
    document.querySelector(`[data-u-count^="${w.task}|"]`).textContent,
    /words\. Aim for about \d+\. This is a guide, not a score\./,
  );
  // marking a writing step finished needs a few words
  const idx = writeLesson.steps.indexOf(w);
  assert.equal(click(`[data-u-done="${writeLesson.id}|${idx}"]`, wctx), true);
  assert.ok(U.loadUnitsState().units[u.id].steps[writeLesson.id].includes(idx));
});

test("finishing every stop earns the certificate; unfinished work never does", async () => {
  localStorage.clear();
  const band = "3-5";
  const u = read(band).units[0];
  const state = U.loadUnitsState();
  const rec = U.unitRecord(state, u.id);
  const none = () => false;
  assert.equal(U.unitProgress(u, rec, none).complete, false);
  for (const l of u.lessons) {
    l.steps.forEach((_, i) => U.setStep(rec, l.id, i, true));
  }
  assert.equal(U.unitProgress(u, rec, none).finished, 5);
  assert.equal(U.unitProgress(u, rec, none).next, "task");
  rec.task.done = true;
  assert.equal(U.unitProgress(u, rec, none).complete, true);
  U.saveUnitsState(state);
  const ctx = ctxFor(band, "en", u.id, "task");
  await show(ctx);
  assert.ok(document.querySelector("[data-u-claim]"));
  click("[data-u-claim]", ctx);
  assert.ok(U.loadUnitsState().units[u.id].cert.at);
  const cert = await show(ctxFor(band, "en", u.id, "certificate"));
  assert.ok(cert.root.querySelector(".un-cert"));
  assert.match(cert.text, /not a WIDA or ACCESS result/);
  assert.equal(U.earnedUnits(read(band).units, U.loadUnitsState()).length, 1);
});

test("the Passport card lists started units and stays silent otherwise", async () => {
  const { unitsPassportHTML } = await import("../access-practice-lab/src/views/units-passport.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const I = makeI18n("en");
  localStorage.clear();
  assert.equal(await unitsPassportHTML(I), "");
  const state = U.loadUnitsState();
  U.setStep(U.unitRecord(state, read("6-8").units[0].id), "1", 0, true);
  U.saveUnitsState(state);
  const card = toHtml(await unitsPassportHTML(I));
  assert.match(card, /passUnits/);
  assert.match(card, /not a score or a level/);
});

test("an unknown unit answers with a not-found page, not an exception", async () => {
  const out = await show(ctxFor("6-8", "en", "no-such-unit"));
  assert.match(out.text, /could not find that unit/);
});

test("the Passport progress code carries unit progress and an import never overwrites this device's work", async () => {
  const store = await import("../access-practice-lab/src/store.js");
  localStorage.clear();
  const a = U.loadUnitsState();
  U.unitRecord(a, "ocean-systems").level = "richer";
  U.unitRecord(a, "growing-things").level = "easier";
  U.saveUnitsState(a);
  const code = store.exportCode();
  localStorage.clear();
  const b = U.loadUnitsState();
  U.unitRecord(b, "ocean-systems").level = "easier";
  U.saveUnitsState(b);
  assert.ok(store.importCode(code) >= 1);
  const merged = U.loadUnitsState().units;
  assert.equal(merged["ocean-systems"].level, "easier", "this device's unit wins");
  assert.equal(
    merged["growing-things"].level,
    "easier",
    "a unit this device never started is filled in",
  );
  assert.throws(
    () => store.importProgressData({ "accessPracticeLab:v1:units": '{"v":9}' }),
    /invalid Units record/,
  );
});
