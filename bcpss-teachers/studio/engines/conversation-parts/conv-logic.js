// Pure logic for conversation-studio: move-set check, order check with interchangeable groups, starting order,
// support items per move and the pair-view role mapping. No DOM. Schema: engines/conversation-studio.schema.md
import { shuffle } from "../../core/dom.js";

export const flat = (expected) => expected.flat();

/** Set check of the learner's picked moves against the flattened plan. */
export function checkMoves(picked, expected) {
  const want = new Set(flat(expected));
  const got = new Set(picked);
  const extra = [...got].filter((id) => !want.has(id));
  const missing = [...want].filter((id) => !got.has(id));
  return { ok: !extra.length && !missing.length, extra, missing };
}

/**
 * Order check. `expected` is ordered; an element may be an array of ids that can go in either order.
 * Returns {ok, placed, total, firstWrong}: `placed` positions already hold an acceptable move.
 */
export function checkOrder(order, expected) {
  let at = 0;
  let placed = 0;
  let firstWrong = -1;
  const total = flat(expected).length;
  for (const slot of expected) {
    const group = [].concat(slot);
    const chunk = order.slice(at, at + group.length);
    const sameSet = chunk.length === group.length && group.every((id) => chunk.includes(id));
    if (sameSet) placed += group.length;
    else {
      for (const [k, id] of chunk.entries()) {
        if (group.includes(id)) placed += 1;
        else if (firstWrong < 0) firstWrong = at + k;
      }
      if (firstWrong < 0) firstWrong = at;
    }
    at += group.length;
  }
  return {
    ok: placed === total && order.length === total && firstWrong < 0,
    placed,
    total,
    firstWrong,
  };
}

/** Starting order for the Order step: deterministic, and never already correct. */
export function startOrder(ids, expected, seed = "order") {
  if (ids.length < 2) return [...ids];
  for (let n = 0; n < 8; n++) {
    const list = shuffle(ids, `${seed}:${n}`);
    if (!checkOrder(list, expected).ok) return list;
  }
  return [...ids].reverse();
}

/** Move a list element by delta (-1/+1), clamped. Returns a new array. */
export function moveBy(list, index, delta) {
  const to = Math.max(0, Math.min(list.length - 1, index + delta));
  if (to === index) return [...list];
  const out = [...list];
  const [x] = out.splice(index, 1);
  out.splice(to, 0, x);
  return out;
}

/** engine-core item shape (per-tier supports) built from a move so ctx.supportPanel works. */
export function moveSupportItem(move) {
  const supports = {};
  for (const t of ["ee", "dev", "exp", "br"])
    supports[t] = { frames: move.frames?.[t] || [], wordBank: move.wordBank?.[t] || [] };
  return { id: `move-${move.id}`, supports };
}

/** Pair-view labels. Role 0 is Partner A. `swapped` flips who is A/B. */
export function pairLabels(roles, swapped) {
  const [a, b] = swapped ? [roles[1], roles[0]] : roles;
  return { you: a.label, partner: b.label };
}

/** The three-step hint ladder for a learner turn; names the move (the turn's own move), never an option. */
export function turnHints(move) {
  return [
    `This turn practises one move: ${move.label.toLowerCase()}. ${move.function}`,
    move.listenFor
      ? `Listen for this in a good response: ${move.listenFor}`
      : "Read the sentence frames for your level, then compare each response to them.",
    "Read each response aloud. Which one does the job of this move, and which one does only part of it?",
  ];
}

/** Message after a wrong or partial move set; never names the missing move. */
export function movesFeedback(res, moves) {
  if (res.extra.length) {
    const m = moves.find((x) => x.id === res.extra[0]);
    return (
      m?.notFit ||
      "One of the moves you picked does not fit this purpose. Think about what your partner needs to hear."
    );
  }
  if (res.missing.length)
    return res.missing.length === 1
      ? "One move is still missing. Think about what a listener needs from you that is not covered yet."
      : `${res.missing.length} moves are still missing. Think about what a listener needs from you that is not covered yet.`;
  return "";
}

/** Teacher-sheet text of the plan the learner built (move labels in order). */
export function planLabels(order, moves) {
  return order.map((id) => moves.find((m) => m.id === id)?.label || id);
}

/** BCP 47 tag as accepted by speech synthesis, for example "en-US" or "es-US". */
export const isLangTag = (v) => typeof v === "string" && /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(v);

/** Speech options for one spoken line: the line's own `lang`, else the activity's `speechLang`, else the speech default. */
export const speechOpts = (activity, line) => {
  const lang = line?.lang || activity?.speechLang;
  return lang ? { lang } : {};
};
