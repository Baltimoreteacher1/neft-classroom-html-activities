// Vocabulary Academy print: the Teacher Edition front matter (overview, pacing, rationale, guide). Built ONLY from the
// unit's own teacher/wida/rationale fields plus the fixed lesson list in contract.js. Teacher contexts only.
import { LESSONS } from "../contract.js";
import { checkBox, keyNote, POS_NAME, sheet, sheetTitle, subTitle } from "./kit.js";
import { DISCLAIMER, gradeLabel, html, plural } from "./shared.js";

/** Which workbook parts each lesson letter draws on. A suggestion printed as one, never a requirement. */
const LESSON_PARTS = {
  a: "Parts 1 and 2: meet the words, watch one word",
  b: "Parts 2 and 5: meanings and word parts",
  c: "Part 3: words in context",
  d: "Part 4: how words connect",
  e: "Part 7: write with the words",
  f: "On screen: Games & Practice (no print page)",
  g: "Parts 6 and 8: read, then write and talk",
  h: "Parts 9 and 10, and the assessment forms",
};

/** Spread lessons a-h across `days` days, in order, as evenly as whole lessons allow. */
export function pacingPlan(days) {
  const n = Math.max(1, Math.min(LESSONS.length, Math.round(Number(days) || 5)));
  const plan = Array.from({ length: n }, () => []);
  LESSONS.forEach((lesson, i) => plan[Math.min(n - 1, Math.floor((i * n) / LESSONS.length))].push(lesson));
  return plan;
}

const list = (items, cls = "") =>
  items?.length ? html`<ul class="vap-bullets ${cls}">${items.map((t) => html`<li>${t}</li>`)}</ul>` : "";

const block = (label, title, body) =>
  body ? html`<section class="vap-block" aria-label="${title}">${subTitle(label, title)}${body}</section>` : "";

export function teacherFront(c) {
  const { unit: u } = c;
  const t = u.teacher ?? {};
  const wida = u.wida ?? {};
  const plan = pacingPlan(u.pacingDays);

  const overview = sheet(
    "t-overview",
    "Lesson overview",
    html`<header class="vap-cover-head">
        <p class="vap-eyebrow">${gradeLabel(u.grade)} · Lesson ${u.n} · Teacher Edition</p>
        <h1>${u.title}</h1>
        <p class="vap-theme"><strong>Theme:</strong> ${u.theme} · <strong>Strand:</strong> ${u.strand} · <strong>Planned time:</strong> ${u.pacingDays} ${plural(Number(u.pacingDays), "day")}</p>
      </header>
      ${t.overview ? html`<p class="vap-lead-para">${t.overview}</p>` : ""}
      ${block("", "Students will be able to", html`<ul class="vap-checklist">${u.objectives.map((o) => html`<li>${checkBox()}<span>${o}</span></li>`)}</ul>`)}
      <section class="vap-block" aria-label="Pacing">
        ${subTitle("", "Suggested pacing", "The word list, Exercises A to F and the lesson review, in order. Move sections between days to fit your schedule.")}
        <table class="vap-table is-pacing">
          <caption>Suggested pacing</caption>
          <thead><tr><th scope="col">Day</th><th scope="col">Lessons</th><th scope="col">Workbook pages</th></tr></thead>
          <tbody>
            ${plan.map((day, i) => html`<tr><th scope="row">${i + 1}</th><td>${day.map((l) => `${l.id.toUpperCase()}. ${l.en}`).join("; ")}</td><td>${day.map((l) => LESSON_PARTS[l.id]).join("; ")}</td></tr>`)}
          </tbody>
        </table>
      </section>
      ${block("", "Why these words, in this order", html`<p>${u.rationale}</p>`)}
      <section class="vap-block" aria-label="Words at a glance">
        ${subTitle("", "The words")}
        <table class="vap-table is-glance">
          <caption>Target words</caption>
          <thead><tr><th scope="col">Word</th><th scope="col">Part of speech</th><th scope="col">Tier</th><th scope="col">Features</th></tr></thead>
          <tbody>
            ${u.words.map((w) => html`<tr><th scope="row">${w.hw}</th><td>${POS_NAME[w.pos] ?? w.pos}</td><td>${w.tier}</td><td>${(w.cats ?? []).join(", ") || "-"}</td></tr>`)}
          </tbody>
        </table>
      </section>`,
  );

  const guide = sheet(
    "t-guide",
    "Teaching guide",
    html`${sheetTitle("Teacher guide", "Teaching notes for this lesson", "Everything here is for the teacher. None of it appears in the student workbook.")}
      ${t.model ? html`<section class="vap-block" aria-label="Modeling script">${subTitle("", "Modeling script", "Say this aloud while you work through the worked-example page.")}${keyNote("Say aloud", t.model)}</section>` : ""}
      ${block("", "Discussion prompts", list(t.discuss))}
      ${block("", "Watch for these misunderstandings", list(t.misconceptions))}
      <section class="vap-block" aria-label="Supports">
        ${subTitle("", "Language supports to offer", "Choose per student and per language domain. These are practice supports, not levels.")}
        ${list(wida.frames)}
        ${wida.bank?.length ? html`<p class="vap-bankline"><b>Word bank phrases:</b> ${wida.bank.join(" · ")}</p>` : ""}
        ${wida.oral ? html`<p><b>Oral rehearsal:</b> ${wida.oral}</p>` : ""}
        <p class="vap-fine">Turn on Spanish glosses, sentence starters, word bank and rehearsal prompts for any student with the options on the print page. Spanish glosses have not been reviewed by a native speaker; check them before sending them home.</p>
      </section>
      ${block("", "Assessment guidance", html`
        <p>Forms A and B test the same words with the same question types in the same order, using different sentences, so a re-check after teaching is a fair comparison. Parts 1 to 3 are one point each. Part 4 is a short written response scored against the look-fors in the answer key. Adjust scoring to your own policy.</p>
        <ol class="vap-steps-plain"><li>Give Form A. Mark it with the answer key.</li><li>Group the missed words. Reteach those words with a new example.</li><li>Practice the missed words in lessons F and G.</li><li>Give Form B and compare the two results word by word.</li></ol>
        ${t.reviewAdvice ? html`<p><b>Review and spacing:</b> ${t.reviewAdvice}</p>` : ""}`)}
      ${block("", "Extension", list(t.extend))}
      <p class="vap-fine">${DISCLAIMER.en}</p>`,
  );
  return [overview, guide];
}
