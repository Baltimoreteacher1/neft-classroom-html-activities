// Science Investigation Lab: the hub (/worlds/science-lab), the help choice that comes first, and the card on /worlds.
import { STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { progress } from "../lang/science-lab.js";
import { BASE, html, icon } from "../util.js";
import { hasChosen, nextStageOf, statusOf } from "./science-lab-model.js";
import {
  crumbs,
  labHref,
  pathHTML,
  stageTitle,
  statusText,
  supportChooserHTML,
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

/** Shown on the hub and on every stage until the learner has picked a help setting: nothing else renders first. */
export function chooseScreenHTML(I, t, cs, { hub }) {
  return html`${crumbs(I, t, hub ? "" : I.S("Choose your help", "Elige tu ayuda"))}
    <section class="panel sl-choose" aria-labelledby="slTitle">
      <p class="eyebrow">
        ${icon("worlds")}
        ${I.T(`Science Investigation Lab · Grades ${t.band.replace("-", "–")}`, `Laboratorio de investigación científica · Grados ${t.band.replace("-", "–")}`)}
      </p>
      <h1 id="slTitle" tabindex="-1">
        ${I.T("How do you want to work?", "¿Cómo quieres trabajar?")}
      </h1>
      <p class="lead">${I.TO(t.caseDef.title)}</p>
      <p>
        ${I.T("Choose how much help to start with. You will not see any help until you choose.", "Elige con cuánta ayuda empezar. No verás ninguna ayuda hasta que elijas.")}
      </p>
      ${supportChooserHTML(I, cs.support, false)}
    </section>`;
}

export function hubHTML(I, t, cs) {
  const p = progress(cs);
  const next = nextStageOf(cs);
  const started = p.done > 0 || statusOf(cs, STAGES[0]) !== "new";
  const nextTitle = next ? stageTitle(I, next) : "";
  const tStatus = statusOf(cs, TRANSFER_STAGE);
  return html`${crumbs(I, t, "")}
    <section class="panel sl-hero" aria-labelledby="slTitle">
      <p class="eyebrow">
        ${icon("worlds")}
        ${I.T(`Explore · Grades ${t.band.replace("-", "–")}`, `Explorar · Grados ${t.band.replace("-", "–")}`)}
      </p>
      <h1 id="slTitle" tabindex="-1">
        ${I.T("Science Investigation Lab", "Laboratorio de investigación científica")}
      </h1>
      <p class="lead">${I.TO(t.caseDef.title)}</p>
      <p>${I.TO(t.caseDef.phenomenon)}</p>
      <div class="row-actions">
        ${
          next
            ? html`<a class="btn btn-primary btn-big" data-sl-continue href="${labHref(t, next)}"
                >${started ? I.T("Continue: ", "Continuar: ") : I.T("Start: ", "Empezar: ")}${nextTitle}
                ${icon("arrow-right")}</a
              >`
            : html`<p>
                ${icon("check")}
                ${I.T("You finished every step, including the new investigation on your own.", "Terminaste todos los pasos, incluida la investigación nueva por tu cuenta.")}
              </p>`
        }
      </div>
    </section>
    <section class="panel" aria-labelledby="slPathTitle">
      <h2 id="slPathTitle">${I.T("The twelve steps", "Los doce pasos")}</h2>
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
    <div class="sl-hub-side">
      ${supportChooserHTML(I, cs.support, true)}
      <p class="fine">
        ${icon("lock")}
        ${I.T("Your work is saved in this browser and is included when you export your Passport. Recordings are never saved. The data in this lab is classroom sample data written for practice.", "Tu trabajo se guarda en este navegador y se incluye cuando exportas tu Pasaporte. Las grabaciones nunca se guardan. Los datos de este laboratorio son datos de muestra del salón escritos para practicar.")}
      </p>
    </div>`;
}

