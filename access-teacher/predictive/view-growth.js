// Domain Growth Lab: one longitudinal chart per domain and the reported overall level, each with a data
// table. Forecast points and uncertainty bands appear only for validated forecasts.
import { growthChart } from "./charts.js";
import { comparableSteps } from "./interpret.js";
import { ASSESSMENTS } from "./rules.js";
import { assessmentLabel, explain } from "./view-common.js";
import { fmt1, h, table, tip } from "./dom.js";
import { nextYear, SCALE_RESET_YEAR, SERIES_KEYS, schoolYearOf } from "./forecast.js";
import { chip, COLORS, emptyState, heading, studentPicker } from "./view-common.js";

function yearsBetween(a, b) {
  const out = [];
  for (let y = a; y <= b && out.length < 30; y = nextYear(y)) out.push(y);
  return out;
}

function evidenceByYear(student, domain) {
  const counts = new Map();
  for (const e of student.entries || []) {
    if (e.domain !== domain || !e.t) continue;
    const y = schoolYearOf(e.t);
    counts.set(y, (counts.get(y) || 0) + 1);
  }
  return [...counts.entries()].map(([year, count]) => ({ year, count }));
}

function domainBlock(ws, st, key) {
  const target = ws.state.targets[key] ?? null;
  const f = ws.forecast(st, key, target);
  const markers = key === "Overall" ? [] : evidenceByYear(st, key);
  const allYears = [
    ...f.series.map((p) => p.year),
    ...markers.map((m) => m.year),
    f.targetYear,
  ].sort();
  const years = yearsBetween(allYears[0], allYears.at(-1));
  const forecast = f.numbers
    ? {
        year: f.targetYear,
        expected: f.numbers.expected,
        lo: f.numbers.interval80[0],
        hi: f.numbers.interval80[1],
      }
    : null;
  const rows = years.map((y) => {
    const p = f.series.find((x) => x.year === y);
    const m = markers.find((x) => x.year === y);
    return [
      y,
      p ? p.level.toFixed(1) : "—",
      forecast && y === forecast.year
        ? `${fmt1(forecast.expected)} (80%: ${fmt1(forecast.lo)} to ${fmt1(forecast.hi)})`
        : "—",
      m ? String(m.count) : "0",
      y >= SCALE_RESET_YEAR ? "After reset" : "Before reset",
    ];
  });
  return h(
    "article",
    { class: "pi-card", "aria-labelledby": `pi-g-${key}` },
    h(
      "div",
      { class: "pi-card-head" },
      h("h3", { id: `pi-g-${key}` }, key === "Overall" ? "Overall (reported)" : key),
      chip(f.status),
    ),
    growthChart({
      title: `${key} levels for ${st.name}`,
      years,
      points: f.series,
      forecast,
      target,
      markers,
      color: COLORS[key],
    }),
    f.numbers ? null : h("p", { class: "fine" }, `No forecast drawn: ${f.plain}`),
    h(
      "details",
      { class: "pi-details" },
      h("summary", {}, `Show ${key} data table`),
      table(
        `${key} data for ${st.name}`,
        ["School year", "Reported level", "Validated forecast", "Practice items", "Scale era"],
        rows,
      ),
    ),
  );
}

export function renderGrowth(ws) {
  if (!ws.students.length) return emptyState(ws);
  const st = ws.student();
  return h(
    "div",
    {},
    heading(
      2,
      "Growth",
      tip(
        "Scale reset",
        `ACCESS changed its score scale in ${SCALE_RESET_YEAR}. Levels before and after it are not compared, and no model is trained across it.`,
      ),
    ),
    h(
      "p",
      { class: "lead" },
      "Reported levels over time. The flat line is the first reported level (baseline). Diamonds mark practice evidence from the lab in that school year. A shaded band is drawn only for a validated forecast.",
    ),
    studentPicker(ws),
    changePanel(st),
    h(
      "div",
      { class: "pi-grid-2" },
      SERIES_KEYS.map((k) => domainBlock(ws, st, k)),
    ),
  );
}

/** Observed change between comparable results, with measurement context and the three plain questions. */
function changePanel(st) {
  const steps = comparableSteps(st);
  if (!steps.length)
    return explain({
      summary: "Only one result (or one per assessment) is on file, so there is no change to describe yet.",
      act: "Enter the previous year's score report, or a MODEL result from this year, on Import data.",
    });
  const last = steps.at(-1);
  const rows = last.rows.filter((r) => r.levelChange != null || r.scaleChange != null);
  const up = rows.filter((r) => (r.levelChange ?? 0) > 0).map((r) => r.key);
  const down = rows.filter((r) => (r.levelChange ?? 0) < 0).map((r) => r.key);
  const twoOnly = steps.filter((x) => x.levelsComparable).length < 2;
  return h(
    "section",
    { "aria-labelledby": "piChangeT" },
    h("h3", { id: "piChangeT" }, `Change: ${assessmentLabel(last.from, ASSESSMENTS)} to ${assessmentLabel(last.to, ASSESSMENTS)}`),
    last.levelsComparable || last.scalesComparable
      ? table(
          "Observed change between comparable results",
          ["Score", "Before", "After", "Level change", "Scale change", "Beyond measurement error?"],
          last.rows.map((r) => [
            r.key,
            fmt1(r.from.level),
            fmt1(r.to.level),
            r.levelChange == null ? "—" : `${r.levelChange > 0 ? "+" : ""}${r.levelChange.toFixed(1)}`,
            r.scaleChange == null ? "—" : `${r.scaleChange > 0 ? "+" : ""}${r.scaleChange}`,
            r.beyondError == null ? "No error on file" : r.beyondError ? "Yes" : "No",
          ]),
        )
      : h("p", { class: "pi-note", "data-not-comparable": "" }, last.why),
    explain({
      summary: last.levelsComparable
        ? `What changed? ${up.length ? `Higher: ${up.join(", ")}.` : ""} ${down.length ? `Lower: ${down.join(", ")}.` : ""} ${!up.length && !down.length ? "No reported level changed." : ""}`
        : "These two results cannot be compared, so no change is calculated.",
      uncertain: twoOnly
        ? "With two results this is an observed change, not a trend. Proficiency levels are not equal steps, and a change smaller than the measurement error may be noise."
        : "Changes across several comparable years are more informative than any single step; check whether the direction is consistent.",
      act: down.length ? `Gather fresh classroom evidence in ${down[0]} before drawing conclusions.` : "Keep collecting comparable evidence; plan next steps in the Instructional Planner.",
      how: h("p", {}, "Level change = later reported level minus earlier reported level, only when both use the same assessment, scale and cut-score version. Scale change is shown only on the same scale. A change is beyond measurement error when it exceeds 1.96 times the combined standard error of the two scale scores (where the report gives one)."),
    }),
  );
}
