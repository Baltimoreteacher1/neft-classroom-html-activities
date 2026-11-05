// Intervention Simulator: an explicitly hypothetical sensitivity analysis. The teacher enters every
// assumption, including the effect size; the page shows the arithmetic and compares scenarios with the
// baseline. It is not a forecast and not a causal claim.
import { OFFICIAL_DOMAINS } from "../../access-practice-lab/src/lang/official-scores.js";
import { barChart } from "./charts.js";
import { clear, h, table, tip } from "./dom.js";
import { seriesFor } from "./forecast.js";
import { readAssumptions, sensitivity, simulate } from "./simulator.js";
import { chip, emptyState, heading, studentPicker } from "./view-common.js";

const STRATEGIES = [
  "Structured partner talk",
  "Guided writing with fading frames",
  "Small-group reading with text discussion",
  "Listening with retell",
  "Vocabulary in context routine",
];
const FIELDS = [
  ["sessionsPerWeek", "Sessions per week", "3"],
  ["minutesPerSession", "Minutes per session", "20"],
  ["weeks", "Weeks (horizon)", "12"],
  ["participation", "Participation (%)", "85"],
  ["effectPer10h", "Assumed effect (levels per 10 delivered hours)", "0.05"],
];
const DEFAULT = () => ({
  domain: "Speaking",
  scenarios: ["A", "B"].map((name, i) => ({
    name,
    strategy: STRATEGIES[i],
    sessionsPerWeek: i ? 5 : 3,
    minutesPerSession: 20,
    weeks: 12,
    participation: 85,
    effectPer10h: 0.05,
  })),
});

function scenarioFieldset(sc, idx) {
  return h(
    "fieldset",
    { class: "pi-fieldset" },
    h("legend", {}, `Scenario ${sc.name}`),
    h(
      "div",
      { class: "pi-field" },
      h("label", { for: `pi-s${idx}-strategy` }, "Strategy"),
      h(
        "select",
        { id: `pi-s${idx}-strategy`, "data-k": "strategy" },
        STRATEGIES.map((s) => h("option", { selected: s === sc.strategy }, s)),
      ),
    ),
    h(
      "div",
      { class: "pi-row" },
      FIELDS.map(([k, label]) =>
        h(
          "div",
          { class: "pi-field pi-field-sm" },
          h("label", { for: `pi-s${idx}-${k}` }, label),
          h("input", {
            id: `pi-s${idx}-${k}`,
            type: "text",
            inputmode: "decimal",
            value: sc[k],
            "data-k": k,
            autocomplete: "off",
          }),
        ),
      ),
    ),
  );
}

export function renderSimulator(ws) {
  if (!ws.students.length) return emptyState(ws);
  const cfg = ws.state.scenarios || DEFAULT();
  const st = ws.student();
  const out = h("div", { class: "pi-sim-out", "aria-live": "polite" });
  const domainSel = h(
    "select",
    { id: "pi-sim-domain" },
    OFFICIAL_DOMAINS.map((d) => h("option", { value: d, selected: d === cfg.domain }, d)),
  );
  const form = h(
    "form",
    {
      class: "pi-form",
      on: {
        submit: (e) => {
          e.preventDefault();
          cfg.domain = domainSel.value;
          cfg.scenarios = [...form.querySelectorAll("fieldset")].map((fs, i) => {
            const sc = { name: cfg.scenarios[i].name };
            for (const el of fs.querySelectorAll("[data-k]")) sc[el.dataset.k] = el.value;
            return sc;
          });
          ws.state.scenarios = cfg;
          ws.save();
          run();
        },
      },
    },
    h("div", { class: "pi-field" }, h("label", { for: "pi-sim-domain" }, "Domain"), domainSel),
    cfg.scenarios.map(scenarioFieldset),
    h("button", { type: "submit", class: "btn btn-primary" }, "Run the arithmetic"),
  );

  function run() {
    clear(out);
    const last = seriesFor(st, cfg.domain).at(-1);
    if (!last) {
      out.append(
        h(
          "p",
          { class: "pi-note" },
          `${st.name} has no official ${cfg.domain} level on file, so there is no baseline to start from.`,
        ),
      );
      return;
    }
    const results = [];
    for (const sc of cfg.scenarios) {
      const a = readAssumptions({ ...sc, participation: Number(sc.participation) / 100 });
      if (!a.ok) {
        out.append(
          h(
            "p",
            { class: "pi-error", role: "alert" },
            `Scenario ${sc.name}: ${a.errors.join(" ")}`,
          ),
        );
        return;
      }
      results.push({ sc, a: a.value, r: simulate(last.level, a.value) });
    }
    out.append(
      h(
        "p",
        {},
        chip("hypothetical"),
        ` Baseline: last reported ${cfg.domain} level ${last.level.toFixed(1)} (${last.year}), held constant. No growth is assumed for the baseline.`,
      ),
      barChart({
        title: `Hypothetical ${cfg.domain} level: baseline and scenarios`,
        max: 6,
        format: (v) => v.toFixed(1),
        bars: [
          { label: "Baseline", value: last.level },
          ...results.map(({ sc, r }) => ({
            label: `Scenario ${sc.name}`,
            value: r.level,
            kind: "scenario",
          })),
        ],
      }),
      ...results.map(({ sc, r }) =>
        h(
          "div",
          { class: "pi-card", "data-scenario": sc.name },
          h("h4", {}, `Scenario ${sc.name}: ${sc.strategy}`),
          h(
            "ol",
            { class: "pi-steps" },
            r.steps.map((x) => h("li", {}, x)),
          ),
        ),
      ),
      table(
        "Sensitivity: the same scenarios at half, the assumed, and one-and-a-half times the assumed effect",
        ["Scenario", "Effect x0.5", "Effect x1", "Effect x1.5"],
        results.map(({ sc, a }) => [
          `Scenario ${sc.name}`,
          ...sensitivity(last.level, a).map((x) => x.level.toFixed(1)),
        ]),
      ),
    );
  }
  run();
  return h(
    "div",
    {},
    heading(
      2,
      "Intervention Simulator",
      tip(
        "Sensitivity analysis",
        "It answers 'what if my assumptions were true?' by doing arithmetic on numbers you enter. It does not know whether an intervention works.",
      ),
    ),
    h(
      "div",
      { class: "pi-banner is-warn", role: "note" },
      h("strong", {}, "Hypothetical. "),
      "There is no credible effect-size evidence for these interventions on the ACCESS scale, so you enter the assumed effect. The result is a sensitivity analysis of your assumptions: not a prediction, not a causal claim, and not a promise of growth.",
    ),
    studentPicker(ws),
    form,
    out,
  );
}
