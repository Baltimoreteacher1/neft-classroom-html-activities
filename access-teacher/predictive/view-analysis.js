// Teacher-facing statistical tools. Summaries use one reported cohort; comparisons preserve matched
// student pairs and only join adjacent official results on the same proficiency scale.
import { classSummary } from "./interpret.js";
import { adjacentYearPairs, describe, pairedSummary } from "./analysis.js";
import { ASSESSMENTS, DOMAINS } from "./rules.js";
import { h, table } from "./dom.js";
import { emptyState, heading } from "./view-common.js";

const keys = [...DOMAINS, "Overall"];
const score = (record, key) => (key === "Overall" ? record.composites.Overall.level : record.domains[key].level);
const fmt = (value, digits = 2) => (value == null || !Number.isFinite(value) ? "—" : Number(value).toFixed(digits));
const pLabel = (p) => (p < 0.0001 ? "p < 0.0001" : `p = ${p.toFixed(4)}`);
const option = (value, label, selected) => h("option", { value, selected: Boolean(selected) }, label);
const selectField = (id, label, choices, current, onChange) => {
  const control = h("select", { id, on: { change: (e) => onChange(e.target.value) } }, ...choices.map(([v, text]) => option(v, text, current === v)));
  return h("label", { class: "pi-field pi-analysis-field", for: id }, h("span", {}, label), control);
};

function medianLabel(summary) {
  if (!summary?.medianCI) return "not enough data";
  const { lo, hi, exactCoverage } = summary.medianCI;
  const coverage = exactCoverage >= 0.95 ? `${Math.round(exactCoverage * 100)}% exact coverage` : `observed range; a 95% interval needs more pairs (${Math.round(exactCoverage * 100)}% coverage)`;
  return `${fmt(lo)} to ${fmt(hi)} (${coverage} interval)`;
}

function resultCard({ title, summary, context, id }) {
  if (!summary) return h("section", { class: "pi-card" }, h("h3", {}, title), h("p", { class: "pi-note" }, "There are no complete student pairs for this selection."));
  const { test } = summary;
  return h(
    "section",
    { class: "pi-card pi-analysis-result", "aria-labelledby": id },
    h("h3", { id }, title),
    h("p", { class: "fine" }, context),
    h("div", { class: "pi-analysis-metrics" },
      h("div", {}, h("strong", {}, fmt(summary.median)), h("span", {}, "Median change")),
      h("div", {}, h("strong", {}, medianLabel(summary)), h("span", {}, "Exact interval for median")),
      h("div", {}, h("strong", {}, `${test.positive} up · ${test.negative} down · ${summary.ties} tied`), h("span", {}, `Student pairs (${test.n} non-tied)`)),
      h("div", {}, h("strong", {}, test.effect == null ? "—" : fmt(test.effect, 3)), h("span", {}, "Direction balance (−1 to +1)")),
      h("div", {}, h("strong", {}, pLabel(test.p)), h("span", {}, "Exact two-sided sign test")),
    ),
    h("p", { class: "pi-analysis-plain" }, test.p < 0.05
      ? "In this selected set of students, increases and decreases are imbalanced enough to be unusual if neither direction were more common. This is evidence of a pattern, not proof of why it happened."
      : "This selected set does not show clear evidence that one direction is more common. That does not prove there was no change or that the domains are identical."),
    h("details", { class: "pi-details" },
      h("summary", {}, "What the test measures"),
      h("p", {}, "The exact sign test counts only whether each student's paired difference is above or below zero; ties are shown and left out of the test. It does not assume proficiency levels have equal spacing and does not rely on a large-sample approximation."),
      h("p", {}, "The interval is a distribution-free order-statistic interval for the median difference. With a small class it can be wide; its coverage is conservative. Students are the independent units, so repeated scores from one student are never counted as separate people."),
    ),
  );
}

function distributionPanel(ws, cohorts) {
  if (!cohorts.length) return h("section", { class: "pi-card" }, h("h3", {}, "Score distribution"), h("p", { class: "pi-note" }, "No reported results are available."));
  const choices = cohorts.map((g) => [
    `${g.type}|${g.year}|${g.levelVersion}`,
    `${g.type.replaceAll("_", " ")} · ${g.year} · ${g.words} · ${g.records.length} students`,
  ]);
  const current = choices.some(([v]) => v === ws.sub.analysisCohort) ? ws.sub.analysisCohort : choices[0][0];
  const cohort = cohorts.find((g) => `${g.type}|${g.year}|${g.levelVersion}` === current);
  const rows = keys.map((key) => {
    const values = cohort.records.map(({ record }) => score(record, key)).filter(Number.isFinite);
    const missing = cohort.records.length - values.length;
    const a = describe(values);
    return [key === "Overall" ? "Overall (reported)" : key, a?.n ?? 0, a ? fmt(a.median, 1) : "—", a ? `${fmt(a.q1, 1)}–${fmt(a.q3, 1)}` : "—", a ? `${fmt(a.min, 1)}–${fmt(a.max, 1)}` : "—", a ? fmt(a.mean, 2) : "—", a?.sd == null ? "—" : fmt(a.sd, 2), missing];
  });
  return h("section", { class: "pi-card", "aria-labelledby": "piAnalysisDistribution" },
    h("h3", { id: "piAnalysisDistribution" }, "Describe one comparable cohort"),
    h("p", { class: "fine" }, "This view uses the same assessment, report year, and proficiency scale for every student. It reports each student's latest official result in that cohort."),
    selectField("piAnalysisCohort", "Cohort", choices, current, (v) => { ws.sub.analysisCohort = v; ws.rerender(); }),
    table("Descriptive statistics for reported proficiency levels", ["Score", "n", "Median", "Middle half (Q1–Q3)", "Range", "Mean*", "SD*", "Missing"], rows),
    h("p", { class: "fine" }, "Median and middle half show the center and spread while resisting unusual values. *Mean and standard deviation treat the ordered proficiency levels as if steps were evenly spaced, so use them as rough summaries. Missing scores are not filled in or estimated."),
  );
}

function comparisonPanel(ws, cohorts) {
  if (!cohorts.length) return null;
  const options = cohorts.map((g) => [`${g.type}|${g.year}|${g.levelVersion}`, `${g.type.replaceAll("_", " ")} · ${g.year} · ${g.words} · ${g.records.length} students`]);
  const cohortId = options.some(([v]) => v === ws.sub.analysisCohort) ? ws.sub.analysisCohort : options[0][0];
  const cohort = cohorts.find((g) => `${g.type}|${g.year}|${g.levelVersion}` === cohortId);
  const a = DOMAINS.includes(ws.sub.analysisA) ? ws.sub.analysisA : "Listening";
  const b = DOMAINS.includes(ws.sub.analysisB) && ws.sub.analysisB !== a ? ws.sub.analysisB : (a === "Speaking" ? "Listening" : "Speaking");
  const diffs = cohort.records.map(({ record }) => record.domains[a].level - record.domains[b].level).filter(Number.isFinite);
  const summary = pairedSummary(diffs);
  return h("section", { class: "pi-card", "aria-labelledby": "piAnalysisCompare" },
    h("h3", { id: "piAnalysisCompare" }, "Compare two domains within students"),
    h("p", { class: "fine" }, "Every difference is paired within one student's same report. Positive means the first domain is higher."),
    h("div", { class: "pi-analysis-controls" },
      selectField("piAnalysisA", "First domain", DOMAINS.map((d) => [d, d]), a, (v) => { ws.sub.analysisA = v; ws.rerender(); }),
      selectField("piAnalysisB", "Compare with", DOMAINS.filter((d) => d !== a).map((d) => [d, d]), b, (v) => { ws.sub.analysisB = v; ws.rerender(); }),
      selectField("piAnalysisPairCohort", "Same-scale cohort", options, cohortId, (v) => { ws.sub.analysisCohort = v; ws.rerender(); }),
    ),
    resultCard({ id: "piAnalysisDomainResult", title: `${a} minus ${b}`, summary, context: `Students with both scores: ${summary?.n + (summary?.ties || 0) || 0}. Difference = ${a} level − ${b} level. The selected cohort has one assessment year and one proficiency-level scale.` }),
    h("p", { class: "fine" }, "This is exploratory. Domain comparisons can be affected by domain-specific measurement error; a small p-value does not establish instructional importance. Try one comparison at a time, then confirm the pattern with classroom evidence."),
  );
}

function growthPanel(ws) {
  const pairs = adjacentYearPairs(ws.students);
  if (!pairs.length) return h("section", { class: "pi-card" }, h("h3", {}, "Year-to-year change"), h("p", { class: "pi-note" }, "No adjacent-year official score pairs on the same scale are available yet. Results across assessment or cut-score changes are not combined."));
  const choices = pairs.map((p) => [p.key, `${p.type.replaceAll("_", " ")} · ${p.from} to ${p.to} · ${p.rows.length} students`]);
  const pairKey = choices.some(([v]) => v === ws.sub.analysisYears) ? ws.sub.analysisYears : choices[0][0];
  const pair = pairs.find((p) => p.key === pairKey);
  const domain = DOMAINS.includes(ws.sub.analysisGrowthDomain) ? ws.sub.analysisGrowthDomain : "Reading";
  const diffs = pair.rows.map(({ from, to }) => to.domains[domain].level - from.domains[domain].level).filter(Number.isFinite);
  const summary = pairedSummary(diffs);
  return h("section", { class: "pi-card", "aria-labelledby": "piAnalysisGrowth" },
    h("h3", { id: "piAnalysisGrowth" }, "Check year-to-year change"),
    h("p", { class: "fine" }, "The same students are compared across adjacent school years. Only identical assessment and proficiency-score versions are eligible."),
    h("div", { class: "pi-analysis-controls" },
      selectField("piAnalysisYears", "Year pair", choices, pairKey, (v) => { ws.sub.analysisYears = v; ws.rerender(); }),
      selectField("piAnalysisGrowthDomain", "Domain", DOMAINS.map((d) => [d, d]), domain, (v) => { ws.sub.analysisGrowthDomain = v; ws.rerender(); }),
    ),
    resultCard({ id: "piAnalysisGrowthResult", title: `${domain}: ${pair.from} to ${pair.to}`, summary, context: `${summary?.n + (summary?.ties || 0) || 0} students with both years. Difference = later level − earlier level; positive means an increase.` }),
    h("p", { class: "fine" }, "This shows whether change tended to go in one direction in this class. It cannot tell whether instruction caused the change; annual scores also contain measurement error and year-to-year differences in testing conditions."),
  );
}

export function renderAnalysis(ws) {
  if (!ws.students.length) return emptyState(ws);
  const cohorts = classSummary(ws.students).groups.filter((group) => ASSESSMENTS[group.type]?.kind === "annual");
  return h("div", { class: "pi-stack pi-analysis" },
    heading(2, "Statistical Lab"),
    h("p", { class: "lead" }, "Explore score distributions, matched domain differences, and year-to-year change. Each result says what was measured and how much evidence supports it."),
    h("aside", { class: "pi-analysis-note", role: "note" }, h("strong", {}, "Data stays on this device. "), "The calculations use reported scores only. They are summaries of your selected class, not diagnoses, placement decisions, causal claims, or individual predictions."),
    distributionPanel(ws, cohorts),
    comparisonPanel(ws, cohorts),
    growthPanel(ws),
  );
}
