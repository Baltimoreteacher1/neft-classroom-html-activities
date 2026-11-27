// Create · the outputs and supports added after the first release: slide decks (HTML + PowerPoint), SCORM 1.2,
// uploads, ready-made and saved recipes, student supports and printable word cards. Real content through the real
// adapters; no browser (the browser path is tools/create-e2e.mjs).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import JSZip from "jszip";
import PptxGenJS from "pptxgenjs";
import { fetchJson } from "./studio-customize-adapters-helpers.mjs";

const LAB = new URL("../access-practice-lab/src/", import.meta.url);
const { customizeFrom } = await import(new URL("studio/adapters/registry.js", LAB));
const { questionsOf } = await import(new URL("studio/core/schema.js", LAB));
const { exportActivityHtml } = await import(new URL("studio/export/html.js", LAB));
const B = await import(new URL("create/build.js", LAB));
const D = await import(new URL("create/deck.js", LAB));
const Sc = await import(new URL("create/scorm.js", LAB));
const U = await import(new URL("create/upload.js", LAB));
const R = await import(new URL("create/my-recipes.js", LAB));
const Su = await import(new URL("create/supports.js", LAB));
const W = await import(new URL("create/word-cards.js", LAB));

const vocab = (await customizeFrom("vocab-academy", "g6-u01", { fetchJson })).activity;
const worksheet = B.buildResource(vocab, { format: "worksheet" }).activity;
const memIo = () => {
  const m = new Map();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => m.set(k, v) };
};

test("deck: one slide per question, answers only in the reveal and the speaker notes", async () => {
  const slides = D.deckSlides(worksheet);
  assert.equal(slides.filter((s) => s.kind === "question").length, questionsOf(worksheet).length);
  for (const q of questionsOf(worksheet).filter((x) => x.format === "choice")) {
    const s = slides.find(
      (x) =>
        x.kind === "question" && x.title.endsWith(D.deckSlides({ blocks: [q] })[1].title.slice(3)),
    );
    const letter = s.answer.slice(0, 1);
    assert.ok(
      s.lines.some((l) => l.startsWith(`${letter}.`)),
      "answer letter is a printed choice",
    );
  }
  const html = D.deckHtml(worksheet);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /\bsrc="https?:/);
  // every answer is inside a hidden .ans paragraph
  const visible = html.replace(/<p class="ans" hidden>[\s\S]*?<\/p>/g, "");
  for (const s of slides.filter((x) => x.answer && x.answer.length > 12))
    assert.ok(!visible.includes(s.answer), s.answer);
  const bytes = await D.deckPptx(worksheet, { PptxGenJS });
  const zip = await JSZip.loadAsync(bytes);
  assert.ok(zip.file("ppt/presentation.xml"));
  const notes = Object.keys(zip.files).filter((f) => /notesSlide\d+\.xml$/.test(f));
  assert.ok(notes.length >= questionsOf(worksheet).length);
});

test("deck: long passages split into readable slides", () => {
  const parts = D.chunkText(
    Array.from({ length: 60 }, (_, i) => `Sentence number ${i} is here.`).join(" "),
  );
  assert.ok(parts.length >= 3);
  for (const p of parts) assert.ok(p.split(/\s+/).length <= 95);
});

test("SCORM 1.2: manifest + offline page that reports completion, no score, no network", async () => {
  const html = exportActivityHtml(worksheet, {
    js: "var StudioPlayer={mountPlayer:function(){}}",
    css: "x",
    scorm: true,
  });
  assert.match(html, /LMSInitialize/);
  assert.match(html, /cmi\.core\.lesson_status", "completed"/);
  assert.doesNotMatch(html, /cmi\.core\.score/);
  const zip = await JSZip.loadAsync(await Sc.buildScorm(worksheet, { html, JSZip }));
  assert.deepEqual(Object.keys(zip.files).sort(), ["imsmanifest.xml", "index.html"]);
  const man = await zip.file("imsmanifest.xml").async("string");
  assert.match(man, /<schemaversion>1\.2<\/schemaversion>/);
  assert.match(man, /adlcp:scormtype="sco" href="index\.html"/);
  assert.match(Sc.scormId(worksheet), /^LP-CREATE-[A-Za-z0-9-]+$/);
  const again = await Sc.buildScorm(worksheet, { html, JSZip });
  assert.deepEqual(again, await Sc.buildScorm(worksheet, { html, JSZip }), "byte-identical builds");
  await assert.rejects(Sc.buildScorm(worksheet, { html: "<p>plain</p>", JSZip }));
  // the plain export never talks to an LMS
  assert.doesNotMatch(exportActivityHtml(worksheet, { js: "x", css: "x" }), /LMSInitialize/);
});

test("upload: pasted questions become an activity; an unmarked answer is listed, never guessed", async () => {
  const r = await U.readUpload({
    text: "Plants\n\n1. What do seeds need?\nA. Water and sun *\nB. Snow\n\n2. Which part grows?\nA. seed\nB. rock",
  });
  assert.equal(r.ok, true);
  const qs = questionsOf(r.activity);
  assert.equal(qs.length, 1, "only the question with a marked answer is used");
  assert.equal(qs[0].options.find((o) => o.id === qs[0].answer).text, "Water and sun");
  assert.ok(r.review.length >= 1);
  const pdf = await U.readUpload({ name: "x.pdf", bytes: new Uint8Array([37, 80, 68, 70]) });
  assert.equal(pdf.ok, false);
  assert.equal((await U.readUpload({ text: "   " })).ok, false);
});

test("ready-made recipes: offered only when every step can be filled from the page", () => {
  const st = B.formatStatus(vocab);
  const math = st.find((f) => f.id === "recipe:math-model-error-practice");
  assert.equal(math.can, false, "a vocabulary page cannot fill a math recipe");
  const reading = st.find((f) => f.id === "recipe:reading-vocab-comprehension");
  assert.equal(reading.can, true);
  const built = B.buildResource(vocab, { format: reading.id });
  assert.equal(built.format, reading.id);
  assert.equal(built.validation.ok, true);
  assert.equal(built.activity.lineage?.family, vocab.lineage?.family);
});

test("saved recipes: keep choices, never content; replace by name; survive bad data", () => {
  const io = memIo();
  assert.deepEqual(R.listRecipes(io), []);
  const a = R.saveRecipe(io, {
    name: "Friday check",
    format: "check",
    adjust: { amount: "shorter" },
    supports: { level: "developing", on: ["frames"] },
  });
  assert.equal(a.ok, true);
  const stored = io.get(R.RECIPES_KEY);
  assert.doesNotMatch(stored, /reluctant|cautious/, "no words from the page");
  R.saveRecipe(io, { name: "friday CHECK", format: "worksheet", adjust: {} });
  const list = R.listRecipes(io);
  assert.equal(list.length, 1);
  assert.equal(list[0].format, "worksheet");
  assert.equal(R.saveRecipe(io, { name: " ", format: "check" }).reason, "name");
  assert.equal(R.saveRecipe(io, { name: "x", format: "nope" }).reason, "format");
  R.deleteRecipe(io, list[0].id);
  assert.deepEqual(R.listRecipes(io), []);
  io.set(R.RECIPES_KEY, "{not json");
  assert.deepEqual(R.listRecipes(io), []);
});

test("supports: every level and support keeps each question's prompt and answer", () => {
  const all = Su.SUPPORTS.map((s) => s.id);
  for (const level of Su.LEVELS.map((l) => l.id)) {
    const r = Su.applyCreateSupports(worksheet, { level, on: all });
    assert.equal(r.activity.id, worksheet.id);
    const before = new Map(questionsOf(worksheet).map((q) => [q.id, q]));
    for (const q of questionsOf(r.activity)) {
      const o = before.get(q.id);
      if (!o) continue; // Extension adds challenge items, listed in lineage.added
      assert.equal(q.prompt, o.prompt);
      assert.deepEqual(q.answer ?? q.answers ?? null, o.answer ?? o.answers ?? null);
    }
  }
  const r = Su.applyCreateSupports(worksheet, {
    level: "grade",
    on: ["readAloud", "frames", "spanish"],
  });
  assert.equal(r.activity.supports.readAloud, true);
  assert.equal(r.activity.supports.frames, true);
  assert.equal(r.activity.supports.spanish, true);
  const pics = Su.applyCreateSupports(worksheet, { on: ["visuals"] });
  assert.equal(pics.activity.supports.visuals, false, "no pictures in the list: not faked");
  assert.ok(pics.warnings.some((w) => /picture/i.test(w.en)));
  assert.deepEqual(Su.cleanSupports({ level: "x", on: ["frames", "bogus"] }), {
    level: "grade",
    on: ["frames"],
  });
  const viaBuild = B.buildResource(vocab, {
    format: "worksheet",
    supports: { level: "emerging", on: [] },
  });
  assert.equal(viaBuild.supports.level, "emerging");
  assert.equal(viaBuild.activity.supports.wida, 2);
});

test("word cards: one card per word from the page, nothing invented", () => {
  const { html, count } = W.wordCardsHtml(vocab);
  const items = vocab.blocks.filter((b) => b.type === "vocab").flatMap((b) => b.items);
  assert.equal(count, new Set(items.map((v) => v.term.toLowerCase())).size);
  assert.equal((html.match(/<section class="card">/g) || []).length, count);
  for (const v of items) assert.ok(html.includes(v.term));
  assert.match(html, /default-src 'none'/);
  assert.equal(W.wordCardsHtml({ title: "x", blocks: [] }).count, 0);
});

test("new Create modules build DOM without innerHTML", () => {
  const dir = new URL("create/", LAB);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js")))
    assert.doesNotMatch(
      readFileSync(new URL(f, dir), "utf8"),
      /\.innerHTML\s*=|insertAdjacentHTML/,
      f,
    );
});

const G = await import(new URL("create/print-games.js", LAB));
const X = await import(new URL("create/extras.js", LAB));

test("deck class play: team points and a fair picker, offline, nothing stored", () => {
  const html = D.deckHtml(worksheet);
  for (const id of ["play", "play-t", "play-p", "pick", "pick-size", "pick-go"])
    assert.match(html, new RegExp(`id="${id}"`), id);
  assert.doesNotMatch(
    html,
    /localStorage|sessionStorage|setTimeout|setInterval/,
    "no storage, no timers",
  );
  assert.match(html, /default-src 'none'/);
  assert.match(D.deckHtml(worksheet, { lang: "es" }), /¿Quién responde\?/);
  // the picker draws from a bag (no repeats until everyone has had a turn)
  assert.match(html, /bag\.splice/);
});

test("word bingo: one distinct card per student, only the page's words, reprints identically", () => {
  const words = new Set(
    vocab.blocks.filter((b) => b.type === "vocab").flatMap((b) => b.items.map((v) => v.term)),
  );
  const r = G.bingoHtml(vocab, { count: 24 });
  assert.equal(r.cards, 24);
  assert.equal(r.size, G.bingoSize(words.size));
  assert.ok(r.size >= 3);
  const cards = r.html.match(/<table[\s\S]*?<\/table>/g);
  assert.equal(cards.length, 24);
  const seen = new Set();
  for (const c of cards) {
    const cells = [...c.matchAll(/<td(?: class="free")?>([^<]*)<\/td>/g)].map((m) => m[1]);
    assert.equal(cells.length, r.size * r.size);
    const terms = cells.filter((x) => x !== "FREE");
    assert.equal(new Set(terms).size, terms.length, "no word twice on a card");
    for (const t of terms)
      assert.ok(
        [...words].some((w) => w.replace(/&/g, "&amp;") === t || w === t),
        t,
      );
    seen.add(terms.join("|"));
  }
  assert.ok(seen.size >= 23, "cards differ");
  assert.equal(G.bingoHtml(vocab, { count: 24 }).html, r.html, "seeded: same page, same cards");
  assert.match(r.html, /Caller's list/);
  assert.equal(G.bingoHtml({ title: "x", blocks: [] }).cards, 0);
  assert.deepEqual([7, 8, 16, 24].map(G.bingoSize), [0, 3, 4, 5]);
});

test("I have / Who has: every word held once and asked once; the chain closes", () => {
  const r = G.whoHasHtml(vocab);
  const have = [...r.html.matchAll(/I have: <b>([^<]*)<\/b>/g)].map((m) => m[1]);
  const asks = [...r.html.matchAll(/means: “([^”]*)”/g)].map((m) => m[1]);
  assert.equal(have.length, r.count);
  assert.equal(new Set(have).size, have.length);
  assert.equal(new Set(asks).size, asks.length);
  assert.equal((r.html.match(/★ Start here/g) || []).length, 1);
  assert.equal(G.whoHasHtml({ title: "x", blocks: [] }).count, 0);
});

test("exit slips: copies of the first questions that fit the page, never an answer", () => {
  const r = G.exitSlipsHtml(worksheet);
  assert.ok(r.questions >= 1 && r.questions <= 2);
  assert.ok([2, 4].includes(r.perPage));
  assert.equal((r.html.match(/<section class="slip">/g) || []).length, r.perPage);
  const short = G.exitSlipsHtml({
    title: "t",
    blocks: [
      { type: "question", id: "a", format: "short", prompt: "Why?", sample: "Because." },
      { type: "question", id: "b", format: "short", prompt: "How?", sample: "Like so." },
    ],
  });
  assert.equal(short.perPage, 4, "short questions: four slips to a page");
  assert.equal(short.questions, 2);
  for (const s of D.deckSlides(worksheet)
    .filter((x) => x.kind === "question")
    .slice(0, 2))
    if (s.answer && s.answer.length > 12) assert.ok(!r.html.includes(s.answer));
  assert.equal(G.exitSlipsHtml({ title: "x", blocks: [] }).questions, 0);
});

test("three-level set: each WIDA tier keeps every question's prompt and answer", () => {
  assert.deepEqual([...X.LEVEL_SET], ["emerging", "developing", "expanding"]);
  const base = new Map(questionsOf(worksheet).map((q) => [q.id, q]));
  const widas = new Set();
  for (const level of X.LEVEL_SET) {
    const a = B.buildResource(vocab, { format: "worksheet", supports: { level, on: [] } }).activity;
    widas.add(a.supports?.wida);
    for (const q of questionsOf(a)) {
      const o = base.get(q.id);
      if (!o) continue;
      assert.equal(q.prompt, o.prompt);
      assert.deepEqual(q.answer ?? q.answers ?? null, o.answer ?? o.answers ?? null);
    }
  }
  assert.equal(widas.size, 3, "three different levels");
});
