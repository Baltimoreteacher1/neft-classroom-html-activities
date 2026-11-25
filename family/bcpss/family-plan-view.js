// "This week's plan" section of the Family Guide: three short sittings (10 minutes or less each) assembled from the
// unit's own authored family block by shared/bcpss-family-plan.js. English and Spanish always sit side by side here
// (stacked on a phone), every phrase has an on-device read-aloud button, and the section prints on its own.
// Nothing leaves the device: no network call, no account, no data sent anywhere.
import { buildWeeklyPlan } from "../../shared/bcpss-family-plan.js";
import { C } from "./family-copy.js";
import { bi, esc } from "./family-util.js";

const p = (en, es) => ({ en, es });
export const PLAN = {
  head: p("This week's plan", "El plan de esta semana"),
  intro: p(
    "Three short sittings. Each one is 10 minutes or less. Tap the speaker to hear a phrase.",
    "Tres ratos cortos. Cada uno dura 10 minutos o menos. Toquen el altavoz para escuchar una frase.",
  ),
  say: p("Say it", "Díganlo"),
  talk: p("Talk about it", "Conversen sobre esto"),
  home: p("From home:", "De casa:"),
  goal: p("Our goal:", "Nuestra meta:"),
  done: p("We did this", "Lo hicimos"),
  print: p("Print this plan", "Imprimir este plan"),
  part: (n, of) =>
    p(
      `Part ${n} of ${of}: do this on its own day.`,
      `Parte ${n} de ${of}: háganla en su propio día.`,
    ),
  week: (n) => p(`Plan ${n}`, `Plan ${n}`),
};

export const planKey = (unitId, week) => `ewl:family:bcpss:plan:${unitId}:${week}`;

/** Weeks since the Unix epoch: a new plan each week without a calendar, the same number for everyone. */
export const currentWeek = (now = Date.now()) => Math.floor(now / (7 * 24 * 3600 * 1000));

const phrases = (items, opts) =>
  `<ul class="fb-say-list">${items.map((s) => `<li>${bi(s, opts)}</li>`).join("")}</ul>`;

function sittingBody(s) {
  if (s.id === "say-talk") {
    return `<h4 class="fb-subhead">${bi(PLAN.say)}</h4>${phrases(s.say, { blanks: true, speak: C.hear })}
      <h4 class="fb-subhead">${bi(PLAN.talk)}</h4>${phrases(s.talk, { speak: C.hear })}`;
  }
  if (s.id === "celebrate") {
    return `${s.goal?.es ? `<p>${bi(s.goal, { lead: { en: PLAN.goal.en, es: PLAN.goal.es } })}</p>` : ""}
      <div class="fb-celebrate"><span class="fb-celebrate-icon" aria-hidden="true">🎉</span>${bi(s.celebrate)}</div>`;
  }
  const t = s.task;
  const steps = t.steps.en.slice(s.from, s.to).map((en, i) => ({ en, es: t.steps.es[s.from + i] }));
  return `<h4 class="fb-subhead">${bi(t.title)}</h4>
    <p class="fb-need">${bi(t.materials, { lead: { en: PLAN.home.en, es: PLAN.home.es } })}</p>
    ${s.part ? `<p class="fb-intro">${bi(PLAN.part(...s.part))}</p>` : ""}
    <ol class="fb-steps fb-from-${s.from}">${steps.map((x) => `<li>${bi(x)}</li>`).join("")}</ol>`;
}

/** Markup for the section body, or "" when the unit has no plan (nothing passes the safe-and-free screen). */
export function planHtml(guide, week, done = []) {
  const plan = buildWeeklyPlan(guide, week);
  if (!plan) return "";
  const days = plan.sittings
    .map(
      (s, i) => `<li class="fb-plan-day${done.includes(s.id) ? " is-done" : ""}">
        <div class="fb-try-head"><h3>${bi(s.title)}</h3><span class="fb-chip">⏱ ${esc(s.minutes)} min</span></div>
        ${sittingBody(s)}
        <label class="fb-check" for="fbPlan${i}"><input type="checkbox" id="fbPlan${i}" data-plan-day="${esc(s.id)}"${done.includes(s.id) ? " checked" : ""} /><span>${bi(PLAN.done)}</span></label>
      </li>`,
    )
    .join("");
  return `<div class="fb-plan" data-plan-unit="${esc(plan.unitId)}" data-plan-week="${esc(plan.week)}">
    <p class="fb-intro">${bi(PLAN.intro)}</p>
    <ol class="fb-plan-days">${days}</ol>
    <p class="fb-note">${bi(plan.safety)}</p>
    <p class="fb-note">${bi(plan.safety.small)}</p>
    ${plan.draft ? `<p class="fb-note" data-provenance="draft">${bi(plan.notice)}</p>` : ""}
    <div class="fb-actions"><button type="button" class="fb-btn" data-print-plan>${bi(PLAN.print)}</button></div>
  </div>`;
}
