#!/usr/bin/env node
/* =============================================================================
 * validate-family-spanish: the Spanish of the family homework follows the style guide, everywhere it is written
 * and everywhere it is shown. Contract: docs/family-homework-v3/es-style-guide.md.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * Only the v3 blocks were authored against the guide. The older sidecar prose, the data/homework-*-spanish.json files and
 * the generators still mixed registers (a grown-up told "Escucha" next to "Pregunten"), named the whole three ways
 * ("el total", "el entero", "el todo"), spaced percents ("60 %"), left English words in Spanish answer choices
 * ("Subtract 3/4 from 2 1/2", "the apple color") and called a quiz a "quiz". Nothing read the Spanish as a whole.
 *
 * RULES (each one is self-tested on fixtures first)
 *   REGISTER   never usted / vos / vosotros; an ADULT line (grown-up tips, kitchen table, bridge, corner mission, try-
 *              together) uses ustedes and no tu/te/ti; a STUDENT line (steps, hints, say-this lines, practice) uses tú;
 *              quoted speech to the child is exempt; one line never mixes tú and ustedes imperatives
 *   TERM       the whole = "el total" (never "el entero" for a part-whole whole, never "el todo"); one Spanish term per
 *              vocabulary word, from data/family-glossary.json
 *   FORMAT     percent has no space ("60%")
 *   LABELS     no doubled label ("Parte / Parte")
 *   LANGUAGE   no English words left inside Spanish text, no Spanglish ("quiz"), no literal idiom translations
 *   IDENTICAL  an English and Spanish pair may only be identical for numerals, symbols, units, names and the words listed
 *              as sameInSpanish in the glossary
 * SWEEPS: every authored Spanish string in data/ (sidecars incl. v3, the homework-*-spanish maps, family-*.json), the
 * Spanish literals of the homework generators, and the Spanish text of ALL generated lessons/<id>/homework.html pages.
 * A sweep that finds nothing FAILS: a gate that swept zero pages verified nothing.
 *
 * Lesson-owned Spanish (lessons/<id>/config.json, data/es-translations, data/part-two-*) that a page re-displays is held
 * to the hard rules (usted, voseo, English left in, doubled labels, idioms) but not to the TERM and FORMAT rules, which
 * are owned by those sources and reported as a count.
 *
 *   node tools/validate-family-spanish.mjs            the gate
 *   node tools/validate-family-spanish.mjs --report   also list lesson-owned findings
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withPlainDefinitions } from "../scripts/lib/family-plain-definitions.mjs";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";
import {
  collectDataSpanish,
  collectGeneratorSpanish,
  DETECTORS,
  englishHits,
  identicalAllowed,
  identicalCandidates,
  loadCognates,
  loadGlossary,
  pageSpanish,
  registerFindings,
} from "./lib/family-spanish.mjs";

const REPORT = process.argv.includes("--report");
const det = (id) => DETECTORS.find((d) => d.id === id);

/* ---------------------------------------------------------------- self-tests */

function selfTests() {
  const hits = (id, t) => det(id).test(t);
  // usted / voseo / vosotros
  assert.ok(hits("usted", "Pregunte a su estudiante qué hizo."));
  assert.ok(hits("usted", "Pida a su hijo que explique. Escuche la respuesta."));
  assert.ok(!hits("usted", "Pregunten a su estudiante qué hizo."));
  assert.ok(!hits("usted", "¿Cuál es el uso de la calculadora?"));
  assert.ok(hits("voseo", "Mirá el patrón."));
  assert.ok(
    !hits(
      "voseo",
      "Dibujé un punto. Elegí ___ como mi herramienta. Sombrea como decía el problema.",
    ),
  );
  assert.ok(hits("vosotros", "Vosotros podéis contar."));
  assert.ok(!hits("vosotros", "Dieciséis cuartos caben en 4. Hay seis."));
  // the whole
  assert.ok(hits("concept-term", "Multiplica la parte por el porcentaje para hallar el todo."));
  assert.ok(hits("concept-term", "Cuando falta el entero, divide."));
  assert.ok(hits("concept-term", "Una parte es 3 del entero."));
  assert.ok(!hits("concept-term", "Cuando falta el total, divide."));
  assert.ok(!hits("concept-term", "Multiplica el entero por el denominador y suma el numerador."));
  assert.ok(
    !hits(
      "concept-term",
      "Halla el entero que viene justo después. Un número entero no tiene decimales.",
    ),
  );
  assert.ok(!hits("concept-term", "No cambia del todo. Casi todo de $81."));
  // percent, doubled label
  assert.ok(hits("percent-space", "El 60 % de 80"));
  assert.ok(hits("percent-space", "El 60 % de 80".replace(" ", " ")));
  assert.ok(!hits("percent-space", "El 60% de 80"));
  assert.ok(hits("doubled-label", "Parte / Parte"));
  assert.ok(!hits("doubled-label", "Parte / Total"));
  // English left in, Spanglish, idiom
  assert.ok(hits("english-left-in", "Resta 3/4 y Subtract the whole numbers"));
  assert.ok(hits("english-left-in", "Quiz de palabras"));
  assert.ok(hits("english-left-in", "Juega el quiz."));
  assert.ok(
    !hits("english-left-in", "Escucha \"benchmark percent\" y la frase 'Boys to girls = 12:8'."),
  );
  assert.ok(!hits("english-left-in", "Prueba de palabras. Usa 3 × 4 = 12."));
  assert.ok(hits("literal-idiom", "Para la mesa de la cocina."));
  assert.ok(!hits("literal-idiom", "Para pegar en el refri."));
  // register by audience (quotes exempt)
  assert.ok(registerFindings("4-3.watchFor[0].es", "Escucha la palabra estimar.").length > 0);
  assert.ok(
    registerFindings("4-3.watchFor[0].es", "Pida a tu estudiante que te cuente.").length > 0,
  );
  assert.equal(registerFindings("4-3.watchFor[0].es", "Escuchen la palabra estimar.").length, 0);
  assert.equal(
    registerFindings("4-3.watchFor[1].es", 'Pregunten "¿Qué contaste primero?" antes de decidir.')
      .length,
    0,
  );
  assert.ok(registerFindings("4-3.conceptSteps[0].es", "Dibujen la recta numérica.").length > 0);
  assert.equal(registerFindings("4-3.conceptSteps[0].es", "Dibuja la recta numérica.").length, 0);
  assert.equal(
    registerFindings("4-3.v3.confused[0].coach.es", "Dibujen la recta. ¿Cuántas filas hay?").length,
    0,
  );
  assert.ok(
    registerFindings("x.v3.kitchenTable.es", "Escriban un precio. Mira la etiqueta.").length > 0,
  );
  // identical EN/ES
  const cog = new Set(["total", "base"]);
  assert.ok(identicalAllowed("35 cm²", "35 cm²", cog));
  assert.ok(!identicalAllowed("About 20", "About 20", cog));
  assert.ok(identicalAllowed("Total", "Total", cog));
  assert.ok(identicalAllowed("A = ½ × b × h", "A = ½ × b × h", cog));
  assert.ok(!identicalAllowed("the apple color", "the apple color", cog));
  assert.ok(!identicalAllowed("Subtract 12", "Subtract 12", cog));
  assert.deepEqual(
    [...identicalCandidates({ choices: ["a", "b"], choicesEs: ["a", "c"] })].length,
    2,
  );
  // English-word counter
  assert.deepEqual(englishHits("Una buena respuesta usa: divide, multiply, subtract."), [
    "multiply",
    "subtract",
  ]);
  // page extractor: a Spanish node, a nested English switch, script and style skipped, a *-es class
  const page = `<p><span class="lang-en">Add the parts</span><span class="lang-es" lang="es">Suma las partes</span></p>
    <div lang="es"><b>Hola</b> <span lang="en">hello</span> mundo</div><style>.lang-es{}</style>
    <script>var t = "no es";</script><span class="vocab-es">Razón</span><span class="chip">English</span>`;
  const got = pageSpanish(page).map((n) => n.text);
  assert.deepEqual(got, ["Suma las partes", "Hola", "mundo", "Razón"]);
}

/* ------------------------------------------------------------------- sweeps */

const failures = [];
const note = (rule, where, text) => failures.push({ rule, where, text });

selfTests();

// 1. authored Spanish in data/ (sidecars incl. v3 blocks)
const data = collectDataSpanish();
for (const r of data) {
  for (const d of DETECTORS) if (d.test(r.text)) note(d.id, `${r.file}:${r.path}`, r.text);
  for (const msg of registerFindings(r.path, r.text))
    note("register", `${r.file}:${r.path}`, `${msg} | ${r.text}`);
}

// 2. identical English / Spanish pairs
const cognates = loadCognates();
const MAPS = [
  "data/homework-choices-spanish.json",
  "data/homework-feedback-spanish.json",
  "data/homework-starters-spanish.json",
  "data/homework-table-spanish.json",
  "data/family-game-pairs-es.json",
  "data/family-homework-titles-es.json",
];
let pairs = 0;
const jsonDirs = [
  "data/family-homework-notes",
  "data/family-case-file",
  "data/family-word-problems",
];
const jsonFiles = [
  ...jsonDirs.flatMap((d) =>
    readdirSync(join(REPO_ROOT, d))
      .filter((n) => n.endsWith(".json"))
      .map((n) => `${d}/${n}`),
  ),
  "data/family-landing-units.json",
  "data/family-homework-ladder.json",
  "data/homework-confused-grownup-tags.json",
];
for (const f of jsonFiles) {
  for (const c of identicalCandidates(JSON.parse(readFileSync(join(REPO_ROOT, f), "utf8")), f)) {
    pairs++;
    if (c.en.trim() === c.es.trim() && !identicalAllowed(c.en, c.es, cognates))
      note("identical", c.path, c.en);
  }
}
for (const f of MAPS) {
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(join(REPO_ROOT, f), "utf8")))) {
    if (typeof v !== "string" || k.startsWith("_") || k.startsWith("$")) continue;
    pairs++;
    if (k.trim() === v.trim() && !identicalAllowed(k, v, cognates))
      note("identical", `${f}["${k.slice(0, 40)}"]`, k);
  }
}

// 3. Spanish literals in the generators
const literals = collectGeneratorSpanish();
for (const r of literals) for (const d of DETECTORS) if (d.test(r.text)) note(d.id, r.path, r.text);

// 4. the generated pages
const ids = listLessonDirs().filter((d) => existsSync(lessonPath(d, "homework.html")));
let nodes = 0;
let lessonOwned = 0;
const owned = new Set();
const addOwned = (o) => {
  if (typeof o === "string") {
    if (o.length > 12) owned.add(o.trim());
  } else if (Array.isArray(o)) o.forEach(addOwned);
  else if (o && typeof o === "object") Object.values(o).forEach(addOwned);
};
const TERM_RULES = new Set(["concept-term", "percent-space", "english-left-in"]);
const pageFindings = [];
for (const id of ids) {
  const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
  for (const n of pageSpanish(html)) {
    nodes++;
    for (const d of DETECTORS)
      if (d.test(n.text)) pageFindings.push({ id, rule: d.id, text: n.text });
  }
}
if (pageFindings.some((f) => TERM_RULES.has(f.rule))) {
  for (const f of [
    "data/part-two-session2-practice.json",
    ...readdirSync(join(REPO_ROOT, "data/es-translations")).map((n) => `data/es-translations/${n}`),
  ])
    if (f.endsWith(".json") && existsSync(join(REPO_ROOT, f)))
      addOwned(JSON.parse(readFileSync(join(REPO_ROOT, f), "utf8")));
  for (const id of new Set(pageFindings.filter((f) => TERM_RULES.has(f.rule)).map((f) => f.id))) {
    const cfg = lessonPath(id, "config.json");
    if (existsSync(cfg)) addOwned(JSON.parse(readFileSync(cfg, "utf8")));
  }
}
const stripPrefix = (t) => t.replace(/^✏️ Dibuja tu modelo: /, "").trim();
const isOwned = (t) =>
  owned.has(t.trim()) ||
  owned.has(stripPrefix(t)) ||
  [...owned].some((o) => o.length > 20 && t.includes(o));
const ownedFindings = [];
for (const f of pageFindings) {
  if (TERM_RULES.has(f.rule) && isOwned(f.text)) {
    lessonOwned++;
    ownedFindings.push(f);
  } else note(f.rule, `lessons/${f.id}/homework.html`, f.text);
}

// 5. one Spanish term per vocabulary word
const glossary = loadGlossary();
const gTerms = Object.entries(glossary.terms);
const seen = new Map();
let vocabItems = 0;
const checkVocab = (list, lesson, src) => {
  for (const item of withPlainDefinitions(list, lesson)) {
    if (!item?.term || !item.termEs) continue;
    vocabItems++;
    const key = item.term.toLowerCase().trim();
    const entry = gTerms.find(([name]) => name.toLowerCase().trim() === key)?.[1];
    if (!entry?.termEs) continue;
    const ok = [entry.termEs, ...(entry.alsoEs || [])].map((x) => x.toLowerCase());
    if (!ok.includes(item.termEs.toLowerCase().trim()) && !(entry.senses || []).length)
      note(
        "glossary-term",
        `${src}:${lesson}`,
        `"${item.term}" is "${item.termEs}", the glossary term is "${entry.termEs}"`,
      );
    seen.set(key, (seen.get(key) ?? new Set()).add(item.termEs.toLowerCase().trim()));
  }
};
for (const f of readdirSync(join(REPO_ROOT, "data/family-homework-notes")).filter((n) =>
  n.endsWith(".json"),
)) {
  const d = JSON.parse(readFileSync(join(REPO_ROOT, "data/family-homework-notes", f), "utf8"));
  checkVocab(d.vocabulary || [], f.replace(".json", ""), "sidecar");
}
for (const id of ids) {
  const cfgPath = lessonPath(id, "config.json");
  if (existsSync(cfgPath))
    checkVocab(JSON.parse(readFileSync(cfgPath, "utf8")).vocabulary || [], id, "config");
}
for (const [name, e] of gTerms) {
  if (e.termEs && /\d\s%/.test(e.termEs)) note("percent-space", `glossary:${name}`, e.termEs);
}

/* ------------------------------------------------------------------- verdict */

// a sweep of zero is a failure
const FLOORS = [
  ["authored Spanish strings", data.length, 20000],
  ["EN/ES pairs", pairs, 10000],
  ["generator literals", literals.length, 1000],
  ["homework pages", ids.length, 160],
  ["Spanish text nodes", nodes, 100000],
  ["vocabulary items", vocabItems, 1000],
];
for (const [label, n, min] of FLOORS)
  if (n < min) note("sweep", label, `only ${n} swept (expected at least ${min})`);

const byRule = new Map();
for (const f of failures) (byRule.get(f.rule) ?? byRule.set(f.rule, []).get(f.rule)).push(f);
const summary = `${data.length} Spanish strings, ${pairs} EN/ES pairs, ${literals.length} generator literals, ${ids.length} pages / ${nodes} Spanish text nodes, ${vocabItems} vocabulary items`;
if (REPORT && ownedFindings.length) {
  console.log(`lesson-owned (term/format) findings shown on pages: ${ownedFindings.length}`);
  for (const f of ownedFindings.slice(0, 40))
    console.log(`  ${f.id} [${f.rule}] ${f.text.slice(0, 120)}`);
}
if (failures.length) {
  console.error(`FAIL validate:family-spanish: ${failures.length} finding(s) over ${summary}`);
  for (const [rule, list] of byRule) {
    const why = DETECTORS.find((d) => d.id === rule)?.why ?? "";
    console.error(`\n  ${rule} (${list.length}) ${why}`);
    for (const f of list.slice(0, 6))
      console.error(`    ${f.where}\n      ${String(f.text).slice(0, 160)}`);
    if (list.length > 6) console.error(`    ... and ${list.length - 6} more`);
  }
  process.exit(1);
}
console.log(
  `family spanish: ${summary}; ${lessonOwned} lesson-owned term/format finding(s) on pages are reported, not failed; the self-tests passed first`,
);
