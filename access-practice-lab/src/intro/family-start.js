// Family start (/family-start): where the home's "I am a… Family" button and the Families link land. Two steps, in
// that order: choose your child's grades, then choose how to begin. The Family Tour is one choice beside short
// practice, never the only door (Joel, 2026-11-17: "it shouldn't just go to tour"). The grade comes from ?pick=,
// set only by this page's own grade buttons (the lab adds ?grades= to every link, which must not skip step 1).
import { familyTourHost } from "../family-tour-host.js";
import { GRADE_PICKS } from "../grade-bands.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";

const pickFrom = (value) => (GRADE_PICKS.some((p) => p.id === value) ? value : "");

/** The choices after a grade is picked. The tour leads; the rest are short and real. */
export function familyChoices(pick, { tourHost = familyTourHost() } = {}) {
  const q = `?grades=${pick}`;
  return [
    {
      id: "tour",
      icon: "road",
      href: tourHost ? `${BASE}/family-tour/${q}` : `${BASE}/practice-together${q}`,
      name: ["Take the Family Tour", "Hacer el recorrido familiar"],
      detail: [
        "A short guided walk through the site, with a free home-practice kit. About 8 minutes.",
        "Un recorrido guiado corto por el sitio, con un kit gratis para practicar en casa. Unos 8 minutos.",
      ],
    },
    {
      id: "practice",
      icon: "play",
      href: `${BASE}/family/practice${q}`,
      name: ["Practice together", "Practicar juntos"],
      detail: [
        "One 5-to-10-minute activity to do with your child.",
        "Una actividad de 5 a 10 minutos para hacer con su hijo o hija.",
      ],
    },
    {
      id: "read",
      icon: "reading",
      href: `${BASE}/reading-room${q}`,
      name: ["Read together", "Leer juntos"],
      detail: [
        "Illustrated stories to read and talk about.",
        "Cuentos ilustrados para leer y conversar.",
      ],
    },
    {
      id: "play",
      icon: "star",
      href: `${BASE}/explore/play${q}`,
      name: ["Play a language game", "Jugar un juego de lenguaje"],
      detail: [
        "Games for your child's grade. No timers.",
        "Juegos para el grado de su hijo o hija. Sin cronómetros.",
      ],
    },
    {
      id: "corner",
      icon: "families",
      href: `${BASE}/family${q}`,
      name: ["Family Corner", "Rincón de la familia"],
      detail: [
        "Everything for families: progress, help in your language, weekly ideas.",
        "Todo para las familias: progreso, ayuda en su idioma, ideas semanales.",
      ],
    },
  ];
}

function pickerHTML(I, pick) {
  return html`<div class="tb-picker fs-picker" role="group" aria-labelledby="fsPickLabel">
    <p class="tb-picker-label" id="fsPickLabel">
      <span class="fs-step" aria-hidden="true">1</span
      >${I.T("What grade is your child in?", "¿En qué grado está su hijo o hija?")}
    </p>
    <div class="tb-picker-btns">
      ${GRADE_PICKS.map(
        (p) =>
          html`<a
            class="tb-pick"
            href="${BASE}/family-start?pick=${p.id}"
            aria-current="${p.id === pick ? "true" : "false"}"
          >
            <span class="tb-pick-short">${p.short[0]}</span
            ><span class="tb-pick-name">${I.T(p.name[0], p.name[1])}</span>
          </a>`,
      )}
    </div>
  </div>`;
}

function choicesHTML(I, pick) {
  const name = GRADE_PICKS.find((p) => p.id === pick)?.name || ["", ""];
  return html`<section class="fs-choices" aria-labelledby="fsChoiceLabel">
    <p class="tb-picker-label" id="fsChoiceLabel">
      <span class="fs-step" aria-hidden="true">2</span
      >${I.T(`How do you want to start? (${name[0]})`, `¿Cómo quieren empezar? (${name[1]})`)}
    </p>
    <ul class="in-choices">
      ${familyChoices(pick).map(
        (c) =>
          html`<li>
            <a class="in-choice is-${c.id}" href="${c.href}" data-family-start="${c.id}">
              <span class="in-ic" aria-hidden="true">${icon(c.icon)}</span>
              <span class="in-choice-text"
                ><strong>${I.T(c.name[0], c.name[1])}</strong
                ><span>${I.T(c.detail[0], c.detail[1])}</span></span
              >
              <span class="in-go" aria-hidden="true">${icon("arrow-right")}</span>
            </a>
          </li>`,
      )}
    </ul>
  </section>`;
}

export function render(ctx) {
  const I = i18nFor(ctx);
  const pick = pickFrom(ctx.route?.pick);
  return {
    title: I.S("Families: start here", "Familias: empiecen aquí"),
    html: html`<article class="in-page in-hub fs-page" aria-labelledby="fsTitle">
      <header class="fs-head">
        <p class="eyebrow">${icon("families")} ${I.T("For families", "Para familias")}</p>
        <h1 id="fsTitle" tabindex="-1">${I.T("Welcome, families", "Bienvenidas, familias")}</h1>
        <p class="lead">
          ${I.T("Help your child practice English at home. You do not need to speak perfect English to help.", "Ayude a su hijo o hija a practicar inglés en casa. No necesita hablar inglés perfecto para ayudar.")}
        </p>
      </header>
      <div class="ov-start fs-start">
        ${pickerHTML(I, pick)}
        ${
          pick
            ? choicesHTML(I, pick)
            : html`<p class="fine fs-wait">
                ${I.T("Choose a grade to see your choices, including the Family Tour.", "Elija un grado para ver sus opciones, incluido el recorrido familiar.")}
              </p>`
        }
      </div>
    </article>`,
  };
}
