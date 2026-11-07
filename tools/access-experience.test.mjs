// The connective experience layer: Daily Warm-Up (content, dates, state, weekly rhythm, view), site search and the
// palette's ranking, portfolio and family-share view, collection book badges, and the shared page states.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const LAB = "access-practice-lab/";
const json = (p) => JSON.parse(readFileSync(new URL(`${LAB}${p}`, ROOT), "utf8"));
const win = new JSDOM(
  "<main id='app'></main><div id='labLive'></div><div id='labToast' hidden></div>",
  { url: "https://lab.test/access-practice-lab/" },
).window;
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = win[key];
globalThis.CSS = { escape: (s) => String(s) };
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});

const W = await import(`../${LAB}src/lang/warmup.js`);
const S = await import(`../${LAB}src/lang/site-search.js`);
const P = await import(`../${LAB}src/lang/portfolio.js`);
const C = await import(`../${LAB}src/lang/collection.js`);
const { makeI18n } = await import(`../${LAB}src/i18n.js`);
const { toHtml, announce } = await import(`../${LAB}src/util.js`);
const { THEMES, themeSVG } = await import(`../${LAB}src/warmup-art.js`);

const early = json("content/warmup-early.json");
const upper = json("content/warmup-upper.json");
const DATA = { tiers: { ...early.tiers, ...upper.tiers } };

// ── warm-up content ──────────────────────────────────────────────────────────────────────
test("every tier has 60 distinct, complete, original days", () => {
  assert.deepEqual(Object.keys(DATA.tiers).sort(), ["2-3", "3-5", "6-8", "K-1"]);
  for (const [tier, list] of Object.entries(DATA.tiers)) {
    assert.ok(list.length >= 60, `${tier} has ${list.length} days`);
    assert.equal(new Set(list.map((e) => e.w)).size, list.length, `${tier}: duplicate word`);
    for (const e of list) {
      for (const k of ["w", "es", "th", "pos", "def", "ex", "clip", "clipEs", "q", "a"])
        assert.ok(String(e[k] || "").trim(), `${tier}/${e.w}: missing ${k}`);
      assert.ok(THEMES.includes(e.th), `${tier}/${e.w}: unknown theme ${e.th}`);
      assert.ok(
        ["n", "v", "adj", "adv", "prep", "conn", "x"].includes(e.pos),
        `${tier}/${e.w}: pos ${e.pos}`,
      );
      assert.equal(e.x.length, 2, `${tier}/${e.w}: needs two wrong choices`);
      assert.equal(
        new Set([e.a, ...e.x].map((s) => s.toLowerCase())).size,
        3,
        `${tier}/${e.w}: choices must differ`,
      );
      assert.ok(W.usesWord(e.clip, e.w), `${tier}/${e.w}: the clip must use the word`);
      assert.ok(W.usesWord(e.ex, e.w), `${tier}/${e.w}: the example must use the word`);
      assert.ok(
        e.clipEs !== e.clip && /[a-záéíóúñ]/i.test(e.clipEs),
        `${tier}/${e.w}: Spanish gist`,
      );
      assert.ok(
        !/\b(timer|countdown|hurry|seconds left|speed|fastest)\b/i.test(JSON.stringify(e)),
        `${tier}/${e.w}: no pressure language`,
      );
      assert.ok(
        !/\b(WIDA level|scale score|Lexile)\b/i.test(JSON.stringify(e)),
        `${tier}/${e.w}: no invented levels`,
      );
    }
  }
});

test("the answer to the question is not stated by the word card or the question itself", () => {
  for (const list of Object.values(DATA.tiers))
    for (const e of list)
      assert.ok(
        !e.q.toLowerCase().includes(e.a.toLowerCase()),
        `${e.w}: the question gives the answer away`,
      );
});

test("a date picks one set for everyone, the cycle covers all 60 days, the right answer moves around", () => {
  for (const [band, tier] of [
    ["K", "K-1"],
    ["1", "K-1"],
    ["2-3", "2-3"],
    ["3-5", "3-5"],
    ["4-5", "3-5"],
    ["6-8", "6-8"],
  ]) {
    const a = W.warmupFor(DATA, band, "2026-11-06");
    assert.equal(a.tier, tier);
    assert.deepEqual(a, W.warmupFor(DATA, band, "2026-11-06"));
    assert.notEqual(a.entry.w, W.warmupFor(DATA, band, "2026-11-07").entry.w);
    const seen = new Set();
    const slots = new Set();
    let d = "2026-11-06";
    for (let i = 0; i < a.count; i++) {
      const w = W.warmupFor(DATA, band, d);
      seen.add(w.entry.w);
      slots.add(w.correct);
      assert.equal(w.options[w.correct], w.entry.a);
      assert.ok(w.frame.includes("___"), `${w.entry.w}: frame needs a blank`);
      d = W.addDays(d, 1);
    }
    assert.equal(seen.size, a.count, `${band}: 60 consecutive days must be 60 different words`);
    assert.equal(slots.size, 3);
  }
});

test("a word's frame fits its part of speech and a day-specific override wins", () => {
  const e = (w, pos, frame) => ({ w, pos, frame });
  assert.equal(
    W.frameFor("6-8", e("however", "conn", "I like ___. However, I also ___.")),
    "I like ___. However, I also ___.",
  );
  assert.match(W.frameFor("K-1", e("cat", "n")), /The cat is ___/);
  assert.match(W.frameFor("2-3", e("measure", "v"), 0), /measure/);
  assert.ok(!W.frameFor("3-5", e("evidence", "n"), 1).includes("{W}"));
  assert.equal(W.withArticle("apple"), "an apple");
});

// ── warm-up state and the weekly rhythm ─────────────────────────────────────────────────────
test("steps save separately; a day is complete only with all four; junk is dropped", () => {
  let prefs = {};
  const set = (patch) => (prefs = { warmup: W.updateDay(prefs, "6-8", "2026-11-04", patch) });
  set({ w: 1 });
  assert.equal(W.doneCount(W.getWarmup(prefs).days["6-8|2026-11-04"]), 1);
  set((d) => ({ ...d, l: { ...d.l, ok: 1, tries: 2 } }));
  set((d) => ({ ...d, q: { text: "two words" } }));
  assert.equal(
    W.stepsDone(W.getWarmup(prefs).days["6-8|2026-11-04"]).write,
    false,
    "three words needed",
  );
  set((d) => ({ ...d, q: { text: "The farm saves water." } }));
  set((d) => ({ ...d, s: { checks: [0, 7, 1], done: 1 } }));
  const day = W.getWarmup(prefs).days["6-8|2026-11-04"];
  assert.deepEqual(day.s.checks, [0, 1]);
  assert.equal(W.isComplete(day), true);
  const dirty = W.cleanWarmup({
    days: {
      "nope|2026-01-01": { w: 1 },
      "6-8|bad": { w: 1 },
      "3-5|2026-01-02": { w: 1, q: { text: "x".repeat(900) } },
    },
  });
  assert.deepEqual(Object.keys(dirty.days), ["3-5|2026-01-02"]);
  assert.equal(dirty.days["3-5|2026-01-02"].q.text.length, W.MAX_TEXT);
});

test("the week is seven calm pips: full, some, other practice or none; weeks off never break the story", () => {
  const state = W.cleanWarmup({
    days: {
      "6-8|2026-11-02": {
        w: 1,
        l: { ok: 1 },
        q: { text: "one two three" },
        s: { checks: [0], done: 1 },
      },
      "6-8|2026-11-04": { w: 1 },
    },
  });
  const week = W.weekRhythm(state, ["2026-11-03"], "2026-11-05");
  assert.deepEqual(
    week.days.map((d) => d.status + (d.other ? "+other" : "")),
    ["full", "none+other", "some", "none", "none", "none", "none"],
  );
  assert.equal(week.count, 3);
  assert.equal(week.days[3].today, true);
  assert.equal(week.days[5].future, true);
  assert.equal(W.weeksInARow(state, [], "2026-11-05"), 1);
  assert.equal(W.weeksInARow(state, ["2026-10-27", "2026-10-20"], "2026-11-05"), 3);
  assert.equal(
    W.weeksInARow(state, [], "2026-12-30"),
    0,
    "a long break is a restart, not a penalty message",
  );
  assert.equal(W.warmupTotals(state).full, 1);
});

// ── pictures ──────────────────────────────────────────────────────────────────────────────
test("every word theme has a titled, self-contained picture", () => {
  for (const t of THEMES) {
    const svg = themeSVG(t);
    assert.match(svg, /<title>[^<]{5,}<\/title>/, t);
    assert.ok(!/<script|https?:/.test(svg), `${t}: self-contained`);
  }
});

// ── search ───────────────────────────────────────────────────────────────────────────────
const glossary = json("content/glossary.json");
const index = json("content/index.json");
const { HOME_CARDS } = await import(`../${LAB}src/home-registry.js`);
const { STUDIOS } = await import(`../${LAB}src/studios.js`);
const { UNITS } = await import(`../${LAB}src/journey/curriculum.js`);
const docs = S.buildDocs({
  index,
  glossary,
  cards: HOME_CARDS,
  studios: STUDIOS,
  units: UNITS,
  tests: index.tests,
});
const bridge = S.buildBridge(glossary);

test("the index covers pages, practice, studios, words and actions with real routes", () => {
  const kinds = new Set(docs.map((d) => d.kind));
  for (const k of S.KINDS) assert.ok(kinds.has(k), k);
  assert.ok(docs.length > 1500);
  for (const d of docs) {
    assert.ok(d.title, d.id);
    if (d.kind !== "command" && d.kind !== "word")
      assert.ok(S.hrefFor(d, "6-8"), `${d.id} needs a destination`);
  }
  assert.match(
    S.hrefFor(
      docs.find((d) => d.id === "page:warmup"),
      "3-5",
    ),
    /\/access-practice-lab\/warmup\?grades=3-5/,
  );
});

test("English and Spanish queries find the right thing, ranked", () => {
  const top = (q, opts = {}) =>
    S.search(docs, q, { band: "6-8", bridge, ...opts }).map((r) => r.doc.id);
  assert.equal(top("warm up")[0], "page:warmup");
  assert.equal(top("calentamiento")[0], "page:warmup");
  assert.equal(top("portafolio")[0], "page:portfolio");
  assert.equal(top("collection book")[0], "page:collection");
  assert.ok(
    top("manzana").includes("word:apple"),
    "a Spanish word finds the English word the glossary pairs it with",
  );
  assert.ok(top("apple").includes("word:apple"));
  assert.equal(top("warmp")[0], "page:warmup", "one-letter typo");
  assert.deepEqual(top(""), []);
  assert.deepEqual(top("zzzzqq"), []);
  const listening = S.search(docs, "listening", { band: "6-8" })[0].doc;
  assert.ok(
    listening.title.toLowerCase().includes("listening"),
    "title matches outrank body matches",
  );
});

test("the grade band filters practice, and 'all grades' lifts the filter", () => {
  const q = "sounds";
  const mine = S.search(docs, q, { band: "3-5", bridge });
  assert.ok(mine.every((r) => !r.doc.bands || r.doc.bands.includes("3-5")));
  const all = S.search(docs, q, { band: "3-5", all: true, bridge });
  assert.ok(all.length >= mine.length);
  assert.ok(
    S.search(docs, "weather", { band: "6-8", kind: "word", bridge }).every(
      (r) => r.doc.kind === "word",
    ),
  );
});

test("accents and stop words do not matter; highlights are escaped", () => {
  assert.equal(S.norm("Comprensión Auditiva!"), "comprension auditiva");
  assert.deepEqual(S.queryWords("the warm-up of the day"), ["warm", "up", "day"]);
  const h = S.highlight("<b>x</b> Warm up", ["warm"]);
  assert.ok(h.includes("&lt;b&gt;") && !h.includes("<b>") && h.includes("<mark>Warm</mark>"));
});

// ── portfolio ─────────────────────────────────────────────────────────────────────────────
const DAY3 = W.warmupFor(DATA, "6-8", "2026-11-03").entry.w;
const sample = {
  band: "6-8",
  studio: {
    writing: {
      "wrt-a": {
        versions: [
          { t: "2026-10-20T10:00:00.000Z", text: "Mulch is good." },
          { t: "2026-10-22T10:00:00.000Z", text: "Mulch protects soil because it slows rain." },
        ],
        reflection: "Added because.",
      },
      "wrt-b": { versions: [{ t: "2026-10-25T10:00:00.000Z", text: "One draft only." }] },
    },
    speaking: {
      "spk-a": {
        takes: [{ id: "t1", t: "2026-10-21T10:00:00.000Z", seconds: 41.6, keptAudio: true }],
      },
    },
    missions: { "bike-lane-budget": { started: "2026-10-18T10:00:00.000Z", done: true } },
  },
  exhibition: {
    bands: {
      "6-8": {
        tasks: {
          write: {
            attempts: [
              {
                drafts: [
                  { text: "First", at: "2026-10-26T10:00:00.000Z" },
                  { text: "Better draft", at: "2026-10-27T10:00:00.000Z" },
                ],
              },
            ],
          },
        },
      },
    },
  },
  warmup: W.cleanWarmup({
    days: {
      "6-8|2026-11-03": {
        w: 1,
        l: { ok: 1 },
        q: { text: `I can use ${DAY3} in a sentence.` },
        s: { checks: [0], done: 1 },
      },
    },
  }),
  wordLists: DATA.tiers,
  reading: {
    log: [{ t: "2026-10-25T10:00:00.000Z", title: "Hatchet", minutes: 20, note: "A fire." }],
    words: [{ term: "resilient", es: "resistente" }],
  },
  flashcards: { deck: { apple: { box: 2 }, pear: { box: 0 } } },
  ledger: {
    entries: [
      {
        t: "2026-10-28T10:00:00.000Z",
        band: "6-8",
        src: "writing",
        stage: "independent",
        kind: "first",
      },
      {
        t: "2026-10-29T10:00:00.000Z",
        band: "6-8",
        src: "writing",
        stage: "supported",
        kind: "revision",
      },
    ],
  },
  recordings: [{ id: "t1" }],
  titles: { writing: { "wrt-a": "Mulch and soil" }, speaking: { "spk-a": "Retell" }, missions: {} },
  badges: { "first-warmup": "2026-11-03" },
  prefs: { portfolio: { pins: ["w:wrt-b"] } },
};

test("the portfolio gathers writing, recordings, reflections, words and a dated timeline from what is saved", () => {
  const p = P.collect(sample);
  assert.equal(p.samples.length, 4);
  assert.equal(p.showcase[0].key, "w:wrt-b", "pinned first");
  assert.ok(p.showcase.find((s) => s.key === "w:wrt-a").revised);
  assert.deepEqual(
    p.recordings.map((r) => [r.title, r.seconds, r.kept]),
    [["Retell", 42, true]],
  );
  assert.equal(p.reflections[0].note, "A fire.");
  const sustainable = p.garden.find((g) => g.word === DAY3.toLowerCase());
  assert.ok(
    sustainable && sustainable.stage === 3,
    "met, answered, used in a sentence and said aloud = bloom",
  );
  assert.equal(p.garden.find((g) => g.word === "apple")?.stage, 2);
  assert.equal(
    p.garden.find((g) => g.word === "pear"),
    undefined,
    "a card never rated 'know' adds nothing",
  );
  assert.ok(p.timeline.length >= 3);
  const kinds = new Set(p.timeline.flatMap((w) => w.items.map((i) => i.kind)));
  for (const k of [
    "writing",
    "revision",
    "speaking",
    "reading",
    "mission",
    "warmup",
    "own",
    "badge",
  ])
    assert.ok(kinds.has(k), k);
  assert.ok(
    p.timeline.every((w, i, a) => i === 0 || a[i - 1].week > w.week),
    "newest week first",
  );
});

// ── collection book ───────────────────────────────────────────────────────────────────────
test("badges name effort and range, never rank, and stay once earned", () => {
  assert.equal(new Set(C.BADGE_IDS).size, C.BADGES.length);
  for (const b of C.BADGES) {
    assert.ok(b.name.en && b.name.es && b.how.en && b.how.es, b.id);
    assert.ok(
      !/\b(rank|leader|winner|best|top|beat|fastest|score|points?|level)\b/i.test(
        `${b.name.en} ${b.how.en}`,
      ),
      `${b.id}: no comparison or scoring language`,
    );
  }
  const none = C.gatherEvidence({ warmup: { days: {} } });
  assert.equal(C.evaluate(none).filter((b) => b.earned).length, 0);
  const ev = C.gatherEvidence({
    warmup: sample.warmup,
    studio: sample.studio,
    reading: sample.reading,
    garden: P.collect(sample).garden,
    prefs: sample.prefs,
    ledger: { entries: [] },
  });
  const first = C.syncEarned({}, ev, "2026-11-06");
  assert.ok(
    first.fresh.includes("first-warmup") &&
      first.fresh.includes("brave-voice") &&
      first.fresh.includes("scene-signal-station") &&
      first.fresh.includes("first-pick"),
  );
  assert.deepEqual(C.syncEarned(first.collection, ev, "2026-11-07").fresh, [], "announced once");
  const kept = C.evaluate(none, first.collection)
    .filter((b) => b.earned)
    .map((b) => b.id);
  assert.ok(kept.includes("first-warmup"), "evidence cleared later does not take a badge away");
  assert.equal(first.collection.earned["first-warmup"], "2026-11-06");
});

test("a week away is a 'welcome back' badge, not a loss", () => {
  const w = W.cleanWarmup({ days: { "6-8|2026-10-01": { w: 1 }, "6-8|2026-10-20": { w: 1 } } });
  assert.equal(C.gatherEvidence({ warmup: w }).returned, true);
});

// ── the views, over JSDOM ───────────────────────────────────────────────────────────────────
const ctxFor = (band, lang = "en", prefs = {}, route = {}) => ({
  band,
  bands: ["3-5", "6-8"],
  prefs: { lang, ...prefs },
  route,
  setPrefs(p) {
    Object.assign(this.prefs, p);
    return this.prefs;
  },
  rerender() {},
  navigate() {},
});
const page = (out) => new JSDOM(`<body>${toHtml(out.html)}</body>`).window.document;

test("the warm-up page shows all four steps, the week, no timer, and Spanish in Spanish mode", async () => {
  const warmup = await import(`../${LAB}src/views/warmup.js`);
  for (const band of ["K", "2-3", "3-5", "6-8"]) {
    const doc = page(
      await warmup.render(ctxFor(band, "en", {}, { date: "2026-11-06", view: "warmup" })),
    );
    assert.equal(doc.querySelectorAll("h1").length, 1);
    assert.equal(doc.querySelectorAll(".wu-step").length, 4);
    assert.equal(doc.querySelectorAll(".wu-pip").length, 7);
    assert.ok(
      doc.querySelector("[data-say]") &&
        doc.querySelector("[data-wu=word]") &&
        doc.querySelector("textarea[data-wu-text]"),
    );
    assert.equal(doc.querySelectorAll("input[name=wuListen]").length, 3);
    assert.ok(
      !/countdown|timer running|seconds left/i.test(doc.body.textContent.replace(/no timer/i, "")),
    );
    assert.ok(doc.querySelector("svg.wu-art title"), "picture is titled");
  }
  const es = page(await warmup.render(ctxFor("6-8", "es", {}, { date: "2026-11-06" })));
  assert.match(es.querySelector("h1").textContent, /Calentamiento diario/);
  assert.match(es.body.textContent, /Mi semana/);
  assert.ok(!/Word of the day|Quick-write/.test(es.body.textContent));
  const bi = page(await warmup.render(ctxFor("6-8", "bi", {}, { date: "2026-11-06" })));
  assert.ok(bi.querySelectorAll(".bi-es").length > 10);
});

test("warm-up clicks save a step, check an answer without giving it away, and finish calmly", async () => {
  const warmup = await import(`../${LAB}src/views/warmup.js`);
  const ctx = ctxFor("6-8", "en", {}, { date: "2026-11-06", view: "warmup" });
  document.body.innerHTML = toHtml((await warmup.render(ctx)).html);
  const w = W.warmupFor(DATA, "6-8", "2026-11-06");
  const click = async (sel) => warmup.onClick({ target: document.querySelector(sel) }, ctx);
  await click("[data-wu=word]");
  assert.equal(W.getWarmup(ctx.prefs).days["6-8|2026-11-06"].w, 1);
  const wrong = (w.correct + 1) % 3;
  warmup.onChange({ target: { name: "wuListen", value: String(wrong) } }, ctx);
  document.body.innerHTML = toHtml((await warmup.render(ctx)).html);
  await click("[data-wu=check]");
  let day = W.getWarmup(ctx.prefs).days["6-8|2026-11-06"];
  assert.equal(day.l.ok, 0);
  assert.equal(day.l.tries, 1);
  const text = toHtml((await warmup.render(ctx)).html);
  assert.ok(!text.includes("aria-checked") && text.includes("Not yet"), "specific, calm feedback");
  warmup.onChange({ target: { name: "wuListen", value: String(w.correct) } }, ctx);
  document.body.innerHTML = toHtml((await warmup.render(ctx)).html);
  await click("[data-wu=check]");
  assert.equal(W.getWarmup(ctx.prefs).days["6-8|2026-11-06"].l.ok, 1);
  document.body.innerHTML = toHtml((await warmup.render(ctx)).html);
  document.getElementById("wuText").value = "Sustainable farms keep soil healthy.";
  warmup.onInput({ target: document.getElementById("wuText") }, ctx);
  await click("[data-wu=save]");
  assert.equal(W.stepsDone(W.getWarmup(ctx.prefs).days["6-8|2026-11-06"]).write, true);
  warmup.onChange(
    {
      target: { matches: (s) => s === "[data-wu-check]", dataset: { wuCheck: "0" }, checked: true },
    },
    ctx,
  );
  document.body.innerHTML = toHtml((await warmup.render(ctx)).html);
  await click("[data-wu=speak]");
  assert.equal(W.isComplete(W.getWarmup(ctx.prefs).days["6-8|2026-11-06"]), true);
  const done = page(await warmup.render(ctx));
  assert.ok(done.querySelector(".wu-finish"));
  assert.match(done.querySelector(".wu-finish").textContent, /never count against you/);
  assert.ok(
    ctx.prefs.engagement.events.some((e) => e.key === "warmup:6-8:2026-11-06"),
    "idempotent practice credit",
  );
});

test("the family-share portfolio shows the learner's own words and no scores, levels, shields or badges", async () => {
  const store = win.localStorage;
  const P1 = "accessPracticeLab:v1";
  store.setItem(
    `${P1}:studio`,
    JSON.stringify({ v: 1, ...sample.studio, detective: {}, portfolio: { picks: [] } }),
  );
  store.setItem(
    `${P1}:readingRoom`,
    JSON.stringify({ schema: 1, log: sample.reading.log, words: sample.reading.words }),
  );
  const prefs = { warmup: sample.warmup, band: "6-8" };
  const portfolio = await import(`../${LAB}src/views/portfolio.js`);
  const fam = page(
    await portfolio.render(
      ctxFor("6-8", "en", { ...prefs }, { mode: "family", view: "portfolio" }),
    ),
  );
  const t = fam.body.textContent;
  assert.match(t, /Hello, family/);
  assert.match(t, /Mulch protects soil|can use/);
  assert.ok(
    !/shield|badge|level|score:|points|supported|independent|XP/i.test(
      t
        .replace(/does not show test scores or levels/i, "")
        .replace(/not an official WIDA or ACCESS test/i, ""),
    ),
    `family view leaked: ${t.slice(0, 120)}`,
  );
  assert.equal(
    fam.querySelectorAll("input[data-pf-pin]").length,
    0,
    "no editing controls in the family view",
  );
  const mine = page(
    await portfolio.render(ctxFor("6-8", "en", { ...prefs }, { view: "portfolio" })),
  );
  for (const id of ["pfShow", "pfGarden", "pfSay", "pfRead", "pfGrow", "pfBadges", "pfPaper"])
    assert.ok(mine.getElementById(id), id);
  assert.ok(
    mine.querySelector("a[href*='/passport']") && mine.querySelector(".paper-pass"),
    "Passport and the paper passport are reused",
  );
  assert.ok(
    mine.querySelector(".growth-shields"),
    "the Passport shield board is reused, not copied",
  );
  const es = page(await portfolio.render(ctxFor("6-8", "es", { ...prefs }, { view: "portfolio" })));
  assert.match(es.querySelector("h1").textContent, /portafolio/);
  assert.equal(
    win.localStorage.getItem(`${P1}:prefs`),
    null,
    "rendering a view never writes the prefs key by itself here",
  );
});

test("the collection book lists every badge with a text state, never a number to beat", async () => {
  const collection = await import(`../${LAB}src/views/collection.js`);
  const doc = page(
    await collection.render(ctxFor("6-8", "en", { warmup: sample.warmup }, { view: "collection" })),
  );
  assert.equal(
    doc.querySelectorAll(
      ".cb-badge.g-habit, .cb-badge.g-range, .cb-badge.g-growth, .cb-badge.g-world, .cb-badge.g-share",
    ).length,
    C.BADGES.length,
  );
  for (const li of doc.querySelectorAll(".cb-badge"))
    assert.match(
      li.querySelector(".cb-state").textContent,
      /In my book|Waiting for me|Start this mission/,
    );
  assert.ok(
    !/leaderboard|rank|compare you|top \d/i.test(
      doc.body.textContent.replace(/nobody is compared/i, "").replace(/Only mine · /, ""),
    ),
  );
  assert.ok(doc.querySelector(".wu-pips"), "the calm week is reused");
});

// ── shared states ─────────────────────────────────────────────────────────────────────────
test("announce is one pattern: live region, toast, tone, a labelled close button, no timer pressure", () => {
  document.body.innerHTML = "<div id='labLive'></div><div id='labToast' hidden></div>";
  document.getElementById("labToast").dataset.closeLabel = "Cerrar mensaje";
  announce("Saved.", { tone: "success" });
  const toast = document.getElementById("labToast");
  assert.equal(toast.hidden, false);
  assert.equal(toast.dataset.tone, "success");
  assert.equal(toast.querySelector(".toast-msg").textContent, "Saved.");
  assert.equal(toast.querySelector(".toast-close").getAttribute("aria-label"), "Cerrar mensaje");
  toast.querySelector(".toast-close").click();
  assert.equal(toast.hidden, true);
  announce("Again");
  assert.equal(toast.dataset.tone, "info");
});

test("the stylesheet, routes and shell are wired and every new string has Spanish", () => {
  const main = readFileSync(new URL(`${LAB}src/main.js`, ROOT), "utf8");
  for (const v of ["warmup", "search", "portfolio", "collection"]) {
    assert.match(main, new RegExp(`if \\(a === "${v}"\\) return`));
    assert.match(main, new RegExp(`${v}: \\(\\) => import\\("./views/${v}.js"\\)`));
  }
  assert.match(
    readFileSync(new URL(`${LAB}index.html`, ROOT), "utf8"),
    /experience\.css\?v=[0-9a-f]{12}/,
  );
  const gate = readFileSync(new URL(`${LAB}src/early/gate.js`, ROOT), "utf8");
  for (const v of ["warmup", "search", "portfolio", "collection"])
    assert.match(gate, new RegExp(`"${v}"`));
  const shell = readFileSync(new URL(`${LAB}src/shell.js`, ROOT), "utf8");
  assert.match(shell, /installSearch\(ctx\)/);
  const I = makeI18n("es");
  assert.equal(I.S("Search", "Buscar"), "Buscar");
});
