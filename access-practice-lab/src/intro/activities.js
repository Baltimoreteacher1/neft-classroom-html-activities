// Activity Guide (/start/activities): how each curated activity is used, step by step, so a teacher can run it without
// opening several pages first. Content: activity-guide-data.js (steps, feedback, teaching moves, troubleshooting) and
// data.js (name, time, supports). The printed Activity Guide and the full Site Directory come from the same data.
import { html, icon, storage } from "../util.js";
import { ACTIVITIES, DOWNLOADS, SUPPLEMENTAL, absUrl } from "./data.js";
import { ACTIVITY_GUIDE } from "./activity-guide-data.js";
import { previewHTML } from "./preview.js";
import { withReturn } from "./return-bar.js";
import { teacherBand } from "./shell.js";
import { INTRO_KEY, loadIntro } from "./state.js";
import { copyWithNote, findActivity, labHref } from "./ui.js";

const ORDER = [...ACTIVITIES, ...SUPPLEMENTAL].map((a) => a.id);
const PATH_LABEL = { speaking: "Speaking", writing: "Writing", reading: "Reading", vocabulary: "Vocabulary" };

/** The deeper layer: why it works, feedback, built-in help vs teaching moves, before/during/after, troubleshooting. */
function deepHTML(g, a) {
  const support = a.builtIn
    ? html`<h4>Built into the activity</h4><ul>${a.builtIn.map((s) => html`<li>${s}</li>`)}</ul><h4>Teaching moves you add</h4><ul>${a.moves.map((s) => html`<li>${s}</li>`)}</ul>`
    : html`<h4>Built into the activity</h4><p>${a.supports}</p>`;
  return html`<div class="ag-deep">
    <section class="ag-why"><h3>Why it works</h3><p>${g.why}</p></section>
    <div class="ag-body">
      <section class="ag-side ag-feedback" aria-label="Feedback students get">
        <h3>Feedback students get</h3>
        <p>${g.feedback}</p>
        ${a.limits ? html`<p class="fine">${a.limits}</p>` : ""}
      </section>
      <section class="ag-side" aria-label="Help">${support}</section>
    </div>
    <dl class="ag-teach">
      <div><dt>Before</dt><dd>${g.teach.before}</dd></div>
      <div><dt>During</dt><dd>${g.teach.during}</dd></div>
      <div><dt>After</dt><dd>${g.teach.after}</dd></div>
    </dl>
    <section class="ag-stuck-wrap"><h3>If something goes wrong</h3>
      <dl class="ag-stuck">${g.stuck.map(([p, fix]) => html`<dt>${p}</dt><dd>${fix}</dd>`)}</dl>
    </section>
  </div>`;
}

function cardHTML(g, full) {
  const a = findActivity(g.id);
  const kind = a.pathway || a.area;
  return html`<article class="ag-card pw-${kind}" id="act-${g.id}" aria-labelledby="ag-${g.id}">
    <header class="ag-head">
      <span class="in-ic" aria-hidden="true">${icon(a.icon)}</span>
      <div>
        <p class="ag-kind">${PATH_LABEL[kind]} · ${a.where} · ${a.time}</p>
        <h2 id="ag-${g.id}">${a.name}</h2>
        <p>${a.does}</p>
      </div>
    </header>
    <section class="ag-steps" aria-label="How students use it">
      <h3>How students use it</h3>
      <ol>${g.steps.map((s) => html`<li>${s}</li>`)}</ol>
      <p class="fine"><strong>Getting there:</strong> ${g.open}</p>
    </section>
    <p class="in-actions">
      <a class="btn btn-primary" href="${withReturn(labHref(a.route), "activities")}">Open ${a.name}${icon("arrow-right")}</a>
      <button type="button" class="btn" data-ag-copy="${absUrl(a.route)}">${icon("copy")}Copy student link</button>
    </p>
    ${previewHTML(a)}
    ${full
      ? deepHTML(g, a)
      : html`<details class="in-more ag-more"><summary>Full detail: why it works, feedback, help, teaching moves, troubleshooting</summary>${deepHTML(g, a)}</details>`}
  </article>`;
}

export async function render() {
  const full = loadIntro().agView === "full";
  const guides = ORDER.map((id) => ACTIVITY_GUIDE.find((g) => g.id === id)).filter(Boolean);
  return {
    title: "Activity Guide",
    html: html`<article class="in-page in-activities" aria-labelledby="introTitle">
      ${teacherBand({
        active: "activities",
        eyebrow: "Reference",
        title: "Activity Guide",
        lead: "How each activity works, step by step, with the buttons students will see. Read a card before you open the activity.",
        meta: html`<p class="ts-downloads">
          <a href="${DOWNLOADS.activityGuide.pdf}">${icon("download")}Activity Guide (PDF)</a>
          <a href="${DOWNLOADS.activityGuide.docx}">${icon("download")}Activity Guide (Word)</a>
          <a href="${DOWNLOADS.directory.pdf}">${icon("download")}Every activity on the site (PDF)</a>
        </p>`,
      })}
      <div class="ts-layout">
        <nav class="ts-rail ag-index" aria-label="Activities">
          <ol>
            ${guides.map((g) => {
              const a = findActivity(g.id);
              return html`<li><a href="#act-${g.id}"><span class="ts-num" aria-hidden="true">${icon(a.icon)}</span><span class="ts-step"><strong>${a.name}</strong><small>${PATH_LABEL[a.pathway || a.area]} · ${a.time}</small></span></a></li>`;
            })}
          </ol>
        </nav>
        <div class="ts-main">
          <div class="ag-view" role="group" aria-label="How much detail">
            <span>Show:</span>
            <button type="button" class="in-seg" data-ag-view="quick" aria-pressed="${!full}">Quick view</button>
            <button type="button" class="in-seg" data-ag-view="full" aria-pressed="${full}">Full detail</button>
            <span class="fine">Quick view keeps the steps; full detail adds why it works, feedback, help and troubleshooting.</span>
          </div>
          <section class="in-panel ag-basics" aria-labelledby="agBasics">
            <h2 id="agBasics">Every activity works the same way</h2>
            <ol class="ag-basics-list">
              <li><strong>Open the link.</strong> No student account. Work saves in that browser on that device.</li>
              <li><strong>Choose the help.</strong> Frames, word banks and models are there when a student wants them.</li>
              <li><strong>Try, check, try again.</strong> Checks and coach notes say what to improve. Nothing is a grade or a WIDA level.</li>
              <li><strong>Recording is optional.</strong> The microphone is asked for only when a student presses Record. Partner talk works too.</li>
            </ol>
          </section>
          ${guides.map((g) => cardHTML(g, full))}
          <p class="fine" role="status" data-ag-note></p>
        </div>
      </div>
    </article>`,
  };
}

export function onClick(e, ctx) {
  const view = e.target.closest?.("[data-ag-view]");
  if (view) {
    const all = loadIntro();
    storage.set(INTRO_KEY, JSON.stringify({ ...all, agView: view.dataset.agView }));
    ctx.rerender();
    return true;
  }
  const btn = e.target.closest?.("[data-ag-copy]");
  if (!btn) return false;
  copyWithNote(btn.dataset.agCopy, document.querySelector("[data-ag-note]"));
  return true;
}
