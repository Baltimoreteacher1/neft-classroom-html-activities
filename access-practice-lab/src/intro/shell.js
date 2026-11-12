// The teacher frame shared by every /start page: one midnight band with the section nav, the page title and an
// optional aside, so the overview, tour, exploration, lesson and quick guide read as one product.
// The tour and exploration add a two-column layout with a sticky step rail (stepRailHTML) and a sticky action bar.
import { html, icon } from "../util.js";
import { ROUTES } from "./data.js";

export const TEACHER_NAV = [
  { id: "overview", label: "Overview", route: ROUTES.start, icon: "home" },
  { id: "tour", label: "Teacher Tour", route: ROUTES.tour, icon: "flag" },
  { id: "explore", label: "Explore", route: ROUTES.explore, icon: "clock" },
  { id: "activities", label: "Activity Guide", route: ROUTES.activities, icon: "library" },
  { id: "lesson", label: "Lesson", route: ROUTES.lesson, icon: "conversation" },
  { id: "guide", label: "Quick Guide", route: ROUTES.guide, icon: "print" },
];

const BASE = "/access-practice-lab";

export function teacherNavHTML(active) {
  return html`<nav class="ts-nav" aria-label="Teacher start">
    <ul>
      ${TEACHER_NAV.map(
        (n) =>
          html`<li>
            <a href="${BASE}${n.route}" ${n.id === active ? html`aria-current="page"` : ""}
              >${icon(n.icon)}<span>${n.label}</span></a
            >
          </li>`,
      )}
    </ul>
    <a class="ts-nav-guide" href="${BASE}${ROUTES.siteGuide}?for=teacher"
      >${icon("help")}<span>Site Guide</span></a
    >
  </nav>`;
}

/**
 * On phones the nav is one horizontal row; bring the current page's item into view inside that row (scrollLeft on the
 * row only, so the page itself never jumps). Runs whenever a teacher band is rendered into the app.
 */
export function revealCurrentNav(root = document) {
  for (const row of root.querySelectorAll(".ts-nav ul")) {
    const here = row.querySelector('[aria-current="page"]');
    if (!here || row.scrollWidth <= row.clientWidth) continue;
    const r = row.getBoundingClientRect();
    const a = here.getBoundingClientRect();
    row.scrollLeft += a.left - r.left - (row.clientWidth - a.width) / 2;
  }
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  const app = document.getElementById("app");
  if (app)
    new MutationObserver(() => {
      if (app.querySelector(".ts-nav")) revealCurrentNav(app);
    }).observe(app, { childList: true });
}

/**
 * The band. `title` becomes the page's one h1 unless `headless` (the quick guide prints its own h1 on the sheet).
 * `meta` sits under the lead (chips, a progress bar); `aside` sits on the right on wide screens.
 */
export function teacherBand({
  active,
  eyebrow = "For teachers",
  title = "",
  lead = "",
  meta = "",
  aside = "",
  size = "page",
  headless = false,
}) {
  return html`<header class="ts-band is-${size}${aside ? " has-aside" : ""}">
    ${teacherNavHTML(active)}
    ${
      headless
        ? ""
        : html`<div class="ts-hero">
            <div class="ts-copy">
              <p class="ts-eyebrow">${eyebrow}</p>
              <h1 id="introTitle" tabindex="-1">${title}</h1>
              ${lead ? html`<p class="ts-lead">${lead}</p>` : ""} ${meta}
            </div>
            ${aside ? html`<div class="ts-aside">${aside}</div>` : ""}
          </div>`
    }
  </header>`;
}

/** Progress as a bar plus words (the words carry the meaning; the bar is decoration). */
export const progressHTML = (n, total, label) =>
  html`<div class="ts-progress">
    <span class="ts-progress-text">${label}</span
    ><span class="ts-bar" aria-hidden="true"
      ><i style="width:${Math.round(((n + 1) / total) * 100)}%"></i
    ></span>
  </div>`;

/**
 * The step rail: every step with its number, name, a small detail (minutes) and a done mark; the current step is
 * aria-current="step". Sticky beside the content on wide screens, a compact row of numbers on phones.
 */
export function stepRailHTML({ label, steps, current, hrefFor, doneFor = () => false }) {
  return html`<nav class="ts-rail" aria-label="${label}">
    <ol>
      ${steps.map((s, i) => {
        const done = doneFor(s, i);
        return html`<li
          class="${done ? "is-done" : ""}"
          ${i === current ? html`aria-current="step"` : ""}
        >
          <a href="${hrefFor(i)}">
            <span class="ts-num" aria-hidden="true"
              >${done && i !== current ? icon("check") : i + 1}</span
            >
            <span class="ts-step"
              ><strong>${s.name}</strong
              >${s.detail ? html`<small>${s.detail}</small>` : ""}${done ? html`<span class="visually-hidden"> (done)</span>` : ""}</span
            >
          </a>
        </li>`;
      })}
    </ol>
  </nav>`;
}
