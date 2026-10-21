// Practice Studio typesetting (assets/studio/typeset.js): which fractions stack, what a screen reader hears, and when an
// item stem splits into setup + ask. Everything here is a fixture with a known answer; the fallbacks are tested as hard as
// the matches, because a wrong split or a typeset date is worse than plain text.
//   node tools/studio-typeset.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const win = {};
vm.runInNewContext(readFileSync(join(REPO_ROOT, "assets/studio/typeset.js"), "utf8"), {
  window: win,
});
const T = win.StudioType;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const words = (html) =>
  [...html.matchAll(/<span class="sr-only">([^<]*)<\/span>/g)].map((m) => m[1]);
const stacked = (html) => (html.match(/class="frac"/g) || []).length;

/* ---- fractions: typeset, with the right words -------------------------------------------------------------------- */
assert.deepEqual(words(T.frac("What is 6 ÷ 1/2?")), ["one half"]);
assert.deepEqual(words(T.frac("3/4 of an hour")), ["three fourths"]);
assert.deepEqual(words(T.frac("Add 2 1/3 and 5/8")), ["two and one third", "five eighths"]);
assert.deepEqual(words(T.frac("13/100")), ["thirteen hundredths"]);
assert.deepEqual(words(T.frac("5/17")), ["five over seventeen"]);
assert.deepEqual(words(T.frac("2/1", "es")), ["dos sobre uno"]);
assert.match(
  T.frac("1/12", "both"),
  /<span class="t-en">one twelfth<\/span><span class="t-es" lang="es">un doceavo<\/span>/,
);
assert.deepEqual(words(T.frac("1/4", "es")), ["un cuarto"]);
assert.deepEqual(words(T.frac("2/3 y 1 1/2", "es")), ["dos tercios", "uno y un medio"]);
assert.match(
  T.frac("1/4"),
  /aria-hidden="true"><span class="frac-n">1<\/span><span class="frac-d">4<\/span>/,
);

/* ---- never typeset: dates, decimals, units, longer runs, a zero denominator -------------------------------------- */
for (const plain of [
  "Due 10/21/2026.",
  "Speed in km/h",
  "$3/lb",
  "2.5/3 is not a fraction here",
  "1/2.5",
  "x/0 and 4/0",
  "a ratio 3:4",
]) {
  const out = T.frac(plain);
  assert.equal(stacked(out), 0, `${plain} stays plain`);
  assert.equal(out, plain, `${plain} is unchanged`);
}

/* ---- context vs ask ------------------------------------------------------------------------------------------- */
const split = (t) => T.lastSentence(t);
const a =
  "The dot plot shows how many sea stars were found in each of 10 tide pools. How many tide pools had exactly 5 sea stars?";
assert.equal(a.slice(split(a)), "How many tide pools had exactly 5 sea stars?");
// a single sentence, a short stem, and an earlier question all fall back to the text as written
assert.equal(split("What is 6 ÷ 1/2?"), -1);
assert.equal(split("Which quadrant is the point (−4, 5) in? Explain how you know."), -1);
// titles and decimals are not sentence ends; a unit closing a sentence is
assert.equal(split("Mr. Lee buys 2.5 pounds of apples at $1.20 per pound for the class."), -1);
const u = "A rectangular prism has l = 7 ft, w = 2 ft, h = 3 ft. What is the volume?";
assert.equal(u.slice(split(u)), "What is the volume?");
const b = "Ms. Ruiz drives 3.5 miles to school each day. How far does she drive in 5 days?";
assert.equal(b.slice(split(b)), "How far does she drive in 5 days?");
// Spanish questions open with ¿
const c =
  "Una receta usa 2 tazas de harina por cada 3 tazas de leche. ¿Cuánta harina se usa con 9 tazas de leche?";
assert.equal(c.slice(split(c)), "¿Cuánta harina se usa con 9 tazas de leche?");

const html = T.stem(a, c, esc);
assert.match(
  html,
  /^<span class="q-context">The dot plot[^<]*<\/span> <span class="q-ask">How many tide pools/,
);
assert.match(
  html,
  /<span class="es-text" lang="es"><span class="q-context">Una receta[\s\S]*<span class="q-ask">¿Cuánta harina/,
);
assert.equal(
  T.stem("What is 6 ÷ 1/2?", "", esc).includes("q-ask"),
  false,
  "a one-sentence stem is not split",
);
assert.ok(
  T.stem("What is 6 ÷ 1/2?", "", esc).includes("one half"),
  "an unsplit stem is still typeset",
);
// escaping happens before typesetting: markup in a stem never becomes markup
assert.ok(
  !T.stem("<b>1/2</b> is half of one whole thing in this story. What is it?", "", esc).includes(
    "<b>",
  ),
);

console.log(
  "studio typeset: fractions stack with spoken words (EN/ES), dates/units/decimals stay plain, stems split only when clean.",
);
