// Draws the growth shields (src/lang/shields.js): five shields per skill, filled when earned, named in words.
// No numbers on screen: each skill reads as its earned shield names, and screen readers hear the same names.
import { shieldBoard } from "../lang/shields.js";
import { DOMAIN_META, html, raw } from "../util.js";

const SHIELD_SVG = (earned) =>
  raw(
    `<svg class="shield-ico" viewBox="0 0 24 28" aria-hidden="true" focusable="false"><path d="M12 1 2 5v8c0 6.5 4.3 11.6 10 14 5.7-2.4 10-7.5 10-14V5L12 1Z" fill="${earned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"/>${earned ? '<path d="m7.5 14 3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' : ""}</svg>`,
  );

export function shieldsHTML(I, entries, records, { large = false } = {}) {
  const board = shieldBoard(entries, records);
  return html`<section
    class="panel growth-shields ${large ? "is-large" : ""}"
    aria-labelledby="growShields"
  >
    <h2 id="growShields">${I.T("My skill shields", "Mis escudos de destrezas")}</h2>
    <p class="fine">
      ${I.T("Each shield is a habit you have shown. Shields never go away. They are not a level or a score.", "Cada escudo es un hábito que mostraste. Los escudos nunca se pierden. No son un nivel ni una calificación.")}
    </p>
    <ul class="shield-board">
      ${board.map((row) => {
        const earned = row.shields.filter((sh) => sh.earned);
        const next = row.shields.find((sh) => !sh.earned);
        return html`<li class="shield-row d-${row.domain.toLowerCase()}">
          <h3>${I.T(row.domain, DOMAIN_META[row.domain].es)}</h3>
          <p
            class="shield-set"
            role="img"
            aria-label="${earned.length ? I.S(`Shields earned: ${earned.map((x) => x.name.en).join(", ")}`, `Escudos ganados: ${earned.map((x) => x.name.es).join(", ")}`) : I.S("No shields yet", "Todavía no hay escudos")}"
          >
            ${row.shields.map((sh) => html`<span class="shield ${sh.earned ? "is-earned" : ""}" title="${I.S(sh.name.en, sh.name.es)}">${SHIELD_SVG(sh.earned)}</span>`)}
          </p>
          ${earned.length ? html`<p class="shield-names">${earned.map((sh) => html`<span class="sticker">${I.TO(sh.name)}</span>`)}</p>` : ""}
          ${next ? html`<p class="fine">${I.T("Next shield:", "Próximo escudo:")} ${I.TO(next.name)} · ${I.TO(next.how)}</p>` : html`<p class="fine">${I.T("Every shield earned for this skill.", "Ganaste todos los escudos de esta destreza.")}</p>`}
        </li>`;
      })}
    </ul>
  </section>`;
}
