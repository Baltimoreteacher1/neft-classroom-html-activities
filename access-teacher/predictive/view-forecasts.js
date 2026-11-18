// Forecasts & Scenarios. Three kinds of number are kept visibly apart: ACTUAL reported results, VALIDATED
// statistical predictions (shown only when the engine's held-out validation passes), and HYPOTHETICAL
// scenarios the teacher builds. Also the MODEL-to-ACCESS workspace and the Validation Center.
import { h, s, table } from "./dom.js";
import { ANCHOR_LEVELS, CONCORDANCES, concordanceFor, MODEL_ACCESS_TABLE } from "./concordance.js";
import { fmt1 } from "./dom.js";
import { outlookFor } from "./outlook.js";
import { recordsOf } from "./records.js";
import { rangeRows } from "./charts2.js";
import { ASSESSMENTS, COMPOSITE_INFO, COMPOSITES, DOMAINS, SCALE_RESET_YEAR } from "./rules.js";
import { applyScenario, SCENARIO_LIMITS } from "./scenario.js";
import {
  assessmentLabel,
  emptyState,
  explain,
  heading,
  studentPicker,
  subnav,
} from "./view-common.js";
import { renderForecastTable } from "./view-forecast-table.js";
import { renderProbability } from "./view-probability.js";
import { renderValidation } from "./view-validation.js";

const KIND = {
  actual: ["Actual reported result", "From the score report."],
  validated: [
    "Validated prediction",
    "From a model that passed held-out testing. A range, not a promise.",
  ],
  hypothetical: ["Hypothetical scenario", "Built from changes you chose. Not a prediction."],
};
export const kindBadge = (k) =>
  h(
    "span",
    { class: `pi-kind is-${k}`, "data-kind": k },
    h("strong", {}, KIND[k][0]),
    ` · ${KIND[k][1]}`,
  );

function scenarios(ws) {
  const st = ws.student();
  const rec =
    recordsOf(st)
      .filter((r) => !r.assessmentType.startsWith("MODEL"))
      .at(-1) || recordsOf(st).at(-1);
  if (!rec)
    return h(
      "div",
      {},
      studentPicker(ws),
      h(
        "p",
        { class: "pi-note" },
        "A scenario starts from a reported result. None is on file for this student.",
      ),
    );
  const key = st.id;
  const all = (ws.state.scenarios ||= {});
  const cur = (all[key] ||= { changes: {}, saved: [] });
  const res = applyScenario(rec, cur.changes);
  const slider = (d, measure) => {
    const lim = SCENARIO_LIMITS[measure];
    const base = measure === "level" ? rec.domains[d].level : rec.domains[d].scale;
    if (base == null)
      return h("span", { class: "fine" }, measure === "level" ? "No level" : "No scale score");
    const id = `piSc-${d}-${measure}`;
    const val = cur.changes[d]?.[measure] ?? 0;
    return h(
      "label",
      { class: "pi-slider", for: id },
      h(
        "span",
        {},
        `${d} ${measure === "level" ? "level" : "scale"} change: `,
        h(
          "output",
          { for: id },
          `${val > 0 ? "+" : ""}${measure === "level" ? Number(val).toFixed(1) : val}`,
        ),
      ),
      h("input", {
        id,
        type: "range",
        min: -lim,
        max: lim,
        step: measure === "level" ? 0.1 : 1,
        value: val,
        "data-scenario": `${d}:${measure}`,
        on: {
          change: (e) => {
            cur.changes[d] = { ...(cur.changes[d] || {}), [measure]: Number(e.target.value) };
            ws.save();
            ws.rerender();
            document.getElementById(id)?.focus();
          },
        },
      }),
    );
  };
  const nameInput = h("input", {
    type: "text",
    maxlength: "60",
    placeholder: "Scenario name",
    "aria-label": "Scenario name",
  });
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    kindBadge("hypothetical"),
    h(
      "p",
      { class: "fine" },
      `Starting point: ${assessmentLabel(rec, ASSESSMENTS)} (actual reported result).`,
    ),
    h(
      "div",
      { class: "pi-sliders" },
      DOMAINS.map((d) =>
        h("div", { class: "pi-card" }, h("h4", {}, d), slider(d, "level"), slider(d, "scale")),
      ),
    ),
    table(
      "Hypothetical domain profile compared with the actual result",
      [
        "Domain",
        "Actual level",
        "Hypothetical level",
        "Difference",
        "Actual scale",
        "Hypothetical scale",
      ],
      DOMAINS.map((d) => {
        const x = res.domains[d];
        return [
          d,
          fmt1(x.baseLevel),
          fmt1(x.level),
          x.levelChange == null
            ? "—"
            : `${x.levelChange > 0 ? "+" : ""}${x.levelChange.toFixed(1)}`,
          x.baseScale ?? "—",
          x.scale ?? "—",
        ];
      }),
    ),
    heading(3, "Illustrative composite impact"),
    table(
      "Composite scale scores (illustrative)",
      ["Composite", "From actual scale scores", "With hypothetical changes", "Difference"],
      COMPOSITES.map((c) => {
        const x = res.composites[c];
        if (x.status !== "illustrative")
          return [
            COMPOSITE_INFO[c].label,
            x.status === "no-rule"
              ? "No verified weights for this scale version"
              : "Needs every domain scale score",
            "—",
            "—",
          ];
        return [
          COMPOSITE_INFO[c].label,
          String(x.base),
          String(x.scale),
          `${x.change > 0 ? "+" : ""}${x.change}`,
        ];
      }),
    ),
    (() => {
      const overall = res.composites.Overall;
      return h(
        "section",
        { class: "pi-card pi-scenario-overall", "aria-labelledby": "piScenarioOverallTitle" },
        h("h3", { id: "piScenarioOverallTitle" }, "Overall score with these changes"),
        overall.status === "illustrative"
          ? h(
              "p",
              { class: "pi-scenario-total", "data-scenario-overall": "illustrative" },
              h("strong", {}, `${overall.base} → ${overall.scale}`),
              ` scale-score points (${overall.change > 0 ? "+" : ""}${overall.change})`,
            )
          : h(
              "p",
              { class: "pi-scenario-total", "data-scenario-overall": overall.status },
              overall.status === "no-rule"
                ? "A verified Overall scale-score calculation is not available for this assessment scale."
                : "Enter all four reported domain scale scores to calculate the illustrative Overall scale score.",
            ),
        h(
          "p",
          { class: "fine" },
          "This is the weighted Overall composite scale score only when the assessment scale has verified weights. It is arithmetic on the values you chose, not a forecast. An Overall proficiency level cannot be derived here from domain levels or this scale score; WIDA's official score report remains the source for that level.",
        ),
      );
    })(),
    explain({
      summary: `This is arithmetic on changes you chose. It shows how the composite weights respond (Reading and Writing weigh most in Overall); it does not say these changes will happen, or that any amount of instruction causes them. Priorities in this scenario: ${res.priorities.join(" and ") || "none"}.`,
      how: h(
        "p",
        {},
        `Levels move by the chosen amount and stay within 1.0-6.0. Composite scale scores use WIDA's published weights for the ${rec.scaleVersion === "access-2016-scale" ? "2016 ACCESS scale" : "scale on file"}; no composite proficiency level is calculated, because WIDA converts scale scores to levels with cut tables the studio does not hold.`,
      ),
    }),
    h(
      "div",
      { class: "pi-row" },
      h(
        "button",
        {
          type: "button",
          class: "btn small ghost",
          "data-scenario-reset": "",
          on: { click: () => ((cur.changes = {}), ws.save(), ws.rerender()) },
        },
        "Reset",
      ),
      nameInput,
      h(
        "button",
        {
          type: "button",
          class: "btn small",
          on: {
            click: () => {
              cur.saved = [
                ...cur.saved,
                {
                  name: nameInput.value.trim() || `Scenario ${cur.saved.length + 1}`,
                  changes: structuredClone(cur.changes),
                  at: new Date().toISOString(),
                },
              ].slice(-6);
              ws.save();
              ws.announce("Scenario saved.");
              ws.rerender();
            },
          },
        },
        "Save scenario",
      ),
    ),
    cur.saved.length
      ? table(
          "Saved scenarios compared (hypothetical)",
          ["Scenario", ...DOMAINS, "Overall (illustrative scale)"],
          cur.saved.map((sv) => {
            const r = applyScenario(rec, sv.changes);
            return [
              sv.name,
              ...DOMAINS.map((d) => fmt1(r.domains[d].level)),
              r.composites.Overall.status === "illustrative"
                ? String(r.composites.Overall.scale)
                : "—",
            ];
          }),
        )
      : null,
  );
}

/** A 1-6 bar with the predicted range shaded and the numbers printed. */
function rangeBar(lo, hi) {
  const x = (v) => 20 + ((v - 1) / 5) * 600;
  return s(
    "svg",
    { viewBox: "0 0 640 70", role: "img", class: "pi-chart pi-rangebar", "aria-label": `Predicted ACCESS Overall level about ${lo.toFixed(1)} to ${hi.toFixed(1)} on a 1 to 6 scale.` },
    s("rect", { x: 20, y: 18, width: 600, height: 18, rx: 9, class: "pi-indep-track" }),
    s("rect", { x: x(lo), y: 18, width: Math.max(6, x(hi) - x(lo)), height: 18, rx: 9, class: "pi-range-fill" }),
    ...[1, 2, 3, 4, 5, 6].map((v) => s("text", { x: x(v), y: 58, "text-anchor": "middle", class: "pi-axis" }, `${v}`)),
    s("text", { x: (x(lo) + x(hi)) / 2, y: 12, "text-anchor": "middle", class: "pi-axis pi-axis-strong" }, `${lo.toFixed(1)} to ${hi.toFixed(1)}`),
  );
}

function concordance(ws) {
  const st = ws.student();
  const recs = recordsOf(st);
  const models = recs.filter((r) => r.assessmentType.startsWith("MODEL"));
  const access = recs.filter((r) => r.assessmentType === "ACCESS").at(-1);
  const model = models.at(-1);
  const c = concordanceFor(model);
  const grade = Number(model?.grade);
  const gradeRows = MODEL_ACCESS_TABLE[grade];
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    heading(2, "MODEL to ACCESS"),
    model ? h("p", { class: "fine" }, `Using ${assessmentLabel(model, ASSESSMENTS)}${model.composites.Overall.scale != null ? ` · Overall scale score ${model.composites.Overall.scale}` : ""}.`) : null,
    c.status === "available"
      ? h(
          "section",
          { class: "pi-card", "data-concordance": "available" },
          kindBadge("validated"),
          h("p", { class: "pi-insight-big" }, `Likely ACCESS Overall: ${c.estimate.range.lo.toFixed(1)} to ${c.estimate.range.hi.toFixed(1)}`),
          rangeBar(c.estimate.range.lo, c.estimate.range.hi),
          h("p", {}, c.reason),
          h("ul", {}, c.entry.caveats.map((x) => h("li", {}, x))),
        )
      : h("p", { class: "pi-note", role: "note", "data-concordance": "unavailable" }, model ? c.reason : "No MODEL result is on file for this student. Add one with Import scores (MODEL Online)."),
    model && access
      ? explain({
          summary: "Side by side, as reported. MODEL and ACCESS are different tests on different scales, so this shows whether the profiles look alike; it is not a conversion.",
          evidence: table(
            "Same student, two different assessments",
            ["Domain", assessmentLabel(model, ASSESSMENTS), assessmentLabel(access, ASSESSMENTS)],
            [...DOMAINS, "Overall"].map((d) => [d, fmt1(d === "Overall" ? model.composites.Overall.level : model.domains[d].level), fmt1(d === "Overall" ? access.composites.Overall.level : access.domains[d].level)]),
          ),
        })
      : null,
    h(
      "details",
      { class: "pi-more pi-card" },
      h("summary", {}, gradeRows ? `WIDA's table for grade ${grade}` : "WIDA's concordance table"),
      gradeRows
        ? table(`MODEL Online Overall scale score to predicted ACCESS Overall level, grade ${grade}`, ["MODEL Online scale score", "Predicted ACCESS level range", "Anchor level"], gradeRows.map((r, i) => [String(r[0]), `${r[1].toFixed(1)} to ${r[2].toFixed(1)}`, ANCHOR_LEVELS[i].toFixed(1)]))
        : null,
      h("p", { class: "fine" }, `${CONCORDANCES[0].research}. Valid for: ${CONCORDANCES[0].validFor}. `, h("a", { href: CONCORDANCES[0].pdf, rel: "noopener", target: "_blank" }, "Open WIDA's table (PDF)")),
    ),
  );
}

/** Class outlook: every student's current level and any honest estimate, in one chart and one table. */
function classOutlook(ws) {
  const rows = ws.students.map((st) => {
    const o = outlookFor(ws, st);
    const now = o.access?.composites.Overall.level ?? null;
    if (o.forecast) return { name: st.name, now, lo: o.forecast.numbers.interval80[0], hi: o.forecast.numbers.interval80[1], kind: "forecast", note: `Validated forecast for ${o.forecast.targetYear}`, o };
    if (o.concordance) return { name: st.name, now, lo: o.concordance.estimate.range.lo, hi: o.concordance.estimate.range.hi, kind: "concordance", note: "WIDA MODEL estimate", o };
    return { name: st.name, now, lo: null, hi: null, kind: "none", note: o.math ? (o.math.reached ? "Goal met" : `Goal math: +${o.math.perYear.toFixed(2)} a year to ${o.goal.toFixed(1)}`) : "No ACCESS result", o };
  });
  return h(
    "div",
    { class: "pi-stack" },
    h("section", { class: "pi-card" }, h("h3", {}, "Where each student is, and where they are likely headed"), h("div", { class: "pi-scroll" }, rangeRows({ title: "Current Overall level (dot) and likely range (bar)", rows })), h("p", { class: "fine" }, "Dot: latest reported Overall. Solid bar: validated forecast range. Light bar: WIDA's MODEL-to-ACCESS estimate. No bar: no honest estimate yet; goal math is in the table.")),
    table("Class outlook", ["Student", "Overall now", "Likely range", "Source"], rows.map((r) => [r.name, r.now == null ? "—" : r.now.toFixed(1), r.lo == null ? "—" : `${r.lo.toFixed(1)} to ${r.hi.toFixed(1)}`, r.note])),
  );
}

export function renderForecasts(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.forecasts || "outlook";
  const views = {
    outlook: () => classOutlook(ws),
    forecast: () => h("div", {}, kindBadge("validated"), renderForecastTable(ws)),
    targets: () => renderProbability(ws),
    scenarios: () => scenarios(ws),
    concordance: () => concordance(ws),
    validation: () => renderValidation(ws),
  };
  return h(
    "div",
    {},
    subnav(
      ws,
      "forecasts",
      [
        ["outlook", "Class outlook"],
        ["forecast", "Forecast ranges"],
        ["targets", "Targets"],
        ["scenarios", "Scenario Studio"],
        ["concordance", "MODEL to ACCESS"],
        ["validation", "Model quality"],
      ],
      view,
    ),
    views[view](),
  );
}
