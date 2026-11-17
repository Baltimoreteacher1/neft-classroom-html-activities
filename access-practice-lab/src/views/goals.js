// My goals (/goals): the student and family side of the goal-setting form. Same goal bank, same sheet, same saved
// draft as the Teacher Hub's Goal-setting form (access-teacher/predictive/view-goals.js), so a goal a teacher starts
// there is the one a student sees here. Pick a grade, a skill and a goal, tick the steps, then print it or download
// it as a Word file. Each step links to the practice that builds the skill.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { sheetDocx, DOCX_MIME } from "../goals/docx.js";
import {
  DOMAIN_NAME,
  GOAL_DOMAINS,
  GRADES,
  bandOfGrade,
  inRange,
  linkPath,
  suggestGoal,
} from "../goals/model.js";
import { LANGS, MEASURES } from "../goals/options.js";
import { buildSheet, sheetHTML } from "../goals/sheet.js";
import { download, fileName, loadBank, loadForm, printSheets, saveForm } from "../goals/store.js";
import { BASE, html, icon, raw } from "../util.js";

const DEFAULT_GRADE = { K: "K", 1: "1", "2-3": "2", "3-5": "4", "6-8": "7" };
let form = null;
let bank = null;
let bankBand = "";
let failed = false;

const pickText = (f, pair) => (f.lang === "es" ? pair[1] : pair[0]);

async function ensureBank() {
  const band = bandOfGrade(form.grade);
  if (bankBand === band) return;
  try {
    bank = await loadBank(band);
    failed = false;
  } catch {
    bank = null;
    failed = true;
  }
  bankBand = band;
}

function chooseGoal(goal, id) {
  goal.goalId = id;
  goal.studentText = "";
  const D = bank?.domains?.[goal.domain];
  if (D && id) {
    goal.steps = D.steps.slice(0, 3).map((s) => s.id);
    goal.evidence = ["0", "1"];
  }
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  if (!form) {
    form = loadForm();
    // A first visit opens on the learner's own grade band, and as a student sheet in their language.
    if (!localStorage.getItem("accessPracticeLab:v1:goal-form")) {
      form.grade = DEFAULT_GRADE[ctx.band] || form.grade;
      form.style = "student";
      form.lang = ctx.prefs?.lang === "es" ? "es" : "en";
      form.teacherSupports = [];
    }
  }
  await ensureBank();
  const goal = form.goals[0];
  const D = bank?.domains?.[goal.domain];
  const label = (g) => (form.lang === "es" ? g.es : g.en);
  const sheet = buildSheet({ ...form, style: "student", goals: [goal] }, bank);
  return {
    title: I.S(
      "My language goals · The Language Page",
      "Mis metas de lenguaje · The Language Page",
    ),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band === "3-5" ? "4-5" : ctx.band}`],
        [I.S("My goals", "Mis metas"), null],
      ])}
      <section class="gl" aria-labelledby="glH">
        <header class="gl-head">
          <p class="gl-eyebrow">${icon("flag")} ${I.T("Set a goal", "Fija una meta")}</p>
          <h1 id="glH" tabindex="-1">${I.T("My language goals", "Mis metas de lenguaje")}</h1>
          <p class="gl-lede">
            ${I.T("Pick a goal, choose your steps, then print it or save it. Your teacher and family can help.", "Elige una meta, escoge tus pasos y luego imprímela o guárdala. Tu docente y tu familia pueden ayudarte.")}
          </p>
        </header>
        <div class="gf" data-gl>
          <div class="gf-controls">
            <div class="gf-step">
              <div class="gf-grid">
                <div class="pi-field">
                  <label for="glGrade">${I.T("My grade", "Mi grado")}</label>
                  <select id="glGrade" data-gl="grade">
                    ${GRADES.map((g) => html`<option value="${g}" ${form.grade === g ? raw("selected") : ""}>${g === "K" ? I.T("Kindergarten", "Kínder") : I.T(`Grade ${g}`, `Grado ${g}`)}</option>`)}
                  </select>
                </div>
                <div class="pi-field">
                  <label for="glSkill">${I.T("Skill", "Destreza")}</label>
                  <select id="glSkill" data-gl="domain">
                    ${GOAL_DOMAINS.map((d) => html`<option value="${d}" ${goal.domain === d ? raw("selected") : ""}>${I.T(DOMAIN_NAME[d][0], DOMAIN_NAME[d][1])}</option>`)}
                  </select>
                </div>
                <div class="pi-field">
                  <label for="glLang">${I.T("Language", "Idioma")}</label>
                  <select id="glLang" data-gl="lang">
                    ${LANGS.map((l) => html`<option value="${l.id}" ${form.lang === l.id ? raw("selected") : ""}>${I.T(l.label[0], l.label[1])}</option>`)}
                  </select>
                </div>
              </div>
              ${failed ? html`<p class="pi-note" role="alert">${I.T("The goals could not load. Check your connection and try again.", "No se pudieron cargar las metas. Revisa tu conexión e inténtalo de nuevo.")}</p>` : ""}
              <div class="pi-field">
                <label for="glGoal">${I.T("My goal", "Mi meta")}</label>
                <select id="glGoal" data-gl="goal">
                  <option value="" ${goal.goalId ? "" : raw("selected")}>
                    ${I.T("Pick a goal…", "Elige una meta…")}
                  </option>
                  ${(D?.goals || []).map((g) => html`<option value="${g.id}" ${g.id === goal.goalId ? raw("selected") : ""}>${label(g)}</option>`)}
                </select>
              </div>
              <div class="pi-field">
                <label for="glWords"
                  >${I.T("Or write it in my words", "O escríbela con mis palabras")}</label
                >
                <textarea
                  id="glWords"
                  rows="2"
                  maxlength="240"
                  data-gl="words"
                  placeholder="${I.S("I can…", "Puedo…")}"
                >
${goal.studentText}</textarea>
              </div>
              <div class="pi-field">
                <label for="glMeasure"
                  >${I.T("I will know I did it when I can do it", "Sabré que lo logré cuando pueda hacerlo")}</label
                >
                <select id="glMeasure" data-gl="measure">
                  ${MEASURES.map((m) => html`<option value="${m.id}" ${goal.measure === m.id ? raw("selected") : ""}>${pickText(form, m.student)}</option>`)}
                </select>
              </div>
              ${
                D
                  ? html`<fieldset class="pi-fieldset">
                      <legend>${I.T("My steps", "Mis pasos")}</legend>
                      <ul class="gf-checks">
                        ${D.steps.map(
                          (s) =>
                            html`<li>
                              <label class="pi-check"
                                ><input
                                  type="checkbox"
                                  data-gl-step="${s.id}"
                                  ${goal.steps.includes(s.id) ? raw("checked") : ""}
                                /><span
                                  >${pickText(form, [s.en, s.es])}${s.link ? html` <a href="${BASE}${linkPath(s.link, bandOfGrade(form.grade))}">${icon("arrow-right")}<span class="visually-hidden">${I.T("Practice this", "Practica esto")}</span></a>` : ""}</span
                                ></label
                              >
                            </li>`,
                        )}
                      </ul>
                    </fieldset>`
                  : ""
              }
            </div>
          </div>
          <div class="gf-preview-wrap">
            <div class="gf-actions">
              <button type="button" class="btn btn-primary" data-gl-act="print">
                ${I.T("Print or Save as PDF", "Imprimir o guardar como PDF")}
              </button>
              <button type="button" class="btn" data-gl-act="docx">
                ${I.T("Download Word", "Descargar Word")}
              </button>
              <a class="btn ghost" href="/access-teacher/predictive/?tab=toolkit&tool=goals"
                >${I.T("Teacher version", "Versión para docentes")}</a
              >
            </div>
            <div
              class="gf-preview"
              id="glPreview"
              role="region"
              aria-label="${I.S("Preview of my goal sheet", "Vista previa de mi hoja de metas")}"
              tabindex="0"
            >
              ${raw(sheetHTML(sheet))}
            </div>
          </div>
        </div>
      </section>`,
  };
}

function refreshPreview() {
  const el = document.getElementById("glPreview");
  if (!el) return;
  const goal = form.goals[0];
  const sheet = buildSheet({ ...form, style: "student", goals: [goal] }, bank);
  el.replaceChildren(
    ...new DOMParser().parseFromString(sheetHTML(sheet), "text/html").body.childNodes,
  );
}

const currentSheet = () => buildSheet({ ...form, style: "student", goals: [form.goals[0]] }, bank);

export function onClick(e) {
  const act = e.target.closest("[data-gl-act]")?.dataset.glAct;
  if (!act) return false;
  if (act === "print") printSheets([sheetHTML(currentSheet())]);
  if (act === "docx") download(fileName(form, "docx"), sheetDocx(currentSheet()), DOCX_MIME);
  return true;
}

export function onChange(e, ctx) {
  const t = e.target;
  const goal = form?.goals[0];
  if (!goal) return;
  if (t.dataset.glStep) {
    goal.steps = t.checked
      ? [...new Set([...goal.steps, t.dataset.glStep])]
      : goal.steps.filter((x) => x !== t.dataset.glStep);
    saveForm(form);
    return refreshPreview();
  }
  const key = t.dataset.gl;
  if (!key) return;
  if (key === "grade") {
    form.grade = t.value;
    form.goals.forEach((g) => Object.assign(g, { goalId: "", steps: [], evidence: [] }));
  } else if (key === "domain")
    Object.assign(goal, { domain: t.value, goalId: "", steps: [], evidence: [] });
  else if (key === "lang") form.lang = t.value;
  else if (key === "measure") goal.measure = t.value;
  else if (key === "goal") chooseGoal(goal, t.value);
  else return;
  saveForm(form);
  // A first goal is suggested when a skill or grade changes, so the page is never an empty form.
  const redraw = async () => {
    await ensureBank();
    if ((key === "grade" || key === "domain") && bank && !goal.goalId)
      chooseGoal(
        goal,
        suggestGoal(bank, goal.domain, form.level === "" ? null : Number(form.level))?.id || "",
      );
    saveForm(form);
    ctx.rerender();
  };
  void redraw();
}

export function onInput(e, ctx) {
  if (e.target.dataset?.gl !== "words" || !form) return false;
  form.goals[0].studentText = e.target.value.slice(0, 240);
  saveForm(form);
  refreshPreview();
  return true;
}

