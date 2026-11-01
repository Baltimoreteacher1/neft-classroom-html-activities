// Per-fact mastery model for the Fluency Lab "Moby" layer. One record per individual fact (add:3:8, sub:11:3,
// mul:6:7, div:42:6) with separate, labelled evidence: accuracy, retention, strategy use and (timed practice only)
// efficiency. Nothing here is blended into one number, and speed is never required for any status.
// Pure: no DOM, no clock (callers pass `now`), no randomness. Storage helpers at the bottom use school-tools.js.
import { REVIEW_LADDER, ladderIndex, nextInterval } from "../mastery-model.js";
import { profileKey } from "../family/fm2/profile-key.js";
import { profiles, readLocal, writeLocal } from "../school-tools.js";
import { familyOf, isTrackedKey, keyFromItem, makeKey } from "./fact-keys.js";
import { STRATEGY_IDS, factRank, strategyFor } from "./fact-strategies.js";

export * from "./fact-keys.js";
export * from "./fact-strategies.js";

export const FACTS_KEY = "ewl-fluency-moby-facts-v1";
export const DAY_MS = 86400000;


// Every threshold that decides a status, in one frozen place so a teacher or family can be shown the rule.
export const FACT_THRESHOLDS = Object.freeze({
  secureWindow: 6, // the most recent independent answers that are looked at
  secureMinIndependent: 4, // at least this many independent first-try answers in that window
  secureMinAccuracy: 0.8, // and at least this share of them right (4 of 4, 4 of 5, 5 of 6 ...)
  secureMinDays: 2, // right answers must come from at least this many separate days
  retainedMinGapDays: 7, // secure, then a first-try right answer after at least this many days away
  difficultWindow: 5, // difficult: this many latest attempts ...
  difficultMinMisses: 2, // ... with at least this many misses, or a miss after the fact was secure
  ringSize: 12, // attempts kept per fact
  legacySecureMinRight: 5, // old trail chart: this many first-try right answers, at least 80% right, last one right
  legacySecureMinAccuracy: 0.8,
  maxFacts: 1200,
  ladder: REVIEW_LADDER,
});
// Speed bands exist only for facts the learner CHOSE to practice timed. They describe timed practice; they are
// never a grade, never needed for a status, and never read for a fact with fewer than `minTimed` timed answers.
export const FACT_SPEED_BANDS = Object.freeze({
  quickMs: 3000,
  steadyMs: 6000,
  minTimed: 3,
  window: 5,
  maxMs: 600000,
});
export const FACT_STATUSES = Object.freeze(["not-yet", "developing", "secure", "retained"]);
export const STATUS_LABELS = Object.freeze({ "not-yet": "Not yet", developing: "Developing", secure: "Secure", retained: "Retained" });
export const SPEED_LABELS = Object.freeze({ quick: "Quick", steady: "Steady", building: "Building" });
export const PHASE_LABELS = Object.freeze({ "warm-up": "Warm-up", review: "Review", learn: "Learn it", stretch: "Stretch" });
// The rules behind every status, as templates (English text is the key in ES_MOBY_FACTS) filled from FACT_THRESHOLDS,
// so the screen can show exactly what each status means and the words can never drift from the numbers.
export const STATUS_RULES = Object.freeze({
  "not-yet": "No answers yet.",
  developing: "Some answers so far, but not enough to call it secure.",
  secure: "Right on the first try, on your own, at least {n} times in your last {window} tries (at least {pct}% right), on at least {days} different days.",
  retained: "Secure, then right on the first try after {gap} or more days away.",
  difficult: "Tricky: {misses} or more misses in the last {window} tries, or a miss after the fact was secure.",
  speed: "Speed is only noted for facts you chose to practice timed, and it is never needed for any status.",
});
export function statusRules() {
  const t = FACT_THRESHOLDS;
  const vars = { n: t.secureMinIndependent, window: t.secureWindow, pct: Math.round(t.secureMinAccuracy * 100), days: t.secureMinDays, gap: t.retainedMinGapDays, misses: t.difficultMinMisses };
  const dw = { ...vars, window: t.difficultWindow };
  return Object.entries(STATUS_RULES).map(([id, template]) => {
    const v = id === "difficult" ? dw : vars;
    return { id, label: STATUS_LABELS[id] || null, template, vars: v, text: template.replace(/\{(\w+)\}/g, (_, name) => String(v[name])) };
  });
}

// ---------- grade domains and progress maps ----------

const range = (from, to, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const sortKeys = (keys) => [...keys].sort((p, q) => factRank(p) - factRank(q) || (p < q ? -1 : 1));

function addBand(id, label, { max, sum, primary = true, maintain = false, step = 1, from = 0 }) {
  const rows = range(from, max, step);
  const valid = (a, b) => a + b <= sum;
  const cell = (r, c) => (valid(r, c) ? makeKey("add", Math.min(r, c), Math.max(r, c)) : null);
  return finish({ id, op: "add", label, primary, maintain, rows, cols: rows, cell });
}
function subBand(
  id,
  label,
  { top, answerMax = top, subMax = top, primary = true, maintain = false, step = 1, from = 0 },
) {
  const rows = range(from, top, step);
  const cols = range(from, subMax, step);
  const cell = (r, c) =>
    c <= r - (step > 1 ? step : 0) && r - c <= answerMax && (step === 1 || r > c)
      ? makeKey("sub", r, c)
      : null;
  return finish({ id, op: "sub", label, primary, maintain, rows, cols, cell });
}
function mulBand(id, label, max, maintain = false) {
  const rows = range(0, max);
  return finish({
    id,
    op: "mul",
    label,
    primary: true,
    maintain,
    rows,
    cols: rows,
    cell: (r, c) => makeKey("mul", Math.min(r, c), Math.max(r, c)),
  });
}
function divBand(id, label, max, maintain = false) {
  return finish({
    id,
    op: "div",
    label,
    primary: true,
    maintain,
    rows: range(1, max),
    cols: range(0, max),
    cell: (d, q) => makeKey("div", d * q, d),
  });
}
function finish(band) {
  const keys = new Set();
  for (const r of band.rows)
    for (const c of band.cols) {
      const key = band.cell(r, c);
      if (key) keys.add(key);
    }
  return Object.freeze({ ...band, keys: sortKeys(keys) });
}

const ADD_20 = (o = {}) => addBand("add-20", "Add within 20", { max: 10, sum: 20, ...o });
const SUB_20 = (o = {}) =>
  subBand("sub-20", "Subtract within 20", { top: 20, answerMax: 10, subMax: 10, ...o });
const DOMAIN_BANDS = {
  0: () => [
    addBand("add-5", "Add within 5", { max: 5, sum: 5 }),
    subBand("sub-5", "Subtract within 5", { top: 5 }),
  ],
  1: () => [
    addBand("add-10", "Add within 10", { max: 10, sum: 10, primary: false }),
    ADD_20(),
    subBand("sub-10", "Subtract within 10", { top: 10, primary: false }),
    SUB_20(),
  ],
  2: () => [
    ADD_20(),
    addBand("add-tens", "Add tens within 100", {
      max: 90,
      sum: 100,
      step: 10,
      from: 10,
      primary: false,
    }),
    SUB_20(),
    subBand("sub-tens", "Subtract tens within 100", {
      top: 100,
      step: 10,
      from: 10,
      primary: false,
    }),
  ],
  3: () => [
    mulBand("mul-10", "Multiply to 10 × 10", 10),
    divBand("div-10", "Divide within 100", 10),
    ADD_20({ maintain: true }),
    SUB_20({ maintain: true }),
  ],
  4: () => [
    mulBand("mul-12", "Multiply to 12 × 12", 12),
    divBand("div-12", "Divide within 144", 12),
    ADD_20({ maintain: true }),
    SUB_20({ maintain: true }),
  ],
  5: () => [
    mulBand("mul-12", "Multiply to 12 × 12", 12, true),
    divBand("div-12", "Divide within 144", 12, true),
    ADD_20({ maintain: true }),
    SUB_20({ maintain: true }),
  ],
};
const domainCache = new Map();

// The facts a grade owns. Grades 4-5 keep every earlier fact in play ("maintain"); Grades 6-8 use Grade 5's set.
export function gradeFactDomain(grade) {
  const g = Math.min(8, Math.max(0, Math.floor(Number(grade)) || 0));
  const id = Math.min(g, 5);
  if (!domainCache.has(id)) {
    const bands = DOMAIN_BANDS[id]();
    const keys = sortKeys(new Set(bands.flatMap((band) => band.keys)));
    const newKeys = sortKeys(
      new Set(bands.filter((band) => !band.maintain).flatMap((band) => band.keys)),
    );
    const set = new Set(keys);
    domainCache.set(
      id,
      Object.freeze({
        grade: id,
        bands: Object.freeze(bands),
        keys,
        newKeys,
        set,
        newSet: new Set(newKeys),
        has: (key) => set.has(key),
      }),
    );
  }
  return domainCache.get(id);
}

export const factOps = (grade) => [...new Set(gradeFactDomain(grade).bands.map((band) => band.op))];

// ---------- records and evidence ----------

export const emptyFacts = () => ({ version: 1, facts: {} });
const newRecord = () => ({
  attempts: 0,
  firstTryRight: 0,
  supportedRight: 0,
  misses: 0,
  recent: [],
  lastSeenDay: null,
  interval: 0,
  dueAt: null,
  retainedAt: null,
  slipAt: null,
});
const pad = (n) => String(n).padStart(2, "0");
export const dayOf = (time) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const dayNumber = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
};
export const daysBetween = (fromDay, toDay) =>
  fromDay && toDay ? dayNumber(toDay) - dayNumber(fromDay) : null;
const isIndependent = (entry) => entry.firstTry && !entry.supported;
const solidStatus = (status) => status === "secure" || status === "retained";

// The independent (first try, no help) answers that count toward "secure".
function secureEvidence(record) {
  const window = record.recent.filter(isIndependent).slice(-FACT_THRESHOLDS.secureWindow);
  const right = window.filter((entry) => entry.correct);
  return {
    n: window.length,
    right: right.length,
    days: new Set(right.map((entry) => entry.day)).size,
    lastCorrect: window.length > 0 && window[window.length - 1].correct,
  };
}
function realSecure(record) {
  const e = secureEvidence(record);
  return (
    e.n >= FACT_THRESHOLDS.secureMinIndependent &&
    e.right / e.n >= FACT_THRESHOLDS.secureMinAccuracy &&
    e.days >= FACT_THRESHOLDS.secureMinDays &&
    e.lastCorrect
  );
}
// What the old coarse trail chart said, translated with the new thresholds. It never invents a date or a time.
const legacyCredit = (legacy) => {
  if (!legacy) return null;
  const total = legacy.right + legacy.missed;
  if (!total) return null;
  return legacy.right >= FACT_THRESHOLDS.legacySecureMinRight &&
    legacy.right / total >= FACT_THRESHOLDS.legacySecureMinAccuracy &&
    legacy.last
    ? "secure"
    : "developing";
};

// not-yet (no evidence) / developing / secure / retained. `now` is accepted for symmetry and unused on purpose:
// a status never decays silently. Whether a fact is due for another look is a separate question (dueFacts).
export function factStatus(record, _now) {
  if (!record) return "not-yet";
  const hasReal = record.attempts > 0;
  let solid = hasReal && realSecure(record);
  if (!solid && record.legacy && legacyCredit(record.legacy) === "secure")
    solid = !record.recent.slice(-3).some((entry) => !entry.correct);
  if (solid) return record.retainedAt != null ? "retained" : "secure";
  return hasReal || legacyCredit(record.legacy) ? "developing" : "not-yet";
}

export function isDifficult(record, now) {
  if (!record) return false;
  const status = factStatus(record, now);
  if (solidStatus(status)) return false;
  const latest = record.recent.slice(-FACT_THRESHOLDS.difficultWindow);
  if (latest.filter((entry) => !entry.correct).length >= FACT_THRESHOLDS.difficultMinMisses)
    return true;
  if (record.slipAt != null) return true;
  return (
    !record.recent.length &&
    Boolean(record.legacy) &&
    record.legacy.last === false &&
    record.legacy.missed >= FACT_THRESHOLDS.difficultMinMisses
  );
}

const median = (values) => {
  const s = [...values].sort((p, q) => p - q);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Four separate readings of one fact. Never added together.
export function factAccuracy(record) {
  const e = record ? secureEvidence(record) : { n: 0, right: 0, days: 0 };
  return {
    independent: e.n,
    right: e.right,
    days: e.days,
    rate: e.n ? Math.round((e.right / e.n) * 100) / 100 : null,
  };
}
export function factEfficiency(record) {
  const timed = (record?.recent || [])
    .filter(
      (entry) =>
        entry.mode === "timed" &&
        Number.isFinite(entry.ms) &&
        entry.correct &&
        isIndependent(entry),
    )
    .slice(-FACT_SPEED_BANDS.window);
  if (timed.length < FACT_SPEED_BANDS.minTimed)
    return { band: null, medianMs: null, timedAnswers: timed.length };
  const medianMs = median(timed.map((entry) => entry.ms));
  return {
    band:
      medianMs <= FACT_SPEED_BANDS.quickMs
        ? "quick"
        : medianMs <= FACT_SPEED_BANDS.steadyMs
          ? "steady"
          : "building",
    medianMs,
    timedAnswers: timed.length,
  };
}
export function factRetention(record) {
  return {
    retained: Boolean(record) && record.retainedAt != null && solidStatus(factStatus(record)),
    retainedAt: record?.retainedAt ?? null,
    lastSeenDay: record?.lastSeenDay ?? null,
    interval: record?.interval || 0,
    dueAt: record?.dueAt ?? null,
  };
}
export function factStrategyUse(record) {
  const used = {};
  for (const entry of record?.recent || [])
    if (entry.strategy) used[entry.strategy] = (used[entry.strategy] || 0) + 1;
  return used;
}
export function factReport(store, key, now) {
  const record = store?.facts?.[key] || null;
  return {
    key,
    status: factStatus(record, now),
    difficult: isDifficult(record, now),
    accuracy: factAccuracy(record),
    efficiency: factEfficiency(record),
    retention: factRetention(record),
    strategy: { recommended: strategyFor(key), used: factStrategyUse(record) },
    attempts: record?.attempts || 0,
    legacy: Boolean(record?.legacy),
  };
}

function applyAttempt(record, input, now) {
  const rec = { ...record, recent: [...record.recent] };
  const day = dayOf(now);
  const correct = Boolean(input.correct);
  const firstTry = input.firstTry !== false;
  const supported = Boolean(input.supported);
  const independent = firstTry && !supported;
  const before = factStatus(record, now);
  const gap = daysBetween(record.lastSeenDay, day);
  const timed = input.mode === "timed";
  const ms =
    timed && Number.isFinite(Number(input.ms)) && Number(input.ms) >= 0
      ? Math.min(FACT_SPEED_BANDS.maxMs, Math.round(Number(input.ms)))
      : null;
  rec.recent.push({
    at: now,
    day,
    correct,
    firstTry,
    supported,
    ...(ms !== null ? { ms } : {}),
    strategy: STRATEGY_IDS.includes(input.strategy) ? input.strategy : null,
    mode: timed ? "timed" : "untimed",
  });
  rec.recent = rec.recent.slice(-FACT_THRESHOLDS.ringSize);
  rec.attempts += 1;
  if (!correct) rec.misses += 1;
  else if (independent) rec.firstTryRight += 1;
  else rec.supportedRight += 1;
  // Review ladder (1/3/7/14/30), shared with the skill model: a first-try right answer on a new day climbs a rung.
  if (independent && correct) {
    if (record.lastSeenDay !== day)
      rec.interval = record.lastSeenDay
        ? nextInterval(record.interval || 1, { correct: true, independent: true, advance: true })
        : REVIEW_LADDER[0];
  } else rec.interval = nextInterval(record.interval || 1, { correct, independent });
  rec.interval = REVIEW_LADDER[ladderIndex(rec.interval || 1)];
  rec.dueAt = now + rec.interval * DAY_MS;
  rec.lastSeenDay = day;
  if (independent && !correct) {
    rec.retainedAt = null;
    if (solidStatus(before)) rec.slipAt = now;
  } else if (
    independent &&
    correct &&
    solidStatus(before) &&
    gap !== null &&
    gap >= FACT_THRESHOLDS.retainedMinGapDays
  )
    rec.retainedAt = now;
  if (solidStatus(factStatus(rec, now))) rec.slipAt = null;
  return rec;
}

// Returns a NEW store; never mutates the one passed in. Untracked keys leave the store as it was.
export function recordFactAttempt(store, input, now = Date.now()) {
  const base = store?.facts ? store : emptyFacts();
  const key = input?.key;
  if (!isTrackedKey(key)) return base;
  return {
    ...base,
    facts: { ...base.facts, [key]: applyAttempt(base.facts[key] || newRecord(), input, now) },
  };
}

export function dueFacts(store, now, { statuses } = {}) {
  const today = dayOf(now);
  return Object.entries(store?.facts || {})
    .map(([key, record]) => ({ key, record, status: factStatus(record, now) }))
    .filter((entry) => entry.status !== "not-yet" && (!statuses || statuses.includes(entry.status)))
    .filter((entry) =>
      entry.record.dueAt == null ? !entry.record.attempts : entry.record.dueAt <= now,
    )
    .map((entry) => ({
      ...entry,
      overdueDays:
        entry.record.dueAt == null
          ? 0
          : Math.max(0, Math.floor((now - entry.record.dueAt) / DAY_MS)),
      sinceDays: daysBetween(entry.record.lastSeenDay, today),
    }))
    .sort((p, q) => q.overdueDays - p.overdueDays || (p.key < q.key ? -1 : 1));
}

export function difficultFacts(store, grade, now) {
  const domain = gradeFactDomain(grade);
  return Object.entries(store?.facts || {})
    .filter(([key, record]) => domain.set.has(key) && isDifficult(record, now))
    .map(([key, record]) => ({
      key,
      record,
      status: factStatus(record, now),
      recentMisses: record.recent
        .slice(-FACT_THRESHOLDS.difficultWindow)
        .filter((entry) => !entry.correct).length,
      strategy: strategyFor(key),
    }))
    .sort(
      (p, q) =>
        q.recentMisses - p.recentMisses ||
        (p.record.lastSeenDay || "").localeCompare(q.record.lastSeenDay || "") ||
        (p.key < q.key ? -1 : 1),
    );
}

export function progressMap(store, grade, op, now, { band: bandId } = {}) {
  const domain = gradeFactDomain(grade);
  const options = domain.bands.filter((band) => band.op === op);
  const band =
    options.find((entry) => entry.id === bandId) ||
    options.find((entry) => entry.primary) ||
    options[0] ||
    null;
  const counts = { secure: 0, retained: 0, developing: 0, notYet: 0, total: 0 };
  if (!band)
    return {
      grade: domain.grade,
      op,
      band: null,
      bands: [],
      rows: [],
      cols: [],
      cells: [],
      counts,
      mastered: 0,
    };
  const info = new Map();
  for (const key of band.keys) {
    const record = store?.facts?.[key];
    const status = factStatus(record, now);
    info.set(key, { key, status, difficult: isDifficult(record, now) });
    counts.total += 1;
    counts[status === "not-yet" ? "notYet" : status] += 1;
  }
  const cells = band.rows.map((row) =>
    band.cols.map((col) => {
      const key = band.cell(row, col);
      return key
        ? { row, col, ...info.get(key) }
        : { row, col, key: null, status: "none", difficult: false };
    }),
  );
  return {
    grade: domain.grade,
    op,
    band: { id: band.id, label: band.label, maintain: band.maintain },
    bands: options.map((entry) => ({ id: entry.id, label: entry.label, maintain: entry.maintain })),
    rows: band.rows,
    cols: band.cols,
    cells,
    counts,
    mastered: counts.secure + counts.retained,
  };
}

// ---------- sanitize, migrate, storage ----------

const count = (value, max = 100000) =>
  Number.isFinite(Number(value)) && Number(value) >= 0
    ? Math.min(Math.floor(Number(value)), max)
    : 0;
const stamp = (value) =>
  Number.isFinite(value) && value > 0 && value < 4102444800000 ? Math.floor(value) : null;

function cleanEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const at = stamp(entry.at);
  if (at === null) return null;
  const timed = entry.mode === "timed";
  const ms =
    timed && Number.isFinite(entry.ms) && entry.ms >= 0
      ? Math.min(FACT_SPEED_BANDS.maxMs, Math.round(entry.ms))
      : null;
  return {
    at,
    day: DAY_RE.test(entry.day) ? entry.day : dayOf(at),
    correct: entry.correct === true,
    firstTry: entry.firstTry !== false,
    supported: entry.supported === true,
    ...(ms !== null ? { ms } : {}),
    strategy: STRATEGY_IDS.includes(entry.strategy) ? entry.strategy : null,
    mode: timed ? "timed" : "untimed",
  };
}
function cleanRecord(value) {
  if (!value || typeof value !== "object") return null;
  const recent = (Array.isArray(value.recent) ? value.recent : [])
    .map(cleanEntry)
    .filter(Boolean)
    .slice(-FACT_THRESHOLDS.ringSize);
  const firstTryRight = count(value.firstTryRight);
  const supportedRight = count(value.supportedRight);
  const misses = count(value.misses);
  const legacy =
    value.legacy && typeof value.legacy === "object"
      ? {
          right: count(value.legacy.right, 10000),
          missed: count(value.legacy.missed, 10000),
          last: value.legacy.last === true,
          ...(DAY_RE.test(value.legacy.lastDay) ? { lastDay: value.legacy.lastDay } : {}),
        }
      : null;
  const attempts = firstTryRight + supportedRight + misses;
  if (!attempts && !legacy?.right && !legacy?.missed) return null;
  return {
    attempts,
    firstTryRight,
    supportedRight,
    misses,
    recent,
    lastSeenDay: DAY_RE.test(value.lastSeenDay) ? value.lastSeenDay : null,
    interval: attempts ? REVIEW_LADDER[ladderIndex(count(value.interval, 365) || 1)] : 0,
    dueAt: stamp(value.dueAt),
    retainedAt: stamp(value.retainedAt),
    slipAt: stamp(value.slipAt),
    ...(legacy && (legacy.right || legacy.missed) ? { legacy } : {}),
  };
}

// Drops anything malformed or untracked; a hand-edited save can never crash the Lab.
export function sanitizeFacts(raw) {
  const clean = emptyFacts();
  const source =
    raw && typeof raw === "object" && raw.facts && typeof raw.facts === "object" ? raw.facts : {};
  const entries = [];
  for (const [key, value] of Object.entries(source)) {
    if (!isTrackedKey(key)) continue;
    const record = cleanRecord(value);
    if (record) entries.push([key, record]);
  }
  entries.sort((p, q) => (q[1].lastSeenDay || "").localeCompare(p[1].lastSeenDay || ""));
  for (const [key, record] of entries.slice(0, FACT_THRESHOLDS.maxFacts)) clean.facts[key] = record;
  return clean;
}

// One-way, idempotent: reads the coarse fact-trail chart (data.facts, keyed add:x:y / mul:x:y) WITHOUT changing it.
// A chart cell credits only its add/mul record (the chart merges sub/div into them, so the partners get nothing).
// Facts that already have new evidence, or were migrated before, are skipped, so nothing is counted twice.
export function migrateLegacyTrail(trailFacts, store, now) {
  const base = store?.facts ? store : emptyFacts();
  const facts = { ...base.facts };
  for (const [key, entry] of Object.entries(
    trailFacts && typeof trailFacts === "object" ? trailFacts : {},
  )) {
    if (!isTrackedKey(key) || !/^(add|mul):/.test(key) || !entry || typeof entry !== "object")
      continue;
    const existing = facts[key];
    if (existing && (existing.legacy || existing.attempts > 0)) continue;
    const right = count(entry.right, 10000);
    const missed = count(entry.missed, 10000);
    if (!right && !missed) continue;
    const lastDay = DAY_RE.test(entry.lastDay) ? entry.lastDay : null;
    facts[key] = {
      ...newRecord(),
      lastSeenDay: lastDay,
      legacy: { right, missed, last: entry.last === true, ...(lastDay ? { lastDay } : {}) },
    };
  }
  void now; // accepted for a uniform signature; migration never invents a timestamp
  return { ...base, facts };
}

const storageKey = () => profileKey(FACTS_KEY, profiles().active);
export const loadFacts = () => sanitizeFacts(readLocal(storageKey(), null));
export const saveFacts = (store) => writeLocal(storageKey(), sanitizeFacts(store));

// Subscribes to the existing 'fluency-fact' window event (detail {item, firstTry}) so trail stops, games and
// flip cards feed this model with no change elsewhere. A first-try right answer is independent evidence; a
// first-try miss is a miss. Returns an unsubscribe function. Options let a caller inject storage and the clock.
export function attachFactRecorder(
  win,
  { now = Date.now, load = loadFacts, save = saveFacts, mode = () => "untimed", onRecord } = {},
) {
  if (!win || typeof win.addEventListener !== "function") return () => {};
  const handler = (event) => {
    const key = keyFromItem(event?.detail?.item);
    if (!key) return;
    const firstTry = Boolean(event.detail.firstTry);
    const next = recordFactAttempt(
      load(),
      {
        key,
        correct: firstTry,
        firstTry: true,
        supported: false,
        mode: mode() === "timed" ? "timed" : "untimed",
      },
      now(),
    );
    save(next);
    if (onRecord) onRecord(key, next);
  };
  win.addEventListener("fluency-fact", handler);
  return () => win.removeEventListener("fluency-fact", handler);
}
