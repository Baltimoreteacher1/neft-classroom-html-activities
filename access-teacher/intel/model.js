// Class intelligence model (pure; runs in Node with no DOM). One function, `buildInsight`, turns what the Teacher Hub
// already holds into what a teacher acts on: per WIDA domain, what students did, a strength seen in their own work,
// ONE next teaching move, and the students to check in with.
//
// Sources (nothing new is collected or sent):
//   members  a live class's roster with the summaries students' devices already send (counts per domain, last activity)
//   roster   Passport share codes the teacher imported on this device (ledger, records, studio work)
// A live class's member is matched to a shared Passport by nickname (predictive/classlink.js memberFor).
//
// Rules held here (src/lang/ledger.js, LANGUAGE-INTELLIGENCE.md): counts and quotes only, no score, level, percent or
// proficiency label; a strength is a verbatim quote from the student's own words (the Language Intelligence Engine
// grounds it); accent and dialect are never judged; every claim names the evidence behind it.
import { codeBand } from "../../access-practice-lab/src/bands.js";
import { buildFeedback } from "../../access-practice-lab/src/intel/engine.js";
import { buildProfile, firstAttempts } from "../../access-practice-lab/src/lang/ledger.js";
import { conferencePlans, samplesFor } from "../../access-practice-lab/src/lang/teacher.js";
import { memberFor } from "../predictive/classlink.js";

export const DOMAINS = Object.freeze(["Listening", "Speaking", "Reading", "Writing"]);
export const IDLE_DAYS = 14;
const DAY = 864e5;
const MODALITY = { Speaking: "speaking", Writing: "writing" };
const KEY_USES = ["Narrate", "Inform", "Explain", "Argue"];

const lower = (s) => String(s || "").toLowerCase();
const entriesOf = (s) => (Array.isArray(s?.ledger?.entries) ? s.ledger.entries : []);
const inDomain = (e, d) => lower(e?.domain) === lower(d);
const at = (iso) => Date.parse(iso) || 0;
const recordsOf = (s, d) =>
  Object.values(s?.records || {}).filter((r) => r && inDomain(r, d) && r.results);

/** The students this view is about: live-class members (enriched by a matching Passport) or Passport students alone. */
export function studentRows({ members = null, roster = [], band = null } = {}) {
  const inBand = (s) => !band || codeBand(s.band) === band;
  if (members) {
    return members
      .map((member) => ({ alias: member.alias, member, shared: memberFor(roster, member.alias) }))
      .filter((r) => !r.shared || inBand(r.shared));
  }
  return roster.filter(inBand).map((shared) => ({ alias: shared.alias, member: null, shared }));
}

/** Facts per student: practice items per domain, this week's items, last activity. Counts only. */
function factsFor(row, now) {
  const items = {};
  const { member, shared } = row;
  for (const d of DOMAINS) {
    items[d] = member
      ? Number(member.summary?.domains?.[lower(d)]) || 0
      : entriesOf(shared).filter((e) => inDomain(e, d)).length +
        recordsOf(shared, d).reduce((n, r) => n + Object.keys(r.results).length, 0);
  }
  const times = [
    ...entriesOf(shared).map((e) => at(e.t)),
    ...recordsOf(shared, "Reading").flatMap((r) => Object.values(r.results).map((x) => at(x.date))),
    ...recordsOf(shared, "Listening").flatMap((r) =>
      Object.values(r.results).map((x) => at(x.date)),
    ),
    Number(member?.summary?.lastActivity) || 0,
  ];
  const week = member
    ? Number(member.summary?.weekEvidence) || 0
    : times.filter((t) => t && now - t <= 7 * DAY).length;
  return {
    alias: row.alias,
    items,
    total: DOMAINS.reduce((n, d) => n + items[d], 0),
    week,
    last: Math.max(0, ...times),
  };
}

/** Independent and supported first tries, from a student's ledger, in one domain. */
function tries(shared, d) {
  const fa = firstAttempts(entriesOf(shared), (e) => inDomain(e, d));
  const own = fa.filter((e) => e.stage === "independent").length;
  return { own, supported: fa.length - own };
}

/** Per-skill tally of Reading/Listening first tries from Passport records. Independent = no support opened. */
function skillTally(shared, d) {
  const out = new Map();
  for (const s of shared) {
    for (const rec of recordsOf(s, d)) {
      for (const r of Object.values(rec.results)) {
        const name = String(r.skill || "").trim();
        if (!name || r.supportUsed) continue;
        const t = out.get(name) || {
          skill: name,
          right: 0,
          wrong: 0,
          rightBy: new Set(),
          wrongBy: new Set(),
        };
        if (r.ok) (t.right++, t.rightBy.add(s.alias));
        else (t.wrong++, t.wrongBy.add(s.alias));
        out.set(name, t);
      }
    }
  }
  return [...out.values()];
}

/** Writing/Speaking strength: the engine's grounded strength for each student's latest response, most common first. */
function wordStrength(shared, d) {
  const found = new Map();
  for (const s of [...shared].sort((a, b) => a.alias.localeCompare(b.alias))) {
    let samples = [];
    try {
      samples = samplesFor(s).filter((x) => x.modality === MODALITY[d]);
    } catch {}
    const sample = samples.at(-1);
    if (!sample?.latest) continue;
    const use = entriesOf(s).find((e) => e.task === sample.task)?.use;
    let fb;
    try {
      fb = buildFeedback({
        text: String(sample.latest),
        keyUse: KEY_USES.includes(use) ? use : undefined,
        domain: d,
        source: sample.modality === "speaking" ? "transcript" : "typed",
        band: s.band,
      });
    } catch {
      continue;
    }
    const st = fb.strength;
    if (!st?.quote || st.id === "none") continue;
    const f = found.get(st.id) || { id: st.id, students: [], example: null };
    f.students.push(s.alias);
    f.example ||= { alias: s.alias, quote: st.quote };
    found.set(st.id, f);
  }
  const best = [...found.values()].sort(
    (a, b) =>
      b.students.length - a.students.length ||
      Number(a.id === "own-words") - Number(b.id === "own-words") ||
      a.id.localeCompare(b.id),
  )[0];
  return best
    ? { kind: "words", id: best.id, n: best.students.length, example: best.example }
    : null;
}

/** The domain's single next move, strongest evidence first; a plain nudge when there is no evidence yet. */
function moveFor(d, { shared, practised, items, least, students }) {
  const minSize = Math.max(1, Math.min(2, shared.length));
  if (MODALITY[d]) {
    const clones = shared.map((s) => ({
      ...s,
      ledger: { entries: entriesOf(s).filter((e) => inDomain(e, d)) },
    }));
    const plan = conferencePlans(clones, [], { minSize })[0];
    if (plan)
      return {
        kind: "need",
        need: plan.need,
        use: plan.use,
        members: plan.members.map((m) => m.alias),
      };
  } else {
    const miss = skillTally(shared, d)
      .filter((t) => t.wrong >= 3 && t.wrongBy.size >= minSize)
      .sort(
        (a, b) =>
          b.wrongBy.size - a.wrongBy.size || b.wrong - a.wrong || a.skill.localeCompare(b.skill),
      )[0];
    if (miss)
      return {
        kind: "skill",
        skill: miss.skill,
        members: [...miss.wrongBy].sort(),
        missed: miss.wrong,
      };
  }
  if (students && !items) return { kind: "start" };
  if (items && practised && items === least) return { kind: "balance" };
  return { kind: "keep" };
}

const MOVE_WEIGHT = { need: 100, skill: 100, start: 50, balance: 30, keep: 0 };

/** Why one student is worth a check-in; null when nothing stands out. Priority: quiet, idle, supports, gap. */
function reasonFor(f, row, now, totals) {
  if (!f.total && !f.last) return { id: "quiet" };
  if (f.last && now - f.last > IDLE_DAYS * DAY)
    return { id: "idle", days: Math.floor((now - f.last) / DAY) };
  if (row.shared) {
    const features = Object.entries(buildProfile(entriesOf(row.shared), { band: null }).features)
      .filter(([, v]) => v.dependence.status === "ok" && v.dependence.dependent)
      .map(([k]) => k);
    if (features.length) return { id: "alone", features: features.slice(0, 2) };
  }
  // A domain is a gap only when the class practices it: an unassigned domain is the teacher's plan, not the student's.
  const missing = DOMAINS.filter((d) => !f.items[d] && totals[d] > 0);
  if (f.total >= 6 && missing.length) return { id: "gap", domains: missing };
  return null;
}

/**
 * @param {{ members?: object[]|null, roster?: object[], band?: string|null, assignBand?: string, now?: number }} input
 * @returns {{ students:number, shared:number, weekActive:number, weekItems:number, domains:object[], top:object|null, checkIns:object[] }}
 */
export function buildInsight({
  members = null,
  roster = [],
  band = null,
  assignBand = "6-8",
  now = Date.now(),
} = {}) {
  const rows = studentRows({ members, roster, band });
  const facts = rows.map((r) => factsFor(r, now));
  const sharedRows = rows.filter((r) => r.shared);
  const shared = sharedRows.map((r) => r.shared);
  const totals = Object.fromEntries(
    DOMAINS.map((d) => [d, facts.reduce((n, f) => n + f.items[d], 0)]),
  );
  const least = Math.min(...DOMAINS.map((d) => totals[d]));
  const target = band || assignBand;

  const domains = DOMAINS.map((d) => {
    const t = shared.map((s) => tries(s, d));
    const own = t.reduce((n, x) => n + x.own, 0);
    const supported = t.reduce((n, x) => n + x.supported, 0);
    const practised = facts.filter((f) => f.items[d] > 0).length;
    let strength = null;
    if (MODALITY[d]) strength = wordStrength(shared, d);
    else {
      const top = skillTally(shared, d)
        .filter((x) => x.right >= 3 && x.rightBy.size >= Math.max(1, Math.min(2, shared.length)))
        .sort(
          (a, b) =>
            b.rightBy.size - a.rightBy.size || b.right - a.right || a.skill.localeCompare(b.skill),
        )[0];
      if (top)
        strength = { kind: "skill", skill: top.skill, right: top.right, n: top.rightBy.size };
    }
    const move = moveFor(d, { shared, practised, items: totals[d], least, students: rows.length });
    return {
      domain: d,
      items: totals[d],
      practised,
      own,
      supported,
      strength,
      move,
      assign: {
        band: target,
        domain: d,
        support: own + supported >= 3 && own * 2 < supported ? "A" : "B",
      },
    };
  });

  const top = rows.length
    ? [...domains].sort(
        (a, b) =>
          MOVE_WEIGHT[b.move.kind] +
          (b.move.members?.length || 0) -
          (MOVE_WEIGHT[a.move.kind] + (a.move.members?.length || 0)),
      )[0]
    : null;

  const checkIns = rows
    .map((row, i) => ({ alias: row.alias, reason: reasonFor(facts[i], row, now, totals) }))
    .filter((c) => c.reason)
    .sort((a, b) => order(a.reason.id) - order(b.reason.id) || a.alias.localeCompare(b.alias));

  return {
    students: rows.length,
    shared: sharedRows.length,
    weekActive: facts.filter((f) => f.week > 0).length,
    weekItems: facts.reduce((n, f) => n + f.week, 0),
    domains,
    top,
    checkIns,
  };
}

const order = (id) => ["quiet", "idle", "alone", "gap"].indexOf(id);
