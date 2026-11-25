// Verifier: duplicated and generic text across units, plus template residue (the "leak" bug class). It REPORTS; it never edits.
//
// A "content string" is a prose string of 8+ words, minus scaffolds that are shared on purpose (see EXEMPT). A string is
// "term-bound" when it mentions one of its own unit's vocabulary terms or a content word of the unit title; a term-bound string
// that repeats elsewhere is a template with the term filled in ("Say two ideas about “cause” ...") and is only counted as info.
// A string that mentions NOTHING of its own unit is "generic". Generic strings are compared across units by exact normalized
// text and by shingle similarity (word 2-shingles, Jaccard >= 0.8, MinHash banding to find candidates).
//
// Findings:
//   DUP_GENERIC_BOILERPLATE warn   a generic string whose twin (exact or near) is in 3 or more other units
//   DUP_NEAR_IDENTICAL      warn   a generic string whose twin is in 1 or 2 other units
//   LEAK_TEMPLATE_RESIDUE   error  an unfilled slot in prose: "[slot]", "{name}", "undefined", "NaN", "[object Object]"
//                                  (cloze markers "{1}" are real content and pass)
//   LEAK_TITLE_TEMPLATE     error  the unit title poured into a stock phrase ("cards for <title>", "steps from <title>",
//                                  "talk <title>"): the bug scripts/audit-bcpss-content.mjs counts as cards_for / steps_from /
//                                  talk_no_about on the esol pack
//   DUP_TEMPLATE_BOUND      info   term-bound strings with a twin elsewhere (reported, never gated)
//   DUP_CHECKED             info   content strings examined (coverage floor)
//
// Hand-read false-positive classes: a short task instruction repeated by design ("Say the mentor sentence, then say a new sentence
// with the same parts.") is boilerplate by this definition and is reported, so the ratchet stops it spreading; two grades that
// define the same everyday word the same way ("to point out how two things are different"); a generic sentence about a card,
// a clue or an audio button. A reviewer decides which are worth rewriting; the baseline only stops the count from rising.
import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { loadTarget } from "./lib/targets.mjs";
import { derivedPrefixes, rootOf, walkStrings } from "./lib/walk.mjs";
import { stemWord, wordsOf } from "./lib/words.mjs";

export const name = "duplicates";
export const coverageCodes = ["DUP_CHECKED"];

// Scaffolds that every unit shares on purpose: supports and tips, level descriptors, commands, frames, connectors, material lists,
// the teacher card, picture cues, word families, tell frames and move stems.
const EXEMPT =
  /(?:^|\.)(?:support|tip|by_level|differentiation|listen_for|checklist|command|connectors|frames|tell_frames|stem|materials|materials_revision|teacher_card|cue|family|label|wida|standards)(?:\[|\.|$)/;
const MIN_WORDS = 8;
const SIM = 0.8;
const BOILERPLATE_OTHER_UNITS = 3;
const BANDS = 8;
const ROWS = 3;
const QUOTED = /\u201c[^\u201d]+\u201d/;
const STOP = new Set(
  "the and for with from that this into about over under unit your their".split(" "),
);

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const at = (code, severity, path, message, evidence = {}) => ({
  code,
  severity,
  path,
  message,
  evidence,
});

function fnv(str, seed = 0) {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
const shingles = (n) => {
  const w = n.split(" ");
  const out = new Set();
  for (let i = 0; i + 1 < w.length; i += 1) out.add(`${w[i]} ${w[i + 1]}`);
  return out;
};
const jaccard = (a, b) => {
  let both = 0;
  for (const x of a) if (b.has(x)) both += 1;
  return both / (a.size + b.size - both);
};
function bandKeys(sh) {
  const sig = [];
  for (let k = 0; k < BANDS * ROWS; k += 1) {
    let min = 0xffffffff;
    for (const s of sh) min = Math.min(min, fnv(s, k * 0x9e3779b1));
    sig.push(min);
  }
  const keys = [];
  for (let b = 0; b < BANDS; b += 1)
    keys.push(`${b}:${sig.slice(b * ROWS, (b + 1) * ROWS).join(",")}`);
  return keys;
}

export const unitTitleOf = (target) =>
  target.unitTitle ?? BCPSS_UNITS.find((u) => u.id === target.id)?.unit_title ?? "";

/** Stem sets of the unit's own vocabulary terms and the content words of its title. */
function ownTerms(target) {
  const terms = [];
  const add = (t) => {
    const stems = wordsOf(t)
      .map(stemWord)
      .filter((w) => w.length > 2);
    if (stems.length) terms.push(stems);
  };
  (target.studio?.vocab || []).forEach((v) => add(v.term));
  for (const l of target.lessons || []) (l.vocab || []).forEach((v) => add(v.term));
  for (const w of wordsOf(unitTitleOf(target)).map(stemWord))
    if (w.length >= 5 && !STOP.has(w)) terms.push([w]);
  return terms;
}

/** Content strings of a unit: [{ path, text, key, termBound }], one per distinct normalized text. */
export function contentStrings(target) {
  const terms = ownTerms(target);
  const seen = new Map();
  // Derived activities copy authored strings by design (see derivedPrefixes); the residue and title-leak checks below still read them.
  const derived = derivedPrefixes(target);
  for (const { path, text } of walkStrings(rootOf(target))) {
    if (EXEMPT.test(path) || derived.some((p) => path.startsWith(p))) continue;
    const key = norm(text);
    if (key.split(" ").length < MIN_WORDS || seen.has(key)) continue;
    const stems = new Set(wordsOf(text).map(stemWord));
    // A curly-quoted span is a term, a clue or a sentence filled into a stock wrapper ("Point to the picture clue “...”"): the
    // wrapper is a template with a slot, so the string counts as term-bound. The quoted text is judged where it is authored.
    const slotted = QUOTED.test(text);
    seen.set(key, {
      path,
      text,
      key,
      termBound: slotted || terms.some((t) => t.every((w) => stems.has(w))),
    });
  }
  return [...seen.values()];
}

/** Cross-unit index over the generic strings of every target. */
export function buildIndex(targets) {
  const exact = new Map(); // generic key -> Set(unitId)
  const bound = new Map(); // term-bound key -> Set(unitId)
  const buckets = new Map(); // band key -> [{ key, units:Set, sh }]
  const entries = new Map();
  for (const t of targets)
    for (const s of contentStrings(t)) {
      const into = s.termBound ? bound : exact;
      if (!into.has(s.key)) into.set(s.key, new Set());
      into.get(s.key).add(t.id);
      if (s.termBound) continue;
      if (!entries.has(s.key)) {
        const entry = { key: s.key, sh: shingles(s.key) };
        entries.set(s.key, entry);
        for (const bk of bandKeys(entry.sh)) {
          if (!buckets.has(bk)) buckets.set(bk, []);
          buckets.get(bk).push(entry);
        }
      }
    }
  return { exact, bound, buckets, entries };
}

function twinUnits(index, s, unitId) {
  const units = new Set(index.exact.get(s.key) || []);
  const sh = shingles(s.key);
  const checked = new Set([s.key]);
  for (const bk of bandKeys(sh))
    for (const cand of index.buckets.get(bk) || []) {
      if (checked.has(cand.key)) continue;
      checked.add(cand.key);
      if (jaccard(sh, cand.sh) >= SIM) for (const u of index.exact.get(cand.key)) units.add(u);
    }
  units.delete(unitId);
  return units;
}

const RESIDUE = /\[slot\]|\{[A-Za-z_]\w*\}|\bundefined\b|\bNaN\b|\[object Object\]/;
const TITLE_PHRASE = /\b(?:cards for|steps from|talk (?!about\b|to\b|with\b|for\b))/i;

let globalIndex = null;
async function defaultIndex() {
  if (!globalIndex) {
    const targets = [];
    for (const u of BCPSS_UNITS) targets.push(await loadTarget(u.id));
    globalIndex = buildIndex(targets);
  }
  return globalIndex;
}

/** `target.peers` (other unit targets) overrides the whole-corpus index; it exists so fixtures need no 162-unit load. */
export async function verify(target) {
  const index = target.peers ? buildIndex([target, ...target.peers]) : await defaultIndex();
  const findings = [];
  const strings = contentStrings(target);
  const title = norm(unitTitleOf(target));
  let boiler = 0;
  let near = 0;
  let templateBound = 0;
  for (const s of strings) {
    if (s.termBound) {
      if ([...(index.bound.get(s.key) || [])].some((u) => u !== target.id)) templateBound += 1;
    } else {
      const twins = twinUnits(index, s, target.id);
      if (twins.size >= BOILERPLATE_OTHER_UNITS) {
        boiler += 1;
        findings.push(
          at(
            "DUP_GENERIC_BOILERPLATE",
            "warn",
            s.path,
            "generic text that names nothing of this unit also appears in other units",
            { units: twins.size + 1, text: s.text.slice(0, 160) },
          ),
        );
      } else if (twins.size) {
        near += 1;
        findings.push(
          at("DUP_NEAR_IDENTICAL", "warn", s.path, "near-identical text appears in another unit", {
            units: twins.size + 1,
            text: s.text.slice(0, 160),
          }),
        );
      }
    }
  }
  for (const { path, text } of walkStrings(rootOf(target))) {
    if (RESIDUE.test(text))
      findings.push(
        at("LEAK_TEMPLATE_RESIDUE", "error", path, "unfilled template slot in text", {
          text: text.slice(0, 160),
        }),
      );
    if (title.length > 5 && TITLE_PHRASE.test(text) && norm(text).includes(title))
      findings.push(
        at("LEAK_TITLE_TEMPLATE", "error", path, "unit title poured into a stock phrase", {
          text: text.slice(0, 160),
        }),
      );
  }
  findings.push(
    at("DUP_TEMPLATE_BOUND", "info", "", "term-bound strings with a twin elsewhere", {
      n: templateBound,
    }),
  );
  findings.push(
    at("DUP_CHECKED", "info", "", "content strings examined", { n: strings.length, boiler, near }),
  );
  return findings;
}

const unit = (id, studio, extra = {}) => ({
  id,
  grade: "3",
  subject: "ELA",
  unitTitle: "Cause and Effect",
  studio: { vocab: [{ term: "cause", tier: 2 }], ...studio },
  lessons: [],
  ...extra,
});
const generic = "Read the clues carefully before you choose the answer that fits best.";
const peers = (n, text = generic) =>
  Array.from({ length: n }, (_, i) =>
    unit(`peer-${i}`, { activities: [{ mission: text }] }, { unitTitle: "Maps" }),
  );

export const fixtures = {
  bad: [
    {
      name: "generic sentence in three other units",
      target: unit("fx-a", { activities: [{ mission: generic }] }, { peers: peers(3) }),
      expect: ["DUP_GENERIC_BOILERPLATE"],
    },
    {
      name: "near-identical sentence in one other unit",
      target: unit(
        "fx-b",
        { activities: [{ mission: generic }] },
        { peers: peers(1, `${generic.replace(".", "")} today.`) },
      ),
      expect: ["DUP_NEAR_IDENTICAL"],
    },
    {
      name: "template residue and a poured-in title",
      target: unit("fx-c", {
        activities: [
          { mission: "Find the [slot] in the story and say what it does." },
          { mission: "Cards for Cause and Effect help you practice each word." },
        ],
      }),
      expect: ["LEAK_TEMPLATE_RESIDUE", "LEAK_TITLE_TEMPLATE"],
    },
  ],
  good: [
    {
      name: "term-bound text shared across units, cloze markers, unique text",
      target: unit(
        "fx-d",
        {
          activities: [
            { mission: "Say two ideas about “cause” and join them with a connector word." },
            { mission: "He has 8 {2} buttons and 3 more are in the box on the table." },
            {
              mission:
                "A river carved the canyon slowly over many thousands of years of patient work.",
            },
          ],
        },
        { peers: peers(4, "Say two ideas about “cause” and join them with a connector word.") },
      ),
    },
  ],
};
