// Connected Pathways — the builder screen (/pathways/build), a clearly labelled "For teachers" mode of the pathways
// view. Markup only; the draft operations are in builder.js and the events in src/views/pathways.js. Reordering is
// by Up/Down buttons (never drag-only). The assign panel shows the exact path the class server will store, its
// length against the 200-character limit, a copy button, a QR code and, when this device has a class open, a button
// that adds the ONE assignment through the existing class settings API.
import { BASE, html, icon, raw } from "../util.js";
import { OBJECTIVES, SUPPORTS, objectiveById, resolveKey } from "./graph.js";
import { BUILT_IN_IDS, MAX_STAGES, builtInDef } from "./pathways.js";

const USE_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };

function stagesHTML(I, v) {
  const { pathway, draft } = v;
  if (!draft.stages.length)
    return html`<p class="pw-note is-warn">
      ${I.T("Add at least one step.", "Agreguen al menos un paso.")}
    </p>`;
  return html`<ol class="pw-build-list">
    ${draft.stages.map((d, i) => {
      const s = pathway?.stages.find((x) => x.key === d.key);
      const title = s ? I.S(...s.title) : d.key;
      const previewHref = s?.route ? `${BASE}${s.route}` : "";
      const label = (en, es) =>
        I.S(`${en}: step ${i + 1}, ${title}`, `${es}: paso ${i + 1}, ${title}`);
      return html`<li class="pw-build-item">
        <div class="pw-build-text">
          <p class="pw-stage-meta">
            <span>${i + 1}. ${s ? I.S(...s.feature) : ""}</span
            >${s && !s.linked ? html` <span class="pw-chip">${I.T("Not linked to this goal", "No vinculado a esta meta")}</span>` : ""}${s?.evidence.type === "none" ? html` <span class="pw-chip">${I.T("Extra: cannot be checked off", "Extra: no se puede marcar")}</span>` : ""}
          </p>
          <p class="pw-build-title">${title}</p>
          ${s ? html`<p class="fine">${I.T(...s.why)}</p>` : ""}
          ${
            previewHref
              ? html`<a class="btn small" href="${previewHref}" target="_blank" rel="noopener" data-pw-activity-preview
                  >${I.T("Preview activity", "Vista previa de la actividad")}</a
                >`
              : s?.kind === "transfer" || s?.kind === "family"
                ? html`<p class="fine">${I.T("Completed inside the pathway", "Se completa dentro de la ruta")}</p>`
                : ""
          }
        </div>
        <div class="pw-build-acts">
          <button
            type="button"
            class="btn small"
            data-pw-move="${i}"
            data-dir="-1"
            ${i === 0 ? "disabled" : ""}
            aria-label="${label("Move up", "Subir")}"
          >
            ${I.T("Up", "Subir")}
          </button>
          <button
            type="button"
            class="btn small"
            data-pw-move="${i}"
            data-dir="1"
            ${i === draft.stages.length - 1 ? "disabled" : ""}
            aria-label="${label("Move down", "Bajar")}"
          >
            ${I.T("Down", "Bajar")}
          </button>
          <label class="pw-check"
            ><input
              type="checkbox"
              data-pw-optional="${i}"
              ${d.optional || s?.evidence.type === "none" ? "checked" : ""}
              ${s?.evidence.type === "none" ? "disabled" : ""}
            />
            ${I.T("Optional", "Opcional")}</label
          >
          <button
            type="button"
            class="btn small"
            data-pw-remove="${i}"
            aria-label="${label("Remove", "Quitar")}"
          >
            ${I.T("Remove", "Quitar")}
          </button>
        </div>
      </li>`;
    })}
  </ol>`;
}

/** The rows of the resource list (redrawn in place while the teacher types in the search box). */
export function resultsHTML(I, v) {
  const full = v.draft.stages.length >= MAX_STAGES;
  const previewHref = (key) => {
    const route = resolveKey(key, v.data)?.route;
    return route ? `${BASE}${route}` : "";
  };
  return html`${v.results.map(
        (r) =>
          html`<li class="pw-result">
            <span class="pw-result-text"
              ><strong>${I.S(...r.title)}</strong>
              <span class="fine"
                >${r.kind}${r.domain ? ` · ${r.domain}` : ""}${r.linked ? I.S(" · linked to this goal", " · vinculado a esta meta") : ""}</span
              ></span
            >
            ${
              previewHref(r.key)
                ? html`<a class="btn small" href="${previewHref(r.key)}" target="_blank" rel="noopener" data-pw-activity-preview
                    >${I.T("Preview", "Vista previa")}</a
                  >`
                : html`<span class="fine">${I.T("In-pathway activity", "Actividad dentro de la ruta")}</span>`
            }
            <button
              type="button"
              class="btn small"
              data-pw-add="${r.key}"
              ${full || v.draft.stages.some((s) => s.key === r.key) ? "disabled" : ""}
              aria-label="${I.S(`Add ${r.title[0]}`, `Agregar ${r.title[1]}`)}"
            >
              ${v.draft.stages.some((s) => s.key === r.key) ? I.T("Added", "Agregado") : I.T("Add", "Agregar")}
            </button>
          </li>`,
      )}`;
}

function resourcesHTML(I, v) {
  const full = v.draft.stages.length >= MAX_STAGES;
  return html`<section class="pw-build-sec" aria-labelledby="pwAddH">
    <h2 id="pwAddH">${I.T("3. Add existing resources", "3. Agregar recursos que ya existen")}</h2>
    <label class="pw-label" for="pwSearch"
      >${I.T("Search activities, studio tasks and tools (type 2 letters or more)", "Busquen actividades, tareas de estudio y herramientas (escriban 2 letras o más)")}</label
    >
    <input
      id="pwSearch"
      class="pw-input"
      type="search"
      data-pw-search
      value="${v.query}"
      autocomplete="off"
    />
    ${full ? html`<p class="pw-note is-warn" role="status">${I.T(`A pathway holds at most ${MAX_STAGES} steps. Remove one to add another.`, `Una ruta tiene como máximo ${MAX_STAGES} pasos. Quiten uno para agregar otro.`)}</p>` : ""}
    <ul class="pw-results" aria-live="polite">
      ${resultsHTML(I, v)}
    </ul>
  </section>`;
}

function rulesHTML(I, v) {
  const o = v.objective;
  const follow = o.activities
    .filter((a) => !a.band || a.band === v.band)
    .map((a) => resolveKey(a.key, v.data))
    .filter(Boolean);
  return html`<section class="pw-build-sec" aria-labelledby="pwRulesH">
    <h2 id="pwRulesH">
      ${I.T("4. Supports, suggestions and follow-up", "4. Apoyos, sugerencias y seguimiento")}
    </h2>
    <fieldset class="pw-fieldset">
      <legend>
        ${I.T("Helps offered on the independent task (all start closed; opening one marks the work “with help”)", "Ayudas que se ofrecen en la tarea independiente (todas empiezan cerradas; abrir una marca el trabajo “con ayuda”)")}
      </legend>
      ${Object.entries(SUPPORTS).map(([id, s]) => html`<label class="pw-check"><input type="checkbox" data-pw-support="${id}" ${v.draft.supports.includes(id) ? "checked" : ""} /> ${I.T(...s.title)}</label>`)}
    </fieldset>
    <fieldset class="pw-fieldset">
      <legend>
        ${I.T("System suggestions for this goal: accept or reject each one", "Sugerencias del sistema para esta meta: acepten o rechacen cada una")}
      </legend>
      <ul class="pw-needs">
        ${o.needs.map((n) => {
          const ref = resolveKey(n.activity, v.data);
          const off = v.draft.rejected.includes(n.id);
          return html`<li class="pw-need">
            <p>
              ${I.T(`When a student ${n.sign[0]} in 2 of the last 3 tries, suggest: ${ref?.title[0] || n.activity}.`, `Cuando un estudiante ${n.sign[1]} en 2 de los últimos 3 intentos, sugerir: ${ref?.title[1] || n.activity}.`)}
            </p>
            <div
              class="pw-help-row"
              role="group"
              aria-label="${I.S(`Suggestion: ${n.id}`, `Sugerencia: ${n.id}`)}"
            >
              <button
                type="button"
                class="btn small"
                data-pw-need="${n.id}"
                data-reject="0"
                aria-pressed="${!off}"
              >
                ${I.T("Accept", "Aceptar")}
              </button>
              <button
                type="button"
                class="btn small"
                data-pw-need="${n.id}"
                data-reject="1"
                aria-pressed="${off}"
              >
                ${I.T("Reject", "Rechazar")}
              </button>
            </div>
          </li>`;
        })}
      </ul>
    </fieldset>
    <label class="pw-label" for="pwFollow"
      >${I.T("Follow-up work after the pathway (same goal)", "Trabajo de seguimiento después de la ruta (misma meta)")}</label
    >
    <select id="pwFollow" class="pw-input" data-pw-follow>
      <option value="">
        ${I.S("Let the system choose from this goal", "Que el sistema elija dentro de esta meta")}
      </option>
      ${follow.map((r) => html`<option value="${r.key}" ${v.draft.followUp === r.key ? "selected" : ""}>${r.title[0]}</option>`)}
    </select>
  </section>`;
}

function assignHTML(I, v) {
  const a = v.assign;
  const problem = {
    "too-long": I.S(
      `This link is ${a.length} characters; the class system stores at most 200. Remove a step or shorten the title.`,
      `Este enlace tiene ${a.length} caracteres; el sistema de clases guarda 200 como máximo. Quiten un paso o acorten el título.`,
    ),
    characters: I.S(
      "The title has a character the class system cannot store. Use letters, numbers and spaces.",
      "El título tiene un carácter que el sistema de clases no puede guardar. Usen letras, números y espacios.",
    ),
    "no-required-stage": I.S(
      "Every step is optional. Keep at least one required step.",
      "Todos los pasos son opcionales. Dejen al menos un paso obligatorio.",
    ),
    id: I.S(
      "The assignment id could not be made.",
      "No se pudo crear el identificador de la tarea.",
    ),
  };
  return html`<section class="pw-build-sec pw-assign" aria-labelledby="pwAssignH">
    <h2 id="pwAssignH">${I.T("5. Preview and assign", "5. Vista previa y asignar")}</h2>
    ${
      a.ok
        ? html`<p class="pw-note is-ok" role="status">
            ${I.T(`Ready to assign: one link, ${a.length} of 200 characters.`, `Lista para asignar: un enlace, ${a.length} de 200 caracteres.`)}
          </p>`
        : html`<ul class="pw-note is-warn" role="alert">
            ${a.problems.map((p) => html`<li>${problem[p] || p}</li>`)}
          </ul>`
    }
    <p class="row-actions">
      <a
        class="btn"
        href="${a.assignment.path}${a.assignment.path.includes("?") ? "&" : "?"}preview=1"
        data-pw-preview
        >${I.T("Preview as a student", "Vista previa como estudiante")}</a
      >
    </p>
    <label class="pw-label" for="pwPath"
      >${I.T("Assignable path (this is what the class stores)", "Ruta para asignar (esto es lo que guarda la clase)")}</label
    >
    <input id="pwPath" class="pw-input pw-path" type="text" readonly value="${a.assignment.path}" />
    <label class="pw-label" for="pwLink">${I.T("Link to share", "Enlace para compartir")}</label>
    <input id="pwLink" class="pw-input pw-path" type="text" readonly value="${v.link}" />
    <p class="row-actions">
      <button type="button" class="btn" data-pw-copy ${a.ok ? "" : "disabled"}>
        ${I.T("Copy link", "Copiar enlace")}
      </button>
    </p>
    ${a.ok && v.qr ? html`<div class="pw-qr">${raw(v.qr)}</div>` : ""}
    ${v.qrTooLong ? html`<p class="fine">${I.T(`No QR code for this one: the link is ${v.qrTooLong.bytes} characters and the site's QR codes hold ${v.qrTooLong.max}. Share the link or assign it to a class. (A built-in pathway used without changes keeps a short link and a QR code.)`, `Esta no tiene código QR: el enlace tiene ${v.qrTooLong.bytes} caracteres y los códigos QR del sitio admiten ${v.qrTooLong.max}. Compartan el enlace o asígnenla a una clase. (Una ruta incluida que se usa sin cambios conserva un enlace corto y un código QR.)`)}</p>` : ""}
    <h3>${I.T("Add it to a class", "Agregarla a una clase")}</h3>
    ${
      v.classes.length
        ? html`<p>
              ${I.T("A class is open on this device. This adds the pathway as one assignment; students see it under Assigned practice.", "Hay una clase abierta en este dispositivo. Esto agrega la ruta como una sola tarea; los estudiantes la ven en Práctica asignada.")}
            </p>
            <div class="pw-help-row">
              ${v.classes.map((c) => html`<button type="button" class="btn" data-pw-class="${c.code}" ${a.ok ? "" : "disabled"}>${I.S(`Assign to ${c.title || c.code} (${c.code})`, `Asignar a ${c.title || c.code} (${c.code})`)}</button>`)}
            </div>`
        : html`<ol class="pw-steps">
            <li>
              ${I.T("Open your class on this device once: Class teacher view, then enter the class code and teacher passcode.", "Abran su clase en este dispositivo una vez: Vista de la clase para el maestro, luego escriban el código de la clase y el código de acceso del maestro.")}
              <a href="${BASE}/class/teacher"
                >${I.T("Open the class teacher view", "Abrir la vista de la clase para el maestro")}</a
              >
            </li>
            <li>
              ${I.T("Come back to this page: an “Assign to my class” button appears here.", "Vuelvan a esta página: aquí aparece un botón “Asignar a mi clase”.")}
            </li>
            <li>
              ${I.T("Or share the link or the QR code above with students directly.", "O compartan con los estudiantes el enlace o el código QR de arriba.")}
            </li>
          </ol>`
    }
    <p class="pw-note" id="pwAssignNote" role="status">${v.note || ""}</p>
    <h3>${I.T("Review student evidence", "Revisar la evidencia de los estudiantes")}</h3>
    <p>
      ${I.T("When a student presses “Share my pathway evidence with my teacher”, one packet for the whole pathway arrives in your class review queue (Class teacher view → Shared work), labelled “Pathway: …”. Each step shows what was done, the date, on their own or with help, and the student’s own words.", "Cuando un estudiante oprime “Compartir la evidencia de mi ruta con mi docente”, llega un solo paquete de toda la ruta a la cola de revisión de su clase (Vista de la clase para el maestro → Trabajo compartido), con la etiqueta “Pathway: …”. Cada paso muestra qué se hizo, la fecha, si fue por su cuenta o con ayuda, y las palabras del estudiante.")}
    </p>
  </section>`;
}

/** The whole builder page. v = { draft, pathway, objective, band, data, query, results, assign, link, qr, classes, note } */
export function builderHTML(I, v) {
  return html`<article class="pw-build">
    <header class="pw-head">
      <p class="eyebrow">${icon("teacher")} ${I.T("For teachers", "Para docentes")}</p>
      <h1 tabindex="-1">${I.T("Build a connected pathway", "Crear una ruta conectada")}</h1>
      <p class="pw-goal">
        ${I.T("Choose one language goal, line up activities that already exist on the site, and assign the whole pathway as one link. Students keep their place from step to step, and you review the evidence in one packet.", "Elijan una meta de lenguaje, ordenen actividades que ya existen en el sitio y asignen toda la ruta como un solo enlace. Los estudiantes no pierden su lugar entre un paso y otro, y ustedes revisan la evidencia en un solo paquete.")}
      </p>
      <p class="row-actions">
        <a class="btn small" href="${BASE}/pathways"
          >${I.T("Back to pathways (student view)", "Volver a las rutas (vista del estudiante)")}</a
        >
      </p>
    </header>
    <section class="pw-build-sec" aria-labelledby="pwGoalH">
      <h2 id="pwGoalH">${I.T("1. Choose the goal", "1. Elegir la meta")}</h2>
      <label class="pw-label" for="pwObjective">${I.T("Language goal", "Meta de lenguaje")}</label>
      <select id="pwObjective" class="pw-input" data-pw-objective>
        ${OBJECTIVES.map((o) => html`<option value="${o.id}" ${o.id === v.draft.objective ? "selected" : ""}>${I.S(o.keyUse, USE_ES[o.keyUse])}: ${I.S(...o.title)}</option>`)}
      </select>
      <p class="pw-why">${I.T(...v.objective.student)}</p>
      <label class="pw-label" for="pwStart">${I.T("Start from", "Empezar desde")}</label>
      <div class="pw-help-row">
        <select id="pwStart" class="pw-input" data-pw-start>
          <option value="">${I.S("A blank pathway", "Una ruta en blanco")}</option>
          ${BUILT_IN_IDS.map((id) => html`<option value="${id}">${I.S(...builtInDef(id).title)} (${I.S(...objectiveById(builtInDef(id).objective).title)})</option>`)}
        </select>
        <button type="button" class="btn" data-pw-start-go>
          ${I.T("Use this start", "Usar este inicio")}
        </button>
      </div>
      <label class="pw-label" for="pwTitle"
        >${I.T("Pathway title (letters, numbers and spaces)", "Título de la ruta (letras, números y espacios)")}</label
      >
      <input
        id="pwTitle"
        class="pw-input"
        type="text"
        maxlength="60"
        data-pw-title
        value="${v.draft.title}"
      />
      ${v.titleNote ? html`<p class="pw-note is-warn" role="status">${I.T("Some characters in the title cannot be stored in a class link and are left out.", "Algunos caracteres del título no se pueden guardar en un enlace de clase y se omiten.")}</p>` : ""}
    </section>
    <section class="pw-build-sec" aria-labelledby="pwStagesH">
      <h2 id="pwStagesH">${I.T("2. The steps, in order", "2. Los pasos, en orden")}</h2>
      ${stagesHTML(I, v)}
      ${v.dropped.length ? html`<p class="pw-note is-warn" role="status">${I.T(`Left out because it no longer exists: ${v.dropped.join(", ")}.`, `Se omitió porque ya no existe: ${v.dropped.join(", ")}.`)}</p>` : ""}
    </section>
    ${resourcesHTML(I, v)} ${rulesHTML(I, v)} ${assignHTML(I, v)}
  </article>`;
}
