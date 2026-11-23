// Structural + arithmetic validation for escape-challenge activity data (see engines/escape-challenge.schema.md).
// Pure: used by tools/studio-engines-3.test.mjs and by the engine for a clear error when data is malformed.
import {
  canon,
  cmp,
  correctResponse,
  evalCalc,
  isCorrect,
  parseRational,
  PUZZLE_TYPES,
  tokenOf,
} from "./escape-logic.js";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TIERS = ["ee", "dev", "exp", "br"];
const TIMER = /\b(timer|countdown|seconds? left|lives|hurry|beat the clock)\b/i;
const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** Whole-token search so the answer "3" is not found inside "13". */
function hasToken(text, token) {
  const t = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^0-9A-Za-z./])${t}($|[^0-9A-Za-z/])`, "i").test(String(text));
}

export function answerTexts(p) {
  const out = [];
  if (p.type === "numeric") {
    const r = parseRational(p.answer);
    out.push(canon(r), String(p.answer));
  }
  if (p.type === "choice" || p.type === "explain")
    [].concat(p.answer).forEach((i) => out.push(p.choices[i]));
  if (p.type === "order")
    out.push(p.answer.map((id) => p.items.find((x) => x.id === id).text).join(" "));
  return out.filter(Boolean);
}

function puzzleProblems(p, where, { top }) {
  const bad = [];
  const add = (m) => bad.push(`${where}: ${m}`);
  if (!PUZZLE_TYPES.includes(p.type)) return [`${where}: unknown puzzle type ${p.type}`];
  if (!p.prompt || words(p.prompt) < 6) add("prompt needs at least 6 words");
  if (!Array.isArray(p.hints) || p.hints.length !== 3) add("needs exactly 3 hints");
  if (p.visual && !p.visual.alt) add("visual needs alt");
  if (top) {
    if (!p.model?.text || words(p.model.text) < 15)
      add("model.text needs a worked parallel example (15+ words)");
    if (!p.why) add("why required");
    if (!p.transfer) add("transfer puzzle required");
    else {
      if (p.transfer.type !== p.type) add("transfer must have the same type");
      bad.push(...puzzleProblems(p.transfer, `${where}.transfer`, { top: false }));
    }
    const sup = p.supports;
    if (!sup) add("supports required");
    else for (const t of TIERS) if (!(t in sup)) add(`supports.${t} required`);
    if (sup?.ee && !(sup.ee.directions && (sup.ee.frames?.length || sup.ee.wordBank?.length)))
      add("supports.ee needs directions and frames or wordBank");
  }
  try {
    if (p.type === "numeric") {
      const a = parseRational(p.answer);
      if (!a) add("numeric answer is not a rational");
      else if (p.calc && canon(evalCalc(p.calc)) !== canon(a))
        add(`calc ${p.calc} = ${canon(evalCalc(p.calc))} but answer is ${canon(a)}`);
      else if (top && !p.calc) add("numeric puzzle needs calc");
    } else if (p.type === "choice" || p.type === "explain") {
      if (!Array.isArray(p.choices) || p.choices.length < 3 || p.choices.length > 5)
        add("choices must be 3..5");
      else {
        const ans = [].concat(p.answer);
        if (ans.some((i) => !Number.isInteger(i) || i < 0 || i >= p.choices.length))
          add("answer index out of range");
        if (
          Array.isArray(p.answer) &&
          (p.answer.length < 2 || p.answer.length > p.choices.length - 1)
        )
          add("multi answer needs 2..n-1 indexes");
        if (
          !Array.isArray(p.tokens) ||
          p.tokens.length !== p.choices.length ||
          new Set(p.tokens).size !== p.tokens.length
        )
          add("tokens must be distinct and one per choice");
      }
    } else if (p.type === "order") {
      if (!Array.isArray(p.items) || p.items.length < 3 || p.items.length > 6)
        add("items must be 3..6");
      else {
        const ids = p.items.map((x) => x.id);
        if (new Set(ids).size !== ids.length) add("duplicate item ids");
        if (new Set(p.items.map((x) => x.token)).size !== ids.length)
          add("item tokens must be distinct");
        if (JSON.stringify([...p.answer].sort()) !== JSON.stringify([...ids].sort()))
          add("answer must list every item once");
        if (p.items.every((x) => x.value != null)) {
          const dir = p.endLabels?.start === "greatest" ? -1 : 1;
          const vals = p.answer.map((id) => parseRational(p.items.find((x) => x.id === id).value));
          for (let i = 1; i < vals.length; i++)
            if (cmp(vals[i - 1], vals[i]) * dir >= 0)
              add(`order values not strictly sorted at position ${i + 1}`);
        } else if (top) add("order items need value");
      }
    } else if (p.type === "match") {
      if (!Array.isArray(p.lefts) || p.lefts.length < 3 || p.lefts.length > 5)
        add("lefts must be 3..5");
      else if (
        !Array.isArray(p.rights) ||
        p.rights.length < p.lefts.length ||
        p.rights.length > p.lefts.length + 2
      )
        add("rights must be lefts..lefts+2");
      else {
        const used = p.lefts.map((l) => p.answer[l.id]);
        if (
          used.some((r) => !p.rights.some((x) => x.id === r)) ||
          new Set(used).size !== used.length
        )
          add("answer must map each left to a distinct right");
        if (new Set(p.rights.map((r) => r.token)).size !== p.rights.length)
          add("right tokens must be distinct");
        for (const l of p.lefts) {
          const r = p.rights.find((x) => x.id === p.answer[l.id]);
          if (
            l.calc != null &&
            r?.value != null &&
            canon(evalCalc(l.calc)) !== canon(parseRational(r.value))
          )
            add(`match ${l.id}: calc ${l.calc} does not equal ${r.value}`);
          if (top && (l.calc == null || r?.value == null))
            add(`match ${l.id} needs calc and value`);
        }
      }
    } else if (p.type === "sort") {
      if (!Array.isArray(p.bins) || p.bins.length < 2 || p.bins.length > 3)
        add("bins must be 2..3");
      else if (!Array.isArray(p.cards) || p.cards.length < 4 || p.cards.length > 8)
        add("cards must be 4..8");
      else {
        if (p.cards.some((c) => !p.bins.some((b) => b.id === c.bin)))
          add("card bin does not resolve");
        if (new Set(p.cards.map((c) => c.token)).size !== p.cards.length)
          add("card tokens must be distinct");
        for (const b of p.bins)
          if (!p.cards.some((c) => c.bin === b.id)) add(`bin ${b.id} has no card`);
      }
    }
    if (!bad.length && !isCorrect(p, correctResponse(p))) add("correct response is not accepted");
    if (!bad.length && top && tokenOf(p, correctResponse(p)) == null)
      add("no token for the correct response");
  } catch (e) {
    add(`threw: ${e.message}`);
  }
  if (!bad.length) {
    const leaks = answerTexts(p);
    const lists = [
      ["hints", p.hints],
      ["misconception hint", (p.misconceptions || []).map((m) => m.hint)],
      ["model", top ? [p.model?.text] : []],
    ];
    for (const [name, arr] of lists)
      for (const text of arr || [])
        for (const a of leaks)
          if (text && hasToken(text, a)) add(`${name} contains the answer "${a}"`);
    const tags = new Set();
    for (const m of p.misconceptions || []) {
      if (!KEBAB.test(m.tag || "")) add(`misconception tag "${m.tag}" must be kebab-case`);
      if (tags.has(m.tag)) add(`duplicate misconception tag ${m.tag}`);
      tags.add(m.tag);
      if (!m.hint) add(`misconception ${m.tag} needs hint`);
      if (m.pick == null && !m.has?.length) add(`misconception ${m.tag} needs pick or has`);
    }
  }
  return bad;
}

export function validateEscape(a) {
  const bad = [];
  const add = (m) => bad.push(m);
  if (a.engine !== "escape-challenge") add("engine must be escape-challenge");
  if (!Array.isArray(a.rooms) || a.rooms.length < 3 || a.rooms.length > 5)
    return [...bad, "needs 3..5 rooms"];
  const ids = a.rooms.map((r) => r.id);
  if (new Set(ids).size !== ids.length || ids.some((i) => !KEBAB.test(i || "")))
    add("room ids must be unique kebab-case");
  const beats = a.story?.beats || [];
  if (beats.filter((b) => b.after === "start").length !== 1)
    add("story needs exactly one start beat");
  if (beats.filter((b) => b.after === "end").length !== 1) add("story needs exactly one end beat");
  const afters = new Set();
  for (const b of beats) {
    if (!(b.after === "start" || b.after === "end" || ids.includes(b.after)))
      add(`beat ${b.id} has unresolved after ${b.after}`);
    if (afters.has(b.after)) add(`two beats after ${b.after}`);
    afters.add(b.after);
    if (words(b.text) > 60) add(`beat ${b.id} is over 60 words`);
  }
  const order = a.door?.order || [];
  if (JSON.stringify([...order].sort()) !== JSON.stringify([...ids].sort()))
    add("door.order must be a permutation of room ids");
  if (!a.door?.prompt || !a.door?.success) add("door needs prompt and success");
  for (const r of a.rooms) {
    const w = `room ${r.id}`;
    if (!r.title || !r.narrative || words(r.narrative) < 8)
      add(`${w}: title and narrative (8+ words) required`);
    if (!r.gate?.needs || !KEBAB.test(r.gate.needs) || !r.gate.label)
      add(`${w}: gate.needs (kebab-case) and gate.label required`);
    if (!r.reveal) add(`${w}: reveal required`);
    bad.push(...puzzleProblems(r.puzzle || { type: "?" }, w, { top: true }).map((m) => m));
  }
  const text = JSON.stringify(a);
  if (TIMER.test(text)) add("timer/lives wording found");
  for (const t of TIERS)
    if (!a.reflection?.frames?.[t]?.length) add(`reflection.frames.${t} required`);
  return bad;
}
