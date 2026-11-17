// Math Studio core: the validated contracts, the deterministic support ladder, answer checking, the model <-> practice
// adapters and the saved state. No DOM here, so tools/math-studio.test.mjs runs every rule in Node.
import { controls, evaluate, numericAnswer, puzzle } from '../../curriculum/learning-labs/shared/math.mjs';

export const STAGES = ['explore', 'understand', 'practice', 'apply', 'reflect'];
export const STAGE_NAMES = {
  explore: ['Explore', 'Explora'],
  understand: ['Understand', 'Comprende'],
  practice: ['Practice', 'Practica'],
  apply: ['Apply', 'Aplica'],
  reflect: ['Reflect', 'Reflexiona'],
};
export const STORE_PREFIX = 'ewl:math-studio:v1:';
const LESSON_ID = /^\d+-\d+$/;

// ---- Contracts ------------------------------------------------------------------------------------------------------
// Each field names a check; a trailing ? makes it optional. validate() throws a TypeError naming every bad field, so a
// broken hand-off fails loudly instead of opening a model on the wrong numbers.
const CHECKS = {
  lesson: (v) => typeof v === 'string' && LESSON_ID.test(v),
  str: (v) => typeof v === 'string' && v.length > 0,
  int: (v) => Number.isInteger(v) && v >= 0,
  num: (v) => typeof v === 'number' && Number.isFinite(v),
  nums: (v) => Array.isArray(v) && v.length > 0 && v.every((n) => typeof n === 'number' && Number.isFinite(n)),
  strs: (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
  stage: (v) => STAGES.includes(v),
  any: () => true,
};
export const CONTRACTS = {
  // Practice -> model: the question's own quantities, verified at build time against the model's evaluation.
  handoff: { lessonId: 'lesson', conceptId: 'str', modelId: 'str', problemId: 'str', params: 'nums', response: 'any?', misconception: 'str?', hintLevel: 'int', supports: 'strs', returnTo: 'stage' },
  // Model -> practice: a fresh item built from the model's current state.
  transfer: { lessonId: 'lesson', conceptId: 'str', modelId: 'str', problemId: 'str', start: 'nums', free: 'int', target: 'num', metric: 'str', tolerance: 'num' },
  item: { id: 'str', kind: 'str', prompt: 'str' },
};
export function validate(kind, obj) {
  const spec = CONTRACTS[kind];
  if (!spec) throw new TypeError(`Unknown contract: ${kind}`);
  if (!obj || typeof obj !== 'object') throw new TypeError(`${kind}: expected an object`);
  const bad = Object.entries(spec).filter(([field, rule]) => {
    const optional = rule.endsWith('?');
    const value = obj[field];
    if (value === undefined || value === null) return !optional;
    return !CHECKS[rule.replace('?', '')](value);
  }).map(([field]) => field);
  if (bad.length) throw new TypeError(`${kind}: invalid ${bad.join(', ')}`);
  return obj;
}

// ---- Answer checking ------------------------------------------------------------------------------------------------
/** A multiple-choice answer. Feedback and the misconception come only from what was authored for that choice. */
export function checkChoice(item, choice, misconceptions = {}) {
  const correct = choice === item.correct;
  const tag = correct ? null : item.tags?.[choice] || null;
  const trap = tag && misconceptions[tag] ? { id: tag, ...misconceptions[tag] } : null;
  return { correct, feedback: correct ? '' : item.feedback?.[choice] || '', feedbackEs: correct ? '' : item.feedbackEs?.[choice] || '', misconception: trap };
}

/** A numeric answer: fractions and mixed numbers are accepted; a known slip gets its authored feedback. */
export function checkNumber(item, text) {
  const value = numericAnswer(text);
  if (!Number.isFinite(value)) return { correct: false, parsed: false, feedback: '' };
  const tol = item.tolerance ?? 1e-6;
  const correct = Math.abs(value - item.answer) <= tol;
  const slip = correct ? null : (item.mistakes || []).find((m) => Math.abs(m.answer - value) <= Math.max(tol, 1e-6));
  return { correct, parsed: true, value, feedback: slip?.feedback || '' };
}

/** Error analysis: the student names the step where the mistake happens. */
export const checkStep = (item, step) => ({ correct: step === item.errorStep });

/** Keywords a written explanation mentions. Reported as evidence, never as a grade. */
export function keywordEvidence(text, keywords = []) {
  const t = String(text || '').toLowerCase();
  const used = keywords.filter((k) => t.includes(String(k).toLowerCase()));
  return { used, missing: keywords.filter((k) => !used.includes(k)) };
}

// ---- Support ladder -------------------------------------------------------------------------------------------------
// Decisions use only what happened on this item: wrong attempts, hints opened, whether the model was used. Three levels
// of help, then a complete worked example, then a DIFFERENT question. Language settings never change the mathematics.
export const SUPPORT_LEVELS = ['cue', 'visual', 'guide', 'worked'];
export function freshRecord() {
  return { attempts: 0, wrong: 0, hints: 0, model: false, worked: false, result: null, response: null };
}
/** The help to offer next. `hasModel` is true only when the item has a verified model hand-off. */
export function nextSupport(rec, item, hasModel) {
  if (rec.result) return { level: null };
  const hints = item.hints || [];
  if (rec.wrong >= 3 || rec.hints >= 4) return { level: 'worked' };
  const step = Math.max(rec.wrong, rec.hints);
  if (step === 0) return { level: 'cue', text: hints[0] || '' };
  if (step === 1) return hasModel ? { level: 'visual', text: hints[1] || hints[0] || '' } : { level: 'guide', text: hints[1] || hints[0] || '' };
  return { level: 'guide', text: hints[2] || hints[hints.length - 1] || '' };
}
/** Fold one attempt into the record. Independent = right first time with no hints, no model and no worked example. */
export function recordAttempt(rec, correct, response) {
  const next = { ...rec, attempts: rec.attempts + 1, response };
  if (correct) next.result = rec.wrong === 0 && rec.hints === 0 && !rec.model && !rec.worked ? 'independent' : 'supported';
  else next.wrong = rec.wrong + 1;
  return next;
}
export const revealWorked = (rec) => ({ ...rec, worked: true, result: rec.result || 'revealed' });

/** The next item to offer after one is finished: an unanswered item, preferring one that shares a misconception tag. */
export function pickNext(items, records, current) {
  const open = items.filter((it) => it.id !== current?.id && !records[it.id]?.result);
  if (!open.length) return null;
  const tags = new Set((current?.tags || []).filter(Boolean));
  return open.find((it) => (it.tags || []).some((t) => t && tags.has(t))) || open[0];
}

// ---- Model adapters -------------------------------------------------------------------------------------------------
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)))).replace('-', '−');
const usedFields = (model) => controls(model).map((f, i) => ({ ...f, i })).filter((f) => f.label !== 'Unused');
export const conceptId = (model) => `${model.kind}:${model.mode}`;

/** The model's settings in words, e.g. "Juice (cups) = 3, Water (cups) = 2". */
export function describeSettings(model, values, skip = -1) {
  return usedFields(model).filter((f) => f.i !== skip).map((f) => `${f.label} = ${fmt(values[f.i])}`).join(', ');
}

/** Model -> practice: ask for the readout the student just watched, with the model hidden. Null when not meaningful. */
export function predictItem(model, values, lessonId) {
  if (model.kind === 'inequality') return null; // the readout is the test value itself
  let r;
  try { r = evaluate(model, values); } catch { return null; }
  if (!Number.isFinite(r.value)) return null;
  const tolerance = Number.isInteger(r.value) ? 1e-9 : 0.006;
  return validate('item', {
    id: `predict-${conceptId(model)}-${values.join('_')}`,
    kind: 'num',
    lessonId,
    prompt: `The model is set to ${describeSettings(model, values)}. Without the model, what is the ${r.label.toLowerCase()}?`,
    answer: r.value,
    tolerance,
    unit: r.unit || '',
    explanation: `${r.equation}. ${r.note}`,
    hints: [`Use the same relationship the readout used: ${r.label.toLowerCase()}.`, `Work it out: ${r.equation.split('=')[0].trim()}.`],
    mistakes: [],
  });
}

/** Model -> practice transfer: a new target the student must reach by reasoning about one quantity. */
export function transferTask(model, lessonId, round = 1, level = 1) {
  let p;
  try { p = puzzle(model, round, level); } catch { return null; }
  const fields = controls(model);
  const field = fields[p.free];
  if (!field || field.label === 'Unused') return null;
  return validate('transfer', {
    lessonId,
    conceptId: conceptId(model),
    modelId: `${model.kind}`,
    problemId: `transfer-${conceptId(model)}-${round}-${level}`,
    start: p.start,
    free: p.free,
    target: p.target,
    metric: p.metric,
    tolerance: Math.max(p.tolerance, Number.isInteger(p.target) ? 1e-9 : 0.006),
    prompt: `New problem, no model. Keep ${describeSettings(model, p.start, p.free) || 'everything else the same'}. What value of “${field.label}” makes the ${p.metric.toLowerCase()} equal ${fmt(p.target)}?`,
    field: field.label,
  });
}
/** A transfer answer is right when it produces the target: checked through the relationship, so every valid value counts. */
export function checkTransfer(model, task, text) {
  const value = numericAnswer(text);
  if (!Number.isFinite(value)) return { correct: false, parsed: false };
  const values = task.start.map((v, i) => (i === task.free ? value : v));
  let r;
  try { r = evaluate(model, values); } catch { return { correct: false, parsed: true, value }; }
  return { correct: Math.abs(r.value - task.target) <= task.tolerance, parsed: true, value, got: r.value };
}

/** Build-time check that a practice item's stated settings really produce its answer in the model. */
/**
 * Build-time check for a "find the missing quantity" item: the given settings plus `answer` in the missing control must
 * solve it. A balance must balance; an inequality's answer must follow the rule while the next whole number past it
 * does not (the smallest/greatest value). The model itself still opens on the lab's default for the unknown.
 */
export function verifySolve(model, values, missing, answer, prompt = '') {
  const fields = controls(model);
  if (!Number.isInteger(missing) || !fields[missing] || !Number.isFinite(answer)) return false;
  const at = (v) => evaluate(model, values.map((x, i) => (i === missing ? v : x)));
  try {
    if (model.kind === 'balance') return Math.abs(at(answer).value) < 1e-6;
    if (model.kind === 'inequality') {
      const away = /greatest|largest|most/i.test(prompt) ? 1 : /smallest|least|fewest/i.test(prompt) ? -1 : 0;
      return Boolean(away) && at(answer).pass === true && at(answer + away).pass === false;
    }
  } catch { return false; }
  return false;
}

export function verifyHandoff(model, values, answer, tolerance = 1e-4) {
  if (!Array.isArray(values) || values.length !== model.values.length) return false;
  const fields = controls(model);
  if (values.some((v, i) => !Number.isFinite(v) || v < fields[i].min - 1e-9 || v > fields[i].max + 1e-9)) return false;
  try { return Math.abs(evaluate(model, values).value - answer) <= Math.max(tolerance, 1e-4); } catch { return false; }
}

// ---- Saved state ----------------------------------------------------------------------------------------------------
export function freshState(lessonId) {
  return {
    version: 1, lessonId, stage: 'explore', visited: [], updatedAt: 0,
    explore: { started: false, prediction: '', notes: '', values: null, checks: {} },
    understand: { step: 0, answer: '', checks: {} },
    practice: { level: 'regular', current: { regular: null, challenge: null }, items: {} },
    apply: { responses: {}, compared: {} },
    reflect: { items: {}, writing: '', revised: {} },
    background: {},
    handoff: null,
  };
}
/** Additive load: unknown or older fields never erase valid work, and a different version starts fresh. */
export function loadState(storage, lessonId) {
  const base = freshState(lessonId);
  let saved = null;
  try { saved = JSON.parse(storage.getItem(STORE_PREFIX + lessonId) || 'null'); } catch { saved = null; }
  if (!saved || saved.version !== 1 || saved.lessonId !== lessonId) return base;
  const merged = { ...base, ...saved };
  for (const key of ['explore', 'understand', 'practice', 'apply', 'reflect']) merged[key] = { ...base[key], ...(saved[key] || {}) };
  merged.practice.current = { ...base.practice.current, ...(saved.practice?.current || {}) };
  if (!STAGES.includes(merged.stage)) merged.stage = 'explore';
  return merged;
}
export function saveState(storage, state) {
  state.updatedAt = Date.now();
  try { storage.setItem(STORE_PREFIX + state.lessonId, JSON.stringify(state)); return true; } catch { return false; }
}

// ---- Evidence -------------------------------------------------------------------------------------------------------
/** Participation, completion, supported correctness and independent understanding, kept apart. */
export function evidence(state, data) {
  const recs = { ...state.practice.items };
  const practice = (level) => {
    const ids = (data.practice[level] || []).map((it) => it.id);
    const r = ids.map((id) => recs[id]).filter(Boolean);
    return {
      total: ids.length,
      tried: r.filter((x) => x.attempts > 0 || x.result).length,
      independent: r.filter((x) => x.result === 'independent').length,
      supported: r.filter((x) => x.result === 'supported').length,
      revealed: r.filter((x) => x.result === 'revealed').length,
      hints: r.reduce((a, x) => a + (x.hints || 0), 0),
      attempts: r.reduce((a, x) => a + (x.attempts || 0), 0),
      model: r.filter((x) => x.model).length,
    };
  };
  const reflectIds = (data.reflect.checks || []).map((it) => it.id);
  const rr = reflectIds.map((id) => state.reflect.items[id]).filter(Boolean);
  const errors = {};
  for (const r of [...Object.values(recs), ...rr]) for (const tag of r.tags || []) errors[tag] = (errors[tag] || 0) + 1;
  return {
    explored: Boolean(state.explore.prediction || state.explore.notes || Object.keys(state.explore.checks).length),
    understood: state.visited.includes('understand'),
    regular: practice('regular'),
    challenge: practice('challenge'),
    applied: Object.values(state.apply.responses).filter((t) => String(t).trim().length >= 15).length,
    reflect: {
      total: reflectIds.length,
      independent: rr.filter((x) => x.result === 'independent').length,
      revised: rr.filter((x) => x.result === 'supported').length,
      notYet: rr.filter((x) => x.result === 'revealed' || (x.attempts && !x.result)).length,
      wrote: String(state.reflect.writing || '').trim().length >= 15,
    },
    errors,
  };
}
