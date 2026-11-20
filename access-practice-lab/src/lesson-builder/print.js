// Lesson Builder print sheet: a clean English plan (the lesson language) copied into a body-level host, the same
// pattern as the Launch Studio tickets, so the print stylesheet can hide everything else (lesson-builder.css).
import { bandLabel } from "../bands.js";
import { html, toHtml } from "../util.js";
import { FUNCTIONS, PHASES, SUPPORT_NOTE, SUPPORT_PROFILES } from "./rules.js";

/** Print a clean English plan (the lesson language) in a body-level host like the Launch Studio tickets. */
export function lessonPlanHTML(lesson, { rowById, phaseHref, origin = globalThis.location?.origin || "" }) {
  const s = lesson.settings;
  const fn = FUNCTIONS[s.fn];
  const body = html`<article class="lb-print" lang="en">
    <h1>Lesson plan: ${fn.label[0]} · ${s.minutes} minutes</h1>
    <p>
      ${bandLabel(s.band)} · ${s.domains.join(", ")} · WIDA Key Language Use: ${fn.klu} ·
      ${SUPPORT_PROFILES[s.support].name[0]} support${s.topic ? ` · Topic: ${s.topic}` : ""}
    </p>
    <p><strong>Content objective:</strong> ${lesson.objectives.content}</p>
    <p><strong>Language objective:</strong> ${lesson.objectives.language}</p>
    <ol>
      ${lesson.phases.map((p) => {
        const row = rowById(p.activityId);
        const href = phaseHref(p);
        return html`<li>
          <h2>${PHASES[p.key].name[0]} (${p.minutes ? `${p.minutes} min` : "at home"})</h2>
          ${row ? html`<p><strong>Activity:</strong> ${row.title} (${row.domain}, ${row.minutes || "—"} min) — ${origin}${href}</p>` : p.key === "family" ? html`<p><strong>Link:</strong> ${origin}${href}</p>` : ""}
          <p><strong>Teacher:</strong> ${p.teacher}</p>
          <p><strong>Students:</strong> ${p.student}</p>
          ${p.key === "vocabulary" ? html`<p><strong>Words:</strong> ${p.words.join(", ")}</p>` : ["opening", "guided", "task", "exit"].includes(p.key) ? html`<p><strong>Frames:</strong> ${p.frames.join(" / ")}</p>` : ""}
        </li>`;
      })}
    </ol>
    <p class="lb-print-note">
      ${SUPPORT_NOTE[0]} Student progress stays on each student's device unless the class tools are
      used.
    </p>
  </article>`;
  return body;
}

export function printLessonPlan(lesson, options) {
  const body = lessonPlanHTML(lesson, options);
  let host = document.getElementById("lessonPrint");
  if (!host) {
    host = Object.assign(document.createElement("div"), { id: "lessonPrint" });
    document.body.append(host);
  }
  host.innerHTML = toHtml(body);
  document.body.dataset.printing = "lesson";
  const done = () => {
    delete document.body.dataset.printing;
    host.replaceChildren();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
