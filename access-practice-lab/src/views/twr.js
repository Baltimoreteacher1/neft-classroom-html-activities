// TWR: /twr (the hub), /twr/<strategy> (its three sets) and /twr/<strategy>/<set> (the player, src/twr/view.js).
// The hub reads no content: set ids are derived (registry setIdFor), so it opens instantly and shows real progress.
// One obvious next step on every screen: the hub leads with "Start here", the strategy page with "Start".
import { BAND_INFO } from "../bands.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { isDone } from "../twr/model.js";
import {
  SETS_PER_STRATEGY,
  STAGES,
  STRATEGIES,
  TWR_BANDS,
  isStrategy,
  setIdFor,
  strategiesFor,
} from "../twr/registry.js";
import { BASE, html, icon } from "../util.js";

let player = null; // src/twr/view.js, loaded only when a strategy page or set opens

const href = (slug, id, band) =>
  `${BASE}/twr${slug ? `/${slug}` : ""}${id ? `/${id}` : ""}?grades=${BAND_INFO[band].picker}`;

const setIds = (band, slug) =>
  Array.from({ length: SETS_PER_STRATEGY }, (_, i) => setIdFor(band, slug, i + 1));
const doneCount = (band, slug) => setIds(band, slug).filter(isDone).length;
const nextSet = (band, slug) =>
  setIds(band, slug).find((id) => !isDone(id)) || setIds(band, slug)[0];

/** The first unfinished set in learning order, or null when every set is finished. */
function startHere(band) {
  for (const s of strategiesFor(band)) {
    const id = setIds(band, s.slug).find((x) => !isDone(x));
    if (id)
      return {
        strat: s,
        id,
        started: strategiesFor(band).some((x) => doneCount(band, x.slug) > 0),
      };
  }
  return null;
}

function bandRowHTML(I, band) {
  return html`<nav class="twr-bands" aria-label="${I.S("Grade band", "Banda de grados")}">
    ${TWR_BANDS.map((b) => {
      const info = BAND_INFO[b];
      return html`<a
        class="twr-band ${b === band ? "is-on" : ""}"
        href="${href("", "", b)}"
        ${b === band ? html`aria-current="page"` : ""}
        >${I.T(info.label, info.labelEs)}</a
      >`;
    })}
  </nav>`;
}

function dotsHTML(I, band, slug) {
  const ids = setIds(band, slug);
  return html`<span
    class="twr-set-dots"
    role="img"
    aria-label="${I.S(`${doneCount(band, slug)} of ${ids.length} sets finished`, `${doneCount(band, slug)} de ${ids.length} conjuntos terminados`)}"
  >
    ${ids.map((id) => html`<span class="twr-set-dot ${isDone(id) ? "is-done" : ""}"></span>`)}
  </span>`;
}

function cardHTML(I, band, s) {
  const n = doneCount(band, s.slug);
  const label =
    n === SETS_PER_STRATEGY
      ? I.T("Practice again", "Practicar otra vez")
      : n
        ? I.T("Continue", "Continuar")
        : I.T("Start", "Empezar");
  return html`<li class="twr-card ${n === SETS_PER_STRATEGY ? "is-done" : ""}">
    <a href="${href(s.slug, "", band)}">
      <span class="twr-card-ico">${icon(s.icon)}</span>
      <span class="twr-card-title">${I.T(s.title[0], s.title[1])}</span>
      <span class="twr-card-blurb">${I.T(s.blurb[0], s.blurb[1])}</span>
      <span class="twr-card-foot"
        >${dotsHTML(I, band, s.slug)}<span class="twr-card-go"
          >${label} ${icon("arrow-right")}</span
        ></span
      >
    </a>
  </li>`;
}

function startCardHTML(I, band) {
  const go = startHere(band);
  if (!go)
    return html`<section class="twr-start is-all-done" aria-labelledby="twrStartH">
      <h2 id="twrStartH">
        ${icon("medal")}
        ${I.T("You finished every TWR set for this grade band!", "¡Terminaste todos los conjuntos de TWR de esta banda!")}
      </h2>
      <p>
        ${I.T("Pick any skill below to practice it again.", "Elige cualquier destreza para practicarla otra vez.")}
      </p>
    </section>`;
  const { strat, id, started } = go;
  return html`<section class="twr-start" aria-labelledby="twrStartH">
    <p class="twr-eyebrow">${icon("flag")} ${I.T("Start here", "Empieza aquí")}</p>
    <h2 id="twrStartH">${I.T(strat.title[0], strat.title[1])}</h2>
    <p>${I.T(strat.blurb[0], strat.blurb[1])}</p>
    <a class="btn btn-primary" href="${href(strat.slug, id, band)}"
      >${started ? I.T("Continue", "Continuar") : I.T("Start", "Empezar")} ${icon("arrow-right")}</a
    >
  </section>`;
}

function aboutHTML(I) {
  return html`<section class="twr-about" id="twr-about" data-fold aria-labelledby="twrAboutH">
    <h2 id="twrAboutH">
      ${I.T("How TWR works, for teachers and families", "Cómo funciona TWR, para docentes y familias")}
    </h2>
    <p>
      ${I.T(
        "TWR teaches writing sentence by sentence, using the content students are learning in science, social studies, math and reading. Each set takes about five minutes: learn one move, practice it, then write.",
        "TWR enseña a escribir oración por oración, con el contenido que los estudiantes aprenden en ciencias, estudios sociales, matemáticas y lectura. Cada conjunto toma unos cinco minutos: aprender un recurso, practicarlo y escribir.",
      )}
    </p>
    <ul class="twr-about-list">
      <li>
        <strong>${I.T("Teachers:", "Docentes:")}</strong>
        ${I.T("project a set for a 5-minute warm-up, or assign a strategy for independent practice. Each set has a classroom tip at the end.", "proyecta un conjunto como calentamiento de 5 minutos o asigna una estrategia para práctica independiente. Cada conjunto trae una sugerencia de aula al final.")}
      </li>
      <li>
        <strong>${I.T("Families:", "Familias:")}</strong>
        ${I.T("every set ends with a conversation starter you can use at home in English or Spanish.", "cada conjunto termina con una idea para conversar en casa en inglés o español.")}
      </li>
      <li>
        <strong>${I.T("Progress:", "Progreso:")}</strong>
        ${I.T("stars and finished sets are saved on this device only. Nothing is timed or ranked.", "las estrellas y los conjuntos terminados se guardan solo en este dispositivo. Nada tiene tiempo ni clasificación.")}
      </li>
    </ul>
    <p class="fine">
      ${I.T(
        "TWR is inspired by the sentence-first approach in The Writing Revolution (Hochman and Wexler). All activities and examples here are original.",
        "TWR se inspira en el enfoque de empezar por la oración de The Writing Revolution (Hochman y Wexler). Todas las actividades y ejemplos aquí son originales.",
      )}
    </p>
  </section>`;
}

function hubHTML(I, band) {
  const info = BAND_INFO[band];
  const list = strategiesFor(band);
  const total = list.length * SETS_PER_STRATEGY;
  const done = list.reduce((n, s) => n + doneCount(band, s.slug), 0);
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${info.picker}`],
      ["TWR", null],
    ])}
    <div class="twr-hub">
      <header class="twr-hero">
        <p class="twr-eyebrow">
          ${icon("writing")}
          ${I.T("Writing, one sentence at a time", "Escribir, una oración a la vez")}
        </p>
        <h1 id="twrH" tabindex="-1">TWR</h1>
        <p class="twr-lede">
          ${I.T("Strong writing starts with strong sentences. Pick a skill, practice for a few minutes, then write something of your own.", "Una buena escritura empieza con buenas oraciones. Elige una destreza, practica unos minutos y escribe algo tuyo.")}
        </p>
        ${bandRowHTML(I, band)}
        <p class="twr-count">
          ${icon("medal")}
          ${I.T(`${done} of ${total} sets finished on this device`, `${done} de ${total} conjuntos terminados en este dispositivo`)}
        </p>
      </header>
      ${startCardHTML(I, band)}
      ${STAGES.map((st, n) => {
        const inStage = list.filter((s) => s.stage === st.id);
        if (!inStage.length) return "";
        return html`<section class="twr-stage" aria-labelledby="twrStage${n}">
          <h2 id="twrStage${n}">
            <span class="twr-stage-n" aria-hidden="true">${n + 1}</span>
            ${I.T(st.title[0], st.title[1])}<span class="twr-stage-lead"
              >${I.T(st.lead[0], st.lead[1])}</span
            >
          </h2>
          <ul class="twr-cards">
            ${inStage.map((s) => cardHTML(I, band, s))}
          </ul>
        </section>`;
      })}
      ${aboutHTML(I)}
    </div>`;
}

function strategyHTML(I, band, strat, sets) {
  const all = sets.length;
  const next = sets.find((s) => !isDone(s.id)) || sets[0];
  const n = sets.filter((s) => isDone(s.id)).length;
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${BAND_INFO[band].picker}`],
      ["TWR", href("", "", band)],
      [I.S(strat.title[0], strat.title[1]), null],
    ])}
    <section class="prep-picker twr-strategy" aria-labelledby="twrStratH">
      <header class="prep-skill-head">
        <p class="prep-eyebrow">
          ${icon(strat.icon)} TWR · ${I.T(BAND_INFO[band].label, BAND_INFO[band].labelEs)}
        </p>
        <h1 id="twrStratH" tabindex="-1">${I.T(strat.title[0], strat.title[1])}</h1>
        <p class="prep-lede">${I.T(strat.blurb[0], strat.blurb[1])}</p>
        <ul class="prep-how">
          ${strat.how.map((h) => html`<li>${icon("check")} ${I.T(h[0], h[1])}</li>`)}
        </ul>
        <div class="prep-path-bar">
          <span class="prep-path-stat"
            >${icon("medal")}
            ${I.T(`${n} of ${all} sets finished on this device`, `${n} de ${all} conjuntos terminados en este dispositivo`)}</span
          >
          ${next ? html`<a class="btn btn-primary small" href="${href(strat.slug, next.id, band)}">${n > 0 && n < all ? I.T("Continue next set", "Continuar siguiente conjunto") : I.T("Start first set", "Empezar primer conjunto")} ${icon("arrow-right")}</a>` : ""}
        </div>
      </header>
      <ul class="prep-sets">
        ${sets.map((s, i) => {
          const done = isDone(s.id);
          return html`<li class="prep-set ${done ? "is-done" : ""}">
            <a href="${href(strat.slug, s.id, band)}">
              <span class="prep-set-step"
                ><span class="prep-set-node" aria-hidden="true"
                  >${done ? icon("check") : i + 1}</span
                ><span class="prep-set-title">${I.T(s.title, s.titleEs)}</span></span
              >
              <span class="prep-set-meta"
                >${s.area} · ${I.T(`about ${s.minutes} min`, `unos ${s.minutes} min`)}</span
              >
              ${done ? html`<span class="prep-set-done">${icon("check")} ${I.T("Done on this device", "Hecho en este dispositivo")}</span>` : ""}
            </a>
          </li>`;
        })}
      </ul>
    </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = TWR_BANDS.includes(ctx.band) ? ctx.band : "3-5";
  const slug = ctx.route?.id;
  const title = I.S("TWR · The Language Page", "TWR · The Language Page");
  if (isStrategy(slug) && STRATEGIES[slug].bands.includes(band)) {
    player ||= await import("../twr/view.js");
    if (ctx.route.setId) {
      const out = await player.render(ctx, slug, ctx.route.setId, band);
      if (out) return out;
    }
    player.unmount();
    const sets = await player.setsFor(slug, band);
    return {
      title: `${I.S(STRATEGIES[slug].title[0], STRATEGIES[slug].title[1])} · TWR`,
      html: strategyHTML(I, band, STRATEGIES[slug], sets),
    };
  }
  player?.unmount();
  return { title, html: hubHTML(I, band) };
}

export const onClick = (e, ctx) => (player ? player.onClick(e, ctx) : false);
export const onChange = (e, ctx) => player?.onChange(e, ctx);
export const onInput = (e, ctx) => (player ? player.onInput(e, ctx) : false);
export const unmount = () => player?.unmount();
