// ACCESS Score Interpreter. Composite weights checked 2026-11-27 against the WIDA ACCESS Interpretive Guide for
// Student Score Reports 2025–2026 (docs/sources.md): Oral 50L+50S, Literacy 50R+50W, Comprehension 70R+30L,
// Overall 35R+35W+15L+15S. WIDA computes composites from SCALE scores; from proficiency levels this is an estimate,
// and the page says so. Everything runs in the browser. Nothing is transmitted.
import { $, download, escapeHtml, loadDraft, parseTable, printOnly, saveDraft } from "../lib.js";

export const WEIGHTS = {
  Oral: { listening: 0.5, speaking: 0.5 },
  Literacy: { reading: 0.5, writing: 0.5 },
  Comprehension: { reading: 0.7, listening: 0.3 },
  Overall: { reading: 0.35, writing: 0.35, listening: 0.15, speaking: 0.15 },
};
const DOMAINS = ["listening", "speaking", "reading", "writing"];
const NAMES = ["", "Entering", "Emerging", "Developing", "Expanding", "Bridging", "Reaching"];
const NAMES_ES = ["", "Inicial", "Emergente", "En desarrollo", "En expansión", "En transición", "Avanzado"];
const DOMAIN_ES = { listening: "Escuchar", speaking: "Hablar", reading: "Leer", writing: "Escribir" };
const MD_EXIT = 4.5; // Maryland Overall exit criterion (checked 2026-11-27)

const MEANING = {
  listening: ["Understands simple directions and key words, especially with pictures and gestures.", "Follows most classroom talk on familiar topics; may miss details in longer or faster speech.", "Understands academic talk on grade-level topics, including details and implied meaning."],
  speaking: ["Uses words, short phrases and memorized expressions.", "Speaks in connected sentences about school topics; errors sometimes affect meaning.", "Explains and argues in organized, detailed speech with precise words."],
  reading: ["Reads labels, short sentences and texts with strong picture support.", "Reads grade-level texts with support; finds main ideas and details.", "Reads grade-level texts independently, including inference and the author's purpose."],
  writing: ["Writes words, phrases and simple sentences, often from a model.", "Writes connected sentences and short paragraphs; errors are common but meaning is clear.", "Writes organized paragraphs with varied sentences and precise words."],
};
const MOVES = {
  listening: [["Pair spoken directions with gestures, pictures and a model.", "Pre-teach five key words with pictures before each lesson."], ["Give a listening purpose and a notes organizer before audio or a lecture.", "Check understanding with partner retell frames."], ["Use academic discussions with note-taking and summarizing.", "Teach signal words for cause, contrast and evidence."]],
  speaking: [["Give sentence frames and a word bank for every turn-and-talk.", "Let students rehearse with a partner before sharing."], ["Ask for 'because' and 'for example' in every answer.", "Use structured talk routines: say, say more, ask a question."], ["Coach precise vocabulary and responding to the other side.", "Give chances to present and to lead discussions."]],
  reading: [["Use picture-supported texts and pre-taught vocabulary.", "Read aloud first, then read together."], ["Chunk texts with stop-and-check questions.", "Teach text structure with a matching graphic organizer."], ["Focus on inference, the author's craft and comparing sources.", "Teach word parts (morphology) to unlock academic words."]],
  writing: [["Use labeled drawings, word banks and sentence frames.", "Write together out loud, then let students write their own."], ["Use paragraph frames and organizers matched to the purpose.", "Give feedback on one thing at a time: order, sentences or word choice."], ["Study mentor texts for linking words and precise language.", "Focus revision on varied sentences and transitions."]],
};
const band = (v) => (v < 3 ? 0 : v < 5 ? 1 : 2);
const round1 = (x) => Math.round(x * 10 + 1e-9) / 10;
export function composites(s) {
  const out = {};
  for (const [name, w] of Object.entries(WEIGHTS)) out[name] = round1(Object.entries(w).reduce((sum, [d, k]) => sum + s[d] * k, 0));
  return out;
}
const level = (v) => `${v.toFixed(1)} · ${NAMES[Math.min(6, Math.floor(v))]}`;
function valid(v) {
  return Number.isFinite(v) && v >= 1 && v <= 6;
}

/* ---------- one student ---------- */
const form = $("[data-si-form]");
const out = $("[data-si-out]");
function readOne() {
  const fd = new FormData(form);
  const s = { id: (fd.get("id") || "").toString().trim().slice(0, 12), grade: fd.get("grade") };
  for (const d of DOMAINS) s[d] = Number.parseFloat(fd.get(d));
  return s;
}
function letter(s, c, lang) {
  const id = escapeHtml(s.id || (lang === "es" ? "su hijo o hija" : "your child"));
  const rows = DOMAINS.map((d) => `<li>${lang === "es" ? DOMAIN_ES[d] : d[0].toUpperCase() + d.slice(1)}: <strong>${s[d].toFixed(1)}</strong> (${lang === "es" ? NAMES_ES[Math.floor(s[d])] : NAMES[Math.floor(s[d])]})</li>`).join("");
  const lowest = DOMAINS.reduce((a, b) => (s[b] < s[a] ? b : a));
  if (lang === "es")
    return `<h3>Resultados de WIDA ACCESS de ${id}</h3><p>Estimada familia:</p><p>Cada año, los estudiantes que aprenden inglés toman la prueba WIDA ACCESS. Mide el inglés para la escuela en cuatro destrezas. Los niveles van del 1 al 6.</p><ul>${rows}</ul><p>Nivel general aproximado: <strong>${c.Overall.toFixed(1)}</strong>. En Maryland, un nivel general de 4.5 o más permite salir de los servicios de inglés.</p><p>La destreza para practicar más es <strong>${DOMAIN_ES[lowest]}</strong>. En casa: hablen todos los días en su idioma, lean juntos 15 minutos y pregunten "¿Qué aprendiste hoy y por qué?"</p><p>Si tiene preguntas, comuníquese con la escuela.</p><p class="muted">Borrador en español pendiente de revisión.</p>`;
  return `<h3>WIDA ACCESS results for ${id}</h3><p>Dear family,</p><p>Every year, students who are learning English take the WIDA ACCESS test. It measures English for school in four skills. Levels go from 1 to 6.</p><ul>${rows}</ul><p>Approximate overall level: <strong>${c.Overall.toFixed(1)}</strong>. In Maryland, an overall level of 4.5 or higher means a student can leave English learner services.</p><p>The skill to practice most is <strong>${lowest}</strong>. At home: talk every day in your home language, read together for 15 minutes, and ask "What did you learn today, and why?"</p><p>If you have questions, please contact the school.</p>`;
}
function renderOne() {
  const s = readOne();
  saveDraft("score-interpreter", s, { quiet: true });
  const bad = DOMAINS.filter((d) => !valid(s[d]));
  $("[data-si-errors]").textContent = bad.length ? `Enter a level from 1.0 to 6.0 for: ${bad.join(", ")}.` : "";
  if (bad.length) {
    out.innerHTML = '<div class="empty"><p>Enter all four domain levels to see the summary.</p></div>';
    return;
  }
  const c = composites(s);
  const lowest = DOMAINS.reduce((a, b) => (s[b] < s[a] ? b : a));
  out.innerHTML = `
  <div class="panel stack" id="si-summary">
    <div class="print-only print-header"><span>WIDA ACCESS summary · ${escapeHtml(s.id)} · Grade ${escapeHtml(s.grade)}</span><span>The Language Page</span></div>
    <h2 class="h4">Composite estimates <span class="approx" title="WIDA computes composites from scale scores. These are estimated from proficiency levels.">estimate</span></h2>
    <div class="table-wrap"><table><thead><tr><th scope="col">Composite</th><th scope="col">How it is weighted</th><th scope="col">Estimate</th></tr></thead><tbody>
    ${Object.entries(WEIGHTS).map(([n, w]) => `<tr><td><strong>${n}</strong></td><td>${Object.entries(w).map(([d, k]) => `${Math.round(k * 100)}% ${d}`).join(" + ")}</td><td>${level(c[n])}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="note ${c.Overall >= MD_EXIT ? "" : "amber"}">${c.Overall >= MD_EXIT ? `The Overall estimate is at or above Maryland's exit criterion (${MD_EXIT}). Confirm with the official score report.` : `The Overall estimate is below Maryland's exit criterion (${MD_EXIT}).`} Districts apply state rules; check with your English learner office.</p>
    <p class="muted">2025–26 caution: WIDA set new standards in July 2026 and advises using 2025–26 proficiency levels with caution.</p>
    <h2 class="h4">What each domain level means</h2>
    <div class="grid cols-2">${DOMAINS.map((d) => `<div class="band"><h3 class="h4">${d[0].toUpperCase() + d.slice(1)}: ${level(s[d])}</h3><p>${MEANING[d][band(s[d])]}</p><p class="label">Next moves</p><ul>${MOVES[d][band(s[d])].map((m) => `<li>${m}</li>`).join("")}</ul></div>`).join("")}</div>
    <p><strong>Focus first:</strong> ${lowest} (the lowest domain). ${Math.abs(c.Oral - c.Literacy) >= 1 ? `There is a gap of ${Math.abs(c.Oral - c.Literacy).toFixed(1)} between Oral and Literacy, so plan for ${c.Oral > c.Literacy ? "reading and writing" : "listening and speaking"} support across classes.` : ""}</p>
    <p class="muted">Descriptions and moves are original summaries written for this site, not WIDA descriptors.</p>
  </div>
  <div class="btn-row no-print section"><button type="button" class="btn" data-print-summary>Print summary</button><button type="button" class="btn secondary" data-print-letter="en">Family letter (English)</button><button type="button" class="btn secondary" data-print-letter="es">Carta para la familia (español)</button></div>
  <div class="panel prose section" data-letter-en>${letter(s, c, "en")}</div>
  <div class="panel prose section" lang="es" data-letter-es>${letter(s, c, "es")}</div>`;
  $("[data-print-summary]", out).addEventListener("click", () => printOnly($("#si-summary", out)));
  for (const b of out.querySelectorAll("[data-print-letter]")) b.addEventListener("click", () => printOnly($(`[data-letter-${b.dataset.printLetter}]`, out)));
}

/* ---------- class view ---------- */
const roster = $("#si-roster");
const classOut = $("[data-si-class-out]");
function renderClass() {
  const rows = parseTable(roster.value);
  const students = [];
  const problems = [];
  for (const [i, r] of rows.entries()) {
    const [id, ...vals] = r;
    const nums = vals.slice(0, 4).map((v) => Number.parseFloat(v));
    if (nums.length < 4 || nums.some((v) => !valid(v))) {
      problems.push(i + 1);
      continue;
    }
    const s = { id: String(id).slice(0, 12), listening: nums[0], speaking: nums[1], reading: nums[2], writing: nums[3] };
    students.push({ ...s, c: composites(s), low: DOMAINS.reduce((a, b) => (s[b] < s[a] ? b : a)) });
  }
  students.sort((a, b) => a.c.Overall - b.c.Overall);
  const groups = [
    ["Foundations", (x) => x < 2.5],
    ["Building", (x) => x >= 2.5 && x < 4],
    ["Expanding", (x) => x >= 4 && x < MD_EXIT],
    [`At or above ${MD_EXIT} (Maryland exit criterion)`, (x) => x >= MD_EXIT],
  ];
  classOut.innerHTML = `
  <div class="panel stack" id="si-class">
    <div class="print-only print-header"><span>Class WIDA ACCESS summary (${students.length} students)</span><span>The Language Page</span></div>
    ${problems.length ? `<p class="note amber">Skipped line${problems.length > 1 ? "s" : ""} ${problems.join(", ")}: each line needs an ID and four levels from 1.0 to 6.0.</p>` : ""}
    <div class="table-wrap"><table><thead><tr><th scope="col">ID</th><th scope="col">L</th><th scope="col">S</th><th scope="col">R</th><th scope="col">W</th><th scope="col">Oral</th><th scope="col">Literacy</th><th scope="col">Overall*</th><th scope="col">Focus</th></tr></thead><tbody>
    ${students.map((s) => `<tr><td>${escapeHtml(s.id)}</td><td>${s.listening}</td><td>${s.speaking}</td><td>${s.reading}</td><td>${s.writing}</td><td>${s.c.Oral.toFixed(1)}</td><td>${s.c.Literacy.toFixed(1)}</td><td><strong>${s.c.Overall.toFixed(1)}</strong></td><td>${s.low}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted">*Composite estimates from proficiency levels; WIDA computes them from scale scores.</p>
    <h2 class="h4">Suggested groups by Overall estimate</h2>
    <div class="grid cols-2">${groups.map(([name, test]) => { const g = students.filter((s) => test(s.c.Overall)); return `<div class="band"><h3 class="h4">${name} (${g.length})</h3><p>${g.map((s) => escapeHtml(s.id)).join(", ") || "None"}</p></div>`; }).join("")}</div>
    <h2 class="h4">Domain focus groups (lowest domain)</h2>
    <div class="grid cols-2">${DOMAINS.map((d) => { const g = students.filter((s) => s.low === d); return `<div class="band"><h3 class="h4">${d[0].toUpperCase() + d.slice(1)} (${g.length})</h3><p>${g.map((s) => escapeHtml(s.id)).join(", ") || "None"}</p>${g.length ? `<p class="muted">${MOVES[d][1][0]}</p>` : ""}</div>`; }).join("")}</div>
  </div>
  <div class="btn-row no-print section"><button type="button" class="btn" data-print-class>Print one-page summary</button></div>`;
  $("[data-print-class]", classOut).addEventListener("click", () => printOnly($("#si-class", classOut)));
}

const draft = loadDraft("score-interpreter");
if (draft)
  for (const k of ["id", "grade", ...DOMAINS]) if (draft[k] != null && form.elements[k] && !Number.isNaN(draft[k])) form.elements[k].value = draft[k];
form.addEventListener("input", renderOne);
roster.addEventListener("input", renderClass);
/* CSV upload: read in the browser, header row (no numbers) skipped. Template: a blank file to fill in. */
$("#si-file")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 300_000) {
    $("[data-si-class-out]").innerHTML = '<p class="note amber">That file is too large for a class roster.</p>';
    return;
  }
  const rows = parseTable(await file.text()).filter((r) => r.slice(1).some((c) => /\d/.test(c)));
  roster.value = rows.map((r) => r.slice(0, 5).join(", ")).join("\n");
  renderClass();
});
$("[data-si-template]")?.addEventListener("click", () =>
  download("access-roster-template.csv", "ID,Listening,Speaking,Reading,Writing\nA.B.,,,,\n", "text/csv"),
);
renderOne();
renderClass();
