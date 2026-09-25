import { ALL_SKILLS, GRADES, generateProblem, seededRandom } from "./problem-bank.js";
import { evidence, findSkill, localDay, sanitizeTutor, skillKey } from "./tutor-engine.js";

export const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const PROFILE_KEY = "ewl-fluency-profiles-v1";
export const PROFILE_NAMES = ["Orbit", "River", "Comet", "Forest", "Ocean", "Sunrise"];
let storageUnavailable = false;

export function readLocal(key, fallback) {
  try { const value = localStorage.getItem(key); return value == null ? fallback : JSON.parse(value); }
  catch { return fallback; }
}
export function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch {
    if (!storageUnavailable) { storageUnavailable = true; window.dispatchEvent(new CustomEvent("fluency-storage-unavailable")); }
    return false;
  }
}
export function profiles() {
  const stored = readLocal(PROFILE_KEY, {});
  const ids = [...new Set((Array.isArray(stored.ids) ? stored.ids : [0]).filter((id) => Number.isInteger(id) && id >= 0 && id < PROFILE_NAMES.length))];
  if (!ids.length) ids.push(0);
  return { ids, active: ids.includes(stored.active) ? stored.active : ids[0] };
}
export function selectProfile(id) { const data = profiles(); if (!data.ids.includes(id)) data.ids.push(id); data.active = id; writeLocal(PROFILE_KEY, data); }
export const profileKey = (base, id) => id === 0 ? base : `${base}:profile-${id}`;

export function cleanProgress(value) {
  const clean = {};
  if (!value || typeof value !== "object") return clean;
  for (const skill of ALL_SKILLS) {
    const record = value[skillKey(skill)]; if (!record || typeof record !== "object") continue;
    const safe = {};
    for (const key of ["attempts", "correct", "completedSets", "bestStreak", "sprintBest", "guidedProblems", "guidedCorrect", "guidedSets"]) safe[key] = Math.min(10000000, Math.max(0, Math.floor(Number(record[key]) || 0)));
    safe.correct = Math.min(safe.correct, safe.attempts);
    safe.lastPracticed = typeof record.lastPracticed === "string" ? record.lastPracticed.slice(0, 40) : null;
    clean[skillKey(skill)] = safe;
  }
  return clean;
}

export function downloadFile(filename, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function makeBackup({ progress, tutor, settings, grade }) {
  return { app: "EduWonderLab Fluency Lab", version: 2, exportedAt: new Date().toISOString(), grade,
    progress: cleanProgress(progress), tutor: sanitizeTutor(tutor), settings: { largeText: Boolean(settings.largeText), focus: Boolean(settings.focus) } };
}
export function parseBackup(value) {
  if (!value || value.app !== "EduWonderLab Fluency Lab" || value.version !== 2 || !value.tutor || value.tutor.version !== 2) throw new Error("Choose a Fluency Lab progress backup (.json). The current profile has not changed.");
  return makeBackup({ progress: value.progress, tutor: value.tutor, settings: value.settings || {}, grade: GRADES.some((grade) => grade.grade === value.grade) ? value.grade : 1 });
}

export function validateAssignment(value) {
  if (!value || value.version !== 1 || !GRADES.some((grade) => grade.grade === value.grade)) return null;
  const keys = [...new Set((Array.isArray(value.keys) ? value.keys : []).filter((key) => findSkill(key)?.grade === value.grade))].slice(0, 10);
  if (!keys.length) return null;
  return { version: 1, grade: value.grade, keys, count: [5, 10, 15, 20].includes(value.count) ? value.count : 10, mode: value.mode === "guided" ? "guided" : "adaptive", label: String(value.label || "Class practice").slice(0, 80) };
}
export function encodeAssignment(value) {
  const assignment = validateAssignment(value); if (!assignment) throw new Error("Choose at least one skill.");
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(assignment)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
export function decodeAssignment(token) {
  if (typeof token !== "string" || token.length > 5000) return null;
  try { const decoded = atob(token.replaceAll("-", "+").replaceAll("_", "/")); return validateAssignment(JSON.parse(new TextDecoder().decode(Uint8Array.from(decoded, (char) => char.charCodeAt(0))))); }
  catch { return null; }
}
export function assignmentQueue(assignment, rng = Math.random) {
  const queue = [];
  while (queue.length < assignment.count) {
    const round = [...assignment.keys];
    for (let i = round.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [round[i], round[j]] = [round[j], round[i]]; }
    for (const key of round) if (queue.length < assignment.count) queue.push({ key, purpose: assignment.label });
  }
  return queue;
}

export function progressReport(tutor, grade) {
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["Grade", "Skill", "Current evidence", "Independent recent checks", "Independent recent correct", "Coached total", "Review due"]];
  for (const skill of ALL_SKILLS.filter((entry) => entry.grade === grade)) {
    const status = evidence(tutor, skill);
    rows.push([grade, skill.title, status.label, status.independent, status.successes, status.supportedTotal || 0, status.dueAt ? localDay(status.dueAt) : ""]);
  }
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export function printablePacket(assignment, { includeKey = false, seed = Date.now() } = {}) {
  const rng = seededRandom(seed);
  const days = Array.from({ length: 5 }, (_, day) => {
    const questions = Array.from({ length: 8 }, (_, index) => ({ skill: findSkill(assignment.keys[(day * 8 + index) % assignment.keys.length]) })).map(({ skill }) => ({ skill, item: generateProblem(skill, rng) }));
    return { day, questions };
  });
  const pages = days.map(({ day, questions }) => `<article class="packet-page"><header><p>Math Fluency Lab · Grade ${assignment.grade}</p><h1>${escapeHtml(assignment.label)} · Day ${day + 1}</h1><p>Name: ____________________ Date: __________</p></header><p>Work at your pace. Show one useful step. Ask someone to explain one strategy with you.</p><ol>${questions.map(({ item }) => `<li><span>${escapeHtml(item.question)}</span><i></i></li>`).join("")}</ol><footer>Tell it back: Which strategy helped today? ______________________________</footer></article>`).join("");
  const key = includeKey ? `<article class="packet-page teacher-answer-page"><h1>Teacher answer key</h1>${days.map(({ day, questions }) => `<h2>Day ${day + 1}</h2><p>${questions.map(({ item }, i) => `${i + 1}. ${escapeHtml(item.displayAnswer)}`).join(" · ")}</p>`).join("")}</article>` : "";
  return pages + key;
}

export function mountTeacherStudio(container, { grade: initialGrade, onLaunch, onPrint, announce }) {
  let grade = initialGrade;
  let selected = new Set();
  let assignment = null;
  let label = "Class practice";
  let count = 10;
  let mode = "adaptive";
  function render() {
    const skills = ALL_SKILLS.filter((skill) => skill.grade === grade);
    container.innerHTML = `<div class="section-heading"><div><p class="section-label">Teacher studio</p><h2>One useful assignment. Fresh practice every time.</h2><p>Choose the skills your class needs. Share the link through your classroom system, project it, or send it home.</p></div></div>
      <div class="teacher-layout"><form id="assignment-builder"><label for="assignment-label">Assignment title<input id="assignment-label" maxlength="80" value="${escapeHtml(label)}"/></label><div class="form-row"><label for="assignment-grade">Grade<select id="assignment-grade">${GRADES.map((g) => `<option value="${g.grade}" ${g.grade === grade ? 'selected' : ''}>${g.label}</option>`).join("")}</select></label><label for="assignment-count">Problems per visit<select id="assignment-count">${[5, 10, 15, 20].map((n) => `<option ${n === count ? 'selected' : ''}>${n}</option>`).join("")}</select></label></div>
      <label for="assignment-mode">Support level<select id="assignment-mode"><option value="adaptive" ${mode === 'adaptive' ? 'selected' : ''}>Adaptive: help when needed</option><option value="guided" ${mode === 'guided' ? 'selected' : ''}>Coached: strategy steps always open</option></select></label>
      <fieldset class="assignment-skills"><legend>Choose one or more skills</legend>${skills.map((skill) => `<label><input type="checkbox" name="assignment-skill" value="${skillKey(skill)}" ${selected.has(skillKey(skill)) ? 'checked' : ''}/><span>${escapeHtml(skill.title)}<small>${escapeHtml(skill.standard)}</small></span></label>`).join("")}</fieldset><button type="submit" class="primary-action">Build assignment</button><p id="assignment-error" role="status"></p></form>
      <aside class="teacher-guide"><h3>Use it across the school day</h3><ul><li><strong>Arrival:</strong> open Today’s 10 for an individual start.</li><li><strong>Small group:</strong> work through a visual lesson together.</li><li><strong>Independent station:</strong> share a focused skill playlist.</li><li><strong>At home:</strong> repeat the same link for fresh problems, then explain a strategy.</li><li><strong>Without a screen:</strong> print a five-day packet.</li></ul><h3>Progress and privacy</h3><p>Each browser profile saves its own work. Students can download a progress report or backup to bring between devices. Assignment links contain the task only.</p><p>This version does not send student results to a teacher or maintain a central roster. Use your classroom system to collect downloaded reports if needed.</p></aside></div><section id="assignment-result" class="assignment-result" aria-live="polite" hidden></section>`;
  }
  const capture = () => {
    label = container.querySelector("#assignment-label").value.trim() || "Class practice";
    count = Number(container.querySelector("#assignment-count").value);
    mode = container.querySelector("#assignment-mode").value;
    selected = new Set([...container.querySelectorAll('[name="assignment-skill"]:checked')].map((input) => input.value));
  };
  container.onchange = (event) => { if (event.target.id === "assignment-grade") { capture(); grade = Number(event.target.value); selected = new Set(); render(); } };
  container.onsubmit = (event) => {
    event.preventDefault(); capture();
    assignment = validateAssignment({ version: 1, grade, keys: [...selected], count, mode, label });
    if (!assignment) { container.querySelector("#assignment-error").textContent = "Choose at least one skill, then build the assignment."; return; }
    const token = encodeAssignment(assignment);
    const url = new URL("https://eduwonderlab.com/math/fluency-lab/"); url.hash = `assignment=${token}`;
    const result = container.querySelector("#assignment-result"); result.hidden = false;
    result.innerHTML = `<h3>${escapeHtml(label)}</h3><p>Grade ${grade} · ${selected.size} skill${selected.size === 1 ? '' : 's'} · ${count} problems each visit. New numbers are generated each time.</p><label for="assignment-link">Student link<input id="assignment-link" readonly value="${escapeHtml(url.href)}"/></label><div class="button-row"><button class="primary-action" type="button" data-launch-assignment>Try this assignment</button><button class="outline-action" type="button" data-copy-assignment>Copy student link</button><button class="outline-action" type="button" data-print-packet>Print a five-day packet</button></div><label class="inline-check"><input type="checkbox" id="packet-key"/> Add a separate teacher answer-key page to the printed packet</label><p class="family-message">At home: open the link, choose your local profile, and complete a set. Use “See it & build it” when you need a visual explanation. Tell someone one strategy you used.</p>`;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  container.onclick = async (event) => {
    if (event.target.closest("[data-launch-assignment]") && assignment) onLaunch(assignment);
    if (event.target.closest("[data-print-packet]") && assignment) onPrint(printablePacket(assignment, { includeKey: container.querySelector("#packet-key").checked }));
    if (event.target.closest("[data-copy-assignment]")) {
      const input = container.querySelector("#assignment-link");
      try { await navigator.clipboard.writeText(input.value); announce("Assignment link copied."); }
      catch { input.focus(); input.select(); announce("Select and copy the student link."); }
    }
  };
  render();
}
