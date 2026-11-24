// BCPSS Teacher Studio — Language Studio tab (v2): launchpad into the student player + printable resources.
// The player itself lives at /bcpss-teachers/language-studio/ (student-facing). This tab is the teacher's shelf: every
// piece of HTML work in the unit (studio activities, the Writing Lab, lessons, printable pages) can be opened as a web
// page, linked, or assigned to a class from here (assign-dialog.js).
import {
  activityItem,
  lessonItem,
  printableItem,
  studioItem,
  writingItem,
} from "../shared/class-platform/bcpss-assignments.js";
import { openAssignDialog } from "./assign-dialog.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];

// Printable resources, one tidy shelf. `part` is the export endpoint part (see functions/api/bcpss/export).
// `teacher` parts (answers, planning page) are never offered as student assignments.
const RESOURCES = [
  { part: "book", title: "Student Activity Book", note: "Every activity, ready to print" },
  { part: "key", title: "Answer Key", note: "Answers, models, rubric", teacher: true },
  { part: "cards", title: "Vocabulary Cards", note: "Cut-out flashcards" },
  { part: "bingo", title: "Vocabulary Bingo", note: "Six boards + call sheet" },
  { part: "wall", title: "Word Wall", note: "Large-print strips" },
  { part: "poster", title: "Mentor Sentence Poster", note: "Color-coded anchor chart" },
  { part: "strips", title: "Sentence Strips", note: "Frames by level" },
  { part: "talk", title: "Talk Cards", note: "Partner conversation deck" },
  { part: "packet", title: "Unit Overview", note: "Planning page for teachers", teacher: true },
];

const WRITING_RESOURCES = [
  { part: "writing", title: "Writing Lab Packet", note: "TWR writing path on paper, by level" },
  {
    part: "writing-key",
    title: "Writing Lab Teacher Guide",
    note: "Models, answers, rubric",
    teacher: true,
  },
];

const widaOf = (level, wida) => (level ? level.slice(1) : wida);

/** Item maker for one assignable thing on the shelf, read from the data-* of its button or checkbox. */
function makerFor(d, unitId, wida) {
  switch (d.kind) {
    case "su":
      return (level) => studioItem(unitId, { level });
    case "wl":
      return (level) => writingItem(unitId, { level });
    case "sa":
      return (level) => activityItem(unitId, Number(d.index), { title: d.title, level });
    case "ls":
      return (level) => lessonItem(d.lesson, { title: d.title, level });
    default:
      return (level) => printableItem(unitId, d.part, widaOf(level, wida), { title: d.title });
  }
}

const assignAttrs = (attrs) =>
  Object.entries(attrs)
    .map(([k, v]) => `data-${k}="${esc(v)}"`)
    .join(" ");

const assignBtn = (label, attrs, cls = "") =>
  `<button type="button" class="stt-assign ${cls}" data-assign ${assignAttrs(attrs)}>${esc(label)}</button>`;

// Writing Lab: the unit's Writing Revolution path, student-facing at /bcpss-teachers/writing-lab/.
function writingLabCard(detail, wida) {
  const w = detail.writing;
  if (!w) return "";
  const href = `/bcpss-teachers/writing-lab/?unit=${encodeURIComponent(detail.unit.id)}&level=l${wida}`;
  return `
      <section class="stt-hero stt-hero--writing" aria-labelledby="sttWlH">
        <div>
          <h3 id="sttWlH">Writing Lab · ${esc(w.title)}</h3>
          <p>${esc(w.prompt[`l${wida}`] || w.prompt.l3_4)}</p>
          <p class="stt-chips"><span>Notes</span><span>Because · But · So</span><span>Expansion</span><span>Appositives</span><span>Clue words</span><span>Outline</span><span>Draft &amp; revise</span></p>
        </div>
        <div class="stt-hero-actions">
          <a class="stt-launch" href="${href}">Open Writing Lab</a>
          ${assignBtn("Assign Writing Lab", { kind: "wl" })}
        </div>
      </section>`;
}

const studioUrl = (unitId, wida, index) => {
  const params = new URLSearchParams({ unit: unitId, level: `l${wida}` });
  if (index) params.set("a", String(index));
  return `/bcpss-teachers/language-studio/?${params}`;
};

const exportUrl = (unitId, part, format, wida) =>
  `/api/bcpss/export/${encodeURIComponent(unitId)}?format=${format}&part=${part}&wida=${wida}${format === "html" ? "" : "&download=1"}`;

function activityRow(a, i, unitId, wida) {
  const pick = { kind: "sa", index: i + 1, title: a.title };
  return `
    <li class="stt-row stt-row--pick stt-row--${esc(a.domain.toLowerCase())}">
      <input type="checkbox" class="stt-check" data-pick ${assignAttrs(pick)} aria-label="Select ${esc(a.title)}" />
      <span class="stt-num" aria-hidden="true">${i + 1}</span>
      <div class="stt-main">
        <b>${esc(a.title)}</b>
        <span>${esc(a.mission)}</span>
        <small>${esc(a.domain)} · ${esc(a.minutes)} min · ${esc(a.grouping)}</small>
      </div>
      <div class="stt-actions">
        <a class="stt-play" href="${studioUrl(unitId, wida, i + 1)}">Play</a>
        ${assignBtn("Assign", pick)}
        <a class="stt-print" href="${exportUrl(unitId, `activity-${i + 1}`, "html", wida)}" aria-label="Open ${esc(a.title)} as a web page">Page</a>
        <a class="stt-print" href="${exportUrl(unitId, `activity-${i + 1}`, "pdf", wida)}" aria-label="Print ${esc(a.title)}">Print</a>
      </div>
    </li>`;
}

function resourceCard(r, unitId, wida) {
  const assign = r.teacher ? "" : assignBtn("Assign", { kind: "pr", part: r.part, title: r.title });
  return `
    <li class="stt-res">
      <b>${esc(r.title)}</b>
      <span>${esc(r.note)}</span>
      <div>
        <a href="${exportUrl(unitId, r.part, "html", wida)}">Web page</a>
        <a href="${exportUrl(unitId, r.part, "pdf", wida)}">PDF</a>
        <a href="${exportUrl(unitId, r.part, "docx", wida)}">Word</a>
        ${assign}
      </div>
    </li>`;
}

const toolbar = (headingId, heading, scope) => `
  <div class="stt-bar">
    <h3 id="${headingId}" class="stt-h">${heading}</h3>
    <label class="stt-pick"><input type="checkbox" data-pick-all="${scope}" /> Select all</label>
    <button type="button" class="stt-assign stt-assign--solid" data-assign-selected="${scope}" disabled>Assign selected</button>
  </div>`;

function lessonRow(l, unitId, wida) {
  const pick = { kind: "ls", lesson: l.id, title: l.title };
  const href = `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(unitId)}&lesson=${encodeURIComponent(l.id)}&view=student&level=l${wida}`;
  return `
    <li class="stt-row stt-row--pick">
      <input type="checkbox" class="stt-check" data-pick ${assignAttrs(pick)} aria-label="Select ${esc(l.title)}" />
      <span class="stt-num" aria-hidden="true">${esc(l.sequence)}</span>
      <div class="stt-main">
        <b>${esc(l.title)}</b>
        <span>${esc(l.function)}</span>
        <small>${esc(l.klu)} · ${esc(l.minutes)} min</small>
      </div>
      <div class="stt-actions">
        <a class="stt-play" href="${href}">Open</a>
        ${assignBtn("Assign", pick)}
      </div>
    </li>`;
}

/** The unit's lessons, filled in after the tab shows (one extra request; the shelf never waits for it). */
async function fillLessons(host, unitId, wida) {
  try {
    const res = await fetch(`/api/bcpss/units/${encodeURIComponent(unitId)}/lessons`);
    const data = res.ok ? await res.json() : null;
    const lessons = data?.lessons || [];
    host.innerHTML = lessons.length
      ? `${toolbar("sttLessH", "Lessons", "lessons")}<ol class="stt-list">${lessons.map((l) => lessonRow(l, unitId, wida)).join("")}</ol>`
      : "";
  } catch {
    host.innerHTML = "";
  }
}

/** Checkbox + "Assign selected" behavior for one section; a delegated listener, so late-loaded rows work too. */
function bindSection(section, unitId, wida) {
  const scoped = (attr) => section.querySelectorAll(`[${attr}]`);
  const picks = () => [...section.querySelectorAll("[data-pick]")];
  const sync = () => {
    const n = picks().filter((c) => c.checked).length;
    for (const btn of scoped("data-assign-selected")) {
      btn.disabled = n === 0;
      btn.textContent = n ? `Assign ${n} selected` : "Assign selected";
    }
    for (const all of scoped("data-pick-all")) all.checked = n > 0 && n === picks().length;
  };
  section.addEventListener("change", (e) => {
    if (e.target.matches("[data-pick-all]")) for (const c of picks()) c.checked = e.target.checked;
    sync();
  });
  section.addEventListener("click", (e) => {
    const one = e.target.closest("[data-assign]");
    const many = e.target.closest("[data-assign-selected]");
    if (one) openAssignDialog({ makers: [makerFor(one.dataset, unitId, wida)] });
    else if (many) {
      const chosen = picks().filter((c) => c.checked);
      openAssignDialog({
        makers: chosen.map((c) => makerFor(c.dataset, unitId, wida)),
        heading: `Assign ${chosen.length} to students`,
      });
    }
  });
}

export function renderStudioTab(panel, { detail, wida }) {
  const studio = detail?.studio;
  const unit = detail?.unit;
  if (!studio || !unit) {
    panel.innerHTML = `<div class="bh-empty">This unit's Language Studio is being finished. Check back soon.</div>`;
    return;
  }
  const counts = DOMAINS.map((d) => ({
    d,
    n: studio.activities.filter((a) => a.domain === d).length,
  })).filter((x) => x.n);
  const rows = studio.activities.map((a, i) => activityRow(a, i, unit.id, wida)).join("");
  panel.innerHTML = `
    <div class="stt">
      <section class="stt-hero" aria-labelledby="sttHeroH">
        <div>
          <h3 id="sttHeroH">Language Studio</h3>
          <p>${studio.activities.length} games and language activities students can play on any device. Self-checking, no timers, every level supported.</p>
          <p class="stt-chips">${counts.map((c) => `<span>${esc(c.d)} · ${c.n}</span>`).join("")}</p>
        </div>
        <div class="stt-hero-actions">
          <a class="stt-launch" href="${studioUrl(unit.id, wida)}">Open Language Studio</a>
          ${assignBtn("Assign whole studio", { kind: "su" })}
        </div>
      </section>${writingLabCard(detail, wida)}
      <section aria-labelledby="sttListH" data-section="activities">
        ${toolbar("sttListH", "All activities", "activities")}
        <ol class="stt-list">${rows}</ol>
      </section>
      <section data-section="lessons" aria-live="polite"></section>
      <section aria-labelledby="sttResH" data-section="resources">
        <h3 id="sttResH" class="stt-h">Printables and resources</h3>
        <ul class="stt-res-grid">${(detail.writing ? [...RESOURCES, ...WRITING_RESOURCES] : RESOURCES).map((r) => resourceCard(r, unit.id, wida)).join("")}</ul>
      </section>
    </div>`;
  for (const section of panel.querySelectorAll(".stt > section"))
    bindSection(section, unit.id, wida);
  void fillLessons(panel.querySelector('[data-section="lessons"]'), unit.id, wida);
}
