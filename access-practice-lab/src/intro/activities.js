// Activity Guide (/start/activities): how each activity for the teacher's grade choice is used, step by step, so a
// teacher can run it without opening several pages first. The cards come from buildActivityGuideModel(pick)
// (activity-guide-model.js), the same model as the printed Activity Guide for that grade, so screen and paper agree.
import { html, icon, storage } from "../util.js";
import { bandPickerHTML, onBandClick, teacherPick } from "./band.js";
import { DOWNLOADS, absUrl } from "./data.js";
import { buildActivityGuideModel } from "./activity-guide-model.js";
import { bindGuide, guideHTML } from "./guide.js";
import { previewHTML } from "./preview.js";
import { printFiles } from "./quick-guide-files.js";
import { withReturn } from "./return-bar.js";
import { teacherBand } from "./shell.js";
import { INTRO_KEY, loadIntro } from "./state.js";
import { copyWithNote, labHref } from "./ui.js";

/** The deeper layer: why it works, feedback, built-in help vs teaching moves, before/during/after, troubleshooting. */
function deepHTML(c) {
  return html`<div class="ag-deep">
    <section class="ag-why">
      <h3>Why it works</h3>
      <p>${c.why}</p>
    </section>
    <div class="ag-body">
      <section class="ag-side ag-feedback" aria-label="Feedback students get">
        <h3>Feedback students get</h3>
        <p>${c.feedback}</p>
        ${c.limits ? html`<p class="fine">${c.limits}</p>` : ""}
      </section>
      <section class="ag-side" aria-label="Help">
        <h4>Built into the activity</h4>
        <ul>
          ${c.builtIn.map((s) => html`<li>${s}</li>`)}
        </ul>
        ${
          c.moves.length
            ? html`<h4>Teaching moves you add</h4>
                <ul>
                  ${c.moves.map((s) => html`<li>${s}</li>`)}
                </ul>`
            : ""
        }
      </section>
    </div>
    <dl class="ag-teach">
      <div>
        <dt>Before</dt>
        <dd>${c.teach.before}</dd>
      </div>
      <div>
        <dt>During</dt>
        <dd>${c.teach.during}</dd>
      </div>
      <div>
        <dt>After</dt>
        <dd>${c.teach.after}</dd>
      </div>
    </dl>
    <section class="ag-stuck-wrap">
      <h3>If something goes wrong</h3>
      <dl class="ag-stuck">
        ${c.stuck.map(
          (s) =>
            html`<dt>${s.problem}</dt>
              <dd>${s.fix}</dd>`,
        )}
      </dl>
    </section>
  </div>`;
}

function cardHTML(c, full) {
  return html`<article class="ag-card ${c.cls}" id="act-${c.id}" aria-labelledby="ag-${c.id}">
    <header class="ag-head">
      <span class="in-ic" aria-hidden="true">${icon(c.icon)}</span>
      <div>
        <p class="ag-kind">${c.kind} · ${c.where} · ${c.time}</p>
        <h2 id="ag-${c.id}">${c.name}</h2>
        <p>${c.does}</p>
      </div>
    </header>
    <section class="ag-steps" aria-label="How students use it">
      <h3>How students use it</h3>
      <ol>
        ${c.steps.map((s) => html`<li>${s}</li>`)}
      </ol>
      <p class="fine"><strong>Getting there:</strong> ${c.open}</p>
    </section>
    <p class="in-actions">
      <a class="btn btn-primary" href="${withReturn(labHref(c.link.route), "activities")}"
        >Open ${c.name}${icon("arrow-right")}</a
      >
      <button type="button" class="btn" data-ag-copy="${absUrl(c.link.route)}">
        ${icon("copy")}Copy student link
      </button>
    </p>
    ${c.preview ? previewHTML({ preview: c.preview, name: c.name }) : ""}
    ${
      full
        ? deepHTML(c)
        : html`<details class="in-more ag-more">
            <summary>
              Full detail: why it works, feedback, help, teaching moves, troubleshooting
            </summary>
            ${deepHTML(c)}
          </details>`
    }
  </article>`;
}

export async function render(ctx) {
  const pick = teacherPick(ctx);
  const model = buildActivityGuideModel(pick);
  const files = printFiles(model.pick);
  const full = loadIntro().agView === "full";
  return {
    title: "Activity Guide",
    html: html`<article class="in-page in-activities" aria-labelledby="introTitle">
      ${teacherBand({
        active: "activities",
        eyebrow: `Reference · ${model.grade}`,
        title: "Activity Guide",
        lead: `How each ${model.grade} activity works, step by step, with the buttons students will see. Read a card before you open the activity.`,
        meta: html`<p class="ts-downloads">
          <a href="${files.activityGuide.pdf}"
            >${icon("download")}Activity Guide, ${model.grade} (PDF)</a
          >
          <a href="${files.activityGuide.docx}"
            >${icon("download")}Activity Guide, ${model.grade} (Word)</a
          >
          <a href="${DOWNLOADS.directory.pdf}"
            >${icon("download")}Every activity on the site (PDF)</a
          >
        </p>`,
      })}
      <div class="ts-layout">
        <nav class="ts-rail ag-index" aria-label="Activities">
          <ol>
            ${model.cards.map(
              (c) =>
                html`<li>
                  <a href="#act-${c.id}"
                    ><span class="ts-num" aria-hidden="true">${icon(c.icon)}</span
                    ><span class="ts-step"
                      ><strong>${c.name}</strong><small>${c.kind} · ${c.time}</small></span
                    ></a
                  >
                </li>`,
            )}
          </ol>
        </nav>
        <div class="ts-main">
          ${bandPickerHTML(model.pick, { hint: "The cards and the printed guide change to match your grades." })}
          <div class="ag-view" role="group" aria-label="How much detail">
            <span>Show:</span>
            <button
              type="button"
              class="in-seg"
              data-ag-view="quick"
              aria-pressed="${String(!full)}"
            >
              Quick view
            </button>
            <button type="button" class="in-seg" data-ag-view="full" aria-pressed="${String(full)}">
              Full detail
            </button>
            <span class="fine"
              >Quick view keeps the steps; full detail adds why it works, feedback, help and
              troubleshooting.</span
            >
          </div>
          <section class="in-panel ag-basics" aria-labelledby="agBasics">
            <h2 id="agBasics">Every activity works the same way</h2>
            <ol class="ag-basics-list">
              ${model.howTo.points
                .slice(0, 4)
                .map(([head, text]) => html`<li><strong>${head}.</strong> ${text}</li>`)}
            </ol>
          </section>
          ${model.cards.map((c) => cardHTML(c, full))}
          <p class="fine" role="status" data-ag-note></p>
          <div class="ag-guide">
            ${guideHTML({
              say: `These are the ${model.grade} activities, one for each language domain. Open a card’s full detail when you want the why, the feedback and the fixes.`,
              chips: ["scored", "mic", "share", "account"],
              context: { page: "start", step: "Activity Guide", pick: model.pick },
            })}
          </div>
        </div>
      </div>
    </article>`,
  };
}

export const mount = () => bindGuide();

export function onClick(e, ctx) {
  if (onBandClick(e, ctx)) return true;
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
