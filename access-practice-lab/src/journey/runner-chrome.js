// Journey step runner chrome: header, six-step rail, support controls, help drawer and the "builds on" note.
// Every control carries a stable data-jr-* key so main.js can restore focus after a redraw.
import { BASE, TIERS, html, icon } from "../util.js";

export const stepHref = (band, missionId, stepId = "") =>
  `${BASE}/journey/${missionId}${stepId ? `/${stepId}` : ""}?grades=${band}`;
export const mapHref = (band) => `${BASE}/journey/map?grades=${band}`;
export const homeHref = (band) => `${BASE}/journey?grades=${band}`;

export const STATUS_TEXT = {
  new: ["Not started", "Sin empezar"],
  started: ["In progress", "En progreso"],
  "done-supported": ["Done with support", "Hecho con apoyo"],
  "done-independent": ["Done on my own", "Hecho por mi cuenta"],
};
const STATUS_ICON = { started: "pin", "done-supported": "check", "done-independent": "star" };
const SUPPORT_NOTE = {
  A: [
    "More help is open to start. You can close any of it.",
    "Empiezas con más ayuda abierta. Puedes cerrar la que quieras.",
  ],
  B: [
    "Some help is open. More is one tap away.",
    "Hay algo de ayuda abierta. Tienes más a un toque.",
  ],
  C: [
    "Help starts closed. You can still open any help you need.",
    "La ayuda empieza cerrada. Aún puedes abrir la que necesites.",
  ],
};
const SUPPORT_RANGE = {
  A: ["More support", "Más apoyo"],
  B: ["Some support", "Algo de apoyo"],
  C: ["More independence", "Más independencia"],
};

/** A step is a link when it is done, started, the current one, or the next one to do. */
export function reachableSteps(statuses, currentIdx) {
  const firstOpen = statuses.findIndex((s) => !s.startsWith("done"));
  return statuses.map((s, i) => s !== "new" || i === currentIdx || i <= firstOpen);
}

export function headerHTML({ I, band, missionId, mission, step, unit, number }) {
  const minutes = step.minutes;
  return html`<header class="jr-head panel">
    <p class="eyebrow">
      ${I.T(`Mission ${number}`, `Misión ${number}`)}${unit ? html` · ${I.T(...unit.title)}` : ""}
    </p>
    <h1 tabindex="-1" class="jr-title">
      <span class="jr-title-mission">${I.T(...mission.title)}</span>
      <span class="jr-title-step"
        >${I.T(`Step ${step.n} of 6: ${step.label[0]}`, `Paso ${step.n} de 6: ${step.label[1]}`)}</span
      >
    </h1>
    <p class="jr-goal">
      <strong>${I.T("My goal", "Mi meta")}</strong>
      ${I.T(...mission.goal[band])}
    </p>
    <p class="fine jr-meta">
      ${icon("clock")} ${I.T(`About ${minutes} minutes`, `Unos ${minutes} minutos`)} ·
      ${I.T(...step.purpose)}
    </p>
  </header>`;
}

export function railHTML({ I, band, missionId, steps, statuses, currentIdx }) {
  const reach = reachableSteps(statuses, currentIdx);
  return html`<ol class="jr-rail" aria-label="${I.S("Mission steps", "Pasos de la misión")}">
    ${steps.map((step, i) => {
      const status = statuses[i];
      const label = I.T(...step.label);
      const stateIcon = STATUS_ICON[status] ? icon(STATUS_ICON[status]) : "";
      const inner = html`<span class="jr-rail-ico">${icon(step.icon)}</span>
        <span class="jr-rail-label"><span class="jr-rail-n">${step.n}</span> ${label}</span>
        <span class="jr-rail-state">${stateIcon} ${I.T(...STATUS_TEXT[status])}</span>`;
      return html`<li class="jr-rail-step is-${status} ${i === currentIdx ? "is-current" : ""}">
        ${
          reach[i]
            ? html`<a
                href="${stepHref(band, missionId, step.id)}"
                data-jr-rail="${step.id}"
                ${i === currentIdx ? html`aria-current="step"` : ""}
                >${inner}</a
              >`
            : html`<span class="jr-rail-locked">${inner}</span>`
        }
      </li>`;
    })}
  </ol>`;
}

function supportHTML(I, support, showStep) {
  if (showStep)
    return html`<p class="fine jr-support-fixed">
      ${icon("flag")}
      ${I.T("Show is always on your own. No help is offered while you work.", "Muestra siempre es por tu cuenta. No se ofrece ayuda mientras trabajas.")}
    </p>`;
  return html`<fieldset class="jr-support">
    <legend>${I.T("How much help do you want?", "¿Cuánta ayuda quieres?")}</legend>
    <div class="jr-support-options">
      ${["A", "B", "C"].map(
        (l) =>
          html`<button
            type="button"
            class="jr-support-btn"
            data-jr-support="${l}"
            aria-pressed="${String(l === support)}"
          >
            <strong>${I.T(TIERS[l].name, TIERS[l].es)}</strong
            ><span>${I.T(...SUPPORT_RANGE[l])}</span>
          </button>`,
      )}
    </div>
    <p class="fine" role="status">
      ${I.T(...SUPPORT_NOTE[support])}
      ${I.T("This is a help setting, not a WIDA level or score. Changing it keeps all your work.", "Es un ajuste de ayuda, no un nivel ni un puntaje de WIDA. Si lo cambias, no pierdes tu trabajo.")}
    </p>
  </fieldset>`;
}

function ownHTML(I, own) {
  return html`<div class="jr-own">
    <button
      type="button"
      class="jr-own-btn"
      role="switch"
      aria-checked="${String(own)}"
      data-jr-own
    >
      <span class="jr-own-track" aria-hidden="true"><i></i></span>
      <span
        ><strong>${I.T("On my own", "Por mi cuenta")}</strong>
        <span class="fine"
          >${
            own
              ? I.T("On. It stays on for this step.", "Activado. Sigue activado en este paso.")
              : I.T("No supports. Practice without help.", "Sin apoyos. Practica sin ayuda.")
          }</span
        ></span
      >
    </button>
  </div>`;
}

/** Always-present way out: the journey map and "Save and leave" (everything already persists). */
export function quickNavHTML({ I, band }) {
  return html`<nav class="jr-quick" aria-label="${I.S("Leave this step", "Salir de este paso")}">
    <a class="btn small ghost" href="${mapHref(band)}">${icon("road")} ${I.T("Journey map", "Mapa del viaje")}</a>
    <a class="btn small ghost" href="${homeHref(band)}" data-jr-leave>${icon("save")} ${I.T("Save and leave", "Guardar y salir")}</a>
    <span class="fine">${I.T("Your work is saved on this device.", "Tu trabajo se guarda en este dispositivo.")}</span>
  </nav>`;
}

export function controlsHTML({ I, support, own, stepId, helpOpen }) {
  return html`<section
    class="jr-controls panel"
    aria-label="${I.S("Help and settings", "Ayuda y ajustes")}"
  >
    ${supportHTML(I, support, stepId === "show")} ${stepId === "show" ? "" : ownHTML(I, own)}
    <div class="jr-links">
      <button
        type="button"
        class="btn btn-secondary small"
        data-jr-help-toggle
        aria-expanded="${String(helpOpen)}"
        aria-controls="jrHelp"
      >
        ${icon("help")} ${I.T("Word help", "Ayuda con palabras")}
      </button>
    </div>
  </section>`;
}

/** Word help from the mission's vocabulary. Opening it records the step as done with support. */
export function helpHTML({ I, pack, independent }) {
  const vocab = pack?.vocab || [];
  return html`<section
    class="jr-help panel"
    id="jrHelp"
    aria-label="${I.S("Word help", "Ayuda con palabras")}"
  >
    <h2>${I.T("Word help", "Ayuda con palabras")}</h2>
    <p class="fine">
      ${
        independent
          ? I.T(
              "You are working on your own. Opening help means this step is recorded as done with support.",
              "Estás trabajando por tu cuenta. Si abres la ayuda, este paso se anota como hecho con apoyo.",
            )
          : I.T("These words are from this mission.", "Estas palabras son de esta misión.")
      }
    </p>
    <dl class="jr-vocab">
      ${vocab.map(
        ([term, meaning, es]) =>
          html`<div>
            <dt lang="en">${term}</dt>
            <dd lang="en">${meaning}</dd>
            <dd class="jr-vocab-es" lang="es">${es}</dd>
          </div>`,
      )}
    </dl>
  </section>`;
}

/** Gentle note when an earlier step is not done. Never blocks. */
export function buildsOnHTML({ I, band, missionId, steps, statuses, currentIdx }) {
  const miss = statuses.findIndex((s, i) => i < currentIdx && !s.startsWith("done"));
  if (miss < 0) return "";
  const step = steps[miss];
  return html`<p class="jr-note" role="note">
    ${icon("info")}
    ${I.T(`This builds on Step ${step.n}: ${step.label[0]}.`, `Esto se apoya en el Paso ${step.n}: ${step.label[1]}.`)}
    <a href="${stepHref(band, missionId, step.id)}">${I.T("Go to that step", "Ir a ese paso")}</a>
    ${I.T("or keep going here.", "o sigue aquí.")}
  </p>`;
}
