#!/usr/bin/env node
/**
 * generate-notebook-copy-panels.mjs — build every notebook copy panel from the
 * lesson it appears on, and from nothing else.
 *
 * The panels this replaces were authored by hand across 84 configs with no
 * generator owning them, which is how 39 of 84 box-2 rules ended up stating
 * mathematics from a different lesson. The rule here is one sentence:
 *
 *     Content in a copy panel comes from that lesson's own data,
 *     or the lesson gets no panel. There is no third option.
 *
 * Consequently this script SHORTENS lesson text (verbatim prefixes, cut at
 * clause boundaries) and never composes new prose. Where a lesson does not
 * state a rule in a form that can be quoted, it emits no box-2 panel and names
 * the lesson in its output. A mixed result is the correct result.
 *
 * Usage: node scripts/generate-notebook-copy-panels.mjs [--check] [--only 2-5]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

const MEANING_MAX_WORDS = 11; // the shape gate fails at 12
const RULE_MAX_WORDS = 16;

export const coreLessonIds = () =>
  readdirSync(LESSONS)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });

const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/** Longest VERBATIM prefix of `text` that ends at a clause boundary and fits
 *  the word budget. Never reorders, never substitutes, never paraphrases. */
export function shortenVerbatim(text, maxWords) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]+$/, "");
  if (!clean) return "";
  if (wordCount(clean) <= maxWords) return clean;

  // Prefer a real clause boundary inside the budget.
  const boundaries = [];
  for (const m of clean.matchAll(/\s*(?:—|–|;|,|:| that | which | so )/g)) {
    boundaries.push(m.index);
  }
  const fitting = boundaries
    .map((idx) =>
      clean
        .slice(0, idx)
        .trim()
        .replace(/[,;:—–]+$/, ""),
    )
    .filter((c) => c && wordCount(c) <= maxWords);

  // The SHORTEST clause that still says something whole beats the longest one
  // that fits: cutting "…what you have done, felt, and learned" at the last
  // comma leaves a dangling list item, while cutting at the em-dash leaves a
  // complete phrase. Below five words a clause is usually too thin to mean
  // anything, so those fall through to the longest fitting prefix.
  const whole = fitting
    .filter((c) => wordCount(c) >= 5)
    .sort((a, b) => wordCount(a) - wordCount(b))[0];
  if (whole) return whole;
  const longest = fitting.sort((a, b) => wordCount(b) - wordCount(a))[0];
  if (longest) return longest;

  // No boundary fits: hard-cut on the word budget, still a verbatim prefix,
  // then drop any trailing word that leaves the phrase hanging.
  const DANGLING =
    /^(with|from|and|or|of|the|a|an|to|that|which|for|in|on|by|into|than|as|is|are|be|one|another|each|both|either)$/i;
  const cut = clean.split(/\s+/).slice(0, maxWords);
  while (cut.length > 3 && DANGLING.test(cut[cut.length - 1])) cut.pop();
  return cut.join(" ").replace(/[,;:—–]+$/, "");
}

/** Vocabulary this lesson declares, in the lesson's own order, concept role
 *  first (see docs: `role:"concept"` marks the lesson's anchor term). */
export function panelVocabulary(config) {
  const vocab = (config.vocabulary || []).filter(
    (v) =>
      v &&
      typeof v.term === "string" &&
      v.term.trim() &&
      typeof v.definition === "string" &&
      v.definition.trim(),
  );
  const concept = vocab.filter((v) => v.role === "concept");
  const rest = vocab.filter((v) => v.role !== "concept");
  return [...concept, ...rest];
}

export function buildBox1(config) {
  const vocab = panelVocabulary(config);
  if (vocab.length < 3)
    return { panel: null, reason: "fewer than 3 declared vocabulary entries with definitions" };
  const items = [];
  for (const v of vocab) {
    if (items.length === 5) break;
    const term = v.term.trim().replace(/\.$/, "");
    // Only the definition's FIRST sentence: crossing a full stop is how
    // "A number sentence with an equal sign. The percent one is" happened.
    const firstSentence = String(v.definition).split(/(?<=[.!?])\s+/)[0];
    const meaning = shortenVerbatim(firstSentence, MEANING_MAX_WORDS);
    if (!term || !meaning) continue;
    items.push({ term, meaning });
  }
  if (items.length < 3)
    return { panel: null, reason: "fewer than 3 vocabulary entries survived shortening" };
  return { panel: { items }, reason: null };
}

/** A keyIdea sentence is a quotable RULE when it states a procedure or a
 *  relation, rather than a disposition. "To divide fractions, multiply by the
 *  reciprocal" is a rule; "Everyone uses math daily" is not. Symbols, an
 *  imperative opening, and relational vocabulary are the three decidable
 *  signals; everything else is skipped rather than guessed at. */
const balanced = (str) =>
  (String(str).match(/\(/g) || []).length === (String(str).match(/\)/g) || []).length;

/** A quote that ends on a word still waiting for its object — "…into a
 *  percent", "…when substituting it makes" — is a truncation, not a statement. */
const HANGING_END =
  /\b(into|onto|with|from|by|of|for|to|than|as|and|or|makes?|gives?|equals?|is|are|be|the|a|an|when|that|which)$/i;

const RULE_MARKER =
  /[=÷×−+≤≥<>%]|^to\s+\w+|\bper\b|\bequals?\b|\bis the same as\b|\bmeans\b|\balways\b|\bmust\b|\bmultiply\b|\bdivide\b|\bsubtract\b|\badd\b|\bcount\b|\bshade\b|\bcompares?\b/i;
const sentences = (s) =>
  String(s || "")
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

const MATH_TOKEN = /^[$(]*[\d.,\/]*\d[\d.,\/]*[)%°]*[.,;]?$|^[=+×÷−–\-*x][.,;]?$|^ft³?$|^in³?$/i;
const isMathToken = (t) => MATH_TOKEN.test(t);

/** The maximal run of mathematical tokens around the "=" in a sentence. Token
 *  boundaries are spaces, so a decimal point can never end the match. */
export function extractEquation(sentence) {
  const tokens = String(sentence || "")
    .trim()
    .split(/\s+/);
  const eq = tokens.findIndex((t) => t.includes("="));
  if (eq < 0) return "";
  let lo = eq;
  let hi = eq;
  while (lo - 1 >= 0 && isMathToken(tokens[lo - 1])) lo--;
  while (hi + 1 < tokens.length && isMathToken(tokens[hi + 1])) hi++;
  const span = tokens
    .slice(lo, hi + 1)
    .join(" ")
    .replace(/[.,;:]+$/, "")
    .trim();
  const numbers = span.match(/\d+(?:\.\d+)?/g) || [];
  // An equation needs both sides. "= 3" or "5 =" is a fragment, not an example.
  if (numbers.length < 2) return "";
  if (/^=|=$/.test(span)) return "";
  if (/^[+×÷−–*]/.test(span)) return ""; // "+ 8 = 20" is a clipped equation
  return span;
}

/** The lesson's stated rule, quoted from `launch.conceptIntro.keyIdea` — the
 *  one field where every lesson states its own big idea in its own words. */
export function buildBox2(config) {
  const ci = (config.launch || {}).conceptIntro || {};
  const keySentences = sentences(ci.keyIdea);
  const ruleSentence = keySentences.find((s) => RULE_MARKER.test(s));
  if (!ruleSentence) return { panel: null, reason: "keyIdea states no rule that can be quoted" };

  const rule = shortenVerbatim(ruleSentence, RULE_MAX_WORDS);
  if (!rule) return { panel: null, reason: "rule sentence did not survive shortening" };
  // A quote that opens a bracket it never closes ("a unit ratio (12 inches") is
  // a truncation wearing a rule's clothes, and so is one ending on a word that
  // still needs an object. Neither is shown to a student.
  if (!balanced(rule)) return { panel: null, reason: "rule quote cuts inside a bracket" };
  if (HANGING_END.test(rule)) return { panel: null, reason: "rule quote ends mid-clause" };
  // "To turn a fraction into a percent" is the purpose half of an instruction
  // whose method the quote cut off. An infinitive opener needs its main clause.
  if (/^to\s/i.test(rule) && !/,/.test(rule)) {
    return { panel: null, reason: "rule quote keeps the infinitive opener but not the method" };
  }

  // The meaning is the REST of the lesson's own statement — the remainder of
  // the rule sentence when it was cut, otherwise the next keyIdea sentence.
  let meaning = "";
  const remainder = ruleSentence
    .replace(/\s+/g, " ")
    .trim()
    .slice(rule.length)
    .replace(/^[\s,;:—–]+/, "")
    .replace(/[.;]+$/, "");
  // A remainder that opens with a continuation word ("to bring down; what is
  // left…") is the back half of a clause, and reads as a broken sentence on a
  // classroom board. In that case the lesson's NEXT statement is used instead;
  // if it has none, the lesson gets no box-2 panel rather than a fragment.
  // The remainder is only usable when it starts a NEW statement: a run that
  // begins lower-case ("to bring down; what is left…", "rule, and a fractional
  // edge…") is the back half of a clause and reads as a broken sentence on a
  // classroom board. Otherwise the lesson's next statement is used, and if it
  // has none the lesson gets no box-2 panel rather than a fragment.
  const startsNewStatement = /^[A-Z0-9($]/.test(remainder);
  if (wordCount(remainder) >= 3 && startsNewStatement) meaning = remainder;
  else {
    const next = keySentences.find((k) => k !== ruleSentence);
    if (next) meaning = shortenVerbatim(next, 14);
  }
  if (!meaning)
    return { panel: null, reason: "lesson states no second clause to explain the rule" };
  if (/^(when|if|because|while|once|since|unless|although)\b/i.test(meaning)) {
    return { panel: null, reason: "the explaining clause is dependent, not a whole statement" };
  }
  if (!balanced(meaning) || HANGING_END.test(meaning)) {
    return { panel: null, reason: "the explaining clause is a fragment, not a whole statement" };
  }

  // The example is an equation the lesson's own worked example prints, lifted
  // by TOKENS rather than by a character regex. A character class that stops at
  // "." cuts "$0.60" down to "$0" and "2 × 1.5 = 3" down to "5 = 3" — both of
  // which shipped, and both of which are a wrong number in front of a student.
  const lines = (ci.iDo && Array.isArray(ci.iDo.lines) ? ci.iDo.lines : []).flatMap((l) =>
    sentences(l),
  );
  let example = "";
  for (const line of lines) {
    const found = extractEquation(line);
    if (found) {
      example = found;
      break;
    }
  }
  if (!example) return { panel: null, reason: "worked example prints no single-line equation" };

  return {
    panel: { rule, meaning: meaning.endsWith(".") ? meaning : `${meaning}.`, example },
    reason: null,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

  const ids = coreLessonIds().filter((id) => !only || id === only);
  const skippedBox1 = [];
  const skippedBox2 = [];
  let both = 0;
  let one = 0;
  let none = 0;
  let changed = 0;

  for (const id of ids) {
    const file = join(LESSONS, id, "config.json");
    const raw = readFileSync(file, "utf8");
    const config = JSON.parse(raw);
    const cps = (config.notebook && config.notebook.checkpoints) || [];
    if (cps.length === 0) continue;

    const b1 = buildBox1(config);
    const b2 = buildBox2(config);
    if (!b1.panel) skippedBox1.push(`${id}: box 1 — ${b1.reason}`);
    if (!b2.panel) skippedBox2.push(`${id}: box 2 — ${b2.reason}`);
    const count = (b1.panel ? 1 : 0) + (b2.panel ? 1 : 0);
    if (count === 2) both++;
    else if (count === 1) one++;
    else none++;

    for (const cp of cps) {
      const built = cp.box === 1 ? b1.panel : cp.box === 2 ? b2.panel : null;
      if (built) cp.copyPanel = built;
      else delete cp.copyPanel;
    }

    const next = `${JSON.stringify(config, null, 2)}\n`;
    if (next !== raw) {
      changed++;
      if (!check) writeFileSync(file, next);
    }
  }

  console.log(`Lessons swept: ${ids.length}`);
  console.log(`  both panels: ${both}`);
  console.log(`  one panel:   ${one}`);
  console.log(`  no panel:    ${none}`);
  if (skippedBox1.length) {
    console.log(`\nNo box-1 panel (${skippedBox1.length}):`);
    for (const s of skippedBox1) console.log(`  ${s}`);
  }
  if (skippedBox2.length) {
    console.log(`\nNo box-2 panel (${skippedBox2.length}):`);
    for (const s of skippedBox2) console.log(`  ${s}`);
  }
  if (check && changed > 0) {
    console.error(
      `\nFAIL: ${changed} lesson config(s) are stale — run node scripts/generate-notebook-copy-panels.mjs`,
    );
    process.exit(1);
  }
  if (!check) console.log(`\nRewrote ${changed} config(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
