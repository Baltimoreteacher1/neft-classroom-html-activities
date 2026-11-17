// Class at a glance: one row of facts per student, built only from the studio's existing logic (records.js,
// interpret.js, forecast.js). A trend is "up" or "down" only when a comparable earlier result exists and the
// scale-score change is larger than the reported measurement error (comparableSteps().beyondError); "steady"
// when it is within that error; otherwise there is no comparison. Reasons to look at a student are data facts,
// never claims about proficiency.
import { prevYear, schoolYearOf } from "./forecast.js";
import { classSummary, comparableSteps, domainProfile, quartiles } from "./interpret.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS, DOMAINS } from "./rules.js";

export const GLANCE_KEYS = Object.freeze([...DOMAINS, "Overall"]);

export const TREND_WORDS = Object.freeze({
  up: "up beyond measurement error",
  down: "down beyond measurement error",
  steady: "steady (change within measurement error)",
  none: "no comparison",
});

/** Latest record the class views use: the latest annual result, else the latest result of any kind. */
export function latestFor(st) {
  const recs = recordsOf(st);
  const annual = recs.filter((r) => ASSESSMENTS[r.assessmentType].kind === "annual");
  return { recs, rec: annual.at(-1) || recs.at(-1) || null };
}

const scoreOf = (rec, k) => (k === "Overall" ? rec.composites.Overall : rec.domains[k]);

/** Trend per key for one record against its previous comparable result. */
export function trendsFor(st, rec) {
  const step = rec ? comparableSteps(st).find((x) => x.to.assessmentId === rec.assessmentId) : null;
  const out = {};
  for (const k of GLANCE_KEYS) {
    const row = step?.rows.find((r) => r.key === k);
    if (!step) out[k] = { dir: "none", why: "No earlier comparable result." };
    else if (row?.beyondError === true)
      out[k] = {
        dir: row.scaleChange > 0 ? "up" : "down",
        why: `Scale score ${row.scaleChange > 0 ? "+" : ""}${row.scaleChange} since ${step.from.academicYear}, larger than the measurement error.`,
        from: step.from.academicYear,
      };
    else if (row?.beyondError === false)
      out[k] = {
        dir: "steady",
        why: `Change since ${step.from.academicYear} is within the measurement error.`,
      };
    else
      out[k] = {
        dir: "none",
        why:
          step.why ||
          "Scale scores with measurement error are not on file for both results, so a real change cannot be tested.",
      };
  }
  return out;
}

/** One row: latest levels, trends, data-quality flags and plain reasons to look first. */
export function glanceRow(st, today) {
  const { recs, rec } = latestFor(st);
  const current = schoolYearOf(today);
  const row = {
    st,
    rec,
    recs,
    levels: {},
    trends: {},
    flags: [],
    reasons: [],
    grade: rec?.grade ?? null,
  };
  if (!rec) {
    row.flags.push({ kind: "none", text: "No results" });
    row.reasons.push({ w: 5, text: "No ACCESS or MODEL results are on file." });
    return row;
  }
  for (const k of GLANCE_KEYS) row.levels[k] = scoreOf(rec, k).level;
  row.trends = trendsFor(st, rec);
  row.version = `${ASSESSMENTS[rec.assessmentType].short} ${rec.academicYear}`;
  row.versionKey = `${rec.assessmentType}|${rec.academicYear}|${rec.levelVersion}`;
  const missing = DOMAINS.filter((d) => rec.domains[d].status === "missing");
  if (!rec.sourceVerified) {
    row.flags.push({ kind: "unverified", text: "Not checked" });
    row.reasons.push({
      w: 3,
      text: `The ${row.version} result has not been checked against the score report.`,
    });
  }
  if (missing.length) {
    row.flags.push({ kind: "missing", text: `No ${missing.join(", ")}` });
    row.reasons.push({
      w: 2,
      text: `No ${missing.join(" or ")} level on the ${row.version} result.`,
    });
  }
  if (rec.academicYear < prevYear(current))
    row.flags.push({ kind: "old", text: `From ${rec.academicYear}` });
  const drops = DOMAINS.filter((d) => row.trends[d].dir === "down");
  if (drops.length)
    row.reasons.push({
      w: 4,
      text: `${drops.join(" and ")} went down since ${row.trends[drops[0]].from}, by more than the measurement error. Check the score report and classroom work.`,
    });
  if (!recs.some((r) => r.academicYear === current))
    row.reasons.push({ w: 1.5, text: `No result from this school year (${current}) yet.` });
  const prof = domainProfile(rec);
  if (prof.need && (prof.clear || (prof.basis === "levels" && prof.gap >= 1)))
    row.reasons.push({
      w: prof.gap >= 1.5 ? 1.5 : 1,
      text: `${prof.need} is the lowest domain in this profile (${prof.gap.toFixed(1)} levels below ${prof.strength}). A starting point to confirm in class.`,
      domain: prof.need,
    });
  return row;
}

export const attentionWeight = (row) => row.reasons.reduce((s, r) => s + r.w, 0);
/** "Needs attention" filter: a data issue, a real drop, or a wide gap between domains (not every small gap). */
export const needsLook = (row) => row.reasons.some((r) => r.w >= 1.5);

/** The few students to look at first: highest combined weight, then name. */
export function needsAttention(rows, max = 5) {
  return rows
    .filter(needsLook)
    .sort((a, b) => attentionWeight(b) - attentionWeight(a) || a.st.name.localeCompare(b.st.name))
    .slice(0, max);
}

/**
 * Class next steps from the class summary (largest comparable group only, so versions never mix) and the rows:
 * [{ id, text, action: { kind: "planner"|"data"|"classroom", domain? } }], at most three.
 */
export function classNextSteps(students, rows) {
  const out = [];
  const g = classSummary(students).groups[0];
  if (g) {
    const meds = DOMAINS.map((d) => ({
      d,
      q: quartiles(g.records.map(({ record }) => record.domains[d].level)),
    }))
      .filter((x) => x.q)
      .sort((a, b) => a.q.median - b.q.median);
    if (meds.length >= 2 && meds[0].q.median < meds.at(-1).q.median) {
      const low = meds[0];
      out.push({
        id: "low-domain",
        text: `${low.d} is the class's lowest domain (median ${low.q.median.toFixed(1)} across ${low.q.n} students, ${ASSESSMENTS[g.type].short} ${g.year}). Plan a short ${low.d.toLowerCase()} task and gather classroom evidence.`,
        label: `Open the ${low.d} plan`,
        action: { kind: "planner", domain: low.d },
      });
    }
  }
  const unverified = rows.filter((r) => r.flags.some((f) => f.kind === "unverified")).length;
  const none = rows.filter((r) => !r.rec).length;
  if (unverified)
    out.push({
      id: "verify",
      text: `${unverified} result${unverified === 1 ? " has" : "s have"} not been checked against the score report. Checked results make every view more trustworthy.`,
      label: "Check results in Import",
      action: { kind: "data" },
    });
  if (none)
    out.push({
      id: "import",
      text: `${none} student${none === 1 ? " has" : "s have"} no results on file yet.`,
      label: "Import scores",
      action: { kind: "data" },
    });
  if (g && out.length < 3)
    out.push({
      id: "groups",
      text: "Make temporary groups from each student's lowest reported domain, then adjust them with what you see in class.",
      label: "Open groups",
      action: { kind: "classroom" },
    });
  return out.slice(0, 3);
}

/** Most common lowest domain among selected rows, and the median level there (for a group assignment). */
export function groupFocus(rows) {
  const counts = new Map();
  for (const r of rows) {
    if (!r.rec) continue;
    const ds = DOMAINS.filter((d) => r.levels[d] != null).sort((a, b) => r.levels[a] - r.levels[b]);
    if (ds[0]) counts.set(ds[0], (counts.get(ds[0]) || 0) + 1);
  }
  const domain = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || DOMAINS.indexOf(a[0]) - DOMAINS.indexOf(b[0]),
  )[0]?.[0];
  if (!domain) return null;
  const q = quartiles(rows.map((r) => r.levels[domain]));
  return {
    domain,
    level: q?.median ?? null,
    grade: rows.find((r) => r.grade != null)?.grade ?? null,
  };
}
