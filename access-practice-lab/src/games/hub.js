// Language Game Studio hub: browse by skill, filter, recommendations, quick missions, pathways,
// teacher sequences, family picks, history and achievements.
import { BASE, html, icon, raw } from "../util.js";
import { scene, mascot } from "./art.js";
import { filterGames, inProgress, lastPlay, newAwards, parsePath, pathwayProgress, playsOf, recommend } from "./plan.js";
import { ACHIEVEMENTS, GAME, GAMES, KLUS, PATHWAYS, SKILLS } from "./registry.js";
import { KLU_ES, SKILL_ES, chips } from "./screens.js";
import { SUP } from "./engine.js";
import { summarizeRounds } from "./state.js";

const pair = (I, p) => I.T(p[0], p[1]);
const bandQ = (b) => `grades=${b}`;

export function hubHref(band, q, patch = {}) {
  const next = { ...q, ...patch };
  const params = new URLSearchParams({ grades: band });
  for (const k of ["skill", "klu", "diff", "min", "home", "assign", "t", "mode"]) if (next[k] && next[k] !== "all") params.set(k, next[k]);
  return `${BASE}/games?${params}`;
}
const playHref = (id, band, q, extra = "") => {
  const p = new URLSearchParams({ grades: band });
  if (q.mode && SUP[q.mode]) p.set("mode", q.mode);
  if (q.assign) p.set("path", q.assign);
  return `${BASE}/games/${id}?${p}${extra}`;
};

function statusOf(games, id, band) {
  const plays = playsOf(games, id, band);
  const live = Object.values(games.sessions).find((s) => s.game === id && s.band === band && ["play", "transfer"].includes(s.phase));
  return { plays: plays.length, live, last: lastPlay(games, id, band) };
}

const dots = (n, I) => html`<span class="gs-diff" role="img" aria-label="${I.S(["", "Gentle", "Steady", "Challenging"][n], ["", "Suave", "Constante", "Desafiante"][n])}">${[1, 2, 3].map((i) => html`<i class="${i <= n ? "on" : ""}"></i>`)}</span>`;

function card(g, I, band, games, q, { why } = {}) {
  const st = statusOf(games, g.id, band);
  const label = st.live ? I.T("Continue", "Continuar") : st.plays ? I.T("Play again", "Jugar otra vez") : I.T("Play", "Jugar");
  return html`<article class="gs-card" data-game-card="${g.id}">
    <a class="gs-card-art" href="${playHref(g.id, band, q)}" tabindex="-1" aria-hidden="true">${scene(g.art, band)}${g.flagship ? html`<span class="gs-badge">${I.T("Featured", "Destacado")}</span>` : ""}</a>
    <div class="gs-card-body">
      <h3><a href="${playHref(g.id, band, q)}">${pair(I, g.title)}</a></h3>
      <p class="gs-card-tag">${pair(I, g.tag)}</p>
      <p class="gs-card-goal"><strong>${I.T("Goal:", "Meta:")}</strong> ${pair(I, g.obj[band])}</p>
      ${chips(g, I, band)}
      <p class="gs-card-meta">${dots(g.difficulty, I)}<span>${st.live ? I.T("In progress", "En curso") : st.plays ? I.T(`Played ${st.plays} ${st.plays === 1 ? "time" : "times"}`, `Jugado ${st.plays} ${st.plays === 1 ? "vez" : "veces"}`) : I.T("New", "Nuevo")}</span></p>
      ${why ? html`<p class="gs-why">${icon("sparkle")}${pair(I, why)}</p>` : ""}
      <a class="btn btn-primary" href="${playHref(g.id, band, q)}">${icon(st.live ? "replay" : "play")}${label}<span class="visually-hidden"> ${pair(I, g.title)}</span></a>
    </div>
  </article>`;
}

function filterBar(I, band, q) {
  const group = (key, label, options) => html`<div class="gs-filter" role="group" aria-label="${label}"><span class="gs-filter-l">${label}</span>${options.map(([value, text]) => html`<a class="gs-fchip" href="${hubHref(band, q, { [key]: value })}" aria-current="${(q[key] || "all") === value ? "true" : "false"}">${text}</a>`)}</div>`;
  return html`<section class="gs-filters panel" aria-label="${I.S("Find a game", "Buscar un juego")}">
    ${group("skill", I.S("Skill", "Destreza"), [["all", I.T("All", "Todas")], ...SKILLS.map((s) => [s, I.T(s === "Integrated" ? "Integrated" : s, SKILL_ES[s])])])}
    ${group("klu", I.S("Key Language Use", "Uso clave del lenguaje"), [["all", I.T("All", "Todos")], ...KLUS.map((k) => [k, I.T(k, KLU_ES[k])])])}
    ${group("diff", I.S("Difficulty", "Dificultad"), [["all", I.T("Any", "Cualquiera")], ["1", I.T("Gentle", "Suave")], ["2", I.T("Steady", "Constante")], ["3", I.T("Challenging", "Desafiante")]])}
    ${group("min", I.S("Time", "Tiempo"), [["all", I.T("Any", "Cualquiera")], ["8", I.T("Up to 8 min", "Hasta 8 min")], ["10", I.T("Up to 10 min", "Hasta 10 min")]])}
    <div class="gs-filter" role="group" aria-label="${I.S("Support mode", "Modo de apoyo")}"><span class="gs-filter-l">${I.T("Support mode", "Modo de apoyo")}</span>${["A", "B", "C"].map((k) => html`<a class="gs-fchip" href="${hubHref(band, q, { mode: q.mode === k ? "" : k })}" aria-current="${q.mode === k}">${pair(I, SUP[k].name)}</a>`)}</div>
  </section>`;
}

function teacherBox(I, band, q) {
  return html`<details class="gs-teacher panel"><summary>${icon("teacher")}${I.T("For teachers: assign a game sequence", "Para docentes: asignar una secuencia de juegos")}</summary>
    <form class="gs-assign" data-g-assign-form>
      <p class="fine">${I.T("Pick games in the order students should play them. The link carries game ids and a support mode, never student information.", "Elige los juegos en el orden en que los estudiantes deben jugarlos. El enlace lleva los ids de los juegos y un modo de apoyo, nunca información de estudiantes.")}</p>
      <label class="gs-label">${I.T("Sequence title", "Título de la secuencia")}<input class="gs-input" name="title" maxlength="60" value="${q.t || ""}" /></label>
      <fieldset class="gs-checks"><legend>${I.T("Games, in order", "Juegos, en orden")}</legend>
        <ul class="gs-assign-list">${GAMES.map((g) => html`<li><label class="gs-check"><input type="checkbox" name="ids" value="${g.id}" ${parsePath(q.assign).includes(g.id) ? "checked" : ""}/> <span>${pair(I, g.title)} <small>${g.skill}</small></span></label></li>`)}</ul></fieldset>
      <label class="gs-label">${I.T("Support mode", "Modo de apoyo")}<select class="gs-input" name="mode">${["A", "B", "C"].map((k) => html`<option value="${k}" ${q.mode === k ? "selected" : ""}>${pair(I, SUP[k].name)}</option>`)}</select></label>
      <button type="button" class="btn btn-primary" data-g-assign-build>${icon("copy")}${I.T("Make the link", "Crear el enlace")}</button>
      <output class="gs-assign-out" aria-live="polite"></output>
    </form></details>`;
}

function assignedBanner(I, band, q, games) {
  const ids = parsePath(q.assign).filter((id) => GAME[id]?.obj[band]);
  if (!ids.length) return "";
  const prog = pathwayProgress(games, ids, band);
  return html`<section class="gs-assigned panel" aria-label="${I.S("Assigned sequence", "Secuencia asignada")}">
    <p class="gm-kicker">${icon("road")}${I.T("Assigned sequence", "Secuencia asignada")}</p>
    <h2>${q.t || I.T("Your teacher's game sequence", "La secuencia de juegos de tu docente")}</h2>
    <ol class="gs-seq">${ids.map((id) => html`<li class="${prog.done.includes(id) ? "is-done" : id === prog.next ? "is-next" : ""}">${prog.done.includes(id) ? icon("check") : ""}${pair(I, GAME[id].title)}</li>`)}</ol>
    ${prog.next ? html`<a class="btn btn-primary btn-big" href="${playHref(prog.next, band, q)}">${icon("play")}${I.T("Play next: ", "Jugar el siguiente: ")}${pair(I, GAME[prog.next].title)}</a>` : html`<p><strong>${icon("check")}${I.T("Sequence finished. Nice work.", "Secuencia terminada. Buen trabajo.")}</strong></p>`}
  </section>`;
}

function historyPanel(I, band, games) {
  const mine = games.history.filter((h) => h.band === band).slice(-6).reverse();
  const awards = ACHIEVEMENTS.filter((a) => games.awards.includes(a.id));
  return html`<section class="gs-history panel" aria-labelledby="gs-hist-h">
    <h2 id="gs-hist-h">${I.T("My game history", "Mi historial de juegos")}</h2>
    ${mine.length ? html`<ul class="gs-hist">${mine.map((h) => html`<li><strong>${pair(I, GAME[h.game].title)}</strong> <span>${new Date(h.at).toLocaleDateString()}</span> <span>${I.T(`${h.firstTry}/${h.rounds} first try · ${h.hints} hints · ${pair(I, SUP[h.support].name)}`, `${h.firstTry}/${h.rounds} al primer intento · ${h.hints} pistas · ${pair(I, SUP[h.support].name)}`)}</span></li>`)}</ul>` : html`<p class="fine">${I.T("No games finished yet. Your history will appear here.", "Aún no has terminado juegos. Tu historial aparecerá aquí.")}</p>`}
    <h3>${I.T("Achievements", "Logros")}</h3>
    <ul class="gs-ach">${ACHIEVEMENTS.map((a) => html`<li class="${games.awards.includes(a.id) ? "is-on" : ""}">${icon(a.icon)}<span><strong>${pair(I, a.name)}</strong><small>${pair(I, a.means)}</small></span></li>`)}</ul>
  </section>`;
}

export function hubHTML(ctx, I, games, q, band, { focus = [] } = {}) {
  const list = filterGames(q, band);
  const recs = recommend(games, band, { n: 3, focus });
  const live = inProgress(games, band);
  const filtered = Boolean(q.skill || q.klu || q.diff || q.min || q.home);
  const quick = recs[0];
  return html`<div class="gs-hub gs-band-${band}">
    <header class="gs-hero">
      <div class="gs-hero-copy">
        <p class="gm-kicker">${icon("sparkle")}${I.T("Language Game Studio", "Estudio de juegos de lenguaje")}</p>
        <h1 tabindex="-1">${I.T("Play with language. Practice what matters.", "Juega con el lenguaje. Practica lo que importa.")}</h1>
        <p class="lead">${I.T("Fifteen games for listening, reading, speaking and writing. Pick a support mode, play at your pace, then use the words on your own. There is no timer.", "Quince juegos para escuchar, leer, hablar y escribir. Elige un modo de apoyo, juega a tu ritmo y luego usa las palabras por tu cuenta. No hay temporizador.")}</p>
        <div class="gs-hero-actions">
          ${quick ? html`<a class="btn btn-primary btn-big" href="${playHref(quick.game, band, q, "&len=quick")}">${icon("play")}${I.T("5-minute mission: ", "Misión de 5 minutos: ")}${pair(I, GAME[quick.game].title)}</a>` : ""}
          <a class="btn btn-big" href="#gs-all">${I.T("Browse all games", "Ver todos los juegos")}</a>
        </div>
      </div>
      <div class="gs-hero-art" aria-hidden="true">${scene("quest", band)}<div class="gs-hero-guide">${mascot("pip", band, "hi", 108)}${mascot("juno", band, "cheer", 96)}</div></div>
    </header>
    ${assignedBanner(I, band, q, games)}
    ${live.length ? html`<section class="gs-resume panel" aria-labelledby="gs-resume-h"><h2 id="gs-resume-h">${I.T("Pick up where you left off", "Continúa donde lo dejaste")}</h2><ul>${live.slice(0, 3).map((s) => html`<li><a class="btn" href="${playHref(s.game, band, q)}">${icon("replay")}${pair(I, GAME[s.game].title)}</a></li>`)}</ul></section>` : ""}
    <section class="gs-next" aria-labelledby="gs-next-h"><h2 id="gs-next-h">${I.T("Recommended for you", "Recomendado para ti")}</h2>
      <p class="fine">${I.T("Chosen from the games you have played. It is a suggestion, not a test result.", "Elegido a partir de los juegos que has jugado. Es una sugerencia, no un resultado de prueba.")}</p>
      <div class="gs-grid gs-grid-3">${recs.map((r) => card(GAME[r.game], I, band, games, q, { why: r.why }))}</div></section>
    <section class="gs-paths" aria-labelledby="gs-paths-h"><h2 id="gs-paths-h">${I.T("Learning pathways", "Recorridos de aprendizaje")}</h2>
      <div class="gs-grid gs-grid-2">${PATHWAYS.map((p) => { const ids = p.ids.filter((id) => GAME[id].obj[band]); const prog = pathwayProgress(games, ids, band); return html`<article class="gs-path panel"><h3>${pair(I, p.title)}</h3><p>${pair(I, p.blurb)}</p><ol class="gs-seq">${ids.map((id) => html`<li class="${prog.done.includes(id) ? "is-done" : id === prog.next ? "is-next" : ""}">${prog.done.includes(id) ? icon("check") : ""}${pair(I, GAME[id].title)}</li>`)}</ol>
        <a class="btn ${prog.complete ? "" : "btn-primary"}" href="${BASE}/games/${prog.next || ids[0]}?${new URLSearchParams({ grades: band, path: ids.join(","), ...(q.mode ? { mode: q.mode } : {}) })}">${icon("road")}${prog.complete ? I.T("Play the path again", "Repetir el recorrido") : prog.done.length ? I.T("Continue the path", "Continuar el recorrido") : I.T("Start the path", "Empezar el recorrido")}</a></article>`; })}</div></section>
    <section id="gs-all" class="gs-all" aria-labelledby="gs-all-h"><h2 id="gs-all-h">${I.T("All games", "Todos los juegos")}${filtered ? html` <small>(${list.length})</small>` : ""}</h2>
      ${filterBar(I, band, q)}
      ${list.length ? html`<div class="gs-grid">${list.map((g) => card(g, I, band, games, q))}</div>` : html`<p class="panel empty-state">${I.T("No games match those filters.", "Ningún juego coincide con esos filtros.")} <a href="${hubHref(band, {}, {})}">${I.T("Clear filters", "Quitar filtros")}</a></p>`}
    </section>
    <section class="gs-family panel" aria-labelledby="gs-fam-h"><h2 id="gs-fam-h">${icon("families")}${I.T("Playing at home", "Jugar en casa")}</h2>
      <p>${I.T("Families do not need to speak English to help. Sit together, press Listen, and let your child explain what they chose in any language. Then ask them to say it again in English.", "Las familias no necesitan hablar inglés para ayudar. Siéntense juntos, presionen Escuchar y dejen que su hijo explique lo que eligió en cualquier idioma. Luego pídanle que lo diga otra vez en inglés.")}</p>
      <p><a class="btn" href="${hubHref(band, q, { home: "1" })}">${I.T("Show games that work well at home", "Mostrar juegos que funcionan bien en casa")}</a> <a class="btn" href="${BASE}/family?${bandQ(band)}">${I.T("Family Corner", "Rincón familiar")}</a></p></section>
    ${historyPanel(I, band, games)}
    ${teacherBox(I, band, q)}
    <p class="gs-note fine">${I.T("Game performance, learning progress and official WIDA ACCESS scores are three different things. These games show what you practiced and how much help you used. They never predict an ACCESS score, and they do not replace speaking, writing, reading and listening practice on your own. This lab is not made or endorsed by WIDA.", "El desempeño en el juego, el progreso de aprendizaje y las puntuaciones oficiales de WIDA ACCESS son cosas distintas. Estos juegos muestran lo que practicaste y cuánta ayuda usaste. Nunca predicen una puntuación ACCESS ni reemplazan la práctica de hablar, escribir, leer y escuchar por tu cuenta. Este laboratorio no es creado ni respaldado por WIDA.")}</p>
  </div>`;
}
