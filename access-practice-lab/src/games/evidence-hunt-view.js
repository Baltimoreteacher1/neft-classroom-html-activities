// Evidence Hunt case board: one card per case file. Proven evidence is pinned as a strip under its
// claim (stamped "found" on a first-try or revised find, "shown" when the answer was revealed); the open
// case shows a magnifying glass until its evidence is found; later cases wait face down.
import { html, icon, settled } from "./engine.js";

export function renderBoard(s, env, passageOf) {
  const I = env.I;
  const card = (r, j) => {
    const p = passageOf(env, r.id);
    const found = settled(r.ers);
    const now = j === s.i;
    const proof = p.sentences.find((x) => x.kind === "proof");
    const state = found
      ? r.ers.status === "right"
        ? "is-found"
        : "is-shown"
      : now
        ? "is-now"
        : "is-wait";
    const label = found
      ? r.ers.status === "right"
        ? I.S("Evidence found", "Evidencia encontrada")
        : I.S("Evidence shown", "Evidencia mostrada")
      : now
        ? I.S("Searching now", "Buscando ahora")
        : I.S("Not opened yet", "Aún sin abrir");
    const body = found
      ? html`<p class="eh-card-claim">${p.claim.en}</p>
          <p class="eh-card-proof">“${proof.en}”</p>`
      : now
        ? html`<p class="eh-card-claim">${p.claim.en}</p>
            <span class="eh-card-lens" aria-hidden="true">${icon("detective")}</span>`
        : html`<span class="eh-card-q" aria-hidden="true">?</span>`;
    return html`<li
      class="eh-card ${state}"
      style="--tilt:${[-2, 1.5, -1, 2.5, -1.5, 1][j % 6]}deg"
    >
      <span class="eh-card-n">${j + 1}</span>${body}<span class="visually-hidden">${label}</span>
    </li>`;
  };
  const found = s.rounds.filter((r) => settled(r.ers)).length;
  return html`<aside class="eh-board" aria-label="${I.S("Case board", "Tablero de casos")}">
    <h3 class="eh-board-h">
      ${icon("evidence")}${I.T("Case board", "Tablero de casos")}<span class="eh-count"
        >${found}/${s.rounds.length}</span
      >
    </h3>
    <ol class="eh-cards">
      ${s.rounds.map(card)}
    </ol>
  </aside>`;
}
