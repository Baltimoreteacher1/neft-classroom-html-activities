// A small, complete structured-literacy lesson player. It keeps foundational
// decoding evidence separate from language proficiency and official scores.
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { BASE, html, icon, safeJson, storage } from "../util.js";
import { READING_LESSONS, lessonById } from "./sequence.js";

const KEY = "accessPracticeLab:v1:sor";
const PHASES = ["model", "build", "read", "spell", "text", "transfer", "complete"];
const LABELS = { model: "Learn", build: "Build", read: "Decode", spell: "Spell", text: "Read", transfer: "Apply", complete: "Done" };
const clean = (raw) => ({
  phase: PHASES.includes(raw?.phase) ? raw.phase : "model",
  placed: Array.isArray(raw?.placed) ? raw.placed.filter((x) => typeof x === "string").slice(0, 12) : [],
  choice: typeof raw?.choice === "string" ? raw.choice.slice(0, 50) : "",
  spelling: typeof raw?.spelling === "string" ? raw.spelling.slice(0, 50) : "",
  explanation: typeof raw?.explanation === "string" ? raw.explanation.slice(0, 500) : "",
  transfer: typeof raw?.transfer === "string" ? raw.transfer.slice(0, 50) : "",
  feedback: typeof raw?.feedback === "string" ? raw.feedback.slice(0, 250) : "",
  attempts: Number.isInteger(raw?.attempts) ? Math.max(0, Math.min(raw.attempts, 99)) : 0,
  help: Boolean(raw?.help),
  doneAt: typeof raw?.doneAt === "string" ? raw.doneAt : "",
  updatedAt: typeof raw?.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : "",
});
export const loadReadingState = () => safeJson(storage.get(KEY), {}) || {};
const save = (all) => storage.set(KEY, JSON.stringify(all));
const stateFor = (all, id) => clean(all[id]);
const update = (id, patch) => {
  const all = loadReadingState();
  all[id] = { ...stateFor(all, id), ...patch, updatedAt: new Date().toISOString() };
  save(all);
  return all[id];
};
const recordEvidence = (lesson, band, kind, stage, m) => {
  const ledger = loadLedger();
  appendEntry(ledger, { src: "phonics", task: lesson.id, band, domain: "Reading", use: "Foundational reading", kind, stage, supports: { hint: stage !== "independent" }, m, confidence: null });
  saveLedger(ledger);
};
const href = (id, band) => `${BASE}/science-of-reading/lesson/${id}?grades=${band}`;
const unitHTML = (item) => html`<div class="sor2-boxes" aria-label="${item.units.length} sound or word-part boxes">${item.units.map((unit, i) => html`<span class="sor2-box"><b>${unit.replace("_", "…")}</b><small>${item.sounds[i]}</small></span>`)}</div>`;

export function readingPathHTML(ctx) {
  const band = ctx.band;
  const all = loadReadingState();
  const older = band === "6-8";
  return { title: "Start Reading · The Language Page", html: html`<main class="sor2-shell">
    <a href="${BASE}/science-of-reading?grades=${band}">${icon("arrow-left")} Science of Reading Studio</a>
    <p class="eyebrow">Structured literacy · original lessons</p><h1>Start Reading</h1>
    <p>Choose a skill you need. Lessons connect a clear model, sound boxes, word reading, spelling, connected text, and an independent new word. You can start anywhere.</p>
    <p class="sor2-note">${older ? "Older learner route: mature presentation and direct access to morphology. Your English language level does not determine your decoding lesson." : "Start with short vowel words or choose the pattern you need."}</p>
    <div class="sor2-path">${READING_LESSONS.map((lesson) => {
      const s = stateFor(all, lesson.id);
      return html`<article class="sor2-path-card"><span class="eyebrow">Stage ${lesson.stage} · ${lesson.unit}</span><h2>${lesson.title}</h2><p>${lesson.objective}</p>
        <p class="fine">${s.doneAt ? "Completed on this device" : s.phase !== "model" ? `Continue at ${LABELS[s.phase]}` : "Ready to start"}</p>
        <a class="btn btn-primary" href="${href(lesson.id, band)}">${s.doneAt ? "Review lesson" : s.phase !== "model" ? "Continue lesson" : "Start lesson"} ${icon("arrow-right")}</a></article>`;
    })}</div>
    <p class="disclaimer">This is a starting lesson sequence. It does not assign a reading level or diagnose a disability. Work stays on this device unless you share it.</p>
  </main>` };
}

export function readingLessonHTML(ctx, id) {
  const lesson = lessonById(id);
  if (!lesson) return null;
  const band = ctx.band;
  const s = stateFor(loadReadingState(), id);
  const at = PHASES.indexOf(s.phase);
  const next = () => PHASES[at + 1];
  return { title: `${lesson.title} · Start Reading`, html: html`<main class="sor2-shell" data-sor-lesson="${id}">
    <a href="${BASE}/science-of-reading/path?grades=${band}">${icon("arrow-left")} Reading path</a>
    <p class="eyebrow">Stage ${lesson.stage} · ${lesson.unit}</p><h1>${lesson.title}</h1><p class="lead">${lesson.objective}</p>
    <ol class="sor2-progress" aria-label="Lesson progress">${PHASES.slice(0, -1).map((p, i) => html`<li class="${i === at ? "is-current" : ""} ${i < at ? "is-done" : ""}">${LABELS[p]}</li>`)}</ol>
    ${s.phase === "model" ? html`<section class="sor2-stage"><h2>Review and learn</h2><p>What you may already know: ${lesson.prerequisites.join("; ")}.</p><p class="sor2-model">${lesson.model}</p>
      ${unitHTML(lesson.example)}<p><strong>${lesson.example.word}</strong> means ${lesson.example.meaning}.</p><p class="fine">The labels show sound units for this lesson. They are not recorded audio.</p>
      <button class="btn btn-primary" data-sor-next="${next()}">Build a word ${icon("arrow-right")}</button></section>` : ""}
    ${s.phase === "build" ? html`<section class="sor2-stage"><h2>Build with sound boxes</h2><p>Build the word that means <strong>${lesson.build.meaning}</strong>. Put one grapheme in each box. A digraph such as <b>sh</b> goes in one box.</p>
      <div class="sor2-boxes">${lesson.build.units.map((_, i) => html`<span class="sor2-box">${s.placed[i]?.split(":")[1]?.replace("_", "…") || "?"}</span>`)}</div>
      <div class="sor2-tiles" role="group" aria-label="Grapheme tiles">${lesson.build.tiles.map((tile, i) => html`<button type="button" data-sor-tile="${tile}" data-sor-tile-index="${i}" ${s.placed.includes(`${i}:${tile}`) ? "disabled" : ""}>${tile.replace("_", "…")}</button>`)}</div>
      <div class="sor2-actions"><button class="btn" data-sor-undo>Remove last tile</button><button class="btn btn-primary" data-sor-check="build">Check my word</button></div></section>` : ""}
    ${s.phase === "read" ? html`<section class="sor2-stage"><h2>Decode a new word</h2><p>Read each sound unit, then blend. Choose the word that means <strong>${lesson.read.meaning}</strong>.</p>
      <div class="sor2-boxes">${lesson.read.sounds.map((sound) => html`<span class="sor2-box"><small>${sound}</small></span>`)}</div>
      <div class="sor2-tiles" role="group" aria-label="Choose a word">${lesson.read.choices.map((word) => html`<button type="button" data-sor-choice="${word}" aria-pressed="${s.choice === word}">${word}</button>`)}</div>
      <button class="btn btn-primary" data-sor-check="read">Check my reading</button></section>` : ""}
    ${s.phase === "spell" ? html`<section class="sor2-stage"><h2>Spell from meaning and sounds</h2><p>Spell the word that means <strong>${lesson.spell.meaning}</strong>. Tap each sound box, then write the full spelling.</p>
      <div class="sor2-boxes">${lesson.spell.sounds.map((sound) => html`<span class="sor2-box"><small>${sound}</small></span>`)}</div>
      <label>Write the word <input data-sor-input="spelling" value="${s.spelling}" autocomplete="off" spellcheck="false" /></label><button class="btn btn-primary" data-sor-check="spell">Check spelling</button></section>` : ""}
    ${s.phase === "text" ? html`<section class="sor2-stage"><h2>Read connected text</h2><p>Read the passage yourself first. Then answer in a sentence. You may reread it.</p>
      <p class="sor2-passage">${lesson.passage}</p><p class="fine">Teacher note: preview these words as needed: ${lesson.exceptions.join(", ")}.</p>
      <label>${lesson.question}<textarea data-sor-input="explanation" rows="3">${s.explanation}</textarea></label>
      <button class="btn btn-primary" data-sor-check="text">Review my explanation</button></section>` : ""}
    ${s.phase === "transfer" ? html`<section class="sor2-stage"><h2>Try a new word independently</h2><p>Spell the word that means <strong>${lesson.transfer.meaning}</strong>. This word has not appeared in the guided practice.</p>
      <div class="sor2-boxes">${lesson.transfer.sounds.map((sound) => html`<span class="sor2-box"><small>${sound}</small></span>`)}</div>
      <label>New word <input data-sor-input="transfer" value="${s.transfer}" autocomplete="off" spellcheck="false" /></label><button class="btn btn-primary" data-sor-check="transfer">Check independent word</button></section>` : ""}
    ${s.phase === "complete" ? html`<section class="sor2-stage"><h2>Lesson complete</h2><p>You built, decoded, spelled, read, and applied this pattern to a new word. Your practice record is saved on this device.</p>
      <p>${lesson.next ? "The next lesson introduces a new pattern. You can also revisit this lesson whenever you need more practice." : "Choose another lesson or review a pattern that needs more practice."}</p>
      <a class="btn btn-primary" href="${lesson.next ? href(lesson.next, band) : `${BASE}/science-of-reading/path?grades=${band}`}">${lesson.next ? "Next lesson" : "Reading path"} ${icon("arrow-right")}</a></section>` : ""}
    ${s.feedback ? html`<p class="sor2-feedback" role="status">${s.feedback}</p>` : ""}
    <p class="disclaimer">This activity records observed practice, not a reading level or official assessment score. A teacher should review connected-text responses.</p>
  </main>` };
}

export function mountReadingLesson(root, ctx) {
  const host = root.querySelector("[data-sor-lesson]");
  if (!host) return;
  const lesson = lessonById(host.dataset.sorLesson);
  const id = lesson.id;
  host.addEventListener("input", (event) => {
    const field = event.target?.dataset?.sorInput;
    if (["spelling", "explanation", "transfer"].includes(field)) update(id, { [field]: event.target.value });
  });
  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const s = stateFor(loadReadingState(), id);
    if (button.dataset.sorNext) update(id, { phase: button.dataset.sorNext, feedback: "" });
    else if (button.dataset.sorTile) {
      if (s.placed.length < lesson.build.units.length) update(id, { placed: [...s.placed, `${button.dataset.sorTileIndex}:${button.dataset.sorTile}`], feedback: "" });
    } else if (button.hasAttribute("data-sor-undo")) update(id, { placed: s.placed.slice(0, -1), feedback: "" });
    else if (button.dataset.sorChoice) update(id, { choice: button.dataset.sorChoice, feedback: "" });
    else if (button.dataset.sorCheck) {
      const phase = button.dataset.sorCheck;
      const value = phase === "build" ? s.placed.map((p) => p.split(":")[1]).join("") : phase === "read" ? s.choice : phase === "spell" ? s.spelling.trim().toLowerCase() : phase === "transfer" ? s.transfer.trim().toLowerCase() : s.explanation.trim();
      const expected = phase === "build" ? lesson.build.units.join("") : phase === "read" ? lesson.read.word : phase === "spell" ? lesson.spell.word : phase === "transfer" ? lesson.transfer.word : "";
      const correct = phase === "text" ? value.split(/\s+/).length >= 4 : value === expected;
      const attempts = s.attempts + 1;
      const kind = phase === "transfer" ? "transfer" : attempts > 1 ? "retry" : "first";
      if (phase !== "text") recordEvidence(lesson, ctx.band, kind, phase === "transfer" ? "independent" : "guided", { skill: phase, correct, attempts });
      if (!correct) {
        const message = phase === "text" ? "Write a complete sentence that answers the question. Then reread the passage and revise." : phase === "build" ? `Look at the model: one sound unit belongs in each box. Check the ${lesson.build.units.length} sounds and change a tile.` : phase === "read" ? "Blend the sound units from left to right. Compare each choice with the meaning clue, then try again." : "Compare each sound box with your spelling. Change the part that does not match, then try again.";
        update(id, { attempts, feedback: message });
      } else {
        const message = phase === "text" ? "You wrote an explanation. A teacher can review whether it uses the passage accurately. Now try a new word on your own." : phase === "transfer" ? "The new spelling matches the taught pattern. Review any earlier errors, then choose your next lesson." : "That matches the sounds and meaning. Move to the next task.";
        if (phase === "text") recordEvidence(lesson, ctx.band, "first", "guided", { skill: "comprehension-response", words: value.split(/\s+/).length, teacherReview: true });
        update(id, { phase: PHASES[PHASES.indexOf(phase) + 1], attempts: 0, feedback: message, ...(phase === "transfer" ? { doneAt: new Date().toISOString() } : {}) });
      }
    } else return;
    ctx.rerender();
  });
}
