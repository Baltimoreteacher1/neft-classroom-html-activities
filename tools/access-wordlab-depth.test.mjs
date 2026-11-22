// Word Lab quality gate. Validates the 755-word bank and its depth data (definitions, examples, non-examples, collocations,
// relationships, Spanish-twin keys), then the four-step path (recognize, understand, apply, transfer), the sentence check, the
// optional mixed review and the "Go deeper" card in jsdom. New words and new fields inherit these rules.
import assert from "node:assert/strict";
import test from "node:test";
import { click, makeCtx, mount, resetStorage, win } from "./lib/access-studios-dom.mjs";

const { WORDS } = await import("../access-practice-lab/src/content/wordlab-words.js");
const { FALSE_FRIENDS } = await import("../access-practice-lab/src/content/wordlab-lab.js");
const logic = await import("../access-practice-lab/src/lang/wordlab.js");
const depth = await import("../access-practice-lab/src/lang/wordlab-depth.js");
const wl = await import("../access-practice-lab/src/views/wordlab.js");
const { WL_KEY } = await import("../access-practice-lab/src/views/wordlab-common.js");

const { DEPTH } = depth;
const DAY = 86400000;
const ctxFor = (mode = "", id = "", lang = "en", band = "6-8") =>
  makeCtx("wordlab", { lang, band, id: mode, sub: id });
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const bigrams = (s) => {
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
};
const similarity = (a, b) => {
  const x = bigrams(norm(a));
  const y = bigrams(norm(b));
  let n = 0;
  for (const g of x) if (y.has(g)) n++;
  return (2 * n) / (x.size + y.size);
};
const wordCount = (s) => s.trim().split(/\s+/).length;

// Spanish twins that are real cognates even though the spelling differs a lot. Reviewed by hand; a new `cog` word that looks
// unlike its Spanish word must be added here on purpose, which is the point of the check.
const REVIEWED_TWINS = new Set(
  "chapter chemical chlorophyll citizen citizenship custom degree emphasize empire equator humidity length machine market myth opposite percent physical reasoning rhyme rhythm sound sphere survive synonym theme thermal".split(
    " ",
  ),
);
// Definitions that name a related word on purpose (the equal sign, rows arranged in an array).
const DEFINITION_MAY_ECHO = new Set(["array", "equation"]);
// English words whose obvious Spanish look-alike means something else. If one is in the bank, it must be keyed false or part.
const KNOWN_FALSE_FRIENDS =
  "actually advertisement argument assist attend audience conductor demand idiom introduce mayor realize record subject suburb support sympathetic eventually".split(
    " ",
  );

test("every word has a clean definition, a real example and consistent Spanish keys", () => {
  assert.equal(WORDS.length, 755);
  const seenWord = new Set();
  const seenExample = new Set();
  for (const w of WORDS) {
    assert.ok(!seenWord.has(w.w.toLowerCase()), `duplicate word ${w.w}`);
    seenWord.add(w.w.toLowerCase());
    assert.ok(!seenExample.has(w.x), `${w.w}: example repeats another word's`);
    seenExample.add(w.x);
    assert.ok(wordCount(w.x) >= 6, `${w.w}: example is too short to teach anything ("${w.x}")`);
    assert.match(w.x, new RegExp(`\\b${w.w}`, "i"), `${w.w}: example lacks the word`);
    assert.notEqual(w.x.toLowerCase(), w.d.toLowerCase(), `${w.w}: example repeats the definition`);
    const stem = w.w.length > 6 ? w.w.slice(0, -2) : w.w.length > 4 ? w.w.slice(0, -1) : w.w;
    if (!DEFINITION_MAY_ECHO.has(w.w))
      assert.doesNotMatch(
        w.d,
        new RegExp(`\\b${stem}`, "i"),
        `${w.w}: definition is circular ("${w.d}")`,
      );
    assert.ok(wordCount(w.d) >= 3 && wordCount(w.d) <= 24, `${w.w}: definition length`);
    assert.notEqual(w.xe, w.x, `${w.w}: Spanish example copied`);
    if (w.c === "cog" && !REVIEWED_TWINS.has(w.w))
      assert.ok(
        similarity(w.w, w.e) >= 0.35,
        `${w.w}/${w.e}: keyed as a Spanish twin but does not look like one`,
      );
    if (w.c === "none")
      assert.ok(
        similarity(w.w, w.e) < 0.6,
        `${w.w}/${w.e}: keyed "none" but the Spanish word looks like a twin`,
      );
    if (w.c === "cog" || w.c === "none")
      assert.ok(!w.n, `${w.w}: a warning belongs on a false friend or partial twin`);
    if (w.c === "false" || w.c === "part")
      assert.ok(w.n.length > 30 && w.ne.length > 30, `${w.w}: write the warning out`);
  }
});

test("known false friends are never keyed as plain twins, and the false-friend list agrees with the bank", () => {
  for (const en of KNOWN_FALSE_FRIENDS) {
    const w = WORDS.find((x) => x.w === en);
    if (w)
      assert.ok(
        w.c === "false" || w.c === "part",
        `${en} is a known false friend but is keyed "${w.c}"`,
      );
  }
  for (const f of FALSE_FRIENDS) {
    const w = WORDS.find((x) => x.w === f.en);
    if (w) assert.ok(w.c === "false" || w.c === "part", `${f.en} is on the false-friend list`);
  }
});

test("every word has a non-example, collocations and sound relationships", () => {
  for (const w of WORDS) {
    const d = DEPTH[w.w];
    assert.ok(d, `${w.w}: no depth entry`);
    assert.ok(
      wordCount(d.no) >= 3 && wordCount(d.noe) >= 3,
      `${w.w}: needs a non-example in English and Spanish`,
    );
    assert.notEqual(norm(d.no), norm(d.noe), `${w.w}: Spanish non-example copied`);
    assert.ok(
      d.col?.length >= 2 && d.col.every((c) => c.trim().length > 3),
      `${w.w}: needs two or more collocations`,
    );
    for (const k of ["syn", "ant"]) {
      for (const x of d[k] || []) assert.notEqual(x, w.w, `${w.w}: ${k} lists the word itself`);
    }
    assert.ok(
      !(d.syn || []).some((s) => (d.ant || []).includes(s)),
      `${w.w}: a word is both synonym and antonym`,
    );
    if (d.mm)
      assert.ok(
        d.mm.length === 2 && wordCount(d.mm[1]) >= 3,
        `${w.w}: another meaning needs a sentence`,
      );
    // A non-example must not simply be the definition or the example.
    assert.notEqual(norm(d.no), norm(w.x));
  }
  assert.deepEqual(
    Object.keys(DEPTH).filter((k) => !WORDS.some((w) => w.w === k)),
    [],
    "depth entries for unknown words",
  );
});

test("the path is worked out from saved results, and optional practice never moves the spaced schedule", () => {
  const t0 = Date.parse("2026-11-02T10:00:00Z");
  const st = {};
  const w = WORDS.find((x) => x.w === "persuade") || WORDS.find((x) => x.pos === "verb");
  logic.collectWord(st, w.id, t0);
  assert.equal(depth.wordStage(st.garden[w.id]).stage, "recognize");
  logic.reviewWord(st, w.id, { ok: true, independent: false, kind: "meaning" }, t0);
  assert.equal(
    depth.wordStage(st.garden[w.id]).stage,
    "recognize",
    "help does not move a word forward",
  );
  logic.reviewWord(st, w.id, { ok: true, independent: true, kind: "meaning" }, t0 + DAY);
  assert.equal(depth.wordStage(st.garden[w.id]).stage, "understand");
  const before = JSON.stringify(logic.gardenInfo(st.garden[w.id], t0 + 2 * DAY));
  depth.practiceWord(st, w.id, { ok: true, independent: true, kind: "collocation" }, t0 + 2 * DAY);
  assert.equal(depth.wordStage(st.garden[w.id]).stage, "apply");
  assert.equal(
    JSON.stringify(logic.gardenInfo(st.garden[w.id], t0 + 2 * DAY)),
    before,
    "practice must not change the 1, 3, 7, 14 day schedule",
  );
  depth.practiceWord(st, w.id, { ok: true, independent: true, kind: "use" }, t0 + 2 * DAY);
  assert.equal(depth.wordStage(st.garden[w.id]).stage, "transfer");
  depth.practiceWord(st, w.id, { ok: true, independent: true, kind: "transfer" }, t0 + 2 * DAY);
  assert.deepEqual(depth.wordStage(st.garden[w.id]), { stage: "transfer", index: 3, done: true });
  // Old Word Garden results had no kind: they count as recognize.
  assert.equal(
    depth.wordStage({ ev: [{ ok: true, independent: true, t: "2026-01-01T00:00:00Z" }] }).stage,
    "understand",
  );
});

test("understand tasks have exactly one right answer and no accidental second one", () => {
  const now = Date.parse("2026-11-09T09:00:00Z");
  const rec = { ev: [{ ok: true, independent: true, kind: "meaning", t: "2026-11-02T00:00:00Z" }] };
  const kinds = {};
  for (const w of WORDS) {
    const q = depth.depthTask(w, WORDS, rec, now);
    assert.equal(q.stage, "understand");
    kinds[q.kind] = (kinds[q.kind] || 0) + 1;
    assert.equal(q.opts.filter((o) => o.ok).length, 1, `${w.w}: ${q.kind} needs one right option`);
    assert.equal(
      new Set(q.opts.map((o) => o.text)).size,
      q.opts.length,
      `${w.w}: duplicate options`,
    );
    assert.deepEqual(
      q,
      depth.depthTask(w, WORDS, rec, now),
      `${w.w}: same word, same day, same task`,
    );
    const pool = depth.poolFor(w, WORDS);
    for (const o of q.opts) {
      if (q.kind === "collocation" || q.kind === "relation") {
        const used = o.ok ? null : WORDS.find((x) => x.w === o.text);
        if (used) assert.ok(pool.includes(used), `${w.w}: a ${w.b} task used a ${used.b} word`);
      }
      if (q.kind === "collocation" && !o.ok)
        assert.ok(
          !Object.values(DEPTH).some((d) =>
            d.col.some((c) => c.toLowerCase() === q.blank.replace("_____", o.text).toLowerCase()),
          ),
          `${w.w}: ${o.text} also completes "${q.blank}"`,
        );
      if (q.kind === "relation" && !o.ok) {
        const d = DEPTH[w.w];
        assert.ok(
          ![...(d.syn || []), ...(d.ant || [])].includes(o.text),
          `${w.w}: ${o.text} is also related`,
        );
      }
    }
  }
  assert.ok(
    kinds.collocation > 400 && kinds.relation > 100 && kinds.sense > 80,
    JSON.stringify(kinds),
  );
});

test("a grade 3-5 word never gets a grade 6-8 word as a distractor", () => {
  const rec = { ev: [] };
  for (const w of WORDS.filter((x) => x.b === "3-5")) {
    const q = depth.depthTask(w, WORDS, rec, Date.parse("2026-11-09T09:00:00Z"));
    for (const o of q.opts) {
      const hit = WORDS.find((x) => x.w === o.text || x.e === o.text || x.d === o.text);
      if (hit && !o.ok) assert.notEqual(hit.b, "6-8", `${w.w}: used ${hit.w}`);
    }
  }
});

test("the sentence check only tests what a program can test", () => {
  const w = WORDS.find((x) => x.w === "conserve");
  assert.equal(depth.checkUse(w, "").ok, false);
  assert.equal(depth.checkUse(w, "We conserve water").punct, false);
  assert.equal(depth.checkUse(w, "We need to save it.").has, false);
  assert.equal(depth.checkUse(w, "We conserve it.").long, false);
  assert.equal(depth.checkUse(w, w.x).copied, true);
  assert.equal(depth.checkUse(w, w.x).ok, false, "copying the model does not count");
  assert.equal(
    depth.checkUse(w, "Our class will conserve paper by printing on both sides.").ok,
    true,
  );
  assert.equal(
    depth.checkUse(w, "Our class conserved paper by printing on both sides.").has,
    true,
    "word forms count",
  );
  for (const word of WORDS) {
    const frames = depth.starters(word);
    assert.equal(frames.length, 2);
    assert.ok(frames.every((f) => f.en.includes("___") && f.es.includes("___")));
  }
});

// Drives the real Word Garden through all four steps in jsdom, ageing the saved dates so each review is due.
const ageGarden = (days) => {
  const s = JSON.parse(localStorage.getItem(WL_KEY));
  for (const rec of Object.values(s.garden))
    for (const e of rec.ev) e.t = new Date(Date.parse(e.t) - days * DAY).toISOString();
  localStorage.setItem(WL_KEY, JSON.stringify(s));
};

test("garden review walks recognize, understand, apply and transfer with teaching feedback", async () => {
  resetStorage();
  const w = WORDS.find((x) => x.w === "conserve");
  const ectx = ctxFor("explore");
  let m = await mount(wl, ectx);
  click(wl, ectx, m.root, `[data-wl-collect="${w.id}"], [data-wl-collect]`);
  const planted = Object.keys(JSON.parse(localStorage.getItem(WL_KEY)).garden)[0];
  const word = WORDS.find((x) => x.id === planted);
  const gctx = ctxFor("garden");
  const step = async (expectStage) => {
    m = await mount(wl, gctx);
    assert.ok(m.root.querySelector("[data-wl-rstart]"), `a word is due before ${expectStage}`);
    click(wl, gctx, m.root, "[data-wl-rstart]");
    m = await mount(wl, gctx);
    assert.match(m.root.querySelector(".wl-stage-chip").textContent, new RegExp(expectStage, "i"));
    return m;
  };
  // 1 recognize
  await step("Recognize");
  const q1 = depth.depthTask(word, WORDS, JSON.parse(localStorage.getItem(WL_KEY)).garden[planted]);
  click(wl, gctx, m.root, `[data-wl-ranswer="${q1.opts.findIndex((o) => o.ok)}"]`);
  m = await mount(wl, gctx);
  assert.match(m.root.querySelector(".wl-feedback").textContent, /on your own/);
  assert.match(m.root.textContent, /Step 1 of 4/);
  click(wl, gctx, m.root, "[data-wl-rnext]");
  ageGarden(20);
  // 2 understand: a wrong answer teaches, then the right answer moves on
  await step("Understand");
  const rec2 = JSON.parse(localStorage.getItem(WL_KEY)).garden[planted];
  const q2 = depth.depthTask(word, WORDS, rec2);
  assert.ok(["collocation", "relation", "sense"].includes(q2.kind), q2.kind);
  click(wl, gctx, m.root, `[data-wl-ranswer="${q2.opts.findIndex((o) => !o.ok)}"]`);
  m = await mount(wl, gctx);
  assert.match(
    m.root.querySelector(".wl-feedback").textContent,
    new RegExp(word.d.slice(0, 20).replace(/[()]/g, ".")),
  );
  assert.equal(
    depth.wordStage(JSON.parse(localStorage.getItem(WL_KEY)).garden[planted]).stage,
    "understand",
    "a miss does not move the word",
  );
  click(wl, gctx, m.root, "[data-wl-rnext]");
  ageGarden(20);
  // after a miss the word comes back (tomorrow in real life); answer it right
  await step("Understand");
  const q2b = depth.depthTask(
    word,
    WORDS,
    JSON.parse(localStorage.getItem(WL_KEY)).garden[planted],
  );
  click(wl, gctx, m.root, `[data-wl-ranswer="${q2b.opts.findIndex((o) => o.ok)}"]`);
  m = await mount(wl, gctx);
  click(wl, gctx, m.root, "[data-wl-rnext]");
  assert.equal(
    depth.wordStage(JSON.parse(localStorage.getItem(WL_KEY)).garden[planted]).stage,
    "apply",
  );
  ageGarden(20);
  // 3 apply: a sentence that does not use the word is not accepted; the model is never required to be copied
  await step("Apply");
  assert.ok(m.root.querySelector("[data-wl-use]"));
  const ta = m.root.querySelector("[data-wl-use]");
  ta.value = "I like it.";
  wl.onInput({ target: ta }, gctx);
  click(wl, gctx, m.root, "[data-wl-ucheck]");
  m = await mount(wl, gctx);
  assert.match(m.root.querySelector(".wl-crit").textContent, new RegExp(`Uses “${word.w}”`));
  assert.ok(m.root.querySelector(".wl-crit .is-no"), "unmet criteria are shown");
  assert.equal(m.root.querySelector("[data-wl-udone]"), null);
  const ta2 = m.root.querySelector("[data-wl-use]");
  const sentence = `Our class talked about ${word.w} during the lesson today.`;
  ta2.value = sentence;
  wl.onInput({ target: ta2 }, gctx);
  click(wl, gctx, m.root, "[data-wl-ucheck]");
  m = await mount(wl, gctx);
  assert.match(m.root.textContent, /Compare with the model/);
  assert.ok(
    m.root.querySelector("[data-wl-udone]").disabled,
    "finishing waits for the learner's own meaning check",
  );
  const box = m.root.querySelector("[data-wl-selfcheck]");
  box.checked = true;
  wl.onChange({ target: box }, gctx);
  m = await mount(wl, gctx);
  click(wl, gctx, m.root, "[data-wl-udone]");
  const saved = JSON.parse(localStorage.getItem(WL_KEY)).garden[planted];
  assert.equal(saved.my.use, sentence);
  assert.equal(depth.wordStage(saved).stage, "transfer");
  m = await mount(wl, gctx);
  click(wl, gctx, m.root, "[data-wl-rnext]");
  ageGarden(20);
  // 4 transfer: a context from another subject, and speaking is allowed
  await step("Transfer");
  assert.match(m.root.textContent, /Think about/);
  assert.match(m.root.textContent, /cannot hear you/, "the page is honest that it does not listen");
  click(wl, gctx, m.root, "[data-wl-usaid]");
  assert.deepEqual(depth.wordStage(JSON.parse(localStorage.getItem(WL_KEY)).garden[planted]), {
    stage: "transfer",
    index: 3,
    done: true,
  });
});

test("mixed review is optional, untimed, and leaves the spaced schedule alone", async () => {
  resetStorage();
  const ids = WORDS.slice(40, 43).map((w) => w.id);
  localStorage.setItem(
    WL_KEY,
    JSON.stringify({
      level: "B",
      garden: Object.fromEntries(
        ids.map((id) => [
          id,
          {
            t: new Date().toISOString(),
            ev: [{ t: new Date().toISOString(), ok: true, independent: true, kind: "meaning" }],
          },
        ]),
      ),
      frayer: {},
      build: { done: [], helped: [] },
      cog: { done: {} },
      fam: { done: {} },
      det: { done: {} },
      network: {},
      ev: {},
    }),
  );
  await mount(wl, ctxFor("explore")); // a new visit starts with no review open
  const gctx = ctxFor("garden");
  let m = await mount(wl, gctx);
  assert.equal(m.root.querySelector("[data-wl-rstart]"), null, "nothing is due today");
  assert.ok(m.root.querySelector("[data-wl-mixstart]"), "mixed review is still offered");
  const evBefore = JSON.stringify(
    ids.map((id) => JSON.parse(localStorage.getItem(WL_KEY)).garden[id].ev),
  );
  click(wl, gctx, m.root, "[data-wl-mixstart]");
  for (let i = 0; i < ids.length; i++) {
    m = await mount(wl, gctx);
    assert.match(m.root.textContent, new RegExp(`word ${i + 1} of 3`));
    const rev = m.root.querySelector("[data-wl-ranswer]");
    click(wl, gctx, m.root, rev);
    m = await mount(wl, gctx);
    click(wl, gctx, m.root, "[data-wl-rnext]");
  }
  m = await mount(wl, gctx);
  assert.match(m.root.textContent, /Mixed review finished/);
  assert.match(m.root.textContent, /only for practice/);
  const after = JSON.parse(localStorage.getItem(WL_KEY));
  assert.equal(
    JSON.stringify(ids.map((id) => after.garden[id].ev)),
    evBefore,
    "schedule events are untouched",
  );
  assert.ok(
    ids.every((id) => after.garden[id].pr?.length === 1),
    "practice is recorded apart",
  );
  click(wl, gctx, m.root, "[data-wl-mixend]");
  m = await mount(wl, gctx);
  assert.match(m.root.textContent, /Next step/);
});

test("the word card offers Go deeper in English and Spanish, and Spanish shows the Spanish non-example", async () => {
  resetStorage();
  let m = await mount(wl, ctxFor("explore"));
  const first = m.root.querySelector(".wl-card .wl-deep");
  assert.ok(first, "cards carry a Go deeper panel");
  assert.match(first.textContent, /Not this:/);
  assert.match(first.textContent, /Goes with:/);
  assert.equal(first.tagName, "DETAILS", "native disclosure works from the keyboard");
  m = await mount(wl, ctxFor("explore", "", "es"));
  assert.match(m.root.querySelector(".wl-deep").textContent, /No es esto:/);
});

test("nothing in the new Word Lab code is timed or random", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["lang/wordlab-depth.js", "views/wordlab-depth.js", "content/wordlab-depth.js"]) {
    const src = readFileSync(new URL(`../access-practice-lab/src/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(
      src,
      /setInterval|setTimeout|Math\.random|requestAnimationFrame|streak|leaderboard/i,
      f,
    );
  }
  void win;
});
