// The family companion page: one flagship experience explained for a grown-up, with the model one tap away. It reads
// companions.js and the experience catalog, shows English or Spanish, prints cleanly, and never shows an answer.
import { getLang, setLang } from "../../i18n.js";
import { experienceById } from "./catalog.js";
import { companionFor, companionIdsForGrade, companionSkillTitle } from "./companion-for.js";
import { COMPANIONS } from "./companions.js";
import { L, say } from "./kernel.js";
import { applyIdentity } from "./identity.js";
import { btn, h } from "./views/common.js";

const UI = {
  title: L("Family Math", "Matemáticas en familia"),
  back: L("Reality Lab", "Laboratorio de realidad"),
  lead: L("Help your child with one idea at a time. Ask questions; let them show you.", "Ayuda a tu hijo con una idea a la vez. Haz preguntas; deja que te lo muestre."),
  goal: L("What we are learning", "Lo que aprendemos"),
  why: L("Why it matters", "Por qué importa"),
  tryIt: L("Try the model together", "Prueben el modelo juntos"),
  open: L("Open the model", "Abrir el modelo"),
  talk: L("Talk about it", "Conversen"),
  talkNote: L("Ask, then wait. Let your child explain before you say anything.", "Pregunta y espera. Deja que tu hijo explique antes de decir algo."),
  practice: L("Practice together", "Practiquen juntos"),
  watch: L("Watch for", "Ten cuidado con"),
  independent: L("Try on their own", "Que lo intente solo"),
  next: L("What comes next", "Lo que sigue"),
  print: L("Print this page", "Imprimir esta página"),
  all: L("All family companions", "Todas las guías para familias"),
  grade: L("Grade", "Grado"),
};

export function mountFamily(root, { expId, grade }) {
  let lang = getLang();
  const tx = (t) => say(t, lang);
  const labHref = (id) => `./?x=${encodeURIComponent(id)}&grade=${grade}`;
  const familyHref = (id) => `./?family=${encodeURIComponent(id)}&grade=${grade}`;

  function section(id, title, ...kids) {
    return h("section", { class: "mr-fam-sec", "aria-labelledby": `fam-${id}` }, h("h2", { id: `fam-${id}` }, tx(title)), ...kids);
  }
  function render() {
    root.className = "mr-app mr-family";
    applyIdentity(root, grade);
    document.documentElement.lang = lang;
    const bar = h("header", { class: "mr-top" },
      h("a", { class: "mr-back", href: `./?grade=${grade}` }, `← ${tx(UI.back)}`),
      h("div", { class: "mr-title" }, h("p", { class: "mr-eyebrow" }, tx(UI.title)), h("h1", {}, expId && experienceById(expId) ? (companionSkillTitle(expId) ?? tx(experienceById(expId).title)) : tx(UI.title))),
      h("div", { class: "mr-top-tools" },
        btn(lang === "es" ? "English" : "Español", () => { lang = lang === "es" ? "en" : "es"; setLang(lang); render(); }, { cls: "is-quiet", key: "lang" }),
        btn(tx(UI.print), () => window.print(), { cls: "is-quiet", key: "print" })));
    const c = expId && companionFor(expId);
    if (!c) {
      const ids = [...new Set([...companionIdsForGrade(grade), ...Object.keys(COMPANIONS)])];
      const items = ids.map((id) => h("li", { class: "mr-card" }, h("h4", {}, companionSkillTitle(id) ?? tx(experienceById(id).title)), h("p", {}, tx(companionFor(id).goal)), h("a", { class: "mr-btn is-primary", href: familyHref(id) }, tx(UI.open))));
      root.replaceChildren(bar, h("main", { class: "mr-hub-main", id: "mr-main" }, h("p", { class: "mr-lead" }, tx(UI.lead)), h("ul", { class: "mr-cards" }, ...items)));
      return;
    }
    const nextExp = c.next ? experienceById(c.next) : null;
    root.replaceChildren(bar, h("main", { class: "mr-fam", id: "mr-main" },
      h("p", { class: "mr-lead-small" }, tx(UI.lead)),
      section("goal", UI.goal, h("p", { class: "mr-fam-big" }, tx(c.goal))),
      section("why", UI.why, h("p", {}, tx(c.why))),
      section("try", UI.tryIt, h("a", { class: "mr-btn is-primary", href: labHref(expId) }, tx(UI.open))),
      section("talk", UI.talk, h("p", { class: "mr-note" }, tx(UI.talkNote)), h("ul", { class: "mr-fam-list" }, ...c.talk.map((q) => h("li", {}, tx(q))))),
      section("practice", UI.practice, h("p", {}, tx(c.practice))),
      section("watch", UI.watch, h("p", { class: "mr-fb is-info" }, tx(c.watch))),
      section("independent", UI.independent, h("p", {}, tx(c.independent))),
      nextExp ? section("next", UI.next, h("p", {}, companionSkillTitle(c.next) ?? tx(nextExp.title)), h("a", { class: "mr-btn", href: companionFor(c.next) ? familyHref(c.next) : labHref(c.next) }, tx(UI.open))) : null,
      h("p", {}, h("a", { class: "mr-btn is-quiet", href: `./?family=&grade=${grade}` }, tx(UI.all)))));
  }
  render();
}
