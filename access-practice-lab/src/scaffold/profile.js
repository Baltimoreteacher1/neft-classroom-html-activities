// Local-only student profile for Scaffold Studio: which supports a student used, which they stopped needing, and how far
// they have faded in each domain. One versioned key on this device. No account, no network, nothing leaves the page.
//
// Honesty rules (same as src/lang/supports-report.js): counts and plain sentences only. No score, no percentage of
// "independence", no level. "Asked for more help" is recorded as neutral bookkeeping and is never framed as a miss.
import { DOMAINS } from "./schema/v1.js";
import { STEPS, stepIndex } from "./fading.js";

export const PROFILE_KEY = "accessPracticeLab:v1:scaffold";
export const PROFILE_VERSION = 1;
export const MAX_RUNS = 60;
/** A support counts as "growing out of" after being used in earlier runs and absent from this many recent ones. */
export const OUTGROWN_AFTER = 3;

export const emptyProfile = () => ({ v: PROFILE_VERSION, dial: "", units: {} });

/** Read a stored profile defensively. Anything unreadable is "no evidence", never an error. */
export function cleanProfile(raw) {
  const p = emptyProfile();
  if (!raw || typeof raw !== "object" || raw.v !== PROFILE_VERSION) return p;
  if (STEPS.includes(raw.dial)) p.dial = raw.dial;
  for (const [unit, doms] of Object.entries(raw.units || {})) {
    if (typeof unit !== "string" || !doms || typeof doms !== "object") continue;
    for (const d of DOMAINS) {
      const runs = Array.isArray(doms[d]) ? doms[d] : [];
      const ok = runs
        .filter((r) => r && STEPS.includes(r.step))
        .map((r) => ({ step: r.step, help: Boolean(r.help), supports: Array.isArray(r.supports) ? r.supports.filter((s) => typeof s === "string").slice(0, 12) : [], at: typeof r.at === "string" ? r.at.slice(0, 10) : "" }))
        .slice(-MAX_RUNS);
      if (ok.length) (p.units[unit] ||= {})[d] = ok;
    }
  }
  return p;
}

export function load(store) {
  try {
    return cleanProfile(JSON.parse(store.get(PROFILE_KEY) || "null"));
  } catch {
    return emptyProfile();
  }
}
export function save(store, profile) {
  try {
    store.set(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

/** Add one finished activity. Returns a new profile. */
export function recordRun(profile, { unit, domain, step, help = false, supports = [], at = "" }) {
  if (!unit || !DOMAINS.includes(domain) || !STEPS.includes(step)) return profile;
  const next = cleanProfile(JSON.parse(JSON.stringify(profile)));
  const list = ((next.units[unit] ||= {})[domain] ||= []);
  list.push({ step, help: Boolean(help), supports: [...new Set(supports)].slice(0, 12), at: String(at).slice(0, 10) });
  if (list.length > MAX_RUNS) list.splice(0, list.length - MAX_RUNS);
  return next;
}

const allRuns = (profile, domain) => Object.values(profile.units).flatMap((u) => u[domain] || []);

/** Supports a student used before but has not needed in the last OUTGROWN_AFTER runs of that domain. */
export function outgrown(profile, domain) {
  const runs = allRuns(profile, domain);
  if (runs.length <= OUTGROWN_AFTER) return [];
  const recent = new Set(runs.slice(-OUTGROWN_AFTER).flatMap((r) => r.supports));
  const earlier = new Set(runs.slice(0, -OUTGROWN_AFTER).flatMap((r) => r.supports));
  return [...earlier].filter((s) => !recent.has(s)).sort();
}

/** Where the student has faded to, per domain: the lowest step used in the latest run, with how many runs that is based on. */
export function fadeProgress(profile) {
  return Object.fromEntries(
    DOMAINS.map((d) => {
      const runs = allRuns(profile, d);
      const last = runs.at(-1);
      return [d, { runs: runs.length, latestStep: last?.step || null, onOwnRuns: runs.filter((r) => r.step === "none" && !r.help).length }];
    }),
  );
}

/** Rows for the teacher export: one per unit and domain. Counts only. */
export function evidenceRows(profile) {
  const rows = [];
  for (const unit of Object.keys(profile.units).sort())
    for (const d of DOMAINS) {
      const runs = profile.units[unit][d];
      if (!runs?.length) continue;
      const by = Object.fromEntries(STEPS.map((s) => [s, runs.filter((r) => r.step === s).length]));
      const first = runs[0];
      const last = runs.at(-1);
      rows.push({
        unit,
        domain: d,
        runs: runs.length,
        full: by.full,
        partial: by.partial,
        hint: by.hint,
        none: by.none,
        onOwn: runs.filter((r) => r.step === "none" && !r.help).length,
        askedForMoreHelp: runs.filter((r) => r.help).length,
        firstStep: first.step,
        latestStep: last.step,
        direction: stepIndex(last.step) > stepIndex(first.step) ? "less support over time" : stepIndex(last.step) < stepIndex(first.step) ? "more support over time" : "steady",
        supportsUsedRecently: [...new Set(runs.slice(-OUTGROWN_AFTER).flatMap((r) => r.supports))].sort().join(" | "),
        firstDate: first.at,
        latestDate: last.at,
      });
    }
  return rows;
}

const csvCell = (v) => {
  let s = String(v ?? "");
  // A cell starting with = + - @ would run as a formula in a spreadsheet. Counts never need it, text might.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const EXPORT_COLUMNS = ["unit", "domain", "runs", "full", "partial", "hint", "none", "onOwn", "askedForMoreHelp", "firstStep", "latestStep", "direction", "supportsUsedRecently", "firstDate", "latestDate"];

export function toCsv(rows) {
  return `${[EXPORT_COLUMNS.join(","), ...rows.map((r) => EXPORT_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\r\n")}\r\n`;
}

/** The JSON export. It names the device-only nature of the data and carries no student name unless the teacher adds one. */
export function toJson(profile, { studentLabel = "", generatedAt = "" } = {}) {
  return JSON.stringify(
    {
      kind: "scaffold-studio-evidence",
      version: PROFILE_VERSION,
      generatedAt,
      studentLabel,
      note: "Counts of supports used. Not a score, level or placement. Recorded on one device.",
      rows: evidenceRows(profile),
      outgrown: Object.fromEntries(DOMAINS.map((d) => [d, outgrown(profile, d)])),
    },
    null,
    2,
  );
}
