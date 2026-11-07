// Fall / winter / spring benchmark windows (Ellevation Benchmark model) built from the existing practice forms.
//
// Each window is one existing full practice form. Growth is shown per domain as "number right out of the same
// number of questions" between windows, never as a level, a score band, a percentage or a prediction. Speaking
// and Writing are never auto-scored here: they show whether the response was completed and need a teacher review.
// Grades 3-5 have two forms, so their spring window repeats Form A; the screen says a repeat form can include
// a practice effect. A finished form is saved into a window by an explicit press, so a retake never overwrites
// an earlier window.

import { codeBand } from "../bands.js";

export const WINDOWS = [
  { id: "fall", en: "Fall", es: "Otoño" },
  { id: "winter", en: "Winter", es: "Invierno" },
  { id: "spring", en: "Spring", es: "Primavera" },
];

const FORMS = {
  "6-8": { fall: "model-form-a", winter: "model-form-b", spring: "model-form-c" },
  "3-5": { fall: "g35-form-a", winter: "g35-form-b", spring: "g35-form-a" },
};

/** Kindergarten to grade 3 have no four-domain practice form (Kindergarten is an adult-read story), so no windows. */
export const hasBenchmarkForms = (band) => Boolean(FORMS[codeBand(band)]);

export const SCORED_DOMAINS = ["Listening", "Reading"];
export const REVIEWED_DOMAINS = ["Speaking", "Writing"];
/** Fewer scored questions than this in a domain and the comparison is withheld. */
export const MIN_ITEMS = 4;

/** The window list for a band, each with its form id; repeat marks a form already used by an earlier window. */
export function windowsFor(band) {
  const forms = FORMS[codeBand(band)];
  if (!forms) return [];
  const used = new Set();
  return WINDOWS.map((w) => {
    const testId = forms[w.id];
    const repeat = used.has(testId);
    used.add(testId);
    return { ...w, testId, repeat };
  });
}

/** One window's finished result, by domain, from a saved test record (store.js loadTestRecord). */
export function windowResult(record) {
  const r = record?.results;
  if (!r || !Array.isArray(r.sections) || !r.meaningful) return null;
  const domains = {};
  for (const s of r.sections) {
    if (!s?.domain) continue;
    const d = (domains[s.domain] ||= { correct: 0, total: 0, open: 0, openDone: 0 });
    d.correct += Number(s.correct) || 0;
    d.total += Number(s.total) || 0;
    d.open += Number(s.open) || 0;
    d.openDone += Number(s.openDone) || 0;
  }
  return { date: typeof r.date === "string" ? r.date : "", domains };
}

export const BENCHMARK_KEY = "accessPracticeLab:v1:benchmarks";

/** Saved windows, read defensively: { "6-8": { fall: {date, domains}, ... }, "3-5": {...} }. Only the bands with forms. */
export function normalizeSnapshots(raw) {
  const out = { "6-8": {}, "3-5": {} };
  if (!raw || typeof raw !== "object") return out;
  for (const band of Object.keys(out)) {
    for (const w of WINDOWS) {
      const snap = raw?.[band]?.[w.id];
      if (snap && typeof snap === "object" && snap.domains && typeof snap.domains === "object")
        out[band][w.id] = { date: String(snap.date || ""), domains: snap.domains };
    }
  }
  return out;
}

/**
 * Windows whose form has a finished result that is not yet saved to any window. The learner (or teacher)
 * presses "Save as <window>": a window is never filled automatically, because one form serves two windows in 3-5.
 */
export function saveableWindows(band, snapshots, loadRecord) {
  const saved = snapshots?.[codeBand(band)] || {};
  const savedDates = new Set(Object.values(saved).map((s) => s.date));
  return windowsFor(band).filter((w) => {
    if (saved[w.id]) return false;
    const result = windowResult(loadRecord(w.testId));
    return Boolean(result && !savedDates.has(result.date));
  });
}

/** Saves the form's current result into one window. Returns the new snapshots (never mutates). */
export function saveWindow(snapshots, band, windowId, loadRecord) {
  const b = codeBand(band);
  const w = windowsFor(b).find((x) => x.id === windowId);
  const result = w && windowResult(loadRecord(w.testId));
  if (!result) return snapshots;
  return { ...snapshots, [b]: { ...snapshots[b], [windowId]: result } };
}

/** Growth by domain across the saved windows. */
export function benchmarkGrowth(band, snapshots) {
  const saved = snapshots?.[codeBand(band)] || {};
  const windows = windowsFor(band).map((w) => ({ ...w, result: saved[w.id] || null }));
  const rows = [...SCORED_DOMAINS, ...REVIEWED_DOMAINS].map((domain) => {
    const scored = SCORED_DOMAINS.includes(domain);
    const cells = windows.map((w) => {
      const d = w.result?.domains?.[domain];
      if (!d) return { window: w.id, state: "none" };
      if (!scored) return { window: w.id, state: d.openDone > 0 ? "review" : "none" };
      return d.total
        ? { window: w.id, state: "scored", correct: d.correct, total: d.total }
        : { window: w.id, state: "none" };
    });
    const points = cells.filter((c) => c.state === "scored");
    let change = null;
    if (scored && points.length >= 2) {
      const first = points[0];
      const last = points.at(-1);
      change =
        first.total === last.total && first.total >= MIN_ITEMS
          ? { from: first.window, to: last.window, diff: last.correct - first.correct, of: last.total }
          : { withheld: true };
    }
    return { domain, scored, cells, change };
  });
  return { windows, done: windows.filter((w) => w.result).length, rows };
}
