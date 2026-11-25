// Class + unit picker for #/formative. Classes come from this device's saved teacher classes; with none saved the
// teacher can type a class code and passcode (kept in memory only, never stored by this view).
import { h } from "../../core/dom.js";
import { GRADES, GRADE_LABEL, SEED_SUBJECT } from "../../data/taxonomy.js";
import { savedClasses } from "./api.js";

const field = (id, label, control) => h("div", { class: "st-field" }, h("label", { for: id }, label), control);
const opt = (value, text, selected) => h("option", { value, selected: selected ? "" : null }, text);

/**
 * @param {{ params: object, catalog: { seedUnits: Function }, onOpen: (sel: { cls, unitId }) => void }} ctx
 * @returns {HTMLElement}
 */
export function picker({ params, catalog, onOpen }) {
  const classes = savedClasses();
  const grade = h("select", { id: "st-fm-grade" }, [opt("", "Choose a grade"), ...GRADES.map((g) => opt(g, GRADE_LABEL[g], g === params.grade))]);
  const subject = h("select", { id: "st-fm-subject" }, [opt("", "Choose a subject"), ...Object.entries(SEED_SUBJECT).map(([k, v]) => opt(k, v, k === params.subject))]);
  const unit = h("select", { id: "st-fm-unit", disabled: "" }, opt("", "Choose a grade and subject first"));
  const status = h("p", { class: "st-meta", role: "status" });
  const klass = classes.length
    ? h("select", { id: "st-fm-class" }, classes.map((c) => opt(c.code, `${c.title || "Class"} (${c.code})`, c.code === params.code)))
    : null;
  const code = klass ? null : h("input", { id: "st-fm-code", autocomplete: "off", maxlength: "12", spellcheck: "false" });
  const pass = klass ? null : h("input", { id: "st-fm-pass", type: "password", autocomplete: "off", maxlength: "12" });

  async function loadUnits() {
    unit.replaceChildren(opt("", "Choose a grade and subject first"));
    unit.disabled = true;
    if (!grade.value || !subject.value) return;
    status.textContent = "Loading units";
    try {
      const units = await catalog.seedUnits(grade.value, subject.value);
      unit.replaceChildren(opt("", "Choose a unit"), ...units.map((u) => opt(u.id, `Unit ${u.unit_number}: ${u.unit_title}`, u.id === params.unit)));
      unit.disabled = false;
      status.textContent = "";
    } catch {
      status.textContent = "The unit list did not load. Check your connection and choose the grade again.";
    }
  }
  grade.addEventListener("change", loadUnits);
  subject.addEventListener("change", loadUnits);
  const open = h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Open exit ticket");
  const form = h("form", { class: "st-fm-picker", novalidate: "" },
    klass
      ? field("st-fm-class", "Class", klass)
      : [field("st-fm-code", "Class code", code), field("st-fm-pass", "Class passcode (teacher)", pass)],
    field("st-fm-grade", "Grade", grade), field("st-fm-subject", "Subject", subject), field("st-fm-unit", "Unit", unit),
    h("p", { class: "st-row" }, open), status);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const chosen = klass ? classes.find((c) => c.code === klass.value) : { code: code.value.trim().toUpperCase(), passcode: pass.value.trim().toUpperCase() };
    if (!chosen?.code || !chosen.passcode) return void (status.textContent = "Enter the class code and passcode.");
    if (!unit.value) return void (status.textContent = "Choose a unit.");
    onOpen({ cls: chosen, unitId: unit.value });
  });
  if (params.grade && params.subject) loadUnits();
  return form;
}
