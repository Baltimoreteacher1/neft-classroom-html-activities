import { Repository } from "./repository.js";
import { SeedEngine } from "./seed-engine.js";
import { TriageEngine } from "./triage-engine.js";
import { LaunchBuilder } from "./launch-builder.js";
import { MathSVGService } from "./math-svg-service.js";
import { TeacherPortalController } from "./state-machine.js";
import { selfTest } from "./self-test.js";

const root = document.querySelector("#modeContent");
const search = document.querySelector("#search");
const searchResults = document.querySelector("#searchResults");
const toast = document.querySelector("#toast");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const url = (path) => new URL(path || "/curriculum/", location.origin).href;
const unitName = (n) => Repository.lessonTitle(manifest?.units.find((unit) => unit.number === n)?.title) || `Unit ${n}`;
let manifest = null, activeSvg = "", studioSvg = "", lessonDetail = null, detailAbort = null, detailSequence = 0, toastTimer;
let lastState = null;
const controller = TeacherPortalController.create((state) => {
  const relevant = !lastState || ["mode", "lessonId", "projector", "diagnostic", "drawerOpen"].some((k) => state[k] !== lastState[k]) || state.timerRunning !== lastState.timerRunning;
  lastState = state;
  updateStatus(state);
  document.body.classList.toggle("projector", state.projector);
  document.documentElement.dataset.theme = document.documentElement.dataset.theme || getSavedTheme();
  if (manifest && relevant) { UIRenderer.render(state); loadLessonDetail(state); }
});
function getSavedTheme() { try { return localStorage.getItem("ewl-flight-deck-theme") || "system"; } catch { return "system"; } }
function setTheme(next) {
  const value = next === "system" ? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : next;
  document.documentElement.dataset.theme = value;
  try { localStorage.setItem("ewl-flight-deck-theme", next); } catch { /* Theme remains usable for this visit. */ }
  document.querySelector("#themeToggle").setAttribute("aria-label", `Switch color theme (current: ${value})`);
}
function showToast(message) { toast.textContent = message; toast.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1900); }
function activeLesson(state = controller.snapshot()) { return Repository.find(manifest, state.lessonId); }
function updateStatus(state) {
  const lesson = activeLesson(state);
  document.querySelector("#activeLessonStatus").textContent = lesson ? `${unitName(lesson.unit)} · Lesson ${lesson.id}` : "Choose a lesson";
  document.querySelector("#timerStatus").textContent = state.timerRunning ? `Pacing timer · ${String(Math.floor(state.timer / 60)).padStart(2, "0")}:${String(state.timer % 60).padStart(2, "0")}` : "Timer ready";
  const flags = [state.scaffolds.bilingual && "Bilingual", state.scaffolds.frames && "Frames", state.scaffolds.visual && "Visual", state.scaffolds.timerOff && "Untimed"].filter(Boolean);
  document.querySelector("#scaffoldStatus").textContent = flags.length ? `Scaffolds · ${flags.join(" · ")}` : "No launch scaffolds";
  document.querySelector("#projectorToggle").textContent = `Projector mode ${state.projector ? "on" : "off"}`;
}
function resourceCards(lesson) {
  return Repository.resources(lesson).map((resource) => `<a class="resource-card" href="${esc(url(resource.href))}" target="_blank" rel="noopener"><span class="resource-icon" aria-hidden="true">${({ notes: "▤", teacher: "▣", lab: "◉", print: "▱", slides: "▧" })[resource.kind]}</span><span><b>${esc(resource.title)}</b><small>${esc(resource.note)}</small></span><span class="resource-arrow" aria-hidden="true">↗</span></a>`).join("");
}
function vocabularyPage(lesson) {
  const entries = lessonDetail?.lessonId === lesson.id ? lessonDetail.vocabulary : [];
  if (!entries.length) return "";
  return `<div class="section-label">VOCABULARY PAGE <span>Term · definition · example · visual · frame</span></div><div class="vocabulary-page">${entries.slice(0, 6).map((entry) => {
    const positive = entry.examples?.find((item) => item.isExample), negative = entry.examples?.find((item) => !item.isExample);
    return `<details class="vocabulary-card"><summary>${esc(entry.term)}${entry.termEs ? `<small>${esc(entry.termEs)}</small>` : ""}</summary><div class="vocabulary-fields"><div><b>Student-friendly definition</b><p>${esc(entry.definition || "")}</p>${entry.definitionEs ? `<p class="vocab-es">${esc(entry.definitionEs)}</p>` : ""}</div><div><b>Example</b><p>${esc(positive?.text || entry.example || "")}</p></div><div><b>Non-example</b><p>${esc(negative?.text || "")}</p></div><div><b>Visual cue</b><p>${esc(entry.visual || "Connect the term to the lesson model.")}</p></div><div><b>Sentence frame</b><p>${esc(entry.cloze || `The term ${esc(entry.term)} means ___.`)}</p></div></div></details>`;
  }).join("")}</div>`;
}
async function loadLessonDetail(state) {
  if (state.mode !== "plan") return;
  const lesson = activeLesson(state); if (!lesson || lessonDetail?.lessonId === lesson.id) return;
  detailAbort?.abort(); detailAbort = new AbortController(); const sequence = ++detailSequence;
  try { const data = await Repository.loadLessonDetail(lesson.id, detailAbort.signal); if (sequence !== detailSequence || controller.snapshot().lessonId !== lesson.id || controller.snapshot().mode !== "plan") return; lessonDetail = { lessonId: lesson.id, ...data }; UIRenderer.render(controller.snapshot()); }
  catch (error) { if (error.name !== "AbortError") console.warn("Lesson vocabulary unavailable", { lessonId: lesson.id, message: error.message }); }
}
function selectLesson(lesson) { controller.lesson(lesson.id); search.value = ""; searchResults.hidden = true; search.focus(); }
function lessonSelector(lesson) { return `<label class="field-label" for="lessonSelect">Active lesson</label><select id="lessonSelect">${manifest.units.map((unit) => `<optgroup label="${esc(`Unit ${unit.number} · ${Repository.lessonTitle(unit.title)}`)}">${manifest.lessons.filter((l) => l.unit === unit.number).map((l) => `<option value="${esc(l.id)}" ${l.id === lesson.id ? "selected" : ""}>${esc(l.id)} · ${esc(Repository.lessonTitle(l.title))}</option>`).join("")}</optgroup>`).join("")}</select>`; }
function sequence(lesson) {
  const ordered = manifest.lessons.filter((item) => item.unit === lesson.unit).sort((a, b) => a.lesson - b.lesson), i = ordered.findIndex((item) => item.id === lesson.id);
  const before = ordered[i - 1], after = ordered[i + 1];
  return `<div class="coherence-grid"><article><span>BUILDING ON · SEQUENCE</span><b>${esc(before ? Repository.standard(before) || before.id : "Earlier grade-level work")}</b><small>${esc(before ? before.id : "Foundational ideas")}</small></article><article class="coherence-current"><span>ADDRESSING · GRADE 6</span><b>${esc(Repository.standard(lesson) || "Practice & Process")}</b><small>${esc(lesson.id)} · ${esc(Repository.lessonTitle(lesson.title))}</small></article><article><span>BUILDING TOWARD · SEQUENCE</span><b>${esc(after ? Repository.standard(after) || after.id : "Next unit application")}</b><small>${esc(after ? after.id : "Continued application")}</small></article></div>`;
}
function planView(lesson, state) {
  const vocabulary = lesson.supports?.vocabulary || [];
  return `<section class="panel lesson-panel"><div class="panel-top"><div><p class="eyebrow">CURRICULUM MATRIX</p><h2>${esc(unitName(lesson.unit))}</h2><p class="subhead">Lesson ${esc(lesson.id)} · ${esc(Repository.standard(lesson) || "Mathematical Practices")}</p></div><span class="unit-chip">UNIT ${lesson.unit}</span></div>${lessonSelector(lesson)}<p class="objective"><span>LEARNING TARGET</span>${esc(lesson.objective || lesson.teacher?.objective || lesson.bigIdea?.en || "Explore, represent, and explain the mathematics.")}</p><div class="section-label">VERTICAL SEQUENCE <span>Lesson order · same unit</span></div>${sequence(lesson)}<div class="section-label">2 SESSION NOTEBOOK FLOW <span>Master architecture</span></div><div class="sessions"><details open><summary>Session 1 · Explore and build</summary><ol class="flow-list"><li>Cover</li><li>Objectives · drag-check</li><li>Be Curious · Notice / Wonder</li><li>I Do</li><li>We Do</li><li>You Do</li><li>Matching / sorting</li><li>Drag &amp; drop</li><li>Error analysis</li><li>Vocabulary page</li><li>Exit ticket</li><li>Reflection</li></ol></details><details><summary>Session 2 · Practice and transfer</summary><ol class="flow-list"><li>Cover + retrieval</li><li>Objectives · drag-check</li><li>Be Curious · Notice / Wonder</li><li>I Do · connect models</li><li>We Do · compare methods</li><li>You Do · apply</li><li>Matching / sorting</li><li>Drag &amp; drop</li><li>Error analysis</li><li>Vocabulary page</li><li>Exit ticket</li><li>Reflection</li></ol></details></div><div class="section-label">RESOURCES <span>Open in a new tab</span></div><div class="resource-list">${resourceCards(lesson)}</div>${vocabularyPage(lesson)}</section>
  <aside class="panel side-panel"><p class="eyebrow">STUDENT LAUNCH BUILDER</p><h2>Set up the right support.</h2><p class="fine">Choices become shareable URL parameters. No student identity is added.</p><div class="check-list">${[["bilingual", "Bilingual glossary · EN / ES"], ["frames", "Discourse sentence frames"], ["visual", "Keep the visual model visible"], ["timerOff", "Untimed mastery mode"]].map(([key, label]) => `<label><input type="checkbox" data-scaffold="${key}" ${state.scaffolds[key] ? "checked" : ""}><span>${label}</span></label>`).join("")}</div><button class="button button-dark full" data-action="copy-launch">Copy customized student launch URL</button><div class="link-preview" id="linkPreview">${esc(LaunchBuilder.build(lesson.tools?.missionLab || lesson.lessonPath, state.scaffolds))}</div><div class="side-divider"></div><p class="eyebrow">LESSON LANGUAGE</p><div class="vocab-chips">${vocabulary.slice(0, 12).map((word) => `<span>${esc(word)}</span>`).join("") || "<span>Vocabulary follows the lesson objective.</span>"}</div><button class="text-button" data-action="drawer">Open facilitation notes ↗</button></aside>`;
}
function diagnosticSvg(lesson, choice) {
  const misconception = lesson.teacher?.misconceptions?.[choice] || ["Confusing an additive comparison with a multiplicative relationship.", "Treating a visual model as decoration instead of a representation."][choice] || "Compare the representations and explain what each value means.";
  if (/coordinate|reverse/i.test(misconception)) return { svg: MathSVGService.makeCoordinatePlaneSVG({ points: [{ x: 2, y: 4, label: "intended", isError: false }, { x: 4, y: 2, label: "reversed", isError: true }] }), misconception };
  if (/inequal|circle|boundary|less|greater/i.test(misconception)) return { svg: MathSVGService.makeNumberLineSVG({ min: -6, max: 2, value: -3, circleType: choice === 0 ? "closed" : "open", arrowDir: "left", label: choice === 2 ? "Compare boundary choices" : "Almost-right: x ≤ −3" }), misconception };
  if (/fraction|equivalent|whole/i.test(misconception)) return { svg: MathSVGService.makeFractionTapeSVG({ parts: 6, shaded: 3, comparisonParts: 4, label: choice === 2 ? "One-half shown in two ways" : "Compare the shaded parts" }), misconception };
  if (/ratio|multiplic|additive|proportion|rate/i.test(misconception)) return { svg: MathSVGService.makeDoubleNumberLineSVG({ topLabel: "Items", bottomLabel: "Groups", ratios: [{ top: 0, bottom: 0 }, { top: 3, bottom: 1 }, { top: 6, bottom: 2 }, { top: 9, bottom: 3 }], highlightIndex: choice === 0 ? 2 : 1 }), misconception };
  return { svg: MathSVGService.makeFractionTapeSVG({ parts: 5, shaded: choice === 0 ? 2 : 3, comparisonParts: 4, label: choice === 2 ? "Exemplar: connect the models" : "Student model to discuss" }), misconception };
}
function liveView(lesson, state) {
  const cards = ["Misconception 01", "Misconception 02", "Exemplar strategy"];
  const model = diagnosticSvg(lesson, state.diagnostic);
  const value = state.diagnostic === 2 ? "Model → table → equation" : model.misconception;
  return `<section class="panel live-main"><div class="panel-top"><div><p class="eyebrow">LIVE TEACH &amp; PROJECT</p><h2>${esc(Repository.lessonTitle(lesson.title))}</h2><p class="subhead">${esc(lesson.id)} · ${esc(Repository.standard(lesson))}</p></div><button class="button button-dark" data-action="projector">${state.projector ? "Exit projector view" : "Projector view"}</button></div><div class="timer-card"><div><span class="eyebrow">PACING TIMER</span><b>${state.timerRunning ? `${String(Math.floor(state.timer / 60)).padStart(2, "0")}:${String(state.timer % 60).padStart(2, "0")}` : "10:00"}</b></div><button class="button button-light" data-action="timer">${state.timerRunning ? "Reset timer" : "Start 10 min"}</button></div><div class="discourse-row"><div><p class="eyebrow">BE CURIOUS</p><h3>What do you notice? What do you wonder?</h3><p>“I notice ___ because the model shows ___.”</p><p>“I wonder what would change if ___.”</p></div><button class="button button-outline" data-action="discourse">Launch prompt</button></div><div class="section-label">ALMOST-RIGHT ANALYSIS <span>Compare, reason, revise</span></div><div class="diagnostic-tabs" role="tablist" aria-label="Diagnostic model">${cards.map((label, i) => `<button role="tab" aria-selected="${state.diagnostic === i}" data-diagnostic="${i}">${label}</button>`).join("")}</div><div class="model-stage"><div class="svg-stage">${model.svg}</div><div class="model-caption"><span>${state.diagnostic === 2 ? "EXEMPLAR VISUAL STRATEGY" : `STUDENT THINKING · ${state.diagnostic + 1}`}</span><b>${esc(value)}</b><button class="text-button" data-action="drawer">Socratic prompt drawer ↗</button></div></div><div class="model-controls"><label>Minimum<input id="lineMin" type="number" value="-5"></label><label>Maximum<input id="lineMax" type="number" value="5"></label><label>Value<input id="lineValue" type="number" value="2"></label><label>Circle<select id="lineCircle"><option value="open">Open</option><option value="closed">Closed</option></select></label><label>Ray<select id="lineDirection"><option value="right">Right</option><option value="left">Left</option></select></label><button class="button button-light" data-action="draw-number">Build number line</button></div><div class="model-controls"><label>Fraction parts<input id="fractionParts" type="number" min="1" max="16" value="6"></label><label>Shaded parts<input id="fractionShaded" type="number" min="0" max="16" value="3"></label><label>Compare parts<input id="fractionCompare" type="number" min="0" max="16" value="4"></label><button class="button button-light" data-action="draw-fraction">Build fraction tape</button></div><div class="model-controls"><label>Point x<input id="pointX" type="number" min="-5" max="5" value="2"></label><label>Point y<input id="pointY" type="number" min="-5" max="5" value="3"></label><label>Point label<input id="pointLabel" maxlength="12" value="A"></label><button class="button button-light" data-action="draw-plane">Build coordinate plane</button></div><div class="board-controls"><button class="button button-outline" data-action="download-svg">Download SVG / Copy for Slides</button></div><div id="studio" class="studio-stage" aria-live="polite"></div></section><aside class="panel side-panel"><p class="eyebrow">TALK MOVES</p><h2>Keep the thinking with students.</h2><div class="talk-card"><span>ASK THIS</span><p>“How does the model help us decide whether this reasoning makes sense?”</p></div><div class="talk-card"><span>LOOK FOR</span><p>Students naming the quantities and connecting each part of the visual to the situation.</p></div><div class="talk-card"><span>VISUAL BRIDGE</span><p>Move from a concrete model to a labeled drawing, then record the relationship with symbols.</p></div><button class="button button-dark full" data-action="drawer">Open split-screen facilitation drawer</button><div class="privacy-note">Projector view hides teacher prompts and answer information. No student names or response records appear here.</div></aside>`;
}
function parseRoster(raw, lesson) {
  const entries = [];
  raw.split(/\n|,/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const match = line.match(/^(.+?)\s*[:\s]\s*([A-HJ-NP-Z2-9]{6})$/i); if (!match) return;
    try { entries.push({ label: match[1].trim(), ...SeedEngine.decode(match[2]), source: match[2].toUpperCase() }); } catch { /* Invalid rows are summarized separately. */ }
  });
  return { entries, invalidCount: raw.split(/\n|,/).filter((line) => line.trim()).length - entries.length, lesson };
}
function sampleRoster(lesson) {
  const lines = Array.from({ length: 24 }, (_, i) => {
    const tier = i < 6 ? 0 : i < 15 ? 1 : i < 21 ? 2 : 3;
    const misconception = tier === 0 ? (i % 3) + 1 : tier === 1 ? (i % 4) + 4 : 0;
    return `Seat ${String(i + 1).padStart(2, "0")} ${SeedEngine.encode({ unit: lesson.unit, lesson: lesson.lesson, tier, misconception, streak: tier === 3 })}`;
  });
  return lines.join("\n");
}
function triageView(lesson) {
  return `<section class="panel triage-main"><div class="panel-top"><div><p class="eyebrow">ZERO-PII MASTERY DECODER</p><h2>Turn seed patterns into the next teaching move.</h2><p class="subhead">Paste a seat label and a six-character seed. Data stays in this browser.</p></div><span class="privacy-pill">LOCAL ONLY</span></div><label class="field-label" for="rosterInput">Seat / initials + seed</label><textarea id="rosterInput" rows="9" spellcheck="false" placeholder="Seat 01 ABC234&#10;Seat 02 DEF567"></textarea><div class="input-actions"><button class="button button-dark" data-action="decode">Decode &amp; group</button><button class="button button-light" data-action="sample">Load sample class roster · 24 seats</button><span id="decodeStatus" role="status"></span></div><div id="groupResults" class="group-results"><div class="empty-state"><span>✳</span><b>Start with a seed set</b><p>Load the fictional sample or paste locally generated mastery seeds.</p></div></div></section><aside class="panel side-panel"><p class="eyebrow">SEED ENCODING</p><h2>Compact evidence. No names.</h2><div class="seed-key"><span>UNIT</span><b>3 bits</b><span>LESSON</span><b>5 bits</b><span>ACCURACY TIER</span><b>2 bits</b><span>MISCONCEPTION</span><b>3 bits</b><span>STREAK FLAG</span><b>1 bit</b><span>CHECKSUM</span><b>6 bits</b></div><p class="fine">Six Base32 characters include a version marker and checksum. Seeds do not contain names, initials, or free-text student responses.</p><div class="side-divider"></div><p class="eyebrow">ACTIVE LESSON</p><p class="active-standard">${esc(lesson.id)} · ${esc(Repository.standard(lesson) || unitName(lesson.unit))}</p><p class="fine">Group activities adapt to the active lesson and its published pathway.</p><a class="text-button" href="${esc(url(`/curriculum/matrix/#lesson-${lesson.id}`))}" target="_blank" rel="noopener">Open curriculum matrix ↗</a></aside>`;
}
function render(state) {
  const lesson = activeLesson(state); if (!lesson) return;
  root.className = `content-grid mode-${state.mode}`;
  root.innerHTML = state.mode === "plan" ? planView(lesson, state) : state.mode === "live" ? liveView(lesson, state) : triageView(lesson);
  if (state.mode === "live" && studioSvg) drawStudio(studioSvg, studioKind);
  document.querySelectorAll("[data-mode]").forEach((button) => { const selected = button.dataset.mode === state.mode; button.classList.toggle("is-active", selected); button.setAttribute("aria-pressed", String(selected)); });
  document.querySelector("#lessonCount").textContent = manifest.lessons.length;
  if (state.mode === "live") { const svg = diagnosticSvg(lesson, state.diagnostic); activeSvg = svg.svg; }
}
const UIRenderer = Object.freeze({ render });
function showSearchResults(query) {
  const results = Repository.search(manifest, query);
  searchResults.innerHTML = results.map((lesson) => `<button type="button" role="option" data-result="${esc(lesson.id)}"><span class="search-id">${esc(lesson.id)}</span><span><b>${esc(Repository.lessonTitle(lesson.title))}</b><small>${esc(unitName(lesson.unit))} · ${esc(Repository.standard(lesson))}</small></span><span aria-hidden="true">↵</span></button>`).join("");
  searchResults.hidden = !results.length;
}
let studioKind = "number";
function drawStudio(svg, kind = studioKind) { studioKind = kind; studioSvg = svg; activeSvg = svg; const stage = document.querySelector("#studio"); if (stage) stage.innerHTML = `<div class="studio-tools"><p>SVG modeling studio · click or tap inside the model to place a point.</p><button type="button" class="text-button" data-action="reset-studio">Reset</button></div><div class="studio-svg" id="clickModel" tabindex="0" role="button" aria-label="Click or tap to place a math model point">${svg}</div>`; }
function openDrawer(lesson, state) {
  const dialog = document.querySelector("#drawer"); const projector = state.projector;
  document.querySelector("#drawerTitle").textContent = projector ? "Discourse prompts" : "Facilitation notes";
  const mis = lesson.teacher?.misconceptions || [];
  document.querySelector("#drawerBody").innerHTML = projector ? `<div class="drawer-prompt"><b>Ask this</b><p>What does each part of this model represent?</p></div><div class="drawer-prompt"><b>Listen for</b><p>A claim supported with the quantities and the representation.</p></div>` : `<div class="drawer-prompt"><b>Ask this</b><p>What changes in your reasoning when you connect the model to the quantities?</p></div><div class="drawer-prompt"><b>Look for</b><p>${esc(mis[0] || "Learners explain why each representation matches the target idea.")}</p></div><div class="drawer-prompt"><b>Visual bridge</b><p>Ask students to annotate the model first, then connect one part at a time to a table or equation.</p></div>`;
  if (!dialog.open) dialog.showModal(); controller.drawer(true);
}
async function copyText(value) { try { await navigator.clipboard.writeText(value); showToast("Copied to clipboard"); } catch { const box = document.createElement("textarea"); box.value = value; box.style.position = "fixed"; box.style.opacity = "0"; document.body.append(box); box.select(); const ok = document.execCommand("copy"); box.remove(); showToast(ok ? "Copied to clipboard" : "Clipboard unavailable"); } }
function decodeRoster() {
  const input = document.querySelector("#rosterInput"), result = document.querySelector("#groupResults"); if (!input || !result) return;
  const parsed = parseRoster(input.value, activeLesson()); const groups = TriageEngine.group(parsed.entries);
  document.querySelector("#decodeStatus").textContent = `${parsed.entries.length} valid · ${parsed.invalidCount} skipped`;
  const heat = new Map(); parsed.entries.filter((entry) => entry.misconception > 0).forEach((entry) => heat.set(entry.misconception, (heat.get(entry.misconception) || 0) + 1));
  const maxHeat = Math.max(1, ...heat.values());
  const heatmap = heat.size ? `<section class="heatmap" aria-label="Misconception heatmap"><div class="section-label">MISCONCEPTION HEATMAP <span>Count by primary code</span></div>${[...heat].sort((a,b)=>b[1]-a[1]).map(([code,count])=>`<div class="heat-row"><span>${esc(TriageEngine.misconceptionLabel(code))}</span><span class="heat-track"><i style="width:${Math.round(count/maxHeat*100)}%"></i></span><b>${count}</b></div>`).join("")}</section>` : "";
  result.innerHTML = heatmap + groups.map(({ tier, students }) => { const plan = TriageEngine.plan(tier, parsed.lesson); const topMis = new Map(); students.forEach((entry) => topMis.set(entry.misconception, (topMis.get(entry.misconception) || 0) + 1)); const focus = [...topMis].sort((a, b) => b[1] - a[1])[0]; return `<article class="group-card group-${tier}"><div class="group-heading"><span>GROUP ${tier}</span><span>${students.length} ${students.length === 1 ? "seat" : "seats"}</span></div><h3>${esc(plan.title)}</h3><p class="group-station">${esc(plan.station)}</p>${students.length ? `<div class="seat-chips">${students.map((entry) => `<span>${esc(entry.label)} · ${TriageEngine.tierLabel(entry.tier)}</span>`).join("")}</div>` : "<p class=\"fine\">No decoded seats in this group.</p>"}<div class="focus-note"><b>Hands-on / discourse move</b><p>${esc(focus && tier === 1 ? `${TriageEngine.misconceptionLabel(focus[0])}: ` : "")}${esc(plan.model)}</p></div><ol>${plan.problems.map((problem) => `<li>${esc(problem)}</li>`).join("")}</ol></article>`; }).join("");
}
root.addEventListener("change", (event) => {
  if (event.target.id === "lessonSelect") controller.lesson(event.target.value);
  if (event.target.matches("[data-scaffold]")) { controller.scaffold(event.target.dataset.scaffold, event.target.checked); const preview = document.querySelector("#linkPreview"); if (preview) preview.textContent = LaunchBuilder.build(activeLesson().tools?.missionLab || activeLesson().lessonPath, controller.snapshot().scaffolds); }
});
root.addEventListener("click", async (event) => {
  const mode = event.target.closest("[data-diagnostic]"); if (mode) { controller.diagnostic(mode.dataset.diagnostic); return; }
  const modelTarget = event.target.closest("#clickModel");
  if (modelTarget) {
    const svg = modelTarget.querySelector("svg"), rect = svg.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      if (studioKind === "fraction") { const parts = Number(document.querySelector("#fractionParts").value); document.querySelector("#fractionShaded").value = Math.max(0, Math.min(parts, Math.floor(x * parts) + 1)); drawStudio(MathSVGService.makeFractionTapeSVG({ parts, shaded: Number(document.querySelector("#fractionShaded").value), comparisonParts: Number(document.querySelector("#fractionCompare").value) }), "fraction"); }
      else if (studioKind === "plane") { const px = Math.round(x * 10 - 5), py = Math.round(5 - y * 10); document.querySelector("#pointX").value = px; document.querySelector("#pointY").value = py; drawStudio(MathSVGService.makeCoordinatePlaneSVG({ points: [{ x: px, y: py, label: document.querySelector("#pointLabel").value || "A" }] }), "plane"); }
      else { const min = Number(document.querySelector("#lineMin").value), max = Number(document.querySelector("#lineMax").value); document.querySelector("#lineValue").value = Number((min + x * (max - min)).toFixed(2)); drawStudio(MathSVGService.makeNumberLineSVG({ min, max, value: Number(document.querySelector("#lineValue").value), circleType: document.querySelector("#lineCircle").value, arrowDir: document.querySelector("#lineDirection").value }), "number"); }
    }
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action; if (!action) return;
  const lesson = activeLesson(); const state = controller.snapshot();
  if (action === "projector") controller.projector();
  if (action === "timer") state.timerRunning ? controller.timerStop() : controller.timerStart(10);
  if (action === "drawer") openDrawer(lesson, state);
  if (action === "decode") decodeRoster();
  if (action === "sample") { document.querySelector("#rosterInput").value = sampleRoster(lesson); decodeRoster(); }
  if (action === "copy-launch") await copyText(LaunchBuilder.build(lesson.tools?.missionLab || lesson.lessonPath, state.scaffolds));
  if (action === "discourse") { const card = document.querySelector(".discourse-row"); if (card) { card.classList.add("prompt-launched"); card.scrollIntoView({ behavior: "smooth", block: "center" }); } }
  if (action === "draw-number") { const min = Number(document.querySelector("#lineMin").value), max = Number(document.querySelector("#lineMax").value), value = Number(document.querySelector("#lineValue").value); try { drawStudio(MathSVGService.makeNumberLineSVG({ min, max, value, circleType: document.querySelector("#lineCircle").value, arrowDir: document.querySelector("#lineDirection").value }), "number"); } catch (error) { showToast(error.message); } }
  if (action === "draw-fraction") drawStudio(MathSVGService.makeFractionTapeSVG({ parts: Number(document.querySelector("#fractionParts").value), shaded: Number(document.querySelector("#fractionShaded").value), comparisonParts: Number(document.querySelector("#fractionCompare").value), label: "Compare equal parts" }), "fraction");
  if (action === "draw-plane") drawStudio(MathSVGService.makeCoordinatePlaneSVG({ quadrants: 4, points: [{ x: Number(document.querySelector("#pointX").value), y: Number(document.querySelector("#pointY").value), label: document.querySelector("#pointLabel").value || "A" }], showGrid: true }), "plane");
  if (action === "reset-studio") drawStudio(MathSVGService.makeNumberLineSVG(), "number");
  if (action === "download-svg") { const blob = new Blob([activeSvg], { type: "image/svg+xml;charset=utf-8" }); const href = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = href; a.download = `grade-6-${lesson.id}-math-model.svg`; a.click(); URL.revokeObjectURL(href); await copyText(activeSvg); }
});
search.addEventListener("input", () => showSearchResults(search.value));
searchResults.addEventListener("click", (event) => { const button = event.target.closest("[data-result]"); if (button) selectLesson(Repository.find(manifest, button.dataset.result)); });
document.addEventListener("click", (event) => { if (!event.target.closest(".command, .search-results")) searchResults.hidden = true; });
document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => controller.mode(button.dataset.mode)));
document.querySelector("#projectorToggle").addEventListener("click", () => { if (controller.snapshot().mode === "plan") controller.mode("live"); controller.projector(); });
document.querySelector("#themeToggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
document.querySelector("#drawerClose").addEventListener("click", () => { document.querySelector("#drawer").close(); controller.drawer(false); });
document.querySelector("#drawer").addEventListener("click", (event) => { if (event.target.id === "drawer") { event.target.close(); controller.drawer(false); } });
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); search.focus(); search.select(); }
  if (event.key === "Escape") { searchResults.hidden = true; }
  if (event.key.toLowerCase() === "p" && !/input|textarea|select/i.test(document.activeElement.tagName)) controller.projector();
});
setTheme(getSavedTheme());
try {
  const diagnostics = new URLSearchParams(location.search).get("diagnostics") === "1";
  const report = selfTest(); if (diagnostics) console.info("[EduWonderLab Flight Deck selfTest]", { status: "PASS", ...report });
} catch (error) { console.error("[EduWonderLab Flight Deck selfTest]", { status: "FAIL", message: error.message }); }
try { manifest = await Repository.load(); document.querySelector("#lessonCount").textContent = manifest.lessons.length; UIRenderer.render(controller.snapshot()); loadLessonDetail(controller.snapshot()); }
catch (error) { root.innerHTML = `<section class="panel error-panel"><p class="eyebrow">CURRICULUM NOT READY</p><h2>We could not load the lesson manifest.</h2><p>${esc(error.message)} Use the curriculum hub while the manifest is restored.</p><a class="button button-dark" href="/curriculum/">Open Grade 6 curriculum ↗</a></section>`; }
