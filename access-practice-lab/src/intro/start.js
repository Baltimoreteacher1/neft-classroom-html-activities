// Teacher start (/start and its pages). One stable, shareable place that answers "where do I start?" with three
// choices, then hands each choice to its own page:
//   /start          the three choices           /start/tour      guided tour (5 stops)
//   /start/explore  Try It. Adapt It. Use It.   /start/guide     quick guide (printable)
//   /start/lesson   featured lesson             /start/present   presenter view (30 minutes)
// The route names avoid the word "teacher": Pages gates any path containing it behind the teacher password.
import { html, icon } from "../util.js";
import { FEATURED_LESSON, ROUTES, START_CHOICES } from "./data.js";
import { loadIntro } from "./state.js";
import { onOverviewClick, overviewHTML } from "./start-overview.js";
import { teacherBand } from "./shell.js";
import { labHref } from "./ui.js";

const PAGES = {
  tour: () => import("./tour.js"),
  explore: () => import("./explore.js"),
  guide: () => import("./quick-guide.js"),
  lesson: () => import("./lesson.js"),
  present: () => import("./present.js"),
  activities: () => import("./activities.js"),
};

let current = null;

function choiceHTML(c, resume) {
  const label = c.id === "tour" && resume ? `Resume the tour at Step ${resume}` : c.name;
  return html`<li>
    <a class="in-choice is-${c.id}" href="${labHref(c.route)}">
      <span class="in-ic" aria-hidden="true">${icon(c.icon)}</span>
      <span class="in-choice-text"><strong>${label}</strong><span>${c.detail}</span></span>
      <span class="in-go" aria-hidden="true">${icon("arrow-right")}</span>
    </a>
  </li>`;
}

const CHIPS = ["2 pathways · 4 activities", "No student accounts", "Students choose their help", "Feedback, never scores"];

function hubHTML() {
  const saved = loadIntro().tour;
  const resume = saved && Number.isInteger(saved.stop) && saved.stop > 0 ? saved.stop + 1 : 0;
  const L = FEATURED_LESSON;
  return html`<article class="in-page in-hub" aria-labelledby="introTitle">
    ${teacherBand({
      active: "overview",
      size: "hub",
      eyebrow: "For teachers · The Language Page",
      title: "Start Here: Speaking and Writing",
      lead: "Try one speaking activity and one writing activity as a learner, then leave with a lesson you can use.",
      meta: html`<ul class="ts-chips" aria-label="At a glance">${CHIPS.map((c) => html`<li>${c}</li>`)}</ul>`,
      aside: html`<a class="ts-feature" href="${labHref(ROUTES.lesson)}">
        <img src="${L.picture.src}" alt="" width="320" height="200" />
        <span class="ts-feature-text"><small>${L.label} · ${L.minutes} minutes</small><strong>${L.title}</strong></span>
      </a>`,
    })}
    <ul class="in-choices ts-lift" aria-label="Three ways to start">
      ${START_CHOICES.map((c) => choiceHTML(c, resume))}
    </ul>
    ${overviewHTML()}
  </article>`;
}

const hub = { render: async () => ({ title: "Start Here: Speaking and Writing", html: hubHTML() }), onClick: onOverviewClick };

export async function render(ctx) {
  const loader = PAGES[ctx.route.id || ""];
  const page = loader ? await loader() : hub;
  if (page !== current) current?.unmount?.();
  current = page;
  return page.render(ctx);
}

export const mount = (root, ctx) => current?.mount?.(root, ctx);
export const unmount = () => {
  current?.unmount?.();
  current = null;
};
export const onClick = (e, ctx) => current?.onClick?.(e, ctx) ?? false;
export const onChange = (e, ctx) => current?.onChange?.(e, ctx);
export const onInput = (e, ctx) => current?.onInput?.(e, ctx);
export const onKey = (e, ctx) => current?.onKey?.(e, ctx);
