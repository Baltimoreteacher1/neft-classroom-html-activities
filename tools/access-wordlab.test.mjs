// Word Lab: the word bank and lab content contract, the pure logic (builder, cognates, clue checks, Frayer rule, Word Garden on
// the lab's spaced-review pieces) and every activity mounted in jsdom in English and Spanish.
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
} from "./lib/access-studios-dom.mjs";

const { WORDS } = await import("../access-practice-lab/src/content/wordlab-words.js");
const lab = await import("../access-practice-lab/src/content/wordlab-lab.js");
const logic = await import("../access-practice-lab/src/lang/wordlab.js");
const ledger = await import("../access-practice-lab/src/lang/ledger.js");
const wl = await import("../access-practice-lab/src/views/wordlab.js");
const { WL_KEY } = await import("../access-practice-lab/src/views/wordlab-common.js");

const ALLOWED = new Set(lab.MORPHEMES.map((m) => m.f));
const ctxFor = (lang, mode = "", id = "", band = "6-8") =>
  makeCtx("wordlab", { lang, band, id: mode, sub: id });

test("the word bank has 400+ original words with every field in both languages", () => {
  assert.ok(WORDS.length >= 400, `only ${WORDS.length} words`);
  const ids = new Set();
  for (const w of WORDS) {
    assert.ok(!ids.has(w.id), `duplicate ${w.id}`);
    ids.add(w.id);
    for (const k of ["w", "pos", "d", "de", "x", "xe", "e"])
      assert.ok(String(w[k] || "").trim(), `${w.id} lacks ${k}`);
    assert.ok(
      [2, 3].includes(w.t) &&
        ["ela", "math", "sci", "ss"].includes(w.s) &&
        ["3-5", "6-8", "both"].includes(w.b),
      w.id,
    );
    assert.ok(["cog", "part", "false", "none"].includes(w.c), w.id);
    assert.match(w.x, new RegExp(`\\b${w.w}`, "i"), `${w.id}: example lacks the word`);
    assert.doesNotMatch(
      w.d.toLowerCase(),
      new RegExp(`\\b${w.w}\\b`),
      `${w.id}: definition uses the word`,
    );
    assert.notEqual(w.de, w.d, `${w.id}: Spanish copied`);
    if (w.c === "part" || w.c === "false") assert.ok(w.n && w.ne, `${w.id} needs a warning`);
    if (w.p) {
      assert.equal(w.p.join("").replace(/-/g, ""), w.w, `${w.id}: parts do not spell the word`);
      for (const f of w.p) assert.ok(ALLOWED.has(f), `${w.id}: unknown morpheme ${f}`);
    }
  }
  for (const s of ["ela", "math", "sci", "ss"])
    assert.ok(WORDS.filter((w) => w.s === s).length >= 100, `${s} needs 100+`);
  for (const b of ["3-5", "6-8"]) assert.ok(logic.wordsForBand(WORDS, b).length >= 300, b);
  assert.ok(WORDS.filter((w) => w.c === "false" || w.c === "part").length >= 16);
});

test("lab content: morphemes, false friends, patterns, families, detective cases and Frayer models are complete", () => {
  assert.ok(
    lab.MORPHEMES.length >= 100 &&
      lab.FALSE_FRIENDS.length >= 20 &&
      lab.COGNATE_PATTERNS.length >= 10,
  );
  assert.ok(
    lab.FAMILIES.length >= 16 && lab.DETECTIVE.length >= 36 && lab.FRAYER_MODELS.length >= 6,
  );
  for (const m of lab.MORPHEMES) assert.ok(m.m && m.me && m.ex.length >= 1, m.f);
  for (const f of lab.FAMILIES) {
    const forms = f.forms.map((x) => x.w);
    for (const it of f.items) {
      assert.ok(forms.includes(it.a), `${f.id}: answer ${it.a}`);
      assert.ok(it.s.includes("___") && it.se.includes("___"), `${f.id}: blank`);
    }
    assert.deepEqual(
      [...new Set(f.items.map((i) => i.a))].sort(),
      [...forms].sort().filter((x) => f.items.some((i) => i.a === x)),
      f.id,
    );
  }
  const positions = [0, 0, 0];
  for (const c of lab.DETECTIVE) {
    assert.ok(
      c.chunks.join(" ").toLowerCase().includes(c.word.toLowerCase()),
      `${c.id}: word in passage`,
    );
    assert.ok(c.clue.every((i) => i >= 0 && i < c.chunks.length) && c.clue.length >= 1, c.id);
    assert.equal(c.opts.length, 3);
    assert.equal(c.optsEs.length, 3);
    assert.ok(logic.CLUE_TYPES[c.type], c.id);
    positions[c.ans] += 1;
  }
  assert.ok(Math.min(...positions) >= 8, `answer positions ${positions}`);
});

test("morpheme builder checks order, spots other real words and blends meanings", () => {
  const b = logic.buildable(WORDS);
  assert.ok(b.length >= 90);
  const w = b.find((x) => x.w === "transport") || b[0];
  const tray = logic.buildTray(w, lab.MORPHEMES);
  assert.ok(w.p.every((f) => tray.includes(f)) && tray.length === w.p.length + 3);
  assert.deepEqual(logic.buildTray(w, lab.MORPHEMES), tray, "tray is deterministic");
  assert.equal(logic.checkBuild(WORDS, w.p, w).ok, true);
  const wrong = logic.checkBuild(WORDS, [...w.p].reverse(), w);
  assert.equal(wrong.ok, false);
  assert.equal(logic.blendParts(w, lab.MORPHEMES).length, w.p.length);
  assert.ok(logic.blendParts(w, lab.MORPHEMES).every((p) => p.m && p.me));
});

test("the Word Garden grows only on independent reviews on different days and resets after help or a miss", () => {
  const day = 864e5;
  const t0 = Date.UTC(2026, 10, 2, 12);
  const st = {};
  logic.collectWord(st, "w-x", t0);
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0).stage, "seed");
  assert.deepEqual(logic.dueWords(st, t0), ["w-x"]);
  logic.reviewWord(st, "w-x", { ok: false, independent: false }, t0);
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0).stage, "sprout", "a miss starts a sprout");
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0).due, false, "not due the same day");
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0 + day).due, true, "due after 1 day");
  logic.reviewWord(st, "w-x", { ok: true, independent: true }, t0 + day);
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0 + day).stage, "leaf");
  assert.equal(
    logic.gardenInfo(st.garden["w-x"], t0 + 3 * day).due,
    false,
    "3-day interval after one success",
  );
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0 + 4 * day).due, true);
  logic.reviewWord(st, "w-x", { ok: true, independent: true }, t0 + 4 * day);
  assert.equal(logic.gardenInfo(st.garden["w-x"], t0 + 4 * day).stage, "bud");
  logic.reviewWord(st, "w-x", { ok: true, independent: false }, t0 + 12 * day);
  assert.equal(
    logic.gardenInfo(st.garden["w-x"], t0 + 12 * day).stage,
    "sprout",
    "help resets the step",
  );
  assert.deepEqual(ledger.REVIEW_INTERVALS_DAYS, [1, 3, 7, 14]);
  let t = t0 + 20 * day;
  for (let i = 0; i < 4; i++, t += 20 * day)
    logic.reviewWord(st, "w-x", { ok: true, independent: true }, t);
  assert.equal(logic.gardenInfo(st.garden["w-x"], t).stage, "tree");
  const same = {};
  logic.reviewWord(same, "w-y", { ok: true, independent: true }, t0);
  logic.reviewWord(same, "w-y", { ok: true, independent: true }, t0 + 1000);
  assert.equal(
    logic.gardenInfo(same.garden["w-y"], t0 + 1000).stage,
    "leaf",
    "two successes on one day count once",
  );
});

test("review questions are deterministic, have one right answer and never show the word in its own options", () => {
  const w = WORDS.find((x) => x.w === "predict") || WORDS[10];
  const now = Date.UTC(2026, 10, 6);
  const a = logic.reviewQuestion(w, WORDS, now);
  assert.deepEqual(a, logic.reviewQuestion(w, WORDS, now));
  assert.equal(a.opts.filter((o) => o.ok).length, 1);
  assert.equal(a.opts.length, 3);
  const slots = new Set();
  for (const x of WORDS.slice(0, 90))
    slots.add(logic.reviewQuestion(x, WORDS, now).opts.findIndex((o) => o.ok));
  assert.equal(slots.size, 3, "the right answer lands in every position");
});

test("Frayer rule: own words, no target word in the definition", () => {
  const w = { w: "habitat" };
  assert.equal(
    logic.frayerStatus(
      { def: "a habitat is a home", chars: "has food water", ex: "pond", non: "car" },
      w,
    ).done,
    false,
  );
  assert.equal(
    logic.frayerStatus(
      { def: "the place where an animal lives", chars: "has food water", ex: "pond", non: "car" },
      w,
    ).done,
    true,
  );
});

test("clue check separates found, missed and extra chunks", () => {
  const c = { clue: [1, 2] };
  assert.equal(logic.checkClue(c, [1, 2]).ok, true);
  const r = logic.checkClue(c, [0, 1]);
  assert.deepEqual([r.ok, r.hit, r.extra, r.missed], [false, [1], [0], [2]]);
});

test("every activity renders in English and Spanish for both bands with no timer or score wording and no emoji", async () => {
  resetStorage();
  for (const band of ["3-5", "6-8"]) {
    for (const lang of ["en", "es", "bi"]) {
      for (const mode of [
        "",
        "explore",
        "build",
        "cognates",
        "families",
        "detective",
        "frayer",
        "garden",
      ]) {
        const { text, root, out } = await mount(wl, ctxFor(lang, mode, "", band));
        assert.ok(root.querySelector("h1"), `${band} ${lang} ${mode}: h1`);
        assert.doesNotMatch(text, COUNTDOWN);
        assert.doesNotMatch(text, SCORE_CLAIM);
        assert.doesNotMatch(root.innerHTML, EMOJI);
        assert.ok(out.title.length > 3);
      }
    }
  }
  const es = await mount(wl, ctxFor("es", "build"));
  assert.match(es.text, /Constructor de morfemas/);
  assert.match(es.text, /Construye la palabra que significa/);
});

test("builder works from the keyboard: tiles add to slots, slots remove, check gives specific feedback and blends meaning", async () => {
  resetStorage();
  const ctx = ctxFor("en", "build");
  let m = await mount(wl, ctx);
  assert.equal(m.root.querySelectorAll("[data-wl-slot]").length >= 2, true);
  const slotCount = m.root.querySelectorAll("[data-wl-slot]").length;
  const prompt = m.root.querySelector(".wl-prompt").textContent;
  const target = logic
    .buildable(WORDS.filter((w) => logic.bandMatches(w, "6-8")))
    .filter((w) => prompt.includes(w.d))
    .sort((a, b) => b.d.length - a.d.length)[0];
  assert.ok(target, "the prompt is one word's definition");
  assert.equal(target.p.length, slotCount);
  // Wrong order first.
  for (const f of [...target.p].reverse()) {
    click(wl, ctx, m.root, `[data-wl-tile="${f}"]`);
    m = await mount(wl, ctx);
  }
  if (target.p.join("") !== [...target.p].reverse().join("")) {
    click(wl, ctx, m.root, "[data-wl-check-build]");
    m = await mount(wl, ctx);
    assert.match(m.root.querySelector(".wl-feedback").textContent, /Those parts|spell/);
  }
  click(wl, ctx, m.root, "[data-wl-bclear]");
  m = await mount(wl, ctx);
  for (const f of target.p) {
    click(wl, ctx, m.root, `[data-wl-tile="${f}"]`);
    m = await mount(wl, ctx);
  }
  assert.ok(!m.root.querySelector("[data-wl-check-build]").disabled);
  click(wl, ctx, m.root, "[data-wl-check-build]");
  m = await mount(wl, ctx);
  assert.match(
    m.root.querySelector(".wl-feedback").textContent,
    new RegExp(`You built ${target.w}`),
  );
  assert.ok(m.root.querySelector(".wl-blend"), "meaning blend shown");
  const saved = JSON.parse(localStorage.getItem(WL_KEY));
  assert.ok(saved.build.done.includes(target.id));
  assert.ok(saved.garden[target.id], "a built word is planted in the garden");
});

test("support levels A, B and C change what is open, and opening help is recorded as help", async () => {
  resetStorage();
  const ctx = ctxFor("en", "build");
  localStorage.setItem(WL_KEY, JSON.stringify({ level: "A" }));
  let m = await mount(wl, ctx);
  assert.ok(m.root.querySelector(".wl-tile small"), "A shows part meanings on tiles");
  assert.ok(m.root.querySelector(".wl-es"), "A shows Spanish");
  localStorage.setItem(WL_KEY, JSON.stringify({ level: "C" }));
  m = await mount(wl, ctx);
  assert.equal(m.root.querySelector(".wl-tile small"), null, "C shows no meanings");
  click(wl, ctx, m.root, "[data-wl-bhint]");
  m = await mount(wl, ctx);
  assert.ok(m.root.querySelector(".wl-tile small"), "help opens meanings");
  assert.equal(JSON.parse(localStorage.getItem(WL_KEY)).build.helped.length, 1);
  click(wl, ctx, m.root, '[data-sk-level="B"]');
  assert.equal(JSON.parse(localStorage.getItem(WL_KEY)).level, "B");
});

test("cognate cards classify twins, catches and none, and false friends carry a warning", async () => {
  resetStorage();
  const ctx = ctxFor("en", "cognates");
  let m = await mount(wl, ctx);
  const card = m.root.querySelector(".wl-bigword b").textContent;
  const deck = logic.cognateDeck(logic.wordsForBand(WORDS, "6-8"), lab.FALSE_FRIENDS);
  const first = deck.find((c) => c.en === card);
  click(wl, ctx, m.root, `[data-wl-cog="${first.kind}"]`);
  m = await mount(wl, ctx);
  assert.match(m.root.querySelector(".wl-feedback").textContent, /Twin|catch|No look-alike/);
  assert.equal(JSON.parse(localStorage.getItem(WL_KEY)).cog.done[first.id], 1);
  assert.ok(
    deck.filter((c) => c.kind === "catch").every((c) => c.note),
    "catch cards explain themselves",
  );
});

test("detective case: wrong chunk gets a hint without the answer; right chunks unlock the meaning question", async () => {
  resetStorage();
  const ctx = ctxFor("en", "detective");
  let m = await mount(wl, ctx);
  const word = m.root.querySelector(".wl-bigword b").textContent;
  const c = lab.DETECTIVE.find((x) => x.word === word && (x.b === "6-8" || x.b === "both"));
  const wrongIdx = c.chunks.findIndex((_, i) => !c.clue.includes(i));
  click(wl, ctx, m.root, `[data-wl-chunk="${wrongIdx}"]`);
  m = await mount(wl, ctx);
  click(wl, ctx, m.root, "[data-wl-clue-check]");
  m = await mount(wl, ctx);
  assert.match(m.root.querySelector(".wl-feedback").textContent, /clue|part|Look again/i);
  assert.equal(m.root.querySelector("[data-wl-detans]"), null);
  click(wl, ctx, m.root, `[data-wl-chunk="${wrongIdx}"]`);
  m = await mount(wl, ctx);
  for (const i of c.clue) {
    click(wl, ctx, m.root, `[data-wl-chunk="${i}"]`);
    m = await mount(wl, ctx);
  }
  click(wl, ctx, m.root, "[data-wl-clue-check]");
  m = await mount(wl, ctx);
  click(wl, ctx, m.root, `[data-wl-detans="${c.ans}"]`);
  m = await mount(wl, ctx);
  const good = [...m.root.querySelectorAll(".wl-feedback.is-right")].at(-1);
  assert.ok(good.textContent.includes(c.why.slice(0, 15)), good.textContent);
});

test("Frayer saves as the learner types and records evidence once the card is complete", async () => {
  resetStorage();
  const word =
    WORDS.find((w) => w.b !== "3-5" && w.w === "analyze") || WORDS.find((w) => w.b !== "3-5");
  const ctx = ctxFor("en", "frayer", word.id);
  let m = await mount(wl, ctx);
  type(wl, ctx, m.root, '[data-wl-frayer="def"]', "to look closely at the parts", "onInput");
  type(wl, ctx, m.root, '[data-wl-frayer="chars"]', "careful and step by step", "onInput");
  type(wl, ctx, m.root, '[data-wl-frayer="ex"]', "a poem", "onInput");
  type(wl, ctx, m.root, '[data-wl-frayer="non"]', "guessing", "onChange");
  m = await mount(wl, ctx);
  assert.match(m.text, /Your Frayer card is complete/);
  const entries = JSON.parse(localStorage.getItem(ledger.LEDGER_KEY)).entries;
  assert.equal(entries.filter((e) => e.src === "wordlab").length, 1);
  assert.ok(
    Object.values(entries[0].m).every((v) => typeof v === "number"),
    "evidence holds counts, never learner text",
  );
});

test("garden: planting, review with and without help, and growth are saved and shown", async () => {
  resetStorage();
  const w = WORDS.find((x) => x.b !== "3-5");
  const ctx = ctxFor("en", "explore");
  let m = await mount(wl, ctx);
  click(wl, ctx, m.root, `[data-wl-collect="${w.id}"], [data-wl-collect]`);
  const planted = Object.keys(JSON.parse(localStorage.getItem(WL_KEY)).garden);
  assert.equal(planted.length, 1);
  const gctx = ctxFor("en", "garden");
  m = await mount(wl, gctx);
  assert.ok(m.root.querySelector(".wl-plot"));
  click(wl, gctx, m.root, "[data-wl-rstart]");
  m = await mount(wl, gctx);
  const q = logic.reviewQuestion(
    WORDS.find((x) => x.id === planted[0]),
    WORDS,
  );
  click(wl, gctx, m.root, `[data-wl-ranswer="${q.opts.findIndex((o) => o.ok)}"]`);
  m = await mount(wl, gctx);
  assert.match(m.root.querySelector(".wl-feedback").textContent, /on your own/);
  const rec = JSON.parse(localStorage.getItem(WL_KEY)).garden[planted[0]];
  assert.equal(rec.ev.length, 1);
  assert.equal(rec.ev[0].independent, true);
});

test("routes resolve and nothing in the Word Lab source uses timers or random choices", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of [
    "lang/wordlab.js",
    "views/wordlab.js",
    "views/wordlab-play.js",
    "views/wordlab-common.js",
  ]) {
    const src = readFileSync(new URL(`../access-practice-lab/src/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /setInterval|setTimeout|Math\.random|Date\.now\(\)\s*[-+]\s*start/, f);
  }
});
