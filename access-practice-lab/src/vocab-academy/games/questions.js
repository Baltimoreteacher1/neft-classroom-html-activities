// Vocabulary Academy games — the question engine shared by Vocabulary Arena, Word Mastery, Word Quest and
// the Context Detective sense step. Pure: every question is derived from validated unit data (def, ex,
// cloze, misuse, syn, ant, morph, visual). Exactly one choice is correct; choices are distinct.
import { choiceCount, hasCloze, pickDistractors } from "./data.js";
import { clean, norm, uniq } from "./text.js";

export const QTYPES = {
  "def-word": { dim: "mean", label: ["Meaning to word", "Del significado a la palabra"] },
  "word-def": { dim: "mean", label: ["Word to meaning", "De la palabra al significado"] },
  cloze: { dim: "ctx", label: ["Fill the blank", "Completa el espacio"] },
  "misuse-yn": { dim: "ctx", label: ["Right or wrong use", "Uso correcto o incorrecto"] },
  "misuse-pick": { dim: "ctx", label: ["Spot the wrong use", "Encuentra el uso incorrecto"] },
  syn: { dim: "mean", label: ["Same meaning", "Mismo significado"] },
  ant: { dim: "mean", label: ["Opposite", "Opuesto"] },
  morph: { dim: "morph", label: ["Word parts", "Partes de la palabra"] },
  picture: { dim: "rec", label: ["Picture match", "Une con la imagen"] },
};
export const QTYPE_IDS = Object.keys(QTYPES);

/** Match the ending of `f` (the form that fills a blank) onto another word, or "" when the form is not a simple ending. */
function formLike(f, hw, other) {
  const a = norm(f);
  const b = norm(hw);
  if (a === b) return other.hw;
  if (!a.startsWith(b.slice(0, Math.max(3, b.length - 1)))) return "";
  const stem = a.startsWith(b) ? a.slice(b.length) : a.slice(b.length - 1);
  const base = a.startsWith(b) ? other.hw : other.hw.replace(/e$/, "");
  return stem && /^[a-z]{1,4}$/.test(stem) ? base + stem : "";
}

/** Shuffle the correct choice among the distractors; returns { choices, answer }. */
function arrange(correct, wrong, rng) {
  const all = rng.shuffle([correct, ...wrong]);
  return { choices: all, answer: all.indexOf(correct) };
}
function valid(q) {
  const keys = q.choices.map((c) => norm(c));
  return (
    q.choices.length >= 2 &&
    new Set(keys).size === keys.length &&
    q.answer >= 0 &&
    q.answer < q.choices.length &&
    keys.filter((k) => k === norm(q.choices[q.answer])).length === 1
  );
}
const finish = (q) => (valid(q) ? q : null);

const base = (type, word, extra) => ({
  type,
  wordId: word.id,
  dim: QTYPES[type].dim,
  hint: "",
  why: "",
  ...extra,
});

/** Which question types this word's data can support in this pool. */
export function available(word, pool) {
  const out = [];
  const others = pool.all.filter((w) => w.id !== word.id);
  if (others.length >= 1) out.push("def-word", "word-def");
  if (others.length >= 1 && (hasCloze(word.cloze) || hasCloze(word.cloze2))) out.push("cloze");
  if (word.misuse?.s && word.ex) out.push("misuse-yn");
  if (word.misuse?.s && word.ex && word.ex2) out.push("misuse-pick");
  if (word.syn?.length && others.length >= 1) out.push("syn");
  if (word.ant?.length && others.length >= 1) out.push("ant");
  if ((word.morph?.segs || []).length >= 2) out.push("morph");
  if (others.length >= 1 && (word.visual?.glyphs || []).length && word.visual.kind !== "diagram")
    out.push("picture");
  return out;
}

export function buildQuestion(type, word, pool, rng, { variant } = {}) {
  const n = choiceCount(pool) - 1;
  const dist = (k = n, reject) => pickDistractors(pool, word, k, rng, { reject });
  switch (type) {
    case "def-word": {
      const d = dist();
      if (!d.length) return null;
      const { choices, answer } = arrange(
        word.hw,
        d.map((w) => w.hw),
        rng,
      );
      return finish(
        base(type, word, {
          stem: `Which word means: ${clean(word.def)}`,
          say: word.def,
          choices,
          answer,
          hint: "Read the meaning again. Say what each word means before you choose.",
          why: `“${word.hw}” means: ${clean(word.def)}`,
        }),
      );
    }
    case "word-def": {
      const d = dist(n, (w) => norm(w.def) === norm(word.def));
      if (!d.length) return null;
      const { choices, answer } = arrange(
        clean(word.def),
        d.map((w) => clean(w.def)),
        rng,
      );
      return finish(
        base(type, word, {
          stem: `What does “${word.hw}” mean?`,
          say: word.hw,
          choices,
          answer,
          hint: `Think of a time you heard “${word.hw}”. What was happening?`,
          why: `“${word.hw}” means: ${clean(word.def)}`,
        }),
      );
    }
    case "cloze": {
      const pickC = variant === 2 ? word.cloze2 : variant === 1 ? word.cloze : null;
      const c = hasCloze(pickC) ? pickC : hasCloze(word.cloze) ? word.cloze : word.cloze2;
      if (!hasCloze(c)) return null;
      const d = dist(
        n,
        (w) => !formLike(c.f, word.hw, w) || (w.syn || []).map(norm).includes(norm(word.hw)),
      );
      if (!d.length) return null;
      const wrong = d.map((w) => formLike(c.f, word.hw, w)).filter(Boolean);
      const { choices, answer } = arrange(c.f, wrong, rng);
      return finish(
        base(type, word, {
          stem: "Which word fits the blank?",
          sentence: c.s,
          say: c.s.replace("___", "blank"),
          choices,
          answer,
          hint: "Find the clue words around the blank. What do they tell you about the word?",
          why: `“${c.f}” fits: ${clean(word.def)}`,
          fill: c.f,
        }),
      );
    }
    case "misuse-yn": {
      const right = rng.next() < 0.5;
      const s = right ? word.ex : word.misuse.s;
      return finish(
        base(type, word, {
          stem: `Does this sentence use “${word.hw}” correctly?`,
          sentence: s,
          say: s,
          choices: ["Yes, it fits the meaning", "No, it does not fit the meaning"],
          answer: right ? 0 : 1,
          hint: `Compare what happens in the sentence with the meaning: ${clean(word.def)}`,
          why: right
            ? `Yes. The sentence matches what “${word.hw}” means.`
            : clean(word.misuse.why),
        }),
      );
    }
    case "misuse-pick": {
      const { choices, answer } = arrange(word.misuse.s, [word.ex, word.ex2], rng);
      return finish(
        base(type, word, {
          stem: `Which sentence uses “${word.hw}” the wrong way?`,
          choices,
          answer,
          hint: `Two sentences fit “${word.hw}”. One does the opposite of its meaning.`,
          why: clean(word.misuse.why),
        }),
      );
    }
    case "syn": {
      const correct = clean(word.syn[rng.int(word.syn.length)]);
      const taken = new Set([word.hw, ...word.syn, ...(word.ant || [])].map(norm));
      const antChoice = (word.ant || []).slice(0, 1);
      const pool2 = uniq(
        pool.all
          .filter((w) => w.id !== word.id)
          .flatMap((w) => [w.hw, ...(w.syn || [])])
          .filter((t) => !taken.has(norm(t))),
      );
      const wrong = uniq([...antChoice, ...rng.shuffle(pool2)]).slice(0, n);
      if (!wrong.length) return null;
      const { choices, answer } = arrange(correct, wrong, rng);
      return finish(
        base(type, word, {
          stem: `Which word is closest in meaning to “${word.hw}”?`,
          say: word.hw,
          choices,
          answer,
          hint: `“${word.hw}” means: ${clean(word.def)} Which choice could replace it?`,
          why: `“${correct}” is close in meaning to “${word.hw}”.`,
        }),
      );
    }
    case "ant": {
      const correct = clean(word.ant[rng.int(word.ant.length)]);
      const taken = new Set([word.hw, ...word.ant].map(norm));
      const pool2 = uniq(
        pool.all
          .filter((w) => w.id !== word.id)
          .flatMap((w) => [w.hw, ...(w.syn || [])])
          .filter((t) => !taken.has(norm(t))),
      );
      const wrong = uniq([...(word.syn || []).slice(0, 1), ...rng.shuffle(pool2)])
        .filter((t) => !taken.has(norm(t)))
        .slice(0, n);
      if (!wrong.length) return null;
      const { choices, answer } = arrange(correct, wrong, rng);
      return finish(
        base(type, word, {
          stem: `Which word is the opposite of “${word.hw}”?`,
          say: word.hw,
          choices,
          answer,
          hint: `“${word.hw}” means: ${clean(word.def)} Think of someone who is the reverse.`,
          why: `“${correct}” is the opposite of “${word.hw}”.`,
        }),
      );
    }
    case "morph": {
      const segs = word.morph.segs.filter((s) => s.m && s.s);
      if (segs.length < 2) return null;
      const seg = segs[rng.int(segs.length)];
      const otherSegs = uniq([
        ...segs.filter((s) => s !== seg).map((s) => s.s),
        ...rng.shuffle(
          pool.all
            .filter((w) => w.id !== word.id)
            .flatMap((w) => (w.morph?.segs || []).map((s) => s.s)),
        ),
      ]).filter((s) => norm(s) !== norm(seg.s));
      const wrong = otherSegs.slice(0, n);
      if (!wrong.length) return null;
      const { choices, answer } = arrange(seg.s, wrong, rng);
      return finish(
        base(type, word, {
          stem: `In “${word.hw}”, which part means “${clean(seg.m)}”?`,
          choices,
          answer,
          hint: `Break “${word.hw}” into its parts and say what each part adds.`,
          why: `“${seg.s}” means “${clean(seg.m)}”.`,
        }),
      );
    }
    case "picture": {
      const d = dist();
      if (!d.length) return null;
      const { choices, answer } = arrange(
        word.hw,
        d.map((w) => w.hw),
        rng,
      );
      return finish(
        base(type, word, {
          stem: "Which word goes with this picture?",
          visualOf: word.id,
          choices,
          answer,
          hint: "Look at what is happening in the picture. Which word describes it?",
          why: `The picture shows “${word.hw}”: ${clean(word.def)}`,
        }),
      );
    }
    default:
      return null;
  }
}

/**
 * A varied run of questions. Words are used round-robin so each appears before any repeats; the type for a
 * word is the least-used type its data supports, never the same type twice in a row.
 * words: records to draw from (targets and review words). typeFilter limits the types.
 */
export function buildMix(pool, rng, { words, count, idPrefix = "q", typeFilter, firstType } = {}) {
  const list = rng.shuffle((words || pool.all).filter(Boolean));
  if (!list.length) return [];
  const used = Object.fromEntries(QTYPE_IDS.map((t) => [t, 0]));
  const perWord = new Map();
  const out = [];
  let prev = "";
  for (let i = 0; out.length < count && i < count * 4; i++) {
    const w = list[i % list.length];
    const mine = perWord.get(w.id) || new Set();
    let types = available(w, pool).filter((t) => !typeFilter || typeFilter.includes(t));
    if (!types.length) continue;
    const fresh = types.filter((t) => !mine.has(t));
    types = fresh.length ? fresh : types;
    const pool2 = types.filter((t) => t !== prev);
    const options = pool2.length ? pool2 : types;
    const forced = firstType?.(w, out.length);
    const sorted =
      forced && options.includes(forced)
        ? [forced]
        : rng.shuffle(options).sort((a, b) => used[a] - used[b]);
    for (const t of sorted) {
      const q = buildQuestion(t, w, pool, rng, { variant: mine.has(t) ? 2 : 1 });
      if (!q) continue;
      q.id = `${idPrefix}-${out.length + 1}`;
      out.push(q);
      used[t] += 1;
      mine.add(t);
      perWord.set(w.id, mine);
      prev = t;
      break;
    }
  }
  return out;
}

// ── multiple-choice state (pure) ────────────────────────────────────────────────────────────
export const newMc = () => ({
  tries: 0,
  wrong: [],
  hints: 0,
  hidden: [],
  done: false,
  firstTry: false,
});
/** Apply one pick. Returns { ok, first, changed }. A repeat or hidden pick changes nothing. */
export function mcPick(st, q, i) {
  if (st.done || st.wrong.includes(i) || st.hidden.includes(i))
    return { changed: false, ok: false, first: false };
  st.tries += 1;
  if (i === q.answer) {
    st.done = true;
    st.firstTry = st.tries === 1;
    return { changed: true, ok: true, first: st.firstTry };
  }
  st.wrong.push(i);
  return { changed: true, ok: false, first: false };
}
/** Hint 1 is a nudge; hints 2 and 3 take away one wrong choice each (never below two choices). */
export function mcHint(st, q) {
  if (st.done || st.hints >= 3) return false;
  st.hints += 1;
  if (st.hints >= 2) {
    const live = q.choices
      .map((_, i) => i)
      .filter((i) => i !== q.answer && !st.wrong.includes(i) && !st.hidden.includes(i));
    const remaining = q.choices.length - st.wrong.length - st.hidden.length;
    if (live.length && remaining > 2) st.hidden.push(live[0]);
  }
  return true;
}

// ── Vocabulary Arena scoring: correctness and variety only. There is no time input anywhere. ──
export const ARENA_POINTS = { first: 10, later: 6, variety: 15 };
export function arenaScore(log) {
  const done = log.filter((e) => e.ok);
  const points = done.reduce(
    (n, e) => n + (e.firstTry ? ARENA_POINTS.first : ARENA_POINTS.later),
    0,
  );
  const kinds = new Set(done.map((e) => e.type));
  return {
    points: points + kinds.size * ARENA_POINTS.variety,
    base: points,
    kinds: kinds.size,
    answered: done.length,
  };
}
