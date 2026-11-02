// The shell every game shares: frame (header, support switch, rules), start screen, transfer task and the
// completion screen. One obvious next action on each.
import { BASE, html, icon } from "../util.js";
import { SUP } from "./engine.js";
import { mascot, scene } from "./art.js";
import { ACHIEVEMENTS, GAME, SKILLS } from "./registry.js";
import { summarizeRounds } from "./state.js";

/** Content text is a string (English practice text) or { en, es } (chrome that follows the language mode). */
export const tx = (I, x) => (x && typeof x === "object" && "en" in x ? I.T(x.en, x.es) : x ?? "");
export const txS = (I, x) => (x && typeof x === "object" && "en" in x ? I.S(x.en, x.es) : x ?? "");
const pair = (I, p) => I.T(p[0], p[1]);
const bandName = (I, b) => I.T(`Grades ${b.replace("-", "–")}`, `Grados ${b.replace("-", "–")}`);
export const KLU_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
export const SKILL_ES = { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir", Integrated: "Destrezas combinadas" };

export const chips = (g, I, band) => html`<ul class="gs-chips" aria-label="${I.S("About this game", "Sobre este juego")}">
  <li class="gs-chip is-skill">${icon(g.skill === "Integrated" ? "growth" : g.skill.toLowerCase())}${I.T(g.skill === "Integrated" ? "All four skills" : g.skill, g.skill === "Integrated" ? "Las cuatro destrezas" : SKILL_ES[g.skill])}</li>
  <li class="gs-chip">${I.T("Key Language Use:", "Uso clave del lenguaje:")} ${g.klu.map((k) => I.T(k, KLU_ES[k])).reduce((a, b) => [a, ", ", b])}</li>
  <li class="gs-chip">${bandName(I, band)}</li>
  <li class="gs-chip">${icon("clock")}${I.T(`about ${g.minutes} min`, `unos ${g.minutes} min`)}</li>
</ul>`;

export function supportSwitch(I, current, { name = "support", inline = false } = {}) {
  return html`<div class="gs-support${inline ? " is-inline" : ""}" role="group" aria-label="${I.S("Support mode", "Modo de apoyo")}">
    ${["A", "B", "C"].map((k) => html`<button type="button" class="gs-sup-btn" data-g-${name}="${k}" aria-pressed="${k === current}"><strong>${pair(I, SUP[k].name)}</strong>${inline ? "" : html`<span>${pair(I, SUP[k].blurb)}</span>`}</button>`)}
  </div>`;
}

export function rulesHTML(content, band, I) {
  const rules = content.rules?.[band] || [];
  if (!rules.length) return "";
  return html`<details class="gs-rules"><summary>${icon("help")}${I.T("How to play", "Cómo se juega")}</summary><ol>${rules.map((r) => html`<li>${tx(I, r)}</li>`)}</ol></details>`;
}

/** The frame around a playing game. */
export function frameHTML({ g, I, band, session, content, stage, progress, ctxBuild }) {
  const ob = g.obj[band];
  return html`<div class="gs gs-${g.id} gs-band-${band}" data-game="${g.id}" data-support="${session.support}" data-phase="${session.phase}">
    <header class="gs-top">
      <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}"><ol><li><a href="${BASE}/games?grades=${band}">${I.T("Language Game Studio", "Estudio de juegos de lenguaje")}</a></li><li><span aria-current="page">${pair(I, g.title)}</span></li></ol></nav>
      <div class="gs-top-right">
        <span class="gs-progress-t" aria-hidden="true">${progress.done}/${progress.total}</span>
        ${supportSwitch(I, session.support, { inline: true })}
      </div>
    </header>
    <section class="gs-brief" aria-label="${I.S("Language goal", "Meta de lenguaje")}">
      <p class="gs-goal"><strong>${I.T("Language goal:", "Meta de lenguaje:")}</strong> ${pair(I, ob)}</p>
      ${rulesHTML(content, band, I)}
    </section>
    <section class="gs-stage" aria-label="${pair(I, g.title)}">${stage}</section>
    <p class="gs-note fine">${I.T("Support modes are a classroom choice, not a WIDA level. Game results show practice, not an ACCESS score.", "Los modos de apoyo son una opción del aula, no un nivel de WIDA. Los resultados del juego muestran práctica, no una puntuación ACCESS.")}</p>
  </div>`;
}

export function startHTML({ g, I, band, content, session, saved, len }) {
  const resumeable = saved && ["play", "transfer"].includes(saved.phase);
  return html`<div class="gs gs-${g.id} gs-band-${band} gs-start-wrap" data-game="${g.id}" data-phase="start">
    <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}"><ol><li><a href="${BASE}/games?grades=${band}">${I.T("Language Game Studio", "Estudio de juegos de lenguaje")}</a></li><li><span aria-current="page">${pair(I, g.title)}</span></li></ol></nav>
    <section class="gs-start">
      <div class="gs-start-art">${scene(g.art, band)}<div class="gs-start-guide">${mascot(band === "3-5" ? "pip" : "juno", band, "hi", 96)}</div></div>
      <div class="gs-start-copy">
        <h1 tabindex="-1">${pair(I, g.title)}</h1>
        <p class="lead">${pair(I, g.tag)}</p>
        ${chips(g, I, band)}
        <p class="gs-goal"><strong>${I.T("Language goal:", "Meta de lenguaje:")}</strong> ${pair(I, g.obj[band])}</p>
        ${rulesHTML({ rules: content.rules }, band, I)}
        <fieldset class="gs-choose"><legend>${I.T("Choose your support mode", "Elige tu modo de apoyo")}</legend>${supportSwitch(I, session.support, { name: "pick" })}</fieldset>
        <fieldset class="gs-choose gs-len"><legend>${I.T("How long?", "¿Cuánto tiempo?")}</legend>
          <div class="gs-len-row" role="group">
            <button type="button" class="gs-len-btn" data-g-len="quick" aria-pressed="${len === "quick"}"><strong>${I.T("Quick", "Rápido")}</strong><span>${I.T("about 5 minutes", "unos 5 minutos")}</span></button>
            <button type="button" class="gs-len-btn" data-g-len="full" aria-pressed="${len === "full"}"><strong>${I.T("Full", "Completo")}</strong><span>${I.T(`about ${g.minutes} minutes`, `unos ${g.minutes} minutos`)}</span></button>
          </div>
        </fieldset>
        <div class="gs-actions gs-actions-start">
          <button type="button" class="btn btn-primary btn-big" data-g-start>${icon("play")}${I.T("Start the game", "Empezar el juego")}</button>
          ${resumeable ? html`<button type="button" class="btn btn-big" data-g-resume>${icon("replay")}${I.T("Continue where I left off", "Continuar donde lo dejé")}</button>` : ""}
        </div>
        <p class="fine">${I.T("There is no timer. Your progress saves on this device.", "No hay temporizador. Tu progreso se guarda en este dispositivo.")}</p>
      </div>
    </section>
  </div>`;
}

export function transferHTML({ g, I, band, session, spec }) {
  const t = session.transfer;
  const words = t.text.trim().split(/\s+/).filter(Boolean).length;
  const independent = session.support === "C";
  return html`<div class="gs gs-${g.id} gs-band-${band}" data-game="${g.id}" data-phase="transfer">
    <section class="gs-transfer panel">
      <p class="gm-kicker">${icon(spec.mode === "speak" ? "speaking" : "writing")}${I.T("Now use it on your own", "Ahora úsalo por tu cuenta")}</p>
      <h1 tabindex="-1">${spec.mode === "speak" ? I.T("Say it without the game", "Dilo sin el juego") : I.T("Write it without the game", "Escríbelo sin el juego")}</h1>
      <p class="lead">${tx(I, spec.prompt)}</p>
      ${!independent && spec.frame ? html`<p class="gs-frame"><span class="gs-frame-l">${I.T("Sentence frame", "Estructura de oración")}</span> ${spec.frame}</p>` : ""}
      <label class="gs-label" for="gs-transfer-text">${spec.mode === "speak" ? I.T("Notes for what I will say (optional)", "Notas de lo que voy a decir (opcional)") : I.T("My writing", "Mi escritura")}</label>
      <textarea id="gs-transfer-text" class="gs-textarea" rows="5" data-g-transfer-text spellcheck="true" placeholder="${I.S("Type here…", "Escribe aquí…")}">${t.text}</textarea>
      <p class="fine" aria-live="polite">${I.T(`${words} words`, `${words} palabras`)}</p>
      ${spec.mode === "speak" ? html`<p><a class="btn" href="${BASE}/speak?grades=${band}">${icon("speaking")}${I.T("Record in the Speaking Studio", "Grabar en el Estudio de expresión oral")}</a></p>` : ""}
      <fieldset class="gs-checks"><legend>${I.T("Check your own work", "Revisa tu propio trabajo")}</legend>
        ${spec.checks.map((c, i) => html`<label class="gs-check"><input type="checkbox" data-g-check="${i}" ${t.checks.includes(i) ? "checked" : ""} /> <span>${c}</span></label>`)}
      </fieldset>
      <p class="fine">${I.T("This is your own practice. The game does not grade it. A teacher or family member can read it with you.", "Esta es tu propia práctica. El juego no la califica. Un docente o un familiar puede leerla contigo.")}</p>
      <div class="gs-actions">
        <button type="button" class="btn btn-primary btn-big" data-g-transfer-save ${words < (spec.minWords || 1) && spec.mode === "write" ? "disabled" : ""}>${icon("check")}${I.T("Save and finish", "Guardar y terminar")}</button>
        <button type="button" class="btn" data-g-transfer-skip>${I.T("Do this later", "Hacerlo después")}</button>
      </div>
    </section>
  </div>`;
}

export function doneHTML({ g, I, band, session, awards, next, suggestion, pathNext, recommended }) {
  const s = summarizeRounds(session.rounds);
  const row = (a, b) => html`<div class="gs-stat"><dt>${a}</dt><dd>${b}</dd></div>`;
  const nextBtn = pathNext
    ? html`<a class="btn btn-primary btn-big" href="${BASE}/games/${pathNext}?grades=${band}${next.pathQuery}">${icon("arrow-right")}${I.T("Next game in this path: ", "Siguiente juego del recorrido: ")}${pair(I, GAME[pathNext].title)}</a>`
    : suggestion?.kind === "up"
      ? html`<button type="button" class="btn btn-primary btn-big" data-g-again="${suggestion.to}">${icon("sparkle")}${I.T("Play again in ", "Jugar otra vez en modo ")}${pair(I, SUP[suggestion.to].name)}</button>`
      : recommended
        ? html`<a class="btn btn-primary btn-big" href="${BASE}/games/${recommended}?grades=${band}">${icon("arrow-right")}${I.T("Try next: ", "Prueba después: ")}${pair(I, GAME[recommended].title)}</a>`
        : html`<button type="button" class="btn btn-primary btn-big" data-g-again="${session.support}">${icon("replay")}${I.T("Play again", "Jugar otra vez")}</button>`;
  return html`<div class="gs gs-${g.id} gs-band-${band}" data-game="${g.id}" data-phase="done">
    <section class="gs-done">
      <div class="gs-done-art">${scene(g.art, band)}<div class="gs-start-guide">${mascot(band === "3-5" ? "pip" : "juno", band, "cheer", 104)}</div></div>
      <div class="gs-done-copy">
        <p class="gm-kicker">${icon("medal")}${I.T("Game finished", "Juego terminado")}</p>
        <h1 tabindex="-1">${I.T("You finished ", "Terminaste ")}${pair(I, g.title)}</h1>
        <dl class="gs-stats">
          ${row(I.T("Rounds finished", "Rondas terminadas"), s.total)}
          ${row(I.T("Right on the first try", "Bien al primer intento"), `${s.firstTry} / ${s.total}`)}
          ${row(I.T("Hints opened", "Pistas abiertas"), s.hints)}
          ${row(I.T("Fixed after feedback", "Corregidas después de los comentarios"), s.revised)}
          ${row(I.T("Support mode", "Modo de apoyo"), pair(I, SUP[session.support].name))}
        </dl>
        <p class="gs-goal"><strong>${I.T("You practiced:", "Practicaste:")}</strong> ${pair(I, g.obj[band])}</p>
        ${awards.length ? html`<div class="gs-awards"><h2>${I.T("New achievements", "Nuevos logros")}</h2><ul>${awards.map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return html`<li>${icon(a.icon)}<span><strong>${pair(I, a.name)}</strong> ${pair(I, a.means)}</span></li>`; })}</ul></div>` : ""}
        ${session.transfer.saved ? html`<p class="fine">${icon("check")}${I.T("Your own writing was saved with this game.", "Tu escritura se guardó con este juego.")}</p>` : session.phase === "done" ? html`<p class="fine">${I.T("You can do the on-your-own task later from the Passport.", "Puedes hacer la tarea por tu cuenta después desde el Pasaporte.")}</p>` : ""}
        ${suggestion?.kind === "up" ? html`<p class="gs-suggest">${I.T("You did this with little help. When you are ready for more independence, try ", "Lo hiciste con poca ayuda. Cuando quieras más independencia, prueba el modo ")}<strong>${pair(I, SUP[suggestion.to].name)}</strong>.</p>` : suggestion?.kind === "down" ? html`<p class="gs-suggest">${I.T("This was a stretch. More support is fine: try ", "Este fue un reto. Más apoyo está bien: prueba el modo ")}<strong>${pair(I, SUP[suggestion.to].name)}</strong>.</p>` : ""}
        <div class="gs-actions">${nextBtn}
          <button type="button" class="btn" data-g-again="${session.support}">${icon("replay")}${I.T("Replay with new rounds", "Repetir con rondas nuevas")}</button>
          <a class="btn" href="${BASE}/games?grades=${band}">${I.T("All games", "Todos los juegos")}</a>
          <a class="btn" href="${BASE}/passport?grades=${band}">${icon("passport")}${I.T("My Passport", "Mi Pasaporte")}</a>
        </div>
        <p class="fine">${I.T("Game results show what you practiced and how much help you used. They are not a WIDA level or an ACCESS score.", "Los resultados del juego muestran lo que practicaste y cuánta ayuda usaste. No son un nivel de WIDA ni una puntuación ACCESS.")}</p>
      </div>
    </section>
  </div>`;
}
