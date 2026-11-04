// The teacher curriculum view for one grade: every skill in prerequisite order with its standard, what it builds on and
// unlocks, the model that teaches it, the misconceptions to expect, and direct links. Links open the experience in
// preview mode, which never writes to a learner's saved progress, so a teacher-directed activity cannot change a
// student's recommended next step. Read-only: it reads the knowledge graph, the skill matrix and the misconception library.
import { getLang, setLang } from "../../i18n.js";
import { dependentsOf, directPrerequisites, skillNode } from "../../e8/knowledge-graph.js";
import { misconceptionsForSkill } from "../../e8/misconception-library.js";
import { experienceById } from "./catalog.js";
import { companionFor } from "./companion-for.js";
import { gradeOrder, skillState } from "./journey-map.js";
import { L, say } from "./kernel.js";
import { SKILL_MATRIX } from "./skills.js";
import { applyIdentity } from "./identity.js";
import { btn, h } from "./views/common.js";

const UI = {
  title: L("Teacher view: the learning sequence", "Vista del docente: la secuencia de aprendizaje"),
  back: L("Reality Lab", "Laboratorio de realidad"),
  lead: L("Skills in prerequisite order. Preview links open the activity without saving anything to a student's progress.", "Habilidades en orden de prerrequisitos. Los enlaces de vista previa abren la actividad sin guardar nada en el progreso de un estudiante."),
  grade: L("Grade", "Grado"),
  skill: L("Skill", "Habilidad"),
  standard: L("Standard", "Estándar"),
  builds: L("Builds on", "Se apoya en"),
  unlocks: L("Leads to", "Lleva a"),
  model: L("Model", "Modelo"),
  watch: L("Common misconceptions", "Errores comunes"),
  actions: L("Open", "Abrir"),
  preview: L("Preview the activity", "Vista previa de la actividad"),
  family: L("Family companion", "Guía para familias"),
  inLab: L("Open in the Fluency Lab", "Abrir en el Laboratorio de fluidez"),
  none: L("None in this grade", "Ninguno en este grado"),
  kinds: { journey: L("Full journey", "Recorrido completo"), studio: L("Skill studio", "Estudio de habilidad"), exception: L("Fluency Lab Studio", "Estudio del Laboratorio de fluidez") },
  count: L("skills", "habilidades"),
};

const titleOf = (key) => skillNode(key)?.title ?? key;

export function mountTeacher(root, { grade }) {
  let lang = getLang();
  const tx = (t) => say(t, lang);
  const preview = (id, key) => `./?x=${encodeURIComponent(id)}&grade=${grade}&skill=${encodeURIComponent(key)}&preview=1&restart=1`;

  function row(skill) {
    const key = skill.key;
    const matrix = SKILL_MATRIX[key];
    const info = skillState({}, skill, true);
    const node = skillNode(key);
    const needs = directPrerequisites(key);
    const leads = dependentsOf(key);
    const mis = misconceptionsForSkill(key).slice(0, 3);
    const exp = info.expId ? experienceById(info.expId) : null;
    const companion = info.expId && companionFor(info.expId);
    const list = (keys) => (keys.length ? h("ul", { class: "mr-t-list" }, ...keys.map((k) => h("li", {}, titleOf(k)))) : h("span", { class: "mr-t-none" }, tx(UI.none)));
    return h("tr", {},
      h("th", { scope: "row" }, skill.title),
      h("td", { class: "mr-t-std" }, node?.standard ?? ""),
      h("td", {}, list(needs)),
      h("td", {}, list(leads)),
      h("td", {}, h("strong", {}, tx(UI.kinds[matrix?.kind ?? "exception"])), exp ? h("span", { class: "mr-t-sub" }, tx(exp.title)) : h("span", { class: "mr-t-sub" }, matrix?.why ? tx(matrix.why) : "")),
      h("td", {}, mis.length ? h("ul", { class: "mr-t-list" }, ...mis.map((m) => h("li", {}, tx(m.title)))) : h("span", { class: "mr-t-none" }, "—")),
      h("td", { class: "mr-t-actions" },
        info.expId ? h("a", { class: "mr-btn", href: preview(info.expId, key), "aria-label": `${tx(UI.preview)}: ${skill.title}` }, tx(UI.preview)) : h("a", { class: "mr-btn is-quiet", href: `../../?grade=${grade}&skill=${encodeURIComponent(skill.id)}` }, tx(UI.inLab)),
        companion ? h("a", { class: "mr-btn is-quiet", href: `./?family=${encodeURIComponent(info.expId)}&grade=${grade}` }, tx(UI.family)) : null));
  }

  function render() {
    root.className = "mr-app mr-teacher";
    applyIdentity(root, grade);
    document.documentElement.lang = lang;
    const skills = gradeOrder(grade);
    const gradeLinks = h("div", { class: "mr-group", role: "group", "aria-label": tx(UI.grade) }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => h("a", { class: `mr-btn mr-grade ${g === grade ? "is-primary" : ""}`, href: `./?teacher=1&grade=${g}`, "aria-current": g === grade ? "true" : null, "aria-label": `${tx(UI.grade)} ${g === 0 ? "K" : g}` }, g === 0 ? "K" : String(g))));
    root.replaceChildren(
      h("header", { class: "mr-top" }, h("a", { class: "mr-back", href: `./?grade=${grade}` }, `← ${tx(UI.back)}`), h("div", { class: "mr-title" }, h("h1", {}, tx(UI.title))), h("div", { class: "mr-top-tools" }, btn(lang === "es" ? "English" : "Español", () => { lang = lang === "es" ? "en" : "es"; setLang(lang); render(); }, { cls: "is-quiet", key: "lang" }))),
      h("main", { class: "mr-t-main", id: "mr-main" },
        h("p", { class: "mr-lead-small" }, tx(UI.lead)),
        gradeLinks,
        h("p", { class: "mr-eyebrow" }, `${skills.length} ${tx(UI.count)}`),
        h("div", { class: "mr-t-scroll", role: "region", "aria-label": tx(UI.title), tabindex: "0" },
          h("table", { class: "mr-table mr-t-table" },
            h("thead", {}, h("tr", {}, ...[UI.skill, UI.standard, UI.builds, UI.unlocks, UI.model, UI.watch, UI.actions].map((c) => h("th", { scope: "col" }, tx(c))))),
            h("tbody", {}, ...skills.map(row))))));
  }
  render();
}
