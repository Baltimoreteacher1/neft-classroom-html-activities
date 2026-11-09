// Phonics Path home: the three levels, their units, per-unit progress, a resume card, and a scope-and-sequence table.
import { BAND_INFO, isEarlyBand } from "../bands.js";
import { BASE, html, icon } from "../util.js";
import { lessonHref, loadReadingState, stateFor } from "./player.js";
import { LEVELS, READING_LESSONS, unitsOf } from "./sequence.js";

const LABELS = {
  model: "Learn",
  build: "Build",
  read: "Decode",
  sort: "Sort",
  spell: "Spell",
  text: "Read",
  dictation: "Write",
  transfer: "Apply",
};
const status = (s) =>
  s.doneAt
    ? "Completed on this device"
    : s.phase !== "model"
      ? `In progress: ${LABELS[s.phase] || "Learn"}`
      : "Ready to start";
const meter = (done, total, label) =>
  html`<div
    class="sor2-meter"
    role="img"
    aria-label="${label}: ${done} of ${total} lessons complete"
  >
    <span style="width:${total ? Math.round((done / total) * 100) : 0}%"></span>
  </div>`;

/** The lesson to offer next: the one touched most recently and unfinished, else the first unfinished one. */
function resumeTarget(all) {
  const started = READING_LESSONS.filter(
    (l) => !stateFor(all, l.id).doneAt && stateFor(all, l.id).updatedAt,
  ).sort((a, b) => stateFor(all, b.id).updatedAt.localeCompare(stateFor(all, a.id).updatedAt));
  return started[0] || READING_LESSONS.find((l) => !stateFor(all, l.id).doneAt) || null;
}

function lessonCard(lesson, all, band) {
  const s = stateFor(all, lesson.id);
  const verb = s.doneAt
    ? "Review lesson"
    : s.phase !== "model"
      ? "Continue lesson"
      : "Start lesson";
  return html`<article class="sor2-path-card ${s.doneAt ? "is-done" : ""}">
    <span class="eyebrow">Lesson ${lesson.n}</span>
    <h4>${lesson.title}</h4>
    <p>${lesson.objective}</p>
    <p class="fine">${status(s)}</p>
    <a class="btn btn-primary" href="${lessonHref(lesson.id, band)}"
      >${verb} ${icon("arrow-right")}</a
    >
  </article>`;
}

function unitSection(unit, all, band) {
  const done = unit.lessons.filter((l) => stateFor(all, l.id).doneAt).length;
  return html`<section class="sor2-unit" id="${unit.id}" aria-labelledby="${unit.id}-h">
    <header>
      <h3 id="${unit.id}-h">${unit.title}</h3>
      <p>${unit.summary}</p>
      <ul class="sor2-skills" aria-label="Skills in this unit">
        ${unit.skills.map((skill) => html`<li>${skill}</li>`)}
      </ul>
      <p class="fine">${done} of ${unit.lessons.length} lessons complete</p>
      ${meter(done, unit.lessons.length, unit.title)}
    </header>
    <div class="sor2-path">${unit.lessons.map((lesson) => lessonCard(lesson, all, band))}</div>
  </section>`;
}

function scopeTable() {
  return html`<details class="sor2-scope">
    <summary>Scope and sequence (all three levels)</summary>
    <table>
      <caption>
        Phonics Path scope and sequence
      </caption>
      <thead>
        <tr>
          <th scope="col">Level</th>
          <th scope="col">Unit</th>
          <th scope="col">Lessons</th>
        </tr>
      </thead>
      <tbody>
        ${LEVELS.flatMap((level) =>
          unitsOf(level).map(
            (unit) =>
              html`<tr>
                <th scope="row">${level.title} · ${level.grade}</th>
                <td><b>${unit.title}</b><br />${unit.skills.join(" · ")}</td>
                <td>${unit.lessons.map((l) => l.title).join("; ")}</td>
              </tr>`,
          ),
        )}
      </tbody>
    </table>
    <p class="fine">Use your browser's print command to print this table for planning.</p>
  </details>`;
}

export function readingPathHTML(ctx) {
  const band = ctx.band;
  const all = loadReadingState();
  const older = band === "6-8";
  const early = isEarlyBand(band);
  const total = READING_LESSONS.length;
  const complete = READING_LESSONS.filter((l) => stateFor(all, l.id).doneAt).length;
  const resume = resumeTarget(all);
  const rs = resume ? stateFor(all, resume.id) : null;
  return {
    title: "Phonics Path · The Language Page",
    html: html`<main class="sor2-shell">
      ${early ? html`<a href="${BASE}/early?grades=${BAND_INFO[band].picker}">${icon("arrow-left")} My practice home</a>` : html`<a href="${BASE}/science-of-reading?grades=${band}">${icon("arrow-left")} Science of Reading Studio</a>`}
      <p class="eyebrow">Structured literacy · original lessons</p>
      <h1>Phonics Path</h1>
      <p>
        Three levels of explicit, systematic phonics. Every lesson teaches one pattern with a clear
        model, sound boxes, word reading, a word sort, spelling, a short connected text, a dictated
        sentence, and an independent new word. Start with the level that fits, or begin anywhere.
      </p>
      <p class="sor2-note">
        ${early ? "Grown-ups can sit with you. Tap the speaker buttons to hear words. Start at Level 1 and take one lesson at a time." : older ? "Older learner route: mature presentation and direct access to prefixes, suffixes, and syllable patterns in Level 3. Your English language level does not determine your decoding lesson." : "New to this? Start at Level 1. Already reading short words with ease? Jump to the level that matches the patterns you need."}
      </p>
      <section class="sor2-resume" aria-label="Your progress">
        <div>
          <p class="eyebrow">${complete} of ${total} lessons complete</p>
          ${meter(complete, total, "Phonics Path")}
          ${resume ? html`<p><strong>${rs.updatedAt ? "Pick up where you left off" : "Start here"}:</strong> ${resume.title} <span class="fine">(${resume.levelTitle} · ${resume.unit})</span></p>` : html`<p><strong>You finished the whole path.</strong> Review any lesson you want.</p>`}
        </div>
        ${resume ? html`<a class="btn btn-primary" href="${lessonHref(resume.id, band)}">${rs.updatedAt ? "Continue" : "Start"} ${icon("arrow-right")}</a>` : ""}
      </section>
      <nav class="sor2-levelnav" aria-label="Jump to a level">
        ${LEVELS.map((level) => html`<a href="#level-${level.level}"><b>${level.title}</b><span>${level.grade}</span></a>`)}
      </nav>
      ${LEVELS.map(
        (level) =>
          html`<section
            class="sor2-level"
            id="level-${level.level}"
            aria-labelledby="level-${level.level}-h"
          >
            <h2 id="level-${level.level}-h">${level.title} <small>${level.grade}</small></h2>
            <p class="lead">${level.blurb}</p>
            ${unitsOf(level).map((unit) => unitSection(unit, all, band))}
          </section>`,
      )}
      ${scopeTable()}
      <p class="disclaimer">
        This is a lesson sequence for practice. It does not assign a reading level or diagnose a
        disability. Work stays on this device unless you share it.
      </p>
    </main>`,
  };
}
