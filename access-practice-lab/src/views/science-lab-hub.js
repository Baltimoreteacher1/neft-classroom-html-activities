// Science Investigation Lab: the hub (/worlds/science-lab) and the card on /worlds. The hub opens straight onto
// the investigation: the scene, the question, one Start button, the help switch (default "Some") and the trail.
import { STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { progress } from "../lang/science-lab.js";
import { BASE, html, icon } from "../util.js";
import { nextStageOf, statusOf } from "./science-lab-model.js";
import { phenomenonSceneHTML } from "./science-lab-scene.js";
import {
  crumbs,
  helpLevelHTML,
  labHref,
  pathHTML,
  stageTitle,
  statusText,
} from "./science-lab-ui.js";

/** A card on the Language Worlds page. It is not a world tile: the lab is an investigation, not a fifth world. */
export const scienceLabCardHTML = (I, band) =>
  html`<section class="panel sl-hub-card" aria-labelledby="slCardTitle">
    <div>
      <p class="eyebrow">${icon("worlds")} ${I.T("Investigate", "Investiga")}</p>
      <h2 id="slCardTitle">
        ${I.T("Science Investigation Lab", "Laboratorio de investigación científica")}
      </h2>
      <p>
        ${I.T("Notice a phenomenon, ask a question, plan a fair test, collect data, then make a claim and explain it with evidence. Twelve calm steps, then a new investigation on your own.", "Observa un fenómeno, haz una pregunta, planea una prueba justa, reúne datos y luego haz una afirmación y explícala con evidencia. Doce pasos tranquilos y luego una investigación nueva por tu cuenta.")}
      </p>
    </div>
    <a class="btn btn-primary" href="${BASE}/worlds/science-lab?grades=${band}"
      >${I.T("Open the lab", "Abrir el laboratorio")} ${icon("arrow-right")}</a
    >
  </section>`;

export function hubHTML(I, t, cs) {
  const p = progress(cs);
  const next = nextStageOf(cs);
  const started = p.done > 0 || statusOf(cs, STAGES[0]) !== "new";
  const tStatus = statusOf(cs, TRANSFER_STAGE);
  const grades = t.band.replace("-", "–");
  return html`${crumbs(I, t, "")}
    <section class="panel sl-hero" aria-labelledby="slTitle">
      <div class="sl-hero-text">
        <h1 id="slTitle" tabindex="-1">
          <span class="sl-hero-kicker"
            >${I.T("Science Investigation Lab", "Laboratorio de investigación científica")} ·
            ${I.T(`Grades ${grades}`, `Grados ${grades}`)}</span
          >
          <span class="sl-hero-q">${I.TO(t.caseDef.question)}</span>
        </h1>
        <p class="sl-hero-lead">
          ${I.T("Look closely, run a fair test, then use your data to explain what happened.", "Observa con cuidado, haz una prueba justa y usa tus datos para explicar lo que pasó.")}
        </p>
        <div class="row-actions">
          ${
            next
              ? html`<a class="btn btn-primary btn-big" data-sl-continue href="${labHref(t, next)}"
                  >${started ? html`${I.T("Keep going: ", "Seguir: ")}${stageTitle(I, next)}` : I.T("Start the investigation", "Empezar la investigación")}
                  ${icon("arrow-right")}</a
                >`
              : html`<p class="sl-finished">
                  ${icon("check")}
                  ${I.T("You finished every step, including the new investigation on your own.", "Terminaste todos los pasos, incluida la investigación nueva por tu cuenta.")}
                </p>`
          }
        </div>
        ${helpLevelHTML(I, cs.support)}
      </div>
      <div class="sl-hero-art">${phenomenonSceneHTML(I, t.caseDef, { uid: "slx-hub", caption: false })}</div>
    </section>
    <section class="panel sl-trail" aria-labelledby="slPathTitle">
      <h2 id="slPathTitle">${I.T("Your twelve steps", "Tus doce pasos")}</h2>
      ${pathHTML(I, t, cs, "", true)}
      <p class="sl-transfer">
        <a class="btn" href="${labHref(t, TRANSFER_STAGE)}"
          >${icon("flag")} ${stageTitle(I, TRANSFER_STAGE)}</a
        >
        <span class="fine"
          >${statusText(I, tStatus)}.
          ${I.T("Best after the twelve steps. All help is closed.", "Mejor después de los doce pasos. Toda la ayuda está cerrada.")}</span
        >
      </p>
    </section>
    <details class="slx-more sl-hub-about">
      <summary>${I.T("About your work and this data", "Sobre tu trabajo y estos datos")}</summary>
      <p class="fine">
        ${icon("lock")}
        ${I.T("Your work is saved in this browser and is included when you export your Passport. Recordings are never saved. The data in this lab is classroom sample data written for practice.", "Tu trabajo se guarda en este navegador y se incluye cuando exportas tu Pasaporte. Las grabaciones nunca se guardan. Los datos de este laboratorio son datos de muestra del salón escritos para practicar.")}
      </p>
    </details>`;
}
