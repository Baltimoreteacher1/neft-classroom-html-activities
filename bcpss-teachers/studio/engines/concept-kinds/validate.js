// Validator for concept-builder activities (rules in concept-builder.schema.md). Pure: no DOM needed.
// validateConceptActivity(activity) -> Promise<string[]>  (empty array means valid)
import { TIER_IDS } from "../../data/taxonomy.js";
import { checkLiterals, evaluate, validateCheck } from "./checks.js";
import { KIND_IDS, loadKind } from "./index.js";

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const tiersOk = (o) => o && typeof o === "object" && TIER_IDS.every((t) => t in o);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function checkJustify(j, where, out) {
  if (!isStr(j.prompt)) out.push(`${where}.prompt required`);
  const opts = j.options || [];
  if (opts.length < 3 || opts.length > 6) out.push(`${where}.options needs 3..6 entries`);
  if (new Set(opts.map((o) => o.id)).size !== opts.length || opts.some((o) => !isStr(o.id) || !isStr(o.text) || typeof o.ok !== "boolean")) out.push(`${where}.options need unique id, text and boolean ok`);
  const good = opts.filter((o) => o.ok).length;
  if (!good) out.push(`${where} needs at least one ok:true option`);
  if (good === opts.length) out.push(`${where} needs at least one ok:false option`);
  if (j.min != null && !(Number.isInteger(j.min) && j.min >= 1 && j.min <= good)) out.push(`${where}.min must be 1..${good}`);
  if (!isStr(j.model)) out.push(`${where}.model required`);
}

export async function validateConceptActivity(a) {
  const out = [];
  const bad = (m) => out.push(m);
  if (a?.engine !== "concept-builder") return ["engine must be concept-builder"];
  if (!KIND_IDS.includes(a.kind)) return [`kind must be one of ${KIND_IDS.join(", ")}`];
  for (const f of ["title", "intro", "version", "updated", "source"]) if (!isStr(a[f])) bad(`${f} required`);
  if (!Number.isInteger(a.minutes) || a.minutes < 3 || a.minutes > 60) bad("minutes must be an integer 3..60");
  if (!Array.isArray(a.standards) || !a.standards.length) bad("standards required");
  if (!a.reflection?.prompt || !tiersOk(a.reflection.frames)) bad("reflection needs prompt and frames for every tier");
  if (a.review?.status !== "authored") bad('review.status must be "authored"');
  const kind = await loadKind(a.kind);
  const mp = kind.validateModel(a.model || {});
  mp.forEach((m) => bad(`model: ${m}`));
  if (!Array.isArray(a.tasks) || !a.tasks.length || a.tasks.length > 6) return [...out, "tasks needs 1..6 entries"];
  const ids = new Set();
  for (const [i, t] of a.tasks.entries()) {
    const w = `tasks[${i}](${t.id})`;
    const p = (m) => bad(`${w}: ${m}`);
    if (!isStr(t.id) || ids.has(t.id)) p("id missing or duplicate");
    ids.add(t.id);
    if (!isStr(t.prompt)) p("prompt required");
    if (!isStr(t.model)) p("model text required");
    if (!tiersOk(t.supports)) p("supports needs all four tiers (br may be {})");
    if (!Array.isArray(t.hints) || t.hints.length < 2 || t.hints.length > 4 || t.hints.some((x) => !isStr(x))) p("hints must be 2..4 strings");
    if (!isStr(t.explain?.prompt) || !tiersOk(t.explain?.frames)) p("explain needs prompt and frames for every tier");
    for (const m of t.explain?.mustMention || []) if (!m.id || !m.label || !Array.isArray(m.any) || !m.any.length) p("explain.mustMention entries need id, label, any[]");
    for (const c of t.explain?.criteria || []) if (!c.id || !c.label) p("explain.criteria entries need id and label");
    if (t.justify) checkJustify(t.justify, `${w}.justify`, out);
    const cp = validateCheck(t.check, "check");
    cp.forEach(p);
    const model = { ...a.model, ...(t.setup || {}) };
    if (t.setup) kind.validateModel(model).forEach((m) => p(`setup/model: ${m}`));
    if (!t.target) {
      p("target state required");
      continue;
    }
    const start = t.start ?? kind.initialState(model);
    const sp = kind.validateState(model, start);
    sp.forEach((m) => p(`start: ${m}`));
    const tp = kind.validateState(model, t.target);
    tp.forEach((m) => p(`target: ${m}`));
    if (cp.length || sp.length || tp.length || mp.length) continue;
    try {
      if (!evaluate(t.check, kind.value(model, t.target))) p("target does not satisfy check");
      if (evaluate(t.check, kind.value(model, start))) p("start already satisfies check; the task needs a change");
      if (same(start, t.target)) p("start equals target");
      for (const m of t.misconceptions || []) {
        if (!isStr(m.match) || !isStr(m.hint)) p("misconceptions need match and hint");
        else if (m.when) {
          validateCheck(m.when, `misconception ${m.match}.when`).forEach(p);
          if (evaluate(m.when, kind.value(model, t.target))) p(`misconception ${m.match}: when is true on the target`);
        }
      }
      const lits = checkLiterals(t.check).filter((x) => x.length >= 2 && !["true", "false", "none"].includes(x));
      const esc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      const found = (text, lit) => new RegExp(`(?<![\\w/.])${esc(lit.toLowerCase())}(?![\\w/]|\\.\\d)`).test(text.toLowerCase());
      for (const hnt of t.hints) {
        if (t.answerText && hnt.toLowerCase().includes(String(t.answerText).toLowerCase())) p(`a hint states the answer ("${t.answerText}")`);
        for (const lit of lits) if (found(hnt, lit)) p(`a hint states the answer ("${lit}")`);
      }
    } catch (e) {
      p(`evaluation threw: ${e.message}`);
    }
  }
  return out;
}
