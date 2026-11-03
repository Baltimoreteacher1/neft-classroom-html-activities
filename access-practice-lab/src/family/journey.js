// The family journey: six plain steps from "what is this?" to "what do we do next?". Every step is a page that already
// exists (or the new Understand ACCESS page); the stepper only says where you are and what comes next.
import { BASE, html, icon } from "../util.js";

const STEPS = [
  { id: "welcome", path: "", en: "Welcome", es: "Bienvenida" },
  { id: "understand", path: "/understand", en: "Understand ACCESS", es: "Entender ACCESS" },
  { id: "choose", path: "/practice", en: "Choose a skill", es: "Elegir una destreza" },
  { id: "together", path: "/trip", en: "Practice together", es: "Practicar juntos" },
  { id: "review", path: "/progress", en: "Review progress", es: "Revisar el progreso" },
  { id: "plan", path: "/start", en: "Plan the next session", es: "Planear la próxima sesión" },
];

export const JOURNEY_STEPS = STEPS;

/** `current` is a step id. Renders a numbered list so a screen reader hears "step 2 of 6". */
export function journeyHTML(I, current, band) {
  const at = STEPS.findIndex((s) => s.id === current);
  return html`<nav class="fam-journey no-print" aria-label="${I.S("Family journey", "Recorrido familiar")}">
    <ol>
      ${STEPS.map(
        (s, i) => html`<li class="${i < at ? "is-done" : i === at ? "is-current" : ""}">
          <a href="${BASE}/family${s.path}?grades=${band}" ${i === at ? html`aria-current="step"` : ""}>
            <span class="fam-j-num" aria-hidden="true">${i < at ? icon("check") : i + 1}</span>
            <span class="fam-j-text">${I.T(s.en, s.es)}</span>
          </a>
        </li>`,
      )}
    </ol>
  </nav>`;
}
