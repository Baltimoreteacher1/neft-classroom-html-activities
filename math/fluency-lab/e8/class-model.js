// Class model for the Teacher Hub (Enterprise 8). Pure functions: learners in, one plain object out. A learner is
// { id, label, tutor, e8? } (the same shape the existing teacher tools read; `e8` is the Enterprise 8 record when a
// backup carries one). Everything is derived from the same evidence the learner sees: independent and supported
// answers stay apart, speed never moves a state, and a learner with no evidence is "not yet assessed", never "behind".
// Nothing here stores or sends data.
import { skillKey } from "../tutor-engine.js";
import { buildGraph } from "./knowledge-graph.js";
import { STATE_LABELS, evidenceFor } from "./mastery-evidence.js";
import { activePatterns } from "./misconception-engine.js";
import { emptyE8, sanitizeE8 } from "./e8-store.js";

export const STATE_ORDER = Object.freeze([
  "not-yet",
  "developing",
  "practicing",
  "demonstrated",
  "review-due",
]);
// Every state has a text label and a distinct pattern/symbol so colour is never the only signal.
export const STATE_MARK = Object.freeze({
  "not-yet": { symbol: "–", pattern: "dots" },
  developing: { symbol: "◔", pattern: "diagonal" },
  practicing: { symbol: "◑", pattern: "cross" },
  demonstrated: { symbol: "●", pattern: "solid" },
  "review-due": { symbol: "↻", pattern: "stripe" },
});
// Thresholds for flagging a skill for the whole class: at least this many learners and this share of those with evidence.
export const FLAG = Object.freeze({ minLearners: 2, share: 0.4, minClass: 3 });
export const MAX_LEARNERS = 80;

const safe = (learner, index) => ({
  id: String(learner?.id ?? `learner-${index + 1}`),
  label: String(learner?.label ?? `Learner ${index + 1}`).slice(0, 40),
  tutor:
    learner?.tutor && typeof learner.tutor === "object"
      ? learner.tutor
      : { records: {} },
  e8: learner?.e8 ? sanitizeE8(learner.e8) : emptyE8(),
});

const label = (state, lang) => STATE_LABELS[state][lang === "es" ? "es" : "en"];

export function gradeSkills(grade) {
  const { nodes } = buildGraph();
  return [...nodes.values()]
    .filter((n) => Number(n.grade) === Number(grade))
    .map((n) => ({
      key: n.key,
      title: n.title,
      domain: n.domain,
      standard: n.standard,
    }));
}

// The cell for one learner and one skill. `n` is the count of independent answers, so a cell with little behind it says so.
function cell(learner, key, now) {
  const record = learner.tutor.records?.[key];
  const extras = learner.e8.skills[key] || {};
  const ev = evidenceFor(record, extras, now);
  return {
    state: ev.state,
    independent: ev.independent,
    supported: ev.supported,
    overdue: Boolean(ev.overdue),
    thin: ev.state !== "not-yet" && ev.independent < 3,
  };
}

export function buildClassModel(
  learnersInput,
  { grade, now = Date.now(), skills = null } = {},
) {
  const learners = (Array.isArray(learnersInput) ? learnersInput : [])
    .slice(0, MAX_LEARNERS)
    .map(safe);
  const cols = skills || gradeSkills(grade);
  const rows = learners.map((learner) => {
    const cells = {};
    const counts = Object.fromEntries(STATE_ORDER.map((s) => [s, 0]));
    for (const col of cols) {
      cells[col.key] = cell(learner, col.key, now);
      counts[cells[col.key].state] += 1;
    }
    const assessed = cols.length - counts["not-yet"];
    const patterns = activePatterns(learner.e8.misconceptions, {
      includePossible: false,
    });
    return {
      learner: { id: learner.id, label: learner.label },
      cells,
      counts,
      assessed,
      patterns: patterns.map((p) => ({ id: p.id, status: p.status })),
      attention:
        counts["review-due"] > 0 ||
        patterns.some((p) => p.status === "persistent"),
    };
  });

  const columns = cols.map((col) => {
    const counts = Object.fromEntries(STATE_ORDER.map((s) => [s, 0]));
    for (const row of rows) counts[row.cells[col.key].state] += 1;
    const withEvidence = rows.length - counts["not-yet"];
    const needing = counts.developing + counts["review-due"];
    const flagged =
      rows.length >= FLAG.minClass &&
      needing >= FLAG.minLearners &&
      withEvidence > 0 &&
      needing / withEvidence >= FLAG.share;
    return { ...col, counts, withEvidence, needing, flagged };
  });

  // Reteach list: flagged skills, with the learners who would join a small group (named only by the teacher's own labels).
  const reteach = columns
    .filter((c) => c.flagged)
    .sort((a, b) => b.needing - a.needing || a.key.localeCompare(b.key))
    .map((c) => ({
      key: c.key,
      title: c.title,
      needing: rows
        .filter((r) =>
          ["developing", "review-due"].includes(r.cells[c.key].state),
        )
        .map((r) => r.learner.label),
      reason: {
        en: `${c.needing} of ${c.withEvidence} learners with evidence are still developing this or need a review.`,
        es: `${c.needing} de ${c.withEvidence} estudiantes con evidencia siguen desarrollando esto o necesitan repasar.`,
      },
    }));

  // Misconception clusters: one entry per pattern seen in two or more learners (or persistent in one).
  const byPattern = new Map();
  for (const row of rows)
    for (const p of row.patterns) {
      const entry = byPattern.get(p.id) || {
        id: p.id,
        learners: [],
        persistent: 0,
      };
      entry.learners.push(row.learner.label);
      if (p.status === "persistent") entry.persistent += 1;
      byPattern.set(p.id, entry);
    }
  const clusters = [...byPattern.values()]
    .filter((c) => c.learners.length >= 2 || c.persistent >= 1)
    .sort(
      (a, b) =>
        b.learners.length - a.learners.length || a.id.localeCompare(b.id),
    );

  const overall = Object.fromEntries(STATE_ORDER.map((s) => [s, 0]));
  for (const row of rows)
    for (const s of STATE_ORDER) overall[s] += row.counts[s];

  return {
    grade: Number(grade),
    learnerCount: rows.length,
    skills: cols,
    rows,
    columns,
    reteach,
    clusters,
    overall,
    reviewDue: rows
      .filter((r) => r.counts["review-due"] > 0)
      .map((r) => ({ label: r.learner.label, count: r.counts["review-due"] })),
    caveats: {
      en: "States come from independent answers only. A learner with no answers is not yet assessed, not behind. Counts of two or three answers are early evidence, not a verdict.",
      es: "Los estados vienen solo de respuestas independientes. Quien no tiene respuestas aún no ha sido evaluado, no va atrasado. Dos o tres respuestas son evidencia inicial, no un veredicto.",
    },
  };
}

// Accessible cell description: the same words a screen reader and a printed sheet use.
export function describeCell(learnerLabel, skillTitle, c, lang = "en") {
  const base = `${learnerLabel}, ${skillTitle}: ${label(c.state, lang)}`;
  const n =
    c.state === "not-yet"
      ? ""
      : lang === "es"
        ? `, ${c.independent} independientes, ${c.supported} con apoyo`
        : `, ${c.independent} independent, ${c.supported} supported`;
  const thin = c.thin
    ? lang === "es"
      ? ", evidencia inicial"
      : ", early evidence"
    : "";
  return `${base}${n}${thin}`;
}

export function heatmapCsv(model, lang = "en") {
  // A leading = + - @ would run as a spreadsheet formula, so those cells are prefixed with an apostrophe.
  const q = (v) =>
    `"${String(v)
      .replace(/^([=+\-@\t\r])/, "'$1")
      .replaceAll('"', '""')}"`;
  const head = ["Learner", ...model.skills.map((s) => s.title)];
  const lines = [head.map(q).join(",")];
  for (const row of model.rows)
    lines.push(
      [
        row.learner.label,
        ...model.skills.map((s) => label(row.cells[s.key].state, lang)),
      ]
        .map(q)
        .join(","),
    );
  return `${lines.join("\r\n")}\r\n`;
}

export { skillKey };
