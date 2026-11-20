#!/usr/bin/env node
// Conservative grapheme parsing: one taught vowel nucleus, or taught syllables with final y.
// Split silent-e requires the matching a_e/i_e/o_e/u_e pattern; teaching short a does not teach long a.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../access-practice-lab/content/reading-path/", import.meta.url);
const scope = JSON.parse(readFileSync(new URL("phonics-scope.json", dir), "utf8"));
const tokens = (s) => s.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
export function decodes(word, graphemes) {
  const known = new Set(graphemes);
  for (const g of ["sh", "ch", "th", "wh", "ck", "ng", "ph"])
    if (word.includes(g) && !known.has(g)) return false;
  const consonant = "[bcdfghjklmnpqrstvwxyz]";
  const c = new RegExp(`^${consonant}*$`);
  const consonants = (s) => c.test(s) && [...s].every((x) => known.has(x));
  const simple = (w) => {
    if (w.endsWith("e"))
      for (const v of ["a", "i", "o", "u"])
        if (known.has(`${v}_e`)) {
          const m = w.match(new RegExp(`^(${consonant}*)${v}(${consonant}+)e$`));
          if (m && consonants(m[1] + m[2])) return true;
        }
    for (const g of [...known].filter((g) => !g.includes("_") && /[aeiouy]/.test(g))) {
      const at = w.indexOf(g);
      if (at < 0) continue;
      if (consonants(w.slice(0, at)) && consonants(w.slice(at + g.length))) return true;
    }
    return false;
  };
  if (simple(word)) return true;
  if (known.has("y") && word.endsWith("y")) return simple(word.slice(0, -1));
  return false;
}
export function validateBook(book, units = scope.units) {
  const errors = [];
  const n = units.findIndex((u) => u.id === book?.unit);
  if (n < 0) return ["unknown unit"];
  const taught = units.slice(0, n + 1);
  const graphemes = taught.flatMap((u) => u.graphemes);
  const sight = new Set(taught.flatMap((u) => u.sightWords));
  const names = new Set((book.names || []).map((n) => n.toLowerCase()));
  if (
    book.schema !== "lp-decodable/1" ||
    book.reviewStatus !== "automated-checks-only" ||
    !book.title?.en ||
    !book.title?.es ||
    book.pages?.length < 6 ||
    book.pages?.length > 10
  )
    errors.push("metadata, languages or page count");
  const words = (book.pages || []).flatMap((p) => tokens(p.en || ""));
  if (words.length < 30 || words.length > 80) errors.push("word count");
  for (const p of book.pages || []) if (!p.en || !p.es) errors.push("missing Spanish");
  for (const w of new Set(words))
    if (!sight.has(w) && !names.has(w) && !decodes(w, graphemes))
      errors.push(`untaught word: ${w}`);
  return errors;
}
assert.equal(decodes("cake", ["c", "a", "k", "e"]), false);
assert.equal(decodes("cake", ["c", "a_e", "k"]), true);
const files = readdirSync(dir).filter((f) => f !== "phonics-scope.json" && f.endsWith(".json"));
assert.equal(files.length, 15, "expected one reader per unit, never a zero-file sweep");
const books = files.map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));
const errors = books.flatMap((b) => validateBook(b).map((e) => `${b.id}: ${e}`));
assert.ok(validateBook({ ...books[0], pages: [] }).length);
assert.ok(
  validateBook({ ...books[0], pages: books[0].pages.map((p) => ({ ...p, en: p.en + " giraffe" })) })
    .length,
);
assert.ok(
  validateBook({ ...books[0], pages: books[0].pages.map((p) => ({ ...p, es: "" })) }).length,
);
assert.deepEqual(errors, []);
console.log(
  "decodables: PASS · all 15 books · 30–80 words · 6–10 bilingual pages · untaught-word, count and language mutations",
);
