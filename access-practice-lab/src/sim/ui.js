// Living Language Simulation Engine: the player. One reusable screen for any valid mission (the flagship and
// compiled experiences): act progress, an illustrated scene with hotspots, the mission map, and a contextual panel
// (evidence, dialogue, comparison, decision, language task, journal, outcome).
//
// Embedding (the view and the instructor compiler's preview use the same four calls; see SIMULATIONS.md):
//   const session = createSession(def, { state, save, preview, band });
//   playerHTML(ctx, def, session.state, { session })   → markup for render(ctx)
//   onPlayerClick(e, ctx, session) / onPlayerInput(e, ctx, session) / onPlayerChange(e, ctx, session)
//   stopPlayer(session)                                 → on unmount
// Rules kept here: hotspots are real buttons with a visible label on hover and focus, and the same actions are
// listed as text under the picture; nothing moves under reduced motion (sim.css); the player never changes mission
// state itself, it only sends actions to the runtime.
import { i18nFor, makeI18n } from "../i18n.js";
import { html, raw } from "../util.js";
import { glyph, mapSVG, mapSpots, sceneSVG } from "./art.js";
import { savedFeedback } from "./evidence.js";
import { hotspotsOf, knownScenes, newState, sceneOpen } from "./runtime.js";
import {
  OPEN_ACTION,
  characterOf,
  evalCond,
  evidenceOf,
  reachedAct,
  sceneOf,
  taskOf,
} from "./schema.js";
import { completePanel, guidePanel, languagePanel, outcomePanel } from "./ui-language.js";
import {
  T,
  comparePanel,
  decidePanel,
  dialoguePanel,
  evidencePanel,
  journalPanel,
} from "./ui-panels.js";
import { freshUi } from "./ui-state.js";

export { onPlayerChange, onPlayerClick, onPlayerInput, stopPlayer } from "./ui-actions.js";

/**
 * A play session: the mission, its current state, how to save it, and the screen's own memory.
 * @param {object} def a mission that passed validateMission
 * @param {{ state?: object, save?: (state: object) => void, preview?: boolean, band?: string, reportHref?: string }} [options]
 *   `objective` is the pathway objective slug the language work is recorded against (default: the mission's).
 *   `preview: true` writes nothing to the loop store or the ledger and offers no sharing.
 */
export function createSession(
  def,
  { state, save = () => {}, preview = false, band = "6-8", reportHref = "", objective = "" } = {},
) {
  return {
    def,
    state: state || newState(def),
    save,
    preview,
    band,
    reportHref,
    objective,
    ui: freshUi(preview),
  };
}

const bandOf = (band) => (band === "3-5" ? "3-5" : "6-8");

/** What a hotspot does, as a glyph name, and whether it is already done. */
function hotspotKind(def, state, h) {
  if (h.opens.evidence) {
    const e = evidenceOf(def, h.opens.evidence);
    return { glyph: OPEN_ACTION[e.kind], done: Boolean(state.evidence[e.id]) };
  }
  if (h.opens.character)
    return { glyph: "talk", done: Boolean(state.talk[h.opens.character]?.asked.length) };
  if (h.opens.task) {
    const r = state.tasks[h.opens.task];
    return {
      glyph: "task",
      done: taskOf(def, h.opens.task).type === "compare" ? Boolean(r?.resolved) : Boolean(r?.done),
    };
  }
  return { glyph: "go", done: false };
}

function sceneHTML(I, def, state, ui) {
  const scene = sceneOf(def, state.scene);
  const spots = hotspotsOf(def, state);
  const people = spots
    .filter((h) => h.opens.character)
    .map((h) => ({ x: h.x, y: h.y, look: characterOf(def, h.opens.character).look }));
  return html`<section class="sim-scene" aria-labelledby="simSceneH">
    <h2 id="simSceneH" class="sim-scene-title" tabindex="-1">${T(I, scene.title)}</h2>
    <div class="sim-stage ${ui.arriving ? "is-arriving" : ""}">
      ${raw(sceneSVG(scene.art, people))}
      ${spots.map((h) => {
        const k = hotspotKind(def, state, h);
        const label = I.S(h.label[0], h.label[1]);
        return html`<button
          type="button"
          class="sim-hot ${k.done ? "is-done" : ""} ${h.x > 62 ? "is-end" : h.x < 30 ? "is-start" : ""} ${h.y < 24 ? "is-below" : ""}"
          style="left:${h.x}%;top:${h.y}%"
          data-sim-hot="${h.id}"
          aria-label="${label}${k.done ? I.S(" (done)", " (hecho)") : ""}"
        >
          ${raw(glyph(k.done ? "done" : k.glyph))}<span class="sim-hot-tip" aria-hidden="true"
            >${label}</span
          >
        </button>`;
      })}
    </div>
    <p class="sim-desc">${T(I, scene.description)}</p>
    <h3 class="sim-sub" id="simHereH">${I.T("In this place", "En este lugar")}</h3>
    <ul class="sim-hotlist" aria-labelledby="simHereH">
      ${spots.map((h) => {
        const k = hotspotKind(def, state, h);
        return html`<li>
          <button type="button" class="sim-q ${k.done ? "is-asked" : ""}" data-sim-hot="${h.id}">
            ${raw(glyph(k.done ? "done" : k.glyph))} ${T(I, h.label)}
          </button>
        </li>`;
      })}
    </ul>
  </section>`;
}

function mapHTML(I, def, state) {
  const known = knownScenes(def, state);
  const spots = mapSpots(def, known);
  const status = (id) =>
    id === state.scene
      ? ["you are here", "estás aquí"]
      : !sceneOpen(def, state, id)
        ? ["not open yet", "todavía no está abierto"]
        : state.visited.includes(id)
          ? ["visited", "visitado"]
          : ["not visited yet", "sin visitar"];
  return html`<section class="sim-scene" aria-labelledby="simSceneH">
    <h2 id="simSceneH" class="sim-scene-title" tabindex="-1">${I.T("Map", "Mapa")}</h2>
    <div class="sim-stage is-map">
      ${raw(mapSVG(spots))}
      ${spots.map((s) => {
        const scene = sceneOf(def, s.scene);
        const open = sceneOpen(def, state, s.scene);
        const here = s.scene === state.scene;
        return html`<button
          type="button"
          class="sim-place ${here ? "is-here" : ""} ${open ? "" : "is-locked"}"
          style="left:${s.x}%;top:${s.y}%"
          data-sim-go="${s.scene}"
          ${open ? "" : raw('aria-disabled="true"')}
          ${here ? raw('aria-current="location"') : ""}
        >
          ${open ? "" : raw(glyph("lock"))}<span>${T(I, scene.title)}</span>
        </button>`;
      })}
    </div>
    <ul class="sim-hotlist sim-places">
      ${spots.map((s) => html`<li><strong>${T(I, sceneOf(def, s.scene).title)}</strong>: ${T(I, status(s.scene))}</li>`)}
    </ul>
  </section>`;
}

function panelHTML(ctx, I, session) {
  const { def, state, ui } = session;
  const kind = ui.panel?.kind;
  if (kind === "evidence") return evidencePanel(I, def, state, ui);
  if (kind === "character") return dialoguePanel(I, def, state, ui);
  if (kind === "journal") {
    // Word meanings close while the independent task is open and not yet sent.
    const transfer = def.tasks.find((t) => t.type === "transfer");
    ui.wordsClosed = Boolean(
      transfer && !state.tasks[transfer.id]?.done && evalCond(transfer.requires, state, def),
    );
    return journalPanel(I, def, state, ui);
  }
  if (kind === "outcome" && state.outcome) return outcomePanel(I, def, state);
  if (kind === "complete" && state.complete)
    return completePanel(I, def, state, ui, session.reportHref);
  if (kind === "task") {
    const task = taskOf(def, ui.panel.id);
    if (task.type === "compare") return comparePanel(I, def, state, ui);
    if (task.type === "decide") return decidePanel(I, def, state, ui);
    // Feedback written on an earlier visit is read back from the loop store once per session.
    for (const id of [task.id, task.of].filter(Boolean))
      if (!(id in ui.feedback)) ui.feedback[id] = ui.preview ? null : savedFeedback(state, id);
    return languagePanel(I, def, state, ui, bandOf(session.band));
  }
  return guidePanel(I, def, state);
}

/**
 * The whole player for a mission.
 * @param {object} ctx the render ctx (language preference)
 * @param {object} def the mission
 * @param {object} state the runtime state to show
 * @param {{ session: object }} opts the session from createSession (its `ui` is the screen's memory)
 */
export function playerHTML(ctx, def, state, { session }) {
  // A mission may turn Spanish off (`supports.spanish: false`): the player is then shown in English only.
  const I = def.supports?.spanish === false ? makeI18n("en") : i18nFor(ctx);
  const ui = session.ui;
  const reached = reachedAct(def, state);
  const act = def.acts[Math.min(reached, def.acts.length - 1)];
  const found = Object.keys(state.evidence).length;
  return html`<section class="sim-player" data-sim-player="${def.id}">
    <header class="sim-top">
      <p class="eyebrow">
        ${I.T("Simulation", "Simulación")}${session.preview ? html` · ${I.T("Preview: nothing is saved", "Vista previa: no se guarda nada")}` : ""}
      </p>
      <h1 tabindex="-1">${T(I, def.title)}</h1>
      <ol class="sim-acts" aria-label="${I.S("Acts of this mission", "Actos de esta misión")}">
        ${def.acts.map(
          (a, i) =>
            html`<li
              class="${i < reached ? "is-done" : i === reached ? "is-now" : ""}"
              ${i === reached ? raw('aria-current="step"') : ""}
            >
              <span class="sim-act-n" aria-hidden="true"
                >${i < reached ? raw(glyph("done")) : i + 1}</span
              >
              <span
                >${T(I, a.title)}${i < reached ? html`<span class="visually-hidden"> ${I.S("(done)", "(hecho)")}</span>` : ""}</span
              >
            </li>`,
        )}
      </ol>
      <p class="sim-goal">
        <strong
          >${state.complete ? I.T("Mission complete.", "Misión terminada.") : I.T("Now:", "Ahora:")}</strong
        >
        ${state.complete ? "" : T(I, act.goal)}
      </p>
      <div
        class="sim-bar"
        role="group"
        aria-label="${I.S("Mission tools", "Herramientas de la misión")}"
      >
        <button
          type="button"
          class="btn small"
          data-sim-view="${ui.view === "map" ? "scene" : "map"}"
          aria-pressed="${ui.view === "map"}"
        >
          ${raw(glyph("map"))}
          ${ui.view === "map" ? I.T("Back to the scene", "Volver a la escena") : I.T("Map", "Mapa")}
        </button>
        <button
          type="button"
          class="btn small"
          data-sim-journal
          aria-pressed="${ui.panel?.kind === "journal"}"
        >
          ${raw(glyph("journal"))}
          ${I.T(`Journal · ${found} evidence`, `Diario · ${found} evidencias`)}
        </button>
        ${state.outcome ? html`<button type="button" class="btn small" data-sim-outcome>${I.T("The ending", "El final")}</button>` : ""}
      </div>
    </header>
    <div class="sim-main">
      ${ui.view === "map" ? mapHTML(I, def, state) : sceneHTML(I, def, state, ui)}
      <aside class="sim-panel panel" aria-labelledby="simPanelH">
        ${panelHTML(ctx, I, session)}
      </aside>
    </div>
  </section>`;
}
