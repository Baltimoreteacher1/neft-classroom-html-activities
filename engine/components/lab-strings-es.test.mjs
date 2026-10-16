// Spanish for the Touch & Try labs (lab-strings-es.js).
//
// What this proves, and what it cannot:
//   * labT behaves in each page language, and never returns a blank.
//   * Every labT call in the labs matches a table entry word for word, and no
//     table entry is orphaned, so a copy edit cannot quietly lose its Spanish.
//   * Wrapping a lab's strings did not change one character of its English: each
//     patched lab is rendered through ~50 scripted interactions and fingerprinted
//     against lab-en-baseline.json, which was recorded from the UNPATCHED labs.
//   * In Spanish a patched lab draws Spanish.
//   * Spanish uses the site's math words and the tú form.
//   It does NOT prove the Spanish is good. No native speaker has read it; see
//   data/spanish-review-queue.json.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { fingerprint, labPaint, renderLabStates } from "./lab-render-harness.mjs";
import { LAB_KIND_FILES, LAB_STRINGS, labMode, labT } from "./lab-strings-es.js";
import { scanLabCalls } from "./lab-strings-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(HERE, name), "utf8");
const FIXTURES = JSON.parse(read("lab-render-fixtures.json"));
const BASELINE = JSON.parse(read("lab-en-baseline.json"));

/** Runs `fn` with the page in the given language, then restores the document. */
function inMode(mode, fn) {
  const { body, documentElement } = document;
  const before = { cls: body.className, lang: documentElement.lang };
  body.className = mode === "en" ? "" : `lang-mode-${mode}`;
  documentElement.lang = mode === "es" ? "es" : "en";
  try {
    return fn();
  } finally {
    body.className = before.cls;
    documentElement.lang = before.lang;
  }
}

await renderLabStates("power-builder", FIXTURES["power-builder"]); // installs the jsdom globals

const labSources = readdirSync(HERE)
  .filter((f) => f.endsWith(".js") && f !== "lab-strings-es.js")
  .map((f) => ({ file: f, source: read(f) }))
  .filter(({ source }) => /\blabT\(/.test(source));

test("labMode reads the homework body class, then <html lang>, and defaults to English", () => {
  assert.equal(labMode(), "en");
  assert.equal(inMode("es", labMode), "es");
  assert.equal(inMode("bilingual", labMode), "bilingual");
  document.documentElement.lang = "es";
  assert.equal(labMode(), "es", "a lesson page mirrors the saved choice onto <html lang>");
  document.documentElement.lang = "en";
  document.body.className = "lang-mode-en";
  document.documentElement.lang = "es";
  assert.equal(labMode(), "en", "an explicit English page beats a stale html lang");
  document.body.className = "";
  document.documentElement.lang = "en";
});

test("labT: English page -> English; Spanish page -> Spanish; bilingual -> both", () => {
  LAB_STRINGS["test.probe"] = ["Check {n} rows", "Comprueba {n} filas"];
  try {
    assert.equal(labT("test.probe", "Check {n} rows", { n: 3 }), "Check 3 rows");
    assert.equal(
      inMode("es", () => labT("test.probe", "Check {n} rows", { n: 3 })),
      "Comprueba 3 filas",
    );
    assert.equal(
      inMode("bilingual", () => labT("test.probe", "Check {n} rows", { n: 3 })),
      "Check 3 rows / Comprueba 3 filas",
    );
  } finally {
    delete LAB_STRINGS["test.probe"];
  }
});

test("labT: bilingual shows a string once when English and Spanish are the same text", () => {
  LAB_STRINGS["test.same"] = ["Divide: {a} ÷ {b}", "Divide: {a} ÷ {b}"];
  try {
    assert.equal(
      inMode("bilingual", () => labT("test.same", "Divide: {a} ÷ {b}", { a: 5, b: 2 })),
      "Divide: 5 ÷ 2",
    );
  } finally {
    delete LAB_STRINGS["test.same"];
  }
});

test("labT: a key with no Spanish falls back to the English, never to a blank", () => {
  for (const mode of ["en", "es", "bilingual"]) {
    assert.equal(
      inMode(mode, () => labT("test.missing", "Not translated {x}", { x: "yet" })),
      "Not translated yet",
    );
  }
});

test("labT: placeholders with no value stay visible instead of printing undefined", () => {
  assert.equal(labT("test.missing", "Total {amount}", {}), "Total {amount}");
  assert.equal(labT("test.missing", "Total {amount}"), "Total {amount}");
});

test("table: every entry has real English and Spanish with the same placeholders", () => {
  const holes = (s) => [...new Set(s.match(/\{\w+\}/g) || [])].sort().join();
  for (const [key, entry] of Object.entries(LAB_STRINGS)) {
    const [en, es] = entry;
    assert.match(key, /^[a-z0-9-]+\.[a-z0-9.-]+$/, `${key}: key shape`);
    assert.ok(en.trim() && es.trim(), `${key}: empty string`);
    assert.equal(holes(en), holes(es), `${key}: placeholders differ between English and Spanish`);
    assert.doesNotMatch(es, /\b(usted|ustedes)\b/i, `${key}: use the tú form`);
    assert.equal(/\s{2,}/.test(es), /\s{2,}/.test(en), `${key}: whitespace runs differ from the English`);
    assert.equal(/^\s/.test(es), /^\s/.test(en), `${key}: leading space differs from the English`);
    assert.equal(/\s$/.test(es), /\s$/.test(en), `${key}: trailing space differs from the English`);
  }
});

test("call sites: every labT call is readable and matches the table exactly", () => {
  assert.ok(labSources.length >= 12, `only ${labSources.length} labs call labT; the target is 12+`);
  const used = new Set();
  for (const { file, source } of labSources) {
    const { calls, unreadable } = scanLabCalls(source);
    assert.deepEqual(unreadable, [], `${file}: labT call with a non-literal key or English`);
    assert.match(source, /from "\.\/lab-strings-es\.js"/, `${file}: missing import`);
    for (const { key, en } of calls) {
      const entry = LAB_STRINGS[key];
      assert.ok(entry, `${file}: key "${key}" is not in lab-strings-es.js`);
      assert.equal(entry[0], en, `${file}: English for "${key}" drifted from the table`);
      used.add(key);
    }
  }
  const orphans = Object.keys(LAB_STRINGS).filter((k) => !used.has(k));
  assert.deepEqual(orphans, [], "table entries no lab uses");
});

test("kinds: every localized kind names files that really call labT", () => {
  const withCalls = new Set(labSources.map((s) => s.file));
  for (const [kind, files] of Object.entries(LAB_KIND_FILES)) {
    assert.ok(FIXTURES[kind], `${kind}: no render fixture`);
    for (const f of files) assert.ok(withCalls.has(f), `${kind}: ${f} has no labT calls`);
  }
});

test("scanner: concatenated or interpolated English is reported, not skipped", () => {
  const { calls, unreadable } = scanLabCalls(
    'labT("a.b", "x" + y); labT("c.d", `v ${n}`); labT("e.f", "ok", {n:1});',
  );
  assert.equal(unreadable.length, 2);
  assert.deepEqual(
    calls.map((c) => c.key),
    ["e.f"],
  );
});

test("English output is byte-identical to the unpatched labs (fingerprints over scripted interactions)", async () => {
  for (const kind of Object.keys(BASELINE)) {
    const states = await renderLabStates(kind, FIXTURES[kind]);
    const got = states.map(fingerprint);
    assert.equal(got.length, BASELINE[kind].length, `${kind}: number of states`);
    const bad = got.map((f, i) => (f === BASELINE[kind][i] ? -1 : i)).filter((i) => i >= 0);
    assert.deepEqual(bad, [], `${kind}: English changed at interaction states ${bad.slice(0, 8)}`);
  }
});

test("the fingerprint check bites: one changed character is a different fingerprint", () => {
  assert.notEqual(fingerprint("<button>Check</button>"), fingerprint("<button>Check </button>"));
  assert.equal(fingerprint("same"), fingerprint("same"));
});

test("Spanish page: each localized lab draws Spanish where it drew English", async () => {
  for (const kind of Object.keys(LAB_KIND_FILES)) {
    const en = labPaint(await renderLabStates(kind, FIXTURES[kind]));
    const es = labPaint(await renderLabStates(kind, FIXTURES[kind], { mode: "es" }));
    assert.notEqual(es, en, `${kind}: Spanish first paint equals English`);
    const text = es.replace(/<[^>]+>/g, " ");
    assert.match(text, /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|con|para|y|un|una|tu|tus)\b/i, `${kind}: no Spanish in the first paint`);
  }
});

test("Spanish page: the bilingual page shows English and Spanish together", async () => {
  const kind = Object.keys(LAB_KIND_FILES)[0];
  const both = labPaint(await renderLabStates(kind, FIXTURES[kind], { mode: "bilingual" }));
  assert.match(both, / \/ /, `${kind}: bilingual paint has no "English / Español" pair`);
});

test("Spanish uses the site's math words, and never the ones it replaced", () => {
  // [English pattern, required Spanish when the English says it, forbidden Spanish]
  const TERMS = [
    [/\bunit rate/i, /tasas? unitarias?/i, /raz[oó]n unitaria|tarifa unitaria/i],
    [/\bequivalent ratio/i, /raz[oó]n(es)? equivalente/i, /proporci[oó]n equivalente/i],
    [/\bnumber line/i, /rectas? num[eé]ricas?/i, /l[ií]neas? num[eé]ricas?/i],
    [/\bbox plot/i, /diagramas? de caja/i, /gr[aá]ficas? de caja|diagramas? de bigotes/i],
    [/\bdot plot/i, /diagramas? de puntos/i, /gr[aá]ficas? de puntos/i],
    [/\bhistogram/i, /histograma/i, null],
    [/\bmedian/i, /medianas?/i, null],
    [/\bnumerator/i, /numeradore?s?/i, null],
    [/\bdenominator/i, /denominadore?s?/i, null],
    [/\breciprocal/i, /rec[ií]procos?/i, null],
    [/\bmixed number/i, /n[uú]meros? mixtos?/i, null],
    [/\bcoordinate plane|\bcoordinate grid/i, /plano de coordenadas|cuadr[ií]cula de coordenadas/i, /plano cartesiano/i],
    [/\bordered pair/i, /pares? ordenados?/i, null],
    [/\bflip/i, /invert|inviert|inversa|rec[ií]proco/i, /volt[eéi]/i],
    [/\binequalit/i, /desigualdad(es)?/i, null],
    [/\bequation/i, /ecuaci[oó]n|ecuaciones/i, null],
    [/\bvolume/i, /vol[uú]menes|volumen/i, null],
    [/\bdecimal point/i, /puntos? decimal(es)?/i, /coma decimal/i],
    [/\blike terms/i, /t[eé]rminos? semejantes?/i, /t[eé]rminos? similares?/i],
    [/\bdistributive/i, /distributivas?/i, null],
    [/\bprime\b/i, /\bprim[oa]s?\b/i, null],
    [/\bleast common multiple|\bLCM\b/, /m[ií]nimo com[uú]n m[uú]ltiplo|mcm|MCM/, null],
    [/\bgreatest common factor|\bGCF\b/, /m[aá]ximo com[uú]n divisor|MCD|mcd/, null],
  ];
  for (const [key, [en, es]] of Object.entries(LAB_STRINGS)) {
    for (const [enRe, wantRe, banRe] of TERMS) {
      if (enRe.test(en)) assert.match(es, wantRe, `${key}: "${en}" -> "${es}" misses the site's term`);
      if (banRe) assert.doesNotMatch(es, banRe, `${key}: uses a word the glossary replaced`);
    }
    assert.doesNotMatch(es, /\b(click|ok)\b/i, `${key}: anglicism`);
  }
});
