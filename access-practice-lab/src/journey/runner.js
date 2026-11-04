// Journey step runner: the host that lets a learner finish a six-step mission without going back to a homepage.
// renderStep() builds the page for /journey/<mNN>/<step>; mountStep() mounts the current engine UI;
// handleClick() runs the runner's own controls (support level, On my own, word help, repeat).
// All collaborators arrive through `deps` (see runner-deps.js), so tests can drive this with fakes.
import { i18nFor } from "../i18n.js";
import { html, icon, raw } from "../util.js";
import {
  buildsOnHTML,
  controlsHTML,
  headerHTML,
  helpHTML,
  quickNavHTML,
  railHTML,
} from "./runner-chrome.js";
import { commit, helpWrites, makeEnv } from "./runner-env.js";
import {
  alternatives,
  completePanelHTML,
  factsFor,
  primaryTarget,
  problemPanelHTML,
} from "./runner-panels.js";
import {
  PART_LABEL,
  isHeld,
  isIndependent,
  latestResult,
  pendingPart,
  priorResults,
  runOf,
  settleStep,
  shellOf,
  stepParts,
} from "./runner-steps.js";

const PRACTICE = {
  discover: "Reading",
  understand: "Listening",
  build: "Writing",
  improve: "Writing",
};

let active = null; // the page currently on screen: { ctx, deps, band, missionId, stepId }
let mounted = null; // the engine UI mounted into the page
const records = new Map(); // run id -> what mountStep needs
let seq = 0;

const problem = (I, band, title, text) => ({
  title: I.S("Journey", "Viaje"),
  html: problemPanelHTML(I, band, { title, text }),
});

function recommend(deps, state, band) {
  try {
    return deps.recommend.recommendNext(state, band, {
      ledger: deps.ledger.loadLedger(),
      assigned: deps.state.bandState(state, band).assigned,
    });
  } catch (error) {
    console.error("[journey] recommendNext failed", error);
    return null;
  }
}

/** Apply the writes a visit implies: a teacher link assigns the step, and an unfinished step becomes the cursor. */
function arrive(deps, state, band, missionId, stepId, assigned) {
  const St = deps.state;
  const b = St.bandState(state, band);
  const writes = [];
  if (assigned && !(b.assigned?.mission === missionId && b.assigned?.step === stepId))
    writes.push((s) => St.assign(s, band, { mission: missionId, step: stepId }));
  const unfinished = St.getStep(state, band, missionId, stepId).status !== "done";
  if (unfinished && !(b.cursor?.mission === missionId && b.cursor?.step === stepId))
    writes.push((s) => St.setCursor(s, band, missionId, stepId));
  return writes.length ? commit(deps, ...writes) : state;
}

async function completeBody({
  ctx,
  deps,
  I,
  band,
  state,
  S,
  parts,
  missionId,
  stepId,
  pack,
  justSettled,
  prior,
  statuses,
  stepIdx,
}) {
  const C = deps.curriculum;
  const step = C.STEPS[stepIdx];
  const mission = C.MISSIONS[missionId];
  const result = latestResult(S, parts, runOf(S));
  const rec = recommend(deps, state, band);
  const kind = parts.at(-1)?.key;
  const primary = primaryTarget({ I, band, rec, curriculum: C, steps: C.STEPS, missionId });
  const practiceDomain = PRACTICE[stepId] || (kind === "converse" ? "Speaking" : "Writing");
  let showSummary = null;
  if (stepId === "show") {
    const [mirror, growth] = await Promise.all([deps.loadUI("mirror"), deps.loadUI("growth")]);
    const record = growth.recordFor(band, missionId, deps.state.bandState(state, band).missions[missionId]);
    showSummary = mirror.showSummaryHTML?.(I, record) || null;
  }
  // Optional related practice (and the unit checkpoint card); a failure here never blocks the panel.
  const related = await import("./ui/related.js")
    .then((m) => m.relatedPanelHTML({ I, band, missionId, stepId, rec }))
    .catch(() => "");
  const panel = completePanelHTML({
    I,
    band,
    missionId,
    mission,
    step,
    status: statuses[stepIdx],
    facts: factsFor(I, stepId, result, kind),
    rec,
    primary,
    alts: alternatives({ I, band, rec, primaryHref: primary.href, practiceDomain }),
    missionStatus: deps.state.missionStatus(state, band, missionId),
    related,
    showSummary:
      showSummary == null ? null : typeof showSummary === "string" ? raw(showSummary) : showSummary,
  });
  return { body: panel, record: { focusPanel: justSettled } };
}

async function runBody({ ctx, deps, I, band, state, S, parts, pending, held, missionId, stepId, pack }) {
  const independent = isIndependent(stepId, S);
  const support = deps.state.bandState(state, band).support;
  const env = makeEnv({
    ctx,
    deps,
    I,
    band,
    support,
    missionId,
    stepId,
    part: pending,
    run: runOf(S),
    S,
    pack,
    prior: priorResults(deps, state, band, missionId, stepId, pack),
    independent,
  });
  const ui = await deps.loadUI(pending.ui);
  const out = ui.render(pending.task, env);
  const label = parts.length > 1 ? PART_LABEL[pending.key] : null;
  const n = parts.indexOf(pending) + 1;
  const body = html`<section class="jr-stage" data-jr-panel="run">
    ${label ? html`<p class="jr-part eyebrow">${I.T(`Part ${n} of ${parts.length}: ${label[0]}`, `Parte ${n} de ${parts.length}: ${label[1]}`)}</p>` : ""}
    <div class="jr-engine" data-journey-engine data-engine="${pending.key}">
      ${typeof out === "string" ? raw(out) : out}
    </div>
    ${held ? holdHTML(I) : ""}
  </section>`;
  return { body, record: { ui, env } };
}

/** Under an engine that has accepted the last answer: read the feedback, then finish when ready. */
const holdHTML = (I) => html`<div class="jr-hold">
  <p class="fine">${I.T("Read the feedback above. When you are ready, finish this step.", "Lee los comentarios de arriba. Cuando estés listo, termina este paso.")}</p>
  <button type="button" class="btn btn-primary btn-big" data-jr-continue>
    ${I.T("Finish this step", "Terminar este paso")} ${icon("arrow-right")}
  </button>
</div>`;

/**
 * The route view body for /journey/<mission>/<step>.
 * params: { mission, step, assigned }. Returns { title, html }.
 */
export async function renderStep(ctx, deps, params) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const C = deps.curriculum;
  const St = deps.state;
  const { mission: missionId, step: stepId } = params;
  const mission = C.MISSIONS[missionId];
  const stepIdx = C.STEPS.findIndex((s) => s.id === stepId);
  if (!mission || stepIdx < 0)
    return problem(
      I,
      band,
      I.T("We could not find that step.", "No encontramos ese paso."),
      I.T(
        "Open your journey map to pick a mission and a step.",
        "Abre tu mapa del viaje para elegir una misión y un paso.",
      ),
    );
  let pack = null;
  try {
    pack = (await C.loadMission(missionId))?.bands?.[band] || null;
  } catch (error) {
    console.error("[journey] mission pack failed", error);
  }
  const parts = stepParts(stepId, pack);
  if (!parts.length)
    return problem(
      I,
      band,
      I.T("This mission is not ready yet.", "Esta misión aún no está lista."),
      I.T(
        "Try another mission from your journey map.",
        "Prueba otra misión desde tu mapa del viaje.",
      ),
    );

  let state = arrive(deps, St.loadJourney(), band, missionId, stepId, params.assigned);
  let S = St.getStep(state, band, missionId, stepId);
  const run = runOf(S);
  const finished = S.status === "done" && shellOf(S).repeating !== true;
  let pending = finished ? null : pendingPart(S, parts, run);
  const held = !finished && !pending && isHeld(S, parts, run);
  if (held) pending = parts.at(-1);
  let justSettled = false;
  if (!finished && !pending) {
    state = settleStep({ deps, band, missionId, stepId, S, parts });
    S = St.getStep(state, band, missionId, stepId);
    justSettled = true;
    deps.announce(I.S("Step complete.", "Paso completado."));
  }
  const showComplete = finished || justSettled;
  const statuses = C.STEPS.map((s) => St.stepStatus(state, band, missionId, s.id));
  const shell = shellOf(S);
  const own = isIndependent(stepId, S);
  const view = {
    ctx,
    deps,
    I,
    band,
    state,
    S,
    parts,
    pending,
    missionId,
    stepId,
    pack,
    justSettled,
    statuses,
    stepIdx,
  };
  let built;
  try {
    built = showComplete ? await completeBody(view) : await runBody({ ...view, held });
  } catch (error) {
    console.error("[journey] step failed to load", error);
    return problem(
      I,
      band,
      I.T("We could not load this activity.", "No pudimos cargar esta actividad."),
      I.T(
        "Your work is saved. Check your connection and try again, or go back to your map.",
        "Tu trabajo está guardado. Revisa tu conexión e inténtalo de nuevo, o vuelve a tu mapa.",
      ),
    );
  }
  const id = String(++seq);
  records.set(id, built.record);
  active = { ctx, deps, band, missionId, stepId };
  const step = C.STEPS[stepIdx];
  const chrome = { I, band, missionId, steps: C.STEPS, statuses, currentIdx: stepIdx };
  const out = html`<div
    class="jr"
    data-jr-run="${id}"
    data-jr-mission="${missionId}"
    data-jr-step="${stepId}"
    data-jr-mode="${showComplete ? "complete" : "run"}"
  >
    ${quickNavHTML({ I, band })}
    ${headerHTML({ I, band, missionId, mission, step, unit: C.unitOf(missionId), number: C.missionNumber(missionId) })}
    ${railHTML(chrome)} ${buildsOnHTML(chrome)}
    ${showComplete ? "" : controlsHTML({ I, support: St.bandState(state, band).support, own, stepId, helpOpen: shell.helpOpen === true })}
    ${!showComplete && shell.helpOpen ? helpHTML({ I, pack, independent: own }) : ""} ${built.body}
  </div>`;
  return { title: `${I.S(...mission.title)} · ${I.S(...step.label)}`, html: out };
}

function unmountEngine() {
  try {
    mounted?.ui.unmount?.(mounted.host, mounted.env);
  } catch (error) {
    console.error("[journey] engine unmount failed", error);
  }
  mounted = null;
}

/** Mount the engine UI for the page renderStep just produced. */
export function mountStep(root) {
  unmountEngine();
  const page = root.querySelector("[data-jr-run]");
  const record = page && records.get(page.dataset.jrRun);
  records.clear();
  if (!record) return;
  const host = page.querySelector("[data-journey-engine]");
  if (record.ui && host) {
    record.ui.mount?.(host, record.env);
    mounted = { ui: record.ui, host, env: record.env };
  }
  // main.js focuses the page heading after a redraw; a just-finished step moves focus to its panel instead.
  if (record.focusPanel)
    setTimeout(() => {
      const heading = page.querySelector("#jrDoneTitle");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({ block: "start" });
    }, 0);
}

export function unmountStep() {
  unmountEngine();
  records.clear();
}

/** The runner's own controls. Returns true when the click was handled. */
export function handleClick(e) {
  if (!active) return false;
  const { ctx, deps, band, missionId, stepId } = active;
  const St = deps.state;
  const target = e.target;
  const I = i18nFor(ctx);
  const stepData = () => St.getStep(St.loadJourney(), band, missionId, stepId);
  const shell = (patch) => (s) => St.updateStepData(s, band, missionId, stepId, "shell", patch);

  const support = target.closest("[data-jr-support]");
  if (support) {
    const level = support.dataset.jrSupport;
    commit(deps, (s) => St.setSupport(s, band, level));
    deps.announce(
      I.S(
        "Help level changed. Your work is kept.",
        "Cambió el nivel de ayuda. Tu trabajo se conserva.",
      ),
    );
    ctx.rerender();
    return true;
  }
  if (target.closest("[data-jr-own]")) {
    if (shellOf(stepData()).own) {
      deps.announce(
        I.S("On my own stays on for this step.", "Por mi cuenta sigue activado en este paso."),
      );
      return true;
    }
    commit(deps, shell({ own: true }));
    deps.announce(
      I.S(
        "On my own is on. No supports are shown.",
        "Por mi cuenta está activado. No se muestran apoyos.",
      ),
    );
    ctx.rerender();
    return true;
  }
  if (target.closest("[data-jr-help-toggle]")) {
    const open = !shellOf(stepData()).helpOpen;
    commit(
      deps,
      shell({ helpOpen: open }),
      ...(open ? helpWrites(deps, band, missionId, stepId, "vocab") : []),
    );
    ctx.rerender();
    return true;
  }
  if (target.closest("[data-jr-continue]")) {
    commit(deps, shell({ ackRun: runOf(stepData()) }));
    ctx.rerender();
    return true;
  }
  if (target.closest("[data-jr-repeat]")) {
    const run = runOf(stepData()) + 1;
    commit(
      deps,
      (s) => St.revisitStep(s, band, missionId, stepId),
      shell({ run, repeating: true, helped: false, helpOpen: false }),
    );
    ctx.rerender();
    return true;
  }
  return false;
}
