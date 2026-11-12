// Teacher tour (/start/tour): learn the lab by using it, in four parts.
//   1. Choose a goal      "What would you like to do with your students?" (Show me how it works is the recommended path)
//   2. Try an activity    a real activity in a frame; the coach (coach/coach.js) points at one control at a time and
//                         moves on when the teacher does the real thing: answer, check, read the feedback, try again
//   3. Prepare practice   choose a skill, then how much help; a live preview of exactly what students will get
//   4. Take it to class   the student link, a QR code, a printable card and one recommended next action
// Place and choices live in the URL (?part=&goal=&grades=&skill=&support=) and on this device (state.js "guided"),
// so Back, a reload or a shared link keeps them. Nothing here is ever forced on a visitor: the home page offers it.
import { createCoach, activityFrame } from "../coach/coach.js";
import { loopSteps } from "../coach/activity-steps.js";
import { loadIndex } from "../content.js";
import { BASE, html, icon } from "../util.js";
import { pickName, teacherPick, savePick, pickById, TEACHER_PICKS } from "./band.js";
import { clearIntro, loadIntro, SAVED_NOTE, updateIntro } from "./state.js";
import { BAND_TOUR, DOMAINS } from "./tour-bands.js";
import {
  activityRoute,
  chooseActivity,
  GOALS,
  goalOf,
  PARTS,
  PREVIEW_SAY,
  SKILL_PLAIN,
  skillOf,
  SUPPORT_NOTE,
  SUPPORT_PLAIN,
  supportOptions,
  TEACHER_SAY,
  tryDomain,
} from "./tour-data.js";
import { classroomHTML, onClassroomClick } from "./tour-finish.js";
import { helpHTML } from "./tour-help.js";

const COPY = {
  next: "Next",
  back: "Back",
  skip: "Skip this step",
  finish: "Next part",
  tryMyself: "Try it myself",
  showMe: "Show me how",
  stepOf: (a, b) => `Step ${a} of ${b}`,
  missing: "That part is not on screen right now. Press Next to keep going.",
  awayTitle: "You left the example",
  away: "You opened another page inside the example. Bring it back to keep going.",
  bringBack: "Bring the example back",
  why: "Why this matters",
  done: "Done.",
  doIt: "Do it in the activity. The guide moves on by itself.",
};

let coach = null;
let view = null; // what the last render decided: { part, pick, goal, activity, preview }

const saved = () => loadIntro().guided || {};
/** The tour's own address fields from the lab route (main.js parseRoute), as search params. */
const params = (route = {}) => {
  const q = new URLSearchParams();
  for (const k of ["part", "goal", "skill", "support", "stop"]) if (route[k]) q.set(k, route[k]);
  return q;
};

/** The address of a part, carrying every choice made so far. */
export function partHref(n, s) {
  const q = new URLSearchParams();
  q.set("part", String(n));
  if (s.goal) q.set("goal", s.goal);
  if (s.pick) q.set("grades", s.pick);
  if (s.skill) q.set("skill", s.skill);
  if (s.support) q.set("support", s.support);
  return `${BASE}/start/tour?${q}`;
}

/** Choices for this render: the address first, then this device, then the defaults. Old ?stop= links still land. */
function readState(ctx) {
  const q = params(ctx.route);
  const keep = saved();
  const legacy = Number.parseInt(q.get("stop") || "", 10);
  const asked = Number.parseInt(q.get("part") || "", 10);
  const fromLegacy = Number.isFinite(legacy) ? (legacy <= 1 ? 1 : legacy >= 6 ? 4 : 2) : 0;
  const resume = !q.has("part") && !fromLegacy && keep.part > 1;
  const part = [1, 2, 3, 4].includes(asked) ? asked : fromLegacy || (resume ? keep.part : 1);
  const pick = teacherPick(ctx);
  const goal = goalOf(q.get("goal") || keep.goal).id;
  const skill = skillOf(q.get("skill") || (q.has("part") ? "" : keep.skill || ""));
  const support = /^[ABC]$/.test(q.get("support") || "")
    ? q.get("support")
    : q.has("part")
      ? ""
      : keep.support || "";
  return { part, pick, goal, skill: skill || "", support: skill ? support : "", resume };
}

function remember(s) {
  updateIntro("guided", (g) => ({
    ...g,
    part: s.part,
    goal: s.goal,
    pick: s.pick,
    skill: s.skill,
    support: s.support,
    done: g.done || s.part === 4,
  }));
}

/** The four parts across the top: where am I, what is next. Parts already passed are links back. */
function progressHTML(s) {
  return html`<nav class="gt-progress" aria-label="Teacher tour progress">
    <ol>
      ${PARTS.map((p) => {
        const state = p.n < s.part ? "is-done" : p.n === s.part ? "is-now" : "";
        const label = html`<span class="gt-progress-n" aria-hidden="true"
            >${p.n < s.part ? icon("check") : p.n}</span
          ><span class="gt-progress-name">${p.name}</span>`;
        return html`<li class="${state}" ${p.n === s.part ? html`aria-current="step"` : ""}>
          ${
            p.n < s.part
              ? html`<a href="${partHref(p.n, s)}"
                  >${label}<span class="visually-hidden"> (done)</span></a
                >`
              : html`<span>${label}</span>`
          }
        </li>`;
      })}
    </ol>
  </nav>`;
}

function topHTML(s) {
  return html`<header class="gt-top">
    <p class="gt-eyebrow">${icon("teacher")}Teacher tour · Part ${s.part} of ${PARTS.length}</p>
    <a class="gt-exit" href="${BASE}/?grades=${s.pick}">${icon("close")}Exit tour</a>
    ${progressHTML(s)}
  </header>`;
}

/** Five small grade buttons. Changing grades keeps the part and every other choice. */
function gradesHTML(pick) {
  return html`<div class="gt-grades" role="group" aria-labelledby="gtGradesLabel">
    <span id="gtGradesLabel" class="gt-grades-label">Grades</span>
    ${TEACHER_PICKS.map(
      (p) =>
        html`<button
          type="button"
          class="gt-seg"
          data-gt-grades="${p.id}"
          aria-pressed="${String(p.id === pick)}"
        >
          <span aria-hidden="true">${p.short[0]}</span
          ><span class="visually-hidden">${p.name[0]}</span>
        </button>`,
    )}
  </div>`;
}

/* ── Part 1 ── */
function goalHTML(s) {
  const [first, ...rest] = GOALS;
  const card = (g, big) =>
    html`<li>
      <a
        class="gt-goal${big ? " is-recommended" : ""}"
        href="${partHref(2, { ...s, goal: g.id })}"
        data-gt-goal="${g.id}"
      >
        <span class="gt-goal-ic" aria-hidden="true">${icon(g.icon)}</span>
        <span class="gt-goal-text">
          ${big ? html`<span class="gt-badge">Recommended if you are new</span>` : ""}
          <strong>${g.name}</strong><span>${g.detail}</span>
        </span>
        <span class="gt-goal-go" aria-hidden="true">${icon("arrow-right")}</span>
      </a>
    </li>`;
  return html`<section class="gt-part gt-part-goal" aria-labelledby="gtTitle">
    <h1 id="gtTitle" tabindex="-1">What would you like to do with your students?</h1>
    <p class="gt-lead">
      Choose one. You will use the real lab the whole way. No account, nothing to install.
    </p>
    ${
      saved().done
        ? html`<p class="gt-back-note">
            ${icon("check")}You have finished the tour before.
            <a href="${BASE}/explore/practice?grades=${s.pick}">Go straight to the activities</a>.
          </p>`
        : ""
    }
    <ul class="gt-goals gt-goals-first">
      ${card(first, true)}
    </ul>
    <h2 class="gt-or">Or start with what you need</h2>
    <ul class="gt-goals">
      ${rest.map((g) => card(g, false))}
    </ul>
  </section>`;
}

/* ── Part 2 ── */
const LEADS = {
  show: "Do it the way a student would. The guide beside the activity shows one thing at a time.",
  find: "First, see what an activity is like from the inside. Then you will choose one for your class.",
  share: "First, try what students will get. Then you will set one up and share it.",
  understand:
    "Watch for the feedback, how sure students say they are, and how they revise. That is the work you will read.",
};

function stageHTML(src, path, title, label) {
  return html`<div
    class="gt-stage"
    data-gt-stage
    data-src="${src}"
    data-path="${path}"
    data-title="${title}"
  >
    <div class="gt-frame-slot" data-gt-frame>
      <p class="gt-loading" role="status">${icon("clock")}Opening the activity…</p>
    </div>
    <div class="gt-coach" data-coach-slot aria-label="${label}"></div>
  </div>`;
}

function tryHTML(s) {
  const a = BAND_TOUR[s.pick]?.[tryDomain(s.pick)];
  const route = activityRoute({ ...a, pick: s.pick }, { frame: "1" });
  const path = a.route.split("?")[0];
  return html`<section class="gt-part gt-part-try" aria-labelledby="gtTitle">
    <div class="gt-head-row">
      <div>
        <h1 id="gtTitle" tabindex="-1">Try this activity as a student would</h1>
        <p class="gt-lead">${LEADS[s.goal]}</p>
      </div>
      ${gradesHTML(s.pick)}
    </div>
    <p class="gt-activity-line">
      ${icon(DOMAINS.find((d) => d.id === tryDomain(s.pick)).icon)}<strong>${a.title}</strong>
      <span>${pickName(s.pick)} · ${a.level} · about ${a.minutes} min</span>
    </p>
    ${stageHTML(`${BASE}${route}`, `${BASE}${path}`, `Live activity: ${a.title}`, "Tour guide")}
  </section>`;
}

/* ── Part 3 ── */
function skillsHTML(s) {
  return html`<fieldset class="gt-choice-set">
    <legend><span class="gt-n">1</span>Which skill will students practice?</legend>
    <div class="gt-skill-grid">
      ${DOMAINS.map(
        (d) =>
          html`<button
            type="button"
            class="gt-skill ${d.cls}"
            data-gt-skill="${d.id}"
            aria-pressed="${String(d.id === s.skill)}"
          >
            <span class="gt-skill-ic" aria-hidden="true">${icon(d.icon)}</span>
            <strong>${d.name}</strong><span>${SKILL_PLAIN[d.id]}</span>
          </button>`,
      )}
    </div>
  </fieldset>`;
}

function supportsHTML(s, options) {
  if (!s.skill) return "";
  return html`<fieldset class="gt-choice-set">
    <legend><span class="gt-n">2</span>How much help do they need?</legend>
    <div class="gt-support-grid">
      ${options.map(
        (o) =>
          html`<button
            type="button"
            class="gt-support"
            data-gt-support="${o.level}"
            aria-pressed="${String(o.level === s.support)}"
          >
            <strong>${o.name}</strong><span>${SUPPORT_PLAIN[o.level]}</span>
          </button>`,
      )}
    </div>
    <p class="gt-note">${icon("info")}<span>${SUPPORT_NOTE}</span></p>
  </fieldset>`;
}

function previewHTML(s, a) {
  if (!a) return "";
  const route = activityRoute(a, { frame: "1" });
  return html`<section class="gt-preview" aria-labelledby="gtPreviewTitle">
    <h2 id="gtPreviewTitle"><span class="gt-n">3</span>This is what students will get</h2>
    <p class="gt-activity-line">
      ${icon(a.domain.icon)}<strong>${a.title}</strong>
      <span>${a.domain.name} · ${a.support} · ${pickName(s.pick)} · about ${a.minutes} min</span>
    </p>
    ${stageHTML(`${BASE}${route}`, `${BASE}${a.route}`, `Student preview: ${a.title}`, "Preview guide")}
    <div class="gt-actions">
      <a class="btn btn-primary btn-big" href="${partHref(4, s)}" data-gt-use
        >Use this activity${icon("arrow-right")}</a
      >
      <p class="fine">You can change the skill or the help above. Your place stays here.</p>
    </div>
  </section>`;
}

function prepareHTML(s, index) {
  const options = index ? supportOptions(index, s.pick, s.skill) : [];
  const a =
    index && s.skill && s.support ? chooseActivity(index, s.pick, s.skill, s.support) : null;
  view.activity = a;
  return html`<section class="gt-part gt-part-prepare" aria-labelledby="gtTitle">
    <div class="gt-head-row">
      <div>
        <h1 id="gtTitle" tabindex="-1">Prepare student practice</h1>
        <p class="gt-lead">
          Choose a skill, then how much help students get. You will see exactly what they will see.
        </p>
      </div>
      ${gradesHTML(s.pick)}
    </div>
    ${
      index
        ? html`${skillsHTML(s)}${supportsHTML(s, options)}${previewHTML(s, a)}`
        : html`<p class="gt-note is-alert" role="alert">
            ${icon("alert")}<span
              >The activity list did not load. Check the connection and
              <a href="${BASE}/start/tour">try again</a>.</span
            >
          </p>`
    }
  </section>`;
}

/* ── Footer: Back / next part ── */
function navHTML(s) {
  const back =
    s.part > 1
      ? html`<a class="btn ghost" href="${partHref(s.part - 1, s)}">${icon("arrow-left")}Back</a>`
      : html`<span></span>`;
  const next =
    s.part === 2
      ? html`<a class="btn" href="${partHref(3, s)}"
          >Skip to preparing practice${icon("arrow-right")}</a
        >`
      : "";
  return html`<nav class="gt-nav" aria-label="Tour controls">${back}${next}</nav>`;
}

export async function render(ctx) {
  const s = readState(ctx);
  view = { ...s, activity: null };
  remember(s);
  let body;
  if (s.part === 1) body = goalHTML(s);
  else if (s.part === 2) body = tryHTML(s);
  else {
    const index = await loadIndex().catch(() => null);
    if (s.part === 3) body = prepareHTML(s, index);
    else {
      const skill = s.skill || tryDomain(s.pick);
      const level = s.support || "A";
      view.activity = index ? chooseActivity(index, s.pick, skill, level) : null;
      body = classroomHTML({ ...s, skill, support: level }, view.activity);
    }
  }
  return {
    title: `Teacher tour: ${PARTS[s.part - 1].name}`,
    html: html`<article class="gt-page" aria-labelledby="gtTitle">
      ${topHTML(s)}
      ${
        s.resume
          ? html`<p class="gt-back-note" role="status">
              ${icon("bookmark")}You are back where you stopped.
              <a href="${partHref(1, s)}">Start from the beginning</a>.
            </p>`
          : ""
      }
      ${body} ${s.part > 1 ? navHTML(s) : ""} ${helpHTML({ restart: true })}
      <p class="fine gt-saved">${SAVED_NOTE}</p>
    </article>`,
  };
}

/** Open the live activity in each stage on the page and start its coach. */
export function mount(root, ctx) {
  coach?.destroy();
  coach = null;
  const stage =
    root.querySelector?.("[data-gt-stage]") || document.querySelector("[data-gt-stage]");
  if (!stage || !view) return;
  const frame = activityFrame(stage.dataset.src, stage.dataset.title);
  const slot = stage.querySelector("[data-gt-frame]");
  frame.addEventListener("load", () => slot.querySelector(".gt-loading")?.remove(), { once: true });
  slot.append(frame);
  const path = stage.dataset.path;
  const isHome = (win) => {
    try {
      return win.location.pathname === path || win.location.href === "about:blank";
    } catch {
      return true;
    }
  };
  const steps = view.part === 2 ? loopSteps(TEACHER_SAY) : previewSteps(view.activity);
  coach = createCoach({
    stage,
    frame,
    steps,
    copy: COPY,
    isHome,
    onFinish: () => {
      const s = view;
      ctx.navigate(s.part === 2 ? partHref(3, s) : partHref(4, s));
    },
  });
}

/** Part 3's preview: what makes this skill different, then the button to use it. */
function previewSteps(a) {
  const say = PREVIEW_SAY[a?.domain.id] || PREVIEW_SAY.reading;
  const target = {
    speaking: ["[data-rec-start]", "[data-early-done]", "[data-early-model]"],
    writing: ["textarea", "[data-check-writing]", "[data-early-print]", "[data-early-done]"],
    listening: ["[data-early-replay]", ".directions", ".stimulus"],
    reading: [".stimulus", ".early-sentence", ".directions"],
  }[a?.domain.id] || [".directions"];
  return [
    { id: "what", target, title: say.title, body: say.body, fallback: say.body },
    {
      id: "use",
      target: null,
      title: "Ready when you are",
      body: "Change the skill or the help above to see another activity, or use this one with your class.",
      primary: "Use this activity",
    },
  ];
}

export function unmount() {
  coach?.destroy();
  coach = null;
}

/** Keep the page where it is when a choice re-renders it, and put focus back on the pressed button. */
function rerenderKeeping(ctx, selector) {
  const y = window.scrollY;
  Promise.resolve(ctx.rerender()).then(() => {
    window.scrollTo({ top: y });
    document.querySelector(selector)?.focus({ preventScroll: true });
  });
}

function setParam(name, value) {
  const url = new URL(location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  url.searchParams.set("part", String(view?.part || 1));
  history.replaceState(history.state, "", url.pathname + url.search);
}

export function onClick(e, ctx) {
  const t = e.target;
  const grades = t.closest?.("[data-gt-grades]");
  if (grades) {
    const id = grades.dataset.gtGrades;
    if (!pickById(id)) return true;
    savePick(id);
    setParam("grades", id);
    if (view?.part === 3) setParam("support", "");
    rerenderKeeping(ctx, `[data-gt-grades="${id}"]`);
    return true;
  }
  const skill = t.closest?.("[data-gt-skill]");
  if (skill) {
    setParam("skill", skill.dataset.gtSkill);
    setParam("support", "");
    rerenderKeeping(ctx, `[data-gt-skill="${skill.dataset.gtSkill}"]`);
    return true;
  }
  const support = t.closest?.("[data-gt-support]");
  if (support) {
    setParam("support", support.dataset.gtSupport);
    rerenderKeeping(ctx, `[data-gt-support="${support.dataset.gtSupport}"]`);
    return true;
  }
  if (t.closest?.("[data-gt-restart]")) {
    clearIntro("guided");
    ctx.navigate(partHref(1, { pick: view?.pick }), { replace: true });
    return true;
  }
  return onClassroomClick(e, view);
}
