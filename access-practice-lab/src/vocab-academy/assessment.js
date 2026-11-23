// Vocabulary Academy — unit assessment: two PARALLEL forms (A, B), per-word evidence, a five-step feedback plan,
// and a growth comparison. Pure functions only (no DOM, no storage). Nothing here claims proficiency or a
// standardized score: results describe how specific WORDS went on one short form.
//
//   buildAssessment(unit, "A"|"B", ctx) -> { unitId, form, items, constructed, warnings, seed }
//   scoreAssessment(items, answers)     -> { score, total, answered, unanswered, perWord, byDim, perItem }
//   feedbackPlan(result, unit)          -> { needs, strong, explanations, practice, parallel, steps }
//   compareAttempts(a, b)               -> { perWord, counts, byDim, lines }
//
// `answers` maps item id -> chosen choice index (a number). Constructed responses (check.constructed) are
// teacher-reviewed and never auto-scored; the student-facing prompt object has no `model`.
import { rngFor } from "./rng.js";
import {
  TYPE_DIM,
  choiceCount,
  clozeItem,
  defToWordItem,
  fitItem,
  morphItem,
  norm,
  passageItem,
  pickChoices,
  synonymItem,
  wordToDefItem,
} from "./lessons/items.js";

export { TYPE_DIM };
export const FORMS = ["A", "B"];
export const MIN_ITEMS = 10;
export const MAX_ITEMS = 14;
const ROT = ["cloze", "meaning", "fit", "morph"];
const FALLBACKS = ["cloze", "meaning", "fit", "synonym"];

/** Parallel-form recipe: same type per word in both forms, different sentence/surface in each. */
function slotItem(kind, unit, word, index, form, rng) {
  const B = form === "B";
  switch (kind) {
    case "cloze":
      return clozeItem(unit, word, rng, form, B ? 2 : 1);
    case "meaning":
      return B ? wordToDefItem(unit, word, rng, form) : defToWordItem(unit, word, rng, form);
    case "fit": {
      // A judges the plain misuse on even words and the first example on odd words; B swaps in the other sentences.
      const useMisuse = B ? index % 2 === 1 : index % 2 === 0;
      return fitItem(unit, word, rng, form, { useMisuse, variant: B ? 2 : 1 });
    }
    case "morph":
      return morphItem(unit, word, rng, form, B ? "base" : "last");
    case "synonym":
      return synonymItem(unit, word, rng, form);
    default:
      return null;
  }
}

/** Build one item for `word`, trying the preferred kind then fallbacks; records why in `warnings`. */
function itemFor(preferred, unit, word, index, form, rng, used, warnings) {
  const order = [preferred, ...FALLBACKS].filter((k, i, a) => a.indexOf(k) === i && !used.has(k));
  for (const kind of order) {
    const item = slotItem(kind, unit, word, index, form, rng);
    if (item) {
      used.add(kind);
      if (kind !== preferred) warnings.push(`${word.id}: ${preferred} unavailable, used ${kind}`);
      if (item.note) warnings.push(`${word.id}: ${item.note}`);
      return item;
    }
  }
  warnings.push(`${word.id}: no unambiguous ${form} item could be built; word skipped`);
  return null;
}

export function buildAssessment(unit, form, ctx = {}) {
  if (!FORMS.includes(form)) throw new Error(`Unknown assessment form "${form}"`);
  const warnings = [];
  const seed = `${unit.id}:${form}:${ctx.seed ?? 0}`;
  const rng = rngFor(seed);
  const passageQs = unit.passage?.qs || [];
  const picks = (form === "A" ? [0, 2] : [1, 3]).filter((i) => i < passageQs.length);
  if (!picks.length && passageQs.length) {
    warnings.push(`passage: only ${passageQs.length} question(s); none left for form ${form}`);
  }
  const passageItems = picks.map((i) => passageItem(unit, passageQs[i], form)).filter(Boolean);
  if (picks.length > passageItems.length)
    warnings.push("passage: a question had ambiguous choices and was skipped");

  let words = unit.words;
  const room = MAX_ITEMS - passageItems.length;
  if (words.length > room) {
    // Custom units can be larger than a form: keep a deterministic sample, in unit order.
    const keep = new Set(rng.shuffle(words.map((w) => w.id)).slice(0, room));
    words = words.filter((w) => keep.has(w.id));
    warnings.push(`lesson has ${unit.words.length} words; form samples ${words.length}`);
  }
  const items = [];
  const used = new Map();
  words.forEach((word, i) => {
    const set = new Set();
    used.set(word.id, set);
    const item = itemFor(ROT[i % 4], unit, word, i, form, rng, set, warnings);
    if (item) items.push(item);
  });
  // Short units (K-2) get a second, different item per word until the form reaches MIN_ITEMS.
  for (let pass = 0; items.length + passageItems.length < MIN_ITEMS && pass < 2; pass++) {
    for (const [i, word] of words.entries()) {
      if (items.length + passageItems.length >= MIN_ITEMS) break;
      const set = used.get(word.id);
      const item = itemFor(ROT[(i + 2 + pass) % 4], unit, word, i, form, rng, set, warnings);
      if (item) items.push(item);
    }
  }
  const all = [...rng.shuffle(items), ...passageItems];
  if (all.length < MIN_ITEMS)
    warnings.push(`form ${form} has only ${all.length} items (minimum ${MIN_ITEMS})`);
  const cons = unit.check?.constructed || [];
  const pickC = cons[form === "A" ? 0 : 1] || cons[0];
  if (cons.length === 1 && form === "B")
    warnings.push("constructed: only one prompt; form B repeats it");
  return {
    unitId: unit.id,
    form,
    seed,
    items: all,
    constructed: pickC
      ? [
          {
            id: pickC.id,
            wordIds: pickC.wordIds || [],
            prompt: pickC.prompt,
            look: pickC.look || [],
          },
        ]
      : [],
    warnings,
  };
}

/** Score choice items. Unanswered items are listed but add no evidence either way. */
export function scoreAssessment(items, answers = {}) {
  const perItem = [];
  const perWord = {};
  const byDim = {};
  let score = 0;
  let answered = 0;
  for (const item of items) {
    const chosen = Number.isInteger(answers[item.id]) ? answers[item.id] : null;
    const ok = chosen === null ? null : chosen === item.answer;
    perItem.push({ id: item.id, wordId: item.wordId, dim: item.dim, type: item.type, chosen, ok });
    if (ok === null) continue;
    answered++;
    if (ok) score++;
    const d = (byDim[item.dim] ||= { c: 0, n: 0 });
    d.n++;
    if (ok) d.c++;
    if (!item.wordId) continue;
    const w = (perWord[item.wordId] ||= { ok: true, c: 0, n: 0, dims: {}, missed: [] });
    w.n++;
    const wd = (w.dims[item.dim] ||= { c: 0, n: 0 });
    wd.n++;
    if (ok) {
      w.c++;
      wd.c++;
    } else {
      w.ok = false;
      w.missed.push(item.id);
    }
  }
  const unansweredIds = perItem.filter((p) => p.ok === null).map((p) => p.id);
  return {
    score,
    total: answered,
    answered,
    unanswered: unansweredIds.length,
    unansweredIds,
    perWord,
    byDim,
    perItem,
  };
}

// A teacher note sentence is student-safe only if it talks about the word itself and gives no instructions
// to a teacher, so a note can sharpen the explanation without exposing teaching moves.
const TEACHER_VOICE =
  /\b(students?|teachers?|class|classroom|model|ask|have them|show|use|practice|link|contrast|distinguish|pair|rewrite|judge|invite|prompt|routine|chart|assess|check for|extend|revisit)\b/i;
export function studentSafeNote(unit, wordId) {
  const note = unit.teacher?.notes?.[wordId];
  const word = unit.words.find((w) => w.id === wordId);
  if (!note || !word) return "";
  const stem = norm(word.hw).slice(0, Math.max(4, norm(word.hw).length - 3));
  return note
    .split(/(?<=[.!?])\s+/)
    .filter((s) => norm(s).includes(stem) && !TEACHER_VOICE.test(s))
    .join(" ")
    .trim();
}

const sentenceForPractice = (word, index) => {
  const s = (index % 2 === 0 ? word.ex : word.ex2 || word.ex) || "";
  const re = new RegExp(`\\b${word.hw.replace(/-/g, "\\-")}\\b`, "gi");
  return (s.match(re) || []).length === 1 ? { s: s.replace(re, "___"), f: word.hw } : null;
};

/** Practice items (not assessment items) matched to the dimensions a word missed. Sentences differ from both forms. */
export function practiceItems(unit, wordIds, dimsByWord = {}, ctx = {}) {
  const rng = rngFor(`${unit.id}:practice:${ctx.seed ?? 0}`);
  const out = [];
  for (const id of wordIds) {
    const index = unit.words.findIndex((w) => w.id === id);
    const word = unit.words[index];
    if (!word) continue;
    const dims = dimsByWord[id]?.length ? dimsByWord[id] : ["mean"];
    const made = [];
    if (dims.includes("mean"))
      made.push(
        defToWordItem(unit, word, rng, "P"),
        wordToDefItem(unit, word, rng, "P"),
        synonymItem(unit, word, rng, "P"),
      );
    if (dims.includes("ctx")) {
      const c = sentenceForPractice(word, index);
      const pool = unit.words.filter((w) => w.id !== word.id).map((w) => w.hw);
      const built = c && pickChoices(c.f, pool, choiceCount(unit), rng, word.syn || []);
      if (built) {
        made.push({
          id: `${unit.id}:P:cloze:${id}`,
          type: "cloze",
          wordId: id,
          hw: word.hw,
          dim: "ctx",
          form: "P",
          stem: c.s,
          choices: built.choices,
          answer: built.answer,
          explain: `${c.s.replace("___", c.f)} "${word.hw}" fits because it means: ${word.def}`,
          hint: `Say the sentence with each word. "${word.hw}" means: ${word.def}`,
          note: "",
        });
      }
    }
    if (dims.includes("morph"))
      made.push(morphItem(unit, word, rng, "P", "last"), morphItem(unit, word, rng, "P", "base"));
    const got = made.filter(Boolean);
    // Always leave at least one item so a need never gets an empty practice step.
    out.push(
      ...(got.length
        ? got
        : [defToWordItem(unit, word, rng, "P"), wordToDefItem(unit, word, rng, "P")].filter(Boolean)
      ).slice(0, 2),
    );
  }
  return out;
}

/** The five steps: need -> explanation -> matching practice -> parallel attempt -> comparison. */
export function feedbackPlan(result, unit) {
  const byId = new Map(unit.words.map((w) => [w.id, w]));
  const needs = [];
  const strong = [];
  for (const [id, ev] of Object.entries(result.perWord || {})) {
    const word = byId.get(id);
    if (!word) continue;
    if (ev.ok) {
      strong.push(id);
      continue;
    }
    const dims = Object.entries(ev.dims)
      .filter(([, v]) => v.c < v.n)
      .map(([d]) => d);
    needs.push({ wordId: id, hw: word.hw, dims, missed: ev.missed });
  }
  const explanations = needs.map((n) => {
    const w = byId.get(n.wordId);
    return {
      wordId: n.wordId,
      hw: w.hw,
      pron: w.pron || "",
      def: w.def,
      ex: w.ex,
      nonExample: w.nonExample || "",
      note: studentSafeNote(unit, n.wordId),
      es: w.es?.gloss || "",
    };
  });
  const practice = practiceItems(
    unit,
    needs.map((n) => n.wordId),
    Object.fromEntries(needs.map((n) => [n.wordId, n.dims])),
  );
  const form = result.form === "B" ? "A" : "B";
  return {
    unitId: unit.id,
    needs,
    strong,
    explanations,
    practice,
    parallel: {
      form,
      why: "Same words, different sentences, so you can see whether the practice helped.",
    },
    steps: ["need", "explain", "practice", "parallel", "compare"],
  };
}

const KIND = { gained: "gained", kept: "kept", building: "building", revisit: "revisit" };
/** Growth per word between two scored attempts (a earlier, b later). Wording is about words, never about the learner. */
export function compareAttempts(a, b) {
  const ids = [...new Set([...Object.keys(a?.perWord || {}), ...Object.keys(b?.perWord || {})])];
  const perWord = [];
  const counts = { gained: 0, kept: 0, building: 0, revisit: 0, noData: 0 };
  for (const id of ids) {
    const x = a.perWord[id];
    const y = b.perWord[id];
    if (!x || !y) {
      counts.noData++;
      perWord.push({ wordId: id, kind: "noData", from: x ? x.ok : null, to: y ? y.ok : null });
      continue;
    }
    const kind =
      !x.ok && y.ok
        ? KIND.gained
        : x.ok && y.ok
          ? KIND.kept
          : !x.ok && !y.ok
            ? KIND.building
            : KIND.revisit;
    counts[kind]++;
    perWord.push({
      wordId: id,
      kind,
      from: x.ok,
      to: y.ok,
      fromC: x.c,
      fromN: x.n,
      toC: y.c,
      toN: y.n,
    });
  }
  const byDim = {};
  for (const dim of new Set([...Object.keys(a?.byDim || {}), ...Object.keys(b?.byDim || {})])) {
    const p = a.byDim?.[dim];
    const q = b.byDim?.[dim];
    byDim[dim] = { from: p || null, to: q || null };
  }
  const lines = [];
  if (counts.gained) lines.push({ key: "gained", n: counts.gained });
  if (counts.kept) lines.push({ key: "kept", n: counts.kept });
  if (counts.building) lines.push({ key: "building", n: counts.building });
  if (counts.revisit) lines.push({ key: "revisit", n: counts.revisit });
  return { perWord, counts, byDim, lines };
}

/** Compact, storable form of a scored attempt (no item text). */
export const summarizeResult = (result, form, at) => ({
  form,
  at,
  score: result.score,
  total: result.total,
  unanswered: result.unanswered,
  perWord: Object.fromEntries(
    Object.entries(result.perWord).map(([id, v]) => [
      id,
      { ok: v.ok, c: v.c, n: v.n, dims: v.dims },
    ]),
  ),
  byDim: result.byDim,
});

/** Evidence rows to hand to the model: one per answered item, with the item's own dimension. */
export const evidenceRows = (items, result) =>
  result.perItem
    .filter((p) => p.ok !== null && p.wordId)
    .map((p) => ({ wordId: p.wordId, dim: p.dim, ok: p.ok, type: `assess:${p.type}` }));
