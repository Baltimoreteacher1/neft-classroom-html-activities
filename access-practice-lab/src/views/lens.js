// My Words (/lens): the Language Lens. Shows the words this learner has met across the lab and what they did with each:
// saw or heard, chose in a task, said, wrote. It reads the word record (src/lang/word-encounters.js) and nothing else.
// A record of what happened, never a score: no level, rank, streak, percent or "mastered". Words only; what the learner
// said or wrote is not in it. Doc and rules: LENS.md.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { lensSummary, loadWords } from "../lang/word-encounters.js";
import { BASE, ensureStylesheet, html, icon } from "../util.js";

/** lens.css loads here, on /lens only, so the lab shell does not carry a stylesheet most visits never use. */
const ensureStyles = () => ensureStylesheet("lens.css");

/** Where a count came from, in the words a learner uses for the activity. */
const SOURCE_NAMES = {
  wordlab: ["Word Lab", "Laboratorio de palabras"],
  "vocab-academy": ["Vocabulary Academy", "Academia de vocabulario"],
  "teach-back": ["Teach It Back", "Enséñalo de vuelta"],
  "claim-check": ["Misconception Detective", "Detective de ideas equivocadas"],
  demand: ["Language Demand Analyzer", "Analizador de demanda de lenguaje"],
  writing: ["Writing", "Escritura"],
  speaking: ["Speaking", "Habla"],
  reading: ["Reading", "Lectura"],
  arcade: ["Games", "Juegos"],
  bcpss: ["Lesson activities", "Actividades de lección"],
  family: ["Family practice", "Práctica en familia"],
  other: ["Other activities", "Otras actividades"],
};

const link = (path, band) => `${BASE}/${path}?grades=${band}`;
const chips = (words) =>
  html`<ul class="ln-chips">
    ${words.map((w) => html`<li lang="en">${w}</li>`)}
  </ul>`;

/** One collapsible group of words. Closed groups still list every word to a screen reader once opened. */
function group(I, id, title, words, note) {
  if (!words.length) return "";
  return html`<details class="ln-group" id="ln-${id}">
    <summary>${title} <span class="ln-count">${words.length}</span></summary>
    <p class="fine">${note}</p>
    ${chips(words)}
  </details>`;
}

function emptyHTML(I, band) {
  return html`<div class="panel ln-empty">
    <h2>${I.T("No words yet", "Todavía no hay palabras")}</h2>
    <p>
      ${I.T("As you practice, the words you meet show up here: the ones you saw, chose, said and wrote. Try an activity and come back.", "Mientras practicas, aquí aparecen las palabras que conoces: las que viste, elegiste, dijiste y escribiste. Prueba una actividad y vuelve.")}
    </p>
    <div class="row-actions">
      <a class="btn btn-primary" href="${link("wordlab", band)}"
        >${icon("words")} ${I.T("Open Word Lab", "Abrir el Laboratorio de palabras")}</a
      >
      <a class="btn" href="${link("teach-back", band)}"
        >${I.T("Teach It Back", "Enséñalo de vuelta")}</a
      >
    </div>
  </div>`;
}

function factsHTML(I, sum) {
  const fact = (n, en, es) =>
    html`<div class="ln-fact">
      <dt>${I.T(en, es)}</dt>
      <dd>${n}</dd>
    </div>`;
  return html`<dl class="ln-facts">
    ${fact(sum.total, "Words met", "Palabras conocidas")}
    ${fact(sum.said.length, "Said out loud", "Dichas en voz alta")}
    ${fact(sum.wrote.length, "Written", "Escritas")}
    ${fact(sum.independent.length, "Used with no help open", "Usadas sin ayuda abierta")}
  </dl>`;
}

function nextHTML(I, sum, band) {
  const tryUsing = sum.tryUsing.length
    ? html`<section class="panel ln-next" aria-labelledby="ln-try">
        <h2 id="ln-try">${I.T("Try using these", "Prueba a usar estas")}</h2>
        <p>
          ${I.T("You have met these words a few times but have not said or written them yet. Pick one and use it in a sentence.", "Has conocido estas palabras varias veces, pero todavía no las has dicho ni escrito. Elige una y úsala en una oración.")}
        </p>
        ${chips(sum.tryUsing.slice(0, 12))}
        <div class="row-actions">
          <a class="btn" href="${link("write", band)}"
            >${icon("writing")} ${I.T("Write with them", "Escribir con ellas")}</a
          >
          <a class="btn" href="${link("speak", band)}"
            >${icon("speaking")} ${I.T("Say them", "Decirlas")}</a
          >
        </div>
      </section>`
    : "";
  const due = sum.due.length
    ? html`<section class="panel ln-next" aria-labelledby="ln-due">
        <h2 id="ln-due">${I.T("Time to look at these again", "Hora de volver a estas")}</h2>
        <p>
          ${I.T("A short break helps a word stick. These are ready for another try.", "Una pausa corta ayuda a recordar una palabra. Estas están listas para otro intento.")}
        </p>
        <ul class="ln-due">
          ${sum.due.map((d) => html`<li><span lang="en">${d.w}</span> <span class="fine">${d.daysSince === 1 ? I.T("last tried yesterday", "último intento: ayer") : I.T(`last tried ${d.daysSince} days ago`, `último intento: hace ${d.daysSince} días`)}</span></li>`)}
        </ul>
        <a class="btn" href="${link("wordlab", band)}"
          >${I.T("Practice in Word Lab", "Practicar en el Laboratorio de palabras")}</a
        >
      </section>`
    : "";
  return html`${tryUsing}${due}`;
}

function sourcesHTML(I, sum) {
  const rows = Object.entries(sum.bySource).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!rows.length) return "";
  return html`<section class="panel" aria-labelledby="ln-src">
    <h2 id="ln-src">${I.T("Where your words came from", "De dónde vienen tus palabras")}</h2>
    <ul class="ln-sources">
      ${rows.map(([k, n]) => html`<li><span>${I.T(...SOURCE_NAMES[k])}</span> <span class="ln-count">${n}</span></li>`)}
    </ul>
  </section>`;
}

export async function render(ctx) {
  await ensureStyles();
  const I = i18nFor(ctx);
  const title = I.S("My Words", "Mis palabras");
  const sum = lensSummary(loadWords());
  const body = sum.total
    ? html`${factsHTML(I, sum)} ${nextHTML(I, sum, ctx.band)}
        <section class="ln-lists" aria-labelledby="ln-all">
          <h2 id="ln-all">${I.T("All my words", "Todas mis palabras")}</h2>
          ${group(I, "wrote", I.T("Written", "Escritas"), sum.wrote, I.T("Words you used in your own writing.", "Palabras que usaste en tu propia escritura."))}
          ${group(I, "said", I.T("Said out loud", "Dichas en voz alta"), sum.said, I.T("Words you used when you spoke.", "Palabras que usaste al hablar."))}
          ${group(I, "tried", I.T("Chosen in a task", "Elegidas en una tarea"), sum.tried, I.T("Words you picked in a game or exercise but have not yet said or written.", "Palabras que elegiste en un juego o ejercicio, pero que todavía no has dicho ni escrito."))}
          ${group(I, "met", I.T("Seen or heard", "Vistas u oídas"), sum.met, I.T("Words you have met so far.", "Palabras que conoces hasta ahora."))}
        </section>
        ${sourcesHTML(I, sum)}`
    : emptyHTML(I, ctx.band);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
        [title, null],
      ])}
      <div class="ln">
        <header class="ln-head">
          <h1 tabindex="-1">${I.T("My Words", "Mis palabras")}</h1>
          <p class="lead">
            ${I.T("The words you have met across the lab, and what you did with each one. It is a record, not a score. Only the words are kept, on this device.", "Las palabras que has conocido en el laboratorio y lo que hiciste con cada una. Es un registro, no una calificación. Solo se guardan las palabras, en este dispositivo.")}
          </p>
        </header>
        ${body}
      </div>`,
  };
}
