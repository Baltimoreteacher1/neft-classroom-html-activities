// TWR: pure rules for the sets (shape, answer checks, the live writing checklist, stars). No DOM, so the content
// test and the player use the same code. Progress lives on this device only, one small record per set:
// `accessPracticeLab:v1:twr:<setId>`. Nothing here is timed, ranked or sent anywhere.
import { PREFIX } from "../store.js";
import { safeJson, storage } from "../util.js";
import { checkBoxes, checkBuild, buildText } from "../prep/model.js";

export { checkBoxes, checkBuild, buildText };

const key = (id) => `${PREFIX}:twr:${id}`;
export const loadState = (id) =>
  safeJson(storage.get(key(id)), null) || {
    step: 0,
    i: 0,
    answers: {},
    checked: {},
    tries: {},
    done: false,
  };
export function saveState(id, state) {
  storage.set(key(id), JSON.stringify({ ...state, at: new Date().toISOString() }));
}
export const resetState = (id) => storage.remove(key(id));
export const isDone = (id) => Boolean(loadState(id).done);

/** Item kinds the player knows. One list: the content test and the renderer both read it. */
export const KINDS = ["choice", "blanks", "pick", "order"];

export const wordList = (text) =>
  String(text || "")
    .toLowerCase()
    .match(/[a-z0-9']+/g) || [];

/** One live-checklist rule: `any` words or phrases, `min` words, `re` pattern, or `end` (. ? !) / `cap` (capital start). */
export function ruleMet(rule, text) {
  const t = String(text || "").trim();
  const low = t.toLowerCase();
  const tokens = wordList(low);
  if (rule.any)
    return rule.any.some((w) =>
      w.includes(" ") || /[^a-z']/i.test(w)
        ? low.includes(w.toLowerCase())
        : tokens.includes(w.toLowerCase()),
    );
  if (rule.min) return tokens.length >= rule.min;
  if (rule.re) return new RegExp(rule.re, "i").test(t);
  if (rule.end) return /[.!?]["')]?$/.test(t);
  if (rule.cap) return /^[A-Z]/.test(t);
  return false;
}
export const writeChecklist = (write, text) =>
  write.checks.map((r) => ({ rule: r, ok: ruleMet(r, text) }));
export const writeComplete = (write, text) => writeChecklist(write, text).every((c) => c.ok);

/** An order item: the learner picks a position for each shuffled line; every position must match. */
export function checkOrder(item, picks = {}) {
  const slots = Object.fromEntries(item.lines.map((l, i) => [i, Number(picks[i]) === i + 1]));
  const right = Object.values(slots).filter(Boolean).length;
  return { ok: right === item.lines.length, right, total: item.lines.length, slots };
}

/** Right or wrong for a pick item (checkboxes). */
export const checkPick = (item, picked = []) => checkBoxes(item.options, picked);

/** Three stars for a clean run, two for a few retries, one for finishing. Never zero: finishing is the goal. */
export function starsFor(st) {
  const wrong = Object.values(st.tries || {}).reduce((a, b) => a + b, 0);
  return wrong <= 1 ? 3 : wrong <= 4 ? 2 : 1;
}

const isTxt = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const pair = (p) => Array.isArray(p) && isTxt(p[0]) && isTxt(p[1]);
const sameLang = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/** Every problem with one item, as plain strings. Empty means the item is playable and its key is sound. */
export function itemProblems(it) {
  const out = [];
  if (!KINDS.includes(it?.kind)) return [`unknown kind ${it?.kind}`];
  if (!isTxt(it.prompt)) out.push("missing prompt");
  if (!isTxt(it.why, 12)) out.push("missing why");
  if (it.kind === "choice") {
    const ids = new Set((it.options || []).map((o) => o.id));
    if ((it.options || []).length < 2 || ids.size !== it.options.length)
      out.push("choice needs 2+ unique options");
    if (!ids.has(it.answer)) out.push("answer id not in options");
    if ((it.options || []).some((o) => !isTxt(o.text))) out.push("option without text");
  }
  if (it.kind === "blanks") {
    const blanks = (it.parts || []).filter((p) => typeof p === "object");
    if (!blanks.length) out.push("blanks without a blank");
    if (blanks.some((b) => !b.options?.includes(b.answer) || b.options.length < 2))
      out.push("blank answer not in options");
    if (!isTxt(it.model)) out.push("blanks needs model");
    else if (buildText(it.parts || []).trim() !== it.model.trim())
      out.push("blanks model != built sentence");
  }
  if (it.kind === "pick") {
    const opts = it.options || [];
    if (opts.length < 3 || !opts.some((o) => o.right) || !opts.some((o) => !o.right))
      out.push("pick needs 3+ options, right and wrong");
    if (new Set(opts.map((o) => o.id)).size !== opts.length) out.push("pick ids not unique");
  }
  if (it.kind === "order") {
    if ((it.lines || []).length < 3 || it.lines.length > 5) out.push("order needs 3-5 lines");
    if (new Set(it.lines || []).size !== (it.lines || []).length) out.push("order lines repeat");
  }
  return out;
}

/** Every problem with one set. The player renders only sets with none; tools/twr-content.test.mjs pins them all. */
export function setProblems(s) {
  const out = [];
  if (!isTxt(s?.id) || !isTxt(s.title) || !isTxt(s.titleEs)) return ["id/title/titleEs"];
  if (sameLang(s.title, s.titleEs) && /[a-z]{4,} [a-z]{4,}/i.test(s.title))
    out.push("titleEs is a copy");
  if (!isTxt(s.area)) out.push("area");
  if (!(s.minutes >= 3 && s.minutes <= 12)) out.push("minutes 3-12");
  const L = s.learn || {};
  if (!isTxt(L.rule, 12) || !isTxt(L.ruleEs, 12)) out.push("learn.rule/ruleEs");
  if (!isTxt(L.model, 8)) out.push("learn.model");
  if (!isTxt(L.notice, 8)) out.push("learn.notice");
  if (!(s.items?.length >= 5 && s.items.length <= 7)) out.push("5-7 items");
  (s.items || []).forEach((it, i) =>
    itemProblems(it).forEach((p) => out.push(`item ${i + 1}: ${p}`)),
  );
  const W = s.write || {};
  if (!isTxt(W.prompt, 12) || !isTxt(W.promptEs, 12)) out.push("write.prompt/promptEs");
  if (!isTxt(W.model, 8)) out.push("write.model");
  if (
    !(W.checks?.length >= 2 && W.checks.length <= 4) ||
    W.checks.some((c) => !pair(c.label) || (!W.say && !(c.any || c.min || c.re || c.end || c.cap)))
  )
    out.push("write.checks 2-4 with label pair + rule");
  else if (!W.say && !writeComplete(W, W.model)) out.push("write.model fails its own checklist");
  if (!pair([s.familyTalk?.en, s.familyTalk?.es])) out.push("familyTalk en/es");
  if (!isTxt(s.teacherTip?.en, 12) || !isTxt(s.teacherTip?.es, 12)) out.push("teacherTip en/es");
  return out;
}
