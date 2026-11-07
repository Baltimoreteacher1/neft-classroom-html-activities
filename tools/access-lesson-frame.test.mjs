#!/usr/bin/env node
// Lesson frame (header, four-step arc, skill mini-lesson, feedback, reflection, next step) on the ACCESS Practice Lab
// activity page. Pure logic, the per-skill content file, and the real activity view rendered for every
// activity type, in Learn with help and Try independently, English / Español / both.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const LAB = join(dirname(fileURLToPath(import.meta.url)), "..", "access-practice-lab");
const values = new Map();
globalThis.localStorage = {
  getItem: (k) => values.get(k) ?? null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: (k) => values.delete(k),
};
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
};
globalThis.CSS = { escape: (s) => String(s) };
globalThis.location = { search: "", href: "http://lab.test/access-practice-lab/" };
globalThis.fetch = async (url) => {
  const path = String(url)
    .replace(/^.*\/access-practice-lab\/content\//, "")
    .split("?")[0];
  try {
    const body = await readFile(join(LAB, "content", decodeURIComponent(path)), "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const { familyFor, diagramSVG } = await import("../access-practice-lab/src/lesson-learn.js");
const frame = await import("../access-practice-lab/src/lesson-frame.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml, storage } = await import("../access-practice-lab/src/util.js");
const { saveRecord, loadRecord } = await import("../access-practice-lab/src/store.js");
const activity = await import("../access-practice-lab/src/views/activity.js");
const DATA = JSON.parse(await readFile(join(LAB, "content/lesson-learn.json"), "utf8"));

const EN = makeI18n("en");
const ES = makeI18n("es");

// ── every activity in the bank ────────────────────────────────────────────────
const BANDS = ["gK", "g1", "g2-3", "g3-5", "g6-8"];
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];
const all = [];
for (const band of BANDS)
  for (const file of await readdir(join(LAB, "content", band))) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(join(LAB, "content", band, file), "utf8"));
    for (const [level, L] of Object.entries(data.levels || {}))
      for (const a of L.activities || [])
        all.push({
          band: band.slice(1),
          domain: data.domain || file.replace(".json", ""),
          level,
          a,
        });
  }
for (const file of await readdir(join(LAB, "content/tests"))) {
  const t = JSON.parse(await readFile(join(LAB, "content/tests", file), "utf8"));
  for (const s of t.sections || [])
    for (const a of s.items || []) all.push({ band: "test", domain: s.domain, level: "", a });
}

test("content: every family is bilingual, complete and drawn from tokens only", () => {
  const entries = [...DATA.families, ...Object.values(DATA.fallbacks)];
  const ids = new Set();
  const pair = (p, where) => {
    assert.ok(
      p && typeof p.en === "string" && p.en.trim() && typeof p.es === "string" && p.es.trim(),
      `${where}: needs EN and ES`,
    );
    assert.notEqual(p.es, p.en, `${where}: Spanish must not be a copy of the English`);
  };
  for (const f of entries) {
    assert.ok(!ids.has(f.id), `duplicate family ${f.id}`);
    ids.add(f.id);
    pair(f.title, `${f.id}.title`);
    pair(f.can, `${f.id}.can`);
    assert.match(f.can.en, /^I can /, `${f.id}: goal starts "I can"`);
    assert.match(f.can.es, /^Puedo /, `${f.id}: meta empieza con "Puedo"`);
    assert.equal(f.steps.length, 3, `${f.id}: three moves`);
    f.steps.forEach((s, i) => pair(s, `${f.id}.steps[${i}]`));
    pair(f.slip, `${f.id}.slip`);
    pair(f.model.think, `${f.id}.model.think`);
    if (f.model.result) pair(f.model.result, `${f.id}.model.result`);
    const tags = new Set(f.model.tags.map((t) => t.id));
    f.model.tags.forEach((t) =>
      /^\d+$/.test(t.en) ? assert.equal(t.es, t.en) : pair(t, `${f.id}.tag.${t.id}`),
    );
    assert.ok(f.model.lines.length >= 1);
    for (const line of f.model.lines)
      if (line.tag) assert.ok(tags.has(line.tag), `${f.id}: unknown tag ${line.tag}`);
    pair(f.diagram.title, `${f.id}.diagram.title`);
    assert.ok(["flow", "hub", "venn", "ladder"].includes(f.diagram.kind), `${f.id}: diagram kind`);
    for (const n of f.diagram.nodes || []) pair(n, `${f.id}.diagram.node`);
    if (f.match) new RegExp(f.match, "i");
    for (const d of f.domains || []) assert.ok(DOMAINS.includes(d), `${f.id}: domain ${d}`);
  }
  for (const d of DOMAINS) assert.ok(DATA.fallbacks[d], `fallback for ${d}`);
  const text = JSON.stringify(DATA);
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text), "no emoji");
  assert.ok(
    !/\b(WIDA level|scale score|Lexile|proficiency level)\b/i.test(text),
    "no invented levels or scores",
  );
});

test("content: every activity in every band gets a skill lesson, and the match is specific", () => {
  const used = {};
  let fallback = 0;
  for (const { domain, a } of all) {
    const f = familyFor(DATA, domain, a.skill);
    assert.ok(f, `${a.id}: no family`);
    used[f.id] = (used[f.id] || 0) + 1;
    if (!f.match) fallback++;
  }
  assert.ok(Object.keys(used).length >= 28, `only ${Object.keys(used).length} families used`);
  assert.ok(
    fallback / all.length < 0.1,
    `${fallback} of ${all.length} activities fell back to a generic lesson`,
  );
});

test("content: a worked model never repeats a sentence from the activity bank", () => {
  const bank = all
    .map(({ a }) =>
      JSON.stringify([a.passage, a.script, a.prompt, a.sentences, a.options]).toLowerCase(),
    )
    .join("\n");
  for (const f of DATA.families)
    for (const line of f.model.lines)
      if (line.t.length > 24)
        assert.ok(
          !bank.includes(line.t.toLowerCase()),
          `${f.id}: "${line.t}" is in the activity bank`,
        );
});

// ── pure logic ────────────────────────────────────────────────────────────────
test("familyFor honors the domain, the order and the fallback", () => {
  assert.equal(familyFor(DATA, "Reading", "Identify the main idea").id, "main-idea");
  assert.equal(
    familyFor(DATA, "Writing", "Writing a compare-and-contrast response").id,
    "compare-contrast",
  );
  assert.equal(familyFor(DATA, "Speaking", "Explain a process aloud in order").id, "sequence");
  assert.equal(familyFor(DATA, "Reading", "Printable practice").id, "fallback-reading");
  assert.equal(familyFor(DATA, "Writing", "zzz unmatched").id, "fallback-writing");
  assert.equal(familyFor(null, "Reading", "x"), null);
  // read-data is for Reading; a Writing activity about a table gets the describe-data lesson
  assert.equal(familyFor(DATA, "Writing", "Describing data in writing").id, "describe-data");
});

test("arcState: Warm up, Learn, Try, Reflect, with Learn skipped when working alone", () => {
  const at = (flags) =>
    frame
      .arcState(flags)
      .steps.map((s) => `${s.id}:${s.status}`)
      .join(" ");
  assert.equal(at({ mode: "supported" }), "warm:current learn:todo try:todo reflect:todo");
  assert.equal(
    at({ mode: "supported", learnSeen: true }),
    "warm:done learn:done try:current reflect:todo",
  );
  assert.equal(at({ mode: "independent" }), "warm:current learn:skipped try:todo reflect:todo");
  assert.equal(
    at({ mode: "supported", learnSeen: true, attempted: true, done: true }),
    "warm:done learn:done try:done reflect:current",
  );
  const full = frame.arcState({ mode: "supported", learnSeen: true, done: true, reflected: true });
  assert.equal(full.complete, 4);
  assert.equal(full.current, -1);
  assert.equal(
    frame.arcState({ mode: "independent" }).complete,
    0,
    "a skipped step is not progress",
  );
});

test("partialCredit is specific per answer type and null where it cannot be", () => {
  assert.deepEqual(
    frame.partialCredit({ type: "multiSelect", answers: ["a", "b", "c"] }, ["a", "x"]),
    { right: 1, total: 3 },
  );
  assert.deepEqual(
    frame.partialCredit({ type: "order", answer: ["1", "2", "3"] }, ["1", "3", "2"]),
    { right: 1, total: 3 },
  );
  assert.deepEqual(
    frame.partialCredit(
      {
        type: "sort",
        items: [
          { id: "a", answer: "x" },
          { id: "b", answer: "y" },
        ],
      },
      { a: "x", b: "x" },
    ),
    { right: 1, total: 2 },
  );
  assert.deepEqual(
    frame.partialCredit(
      { type: "cloze", segments: [{ text: "t" }, { blank: { id: "b1", answer: "go" } }] },
      { b1: "go" },
    ),
    { right: 1, total: 1 },
  );
  assert.equal(frame.partialCredit({ type: "multipleChoice", answer: "a" }, "b"), null);
});

test("spanish glosses, minutes and key words come from the activity's own fields", () => {
  assert.deepEqual(frame.spanishGloss("spanish: polen"), { term: "polen", def: "" });
  assert.deepEqual(frame.spanishGloss("polen: un polvo que mueven las abejas"), {
    term: "polen",
    def: "un polvo que mueven las abejas",
  });
  assert.equal(frame.minutesOf({ time: "6 min" }), 6);
  assert.equal(frame.minutesOf({}), null);
  assert.equal(frame.keyWords({ vocabulary: [["a", "b", "spanish: c"]] })[0].es.term, "c");
});

test("diagrams: every kind draws a titled, described, script-free svg", () => {
  for (const f of [...DATA.families, ...Object.values(DATA.fallbacks)])
    for (const I of [EN, ES]) {
      const svg = diagramSVG(I, f.diagram, `t-${f.id}`);
      assert.match(svg, /^<svg[^>]+role="img"/);
      assert.match(svg, /<title id="t-[^"]+">[^<]+<\/title><desc/);
      assert.ok(!/<script|foreignObject|href=/i.test(svg));
      const h = Number(svg.match(/viewBox="0 0 320 (\d+)"/)?.[1]);
      assert.ok(h > 60 && h < 700, `${f.id}: height ${h}`);
    }
  assert.equal(diagramSVG(EN, null), "");
});

// ── the real activity view, per activity type ─────────────────────────────────
const pick = (pred) => all.find((x) => x.band === "6-8" && pred(x));
const SAMPLES = {
  multipleChoice: pick(
    (x) => x.domain === "Listening" && x.a.type === "multipleChoice" && x.a.script,
  ),
  multiSelect: pick((x) => x.a.type === "multiSelect" && x.domain === "Reading"),
  sort: pick((x) => x.a.type === "sort"),
  order: pick((x) => x.a.type === "order"),
  cloze: pick((x) => x.a.type === "cloze"),
  hotText: pick((x) => x.a.type === "hotText" && x.domain === "Reading" && x.a.passage),
  writing: pick((x) => x.domain === "Writing" && x.a.type === "constructed"),
  speaking: pick((x) => x.domain === "Speaking" && x.a.type === "constructed"),
  worksheet: pick((x) => x.a.type === "worksheet"),
};
const ctxFor = (s, lang = "en") => ({
  band: s.band,
  route: { view: "activity", domain: s.domain, level: s.level, id: s.a.id },
  prefs: { rate: 0.9, lang },
  rerender() {},
  navigate() {},
  setPrefs() {},
});
async function render(s, { mode = "supported", lang = "en" } = {}) {
  globalThis.location = {
    search: mode === "independent" ? "?mode=independent" : "",
    href: "http://lab.test/",
  };
  const out = await activity.render(ctxFor(s, lang));
  const dom = new JSDOM(`<!doctype html><body>${toHtml(out.html)}</body>`);
  return { doc: dom.window.document, html: toHtml(out.html) };
}
const reset = () => values.clear();

for (const [type, s] of Object.entries(SAMPLES)) {
  test(`frame renders around a ${type} activity (${s?.a.id})`, async () => {
    assert.ok(s, `no ${type} sample in the bank`);
    reset();
    const { doc } = await render(s);
    assert.equal(doc.querySelectorAll(".lf-arc > li").length, 4, "four steps");
    assert.equal(
      doc.querySelector('.lf-arc [aria-current="step"]')?.querySelector("[data-frame-go]").dataset
        .frameGo,
      "warm",
      "first visit starts at Warm up",
    );
    assert.ok(doc.querySelector(".lf-chip--skill"), "skill chip");
    assert.match(doc.querySelector(".lf-goal-text")?.textContent || "", /^I can /, "I can goal");
    const learn = doc.querySelector(".lf-learn");
    assert.ok(learn, "skill lesson");
    assert.equal(learn.querySelectorAll(".lf-moves li").length, 3);
    assert.ok(learn.querySelector("svg.lf-dg title"), "diagram");
    assert.ok(learn.querySelector(".lf-mark-label"), "model parts are named in words");
    assert.equal(
      doc.querySelector("#lf-learn-body").hasAttribute("hidden"),
      false,
      "auto-open on the first visit",
    );
    assert.ok(doc.querySelector("[data-print]"), "print button");
    assert.ok(
      doc.querySelector(".lf-print-head") && doc.querySelector(".lf-print-foot"),
      "print head and foot",
    );
    assert.ok(doc.querySelector(".act-head h1"), "the existing header is intact");
    assert.ok(doc.querySelector(".answer-zone"), "the existing answer zone is intact");
  });

  test(`Try independently keeps ${type} free of the lesson, key words and model`, async () => {
    reset();
    const { doc, html } = await render(s, { mode: "independent" });
    assert.equal(doc.querySelectorAll(".lf-arc > li").length, 4);
    assert.equal(doc.querySelector(".lf-learn"), null);
    assert.equal(doc.querySelector(".lf-words"), null);
    assert.equal(doc.querySelector("[data-frame-model]"), null);
    assert.ok(!/Worked model|Three moves/.test(html));
    assert.ok(doc.querySelector(".lf-arc-step.is-skipped"), "Learn is shown as closed");
    assert.ok(doc.querySelector(".lf-goal-text"), "the goal stays");
  });
}

test("key words are a real help <details> in Learn with help and show audio and a Spanish gloss", async () => {
  reset();
  const { doc } = await render(SAMPLES.multipleChoice);
  const words = doc.querySelector("details.helpers.lf-words");
  assert.ok(words, "key words");
  assert.equal(words.hasAttribute("open"), false, "closed until opened, so opening records help");
  assert.ok(words.querySelector("[data-say]") && words.querySelector("[data-say-es]"));
  // the same terms are not listed a second time in the starters panel
  const starters = [...doc.querySelectorAll(".vocab dt")].length;
  assert.equal(starters, 0);
});

test("English, Español and both modes render the frame without dropping parts", async () => {
  for (const lang of ["es", "bi"]) {
    reset();
    const { doc, html } = await render(SAMPLES.hotText, { lang });
    assert.equal(doc.querySelectorAll(".lf-arc > li").length, 4, lang);
    assert.ok(doc.querySelector(".lf-learn svg.lf-dg"), lang);
    if (lang === "es") {
      assert.match(doc.querySelector(".lf-rail-count").textContent, /Paso 1 de 4|Paso 2 de 4/);
      assert.match(doc.querySelector(".lf-goal-text").textContent, /^Puedo /);
      assert.ok(!/Three moves|Worked model/.test(html), "chrome is Spanish");
    } else assert.ok(doc.querySelector(".lf-goal-text .bi-es"), "both languages show");
  }
});

test("reading passages get typography, paragraph marks, a pen and picture captions hook", async () => {
  reset();
  const { doc } = await render(SAMPLES.hotText);
  assert.ok(doc.querySelector("article.passage.lf-passage"));
  assert.equal(doc.querySelectorAll("[data-frame-mark]").length, 3);
  assert.equal(doc.querySelector("[data-frame-clear-marks]").hasAttribute("disabled"), true);
});

// ── interactions (the real onClick) ───────────────────────────────────────────
const el = (attrs = {}) => ({
  dataset: Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => [
      k.replace(/^data-/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()),
      v,
    ]),
  ),
  matches: () => false,
});
const click = (attr, value = "") => ({
  target: {
    closest: (sel) => (sel === `[${attr}]` ? el({ [attr]: value }) : null),
    matches: () => false,
  },
});
const frameKey = () => JSON.parse(values.get(frame.FRAME_KEY) || "{}");

test("Got it saves the skill lesson as seen on this device; the next visit opens it closed", async () => {
  reset();
  const s = SAMPLES.multipleChoice;
  await render(s);
  assert.equal(activity.onClick(click("data-frame-ready"), ctxFor(s)), true);
  assert.equal(Object.keys(frameKey().seen).length, 1);
  assert.match(Object.keys(frameKey().seen)[0], new RegExp(`^6-8\\|${s.domain}\\|`));
  const { doc } = await render(s);
  assert.equal(doc.querySelector("#lf-learn-body").hasAttribute("hidden"), true);
  assert.equal(doc.querySelector(".lf-learn-toggle").getAttribute("aria-expanded"), "false");
  assert.match(doc.querySelector(".lf-rail-count").textContent, /Step 3 of 4: Try/);
});

test("re-opening a seen lesson is help; the first showing is instruction", async () => {
  reset();
  const s = SAMPLES.multipleChoice;
  await render(s);
  const ctx = ctxFor(s);
  activity.onClick(click("data-frame-learn-toggle"), ctx); // first showing, closing it
  assert.equal(loadRecord(s.band, s.domain, s.level).supportUsed?.[s.a.id], undefined);
  activity.onClick(click("data-frame-ready"), ctx);
  activity.onClick(click("data-frame-learn-open"), ctx);
  assert.equal(loadRecord(s.band, s.domain, s.level).supportUsed?.[s.a.id], true);
});

test("feedback is three calm parts; a miss names what is right; the model button only appears with help", async () => {
  reset();
  const s = SAMPLES.multiSelect;
  const ctx = ctxFor(s);
  await render(s);
  const rec = loadRecord(s.band, s.domain, s.level);
  const wrong = [s.a.answers[0], s.a.options.find((o) => !s.a.answers.includes(o.id)).id];
  rec.answers[s.a.id] = wrong;
  saveRecord(s.band, s.domain, s.level, rec);
  await render(s);
  activity.onClick(
    { target: { closest: (sel) => (sel === "[data-check]" ? el() : null), matches: () => false } },
    ctx,
  );
  const { doc } = await render(s);
  const fb = doc.querySelector(".feedback.is-hint");
  assert.ok(fb, "miss feedback");
  const heads = [...fb.querySelectorAll(".lf-fb-part h3")].map((h) => h.textContent);
  assert.deepEqual(heads, ["What went well", "One next step"]);
  assert.match(
    fb.querySelector(".lf-fb-part p").textContent,
    new RegExp(`You have 1 of ${s.a.answers.length} right`),
  );
  assert.ok(fb.querySelector("[data-frame-model]"), "model button when learning with help");
  assert.ok(fb.querySelector("[data-retry]"));
  const alone = await render(s, { mode: "independent" });
  assert.equal(alone.doc.querySelector("[data-frame-model]"), null);
  assert.equal(
    alone.doc.querySelector(".lf-after"),
    null,
    "no reflection until the learner is done",
  );
});

test("after a right answer: reflection chips, a saved choice, and a next best step", async () => {
  reset();
  const s = SAMPLES.multipleChoice;
  const ctx = ctxFor(s);
  await render(s);
  const rec = loadRecord(s.band, s.domain, s.level);
  rec.answers[s.a.id] = s.a.answer;
  saveRecord(s.band, s.domain, s.level, rec);
  await render(s);
  activity.onClick(
    { target: { closest: (sel) => (sel === "[data-check]" ? el() : null), matches: () => false } },
    ctx,
  );
  const first = await render(s);
  assert.ok(first.doc.querySelector(".feedback.is-right .lf-fb-part"));
  const chips = [...first.doc.querySelectorAll("[data-frame-helped]")].map(
    (b) => b.dataset.frameHelped,
  );
  assert.deepEqual(chips, ["words", "lesson", "again", "hint", "unsure"]);
  assert.ok(first.doc.querySelector(".lf-next h3"), "next best step");
  assert.match(first.doc.querySelector(".lf-rail-count").textContent, /Step 4 of 4: Reflect/);
  activity.onClick(click("data-frame-helped", "again"), ctx);
  assert.equal(frameKey().reflect[s.a.id].id, "again");
  const second = await render(s);
  assert.equal(
    second.doc.querySelector('[data-frame-helped="again"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.match(second.doc.querySelector(".lf-rail-count").textContent, /All four steps done/);
  activity.onClick(click("data-frame-helped", "again"), ctx);
  assert.equal(frameKey().reflect[s.a.id], undefined, "pressing again takes it back");
  assert.ok(
    !/\b(score|level|predict)/i.test(first.doc.querySelector(".lf-next").textContent),
    "no score, level or prediction",
  );
});

test("next best step: after supported success it offers the next activity on its own; after a miss, the lesson", () => {
  const base = {
    ok: true,
    supportUsed: true,
    mode: "supported",
    nextHref: "/n",
    independentHref: "/n?mode=independent",
    roomHref: "/r",
    hasLearn: true,
  };
  const t = (n) => toHtml(frame.nextStepHTML(EN, n));
  assert.match(t(base), /Try one on your own/);
  assert.match(t(base), /href="\/n\?mode=independent"/);
  assert.match(t({ ...base, supportUsed: false }), /Keep going/);
  assert.match(
    t({ ...base, nextHref: "", independentHref: "", supportUsed: false }),
    /reached the end/,
  );
  const miss = t({ ...base, ok: false });
  assert.match(miss, /data-frame-learn-open/);
  assert.match(miss, /Look at the skill/);
  assert.match(toHtml(frame.nextStepHTML(ES, base)), /Intenta una tú solo o sola/);
});

test("pen marks: tool toggles state, a sentence takes a mark, clear is offered", async () => {
  reset();
  const s = SAMPLES.hotText;
  const ctx = ctxFor(s);
  await render(s);
  activity.onClick(click("data-frame-mark", "highlight"), ctx);
  const { doc } = await render(s);
  assert.equal(
    doc.querySelector('[data-frame-mark="highlight"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(doc.querySelector(".lf-annotate-hint").hasAttribute("hidden"), false);
  const sentence = { dataset: { sentIdx: "1" } };
  const hit = activity.onClick(
    {
      target: {
        closest: (sel) => (sel === "[data-reading-passage] .reading-sentence" ? sentence : null),
        matches: () => false,
      },
    },
    ctx,
  );
  assert.equal(hit, true);
  assert.equal(sentence.dataset.mark, "highlight");
  const again = await render(s);
  assert.equal(again.doc.querySelector("[data-frame-clear-marks]").hasAttribute("disabled"), false);
  activity.onClick(click("data-frame-clear-marks"), ctx);
  activity.onClick(click("data-frame-mark", "highlight"), ctx); // pen off
});

test("the frame saves only seen lessons and what helped, in one small key outside the progress prefix", async () => {
  reset();
  const s = SAMPLES.multipleChoice;
  await render(s);
  activity.onClick(click("data-frame-ready"), ctxFor(s));
  activity.onClick(click("data-frame-helped", "words"), ctxFor(s));
  assert.ok(!frame.FRAME_KEY.startsWith("accessPracticeLab:v1:"));
  assert.match(frame.FRAME_KEY, /:v\d+$/);
  assert.deepEqual(Object.keys(frameKey()).sort(), ["reflect", "seen"]);
  assert.ok(storage.get(frame.FRAME_KEY).length < 400);
});
