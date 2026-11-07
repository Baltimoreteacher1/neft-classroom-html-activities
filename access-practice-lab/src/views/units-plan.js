// Planning and printing for a unit: the pacing guide, assessment plan, per-lesson notes with the class-assignment link
// (Plan tab), and the printable unit packet (/units/<unit>/packet). Both read the same authored unit; nothing is stored.
import { html, icon } from "../util.js";
import { unitAssignment, taskAssignment, unitMinutes } from "../lang/units.js";
import { paragraphs, textBlocks, unitCrumbs, unitsHref } from "./units-common.js";

const STEP_LABEL = {
  read: ["Read", "Leer"],
  listen: ["Listen", "Escuchar"],
  vocab: ["Key words", "Palabras clave"],
  activity: ["Activity", "Actividad"],
  speak: ["Speak", "Hablar"],
  write: ["Write", "Escribir"],
  reflect: ["Reflect", "Reflexionar"],
};
const REF = {
  task: ["Project work", "Trabajo del proyecto"],
  flex: ["Flex day", "Día flexible"],
  review: ["Review", "Repaso"],
  share: ["Share day", "Día de compartir"],
};

function stepSummary(I, session, unit, lesson, s) {
  const label = I.T(...STEP_LABEL[s.t]);
  let what = "";
  if (s.t === "read" || s.t === "listen") what = I.TO(unit.texts[s.text].title);
  else if (s.t === "activity") what = session.locator.get(s.id)?.title || s.id;
  else if (s.t === "speak") what = I.TO(unit.speaking.find((t) => t.id === s.task).title);
  else if (s.t === "write") what = I.TO(unit.writing.find((t) => t.id === s.task).title);
  else if (s.t === "vocab") what = s.terms.map((i) => unit.vocab[i].term).join(", ");
  else what = I.TO(s.q);
  return html`<li><strong>${label}:</strong> ${what}</li>`;
}

const refLabel = (I, unit, ref) =>
  REF[ref]
    ? I.T(...REF[ref])
    : I.T(
        `Lesson ${ref}: ${unit.lessons[Number(ref) - 1].title.en}`,
        `Lección ${ref}: ${unit.lessons[Number(ref) - 1].title.es}`,
      );

export function planHTML(I, session, unit) {
  const { band } = session;
  const rows = [
    ...unit.lessons.map((l) => unitAssignment(unit, l, band)),
    taskAssignment(unit, band),
  ];
  return html`<section class="panel" aria-labelledby="unPace">
      <h2 id="unPace">${I.T("Pacing guide", "Guía de ritmo")}</h2>
      <p>
        ${I.T(`${unit.pacing.length} class days (about ${Math.ceil(unit.pacing.length / 5)} weeks) with ${unitMinutes(unit)} minutes of lesson content and time for the project.`, `${unit.pacing.length} días de clase (unas ${Math.ceil(unit.pacing.length / 5)} semanas) con ${unitMinutes(unit)} minutos de contenido de lecciones y tiempo para el proyecto.`)}
      </p>
      <div class="un-tablewrap">
        <table class="un-table">
          <thead>
            <tr>
              <th scope="col">${I.T("Day", "Día")}</th>
              <th scope="col">${I.T("Focus", "Enfoque")}</th>
              <th scope="col">${I.T("What happens", "Qué sucede")}</th>
            </tr>
          </thead>
          <tbody>
            ${unit.pacing.map(
              (p) =>
                html`<tr>
                  <th scope="row">${p.day}</th>
                  <td>${refLabel(I, unit, p.ref)}</td>
                  <td>${I.TO(p.note)}</td>
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel" aria-labelledby="unAssess">
      <h2 id="unAssess">${I.T("Assessment plan", "Plan de evaluación")}</h2>
      <h3>${I.T("Check as you go", "Revisa mientras avanzas")}</h3>
      <ul>
        ${unit.assessment.formative.map((f) => html`<li>${I.TO(f)}</li>`)}
      </ul>
      <h3>${I.T("Performance task", "Tarea de desempeño")}</h3>
      <p>${I.TO(unit.assessment.performance)}</p>
      <h3>${I.T("Student self-check", "Autoevaluación del estudiante")}</h3>
      <p>${I.TO(unit.assessment.selfCheck)}</p>
      <p class="fine">
        ${I.T("The project rubric describes work in three practice bands (getting started, building, strong). These are classroom descriptions, not WIDA levels or scores.", "La rúbrica del proyecto describe el trabajo en tres bandas de práctica (empezando, en desarrollo, sólido). Son descripciones de aula, no niveles ni puntajes de WIDA.")}
      </p>
    </section>
    <section aria-labelledby="unNotes">
      <h2 id="unNotes">${I.T("Lesson plans and assignments", "Planes de lección y tareas")}</h2>
      ${unit.lessons.map(
        (l, i) =>
          html`<article class="panel un-plan-lesson">
            <h3>
              ${I.T(`Lesson ${l.id}`, `Lección ${l.id}`)}: ${I.TO(l.title)}
              <span class="fine">· ${l.minutes} min</span>
            </h3>
            <p>${I.TO(l.teacher)}</p>
            <ol class="un-plan-steps">
              ${l.steps.map((s) => stepSummary(I, session, unit, l, s))}
            </ol>
            <p class="row-actions">
              <button type="button" class="btn small" data-copy="${rows[i].path}">
                ${icon("copy")} ${I.T("Copy lesson link", "Copiar enlace de la lección")}
              </button>
              <a class="btn small ghost" href="${unitsHref(band, unit.id, l.id)}"
                >${I.T("Open the lesson", "Abrir la lección")}</a
              >
            </p>
          </article>`,
      )}
      <article class="panel un-plan-lesson">
        <h3>${I.TO(unit.task.title)}</h3>
        <p>${I.TO(unit.task.prompt)}</p>
        <p class="row-actions">
          <button type="button" class="btn small" data-copy="${rows[5].path}">
            ${icon("copy")} ${I.T("Copy project link", "Copiar enlace del proyecto")}
          </button>
          <a class="btn small ghost" href="${unitsHref(band, unit.id, "task")}"
            >${I.T("Open the project", "Abrir el proyecto")}</a
          >
        </p>
      </article>
      <p class="fine">
        ${I.T("To assign a stop to a live class, open Class, then the class view, choose Assignments and pick “Units”. Links carry no student information.", "Para asignar una parada a una clase en vivo, abre Clase, luego la vista de la clase, elige Tareas y selecciona “Unidades”. Los enlaces no llevan información de estudiantes.")}
      </p>
    </section>
    <section class="panel no-print">
      <h2>${I.T("Printable unit packet", "Paquete imprimible de la unidad")}</h2>
      <p>
        ${I.T("Overview, all texts at three levels, lesson plans, speaking and writing task sheets, the project and rubric, pacing and the family letter, in the language you have chosen.", "Resumen, todos los textos en tres niveles, planes de lección, hojas de tareas de hablar y escribir, el proyecto y la rúbrica, el ritmo y la carta para las familias, en el idioma que elegiste.")}
      </p>
      <a class="btn btn-primary" href="${unitsHref(band, unit.id, "packet")}"
        >${icon("print")} ${I.T("Open the packet", "Abrir el paquete")}</a
      >
    </section>`;
}

const lines = (n = 6) =>
  html`<div class="un-lines" aria-hidden="true">
    ${Array.from({ length: n }, () => html`<span></span>`)}
  </div>`;

function taskSheet(I, t, kind) {
  return html`<section class="un-pk-block">
    <h3>${I.TO(t.title)}</h3>
    <p>${I.TO(t.prompt)}</p>
    <p><strong>${I.T("Sentence starters", "Inicios de oración")}</strong></p>
    <ul>
      ${t.frames.map((f) => html`<li>${I.TO(f)}</li>`)}
    </ul>
    ${
      kind === "write"
        ? html`<p>
              <strong>${I.T("Word bank", "Banco de palabras")}</strong>:
              ${t.bank.map((w) => I.S(w.en, w.es)).join(" · ")}
            </p>
            ${lines(8)}`
        : lines(4)
    }
    <p><strong>${I.T("Check my work", "Revisar mi trabajo")}</strong></p>
    <ul class="un-pk-checks">
      ${t.checks.map((c) => html`<li>${I.TO(c)}</li>`)}
    </ul>
  </section>`;
}

/** The printable unit packet. */
export function packetHTML(I, session, unit) {
  const { band } = session;
  const A = unit.texts.anchor;
  return html`${unitCrumbs(I, band, unit, I.S("Unit packet", "Paquete de la unidad"))}
    <div class="un un-packet un-accent-${unit.accent}">
      <p class="no-print row-actions">
        <button type="button" class="btn btn-primary" data-print>
          ${icon("print")} ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
        </button>
        <a class="btn" href="${unitsHref(band, unit.id)}"
          >${I.T("Back to the unit", "Volver a la unidad")}</a
        >
      </p>
      <section class="un-pk-cover">
        <p class="eyebrow">
          ${I.T(`Language Page · Unit ${unit.n} packet`, `Language Page · Paquete de la unidad ${unit.n}`)}
        </p>
        <h1 tabindex="-1">${I.TO(unit.title)}</h1>
        <p class="lead">${I.TO(unit.tagline)}</p>
        <h2>${I.T("The big idea", "La gran idea")}</h2>
        <p>${I.TO(unit.bigIdea)}</p>
        <h2>${I.T("Essential question", "Pregunta esencial")}</h2>
        <p class="un-question">${I.TO(unit.question)}</p>
        <h2>${I.T("Language goals", "Metas de lenguaje")}</h2>
        <ul>
          ${["Listening", "Speaking", "Reading", "Writing"].map((d) => html`<li><strong>${I.T(d, { Listening: "Escuchar", Speaking: "Hablar", Reading: "Leer", Writing: "Escribir" }[d])}:</strong> ${I.TO(unit.goals[d])}</li>`)}
        </ul>
      </section>
      <section class="un-pk-block">
        <h2>${I.T("Key words", "Palabras clave")}</h2>
        <table class="un-table">
          <thead>
            <tr>
              <th scope="col">English</th>
              <th scope="col">Español</th>
              <th scope="col">${I.T("Meaning", "Significado")}</th>
            </tr>
          </thead>
          <tbody>
            ${unit.vocab.map(
              (v) =>
                html`<tr>
                  <th scope="row" lang="en">${v.term}</th>
                  <td lang="es">${v.es}</td>
                  <td>${I.TO(v.def)}</td>
                </tr>`,
            )}
          </tbody>
        </table>
      </section>
      <section class="un-pk-block">
        <h2>${I.TO(A.title)}</h2>
        ${["easier", "on", "richer"].map(
          (l) =>
            html`<h3>
                ${I.T({ easier: "Easier version", on: "On-level version", richer: "More detail version" }[l], { easier: "Versión más fácil", on: "Versión al nivel", richer: "Versión con más detalle" }[l])}
              </h3>
              <div class="un-prose" lang="en">
                ${paragraphs(A[l]).map((p) => html`<p>${p}</p>`)}
              </div>`,
        )}
        ${
          I.mode !== "en"
            ? html`<h3>${I.T("Spanish version", "Versión en español")}</h3>
                <div class="un-prose" lang="es">
                  ${paragraphs(A.es).map((p) => html`<p>${p}</p>`)}
                </div>`
            : ""
        }
      </section>
      ${["s1", "s2", "s3", "s4"].map(
        (k) =>
          html`<section class="un-pk-block">
            <h3>${I.TO(unit.texts[k].title)} <span class="un-chip">${unit.texts[k].kind}</span></h3>
            ${textBlocks(I, unit.texts[k].en, unit.texts[k].es)}
          </section>`,
      )}
      ${unit.lessons.map(
        (l) =>
          html`<section class="un-pk-block un-pk-lesson">
            <h2>${I.T(`Lesson ${l.id}`, `Lección ${l.id}`)}: ${I.TO(l.title)}</h2>
            <p><strong>${I.TO(l.goal)}</strong></p>
            <p>${I.T("Warm up:", "Para empezar:")} ${I.TO(l.warmup)}</p>
            <ol>
              ${l.steps.map((s) => stepSummary(I, session, unit, l, s))}
            </ol>
            <p class="fine">${I.TO(l.teacher)}</p>
          </section>`,
      )}
      <section class="un-pk-sheets">
        <h2>${I.T("Speaking and writing task sheets", "Hojas de tareas de hablar y escribir")}</h2>
        ${unit.speaking.map((t) => taskSheet(I, t, "speak"))}${unit.writing.map((t) => taskSheet(I, t, "write"))}
      </section>
      <section class="un-pk-block">
        <h2>${I.T("Performance task", "Tarea de desempeño")}: ${I.TO(unit.task.title)}</h2>
        <p>${I.TO(unit.task.prompt)}</p>
        <p><strong>${I.T("Product", "Producto")}:</strong> ${I.TO(unit.task.product)}</p>
        <p><strong>${I.T("Audience", "Público")}:</strong> ${I.TO(unit.task.audience)}</p>
        <p><strong>${I.T("Share", "Compartir")}:</strong> ${I.TO(unit.task.share)}</p>
        <ol>
          ${unit.task.steps.map((s) => html`<li>${I.TO(s)}</li>`)}
        </ol>
        ${taskSheet(I, unit.task.write, "write")}${taskSheet(I, unit.task.speak, "speak")}
        <table class="un-table">
          <thead>
            <tr>
              <th scope="col">${I.T("Criterion", "Criterio")}</th>
              <th scope="col">${I.T("Getting started", "Empezando")}</th>
              <th scope="col">${I.T("Building", "En desarrollo")}</th>
              <th scope="col">${I.T("Strong", "Sólido")}</th>
            </tr>
          </thead>
          <tbody>
            ${unit.task.rubric.map(
              (r) =>
                html`<tr>
                  <th scope="row">${I.TO(r.name)}</th>
                  ${r.levels.map((l) => html`<td>${I.TO(l)}</td>`)}
                </tr>`,
            )}
          </tbody>
        </table>
      </section>
      <section class="un-pk-block">
        <h2>${I.T("Pacing guide", "Guía de ritmo")}</h2>
        <table class="un-table">
          <thead>
            <tr>
              <th scope="col">${I.T("Day", "Día")}</th>
              <th scope="col">${I.T("Focus", "Enfoque")}</th>
              <th scope="col">${I.T("What happens", "Qué sucede")}</th>
            </tr>
          </thead>
          <tbody>
            ${unit.pacing.map(
              (p) =>
                html`<tr>
                  <th scope="row">${p.day}</th>
                  <td>${refLabel(I, unit, p.ref)}</td>
                  <td>${I.TO(p.note)}</td>
                </tr>`,
            )}
          </tbody>
        </table>
        <h2>${I.T("Assessment", "Evaluación")}</h2>
        <ul>
          ${unit.assessment.formative.map((f) => html`<li>${I.TO(f)}</li>`)}
        </ul>
        <p>${I.TO(unit.assessment.performance)}</p>
      </section>
      <section class="un-pk-block un-pk-letter">
        <h2>${I.T("Letter for families", "Carta para las familias")}</h2>
        ${textBlocks(I, unit.family.letter.en, unit.family.letter.es)}
        <ol>
          ${unit.family.talk.map((q) => html`<li>${I.TO(q)}</li>`)}
        </ol>
      </section>
      <p class="disclaimer">
        ${I.T("Original practice material for multilingual learners. It is not a WIDA or ACCESS test and gives no score or level.", "Material de práctica original para estudiantes multilingües. No es una prueba de WIDA ni de ACCESS y no da puntaje ni nivel.")}
      </p>
    </div>`;
}
