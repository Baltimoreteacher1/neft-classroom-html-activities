// The unit-less landing page of the Family Bridge: grade -> subject -> unit, so a family who arrives
// without a QR code still finds their child's guide. Nothing is preselected.

import { GRADES, SUBJECTS, esc, gradeText } from "./family-copy.js";

const pill = (attr, value, label, pressed) =>
  `<button type="button" class="fb-pill" ${attr}="${esc(value)}" aria-pressed="${pressed}">${esc(label)}</button>`;

async function loadUnits(grade, subject) {
  const res = await fetch(`/api/bcpss/units?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`units ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.units) ? data.units : [];
}

function unitCards(t, lang, units) {
  if (!units.length) return `<p class="fb-muted">${esc(t.noUnits)}</p>`;
  return `<ol class="fb-unit-list">${units
    .map(
      (u) => `<li><a class="fb-unit-card" href="/family/bcpss/${encodeURIComponent(u.id)}?lang=${lang}">
        <span class="fb-unit-num">${esc(t.unitWord)} ${esc(u.unit_number)}</span>
        <span class="fb-unit-title">${esc(u.unit_title)}</span>
        <span class="fb-unit-go">${esc(t.open)} →</span>
      </a></li>`,
    )
    .join("")}</ol>`;
}

export async function renderDirectory({ root, t, lang, sel, onSelect }) {
  const grade = GRADES.includes(sel.grade) ? sel.grade : "";
  const subject = SUBJECTS.includes(sel.subject) ? sel.subject : "";
  const prompt = !grade ? t.chooseGrade : !subject ? t.chooseSubject : "";
  root.innerHTML = `
    <article class="fb-card">
      <div>
        <h1>${esc(t.dirTitle)}</h1>
        <p class="fb-summary">${esc(t.dirIntro)}</p>
      </div>
      <section class="fb-section" aria-labelledby="fbGradeHead">
        <h2 id="fbGradeHead">${esc(t.gradeStep)}</h2>
        <div class="fb-pills" role="group" aria-labelledby="fbGradeHead">
          ${GRADES.map((g) => pill("data-grade", g, g === "K" ? "K" : g, g === grade)).join("")}
        </div>
      </section>
      <section class="fb-section" aria-labelledby="fbSubjectHead">
        <h2 id="fbSubjectHead">${esc(t.subjectStep)}</h2>
        <div class="fb-pills" role="group" aria-labelledby="fbSubjectHead">
          ${SUBJECTS.map((s) => pill("data-subject", s, t.subjects[s], s === subject)).join("")}
        </div>
      </section>
      <section class="fb-section" aria-labelledby="fbUnitsHead" aria-live="polite">
        <h2 id="fbUnitsHead">${esc(t.unitsStep)}${grade && subject ? ` · ${esc(gradeText(t, grade))} · ${esc(t.subjects[subject])}` : ""}</h2>
        <div id="fbUnits">${prompt ? `<p class="fb-muted">${esc(prompt)}</p>` : `<p class="fb-muted">${esc(t.loadingUnits)}</p>`}</div>
      </section>
    </article>`;

  root.querySelector("[data-grade]")?.closest(".fb-pills")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-grade]");
    if (b) onSelect({ grade: b.dataset.grade, subject });
  });
  root.querySelector("[data-subject]")?.closest(".fb-pills")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-subject]");
    if (b) onSelect({ grade, subject: b.dataset.subject });
  });

  if (!grade || !subject) return;
  const target = root.querySelector("#fbUnits");
  try {
    target.innerHTML = unitCards(t, lang, await loadUnits(grade, subject));
  } catch {
    target.innerHTML = `<p class="fb-muted" role="alert">${esc(t.noUnits)}</p>`;
  }
}
