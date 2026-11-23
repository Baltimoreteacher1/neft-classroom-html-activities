// Word Study — deterministic practice items built from the dataset (never random strings).
// Item: { id, tool, word, stem, choices:[{id,text}], answer:<choice id>, explain, hint }. Choices are shuffled by seed.
import { rngFor } from "../rng.js";
import {
  derivationsForGrade, derivRank, displayForm, familyWords, gradeRank, inflectForm, partMeaning, partMinRank, surfaceOf,
} from "./model.js";

const lc = (w) => String(w).toLowerCase();
const uniq = (list) => [...new Set(list)];
function makeChoices(rng, texts, correct) {
  const pool = uniq(texts);
  const list = rng.shuffle(pool).map((text, i) => ({ id: `c${i}`, text }));
  return { choices: list, answer: list.find((c) => c.text === correct).id };
}
const joinParts = (idx, d, pieces = surfaceOf(idx, d)) => pieces.join(" + ");

/** Take It Apart: which parts make this word? Distractors swap one affix or root for another of the same type. */
export function apartItem(idx, grade, seed) {
  const rng = rngFor(`apart:${seed}`);
  const pool = derivationsForGrade(idx, grade).filter((d) => d.parts.length >= 2);
  if (!pool.length) return null;
  const d = rng.pick(pool);
  const surf = surfaceOf(idx, d);
  const correct = surf.join(" + ");
  const sameType = (id) => idx.parts.filter((p) => !id.startsWith("base:") && p.type === idx.partById.get(id)?.type && p.id !== id && partMinRank(p) <= gradeRank(grade));
  const wrong = [];
  for (let tries = 0; tries < 24 && wrong.length < 3; tries++) {
    const i = rng.int(d.parts.length);
    const id = d.parts[i];
    let swap;
    if (id.startsWith("base:")) {
      const others = [...idx.bases].filter((b) => b !== id.slice(5) && b.length > 2);
      swap = others.length ? rng.pick(others) : null;
    } else {
      const opts = sameType(id).filter((p) => !p.variantOf || p.variantOf !== id);
      swap = opts.length ? displayForm(idx, rng.pick(opts).id).replace(/-/g, "") : null;
    }
    if (!swap) continue;
    const next = [...surf];
    next[i] = swap;
    const text = next.join(" + ");
    if (text !== correct && next.join("") !== d.word && !wrong.includes(text)) wrong.push(text);
  }
  // A split of the right letters in the wrong place also teaches: move the first cut.
  if (wrong.length < 3 && surf.length >= 2) {
    const w = d.word;
    for (const cut of [2, 3, w.length - 3]) {
      if (cut > 0 && cut < w.length) {
        const text = `${w.slice(0, cut)} + ${w.slice(cut)}`;
        if (text !== correct && !wrong.includes(text) && wrong.length < 3) wrong.push(text);
      }
    }
  }
  if (wrong.length < 2) return null;
  const { choices, answer } = makeChoices(rng, [correct, ...wrong.slice(0, 3)], correct);
  const meanings = d.parts.map((id, i) => (id.startsWith("base:") ? `${surf[i]} is the base word` : `${displayForm(idx, id)} means "${partMeaning(idx, id)}"`));
  return {
    id: `apart:${d.word}`, tool: "apart", word: d.word, pos: d.pos,
    stem: d.word, choices, answer,
    explain: `${d.word} = ${correct}. ${meanings.join("; ")}.${d.spell ? ` ${d.spell}` : ""}`,
    hint: `Look for a part you know at the start or the end of ${d.word}. What is left?`,
    parts: d.parts, derivation: d,
  };
}

/** Predict the Meaning: parts that really predict the meaning only. Distractors are real words that share the base or an affix. */
export function predictItem(idx, grade, seed) {
  const rng = rngFor(`predict:${seed}`);
  const all = derivationsForGrade(idx, grade);
  const pool = all.filter((d) => d.transparent !== false && d.parts.length >= 2);
  if (!pool.length) return null;
  const d = rng.pick(pool);
  const anchors = d.parts;
  const near = all.filter((x) => x.word !== d.word && x.gloss !== d.gloss && x.parts.some((id) => anchors.includes(id)));
  const far = all.filter((x) => x.word !== d.word && x.gloss !== d.gloss && x.pos === d.pos);
  const wrongGlosses = uniq([...rng.shuffle(near), ...rng.shuffle(far)].map((x) => x.gloss)).filter((g) => g !== d.gloss).slice(0, 3);
  if (wrongGlosses.length < 2) return null;
  const { choices, answer } = makeChoices(rng, [d.gloss, ...wrongGlosses], d.gloss);
  const hintParts = d.parts.map((id) => (id.startsWith("base:") ? id.slice(5) : `${displayForm(idx, id)} = ${partMeaning(idx, id)}`));
  return {
    id: `predict:${d.word}`, tool: "predict", word: d.word, pos: d.pos, stem: d.word, choices, answer,
    explain: `${d.word} means "${d.gloss}". The parts: ${hintParts.join(", ")}.`,
    hint: `Parts: ${hintParts.join(", ")}. Put the meanings together.`,
    parts: d.parts, derivation: d,
  };
}

const COMPARE = (form) => (form.endsWith("est") ? "est" : "er");
/** Compound & Inflection Studio — compound item ("make": clue to word; "split": word to its two words). */
export function compoundItem(idx, seed, mode) {
  const rng = rngFor(`compound:${seed}`);
  const list = idx.compounds.filter((c) => c.transparent !== false);
  if (list.length < 4) return null;
  const c = rng.pick(list);
  const kind = mode || (rng.next() < 0.5 ? "make" : "split");
  if (kind === "make") {
    const near = list.filter((x) => x.word !== c.word && x.parts.some((p) => c.parts.includes(p)));
    const others = uniq([...rng.shuffle(near), ...rng.shuffle(list.filter((x) => x.word !== c.word))].map((x) => x.word)).slice(0, 3);
    const { choices, answer } = makeChoices(rng, [c.word, ...others], c.word);
    return { id: `compound-make:${c.word}`, tool: "studio", sub: "compound", word: c.word, stem: c.gloss, parts: c.parts, choices, answer, explain: `${c.parts.join(" + ")} makes ${c.word}: ${c.gloss}.`, hint: `The two small words are ${c.parts.join(" and ")}. Which new word do they make?` };
  }
  const near = list.filter((x) => x.word !== c.word && x.parts.some((p) => c.parts.includes(p)));
  const others = uniq([...rng.shuffle(near), ...rng.shuffle(list.filter((x) => x.word !== c.word))].map((x) => x.parts.join(" + "))).filter((t) => t !== c.parts.join(" + ")).slice(0, 3);
  const correct = c.parts.join(" + ");
  const { choices, answer } = makeChoices(rng, [correct, ...others], correct);
  return { id: `compound-split:${c.word}`, tool: "studio", sub: "compound", word: c.word, stem: c.word, parts: c.parts, choices, answer, explain: `${c.word} = ${correct}. ${c.gloss}.`, hint: `Say the word slowly. Where does the first small word end?` };
}

const WRONG = {
  plural: (b) => [`${b}s`, `${b}es`, b.replace(/y$/, "ies"), b.replace(/(f|fe)$/, "ves"), b.replace(/y$/, "ys"), `${b}ies`, `${b}${b.at(-1)}s`],
  past: (b) => [`${b}ed`, `${b}d`, b.replace(/e$/, "") + "ed", `${b}${b.at(-1)}ed`, b.replace(/y$/, "ied"), b.replace(/y$/, "yed"), `${b}id`],
  now: (b) => [`${b}ing`, b.replace(/e$/, "") + "ing", `${b}${b.at(-1)}ing`, `${b}eing`, `${b}ng`],
  compare: (b, s) => [`${b}${s}`, b.replace(/e$/, "") + s, `${b}${b.at(-1)}${s}`, b.replace(/y$/, "i") + s, `${b}i${s}`, `${b}${s === "est" ? "st" : "r"}`],
};
const PROMPT = {
  plural: (b) => `More than one ${b}:`,
  past: (b) => `Yesterday I ${b} ... Write ${b} for the past:`,
  now: (b) => `Right now I am ... Write ${b} with -ing:`,
  compare: (b, s) => (s === "est" ? `The most ${b}:` : `More ${b} (comparing two things):`),
};
/** Inflection item from a rule example. Irregular plurals show the correct form among regular-rule mistakes. */
export function inflectionItem(idx, seed, kindFilter) {
  const rng = rngFor(`infl:${seed}`);
  const rules = idx.data.inflections.filter((r) => !kindFilter || r.kind === kindFilter);
  if (!rules.length) return null;
  const rule = rng.pick(rules);
  const ex = rng.pick(rule.examples);
  const s = rule.kind === "compare" ? COMPARE(ex.form) : "";
  const rawWrong = (WRONG[rule.kind](ex.base, s) || []).filter((t) => t && t !== ex.form && t !== ex.base);
  const wrong = rng.shuffle(uniq(rawWrong)).slice(0, 2);
  if (wrong.length < 2) return null;
  const { choices, answer } = makeChoices(rng, [ex.form, ...wrong], ex.form);
  return {
    id: `infl:${rule.id}:${ex.form}`, tool: "studio", sub: "inflection", word: ex.form, stem: PROMPT[rule.kind](ex.base, s), choices, answer,
    explain: `${ex.base} → ${ex.form}. ${rule.rule}`, hint: rule.rule, rule: rule.id, base: ex.base,
  };
}
export const inflectionCheck = (base, kind, suffix) => inflectForm(base, kind, suffix);

/** Meaning Shifts: is this a real split, or a look-alike? */
export function shiftItem(idx, seed, grade = "8") {
  const rng = rngFor(`shift:${seed}`);
  const ff = idx.falseFriends;
  const real = derivationsForGrade(idx, grade).filter((d) => d.parts.length === 2 && d.transparent !== false && !d.surface && d.word.length > 4);
  if (!ff.length || !real.length) return null;
  const wantFalse = rng.next() < 0.5;
  const choices = [{ id: "real", text: "Real word parts" }, { id: "look", text: "A look-alike, not word parts" }];
  if (wantFalse) {
    const f = rng.pick(ff);
    return { id: `shift:${f.word}`, tool: "shifts", word: f.word, stem: `${f.word} = ${f.lookalike.join(" + ")}`, choices, answer: "look", explain: f.truth, hint: `Does each piece mean something that fits ${f.word}?`, falseFriend: f };
  }
  const d = rng.pick(real);
  const g = d.gloss;
  return { id: `shift:${d.word}`, tool: "shifts", word: d.word, stem: `${d.word} = ${joinParts(idx, d)}`, choices, answer: "real", explain: `${d.word} really is ${joinParts(idx, d)}: ${g}.`, hint: `Does each piece mean something that fits ${d.word}?`, derivation: d };
}

const LANG = ["Latin", "Greek", "Old English"];
/** Origins: only parts whose origin is certain, and only when it is one of three clean choices. */
export function originItem(idx, grade, seed) {
  const rng = rngFor(`origin:${seed}`);
  const pool = idx.parts.filter((p) => p.origin_certain && LANG.some((l) => p.origin === l || p.origin.startsWith(`${l} `)) && partMinRank(p) <= gradeRank(grade) && !p.variantOf);
  if (!pool.length) return null;
  const p = rng.pick(pool);
  const lang = LANG.find((l) => p.origin === l || p.origin.startsWith(`${l} `));
  const { choices, answer } = makeChoices(rng, LANG, lang);
  return { id: `origin:${p.id}`, tool: "origins", word: p.form, stem: p.form, choices, answer, explain: `${p.form} (${p.meaning}) comes from ${p.origin}.`, hint: `Think of words that use ${p.form}. Greek parts often show up in science words.`, part: p };
}

/** Word Families: does this word belong to this family? "No" cases include look-alikes such as passport. */
export function familyItem(idx, grade, seed) {
  const rng = rngFor(`family:${seed}`);
  const list = idx.families.map((f) => ({ ...f, words: familyWords(idx, f, grade) })).filter((f) => f.words.length >= 5);
  if (list.length < 2) return null;
  const fam = rng.pick(list);
  const choices = [{ id: "yes", text: "Yes, it belongs to the family" }, { id: "no", text: "No, it does not" }];
  const lookalike = idx.falseFriends.filter((f) => f.lookalikeOf && fam.anchors.includes(f.lookalikeOf));
  if (rng.next() < 0.5) {
    const word = rng.pick(fam.words);
    return { id: `family:${fam.id}:${word}`, tool: "families", word, stem: `Does "${word}" belong to the ${fam.root} family (${fam.meaning})?`, choices, answer: "yes", explain: `${word} is in the ${fam.root} family. ${idx.derivByWord.get(lc(word))[0].gloss}.`, hint: `Look inside ${word} for ${fam.root}.`, family: fam };
  }
  if (lookalike.length && rng.next() < 0.7) {
    const f = rng.pick(lookalike);
    return { id: `family:${fam.id}:${f.word}`, tool: "families", word: f.word, stem: `Does "${f.word}" belong to the ${fam.root} family (${fam.meaning})?`, choices, answer: "no", explain: f.truth, hint: `Does the ${fam.root} in ${f.word} mean "${fam.meaning}"?`, family: fam };
  }
  const other = rng.pick(list.filter((f) => f.id !== fam.id));
  const word = rng.pick(other.words.filter((w) => !fam.words.includes(w)));
  if (!word) return null;
  return { id: `family:${fam.id}:${word}`, tool: "families", word, stem: `Does "${word}" belong to the ${fam.root} family (${fam.meaning})?`, choices, answer: "no", explain: `${word} belongs to the ${other.root} family (${other.meaning}), not to ${fam.root}.`, hint: `Look inside ${word}. Is ${fam.root} in there?`, family: fam };
}

/** The kit for Build a Word: the anchor, every part its words use, and a few look-alike decoys (seeded). */
export function buildKit(idx, grade, anchor, seed = "") {
  const rng = rngFor(`kit:${anchor}:${seed}`);
  const derivs = derivationsForGrade(idx, grade).filter((d) => d.parts.includes(anchor));
  const ids = uniq(derivs.flatMap((d) => d.parts));
  const decoyPool = idx.parts.filter((p) => !ids.includes(p.id) && partMinRank(p) <= gradeRank(grade) && p.type !== "root" && !p.variantOf);
  const decoys = rng.shuffle(decoyPool).slice(0, 2).map((p) => p.id);
  const tiles = rng.shuffle([...ids, ...decoys]);
  return { anchor, derivs, tiles, decoys };
}

/** Evaluate a workspace: success, right parts in the wrong order, or a kind note plus the nearest real word. */
export function evaluateBuild(idx, kit, placed) {
  const exact = idx.derivByKey.get(placed.join("|"));
  if (exact && derivRank(idx, exact) <= 99) return { ok: true, derivation: exact };
  if (placed.length < 2) return { ok: false, reason: "short" };
  const key = [...placed].sort().join("|");
  const sameParts = kit.derivs.find((d) => [...d.parts].sort().join("|") === key);
  if (sameParts) return { ok: false, reason: "order", nearby: sameParts };
  const score = (d) => {
    const set = new Set(d.parts);
    const hit = placed.filter((id) => set.has(id)).length;
    return hit / (set.size + placed.length - hit);
  };
  const nearby = [...kit.derivs].sort((a, b) => score(b) - score(a) || a.word.localeCompare(b.word))[0];
  return { ok: false, reason: "unknown", nearby: nearby && score(nearby) > 0 ? nearby : null };
}
