// Classroom teacher page (access-teacher/classroom/index.html): one lesson in, one lesson kit out. The teacher gives a
// grade, a topic, key words and what students will do with language; the page shows three teaching moves, a sentence-frame
// card at three support levels, a word card per key word and a practice link for students, all from frames.js.
// The last lesson is kept on this device (a per-device convenience: nothing is sent anywhere).
import {
  GRADES,
  MOVES,
  SKILL_FOR_USE,
  USES,
  buildCard,
  cardText,
  gradeInfo,
  studentLink,
} from "./frames.js";

const KEY = "accessTeacher:v1:classroomLesson";
const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
// A blank keeps the punctuation after it on the same line, so "is ___." never leaves a lone period below.
const blanks = (s) =>
  esc(s).replace(
    /___([.,;:?!]?)/g,
    '<span class="lc-nb"><span class="lc-blank"><span class="visually-hidden">blank</span></span>$1</span>',
  );
const gradeName = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

const saved = read();
const params = new URLSearchParams(location.search);
const pickUse = (v) => (USES.some((u) => u.id === v) ? v : "");
const state = {
  grade: GRADES.includes(params.get("grade")) ? params.get("grade") : GRADES.includes(saved.grade) ? saved.grade : "6",
  topic: typeof saved.topic === "string" ? saved.topic : "",
  words: typeof saved.words === "string" ? saved.words : "",
  use: pickUse(params.get("use")) || pickUse(saved.use) || "explain",
  spanish: saved.spanish === true,
};

function setUp() {
  $("#lcGrade").innerHTML = GRADES.map(
    (g) => `<option value="${g}" ${g === state.grade ? "selected" : ""}>${gradeName(g)}</option>`,
  ).join("");
  $("#lcUses").innerHTML = USES.map(
    (u) =>
      `<label class="lc-use"><input type="radio" name="use" value="${u.id}" ${u.id === state.use ? "checked" : ""} /><span><strong>${esc(u.name[0])}</strong><span>${esc(u.task[0].replace("{topic}", "the topic"))}</span></span></label>`,
  ).join("");
  $("#lcTopic").value = state.topic;
  $("#lcWords").value = state.words;
  $("#lcSpanish").checked = state.spanish;
}

function cardHTML(card, es) {
  const levels = card.levels
    .map(
      (l) => `<section class="lc-level is-${l.id}">
        <h4>${esc(l.name[0])}${es ? ` <span lang="es">· ${esc(l.name[1])}</span>` : ""}</h4>
        <ul>${l.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>
        <p class="lc-connectors"><span>Useful words:</span> ${l.connectors.map((w) => `<span class="lc-chip">${esc(w)}</span>`).join(" ")}</p>
      </section>`,
    )
    .join("");
  return `
    <header class="lc-card-head">
      <p class="lc-card-use">${esc(card.useName[0])}${es ? ` <span lang="es">· ${esc(card.useName[1])}</span>` : ""}</p>
      <p class="lc-card-topic">${card.topic ? esc(card.topic) : "Today's topic"}</p>
      <p class="lc-card-task">${esc(card.task[0])}${es ? `<br /><span lang="es">${esc(card.task[1])}</span>` : ""}</p>
    </header>
    ${card.keyWords.length ? `<div class="lc-bank"><p class="lc-label">Key words${es ? ` <span lang="es">· Palabras clave</span>` : ""}</p><p>${card.keyWords.map((w) => `<span class="lc-chip is-key">${esc(w)}</span>`).join(" ")}</p></div>` : ""}
    <div class="lc-levels" data-count="${card.levels.length}">${levels}</div>
    <div class="lc-talk">
      <p class="lc-label">Partner talk${es ? ` <span lang="es">· Hablen en pareja</span>` : ""}</p>
      <p><strong>A asks:</strong> ${esc(card.talk.ask)}</p>
      <p><strong>B answers:</strong> ${blanks(card.talk.answer)}</p>
    </div>
    <p class="lc-card-foot">Pick the level that helps you. Try the next level when you are ready.${es ? ` <span lang="es">Elige el nivel que te ayude. Prueba el siguiente cuando estés listo.</span>` : ""}</p>`;
}

function wordCardsHTML(words, topic) {
  if (!words.length)
    return `<p class="lc-empty">Add key words in step 1 and a card appears here for each one.</p>`;
  return words
    .map(
      (w) => `<article class="lc-word">
        <p class="lc-word-term">${esc(w)}</p>
        ${topic ? `<p class="lc-word-topic">${esc(topic)}</p>` : ""}
        <div class="lc-word-draw">Draw it</div>
        <p class="lc-word-label">It means</p>
        <span class="lc-line"></span>
        <p class="lc-word-label">My sentence</p>
        <span class="lc-line"></span><span class="lc-line"></span>
      </article>`,
    )
    .join("");
}

function render() {
  const info = gradeInfo(state.grade);
  const card = buildCard({ use: state.use, band: info.band, topic: state.topic, words: state.words });
  if (!card) return;
  $("#lcMoves").innerHTML = `<div class="lc-move-group"><p class="lc-label">For “${esc(card.useName[0])}”</p><ul class="lc-move-list">${MOVES[state.use].map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div><div class="lc-move-group"><p class="lc-label">Every lesson</p><ul class="lc-move-list">${MOVES.any.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
  $("#lcCard").innerHTML = cardHTML(card, state.spanish);
  $("#lcSpanishNote").hidden = !state.spanish;
  $("#lcWordCards").innerHTML = wordCardsHTML(card.keyWords, card.topic);
  const link = studentLink(state.grade, state.use);
  const skill = SKILL_FOR_USE[state.use];
  $("#lcLink").textContent = `${location.origin}${link}`;
  $("#lcOpen").href = link;
  $("#lcPracticeLine").textContent = info.early
    ? `Opens picture-first English practice for ${gradeName(state.grade).toLowerCase()} students.`
    : `Opens English practice for ${gradeName(state.grade).toLowerCase()} at ${skill}, the skill that fits “${card.useName[0]}”. Students choose how much help they want.`;
  write(state);
}

function onInput(e) {
  const t = e.target;
  if (t.name === "grade") state.grade = t.value;
  else if (t.name === "topic") state.topic = t.value;
  else if (t.name === "words") state.words = t.value;
  else if (t.name === "use") state.use = t.value;
  else if (t.name === "spanish") state.spanish = t.checked;
  else return;
  render();
}

async function copyText(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    $("#lcStatus").textContent = done;
  } catch {
    $("#lcStatus").textContent = "Copy is blocked in this browser. Select the text and copy it instead.";
  }
}

function printPart(part) {
  document.body.dataset.print = part;
  const clear = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", clear);
  };
  window.addEventListener("afterprint", clear);
  window.print();
}

setUp();
render();
for (const type of ["input", "change"]) document.addEventListener(type, onInput);
document.addEventListener("click", (e) => {
  const print = e.target.closest("[data-lc-print]");
  if (print) printPart(print.dataset.lcPrint);
  if (e.target.closest("[data-lc-copy]")) {
    const info = gradeInfo(state.grade);
    const card = buildCard({ use: state.use, band: info.band, topic: state.topic, words: state.words });
    copyText(cardText(card), "Copied the frames. Paste them into your slides or lesson plan.");
  }
  if (e.target.closest("[data-lc-copy-link]"))
    copyText($("#lcLink").textContent, "Copied the student link. Post it in your class page or LMS.");
});
