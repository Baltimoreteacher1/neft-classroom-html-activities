// Test center: full tests, single-skill tests and minis for the current band,
// plus the model-test item bank (grades 6–8) and WIDA's official practice link.
import { bandSwitchHTML, crumbsHTML } from "../components.js";
import { loadIndex, loadShared } from "../content.js";
import { loadTestRecord } from "../store.js";
import { i18nFor } from "../i18n.js";
import { ART, BASE, CORE_DOMAINS, html, icon } from "../util.js";
import { domainChipHTML, domainName } from "./test-report.js";
import { gradesText, modeText, rich } from "./test-modes.js";

const KIND = {
  full: ["Four-domain classroom practice", "Práctica de clase de las cuatro destrezas", "tests"],
  domain: ["Single-skill tests", "Pruebas de una destreza", "list"],
  mini: ["Short practice sets", "Conjuntos cortos de práctica", "clock"],
};

/** Status is always icon + words, never colour alone. */
function statusOf(I, rec) {
  if (rec.results)
    return {
      tone: "is-done",
      icon: "check",
      text: rec.results.total
        ? I.T(
            `Done · ${rec.results.correct}/${rec.results.total} auto-checked answers correct`,
            `Hecho · ${rec.results.correct}/${rec.results.total} respuestas correctas revisadas automáticamente`,
          )
        : I.T("Practice complete · teacher review needed", "Práctica completa · falta la revisión de tu docente"),
    };
  if (Object.keys(rec.answers || {}).length)
    return { tone: "is-progress", icon: "bookmark", text: I.T("In progress", "En curso") };
  return { tone: "is-new", icon: null, text: I.T("Not started", "Sin empezar") };
}

const modeCompareHTML = (I) => html`<section class="mode-compare" aria-labelledby="twoWays">
  <h2 id="twoWays">${I.T("Two ways to practice", "Dos maneras de practicar")}</h2>
  <p class="lead">${I.T("You choose the mode before you start. Switching mode restarts the test.", "Eliges el modo antes de empezar. Si cambias de modo, la prueba empieza de nuevo.")}</p>
  <div class="mode-cards is-static">
    <article class="mode-card is-guided">
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon("bulb")}</span>
        <span class="mode-card-title"
          ><strong>${modeText(I, "guided", "name")}</strong><span class="mode-tag">${modeText(I, "guided", "tag")}</span></span
        >
      </span>
      <p class="mode-card-copy">${I.T("Untimed, with hints, answer explanations and retries.", "Sin tiempo, con pistas, explicaciones de las respuestas y nuevos intentos.")}</p>
      <span class="mode-points">
        <span>${icon("check")}${I.T("Listen as often as you like", "Escucha tantas veces como quieras")}</span>
        <span>${icon("check")}${I.T("Hints, word banks and sentence frames", "Pistas, bancos de palabras y estructuras de oraciones")}</span>
        <span>${icon("check")}${I.T("Check an answer, then try again", "Revisa una respuesta y vuelve a intentar")}</span>
      </span>
    </article>
    <article class="mode-card is-independent">
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon("lock")}</span>
        <span class="mode-card-title"
          ><strong>${modeText(I, "independent", "name")}</strong
          ><span class="mode-tag">${modeText(I, "independent", "tag")}</span></span
        >
      </span>
      <p class="mode-card-copy">${I.T("Like test day, so you see what you can do on your own.", "Como el día de la prueba, para ver lo que puedes hacer por tu cuenta.")}</p>
      <span class="mode-points">
        <span>${icon("lock")}${I.T("Each recording plays once", "Cada grabación suena una sola vez")}</span>
        <span>${icon("lock")}${I.T("No sentence frames or word banks", "Sin estructuras de oraciones ni bancos de palabras")}</span>
        <span>${icon("lock")}${I.T("Section review before you submit", "Repaso de cada sección antes de enviar")}</span>
      </span>
    </article>
  </div>
</section>`;

export async function render(ctx) {
  const I = i18nFor(ctx);
  const [index, shared] = await Promise.all([loadIndex(), loadShared().catch(() => ({}))]);
  const tests = index.tests.filter((t) => t.band === ctx.band);
  const groups = Object.keys(KIND)
    .map((k) => [k, tests.filter((t) => t.kind === k)])
    .filter(([, list]) => list.length);
  const card = (t) => {
    const rec = loadTestRecord(t.id);
    const st = statusOf(I, rec);
    const domains = t.domain ? [t.domain] : CORE_DOMAINS;
    return html`<li class="test-card">
      <a href="${BASE}/test/${t.id}?grades=${ctx.band}">
        <span class="tc-domains">${domains.map((d) => domainChipHTML(d, domainName(I, d)))}</span>
        <strong>${t.title}</strong>
        <span class="tc-meta"
          ><span>${icon("list")}${I.T(`${t.items} questions`, `${t.items} preguntas`)}</span
          ><span>${icon("clock")}${I.T(`About ${t.minutes} min`, `Unos ${t.minutes} min`)}</span></span
        >
        <span class="status ${st.tone}">${st.icon ? icon(st.icon) : ""}${st.text}</span>
      </a>
      <p class="mode-links" role="group" aria-label="${I.S(`Start ${t.title} in a mode`, `Empezar ${t.title} en un modo`)}">
        <a class="is-guided" href="${BASE}/test/${t.id}?grades=${ctx.band}&rehearsal=guided"
          >${icon("bulb")}${modeText(I, "guided", "name")}</a
        >
        <a
          class="is-independent"
          href="${BASE}/test/${t.id}?grades=${ctx.band}&rehearsal=independent"
          >${icon("lock")}${modeText(I, "independent", "name")}</a
        >
      </p>
    </li>`;
  };
  return {
    title: I.S("Practice tests", "Pruebas de práctica"),
    html: html`<div class="tests-page d-model-test">
      ${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [I.S("Practice tests", "Pruebas de práctica"), null],
      ])}
      <header class="test-hero">
        <div class="test-hero-copy">
          <p class="eyebrow">${gradesText(I, ctx.band)} · ${I.T("Classroom practice", "Práctica de clase")}</p>
          <h1 tabindex="-1">${I.T("Practice tests", "Pruebas de práctica")}</h1>
          <p class="lead">
            ${I.T(
              "Practice listening, reading, speaking, and writing. These classroom activities build language confidence; they do not predict an ACCESS score. No clock unless you turn one on.",
              "Practica escuchar, leer, hablar y escribir. Estas actividades de clase fortalecen tu confianza con el idioma; no predicen un puntaje de ACCESS. No hay reloj, a menos que tú lo actives.",
            )}
          </p>
          ${bandSwitchHTML(ctx.band, ctx.bands)}
        </div>
        <img class="test-hero-art" src="${ART}/test-intro.svg" alt="" width="480" height="300" />
      </header>
      ${modeCompareHTML(I)}
      <p class="test-note disclaimer">
        ${icon("info")}<span
          >${I.T(
            "Actual ACCESS Online adapts Listening and Reading and uses those results for Speaking and Writing tier placement. These fixed classroom sets do not reproduce that routing, timing, scoring, or difficulty. Grade 3 ACCESS Writing uses paper; ask your teacher about your assigned format.",
            "El ACCESS Online real adapta Escuchar y Leer, y usa esos resultados para asignar el nivel (tier) de Hablar y Escribir. Estos conjuntos fijos de clase no reproducen esa ruta, el tiempo, la puntuación ni la dificultad. La sección de Escritura de ACCESS en 3.er grado usa papel; pregunta a tu docente cuál es tu formato asignado.",
          )}</span
        >
      </p>
      ${
        groups.length
          ? groups.map(
              ([k, list]) =>
                html`<section class="test-group" aria-labelledby="grp-${k}">
                  <h2 class="section-title" id="grp-${k}">${icon(KIND[k][2])}${I.T(KIND[k][0], KIND[k][1])}</h2>
                  <ul class="test-grid">
                    ${list.map(card)}
                  </ul>
                </section>`,
            )
          : html`<p class="panel">${I.T(`Practice tests for Grades ${ctx.band.replace("-", "–")} are coming soon.`, `Las pruebas de práctica de los grados ${ctx.band.replace("-", "–")} llegarán pronto.`)}</p>`
      }
      <div class="test-extras">
        ${
          ctx.band === "6-8"
            ? html`<section class="test-extra">
                <h2>${icon("list")}${I.T("Model test items", "Preguntas de prueba modelo")}</h2>
                <p>${I.T("Practice single test-style items one at a time, with feedback after each.", "Practica preguntas al estilo de la prueba, una por una, con comentarios después de cada una.")}</p>
                <div class="row-actions">
                  <a class="btn" href="${BASE}/Model-Test/6-8/A">${I.T("Model items · Part A", "Preguntas modelo · Parte A")}</a
                  ><a class="btn" href="${BASE}/Model-Test/6-8/B">${I.T("Model items · Part B", "Preguntas modelo · Parte B")}</a>
                </div>
              </section>`
            : ""
        }
        <section class="test-extra">
          <h2>${icon("external")}${I.T("Try the official WIDA practice", "Prueba la práctica oficial de WIDA")}</h2>
          <p>
            ${rich(
              I,
              html`WIDA's free Test Demo (about 15 minutes) and Test Practice items use the real test
              screens. Open the page, then choose <strong>Test Demo</strong> — or choose
              <strong>WIDA ACCESS</strong>, then <strong>WIDA ACCESS Test Practice</strong>.`,
              html`La Test Demo gratuita de WIDA (unos 15 minutos) y los ejercicios de Test Practice usan las pantallas reales de la prueba. Abre la página y elige <strong>Test Demo</strong>, o elige <strong>WIDA ACCESS</strong> y luego <strong>WIDA ACCESS Test Practice</strong>.`,
            )}
          </p>
          <div class="row-actions">
            <a
              class="btn"
              href="${shared.widaPractice || "https://wida.wisc.edu"}"
              target="_blank"
              rel="noopener"
              >${I.T("Open WIDA's Test Demo & Practice", "Abrir la Test Demo y Practice de WIDA")}${icon("external")}</a
            >
          </div>
        </section>
      </div>
    </div>`,
  };
}
