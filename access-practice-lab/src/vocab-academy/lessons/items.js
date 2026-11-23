// Vocabulary Academy — pure item builders shared by the assessment forms and by the lesson player's fallbacks.
// Everything here is deterministic given (unit, rng) and never touches the DOM. An item is
// { id, type, wordId, dim, stem, choices, answer, explain, hint?, form, src } where `answer` is the 0-based index
// into `choices`. Builders return null (never a weak item) when the data cannot support an unambiguous question;
// callers fall back to another type and record the reason in a warnings array.
import { bandOfGrade, wordSlug } from "../contract.js";

export const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

/** Evidence dimension each item type provides (contract.js DIMS). */
export const TYPE_DIM = {
  cloze: "ctx",
  "def-to-word": "mean",
  "word-to-def": "mean",
  fit: "mean",
  synonym: "mean",
  "morph-part": "morph",
  "morph-base": "morph",
  passage: "ctx",
  find: "mean",
};

/** Choices count: 3 for K-2, otherwise 4 (SPEC §3.2). */
export const choiceCount = (unit) => (bandOfGrade(String(unit.grade)) === "early" ? 3 : 4);

/**
 * Shuffle answer + distractors into choices. Refuses (null) when a distractor equals the answer after
 * normalising, or when the pool cannot fill the choice count; 4 degrades to 3, never below.
 * `note` reports a degrade so the caller can warn.
 */
export function pickChoices(answer, candidates, want, rng, avoid = []) {
  const seen = new Set([norm(answer), ...avoid.map(norm)]);
  const pool = [];
  for (const c of candidates) {
    const k = norm(c);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    pool.push(c);
  }
  let count = want;
  let note = "";
  if (pool.length < count - 1 && count > 3 && pool.length >= 2) {
    count = 3;
    note = "choices-reduced";
  }
  if (pool.length < count - 1) return null;
  const choices = rng.shuffle([answer, ...rng.shuffle(pool).slice(0, count - 1)]);
  const index = choices.indexOf(answer);
  if (index < 0 || new Set(choices.map(norm)).size !== choices.length) return null;
  return { choices, answer: index, note };
}

const others = (unit, word) => unit.words.filter((w) => w.id !== word.id);
const idFor = (unit, form, type, word, n = 1) =>
  `${unit.id}:${form}:${type}:${wordSlug(word.hw)}${n > 1 ? `.${n}` : ""}`;

function make(unit, form, type, word, built, extra) {
  if (!built) return null;
  return {
    id: idFor(unit, form, type, word, extra.n),
    type,
    wordId: word.id,
    hw: word.hw,
    dim: TYPE_DIM[type],
    form,
    choices: built.choices,
    answer: built.answer,
    note: built.note || "",
    ...extra.fields,
  };
}

/** Surface forms that may fill a blank: other words' cloze fillers (same grammar slot) and headwords. */
function fillerPool(unit, word) {
  const bad = new Set([...(word.syn || []), norm(word.hw)].map(norm));
  return others(unit, word)
    .flatMap((w) => [w.cloze?.f, w.hw])
    .filter((x) => x && !bad.has(norm(x)));
}

const clozeOf = (word, variant) => (variant === 2 ? word.cloze2 : word.cloze);

export function clozeItem(unit, word, rng, form, variant = 1) {
  const c = clozeOf(word, variant);
  if (!c?.s || !c.f || (c.s.match(/___/g) || []).length !== 1) return null;
  // Distractors must differ from the answer in surface form, not only in headword.
  const built = pickChoices(c.f, fillerPool(unit, word), choiceCount(unit), rng, [word.hw]);
  const ans = built && built.choices[built.answer];
  if (!built || ans !== c.f) return null;
  return make(unit, form, "cloze", word, built, {
    n: variant,
    fields: {
      stem: c.s,
      explain: `${c.s.replace("___", c.f)} Here "${word.hw}" fits because it means: ${word.def}`,
      hint: `Look for the clue in the sentence. The missing word means: ${word.def}`,
    },
  });
}

export function defToWordItem(unit, word, rng, form) {
  const built = pickChoices(
    word.hw,
    others(unit, word).map((w) => w.hw),
    choiceCount(unit),
    rng,
    word.syn || [],
  );
  return make(unit, form, "def-to-word", word, built, {
    fields: {
      stem: word.def,
      explain: `"${word.hw}" means: ${word.def}`,
      hint: `Say each word in a sentence and check which one matches this meaning.`,
    },
  });
}

export function wordToDefItem(unit, word, rng, form) {
  const built = pickChoices(
    word.def,
    others(unit, word).map((w) => w.def),
    choiceCount(unit),
    rng,
  );
  return make(unit, form, "word-to-def", word, built, {
    fields: {
      stem: word.hw,
      explain: `"${word.hw}" means: ${word.def}`,
      hint: `Think of how you heard "${word.hw}" used: ${word.ex}`,
    },
  });
}

const capFirst = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
/** A definition as the end of "<word> means …": first letter lowered (unless it starts a name or "I"), no final period. */
const asEnding = (def) => {
  const d = String(def || "").trim().replace(/[.!]+$/, "");
  return /^(I\b|[A-Z]{2})/.test(d) ? d : d.charAt(0).toLowerCase() + d.slice(1);
};
const means = (hw, def) => `${capFirst(hw)} means ${asEnding(def)}.`;

/**
 * Finding Meanings (the opening exercise of a Wordly Wise-style lesson): two beginnings ("<word> means", "<other>
 * means") and two endings (the word's meaning, a third word's meaning) make four sentences; exactly one is true.
 * K-2 gets three of the four. Null when the unit has fewer than three other words with distinct meanings.
 */
export function findMeaningItem(unit, word, rng, form) {
  const pool = rng.shuffle(others(unit, word).filter((w) => w.def && norm(w.def) !== norm(word.def)));
  const x = pool[0];
  const y = pool.find((w) => w !== x && norm(w.hw) !== norm(x?.hw));
  if (!x || !y || !word.def) return null;
  const right = means(word.hw, word.def);
  const wrong = [means(word.hw, y.def), means(x.hw, word.def), means(x.hw, y.def)];
  const built = pickChoices(right, wrong, choiceCount(unit), rng);
  if (!built || built.choices[built.answer] !== right) return null;
  return make(unit, form, "find", word, built, {
    fields: {
      stem: `${capFirst(word.hw)} means … / ${capFirst(x.hw)} means …`,
      explain: `"${word.hw}" means: ${word.def}`,
      hint: `Think about how "${word.hw}" is used: ${word.ex}`,
    },
  });
}

const YES = "Yes, the word fits";
const NO = "No, the word does not fit";
/** Judge a sentence: the correct sentence (ex/ex2) or the plain misuse. `useMisuse` picks which. */
export function fitItem(unit, word, rng, form, { useMisuse, variant = 1 } = {}) {
  const good = variant === 2 ? word.ex2 || word.ex : word.ex;
  const sentence = useMisuse ? word.misuse?.s : good;
  if (!sentence) return null;
  const choices = [YES, NO];
  return make(
    unit,
    form,
    "fit",
    word,
    { choices, answer: useMisuse ? 1 : 0 },
    {
      n: variant,
      fields: {
        stem: sentence,
        explain: useMisuse
          ? word.misuse.why || `"${word.hw}" means: ${word.def}`
          : `Yes. In this sentence "${word.hw}" is used the way it is meant: ${word.def}`,
        hint: `Remember: "${word.hw}" means ${word.def}`,
        fixed: true, // two fixed choices, never shuffled
      },
    },
  );
}

export function synonymItem(unit, word, rng, form) {
  const syn = (word.syn || []).find((s) => norm(s) !== norm(word.hw));
  if (!syn) return null;
  const banned = [...(word.syn || []), ...(word.ant || [])];
  const pool = others(unit, word).flatMap((w) => [...(w.syn || []), ...(w.ant || [])]);
  const built = pickChoices(
    syn,
    pool,
    choiceCount(unit),
    rng,
    banned.filter((b) => norm(b) !== norm(syn)),
  );
  return make(unit, form, "synonym", word, built, {
    fields: {
      stem: word.hw,
      explain: `"${syn}" is close in meaning to "${word.hw}": ${word.def}`,
      hint: `Which choice could replace "${word.hw}" in a sentence?`,
    },
  });
}

/** Meaning of one word part (A: the ending/last part, B: the base). null when the word has no usable parts. */
export function morphItem(unit, word, rng, form, which = "last") {
  const segs = (word.morph?.segs || []).filter((s) => s.s && s.m);
  if (segs.length < 2) return null;
  const seg =
    which === "base" ? segs.find((s) => s.t === "base") || segs[0] : segs[segs.length - 1];
  const pool = [
    ...unit.words.flatMap((w) => (w.morph?.segs || []).filter((s) => s !== seg).map((s) => s.m)),
    ...(unit.study?.parts || []).map((p) => p.m),
  ];
  const built = pickChoices(seg.m, pool, choiceCount(unit), rng, [
    ...segs.map((s) => s.m).filter((m) => m !== seg.m),
  ]);
  return make(unit, form, which === "base" ? "morph-base" : "morph-part", word, built, {
    fields: {
      stem: `${word.hw} = ${segs.map((s) => s.s).join(" + ")}`,
      part: seg.s,
      explain: `In "${word.hw}", ${seg.s} means "${seg.m}".${word.morph.note ? ` ${word.morph.note}` : ""}`,
      hint: `Break the word into its parts, then think about what ${seg.s} adds.`,
    },
  });
}

/** A passage question as an item. wordId is set only when one unit word is clearly the target of the question. */
export function passageItem(unit, q, form) {
  const choices = q.choices || [];
  if (!q.q || choices.length < 2 || new Set(choices.map(norm)).size !== choices.length) return null;
  if (!Number.isInteger(q.a) || q.a < 0 || q.a >= choices.length) return null;
  return {
    id: `${unit.id}:${form}:passage:${q.id}`,
    type: "passage",
    wordId: wordInText(unit, q.q),
    dim: "ctx",
    form,
    stem: q.q,
    choices: [...choices],
    answer: q.a,
    explain: q.why || "",
    hint: "Go back to the passage and find the sentence that helps.",
    skill: q.skill,
    passageId: unit.passage?.id || null,
    note: "",
  };
}

/** The single unit word named in a question, or null (0 or several matches). Inflected forms count. */
export function wordInText(unit, text) {
  const t = ` ${norm(text).replace(/[^a-z\s'-]/g, " ")} `;
  const hits = unit.words.filter((w) => {
    const hw = norm(w.hw);
    const stem = hw.length > 6 ? hw.slice(0, hw.length - 2) : hw;
    return new RegExp(`\\s${stem.replace(/[-]/g, "\\-")}[a-z]*\\s`).test(t);
  });
  return hits.length === 1 ? hits[0].id : null;
}

// ── relationship / sense / evidence items (lessons B-D; not used by the assessment forms) ─────────────────────

Object.assign(TYPE_DIM, { group: "mean", sense: "mean", analogy: "mean", evidence: "ctx", order: "mean" });

const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc)\./g;
const split = (text) =>
  String(text)
    .replace(ABBR, "$1\u0001")
    .split(/(?<=[.!?])["”']?\s+/)
    .map((x) => x.replace(/\u0001/g, ".").trim())
    .filter(Boolean);

/** Which semantic group does this word belong in? Only for words that sit in exactly one authored group. */
export function groupItem(unit, word, rng, form = "L") {
  const groups = unit.relations?.groups || [];
  const mine = groups.filter((g) => g.ids.includes(word.id));
  if (groups.length < 2 || mine.length !== 1) return null;
  const labels = groups.map((g) => g.label);
  if (new Set(labels.map(norm)).size !== labels.length) return null;
  const choices = rng.shuffle(labels);
  return {
    id: `${unit.id}:${form}:group:${wordSlug(word.hw)}`,
    type: "group", wordId: word.id, hw: word.hw, dim: "mean", form, stem: word.hw, choices,
    answer: choices.indexOf(mine[0].label),
    explain: `"${word.hw}" belongs with: ${mine[0].label}. It means: ${word.def}`,
    hint: `Think about what "${word.hw}" means: ${word.def}`, note: "",
  };
}

/** Multiple meanings: match each taught sense to the sentence that shows it. Needs a real second sense. */
export function senseItem(unit, word, rng, form = "L", which = 0) {
  const sense = word.senses?.[0];
  if (!sense?.def || !sense.example || !word.ex) return null;
  const pair = which === 0 ? { def: word.def, good: word.ex, other: sense.example } : { def: sense.def, good: sense.example, other: word.ex };
  if (norm(pair.good) === norm(pair.other)) return null;
  const choices = rng.shuffle([pair.good, pair.other]);
  return {
    id: `${unit.id}:${form}:sense:${wordSlug(word.hw)}.${which}`,
    type: "sense", wordId: word.id, dim: "mean", form, stem: `${word.hw}: ${pair.def}`, choices,
    answer: choices.indexOf(pair.good),
    explain: `"${word.hw}" has more than one meaning. This sentence shows: ${pair.def}`,
    hint: `Read both sentences and ask which meaning of "${word.hw}" fits.`, note: "",
  };
}

/** Put a shades ladder in order, mildest to strongest as authored. answer = indexes into `choices` in order. */
export function orderItem(unit, shade, rng, form = "L") {
  const ladder = shade?.ladder || [];
  if (ladder.length < 3 || new Set(ladder.map(norm)).size !== ladder.length) return null;
  let choices = rng.shuffle(ladder);
  if (choices.join() === ladder.join()) choices = [...ladder].reverse();
  return {
    id: `${unit.id}:${form}:order:${wordSlug(shade.label)}`,
    type: "order", wordId: null, dim: "mean", form, stem: shade.label, choices,
    answer: ladder.map((w) => choices.indexOf(w)),
    explain: `From first to last: ${ladder.join(" → ")}.`,
    hint: "Start with the word that has the least of this quality.", note: "",
  };
}

const wordIn = (unit, term) => unit.words.find((w) => norm(w.hw) === norm(term));
const pairsOf = (unit) => {
  const out = [];
  for (const w of unit.words) {
    for (const s of (w.syn || []).slice(0, 1)) out.push({ a: w.hw, b: s, rel: "synonyms", wordId: w.id });
    for (const s of (w.ant || []).slice(0, 1)) out.push({ a: w.hw, b: s, rel: "opposites", wordId: w.id });
  }
  return out;
};

/** Authored analogies first, then analogies generated from syn/ant data until `min` exist (grades 3+). */
export function analogyItems(unit, rng, form = "L", min = 5) {
  const items = [];
  const seen = new Set();
  const push = (stem, answerText, pool, relation, wordId) => {
    if (seen.has(norm(stem))) return;
    const built = pickChoices(answerText, pool, 4, rng);
    if (!built || built.choices.length < 3) return;
    seen.add(norm(stem));
    items.push({
      id: `${unit.id}:${form}:analogy:${items.length + 1}`,
      type: "analogy", wordId, dim: "mean", form, stem, choices: built.choices, answer: built.answer,
      explain: `${stem} and ${answerText} show the same relationship: ${relation}.`,
      hint: `First say how the pair "${stem}" is related. Then find the pair with the same relationship.`, relation, note: "",
    });
  };
  for (const a of unit.relations?.analogies || []) {
    const idx = a.choices?.indexOf(a.a);
    if (idx < 0 || new Set((a.choices || []).map(norm)).size !== a.choices.length) continue;
    const first = norm(a.stem.split(":")[0]);
    push(a.stem, a.a, a.choices.filter((c) => c !== a.a), a.relation || "same relationship", wordIn(unit, first)?.id || null);
  }
  const pairs = pairsOf(unit);
  const key = (p) => [norm(p.a), norm(p.b)].sort().join("|");
  const taken = new Set(items.map((i) => i.stem.split(":").map(norm).sort().join("|")));
  for (const p of rng.shuffle(pairs)) {
    if (items.length >= min) break;
    if (taken.has(key(p))) continue;
    taken.add(key(p));
    const same = pairs.filter((q) => q.rel === p.rel && q.a !== p.a && q.b !== p.b && q.a !== p.b && q.b !== p.a);
    const diff = pairs.filter((q) => q.rel !== p.rel && q.a !== p.a && q.b !== p.a && q.a !== p.b && q.b !== p.b);
    if (!same.length || diff.length < 2) continue;
    const ans = rng.pick(same);
    push(`${p.a} : ${p.b}`, `${ans.a} : ${ans.b}`, diff.map((q) => `${q.a} : ${q.b}`), p.rel, p.wordId);
  }
  return items;
}

/** Evidence selection: pick the passage sentence that uses the word (clues sit around it). */
export function evidenceItem(unit, word, rng, form = "L") {
  const sentences = (unit.passage?.paras || []).flatMap(split);
  const stem = norm(word.hw).length > 6 ? norm(word.hw).slice(0, -2) : norm(word.hw);
  const re = new RegExp(`\\b${reEsc(stem)}[a-z]*\\b`, "i");
  const hits = sentences.filter((s) => re.test(s));
  if (hits.length !== 1) return null;
  const targetRe = new RegExp(unit.words.map((w) => `\\b${reEsc(norm(w.hw).slice(0, Math.max(4, norm(w.hw).length - 2)))}`).join("|"), "i");
  const pool = sentences.filter((s) => !targetRe.test(s) && s.split(" ").length > 4);
  const built = pickChoices(hits[0], pool, 4, rng);
  if (!built) return null;
  return {
    id: `${unit.id}:${form}:evidence:${wordSlug(word.hw)}`,
    type: "evidence", wordId: word.id, dim: "ctx", form, stem: word.hw, choices: built.choices, answer: built.answer,
    explain: `This sentence uses "${word.hw}", so the clues around it show what it means: ${word.def}`,
    hint: `Look for the sentence where the passage uses "${word.hw}" and read the clues near it.`, note: "",
  };
}

TYPE_DIM.antonym = "mean";
/** Opposite of the word, only when the data names one. Distractors are other words' synonyms (never this word's own). */
export function antonymItem(unit, word, rng, form = "L") {
  const ant = (word.ant || []).find((a) => norm(a) !== norm(word.hw));
  if (!ant) return null;
  const pool = others(unit, word).flatMap((w) => [...(w.syn || []), w.hw]);
  const built = pickChoices(ant, pool, choiceCount(unit), rng, [...(word.syn || []), ...(word.ant || [])]);
  return make(unit, form, "antonym", word, built, {
    fields: {
      stem: word.hw,
      explain: `"${ant}" is the opposite of "${word.hw}": "${word.hw}" means ${word.def}`,
      hint: `Think of a person who is the opposite of "${word.hw}". What word describes them?`,
    },
  });
}

/** Every unit word that appears in `text` (inflected forms count). */
export function wordsInText(unit, text) {
  const t = ` ${norm(text).replace(/[^a-z\s'-]/g, " ")} `;
  return unit.words.filter((w) => {
    const hw = norm(w.hw);
    const stem = hw.length > 6 ? hw.slice(0, hw.length - 2) : hw;
    return new RegExp(`\\s${stem.replace(/-/g, "\\-")}[a-z]*\\s`).test(t);
  });
}
