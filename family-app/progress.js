// Family home "Today": a read-only summary of what this device has saved in the two practice apps.
// It reads the apps' own records (no second copy to drift) and reports counts only: no scores, no levels, no
// proficiency claims. A week starts Monday, local time. `store` is { get(key), keys() } so tests can pass a fake.

export const FLUENCY_TUTOR_KEY = "ewl-fluency-tutor-v2";
export const ACCESS_PREFIX = "accessPracticeLab:v1:";
const ACCESS_TEST_PREFIX = `${ACCESS_PREFIX}test:`;
// Keys under ACCESS_PREFIX that are settings or side stores, not "<Domain>:<Level>" progress records.
const ACCESS_NON_RECORDS = new Set([
  "test",
  "prefs",
  "studentName",
  "pathway",
  "ledger",
  "studio",
  "missions",
]);

const json = (raw) => {
  try {
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

export function weekStart(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

const dayOf = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function tally(stamps, since) {
  const week = stamps.filter((ms) => ms >= since);
  return {
    lastAt: stamps.length ? Math.max(...stamps) : null,
    daysThisWeek: new Set(week.map(dayOf)).size,
  };
}

export function fluencySummary(store, now = new Date()) {
  const sessions = json(store.get(FLUENCY_TUTOR_KEY))?.sessions;
  const list = Array.isArray(sessions) ? sessions.filter((s) => Number.isFinite(s?.at)) : [];
  const since = weekStart(now);
  const week = list.filter((s) => s.at >= since);
  return {
    ...tally(
      list.map((s) => s.at),
      since,
    ),
    answeredThisWeek: week.reduce((sum, s) => sum + (s.answered || 0), 0),
    withoutHelpThisWeek: week.reduce((sum, s) => sum + (s.correct || 0), 0),
  };
}

// The same evidence rule the English lab uses for its own practice days: a result counts only when the
// learner did real work on it (not a blank or an unpracticed draft).
const countsAsPractice = (r) =>
  r?.date && r.meaningful !== false && r.words !== 0 && r.practiced !== false;

export function englishSummary(store, now = new Date()) {
  const stamps = [];
  for (const key of store.keys()) {
    if (!key.startsWith(ACCESS_PREFIX)) continue;
    if (key.startsWith(ACCESS_TEST_PREFIX)) {
      const t = json(store.get(key))?.results;
      const worked =
        t?.meaningful ??
        t?.sections?.some((s) => s.openDone > 0 || s.attempted > 0 || s.correct > 0);
      if (t?.date && worked) stamps.push(Date.parse(t.date));
      continue;
    }
    const rest = key.slice(ACCESS_PREFIX.length).split(":");
    if (rest[0] === "g3-5") rest.shift();
    if (rest.length !== 2 || ACCESS_NON_RECORDS.has(rest[0])) continue;
    for (const r of Object.values(json(store.get(key))?.results || {}))
      if (countsAsPractice(r)) stamps.push(Date.parse(r.date));
  }
  const valid = stamps.filter(Number.isFinite);
  const since = weekStart(now);
  return {
    ...tally(valid, since),
    activitiesThisWeek: valid.filter((ms) => ms >= since).length,
  };
}

/** Which area to suggest next: the one practiced on fewer days this week, then the one left longest. Math wins ties. */
export function suggestNext(math, english) {
  if (math.daysThisWeek !== english.daysThisWeek)
    return math.daysThisWeek < english.daysThisWeek ? "math" : "english";
  return (math.lastAt ?? 0) <= (english.lastAt ?? 0) ? "math" : "english";
}
