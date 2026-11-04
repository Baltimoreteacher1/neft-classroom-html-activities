// Journey step runner panels: the step-complete panel, the mission-complete block and error panels.
// A learner never lands on an unexplained dead end: every panel here carries a forward link (the recommendation
// is the one primary button; alternatives and the journey map are always there).
import { BASE, DOMAIN_META, html, icon } from "../util.js";
import { COPY } from "./engines/mirror-copy.js";
import { STATUS_TEXT, homeHref, mapHref, stepHref } from "./runner-chrome.js";

const num = (r, ...names) => {
  for (const n of names) {
    const v = Array.isArray(r?.[n]) ? r[n].length : r?.[n];
    if (Number.isFinite(v)) return v;
  }
  return null;
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** What the learner just did, from the result the engine stored. Only real values; generic wording when a field is absent. */
export function factsFor(I, stepId, result, commKind) {
  const r = result || {};
  const out = [];
  const say = commKind === "converse";
  const words = num(r, "words");
  const used = num(r, "supportsUsed");
  const evidence = num(r, "evidence", "evidenceCount");
  const add = (en, es) => out.push(I.T(en, es));
  if (stepId === "discover") {
    add(
      "You looked into the situation and sent an explanation to your partner.",
      "Investigaste la situación y le enviaste una explicación a tu compañero.",
    );
    const seen = num(r, "examined", "observations");
    if (seen != null)
      add(
        `You examined ${plural(seen, "thing", "things")} in the scene.`,
        `Examinaste ${plural(seen, "cosa", "cosas")} en la escena.`,
      );
    const tried = num(r, "manipulations", "tests");
    if (tried != null)
      add(
        `You tested ${plural(tried, "change", "changes")}.`,
        `Probaste ${plural(tried, "cambio", "cambios")}.`,
      );
  } else if (stepId === "understand") {
    add(
      "You listened and put every piece in the right place, then built and explained what the text shows.",
      "Escuchaste y pusiste cada pieza en su lugar, y luego armaste y explicaste lo que muestra el texto.",
    );
  } else if (stepId === "build") {
    add(
      "You built your sentences, then used the same language again in a new example.",
      "Armaste tus oraciones y usaste el mismo lenguaje en un ejemplo nuevo.",
    );
  } else if (stepId === "improve") {
    add(
      "You changed your response on one target and chose why the change helps.",
      "Cambiaste tu respuesta en un solo punto y elegiste por qué el cambio ayuda.",
    );
    if (typeof r.target === "string" && r.target) {
      // The target is a move id; the learner met it as a plain name ("Set the scene"), so say that name.
      const name = COPY[r.target]?.label || [r.target.replace(/-/g, " "), r.target.replace(/-/g, " ")];
      add(`Your target was “${name[0]}”.`, `Tu punto de mejora fue “${name[1]}”.`);
    }
  } else if (words != null) {
    add(
      say
        ? `You said about ${plural(words, "word", "words")}.`
        : `You wrote ${plural(words, "word", "words")}.`,
      say
        ? `Dijiste unas ${plural(words, "palabra", "palabras")}.`
        : `Escribiste ${plural(words, "palabra", "palabras")}.`,
    );
  } else {
    add("You finished the task.", "Terminaste la tarea.");
  }
  if (stepId === "communicate" || stepId === "show") {
    if (evidence != null)
      add(
        `You used ${plural(evidence, "piece", "pieces")} of evidence.`,
        `Usaste ${plural(evidence, "dato", "datos")} como evidencia.`,
      );
    if (stepId === "communicate" && used != null)
      add(
        used ? `You used ${plural(used, "support", "supports")}.` : "You used no supports.",
        used ? `Usaste ${plural(used, "apoyo", "apoyos")}.` : "No usaste apoyos.",
      );
    if (stepId === "show")
      add("You worked on a new task with no help.", "Trabajaste en una tarea nueva sin ayuda.");
  }
  return out;
}

const MISSION_STATUS = {
  "completed-with-support": ["Completed with support", "Completada con apoyo"],
  "independently-demonstrated": ["Shown on my own", "Demostrada por mi cuenta"],
};

const hrefOf = (band, mission, step) =>
  mission ? stepHref(band, mission, step || "") : mapHref(band);

/** The one primary action: where the recommendation says to go, in student words. */
export function primaryTarget({ I, band, rec, curriculum, steps, missionId }) {
  const { MISSIONS, missionNumber } = curriculum;
  const m = rec?.mission && MISSIONS[rec.mission];
  if (!m) return { href: mapHref(band), label: I.T("See my journey map", "Ver mi mapa del viaje") };
  const n = missionNumber(rec.mission);
  const step = steps.find((s) => s.id === rec.step);
  const href = hrefOf(band, rec.mission, rec.step);
  if (rec.mission === missionId && step)
    return {
      href,
      label: I.T(
        `Next: Step ${step.n}, ${step.label[0]}`,
        `Siguiente: Paso ${step.n}, ${step.label[1]}`,
      ),
    };
  if (rec.kind === "next-mission" || rec.kind === "start" || !step)
    return {
      href,
      label: I.T(`Start Mission ${n}: ${m.title[0]}`, `Empezar la Misión ${n}: ${m.title[1]}`),
    };
  return {
    href,
    label: I.T(
      `Continue Mission ${n}: ${m.title[0]}, ${step.label[0]}`,
      `Seguir con la Misión ${n}: ${m.title[1]}, ${step.label[1]}`,
    ),
  };
}

/** Up to two alternatives: the recommender's own first, then practice, then the map. Never repeats a link. */
export function alternatives({ I, band, rec, primaryHref, practiceDomain }) {
  const seen = new Set([primaryHref]);
  const out = [];
  const push = (href, label, reason) => {
    if (out.length >= 2 || seen.has(href)) return;
    seen.add(href);
    out.push({ href, label, reason });
  };
  // A support or review recommendation names its own practice link (recommend.js `practice`): offer it first.
  if (rec?.practice)
    push(rec.practice.href, I.T(...rec.practice.label), I.T(`A short ${rec.practice.domain.toLowerCase()} activity.`, `Una actividad corta de ${DOMAIN_META[rec.practice.domain]?.es?.toLowerCase() || "lenguaje"}.`));
  for (const a of rec?.alternatives || [])
    push(hrefOf(band, a.mission, a.step), I.T(...a.label), a.reason ? I.T(...a.reason) : "");
  const meta = DOMAIN_META[practiceDomain];
  if (meta)
    push(
      `${BASE}/${practiceDomain}?grades=${band}`,
      I.T("Practice this skill", "Practicar esta destreza"),
      I.T(
        `A short ${meta.name.toLowerCase()} activity.`,
        `Una actividad corta de ${meta.es.toLowerCase()}.`,
      ),
    );
  push(mapHref(band), I.T("Back to my journey map", "Volver a mi mapa del viaje"), "");
  return out;
}

function missionBlock({ I, band, mission, missionStatus, rec, primary }) {
  const status = MISSION_STATUS[missionStatus];
  if (!status) return "";
  const support = missionStatus === "completed-with-support";
  return html`<div class="jr-mission-done" role="group" aria-labelledby="jrMissionDone">
    <h3 id="jrMissionDone">
      ${icon(support ? "check" : "star")} ${I.T("Mission complete", "Misión completa")}:
      ${I.T(...status)}
    </h3>
    <p>${I.T(...mission.goal[band])}</p>
    <p class="fine">
      ${
        support
          ? I.T(
              "Show was done with help open, so this mission counts as completed with support. You can repeat Show on your own any time.",
              "Muestra se hizo con ayuda abierta, así que esta misión cuenta como completada con apoyo. Puedes repetir Muestra por tu cuenta cuando quieras.",
            )
          : I.T(
              "You showed this on a new task with no help. Your support work and your own work are saved separately.",
              "Lo mostraste en una tarea nueva sin ayuda. Tu trabajo con apoyo y tu trabajo por tu cuenta se guardan por separado.",
            )
      }
      ${rec?.kind === "unit-complete" ? I.T("This finishes the unit.", "Con esto termina la unidad.") : ""}
      ${rec?.kind === "journey-complete" ? I.T("This finishes the whole journey.", "Con esto termina todo el viaje.") : ""}
    </p>
  </div>`;
}

/**
 * The panel after a step: what I did, where to go next (one primary button), alternatives, and a Repeat option.
 * `showSummary` is the Growth Mirror's own summary html on the Show step.
 */
export function completePanelHTML({
  I,
  band,
  missionId,
  mission,
  step,
  status,
  facts,
  rec,
  primary,
  alts,
  missionStatus,
  showSummary,
  related = "",
}) {
  return html`<section class="panel jr-done" aria-labelledby="jrDoneTitle" data-jr-panel="complete">
    <p class="eyebrow">
      ${icon(status === "done-independent" ? "star" : "check")}
      ${I.T(...(STATUS_TEXT[status] || STATUS_TEXT["done-supported"]))}
    </p>
    <h2 id="jrDoneTitle" tabindex="-1">
      ${I.T(`You finished Step ${step.n}: ${step.label[0]}`, `Terminaste el Paso ${step.n}: ${step.label[1]}`)}
    </h2>
    <ul class="jr-facts">
      ${facts.map((f) => html`<li>${icon("check")} <span>${f}</span></li>`)}
    </ul>
    ${showSummary ? html`<div class="jr-show-summary">${showSummary}</div>` : ""}
    ${missionBlock({ I, band, mission, missionStatus, rec })}
    <div class="jr-next">
      ${rec?.reason ? html`<p class="jr-reason">${I.T(...rec.reason)}</p>` : ""}
      <a class="btn btn-primary btn-big" href="${primary.href}" data-jr-next
        >${primary.label} ${icon("arrow-right")}</a
      >
      <ul class="jr-alts">
        ${alts.map(
          (a) =>
            html`<li>
              <a class="btn btn-secondary" href="${a.href}">${a.label}</a
              >${a.reason ? html` <span class="fine">${a.reason}</span>` : ""}
            </li>`,
        )}
      </ul>
    </div>
    ${related}
    <div class="jr-redo">
      <p>
        ${I.T("You finished this step. Try it again?", "Terminaste este paso. ¿Quieres intentarlo otra vez?")}
      </p>
      <button type="button" class="btn ghost" data-jr-repeat>
        ${icon("retry")} ${I.T("Repeat this step", "Repetir este paso")}
      </button>
      <p class="fine">${I.T("Your first try stays saved.", "Tu primer intento queda guardado.")}</p>
    </div>
  </section>`;
}

/** Shown when a mission, step or pack cannot be found. Still a way forward. */
export function problemPanelHTML(I, band, { title, text }) {
  return html`<section class="panel jr-problem empty-state" data-jr-panel="problem">
    <h1 tabindex="-1">${title}</h1>
    <p>${text}</p>
    <p>
      <a class="btn btn-primary" href="${mapHref(band)}"
        >${I.T("Go to my journey map", "Ir a mi mapa del viaje")}</a
      >
      <a class="btn btn-secondary" href="${homeHref(band)}"
        >${I.T("Continue my journey", "Continuar mi viaje")}</a
      >
    </p>
  </section>`;
}
