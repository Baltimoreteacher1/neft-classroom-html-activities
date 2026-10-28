// Help My Child: a collapsible adult-facing panel on every activity (before / during / after).
// Content comes from coach.js; this file only draws it. It never reads the child's answers, so it can
// say what to listen for and what to ask, but it cannot claim to know where the child went wrong.
import { html, icon, raw } from "../util.js";

let open = false;
if (typeof document !== "undefined" && typeof document.addEventListener === "function")
  document.addEventListener(
    "toggle",
    (e) => {
      if (e.target?.id === "copilot") open = e.target.open;
    },
    true,
  );

const BEFORE = ["ask", "success"];
const DURING = ["say", "listen", "stuck", "explain", "support", "tip"];
const AFTER = ["praise", "reinforce", "ask", "away"];

function phase(I, name, slots, lines) {
  const items = slots.filter((slot) => lines[slot]);
  if (!items.length) return "";
  return html`<section class="copilot-phase" aria-labelledby="copilot-${name}">
    <h3 id="copilot-${name}">${I.L(`copilot.phase.${name}`)}</h3>
    <ul>
      ${items.map((slot) => html`<li>${I.T(lines[slot].en, lines[slot].es)}</li>`)}
    </ul>
  </section>`;
}

/** `coaching` is buildCoaching()'s result; null when the skill has no coaching data. */
export function copilotHTML(I, coaching) {
  if (!coaching) return "";
  const { phases, facts, contentAware, minutes } = coaching;
  return html`<details class="copilot no-print" id="copilot" ${open ? raw("open") : ""}>
    <summary>
      ${icon("families")}<span class="copilot-title">${I.L("copilot.title")}</span>
      <small>${I.L("copilot.optional")}${minutes ? html` · ${I.L("copilot.time", { time: minutes })}` : ""}</small>
    </summary>
    <div class="copilot-body">
      <p class="copilot-scope">
        ${contentAware
          ? I.L("copilot.scope", { skill: { en: facts.skillEn, es: facts.skillEs || `“${facts.skillEn}”` } })
          : I.L("copilot.general")}
      </p>
      ${phase(I, "before", BEFORE, phases.before)}
      ${phase(I, "during", DURING, phases.during)}
      ${phase(I, "after", AFTER, phases.after)}
      <p class="fine copilot-note">${I.L("copilot.note")}</p>
    </div>
  </details>`;
}
