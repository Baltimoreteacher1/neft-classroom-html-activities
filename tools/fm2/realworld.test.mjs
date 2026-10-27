// Real-world family math: shape, bilingual completeness, grade coverage, and every stated number recomputed with an
// independent evaluator. @fm2 FM-029 FM-020 FM-065
import assert from "node:assert/strict";
import { missingLanguages } from "../../math/fluency-lab/family/fm2/lang.js";
import { ACTIVITIES, forGrade, forSkill } from "../../math/fluency-lab/family/fm2/realworld.js";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const STRANDS = [
  "counting-place-value",
  "addition-subtraction",
  "multiplication-division",
  "fractions",
  "decimals",
  "ratios-percents",
  "patterns-algebra",
  "geometry-measure",
  "money",
  "number-line",
  "equations",
  "data",
];

// Independent arithmetic: only digits and + - * / ( ) . are allowed, then the host evaluates.
const evaluate = (expr) => {
  assert.match(expr, /^[0-9+\-*/().\s]+$/, `unsafe expression ${expr}`);
  return Function(`"use strict"; return (${expr});`)();
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasNumber = (text, n) => {
  const forms = [String(n), n.toFixed(2), n.toFixed(1), n.toLocaleString("en-US")];
  return forms.some((f) => new RegExp(`(?<![\\d.,])${esc(f)}(?![\\d]|\\.\\d|,\\d)`).test(text));
};
const textOf = (entry, lang) =>
  [
    entry.title[lang],
    ...entry.materials[lang],
    ...entry.steps[lang],
    entry.askThis[lang],
    entry.extension[lang],
  ].join(" ");

ok(ACTIVITIES.length >= 36, `at least 36 activities (${ACTIVITIES.length})`);
const ids = new Set();
for (const entry of ACTIVITIES) {
  ok(/^[a-z][a-z0-9-]+$/.test(entry.id) && !ids.has(entry.id), `unique kebab id ${entry.id}`);
  ids.add(entry.id);
  ok(
    Array.isArray(entry.grades) &&
      Number.isInteger(entry.grades[0]) &&
      Number.isInteger(entry.grades[1]) &&
      entry.grades[0] >= 0 &&
      entry.grades[1] <= 8 &&
      entry.grades[0] <= entry.grades[1],
    `${entry.id} grades`,
  );
  ok(
    Number.isInteger(entry.minutes) && entry.minutes >= 5 && entry.minutes <= 45,
    `${entry.id} minutes`,
  );
  ok(STRANDS.includes(entry.strand), `${entry.id} strand ${entry.strand}`);
  ok(
    missingLanguages(
      { title: entry.title, askThis: entry.askThis, extension: entry.extension },
      entry.id,
    ).length === 0,
    `${entry.id} bilingual text`,
  );
  for (const lang of ["en", "es"]) {
    ok(
      Array.isArray(entry.materials[lang]) &&
        entry.materials[lang].length >= 1 &&
        entry.materials[lang].every((s) => s.trim()),
      `${entry.id} materials ${lang}`,
    );
    ok(
      Array.isArray(entry.steps[lang]) &&
        entry.steps[lang].length >= 3 &&
        entry.steps[lang].length <= 6 &&
        entry.steps[lang].every((s) => s.trim().length > 10),
      `${entry.id} steps ${lang}`,
    );
    ok(entry.title[lang].length <= 60, `${entry.id} title length`);
    ok(!/[؀-ۿ一-鿿]/.test(textOf(entry, lang)), `${entry.id} only English and Spanish`);
  }
  ok(
    entry.materials.en.length === entry.materials.es.length &&
      entry.steps.en.length === entry.steps.es.length,
    `${entry.id} language parity`,
  );
  ok(
    entry.askThis.en !== entry.askThis.es &&
      entry.steps.en[0] !== entry.steps.es[0] &&
      entry.title.en !== entry.title.es,
    `${entry.id} Spanish is not a copy`,
  );
  ok(
    /\?$/.test(entry.askThis.en) && /^¿.*\?$/.test(entry.askThis.es),
    `${entry.id} askThis is a question in both languages`,
  );
}

// FM-029: the math in the text is right. Every fact is recomputed here and shows up in both languages.
let facts = 0;
for (const entry of ACTIVITIES) {
  ok(
    Array.isArray(entry.facts) && entry.facts.length >= 1,
    `${entry.id} states at least one checked fact`,
  );
  for (const fact of entry.facts) {
    const value = evaluate(fact.expr);
    ok(
      Math.abs(value - fact.value) < 1e-9,
      `${entry.id}: ${fact.expr} = ${value}, not ${fact.value}`,
    );
    for (const lang of ["en", "es"]) {
      const text = textOf(entry, lang);
      ok(
        fact.show ? text.includes(fact.show) : hasNumber(text, fact.value),
        `${entry.id} (${lang}) never states ${fact.show || fact.value} for ${fact.expr}`,
      );
    }
    facts += 1;
    if (entry.grades[1] <= 2)
      ok(
        Number.isInteger(value) && value >= 0 && value <= 200,
        `${entry.id}: K-2 numbers stay whole and small (${value})`,
      );
    if (entry.grades[1] <= 3) ok(value >= 0, `${entry.id}: no negative results below grade 4`);
  }
}

// Every "a op b = c" sentence printed in the steps is recomputed too, in both languages, so a wrong sum cannot hide
// behind a correct number that appears elsewhere in the entry.
const TERM = String.raw`\(?\s*-?\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?\s*\)?`;
const OP = String.raw`\s*[x+\-*\/]\s*`;
const SENTENCE = new RegExp(
  String.raw`(${TERM}(?:${OP}${TERM})+)\s*=\s*(\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?)`,
  "g",
);
const plain = (text) => text.replace(/[$,]/g, "").replace(/\bx\b/g, "*");
let sentences = 0;
for (const entry of ACTIVITIES) {
  for (const lang of ["en", "es"]) {
    for (const match of textOf(entry, lang).matchAll(SENTENCE)) {
      const left = evaluate(plain(match[1]));
      const right = evaluate(plain(match[2]));
      ok(
        Math.abs(left - right) < 1e-9,
        `${entry.id} (${lang}) states "${match[0]}" but ${match[1]} is ${left}`,
      );
      sentences += 1;
    }
  }
}
ok(sentences >= 100, `at least 100 arithmetic sentences were recomputed (${sentences})`);

// Hand-checked anchors, written out separately from the entries' own expressions.
const byId = Object.fromEntries(ACTIVITIES.map((e) => [e.id, e]));
const approx = (a, b) => Math.abs(a - b) < 1e-9;
ok(
  approx(12 * 10, 120) &&
    approx(2 * (12 + 10), 44) &&
    byId["tile-the-floor"].facts.some((f) => f.value === 120) &&
    byId["tile-the-floor"].facts.some((f) => f.value === 44),
  "tile floor anchors",
);
ok(
  approx(4.8 / 12, 0.4) &&
    approx(6.3 / 18, 0.35) &&
    byId["grocery-unit-price"].facts
      .map((f) => f.value)
      .sort()
      .join() === "0.35,0.4",
  "unit price anchors",
);
ok(
  byId["ladder-triangle"].facts.every((f) => f.value === 100) && 6 ** 2 + 8 ** 2 === 10 ** 2,
  "Pythagorean anchor",
);
ok(
  byId["gym-deal"].facts.some((f) => f.value === 2) && 10 + 20 * 2 === 25 * 2,
  "break-even anchor",
);

// Coverage: 4+ per grade, every strand present, helpers agree with an independent filter.
for (let grade = 0; grade <= 8; grade += 1) {
  const expected = ACTIVITIES.filter((e) => e.grades[0] <= grade && e.grades[1] >= grade).map(
    (e) => e.id,
  );
  ok(expected.length >= 4, `grade ${grade} has at least 4 activities (${expected.length})`);
  ok(
    JSON.stringify(forGrade(grade).map((e) => e.id)) === JSON.stringify(expected),
    `forGrade(${grade})`,
  );
  for (const strand of STRANDS) {
    const got = forSkill(strand, grade);
    ok(got.length >= 1, `forSkill(${strand}, ${grade}) never empty`);
    const exact = expected.filter((id) => byId[id].strand === strand);
    if (exact.length)
      ok(
        JSON.stringify(got.map((e) => e.id)) === JSON.stringify(exact),
        `forSkill exact match ${strand} ${grade}`,
      );
  }
}
ok(new Set(ACTIVITIES.map((e) => e.strand)).size === STRANDS.length, "every strand has activities");
ok(
  forSkill({ en: "Ratios and percents", es: "Razones y porcentajes" }, 7).every(
    (e) => e.strand === "ratios-percents",
  ),
  "forSkill accepts a {en, es} strand",
);
ok(
  forSkill("Fractions", 1).every((e) => e.strand === "fractions"),
  "forSkill accepts a strand title",
);
ok(forSkill("money", 8)[0].id === "change-maker", "falls back to the nearest grade in the strand");
ok(forSkill("not a strand at all", 3).length >= 1, "unknown strand still returns activities");
const copy = forGrade(3);
copy[0].title.en = "changed";
ok(
  ACTIVITIES.find((e) => e.id === copy[0].id).title.en !== "changed",
  "forGrade returns copies, not the shared entries",
);

console.log(
  `PASS realworld: ${ACTIVITIES.length} activities, ${facts} checked facts, ${sentences} recomputed sentences, ${checks} checks`,
);
