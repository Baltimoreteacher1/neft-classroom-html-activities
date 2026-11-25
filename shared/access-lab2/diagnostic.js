// Adaptive-lite diagnostic, about 15 minutes, untimed. Starts at the middle practice band in each domain and steps
// up or down after a streak of two. 4 to 6 items per domain. Listening and Reading use keyed items; Speaking and
// Writing use self-check items only. The output seeds a skill profile and the Road plan, gives the teacher a
// one-page summary by alias, and gives the student friendly strengths and next steps (no band words, no numbers).
//
// The session is plain JSON and every function is pure: pass the state in, get a new state out.

import { visibleTo } from "./builder.js";
import { assertAlias, BAND_RANK, BANDS, DOMAINS, GRADE_BANDS, VIEWERS } from "./constants.js";
import { withDisclaimer } from "./disclaimer.js";
import { validateItem } from "./item.js";
import { buildProfile, domainPriority, KLU_FRIENDLY, studentView } from "./profile.js";
import { createRng } from "./rng.js";
import { scoreItem } from "./scoring.js";

export const MIN_PER_DOMAIN = 4;
export const MAX_PER_DOMAIN = 6;
const STREAK = 2;
const SUCCESS_AT = 0.67;
const STRUGGLE_AT = 0.34;
/** Planning guidance only. There is never a countdown. */
export const MINUTES_PER_ITEM = Object.freeze({
  Listening: 0.75,
  Reading: 0.75,
  Speaking: 1,
  Writing: 1.25,
});
const SELF_DOMAINS = ["Speaking", "Writing"];

const emptyDomain = () => ({
  band: "building",
  up: 0,
  down: 0,
  served: [],
  rows: [],
  steps: [],
  klu: {},
  stimuli: [],
  stopped: false,
});

export function startDiagnostic({ gradeBand, seed, viewer = "student" }) {
  if (!GRADE_BANDS.includes(gradeBand))
    throw new Error(`gradeBand must be one of ${GRADE_BANDS.join(", ")}`);
  if (seed === undefined || seed === null || seed === "") throw new Error("seed is required");
  if (!VIEWERS.includes(viewer)) throw new Error(`viewer must be one of ${VIEWERS.join(", ")}`);
  return {
    phase: "running",
    gradeBand,
    seed: String(seed),
    viewer,
    domainIdx: 0,
    current: null,
    domains: Object.fromEntries(DOMAINS.map((d) => [d, emptyDomain()])),
  };
}

const clone = (state) => JSON.parse(JSON.stringify(state));
const wantedScoring = (domain) => (SELF_DOMAINS.includes(domain) ? "selfcheck" : "key");

function eligible(items, state, domain) {
  return items.filter(
    (it) =>
      it.domain === domain &&
      it.gradeBand === state.gradeBand &&
      it.scoring?.type === wantedScoring(domain) &&
      visibleTo(it, state.viewer) &&
      validateItem(it).length === 0,
  );
}

/** Stop after the minimum once the band has held for the last three items, or at the maximum. */
function shouldStop(ds) {
  if (ds.stopped || ds.served.length >= MAX_PER_DOMAIN) return true;
  if (ds.served.length < MIN_PER_DOMAIN || ds.rows.length < ds.served.length) return false;
  return !ds.steps.slice(-3).some(Boolean);
}

function choose(pool, state, domain, ds) {
  const open = pool.filter(
    (it) => !ds.served.includes(it.id) && !ds.stimuli.includes(it.task.stimulus.id),
  );
  if (open.length === 0) return null;
  const order = new Map(
    createRng(`${state.seed}|${domain}|${ds.served.length}`)
      .shuffle(open)
      .map((it, i) => [it.id, i]),
  );
  const target = BAND_RANK[ds.band];
  const kluSeen = (it) => it.kluTags.reduce((sum, k) => sum + (ds.klu[k] ?? 0), 0);
  return open.sort(
    (a, b) =>
      Math.abs(BAND_RANK[a.band] - target) - Math.abs(BAND_RANK[b.band] - target) ||
      kluSeen(a) - kluSeen(b) ||
      order.get(a.id) - order.get(b.id),
  )[0];
}

/**
 * Next item to show, or null when the diagnostic is finished.
 * @returns {{ state: object, item: object|null }}
 */
export function nextDiagnosticItem(state, items) {
  if (state.current !== null)
    throw new Error("answer the current item before asking for the next one");
  const s = clone(state);
  while (s.domainIdx < DOMAINS.length) {
    const domain = DOMAINS[s.domainIdx];
    const ds = s.domains[domain];
    const item = shouldStop(ds) ? null : choose(eligible(items, s, domain), s, domain, ds);
    if (item) {
      ds.served.push(item.id);
      ds.stimuli.push(item.task.stimulus.id);
      for (const k of item.kluTags) ds.klu[k] = (ds.klu[k] ?? 0) + 1;
      s.current = item.id;
      return { state: s, item };
    }
    ds.stopped = true;
    s.domainIdx += 1;
  }
  s.phase = "done";
  return { state: s, item: null };
}

/** Records the answer to the current item and steps the band up or down after a streak. `answer` may be null (skipped). */
export function answerDiagnosticItem(state, items, answer) {
  if (state.current === null) throw new Error("no item is waiting for an answer");
  const s = clone(state);
  const item = items.find((it) => it.id === s.current);
  if (!item) throw new Error(`item "${s.current}" is not in the item list`);
  const ds = s.domains[item.domain];
  const row = scoreItem(item, answer);
  ds.rows.push(row);
  let stepped = false;
  if (row.answered && row.s >= SUCCESS_AT) {
    ds.up += 1;
    ds.down = 0;
  } else if (row.answered && row.s <= STRUGGLE_AT) {
    ds.down += 1;
    ds.up = 0;
  }
  const at = BAND_RANK[ds.band];
  if (ds.up >= STREAK && at < BANDS.length - 1)
    [ds.band, ds.up, stepped] = [BANDS[at + 1], 0, true];
  else if (ds.down >= STREAK && at > 0) [ds.band, ds.down, stepped] = [BANDS[at - 1], 0, true];
  ds.steps.push(stepped);
  s.current = null;
  return s;
}

/** Planning guidance for the teacher and family; never shown as a countdown. */
export function estimateMinutes(state) {
  return Math.round(
    DOMAINS.reduce((sum, d) => sum + state.domains[d].served.length * MINUTES_PER_ITEM[d], 0),
  );
}

/** One-page teacher summary by alias. Teacher side: band words are allowed here and only here. */
export function teacherSummary(profile) {
  const rows = domainPriority(profile).map((domain) => {
    const d = profile.domains[domain];
    const next = profile.practiceNext.find((n) => n.domain === domain);
    return {
      domain,
      band: d.band,
      evidence: d.evidence,
      strengths: d.strengths,
      practiceNext: next ? next.klu : null,
    };
  });
  const lines = [
    `${profile.alias} | grade band ${profile.gradeBand} | practice snapshot`,
    ...rows.map((r) => {
      const band = r.band ?? "not enough answers yet";
      const strong = r.strengths.length
        ? ` Doing well: ${r.strengths.map((k) => KLU_FRIENDLY[k]).join(", ")}.`
        : "";
      const next = r.practiceNext ? ` Practice next: ${KLU_FRIENDLY[r.practiceNext]}.` : "";
      return `${r.domain}: ${band} (${r.evidence} answered).${strong}${next}`;
    }),
    "Self-check items count for less than keyed items. A snapshot of one sitting, not a measure of English proficiency.",
  ];
  return withDisclaimer({
    kind: "teacher-summary",
    alias: profile.alias,
    gradeBand: profile.gradeBand,
    rows,
    lines,
  });
}

/**
 * Turns a finished session into the diagnostic output.
 * @returns {object} "diagnostic-result": profile (teacher), teacherSummary, studentView and the Road seed.
 */
export function finishDiagnostic({ state, alias }) {
  assertAlias(alias);
  if (state.phase !== "done")
    throw new Error("the diagnostic is not finished (keep asking for items until none is left)");
  const rows = DOMAINS.flatMap((d) => state.domains[d].rows);
  const profile = buildProfile({ alias, gradeBand: state.gradeBand, rows, source: "diagnostic" });
  return withDisclaimer({
    kind: "diagnostic-result",
    alias,
    gradeBand: state.gradeBand,
    profile,
    teacherSummary: teacherSummary(profile),
    studentView: studentView(profile),
    roadSeed: withDisclaimer({ kind: "road-seed", priority: domainPriority(profile), profile }),
    estimatedMinutes: estimateMinutes(state),
    perDomainCount: Object.fromEntries(DOMAINS.map((d) => [d, state.domains[d].served.length])),
  });
}
