// Pieces shared by the workspace views.
import { h } from "./dom.js";
import { STATUS_WORDS } from "./forecast.js";

export const COLORS = Object.freeze({
  Listening: "#0b6e69",
  Speaking: "#9a4a0b",
  Reading: "#1d4ed8",
  Writing: "#166534",
  Overall: "#111a3b",
});

const STATUS_TIPS = {
  validated:
    "A model passed held-out testing on students it never saw, in the same scale era as the year being forecast.",
  experimental: "A model was fitted but did not pass every check. Its estimate is not shown.",
  insufficient: "There is not enough comparable past data to test a model, so no number is shown.",
  hypothetical: "Built from assumptions you entered. It is not a forecast.",
};

export const chip = (status) =>
  h(
    "span",
    { class: `pi-chip is-${status}`, title: STATUS_TIPS[status], "data-status": status },
    STATUS_WORDS[status],
  );

let pickerSeq = 0;
/** Student selector shared by the per-student views. */
export function studentPicker(ws, onChange) {
  const id = `pi-student-${++pickerSeq}`;
  return h(
    "div",
    { class: "pi-field" },
    h("label", { for: id }, "Student"),
    h(
      "select",
      {
        id,
        on: {
          change: (e) => {
            ws.selected = e.target.value;
            (onChange || ws.rerender)();
          },
        },
      },
      ws.students.map((s) => h("option", { value: s.id, selected: s.id === ws.selected }, s.name)),
    ),
  );
}

export function emptyState(ws) {
  return h(
    "div",
    { class: "pi-empty" },
    h("h2", {}, "No students yet"),
    h(
      "p",
      {},
      ws.mode === "demo"
        ? "The synthetic class could not be built."
        : "Add students in the Teacher Hub (Class evidence) or import historical ACCESS results on the Data and import tab. You can also explore the Synthetic demo.",
    ),
  );
}

/** Heading with an optional plain-language tooltip. */
export const heading = (level, text, tipNode = null) =>
  h(`h${level}`, { class: "pi-h" }, text, tipNode);

/** Three-layer explanation: teacher summary always shown; evidence and calculation fold open. */
export function explain({ summary, evidence = null, how = null, uncertain = null, act = null }) {
  return h(
    "div",
    { class: "pi-explain" },
    h("p", { class: "pi-explain-summary" }, h("strong", {}, "What does this mean? "), summary),
    uncertain ? h("p", {}, h("strong", {}, "What is uncertain? "), uncertain) : null,
    act ? h("p", {}, h("strong", {}, "What can I do? "), act) : null,
    evidence ? h("details", { class: "pi-more" }, h("summary", {}, "Show me the evidence"), evidence) : null,
    how ? h("details", { class: "pi-more" }, h("summary", {}, "How was this calculated?"), how) : null,
  );
}

/** A metric tile: label, value, a one-line note. */
export const kpi = (label, value, note = "", attrs = {}) =>
  h(
    "div",
    { class: "pi-kpi", ...attrs },
    h("span", { class: "pi-kpi-label" }, label),
    h("strong", { class: "pi-kpi-value" }, value),
    note ? h("span", { class: "pi-kpi-note" }, note) : null,
  );

const STATUS_LABEL = {
  reported: "Reported",
  calculated: "Calculated (illustrative)",
  missing: "Missing",
  "not-assessed": "Not assessed",
};
/** Score provenance chip: reported, calculated, missing or not assessed (text, not colour alone). */
export const scoreChip = (status) =>
  h("span", { class: `pi-chip is-score-${status}`, "data-score-status": status }, STATUS_LABEL[status] || status);

/** Small assessment badge: type, year and date. */
export const assessmentLabel = (rec, ASSESSMENTS) =>
  `${ASSESSMENTS[rec.assessmentType].short} · ${rec.academicYear}${rec.administrationDate ? ` · ${rec.administrationDate}` : ""}`;

/** Segmented sub-navigation inside a section; remembers the choice in workspace state. */
export function subnav(ws, key, items, current) {
  return h(
    "div",
    { class: "pi-seg pi-subnav", role: "group", "aria-label": "Section views" },
    items.map(([id, label]) =>
      h(
        "button",
        {
          type: "button",
          class: `btn small${current === id ? " is-on" : ""}`,
          "aria-pressed": String(current === id),
          "data-subnav": id,
          on: {
            click: () => {
              ws.sub[key] = id;
              ws.rerender();
            },
          },
        },
        label,
      ),
    ),
  );
}
