// Vocabulary Academy — lexical helpers for the content validator (pure, no I/O).
// Stem-aware word-form matching, sentence/text hygiene detectors, readability.
// Spec: docs/vocab-academy/SPEC.md §3.
//
// Two matchers, on purpose:
//   strictForms(word)   headword + generated inflections + family words. Used where a HIT is a defect
//                       (a definition that contains the headword). Exact tokens only, so it never
//                       accuses a definition of using a different word that merely starts the same way.
//   occursIn(text, w)   strictForms plus a stem-prefix match. Used where a MISS is the defect (an example
//                       sentence that never uses the word). Tolerant, so irregular and derived forms do
//                       not raise false alarms; the family list is the escape hatch.

/** Common irregular forms (base -> forms). Family lists cover the rest. */
const IRREGULAR = {
  be: "is am are was were been being",
  go: "goes went gone going",
  do: "does did done doing",
  have: "has had having",
  run: "ran running runs",
  eat: "ate eaten eating",
  see: "saw seen seeing",
  take: "took taken taking",
  give: "gave given giving",
  make: "made making",
  say: "said saying",
  think: "thought thinking",
  know: "knew known knowing",
  bring: "brought bringing",
  buy: "bought buying",
  catch: "caught catching",
  teach: "taught teaching",
  find: "found finding",
  sit: "sat sitting",
  stand: "stood standing",
  tell: "told telling",
  build: "built building",
  grow: "grew grown growing",
  draw: "drew drawn drawing",
  fly: "flew flown flying flies",
  fall: "fell fallen falling",
  feel: "felt feeling",
  keep: "kept keeping",
  leave: "left leaving",
  lose: "lost losing",
  meet: "met meeting",
  sleep: "slept sleeping",
  speak: "spoke spoken speaking",
  swim: "swam swum swimming",
  write: "wrote written writing",
  hold: "held holding",
  wake: "woke woken waking",
  ride: "rode ridden riding",
  hide: "hid hidden hiding",
  begin: "began begun beginning",
  choose: "chose chosen choosing",
  forget: "forgot forgotten forgetting",
  hear: "heard hearing",
  send: "sent sending",
  spend: "spent spending",
  lead: "led leading",
  read: "read reading",
  get: "got gotten getting",
  put: "putting",
  cut: "cutting",
  set: "setting",
  let: "letting",
  hit: "hitting",
  child: "children",
  man: "men",
  woman: "women",
  mouse: "mice",
  foot: "feet",
  tooth: "teeth",
  goose: "geese",
  person: "people",
  leaf: "leaves",
  life: "lives",
  wolf: "wolves",
  knife: "knives",
  half: "halves",
  good: "better best",
  bad: "worse worst",
  little: "less least",
  many: "more most",
  much: "more most",
};

const VOWELS = /[aeiou]/;
const isCons = (c) => /[a-z]/.test(c) && !VOWELS.test(c);

/** All plausible surface forms of one lowercase base token. */
export function inflections(base, pos = "") {
  const b = base.toLowerCase();
  const out = new Set([b, ...(IRREGULAR[b] ? IRREGULAR[b].split(" ") : [])]);
  const minimal = b.length <= 3 && !["n", "v", "adj"].includes(pos);
  out.add(`${b}s`);
  if (minimal) return out;
  const last = b.at(-1);
  const prev = b.at(-2) ?? "";
  out.add(`${b}es`);
  out.add(`${b}ed`);
  out.add(`${b}ing`);
  out.add(`${b}er`);
  out.add(`${b}est`);
  out.add(`${b}ly`);
  if (last === "e") {
    out.add(`${b}d`);
    out.add(`${b}r`);
    out.add(`${b}st`);
    out.add(`${b.slice(0, -1)}ing`);
    if (b.endsWith("le")) out.add(`${b.slice(0, -1)}y`);
  }
  if (last === "y" && isCons(prev)) {
    const s = b.slice(0, -1);
    for (const x of ["ies", "ied", "ier", "iest", "ily", "iness"]) out.add(`${s}${x}`);
  }
  if (b.endsWith("ic")) out.add(`${b}ally`);
  if (b.endsWith("ful")) out.add(`${b.slice(0, -1)}ly`);
  // consonant-vowel-consonant: stop -> stopped / stopping / bigger / biggest
  if (
    b.length >= 3 &&
    isCons(last) &&
    !"wxy".includes(last) &&
    VOWELS.test(prev) &&
    isCons(b.at(-3))
  ) {
    for (const x of ["ed", "ing", "er", "est", "y"]) out.add(`${b}${last}${x}`);
  }
  return out;
}

/** Lowercase word tokens of a text; possessive 's is dropped. Hyphenated words yield both parts. */
export function tokensOf(text) {
  const m = String(text ?? "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .match(/[a-z]+(?:'[a-z]+)*/g);
  return (m ?? []).map((t) => t.replace(/'s$/, "").replace(/'$/, "").replace(/n't$/, "n"));
}

const baseTokens = (hw) => tokensOf(hw);

/** Strict generated forms for each headword token, plus family words (and their inflections). */
export function strictForms(word) {
  const per = baseTokens(word.hw).map((t) => inflections(t, word.pos));
  const family = new Set();
  for (const f of word.family ?? []) {
    if (!f || typeof f.w !== "string") continue;
    const toks = baseTokens(f.w);
    if (toks.length === 1) for (const x of inflections(toks[0], f.pos)) family.add(x);
    else family.add(toks.join(" "));
  }
  return { per, family };
}

const looseStems = (base) => {
  if (base.length < 4) return [];
  const stems = [base];
  if (/[ey]$/.test(base)) stems.push(base.slice(0, -1));
  if (base.endsWith("le")) stems.push(base.slice(0, -2));
  return stems.filter((s) => s.length >= 3);
};
/** Prefix match tolerant of derivation ("cautious" ~ "cautiously", "persist" ~ "persistence"). */
export function looseMatch(tok, base) {
  if (base.length < 4) return false;
  return looseStems(base).some((s) => tok.startsWith(s) && tok.length - s.length <= 5);
}

const tokMatches = (tok, base, forms, loose) => forms.has(tok) || (loose && looseMatch(tok, base));

/**
 * True when `text` uses the word: every headword token appears in a strict form (or, with `loose`,
 * a stem match), or any family form appears. Multi-word headwords need every token.
 */
export function occursIn(text, word, { loose = true, family = true } = {}) {
  const toks = tokensOf(text);
  const set = new Set(toks);
  const { per, family: fam } = strictForms(word);
  const bases = baseTokens(word.hw);
  const hit =
    bases.length > 0 &&
    per.every((forms, i) => toks.some((t) => tokMatches(t, bases[i], forms, loose)));
  if (hit) return true;
  if (!family) return false;
  for (const f of fam) {
    if (f.includes(" ") ? tokensOf(text).join(" ").includes(f) : set.has(f)) return true;
  }
  return false;
}

/** The first matching headword/family token of a word in `text`, or null (for messages). */
export function firstForm(text, word, opts) {
  if (!occursIn(text, word, opts)) return null;
  return word.hw;
}

const STOP = new Set(
  "with from that this over under into about have been were what when where which their there them then than they your some more most very will would could should of the and for are not but you all can her was one our out day get has him his how its let may new now old see two way who did".split(
    " ",
  ),
);

/** Does a DEFINITION contain the headword or an obvious inflection/family form? Returns the offending token. */
export function definitionLeak(def, word) {
  const toks = tokensOf(def);
  const { per, family } = strictForms(word);
  const bases = baseTokens(word.hw);
  if (bases.length === 1) {
    const hit = toks.find((t) => per[0].has(t) || family.has(t));
    return hit ?? null;
  }
  const joined = toks.join(" ");
  if (joined.includes(bases.join(" "))) return bases.join(" ");
  for (let i = 0; i < bases.length; i++) {
    if (bases[i].length < 4 || STOP.has(bases[i])) continue;
    const hit = toks.find((t) => per[i].has(t));
    if (hit) return hit;
  }
  for (const f of family) if (f.includes(" ") ? joined.includes(f) : toks.includes(f)) return f;
  return null;
}

/** Is `f` (a cloze surface form) a plausible form of the headword? */
export function plausibleSurface(f, word) {
  const toks = tokensOf(f);
  if (!toks.length) return false;
  const bases = baseTokens(word.hw);
  const { per, family } = strictForms(word);
  if (bases.length > 1) {
    return bases.every((b, i) => toks.some((t) => per[i].has(t) || looseMatch(t, b)));
  }
  return (
    toks.length === 1 &&
    (per[0].has(toks[0]) || family.has(toks[0]) || looseMatch(toks[0], bases[0]))
  );
}

// ── text hygiene ────────────────────────────────────────────────────────────
export const normSentence = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const wordCount = (s) =>
  (String(s ?? "").match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9À-ɏ]+)*/g) ?? []).length;

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|Mt|No)\./g;
/** Split a paragraph into sentences (abbreviation-aware, quote-aware). */
export function sentencesOf(text) {
  const t = String(text ?? "").replace(ABBR, "$1\u0001");
  return t
    .split(/(?<=[.!?]["'”’)]?)\s+(?=["'“‘(]?[A-Z0-9])/)
    .map((s) => s.replace(/\u0001/g, ".").trim())
    .filter(Boolean);
}

const PLACEHOLDER = [
  [/\b(?:TODO|TBD|FIXME|XXX|lorem|ipsum|placeholder)\b/i, "placeholder token"],
  [/\.\.\./, "'...'"],
  [/\[(?:word|target|blank|name|sentence|text)[^\]]*\]/i, "bracketed placeholder"],
  [/\bexample sentence\b/i, "'example sentence'"],
  [/\binsert\b/i, "'insert'"],
  [/([^\s_\-.=*])\1\1/, "3+ repeated characters"],
];
/** Placeholder-looking text, or null. `hw` exempts a target word that legitimately matches (e.g. "insert"). */
export function placeholderHit(text, hw = "") {
  const t = String(text ?? "");
  for (const [re, label] of PLACEHOLDER) {
    if (label === "'insert'" && /insert/i.test(hw)) continue;
    if (re.test(t)) return label;
  }
  return null;
}

const MOJIBAKE = /[ÂÃ][\u0080-¿]|â€|â\u0080|�|[\u0080-\u009F]|ï»¿/;
export const hasMojibake = (s) => MOJIBAKE.test(String(s ?? ""));
export const hasDoubleSpace = (s) =>
  /\S {2,}\S/.test(String(s ?? "")) || /\t/.test(String(s ?? ""));

/** Sentence shape problems for a student-facing sentence field; [] when fine. */
export function sentenceShape(s, { cloze = false } = {}) {
  const t = String(s ?? "").trim();
  const out = [];
  if (!t) return out;
  const first = t.replace(/^["'“‘(¿¡]+/, "");
  if (!(cloze && first.startsWith("___")) && !/^[\p{Lu}0-9]/u.test(first))
    out.push("does not start with a capital letter");
  if (!/[.?!]["'”’)]*$/.test(t) && !/["”’']$/.test(t))
    out.push("does not end with . ? ! or a quote");
  return out;
}

// ── readability ─────────────────────────────────────────────────────────────
function localFK(text) {
  const syll = (w) => {
    let x = w.toLowerCase().replace(/[^a-z]/g, "");
    if (!x) return 0;
    if (x.length <= 3) return 1;
    x = x.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
    const g = x.match(/[aeiouy]{1,2}/g);
    return Math.max(1, g ? g.length : 1);
  };
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => /[A-Za-z]/.test(s));
  const words = text.match(/[A-Za-z']+/g) || [];
  if (!sentences.length || !words.length) return 0;
  const n = words.reduce((a, w) => a + syll(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (n / words.length) - 15.59;
}

let fk = null;
/** Flesch-Kincaid grade via tools/lib/copy-scan.mjs when it loads (it needs the engine workspace), else an identical local copy. */
export async function loadReadability() {
  if (fk) return fk;
  try {
    fk = (await import("./copy-scan.mjs")).fleschKincaid;
  } catch {
    fk = localFK;
  }
  return fk;
}
