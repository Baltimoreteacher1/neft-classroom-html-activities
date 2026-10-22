/**
 * Family word problems (data/family-word-problems/<lesson>.json):
 * - the arithmetic is re-derived here, independently of the generator, and must match the answers it prints;
 * - each stem states the numbers the problem declares, in both languages;
 * - the page on disk is what the generator would write, and the lesson's family guide links to it.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { solve, wordProblemsPage } from "../scripts/lib/family-word-problems.mjs";
import { homeworkChrome } from "../scripts/lib/homework-chrome.mjs";
import { isGeneratedFresh } from "../scripts/lib/preserve-injected.mjs";
import { DATA_DIR, lessonPath } from "./lib/curriculum-source.mjs";

const dir = join(DATA_DIR, "family-word-problems");
const sets = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
const problems = sets.flatMap((s) =>
  s.groups.flatMap((g) => g.problems.map((p) => ({ lesson: s.lessonId, ...p }))),
);

const numbersIn = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const lastLine = (p, lang) => solve(p, lang).at(-1);

test("there is at least one set, with problems", () => {
  assert.ok(sets.length >= 1);
  assert.ok(problems.length >= 9);
});

test("every problem is bilingual (English and Spanish only) and Spanish is not a copy", () => {
  for (const p of problems) {
    for (const field of ["stem", "ask", "hint"]) {
      assert.deepEqual(Object.keys(p[field]).sort(), ["en", "es"], `${p.id}.${field} languages`);
      assert.notEqual(p[field].es, p[field].en, `${p.id}.${field} Spanish is a copy`);
      assert.ok(p[field].es.length > 10, `${p.id}.${field} Spanish is empty`);
    }
  }
});

test("percent-of answers equal an independent recomputation", () => {
  for (const p of problems.filter((q) => q.kind === "percent-of")) {
    const expected = (p.percent * p.whole) / 100;
    for (const lang of ["en", "es"])
      assert.ok(
        numbersIn(lastLine(p, lang)).includes(expected),
        `${p.id} ${lang}: ${lastLine(p, lang)}`,
      );
  }
});

test("discount answers state the savings and the sale price", () => {
  for (const p of problems.filter((q) => q.kind === "discount")) {
    const saved = (p.percent * p.price) / 100;
    for (const lang of ["en", "es"]) {
      const nums = numbersIn(lastLine(p, lang));
      assert.ok(
        nums.includes(saved) && nums.includes(p.price - saved),
        `${p.id} ${lang}: ${lastLine(p, lang)}`,
      );
    }
  }
});

test("deal answers compare savings and final prices correctly, never on a tie of final prices", () => {
  for (const p of problems.filter((q) => q.kind === "deal")) {
    assert.equal(p.options.length, 2, `${p.id} compares exactly two deals`);
    const rows = p.options.map((o) => ({
      saved: (o.percent * o.price) / 100,
      pay: o.price - (o.percent * o.price) / 100,
    }));
    assert.notEqual(rows[0].pay, rows[1].pay, `${p.id} final prices tie`);
    for (const lang of ["en", "es"]) {
      const text = solve(p, lang).join("\n");
      for (const r of rows) {
        assert.ok(numbersIn(text).includes(r.saved), `${p.id} ${lang} lacks savings ${r.saved}`);
        assert.ok(numbersIn(text).includes(r.pay), `${p.id} ${lang} lacks price ${r.pay}`);
      }
      const cheaper = rows[0].pay < rows[1].pay ? p.options[0] : p.options[1];
      assert.ok(
        solve(p, lang).at(-1).includes(cheaper.name[lang]),
        `${p.id} ${lang} names the cheaper deal`,
      );
    }
  }
});

test("stems state the numbers the problem declares, in both languages", () => {
  for (const p of problems) {
    const declared =
      p.kind === "deal"
        ? p.options.flatMap((o) => [o.percent, o.price])
        : [p.percent, p.kind === "discount" ? p.price : p.whole];
    for (const lang of ["en", "es"]) {
      const stated = numbersIn(p.stem[lang]);
      for (const n of declared)
        assert.ok(stated.includes(n), `${p.id} ${lang} stem never says ${n}`);
    }
  }
});

test("percents stay inside what the lesson teaches: whole numbers from 5 to 100", () => {
  for (const p of problems) {
    const percents = p.kind === "deal" ? p.options.map((o) => o.percent) : [p.percent];
    for (const pct of percents)
      assert.ok(Number.isInteger(pct) && pct >= 5 && pct <= 100, `${p.id} percent ${pct}`);
  }
});

test("no timer language", () => {
  const text = JSON.stringify(sets);
  assert.doesNotMatch(text, /\b(timer|countdown|beat the clock|race the clock)\b/i);
});

test("each page is current and the family guide links to it", () => {
  for (const s of sets) {
    const out = lessonPath(s.lessonId, "family", "word-problems", "index.html");
    assert.ok(
      isGeneratedFresh(out, wordProblemsPage(s, homeworkChrome(s.lessonId))),
      `${s.lessonId} word-problems page is stale`,
    );
    const guide = readFileSync(lessonPath(s.lessonId, "family", "index.html"), "utf8");
    assert.ok(
      guide.includes(`/lessons/${s.lessonId}/family/word-problems/`),
      `${s.lessonId} guide does not link to its word problems`,
    );
    const html = readFileSync(out, "utf8");
    assert.match(
      html,
      new RegExp(`<html lang="en" data-unit="${Number.parseInt(s.lessonId, 10)}">`),
    );
  }
});

test("each page is dressed as its lesson's homework page", () => {
  for (const s of sets) {
    const chrome = homeworkChrome(s.lessonId);
    const html = readFileSync(
      lessonPath(s.lessonId, "family", "word-problems", "index.html"),
      "utf8",
    );
    const homework = readFileSync(lessonPath(s.lessonId, "homework.html"), "utf8");
    assert.ok(homework.includes(chrome.layer), "homework still loads the layer it is dressed with");
    for (const href of [chrome.base, chrome.layer])
      assert.ok(html.includes(href), `${s.lessonId} word problems lose ${href}`);
    assert.match(html, /<header class="hw-hero"/);
    assert.match(html, /data-lang-mode="es"/);
    assert.match(html, /hw_lang_mode/, "shares the homework language choice");
    assert.match(html, /class="problem-section card/);
  }
});
