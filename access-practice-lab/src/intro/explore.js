// Try It. Adapt It. Use It. (/start/explore): a calm 20-minute exploration in five phases. The timing is advice, never a
// countdown: teachers move freely with the step links. Choice, notes and plan are saved on this device only.
import { html, icon } from "../util.js";
import {
  ACTIVITIES, EXPLORE_SEQUENCE, NEXT_STEP_FIELDS, PATHWAYS, PLANNING_PROMPTS, REHEARSAL_FRAME, ROUTES, SUPPLEMENTAL, activitiesFor,
} from "./data.js";
import { PLAN_SAMPLES, REHEARSE_MODES } from "./explore-data.js";
import { withReturn } from "./return-bar.js";
import { previewHTML } from "./preview.js";
import { SAVED_NOTE, clearIntro, loadIntro, updateIntro } from "./state.js";
import { progressHTML, stepRailHTML, teacherBand } from "./shell.js";
import { activityHref, copyWithNote, findActivity, labHref, supportsHTML } from "./ui.js";

const exploreHref = (n, focus) => `${labHref(ROUTES.explore)}?stop=${n + 1}${focus ? `&focus=${focus}` : ""}`;
const LAST = EXPLORE_SEQUENCE.length - 1;
let confirmClear = false;

const saved = () => loadIntro().explore || {};
const save = (patch) => updateIntro("explore", (x) => ({ ...x, ...patch }));
const savePlan = (id, v) => updateIntro("explore", (x) => ({ ...x, plan: { ...(x.plan || {}), [id]: v } }));
const saveIn = (group, id, v) => updateIntro("explore", (x) => ({ ...x, [group]: { ...(x[group] || {}), [id]: v } }));

function phaseOf(route, ex) {
  const asked = Number.parseInt(route.stop, 10);
  const n = Number.isFinite(asked) ? asked - 1 : ex.phase;
  return Math.min(LAST, Math.max(0, Number.isInteger(n) ? n : 0));
}

/** The activity a teacher is planning around: their choice, else the first of the chosen pathway. */
function planAround(ex) {
  const chosen = findActivity(ex.activity);
  if (chosen && ACTIVITIES.includes(chosen)) return chosen;
  return activitiesFor(ex.focus || "speaking")[0];
}

function focusPhase(ex) {
  return html`<fieldset class="in-focus">
    <legend class="visually-hidden">Choose one focus</legend>
    ${PATHWAYS.map(
      (p) => html`<button type="button" class="in-focus-btn pw-${p.id}" data-explore-focus="${p.id}" aria-pressed="${ex.focus === p.id}">
        <span class="in-ic" aria-hidden="true">${icon(p.icon)}</span><strong>${p.name}</strong><span>${p.blurb}</span>
        ${ex.focus === p.id ? html`<span class="in-chosen">${icon("check")} Chosen</span>` : ""}
      </button>`,
    )}
  </fieldset>`;
}

function tryPhase(ex) {
  const focus = ex.focus;
  if (!focus) return html`<p class="in-note">Choose a focus first. <a href="${exploreHref(0)}">Go to Choose one focus</a>.</p>`;
  const other = PATHWAYS.find((p) => p.id !== focus);
  return html`<div class="in-switch"><p>Showing <strong>${PATHWAYS.find((p) => p.id === focus).name}</strong>. <a href="${exploreHref(1, other.id)}" data-explore-switch="${other.id}">Switch to ${other.name}</a></p></div>
    ${activitiesFor(focus).map(
      (a) => html`<article class="in-act pw-${a.pathway}" aria-labelledby="ex-${a.id}">
        <h3 id="ex-${a.id}"><span class="in-ic" aria-hidden="true">${icon(a.icon)}</span>${a.name}</h3>
        <p class="in-where">${a.where} · about ${a.time}</p>
        <p><strong>What students do:</strong> ${a.does}</p>
        <p class="in-try"><strong>Try this now:</strong> ${a.tryNow}</p>
        <p><strong>Classroom use:</strong> ${a.classroomUse}</p>
        <a class="btn btn-primary" href="${activityHref(a, "explore")}">Open ${a.name}${icon("arrow-right")}</a>
        ${previewHTML(a)}
        <details class="in-more"><summary>Supports in this activity</summary>${supportsHTML(a)}</details>
        <label class="in-opt in-tried"><input type="checkbox" data-explore-tried="${a.id}" ${ex.tried?.[a.id] ? "checked" : ""} /><span>I tried this</span></label>
        <label class="in-opt in-tried"><input type="checkbox" data-explore-support="${a.id}" ${ex.supportTried?.[a.id] ? "checked" : ""} /><span>I tried one support</span></label>
      </article>`,
    )}`;
}

function planField(p, ex, a) {
  const val = ex.plan?.[p.id] ?? "";
  return html`<div class="in-field"><label for="plan-${p.id}">${p.label}</label>
    <textarea id="plan-${p.id}" rows="2" data-explore-plan="${p.id}" placeholder="${PLAN_SAMPLES[a.id][p.id]}">${val}</textarea></div>`;
}

function adaptPhase(ex) {
  const a = planAround(ex);
  return html`<fieldset class="in-field in-around"><legend>I am planning around</legend>
      ${ACTIVITIES.map((x) => html`<label class="in-opt"><input type="radio" name="around" value="${x.id}" data-explore-around ${x.id === a.id ? "checked" : ""} /><span>${x.name}</span></label>`)}
    </fieldset>
    <div class="in-card-plan"><h3>Planning card</h3>
      ${PLANNING_PROMPTS.map((p) => planField(p, ex, a))}
      <button type="button" class="btn ghost" data-explore-sample>Fill empty boxes with a sample</button>
    </div>`;
}

function framePieces(ex) {
  const f = ex.frame || {};
  const parts = REHEARSAL_FRAME.split("___");
  return html`<p class="in-frame">${parts.map((t, i) => html`${t}${i < parts.length - 1 ? html`<input class="in-blank" aria-label="Blank ${i + 1} of ${parts.length - 1}" data-explore-frame="${i}" value="${f[i] ?? ""}" />` : ""}`)}</p>`;
}

function rehearsePhase(ex) {
  const mode = REHEARSE_MODES.find((m) => m.id === ex.mode) || REHEARSE_MODES[0];
  return html`<fieldset class="in-field"><legend>Choose how to rehearse</legend>
      ${REHEARSE_MODES.map((m) => html`<label class="in-opt"><input type="radio" name="mode" value="${m.id}" data-explore-mode ${m.id === mode.id ? "checked" : ""} /><span>${m.label}</span></label>`)}
    </fieldset>
    <ol class="in-steps-list">${mode.steps.map((s) => html`<li>${s}</li>`)}</ol>
    <h3>Your planning frame</h3>${framePieces(ex)}`;
}

function nextPhase(ex) {
  const n = ex.next || {};
  const pick = ex.next?.activity || planAround(ex).id;
  return html`<div class="in-card-plan"><h3>Your next step</h3>
      <fieldset class="in-field"><legend>${NEXT_STEP_FIELDS[0].label}</legend>
        ${ACTIVITIES.map((x) => html`<label class="in-opt"><input type="radio" name="nextActivity" value="${x.id}" data-explore-next="activity" ${x.id === pick ? "checked" : ""} /><span>${x.name}</span></label>`)}
      </fieldset>
      ${NEXT_STEP_FIELDS.slice(1).map((f) => html`<div class="in-field"><label for="next-${f.id}">${f.label}</label><input id="next-${f.id}" type="text" data-explore-next="${f.id}" value="${n[f.id] ?? ""}" /></div>`)}
    </div>
    <section class="in-plan-sheet" aria-labelledby="planSheet"><h3 id="planSheet">Your plan</h3><pre class="in-plan-text" data-explore-plan-text>${planText(ex)}</pre></section>
    <p class="in-actions"><button type="button" class="btn" data-explore-copy>${icon("copy")}Copy my plan</button> <button type="button" class="btn" data-explore-print>${icon("print")}Print my plan</button> <a class="btn btn-primary" href="${labHref(ROUTES.guide)}">Open the Quick Guide${icon("arrow-right")}</a></p>
    <p class="fine" role="status" data-explore-note></p>`;
}

/** The plan as plain text, from the saved fields only (nothing invented). */
export function planText(ex) {
  const a = planAround(ex);
  const n = ex.next || {};
  const pick = findActivity(n.activity) || a;
  const lines = [`Activity: ${pick.name} (${pick.where})`];
  for (const f of NEXT_STEP_FIELDS.slice(1)) if (n[f.id]) lines.push(`${f.label}: ${n[f.id]}`);
  for (const p of PLANNING_PROMPTS) if (ex.plan?.[p.id]) lines.push(`${p.label} ${ex.plan[p.id]}`);
  const frame = ex.frame || {};
  if (Object.keys(frame).some((k) => frame[k])) {
    let i = 0;
    lines.push(REHEARSAL_FRAME.replace(/___/g, () => frame[i++] || "___"));
  }
  lines.push("", `Link: ${labHref(pick.route)}`);
  return lines.join("\n");
}

const PHASES = [focusPhase, tryPhase, adaptPhase, rehearsePhase, nextPhase];

export async function render(ctx) {
  let ex = saved();
  if (ctx.route.focus && PATHWAYS.some((p) => p.id === ctx.route.focus) && ctx.route.focus !== ex.focus) ex = save({ focus: ctx.route.focus });
  const n = phaseOf(ctx.route, ex);
  if (n !== ex.phase) ex = save({ phase: n });
  const seq = EXPLORE_SEQUENCE[n];
  return {
    title: "Try It. Adapt It. Use It.",
    html: html`<article class="in-page in-explore" aria-labelledby="introTitle">
        ${teacherBand({
          active: "explore",
          eyebrow: "20-minute exploration",
          title: "Try It. Adapt It. Use It.",
          lead: `${seq.name}: ${seq.detail}`,
          meta: progressHTML(n, EXPLORE_SEQUENCE.length, `Step ${n + 1} of ${EXPLORE_SEQUENCE.length} · Minutes ${seq.range}`),
        })}
        <div class="ts-layout">
          ${stepRailHTML({
            label: "Exploration steps",
            steps: EXPLORE_SEQUENCE.map((s) => ({ ...s, detail: `Minutes ${s.range}` })),
            current: n,
            hrefFor: (i) => exploreHref(i),
            doneFor: (_s, i) => i < n,
          })}
          <div class="ts-main">
        <section class="in-panel" aria-labelledby="exPhase"><h2 id="exPhase">${seq.name}</h2>${PHASES[n](ex)}</section>
        <p class="in-note fine">Timing is advice. Move on when you are ready, or go back to any step.</p>
        <nav class="in-nav ts-actions" aria-label="Exploration controls">
          ${n > 0 ? html`<a class="btn" href="${exploreHref(n - 1)}">${icon("arrow-left")}Back</a>` : html`<span></span>`}
          <a class="btn ghost" href="${labHref(ROUTES.start)}">Exit</a>
          ${n < LAST ? html`<a class="btn btn-primary" href="${exploreHref(n + 1)}">Next: ${EXPLORE_SEQUENCE[n + 1].name}${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${labHref(ROUTES.start)}">Done${icon("check")}</a>`}
        </nav>
        <details class="in-later"><summary>Explore Later</summary>
          <ul>${SUPPLEMENTAL.map((s) => html`<li><a href="${withReturn(labHref(s.route), "explore")}">${s.name}</a> <span class="fine">· ${s.where} · ${s.time}</span><br />${s.does} ${s.supports}</li>`)}</ul>
        </details>
        <footer class="in-foot"><p class="fine">${SAVED_NOTE}</p>
          ${confirmClear ? html`<p role="alert" class="fine">This clears your exploration choices and plan on this device.</p><button type="button" class="btn small" data-explore-clear="yes">Yes, clear them</button> <button type="button" class="btn ghost small" data-explore-clear="no">Keep them</button>` : html`<button type="button" class="btn ghost small" data-explore-clear="ask">Start the exploration over</button>`}
        </footer>
          </div>
        </div>
      </article>`,
  };
}

const refreshPlan = () => {
  const out = document.querySelector("[data-explore-plan-text]");
  if (out) out.textContent = planText(saved());
};

export function onInput(e) {
  const t = e.target;
  if (t.dataset?.explorePlan) savePlan(t.dataset.explorePlan, t.value);
  else if (t.dataset?.exploreFrame !== undefined) saveIn("frame", t.dataset.exploreFrame, t.value);
  else if (t.dataset?.exploreNext && t.type === "text") saveIn("next", t.dataset.exploreNext, t.value);
  else return;
  refreshPlan();
}

export function onChange(e, ctx) {
  const t = e.target;
  if (t.dataset?.exploreTried) saveIn("tried", t.dataset.exploreTried, t.checked);
  else if (t.dataset?.exploreSupport) saveIn("supportTried", t.dataset.exploreSupport, t.checked);
  else if (t.dataset?.exploreAround !== undefined) {
    save({ activity: t.value });
    ctx.rerender();
  } else if (t.dataset?.exploreMode !== undefined) {
    save({ mode: t.value });
    ctx.rerender();
  } else if (t.dataset?.exploreNext === "activity") {
    saveIn("next", "activity", t.value);
    refreshPlan();
  }
}

export function onClick(e, ctx) {
  const el = (s) => e.target.closest?.(s);
  const focus = el("[data-explore-focus]");
  if (focus) {
    save({ focus: focus.dataset.exploreFocus });
    ctx.rerender();
    return true;
  }
  if (el("[data-explore-sample]")) {
    const a = planAround(saved());
    for (const p of PLANNING_PROMPTS) if (!saved().plan?.[p.id]) savePlan(p.id, PLAN_SAMPLES[a.id][p.id]);
    ctx.rerender();
    return true;
  }
  const clear = el("[data-explore-clear]");
  if (clear) {
    const mode = clear.dataset.exploreClear;
    confirmClear = mode === "ask";
    if (mode === "yes") {
      clearIntro("explore");
      ctx.navigate(exploreHref(0), { replace: true });
    } else ctx.rerender();
    return true;
  }
  if (el("[data-explore-copy]")) {
    copyWithNote(planText(saved()), document.querySelector("[data-explore-note]"));
    return true;
  }
  if (el("[data-explore-print]")) {
    window.print();
    return true;
  }
  return false;
}

export const unmount = () => {
  confirmClear = false;
};
