// Forecasts & Scenarios. Three kinds of number are kept visibly apart: ACTUAL reported results, VALIDATED
// statistical predictions (shown only when the engine's held-out validation passes), and HYPOTHETICAL
// scenarios the teacher builds. Also the MODEL-to-ACCESS workspace and the Validation Center.
import { h, table } from "./dom.js";
import { CONCORDANCES, concordanceFor } from "./concordance.js";
import { fmt1 } from "./dom.js";
import { recordsOf } from "./records.js";
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

function concordance(ws) {
  const st = ws.student();
  const recs = recordsOf(st);
  const models = recs.filter((r) => r.assessmentType.startsWith("MODEL"));
  const access = recs.filter((r) => r.assessmentType === "ACCESS").at(-1);
  const model = models.at(-1);
  const c = concordanceFor(model, { targetYear: model?.academicYear });
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    heading(2, "MODEL to ACCESS"),
    h(
      "p",
      { class: "pi-note", role: "note", "data-concordance": c.status },
      c.reason,
      " ",
      h(
        "a",
        { href: c.source, rel: "noopener", target: "_blank" },
        "WIDA's MODEL and ACCESS concordance table",
      ),
    ),
    model && access
      ? h(
          "div",
          {},
          table(
            "Same student, two different assessments (descriptive only)",
            ["Domain", assessmentLabel(model, ASSESSMENTS), assessmentLabel(access, ASSESSMENTS)],
            [...DOMAINS, "Overall"].map((d) => [
              d,
              fmt1(d === "Overall" ? model.composites.Overall.level : model.domains[d].level),
              fmt1(d === "Overall" ? access.composites.Overall.level : access.domains[d].level),
            ]),
          ),
          explain({
            summary:
              "MODEL is an interim assessment with its own scale and administration. Side-by-side levels help you see whether the domain profile looks similar; they are not a conversion.",
            uncertain: `WIDA's concordance applies to specific versions and its 2025-26 window. Mappings made before the ${SCALE_RESET_YEAR} ACCESS revision are not applied to the reset scale.`,
          }),
        )
      : h(
          "p",
          { class: "fine" },
          models.length
            ? "No ACCESS result is on file to set beside the MODEL result."
            : "No MODEL result is on file for this student. Add one with Import data (MODEL Online or MODEL Paper).",
        ),
    heading(3, "Mappings the studio knows about"),
    table(
      "Concordance registry",
      ["Mapping", "MODEL forms", "ACCESS version", "Score", "Valid for", "Table entered"],
      CONCORDANCES.map((x) => [
        x.id,
        x.model.map((m) => ASSESSMENTS[m].short).join(", "),
        x.access,
        x.scoreType,
        x.validFor.join(", "),
        x.tableLoaded ? "Yes" : "No",
      ]),
    ),
  );
}

export function renderForecasts(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.forecasts || "forecast";
  const views = {
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
