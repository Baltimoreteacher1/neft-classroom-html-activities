// hub-card.js — the Games hub's "Arcade worlds" section: one card per flagship canvas game that fits the learner's grade
// band, built from the same registry the host reads (arcade/games.js). It reuses the hub's own card classes so the games
// sit in the Language Game Studio like any other game; only the picture is different (the game's own cover art).
import { BASE, html, raw } from "../util.js";
import { ARCADE_GAMES, arcadeBandOk } from "./games.js";
import { coverSVG as odysseyCover } from "./odyssey/cover.js";

const COVER = { "syntax-odyssey": odysseyCover };
const pair = (I, p) => I.T(p[0], p[1]);

function card(g, I, band) {
  const href = `${BASE}/games/${g.id}?${new URLSearchParams({ grades: band })}`;
  const cover = COVER[g.id]?.(band, I.mode === "es" ? "es" : "en") || "";
  return html`<article class="gs-card gs-arcade-card" data-arcade-card="${g.id}">
    <a class="gs-card-art gs-arcade-art" href="${href}" tabindex="-1" aria-hidden="true">${raw(cover.replace(/role="img"[^>]*aria-label="[^"]*"/, 'aria-hidden="true"'))}<span class="gs-badge">${I.T("New", "Nuevo")}</span></a>
    <div class="gs-card-body">
      <h3><a href="${href}">${pair(I, g.title)}</a></h3>
      <p class="gs-card-tag">${pair(I, g.tag)}</p>
      <p class="gs-card-meta"><span>${I.T(`About ${g.minutes} minutes`, `Unos ${g.minutes} minutos`)}</span><span>${g.domains.map((d) => I.S(d, { Listening: "Escuchar", Reading: "Leer", Writing: "Escribir", Speaking: "Hablar" }[d] || d)).join(" · ")}</span></p>
      <p class="fine">${I.T("Calm mode and Auto-walk let you play without fast jumping. There is no timer in calm mode.", "El modo tranquilo y la caminata automática te permiten jugar sin saltos rápidos. No hay cronómetro en el modo tranquilo.")}</p>
      <a class="btn btn-primary" href="${href}">${I.T("Play", "Jugar")}<span class="visually-hidden"> ${pair(I, g.title)}</span></a>
    </div>
  </article>`;
}

/** The section's markup for this band, or "" when no arcade game fits it. */
export function arcadeHubHTML(I, band) {
  const games = ARCADE_GAMES.filter((g) => arcadeBandOk(g, band));
  if (!games.length) return "";
  return html`<section class="gs-arcade" id="gs-arcade" aria-labelledby="gs-arcade-h"><h2 id="gs-arcade-h">${I.T("Arcade worlds", "Mundos de arcade")}</h2>
    <p class="fine">${I.T("Bigger games with a world to explore. A language gate pauses the action, and every game has a calmer way to play.", "Juegos más grandes con un mundo para explorar. Una puerta de lenguaje detiene la acción y todos tienen una forma más tranquila de jugar.")}</p>
    <div class="gs-grid gs-grid-3">${games.map((g) => card(g, I, band))}</div></section>`;
}
