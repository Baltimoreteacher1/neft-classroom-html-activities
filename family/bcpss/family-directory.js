// The unit-less landing page: big grade picker -> subject -> unit list (one bilingual line per unit),
// so a family that arrives without a link still finds their child's guide. Nothing is preselected.

import { C, GRADES, SUBJECTS, SUBJECT_ICONS, SUBJECT_NAMES, gradeName } from "./family-copy.js";
import { bi, esc } from "./family-util.js";

const tile = (attr, value, label, pressed, extra = "") =>
  `<button type="button" class="fb-tile" ${attr}="${esc(value)}" aria-pressed="${pressed}">${extra}${label}</button>`;

async function loadUnits(grade, subject) {
  const res = await fetch(`/api/bcpss/family-guide?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`units ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.units) ? data.units : [];
}

function unitCards(units) {
  if (!units.length) return `<p class="fb-muted">${bi(C.noUnits)}</p>`;
  return `<ol class="fb-unit-list">${units
    .map(
      (u) => `<li><a class="fb-unit-card" href="/family/bcpss/${encodeURIComponent(u.id)}">
        <span class="fb-unit-num">${bi({ en: `${C.unitWord.en} ${u.unit_number}`, es: `${C.unitWord.es} ${u.unit_number}` })}</span>
        <span class="fb-unit-title" lang="en">${esc(u.title)}</span>
        <span class="fb-unit-sum">${bi(u.summary)}</span>
        <span class="fb-unit-go">${bi({ en: `${C.openGuide.en} →`, es: `${C.openGuide.es} →` })}</span>
      </a></li>`,
    )
    .join("")}</ol>`;
}

export async function renderDirectory({ root, sel, onSelect }) {
  const grade = GRADES.includes(sel.grade) ? sel.grade : "";
  const subject = SUBJECTS.includes(sel.subject) ? sel.subject : "";
  const gradeTiles = GRADES.map((g) => tile("data-grade", g, g === "K" ? "K" : g, g === grade)).join("");
  const subjectTiles = SUBJECTS.map((s) =>
    tile("data-subject", s, `<span class="fb-tile-label">${bi(SUBJECT_NAMES[s])}</span>`, s === subject, `<span class="fb-tile-icon" aria-hidden="true">${SUBJECT_ICONS[s]}</span>`),
  ).join("");
  root.innerHTML = `
    <section class="fb-hero fb-hero-dir" aria-labelledby="fbDirTitle">
      <h1 id="fbDirTitle">${bi(C.dirTitle)}</h1>
      <p class="fb-lead">${bi(C.dirIntro)}</p>
      <div class="fb-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    </section>
    <section class="fb-section" aria-labelledby="fbGradeHead">
      <header class="fb-section-head"><span class="fb-step">1</span><h2 id="fbGradeHead">${bi(C.gradeStep)}</h2></header>
      <div class="fb-tiles fb-tiles-grade" role="group" aria-labelledby="fbGradeHead">${gradeTiles}</div>
    </section>
    ${
      grade
        ? `<section class="fb-section" aria-labelledby="fbSubjectHead">
      <header class="fb-section-head"><span class="fb-step">2</span><h2 id="fbSubjectHead">${bi({ en: `${C.subjectStep.en} (${gradeName(grade).en})`, es: `${C.subjectStep.es} (${gradeName(grade).es})` })}</h2></header>
      <div class="fb-tiles fb-tiles-subject" role="group" aria-labelledby="fbSubjectHead">${subjectTiles}</div>
    </section>`
        : ""
    }
    ${
      grade && subject
        ? `<section class="fb-section" aria-labelledby="fbUnitsHead" aria-live="polite">
      <header class="fb-section-head"><span class="fb-step">3</span><h2 id="fbUnitsHead">${bi(C.unitsStep)}</h2></header>
      <div id="fbUnits"><p class="fb-muted">${bi(C.loadingUnits)}</p></div>
    </section>`
        : ""
    }`;

  root.querySelector(".fb-tiles-grade")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-grade]");
    if (b) onSelect({ grade: b.dataset.grade, subject: "" });
  });
  root.querySelector(".fb-tiles-subject")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-subject]");
    if (b) onSelect({ grade, subject: b.dataset.subject });
  });

  if (!grade || !subject) return;
  const target = root.querySelector("#fbUnits");
  try {
    target.innerHTML = unitCards(await loadUnits(grade, subject));
  } catch {
    target.innerHTML = `<p class="fb-muted" role="alert">${bi(C.noUnits)}</p>`;
  }
}
