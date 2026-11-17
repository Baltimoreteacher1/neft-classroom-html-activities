// Access Prep skill builders (access-practice-lab/src/prep/): every shipped set is complete and internally true,
// the pure checks behave (order-free details, blanks, data checklist, ranking, reasons), and JSDOM drives each
// skill through its real view: picker, every step, a wrong attempt, the right answer, saved progress.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const content = (slug) =>
  JSON.parse(readFileSync(new URL(`access-practice-lab/content/prep/${slug}.json`, ROOT), "utf8"));

const win = new JSDOM(
  "<main id='app'></main><div id='labLive'></div><div id='labToast' hidden></div>",
  {
    url: "https://lab.test/access-practice-lab/access-prep",
  },
).window;
for (const key of [
  "window",
  "document",
  "localStorage",
  "location",
  "history",
  "navigator",
  "HTMLElement",
  "Node",
])
  Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true });
globalThis.CSS = { escape: (s) => String(s) };
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerHeight = 800;
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});

const M = await import("../access-practice-lab/src/prep/model.js");
const { PREP_SKILL_LIST } = await import("../access-practice-lab/src/prep/registry.js");
const view = await import("../access-practice-lab/src/prep/view.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const BANDS = ["3-5", "6-8"];
const symbols = /[%°&]/;

test("every skill has sets for both bands, and every shipped set passes the engine's own check", () => {
  for (const s of PREP_SKILL_LIST) {
    const data = content(s.slug);
    for (const b of BANDS) {
      assert.ok(data[b]?.length >= 4, `${s.slug} ${b}: at least 4 sets`);
      for (const set of data[b]) assert.ok(M.validSet(s.slug, set), `${s.slug}/${set.id} is valid`);
    }
    const ids = BANDS.flatMap((b) => data[b].map((x) => x.id));
    assert.equal(new Set(ids).size, ids.length, `${s.slug}: set ids are unique`);
  }
});

test("Listen & Take Notes content: notes, signals, questions and the spoken main idea hold together", () => {
  for (const b of BANDS)
    for (const s of content("notes")[b]) {
      const talk = s.talk.join(" ");
      for (const w of s.signal)
        assert.ok(talk.includes(w), `${s.id}: signal "${w}" is said in the talk`);
      assert.equal(s.notes.details.length, 3, `${s.id}: three details`);
      assert.equal(
        new Set([s.notes.main, ...s.notes.details]).size,
        4,
        `${s.id}: four different note cards`,
      );
      assert.ok(s.cards.length - 4 >= 3, `${s.id}: at least three distractor cards`);
      assert.ok(s.say && /[.!?]$/.test(s.say), `${s.id}: an authored main-idea sentence`);
      for (const q of s.questions)
        assert.ok(
          q.options.some((o) => o.id === q.answer) && q.why,
          `${s.id}: "${q.q}" has its answer and a reason`,
        );
      assert.ok(!symbols.test(talk), `${s.id}: the talk is speakable`);
    }
});

test("Data Talk content: answers, the build sentence and the model are true for the chart", () => {
  for (const b of BANDS)
    for (const s of content("data-talk")[b]) {
      if (s.chart.kind === "line")
        assert.ok(s.chart.data.length >= 3, `${s.id}: a trend needs three points`);
      const model = M.dataChecklist(s, s.write.model);
      assert.deepEqual(
        model,
        { number: true, compare: true, unit: true, sentence: true },
        `${s.id}: the model meets its own checklist`,
      );
      assert.ok(
        M.checkBuild(s.build.parts, Object.fromEntries(s.build.parts.map((p, i) => [i, p.answer])))
          .ok,
        `${s.id}: build answers check`,
      );
      const nums = M.buildText(s.build.parts).match(/\d+(?:,\d{3})*/g) || [];
      const values = new Set(s.chart.data.map((d) => d.value));
      for (const n of nums) {
        const v = Number(n.replace(/,/g, ""));
        const derivable =
          values.has(v) ||
          [...values].some((a) => [...values].some((c) => a - c === v || a + c === v)) ||
          /^\d{1,2}\s*(AM|PM)$/.test(n) ||
          s.chart.data.some((d) => String(d.label).includes(n));
        assert.ok(derivable, `${s.id}: "${n}" in the build sentence comes from the chart`);
      }
    }
});

test("Rater's Eye content: ranking, reasons and the upgrade are consistent", () => {
  for (const b of BANDS)
    for (const s of content("raters-eye")[b]) {
      assert.equal(
        s.upgrade.from,
        s.ranking[2],
        `${s.id}: the upgrade starts from the weakest answer`,
      );
      assert.equal(
        new Set(s.features.filter((f) => f.right).map((f) => f.dim)).size,
        3,
        `${s.id}: one true reason per dimension`,
      );
      for (const f of s.features)
        assert.ok(M.DIMENSIONS[f.dim] && f.why, `${s.id}/${f.id}: known dimension and a reason`);
      assert.equal(
        M.buildText(s.upgrade.parts).trim(),
        s.upgrade.model.trim(),
        `${s.id}: model equals the upgrade`,
      );
      const strongest = s.responses.find((r) => r.id === s.ranking[0]).text;
      const weakest = s.responses.find((r) => r.id === s.ranking[2]).text;
      assert.ok(
        strongest.split(/\s+/).length > weakest.split(/\s+/).length,
        `${s.id}: the strongest answer says more than the weakest`,
      );
    }
  const firsts = BANDS.flatMap((b) => content("raters-eye")[b].map((s) => s.ranking[0]));
  assert.ok(new Set(firsts).size >= 2, "the strongest answer is not always in the same position");
});

test("Two Meanings content: every sort sentence names its word, questions and the model line up", () => {
  const seen = new Set();
  for (const b of BANDS)
    for (const s of content("word-meanings")[b]) {
      for (const w of s.words) {
        assert.ok(!seen.has(w.w), `${w.w} is used in only one set`);
        seen.add(w.w);
        assert.notEqual(w.everyday.def, w.school.def, `${s.id}/${w.w}: two different meanings`);
      }
      for (const x of s.sort)
        assert.ok(M.wordSentenceCheck(x.word, x.s).word, `${s.id}: "${x.s}" contains ${x.word}`);
      assert.ok(
        ["everyday", "school"].every((m) => s.sort.filter((x) => x.meaning === m).length >= 2),
        `${s.id}: both meanings sorted`,
      );
      assert.deepEqual(
        M.wordSentenceCheck(s.write.word, s.write.model),
        { word: true, sentence: true },
        `${s.id}: model passes its own checklist`,
      );
    }
});

test("Text Structures content: three different structures per set, signals in the text, organizers answerable", () => {
  for (const b of BANDS)
    for (const s of content("text-structures")[b]) {
      assert.equal(
        new Set(s.passages.map((p) => p.structure)).size,
        3,
        `${s.id}: three different structures`,
      );
      for (const p of s.passages) {
        assert.ok(M.STRUCTURES[p.structure], `${s.id}: known structure ${p.structure}`);
        for (const w of p.signals)
          assert.ok(p.text.includes(w), `${s.id}: signal "${w}" in "${p.title}"`);
        for (const part of p.organizer.parts)
          assert.equal(
            part.options.filter((o) => o === part.answer).length,
            1,
            `${s.id}/${part.label}: one right option`,
          );
      }
    }
});

test("Task Words content: the task word is in the prompt, needs and answers line up", () => {
  for (const b of BANDS) {
    const used = new Set();
    for (const s of content("task-words")[b])
      for (const p of s.prompts) {
        used.add(p.taskWord);
        assert.ok(
          M.TASK_WORDS[p.taskWord] && p.prompt.includes(p.taskText),
          `${s.id}: "${p.taskText}" in prompt`,
        );
        assert.ok(
          p.choices.includes(p.taskText) && p.choices.every((c) => p.prompt.includes(c)),
          `${s.id}: word choices come from the prompt`,
        );
        assert.ok(
          M.checkBoxes(
            p.needs,
            p.needs.filter((n) => n.right).map((n) => n.id),
          ).ok,
          `${s.id}: needs check`,
        );
        assert.ok(p.answers.some((a) => a.id === p.answer) && p.why, `${s.id}: answer and reason`);
      }
    assert.equal(used.size, 6, `${b}: every task word is practiced`);
  }
});

test("pure checks: checkbox sets and the word-sentence checklist", () => {
  const items = [
    { id: "a", right: true },
    { id: "b", right: false },
    { id: "c", right: true },
  ];
  assert.equal(M.checkBoxes(items, ["a", "c"]).ok, true);
  assert.equal(M.checkBoxes(items, ["a", "b", "c"]).wrong.length, 1);
  assert.equal(M.checkBoxes(items, ["a"]).missed.length, 1);
  assert.deepEqual(M.wordSentenceCheck("volume", "The volume of the box is big."), {
    word: true,
    sentence: true,
  });
  assert.equal(
    M.wordSentenceCheck("product", "The products sold out fast today.").word,
    true,
    "a plural still counts",
  );
  assert.equal(M.wordSentenceCheck("mass", "I am at home.").word, false);
});

test("pure checks: notes details are order-free and not double-counted", () => {
  const set = { notes: { main: "m", details: ["a", "b", "c"] } };
  assert.equal(M.checkNotes(set, { main: "m", d0: "c", d1: "a", d2: "b" }).ok, true);
  const dup = M.checkNotes(set, { main: "m", d0: "a", d1: "a", d2: "b" });
  assert.equal(dup.ok, false);
  assert.equal(dup.right, 3);
  assert.equal(M.checkNotes(set, { main: "a", d0: "m", d1: "b", d2: "c" }).slots.main, false);
  assert.equal(M.cardRole(set, "m"), "main");
  assert.equal(M.cardRole(set, "z"), "extra");
});

test("pure checks: blanks, data checklist, ranking, reasons, stable order", () => {
  const parts = [
    "A ",
    { options: ["x", "y"], answer: "y" },
    " B ",
    { options: ["1", "2"], answer: "2" },
  ];
  assert.equal(M.checkBuild(parts, { 1: "y", 3: "2" }).ok, true);
  assert.deepEqual(M.checkBuild(parts, { 1: "x", 3: "2" }).slots, { 1: false, 3: true });
  const set = {
    chart: {
      unit: "votes",
      data: [
        { label: "Tag", value: 12 },
        { label: "Soccer", value: 8 },
      ],
    },
    write: { compareWords: ["more", "than"] },
  };
  assert.deepEqual(M.dataChecklist(set, "Tag got 12 votes, 4 more than Soccer."), {
    number: true,
    compare: true,
    unit: true,
    sentence: true,
  });
  assert.equal(M.dataChecklist(set, "I like it").number, false);
  const r = { ranking: ["b", "c", "a"] };
  assert.equal(M.checkRanking(r, ["b", "c", "a"]).ok, true);
  assert.deepEqual(M.checkRanking(r, ["b", "a", "c"]), {
    ok: false,
    complete: true,
    strongest: true,
  });
  assert.equal(M.checkRanking(r, ["b", "b", "a"]).complete, false);
  const f = {
    features: [
      { id: "1", right: true },
      { id: "2", right: false },
      { id: "3", right: true },
    ],
  };
  assert.equal(M.checkFeatures(f, ["1", "3"]).ok, true);
  const miss = M.checkFeatures(f, ["1", "2"]);
  assert.deepEqual([miss.missed.map((x) => x.id), miss.wrong.map((x) => x.id)], [["3"], ["2"]]);
  const list = ["a", "b", "c", "d", "e"];
  assert.deepEqual(M.seededOrder(list, "s1"), M.seededOrder(list, "s1"), "same seed, same order");
  assert.notDeepEqual(M.seededOrder(list, "s1"), list, "never the authored order");
  assert.equal(M.prepBand("K"), "3-5");
  assert.equal(M.prepBand("6-8"), "6-8");
});

// ── JSDOM through the real view ──────────────────────────────────────────────
const app = document.getElementById("app");
const ctx = {
  band: "6-8",
  prefs: { lang: "en" },
  setPrefs(p) {
    ctx.prefs = { ...ctx.prefs, ...p };
  },
  rerender: () => draw(),
};
let route = { slug: "", set: "" };
async function draw() {
  const out = await view.render(ctx, route.slug, route.set);
  app.innerHTML = toHtml(out.html);
  return out;
}
const I = makeI18n("en");
const click = (sel) => {
  const el = app.querySelector(sel);
  assert.ok(el, `found ${sel}`);
  return view.onClick({ target: el }, ctx);
};
const change = (sel, value) => {
  const el = app.querySelector(sel);
  assert.ok(el, `found ${sel}`);
  if (el.type === "radio" || el.type === "checkbox") el.checked = value !== false;
  else el.value = value;
  view.onChange({ target: el }, ctx);
};
const settle = () => new Promise((r) => setTimeout(r, 0));
const stepTitle = () => app.querySelector("#prepStepH")?.textContent.replace(/\s+/g, " ").trim();
void I;

test("picker lists the band's sets; an unknown set id falls back to the picker", async () => {
  route = { slug: "notes", set: "" };
  await draw();
  assert.equal(app.querySelectorAll(".prep-set a").length, content("notes")["6-8"].length);
  route = { slug: "notes", set: "no-such-set" };
  await draw();
  assert.ok(app.querySelector(".prep-sets"), "unknown id shows the picker, not an error");
});

test("Listen & Take Notes: Next waits for listening, wrong notes get a reason, right notes advance and save", async () => {
  localStorage.clear();
  win.speechSynthesis = {
    speak() {},
    cancel() {},
    getVoices: () => [],
    addEventListener() {},
    speaking: false,
  };
  win.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance = class {};
  globalThis.speechSynthesis = win.speechSynthesis;
  const s = content("notes")["6-8"][0];
  route = { slug: "notes", set: s.id };
  await draw();
  click("[data-prep-act=next]");
  await settle();
  assert.match(stepTitle(), /Step 2 of 5/);
  click("[data-prep-act=next]");
  await settle();
  assert.match(stepTitle(), /Step 2 of 5/, "cannot skip listening");
  click("[data-prep-act=play]");
  await settle();
  click("[data-prep-act=next]");
  await settle();
  assert.match(stepTitle(), /Take notes/);
  change('[data-prep-blank="notes:main"]', s.notes.details[0]);
  change('[data-prep-blank="notes:d0"]', s.notes.main);
  change('[data-prep-blank="notes:d1"]', s.notes.details[1]);
  change('[data-prep-blank="notes:d2"]', s.notes.details[2]);
  click("[data-prep-act=check-notes]");
  await settle();
  assert.match(app.querySelector(".feedback").textContent, /2 of 4/);
  assert.match(app.querySelector(".fb-more").textContent, /one detail|main idea/i);
  change('[data-prep-blank="notes:main"]', s.notes.main);
  change('[data-prep-blank="notes:d0"]', s.notes.details[0]);
  click("[data-prep-act=check-notes]");
  await settle();
  assert.ok(app.querySelector(".feedback.is-right"));
  click("[data-prep-act=next]");
  await settle();
  s.questions.forEach((q, i) => change(`input[name=q${i}][value=${q.answer}]`));
  click("[data-prep-act=check-questions]");
  await settle();
  click("[data-prep-act=next]");
  await settle();
  assert.match(stepTitle(), /Look back/);
  assert.equal(app.querySelectorAll(".prep-transcript mark").length, s.signal.length);
  assert.equal(M.loadState("notes", s.id).done, true, "finishing the set is saved on this device");
});

test("every other skill renders every step without throwing, in English and Spanish", async () => {
  for (const slug of [
    "data-talk",
    "raters-eye",
    "word-meanings",
    "text-structures",
    "task-words",
    "daily-drill",
    "extempore-speak",
  ])
    for (const lang of ["en", "es", "bi"]) {
      ctx.prefs.lang = lang;
      const s = content(slug)["3-5"][0];
      ctx.band = "3-5";
      route = { slug, set: s.id };
      localStorage.clear();
      const steps = PREP_SKILL_LIST.find((x) => x.slug === slug).steps.length;
      for (let i = 0; i < steps; i++) {
        const st = M.loadState(slug, s.id);
        st.step = i;
        st.reveal = {
          build: true,
          rank: true,
          upgrade: true,
          listen: true,
          forge: true,
          turn1: true,
          turn2: true,
        };
        st.checked = {
          features: { ok: true, missed: [], wrong: [] },
          p0: { ok: true },
          org0: { ok: false, right: 1, total: 2, slots: {} },
          w0: { ok: true },
          n0: { ok: true, missed: [], wrong: [] },
          w1: { ok: false },
          pairs: { ok: true, right: 4, total: 4, slots: {} },
          cloze: { ok: true, right: 3, total: 3, slots: {} },
          sceneQ: { ok: true, why: "Good" },
          turn3: { ok: true },
        };
        M.saveState(slug, s.id, st);
        view.unmount();
        await draw();
        assert.ok(app.querySelector("#prepStepH"), `${slug} step ${i + 1} (${lang}) renders`);
      }
    }
  ctx.prefs.lang = "en";
  ctx.band = "6-8";
});

test("Language Path & Micro-Drills and Extempore Speaking Lab: content, audio-safe text, and pure checks", () => {
  for (const b of BANDS) {
    for (const s of content("daily-drill")[b]) {
      assert.equal(s.pairs.length, 4, `${s.id}: four vocabulary pairs`);
      assert.ok(!symbols.test(s.listenBuild.sentence), `${s.id}: spoken sentence is symbol-free`);
      const matchMap = Object.fromEntries(s.pairs.map((p) => [p.id, p.id]));
      assert.equal(M.checkPairs(s.pairs, matchMap).ok, true, `${s.id}: checkPairs passes`);
      assert.equal(
        M.buildText(s.forge.parts).trim(),
        s.forge.model.trim(),
        `${s.id}: forge parts match model`,
      );
      assert.ok(s.familyTalk?.en && s.familyTalk?.es, `${s.id}: bilingual family talk`);
    }
    for (const s of content("extempore-speak")[b]) {
      assert.ok(!symbols.test(s.scene.teacherPrompt), `${s.id}: teacherPrompt is symbol-free`);
      assert.ok(!symbols.test(s.scene.modelStudent.text), `${s.id}: modelStudent is symbol-free`);
      assert.deepEqual(
        M.extemporeChecklist(s, s.turn3.model),
        { word: true, connector: true, sentence: true },
        `${s.id}: turn3 model satisfies extemporeChecklist`,
      );
      assert.ok(s.familyTalk?.en && s.familyTalk?.es, `${s.id}: bilingual family talk`);
    }
  }
});

test("Duolingo Tap-the-Pairs & 3D Word Bank and Extempore Radar interactions work in JSDOM", async () => {
  localStorage.clear();
  ctx.band = "6-8";
  const dd = content("daily-drill")["6-8"][0];
  route = { slug: "daily-drill", set: dd.id };
  view.unmount();
  await draw();
  for (const p of dd.pairs) {
    click(`[data-word-id="${p.id}"]`);
    await settle();
    click(`[data-def-id="${p.id}"]`);
    await settle();
  }
  assert.ok(app.querySelector(".feedback.is-right"), "all 4 pairs auto-checked right");
  click("[data-prep-act=next]");
  await settle();
  assert.ok(app.querySelector(".duo-wordbank-wrap"), "Step 2 shows 3D word bank tray");

  const ex = content("extempore-speak")["6-8"][0];
  route = { slug: "extempore-speak", set: ex.id };
  const st = M.loadState("extempore-speak", ex.id);
  st.step = 3;
  M.saveState("extempore-speak", ex.id, st);
  view.unmount();
  await draw();
  assert.ok(app.querySelector(".ext-studio-split"), "Extempore split studio renders");
  click("[data-prep-act=ext-use-frame]");
  await settle();
  click(`[data-radar-word="${ex.turn3.words[0]}"]`);
  await settle();
  click(`[data-radar-conn="${ex.turn3.connectors[0]}"]`);
  await settle();
  assert.ok(
    app.querySelector("#prepOral").value.includes(ex.turn3.words[0]),
    "radar chip inserted target word into response box",
  );
});
