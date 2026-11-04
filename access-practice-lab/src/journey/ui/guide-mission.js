// Journey guide: one mission as a card (overview, WIDA references, steps with direct links and evidence) and the
// expanded pack details. Pure markup helpers; nothing here reads or writes storage or any learner data.
import { BASE, html } from "../../util.js";
import { FEATURES, MISSIONS, STEPS, missionNumber, unitOf } from "../curriculum.js";
import { dimensionNotes, widaFor } from "../wida.js";
import {
  BAND_NAME,
  DOMAIN_NAME,
  ENV_NAME,
  KIND_DOMAIN,
  KLU_NAME,
  SCAFFOLDS,
  STEP_DOMAINS,
  STEP_EVIDENCE,
  STEP_SCAFFOLDS,
  familyPath,
  stepDomains,
  stepPath,
} from "./guide-data.js";

const tx = (I, pair) => I.T(pair[0], pair[1]);
const txS = (I, pair) => I.S(pair[0], pair[1]);
/** Four-element data rows [labelEn, labelEs, textEn, textEs]. */
const text4 = (I, r) => I.T(r[2], r[3]);

const DIM_NAME = {
  Discourse: ["Discourse", "Discurso"],
  Sentence: ["Sentence", "Oración"],
  "Word/Phrase": ["Word and phrase", "Palabra y frase"],
};
const DIM_ES = {
  Discourse:
    "Cómo se une toda la pieza: el orden de las ideas, los vínculos entre ellas y cómo se ajusta a su propósito y a su público.",
  Sentence:
    "Cómo se construyen las oraciones: quién hace qué, cómo se unen las ideas dentro de una oración y qué formas de oración necesita la tarea.",
  "Word/Phrase":
    "Qué palabras y frases llevan el significado exacto: palabras del tema, verbos precisos y partes de las palabras.",
};
const MODE_NAME = {
  Interpretive: ["Interpretive", "Interpretativo"],
  Expressive: ["Expressive", "Expresivo"],
};

const domainChips = (I, list) =>
  list.length
    ? html`<ul class="jg-doms" aria-label="${I.S("Domains", "Dominios")}">
        ${list.map((d) => html`<li class="jg-dom d-${d.toLowerCase()}">${tx(I, DOMAIN_NAME[d])}</li>`)}
      </ul>`
    : html`<span class="jg-dom jg-dom-open"
        >${I.T("Speaking or Writing (open Details)", "Hablar o escribir (abre Detalles)")}</span
      >`;

function scaffoldList(I, step) {
  const ids = STEP_SCAFFOLDS[step];
  if (!ids.length)
    return html`<p class="jg-fine">
      ${I.T("No supports are shown. This is independent work.", "No se muestra ningún apoyo. Es trabajo independiente.")}
    </p>`;
  return html`<ul class="jg-scaf">
    ${ids.map((id) => html`<li><strong>${tx(I, SCAFFOLDS[id])}</strong>: ${text4(I, SCAFFOLDS[id])}</li>`)}
  </ul>`;
}

function stepLinks(I, band, id, step) {
  const path = stepPath(band, id, step.id);
  const name = I.S(...step.label);
  return html`<div class="jg-linkrow no-print">
    <a class="btn btn-secondary" href="${path}" aria-label="${I.S("Open", "Abrir")} ${name}"
      >${I.T("Open student step", "Abrir el paso del estudiante")}</a
    >
    <button
      type="button"
      class="btn btn-secondary"
      data-gd-copy="${path}"
      aria-label="${I.S("Copy link for", "Copiar el enlace de")} ${name}"
    >
      ${I.T("Copy link", "Copiar enlace")}
    </button>
    <span class="jg-copied" role="status" data-gd-copied></span>
  </div>`;
}

function stepRow(I, ctx, step) {
  const { id, band, modes, compact } = ctx;
  const doms = stepDomains(step.id, modes, id, band);
  return html`<li class="jg-step" data-step="${step.id}">
    <div class="jg-stephead">
      <span class="jg-stepn" aria-hidden="true">${step.n}</span>
      <h4>${tx(I, step.label)}</h4>
      <span class="jg-min">${I.T(`about ${step.minutes} min`, `unos ${step.minutes} min`)}</span>
    </div>
    ${domainChips(I, doms)}
    <p class="jg-fine">${tx(I, STEP_DOMAINS[step.id].note)}</p>
    <p>
      <strong
        >${I.T("What the lab records on this device", "Qué registra el laboratorio en este dispositivo")}:</strong
      >
      ${tx(I, STEP_EVIDENCE[step.id])}
    </p>
    ${
      compact
        ? ""
        : html`<details class="jg-sub">
            <summary>${I.T("Supports available", "Apoyos disponibles")}</summary>
            ${scaffoldList(I, step.id)}
          </details>`
    }
    ${stepLinks(I, band, id, step)}
  </li>`;
}

function widaBlock(I, id, band) {
  const w = widaFor(id, band);
  if (!w) return "";
  return html`<details class="jg-sub jg-wida">
    <summary>${I.T("WIDA references", "Referencias de WIDA")} (${txS(I, BAND_NAME[band])})</summary>
    <p>
      <strong>${I.T("Standard", "Estándar")}:</strong> <span lang="en">${w.standardLabel}</span>
      <code>${w.standard}</code>
    </p>
    <p>
      <strong
        >${I.T("Framework rows beside this mission", "Filas del marco junto a esta misión")}:</strong
      >
    </p>
    <ul class="jg-rows">
      ${w.expectationRows.map((r) => html`<li><code>${r.id}</code> ${r.mode && MODE_NAME[r.mode] ? html`<span class="jg-fine">${tx(I, MODE_NAME[r.mode])}</span>` : ""}</li>`)}
    </ul>
    <p><strong>${I.T("Language dimensions", "Dimensiones del lenguaje")}:</strong></p>
    <dl class="jg-dims">
      ${w.dimensions.map(
        (d) =>
          html`<dt>${tx(I, DIM_NAME[d])}</dt>
            <dd>${I.T(dimensionNotes[d], DIM_ES[d])}</dd>`,
      )}
    </dl>
    <p class="jg-fine">${tx(I, w.note)}</p>
  </details>`;
}

function showBlock(I, ctx) {
  const { id, band } = ctx;
  return html`<section
    class="jg-verify"
    aria-label="${I.S("Independent verification", "Verificación independiente")}"
  >
    <h4>${I.T("Independent verification: Show", "Verificación independiente: Muestra")}</h4>
    <p>
      ${I.T("The Show step is a new task in the same Key Language Use with no help open. It is the only attempt the lab saves as independent. A mission counts as independently shown only when Show was completed with no help opened.", "El paso Muestra es una tarea nueva con el mismo uso clave del lenguaje y sin ayuda abierta. Es el único intento que el laboratorio guarda como independiente. Una misión cuenta como mostrada de forma independiente solo cuando Muestra se completó sin abrir ayuda.")}
    </p>
    ${ctx.compact ? "" : html`<p class="jg-fine">${I.T("Records on this device: the new response, its word count, the Key Language Use moves it shows, and that it was independent.", "Registra en este dispositivo: la respuesta nueva, su número de palabras, los movimientos del uso clave que muestra y que fue independiente.")}</p>`}
    ${stepLinks(
      I,
      band,
      id,
      STEPS.find((s) => s.id === "show"),
    )}
  </section>`;
}

const featureList = (I, ids) =>
  html`<ul class="jg-feat">
    ${ids.map((f) => html`<li>${tx(I, FEATURES[f].label)}</li>`)}
  </ul>`;

function spiralBlock(I, m) {
  return html`<p>
      <strong>${I.T("Language features taught", "Rasgos del lenguaje que se enseñan")}:</strong>
    </p>
    ${featureList(I, m.features)}
    ${m.reviews.length ? html`<p><strong>${I.T("Revisits", "Repasa")}:</strong> ${m.reviews.map((r, i) => html`${i ? ", " : ""}<a href="#${r}">${tx(I, MISSIONS[r].title)}</a>`)}</p>` : ""}`;
}

function goalBlock(I, m) {
  return html`<dl class="jg-goals">
    ${Object.keys(BAND_NAME).map(
      (b) =>
        html`<dt>${I.T("Language goal", "Meta de lenguaje")}, ${txS(I, BAND_NAME[b])}</dt>
          <dd>${tx(I, m.goal[b])}</dd>`,
    )}
  </dl>`;
}

/** One mission card. `ctx` = { id, band, modes, compact, hub }. */
export function missionCard(I, ctx) {
  const { id, band } = ctx;
  const m = MISSIONS[id];
  const u = unitOf(id);
  return html`<article class="jg-mission" id="${id}" data-gd-mission="${id}" data-klu="${m.klu}">
    <header class="jg-mhead">
      <p class="jg-eyebrow">
        ${I.T("Unit", "Unidad")} ${u.n} · ${tx(I, KLU_NAME[m.klu])} ·
        ${tx(I, ENV_NAME[m.environment])} · ${I.T("Mission", "Misión")} ${missionNumber(id)}
      </p>
      <h3>${tx(I, m.title)}</h3>
      <p>${tx(I, m.tagline)}</p>
    </header>
    ${goalBlock(I, m)} ${spiralBlock(I, m)} ${ctx.compact ? "" : widaBlock(I, id, band)}
    <h4 class="jg-h4">${I.T("Six steps and direct links", "Seis pasos y enlaces directos")}</h4>
    <ol class="jg-steps">
      ${STEPS.map((s) => stepRow(I, ctx, s))}
    </ol>
    ${showBlock(I, ctx)} ${missionFooter(I, ctx)}
  </article>`;
}

function missionFooter(I, ctx) {
  const { id, band, hub } = ctx;
  return html`<div class="jg-foot no-print">
      <a class="btn btn-secondary" href="${familyPath(band, id)}"
        >${I.T("Family companion", "Compañero familiar")}</a
      >
      <a class="btn btn-secondary" href="${BASE}/journey/${id}?grades=${band}"
        >${I.T("Mission overview", "Resumen de la misión")}</a
      >
      <button
        type="button"
        class="btn btn-secondary"
        data-gd-details="${id}"
        aria-expanded="false"
        aria-controls="gd-pack-${id}"
      >
        ${I.T("Details", "Detalles")}
      </button>
    </div>
    <div
      class="jg-pack"
      id="gd-pack-${id}"
      data-gd-pack="${id}"
      data-hub="${hub ? "1" : ""}"
      hidden
    ></div>`;
}

// ── pack details (loaded when the teacher opens Details) ─────────────────────
const row = (I, label, body) =>
  html`<dt>${label}</dt>
    <dd>${body}</dd>`;
const en = (text) => html`<span lang="en">${text}</span>`;

function kindText(I, task) {
  const d = KIND_DOMAIN[task?.kind];
  if (!d) return "";
  return html`${tx(I, DOMAIN_NAME[d])}
  (${task.kind === "converse" ? I.T("conversation", "conversación") : I.T("written draft", "borrador escrito")}),
  ${I.T(`at least ${task.minWords} words`, `al menos ${task.minWords} palabras`)}`;
}

/** The expanded details for one mission and band, read from the lazily loaded pack. No answer keys are shown. */
export function packDetailsHTML(I, id, band, pack) {
  const b = pack?.bands?.[band];
  if (!b)
    return html`<p class="jg-fine">
      ${I.T("This mission pack has no content for this grade band.", "Este paquete de misión no tiene contenido para esta banda de grados.")}
    </p>`;
  const listen = b.understand?.listen;
  const read = b.understand?.read;
  const comm = KIND_DOMAIN[b.communicate?.kind];
  return html`<div class="jg-packbody">
    <h4>${I.T("Mission details", "Detalles de la misión")} (${txS(I, BAND_NAME[band])})</h4>
    <dl class="jg-dl">
      ${row(I, I.T("Story and setting", "Historia y escenario"), tx(I, b.context.title))}
      ${row(I, I.T("Discover", "Descubre"), I.T(`Examine ${b.discover.collect} of ${b.discover.objects.length} observations, change what happens, then explain to the partner (${b.discover.respond.minWords} words or more).`, `Examina ${b.discover.collect} de ${b.discover.objects.length} observaciones, cambia lo que ocurre y luego explica al compañero (${b.discover.respond.minWords} palabras o más).`))}
      ${row(I, I.T("Understand", "Comprende"), I.T(`Listening activity: ${listen?.mode}. Reading challenge: ${read?.challenge?.type}, in a passage of ${read?.passage?.length} sentences.`, `Actividad de escucha: ${listen?.mode}. Reto de lectura: ${read?.challenge?.type}, en un texto de ${read?.passage?.length} oraciones.`))}
      ${row(
        I,
        I.T("Build", "Construye"),
        html`<ul>
          ${(b.build || []).map((t) => html`<li>${en(t.title)} <span class="jg-fine">(${t.module})</span></li>`)}
        </ul>`,
      )}
      ${row(I, I.T("Communicate", "Comunica"), html`${kindText(I, b.communicate)}<br />${en(b.communicate.prompt)}`)}
      ${row(I, I.T("Show", "Muestra"), html`${kindText(I, b.show)}<br />${en(b.show.prompt)}`)}
      ${row(
        I,
        I.T("Domain alignment", "Alineación con los dominios"),
        comm
          ? html`${I.T("Listening and Reading in step 2; ", "Escuchar y leer en el paso 2; ")}${tx(I, DOMAIN_NAME[comm])}${I.T(" in steps 4 to 6.", " en los pasos 4 a 6.")}`
          : "",
      )}
      ${row(I, I.T("Vocabulary", "Vocabulario"), I.T(`${b.vocab.length} words with a plain meaning and a Spanish gloss.`, `${b.vocab.length} palabras con un significado sencillo y una glosa en español.`))}
    </dl>
    <p class="jg-fine">
      ${I.T("Task text is English practice content. Answer keys are not shown here.", "El texto de las tareas es contenido de práctica en inglés. Aquí no se muestran las claves de respuesta.")}
    </p>
  </div>`;
}
