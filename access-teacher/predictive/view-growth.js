// Domain Growth Lab: one longitudinal chart per domain and the reported overall level, each with a data
// table. Forecast points and uncertainty bands appear only for validated forecasts.
import { growthChart } from "./charts.js";
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
      "Domain Growth Lab",
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
    h(
      "div",
      { class: "pi-grid-2" },
      SERIES_KEYS.map((k) => domainBlock(ws, st, k)),
    ),
  );
}
