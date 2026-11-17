// Overview: the first useful interpretation, with no settings. One student: the latest result, its domains
// and composites (reported, calculated or missing), the relative profile, the previous comparable result,
// data quality and the next action. The class: coverage, the distribution of reported overall levels per
// assessment version (versions are never pooled), comparable histories and missing records.
import { barChart, profileChart } from "./charts.js";
import { fmt1, h, table } from "./dom.js";
import {
  classSummary,
  comparableSteps,
  domainProfile,
  levelName,
  nextAction,
} from "./interpret.js";
import { qualityReport } from "./quality.js";
import { recordsOf } from "./records.js";
import {
  ASSESSMENTS,
  COMPOSITE_INFO,
  COMPOSITES,
  DOMAINS,
  LEVEL_WORDS,
  SCALE_WORDS,
} from "./rules.js";
import {
  assessmentLabel,
  COLORS,
  emptyState,
  explain,
  heading,
  kpi,
  scoreChip,
  studentPicker,
  subnav,
} from "./view-common.js";

const levelText = (sc) => (sc.level == null ? "—" : `${fmt1(sc.level)} ${levelName(sc.level)}`);
const scaleText = (sc) =>
  sc.scale != null
    ? String(sc.scale)
    : sc.calculatedScale != null
      ? `${sc.calculatedScale} (calculated)`
      : "—";

export function scoreTable(rec) {
  return table(
    `Scores: ${assessmentLabel(rec, ASSESSMENTS)}`,
    ["Score", "Proficiency level", "Scale score", "Status"],
    [
      ...DOMAINS.map((d) => [d, rec.domains[d]]),
      ...COMPOSITES.map((c) => [`${COMPOSITE_INFO[c].label} (composite)`, rec.composites[c]]),
    ].map(([label, sc]) => [
      label,
      levelText(sc),
      scaleText(sc),
      scoreChip(sc.status === "missing" && sc.calculatedScale != null ? "calculated" : sc.status),
    ]),
  );
}

function studentOverview(ws) {
  const st = ws.student();
  const recs = recordsOf(st);
  const rec = recs.at(-1);
  if (!rec)
    return h(
      "div",
      {},
      studentPicker(ws),
      h(
        "p",
        { class: "pi-note" },
        `No assessment results are on file for ${st.name}. Use Import data to enter them.`,
      ),
    );
  const prof = domainProfile(rec);
  const q = qualityReport([st], { today: ws.today }).findings;
  const steps = comparableSteps(st);
  const prev = steps.at(-1);
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    h(
      "div",
      { class: "pi-kpis" },
      kpi(
        "Most recent",
        ASSESSMENTS[rec.assessmentType].short,
        `${rec.academicYear}${rec.administrationDate ? ` · ${rec.administrationDate}` : ""}`,
        { "data-kpi": "latest" },
      ),
      kpi(
        "Overall (reported)",
        rec.composites.Overall.level != null ? fmt1(rec.composites.Overall.level) : "Not reported",
        rec.composites.Overall.level != null
          ? levelName(rec.composites.Overall.level)
          : "Never averaged from domains",
        { "data-kpi": "overall" },
      ),
      kpi("Relative strength", prof.strength || "—", prof.strength ? "within this profile" : ""),
      kpi(
        "Instructional priority",
        prof.need || "—",
        prof.need ? "confirm with classroom evidence" : "",
      ),
      kpi(
        "Data quality",
        q.length ? `${q.length} to check` : "No issues",
        rec.sourceVerified ? "Verified against the report" : "Not yet verified",
      ),
    ),
    h(
      "p",
      { class: "fine" },
      `${SCALE_WORDS[rec.scaleVersion]} · ${LEVEL_WORDS[rec.levelVersion]}${rec.form ? ` · form ${rec.form}` : ""}${rec.synthetic ? " · synthetic" : ""}`,
    ),
    profileChart({
      title: `${st.name}: domain levels, ${assessmentLabel(rec, ASSESSMENTS)}`,
      rows: DOMAINS.map((d) => ({
        key: d,
        label: d,
        value: rec.domains[d].level,
        status: rec.domains[d].status,
      })),
      colors: COLORS,
    }),
    explain({
      summary: prof.text,
      uncertain:
        "One assessment is one sample of language on one day. Small differences between domains can come from measurement error.",
      act: nextAction(st, rec, prof),
      evidence: scoreTable(rec),
      how: h(
        "p",
        {},
        "Strengths and priorities compare the four reported domain levels of this one assessment. When scale scores with measurement error are on file, a gap counts as clear only if it is larger than 1.96 times the combined error. Composite levels come only from the score report; a missing composite scale score may be illustrated from the domain scale scores with verified weights, and is labelled calculated.",
      ),
    }),
    prev
      ? h(
          "section",
          { "aria-label": "Previous comparable result" },
          heading(3, "Compared with the previous result"),
          prev.levelsComparable || prev.scalesComparable
            ? table(
                `${assessmentLabel(prev.from, ASSESSMENTS)} to ${assessmentLabel(prev.to, ASSESSMENTS)}`,
                ["Score", "Before", "Now", "Change"],
                prev.rows.map((r) => [
                  r.key,
                  levelText(r.from),
                  levelText(r.to),
                  r.levelChange == null
                    ? "—"
                    : `${r.levelChange > 0 ? "+" : ""}${r.levelChange.toFixed(1)}`,
                ]),
              )
            : h("p", { class: "pi-note", "data-not-comparable": "" }, prev.why),
        )
      : null,
  );
}

function classOverview(ws) {
  const sum = classSummary(ws.students);
  const sections = sum.groups.map((g) =>
    h(
      "section",
      { "aria-label": `${ASSESSMENTS[g.type].short} ${g.year}` },
      heading(
        3,
        `${ASSESSMENTS[g.type].short} ${g.year} (${g.records.length} student${g.records.length === 1 ? "" : "s"})`,
      ),
      h(
        "p",
        { class: "fine" },
        `${g.words}. Students on other versions are summarised separately and never averaged with this group.`,
      ),
      barChart({
        title: `Reported overall levels, ${ASSESSMENTS[g.type].short} ${g.year}`,
        bars: [1, 2, 3, 4, 5, 6].map((lv) => ({
          label: `${lv}.0-${lv}.9`,
          value: g.records.filter(
            ({ record }) => Math.floor(record.composites.Overall.level ?? 0) === lv,
          ).length,
        })),
      }),
      table(
        `Domain levels, ${ASSESSMENTS[g.type].short} ${g.year}`,
        ["Student", ...DOMAINS, "Overall"],
        g.records.map(({ student, record }) => [
          student.name,
          ...DOMAINS.map((d) => fmt1(record.domains[d].level)),
          fmt1(record.composites.Overall.level),
        ]),
      ),
    ),
  );
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-kpis" },
      kpi("Students", String(sum.total)),
      kpi("With results", String(sum.total - sum.missing), `${sum.missing} without any record`),
      kpi("Comparable history", String(sum.multi), "two annual results on one scale"),
      kpi("Assessment versions", String(sum.groups.length), "kept apart"),
    ),
    explain({
      summary:
        sum.groups.length > 1
          ? "Your class has results from more than one assessment version or year. Each group is shown on its own; no class average mixes them."
          : "Each student's latest annual result is grouped by assessment and year.",
      act: "Open Classroom Insights for domain patterns and temporary groups, or the Instructional Planner to act on them.",
    }),
    ...sections,
  );
}

export function renderOverview(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.overview || "student";
  return h(
    "div",
    {},
    subnav(
      ws,
      "overview",
      [
        ["student", "One student"],
        ["class", "Whole class"],
      ],
      view,
    ),
    view === "class" ? classOverview(ws) : studentOverview(ws),
  );
}
