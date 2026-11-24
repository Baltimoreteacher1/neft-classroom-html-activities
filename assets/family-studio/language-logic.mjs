/**
 * Pure text logic behind two language supports on the family practice page. No DOM, so the node
 * tests (tools/family-language-bridge.test.mjs) run it against every problem and every key word.
 *
 * Three Reads (threeReads): the routine teachers use with multilingual learners for word problems.
 * Read 1 is the story with the numbers and the question held back, read 2 names what each number counts, read 3 is the
 * question. It only re-shows the problem's own words; it never computes or reveals an answer.
 *
 * Cognates (cognate): whether an English math word and its Spanish translation are "word twins"
 * (equivalent / equivalente). Spanish-speaking families already know most Grade 6 math words in
 * Spanish; naming the twins turns their language into a head start. Conservative on purpose: a
 * known false friend or a weak match is NOT called a twin.
 */

/* ── Three Reads ───────────────────────────────────────────────────── */

/** A quantity as a family reads it: $4.50, 1,200, 3/4, 2 1/2, 25%, 0.5. */
const NUM_SRC = String.raw`\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s\d+\/\d+|\/\d+|:\d+(?:\.\d+)?)?%?`;
const NUM_RE = new RegExp(`(^|[^\\w^])(${NUM_SRC})(?![\\w^])`, "g");

/** Words that are never the thing a number counts. */
const UNIT_STOP = new Set(
  "a an and or of the to in on at for by is are was were it its as if than then that this these those with from per each every more less times plus minus de del la las el los y o en un una unos unas por para con que es son al se su sus más menos veces cada".split(
    " ",
  ),
);

const words = (s) => (String(s).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}/g) || []).length;

/** Sentences, keeping their end punctuation. Decimal points and $ amounts do not split. */
export function sentences(text) {
  const out = [];
  const re = /[^.?!]+(?:\.(?=\d)[^.?!]*)*[.?!]*/g;
  for (const m of String(text).matchAll(re)) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  return out;
}

/** The sentence that asks: ends in "?", or opens with an instruction verb. Last one wins. */
export function questionOf(text) {
  const all = sentences(text);
  const asks = all.filter(
    (s) =>
      /[?]$/.test(s) ||
      /^(¿|find|how|what|which|who|write|show|explain|determine|compare|is|are|does|do|can|halla|encuentra|cuánt|qué|cuál|quién|escribe|muestra|explica|determina|compara)/i.test(
        s,
      ),
  );
  return asks.length ? asks[asks.length - 1] : "";
}

/** A number right after one of these words is a name ("Row 1", "Paso 2"), not a quantity. */
const LABEL_BEFORE =
  /(?:^|\s)(?:row|step|part|problem|lesson|question|figure|table|unit|grade|level|round|choice|option|fila|paso|parte|problema|lección|leccion|pregunta|figura|tabla|unidad|grado|nivel|ronda|opción|opcion)\s*$/i;

/** Every quantity in order, with the word right after it when that word names what it counts. */
export function quantities(text) {
  const out = [];
  const s = String(text);
  for (const m of s.matchAll(NUM_RE)) {
    const value = m[2];
    const start = m.index + m[1].length;
    if (LABEL_BEFORE.test(s.slice(Math.max(0, start - 14), start))) continue;
    const after = s.slice(start + value.length);
    const w = after.match(/^\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ-]*)/);
    const unit = w && !UNIT_STOP.has(w[1].toLowerCase()) ? w[1] : "";
    out.push({ value, unit, start, end: start + value.length });
  }
  return out;
}

/**
 * Whether a stem is a word problem worth three reads: a real story (10+ words), at least one
 * quantity that names what it counts (or is money), and a question. Pure computation ("Evaluate 3 + 4 × 2") and short prompts are not.
 */
export function isWordProblem(text) {
  const t = String(text || "").trim();
  if (words(t) < 10) return false;
  const qs = quantities(t);
  /* A story counts or measures something: at least one number names its thing ("20 crayons"). */
  if (!qs.length || !qs.some((q) => q.unit || /^\$/.test(q.value))) return false;
  return Boolean(questionOf(t));
}

/**
 * The three reads for one stem, as text segments a renderer can draw:
 *   story:    [{text} | {blank:true}]       numbers hidden
 *   numbers:  [{text} | {num, unit}]        numbers marked
 *   question: the asking sentence
 * Returns null when the stem is not a word problem. `force` skips that test, for the Spanish twin of
 * an English stem that already passed it (Spanish often says the same story in fewer long words).
 */
export function threeReads(text, { force = false } = {}) {
  const t = String(text || "").trim();
  if (!t || !quantities(t).length) return null;
  if (!force && !isWordProblem(t)) return null;
  const qs = quantities(t);
  const question = questionOf(t);
  /* Read 1 stops before the question, so read 3 is the moment the family meets it. When the whole
     stem is one asking sentence, the story keeps it (there is nothing else to tell). */
  const qAt = question ? t.lastIndexOf(question) : -1;
  const storyEnd = qAt > 0 ? qAt : t.length;
  const story = [];
  const numbers = [];
  let at = 0;
  for (const q of qs) {
    if (q.start > at) {
      if (at < storyEnd) story.push({ text: t.slice(at, Math.min(q.start, storyEnd)) });
      numbers.push({ text: t.slice(at, q.start) });
    }
    if (q.start < storyEnd) story.push({ blank: true });
    numbers.push({ num: q.value, unit: q.unit });
    at = q.end;
  }
  if (at < t.length) {
    if (at < storyEnd) story.push({ text: t.slice(at, storyEnd) });
    numbers.push({ text: t.slice(at) });
  }
  if (qAt > 0) {
    const last = story[story.length - 1];
    if (last?.text) last.text = last.text.trimEnd();
    story.push({ text: " …" });
  }
  return { story, numbers, question, count: qs.length };
}

/* ── Cognates ──────────────────────────────────────────────────────── */

const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .trim();

const STOP = new Set(
  "a an the of to and or in on by for with de del la las el los y o en un una por para con al".split(" "),
);

/**
 * English/Spanish pairs that look alike but do not mean the same thing, plus math pairs where the
 * look-alike would mislead (rate is "tasa", not "rata"). Never called twins.
 */
const FALSE_FRIENDS = new Set([
  "actual",
  "argument",
  "assist",
  "carpet",
  "exit",
  "large",
  "library",
  "realize",
  "record",
  "sensible",
  "support",
  "rope",
  "embarrassed",
  "sane",
]);

/** Spanish endings rewritten to their usual English partners before comparing. */
const ES_SUFFIX = [
  [/cion$/, "tion"],
  [/sion$/, "sion"],
  [/dad$/, "ty"],
  [/tad$/, "ty"],
  [/encia$/, "ence"],
  [/ancia$/, "ance"],
  [/ificar$/, "ify"],
  [/izar$/, "ize"],
  [/mente$/, "ly"],
  [/oso$/, "ous"],
  [/osa$/, "ous"],
  [/ivo$/, "ive"],
  [/iva$/, "ive"],
  [/ico$/, "ic"],
  [/ica$/, "ic"],
  [/ario$/, "ary"],
  [/aria$/, "ary"],
  [/ente$/, "ent"],
  [/ante$/, "ant"],
  [/ia$/, "y"],
  [/ar$/, ""],
  [/er$/, ""],
  [/ir$/, ""],
  [/o$/, ""],
  [/a$/, ""],
  [/e$/, ""],
  [/s$/, ""],
];

const EN_SUFFIX = [
  [/ies$/, "y"],
  [/es$/, ""],
  [/s$/, ""],
  [/e$/, ""],
];

function rewrite(word, rules) {
  for (const [re, to] of rules) if (re.test(word) && word.length > 4) return word.replace(re, to);
  return word;
}

function lev(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/* Spelling habits Spanish swaps in: ph→f, th→t, qu/k→c, z→c, y→i, double letters single, es+consonant→s. */
const spell = (w) =>
  w
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/qu/g, "c")
    .replace(/k/g, "c")
    .replace(/z/g, "c")
    .replace(/y/g, "i")
    .replace(/(.)\1/g, "$1")
    .replace(/^es(?=[^aeiou])/, "s");

/** A word reduced to the form both languages are compared in. */
export function normForm(word, lang) {
  const f = fold(word);
  return spell(rewrite(f, lang === "es" ? ES_SUFFIX : EN_SUFFIX));
}

/** 0..1 likeness of one English word and one Spanish word, after usual ending swaps. */
export function wordLikeness(en, es) {
  const a = fold(en);
  const b = fold(es);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const x = normForm(a, "en");
  const y = normForm(b, "es");
  if (x === y) return 1;
  /* One form wholly starts the other (volum / volumen, evalu / evaluat, graf / grafic). */
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.length >= 4 && long.startsWith(short)) return 0.9;
  return 1 - lev(x, y) / Math.max(x.length, y.length);
}

const content = (s) =>
  fold(s)
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

/**
 * Whether an English term and its Spanish term are word twins.
 * Every English content word must find a Spanish partner at 0.72 likeness or better (short words
 * need an exact-ish match), the first three letters must agree (or the words be near-identical) for at least one pair, and no word may
 * be a known false friend.
 * Returns { twin, pairs:[[en, es, score]] }.
 */
export function cognate(termEn, termEs) {
  const en = content(termEn);
  const es = content(termEs);
  /* A lesson title is not a word; four or more content words is a phrase, not a twin. */
  if (!en.length || !es.length || en.length > 3) return { twin: false, pairs: [] };
  if (en.some((w) => FALSE_FRIENDS.has(w))) return { twin: false, pairs: [] };
  const used = new Set();
  const pairs = [];
  for (const w of en) {
    let best = -1;
    let score = 0;
    es.forEach((v, i) => {
      if (used.has(i)) return;
      const s = wordLikeness(w, v);
      if (s > score) {
        score = s;
        best = i;
      }
    });
    const need = w.length <= 4 ? 0.74 : 0.72;
    if (best < 0 || score < need) return { twin: false, pairs: [] };
    used.add(best);
    pairs.push([w, es[best], Math.round(score * 100) / 100]);
  }
  /* One pair must start the same way, or be near-identical (equation / ecuación: e-q vs e-cu). */
  const stemAgrees = pairs.some(
    ([a, b, score]) => score >= 0.85 || normForm(a, "en").slice(0, 3) === normForm(b, "es").slice(0, 3),
  );
  return stemAgrees ? { twin: true, pairs } : { twin: false, pairs: [] };
}

/**
 * Letters the two words share at the same spot after lining them up (for the highlight in the
 * word-twin card). Returns a boolean per character of `word` (by index into the original string).
 */
export function sharedLetters(word, other) {
  const a = String(word || "");
  const fa = fold(a).replace(/[^a-z]/g, "");
  const fb = fold(other).replace(/[^a-z]/g, "");
  /* Longest common subsequence, marking the characters of `a` that take part. */
  const m = fa.length;
  const n = fb.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = fa[i] === fb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const keep = new Array(m).fill(false);
  for (let i = 0, j = 0; i < m && j < n; ) {
    if (fa[i] === fb[j]) {
      keep[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  /* Map back onto the original characters (accents and spaces included). */
  const out = [];
  let k = 0;
  for (const ch of a) {
    const f = fold(ch).replace(/[^a-z]/g, "");
    if (f) out.push(Boolean(keep[k++]));
    else out.push(false);
  }
  return out;
}
