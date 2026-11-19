// What a Family Language Story can honestly say about one student, from the rows the class intelligence model already
// builds (access-teacher/intel/model.js studentRows): practice days, skills, the kind of language practiced, and the
// child's own words. Counts and verbatim quotes only; no score, level, percent or proficiency label.
// A live class member (counts from the student's device) is enriched by a matching Passport when the teacher imported
// one. Only a Passport holds the child's words, so only a Passport can give a quote.
import { buildFeedback } from "../../access-practice-lab/src/intel/engine.js";
import { samplesFor } from "../../access-practice-lab/src/lang/teacher.js";
import { cleanText, LIMITS, pickStarters, weekStamp } from "../../access-practice-lab/src/family/story/model.js";
import { celebrateIdFor } from "../../access-practice-lab/src/family/story/wording.js";

const DAY = 864e5;
const LETTER = { Listening: "L", Reading: "R", Speaking: "S", Writing: "W" };
const USE = { Narrate: "narrate", Explain: "explain", Inform: "explain", Argue: "argue" };
const KEY_USES = Object.keys(USE);
const MAX_CANDIDATES = 3;
const lower = (s) => String(s || "").toLowerCase();
const at = (iso) => Date.parse(iso) || 0;
const entriesOf = (s) => (Array.isArray(s?.ledger?.entries) ? s.ledger.entries : []);

/** Dated activity of a Passport student: { domain, t, use } for ledger entries and Reading/Listening results. */
function activity(shared) {
  const out = entriesOf(shared).map((e) => ({ domain: e.domain, t: at(e.t), use: e.use }));
  for (const rec of Object.values(shared?.records || {}))
    if (rec?.results)
      for (const r of Object.values(rec.results)) out.push({ domain: rec.domain, t: at(r?.date), use: "" });
  return out.filter((a) => LETTER[a.domain] && a.t);
}

/** Verbatim-quote candidates from the student's latest speaking and writing, most specific strength first. */
export function quoteCandidates(shared) {
  let samples = [];
  try {
    samples = samplesFor(shared);
  } catch {
    return [];
  }
  const found = [];
  for (const sample of samples) {
    const text = String(sample.latest || "");
    if (!text) continue;
    const use = entriesOf(shared).find((e) => e.task === sample.task)?.use;
    let fb;
    try {
      fb = buildFeedback({
        text,
        keyUse: KEY_USES.includes(use) ? use : undefined,
        domain: sample.modality === "speaking" ? "Speaking" : "Writing",
        source: sample.modality === "speaking" ? "transcript" : "typed",
        band: shared.band,
      });
    } catch {
      continue;
    }
    const st = fb.strength;
    // The engine already grounds a quote in the text; check again and refuse anything that carries contact details.
    if (!st?.quote || st.id === "none" || !text.includes(st.quote)) continue;
    // Families read the child's whole sentence, word for word. The engine's quote can be just a cue word ("because").
    const sentence = text.split(/(?<=[.!?])\s+/).find((x) => x.includes(st.quote)) || "";
    const span = sentence && sentence.length <= LIMITS.quote ? sentence : st.quote.split(/\s+/).length >= 3 ? st.quote : "";
    const quote = cleanText(span, LIMITS.quote);
    if (!quote || !text.includes(quote) || found.some((f) => f.q === quote)) continue;
    found.push({ q: quote, m: sample.modality === "speaking" ? "s" : "w", c: celebrateIdFor(st.id), own: st.id === "own-words" });
  }
  return found
    .sort((a, b) => Number(a.own) - Number(b.own))
    .slice(0, MAX_CANDIDATES)
    .map(({ own, ...rest }) => rest);
}

/**
 * @param {{alias:string, member:object|null, shared:object|null}} row  one row of intel `studentRows`
 * @returns {{alias, d:string[], w:number, k:string, s:string[], candidates:object[], hasWords:boolean}}
 *   `d`, `w`, `k` and `s` are ready to start a story from; `candidates` are the quotes the teacher may choose.
 */
export function evidenceFor(row, now = Date.now()) {
  const { member, shared } = row;
  const acts = shared ? activity(shared) : [];
  const recent = acts.filter((a) => now - a.t <= 14 * DAY);
  const domains = new Set((recent.length ? recent : acts).map((a) => LETTER[a.domain]));
  if (member)
    for (const [name, letter] of Object.entries(LETTER))
      if (Number(member.summary?.domains?.[lower(name)]) > 0) domains.add(letter);
  const days = member?.summary?.weekDays != null
    ? Number(member.summary.weekDays) || 0
    : new Set(acts.filter((a) => now - a.t <= 7 * DAY).map((a) => new Date(a.t).toISOString().slice(0, 10))).size;
  const uses = {};
  for (const a of [...acts].sort((x, y) => x.t - y.t))
    if (USE[a.use] && (a.domain === "Speaking" || a.domain === "Writing")) uses[LETTER[a.domain]] = USE[a.use];
  const d = ["L", "R", "S", "W"].filter((x) => domains.has(x));
  // Talks start with the skill practiced most recently.
  const latest = {};
  for (const a of acts) latest[LETTER[a.domain]] = Math.max(latest[LETTER[a.domain]] || 0, a.t);
  const recentFirst = [...d].sort((x, y) => (latest[y] || 0) - (latest[x] || 0));
  const candidates = shared ? quoteCandidates(shared) : [];
  return {
    alias: row.alias,
    d,
    w: Math.min(7, Math.max(0, Math.trunc(days))),
    k: weekStamp(now),
    s: pickStarters({ domains: recentFirst, uses }),
    candidates,
    hasWords: Boolean(shared),
  };
}
