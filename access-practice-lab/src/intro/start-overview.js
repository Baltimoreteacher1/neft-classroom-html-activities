// The teacher overview under the grade picker and the three choices on /start. Everything here is drawn from data
// that is already verified (data.js, tour-bands.js, site-guide-more.js), so the overview never states a feature the
// site does not have. Order: your grades at a glance (one activity per domain), Mr. Neft, how the site teaches,
// resources, families, sharing, and (Grades 6–8 only) the featured lesson and class-time routines.
import { html, icon } from "../util.js";
import { domainCardsHTML, pickName } from "./band.js";
import {
  ACTIVITY_BY_ID,
  CAN,
  CANNOT,
  DOWNLOADS,
  FEATURED_LESSON,
  LOOP,
  PATHWAYS,
  ROUTES,
  USE_LESSON,
  WORDS,
  absUrl,
} from "./data.js";
import { guideHTML } from "./guide.js";
import { withReturn } from "./return-bar.js";
import { ROUTINES, SHARING } from "./site-guide-more.js";
import { familiesHTML, resourcesHTML } from "./start-resources.js";
import { loadIntro } from "./state.js";
import { tourRoute } from "./tour-bands.js";
import { PARTS } from "./tour-data.js";
import { activityHref, copyWithNote, labHref } from "./ui.js";

/** The teacher tour: a skill opens Part 2 (try it as a student) with that skill chosen; no skill opens the tour where the teacher left it. */
export const tourHref = (pick, skill) =>
  `${labHref(ROUTES.tour)}?${skill ? `part=2&skill=${skill}&` : ""}grades=${pick}`;

const sections = (pick) => [
  ["ov-domains", "Your grades"],
  ["ov-how", "How it works"],
  ["ov-resources", "Resources"],
  ["ov-families", "Families"],
  ["ov-share", "Share and assign"],
  ...(pick === "6-8" ? [["ov-more", "More for Grades 6–8"]] : []),
];

/** What this device remembers about the tour, the exploration and the lesson. Shown only when something is saved. */
export function progressItems(intro) {
  const items = [];
  const t = intro.guided;
  if (t && t.part > 1 && !t.done) {
    items.push({
      text: `Teacher tour: Part ${Math.min(t.part, PARTS.length)} of ${PARTS.length}, ${PARTS[Math.min(t.part, PARTS.length) - 1].name}`,
      href: labHref(ROUTES.tour),
      cta: "Resume the tour",
    });
  }
  const x = intro.explore;
  if (x && (x.focus || x.plan || x.next)) {
    const focus = PATHWAYS.find((p) => p.id === x.focus)?.name;
    const planned = Object.values(x.plan || {}).filter(Boolean).length;
    items.push({
      text: `Exploration: ${focus ? `${focus} focus` : "started"}${planned ? `, planning card ${planned} of 5` : ""}`,
      href: `${labHref(ROUTES.explore)}?stop=${(x.phase ?? 0) + 1}`,
      cta: "Continue exploring",
    });
  }
  const l = intro.lesson;
  if (l && (l.draft || l.revised))
    items.push({
      text: "Featured lesson: your written response is saved",
      href: labHref(ROUTES.lesson),
      cta: "Open the lesson",
    });
  return items;
}

function progressHTML() {
  const items = progressItems(loadIntro());
  if (!items.length) return "";
  return html`<section class="in-panel ov-progress" aria-labelledby="ovProgress">
    <h2 id="ovProgress">Pick up where you left off</h2>
    <ul>
      ${items.map((i) => html`<li><span>${i.text}</span><a class="btn small" href="${i.href}">${i.cta}${icon("arrow-right")}</a></li>`)}
    </ul>
    <p class="fine">Saved in this browser on this device only.</p>
  </section>`;
}

/** The two buttons on each domain card: try it inside the tour, or open the real activity. */
const cardActions = (pick) => (a) =>
  html`<p class="ov-card-actions">
    <a class="btn small btn-primary" href="${tourHref(pick, a.domain.id)}"
      >Try it in the tour<span class="visually-hidden">: ${a.domain.name}</span></a
    >
    <a class="btn small ghost" href="${withReturn(labHref(tourRoute(a)), "start")}"
      >Open the activity<span class="visually-hidden">: ${a.title}</span>${icon("arrow-right")}</a
    >
  </p>`;

function domainsHTML(pick) {
  return html`<section class="ov-section ov-domains" id="ov-domains" aria-labelledby="ovDomTitle">
    <div class="ov-head">
      <p class="eyebrow">${pickName(pick)}</p>
      <h2 id="ovDomTitle">Your grades at a glance</h2>
      <p>
        One real activity in each language domain. Try it in the tour with a guide beside it, or open
        it the way students see it.
      </p>
    </div>
    ${domainCardsHTML(pick, cardActions(pick))}
  </section>`;
}

function guidePanelHTML(pick) {
  return html`<div class="ov-guide">
    ${guideHTML({
      say: `Hi, I’m Mr. Neft. These four activities are for ${pickName(pick)}. Ask me anything about the site, or tap a question.`,
      chips: ["what", "account", "scored", "mic", "families"],
      context: { page: "start", pick },
    })}
  </div>`;
}

function howHTML() {
  return html`<section class="ov-section ov-how" id="ov-how" aria-labelledby="ovHowTitle">
    <div class="ov-head">
      <h2 id="ovHowTitle">How the site teaches</h2>
      <p class="fine">
        Every activity follows the same loop, so knowing it once means you know how all of them
        work.
      </p>
    </div>
    <ol class="ov-loop">
      ${LOOP.map(([h, t], i) => html`<li><span class="ov-loop-n" aria-hidden="true">${i + 1}</span><strong>${h}</strong><span>${t}</span></li>`)}
    </ol>
    <div class="ov-cancan">
      <div class="ov-can">
        <h3>${icon("check")} What the feedback can do</h3>
        <ul>
          ${CAN.map((c) => html`<li>${c}</li>`)}
        </ul>
      </div>
      <div class="ov-can ov-cannot">
        <h3>${icon("info")} What it cannot do, so you do it</h3>
        <ul>
          ${CANNOT.map((c) => html`<li>${c}</li>`)}
        </ul>
      </div>
    </div>
    <details class="in-more">
      <summary>Words you will see on the site</summary>
      <dl class="ov-words">
        ${WORDS.map(
          ([t, d]) =>
            html`<dt>${t}</dt>
              <dd>${d}</dd>`,
        )}
      </dl>
    </details>
  </section>`;
}

function shareHTML() {
  return html`<section class="ov-section" id="ov-share" aria-labelledby="ovShareTitle">
    <div class="ov-head">
      <h2 id="ovShareTitle">Share, assign and print</h2>
      <p class="fine">
        These tools already exist on the site. Links carry the activity, never student information.
      </p>
    </div>
    <ul class="ov-share">
      ${SHARING.map(
        (s) =>
          html`<li>
            <a href="${labHref(s.route)}"><strong>${s.head}</strong></a
            ><span>${s.text}</span
            >${s.second ? html`<a class="fine" href="${s.second.route}">${s.second.label}</a>` : ""}
          </li>`,
      )}
    </ul>
  </section>`;
}

/** Grades 6–8 only: the featured lesson, the class-time routines and the 20-minute exploration. */
function moreHTML() {
  const L = FEATURED_LESSON;
  const anchor = ACTIVITY_BY_ID[L.anchor];
  return html`<section class="ov-section ov-more" id="ov-more" aria-labelledby="ovMoreTitle">
    <div class="ov-head">
      <p class="eyebrow">Grades 6–8 examples</p>
      <h2 id="ovMoreTitle">More for Grades 6–8</h2>
      <p class="fine">
        A ready lesson and three routines built on the Grades 6–8 speaking and writing activities.
      </p>
    </div>
    <div class="in-panel ov-lesson" id="ov-lesson">
      <figure>
        <img
          src="${L.picture.src}"
          alt="${L.picture.alt}"
          width="320"
          height="200"
          loading="lazy"
        />
      </figure>
      <div class="ov-lesson-text">
        <p class="eyebrow">${L.label} · ${L.minutes} minutes</p>
        <h3>${L.title}</h3>
        <p>${L.objective}</p>
        <ol class="in-seq" aria-label="Lesson sequence">
          ${L.steps.map((s) => html`<li><strong>${s.name}</strong><span>${s.minutes} min</span></li>`)}
        </ol>
        <p class="in-actions">
          <a class="btn btn-primary" href="${labHref(ROUTES.lesson)}"
            >Open the lesson${icon("arrow-right")}</a
          >
          <button type="button" class="btn" data-ov-copy="${absUrl(USE_LESSON.studentRoute)}">
            ${icon("copy")}Copy student link
          </button>
          <a class="btn ghost" href="${DOWNLOADS.lessonBackup.pdf}">Printable backup (PDF)</a>
        </p>
        <p class="fine">
          Students open ${anchor.name} directly. No account, and no microphone needed.
        </p>
      </div>
    </div>
    <h3>Fit it to your class time</h3>
    <div class="ov-routines">
      ${ROUTINES.map((r) => {
        const a = ACTIVITY_BY_ID[r.activity];
        const href = r.lesson ? labHref(ROUTES.lesson) : activityHref(a, "start");
        return html`<article class="in-act ov-routine pw-${a.pathway}">
          <p class="ov-length">${icon("clock")} ${r.length}</p>
          <h4>${r.name}</h4>
          <p><strong>Students produce:</strong> ${r.produce}</p>
          <p><strong>Look or listen for:</strong> ${r.lookFor}</p>
          <a class="btn" href="${href}"
            >${r.lesson ? "Open the lesson" : `Open ${a.name}`}${icon("arrow-right")}</a
          >
        </article>`;
      })}
    </div>
    <p class="ov-explore">
      <a class="btn ghost" href="${labHref(ROUTES.activities)}"
        >Every curated activity, step by step${icon("arrow-right")}</a
      >
    </p>
  </section>`;
}

/** Everything below the grade picker and the three choices. */
export function overviewHTML(pick) {
  return html`${progressHTML()}
    <nav class="ov-jump" aria-label="On this page">
      <span>On this page:</span
      >${sections(pick).map(([id, label]) => html`<a href="#${id}">${label}</a>`)}
    </nav>
    ${domainsHTML(pick)} ${guidePanelHTML(pick)} ${howHTML()} ${resourcesHTML()}
    ${familiesHTML(pick)} ${shareHTML()} ${pick === "6-8" ? moreHTML() : ""}
    <p class="fine" role="status" data-ov-note></p>`;
}

export function onOverviewClick(e) {
  const btn = e.target.closest?.("[data-ov-copy]");
  if (!btn) return false;
  copyWithNote(btn.dataset.ovCopy, document.querySelector("[data-ov-note]"));
  return true;
}
