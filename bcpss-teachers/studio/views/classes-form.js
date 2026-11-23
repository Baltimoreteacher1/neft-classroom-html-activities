// Class profile form. Broad proficiency counts only: no names, no rosters, no student data of any kind.
import { h } from "../core/dom.js";
import { DOMAIN_TIER_CHOICES, blankProfile } from "../core/classes.js";
import { DOMAINS, GRADES, GRADE_LABEL, KLUS, SUBJECTS, TIERS } from "../data/taxonomy.js";

const tierName = (t) => (t === "mixed" ? "Mixed" : TIERS.find((x) => x.id === t).label);

function field(id, label, control, { hint, error } = {}) {
  const described = [hint && `${id}-h`, error && `${id}-e`].filter(Boolean).join(" ");
  if (described) control.setAttribute("aria-describedby", described);
  if (error) control.setAttribute("aria-invalid", "true");
  return h("div", { class: "st-field" }, h("label", { for: id }, label), control, hint ? h("p", { class: "st-hint", id: `${id}-h` }, hint) : null, error ? h("p", { class: "st-error", id: `${id}-e` }, error) : null);
}

const select = (id, name, options, value, blank) =>
  h("select", { id, name }, blank ? h("option", { value: "" }, blank) : null, options.map(([v, t]) => h("option", { value: v, selected: v === value }, t)));

function checks(name, legend, values, chosen) {
  return h("fieldset", {}, h("legend", { class: "st-legend" }, legend), h("div", { class: "st-checks" }, values.map((v) => h("label", {}, h("input", { type: "checkbox", name, value: v, checked: chosen.includes(v) }), v))));
}

export function readForm(form, base) {
  const f = new FormData(form);
  return {
    ...base,
    nickname: f.get("nickname"),
    grade: f.get("grade"),
    subject: f.get("subject"),
    curriculum: f.get("curriculum"),
    unit: f.get("unit"),
    proficiencyMode: f.get("mode"),
    proficiency: Object.fromEntries(TIERS.map((t) => [t.id, f.get(`prof-${t.id}`)])),
    domainPriorities: f.getAll("domainPriorities"),
    domainTiers: Object.fromEntries(DOMAINS.map((d) => [d, f.get(`tier-${d}`)])),
    klus: f.getAll("klus"),
    goals: f.get("goals"),
  };
}

/** Builds the form. onSubmit(profile) must return { ok, errors } (see saveClass). */
export function classForm({ cls = blankProfile(), errors = {}, onSubmit, onCancel }) {
  const mode = cls.proficiencyMode;
  const form = h("form", { class: "st-form", novalidate: true, "aria-label": cls.id ? "Edit class profile" : "New class profile" });
  const summary = Object.keys(errors).length
    ? h("div", { class: "st-notice", role: "alert", id: "st-form-errors" }, "Please fix: ", Object.values(errors).join(" "))
    : null;
  form.append(
    h("p", { class: "st-privacy" }, h("strong", {}, "No student names. "), "A class profile holds a nickname and broad counts only. Do not enter student names, IDs or a roster anywhere in this form."),
    summary,
    field("cf-nick", "Class nickname", h("input", { id: "cf-nick", name: "nickname", type: "text", maxlength: "40", value: cls.nickname, autocomplete: "off", required: true }), { hint: 'For example "Period 3" or "Room 214".', error: errors.nickname }),
    h("div", { class: "st-grid-2" }, field("cf-grade", "Grade", select("cf-grade", "grade", GRADES.map((g) => [g, GRADE_LABEL[g]]), cls.grade, "Choose a grade"), { error: errors.grade }), field("cf-subject", "Subject", select("cf-subject", "subject", SUBJECTS.map((s) => [s.id, s.label]), cls.subject, "Choose a subject"), { error: errors.subject })),
    h("div", { class: "st-grid-2" }, field("cf-curr", "Curriculum (optional)", h("input", { id: "cf-curr", name: "curriculum", type: "text", maxlength: "120", value: cls.curriculum, autocomplete: "off" }), { hint: "The program or materials you teach from, in your own words." }), field("cf-unit", "Current unit (optional)", h("input", { id: "cf-unit", name: "unit", type: "text", maxlength: "120", value: cls.unit, autocomplete: "off" }))),
    h(
      "fieldset",
      {},
      h("legend", { class: "st-legend" }, "English proficiency across the class"),
      h("p", { class: "st-hint" }, "Rough numbers are enough. Enter counts of students, or percentages if you prefer."),
      h("div", { class: "st-checks" }, ["count", "percent"].map((m) => h("label", {}, h("input", { type: "radio", name: "mode", value: m, checked: mode === m }), m === "count" ? "Counts" : "Percentages"))),
      h("div", { class: "st-grid-4" }, TIERS.map((t) => field(`cf-p-${t.id}`, t.short, h("input", { id: `cf-p-${t.id}`, name: `prof-${t.id}`, type: "number", min: "0", max: "1000", inputmode: "numeric", value: cls.proficiency[t.id] || "" }), { hint: t.levels }))),
      errors.proficiency ? h("p", { class: "st-error" }, errors.proficiency) : null,
    ),
    checks("domainPriorities", "Language domains to prioritize", DOMAINS, cls.domainPriorities),
    checks("klus", "Key language uses to prioritize", KLUS, cls.klus),
    h(
      "details",
      { class: "st-step" },
      h("summary", {}, "Optional: set a level for each domain"),
      h("p", { class: "st-hint" }, "Leave on Mixed unless your class is clearly different in one domain."),
      h("div", { class: "st-grid-4" }, DOMAINS.map((d) => field(`cf-t-${d}`, d, select(`cf-t-${d}`, `tier-${d}`, DOMAIN_TIER_CHOICES.map((t) => [t, tierName(t)]), cls.domainTiers[d])))),
    ),
    field("cf-goals", "Instructional goals (optional)", h("textarea", { id: "cf-goals", name: "goals", maxlength: "600", rows: "3" }, cls.goals), { hint: "Two or three sentences about what you want this class to be able to do." }),
  );
  const cancel = h("button", { class: "st-btn", type: "button" }, "Cancel");
  cancel.addEventListener("click", onCancel);
  form.append(h("div", { class: "st-row" }, h("button", { class: "st-btn st-btn-primary", type: "submit" }, cls.id ? "Save changes" : "Create class"), cancel));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit(readForm(form, cls));
  });
  queueMicrotask(() => {
    const bad = form.querySelector("[aria-invalid]");
    if (bad) bad.focus();
  });
  return form;
}
