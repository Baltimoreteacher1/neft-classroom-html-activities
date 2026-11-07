// Newsroom: prompt and picture content, the 5W1H and draft observations (counts of the learner's own words, never a grade),
// the front page, and the four steps mounted in jsdom in English and Spanish.
import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";
import {
  COUNTDOWN,
  click,
  EMOJI,
  makeCtx,
  mount,
  resetStorage,
  type,
  win,
} from "./lib/access-studios-dom.mjs";

const { NEWS_PROMPTS, PICS, PIC_IDS } = await import(
  "../access-practice-lab/src/content/newsroom.js"
);
const logic = await import("../access-practice-lab/src/lang/newsroom.js");
const nr = await import("../access-practice-lab/src/views/newsroom.js");
const ledger = await import("../access-practice-lab/src/lang/ledger.js");

const KINDS = new Set(["news", "feature", "opinion", "how-to", "interview", "sports", "review"]);
const ctxFor = (lang, id = "", step = "", band = "6-8") =>
  makeCtx("newsroom", { lang, band, id, tab: step });
const P = NEWS_PROMPTS.find((p) => p.b === "6-8");

test("48 original story prompts across seven kinds, with both languages, two reporter questions and a picture", () => {
  assert.ok(NEWS_PROMPTS.length >= 40);
  assert.equal(new Set(NEWS_PROMPTS.map((p) => p.id)).size, NEWS_PROMPTS.length);
  for (const b of ["3-5", "6-8"]) assert.ok(NEWS_PROMPTS.filter((p) => p.b === b).length >= 20, b);
  const kinds = new Map();
  for (const p of NEWS_PROMPTS) {
    for (const k of ["title", "titleEs", "seed", "seedEs"]) assert.ok(p[k], `${p.id}.${k}`);
    assert.ok(KINDS.has(p.kind) && PIC_IDS.includes(p.pic), p.id);
    assert.equal(p.ask.length, 2);
    assert.equal(p.askEs.length, 2);
    kinds.set(p.kind, (kinds.get(p.kind) || 0) + 1);
  }
  for (const k of KINDS) assert.ok(kinds.get(k) >= 4, `${k}: ${kinds.get(k)}`);
});

test("16 built-in pictures are inline SVG with names in both languages and no external references", () => {
  assert.equal(PIC_IDS.length, 16);
  for (const id of PIC_IDS) {
    const [en, es, svg] = PICS[id];
    assert.ok(en && es && svg.length > 100, id);
    assert.doesNotMatch(svg, /<script|href=|<image|url\(http/i);
  }
});

test("observations count the learner's own words and compare them with the plan", () => {
  const plan = {
    who: "Room twelve students",
    what: "planted a garden",
    when: "on Friday",
    where: "behind the gym",
    why: "to grow food",
    how: "with help",
  };
  const lead = { lead: "On Friday, Room twelve students planted a garden behind the gym." };
  const obs = logic.observe(
    {
      ...lead,
      details: "First, they dug. Then they planted because it was fun",
      quote: "“It was fun,” said Maya.",
      ending: "Next week they will water it.",
    },
    plan,
    "article",
  );
  const by = Object.fromEntries(obs.map((o) => [o.id, o]));
  assert.equal(by.lead.ok, true);
  assert.equal(by.quote.ok, true);
  assert.equal(by.links.ok, true);
  assert.equal(by.ends.ok, false, "a sentence without an ending mark is named");
  assert.match(by.ends.en, /1 sentence needs/);
  const none = logic.observe(
    { lead: "Something happened.", quote: "no quote here" },
    plan,
    "article",
  );
  assert.equal(none.find((o) => o.id === "lead").ok, false);
  assert.equal(none.find((o) => o.id === "quote").ok, false);
  assert.ok(logic.observe({ lead: "On ___, ___" }, plan, "article").some((o) => o.id === "blanks"));
  assert.deepEqual(logic.observe({}, plan, "article"), []);
  for (const o of obs) assert.ok(o.en && o.es);
  assert.equal(logic.planCount(plan), 6);
  assert.equal(logic.storyWords({ lead: "one two", details: "three" }, "article"), 3);
  assert.deepEqual(logic.partsOf("newscast"), ["opener", "lead", "details", "quote", "signoff"]);
});

test("headline check: length, capital letter, never a score", () => {
  assert.equal(logic.headlineCheck("").ok, false);
  assert.equal(logic.headlineCheck("Too short").ok, false);
  assert.equal(logic.headlineCheck("students plant a new garden").ok, false);
  assert.equal(logic.headlineCheck("Students Plant a New Garden Behind the Gym").ok, true);
  assert.equal(logic.headlineCheck(Array(14).fill("word").join(" ")).ok, false);
});

test("front page is print-ready, escapes learner text and includes the picture", () => {
  const story = {
    fmt: "article",
    head: "A <b>Garden</b> Grows",
    by: "Maya",
    draft: { lead: "Lead <i>here</i>.", details: "More." },
    pic: "garden",
  };
  const html = logic.frontPageHTML({
    story,
    prompt: P,
    pic: PICS.garden,
    kindLabel: "Class newspaper article",
    date: "Nov 6",
    footer: "Practice",
  });
  assert.match(html, /&lt;b&gt;Garden&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>Garden/);
  assert.match(html, /<svg viewBox="0 0 240 160"/);
  assert.match(html, /By Maya/);
  const doc = logic.sheetDocument(html, "x");
  assert.match(doc, /@page\{size:letter/);
  assert.match(doc, /^<!doctype html>/);
  assert.doesNotMatch(doc, /<script/);
});

test("hub and all four steps render in English, Spanish and bilingual without timers, scores or emoji", async () => {
  resetStorage();
  for (const band of ["3-5", "6-8"]) {
    for (const lang of ["en", "es", "bi"]) {
      const hub = await mount(nr, ctxFor(lang, "", "", band));
      assert.ok(hub.root.querySelector("h1"));
      assert.ok(hub.root.querySelectorAll(".nr-card").length >= 20, `${band}: cards`);
      for (const step of ["plan", "draft", "read", "front"]) {
        const p = NEWS_PROMPTS.find((x) => x.b === band);
        const m = await mount(nr, ctxFor(lang, p.id, step, band));
        assert.ok(m.root.querySelector("h1"), `${band} ${lang} ${step}`);
        assert.doesNotMatch(m.text, COUNTDOWN);
        assert.doesNotMatch(m.text, SCORE_CLAIM);
        assert.doesNotMatch(m.root.innerHTML, EMOJI);
      }
    }
  }
  const es = await mount(nr, ctxFor("es", P.id, "plan"));
  assert.match(es.text, /Planea tu historia con 5W1H/);
});

test("a story goes from plan to front page; frames and picture work by button; evidence holds counts only", async () => {
  resetStorage();
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => {};
  win.HTMLAnchorElement.prototype.click = function () {
    win.__downloaded = this.download;
  };
  let ctx = ctxFor("en", P.id, "plan");
  let m = await mount(nr, ctx);
  assert.equal(m.root.querySelectorAll("[data-nr-w5]").length, 6);
  for (const [k, v] of [
    ["who", "Room twelve students"],
    ["what", "built a bird feeder"],
    ["when", "on Friday"],
    ["where", "in the courtyard"],
    ["why", "to help birds in winter"],
    ["how", "with wood and wire"],
  ])
    type(nr, ctx, m.root, `[data-nr-w5="${k}"]`, v, "onInput");
  type(nr, ctx, m.root, '[data-nr-w5="how"]', "with wood and wire", "onChange");
  click(nr, ctx, m.root, '[data-nr-fmt="newscast"]');
  m = await mount(nr, ctx);
  assert.match(m.text, /Planning|6 boxes|6 of 6/);

  ctx = ctxFor("en", P.id, "draft");
  m = await mount(nr, ctx);
  assert.deepEqual(
    [...m.root.querySelectorAll("[data-nr-part]")].map((x) => x.dataset.nrPart),
    ["opener", "lead", "details", "quote", "signoff"],
  );
  click(nr, ctx, m.root, '[data-nr-frame="lead|0"]');
  m = await mount(nr, ctx);
  assert.match(m.root.querySelector('[data-nr-part="lead"]').value, /On ___/);
  type(
    nr,
    ctx,
    m.root,
    '[data-nr-part="lead"]',
    "On Friday, Room twelve students built a bird feeder in the courtyard to help birds in winter.",
    "onInput",
  );
  type(
    nr,
    ctx,
    m.root,
    '[data-nr-part="details"]',
    "First, they cut wood. Then they added wire because birds need food. Next, they hung it up.",
    "onInput",
  );
  type(nr, ctx, m.root, '[data-nr-part="quote"]', "“It looks great,” said Maya.", "onChange");
  m = await mount(nr, ctx);
  assert.match(m.text, /What I notice in your draft/);
  assert.match(m.text, /uses details from/);

  ctx = ctxFor("en", P.id, "read");
  m = await mount(nr, ctx);
  assert.ok(m.root.querySelector(".nr-script"), "script shown to read");
  assert.match(m.root.textContent, /cannot record|Record my answer/);

  ctx = ctxFor("en", P.id, "front");
  m = await mount(nr, ctx);
  type(
    nr,
    ctx,
    m.root,
    "[data-nr-head]",
    "Students Build Bird Feeder for Winter Visitors",
    "onChange",
  );
  m = await mount(nr, ctx);
  click(nr, ctx, m.root, '[data-nr-pic="science"]');
  m = await mount(nr, ctx);
  assert.ok(m.root.querySelector(".nr-sheet .nr-headline").textContent.includes("Bird Feeder"));
  assert.ok(m.root.querySelector(".nr-sheet svg"));
  assert.ok(m.root.querySelector(".nr-sheet").textContent.includes("It looks great"));
  click(nr, ctx, m.root, "[data-nr-dl]");
  assert.equal(win.__downloaded, "front-page.html");

  const entries = JSON.parse(localStorage.getItem(ledger.LEDGER_KEY)).entries.filter(
    (e) => e.src === "newsroom",
  );
  assert.deepEqual(
    entries.map((e) => e.task.split("|")[0] === P.id),
    entries.map(() => true),
  );
  assert.ok(entries.length >= 3, `plan, draft and publish evidence: ${entries.length}`);
  for (const e of entries)
    assert.ok(
      Object.values(e.m).every((v) => typeof v === "number"),
      "no learner text in the ledger",
    );
  const saved = JSON.parse(localStorage.getItem(nr.NR_KEY));
  assert.equal(saved.stories[P.id].fmt, "newscast");
  assert.equal(saved.stories[P.id].pic, "science");
});

test("support levels: A shows frames with Spanish and a word bank; C hides frames until help is opened", async () => {
  resetStorage();
  const ctx = ctxFor("en", P.id, "draft");
  localStorage.setItem(nr.NR_KEY, JSON.stringify({ level: "A", stories: {}, ev: {} }));
  let m = await mount(nr, ctx);
  assert.ok(m.root.querySelector(".nr-frame small[lang=es]"));
  assert.ok(m.root.querySelector("[data-nr-bank]"));
  localStorage.setItem(nr.NR_KEY, JSON.stringify({ level: "C", stories: {}, ev: {} }));
  m = await mount(nr, ctx);
  assert.equal(m.root.querySelector(".nr-frame"), null);
  assert.equal(m.root.querySelector("[data-nr-bank]"), null);
  click(nr, ctx, m.root, "[data-nr-help]");
  m = await mount(nr, ctx);
  assert.ok(m.root.querySelector(".nr-frame"));
});
