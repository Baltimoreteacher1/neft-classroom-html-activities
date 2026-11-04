// Shared pieces of the Journey pages (home hero, map, mission overview): data resolution, wording,
// step pips, environment chips. Pure markup helpers; storage is read only by loadJourneyData.
import { i18nFor } from "../../i18n.js";
import { loadLedger } from "../../lang/ledger.js";
import { BASE, DOMAIN_META, html, icon, raw } from "../../util.js";
import { MISSIONS, STEPS, UNITS, missionNumber, stepInfo, unitOf } from "../curriculum.js";
import { recommendNext, reviewCandidates } from "../recommend.js";
import { getStep, loadJourney, missionStatus, stepStatus } from "../state.js";

export const jhref = (band, path = "") => `${BASE}/journey${path}?grades=${band}`;
export const stepHref = (band, mission, step) => jhref(band, `/${mission}/${step}`);
/** A bilingual pair [en, es] as markup for the current language mode. */
export const tx = (I, pair) => I.T(pair[0], pair[1]);
export const txS = (I, pair) => I.S(pair[0], pair[1]);

/** The student's journey, read once per render: state, ledger, next step and due reviews. */
export function loadJourneyData(band, { ledger } = {}) {
  const state = loadJourney();
  const led = ledger ?? loadLedger();
  return {
    state,
    ledger: led,
    recommendation: recommendNext(state, band, { ledger: led }),
    reviews: reviewCandidates(state, band, {}),
  };
}

/** Fill every dependency a page needs; the runner passes some, tests pass all. */
export function resolveDeps(ctx, deps = {}) {
  const band = deps.band ?? ctx.band;
  const state = deps.state ?? loadJourney();
  const ledger = deps.ledger ?? loadLedger();
  return {
    band,
    I: deps.I ?? i18nFor(ctx),
    state,
    ledger,
    recommendation: deps.recommendation ?? recommendNext(state, band, { ledger }),
    reviews: deps.reviews ?? reviewCandidates(state, band, {}),
  };
}

// ── wording ───────────────────────────────────────────────────────────────────
export const MISSION_STATUS = {
  "not-started": ["Not started", "Sin empezar"],
  "in-progress": ["In progress", "En progreso"],
  "completed-with-support": ["Completed with support", "Completada con apoyo"],
  "independently-demonstrated": ["Shown on my own", "Mostrada por mi cuenta"],
};
export const STEP_STATE = {
  new: { glyph: "number", text: ["Not started", "Sin empezar"] },
  started: { glyph: "play", text: ["In progress", "En progreso"] },
  "done-supported": { glyph: "check", text: ["Done with support", "Hecho con apoyo"] },
  "done-independent": { glyph: "star", text: ["Done on my own", "Hecho por mi cuenta"] },
};
export const REVISITED = ["Revisited", "Revisado"];
export const KLU_NAME = {
  Narrate: ["Narrate", "Narrar"],
  Inform: ["Inform", "Informar"],
  Explain: ["Explain", "Explicar"],
  Argue: ["Argue", "Argumentar"],
};
export const ENV_NAME = {
  classroom: ["Classroom", "Salón de clases"],
  lab: ["Lab", "Laboratorio"],
  garden: ["Garden", "Huerto"],
  community: ["Community", "Comunidad"],
  museum: ["Museum", "Museo"],
  library: ["Library", "Biblioteca"],
  map: ["Map room", "Sala de mapas"],
  debate: ["Debate hall", "Sala de debate"],
};
/** One 24px line glyph per environment (stroke = currentColor), so the places read at a glance. */
const ENV_PATH = {
  classroom:
    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20l2-4M17 20l-2-4M8 9h5M8 12h8"/>',
  lab: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  garden:
    '<path d="M12 21v-9M8 21h8"/><path d="M12 12c0-4 2.5-6 7-6 0 4-2.5 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3.5 2 5 6 5z"/>',
  community: '<path d="M3 20V11l5-4 5 4v9M13 20v-7l4-3 4 3v7M2 20h20"/><path d="M7 20v-4h2v4"/>',
  museum: '<path d="M3 9l9-5 9 5H3z"/><path d="M5 11v7M10 11v7M14 11v7M19 11v7M3 21h18"/>',
  library: '<path d="M4 4h4v16H4zM8 7h4v13H8z"/><path d="M13.5 20L16 6l4 1-2.5 14z"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  debate: '<path d="M4 5h11v8H9l-3 3v-3H4z"/><path d="M18 9h2v8h-2v3l-3-3h-5v-2"/>',
};
export const envGlyph = (env, cls = "") =>
  raw(
    `<svg class="jr-env-glyph ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ENV_PATH[env] || ENV_PATH.map}</svg>`,
  );
export const envChip = (I, env) =>
  html`<span class="jr-env" data-env="${env}"
    >${envGlyph(env)}<span>${tx(I, ENV_NAME[env])}</span></span
  >`;

export const isComplete = (status) =>
  status === "completed-with-support" || status === "independently-demonstrated";
export const missionDone = (state, band, id) => isComplete(missionStatus(state, band, id));

// ── step pips ─────────────────────────────────────────────────────────────────
/**
 * One step's state as a pip: a distinct glyph per state plus words for assistive tech, so colour is never
 * the only signal. `link` makes it a 44px target to the step; `here` marks the recommended next step.
 */
export function pipHTML(I, state, band, mission, stepId, { link = true, here = false } = {}) {
  const st = stepStatus(state, band, mission, stepId);
  const info = STEP_STATE[st] || STEP_STATE.new;
  const step = stepInfo(stepId);
  const revisited = getStep(state, band, mission, stepId).revisits > 0;
  const words = [
    I.S(`Step ${step.n}: ${step.label[0]}`, `Paso ${step.n}: ${step.label[1]}`),
    txS(I, info.text),
    revisited ? txS(I, REVISITED) : "",
    here ? I.S("You are here", "Estás aquí") : "",
  ]
    .filter(Boolean)
    .join(". ");
  const dot = html`<span class="jr-pip-dot" aria-hidden="true"
      >${info.glyph === "number" ? html`<b>${step.n}</b>` : icon(info.glyph)}</span
    >${revisited ? html`<span class="jr-pip-rev" aria-hidden="true">${icon("retry")}</span>` : ""}`;
  const attrs = `class="jr-pip is-${st}${revisited ? " is-revisited" : ""}${here ? " is-here" : ""}" data-step="${stepId}" data-state="${st}"`;
  return link
    ? html`<a
        ${raw(attrs)}
        href="${stepHref(band, mission, stepId)}"
        aria-label="${words}"
        ${here ? raw('aria-current="step"') : ""}
        >${dot}</a
      >`
    : html`<span ${raw(attrs)} role="img" aria-label="${words}">${dot}</span>`;
}

export const pipRow = (I, state, band, mission, { link = true, here = null, label } = {}) =>
  html`<ol
    class="jr-pips"
    aria-label="${label || I.S(`Steps of Mission ${missionNumber(mission)}`, `Pasos de la misión ${missionNumber(mission)}`)}"
  >
    ${STEPS.map((s) => html`<li>${pipHTML(I, state, band, mission, s.id, { link, here: here === s.id })}</li>`)}
  </ol>`;

/** Legend for the five pip states, drawn with the same glyphs the pips use. */
export function legendHTML(I) {
  const items = [
    ["new", STEP_STATE.new.text, "1"],
    ["started", STEP_STATE.started.text],
    ["done-supported", STEP_STATE["done-supported"].text],
    ["done-independent", STEP_STATE["done-independent"].text],
    ["revisited", REVISITED],
  ];
  return html`<ul
    class="jr-legend"
    aria-label="${I.S("What the step markers mean", "Qué significan los marcadores de pasos")}"
  >
    ${items.map(([st, text, num]) => {
      const glyph = st === "new" ? num : null;
      const g = {
        started: "play",
        "done-supported": "check",
        "done-independent": "star",
        revisited: "retry",
      }[st];
      return html`<li>
        <span class="jr-pip-dot is-${st}" aria-hidden="true"
          >${glyph ? html`<b>${glyph}</b>` : icon(g)}</span
        ><span>${tx(I, text)}</span>
      </li>`;
    })}
  </ul>`;
}

export const hereChip = (I) =>
  html`<span class="jr-here"
    >${icon("pin")}<span>${I.T("You are here", "Estás aquí")}</span></span
  >`;

// ── units and ledger ──────────────────────────────────────────────────────────
export const unitClass = (mission) => `jr-u${unitOf(mission).n}`;
export const unitLabel = (I, u) =>
  I.T(`Unit ${u.n}: ${u.title[0]}`, `Unidad ${u.n}: ${u.title[1]}`);

/** Entries of one mission in the evidence ledger (src "mission", task "<mNN>.<step>"). */
export const missionEntries = (ledger, band, mission) =>
  (ledger?.entries || []).filter(
    (e) =>
      e?.src === "mission" && (e.band || band) === band && String(e.task).startsWith(`${mission}.`),
  );

/** A Before & After record exists once a first response and a later revision or transfer are both saved. */
export function hasGrowthRecord(ledger, band, mission) {
  const e = missionEntries(ledger, band, mission);
  return (
    e.some((x) => x.kind === "first") &&
    e.some((x) => x.kind === "revision" || x.kind === "transfer")
  );
}

export const domainChip = (I, d) =>
  html`<span class="jr-domain d-${d.toLowerCase()}"
    >${icon(DOMAIN_META[d].icon)}<span>${I.T(DOMAIN_META[d].name, DOMAIN_META[d].es)}</span></span
  >`;

export const totalMinutes = () => STEPS.reduce((n, s) => n + s.minutes, 0);
export { MISSIONS, UNITS };
