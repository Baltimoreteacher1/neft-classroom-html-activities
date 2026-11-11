// Site Guide top summary: what the site is, the grade picker and the four domain cards for the chosen grade (the same
// activities as /start and the tour, from tour-bands.js), plus a way into the printable resources. Shown to the
// general reader and to teachers; families have Practice at Home and students go straight to the activities.
//
// band.js renders its picker and cards in English only, so this module renders its own Spanish-aware copy with the
// same classes and `data-tb-pick` hooks (band.js `onBandClick` still handles the grade buttons). Activity titles stay
// English and carry lang="en": they are the names on the activity pages. Spanish is machine-written.
import { GRADE_PICKS } from "../grade-bands.js";
import { ART, BASE, html, icon } from "../util.js";
import { pickById } from "./band.js";
import { ROUTES } from "./data.js";
import { GUIDE } from "./site-guide-data.js";
import { linkHTML } from "./site-guide-cards.js";
import { withReturn } from "./return-bar.js";
import { DOMAIN_STOP, tourHref } from "./start-overview.js";
import { tourActivities, tourRoute } from "./tour-bands.js";

const DOMAIN_ES = {
  listening: "Escuchar",
  speaking: "Hablar",
  reading: "Leer",
  writing: "Escribir",
};
const LEVEL_ES = {
  "Starting support": "Apoyo inicial",
  Growing: "En crecimiento",
  "Building support": "Apoyo para avanzar",
  "Picture speaking ladder": "Escalera de expresión oral con imagen",
  "Language builders": "Constructores de lenguaje",
};
/** What students do, in Spanish, per activity id (the English is tour-bands.js `students`). */
export const STUDENTS_ES = {
  "gk-l-a-find-seed":
    "Los niños escuchan una indicación corta y tocan la imagen que corresponde: una flor, un sol o una semilla.",
  "gk-s-a-garden-see": "Los niños miran la imagen de un huerto y dicen una cosa que ven.",
  "gk-r-b-i-see-fish":
    "Con una persona adulta, los niños leen la oración «I see a fish.» y tocan la imagen que corresponde.",
  "gk-w-a-draw-garden":
    "Los niños dibujan una planta, copian la palabra «plant» con un lápiz y se la muestran a una persona adulta.",
  "g1-l-a-hear-cat": "Los niños escuchan y tocan el gato entre tres imágenes de animales.",
  "g1-s-a-garden-name": "Los niños miran la imagen de un huerto y nombran una cosa que ven.",
  "g1-r-b-cat-mat":
    "Los niños leen una oración, «The cat naps on the mat.», y tocan dónde está el gato.",
  "g1-w-b-i-see":
    "Los niños miran la imagen de un huerto y escriben «I see» y una cosa más en una página impresa.",
  "g23-l-a-garden-helper":
    "Los estudiantes escuchan un cuento corto y tocan la imagen de quién riega las plantas de frijol.",
  "g23-s-a-garden-see": "Los estudiantes miran la imagen de un huerto y dicen una cosa que ven.",
  "g23-r-b-library-card":
    "Los estudiantes leen cuatro oraciones cortas sobre la tarjeta de la biblioteca de Leo y tocan lo que él puede hacer con ella.",
  "g23-w-a-favorite-fruit":
    "Los estudiantes dibujan su fruta favorita y escriben una oración: «I like ___ because ___.»",
  "g35-l-a-classroom-place":
    "Los estudiantes miran la imagen de un salón de clase, escuchan una indicación y eligen el lugar que se nombra.",
  "class-garden":
    "Los estudiantes suben tres pasos de expresión oral con la imagen de un huerto: nombran cosas, hablan de ellas y luego dicen más.",
  "g35-r-a-garden":
    "Los estudiantes leen un texto corto con una imagen y encuentran el detalle clave que responde una pregunta.",
  "lu35-explain-plants":
    "Los estudiantes revisan la oración sencilla «Plants need stuff.» y le agregan un detalle, una palabra exacta y un conector.",
  "main-idea-match-b":
    "Los estudiantes escuchan una afirmación corta de un docente y eligen de qué trata principalmente.",
  hallway:
    "Los estudiantes miran la imagen de un pasillo y hablan tres veces: nombran cosas, dicen qué pasa y por qué, y luego explican un cambio con una razón.",
  "read-main-idea":
    "Los estudiantes leen un texto informativo corto y eligen de qué trata principalmente.",
  upgrade:
    "Los estudiantes revisan una oración sencilla («Phones in class are bad.») y le agregan un detalle, una palabra más exacta y un conector.",
};

const pickNames = (id) => pickById(id)?.name || ["", ""];

function pickerHTML(I, pick) {
  const [en, es] = pickNames(pick);
  return html`<div class="tb-picker" role="group" aria-labelledby="tbPickLabel">
    <p class="tb-picker-label" id="tbPickLabel">
      ${I.T("Choose grades to see one activity in each domain", "Elijan los grados para ver una actividad de cada destreza")}
    </p>
    <div class="tb-picker-btns">
      ${GRADE_PICKS.map(
        (p) =>
          html`<button
            type="button"
            class="tb-pick"
            data-tb-pick="${p.id}"
            aria-pressed="${String(p.id === pick)}"
          >
            <span class="tb-pick-short">${p.short[0]}</span
            ><span class="tb-pick-name">${I.T(p.name[0], p.name[1])}</span>
          </button>`,
      )}
    </div>
    <p class="fine tb-picker-hint">${I.T(`Showing ${en}.`, `Se muestra: ${es}.`)}</p>
  </div>`;
}

const actions = (I, pick, a) =>
  html`<p class="ov-card-actions">
    <a class="btn small btn-primary" href="${withReturn(`${BASE}${tourRoute(a)}`, "siteguide")}"
      >${I.T("Open the activity", "Abrir la actividad")}<span class="visually-hidden"
        >: <span lang="en">${a.title}</span></span
      >${icon("arrow-right")}</a
    >
    <a class="btn small ghost" href="${tourHref(pick, DOMAIN_STOP[a.domain.id])}"
      >${I.T("Try it in the tour", "Probarla en el recorrido")}<span class="visually-hidden"
        >: ${I.T(a.domain.name, DOMAIN_ES[a.domain.id])}</span
      ></a
    >
  </p>`;

function cardsHTML(I, pick) {
  const [en, es] = pickNames(pick);
  return html`<ul
    class="tb-domains"
    aria-label="${I.S(`${en}: one activity for each language domain`, `${es}: una actividad de cada destreza`)}"
  >
    ${tourActivities(pick).map(
      (a) =>
        html`<li class="tb-domain ${a.domain.cls}">
          <img src="${ART}/${a.domain.art}" alt="" width="160" height="100" loading="lazy" />
          <div class="tb-domain-body">
            <h3>
              <span class="in-ic" aria-hidden="true">${icon(a.domain.icon)}</span
              >${I.T(a.domain.name, DOMAIN_ES[a.domain.id])}
            </h3>
            <p class="tb-domain-title">
              <strong lang="en">${a.title}</strong
              ><span class="fine">${I.T(a.level, LEVEL_ES[a.level])} · ${a.minutes} min</span>
            </p>
            <p>${I.T(a.students, STUDENTS_ES[a.id])}</p>
            ${actions(I, pick, a)}
          </div>
        </li>`,
    )}
  </ul>`;
}

export function overviewSection(I, pick) {
  return html`<section class="sg-overview no-print" aria-labelledby="sgOverviewH">
    <div class="sg-ov-text">
      <h2 id="sgOverviewH">
        ${I.T("The Language Page at a glance", "The Language Page de un vistazo")}
      </h2>
      <p>${I.TO(GUIDE.overview)}</p>
      <p class="sg-ov-links">
        ${linkHTML(`${ROUTES.start}#ov-resources`, html`${icon("download")} ${I.T("Printable guides and resources", "Guías y recursos para imprimir")}`, "btn small")}
        ${linkHTML(ROUTES.together, html`${icon("families")} ${I.T("The family page", "La página para familias")}`, "btn small ghost")}
      </p>
    </div>
    <div class="sg-ov-band">${pickerHTML(I, pick)} ${cardsHTML(I, pick)}</div>
  </section>`;
}
