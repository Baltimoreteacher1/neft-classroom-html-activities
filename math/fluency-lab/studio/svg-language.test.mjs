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
import { svgAlt, svgIn } from "./core.js";
import { eqIn } from "./eq-language.js";
import { SIMS } from "./sims.js";

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
  for (const rep of repsOf(lesson)) for (const f of framesOf(lesson, rep)) out.push({ where: `${rep}/${f.id}`, svg: f.svg, eq: f.eq, alt: f.alt });
  const b = lesson.engine.build;
  if (b && (!b.available || b.available(lesson.spec))) {
    const r = b.render(b.init(lesson.spec), lesson.spec);
    if (r?.svg) out.push({ where: "build", svg: r.svg, alt: r.alt });
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

// ---------- The equation line under a picture (eqIn) and the picture's text description (svgAlt) ----------
// Both are shown with the picture, so both follow the language. The English vocabulary of the equation lines is
// derived from the lines themselves; a word of it that survives into a Spanish line must be listed as one both
// languages write the same way, so a new English notation word cannot slip through unnoticed.
const eqWords = (text) => text.match(/[A-Za-z]{2,}/g) || [];
const SAME_EQ = new Set(["no", "total", "min", "cm", "II", "III", "IV"]);
const englishEq = new Set(seen.flatMap((p) => (typeof p.eq === "string" ? eqWords(p.eq) : [])));
const eqProblems = (eq) => {
  if (typeof eq !== "string" || !eq) return [];
  const es = eqIn(eq, "es");
  const out = eqWords(es).filter((w) => englishEq.has(w) && !SAME_EQ.has(w)).map((w) => `English word "${w}" in Spanish equation "${es}"`);
  if (numbersOf([eq]).join(" ") !== numbersOf([es]).join(" ")) out.push(`numbers differ: "${eq}" -> "${es}"`);
  if (symbolsOf([eq]).join("") !== symbolsOf([es]).join("")) out.push(`symbols differ: "${eq}" -> "${es}"`);
  if (eqIn(eq, "en") !== eq) out.push(`English equation changed: "${eq}"`);
  return out;
};
assert.equal(eqIn("LCM(10, 5) = 10", "es"), "mcm(10, 5) = 10");
assert.equal(eqIn("GCF(9, 42)", "es"), "MCD(9, 42)");
assert.equal(eqIn("slope = rise ÷ run", "es"), "pendiente = subida ÷ avance");
assert.equal(eqIn("most votes: apples", "es"), "más votos: manzanas");
assert.equal(eqIn("2(8×10 + 8×2 + 10×2) = 232 in²", "es"), "2(8×10 + 8×2 + 10×2) = 232 pulg²");
assert.equal(eqIn("LCM(10, 5) = 10", "en"), "LCM(10, 5) = 10");
assert.ok(englishEq.has("GCF") && englishEq.has("slope") && englishEq.size >= 30, `the English equation vocabulary is real (${englishEq.size} words)`);
assert.ok(eqProblems("LCM(10, 5) = 10").length === 0, "a translated equation line is clean");
const untranslated = eqProblems("quadrant I").length === 0 && eqProblems("reflect (3, 5)").length === 0;
assert.ok(untranslated, "known lines translate completely");
{
  const saved = englishEq.has("zzzword");
  englishEq.add("zzzword");
  assert.ok(eqProblems("zzzword = 4").some((m) => m.includes("zzzword")), "an English word left in a Spanish equation is caught");
  if (!saved) englishEq.delete("zzzword");
}
const aloud = (svg) => unesc(String(svg).match(/<svg\b[^>]*?\baria-label="([^"]*)"/)?.[1] ?? "");
const altProblems = (p, lang) => {
  if (!p.alt) return [];
  const want = p.alt[lang];
  const got = aloud(svgAlt(p.svg, p.alt, lang));
  const out = got === want ? [] : [`${lang} description is "${got}", wanted "${want}"`];
  if (lang === "es" && /\p{L}/u.test(p.alt.en) && p.alt.en === p.alt.es) out.push(`Spanish description is the English one: "${p.alt.es}"`);
  return out;
};
{
  const withAlt = seen.find((p) => p.alt && p.alt.en !== p.alt.es);
  assert.ok(withAlt, "a picture with a different description in each language");
  assert.equal(aloud(withAlt.svg), withAlt.alt.en, "the built picture describes itself in English");
  assert.deepEqual(altProblems(withAlt, "es"), [], "the Spanish description follows the language");
  assert.ok(altProblems({ ...withAlt, alt: { en: withAlt.alt.en, es: withAlt.alt.en } }, "es").length > 0, "an English description under Spanish is caught");
}
const eqFailures = [];
const altFailures = [];
let eqLines = 0;
let described = 0;
for (const p of seen) {
  if (typeof p.eq === "string" && p.eq) eqLines += 1;
  for (const m of eqProblems(p.eq)) eqFailures.push(`${p.engine} ${p.skill} ${p.where}: ${m}`);
  if (p.alt) described += 1;
  for (const lang of ["en", "es"]) for (const m of altProblems(p, lang)) altFailures.push(`${p.engine} ${p.skill} ${p.where}: ${m}`);
}
assert.deepEqual([...new Set(eqFailures)].slice(0, 25), [], `${eqFailures.length} Spanish equation-line problems`);
assert.deepEqual([...new Set(altFailures)].slice(0, 25), [], `${altFailures.length} picture-description problems`);
assert.ok(eqLines > 5000 && described > 5000, `the sweep covered ${eqLines} equation lines and ${described} descriptions`);

// ---------- The Explore simulators (sims.js) and the shared learning-lab models they draw ----------
// A simulator draws for one language at a time (`state.lang`), and three of them draw through shared models that write
// English. Every simulator is rendered at its start, with each slider at its minimum and at its maximum, in both
// languages; the English vocabulary comes from the English renderings, so a new English label is caught without a
// list. The description and the one-line reading must differ between the languages too.
const simStates = (sim) => {
  const base = sim.init();
  const states = [base];
  for (const slider of sim.sliders(base)) {
    for (const value of [slider.min, slider.max]) states.push({ ...base, [slider.key]: value });
  }
  return states;
};
const simPictures = [];
for (const [id, sim] of Object.entries(SIMS)) {
  for (const state of simStates(sim)) {
    const en = sim.render({ ...state, lang: "en" });
    const es = sim.render({ ...state, lang: "es" });
    simPictures.push({ id, en, es, state });
  }
}
const simEnglish = new Set();
for (const p of simPictures) for (const t of labels(svgIn(p.en.svg, "en"))) for (const w of wordsOf(t)) simEnglish.add(w);
// Words written the same in both languages in these pictures. "plan" is the Function Food Fair's "Plan A / Plan B"; "base" heads the percent tape.
const SIM_BOTH = new Set(["total", "plan", "base"]);
const simProblems = ({ id, en, es, state }) => {
  const out = [];
  for (const t of labels(svgIn(es.svg, "es"))) {
    const bad = wordsOf(t).filter((w) => simEnglish.has(w) && !SIM_BOTH.has(w));
    if (bad.length) out.push(`${id}: English label in Spanish picture: "${t}" (${bad.join(", ")})`);
  }
  const eN = numbersOf(labels(svgIn(en.svg, "en")));
  const sN = numbersOf(labels(svgIn(es.svg, "es")));
  if (eN.join(" ") !== sN.join(" ")) out.push(`${id}: picture numbers differ: en [${eN.join(" ")}] es [${sN.join(" ")}]`);
  for (const field of ["alt", "read"]) {
    const pair = { en: field === "alt" ? en.alt : en.read, es: field === "alt" ? es.alt : es.read };
    const [e, s] = [pair.en, pair.es].map((v) => (v && typeof v === "object" ? v : { en: v, es: v }));
    if (!e.en || !s.es) out.push(`${id}: no ${field} text`);
    else if (s.es === s.en && /\p{L}{3,}/u.test(s.en)) out.push(`${id}: ${field} is English in Spanish`);
  }
  return out;
};
{
  const percent = simPictures.find((p) => p.id === "percentWhole");
  assert.deepEqual(simProblems(percent), [], "the percent simulator is clean before planting");
  const planted = { ...percent, es: { ...percent.es, svg: percent.es.svg.replace("</svg>", '<text x="1" y="1">Percent</text></svg>') } };
  assert.ok(simProblems(planted).some((m) => m.includes("Percent")), "an English label planted in a Spanish simulator picture is caught");
  assert.ok(simEnglish.has("percent") && simEnglish.has("amount") && simEnglish.has("tape"), "the shared models' English words are in the vocabulary");
}
const simFailures = simPictures.flatMap(simProblems);
assert.deepEqual([...new Set(simFailures)].slice(0, 25), [], `${simFailures.length} Spanish simulator problems`);
assert.equal(new Set(simPictures.map((p) => p.id)).size, Object.keys(SIMS).length, "every simulator was swept");

// The mechanism the browser uses: the stylesheet hides the other language's labels.
const css = readFileSync(new URL("./studio.css", import.meta.url), "utf8");
assert.match(css, /html\[lang\^="es"\] \.sd-l-en, html:not\(\[lang\^="es"\]\) \.sd-l-es \{ display: none; \}/);

console.log(
  `svg-language: ${seen.length} pictures from ${skills} skills across ${Object.keys(perEngine).length} engines; ` +
    `${forbidden.size} English label words, ${spanish.size} Spanish; 0 English labels in Spanish, numbers and symbols match; ` +
    `${eqLines} equation lines and ${described} descriptions follow the language; ` +
    `${Object.keys(SIMS).length} simulators in ${simPictures.length} states clean`,
);
