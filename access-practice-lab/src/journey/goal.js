// "My goal for this mission": before a mission the learner may pick one personal goal (or skip), and after the Show
// step they say whether they met it (Yes / Partly / Not yet) next to the evidence the lab already has.
// The choice is stored on the mission record in the journey state (state.js setGoal / setGoalMet). No scoring: the
// evidence lines are counts of what is on the page and of help opened, never a grade, level or rate.
import { html, icon } from "../util.js";

/** Every goal: label and the one-line reason it is offered. `klu` ties it to a Key Language Use (null = any mission). */
export const GOALS = {
  order: {
    klu: "Narrate",
    label: [
      "Use order words (first, then, after)",
      "Usar palabras de orden (primero, luego, después)",
    ],
  },
  precise: {
    klu: "Inform",
    label: ["Use more exact subject words", "Usar palabras más exactas del tema"],
  },
  because: {
    klu: "Explain",
    label: ["Explain why with because or so", "Explicar por qué con porque o así que"],
  },
  evidence: {
    klu: "Argue",
    label: ["Point to the source for my reasons", "Señalar la fuente de mis razones"],
  },
  words: { klu: null, label: ["Use more subject words", "Usar más palabras del tema"] },
  clearer: {
    klu: null,
    label: ["Make my answer clearer when I revise", "Hacer mi respuesta más clara al revisarla"],
  },
  own: { klu: null, label: ["Try without help", "Intentarlo sin ayuda"] },
};
export const GOAL_IDS = Object.keys(GOALS);
export const MET = ["yes", "partly", "notyet"];
const MET_LABEL = {
  yes: ["Yes", "Sí"],
  partly: ["Partly", "En parte"],
  notyet: ["Not yet", "Todavía no"],
};

/** Three or four goals for a mission: the one tied to its Key Language Use first, then the general ones. */
export function goalOptions(klu) {
  const tied = GOAL_IDS.filter((id) => GOALS[id].klu === klu);
  const general = ["words", "clearer", "own"].filter(
    (id) => !(tied[0] === "precise" && id === "words"),
  );
  return [...tied, ...general].slice(0, 4);
}

/** A stored goal, sanitised: { id, met, at } | { skipped: true, at } | null. */
export function cleanGoal(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const at = typeof raw.at === "string" && Number.isFinite(Date.parse(raw.at)) ? raw.at : null;
  if (raw.skipped === true) return { skipped: true, at };
  if (!GOAL_IDS.includes(raw.id)) return null;
  return { id: raw.id, met: MET.includes(raw.met) ? raw.met : null, at };
}

const FEATURE_OF = {
  order: "linkKinds",
  because: "complex",
  evidence: "cites",
  precise: "academic",
  words: "academic",
};
const FEATURE_LABEL = {
  linkKinds: ["Ways of linking ideas", "Maneras de conectar ideas"],
  complex: ["Sentences with more than one idea", "Oraciones con más de una idea"],
  cites: ["Points to the source", "Referencias a la fuente"],
  academic: ["Precise subject words", "Palabras precisas del tema"],
};

/**
 * Evidence the lab already has for a goal, as [English, Spanish] lines.
 * @param {string} id goal id
 * @param {object|null} record growth record (journey/ui/growth.js recordFor): first, revision, independent
 * @param {object|null} mission the mission's saved state (steps with help arrays and stages)
 */
export function goalEvidence(id, record, mission) {
  const lines = [];
  const feature = FEATURE_OF[id];
  if (feature) {
    const first = record?.first?.features?.[feature];
    const own = record?.independent?.features?.[feature];
    const [en, es] = FEATURE_LABEL[feature];
    if (Number.isFinite(first))
      lines.push([
        `${en} in my first response: ${first}`,
        `${es} en mi primera respuesta: ${first}`,
      ]);
    if (Number.isFinite(own))
      lines.push([
        `${en} when I worked on my own: ${own}`,
        `${es} cuando trabajé por mi cuenta: ${own}`,
      ]);
  }
  if (id === "clearer") {
    const rev = record?.revision;
    if (rev?.changed === false)
      lines.push(["I kept my first response as it was.", "Dejé mi primera respuesta como estaba."]);
    else if (Array.isArray(rev?.observable))
      lines.push([
        `Changes I made when I revised: ${rev.observable.length}`,
        `Cambios que hice al revisar: ${rev.observable.length}`,
      ]);
  }
  if (id === "own") {
    const steps = Object.values(mission?.steps || {});
    const helped = steps.filter((s) => Array.isArray(s?.help) && s.help.length).length;
    lines.push([
      `Steps where I opened help: ${helped} of 6`,
      `Pasos en los que abrí ayuda: ${helped} de 6`,
    ]);
    const show = mission?.steps?.show;
    if (show?.status === "done")
      lines.push(
        show.stage === "independent"
          ? ["Show step: done on my own", "Paso Muestra: hecho por mi cuenta"]
          : ["Show step: done with support", "Paso Muestra: hecho con apoyo"],
      );
  }
  if (!lines.length)
    lines.push([
      "The lab has no counts for this goal yet. Think about your work and decide.",
      "El laboratorio aún no tiene conteos para esta meta. Piensa en tu trabajo y decide.",
    ]);
  return lines;
}

/** Before the mission: pick one goal or skip. Shown until the learner does one of the two. */
export function goalPickerHTML(I, klu) {
  return html`<section class="panel jr-goalpick" aria-labelledby="jrGoalPick">
    <h2 id="jrGoalPick">
      ${icon("flag")} ${I.T("Pick a goal for this mission", "Elige una meta para esta misión")}
    </h2>
    <p class="fine">
      ${I.T("Choose one thing to try. You can skip this. It is your own goal, not a score.", "Elige una cosa para intentar. Puedes saltar esto. Es tu propia meta, no un puntaje.")}
    </p>
    <div class="jr-goal-options" role="group" aria-label="${I.S("Goals", "Metas")}">
      ${goalOptions(klu).map((id) => html`<button type="button" class="btn" data-jr-goal="${id}">${I.T(...GOALS[id].label)}</button>`)}
      <button type="button" class="btn ghost" data-jr-goal-skip>${I.T("Skip", "Saltar")}</button>
    </div>
  </section>`;
}

/** Under "My goal" in the header once a personal goal is chosen. */
export const personalGoalHTML = (I, goal) =>
  goal?.id
    ? html`<p class="jr-goal jr-goal-mine">
        <strong>${I.T("My personal goal", "Mi meta personal")}</strong>
        ${I.T(...GOALS[goal.id].label)}
      </p>`
    : "";

/** After the Show step: "Did you meet your goal?" with the evidence and Yes / Partly / Not yet. */
export function goalReflectHTML(I, goal, record, mission) {
  if (!goal?.id) return "";
  return html`<section class="jr-goalcheck" aria-labelledby="jrGoalCheck">
    <h3 id="jrGoalCheck">${I.T("Did you meet your goal?", "¿Cumpliste tu meta?")}</h3>
    <p><strong>${I.T(...GOALS[goal.id].label)}</strong></p>
    <ul class="jr-goal-evidence">
      ${goalEvidence(goal.id, record, mission).map((l) => html`<li>${I.T(...l)}</li>`)}
    </ul>
    <div
      class="jr-goal-options"
      role="group"
      aria-label="${I.S("Did you meet your goal?", "¿Cumpliste tu meta?")}"
    >
      ${MET.map((m) => html`<button type="button" class="btn small" data-jr-goal-met="${m}" aria-pressed="${String(goal.met === m)}">${I.T(...MET_LABEL[m])}</button>`)}
    </div>
    <p class="fine" role="status">
      ${goal.met ? I.T("Saved with this mission.", "Guardado con esta misión.") : I.T("Your answer is saved with this mission. It is not a score.", "Tu respuesta se guarda con esta misión. No es un puntaje.")}
    </p>
  </section>`;
}
