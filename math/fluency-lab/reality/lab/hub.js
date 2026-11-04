// The Reality Lab home: continue where you left off, pick an experience by grade, or open the experience for a skill.
import { getLang, setLang } from "../../i18n.js";
import { ALL_SKILLS } from "../../problem-bank.js";
import { EXPERIENCES, INNOVATIONS, experienceById, experienceForSkill } from "./catalog.js";
import { EVIDENCE_TEXT, evidenceOf, sanitizeSession } from "./journey.js";
import { L, say } from "./kernel.js";
import { loadLab } from "./store.js";
import { SKILL_MATRIX } from "./skills.js";
import { bandOf } from "./workspace.js";
import { journeyFor } from "./journey-map.js";
import { btn, h } from "./views/common.js";

const UI = {
  title: L("Math Reality Lab", "Laboratorio de realidad matemática"),
  lead: L("Build it, move it, test it. The math answers back.", "Constrúyelo, muévelo, pruébalo. Las matemáticas responden."),
  back: L("Fluency Lab", "Laboratorio de fluidez"),
  grade: L("Grade", "Grado"),
  cont: L("Continue", "Continuar"),
  start: L("Open", "Abrir"),
  again: L("Open again", "Abrir otra vez"),
  more: L("More for other grades", "Más para otros grados"),
  skills: L("Your skills in this grade", "Tus habilidades en este grado"),
  skillsLead: L("Every skill below opens a model, or says why not yet.", "Cada habilidad abre un modelo, o dice por qué todavía no."),
  openSkill: L("Build it", "Constrúyelo"),
  inLab: L("Open in the Fluency Lab", "Abrir en el Laboratorio de fluidez"),
  gradesWord: L("Grades", "Grados"),
  innov: L("Eight ways to work with math", "Ocho maneras de trabajar con matemáticas"),
  kindergarten: L("K", "K"),
  stepOf: L("step", "paso"),
  pick: L("Choose your grade", "Elige tu grado"),
  journey: L("Continue My Journey", "Continuar mi recorrido"),
  nextUp: L("Next up for this grade. Each step is a short model you build, explain and then do on your own.", "Lo siguiente en este grado. Cada paso es un modelo corto que construyes, explicas y luego haces tú solo."),
  resume: L("You started this one. Pick up where you left off.", "Empezaste esta. Continúa donde la dejaste."),
  allDone: L("Every open step for this grade is finished. Try another experience below.", "Todos los pasos abiertos de este grado están terminados. Prueba otra experiencia abajo."),
  path: L("Your path through this grade", "Tu recorrido por este grado"),
  pathLead: L("In prerequisite order. A step opens once the one it builds on is finished.", "En orden de prerrequisitos. Un paso se abre cuando termina el que le sirve de base."),
};
const STATUS = { demonstrated: L("Shown on your own", "Mostrado por ti"), scaffolded: L("Done with help", "Hecho con ayuda"), repaired: L("Repaired", "Reparado"), building: L("In progress", "En progreso"), started: L("Started", "Empezado") };

const gradeText = (e) => (e.grades.length === 1 ? String(e.grades[0]) : `${e.grades[0]}–${e.grades.at(-1)}`);

export function mountHub(root, { grade }) {
  let lang = getLang();
  const lab = loadLab();
  const tx = (t) => say(t, lang);
  const href = (id, extra = "") => `./?x=${encodeURIComponent(id)}&grade=${grade}${extra}`;
  const statusOf = (exp) => {
    const raw = lab.sessions[exp.id];
    const session = raw && sanitizeSession(exp, raw);
    if (!session) return null;
    return { session, label: evidenceOf(exp, session).label, done: session.done };
  };
  function card(exp) {
    const st = statusOf(exp);
    return h("li", { class: `mr-card mr-inno-${exp.innovation}` },
      h("h4", {}, tx(exp.title)),
      h("p", {}, tx(exp.blurb)),
      h("p", { class: "mr-card-meta" }, `${tx(UI.gradesWord)} ${gradeText(exp)}${st ? ` · ${tx(STATUS[st.label])}` : ""}`),
      h("a", { class: "mr-btn is-primary", href: href(exp.id), "aria-label": `${st && !st.done ? tx(UI.cont) : tx(UI.start)}: ${tx(exp.title)}` }, st && !st.done ? tx(UI.cont) : st ? tx(UI.again) : tx(UI.start)));
  }
  function render() {
    const last = lab.last && experienceById(lab.last);
    const lastSt = last && statusOf(last);
    const forGrade = EXPERIENCES.filter((e) => e.grades.includes(grade));
    const others = EXPERIENCES.filter((e) => !e.grades.includes(grade));
    const gradeBtns = h("div", { class: "mr-group", role: "group", "aria-label": tx(UI.pick) }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => h("a", { class: `mr-btn mr-grade ${g === grade ? "is-primary" : ""}`, href: `./?grade=${g}`, "aria-current": g === grade ? "true" : null, "aria-label": `${tx(UI.grade)} ${g === 0 ? "K" : g}` }, g === 0 ? "K" : String(g))));
    const journey = journeyFor(grade, lab);
  const stateText = { done: L("Finished", "Terminada"), started: L("In progress", "En progreso"), ready: L("Ready", "Lista"), locked: L("After the one above", "Después de la anterior"), exception: L("Served in the Fluency Lab", "En el Laboratorio de fluidez") };
  const pathRow = (r) => {
    const label = tx(r.state === "done" ? UI.again : UI.start);
    const open = r.expId && r.state !== "locked";
    return h("li", { class: `mr-path-row is-${r.state}` },
      h("span", { class: "mr-path-state" }, tx(stateText[r.state])),
      h("span", { class: "mr-path-t" }, r.title),
      open ? h("a", { class: "mr-btn is-quiet", href: href(r.expId, `&skill=${encodeURIComponent(r.key)}`), "aria-label": `${label}: ${r.title}` }, label) : null);
  };
  const pathList = h("ol", { class: "mr-path", "aria-label": tx(UI.path) }, ...journey.rows.map(pathRow));
  const next = journey.next;
  const continueCard = next
    ? h("section", { class: "mr-journey", "aria-labelledby": "journey-h" },
        h("p", { class: "mr-eyebrow" }, tx(UI.journey)),
        h("h2", { id: "journey-h" }, next.title),
        h("p", { class: "mr-lead-small" }, next.state === "started" ? tx(UI.resume) : tx(UI.nextUp)),
        h("a", { class: "mr-btn is-primary mr-continue-btn", href: href(next.expId, `&skill=${encodeURIComponent(next.key)}`) }, next.state === "started" ? tx(UI.cont) : tx(UI.start)))
    : h("section", { class: "mr-journey" }, h("p", { class: "mr-lead-small" }, tx(UI.allDone)));
  const innovSection = INNOVATIONS.map((inn) => {
      const list = forGrade.filter((e) => e.innovation === inn.id);
      return list.length ? h("section", { class: "mr-inno", "aria-labelledby": `inno-${inn.id}` }, h("h3", { id: `inno-${inn.id}` }, tx(inn.title)), h("p", { class: "mr-inno-line" }, tx(inn.line)), h("ul", { class: "mr-cards" }, ...list.map(card))) : null;
    });
    const skills = ALL_SKILLS.filter((s) => s.grade === grade).map((s) => {
      const key = `${s.grade}:${s.id}`;
      const row = SKILL_MATRIX[key];
      const id = experienceForSkill(s.grade, s.id);
      return h("li", { class: "mr-skill" },
        h("span", { class: "mr-skill-t" }, s.title),
        id ? h("a", { class: "mr-btn", href: href(id, `&skill=${encodeURIComponent(key)}`), "aria-label": `${tx(UI.openSkill)}: ${s.title}` }, tx(UI.openSkill)) : h("span", { class: "mr-skill-why" }, row?.kind === "exception" ? tx(row.why) : ""),
        id ? null : h("a", { class: "mr-btn is-quiet", href: `../../?grade=${s.grade}&skill=${encodeURIComponent(s.id)}` }, tx(UI.inLab)));
    });
    root.className = "mr-app mr-hub";
    root.dataset.band = bandOf(grade);
    document.documentElement.dataset.band = bandOf(grade);
    root.replaceChildren(
      h("header", { class: "mr-top" }, h("a", { class: "mr-back", href: "../../" }, `← ${tx(UI.back)}`), h("div", { class: "mr-title" }, h("h1", {}, tx(UI.title))), h("div", { class: "mr-top-tools" }, btn(lang === "es" ? "English" : "Español", () => { lang = lang === "es" ? "en" : "es"; setLang(lang); document.documentElement.lang = lang; render(); }, { cls: "is-quiet", key: "lang" }))),
      h("main", { class: "mr-hub-main", id: "mr-main" },
        h("section", { class: "mr-hero" },
          h("p", { class: "mr-eyebrow" }, tx(UI.innov)),
          h("p", { class: "mr-lead" }, tx(UI.lead)),
          gradeBtns,
          last && lastSt && !lastSt.done ? h("a", { class: "mr-continue", href: `./?x=${encodeURIComponent(last.id)}&grade=${grade}` }, h("span", { class: "mr-continue-k" }, tx(UI.cont)), h("strong", {}, tx(last.title)), h("span", {}, `${tx(UI.stepOf)} ${lastSt.session.step + 1} / ${last.steps.length}`)) : null),
        continueCard,
        h("section", { class: "mr-path-wrap", "aria-labelledby": "path-h" }, h("h3", { id: "path-h" }, tx(UI.path)), h("p", { class: "mr-inno-line" }, tx(UI.pathLead)), pathList),
        ...innovSection,
        others.length ? h("details", { class: "mr-others" }, h("summary", {}, tx(UI.more)), h("ul", { class: "mr-cards" }, ...others.map(card))) : null,
        h("section", { class: "mr-skills", "aria-labelledby": "skills-h" }, h("h3", { id: "skills-h" }, tx(UI.skills)), h("p", { class: "mr-inno-line" }, tx(UI.skillsLead)), h("ul", { class: "mr-skill-list" }, ...skills)))
    );
  }
  document.documentElement.lang = lang;
  render();
}
