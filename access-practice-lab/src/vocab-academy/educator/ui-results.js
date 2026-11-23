// Teacher: results. Truthful by construction: the class server returns each student's SUMMARY to the teacher (assigned
// work done, this week's evidence, last seen) and never their word-level evidence, so word-level needs come only from
// progress files students export and from this device. With none of those there is nothing to show, and the page says so.
// A clearly labelled SAMPLE can be shown to see what the report looks like. Nothing is sent anywhere.
import { drawReviewQueue } from "../../class/review-queue.js";
import { formatDate, html } from "../../util.js";
import { STATE_LABEL } from "../contract.js";
import { loadProgress } from "../store.js";
import { assignmentCompletion, classRows, studentRows } from "./class-view.js";
import { MAX_SET_WORDS, practiceStop } from "./assign.js";
import { assignToClass, classApi, savedClasses } from "./class-access.js";
import { T, setRegion, statusLine } from "./kit.js";
import { sampleStudents, studentFromFile, unitRows, wordNeeds } from "./results.js";

const pct = (x) => (x == null ? "–" : `${Math.round(x * 100)}%`);

/** Students the word-level report uses: loaded files, this device when it has learning, and the sample when asked. */
export function reportStudents(unit) {
  const device = loadProgress();
  const mine = Object.keys(device.words || {}).length
    ? [{ label: "This device", progress: device }]
    : [];
  return [...T.files, ...mine, ...(T.sample && unit ? sampleStudents(unit) : [])];
}
const isSample = (students) => students.length > 0 && students.every((s) => s.sample);

function classSummary(I) {
  const cls = savedClasses().find((c) => c.code === T.classCode);
  if (!cls)
    return html`<p>
      ${I.T("No class is open on this device, so there is no class summary. Open one in the Teacher Hub.", "No hay una clase abierta en este dispositivo, así que no hay resumen de clase. Abre una en el Centro docente.")}
      <a href="/access-teacher/">${I.T("Open the Teacher Hub", "Abrir el Centro docente")}</a>
    </p>`;
  if (!T.roster)
    return html`<p>
        ${I.T("Class results are loaded on request.", "Los resultados de la clase se cargan a pedido.")}
      </p>
      <button type="button" class="btn va-btn" data-vat="load-class">
        ${I.T("Load class results", "Cargar resultados de la clase")}
      </button>`;
  const rows = classRows(T.roster);
  const done = assignmentCompletion(
    T.roster,
    rows.map((r) => r.a),
  );
  const people = studentRows(
    T.roster,
    rows.map((r) => r.a),
  );
  return html`<p class="fine">
      ${I.T("What the class server shows teachers: counts of assigned work done and this week's practice. It does not include word-level answers.", "Lo que el servidor de la clase muestra a los docentes: cantidad de tareas hechas y práctica de esta semana. No incluye respuestas por palabra.")}
    </p>
    ${
      rows.length
        ? html`<table class="vat-table">
            <caption class="vat-sr">
              ${I.T("Assignment completion", "Avance de las tareas")}
            </caption>
            <thead>
              <tr>
                <th scope="col">${I.T("Assignment", "Tarea")}</th>
                <th scope="col">${I.T("Done", "Hechas")}</th>
              </tr>
            </thead>
            <tbody>
              ${done.map(
                (d) =>
                  html`<tr>
                    <th scope="row">${d.title}</th>
                    <td>${d.done}/${d.total}</td>
                  </tr>`,
              )}
            </tbody>
          </table>`
        : html`<p>
            ${I.T("No Vocabulary Academy work is assigned to this class yet.", "Todavía no hay trabajo de la Academia de Vocabulario asignado a esta clase.")}
          </p>`
    }
    ${
      people.length
        ? html`<table class="vat-table">
            <caption class="vat-sr">
              ${I.T("Students", "Estudiantes")}
            </caption>
            <thead>
              <tr>
                <th scope="col">${I.T("Student", "Estudiante")}</th>
                <th scope="col">${I.T("Assigned done", "Tareas hechas")}</th>
                <th scope="col">${I.T("Practice this week", "Práctica esta semana")}</th>
              </tr>
            </thead>
            <tbody>
              ${people.map(
                (s) =>
                  html`<tr>
                    <th scope="row">${s.alias}</th>
                    <td>${s.done}/${s.of}</td>
                    <td>${s.weekEvidence}</td>
                  </tr>`,
              )}
            </tbody>
          </table>`
        : ""
    }
    <button type="button" class="btn va-btn" data-vat="load-class">
      ${I.T("Refresh", "Actualizar")}
    </button>`;
}

function needsTable(I, unit, students) {
  const needs = wordNeeds(
    students,
    unit.words.map((w) => w.id),
  );
  const hw = new Map(unit.words.map((w) => [w.id, w.hw]));
  if (!needs.length)
    return html`<p>
      ${I.T("No one has practised these words in the data loaded here.", "Nadie ha practicado estas palabras en los datos cargados aquí.")}
    </p>`;
  return html`<table class="vat-table">
    <caption class="vat-sr">
      ${I.T("Word-level needs, weakest first", "Necesidades por palabra, de la más débil a la más fuerte")}
    </caption>
    <thead>
      <tr>
        <th scope="col">${I.T("Word", "Palabra")}</th>
        <th scope="col">${I.T("Students who met it", "Estudiantes que la vieron")}</th>
        <th scope="col">${I.T("Needing more", "Necesitan más")}</th>
        <th scope="col">${I.T("Correct so far", "Aciertos hasta ahora")}</th>
        <th scope="col">${I.T("Review", "Repaso")}</th>
      </tr>
    </thead>
    <tbody>
      ${needs.map(
        (r) =>
          html`<tr>
            <th scope="row" lang="en">${hw.get(r.id) || r.id}</th>
            <td>${r.met}</td>
            <td>${r.weak}</td>
            <td>${pct(r.accuracy)}</td>
            <td>
              <label class="vat-check"
                ><input
                  type="checkbox"
                  data-vat="follow"
                  data-id="${r.id}"
                  ${T.follow?.has(r.id) ? "checked" : ""}
                  ${r.weak ? "" : "disabled"}
                /><span class="vat-sr"
                  >${I.S("Include in follow-up practice", "Incluir en la práctica de seguimiento")}:
                  ${hw.get(r.id) || r.id}</span
                ><span aria-hidden="true">${r.weak ? "✓" : ""}</span></label
              >
            </td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

function progressTable(I, unit, students) {
  const rows = unitRows(
    students,
    unit.id,
    unit.words.map((w) => w.id),
  );
  const score = (a) => (a ? `${a.score}/${a.total}` : "–");
  return html`<table class="vat-table">
    <caption class="vat-sr">
      ${I.T("Lesson progress", "Avance de la lección")}
    </caption>
    <thead>
      <tr>
        <th scope="col">${I.T("Student", "Estudiante")}</th>
        <th scope="col">${I.T("Lessons done", "Lecciones hechas")}</th>
        <th scope="col">${I.T("Check A", "Evaluación A")}</th>
        <th scope="col">${I.T("Check B", "Evaluación B")}</th>
        <th scope="col">${I.T("Words by state", "Palabras por estado")}</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(
        (r) =>
          html`<tr>
            <th scope="row">${r.label}</th>
            <td>${r.lessons}/8</td>
            <td>${score(r.assess.A)}</td>
            <td>${score(r.assess.B)}</td>
            <td>
              ${
                Object.entries(r.wordStates)
                  .filter(([, n]) => n)
                  .map(([s, n]) => `${I.S(...(STATE_LABEL[s] || [s, s]))} ${n}`)
                  .join(", ") || "–"
              }
            </td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

const awaitingDrafts = (students) =>
  students.flatMap((s) =>
    (Array.isArray(s.progress?.drafts) ? s.progress.drafts : [])
      .filter((d) => d.awaiting === "teacher")
      .map((d) => ({ ...d, who: s.label })),
  );

function draftsList(I, students) {
  const list = awaitingDrafts(students);
  if (!list.length)
    return html`<p>
      ${I.T("No written responses are waiting in the data loaded here. When a student shares a progress file, their constructed responses from the end-of-lesson check show up here.", "No hay respuestas escritas esperando en los datos cargados aquí. Cuando un estudiante comparta un archivo de progreso, sus respuestas desarrolladas de la evaluación final aparecerán aquí.")}
    </p>`;
  return html`<ul class="vat-list vat-drafts">
    ${list.map(
      (d) =>
        html`<li>
          <p>
            <strong>${d.who}</strong> ·
            <span class="fine">${d.unitId || ""} ${d.at ? formatDate(d.at) : ""}</span>
          </p>
          ${d.prompt ? html`<p class="fine" lang="en">${d.prompt}</p>` : ""}
          <blockquote lang="en">${d.text}</blockquote>
          <p class="fine">
            ${I.T("Written responses are read by a person. Nothing here is scored.", "Una persona lee las respuestas escritas. Aquí no se califica nada.")}
          </p>
        </li>`,
    )}
  </ul>`;
}

export function resultsPanel(I, unit) {
  const students = reportStudents(unit);
  if (T.follow === null) T.follow = new Set();
  const sample = isSample(students);
  return html`<section class="vat-panel" id="vatResults" aria-labelledby="vatResH">
    <h2 id="vatResH">${I.T("Results and progress", "Resultados y progreso")}</h2>
    <h3>${I.T("Class summary", "Resumen de la clase")}</h3>
    <div id="vatClassSummary">${classSummary(I)}</div>
    <h3>${I.T("Word-level learning needs", "Necesidades de aprendizaje por palabra")}</h3>
    ${
      unit
        ? html` <p class="fine">
              ${I.T("Word-level answers stay on each student's device. Load the progress files students export, or look at this device. Nothing is uploaded.", "Las respuestas por palabra se quedan en el dispositivo de cada estudiante. Carga los archivos de progreso que exportan los estudiantes o mira este dispositivo. No se sube nada.")}
            </p>
            <div class="vat-row">
              <label for="vatFiles"
                >${I.T("Load student progress files", "Cargar archivos de progreso de estudiantes")}</label
              >
              <input
                id="vatFiles"
                type="file"
                accept=".json,application/json"
                multiple
                data-vat="files"
              />
              ${T.files.length ? html`<button type="button" class="btn va-btn va-btn-quiet" data-vat="clear-files">${I.T("Clear loaded files", "Quitar archivos cargados")} (${T.files.length})</button>` : ""}
            </div>
            <div id="vatFilesStatus" role="status" aria-live="polite"></div>
            ${
              students.length
                ? html` ${sample ? html`<p class="vat-sample" role="note"><strong>${I.T("Sample data", "Datos de ejemplo")}</strong> ${I.T("Six invented students, shown only so you can see what this report looks like. They are not your students.", "Seis estudiantes inventados, mostrados solo para que veas cómo es este informe. No son tus estudiantes.")} <button type="button" class="btn va-btn va-btn-quiet" data-vat="hide-sample">${I.T("Hide the sample", "Ocultar el ejemplo")}</button></p>` : ""}
                    ${needsTable(I, unit, students)}
                    <h3>${I.T("Lesson progress", "Avance de la lección")}</h3>
                    ${progressTable(I, unit, students)}
                    <h3>${I.T("Create follow-up practice", "Crear práctica de seguimiento")}</h3>
                    <div id="vatFollow">${followUp(I, unit)}</div>`
                : html`<p class="vat-empty">
                      ${I.T("There is no word-level data yet. When students export their progress, load the files here. Until then this page does not guess.", "Todavía no hay datos por palabra. Cuando los estudiantes exporten su progreso, carga los archivos aquí. Hasta entonces esta página no adivina.")}
                    </p>
                    <button type="button" class="btn va-btn" data-vat="show-sample">
                      ${I.T("Show a labelled sample", "Mostrar un ejemplo marcado")}
                    </button>`
            }`
        : html`<p>
            ${I.T("Choose a lesson to see word-level needs.", "Elige una lección para ver las necesidades por palabra.")}
          </p>`
    }
    <h3>${I.T("Written responses waiting to be read", "Respuestas escritas esperando lectura")}</h3>
    ${draftsList(
      I,
      students.filter((s) => !s.sample),
    )}
    <h3>
      ${I.T("Shared recordings and writing from the class", "Grabaciones y escritos compartidos de la clase")}
    </h3>
    <div id="vatReviewBox" aria-live="polite"></div>
  </section>`;
}

function followUp(I, unit) {
  const ids = [...(T.follow || [])];
  const set = ids.slice(0, MAX_SET_WORDS);
  const hw = new Map(unit.words.map((w) => [w.id, w.hw]));
  if (!ids.length)
    return html`<p class="fine">
      ${I.T("Tick the words above that need more practice. Up to 8 words fit in one assignment.", "Marca arriba las palabras que necesitan más práctica. En una tarea caben hasta 8 palabras.")}
    </p>`;
  return html`<p>
      ${set.map((id) => hw.get(id) || id).join(", ")}${ids.length > MAX_SET_WORDS ? ` (${I.S(`first ${MAX_SET_WORDS} only`, `solo las primeras ${MAX_SET_WORDS}`)})` : ""}
    </p>
    <div class="vat-actions">
      ${savedClasses().length ? html`<button type="button" class="btn btn-primary va-btn" data-vat="assign-follow">${I.T("Assign follow-up practice", "Asignar práctica de seguimiento")}</button>` : ""}
      <a class="btn va-btn" href="${practiceStop({ ids: set, grade: unit.grade }).path}"
        >${I.T("Try it myself", "Probarlo yo")}</a
      >
    </div>
    <div id="vatFollowStatus" role="status" aria-live="polite"></div>`;
}

/** After mount: draw the class's review queue through the lab's own module when a class is open. */
export function resultsMount(ctx, va) {
  const box = document.getElementById("vatReviewBox");
  if (!box) return;
  const cls = savedClasses().find((c) => c.code === T.classCode);
  if (!cls) {
    box.textContent = va.I.S(
      "Open a class to see recordings and writing students share with it.",
      "Abre una clase para ver las grabaciones y escritos que los estudiantes comparten con ella.",
    );
    return;
  }
  drawReviewQueue(box, { S: va.I.S, api: classApi(cls), live: document.getElementById("labLive") });
}

const readFile = (f) => f.text();

export async function resultsChange(e, ctx, va) {
  const el = e.target.closest?.("[data-vat]");
  if (!el) return false;
  const I = va.I;
  if (el.dataset.vat === "files") {
    const problems = [];
    for (const f of [...el.files].slice(0, 40)) {
      try {
        T.files.push(studentFromFile(await readFile(f), f.name));
      } catch (error) {
        problems.push(`${f.name}: ${error.message}`);
      }
    }
    setRegion("vatFilesStatus", problems.length ? statusLine(problems.join(" "), "warn") : "");
    if (!problems.length) ctx.rerender();
    return true;
  }
  if (el.dataset.vat === "follow") {
    T.follow ||= new Set();
    el.checked ? T.follow.add(el.dataset.id) : T.follow.delete(el.dataset.id);
    setRegion("vatFollow", followUp(I, T.unit));
    return true;
  }
  return false;
}

export async function resultsClick(e, ctx, va) {
  const b = e.target.closest?.("[data-vat]");
  if (!b) return false;
  const I = va.I;
  const act = b.dataset.vat;
  if (act === "load-class") {
    const cls = savedClasses().find((c) => c.code === T.classCode);
    if (!cls) return true;
    const res = await classApi(cls).roster();
    T.roster = res.ok ? res : null;
    T.rosterFor = res.ok ? cls.code : "";
    setRegion(
      "vatClassSummary",
      res.ok
        ? classSummary(I)
        : statusLine(
            I.S(
              "Could not load the class. Check the passcode or your connection.",
              "No se pudo cargar la clase. Revisa el código o tu conexión.",
            ),
            "warn",
          ),
    );
  } else if (act === "show-sample") {
    T.sample = true;
    ctx.rerender();
  } else if (act === "hide-sample") {
    T.sample = false;
    ctx.rerender();
  } else if (act === "clear-files") {
    T.files = [];
    ctx.rerender();
  } else if (act === "assign-follow") {
    const unit = T.unit;
    const cls = savedClasses().find((c) => c.code === T.classCode);
    const ids = [...(T.follow || [])];
    if (!unit || !cls || !ids.length) return true;
    const r = await assignToClass(classApi(cls), [practiceStop({ ids, grade: unit.grade })], {
      due: T.due || null,
    });
    setRegion(
      "vatFollowStatus",
      statusLine(
        r.ok && r.added.length
          ? I.S("Follow-up practice assigned.", "Práctica de seguimiento asignada.")
          : r.ok
            ? I.S("That practice is already assigned.", "Esa práctica ya está asignada.")
            : I.S(
                "Could not reach the class. Nothing was assigned.",
                "No se pudo llegar a la clase. No se asignó nada.",
              ),
        r.ok && r.added.length ? "ok" : "warn",
      ),
    );
  } else return false;
  return true;
}

export const RES_CLICK = new Set(["load-class", "show-sample", "hide-sample", "clear-files", "assign-follow"]);
export const RES_CHANGE = new Set(["files", "follow"]);
