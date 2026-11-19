#!/usr/bin/env node
// Family Language Story (access-practice-lab/src/family/story/, access-teacher/family-share/): the pure story model and
// share-link contract, the evidence behind it, and the family page and teacher view rendered in JSDOM. Pins the rules of
// LANGUAGE-INTELLIGENCE.md on what a family reads (verbatim quotes only; no score, level, percent, timer or proficiency
// label in English or Spanish; a grade-5 reading level) and the privacy contract of a share link (only approved fields,
// no roster, no alias unless the teacher typed a first name, nothing sent anywhere).
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://lab.test/access-practice-lab/family/story",
});
for (const k of ["window", "document", "localStorage", "location", "history"])
  globalThis[k] = dom.window[k];
globalThis.fetch = async () => {
  throw new Error("the Family Language Story must not touch the network");
};

const wording = await import("../access-practice-lab/src/family/story/wording.js");
const model = await import("../access-practice-lab/src/family/story/model.js");
const link = await import("../access-practice-lab/src/family/story/link.js");
const { evidenceFor, quoteCandidates } = await import("../access-teacher/family-share/evidence.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { storyHTML, replyHTML } = await import("../access-practice-lab/src/family/story/render.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const page = await import("../access-practice-lab/src/family/story/page.js");
const store = await import("../access-practice-lab/src/family/story/store.js");
const { storyCardHTML } = await import("../access-practice-lab/src/family/story/card.js");
const { mountFamilyShare } = await import("../access-teacher/family-share/panel.js");
const { ROSTER_KEY } = await import("../access-teacher/roster-store.js");
const { SHARE_KEY } = await import("../access-teacher/family-share/store.js");
const { mountClassIntelligence } = await import("../access-teacher/intel/panel.js");

const NOW = Date.parse("2026-11-18T12:00:00Z");
const DAY = 864e5;
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();
const TEXT =
  "Plants need light because they make food from sunlight. For example, the seedlings near the window grew taller, but the seedlings in the closet stayed small. This shows that light matters.";
const QUOTE = "Plants need light because they make food from sunlight.";

const BANNED_EN =
  /\b(scores?|levels?|percent(age)?|timers?|timed|proficien\w*|beginner|advanced|behind|below|ahead|fluen\w*|wida|access|rank(ing)?)\b|%/i;
const BANNED_ES =
  /\b(puntajes?|puntuaci[oó]n(es)?|niveles?|porcentajes?|temporizador|cron[oó]metro|competencia|dominio|principiante|avanzad[oa]|wida|access)\b|%/i;

const syllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const stem = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (stem.match(/[aeiouy]{1,2}/g) || []).length);
};
const sentencesOf = (text) => text.split(/(?<=[.!?:])\s+/).filter(Boolean);
const wordsOf = (text) => text.match(/[\p{L}’']+/gu) || [];
/** Flesch-Kincaid grade of English text. */
const fkGrade = (text) => {
  const words = wordsOf(text);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return (0.39 * words.length) / sentencesOf(text).length + (11.8 * syl) / words.length - 15.59;
};
const blanks = (t) => t.replace(/_{3,}/g, "blank");

const passport = (alias, extra = {}) => ({
  alias,
  band: "6-8",
  section: "P3",
  ledger: { entries: [] },
  records: {},
  studio: { writing: {}, speaking: {} },
  ...extra,
});
const entry = (daysAgo, domain = "Writing", use = "Argue") => ({
  id: `e-${domain}-${daysAgo}`,
  t: iso(daysAgo),
  src: "writing",
  task: "t1",
  band: "6-8",
  domain,
  use,
  stage: "independent",
  kind: "first",
  supports: {},
  m: { words: 40 },
});
const ana = () =>
  passport("Ana", {
    ledger: { entries: [entry(1), entry(3)] },
    studio: { writing: { t1: { stage: "independent", versions: [{ text: TEXT }] } }, speaking: {} },
    records: {
      r1: {
        band: "6-8",
        domain: "Reading",
        level: "A",
        results: { a: { skill: "Main idea", ok: true, supportUsed: false, date: iso(2) } },
      },
    },
  });

const textOf = (root) => root.textContent.replace(/\s+/g, " ");
const tick = () => new Promise((r) => setTimeout(r, 30));
const fresh = () => {
  // One root at a time: duplicate ids across old roots would confuse selector lookups.
  document.body.replaceChildren();
  const root = document.createElement("div");
  document.body.append(root);
  return root;
};
const click = (root, sel) =>
  root.querySelector(sel).dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const typeInto = (root, sel, value) => {
  const input = root.querySelector(sel);
  input.value = value;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
};
const rendered = (I, story, opts = {}) => {
  const root = fresh();
  root.innerHTML = toHtml(
    storyHTML(I, model.compose(story), { ticks: {}, how: "tried", both: false }, opts),
  );
  return root;
};
/** The text a family reads, minus the child's own words, the name and the teacher's note. */
const authoredOnly = (root) => {
  const clone = root.cloneNode(true);
  for (const n of clone.querySelectorAll(".fls-quote blockquote, .fls-note p, svg")) n.remove();
  return clone.textContent.replace(/\s+/g, " ");
};

const FULL = {
  n: "Mia",
  l: "bi",
  d: ["L", "S"],
  w: 3,
  c: "lk",
  s: ["l1", "sn", "r1"],
  q: QUOTE,
  m: "w",
  t: "Mia led our talk today.",
  x: "en",
  k: "261116",
};

test("wording: no score, level, percent, timer or proficiency label in either language", () => {
  const strings = [];
  const walk = (v) => {
    if (typeof v === "string") strings.push(v);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  for (const key of [
    "CELEBRATE",
    "STARTERS",
    "EITHER",
    "QUOTE_LEAD",
    "WEEK",
    "NOTE_FROM",
    "REPLY",
    "FINE",
    "FROM_LINK",
    "DOMAIN_WORD",
    "SUBJECT",
  ])
    walk(wording[key]);
  assert.ok(strings.length > 80);
  for (const s of strings) {
    assert.doesNotMatch(s, BANNED_EN, s);
    assert.doesNotMatch(s, BANNED_ES, s);
  }
});

test("wording: every English and Spanish sentence exists and Spanish is not English copied over", () => {
  const pairs = [
    ...Object.values(wording.CELEBRATE),
    ...Object.values(wording.STARTERS).flatMap((s) => [s.ask, s.frame]),
    ...Object.values(wording.QUOTE_LEAD),
    ...Object.values(wording.REPLY),
    ...Object.values(wording.WEEK.days),
    wording.EITHER,
    wording.FINE,
    wording.FROM_LINK,
    wording.NOTE_FROM,
  ];
  for (const p of pairs) {
    assert.ok(p.en?.length > 3 && p.es?.length > 3, JSON.stringify(p));
    if (
      !/^_+( because _+)?\.?$/.test(p.en.replace(/[. ]/g, "")) &&
      !/^___ because ___\.$/.test(p.en)
    )
      assert.notEqual(p.en, p.es);
  }
  assert.equal(Object.keys(wording.STARTERS).length, 12);
  assert.deepEqual(
    new Set(Object.values(wording.STARTERS).map((s) => s.domain)),
    new Set(["L", "R", "S", "W"]),
  );
});

test("reading level: everything authored reads at grade 5 or below in English and in short sentences in Spanish", () => {
  const stories = [
    FULL,
    {},
    { w: 0, d: [], c: "ef" },
    { d: ["R", "W"], w: 1, c: "sr", s: ["r2", "wa", "l3"] },
  ];
  const en = [];
  const es = [];
  for (const s of stories) {
    const t = model.authoredText(s);
    en.push(...t.en.map(blanks));
    es.push(...t.es.map(blanks));
  }
  const allEn = en.join(" ");
  assert.ok(fkGrade(allEn) <= 5, `English grade ${fkGrade(allEn).toFixed(2)}`);
  for (const sentence of en.flatMap(sentencesOf))
    assert.ok(wordsOf(sentence).length <= 16, sentence);
  const sentences = es.flatMap(sentencesOf);
  const avg = sentences.reduce((n, s) => n + wordsOf(s).length, 0) / sentences.length;
  assert.ok(avg <= 12, `Spanish average sentence ${avg.toFixed(1)} words`);
  for (const sentence of sentences) assert.ok(wordsOf(sentence).length <= 22, sentence);
});

test("model: normalizeStory repairs anything and never carries contact details or markup", () => {
  const s = model.normalizeStory({
    n: "Mia <script>alert(1)</script>",
    l: "fr",
    d: "SQLW",
    w: 99,
    c: "zz",
    s: ["l1", "l1", "nope", "sn"],
    q: "Call me at 410-555-0123",
    t: "Email teacher@school.org or see https://x.example",
    k: "abc",
  });
  assert.equal(s.n, "");
  assert.equal(s.l, "bi");
  assert.deepEqual(s.d, ["L", "S", "W"]);
  assert.equal(s.w, 7);
  assert.equal(s.c, "ef");
  assert.deepEqual(s.s, ["l1", "sn"]);
  assert.equal(s.q, "");
  assert.equal(s.t, "");
  assert.equal(s.k, "");
  assert.equal(model.normalizeStory(null).s.length, 3);
  assert.equal(model.cleanName("Ana-María"), "Ana-María");
  assert.equal(model.cleanName("A".repeat(21)).length, 20, "a long name is capped");
  assert.equal(model.cleanName("Mia <b>"), "", "markup is refused, not cleaned");
  assert.equal(model.cleanText("x".repeat(161), 160), "", "too long is refused whole, never cut");
  assert.equal(model.cleanText("Great talk in class.", 160), "Great talk in class.");
});

test("model: starters follow the skills practiced and the kind of language", () => {
  assert.deepEqual(model.pickStarters({ domains: ["W"], uses: { W: "argue" } }), [
    "wa",
    "wn",
    "we",
  ]);
  const mixed = model.pickStarters({ domains: ["L", "S", "R"], uses: { S: "explain" } });
  assert.equal(mixed.length, 3);
  assert.deepEqual(
    mixed.map((id) => wording.STARTERS[id].domain),
    ["L", "S", "R"],
  );
  assert.ok(mixed.includes("se"));
  assert.equal(model.pickStarters({}).length, 3, "a fallback exists with no evidence");
  assert.equal(model.weekStamp(NOW), "261116");
});

test("model: compose gives both languages for every part, and a quiet week is never blamed", () => {
  const c = model.compose(FULL);
  assert.equal(c.title.en, "Mia’s Language Story");
  assert.match(c.title.es, /Mia/);
  assert.equal(c.week.line.en, "Mia practiced on 3 days this week.");
  assert.equal(c.week.line.es, "Mia practicó 3 días esta semana.");
  assert.equal(c.starters.length, 3);
  const quiet = model.compose({ w: 0 });
  assert.match(quiet.week.line.en, /quiet. That is okay/);
  assert.equal(quiet.title.en, "Your child’s Language Story");
  assert.match(model.compose({ w: 1 }).week.line.en, /^Your child practiced on 1 day this week\.$/);
});

test("model: the reply note says only what the family chose, English first then Spanish", () => {
  const msg = model.replyMessage(FULL, { how: "hard", both: true });
  const [en, es] = msg.split("\n");
  assert.match(
    en,
    /We tried the talk at home\. It was hard for us\. We used English and Spanish\. Thank you!/,
  );
  assert.match(
    es,
    /Hicimos la conversación en casa\. Nos costó un poco\. Usamos inglés y español\./,
  );
  assert.match(es, /\(Mia\)$/);
  assert.doesNotMatch(msg, /http|#|@/);
  assert.equal(model.replyMessage({}, { how: "bogus" }).split("\n").length, 2);
});

test("model: read-aloud segments are in order, say blank for blanks, and keep the quote in English", () => {
  const es = model.readAloud(FULL, ["es"]);
  assert.equal(es[0].lang, "es");
  const quote = es.find((x) => x.text === QUOTE);
  assert.equal(
    quote.lang,
    "en",
    "the child's own words are read in the language they were written",
  );
  assert.ok(es.some((x) => /espacio en blanco/.test(x.text)));
  const en = model.readAloud(FULL, ["en"]);
  assert.ok(en.every((x) => !/_{3}/.test(x.text)));
  assert.ok(model.readAloud(FULL, ["en", "es"]).length === en.length + es.length);
});

test("link: round trip carries exactly the approved fields and nothing else", () => {
  const story = model.normalizeStory(FULL);
  const frag = link.encodeStory(story);
  assert.match(frag, /^1&/);
  assert.deepEqual(link.decodeStory(`#${frag}`), story);
  assert.deepEqual(link.decodeStory(frag), story);
  const keys = [...new URLSearchParams(frag.slice(2)).keys()];
  assert.ok(
    keys.every((k) => link.KEYS.includes(k)),
    keys.join(),
  );
  for (const forbidden of ["alias", "section", "class", "code", "student", "id", "roster", "email"])
    assert.ok(!keys.includes(forbidden));
  const url = link.storyUrl(story, { origin: "https://thelanguagepage.com" });
  assert.match(url, /^https:\/\/thelanguagepage\.com\/access-practice-lab\/family\/story#1&/);
  assert.equal(
    new URL(url).search,
    "",
    "the story is in the fragment, which a server never receives",
  );
});

test("link: no name unless the teacher typed one, and an unfinished story is a short link", () => {
  const frag = link.encodeStory({ ...FULL, n: "" });
  assert.ok(!new URLSearchParams(frag.slice(2)).has("n"));
  assert.ok(!/Ana|P3/.test(frag));
  const empty = link.encodeStory({});
  assert.ok(empty.length < 60, empty);
  assert.ok(link.decodeStory(empty));
});

test("link: the short form (for the printed QR code) drops the quote and note and fits a QR code", () => {
  const short = link.encodeStory(FULL, { short: true });
  const keys = [...new URLSearchParams(short.slice(2)).keys()];
  for (const k of ["q", "m", "t", "x"]) assert.ok(!keys.includes(k));
  const url = link.storyUrl(FULL, { origin: "https://thelanguagepage.com", short: true });
  assert.ok(link.fitsQr(url), `${url.length} bytes`);
  assert.ok(!link.fitsQr(link.storyUrl(FULL, { origin: "https://thelanguagepage.com" })));
  assert.equal(link.decodeStory(short).q, "");
});

test("link: garbage, another version and hostile text never produce a page you could be tricked by", () => {
  assert.equal(link.decodeStory(""), null);
  assert.equal(link.decodeStory("2&n=Mia"), null);
  assert.equal(link.decodeStory(`1&${"a=".repeat(2000)}`), null);
  const hostile = link.decodeStory("1&n=%3Cb%3EMia&q=%25&t=Call%20410-555-0123&d=ZZ&s=zz.l1&c=%00");
  assert.equal(hostile.n, "");
  assert.equal(hostile.q, "%");
  assert.equal(hostile.t, "");
  assert.deepEqual(hostile.s.slice(0, 1), ["l1"]);
  const root = rendered(makeI18n("en", "en"), {
    ...FULL,
    q: "<img src=x onerror=alert(1)>",
    t: "<b>hi</b>",
  });
  assert.equal(root.querySelector("img[src='x']"), null);
  assert.equal(root.querySelectorAll(".fls-note b").length, 0);
});

test("evidence: a quote is the child's own sentence, verbatim, and contact details never qualify", () => {
  const found = quoteCandidates(ana());
  assert.equal(found.length, 1);
  assert.equal(found[0].q, QUOTE);
  assert.ok(TEXT.includes(found[0].q));
  assert.equal(found[0].m, "w");
  const pii = passport("Ben", {
    studio: {
      writing: {
        t1: {
          stage: "independent",
          versions: [{ text: "Call my mom at 410 555 0123 because I need help." }],
        },
      },
      speaking: {},
    },
  });
  assert.deepEqual(quoteCandidates(pii), []);
  const said = passport("Cai", {
    studio: {
      speaking: {
        s1: {
          stage: "independent",
          takes: [{ transcript: "I think recycling matters because it keeps the park clean" }],
        },
      },
      writing: {},
    },
  });
  for (const c of quoteCandidates(said)) {
    assert.equal(c.m, "s");
    assert.ok("I think recycling matters because it keeps the park clean".includes(c.q));
  }
});

test("evidence: counts come from the class record, a live member alone has no words, and no name is invented", () => {
  const withWords = evidenceFor({ alias: "Ana", member: null, shared: ana() }, NOW);
  assert.deepEqual(withWords.d, ["R", "W"]);
  assert.equal(withWords.w, 3);
  assert.equal(withWords.k, "261116");
  assert.deepEqual(
    withWords.s,
    ["wa", "r1", "wn"],
    "talks start with the skill practiced most recently",
  );
  const live = evidenceFor(
    {
      alias: "Dee",
      member: { alias: "Dee", summary: { domains: { speaking: 4 }, weekDays: 2 } },
      shared: null,
    },
    NOW,
  );
  assert.deepEqual(live.d, ["S"]);
  assert.equal(live.w, 2);
  assert.equal(live.hasWords, false);
  assert.deepEqual(live.candidates, []);
  assert.ok(!JSON.stringify(live.s).includes("Dee"));
  const none = evidenceFor({ alias: "Eli", member: null, shared: passport("Eli") }, NOW);
  assert.deepEqual(none.d, []);
  assert.equal(none.w, 0);
});

test("family page: English, Español and both render every part with no banned label and 44px controls marked", () => {
  for (const mode of ["en", "es", "bi"]) {
    const I = makeI18n(mode, mode === "es" ? "es" : "en");
    const root = rendered(I, FULL);
    assert.equal(root.querySelectorAll("h1").length, 1, mode);
    for (const id of ["flsWeek", "flsCelebrate", "flsTalk", "flsMore"])
      assert.ok(root.querySelector(`#${id}`), `${mode} ${id}`);
    assert.equal(root.querySelectorAll(".fls-talk-card").length, 3);
    assert.ok(
      root.querySelector("[data-fls-listen]"),
      "audio-first: one button reads the whole page",
    );
    assert.equal(root.querySelector("blockquote").textContent, `“${QUOTE}”`);
    assert.equal(root.querySelector("blockquote").lang, "en");
    const text = authoredOnly(root);
    assert.doesNotMatch(text, mode === "es" ? BANNED_ES : BANNED_EN, mode);
    if (mode === "bi") {
      assert.ok(root.querySelectorAll(".bi-es[lang='es']").length > 10);
      assert.doesNotMatch(text, BANNED_ES);
    }
    assert.ok(!/undefined|\[object/.test(root.textContent), mode);
    for (const b of root.querySelectorAll("[data-fls-try]"))
      assert.equal(b.getAttribute("aria-pressed"), "false");
  }
  const es = rendered(makeI18n("es", "es"), FULL);
  assert.match(textOf(es), /La historia de lenguaje de Mia/);
  assert.match(textOf(es), /Algo para celebrar/);
  assert.ok(es.querySelectorAll("[data-say-es]").length > 0);
  assert.equal(
    es.querySelectorAll("[data-say]").length,
    1,
    "Spanish mode: the child's own English quote is the only English audio",
  );
});

test("family page: a story with no quote, no note and a quiet week still reads warmly", () => {
  const root = rendered(makeI18n("en", "en"), { w: 0, d: [] });
  assert.equal(root.querySelector("blockquote"), null);
  assert.equal(root.querySelector(".fls-note"), null);
  assert.match(textOf(root), /kept practicing, and that matters/);
  assert.match(textOf(root), /No skills yet/);
  assert.match(textOf(root), /Your child’s Language Story/);
});

test("family page: a link opens it, the address is cleaned, the phone remembers it, and 'remove' forgets it", async () => {
  localStorage.clear();
  const ctx = { prefs: { lang: "en", langChosen: true, rate: 0.9 }, setPrefs() {}, rerender() {} };
  const I = makeI18n("en", "en");
  const empty = await page.render(ctx, I);
  assert.match(toHtml(empty.html), /Open my note/);
  assert.match(toHtml(empty.html), /data-fls-paste/);
  history.replaceState(null, "", `/access-practice-lab/family/story#${link.encodeStory(FULL)}`);
  const opened = await page.render(ctx, I);
  assert.equal(
    location.hash,
    "",
    "the fragment holds a first name and a quote, so it is removed from the address bar",
  );
  const html = toHtml(opened.html);
  assert.match(html, /Mia’s Language Story/);
  assert.match(html, /data-fls-print/);
  assert.match(html, /<svg[^>]*viewBox/, "the printed card carries a QR code");
  assert.deepEqual(store.loadSaved(), model.normalizeStory(FULL));
  for (const key of Object.keys(localStorage))
    assert.ok(!key.startsWith("accessPracticeLab:v1:"), `${key} would ride in a Passport backup`);
  const again = await page.render(ctx, I);
  assert.match(
    toHtml(again.html),
    /Mia’s Language Story/,
    "a refresh with no fragment still shows the note",
  );
  assert.match(toHtml(storyCardHTML(I)), /Open the note/);
  assert.match(toHtml(storyCardHTML(I)), /Mia’s Language Story/);
  page.onClick(
    {
      target: dom.window.document
        .createElement("button")
        .appendChild(Object.assign(document.createElement("span"))),
    },
    ctx,
    I,
  );
  store.clearSaved();
  assert.equal(store.loadSaved(), null);
  assert.match(toHtml(storyCardHTML(I)), /A note from your teacher/);
});

test("family page: 'we tried it' is remembered per week and builds the note without sending anything", () => {
  localStorage.clear();
  const story = model.normalizeStory(FULL);
  assert.deepEqual(store.loadTries(story), { ticks: {}, how: "tried", both: false });
  store.saveTries(story, { ticks: { sn: true, nope: true }, how: "help", both: true });
  const tries = store.loadTries(story);
  assert.deepEqual(tries, { ticks: { sn: true }, how: "help", both: true });
  const root = fresh();
  root.innerHTML = toHtml(
    storyHTML(makeI18n("bi", "en"), model.compose(story), tries, {
      reply: replyHTML(makeI18n("bi", "en"), tries, model.replyMessage(story, tries), {
        canShare: true,
      }),
    }),
  );
  assert.equal(
    root.querySelector("[data-fls-starter='sn'] [data-fls-try]").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(root.querySelector("[data-fls-how='help']").getAttribute("aria-pressed"), "true");
  assert.match(root.querySelector("[data-fls-message]").textContent, /We would like some help/);
  assert.ok(root.querySelector("[data-fls-status][aria-live='polite']"));
  const after = model.normalizeStory({ ...FULL, k: "261123" });
  assert.deepEqual(store.loadTries(after).ticks, {}, "a new week starts clean");
});

const openShare = async (
  roster,
  source = { id: "roster", kind: "roster", section: null },
  lang = "en",
) => {
  localStorage.clear();
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  const root = fresh();
  let back = 0;
  await mountFamilyShare(root, {
    source,
    band: "6-8",
    roster,
    lang,
    onBack: () => back++,
    onLang() {},
  });
  return { root, back: () => back };
};

test("teacher view: preview, edit, approve, then a link that holds only what was approved", async () => {
  const roster = [
    ana(),
    passport("Ben", { ledger: { entries: [entry(2, "Speaking", "Explain")] } }),
  ];
  const { root } = await openShare(roster);
  assert.match(textOf(root), /Share with families/);
  assert.ok(
    root.querySelector("#fshPreview [data-family-story]"),
    "the preview is the real family page",
  );
  assert.equal(root.querySelector("#fshLink"), null, "no link exists before approval");
  assert.equal(
    root.querySelector("#fshPreview [data-fls-listen]").disabled,
    false,
    "the teacher can hear the page",
  );
  assert.match(textOf(root), /Plants need light because/);
  assert.equal(root.querySelector("#fshName").value, "", "a name is never copied from the roster");
  assert.doesNotMatch(root.querySelector("#fshPreview").textContent, /Ana|P3/);
  typeInto(root, "#fshName", "Ana");
  assert.match(root.querySelector("#fshPreview").textContent, /Ana’s Language Story/);
  typeInto(root, "#fshNote", "Call me at 410-555-0123");
  assert.equal(root.querySelector("#fshNoteBad").hidden, false);
  assert.equal(
    root.querySelector("#fshPreview .fls-note"),
    null,
    "a note with contact details is not shared",
  );
  typeInto(root, "#fshNote", "Ana helped her group.");
  assert.equal(root.querySelector("#fshNoteBad").hidden, true);
  assert.match(root.querySelector("#fshPreview .fls-note").textContent, /Ana helped her group/);
  click(root, "[data-fsh='approve']");
  await tick();
  const url = root.querySelector("#fshLink").value;
  assert.match(url, /\/access-practice-lab\/family\/story#1&/);
  const story = link.decodeStory(url.slice(url.indexOf("#")));
  assert.equal(story.n, "Ana");
  assert.equal(story.q, QUOTE);
  assert.equal(story.t, "Ana helped her group.");
  const keys = [...new URLSearchParams(url.slice(url.indexOf("#") + 3)).keys()];
  assert.ok(keys.every((k) => link.KEYS.includes(k)));
  assert.doesNotMatch(decodeURIComponent(url), /P3|P3|class|roster|ledger|Ben/);
  const saved = JSON.parse(localStorage.getItem(SHARE_KEY));
  assert.equal(Object.keys(saved.items).length, 1);
  assert.match(textOf(root), /Approved\. Anyone with the link sees exactly this\./);
  typeInto(root, "#fshName", "Anita");
  assert.equal(
    root.querySelector("#fshLink"),
    null,
    "editing after approval withdraws the link until it is approved again",
  );
  assert.match(textOf(root), /You changed this story after approving it/);
  assert.match(textOf(root), /Print approved cards \(1\)/);
});

test("teacher view: choose the words, swap a talk, switch language, approve and move to the next student", async () => {
  const { root } = await openShare([ana(), passport("Ben")]);
  const none = root.querySelector("[data-fsh-quote='']");
  none.checked = true;
  none.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(root.querySelector("#fshPreview blockquote"), null);
  const talk = root.querySelector("[data-fsh-talk='1']");
  talk.value = root.querySelector("[data-fsh-talk='0']").value;
  talk.dispatchEvent(new window.Event("change", { bubbles: true }));
  const picks = [...root.querySelectorAll("[data-fsh-talk]")].map((s) => s.value);
  assert.equal(new Set(picks).size, 3, "three different talks");
  click(root, "[data-fsh-plang='es']");
  assert.match(
    root.querySelector("#fshPreview").textContent,
    /La historia de lenguaje de su hijo o hija/,
  );
  assert.equal(root.querySelector("#fshPreview").lang, "es");
  click(root, "[data-fsh-lang='es']");
  assert.equal(root.querySelector("[data-fsh-lang='es']").getAttribute("aria-pressed"), "true");
  click(root, "[data-fsh='approve-next']");
  await tick();
  assert.equal(root.querySelector("#fshStudent").value, "Ben");
  assert.match(root.querySelector("#fshStudent").textContent, /Ana ✓ approved/);
  assert.match(textOf(root), /No writing or speaking from Ben is on this device/);
  assert.ok(root.querySelector("a[href='#classEvidence']"));
  assert.match(root.querySelector("#fshPreview").textContent, /kept practicing, and that matters/);
});

test("teacher view: Spanish chrome, a live class without Passports, and empty states that say what to do", async () => {
  const { root } = await openShare([ana()], undefined, "es");
  assert.match(textOf(root), /Compartir con las familias/);
  assert.match(textOf(root), /Lo que verá la familia/);
  assert.doesNotMatch(textOf(root), BANNED_ES);
  assert.ok(!/undefined|\[object/.test(textOf(root)));
  const empty = await openShare([]);
  assert.match(textOf(empty.root), /There are no students to write for yet/);
  assert.ok(empty.root.querySelector("a[href='#liveClass']"));
  click(empty.root, "button.ti-link");
  assert.equal(empty.back(), 1);
  const sample = await openShare([], { id: "sample", kind: "sample" });
  assert.match(textOf(sample.root), /made-up example students/);
  assert.equal(sample.root.querySelector("#fshPreview [data-family-story]") !== null, true);
});

test("hook-in: the class intelligence panel has one 'Share with families' action that opens this view", async () => {
  localStorage.clear();
  localStorage.setItem(ROSTER_KEY, JSON.stringify([ana()]));
  history.replaceState(null, "", "/access-teacher/?task=analyze");
  const root = fresh();
  await mountClassIntelligence(root, { band: "6-8" });
  assert.equal(root.querySelectorAll("[data-ti='families']").length, 1);
  click(root, "[data-ti='families']");
  await new Promise((r) => setTimeout(r, 120));
  assert.ok(root.querySelector("#fshTitle"), "the share view replaced the panel");
  click(root, "[data-fsh='back']");
  await new Promise((r) => setTimeout(r, 120));
  assert.ok(root.querySelector("#tiTitle"), "back returns to class intelligence");
});

test("privacy: nothing in this feature calls the network", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const dirs = ["../access-practice-lab/src/family/story/", "../access-teacher/family-share/"];
  let files = 0;
  for (const d of dirs)
    for (const f of readdirSync(new URL(d, import.meta.url)).filter((x) => x.endsWith(".js"))) {
      const src = readFileSync(new URL(d + f, import.meta.url), "utf8");
      files++;
      assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/, f);
      assert.ok(src.split("\n").length <= 500, `${f} is over 500 lines`);
    }
  assert.ok(files >= 14);
});
