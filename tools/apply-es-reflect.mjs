#!/usr/bin/env node
// apply-es-reflect.mjs — project data/es-translations/reflect.json onto the
// EXIT TICKET (`reflect.exitTicket`) of every lesson that carries a translation.
//
//   node tools/apply-es-reflect.mjs [--dry-run] [--unit 2] [--refresh]
//
// The exit ticket is the LAST thing a student does in a lesson and the thing
// that records whether they got it. Everything else on the surface — the
// warm-up, the worked example, practice — was already bilingual, so a Spanish
// speaker worked through the whole lesson in two languages and then met the
// graded question in one.
//
// ALL-OR-NOTHING PER TICKET, for the same reason as the warm-up: `choicesEs`
// and `choiceFeedbackEs` are POSITIONAL arrays that the renderer indexes
// against the English, so a missing entry does not read as "untranslated", it
// reads as the wrong option. A ticket is written whole or not at all.
//
// DERIVED STRINGS ARE COMPOSED, NOT TRANSLATED (tools/lib/es-reflect-compose.mjs):
// one stem appears verbatim inside "Explain your thinking — …", "Quick check —
// you've got this: …" and the catch-up roll-up, so translating each by hand
// means writing one question four times and drifting between the copies.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";
import { languageNeutral } from "./apply-es-warmup.mjs";
import { derive } from "./lib/es-reflect-compose.mjs";

const LESSONS_DIR = "lessons";
const DRY = process.argv.includes("--dry-run");
const REFRESH = process.argv.includes("--refresh");
const unitIx = process.argv.indexOf("--unit");
const ONLY_UNIT = unitIx !== -1 ? process.argv[unitIx + 1] : null;

const blank = (value) => !String(value ?? "").trim();

/** The Spanish for one string: memory, composition, or pass-through. */
function spanish(text, memory) {
  if (blank(text)) return null;
  const es = derive(String(text), memory);
  if (es) return es;
  return languageNeutral(text) ? String(text) : null;
}

/**
 * The Spanish for one exit ticket, or null when it is not fully covered.
 * @returns {object|null} the `*Es` fields to write
 */
export function ticketTranslation(ticket, memory) {
  if (!ticket || blank(ticket.stem)) return null;
  const stemEs = derive(String(ticket.stem), memory);
  if (!stemEs) return null;
  const out = { stemEs };

  if (Array.isArray(ticket.choices) && ticket.choices.length) {
    const choicesEs = [];
    for (const choice of ticket.choices) {
      const es = spanish(choice, memory);
      if (!es) return null;
      choicesEs.push(es);
    }
    out.choicesEs = choicesEs;
  }

  if (!blank(ticket.explanation)) {
    const es = spanish(ticket.explanation, memory);
    if (!es) return null;
    if (es !== ticket.explanation) out.explanationEs = es;
  }

  // choiceFeedback is a sparse positional array — a null slot is authored
  // absence and must stay null, not become a translation of the slot before it.
  if (Array.isArray(ticket.choiceFeedback) && ticket.choiceFeedback.some(Boolean)) {
    const feedbackEs = [];
    for (const note of ticket.choiceFeedback) {
      if (blank(note)) {
        feedbackEs.push(null);
        continue;
      }
      const es = spanish(note, memory);
      if (!es) return null;
      feedbackEs.push(es);
    }
    out.choiceFeedbackEs = feedbackEs;
  }

  if (Array.isArray(ticket.hints) && ticket.hints.length) {
    const hintsEs = [];
    for (const hint of ticket.hints) {
      const es = spanish(hint, memory);
      if (!es) return null;
      hintsEs.push(es);
    }
    out.hintsEs = hintsEs;
  }

  return out;
}

function lessonDirs() {
  return readdirSync(LESSONS_DIR)
    .filter((name) => {
      if (!existsSync(join(LESSONS_DIR, name, "config.json"))) return false;
      if (!statSync(join(LESSONS_DIR, name)).isDirectory()) return false;
      if (!ONLY_UNIT) return true;
      return new RegExp(`^${ONLY_UNIT}-\\d+(?:-(?:group1|group2|catchup))?$`).test(name);
    })
    .sort();
}

function main() {
  const memory = loadMemory();
  if (!memory.size) {
    console.error("No translations found in data/es-translations/");
    process.exit(1);
  }

  let written = 0;
  let filled = 0;
  const partial = [];

  for (const lesson of lessonDirs()) {
    const file = join(LESSONS_DIR, lesson, "config.json");
    const config = JSON.parse(readFileSync(file, "utf8"));
    const ticket = config.reflect?.exitTicket;
    if (!ticket || blank(ticket.stem)) continue;

    const done = !blank(ticket.stemEs);
    if (done && !REFRESH) continue;

    const translated = ticketTranslation(ticket, memory);
    if (!translated) {
      partial.push(lesson);
      continue;
    }
    let changed = false;
    for (const [key, value] of Object.entries(translated)) {
      if (JSON.stringify(ticket[key]) === JSON.stringify(value)) continue;
      ticket[key] = value;
      changed = true;
    }
    if (!changed) continue;
    if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    written += 1;
    filled += 1;
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}exit-ticket Spanish: ${filled} ticket(s) filled across ${written} lesson(s).`,
  );
  if (partial.length) {
    console.log(
      `\n${partial.length} exit ticket(s) are PARTLY covered and were left alone — finish the missing strings or the ticket stays English:`,
    );
    for (const item of partial.slice(0, 40)) console.log(`  ${item}`);
    if (partial.length > 40) console.log(`  … and ${partial.length - 40} more`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
