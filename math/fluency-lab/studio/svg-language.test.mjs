// The words inside a studio picture follow the language, the way its caption does. Spanish mode used to show
// "hundreds / tens / ones", "Percent", "Count", "feet" ... inside the drawings under Spanish captions, because
// engines baked their labels in English when the frame was built. A label is now drawn in both languages
// (core.js txt / bilingualText) and studio.css shows the one matching <html lang>; svgIn() is that same
// selection as a pure function.
//
// For every engine, for generated items of all skills, this reads every picture a learner can see (each
// representation's frames, the help frames and the Build's first state) as a Spanish reader sees it and fails on
// any word that only the ENGLISH pictures use. The vocabulary is derived from the English pictures themselves, so
// a new English label is caught without a list to maintain. Spanish and English must also carry the same numbers
// and math symbols. The worded-steps fallback (engine "steps") is excluded on purpose: it draws the lab's
// English step text and its caption says so.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { ENGINES, framesOf, lessonFor, repsOf } from "./engines.js";
import { svgIn } from "./core.js";

const ITEMS_PER_SKILL = 60;
// Words written the same in both languages: symbols and abbreviations, not English words.
const SHARED = new Set(["q1", "q3", "cm", "ii", "iii", "iv", "mm", "km", "kg"]);

const unesc = (t) =>
  t.replaceAll("&quot;", '"').replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
const labels = (svg) => [...String(svg).matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => unesc(m[1]));
const wordsOf = (text) => (text.toLowerCase().match(/\p{L}{2,}/gu) || []).filter((w) => !SHARED.has(w));
const numbersOf = (texts) => texts.flatMap((t) => t.match(/\d+(?:\.\d+)?/g) || []).sort();
const symbolsOf = (texts) => texts.flatMap((t) => t.match(/[−×÷=+%<>²√π]/g) || []).sort();

// Every picture a learner can open for one item: frames of each representation (help frames are drawn from these)
// and the Build model's first state.
function pictures(lesson) {
  const out = [];
  for (const rep of repsOf(lesson)) for (const f of framesOf(lesson, rep)) out.push({ where: `${rep}/${f.id}`, svg: f.svg });
  const b = lesson.engine.build;
  if (b && (!b.available || b.available(lesson.spec))) {
    const r = b.render(b.init(lesson.spec), lesson.spec);
    if (r?.svg) out.push({ where: "build", svg: r.svg });
  }
  return out;
}

const seen = [];
const perEngine = Object.fromEntries(Object.keys(ENGINES).map((id) => [id, 0]));
let skills = 0;
for (const skill of ALL_SKILLS) {
  skills += 1;
  const rng = seededRandom(1234 + skill.grade * 97 + skill.id.length);
  for (let n = 0; n < ITEMS_PER_SKILL; n += 1) {
    const item = generateProblem(skill, rng);
    const lesson = lessonFor(item);
    if (!lesson?.modeled) continue;
    for (const p of pictures(lesson)) {
      perEngine[lesson.engine.id] += 1;
      seen.push({ ...p, engine: lesson.engine.id, skill: `${skill.grade}:${skill.id}`, q: item.question });
    }
  }
}

// The English vocabulary of the pictures, and the Spanish one.
const english = new Set();
const spanish = new Set();
for (const p of seen) {
  for (const t of labels(svgIn(p.svg, "en"))) for (const w of wordsOf(t)) english.add(w);
  for (const t of labels(svgIn(p.svg, "es"))) for (const w of wordsOf(t)) spanish.add(w);
}
// A word both vocabularies share is legitimate only when it is Spanish too ("total", "no"). Listed, so a new
// overlap has to be looked at rather than absorbed.
const BOTH = new Set(["total"]);
const forbidden = new Set([...english].filter((w) => !BOTH.has(w)));

function problemsOf(svg) {
  const en = labels(svgIn(svg, "en"));
  const es = labels(svgIn(svg, "es"));
  const out = [];
  for (const t of es) {
    const bad = wordsOf(t).filter((w) => forbidden.has(w));
    if (bad.length) out.push(`English label in Spanish picture: "${t}" (${bad.join(", ")})`);
  }
  if (numbersOf(en).join(" ") !== numbersOf(es).join(" "))
    out.push(`numbers differ: en [${numbersOf(en).join(" ")}] es [${numbersOf(es).join(" ")}]`);
  if (symbolsOf(en).join("") !== symbolsOf(es).join(""))
    out.push(`math symbols differ: en "${symbolsOf(en).join("")}" es "${symbolsOf(es).join("")}"`);
  return out;
}

// ---------- Negative controls: the detector must fire on exactly the defects it exists for. ----------
const sample = seen.find((p) => p.engine === "place");
assert.ok(sample, "a place-value picture to plant defects in");
assert.deepEqual(problemsOf(sample.svg), [], "the place-value sample is clean before planting");
assert.ok(forbidden.has("hundreds") || forbidden.has("tens"), "place names are in the derived English vocabulary");
const planted = sample.svg.replace("</svg>", '<text x="1" y="1">hundreds</text></svg>');
assert.ok(
  problemsOf(planted).some((m) => m.includes("English label") && m.includes("hundreds")),
  "a planted English label in a Spanish picture is caught",
);
const plantedEs = sample.svg.replace("</svg>", '<text class="sd-l-es" x="1" y="1">tens</text></svg>');
assert.ok(problemsOf(plantedEs).some((m) => m.includes("tens")), "an English word tagged as Spanish is caught");
const plantedNumber = sample.svg.replace("</svg>", '<text class="sd-l-es" x="1" y="1">7</text></svg>');
assert.ok(problemsOf(plantedNumber).some((m) => m.startsWith("numbers differ")), "a number only in Spanish is caught");
const plantedSign = sample.svg.replace("</svg>", '<text class="sd-l-es" x="1" y="1">-</text><text class="sd-l-en" x="1" y="1">−</text></svg>');
assert.ok(problemsOf(plantedSign).some((m) => m.startsWith("math symbols differ")), "a hyphen for a true minus is caught");

// ---------- The sweep ----------
assert.equal(skills, ALL_SKILLS.length);
assert.ok(ALL_SKILLS.length >= 128, `all skills swept (${ALL_SKILLS.length})`);
const silent = Object.entries(perEngine).filter(([, n]) => n === 0).map(([id]) => id);
assert.deepEqual(silent, [], `every engine drew at least one picture; none from: ${silent.join(", ")}`);
assert.ok(forbidden.size >= 20, `the English picture vocabulary is real (${forbidden.size} words)`);

const failures = [];
for (const p of seen) for (const m of problemsOf(p.svg)) failures.push(`${p.engine} ${p.skill} ${p.where} "${p.q}": ${m}`);
assert.deepEqual([...new Set(failures)].slice(0, 25), [], `${failures.length} Spanish picture problems`);

// The mechanism the browser uses: the stylesheet hides the other language's labels.
const css = readFileSync(new URL("./studio.css", import.meta.url), "utf8");
assert.match(css, /html\[lang\^="es"\] \.sd-l-en, html:not\(\[lang\^="es"\]\) \.sd-l-es \{ display: none; \}/);

console.log(
  `svg-language: ${seen.length} pictures from ${skills} skills across ${Object.keys(perEngine).length} engines; ` +
    `${forbidden.size} English label words, ${spanish.size} Spanish; 0 English labels in Spanish, numbers and symbols match`,
);
