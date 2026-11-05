// Forecast Overview: per student, each domain and the reported overall level.
import { adv, fmt1, h, pct, table, tip } from "./dom.js";
import { SERIES_KEYS } from "./forecast.js";
import { chip, emptyState, heading, studentPicker } from "./view-common.js";

const history = (series) =>
  series.length
    ? series.map((p) => `${p.year}: ${p.level.toFixed(1)}`).join(" · ")
    : "None on file";

function trendText(trend) {
  if (!trend.reports) return "No reports yet.";
  if (trend.reports === 1) return `One report (${trend.last.year}); no trend yet.`;
  const last = trend.steps.at(-1);
  const parts = [];
  if (last)
    parts.push(
      `Last change ${last.change > 0 ? "+" : ""}${last.change.toFixed(1)} (${last.from} to ${last.to})${last.crossesReset ? ", across the scale reset: not comparable" : ""}.`,
    );
  if (trend.meanChange != null)
    parts.push(
      `Average same-era change ${trend.meanChange > 0 ? "+" : ""}${trend.meanChange.toFixed(2)} per year.`,
    );
  return parts.join(" ") || "Reports are not in consecutive years.";
}

function classSummary(ws) {
  const counts = { validated: 0, experimental: 0, insufficient: 0 };
  for (const s of ws.students) for (const k of SERIES_KEYS) counts[ws.forecast(s, k).status]++;
  return h(
    "ul",
    { class: "pi-stats", "aria-label": "Forecast status across the class" },
    Object.entries(counts).map(([k, v]) =>
      h("li", {}, chip(k), h("strong", {}, String(v)), " student-series"),
    ),
  );
}

export function renderOverview(ws) {
  if (!ws.students.length) return emptyState(ws);
  const st = ws.student();
  const rows = SERIES_KEYS.map((k) => {
    const t = ws.state.targets[k] ?? null;
    const f = ws.forecast(st, k, t);
    const n = f.numbers;
    return { k, f, n, t };
  });
  const body = rows.map(({ k, f, n, t }) =>
    h(
      "tr",
      n
        ? {
            "data-pi-row": k,
            "data-expected": n.expected,
            "data-lo": n.interval80[0],
            "data-hi": n.interval80[1],
          }
        : { "data-pi-row": k },
      h("th", { scope: "row" }, k === "Overall" ? "Overall (reported)" : k),
      h("td", {}, history(f.series)),
      h("td", {}, chip(f.status)),
      h("td", {}, f.targetYear),
      h(
        "td",
        {},
        n ? h("strong", { "data-pi-number": "expected" }, fmt1(n.expected)) : "No number",
      ),
      h(
        "td",
        {},
        n
          ? h(
              "span",
              { "data-pi-number": "interval" },
              `${fmt1(n.interval80[0])} to ${fmt1(n.interval80[1])}`,
            )
          : "—",
      ),
      h(
        "td",
        {},
        n && t != null
          ? h("span", { "data-pi-number": "probability" }, pct(n.probabilityAtLeastTarget))
          : t == null
            ? "Set a target"
            : "—",
      ),
      h(
        "td",
        {},
        n ? `Model: ${f.model.id}` : f.plain,
        h("br"),
        h("span", { class: "fine" }, trendText(f.trend)),
      ),
    ),
  );
  const tableNode = h(
    "div",
    {
      class: "pi-table-wrap",
      role: "region",
      "aria-label": `Forecasts for ${st.name}`,
      tabindex: "0",
    },
    h(
      "table",
      { class: "pi-table", id: "piOverviewTable" },
      h("caption", {}, `Official history and forecast status for ${st.name}`),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          [
            "Series",
            "Official history",
            "Status",
            "Forecast year",
            "Expected level",
            "80% interval",
            "Chance of target",
            "Why / trend",
          ].map((x) => h("th", { scope: "col" }, x)),
        ),
      ),
      h("tbody", {}, body),
    ),
  );
  const details = adv(
    heading(3, "Model details"),
    table(
      "Model details per series",
      [
        "Series",
        "Era",
        "Model",
        "Trained on",
        "Held-out MAE",
        "Held-out 80% coverage",
        "Engine reasons",
      ],
      rows.map(({ k, f }) => [
        k,
        f.era,
        f.model?.id || "none",
        f.model ? String(f.model.trainedOn) : "—",
        f.model ? f.model.testMae.toFixed(2) : "—",
        f.model ? pct(f.model.testCoverage) : "—",
        f.reasons.join(" ") || "—",
      ]),
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn small",
        on: {
          click: () => {
            const at = new Date().toISOString().slice(0, 10);
            ws.state.snapshots = {};
            for (const s of ws.students)
              for (const k of SERIES_KEYS) {
                const f = ws.forecast(s, k);
                ws.state.snapshots[`${s.id}|${k}`] = {
                  status: f.status,
                  expected: f.numbers?.expected ?? null,
                  reports: f.series.length,
                  model: f.model?.id || null,
                  at,
                };
              }
            ws.save();
            ws.announce(
              "Forecast snapshot saved. The Research Analyst can now explain later changes.",
            );
          },
        },
      },
      "Save forecast snapshot",
    ),
  );
  return h(
    "div",
    {},
    heading(
      2,
      "Forecast Overview",
      tip(
        "Forecast",
        "A forecast is the level a model expects next year, with a range it is 80% likely to fall in. It is shown only when the model was tested on students it never saw and passed.",
      ),
    ),
    h(
      "p",
      { class: "lead" },
      "Official ACCESS history and forecast status for each domain and the reported overall level. The overall uses the level printed on the score report; domain levels are never averaged.",
    ),
    classSummary(ws),
    studentPicker(ws),
    tableNode,
    h(
      "p",
      { class: "fine" },
      "Chance of target uses the teacher targets set in the ACCESS Probability Center. A teacher target is a planning goal, not an official criterion.",
    ),
    details,
  );
}
