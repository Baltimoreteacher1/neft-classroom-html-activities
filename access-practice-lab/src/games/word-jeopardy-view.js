// Word Jeopardy markup: scoreboard, the clue board, the flipped clue card, the confidence-point panels and the
// Final Clue. Pure functions of state (no clock, no randomness here); word-jeopardy.js owns every rule.
import { audioBtn, feedbackHTML, frameBox, hintHTML, html, icon, raw, settled } from "./engine.js";
import { mascot, svg } from "./art.js";

const TEAMS = [
  ["Sun Team", "Equipo Sol"],
  ["Wave Team", "Equipo Ola"],
];
const nameOf = (s, t, I) => (s.teams === 2 ? I.T(...TEAMS[t]) : I.T("Your points", "Tus puntos"));
const nameS = (s, t, I) => (s.teams === 2 ? I.S(...TEAMS[t]) : I.S("You", "Tú"));
const host = (s) => (s.band === "6-8" ? "juno" : "pip");
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const burst = () =>
  svg(
    "0 0 200 80",
    [
      [24, 22, 9, "#f2c15b"],
      [176, 18, 7, "#1fa6a2"],
      [60, 64, 6, "#f2765a"],
      [150, 60, 8, "#f2c15b"],
      [100, 10, 5, "#1fa6a2"],
    ]
      .map(
        ([x, y, r, f], i) =>
          `<path style="--i:${i}" class="wj-star" transform="translate(${x} ${y})" d="M0 ${-r}L${r * 0.3} ${-r * 0.3}L${r} 0L${r * 0.3} ${r * 0.3}L0 ${r}L${-r * 0.3} ${r * 0.3}L${-r} 0L${-r * 0.3} ${-r * 0.3}Z" fill="${f}"/>`,
      )
      .join(""),
    { cls: "wj-burst" },
  );
const spotlight = (band) =>
  svg(
    "0 0 240 90",
    `<path d="M120 0L40 90H200Z" fill="#f2c15b" opacity=".28"/><ellipse cx="120" cy="80" rx="80" ry="9" fill="#f2c15b" opacity=".45"/><rect x="72" y="26" width="96" height="44" rx="${band === "6-8" ? 6 : 12}" fill="#17324d" stroke="#f2c15b" stroke-width="4"/><path transform="translate(120 46)" d="M0 -18L5.3 -5.6L18.5 -4.8L8.3 3.8L11.5 16.5L0 9.4L-11.5 16.5L-8.3 3.8L-18.5 -4.8L-5.3 -5.6Z" fill="#f2c15b"/>`,
    { cls: "wj-spot" },
  );

function scoreboard(s, I) {
  const teams = s.teams === 2 ? [0, 1] : [0];
  return html`<div class="wj-scores${s.teams === 2 ? " is-teams" : ""}">
    ${teams.map(
      (t) =>
        html`<div
          class="wj-team wj-team-${t}${s.teams === 2 && s.turn === t && s.phase !== "final" && s.phase !== "final-wager" && s.phase !== "end" ? " is-turn" : ""}"
        >
          <span class="wj-tname">${nameOf(s, t, I)}</span>
          <strong class="wj-pts">${s.scores[t]}</strong>
          ${s.fx && s.fx.teams.includes(t) && s.fx.delta + s.fx.bonus !== 0 ? html`<span class="wj-pop${s.fx.delta + s.fx.bonus < 0 ? " is-down" : ""}" aria-hidden="true">${signed(s.fx.delta + s.fx.bonus)}</span>` : ""}
        </div>`,
    )}
    <p class="wj-streak${s.streaks[s.turn] >= 2 ? " is-hot" : ""}">
      ${icon("star")}${I.T(`Streak ${s.streaks[s.turn]}`, `Racha ${s.streaks[s.turn]}`)}
    </p>
  </div>`;
}

function teamPicker(s, I) {
  if (s.played) return "";
  return html`<div
    class="wj-mode"
    role="group"
    aria-label="${I.S("Who is playing?", "¿Quién juega?")}"
  >
    <span class="wj-mode-l">${I.T("Players", "Jugadores")}</span>
    <button type="button" class="wj-mode-b" data-g-teams="1" aria-pressed="${s.teams === 1}">
      ${icon("user")}${I.T("Solo", "Solo")}
    </button>
    <button type="button" class="wj-mode-b" data-g-teams="2" aria-pressed="${s.teams === 2}">
      ${icon("classroom")}${I.T("2 teams, one device", "2 equipos, un aparato")}
    </button>
  </div>`;
}

function boardGrid(s, env, h) {
  const I = env.I;
  const open = h.tileKeys(s).filter((k) => h.tileAt(s, k).pts === null);
  const focusKey = s.last
    ? open.find((k) => k.split("-")[0] === s.last.split("-")[0]) || open[0]
    : null;
  const rows = Math.max(...s.cats.map((c) => c.clues.length));
  const heads = s.cats.map(
    (c) => html`<div class="wj-head" aria-hidden="true">${c.short ? html`<span class="wj-hl">${I.T(c.name.en, c.name.es)}</span><span class="wj-hs">${I.T(c.short.en, c.short.es)}</span>` : I.T(c.name.en, c.name.es)}</div>`,
  );
  const tiles = [];
  for (let r = 0; r < rows; r += 1)
    s.cats.forEach((c, ci) => {
      const q = c.clues[r];
      if (!q) return tiles.push(html`<span></span>`);
      const key = `${ci}-${r}`;
      const done = q.pts !== null;
      const status = done
        ? I.S(`answered, ${signed(q.pts)} points`, `respondida, ${signed(q.pts)} puntos`)
        : I.S("available", "disponible");
      const label = `${I.S(c.name.en, c.name.es)}, ${q.value} ${I.S("points", "puntos")}, ${status}`;
      tiles.push(
        html`<button
          type="button"
          class="wj-tile${done ? " is-done" : ""}${done && q.rs.status === "right" ? " is-won" : ""}${done && key === s.dd ? " is-dd" : ""}"
          data-g-tile="${key}"
          aria-label="${label}"
          ${done ? "disabled" : ""}
          ${key === focusKey ? raw("data-wj-focus") : ""}
        >
          ${done ? html`<span class="wj-tile-mark">${icon(q.rs.status === "right" ? "check" : "bulb")}<span class="wj-tile-pts">${signed(q.pts)}</span></span>` : html`<span class="wj-tile-v">${q.value}</span>`}
        </button>`,
      );
    });
  return html`<div
    class="wj-board"
    style="--wj-cols:${s.cats.length}"
    role="group"
    aria-label="${I.S(`Clue board: ${open.length} tiles left`, `Tablero de pistas: quedan ${open.length} casillas`)}"
  >
    ${heads}${tiles}
  </div>`;
}

function choices(q, env, name) {
  const locked = settled(q.rs);
  return html`<div
    class="gs-choices wj-choices"
    role="group"
    aria-label="${env.I.S("Answers", "Respuestas")}"
  >
    ${q.choices.map((c, i) => {
      const miss = q.rs.picks.includes(i) && i !== q.answer;
      const right = locked && i === q.answer;
      return html`<button
        type="button"
        class="gs-choice wj-choice${right ? " is-right" : ""}${miss ? " is-miss" : ""}"
        data-g-${name}="${i}"
        ${locked || miss ? "disabled" : ""}
      >
        <span class="wj-letter" aria-hidden="true">${"ABCD"[i]}</span
        ><span class="wj-ans"
          >${c.en}${c.es && env.sup.gloss !== "off" && c.es !== c.en ? html`<span class="gs-gloss" lang="es">${c.es}</span>` : ""}</span
        >
        ${right ? icon("check") : miss ? icon("x") : ""}
      </button>`;
    })}
  </div>`;
}

function feedback(q, env, { base, wagered }) {
  const I = env.I;
  const rs = q.rs;
  const ans = q.choices[q.answer];
  const pts = q.pts ?? 0;
  const bonus =
    q.pts !== null && rs.status === "right" && rs.tries === 1 && rs.h === 0 && pts > base;
  return feedbackHTML(rs, {
    I,
    right:
      rs.status === "right"
        ? I.T(
            `${signed(pts)} points${rs.tries > 1 ? " (half points for a revised answer)" : ""}.${bonus ? " Streak bonus +50!" : ""}`,
            `${signed(pts)} puntos${rs.tries > 1 ? " (la mitad por una respuesta revisada)" : ""}.${bonus ? " ¡Bono de racha +50!" : ""}`,
          )
        : "",
    retry: I.T(
      "Read the clue again with each answer. Open a hint if you want one, then try again for half points.",
      "Lee la pista otra vez con cada respuesta. Abre una pista si quieres y vuelve a intentarlo por la mitad de los puntos.",
    ),
    answer: html`${I.T("The answer:", "La respuesta:")}
      <strong>${ans.en}</strong
      >${wagered && pts < 0 ? html` · ${signed(pts)} ${I.T("points", "puntos")}` : ""}`,
    explain: I.T(q.explain.en, q.explain.es),
    hint: "",
  });
}

function clueCard(s, env, h, q, { cat, value, dd, fin }) {
  const I = env.I;
  const rs = q.rs;
  const mood = rs.status === "right" ? "cheer" : rs.status === "retry" ? "think" : "hi";
  const fresh = rs.tries === 0 && rs.h === 0;
  const open = h.tileKeys(s).filter((k) => h.tileAt(s, k).pts === null).length;
  return html`<article
    class="wj-card${rs.status === "right" ? " is-right" : ""}"
    aria-labelledby="wj-q"
  >
    <header class="wj-card-top">
      <span class="wj-cat">${cat}</span
      >${dd ? html`<span class="wj-dd-tag">${icon("star")}${I.T("Daily Double", "Doble Diario")}</span>` : ""}<span
        class="wj-val"
        >${value} ${I.T("pts", "pts")}</span
      >
    </header>
    ${s.teams === 2 && !fin ? html`<p class="wj-turn wj-team-${s.turn}">${icon("user")}${I.T(`${TEAMS[s.turn][0]} answers`, `Responde el ${TEAMS[s.turn][1]}`)}</p>` : ""}
    <div class="wj-host">
      <div class="wj-guide">
        ${mascot(host(s), s.band, mood, 84)}${rs.status === "right" ? burst() : ""}
      </div>
      <div class="wj-bubble">
        <h2 id="wj-q" class="wj-clue" tabindex="-1" ${fresh ? raw("data-wj-focus") : ""}>
          ${I.T(q.clue.en, q.clue.es)}
        </h2>
        ${audioBtn(q.clue.en, I, I.S("Hear the clue", "Escuchar la pista"))}
      </div>
    </div>
    ${frameBox("What is ___?", env, { label: I.T("Say it like a host", "Dilo como en el programa") })}
    ${choices(q, env, "choice")}
    ${settled(rs) && fin ? "" : hintHTML(rs, [I.T(q.hint.en, q.hint.es), I.T("Put each answer into the clue. Which one makes a true sentence?", "Pon cada respuesta en la pista. ¿Cuál forma una oración verdadera?")], env, { disabled: settled(rs) })}
    ${feedback(q, env, { base: value, wagered: dd || fin })}
    ${settled(rs) && !fin ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-back ${raw("data-wj-focus")}>${icon(open ? "grid" : "flag")}${open ? I.T("Back to the board", "Volver al tablero") : I.T("Go to the Final Clue", "Ir a la Pista final")}</button></div>` : ""}
  </article>`;
}

function wagerPanel(s, env, { title, sub, opts, fin }) {
  const I = env.I;
  const names = fin
    ? [
        ["Keep my points", "Guardar mis puntos"],
        ["Some", "Algunos"],
        ["All in", "Todos"],
      ]
    : [
        ["Careful", "Con cuidado"],
        ["Steady", "Firme"],
        ["Bold", "Atrevido"],
      ];
  const lab = (i) => names[opts.length === 3 ? i : i === 0 ? 0 : 2];
  return html`<section class="wj-wager" aria-labelledby="wj-wh">
    ${spotlight(s.band)}
    <div class="wj-host">
      <div class="wj-guide">${mascot(host(s), s.band, "hi", 76)}</div>
      <div class="wj-bubble">
        <h2 id="wj-wh" tabindex="-1" ${raw("data-wj-focus")}>${title}</h2>
        <p>${sub}</p>
      </div>
    </div>
    <p class="cg-instruction">
      ${I.T("How sure are you? Choose your confidence points.", "¿Qué tan seguro estás? Elige tus puntos de confianza.")}
    </p>
    <div
      class="wj-wagers"
      role="group"
      aria-label="${I.S("Confidence points", "Puntos de confianza")}"
    >
      ${opts.map((v, i) => html`<button type="button" class="wj-wager-b" data-g-wager="${v}"><strong>${v}</strong><span>${I.T(...lab(i))}</span></button>`)}
    </div>
    <p class="fine">
      ${I.T("Right on the first try: earn them all. Right on the second try: earn half. If the answer is revealed, half of them come off (your score never goes below 0).", "Si aciertas al primer intento: los ganas todos. Al segundo intento: ganas la mitad. Si se revela la respuesta, se resta la mitad (tus puntos nunca bajan de 0).")}
    </p>
  </section>`;
}

function finalCard(s, env, h) {
  const I = env.I;
  const f = s.final;
  const w = f.why;
  const card = clueCard(s, env, h, f, {
    cat: html`${icon("flag")}${I.T("Final Clue", "Pista final")} ·
    ${I.T(f.category.en, f.category.es)}`,
    value: f.wager,
    dd: false,
    fin: true,
  });
  if (!settled(f.rs)) return card;
  const done = settled(w.rs);
  const top = Math.max(...(s.teams === 2 ? [0, 1] : [0]).map((t) => s.scores[t]));
  const winners = s.teams === 2 ? [0, 1].filter((t) => s.scores[t] === top) : [0];
  return html`${card}
    <section class="wj-why" aria-labelledby="wj-why-h">
      <h2 id="wj-why-h" class="wj-why-h">${icon("evidence")}${I.T(w.prompt.en, w.prompt.es)}</h2>
      ${frameBox("I know because ___.", env, { label: I.T("Reason frame", "Estructura para la razón") })}
      ${choices(w, env, "why")}
      ${hintHTML(w.rs, [I.T(w.hint.en, w.hint.es)], env, { disabled: done })}
      ${feedbackHTML(w.rs, { I, right: I.T(`Reason bonus ${signed(w.pts ?? 0)}!`, `¡Bono por la razón ${signed(w.pts ?? 0)}!`), retry: I.T("That reason does not prove the answer. Try another one.", "Esa razón no demuestra la respuesta. Prueba otra."), answer: html`${I.T("Best reason:", "Mejor razón:")} <strong>${w.choices[w.answer].en}</strong>`, explain: I.T(w.explain.en, w.explain.es), hint: "" })}
      ${
        done
          ? html`<div class="wj-finale">
              ${mascot(host(s), s.band, "cheer", 92)}${burst()}
              <p class="wj-finale-t">
                ${s.teams === 2 ? (winners.length === 2 ? I.T(`A tie at ${top} points! Great teamwork.`, `¡Empate con ${top} puntos! Gran trabajo en equipo.`) : I.T(`${TEAMS[winners[0]][0]} finishes on top with ${top} points!`, `¡El ${TEAMS[winners[0]][1]} termina arriba con ${top} puntos!`)) : I.T(`Final score: ${top} points!`, `Puntos finales: ${top}.`)}
              </p>
              <div class="gs-actions">
                <button
                  type="button"
                  class="btn btn-primary btn-big"
                  data-g-finish
                  ${raw("data-wj-focus")}
                >
                  ${icon("medal")}${I.T("Finish the game", "Terminar el juego")}
                </button>
              </div>
            </div>`
          : ""
      }
    </section>`;
}

export function boardView(s, env, h) {
  const I = env.I;
  let body;
  if (s.phase === "board")
    body = html`${teamPicker(s, I)}
      <p class="wj-tip">
        ${icon("grid")}${s.teams === 2 ? I.T(`${TEAMS[s.turn][0]}: pick a category and a value.`, `${TEAMS[s.turn][1]}: elige una categoría y un valor.`) : I.T("Pick a category and a value. Bigger values are harder clues.", "Elige una categoría y un valor. Los valores más altos son pistas más difíciles.")}
      </p>
      ${boardGrid(s, env, h)}`;
  else if (s.phase === "wager") {
    const cat = s.cats[Number(s.open.split("-")[0])].name;
    body = wagerPanel(s, env, {
      title: I.T("Daily Double!", "¡Doble Diario!"),
      sub: I.T(
        `You found the hidden tile in ${cat.en}. ${nameS(s, s.turn, I)} chooses before the clue appears.`,
        `Encontraste la casilla escondida en ${cat.es}. ${nameS(s, s.turn, I)} elige antes de ver la pista.`,
      ),
      opts: h.ddOptions(s),
      fin: false,
    });
  } else if (s.phase === "clue") {
    const q = h.tileAt(s, s.open);
    const c = s.cats[Number(s.open.split("-")[0])];
    const dd = s.open === s.dd;
    body = clueCard(s, env, h, q, {
      cat: I.T(c.name.en, c.name.es),
      value: dd ? s.wager : q.value,
      dd,
      fin: false,
    });
  } else if (s.phase === "final-wager")
    body = wagerPanel(s, env, {
      title: I.T("Final Clue", "Pista final"),
      sub: I.T(
        `Category: ${s.final.category.en}. ${s.teams === 2 ? "Both teams play this clue together, and both scores change." : "Decide before you see the clue."}`,
        `Categoría: ${s.final.category.es}. ${s.teams === 2 ? "Los dos equipos juegan esta pista juntos y los dos puntajes cambian." : "Decide antes de ver la pista."}`,
      ),
      opts: h.finalOptions(s),
      fin: true,
    });
  else if (s.phase === "final") body = finalCard(s, env, h);
  else
    body = html`<p role="status">${I.T("The board is complete.", "El tablero está completo.")}</p>`;
  return html`<section
    class="cg-station wj wj-${host(s)} wj-band-${s.band === "6-8" ? "68" : "35"}"
    data-mechanic="quiz-board"
    data-phase-wj="${s.phase}"
  >
    ${scoreboard(s, I)} ${body}
  </section>`;
}
