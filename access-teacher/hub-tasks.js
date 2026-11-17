// Teacher Hub task panels that are pure links (access-teacher/hub-tasks.js): "Find an Activity", "Prepare for ACCESS"
// and the planning-tools row inside "Plan a Lesson". The Command Center (command-center.js) opens one of these in place
// when a teacher picks the task. Every destination comes from the lab's one route list (src/sitemap.js DEST_BY_ID) or
// is a section of this page, so a renamed route is fixed in one place. Pure: returns markup, owns no state.
import { DEST_BY_ID } from "/access-practice-lab/src/sitemap.js";
import { BASE, html, icon } from "/access-practice-lab/src/util.js";

/** Absolute href for a lab destination, carrying the chosen grade band. */
export function destHref(id, band = "") {
  const d = DEST_BY_ID[id];
  if (!d) return "";
  const href = d.href.startsWith("/") ? d.href : `${BASE}/${d.href}`;
  return band && !href.startsWith("/access-teacher/")
    ? `${href}${href.includes("?") ? "&" : "?"}grades=${band}`
    : href;
}

/** The Resource Finder, opened for teachers (builder B's /search; extra params are optional filters). */
export function finderHref(band = "", extra = {}) {
  const p = new URLSearchParams({ for: "teacher", ...extra });
  if (band) p.set("grades", band);
  return `${BASE}/search?${p}`;
}

const row = (title, text, href, label) =>
  html`<li class="tc-link-row">
    <div><strong>${title}</strong><span class="fine">${text}</span></div>
    <a class="btn small" href="${href}">${label}</a>
  </li>`;

const destRow = (id, band, label) => {
  const d = DEST_BY_ID[id];
  return d ? row(d.title[0], d.text[0], destHref(id, band), label || "Open") : "";
};

/** "Find an Activity": one obvious action (the Resource Finder), then the finders already on this page. */
export function findTaskHTML(band) {
  return html`<div class="tc-workspace" id="tcFind" role="region" aria-labelledby="tc-tab-find">
    <div class="tc-ws-head">
      <div>
        <h3>Find an Activity</h3>
        <p class="fine">
          Search every activity, studio and printable by skill, grade band and time.
        </p>
      </div>
      <a class="btn btn-primary" href="${finderHref(band)}" data-tc-primary>
        ${icon("search")} Open the Resource Finder
      </a>
    </div>
    <ul class="tc-link-list">
      ${row("Activities with answer keys", "Browse this grade band here, open answer keys and build a playlist link.", "#activities", "Browse here")}
      ${row("Content library", "Every unit and passage, with what each one covers.", "#accContent", "Open library")}
      ${["3-5", "6-8"].includes(band) ? row("Practice tests", "Full tests in all four skills, with teacher keys.", "#tests", "See tests") : ""}
      ${row("Printables and Word downloads", "Student packets, answer-key Word files and printable pages.", "#printables", "See printables")}
    </ul>
  </div>`;
}

/** "Prepare for ACCESS": the Access Prep hub first, then the test-practice tools that already exist. */
export function prepareTaskHTML(band) {
  return html`<div
    class="tc-workspace"
    id="tcPrepare"
    role="region"
    aria-labelledby="tc-tab-prepare"
  >
    <div class="tc-ws-head">
      <div>
        <h3>Prepare for ACCESS</h3>
        <p class="fine">
          Classroom practice inspired by ACCESS. It is not an official WIDA test and gives no WIDA
          score.
        </p>
      </div>
      <a class="btn btn-primary" href="${destHref("access-prep", band)}" data-tc-primary>
        ${icon("tests")} Open Access Prep
      </a>
    </div>
    <ul class="tc-link-list">
      ${destRow("tests", band)} ${destRow("assess", band)} ${destRow("road", band)}
      ${row("Weekly links for class", "Post one Road to ACCESS link a week, with a family prompt.", "#weekly", "See weekly links")}
      ${["3-5", "6-8"].includes(band) ? destRow("daily-drill", band) : ""}
    </ul>
  </div>`;
}

/** Inside "Plan a Lesson": the other planning tools, one row of plain choices. `active` is the open sub-task. */
export function planToolsHTML(active, band) {
  const tab = (id, label) =>
    html`<button
      type="button"
      class="chip${active === id ? " is-on" : ""}"
      data-tc-action="${id}"
      aria-pressed="${String(active === id)}"
    >
      ${label}
    </button>`;
  return html`<nav class="tc-plan-tools" aria-label="Planning tools">
    ${tab("plan", "Build a lesson sequence")} ${tab("support", "Support a student")}
    ${tab("assign", "Assign practice")}
    <a class="chip" href="${destHref("lesson-builder", band)}"
      >Lesson Builder ${icon("arrow-right")}</a
    >
    <a class="chip" href="#accAssign">Assignment builder</a>
    <a class="chip" href="#journeyGuide">Mission guide</a>
  </nav>`;
}
