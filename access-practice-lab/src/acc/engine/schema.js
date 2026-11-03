// Assessment question schema. One validated shape for every item the assessment engine delivers, so the canvas,
// the scorer, the session and the teacher views read the same fields. Phase 6 extends `meta` (WIDA alignment)
// without changing the response contract defined here.
export const QUESTION_TYPES = Object.freeze([
  "multiple-choice",
  "multiple-select",
  "dropdown",
  "ordering",
  "matching",
  "drag-drop",
  "constructed-response",
  "listening-response",
  "speaking-response",
]);
export const OBJECTIVE_TYPES = Object.freeze(["multiple-choice", "multiple-select", "dropdown", "ordering", "matching", "drag-drop", "listening-response"]);
export const DOMAINS = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);
export const KLUS = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const GRADES = Object.freeze(["3-5", "6-8"]);
export const STIMULUS_KINDS = Object.freeze(["passage", "audio", "image", "table", "prompt"]);
export const MODES = Object.freeze(["summative", "formative"]);

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isArr = (v, min = 1) => Array.isArray(v) && v.length >= min;
const ids = (list) => (Array.isArray(list) ? list.map((x) => x?.id) : []);
const unique = (list) => new Set(list).size === list.length;

const choiceErrors = (item, push) => {
  if (!isArr(item.options, 2)) return push("options: at least two choices");
  if (!item.options.every((o) => isStr(o.id) && isStr(o.text))) push("options: every choice needs id and text");
  if (!unique(ids(item.options))) push("options: ids must be unique");
  const texts = item.options.map((o) => String(o.text).trim().toLowerCase());
  if (!unique(texts)) push("options: two choices have the same text");
  const answer = item.type === "multiple-select" ? item.answer : [item.answer];
  if (!isArr(answer) || !answer.every((a) => ids(item.options).includes(a))) push("answer: must name existing choice id(s)");
  if (item.type === "multiple-select" && Array.isArray(item.answer) && item.answer.length < 2) push("answer: multiple-select needs two or more correct choices");
};

const TYPE_CHECKS = {
  "multiple-choice": choiceErrors,
  "listening-response": choiceErrors,
  "multiple-select": choiceErrors,
  dropdown(item, push) {
    const d = item.dropdown;
    if (!d || !isStr(d.template)) return push("dropdown.template required");
    const keys = [...String(d.template).matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    if (!keys.length) return push("dropdown.template needs at least one {blank}");
    for (const k of keys) {
      const b = d.blanks?.[k];
      if (!b || !isArr(b.options, 2) || !b.options.includes(b.answer)) push(`dropdown.blanks.${k}: options and an answer from them`);
    }
  },
  ordering(item, push) {
    const o = item.ordering;
    if (!o || !isArr(o.items, 3)) return push("ordering.items: at least three");
    if (!unique(ids(o.items))) push("ordering.items: ids must be unique");
    if (!isArr(o.answer) || [...o.answer].sort().join() !== ids(o.items).sort().join()) push("ordering.answer must list every item id once");
    if (isArr(o.answer) && o.answer.join() === ids(o.items).join()) push("ordering: the shown order must not already be the answer");
  },
  matching(item, push) {
    const m = item.matching;
    if (!m || !isArr(m.left, 2) || !isArr(m.right, 2)) return push("matching.left/right: at least two each");
    const answer = m.answer || {};
    if (Object.keys(answer).sort().join() !== ids(m.left).sort().join()) push("matching.answer must map every left id");
    if (!Object.values(answer).every((r) => ids(m.right).includes(r))) push("matching.answer targets must exist");
  },
  "drag-drop"(item, push) {
    const d = item.dragDrop;
    if (!d || !isArr(d.tokens, 2) || !isArr(d.zones, 2)) return push("dragDrop.tokens/zones: at least two each");
    const answer = d.answer || {};
    if (Object.keys(answer).sort().join() !== ids(d.tokens).sort().join()) push("dragDrop.answer must place every token");
    if (!Object.values(answer).every((z) => ids(d.zones).includes(z))) push("dragDrop.answer zones must exist");
  },
  "constructed-response"(item, push) {
    const c = item.constructed;
    if (!c || !Number.isInteger(c.minWords) || c.minWords < 1) return push("constructed.minWords required");
    if (Number.isInteger(c.maxWords) && c.maxWords < c.minWords) push("constructed.maxWords below minWords");
  },
  "speaking-response"(item, push) {
    const s = item.speaking;
    if (!s || !(s.prepSeconds >= 0) || !(s.recordSeconds >= 10)) push("speaking.prepSeconds and recordSeconds (>= 10) required");
    if (s && ![1, 2].includes(s.takes ?? 1)) push("speaking.takes must be 1 or 2");
  },
};

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateItem(item, { stimulusIds = null } = {}) {
  const errors = [];
  const push = (m) => errors.push(`${item?.id ?? "?"}: ${m}`);
  if (!item || typeof item !== "object") return { ok: false, errors: ["item must be an object"] };
  if (!isStr(item.id)) push("id required");
  if (!QUESTION_TYPES.includes(item.type)) push(`type must be one of ${QUESTION_TYPES.join(", ")}`);
  if (!isStr(item.stem)) push("stem required");
  if (item.domain && !DOMAINS.includes(item.domain)) push(`domain must be one of ${DOMAINS.join(", ")}`);
  if (item.klu && !KLUS.includes(item.klu)) push(`klu must be one of ${KLUS.join(", ")}`);
  if (item.stimulus && stimulusIds && !stimulusIds.includes(item.stimulus)) push(`stimulus "${item.stimulus}" is not defined in the set`);
  TYPE_CHECKS[item.type]?.(item, push);
  const s = item.support;
  if (s !== undefined) {
    for (const tier of ["clue", "frame", "model"]) if (s[tier] !== undefined && !isStr(s[tier])) push(`support.${tier} must be text`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateSet(set) {
  const errors = [];
  if (!isStr(set?.id)) errors.push("set.id required");
  if (!isStr(set?.title)) errors.push(`${set?.id}: title required`);
  if (!GRADES.includes(set?.grade)) errors.push(`${set?.id}: grade must be ${GRADES.join(" or ")}`);
  const stimuli = set?.stimuli ?? [];
  for (const s of stimuli) {
    if (!isStr(s.id) || !STIMULUS_KINDS.includes(s.kind)) errors.push(`${set.id}: stimulus ${s.id} needs an id and a kind`);
    if (s.kind === "passage" && !isArr(s.paragraphs)) errors.push(`${set.id}: passage ${s.id} needs paragraphs`);
    if (s.kind === "audio" && !isStr(s.script)) errors.push(`${set.id}: audio ${s.id} needs a script`);
    if (s.kind === "image" && !(isStr(s.src) && isStr(s.alt))) errors.push(`${set.id}: image ${s.id} needs src and alt text`);
  }
  if (!unique(ids(stimuli))) errors.push(`${set?.id}: stimulus ids must be unique`);
  if (!isArr(set?.items)) errors.push(`${set?.id}: items required`);
  else {
    if (!unique(ids(set.items))) errors.push(`${set.id}: item ids must be unique`);
    for (const item of set.items) errors.push(...validateItem(item, { stimulusIds: ids(stimuli) }).errors);
  }
  return { ok: errors.length === 0, errors };
}
