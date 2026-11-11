// Try It. Adapt It. Use It. (/start/explore): a calm 20-minute exploration in five phases, for the teacher's grade
// choice (band.js). The focus is one of the four language domains, and each domain offers that grade's activity
// (explore-bands.js). The timing is advice, never a countdown: teachers move freely with the step links. Choice, notes
// and plan are saved on this device only.
import { html, icon } from "../util.js";
import { bandPickerHTML, onBandClick, teacherPick } from "./band.js";
import {
  NEXT_STEP_FIELDS,
  PLANNING_PROMPTS,
  REHEARSAL_FRAME,
  ROUTES,
  SUPPLEMENTAL,
} from "./data.js";
import { EXPLORE_STEPS, exploreActivities, exploreActivity } from "./explore-bands.js";
import { REHEARSE_MODES } from "./explore-data.js";
import { bindGuide, guideHTML } from "./guide.js";
import { previewHTML } from "./preview.js";
import { DEFAULT_PICK, gradeName } from "./quick-guide-files.js";
import { gradesRoute } from "./quick-guide-model.js";
import { withReturn } from "./return-bar.js";
import { SAVED_NOTE, clearIntro, loadIntro, updateIntro } from "./state.js";
import { progressHTML, stepRailHTML, teacherBand } from "./shell.js";
import { DOMAINS } from "./tour-bands.js";
import { copyWithNote, labHref, supportsHTML } from "./ui.js";

/** A step link. It keeps the grade choice in the address so Back, Next and a shared link stay on that grade. */
const exploreHref = (n, focus, pick) =>
  `${labHref(ROUTES.explore)}?stop=${n + 1}${focus ? `&focus=${focus}` : ""}${pick ? `&grades=${encodeURIComponent(pick)}` : ""}`;
const LAST = EXPLORE_STEPS.length - 1;
const DOMAIN_IDS = DOMAINS.map((d) => d.id);
let confirmClear = false;

const saved = () => loadIntro().explore || {};
const save = (patch) => updateIntro("explore", (x) => ({ ...x, ...patch }));
const savePlan = (id, v) =>
  updateIntro("explore", (x) => ({ ...x, plan: { ...(x.plan || {}), [id]: v } }));
const saveIn = (group, id, v) =>
  updateIntro("explore", (x) => ({ ...x, [group]: { ...(x[group] || {}), [id]: v } }));

function phaseOf(route, ex) {
  const asked = Number.parseInt(route.stop, 10);
  const n = Number.isFinite(asked) ? asked - 1 : ex.phase;
  return Math.min(LAST, Math.max(0, Number.isInteger(n) ? n : 0));
}

/** The activity a teacher is planning around: their choice for this grade, else the chosen domain's activity. */
function planAround(ex, pick) {
  const list = exploreActivities(pick);
  return (
    list.find((a) => a.id === ex.activity) ||
    exploreActivity(pick, DOMAIN_IDS.includes(ex.focus) ? ex.focus : "speaking")
  );
}

function focusPhase(ex) {
  return html`<fieldset class="in-focus">
    <legend class="visually-hidden">Choose one focus</legend>
    ${DOMAINS.map(
      (d) =>
        html`<button
          type="button"
          class="in-focus-btn ${d.cls}"
          data-explore-focus="${d.id}"
          aria-pressed="${String(ex.focus === d.id)}"
        >
          <span class="in-ic" aria-hidden="true">${icon(d.icon)}</span><strong>${d.name}</strong
          ><span>${d.purpose}</span>
          ${ex.focus === d.id ? html`<span class="in-chosen">${icon("check")} Chosen</span>` : ""}
        </button>`,
    )}
  </fieldset>`;
}

/** What a teacher can try: the curated activity's own support list, or the grade activity's supports and notice. */
function supportsFor(a) {
  if (a.curated) return supportsHTML(a.curated);
  return html`<ul>
      ${a.supports.map((s) => html`<li>${s}</li>`)}
    </ul>
    <p class="fine">${a.notice}</p>`;
}

function activityCard(a, ex) {
  return html`<article class="in-act ${a.cls}" aria-labelledby="ex-${a.id}">
    <h3 id="ex-${a.id}"><span class="in-ic" aria-hidden="true">${icon(a.icon)}</span>${a.name}</h3>
    <p class="in-where">${a.domain.name} · ${a.where} · about ${a.time}</p>
    <p><strong>What students do:</strong> ${a.does}</p>
    ${
      a.curated
        ? html`<p class="in-try"><strong>Try this now:</strong> ${a.tryNow}</p>`
        : html`<div class="in-try">
            <p><strong>Try this now:</strong></p>
            <ol>
              ${a.steps.map((s) => html`<li>${s}</li>`)}
            </ol>
          </div>`
    }
    <p><strong>Classroom use:</strong> ${a.classroomUse}</p>
    <a class="btn btn-primary" href="${withReturn(labHref(a.route), "explore")}"
      >Open ${a.name}${icon("arrow-right")}</a
    >
    ${a.curated ? previewHTML(a.curated) : ""}
    <details class="in-more">
      <summary>Supports in this activity</summary>
      ${supportsFor(a)}
    </details>
    <label class="in-opt in-tried"
      ><input
        type="checkbox"
        data-explore-tried="${a.id}"
        ${ex.tried?.[a.id] ? "checked" : ""}
      /><span>I tried this</span></label
    >
    <label class="in-opt in-tried"
      ><input
        type="checkbox"
        data-explore-support="${a.id}"
        ${ex.supportTried?.[a.id] ? "checked" : ""}
      /><span>I tried one support</span></label
    >
  </article>`;
}

function tryPhase(ex, pick) {
  const focus = ex.focus;
  if (!DOMAIN_IDS.includes(focus))
    return html`<p class="in-note">
      Choose a focus first. <a href="${exploreHref(0, "", pick)}">Go to Choose one focus</a>.
    </p>`;
  const others = DOMAINS.filter((d) => d.id !== focus);
  return html`<div class="in-switch">
      <p>
        Showing <strong>${DOMAINS.find((d) => d.id === focus).name}</strong> for ${gradeName(pick)}.
        Switch to
        ${others.map(
          (d, i) =>
            html`${i ? (i === others.length - 1 ? " or " : ", ") : ""}<a
                href="${exploreHref(1, d.id, pick)}"
                data-explore-switch="${d.id}"
                >${d.name}</a
              >`,
        )}.
      </p>
    </div>
    ${activityCard(exploreActivity(pick, focus), ex)}`;
}

function planField(p, ex, a) {
  const val = ex.plan?.[p.id] ?? "";
  return html`<div class="in-field">
    <label for="plan-${p.id}">${p.label}</label>
    <textarea
      id="plan-${p.id}"
      rows="2"
      data-explore-plan="${p.id}"
      placeholder="${a.plan?.[p.id] || ""}"
    >
${val}</textarea>
  </div>`;
}

const activityRadios = (pick, name, checkedId, attr) =>
  exploreActivities(pick).map(
    (x) =>
      html`<label class="in-opt"
        ><input
          type="radio"
          name="${name}"
          value="${x.id}"
          ${attr}
          ${x.id === checkedId ? "checked" : ""}
        /><span>${x.name} <span class="fine">(${x.domain.name})</span></span></label
      >`,
  );

function adaptPhase(ex, pick) {
  const a = planAround(ex, pick);
  return html`<fieldset class="in-field in-around">
      <legend>I am planning around</legend>
      ${activityRadios(pick, "around", a.id, "data-explore-around")}
    </fieldset>
    <div class="in-card-plan">
      <h3>Planning card</h3>
      ${PLANNING_PROMPTS.map((p) => planField(p, ex, a))}
      <button type="button" class="btn ghost" data-explore-sample>
        Fill empty boxes with a sample
      </button>
    </div>`;
}

function framePieces(ex) {
  const f = ex.frame || {};
  const parts = REHEARSAL_FRAME.split("___");
  return html`<p class="in-frame">
    ${parts.map(
      (t, i) =>
        html`${t}${i < parts.length - 1 ? html`<input class="in-blank" aria-label="Blank ${i + 1} of ${parts.length - 1}" data-explore-frame="${i}" value="${f[i] ?? ""}" />` : ""}`,
    )}
  </p>`;
}

function rehearsePhase(ex) {
  const mode = REHEARSE_MODES.find((m) => m.id === ex.mode) || REHEARSE_MODES[0];
  return html`<fieldset class="in-field">
      <legend>Choose how to rehearse</legend>
      ${REHEARSE_MODES.map(
        (m) =>
          html`<label class="in-opt"
            ><input
              type="radio"
              name="mode"
              value="${m.id}"
              data-explore-mode
              ${m.id === mode.id ? "checked" : ""}
            /><span>${m.label}</span></label
          >`,
      )}
    </fieldset>
    <ol class="in-steps-list">
      ${mode.steps.map((s) => html`<li>${s}</li>`)}
    </ol>
    <h3>Your planning frame</h3>
    ${framePieces(ex)}`;
}

function nextPhase(ex, pick) {
  const n = ex.next || {};
  const chosen = planAround({ ...ex, activity: n.activity || ex.activity }, pick);
  return html`<div class="in-card-plan">
      <h3>Your next step</h3>
      <fieldset class="in-field">
        <legend>${NEXT_STEP_FIELDS[0].label}</legend>
        ${activityRadios(pick, "nextActivity", chosen.id, 'data-explore-next="activity"')}
      </fieldset>
      ${NEXT_STEP_FIELDS.slice(1).map(
        (f) =>
          html`<div class="in-field">
            <label for="next-${f.id}">${f.label}</label
            ><input
              id="next-${f.id}"
              type="text"
              data-explore-next="${f.id}"
              value="${n[f.id] ?? ""}"
            />
          </div>`,
      )}
    </div>
    <section class="in-plan-sheet" aria-labelledby="planSheet">
      <h3 id="planSheet">Your plan</h3>
      <pre class="in-plan-text" data-explore-plan-text>${planText(ex, pick)}</pre>
    </section>
    <p class="in-actions">
      <button type="button" class="btn" data-explore-copy>${icon("copy")}Copy my plan</button>
      <button type="button" class="btn" data-explore-print>${icon("print")}Print my plan</button>
      <a class="btn btn-primary" href="${labHref(gradesRoute(ROUTES.guide, pick))}"
        >Open the Quick Guide${icon("arrow-right")}</a
      >
    </p>
    <p class="fine" role="status" data-explore-note></p>`;
}

/** The plan as plain text, from the saved fields only (nothing invented). */
export function planText(ex, pick = DEFAULT_PICK) {
  const n = ex.next || {};
  const a = planAround({ ...ex, activity: n.activity || ex.activity }, pick);
  const lines = [`Activity: ${a.name} (${a.where})`, `Grades: ${gradeName(pick)}`];
  for (const f of NEXT_STEP_FIELDS.slice(1)) if (n[f.id]) lines.push(`${f.label}: ${n[f.id]}`);
  for (const p of PLANNING_PROMPTS) if (ex.plan?.[p.id]) lines.push(`${p.label} ${ex.plan[p.id]}`);
  const frame = ex.frame || {};
  if (Object.keys(frame).some((k) => frame[k])) {
    let i = 0;
    lines.push(REHEARSAL_FRAME.replace(/___/g, () => frame[i++] || "___"));
  }
  lines.push("", `Link: ${labHref(a.route)}`);
  return lines.join("\n");
}

const PHASES = [focusPhase, tryPhase, adaptPhase, rehearsePhase, nextPhase];
const GUIDE_SAY = [
  "Pick the language domain you most want to try first. Every grade has one real activity for each.",
  "Try the activity as a student would, then open one support. Nothing you do here is scored.",
  "Fill in the planning card. The sample button gives you a starting point you can change.",
  "Say your directions aloud once. Short and clear beats complete.",
  "Choose one activity, one class and a day. Copy or print your plan before you go.",
];

function guidePanel(n, pick, focus) {
  return guideHTML({
    say: GUIDE_SAY[n],
    chips: n === 1 ? ["notice", "use", "scored"] : ["time", "scored", "account"],
    context: {
      page: "start",
      step: `Explore: ${EXPLORE_STEPS[n].name}`,
      pick,
      ...(n === 1 && DOMAIN_IDS.includes(focus) ? { domain: focus } : {}),
    },
  });
}

const laterHTML = () =>
  html`<details class="in-later">
    <summary>Explore Later</summary>
    <ul>
      ${SUPPLEMENTAL.map(
        (s) =>
          html`<li>
            <a href="${withReturn(labHref(s.route), "explore")}">${s.name}</a>
            <span class="fine">· ${s.where} · ${s.time}</span><br />${s.does} ${s.supports}
          </li>`,
      )}
    </ul>
  </details>`;

export async function render(ctx) {
  const pick = teacherPick(ctx);
  let ex = saved();
  const asked = ctx.route.focus;
  if (DOMAIN_IDS.includes(asked) && asked !== ex.focus) ex = save({ focus: asked });
  const n = phaseOf(ctx.route, ex);
  if (n !== ex.phase) ex = save({ phase: n });
  const seq = EXPLORE_STEPS[n];
  return {
    title: "Try It. Adapt It. Use It.",
    html: html`<article class="in-page in-explore" aria-labelledby="introTitle">
      ${teacherBand({
        active: "explore",
        eyebrow: `20-minute exploration · ${gradeName(pick)}`,
        title: "Try It. Adapt It. Use It.",
        lead: `${seq.name}: ${seq.detail}`,
        meta: progressHTML(
          n,
          EXPLORE_STEPS.length,
          `Step ${n + 1} of ${EXPLORE_STEPS.length} · Minutes ${seq.range}`,
        ),
      })}
      <div class="ts-layout">
        ${stepRailHTML({
          label: "Exploration steps",
          steps: EXPLORE_STEPS.map((s) => ({ ...s, detail: `Minutes ${s.range}` })),
          current: n,
          hrefFor: (i) => exploreHref(i, "", pick),
          doneFor: (_s, i) => i < n,
        })}
        <div class="ts-main">
          <div class="xp-picker">
            ${bandPickerHTML(pick, {
              hint: "The activities, samples and plan change to match your grades.",
            })}
          </div>
          <section class="in-panel" aria-labelledby="exPhase">
            <h2 id="exPhase">${seq.name}</h2>
            ${PHASES[n](ex, pick)}
          </section>
          <p class="in-note fine">
            Timing is advice. Move on when you are ready, or go back to any step.
          </p>
          <nav class="in-nav ts-actions" aria-label="Exploration controls">
            ${
              n > 0
                ? html`<a class="btn" href="${exploreHref(n - 1, "", pick)}">${icon("arrow-left")}Back</a>`
                : html`<span></span>`
            }
            <a class="btn ghost" href="${labHref(ROUTES.start)}">Exit</a>
            ${
              n < LAST
                ? html`<a class="btn btn-primary" href="${exploreHref(n + 1, "", pick)}"
                    >Next: ${EXPLORE_STEPS[n + 1].name}${icon("arrow-right")}</a
                  >`
                : html`<a class="btn btn-primary" href="${labHref(ROUTES.start)}"
                    >Done${icon("check")}</a
                  >`
            }
          </nav>
          <div class="xp-guide">${guidePanel(n, pick, ex.focus)}</div>
          ${pick === DEFAULT_PICK ? laterHTML() : ""}
          <footer class="in-foot">
            <p class="fine">${SAVED_NOTE}</p>
            ${
              confirmClear
                ? html`<p role="alert" class="fine">
                      This clears your exploration choices and plan on this device.
                    </p>
                    <button type="button" class="btn small" data-explore-clear="yes">
                      Yes, clear them
                    </button>
                    <button type="button" class="btn ghost small" data-explore-clear="no">
                      Keep them
                    </button>`
                : html`<button type="button" class="btn ghost small" data-explore-clear="ask">
                    Start the exploration over
                  </button>`
            }
          </footer>
        </div>
      </div>
    </article>`,
  };
}

const refreshPlan = (ctx) => {
  const out = document.querySelector("[data-explore-plan-text]");
  if (out) out.textContent = planText(saved(), teacherPick(ctx));
};

export const mount = () => bindGuide();

export function onInput(e, ctx) {
  const t = e.target;
  if (t.dataset?.explorePlan) savePlan(t.dataset.explorePlan, t.value);
  else if (t.dataset?.exploreFrame !== undefined) saveIn("frame", t.dataset.exploreFrame, t.value);
  else if (t.dataset?.exploreNext && t.type === "text")
    saveIn("next", t.dataset.exploreNext, t.value);
  else return;
  refreshPlan(ctx);
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
    refreshPlan(ctx);
  }
}

export function onClick(e, ctx) {
  if (onBandClick(e, ctx)) return true;
  const el = (s) => e.target.closest?.(s);
  const focus = el("[data-explore-focus]");
  if (focus) {
    save({ focus: focus.dataset.exploreFocus });
    ctx.rerender();
    return true;
  }
  if (el("[data-explore-sample]")) {
    const a = planAround(saved(), teacherPick(ctx));
    for (const p of PLANNING_PROMPTS)
      if (!saved().plan?.[p.id] && a.plan?.[p.id]) savePlan(p.id, a.plan[p.id]);
    ctx.rerender();
    return true;
  }
  const clear = el("[data-explore-clear]");
  if (clear) {
    const mode = clear.dataset.exploreClear;
    confirmClear = mode === "ask";
    if (mode === "yes") {
      clearIntro("explore");
      ctx.navigate(exploreHref(0, "", teacherPick(ctx)), { replace: true });
    } else ctx.rerender();
    return true;
  }
  if (el("[data-explore-copy]")) {
    copyWithNote(
      planText(saved(), teacherPick(ctx)),
      document.querySelector("[data-explore-note]"),
    );
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
