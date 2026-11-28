// Lower sections of the premium Language Labs hub: the five-step path, author's-craft mentor sentences and the
// Teacher / Family guides. Same data hooks as the original hub (data-ll-speak, lab links, <details open>).
import { BASE, html, icon } from "../util.js";
import { HERE_STAMPS } from "./notebook.js";
import { dimPill, sectionHead, speakBtn, usePill } from "./parts.js";

export function journeyHTML(I, p) {
  return html`<section class="llp-journey" aria-labelledby="llJourneyH">
    ${sectionHead(
      I.T("How Language Scientists Work", "Cómo trabajan los científicos del lenguaje"),
      I.T("The five-step inquiry path", "El camino de indagación de cinco pasos"),
      "llJourneyH",
      I.T(
        "Every lab follows the same path, so you always know what comes next. Each step earns one discovery stamp in your notebook.",
        "Todos los laboratorios siguen el mismo camino, así que siempre sabes qué sigue. Cada paso gana un sello de descubrimiento en tu cuaderno.",
      ),
    )}
    <ol class="llp-path">
      ${p.stages.map((s, i) => {
        const stamp = HERE_STAMPS[i];
        return html`<li class="llp-station">
          <span class="llp-medal" aria-hidden="true">${icon(s.icon)}<b>${s.num}</b></span>
          <h3>${I.T(...s.title)}</h3>
          <p class="llp-station-do">${I.T(...s.do)}</p>
          <p class="llp-frame" lang="en">${I.TARGET(...s.frame)}</p>
          <p class="llp-station-stamp">
            ${I.T(`Earns the ${stamp.name[0]} stamp`, `Gana el sello ${stamp.name[1]}`)}
          </p>
        </li>`;
      })}
    </ol>
  </section>`;
}

export function craftHTML(I, p, band) {
  return html`<section class="llp-craft" aria-labelledby="llCraftH">
    ${sectionHead(
      I.T(`Patterns of Power · ${p.grades[0]}`, `Patrones de poder · ${p.grades[1]}`),
      I.T("Author's craft mini-lessons", "Minilecciones del oficio del autor"),
      "llCraftH",
      I.T(
        "Compare an everyday draft with a published author's move, listen to the mentor sentence, then jump straight into that lab.",
        "Compara un borrador cotidiano con la jugada de un autor, escucha la oración modelo y entra directamente en ese laboratorio.",
      ),
    )}
    <ul class="llp-craft-grid">
      ${p.craft.map(
        (c, idx) => html`<li class="llp-craft-card">
          <div class="llp-craft-top">
            <span class="llp-craft-num" aria-hidden="true">${String(idx + 1).padStart(2, "0")}</span>
            ${usePill(I, c.use)} ${dimPill(I, c.dimension)}
          </div>
          <h3>${I.T(...c.title)}</h3>
          <p class="llp-craft-tip">${I.T(...c.tip)}</p>
          <p class="llp-before">
            <span class="llp-tag">${I.T("Before:", "Antes:")}</span> <span lang="en">${c.before}</span>
          </p>
          <blockquote class="llp-mentor">
            <span class="llp-tag">${I.T("Mentor sentence:", "Oración modelo:")}</span>
            <span lang="en">“${c.mentor}”</span>
          </blockquote>
          <div class="llp-craft-actions">
            ${speakBtn(I, c.mentor, "Listen", "Escuchar")}
            <a class="btn small" href="${BASE}/${c.href}${c.href.includes("?") ? "&" : "?"}grades=${band}">
              ${I.T("Open lab", "Abrir laboratorio")} ${icon("arrow-right")}
            </a>
          </div>
        </li>`,
      )}
    </ul>
  </section>`;
}

const routines = (I, list) => html`<ul class="llp-routines">
  ${list.map((r) => html`<li><strong>${I.T(...r.title)}</strong><p>${I.T(...r.body)}</p></li>`)}
</ul>`;

export function guidesHTML(I, p) {
  return html`<section class="llp-guides" aria-labelledby="llGuidesH">
    <h2 id="llGuidesH" class="visually-hidden">${I.T("Teacher and Family Guides", "Guías para docentes y familias")}</h2>
    <div class="llp-guides-grid">
      <details class="llp-guide" open>
        <summary>${icon("teacher")} ${I.T(...p.teacher.summary)}</summary>
        <div class="llp-guide-body">
          ${routines(I, p.teacher.routines)}
          <div class="llp-standards">
            <strong>${I.T("WIDA 2020 ELD & CCSS Alignment", "Alineación con WIDA 2020 ELD y CCSS")}</strong>
            <ul>
              ${p.teacher.standards.map((st) => html`<li>${I.T(...st)}</li>`)}
            </ul>
          </div>
        </div>
      </details>
      <details class="llp-guide" open>
        <summary>${icon("families")} ${I.T(...p.family.summary)}</summary>
        <div class="llp-guide-body">
          <p>${I.T(...p.family.lead)}</p>
          ${routines(I, p.family.prompts)}
        </div>
      </details>
    </div>
  </section>`;
}
