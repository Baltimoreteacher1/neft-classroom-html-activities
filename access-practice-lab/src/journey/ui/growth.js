// Journey evidence for the Passport and the mission overview: Before/After cards per mission, an evidence tally that keeps
// supported attempts apart from independent demonstrations, and per-feature counts from the ledger.
// Honesty rules (PLATFORM.md): counts and the learner's own words only. No score, no level, no percentage of ability.
// Trend language needs MIN_POINTS independent attempts (the lab's rule); under that it says "not enough evidence yet".
import { html } from "../../util.js";
import { MIN_POINTS, featureValue, trend } from "../../lang/ledger.js";
import { MISSION_IDS, MISSIONS } from "../curriculum.js";
import { recordFromSteps, withIndependent } from "../engines/mirror.js";
import { changesHTML, compareHTML } from "./mirror-view.js";

const FEATURES = [
  ["moves", ["Moves of the task", "Pasos de la tarea"]],
  ["link", ["Ways of linking ideas", "Maneras de conectar ideas"]],
  ["cites", ["Points to the source", "Referencias a la fuente"]],
  ["complex", ["Sentences with more than one idea", "Oraciones con más de una idea"]],
  ["academic", ["Precise subject words", "Palabras precisas del tema"]],
];
const DIRECTION = {
  improving: ["showed up more often", "apareció más seguido"],
  steady: ["stayed about the same", "se mantuvo parecido"],
  slipping: ["showed up less often", "apareció menos seguido"],
};

const missionEntries = (ledger, band) =>
  (ledger?.entries || []).filter((e) => e.src === "mission" && e.band === band);

/** The growth record for one mission from saved step results, preferring a record stored by the shell. */
export function recordFor(band, missionId, mission) {
  const steps = mission?.steps || {};
  const stored = steps.show?.data?.result?.growth;
  if (stored?.v) return stored;
  const imp = steps.improve?.data?.result;
  if (steps.improve?.status !== "done" || !imp) return null;
  const base = imp.growth?.v
    ? imp.growth
    : recordFromSteps(missionId, band, { ...steps, show: undefined });
  const show = steps.show?.data?.result;
  return show?.text ? withIndependent(base, show) : base;
}

/** Supported attempts and independent demonstrations, counted apart from the ledger (never added together or turned into a rate). */
export function evidenceTally(state, ledger, band) {
  const entries = missionEntries(ledger, band);
  const independent = entries.filter((e) => e.stage === "independent");
  const missions = state?.bands?.[band]?.missions || {};
  return {
    supportedAttempts: entries.length - independent.length,
    independentDemonstrations: independent.length,
    revisions: entries.filter((e) => e.kind === "revision").length,
    missionsShownOnOwn: MISSION_IDS.filter(
      (id) =>
        missions[id]?.steps?.show?.status === "done" &&
        missions[id].steps.show.stage === "independent",
    ).length,
    enough: independent.length >= MIN_POINTS,
  };
}

/** One chip per language feature: in how many attempts it showed up. Trend words only with enough independent attempts. */
export function featureChips(ledger, band) {
  const entries = missionEntries(ledger, band);
  const independent = entries
    .filter((e) => e.stage === "independent")
    .sort((a, b) => String(a.t).localeCompare(String(b.t)));
  return FEATURES.map(([key, label]) => {
    const values = entries.map((e) => featureValue(e, key)).filter((v) => v != null);
    const seen = values.filter((v) => v > 0).length;
    const ind = independent.map((e) => featureValue(e, key)).filter((v) => v != null);
    const t = trend(ind);
    return {
      key,
      label,
      seen,
      of: values.length,
      direction: t.status === "ok" ? t.direction : null,
    };
  }).filter((c) => c.of > 0);
}

function recordCard(I, record, id, open = false) {
  const m = MISSIONS[record.missionId];
  const rev = record.revision;
  const ind = record.independent;
  const status = ind
    ? ind.demonstrated
      ? I.T("Shown on my own", "Mostrado por mi cuenta")
      : I.T("Completed with support", "Completado con apoyo")
    : I.T("New try on my own: not yet", "Nuevo intento por mi cuenta: todavía no");
  return html`<details class="mr-gcard" ${open ? "open" : ""}>
    <summary>
      <span class="mr-gtitle">${m ? I.T(...m.title) : record.missionId}</span>
      <span class="mr-gtarget"
        >${I.T("Target:", "Meta:")} ${I.T(rev.target.label, rev.target.labelEs)}</span
      >
      <span class="mr-badge ${ind?.demonstrated ? "is-independent" : "is-supported"}"
        >${status}</span
      >
    </summary>
    <div class="mr-gbody">
      <p class="mr-badge-row">
        <span class="mr-badge is-supported"
          >${I.T("Supported practice", "Práctica con apoyo")}</span
        >
        ${I.T("first response and revision", "primera respuesta y revisión")}
      </p>
      ${rev.changed ? compareHTML(I, record.first.text, rev.text, null, { id }) : html`<p>${I.T("I kept my first response as it was.", "Dejé mi primera respuesta como estaba.")}</p>`}
      ${changesHTML(I, rev.observable)}
      ${
        ind
          ? html`<p class="mr-badge-row">
                <span class="mr-badge ${ind.demonstrated ? "is-independent" : "is-supported"}"
                  >${status}</span
                >
                ${I.T("a new task, no help", "una tarea nueva, sin ayuda")}
              </p>
              ${(record.changeLines || []).slice(-2).map((l) => html`<p class="fine">${I.TO(l)}</p>`)}`
          : ""
      }
    </div>
  </details>`;
}

const tallyHTML = (I, t) => {
  const one = (n) => n === 1;
  return html`<ul class="mr-tally">
    <li>
      <b>${t.supportedAttempts}</b>
      <span
        >${one(t.supportedAttempts) ? I.T("supported attempt (help opened, feedback on a draft, or guided)", "intento con apoyo (con ayuda, con comentarios sobre un borrador o guiado)") : I.T("supported attempts (help opened, feedback on a draft, or guided)", "intentos con apoyo (con ayuda, con comentarios sobre un borrador o guiados)")}</span
      >
    </li>
    <li>
      <b>${t.independentDemonstrations}</b>
      <span
        >${one(t.independentDemonstrations) ? I.T("independent demonstration (no help opened)", "demostración independiente (sin abrir ayuda)") : I.T("independent demonstrations (no help opened)", "demostraciones independientes (sin abrir ayuda)")}</span
      >
    </li>
    <li>
      <b>${t.missionsShownOnOwn}</b>
      <span>${one(t.missionsShownOnOwn) ? I.T("mission shown on my own", "misión mostrada por mi cuenta") : I.T("missions shown on my own", "misiones mostradas por mi cuenta")}</span>
    </li>
  </ul>`;
};

function chipsHTML(I, chips, enough) {
  if (!chips.length) return "";
  return html`<ul class="mr-chips">
    ${chips.map((c) => html`<li class="mr-chip"><span>${I.T(...c.label)}</span> <b>${c.seen} ${I.S("of", "de")} ${c.of}</b> <span class="fine">${I.T("attempts", "intentos")}</span>${enough && c.direction ? html` <span class="fine">· ${I.T("on my own it", "por mi cuenta")} ${I.T(...DIRECTION[c.direction])}</span>` : ""}</li>`)}
  </ul>`;
}

/**
 * Passport / overview section. `state` is the whole journey state, `ledger` the evidence ledger. The caller supplies the
 * section heading. Records come from what the learner saved; nothing is estimated.
 */
export function growthSectionHTML(first, state, ledger, band) {
  // Also callable with one object, { I, state, ledger, band, missionId }: the mission overview shows that mission's cards only.
  const arg = first && typeof first.T !== "function" && first.I ? first : null;
  const I = arg ? arg.I : first;
  if (arg) ({ state, ledger, band } = arg);
  const only = arg?.missionId || arg?.mission || null;
  const missions = state?.bands?.[band]?.missions || {};
  const records = MISSION_IDS.filter((id) => !only || id === only)
    .map((id) => ({ id, record: recordFor(band, id, missions[id]) }))
    .filter((x) => x.record);
  if (only)
    return records.length
      ? html`<div class="mr-growth">${records.map((x) => recordCard(I, x.record, `mrg-${x.id}`, true))}</div>`
      : "";
  const tally = evidenceTally(state, ledger, band);
  const chips = featureChips(ledger, band);
  return html`<div class="mr-growth">
    <p class="fine">
      ${I.T("Everything here comes from your own saved work. These are counts, not a score, a level or a prediction.", "Todo aquí viene de tu propio trabajo guardado. Son conteos, no un puntaje, un nivel ni una predicción.")}
    </p>
    <h3>${I.T("Evidence so far", "Evidencia hasta ahora")}</h3>
    ${tallyHTML(I, tally)}
    <p class="mr-evidence-note" role="status">
      ${tally.enough ? I.T("There are enough attempts on your own to describe how a feature changed across them.", "Hay suficientes intentos por tu cuenta para describir cómo cambió cada aspecto.") : I.T(`Not enough evidence yet to describe a change over time: ${tally.independentDemonstrations} of ${MIN_POINTS} independent attempts so far.`, `Todavía no hay suficiente evidencia para describir un cambio con el tiempo: ${tally.independentDemonstrations} de ${MIN_POINTS} intentos independientes hasta ahora.`)}
    </p>
    ${chipsHTML(I, chips, tally.enough)}
    <h3>${I.T("Before and after", "Antes y después")}</h3>
    ${records.length ? records.map((x) => recordCard(I, x.record, `mrg-${x.id}`)) : html`<p>${I.T("Your Before and After cards appear here after you finish the Improve step of a mission.", "Tus tarjetas de Antes y Después aparecen aquí cuando termines el paso Mejora de una misión.")}</p>`}
  </div>`;
}
