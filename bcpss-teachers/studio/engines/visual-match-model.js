// visual-match: pure data logic (no DOM) so it can be unit-tested in Node.
import { shuffle } from "../core/dom.js";
import { blankOut } from "./st1-text.js";

export const LEVELS = ["recognise", "distinguish", "apply"];
export const MODE_KEY = {
  "term-visual": "visual",
  "term-definition": "definition",
  "term-example": "example",
};
export const LEVEL_TITLE = {
  recognise: "Recognise: match each word",
  distinguish: "Distinguish: close calls",
  apply: "Apply: use the word",
};

export const batchSize = (tier) => (tier === "ee" ? 3 : 4);

/** Rounds with defaults filled in: one per mode, ascending level. */
export function resolveRounds(activity) {
  if (activity.rounds?.length) {
    return activity.rounds.map((r, i) => ({
      level: LEVELS[Math.min(i, 2)],
      title: LEVEL_TITLE[r.level || LEVELS[Math.min(i, 2)]],
      pairIds: activity.pairs.map((p) => p.id),
      ...r,
    }));
  }
  return activity.modes.map((mode, i) => {
    const level = LEVELS[Math.min(i, 2)];
    return {
      id: `r${i + 1}`,
      mode,
      level,
      title: LEVEL_TITLE[level],
      pairIds: activity.pairs.map((p) => p.id),
    };
  });
}

/** Split a round's pairs into batches for this tier. Order is stable and seeded so resume lands on the same batch. */
export function planBatches(activity, round, tier) {
  const ids = shuffle(round.pairIds, `${activity.id}.${round.id}`);
  const n = batchSize(tier);
  const out = [];
  for (let i = 0; i < ids.length; i += n) out.push(ids.slice(i, i + n));
  // Never leave a lone leftover pair: fold it into the previous batch.
  if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(out.pop()[0]);
  return out;
}

export const spanishReady = (activity) =>
  activity.pairs.every((p) => p.es?.term && p.es.verified === true);

const pairById = (activity, id) => activity.pairs.find((p) => p.id === id);

/** The text or visual a card shows for one pair in one mode (Spanish when requested and available). */
export function cardContent(pair, mode, es) {
  if (mode === "term-visual") return { visual: pair.visual, label: pair.visual?.alt || pair.term };
  if (mode === "term-definition") {
    const text = es && pair.es?.definition ? pair.es.definition : pair.definition;
    return { text, label: text };
  }
  const useEs = es && pair.es?.example && pair.es.term;
  const sentence = useEs ? pair.es.example : pair.example;
  const words = useEs ? [pair.es.term] : [pair.term, ...(pair.forms || [])];
  const { text } = blankOut(sentence, words);
  return { text, label: text.replace(/_____/g, "blank") };
}

/** One batch: the cards (slots) and the word bank (chips). Deterministic for a given activity/round/batch. */
export function buildBatch(activity, round, pairIds, batchNo, tier) {
  const mode = round.mode;
  const level = round.level;
  const key = MODE_KEY[mode];
  const distractors = activity.distractors || [];
  const relevant = (d) => !d.pairIds || d.pairIds.some((id) => pairIds.includes(id));

  const slots = pairIds.map((id) => ({ key: `p:${id}`, kind: "pair", pairId: id, mode }));
  const chips = pairIds.map((id) => ({ key: `c:${id}`, kind: "term", pairId: id }));

  if (level !== "recognise") {
    const termD = distractors.filter((d) => d.term && relevant(d)).slice(0, 2);
    for (const d of termD) chips.push({ key: `c:${d.id}`, kind: "distractor", distractorId: d.id });
    const near = [];
    for (const id of pairIds)
      for (const c of pairById(activity, id).confusions || [])
        if (!pairIds.includes(c.pick) && !near.includes(c.pick)) near.push(c.pick);
    for (const id of near.slice(0, 2))
      chips.push({ key: `c:${id}`, kind: "term", pairId: id, near: true });
    const decoy = distractors.find((d) => d[key] && !d.term && relevant(d));
    if (decoy) slots.push({ key: `d:${decoy.id}`, kind: "decoy", decoyId: decoy.id, mode });
  }
  return {
    slots: shuffle(slots, `${activity.id}.${round.id}.s${batchNo}`),
    chips: shuffle(chips, `${activity.id}.${round.id}.c${batchNo}`),
  };
}

/** The item handed to createItemLoop for one pair in one round (ids are unique per round). */
export function itemFor(activity, round, pair, batch) {
  // The feedback box already labels this text "Look at the model", so the text itself starts at the explanation.
  // A confusion without its own model falls back to the pair's explanation, never to its hint.
  const model = pair.why;
  const miss = (pair.confusions || []).map((c) => ({
    pick: c.pick,
    tag: c.tag,
    hint: c.hint,
    model: c.model || model,
  }));
  for (const c of batch.chips)
    if (c.kind === "distractor") {
      const d = activity.distractors.find((x) => x.id === c.distractorId);
      miss.push({ pick: d.id, tag: d.tag, hint: d.hint });
    }
  for (const s of batch.slots)
    if (s.kind === "decoy") {
      const d = activity.distractors.find((x) => x.id === s.decoyId);
      miss.push({ pick: d.id, tag: d.tag, hint: d.hint });
    }
  return {
    id: `${round.id}.${pair.id}`,
    hints: pair.hints,
    misconceptions: miss,
    model,
    right: pair.why,
    transfer: pair.transfer,
  };
}

/** Drop a leading "Look at the model." from authored text: the feedback box already prints that label. */
export const stripModelLead = (text) => String(text || "").replace(/^\s*look at the model[.:]?\s*/i, "");

/** Decide what a placement means. Returns {slotPairId|null, sub|null, note?} for the engine to run through the item loop. */
export function judgePlacement(batch, chipKey, slotKey) {
  const chip = batch.chips.find((c) => c.key === chipKey);
  const slot = batch.slots.find((s) => s.key === slotKey);
  if (!chip || !slot) return null;
  const chipPick = chip.kind === "term" ? chip.pairId : chip.distractorId;
  if (slot.kind === "pair") {
    return {
      loopPairId: slot.pairId,
      sub: { ok: chip.kind === "term" && chip.pairId === slot.pairId, pick: chipPick },
    };
  }
  // A decoy card: the miss counts against the term that was placed when that term belongs to this batch;
  // a near-miss term from another batch, or a distractor chip, only shows the decoy's hint.
  const inBatch = batch.slots.some((s) => s.kind === "pair" && s.pairId === chip.pairId);
  if (chip.kind === "term" && inBatch)
    return { loopPairId: chip.pairId, sub: { ok: false, pick: slot.decoyId } };
  return { loopPairId: null, sub: null, decoyId: slot.decoyId };
}

export function summarise(records) {
  const firstTry = records.filter((r) => r.ok && r.tries === 1 && !r.hints).length;
  const retry = records.filter((r) => r.tries > 1 || r.hints);
  return { total: records.length, firstTry, retry };
}
