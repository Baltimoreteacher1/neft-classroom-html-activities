// Validator for argument-builder activities (rules in engines/argument-builder.schema.md). Pure.
// validateArgument(activity) -> string[] (empty means valid)
import { TIER_IDS } from "../../data/taxonomy.js";
import { FORMAT_LABELS, classifyCard, minEvidence, wordCount } from "./argument-logic.js";

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const EMOJI = /\p{Extended_Pictographic}/u;
const BAD =
  /\b(lorem ipsum|TODO|TBD|coming soon|placeholder|countdown|timer|stopwatch|beat the clock)\b/i;
const ID = /^[a-z0-9-]+$/;
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const sentences = (s) =>
  String(s)
    .split(/(?<=[.!?])\s+/)
    .map(norm)
    .filter((x) => x.length > 12);
const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
};
/** True when `hint` repeats a run of 6+ consecutive words of `text`. */
function sharesRun(hint, text, n = 6) {
  const a = norm(hint).split(" ");
  const t = ` ${norm(text)} `;
  for (let i = 0; i + n <= a.length; i++)
    if (t.includes(` ${a.slice(i, i + n).join(" ")} `)) return true;
  return false;
}

export function validateArgument(a) {
  const out = [];
  const bad = (m) => out.push(m);
  if (a?.engine !== "argument-builder") return ["engine must be argument-builder"];
  if (!isStr(a.id) || !ID.test(a.id)) bad("id must be kebab-case");
  for (const f of ["title", "intro", "question"]) if (!isStr(a[f])) bad(`${f} required`);
  if (!GRADES.includes(String(a.grade))) bad("grade must be K-8");
  if (!Array.isArray(a.standards) || !a.standards.length) bad("standards required");
  if (typeof a.minutes !== "number" || a.minutes < 10 || a.minutes > 40)
    bad("minutes must be 10..40");
  if (!FORMAT_LABELS[a.format]) bad("format must be cer, ela, source or decision");
  const qw = wordCount(a.question);
  if (qw < 6 || qw > 40) bad("question must be 6..40 words");
  if (a.minEvidence != null && (a.minEvidence < 1 || a.minEvidence > 3))
    bad("minEvidence must be 1..3");
  const min = minEvidence(a);

  const sources = a.sources || [];
  if (sources.length < 2 || sources.length > 4) bad("sources needs 2..4 entries");
  const sid = new Set();
  for (const s of sources) {
    if (!isStr(s.id) || sid.has(s.id)) bad(`source ${s.id}: id missing or duplicate`);
    sid.add(s.id);
    if (!isStr(s.title)) bad(`source ${s.id}: title required`);
    if (!/Written for this activity/i.test(s.byline || ""))
      bad(`source ${s.id}: byline must say "Written for this activity"`);
    if (!isStr(s.text) && !s.visual) bad(`source ${s.id}: needs text or a visual`);
    if (s.text && wordCount(s.text) > 160) bad(`source ${s.id}: text is longer than 160 words`);
    if (s.visual && (!s.visual.kind || !isStr(s.visual.alt)))
      bad(`source ${s.id}: visual needs kind and alt`);
  }

  const claims = a.claims || [];
  if (claims.length < 3 || claims.length > 4) bad("claims needs 3..4 entries");
  const cid = new Set();
  for (const c of claims) {
    if (!isStr(c.id) || cid.has(c.id)) bad(`claim ${c.id}: id missing or duplicate`);
    cid.add(c.id);
    if (!isStr(c.text) || typeof c.strong !== "boolean" || !isStr(c.why))
      bad(`claim ${c.id}: text, strong and why required`);
  }
  if (claims.filter((c) => c.strong).length < 2) bad("at least 2 strong claims");
  if (claims.every((c) => c.strong)) bad("at least 1 weak claim");

  const ev = a.evidence || [];
  if (ev.length < 6 || ev.length > 10) bad("evidence needs 6..10 cards");
  const eid = new Set();
  for (const e of ev) {
    const w = `card ${e.id}`;
    if (!isStr(e.id) || eid.has(e.id)) bad(`${w}: id missing or duplicate`);
    eid.add(e.id);
    if (!sid.has(e.sourceId)) bad(`${w}: sourceId does not resolve`);
    if (e.supports != null && !cid.has(e.supports)) bad(`${w}: supports does not resolve`);
    if (!["strong", "weak", "irrelevant"].includes(e.quality))
      bad(`${w}: quality must be strong, weak or irrelevant`);
    if (e.quality === "irrelevant" && e.supports != null)
      bad(`${w}: irrelevant cards need supports:null`);
    if (!isStr(e.text) || !isStr(e.feedback)) bad(`${w}: text and feedback required`);
  }
  if (!ev.some((e) => e.quality === "irrelevant")) bad("at least 1 irrelevant card");
  const counters = a.counterclaims || {};
  const needCounter = (a.counter?.requiredTiers || ["exp", "br"]).length > 0;
  for (const c of claims.filter((x) => x.strong)) {
    const cards = ev.filter((e) => classifyCard(e, c.id) === "strong");
    if (cards.length < min) bad(`claim ${c.id}: needs at least ${min} strong cards`);
    if (new Set(cards.map((e) => e.sourceId)).size < Math.min(2, sources.length))
      bad(`claim ${c.id}: strong cards must come from at least 2 sources`);
    if (!ev.some((e) => classifyCard(e, c.id) === "weak"))
      bad(`claim ${c.id}: needs at least 1 weak card`);
    if (needCounter && !isStr(counters[c.id])) bad(`claim ${c.id}: counterclaims entry required`);
  }
  const frames = a.reasoningFrames || {};
  for (const t of TIER_IDS) {
    if (!Array.isArray(frames[t])) bad(`reasoningFrames.${t} must be an array`);
    else if (frames[t].some((f) => !f.includes("___")))
      bad(`reasoningFrames.${t}: every frame needs a ___ blank`);
    else if (t !== "br" && !frames[t].length) bad(`reasoningFrames.${t} needs at least 1 frame`);
  }
  const anyCounterTier = [
    ...(a.counter?.requiredTiers || ["exp", "br"]),
    ...(a.counter?.optionalTiers || ["dev"]),
  ];
  if (anyCounterTier.length)
    for (const k of ["acknowledge", "rebut"])
      for (const t of anyCounterTier)
        if (!(a.counter?.frames?.[k]?.[t] || []).length && t !== "br")
          bad(`counter.frames.${k}.${t} needs at least 1 frame`);

  for (const k of ["claim", "evidence", "reasoning"]) {
    const hs = a.hints?.[k];
    if (!Array.isArray(hs) || hs.length !== 3 || hs.some((x) => !isStr(x))) {
      bad(`hints.${k} needs exactly 3 hints`);
      continue;
    }
    for (const hn of hs) {
      for (const c of claims)
        if (norm(hn).includes(norm(c.text)) || sharesRun(hn, c.text))
          bad(`hints.${k}: a hint repeats claim ${c.id}`);
      for (const e of ev)
        if (norm(hn).includes(norm(e.text)) || sharesRun(hn, e.text))
          bad(`hints.${k}: a hint repeats card ${e.id}`);
    }
  }
  const m = a.model;
  if (
    !m ||
    !isStr(m.question) ||
    !isStr(m.claim) ||
    !isStr(m.strong?.text) ||
    !isStr(m.strong?.why) ||
    !isStr(m.weak?.text) ||
    !isStr(m.weak?.why) ||
    !isStr(m.tip)
  )
    bad("model needs question, claim, strong{text,why}, weak{text,why} and tip");
  else {
    const mine = new Set(strings(m).flatMap(sentences));
    const theirs = new Set(
      [...claims.map((c) => c.text), ...ev.map((e) => e.text)].flatMap(sentences),
    );
    for (const s of mine)
      if (theirs.has(s)) bad("model shares a sentence with the claims or cards");
    if (norm(m.question) === norm(a.question)) bad("model must be on a different question");
  }
  const checks = a.revision?.checks || [];
  if (checks.length < 3 || checks.length > 6) bad("revision.checks needs 3..6 entries");
  if (
    new Set(checks.map((c) => c.id)).size !== checks.length ||
    checks.some((c) => !isStr(c.id) || !isStr(c.label))
  )
    bad("revision check ids must be unique with labels");
  for (const t of TIER_IDS)
    if (!a.supports || typeof a.supports[t] !== "object") bad(`supports.${t} missing`);
  if (
    !a.reflection?.prompt ||
    TIER_IDS.some((t) => !Array.isArray(a.reflection.frames?.[t]) || !a.reflection.frames[t].length)
  )
    bad("reflection needs a prompt and at least one frame per tier");
  for (const s of strings(a)) {
    if (EMOJI.test(s)) bad(`emoji in "${s.slice(0, 30)}"`);
    if (BAD.test(s)) bad(`placeholder or timer wording in "${s.slice(0, 40)}"`);
  }
  return out;
}
