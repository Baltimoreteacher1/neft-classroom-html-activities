// Language Studio print pipeline: builds every part for every authored unit in every level, no network.
// Run: node --test functions/_lib/bcpss/studio-print.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getUnitDetail } from "./db.js";
import { bingoBoards } from "./studio-doc-kits.js";
import { buildStudioDocument, isKnownPart, partFilename, renderStudioPart } from "./studio-print-html.js";

const UNITS_DIR = new URL("../../../db/seeds/bcpss/v2/units/", import.meta.url);
const LEVELS = ["l1_2", "l3_4", "l5_6"];
const KIT_PARTS = ["cards", "bingo", "wall", "poster", "strips", "talk"];
const ALL_PARTS = ["packet", "book", "key", ...KIT_PARTS];

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const body = (html) => html.replace(/<style>[\s\S]*?<\/style>/, "");

// Minimal bilingual family fixture, used only when a unit has no authored detail.family.
function familyFixture(studio) {
  const bi = (s) => ({ en: s, es: `${s} (es)` });
  return {
    summary: bi("Your child is learning to talk about shapes and explain why an answer makes sense in clear sentences."),
    vocab: studio.vocab.map((v) => ({ term: v.term, def_es: `Definición breve de ${v.term}.`, example_es: `Ejemplo breve con ${v.term}.` })),
    talk: [1, 2, 3, 4].map((n) => bi(`Question ${n}: what did you notice today?`)),
    try_at_home: [1, 2, 3].map((n) => ({ title: bi(`Activity ${n}`), minutes: 10, materials: bi("paper and a pencil"), steps: { en: ["Step one.", "Step two.", "Step three."], es: ["Paso uno.", "Paso dos.", "Paso tres."] } })),
    say_it: [1, 2, 3].map((n) => bi(`Sentence ${n} has a [word] in it.`)),
    help: { en: ["Ask and listen.", "Use real objects.", "Praise reasons."], es: ["Pregunte y escuche.", "Use objetos reales.", "Elogie las razones."] },
    home_language: bi("Say the words in your home language too, and compare them with English."),
    celebrate: bi("Your child explains an answer with because."),
  };
}

const units = [];
for (const file of fs.readdirSync(UNITS_DIR)) {
  if (!file.endsWith(".mjs")) continue;
  const id = file.replace(/\.mjs$/, "");
  let detail;
  try {
    detail = (await getUnitDetail({}, id)).detail;
  } catch {
    continue;
  }
  if (!detail?.unit) continue;
  if (!detail.studio) detail.studio = (await import(new URL(file, UNITS_DIR))).default;
  if (!detail.family) detail.family = familyFixture(detail.studio);
  units.push(detail);
}

test("authored units are present", () => {
  assert.ok(units.length >= 1);
  assert.ok(units.some((d) => d.unit.id === "g6-math-u1"));
});

test("every part renders clean HTML for every unit and level", () => {
  let renders = 0;
  for (const detail of units) {
    const parts = [...ALL_PARTS, "family", "activity-1", `activity-${detail.studio.activities.length}`];
    for (const level of LEVELS) {
      for (const part of parts) {
        const tag = `${detail.unit.id} ${part} ${level}`;
        const html = renderStudioPart(detail, { part, level });
        renders++;
        assert.ok(html.length > 3000, `${tag}: too short`);
        assert.match(html, /^<!DOCTYPE html>/, tag);
        const text = body(html);
        assert.ok(!/undefined|\[object Object\]|NaN/.test(text), `${tag}: undefined/NaN/[object Object]`);
        assert.ok(!/<script/i.test(text), `${tag}: scripts are not allowed`);
        const doc = buildStudioDocument(detail, { part, level });
        assert.equal((text.match(/<section class="sec/g) || []).length, doc.sections.length, `${tag}: section count`);
        assert.match(html, /@page\{size:letter/, tag);
        assert.match(html, /\.sec\{break-before:page/, tag);
        assert.ok(!/\bESOL\b/i.test(text), `${tag}: ESOL label`);
      }
    }
  }
  assert.ok(renders > 50);
});

test("page structure: sections, orientation and cover", () => {
  for (const detail of units) {
    const sections = (part) => buildStudioDocument(detail, { part, level: "l3_4" }).sections;
    const book = sections("book");
    assert.equal(book[0].bleed, true, "book starts with a bleed cover");
    assert.equal(book[0].pageBreakBefore, false);
    assert.ok(book.slice(1).every((s) => s.pageBreakBefore), "every later section starts a page");
    assert.ok(book.length >= detail.studio.activities.length + 4);
    assert.equal(sections("packet").length, 4, "packet is 4 pages");
    assert.ok(sections("wall").every((s) => s.layout === "landscape"));
    assert.ok(sections("poster").every((s) => s.layout === "landscape"));
    assert.ok(sections("cards").every((s) => s.layout === "portrait"));
  }
});

test("single activity part contains only that activity", () => {
  const detail = units.find((d) => d.unit.id === "g6-math-u1");
  const html = renderStudioPart(detail, { part: "activity-3" });
  assert.ok(html.includes(esc(detail.studio.activities[2].title)));
  assert.ok(!html.includes(esc(detail.studio.activities[3].title)));
  assert.throws(() => renderStudioPart(detail, { part: "activity-99" }), /not found/);
});

test("answer-key variant fills every answer", () => {
  for (const detail of units) {
    detail.studio.activities.forEach((a, k) => {
      const html = renderStudioPart(detail, { part: `activity-${k + 1}`, answerKey: true });
      const tag = `${detail.unit.id} ${a.title} (${a.kind})`;
      const p = a.payload;
      if (a.kind === "match") for (const pair of p.pairs) assert.ok(html.includes(esc(pair.r)) && html.includes(esc(pair.l)), `${tag}: pair ${pair.l}`);
      if (a.kind === "cloze") for (const ans of p.answers) assert.ok(html.includes(`<span class="fill">${esc(ans)}</span>`), `${tag}: ${ans}`);
      if (a.kind === "unscramble") for (const it of p.items) assert.ok(html.includes(esc(it.parts.join(" "))), `${tag}: sentence`);
      if (a.kind === "sequence") for (const s of p.steps) assert.ok(html.includes(esc(s)), tag);
      if (a.kind === "quiz" || a.kind === "error_analysis") {
        for (const it of p.items) assert.ok(html.includes(esc(it.why)), `${tag}: why`);
        assert.equal((html.match(/class="bd on"/g) || []).length, p.items.length, `${tag}: one filled bubble per question`);
      }
      if (a.kind === "write_scaffold") assert.ok(html.includes(esc(p.model)), tag);
      if (a.kind === "sentence_combine") for (const it of p.items) assert.ok(html.includes(esc(it.model)), tag);
      if (a.kind === "word_sort") for (const it of p.items) assert.ok(html.includes(esc(it.text)), tag);
      if (a.kind === "dictogloss") assert.ok(html.includes(esc(p.text)), tag);
      if (a.kind === "info_gap") for (const h of [...p.a.has, ...p.b.has]) assert.ok(html.includes(esc(h.v)), tag);
      if (a.kind === "clue_game") for (const c of p.cards) assert.ok(html.includes(esc(c.term)), tag);
      // student version must NOT contain the model answer
      if (a.kind === "write_scaffold") assert.ok(!renderStudioPart(detail, { part: `activity-${k + 1}` }).includes(esc(p.model)), `${tag}: model leaked`);
    });
  }
});

test("key part lists every answer, tip and the exit-ticket rubric", () => {
  for (const detail of units) {
    const html = renderStudioPart(detail, { part: "key" });
    const tag = detail.unit.id;
    for (const a of detail.studio.activities) {
      assert.ok(html.includes(esc(a.title)), `${tag}: ${a.title}`);
      assert.ok(html.includes(esc(a.tip)), `${tag}: tip for ${a.title}`);
      const p = a.payload;
      if (a.kind === "match") for (const pair of p.pairs) assert.ok(html.includes(esc(pair.r)), tag);
      if (a.kind === "cloze") for (const ans of p.answers) assert.ok(html.includes(esc(ans)), tag);
      if (a.kind === "write_scaffold") assert.ok(html.includes(esc(p.model)), tag);
    }
    for (const level of Object.values(detail.studio.exit_ticket.rubric)) assert.ok(html.includes(esc(level)), `${tag}: rubric`);
    assert.ok(html.includes(esc(detail.studio.exit_ticket.model)), `${tag}: exit model`);
  }
});

test("cards: 8 per page, front/back pairs with mirrored back columns", () => {
  for (const detail of units) {
    const doc = buildStudioDocument(detail, { part: "cards" });
    const grids = doc.sections.map((s) => s.blocks.find((b) => b.type === "cardGrid"));
    assert.ok(grids.every((g) => g.cards.length === 8 && g.cols === 2), "8 cards (2x4) per page");
    const real = grids.flatMap((g) => g.cards).filter((c) => !c.empty);
    assert.equal(real.length, detail.studio.vocab.length * 2, `${detail.unit.id}: front + back card per term`);
    assert.equal(grids.length % 2, 0, "front/back pairs");
    // first row of page 1: front [A, B]; matching back row is mirrored [B, A]
    const first = (g) => g.cards.slice(0, 2).map((c) => c.blocks.flatMap((b) => b.runs || []).map((r) => r.t || "").join(""));
    const front = first(grids[0]);
    const back = first(grids[1]);
    assert.ok(back[0].startsWith(detail.studio.vocab[1].term) && back[1].startsWith(detail.studio.vocab[0].term), `${detail.unit.id}: mirrored back`);
    assert.ok(front[0].includes(detail.studio.vocab[0].term));
  }
});

test("bingo: 6 unique 3x3 boards with a free centre, plus a call sheet", () => {
  for (const detail of units) {
    const terms = detail.studio.vocab.map((v) => v.term);
    const boards = bingoBoards(terms);
    assert.equal(boards.length, 6);
    assert.equal(new Set(boards.map((b) => b.join("|"))).size, 6, `${detail.unit.id}: boards must differ`);
    for (const b of boards) {
      assert.equal(b.length, 8);
      assert.equal(new Set(b).size, 8);
      assert.ok(b.every((w) => terms.includes(w)));
    }
    const doc = buildStudioDocument(detail, { part: "bingo" });
    const grids = doc.sections.flatMap((s) => s.blocks).filter((b) => b.type === "cardGrid");
    assert.equal(grids.length, 6);
    for (const g of grids) {
      assert.equal(g.cards.length, 9);
      assert.ok(g.cards[4].blocks.some((b) => b.runs?.some((r) => r.t === "FREE")), "free centre");
    }
    assert.equal(doc.sections.length, 4, "3 board pages + call sheet");
    const html = renderStudioPart(detail, { part: "bingo" });
    for (const term of terms) assert.ok(html.includes(esc(term)), `${detail.unit.id}: ${term}`);
  }
});

test("wall, poster, strips, talk carry the unit content", () => {
  for (const detail of units) {
    const s = detail.studio;
    const tag = detail.unit.id;
    const wall = buildStudioDocument(detail, { part: "wall" });
    assert.equal(wall.sections.flatMap((x) => x.blocks.flatMap((b) => b.cards)).length, s.vocab.length, `${tag}: one strip per term`);
    const poster = renderStudioPart(detail, { part: "poster" });
    for (const c of s.mentor.chunks) assert.ok(poster.includes(esc(c.text)), `${tag}: chunk`);
    const strips = renderStudioPart(detail, { part: "strips" });
    for (const level of LEVELS) for (const f of s.frames[level]) assert.ok(strips.includes(esc(f.split("[")[0].trim())), `${tag}: frame ${f}`);
    const talkAct = s.activities.find((a) => a.kind === "talk_cards");
    if (talkAct) {
      const talk = buildStudioDocument(detail, { part: "talk" });
      const cards = talk.sections.flatMap((x) => x.blocks.filter((b) => b.type === "cardGrid").flatMap((b) => b.cards)).filter((c) => !c.empty);
      assert.equal(cards.length, 2 + talkAct.payload.cards.length + talkAct.payload.moves.length, `${tag}: talk deck size`);
    }
  }
});

test("packet covers the unit overview", () => {
  for (const detail of units) {
    const html = renderStudioPart(detail, { part: "packet" });
    const s = detail.studio;
    for (const v of s.vocab) assert.ok(html.includes(esc(v.term)), `${detail.unit.id}: ${v.term}`);
    for (const a of s.activities) assert.ok(html.includes(esc(a.title)));
    for (const w of s.watchouts) assert.ok(html.includes(esc(w.issue)));
    assert.ok(html.includes(esc(s.essential_question)));
    assert.ok(html.includes(esc(s.can_do.content)));
  }
});

test("family guide is bilingual and carries every section", () => {
  for (const detail of units) {
    const f = detail.family;
    const html = renderStudioPart(detail, { part: "family" });
    const tag = detail.unit.id;
    assert.ok(html.includes(esc(f.summary.en)) && html.includes(esc(f.summary.es)), `${tag}: summary`);
    for (const q of f.talk) assert.ok(html.includes(esc(q.en)) && html.includes(esc(q.es)), `${tag}: talk`);
    for (const a of f.try_at_home) assert.ok(html.includes(esc(a.title.en)) && html.includes(esc(a.title.es)), `${tag}: try`);
    for (const v of f.vocab) assert.ok(html.includes(esc(v.def_es)), `${tag}: ${v.term}`);
    for (const h of f.help.en) assert.ok(html.includes(esc(h)), `${tag}: help`);
    assert.ok(html.includes(esc(f.home_language.es)) && html.includes(esc(f.celebrate.es)));
    assert.ok((html.match(/class="bx"/g) || []).length >= f.try_at_home.length, "a checkbox per activity");
    assert.ok(html.includes("Cut out and keep"));
  }
  const bare = { ...units[0], family: undefined };
  assert.throws(() => renderStudioPart(bare, { part: "family" }), /family content not authored/);
});

test("filenames and part names", () => {
  assert.equal(partFilename("BCPSS-G6-Math-U1-WIDA-3-4.pdf", "packet"), "BCPSS-G6-Math-U1-WIDA-3-4.pdf");
  assert.equal(partFilename("BCPSS-G6-Math-U1-WIDA-3-4.pdf", "book"), "BCPSS-G6-Math-U1-book-WIDA-3-4.pdf");
  assert.equal(partFilename("BCPSS-G6-Math-U1-WIDA-3-4.html", "activity-4"), "BCPSS-G6-Math-U1-activity-4-WIDA-3-4.html");
  for (const p of [...ALL_PARTS, "family", "activity-12"]) assert.ok(isKnownPart(p), p);
  assert.ok(!isKnownPart("activity-"));
  assert.ok(!isKnownPart("nope"));
});

test("export endpoint serves parts and rejects bad requests", async () => {
  const { onRequest } = await import("../../api/bcpss/export/[unitId].js");
  const call = (qs, unitId = "g6-math-u1") => onRequest({ request: new Request(`https://example.test/api/bcpss/export/${unitId}?${qs}`), params: { unitId }, env: {} });
  const book = await call("format=html&part=book&wida=1_2&download=1");
  assert.equal(book.status, 200);
  assert.match(book.headers.get("Content-Disposition"), /BCPSS-G6-Math-U1-book-WIDA-1-2\.html/);
  assert.match(await book.text(), /Student Activity Book/);
  assert.equal((await call("format=html&part=bogus")).status, 400);
  assert.equal((await call("format=html&part=book&wida=9")).status, 400);
  const docx = await call("format=docx&part=book&wida=5_6");
  assert.equal(docx.status, 200);
  assert.match(docx.headers.get("Content-Type"), /wordprocessingml\.document/);
  assert.match(docx.headers.get("Content-Disposition"), /BCPSS-G6-Math-U1-book-WIDA-5-6\.docx/);
  assert.equal(new Uint8Array(await docx.arrayBuffer())[0], 0x50, "docx is a zip");
  assert.equal((await call("format=docx&part=family")).status, 200);
  assert.equal((await call("format=docx&part=packet")).status, 200);
  const pdf = await call("format=pdf&part=key");
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("X-BCPSS-PDF-Fallback"), "print-html");
  assert.equal((await call("format=html&part=packet")).status, 200);
});
