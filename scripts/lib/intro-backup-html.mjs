// Print markup for the Featured Lesson backup: page 1 for students (no teacher guidance), page 2 for the teacher.
import { html, raw, toHtml } from "../../access-practice-lab/src/util.js";

const lines = (n) =>
  raw(`<div class="ib-lines" aria-hidden="true">${"<span></span>".repeat(n)}</div>`);

function studentPage(s) {
  return html`<article class="ig-sheet ib-student" aria-labelledby="ib-h1">
    <header class="ib-head">
      <div><p class="ib-kicker">${s.subheading}</p><h1 id="ib-h1">${s.heading}</h1></div>
      <p class="ib-name"><span>Name</span><span class="ib-rule"></span></p>
    </header>
    <section class="ib-top" aria-label="Picture and task">
      <figure class="ib-pic"><img src="${s.picture.src}" alt="${s.picture.alt}" width="345" height="216"></figure>
      <div class="ib-task">
        <h2>${s.promptLabel}</h2>
        <p class="ib-prompt">${s.prompt}</p>
        <h2>${s.frameLabel}</h2>
        <p class="ib-frame">${s.frame}</p>
      </div>
    </section>
    <section class="ib-do" aria-labelledby="ib-do-h">
      <h2 id="ib-do-h">${s.directionsLabel}</h2>
      <ol>${s.directions.map((d) => html`<li>${d}</li>`)}</ol>
    </section>
    ${s.writing.map(
      (w) => html`<section class="ib-write" aria-labelledby="ib-w-${w.id}">
        <h2 id="ib-w-${w.id}">${w.label}</h2>${lines(w.lines)}
      </section>`,
    )}
    <footer class="ib-foot">
      <p><strong>${s.materialsLabel}:</strong> ${s.materials.join("; ")}.</p>
      <p><strong>Time:</strong> ${s.time}. <strong>${s.link.text}:</strong> <a href="${s.link.url}">${s.link.short}</a></p>
    </footer>
  </article>`;
}

function teacherPage(t) {
  return html`<article class="ig-sheet ib-teacher" aria-labelledby="ib-h2">
    <header class="ig-run"><p class="ig-runtitle">The Language Page Featured Lesson backup</p><p class="ig-pg">Page 2 of 2: teacher page</p></header>
    <h2 id="ib-h2" class="ig-title">${t.heading}</h2>
    <p>${t.intro}</p>
    <p><strong>${t.objectiveLabel}:</strong> ${t.objective}</p>
    <h3>Five steps</h3>
    <ol class="ig-steps">${t.steps.map(
      (s) =>
        html`<li><span class="ig-n" aria-hidden="true">${s.n}</span><div><h4>${s.name} <span class="ig-min">${s.minutes} ${s.minutes === 1 ? "minute" : "minutes"}</span></h4><p>${s.direction}</p></div></li>`,
    )}</ol>
    <section class="ig-samples" aria-labelledby="ib-sample-h">
      <h3 id="ib-sample-h">Example learner work</h3>
      <div class="ig-cols">
        <div><h4>${t.sample.firstLabel}</h4><p class="ig-quote">${t.sample.first}</p></div>
        <div><h4>${t.sample.improvedLabel}</h4><p class="ig-quote">${t.sample.improved}</p></div>
      </div>
      <p class="ig-sampnote">${t.sample.note}</p>
    </section>
    <dl class="ig-facts">
      <div><dt>One feedback cue</dt><dd>${t.cue}</dd></div>
      <div><dt>Quick check</dt><dd>${t.check}</dd></div>
      <div><dt>Follow-up</dt><dd>${t.followUp}</dd></div>
    </dl>
    <section aria-labelledby="ib-sup-h">
      <h3 id="ib-sup-h">Three support choices</h3>
      <div class="ig-supports">${t.supports.map(
        (s) =>
          html`<section class="ig-sup" aria-label="${s.name}"><h4>${s.name}</h4><ul>${s.items.map((i) => html`<li>${i}</li>`)}</ul></section>`,
      )}</div>
    </section>
    <footer class="ig-foot">
      <p>${t.notes.join(" ")}</p>
      <p>${t.entrance.text}: <a href="${t.entrance.url}">${t.entrance.short}</a></p>
    </footer>
  </article>`;
}

export function backupBody(model) {
  return `<div class="ig ib">${toHtml(html`${studentPage(model.student)}${teacherPage(model.teacher)}`)}</div>`;
}
