#!/usr/bin/env node
/**
 * validate-es-reflect.mjs — the exit ticket's Spanish holds together.
 *
 * The exit ticket is the graded end of every lesson, and it carries TWO
 * positional arrays, not one: `choicesEs` (indexed against `choices`) and
 * `choiceFeedbackEs` (indexed against `choiceFeedback`, and legitimately
 * SPARSE — a null slot means that distractor has no authored note). A dropped
 * entry in either does not read as "untranslated"; it labels an option with the
 * previous option's Spanish, so a student reads the right answer and is graded
 * wrong for choosing it.
 *
 * Sparseness is why the feedback array needs its own rule: compacting out the
 * nulls would shift every later note onto the wrong distractor while leaving a
 * shorter-but-plausible array behind, which a length check alone would miss if
 * the English were sparse too. So the nulls must line up as well as the length.
 *
 * It also re-derives every composed string (tools/lib/es-reflect-compose.mjs).
 * One stem appears under three wrappers plus on its own, and if the wrappers
 * were hand-edited a student meets the same question phrased differently on the
 * lesson and on its catch-up.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";
import { languageNeutral } from "./apply-es-warmup.mjs";
import { derive } from "./lib/es-reflect-compose.mjs";

const LESSONS = "lessons";
const blank = (value) => !String(value ?? "").trim();
const problems = [];

/* ── detectors ───────────────────────────────────────────────────────────── */

/** A parallel array must match its English in LENGTH and in where it is empty. */
export function arrayProblems(where, name, en, es) {
  const out = [];
  if (es === undefined) return out;
  if (!Array.isArray(es)) return [`${where}: ${name} is not an array`];
  const source = Array.isArray(en) ? en : [];
  if (es.length !== source.length) {
    out.push(
      `${where}: ${name} has ${es.length} entries for ${source.length} — the array is positional, ` +
        "so every later item is labelled with the wrong Spanish",
    );
    return out;
  }
  source.forEach((value, i) => {
    const filled = !blank(value);
    const translated = !blank(es[i]);
    if (filled && !translated) out.push(`${where}: ${name}[${i}] is blank but the English is not`);
    if (!filled && translated) out.push(`${where}: ${name}[${i}] translates an empty slot`);
    if (filled && translated && es[i] === value && !languageNeutral(value)) {
      out.push(`${where}: ${name}[${i}] is identical to the English`);
    }
  });
  return out;
}

/** Everything that can be wrong with one exit ticket's Spanish. */
export function ticketProblems(id, ticket) {
  const out = [];
  if (!ticket) return out;
  const hasStem = !blank(ticket.stemEs);
  const anyEs = [
    ticket.stemEs,
    ticket.choicesEs,
    ticket.explanationEs,
    ticket.choiceFeedbackEs,
  ].some((v) => (Array.isArray(v) ? v.length : !blank(v)));
  if (!anyEs) return out; // untranslated is a legitimate state

  if (!hasStem) out.push(`${id}: has Spanish parts but no stemEs`);
  if (hasStem && ticket.stemEs === ticket.stem)
    out.push(`${id}: stemEs is identical to the English`);
  if (hasStem && Array.isArray(ticket.choices) && ticket.choices.length && !ticket.choicesEs) {
    out.push(`${id}: has a Spanish stem but no choicesEs — the options stay English`);
  }
  out.push(...arrayProblems(id, "choicesEs", ticket.choices, ticket.choicesEs));
  out.push(
    ...arrayProblems(id, "choiceFeedbackEs", ticket.choiceFeedback, ticket.choiceFeedbackEs),
  );
  out.push(...arrayProblems(id, "hintsEs", ticket.hints, ticket.hintsEs));
  if (
    hasStem &&
    !blank(ticket.explanation) &&
    blank(ticket.explanationEs) &&
    !languageNeutral(ticket.explanation)
  ) {
    out.push(`${id}: translated ticket with no explanationEs — the feedback stays English`);
  }
  return out;
}

/** A composed string must still match what the composer would build. */
export function driftProblems(id, ticket, memory) {
  if (!ticket || blank(ticket.stem) || blank(ticket.stemEs)) return [];
  const built = derive(String(ticket.stem), memory);
  if (built && built !== ticket.stemEs) {
    return [
      `${id}: stemEs no longer matches what it is quoted FROM — a stem's translation was ` +
        "edited in one place and not the other",
    ];
  }
  return [];
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const selftests = [
  [
    "a short choicesEs is caught",
    () => arrayProblems("x", "choicesEs", ["a", "b vans"], ["a"]).length === 1,
  ],
  [
    "a choice left in English is caught",
    () => arrayProblems("x", "choicesEs", ["10 vans"], ["10 vans"]).length === 1,
  ],
  [
    "a language-neutral choice repeated verbatim is NOT an error",
    () => arrayProblems("x", "choicesEs", ["42"], ["42"]).length === 0,
  ],
  [
    "a sparse feedback array that fills an empty slot is caught",
    () =>
      arrayProblems("x", "choiceFeedbackEs", ["note", null], ["nota", "inventado"]).length === 1,
  ],
  [
    "a sparse feedback array that drops a real note is caught",
    () => arrayProblems("x", "choiceFeedbackEs", ["note", null], ["", null]).length === 1,
  ],
  [
    "a correctly sparse feedback array passes",
    () => arrayProblems("x", "choiceFeedbackEs", ["note", null], ["nota", null]).length === 0,
  ],
  [
    "Spanish choices with no stem are caught",
    () => ticketProblems("x", { stem: "s", choices: ["a"], choicesEs: ["a-es"] }).length === 1,
  ],
  [
    "an untranslated ticket is not an error",
    () => ticketProblems("x", { stem: "s", choices: ["a"], explanation: "e" }).length === 0,
  ],
  [
    "a drifted composed stem is caught",
    () => {
      const memory = new Map([["What is 45% of 360?", "¿Cuánto es el 45% de 360?"]]);
      const ticket = {
        stem: "Explain your thinking — What is 45% of 360?",
        stemEs: "Explica tu razonamiento — algo distinto",
      };
      return driftProblems("x", ticket, memory).length === 1;
    },
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
    console.error(`FAIL validate:es-reflect — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

const memory = loadMemory();
let tickets = 0;
let translated = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const config = JSON.parse(readFileSync(file, "utf8"));
  const ticket = config.reflect?.exitTicket;
  if (!ticket || blank(ticket.stem)) continue;
  tickets += 1;
  if (!blank(ticket.stemEs)) translated += 1;
  problems.push(...ticketProblems(dir, ticket));
  problems.push(...driftProblems(dir, ticket, memory));
}

if (!tickets) {
  console.error("FAIL validate:es-reflect — swept 0 exit tickets, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-reflect — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / tickets) * 100);
console.log(
  `PASS validate:es-reflect — ${translated}/${tickets} exit tickets bilingual (${percent}%); ` +
    `no shifted choice or feedback arrays, no quote drift; ${selftests.length} self-tests green.`,
);
