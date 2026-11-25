// Language Demand Analyzer: where might the LANGUAGE of a teacher's task get in the way of the thinking it asks for?
// Pure and deterministic. No network, no AI, no storage. Every finding quotes the teacher's own words (a verbatim
// substring), so a teacher can judge it in a second. The task is never rewritten; `chunkDirections` only splits it.
import { WORDS } from "../content/wordlab-words.js";
import { ACADEMIC, SUBORDINATORS } from "../lang/lexicon.js";
import { fleschKincaid, findPhrase, sentences, stem, tokenize } from "../lang/text.js";
import {
  CHECKS,
  COMMAND_VERBS,
  FRAMES,
  IDIOMS,
  LIMITS,
  MULTI_MEANING,
  PRACTICE,
  PURPOSES,
  VISUALS,
} from "./patterns.js";

export const BANDS = Object.freeze(["K-2", "3-5", "6-8"]);
export const SUBJECTS = Object.freeze(["", "ela", "math", "sci", "ss"]);
export const MAX_CHARS = 6000;
/** Words in a sentence before it is flagged, by band. Authored thresholds, not a measured readability cut. */
export const LONG_SENTENCE = Object.freeze({ "K-2": 10, "3-5": 16, "6-8": 24 });

const PASSIVE =
  /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?((?:[a-z]{4,}(?:ed|en))|known|made|given|taken|shown|seen|found|built|written|chosen|held|kept|told|sold|drawn|grown|done|led|set|put)\b/gi;
const NOT_PASSIVE = new Set([
  "open",
  "even",
  "often",
  "seven",
  "eleven",
  "golden",
  "broken",
  "children",
  "wooden",
  "hidden",
  "tired",
  "scared",
  "excited",
  "interested",
]);
const PRONOUN_START =
  /^(?:this|that|these|those|it|they)\s+(?:is|are|was|were|shows?|means?|can|will|has|have|does|do|makes?|helps?)\b/i;
const NEGATION =
  /\b(?:not only|neither|nor|except|unless|not (?:all|every|always)|none of|no one)\b/gi;
const NOMINAL = /^[a-z]{6,}(?:tion|sion|ment|ness|ity|ance|ence)s?$/;

const byWord = new Map();
for (const w of WORDS) if (!byWord.has(w.w.toLowerCase())) byWord.set(w.w.toLowerCase(), w);
const lookup = (lower) =>
  byWord.get(lower) || byWord.get(stem(lower)) || byWord.get(lower.replace(/(?:ed|ing|es|s)$/, ""));

const sevRank = { high: 0, check: 1 };
let seq = 0;
const finding = (kind, quote, start, why, tip, severity = "check") => ({
  id: `f${++seq}`,
  kind,
  severity,
  quote,
  start,
  end: start + quote.length,
  why,
  tip,
});

/** One flag per long sentence, with the clause markers that make it hard to hold in mind. */
function longSentences(sents, limit, band) {
  const out = [];
  for (const s of sents) {
    const toks = tokenize(s.text);
    const subs = toks.filter((t) => SUBORDINATORS.includes(t.lower)).length;
    const commas = (s.text.match(/,/g) || []).length;
    if (toks.length <= limit && !(subs >= 3 && toks.length > limit * 0.75)) continue;
    out.push(
      finding(
        "long-sentence",
        s.text,
        s.start,
        `${toks.length} words${subs ? `, ${subs} clause word${subs > 1 ? "s" : ""}` : ""}${commas > 2 ? `, ${commas} commas` : ""}. Students must hold every part in mind before they can act.`,
        band === "K-2"
          ? "Say it as two or three short sentences, one idea each."
          : "Split at the clause words into shorter sentences. Keep every number and term.",
        toks.length > limit * 1.4 ? "high" : "check",
      ),
    );
  }
  return out;
}

function passives(text) {
  const out = [];
  for (const m of text.matchAll(PASSIVE)) {
    if (NOT_PASSIVE.has(m[1].toLowerCase())) continue;
    out.push(
      finding(
        "passive",
        m[0],
        m.index,
        "Passive voice hides who does the action, which is harder to parse in a new language.",
        "Where it is natural, say who does what: “the heat melts the ice,” not “the ice is melted.”",
      ),
    );
  }
  return out;
}

function idioms(text) {
  const out = [];
  for (const [phrase, meaning] of IDIOMS)
    for (const m of findPhrase(text, phrase))
      out.push(
        finding(
          "idiom",
          m.text,
          m.start,
          `Figurative or phrasal wording. It usually means “${meaning}”, which a word-by-word reader will miss.`,
          `Keep the idea, say it plainly (“${meaning}”), or teach the phrase on purpose.`,
          "high",
        ),
      );
  return out;
}

function multiMeaning(text, subject, skip = []) {
  const seen = new Set();
  const out = [];
  for (const t of tokenize(text)) {
    const key = t.lower.replace(/s$/, "");
    const entry = MULTI_MEANING[t.lower] || MULTI_MEANING[key];
    if (!entry || seen.has(key) || skip.some((f) => t.start >= f.start && t.end <= f.end)) continue;
    seen.add(key);
    out.push(
      finding(
        "multiple-meaning",
        t.text,
        t.start,
        `“${t.lower}” means “${entry[0]}” in everyday English and “${entry[1]}” in school.`,
        "Check which meaning students know. A quick picture or example for the school meaning is enough.",
        subject ? "high" : "check",
      ),
    );
    if (out.length >= 6) break;
  }
  return out;
}

function nounHeavy(sents) {
  const out = [];
  for (const s of sents) {
    const n = tokenize(s.text).filter((t) => NOMINAL.test(t.lower)).length;
    if (n >= 3)
      out.push(
        finding(
          "noun-heavy",
          s.text,
          s.start,
          `${n} abstract nouns in one sentence (words like “-tion”, “-ment”, “-ity”). The action is buried inside nouns.`,
          "Turn one noun back into a verb: “the production of heat” → “something produces heat”.",
        ),
      );
  }
  return out;
}

function pronounStarts(sents) {
  return sents
    .filter((s, i) => i > 0 && PRONOUN_START.test(s.text))
    .map((s) => {
      const first = s.text.split(/\s+/)[0];
      return finding(
        "reference",
        first,
        s.start,
        `“${first}” points back to something in the sentence before. Learners can lose track of what it names.`,
        `Name it once: “${first} ___” → “This process …”.`,
      );
    });
}

function negations(text) {
  return [...text.matchAll(NEGATION)].map((m) =>
    finding(
      "negation",
      m[0],
      m.index,
      "Negation and exceptions add a second thing to hold in mind.",
      "Say it positively where you can, or put the exception in its own short sentence.",
    ),
  );
}

/** Where directions are stacked: three or more things to do in one sentence. */
function stackedDirections(sents) {
  const out = [];
  for (const s of sents) {
    const verbs = tokenize(s.text).filter((t) => COMMAND_VERBS.has(t.lower));
    const startsWithVerb = verbs.length && verbs[0].start === 0;
    if (verbs.length >= 3 && (startsWithVerb || /\b(?:then|and then|after that)\b/i.test(s.text)))
      out.push(
        finding(
          "stacked-directions",
          s.text,
          s.start,
          `${verbs.length} actions (${verbs.map((v) => v.lower).join(", ")}) in one sentence. Students may do the first and lose the rest.`,
          "Number the steps, one action each. The chunked directions below do exactly that and keep your words.",
          "high",
        ),
      );
  }
  return out;
}

/** Split a sentence of stacked directions into numbered steps made only of the teacher's own words. */
export function chunkDirections(text) {
  const steps = [];
  for (const s of sentences(text)) {
    const toks = tokenize(s.text);
    // A step starts at an action verb that opens the sentence or follows a comma, semicolon, "and" or "then".
    const cuts = toks
      .filter(
        (t, i) =>
          COMMAND_VERBS.has(t.lower) &&
          (i === 0 ||
            /[,;]/.test(s.text.slice(toks[i - 1].end, t.start)) ||
            ["and", "then"].includes(toks[i - 1].lower)),
      )
      .map((t) => t.start);
    if (cuts.length < 3) {
      steps.push(s.text);
      continue;
    }
    const lead = s.text.slice(0, cuts[0]).trim();
    if (lead) steps.push(lead);
    cuts.forEach((c, i) => {
      const part = s.text
        .slice(c, cuts[i + 1] ?? s.text.length)
        .replace(/[\s,;]*(?:\b(?:and|then|after that)\b[\s,;]*)*$/i, "")
        .replace(/[.!?]+$/, "")
        .trim();
      if (part) steps.push(`${part[0].toUpperCase()}${part.slice(1)}.`);
    });
  }
  return steps;
}

/** Words worth pre-teaching: subject words first, then everyday academic words. Glosses come from the Word Lab bank. */
function priorityVocabulary(text, band, subject) {
  const seen = new Set();
  const rows = [];
  for (const t of tokenize(text)) {
    const lower = t.lower;
    const key = stem(lower);
    if (seen.has(key)) continue;
    const w = lookup(lower);
    if (w) {
      if (band !== "K-2" && w.b !== "both" && w.b !== band && !(band === "6-8" && w.b === "3-5"))
        continue;
      seen.add(key);
      rows.push({
        word: w.w,
        tier: w.t,
        subject: w.s,
        gloss: w.d,
        es: w.e,
        cognate: w.c,
        warn: w.c === "false" || w.c === "part" ? w.n : "",
        example: w.x,
        source: "word-bank",
      });
    } else if (ACADEMIC.has(lower) || ACADEMIC.has(key)) {
      seen.add(key);
      rows.push({
        word: lower,
        tier: 2,
        subject: "",
        gloss: "",
        es: "",
        cognate: "",
        warn: "",
        example: "",
        source: "academic",
      });
    }
  }
  const score = (r) =>
    (r.source === "word-bank" ? 0 : 5) +
    (r.tier === 3 ? 0 : 1) +
    (subject && r.subject === subject ? -2 : 0);
  return rows.sort((a, b) => score(a) - score(b)).slice(0, 10);
}

export function detectPurposes(text) {
  return PURPOSES.filter((p) => p.test.test(text)).slice(0, 3);
}

/** Analyze a teacher's text. Returns data only; the view decides how to show it. */
export function analyzeDemand(text, { band = "6-8", subject = "" } = {}) {
  const clean = String(text ?? "").slice(0, MAX_CHARS);
  const b = BANDS.includes(band) ? band : "6-8";
  const sents = sentences(clean);
  const toks = tokenize(clean);
  if (!toks.length) return { empty: true, band: b, subject, limits: LIMITS };
  seq = 0;
  const idiomFlags = idioms(clean);
  const findings = [
    ...stackedDirections(sents),
    ...longSentences(sents, LONG_SENTENCE[b], b),
    ...idiomFlags,
    ...multiMeaning(clean, subject, idiomFlags),
    ...passives(clean),
    ...nounHeavy(sents),
    ...negations(clean),
    ...pronounStarts(sents),
  ].sort((x, y) => sevRank[x.severity] - sevRank[y.severity] || x.start - y.start);
  const purposes = detectPurposes(clean);
  const picked = purposes.length ? purposes : [PURPOSES.find((p) => p.id === "describe")];
  return {
    empty: false,
    band: b,
    subject,
    stats: {
      words: toks.length,
      sentences: sents.length,
      avgSentence: Math.round((toks.length / Math.max(1, sents.length)) * 10) / 10,
      gradeEstimate: Math.max(0, Math.round(fleschKincaid(clean) * 10) / 10),
    },
    findings,
    vocabulary: priorityVocabulary(clean, b, subject),
    purposes: picked.map((p) => ({
      id: p.id,
      label: p.label,
      frames: FRAMES[p.id],
      check: CHECKS[p.id],
      practice: PRACTICE[p.id],
    })),
    visuals: VISUALS.filter((v) => v.test.test(clean))
      .map((v) => v.idea)
      .slice(0, 3),
    steps: chunkDirections(clean),
    limits: LIMITS,
  };
}
