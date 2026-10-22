import {
  ALL_SKILLS,
  GRADES,
  generateProblem,
  getGrade,
  getSkill,
  primeFactors,
  seededRandom,
  validateAnswer,
} from "./problem-bank.js";
import { adaptiveProblem, dailyPlan, diagnosticPlan, difficulty, emptyTutor, evidence, feedbackFor, findSkill, localDay, prerequisites, recommendations, recordAnswer, rememberMistake, sanitizeTutor, skillForItem, skillKey as tutorSkillKey } from "./tutor-engine.js";
import { mountVisualLesson, renderModel, renderInlineProblemModel } from "./visual-lab.js";
import { transferPrompt } from "./lesson-content.js";
import { handleModelInput, handleModelTap, interactivePicture, mathText, openFillRow, stepPhaseBadge, stepVisual, stepWaiting, stepsBlock, trailPicture } from "./trail-pictures.js";
import { PROFILE_NAMES, assignmentQueue, cleanProgress, decodeAssignment, downloadFile, makeBackup, mountTeacherStudio, parseBackup, profileKey, profiles, progressReport, readLocal, selectProfile, writeLocal } from "./school-tools.js";
import { mountWorkbench } from "./workbench.js";
import { createWorkbenchState } from "./workbench-state.js";
import { answerStillHidden, liveHelpHtml } from "./live-help.js";
import { bareText, drawerSeed, extractProblem, plainProduct } from "./problem-numbers.js";
import { clean as cleanDigits, columnSpec, verticalHtml } from "./vertical-columns.js";
import { canMultiply, multiplyHtml, wireMultiply } from "./vertical-multiply.js";
import { createDrillToolbox } from "./drill-toolbox.js";
import { StandardLongDivisionModel } from "./long-division-model.js";
import { mountTrail } from "./trail-view.js";
import { GAMES, mountGames } from "./games.js";
import { getLang, setLang, t, translatePage } from "./i18n.js";
import { factsReport, mountSnapshot } from "./class-snapshot.js";
import { whyFor } from "./step-whys.js";
import { storyFor } from "./story-problems.js";
import { loadRewards, noteToday, saveRewards } from "./rewards.js";
import { certificateHtml } from "./certificate.js";
import { chime, setSound, soundOn } from "./sounds.js";
import { familySummaryDocument, familySummaryHtml } from "./family-page.js";
import { mountPaperGames } from "./paper-games.js";
import { stopOptions, stopsFor } from "./game-pool.js";
import { cleanPlay, exportPlay, importPlay } from "./play-backup.js";
import { decideInstruction, independentRecoveryCount, readInstructionalEvidence, recordInstructionalEvidence } from "../../engine/core/instructional-intelligence.js";
import { VOCAB_BILINGUAL_DB, highlightVocab, initVocabSystem, openVocabModal } from "./vocab.js";
import { canSpeak, speak, spoken, spokenEs } from "./speech.js";
import { languagePromptHtml } from "./language-bridge.js";
import { captureDraft, explainCardHtml, initLanguage, journalHtml, journalPrintHtml, lookupCount, problemSupportHtml, restoreDraft, spanishPeekHtml, wordStripHtml } from "./language-card.js";
import { languageEvidence, loadJournal } from "./language-journal.js";
import { setLanguageProfile } from "./language-settings.js";
import { questionEs } from "./question-es.js";
import { handleStepPlayerClick, handleStepPlayerSolved, lightStepPlayers, stepPlayer } from "./step-player.js";

const STORAGE_KEY = "ewl-fluency-progress-v1";
const SETTINGS_KEY = "ewl-fluency-settings-v1";
const TUTOR_KEY = "ewl-fluency-tutor-v2";
const SESSION_KEY = "ewl-fluency-session-v2";
const INTELLIGENCE_KEY = "ewl-fluency-instructional-evidence-v1";
const STREAK_GOAL = 10;
const initialParams = new URLSearchParams(location.search);
let activeProfile = profiles().active;
// Pin this tab to its learner now, so another tab switching learners later cannot move this one.
selectProfile(activeProfile);
setLanguageProfile(activeProfile);
let cleanupVisual = null;
let cleanupTrail = null;
let cleanupGames = null;
let pendingRestore = null;

const els = {
  gradeTabs: document.querySelector("#grade-tabs"),
  subnavSkills: document.querySelector("#subnav-skills"),
  subnavTrail: document.querySelector("#subnav-trail"),
  skillSearchInput: document.querySelector("#skill-search-input"),
  settingsToggle: document.querySelector("#settings-toggle"),
  settingsPopover: document.querySelector("#header-settings-popover"),
  closeSettings: document.querySelector("#close-settings"),
  trail: document.querySelector("#trail-view"),
  morePractice: document.querySelector("#more-practice"),
  gradeHeading: document.querySelector("#grade-heading"),
  gradePromise: document.querySelector("#grade-promise"),
  gradeSummary: document.querySelector("#grade-summary"),
  strandFilters: document.querySelector("#strand-filters"),
  skillGrid: document.querySelector("#skill-grid"),
  library: document.querySelector("#library-view"),
  workspace: document.querySelector("#workspace-view"),
  workspaceGrade: document.querySelector("#workspace-grade"),
  workspaceTitle: document.querySelector("#workspace-title"),
  workspaceStandard: document.querySelector("#workspace-standard"),
  masteryMeter: document.querySelector("#mastery-meter"),
  masteryLabel: document.querySelector("#mastery-label"),
  modeTabs: document.querySelector("#mode-tabs"),
  learnPanel: document.querySelector("#learn-panel"),
  drillPanel: document.querySelector("#drill-panel"),
  guidedCoach: document.querySelector("#guided-coach"),
  guidedSteps: document.querySelector("#guided-steps"),
  guidedStepCount: document.querySelector("#guided-step-count"),
  guidedNextStep: document.querySelector("#guided-next-step"),
  sessionType: document.querySelector("#session-type"),
  sessionCount: document.querySelector("#session-count"),
  sessionAccuracy: document.querySelector("#session-accuracy"),
  streakWrap: document.querySelector("#streak-wrap"),
  streakMeter: document.querySelector("#streak-meter"),
  streakLabel: document.querySelector("#streak-label"),
  progressBar: document.querySelector("#session-progress"),
  problemNumber: document.querySelector("#problem-number"),
  question: document.querySelector("#question"),
  answerForm: document.querySelector("#answer-form"),
  answerInput: document.querySelector("#answer-input"),
  choiceAnswers: document.querySelector("#choice-answers"),
  checkButton: document.querySelector("#check-answer"),
  fixAnswerBtn: document.querySelector("#fix-answer-btn"),
  nextButton: document.querySelector("#next-problem"),
  hintButton: document.querySelector("#show-hint"),
  feedback: document.querySelector("#feedback"),
  languageSlot: document.querySelector("#language-slot"),
  feedbackTitle: document.querySelector("#feedback-title"),
  feedbackCopy: document.querySelector("#feedback-copy"),
  scratchpad: document.querySelector("#scratchpad"),
  summary: document.querySelector("#session-summary"),
  summaryTitle: document.querySelector("#summary-title"),
  summaryCopy: document.querySelector("#summary-copy"),
  summaryStats: document.querySelector("#summary-stats"),
  retryMissed: document.querySelector("#retry-missed"),
  independentPractice: document.querySelector("#independent-practice"),
  backLibrary: document.querySelector("#back-library"),
  hearButton: document.querySelector("#hear-problem"),
  hearButtonEs: document.querySelector("#hear-problem-es"),
  printButton: document.querySelector("#print-set"),
  printButtonSecondary: document.querySelector("#print-set-secondary"),
  dailyButton: document.querySelector("#daily-ten"),
  mixedButton: document.querySelector("#mixed-review"),
  resetButton: document.querySelector("#reset-session"),
  textSizeButton: document.querySelector("#text-size"),
  overallStats: document.querySelector("#overall-stats"),
  printSheet: document.querySelector("#print-sheet"),
  toast: document.querySelector("#toast"),
  visualPanel: document.querySelector("#visual-panel"),
  dashboard: document.querySelector("#personal-dashboard"),
  path: document.querySelector("#path-view"),
  notebook: document.querySelector("#notebook-view"),
  games: document.querySelector("#games-view"),
  teacher: document.querySelector("#teacher-view"),
  insight: document.querySelector("#session-insight"),
  topic: document.querySelector("#problem-topic"),
  skip: document.querySelector("#skip-checkup"),
  repair: document.querySelector("#repair-actions"),
  summaryNext: document.querySelector("#summary-next"),
  quickSkillSelect: document.querySelector("#quick-skill-select"),
  problemVisualScaffold: document.querySelector("#problem-visual-scaffold"),
  toggleProblemVisual: document.querySelector("#toggle-problem-visual"),
  flashcardStage: document.querySelector("#flashcard-stage"),
  tptCard: document.querySelector("#tpt-flashcard"),
  tptFlipButton: document.querySelector("#tpt-flip-button"),
  tptFlipBack: document.querySelector("#tpt-flip-back"),
  tptRepeatCard: document.querySelector("#tpt-repeat-card"),
  tptKnowCard: document.querySelector("#tpt-know-card"),
  tptQuickForm: document.querySelector("#tpt-quick-form"),
  tptQuickInput: document.querySelector("#tpt-quick-input"),
  sprintWrap: document.querySelector("#sprint-wrap"),
  sprintTimer: document.querySelector("#sprint-timer"),
  toggleSolver: document.querySelector("#toggle-interactive-solver"),
  solverWorkspace: document.querySelector("#interactive-solver-workspace"),
  tptBackBanner: document.querySelector("#tpt-back-banner"),
  tptNextCard: document.querySelector("#tpt-next-card"),
  answerUnit: document.querySelector("#answer-unit"),
  problemArena: document.querySelector("#problem-arena"),
  voiceAnswerBtn: document.querySelector("#voice-answer-btn"),
  voiceFlashcardBtn: document.querySelector("#voice-flashcard-btn"),
  tptPrintDeck: document.querySelector("#tpt-print-deck"),
  tptLeitnerBadge: document.querySelector("#tpt-leitner-badge"),
};

const state = {
  grade: Number(initialParams.get("grade")) || Number(readLocal(profileKey(`${SETTINGS_KEY}:grade`, activeProfile), 1)) || 1,
  strand: "All",
  skill: null,
  mixedPool: null,
  mode: "learn",
  session: null,
  item: null,
  itemAttempts: 0,
  guidedStepsShown: 0,
  progress: cleanProgress(loadJson(STORAGE_KEY, {})),
  settings: loadJson(SETTINGS_KEY, { largeText: false }),
  tutor: sanitizeTutor(loadJson(TUTOR_KEY, emptyTutor())),
  itemDone: false,
  firstAnswerCorrect: null,
  hintBeforeFirst: false,
  initialSupport: false,
  recentQuestions: [],
  view: "library",
  assignment: decodeAssignment(new URLSearchParams(location.hash.slice(1)).get("assignment")),
  instructionalSignal: null,
};

// This adapter stores only bounded evidence categories. Answers and written work stay in the
// existing local tutor/session flow and are never copied into the shared intelligence record.
const instructionalEvidenceState = {
  get: () => ({ instructionalEvidence: readLocal(profileKey(INTELLIGENCE_KEY, activeProfile), { version: 1, events: [] }) }),
  set: ({ instructionalEvidence }) => writeLocal(profileKey(INTELLIGENCE_KEY, activeProfile), instructionalEvidence),
};

if (!GRADES.some((grade) => grade.grade === state.grade)) state.grade = 1;

function loadJson(key, fallback) {
  return readLocal(profileKey(key, activeProfile), fallback) || fallback;
}

function saveProgress() {
  writeLocal(profileKey(STORAGE_KEY, activeProfile), state.progress);
  writeLocal(profileKey(TUTOR_KEY, activeProfile), state.tutor);
}

function saveSettings() {
  writeLocal(profileKey(SETTINGS_KEY, activeProfile), state.settings);
  writeLocal(profileKey(`${SETTINGS_KEY}:grade`, activeProfile), state.grade);
}

function skillKey(skill = state.skill) {
  return skill ? `${skill.grade || state.grade}:${skill.id}` : null;
}

function recordFor(skill) {
  return {
    attempts: 0,
    correct: 0,
    completedSets: 0,
    bestStreak: 0,
    streakBest: 0,
    guidedProblems: 0,
    guidedCorrect: 0,
    guidedSets: 0,
    lastPracticed: null,
    ...(state.progress[`${skill.grade || state.grade}:${skill.id}`] || {}),
  };
}

function accuracy(record) {
  return record.attempts ? Math.round((record.correct / record.attempts) * 100) : 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function announce(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(announce.timeout);
  announce.timeout = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function setUrl() {
  const params = new URLSearchParams();
  params.set("grade", state.grade);
  if (state.skill && state.view === "workspace") params.set("skill", state.skill.id);
  if (!["library", "workspace"].includes(state.view)) params.set("view", state.view);
  try { history.replaceState(null, "", `${location.pathname}?${params}${location.hash}`); } catch { /* A standalone file can still run when URL rewriting is unavailable. */ }
}

function renderGradeTabs() {
  els.gradeTabs.innerHTML = GRADES.map(
    (grade) => `
      <button class="grade-tab" role="tab" aria-selected="${grade.grade === state.grade}" tabindex="${grade.grade === state.grade ? 0 : -1}" aria-controls="library-view" data-grade="${grade.grade}" style="--grade:${grade.color}">
        <span>${t("Grade")}</span><strong>${grade.grade}</strong>
      </button>`,
  ).join("");
}

const STRAND_ICONS = {
  Counting: "🔢", "Place value": "🧱", Addition: "➕", Subtraction: "➖",
  Multiplication: "✖️", Division: "➗", Operations: "🧮", Fluency: "⚡",
  "Number sense": "💡", Money: "🪙", Measurement: "📏", Fractions: "🍕",
  Geometry: "📐", "Number theory": "🔍", Decimals: "🎯", "Number system": "🌐",
  Ratios: "⚖️", Expressions: "✏️", Equations: "🟰", "Rational numbers": "🧭",
  Proportions: "📊", Percents: "🏷️", Statistics: "📈", Exponents: "✨",
  "Scientific notation": "🔬", "Real numbers": "🗺️", "Linear relationships": "📉",
  Functions: "🔄", Systems: "🔗", Data: "📊"
};

function setPracticeSubview(subview) {
  state.subview = subview;
  const isSkills = subview === "skills";
  els.subnavSkills?.setAttribute("aria-selected", String(isSkills));
  els.subnavSkills?.classList.toggle("active", isSkills);
  els.subnavTrail?.setAttribute("aria-selected", String(!isSkills));
  els.subnavTrail?.classList.toggle("active", !isSkills);
  if (els.trail) els.trail.hidden = isSkills;
  if (els.morePractice) els.morePractice.hidden = !isSkills;
}

function filterSkillsBySearch() {
  const query = (els.skillSearchInput?.value || "").trim().toLowerCase();
  const cards = els.skillGrid?.querySelectorAll(".skill-card") || [];
  let matches = 0;
  cards.forEach((card) => {
    const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
    const strand = card.querySelector(".strand-label")?.textContent.toLowerCase() || "";
    const rule = card.querySelector("p")?.textContent.toLowerCase() || "";
    const match = !query || title.includes(query) || strand.includes(query) || rule.includes(query);
    card.style.display = match ? "" : "none";
    if (match) matches++;
  });
  let empty = els.skillGrid?.querySelector(".skill-search-empty");
  if (matches === 0 && query) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "skill-search-empty";
      els.skillGrid.appendChild(empty);
    }
    empty.textContent = `No skills match "${query}" in Grade ${state.grade}.`;
    empty.style.display = "";
  } else if (empty) {
    empty.style.display = "none";
  }
}

function renderLibrary() {
  saveActiveSession();
  cleanupVisual?.();
  showArea("library");
  state.skill = null;
  state.mixedPool = null;
  state.session = null;
  state.item = null;
  els.workspace.hidden = true;
  els.library.hidden = false;
  const grade = getGrade(state.grade);
  document.documentElement.style.setProperty("--grade", grade.color);
  state.subview = state.subview || "skills";
  setPracticeSubview(state.subview);
  cleanupTrail?.();
  cleanupTrail = mountTrail(els.trail, {
    grade: state.grade,
    onShowSkills: () => {
      setPracticeSubview("skills");
      els.morePractice?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onPlayGame: (game) => { state.autoGame = game; openHubView("games"); },
  });
  els.gradeHeading.textContent = `More ${grade.label} practice`;
  els.gradePromise.textContent = grade.promise;
  renderGradeTabs();
  const strands = ["All", ...new Set(grade.skills.map((skill) => skill.strand))];
  if (!strands.includes(state.strand)) state.strand = "All";
  els.strandFilters.innerHTML = strands
    .map(
      (strand) =>
        `<button class="filter-chip" data-strand="${escapeHtml(strand)}" aria-pressed="${strand === state.strand}">${escapeHtml(strand)}</button>`,
    )
    .join("");
  const filtered = grade.skills.filter((skill) => state.strand === "All" || skill.strand === state.strand);
  els.skillGrid.innerHTML = filtered.map(renderSkillCard).join("");
  if (els.skillSearchInput?.value) filterSkillsBySearch();
  const gradeRecords = grade.skills.map(recordFor);
  const fluent = grade.skills.filter((skill) => evidence(state.tutor, skill).secure).length;
  const attempts = gradeRecords.reduce((sum, record) => sum + record.attempts, 0);
  const correct = gradeRecords.reduce((sum, record) => sum + record.correct, 0);
  els.gradeSummary.innerHTML = `
    <div><strong>${grade.skills.length}</strong><span>skills</span></div>
    <div><strong>${fluent}</strong><span>remembered</span></div>
    <div><strong>${attempts ? Math.round((correct / attempts) * 100) : 0}%</strong><span>accuracy</span></div>`;
  renderOverallStats();
  renderDashboard();
  setUrl();
  document.title = `${grade.label} Math Fluency Lab | EduWonderLab`;
}

function renderSkillCard(skill) {
  const status = evidence(state.tutor, skill);
  const level = status.secure ? 3 : status.independent >= 4 ? 2 : status.recent.length || status.lessonCompleted ? 1 : 0;
  const label = ["New", "Practicing", "Getting strong", "I know it"][level];
  const icon = STRAND_ICONS[skill.strand] || "✏️";
  return `
    <article class="skill-card" data-level="${level}">
      <div class="skill-card-top">
        <span class="strand-label"><span aria-hidden="true">${icon}</span> ${escapeHtml(skill.strand)}</span>
        <span class="mastery-pill level-${level}">${label}</span>
      </div>
      <h3>${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.learn.rule)}</p>
      <div class="skill-card-actions">
        <button class="open-skill primary-action" data-skill="${skill.id}">Practice &amp; Learn</button>
        <div class="skill-action-row">
          <button type="button" class="outline-action quick-drill-btn" data-quick-skill="${skill.id}">⚡ Quick 5</button>
          <button type="button" class="outline-action flashcard-btn" data-flashcard-skill="${skill.id}">🃏 Flashcards</button>
          <button type="button" class="outline-action learn-btn" data-visual-skill="${skill.id}">💡 See Idea</button>
        </div>
      </div>
    </article>`;
}

function renderOverallStats() {
  const records = ALL_SKILLS.map((skill) => state.progress[`${skill.grade}:${skill.id}`]).filter(Boolean);
  const attempts = records.reduce((sum, record) => sum + record.attempts, 0);
  const guidedProblems = records.reduce((sum, record) => sum + (record.guidedProblems || 0), 0);
  const correct = records.reduce((sum, record) => sum + record.correct, 0);
  const fluent = ALL_SKILLS.filter((skill) => evidence(state.tutor, skill).secure).length;
  els.overallStats.innerHTML = `
    <span><strong>${attempts + guidedProblems}</strong> problems practiced</span>
    <span><strong>${attempts ? Math.round((correct / attempts) * 100) : 0}%</strong> overall accuracy</span>
    <span><strong>${fluent}</strong> skills remembered</span>`;
}

function populateQuickSkillDropdown() {
  if (!els.quickSkillSelect) return;
  els.quickSkillSelect.innerHTML = '<option value="">Jump to any skill (Grades 1–8)...</option>' +
    GRADES.map((grade) => `
      <optgroup label="${escapeHtml(grade.label)} (${escapeHtml(grade.focus)})">
        ${grade.skills.map((s) => `
          <option value="${grade.grade}:${s.id}">
            Grade ${grade.grade} · ${escapeHtml(s.title)} (${escapeHtml(s.strand)})
          </option>
        `).join("")}
      </optgroup>
    `).join("");
}

function updateQuickSkillDropdown() {
  if (!els.quickSkillSelect) return;
  if (state.skill) {
    els.quickSkillSelect.value = `${state.skill.grade || state.grade}:${state.skill.id}`;
  } else {
    els.quickSkillSelect.value = "";
  }
}

function openSkill(skillId, mode = "learn", targetGrade = null) {
  if (typeof skillId === "string" && skillId.includes(":")) {
    const [gStr, sId] = skillId.split(":");
    targetGrade = Number(gStr);
    skillId = sId;
  }
  if (targetGrade && GRADES.some((g) => g.grade === targetGrade)) {
    state.grade = targetGrade;
    saveSettings();
    renderGradeTabs();
  }
  saveActiveSession();
  state.session = null;
  state.item = null;
  showArea("workspace");
  state.skill = getSkill(state.grade, skillId);
  if (!state.skill) return;
  state.mixedPool = null;
  state.mode = mode;
  els.library.hidden = true;
  els.workspace.hidden = false;
  const grade = getGrade(state.grade);
  document.documentElement.style.setProperty("--grade", grade.color);
  els.workspaceGrade.textContent = grade.label;
  els.workspaceTitle.textContent = state.skill.title;
  els.workspaceStandard.textContent = `${state.skill.strand} · ${state.skill.standard}${state.skill.formerStandard ? ` (was ${state.skill.formerStandard})` : ""}${state.skill.standardNote ? ` (${state.skill.standardNote})` : ""}`;
  renderMastery();
  renderModeTabs();
  renderLearn();
  setMode(mode);
  setUrl();
  updateQuickSkillDropdown();
  document.title = `${state.skill.title} | ${grade.label} Fluency Lab`;
  document.querySelector("#workspace-view").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openMixed({ daily = false } = {}) {
  if (daily) { openPlanned("daily", dailyPlan(state.tutor, state.grade)); return; }
  saveActiveSession();
  showArea("workspace");
  const grade = getGrade(state.grade);
  state.skill = null;
  state.mixedPool = grade.skills;
  state.mode = daily ? "daily" : "mixed";
  els.library.hidden = true;
  els.workspace.hidden = false;
  els.workspaceGrade.textContent = grade.label;
  els.workspaceTitle.textContent = daily ? "Today's 10" : `${grade.label} mixed review`;
  els.workspaceStandard.textContent = daily
    ? "A balanced daily set from this grade"
    : `Practice across all ${grade.skills.length} skills`;
  els.masteryMeter.value = 0;
  els.masteryLabel.textContent = "Mixed practice";
  renderModeTabs(true);
  els.learnPanel.innerHTML = "";
  beginSession(daily ? "daily" : "mixed", daily ? 10 : 15);
  setUrl();
  document.querySelector("#workspace-view").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderMastery() {
  const status = evidence(state.tutor, state.skill);
  els.masteryMeter.value = status.score ?? 0;
  els.masteryLabel.textContent = status.independent
    ? `${status.successes} of ${status.independent} recent checks correct · ${status.label}`
    : status.label;
}

// Each mode tab shows one panel; a tab list is one stop for Tab, and the arrow keys move between its tabs.
const MODE_PANEL = { learn: "learn-panel", visual: "visual-panel", guided: "drill-panel", quick: "drill-panel", flashcard: "drill-panel", practice: "drill-panel", streak: "drill-panel" };
function renderModeTabs(mixed = false) {
  els.modeTabs.innerHTML = mixed
    ? `<button role="tab" aria-selected="true" aria-controls="drill-panel" data-mode="${state.mode}">${state.mode === "daily" ? "Today's 10" : "Mixed review"}</button>`
    : [
        ["learn", "Learn it"],
        ["visual", "Build it"],
        ["guided", "Guided practice"],
        ["quick", "Quick 5"],
        ["flashcard", "🃏 Flashcards"],
        ["practice", "Practice 10"],
        ["streak", "10 in a row"],
      ]
        .map(
          ([mode, label]) =>
            `<button role="tab" aria-selected="${mode === state.mode}" tabindex="${mode === state.mode ? 0 : -1}" aria-controls="${MODE_PANEL[mode]}" data-mode="${mode}">${label}</button>`,
        )
        .join("");
}

// Learn it: one sentence, one interactive model, and "Watch me solve it" steps revealed one tap at a time.
function renderLearn() {
  const skill = state.skill;
  const rng = seededRandom(skill.id.length * 97 + skill.grade * 13);
  const example = Array.from({ length: 12 }, () => generateProblem(skill, rng)).reduce((best, item) => (item.steps.length > best.steps.length ? item : best));
  state.learnExample = { item: example, shown: 1 };
  const picture = interactivePicture(example.model) || trailPicture(example.model);
  els.learnPanel.innerHTML = `
    <div class="learn-simple" style="--trail:${getGrade(skill.grade).color}">
      <h3 class="tr-idea">${highlightVocab(escapeHtml(skill.learn.rule))}</h3>
      <div class="tr-lesson">
        <div class="tr-example">
          <p class="tr-example-fact">${highlightVocab(mathText(example.question))}</p>
          ${picture}
        </div>
        <div class="tr-guide">
          <p class="tr-guide-title">Watch me solve it</p>
          <div data-learn-steps>${stepsBlock(example.steps, 1, { id: "learn-steps" })}</div>
        </div>
      </div>
      <p class="learn-watch"><strong>Watch out:</strong> ${highlightVocab(escapeHtml(skill.learn.watch))}</p>
      ${wordStripHtml(skill, { heading: t("Words to know") })}
      ${languagePromptHtml(skill, { heading: t("Pause, notice, and explain") })}
      <div class="learn-actions">
        <button class="primary-action" data-start-guided>Try 5 with help</button>
        <button class="primary-action" data-start-independent>Practice 10</button>
        <button class="outline-action" data-start-visual>Build it step by step</button>
      </div>
    </div>`;
}

function setMode(mode) {
  saveActiveSession();
  cleanupVisual?.();
  cleanupVisual = null;
  state.mode = mode;
  els.modeTabs.querySelectorAll("[role=tab]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
    tab.tabIndex = tab.dataset.mode === mode ? 0 : -1;
  });
  const isLearn = mode === "learn" || mode === "visual";
  els.visualPanel.hidden = mode !== "visual";
  els.learnPanel.hidden = !isLearn;
  els.drillPanel.hidden = isLearn;
  if (isLearn) {
    state.session = null;
    state.item = null;
    els.learnPanel.hidden = mode !== "learn";
    if (mode === "visual") {
      cleanupVisual = mountVisualLesson(els.visualPanel, state.skill, {
        onComplete: () => {
          const key = tutorSkillKey(state.skill);
          state.tutor.records[key] = { ...(state.tutor.records[key] || {}), lessonCompleted: true };
          saveProgress(); renderMastery();
        },
        onPractice: () => {
          const saved = loadJson(SESSION_KEY, null);
          if (saved?.item?.skill?.id === state.skill.id && saved.grade === state.grade) resumePractice(saved);
          else setMode("adaptive");
        },
      });
    }
  } else {
    beginSession(mode, mode === "streak" ? Infinity : mode === "quick" ? 5 : mode === "guided" ? 5 : 10);
  }
}

function createSession(mode, target, queue = null) {
  return {
    mode,
    target,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    missed: [],
    problemSkills: [],
    rng: Math.random,
    startedAt: Date.now(),
    id: `${Date.now()}-${Math.random()}`,
    queue,
    independentCorrect: 0,
    diagnosticResults: {},
    finished: false,
  };
}

function beginSession(mode, target, queue = null) {
  state.session = createSession(mode, target, queue);
  state.recentQuestions = [];
  state.item = null;
  state.itemAttempts = 0;
  els.learnPanel.hidden = true;
  els.drillPanel.hidden = false;
  els.summary.hidden = true;
  els.visualPanel.hidden = true;
  document.querySelector(".problem-stage").hidden = false;
  els.answerForm.hidden = false;
  els.independentPractice.hidden = true;
  els.resetButton.textContent = mode === "guided" ? "Try another guided set" : "Start another set";
  els.sessionType.textContent =
    mode === "streak"
      ? "Streak · 10 in a row"
      : mode === "quick"
        ? "Quick 5 Drill"
        : mode === "flashcard"
          ? "🃏 Flashcard Drill · 10 Cards"
          : mode === "guided"
            ? "Guided practice · 5"
            : mode === "daily"
              ? "Today's 10"
              : mode === "mixed"
                ? "Mixed review"
                : "Practice 10";
  if (mode === "adaptive") els.sessionType.textContent = "Adaptive practice · 10";
  if (mode === "diagnostic") els.sessionType.textContent = "Starting-point checkup · 10";
  if (mode === "repair") els.sessionType.textContent = "Repair practice";
  if (mode === "assignment") els.sessionType.textContent = state.assignment.label;
  nextProblem();
}

function problemSkill() {
  if (state.session.queue) return findSkill(state.session.queue[state.session.answered].key);
  if (state.skill) return state.skill;
  return state.mixedPool[Math.floor(state.session.rng() * state.mixedPool.length)];
}

function nextProblem(restoredItem = null) {
  if (restoredItem && typeof restoredItem.question !== "string") restoredItem = null;
  if (!state.session || state.session.finished) return;
  if (state.session.answered >= state.session.target || streakComplete(state.session)) {
    finishSession();
    return;
  }
  const skill = problemSkill();
  state.session.problemSkills.push(skill);
  const adapting = ["adaptive", "daily", "repair", "assignment"].includes(state.session.mode);
  const level = adapting ? difficulty(state.tutor, skill) : 1;
  if (restoredItem) state.item = restoredItem;
  else {
    for (let attempt = 0; attempt < 20; attempt++) {
      state.item = adaptiveProblem(skill, state.session.rng, level);
      // About one problem in four is a story version of the same numbers, never in the checkup.
      if (state.session.mode !== "diagnostic" && level >= 1 && state.session.rng() < 0.25) state.item = storyFor(state.item, state.session.rng) || state.item;
      if (!state.recentQuestions.includes(state.item.question)) break;
    }
    state.recentQuestions = [...state.recentQuestions, state.item.question].slice(-8);
  }
  state.item.skill = skill;
  state.itemAttempts = 0;
  state.itemDone = false;
  state.firstAnswerCorrect = null;
  state.hintBeforeFirst = false;
  if (els.languageSlot) els.languageSlot.innerHTML = "";
  state.initialSupport = state.session.mode === "guided" || (adapting && level === 0) || (state.session.mode === "assignment" && state.assignment?.mode === "guided");
  state.guidedStepsShown = state.session.mode === "guided" ? 1 : 0;
  els.feedback.hidden = true;
  els.nextButton.hidden = true;
  els.nextButton.textContent = "Next problem";
  els.hintButton.hidden = state.initialSupport || state.session.mode === "diagnostic";
  els.skip.hidden = state.session.mode !== "diagnostic";
  // A stretch problem (level 2) starts without the model; opening it before the first answer counts as help.
  mountProblemModel(state.session.mode !== "diagnostic", true);
  els.repair.hidden = !adapting;
  els.checkButton.hidden = false;
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.problemNumber.textContent = state.session.mode === "streak" ? `Problem ${state.session.answered + 1}` : `Problem ${state.session.answered + 1} of ${state.session.target}`;
  formatProblemArena(state.item);
  els.topic.textContent = `${skill.title} · Grade ${skill.grade}`;
  document.querySelector("#problem-language-support").innerHTML = state.session.mode === "diagnostic" ? spanishPeekHtml(state.item) : problemSupportHtml(skill, state.item);
  els.insight.textContent = state.session.mode === "diagnostic" ? "One sample per skill. Choose “I’m not sure yet” whenever you need to." : state.session.queue?.[state.session.answered]?.purpose || (state.initialSupport ? "A smaller step with coaching. We’ll build back toward independent work." : adapting && level === 2 ? "Your recent answers were strong. Try this one independently, then explain a check." : adapting ? "Work at your pace. Help is here when you need it." : "");
  const activityEvidence = readInstructionalEvidence(instructionalEvidenceState).filter((entry) => entry.activity === tutorSkillKey(skill));
  const priorSupport = activityEvidence.some((entry) => entry.condition === "supported");
  const recoveredIndependently = priorSupport && independentRecoveryCount(activityEvidence, tutorSkillKey(skill)) > 0;
  if (recoveredIndependently && !state.session.queue?.[state.session.answered]?.purpose) {
    const move = decideInstruction(activityEvidence.at(-1), { nextIndependent: true }).move;
    if (move === "independent-transfer") {
      els.insight.textContent = "You solved one independently after using support. Try this new problem with the same mathematical idea.";
    }
  }
  els.guidedCoach.hidden = !state.initialSupport;
  if (state.initialSupport) state.guidedStepsShown = 1;
  renderGuidedCoach();
  renderAnswerControl();
  updateSessionHeader();
  state.isFixing = false;
  state.confidence = "certain";
  document.querySelectorAll(".conf-chip").forEach((c) => {
    const isCertain = c.dataset.conf === "certain";
    c.classList.toggle("active", isCertain);
    c.setAttribute("aria-checked", isCertain ? "true" : "false");
  });
  if (els.fixAnswerBtn) els.fixAnswerBtn.hidden = true;
  if (els.checkButton) {
    els.checkButton.hidden = false;
    els.checkButton.textContent = "Check";
  }
  if (els.toggleSolver) {
    els.toggleSolver.hidden = state.session.mode === "diagnostic" || !InteractiveSolver.canSolve(state.item);
    els.toggleSolver.setAttribute("aria-expanded", "false");
  }
  if (els.solverWorkspace) {
    els.solverWorkspace.hidden = true;
    els.solverWorkspace.innerHTML = "";
  }
  // The Math Tool Drawer opens with this problem's numbers.
  InteractiveDrillToolbox.onProblem(state.item);
  document.querySelector("#kinetic-decomposer-host")?.remove();
  const isFlashcard = state.session.mode === "flashcard";
  if (els.flashcardStage) els.flashcardStage.hidden = !isFlashcard;
  document.querySelector(".problem-meta")?.classList.toggle("is-flashcard-hidden", isFlashcard);
  const arenaEl = els.problemArena || document.querySelector("#problem-arena");
  if (arenaEl) arenaEl.hidden = isFlashcard;
  const actionsBar = document.querySelector(".problem-actions-bar");
  if (actionsBar) actionsBar.hidden = isFlashcard;
  const drawerEl = document.querySelector("#drill-toolbox");
  if (drawerEl) drawerEl.hidden = state.session.mode === "diagnostic";
  // A problem with no model leaves the panel empty, so the panel and its button stay hidden.
  const hasModel = Boolean(els.problemVisualScaffold?.innerHTML.trim());
  if (els.problemVisualScaffold) {
    els.problemVisualScaffold.hidden = isFlashcard || !hasModel;
    delete els.problemVisualScaffold.dataset.hiddenBySolver;
  }
  if (els.toggleProblemVisual) {
    els.toggleProblemVisual.hidden = isFlashcard || !hasModel;
    // The model is showing, so the button offers to hide it.
    els.toggleProblemVisual.setAttribute("aria-expanded", String(!els.problemVisualScaffold?.hidden));
    els.toggleProblemVisual.textContent = els.problemVisualScaffold?.hidden ? "Show the model" : "Hide the model";
  }
  if (isFlashcard) {
    els.answerForm.hidden = true;
    renderFlashcardProblem();
  } else {
    els.answerForm.hidden = false;
  }
  onFluencyProblemPresented();
  saveActiveSession();
  if (isFlashcard) {
    (els.tptQuickInput || document.querySelector("#tpt-quick-input"))?.focus();
  } else if (state.item.choices) els.choiceAnswers.querySelector("button")?.focus();
  else els.answerInput.focus();
}

function formatFlashcardDisplay(item) {
  if (!item) return { front: "", back: "", isEquation: false, type: "text" };
  const rawQ = item.question ? item.question.trim() : "";
  const ans = String(item.answers?.[0] || item.displayAnswer || "").trim();

  // 1. Comparison questions: e.g. "28 ___ 40" or "6/7 ___ 5/6"
  const compMatch = rawQ.match(/^(.+?)\s*(?:_{2,}|□|\[\s*\])\s*(.+?)$/);
  if (compMatch && (ans === "<" || ans === ">" || ans === "=" || item.choices?.includes("<"))) {
    const left = compMatch[1].trim();
    const right = compMatch[2].replace(/[=?]/g, "").trim();
    return {
      front: `<div class="tpt-comp-equation"><span class="tpt-num">${mathText(left)}</span> <span class="tpt-comp-circle">?</span> <span class="tpt-num">${mathText(right)}</span></div>`,
      back: `<div class="tpt-comp-equation"><span class="tpt-num">${mathText(left)}</span> <span class="tpt-comp-circle is-solved">${escapeHtml(ans)}</span> <span class="tpt-num">${mathText(right)}</span></div>`,
      type: "comparison"
    };
  }

  // 2. Missing addend/factor: e.g. "6 + □ = 14"
  const missingMatch = rawQ.match(/^(.+?)\s*([+−\-×*÷/])\s*(?:□|\?|___|\[\s*\])\s*=\s*(\d+)/i) ||
                       rawQ.match(/^(?:□|\?|___|\[\s*\])\s*([+−\-×*÷/])\s*(.+?)\s*=\s*(\d+)/i);
  if (missingMatch) {
    const isFirstMissing = rawQ.startsWith("□") || rawQ.startsWith("?") || rawQ.startsWith("_");
    const op = missingMatch[isFirstMissing ? 1 : 2];
    const known = isFirstMissing ? missingMatch[2].trim() : missingMatch[1].trim();
    const target = missingMatch[3].trim();
    const frontHtml = isFirstMissing
      ? `<span class="tpt-blank-box">?</span> ${op} ${mathText(known)} = ${target}`
      : `${mathText(known)} ${op} <span class="tpt-blank-box">?</span> = ${target}`;
    const backHtml = isFirstMissing
      ? `<strong class="tpt-ans-badge">${escapeHtml(ans)}</strong> ${op} ${mathText(known)} = ${target}`
      : `${mathText(known)} ${op} <strong class="tpt-ans-badge">${escapeHtml(ans)}</strong> = ${target}`;
    return {
      front: `<div class="tpt-equation">${frontHtml}</div>`,
      back: `<div class="tpt-equation">${backHtml}</div>`,
      type: "missing"
    };
  }

  // 3. Number sequences: e.g. "45, 50, 55, 60, ___"
  if (rawQ.includes("___") && rawQ.includes(",")) {
    const seq = rawQ.replace(/___.*$/, "").trim();
    return {
      front: `<div class="tpt-equation tpt-seq">${mathText(seq)}, <span class="tpt-blank-box">?</span></div>`,
      back: `<div class="tpt-equation tpt-seq">${mathText(seq)}, <strong class="tpt-ans-badge">${mathText(ans)}</strong></div>`,
      type: "sequence"
    };
  }

  // 4. Clean arithmetic equations: e.g. "7 × 9 = ?" or "10 − 4 = ?" or "3/4 ÷ 2/5"
  const isPureMath = /^[\d\s.,+−\-×*÷/()^]+$/.test(rawQ.replace(/[=?_]/g, "").trim());
  if (isPureMath) {
    const expr = rawQ.replace(/\s*=.*$/, "").replace(/\?.*$/, "").trim();
    return {
      front: `<div class="tpt-equation"><span class="tpt-math-part">${mathText(expr)}</span> <span class="tpt-ans-equals">=</span> <span class="tpt-blank-box">?</span></div>`,
      back: `<div class="tpt-equation"><span class="tpt-math-part">${mathText(expr)}</span> <span class="tpt-ans-equals">=</span> <strong class="tpt-ans-badge">${mathText(ans)}</strong></div>`,
      type: "equation"
    };
  }

  // 5. Word problems / questions: e.g. "What is the value of the digit in the tens place of 59?"
  return {
    front: `<div class="tpt-prompt-text">${highlightVocab(mathText(rawQ))}</div>`,
    back: `<div class="tpt-prompt-text">${highlightVocab(mathText(rawQ))}</div><div class="tpt-word-ans"><span class="tpt-ans-label">Correct Answer:</span> <strong class="tpt-ans-badge">${mathText(ans)}</strong></div>`,
    type: "word"
  };
}

function formatProblemArena(item) {
  if (!item) return;
  const rawQ = item.question ? item.question.trim() : "";
  const arena = els.problemArena || document.querySelector("#problem-arena");
  const isComparison = item.choices?.includes("<") || /_{2,}|□|\[\s*\]/.test(rawQ);
  const isPureEquation = /^[\d\s.,+−\-×*÷/()^]+(?:=\s*(?:\?|___)?)?$/.test(rawQ.replace(/[=?_]/g, "").trim()) && rawQ.length <= 25;

  if (arena) {
    arena.classList.remove("has-equation", "has-comparison", "has-sentence");
  }
  els.question.className = "question";

  if (isComparison) {
    if (arena) arena.classList.add("has-comparison");
    els.question.classList.add("is-comparison");
    const m = rawQ.match(/^(.+?)\s*(?:_{2,}|□|\[\s*\])\s*(.+?)$/);
    if (m) {
      els.question.innerHTML = `<span class="arena-comp-num">${mathText(m[1].trim())}</span> <span class="arena-comp-blank" aria-label="blank">?</span> <span class="arena-comp-num">${mathText(m[2].replace(/[=?]/g, "").trim())}</span>`;
    } else {
      els.question.innerHTML = highlightVocab(mathText(rawQ));
    }
  } else if (isPureEquation) {
    if (arena) arena.classList.add("has-equation");
    els.question.classList.add("is-equation");
    // "5,337 + 90,679 = ?" has a space between the equals sign and the question mark; strip both.
    const expr = rawQ.replace(/(?:\s*[=?_]+)+\s*$/, "").trim();
    if (expr.length > 13) els.question.classList.add("is-long");
    els.question.innerHTML = `${mathText(expr)} <span class="arena-eq-symbol">=</span>`;
  } else {
    if (arena) arena.classList.add("has-sentence");
    els.question.classList.add("is-sentence");
    els.question.innerHTML = highlightVocab(mathText(rawQ));
  }

  const unitEl = els.answerUnit || document.querySelector("#answer-unit");
  if (unitEl) {
    if (item.unit) {
      unitEl.textContent = item.unit;
      unitEl.hidden = false;
    } else {
      unitEl.hidden = true;
    }
  }
}

const LEITNER_KEY = "fluency_leitner_v1";

function getLeitnerData() {
  try {
    return JSON.parse(localStorage.getItem(LEITNER_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLeitnerData(data) {
  try {
    localStorage.setItem(LEITNER_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save Leitner data", e);
  }
}

function getItemLeitnerKey(item) {
  if (!item) return "default";
  const skillId = item.skill?.id || state.skill?.id || "skill";
  const q = (item.question || "").replaceAll(/\s+/g, " ").trim();
  return `${skillId}::${q}`;
}

function getCardLeitnerBox(item) {
  const data = getLeitnerData();
  const key = getItemLeitnerKey(item);
  return data[key]?.box || 1;
}

function updateLeitnerCard(item, correct) {
  if (!item) return 1;
  const data = getLeitnerData();
  const key = getItemLeitnerKey(item);
  const now = Date.now();
  const record = data[key] || { box: 1, history: [], count: 0 };
  let currentBox = record.box || 1;
  if (correct) {
    currentBox = Math.min(3, currentBox + 1);
  } else {
    currentBox = 1; // Reset to Box 1 for reinforcement
  }
  record.box = currentBox;
  record.lastReviewed = now;
  record.count = (record.count || 0) + 1;
  data[key] = record;
  saveLeitnerData(data);

  const badge = els.tptLeitnerBadge || document.querySelector("#tpt-leitner-badge");
  if (badge) {
    updateLeitnerBadge(badge, currentBox);
  }
  return currentBox;
}

function updateLeitnerBadge(badge, box) {
  if (!badge) return;
  badge.className = `tpt-leitner-badge box-${box}`;
  if (box === 1) {
    badge.innerHTML = "🧠 Box 1 · Daily";
    badge.title = "Leitner Box 1: Review daily for retention";
  } else if (box === 2) {
    badge.innerHTML = "🧠 Box 2 · 3-Day";
    badge.title = "Leitner Box 2: Review every 3 days";
  } else {
    badge.innerHTML = "⭐ Box 3 · Mastered";
    badge.title = "Leitner Box 3: Mastered! Review weekly";
  }
}

function renderFlashcardProblem() {
  const item = state.item;
  if (!item) return;
  const card = els.tptCard || document.querySelector("#tpt-flashcard");
  card?.classList.remove("is-flipped", "is-correct");

  const banner = els.tptBackBanner || document.querySelector("#tpt-back-banner");
  if (banner) {
    banner.hidden = true;
    banner.className = "tpt-back-banner";
    banner.innerHTML = "";
  }

  const skill = item.skill || state.skill;
  const grade = getGrade(skill?.grade || state.grade);
  const strand = skill?.strand || "Math";
  const icon = STRAND_ICONS[strand] || "✏️";

  const strandBadge = document.querySelector("#tpt-strand-badge");
  if (strandBadge) {
    strandBadge.innerHTML = `<span aria-hidden="true">${icon}</span> GRADE ${skill?.grade || state.grade} · ${escapeHtml(strand).toUpperCase()}`;
    strandBadge.style.borderColor = grade.color;
  }

  const leitnerBadge = els.tptLeitnerBadge || document.querySelector("#tpt-leitner-badge");
  if (leitnerBadge) {
    const box = getCardLeitnerBox(item);
    updateLeitnerBadge(leitnerBadge, box);
  }

  const cardCounter = document.querySelector("#tpt-card-counter");
  if (cardCounter) {
    cardCounter.textContent = `Card ${state.session.answered + 1} of ${state.session.target}`;
  }

  const display = formatFlashcardDisplay(item);

  const frontEq = document.querySelector("#tpt-front-equation");
  if (frontEq) frontEq.innerHTML = display.front;

  const backEq = document.querySelector("#tpt-back-equation");
  if (backEq) backEq.innerHTML = display.back;

  const backStrategy = document.querySelector("#tpt-back-strategy");
  if (backStrategy) {
    const hint = item.hint || item.explanation || skill?.learn?.rule || "";
    const stepsList = item.steps?.length > 1 ? `<div class="tpt-mini-steps">${item.steps.map((s, idx) => `<div><span class="mini-step-num">${idx + 1}</span> <span>${highlightVocab(mathText(s))}</span></div>`).join("")}</div>` : "";
    backStrategy.innerHTML = `<strong>💡 Strategy breakdown:</strong><p>${highlightVocab(escapeHtml(hint))}</p>${stepsList}`;
  }

  const quickInput = els.tptQuickInput || document.querySelector("#tpt-quick-input");
  if (quickInput) {
    quickInput.value = "";
    quickInput.disabled = false;
    setTimeout(() => quickInput.focus(), 60);
  }
}

function flipFlashcard(reveal) {
  const card = els.tptCard || document.querySelector("#tpt-flashcard");
  if (!card) return;
  const isFlipped = card.classList.contains("is-flipped");
  const shouldFlip = typeof reveal === "boolean" ? reveal : !isFlipped;
  if (shouldFlip) {
    card.classList.add("is-flipped");
    const cardBack = card.querySelector(".tpt-card-back");
    if (cardBack) cardBack.scrollTop = 0;
    const focusTarget = els.tptNextCard || document.querySelector("#tpt-next-card") || els.tptKnowCard || document.querySelector("#tpt-know-card");
    focusTarget?.focus({ preventScroll: true });
    if (cardBack) cardBack.scrollTop = 0;
  } else {
    card.classList.remove("is-flipped");
    const focusTarget = els.tptQuickInput || els.tptFlipButton || document.querySelector("#tpt-flip-button");
    focusTarget?.focus({ preventScroll: true });
  }
}

function handleFlashcardAnswer(correct) {
  if (!state.session || state.itemDone) return;
  updateLeitnerCard(state.item, correct);
  finalizeProblem(correct);
  if (correct) {
    const card = els.tptCard || document.querySelector("#tpt-flashcard");
    card?.classList.add("is-correct");
    celebrateSparkles();
  }
  nextProblem();
}

function celebrateSparkles() {
  const stage = els.flashcardStage || document.querySelector(".problem-stage");
  if (!stage) return;
  const container = document.createElement("div");
  container.className = "sparkle-container";
  container.setAttribute("aria-hidden", "true");
  const colors = ["#fbbf24", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6"];
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle-particle";
    const angle = (i / 20) * 360;
    const distance = 40 + Math.random() * 80;
    sparkle.style.setProperty("--tx", `${Math.cos((angle * Math.PI) / 180) * distance}px`);
    sparkle.style.setProperty("--ty", `${Math.sin((angle * Math.PI) / 180) * distance}px`);
    sparkle.style.backgroundColor = colors[i % colors.length];
    container.appendChild(sparkle);
  }
  stage.appendChild(container);
  setTimeout(() => container.remove(), 750);
}

function printFlashcardDeck() {
  const skill = state.skill;
  if (!skill) return;
  const grade = getGrade(skill.grade);
  const rng = seededRandom(skill.id.length * 133 + skill.grade * 77);
  const cards = Array.from({ length: 8 }, () => generateProblem(skill, rng));

  function cardFrontHtml(c, num) {
    return `
      <div class="pfc-card pfc-front">
        <div class="pfc-hole" aria-hidden="true" title="Ring hole punch guide"></div>
        <div class="pfc-tag">${grade.label.toUpperCase()} · ${escapeHtml(skill.strand).toUpperCase()}</div>
        <div class="pfc-math">${mathText(c.question)}</div>
        <div class="pfc-footer">Card ${num} of 8 · ${escapeHtml(skill.title)}</div>
      </div>
    `;
  }

  function cardBackHtml(c, num) {
    const rawQ = c.question.replace(/\s*=.*$/, "").replace(/\.\s*find.*$/i, "");
    const ans = c.answers?.[0] ?? "";
    const hint = c.hint || skill.learn?.rule || "";
    return `
      <div class="pfc-card pfc-back">
        <div class="pfc-hole" aria-hidden="true" title="Ring hole punch guide"></div>
        <div class="pfc-tag">ANSWER &amp; STRATEGY</div>
        <div class="pfc-math pfc-ans">${mathText(rawQ)} = <strong>${mathText(ans)}</strong></div>
        <div class="pfc-hint">${escapeHtml(hint)}</div>
        <div class="pfc-footer">Card ${num} of 8 · eduwonderlab.com</div>
      </div>
    `;
  }

  // Duplex pairing for Sheet 1:
  // Front: [Card 0, Card 1] / [Card 2, Card 3]
  // Back (mirrored horizontally for short-edge / duplex alignment):
  //        [Card 1 Back, Card 0 Back] / [Card 3 Back, Card 2 Back]
  const sheet1Front = [cards[0], cards[1], cards[2], cards[3]].map((c, i) => cardFrontHtml(c, i + 1)).join("");
  const sheet1Back = [
    cardBackHtml(cards[1], 2), cardBackHtml(cards[0], 1),
    cardBackHtml(cards[3], 4), cardBackHtml(cards[2], 3)
  ].join("");

  // Duplex pairing for Sheet 2:
  const sheet2Front = [cards[4], cards[5], cards[6], cards[7]].map((c, i) => cardFrontHtml(c, i + 5)).join("");
  const sheet2Back = [
    cardBackHtml(cards[5], 6), cardBackHtml(cards[4], 5),
    cardBackHtml(cards[7], 8), cardBackHtml(cards[6], 7)
  ].join("");

  printHtml(`
    <article class="pfc-print-sheet">
      <!-- Sheet 1 Front -->
      <div class="pfc-page pfc-front-page">
        <header class="pfc-header">
          <h1>${escapeHtml(skill.title)} · Flashcard Deck (Sheet 1 Front)</h1>
          <p>${grade.label} Fluency Practice · Print 4-Up Duplex (Flip on short edge) · Cut along dashed lines ✂️</p>
        </header>
        <div class="pfc-grid">
          ${sheet1Front}
        </div>
      </div>

      <div class="pfc-page-break"></div>

      <!-- Sheet 1 Back (Mirrored for Duplex) -->
      <div class="pfc-page pfc-back-page">
        <header class="pfc-header">
          <h1>${escapeHtml(skill.title)} · Flashcard Deck (Sheet 1 Back — Mirrored)</h1>
          <p>Duplex Back Face · Aligns behind Sheet 1 Front · Hole punch guide on top right</p>
        </header>
        <div class="pfc-grid">
          ${sheet1Back}
        </div>
      </div>

      <div class="pfc-page-break"></div>

      <!-- Sheet 2 Front -->
      <div class="pfc-page pfc-front-page">
        <header class="pfc-header">
          <h1>${escapeHtml(skill.title)} · Flashcard Deck (Sheet 2 Front)</h1>
          <p>${grade.label} Fluency Practice · Print 4-Up Duplex (Flip on short edge) · Cut along dashed lines ✂️</p>
        </header>
        <div class="pfc-grid">
          ${sheet2Front}
        </div>
      </div>

      <div class="pfc-page-break"></div>

      <!-- Sheet 2 Back (Mirrored for Duplex) -->
      <div class="pfc-page pfc-back-page">
        <header class="pfc-header">
          <h1>${escapeHtml(skill.title)} · Flashcard Deck (Sheet 2 Back — Mirrored)</h1>
          <p>Duplex Back Face · Aligns behind Sheet 2 Front · Hole punch guide on top right</p>
        </header>
        <div class="pfc-grid">
          ${sheet2Back}
        </div>
      </div>
    </article>
  `);
}

function printMasteryCertificate(skill) {
  const s = skill || state.skill;
  if (!s) return;
  const learner = PROFILE_NAMES[activeProfile] || "Learner";
  printHtml(`
    <article class="cert-print-sheet">
      <div class="cert-border">
        <div class="cert-inner">
          <p class="cert-kicker">EduWonderLab Math Fluency Lab</p>
          <h1 class="cert-title">Certificate of Fluency Mastery</h1>
          <p class="cert-awarded">This certifies that</p>
          <h2 class="cert-name">${escapeHtml(learner)}</h2>
          <p class="cert-desc">has demonstrated automatic, independent fluency in</p>
          <h3 class="cert-skill">${escapeHtml(s.title)} (Grade ${s.grade})</h3>
          <p class="cert-rule">“${escapeHtml(s.learn.rule)}”</p>
          <div class="cert-footer">
            <div><span class="cert-line"></span><small>Date: ${new Date().toLocaleDateString()}</small></div>
            <div class="cert-seal">★ GOLD STANDARD FLUENCY ★</div>
            <div><span class="cert-line"></span><small>Teacher / Coach</small></div>
          </div>
        </div>
      </div>
    </article>
  `);
}

function printPracticeSheet() {
  const grade = getGrade(state.grade);
  const pool = state.skill ? [state.skill] : state.mixedPool || grade.skills;
  const seed = Date.now() % 1000000;
  const rng = seededRandom(seed);
  const items = Array.from({ length: 24 }, (_, index) => {
    const skill = pool[index % pool.length];
    return generateProblem(skill, rng);
  });

  const drillProblems = items
    .map(
      (item, idx) => `
    <div class="drill-sheet-box">
      <span class="drill-box-num">${idx + 1}.</span>
      <div class="drill-box-q">${mathText(item.question.replace("?", ""))}</div>
      <div class="drill-box-ans"></div>
    </div>
  `,
    )
    .join("");

  const keyProblems = items
    .map(
      (item, idx) => `
    <div class="drill-sheet-box key-box">
      <span class="drill-box-num">${idx + 1}.</span>
      <div class="drill-box-q">${mathText(item.question.replace("?", ""))}</div>
      <div class="drill-box-ans key-ans">${mathText(item.answers[0])}</div>
    </div>
  `,
    )
    .join("");

  printHtml(`
    <article class="practice-sheet-print">
      <header class="practice-sheet-header">
        <div class="drill-top-row">
          <h1>Math Fluency Practice</h1>
          <div class="drill-meta-inputs">
            <span>Name: ____________________</span>
            <span>Date: _________</span>
            <span>Score: ____ / 24</span>
          </div>
        </div>
        <p class="drill-directions">Directions: Take your time. Solve each problem carefully, check your work, and work at your own pace.</p>
      </header>
      <div class="drill-grid">
        ${drillProblems}
      </div>
      <footer class="drill-footer">
        <span>EduWonderLab Math Fluency · ${grade.label} · ${escapeHtml(state.skill?.title || "Mixed Practice")} · Set #${seed}</span>
      </footer>

      <div class="pfc-page-break"></div>

      <header class="practice-sheet-header key-header">
        <div class="drill-top-row">
          <h1>Answer Key · Math Fluency Practice</h1>
          <div class="drill-meta-inputs">
            <span>${grade.label}</span>
            <span>${escapeHtml(state.skill?.title || "Mixed Practice")}</span>
            <span>Set #${seed}</span>
          </div>
        </div>
        <p class="drill-directions">Teacher &amp; Parent Key: check each answer together and revisit any missed facts with Flashcards.</p>
      </header>
      <div class="drill-grid">
        ${keyProblems}
      </div>
      <footer class="drill-footer">
        <span>EduWonderLab Math Fluency Answer Key · eduwonderlab.com/math/fluency-lab/</span>
      </footer>
    </article>
  `);
}

function printStudentRecordingMat() {
  const s = state.skill || { title: "Math Fluency Practice", grade: state.grade || 1 };
  const learner = PROFILE_NAMES[activeProfile] || "";
  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>📝 Student Math Fluency Recording Mat</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Skill: <strong>${escapeHtml(s.title)}</strong> (Grade ${s.grade}) · Strategy-First Dry-Erase Mat</p>
        </div>
        <div class="tpt-header-fields">
          <span>Name: <strong class="tpt-field-line">${escapeHtml(learner)}</strong></span>
          <span>Date: <span class="tpt-field-line"></span></span>
          <span>Goal: <strong>100% Mastery</strong></span>
        </div>
      </div>

      <div class="tpt-mat-container">
        ${[1, 2, 3].map((num) => `
          <div class="tpt-mat-problem-box">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1; padding-bottom:4px">
              <span style="font-weight:900; font-size:11pt">Problem #${num}</span>
              <span style="font-size:9pt; color:#64748b">Copy from screen: ____________________</span>
              <span style="font-size:9pt; font-weight:700">Tool Used: [ ] Number Line [ ] Chips [ ] Balance [ ] Grid</span>
            </div>
            <div class="tpt-mat-grid">
              <div class="tpt-mat-sketch-area">
                <span class="tpt-mat-sketch-label">🎨 Hands-On Visual Workspace (Draw your chips, scale, or number line hops)</span>
                <div style="height:1.1in; border:1px dashed #e2e8f0; margin-top:4px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:9pt">
                  Draw strategy here
                </div>
              </div>
              <div class="tpt-mat-answer-area">
                <div>
                  <span class="tpt-mat-sketch-label">🎯 My Action Step &amp; Answer</span>
                  <div style="margin-top:8px; font-size:10pt; line-height:1.6">
                    Step: __________________<br/>
                    Answer: <strong style="display:inline-block; border-bottom:2px solid #000; min-width:0.8in; text-align:center"></strong>
                  </div>
                </div>
                <div class="tpt-mat-reflection">
                  <span>Self-Check:</span>
                  <span>😃 Confident</span>
                  <span>😐 Used Hint</span>
                  <span>🤔 Review</span>
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>

      <footer style="margin-top:0.15in; display:flex; justify-content:space-between; font-size:8pt; color:#64748b; border-top:1px solid #cbd5e1; padding-top:4px">
        <span>EduWonderLab Math Fluency Lab · Classroom Accountability Mat</span>
        <span>Tip: Slip this page into a clear plastic sleeve for reusable dry-erase practice!</span>
        <span>eduwonderlab.com/math/fluency-lab</span>
      </footer>
    </article>
  `);
}

function printTieredExitTickets() {
  const s = state.skill || { title: "Target Math Skill", grade: state.grade || 1, learn: { rule: "Use inverse operations and visual models." } };
  const rng = seededRandom(Date.now() % 99999);
  const p1 = generateProblem(s, rng);
  const p2 = generateProblem(s, rng);
  const p3 = generateProblem(s, rng);

  printHtml(`
    <article class="tpt-print-page">
      <div style="text-align:center; margin-bottom:0.15in">
        <h1 style="margin:0; font-size:15pt">🎫 Differentiated 3-Tier Exit Tickets · 1-Page Cut-Outs</h1>
        <p style="margin:2px 0 0; font-size:9pt; color:#475569">Skill: <strong>${escapeHtml(s.title)}</strong> (Grade ${s.grade}) · Cut along dashed lines for fast formative assessment</p>
      </div>

      <!-- Tier 1: Mild / Scaffolded -->
      <div class="tpt-exit-cut-line">✂️ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂️</div>
      <div class="tpt-exit-ticket">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
          <span class="tpt-tier-badge" style="background:#dcfce7; color:#166534">🟢 Level 1: Mild (Guided Support)</span>
          <span style="font-size:9pt">Name: ____________________ Date: ________</span>
        </div>
        <p style="margin:0 0 6px; font-weight:800; font-size:11pt">1. Solve: <strong>${mathText(p1.question)}</strong></p>
        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:0.15in">
          <div style="border:1px dashed #94a3b8; border-radius:6px; padding:6px; font-size:8pt">
            <strong>Guided Frame:</strong> ${escapeHtml(p1.hint || s.learn?.rule || "Break into friendly parts or use counters.")}
            <div style="height:0.45in; border-bottom:1px solid #ccc; margin-top:4px">Sketch model:</div>
          </div>
          <div style="border:1px solid #0f172a; border-radius:6px; padding:6px; text-align:center">
            <span style="font-size:9pt; font-weight:700">My Answer:</span>
            <div style="height:0.4in; font-size:14pt; font-weight:900; margin-top:4px"></div>
          </div>
        </div>
      </div>

      <!-- Tier 2: Medium / On-Grade Target -->
      <div class="tpt-exit-cut-line">✂️ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂️</div>
      <div class="tpt-exit-ticket">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
          <span class="tpt-tier-badge" style="background:#fef3c7; color:#92400e">🟡 Level 2: Medium (Target Fluency)</span>
          <span style="font-size:9pt">Name: ____________________ Date: ________</span>
        </div>
        <p style="margin:0 0 6px; font-weight:800; font-size:11pt">1. Solve: <strong>${mathText(p2.question)}</strong></p>
        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:0.15in">
          <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px; font-size:8.5pt">
            <strong>Show Strategy / Thinking:</strong>
            <div style="height:0.5in"></div>
          </div>
          <div style="border:1px solid #0f172a; border-radius:6px; padding:6px; text-align:center">
            <span style="font-size:9pt; font-weight:700">Final Answer:</span>
            <div style="height:0.4in; font-size:14pt; font-weight:900; margin-top:4px"></div>
          </div>
        </div>
        <p style="margin:4px 0 0; font-size:8pt; color:#475569">Sentence Stem: I solved this by __________________________________________________.</p>
      </div>

      <!-- Tier 3: Spicy / Error Analysis & Extension -->
      <div class="tpt-exit-cut-line">✂️ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂️</div>
      <div class="tpt-exit-ticket">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
          <span class="tpt-tier-badge" style="background:#fee2e2; color:#991b1b">🌶️ Level 3: Spicy (Error Analysis)</span>
          <span style="font-size:9pt">Name: ____________________ Date: ________</span>
        </div>
        <p style="margin:0 0 4px; font-weight:800; font-size:10pt">Problem: <strong>${mathText(p3.question)}</strong></p>
        <p style="margin:0 0 6px; font-size:9pt; color:#7f1d1d"><strong>⚠️ Maya says the answer is "${mathText(String(Number(p3.answers[0]) + 2))}".</strong></p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.15in">
          <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px; font-size:8pt">
            <strong>What was Maya's mistake in thinking?</strong>
            <div style="height:0.45in"></div>
          </div>
          <div style="border:1px solid #0f172a; border-radius:6px; padding:6px; font-size:8pt">
            <strong>Prove the correct answer:</strong>
            <div style="height:0.45in; text-align:center; font-size:13pt; font-weight:900; padding-top:4px"></div>
          </div>
        </div>
      </div>
    </article>
  `);
}

function printDeskHelperStrips() {
  printHtml(`
    <article class="tpt-print-page">
      <div style="text-align:center; margin-bottom:0.12in">
        <h1 style="margin:0; font-size:15pt">📌 Desk Helper &amp; Math Strategy Cheat Strips</h1>
        <p style="margin:2px 0 0; font-size:9pt; color:#475569">Print on cardstock, cut along dashed borders, and laminate or tape to student desks</p>
      </div>

      ${[1, 2, 3].map(() => `
        <div class="tpt-exit-cut-line">✂️ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂️</div>
        <div class="tpt-desk-strip">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #0f172a; padding-bottom:4px; margin-bottom:6px">
            <span style="font-weight:900; font-size:11pt">⭐ MATH FLUENCY STRATEGY HELPER</span>
            <span style="font-size:9pt; font-weight:700">Student Name: ____________________</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.1in; text-align:center; font-size:8pt">
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; background:#eff6ff">
              <strong style="color:#1d4ed8; font-size:8.5pt">🔵🔴 Zero Pairs</strong><br/>
              (+1) + (−1) = <strong>0</strong><br/>
              <span style="color:#475569">Subtracting a negative is adding a positive!</span>
            </div>
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; background:#f0fdf4">
              <strong style="color:#15803d; font-size:8.5pt">🍕 Keep-Change-Flip</strong><br/>
              Keep 1st fraction<br/>
              Change ÷ to ×<br/>
              Flip 2nd to reciprocal!
            </div>
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; background:#fffbeb">
              <strong style="color:#b45309; font-size:8.5pt">⚖️ Balance Rule</strong><br/>
              Keep both pans level!<br/>
              <span style="color:#78350f">Whatever you do to one side, you MUST do to both!</span>
            </div>
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; background:#fdf2f8">
              <strong style="color:#be185d; font-size:8.5pt">🔄 Inverses</strong><br/>
              + undoes −<br/>
              − undoes +<br/>
              × undoes ÷<br/>
              ÷ undoes ×
            </div>
          </div>
        </div>
      `).join("")}
    </article>
  `);
}

function printStrategyAnchorCharts() {
  const s = state.skill || { title: "Visual Problem Solving", grade: state.grade || 1, learn: { rule: "Make equal jumps and balance both sides." } };
  printHtml(`
    <article class="tpt-print-page" style="padding:0.2in">
      <div style="border:6px double #0f172a; border-radius:14px; padding:0.25in; text-align:center">
        <span style="font-size:10pt; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; color:#1d4ed8">EduWonderLab Classroom Anchor Poster</span>
        <h1 style="font-size:24pt; font-weight:900; margin:0.1in 0">${escapeHtml(s.title)}</h1>
        <p style="font-size:12pt; font-weight:700; color:#334155; margin:0 0 0.2in">Grade ${s.grade} · Core Strategy Anchor Chart</p>

        <div style="background:#f8fafc; border:2px solid #cbd5e1; border-radius:10px; padding:0.15in; margin-bottom:0.2in">
          <h2 style="font-size:14pt; margin:0 0 6px; color:#15803d">🎯 The Golden Mathematical Rule:</h2>
          <p style="font-size:14pt; font-weight:800; margin:0; line-height:1.4">“${escapeHtml(s.learn?.rule || "Break numbers into friendly parts and keep both sides balanced!")}”</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.2in; text-align:left; margin-bottom:0.2in">
          <div style="border:2px solid #0f172a; border-radius:8px; padding:0.15in">
            <h3 style="margin:0 0 8px; font-size:12pt; font-weight:800">🪜 3-Step Action Plan:</h3>
            <ol style="margin:0; padding-left:0.2in; font-size:11pt; line-height:1.6">
              <li><strong>Model It:</strong> Draw the problem (chips, scale, hops).</li>
              <li><strong>Isolate / Solve:</strong> Use friendly inverses or landmarks.</li>
              <li><strong>Sanity Check:</strong> Does your answer make sense?</li>
            </ol>
          </div>
          <div style="border:2px solid #dc2626; border-radius:8px; padding:0.15in; background:#fff5f5">
            <h3 style="margin:0 0 8px; font-size:12pt; font-weight:800; color:#991b1b">⚠️ Common Mistake Alert:</h3>
            <p style="margin:0; font-size:10.5pt; color:#7f1d1d; line-height:1.5">
              ${escapeHtml(s.learn?.commonMistake?.what || "Don't rush to guess. If you divide or subtract, make sure you apply it equally to all parts!")}
            </p>
          </div>
        </div>

        <footer style="border-top:1.5px solid #0f172a; padding-top:0.1in; display:flex; justify-content:space-between; font-size:9pt; font-weight:700">
          <span>EduWonderLab Math Fluency Lab</span>
          <span>Post this on your Classroom Math Wall!</span>
          <span>eduwonderlab.com</span>
        </footer>
      </div>
    </article>
  `);
}

function printFluencyPassport() {
  const learner = PROFILE_NAMES[activeProfile] || "Explorer";
  printHtml(`
    <article class="tpt-print-page">
      <div style="text-align:center; margin-bottom:0.15in">
        <h1 style="margin:0; font-size:15pt">🎖️ Official Math Fluency Passport · 4-Quadrant Booklet</h1>
        <p style="margin:2px 0 0; font-size:9pt; color:#475569">Fold into quarters to create a pocket-sized student passport. Stamp or sticker as skills are mastered!</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:0.2in; min-height:8in">
        <!-- Quadrant 1: Cover -->
        <div style="border:3px double #1e3a8a; border-radius:12px; padding:0.2in; text-align:center; background:#f0f9ff">
          <div style="font-size:24pt">📘</div>
          <h2 style="margin:6px 0; font-size:14pt; color:#1e3a8a">PASSPORT</h2>
          <p style="font-size:9pt; font-weight:800; color:#0369a1; text-transform:uppercase; margin:0">EduWonderLab Math Fluency</p>
          <div style="width:1in; height:1.1in; border:1.5px dashed #0284c7; margin:0.15in auto; display:flex; align-items:center; justify-content:center; font-size:8pt; color:#64748b">
            Photo / Avatar
          </div>
          <p style="font-size:10pt; font-weight:800; margin:4px 0">Learner: ${escapeHtml(learner)}</p>
          <p style="font-size:9pt; margin:0">Issued: ${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Quadrant 2: Primary Grades Visas -->
        <div style="border:2px dashed #0f172a; border-radius:12px; padding:0.15in">
          <h3 style="margin:0 0 6px; font-size:10pt; text-align:center">VISAS: FOUNDATIONS (Grades 1–4)</h3>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; text-align:center">
            ${[1, 2, 3, 4].map((g) => `
              <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; font-size:7pt">
                <strong>Grade ${g}</strong>
                <div style="width:26px; height:26px; border:1px solid #94a3b8; border-radius:50%; margin:4px auto"></div>
                <span>Initial</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Quadrant 3: Middle Grades Visas -->
        <div style="border:2px dashed #0f172a; border-radius:12px; padding:0.15in">
          <h3 style="margin:0 0 6px; font-size:10pt; text-align:center">VISAS: ADVANCED MASTERY (Grades 5–8)</h3>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; text-align:center">
            ${[5, 6, 7, 8].map((g) => `
              <div style="border:1px solid #cbd5e1; border-radius:6px; padding:4px; font-size:7pt">
                <strong>Grade ${g}</strong>
                <div style="width:26px; height:26px; border:1px solid #94a3b8; border-radius:50%; margin:4px auto"></div>
                <span>Initial</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Quadrant 4: Mathematician Pledge -->
        <div style="border:3px double #15803d; border-radius:12px; padding:0.2in; text-align:center; background:#f0fdf4">
          <div style="font-size:20pt">⭐</div>
          <h3 style="margin:4px 0; font-size:11pt; color:#15803d">MATHEMATICIAN PLEDGE</h3>
          <p style="font-size:8pt; line-height:1.5; color:#166534; font-style:italic">
            “I promise to embrace challenges, learn from mistakes, use models when stuck, and celebrate every fluency milestone!”
          </p>
          <div style="margin-top:0.15in; border-top:1px solid #166534; padding-top:4px; font-size:8pt; font-weight:700">
            Student Signature: ____________________
          </div>
        </div>
      </div>
    </article>
  `);
}

function printBragTags() {
  const tags = [
    { icon: "⚖️", title: "Balance Master", desc: "Keeps both sides equal!" },
    { icon: "🔵🔴", title: "Zero Pair Ninja", desc: "Cancels integers cleanly!" },
    { icon: "📏", title: "Double Line Pro", desc: "Ratios scaled up & down!" },
    { icon: "⚡", title: "Lightning Facts", desc: "Automatic fact recall!" },
    { icon: "🎯", title: "100% Accuracy", desc: "Flawless fluency check!" },
    { icon: "🪜", title: "Step-by-Step Solver", desc: "Shows strategic steps!" },
    { icon: "🍕", title: "Fraction Flak", desc: "Conquered Keep-Change-Flip!" },
    { icon: "🧠", title: "Growth Mindset", desc: "Turned mistakes into insight!" },
    { icon: "🏆", title: "Fluency Champion", desc: "Gold standard mastery!" }
  ];

  printHtml(`
    <article class="tpt-print-page">
      <div style="text-align:center; margin-bottom:0.15in">
        <h1 style="margin:0; font-size:15pt">🎖️ Collectible Math Brag Tags (9-Up Printable Sheet)</h1>
        <p style="margin:2px 0 0; font-size:9pt; color:#475569">Punch hole at top circle for necklace rings or binder chains</p>
      </div>

      <div class="tpt-tags-grid">
        ${Array.from({ length: 9 }, (_, i) => {
          const t = tags[i % tags.length];
          return `
            <div class="tpt-brag-tag">
              <div class="tpt-brag-hole"></div>
              <div style="font-size:24pt; margin-top:0.12in">${t.icon}</div>
              <strong style="font-size:10pt; color:#0f172a">${t.title}</strong>
              <p style="font-size:8pt; color:#475569; margin:4px 0">${t.desc}</p>
              <span style="font-size:7pt; color:#94a3b8; font-weight:700">EduWonderLab Math Fluency</span>
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `);
}

function printStationTentCards() {
  const stations = [
    { num: 1, name: "Digital Fluency Station", icon: "💻", step1: "Log on to eduwonderlab.com/math/fluency-lab", step2: "Pick your grade & focus skill", step3: "Complete 10 problems with 80%+ accuracy" },
    { num: 2, name: "Hands-On Manipulatives Station", icon: "🧮", step1: "Get your dry-erase Recording Mat", step2: "Use chips, balance, or number lines to model 5 problems", step3: "Self-reflect with the 3 smiley badges" },
    { num: 3, name: "Peer Flashcard & Coaching Table", icon: "🤝", step1: "Take turns drawing flashcards with a partner", step2: "Prompt with: 'Why did that step work?'", step3: "Initial your partner's passport after 5 correct facts" }
  ];

  printHtml(`
    <article class="tpt-print-page">
      <div style="text-align:center; margin-bottom:0.15in">
        <h1 style="margin:0; font-size:15pt">🎪 Math Workshop Station Tent Cards · Fold &amp; Display</h1>
        <p style="margin:2px 0 0; font-size:9pt; color:#475569">Fold each card along center dashed line to stand up on station tables</p>
      </div>

      ${stations.map((st) => `
        <div class="tpt-tent-card">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f172a; padding-bottom:6px">
            <span style="font-size:16pt; font-weight:900">STATION ${st.num}: ${st.name}</span>
            <span style="font-size:22pt">${st.icon}</span>
          </div>
          <div class="tpt-fold-line">-------------------- FOLD HERE TO CREATE TABLE TENT --------------------</div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.15in; text-align:center; font-size:9pt">
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px; background:#f8fafc">
              <strong>Step 1</strong><br/>${st.step1}
            </div>
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px; background:#f8fafc">
              <strong>Step 2</strong><br/>${st.step2}
            </div>
            <div style="border:1px solid #cbd5e1; border-radius:6px; padding:6px; background:#f8fafc">
              <strong>Step 3</strong><br/>${st.step3}
            </div>
          </div>
        </div>
      `).join("")}
    </article>
  `);
}

function printSmallGroupCoachingCueSheet() {
  const s = state.skill || { title: "Target Math Concept", grade: state.grade || 1, strand: "Core Number", learn: { rule: "Maintain mathematical balance and invert operations." } };
  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>📋 Teacher Small Group Coaching Cue Sheet</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Skill: <strong>${escapeHtml(s.title)}</strong> (Grade ${s.grade} · ${escapeHtml(s.strand)})</p>
        </div>
        <div style="font-size:9pt; font-weight:700">EduWonderLab Tier 2 Guided Math</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.15in">
        <div style="border:1.5px solid #0f172a; border-radius:8px; padding:0.12in">
          <h3 style="margin:0 0 4px; font-size:11pt; color:#1e3a8a">🎯 Target Concept &amp; Standard</h3>
          <p style="margin:0; font-size:10pt">Rule: “${escapeHtml(s.learn?.rule || "Model the mathematical structure and isolate unknowns using inverses.")}”</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.15in">
          <div style="border:1.5px solid #b91c1c; border-radius:8px; padding:0.12in; background:#fef2f2">
            <h3 style="margin:0 0 6px; font-size:11pt; color:#991b1b">⚠️ Common Student Misconceptions</h3>
            <ul style="margin:0; padding-left:0.15in; font-size:9pt; line-height:1.5; color:#7f1d1d">
              <li>Applies the operation to only one side of the equation.</li>
              <li>Treats subtracting a negative as regular subtraction.</li>
              <li>Adds denominators together when adding fractions.</li>
              <li>Rushes without sketching visual landmarks first.</li>
            </ul>
          </div>
          <div style="border:1.5px solid #15803d; border-radius:8px; padding:0.12in; background:#f0fdf4">
            <h3 style="margin:0 0 6px; font-size:11pt; color:#166534">🗣️ Scaffolded Teacher Prompting Stems</h3>
            <ul style="margin:0; padding-left:0.15in; font-size:9pt; line-height:1.5; color:#14532d">
              <li><em>“What is this problem actually asking us to find?”</em></li>
              <li><em>“If we take away 3 from the left pan, what happens to the right?”</em></li>
              <li><em>“Can you show me that with two-color counter chips?”</em></li>
              <li><em>“How can you prove your answer makes sense?”</em></li>
            </ul>
          </div>
        </div>

        <div style="border:1.5px solid #475569; border-radius:8px; padding:0.12in">
          <h3 style="margin:0 0 6px; font-size:11pt">♿ Differentiation &amp; Accommodations</h3>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.1in; font-size:8.5pt">
            <div><strong>ESOL/ELL:</strong> Provide the bilingual Spanish flashcard and visual SVG printout.</div>
            <div><strong>IEP/504:</strong> Reduce task to 3 problems with dry-erase recording mat.</div>
            <div><strong>Challenge/GT:</strong> Have student create an error-analysis puzzle for peers.</div>
          </div>
        </div>
      </div>
    </article>
  `);
}

function printFridgeMathGuide() {
  printHtml(`
    <article class="tpt-print-page">
      <div style="border:4px double #1e3a8a; border-radius:14px; padding:0.25in">
        <div style="text-align:center; border-bottom:2px solid #1e3a8a; padding-bottom:0.15in; margin-bottom:0.15in">
          <span style="font-size:9pt; font-weight:800; letter-spacing:0.1em; color:#0369a1; text-transform:uppercase">EduWonderLab Family Connection</span>
          <h1 style="margin:4px 0; font-size:18pt; color:#1e3a8a">🏠 “Fridge Math” Family Guide</h1>
          <p style="margin:0; font-size:10.5pt; color:#475569">Why does math look different now? A parent’s cheat sheet to modern visual models!</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.2in; margin-bottom:0.2in">
          <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.12in; background:#f8fafc">
            <h3 style="margin:0 0 6px; font-size:11pt; color:#0f172a">🔵🔴 Why Red &amp; Blue Chips for Negatives?</h3>
            <p style="margin:0; font-size:9pt; line-height:1.5; color:#334155">
              Instead of memorizing confusing rules like "minus a minus is a plus", students pair a positive chip (+1) with a negative chip (-1) to make a <strong>Zero Pair</strong>. When you remove negatives, the overall value increases!
            </p>
          </div>
          <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.12in; background:#f8fafc">
            <h3 style="margin:0 0 6px; font-size:11pt; color:#0f172a">⚖️ Why a Balance Scale for Algebra?</h3>
            <p style="margin:0; font-size:9pt; line-height:1.5; color:#334155">
              The equals sign ($=$) means <em>balance</em>, not "the answer comes next". By imagining a physical balance scale, students see why they must perform the identical operation on both sides to isolate $x$.
            </p>
          </div>
        </div>

        <div style="border:2px solid #15803d; border-radius:10px; padding:0.15in; background:#f0fdf4; margin-bottom:0.2in">
          <h3 style="margin:0 0 6px; font-size:12pt; color:#166534">💬 3 Easy Questions to Ask at Dinner (Instead of "What's the answer?"):</h3>
          <ol style="margin:0; padding-left:0.2in; font-size:9.5pt; line-height:1.6; color:#14532d">
            <li><em>“Can you sketch a picture or number line of what that problem looks like?”</em></li>
            <li><em>“Is your answer going to be bigger or smaller than where you started?”</em></li>
            <li><em>“What's another friendly number close by that makes this easier?”</em></li>
          </ol>
        </div>

        <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.1in; font-size:8.5pt; color:#64748b">
          <span>Free Student Practice at: <strong>eduwonderlab.com/math/fluency-lab</strong></span>
          <span>Hang this on your refrigerator! 🧲</span>
        </footer>
      </div>
    </article>
  `);
}

/* ==========================================================================
   Classroom Number Talks Bank (Grades 1–8 Standards-Aligned)
   ========================================================================== */
const NUMBER_TALKS = [
  // Grade 1
  {
    id: "nt-g1-1",
    grade: 1,
    title: "Making 10 & Doubles",
    standard: "1.OA.C.6",
    problem: "8 + 6 = ?",
    silentPrompt: {
      en: "Think silently: put a thumb up against your chest when you have one way to solve it.",
      es: "Piensa en silencio: pon un pulgar en el pecho cuando tengas una manera de resolverlo."
    },
    noticeWonder: {
      en: [
        "Both numbers are even.",
        "8 is only 2 away from making a friendly 10.",
        "6 can be decomposed into 2 and 4, or 3 and 3."
      ],
      es: [
        "Ambos números son pares.",
        "El 8 está a solo 2 unidades de formar un 10 amigable.",
        "El 6 se puede descomponer en 2 y 4, o en 3 y 3."
      ]
    },
    strategies: [
      {
        student: "Elena",
        name: { en: "Make a Friendly 10", es: "Formar un 10 amigable" },
        steps: "8 + 6 = 8 + (2 + 4) = 10 + 4 = 14",
        explanation: {
          en: "Take 2 from 6 to make 10 with 8, then add the remaining 4.",
          es: "Toma 2 del 6 para formar 10 con el 8, luego suma los 4 que quedan."
        }
      },
      {
        student: "Mateo",
        name: { en: "Doubles Plus 2", es: "Dobles más 2" },
        steps: "6 + 6 = 12, then 12 + 2 = 14",
        explanation: {
          en: "Think of 8 as 6 + 2. Use known double 6 + 6 = 12, then add 2 more.",
          es: "Piensa en 8 como 6 + 2. Usa el doble 6 + 6 = 12 y suma 2 más."
        }
      },
      {
        student: "Sofia",
        name: { en: "Over-Add & Adjust (Compensation)", es: "Compensación / Sumar de más" },
        steps: "10 + 6 = 16, then 16 − 2 = 14",
        explanation: {
          en: "Add 10 instead of 8 because 10 is easy, then subtract the 2 extra.",
          es: "Suma 10 en vez de 8 porque es fácil, luego resta los 2 de más."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Who can explain Elena’s strategy in their own words?”",
        "“How does Mateo’s double connect to Sofia’s compensation strategy?”",
        "“Which strategy felt most efficient for your brain today?”"
      ],
      es: [
        "«¿Quién puede explicar la estrategia de Elena en sus propias palabras?»",
        "«¿Cómo se conecta el doble de Mateo con la compensación de Sofia?»",
        "«¿Qué estrategia fue más eficiente para tu mente hoy?»"
      ]
    }
  },
  {
    id: "nt-g1-2",
    grade: 1,
    title: "Think Addition for Subtraction",
    standard: "1.OA.B.4",
    problem: "15 − 7 = ?",
    silentPrompt: {
      en: "Fist to chest: how can addition help you solve this subtraction problem?",
      es: "Pulgar al pecho: ¿cómo puede ayudarte la suma a resolver esta resta?"
    },
    noticeWonder: {
      en: [
        "15 is 10 plus 5 ones.",
        "7 is close to 8, another known double.",
        "Subtracting 7 leaves more than half of 15."
      ],
      es: [
        "15 es 10 más 5 unidades.",
        "7 está cerca de 8, otro doble conocido.",
        "Restar 7 deja más de la mitad de 15."
      ]
    },
    strategies: [
      {
        student: "Lucas",
        name: { en: "Think Addition (Count Up)", es: "Pensar en suma (Contar hacia arriba)" },
        steps: "7 + 3 = 10, then 10 + 5 = 15, so 3 + 5 = 8",
        explanation: {
          en: "Ask: what adds to 7 to reach 15? Jump 3 to 10, then 5 to 15. Total jump is 8.",
          es: "Pregunta: ¿cuánto sumo a 7 para llegar a 15? Salta 3 al 10 y 5 al 15. Salto total: 8."
        }
      },
      {
        student: "Maya",
        name: { en: "Back Through 10", es: "Retroceder pasando por el 10" },
        steps: "15 − 5 = 10, then 10 − 2 = 8",
        explanation: {
          en: "Take away 5 first to land on friendly 10, then take away the other 2.",
          es: "Quita primero 5 para llegar al 10, luego quita los otros 2."
        }
      },
      {
        student: "Jordan",
        name: { en: "Take From 10", es: "Quitar del 10" },
        steps: "15 is 10 + 5. Take 7 from 10: 10 − 7 = 3. Add 3 + 5 = 8",
        explanation: {
          en: "Decompose 15 into 10 and 5. Subtract 7 from the 10, then add the 5 ones back.",
          es: "Descompón 15 en 10 y 5. Resta 7 del 10 y vuelve a sumar los 5."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Where did Lucas get the 3 and 5 in his addition jumps?”",
        "“Why did Maya choose to subtract 5 first instead of subtracting 7 all at once?”",
        "“How are Maya and Jordan using the benchmark 10 differently?”"
      ],
      es: [
        "«¿De dónde sacó Lucas el 3 y el 5 en sus saltos de suma?»",
        "«¿Por qué Maya decidió restar 5 primero en vez de restar 7 de golpe?»",
        "«¿Cómo están usando Maya y Jordan el número 10 de formas distintas?»"
      ]
    }
  },

  // Grade 2
  {
    id: "nt-g2-1",
    grade: 2,
    title: "Compensation & Friendly Tens",
    standard: "2.NBT.B.5",
    problem: "28 + 35 = ?",
    silentPrompt: {
      en: "Silent think time: look for numbers close to friendly multiples of 10.",
      es: "Tiempo en silencio: busca números cercanos a múltiplos amigables de 10."
    },
    noticeWonder: {
      en: [
        "28 is only 2 away from 30.",
        "35 ends in 5, making it friendly to partition.",
        "The sum will be more than 60."
      ],
      es: [
        "28 está a solo 2 de llegar a 30.",
        "35 termina en 5, lo que facilita descomponerlo.",
        "La suma será mayor que 60."
      ]
    },
    strategies: [
      {
        student: "Aisha",
        name: { en: "Compensation (Give & Take)", es: "Compensación (Dar y quitar)" },
        steps: "28 + 2 = 30, then 35 − 2 = 33, so 30 + 33 = 63",
        explanation: {
          en: "Shift 2 from 35 to 28 to make a friendly 30, then add 33.",
          es: "Pasa 2 del 35 al 28 para hacer 30, luego suma 33."
        }
      },
      {
        student: "David",
        name: { en: "Tens then Ones Decomposition", es: "Decenas luego unidades" },
        steps: "20 + 30 = 50, then 8 + 5 = 13, so 50 + 13 = 63",
        explanation: {
          en: "Add the tens columns first, then add the ones, and combine.",
          es: "Suma las decenas primero (50), luego las unidades (13), y combina."
        }
      },
      {
        student: "Nia",
        name: { en: "Friendly 25s & 5s", es: "Grupos de 25 y 5" },
        steps: "25 + 35 = 60, then add remaining 3: 60 + 3 = 63",
        explanation: {
          en: "Split 28 into 25 + 3. Add 25 + 35 = 60, then add 3.",
          es: "Divide 28 en 25 + 3. Suma 25 + 35 = 60, luego suma 3."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Aisha subtract 2 from 35 after adding 2 to 28?”",
        "“How can you prove Aisha and David got the same answer using mental pictures?”",
        "“When would Aisha’s compensation strategy be easier than column addition?”"
      ],
      es: [
        "«¿Por qué Aisha restó 2 al 35 después de sumar 2 al 28?»",
        "«¿Cómo puedes demostrar que Aisha y David llegaron a la misma respuesta?»",
        "«¿Cuándo es más fácil la compensación que sumar en columnas?»"
      ]
    }
  },
  {
    id: "nt-g2-2",
    grade: 2,
    title: "Constant Difference Subtraction",
    standard: "2.NBT.B.5",
    problem: "62 − 28 = ?",
    silentPrompt: {
      en: "How can keeping the distance constant make subtraction much simpler?",
      es: "¿Cómo mantener la distancia constante hace que la resta sea más sencilla?"
    },
    noticeWonder: {
      en: [
        "28 has 8 ones, which requires regrouping from 62.",
        "Adding 2 to 28 makes an easy 30.",
        "The gap between two numbers stays identical if both shift by the same amount."
      ],
      es: [
        "28 tiene 8 unidades, lo que pediría reagrupar del 62.",
        "Sumar 2 al 28 produce un fácil 30.",
        "La distancia entre dos números no cambia si ambos se desplazan igual."
      ]
    },
    strategies: [
      {
        student: "Leo",
        name: { en: "Constant Difference Shift", es: "Diferencia constante" },
        steps: "(62 + 2) − (28 + 2) = 64 − 30 = 34",
        explanation: {
          en: "Add 2 to both numbers. The difference stays identical, but subtracting 30 requires zero regrouping!",
          es: "Suma 2 a ambos números. La diferencia se mantiene, ¡pero restar 30 no requiere reagrupar!"
        }
      },
      {
        student: "Zara",
        name: { en: "Number Line Landmark Jumps", es: "Saltos en la recta numérica" },
        steps: "28 + 2 = 30, 30 + 30 = 60, 60 + 2 = 62 → 2 + 30 + 2 = 34",
        explanation: {
          en: "Start at 28 and jump up to landmarks: 2 to 30, 30 to 60, and 2 to 62.",
          es: "Empieza en 28 y salta a números clave: 2 al 30, 30 al 60 y 2 al 62. Total: 34."
        }
      },
      {
        student: "Carlos",
        name: { en: "Subtract Friendly Tens First", es: "Restar decenas amigables primero" },
        steps: "62 − 20 = 42, then 42 − 8 = 34",
        explanation: {
          en: "Subtract 20 from 62 to get 42, then subtract the remaining 8 ones.",
          es: "Resta 20 del 62 para obtener 42, luego resta las 8 unidades restantes."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is 64 − 30 mathematically identical to 62 − 28?”",
        "“Where can you see Zara’s three jumps on an open number line?”",
        "“Why is constant difference one of the most powerful mental subtraction tools?”"
      ],
      es: [
        "«¿Por qué 64 − 30 es matemáticamente idéntico a 62 − 28?»",
        "«¿Dónde ves los tres saltos de Zara en una recta numérica?»",
        "«¿Por qué la diferencia constante es tan poderosa para calcular mentalmente?»"
      ]
    }
  },

  // Grade 3
  {
    id: "nt-g3-1",
    grade: 3,
    title: "Array Decomposition (5s & 2s)",
    standard: "3.OA.B.5",
    problem: "7 × 8 = ?",
    silentPrompt: {
      en: "Fist to chest: what smaller multiplication facts can you combine?",
      es: "Pulgar al pecho: ¿qué multiplicaciones más pequeñas puedes combinar?"
    },
    noticeWonder: {
      en: [
        "7 can be decomposed into friendly 5 and 2.",
        "8 is an even number that can be halved or doubled.",
        "Multiplication distributes across addition."
      ],
      es: [
        "7 se puede descomponer en 5 y 2 amigables.",
        "8 es un número par que se puede duplicar.",
        "La multiplicación se distribuye sobre la suma."
      ]
    },
    strategies: [
      {
        student: "Aaliyah",
        name: { en: "Distributive Split: 5s and 2s", es: "Descomposición en 5 y 2" },
        steps: "7 × 8 = (5 × 8) + (2 × 8) = 40 + 16 = 56",
        explanation: {
          en: "7 groups of 8 is 5 groups of 8 (40) plus 2 groups of 8 (16). 40 + 16 = 56.",
          es: "7 grupos de 8 son 5 grupos de 8 (40) más 2 grupos de 8 (16). 40 + 16 = 56."
        }
      },
      {
        student: "Marcus",
        name: { en: "Double, Double, Double", es: "Duplicar tres veces" },
        steps: "7 × 2 = 14, 14 × 2 = 28, 28 × 2 = 56",
        explanation: {
          en: "Multiplying by 8 is doubling three times: double 7 is 14, double 14 is 28, double 28 is 56.",
          es: "Multiplicar por 8 es duplicar 3 veces: 7 a 14, 14 a 28, y 28 a 56."
        }
      },
      {
        student: "Mateo",
        name: { en: "Compensation from 10 Groups", es: "Compensar desde 10 grupos" },
        steps: "(10 × 8) − (3 × 8) = 80 − 24 = 56",
        explanation: {
          en: "Take 10 groups of 8 (80) and remove the 3 extra groups of 8 (24) = 56.",
          es: "Toma 10 grupos de 8 (80) y quita los 3 grupos extra de 8 (24) = 56."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is splitting 7 into 5 and 2 easier than splitting it into 4 and 3?”",
        "“How does Marcus’s doubling method prove that multiplication is associative?”",
        "“Can someone explain how Aaliyah’s work matches an area model?”"
      ],
      es: [
        "«¿Por qué dividir 7 en 5 y 2 es más fácil que dividirlo en 4 y 3?»",
        "«¿Cómo demuestra el método de Marcus que la multiplicación es asociativa?»",
        "«¿Cómo se relaciona el trabajo de Aaliyah con un modelo de área?»"
      ]
    }
  },
  {
    id: "nt-g3-2",
    grade: 3,
    title: "Nines Strategy (Ten Minus One)",
    standard: "3.OA.B.5",
    problem: "9 × 6 = ?",
    silentPrompt: {
      en: "How does 10 help you calculate any multiplication fact with 9?",
      es: "¿Cómo te ayuda el 10 a calcular cualquier tabla del 9?"
    },
    noticeWonder: {
      en: [
        "9 is 1 group less than 10.",
        "The digits of products of 9 always sum to 9 (5 + 4 = 9).",
        "Tens digit is 1 less than the factor being multiplied (6 − 1 = 5)."
      ],
      es: [
        "9 es 1 grupo menos que 10.",
        "Los dígitos del producto del 9 siempre suman 9 (5 + 4 = 9).",
        "La cifra de las decenas es 1 menos que el factor (6 − 1 = 5)."
      ]
    },
    strategies: [
      {
        student: "Priya",
        name: { en: "10 Groups Minus 1 Group", es: "10 grupos menos 1 grupo" },
        steps: "(10 × 6) − (1 × 6) = 60 − 6 = 54",
        explanation: {
          en: "Calculate 10 × 6 = 60, then take away one group of 6 to get 54.",
          es: "Calcula 10 × 6 = 60, luego quita un grupo de 6 para obtener 54."
        }
      },
      {
        student: "Noah",
        name: { en: "Split into 5s and 4s", es: "Dividir en 5 y 4" },
        steps: "(5 × 6) + (4 × 6) = 30 + 24 = 54",
        explanation: {
          en: "5 groups of 6 is 30, 4 groups of 6 is 24. 30 + 24 = 54.",
          es: "5 grupos de 6 son 30, 4 grupos de 6 son 24. 30 + 24 = 54."
        }
      },
      {
        student: "Layla",
        name: { en: "Halving the Other Factor", es: "Partir el otro factor a la mitad" },
        steps: "9 × 3 = 27, then double it: 27 + 27 = 54",
        explanation: {
          en: "Split 6 into 3 and 3. 9 × 3 = 27, and double 27 is 54.",
          es: "Divide 6 en 3 y 3. 9 × 3 = 27, y el doble de 27 es 54."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why does Priya’s strategy work for any number multiplied by 9?”",
        "“What pattern do you notice in the digits 5 and 4?”",
        "“How can Layla’s halving strategy help you with larger numbers?”"
      ],
      es: [
        "«¿Por qué la estrategia de Priya funciona para cualquier número multiplicado por 9?»",
        "«¿Qué patrón observas en los dígitos 5 y 4?»",
        "«¿Cómo te ayuda partir a la mitad cuando multiplicas números mayores?»"
      ]
    }
  },

  // Grade 4
  {
    id: "nt-g4-1",
    grade: 4,
    title: "Halve & Double / Quarters",
    standard: "4.NBT.B.5",
    problem: "16 × 25 = ?",
    silentPrompt: {
      en: "Silent think: 25 is related to money (quarters) and 100. How does that help?",
      es: "Piensa en silencio: 25 se relaciona con 100 (cuartos). ¿Cómo te ayuda eso?"
    },
    noticeWonder: {
      en: [
        "4 quarters makes 1 dollar ($1.00 = 100).",
        "16 has a factor of 4 (4 × 4 = 16).",
        "Both numbers have factors of 2 and 5."
      ],
      es: [
        "4 monedas de 25 centavos hacen 100.",
        "16 contiene el factor 4 (4 × 4 = 16).",
        "Ambos números tienen factores de 2 y 5."
      ]
    },
    strategies: [
      {
        student: "Jayden",
        name: { en: "Factor Out Groups of 100", es: "Factorizar grupos de 100" },
        steps: "16 × 25 = (4 × 4) × 25 = 4 × (4 × 25) = 4 × 100 = 400",
        explanation: {
          en: "Group 4 with 25 to make 100, then multiply 4 × 100 = 400.",
          es: "Agrupa 4 con 25 para hacer 100, luego multiplica 4 × 100 = 400."
        }
      },
      {
        student: "Chloe",
        name: { en: "Halve and Double", es: "Mitad y doble" },
        steps: "16 × 25 = 8 × 50 = 4 × 100 = 400",
        explanation: {
          en: "Halve 16 and double 25 repeatedly until you reach friendly numbers.",
          es: "Saca la mitad de 16 y duplica 25 sucesivamente: 8 × 50 = 4 × 100 = 400."
        }
      },
      {
        student: "Kevin",
        name: { en: "Distributive Property (Tens & Ones)", es: "Propiedad distributiva" },
        steps: "(10 × 25) + (6 × 25) = 250 + 150 = 400",
        explanation: {
          en: "10 groups of 25 is 250. 6 groups of 25 is 150. 250 + 150 = 400.",
          es: "10 grupos de 25 son 250. 6 grupos de 25 son 150. 250 + 150 = 400."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why does halving one factor and doubling the other leave the product unchanged?”",
        "“How did Jayden see 100 inside 16 × 25?”",
        "“Which method would you use if the problem was 18 × 25?”"
      ],
      es: [
        "«¿Por qué sacar la mitad a un factor y duplicar el otro no cambia el producto?»",
        "«¿Cómo descubrió Jayden el 100 dentro de 16 × 25?»",
        "«¿Qué método usarías si el problema fuera 18 × 25?»"
      ]
    }
  },
  {
    id: "nt-g4-2",
    grade: 4,
    title: "Large Multi-Digit Compensation",
    standard: "4.NBT.B.4",
    problem: "348 + 199 = ?",
    silentPrompt: {
      en: "Fist to chest: 199 is very close to what landmark number?",
      es: "Pulgar al pecho: ¿a qué número clave está extremadamente cerca el 199?"
    },
    noticeWonder: {
      en: [
        "199 is exactly 1 away from 200.",
        "Adding 200 to 348 can be done instantly mentally.",
        "Adjusting by 1 at the end gives the exact sum."
      ],
      es: [
        "199 está a exactamente 1 unidad de 200.",
        "Sumar 200 a 348 se hace mentalmente al instante.",
        "Ajustar restando 1 al final da la suma exacta."
      ]
    },
    strategies: [
      {
        student: "Sam",
        name: { en: "Add 200 & Compensate 1", es: "Sumar 200 y compensar 1" },
        steps: "348 + 200 = 548, then 548 − 1 = 547",
        explanation: {
          en: "Add 200 first, then subtract the 1 extra you added.",
          es: "Suma 200 primero y luego resta el 1 extra que agregaste."
        }
      },
      {
        student: "Maya",
        name: { en: "Shift 1 Unit (Give & Take)", es: "Trasladar 1 unidad" },
        steps: "(348 − 1) + (199 + 1) = 347 + 200 = 547",
        explanation: {
          en: "Take 1 from 348 and give it to 199 to make 347 + 200 = 547.",
          es: "Quita 1 de 348 y dáselo a 199 para formar 347 + 200 = 547."
        }
      },
      {
        student: "Tyrell",
        name: { en: "Expanded Form Partial Sums", es: "Sumas parciales por valor posicional" },
        steps: "300 + 100 = 400, 40 + 90 = 130, 8 + 9 = 17 → 400 + 130 + 17 = 547",
        explanation: {
          en: "Decompose by hundreds, tens, and ones: 400 + 130 + 17 = 547.",
          es: "Descompón en centenas, decenas y unidades: 400 + 130 + 17 = 547."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Compare Sam’s subtraction of 1 to Maya’s shifting of 1. How are they related?”",
        "“Why is mental compensation faster and less prone to slips than standard vertical addition here?”",
        "“How would this work for 456 + 298?”"
      ],
      es: [
        "«Compara la resta de 1 de Sam con el traslado de 1 de Maya. ¿En qué se parecen?»",
        "«¿Por qué la compensación mental es más rápida y segura que el algoritmo vertical aquí?»",
        "«¿Cómo funcionaría esto para 456 + 298?»"
      ]
    }
  },

  // Grade 5
  {
    id: "nt-g5-1",
    grade: 5,
    title: "Decimal Alignment & Benchmarks",
    standard: "5.NBT.B.7",
    problem: "2.4 + 1.85 = ?",
    silentPrompt: {
      en: "Fist to chest: be careful with place value columns! What does 2.4 really mean?",
      es: "Pulgar al pecho: ¡cuidado con las columnas posicionales! ¿Qué significa 2.4 en centésimas?"
    },
    noticeWonder: {
      en: [
        "2.4 has 4 tenths, which is 40 hundredths (2.40).",
        "1.85 is only 0.15 away from 2.00.",
        "The total will be between 4 and 5."
      ],
      es: [
        "2.4 tiene 4 décimas, que equivale a 40 centésimas (2.40).",
        "1.85 está a solo 0.15 de llegar a 2.00.",
        "El total estará entre 4 y 5."
      ]
    },
    strategies: [
      {
        student: "Maya",
        name: { en: "Align Columns (2.40 + 1.85)", es: "Alinear columnas (2.40 + 1.85)" },
        steps: "2.40 + 1.85 = (2 + 1) + (0.40 + 0.85) = 3 + 1.25 = 4.25",
        explanation: {
          en: "Write 2.4 as 2.40. Add wholes (3) and hundredths (1.25) to get 4.25.",
          es: "Escribe 2.4 como 2.40. Suma enteros (3) y centésimas (1.25) para obtener 4.25."
        }
      },
      {
        student: "Julian",
        name: { en: "Benchmark Compensation to 2.00", es: "Compensar al entero 2.00" },
        steps: "2.40 + 2.00 = 4.40, then 4.40 − 0.15 = 4.25",
        explanation: {
          en: "Round 1.85 up to 2.00, add to get 4.40, then subtract the 0.15 you added.",
          es: "Redondea 1.85 a 2.00, suma para obtener 4.40 y resta las 0.15 agregadas."
        }
      },
      {
        student: "Amara",
        name: { en: "Number Line Hops", es: "Saltos en la recta decimal" },
        steps: "2.4 + 1.0 = 3.4, 3.4 + 0.6 = 4.0, 4.0 + 0.25 = 4.25",
        explanation: {
          en: "Leap 1 to 3.4, bridge 0.6 to landmark 4.0, then add the last 0.25.",
          es: "Salta 1 hasta 3.4, suma 0.6 para llegar al 4.0 y agrega los 0.25 finales."
        }
      }
    ],
    teacherStems: {
      en: [
        "“What common misconception did Maya avoid by writing 2.40 instead of thinking 4 + 85 = 89?”",
        "“Where did Julian find the 0.15 in his compensation strategy?”",
        "“Why is thinking of money ($2.40 + $1.85) a helpful visual check?”"
      ],
      es: [
        "«¿Qué error común evitó Maya al escribir 2.40 en vez de pensar 4 + 85 = 89?»",
        "«¿De dónde sacó Julian el 0.15 en su compensación?»",
        "«¿Por qué pensar en dinero ($2.40 + $1.85) ayuda a verificar el resultado?»"
      ]
    }
  },
  {
    id: "nt-g5-2",
    grade: 5,
    title: "Multiplying by Decimals (Whole & Half)",
    standard: "5.NBT.B.7",
    problem: "12 × 1.5 = ?",
    silentPrompt: {
      en: "What does 1.5 mean in terms of whole groups and partial groups?",
      es: "¿Qué significa 1.5 en términos de grupos enteros y partes de grupo?"
    },
    noticeWonder: {
      en: [
        "1.5 is 1 and a half.",
        "12 is an even number with an easy half (6).",
        "The product will be larger than 12 but smaller than 24."
      ],
      es: [
        "1.5 es 1 entero y medio.",
        "12 es un número par con una mitad fácil (6).",
        "El producto será mayor que 12 pero menor que 24."
      ]
    },
    strategies: [
      {
        student: "Leo",
        name: { en: "One Group Plus Half a Group", es: "Un grupo más medio grupo" },
        steps: "(12 × 1) + (12 × 0.5) = 12 + 6 = 18",
        explanation: {
          en: "12 times 1 is 12. 12 times a half is 6. 12 + 6 = 18.",
          es: "12 por 1 es 12. 12 por un medio es 6. 12 + 6 = 18."
        }
      },
      {
        student: "Nora",
        name: { en: "Halve and Double", es: "Mitad y doble" },
        steps: "Halve 12 to 6, double 1.5 to 3: 6 × 3 = 18",
        explanation: {
          en: "Take half of 12 (6) and double 1.5 (3). 6 × 3 = 18.",
          es: "Saca la mitad de 12 (6) y duplica 1.5 (3). 6 × 3 = 18."
        }
      },
      {
        student: "Ethan",
        name: { en: "Improper Fraction Conversion", es: "Conversión a fracción impropia" },
        steps: "12 × (3/2) = (12 ÷ 2) × 3 = 6 × 3 = 18",
        explanation: {
          en: "1.5 is 3 halves. Divide 12 by 2 (6), then multiply by 3 = 18.",
          es: "1.5 es 3 medios. Divide 12 entre 2 (6) y multiplica por 3 = 18."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Nora’s halve-and-double move make the problem instant?”",
        "“How are Leo’s decomposition and Ethan’s fraction approach mathematically identical?”",
        "“How would you solve 14 × 1.5 using Leo’s method?”"
      ],
      es: [
        "«¿Por qué el método de mitad y doble de Nora resolvió el problema al instante?»",
        "«¿Cómo son matemáticamente idénticos el método de Leo y la fracción de Ethan?»",
        "«¿Cómo resolverías 14 × 1.5 usando el método de Leo?»"
      ]
    }
  },

  // Grade 6
  {
    id: "nt-g6-1",
    grade: 6,
    title: "Fraction Division Meaning",
    standard: "6.NS.A.1",
    problem: "3/4 ÷ 1/2 = ?",
    silentPrompt: {
      en: "Measurement division asks: 'How many halves fit inside three-fourths?'",
      es: "La división de medida pregunta: '¿Cuántos medios caben dentro de tres cuartos?'"
    },
    noticeWonder: {
      en: [
        "1/2 is equivalent to 2/4.",
        "3/4 is larger than 1/2, so the answer must be greater than 1.",
        "Inside 3/4, there is one full 1/2, plus half of another 1/2."
      ],
      es: [
        "1/2 equivale a 2/4.",
        "3/4 es mayor que 1/2, así que la respuesta debe ser mayor que 1.",
        "Dentro de 3/4 hay un 1/2 entero más la mitad de otro 1/2."
      ]
    },
    strategies: [
      {
        student: "Nia",
        name: { en: "Common Denominators Method", es: "Método de común denominador" },
        steps: "3/4 ÷ 2/4 = 3 ÷ 2 = 3/2 = 1 1/2",
        explanation: {
          en: "Rewrite with like denominators: 3 fourths divided by 2 fourths is 3 divided by 2 = 1 1/2.",
          es: "Reescribe con igual denominador: 3 cuartos entre 2 cuartos es 3 entre 2 = 1 1/2."
        }
      },
      {
        student: "Caleb",
        name: { en: "Visual Tape Diagram", es: "Diagrama de cinta visual" },
        steps: "1/2 = 2 fourths. 3 fourths has one full group of 2 fourths + 1 fourth left = 1 1/2",
        explanation: {
          en: "One full 1/2 takes 2 fourths. The 1 fourth left over is half of another 1/2 group.",
          es: "Un 1/2 completo usa 2 cuartos. El cuarto que sobra es la mitad de otro grupo de 1/2."
        }
      },
      {
        student: "Zoe",
        name: { en: "Multiply by the Reciprocal", es: "Multiplicar por el recíproco" },
        steps: "3/4 × 2/1 = 6/4 = 3/2 = 1 1/2",
        explanation: {
          en: "Dividing by 1/2 is identical to doubling (multiplying by 2/1). 3/4 × 2 = 6/4 = 1 1/2.",
          es: "Dividir entre 1/2 equivale a duplicar (por 2/1). 3/4 × 2 = 6/4 = 1 1/2."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is Nia’s common denominator strategy so intuitive?”",
        "“In Caleb’s diagram, why is the leftover piece worth 1/2 of a group instead of 1/4?”",
        "“Why does dividing by 1/2 make a number twice as big?”"
      ],
      es: [
        "«¿Por qué la estrategia de común denominador de Nia es tan intuitiva?»",
        "«En el diagrama de Caleb, ¿por qué la parte sobrante vale 1/2 de grupo en vez de 1/4?»",
        "«¿Por qué dividir entre 1/2 hace que un número sea el doble de grande?»"
      ]
    }
  },
  {
    id: "nt-g6-2",
    grade: 6,
    title: "Percent Benchmarks (10% & 50%)",
    standard: "6.RP.A.3",
    problem: "40% of 75 = ?",
    silentPrompt: {
      en: "Fist to chest: what easy benchmark percent can you find first?",
      es: "Pulgar al pecho: ¿qué porcentaje de referencia fácil puedes calcular primero?"
    },
    noticeWonder: {
      en: [
        "40% is four 10% chunks.",
        "40% is also 50% minus 10%.",
        "40% is equivalent to the simplified fraction 2/5."
      ],
      es: [
        "40% equivale a cuatro bloques de 10%.",
        "40% también es 50% menos 10%.",
        "40% equivale a la fracción simplificada 2/5."
      ]
    },
    strategies: [
      {
        student: "Diego",
        name: { en: "10% Building Block", es: "Bloque base del 10%" },
        steps: "10% of 75 = 7.5. Then 4 × 7.5 = 2 × 15 = 30",
        explanation: {
          en: "Find 10% by shifting decimal (7.5). Multiply by 4: double 7.5 is 15, double 15 is 30.",
          es: "Halla 10% corriendo el punto (7.5). Multiplica por 4: el doble de 7.5 es 15, el doble de 15 es 30."
        }
      },
      {
        student: "Mia",
        name: { en: "50% Minus 10%", es: "50% menos 10%" },
        steps: "50% of 75 = 37.5. 10% of 75 = 7.5. 37.5 − 7.5 = 30",
        explanation: {
          en: "Half of 75 is 37.5. Subtract 10% (7.5) to leave exactly 40% = 30.",
          es: "La mitad de 75 es 37.5. Resta el 10% (7.5) para obtener exactamente 40% = 30."
        }
      },
      {
        student: "Kai",
        name: { en: "Fraction Equivalent (2/5)", es: "Fracción equivalente (2/5)" },
        steps: "40% = 2/5. 75 ÷ 5 = 15, then 15 × 2 = 30",
        explanation: {
          en: "Divide 75 into 5 equal parts (15), then take 2 parts = 30.",
          es: "Divide 75 en 5 partes iguales (15) y toma 2 partes = 30."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Mia’s subtraction (37.5 − 7.5) come out so cleanly to a whole number?”",
        "“How can Diego’s 10% strategy be applied to find tips or sales tax in daily life?”",
        "“Which strategy would you use to calculate 60% of 75?”"
      ],
      es: [
        "«¿Por qué la resta de Mia (37.5 − 7.5) dio un número entero tan exacto?»",
        "«¿Cómo se puede aplicar la estrategia del 10% de Diego para calcular propinas o impuestos?»",
        "«¿Qué estrategia usarías para calcular el 60% de 75?»"
      ]
    }
  },

  // Grade 7
  {
    id: "nt-g7-1",
    grade: 7,
    title: "Subtracting Signed Integers",
    standard: "7.NS.A.1",
    problem: "−8 − (−12) = ?",
    silentPrompt: {
      en: "Fist to chest: think of subtraction as distance on a number line.",
      es: "Pulgar al pecho: piensa en la resta como la distancia en una recta numérica."
    },
    noticeWonder: {
      en: [
        "Both numbers are negative.",
        "Subtracting a negative means removing negative quantity.",
        "The distance from −12 up to −8 is positive."
      ],
      es: [
        "Ambos números son negativos.",
        "Restar un negativo significa quitar cantidad negativa.",
        "La distancia desde −12 hasta −8 es positiva."
      ]
    },
    strategies: [
      {
        student: "Lucas",
        name: { en: "Number Line Distance (From-To)", es: "Distancia en la recta (Desde-Hasta)" },
        steps: "Distance from −12 to −8: move right 4 units = +4",
        explanation: {
          en: "Subtraction asks: 'How far is it from −12 to −8?' Jump right 4 steps = +4.",
          es: "La resta pregunta: '¿Cuánto hay de −12 a −8?' Salta a la derecha 4 pasos = +4."
        }
      },
      {
        student: "Jade",
        name: { en: "Add the Opposite", es: "Sumar el opuesto" },
        steps: "−8 − (−12) = −8 + 12 = +4",
        explanation: {
          en: "Subtracting −12 is equivalent to adding its opposite (+12). 12 − 8 = 4.",
          es: "Restar −12 equivale a sumar su opuesto (+12). 12 − 8 = 4."
        }
      },
      {
        student: "Tomas",
        name: { en: "Zero Pair Counters", es: "Fichas de pares cero" },
        steps: "Start with 8 negatives. Add 4 zero pairs (+4, −4) to get 12 negatives. Remove 12 negatives: +4 remains.",
        explanation: {
          en: "To take away 12 negatives when you only have 8, introduce zero pairs. Taking 12 negatives away leaves 4 positives.",
          es: "Para quitar 12 negativos teniendo solo 8, agrega pares cero. Al quitar 12 negativos quedan 4 positivos."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why does removing cold air or debts leave you with a higher value?”",
        "“How does Tomas’s zero-pair model explain why Jade’s 'add the opposite' rule is true?”",
        "“Why is the answer positive 4 instead of negative 20?”"
      ],
      es: [
        "«¿Por qué quitar deuda o frío resulta en un valor más alto?»",
        "«¿Cómo explica el modelo de pares cero de Tomas por qué funciona la regla de Jade?»",
        "«¿Por qué el resultado es positivo 4 y no negativo 20?»"
      ]
    }
  },
  {
    id: "nt-g7-2",
    grade: 7,
    title: "Negative Times Negative Product",
    standard: "7.NS.A.2",
    problem: "−6 × (−4) = ?",
    silentPrompt: {
      en: "Why is a negative times a negative positive? What pattern proves it?",
      es: "¿Por qué un negativo por un negativo es positivo? ¿Qué patrón lo demuestra?"
    },
    noticeWonder: {
      en: [
        "6 × 4 = 24.",
        "6 × (−4) = −24.",
        "The negative sign in −6 means the opposite direction of −24."
      ],
      es: [
        "6 × 4 = 24.",
        "6 × (−4) = −24.",
        "El signo negativo en −6 indica la dirección opuesta a −24."
      ]
    },
    strategies: [
      {
        student: "Emma",
        name: { en: "Opposite of the Opposite", es: "El opuesto del opuesto" },
        steps: "6 × (−4) = −24. The opposite of −24 is −(−24) = +24",
        explanation: {
          en: "Think of −6 as −(6). 6 × (−4) is −24, and the opposite of that is +24.",
          es: "Piensa en −6 como el opuesto de 6. 6 × (−4) es −24, y su opuesto es +24."
        }
      },
      {
        student: "Liam",
        name: { en: "Distributive Property with Zero", es: "Propiedad distributiva con cero" },
        steps: "−6 × (4 + (−4)) = −6 × 0 = 0. Since (−6 × 4) + (−6 × −4) = 0, −24 + ? = 0 → ? = +24",
        explanation: {
          en: "Because multiplication must distribute, the product must cancel with −24 to equal 0.",
          es: "Como la multiplicación se distribuye, el producto debe cancelarse con −24 para dar 0."
        }
      },
      {
        student: "Ava",
        name: { en: "Pattern Countdown Sequence", es: "Secuencia de patrones" },
        steps: "2 × (−4) = −8, 1 × (−4) = −4, 0 × (−4) = 0, −1 × (−4) = +4 → continues up to +24",
        explanation: {
          en: "Each step back adds 4. Counting down past zero increases by 4 each time.",
          es: "Cada paso hacia atrás suma 4. Al pasar de cero hacia negativos, los valores aumentan de 4 en 4."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How does Ava’s pattern sequence prove mathematics never breaks its own rules?”",
        "“Why did Liam use zero pairs (4 + (−4)) to prove the sign?”",
        "“How would you explain why negative times negative is positive to a 5th grader?”"
      ],
      es: [
        "«¿Cómo demuestra la secuencia de Ava que las matemáticas nunca rompen sus propias reglas?»",
        "«¿Por qué Liam usó pares cero (4 + (−4)) para demostrar el signo?»",
        "«¿Cómo le explicarías a un estudiante de 5.º grado por qué negativo por negativo es positivo?»"
      ]
    }
  },

  // Grade 8
  {
    id: "nt-g8-1",
    grade: 8,
    title: "Algebraic Cover-Up & Inverse Steps",
    standard: "8.EE.C.7",
    problem: "3x + 12 = 36",
    silentPrompt: {
      en: "Fist to chest: cover up 3x with your thumb. What does that quantity have to be?",
      es: "Pulgar al pecho: tapa 3x con tu pulgar. ¿Qué valor tiene que tener esa cantidad?"
    },
    noticeWonder: {
      en: [
        "All terms (3, 12, 36) are divisible by 3.",
        "Something plus 12 equals 36.",
        "x must be a single positive value."
      ],
      es: [
        "Todos los términos (3, 12, 36) son divisibles entre 3.",
        "Algo más 12 es igual a 36.",
        "x debe ser un valor positivo único."
      ]
    },
    strategies: [
      {
        student: "Carlos",
        name: { en: "Cover-Up Reasoning", es: "Razonamiento de tapar la incógnita" },
        steps: "Cover 3x: [ ? ] + 12 = 36 → [ ? ] = 24. Since 3x = 24, x = 8",
        explanation: {
          en: "What plus 12 equals 36? 24! If 3 times x is 24, then x must be 8.",
          es: "¿Qué número más 12 da 36? ¡24! Si 3 por x es 24, entonces x debe ser 8."
        }
      },
      {
        student: "Harper",
        name: { en: "Balance Scale Inverse Operations", es: "Operaciones inversas en balanza" },
        steps: "Subtract 12 both sides: 3x = 24. Divide both sides by 3: x = 8",
        explanation: {
          en: "Keep the balance scale level: undo addition with subtraction, then undo multiplication with division.",
          es: "Mantén la balanza en equilibrio: deshaz la suma restando 12, luego divide entre 3: x = 8."
        }
      },
      {
        student: "Owen",
        name: { en: "Divide All Terms by 3 First", es: "Dividir todos los términos entre 3 primero" },
        steps: "(3x + 12) ÷ 3 = 36 ÷ 3 → x + 4 = 12 → x = 8",
        explanation: {
          en: "Notice 3, 12, and 36 are all multiples of 3. Divide every term by 3 to get x + 4 = 12, so x = 8.",
          es: "Nota que 3, 12 y 36 son múltiplos de 3. Divide todo entre 3 para obtener x + 4 = 12, así x = 8."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Owen’s decision to divide by 3 first work so smoothly?”",
        "“How does Harper’s balance scale method ensure you never make an algebra mistake?”",
        "“What would happen if you subtracted 12 from only one side of the equation?”"
      ],
      es: [
        "«¿Por qué la idea de Owen de dividir entre 3 primero funcionó tan bien?»",
        "«¿Cómo garantiza la balanza de Harper que nunca cometas un error de álgebra?»",
        "«¿Qué pasaría si restaras 12 solo de un lado de la ecuación?»"
      ]
    }
  },
  {
    id: "nt-g8-2",
    grade: 8,
    title: "Laws of Exponents (Repeated Factors)",
    standard: "8.EE.A.1",
    problem: "2⁵ × 2³ = ?",
    silentPrompt: {
      en: "What does an exponent truly represent? How many 2s are being multiplied?",
      es: "¿Qué representa realmente un exponente? ¿Cuántos factores 2 se están multiplicando?"
    },
    noticeWonder: {
      en: [
        "Both factors share the same base (2).",
        "2⁵ has five factors of 2.",
        "2³ has three factors of 2.",
        "We are multiplying them together, not adding them."
      ],
      es: [
        "Ambos factores comparten la misma base (2).",
        "2⁵ tiene cinco factores de 2.",
        "2³ tiene tres factores de 2.",
        "Se están multiplicando entre sí, no sumando."
      ]
    },
    strategies: [
      {
        student: "Maya",
        name: { en: "Expanded Form Factor Count", es: "Contar factores expandidos" },
        steps: "(2 × 2 × 2 × 2 × 2) × (2 × 2 × 2) = 8 factors of 2 = 2⁸ = 256",
        explanation: {
          en: "Write out all repeated factors. Count the total 2s: 5 + 3 = 8 factors = 2⁸.",
          es: "Escribe todos los factores repetidos. Cuenta los doses: 5 + 3 = 8 factores = 2⁸."
        }
      },
      {
        student: "Mason",
        name: { en: "Product of Powers Rule", es: "Regla del producto de potencias" },
        steps: "Same base: 2^(5 + 3) = 2⁸ = 256",
        explanation: {
          en: "When multiplying terms with identical bases, add the exponents: 5 + 3 = 8.",
          es: "Al multiplicar potencias de igual base, suma los exponentes: 5 + 3 = 8."
        }
      },
      {
        student: "Ruby",
        name: { en: "Evaluate Known Powers First", es: "Evaluar potencias conocidas" },
        steps: "2⁵ = 32 and 2³ = 8. Then 32 × 8 = (30 × 8) + (2 × 8) = 240 + 16 = 256",
        explanation: {
          en: "Compute known powers: 32 × 8. Use distributive splitting: 240 + 16 = 256.",
          es: "Calcula potencias conocidas: 32 × 8. Descompón: 240 + 16 = 256."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why do we add exponents when multiplying powers with the same base?”",
        "“What common mistake occurs if someone multiplies the bases (2 × 2 = 4)?”",
        "“How does Maya’s expanded form prove why Mason’s rule is always true?”"
      ],
      es: [
        "«¿Por qué sumamos los exponentes al multiplicar potencias de la misma base?»",
        "«¿Qué error común ocurre si alguien multiplica las bases (2 × 2 = 4)?»",
        "«¿Cómo demuestra la forma expandida de Maya por qué la regla de Mason siempre funciona?»"
      ]
    }
  },
  // Grade 1 additional routines
  {
    id: "nt-g1-3",
    grade: 1,
    title: "Make 10 & Near Doubles",
    standard: "1.OA.C.6",
    problem: "7 + 5 = ?",
    silentPrompt: {
      en: "Fist to chest: show a thumb when you have one way to combine 7 and 5.",
      es: "Pulgar al pecho: muestra un pulgar cuando tengas una forma de combinar 7 y 5."
    },
    noticeWonder: {
      en: [
        "7 is 3 away from 10.",
        "5 decomposes into 3 and 2.",
        "Both numbers are odd, so their sum must be even."
      ],
      es: [
        "Al 7 le faltan 3 para llegar a 10.",
        "El 5 se descompone en 3 y 2.",
        "Ambos números son impares, así que su suma es par."
      ]
    },
    strategies: [
      {
        student: "Carlos",
        name: { en: "Make a Friendly 10", es: "Formar un 10 amigable" },
        steps: "7 + 5 = 7 + (3 + 2) = 10 + 2 = 12",
        explanation: {
          en: "Take 3 from 5 to make 10 with 7, then add the 2 left over.",
          es: "Toma 3 del 5 para formar 10 con el 7, luego suma los 2 que sobran."
        }
      },
      {
        student: "Maya",
        name: { en: "Doubles Plus 2", es: "Dobles más 2" },
        steps: "5 + 5 = 10, then 10 + 2 = 12",
        explanation: {
          en: "Use known double 5 + 5 = 10, then add the remaining 2 from the 7.",
          es: "Usa el doble conocido 5 + 5 = 10 y luego añade los 2 que faltaban del 7."
        }
      },
      {
        student: "Liam",
        name: { en: "Count On on Number Line", es: "Contar hacia adelante en la recta" },
        steps: "Start at 7... +3 gives 10, +2 gives 12",
        explanation: {
          en: "Jump 3 to land on 10, then jump 2 more to land on 12.",
          es: "Salta 3 para caer en el 10, luego salta 2 más para llegar al 12."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How did Carlos and Maya both decompose a number to make friendly groups?”",
        "“Why is landing on 10 so helpful for mental math?”",
        "“Who used Liam’s number line jump strategy in their head?”"
      ],
      es: [
        "«¿Cómo descompusieron números Carlos y Maya para formar grupos amigables?»",
        "«¿Por qué llegar al 10 ayuda tanto en el cálculo mental?»",
        "«¿Quién usó la estrategia de saltos en la recta como Liam?»"
      ]
    }
  },
  {
    id: "nt-g1-4",
    grade: 1,
    title: "Subtracting Back Through 10",
    standard: "1.OA.B.4",
    problem: "13 − 5 = ?",
    silentPrompt: {
      en: "Fist to chest: how can breaking 5 apart help you subtract back to 10?",
      es: "Pulgar al pecho: ¿cómo descomponer el 5 te ayuda a restar pasando por el 10?"
    },
    noticeWonder: {
      en: [
        "13 is 3 more than 10.",
        "5 can be split into 3 and 2.",
        "Subtracting 3 first reaches an exact ten."
      ],
      es: [
        "13 es 3 más que 10.",
        "El 5 se separa en 3 y 2.",
        "Restar 3 primero nos lleva exactamente al diez."
      ]
    },
    strategies: [
      {
        student: "Noah",
        name: { en: "Subtract Back Through 10", es: "Restar pasando por el 10" },
        steps: "13 − 3 = 10, then 10 − 2 = 8",
        explanation: {
          en: "Remove 3 ones to reach 10, then take away the other 2 from 10.",
          es: "Quita 3 unidades para llegar al 10, luego quita las otras 2 del 10."
        }
      },
      {
        student: "Aaliyah",
        name: { en: "Think Addition (Missing Addend)", es: "Pensar en suma (sumando que falta)" },
        steps: "5 + ? = 13 → 5 + 5 = 10, 10 + 3 = 13, so 5 + 3 = 8",
        explanation: {
          en: "Ask: what adds to 5 to make 13? 5 + 8 = 13, so the answer is 8.",
          es: "Pregunta: ¿qué le sumo a 5 para llegar a 13? 5 + 8 = 13, así que es 8."
        }
      },
      {
        student: "Lucas",
        name: { en: "Over-Subtract & Compensate", es: "Restar de más y compensar" },
        steps: "13 − 10 = 3, then 3 + 5 = 8",
        explanation: {
          en: "Take away 10 instead of 5, then add back the 5 extra that were removed.",
          es: "Resta 10 en vez de 5 y luego vuelve a sumar los 5 que quitaste de más."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How does Noah's two-step jump connect to the ten-frame model?”",
        "“Why does thinking of addition help when subtraction feels tricky?”",
        "“What did Aaliyah see in common between 5 and 13?”"
      ],
      es: [
        "«¿Cómo se conecta el salto en dos pasos de Noah con el marco de diez?»",
        "«¿Por qué pensar en una suma ayuda cuando restar parece difícil?»",
        "«¿Qué relación vio Aaliyah entre el 5 y el 13?»"
      ]
    }
  },
  {
    id: "nt-g1-5",
    grade: 1,
    title: "Compensation & Near Doubles",
    standard: "1.OA.C.6",
    problem: "9 + 8 = ?",
    silentPrompt: {
      en: "Fist to chest: can you solve 9 + 8 without counting one by one?",
      es: "Pulgar al pecho: ¿puedes resolver 9 + 8 sin contar de uno en uno?"
    },
    noticeWonder: {
      en: [
        "9 is just 1 less than 10.",
        "8 and 9 are consecutive neighbors.",
        "It is very close to the double 8 + 8 or 9 + 9."
      ],
      es: [
        "9 es solo 1 menos que 10.",
        "8 y 9 son números vecinos consecutivos.",
        "Está muy cerca del doble 8 + 8 o 9 + 9."
      ]
    },
    strategies: [
      {
        student: "Zara",
        name: { en: "Make a 10 with 9", es: "Formar un 10 con el 9" },
        steps: "9 + 1 = 10, 8 − 1 = 7, so 10 + 7 = 17",
        explanation: {
          en: "Move 1 from the 8 over to the 9 to create 10 + 7 = 17.",
          es: "Pasa 1 del 8 al 9 para crear 10 + 7 = 17."
        }
      },
      {
        student: "Ethan",
        name: { en: "Doubles Plus 1", es: "Dobles más 1" },
        steps: "8 + 8 = 16, then 16 + 1 = 17",
        explanation: {
          en: "Use known double 8 + 8 = 16, then add 1 more since 9 is 8 + 1.",
          es: "Usa el doble 8 + 8 = 16 y suma 1 más porque 9 es 8 + 1."
        }
      },
      {
        student: "Mia",
        name: { en: "Doubles Minus 1", es: "Dobles menos 1" },
        steps: "9 + 9 = 18, then 18 − 1 = 17",
        explanation: {
          en: "Double the 9 to get 18, then subtract 1 because we only had 8.",
          es: "Duplica el 9 para obtener 18 y resta 1 porque solo teníamos 8."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How do Ethan and Mia use the same double concept from opposite directions?”",
        "“Why is Zara’s make-10 move so efficient when a 9 appears?”",
        "“Which strategy feels easiest to explain to a partner?”"
      ],
      es: [
        "«¿Cómo usan Ethan y Mia la idea del doble pero desde direcciones opuestas?»",
        "«¿Por qué el movimiento de Zara de formar 10 es tan rápido cuando hay un 9?»",
        "«¿Cuál estrategia te resulta más fácil de explicarle a tu compañero?»"
      ]
    }
  },
  // Grade 2 additional routines
  {
    id: "nt-g2-3",
    grade: 2,
    title: "Friendly 50 Compensation",
    standard: "2.NBT.B.5",
    problem: "48 + 37 = ?",
    silentPrompt: {
      en: "Fist to chest: what landmark number is 48 close to?",
      es: "Pulgar al pecho: ¿a qué número de referencia está cerca el 48?"
    },
    noticeWonder: {
      en: [
        "48 is only 2 away from 50.",
        "37 can easily give 2 to 48.",
        "50 plus any number is quick mental addition."
      ],
      es: [
        "48 está a solo 2 unidades de 50.",
        "El 37 puede prestarle 2 al 48 fácilmente.",
        "50 más cualquier número se suma mentalmente al instante."
      ]
    },
    strategies: [
      {
        student: "Ben",
        name: { en: "Give and Take (Compensation)", es: "Compensar / Dar y quitar" },
        steps: "(48 + 2) + (37 − 2) = 50 + 35 = 85",
        explanation: {
          en: "Shift 2 from 37 to 48 to turn it into 50 + 35 = 85.",
          es: "Pasa 2 del 37 al 48 para convertirlo en 50 + 35 = 85."
        }
      },
      {
        student: "Layla",
        name: { en: "Split Tens and Ones", es: "Separar decenas y unidades" },
        steps: "40 + 30 = 70, 8 + 7 = 15, then 70 + 15 = 85",
        explanation: {
          en: "Add the tens (40 + 30 = 70) and ones (8 + 7 = 15), then combine to get 85.",
          es: "Suma las decenas (40 + 30 = 70) y unidades (8 + 7 = 15), luego junta: 85."
        }
      },
      {
        student: "Owen",
        name: { en: "Add 50 and Subtract 2", es: "Sumar 50 y restar 2" },
        steps: "50 + 37 = 87, then 87 − 2 = 85",
        explanation: {
          en: "Treat 48 as 50 − 2. Add 50 + 37 = 87, then subtract the extra 2.",
          es: "Trata al 48 como 50 − 2. Suma 50 + 37 = 87 y resta el 2 de más."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why does shifting 2 not change the total sum in Ben’s method?”",
        "“How does Layla’s tens and ones decomposition make 8 + 7 easier?”",
        "“When would you choose Ben’s compensation over Owen’s over-addition?”"
      ],
      es: [
        "«¿Por qué mover 2 no cambia la suma total en el método de Ben?»",
        "«¿Cómo facilita la separación en decenas y unidades el cálculo de 8 + 7?»",
        "«¿Cuándo preferirías la compensación de Ben frente a sumar 50 de Owen?»"
      ]
    }
  },
  {
    id: "nt-g2-4",
    grade: 2,
    title: "Constant Difference (Shift Method)",
    standard: "2.NBT.B.5",
    problem: "73 − 28 = ?",
    silentPrompt: {
      en: "Fist to chest: can you make the number being subtracted end in 0?",
      es: "Pulgar al pecho: ¿puedes hacer que el número restado termine en 0?"
    },
    noticeWonder: {
      en: [
        "28 is 2 away from 30.",
        "Subtracting 30 is much easier than subtracting 28.",
        "The distance between two numbers stays identical if both shift by 2."
      ],
      es: [
        "28 está a 2 unidades de 30.",
        "Restar 30 es mucho más fácil que restar 28.",
        "La distancia entre dos números no cambia si ambos se desplazan 2 unidades."
      ]
    },
    strategies: [
      {
        student: "Amir",
        name: { en: "Constant Difference Shift", es: "Diferencia constante (desplazamiento)" },
        steps: "(73 + 2) − (28 + 2) = 75 − 30 = 45",
        explanation: {
          en: "Add 2 to both numbers. The difference between 75 and 30 is identical: 45.",
          es: "Suma 2 a ambos números. La diferencia entre 75 y 30 es idéntica: 45."
        }
      },
      {
        student: "Chloe",
        name: { en: "Add Up on Number Line", es: "Sumar hacia adelante en la recta" },
        steps: "28 + 2 = 30, 30 + 40 = 70, 70 + 3 = 73 → 2 + 40 + 3 = 45",
        explanation: {
          en: "Count up from 28 to 73 in friendly hops: +2 to 30, +40 to 70, +3 to 73.",
          es: "Avanza de 28 a 73 en saltos amigables: +2 a 30, +40 a 70, +3 a 73."
        }
      },
      {
        student: "Leo",
        name: { en: "Decompose Subtrahend", es: "Descomponer el sustraendo" },
        steps: "73 − 20 = 53, 53 − 3 = 50, 50 − 5 = 45",
        explanation: {
          en: "Subtract 20 first (53), then take away 3 to reach 50, then take 5 more.",
          es: "Resta 20 primero (53), luego quita 3 para llegar a 50 y quita 5 más."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is the difference between 75 and 30 exactly the same as 73 and 28?”",
        "“How does Chloe’s adding-up strategy remove the need for borrowing?”",
        "“Which strategy would you use if the problem were 84 − 39?”"
      ],
      es: [
        "«¿Por qué la distancia entre 75 y 30 es exactamente la misma que entre 73 y 28?»",
        "«¿Cómo elimina la estrategia de Chloe la necesidad de reagrupar/pedir prestado?»",
        "«¿Qué estrategia usarías si el problema fuera 84 − 39?»"
      ]
    }
  },
  {
    id: "nt-g2-5",
    grade: 2,
    title: "Quarters & Landmark 25s",
    standard: "2.NBT.B.6",
    problem: "25 + 26 + 25 + 24 = ?",
    silentPrompt: {
      en: "Fist to chest: look for benchmark numbers or friendly pairs.",
      es: "Pulgar al pecho: busca números de referencia o parejas amigables."
    },
    noticeWonder: {
      en: [
        "There are four addends all close to 25.",
        "26 is 1 more than 25, while 24 is 1 less.",
        "Four quarters make 100."
      ],
      es: [
        "Hay cuatro sumandos todos cercanos a 25.",
        "26 es 1 más que 25, y 24 es 1 menos.",
        "Cuatro monedas de 25 centavos forman 100."
      ]
    },
    strategies: [
      {
        student: "Daniel",
        name: { en: "Balance to Four 25s", es: "Equilibrar a cuatro 25s" },
        steps: "Move 1 from 26 to 24 → 25 + 25 + 25 + 25 = 100",
        explanation: {
          en: "Take 1 from 26 and give it to 24. Now you have 4 groups of 25 = 100.",
          es: "Quita 1 al 26 y dáselo al 24. Ahora tienes 4 grupos de 25 = 100."
        }
      },
      {
        student: "Harper",
        name: { en: "Pair into 50s", es: "Emparejar en 50s" },
        steps: "(25 + 25 = 50) and (26 + 24 = 50) → 50 + 50 = 100",
        explanation: {
          en: "Group the two 25s together (50), and pair 26 with 24 (50). 50 + 50 = 100.",
          es: "Agrupa los dos 25 juntos (50), y junta 26 con 24 (50). 50 + 50 = 100."
        }
      },
      {
        student: "Sam",
        name: { en: "Add Tens then Ones", es: "Sumar decenas y luego unidades" },
        steps: "20 × 4 = 80, 5 + 6 + 5 + 4 = 20 → 80 + 20 = 100",
        explanation: {
          en: "Add the four tens (80), then sum 5 + 6 + 5 + 4 = 20. 80 + 20 = 100.",
          es: "Suma las cuatro decenas (80) y luego las unidades (20). 80 + 20 = 100."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How does Daniel’s balance method connect to money and coins?”",
        "“What property of addition allows Harper to reorder the terms?”",
        "“Which approach helped you see 100 the fastest?”"
      ],
      es: [
        "«¿Cómo se conecta el método de Daniel con las monedas de 25 centavos?»",
        "«¿Qué propiedad de la suma le permite a Harper cambiar el orden de los números?»",
        "«¿Qué método te hizo ver el 100 más rápidamente?»"
      ]
    }
  },
  // Grade 3 additional routines
  {
    id: "nt-g3-3",
    grade: 3,
    title: "Ten Times Minus One Group",
    standard: "3.OA.B.5",
    problem: "9 × 7 = ?",
    silentPrompt: {
      en: "Fist to chest: how can multiplying by 10 help you find 9 times 7?",
      es: "Pulgar al pecho: ¿cómo multiplicar por 10 te ayuda a encontrar 9 por 7?"
    },
    noticeWonder: {
      en: [
        "9 groups is 1 less group than 10 groups.",
        "Multiplying by 10 is easy: 10 × 7 = 70.",
        "Subtracting one group of 7 gives the answer."
      ],
      es: [
        "9 grupos es 1 grupo menos que 10 grupos.",
        "Multiplicar por 10 es fácil: 10 × 7 = 70.",
        "Restar un grupo de 7 nos da la respuesta exacta."
      ]
    },
    strategies: [
      {
        student: "Priya",
        name: { en: "10 Groups Minus 1 Group", es: "10 grupos menos 1 grupo" },
        steps: "10 × 7 = 70, then 70 − 7 = 63",
        explanation: {
          en: "Find 10 groups of 7 (70), then remove 1 group of 7 to get 63.",
          es: "Calcula 10 grupos de 7 (70) y resta 1 grupo de 7 para obtener 63."
        }
      },
      {
        student: "Julian",
        name: { en: "Split into 5s and 4s", es: "Separar en 5s y 4s" },
        steps: "(5 × 7 = 35) + (4 × 7 = 28) → 35 + 28 = 63",
        explanation: {
          en: "Decompose 9 into 5 + 4. Multiply 5 × 7 = 35 and 4 × 7 = 28, then sum.",
          es: "Descompón 9 en 5 + 4. Multiplica 5 × 7 = 35 y 4 × 7 = 28, luego suma: 63."
        }
      },
      {
        student: "Grace",
        name: { en: "Nines Digit Pattern", es: "Patrón de los dígitos del 9" },
        steps: "Tens digit is 7 − 1 = 6; ones digit is 9 − 6 = 3 → 63",
        explanation: {
          en: "In the 9s table, the digits sum to 9 (6 + 3 = 9) and tens is 7 − 1 = 6.",
          es: "En la tabla del 9, los dígitos suman 9 (6 + 3 = 9) y las decenas son 7 − 1 = 6."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is Priya’s strategy an example of the distributive property: (10 − 1) × 7?”",
        "“How can Julian’s split strategy work for ANY multiplication fact?”",
        "“Which way would you teach to a second grader learning facts?”"
      ],
      es: [
        "«¿Por qué la estrategia de Priya es un ejemplo de la propiedad distributiva: (10 − 1) × 7?»",
        "«¿Cómo sirve la descomposición de Julian para CUALQUIER tabla de multiplicar?»",
        "«¿Cuál método le enseñarías a un estudiante más pequeño?»"
      ]
    }
  },
  {
    id: "nt-g3-4",
    grade: 3,
    title: "Double and Double Again",
    standard: "3.OA.B.5",
    problem: "16 × 4 = ?",
    silentPrompt: {
      en: "Fist to chest: how can multiplying by 4 be thought of as two doubles?",
      es: "Pulgar al pecho: ¿cómo multiplicar por 4 puede verse como dos dobles?"
    },
    noticeWonder: {
      en: [
        "4 is 2 × 2.",
        "Doubling a number twice is the same as multiplying by 4.",
        "16 can also be decomposed into 10 and 6."
      ],
      es: [
        "4 es 2 × 2.",
        "Duplicar dos veces es lo mismo que multiplicar por 4.",
        "16 también se descompone fácilmente en 10 y 6."
      ]
    },
    strategies: [
      {
        student: "Zion",
        name: { en: "Double-Double", es: "Doble y luego doble" },
        steps: "Double 16 = 32, double 32 = 64",
        explanation: {
          en: "Since 4 = 2 × 2, double 16 once to get 32, then double 32 to get 64.",
          es: "Como 4 = 2 × 2, duplica 16 una vez (32) y luego duplica 32 para llegar a 64."
        }
      },
      {
        student: "Emma",
        name: { en: "Distribute by Place Value", es: "Distribuir por valor posicional" },
        steps: "(10 × 4 = 40) + (6 × 4 = 24) → 40 + 24 = 64",
        explanation: {
          en: "Break 16 into 10 + 6. Multiply 10 × 4 = 40 and 6 × 4 = 24, then add.",
          es: "Separa 16 en 10 + 6. Multiplica 10 × 4 = 40 y 6 × 4 = 24, luego suma."
        }
      },
      {
        student: "Kai",
        name: { en: "Double and Halve", es: "Duplicar y dividir a la mitad" },
        steps: "(16 ÷ 2) × (4 × 2) = 8 × 8 = 64",
        explanation: {
          en: "Halve 16 to 8 and double 4 to 8. Known square fact: 8 × 8 = 64.",
          es: "Divide 16 entre 2 (8) y duplica 4 (8). Hecho conocido: 8 × 8 = 64."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Kai’s double-and-halve strategy turn the problem into a perfect square?”",
        "“How do Zion and Emma show that breaking factors apart preserves the area?”",
        "“Which strategy is fastest when one factor is a multiple of 4?”"
      ],
      es: [
        "«¿Por qué el método de Kai convirtió el problema en un cuadrado perfecto (8 × 8)?»",
        "«¿Cómo demuestran Zion y Emma que descomponer factores conserva el área?»",
        "«¿Cuál estrategia es más rápida cuando un factor es múltiplo de 4?»"
      ]
    }
  },
  {
    id: "nt-g3-5",
    grade: 3,
    title: "Think Multiplication for Division",
    standard: "3.OA.B.6",
    problem: "48 ÷ 6 = ?",
    silentPrompt: {
      en: "Fist to chest: what multiplication fact connects 6 to 48?",
      es: "Pulgar al pecho: ¿qué hecho de multiplicación conecta el 6 con el 48?"
    },
    noticeWonder: {
      en: [
        "48 is an even number.",
        "6 × 5 = 30 is a helpful landmark.",
        "We need to find how many groups of 6 make 48."
      ],
      es: [
        "48 es un número par.",
        "6 × 5 = 30 es un punto de referencia muy útil.",
        "Buscamos cuántos grupos de 6 forman 48."
      ]
    },
    strategies: [
      {
        student: "Maya",
        name: { en: "Missing Factor", es: "Factor desconocido" },
        steps: "6 × ? = 48 → 6 × 8 = 48, so 48 ÷ 6 = 8",
        explanation: {
          en: "Think of division as finding the missing dimension of a 6 by ? rectangle.",
          es: "Piensa en la división como buscar la dimensión que falta en un rectángulo de 6 por ?."
        }
      },
      {
        student: "Elijah",
        name: { en: "Chunking with Friendly 5s", es: "Partición con el 5 amigable" },
        steps: "6 × 5 = 30, remaining 48 − 30 = 18. 6 × 3 = 18. 5 + 3 = 8",
        explanation: {
          en: "Take out 5 groups of 6 (30). 18 is left, which is 3 groups of 6. Total = 8.",
          es: "Toma 5 grupos de 6 (30). Quedan 18, que son 3 grupos de 6. Total = 8."
        }
      },
      {
        student: "Camila",
        name: { en: "Halve Both Numbers", es: "Dividir ambos entre 2" },
        steps: "48 ÷ 6 = 24 ÷ 3 = 8",
        explanation: {
          en: "Halve both the dividend (24) and divisor (3). 24 ÷ 3 = 8.",
          es: "Saca la mitad al dividendo (24) y al divisor (3). 24 ÷ 3 = 8."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Camila’s trick of halving both numbers give the exact same answer?”",
        "“How does Elijah’s chunking prepare us for long division in 4th grade?”",
        "“Who can restate the inverse connection between multiplication and division?”"
      ],
      es: [
        "«¿Por qué el truco de Camila de sacar la mitad a ambos dio exactamente el mismo resultado?»",
        "«¿Cómo prepara el método de partes de Elijah para la división larga en 4.° grado?»",
        "«¿Quién puede explicar la relación inversa entre multiplicar y dividir?»"
      ]
    }
  },
  // Grade 4 additional routines
  {
    id: "nt-g4-3",
    grade: 4,
    title: "Double and Halve with Quarters",
    standard: "4.NBT.B.5",
    problem: "25 × 16 = ?",
    silentPrompt: {
      en: "Fist to chest: can you make one of the factors into 100?",
      es: "Pulgar al pecho: ¿puedes transformar uno de los factores en 100?"
    },
    noticeWonder: {
      en: [
        "25 multiplied by 4 equals 100.",
        "16 is 4 × 4.",
        "Four quarters equal 1 dollar ($1.00)."
      ],
      es: [
        "25 multiplicado por 4 es 100.",
        "16 es 4 × 4.",
        "Cuatro monedas de 25 centavos equivalen a 1 dólar ($1.00)."
      ]
    },
    strategies: [
      {
        student: "Gabe",
        name: { en: "Factor Out 4 to Make 100", es: "Factorizar 4 para formar 100" },
        steps: "25 × (4 × 4) = (25 × 4) × 4 = 100 × 4 = 400",
        explanation: {
          en: "Split 16 into 4 × 4. Combine 25 × 4 to get 100, then 100 × 4 = 400.",
          es: "Separa 16 en 4 × 4. Junta 25 × 4 para formar 100, luego 100 × 4 = 400."
        }
      },
      {
        student: "Elena",
        name: { en: "Double and Halve Twice", es: "Duplicar y dividir a la mitad dos veces" },
        steps: "25 × 16 = 50 × 8 = 100 × 4 = 400",
        explanation: {
          en: "Double 25 (50) and halve 16 (8). Double 50 (100) and halve 8 (4). 100 × 4 = 400.",
          es: "Duplica 25 (50) y saca mitad a 16 (8). Vuelve a duplicar (100) y mitad (4) = 400."
        }
      },
      {
        student: "Marcus",
        name: { en: "Area Model Decomposition", es: "Descomposición en modelo de área" },
        steps: "25 × 10 = 250, 25 × 6 = 150 → 250 + 150 = 400",
        explanation: {
          en: "Split 16 into 10 + 6. 25 × 10 = 250 and 25 × 6 = 150. Sum is 400.",
          es: "Separa 16 en 10 + 6. 25 × 10 = 250 y 25 × 6 = 150. La suma es 400."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Elena’s double-and-halve strategy keep the total area identical?”",
        "“How is Gabe’s method like counting quarters in money?”",
        "“Which strategy would you use to solve 25 × 28?”"
      ],
      es: [
        "«¿Por qué la estrategia de duplicar y sacar mitad de Elena mantuvo el área idéntica?»",
        "«¿Cómo se parece el método de Gabe a contar monedas de 25 centavos?»",
        "«¿Qué estrategia usarías para resolver 25 × 28?»"
      ]
    }
  },
  {
    id: "nt-g4-4",
    grade: 4,
    title: "Fraction Unit Iteration",
    standard: "4.NF.B.3",
    problem: "3/8 + 4/8 = ?",
    silentPrompt: {
      en: "Fist to chest: what unit are we counting when we add eighths?",
      es: "Pulgar al pecho: ¿qué unidad estamos contando al sumar octavos?"
    },
    noticeWonder: {
      en: [
        "Both fractions share the same denominator (eighths).",
        "3 eighths and 4 eighths can be counted like objects.",
        "The sum is only 1 eighth away from 1 whole (8/8)."
      ],
      es: [
        "Ambas fracciones tienen el mismo denominador (octavos).",
        "3 octavos y 4 octavos se pueden contar como objetos.",
        "La suma está a solo 1 octavo de formar 1 entero (8/8)."
      ]
    },
    strategies: [
      {
        student: "Siddharth",
        name: { en: "Count the Unit Fractions", es: "Contar fracciones unitarias" },
        steps: "(3 × 1/8) + (4 × 1/8) = (3 + 4) × 1/8 = 7/8",
        explanation: {
          en: "Think of 1/8 as the unit. 3 of that unit plus 4 of that unit is 7 of that unit (7/8).",
          es: "Piensa en 1/8 como la unidad. 3 unidades más 4 unidades son 7 unidades (7/8)."
        }
      },
      {
        student: "Isabella",
        name: { en: "Distance to 1 Whole", es: "Distancia al entero" },
        steps: "4/8 is 1/2. 3/8 more leaves only 1/8 until 8/8 (1 whole) → 7/8",
        explanation: {
          en: "Use benchmark 1/2 (4/8). Add 3/8 to reach 7/8, noticing only 1/8 remains.",
          es: "Usa el punto de referencia 1/2 (4/8). Suma 3/8 para llegar a 7/8, a 1/8 del entero."
        }
      },
      {
        student: "Tyler",
        name: { en: "Number Line Jump", es: "Salto en la recta numérica" },
        steps: "Start at 3/8, jump 4 eighths forward: 4/8, 5/8, 6/8, 7/8",
        explanation: {
          en: "Walk forward on an eighths number line from 3/8 to 7/8.",
          es: "Avanza en una recta dividida en octavos desde 3/8 hasta 7/8."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did the denominator (8) stay 8 instead of becoming 16?”",
        "“How does Siddharth’s unit-counting explain why we only add numerators?”",
        "“What visual model would you draw to prove 7/8 is correct?”"
      ],
      es: [
        "«¿Por qué el denominador (8) se mantuvo en 8 en lugar de sumar a 16?»",
        "«¿Cómo explica el conteo de unidades de Siddharth por qué solo sumamos los numeradores?»",
        "«¿Qué modelo visual dibujarías para demostrar que 7/8 es correcto?»"
      ]
    }
  },
  {
    id: "nt-g4-5",
    grade: 4,
    title: "Over-Multiply by 100 & Compensate",
    standard: "4.NBT.B.5",
    problem: "99 × 6 = ?",
    silentPrompt: {
      en: "Fist to chest: what landmark number is 99 very close to?",
      es: "Pulgar al pecho: ¿a qué número de referencia está muy cerca el 99?"
    },
    noticeWonder: {
      en: [
        "99 is 1 less than 100.",
        "100 × 6 is very easy to calculate (600).",
        "We have 1 extra group of 6 that must be subtracted."
      ],
      es: [
        "99 es 1 menos que 100.",
        "100 × 6 es muy fácil de calcular (600).",
        "Tenemos 1 grupo extra de 6 que debemos restar."
      ]
    },
    strategies: [
      {
        student: "Hannah",
        name: { en: "100 Times Minus 1 Group", es: "100 veces menos 1 grupo" },
        steps: "(100 × 6) − (1 × 6) = 600 − 6 = 594",
        explanation: {
          en: "Calculate 100 groups of 6 (600), then subtract the 1 extra group of 6 to get 594.",
          es: "Calcula 100 grupos de 6 (600) y resta el grupo extra de 6: 594."
        }
      },
      {
        student: "Victor",
        name: { en: "Expanded Place Value", es: "Valor posicional expandido" },
        steps: "(90 × 6 = 540) + (9 × 6 = 54) → 540 + 54 = 594",
        explanation: {
          en: "Split 99 into 90 + 9. 90 × 6 = 540 and 9 × 6 = 54. 540 + 54 = 594.",
          es: "Separa 99 en 90 + 9. 90 × 6 = 540 y 9 × 6 = 54. 540 + 54 = 594."
        }
      },
      {
        student: "Aria",
        name: { en: "Half of 99 × 12", es: "Mitad de 99 × 12" },
        steps: "99 × 6 = (100 − 1) × 6 = 600 − 6 = 594",
        explanation: {
          en: "Think algebraically: (100 − 1) × 6 = 600 − 6 = 594.",
          es: "Pensamiento algebraico: (100 − 1) × 6 = 600 − 6 = 594."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is Hannah’s subtraction of 6 so much faster than traditional vertical columns?”",
        "“How do Hannah and Victor both arrive at 594 using different representations?”",
        "“How would you apply Hannah’s method to solve 99 × 8?”"
      ],
      es: [
        "«¿Por qué restar 6 como Hannah es mucho más veloz que el algoritmo tradicional en columnas?»",
        "«¿Cómo llegan Hannah y Victor a 594 usando representaciones distintas?»",
        "«¿Cómo aplicarías el método de Hannah para resolver 99 × 8?»"
      ]
    }
  },
  // Grade 5 additional routines
  {
    id: "nt-g5-3",
    grade: 5,
    title: "Double and Halve with Decimals",
    standard: "5.NBT.B.7",
    problem: "3.5 × 14 = ?",
    silentPrompt: {
      en: "Fist to chest: how can doubling 3.5 eliminate the decimal entirely?",
      es: "Pulgar al pecho: ¿cómo duplicar 3.5 elimina el decimal por completo?"
    },
    noticeWonder: {
      en: [
        "3.5 doubled is a whole number (7).",
        "14 is an even number that can be halved to 7.",
        "The problem transforms into a basic fact: 7 × 7!"
      ],
      es: [
        "El doble de 3.5 es un número entero (7).",
        "14 es un número par cuya mitad es 7.",
        "¡El problema se convierte en un hecho básico: 7 × 7!"
      ]
    },
    strategies: [
      {
        student: "Lucas",
        name: { en: "Double and Halve", es: "Duplicar y sacar mitad" },
        steps: "(3.5 × 2) × (14 ÷ 2) = 7 × 7 = 49",
        explanation: {
          en: "Double 3.5 to get whole number 7, and halve 14 to get 7. 7 × 7 = 49.",
          es: "Duplica 3.5 para obtener el entero 7 y saca mitad a 14 (7). 7 × 7 = 49."
        }
      },
      {
        student: "Kendra",
        name: { en: "Decompose Decimals", es: "Descomponer decimales" },
        steps: "(3 × 14 = 42) + (0.5 × 14 = 7) → 42 + 7 = 49",
        explanation: {
          en: "Multiply 3 × 14 = 42, and half of 14 is 7. 42 + 7 = 49.",
          es: "Multiplica 3 × 14 = 42, y la mitad de 14 es 7. 42 + 7 = 49."
        }
      },
      {
        student: "Julian",
        name: { en: "Scale by 10 and Adjust", es: "Escalar por 10 y ajustar" },
        steps: "35 × 14 = 35 × (10 + 4) = 350 + 140 = 490. Then 490 ÷ 10 = 49",
        explanation: {
          en: "Multiply as integers (35 × 14 = 490), then shift place value back one tenth: 49.",
          es: "Multiplica como enteros (35 × 14 = 490) y luego ajusta un décimo: 49."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did doubling one factor and halving the other keep the product identical?”",
        "“How does Kendra’s 'half of 14' strategy connect to the meaning of 0.5?”",
        "“Which strategy would you use for 4.5 × 18?”"
      ],
      es: [
        "«¿Por qué duplicar un factor y reducir a la mitad el otro mantiene el producto idéntico?»",
        "«¿Cómo se conecta la 'mitad de 14' de Kendra con el significado de 0.5?»",
        "«¿Qué estrategia usarías para 4.5 × 18?»"
      ]
    }
  },
  {
    id: "nt-g5-4",
    grade: 5,
    title: "Whole Number Divided by Unit Fraction",
    standard: "5.NF.B.7",
    problem: "5 ÷ 1/4 = ?",
    silentPrompt: {
      en: "Fist to chest: interpret this as 'How many one-fourths fit inside 5 wholes?'",
      es: "Pulgar al pecho: interprétalo como '¿Cuántos cuartos caben dentro de 5 enteros?'"
    },
    noticeWonder: {
      en: [
        "There are 4 fourths in each single whole.",
        "Dividing by a fraction smaller than 1 makes the answer GREATER than 5.",
        "Each of the 5 wholes contributes 4 pieces."
      ],
      es: [
        "Hay 4 cuartos en cada entero individual.",
        "Dividir entre una fracción menor que 1 hace que la respuesta sea MAYOR que 5.",
        "Cada uno de los 5 enteros aporta 4 pedazos."
      ]
    },
    strategies: [
      {
        student: "Naomi",
        name: { en: "Measurement Model (Pieces per Whole)", es: "Modelo de medida (piezas por entero)" },
        steps: "Each whole has 4 fourths. 5 wholes × 4 fourths = 20 fourths",
        explanation: {
          en: "In 1 whole there are 4 quarters. In 5 wholes there are 5 × 4 = 20 quarters.",
          es: "En 1 entero hay 4 cuartos. En 5 enteros hay 5 × 4 = 20 cuartos."
        }
      },
      {
        student: "Jackson",
        name: { en: "Multiply by Reciprocal", es: "Multiplicar por el recíproco" },
        steps: "5 ÷ (1/4) = 5 × (4/1) = 20",
        explanation: {
          en: "Dividing by 1/4 is mathematically equivalent to multiplying by its reciprocal 4.",
          es: "Dividir entre 1/4 es matemáticamente equivalente a multiplicar por su recíproco 4."
        }
      },
      {
        student: "Zoe",
        name: { en: "Number Line Hops", es: "Saltos en la recta numérica" },
        steps: "0 to 1 has 4 jumps of 1/4. To get to 5: 5 × 4 jumps = 20 jumps",
        explanation: {
          en: "Draw jumps of size 1/4 along a number line from 0 to 5. There are 20 hops.",
          es: "Da saltos de tamaño 1/4 en la recta desde 0 hasta 5. Son 20 saltos en total."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is the quotient (20) bigger than the starting number (5)?”",
        "“How does Naomi’s pizza slice visualization explain Jackson’s reciprocal rule?”",
        "“How would you describe 6 ÷ 1/3 using the same language?”"
      ],
      es: [
        "«¿Por qué el cociente (20) es más grande que el número inicial (5)?»",
        "«¿Cómo explica el modelo de rebanadas de Naomi la regla del recíproco de Jackson?»",
        "«¿Cómo describirías 6 ÷ 1/3 usando este mismo lenguaje?»"
      ]
    }
  },
  {
    id: "nt-g5-5",
    grade: 5,
    title: "Clock Face & Common Denominators",
    standard: "5.NF.A.1",
    problem: "1 1/4 − 2/3 = ?",
    silentPrompt: {
      en: "Fist to chest: can you think of a clock face where 1/4 and 1/3 have natural minute values?",
      es: "Pulgar al pecho: ¿puedes pensar en un reloj donde 1/4 y 1/3 tienen valores en minutos?"
    },
    noticeWonder: {
      en: [
        "12 is a common multiple of 4 and 3.",
        "On a clock, 1/4 hour is 15 minutes and 1/3 hour is 20 minutes.",
        "1 1/4 is 5/4 or 75 minutes."
      ],
      es: [
        "12 es un múltiplo común de 4 y 3.",
        "En un reloj, 1/4 de hora son 15 minutos y 1/3 de hora son 20 minutos.",
        "1 1/4 son 5/4 o 75 minutos."
      ]
    },
    strategies: [
      {
        student: "Andre",
        name: { en: "Clock Minute Model (Twelfths)", es: "Modelo de reloj (doceavos)" },
        steps: "1 hr 15 min (75 min) − 40 min (2/3 hr) = 35 min = 35/60 = 7/12",
        explanation: {
          en: "Convert to minutes: 1 1/4 hr = 75 min. 2/3 hr = 40 min. 75 − 40 = 35 min = 7/12 hr.",
          es: "Pasa a minutos: 1 1/4 h = 75 min. 2/3 h = 40 min. 75 − 40 = 35 min = 7/12 h."
        }
      },
      {
        student: "Chloe",
        name: { en: "Common Denominator 12ths", es: "Denominador común 12avos" },
        steps: "1 3/12 − 8/12 = 15/12 − 8/12 = 7/12",
        explanation: {
          en: "Convert to 12ths: 1 3/12 becomes 15/12. Subtract 8/12 to leave 7/12.",
          es: "Convierte a 12avos: 1 3/12 se convierte en 15/12. Resta 8/12 para dejar 7/12."
        }
      },
      {
        student: "Liam",
        name: { en: "Subtract Through 1 Whole", es: "Restar pasando por el entero" },
        steps: "(1 − 2/3 = 1/3) + 1/4 = 4/12 + 3/12 = 7/12",
        explanation: {
          en: "Subtract 2/3 from the 1 whole to leave 1/3. Then add the extra 1/4: 1/3 + 1/4 = 7/12.",
          es: "Resta 2/3 al entero 1 para dejar 1/3. Luego suma el 1/4 restante: 4/12 + 3/12 = 7/12."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is the clock face such an intuitive model for twelfths?”",
        "“How does Liam’s subtraction through 1 simplify regrouping fractions?”",
        "“Can someone explain Chloe’s fraction conversion in their own words?”"
      ],
      es: [
        "«¿Por qué el reloj es un modelo tan intuitivo para los doceavos?»",
        "«¿Cómo simplifica la resta de Liam pasando por el 1 la reagrupación de fracciones?»",
        "«¿Quién puede explicar la conversión de fracciones de Chloe en sus propias palabras?»"
      ]
    }
  },
  // Grade 6 additional routines
  {
    id: "nt-g6-3",
    grade: 6,
    title: "Benchmark Percents (10% and 5%)",
    standard: "6.RP.A.3.c",
    problem: "15% of 80 = ?",
    silentPrompt: {
      en: "Fist to chest: what is 10% of 80, and how does that give you 5%?",
      es: "Pulgar al pecho: ¿cuánto es el 10% de 80 y cómo eso te da el 5%?"
    },
    noticeWonder: {
      en: [
        "10% of any number is found by shifting place value one position left (÷ 10).",
        "5% is exactly half of 10%.",
        "15% is simply 10% + 5%."
      ],
      es: [
        "El 10% de cualquier número se halla moviendo el punto decimal un lugar (÷ 10).",
        "El 5% es exactamente la mitad del 10%.",
        "El 15% es simplemente 10% + 5%."
      ]
    },
    strategies: [
      {
        student: "Jasmine",
        name: { en: "10% + Half of 10%", es: "10% + mitad del 10%" },
        steps: "10% of 80 = 8. 5% is half of 8 = 4. 8 + 4 = 12",
        explanation: {
          en: "Find 10% (8), then take half for 5% (4). Sum them to find 15%: 8 + 4 = 12.",
          es: "Halla el 10% (8) y la mitad para el 5% (4). Suma ambos para el 15%: 8 + 4 = 12."
        }
      },
      {
        student: "Mateo",
        name: { en: "Fraction Equivalent (3/20)", es: "Fracción equivalente (3/20)" },
        steps: "15% = 15/100 = 3/20. (80 ÷ 20) × 3 = 4 × 3 = 12",
        explanation: {
          en: "Simplify 15% to 3/20. 80 divided into 20 parts is 4. 3 of those parts is 12.",
          es: "Simplifica 15% a 3/20. 80 dividido en 20 partes da 4. 3 de esas partes son 12."
        }
      },
      {
        student: "Sophie",
        name: { en: "1% Unit Rate", es: "Tasa unitaria del 1%" },
        steps: "1% of 80 = 0.8. 15 × 0.8 = 15 × 8 ÷ 10 = 120 ÷ 10 = 12",
        explanation: {
          en: "Find 1% (0.8), then scale up by 15: 15 × 0.8 = 12.",
          es: "Halla el 1% (0.8) y escala por 15: 15 × 0.8 = 12."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is the 10% + 5% benchmark strategy so popular in real-world tipping?”",
        "“How do Jasmine’s mental chunks relate to Mateo’s simplified fraction 3/20?”",
        "“How would you quickly calculate a 20% tip on $80 using these ideas?”"
      ],
      es: [
        "«¿Por qué la estrategia del 10% + 5% se usa tanto en propinas de la vida real?»",
        "«¿Cómo se relacionan las partes de Jasmine con la fracción simplificada 3/20 de Mateo?»",
        "«¿Cómo calcularías rápidamente una propina del 20% sobre $80 con estas ideas?»"
      ]
    }
  },
  {
    id: "nt-g6-4",
    grade: 6,
    title: "Patterns of Integer Multiplication",
    standard: "6.NS.C.5",
    problem: "(-6) × (-5) = ?",
    silentPrompt: {
      en: "Fist to chest: why is the product of two negative numbers positive?",
      es: "Pulgar al pecho: ¿por qué el producto de dos números negativos es positivo?"
    },
    noticeWonder: {
      en: [
        "6 × 5 = 30.",
        "(-6) × 5 = -30 because it is 5 groups of -6.",
        "Negating the second factor reverses the direction again, making it +30."
      ],
      es: [
        "6 × 5 = 30.",
        "(-6) × 5 = -30 porque son 5 grupos de -6.",
        "Negar el segundo factor vuelve a invertir la dirección, dando +30."
      ]
    },
    strategies: [
      {
        student: "Devon",
        name: { en: "Pattern Decrease Table", es: "Tabla de patrones decrecientes" },
        steps: "(-6) × 2 = -12, (-6) × 1 = -6, (-6) × 0 = 0, (-6) × (-1) = +6 ... (-6) × (-5) = +30",
        explanation: {
          en: "Notice each step adds 6 as the multiplier decreases by 1. Continuing down to -5 yields +30.",
          es: "Observa que cada paso suma 6 al bajar el multiplicador en 1. Al llegar a -5 da +30."
        }
      },
      {
        student: "Elena",
        name: { en: "Opposite of an Opposite", es: "El opuesto de un opuesto" },
        steps: "Opposite of (6 × -5 = -30) is -(-30) = +30",
        explanation: {
          en: "A negative sign means 'take the opposite'. The opposite of -30 is positive 30.",
          es: "El signo negativo significa 'el opuesto de'. El opuesto de -30 es positivo 30."
        }
      },
      {
        student: "Malik",
        name: { en: "Zero Pairs on the Mat", es: "Pares cero en el tablero" },
        steps: "Start with zero. Remove 5 groups of -6. Removing 30 negatives leaves +30",
        explanation: {
          en: "Think of -5 as 'remove 5 groups'. Removing 30 negative counters leaves 30 positive counters.",
          es: "Piensa en -5 como 'quitar 5 grupos'. Quitar 30 fichas negativas deja 30 fichas positivas."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How does Devon’s pattern table prove that negative times negative MUST be positive?”",
        "“What physical meaning does Malik give to 'taking away negative chips'?”",
        "“Why is saying 'two minuses make a plus' less helpful than understanding opposites?”"
      ],
      es: [
        "«¿Cómo demuestra la tabla de Devon que negativo por negativo TIENE que ser positivo?»",
        "«¿Qué significado físico le da Malik a 'quitar fichas negativas'?»",
        "«¿Por qué decir 'dos menos dan más' es menos útil que entender los opuestos?»"
      ]
    }
  },
  {
    id: "nt-g6-5",
    grade: 6,
    title: "Area Model with Variables",
    standard: "6.EE.A.3",
    problem: "4(2x + 5) = ?",
    silentPrompt: {
      en: "Fist to chest: picture an area model divided into two rooms.",
      es: "Pulgar al pecho: imagina un modelo de área dividido en dos habitaciones."
    },
    noticeWonder: {
      en: [
        "The 4 is outside multiplying the entire group (2x + 5).",
        "2x and 5 cannot be combined directly because they are not like terms.",
        "Each term inside receives the factor of 4."
      ],
      es: [
        "El 4 está afuera multiplicando a todo el grupo (2x + 5).",
        "2x y 5 no se pueden sumar directamente porque no son términos semejantes.",
        "Cada término interior recibe el factor 4."
      ]
    },
    strategies: [
      {
        student: "Carlos",
        name: { en: "Geometric Area Model", es: "Modelo de área geométrica" },
        steps: "Rectangle with height 4, width split into 2x and 5. Room 1: 4 × 2x = 8x. Room 2: 4 × 5 = 20. Total = 8x + 20",
        explanation: {
          en: "Draw a rectangle: Room 1 has area 4 × 2x = 8x. Room 2 has area 4 × 5 = 20. Total area = 8x + 20.",
          es: "Dibuja un rectángulo: Sala 1 tiene área 4 × 2x = 8x. Sala 2 tiene área 4 × 5 = 20. Total = 8x + 20."
        }
      },
      {
        student: "Zoe",
        name: { en: "Repeated Addition", es: "Suma repetida" },
        steps: "(2x + 5) + (2x + 5) + (2x + 5) + (2x + 5) = (2x + 2x + 2x + 2x) + (5 + 5 + 5 + 5) = 8x + 20",
        explanation: {
          en: "Write out 4 copies of (2x + 5). Group the four 2x terms (8x) and the four 5s (20).",
          es: "Escribe 4 copias de (2x + 5). Agrupa los cuatro 2x (8x) y los cuatro 5 (20): 8x + 20."
        }
      },
      {
        student: "Marcus",
        name: { en: "Distributive Multiplication", es: "Multiplicación distributiva" },
        steps: "4 × 2x = 8x; 4 × 5 = 20 → 8x + 20",
        explanation: {
          en: "Distribute 4 to each term: 4 times 2x is 8x, and 4 times 5 is 20.",
          es: "Distribuye el 4 a cada término: 4 por 2x son 8x, y 4 por 5 son 20."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why can we NOT write 28x as the final answer?”",
        "“How does Zoe’s repeated addition prove that Marcus’s distributive step works?”",
        "“How would the area model look if the problem were 4(2x − 5)?”"
      ],
      es: [
        "«¿Por qué NO podemos escribir 28x como la respuesta final?»",
        "«¿Cómo demuestra la suma repetida de Zoe que la regla distributiva de Marcus es correcta?»",
        "«¿Cómo cambiaría el modelo de área si el problema fuera 4(2x − 5)?»"
      ]
    }
  },
  // Grade 7 additional routines
  {
    id: "nt-g7-3",
    grade: 7,
    title: "Subtracting Negatives & Distance",
    standard: "7.NS.A.1",
    problem: "-18 − (-7) = ?",
    silentPrompt: {
      en: "Fist to chest: interpret subtraction as the directed distance from -7 to -18.",
      es: "Pulgar al pecho: interpreta la resta como la distancia dirigida desde -7 hasta -18."
    },
    noticeWonder: {
      en: [
        "Both numbers are negative.",
        "Subtracting a negative means removing negative debt.",
        "Removing negatives makes the total LESS negative (closer to zero)."
      ],
      es: [
        "Ambos números son negativos.",
        "Restar un negativo significa eliminar deuda negativa.",
        "Quitar negativos hace que el total sea MENOS negativo (más cerca de cero)."
      ]
    },
    strategies: [
      {
        student: "Aaliyah",
        name: { en: "Add the Opposite", es: "Sumar el opuesto" },
        steps: "-18 − (-7) = -18 + 7 = -11",
        explanation: {
          en: "Subtracting -7 is identical to adding +7. Starting at -18 and adding 7 moves right to -11.",
          es: "Restar -7 es igual a sumar +7. Empezando en -18 y sumando 7 avanzas a -11."
        }
      },
      {
        student: "Tariq",
        name: { en: "Removing Negative Chips", es: "Quitar fichas negativas" },
        steps: "You have 18 negative chips. Take away 7 negative chips. 11 negative chips remain = -11",
        explanation: {
          en: "Physical model: if you have 18 negatives and remove 7 negatives, you simply have 11 negatives left.",
          es: "Modelo físico: si tienes 18 negativos y quitas 7 negativos, te quedan 11 negativos (-11)."
        }
      },
      {
        student: "Sarah",
        name: { en: "Number Line Distance", es: "Distancia en la recta numérica" },
        steps: "Distance from -7 to -18: moving left by 11 units → -11",
        explanation: {
          en: "Find how far -18 is from -7. It is 11 units in the negative direction, so -11.",
          es: "Calcula qué tan lejos está -18 de -7: 11 unidades hacia la izquierda (-11)."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why is Tariq’s chip removal explanation so clean when both numbers are negative?”",
        "“How does Aaliyah’s 'add the opposite' connect to debts and payments in real life?”",
        "“What would happen if the problem were -7 − (-18) instead?”"
      ],
      es: [
        "«¿Por qué la explicación de Tariq de quitar fichas es tan clara cuando ambos son negativos?»",
        "«¿Cómo se conecta 'sumar el opuesto' de Aaliyah con deudas y pagos en la vida real?»",
        "«¿Qué pasaría si el problema fuera al revés: -7 − (-18)?»"
      ]
    }
  },
  {
    id: "nt-g7-4",
    grade: 7,
    title: "Two-Step Equation Balance",
    standard: "7.EE.B.4.a",
    problem: "3x − 8 = 19",
    silentPrompt: {
      en: "Fist to chest: what was done to x last, and how do we undo it first?",
      es: "Pulgar al pecho: ¿qué se le hizo a x al final y cómo lo deshacemos primero?"
    },
    noticeWonder: {
      en: [
        "x was multiplied by 3, then 8 was subtracted.",
        "The inverse of subtracting 8 is adding 8.",
        "19 + 8 is 27, which is a multiple of 3!"
      ],
      es: [
        "A x se le multiplicó por 3 y luego se le restó 8.",
        "Lo inverso de restar 8 es sumar 8.",
        "¡19 + 8 es 27, que es múltiplo de 3!"
      ]
    },
    strategies: [
      {
        student: "Brandon",
        name: { en: "Inverse Operations (Unwrapping)", es: "Operaciones inversas (desenvolver)" },
        steps: "Add 8 to both sides: 3x = 27. Divide both sides by 3: x = 9",
        explanation: {
          en: "Undo the −8 first by adding 8 to both sides: 3x = 27. Then divide by 3: x = 9.",
          es: "Deshaz el −8 sumando 8 a ambos lados: 3x = 27. Luego divide entre 3: x = 9."
        }
      },
      {
        student: "Kendra",
        name: { en: "Cover-Up / Working Backwards", es: "Método de tapar / Hacia atrás" },
        steps: "Cover 3x: [something] − 8 = 19 → [something] must be 27. 3 × ? = 27 → x = 9",
        explanation: {
          en: "Cover the 3x block. What minus 8 gives 19? 27. Now 3 times what gives 27? 9.",
          es: "Tapa el bloque 3x. ¿Qué número menos 8 da 19? 27. Ahora 3 por cuánto da 27? 9."
        }
      },
      {
        student: "Diego",
        name: { en: "Balance Scale", es: "Balanza de platillos" },
        steps: "Add 8 units to both pans to level out: 3x = 27. Split each pan into 3 piles: x = 9",
        explanation: {
          en: "Picture a scale: put 8 on each side to cancel the minus 8. 3x balances 27. Divide into 3 equal piles: x = 9.",
          es: "Imagina la balanza: pon 8 en cada platillo para equilibrar. 3x pesa 27. Reparte en 3 pilas: x = 9."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why must we undo addition/subtraction BEFORE dividing by the coefficient 3?”",
        "“How does Kendra’s cover-up method prove Brandon’s algebraic steps?”",
        "“How can you substitute x = 9 back into the original equation to verify?”"
      ],
      es: [
        "«¿Por qué debemos deshacer la suma/resta ANTES de dividir entre el coeficiente 3?»",
        "«¿Cómo confirma el método de tapar de Kendra los pasos algebraicos de Brandon?»",
        "«¿Cómo puedes sustituir x = 9 en la ecuación original para verificar?»"
      ]
    }
  },
  {
    id: "nt-g7-5",
    grade: 7,
    title: "Mental Multi-Step Percent Discount",
    standard: "7.RP.A.3",
    problem: "20% Discount on $65 = ?",
    silentPrompt: {
      en: "Fist to chest: what is 10% of $65, and how does double that give the discount?",
      es: "Pulgar al pecho: ¿cuánto es el 10% de $65 y cómo su doble te da el descuento?"
    },
    noticeWonder: {
      en: [
        "10% of $65 is $6.50.",
        "20% is exactly double 10%.",
        "The sale price is original price minus discount ($65 − discount)."
      ],
      es: [
        "El 10% de $65 es $6.50.",
        "El 20% es exactamente el doble del 10%.",
        "El precio final es el precio original menos el descuento ($65 − descuento)."
      ]
    },
    strategies: [
      {
        student: "Liam",
        name: { en: "Double 10%", es: "Duplicar el 10%" },
        steps: "10% of $65 = $6.50. 20% = 2 × $6.50 = $13.00 discount. Sale price = $65 − $13 = $52",
        explanation: {
          en: "Find 10% ($6.50), double it to find 20% ($13.00 discount). Sale price is $65 − $13 = $52.",
          es: "Halla el 10% ($6.50) y duplícalo para el 20% ($13 de descuento). Precio final: $65 − $13 = $52."
        }
      },
      {
        student: "Mia",
        name: { en: "Pay 80% (Complement)", es: "Pagar el 80% (complemento)" },
        steps: "A 20% discount means paying 80%. 0.80 × 65 = 8 × 6.5 = $52",
        explanation: {
          en: "Think from the buyer's side: you pay 80% of the price. 8 × $6.50 = $52.00 directly.",
          es: "Piensa como comprador: pagas el 80% del valor. 8 × $6.50 = $52.00 directamente."
        }
      },
      {
        student: "Noah",
        name: { en: "One-Fifth Fraction", es: "Un quinto en fracción" },
        steps: "20% = 1/5. $65 ÷ 5 = $13 discount. $65 − $13 = $52",
        explanation: {
          en: "20% is 1/5. Divide $65 by 5 to get $13 discount. $65 − $13 = $52.",
          es: "20% es 1/5. Divide $65 entre 5 para hallar $13 de descuento. $65 − $13 = $52."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why does Mia’s complement method (paying 80%) skip the subtraction step entirely?”",
        "“How are Liam’s 10% chunks and Noah’s 1/5 fraction saying the exact same thing?”",
        "“How would you find a 30% discount on the same item?”"
      ],
      es: [
        "«¿Por qué el método de Mia de pagar el 80% se salta la resta por completo?»",
        "«¿Cómo dicen exactamente lo mismo las partes de 10% de Liam y la fracción 1/5 de Noah?»",
        "«¿Cómo hallarías un descuento del 30% en este mismo artículo?»"
      ]
    }
  },
  // Grade 8 additional routines
  {
    id: "nt-g8-3",
    grade: 8,
    title: "Variables on Both Sides",
    standard: "8.EE.C.7",
    problem: "4x + 6 = x + 21",
    silentPrompt: {
      en: "Fist to chest: how can you remove x from one side to simplify the balance?",
      es: "Pulgar al pecho: ¿cómo puedes quitar x de un lado para simplificar la balanza?"
    },
    noticeWonder: {
      en: [
        "There are x terms on both the left and right sides.",
        "Subtracting 1x from both sides keeps the scale balanced.",
        "After removing 1x, it becomes a simple two-step equation: 3x + 6 = 21."
      ],
      es: [
        "Hay términos con x en ambos lados (izquierdo y derecho).",
        "Restar 1x a ambos lados mantiene la balanza en equilibrio.",
        "Tras quitar 1x, queda una ecuación simple de dos pasos: 3x + 6 = 21."
      ]
    },
    strategies: [
      {
        student: "Harper",
        name: { en: "Balance Removal", es: "Eliminación en balanza" },
        steps: "Subtract x from both sides: 3x + 6 = 21. Subtract 6: 3x = 15. Divide by 3: x = 5",
        explanation: {
          en: "Remove 1x from both sides to get 3x + 6 = 21. Subtract 6 (3x = 15). Divide by 3 to find x = 5.",
          es: "Quita 1x de ambos lados: 3x + 6 = 21. Resta 6 (3x = 15). Divide entre 3: x = 5."
        }
      },
      {
        student: "Leo",
        name: { en: "Constants First", es: "Constantes primero" },
        steps: "Subtract 6 from both sides: 4x = x + 15. Subtract x: 3x = 15. x = 5",
        explanation: {
          en: "Clear the constant 6 first: 4x = x + 15. Then remove the variable x: 3x = 15, so x = 5.",
          es: "Despeja el 6 primero: 4x = x + 15. Luego resta la variable x: 3x = 15, dando x = 5."
        }
      },
      {
        student: "Maya",
        name: { en: "Reasoning on Difference", es: "Razonamiento sobre la diferencia" },
        steps: "The left side has 3 more x's. The right side has 15 more units. So 3x must equal 15 → x = 5",
        explanation: {
          en: "Compare: Left has 3 extra x's; Right has 15 extra units (21 − 6). Therefore 3x = 15, so x = 5.",
          es: "Compara: la izquierda tiene 3 x de más; la derecha tiene 15 unidades de más. Así 3x = 15, x = 5."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why did Harper choose to subtract x rather than subtract 4x?”",
        "“How does Maya’s comparison reasoning avoid algebraic notation while being mathematically rigorous?”",
        "“What check confirms that x = 5 is truly the solution?”"
      ],
      es: [
        "«¿Por qué Harper eligió restar x en vez de restar 4x?»",
        "«¿Cómo evita el razonamiento de Maya la notación algebraica sin perder rigor matemático?»",
        "«¿Qué comprobación confirma que x = 5 es verdaderamente la solución?»"
      ]
    }
  },
  {
    id: "nt-g8-4",
    grade: 8,
    title: "Quotient of Powers Rule",
    standard: "8.EE.A.1",
    problem: "10⁷ ÷ 10³ = ?",
    silentPrompt: {
      en: "Fist to chest: how many factors of 10 cancel when you divide?",
      es: "Pulgar al pecho: ¿cuántos factores de 10 se cancelan al dividir?"
    },
    noticeWonder: {
      en: [
        "Both powers have the same base of 10.",
        "10⁷ has 7 factors of 10, and 10³ has 3 factors of 10.",
        "Division cancels matching factors top and bottom."
      ],
      es: [
        "Ambas potencias tienen la misma base 10.",
        "10⁷ tiene 7 factores de 10, y 10³ tiene 3 factores de 10.",
        "La división cancela factores coincidentes arriba y abajo."
      ]
    },
    strategies: [
      {
        student: "Devon",
        name: { en: "Quotient of Powers Rule", es: "Regla del cociente de potencias" },
        steps: "10^(7 − 3) = 10⁴ = 10,000",
        explanation: {
          en: "When dividing powers with identical bases, subtract the exponents: 7 − 3 = 4.",
          es: "Al dividir potencias de la misma base, resta los exponentes: 7 − 3 = 4."
        }
      },
      {
        student: "Sofia",
        name: { en: "Expanded Factor Cancellation", es: "Cancelación de factores expandidos" },
        steps: "(10×10×10×10×10×10×10) / (10×10×10) = 10×10×10×10 = 10⁴ = 10,000",
        explanation: {
          en: "Write out all factors. Cancel the 3 tens in the denominator with 3 in the numerator. 4 tens remain.",
          es: "Escribe los factores. Cancela 3 dieces del denominador con 3 del numerador. Quedan 4 dieces."
        }
      },
      {
        student: "Gabe",
        name: { en: "Place Value Zero Counting", es: "Conteo de ceros en valor posicional" },
        steps: "10,000,000 ÷ 1,000 = remove 3 zeros = 10,000 = 10⁴",
        explanation: {
          en: "10 million divided by 1 thousand. Dividing by 1,000 removes 3 zeros from 7 zeros: leaves 4 zeros.",
          es: "10 millones entre 1 mil. Dividir entre 1,000 quita 3 ceros a 7 ceros: quedan 4 ceros (10,000)."
        }
      }
    ],
    teacherStems: {
      en: [
        "“How does Sofia’s expanded form prove why we subtract exponents?”",
        "“What would happen if the exponents were reversed: 10³ ÷ 10⁷?”",
        "“How does Gabe’s zero-counting connect exponents to metric scientific notation?”"
      ],
      es: [
        "«¿Cómo demuestra la forma expandida de Sofia por qué restamos exponentes?»",
        "«¿Qué pasaría si los exponentes estuvieran invertidos: 10³ ÷ 10⁷?»",
        "«¿Cómo conecta el conteo de ceros de Gabe los exponentes con la notación científica?»"
      ]
    }
  },
  {
    id: "nt-g8-5",
    grade: 8,
    title: "Estimating Square Roots Between Benchmarks",
    standard: "8.NS.A.2",
    problem: "√60 ≈ ?",
    silentPrompt: {
      en: "Fist to chest: which two perfect squares is 60 trapped between?",
      es: "Pulgar al pecho: ¿entre cuáles dos cuadrados perfectos está atrapado el 60?"
    },
    noticeWonder: {
      en: [
        "7² = 49 and 8² = 64.",
        "60 is between 49 and 64, so √60 must be between 7 and 8.",
        "60 is much closer to 64 (distance 4) than to 49 (distance 11)."
      ],
      es: [
        "7² = 49 y 8² = 64.",
        "60 está entre 49 y 64, por lo que √60 debe estar entre 7 y 8.",
        "60 está mucho más cerca de 64 (distancia 4) que de 49 (distancia 11)."
      ]
    },
    strategies: [
      {
        student: "Elena",
        name: { en: "Perfect Square Boundaries", es: "Límites de cuadrados perfectos" },
        steps: "√49 < √60 < √64 → 7 < √60 < 8. Since 60 is closer to 64, √60 ≈ 7.7 or 7.8",
        explanation: {
          en: "Trap 60 between 49 and 64. Since 60 is close to 64 (only 4 away), the root is around 7.7 or 7.8.",
          es: "Atrapa al 60 entre 49 y 64. Como está a solo 4 de 64, la raíz está cerca de 7.7 o 7.8."
        }
      },
      {
        student: "Lucas",
        name: { en: "Linear Interpolation Approximation", es: "Aproximación por interpolación lineal" },
        steps: "Total distance from 49 to 64 is 15. Distance from 49 to 60 is 11. 11/15 ≈ 0.73 → 7 + 0.73 ≈ 7.7",
        explanation: {
          en: "60 is 11/15ths of the way from 49 to 64. 11 ÷ 15 is about 0.73, so √60 ≈ 7.7.",
          es: "60 recorre 11 de los 15 pasos entre 49 y 64. 11 ÷ 15 ≈ 0.73, así que √60 ≈ 7.7."
        }
      },
      {
        student: "Zoe",
        name: { en: "Trial and Check Squaring", es: "Prueba y verificación al cuadrado" },
        steps: "7.7² = 59.29; 7.8² = 60.84. 60 is between 59.29 and 60.84 → √60 ≈ 7.75",
        explanation: {
          en: "Test square: 7.7² is 59.29 (slightly low), 7.8² is 60.84 (slightly high). √60 is about 7.75.",
          es: "Prueba al cuadrado: 7.7² = 59.29 (bajo), 7.8² = 60.84 (alto). √60 es aprox. 7.75."
        }
      }
    ],
    teacherStems: {
      en: [
        "“Why can we be 100% certain that √60 is an irrational non-terminating decimal?”",
        "“How does Elena’s benchmark distance explain why the decimal part is greater than 0.5?”",
        "“How would you estimate √30 using the exact same strategy?”"
      ],
      es: [
        "«¿Por qué podemos estar 100% seguros de que √60 es un decimal irracional infinito?»",
        "«¿Cómo explica la distancia de Elena por qué la parte decimal es mayor que 0.5?»",
        "«¿Cómo estimarías √30 usando exactamente esta misma estrategia?»"
      ]
    }
  }
];

const NumberTalkRoutine = {
  activeGrade: 3,
  activeIndex: 0,
  activePhase: "think",
  lang: "en",

  open(grade = state.grade || 3) {
    const modal = document.querySelector("#number-talk-modal");
    if (!modal) return;
    this.activeGrade = Math.max(1, Math.min(8, Number(grade) || 3));
    this.activeIndex = 0;
    this.activePhase = "think";
    modal.hidden = false;
    document.body.classList.add("nt-modal-open");
    this.render();
  },

  close() {
    const modal = document.querySelector("#number-talk-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("nt-modal-open");
  },

  toggleLang() {
    this.lang = this.lang === "en" ? "es" : "en";
    const btn = document.querySelector("#nt-toggle-lang");
    if (btn) btn.textContent = this.lang === "en" ? "🌐 Español" : "🌐 English";
    this.render();
  },

  getCurrentTalks() {
    return NUMBER_TALKS.filter((t) => t.grade === this.activeGrade);
  },

  getCurrentTalk() {
    const talks = this.getCurrentTalks();
    return talks[this.activeIndex % talks.length] || talks[0] || NUMBER_TALKS[0];
  },

  setPhase(phase) {
    this.activePhase = phase;
    this.render();
  },

  setGrade(g) {
    this.activeGrade = g;
    this.activeIndex = 0;
    this.render();
  },

  prevTalk() {
    const talks = this.getCurrentTalks();
    this.activeIndex = (this.activeIndex - 1 + talks.length) % talks.length;
    this.render();
  },

  nextTalk() {
    const talks = this.getCurrentTalks();
    this.activeIndex = (this.activeIndex + 1) % talks.length;
    this.render();
  },

  render() {
    const viewport = document.querySelector("#number-talk-viewport");
    if (!viewport) return;
    const talk = this.getCurrentTalk();
    const talks = this.getCurrentTalks();
    const isEs = this.lang === "es";

    viewport.innerHTML = `
      <div class="nt-container">
        <!-- Grade & Problem Carousel Bar -->
        <div class="nt-toolbar">
          <div class="nt-grade-pills">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((g) => `
              <button type="button" class="nt-grade-btn ${g === this.activeGrade ? 'active' : ''}" data-nt-grade="${g}">
                Gr ${g}
              </button>
            `).join("")}
          </div>
          <div class="nt-nav-controls">
            <button type="button" class="outline-action" data-nt-prev ${talks.length <= 1 ? 'disabled' : ''}>◄ ${isEs ? "Anterior" : "Previous"}</button>
            <span class="nt-counter">${this.activeIndex + 1} of ${talks.length}</span>
            <button type="button" class="outline-action" data-nt-next ${talks.length <= 1 ? 'disabled' : ''}>${isEs ? "Siguiente" : "Next"} ►</button>
          </div>
        </div>

        <!-- Routine Phase Navigation -->
        <nav class="nt-phase-tabs" role="tablist">
          <button type="button" class="nt-phase-btn ${this.activePhase === 'think' ? 'active' : ''}" data-nt-phase="think">
            🤫 1. ${isEs ? "Tiempo en Silencio" : "Silent Thinking"}
          </button>
          <button type="button" class="nt-phase-btn ${this.activePhase === 'notice' ? 'active' : ''}" data-nt-phase="notice">
            👁️ 2. ${isEs ? "Notar y Preguntar" : "Notice & Wonder"}
          </button>
          <button type="button" class="nt-phase-btn ${this.activePhase === 'strategies' ? 'active' : ''}" data-nt-phase="strategies">
            🗣️ 3. ${isEs ? "Estrategias de Alumnos" : "Strategy Showcase"}
          </button>
          <button type="button" class="nt-phase-btn ${this.activePhase === 'stems' ? 'active' : ''}" data-nt-phase="stems">
            📋 4. ${isEs ? "Preguntas Docentes" : "Teacher Facilitation"}
          </button>
        </nav>

        <!-- Projector Main Problem Banner -->
        <div class="nt-projector-stage">
          <span class="nt-standard-tag">${escapeHtml(talk.standard)} · Grade ${talk.grade} · ${escapeHtml(talk.title)}</span>
          <div class="nt-hero-problem">${escapeHtml(talk.problem)}</div>
        </div>

        <!-- Dynamic Phase Content -->
        <div class="nt-phase-body">
          ${this.renderPhaseBody(talk, isEs)}
        </div>
      </div>
    `;
  },

  renderPhaseBody(talk, isEs) {
    if (this.activePhase === "think") {
      return `
        <div class="nt-think-panel">
          <div class="nt-fist-cue">
            <div class="nt-fist-icon">✊</div>
            <div class="nt-fist-text">
              <h3>${isEs ? "Pulgar al Pecho (Señal Silenciosa)" : "Fist to Chest Silent Cue"}</h3>
              <p>${escapeHtml(isEs ? talk.silentPrompt.es : talk.silentPrompt.en)}</p>
              <p style="font-size:0.9rem; color:#64748b; margin-top:4px">${isEs ? "Levanta un dedo adicional por cada estrategia diferente que encuentres." : "Put up an extra finger for each additional strategy your brain finds."}</p>
            </div>
          </div>
        </div>
      `;
    }
    if (this.activePhase === "notice") {
      const items = isEs ? talk.noticeWonder.es : talk.noticeWonder.en;
      return `
        <div class="nt-notice-panel">
          <h3 style="margin:0 0 8px; font-size:1.15rem; color:#0f172a">${isEs ? "Antes de calcular, ¿qué observas en estos números?" : "Before calculating, what do you notice about these numbers?"}</h3>
          <div class="nt-notice-grid">
            ${items.map((item) => `
              <div class="nt-notice-item">
                <span class="nt-bullet-icon">💡</span>
                <p>${escapeHtml(item)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
    if (this.activePhase === "strategies") {
      return `
        <div class="nt-strategies-panel">
          <h3 style="margin:0 0 8px; font-size:1.15rem; color:#0f172a">${isEs ? "3 Formas Diferentes de Razonar este Problema" : "3 Different Mental Math Reasoning Pathways"}</h3>
          <div class="nt-strategy-cards-grid">
            ${talk.strategies.map((strat, i) => `
              <div class="nt-strategy-card">
                <div class="nt-strat-head">
                  <span class="nt-avatar">${['👩🏽‍🎓', '👨🏾‍🎓', '👩🏻‍🎓'][i % 3]}</span>
                  <div>
                    <strong>${escapeHtml(strat.student)}</strong>
                    <div style="font-size:0.8rem; color:#64748b">${escapeHtml(isEs ? strat.name.es : strat.name.en)}</div>
                  </div>
                </div>
                <div class="nt-strat-steps">${escapeHtml(strat.steps)}</div>
                <p class="nt-strat-expl">${escapeHtml(isEs ? strat.explanation.es : strat.explanation.en)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
    if (this.activePhase === "stems") {
      const stems = isEs ? talk.teacherStems.es : talk.teacherStems.en;
      return `
        <div class="nt-stems-panel">
          <h3 style="margin:0 0 8px; font-size:1.15rem; color:#0f172a">${isEs ? "Preguntas Clave para el Diálogo Matemático" : "Teacher Facilitation Prompts"}</h3>
          <ul class="nt-stem-list">
            ${stems.map((stem) => `<li>${escapeHtml(stem)}</li>`).join("")}
          </ul>
        </div>
      `;
    }
    return "";
  }
};

function printNumberTalkRoutine(talk) {
  if (!talk) talk = NumberTalkRoutine.getCurrentTalk();
  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>📽️ Classroom Number Talk Routine Card</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Grade ${talk.grade} · Standard: <strong>${escapeHtml(talk.standard)}</strong> · Focus: <strong>${escapeHtml(talk.title)}</strong></p>
        </div>
        <div class="tpt-header-fields">
          <span>Date: <span class="tpt-field-line"></span></span>
          <span>Room: <span class="tpt-field-line"></span></span>
        </div>
      </div>

      <div style="text-align:center; padding:0.3in 0; background:#f8fafc; border:2px solid #cbd5e1; border-radius:10px; margin:0.15in 0">
        <span style="font-size:11pt; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.05em">Daily Mental Math Problem</span>
        <div style="font-size:36pt; font-weight:900; color:#0f172a; margin-top:4px">${escapeHtml(talk.problem)}</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.15in; margin-bottom:0.15in">
        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.12in; background:#ffffff">
          <h3 style="margin:0 0 6px; font-size:11pt; color:#0f172a">🤫 Phase 1: Silent Thinking &amp; Notice</h3>
          <p style="margin:0 0 4px; font-size:9pt; color:#334155"><strong>Silent Cue:</strong> Fist to chest, thumb up when ready.</p>
          <ul style="margin:4px 0 0; padding-left:0.2in; font-size:8.5pt; color:#475569">
            ${talk.noticeWonder.en.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>
        </div>

        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.12in; background:#ffffff">
          <h3 style="margin:0 0 6px; font-size:11pt; color:#0f172a">📋 Phase 4: Bilingual Teacher Stems</h3>
          <ul style="margin:0; padding-left:0.2in; font-size:8.5pt; color:#334155; line-height:1.5">
            ${talk.teacherStems.en.map((s, idx) => `
              <li><strong>${escapeHtml(s)}</strong><br/><em style="color:#64748b">${escapeHtml(talk.teacherStems.es[idx])}</em></li>
            `).join("")}
          </ul>
        </div>
      </div>

      <div style="border:1.5px solid #4f46e5; border-radius:8px; padding:0.12in; background:#f5f3ff">
        <h3 style="margin:0 0 8px; font-size:11pt; color:#3730a3">🗣️ Phase 3: Strategy Showcase (Anticipated Approaches)</h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.1in">
          ${talk.strategies.map((strat) => `
            <div style="background:#ffffff; border:1px solid #c7d2fe; border-radius:6px; padding:0.08in">
              <strong style="font-size:9.5pt; color:#1e1b4b">${escapeHtml(strat.student)}: ${escapeHtml(strat.name.en)}</strong>
              <div style="font-family:monospace; font-weight:700; font-size:9pt; margin:4px 0; color:#4338ca">${escapeHtml(strat.steps)}</div>
              <p style="margin:0; font-size:8pt; color:#475569">${escapeHtml(strat.explanation.en)}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.1in; margin-top:0.15in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Daily Number Talks</span>
        <span>eduwonderlab.com/math/fluency-lab/</span>
      </footer>
    </article>
  `);
}

/* ==========================================================================
   Dynamic Printable Partner Games (Grades 1–8 Bilingual EN / ES)
   ========================================================================== */
function printFractionWar(grade = 4) {
  const learner = PROFILE_NAMES[activeProfile] || "Student";
  const fractions = [
    { n: 1, d: 2, label: "1/2" },
    { n: 2, d: 3, label: "2/3" },
    { n: 3, d: 4, label: "3/4" },
    { n: 1, d: 4, label: "1/4" },
    { n: 3, d: 5, label: "3/5" },
    { n: 4, d: 5, label: "4/5" },
    { n: 5, d: 6, label: "5/6" },
    { n: 1, d: 6, label: "1/6" },
    { n: 3, d: 8, label: "3/8" },
    { n: 5, d: 8, label: "5/8" },
    { n: 7, d: 8, label: "7/8" },
    { n: 2, d: 4, label: "2/4" },
    { n: 4, d: 6, label: "4/6" },
    { n: 6, d: 8, label: "6/8" },
    { n: 5, d: 10, label: "5/10" },
    { n: 1, d: 3, label: "1/3" }
  ];

  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>🎲 Partner Math Game: Fraction War</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">La Guerra de Fracciones · Grades 3–5 · Visual Fraction Comparison</p>
        </div>
        <div class="tpt-header-fields">
          <span>Player 1: <strong class="tpt-field-line">${escapeHtml(learner)}</strong></span>
          <span>Player 2: <span class="tpt-field-line"></span></span>
          <span>Date: <span class="tpt-field-line"></span></span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.15in; margin:0.12in 0">
        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.1in; background:#f8fafc">
          <h3 style="margin:0 0 4px; font-size:10pt; color:#0f172a">📜 Game Rules (English)</h3>
          <ol style="margin:0; padding-left:0.18in; font-size:8pt; line-height:1.45; color:#334155">
            <li>Cut out the 16 cards on Page 2. Shuffle and deal 8 cards face down to each player.</li>
            <li>Both players flip their top card simultaneously.</li>
            <li>Compare fractions! The player with the <strong>greater fraction</strong> wins both cards.</li>
            <li><strong>TIE BREAKER (WAR!):</strong> If fractions are equal (e.g. 1/2 and 2/4), declare "WAR!" Place 2 cards face down and flip the 3rd to decide the winner of all cards!</li>
            <li>Player with the most cards after 8 rounds wins!</li>
          </ol>
        </div>

        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.1in; background:#f8fafc">
          <h3 style="margin:0 0 4px; font-size:10pt; color:#0f172a">📜 Reglas del Juego (Español)</h3>
          <ol style="margin:0; padding-left:0.18in; font-size:8pt; line-height:1.45; color:#334155">
            <li>Corta las 16 cartas de la Página 2. Reparte 8 cartas boca abajo a cada jugador.</li>
            <li>Ambos voltean su carta superior al mismo tiempo.</li>
            <li>¡Compara! El jugador con la <strong>fracción mayor</strong> se lleva ambas cartas.</li>
            <li><strong>¡GUERRA!:</strong> Si son equivalentes (ej. 1/2 y 2/4), pon 2 cartas boca abajo y voltea la 3.ª para decidir quién gana todo el montón.</li>
            <li>¡Gana quien tenga más cartas tras 8 rondas!</li>
          </ol>
        </div>
      </div>

      <div style="border:1.5px solid #0284c7; border-radius:8px; padding:0.1in; background:#f0f9ff; margin-bottom:0.12in">
        <h3 style="margin:0 0 4px; font-size:9.5pt; color:#0369a1">💬 Partner Talk Sentence Stems / Frases para el Diálogo</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.1in; font-size:8pt; color:#0c4a6e">
          <div>
            • <em>“My fraction is greater because its parts are larger…”</em><br/>
            • <em>“These two are equal because 2/4 simplifies to 1/2…”</em>
          </div>
          <div>
            • <em>«Mi fracción es mayor porque sus partes son más grandes…»</em><br/>
            • <em>«Estas son equivalentes porque 2/4 se simplifica a 1/2…»</em>
          </div>
        </div>
      </div>

      <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.1in; background:#ffffff">
        <h3 style="margin:0 0 6px; font-size:10pt; color:#0f172a">🏆 Match Record Ledger / Registro de Rondas</h3>
        <table style="width:100%; border-collapse:collapse; font-size:8pt; text-align:center">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1.5px solid #cbd5e1">
              <th style="padding:4px; border:1px solid #cbd5e1">Round</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Player 1 Fraction</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Comparison (&gt;, &lt;, =)</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Player 2 Fraction</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Round Winner</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((r) => `
              <tr style="border-bottom:1px solid #e2e8f0; height:24px">
                <td style="border:1px solid #cbd5e1; font-weight:700">R${r}</td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.1in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Partner Games</span>
        <span>Page 1 of 2 (Turn over for game cards)</span>
      </footer>
    </article>

    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>✂️ Fraction War Cut-and-Play Cards</h1>
          <p style="margin:2px 0 0; font-size:9.5pt; color:#475569">Cut along the dotted lines. 16 high-contrast fraction cards with visual bar models.</p>
        </div>
        <div class="tpt-header-fields">
          <span>Deck: <strong>16 Cards</strong></span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.1in; margin-top:0.1in">
        ${fractions.map((f) => `
          <div style="border:1.5px dashed #475569; border-radius:6px; padding:0.1in; text-align:center; background:#ffffff">
            <span style="font-size:7.5pt; font-weight:800; color:#64748b; letter-spacing:0.05em">FRACTION WAR</span>
            <div style="font-size:22pt; font-weight:900; color:#0f172a; margin:4px 0">${f.label}</div>
            <svg width="100%" height="22" viewBox="0 0 100 22" style="margin:4px auto; display:block">
              <rect x="0" y="0" width="100" height="22" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
              ${Array.from({ length: f.d }, (_, i) => {
                const w = 100 / f.d;
                const isShaded = i < f.n;
                return `<rect x="${i * w}" y="0" width="${w}" height="22" fill="${isShaded ? "#334155" : "none"}" stroke="#0f172a" stroke-width="1" />`;
              }).join("")}
            </svg>
            <span style="font-size:7pt; color:#475569">${f.n} of ${f.d} equal parts shaded</span>
          </div>
        `).join("")}
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.12in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Fraction War Cards</span>
        <span>Page 2 of 2</span>
      </footer>
    </article>
  `);
}

function printIntegerTugOfWar(grade = 7) {
  const learner = PROFILE_NAMES[activeProfile] || "Student";
  const cards = [
    { val: "+3", type: "pos" }, { val: "-3", type: "neg" },
    { val: "+4", type: "pos" }, { val: "-4", type: "neg" },
    { val: "+5", type: "pos" }, { val: "-5", type: "neg" },
    { val: "+2", type: "pos" }, { val: "-2", type: "neg" },
    { val: "+6", type: "pos" }, { val: "-6", type: "neg" },
    { val: "+1", type: "pos" }, { val: "-1", type: "neg" },
    { val: "+7", type: "pos" }, { val: "-7", type: "neg" },
    { val: "+2 (Bonus)", type: "pos" }, { val: "-2 (Bonus)", type: "neg" },
    { val: "Zero Pair (0)", type: "zero" }, { val: "Zero Pair (0)", type: "zero" },
    { val: "Reverse (+/-)", type: "special" }, { val: "+5 Mega Pull", type: "pos" }
  ];

  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>🎲 Partner Math Game: Integer Tug-of-War</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Tiro a la Cuerda con Enteros · Grades 6–7 · Number Line Net Charge</p>
        </div>
        <div class="tpt-header-fields">
          <span>Blue (+): <strong class="tpt-field-line">${escapeHtml(learner)}</strong></span>
          <span>Red (−): <span class="tpt-field-line"></span></span>
          <span>Date: <span class="tpt-field-line"></span></span>
        </div>
      </div>

      <!-- Tug-of-War Number Line Track -->
      <div style="border:2px solid #0f172a; border-radius:10px; padding:0.12in; background:#ffffff; margin:0.1in 0">
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:8.5pt; margin-bottom:4px">
          <span style="color:#dc2626">🚩 RED TEAM WIN ZONE (−10)</span>
          <span style="color:#475569">⚖️ START (0)</span>
          <span style="color:#2563eb">🚩 BLUE TEAM WIN ZONE (+10)</span>
        </div>
        <svg width="100%" height="65" viewBox="0 0 500 65">
          <!-- Track base -->
          <rect x="10" y="25" width="480" height="14" rx="7" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" />
          <rect x="10" y="25" width="240" height="14" fill="#fee2e2" />
          <rect x="250" y="25" width="240" height="14" fill="#dbeafe" />
          <line x1="250" y1="12" x2="250" y2="52" stroke="#0f172a" stroke-width="3" />
          <!-- Ticks from -10 to +10 -->
          ${Array.from({ length: 21 }, (_, i) => {
            const val = i - 10;
            const x = 20 + i * 23;
            const isZero = val === 0;
            return `
              <line x1="${x}" y1="${isZero ? 14 : 22}" x2="${x}" y2="${isZero ? 50 : 42}" stroke="#0f172a" stroke-width="${isZero ? 2.5 : 1}" />
              <text x="${x}" y="60" text-anchor="middle" font-size="8" font-weight="${isZero ? 900 : 700}" fill="${val < 0 ? "#dc2626" : val > 0 ? "#2563eb" : "#0f172a"}">${val > 0 ? `+${val}` : val}</text>
            `;
          }).join("")}
        </svg>
        <p style="text-align:center; font-size:7.5pt; color:#64748b; margin:2px 0 0">Place a coin or counter on 0. Draw cards to move left (−) or right (+)!</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.12in; margin-bottom:0.1in">
        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Rules (English)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Place marker on 0. Shuffle the 20 Integer Cards on Page 2.</li>
            <li>Take turns drawing 1 card. Add the card's value to the current position.</li>
            <li>Positive (+) moves right towards Blue (+10). Negative (−) moves left towards Red (−10).</li>
            <li>First player to pull the marker to their 10-goal wins the match!</li>
          </ol>
        </div>

        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Reglas (Español)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Coloca una ficha en 0. Baraja las 20 Cartas de la Página 2.</li>
            <li>Por turnos, saquen 1 carta. Suma el valor a la posición actual.</li>
            <li>Positivo (+) mueve a la derecha (Azul +10). Negativo (−) a la izquierda (Rojo −10).</li>
            <li>¡Gana el primero en arrastrar la ficha hasta su meta de 10!</li>
          </ol>
        </div>
      </div>

      <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#ffffff">
        <h3 style="margin:0 0 4px; font-size:9.5pt; color:#0f172a">🏆 Game Turn Ledger / Registro de Jugadas</h3>
        <table style="width:100%; border-collapse:collapse; font-size:7.5pt; text-align:center">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1.5px solid #cbd5e1">
              <th style="padding:3px; border:1px solid #cbd5e1">Turn</th>
              <th style="padding:3px; border:1px solid #cbd5e1">Player</th>
              <th style="padding:3px; border:1px solid #cbd5e1">Start Pos</th>
              <th style="padding:3px; border:1px solid #cbd5e1">Card Drawn</th>
              <th style="padding:3px; border:1px solid #cbd5e1">Equation (Start + Card)</th>
              <th style="padding:3px; border:1px solid #cbd5e1">New Pos</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((t) => `
              <tr style="border-bottom:1px solid #e2e8f0; height:20px">
                <td style="border:1px solid #cbd5e1; font-weight:700">T${t}</td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.08in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Integer Tug-of-War</span>
        <span>Page 1 of 2</span>
      </footer>
    </article>

    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>✂️ Integer Tug-of-War Action Cards</h1>
          <p style="margin:2px 0 0; font-size:9.5pt; color:#475569">Cut along dotted lines. 20 movement cards for positive and negative integers.</p>
        </div>
        <div class="tpt-header-fields">
          <span>Deck: <strong>20 Cards</strong></span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.08in; margin-top:0.1in">
        ${cards.map((c) => `
          <div style="border:1.5px dashed #475569; border-radius:6px; padding:0.08in; text-align:center; background:#ffffff">
            <span style="font-size:7pt; font-weight:800; color:#64748b; letter-spacing:0.05em">INTEGER TUG</span>
            <div style="font-size:18pt; font-weight:900; color:${c.type === "pos" ? "#2563eb" : c.type === "neg" ? "#dc2626" : "#0f172a"}; margin:4px 0">${c.val}</div>
            <span style="font-size:7pt; color:#475569">
              ${c.type === "pos" ? "Move RIGHT (+)" : c.type === "neg" ? "Move LEFT (−)" : "Stay at 0"}
            </span>
          </div>
        `).join("")}
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.1in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Tug-of-War Cards</span>
        <span>Page 2 of 2</span>
      </footer>
    </article>
  `);
}

function printFactorCapture(grade = 5) {
  const learner = PROFILE_NAMES[activeProfile] || "Student";
  const factorGuide = [
    "1: 1", "2: 1", "3: 1", "4: 1, 2", "5: 1", "6: 1, 2, 3", "7: 1", "8: 1, 2, 4", "9: 1, 3", "10: 1, 2, 5",
    "11: 1", "12: 1, 2, 3, 4, 6", "13: 1", "14: 1, 2, 7", "15: 1, 3, 5", "16: 1, 2, 4, 8", "17: 1", "18: 1, 2, 3, 6, 9", "19: 1", "20: 1, 2, 4, 5, 10",
    "21: 1, 3, 7", "22: 1, 2, 11", "23: 1", "24: 1, 2, 3, 4, 6, 8, 12", "25: 1, 5", "26: 1, 2, 13", "27: 1, 3, 9", "28: 1, 2, 4, 7, 14", "29: 1", "30: 1, 2, 3, 5, 6, 10, 15",
    "31: 1", "32: 1, 2, 4, 8, 16", "33: 1, 3, 11", "34: 1, 2, 17", "35: 1, 5, 7", "36: 1, 2, 3, 4, 6, 9, 12, 18", "37: 1", "38: 1, 2, 19", "39: 1, 3, 13", "40: 1, 2, 4, 5, 8, 10, 20",
    "41: 1", "42: 1, 2, 3, 6, 7, 14, 21", "43: 1", "44: 1, 2, 4, 11, 22", "45: 1, 3, 5, 9, 15", "46: 1, 2, 23", "47: 1", "48: 1, 2, 3, 4, 6, 8, 12, 16, 24", "49: 1, 7", "50: 1, 2, 5, 10, 25"
  ];

  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>🎲 Partner Math Game: Factor Capture</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Captura de Factores · Grades 4–6 · Prime &amp; Composite Strategy</p>
        </div>
        <div class="tpt-header-fields">
          <span>Player 1: <strong class="tpt-field-line">${escapeHtml(learner)}</strong></span>
          <span>Player 2: <span class="tpt-field-line"></span></span>
          <span>Date: <span class="tpt-field-line"></span></span>
        </div>
      </div>

      <!-- 1-50 Game Grid -->
      <div style="border:2px solid #0f172a; border-radius:10px; padding:0.12in; background:#ffffff; margin:0.1in 0">
        <h3 style="margin:0 0 6px; font-size:10pt; text-align:center; color:#0f172a">🎯 Factor Capture Game Board (1 to 50)</h3>
        <div style="display:grid; grid-template-columns:repeat(10, 1fr); gap:4px">
          ${Array.from({ length: 50 }, (_, i) => {
            const num = i + 1;
            return `
              <div style="border:1.5px solid #cbd5e1; border-radius:6px; padding:6px 2px; text-align:center; background:#f8fafc">
                <span style="font-size:13pt; font-weight:900; color:#0f172a; display:block">${num}</span>
                <span style="font-size:6.5pt; color:#94a3b8">[ ]</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.12in; margin-bottom:0.1in">
        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Rules (English)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Player A circles any available number and scores that number.</li>
            <li>Player B must cross out ALL remaining available factors of Player A's number and scores the <strong>sum of those factors</strong>.</li>
            <li>Switch roles each turn! If you choose a number with no available factors left, you forfeit your points for that turn.</li>
            <li>Game ends when no numbers with factors remain. Highest total score wins!</li>
          </ol>
        </div>

        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Reglas (Español)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Jugador A encierra cualquier número libre y anota ese valor.</li>
            <li>Jugador B tacha TODOS los factores libres de ese número y anota la <strong>suma de esos factores</strong>.</li>
            <li>¡Se turnan! Si eliges un número sin factores disponibles, pierdes tus puntos en ese turno.</li>
            <li>El juego termina cuando no quedan jugadas válidas. ¡Gana la mayor puntuación!</li>
          </ol>
        </div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Factor Capture</span>
        <span>Page 1 of 2</span>
      </footer>
    </article>

    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>🏆 Factor Capture Score Sheet &amp; Factor Guide</h1>
          <p style="margin:2px 0 0; font-size:9.5pt; color:#475569">Record scores round-by-round. Check factors with the reference guide below.</p>
        </div>
      </div>

      <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.1in; background:#ffffff; margin:0.1in 0">
        <h3 style="margin:0 0 4px; font-size:9.5pt; color:#0f172a">Score Tracking Ledger (10 Turns)</h3>
        <table style="width:100%; border-collapse:collapse; font-size:7.5pt; text-align:center">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1.5px solid #cbd5e1">
              <th style="padding:4px; border:1px solid #cbd5e1">Turn</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Chooser</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Number Chosen</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Chooser Points</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Factors Captured</th>
              <th style="padding:4px; border:1px solid #cbd5e1">Catcher Points (Sum)</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `
              <tr style="border-bottom:1px solid #e2e8f0; height:20px">
                <td style="border:1px solid #cbd5e1; font-weight:700">T${t}</td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
                <td style="border:1px solid #cbd5e1"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="border:1.5px solid #64748b; border-radius:8px; padding:0.1in; background:#f8fafc">
        <h3 style="margin:0 0 4px; font-size:9pt; color:#0f172a">🔍 Quick Factor Verification Guide (Proper Factors for 1 to 50)</h3>
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; font-size:6.5pt; color:#334155; line-height:1.3">
          ${factorGuide.map((g) => `<div><strong>${escapeHtml(g)}</strong></div>`).join("")}
        </div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.1in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Factor Capture Ledger</span>
        <span>Page 2 of 2</span>
      </footer>
    </article>
  `);
}

function printRollAndSplitArray(grade = 3) {
  const learner = PROFILE_NAMES[activeProfile] || "Student";
  printHtml(`
    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>🎲 Partner Math Game: Roll &amp; Split Array</h1>
          <p style="margin:2px 0 0; font-size:10pt; color:#475569">Tira y Divide la Cuadrícula · Grades 1–3 · Distributive Property Array Capture</p>
        </div>
        <div class="tpt-header-fields">
          <span>Player 1 (Blue): <strong class="tpt-field-line">${escapeHtml(learner)}</strong></span>
          <span>Player 2 (Red): <span class="tpt-field-line"></span></span>
          <span>Date: <span class="tpt-field-line"></span></span>
        </div>
      </div>

      <!-- 20x10 Shared Territory Grid -->
      <div style="border:2px solid #0f172a; border-radius:10px; padding:0.12in; background:#ffffff; margin:0.1in 0">
        <h3 style="margin:0 0 4px; font-size:9.5pt; text-align:center; color:#0f172a">Shared Array Grid (20 Columns × 10 Rows = 200 Squares)</h3>
        <svg width="100%" height="220" viewBox="0 0 440 220" style="margin:auto; display:block">
          <!-- 20 cols x 10 rows grid -->
          ${Array.from({ length: 11 }, (_, r) => `
            <line x1="20" y1="${10 + r * 20}" x2="420" y2="${10 + r * 20}" stroke="${r === 0 || r === 10 ? '#0f172a' : '#cbd5e1'}" stroke-width="${r === 0 || r === 10 ? 2 : 1}" />
          `).join("")}
          ${Array.from({ length: 21 }, (_, c) => `
            <line x1="${20 + c * 20}" y1="10" x2="${20 + c * 20}" y2="210" stroke="${c === 0 || c === 10 || c === 20 ? '#0f172a' : '#cbd5e1'}" stroke-width="${c === 10 ? 2 : 1}" />
            ${c < 20 ? `<text x="${30 + c * 20}" y="8" font-size="6.5" font-weight="700" text-anchor="middle" fill="#64748b">${c + 1}</text>` : ''}
          `).join("")}
          ${Array.from({ length: 10 }, (_, r) => `
            <text x="14" y="${24 + r * 20}" font-size="6.5" font-weight="700" text-anchor="end" fill="#64748b">${r + 1}</text>
          `).join("")}
        </svg>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.12in; margin-bottom:0.1in">
        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Rules (English)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Roll two dice (or draw 2 numbers, e.g. 6 and 7).</li>
            <li>Use the Distributive Property to split into two friendly chunks: e.g. 6 × 7 = (6 × 5) + (6 × 2) = 30 + 12 = 42 squares.</li>
            <li>Color both rectangular chunks on the shared grid using your player color.</li>
            <li>Player who captures the most total squares wins!</li>
          </ol>
        </div>

        <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.08in; background:#f8fafc">
          <h3 style="margin:0 0 3px; font-size:9.5pt; color:#0f172a">📜 Reglas (Español)</h3>
          <ol style="margin:0; padding-left:0.16in; font-size:7.5pt; line-height:1.4; color:#334155">
            <li>Lanza dos dados (o toma 2 números, ej. 6 y 7).</li>
            <li>Usa la propiedad distributiva: 6 × 7 = (6 × 5) + (6 × 2) = 30 + 12 = 42 casillas.</li>
            <li>Colorea ambos rectángulos en la cuadrícula con tu color.</li>
            <li>¡Gana quien capture más casillas totales!</li>
          </ol>
        </div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Roll &amp; Split Array</span>
        <span>Page 1 of 2</span>
      </footer>
    </article>

    <article class="tpt-print-page">
      <div class="tpt-header-row">
        <div>
          <h1>📝 Distributive Property Equation Ledger</h1>
          <p style="margin:2px 0 0; font-size:9.5pt; color:#475569">Record your multiplication splits for each round below.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.1in; margin-top:0.1in">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map((r) => `
          <div style="border:1.5px solid #cbd5e1; border-radius:8px; padding:0.1in; background:#ffffff">
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:9pt; margin-bottom:4px">
              <span>Round ${r}</span>
              <span style="color:#64748b">Player: [ ] 1  [ ] 2</span>
            </div>
            <p style="margin:0 0 4px; font-size:8pt; color:#475569">Dice Rolled: <strong>___ × ___</strong></p>
            <div style="font-family:monospace; font-weight:700; font-size:9pt; background:#f8fafc; padding:6px; border-radius:4px; border:1px dashed #cbd5e1">
              ( ___ × 5 ) + ( ___ × ___ ) = ___ + ___ = <strong>___ squares</strong>
            </div>
          </div>
        `).join("")}
      </div>

      <div style="border:1.5px solid #16a34a; border-radius:8px; padding:0.1in; background:#f0fdf4; margin-top:0.15in">
        <h3 style="margin:0 0 4px; font-size:9.5pt; color:#166534">💬 Partner Math Talk</h3>
        <p style="margin:0; font-size:8pt; color:#14532d; line-height:1.4">
          <em>“I split 7 into 5 and 2 because 5s and 2s are friendly facts I know instantly. My array has 30 squares in the first chunk and 12 in the second chunk for 42 total squares.”</em>
        </p>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #cbd5e1; padding-top:0.08in; margin-top:0.1in; font-size:8pt; color:#64748b">
        <span>EduWonderLab Math Fluency Lab · Distributive Ledger</span>
        <span>Page 2 of 2</span>
      </footer>
    </article>
  `);
}

function printPartnerGame(gameType = "war", grade = state.grade || 4) {
  if (gameType === "war") printFractionWar(grade);
  else if (gameType === "tug") printIntegerTugOfWar(grade);
  else if (gameType === "capture") printFactorCapture(grade);
  else if (gameType === "array") printRollAndSplitArray(grade);
}

const gcd = (a, b) => { let x = Math.abs(a), y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x || 1; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

const InteractiveSolver = {
  canSolve(item) {
    if (!item) return false;
    const q = bareText(item);
    if (/find the lcm of \d+ and \d+/i.test(q)) return true;
    if (/find the gcf of \d+ and \d+/i.test(q)) return true;

    // Multi-digit whole number division (Standard Algorithm):
    const divMatch = q.replace(/\s*=\s*\?.*$/, "").match(/(?<![\d.])(\d+)\s*[÷/]\s*(\d+)(?![\d.])/);
    if (divMatch && !q.includes("/")) {
      const a = Number(divMatch[1]);
      const b = Number(divMatch[2]);
      if (a >= 10 && b >= 2 && a > b) return true;
    }

    // Two-step or one-step algebra linear equations:
    const qNorm = q.replace(/\u2212/g, "-");
    if (/^(?:(\d*)x\s*([+\-])\s*(\d+)|(\d+)x|x\s*([+\-])\s*(\d+)|x\s*[÷/]\s*(\d+))\s*=\s*(-?\d+)/i.test(qNorm)) {
      return true;
    }

    // Signed integers (addition/subtraction with negative numbers):
    const intMatch = qNorm.match(/^(-?\d+)\s*([+\-])\s*\(?(-?\d+)\)?\s*=\s*\?/i);
    if (intMatch) {
      const a = Number(intMatch[1]);
      const b = Number(intMatch[3]);
      if (a < 0 || b < 0 || (intMatch[2] === "-" && a < b)) return true;
    }

    // Stacked addition and subtraction of whole numbers and decimals (vertical-columns.js).
    const stacked = extractProblem(item);
    if (stacked?.kind === "binary" && ["+", "-"].includes(stacked.op)) {
      const spec = columnSpec(stacked.op, [stacked.aText, stacked.bText]);
      if (spec && spec.terms.some((x) => x.replace(".", "").length >= 2)) return true;
    }

    // Fraction division: Keep, Change, Flip
    if (/(\d+)\/(\d+)\s*[×*÷/]\s*(\d+)\/(\d+)/.test(q)) return true;

    // Multi-digit whole-number multiplication (partial products).
    const product = plainProduct(q);
    if (product && canMultiply(product[0], product[1])) return true;

    return false;
  },

  render(item, container) {
    if (!container || !item) return;
    const q = bareText(item);
    const live = () => answerStillHidden(state.item, state.itemDone);

    // 1. Grade 6 LCM Prime Factorization Workspace
    const lcmMatch = q.match(/find the lcm of (\d+) and (\d+)/i);
    if (lcmMatch) {
      const a = Number(lcmMatch[1]);
      const b = Number(lcmMatch[2]);
      const pa = primeFactors(a);
      const pb = primeFactors(b);
      const ans = lcm(a, b);

      container.innerHTML = `
        <div class="solver-header">
          <strong>🌳 Prime Factorization Method for LCM(${a}, ${b})</strong>
          <span class="solver-hint-tag">Grade 6 Essential Standard</span>
        </div>
        <div class="lcm-prime-scaffold">
          <div class="lcm-row">
            <span>1) Factor <strong>${a}</strong> into primes:</span>
            ${pa.map((p, idx) => `<input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${p}" data-group="a" aria-label="Prime factor ${idx + 1} of ${a}" placeholder="?" />${idx < pa.length - 1 ? " × " : ""}`).join("")}
            <span class="lcm-status" data-status="a"></span>
          </div>
          <div class="lcm-row">
            <span>2) Factor <strong>${b}</strong> into primes:</span>
            ${pb.map((p, idx) => `<input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${p}" data-group="b" aria-label="Prime factor ${idx + 1} of ${b}" placeholder="?" />${idx < pb.length - 1 ? " × " : ""}`).join("")}
            <span class="lcm-status" data-status="b"></span>
          </div>
          <div class="lcm-tip-banner">
            💡 <strong>Help with primes:</strong> The prime numbers are 2, 3, 5, 7, 11, 13... If a number is even, divide by 2!
          </div>
          <div class="lcm-row" style="margin-top:0.5rem">
            <span>3) Multiply the highest powers of each prime:</span>
            <span>LCM(${a}, ${b}) = </span>
            <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${ans}" data-group="lcm-final" style="width:72px" placeholder="LCM" />
            <button type="button" class="outline-action" id="lcm-copy-ans" style="display:none">Copy to Answer</button>
          </div>
        </div>
      `;

      container.querySelectorAll(".lcm-prime-input").forEach((inp) => {
        inp.addEventListener("input", () => {
          const expected = inp.dataset.target;
          if (inp.value.trim() === expected) {
            inp.classList.add("is-ok");
            inp.readOnly = true;
            chime("step");
            const finalInp = container.querySelector('[data-group="lcm-final"]');
            if (finalInp && finalInp.value.trim() === String(ans)) {
              finalInp.classList.add("is-ok");
              els.answerInput.value = String(ans);
              chime("good");
              const copyBtn = container.querySelector("#lcm-copy-ans");
              if (copyBtn) {
                copyBtn.style.display = "inline-block";
                copyBtn.textContent = "✓ Copied to answer!";
              }
            }
          }
        });
      });
      return;
    }

    // 2. Stacked addition / subtraction: the problem's numbers lined up by place value, empty boxes to fill.
    const stacked = extractProblem(item);
    const stackedSpec = stacked?.kind === "binary" && ["+", "-"].includes(stacked.op) ? columnSpec(stacked.op, [stacked.aText, stacked.bText]) : null;
    if (stackedSpec) {
      const adding = stackedSpec.op === "+";
      container.innerHTML = `
        <div class="solver-header">
          <strong>🧮 ${adding ? t("Add in columns") : t("Subtract in columns")}</strong>
          <span class="solver-hint-tag">${t("Fill the regrouping boxes and the answer boxes, right to left")}</span>
        </div>
        ${verticalHtml(stackedSpec)}
      `;
      return;
    }

    // 3b. Standard-algorithm multiplication (partial products), loaded with the problem's own two numbers.
    const product = plainProduct(q);
    if (product && canMultiply(product[0], product[1])) {
      const [a, b] = product;
      container.innerHTML = `
        <div class="solver-header">
          <strong>✖️ ${t("Multiply with the standard algorithm")}</strong>
          <span class="solver-hint-tag">${t("Multiply by each digit of the bottom number, then add the rows")}</span>
        </div>
        ${multiplyHtml(a, b)}
      `;
      wireMultiply(container, a, b, {
        onStep: () => chime("step"),
        onSolved: (product) => {
          els.answerInput.value = String(product);
          chime("good");
        },
      });
      return;
    }

    // 4. Fractions (Multiplication or Division)
    const fracMatch = q.match(/(\d+)\/(\d+)\s*([×*÷/])\s*(\d+)\/(\d+)/);
    if (fracMatch) {
      const a = Number(fracMatch[1]);
      const b = Number(fracMatch[2]);
      const op = fracMatch[3] === "÷" || fracMatch[3] === "/" ? "÷" : "×";
      const c = Number(fracMatch[4]);
      const d = Number(fracMatch[5]);

      if (op === "÷") {
        const top = a * d;
        const bot = b * c;
        const divGcd = gcd(top, bot);
        const simpTop = top / divGcd;
        const simpBot = bot / divGcd;
        const finalAns = simpBot === 1 ? String(simpTop) : `${simpTop}/${simpBot}`;

        container.innerHTML = `
          <div class="solver-header">
            <strong>🍕 Interactive Fraction Division: Keep, Change, Flip!</strong>
            <span class="solver-hint-tag">Type the flipped fraction</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; align-items:center; font-size:1.25rem; font-weight:800">
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Keep: <strong>${a}/${b}</strong></span>
              <span>×</span>
              <span>Flip: </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${d}" style="width:48px" placeholder="?" title="Flipped numerator" />
              <span>/</span>
              <input type="text" class="lcm-prime-input" data-frac-target="${c}" style="width:48px" placeholder="?" title="Flipped denominator" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Multiply: </span>
              <span>(${a} × ${d}) / (${b} × ${c}) = </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${top}" style="width:58px" placeholder="?" />
              <span>/</span>
              <input type="text" class="lcm-prime-input" data-frac-target="${bot}" style="width:58px" placeholder="?" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Simplified Final Answer: </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${finalAns}" style="width:84px" placeholder="?" />
            </div>
          </div>
        `;
      } else {
        const top = a * c;
        const bot = b * d;
        const g = gcd(top, bot);
        const simpTop = top / g;
        const simpBot = bot / g;
        const finalAns = simpBot === 1 ? String(simpTop) : `${simpTop}/${simpBot}`;

        container.innerHTML = `
          <div class="solver-header">
            <strong>🍕 Interactive Fraction Multiplication: Straight Across!</strong>
            <span class="solver-hint-tag">Top × Top, Bottom × Bottom</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; align-items:center; font-size:1.25rem; font-weight:800">
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Multiply Numerators: ${a} × ${c} = </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${top}" style="width:58px" placeholder="?" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Multiply Denominators: ${b} × ${d} = </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${bot}" style="width:58px" placeholder="?" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Simplified Final Answer: </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${finalAns}" style="width:84px" placeholder="?" />
            </div>
          </div>
        `;
      }

      container.querySelectorAll("[data-frac-target]").forEach((inp) => {
        inp.addEventListener("input", () => {
          if (inp.value.trim() === inp.dataset.fracTarget) {
            inp.classList.add("is-ok");
            chime("step");
            const inputs = [...container.querySelectorAll("[data-frac-target]")];
            if (inputs.every((i) => i.classList.contains("is-ok"))) {
              const last = inputs[inputs.length - 1];
              els.answerInput.value = last.dataset.fracTarget;
              chime("good");
            }
          }
        });
      });
      return;
    }

    // 5. Grade 6 GCF Prime Factorization Venn Diagram Workspace
    const gcfMatch = q.match(/find the gcf of (\d+) and (\d+)/i);
    if (gcfMatch) {
      const a = Number(gcfMatch[1]);
      const b = Number(gcfMatch[2]);
      const pa = primeFactors(a);
      const pb = primeFactors(b);
      const shared = [];
      const pbCopy = [...pb];
      for (const factor of pa) {
        const idx = pbCopy.indexOf(factor);
        if (idx !== -1) {
          shared.push(factor);
          pbCopy.splice(idx, 1);
        }
      }
      const onlyA = [...pa];
      const onlyB = [...pb];
      for (const factor of shared) {
        const ia = onlyA.indexOf(factor);
        if (ia !== -1) onlyA.splice(ia, 1);
        const ib = onlyB.indexOf(factor);
        if (ib !== -1) onlyB.splice(ib, 1);
      }
      const ans = gcd(a, b);

      container.innerHTML = `
        <div class="solver-header">
          <strong>🌳 Prime Factorization Venn Diagram for GCF(${a}, ${b})</strong>
          <span class="solver-hint-tag">Grade 6 Essential Standard</span>
        </div>
        <div class="gcf-venn-scaffold">
          <div class="gcf-factors-summary">
            <div><strong>Primes of ${a}:</strong> ${pa.join(" × ")}</div>
            <div><strong>Primes of ${b}:</strong> ${pb.join(" × ")}</div>
          </div>
          <div class="venn-diagram-wrap" aria-label="Venn Diagram showing shared prime factors">
            <div class="venn-circle venn-left">
              <span class="venn-circle-label">Only ${a}</span>
              <div class="venn-chip-group">
                ${onlyA.length ? onlyA.map((p) => `<span class="venn-chip factor-a">${p}</span>`).join("") : `<span class="venn-empty">none</span>`}
              </div>
            </div>
            <div class="venn-intersection">
              <span class="venn-intersection-label">Shared Primes</span>
              <div class="venn-chip-group">
                ${shared.length ? shared.map((p) => `<span class="venn-chip factor-shared">${p}</span>`).join("<span class=\"venn-mult\">×</span>") : `<span class="venn-empty">1</span>`}
              </div>
            </div>
            <div class="venn-circle venn-right">
              <span class="venn-circle-label">Only ${b}</span>
              <div class="venn-chip-group">
                ${onlyB.length ? onlyB.map((p) => `<span class="venn-chip factor-b">${p}</span>`).join("") : `<span class="venn-empty">none</span>`}
              </div>
            </div>
          </div>
          <div class="solver-calc-row">
            <span>Multiply the shared prime factors: <strong>GCF(${a}, ${b}) =</strong></span>
            <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${ans}" data-group="gcf-final" style="width:72px" placeholder="GCF" />
            <button type="button" class="outline-action" id="gcf-copy-ans" style="display:none">Copy to Answer</button>
          </div>
        </div>
      `;

      const gcfInp = container.querySelector('[data-group="gcf-final"]');
      gcfInp?.addEventListener("input", () => {
        if (gcfInp.value.trim() === String(ans)) {
          gcfInp.classList.add("is-ok");
          els.answerInput.value = String(ans);
          chime("good");
          const copyBtn = container.querySelector("#gcf-copy-ans");
          if (copyBtn) {
            copyBtn.style.display = "inline-block";
            copyBtn.textContent = "✓ Copied to answer!";
          }
        }
      });
      return;
    }

    // 6. Grades 4-5 Standard Algorithm Long Division Bracket
    const divMatch = q.replace(/\s*=\s*\?.*$/, "").match(/(?<![\d.])(\d+)\s*[÷/]\s*(\d+)(?![\d.])/);
    if (divMatch && !q.includes("/")) {
      const dividend = Number(divMatch[1]);
      const divisor = Number(divMatch[2]);
      if (dividend >= 10 && divisor >= 2 && dividend > divisor) {
        const { quotient } = StandardLongDivisionModel.computeSteps(dividend, divisor);
        container.innerHTML = `
          <div class="solver-header">
            <strong>➗ Interactive Standard Algorithm Long Division</strong>
            <span class="solver-hint-tag">Divide → Multiply → Subtract → Bring Down → Repeat</span>
          </div>
          ${StandardLongDivisionModel.renderHtml(dividend, divisor, { isSolver: true, hideAnswer: live() })}
        `;

        const finalInp = container.querySelector('[data-group="div-final"]');
        const copyBtn = container.querySelector("#div-copy-ans");

        const markSolverSolved = () => {
          if (finalInp) {
            finalInp.value = String(quotient);
            finalInp.classList.add("is-ok");
          }
          els.answerInput.value = String(quotient);
          if (copyBtn) {
            copyBtn.style.display = "inline-block";
            copyBtn.textContent = "✓ Solved & Copied to Answer!";
          }
        };

        StandardLongDivisionModel.wireEvents(container, dividend, divisor, markSolverSolved, { hideAnswer: live() });

        finalInp?.addEventListener("input", () => {
          if (finalInp.value.trim() === String(quotient)) {
            finalInp.classList.add("is-ok");
            markSolverSolved();
            if (typeof chime === "function") chime("good");
          }
        });

        copyBtn?.addEventListener("click", () => {
          els.answerInput.value = String(quotient);
          if (typeof chime === "function") chime("good");
          copyBtn.textContent = "✓ Copied to Answer!";
        });

        return;
      }
    }

    // 7. Grades 7-8 Algebra Balance Scale Solver
    const qNorm = q.replace(/\u2212/g, "-");
    const eqMatch = qNorm.match(/^(?:(\d*)x\s*([+\-])\s*(\d+)|(\d+)x|x\s*([+\-])\s*(\d+)|x\s*[÷/]\s*(\d+))\s*=\s*(-?\d+)/i);
    if (eqMatch) {
      let a = 1;
      let b = 0;
      let c = 0;
      let isDiv = false;

      const mLinear = qNorm.match(/^(\d*)x\s*([+\-])\s*(\d+)\s*=\s*(-?\d+)/i);
      const mSingle = qNorm.match(/^(\d+)x\s*=\s*(-?\d+)/i);
      const mShift = qNorm.match(/^x\s*([+\-])\s*(\d+)\s*=\s*(-?\d+)/i);
      const mDiv = qNorm.match(/^x\s*[÷/]\s*(\d+)\s*=\s*(-?\d+)/i);

      if (mLinear) {
        a = mLinear[1] === "" ? 1 : Number(mLinear[1]);
        b = Number(mLinear[3]) * (mLinear[2] === "-" ? -1 : 1);
        c = Number(mLinear[4]);
      } else if (mSingle) {
        a = Number(mSingle[1]);
        b = 0;
        c = Number(mSingle[2]);
      } else if (mShift) {
        a = 1;
        b = Number(mShift[2]) * (mShift[1] === "-" ? -1 : 1);
        c = Number(mShift[3]);
      } else if (mDiv) {
        isDiv = true;
        a = Number(mDiv[1]);
        c = Number(mDiv[2]);
      }

      const solution = isDiv ? c * a : (c - b) / a;

      container.innerHTML = `
        <div class="solver-header">
          <strong>⚖️ Interactive Equation Balance Scale</strong>
          <span class="solver-hint-tag">Apply inverse operations to both sides to maintain equilibrium</span>
        </div>
        <div class="eq-balance-scaffold">
          <div class="eq-balance-action-bar">
            ${b !== 0 ? `
              <button type="button" class="mini-tool-btn eq-action-btn" data-eq-action="undo-b" style="background:#dbeafe; border-color:#93c5fd; color:#1e40af; font-weight:800">
                ${b > 0 ? `➖ Subtract ${b} From Both Sides` : `➕ Add ${Math.abs(b)} To Both Sides`}
              </button>
            ` : ""}
            ${a > 1 && !isDiv ? `
              <button type="button" class="mini-tool-btn eq-action-btn" data-eq-action="undo-a" ${b !== 0 ? "disabled" : ""} style="background:#dcfce7; border-color:#86efac; color:#166534; font-weight:800">
                ➗ Divide Both Sides by ${a}
              </button>
            ` : ""}
            ${isDiv ? `
              <button type="button" class="mini-tool-btn eq-action-btn" data-eq-action="undo-div" style="background:#dcfce7; border-color:#86efac; color:#166534; font-weight:800">
                ✖️ Multiply Both Sides by ${a}
              </button>
            ` : ""}
            <button type="button" class="mini-tool-btn" data-eq-action="tilt-left" title="Demonstrate what happens if you change only one side">
              ⚠️ Change Left Only (Tilt!)
            </button>
            <button type="button" class="mini-tool-btn" data-eq-action="reset">
              ↺ Reset Scale
            </button>
          </div>

          <div class="eq-balance-status-banner balanced" id="eq-scale-status">
            ⚖️ Scale in Equilibrium: ${a === 1 ? "x" : `${a}x`}${b ? (b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`) : ""} = ${c}
          </div>

          <div class="balance-scale-svg-wrap">
            <svg class="balance-scale-svg" viewBox="0 0 400 160" aria-label="Balance scale illustration">
              <!-- Base and Fulcrum -->
              <polygon points="185,150 215,150 200,90" fill="#64748b" />
              <circle cx="200" cy="90" r="7" fill="#0f172a" />
              <!-- Level Beam with Animated Rotate -->
              <g id="scale-beam-group" style="transform-origin: 200px 90px; transform: rotate(0deg); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <line x1="60" y1="90" x2="340" y2="90" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
                <!-- Left Chains & Pan -->
                <line x1="75" y1="90" x2="50" y2="125" stroke="#94a3b8" stroke-width="2" />
                <line x1="75" y1="90" x2="100" y2="125" stroke="#94a3b8" stroke-width="2" />
                <path d="M 40,125 Q 75,145 110,125 Z" fill="#3b82f6" opacity="0.85" />
                <!-- Right Chains & Pan -->
                <line x1="325" y1="90" x2="300" y2="125" stroke="#94a3b8" stroke-width="2" />
                <line x1="325" y1="90" x2="350" y2="125" stroke="#94a3b8" stroke-width="2" />
                <path d="M 290,125 Q 325,145 360,125 Z" fill="#10b981" opacity="0.85" />
                <!-- Left Pan Label -->
                <text x="75" y="120" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a" id="scale-left-label">${isDiv ? `x ÷ ${a}` : `${a === 1 ? "x" : `${a}x`}${b ? (b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`) : ""}`}</text>
                <!-- Right Pan Label -->
                <text x="325" y="120" text-anchor="middle" font-size="14" font-weight="bold" fill="#065f46" id="scale-right-label">${c}</text>
              </g>
            </svg>
          </div>
          <div class="eq-steps-workspace">
            ${b !== 0 ? `
              <div class="eq-step-row">
                <span>1) Undo ${b > 0 ? `adding ${b}` : `subtracting ${Math.abs(b)}`}: <strong>${b > 0 ? `Subtract ${b}` : `Add ${Math.abs(b)}`}</strong> from both sides:</span>
                <div class="eq-calc-subrow">
                  <span>${a === 1 ? "x" : `${a}x`} = ${c} ${b > 0 ? "−" : "+"} ${Math.abs(b)} = </span>
                  <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${c - b}" data-group="eq-step1" style="width:68px" placeholder="?" />
                </div>
              </div>
            ` : ""}
            ${a > 1 && !isDiv ? `
              <div class="eq-step-row">
                <span>${b !== 0 ? "2)" : "1)"} Undo multiplying by ${a}: <strong>Divide both sides by ${a}</strong>:</span>
                <div class="eq-calc-subrow">
                  <span>x = ${c - b} ÷ ${a} = </span>
                  <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${solution}" data-group="eq-step2" style="width:68px" placeholder="x = ?" />
                </div>
              </div>
            ` : ""}
            ${isDiv ? `
              <div class="eq-step-row">
                <span>1) Undo dividing by ${a}: <strong>Multiply both sides by ${a}</strong>:</span>
                <div class="eq-calc-subrow">
                  <span>x = ${c} × ${a} = </span>
                  <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${solution}" data-group="eq-step2" style="width:68px" placeholder="x = ?" />
                </div>
              </div>
            ` : ""}
            <div class="solver-calc-row">
              <span>Solution: <strong>x =</strong></span>
              <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${solution}" data-group="eq-final" style="width:72px" placeholder="x" />
              <button type="button" class="outline-action" id="eq-copy-ans" style="display:none">Copy to Answer</button>
            </div>
          </div>
        </div>
      `;

      const rightLabel = container.querySelector("#scale-right-label");
      const leftLabel = container.querySelector("#scale-left-label");
      const beamGroup = container.querySelector("#scale-beam-group");
      const scaleStatus = container.querySelector("#eq-scale-status");
      const step1Inp = container.querySelector('[data-group="eq-step1"]');
      const step2Inp = container.querySelector('[data-group="eq-step2"]');
      const finalInp = container.querySelector('[data-group="eq-final"]');
      const undoABtn = container.querySelector('[data-eq-action="undo-a"]');

      // The scale carries out the learner's choice but never works out the number: the new right side is shown
      // as the sum the learner still has to do, and they type the result in the box below.
      const lhs = a === 1 ? "x" : `${a}x`;
      const showStep = (right, left, message) => {
        if (beamGroup) beamGroup.style.transform = "rotate(0deg)";
        if (rightLabel) rightLabel.textContent = right;
        if (leftLabel) leftLabel.textContent = left;
        if (scaleStatus) {
          scaleStatus.className = "eq-balance-status-banner balanced";
          scaleStatus.textContent = message;
        }
        chime("step");
      };
      container.querySelector('[data-eq-action="undo-b"]')?.addEventListener("click", () => {
        const sum = `${c} ${b > 0 ? "−" : "+"} ${Math.abs(b)}`;
        showStep(sum, lhs, t("Both sides changed the same way: {left} = {right}. Work out the right side and type it below.", { left: lhs, right: sum }));
        if (undoABtn) undoABtn.disabled = false;
      });

      container.querySelector('[data-eq-action="undo-a"]')?.addEventListener("click", () => {
        const sum = `(${c}${b ? ` ${b > 0 ? "−" : "+"} ${Math.abs(b)}` : ""}) ÷ ${a}`;
        showStep(sum, "x", t("Divided both sides by {a}: x = {right}. Work it out and type x below.", { a, right: sum }));
      });

      container.querySelector('[data-eq-action="undo-div"]')?.addEventListener("click", () => {
        const sum = `${c} × ${a}`;
        showStep(sum, "x", t("Multiplied both sides by {a}: x = {right}. Work it out and type x below.", { a, right: sum }));
      });

      container.querySelector('[data-eq-action="tilt-left"]')?.addEventListener("click", () => {
        if (beamGroup) beamGroup.style.transform = "rotate(10deg)";
        if (scaleStatus) {
          scaleStatus.className = "eq-balance-status-banner unbalanced";
          scaleStatus.textContent = `⚠️ Unbalanced! Left side changed without changing right. In algebra, always do the same thing to BOTH sides!`;
        }
        chime("step");
      });

      container.querySelector('[data-eq-action="reset"]')?.addEventListener("click", () => {
        if (beamGroup) beamGroup.style.transform = "rotate(0deg)";
        if (leftLabel) leftLabel.textContent = isDiv ? `x ÷ ${a}` : `${a === 1 ? "x" : `${a}x`}${b ? (b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`) : ""}`;
        if (rightLabel) rightLabel.textContent = String(c);
        if (scaleStatus) {
          scaleStatus.className = "eq-balance-status-banner balanced";
          scaleStatus.textContent = `⚖️ Scale in Equilibrium: ${a === 1 ? "x" : `${a}x`}${b ? (b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`) : ""} = ${c}`;
        }
        if (step1Inp) { step1Inp.value = ""; step1Inp.classList.remove("is-ok"); }
        if (step2Inp) { step2Inp.value = ""; step2Inp.classList.remove("is-ok"); }
        if (finalInp) { finalInp.value = ""; finalInp.classList.remove("is-ok"); }
        if (undoABtn) undoABtn.disabled = b !== 0;
      });

      step1Inp?.addEventListener("input", () => {
        if (step1Inp.value.trim() === String(c - b)) {
          step1Inp.classList.add("is-ok");
          chime("step");
          if (rightLabel) rightLabel.textContent = String(c - b);
          if (leftLabel) leftLabel.textContent = a === 1 ? "x" : `${a}x`;
          if (a === 1 && finalInp) {
            finalInp.value = String(solution);
            finalInp.classList.add("is-ok");
            els.answerInput.value = String(solution);
            chime("good");
            const copyBtn = container.querySelector("#eq-copy-ans");
            if (copyBtn) {
              copyBtn.style.display = "inline-block";
              copyBtn.textContent = "✓ Copied to answer!";
            }
          }
        }
      });

      step2Inp?.addEventListener("input", () => {
        if (step2Inp.value.trim() === String(solution)) {
          step2Inp.classList.add("is-ok");
          chime("step");
          if (rightLabel) rightLabel.textContent = String(solution);
          if (leftLabel) leftLabel.textContent = "x";
          if (finalInp) {
            finalInp.value = String(solution);
            finalInp.classList.add("is-ok");
            els.answerInput.value = String(solution);
            chime("good");
            const copyBtn = container.querySelector("#eq-copy-ans");
            if (copyBtn) {
              copyBtn.style.display = "inline-block";
              copyBtn.textContent = "✓ Copied to answer!";
            }
          }
        }
      });

      finalInp?.addEventListener("input", () => {
        if (finalInp.value.trim() === String(solution)) {
          finalInp.classList.add("is-ok");
          els.answerInput.value = String(solution);
          chime("good");
          const copyBtn = container.querySelector("#eq-copy-ans");
          if (copyBtn) {
            copyBtn.style.display = "inline-block";
            copyBtn.textContent = "✓ Copied to answer!";
          }
        }
      });
      return;
    }

    // 8. Grade 7 Signed Integers Zero-Pair Board
    const intMatch = qNorm.match(/^(-?\d+)\s*([+\-])\s*\(?(-?\d+)\)?\s*=\s*\?/i);
    if (intMatch) {
      const a = Number(intMatch[1]);
      const op = intMatch[2];
      const b = Number(intMatch[3]);
      const ans = op === "+" ? a + b : a - b;

      const term2 = op === "-" ? -b : b;
      const posCount = (a > 0 ? a : 0) + (term2 > 0 ? term2 : 0);
      const negCount = (a < 0 ? Math.abs(a) : 0) + (term2 < 0 ? Math.abs(term2) : 0);
      const zeroPairs = Math.min(posCount, negCount);

      const displayPos = Math.min(15, posCount);
      const displayNeg = Math.min(15, negCount);
      const displayPairs = Math.min(displayPos, displayNeg);

      container.innerHTML = `
        <div class="solver-header">
          <strong>🟡🔴 Interactive Zero-Pair Cancellation Counter Board</strong>
          <span class="solver-hint-tag">Each (+) and (−) cancel to make 0</span>
        </div>
        <div class="integer-chips-scaffold">
          <div class="chips-strategy-note">
            ${op === "-" ? `💡 <strong>Subtracting ${b}</strong> is the same as <strong>adding ${term2}</strong>: ${a} + (${term2})` : `💡 Combining <strong>${posCount} positives</strong> and <strong>${negCount} negatives</strong>`}
          </div>
          <div class="chips-board">
            <div class="chips-column pos-column">
              <span class="chips-col-title">Positives (+) [${posCount}]</span>
              <div class="chips-grid" id="pos-chips-grid">
                ${Array.from({ length: displayPos }, (_, i) => `<span class="chip-item chip-pos" data-chip-idx="${i}">+</span>`).join("")}
              </div>
            </div>
            <div class="chips-column neg-column">
              <span class="chips-col-title">Negatives (−) [${negCount}]</span>
              <div class="chips-grid" id="neg-chips-grid">
                ${Array.from({ length: displayNeg }, (_, i) => `<span class="chip-item chip-neg" data-chip-idx="${i}">−</span>`).join("")}
              </div>
            </div>
          </div>
          <div class="chips-actions">
            <button type="button" class="primary-action chips-cancel-action" id="cancel-zero-pairs-btn">
              ⚡ Cancel ${zeroPairs} Zero Pair${zeroPairs === 1 ? "" : "s"} (+ &amp; − = 0)
            </button>
            <span class="chips-cancel-status" id="chips-cancel-status"></span>
          </div>
          <div class="solver-calc-row">
            <span>Result after cancelling zero pairs: <strong>${a} ${op === "-" ? "−" : "+"} ${b < 0 ? `(${b})` : b} =</strong></span>
            <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${ans}" data-group="int-final" style="width:72px" placeholder="?" />
            <button type="button" class="outline-action" id="int-copy-ans" style="display:none">Copy to Answer</button>
          </div>
        </div>
      `;

      const cancelBtn = container.querySelector("#cancel-zero-pairs-btn");
      const statusSpan = container.querySelector("#chips-cancel-status");
      const intFinalInp = container.querySelector('[data-group="int-final"]');

      cancelBtn?.addEventListener("click", () => {
        chime("step");
        container.querySelectorAll(".chip-item").forEach((ch) => {
          const idx = Number(ch.dataset.chipIdx);
          if (idx < displayPairs) {
            ch.classList.add("is-cancelled");
          } else {
            ch.classList.add("is-active-remainder");
          }
        });
        cancelBtn.disabled = true;
        // The board cancels the pairs; counting what is left (and its sign) is the learner's step.
        if (statusSpan) {
          statusSpan.innerHTML = `✓ <strong>${t("{n} zero pair(s) cancelled", { n: zeroPairs })}</strong>. ${t("Count the chips that are left and type the result below.")}`;
        }
      });

      intFinalInp?.addEventListener("input", () => {
        if (intFinalInp.value.trim() === String(ans)) {
          intFinalInp.classList.add("is-ok");
          els.answerInput.value = String(ans);
          chime("good");
          const copyBtn = container.querySelector("#int-copy-ans");
          if (copyBtn) {
            copyBtn.style.display = "inline-block";
            copyBtn.textContent = "✓ Copied to answer!";
          }
        }
      });
      return;
    }

    // Fallback
    container.innerHTML = `
      <div class="solver-header">
        <strong>✍️ Interactive Step-by-Step Workspace</strong>
        <span class="solver-hint-tag">Work it out step-by-step</span>
      </div>
      <p style="margin:0.5rem 0; font-size:0.95rem; color:#334155">${escapeHtml(item.hint || "Take it one step at a time.")}</p>
    `;
  }
};

function renderMultiStrategyComparison(item) {
  if (!item) return "";
  const q = String(item.expr || item.question || "").replaceAll(",", "");

  let stratAName = "Decomposition & Friendly Numbers";
  let stratAIcon = "🧩";
  let stratADesc = "Break numbers into parts (like tens, ones, or friendly 5s) that are easy to compute mentally.";
  let stratAMath = "Decompose into friendly parts";

  let stratBName = "Visual Model & Number Line";
  let stratBIcon = "📐";
  let stratBDesc = "Use an interactive representation (number line, array grid, or chips) to prove the result.";
  let stratBMath = "Verify with visual model";

  const mulMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/);
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/);
  const addMatch = q.match(/(\d+)\s*[+]\s*(\d+)/);
  const subMatch = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
  const fracMatch = q.match(/(\d+)\/(\d+)\s*([+−\-])\s*(\d+)\/(\d+)/);
  const intMatch = q.match(/(-?\d+)\s*([+−\-])\s*(-?\d+)/);
  const eqMatch = q.match(/([a-zA-Z]|\?|\bx\b)\s*([+−\-×÷=])/);

  if (mulMatch) {
    const a = Number(mulMatch[1]);
    const b = Number(mulMatch[2]);
    const maxVal = Math.max(a, b);
    const minVal = Math.min(a, b);
    const split = maxVal > 10 ? 10 : 5;
    const rem = maxVal - split;
    stratAName = "Distributive Splitting (Friendly 5s & 10s)";
    stratAIcon = "✂️";
    stratADesc = `Split ${maxVal} into ${split} + ${rem}. Multiply ${minVal} by each part!`;
    stratAMath = `${minVal} × ${maxVal} = (${minVal} × ${split}) + (${minVal} × ${rem}) = ${minVal * split} + ${minVal * rem} = ${a * b}`;

    stratBName = "Area Model / Array Rows";
    stratBIcon = "📦";
    stratBDesc = "Picture an array grid of rows and columns, or double/halve the factors.";
    stratBMath = `${a} rows of ${b} units = ${a * b} total units`;
  } else if (divMatch) {
    const a = Number(divMatch[1]);
    const b = Number(divMatch[2]);
    stratAName = "Think Multiplication Backwards";
    stratAIcon = "🧠";
    stratADesc = `Ask: What factor times ${b} equals ${a}?`;
    stratAMath = `${b} × ? = ${a} ➔ ? = ${b > 0 ? Math.floor(a / b) : 0}`;

    stratBName = "Standard Algorithm Cycle";
    stratBIcon = "➗";
    stratBDesc = "Divide, Multiply, Subtract, Bring Down, and Repeat for each place value.";
    stratBMath = `${b} ) ${a} ➔ ${b > 0 ? Math.floor(a / b) : 0}${a % b ? ` R${a % b}` : ""}`;
  } else if (fracMatch) {
    const [, a, b, op, c, d] = fracMatch;
    stratAName = "Common Denominator Grid";
    stratAIcon = "🧩";
    stratADesc = "Cut both fraction bars into matching slice sizes so you can combine them.";
    stratAMath = `Convert ${a}/${b} and ${c}/${d} to like denominator slices`;

    stratBName = "Benchmark Estimation";
    stratBIcon = "⚖️";
    stratBDesc = "Compare fractions against 0, 1/2, and 1 to estimate the size before calculating.";
    stratBMath = `Compare relative to 1/2 benchmark on number line`;
  } else if (addMatch) {
    const a = Number(addMatch[1]);
    const b = Number(addMatch[2]);
    stratAName = "Make a Ten Strategy";
    stratAIcon = "🔟";
    stratADesc = `Take from the smaller number to round the bigger number (${Math.max(a, b)}) up to the next ten.`;
    stratAMath = `Round to nearest 10, then add leftover`;

    stratBName = "Open Number Line Jump";
    stratBIcon = "🦘";
    stratBDesc = `Start at ${Math.max(a, b)} and jump forward by ${Math.min(a, b)} in friendly hops.`;
    stratBMath = `${Math.max(a, b)} + ${Math.min(a, b)} = ${a + b}`;
  } else if (subMatch) {
    const a = Number(subMatch[1]);
    const b = Number(subMatch[2]);
    stratAName = "Counting Up (Distance)";
    stratAIcon = "📏";
    stratADesc = `Start at the smaller number (${b}) and count up to ${a} to find the distance.`;
    stratAMath = `${b} + ? = ${a} ➔ Distance = ${a - b}`;

    stratBName = "Jump Back in Friendly Hops";
    stratBIcon = "⏪";
    stratBDesc = `Start at ${a}, jump back tens, then jump back leftover ones.`;
    stratBMath = `Jump back tens first, then remaining ones`;
  } else if (intMatch && (q.includes("-") || q.includes("−"))) {
    stratAName = "Zero-Pair Chips Cancellation";
    stratAIcon = "⚡";
    stratADesc = "Pair up positive and negative chips. Each (+1) and (-1) cancel out to 0!";
    stratAMath = "(+1) + (-1) = 0 (Zero Pair)";

    stratBName = "Number Line Direction Walk";
    stratBIcon = "🚶";
    stratBDesc = "Face right for positive, face left for negative; walk forward for addition, backward for subtraction.";
    stratBMath = "Opposite signs reverse direction";
  } else if (eqMatch) {
    stratAName = "Pan Balance Equilibrium";
    stratAIcon = "⚖️";
    stratADesc = "Whatever you do to one side of the scale, do the exact same thing to the other side.";
    stratAMath = "Undo operations symmetrically on both sides";

    stratBName = "Cover-Up / Working Backwards";
    stratBIcon = "🔍";
    stratBDesc = "Cover the variable with your finger and ask what value is needed to make the statement true.";
    stratBMath = "Isolate unknown by reversing operations";
  }

  return `
    <details class="multi-strategy-compare-wrap">
      <summary class="multi-strategy-summary">
        <span>⚖️</span> <strong>Compare 2 Valid Strategies</strong>
        <span class="multi-strat-pill">Multiple Pathways</span>
      </summary>
      <div class="multi-strategy-grid">
        <div class="strategy-card strat-a">
          <div class="strat-card-badge">${stratAIcon} Strategy A: ${escapeHtml(stratAName)}</div>
          <p class="strat-desc">${escapeHtml(stratADesc)}</p>
          <div class="strat-math-highlight">${escapeHtml(stratAMath)}</div>
        </div>
        <div class="strategy-card strat-b">
          <div class="strat-card-badge">${stratBIcon} Strategy B: ${escapeHtml(stratBName)}</div>
          <p class="strat-desc">${escapeHtml(stratBDesc)}</p>
          <div class="strat-math-highlight">${escapeHtml(stratBMath)}</div>
        </div>
      </div>
    </details>
  `;
}

function renderStudentFriendlyExplanation(item, copy) {
  if (!item) return `<p>${escapeHtml(copy)}</p>`;
  // Before the answer is earned, only capped steps and the model-with-my-numbers button show (live-help.js).
  if (answerStillHidden(item, state.itemDone)) return liveHelpHtml(item, copy);
  const q = String(item.expr || item.question || "").replaceAll(",", "");
  let visualWidget = "";
  let goal = "Break the problem into friendly parts you already know!";
  let tip = item.hint || "Take your time: make a friendly estimate first.";
  let suggestedTool = null;
  let toolLabel = "";

  const divFrac = q.match(/(\d+)\/(\d+)\s*[÷/]\s*(\d+)/) || q.match(/(\d+)\/(\d+)\s*[÷/]\s*(\d+)\/(\d+)/);
  const addSubFrac = q.match(/(\d+)\/(\d+)\s*([+−\-])\s*(\d+)\/(\d+)/);
  const mulMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/) || (item.skill?.op === "mul" || item.skill?.strand === "Multiplication" ? q.match(/(\d+)[^\d]+(\d+)/) : null);
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/) || (item.skill?.op === "div" || item.skill?.strand === "Division" ? q.match(/(\d+)[^\d]+(\d+)/) : null);
  const addMatch = q.match(/(\d+)\s*[+]\s*(\d+)/) || (item.skill?.op === "add" || item.skill?.strand === "Addition" ? q.match(/(\d+)[^\d]+(\d+)/) : null);
  const subMatch = q.match(/(\d+)\s*[−\-]\s*(\d+)/) || (item.skill?.op === "sub" || item.skill?.strand === "Subtraction" ? q.match(/(\d+)[^\d]+(\d+)/) : null);
  const intMatch = q.match(/(-?\d+)\s*([+−\-])\s*(-?\d+)/);
  const eqMatch = q.match(/([a-zA-Z]|\?|\b[xy]\b)\s*([+−\-×÷=])/);
  const isDecimal = /\d+\.\d+/.test(q);
  const isTensOnes = /tens|ones|place value|digit in the/i.test(q);
  const isPercent = /%|percent/i.test(q);

  if (divFrac) {
    let a = Number(divFrac[1]), b = Number(divFrac[2]), c, d;
    if (divFrac[4] !== undefined) {
      c = Number(divFrac[3]);
      d = Number(divFrac[4]);
    } else {
      c = Number(divFrac[3]);
      d = 1;
    }
    goal = "Divide fractions using Keep, Change, Flip!";
    tip = "Never divide fractions directly. Multiply by the reciprocal (the flip) of the second fraction!";
    suggestedTool = "fractions";
    toolLabel = "Fraction Wall";

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="kcf">
        <div class="expl-widget-header">
          <span class="expl-widget-title">🔄 Keep, Change, Flip Reciprocal Model</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-nav-bar" role="tablist">
          <button type="button" class="expl-step-pill is-active" data-expl-kcf="all">👀 All 3 Steps</button>
          <button type="button" class="expl-step-pill" data-expl-kcf="keep">1. Keep ${a}/${b}</button>
          <button type="button" class="expl-step-pill" data-expl-kcf="change">2. Change ÷ to ×</button>
          <button type="button" class="expl-step-pill" data-expl-kcf="flip">3. Flip ${c}/${d} to ${d}/${c}</button>
          <button type="button" class="expl-step-pill" data-expl-kcf="solve">4. Multiply Across</button>
        </div>
        <div class="expl-visual-stage">
          <div class="expl-kcf-row">
            <div class="expl-kcf-card card-keep" data-kcf-card="keep">
              <span class="expl-kcf-label">KEEP</span>
              <span class="expl-kcf-val">${a}/${b}</span>
              <span class="expl-kcf-sub">First fraction</span>
            </div>
            <div class="expl-kcf-card card-change" data-kcf-card="change">
              <span class="expl-kcf-label">CHANGE</span>
              <span class="expl-kcf-val">×</span>
              <span class="expl-kcf-sub">÷ becomes ×</span>
            </div>
            <div class="expl-kcf-card card-flip" data-kcf-card="flip">
              <span class="expl-kcf-label">FLIP</span>
              <span class="expl-kcf-val">${d}/${c}</span>
              <span class="expl-kcf-sub">🔄 Reciprocal</span>
            </div>
            <div class="expl-kcf-card" style="background:#f8fafc; border:2px dashed #cbd5e1" data-kcf-card="result">
              <span class="expl-kcf-label">RESULT</span>
              <span class="expl-kcf-val" style="color:#0369a1">${escapeHtml(item.displayAnswer)}</span>
              <span class="expl-kcf-sub">(${a}×${d})/(${b}×${c})</span>
            </div>
          </div>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Keep, Change, Flip:</strong> Keep ${a}/${b}, change ÷ to ×, and flip ${c}/${d} to its reciprocal ${d}/${c}. Then multiply across: (${a} × ${d}) / (${b} × ${c}) = ${a * d}/${b * c}.
        </div>
      </div>
    `;
  } else if (addSubFrac) {
    const [, aStr, bStr, op, cStr, dStr] = addSubFrac;
    const [a, b, c, d] = [Number(aStr), Number(bStr), Number(cStr), Number(dStr)];
    goal = "Make common denominators so all slices are the same size before combining!";
    tip = "The denominator names the size of each slice. When the denominators match, add or subtract only the top numerators!";
    suggestedTool = "fractions";
    toolLabel = "Fraction Wall";

    const commonDen = Math.abs(b * d) / gcd(b, d);
    const m1 = commonDen / b;
    const m2 = commonDen / d;
    const eq1 = a * m1;
    const eq2 = c * m2;
    const resNum = op === "+" ? eq1 + eq2 : eq1 - eq2;

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="frac-addsub">
        <div class="expl-widget-header">
          <span class="expl-widget-title">🧩 Common Denominator Fraction Bars</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn" data-expl-frac="different">⚠️ Slices Don't Match (${b} vs ${d})</button>
          <button type="button" class="expl-action-btn is-active" data-expl-frac="cut" data-lcd="${commonDen}" data-e1="${eq1}" data-e2="${eq2}" data-op="${op}">🧩 Cut into Equal Slices (LCD = ${commonDen})</button>
          <button type="button" class="expl-action-btn" data-expl-frac="combine" data-res="${resNum}" data-lcd="${commonDen}">➕ Combine Matching Slices</button>
        </div>
        <div class="expl-visual-stage">
          <div class="expl-frac-bars-wrap">
            <div class="expl-frac-bar-row">
              <span class="expl-frac-bar-label">${a}/${b} = ${eq1}/${commonDen}</span>
              <div class="expl-frac-bar-track">
                ${Array.from({ length: Math.min(30, commonDen) }, (_, i) => `<div class="expl-frac-bar-slice ${i < eq1 ? "slice-active" : "slice-empty"}" style="width:${(100 / Math.min(30, commonDen)).toFixed(2)}%"></div>`).join("")}
              </div>
            </div>
            <div class="expl-frac-bar-row">
              <span class="expl-frac-bar-label">${c}/${d} = ${eq2}/${commonDen}</span>
              <div class="expl-frac-bar-track">
                ${Array.from({ length: Math.min(30, commonDen) }, (_, i) => `<div class="expl-frac-bar-slice ${i < eq2 ? "slice-active-2" : "slice-empty"}" style="width:${(100 / Math.min(30, commonDen)).toFixed(2)}%"></div>`).join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Equal Slices:</strong> We cut both bars so all slices are equal ${commonDen}ths! Now combine the top slices: ${eq1} ${op} ${eq2} = ${resNum}/${commonDen} = ${escapeHtml(item.displayAnswer)}.
        </div>
      </div>
    `;
  } else if (divMatch) {
    const a = Number(divMatch[1]);
    const b = Number(divMatch[2]);
    goal = `Divide using the standard algorithm: Divide, Multiply, Subtract, Bring Down, Repeat!`;
    tip = `Think of division like sharing ${a} fairly into ${b} equal piles. Work through one digit at a time from left to right.`;
    suggestedTool = "longdivision";
    toolLabel = "Long Division Solver";

    const quot = b > 0 ? Math.floor(a / b) : 0;
    const rem = b > 0 ? a % b : 0;

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="longdivision">
        <div class="expl-widget-header">
          <span class="expl-widget-title">➗ Standard Algorithm Explorer</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-nav-bar" role="tablist">
          <button type="button" class="expl-step-pill is-active" data-expl-ld-step="divide">➗ 1. Divide</button>
          <button type="button" class="expl-step-pill" data-expl-ld-step="multiply">✖️ 2. Multiply</button>
          <button type="button" class="expl-step-pill" data-expl-ld-step="subtract">➖ 3. Subtract</button>
          <button type="button" class="expl-step-pill" data-expl-ld-step="bringdown">⬇️ 4. Bring Down</button>
          <button type="button" class="expl-step-pill" data-expl-ld-step="repeat">🔁 5. Repeat</button>
        </div>
        <div class="expl-visual-stage" style="padding: 0.5rem 0.2rem">
          ${b > 0 && typeof StandardLongDivisionModel !== "undefined"
            ? StandardLongDivisionModel.renderHtml(a, b, { isSolver: false })
            : `<div style="font-size:1.3rem; font-weight:900; color:#15803d">${a} ÷ ${b} = ${quot}${rem ? ` R${rem}` : ""}</div>`}
        </div>
        <div class="expl-caption-box" role="status">
          <strong>1. Divide:</strong> How many times does ${b} fit into the first part of ${a}? Find the biggest whole number of times. Result is ${quot}${rem ? ` with remainder ${rem}` : ""}.
        </div>
      </div>
    `;
  } else if (mulMatch) {
    const a = Number(mulMatch[1]);
    const b = Number(mulMatch[2]);
    goal = `Break ${a} × ${b} into friendly parts you already know!`;
    tip = a <= 12 && b <= 12 ? `Break hard facts into easy 5-facts and 2-facts you know!` : `Use partial products: multiply tens first, then ones!`;
    suggestedTool = "multigrid";
    toolLabel = "10×10 Grid";

    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const s1 = big > 5 ? 5 : Math.floor(big / 2) || 1;
    const s2 = big - s1;
    const p1 = small * s1;
    const p2 = small * s2;
    const total = small * big;

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="multiplication">
        <div class="expl-widget-header">
          <span class="expl-widget-title">📦 Partitioned Area Box Model</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn is-active" data-expl-mul="split" data-small="${small}" data-big="${big}" data-s1="${s1}" data-s2="${s2}" data-p1="${p1}" data-p2="${p2}">✂️ Split into Friendly ${s1}s & ${s2}s</button>
          <button type="button" class="expl-action-btn" data-expl-mul="grid" data-small="${small}" data-big="${big}">📦 Full Array (${small} × ${big})</button>
          <button type="button" class="expl-action-btn" data-expl-mul="add" data-p1="${p1}" data-p2="${p2}" data-tot="${total}">➕ Add Parts (${p1} + ${p2})</button>
        </div>
        <div class="expl-visual-stage">
          <svg width="100%" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:8px" role="img" aria-label="Area Model Decomposition">
            <rect x="25" y="15" width="200" height="60" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>
            <text x="125" y="42" text-anchor="middle" font-size="12" font-weight="800" fill="#15803d">${small} × ${s1} (Friendly 5s)</text>
            <text x="125" y="62" text-anchor="middle" font-size="16" font-weight="900" fill="#166534">= ${p1}</text>
            
            <rect x="235" y="15" width="120" height="60" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
            <text x="295" y="42" text-anchor="middle" font-size="12" font-weight="800" fill="#1e40af">${small} × ${s2}</text>
            <text x="295" y="62" text-anchor="middle" font-size="16" font-weight="900" fill="#1e3a8a">= ${p2}</text>
          </svg>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Friendly Split:</strong> Think of ${big} as (${s1} + ${s2})! ${small} × ${s1} = ${p1}, and ${small} × ${s2} = ${p2}. Add them together: ${p1} + ${p2} = ${total}!
        </div>
      </div>
    `;
  } else if (intMatch && (q.includes("-") || q.includes("−") || q.includes("negative") || q.includes("integer"))) {
    const a = Number(intMatch[1]);
    const op = intMatch[2];
    const b = Number(intMatch[3]);
    goal = `Combine positive and negative integer counters. Zero pairs cancel out!`;
    tip = `Every positive counter (+1) and negative counter (−1) cancel each other out to zero!`;
    suggestedTool = "integers";
    toolLabel = "Integer Chips Mat";

    const v1 = a;
    const v2 = (op === "-" || op === "−") ? -b : b;
    const total = v1 + v2;
    const pos = (v1 > 0 ? v1 : 0) + (v2 > 0 ? v2 : 0);
    const neg = (v1 < 0 ? -v1 : 0) + (v2 < 0 ? -v2 : 0);
    const pairs = Math.min(pos, neg);
    const rem = total;

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="integers">
        <div class="expl-widget-header">
          <span class="expl-widget-title">⚡ Zero Pairs Counter Board</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn is-active" data-expl-int="cancel" data-pairs="${pairs}" data-rem="${rem}">⚡ Pair & Cancel Zero Pairs</button>
          <button type="button" class="expl-action-btn" data-expl-int="reset">🔄 Show All Counters</button>
        </div>
        <div class="expl-visual-stage">
          <div class="expl-chips-board">
            <div class="expl-chips-row">
              <span style="font-size:0.85rem; font-weight:800; min-width:80px; color:#1e40af">Positives (+):</span>
              ${Array.from({ length: Math.min(10, pos) }, () => `<span class="expl-chip expl-chip-pos">+</span>`).join("")}
              ${pos > 10 ? `<span style="font-weight:800; color:#1e40af">+${pos - 10} more</span>` : ""}
            </div>
            <div class="expl-chips-row">
              <span style="font-size:0.85rem; font-weight:800; min-width:80px; color:#b91c1c">Negatives (−):</span>
              ${Array.from({ length: Math.min(10, neg) }, () => `<span class="expl-chip expl-chip-neg">−</span>`).join("")}
              ${neg > 10 ? `<span style="font-weight:800; color:#b91c1c">+${neg - 10} more</span>` : ""}
            </div>
          </div>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Zero Pairs:</strong> ${pairs} positive and ${pairs} negative chips cancel out to 0! What remains is ${Math.abs(rem)} ${rem >= 0 ? "positive (+)" : "negative (−)"} chips, so the final answer is ${total}.
        </div>
      </div>
    `;
  } else if (eqMatch) {
    goal = `Keep the scale balanced! Whatever you do to one side, do the exact same thing to the other side.`;
    tip = `Undo operations in reverse order: subtract the extra numbers first, then divide into equal piles!`;
    suggestedTool = "balance";
    toolLabel = "Pan Balance Scale";

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="balance">
        <div class="expl-widget-header">
          <span class="expl-widget-title">⚖️ Interactive Pan Balance Scale</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-nav-bar" role="tablist">
          <button type="button" class="expl-step-pill is-active" data-expl-bal="step1">1. Undo Constant</button>
          <button type="button" class="expl-step-pill" data-expl-bal="step2">2. Divide Equal Piles</button>
          <button type="button" class="expl-step-pill" data-expl-bal="check">3. Check Balance</button>
        </div>
        <div class="expl-visual-stage">
          <svg width="100%" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:8px" role="img" aria-label="Balance Scale Model">
            <polygon points="190,50 175,80 205,80" fill="#475569"/>
            <line x1="70" y1="50" x2="310" y2="50" stroke="#1e293b" stroke-width="4"/>
            <rect x="85" y="24" width="60" height="26" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
            <text x="115" y="42" text-anchor="middle" font-size="12" font-weight="900" fill="#1e40af">Left Pan</text>
            <rect x="235" y="24" width="60" height="26" rx="4" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>
            <text x="265" y="42" text-anchor="middle" font-size="12" font-weight="900" fill="#15803d">Right Pan</text>
            <text x="190" y="32" text-anchor="middle" font-size="16" font-weight="900" fill="#0f172a">=</text>
          </svg>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Keep Balanced:</strong> Whatever you remove from the left pan, remove the exact same amount from the right pan to keep the scale level!
        </div>
      </div>
    `;
  } else if (isPercent || /ratio|rate|per hour/i.test(q)) {
    goal = `Use friendly benchmark percents (10%, 25%, 50%) to solve mentally!`;
    tip = `50% is half, 25% is half of that, and 10% is dividing by 10.`;
    suggestedTool = "doublenumberline";
    toolLabel = "Double Number Line";

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="percent">
        <div class="expl-widget-header">
          <span class="expl-widget-title">📊 Benchmark Percent &amp; Ratio Bar</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn" data-expl-pct="10">10% (÷10)</button>
          <button type="button" class="expl-action-btn" data-expl-pct="25">25% (Half of half)</button>
          <button type="button" class="expl-action-btn" data-expl-pct="50">50% (Half)</button>
          <button type="button" class="expl-action-btn is-active" data-expl-pct="target">🎯 Answer: ${escapeHtml(item.displayAnswer)}</button>
        </div>
        <div class="expl-visual-stage">
          <div class="expl-pct-track-wrap">
            <div class="expl-pct-track">
              <div class="expl-pct-fill" style="width: 50%"></div>
            </div>
            <div class="expl-pct-ticks">
              <span>0%</span>
              <span>10%</span>
              <span>25%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Friendly Benchmarks:</strong> Use easy benchmarks to find the amount! 50% is half, 25% is half of that, and 10% is dividing by 10.
        </div>
      </div>
    `;
  } else if ((addMatch || subMatch) && !isDecimal) {
    const adding = Boolean(addMatch);
    const [, x, y] = adding ? addMatch : subMatch;
    const spec = columnSpec(adding ? "+" : "-", [x, y]);
    goal = adding ? "Line up the places and add one column at a time!" : "Line up the places and subtract one column at a time!";
    tip = adding ? "Ones go under ones, tens under tens. Regroup a ten into the next column when a column adds to 10 or more." : "Ones go under ones, tens under tens. Regroup from the next column when the top digit is too small.";
    suggestedTool = "vertical";
    toolLabel = "Column Method";

    visualWidget = spec
      ? `
      <div class="expl-interactive-widget" data-widget-type="columns">
        <div class="expl-widget-header">
          <span class="expl-widget-title">🧮 ${adding ? "Add in columns" : "Subtract in columns"}</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-visual-stage">${verticalHtml(spec)}</div>
      </div>
    `
      : "";
  } else if (isDecimal || isTensOnes) {
    goal = `Line up matching place value columns so like units add or subtract correctly!`;
    tip = `Decimal points must line up like buttons on a coat.`;
    suggestedTool = "tenframe";
    toolLabel = "Place Value Chart";

    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="place-value">
        <div class="expl-widget-header">
          <span class="expl-widget-title">🏷️ Place Value &amp; Decimal Columns</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn is-active" data-expl-pv="align">↕️ Line Up Decimal Points</button>
          <button type="button" class="expl-action-btn" data-expl-pv="places">🏷️ Compare Place Values</button>
        </div>
        <div class="expl-visual-stage">
          <svg width="100%" height="85" viewBox="0 0 380 85" style="background:#ffffff; border-radius:8px" role="img" aria-label="Decimal place alignment">
            <rect x="30" y="12" width="320" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="90" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Tens</text>
            <text x="140" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Ones</text>
            <text x="180" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#dc2626">•</text>
            <text x="220" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Tenths</text>
            <text x="280" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Hundredths</text>
            <text x="190" y="58" text-anchor="middle" font-size="14" font-weight="900" fill="#0f172a">Decimal points stay aligned in the answer: ${escapeHtml(item.displayAnswer)}</text>
          </svg>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Place Value Alignment:</strong> Keep like units in matching columns so each place value combines correctly!
        </div>
      </div>
    `;
  } else {
    // Universal Fallback Visual Model
    visualWidget = `
      <div class="expl-interactive-widget" data-widget-type="generic">
        <div class="expl-widget-header">
          <span class="expl-widget-title">💡 Step-by-Step Solution Model</span>
          <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
        </div>
        <div class="expl-action-bar">
          <button type="button" class="expl-action-btn is-active" data-expl-step="1">1️⃣ Notice Problem</button>
          <button type="button" class="expl-action-btn" data-expl-step="2">2️⃣ Solve Strategy</button>
          <button type="button" class="expl-action-btn" data-expl-step="3">3️⃣ Final Answer</button>
        </div>
        <div class="expl-visual-stage">
          <div style="font-size:1.3rem; font-weight:900; color:#0369a1; padding:0.5rem">
            ${escapeHtml(item.question)} ➔ <span style="color:#15803d">${escapeHtml(item.displayAnswer)}</span>
          </div>
        </div>
        <div class="expl-caption-box" role="status">
          <strong>Solution:</strong> ${escapeHtml(copy || item.explanation || item.displayAnswer)}
        </div>
      </div>
    `;
  }

  const stepsList = item.steps && item.steps.length > 1
    ? stepPlayer(item)
    : `<p class="student-expl-goal">${escapeHtml(copy)}</p>`;

  const toolCallout = suggestedTool
    ? `<div class="student-expl-tool-callout">
        <button type="button" class="expl-tool-launcher" data-open-tool="${suggestedTool}">
          <span>🧮</span> Practice on the Interactive ${escapeHtml(toolLabel)}
        </button>
      </div>`
    : "";

  return `
    <div class="student-expl-card">
      <div class="student-expl-header">
        <span class="student-expl-badge">💡 Strategy &amp; Solution Guide</span>
        <button type="button" class="expl-speak-btn" data-speak-expl="true" aria-label="Listen to explanation">🔊 Listen</button>
      </div>
      <p class="student-expl-goal"><strong>🎯 Goal:</strong> ${escapeHtml(goal)}</p>
      ${visualWidget}
      ${stepsList}
      <div class="student-expl-tip"><strong>💡 Pro Tip:</strong> ${escapeHtml(tip)}</div>
      ${toolCallout}
      ${renderMultiStrategyComparison(item)}
    </div>
  `;
}

function wireExplanationWidgets(root, item) {
  if (!root) return;
  const q = String(item?.expr || item?.question || "").replaceAll(",", "");
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/);
  if (divMatch) {
    const a = Number(divMatch[1]);
    const b = Number(divMatch[2]);
    if (b > 0 && typeof StandardLongDivisionModel !== "undefined") {
      const ldContainer = root.querySelector(".ld-model-container");
      if (ldContainer) {
        StandardLongDivisionModel.wireEvents(ldContainer, a, b);
      }
    }
  }
}

// Every practice problem carries its own model: the interactive picture of these numbers, or,
// when no picture fits, the workbench limited to the one tool that suits the problem.
function workbenchFits(item) {
  const wb = createWorkbenchState();
  wb.resetToItem(item);
  return wb.state.tool !== "model" || Boolean(renderInlineProblemModel(item.skill, item));
}

function mountProblemModel(show, collapsed = true) {
  const host = els.problemVisualScaffold;
  if (!host) return;
  if (!show) {
    host.hidden = true;
    host.innerHTML = "";
    if (els.toggleProblemVisual) els.toggleProblemVisual.hidden = true;
    return;
  }

  const isMultiplication = state.item?.skill?.strand === "Multiplication" || state.item?.skill?.op === "mul";
  // A dot grid shows every dot, so it is only honest for small arrays (the 144-dot cap used to print "79 rows of 41").
  const arrayFits = state.item?.model?.type === "array" && (state.item.model.a || 1) <= 12 && (state.item.model.b || 1) <= 12;
  if (isMultiplication && arrayFits) {
    const a = state.item.model.a || 1;
    const b = state.item.model.b || 1;
    const total = a * b;
    host.innerHTML = `
      <div class="publisher-model-card">
        <p class="pub-model-title">Visual Grid: <strong>${a} rows of ${b}</strong> (${a} × ${b})</p>
        <div class="pub-grid-dots" style="--cols: ${b}">
          ${Array.from({ length: Math.min(total, 144) }, (_, i) => `<span class="pub-dot" aria-hidden="true"></span>`).join("")}
        </div>
      </div>
    `;
    if (els.toggleProblemVisual) els.toggleProblemVisual.hidden = false;
  } else {
    const picture = interactivePicture(state.item.model);
    els.drillPanel.style.setProperty("--trail", getGrade(state.item.skill?.grade || state.grade).color);
    if (picture) {
      host.innerHTML = `<div class="tr-model">${picture}</div>`;
      if (els.toggleProblemVisual) els.toggleProblemVisual.hidden = false;
    } else {
      host.hidden = true;
      host.innerHTML = "";
      if (els.toggleProblemVisual) els.toggleProblemVisual.hidden = true;
      return;
    }
  }

  host.hidden = collapsed;
  if (els.toggleProblemVisual) {
    els.toggleProblemVisual.setAttribute("aria-expanded", String(!collapsed));
    els.toggleProblemVisual.textContent = collapsed ? "📐 Show the model" : "Hide the model";
  }
}

function guidedStepContent() {
  if (!state.item?.skill) return [];
  return (state.item.steps || [state.item.hint]).map((copy, index) => ({ label: `Step ${index + 1}`, copy }));
}

function renderGuidedCoach() {
  if (!state.initialSupport || !state.item) return;
  const steps = guidedStepContent();
  const allCopies = steps.map((entry) => entry.copy);
  els.guidedSteps.innerHTML = steps
    .slice(0, state.guidedStepsShown)
    .map((step, index) => {
      const badge = stepPhaseBadge(step.copy, index, allCopies);
      const badgeHtml = badge ? `<span class="guided-step-badge">${escapeHtml(badge)}</span>` : "";
      const why = whyFor(step.copy, index, allCopies);
      const whyHtml = why ? `<div class="tr-step-why"><span class="tr-why-icon" aria-hidden="true">💡</span><span class="tr-why-copy">${escapeHtml(why)}</span></div>` : "";
      const open = openFillRow(step.copy, index, allCopies, `coach:${state.item.question}`);
      const visual = open ? "" : stepVisual(step.copy);
      return `
        <li class="${index === state.guidedStepsShown - 1 ? "current" : "complete"}">
          <span class="guided-step-num">${index + 1}</span>
          <div class="guided-step-body">
            ${badgeHtml}
            ${open || `<p class="guided-step-text">${highlightVocab(mathText(step.copy))}</p>`}
            ${whyHtml}
            ${visual}
          </div>
        </li>`;
    })
    .join("");
  els.guidedStepCount.textContent = `${state.guidedStepsShown} of ${steps.length} steps open`;
  els.guidedNextStep.hidden = state.guidedStepsShown >= steps.length;
  els.guidedNextStep.disabled = stepWaiting(steps.map((entry) => entry.copy), state.guidedStepsShown, `coach:${state.item.question}`);
}

function revealGuidedStep() {
  const steps = guidedStepContent();
  if (!steps.length || state.guidedStepsShown >= steps.length) return null;
  state.guidedStepsShown += 1;
  renderGuidedCoach();
  return steps[state.guidedStepsShown - 1];
}

function renderAnswerControl() {
  const item = state.item;
  if (!item) return;
  const answerLabel = document.querySelector(".answer-label");

  if (item.choices) {
    els.answerInput.hidden = true;
    els.answerInput.removeAttribute("required");
    if (answerLabel) answerLabel.hidden = true;
    els.choiceAnswers.hidden = false;

    const isComp = item.choices.length === 3 && item.choices.includes("<") && item.choices.includes(">");
    if (isComp) {
      els.choiceAnswers.className = "choice-answers choice-comparison-group";
      els.choiceAnswers.innerHTML = item.choices
        .map((c) => `<button type="button" class="choice-answer choice-comp-btn" data-answer="${escapeHtml(c)}" aria-label="Compare ${c}">${escapeHtml(c)}</button>`)
        .join("");
    } else if (item.choices.length === 2) {
      els.choiceAnswers.className = "choice-answers choice-binary-group";
      els.choiceAnswers.innerHTML = item.choices
        .map((c) => `<button type="button" class="choice-answer choice-binary-btn" data-answer="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
        .join("");
    } else {
      els.choiceAnswers.className = "choice-answers choice-cards-grid";
      const letters = ["A", "B", "C", "D"];
      els.choiceAnswers.innerHTML = item.choices
        .map((c, idx) => `
          <button type="button" class="choice-answer choice-card-btn" data-answer="${escapeHtml(c)}">
            <span class="choice-letter">${letters[idx] || idx + 1}</span>
            <span class="choice-text">${mathText(c)}</span>
          </button>
        `)
        .join("");
    }
    els.checkButton.hidden = true;
  } else {
    els.answerInput.hidden = false;
    els.answerInput.setAttribute("required", "");
    if (answerLabel) {
      answerLabel.hidden = false;
      answerLabel.textContent = item.unit ? `Your answer (${item.unit})` : "Your answer";
    }
    els.choiceAnswers.hidden = true;
    els.choiceAnswers.innerHTML = "";
    els.answerInput.inputMode = item.kind === "text" ? "text" : "decimal";
    els.answerInput.placeholder = item.kind === "fraction" ? "Example: 3/4" : "Type your answer";
    els.checkButton.hidden = false;
  }
}

function submitAnswer(value) {
  if (!state.item || !state.session || state.session.finished) return;
  if (!String(value).trim()) { showFeedback("Enter an answer", "Type an answer before checking, or open a strategy hint.", "try"); return; }

  if (state.isFixing) {
    const isFixed = validateAnswer(value, state.item);
    if (isFixed) {
      state.isFixing = false;
      state.itemDone = true;
      InteractiveDrillToolbox.refresh();
      els.answerInput.disabled = true;
      els.checkButton.hidden = true;
      if (els.fixAnswerBtn) els.fixAnswerBtn.hidden = true;
      els.nextButton.hidden = false;
      chime("win");
      showFeedback("Fixed & Mastered! 🌟", "Awesome resilience! You found the slip, repaired it, and solved it correctly.", "correct");
      if (state.session) {
        state.session.correct += 1;
        updateSessionHeader();
      }
      return;
    } else {
      showFeedback("Keep trying!", "Almost! Review the steps above carefully and try one more time.", "try");
      els.answerInput.select();
      return;
    }
  }

  if (state.itemDone) return;
  state.itemAttempts += 1;
  const correct = validateAnswer(value, state.item);
  const responseInput = {
    activity: tutorSkillKey(state.item.skill),
    itemId: `${state.session.id}:${state.session.answered}`,
    correct,
    independent: !state.initialSupport && !state.hintBeforeFirst && state.itemAttempts === 1,
    learnerSignal: state.instructionalSignal,
    languageAccess: state.instructionalSignal === "language-access" ? "learner-requested" : "none",
  };
  // This contract contains answer categories only. The submitted value and any written work
  // remain outside this evidence record.
  const savedEvidence = recordInstructionalEvidence(instructionalEvidenceState, responseInput);
  state.instructionalDecision = decideInstruction(savedEvidence, { hasAuthoredTranslation: false });
  state.instructionalSignal = null;
  if (state.itemAttempts === 1) {
    state.firstAnswerCorrect = correct;
    if (!correct) {
      state.firstSlipAt = performance.now();
      rememberMistake(state.tutor, state.item.skill, state.item, value);
    }
  }
  if (state.session.mode === "diagnostic") { finalizeProblem(correct); return; }
  if (correct || state.session.mode === "streak") {
    // Streak mode: one answer per problem, so a miss restarts the count. No clock — the student moves on with "Next problem".
    finalizeProblem(correct);
    return;
  }
  if (state.initialSupport && state.itemAttempts < 3) {
    const nextStep = revealGuidedStep() || guidedStepContent().at(-1);
    showFeedback("Let's use the next step", `${feedbackFor(state.item.skill, state.item, value)} ${nextStep.copy}`, "try");
    addInstructionalChoices();
    saveActiveSession();
    if (!state.item.choices) els.answerInput.select();
    return;
  }
  if (state.itemAttempts === 1) {
    showFeedback("Try once more", feedbackFor(state.item.skill, state.item, value), "try");
    addInstructionalChoices();
    els.repair.hidden = false;
    saveActiveSession();
    els.answerInput.select();
    return;
  }
  finalizeProblem(false);
}

function addInstructionalChoices() {
  if (!els.feedbackCopy || !state.instructionalDecision) return;
  const choices = document.createElement("div");
  choices.className = "instructional-next-steps";
  choices.setAttribute("aria-label", "Choose a kind of help");
  choices.innerHTML = '<p>What would help you think it through?</p><button type="button" class="outline-action" data-instructional-signal="calculation-check">Check my calculation</button> <button type="button" class="outline-action" data-instructional-signal="strategy-clarification">Help me think about the strategy</button> <button type="button" class="outline-action" data-instructional-signal="language-access">Help me read the math words</button>';
  els.feedbackCopy.append(choices);
}

function finalizeProblem(correct) {
  const session = state.session;
  if (!session || session.finished || state.itemDone) return;
  state.itemDone = true;
  InteractiveDrillToolbox.refresh();
  session.answered += 1;
  if (correct) {
    session.correct += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    if (session.streak > 0 && session.streak % 5 === 0) chime("streak");
    const conf = state.confidence || "certain";
    let title = "Correct";
    let copy = state.item.explanation;
    if (conf === "curious") {
      title = "Curiosity Win! 🦉✨";
      copy = `${state.item.explanation} — You explored your way to the solution!`;
    } else if (conf === "thinking") {
      title = "Strategy Success! 🦊💡";
      copy = `${state.item.explanation} — Working through the steps paid off!`;
    } else {
      title = "Lightning Recall! 🦁⚡";
    }
    showFeedback(title, copy, "correct");
    if (els.fixAnswerBtn) els.fixAnswerBtn.hidden = true;
  } else {
    const lostStreak = session.mode === "streak" && session.streak > 0;
    session.streak = 0;
    session.missed.push({ skill: state.item.skill, item: state.item });
    const conf = state.confidence || "certain";
    let title = lostStreak ? "New streak starts now" : "Keep this one";
    let copy = `${state.item.hint} ${state.item.explanation}`;
    if (conf === "curious") {
      title = "Great Curiosity! 🦉";
      copy = `Exploring with curiosity is how mathematicians grow! ${state.item.hint} ${state.item.explanation}`;
    } else if (conf === "thinking") {
      title = "Good Thinking Effort! 🦊";
    }
    showFeedback(title, copy, "incorrect");
    if (els.fixAnswerBtn && session.mode !== "streak" && session.mode !== "sprint") {
      els.fixAnswerBtn.hidden = false;
    }
  }
  const independent = !state.initialSupport && !state.hintBeforeFirst;
  const firstCorrect = state.firstAnswerCorrect === true;
  if (independent && firstCorrect) session.independentCorrect++;
  if (session.mode === "diagnostic") {
    session.diagnosticResults[tutorSkillKey(state.item.skill)] = correct;
  } else {
    updateSkillRecord(state.item.skill, state.initialSupport ? correct : correct && firstCorrect && independent, state.initialSupport ? "guided" : session.mode);
    recordAnswer(state.tutor, state.item.skill, { correct: independent ? firstCorrect : correct, independent, level: state.item.level });
    if (session.mode === "repair" && independent && firstCorrect) {
      const key = tutorSkillKey(state.item.skill);
      const consecutive = (session.repairWins ||= {});
      consecutive[key] = (consecutive[key] || 0) + 1;
      if (consecutive[key] >= 2) for (const entry of state.tutor.mistakes) if (entry.key === key && !entry.resolvedAt) entry.resolvedAt = Date.now();
    } else if (session.mode === "repair") { (session.repairWins ||= {})[tutorSkillKey(state.item.skill)] = 0; }
  }
  onFluencyProblemFinalized(correct, independent, firstCorrect);
  saveProgress();
  if (state.skill) renderMastery();
  renderOverallStats();
  els.answerInput.disabled = true;
  els.choiceAnswers.querySelectorAll("button").forEach((button) => (button.disabled = true));
  els.checkButton.hidden = true;
  els.hintButton.hidden = true;
  els.skip.hidden = true;
  els.nextButton.hidden = false;
  els.nextButton.textContent = session.answered >= session.target || streakComplete(session) ? "Finish set" : "Next problem";
  updateSessionHeader();
  saveActiveSession();
}

function updateSkillRecord(skill, correct, mode) {
  const key = `${skill.grade || state.grade}:${skill.id}`;
  const record = recordFor(skill);
  if (mode === "guided") {
    record.guidedProblems += 1;
    if (correct) record.guidedCorrect += 1;
  } else {
    record.attempts += 1;
    if (correct) record.correct += 1;
    record.bestStreak = Math.max(record.bestStreak, state.session.streak);
    if (mode === "streak") record.streakBest = Math.min(STREAK_GOAL, Math.max(record.streakBest, state.session.streak));
  }
  record.lastPracticed = new Date().toISOString();
  state.progress[key] = record;
  saveProgress();
  if (state.skill) renderMastery();
}

function generateTransferChallenge(item) {
  if (!item) return null;
  const q = String(item.expr || item.question || "").replaceAll(",", "");

  const mulMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/);
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/);
  const addSubFrac = q.match(/(\d+)\/(\d+)\s*([+−\-])\s*(\d+)\/(\d+)/);
  const intMatch = q.match(/(-?\d+)\s*([+−\-])\s*(-?\d+)/);

  if (mulMatch) {
    const a = Number(mulMatch[1]);
    const b = Number(mulMatch[2]);
    const prod = a * b;
    return {
      title: "Real-World Context Transfer",
      scenario: `Which real-world story matches the relationship ${a} × ${b} = ${prod}?`,
      options: [
        { text: `${a} packages with ${b} items in each (${prod} total items)`, correct: true },
        { text: `${a} items in a box and someone puts ${b} more in (${a + b} items)`, correct: false },
        { text: `A total of ${prod} items split into ${a + b} groups`, correct: false }
      ]
    };
  }

  if (divMatch) {
    const a = Number(divMatch[1]);
    const b = Number(divMatch[2]);
    const quot = b > 0 ? a / b : 1;
    return {
      title: "Fair Sharing Transfer",
      scenario: `Which model shows the meaning of ${a} ÷ ${b} = ${quot}?`,
      options: [
        { text: `${a} treats shared equally among ${b} friends (${quot} treats each)`, correct: true },
        { text: `${a} books on one shelf and ${b} books on another shelf`, correct: false },
        { text: `${b} times more books than ${a}`, correct: false }
      ]
    };
  }

  if (addSubFrac) {
    const [, a, b, op, c, d] = addSubFrac;
    return {
      title: "Visual Unit Transfer",
      scenario: `In the expression ${a}/${b} ${op} ${c}/${d}, what does the denominator tell you?`,
      options: [
        { text: "The total number of equal slices that make up one whole unit", correct: true },
        { text: "How many total pizzas you ordered", correct: false },
        { text: "The number of slices you have eaten so far", correct: false }
      ]
    };
  }

  if (intMatch && (q.includes("-") || q.includes("−"))) {
    return {
      title: "Elevation & Temperature Transfer",
      scenario: `A diver starts at ${intMatch[1]} meters and changes position. What does a negative number mean here?`,
      options: [
        { text: "Depth below sea level or a drop in elevation", correct: true },
        { text: "Speed of swimming faster than 0 meters per second", correct: false },
        { text: "Distance traveled backwards regardless of direction", correct: false }
      ]
    };
  }

  return {
    title: "Representation Transfer",
    scenario: `Which strategy best verifies this mathematical result?`,
    options: [
      { text: `Use the inverse operation or a number line model to double check`, correct: true },
      { text: `Assume it must be right without checking any steps`, correct: false },
      { text: `Multiply everything by zero to verify`, correct: false }
    ]
  };
}

function renderTransferChallengeButton(item) {
  const challenge = generateTransferChallenge(item);
  if (!challenge) return "";
  return `
    <div class="transfer-challenge-wrap">
      <button type="button" class="transfer-challenge-btn" data-toggle-transfer>
        <span>🎯</span> <strong>Prove It: Transfer Challenge</strong>
      </button>
      <div class="transfer-challenge-card" id="transfer-challenge-card" hidden>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="font-size:0.75rem; font-weight:800; color:#7c3aed; background:#ede9fe; padding:2px 8px; border-radius:9999px">${escapeHtml(challenge.title)}</span>
          <span style="font-size:0.75rem; font-weight:700; color:#6b7280">+15 Mastery XP</span>
        </div>
        <p style="margin:4px 0 6px; font-weight:700; color:#1e1b4b; font-size:0.92rem">${escapeHtml(challenge.scenario)}</p>
        <div style="display:flex; flex-direction:column; gap:0.4rem">
          ${challenge.options.map((opt, idx) => `
            <button type="button" class="transfer-opt-btn" data-transfer-choice="${idx}" data-transfer-correct="${opt.correct}" style="text-align:left; font-size:0.85rem; padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; background:#ffffff; cursor:pointer">
              ${escapeHtml(opt.text)}
            </button>
          `).join("")}
        </div>
        <div class="transfer-feedback" id="transfer-feedback" hidden style="font-size:0.85rem; padding:6px 8px; border-radius:6px; font-weight:700"></div>
      </div>
    </div>
  `;
}

function showFeedback(title, copy, type) {
  els.feedback.hidden = false;
  els.feedback.dataset.type = type;
  els.feedbackTitle.textContent = title;
  if (type !== "correct" && state.item) {
    els.feedbackCopy.innerHTML = renderStudentFriendlyExplanation(state.item, copy);
    lightStepPlayers(els.feedbackCopy);
    wireExplanationWidgets(els.feedbackCopy, state.item);
  } else if (type === "correct" && state.item) {
    els.feedbackCopy.innerHTML = `<p>${escapeHtml(copy)}</p>${renderTransferChallengeButton(state.item)}`;
  } else {
    els.feedbackCopy.textContent = copy;
  }
  if (type === "correct" || type === "incorrect") renderLanguageSlot(type === "correct");
  if (type === "correct") chime("good");
}

// The explain card sits beside the feedback, not inside it: the feedback is a live region, and a screen reader would
// read the whole card aloud. A half-written explanation survives a redraw for the same problem.
function renderLanguageSlot(correct) {
  const slot = els.languageSlot;
  if (!slot) return;
  if (!state.item || state.session?.mode === "diagnostic") {
    slot.innerHTML = "";
    return;
  }
  const draft = captureDraft(slot);
  slot.innerHTML = explainCardHtml({ skill: state.item.skill, skillKey: tutorSkillKey(state.item.skill), grade: state.item.skill?.grade || state.grade, correct, count: state.session?.answered || 0, day: localDay(), itemKey: String(state.item.question) });
  restoreDraft(slot, draft);
}

function updateSessionHeader() {
  const session = state.session;
  els.sessionCount.textContent = `${session.answered} completed`;
  els.sessionAccuracy.textContent = session.mode === "diagnostic" ? "Finding a starting point" : `${session.correct} solved · ${session.independentCorrect} without help`;
  const progress = session.mode === "streak" ? (session.streak / STREAK_GOAL) * 100 : Number.isFinite(session.target) ? (session.answered / session.target) * 100 : Math.min(100, session.answered * 5);
  els.progressBar.style.width = `${Math.min(100, progress)}%`;
  renderStreakMeter();
}

function streakComplete(session) {
  return session?.mode === "streak" && session.streak >= STREAK_GOAL;
}

function renderStreakMeter() {
  const session = state.session;
  els.streakWrap.hidden = session?.mode !== "streak";
  if (session?.mode !== "streak") return;
  const current = Math.min(STREAK_GOAL, session.streak);
  const best = state.skill ? recordFor(state.skill).streakBest : 0;
  els.streakMeter.innerHTML = Array.from({ length: STREAK_GOAL }, (_, index) => `<span class="${index < current ? "lit" : ""}"></span>`).join("");
  els.streakMeter.setAttribute("aria-label", `${current} of ${STREAK_GOAL} correct in a row`);
  els.streakLabel.textContent = `${current} of ${STREAK_GOAL} in a row${best ? ` · Best ${best}` : ""}`;
}

function finishSession() {
  if (!state.session || state.session.finished) return;
  const session = state.session;
  session.finished = true;
  writeLocal(profileKey(SESSION_KEY, activeProfile), null);
  document.querySelector(".problem-stage").hidden = true;
  els.answerForm.hidden = true;
  els.feedback.hidden = true;
  if (els.languageSlot) els.languageSlot.innerHTML = "";
  els.summary.hidden = false;
  const accuracyPercent = session.answered ? Math.round((session.correct / session.answered) * 100) : 0;
  els.summaryTitle.textContent =
    streakComplete(session)
      ? "Ten in a row!"
      : session.mode === "quick"
        ? "Quick 5 complete"
        : session.mode === "flashcard"
          ? "Flashcard set complete"
          : session.mode === "guided"
            ? "Guided practice complete"
            : "Practice complete";
  els.summaryCopy.textContent =
    session.mode === "guided"
      ? "You worked through five coached examples. Continue to Practice 10 when the steps feel familiar, or repeat this guided set."
      : streakComplete(session)
        ? "Ten correct answers in a row, each one at your own pace. That is steady, careful work."
      : accuracyPercent >= 90
        ? "Accurate and steady. This skill is becoming automatic."
        : accuracyPercent >= 70
          ? "Solid progress. Correct the missed problems, then try another set."
          : "Slow down and use the learning steps. Accuracy comes before speed.";
  els.summaryStats.innerHTML = `
    <div><strong>${session.correct}</strong><span>correct</span></div>
    <div><strong>${session.answered}</strong><span>completed</span></div>
    <div><strong>${accuracyPercent}%</strong><span>${session.mode === "guided" ? "solved" : "accuracy"}</span></div>
    <div><strong>${session.bestStreak}</strong><span>best streak</span></div>`;
  els.retryMissed.hidden = session.mode === "guided" || session.missed.length === 0;
  els.independentPractice.hidden = session.mode !== "guided";
  if (state.skill) {
    const key = skillKey();
    const record = recordFor(state.skill);
    record.completedSets += session.mode === "practice" ? 1 : 0;
    record.guidedSets += session.mode === "guided" ? 1 : 0;
    if (session.mode === "streak") record.streakBest = Math.min(STREAK_GOAL, Math.max(record.streakBest, session.bestStreak));
    state.progress[key] = record;
    saveProgress();
    renderMastery();
  }
  if (session.mode === "diagnostic") {
    state.tutor.diagnostics[state.grade] = { at: Date.now(), results: session.diagnosticResults };
    els.summaryTitle.textContent = "Your starting-point checkup";
    els.summaryCopy.textContent = "These ten samples suggest what to try next. A single answer cannot prove mastery or determine a grade level.";
  }
  // Any finished practice set counts as a practice day, the same as a trail round or a game.
  if (session.answered > 0) {
    const rewards = loadRewards();
    noteToday(rewards);
    saveRewards(rewards);
  }
  state.tutor.sessions.push({ at: Date.now(), grade: state.grade, mode: session.mode, answered: session.answered, correct: session.independentCorrect });
  state.tutor.sessions = state.tutor.sessions.slice(-60);
  els.summaryStats.innerHTML = `<div><strong>${session.correct}</strong><span>solved</span></div><div><strong>${session.answered}</strong><span>completed</span></div><div><strong>${session.independentCorrect}</strong><span>without help on first try</span></div>`;
  const next = recommendations(state.tutor, state.grade)[0];
  const foundations = prerequisites(next.skill);
  const profileBrief = buildFluencyProfileSummary(session, accuracyPercent, next);
  els.summaryNext.innerHTML = `<h4>A useful next step</h4><p>${escapeHtml(next.reason)}: ${escapeHtml(next.skill.title)}.</p><div class="button-row"><button class="primary-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="visual">Explore the visual lesson</button><button class="outline-action" data-view="path">See my learning path</button></div><div class="drill-again-actions button-row" style="margin-top:0.75rem"><button class="outline-action" type="button" data-start-quick-drill>⚡ Drill 5 more</button><button class="outline-action flashcard-btn" type="button" data-start-flashcard-drill>🃏 Flashcards</button><button class="outline-action" type="button" data-start-streak-drill>🔥 10 in a row challenge</button><button class="outline-action" type="button" data-print-flashcards>🖨️ Print Flashcards</button><button class="outline-action" type="button" data-print-practice-sheet>🖨️ Practice Sheet</button><button class="outline-action" type="button" data-open-print-center>🖨️ Print Center</button>${streakComplete(session) || accuracyPercent === 100 ? `<button class="outline-action" type="button" data-print-cert>🏆 Print Certificate</button>` : ''}</div>${session.mode === 'diagnostic' && foundations.length ? `<p>Helpful foundation: <button class="text-action" data-open-key="${tutorSkillKey(foundations[0])}" data-open-mode="visual">${escapeHtml(foundations[0].title)} (Grade ${foundations[0].grade})</button></p>` : ''}${state.skill ? `<p class="teach-back-prompt">${escapeHtml(transferPrompt(state.skill))}</p>` : ''}${profileBrief}`;
  saveProgress(); renderOverallStats();
  announce("Practice saved for this learner on this device.");
}

function retryMissed() {
  startRepair(state.session.missed.map((entry) => tutorSkillKey(entry.skill)));
}

function speakProblem(lang = "en") {
  if (!state.item || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const rawQ = state.item.question || "";
  if (lang === "es") {
    const text = spokenEs(questionEs(state.item) || rawQ);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    speechSynthesis.speak(utterance);
    announce("Leyendo problema en español.");
  } else {
    const text = spoken(rawQ);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
    announce("Reading problem aloud in English.");
  }
}

function printPracticeSet() {
  const grade = getGrade(state.grade);
  const pool = state.skill ? [state.skill] : state.mixedPool || grade.skills;
  const seed = Date.now() % 1000000;
  const rng = seededRandom(seed);
  const items = Array.from({ length: 24 }, (_, index) => {
    const skill = pool[index % pool.length];
    return { skill, item: generateProblem(skill, rng) };
  });
  els.printSheet.innerHTML = `
    <header><p>EduWonderLab Math Fluency Lab</p><h1>${escapeHtml(state.skill?.title || `${grade.label} Mixed Practice`)}</h1><div><span>Name: ________________________</span><span>Date: ______________</span></div></header>
    <p class="print-directions">Solve each problem. Show a useful step when you need one.</p>
    <ol>${items.map(({ item }) => `<li><span>${escapeHtml(item.question.replace("?", ""))}</span><i></i></li>`).join("")}</ol>
    <footer>${grade.label} · Practice set ${seed}</footer>`;
  window.print();
}

function applySettings() {
  document.documentElement.classList.toggle("large-text", state.settings.largeText);
  els.textSizeButton.setAttribute("aria-pressed", String(state.settings.largeText));
  els.textSizeButton.textContent = state.settings.largeText ? "Text size: Large" : "Text size: Standard";
  document.body.classList.toggle("focus-mode", Boolean(state.settings.focus));
  document.querySelector("#focus-mode").setAttribute("aria-pressed", String(Boolean(state.settings.focus)));
  document.documentElement.classList.toggle("reading-font", Boolean(state.settings.readingFont));
  const font = document.querySelector("#reading-font");
  font.setAttribute("aria-pressed", String(Boolean(state.settings.readingFont)));
  font.textContent = state.settings.readingFont ? t("Reading font: On") : t("Reading font: Off");
  const sound = document.querySelector("#sound-toggle");
  sound.setAttribute("aria-pressed", String(soundOn()));
  sound.textContent = soundOn() ? t("Sound: On") : t("Sound: Off");
}

function showArea(view) {
  state.view = view;
  for (const [name, element] of [["library", els.library], ["workspace", els.workspace], ["path", els.path], ["notebook", els.notebook], ["games", els.games], ["teacher", els.teacher]]) element.hidden = name !== view;
  if (view !== "games") { cleanupGames?.(); cleanupGames = null; }
  document.body.classList.toggle("working-on-skill", view === "workspace");
  document.querySelectorAll("#hub-tabs button").forEach((button) => {
    if (button.dataset.view === view || (view === "workspace" && button.dataset.view === "library")) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

/* ==========================================================================
   Multidimensional Learner Genome (4-Axis Growth Engine)
   ========================================================================== */
function calculateFluencyGenome(profile = activeProfile) {
  const sessions = (state.tutor.sessions || []).filter((s) => s.grade === state.grade);
  const hudStats = FluencyTelemetryHUD?.getStats?.() || { arr: 0, de: 0 };
  const allMistakes = (state.tutor.mistakes || []).filter((m) => findSkill(m.key)?.grade === state.grade);
  const repairedMistakes = allMistakes.filter((m) => m.resolvedAt);
  const gradeSkills = getGrade(state.grade).skills;
  const exploredLessons = gradeSkills.filter((s) => evidence(state.tutor, s).lessonCompleted).length;
  const detectiveCases = getSolvedDetectiveCases();

  // 1. Automatic Recall (0 - 100)
  let recall = hudStats.arr > 0 ? hudStats.arr : 75;
  if (sessions.length > 0) {
    const totalAns = sessions.reduce((sum, s) => sum + (s.answered || 0), 0);
    const totalCorr = sessions.reduce((sum, s) => sum + (s.correct || 0), 0);
    if (totalAns > 0) {
      recall = Math.round((totalCorr / totalAns) * 100);
    }
  }
  recall = Math.min(98, Math.max(30, recall));

  // 2. Conceptual Strategy (0 - 100)
  const lessonPct = (exploredLessons / Math.max(1, gradeSkills.length)) * 50;
  const detecBonus = Math.min(30, detectiveCases.length * 10);
  let strategy = Math.round(35 + lessonPct + detecBonus);
  strategy = Math.min(98, Math.max(35, strategy));

  // 3. Resilience & Repair (0 - 100)
  let resilience = 80;
  if (allMistakes.length > 0) {
    resilience = Math.round(40 + (repairedMistakes.length / allMistakes.length) * 55);
  } else {
    resilience = 85;
  }
  resilience = Math.min(98, Math.max(40, resilience));

  // 4. Academic Math Language (0 - 100)
  const wordWallHistory = loadJson(profileKey("ewl-word-wall-history", profile), []);
  const language = languageEvidence(loadJournal(), wordWallHistory.length + lookupCount());

  return {
    recall,
    strategy,
    resilience,
    language,
    qualitative: {
      recall: recall >= 85 ? "Rapid fact retrieval & automaticity" : recall >= 65 ? "Steady retrieval with thoughtful pacing" : "Building foundational recall",
      strategy: strategy >= 80 ? "Multi-model reasoning & flexible representations" : strategy >= 60 ? "Active visual lesson & model exploration" : "Connecting concrete models to symbols",
      resilience: resilience >= 85 ? "High Fix-It Garage recovery rate & growth mindset" : resilience >= 65 ? "Steady persistence through tricky problems" : "Beginning mistake analysis",
      language: language === null ? "Not enough yet: explain a problem in your own words to start" : language >= 70 ? "Explains with math words, reasons, and checks" : language >= 40 ? "Using math words and some reasons" : "Starting to explain in words"
    }
  };
}

function renderFluencyGenomeSvg(genome) {
  const cx = 130;
  const cy = 110;
  const r = 70;

  const vRecall = genome.recall / 100;
  const vStrategy = genome.strategy / 100;
  const vResilience = genome.resilience / 100;
  const vLanguage = (genome.language ?? 0) / 100;
  const languageLabel = genome.language === null ? "not enough evidence yet" : `${genome.language}%`;

  const pTop = `${cx},${cy - r * vRecall}`;
  const pRight = `${cx + r * vStrategy},${cy}`;
  const pBottom = `${cx},${cy + r * vResilience}`;
  const pLeft = `${cx - r * vLanguage},${cy}`;

  return `
    <svg width="260" height="220" viewBox="0 0 260 220" class="genome-radar-svg" role="img" aria-label="Learner Genome Radar Chart: Recall ${genome.recall}%, Strategy ${genome.strategy}%, Resilience ${genome.resilience}%, Language ${languageLabel}">
      <defs>
        <radialGradient id="genomeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.15" />
        </radialGradient>
      </defs>

      <!-- Concentric Grid Diamonds (25%, 50%, 75%, 100%) -->
      <polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
      <polygon points="${cx},${cy - r * 0.75} ${cx + r * 0.75},${cy} ${cx},${cy + r * 0.75} ${cx - r * 0.75},${cy}" fill="none" stroke="#f1f5f9" stroke-width="1" />
      <polygon points="${cx},${cy - r * 0.5} ${cx + r * 0.5},${cy} ${cx},${cy + r * 0.5} ${cx - r * 0.5},${cy}" fill="none" stroke="#e2e8f0" stroke-width="1" />
      <polygon points="${cx},${cy - r * 0.25} ${cx + r * 0.25},${cy} ${cx},${cy + r * 0.25} ${cx - r * 0.25},${cy}" fill="none" stroke="#f1f5f9" stroke-width="1" />

      <!-- Axis Spokes -->
      <line x1="${cx}" y1="${cy - r - 4}" x2="${cx}" y2="${cy + r + 4}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
      <line x1="${cx - r - 4}" y1="${cy}" x2="${cx + r + 4}" y2="${cy}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />

      <!-- Radar Shape -->
      <polygon points="${pTop} ${pRight} ${pBottom} ${pLeft}" fill="url(#genomeGrad)" stroke="#4f46e5" stroke-width="2.5" stroke-linejoin="round" />

      <!-- Nodes -->
      <circle cx="${cx}" cy="${cy - r * vRecall}" r="4.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
      <circle cx="${cx + r * vStrategy}" cy="${cy}" r="4.5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
      <circle cx="${cx}" cy="${cy + r * vResilience}" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
      <circle cx="${cx - r * vLanguage}" cy="${cy}" r="4.5" fill="#8b5cf6" stroke="#ffffff" stroke-width="2" />

      <!-- Axis Labels -->
      <text x="${cx}" y="18" text-anchor="middle" font-size="10" font-weight="800" fill="#1e293b">⚡ Recall (${genome.recall}%)</text>
      <text x="${cx + r + 6}" y="${cy + 4}" text-anchor="start" font-size="10" font-weight="800" fill="#047857">🧠 Strategy (${genome.strategy}%)</text>
      <text x="${cx}" y="${cy + r + 18}" text-anchor="middle" font-size="10" font-weight="800" fill="#b45309">🛡️ Resilience (${genome.resilience}%)</text>
      <text x="${cx - r - 6}" y="${cy + 4}" text-anchor="end" font-size="10" font-weight="800" fill="#6d28d9">🗣️ Language (${genome.language === null ? "—" : `${genome.language}%`})</text>
    </svg>
  `;
}

function renderFluencyGenomeCard(genome) {
  return `
    <article class="learner-genome-card" id="learner-genome-card">
      <div class="genome-header">
        <div>
          <span class="genome-badge">🧬 MULTIDIMENSIONAL LEARNER GENOME</span>
          <h3 style="margin:2px 0; font-size:1.2rem; color:#0f172a">Growth Across 4 Pillars of Fluency</h3>
          <p style="margin:0; font-size:0.85rem; color:#64748b">Holistic mathematical development tracking automaticity, conceptual reasoning, error repair, and academic language.</p>
        </div>
        <span class="genome-profile-tag">${escapeHtml(PROFILE_NAMES[activeProfile])} · Grade ${state.grade}</span>
      </div>

      <div class="genome-body">
        <div class="genome-radar-wrap">
          ${renderFluencyGenomeSvg(genome)}
        </div>
        <div class="genome-metrics-grid">
          <div class="genome-metric-item">
            <div class="gm-top"><span class="gm-title">⚡ Automatic Recall</span><strong class="gm-val" style="color:#2563eb">${genome.recall}%</strong></div>
            <div class="gm-bar"><div class="gm-bar-fill" style="width:${genome.recall}%; background:#2563eb"></div></div>
            <p class="gm-desc">${escapeHtml(genome.qualitative.recall)}</p>
          </div>
          <div class="genome-metric-item">
            <div class="gm-top"><span class="gm-title">🧠 Conceptual Strategy</span><strong class="gm-val" style="color:#059669">${genome.strategy}%</strong></div>
            <div class="gm-bar"><div class="gm-bar-fill" style="width:${genome.strategy}%; background:#059669"></div></div>
            <p class="gm-desc">${escapeHtml(genome.qualitative.strategy)}</p>
          </div>
          <div class="genome-metric-item">
            <div class="gm-top"><span class="gm-title">🛡️ Resilience &amp; Repair</span><strong class="gm-val" style="color:#d97706">${genome.resilience}%</strong></div>
            <div class="gm-bar"><div class="gm-bar-fill" style="width:${genome.resilience}%; background:#d97706"></div></div>
            <p class="gm-desc">${escapeHtml(genome.qualitative.resilience)}</p>
          </div>
          <div class="genome-metric-item">
            <div class="gm-top"><span class="gm-title">🗣️ Academic Language</span><strong class="gm-val" style="color:#7c3aed">${genome.language === null ? "—" : `${genome.language}%`}</strong></div>
            <div class="gm-bar"><div class="gm-bar-fill" style="width:${genome.language ?? 0}%; background:#7c3aed"></div></div>
            <p class="gm-desc">${escapeHtml(genome.qualitative.language)}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const ranked = recommendations(state.tutor, state.grade);
  const next = ranked[0];
  const saved = loadJson(SESSION_KEY, null);
  const today = state.tutor.sessions.filter((session) => localDay(session.at) === localDay()).reduce((sum, session) => sum + session.answered, 0);
  const due = ranked.filter((entry) => entry.status.due).length;
  const genome = calculateFluencyGenome(activeProfile);
  els.dashboard.innerHTML = `
    ${renderFluencyGenomeCard(genome)}
    <div class="next-step-card"><p class="section-label">${escapeHtml(PROFILE_NAMES[activeProfile])}’s next step</p><h3>${escapeHtml(next.skill.title)}</h3><p>${escapeHtml(next.reason)}. Start with the visual idea or go straight to practice.</p><div class="button-row"><button class="primary-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="visual">See the idea</button><button class="outline-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="adaptive">Practice this skill</button></div></div>
    <div class="checkup-card"><h3>Find my starting point</h3><p>Try one question from each skill in Grade ${state.grade}. Skip what you haven’t learned yet.</p><button class="outline-action" data-start-checkup>${state.tutor.diagnostics[state.grade] ? 'Try the checkup again' : 'Start a 10-question checkup'}</button><p class="checkup-note">A quick guide, not a placement test.</p></div>
    <div class="daily-progress"><strong>${today} problems completed today</strong><span>${due ? `${due} skills ready for a memory refresh` : 'A small amount of thoughtful practice adds up.'}</span><button class="text-action" data-start-daily>Open my daily practice</button></div>
    ${saved?.version === 2 && saved.session && !saved.session.finished ? `<div class="resume-banner"><div><strong>Your practice is waiting.</strong><p>${escapeHtml(saved.item?.skill?.title || 'Practice set')} · ${saved.session.answered} completed</p></div><button class="primary-action" data-resume-practice>Continue saved practice</button></div>` : ''}`;
}

function openHubView(view) {
  if (view === "library") { renderLibrary(); return; }
  saveActiveSession(); cleanupVisual?.(); cleanupVisual = null;
  showArea(view);
  if (view === "path") renderPath();
  if (view === "notebook") renderNotebook();
  if (view === "games") { cleanupGames?.(); cleanupGames = mountGames(els.games, { grade: state.grade, autostart: state.autoGame, assignedStop: state.autoStop }); state.autoGame = null; state.autoStop = null; }
  if (view === "teacher") mountTeacherStudio(els.teacher, { grade: state.grade, onLaunch: launchAssignment, onPrint: printHtml, announce, games: GAMES, stopsFor, stopOptions, snapshot: (host, studioGrade) => { mountSnapshot(host); mountPaperGames(host, { grade: studioGrade, stopsFor, onPrint: printHtml }); } });
  document.title = `${{ teacher: 'Teacher studio', path: 'My learning path', games: 'Game Room' }[view] || 'Mistake notebook'} | Math Fluency Lab`;
  setUrl();
  document.querySelector(`#${view}-view`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPath() {
  const ranked = recommendations(state.tutor, state.grade);
  const skills = getGrade(state.grade).skills;
  const sessions = state.tutor.sessions.filter((session) => session.grade === state.grade);
  const explored = skills.filter((skill) => evidence(state.tutor, skill).lessonCompleted).length;
  const remembered = ranked.filter((entry) => entry.status.secure).length;
  const repaired = state.tutor.mistakes.filter((entry) => entry.resolvedAt && findSkill(entry.key)?.grade === state.grade).length;
  els.path.innerHTML = `<div class="section-heading"><div><p class="section-label">Grade ${state.grade} · ${escapeHtml(PROFILE_NAMES[activeProfile])}</p><h2>See what is growing.</h2><p>Independent first tries, coached practice, and learning over time tell different parts of the story.</p></div><button class="outline-action" data-print-report>Print family progress</button></div>
    <div class="learning-milestones"><div><strong>${explored}/10</strong><span>visual lessons explored</span></div><div><strong>${remembered}/10</strong><span>remembered independently</span></div><div><strong>${repaired}</strong><span>mistakes revisited successfully</span></div><div><strong>${new Set(sessions.map((session) => localDay(session.at))).size}</strong><span>practice days</span></div></div>
    <div class="path-explainer"><h3>What “remembered” means here</h3><p>At least eight recent independent checks, 85% correct, and successful practice on two different days. Coached examples and easier support problems help you learn; they do not establish independent mastery.</p></div>
    <div class="learning-map">${skills.map((skill) => {
      const status = evidence(state.tutor, skill); const foundation = prerequisites(skill)[0];
      const checkup = state.tutor.diagnostics[state.grade]?.results?.[tutorSkillKey(skill)];
      return `<article class="path-skill ${status.secure ? 'secure' : ''}"><div><p class="section-label">${escapeHtml(skill.strand)}</p><h3>${escapeHtml(skill.title)}</h3><p class="path-status">${status.label}</p><p>${status.independent ? `${status.successes} of ${status.independent} recent independent checks correct` : 'No independent evidence yet'}${status.supportedTotal ? ` · ${status.supportedTotal} coached attempts` : ''}</p>${status.dueAt ? `<p>${status.due ? 'Ready to revisit' : `Next memory refresh: ${new Date(status.dueAt).toLocaleDateString()}`}</p>` : ''}${checkup !== undefined ? `<p class="small-copy">Starting-point sample: ${checkup ? 'solved' : 'worth exploring'}. More practice will tell us more.</p>` : ''}${foundation ? `<p class="foundation-link">Helpful foundation: <button class="text-action" data-open-key="${tutorSkillKey(foundation)}" data-open-mode="visual">${escapeHtml(foundation.title)}</button></p>` : ''}</div><div class="button-row"><button class="outline-action" data-open-key="${tutorSkillKey(skill)}" data-open-mode="visual">Visual lesson</button><button class="primary-action" data-open-key="${tutorSkillKey(skill)}" data-open-mode="adaptive">Practice</button></div></article>`;
    }).join("")}</div>${journalHtml()}<section class="family-guide"><h3>For families: five useful minutes</h3><ol><li>Let your child choose one developing skill.</li><li>Ask, “What do you notice?” before giving a method.</li><li>Use the visual lesson together when a step feels unclear.</li><li>Let your child try a few fresh questions independently.</li><li>Ask, “How could you check that?” Celebrate a useful strategy or a repaired mistake.</li></ol><p>Fresh problems are generated each visit. A familiar topic can be practiced again tomorrow without repeating a fixed worksheet.</p></section>`;
}

const DETECTIVE_STORAGE_KEY = "ewl-detective-cases-v1";
function getSolvedDetectiveCases() {
  return loadJson(profileKey(DETECTIVE_STORAGE_KEY, activeProfile), []);
}
function saveSolvedDetectiveCase(caseId) {
  const solved = getSolvedDetectiveCases();
  if (!solved.includes(caseId)) {
    solved.push(caseId);
    writeLocal(profileKey(DETECTIVE_STORAGE_KEY, activeProfile), JSON.stringify(solved));
  }
}

const DETECTIVE_CASES = [
  {
    id: "case-fractions-add",
    grade: 4,
    title: "Case #101: The Denominator Trap",
    suspect: "Alex",
    problem: "1/3 + 1/4 = ?",
    suspectAnswer: "2/7",
    suspectThinking: "Alex added 1 + 1 = 2 on top, and 3 + 4 = 7 on the bottom.",
    misconception: "Adding denominators instead of finding a common unit size.",
    correctAnswer: "7/12",
    why: "Denominators tell the size of the slice! 1/3 is 4/12 and 1/4 is 3/12. Together they make 7/12.",
    tool: "fractions",
    toolName: "Fraction Wall",
    options: [
      { text: "Alex is right because 1 + 1 = 2 and 3 + 4 = 7", correct: false, feedback: "Remember: denominators name the unit size, not how many pieces you have." },
      { text: "Alex added denominators. Need common denominator: 4/12 + 3/12 = 7/12", correct: true, feedback: "Case Closed! 🏆 You found the common unit size!" },
      { text: "Alex should multiply: 1/3 × 1/4 = 1/12", correct: false, feedback: "The problem was addition (+), not multiplication (×)." }
    ]
  },
  {
    id: "case-integer-signs",
    grade: 6,
    title: "Case #204: The Negative Confusion",
    suspect: "Jordan",
    problem: "-5 + 8 = ?",
    suspectAnswer: "-13",
    suspectThinking: "Jordan saw 5 and 8, added them to get 13, and put a negative sign on it.",
    misconception: "Treating opposite signs as negative addition rather than canceling zero-pairs.",
    correctAnswer: "+3",
    why: "5 negative chips cancel with 5 positive chips (zero pairs), leaving 3 positive chips!",
    tool: "integers",
    toolName: "Integer Chips",
    options: [
      { text: "Jordan is right: any equation with a negative must have a negative answer", correct: false, feedback: "The positive value (+8) has a larger magnitude than the negative value (-5)." },
      { text: "Cancel zero pairs: 5 negatives cancel 5 positives, leaving +3", correct: true, feedback: "Case Closed! 🏆 Zero pairs canceled out the negatives!" },
      { text: "The answer is -3 because negative always wins", correct: false, feedback: "There are more positives (+8) than negatives (-5), so the result is positive." }
    ]
  },
  {
    id: "case-order-operations",
    grade: 5,
    title: "Case #312: The Left-to-Right Rush",
    suspect: "Maya",
    problem: "3 + 4 × 2 = ?",
    suspectAnswer: "14",
    suspectThinking: "Maya computed 3 + 4 = 7 first, then multiplied 7 × 2 = 14.",
    misconception: "Executing operations strictly left-to-right without honoring multiplication precedence.",
    correctAnswer: "11",
    why: "Multiplication groups units first! 4 × 2 = 8, then 3 + 8 = 11.",
    tool: "balance",
    toolName: "Pan Balance",
    options: [
      { text: "Maya is right because we always read left-to-right in math", correct: false, feedback: "Multiplication has precedence over addition in order of operations." },
      { text: "Multiply first: 4 × 2 = 8, then add 3 + 8 = 11", correct: true, feedback: "Case Closed! 🏆 Order of operations respected!" },
      { text: "Add 3 + 2 first to get 5, then multiply 5 × 4 = 20", correct: false, feedback: "Only numbers directly connected by the multiplication sign are grouped first." }
    ]
  },
  {
    id: "case-decimal-place",
    grade: 5,
    title: "Case #408: The Long Decimal Illusion",
    suspect: "Sam",
    problem: "Compare: 0.35 and 0.7",
    suspectAnswer: "0.35 is greater than 0.7",
    suspectThinking: "Sam thought 35 is bigger than 7, so 0.35 must be larger than 0.7.",
    misconception: "Whole-number thinking applied to decimals; ignoring place value columns.",
    correctAnswer: "0.7 > 0.35 (or 0.70 > 0.35)",
    why: "0.7 has 7 tenths (70 hundredths), which is more than 3 tenths and 5 hundredths (0.35)!",
    tool: "grid",
    toolName: "10×10 Grid",
    options: [
      { text: "Sam is right because 35 is larger than 7", correct: false, feedback: "In decimals, look at place value columns! 7 tenths is 70 hundredths." },
      { text: "0.7 is 7 tenths (0.70), which is more than 3 tenths (0.35)", correct: true, feedback: "Case Closed! 🏆 Place value tenths trump hundredths!" },
      { text: "They are equal because zeroes at the end do not change numbers", correct: false, feedback: "0.35 and 0.7 represent distinctly different fractional amounts." }
    ]
  },
  {
    id: "case-mult-distributive",
    grade: 3,
    title: "Case #515: The Forgotten Ones",
    suspect: "Taylor",
    problem: "4 × 12 = ?",
    suspectAnswer: "40",
    suspectThinking: "Taylor calculated 4 × 10 = 40 and forgot to multiply the remaining 2 ones.",
    misconception: "Partial distribution without completing all partial products.",
    correctAnswer: "48",
    why: "Distributive property: 4 × (10 + 2) = (4 × 10) + (4 × 2) = 40 + 8 = 48!",
    tool: "splitter",
    toolName: "Number Splitter",
    options: [
      { text: "Taylor is right because 12 rounds down to 10", correct: false, feedback: "This is exact computation, not rounding." },
      { text: "Taylor split 12 into 10 + 2, but forgot 4 × 2 = 8. Total is 40 + 8 = 48", correct: true, feedback: "Case Closed! 🏆 Both parts must be multiplied!" },
      { text: "The answer is 412 because 4 placed next to 12", correct: false, feedback: "Multiplication creates equal groups, not concatenation of digits." }
    ]
  },
  {
    id: "case-algebra-isolate",
    grade: 7,
    title: "Case #620: The Unfinished Equation",
    suspect: "Leo",
    problem: "Solve for x: 2x + 6 = 14",
    suspectAnswer: "x = 8",
    suspectThinking: "Leo subtracted 6 from 14 and got 8, then called 8 the answer.",
    misconception: "Stopping after the first inverse step without isolating the variable coefficient.",
    correctAnswer: "x = 4",
    why: "2x = 8, so dividing both sides by 2 gives x = 4!",
    tool: "balance",
    toolName: "Pan Balance",
    options: [
      { text: "Leo is right because 14 - 6 = 8", correct: false, feedback: "14 - 6 = 8 gives 2x = 8, not 1x = 8!" },
      { text: "Leo found 2x = 8, but must divide both sides by 2: x = 4", correct: true, feedback: "Case Closed! 🏆 Variable is completely isolated!" },
      { text: "Leo should have added 6 instead: 14 + 6 = 20, so x = 10", correct: false, feedback: "To undo addition of 6, subtraction is the correct inverse operation." }
    ]
  }
];

function renderDetectiveSection(currentGrade) {
  const solved = getSolvedDetectiveCases();
  const casesForGrade = DETECTIVE_CASES.filter((c) => Math.abs(c.grade - currentGrade) <= 1 || (currentGrade <= 3 && c.grade <= 4) || (currentGrade >= 6 && c.grade >= 5));
  const displayCases = casesForGrade.length >= 3 ? casesForGrade : DETECTIVE_CASES.slice(0, 4);

  return `
    <section class="strategy-detective-section">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem">
        <div>
          <span class="detective-badge">🕵️ STRATEGY DETECTIVE · PEER ERROR LAB</span>
          <h3 style="margin:4px 0 2px; font-size:1.35rem; color:#0f172a">Can You Spot What Went Wrong?</h3>
          <p style="margin:0; font-size:0.9rem; color:#475569">Peers made common reasoning slips below. Inspect their claim, find the misconception, and repair the thinking!</p>
        </div>
        <span style="font-size:0.85rem; font-weight:800; color:#0369a1; background:#e0f2fe; padding:4px 10px; border-radius:9999px">
          🏆 ${solved.length} Cases Cracked
        </span>
      </div>

      <div class="detective-cases-grid">
        ${displayCases.map((c) => {
          const isSolved = solved.includes(c.id);
          return `
            <article class="detective-case-card ${isSolved ? 'solved' : ''}" data-case-id="${c.id}">
              <div style="display:flex; justify-content:space-between; align-items:center">
                <span class="case-id-tag">${c.title}</span>
                <span style="font-size:0.8rem; font-weight:800; color:${isSolved ? '#166534' : '#b45309'}">
                  ${isSolved ? '✅ Case Solved!' : '🔎 Open Case'}
                </span>
              </div>
              <h4 class="case-claim">${escapeHtml(c.problem)}</h4>
              <p class="case-error-quote"><strong>${c.suspect} thinks:</strong> "${escapeHtml(c.suspectAnswer)}" — <em>${escapeHtml(c.suspectThinking)}</em></p>
              <div class="case-interactive-choices" style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.4rem">
                ${c.options.map((opt, idx) => `
                  <button type="button" class="case-choice-btn" data-solve-case="${c.id}" data-opt-idx="${idx}" ${isSolved ? 'disabled' : ''} style="text-align:left; font-size:0.85rem; padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; background:#fff; cursor:pointer">
                    ${escapeHtml(opt.text)}
                  </button>
                `).join("")}
              </div>
              <div class="case-feedback" id="case-fb-${c.id}" hidden style="font-size:0.85rem; padding:6px 8px; border-radius:6px; font-weight:700"></div>
              <div class="case-actions" style="margin-top:0.5rem">
                <button type="button" class="outline-action" data-open-tool="${c.tool}" style="font-size:0.8rem; padding:4px 8px">🛠️ Prove with ${c.toolName}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

/* ==========================================================================
   Targeted Cognitive Repair Prescriptions for Fix-It Garage
   ========================================================================== */
function getCognitivePrescription(entry, skill) {
  const q = String(entry.question || "").replaceAll(",", "").toLowerCase();
  const strand = skill?.strand || "";

  if (q.includes("/") || /fraction/i.test(strand) || /fraction/i.test(skill?.id || "")) {
    return {
      root: "Fraction Part-Whole / Denominator Inversion",
      rootBadge: "🩺 Rx: Fraction Wall Workout",
      tool: "fractions",
      toolName: "Fraction Strips Wall",
      diagnostic: "Observed difficulty comparing fraction sizes or adding unlike denominators without common partitioning.",
      prescription: "Compare identical length strips on the Fraction Wall to prove the common denominator before combining numerators."
    };
  }
  if ((q.includes("x") && q.includes("=")) || /equation|algebra/i.test(strand)) {
    return {
      root: "Algebraic Isolation & Balance Equilibrium",
      rootBadge: "🩺 Rx: Pan Balance Scale Workout",
      tool: "balance",
      toolName: "Pan Balance Scale",
      diagnostic: "Attempted to move a term without applying the identical inverse operation to both sides.",
      prescription: "Model the equation on the balance scale. Use inverse operations simultaneously to isolate x while maintaining equilibrium."
    };
  }
  if (/(^|[\s(])[−-]\d/.test(q) || /integer|negative/i.test(strand) || /negative/i.test(q)) {
    return {
      root: "Zero Pair & Sign Reversal Confusion",
      rootBadge: "🩺 Rx: Integer Counters Mat Workout",
      tool: "integers",
      toolName: "Integer Counters Mat",
      diagnostic: "Applied rote signs rules (like 'minus a minus is a plus') without physical zero-pair cancellation.",
      prescription: "Place positive and negative counters on the mat. Form zero pairs [(+1) + (-1) = 0] to see the net charge."
    };
  }
  if (q.includes("÷") || /division/i.test(strand) || /division/i.test(skill?.id || "")) {
    return {
      root: "Place-Value Quotient Partitioning",
      rootBadge: "🩺 Rx: Long Division Solver Workout",
      tool: "longdivision",
      toolName: "Division Solver",
      diagnostic: "Lost place-value alignment during multi-step quotient regrouping or subtraction difference.",
      prescription: "Work through each column in the vertical division tower: Divide → Multiply → Subtract → Bring Down."
    };
  }
  if (q.includes("×") || /multiplication|area/i.test(strand)) {
    return {
      root: "Distributive Property & Array Splitting",
      rootBadge: "🩺 Rx: Number Splitter Workout",
      tool: "splitter",
      toolName: "Number Splitter",
      diagnostic: "Multiplied the tens place but forgot the remaining ones chunk, or misapplied partial products.",
      prescription: "Decompose the tricky factor into friendly tens and ones (e.g., 12 = 10 + 2). Multiply both parts, then sum."
    };
  }
  return {
    root: "Place-Value Alignment & Regrouping Slip",
    rootBadge: "🩺 Rx: Column Method Workout",
    tool: "vertical",
    toolName: "Column Method",
    diagnostic: "Lost track of place value or of a regrouped ten while adding or subtracting.",
    prescription: "Line the numbers up by place value and work one column at a time, writing each regrouped ten above the next column."
  };
}

function renderNotebook() {
  const entries = state.tutor.mistakes.filter((entry) => findSkill(entry.key)?.grade === state.grade);
  const open = entries.filter((entry) => !entry.resolvedAt);
  els.notebook.innerHTML = `
    <div class="garage-banner">
      <div>
        <span class="garage-badge">🔧 THE FIX-IT GARAGE</span>
        <h2 style="margin:4px 0 2px; font-size:1.6rem; color:#fff">Tune Up Your Tricky Skills</h2>
        <p style="margin:0; font-size:0.95rem; color:#94a3b8">Every mistake is a vehicle in the shop. Tune it up with targeted manipulative workouts, then solve 2 fresh problems to roll out with green lights!</p>
      </div>
      ${open.length ? '<button class="primary-action" data-repair-all style="background:#f59e0b; color:#78350f; font-weight:900; border:none; padding:10px 16px; border-radius:8px; cursor:pointer">⚡ Tune Up All (' + open.length + ')</button>' : ''}
    </div>
    ${entries.length ? `<div class="mistake-list">${entries.map((entry) => {
      const skill = findSkill(entry.key);
      const isRepaired = !!entry.resolvedAt;
      const rx = getCognitivePrescription(entry, skill);
      return `
        <article class="mistake-entry ${isRepaired ? 'repaired' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <span class="mastery-pill" style="background:${isRepaired ? '#dcfce7' : '#fef3c7'}; color:${isRepaired ? '#166534' : '#92400e'}">
              ${isRepaired ? '✅ Tuned & Repaired 🏎️' : '🔧 In The Shop · Ready for Tune-Up'}
            </span>
            <span style="font-size:0.85rem; font-weight:700; color:#64748b">Grade ${skill.grade} · ${escapeHtml(skill.strand)}</span>
          </div>
          <h3>${escapeHtml(skill.title)}</h3>
          <p class="mistake-question" style="font-size:1.4rem; font-weight:900; margin:8px 0">${escapeHtml(entry.question)}</p>
          <p>Your previous answer: <strong style="color:#dc2626">${escapeHtml(entry.submitted)}</strong></p>

          <!-- Targeted Cognitive Repair Prescription -->
          <div class="repair-prescription-card">
            <div class="rx-header">
              <span class="rx-pill">${escapeHtml(rx.rootBadge)}</span>
              <span class="rx-status-note">${isRepaired ? '✅ Workout Repaired' : '🏋️ Workout Recommended'}</span>
            </div>
            <p class="rx-diagnostic"><strong>Mechanic’s Diagnostic:</strong> ${escapeHtml(rx.diagnostic)}</p>
            <p class="rx-prescription"><strong>Targeted Workout:</strong> ${escapeHtml(rx.prescription)}</p>
          </div>

          <details style="margin:10px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px">
            <summary style="font-weight:700; cursor:pointer">🔍 Peek at the Mechanic's Blueprint</summary>
            <p style="margin:6px 0 4px"><strong>Strategy Hint:</strong> ${escapeHtml(entry.hint)}</p>
            <p style="margin:4px 0"><strong>Solution Walkthrough:</strong> ${escapeHtml(entry.explanation)}</p>
            <p style="margin:4px 0; color:#b45309"><strong>Watch Out:</strong> ${escapeHtml(skill.learn.watch)}</p>
          </details>
          <div class="button-row">
            <button class="outline-action rx-workout-btn" type="button" data-launch-workout="${rx.tool}" data-skill-key="${entry.key}">🏋️ Launch ${rx.toolName} Workout</button>
            <button class="outline-action" data-open-key="${entry.key}" data-open-mode="visual">🛠️ Visual Lesson</button>
            <button class="primary-action" data-repair-key="${entry.key}">⚡ Test Drive Fresh Problems</button>
          </div>
        </article>`;
    }).join("")}</div>` : `
      <div class="empty-state" style="text-align:center; padding:3rem 1rem">
        <div style="font-size:3rem">🏎️💨</div>
        <h3>The Garage is Clean!</h3>
        <p>No tricky slips waiting in the shop right now. Start a practice set to explore new skills or challenge your streaks!</p>
        <button class="primary-action" data-view="library">Explore Skills</button>
      </div>
    `}
    ${renderDetectiveSection(state.grade)}
  `;
}

function openPlanned(mode, queue) {
  saveActiveSession(); cleanupVisual?.(); cleanupVisual = null;
  state.skill = null; state.mixedPool = queue.map((entry) => findSkill(entry.key)); state.mode = mode;
  showArea("workspace");
  els.workspaceGrade.textContent = `Grade ${state.grade}`;
  els.workspaceTitle.textContent = mode === "daily" ? "Today's 10, chosen for you" : mode === "diagnostic" ? "Find my starting point" : mode === "assignment" ? state.assignment.label : "Turn a mistake into a strategy";
  document.title = `${els.workspaceTitle.textContent} | Math Fluency Lab`;
  els.workspaceStandard.textContent = mode === "diagnostic" ? "Ten samples to help you choose your next step" : "Fresh problems from your selected skills";
  els.masteryMeter.value = 0; els.masteryLabel.textContent = "Learning across skills";
  els.modeTabs.innerHTML = `<button role="tab" aria-selected="true" aria-controls="drill-panel">${mode === 'diagnostic' ? 'Checkup' : mode === 'daily' ? "Today's 10" : mode === 'assignment' ? 'Class practice' : 'Repair practice'}</button>`;
  beginSession(mode, queue.length, queue); setUrl();
  els.workspace.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startRepair(keys) {
  const valid = [...new Set(keys)].filter((key) => findSkill(key)?.grade === state.grade);
  if (!valid.length) { announce("Choose a skill to repair first."); return; }
  const queue = Array.from({ length: Math.max(6, valid.length * 3) }, (_, i) => ({ key: valid[i % valid.length], purpose: "Use the strategy, then solve two fresh problems independently." }));
  openPlanned("repair", queue);
}

function launchAssignment(assignment) {
  if (!assignment) return;
  saveActiveSession(); state.session = null;
  state.assignment = assignment; state.grade = assignment.grade; saveSettings(); renderGradeTabs();
  document.documentElement.style.setProperty("--grade", getGrade(state.grade).color);
  renderAssignmentBanner();
  if (assignment.keys.length) openPlanned("assignment", assignmentQueue(assignment));
  else if (assignment.game) { state.autoGame = assignment.game; state.autoStop = assignment.stop; openHubView("games"); }
}

function renderAssignmentBanner() {
  const banner = document.querySelector("#assignment-banner"); banner.hidden = !state.assignment;
  if (!state.assignment) return;
  const assignment = state.assignment;
  banner.innerHTML = `<div><p class="section-label">Your class practice</p><h2>${escapeHtml(assignment.label)}</h2><p>Grade ${assignment.grade}${assignment.keys.length ? ` · ${assignment.count} fresh questions · ${assignment.keys.map((key) => escapeHtml(findSkill(key).title)).join(', ')}` : ''}${assignment.game ? ` · Game: ${escapeHtml(GAMES.find((g) => g.id === assignment.game)?.name || '')}` : ''}</p></div>${assignment.keys.length ? '<button class="primary-action" data-start-assignment>Start class practice</button>' : ''}${assignment.game ? '<button class="primary-action" data-start-assignment-game>Play the assigned game</button>' : ''}`;
}

function saveActiveSession() {
  if (!state.session || state.session.finished || !state.item) return;
  const { rng: _rng, problemSkills: _skills, ...session } = state.session;
  const snapshot = { version: 2, grade: state.grade, skillId: state.skill?.id || null, session, item: state.item, itemDone: state.itemDone,
    itemAttempts: state.itemAttempts, firstAnswerCorrect: state.firstAnswerCorrect, hintBeforeFirst: state.hintBeforeFirst, initialSupport: state.initialSupport,
    guidedStepsShown: state.guidedStepsShown, assignment: state.assignment, recentQuestions: state.recentQuestions,
    feedback: els.feedback.hidden ? null : { title: els.feedbackTitle.textContent, copy: els.feedbackCopy.textContent, type: els.feedback.dataset.type } };
  writeLocal(profileKey(SESSION_KEY, activeProfile), snapshot);
  saveProgress();
}

function resumePractice(saved = loadJson(SESSION_KEY, null)) {
  const allowed = ["practice", "guided", "adaptive", "streak", "daily", "mixed", "repair", "diagnostic", "assignment"];
  if (!saved || saved.version !== 2 || !allowed.includes(saved.session?.mode) || !findSkill(`${saved.grade}:${saved.item?.skill?.id}`) || (saved.session.queue && saved.session.queue.some((entry) => !findSkill(entry.key)))) { announce("There is no saved practice to resume."); return; }
  cleanupVisual?.(); cleanupVisual = null;
  state.grade = saved.grade; state.skill = saved.skillId ? getSkill(saved.grade, saved.skillId) : null;
  state.mixedPool = getGrade(state.grade).skills; state.mode = saved.session.mode; state.assignment = saved.assignment || state.assignment;
  state.session = { ...saved.session, rng: Math.random, problemSkills: [], finished: false };
  state.recentQuestions = saved.recentQuestions || [];
  showArea("workspace"); renderGradeTabs();
  document.documentElement.style.setProperty("--grade", getGrade(state.grade).color);
  els.workspaceGrade.textContent = `Grade ${state.grade}`;
  els.workspaceTitle.textContent = state.skill?.title || "Your saved practice";
  els.workspaceStandard.textContent = "Continue where you left off";
  if (state.skill) { renderMastery(); renderModeTabs(); renderLearn(); } else renderModeTabs(true);
  els.learnPanel.hidden = true; els.visualPanel.hidden = true; els.drillPanel.hidden = false; els.summary.hidden = true;
  els.answerForm.hidden = false; document.querySelector(".problem-stage").hidden = false;
  els.sessionType.textContent = "Resumed practice";
  if (saved.itemDone) nextProblem();
  else {
    nextProblem(saved.item);
    state.itemAttempts = saved.itemAttempts || 0; state.firstAnswerCorrect = saved.firstAnswerCorrect; state.hintBeforeFirst = saved.hintBeforeFirst;
    state.initialSupport = saved.initialSupport; state.guidedStepsShown = saved.guidedStepsShown;
    renderGuidedCoach();
    if (saved.feedback) showFeedback(saved.feedback.title, saved.feedback.copy, saved.feedback.type);
    saveActiveSession();
  }
  setUrl(); announce("Your saved practice is ready.");
}

function renderProfiles() {
  const data = profiles();
  document.querySelector("#profile-select").innerHTML = data.ids.map((id) => `<option value="${id}" ${id === activeProfile ? 'selected' : ''}>${PROFILE_NAMES[id]}</option>`).join("");
  document.querySelector("#add-profile").disabled = data.ids.length >= PROFILE_NAMES.length;
}

function switchProfile(id) {
  saveActiveSession(); saveSettings(); selectProfile(id); activeProfile = id; setLanguageProfile(id);
  state.session = null; state.item = null;
  state.progress = cleanProgress(loadJson(STORAGE_KEY, {})); state.tutor = sanitizeTutor(loadJson(TUTOR_KEY, emptyTutor()));
  state.settings = loadJson(SETTINGS_KEY, { largeText: false }); state.grade = Number(loadJson(`${SETTINGS_KEY}:grade`, 1)) || 1;
  if (!GRADES.some((grade) => grade.grade === state.grade)) state.grade = 1;
  pendingRestore = null; document.querySelector("#restore-preview").hidden = true;
  renderProfiles(); applySettings(); renderLibrary(); announce(`${PROFILE_NAMES[id]} is ready. Progress is separate for each learner.`);
}

function printHtml(html) { els.printSheet.innerHTML = html; window.print(); }
function printFamilyReport() {
  const next = recommendations(state.tutor, state.grade).slice(0, 3);
  printHtml(`<article class="family-print"><h1>My Math Fluency Progress</h1><p>Grade ${state.grade} · ${escapeHtml(PROFILE_NAMES[activeProfile])} · ${new Date().toLocaleDateString()}</p><p>Recent independent checks are separate from coached learning.</p><table><thead><tr><th>Skill</th><th>Evidence</th><th>Recent independent</th></tr></thead><tbody>${getGrade(state.grade).skills.map((skill) => { const status = evidence(state.tutor, skill); return `<tr><td>${escapeHtml(skill.title)}</td><td>${status.label}</td><td>${status.successes}/${status.independent}</td></tr>`; }).join("")}</tbody></table><h2>What to practice next</h2>${next.map((entry) => `<p>${escapeHtml(entry.skill.title)}: ${escapeHtml(entry.reason)}.</p>`).join("")}<h2>Talk about a strategy</h2><p>What did you notice? Why did that step work? How could you check?</p><p>eduwonderlab.com/math/fluency-lab/</p></article>`);
}

function registerSharedSaveResume() {
  const engine = window.NeftSaveResume;
  if (!engine || engine.__fluencyLabRegistered) return;
  engine.__fluencyLabRegistered = true;
  engine.registerStateProvider(() => ({
    schema: 1,
    progress: state.progress,
    settings: state.settings,
    grade: state.grade,
    tutor: state.tutor,
    profile: activeProfile,
  }));
  engine.registerStateRestorer((saved) => {
    if (!saved || saved.schema !== 1) return;
    if (Number.isInteger(saved.profile) && profiles().ids.includes(saved.profile) && saved.profile !== activeProfile) switchProfile(saved.profile);
    if (saved.progress && typeof saved.progress === "object") state.progress = cleanProgress(saved.progress);
    if (saved.tutor) state.tutor = sanitizeTutor(saved.tutor);
    if (saved.settings && typeof saved.settings === "object") state.settings = saved.settings;
    if (GRADES.some((grade) => grade.grade === Number(saved.grade))) state.grade = Number(saved.grade);
    saveProgress();
    saveSettings();
    applySettings();
    renderLibrary();
    announce("Fluency progress restored.");
  });
}

els.gradeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-grade]");
  if (!button) return;
  saveActiveSession();
  state.session = null;
  state.grade = Number(button.dataset.grade);
  state.strand = "All";
  saveSettings();
  if (state.view === "games") openHubView("games");
  else renderLibrary();
});

els.strandFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-strand]");
  if (!button) return;
  state.strand = button.dataset.strand;
  renderLibrary();
});

els.skillGrid.addEventListener("click", (event) => {
  const quick = event.target.closest("[data-quick-skill]");
  if (quick) {
    openSkill(quick.dataset.quickSkill, "quick");
    return;
  }
  const flashcard = event.target.closest("[data-flashcard-skill]");
  if (flashcard) {
    openSkill(flashcard.dataset.flashcardSkill, "flashcard");
    return;
  }
  const button = event.target.closest("[data-skill]");
  if (button) openSkill(button.dataset.skill);
  const visual = event.target.closest("[data-visual-skill]");
  if (visual) openSkill(visual.dataset.visualSkill, "visual");
});

els.modeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button || !state.skill) return;
  setMode(button.dataset.mode);
});

els.learnPanel.addEventListener("click", (event) => {
  if (handleModelTap(event.target)) return;
  if (event.target.closest('[data-step="learn-steps"]') && state.learnExample) {
    state.learnExample.shown += 1;
    const host = els.learnPanel.querySelector("[data-learn-steps]");
    host.innerHTML = stepsBlock(state.learnExample.item.steps, state.learnExample.shown, { id: "learn-steps" });
    host.querySelector("[data-step]")?.focus();
    return;
  }
  if (event.target.closest("[data-start-visual]")) setMode("visual");
  if (event.target.closest("[data-start-guided]")) setMode("guided");
  if (event.target.closest("[data-start-independent]")) setMode("practice");
});

els.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAnswer(els.answerInput.value);
});

els.choiceAnswers.addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (button) submitAnswer(button.dataset.answer);
});

els.feedback.addEventListener("click", (event) => {
  const button = event.target.closest("[data-instructional-signal]");
  if (!button) return;
  state.instructionalSignal = button.dataset.instructionalSignal;
  const prompts = {
    "calculation-check": "Try estimating first, then check each operation or place value.",
    "strategy-clarification": "Use the model or scratchpad to show what each number means. The same mathematical goal still applies.",
    "language-access": "Read the problem aloud, point to the quantities, or use the math language support above. A partner or familiar-language explanation can help you make sense of the words.",
  };
  const choices = button.closest(".instructional-next-steps");
  if (choices) choices.innerHTML = `<p role="status">${prompts[state.instructionalSignal]}</p>`;
});

els.hintButton.addEventListener("click", () => {
  if (state.itemAttempts === 0) state.hintBeforeFirst = true;
  showFeedback("Strategy hint", state.item.hint, "hint");
  els.hintButton.hidden = true;
  saveActiveSession();
});

els.nextButton.addEventListener("click", nextProblem);
els.guidedSteps.addEventListener("fluency-fill-solved", () => renderGuidedCoach());
els.guidedNextStep.addEventListener("click", () => {
  const step = revealGuidedStep();
  saveActiveSession();
  if (step) announce(`${step.label} step opened.`);
});
els.hearButton?.addEventListener("click", () => speakProblem("en"));
els.hearButtonEs?.addEventListener("click", () => speakProblem("es"));
els.printButton.addEventListener("click", printPracticeSet);
els.printButtonSecondary.addEventListener("click", printPracticeSet);
els.backLibrary.addEventListener("click", renderLibrary);
els.dailyButton.addEventListener("click", () => openMixed({ daily: true }));
els.mixedButton.addEventListener("click", () => openMixed());
els.resetButton.addEventListener("click", () => {
  if (state.mode === "diagnostic") { openPlanned("diagnostic", diagnosticPlan(state.grade)); return; }
  if (state.mode === "assignment") { launchAssignment(state.assignment); return; }
  if (state.skill) setMode(state.mode === "learn" ? "practice" : state.mode);
  else openMixed({ daily: state.mode === "daily" });
});
els.retryMissed.addEventListener("click", retryMissed);
els.independentPractice.addEventListener("click", () => setMode("practice"));
els.textSizeButton.addEventListener("click", () => {
  state.settings.largeText = !state.settings.largeText;
  saveSettings();
  applySettings();
});

document.addEventListener("click", (event) => {
  const confChip = event.target.closest("[data-conf]");
  if (confChip) {
    state.confidence = confChip.dataset.conf;
    document.querySelectorAll(".conf-chip").forEach((c) => {
      const match = c === confChip;
      c.classList.toggle("active", match);
      c.setAttribute("aria-checked", match ? "true" : "false");
    });
    return;
  }
  const view = event.target.closest("[data-view]");
  if (view) openHubView(view.dataset.view);
  const open = event.target.closest("[data-open-key]");
  if (open) {
    const skill = findSkill(open.dataset.openKey); if (!skill) return;
    saveActiveSession(); state.session = null; state.grade = skill.grade; saveSettings(); renderGradeTabs();
    openSkill(skill.id, open.dataset.openMode || "learn");
  }
  if (event.target.closest("[data-start-checkup]")) openPlanned("diagnostic", diagnosticPlan(state.grade));
  if (event.target.closest("[data-start-daily]")) openPlanned("daily", dailyPlan(state.tutor, state.grade));
  if (event.target.closest("[data-resume-practice]")) resumePractice();
  if (event.target.closest("[data-start-assignment]")) launchAssignment(state.assignment);
  if (event.target.closest("[data-start-assignment-game]")) { state.autoGame = state.assignment.game; state.autoStop = state.assignment.stop; state.grade = state.assignment.grade; openHubView("games"); }
  if (event.target.closest("[data-print-report]")) printFamilyReport();
  const repair = event.target.closest("[data-repair-key]");
  if (repair) startRepair([repair.dataset.repairKey]);
  if (event.target.closest("[data-repair-all]")) startRepair(state.tutor.mistakes.filter((entry) => !entry.resolvedAt).map((entry) => entry.key));
});
els.skip.addEventListener("click", () => {
  if (!state.session || state.session.mode !== "diagnostic" || state.itemDone) return;
  state.itemAttempts = 1; state.firstAnswerCorrect = false; finalizeProblem(false);
});
document.querySelector("#open-visual-help").addEventListener("click", () => {
  if (!state.item) return;
  const skill = state.item.skill; saveActiveSession();
  state.session = null; openSkill(skill.id, "visual");
});
document.querySelector("#profile-select").addEventListener("change", (event) => switchProfile(Number(event.target.value)));
document.querySelector("#add-profile").addEventListener("click", () => {
  const data = profiles(); const id = PROFILE_NAMES.findIndex((_, index) => !data.ids.includes(index));
  if (id >= 0) switchProfile(id);
});
// English / Español: the Game Room, trail, rewards and page chrome switch; skill titles and lesson text stay English.
function applyLang() {
  translatePage();
  applySettings();
  const toggle = document.querySelector("#lang-toggle");
  const spanish = getLang() === "es";
  toggle.textContent = spanish ? "English" : "Español";
  toggle.lang = spanish ? "en" : "es";
}
document.querySelector("#lang-toggle").addEventListener("click", () => {
  setLang(getLang() === "es" ? "en" : "es");
  applyLang();
  renderGradeTabs();
  if (state.view === "games") openHubView("games");
  else if (state.view === "library") renderLibrary();
});
applyLang();
document.querySelector("#focus-mode").addEventListener("click", () => { state.settings.focus = !state.settings.focus; saveSettings(); applySettings(); });
document.querySelector("#download-progress").addEventListener("click", () => {
  saveActiveSession(); downloadFile(`fluency-${PROFILE_NAMES[activeProfile].toLowerCase()}-${localDay()}.json`, JSON.stringify({ ...makeBackup(state), play: exportPlay() }, null, 2));
});
document.querySelector("#reading-font").addEventListener("click", () => { state.settings.readingFont = !state.settings.readingFont; saveSettings(); applySettings(); });
document.querySelector("#sound-toggle").addEventListener("click", () => { setSound(!soundOn()); applySettings(); });
document.querySelector("#print-certificate").addEventListener("click", () => printHtml(certificateHtml({ grade: state.grade, name: PROFILE_NAMES[activeProfile] })));
document.querySelector("#print-family").addEventListener("click", () => printHtml(familySummaryHtml({ grade: state.grade, name: PROFILE_NAMES[activeProfile] })));
document.querySelector("#download-family").addEventListener("click", () => downloadFile(`fluency-family-${PROFILE_NAMES[activeProfile].toLowerCase()}-${localDay()}.html`, familySummaryDocument({ grade: state.grade, name: PROFILE_NAMES[activeProfile] }), "text/html"));
document.querySelector("#download-facts").addEventListener("click", () => downloadFile(`fluency-facts-grade-${state.grade}-${localDay()}.json`, JSON.stringify(factsReport(state.grade, state.tutor), null, 2)));
document.querySelector("#download-report").addEventListener("click", () => downloadFile(`fluency-grade-${state.grade}-${localDay()}.csv`, progressReport(state.tutor, state.grade), "text/csv"));
document.querySelector("#restore-progress").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  const preview = document.querySelector("#restore-preview"); preview.hidden = false;
  try {
    if (file.size > 2000000) throw new Error("This file is too large for a Fluency Lab backup. Choose the downloaded progress JSON file.");
    const raw = JSON.parse(await file.text());
    pendingRestore = parseBackup(raw);
    pendingRestore.play = cleanPlay(raw.play);
    preview.innerHTML = `<p>Restore Grade ${pendingRestore.grade} progress with ${Object.keys(pendingRestore.tutor.records).length} practiced skills into <strong>${PROFILE_NAMES[activeProfile]}</strong>? A backup of this learner’s current progress will download first.</p><button class="primary-action" id="confirm-restore" type="button">Back up current progress and restore</button><button class="outline-action" id="cancel-restore" type="button">Cancel</button>`;
  } catch (error) { pendingRestore = null; preview.textContent = error.message || "The backup could not be read. Your progress has not changed."; }
  event.target.value = "";
});
document.querySelector("#restore-preview").addEventListener("click", (event) => {
  if (event.target.id === "cancel-restore") { pendingRestore = null; event.currentTarget.hidden = true; }
  if (event.target.id === "confirm-restore" && pendingRestore) {
    downloadFile(`fluency-before-restore-${localDay()}.json`, JSON.stringify({ ...makeBackup(state), play: exportPlay() }, null, 2));
    state.session = null; state.item = null;
    state.progress = pendingRestore.progress; state.tutor = pendingRestore.tutor; state.settings = pendingRestore.settings; state.grade = pendingRestore.grade;
    writeLocal(profileKey(SESSION_KEY, activeProfile), null); importPlay(pendingRestore.play); saveProgress(); saveSettings(); applySettings(); renderLibrary();
    pendingRestore = null; event.currentTarget.hidden = true; announce("Progress restored into the current learner profile.");
  }
});
// A trail stop or game answer counts toward the matching skill, so the dashboard and the trail agree. Games are
// untimed and offer no hints, so a first-try answer there is independent evidence, like one in practice.
window.addEventListener("fluency-fact", ({ detail }) => {
  const skill = detail?.item && skillForItem(state.grade, detail.item);
  if (!skill) return;
  recordAnswer(state.tutor, skill, { correct: Boolean(detail.firstTry), independent: true, level: 1 });
  saveProgress();
});
window.addEventListener("fluency-storage-unavailable", () => { document.querySelector("#storage-warning").hidden = false; });
// Another tab practising as the same learner saved: adopt its progress before this tab writes again, so the
// later save builds on it instead of replacing it with this tab's older copy.
window.addEventListener("storage", (event) => {
  if (event.key === profileKey(STORAGE_KEY, activeProfile)) state.progress = cleanProgress(loadJson(STORAGE_KEY, {}));
  else if (event.key === profileKey(TUTOR_KEY, activeProfile)) state.tutor = sanitizeTutor(loadJson(TUTOR_KEY, emptyTutor()));
});
window.addEventListener("pagehide", saveActiveSession);
for (const tablist of [els.gradeTabs, els.modeTabs]) tablist.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')]; const index = tabs.indexOf(event.target);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].click(); tablist.querySelectorAll('[role="tab"]')[next]?.focus();
});
els.toggleProblemVisual?.addEventListener("click", () => {
  const host = els.problemVisualScaffold;
  if (!host || !state.item) return;
  host.hidden = !host.hidden;
  if (!host.hidden && state.item.level === 2 && state.itemAttempts === 0 && !state.hintBeforeFirst) {
    state.hintBeforeFirst = true;
    els.insight.textContent = "Using the model counts as help on this one. You can still solve it.";
  }
  els.toggleProblemVisual.setAttribute("aria-expanded", String(!host.hidden));
  els.toggleProblemVisual.textContent = host.hidden ? "Show the model" : "Hide the model";
});
els.problemVisualScaffold?.addEventListener("click", (event) => handleModelTap(event.target));
els.problemVisualScaffold?.addEventListener("input", (event) => handleModelInput(event.target));
els.learnPanel.addEventListener("input", (event) => handleModelInput(event.target));
els.feedback.addEventListener("fluency-fill-solved", (event) => handleStepPlayerSolved(event.target));

document.querySelector("#brand-home")?.addEventListener("click", () => {
  renderLibrary();
});

els.quickSkillSelect?.addEventListener("change", (event) => {
  const val = event.target.value;
  if (!val) return;
  const [gStr, sId] = val.split(":");
  const g = Number(gStr);
  if (g && sId) {
    openSkill(sId, "learn", g);
  }
});

els.subnavSkills?.addEventListener("click", () => setPracticeSubview("skills"));
els.subnavTrail?.addEventListener("click", () => setPracticeSubview("trail"));
els.skillSearchInput?.addEventListener("input", filterSkillsBySearch);

els.settingsToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!els.settingsPopover) return;
  const isHidden = els.settingsPopover.hidden;
  els.settingsPopover.hidden = !isHidden;
  els.settingsToggle.setAttribute("aria-expanded", String(isHidden));
});
els.closeSettings?.addEventListener("click", () => {
  if (els.settingsPopover) {
    els.settingsPopover.hidden = true;
    els.settingsToggle?.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("click", (e) => {
  if (els.settingsPopover && !els.settingsPopover.hidden && !e.target.closest(".settings-menu-container")) {
    els.settingsPopover.hidden = true;
    els.settingsToggle?.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.settingsPopover && !els.settingsPopover.hidden) {
    els.settingsPopover.hidden = true;
    els.settingsToggle?.setAttribute("aria-expanded", "false");
    els.settingsToggle?.focus();
  }
});

const ZPD_STORAGE_KEY = "eduwonder_fluency_zpd";
const HISTORY_STORAGE_KEY = "eduwonder_fluency_history";
const MASTER_V3_KEY = "eduwonder_master_v3";

const fluencyNextGenState = {
  problemShownAt: 0,
  hesitationHandle: null,
  hesitatedOnCurrent: false,
  decomposedOnCurrent: false,
  sliceSplit: 5,
  telemetryOpen: false,
  metrics: {
    totalSolved: 0,
    automaticRecallCount: 0,
    decomposedAttempts: 0,
    decomposedSuccesses: 0,
    slipRecoveriesMs: [],
    badges: new Set(),
  },
};

function safeReadJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* local storage restricted */
  }
}

function syncFluencyMasterV3(patch) {
  const master = safeReadJson(MASTER_V3_KEY, { version: 3 });
  master.fluency = { ...(master.fluency || {}), ...patch, updatedAt: Date.now() };
  safeWriteJson(MASTER_V3_KEY, master);
}

const SpacedZPDEngine = {
  load() {
    return safeReadJson(ZPD_STORAGE_KEY, { facts: {}, queue: [] });
  },
  save(data) {
    safeWriteJson(ZPD_STORAGE_KEY, data);
    syncFluencyMasterV3({ zpdCount: Object.keys(data.facts || {}).length });
  },
  recordFact(item, correct, hesitated) {
    if (!item || !item.question) return;
    const store = this.load();
    const id = `${item.skill?.grade || state.grade}:${item.skill?.id || "skill"}:${item.question}`;
    const prev = store.facts[id] || { easiness: 2.5, interval: 1, reps: 0, mutations: 0 };
    const quality = correct ? (hesitated ? 3 : 5) : 1;
    const nextEasiness = Math.max(
      1.3,
      prev.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );
    let nextInterval = 1;
    let nextReps = prev.reps;
    if (!correct || hesitated) {
      nextReps = 0;
      nextInterval = !correct ? 1 : 3;
      const scheduleOffsets = [1, 3, 7];
      for (const offset of scheduleOffsets) {
        store.queue.push({
          factId: id,
          skillKey: `${item.skill?.grade || state.grade}:${item.skill?.id || ""}`,
          baseQuestion: item.question,
          dueAfterProblems: offset,
          mutationMode: offset === 1 ? "inverse" : offset === 3 ? "missing-factor" : "area-model",
        });
      }
      store.queue = store.queue.slice(-30);
    } else {
      nextReps += 1;
      nextInterval = nextReps === 1 ? 1 : nextReps === 2 ? 3 : Math.round(prev.interval * nextEasiness);
    }
    store.facts[id] = {
      easiness: Number(nextEasiness.toFixed(2)),
      interval: nextInterval,
      reps: nextReps,
      mutations: prev.mutations + (!correct || hesitated ? 1 : 0),
      updatedAt: Date.now(),
    };
    for (const qEntry of store.queue) {
      qEntry.dueAfterProblems = Math.max(0, (qEntry.dueAfterProblems || 1) - 1);
    }
    this.save(store);
  },
};

const FlowPacerEngine = {
  clearHesitationMonitor() {
    if (fluencyNextGenState.hesitationHandle) {
      window.clearTimeout(fluencyNextGenState.hesitationHandle);
      fluencyNextGenState.hesitationHandle = null;
    }
    const oldNudge = document.querySelector("#flow-dilation-nudge");
    if (oldNudge) oldNudge.hidden = true;
  },
  startProblemMonitor(item) {
    this.clearHesitationMonitor();
    fluencyNextGenState.problemShownAt = performance.now();
    fluencyNextGenState.hesitatedOnCurrent = false;
    fluencyNextGenState.decomposedOnCurrent = false;
    fluencyNextGenState.hesitationHandle = window.setTimeout(() => {
      if (state.itemDone || !state.session || state.session.finished) return;
      fluencyNextGenState.hesitatedOnCurrent = true;
      chime("hesitation");
      let nudge = document.querySelector("#flow-dilation-nudge");
      if (!nudge && els.drillPanel) {
        nudge = document.createElement("div");
        nudge.id = "flow-dilation-nudge";
        nudge.className = "flow-dilation-nudge";
        nudge.setAttribute("role", "status");
        els.question?.insertAdjacentElement("afterend", nudge);
      }
      if (nudge) {
        nudge.hidden = false;
        nudge.textContent =
          item?.hint ||
          "Anchor strategy: decompose into friendly 5s or 10s, or slice the visual model below.";
      }
    }, 2500);
  },
};



const FluencyTelemetryHUD = {
  getStats() {
    const m = fluencyNextGenState.metrics;
    const arr = m.totalSolved ? Math.round((m.automaticRecallCount / m.totalSolved) * 100) : 0;
    const de = m.decomposedAttempts
      ? Math.round((m.decomposedSuccesses / m.decomposedAttempts) * 100)
      : 100;
    const srv = m.slipRecoveriesMs.length
      ? Math.round(m.slipRecoveriesMs.reduce((a, b) => a + b, 0) / m.slipRecoveriesMs.length)
      : 0;
    return { arr, de, srv, badges: [...m.badges] };
  },
  render() {
    if (!els.drillPanel) return;
    let bar = document.querySelector("#fluency-micro-hud");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "fluency-micro-hud";
      bar.className = "fluency-micro-hud";
      els.drillPanel.insertBefore(bar, els.drillPanel.firstChild);
    }
    const stats = this.getStats();
    const streak = state.session?.streak || 0;
    const domainTitle = state.item?.skill
      ? `${state.item.skill.strand}: ${state.item.skill.title}`
      : `Grade ${state.grade} Fluency`;
    const activeBadge = stats.badges.at(-1) || "Anchor 5 Explorer";
    bar.innerHTML = `
      <div class="fluency-hud-domain">
        <span class="focus-orbit-wrap">
          <svg class="focus-orbit-svg" width="32" height="32" viewBox="0 0 36 36" style="background:#FFFFFF" role="img" aria-label="Calm 68 BPM Focus Orbit">
            <circle cx="18" cy="18" r="14" fill="#f0fdfa" stroke="#99f6e4" stroke-width="2"/>
            <circle class="focus-orbit-ring" cx="18" cy="18" r="8" fill="#0f766e"/>
          </svg>
          <span>Focus Orbit</span>
        </span>
        <span>· ${escapeHtml(domainTitle)}</span>
      </div>
      <div class="fluency-hud-metrics">
        <span class="fluency-hud-pill ${streak >= 3 ? "is-flow-glow" : ""}">Focus Level: ${streak >= 5 ? "Deep Flow" : streak >= 2 ? "Steady" : "Building"}</span>
        <span class="fluency-hud-pill">Strategy Badge: ${escapeHtml(activeBadge)}</span>
        <span class="fluency-hud-pill">ARR: ${stats.arr}%</span>
      </div>
    `;
    let drawer = document.querySelector("#fluency-telemetry-hud-drawer");
    if (!drawer) {
      drawer = document.createElement("section");
      drawer.id = "fluency-telemetry-hud-drawer";
      drawer.className = "fluency-telemetry-drawer";
      drawer.setAttribute("aria-label", "Fluency Strategy Diagnostic Telemetry");
      drawer.hidden = !fluencyNextGenState.telemetryOpen;
      bar.insertAdjacentElement("afterend", drawer);
    }
    drawer.hidden = !fluencyNextGenState.telemetryOpen;
    const zpdStore = SpacedZPDEngine.load();
    drawer.innerHTML = `
      <strong>Multi-Dimensional Fluency Diagnostic HUD (Shift + F)</strong>
      <div class="fluency-telemetry-grid">
        <div class="fluency-telemetry-cell"><strong>Automatic Recall Rate (ARR)</strong><div>${stats.arr}% (&lt;1.5s independent)</div></div>
        <div class="fluency-telemetry-cell"><strong>Decomposition Efficiency (DE)</strong><div>${stats.de}% accuracy with split model</div></div>
        <div class="fluency-telemetry-cell"><strong>Slip Recovery Velocity (SRV)</strong><div>${stats.srv ? `${stats.srv} ms` : "No slips"}</div></div>
        <div class="fluency-telemetry-cell"><strong>Spaced ZPD Queue</strong><div>${(zpdStore.queue || []).length} facts scheduled</div></div>
      </div>
    `;
  },
};

function onFluencyProblemPresented() {
  if (!state.item) return;
  FlowPacerEngine.startProblemMonitor(state.item);
  document.querySelector("#kinetic-decomposer-host")?.remove();
  FluencyTelemetryHUD.render();
}

function onFluencyProblemFinalized(correct, independent, firstCorrect) {
  FlowPacerEngine.clearHesitationMonitor();
  const elapsedMs = Math.max(0, performance.now() - (fluencyNextGenState.problemShownAt || performance.now()));
  const m = fluencyNextGenState.metrics;
  m.totalSolved += 1;
  if (correct && independent && firstCorrect && elapsedMs <= 1500) {
    m.automaticRecallCount += 1;
    m.badges.add("Automaticity Spark");
  }
  if (fluencyNextGenState.decomposedOnCurrent) {
    m.decomposedAttempts += 1;
    if (correct) {
      m.decomposedSuccesses += 1;
      m.badges.add("Anchor 5 Master");
    }
  }
  if (correct && !firstCorrect && state.firstSlipAt) {
    m.slipRecoveriesMs.push(Math.round(performance.now() - state.firstSlipAt));
    state.firstSlipAt = null;
    m.badges.add("Steady Self-Corrector");
  }
  if ((state.session?.streak || 0) >= 4) {
    m.badges.add("Doubling Architect");
  }
  SpacedZPDEngine.recordFact(state.item, correct, fluencyNextGenState.hesitatedOnCurrent);
  FluencyTelemetryHUD.render();
}

function buildFluencyProfileSummary(session, accuracyPercent, nextRecommendation) {
  const stats = FluencyTelemetryHUD.getStats();
  const strengths =
    accuracyPercent >= 85
      ? `Strong independent fluency (${accuracyPercent}% accuracy, ${stats.arr}% rapid recall).`
      : `Steady strategic persistence (${session.correct} of ${session.answered} solved, DE ${stats.de}%).`;
  const frontier =
    session.missed?.length > 0
      ? `Benefited from visual 5-split decomposition on ${session.missed[0]?.skill?.title || "target facts"}.`
      : `Ready to extend automaticity into ${nextRecommendation?.skill?.title || "next strand"}.`;
  const takeaway = `Goal: Use strategic 5-and-10 decomposition first whenever a new fact causes a pause.`;
  const tokenPayload = {
    g: state.grade,
    acc: accuracyPercent,
    arr: stats.arr,
    de: stats.de,
    srv: stats.srv,
    at: Date.now(),
  };
  let tokenHash = "";
  try {
    tokenHash = window.btoa(JSON.stringify(tokenPayload));
  } catch {
    tokenHash = "ewl-fluency-token";
  }
  const history = safeReadJson(HISTORY_STORAGE_KEY, []);
  history.push({
    grade: state.grade,
    mode: session.mode,
    answered: session.answered,
    correct: session.correct,
    accuracyPercent,
    arr: stats.arr,
    de: stats.de,
    srv: stats.srv,
    strengths,
    frontier,
    takeaway,
    tokenHash,
    at: Date.now(),
  });
  safeWriteJson(HISTORY_STORAGE_KEY, history.slice(-40));
  syncFluencyMasterV3({ lastFluencyProfile: tokenPayload, lastTokenHash: tokenHash });
  return `
    <div class="fluency-profile-card" id="fluency-profile-card">
      <h4>Fluency Profile · Diagnostic Synthesis</h4>
      <p><strong>Strengths Identified:</strong> ${escapeHtml(strengths)}</p>
      <p><strong>Growth Frontier:</strong> ${escapeHtml(frontier)}</p>
      <p><strong>Student Goal Takeaway:</strong> ${escapeHtml(takeaway)}</p>
      <p><strong>Tri-Factor Telemetry:</strong> ARR ${stats.arr}% · DE ${stats.de}% · SRV ${stats.srv ? `${stats.srv} ms` : "Instant"}</p>
      <div class="button-row">
        <button type="button" class="outline-action" data-copy-teacher-token="${escapeHtml(tokenHash)}">Copy Teacher Token</button>
      </div>
    </div>
  `;
}

document.addEventListener("click", (event) => {
  if (handleStepPlayerClick(event.target)) return;
  const launcher = event.target.closest(".expl-tool-launcher");
  if (launcher) {
    const tool = launcher.dataset.openTool;
    const drawer = document.querySelector("#drill-toolbox");
    if (drawer) {
      drawer.open = true;
      if (typeof InteractiveDrillToolbox !== "undefined") {
        InteractiveDrillToolbox.syncFromProblem(state.item);
        InteractiveDrillToolbox.activeTool = tool;
        drawer.querySelectorAll(".tool-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tool === tool));
        InteractiveDrillToolbox.render(document.querySelector("#drill-tool-viewport"));
      }
      drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return;
  }
  const caseBtn = event.target.closest("[data-solve-case]");
  if (caseBtn) {
    const caseId = caseBtn.dataset.solveCase;
    const optIdx = Number(caseBtn.dataset.optIdx);
    const theCase = DETECTIVE_CASES.find((c) => c.id === caseId);
    if (!theCase) return;
    const opt = theCase.options[optIdx];
    const card = caseBtn.closest(".detective-case-card");
    const fb = card?.querySelector(`#case-fb-${caseId}`);
    if (opt.correct) {
      if (fb) {
        fb.hidden = false;
        fb.style.background = "#dcfce7";
        fb.style.color = "#166534";
        fb.style.border = "1px solid #86efac";
        fb.textContent = `🌟 ${opt.feedback} (${theCase.why})`;
      }
      card.classList.add("solved");
      saveSolvedDetectiveCase(caseId);
      chime("streak");
      announce("Case solved! Great detective work.");
      card.querySelectorAll(".case-choice-btn").forEach((b) => (b.disabled = true));
    } else {
      if (fb) {
        fb.hidden = false;
        fb.style.background = "#fee2e2";
        fb.style.color = "#991b1b";
        fb.style.border = "1px solid #fca5a5";
        fb.textContent = `⚠️ ${opt.feedback}`;
      }
      chime("bad");
    }
    return;
  }
  const toggleTransferBtn = event.target.closest("[data-toggle-transfer]");
  if (toggleTransferBtn) {
    const card = toggleTransferBtn.closest(".transfer-challenge-wrap")?.querySelector("#transfer-challenge-card");
    if (card) card.hidden = !card.hidden;
    return;
  }
  const transferChoiceBtn = event.target.closest("[data-transfer-choice]");
  if (transferChoiceBtn) {
    const card = transferChoiceBtn.closest(".transfer-challenge-card");
    const fb = card?.querySelector("#transfer-feedback");
    const isCorrect = transferChoiceBtn.dataset.transferCorrect === "true";
    if (isCorrect) {
      if (fb) {
        fb.hidden = false;
        fb.style.background = "#f0fdf4";
        fb.style.color = "#15803d";
        fb.style.border = "1px solid #86efac";
        fb.textContent = "🎯 Concept Connected! You verified the mathematical relationship across representations! (+15 XP)";
      }
      chime("streak");
      card?.querySelectorAll(".transfer-opt-btn").forEach((b) => (b.disabled = true));
      transferChoiceBtn.style.background = "#dcfce7";
      transferChoiceBtn.style.borderColor = "#22c55e";
    } else {
      if (fb) {
        fb.hidden = false;
        fb.style.background = "#fef2f2";
        fb.style.color = "#b91c1c";
        fb.style.border = "1px solid #fca5a5";
        fb.textContent = "Almost! Rethink the underlying meaning and try another option.";
      }
      chime("bad");
      transferChoiceBtn.disabled = true;
      transferChoiceBtn.style.opacity = "0.6";
    }
    return;
  }
  const speakStepBtn = event.target.closest("[data-speak-step]");
  if (speakStepBtn) {
    const txt = speakStepBtn.dataset.speakStep || "";
    if (txt) speak(txt, state.lang === "es" ? "es" : "en");
    return;
  }
  const tokenBtn = event.target.closest("[data-copy-teacher-token]");
  if (tokenBtn) {
    const token = tokenBtn.dataset.copyTeacherToken || "";
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    tokenBtn.textContent = "Teacher Token Copied ✓";
    announce("Fluency teacher token copied to clipboard.");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.shiftKey && (event.key === "F" || event.key === "f")) {
    const tag = document.activeElement?.tagName || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    event.preventDefault();
    fluencyNextGenState.telemetryOpen = !fluencyNextGenState.telemetryOpen;
    FluencyTelemetryHUD.render();
  }
});

window.InteractiveSolver = InteractiveSolver;
window.StandardLongDivisionModel = StandardLongDivisionModel;
window.FlowPacerEngine = FlowPacerEngine;
window.FluencyTelemetryHUD = FluencyTelemetryHUD;
window.SpacedZPDEngine = SpacedZPDEngine;

// The drawer loads the problem on screen into every tool (drill-toolbox.js, numbers from problem-numbers.js).
const InteractiveDrillToolbox = createDrillToolbox({ getState: () => state, longDivision: StandardLongDivisionModel });

const drillToolbox = document.querySelector("#drill-toolbox");
if (drillToolbox) {
  InteractiveDrillToolbox.wire(drillToolbox);
  InteractiveDrillToolbox.render(document.querySelector("#drill-tool-viewport"));
  drillToolbox.addEventListener("toggle", () => {
    if (drillToolbox.open && state.item) {
      InteractiveDrillToolbox.syncFromProblem(state.item);
      InteractiveDrillToolbox.render(document.querySelector("#drill-tool-viewport"));
    }
  });
}

els.summary?.addEventListener("click", (event) => {
  if (event.target.closest("[data-start-quick-drill]")) {
    setMode("quick");
    return;
  }
  if (event.target.closest("[data-start-flashcard-drill]")) {
    setMode("flashcard");
    return;
  }
  if (event.target.closest("[data-start-streak-drill]")) {
    setMode("streak");
    return;
  }
  if (event.target.closest("[data-print-flashcards]")) {
    printFlashcardDeck();
    return;
  }
  if (event.target.closest("[data-print-practice-sheet]")) {
    printPracticeSheet();
    return;
  }
  if (event.target.closest("[data-print-cert]")) {
    printMasteryCertificate();
    return;
  }
  if (event.target.closest("[data-open-print-center]")) {
    TeacherPrintCenter.open();
    return;
  }
});

// A finished column board (solver, model or drawer) copies the learner's own typed result into the answer box,
// but only for this problem's numbers and only when no digit was opened for them by repeated misses.
document.addEventListener("vc-complete", (event) => {
  const { value, opened } = event.detail || {};
  const board = event.target;
  if (opened || !state.item || state.itemDone || !board.closest?.("#interactive-solver-workspace, #problem-visual-scaffold, #drill-tool-viewport")) return;
  const spec = JSON.parse(board.dataset.vc || "{}");
  const given = extractProblem(state.item);
  if (given?.kind !== "binary" || given.op !== spec.op || cleanDigits(given.aText) !== spec.terms?.[0] || cleanDigits(given.bText) !== spec.terms?.[1]) return;
  els.answerInput.value = value;
  chime("good");
});

// Using a model, solver, or tool before the first answer is help: it never counts as independent practice.
function markHelp() {
  if (state.item && !state.itemDone && state.itemAttempts === 0 && !state.hintBeforeFirst) {
    state.hintBeforeFirst = true;
    saveActiveSession();
  }
}

els.toggleSolver?.addEventListener("click", () => {
  if (!els.solverWorkspace || !state.item) return;
  const isHidden = els.solverWorkspace.hidden;
  if (isHidden) {
    markHelp();
    InteractiveSolver.render(state.item, els.solverWorkspace);
    els.solverWorkspace.hidden = false;
    els.toggleSolver.setAttribute("aria-expanded", "true");
  } else {
    els.solverWorkspace.hidden = true;
    els.toggleSolver.setAttribute("aria-expanded", "false");
  }
  hideDuplicateColumnModel(!els.solverWorkspace.hidden);
});

// The stacked-column board is both the solver and the model for add and subtract. With the solver open, the model
// panel would repeat the same boxes, so it steps aside and comes back when the solver closes.
function hideDuplicateColumnModel(solverOpen) {
  const host = els.problemVisualScaffold;
  if (!host) return;
  if (solverOpen && els.solverWorkspace.querySelector(".vc") && host.querySelector(".vc")) {
    host.dataset.hiddenBySolver = "1";
    host.hidden = true;
  } else if (host.dataset.hiddenBySolver) {
    delete host.dataset.hiddenBySolver;
    host.hidden = false;
  }
  if (els.toggleProblemVisual) {
    els.toggleProblemVisual.setAttribute("aria-expanded", String(!host.hidden));
    els.toggleProblemVisual.textContent = host.hidden ? "Show the model" : "Hide the model";
  }
}

els.fixAnswerBtn?.addEventListener("click", () => {
  state.isFixing = true;
  state.itemDone = false;
  els.answerInput.disabled = false;
  els.answerInput.value = "";
  els.answerInput.focus();
  els.checkButton.hidden = false;
  els.checkButton.textContent = "Check";
  els.fixAnswerBtn.hidden = true;
  els.nextButton.hidden = true;
  showFeedback("Fix your answer", "Take another shot! Use the strategy steps above to get it right.", "try");
});

// Flashcard interactive controls & keybindings
els.tptFlipButton?.addEventListener("click", () => flipFlashcard(true));
els.tptFlipBack?.addEventListener("click", () => flipFlashcard(false));
els.tptKnowCard?.addEventListener("click", () => handleFlashcardAnswer(true));
els.tptRepeatCard?.addEventListener("click", () => handleFlashcardAnswer(false));
document.querySelector("#tpt-next-card")?.addEventListener("click", () => {
  nextProblem();
});

els.tptPrintDeck?.addEventListener("click", () => printFlashcardDeck());

els.tptQuickForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = (els.tptQuickInput || document.querySelector("#tpt-quick-input"))?.value.trim();
  if (!val) {
    flipFlashcard(true);
    return;
  }
  const isCorrect = validateAnswer(val, state.item);
  updateLeitnerCard(state.item, isCorrect);
  const banner = els.tptBackBanner || document.querySelector("#tpt-back-banner");
  if (banner) {
    banner.hidden = false;
    if (isCorrect) {
      banner.className = "tpt-back-banner is-correct";
      banner.innerHTML = `<span class="banner-icon">✓</span> <strong>Great job! That's correct.</strong>`;
    } else {
      banner.className = "tpt-back-banner is-retry";
      banner.innerHTML = `<span class="banner-icon">ℹ</span> You answered <strong>${escapeHtml(val)}</strong>. Review the strategy below!`;
    }
  }
  flipFlashcard(true);
  if (isCorrect) {
    finalizeProblem(true);
    celebrateSparkles();
  }
  (els.tptNextCard || document.querySelector("#tpt-next-card"))?.focus();
});

function wordsToNumber(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const small = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
  };
  const words = trimmed.toLowerCase().split(/[\s-]+/);
  let total = 0;
  let current = 0;
  for (const w of words) {
    if (small[w] !== undefined) {
      current += small[w];
    } else if (w === "hundred") {
      current = (current || 1) * 100;
    } else if (w === "thousand") {
      total += (current || 1) * 1000;
      current = 0;
    } else if (w === "and") {
      // skip
    } else {
      return null;
    }
  }
  return total + current;
}

function parseSpokenMath(text) {
  if (!text) return "";
  let s = text.toLowerCase().trim()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ");

  if (s === "yes" || s === "true") return "yes";
  if (s === "no" || s === "false") return "no";
  if (s === "greater than" || s === "more than") return ">";
  if (s === "less than") return "<";
  if (s === "equal to" || s === "equals" || s === "equal") return "=";

  const xEq = s.match(/(?:x|variable)\s*(?:equals|is|=)\s*(.+)/);
  if (xEq) s = xEq[1].trim();

  let isNegative = false;
  if (s.startsWith("negative ") || s.startsWith("minus ")) {
    isNegative = true;
    s = s.replace(/^(?:negative|minus)\s+/, "");
  }

  const fractionWords = {
    half: 2, halves: 2,
    third: 3, thirds: 3,
    fourth: 4, fourths: 4, quarter: 4, quarters: 4,
    fifth: 5, fifths: 5,
    sixth: 6, sixths: 6,
    seventh: 7, sevenths: 7,
    eighth: 8, eighths: 8,
    ninth: 9, ninths: 9,
    tenth: 10, tenths: 10,
    eleventh: 11, elevenths: 11,
    twelfth: 12, twelfths: 12,
  };

  const overMatch = s.match(/^(.+?)\s+(?:over|divided by)\s+(.+)$/);
  if (overMatch) {
    const num = wordsToNumber(overMatch[1]);
    const den = wordsToNumber(overMatch[2]);
    if (num !== null && den !== null && den !== 0) {
      return `${isNegative ? "-" : ""}${num}/${den}`;
    }
  }

  for (const [w, den] of Object.entries(fractionWords)) {
    const rx = new RegExp(`^(.+?)\\s+${w}$`);
    const m = s.match(rx);
    if (m) {
      let num = wordsToNumber(m[1]);
      if (m[1] === "a" || m[1] === "one") num = 1;
      if (num !== null) {
        return `${isNegative ? "-" : ""}${num}/${den}`;
      }
    }
  }

  if (s.includes("point ") || s.includes("dot ")) {
    const parts = s.split(/\s+(?:point|dot)\s+/);
    if (parts.length === 2) {
      const whole = parts[0] ? (wordsToNumber(parts[0]) ?? parts[0]) : "0";
      let dec = wordsToNumber(parts[1]);
      if (dec === null) {
        dec = parts[1].split(/\s+/).map((w) => wordsToNumber(w) ?? w).join("");
      }
      return `${isNegative ? "-" : ""}${whole}.${dec}`;
    }
  }

  const num = wordsToNumber(s);
  if (num !== null) {
    return `${isNegative ? "-" : ""}${num}`;
  }

  const cleaned = s.replace(/[^0-9/.\-]/g, "");
  if (cleaned) {
    return `${isNegative && !cleaned.startsWith("-") ? "-" : ""}${cleaned}`;
  }

  return s;
}

let activeSpeechRec = null;

function initVoiceControl() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtns = [
    els.voiceAnswerBtn || document.querySelector("#voice-answer-btn"),
    els.voiceFlashcardBtn || document.querySelector("#voice-flashcard-btn"),
  ].filter(Boolean);

  if (!SpeechRec) {
    micBtns.forEach((btn) => {
      btn.title = "Voice input is not supported in this browser (available in Chrome, Edge, Safari)";
      btn.addEventListener("click", () => {
        alert("Speech recognition is not available in your current browser. For voice-response mode, try Chrome, Edge, or Safari.");
      });
    });
    return;
  }

  function stopListening() {
    if (activeSpeechRec) {
      try { activeSpeechRec.stop(); } catch {}
      activeSpeechRec = null;
    }
    micBtns.forEach((b) => b.classList.remove("is-listening"));
  }

  micBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-listening")) {
        stopListening();
        return;
      }

      stopListening();
      try {
        const recognition = new SpeechRec();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          btn.classList.add("is-listening");
          chime("step");
        };

        recognition.onresult = (evt) => {
          const raw = evt.results[0][0].transcript;
          const parsed = parseSpokenMath(raw);
          btn.classList.remove("is-listening");

          const isFlashcard = state.session?.mode === "flashcard";
          if (isFlashcard) {
            const qInp = els.tptQuickInput || document.querySelector("#tpt-quick-input");
            if (qInp) {
              qInp.value = parsed;
              els.tptQuickForm?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
          } else {
            if (els.answerInput) {
              els.answerInput.value = parsed;
              els.answerForm?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
          }
        };

        recognition.onerror = () => {
          btn.classList.remove("is-listening");
        };

        recognition.onend = () => {
          btn.classList.remove("is-listening");
          activeSpeechRec = null;
        };

        activeSpeechRec = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Speech recognition failed to start:", err);
        btn.classList.remove("is-listening");
      }
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (state.session?.mode === "flashcard" && !els.drillPanel.hidden && !state.itemDone) {
    const card = els.tptCard || document.querySelector("#tpt-flashcard");
    const isFlipped = card?.classList.contains("is-flipped");
    const tag = document.activeElement?.tagName || "";
    if (event.code === "Space" && tag !== "INPUT") {
      event.preventDefault();
      if (isFlipped) nextProblem();
      else flipFlashcard(true);
    } else if (isFlipped) {
      if (event.key === "1") {
        event.preventDefault();
        handleFlashcardAnswer(false);
      } else if (event.key === "2") {
        if (tag !== "INPUT") {
          event.preventDefault();
          handleFlashcardAnswer(true);
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        nextProblem();
      }
    }
  }
});

const TeacherPrintCenter = {
  activeTab: "mats",

  open(tab = "mats") {
    const modal = document.querySelector("#tpt-print-modal");
    if (!modal) return;
    this.activeTab = tab;
    modal.hidden = false;
    this.renderTab(this.activeTab);
  },

  close() {
    const modal = document.querySelector("#tpt-print-modal");
    if (modal) modal.hidden = true;
  },

  renderTab(tab) {
    const viewport = document.querySelector("#tpt-modal-viewport");
    const tabs = document.querySelectorAll("[data-tpt-tab]");
    tabs.forEach((b) => {
      const isActive = b.dataset.tptTab === tab;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    if (!viewport) return;

    if (tab === "mats") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>📝 Dry-Erase Student Recording Mats</h3>
              <p>Turn screen practice into tactile writing. Slip into clear plastic sleeves for daily dry-erase center rotations.</p>
            </div>
            <button type="button" class="tpt-print-action-btn" data-tpt-print="mat">🖨️ Print Recording Mat (8.5×11)</button>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Included on this printable:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>Header for Student Name, Date, and 100% Goal</li>
              <li>3 Problem Workspace Boxes with Hand-Drawn Model Areas</li>
              <li>Tool Tracker: Number Line, Chips, Balance, Grid</li>
              <li>Self-Reflection Checkpoint (😃 😐 🤔) for each problem</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "partner") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>🎲 Dynamic Printable Partner Games (Grades 1–8)</h3>
              <p>Zero-prep, two-player printable math games customized to grade and skill. Complete with bilingual rules, visual game boards, printable cards, and math talk sentence stems.</p>
            </div>
          </div>
          <div class="partner-game-picker-row" style="display:flex; gap:0.75rem; flex-wrap:wrap; margin:1rem 0; background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0; align-items:center">
            <label style="font-weight:700; font-size:0.9rem">Select Partner Game:
              <select id="partner-game-select" style="margin-left:0.4rem; padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; font-weight:700">
                <option value="war" selected>Fraction War · Compare &amp; Capture (Grades 3–5)</option>
                <option value="tug">Integer Tug-of-War · Net Charge Track (Grades 6–7)</option>
                <option value="capture">Factor Capture · Prime &amp; Factor Chase (Grades 4–6)</option>
                <option value="array">Roll &amp; Split Array · Distributive Property (Grades 1–3)</option>
              </select>
            </label>
            <button type="button" class="tpt-print-action-btn" id="print-selected-partner-game" style="background:#4f46e5; border-color:#4338ca">🖨️ Print 2-Player Game Sheet (2 Pages)</button>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Game Highlights:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li><strong>Page 1:</strong> Full High-Contrast Game Board, Bilingual Rules (EN &amp; ES), and Partner Talk Prompts</li>
              <li><strong>Page 2:</strong> Cut-and-Play Game Cards / Verification Grid and Round Recording Table</li>
              <li><strong>Zero Prep:</strong> Just print, grab two colored pencils or counters, and play immediately in stations</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "exits") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>🎫 Differentiated 3-Tier Exit Tickets</h3>
              <p>Formative assessment in 1-page format. 3 tiered slips per sheet (Mild · Medium · Spicy) with easy scissor cut lines.</p>
            </div>
            <button type="button" class="tpt-print-action-btn" data-tpt-print="exits">🖨️ Print 3-Tier Exit Tickets</button>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Tiers Included:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>🟢 Level 1 (Mild): Scaffolded with strategy prompts and visual hints</li>
              <li>🟡 Level 2 (Medium): Grade-level fluency with written sentence frame</li>
              <li>🌶️ Level 3 (Spicy): Rigorous Error Analysis ("Find Maya's mistake")</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "anchors") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>📌 Desk Helper Strips &amp; Classroom Anchor Posters</h3>
              <p>Visual aids for IEP/504 accommodations, desk reference, and classroom math bulletin boards.</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
              <button type="button" class="tpt-print-action-btn" data-tpt-print="desk">🖨️ Print Desk Strips (3-Up)</button>
              <button type="button" class="tpt-print-action-btn" data-tpt-print="anchor" style="background:#0284c7; border-color:#0369a1">🖨️ Print Anchor Poster</button>
            </div>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Features:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>3" × 8" laminated desk strips with 4 core strategy rules</li>
              <li>Full 8.5" × 11" Anchor Chart with Golden Rule &amp; Misconception Alert</li>
              <li>High-contrast pedagogical graphics suitable for black &amp; white copiers</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "passports") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>🎖️ Fluency Passports &amp; Collectible Brag Tags</h3>
              <p>Gamify mathematical mastery with pocket booklets and wearable brag tags that motivate learners.</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
              <button type="button" class="tpt-print-action-btn" data-tpt-print="passport">🖨️ Print Fluency Passport</button>
              <button type="button" class="tpt-print-action-btn" data-tpt-print="brag" style="background:#7c3aed; border-color:#6d28d9">🖨️ Print Brag Tags (9-Up)</button>
            </div>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Features:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>4-Quadrant Foldable Passport with Visa Stamp Circles for Grades 1–8</li>
              <li>Mathematician Mindset Oath &amp; Signature Line</li>
              <li>9 Collectible Badges: Balance Master, Zero Pair Ninja, Double Line Pro, etc.</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "stations") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>🎪 Math Workshop Station Tents &amp; Teacher Cue Sheet</h3>
              <p>Turnkey materials for small group guided math and independent station rotations.</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
              <button type="button" class="tpt-print-action-btn" data-tpt-print="tent">🖨️ Print Table Tents (3 Stations)</button>
              <button type="button" class="tpt-print-action-btn" data-tpt-print="coaching" style="background:#b45309; border-color:#92400e">🖨️ Print Teacher Cue Sheet</button>
            </div>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Features:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>Folding Table Tents for Stations 1, 2, and 3 with icon step guides</li>
              <li>Teacher Table Cue Sheet with Common Misconceptions &amp; Prompting Stems</li>
              <li>Specific accommodations for ESOL, IEP, and Challenge learners</li>
            </ul>
          </div>
        </div>
      `;
    } else if (tab === "parents") {
      viewport.innerHTML = `
        <div class="tpt-preview-card">
          <div class="tpt-preview-header">
            <div class="tpt-preview-info">
              <h3>🏠 “Fridge Math” Parent &amp; Family Guide</h3>
              <p>Demystify modern visual strategies so parents can support math homework without frustration.</p>
            </div>
            <button type="button" class="tpt-print-action-btn" data-tpt-print="parent">🖨️ Print Fridge Math Guide</button>
          </div>
          <div class="tpt-preview-mockup">
            <strong>Included in Parent Guide:</strong>
            <ul class="tpt-feature-bullets" style="margin-top:6px">
              <li>Why we use zero pairs (two-color counters) for negative numbers</li>
              <li>Why we use pan balance scales for equations instead of rote rules</li>
              <li>3 dinner-table questions parents can ask instead of "What's the answer?"</li>
            </ul>
          </div>
        </div>
      `;
    }
  }
};

function handleExplanationInteraction(event) {
  const speakBtn = event.target.closest("[data-speak-expl]");
  if (speakBtn) {
    const card = speakBtn.closest(".student-expl-card");
    const goal = card?.querySelector(".student-expl-goal")?.textContent || "";
    const caption = card?.querySelector(".expl-caption-box")?.textContent || "";
    const tip = card?.querySelector(".student-expl-tip")?.textContent || "";
    speak(`${goal}. ${caption}. ${tip}`);
    return true;
  }

  const btn = event.target.closest("[data-expl-action], [data-expl-step], [data-expl-ld-step], [data-expl-mul], [data-expl-area], [data-expl-kcf], [data-expl-frac], [data-expl-int], [data-expl-sign], [data-expl-bal], [data-expl-pct], [data-expl-pv]");
  if (!btn) return false;

  const widget = btn.closest(".expl-interactive-widget");
  if (!widget) return false;

  const bar = btn.closest(".expl-nav-bar, .expl-action-bar");
  if (bar) {
    bar.querySelectorAll(".expl-step-pill, .expl-action-btn").forEach((p) => p.classList.remove("is-active"));
    btn.classList.add("is-active");
  }

  const captionEl = widget.querySelector(".expl-caption-box");

  // Long Division Standard Algorithm Step Pills
  if (btn.hasAttribute("data-expl-ld-step")) {
    const phase = btn.dataset.explLdStep;
    const tracker = widget.querySelector(".ld-cycle-tracker");
    if (tracker) {
      tracker.querySelectorAll(".ld-cycle-step").forEach((st) => {
        st.classList.toggle("is-active", st.dataset.ldPhase === phase);
      });
    }
    const msgs = {
      divide: "1. Divide: How many times does the divisor fit into the current number? Find the biggest whole number of times.",
      multiply: "2. Multiply: Multiply the quotient digit by the divisor. Write the product below the number.",
      subtract: "3. Subtract: Subtract the product from the number to find what is left over.",
      bringdown: "4. Bring Down: Bring down the next digit from the dividend to form the next number to divide.",
      repeat: "5. Repeat / Remainder: Continue the cycle until all digits are used. Any leftover amount is the remainder!",
    };
    if (captionEl) captionEl.innerHTML = `<strong>${msgs[phase] || "Continue the standard algorithm cycle!"}</strong>`;
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Multiplication: Friendly Split vs Full Array
  if (btn.hasAttribute("data-expl-mul")) {
    const act = btn.dataset.explMul;
    const small = Number(btn.dataset.small) || 6;
    const big = Number(btn.dataset.big) || 7;
    const s1 = Number(btn.dataset.s1) || 5;
    const s2 = Number(btn.dataset.s2) || (big - s1);
    const p1 = Number(btn.dataset.p1) || (small * s1);
    const p2 = Number(btn.dataset.p2) || (small * s2);
    const tot = Number(btn.dataset.tot) || (small * big);

    if (act === "split") {
      if (captionEl) captionEl.innerHTML = `<strong>Friendly Split:</strong> Break ${big} into friendly parts (${s1} + ${s2})! ${small} × ${s1} = ${p1}, and ${small} × ${s2} = ${p2}. Total = ${tot}!`;
    } else if (act === "grid") {
      if (captionEl) captionEl.innerHTML = `<strong>Full Grid:</strong> ${small} equal rows with ${big} units in each row makes ${tot} total units in the array.`;
    } else if (act === "add") {
      if (captionEl) captionEl.innerHTML = `<strong>Add Partial Products:</strong> ${p1} (green box) + ${p2} (blue box) = ${tot} total units!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Fraction Division: Keep, Change, Flip
  if (btn.hasAttribute("data-expl-kcf")) {
    const phase = btn.dataset.explKcf;
    const cards = widget.querySelectorAll("[data-kcf-card]");
    cards.forEach((c) => {
      c.style.transform = "";
      c.style.boxShadow = "";
    });
    if (phase === "keep") {
      const c = widget.querySelector('[data-kcf-card="keep"]');
      if (c) { c.style.transform = "scale(1.08)"; c.style.boxShadow = "0 0 0 3px #3b82f6"; }
      if (captionEl) captionEl.innerHTML = `<strong>1. KEEP:</strong> Leave the first fraction exactly as it is!`;
    } else if (phase === "change") {
      const c = widget.querySelector('[data-kcf-card="change"]');
      if (c) { c.style.transform = "scale(1.08)"; c.style.boxShadow = "0 0 0 3px #a855f7"; }
      if (captionEl) captionEl.innerHTML = `<strong>2. CHANGE:</strong> Change the division sign (÷) into a multiplication sign (×)!`;
    } else if (phase === "flip") {
      const c = widget.querySelector('[data-kcf-card="flip"]');
      if (c) { c.style.transform = "scale(1.08) rotate(180deg)"; c.style.boxShadow = "0 0 0 3px #22c55e"; }
      if (captionEl) captionEl.innerHTML = `<strong>3. FLIP:</strong> Flip the second fraction upside down to get its reciprocal!`;
    } else {
      if (captionEl) captionEl.innerHTML = `<strong>4. MULTIPLY:</strong> Multiply numerators straight across and denominators straight across!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Fraction Addition/Subtraction: Common Denominators
  if (btn.hasAttribute("data-expl-frac")) {
    const act = btn.dataset.explFrac;
    const lcd = Number(btn.dataset.lcd) || 12;
    const res = btn.dataset.res;
    if (act === "different") {
      if (captionEl) captionEl.innerHTML = `<strong>Unequal Slices:</strong> The slices are different sizes! We must find a common denominator before combining.`;
    } else if (act === "cut") {
      if (captionEl) captionEl.innerHTML = `<strong>Equal Slices:</strong> Both fraction bars are cut into equal ${lcd}ths so all slices match!`;
    } else if (act === "combine") {
      if (captionEl) captionEl.innerHTML = `<strong>Combine Slices:</strong> Keep the bottom denominator (${lcd}) and combine the top slices = ${res}/${lcd}!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Integer Zero Pairs
  if (btn.hasAttribute("data-expl-int")) {
    const act = btn.dataset.explInt;
    const chips = widget.querySelectorAll(".expl-chip");
    const pairs = Number(btn.dataset.pairs) || 0;
    const rem = Number(btn.dataset.rem) || 0;
    if (act === "cancel") {
      let posLeft = pairs;
      let negLeft = pairs;
      chips.forEach((ch) => {
        if (ch.classList.contains("expl-chip-pos") && posLeft > 0) {
          ch.classList.add("is-canceled");
          posLeft--;
        } else if (ch.classList.contains("expl-chip-neg") && negLeft > 0) {
          ch.classList.add("is-canceled");
          negLeft--;
        } else {
          ch.classList.remove("is-canceled");
        }
      });
      if (captionEl) captionEl.innerHTML = `<strong>Zero Pairs Cancelled:</strong> ${pairs} positive and ${pairs} negative chips cancel out to 0! What remains is ${Math.abs(rem)} ${rem >= 0 ? "positive (+)" : "negative (−)"} chips.`;
    } else {
      chips.forEach((ch) => ch.classList.remove("is-canceled"));
      if (captionEl) captionEl.innerHTML = `<strong>All Counters:</strong> Here are all starting counters before cancelling zero pairs.`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Pan Balance Scale
  if (btn.hasAttribute("data-expl-bal")) {
    const step = btn.dataset.explBal;
    if (step === "step1") {
      if (captionEl) captionEl.innerHTML = `<strong>Step 1:</strong> Subtract the extra constant from BOTH pans so the scale stays level!`;
    } else if (step === "step2") {
      if (captionEl) captionEl.innerHTML = `<strong>Step 2:</strong> Divide the remaining weights into equal piles to find the value of 1 variable!`;
    } else {
      if (captionEl) captionEl.innerHTML = `<strong>Step 3:</strong> Plug the answer back in to verify both pans balance perfectly!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Percent Benchmarks
  if (btn.hasAttribute("data-expl-pct")) {
    const pct = btn.dataset.explPct;
    const track = widget.querySelector(".expl-pct-fill");
    if (pct === "10") {
      if (track) track.style.width = "10%";
      if (captionEl) captionEl.innerHTML = `<strong>10% Benchmark:</strong> Move the decimal point one place to the left (divide by 10)!`;
    } else if (pct === "25") {
      if (track) track.style.width = "25%";
      if (captionEl) captionEl.innerHTML = `<strong>25% Benchmark:</strong> Take half, then take half again (divide by 4)!`;
    } else if (pct === "50") {
      if (track) track.style.width = "50%";
      if (captionEl) captionEl.innerHTML = `<strong>50% Benchmark:</strong> 50% is simply half of the whole amount!`;
    } else {
      if (track) track.style.width = "100%";
      if (captionEl) captionEl.innerHTML = `<strong>Target Answer:</strong> Use your benchmarks to find the final target amount!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Place Value Alignment
  if (btn.hasAttribute("data-expl-pv")) {
    const pv = btn.dataset.explPv;
    if (pv === "align") {
      if (captionEl) captionEl.innerHTML = `<strong>Decimal Points Aligned:</strong> Decimal points stay locked in line like buttons on a coat!`;
    } else {
      if (captionEl) captionEl.innerHTML = `<strong>Compare Place Values:</strong> Always compare or add like units: Tens with Tens, Ones with Ones, Tenths with Tenths!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  // Generic Step Pills
  if (btn.hasAttribute("data-expl-step")) {
    const s = btn.dataset.explStep;
    if (s === "1") {
      if (captionEl) captionEl.innerHTML = `<strong>1. Notice the Problem:</strong> Identify what the question asks and the key numbers given.`;
    } else if (s === "2") {
      if (captionEl) captionEl.innerHTML = `<strong>2. Solve Strategy:</strong> Break numbers into friendly parts or apply the matching mathematical relationship.`;
    } else {
      if (captionEl) captionEl.innerHTML = `<strong>3. Final Answer:</strong> Verify your answer is reasonable before moving on!`;
    }
    if (typeof chime === "function") chime("step");
    return true;
  }

  return false;
}

document.querySelector("#open-print-center")?.addEventListener("click", () => {
  TeacherPrintCenter.open();
});

document.addEventListener("click", (event) => {
  if (handleExplanationInteraction(event)) return;
  const explToolBtn = event.target.closest("[data-open-tool]");
  if (explToolBtn) {
    const tool = explToolBtn.dataset.openTool;
    InteractiveDrillToolbox.openTool(tool, state.item || { skill: state.item?.skill });
    announce(`Opened ${tool} manipulative workout in the strategy drawer.`);
    return;
  }
  if (event.target.closest("[data-open-print-center]")) {
    const targetTab = event.target.closest("[data-open-print-center]").dataset.targetTab || "mats";
    TeacherPrintCenter.open(targetTab);
    return;
  }
  if (event.target.closest("#print-selected-partner-game")) {
    const sel = document.querySelector("#partner-game-select")?.value || "war";
    printPartnerGame(sel, state.grade);
    return;
  }
  if (event.target.closest("#open-number-talk-btn")) {
    NumberTalkRoutine.open(state.grade);
    return;
  }
  if (event.target.closest("[data-close-number-talk]")) {
    NumberTalkRoutine.close();
    return;
  }
  if (event.target.closest("#nt-toggle-lang")) {
    NumberTalkRoutine.toggleLang();
    return;
  }
  if (event.target.closest("#nt-print-routine")) {
    printNumberTalkRoutine();
    return;
  }
  const ntGradeBtn = event.target.closest("[data-nt-grade]");
  if (ntGradeBtn) {
    NumberTalkRoutine.setGrade(Number(ntGradeBtn.dataset.ntGrade));
    return;
  }
  const ntPhaseBtn = event.target.closest("[data-nt-phase]");
  if (ntPhaseBtn) {
    NumberTalkRoutine.setPhase(ntPhaseBtn.dataset.ntPhase);
    return;
  }
  if (event.target.closest("[data-nt-prev]")) {
    NumberTalkRoutine.prevTalk();
    return;
  }
  if (event.target.closest("[data-nt-next]")) {
    NumberTalkRoutine.nextTalk();
    return;
  }
  const rxBtn = event.target.closest("[data-launch-workout]");
  if (rxBtn) {
    const tool = rxBtn.dataset.launchWorkout;
    const skillKey = rxBtn.dataset.skillKey;
    const skill = findSkill(skillKey);
    const entry = state.tutor.mistakes.find((m) => m.key === skillKey);
    InteractiveDrillToolbox.openTool(tool, entry ? { question: entry.question, skill } : { skill });
    announce(`Opened ${tool} manipulative workout in the strategy drawer.`);
    return;
  }
  if (event.target.closest("[data-close-print-center]")) {
    TeacherPrintCenter.close();
    return;
  }
  const tabBtn = event.target.closest("[data-tpt-tab]");
  if (tabBtn) {
    TeacherPrintCenter.activeTab = tabBtn.dataset.tptTab;
    TeacherPrintCenter.renderTab(TeacherPrintCenter.activeTab);
    return;
  }
  const printAction = event.target.closest("[data-tpt-print]");
  if (printAction) {
    const act = printAction.dataset.tptPrint;
    if (act === "mat") printStudentRecordingMat();
    else if (act === "exits") printTieredExitTickets();
    else if (act === "desk") printDeskHelperStrips();
    else if (act === "anchor") printStrategyAnchorCharts();
    else if (act === "passport") printFluencyPassport();
    else if (act === "brag") printBragTags();
    else if (act === "tent") printStationTentCards();
    else if (act === "coaching") printSmallGroupCoachingCueSheet();
    else if (act === "parent") printFridgeMathGuide();
    return;
  }
});

const MathWordWall = {
  activeCategory: "all",
  searchQuery: "",

  open(termId) {
    const modal = document.querySelector("#word-wall-modal");
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("vocab-modal-open");
    this.render();
    if (termId) {
      setTimeout(() => {
        const target = modal.querySelector(`[data-ww-term="${termId}"]`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  },

  close() {
    const modal = document.querySelector("#word-wall-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("vocab-modal-open");
  },

  getCategory(term) {
    const id = term.id;
    if (["fraction", "numerator", "denominator", "reciprocal"].includes(id)) return "fractions";
    if (["factor", "multiple", "prime", "composite", "dividend", "divisor", "quotient", "remainder", "divide", "gcf", "lcm", "exponent"].includes(id)) return "operations";
    if (["variable", "equation", "expression", "integer", "absolute value", "opposite", "zero pair"].includes(id)) return "algebra";
    if (["ratio", "unit rate", "percent"].includes(id)) return "ratios";
    return "operations";
  },

  render(filterText = this.searchQuery, category = this.activeCategory) {
    this.searchQuery = filterText || "";
    this.activeCategory = category || "all";

    const viewport = document.querySelector("#ww-modal-viewport");
    if (!viewport) return;

    const query = this.searchQuery.toLowerCase().trim();
    const allTerms = Object.values(VOCAB_BILINGUAL_DB || {});

    const filtered = allTerms.filter((term) => {
      const cat = this.getCategory(term);
      if (this.activeCategory !== "all" && cat !== this.activeCategory) return false;
      if (!query) return true;
      const haystack = [
        term.id,
        term.enTitle,
        term.esTitle,
        term.enDef,
        term.esDef,
        ...(term.keywords || [])
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });

    if (!filtered.length) {
      viewport.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:3rem 1rem; color:#64748b;">
          <p style="font-size:2rem; margin:0 0 0.5rem">🔍</p>
          <p style="font-weight:700; margin:0">No matching math words found.</p>
          <p style="font-size:0.88rem; margin:4px 0 0">Try searching for "fraction", "factor", "ratio", or "integer".</p>
        </div>
      `;
      return;
    }

    viewport.innerHTML = filtered.map((t) => `
      <article class="ww-card" data-ww-term="${escapeHtml(t.id)}">
        <div class="ww-card-head">
          <div>
            <h3 class="ww-card-title">${escapeHtml(t.enTitle)}</h3>
            <div class="ww-card-es-title">${escapeHtml(t.esTitle)}</div>
          </div>
          <button type="button" class="ww-card-tts" data-ww-tts="${escapeHtml(t.enTitle + '. ' + t.enDef)}" aria-label="Listen to definition" title="Read aloud">🔊</button>
        </div>
        <p class="ww-card-def">${escapeHtml(t.enDef)}</p>
        <p class="ww-card-es-def"><em>${escapeHtml(t.esDef)}</em></p>
        ${t.svg ? `<div class="ww-card-svg">${t.svg}</div>` : ""}
      </article>
    `).join("");
  },

  wire() {
    const openBtn = document.querySelector("#open-word-wall-btn");
    const modal = document.querySelector("#word-wall-modal");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.open());
    }
    if (modal) {
      modal.querySelectorAll("[data-close-word-wall]").forEach((btn) => {
        btn.addEventListener("click", () => this.close());
      });
      const searchInput = modal.querySelector("#ww-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => this.render(e.target.value, this.activeCategory));
      }
      modal.querySelectorAll("[data-ww-cat]").forEach((catBtn) => {
        catBtn.addEventListener("click", () => {
          modal.querySelectorAll("[data-ww-cat]").forEach((b) => b.classList.toggle("active", b === catBtn));
          this.render(this.searchQuery, catBtn.dataset.wwCat);
        });
      });
      modal.addEventListener("click", (e) => {
        const ttsBtn = e.target.closest("[data-ww-tts]");
        if (ttsBtn) {
          const txt = ttsBtn.dataset.wwTts || "";
          if (txt) speak(txt);
        }
      });
    }
  }
};

populateQuickSkillDropdown();
applySettings();
renderLibrary();
initVoiceControl();
initVocabSystem();
initLanguage();
// Opening a word meaning before the first answer is help, like a hint, so it does not count as independent.
document.addEventListener(
  "toggle",
  (event) => {
    if (event.target.matches?.("[data-lang-hint], #drill-toolbox") && event.target.open) markHelp();
  },
  true,
);
// A column-board box that missed or was opened for the learner is help too.
document.addEventListener("vc-help", markHelp);
window.addEventListener("fluency-language-print", () => printHtml(journalPrintHtml({ name: PROFILE_NAMES[activeProfile], grade: state.grade })));
MathWordWall.wire();
window.NumberTalkRoutine = NumberTalkRoutine;
window.TeacherPrintCenter = TeacherPrintCenter;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", registerSharedSaveResume, { once: true });
} else {
  registerSharedSaveResume();
}
const initialSkill = initialParams.get("skill");
if (initialSkill) openSkill(initialSkill);
renderProfiles();
renderAssignmentBanner();
if (["teacher", "games"].includes(initialParams.get("view"))) openHubView(initialParams.get("view"));

