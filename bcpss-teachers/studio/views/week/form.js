// "My Week" form: unit picker (grade, subject, unit), band counts, block length, days, start date, pacing calendar.
import { h } from "../../core/dom.js";
import { BAND_KEYS, BAND_LABELS, BLOCK_MINUTES, DAYS_MAX, DAYS_MIN } from "../../../../shared/planner/constants.js";
import { DEFAULT_PARAMS, parseParams } from "../../../../shared/planner/params.js";
import { facetsOf, GRADE_OPTIONS, SUBJECT_OPTIONS } from "./model.js";

const field = (id, label, control, hint) =>
  h("div", { class: "st-field" }, h("label", { for: id }, label), control, hint ? h("p", { class: "st-hint", id: `${id}-hint` }, hint) : null);

const select = (id, options, value, extra = {}) =>
  h("select", { id, name: id, ...extra }, options.map(([v, label]) => h("option", { value: v, selected: String(v) === String(value) }, label)));

const num = (id, value, max) => h("input", { id, name: id, type: "number", min: "0", max: String(max), step: "1", inputmode: "numeric", value: String(value) });

/**
 * buildForm({ catalog, params, onSubmit }) -> { el, read, errorsEl }
 * read() returns { ok, params, errors } from the controls (same parser the server uses).
 */
export function buildForm({ catalog, initial, onSubmit }) {
  const start = initial.unit ? initial : { ...DEFAULT_PARAMS, unit: "" };
  const facets = facetsOf(start.unit) || { grade: "6", subject: "math" };
  const grade = select("wk-grade", GRADE_OPTIONS.map((g) => [g, g === "K" ? "Kindergarten" : `Grade ${g}`]), facets.grade);
  const subject = select("wk-subject", SUBJECT_OPTIONS.map((s) => [s.id, s.label]), facets.subject);
  const unit = select("wk-unit", [["", "Loading units"]], "", { required: "" });
  const bands = Object.fromEntries(BAND_KEYS.map((k) => [k, num(`wk-${k}`, start.bands[k], 40)]));
  const block = select("wk-block", BLOCK_MINUTES.map((m) => [m, `${m} minutes`]), start.block);
  const days = select("wk-days", Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, i) => [DAYS_MIN + i, `${DAYS_MIN + i} ${DAYS_MIN + i === 1 ? "day" : "days"}`]), start.days);
  const date = h("input", { id: "wk-start", name: "wk-start", type: "date", value: start.start || "" });
  const cal = h("input", { id: "wk-cal", name: "wk-cal", type: "checkbox", checked: start.cal });
  const seed = num("wk-seed", start.seed, 999999);
  const errorsEl = h("p", { class: "st-error", id: "wk-errors", role: "alert" });

  async function loadUnits() {
    const sub = SUBJECT_OPTIONS.find((s) => s.id === subject.value);
    unit.replaceChildren(h("option", { value: "" }, "Loading units"));
    let list = [];
    try {
      list = await catalog.seedUnits(grade.value, sub.api);
    } catch {
      errorsEl.textContent = "The unit list did not load. Check your connection and change the grade to try again.";
    }
    unit.replaceChildren(
      h("option", { value: "" }, list.length ? "Choose a unit" : "No units for this grade and subject"),
      ...list.map((u) => h("option", { value: u.id, selected: u.id === start.unit }, `Unit ${u.unit_number}: ${u.unit_title}`)),
    );
  }
  grade.addEventListener("change", loadUnits);
  subject.addEventListener("change", loadUnits);

  const read = () =>
    parseParams((k) => {
      const map = { unit: unit.value, b12: bands["1_2"].value, b34: bands["3_4"].value, b56: bands["5_6"].value, block: block.value, days: days.value, seed: seed.value, start: date.value, cal: cal.checked ? "1" : "0" };
      return map[k];
    });

  const form = h(
    "form",
    { class: "st-wk-form", novalidate: "" },
    h("div", { class: "st-wk-grid" }, field("wk-grade", "Grade", grade), field("wk-subject", "Subject", subject), field("wk-unit", "Unit", unit)),
    h(
      "fieldset",
      { class: "st-wk-bands" },
      h("legend", {}, "Groups in your class (teacher planning only)"),
      h("p", { class: "st-hint" }, "Enter how many students are in each group. Only counts are used. Nothing about a student is stored or sent."),
      h("div", { class: "st-wk-grid" }, BAND_KEYS.map((k) => field(`wk-${k}`, BAND_LABELS[k], bands[k]))),
    ),
    h("div", { class: "st-wk-grid" }, field("wk-block", "Block length", block), field("wk-days", "Days available", days)),
    h(
      "div",
      { class: "st-wk-grid" },
      field("wk-start", "First day (optional)", date, "Needed for the calendar file."),
      h("div", { class: "st-field" }, h("label", { class: "st-wk-check" }, cal, "Use my pacing calendar"), h("p", { class: "st-hint" }, "Skips non-school days and testing days from the district pacing plan.")),
      field("wk-seed", "Variation", seed, "0 is the standard plan. Another number breaks ties differently."),
    ),
    errorsEl,
    h("p", { class: "st-row" }, h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Build my week")),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = read();
    errorsEl.textContent = res.ok ? "" : res.errors.join(" ");
    if (res.ok) onSubmit(res.params);
  });
  loadUnits();
  return { el: form, read, errorsEl };
}
