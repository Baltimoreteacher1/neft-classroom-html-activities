// Practice test builder. Assembles domain-balanced, untimed practice sets from items.
//
// Rules: reviewed items only for students (draft, in-review and needs-changes items are teacher-visible only);
// no stimulus repeats inside a test; Key Language Use coverage is balanced inside each domain; difficulty ramps
// from early to strong inside each domain; the same seed always builds the same test.
// Results: coarse per-domain bands (teacher side) plus a friendly student view and "what to practice next".
// The disclaimer is attached to every output. No timers: the optional stamina mode only shows elapsed time to the
// student and is never reported to a teacher.
import {
  assertAlias,
  BAND_RANK,
  BANDS,
  DOMAIN_SHARES,
  DOMAINS,
  GRADE_BANDS,
  LENGTHS,
  VIEWERS,
} from "./constants.js";
import { hasDisclaimer, withDisclaimer } from "./disclaimer.js";
import { validateItem } from "./item.js";
import { buildProfile, studentView } from "./profile.js";
import { createRng, hashSeed } from "./rng.js";
import { scoreItem } from "./scoring.js";

/** Draft items are teacher-visible only; retired items are visible to no one. */
export function visibleTo(item, viewer) {
  if (viewer === "student") return item.reviewState === "reviewed";
  return item.reviewState !== "retired";
}

/** How many items each band gets for n picks: an even split, remainder to building then early. */
function bandQuota(n) {
  const base = Math.floor(n / BANDS.length);
  const rem = n % BANDS.length;
  return { early: base + (rem === 2 ? 1 : 0), building: base + (rem >= 1 ? 1 : 0), strong: base };
}

function pickDomain(pool, n, usedStimuli, rng) {
  const quota = bandQuota(n);
  const kluCount = {};
  const typeCount = {};
  const order = new Map(rng.shuffle(pool).map((it, i) => [it.id, i]));
  const picked = [];
  const cost = (it) =>
    it.kluTags.reduce((sum, t) => sum + (kluCount[t] ?? 0), 0) / it.kluTags.length;
  for (let k = 0; k < n; k++) {
    const open = pool.filter((it) => !usedStimuli.has(it.task.stimulus.id) && !picked.includes(it));
    if (open.length === 0) break;
    const wanted = open.filter((it) => quota[it.band] > 0);
    const candidates = wanted.length ? wanted : open;
    candidates.sort(
      (a, b) =>
        cost(a) - cost(b) ||
        (typeCount[a.task.type] ?? 0) - (typeCount[b.task.type] ?? 0) ||
        order.get(a.id) - order.get(b.id),
    );
    const choice = candidates[0];
    picked.push(choice);
    usedStimuli.add(choice.task.stimulus.id);
    quota[choice.band] -= 1;
    for (const t of choice.kluTags) kluCount[t] = (kluCount[t] ?? 0) + 1;
    typeCount[choice.task.type] = (typeCount[choice.task.type] ?? 0) + 1;
  }
  // Difficulty ramp: a stable sort keeps the seeded order inside each band.
  return picked.sort((a, b) => BAND_RANK[a.band] - BAND_RANK[b.band]);
}

function checkArgs({ items, gradeBand, length, seed, viewer, domains }) {
  if (!Array.isArray(items)) throw new Error("items must be an array");
  if (!GRADE_BANDS.includes(gradeBand))
    throw new Error(`gradeBand must be one of ${GRADE_BANDS.join(", ")}`);
  if (!(length in LENGTHS))
    throw new Error(`length must be one of ${Object.keys(LENGTHS).join(", ")}`);
  if (!VIEWERS.includes(viewer))
    throw new Error(`viewer must be one of ${VIEWERS.join(", ")} (drafts are teacher-only)`);
  if (seed === undefined || seed === null || seed === "")
    throw new Error("seed is required so the same seed rebuilds the same test");
  if (!domains.length || !domains.every((d) => DOMAINS.includes(d)))
    throw new Error("domains must be a subset of the four domains");
}

/**
 * @param {{ items: object[], gradeBand: string, length: "mini"|"standard"|"long", seed: string|number,
 *           viewer: "student"|"teacher", domains?: string[], stamina?: boolean }} opts
 * @returns {object} a "practice-test" output: ids only (no keys), plus coverage, shortfalls and exclusions.
 */
export function buildPracticeTest({
  items,
  gradeBand,
  length,
  seed,
  viewer,
  domains = DOMAINS,
  stamina = false,
}) {
  checkArgs({ items, gradeBand, length, seed, viewer, domains });
  const excluded = [];
  const visible = [];
  for (const item of items) {
    if (item.gradeBand !== gradeBand || !visibleTo(item, viewer)) continue;
    const problems = validateItem(item);
    if (problems.length) excluded.push({ id: item.id, reason: problems[0] });
    else visible.push(item);
  }

  const used = new Set();
  const sections = [];
  const shortfalls = [];
  const coverage = {};
  for (const domain of DOMAINS.filter((d) => domains.includes(d))) {
    const want = DOMAIN_SHARES[length][domain];
    const pool = visible.filter((it) => it.domain === domain);
    const picked = pickDomain(
      pool,
      want,
      used,
      createRng(`${seed}|${gradeBand}|${length}|${domain}`),
    );
    if (picked.length < want) shortfalls.push({ domain, wanted: want, got: picked.length });
    coverage[domain] = {};
    for (const it of picked)
      for (const t of it.kluTags) coverage[domain][t] = (coverage[domain][t] ?? 0) + 1;
    sections.push({ domain, itemIds: picked.map((it) => it.id) });
  }

  return withDisclaimer({
    kind: "practice-test",
    id: `pt-${gradeBand}-${length}-${hashSeed(seed).toString(16)}`,
    gradeBand,
    length,
    seed: String(seed),
    viewer,
    complete: shortfalls.length === 0,
    untimed: true,
    stamina: stamina
      ? { mode: "stamina", showElapsedToStudent: true, shareElapsedWithTeacher: false }
      : null,
    directions: "Take your time. There is no timer. You can stop and come back.",
    sections,
    itemIds: sections.flatMap((s) => s.itemIds),
    coverage,
    shortfalls,
    excluded,
  });
}

/**
 * Scores a finished practice test.
 * @param {{ test: object, items: object[], answers: Record<string, object|null>, alias: string }} args
 * @returns a "practice-results" output: teacher profile (coarse bands, what to practice next) and a student view.
 */
export function scorePracticeTest({ test, items, answers, alias }) {
  assertAlias(alias);
  const byId = new Map(items.map((it) => [it.id, it]));
  const rows = test.itemIds.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`test item "${id}" is not in the item list`);
    return scoreItem(item, answers[id] ?? null);
  });
  const profile = buildProfile({
    alias,
    gradeBand: test.gradeBand,
    rows,
    source: `practice-test:${test.length}`,
  });
  return withDisclaimer({
    kind: "practice-results",
    testId: test.id,
    alias,
    gradeBand: test.gradeBand,
    profile,
    studentView: studentView(profile),
    answeredCount: rows.filter((r) => r.answered).length,
    itemCount: rows.length,
  });
}

/**
 * Independent check of a built test against the rules it must obey. Tests run it over every generated test and over
 * hand-made bad tests that it must flag.
 * @returns {string[]} problems; [] means the test obeys every rule.
 */
export function verifyPracticeTest(test, items) {
  const errors = [];
  const byId = new Map(items.map((it) => [it.id, it]));
  if (!hasDisclaimer(test)) errors.push("test is missing the mandatory disclaimer");
  if (test.untimed !== true) errors.push("tests are untimed by default");
  const stimuli = new Set();
  for (const section of test.sections) {
    const ramp = [];
    for (const id of section.itemIds) {
      const it = byId.get(id);
      if (!it) {
        errors.push(`${id}: not in the item list`);
        continue;
      }
      if (it.domain !== section.domain)
        errors.push(`${id}: ${it.domain} item in a ${section.domain} section`);
      if (it.gradeBand !== test.gradeBand) errors.push(`${id}: wrong grade band`);
      if (test.viewer === "student" && it.reviewState !== "reviewed")
        errors.push(`${id}: ${it.reviewState} item in a student test`);
      if (stimuli.has(it.task.stimulus.id))
        errors.push(`${id}: repeated stimulus ${it.task.stimulus.id}`);
      stimuli.add(it.task.stimulus.id);
      ramp.push(BAND_RANK[it.band]);
    }
    if (ramp.some((r, i) => i > 0 && r < ramp[i - 1]))
      errors.push(`${section.domain}: difficulty does not ramp up`);
    if (test.complete && section.itemIds.length !== DOMAIN_SHARES[test.length][section.domain])
      errors.push(`${section.domain}: wrong item count`);
  }
  return errors;
}
