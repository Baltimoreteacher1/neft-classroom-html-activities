// Teacher start (/start and its pages). One stable, shareable place that answers "where do I start?" with three
// choices, then hands each choice to its own page:
//   /start          grade picker + three choices /start/tour      teacher tour (4 parts, learn by doing)
//   /start/explore  Try It. Adapt It. Use It.   /start/guide     quick guide (printable)
//   /start/lesson   featured lesson             (the presenter view was taken down 2026-11-11; PD files live off-site)
// The route names avoid the word "teacher": Pages gates any path containing it behind the teacher password.
import { i18nFor } from "../i18n.js";
import { audienceMapHTML } from "../sitemap-ui.js";
import { html, icon } from "../util.js";
import { bandPickerHTML, onBandClick, pickFromParam, pickName, teacherPick } from "./band.js";
import { START_CHOICES } from "./data.js";
import { bindGuide } from "./guide.js";
import { loadIntro } from "./state.js";
import { tourStatus } from "./tour/model.js";
import { K1_PICKS, K1_ROUTE, k1Status } from "./tour-k1-data.js";
import { onOverviewClick, overviewHTML, tourHref } from "./start-overview.js";
import { teacherBand } from "./shell.js";
import { labHref } from "./ui.js";

const PAGES = {
  tour: () => import("./tour.js"),
  "tour-k1": () => import("./tour-k1.js"),
  explore: () => import("./explore.js"),
  guide: () => import("./quick-guide.js"),
  lesson: () => import("./lesson.js"),
  activities: () => import("./activities.js"),
  "quick-start": () => import("./quick-start.js"),
};

let current = null;

// Kindergarten and Grade 1 have their own tour (tour-k1.js); the tour choice names it for those grades.
const isK1 = (pick) => K1_PICKS.includes(pick);

function choiceHTML(c, resume, pick) {
  const k1 = c.id === "tour" && isK1(pick);
  const name = k1 ? "Take the K–1 Teacher Tour" : c.name;
  const label = c.id === "tour" && resume ? (k1 ? "Continue the K–1 Teacher Tour" : "Continue the Teacher Tour") : name;
  const href = k1 ? `${labHref(K1_ROUTE)}?grades=${pick}` : c.id === "tour" ? tourHref(pick) : labHref(c.route);
  return html`<li>
    <a class="in-choice is-${c.id}" href="${href}">
      <span class="in-ic" aria-hidden="true">${icon(c.icon)}</span>
      <span class="in-choice-text"><strong>${label}</strong><span>${c.detail}</span></span>
      <span class="in-go" aria-hidden="true">${icon("arrow-right")}</span>
    </a>
  </li>`;
}

/** Teacher tools at the top of the first teacher page: one row, the WIDA Data Studio first. */
const QUICK_TOOLS = [
  { href: "/access-teacher/predictive/?demo=1", icon: "growth", name: "WIDA Data Studio", detail: "Scores, growth, graphs and what to teach next. Try it with a sample class.", featured: true },
  { href: "/access-teacher/predictive/?demo=1&tab=toolkit&tool=goals", icon: "flag", name: "Goal-setting form", detail: "Pick a grade, skill and goal. Print, save as PDF or Word." },
  { route: "/twr", icon: "writing", name: "TWR writing", detail: "Sentence-first writing practice for every grade band." },
  { href: "/access-teacher/", icon: "teacher", name: "Teacher Hub", detail: "Your class, assignments and evidence." },
  { route: "/lesson-builder", icon: "writing", name: "Lesson Builder", detail: "Build a lesson from real activities." },
  { route: "/start/tour", icon: "road", name: "Teacher Tour", detail: "Learn the site in a few minutes." },
  { route: "/site-guide", icon: "help", name: "Site Guide", detail: "Everything on the site, by section." },
];

function quickToolsHTML() {
  return html`<nav class="ts-quick" aria-labelledby="tsQuickTitle">
    <p id="tsQuickTitle" class="ts-quick-title">Teacher tools</p>
    <ul class="ts-quick-list">
      ${QUICK_TOOLS.map(
        (t) => html`<li>
          <a class="ts-quick-tool${t.featured ? " is-featured" : ""}" href="${t.href || labHref(t.route)}" data-quick-tool="${t.name}">
            <span class="ts-quick-ic" aria-hidden="true">${icon(t.icon)}</span>
            <span class="ts-quick-text"><strong>${t.name}</strong><span>${t.detail}</span></span>
          </a>
        </li>`,
      )}
    </ul>
  </nav>`;
}

const CHIPS = ["Kindergarten to Grade 8", "No student accounts", "Students choose their help", "Feedback, never scores"];
const TITLE = "Start here: The Language Page for teachers";

function hubHTML(ctx) {
  const pick = teacherPick(ctx);
  const intro = loadIntro();
  const resume = (isK1(pick) ? k1Status(intro) : tourStatus(intro)).state === "continue";
  return html`<article class="in-page in-hub" aria-labelledby="introTitle">
    ${quickToolsHTML()}
    ${teacherBand({
      active: "overview",
      size: "hub",
      eyebrow: "For teachers · The Language Page",
      title: TITLE,
      lead: "Choose your grades, then see one real activity for each language domain: Listening, Speaking, Reading and Writing.",
      meta: html`<ul class="ts-chips" aria-label="At a glance">
        ${CHIPS.map((c) => html`<li>${c}</li>`)}
      </ul>`,
    })}
    <div class="ov-start ts-lift">
      ${bandPickerHTML(pick, { hint: `Showing ${pickName(pick)}. Your choice is saved on this device and carried into the tour.` })}
      <ul class="in-choices" aria-label="Three ways to start">
        ${START_CHOICES.map((c) => choiceHTML(c, resume, pick))}
      </ul>
      <p class="fine k1t-start-link">
        ${
          isK1(pick)
            ? html`Teach Grades 3–8 too? <a href="${tourHref("4-5")}">Take the Teacher Tour for Grades 3–8</a>.`
            : html`Teach Kindergarten or Grade 1? <a href="${labHref(K1_ROUTE)}">Take the K–1 Teacher Tour</a>, its own tour for the youngest learners.`
        }
      </p>
    </div>
    ${overviewHTML(pick)}
    ${audienceMapHTML(i18nFor(ctx), ctx.band, "teacher", {
      id: "teacherToolkit",
      title: [
        "Your teacher toolkit: every part of the site",
        "Su caja de herramientas: cada parte del sitio",
      ],
      lead: [
        "Grouped the same way as the menu at the top. Each section opens its own page with filters.",
        "Agrupado igual que el menú de arriba. Cada sección abre su propia página con filtros.",
      ],
    })}
  </article>`;
}

const hub = {
  render: async (ctx) => ({ title: TITLE, html: hubHTML(ctx) }),
  mount: () => bindGuide(),
  onClick: (e, ctx) => onBandClick(e, ctx) || onOverviewClick(e),
};

/** /start/tour with ?grades=K or 1 (the Start page's domain cards) opens the K–1 tour; 3–8 links are unchanged. */
const pageId = (route) =>
  route.id === "tour" && isK1(pickFromParam(route.grades)) ? "tour-k1" : route.id || "";

export async function render(ctx) {
  const loader = PAGES[pageId(ctx.route)];
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
