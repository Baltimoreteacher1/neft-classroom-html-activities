// Thematic Units (/units): a publisher-style course path. Each unit is a theme with 5 lessons and a performance task.
// Routes: /units (all units), /units/<unit> (overview; ?tab=family|plan), /units/<unit>/<1-5|task|certificate|packet>.
// Lesson pages sequence the lab's existing activities (by id) between original unit texts and tasks; progress is
// one local record (src/lang/units.js). Everything runs on this device.
import { setComponentsI18n } from "../components.js";
import { i18nFor } from "../i18n.js";
import { LESSON_IDS, bandProgress, unitMinutes } from "../lang/units.js";
import { stop as stopSpeech } from "../speech.js";
import { trackDisclosures } from "../studio-ui.js";
import { ART, html, icon } from "../util.js";
import {
  DISCLAIMER,
  DOMAIN_ICON,
  NOT_FOUND,
  barHTML,
  bandOwning,
  domainChip,
  loadSession,
  textBlocks,
  unitCrumbs,
  unitsHref,
  progressFor,
  recOf,
} from "./units-common.js";
import * as lessonView from "./units-lesson.js";
import { certificateHTML, unitMapHTML } from "./units-map.js";
import { packetHTML, planHTML } from "./units-plan.js";

let current = null; // { session, unit, sub } for the click handlers

function startLabel(I, p) {
  if (!p.started) return I.T("Start the unit", "Empezar la unidad");
  if (p.complete) return I.T("Review the unit", "Repasar la unidad");
  return p.next === "task"
    ? I.T("Continue: the project", "Continuar: el proyecto")
    : I.T(`Continue: Lesson ${p.next}`, `Continuar: Lección ${p.next}`);
}

function unitCard(I, session, unit) {
  const p = progressFor(session, unit);
  const weeks = unit.pacing.length > 12 ? "3" : "2";
  return html`<a
    class="un-card un-accent-${unit.accent}"
    href="${unitsHref(session.band, unit.id)}"
  >
    <span class="un-card-top"
      ><span class="un-card-ico">${icon(unit.icon)}</span
      ><span class="un-card-n">${I.T(`Unit ${unit.n}`, `Unidad ${unit.n}`)}</span
      >${p.complete ? html`<span class="un-card-done">${icon("check")} ${I.T("Finished", "Terminada")}</span>` : ""}</span
    >
    <strong class="un-card-title">${I.TO(unit.title)}</strong>
    <span class="un-card-text">${I.TO(unit.tagline)}</span>
    ${barHTML(I, p.finished, p.stops, I.S("Unit progress", "Progreso de la unidad"))}
    <span class="un-card-meta"
      >${I.T(`5 lessons and a project · about ${weeks} weeks`, `5 lecciones y un proyecto · unas ${weeks} semanas`)}${p.started && !p.complete ? ` · ${I.T(`${p.finished} of ${p.stops} stops`, `${p.finished} de ${p.stops} paradas`)}` : ""}</span
    >
  </a>`;
}

function hubHTML(I, session) {
  const { band, units } = session;
  const bp = bandProgress(units, session.state, session.activityDone);
  const resume = units
    .map((u) => [u, progressFor(session, u)])
    .find(([, p]) => p.started && !p.complete);
  return html`${unitCrumbs(I, band)}
    <div class="un-hub">
      <section class="room-hero studio-hero un-hero-hub">
        <div class="room-hero-copy">
          <p class="eyebrow">
            ${I.T(`Grades ${band.replace("-", "–")} · ${units.length} thematic units`, `Grados ${band.replace("-", "–")} · ${units.length} unidades temáticas`)}
          </p>
          <h1 tabindex="-1">${I.T("Units", "Unidades")}</h1>
          <p class="lead">
            ${I.T("Each unit is a big theme with five lessons that bring listening, speaking, reading and writing together, then a project you share with a real audience.", "Cada unidad es un gran tema con cinco lecciones que unen escuchar, hablar, leer y escribir, y luego un proyecto que compartes con un público real.")}
          </p>
          ${bp.finished ? html`<p class="fine">${I.T(`${bp.finished} of ${bp.stops} stops finished across all units.`, `${bp.finished} de ${bp.stops} paradas terminadas en todas las unidades.`)}</p>` : ""}
        </div>
        <div class="room-hero-art">
          <img src="${ART}/domain-reading.svg" width="480" height="360" alt="" decoding="async" />
        </div>
      </section>
      ${
        resume
          ? html`<section class="panel un-resume" aria-labelledby="unResume">
              <h2 id="unResume">${I.T("Pick up where you left off", "Sigue donde lo dejaste")}</h2>
              <p><strong>${I.TO(resume[0].title)}</strong></p>
              <a
                class="btn btn-primary"
                href="${unitsHref(band, resume[0].id, resume[1].next || "")}"
                >${startLabel(I, resume[1])} ${icon("arrow-right")}</a
              >
            </section>`
          : ""
      }
      <section class="un-grid" aria-label="${I.S("All units", "Todas las unidades")}">
        ${units.map((u) => unitCard(I, session, u))}
      </section>
      ${DISCLAIMER(I)}
    </div>`;
}

function goalsHTML(I, unit) {
  return html`<ul class="un-goals">
    ${["Listening", "Speaking", "Reading", "Writing"].map((d) => html`<li>${domainChip(I, d)}<span>${I.TO(unit.goals[d])}</span></li>`)}
  </ul>`;
}

function vocabHTML(I, unit) {
  return html`<ul class="un-vocab">
    ${unit.vocab.map(
      (v) =>
        html`<li class="un-vocab-item">
          <span class="un-term-row"
            ><strong lang="en">${v.term}</strong><span class="un-es" lang="es">${v.es}</span>
            <button
              type="button"
              class="ghost small"
              data-say="${v.term}"
              aria-label="${I.S(`Hear ${v.term}`, `Escuchar ${v.term}`)}"
            >
              ${icon("volume")}
            </button></span
          ><span class="fine">${I.TO(v.def)}</span>
        </li>`,
    )}
  </ul>`;
}

function lessonsHTML(I, session, unit, p) {
  return html`<ol class="un-lessons">
    ${unit.lessons.map((l, i) => {
      const lp = p.lessons[i];
      return html`<li class="un-lesson-card ${lp.complete ? "is-done" : ""}">
        <a href="${unitsHref(session.band, unit.id, l.id)}">
          <span class="un-lesson-n">${lp.complete ? icon("check") : l.id}</span>
          <span class="un-lesson-body"
            ><strong>${I.TO(l.title)}</strong><span>${I.TO(l.goal)}</span>
            <span class="un-lesson-meta"
              >${l.focus.map((d) => html`<span class="un-chip un-chip-${d.toLowerCase()}">${icon(DOMAIN_ICON[d])}${I.T(d, { Listening: "Escuchar", Speaking: "Hablar", Reading: "Leer", Writing: "Escribir" }[d])}</span>`)}
              <span class="fine"
                >${I.T(`About ${l.minutes} min`, `Unos ${l.minutes} min`)} ·
                ${I.T(`${lp.done} of ${lp.total} steps`, `${lp.done} de ${lp.total} pasos`)}</span
              ></span
            ></span
          ></a
        >
      </li>`;
    })}
  </ol>`;
}

function overviewHTML(I, session, unit) {
  const { band } = session;
  const p = progressFor(session, unit);
  const rec = recOf(session, unit.id);
  const tab = (key, en, es) =>
    html`<a
      class="cat-chip ${current.tab === key ? "is-active" : ""}"
      href="${unitsHref(band, unit.id, "", key ? `&tab=${key}` : "")}"
      ${current.tab === key ? 'aria-current="page"' : ""}
      >${I.T(en, es)}</a
    >`;
  const body =
    current.tab === "plan"
      ? planHTML(I, session, unit)
      : current.tab === "family"
        ? familyHTML(I, unit)
        : html` <section class="un-two">
              <div class="panel un-idea">
                <h2>${I.T("The big idea", "La gran idea")}</h2>
                <p class="lead">${I.TO(unit.bigIdea)}</p>
                <h3>${I.T("Essential question", "Pregunta esencial")}</h3>
                <p class="un-question">${I.TO(unit.question)}</p>
              </div>
              <div class="panel">
                <h2>${I.T("What I will be able to do", "Lo que podré hacer")}</h2>
                ${goalsHTML(I, unit)}
              </div>
            </section>
            <section class="panel" aria-labelledby="unWords">
              <h2 id="unWords">${I.T("Key words", "Palabras clave")}</h2>
              ${vocabHTML(I, unit)}
            </section>
            <section aria-labelledby="unLessons">
              <h2 id="unLessons">${I.T("Five lessons", "Cinco lecciones")}</h2>
              ${lessonsHTML(I, session, unit, p)}
            </section>
            <section class="panel un-project" aria-labelledby="unProject">
              <p class="eyebrow">${I.T("Performance task", "Tarea de desempeño")}</p>
              <h2 id="unProject">${I.TO(unit.task.title)}</h2>
              <dl class="un-dl">
                <div>
                  <dt>${I.T("You make", "Tú creas")}</dt>
                  <dd>${I.TO(unit.task.product)}</dd>
                </div>
                <div>
                  <dt>${I.T("Who it is for", "Para quién es")}</dt>
                  <dd>${I.TO(unit.task.audience)}</dd>
                </div>
                <div>
                  <dt>${I.T("How you share it", "Cómo lo compartes")}</dt>
                  <dd>${I.TO(unit.task.share)}</dd>
                </div>
              </dl>
              <p class="row-actions">
                <a
                  class="btn ${p.lessons.every((l) => l.complete) ? "btn-primary" : ""}"
                  href="${unitsHref(band, unit.id, "task")}"
                  >${I.T("Open the project", "Abrir el proyecto")} ${icon("arrow-right")}</a
                >
                ${p.complete ? html`<a class="btn btn-primary" href="${unitsHref(band, unit.id, "certificate")}">${icon("medal")} ${I.T(rec.cert ? "See my certificate" : "Get my certificate", rec.cert ? "Ver mi certificado" : "Recibir mi certificado")}</a>` : ""}
              </p>
            </section>`;
  return html`${unitCrumbs(I, band, unit)}
    <article class="un un-accent-${unit.accent}">
      <header class="un-hero">
        <div class="un-hero-copy">
          <p class="eyebrow">
            ${icon(unit.icon)}
            ${I.T(`Unit ${unit.n} · 5 lessons and a project · ${unitMinutes(unit)} minutes of lessons`, `Unidad ${unit.n} · 5 lecciones y un proyecto · ${unitMinutes(unit)} minutos de lecciones`)}
          </p>
          <h1 tabindex="-1">${I.TO(unit.title)}</h1>
          <p class="lead">${I.TO(unit.tagline)}</p>
          <p class="row-actions">
            <a class="btn btn-primary" href="${unitsHref(band, unit.id, p.next || "1")}"
              >${startLabel(I, p)} ${icon("arrow-right")}</a
            >
          </p>
        </div>
        <div class="un-hero-progress">
          ${barHTML(I, p.finished, p.stops, I.S("Unit progress", "Progreso de la unidad"))}<span
            class="fine"
            >${I.T(`${p.finished} of ${p.stops} stops finished`, `${p.finished} de ${p.stops} paradas terminadas`)}</span
          >
        </div>
      </header>
      ${unitMapHTML(I, unit, p, band)}
      <nav class="un-tabs" aria-label="${I.S("Unit pages", "Páginas de la unidad")}">
        ${tab("", "For students", "Para estudiantes")}${tab("family", "For families", "Para familias")}${tab("plan", "Plan and assess", "Planificar y evaluar")}
      </nav>
      ${body} ${DISCLAIMER(I)}
    </article>`;
}

function familyHTML(I, unit) {
  return html`<section class="panel un-letter" aria-labelledby="unLetter">
    <p class="eyebrow">${I.T("Letter for families", "Carta para las familias")}</p>
    <h2 id="unLetter">${I.TO(unit.title)}</h2>
    ${textBlocks(I, unit.family.letter.en, unit.family.letter.es, { cls: "un-prose un-letter-body" })}
    <h3>
      ${I.T("Talk about it at home, in any language", "Conversen en casa, en cualquier idioma")}
    </h3>
    <ol class="un-talk">
      ${unit.family.talk.map((q) => html`<li>${I.TO(q)}</li>`)}
    </ol>
    <p class="no-print">
      <button type="button" class="btn" data-print>
        ${icon("print")} ${I.T("Print this letter", "Imprimir esta carta")}
      </button>
    </p>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const { id, sub, tab } = ctx.route;
  const band = ctx.band;
  const session = await loadSession(band);
  current = { session, unit: null, sub, tab: tab || "", I };
  if (!id) return { title: I.S("Units", "Unidades"), html: hubHTML(I, session) };
  const unit = session.byId.get(id);
  if (!unit) {
    const owner = await bandOwning(id, band);
    if (owner) {
      ctx.navigate(unitsHref(owner, id, sub || ""), { replace: true });
      return {
        title: I.S("Units", "Unidades"),
        html: html`<p role="status">${I.T("Opening the unit…", "Abriendo la unidad…")}</p>`,
      };
    }
    return NOT_FOUND(I, band);
  }
  current.unit = unit;
  const title = I.pick(unit.title);
  if (!sub) return { title, html: overviewHTML(I, session, unit) };
  if (LESSON_IDS.includes(sub) || sub === "task")
    return lessonView.render(ctx, I, session, unit, sub);
  if (sub === "certificate") {
    const rec = recOf(session, unit.id);
    const earned = progressFor(session, unit).complete;
    return {
      title: `${I.S("Certificate", "Certificado")}: ${title}`,
      html: html`${unitCrumbs(I, band, unit, I.S("Certificate", "Certificado"))}
        <div class="un un-accent-${unit.accent}">
          ${certificateHTML(I, unit, rec, band, { earned, name: rec.cert?.name || "" })}
        </div>`,
    };
  }
  if (sub === "packet")
    return {
      title: `${I.S("Unit packet", "Paquete de la unidad")}: ${title}`,
      html: packetHTML(I, session, unit),
    };
  return NOT_FOUND(I, band);
}

export function onClick(e, ctx) {
  if (!current?.unit) return false;
  return lessonView.onClick(e, ctx, current) === true;
}
export function onInput(e, ctx) {
  if (current?.unit) lessonView.onInput(e, ctx, current);
}
export function onChange(e, ctx) {
  if (current?.unit) lessonView.onChange(e, ctx, current);
}
export function onRecorded(key, ctx) {
  if (current?.unit) lessonView.onRecorded?.(key, ctx, current);
}
export function mount(root) {
  trackDisclosures(root);
}
export function unmount() {
  stopSpeech();
}
