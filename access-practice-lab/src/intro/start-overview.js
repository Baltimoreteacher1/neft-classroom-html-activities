// The teacher overview under the three choices on /start. Everything here is drawn from data that is already verified
// (data.js, site-guide-more.js), so the overview never states a feature the site does not have. The first screen stays
// the three choices; this is what a teacher scrolls to when they want the whole picture before choosing.
import { html, icon } from "../util.js";
import { ACTIVITY_BY_ID, DOWNLOADS, ENTRANCE, FEATURED_LESSON, PATHWAYS, ROUTES, TOUR_STOPS, USE_LESSON, absUrl } from "./data.js";
import { ROUTINES, SHARING } from "./site-guide-more.js";
import { loadIntro } from "./state.js";
import { activityHref, copyWithNote, labHref, pathwaysHTML } from "./ui.js";

const SECTIONS = [
  ["ov-how", "How it works"],
  ["ov-paths", "The two pathways"],
  ["ov-lesson", "Featured lesson"],
  ["ov-time", "Fit your class time"],
  ["ov-share", "Share and assign"],
  ["ov-pd", "Run a PD session"],
  ["ov-families", "Families"],
];

/** What this device remembers about the tour, the exploration and the lesson. Shown only when something is saved. */
export function progressItems(intro) {
  const items = [];
  const t = intro.tour;
  if (t && (Number.isInteger(t.stop) || t.tried)) {
    const tried = Object.values(t.tried || {}).filter(Boolean).length;
    const step = (t.stop ?? 0) + 1;
    items.push({ text: `Guided Tour: Step ${step} of ${TOUR_STOPS.length}${tried ? `, ${tried} tried` : ""}`, href: `${labHref(ROUTES.tour)}?stop=${step}`, cta: "Resume the tour" });
  }
  const x = intro.explore;
  if (x && (x.focus || x.plan || x.next)) {
    const focus = PATHWAYS.find((p) => p.id === x.focus)?.name;
    const planned = Object.values(x.plan || {}).filter(Boolean).length;
    items.push({ text: `Exploration: ${focus ? `${focus} focus` : "started"}${planned ? `, planning card ${planned} of 5` : ""}`, href: `${labHref(ROUTES.explore)}?stop=${(x.phase ?? 0) + 1}`, cta: "Continue exploring" });
  }
  const l = intro.lesson;
  if (l && (l.draft || l.revised)) items.push({ text: "Featured lesson: your written response is saved", href: labHref(ROUTES.lesson), cta: "Open the lesson" });
  return items;
}

function progressHTML() {
  const items = progressItems(loadIntro());
  if (!items.length) return "";
  return html`<section class="in-panel ov-progress" aria-labelledby="ovProgress">
    <h2 id="ovProgress">Pick up where you left off</h2>
    <ul>${items.map((i) => html`<li><span>${i.text}</span><a class="btn small" href="${i.href}">${i.cta}${icon("arrow-right")}</a></li>`)}</ul>
    <p class="fine">Saved in this browser on this device only.</p>
  </section>`;
}


/** The learning loop every curated activity follows (access-practice-lab/PLATFORM.md, "The learner loop"). */
const LOOP = [
  ["Choose", "A student picks an activity or opens your link."],
  ["Prepare", "Plan, hear a model, or open a frame or word bank, only if they want it."],
  ["Produce", "Say it or write it: real language, not a multiple-choice answer."],
  ["Check", "Rule-based checks and coach notes describe what to improve."],
  ["Revise", "Try again. The Language Upgrade Lab and Writing Studio keep earlier versions, so growth is visible."],
];
const CAN = [
  "Count and name what is on the page: a detail, an exact word, a connector, evidence from the source.",
  "Point to the student’s own sentences when it suggests a next move (Writing Studio).",
  "Keep the first try and later revisions so you and the student can compare them.",
];
const CANNOT = [
  "Judge whether an idea is good or true. Read or listen for that yourself.",
  "Score pronunciation, or give a grade, a WIDA level or an ACCESS prediction.",
  "Store work online. It stays in that browser unless the student shares or moves it. (Speech-to-text may use the browser’s own speech service.)",
];
const WORDS = [
  ["Support level", "The help a student chooses: frames and words, a word bank only, or On my own. Students can change it."],
  ["On my own", "No frames, word bank or model. If help is opened later, the try is marked supported. That is fine; it tells you what they needed."],
  ["Model student", "A sample answer from a named classmate-style character, heard with the device voice."],
  ["Coach notes", "Notes in the Speaking Studio about the words a student said or typed. Not about accent or pronunciation."],
  ["Passport", "A student’s record of practice saved on that device. It can print a practice report and move work to another device."],
  ["Practice, not a score", "Nothing in the lab is an official WIDA or ACCESS result. It describes practice only."],
];

function howHTML() {
  return html`<section class="ov-section ov-how" id="ov-how" aria-labelledby="ovHowTitle">
    <h2 id="ovHowTitle">How the site teaches</h2>
    <p class="fine">Every activity below follows the same loop. Knowing it once means you know how all of them work.</p>
    <ol class="ov-loop">${LOOP.map(([h, t], i) => html`<li><span class="ov-loop-n" aria-hidden="true">${i + 1}</span><strong>${h}</strong><span>${t}</span></li>`)}</ol>
    <div class="ov-cancan">
      <section class="in-panel" aria-labelledby="ovCan"><h3 id="ovCan">${icon("check")} What the feedback can do</h3><ul>${CAN.map((c) => html`<li>${c}</li>`)}</ul></section>
      <section class="in-panel ov-cannot" aria-labelledby="ovCannot"><h3 id="ovCannot">${icon("info")} What it cannot do, so you do it</h3><ul>${CANNOT.map((c) => html`<li>${c}</li>`)}</ul></section>
    </div>
    <details class="in-more"><summary>Words you will see on the site</summary>
      <dl class="ov-words">${WORDS.map(([t, d]) => html`<dt>${t}</dt><dd>${d}</dd>`)}</dl>
    </details>
  </section>`;
}

function lessonHTML() {
  const L = FEATURED_LESSON;
  const anchor = ACTIVITY_BY_ID[L.anchor];
  return html`<section class="in-panel ov-lesson" id="ov-lesson" aria-labelledby="ovLessonTitle">
    <figure><img src="${L.picture.src}" alt="${L.picture.alt}" width="320" height="200" loading="lazy" /></figure>
    <div class="ov-lesson-text">
      <p class="eyebrow">${L.label} · ${L.minutes} minutes</p>
      <h2 id="ovLessonTitle">${L.title}</h2>
      <p>${L.objective}</p>
      <ol class="in-seq" aria-label="Lesson sequence">${L.steps.map((s) => html`<li><strong>${s.name}</strong><span>${s.minutes} min</span></li>`)}</ol>
      <p class="in-actions">
        <a class="btn btn-primary" href="${labHref(ROUTES.lesson)}">Open the lesson${icon("arrow-right")}</a>
        <button type="button" class="btn" data-ov-copy="${absUrl(USE_LESSON.studentRoute)}">${icon("copy")}Copy student link</button>
        <a class="btn ghost" href="${DOWNLOADS.lessonBackup.pdf}">Printable backup (PDF)</a>
      </p>
      <p class="fine">Students open ${anchor.name} directly. No account, and no microphone needed.</p>
    </div>
  </section>`;
}

function timeHTML() {
  return html`<section class="ov-section" id="ov-time" aria-labelledby="ovTimeTitle">
    <h2 id="ovTimeTitle">Fit it to your class time</h2>
    <div class="ov-routines">
      ${ROUTINES.map((r) => {
        const a = ACTIVITY_BY_ID[r.activity];
        const href = r.lesson ? labHref(ROUTES.lesson) : activityHref(a, "start");
        return html`<article class="in-act ov-routine pw-${a.pathway}">
          <p class="ov-length">${icon("clock")} ${r.length}</p>
          <h3>${r.name}</h3>
          <p><strong>Students produce:</strong> ${r.produce}</p>
          <p><strong>Look or listen for:</strong> ${r.lookFor}</p>
          <a class="btn" href="${href}">${r.lesson ? "Open the lesson" : `Open ${a.name}`}${icon("arrow-right")}</a>
        </article>`;
      })}
    </div>
  </section>`;
}

function shareHTML() {
  return html`<section class="ov-section" id="ov-share" aria-labelledby="ovShareTitle">
    <h2 id="ovShareTitle">Share, assign and print</h2>
    <p class="fine">These tools already exist on the site. Links carry the activity, never student information.</p>
    <ul class="ov-share">
      ${SHARING.map(
        (s) => html`<li><a href="${labHref(s.route)}"><strong>${s.head}</strong></a><span>${s.text}</span>${s.second ? html`<a class="fine" href="${s.second.route}">${s.second.label}</a>` : ""}</li>`,
      )}
    </ul>
  </section>`;
}

function pdHTML() {
  const files = [
    ["Quick Guide (2 pages)", DOWNLOADS.quickGuide],
    ["Presenter notes", DOWNLOADS.presenterNotes],
    ["Featured lesson backup", DOWNLOADS.lessonBackup],
  ];
  return html`<section class="in-panel ov-pd" id="ov-pd" aria-labelledby="ovPdTitle">
    <div>
      <h2 id="ovPdTitle">Run a PD session</h2>
      <p>A 30-minute introduction, then 20 minutes of exploration. Teachers need only one link: <strong>${ENTRANCE.short}</strong></p>
      <p class="in-actions">
        <a class="btn btn-primary" href="${labHref(ROUTES.present)}">Open the presenter view${icon("arrow-right")}</a>
        <button type="button" class="btn" data-ov-copy="${ENTRANCE.url}">${icon("copy")}Copy the PD link</button>
      </p>
    </div>
    <ul class="ov-files" aria-label="Handouts">
      ${files.map(([name, f]) => html`<li>${icon("download")}<span>${name}</span><a href="${f.pdf}">PDF</a><a href="${f.docx}">Word</a></li>`)}
    </ul>
  </section>`;
}

function familiesHTML() {
  const family = absUrl(ROUTES.together);
  return html`<section class="ov-section ov-families" id="ov-families" aria-labelledby="ovFamTitle">
    <h2 id="ovFamTitle">Bring families in</h2>
    <p>Practice Together gives families two choices, Let’s Talk and Let’s Write, in English and Spanish, for 5–10 minutes at home.</p>
    <p class="in-actions">
      <a class="btn" href="${labHref(ROUTES.together)}">See the family page${icon("arrow-right")}</a>
      <button type="button" class="btn" data-ov-copy="${family}">${icon("copy")}Copy family link</button>
      <a class="btn ghost" href="${labHref(ROUTES.siteGuide)}?for=teacher">Read the Site Guide</a>
    </p>
  </section>`;
}

/** Everything below the three choices. */
export function overviewHTML() {
  return html`${progressHTML()}
    <nav class="ov-jump" aria-label="On this page"><span>On this page:</span>${SECTIONS.map(([id, label]) => html`<a href="#${id}">${label}</a>`)}</nav>
    ${howHTML()}
    <section class="ov-section" id="ov-paths" aria-labelledby="ovPathsTitle">
      <h2 id="ovPathsTitle">The two pathways</h2>
      <p class="fine">Each card says what students do and how long it takes. Open “See an Example” to preview, or “Full how-to” for every step.</p>
      ${pathwaysHTML("start", { showUse: true, howTo: true })}
    </section>
    ${lessonHTML()}
    ${timeHTML()}
    ${shareHTML()}
    ${pdHTML()}
    ${familiesHTML()}
    <p class="fine" role="status" data-ov-note></p>`;
}

export function onOverviewClick(e) {
  const btn = e.target.closest?.("[data-ov-copy]");
  if (!btn) return false;
  copyWithNote(btn.dataset.ovCopy, document.querySelector("[data-ov-note]"));
  return true;
}
