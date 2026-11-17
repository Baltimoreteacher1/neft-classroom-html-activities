// Simulations (/simulations, /simulations/<mission>, /simulations/<mission>/report, /simulations/x/<id>): the
// Living Language Simulation Engine's screens. The hub lists built-in missions (the flagship, The City That Stopped
// Talking) and experiences compiled on this device; a mission plays in the reusable player (src/sim/ui.js) on the
// pure runtime (src/sim/runtime.js). Progress is saved on this device after every action (key
// accessPracticeLab:v1:sim) and resumes where the learner stopped. Spoken and written work goes through the shared
// feedback loop, so it is also ledger evidence; the evidence report is shared with the class review queue only when
// the learner presses Share. No timers, points or rankings: an outcome is a story consequence, never a grade.
import { downloadMenuHTML, onDownloadClick } from "../download/menu.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { pathwayBannerHTML, pathwayContext } from "../pathways/banner.js";
import { WIDA_SOURCE } from "../acc/wida/catalog.js";
import { sceneSVG } from "../sim/art.js";
import { inClass, missionReport, shareReport } from "../sim/evidence.js";
import {
  FLAGSHIP_ID,
  listMissions,
  localExperience,
  localExperiences,
  missionById,
} from "../sim/missions/index.js";
import { clearSave, loadSaves, progressOf, restore, saveState } from "../sim/runtime.js";
import { validateMission } from "../sim/schema.js";
import {
  createSession,
  onPlayerChange,
  onPlayerClick,
  onPlayerInput,
  playerHTML,
  stopPlayer,
} from "../sim/ui.js";
import { BASE, announce, copyText, html, raw } from "../util.js";

const EXPERIENCE_URL = "/api/class/experience/get";
let live = { key: "", session: null };
let view = { restart: false, shared: null, busy: false };
const remote = new Map(); // compiled experiences fetched this visit: id → { def } | { error }

const bandOf = (band) => (band === "3-5" ? "3-5" : "6-8");
const urlOf = (id, band, tail = "") => `${BASE}/simulations/${id}${tail}?grades=${band}`;
const T = (I, pair) => I.T(pair[0], pair[1]);

/** A compiled experience: from this device first, else from the class server. */
async function experience(id) {
  const local = localExperience(id);
  if (local) return { def: local.def };
  if (remote.has(id)) return remote.get(id);
  let out;
  try {
    const res = await fetch(`${EXPERIENCE_URL}?id=${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => null);
    const def = data?.def || data?.experience?.def;
    out = res.ok && def ? { def } : { error: res.status === 404 ? "missing" : "offline" };
  } catch {
    out = { error: "offline" };
  }
  if (!out.error) remote.set(id, out);
  return out;
}

async function resolve(ctx) {
  const { id, sub, tab } = ctx.route;
  const band = bandOf(ctx.band);
  if (!id) return { band };
  const compiled = id === "x";
  const found = compiled ? await experience(sub) : { def: missionById(id, band) };
  if (!found.def) return { band, error: found.error || "missing", compiled };
  const check = validateMission(found.def);
  if (!check.ok) return { band, error: "invalid", errors: check.errors, compiled };
  const def = found.def;
  const path = compiled ? `x/${sub}` : def.id;
  const key = `${path}|${band}`;
  if (live.key !== key) {
    stopPlayer(live.session);
    const session = createSession(def, {
      state: restore(def, loadSaves()[def.id]),
      save: (state) => saveState(state),
      band,
      // Opened from a pathway stage: the language work counts toward that pathway's objective.
      objective: pathwayContext()?.run?.objective || "",
      reportHref: compiled
        ? urlOf(path, band).replace("?", "?tab=report&")
        : urlOf(path, band, "/report"),
    });
    if (session.state.complete) session.ui.panel = { kind: "complete" };
    live = { key, session };
    view = { restart: false, shared: null, busy: false };
  }
  return {
    band,
    def,
    path,
    compiled,
    session: live.session,
    report: (!compiled && sub === "report") || tab === "report",
  };
}

// ── hub ──────────────────────────────────────────────────────────────────────
function progressLine(I, def, state) {
  if (!state) return I.T("Not started", "Sin empezar");
  const p = progressOf(def, state);
  if (p.complete)
    return I.T(
      "Finished. You can read your report or play again.",
      "Terminada. Puedes leer tu informe o jugar otra vez.",
    );
  const act = def.acts[p.act];
  return I.T(
    `In progress: ${act.title[0]} · ${p.evidence.found} pieces of evidence · ${p.people.met} people questioned`,
    `En curso: ${act.title[1]} · ${p.evidence.found} evidencias · ${p.people.met} personas consultadas`,
  );
}

function card(I, def, href, state, tag = "") {
  const started = Boolean(state?.step);
  const start = def.scenes.find((s) => s.id === def.start);
  return html`<li>
    <a class="sim-card" href="${href}">
      <span class="sim-card-art">${raw(sceneSVG(start?.art))}</span>
      <span class="sim-card-body">
        ${tag ? html`<span class="sim-tag">${tag}</span>` : ""}
        <strong class="sim-card-title">${T(I, def.title)}</strong>
        <span>${T(I, def.summary)}</span>
        <span class="sim-card-meta"
          >${def.keyUses.join(" · ")} · ${progressLine(I, def, started ? state : null)}</span
        >
        <span class="sim-card-cta"
          >${state?.complete ? I.T("Open", "Abrir") : started ? I.T("Continue", "Continuar") : I.T("Start the mission", "Empezar la misión")}</span
        >
      </span>
    </a>
  </li>`;
}

function forTeachers(I, band) {
  const def = missionById(FLAGSHIP_ID, band);
  const link = `${BASE}/simulations/${FLAGSHIP_ID}`;
  return html`<details class="sim-fold sim-teach panel">
    <summary>${I.T("For teachers", "Para docentes")}</summary>
    <p>
      ${I.T("Assign the mission as its own link. In a class, add it as an assignment with this path:", "Asignen la misión con su propio enlace. En una clase, agréguenla como tarea con esta ruta:")}
    </p>
    <p class="sim-row">
      <code class="sim-link" id="simAssignLink">${link}</code>
      <button type="button" class="btn small" data-simv-copy="${link}">
        ${I.T("Copy the link", "Copiar el enlace")}
      </button>
    </p>
    <h3 class="sim-sub">${I.T("What comes back", "Lo que regresa")}</h3>
    <ul class="sim-list">
      <li>
        ${I.T("A mission evidence report in the class review list, sent only when the learner presses Share: the path taken, the evidence collected, the people questioned, the comparison, the decision with the evidence cited, the story outcome, and the learner's spoken explanation, written recommendation, revision and new-problem response.", "Un informe de evidencia en la lista de revisión de la clase, que se envía solo cuando el estudiante presiona Compartir: el recorrido, la evidencia reunida, las personas consultadas, la comparación, la decisión con la evidencia citada, el desenlace de la historia, y la explicación oral, la recomendación escrita, la revisión y la respuesta al problema nuevo.")}
      </li>
      <li>
        ${I.T("Each piece of language is labelled: on my own, with supports, a revision after feedback, or the new problem done with help closed. Speech turned into words is marked, because recognition can be wrong.", "Cada texto lleva su etiqueta: sin ayuda, con apoyos, una revisión después de los comentarios, o el problema nuevo hecho con los apoyos cerrados. La voz convertida en palabras se marca, porque el reconocimiento puede equivocarse.")}
      </li>
      <li>
        ${I.T("The outcome is a consequence in the story. It is not a grade, a score or a language level, and nothing here is an official WIDA or ACCESS result.", "El desenlace es una consecuencia dentro de la historia. No es una calificación, un puntaje ni un nivel de idioma, y nada aquí es un resultado oficial de WIDA o ACCESS.")}
      </li>
    </ul>
    <h3 class="sim-sub">${I.T("Language goals", "Metas de lenguaje")}</h3>
    <ul class="sim-list">
      <li>${T(I, def.objectives.language)}</li>
      <li>${T(I, def.objectives.content)}</li>
      <li>
        ${I.T(`Key Language Uses: ${def.keyUses.join(", ")}. WIDA ELD Standards Framework (2020) expectation families:`, `Usos clave del lenguaje: ${def.keyUses.join(", ")}. Familias de expectativas del marco WIDA ELD (2020):`)}
        ${def.standards.join(", ")} (<a href="${WIDA_SOURCE}" rel="noopener"
          >${I.T("source", "fuente")}</a
        >).
      </li>
    </ul>
  </details>`;
}

function hubHTML(I, band) {
  const saves = loadSaves();
  const made = localExperiences().filter((x) => validateMission(x.def).ok);
  return html`<section class="sim-hub">
    <header class="sim-hub-head">
      <p class="eyebrow">
        ${I.T("Explore, question, decide, explain", "Explora, pregunta, decide, explica")}
      </p>
      <h1 tabindex="-1">${I.T("Simulations", "Simulaciones")}</h1>
      <p class="lead">
        ${I.T("Step into a place with a real problem. Walk around, talk to people, collect evidence and decide what to do. What happens next depends on your evidence. Your work is saved on this device.", "Entra a un lugar con un problema real. Recorre, habla con la gente, reúne evidencia y decide qué hacer. Lo que pasa después depende de tu evidencia. Tu trabajo se guarda en este dispositivo.")}
      </p>
    </header>
    <ul class="sim-cards">
      ${listMissions(band).map((def) => card(I, def, urlOf(def.id, band), saves[def.id]))}
      ${made.map((x) => card(I, x.def, urlOf(`x/${x.id}`, band), saves[x.def.id], I.T("Made by your teacher", "Hecha por tu docente")))}
    </ul>
    ${forTeachers(I, band)}
  </section>`;
}

// ── a mission ────────────────────────────────────────────────────────────────
const PROBLEMS = {
  missing: [
    "We could not find that simulation. Check the link, or choose one from the list.",
    "No encontramos esa simulación. Revisa el enlace o elige una de la lista.",
  ],
  offline: [
    "That simulation could not be loaded. Check your internet connection and try again.",
    "No se pudo cargar esa simulación. Revisa tu conexión a internet e inténtalo otra vez.",
  ],
  invalid: [
    "That simulation cannot be played yet, because it is not complete. Tell your teacher.",
    "Esa simulación todavía no se puede jugar porque no está completa. Avísale a tu docente.",
  ],
};

function problemHTML(I, r, crumbs) {
  return html`${crumbs}
    <section class="panel sim-problem">
      <h1 tabindex="-1">${I.T("Simulations", "Simulaciones")}</h1>
      <p class="feedback is-hint" role="status">${T(I, PROBLEMS[r.error] || PROBLEMS.missing)}</p>
      ${
        r.errors?.length
          ? html`<details class="sim-fold">
              <summary>
                ${I.T("What needs fixing (for the author)", "Lo que hay que arreglar (para quien la hizo)")}
              </summary>
              <ul class="sim-list">
                ${r.errors.slice(0, 12).map((e) => html`<li>${e}</li>`)}
              </ul>
            </details>`
          : ""
      }
      <p>
        <a class="btn btn-primary" href="${BASE}/simulations?grades=${r.band}"
          >${I.T("All simulations", "Todas las simulaciones")}</a
        >
      </p>
    </section>`;
}

function reportHTML(I, r) {
  const { def, session, band, path } = r;
  return html`<section class="panel sim-report-page">
    <p class="eyebrow">${I.T("Mission evidence report", "Informe de evidencia de la misión")}</p>
    <h1 tabindex="-1">${T(I, def.title)}</h1>
    <p class="sim-note">
      ${I.T("This is what your teacher receives if you share it. It lists what you did and your own words. It is not a grade or a language level.", "Esto es lo que recibe tu docente si lo compartes. Enumera lo que hiciste y tus propias palabras. No es una calificación ni un nivel de idioma.")}
    </p>
    <pre class="sim-report" lang="en" tabindex="0">${missionReport(def, session.state)}</pre>
    <div class="sim-row">
      <a class="btn btn-primary" href="${urlOf(path, band)}"
        >${I.T("Back to the mission", "Volver a la misión")}</a
      >
      ${
        inClass()
          ? html`<button
              type="button"
              class="btn"
              data-simv-share
              ${view.busy || view.shared?.ok ? raw('aria-disabled="true"') : ""}
            >
              ${I.T("Share with my teacher", "Compartir con mi docente")}
            </button>`
          : html`<a class="btn" href="${BASE}/class"
              >${I.T("Join a class to share it", "Únete a una clase para compartirlo")}</a
            >`
      }
      <button type="button" class="btn" data-simv-print>${I.T("Print", "Imprimir")}</button>
    </div>
    ${
      view.shared
        ? html`<p class="feedback ${view.shared.ok ? "is-right" : "is-hint"}" role="status">
            ${
              view.shared.ok
                ? I.T(
                    "Sent to your teacher's review list.",
                    "Enviado a la lista de revisión de tu docente.",
                  )
                : I.T(
                    "It could not be sent right now. Your work is still saved on this device.",
                    "No se pudo enviar ahora. Tu trabajo sigue guardado en este dispositivo.",
                  )
            }
          </p>`
        : ""
    }
  </section>`;
}

const restartHTML = (I, session) =>
  session.state.step
    ? html`<div class="sim-foot">
        ${
          view.restart
            ? html`<p role="group" aria-label="${I.S("Start over", "Empezar de nuevo")}">
                ${I.T("Start this mission again from the beginning? Your notebook for it is cleared. Work you already sent stays in your records.", "¿Empezar esta misión otra vez desde el principio? Se borra tu cuaderno de esta misión. El trabajo que ya enviaste se queda en tus registros.")}
                <button type="button" class="btn small" data-simv-restart="yes">
                  ${I.T("Yes, start over", "Sí, empezar de nuevo")}
                </button>
                <button type="button" class="btn small" data-simv-restart="no">
                  ${I.T("Keep my progress", "Conservar mi avance")}
                </button>
              </p>`
            : html`<button type="button" class="btn small" data-simv-restart="ask">
                ${I.T("Start over", "Empezar de nuevo")}
              </button>`
        }
      </div>`
    : "";

export async function render(ctx) {
  const I = i18nFor(ctx);
  const r = await resolve(ctx);
  const home = [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${r.band}`];
  const hub = [I.S("Simulations", "Simulaciones"), `${BASE}/simulations?grades=${r.band}`];
  if (!ctx.route.id)
    return {
      title: I.S("Simulations", "Simulaciones"),
      html: html`${crumbsHTML([home, [hub[0], null]])}${hubHTML(I, r.band)}`,
    };
  if (r.error)
    return {
      title: I.S("Simulations", "Simulaciones"),
      html: problemHTML(I, r, crumbsHTML([home, hub])),
    };
  const title = I.S(r.def.title[0], r.def.title[1]);
  if (r.report)
    return {
      title: `${I.S("Evidence report", "Informe de evidencia")} · ${title}`,
      html: html`${crumbsHTML([home, hub, [title, urlOf(r.path, r.band)], [I.S("Evidence report", "Informe de evidencia"), null]])}${reportHTML(I, r)}`,
    };
  return {
    title,
    html: html`${crumbsHTML([home, hub, [title, null]])}${pathwayBannerHTML(ctx)}${downloadMenuHTML(ctx, "simulation", r.def)}${playerHTML(ctx, r.def, r.session.state, { session: r.session })}${restartHTML(I, r.session)}`,
  };
}

export function onClick(e, ctx) {
  if (onDownloadClick(e, ctx)) return true;
  const t = e.target;
  const I = i18nFor(ctx);
  const copy = t.closest("[data-simv-copy]");
  if (copy) {
    copyText(`${location.origin}${copy.dataset.simvCopy}`).then(() =>
      announce(I.S("Link copied.", "Enlace copiado."), { tone: "success" }),
    );
    return true;
  }
  if (t.closest("[data-simv-print]")) {
    window.print();
    return true;
  }
  const session = live.session;
  if (!session) return false;
  if (t.closest("[data-simv-share]")) {
    if (view.busy || view.shared?.ok) return true;
    view.busy = true;
    shareReport(session.def, session.state).then((res) => {
      view = { ...view, busy: false, shared: res };
      ctx.rerender();
    });
    return true;
  }
  const restart = t.closest("[data-simv-restart]");
  if (restart) {
    const what = restart.dataset.simvRestart;
    if (what === "yes") {
      stopPlayer(session);
      clearSave(session.def.id);
      live = { key: "", session: null };
      announce(I.S("The mission starts again.", "La misión empieza otra vez."));
    }
    view.restart = what === "ask";
    ctx.rerender();
    return true;
  }
  return onPlayerClick(e, ctx, session);
}

export const onInput = (e, ctx) => onPlayerInput(e, ctx, live.session);
export const onChange = (e, ctx) => onPlayerChange(e, ctx, live.session);

export function onKey(e) {
  // Enter in the question box asks it; Ctrl/⌘+Enter in a writing box sends it.
  if (e.key !== "Enter") return;
  if (e.target.matches?.("[data-sim-question]")) {
    e.preventDefault();
    document.querySelector("[data-sim-send]")?.click();
  } else if ((e.ctrlKey || e.metaKey) && e.target.matches?.("[data-sim-text]")) {
    e.preventDefault();
    document.querySelector(`[data-sim-submit="${e.target.dataset.simText}"]`)?.click();
  }
}

export function unmount() {
  stopPlayer(live.session);
  live = { key: "", session: null };
}
