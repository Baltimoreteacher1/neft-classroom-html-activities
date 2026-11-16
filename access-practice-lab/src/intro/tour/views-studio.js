// Classroom Launch Studio: three screens inside the same tour shell (Confirm, Generate, Review and adjust).
// Same contract as views-steps.js: pure functions of (state, data, ui) returning { guide, stage }.
import { BASE, html, icon } from "../../util.js";
import { buildLesson, totalMinutes } from "./lesson.js";
import { APPROACHES, BANDS, DOMAINS, MINUTES, bandName, domainName, findRow } from "./model.js";
import { frameHTML, linkBox, seg } from "./ui.js";

export const STUDIO_TITLES = {
  1: "Confirm Your Lesson",
  2: "Generate My Lesson",
  3: "Review and Adjust",
};

/** The lesson for the current selection, or null while the activity record is still loading. */
export function currentLesson(D, S) {
  const res = findRow(D.rows, S.pick);
  const act = res ? D.act(S.pick) : null;
  return res && act
    ? buildLesson({
        res,
        act,
        minutes: S.lesson.minutes,
        approach: S.lesson.approach,
        edits: S.lesson.edits,
      })
    : null;
}

const guide = (S, objective, directions) =>
  html` <p class="t2-eyebrow">Classroom Launch Studio · Screen ${S.studioScreen} of 3</p>
    <h1 id="t2Title" tabindex="-1">${STUDIO_TITLES[S.studioScreen]}</h1>
    <p class="t2-objective"><strong>You will:</strong> ${objective}</p>
    <p class="t2-directions">${directions}</p>`;

const minutesSeg = (S) =>
  seg({
    label: "Lesson length",
    attr: "minutes",
    value: String(S.lesson.minutes),
    options: MINUTES.map((m) => ({ id: String(m), name: `${m} minutes` })),
    cls: "is-four",
  });
const approachSeg = (S) =>
  seg({
    label: "Support approach",
    attr: "approach",
    value: S.lesson.approach,
    options: APPROACHES.map((a) => ({ id: a.id, name: a.name })),
    cls: "is-four",
  });

/** Every activity for the chosen band and skill, so the teacher can swap the resource without leaving the studio. */
function resourcePicker(D, S) {
  const list = D.rows
    .filter((r) => r.band === S.pick.band && r.domain === S.pick.domain)
    .sort((a, b) => a.level.localeCompare(b.level) || a.title.localeCompare(b.title));
  return html`<label class="t2-field-label" for="t2Resource">Activity</label>
    <select id="t2Resource" class="t2-select" data-t2-select="resource">
      ${["A", "B", "C"].map((lv) => html`<optgroup label="${list.find((r) => r.level === lv)?.support || lv}">${list.filter((r) => r.level === lv).map((r) => html`<option value="${r.key}" ${r.key === `${S.pick.band}/${S.pick.domain}/${S.pick.level}/${S.pick.id}` ? "selected" : ""}>${r.title} (${r.minutes} min)</option>`)}</optgroup>`)}
    </select>`;
}

export function studio1(D, S) {
  return {
    guide: guide(
      S,
      "confirm the choices from your tour.",
      "Everything is filled in from the tour. Change anything you like.",
    ),
    stage: html` <div class="t2-confirm">
      ${seg({ label: "Grade band", attr: "sband", value: S.pick.band, options: BANDS.map((b) => ({ id: b.id, name: b.name })) })}
      ${seg({ label: "Skill", attr: "sdomain", value: S.pick.domain, options: DOMAINS.map((d) => ({ id: d.id, name: d.name })) })}
      <div class="t2-field">${resourcePicker(D, S)}</div>
      ${minutesSeg(S)} ${approachSeg(S)}
      <p class="t2-note">
        Supports start from your chosen activity’s level. These are classroom support choices, not
        WIDA levels.
      </p>
    </div>`,
  };
}

const COMPONENTS = (L) => [
  ["Learning target", L.target],
  ["Teacher launch", L.blocks.find((b) => b.id === "launch").steps[0]],
  ["Model", (L.blocks.find((b) => b.id === "model") || L.blocks[0]).steps.at(-1)],
  ["Student practice", L.blocks.find((b) => b.id === "practice").steps[0]],
  ["Differentiation", L.differentiation.lead],
  ["Evidence of learning", L.evidence[0] || ""],
  ["Feedback and revision", L.feedback.revise],
  ["Closing", L.closing],
];

export function studio2(D, S) {
  const L = currentLesson(D, S);
  if (!L)
    return {
      guide: guide(S, "see your lesson.", ""),
      stage: html`<p role="status">Building your lesson…</p>`,
    };
  const total = totalMinutes(L);
  return {
    guide: guide(
      S,
      "see the lesson built from your real activity.",
      `A ${L.minutes}-minute plan: ${L.blocks.map((b) => `${b.name} ${b.minutes}`).join(", ")}.`,
    ),
    stage: html` <div
        class="t2-timeline"
        role="img"
        aria-label="Lesson timing: ${L.blocks.map((b) => `${b.name} ${b.minutes} minutes`).join(", ")}. Total ${total} minutes."
      >
        ${L.blocks.map((b) => html`<span class="t2-seg-time" style="flex:${b.minutes}"><b>${b.minutes}</b> ${b.name}</span>`)}
      </div>
      <ul class="t2-gen">
        ${COMPONENTS(L).map(
          ([n, t]) =>
            html`<li>
              <h3>${n}</h3>
              <p>${t}</p>
            </li>`,
        )}
      </ul>
      <p class="t2-note">
        Built from “${L.resource.title}”: its prompt, frames, success criteria and hint. Press
        <strong>Review and Adjust</strong> to edit anything.
      </p>`,
  };
}

export function lessonPreview(L) {
  return html`<div class="t2-doc" data-t2-lesson>
    <h2>${L.title}</h2>
    <p class="t2-note">
      ${L.gradeLabel} · ${L.domainLabel} · ${L.minutes} minutes · ${L.resource.where}
    </p>
    <h3>Learning target</h3>
    <p>${L.target}</p>
    ${L.blocks.map(
      (b) =>
        html`<section class="t2-block">
          <h3><span class="t2-min">${b.minutes} min</span> ${b.name}</h3>
          <ul>
            ${b.steps.map((s) => html`<li>${s}</li>`)}
          </ul>
        </section>`,
    )}
    <h3>Language supports</h3>
    <p>${L.differentiation.lead}</p>
    <ul>
      ${L.differentiation.lines.map((s) => html`<li>${s}</li>`)}
    </ul>
    <h3>Evidence of learning</h3>
    <ul class="t2-check">
      ${L.evidence.map((c) => html`<li>${c}</li>`)}
    </ul>
  </div>`;
}

export function studio3(D, S, ui) {
  const L = currentLesson(D, S);
  if (!L)
    return {
      guide: guide(S, "adjust your lesson.", ""),
      stage: html`<p role="status">Building your lesson…</p>`,
    };
  const e = S.lesson.edits;
  const res = findRow(D.rows, S.pick);
  return {
    guide: guide(
      S,
      "make the lesson yours.",
      "Change the target or directions, supports, length or activity. The kit follows every change.",
    ),
    stage: html` <div class="t2-edit">
        <label class="t2-field-label" for="t2Target">Learning target (students see this)</label>
        <input
          id="t2Target"
          class="t2-input"
          type="text"
          maxlength="200"
          value="${e.target ?? L.target}"
          data-t2-input="target"
        />
        <label class="t2-field-label" for="t2Launch">Your launch directions</label>
        <textarea
          id="t2Launch"
          class="t2-input"
          rows="2"
          maxlength="300"
          data-t2-input="launch"
          placeholder="Write the target on the board and read it with students."
        >
${e.launch ?? ""}</textarea>
        <div class="t2-edit-grid">${minutesSeg(S)}${approachSeg(S)}</div>
        <div class="t2-field">${resourcePicker(D, S)}</div>
        <div class="t2-bar">
          <button
            type="button"
            class="btn"
            data-t2="toggle-ui"
            data-t2-value="student"
            aria-expanded="${String(ui.student)}"
          >
            ${icon("play")}Review the student activity
          </button>
          <button
            type="button"
            class="btn"
            data-t2="toggle-ui"
            data-t2-value="linkcheck"
            aria-expanded="${String(ui.linkcheck)}"
          >
            ${icon("check")}Check the student link
          </button>
        </div>
        ${ui.student ? html`<div class="t2-inline">${frameHTML(res)}<button type="button" class="btn" data-t2="toggle-ui" data-t2-value="student">${icon("close")}Close the activity</button></div>` : ""}
        ${
          ui.linkcheck
            ? html`<div class="t2-inline" role="status">
                <p class="t2-ok">
                  ${icon("check")}This link opens
                  <strong>${res.title}</strong> (${bandName(res.band)}, ${domainName(res.domain)})
                  directly in the student view. It contains no teacher or student information.
                </p>
                ${linkBox(res)}
              </div>`
            : ""
        }
      </div>
      <div data-t2-lesson-host>${lessonPreview(L)}</div>`,
  };
}

export const STUDIO_VIEWS = { 1: studio1, 2: studio2, 3: studio3 };
