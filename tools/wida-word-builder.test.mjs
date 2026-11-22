// Word Builder (wida-access/word-builder) content contract: every word is a real prefix + root + suffix combination,
// the spelling and part of speech agree with the tiles, every tile is useful, and the cloze deck is answerable.
// Run: node tools/wida-word-builder.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const PAGE = new URL("../wida-access/word-builder/index.html", import.meta.url);
const html = readFileSync(PAGE, "utf8");
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const dataSrc = script.slice(0, script.indexOf("const QUEST_GOALS"));
const ctx = vm.createContext({});
vm.runInContext(`${dataSrc}\nthis.D = { PREFIXES, ROOTS, SUFFIXES, WORDS, CLOZE_DECK };`, ctx);
const { PREFIXES, ROOTS, SUFFIXES, WORDS, CLOZE_DECK } = ctx.D;

const ENDING = {
  "-ation": /(ation|tion|sion|ion)$/,
  "-ence": /ence$/,
  "-ure": /ure$/,
  "-able": /able$/,
  "-ent": /ent$/,
  "-ive": /ive$/,
  "-ous": /ous$/,
  "-ate": /ate$/,
};
const POS_OF = {
  "-ation": "noun",
  "-ence": "noun",
  "-ure": "noun",
  "-able": "adjective",
  "-ent": "adjective",
  "-ive": "adjective",
  "-ous": "adjective",
  "-ate": "verb",
};
const words = (t) => t.trim().split(/\s+/).length;

test("tiles: every suffix has a spelling rule and a part of speech", () => {
  for (const s of SUFFIXES) {
    assert.ok(ENDING[s.v] && POS_OF[s.v], `unknown suffix ${s.v}`);
    assert.ok(s.label.includes(POS_OF[s.v]), `${s.v} label must name ${POS_OF[s.v]}`);
  }
});

test("words: unique, built from real tiles, spelled and typed consistently", () => {
  const terms = new Set();
  const triples = new Set();
  for (const w of WORDS) {
    assert.ok(!terms.has(w.term), `duplicate term ${w.term}`);
    terms.add(w.term);
    const key = [w.prefix, w.root, w.suffix].join("|");
    assert.ok(!triples.has(key), `two words share the recipe ${key}`);
    triples.add(key);
    assert.ok(
      PREFIXES.some((p) => p.v === w.prefix),
      `${w.term}: prefix ${w.prefix}`,
    );
    assert.ok(
      ROOTS.some((r) => r.v === w.root),
      `${w.term}: root ${w.root}`,
    );
    assert.ok(
      SUFFIXES.some((s) => s.v === w.suffix),
      `${w.term}: suffix ${w.suffix}`,
    );
    if (w.prefix)
      assert.ok(
        w.term.startsWith(w.prefix.replace("-", "")),
        `${w.term} must start with ${w.prefix}`,
      );
    assert.ok(w.term.includes(w.root.slice(0, -1)), `${w.term} must contain the root ${w.root}`);
    assert.match(w.term, ENDING[w.suffix], `${w.term} must end like ${w.suffix}`);
    assert.equal(w.pos, POS_OF[w.suffix], `${w.term}: ${w.suffix} makes a ${POS_OF[w.suffix]}`);
    assert.ok(w.parts.includes(w.root.slice(0, -1)), `${w.term}: parts must show the root`);
    assert.ok(w.def && words(w.def) <= 16, `${w.term}: definition must be short (<=16 words)`);
    assert.ok(w.es, `${w.term}: Spanish gloss`);
    const n = words(w.sentence);
    assert.ok(n >= 8 && n <= 24, `${w.term}: sentence length ${n}`);
    assert.ok(
      new RegExp(w.term.slice(0, Math.max(4, w.term.length - 3)), "i").test(w.sentence),
      `${w.term}: sentence must use the word`,
    );
  }
});

test("coverage: every tile and root is used", () => {
  for (const p of PREFIXES.filter((p) => p.v))
    assert.ok(
      WORDS.some((w) => w.prefix === p.v),
      `prefix ${p.v} unused`,
    );
  for (const s of SUFFIXES)
    assert.ok(
      WORDS.some((w) => w.suffix === s.v),
      `suffix ${s.v} unused`,
    );
  for (const r of ROOTS) {
    const n = new Set(WORDS.filter((w) => w.root === r.v).map((w) => w.suffix)).size;
    assert.ok(n >= 1, `root ${r.v} unused`);
  }
  assert.ok(WORDS.length >= 30, "enough words for varied play");
});

test("cloze: one clear answer, a grammar clue, answers not always in the same slot", () => {
  const slots = new Set();
  for (const c of CLOZE_DECK) {
    const ws = c.options.map(([w]) => w);
    assert.equal(new Set(ws).size, ws.length, `cloze ${c.id}: duplicate options`);
    const answerIdx = ws.indexOf(c.answer);
    assert.ok(answerIdx >= 0, `cloze ${c.id}: answer must be an option`);
    slots.add(answerIdx);
    assert.equal(
      c.options[answerIdx][1],
      c.need,
      `cloze ${c.id}: answer part of speech must match need`,
    );
    assert.equal(
      c.options.filter(([, pos]) => pos === c.need).length,
      1,
      `cloze ${c.id}: exactly one option can fit`,
    );
    assert.ok(c.why.length > 30, `cloze ${c.id}: needs a grammar explanation`);
    assert.ok(
      !(c.before + c.after).toLowerCase().includes(c.answer),
      `cloze ${c.id}: answer leaks into the sentence`,
    );
  }
  assert.ok(slots.size >= 3, "answers must appear in at least 3 different positions");
});

test("page: no blocking dialogs, live regions and keyboard-friendly controls", () => {
  assert.ok(!/\b(alert|confirm|prompt)\(/.test(script), "no alert/confirm/prompt");
  assert.ok(!/onclick=/.test(html), "no inline onclick handlers");
  assert.ok(/id="forgeStatus"[^>]*role="status"/.test(html), "forge feedback is a live region");
  assert.ok(/id="clozeFeedback"[^>]*role="status"/.test(html), "cloze feedback is a live region");
  assert.ok(/aria-pressed/.test(script), "tiles expose their pressed state");
  assert.ok(/focus-visible/.test(html), "visible focus style");
  assert.ok(/prefers-reduced-motion/.test(html), "reduced motion respected");
  assert.ok(!/Day Streak|setInterval|countdown/i.test(html), "no streak or timer mechanics");
});
