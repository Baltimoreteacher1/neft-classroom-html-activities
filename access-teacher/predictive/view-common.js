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
