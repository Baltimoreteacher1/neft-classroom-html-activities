// Validation Center: what the engine's held-out validation found for each series and scale era, the
// model registry (implemented and not implemented), and the criteria a model must meet. With a single
// class this will usually say "insufficient data" — that is the correct answer, not a malfunction.
import { MODEL_REGISTRY, MODELS_VERSION } from "../../access-practice-lab/src/predict/models.js";
import {
  VALIDATION_CONFIG,
  VALIDATION_VERSION,
} from "../../access-practice-lab/src/predict/validate.js";
import { calibrationChart } from "./charts.js";
import { h, pct, table, tip } from "./dom.js";
import { ERAS, SERIES_KEYS } from "./forecast.js";
import { chip, heading } from "./view-common.js";

const STATUS = {
  validated: "validated",
  provisional: "experimental",
  "insufficient-data": "insufficient",
};
const meanBrier = (b) => {
  const v = Object.values(b || {});
  return v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(3) : "—";
};

function eraBlock(key, v) {
  const models = Object.entries(v.models || {});
  const shown =
    v.selected || (v.models?.persistence && !v.models.persistence.error ? "persistence" : null);
  return h(
    "article",
    { class: "pi-card", "data-era": v.era, "data-validation-status": v.status },
    h("div", { class: "pi-card-head" }, h("h4", {}, `${key}: ${v.era}`), chip(STATUS[v.status])),
    table(
      `Training coverage for ${key}, ${v.era}`,
      ["Measure", "Value"],
      [
        ["Training transitions (students)", `${v.nTrain} (${v.trainStudents})`],
        ["Held-out transitions (students)", `${v.nTest} (${v.testStudents})`],
        [
          "Time-based split",
          v.temporal
            ? `Yes: test outcomes from ${v.testYear}`
            : "No (needs two or more outcome years)",
        ],
        ["Outcome years", v.outcomeYears.join(", ") || "none"],
        ["Excluded: cross-reset transitions", String(v.excludedCrossReset)],
        ["Selected model", v.selected || "none"],
        ["Last validated", v.asOf || "—"],
      ],
    ),
    v.reasons.length
      ? h(
          "ul",
          { class: "pi-reasons" },
          v.reasons.map((r) => h("li", {}, r)),
        )
      : null,
    models.length
      ? table(
          `Held-out results against the persistence baseline (${key}, ${v.era})`,
          ["Model", "MAE", "RMSE", "80% coverage", "Brier (mean)", "Calibration error", "Passes"],
          models.map(([id, m]) =>
            m.error
              ? [id, "—", "—", "—", "—", "—", `Not fitted: ${m.error}`]
              : [
                  id,
                  m.mae.toFixed(3),
                  m.rmse.toFixed(3),
                  pct(m.coverage),
                  meanBrier(m.brier),
                  m.calibrationError.toFixed(3),
                  m.passes ? "Yes" : "No",
                ],
          ),
        )
      : null,
    shown && v.models[shown]?.calibration?.length
      ? h(
          "figure",
          { class: "pi-figure" },
          calibrationChart({
            title: `Calibration of ${shown} for ${key}, ${v.era}`,
            rows: v.models[shown].calibration,
          }),
          h(
            "figcaption",
            { class: "fine" },
            `Calibration of ${shown}: dots on the diagonal mean predicted chances matched what happened.`,
          ),
        )
      : null,
  );
}

export function renderValidation(ws) {
  const keySel = h(
    "select",
    { id: "pi-val-key" },
    SERIES_KEYS.map((k) => h("option", { value: k }, k)),
  );
  const out = h("div", { class: "pi-grid-2", "aria-live": "polite" });
  const show = () => {
    out.replaceChildren(
      ...ERAS.map((era) => eraBlock(keySel.value, ws.validations[keySel.value][era])),
    );
  };
  keySel.addEventListener("change", show);
  show();
  const C = VALIDATION_CONFIG;
  return h(
    "div",
    {},
    heading(
      2,
      "Validation Center",
      tip(
        "Validation",
        "Before any number is shown, each model is tested on students it never saw and on the most recent year. It must beat 'next year equals last year' and be honest about its uncertainty.",
      ),
    ),
    h(
      "p",
      { class: "lead" },
      ws.mode === "demo"
        ? "Synthetic cohort: this shows what a passing validation looks like. It proves the machinery works, not that it predicts real students."
        : "Your class data. With one class this usually reports insufficient data, which is the correct result: a few dozen students cannot validate a forecasting model.",
    ),
    h("div", { class: "pi-field" }, h("label", { for: "pi-val-key" }, "Series"), keySel),
    out,
    h("h3", {}, "Criteria a model must meet"),
    h(
      "ul",
      {},
      h(
        "li",
        {},
        `At least ${C.minTrain} training and ${C.minTest} held-out transitions in one scale era.`,
      ),
      h(
        "li",
        {},
        "Held-out students are never in training, and test outcomes are from the latest year (time-based split).",
      ),
      h(
        "li",
        {},
        `80% interval coverage between ${pct(C.coverageBand[0])} and ${pct(C.coverageBand[1])}; calibration error at most ${C.maxCalibrationError}.`,
      ),
      h(
        "li",
        {},
        `Any model other than persistence must cut mean absolute error by at least ${pct(C.minGainOverBaseline)}.`,
      ),
    ),
    h("h3", {}, "Model registry"),
    table(
      "Model families",
      ["Model", "Family", "Implemented", "Summary"],
      MODEL_REGISTRY.map((m) => [m.id, m.family, m.implemented ? "Yes" : "No", m.summary]),
    ),
    h(
      "p",
      { class: "fine" },
      `Engine versions: models ${MODELS_VERSION}, validation ${VALIDATION_VERSION}.`,
    ),
  );
}
