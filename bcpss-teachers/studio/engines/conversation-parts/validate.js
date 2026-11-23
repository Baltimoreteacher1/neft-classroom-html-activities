// Validator for conversation-studio activities (rules in conversation-studio.schema.md).
// validateConversationActivity(activity) -> Promise<string[]> (empty means valid)
import { TIER_IDS } from "../../data/taxonomy.js";
import { isLangTag } from "./conv-logic.js";

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const FITS = ["strong", "partial", "off"];
const flat = (expected) => expected.flat();

export async function validateConversationActivity(a) {
  const out = [];
  const bad = (m) => out.push(m);
  if (a?.engine !== "conversation-studio") return ["engine must be conversation-studio"];
  for (const f of ["title", "intro", "version", "updated", "source"]) if (!isStr(a[f])) bad(`${f} required`);
  if (!Number.isInteger(a.minutes) || a.minutes < 5 || a.minutes > 60) bad("minutes must be an integer 5..60");
  if (!Array.isArray(a.standards) || !a.standards.length) bad("standards required");
  if (!isStr(a.topic?.title) || !isStr(a.topic?.context)) bad("topic needs title and context");
  if (a.topic?.visual && (!a.topic.visual.kind || !isStr(a.topic.visual.alt))) bad("topic.visual needs kind and alt");
  if (!Array.isArray(a.roles) || a.roles.length !== 2 || a.roles.some((r) => !isStr(r.id) || !isStr(r.label) || !isStr(r.job))) bad("roles must be exactly two {id,label,job}");
  if (!a.reflection?.prompt || !TIER_IDS.every((t) => a.reflection.frames && t in a.reflection.frames)) bad("reflection needs prompt and frames for every tier");
  if (a.speechLang != null && !isLangTag(a.speechLang)) bad('speechLang must be a language tag such as "es-US"');
  if (a.review?.status !== "authored") bad('review.status must be "authored"');

  const sc = a.successCriteria || [];
  if (sc.length < 3 || sc.length > 6 || sc.some((c) => !isStr(c.id) || !isStr(c.label)) || new Set(sc.map((c) => c.id)).size !== sc.length) bad("successCriteria needs 3..6 entries with unique id and label");
  const rc = a.rubric?.criteria || [];
  if (rc.length < 3 || rc.length > 5) bad("rubric.criteria needs 3..5 entries");
  for (const c of rc) {
    const lv = c.levels || [];
    if (!isStr(c.id) || !isStr(c.label)) bad("rubric criteria need id and label");
    if (lv.length < 3 || lv.length > 4 || lv.some((l) => !Number.isInteger(l.score) || !isStr(l.descriptor)) || lv.some((l, i) => i && l.score <= lv[i - 1].score)) bad(`rubric ${c.id}: needs 3..4 levels with ascending integer scores and descriptors`);
  }

  const moves = a.moves || [];
  if (moves.length < 4 || moves.length > 14) bad("moves needs 4..14 entries");
  const mid = new Set();
  for (const m of moves) {
    const w = `move ${m.id}`;
    if (!isStr(m.id) || mid.has(m.id)) bad(`${w}: id missing or duplicate`);
    mid.add(m.id);
    for (const f of ["label", "function", "example"]) if (!isStr(m[f])) bad(`${w}: ${f} required`);
    if (m.lang != null && !isLangTag(m.lang)) bad(`${w}: lang must be a language tag such as "es-US"`);
    if (!m.frames || !TIER_IDS.every((t) => Array.isArray(m.frames[t]) && m.frames[t].every(isStr))) bad(`${w}: frames needs all four tiers as string arrays`);
    else for (const t of ["ee", "dev", "exp"]) if (!m.frames[t].length) bad(`${w}: frames.${t} needs at least one frame`);
    if (m.wordBank && TIER_IDS.some((t) => t in m.wordBank && !Array.isArray(m.wordBank[t]))) bad(`${w}: wordBank tiers must be arrays`);
  }

  const purposes = a.purposes || [];
  if (purposes.length < 1 || purposes.length > 4) bad("purposes needs 1..4 entries");
  const pid = new Set();
  for (const p of purposes) {
    const w = `purpose ${p.id}`;
    if (!isStr(p.id) || pid.has(p.id)) bad(`${w}: id missing or duplicate`);
    pid.add(p.id);
    if (!isStr(p.label) || !isStr(p.description)) bad(`${w}: label and description required`);
    const pool = p.moveIds || [];
    if (pool.some((x) => !mid.has(x))) bad(`${w}: moveIds refers to a move that does not exist`);
    const plan = p.plan || {};
    if (!isStr(plan.prompt) || !isStr(plan.model)) bad(`${w}: plan needs prompt and model`);
    const exp = Array.isArray(plan.expected) ? flat(plan.expected) : [];
    if (exp.length < 2) bad(`${w}: plan.expected needs at least two moves`);
    if (new Set(exp).size !== exp.length) bad(`${w}: plan.expected repeats a move`);
    if (exp.some((x) => !pool.includes(x))) bad(`${w}: every expected move must be in moveIds`);
    if (pool.every((x) => exp.includes(x))) bad(`${w}: moveIds needs at least one move outside the plan (a real choice)`);
    if (!Array.isArray(plan.hints) || plan.hints.length < 2 || plan.hints.length > 4 || plan.hints.some((x) => !isStr(x))) bad(`${w}: plan.hints must be 2..4 strings`);
    else for (const hnt of plan.hints) for (const id of exp) {
      const label = moves.find((m) => m.id === id)?.label;
      if (label && hnt.toLowerCase().includes(label.toLowerCase())) bad(`${w}: a hint names the move "${label}"`);
    }
    if (plan.why && plan.why.length !== plan.expected.length) bad(`${w}: plan.why needs one entry per expected position`);
    const turns = p.rehearsal?.turns || [];
    if (turns.length < 4) bad(`${w}: rehearsal.turns needs at least 4 turns`);
    if (turns[0] && turns[0].speaker !== "partner") bad(`${w}: the first rehearsal turn must be the partner`);
    if (turns.filter((t) => t.speaker === "you").length < 2) bad(`${w}: needs at least two learner turns`);
    const tid = new Set();
    for (const t of turns) {
      const tw = `${w} turn ${t.id}`;
      if (!isStr(t.id) || tid.has(t.id)) bad(`${tw}: id missing or duplicate`);
      tid.add(t.id);
      if (t.speaker === "partner") {
        if (!isStr(t.say)) bad(`${tw}: partner turn needs say`);
        if (t.lang != null && !isLangTag(t.lang)) bad(`${tw}: lang must be a language tag such as "es-US"`);
      } else if (t.speaker === "you") {
        if (!isStr(t.prompt)) bad(`${tw}: prompt required`);
        if (!mid.has(t.moveId)) bad(`${tw}: moveId does not exist`);
        const op = t.options || [];
        if (op.length < 3 || op.length > 4) bad(`${tw}: options needs 3..4 entries`);
        if (op.some((o) => !isStr(o.id) || !isStr(o.text) || !FITS.includes(o.fit) || !isStr(o.note))) bad(`${tw}: each option needs id, text, fit (${FITS}) and note`);
        if (new Set(op.map((o) => o.id)).size !== op.length || new Set(op.map((o) => o.text)).size !== op.length) bad(`${tw}: option ids and texts must be unique`);
        if (!op.some((o) => o.fit === "strong")) bad(`${tw}: needs a strong option`);
      } else bad(`${tw}: speaker must be partner or you`);
    }
  }
  return out;
}
