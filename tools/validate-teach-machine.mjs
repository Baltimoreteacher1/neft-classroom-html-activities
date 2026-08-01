#!/usr/bin/env node
/* =============================================================================
 * validate-teach-machine.mjs — gate for Teach the Machine.
 * -----------------------------------------------------------------------------
 *   node tools/validate-teach-machine.mjs
 *
 * Asserts the three things that would silently ruin the feature if they drifted:
 *
 *   1. COVERAGE. Every one of the 19 misconception tags in
 *      data/misconception-labels.json has a complete persona — all fields, 3+
 *      probes, 2+ rubric items, and real Spanish for every string a student can
 *      see. A missing persona means a class whose top mistake is that tag gets
 *      no learner at all.
 *
 *   2. THE LEARNER NEVER TEACHES. openingLine and probes[] may not contain any
 *      giveaway phrase, and the teacher-facing `worked` model answer may not
 *      leak into any student-facing string. The whole design collapses if the
 *      confused learner hands over the method.
 *
 *   3. PLATFORM RULES. No file under curriculum/teach-the-machine/ contains the
 *      string "ESOL" (never used on this site) or the word "timer" (no
 *      countdowns, ever).
 *
 * Plus a parity check: the closed tag list inlined in
 * functions/api/teach-machine.js must equal personas.js TAGS, because the
 * Function validates against its own copy.
 *
 * No dependencies. Non-zero exit on any failure.
 * ========================================================================== */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const PAGE_DIR = join(ROOT, "curriculum", "teach-the-machine");

const { PERSONAS, TAGS, UNIVERSAL_GIVEAWAYS, normalizeText } = await import(
  join(PAGE_DIR, "personas.js")
);
const { __test__: fnTest } = await import(join(ROOT, "functions", "api", "teach-machine.js"));

const labels = JSON.parse(readFileSync(join(ROOT, "data", "misconception-labels.json"), "utf8"));

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

/* ── 1. Coverage ─────────────────────────────────────────────────────────── */

const labelTags = Object.keys(labels.tags).sort();
const personaTags = Object.keys(PERSONAS).sort();

check(
  labelTags.length === Number(labels.count),
  `misconception-labels.json count (${labels.count}) does not match its own tag list (${labelTags.length})`,
);
check(
  labelTags.join("|") === personaTags.join("|"),
  `persona tags differ from data/misconception-labels.json:\n` +
    `  missing personas: ${labelTags.filter((t) => !personaTags.includes(t)).join(", ") || "none"}\n` +
    `  extra personas:   ${personaTags.filter((t) => !labelTags.includes(t)).join(", ") || "none"}`,
);
check(
  [...TAGS].sort().join("|") === personaTags.join("|"),
  "exported TAGS does not match the PERSONAS keys",
);

/* Student-facing strings, collected per persona for the leak checks below. */
function studentFacing(p) {
  return [
    p.openingLine,
    p.openingLineEs,
    p.wrongIdea,
    p.wrongIdeaEs,
    p.persona.blurb,
    p.persona.blurbEs,
    ...p.probes,
    ...p.probesEs,
    ...p.mustAddress.flatMap((i) => [i.en, i.es]),
    ...p.wordBank,
    ...p.wordBankEs,
  ];
}

for (const tag of personaTags) {
  const p = PERSONAS[tag];
  const at = (msg) => `[${tag}] ${msg}`;

  check(p.tag === tag, at("persona.tag does not match its key"));
  check(Array.isArray(p.standards) && p.standards.length > 0, at("no standards listed"));

  check(p && p.persona && nonEmpty(p.persona.name), at("persona.name is empty"));
  check(nonEmpty(p.persona && p.persona.blurb), at("persona.blurb is empty"));
  check(nonEmpty(p.persona && p.persona.blurbEs), at("persona.blurbEs is empty"));

  for (const field of [
    "wrongIdea",
    "wrongIdeaEs",
    "openingLine",
    "openingLineEs",
    "worked",
    "workedEs",
  ]) {
    check(nonEmpty(p[field]), at(`${field} is empty`));
  }
  check(p.openingLineEs !== p.openingLine, at("openingLineEs is identical to openingLine"));
  check(p.wrongIdeaEs !== p.wrongIdea, at("wrongIdeaEs is identical to wrongIdea"));

  check(Array.isArray(p.probes) && p.probes.length >= 3, at("fewer than 3 probes"));
  check(
    Array.isArray(p.probesEs) && p.probesEs.length === (p.probes || []).length,
    at("probesEs does not have one entry per probe"),
  );
  (p.probes || []).forEach((probe, i) => {
    check(nonEmpty(probe), at(`probes[${i}] is empty`));
    check(nonEmpty((p.probesEs || [])[i]), at(`probesEs[${i}] is empty`));
    check((p.probesEs || [])[i] !== probe, at(`probesEs[${i}] is identical to probes[${i}]`));
  });

  check(
    Array.isArray(p.mustAddress) && p.mustAddress.length >= 2,
    at("fewer than 2 mustAddress items"),
  );
  check(
    p.mustAddress.length <= 4,
    at("more than 4 mustAddress items — the checklist stops being readable"),
  );
  const ids = new Set();
  for (const item of p.mustAddress || []) {
    check(nonEmpty(item.id), at("a mustAddress item has no id"));
    check(!ids.has(item.id), at(`duplicate mustAddress id "${item.id}"`));
    ids.add(item.id);
    check(nonEmpty(item.en), at(`mustAddress "${item.id}" has no English text`));
    check(nonEmpty(item.es), at(`mustAddress "${item.id}" has no Spanish text`));
    check(
      Array.isArray(item.match) &&
        item.match.length > 0 &&
        item.match.every((g) => Array.isArray(g) && g.length > 0),
      at(`mustAddress "${item.id}" has no usable match groups`),
    );
  }

  check(Array.isArray(p.giveawayPhrases) && p.giveawayPhrases.length > 0, at("no giveawayPhrases"));
  check(
    Array.isArray(p.wordBank) && p.wordBank.length >= 4,
    at("word bank has fewer than 4 terms"),
  );
  check(
    Array.isArray(p.wordBankEs) && p.wordBankEs.length === (p.wordBank || []).length,
    at("wordBankEs does not have one entry per wordBank term"),
  );

  for (const value of studentFacing(p)) {
    check(nonEmpty(value), at("a student-facing string is empty"));
  }

  /* ── 2a. The learner never recites the method ──────────────────────────── */
  const giveaways = [...(p.giveawayPhrases || []), ...UNIVERSAL_GIVEAWAYS];
  const learnerVoice = [
    ["openingLine", p.openingLine],
    ["openingLineEs", p.openingLineEs],
    ...(p.probes || []).map((probe, i) => [`probes[${i}]`, probe]),
    ...(p.probesEs || []).map((probe, i) => [`probesEs[${i}]`, probe]),
  ];
  for (const [where, text] of learnerVoice) {
    const norm = normalizeText(text);
    for (const phrase of giveaways) {
      check(!norm.includes(normalizeText(phrase)), at(`${where} recites the method: "${phrase}"`));
    }
  }

  /* ── 2b. The model answer never leaks to the student ───────────────────── */
  const workedSentences = [p.worked, p.workedEs]
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length >= 20);
  const facingNorm = studentFacing(p).map((v) => normalizeText(v));
  for (const sentence of workedSentences) {
    for (const field of facingNorm) {
      check(
        !field.includes(sentence),
        at(
          `the teacher model answer leaks into a student-facing string: "${sentence.slice(0, 60)}…"`,
        ),
      );
    }
  }
}

/* ── 3. Platform rules over the page directory ───────────────────────────── */

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const pageFiles = walk(PAGE_DIR);
check(pageFiles.length >= 4, "curriculum/teach-the-machine/ is missing files");
for (const file of pageFiles) {
  const text = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  check(!text.includes("ESOL"), `${rel} contains "ESOL" — never use that label on this site`);
  check(!/\btimers?\b/i.test(text), `${rel} contains the word "timer" — no countdowns, ever`);
}

/* ── 4. The Function's inlined tag list matches personas.js ──────────────── */

check(
  Array.isArray(fnTest && fnTest.ALLOWED_TAGS) &&
    [...fnTest.ALLOWED_TAGS].sort().join("|") === personaTags.join("|"),
  "functions/api/teach-machine.js ALLOWED_TAGS has drifted from personas.js TAGS",
);

/* ── Report ──────────────────────────────────────────────────────────────── */

if (failures.length) {
  for (const message of failures) console.error(`FAIL  ${message}`);
  console.error(`\nvalidate-teach-machine: ${failures.length} failure(s).`);
  process.exit(1);
}

const probeCount = personaTags.reduce((n, tag) => n + PERSONAS[tag].probes.length, 0);
const rubricCount = personaTags.reduce((n, tag) => n + PERSONAS[tag].mustAddress.length, 0);
console.log(
  `validate-teach-machine: PASS — ${personaTags.length}/${labelTags.length} tags covered, ` +
    `${rubricCount} rubric items, ${probeCount} probes, full EN/ES parity, no method leaks, ` +
    `${pageFiles.length} page files clean.`,
);
