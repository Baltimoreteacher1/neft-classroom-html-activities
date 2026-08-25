#!/usr/bin/env node
/**
 * validate-es-notice-wonder.mjs — the lesson opener's Spanish holds together.
 *
 * Notice & Wonder is where a student WRITES, not just reads, and that changes
 * what a defect costs. A starter chip is a sentence the student borrows into
 * their own answer, so a chip paired with the wrong translation does not read
 * as "untranslated" — it hands them a sentence about a different picture.
 *
 * Three rules, each for a failure this surface can actually have:
 *
 *   1. PARALLEL ARRAYS. `noticeStartersEs` must match `noticeStarters` in
 *      length, or the renderer refuses it and every chip silently reverts to
 *      English — present, counted, invisible.
 *
 *   2. THE CAPTION AND ITS SOURCE MUST AGREE. The visible caption falls back
 *      `caption || context`, so a lesson authoring `caption` + `contextEs`
 *      would show one field's English above another field's Spanish. Whichever
 *      field supplies the caption must supply its translation.
 *
 *   3. ALT TEXT IS NOT OPTIONAL ONCE THE CARD IS BILINGUAL. `imageAlt` is the
 *      picture for a student using a screen reader. A Spanish card with English
 *      alt text is the half-translated defect, one modality over.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { languageNeutral } from "./apply-es-warmup.mjs";

const LESSONS = "lessons";
const blank = (value) => !String(value ?? "").trim();
const problems = [];

/* ── detectors ───────────────────────────────────────────────────────────── */

export function starterProblems(id, name, en, es) {
  const out = [];
  if (es === undefined) return out;
  if (!Array.isArray(es)) return [`${id}: ${name} is not an array`];
  const source = Array.isArray(en) ? en : [];
  if (es.length !== source.length) {
    return [
      `${id}: ${name} has ${es.length} entries for ${source.length} starters — the renderer ` +
        "refuses a mismatched array, so every chip reverts to English",
    ];
  }
  source.forEach((value, i) => {
    const filled = !blank(value);
    if (filled && blank(es[i])) out.push(`${id}: ${name}[${i}] is blank but the English is not`);
    if (filled && es[i] === value && !languageNeutral(value)) {
      out.push(`${id}: ${name}[${i}] is identical to the English`);
    }
  });
  return out;
}

export function cardProblems(id, nw) {
  const out = [];
  if (!nw || typeof nw !== "object") return out;
  const bilingual =
    !blank(nw.contextEs) ||
    !blank(nw.captionEs) ||
    Array.isArray(nw.noticeStartersEs) ||
    Array.isArray(nw.wonderStartersEs);
  if (!bilingual) return out; // untranslated is a legitimate state

  out.push(...starterProblems(id, "noticeStartersEs", nw.noticeStarters, nw.noticeStartersEs));
  out.push(...starterProblems(id, "wonderStartersEs", nw.wonderStarters, nw.wonderStartersEs));

  // The caption falls back caption || context; its translation must come from
  // the SAME field, or the card shows one field's English over another's Spanish.
  if (nw.showCaption === true) {
    const source = blank(nw.caption) ? "context" : "caption";
    const text = nw[source];
    const es = nw[`${source}Es`];
    if (!blank(text) && blank(es) && !languageNeutral(text)) {
      out.push(
        `${id}: the visible caption comes from \`${source}\` but only the other field is ` +
          "translated — the card would print English over Spanish",
      );
    }
  }

  if (!blank(nw.imageAlt) && blank(nw.imageAltEs) && !languageNeutral(nw.imageAlt)) {
    out.push(
      `${id}: bilingual card with English imageAlt — the picture stays English for a screen reader`,
    );
  }
  for (const field of ["context", "caption", "imageAlt"]) {
    const es = nw[`${field}Es`];
    if (!blank(es) && es === nw[field] && !languageNeutral(nw[field])) {
      out.push(`${id}: ${field}Es is identical to the English`);
    }
  }
  return out;
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const selftests = [
  [
    "a short starter array is caught",
    () =>
      starterProblems("x", "noticeStartersEs", ["I notice a", "I notice b"], ["Yo noto a"])
        .length === 1,
  ],
  [
    "a starter left in English is caught",
    () => starterProblems("x", "noticeStartersEs", ["I notice a"], ["I notice a"]).length === 1,
  ],
  [
    "a matching starter array passes",
    () => starterProblems("x", "noticeStartersEs", ["I notice a"], ["Yo noto a"]).length === 0,
  ],
  [
    "a caption sourced from `caption` with only contextEs is caught",
    () =>
      cardProblems("x", {
        showCaption: true,
        caption: "A bar chart of the week",
        context: "Some framing prose here",
        contextEs: "Algo de texto de encuadre",
      }).some((m) => m.includes("visible caption")),
  ],
  [
    "a caption sourced from `context` with contextEs passes",
    () =>
      !cardProblems("x", {
        showCaption: true,
        context: "Some framing prose here",
        contextEs: "Algo de texto de encuadre",
      }).some((m) => m.includes("visible caption")),
  ],
  [
    "English alt text on a bilingual card is caught",
    () =>
      cardProblems("x", {
        contextEs: "Algo en español",
        imageAlt: "A bar chart of the week",
      }).some((m) => m.includes("imageAlt")),
  ],
  [
    "an untranslated card is not an error",
    () =>
      cardProblems("x", {
        context: "Some framing prose",
        imageAlt: "A bar chart",
        noticeStarters: ["I notice a"],
      }).length === 0,
  ],
];

for (const [name, run] of selftests) {
  let ok = false;
  try {
    ok = run();
  } catch (error) {
    console.error(`self-test threw: ${name} — ${error.message}`);
  }
  if (!ok) {
    console.error(`FAIL validate:es-notice-wonder — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

let cards = 0;
let translated = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const nw = JSON.parse(readFileSync(file, "utf8")).noticeAndWonder;
  if (!nw || typeof nw !== "object") continue;
  cards += 1;
  if (!blank(nw.contextEs) || Array.isArray(nw.noticeStartersEs)) translated += 1;
  problems.push(...cardProblems(dir, nw));
}

if (!cards) {
  console.error("FAIL validate:es-notice-wonder — swept 0 cards, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-notice-wonder — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / cards) * 100);
console.log(
  `PASS validate:es-notice-wonder — ${translated}/${cards} Notice & Wonder cards bilingual ` +
    `(${percent}%); starters parallel, caption agrees with its source, alt text translated; ` +
    `${selftests.length} self-tests green.`,
);
