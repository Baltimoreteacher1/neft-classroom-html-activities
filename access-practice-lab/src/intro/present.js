// Presenter view (/start/present): the 30-minute introduction as one slide at a time, driven by the same data as the
// printed notes (presenter-notes.js, data.js). Teachers see a clean segment; the presenter can show the notes under it.
// The live site stays the main demonstration surface: every segment has one button that opens the exact page to show.
// Slides: 0 before you start, 1-6 the timed segments, 7 handoff to the 20-minute exploration. Arrow keys move.
import { qrSvg } from "../../../shared/qr/qr-code.mjs";
import { html, icon, raw } from "../util.js";
import { ENTRANCE, PRESENTER_SCHEDULE, ROUTES } from "./data.js";
import { BACKUP_ALL, HANDOFF, PRESENTER_NOTES, ROOM_SETUP } from "./presenter-notes.js";
import { updateIntro, loadIntro } from "./state.js";
import { progressHTML, teacherBand } from "./shell.js";
import { labHref } from "./ui.js";
import { withReturn } from "./return-bar.js";

const TOTAL = PRESENTER_NOTES.length + 2;
const presentHref = (n, notes) => `${labHref(ROUTES.present)}?stop=${n + 1}${notes ? "&focus=notes" : ""}`;
const ACTIVITY_ROUTE = /^\/(voice|speak|scaffold|write)\b/;
const openHref = (route) => (ACTIVITY_ROUTE.test(route) ? withReturn(labHref(route), "present") : labHref(route));
const list = (items) => html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`;

const qrBlock = () =>
  html`<figure class="in-qr">${raw(qrSvg(ENTRANCE.url, { px: 168, label: `QR code for ${ENTRANCE.short}` }))}<figcaption>One link for everything: <strong>${ENTRANCE.short}</strong></figcaption></figure>`;

function setupSlide() {
  return html`<h2 id="slideTitle">Before you start</h2>
    <ol>${ROOM_SETUP.map((s) => html`<li>${s}</li>`)}</ol>
    <h3>If something fails</h3>
    <dl class="in-backups">${Object.values(BACKUP_ALL).map((b) => html`<dt>${b.problem}</dt><dd>${list(b.steps)}</dd>`)}</dl>
    ${qrBlock()}`;
}

function segmentSlide(seg, i) {
  const sched = PRESENTER_SCHEDULE[i];
  return html`<p class="in-range">Minutes ${seg.range}</p>
    <h2 id="slideTitle">${seg.title}</h2>
    <p class="in-big">${sched.presenter}</p>
    <h3>Teachers</h3><p class="in-big">${sched.teachers}</p>
    <p><a class="btn btn-primary btn-big" href="${openHref(seg.route)}">${seg.openLabel}${icon("arrow-right")}</a></p>
    ${i === 0 ? qrBlock() : ""}`;
}

function handoffSlide() {
  return html`<p class="in-range">Minute ${HANDOFF.range}</p>
    <h2 id="slideTitle">${HANDOFF.title}</h2>
    <p class="in-big">${HANDOFF.say[0]}</p>
    <p><a class="btn btn-primary btn-big" href="${labHref(HANDOFF.route)}">${HANDOFF.openLabel}${icon("arrow-right")}</a></p>
    ${qrBlock()}`;
}

function notesHTML(n) {
  if (n === 0)
    return html`<p>Open one tab only. Test sound once. Print the guide and the lesson backup.</p>`;
  const seg = n === TOTAL - 1 ? { ...HANDOFF, teachersDo: [], watchFor: "", backup: "" } : PRESENTER_NOTES[n - 1];
  return html`<h3>Say</h3>${list(seg.say)}
    <h3>You do</h3>${list(seg.presenterDoes)}
    ${seg.teachersDo?.length ? html`<h3>Teachers do</h3>${list(seg.teachersDo)}` : ""}
    ${seg.watchFor ? html`<h3>Watch for</h3><p>${seg.watchFor}</p>` : ""}
    ${seg.backup ? html`<h3>Backup</h3><p>${seg.backup}</p>` : ""}`;
}

export async function render(ctx) {
  const asked = Number.parseInt(ctx.route.stop, 10);
  const saved = loadIntro().present?.slide;
  const n = Math.min(TOTAL - 1, Math.max(0, Number.isFinite(asked) ? asked - 1 : Number.isInteger(saved) ? saved : 0));
  updateIntro("present", (p) => ({ ...p, slide: n }));
  const notes = ctx.route.focus === "notes";
  const body = n === 0 ? setupSlide() : n === TOTAL - 1 ? handoffSlide() : segmentSlide(PRESENTER_NOTES[n - 1], n - 1);
  return {
    title: "Presenter view",
    html: html`<article class="in-page in-present" aria-labelledby="introTitle">
        ${teacherBand({
          active: "present",
          eyebrow: "30-minute introduction",
          title: "Presenter view",
          size: "compact",
          meta: progressHTML(n, TOTAL, `Slide ${n + 1} of ${TOTAL}`),
        })}
        <section class="in-panel in-slide" aria-labelledby="slideTitle" aria-live="polite">${body}</section>
        <nav class="in-nav" aria-label="Slide controls">
          ${n > 0 ? html`<a class="btn" href="${presentHref(n - 1, notes)}">${icon("arrow-left")}Previous</a>` : html`<span></span>`}
          <a class="btn ghost" href="${presentHref(n, !notes)}">${notes ? "Hide presenter notes" : "Show presenter notes"}</a>
          ${n < TOTAL - 1 ? html`<a class="btn btn-primary" href="${presentHref(n + 1, notes)}">Next${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${labHref(ROUTES.explore)}">Start the exploration${icon("arrow-right")}</a>`}
        </nav>
        ${notes ? html`<section class="in-panel in-notes" aria-labelledby="notesTitle"><h2 id="notesTitle">Presenter notes</h2>${notesHTML(n)}</section>` : ""}
        <p class="fine in-hint">Arrow keys move between slides. Nothing here is timed.</p>
      </article>`,
  };
}

export function onKey(e, ctx) {
  if (e.target.closest?.("input, textarea, select") || e.altKey || e.metaKey || e.ctrlKey) return;
  const n = Math.min(TOTAL - 1, Math.max(0, (loadIntro().present?.slide ?? 0) + (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0)));
  if (!["ArrowRight", "ArrowLeft"].includes(e.key) || n === loadIntro().present?.slide) return;
  ctx.navigate(presentHref(n, ctx.route.focus === "notes"));
}
