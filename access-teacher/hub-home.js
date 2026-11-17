// Teacher Hub home rows under the five tasks (access-teacher/hub-home.js):
//   "Quick classroom tools" — one row of plain links to tools a teacher opens mid-lesson;
//   "My workspace"          — what this device already saved: lesson pathways, saved resources, classes, books,
//                             Experience Builder projects and recently opened pages (was the "My Resources" task).
// It also marks this browser as a teacher's (accessPracticeLab:v1:audience) so the lab can offer "Back to Teacher Hub",
// and keeps every link's ?grades= in step with the band chosen above (the `th:band` event from command-center.js).
import { rememberAudience } from "/access-practice-lab/src/audience.js";
import { DESTINATIONS } from "/access-practice-lab/src/sitemap.js";
import {
  BASE,
  announce,
  copyText,
  html,
  icon,
  safeJson,
  storage,
  toHtml,
} from "/access-practice-lab/src/util.js";
import { deleteSavedPathway, hubBand, readSavedPathways } from "/access-teacher/command-center.js";
import { destHref, finderHref } from "/access-teacher/hub-tasks.js";
import { readSaved, toggleSaved } from "/access-practice-lab/src/finder/saved.js";

const host = document.getElementById("thHome");
let band = hubBand();
let note = "";

rememberAudience("teacher");

/** The quick tools: skill practice and games come from the lab's route list; the rest are finder filters or this page. */
function quickTools() {
  return [
    { label: "Five-minute practice", href: finderHref(band, { time: "5" }), ico: "clock" },
    { label: "Listening", href: destHref("listening", band), ico: "listening" },
    { label: "Speaking", href: destHref("speaking", band), ico: "speaking" },
    { label: "Reading", href: destHref("reading-practice", band), ico: "reading" },
    { label: "Writing", href: destHref("writing", band), ico: "writing" },
    {
      label: "Printable activities",
      href: finderHref(band, { format: "printable" }),
      ico: "print",
    },
    { label: "Interactive games", href: destHref("games", band), ico: "worlds" },
    { label: "Class code and student links", href: "#liveClass", ico: "classroom" },
  ];
}

const abs = (href) => new URL(href, location.origin).href;

const itemRow = (title, meta, href, extra = "") =>
  html`<li class="th-ws-row">
    <div><strong>${title}</strong>${meta ? html`<span class="fine">${meta}</span>` : ""}</div>
    <div class="th-ws-actions">
      <a class="btn small" href="${href}">Open</a>
      <button type="button" class="ghost small" data-ws-copy="${href}">
        ${icon("copy")} Copy link
      </button>
      ${extra}
    </div>
  </li>`;

function workspaceHTML() {
  const pathways = readSavedPathways();
  // The finder's saved list (src/finder/saved.js). Read defensively: only same-site links, made absolute.
  const saved = readSaved()
    .filter((r) => typeof r.title === "string" && /^(\/(?!\/)|[\w-])/.test(r.href) && !/^\w+:/.test(r.href))
    .map((r) => ({ ...r, href: r.href.startsWith("/") ? r.href : `${BASE}/${r.href}` }));
  const recentIds = safeJson(storage.get("accessPracticeLab:v1:exploreRecent"), []);
  const recent = (Array.isArray(recentIds) ? recentIds : [])
    .map((r) => DESTINATIONS.find((d) => d.id === r?.id))
    .filter(Boolean)
    .slice(0, 4);
  const classes = safeJson(storage.get("accessPracticeLabClass:v1:teacher-classes"), []);
  const nClasses = Array.isArray(classes) ? classes.length : 0;
  const nExps = Object.keys(
    safeJson(storage.get("accessPracticeLab:v1:experiences"), {})?.items || {},
  ).length;
  const empty = !pathways.length && !saved.length && !recent.length;
  return html`<h2 id="thWorkspaceTitle" tabindex="-1">My workspace</h2>
    <p class="fine">Saved in this browser on this device. Nothing is uploaded.</p>
    ${empty ? html`<p class="th-ws-empty">Nothing saved yet. Lessons you plan and resources you save appear here.</p>` : ""}
    ${
      pathways.length || saved.length
        ? html`<ul class="th-ws-list" aria-label="Saved lessons and resources">
            ${pathways.map((p) =>
              itemRow(
                p.title,
                `Lesson pathway · Grades ${p.band} · ${p.stages?.length || 5} stages`,
                p.playlistUrl,
                html`<button type="button" class="ghost small" data-ws-del-pw="${p.id}">
                  Remove
                </button>`,
              ),
            )}
            ${saved.map((r) =>
              itemRow(
                r.title,
                "Saved resource",
                r.href,
                html`<button type="button" class="ghost small" data-ws-unsave="${r.id}">
                  Remove
                </button>`,
              ),
            )}
          </ul>`
        : ""
    }
    ${
      recent.length
        ? html`<h3 class="th-ws-sub">Recently opened</h3>
            <ul class="th-ws-list">
              ${recent.map((d) => itemRow(d.title[0], d.text[0], destHref(d.id)))}
            </ul>`
        : ""
    }
    <ul class="th-ws-links" aria-label="Your class and your creations">
      <li>
        <a href="#liveClass"
          >${icon("classroom")} Live class and roster${nClasses ? ` (${nClasses})` : ""}</a
        >
      </li>
      <li><a href="${BASE}/book-studio">${icon("library")} My books (Book Studio)</a></li>
      <li>
        <a href="${BASE}/experience-builder"
          >${icon("sparkle")} Experience Builder projects${nExps ? ` (${nExps})` : ""}</a
        >
      </li>
    </ul>
    ${note ? html`<p class="fine" role="status">${note}</p>` : ""}`;
}

function render() {
  if (!host) return;
  host.innerHTML = toHtml(
    html`<section class="th-quick" aria-labelledby="thQuickTitle">
        <h2 id="thQuickTitle">Quick classroom tools</h2>
        <ul class="th-quick-row">
          ${quickTools().map(
            (t) =>
              html`<li>
                <a class="th-quick-tool" href="${t.href}">${icon(t.ico)} ${t.label}</a>
              </li>`,
          )}
        </ul>
      </section>
      <section class="th-workspace" id="saved" aria-labelledby="thWorkspaceTitle">
        ${workspaceHTML()}
      </section>`,
  );
  for (const a of document.querySelectorAll("[data-finder-link]")) a.href = finderHref(band);
}

host?.addEventListener("click", async (e) => {
  const copy = e.target.closest("[data-ws-copy]");
  if (copy) {
    const url = abs(copy.dataset.wsCopy);
    note = (await copyText(url)) ? `Link copied: ${url}` : `Copy this link: ${url}`;
    announce(note);
    return render();
  }
  const del = e.target.closest("[data-ws-del-pw]");
  if (del) {
    deleteSavedPathway(del.dataset.wsDelPw);
    note = "Removed the saved pathway from this device.";
    render();
    return host.querySelector("#thWorkspaceTitle")?.focus();
  }
  const unsave = e.target.closest("[data-ws-unsave]");
  if (unsave) {
    const item = readSaved().find((x) => x.id === unsave.dataset.wsUnsave);
    if (item) toggleSaved(item);
    note = "Removed from My workspace.";
    render();
    return host.querySelector("#thWorkspaceTitle")?.focus();
  }
});

document.addEventListener("th:band", (e) => {
  band = e.detail?.band || band;
  render();
});
// A save anywhere on the page (Plan a Lesson, the activity list) shows up here without a reload.
storage.subscribe?.((key) => {
  if (/savedPathways|v1:saved$/.test(String(key))) render();
});

render();
