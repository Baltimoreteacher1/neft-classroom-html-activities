import { zipStore } from "../../../assets/lib/zip-store.js";
import { html, toHtml } from "../util.js";
import { FUNCTIONS, SUPPORT_KEYS } from "./rules.js";
import { lessonPlanHTML } from "./print.js";
import { studentPageHTML } from "./week-ui.js";

const escName = (s) => String(s || "lesson").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "lesson";
const page = (title, body) => html`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font:16px/1.5 sans-serif;max-width:900px;margin:2rem auto;padding:1rem;color:#111}h1,h2{line-height:1.2}li{margin:.4rem 0}.page-break{break-before:page}.lp-pack-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.lp-pack-grid>*{border:1px solid #333;padding:1rem}.lp-pack-vocab{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}.lp-pack-vocab>div{border:1px solid #555;padding:.6rem;text-align:center}.lp-pack-challenge{break-inside:avoid;min-height:6rem;border:1px solid #222;padding:1rem;margin:1rem 0}</style><body>${body}</body></html>`;

function challenges(lesson) {
  const fn = FUNCTIONS[lesson.settings.fn];
  return SUPPORT_KEYS.flatMap((stage) => fn.frames[stage].slice(0, 2).map((frame) => ({ stage, frame })));
}
function vocabPairs(lesson, glossary) {
  const terms = lesson.phases.find((p) => p.key === "vocabulary")?.words || FUNCTIONS[lesson.settings.fn].words.slice(0, 5);
  const byTerm = new Map((glossary?.terms || []).map((w) => [String(w.term).toLowerCase(), w]));
  return terms.slice(0, 12).map((term) => {
    const item = byTerm.get(String(term).toLowerCase());
    return { term, es: item?.es || "", picture: item?.emoji || "🔤" };
  });
}

/** ZIP source bundle and combined print markup. Teacher answer key is stored in a separate teacher-only file. */
export function buildLessonPack(lesson, { rowById, phaseHref, homeCard = null, glossary = null, origin = "" } = {}) {
  if (!lesson?.settings || !Array.isArray(lesson.phases)) throw new Error("Build a lesson before exporting a lesson pack.");
  const fn = FUNCTIONS[lesson.settings.fn];
  if (!fn) throw new Error("Choose a language function before exporting.");
  const teacherPlan = lessonPlanHTML(lesson, { rowById, phaseHref, origin });
  const studentSheets = SUPPORT_KEYS.map((stage) => ({ stage, content: studentPageHTML({ ...lesson, settings: { ...lesson.settings, support: stage } }, homeCard) }));
  const pairs = vocabPairs(lesson, glossary);
  const cards = challenges(lesson);
  const exit = lesson.phases.find((p) => p.key === "exit");
  const files = {
    "teacher/lesson-plan.html": toHtml(page("Teacher lesson plan", teacherPlan)),
    "teacher/presentation.html": toHtml(page("Presentation view", html`<h1>Presentation view</h1><p>Open the classroom projection of this lesson:</p><p><a href="${origin}/access-practice-lab/classroom">${origin}/access-practice-lab/classroom</a></p><p>Lesson objective: ${lesson.objectives.content}</p><p>Language objective: ${lesson.objectives.language}</p>`)),
    "student/sheet-A.html": toHtml(page("Student sheet · A", studentSheets[0].content)),
    "student/sheet-B.html": toHtml(page("Student sheet · B", studentSheets[1].content)),
    "student/sheet-C.html": toHtml(page("Student sheet · C", studentSheets[2].content)),
    "student/challenge-cards.html": toHtml(page("Challenge cards", html`<h1>Challenge cards</h1><div class="lp-pack-grid">${cards.map((c, i) => html`<article class="lp-pack-challenge"><h2>Card ${i + 1} · ${c.stage}</h2><p>${c.frame}</p></article>`)}</div>`)),
    "student/vocabulary-grid.html": toHtml(page("Vocabulary grid", html`<h1>Vocabulary grid</h1><div class="lp-pack-vocab">${pairs.map((w) => html`<div><span aria-hidden="true">${w.picture}</span><strong lang="en">${w.term}</strong><span lang="es">${w.es || "________________"}</span></div>`)}</div>`)),
    "student/home-task.html": toHtml(page("Home task", homeCard ? html`<h1>Practice at home · Practica en casa</h1><p lang="en">${homeCard.q?.[0] || ""}</p><p lang="es">${homeCard.q?.[1] || ""}</p><p>${homeCard.starter?.[0] || ""} / <span lang="es">${homeCard.starter?.[1] || ""}</span></p>` : html`<h1>Home task</h1><p>Talk together about today’s language objective. / Conversen sobre el objetivo de lenguaje de hoy.</p>`)),
    "student/exit-check.html": toHtml(page("Exit check", html`<h1>Exit check</h1><p>${exit?.student || "Explain one idea from the lesson."}</p><p>__________________________________________________</p><p>__________________________________________________</p>`)),
    "teacher/answer-key.html": toHtml(page("TEACHER ONLY · Exit-check key", html`<h1>TEACHER ONLY · Exit-check key</h1><p>Do not share this file with students.</p><h2>Look for</h2><p>${exit?.teacher || "A response that matches the lesson objective. Review student work; no automatic scoring."}</p>`)),
  };
  const printable = html`<section>${teacherPlan}</section><section class="page-break">${studentSheets[0].content}</section><section class="page-break">${studentSheets[1].content}</section><section class="page-break">${studentSheets[2].content}</section><section class="page-break"><h1>Challenge cards</h1><div class="lp-pack-grid">${cards.map((c, i) => html`<article class="lp-pack-challenge"><h2>Card ${i + 1} · ${c.stage}</h2><p>${c.frame}</p></article>`)}</div></section><section class="page-break"><h1>Vocabulary grid</h1><div class="lp-pack-vocab">${pairs.map((w) => html`<div><span>${w.picture}</span><strong>${w.term}</strong><span lang="es">${w.es || "________________"}</span></div>`)}</div></section><section class="page-break"><h1>Practice at home · Practica en casa</h1><p>${homeCard?.q?.[0] || "Talk together about today’s language objective."}</p><p lang="es">${homeCard?.q?.[1] || "Conversen sobre el objetivo de lenguaje de hoy."}</p></section><section class="page-break"><h1>TEACHER ONLY · Exit-check key</h1><p>${exit?.teacher || "Review the response against the language objective."}</p></section>`;
  return { files, bytes: zipStore(files), printMarkup: printable, filename: `${escName(fn.label[0])}-lesson-pack.zip`, wordPairs: pairs, challengeCount: cards.length };
}

export function downloadLessonPack(pack) {
  const blob = new Blob([pack.bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: pack.filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
