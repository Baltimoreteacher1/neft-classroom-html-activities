// My First Lesson Kit: the five components on screen (A guide, B student card, C projection, D supports, E quick
// reference), the export actions, and the full-screen projection view. The student card and projection view contain no
// teacher notes and no tour navigation. `L` is the lesson from lesson.js.
import { qrSvg } from "../../../../shared/qr/qr-code.mjs";
import { BASE, html, icon, raw } from "../../util.js";
import { QUICK_TASKS, MORE_RESOURCES, pageUrl } from "./quickref.js";
import { qrFits } from "./ui.js";

export const KIT_TABS = [
  { id: "guide", letter: "A", name: "Teacher Lesson Guide" },
  { id: "card", letter: "B", name: "Student Activity Card" },
  { id: "projection", letter: "C", name: "Projection View" },
  { id: "support", letter: "D", name: "Support and Feedback Card" },
  { id: "quick", letter: "E", name: "Quick Reference" },
];

const picture = (p) =>
  p ? html`<img class="t2-pic" src="${BASE}/${p.src}" alt="${p.alt}" />` : "";
const qr = (url, px, title) =>
  qrFits(url) ? raw(qrSvg(url, { px, label: `QR code for the student link to ${title}` })) : "";

export function guideCard(L) {
  return html`<article class="t2-paper">
    <h2>${L.title}</h2>
    <p class="t2-note">
      ${L.gradeLabel} · ${L.domainLabel} · ${L.minutes} minutes · ${L.resource.where}
    </p>
    <h3>Learning target</h3>
    <p><strong>${L.target}</strong></p>
    <h3>Prepare</h3>
    <ul>
      ${L.prep.map((p) => html`<li>${p}</li>`)}
    </ul>
    <h3>Lesson steps</h3>
    ${L.blocks.map(
      (b) =>
        html`<section class="t2-block">
          <h4><span class="t2-min">${b.minutes} min</span> ${b.name}</h4>
          <ul>
            ${b.steps.map((s) => html`<li>${s}</li>`)}
          </ul>
        </section>`,
    )}
    <h3>Teacher talk moves</h3>
    <ul>
      ${L.talkMoves.map((s) => html`<li>${s}</li>`)}
    </ul>
    <h3>Suggested scaffolds</h3>
    <p>${L.differentiation.lead}</p>
    <ul>
      ${L.differentiation.lines.map((s) => html`<li>${s}</li>`)}
    </ul>
    <h3>Evidence of learning</h3>
    <ul class="t2-check">
      ${L.evidence.map((c) => html`<li>${c}</li>`)}
    </ul>
    ${L.evidenceNote ? html`<p>${L.evidenceNote}</p>` : ""}
    <h3>Feedback and revision</h3>
    <ul>
      <li><strong>Strength:</strong> ${L.feedback.praise}</li>
      <li><strong>Next step:</strong> ${L.feedback.next}</li>
      <li><strong>Revise:</strong> ${L.feedback.revise}</li>
    </ul>
  </article>`;
}

/** The student-facing card: printable on its own (Print Student Card). */
export function studentCard(L) {
  const s = L.student;
  return html`<article class="t2-paper t2-student-card" aria-label="Student Activity Card">
    <p class="t2-eyebrow">The Language Page</p>
    <h2>${s.title}</h2>
    <h3>Directions</h3>
    <p class="t2-big">${s.directions}</p>
    <h3>Your task</h3>
    <p class="t2-big">${s.prompt}</p>
    ${s.expected ? html`<p>${s.expected}</p>` : ""}
    ${s.optional ? html`<p><strong>Need help?</strong> ${s.optional}</p>` : ""}
    <div class="t2-card-link">
      ${qr(s.url, 150, s.title)}
      <div>
        <p><strong>Scan the code or type the link:</strong></p>
        <p class="t2-url"><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a></p>
      </div>
    </div>
  </article>`;
}

/** Student-facing display for the projector. No teacher notes, no tour controls. */
export function projectionCard(L) {
  const p = L.projection;
  return html`<article class="t2-project" aria-label="Classroom projection view">
    <p class="t2-project-label">Today’s target</p>
    <h2>${p.target}</h2>
    <div class="t2-project-body">
      ${picture(p.picture)}
      <div>
        <p class="t2-project-dir">${p.directions}</p>
        <p class="t2-project-prompt">${p.prompt}</p>
        ${
          p.frames.length
            ? html`<ul class="t2-project-frames">
                ${p.frames.map((f) => html`<li>${f}</li>`)}
              </ul>`
            : ""
        }
      </div>
    </div>
    <div class="t2-card-link">
      ${qr(p.url, 150, L.student.title)}
      <div>
        <p><strong>Open the activity</strong></p>
        <p class="t2-url">${p.url.replace(/^https:\/\//, "")}</p>
      </div>
    </div>
  </article>`;
}

export function supportCard(L) {
  const c = L.supportCard;
  return html`<article class="t2-paper">
    <h2>${L.student.title}</h2>
    <h3>Academic vocabulary</h3>
    <ul>
      ${c.vocab.map((v) => html`<li><strong>${v.term}:</strong> ${v.def}</li>`)}
    </ul>
    <h3>Sentence frames and starters</h3>
    <ul>
      ${c.frames.map((f) => html`<li>${f}</li>`)}
    </ul>
    ${c.bank.length ? html`<p><strong>Word bank:</strong> ${c.bank.join(", ")}</p>` : ""}
    <h3>Modeling suggestion</h3>
    <p>${c.modeling}</p>
    <h3>Evidence checklist</h3>
    <ul class="t2-check">
      ${c.evidence.map((e) => html`<li>${e}</li>`)}
    </ul>
    <h3>Feedback example</h3>
    <p>${c.feedbackExample}</p>
    <h3>Revision or new-attempt prompt</h3>
    <p>${c.revisionPrompt}</p>
  </article>`;
}

export function quickCard() {
  return html`<article class="t2-paper">
    <h2>Your Quick Guide to The Language Page</h2>
    <ul class="t2-quick">
      ${QUICK_TASKS.map(
        (q) =>
          html`<li>
            <h3>${icon(q.icon)}${q.want}</h3>
            <p>${q.text}</p>
            <p>
              ${q.links.map((l) => html`<a href="${pageUrl(l.route)}" target="_blank" rel="noopener">${l.label}</a> `)}
            </p>
          </li>`,
      )}
    </ul>
    <h3>More teaching resources</h3>
    <ul>
      ${MORE_RESOURCES.map((l) => html`<li><a href="${pageUrl(l.route)}" target="_blank" rel="noopener">${l.label}</a></li>`)}
    </ul>
  </article>`;
}

const BODY = {
  guide: guideCard,
  card: studentCard,
  projection: projectionCard,
  support: supportCard,
  quick: quickCard,
};

export function kitScreen(L, ui) {
  const tab = KIT_TABS.some((t) => t.id === ui.kitTab) ? ui.kitTab : "guide";
  return {
    guide: html` <p class="t2-eyebrow">Your kit is ready</p>
      <h1 id="t2Title" tabindex="-1">My First Lesson with The Language Page</h1>
      <p class="t2-objective">
        <strong>You have:</strong> a timed ${L.minutes}-minute lesson, a real student activity, a
        link and QR code, a projector view, supports, and a quick guide.
      </p>
      <div class="t2-actions" role="group" aria-label="Lesson kit actions">
        <button type="button" class="btn btn-primary" data-t2="download-pdf">
          ${icon("download")}Download PDF
        </button>
        <button type="button" class="btn" data-t2="download-docx">
          ${icon("download")}Download Editable Lesson
        </button>
        <button type="button" class="btn" data-t2="copy-plan">
          ${icon("copy")}Copy Lesson Plan
        </button>
        <button type="button" class="btn" data-t2="copy-link">
          ${icon("copy")}Copy Student Link
        </button>
        <button type="button" class="btn" data-t2="print-card">
          ${icon("print")}Print Student Card
        </button>
        <button type="button" class="btn" data-t2="save-return">
          ${icon("bookmark")}Save and Return
        </button>
      </div>
      <p class="t2-note" data-t2-kit-note role="status">
        Saved in this browser on this device only. Downloads work anywhere.
      </p>
      <div class="t2-after">
        <button type="button" class="btn" data-t2="explore">
          ${icon("search")}Explore More Resources
        </button>
        <button type="button" class="t2-linkbtn" data-t2="another">Create another lesson</button>
      </div>`,
    stage: html` <div class="t2-tabs is-kit" role="tablist" aria-label="Lesson kit parts">
        ${KIT_TABS.map((t) => html`<button type="button" role="tab" id="t2tab-${t.id}" class="t2-tab" data-t2="kit-tab" data-t2-value="${t.id}" aria-selected="${String(t.id === tab)}" aria-controls="t2panel" tabindex="${t.id === tab ? 0 : -1}"><span aria-hidden="true">${t.letter}</span>${t.name}</button>`)}
      </div>
      <div id="t2panel" role="tabpanel" aria-labelledby="t2tab-${tab}" tabindex="0">
        ${BODY[tab](L)}
      </div>`,
  };
}
