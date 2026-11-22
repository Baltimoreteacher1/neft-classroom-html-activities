// Family Hub (/family-start): where the home's "Families" door and the Families nav link land.
//
// Order on the page: a large English / Español switch (the lab's own language preference, prefs.lang), then
// step 1, the child's grade, then the quick start and the five main choices. The grade comes from ?pick=, set only
// by this page's own grade buttons (the lab adds ?grades= to every link, which must not skip step 1). The Family Tour
// is one choice beside short practice, never the only door (Joel, 2026-11-17: "it shouldn't just go to tour").
//
// Quick start reuses the family planner's sessions (src/family/plan.js): unfinished work first, skills spread
// evenly, trimmed to the length chosen here (5 / 10 / 15 minutes, default 5). The length is the family planner's own
// preference (prefs.family.minutes), so the two pages never disagree. Minutes are estimates, never a countdown.
import { rememberAudience } from "../audience.js";
import { familyCoPilotHTML, onFamilyCoPilotClick } from "../views/family-copilot.js";
import { normalizeBand, isEarlyBand } from "../bands.js";
import { bandRows } from "../content.js";
import { familyTourHost } from "../family-tour-host.js";
import { playlistHref, sessionMinutes, sessionOptions } from "../family/plan.js";
import { MINUTES, familyPatch, getFamily } from "../family/state.js";
import { GRADE_PICKS } from "../grade-bands.js";
import { i18nFor, langSwitchHTML } from "../i18n.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, storage } from "../util.js";
import { familyFaqHTML } from "./family-help.js";


export const DEFAULT_QUICK_MINUTES = 5;

const pickFrom = (value) => (GRADE_PICKS.some((p) => p.id === value) ? value : "");
const P = (en, es) => [en, es];

/** Short lines a family can act on, shown beside the choices they fit. */
export const FAMILY_TIPS = Object.freeze({
  alone: P(
    "Your child can try this independently.",
    "Su hijo o hija puede intentarlo solo o sola.",
  ),
  explain: P(
    "Ask your child to explain their answer.",
    "Pida a su hijo o hija que explique su respuesta.",
  ),
  listen: P(
    "Listen together, then let your child try.",
    "Escuchen juntos y luego deje que su hijo o hija lo intente.",
  ),
  again: P("It is okay to practice again.", "Está bien practicar otra vez."),
});

/** The quick-start length: the family planner's saved length when it is 5, 10 or 15, else 5. */
export const quickMinutes = (prefs) => getFamily(prefs).minutes || DEFAULT_QUICK_MINUTES;

/**
 * The five main choices after a grade is picked, in the order families see them, plus the Family Tour and Family
 * Corner. Every href and sub-link carries ?grades=<pick>. `links` are the rooms or pages inside a choice.
 */
export function familyChoices(pick, { tourHost = familyTourHost() } = {}) {
  const q = `?grades=${pick}`;
  const early = isEarlyBand(normalizeBand(pick));
  const tour = {
    id: "tour",
    icon: "road",
    href: tourHost ? `${BASE}/family-tour/${q}` : `${BASE}/practice-together${q}`,
    name: P("Take the Family Tour", "Hacer el recorrido familiar"),
    detail: P(
      "A short guided walk through the site, with a free home-practice kit. About 8 minutes.",
      "Un recorrido guiado corto por el sitio, con un kit gratis para practicar en casa. Unos 8 minutos.",
    ),
  };
  return [
    {
      id: "quick",
      icon: "play",
      href: `${BASE}/family/practice${q}`,
      name: P("Start a 5-Minute Activity", "Empezar una actividad de 5 minutos"),
      detail: P(
        "Short practice for your child's grade. It starts with work your child has not done yet.",
        "Práctica corta para el grado de su hijo o hija. Empieza con lo que todavía no ha hecho.",
      ),
      tip: FAMILY_TIPS.alone,
    },
    {
      id: "skills",
      icon: "grid",
      href: `${BASE}/explore/practice${q}`,
      name: P("Choose a Skill", "Elegir una destreza"),
      detail: P(
        "Listening, speaking, reading or writing. Pick the one your child wants to work on.",
        "Escuchar, hablar, leer o escribir. Elija la que su hijo o hija quiere practicar.",
      ),
      tip: FAMILY_TIPS.explain,
      links: CORE_DOMAINS.map((d) => ({
        id: d.toLowerCase(),
        icon: DOMAIN_META[d].icon,
        href: `${BASE}/${d}${q}`,
        name: P(DOMAIN_META[d].name, DOMAIN_META[d].es),
      })),
    },
    {
      id: "together",
      icon: "conversation",
      href: `${BASE}/talk-table${q}`,
      name: P("Play and Learn Together", "Jugar y aprender juntos"),
      detail: P(
        "Talk, read and play games together. No timers.",
        "Conversen, lean y jueguen juntos. Sin cronómetros.",
      ),
      tip: FAMILY_TIPS.listen,
      links: [
        {
          id: "talk",
          icon: "conversation",
          href: `${BASE}/talk-table${q}`,
          name: P("Talk Table", "Mesa de conversación"),
        },
        // Grades K–3 read in their own Story Time (/early); the Reading Room is written for grades 3–8.
        {
          id: "read",
          icon: "reading",
          href: early ? `${BASE}/early${q}` : `${BASE}/reading-room${q}`,
          name: P("Read together", "Leer juntos"),
        },
        {
          id: "play",
          icon: "star",
          href: `${BASE}/explore/play${q}`,
          name: P("Play a language game", "Jugar un juego de lenguaje"),
        },
        { id: "tour", icon: "road", href: tour.href, name: tour.name },
      ],
    },
    {
      id: "understand",
      icon: "passport",
      href: `${BASE}/family/progress${q}`,
      name: P("Understand My Child's Practice", "Entender la práctica de mi hijo o hija"),
      detail: P(
        "See what your child practiced and what to try next, in plain words. It is practice, not a test score.",
        "Vea lo que su hijo o hija practicó y qué probar después, en palabras sencillas. Es práctica, no un puntaje.",
      ),
      tip: FAMILY_TIPS.again,
      links: [
        {
          id: "progress",
          icon: "growth",
          href: `${BASE}/family/progress${q}`,
          name: P("What we practiced", "Lo que practicamos"),
        },
        {
          id: "passport",
          icon: "passport",
          href: `${BASE}/passport${q}`,
          name: P("My Passport", "Mi pasaporte"),
        },
      ],
    },
    {
      id: "help",
      icon: "help",
      href: `${BASE}/family/help${q}`,
      name: P("Get Help", "Obtener ayuda"),
      detail: P(
        "Short answers about saving work, the microphone, phones and where to start.",
        "Respuestas cortas sobre cómo guardar el trabajo, el micrófono, los teléfonos y por dónde empezar.",
      ),
    },
    tour,
    {
      id: "corner",
      icon: "families",
      href: `${BASE}/family/today${q}`,
      name: P("Today at home", "Hoy en casa"),
      detail: P(
        "A ready-to-use ten-minute plan for each day.",
        "Un plan de diez minutos para cada día.",
      ),
      links: [{ id: "family-corner", icon: "families", href: `${BASE}/family${q}`, name: P("Family Corner", "Rincón de la familia") }],
    },
  ];
}

/** The quick-start set for a band and length: the family planner's recommended session. */
async function quickSet(ctx, band, minutes) {
  const rows = await bandRows(band).catch(() => []);
  if (!rows.length) return [];
  return sessionOptions({ rows, band, minutes, tiers: ctx.prefs.tiers }).recommended;
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
            href="${BASE}/family-start?pick=${p.id}&grades=${p.id}"
            aria-current="${p.id === pick ? "true" : "false"}"
          >
            <span class="tb-pick-short">${p.short[0]}</span
            ><span class="tb-pick-name">${I.T(p.name[0], p.name[1])}</span>
          </a>`,
      )}
    </div>
  </div>`;
}

const tipHTML = (I, tip) =>
  tip ? html`<p class="fs-tip">${icon("bulb")} ${I.T(tip[0], tip[1])}</p>` : "";

function quickHTML(I, choice, { set, minutes, band, gradeName }) {
  const title = I.S(`Family practice · ${gradeName[0]}`, `Práctica en familia · ${gradeName[1]}`);
  const about = set.length ? sessionMinutes(set) : minutes;
  return html`<section class="fs-quick panel" aria-labelledby="fsQuickTitle">
    <h2 id="fsQuickTitle">
      <span class="fs-step" aria-hidden="true">2</span>${I.T(choice.name[0], choice.name[1])}
    </h2>
    <p>${I.T(choice.detail[0], choice.detail[1])}</p>
    <div class="fs-len" role="group" aria-labelledby="fsLenLabel">
      <span class="fs-len-label" id="fsLenLabel">${I.T("How long?", "¿Cuánto tiempo?")}</span>
      ${MINUTES.map(
        (m) =>
          html`<button
            type="button"
            class="band-btn"
            data-fs-minutes="${m}"
            aria-pressed="${String(m === minutes)}"
          >
            ${I.T(`${m} min`, `${m} min`)}
          </button>`,
      )}
    </div>
    ${
      set.length
        ? html`<a
            class="btn btn-primary btn-big fs-go"
            href="${playlistHref(set, title, band)}"
            data-family-start="quick"
          >
            ${icon("play")} ${I.T(`Start · about ${about} min`, `Empezar · unos ${about} min`)}
          </a>`
        : html`<a
            class="btn btn-primary btn-big fs-go"
            href="${choice.href}"
            data-family-start="quick"
          >
            ${icon("play")} ${I.T("Choose a short activity", "Elegir una actividad corta")}
          </a>`
    }
    ${tipHTML(I, choice.tip)}
    <p class="fine">
      ${I.T("Times are estimates, not a countdown.", "Los tiempos son aproximados, no una cuenta regresiva.")}
    </p>
  </section>`;
}

function choiceHTML(I, c) {
  return html`<li class="fs-door is-${c.id}">
    <a
      class="fs-door-main"
      href="${c.id === "help" ? "#fsHelp" : c.href}"
      data-family-start="${c.id}"
    >
      <span class="in-ic" aria-hidden="true">${icon(c.icon)}</span>
      <span class="in-choice-text"
        ><strong>${I.T(c.name[0], c.name[1])}</strong
        ><span>${I.T(c.detail[0], c.detail[1])}</span></span
      >
    </a>
    ${
      c.links
        ? html`<ul class="fs-links">
            ${c.links.map(
              (l) =>
                html`<li>
                  <a class="chip fs-link" href="${l.href}" data-family-start="${c.id}-${l.id}"
                    >${icon(l.icon)} ${I.T(l.name[0], l.name[1])}</a
                  >
                </li>`,
            )}
          </ul>`
        : ""
    }
    ${tipHTML(I, c.tip)}
  </li>`;
}

function choicesHTML(I, choices, quick) {
  const [first, ...rest] = choices;
  const main = rest.filter((c) => !["tour", "corner"].includes(c.id));
  const tour = choices.find((c) => c.id === "tour");
  const corner = choices.find((c) => c.id === "corner");
  return html`${quickHTML(I, first, quick)}
    <section class="fs-choices" aria-labelledby="fsChoiceLabel">
      <h2 class="tb-picker-label" id="fsChoiceLabel">
        <span class="fs-step" aria-hidden="true">3</span
        >${I.T("Or choose what to do", "O elija qué hacer")}
      </h2>
      <p class="fs-choice-intro">${I.T("Choose what fits your family today. You can return and try something else anytime.", "Elija lo que le sirva a su familia hoy. Puede volver y probar otra opción cuando quiera.")}</p>
      <div class="fs-groups">
        <section class="fs-group" aria-labelledby="fsPracticeTitle">
          <h3 id="fsPracticeTitle">${I.T("Practice and play", "Practicar y jugar")}</h3>
          <ul class="fs-doors">${main.filter((c) => ["skills", "together"].includes(c.id)).map((c) => choiceHTML(I, c))}</ul>
        </section>
        <section class="fs-group" aria-labelledby="fsSupportTitle">
          <h3 id="fsSupportTitle">${I.T("Progress and help", "Progreso y ayuda")}</h3>
          <ul class="fs-doors">${main.filter((c) => ["understand", "help"].includes(c.id)).map((c) => choiceHTML(I, c))}</ul>
        </section>
      </div>
      <p class="fs-finder"><a href="${BASE}/search?for=family&grades=${quick.band}">${I.T("Browse all family-friendly resources", "Ver todos los recursos para familias")} ${icon("arrow-right")}</a></p>
      <p class="fs-more">
        <a class="btn btn-secondary" href="${tour.href}" data-family-start="tour"
          >${icon(tour.icon)} ${I.T(tour.name[0], tour.name[1])}</a
        >
        <a class="btn btn-secondary" href="${corner.href}" data-family-start="corner"
          >${icon(corner.icon)} ${I.T(corner.name[0], corner.name[1])}</a
        >
      </p>
    </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const pick = pickFrom(ctx.route?.pick);
  let body;
  if (pick) {
    const band = normalizeBand(pick) || ctx.band;
    const minutes = quickMinutes(ctx.prefs);
    const set = await quickSet(ctx, band, minutes);
    const gradeName = GRADE_PICKS.find((p) => p.id === pick).name;
    body = choicesHTML(I, familyChoices(pick), { set, minutes, band, gradeName });
  } else {
    body = html`<p class="fine fs-wait">
      ${I.T("Choose a grade to see your choices, including a 5-minute activity and the Family Tour.", "Elija un grado para ver sus opciones, incluida una actividad de 5 minutos y el recorrido familiar.")}
    </p>`;
  }
  return {
    title: I.S("Families: start here", "Familias: empiecen aquí"),
    html: html`<article class="in-page in-hub fs-page" aria-labelledby="fsTitle">
      <div class="fs-lang">
        <span class="fs-lang-label" aria-hidden="true">${icon("language")} Language · Idioma</span>
        ${langSwitchHTML(I.mode, { large: true, idPrefix: "fsLang" })}
      </div>
      <header class="fs-head">
        <p class="eyebrow">${icon("families")} ${I.T("For families", "Para familias")}</p>
        <h1 id="fsTitle" tabindex="-1">
          ${I.T("Help Your Child Learn English at Home", "Ayude a su hijo a aprender inglés en casa")}
        </h1>
        <p class="lead">
          ${I.T("You do not need to speak perfect English to help. Pick a grade, then start with five minutes.", "No necesita hablar inglés perfecto para ayudar. Elija un grado y empiecen con cinco minutos.")}
        </p>
      </header>
      <div class="ov-start fs-start">${pickerHTML(I, pick)} ${body}</div>
      ${familyCoPilotHTML(ctx)}
      ${familyFaqHTML(I, pick)}
    </article>`,
  };
}

/** This page is the families' hub: remember the audience (a per-device convenience, never identity). */
export function mount() {
  rememberAudience("family");
}

export function onClick(e, ctx) {
  if (onFamilyCoPilotClick(e, ctx)) return true;
  const len = e.target.closest?.("[data-fs-minutes]");
  if (!len) return false;
  const minutes = Number(len.dataset.fsMinutes);
  if (!MINUTES.includes(minutes)) return false;
  ctx.setPrefs(familyPatch(ctx.prefs, { minutes }));
  ctx.rerender();
  return true;
}
