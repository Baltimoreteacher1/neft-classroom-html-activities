// The /start overview, part 2: the resources library and "Share with families". Every file path comes from data.js
// (DOWNLOADS) or family-data.js (FAMILY_HANDOUT); page counts were read from the committed PDFs on 2026-11-11
// (pdfinfo). Presenter notes are deliberately not listed: the PD session is not offered on the site.
import { html, icon } from "../util.js";
import { DOWNLOADS, ROUTES, absUrl } from "./data.js";
import * as familyData from "./family-data.js";
import { pickName } from "./band.js";
import { labHref } from "./ui.js";

const G68 = "Grades 6–8 examples";

/** The library, in the order a teacher reaches for it. `files` absent means a web page only. */
export const RESOURCES = [
  {
    id: "quick-guide",
    icon: "print",
    name: "Quick Guide",
    text: "Two printable pages: the 20-minute exploration and the featured lesson.",
    scope: G68,
    pages: 2,
    files: DOWNLOADS.quickGuide,
    page: { route: ROUTES.guide, label: "Open on screen" },
  },
  {
    id: "activity-guide",
    icon: "library",
    name: "Activity Guide",
    text: "How each curated activity is used, one activity per page, with the button names students see.",
    scope: G68,
    pages: 7,
    files: DOWNLOADS.activityGuide,
    page: { route: ROUTES.activities, label: "Open on screen" },
  },
  {
    id: "site-directory",
    icon: "list",
    name: "Site Directory",
    text: "Every activity on the site by grade band, domain and support level, with a link to each, plus the practice tests.",
    scope: "All grades",
    pages: 52,
    files: DOWNLOADS.directory,
  },
  {
    id: "lesson-backup",
    icon: "bookmark",
    name: "Featured lesson backup",
    text: "Use it if the activity will not load: page 1 is for students, page 2 is for you.",
    scope: G68,
    pages: 2,
    files: DOWNLOADS.lessonBackup,
  },
  {
    id: "site-guide",
    icon: "help",
    name: "Site Guide",
    text: "How every part of the site works, with a search box and answers to common questions.",
    scope: "All grades",
    page: { route: `${ROUTES.siteGuide}?for=teacher`, label: "Open the Site Guide" },
  },
];

function resourceHTML(r) {
  const id = `ovRes-${r.id}`;
  return html`<li class="ov-res">
    <span class="ov-res-ic" aria-hidden="true">${icon(r.icon)}</span>
    <div class="ov-res-body">
      <h3 id="${id}">${r.name}</h3>
      <p>${r.text}</p>
      <p class="ov-badges">
        <span class="ov-badge">${r.scope}</span>
        ${r.files ? html`<span class="ov-badge">PDF</span><span class="ov-badge">Word</span>` : html`<span class="ov-badge">Web page</span>`}
        ${r.pages ? html`<span class="ov-badge">${r.pages} pages</span>` : ""}
      </p>
    </div>
    <p class="ov-res-actions">
      ${
        r.files
          ? html`<a class="btn small" href="${r.files.pdf}" aria-describedby="${id}"
                >${icon("download")}PDF</a
              >
              <a class="btn small ghost" href="${r.files.docx}" aria-describedby="${id}"
                >${icon("download")}Word</a
              >`
          : ""
      }
      ${r.page ? html`<a class="btn small ghost" href="${labHref(r.page.route)}" aria-describedby="${id}">${r.page.label}${icon("arrow-right")}</a>` : ""}
    </p>
  </li>`;
}

export function resourcesHTML() {
  return html`<section
    class="ov-section ov-resources"
    id="ov-resources"
    aria-labelledby="ovResTitle"
  >
    <div class="ov-head">
      <h2 id="ovResTitle">Resources</h2>
      <p class="fine">Print them, share them, or keep them open beside the site.</p>
    </div>
    <ul class="ov-res-list">
      ${RESOURCES.map(resourceHTML)}
    </ul>
  </section>`;
}

const FAMILY_LABEL = {
  K: "Grades K–2",
  1: "Grades K–2",
  "2-3": "Grades K–2",
  "4-5": "Grades 3–5",
  "6-8": "Grades 6–8",
};

/** Family page route for a teacher pick. The family page maps K, Grade 1 and Grades 2–3 to its "Grades K–2" choice. */
export const familyRoute = (pick) => `${ROUTES.together}?grades=${pick}`;

const COMMON = [
  [
    "families",
    "Their child’s grade",
    "The page opens on the grade in your link. Families can change it.",
  ],
  [
    "language",
    "English and Spanish",
    "Families switch the whole page between English and Spanish.",
  ],
  ["clock", "5–10 minutes", "No account and nothing to sign up for."],
];
const CHOICES = {
  early: [
    "reading",
    "Practice for grades K–2",
    "A picture story read aloud, sounds, word cards and short games to do together.",
  ],
  older: [
    "conversation",
    "Let’s Talk and Let’s Write",
    "Two choices: say it aloud together, or write it together.",
  ],
};
const getsFor = (pick) => [
  COMMON[0],
  ["K", "1", "2-3"].includes(pick) ? CHOICES.early : CHOICES.older,
  ...COMMON.slice(1),
];

export function familiesHTML(pick) {
  const handout = familyData.FAMILY_HANDOUT;
  const band = FAMILY_LABEL[pick] || "Grades 6–8";
  return html`<section class="ov-section ov-families" id="ov-families" aria-labelledby="ovFamTitle">
    <div class="ov-fam-card">
      <div class="ov-fam-intro">
        <p class="eyebrow">For families · Practice Together</p>
        <h2 id="ovFamTitle">Share with families</h2>
        <p>
          Send one link home. Families practice English with their child for a few minutes, in
          English or Spanish, on a phone or computer.
        </p>
        <ul class="ov-gets">
          ${getsFor(pick).map(
            ([ic, h, t]) =>
              html`<li>
                <span class="in-ic" aria-hidden="true">${icon(ic)}</span
                ><span><strong>${h}</strong>${t}</span>
              </li>`,
          )}
        </ul>
      </div>
      <div class="ov-fam-share">
        <p class="ov-fam-for">
          <strong>Your link opens ${band}</strong
          ><span class="fine">Chosen from your grades: ${pickName(pick)}</span>
        </p>
        <p class="ov-fam-url">
          <code>${absUrl(familyRoute(pick)).replace(/^https:\/\//, "")}</code>
        </p>
        <p class="in-actions">
          <button type="button" class="btn btn-primary" data-ov-copy="${absUrl(familyRoute(pick))}">
            ${icon("copy")}Copy the family link
          </button>
          <a class="btn" href="${labHref(familyRoute(pick))}"
            >Preview the family page${icon("arrow-right")}</a
          >
        </p>
        ${
          handout
            ? html`<div class="ov-fam-files">
                <h3>One-page handout to send home</h3>
                <ul>
                  <li>
                    <span>English</span
                    ><a href="${handout.en.pdf}"
                      >PDF<span class="visually-hidden"> (English handout)</span></a
                    ><a href="${handout.en.docx}"
                      >Word<span class="visually-hidden"> (English handout)</span></a
                    >
                  </li>
                  <li>
                    <span lang="es">Español</span
                    ><a href="${handout.es.pdf}"
                      >PDF<span class="visually-hidden"> (Spanish handout)</span></a
                    ><a href="${handout.es.docx}"
                      >Word<span class="visually-hidden"> (Spanish handout)</span></a
                    >
                  </li>
                </ul>
              </div>`
            : ""
        }
      </div>
    </div>
  </section>`;
}
