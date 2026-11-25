// Writing Lab coach — pure analysis of a student paragraph (no DOM, no network; runs in the browser and in node tests).
// One source of truth for the TWR moves the Draft, Revise and Publish views report.
// Contract: analyzeParagraph(text, ctx) → { sentences, stats, moves, coverage, nudges }. Never scores the student.

const STOP = new Set(
  "about after also another because been before being both but by can could does doing down each from have having here into just more most much must only other over same should some such than that their them then there these they this those through very what when where which while will with would your".split(
    " ",
  ),
);
const DEFAULT_TRANSITIONS = [
  "first",
  "second",
  "third",
  "next",
  "then",
  "after that",
  "finally",
  "also",
  "in addition",
  "for example",
  "for instance",
  "as a result",
  "however",
  "in conclusion",
  "to sum up",
  "because of this",
  "therefore",
  "later",
  "meanwhile",
  "in fact",
  "most importantly",
  "on the other hand",
];
const SUBORDINATORS =
  "when|although|before|after|since|if|while|unless|even though|once|until|whenever|because|as soon as";
const SUB_START = new RegExp(`^["']?(${SUBORDINATORS})\\b[^.!?]*,`, "i");
const BBS = /\b(because|but|so)\b/i;
const DETERMINERS = /^(a|an|the|my|our|one|his|her|their|its)\b/i;
const LONG_SENTENCE = { l1_2: 25, l3_4: 35, l5_6: 45 };
const MIN_WORDS = { l1_2: 10, l3_4: 35, l5_6: 60 };

export const MOVES = [
  { k: "transition", label: "Transition" },
  { k: "bbs", label: "Because / but / so" },
  { k: "sub", label: "Clue-word start" },
  { k: "appos", label: "Appositive" },
];

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const countWords = (t) =>
  (String(t || "").match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
const cleanPhrase = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[,.;:!?]+$/g, "")
    .trim();

/** Sentences in reading order; a line break also ends a sentence. */
export function splitSentences(text) {
  return String(text || "")
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?]["'”’]?)\s+(?=["'“‘]?[A-Za-z0-9])/))
    .map((s) => s.trim())
    .filter((s) => countWords(s) > 0);
}

/** Transition phrases (from the unit plus a default set), longest first so "after that" wins over "after". */
export function transitionList(unitTransitions = []) {
  const all = new Set(
    [...unitTransitions.map(cleanPhrase), ...DEFAULT_TRANSITIONS].filter(Boolean),
  );
  return [...all].sort((a, b) => b.length - a.length);
}

export function startsWithTransition(sentence, transitions) {
  const s = sentence.replace(/^["'“‘]/, "").toLowerCase();
  return transitions.find((t) => s.startsWith(t) && !/[a-z]/.test(s.charAt(t.length))) || "";
}

/** "Max, my dog, ..." or "..., a city on the bay." — but not "First, the light ..." (a transition, not a noun). */
export function hasAppositive(sentence, transitions = transitionList()) {
  const parts = sentence.split(",").map((p) => p.trim());
  for (let i = 1; i < parts.length; i++) {
    if (!DETERMINERS.test(parts[i]) || countWords(parts[i]) < 2 || countWords(parts[i]) > 10)
      continue;
    const before = parts[i - 1];
    const lastWord = cleanPhrase(before.split(/\s+/).pop());
    if (
      !/^[A-Za-z]/.test(before) ||
      STOP.has(lastWord) ||
      /^(and|or|so|but|then|also)$/.test(lastWord)
    )
      continue;
    if (i === 1 && transitions.includes(cleanPhrase(before))) continue;
    if (i === 1 && SUB_START.test(`${before},`)) continue;
    const closes = i + 1 < parts.length || /[.!?]["']?$/.test(parts[i]);
    if (closes) return true;
  }
  return false;
}

/** Vocabulary terms used (a light stem match so "transmits" counts for "transmit"). */
export function vocabUsed(text, vocab = []) {
  return vocab.filter((v) => {
    const stem = v.length > 4 ? v.slice(0, Math.max(4, v.length - 2)) : v;
    return new RegExp(`\\b${escRe(stem)}`, "i").test(text);
  });
}

function keywords(note) {
  return (
    String(note)
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9'-]*/g) || []
  ).filter((w) => (w.length >= 4 || /\d/.test(w)) && !STOP.has(w));
}
/** Does the paragraph carry this outline note? Half of its key words (stem match) must appear. */
export function noteCovered(note, text) {
  const keys = keywords(note);
  if (!keys.length) return null;
  const words = String(text).toLowerCase();
  const hit = keys.filter((k) =>
    new RegExp(`\\b${escRe(k.length > 5 ? k.slice(0, k.length - 2) : k)}`).test(words),
  );
  return hit.length >= Math.ceil(keys.length / 2);
}

/** Highlight runs inside one sentence: transition | conj | sub | vocab | null. */
export function segments(sentence, { transitions = transitionList(), vocab = [] } = {}) {
  const ranges = [];
  const add = (re, kind) => {
    for (const m of sentence.matchAll(re)) ranges.push([m.index, m.index + m[0].length, kind]);
  };
  const t = startsWithTransition(sentence, transitions);
  if (t)
    ranges.push([
      sentence.toLowerCase().indexOf(t),
      sentence.toLowerCase().indexOf(t) + t.length,
      "transition",
    ]);
  const sub = sentence.match(new RegExp(`^["'“‘]?(${SUBORDINATORS})\\b`, "i"));
  if (sub && SUB_START.test(sentence))
    ranges.push([sub.index + sub[0].length - sub[1].length, sub.index + sub[0].length, "sub"]);
  add(/\b(because|but|so)\b/gi, "conj");
  for (const v of vocabUsed(sentence, vocab)) {
    const stem = v.length > 4 ? v.slice(0, Math.max(4, v.length - 2)) : v;
    add(new RegExp(`\\b${escRe(stem)}[A-Za-z]*`, "gi"), "vocab");
  }
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out = [];
  let at = 0;
  for (const [s, e, kind] of ranges) {
    if (s < at) continue;
    if (s > at) out.push({ text: sentence.slice(at, s), kind: null });
    out.push({ text: sentence.slice(s, e), kind });
    at = e;
  }
  if (at < sentence.length) out.push({ text: sentence.slice(at), kind: null });
  return out;
}

function sentenceInfo(text, i, total, ctx) {
  const moves = [];
  if (startsWithTransition(text, ctx.transitions)) moves.push("transition");
  if (BBS.test(text)) moves.push("bbs");
  if (SUB_START.test(text)) moves.push("sub");
  if (hasAppositive(text, ctx.transitions)) moves.push("appos");
  const issues = [];
  if (!/^["'“‘]?[A-Z0-9]/.test(text)) issues.push("capital");
  if (!/[.!?]["'”’]?$/.test(text)) issues.push("end");
  const words = countWords(text);
  if (words > (LONG_SENTENCE[ctx.level] || 35)) issues.push("long");
  const role =
    total === 1 || i === 0 ? "topic" : total >= 3 && i === total - 1 ? "conclusion" : "detail";
  return { text, role, words, moves, issues, vocab: vocabUsed(text, ctx.vocab) };
}

function firstWord(s) {
  return cleanPhrase(s.replace(/^["'“‘]/, "").split(/\s+/)[0]);
}

/** The next one or two things worth doing, most useful first. Plain, kind, specific. */
function nudgesFor(a, ctx) {
  const out = [];
  const { sentences, stats } = a;
  if (!sentences.length)
    return [
      {
        k: "start",
        msg: "Start with your topic sentence. It tells what the whole paragraph is about.",
      },
    ];
  const cap = sentences.findIndex((s) => s.issues.includes("capital"));
  if (cap >= 0)
    out.push({
      k: "capital",
      n: cap + 1,
      msg: `Sentence ${cap + 1} needs a capital letter at the start.`,
    });
  const end = sentences.findIndex((s, i) => s.issues.includes("end") && i < sentences.length - 1);
  if (end >= 0)
    out.push({ k: "end", n: end + 1, msg: `Sentence ${end + 1} needs an end mark (. ! ?).` });
  const long = sentences.findIndex((s) => s.issues.includes("long"));
  if (long >= 0)
    out.push({
      k: "long",
      n: long + 1,
      msg: `Sentence ${long + 1} is very long. Try splitting it into two sentences.`,
    });
  const missing = a.coverage.filter((c) => c.covered === false);
  if (stats.words >= 15 && missing.length)
    out.push({
      k: "note",
      note: missing[0].note,
      msg: `Your note "${missing[0].note}" is not in your paragraph yet. Turn it into a sentence.`,
    });
  const detail = sentences.filter((s) => s.role !== "topic");
  if (detail.length >= 2 && !a.moves.transition)
    out.push({
      k: "transition",
      msg: "Connect your ideas. Start a detail sentence with a transition, like “Next,” or “For example,”.",
    });
  if (ctx.level !== "l1_2" && stats.sentences >= 2 && !a.moves.bbs)
    out.push({ k: "bbs", msg: "Explain more: add a sentence with because, but, or so." });
  const starts = sentences.map((s) => firstWord(s.text));
  const repeat = starts.find(
    (w, i) => w && starts.indexOf(w) !== i && starts.filter((x) => x === w).length >= 3,
  );
  if (repeat)
    out.push({
      k: "variety",
      msg: `${starts.filter((x) => x === repeat).length} sentences start with “${repeat}”. Try a clue-word start, like “When …,”.`,
    });
  if (ctx.vocab.length && stats.sentences >= 2 && !stats.vocab.length)
    out.push({
      k: "vocab",
      msg: "Use a unit word to make your meaning exact. Tap one in the word bank.",
    });
  if (ctx.level === "l5_6" && stats.sentences >= 3) {
    if (!a.moves.appos)
      out.push({
        k: "appos",
        msg: "Stretch: add an appositive to tell more about a noun (“the lighthouse, a tall tower by the bay,”).",
      });
    if (!a.moves.sub)
      out.push({
        k: "sub",
        msg: "Stretch: start one sentence with a clue word like although, when or since.",
      });
  }
  if (stats.sentences >= 3 && sentences.at(-1).issues.includes("end"))
    out.push({ k: "end", n: sentences.length, msg: "Finish your last sentence with an end mark." });
  if (stats.words < (MIN_WORDS[ctx.level] || 35) && !out.length)
    out.push({
      k: "more",
      msg: `Keep going. Aim for about ${MIN_WORDS[ctx.level] || 35} words or more.`,
    });
  return out;
}

/**
 * ctx: { level, vocab: string[], transitions: string[] (unit), notes: string[] (outline details) }.
 */
export function analyzeParagraph(text, ctx = {}) {
  const c = {
    level: ctx.level || "l3_4",
    vocab: ctx.vocab || [],
    transitions: transitionList(ctx.transitions || []),
  };
  const raw = splitSentences(text);
  const sentences = raw.map((s, i) => sentenceInfo(s, i, raw.length, c));
  const moves = Object.fromEntries(
    MOVES.map((m) => [m.k, sentences.filter((s) => s.moves.includes(m.k)).length]),
  );
  const words = countWords(text);
  const stats = {
    words,
    sentences: sentences.length,
    vocab: vocabUsed(text, c.vocab),
    minWords: MIN_WORDS[c.level] || 35,
    avg: sentences.length ? Math.round(words / sentences.length) : 0,
  };
  const coverage = (ctx.notes || [])
    .map((note) => ({ note, covered: noteCovered(note, text) }))
    .filter((x) => x.covered !== null);
  const a = { sentences, stats, moves, coverage };
  a.nudges = nudgesFor(a, c);
  return a;
}

/** Word-level difference between a first draft and the current text (LCS). Ops: same | add | del. */
export function diffWords(before, after) {
  const A = String(before || "")
    .split(/\s+/)
    .filter(Boolean);
  const B = String(after || "")
    .split(/\s+/)
    .filter(Boolean);
  if (A.length * B.length > 600_000)
    return { ops: [{ op: "add", text: B.join(" ") }], added: B.length, removed: A.length };
  const m = A.length;
  const n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  const push = (op, word) => {
    const last = ops.at(-1);
    if (last && last.op === op) last.text += ` ${word}`;
    else ops.push({ op, text: word });
  };
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      push("same", A[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", A[i++]);
      removed++;
    } else {
      push("add", B[j++]);
      added++;
    }
  }
  while (i < m) {
    push("del", A[i++]);
    removed++;
  }
  while (j < n) {
    push("add", B[j++]);
    added++;
  }
  return { ops, added, removed };
}
