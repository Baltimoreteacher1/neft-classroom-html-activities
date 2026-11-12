// Teacher Tour (/start/tour): Mr. Neft walks a teacher through the lab by using it, in three parts.
//   1. Pick a skill          the four language domains (Listening, Speaking, Reading, Writing) as large cards
//   2. Try it as a student   the real activity for that skill in a frame; Mr. Neft's guide card points at one control
//                            at a time and moves on when the teacher does the real thing (coach/coach.js)
//   3. Use it with your class  choose the support; the student link, QR code and printable card are right there; then
//                            "You're ready to use this with students." and a map of where students can go next
// Mr. Neft opens every part in a speech bubble (guide.js guideBubbleHTML) and speaks the guide card in Part 2.
// Place and choices live in the URL (?part=&grades=&skill=&support=) and on this device (state.js "guided"), so Back, a
// reload or a shared link keeps them. Nothing here is forced on a visitor: the home page offers it.
import { activityFrame, createCoach } from "../coach/coach.js";
import { stepsFor } from "../coach/activity-steps.js";
import { loadIndex } from "../content.js";
import { ART, BASE, html, icon } from "../util.js";
import { pickById, pickName, savePick, TEACHER_PICKS, teacherPick } from "./band.js";
import { bindGuide, guideBubbleHTML } from "./guide.js";
import { guideArtSVG } from "./guide-art.js";
import { clearIntro, loadIntro, SAVED_NOTE, updateIntro } from "./state.js";
import { DOMAIN_BY_ID, DOMAINS } from "./tour-bands.js";
import {
  activityRoute,
  chooseActivity,
  NEFT_SAYS,
  PARTS,
  SKILL_PLAIN,
  skillOf,
  supportOptions,
  TEACHER_SAY,
} from "./tour-data.js";
import { classroomHTML, onClassroomClick } from "./tour-finish.js";
import { helpHTML } from "./tour-help.js";

const COPY = {
  next: "Next",
  back: "Back",
  skip: "Skip this step",
  finish: "Next",
  tryMyself: "Try it myself",
  showMe: "Show me how",
  stepOf: (a, b) => `Step ${a} of ${b}`,
  missing: "That part is not on screen right now. Press Next to keep going.",
  awayTitle: "You left the example",
  away: "You opened another page inside the example. Bring it back to keep going.",
  bringBack: "Bring the example back",
  why: "Why this matters",
  done: "Done.",
  doIt: "Do it in the activity. I’ll move on by myself.",
  goTo: "Take me to it",
  guide: { name: "Mr. Neft", role: "Your tour guide", avatar: guideArtSVG() },
};

let coach = null;
let view = null; // what the last render decided: { part, pick, skill, support, activity }

const saved = () => loadIntro().guided || {};

/** The address of a part, carrying every choice made so far. */
export function partHref(n, s = {}) {
  const q = new URLSearchParams();
  q.set("part", String(n));
  if (s.pick) q.set("grades", s.pick);
  if (s.skill) q.set("skill", s.skill);
  if (s.support) q.set("support", s.support);
  return `${BASE}/start/tour?${q}`;
}

/**
 * Choices for this render: the address first, then this device. Parts 2 and 3 need a skill, so without one the tour
 * opens at Part 1. Old links (?part=4, ?stop=) still land on a real part.
 */
function readState(ctx) {
  const r = ctx.route || {};
  const keep = saved();
  const legacy = Number.parseInt(r.stop || "", 10);
  const asked = Math.min(3, Number.parseInt(r.part || "", 10) || 0);
  const resume = !r.part && !Number.isFinite(legacy) && keep.part > 1;
  const skill = skillOf(r.skill || (r.part ? "" : keep.skill || ""));
  let part =
    asked >= 1
      ? asked
      : Number.isFinite(legacy)
        ? legacy >= 6
          ? 3
          : legacy > 1
            ? 2
            : 1
        : resume
          ? Math.min(3, keep.part)
          : 1;
  if (!skill) part = 1;
  const support = /^[ABC]$/.test(r.support || "") ? r.support : r.part ? "" : keep.support || "";
  return { part, pick: teacherPick(ctx), skill, support, resume: resume && part > 1 };
}

function remember(s) {
  updateIntro("guided", (g) => ({
    ...g,
    part: s.part,
    pick: s.pick,
    skill: s.skill,
    support: s.support,
    done: g.done || s.part === 3,
  }));
}

/** The three parts across the top: where am I, what is next. Parts already passed are links back. */
function progressHTML(s) {
  return html`<nav class="gt-progress" aria-label="Teacher tour progress">
    <ol class="is-three">
      ${PARTS.map((p) => {
        const label = html`<span class="gt-progress-n" aria-hidden="true"
            >${p.n < s.part ? icon("check") : p.n}</span
          ><span class="gt-progress-name">${p.name}</span>`;
        return html`<li
          class="${p.n < s.part ? "is-done" : p.n === s.part ? "is-now" : ""}"
          ${p.n === s.part ? html`aria-current="step"` : ""}
        >
          ${p.n < s.part ? html`<a href="${partHref(p.n, s)}">${label}<span class="visually-hidden"> (done)</span></a>` : html`<span>${label}</span>`}
        </li>`;
      })}
    </ol>
  </nav>`;
}

/** The chosen skill and grades, carried across every part so the tour reads as one story. */
function trailHTML(s) {
  const d = DOMAIN_BY_ID[s.skill];
  return html`<p class="gt-trail">
    ${d ? html`<span class="gt-chip ${d.cls}">${icon(d.icon)}${d.name}</span>` : ""}
    <span class="gt-chip">${icon("classroom")}${pickName(s.pick)}</span>
    ${d ? html`<a href="${partHref(1, { pick: s.pick })}">Change skill</a>` : ""}
  </p>`;
}

function topHTML(s) {
  return html`<header class="gt-top">
    <p class="gt-eyebrow">${icon("teacher")}Teacher tour · Part ${s.part} of ${PARTS.length}</p>
    <a class="gt-exit" href="${BASE}/?grades=${s.pick}">${icon("close")}Exit tour</a>
    ${progressHTML(s)}
  </header>`;
}

/** Five small grade buttons. Changing grades keeps the part and the skill. */
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

const neft = (say, step, s, chips) =>
  guideBubbleHTML({
    say,
    role: "Your tour guide",
    chips,
    context: { page: "tour", step, pick: s.pick, domain: s.skill || "" },
  });

/* ── Part 1: pick a skill ── */
function skillHTML(s, index) {
  return html`<section class="gt-part gt-part-skill" aria-labelledby="gtTitle">
    ${neft(NEFT_SAYS[1], "Pick a skill", s, ["time", "what", "account", "scored"])}
    <div class="gt-head-row">
      <h1 id="gtTitle" tabindex="-1">What would you like your students to practice?</h1>
      ${gradesHTML(s.pick)}
    </div>
    <ul class="gt-domains">
      ${DOMAINS.map((d) => {
        const a = index ? chooseActivity(index, s.pick, d.id, "A") : null;
        return html`<li>
          <a
            class="gt-domain ${d.cls}"
            href="${partHref(2, { ...s, skill: d.id, support: "" })}"
            data-gt-skill="${d.id}"
          >
            <img src="${ART}/${d.art}" alt="" width="320" height="200" loading="lazy" />
            <span class="gt-domain-body">
              <span class="gt-domain-name">${icon(d.icon)}${d.name}</span>
              <span class="gt-domain-text">${SKILL_PLAIN[d.id]}</span>
              ${a ? html`<span class="gt-domain-try">Try: <strong>${a.title}</strong></span>` : ""}
            </span>
            <span class="gt-domain-go" aria-hidden="true">${icon("arrow-right")}</span>
          </a>
        </li>`;
      })}
    </ul>
  </section>`;
}

/* ── Part 2: try it as a student ── */
function tryHTML(s, a) {
  const d = DOMAIN_BY_ID[s.skill];
  return html`<section class="gt-part gt-part-try ${d.cls}" aria-labelledby="gtTitle">
    <div class="gt-head-row">
      <div class="gt-head-text">
        <h1 id="gtTitle" tabindex="-1">${a.title}</h1>
        <p class="gt-activity-line">
          ${icon(d.icon)}<span>${d.name} · ${a.support} · about ${a.minutes} min</span>
        </p>
      </div>
      <p class="gt-skip-top">
        <a href="${partHref(3, s)}">Skip to using it with your class${icon("arrow-right")}</a>
      </p>
    </div>
    <div
      class="gt-stage"
      data-gt-stage
      data-src="${BASE}${activityRoute(a, { frame: "1" })}"
      data-path="${BASE}${a.route}"
      data-title="Live activity: ${a.title}"
    >
      <div class="gt-coach" data-coach-slot aria-label="Mr. Neft, your tour guide"></div>
      <div class="gt-frame-slot" data-gt-frame>
        <p class="gt-loading" role="status">${icon("clock")}Opening the activity…</p>
      </div>
    </div>
  </section>`;
}

/* ── Part 3: use it with your class ── */
function classHTML(s, index, a) {
  const options = supportOptions(index, s.pick, s.skill);
  return html`<section class="gt-part gt-part-class" aria-labelledby="gtTitle">
    ${neft(NEFT_SAYS[3], "Use it with your class", s, ["share", "families", "language", "saved"])}
    <h1 id="gtTitle" tabindex="-1">Use it with your class</h1>
    ${classroomHTML(s, a, options)}
  </section>`;
}

const failHTML = () =>
  html`<p class="gt-note is-alert" role="alert">
    ${icon("alert")}<span
      >The activity list did not load. Check the connection and
      <a href="${BASE}/start/tour">try again</a>.</span
    >
  </p>`;

export async function render(ctx) {
  const s = readState(ctx);
  const index = await loadIndex().catch(() => null);
  if (
    index &&
    s.skill &&
    s.support &&
    !supportOptions(index, s.pick, s.skill).some((o) => o.level === s.support)
  )
    s.support = "";
  const level = s.part === 3 ? s.support || "A" : "A";
  const a = index && s.skill ? chooseActivity(index, s.pick, s.skill, level) : null;
  if (s.part === 3 && !s.support) s.support = "A";
  view = { ...s, activity: a };
  remember(s);
  const body = !index
    ? failHTML()
    : s.part === 1
      ? skillHTML(s, index)
      : !a
        ? failHTML()
        : s.part === 2
          ? tryHTML(s, a)
          : classHTML(s, index, a);
  return {
    title: `Teacher tour: ${PARTS[s.part - 1].name}`,
    html: html`<article class="gt-page" aria-labelledby="gtTitle">
      ${topHTML(s)} ${s.part > 1 ? trailHTML(s) : ""}
      ${s.resume ? html`<p class="gt-back-note" role="status">${icon("bookmark")}You are back where you stopped. <a href="${partHref(1, s)}">Start from the beginning</a>.</p>` : ""}
      ${body}
      ${s.part > 1 ? html`<nav class="gt-nav" aria-label="Tour controls"><a class="btn ghost" href="${partHref(s.part - 1, s)}">${icon("arrow-left")}Back</a></nav>` : ""}
      ${helpHTML({ restart: true })}
      <p class="fine gt-saved">${SAVED_NOTE}</p>
    </article>`,
  };
}

/** Open the live activity in Part 2 and start Mr. Neft's guide card beside it. */
export function mount(root, ctx) {
  bindGuide();
  coach?.destroy();
  coach = null;
  const stage = document.querySelector("[data-gt-stage]");
  if (!stage || !view) return;
  const frame = activityFrame(stage.dataset.src, stage.dataset.title);
  const slot = stage.querySelector("[data-gt-frame]");
  frame.addEventListener("load", () => slot.querySelector(".gt-loading")?.remove(), { once: true });
  slot.append(frame);
  const path = stage.dataset.path;
  coach = createCoach({
    stage,
    frame,
    steps: stepsFor(view.skill, TEACHER_SAY),
    copy: COPY,
    isHome: (win) => {
      try {
        return win.location.pathname === path || win.location.href === "about:blank";
      } catch {
        return true;
      }
    },
    onFinish: () => ctx.navigate(partHref(3, view)),
  });
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
    rerenderKeeping(ctx, `[data-gt-grades="${id}"]`);
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
