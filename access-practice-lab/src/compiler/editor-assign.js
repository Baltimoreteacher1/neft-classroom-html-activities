// Experience Builder: the Assign step. Publishing goes through the existing class system (the class server stores
// the validated definition; the assignment is the same { id, title, path, due } every other assignment uses). With no
// class on this device the instructor can still play the draft here, export it as a file, and follow the exact steps
// to open a class. Rules it keeps: only a valid experience can be published; the passcode typed here is used for the
// call and never stored by this screen.
import { BASE, html } from "../util.js";
import { playPath } from "./store.js";

export const API_ERRORS = {
  offline: [
    "No connection to the class server. The draft is still saved on this device.",
    "No hay conexión con el servidor de clases. El borrador sigue guardado en este dispositivo.",
  ],
  unauthorized: [
    "The class passcode or teacher key was not accepted.",
    "No se aceptó el código de acceso de la clase ni la clave docente.",
  ],
  "class-not-found": [
    "That class was not found. Check the class code.",
    "No se encontró esa clase. Revise el código de clase.",
  ],
  "invalid-code": [
    "That is not a class code. A class code has six letters and numbers.",
    "Ese no es un código de clase. Un código de clase tiene seis letras y números.",
  ],
  "backend-not-configured": [
    "The class server is not available on this site, so publishing is off. You can still play and export the experience.",
    "El servidor de clases no está disponible en este sitio; no se puede publicar. Todavía puede jugar y exportar la experiencia.",
  ],
  "definition-too-large": [
    "The experience is too large to publish (limit 120 KB). Shorten the text or remove evidence.",
    "La experiencia es demasiado grande para publicar (límite 120 KB). Acorte el texto o quite evidencia.",
  ],
  "invalid-definition": [
    "The class server refused the experience as invalid. Open Check and fix what is listed.",
    "El servidor de clases rechazó la experiencia por no ser válida. Abra Revisión y corrija lo que aparece.",
  ],
  "too-many-experiences": [
    "This class already has the most experiences it can hold. Unpublish one first.",
    "Esta clase ya tiene el máximo de experiencias. Primero retire una.",
  ],
  "too-many-publishes": [
    "Too many publishes in the last hour. Try again later.",
    "Demasiadas publicaciones en la última hora. Intente más tarde.",
  ],
  "invalid-assignments": [
    "The class already has the most assignments it can hold. Remove one in the class dashboard, then add this again.",
    "La clase ya tiene el máximo de tareas. Quite una en el panel de la clase y vuelva a agregar esta.",
  ],
};
export const apiError = (res) =>
  API_ERRORS[res?.httpStatus === 401 ? "unauthorized" : res?.error] || [
    `The class server answered: ${res?.error || "error"}.`,
    `El servidor de clases respondió: ${res?.error || "error"}.`,
  ];

export function assignHTML(I, ui, classes, origin) {
  const { entry, key, report } = ui;
  const pub = entry.published;
  const link = pub ? `${origin}${playPath(pub.id)}` : "";
  const a = ui.assign;
  return html`<section class="panel xb-step" aria-labelledby="xbAsgH">
      <h2 id="xbAsgH">${I.T("Assign to a class", "Asignar a una clase")}</h2>
      ${
        report.ok
          ? ""
          : html`<p class="xb-status is-bad" role="status">
              ${I.T("This experience cannot be published yet. Open Check to see what to fix.", "Esta experiencia todavía no se puede publicar. Abra Revisión para ver qué corregir.")}
              <a href="${BASE}/experience-builder/${key}/edit?tab=check"
                >${I.T("Open Check", "Abrir Revisión")}</a
              >
            </p>`
      }
      ${
        pub
          ? html`<div class="xb-published" data-xb-published="${pub.id}">
              <p class="xb-status is-ok" role="status">
                ${I.S(`Published to class ${pub.code}.`, `Publicada en la clase ${pub.code}.`)}
                ${pub.assigned ? I.T("It is on the class's Assigned practice list.", "Está en la lista de práctica asignada de la clase.") : ""}
              </p>
              <label class="field" for="xbLink"
                >${I.T("Link for learners", "Enlace para los estudiantes")}
                <input id="xbLink" type="text" readonly value="${link}"
              /></label>
              <div class="row-actions">
                <button type="button" class="btn small" data-xb-act="copy-link">
                  ${I.T("Copy link", "Copiar enlace")}
                </button>
                <button type="button" class="btn small ghost" data-xb-act="unpublish">
                  ${I.T("Unpublish", "Retirar de la clase")}
                </button>
              </div>
              <p class="fine">
                ${I.T("Edited it since? Publish again to update what learners open. Their saved play starts over on a new version.", "¿La editó después? Publique otra vez para actualizar lo que abren los estudiantes. Lo que tenían guardado empieza de nuevo en una versión nueva.")}
              </p>
            </div>`
          : ""
      }
      ${
        classes.length
          ? html`<label class="field" for="xbClass"
              >${I.T("Class on this device", "Clase en este dispositivo")}
              <select id="xbClass" data-xb-class>
                ${classes.map((c) => html`<option value="${c.code}" ${c.code === (pub?.code || a.code) ? "selected" : ""}>${c.title ? `${c.title} · ` : ""}${c.code}</option>`)}
              </select></label
            >`
          : html`<div class="xb-noclass" data-xb-noclass>
              <p>
                ${I.T("No class is open on this device yet. To assign this experience:", "Todavía no hay una clase abierta en este dispositivo. Para asignar esta experiencia:")}
              </p>
              <ol>
                <li>
                  ${I.T("Open the class dashboard and create a class, or open one with its passcode.", "Abra el panel de la clase y cree una clase, o abra una con su código de acceso.")}
                  <a href="${BASE}/class/teacher">${I.T("Class dashboard", "Panel de la clase")}</a>
                </li>
                <li>
                  ${I.T("Come back to this page. The class appears here; choose Publish and assign.", "Vuelva a esta página. La clase aparece aquí; elija Publicar y asignar.")}
                </li>
                <li>
                  ${I.T("Learners open Assigned practice, or the link you copy from here.", "Los estudiantes abren Práctica asignada, o el enlace que usted copie aquí.")}
                </li>
              </ol>
              <p class="fine">
                ${I.T("Or type a class code and its teacher passcode:", "O escriba un código de clase y su código de acceso docente:")}
              </p>
              <div class="xb-grid">
                <label class="field" for="xbCode"
                  >${I.T("Class code", "Código de clase")}<input
                    id="xbCode"
                    type="text"
                    maxlength="6"
                    autocomplete="off"
                    data-xb-code
                    value="${a.code}"
                /></label>
                <label class="field" for="xbPass"
                  >${I.T("Teacher passcode", "Código de acceso docente")}<input
                    id="xbPass"
                    type="text"
                    maxlength="12"
                    autocomplete="off"
                    data-xb-pass
                /></label>
              </div>
            </div>`
      }
      <label class="xb-check" for="xbShowSource"
        ><input
          id="xbShowSource"
          type="checkbox"
          data-xb-op="meta.set"
          data-xb-arg="${JSON.stringify({ field: "showSource" })}"
          ${entry.def.compiled?.settings?.showSource ? "checked" : ""}
        />
        ${I.T("Show source: let learners read my whole original text", "Mostrar la fuente: dejar que los estudiantes lean todo mi texto original")}</label
      >
      <p class="fine">
        ${I.T("Unless this is ticked, learners download only the scenes, people, evidence and tasks. Your original text stays on this device.", "Si no lo marca, los estudiantes descargan solo las escenas, las personas, la evidencia y las tareas. Su texto original se queda en este dispositivo.")}
      </p>
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-xb-act="publish"
          ${report.ok && !a.busy ? "" : "disabled"}
        >
          ${pub ? I.T("Publish again", "Publicar otra vez") : I.T("Publish and assign", "Publicar y asignar")}
        </button>
      </div>
      ${a.msg ? html`<p class="xb-status ${a.ok ? "is-ok" : "is-bad"}" role="status" data-xb-assign-msg>${I.S(...a.msg)}</p>` : ""}
    </section>
    <section class="panel xb-step" aria-labelledby="xbLocalH">
      <h2 id="xbLocalH">${I.T("Without a class", "Sin una clase")}</h2>
      <p>
        ${I.T("Play the draft on this device, or save it as a file to keep or to open on another computer.", "Juegue el borrador en este dispositivo, o guárdelo como archivo para conservarlo o abrirlo en otra computadora.")}
      </p>
      <div class="row-actions">
        <a class="btn small" href="${playPath(key)}"
          >${I.T("Play on this device", "Jugar en este dispositivo")}</a
        >
        <button type="button" class="btn small" data-xb-act="export">
          ${I.T("Export as a .json file", "Exportar como archivo .json")}
        </button>
      </div>
      <p class="fine">
        ${I.T("What learners do is reviewed where their other work is: their spoken and written responses go through the feedback loop, and a learner in a class can share them to the class review queue.", "Lo que hacen los estudiantes se revisa donde está su otro trabajo: sus respuestas orales y escritas pasan por el ciclo de comentarios, y un estudiante en una clase puede compartirlas en la cola de revisión de la clase.")}
      </p>
    </section>`;
}
