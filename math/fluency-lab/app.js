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
import { highlightVocab, initVocabSystem, openVocabModal } from "./vocab.js";
import { canSpeak, speak } from "./speech.js";

const STORAGE_KEY = "ewl-fluency-progress-v1";
const SETTINGS_KEY = "ewl-fluency-settings-v1";
const TUTOR_KEY = "ewl-fluency-tutor-v2";
const SESSION_KEY = "ewl-fluency-session-v2";
const STREAK_GOAL = 10;
const initialParams = new URLSearchParams(location.search);
let activeProfile = profiles().active;
// Pin this tab to its learner now, so another tab switching learners later cannot move this one.
selectProfile(activeProfile);
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
  els.insight.textContent = state.session.mode === "diagnostic" ? "One sample per skill. Choose “I’m not sure yet” whenever you need to." : state.session.queue?.[state.session.answered]?.purpose || (state.initialSupport ? "A smaller step with coaching. We’ll build back toward independent work." : adapting && level === 2 ? "Your recent answers were strong. Try this one independently, then explain a check." : adapting ? "Work at your pace. Help is here when you need it." : "");
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
    els.toggleSolver.hidden = !InteractiveSolver.canSolve(state.item);
    els.toggleSolver.setAttribute("aria-expanded", "false");
  }
  if (els.solverWorkspace) {
    els.solverWorkspace.hidden = true;
    els.solverWorkspace.innerHTML = "";
  }
  document.querySelector("#kinetic-decomposer-host")?.remove();
  const isFlashcard = state.session.mode === "flashcard";
  if (els.flashcardStage) els.flashcardStage.hidden = !isFlashcard;
  document.querySelector(".problem-meta")?.classList.toggle("is-flashcard-hidden", isFlashcard);
  const arenaEl = els.problemArena || document.querySelector("#problem-arena");
  if (arenaEl) arenaEl.hidden = isFlashcard;
  const actionsBar = document.querySelector(".problem-actions-bar");
  if (actionsBar) actionsBar.hidden = isFlashcard;
  if (els.problemVisualScaffold) els.problemVisualScaffold.hidden = isFlashcard;
  if (els.toggleProblemVisual) els.toggleProblemVisual.hidden = isFlashcard;
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
    let expr = rawQ.replace(/\s*[=?_]+\s*$/, "").trim();
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

const gcd = (a, b) => { let x = Math.abs(a), y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x || 1; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

const InteractiveSolver = {
  canSolve(item) {
    if (!item) return false;
    const q = item.question ? item.question.replaceAll(",", "").trim() : "";
    if (/find the lcm of \d+ and \d+/i.test(q)) return true;
    if (/find the gcf of \d+ and \d+/i.test(q)) return true;

    // Multi-digit whole number division:
    const divMatch = q.replace(/\s*=\s*\?.*$/, "").match(/^(\d+)\s*[÷/]\s*(\d+)$/);
    if (divMatch && !q.includes("/")) {
      const a = Number(divMatch[1]);
      const b = Number(divMatch[2]);
      if (a >= 20 && b >= 2 && a > b) return true;
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

    // Multi-digit addition with carry (at least one number >= 10 and generates carry):
    const addMatch = q.match(/^(\d+)\s*\+\s*(\d+)/);
    if (addMatch) {
      const a = Number(addMatch[1]);
      const b = Number(addMatch[2]);
      if (a >= 10 || b >= 10) {
        const strA = String(a);
        const strB = String(b);
        const maxLen = Math.max(strA.length, strB.length);
        const padA = strA.padStart(maxLen, "0");
        const padB = strB.padStart(maxLen, "0");
        let carry = 0;
        let hasCarry = false;
        for (let i = maxLen - 1; i >= 0; i--) {
          const s = Number(padA[i]) + Number(padB[i]) + carry;
          if (s >= 10) { hasCarry = true; carry = 1; } else { carry = 0; }
        }
        if (hasCarry) return true;
      }
    }

    // Multi-digit subtraction with borrow:
    const subMatch = q.match(/^(\d+)\s*[−-]\s*(\d+)/);
    if (subMatch) {
      const a = Number(subMatch[1]);
      const b = Number(subMatch[2]);
      if (a >= 10 && a > b) {
        const strA = String(a);
        const strB = String(b).padStart(strA.length, "0");
        for (let i = strA.length - 1; i >= 0; i--) {
          if (Number(strA[i]) < Number(strB[i])) return true;
        }
      }
    }

    // Fraction division: Keep, Change, Flip
    if (/(\d+)\/(\d+)\s*[÷/]\s*(\d+)\/(\d+)/.test(q)) return true;

    return false;
  },

  render(item, container) {
    if (!container || !item) return;
    const q = item.question.replaceAll(",", "").trim();

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

    // 2. Vertical Addition with Regrouping / Carry Boxes
    const addMatch = q.match(/^(\d+)\s*\+\s*(\d+)/);
    if (addMatch) {
      const a = Number(addMatch[1]);
      const b = Number(addMatch[2]);
      const sum = a + b;
      const strA = String(a);
      const strB = String(b);
      const maxLen = Math.max(strA.length, strB.length);
      const padA = strA.padStart(maxLen, " ");
      const padB = strB.padStart(maxLen, " ");

      const carries = Array(maxLen + 1).fill(0);
      let c = 0;
      for (let i = 0; i < maxLen; i++) {
        const da = Number(padA[maxLen - 1 - i]) || 0;
        const db = Number(padB[maxLen - 1 - i]) || 0;
        const colSum = da + db + c;
        c = Math.floor(colSum / 10);
        carries[maxLen - 1 - i] = c;
      }

      container.innerHTML = `
        <div class="solver-header">
          <strong>🧮 Interactive Vertical Addition &amp; Regrouping</strong>
          <span class="solver-hint-tag">Type carries &amp; digits right to left</span>
        </div>
        <div style="display:flex; justify-content:center">
          <div class="vertical-algorithm-grid">
            <div class="algo-carry-row">
              <span class="algo-col" style="font-size:0.75rem; color:#b45309">Regroup:</span>
              ${carries.slice(0, maxLen).map((cr) => `<input type="text" class="algo-carry-box" inputmode="numeric" maxlength="1" data-carry="${cr}" placeholder="${cr ? "1" : ""}" title="Regroup / carry box" />`).join("")}
            </div>
            <div class="algo-num-row">
              <span class="algo-col"></span>
              ${padA.split("").map((ch) => `<span class="algo-col">${ch === " " ? "" : ch}</span>`).join("")}
            </div>
            <div class="algo-num-row">
              <span class="algo-col">+</span>
              ${padB.split("").map((ch) => `<span class="algo-col">${ch === " " ? "" : ch}</span>`).join("")}
            </div>
            <div class="algo-divider"></div>
            <div class="algo-ans-row">
              ${String(sum).split("").map((digit, idx) => `<input type="text" class="algo-digit-input" inputmode="numeric" maxlength="1" data-ans-digit="${digit}" data-pos="${idx}" placeholder="?" />`).join("")}
            </div>
          </div>
        </div>
      `;

      const digitInputs = [...container.querySelectorAll(".algo-digit-input")];
      const carryInputs = [...container.querySelectorAll(".algo-carry-box")];

      carryInputs.forEach((ci) => {
        ci.addEventListener("input", () => {
          if (ci.value.trim() === ci.dataset.carry) ci.classList.add("is-ok");
        });
      });

      digitInputs.forEach((di, idx) => {
        di.addEventListener("input", () => {
          if (di.value.trim() === di.dataset.ansDigit) {
            di.classList.add("is-ok");
            chime("step");
            if (idx > 0) digitInputs[idx - 1].focus();
            if (digitInputs.every((d) => d.classList.contains("is-ok"))) {
              els.answerInput.value = String(sum);
              chime("good");
            }
          }
        });
      });
      return;
    }

    // 3. Vertical Subtraction with Borrowing / Regrouping
    const subMatch = q.match(/^(\d+)\s*[−-]\s*(\d+)/);
    if (subMatch) {
      const a = Number(subMatch[1]);
      const b = Number(subMatch[2]);
      const diff = a - b;
      const strA = String(a);
      const strB = String(b);
      const maxLen = Math.max(strA.length, strB.length);
      const padA = strA.padStart(maxLen, " ");
      const padB = strB.padStart(maxLen, " ");

      container.innerHTML = `
        <div class="solver-header">
          <strong>🧮 Interactive Vertical Subtraction &amp; Regrouping</strong>
          <span class="solver-hint-tag">Borrow from tens when top is smaller</span>
        </div>
        <div style="display:flex; justify-content:center">
          <div class="vertical-algorithm-grid">
            <div class="algo-carry-row">
              <span class="algo-col" style="font-size:0.75rem; color:#b91c1c">Regroup:</span>
              ${padA.split("").map(() => `<input type="text" class="algo-borrow-box" inputmode="numeric" placeholder="?" title="Regroup / borrow box" />`).join("")}
            </div>
            <div class="algo-num-row">
              <span class="algo-col"></span>
              ${padA.split("").map((ch) => `<span class="algo-col">${ch === " " ? "" : ch}</span>`).join("")}
            </div>
            <div class="algo-num-row">
              <span class="algo-col">−</span>
              ${padB.split("").map((ch) => `<span class="algo-col">${ch === " " ? "" : ch}</span>`).join("")}
            </div>
            <div class="algo-divider"></div>
            <div class="algo-ans-row">
              ${String(diff).split("").map((digit, idx) => `<input type="text" class="algo-digit-input" inputmode="numeric" maxlength="1" data-ans-digit="${digit}" data-pos="${idx}" placeholder="?" />`).join("")}
            </div>
          </div>
        </div>
      `;

      const digitInputs = [...container.querySelectorAll(".algo-digit-input")];
      digitInputs.forEach((di, idx) => {
        di.addEventListener("input", () => {
          if (di.value.trim() === di.dataset.ansDigit) {
            di.classList.add("is-ok");
            chime("step");
            if (idx > 0) digitInputs[idx - 1].focus();
            if (digitInputs.every((d) => d.classList.contains("is-ok"))) {
              els.answerInput.value = String(diff);
              chime("good");
            }
          }
        });
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
              <input type="text" class="lcm-prime-input" data-frac-target="${d}" style="width:48px" placeholder="${d}" title="Flipped numerator" />
              <span>/</span>
              <input type="text" class="lcm-prime-input" data-frac-target="${c}" style="width:48px" placeholder="${c}" title="Flipped denominator" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Multiply: </span>
              <span>(${a} × ${d}) / (${b} × ${c}) = </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${top}" style="width:58px" placeholder="${top}" />
              <span>/</span>
              <input type="text" class="lcm-prime-input" data-frac-target="${bot}" style="width:58px" placeholder="${bot}" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Simplified Final Answer: </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${finalAns}" style="width:84px" placeholder="${finalAns}" />
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
              <input type="text" class="lcm-prime-input" data-frac-target="${top}" style="width:58px" placeholder="${top}" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Multiply Denominators: ${b} × ${d} = </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${bot}" style="width:58px" placeholder="${bot}" />
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem">
              <span>Simplified Final Answer: </span>
              <input type="text" class="lcm-prime-input" data-frac-target="${finalAns}" style="width:84px" placeholder="${finalAns}" />
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
    const divMatch = q.replace(/\s*=\s*\?.*$/, "").match(/^(\d+)\s*[÷/]\s*(\d+)$/);
    if (divMatch && !q.includes("/")) {
      const dividend = Number(divMatch[1]);
      const divisor = Number(divMatch[2]);
      if (dividend >= 20 && divisor >= 2 && dividend > divisor) {
        const quotient = Math.floor(dividend / divisor);
        const digits = String(dividend).split("").map(Number);
        const steps = [];
        let cur = 0;
        let started = false;
        for (let i = 0; i < digits.length; i++) {
          cur = cur * 10 + digits[i];
          const qDigit = Math.floor(cur / divisor);
          if (qDigit > 0 || started || i === digits.length - 1) {
            started = true;
            const prod = qDigit * divisor;
            const rem = cur - prod;
            steps.push({ pos: i, digit: digits[i], cur, qDigit, prod, rem });
            cur = rem;
          }
        }

        container.innerHTML = `
          <div class="solver-header">
            <strong>➗ Interactive Standard Algorithm Bracket: Divide → Multiply → Subtract → Bring Down</strong>
            <span class="solver-hint-tag">Fill each quotient digit above</span>
          </div>
          <div class="long-div-workspace">
            <div class="long-div-bracket-box">
              <div class="long-div-quotient-row">
                <span class="long-div-spacer"></span>
                ${digits.map((_, idx) => {
                  const s = steps.find((st) => st.pos === idx);
                  if (!s) return `<span class="long-div-q-col"></span>`;
                  return `<input type="text" class="long-div-q-input" inputmode="numeric" maxlength="1" data-target="${s.qDigit}" data-step="${s.pos}" placeholder="?" title="Quotient digit" />`;
                }).join("")}
              </div>
              <div class="long-div-dividend-row">
                <span class="long-div-divisor">${divisor}</span>
                <span class="long-div-bracket">)</span>
                <div class="long-div-overbar">
                  ${digits.map((d) => `<span class="long-div-col">${d}</span>`).join("")}
                </div>
              </div>
            </div>
            <div class="long-div-steps-guide">
              ${steps.map((st, sIdx) => `
                <div class="long-div-step-card" data-step-card="${st.pos}">
                  <span class="step-num-pill">Step ${sIdx + 1}</span>
                  <div class="step-line"><strong>Divide:</strong> How many times does <strong>${divisor}</strong> go into <strong>${st.cur}</strong>? → <strong>${st.qDigit}</strong></div>
                  <div class="step-line"><strong>Multiply:</strong> ${st.qDigit} × ${divisor} = <strong>${st.prod}</strong></div>
                  <div class="step-line"><strong>Subtract:</strong> ${st.cur} − ${st.prod} = <strong>${st.rem}</strong></div>
                  ${sIdx < steps.length - 1 ? `<div class="step-line bring-down"><strong>Bring Down:</strong> Next digit ${steps[sIdx + 1].digit} → ${st.rem}${steps[sIdx + 1].digit}</div>` : `<div class="step-line final-rem">Remainder: <strong>${st.rem}</strong></div>`}
                </div>
              `).join("")}
            </div>
            <div class="solver-calc-row" style="margin-top:0.75rem">
              <span>Full Quotient: <strong>${dividend} ÷ ${divisor} =</strong></span>
              <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${quotient}" data-group="div-final" style="width:78px" placeholder="Quotient" />
              <button type="button" class="outline-action" id="div-copy-ans" style="display:none">Copy to Answer</button>
            </div>
          </div>
        `;

        const qInputs = [...container.querySelectorAll(".long-div-q-input")];
        const finalInp = container.querySelector('[data-group="div-final"]');

        qInputs.forEach((qi, i) => {
          qi.addEventListener("input", () => {
            if (qi.value.trim() === qi.dataset.target) {
              qi.classList.add("is-ok");
              chime("step");
              if (i + 1 < qInputs.length) qInputs[i + 1].focus();
              if (qInputs.every((q) => q.classList.contains("is-ok"))) {
                if (finalInp) {
                  finalInp.value = String(quotient);
                  finalInp.classList.add("is-ok");
                }
                els.answerInput.value = String(quotient);
                chime("good");
                const copyBtn = container.querySelector("#div-copy-ans");
                if (copyBtn) {
                  copyBtn.style.display = "inline-block";
                  copyBtn.textContent = "✓ Copied to answer!";
                }
              }
            }
          });
        });

        finalInp?.addEventListener("input", () => {
          if (finalInp.value.trim() === String(quotient)) {
            finalInp.classList.add("is-ok");
            els.answerInput.value = String(quotient);
            chime("good");
            const copyBtn = container.querySelector("#div-copy-ans");
            if (copyBtn) {
              copyBtn.style.display = "inline-block";
              copyBtn.textContent = "✓ Copied to answer!";
            }
          }
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
          <span class="solver-hint-tag">Apply inverse operations to both sides</span>
        </div>
        <div class="eq-balance-scaffold">
          <div class="balance-scale-svg-wrap">
            <svg class="balance-scale-svg" viewBox="0 0 400 160" aria-label="Balance scale illustration">
              <!-- Base and Fulcrum -->
              <polygon points="185,150 215,150 200,90" fill="#64748b" />
              <circle cx="200" cy="90" r="7" fill="#0f172a" />
              <!-- Level Beam -->
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
      const step1Inp = container.querySelector('[data-group="eq-step1"]');
      const step2Inp = container.querySelector('[data-group="eq-step2"]');
      const finalInp = container.querySelector('[data-group="eq-final"]');

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
        if (statusSpan) {
          statusSpan.innerHTML = `✓ <strong>${zeroPairs} zero pair(s) cancelled</strong>! Net remaining = <strong>${ans}</strong>`;
        }
        if (intFinalInp) {
          intFinalInp.value = String(ans);
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

function renderWidaStudio(item) {
  if (!item) return "";
  const q = item.question || "";
  const ans = item.displayAnswer || (item.answers && item.answers[0]) || "";

  let wordsEn = ["Strategy", "Reasoning", "Estimate", "Solution", "Check"];
  let wordsEs = ["Estrategia", "Razonamiento", "Estimar", "Solución", "Verificar"];

  if (/(\d+)\/(\d+)/.test(q)) {
    wordsEn = ["Numerator", "Denominator", "Equal parts", "Common denominator", "Reciprocal", "Equivalent"];
    wordsEs = ["Numerador", "Denominador", "Partes iguales", "Denominador común", "Recíproco", "Equivalente"];
  } else if (/\b[xy]\b|[=]/.test(q) && /solve|equation|linear/i.test(item.skill?.id || "")) {
    wordsEn = ["Variable", "Equation", "Coefficient", "Inverse operation", "Balance both sides", "Isolate"];
    wordsEs = ["Variable", "Ecuación", "Coeficiente", "Operación inversa", "Balancear ambos lados", "Aislar"];
  } else if (/[-−]\d+/.test(q) || /integer/i.test(item.skill?.id || "")) {
    wordsEn = ["Positive", "Negative", "Zero pair", "Opposite", "Number line", "Absolute value"];
    wordsEs = ["Positivo", "Negativo", "Par cero", "Opuesto", "Recta numérica", "Valor absoluto"];
  } else if (/[×*÷/]/.test(q) || /mul|div|factor/i.test(item.skill?.id || "")) {
    wordsEn = ["Factor", "Product", "Quotient", "Equal groups", "Array", "Decompose"];
    wordsEs = ["Factor", "Producto", "Cociente", "Grupos iguales", "Matriz", "Descomponer"];
  } else if (/%|ratio|rate|proportion/i.test(q) || /ratio|rate/i.test(item.skill?.id || "")) {
    wordsEn = ["Ratio", "Rate", "Unit rate", "Proportion", "Scale factor", "Per unit"];
    wordsEs = ["Razón", "Tasa", "Tasa unitaria", "Proporción", "Factor de escala", "Por unidad"];
  } else if (/[+−\-]/.test(q)) {
    wordsEn = ["Addend", "Sum", "Difference", "Tens and ones", "Regroup", "Friendly numbers"];
    wordsEs = ["Sumando", "Suma", "Diferencia", "Decenas y unidades", "Reagrupar", "Números amigables"];
  }

  const cleanQ = q.replace("= ?", "").trim();

  const framesEn = [
    { type: "Explain", text: `I solved ${cleanQ} by decomposing into friendly parts because it makes calculation simpler.` },
    { type: "Explain", text: `First I identified the core operation in ${cleanQ}, and then I calculated step-by-step.` },
    { type: "Argue", text: `My answer of ${ans} is reasonable because the visual model and estimation verify it.` },
    { type: "Argue", text: `I can prove this solution is correct using inverse operations to check the result.` },
  ];

  const framesEs = [
    { type: "Explicar", text: `Resolví ${cleanQ} descomponiendo en partes amigables porque simplifica el cálculo.` },
    { type: "Explicar", text: `Primero identifiqué la operación clave en ${cleanQ}, y luego calculé paso a paso.` },
    { type: "Argumentar", text: `Mi respuesta de ${ans} es razonable porque el modelo visual y la estimación lo verifican.` },
    { type: "Argumentar", text: `Puedo demostrar que esta solución es correcta usando operaciones inversas para comprobar.` },
  ];

  return `
    <details class="wida-studio-wrap">
      <summary class="wida-studio-summary">
        <span>🗣️</span> <strong>Math Language Studio · WIDA ELD Standard 3</strong>
        <span class="wida-pill">Dual-Language Scaffolds</span>
      </summary>
      <div class="wida-studio-body">
        <div class="wida-lang-toggle-bar">
          <span class="wida-subheading">Scaffold Language:</span>
          <button type="button" class="wida-lang-chip active" data-wida-toggle="en">English</button>
          <button type="button" class="wida-lang-chip" data-wida-toggle="es">Español</button>
        </div>
        
        <div class="wida-frames-group" data-wida-lang-group="en">
          <p class="wida-instruction"><strong>Select a Sentence Starter (Explain &amp; Argue):</strong></p>
          <div class="wida-chip-row">
            ${framesEn.map((f) => `<button type="button" class="wida-frame-btn" data-wida-insert="${escapeHtml(f.text)}"><span class="wida-badge-type">${f.type}</span> ${escapeHtml(f.text)}</button>`).join("")}
          </div>
          <p class="wida-instruction"><strong>Academic Vocabulary &amp; Cognates:</strong></p>
          <div class="wida-chip-row">
            ${wordsEn.map((w, idx) => `<button type="button" class="wida-word-btn" data-wida-word="${escapeHtml(w)}">${escapeHtml(w)} <small class="wida-cognate">(${escapeHtml(wordsEs[idx])})</small></button>`).join("")}
          </div>
        </div>

        <div class="wida-frames-group" data-wida-lang-group="es" hidden>
          <p class="wida-instruction"><strong>Selecciona una estructura de oración (Explicar y Argumentar):</strong></p>
          <div class="wida-chip-row">
            ${framesEs.map((f) => `<button type="button" class="wida-frame-btn" data-wida-insert="${escapeHtml(f.text)}"><span class="wida-badge-type">${f.type}</span> ${escapeHtml(f.text)}</button>`).join("")}
          </div>
          <p class="wida-instruction"><strong>Vocabulario Académico y Cognados:</strong></p>
          <div class="wida-chip-row">
            ${wordsEs.map((w, idx) => `<button type="button" class="wida-word-btn" data-wida-word="${escapeHtml(w)}">${escapeHtml(w)} <small class="wida-cognate">(${escapeHtml(wordsEn[idx])})</small></button>`).join("")}
          </div>
        </div>

        <div class="wida-composer-row">
          <label for="wida-reasoning-input" class="wida-sr">Your Math Justification</label>
          <textarea id="wida-reasoning-input" class="wida-textarea" rows="2" placeholder="Tap a sentence starter above or write your mathematical justification..."></textarea>
          <div class="wida-action-bar">
            <button type="button" class="wida-speech-btn" data-wida-speak-btn>🔊 Read Aloud / Escuchar</button>
            <span class="wida-feedback-hint" aria-live="polite"></span>
          </div>
        </div>
      </div>
    </details>
  `;
}

function renderStudentFriendlyExplanation(item, copy) {
  if (!item) return `<p>${escapeHtml(copy)}</p>`;
  const q = item.question || "";
  let visualSvg = "";
  let goal = "Solve accurately by identifying the core relationship.";
  let tip = item.hint || "Take your time: make a friendly estimate first.";
  let suggestedTool = null;
  let toolLabel = "";

  const divFrac = q.match(/(\d+)\/(\d+)\s*[÷/]\s*(\d+)\/(\d+)/);
  const addSubFrac = q.match(/(\d+)\/(\d+)\s*([+−\-])\s*(\d+)\/(\d+)/);
  const mulMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/);
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/);
  const addMatch = q.match(/(\d+)\s*[+]\s*(\d+)/);
  const subMatch = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
  const intMatch = q.match(/(-?\d+)\s*([+−\-])\s*(-?\d+)/);
  const eqMatch = q.match(/([a-zA-Z]|\?|\b[xy]\b)\s*([+−\-×÷=])/);
  const isDecimal = /\d+\.\d+/.test(q);
  const isTensOnes = /tens|ones|place value|digit in the/i.test(q);
  const isPercent = /%|percent/i.test(q);

  if (divFrac) {
    const [, a, b, c, d] = divFrac;
    goal = `Divide fractions using Keep, Change, Flip!`;
    tip = `Never divide fractions directly. Multiply by the reciprocal (the flip) of the second fraction!`;
    suggestedTool = "fractions";
    toolLabel = "Fraction Wall";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Keep Change Flip Visual Diagram">
          <rect x="15" y="15" width="85" height="60" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="57" y="38" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">KEEP</text>
          <text x="57" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="#1e3a8a">${a}/${b}</text>
          
          <rect x="120" y="15" width="65" height="60" rx="8" fill="#fdf4ff" stroke="#a855f7" stroke-width="2"/>
          <text x="152" y="38" text-anchor="middle" font-size="11" font-weight="800" fill="#7e22ce">CHANGE</text>
          <text x="152" y="62" text-anchor="middle" font-size="18" font-weight="900" fill="#6b21a8">×</text>
          
          <rect x="205" y="8" width="85" height="74" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>
          <text x="247" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#15803d">FLIP</text>
          <text x="247" y="52" text-anchor="middle" font-size="15" font-weight="900" fill="#14532d">${d}/${c}</text>
          <text x="247" y="70" text-anchor="middle" font-size="9" font-weight="700" fill="#166534">Reciprocal</text>

          <text x="308" y="52" font-size="16" font-weight="900" fill="#0f172a">➔</text>
          <text x="345" y="52" text-anchor="middle" font-size="14" font-weight="900" fill="#0369a1">${item.displayAnswer}</text>
        </svg>
      </div>`;
  } else if (addSubFrac) {
    const [, a, b, op, c, d] = addSubFrac;
    goal = `Make like denominators so pieces are the same size before combining!`;
    tip = `The denominator names the size of the slice. Only add or subtract the top numerators!`;
    suggestedTool = "fractions";
    toolLabel = "Fraction Wall";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Fraction Like Denominators Model">
          <rect x="20" y="18" width="140" height="26" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="90" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="#1e40af">${a}/${b}</text>
          
          <text x="180" y="36" text-anchor="middle" font-size="16" font-weight="900" fill="#0f172a">${op}</text>
          
          <rect x="200" y="18" width="140" height="26" rx="4" fill="#fdf4ff" stroke="#a855f7" stroke-width="1.5"/>
          <text x="270" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="#7e22ce">${c}/${d}</text>
          
          <line x1="20" y1="56" x2="360" y2="56" stroke="#cbd5e1" stroke-dasharray="3,3"/>
          <text x="190" y="74" text-anchor="middle" font-size="12" font-weight="800" fill="#0369a1">Match Denominators ➔ Result = ${item.displayAnswer}</text>
        </svg>
      </div>`;
  } else if (mulMatch) {
    const a = Number(mulMatch[1]);
    const b = Number(mulMatch[2]);
    goal = `Think of ${a} equal groups of ${b}.`;
    tip = a <= 12 && b <= 12 ? `Break hard facts into easy 5-facts and 2-facts you know!` : `Use partial products: multiply tens first, then ones!`;
    suggestedTool = "multigrid";
    toolLabel = "10×10 Grid";
    const totalDots = Math.min(24, Math.max(1, a * b));
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Multiplication Array Representation">
          <rect x="15" y="12" width="160" height="66" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
          <text x="95" y="35" text-anchor="middle" font-size="11" font-weight="800" fill="#15803d">${a} equal rows of ${b}</text>
          <text x="95" y="58" text-anchor="middle" font-size="18" font-weight="900" fill="#166534">${a} × ${b} = ${a * b}</text>
          
          <line x1="195" y1="15" x2="195" y2="75" stroke="#e2e8f0" stroke-width="2"/>
          
          <text x="285" y="35" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b">Repeated Addition:</text>
          <text x="285" y="58" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">${b} + ${b}${a > 2 ? ` + ... (${a} times)` : ""}</text>
        </svg>
      </div>`;
  } else if (divMatch) {
    const a = Number(divMatch[1]);
    const b = Number(divMatch[2]);
    const quot = b > 0 ? a / b : 0;
    goal = `Division asks: How many groups of ${b} fit in ${a}?`;
    tip = `Think backwards using multiplication: ${b} × ? = ${a}.`;
    suggestedTool = "numberline";
    toolLabel = "Number Line";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="90" viewBox="0 0 380 90" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Division Equal Groups Model">
          <rect x="20" y="15" width="340" height="34" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="190" y="37" text-anchor="middle" font-size="14" font-weight="900" fill="#1e3a8a">Total: ${a}</text>
          
          <text x="190" y="70" text-anchor="middle" font-size="12" font-weight="800" fill="#0369a1">Split into equal groups of ${b} ➔ Makes ${quot} groups!</text>
        </svg>
      </div>`;
  } else if (addMatch && !isDecimal) {
    const a = Number(addMatch[1]);
    const b = Number(addMatch[2]);
    goal = `Start at ${Math.max(a, b)} and jump forward by friendly parts!`;
    tip = `Always start with the larger number—it requires fewer jumps!`;
    suggestedTool = "numberline";
    toolLabel = "Number Line";
    const startVal = Math.max(a, b);
    const jumpVal = Math.min(a, b);
    const endVal = startVal + jumpVal;
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="85" viewBox="0 0 380 85" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Addition Open Number Line Jump">
          <line x1="25" y1="55" x2="355" y2="55" stroke="#334155" stroke-width="2.5"/>
          <polygon points="360,55 350,50 350,60" fill="#334155"/>
          
          <circle cx="70" cy="55" r="5" fill="#2563eb"/>
          <text x="70" y="75" text-anchor="middle" font-size="13" font-weight="900" fill="#1e293b">${startVal}</text>
          
          <path d="M 70 50 Q 190 10 310 50" fill="none" stroke="#2563eb" stroke-width="2.5"/>
          <polygon points="310,50 302,42 300,52" fill="#2563eb"/>
          <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="900" fill="#1d4ed8">+${jumpVal}</text>
          
          <circle cx="310" cy="55" r="5" fill="#16a34a"/>
          <text x="310" y="75" text-anchor="middle" font-size="14" font-weight="900" fill="#15803d">${endVal}</text>
        </svg>
      </div>`;
  } else if (subMatch && !isDecimal) {
    const a = Number(subMatch[1]);
    const b = Number(subMatch[2]);
    goal = `Start at ${a} and jump back ${b} to find the difference!`;
    tip = `Think of subtraction as distance on a number line or counting down in friendly hops.`;
    suggestedTool = "numberline";
    toolLabel = "Number Line";
    const endVal = a - b;
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="85" viewBox="0 0 380 85" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Subtraction Number Line Jump Back">
          <line x1="25" y1="55" x2="355" y2="55" stroke="#334155" stroke-width="2.5"/>
          <polygon points="20,55 30,50 30,60" fill="#334155"/>
          
          <circle cx="310" cy="55" r="5" fill="#dc2626"/>
          <text x="310" y="75" text-anchor="middle" font-size="13" font-weight="900" fill="#1e293b">${a}</text>
          
          <path d="M 310 50 Q 190 10 70 50" fill="none" stroke="#dc2626" stroke-width="2.5"/>
          <polygon points="70,50 78,42 80,52" fill="#dc2626"/>
          <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="900" fill="#b91c1c">−${b}</text>
          
          <circle cx="70" cy="55" r="5" fill="#16a34a"/>
          <text x="70" y="75" text-anchor="middle" font-size="14" font-weight="900" fill="#15803d">${endVal}</text>
        </svg>
      </div>`;
  } else if (isTensOnes) {
    goal = `Separate numbers into groups of 10 and leftover single 1s.`;
    tip = `Every 2-digit number has Tens on the left and Ones on the right!`;
    suggestedTool = "tenframe";
    toolLabel = "Ten-Frame";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="80" viewBox="0 0 380 80" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Base Ten Blocks Representation">
          <rect x="40" y="15" width="18" height="50" rx="3" fill="#3b82f6"/>
          <rect x="65" y="15" width="18" height="50" rx="3" fill="#3b82f6"/>
          <text x="61" y="75" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">Tens Rods</text>
          
          <line x1="140" y1="12" x2="140" y2="68" stroke="#cbd5e1" stroke-width="2"/>
          
          <rect x="180" y="32" width="16" height="16" rx="2" fill="#eab308"/>
          <rect x="202" y="32" width="16" height="16" rx="2" fill="#eab308"/>
          <rect x="224" y="32" width="16" height="16" rx="2" fill="#eab308"/>
          <text x="210" y="75" text-anchor="middle" font-size="11" font-weight="800" fill="#a16207">Ones Units</text>
          
          <text x="320" y="45" text-anchor="middle" font-size="14" font-weight="900" fill="#0369a1">${item.displayAnswer}</text>
        </svg>
      </div>`;
  } else if (isDecimal) {
    goal = `Line up the decimal points like buttons on a coat so matching place values add correctly!`;
    tip = `Always check the reasonable size of your answer before finalizing.`;
    suggestedTool = "numberline";
    toolLabel = "Number Line";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="85" viewBox="0 0 380 85" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Decimal Alignment Visual">
          <rect x="30" y="12" width="320" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
          <text x="90" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Ones</text>
          <text x="140" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#dc2626">•</text>
          <text x="190" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Tenths</text>
          <text x="260" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#64748b">Hundredths</text>
          
          <text x="190" y="58" text-anchor="middle" font-size="14" font-weight="900" fill="#0f172a">Decimal points stay aligned in the answer!</text>
        </svg>
      </div>`;
  } else if (intMatch && (q.includes("−") || q.includes("-") || q.includes("negative") || q.includes("integer"))) {
    goal = `Combine positive and negative integer counters. Zero pairs cancel out!`;
    tip = `Subtracting a negative is the exact same as adding a positive!`;
    suggestedTool = "integers";
    toolLabel = "Integer Chips Mat";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="80" viewBox="0 0 380 80" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Integer Zero Pair Chips">
          <circle cx="60" cy="35" r="16" fill="#3b82f6"/>
          <text x="60" y="41" text-anchor="middle" font-size="18" font-weight="900" fill="#ffffff">+</text>
          <text x="100" y="40" text-anchor="middle" font-size="16" font-weight="900" fill="#334155">+</text>
          <circle cx="140" cy="35" r="16" fill="#ef4444"/>
          <text x="140" y="41" text-anchor="middle" font-size="18" font-weight="900" fill="#ffffff">−</text>
          
          <text x="195" y="40" text-anchor="middle" font-size="18" font-weight="900" fill="#64748b">=</text>
          
          <rect x="230" y="18" width="120" height="36" rx="8" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="3,3"/>
          <text x="290" y="41" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">0 (Zero Pair!)</text>
        </svg>
      </div>`;
  } else if (eqMatch) {
    goal = `Keep the scale balanced! Whatever you do to one side, you must do to the other side.`;
    tip = `Use inverse operations: undo addition with subtraction, and undo multiplication with division!`;
    suggestedTool = "balance";
    toolLabel = "Interactive Pan Balance";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="85" viewBox="0 0 380 85" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Algebra Balance Scale Model">
          <polygon points="190,45 175,75 205,75" fill="#475569"/>
          <line x1="70" y1="45" x2="310" y2="45" stroke="#1e293b" stroke-width="4"/>
          
          <rect x="85" y="20" width="50" height="25" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="110" y="37" text-anchor="middle" font-size="12" font-weight="900" fill="#1e40af">Left Side</text>
          
          <rect x="245" y="20" width="50" height="25" rx="4" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>
          <text x="270" y="37" text-anchor="middle" font-size="12" font-weight="900" fill="#15803d">Right Side</text>
          
          <text x="190" y="24" text-anchor="middle" font-size="14" font-weight="900" fill="#0f172a">=</text>
        </svg>
      </div>`;
  } else if (/find the lcm of/i.test(q) || /gcf|greatest common factor/i.test(q)) {
    goal = `Break numbers into prime factors to find shared and combined multipliers.`;
    tip = `For LCM, take the highest power of each prime. For GCF, multiply only the shared primes!`;
    suggestedTool = "multigrid";
    toolLabel = "10×10 Grid";
  } else if (isPercent || /ratio|rate|per hour|per mile|per minute|speed|scale/i.test(q)) {
    goal = `Percent and ratios compare parts to wholes or scale at constant rates!`;
    tip = `Use a double number line to scale both quantities up or down together.`;
    suggestedTool = "doublenumberline";
    toolLabel = "Double Number Line";
    visualSvg = `
      <div class="student-expl-visual">
        <svg width="380" height="75" viewBox="0 0 380 75" style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0" role="img" aria-label="Percent and Ratio Bar Model">
          <rect x="25" y="20" width="330" height="26" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <rect x="25" y="20" width="165" height="26" rx="6" fill="#3b82f6"/>
          <text x="25" y="62" text-anchor="middle" font-size="10" font-weight="800" fill="#64748b">0%</text>
          <text x="190" y="62" text-anchor="middle" font-size="11" font-weight="900" fill="#1e40af">50% (Half)</text>
          <text x="355" y="62" text-anchor="middle" font-size="10" font-weight="800" fill="#64748b">100%</text>
        </svg>
      </div>`;
  }

  const stepsList = item.steps && item.steps.length > 1
    ? `<div class="student-expl-steps-wrap">
        <p class="student-expl-steps-heading"><strong>🪜 Clear Action Steps:</strong></p>
        <ol class="student-expl-steps-list">
          ${item.steps.map((st) => `<li>${mathText(st)}</li>`).join("")}
        </ol>
      </div>`
    : `<p class="student-expl-goal">${escapeHtml(copy)}</p>`;

  const toolCallout = suggestedTool
    ? `<div class="student-expl-tool-callout">
        <button type="button" class="expl-tool-launcher" data-open-tool="${suggestedTool}">
          <span>🧮</span> Try It on the Interactive ${escapeHtml(toolLabel)}
        </button>
      </div>`
    : "";

  return `
    <div class="student-expl-card">
      <div class="student-expl-header">
        <span class="student-expl-badge">💡 Strategy &amp; Solution Guide</span>
      </div>
      <p class="student-expl-goal"><strong>🎯 Goal:</strong> ${escapeHtml(goal)}</p>
      ${visualSvg}
      ${stepsList}
      <div class="student-expl-tip"><strong>💡 Pro Tip:</strong> ${escapeHtml(tip)}</div>
      ${toolCallout}
      ${renderWidaStudio(item)}
    </div>
  `;
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
  if (isMultiplication && state.item?.model?.type === "array") {
    const a = state.item.model.a || 1;
    const b = state.item.model.b || 1;
    const total = a * b;
    host.innerHTML = `
      <div class="publisher-model-card">
        <p class="pub-model-title">Visual Grid: <strong>${a} rows of ${b}</strong> (${a} × ${b} = ${total})</p>
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
    saveActiveSession();
    if (!state.item.choices) els.answerInput.select();
    return;
  }
  if (state.itemAttempts === 1) {
    showFeedback("Try once more", feedbackFor(state.item.skill, state.item, value), "try");
    els.repair.hidden = false;
    saveActiveSession();
    els.answerInput.select();
    return;
  }
  finalizeProblem(false);
}

function finalizeProblem(correct) {
  const session = state.session;
  if (!session || session.finished || state.itemDone) return;
  state.itemDone = true;
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

function showFeedback(title, copy, type) {
  els.feedback.hidden = false;
  els.feedback.dataset.type = type;
  els.feedbackTitle.textContent = title;
  if (type !== "correct" && state.item) {
    els.feedbackCopy.innerHTML = renderStudentFriendlyExplanation(state.item, copy);
  } else {
    els.feedbackCopy.textContent = copy;
  }
  if (type === "correct") chime("good");
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

function speakProblem() {
  if (!state.item || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const text = state.item.question.replaceAll("×", " times ").replaceAll("÷", " divided by ").replaceAll("−", " minus ");
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
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

function renderDashboard() {
  const ranked = recommendations(state.tutor, state.grade);
  const next = ranked[0];
  const saved = loadJson(SESSION_KEY, null);
  const today = state.tutor.sessions.filter((session) => localDay(session.at) === localDay()).reduce((sum, session) => sum + session.answered, 0);
  const due = ranked.filter((entry) => entry.status.due).length;
  els.dashboard.innerHTML = `<div class="next-step-card"><p class="section-label">${escapeHtml(PROFILE_NAMES[activeProfile])}’s next step</p><h3>${escapeHtml(next.skill.title)}</h3><p>${escapeHtml(next.reason)}. Start with the visual idea or go straight to practice.</p><div class="button-row"><button class="primary-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="visual">See the idea</button><button class="outline-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="adaptive">Practice this skill</button></div></div>
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
    }).join("")}</div><section class="family-guide"><h3>For families: five useful minutes</h3><ol><li>Let your child choose one developing skill.</li><li>Ask, “What do you notice?” before giving a method.</li><li>Use the visual lesson together when a step feels unclear.</li><li>Let your child try a few fresh questions independently.</li><li>Ask, “How could you check that?” Celebrate a useful strategy or a repaired mistake.</li></ol><p>Fresh problems are generated each visit. A familiar topic can be practiced again tomorrow without repeating a fixed worksheet.</p></section>`;
}

function renderNotebook() {
  const entries = state.tutor.mistakes.filter((entry) => findSkill(entry.key)?.grade === state.grade);
  const open = entries.filter((entry) => !entry.resolvedAt);
  els.notebook.innerHTML = `
    <div class="garage-banner">
      <div>
        <span class="garage-badge">🔧 THE FIX-IT GARAGE</span>
        <h2 style="margin:4px 0 2px; font-size:1.6rem; color:#fff">Tune Up Your Tricky Skills</h2>
        <p style="margin:0; font-size:0.95rem; color:#94a3b8">Every mistake is a vehicle in the shop. Tune it up with tools, then solve 2 fresh problems to roll out with green lights!</p>
      </div>
      ${open.length ? '<button class="primary-action" data-repair-all style="background:#f59e0b; color:#78350f; font-weight:900; border:none; padding:10px 16px; border-radius:8px; cursor:pointer">⚡ Tune Up All (' + open.length + ')</button>' : ''}
    </div>
    ${entries.length ? `<div class="mistake-list">${entries.map((entry) => {
      const skill = findSkill(entry.key);
      const isRepaired = !!entry.resolvedAt;
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
          <details style="margin:10px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px">
            <summary style="font-weight:700; cursor:pointer">🔍 Peek at the Mechanic's Blueprint</summary>
            <p style="margin:6px 0 4px"><strong>Strategy Hint:</strong> ${escapeHtml(entry.hint)}</p>
            <p style="margin:4px 0"><strong>Solution Walkthrough:</strong> ${escapeHtml(entry.explanation)}</p>
            <p style="margin:4px 0; color:#b45309"><strong>Watch Out:</strong> ${escapeHtml(skill.learn.watch)}</p>
          </details>
          <div class="button-row">
            <button class="outline-action" data-open-key="${entry.key}" data-open-mode="visual">🛠️ Build with Tools</button>
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
  saveActiveSession(); saveSettings(); selectProfile(id); activeProfile = id;
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
els.hearButton.addEventListener("click", speakProblem);
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
  const launcher = event.target.closest(".expl-tool-launcher");
  if (launcher) {
    const tool = launcher.dataset.openTool;
    const drawer = document.querySelector("#drill-toolbox");
    if (drawer) {
      drawer.open = true;
      if (typeof InteractiveDrillToolbox !== "undefined") {
        InteractiveDrillToolbox.activeTool = tool;
        drawer.querySelectorAll(".tool-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tool === tool));
        InteractiveDrillToolbox.render(document.querySelector("#drill-tool-viewport"));
      }
      drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return;
  }
  const widaLangBtn = event.target.closest("[data-wida-toggle]");
  if (widaLangBtn) {
    const lang = widaLangBtn.dataset.widaToggle;
    const card = widaLangBtn.closest(".wida-studio-wrap");
    if (card) {
      card.querySelectorAll("[data-wida-toggle]").forEach((b) => b.classList.toggle("active", b.dataset.widaToggle === lang));
      card.querySelectorAll("[data-wida-lang-group]").forEach((g) => {
        g.hidden = g.dataset.widaLangGroup !== lang;
      });
    }
    return;
  }
  const widaInsertBtn = event.target.closest("[data-wida-insert]");
  if (widaInsertBtn) {
    const text = widaInsertBtn.dataset.widaInsert;
    const card = widaInsertBtn.closest(".wida-studio-wrap");
    const textarea = card?.querySelector("#wida-reasoning-input");
    if (textarea) {
      textarea.value = text;
      textarea.focus();
    }
    return;
  }
  const widaWordBtn = event.target.closest("[data-wida-word]");
  if (widaWordBtn) {
    const word = widaWordBtn.dataset.widaWord;
    const card = widaWordBtn.closest(".wida-studio-wrap");
    const textarea = card?.querySelector("#wida-reasoning-input");
    if (textarea) {
      const val = textarea.value.trim();
      textarea.value = val ? `${val} ${word}` : word;
      textarea.focus();
    }
    return;
  }
  const widaSpeakBtn = event.target.closest("[data-wida-speak-btn]");
  if (widaSpeakBtn) {
    const card = widaSpeakBtn.closest(".wida-studio-wrap");
    const textarea = card?.querySelector("#wida-reasoning-input");
    const hint = card?.querySelector(".wida-feedback-hint");
    const content = textarea?.value?.trim() || "";
    if (content) {
      speak(content);
      if (hint) {
        hint.textContent = "Speaking explanation... 🔊";
        setTimeout(() => { hint.textContent = ""; }, 2500);
      }
    } else {
      if (hint) {
        hint.textContent = "Please select or type a sentence starter first!";
        setTimeout(() => { hint.textContent = ""; }, 2500);
      }
    }
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
window.FlowPacerEngine = FlowPacerEngine;
window.FluencyTelemetryHUD = FluencyTelemetryHUD;
window.SpacedZPDEngine = SpacedZPDEngine;

const InteractiveDrillToolbox = {
  activeTool: "numberline",
  tenFrameCount: 0,
  numberLinePos: 5,
  multRow: 6,
  multCol: 7,
  balanceLeftX: 1,
  balanceLeftConst: 3,
  balanceRightVal: 9,
  integersPos: 5,
  integersNeg: 3,
  dnlStep: 2,
  dnlMultiplierA: 35,
  dnlMultiplierB: 1,
  dnlLabelA: "Miles",
  dnlLabelB: "Hours",
  pizzaSlices: 8,
  pizzaEaten: [0, 1, 2],
  splitTarget: 14,
  splitLeft: 10,
  splitRight: 4,
  tapeA: 3,
  tapeB: 2,
  tapeUnit: 5,
  tapeLabelA: "Apples",
  tapeLabelB: "Oranges",

  render(container) {
    if (!container) return;
    if (this.activeTool === "numberline") {
      const pos = this.numberLinePos;
      const ticks = Array.from({ length: 21 }, (_, i) => {
        const isCurrent = i === pos;
        return `<g class="nl-tick" data-val="${i}" style="cursor:pointer">
          <line x1="${25 + i * 18}" y1="35" x2="${25 + i * 18}" y2="${isCurrent ? "12" : "24"}" stroke="${isCurrent ? "#17345f" : "#64748b"}" stroke-width="${isCurrent ? "3" : "1.5"}"/>
          <text x="${25 + i * 18}" y="52" text-anchor="middle" font-size="${isCurrent ? "12" : "10"}" font-weight="${isCurrent ? "800" : "600"}" fill="${isCurrent ? "#17345f" : "#475569"}">${i}</text>
          ${isCurrent ? `<circle cx="${25 + i * 18}" cy="18" r="5" fill="#17345f"/>` : ""}
        </g>`;
      }).join("");
      container.innerHTML = `
        <div class="tool-content">
          <div class="tool-controls">
            <span>Position: <strong>${pos}</strong></span>
            <button type="button" class="mini-tool-btn" data-nl-step="-1">−1</button>
            <button type="button" class="mini-tool-btn" data-nl-step="1">+1</button>
            <button type="button" class="mini-tool-btn" data-nl-step="-5">−5</button>
            <button type="button" class="mini-tool-btn" data-nl-step="5">+5</button>
            <button type="button" class="mini-tool-btn" data-nl-reset>Reset</button>
          </div>
          <svg width="100%" height="68" viewBox="0 0 420 68" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="Interactive number line 0 to 20 at position ${pos}">
            <line x1="15" y1="35" x2="400" y2="35" stroke="#1e293b" stroke-width="2"/>
            <polygon points="405,35 397,31 397,39" fill="#1e293b"/>
            ${ticks}
          </svg>
        </div>
      `;
    } else if (this.activeTool === "tenframe") {
      const count = this.tenFrameCount;
      const slots = Array.from({ length: 20 }, (_, i) => {
        const filled = i < count;
        const isTen = i < 10;
        return `<div class="tf-slot ${filled ? (isTen ? "red" : "blue") : "empty"}" data-slot="${i}" role="button" aria-label="Slot ${i + 1} ${filled ? "filled" : "empty"}" tabindex="0">
          ${filled ? `<span class="counter-dot"></span>` : ""}
        </div>`;
      });
      container.innerHTML = `
        <div class="tool-content">
          <div class="tool-controls">
            <span>Counters: <strong>${count} of 20</strong> (${Math.min(10, count)} in first frame${count > 10 ? `, ${count - 10} in second` : ""})</span>
            <button type="button" class="mini-tool-btn" data-tf-add="1">+1</button>
            <button type="button" class="mini-tool-btn" data-tf-sub="1">−1</button>
            <button type="button" class="mini-tool-btn" data-tf-clear>Clear</button>
          </div>
          <div class="ten-frame-double-grid">
            <div class="ten-frame-box" aria-label="First Ten-Frame">${slots.slice(0, 10).join("")}</div>
            <div class="ten-frame-box" aria-label="Second Ten-Frame">${slots.slice(10, 20).join("")}</div>
          </div>
        </div>
      `;
    } else if (this.activeTool === "multigrid") {
      const r = this.multRow;
      const c = this.multCol;
      const rows = Array.from({ length: 10 }, (_, rowIdx) => {
        const rowNum = rowIdx + 1;
        const cells = Array.from({ length: 10 }, (_, colIdx) => {
          const colNum = colIdx + 1;
          const active = rowNum <= r && colNum <= c;
          const isTarget = rowNum === r && colNum === c;
          return `<button type="button" class="mg-cell ${active ? "active" : ""} ${isTarget ? "target" : ""}" data-row="${rowNum}" data-col="${colNum}" title="${rowNum} × ${colNum} = ${rowNum * colNum}">${rowNum * colNum}</button>`;
        }).join("");
        return `<div class="mg-row"><span class="mg-head">${rowNum}</span>${cells}</div>`;
      }).join("");
      const head = `<div class="mg-row head-row"><span>×</span>${Array.from({ length: 10 }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>`;
      container.innerHTML = `
        <div class="tool-content">
          <div class="tool-controls">
            <span>Current Array: <strong>${r} × ${c} = ${r * c}</strong></span>
          </div>
          <div class="mult-grid-table">${head}${rows}</div>
        </div>
      `;
    } else if (this.activeTool === "fractions") {
      const denoms = [1, 2, 3, 4, 5, 6, 8, 10, 12];
      const rows = denoms.map((d) => {
        const parts = Array.from({ length: d }, (_, i) => `<div class="fw-part" style="width:${100 / d}%">1/${d}</div>`).join("");
        return `<div class="fw-row" aria-label="Denominator ${d}"><span class="fw-label">1/${d}</span><div class="fw-strip">${parts}</div></div>`;
      }).join("");
      container.innerHTML = `
        <div class="tool-content">
          <div class="tool-controls">
            <span>Fraction Strips Wall · Compare equivalent lengths</span>
          </div>
          <div class="fraction-wall-container">${rows}</div>
        </div>
      `;
    } else if (this.activeTool === "balance") {
      const lx = this.balanceLeftX;
      const lc = this.balanceLeftConst;
      const rv = this.balanceRightVal;
      const isSolved = lx === 1 && lc === 0;
      const xBoxes = Array.from({ length: lx }, (_, i) =>
        `<g transform="translate(${40 + i * 22}, 0)">
           <rect x="0" y="0" width="18" height="18" rx="3" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/>
           <text x="9" y="13" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff">x</text>
         </g>`
      ).join("");
      const leftCubes = Array.from({ length: lc }, (_, i) =>
        `<g transform="translate(${40 + (lx * 22) + i * 16}, 2)">
           <rect x="0" y="0" width="14" height="14" rx="2" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
           <text x="7" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#713f12">1</text>
         </g>`
      ).join("");
      const rightCubes = Array.from({ length: rv }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        return `<g transform="translate(${250 + col * 16}, ${row * 16})">
           <rect x="0" y="0" width="14" height="14" rx="2" fill="#22c55e" stroke="#16a34a" stroke-width="1.5"/>
           <text x="7" y="11" text-anchor="middle" font-size="9" font-weight="800" fill="#14532d">1</text>
         </g>`;
      }).join("");

      container.innerHTML = `
        <div class="tool-content balance-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span class="balance-status-badge ${isSolved ? "balanced" : "unbalanced"}">
              ${isSolved ? `🎉 Solved: <strong>x = ${rv}</strong>` : `Equation: <strong>${lx > 1 ? lx : ""}x + ${lc} = ${rv}</strong>`}
            </span>
            <button type="button" class="mini-tool-btn" data-bal-add-x="1">+1 x</button>
            <button type="button" class="mini-tool-btn" data-bal-sub-x="1" ${lx <= 1 ? "disabled" : ""}>−1 x</button>
            <button type="button" class="mini-tool-btn" data-bal-add-lc="1">+1 Left</button>
            <button type="button" class="mini-tool-btn" data-bal-sub-lc="1" ${lc <= 0 ? "disabled" : ""}>−1 Left</button>
            <button type="button" class="mini-tool-btn" data-bal-sub-both ${lc > 0 && rv >= lc ? "" : "disabled"}>Subtract ${lc} From Both Sides</button>
            ${lx > 1 && lc === 0 && rv % lx === 0 ? `<button type="button" class="mini-tool-btn" data-bal-div-both="1" style="background:#dcfce7; color:#15803d; border-color:#86efac; font-weight:700">Divide Both Sides by ${lx}</button>` : ""}
            <button type="button" class="mini-tool-btn" data-bal-reset>Reset</button>
          </div>
          <svg width="100%" height="110" viewBox="0 0 420 110" style="background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="Visual Pan Balance showing equation ${lx}x + ${lc} = ${rv}">
            <!-- Base and fulcrum -->
            <polygon points="210,50 198,85 222,85" fill="#475569"/>
            <rect x="180" y="85" width="60" height="6" rx="2" fill="#334155"/>
            <!-- Beam -->
            <line x1="30" y1="50" x2="390" y2="50" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
            <circle cx="210" cy="50" r="5" fill="#0f172a"/>
            <!-- Left Pan strings and plate -->
            <line x1="35" y1="50" x2="70" y2="78" stroke="#64748b" stroke-width="1.5"/>
            <line x1="165" y1="50" x2="130" y2="78" stroke="#64748b" stroke-width="1.5"/>
            <rect x="35" y="78" width="130" height="6" rx="3" fill="#0284c7"/>
            <!-- Right Pan strings and plate -->
            <line x1="255" y1="50" x2="290" y2="78" stroke="#64748b" stroke-width="1.5"/>
            <line x1="385" y1="50" x2="350" y2="78" stroke="#64748b" stroke-width="1.5"/>
            <rect x="255" y="78" width="130" height="6" rx="3" fill="#0284c7"/>
            <!-- Items on pans -->
            <g transform="translate(0, 58)">${xBoxes}${leftCubes}</g>
            <g transform="translate(0, 50)">${rightCubes}</g>
            <!-- Labels -->
            <text x="100" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">Left: ${lx > 0 ? (lx > 1 ? lx : "") + "x" : ""}${lc > 0 ? (lx > 0 ? " + " : "") + lc : ""}</text>
            <text x="320" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">Right: ${rv}</text>
          </svg>
        </div>
      `;
    } else if (this.activeTool === "integers") {
      const pos = this.integersPos;
      const neg = this.integersNeg;
      const net = pos - neg;
      const zeroPairs = Math.min(pos, neg);
      const remainingPos = pos - zeroPairs;
      const remainingNeg = neg - zeroPairs;

      const pairsHtml = Array.from({ length: zeroPairs }, () =>
        `<div class="chip-zero-pair" title="Zero Pair: (+1) + (-1) = 0">
           <div class="chip-circle pos">+</div>
           <div class="chip-circle neg">−</div>
           <span style="font-size:0.75rem; font-weight:800; color:#15803d; margin-left:2px">= 0</span>
         </div>`
      ).join("");

      const posChipsHtml = Array.from({ length: remainingPos }, () =>
        `<div class="chip-circle pos" title="Positive 1">+</div>`
      ).join("");

      const negChipsHtml = Array.from({ length: remainingNeg }, () =>
        `<div class="chip-circle neg" title="Negative 1">−</div>`
      ).join("");

      container.innerHTML = `
        <div class="tool-content chips-mat-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span>Net Value: <strong style="font-size:1.1rem; color:${net > 0 ? "#2563eb" : net < 0 ? "#dc2626" : "#15803d"}">${net > 0 ? "+" + net : net}</strong></span>
            <span style="color:#64748b; font-size:0.85rem">(${pos} positive, ${neg} negative · ${zeroPairs} zero pair${zeroPairs === 1 ? "" : "s"})</span>
            <button type="button" class="mini-tool-btn" data-int-add-pos="+1">+1 (+)</button>
            <button type="button" class="mini-tool-btn" data-int-sub-pos="1" ${pos <= 0 ? "disabled" : ""}>−1 (+)</button>
            <button type="button" class="mini-tool-btn" data-int-add-neg="+1">+1 (−)</button>
            <button type="button" class="mini-tool-btn" data-int-sub-neg="1" ${neg <= 0 ? "disabled" : ""}>−1 (−)</button>
            <button type="button" class="mini-tool-btn" data-int-add-pair>+ Zero Pair</button>
            <button type="button" class="mini-tool-btn" data-int-cancel-pairs ${zeroPairs <= 0 ? "disabled" : ""}>Cancel Zero Pairs</button>
            <button type="button" class="mini-tool-btn" data-int-clear>Clear</button>
          </div>
          <div class="chips-board" aria-label="Integer chip workspace">
            ${pos === 0 && neg === 0 ? `<span style="color:#94a3b8; font-size:0.9rem; margin:auto">Click buttons above to add positive (+) or negative (−) chips</span>` : ""}
            ${pairsHtml}
            ${posChipsHtml}
            ${negChipsHtml}
          </div>
        </div>
      `;
    } else if (this.activeTool === "doublenumberline") {
      const step = this.dnlStep;
      const unitA = this.dnlMultiplierA;
      const unitB = this.dnlMultiplierB;
      const labelA = this.dnlLabelA || "Miles";
      const labelB = this.dnlLabelB || "Hours";

      const maxSteps = 5;
      const ticksA = [];
      const ticksB = [];
      const connectors = [];

      for (let i = 0; i <= maxSteps; i++) {
        const x = 35 + i * 70;
        const valA = i * unitA;
        const valB = i * unitB;
        const isSelected = i === step;

        ticksA.push(`
          <g class="dnl-tick" data-dnl-step="${i}" style="cursor:pointer">
            <line x1="${x}" y1="28" x2="${x}" y2="38" stroke="${isSelected ? "#2563eb" : "#475569"}" stroke-width="${isSelected ? "3" : "1.5"}"/>
            <text x="${x}" y="22" text-anchor="middle" font-size="${isSelected ? "12" : "10"}" font-weight="${isSelected ? "900" : "600"}" fill="${isSelected ? "#1d4ed8" : "#334155"}">${valA}</text>
          </g>
        `);

        ticksB.push(`
          <g class="dnl-tick" data-dnl-step="${i}" style="cursor:pointer">
            <line x1="${x}" y1="72" x2="${x}" y2="82" stroke="${isSelected ? "#2563eb" : "#475569"}" stroke-width="${isSelected ? "3" : "1.5"}"/>
            <text x="${x}" y="96" text-anchor="middle" font-size="${isSelected ? "12" : "10"}" font-weight="${isSelected ? "900" : "600"}" fill="${isSelected ? "#1d4ed8" : "#334155"}">${valB}</text>
          </g>
        `);

        if (i > 0) {
          connectors.push(`
            <line x1="${x}" y1="38" x2="${x}" y2="72" stroke="${isSelected ? "#2563eb" : "#cbd5e1"}" stroke-width="${isSelected ? "2" : "1"}" stroke-dasharray="${isSelected ? "none" : "3,3"}"/>
          `);
        }
      }

      container.innerHTML = `
        <div class="tool-content dnl-tool-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span>Rate: <strong>${step * unitA} ${labelA}</strong> in <strong>${step * unitB} ${labelB}</strong> (Unit rate: ${unitA} ${labelA} per 1 ${labelB})</span>
            <button type="button" class="mini-tool-btn" data-dnl-preset="speed">🚗 35 mph</button>
            <button type="button" class="mini-tool-btn" data-dnl-preset="cost">💵 $4.50 / Item</button>
            <button type="button" class="mini-tool-btn" data-dnl-preset="percent">📊 25% of 100</button>
            <button type="button" class="mini-tool-btn" data-dnl-step-inc="-1" ${step <= 0 ? "disabled" : ""}>Step −1</button>
            <button type="button" class="mini-tool-btn" data-dnl-step-inc="1" ${step >= maxSteps ? "disabled" : ""}>Step +1</button>
          </div>
          <svg width="100%" height="110" viewBox="0 0 420 110" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="Double Number Line for ${labelA} and ${labelB}">
            <!-- Line A -->
            <line x1="20" y1="33" x2="395" y2="33" stroke="#1e293b" stroke-width="2"/>
            <polygon points="400,33 392,29 392,37" fill="#1e293b"/>
            <text x="25" y="16" font-size="10" font-weight="800" fill="#2563eb">${labelA}</text>
            <!-- Line B -->
            <line x1="20" y1="77" x2="395" y2="77" stroke="#1e293b" stroke-width="2"/>
            <polygon points="400,77 392,73 392,81" fill="#1e293b"/>
            <text x="25" y="105" font-size="10" font-weight="800" fill="#059669">${labelB}</text>
            <!-- Connectors -->
            ${connectors.join("")}
            <!-- Ticks -->
            ${ticksA.join("")}
            ${ticksB.join("")}
          </svg>
        </div>
      `;
    } else if (this.activeTool === "pizza") {
      const n = this.pizzaSlices;
      const eaten = this.pizzaEaten;
      const r = 52;
      const cx = 210;
      const cy = 60;
      const slicesSvg = Array.from({ length: n }, (_, i) => {
        const a1 = (i * 2 * Math.PI) / n - Math.PI / 2;
        const a2 = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2);
        const y2 = cy + r * Math.sin(a2);
        const isEaten = eaten.includes(i);
        const d = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`;
        const midA = (a1 + a2) / 2;
        const px = cx + (r * 0.6) * Math.cos(midA);
        const py = cy + (r * 0.6) * Math.sin(midA);
        return `
          <g class="pizza-slice-path" data-slice="${i}" role="button" aria-label="Slice ${i + 1} of ${n} ${isEaten ? "eaten" : "remaining"}">
            <path d="${d}" fill="${isEaten ? "#fed7aa" : "#f1f5f9"}" stroke="${isEaten ? "#ea580c" : "#94a3b8"}" stroke-width="${isEaten ? "2" : "1.5"}" stroke-dasharray="${isEaten ? "none" : "3,3"}"/>
            ${isEaten ? `<circle cx="${px}" cy="${py}" r="3.5" fill="#dc2626"/>` : ""}
          </g>
        `;
      }).join("");

      container.innerHTML = `
        <div class="tool-content pizza-tool-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span>Pizza Slices: <strong style="font-size:1.1rem; color:#ea580c">${eaten.length}/${n} Eaten</strong> (${n - eaten.length}/${n} Remaining)</span>
            <span style="color:#64748b">| Slices:</span>
            ${[2, 3, 4, 6, 8, 12].map((s) => `<button type="button" class="mini-tool-btn ${s === n ? "active" : ""}" data-pizza-set="${s}">${s}</button>`).join("")}
            <button type="button" class="mini-tool-btn" data-pizza-eat-one>+1 Eat</button>
            <button type="button" class="mini-tool-btn" data-pizza-reset>Reset</button>
          </div>
          <svg width="100%" height="120" viewBox="0 0 420 120" style="background:#ffffff; border-radius:8px; border:1px solid #cbd5e1" role="img" aria-label="Pizza Fraction Slicer showing ${eaten.length} of ${n} slices">
            <circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
            ${slicesSvg}
          </svg>
        </div>
      `;
    } else if (this.activeTool === "splitter") {
      const t = this.splitTarget;
      const l = this.splitLeft;
      const r = this.splitRight;
      container.innerHTML = `
        <div class="tool-content splitter-tool-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span>Decompose: <strong>${t} = ${l} + ${r}</strong></span>
            <button type="button" class="mini-tool-btn" data-split-preset="14">14</button>
            <button type="button" class="mini-tool-btn" data-split-preset="25">25</button>
            <button type="button" class="mini-tool-btn" data-split-preset="48">48</button>
            <button type="button" class="mini-tool-btn" data-split-preset="85">85</button>
            <button type="button" class="mini-tool-btn" data-split-mode="tens">Tens &amp; Ones</button>
            <button type="button" class="mini-tool-btn" data-split-mode="halves">Half &amp; Half</button>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:0.5rem">
            <div class="splitter-bubble target" title="Target Number">${t}</div>
            <div style="font-size:1.1rem; color:#64748b; font-weight:800">↓ ✂️ Decompose ↓</div>
            <div style="display:flex; align-items:center; gap:1.2rem">
              <div class="splitter-bubble left" title="Left Part">${l}</div>
              <span style="font-size:1.4rem; font-weight:900; color:#334155">+</span>
              <div class="splitter-bubble right" title="Right Part">${r}</div>
              <span style="font-size:1.4rem; font-weight:900; color:#334155">=</span>
              <span style="font-size:1.3rem; font-weight:900; color:#0284c7">${t}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; width:100%; max-width:320px">
              <span style="font-size:0.8rem; font-weight:700">1</span>
              <input type="range" class="splitter-slider" min="1" max="${t - 1}" value="${l}" style="flex:1" data-split-slider/>
              <span style="font-size:0.8rem; font-weight:700">${t - 1}</span>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTool === "tape") {
      const a = this.tapeA;
      const b = this.tapeB;
      const u = this.tapeUnit;
      const labelA = this.tapeLabelA || "Part A";
      const labelB = this.tapeLabelB || "Part B";
      const totA = a * u;
      const totB = b * u;
      const grandTot = totA + totB;

      const cellsA = Array.from({ length: a }, () => `<div class="tape-cell a">${u}</div>`).join("");
      const cellsB = Array.from({ length: b }, () => `<div class="tape-cell b">${u}</div>`).join("");

      container.innerHTML = `
        <div class="tool-content tape-tool-container">
          <div class="tool-controls" style="flex-wrap:wrap; gap:0.5rem">
            <span>Ratio <strong>${a} : ${b}</strong> · Total: <strong>${grandTot}</strong> (Unit Value: ${u})</span>
            <button type="button" class="mini-tool-btn" data-tape-preset="3:2">3:2</button>
            <button type="button" class="mini-tool-btn" data-tape-preset="4:1">4:1</button>
            <button type="button" class="mini-tool-btn" data-tape-preset="5:3">5:3</button>
            <span style="color:#64748b">| Unit:</span>
            ${[1, 2, 5, 10].map((val) => `<button type="button" class="mini-tool-btn ${val === u ? "active" : ""}" data-tape-unit="${val}">${val}</button>`).join("")}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.6rem; padding:0.5rem">
            <div style="display:flex; align-items:center; gap:0.5rem">
              <strong style="width:65px; font-size:0.85rem; color:#2563eb">${labelA}:</strong>
              <div class="tape-bar-strip" style="flex:1">${cellsA}</div>
              <strong style="width:45px; text-align:right; font-size:1.05rem; color:#1d4ed8">${totA}</strong>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem">
              <strong style="width:65px; font-size:0.85rem; color:#059669">${labelB}:</strong>
              <div class="tape-bar-strip" style="flex:1">${cellsB}</div>
              <strong style="width:45px; text-align:right; font-size:1.05rem; color:#047857">${totB}</strong>
            </div>
            <div style="font-size:0.85rem; color:#475569; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; padding:6px 10px; margin-top:4px">
              💡 <em>If 1 block represents ${u}, then ${labelA} has ${a} blocks (${totA}) and ${labelB} has ${b} blocks (${totB}). Total = ${grandTot}.</em>
            </div>
          </div>
        </div>
      `;
    }
  },
  wire(container) {
    if (!container) return;
    container.addEventListener("click", (event) => {
      const toolTab = event.target.closest("[data-tool]");
      if (toolTab) {
        this.activeTool = toolTab.dataset.tool;
        container.querySelectorAll(".tool-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tool === this.activeTool));
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const nlStep = event.target.closest("[data-nl-step]");
      if (nlStep) {
        this.numberLinePos = Math.max(0, Math.min(20, this.numberLinePos + Number(nlStep.dataset.nlStep)));
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-nl-reset]")) {
        this.numberLinePos = 0;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const tick = event.target.closest(".nl-tick");
      if (tick) {
        this.numberLinePos = Number(tick.dataset.val);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-tf-add]")) {
        this.tenFrameCount = Math.min(20, this.tenFrameCount + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-tf-sub]")) {
        this.tenFrameCount = Math.max(0, this.tenFrameCount - 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-tf-clear]")) {
        this.tenFrameCount = 0;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const tfSlot = event.target.closest("[data-slot]");
      if (tfSlot) {
        const idx = Number(tfSlot.dataset.slot);
        this.tenFrameCount = idx + 1 === this.tenFrameCount ? idx : idx + 1;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const mgCell = event.target.closest(".mg-cell");
      if (mgCell) {
        this.multRow = Number(mgCell.dataset.row);
        this.multCol = Number(mgCell.dataset.col);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Balance Scale controls
      if (event.target.closest("[data-bal-add-x]")) {
        this.balanceLeftX = Math.min(5, this.balanceLeftX + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-sub-x]")) {
        this.balanceLeftX = Math.max(1, this.balanceLeftX - 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-add-lc]")) {
        this.balanceLeftConst = Math.min(20, this.balanceLeftConst + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-sub-lc]")) {
        this.balanceLeftConst = Math.max(0, this.balanceLeftConst - 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-sub-both]")) {
        const sub = this.balanceLeftConst;
        this.balanceRightVal = Math.max(0, this.balanceRightVal - sub);
        this.balanceLeftConst = 0;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-div-both]")) {
        this.balanceRightVal = Math.floor(this.balanceRightVal / this.balanceLeftX);
        this.balanceLeftX = 1;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-bal-reset]")) {
        this.balanceLeftX = 1;
        this.balanceLeftConst = 3;
        this.balanceRightVal = 9;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Integer Chips Mat controls
      if (event.target.closest("[data-int-add-pos]")) {
        this.integersPos = Math.min(15, this.integersPos + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-sub-pos]")) {
        this.integersPos = Math.max(0, this.integersPos - 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-add-neg]")) {
        this.integersNeg = Math.min(15, this.integersNeg + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-sub-neg]")) {
        this.integersNeg = Math.max(0, this.integersNeg - 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-add-pair]")) {
        this.integersPos = Math.min(15, this.integersPos + 1);
        this.integersNeg = Math.min(15, this.integersNeg + 1);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-cancel-pairs]")) {
        const pairs = Math.min(this.integersPos, this.integersNeg);
        this.integersPos -= pairs;
        this.integersNeg -= pairs;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-int-clear]")) {
        this.integersPos = 0;
        this.integersNeg = 0;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Double Number Line controls
      const dnlTick = event.target.closest("[data-dnl-step]");
      if (dnlTick) {
        this.dnlStep = Number(dnlTick.dataset.dnlStep);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const dnlInc = event.target.closest("[data-dnl-step-inc]");
      if (dnlInc) {
        this.dnlStep = Math.max(0, Math.min(5, this.dnlStep + Number(dnlInc.dataset.dnlStepInc)));
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const dnlPreset = event.target.closest("[data-dnl-preset]");
      if (dnlPreset) {
        const preset = dnlPreset.dataset.dnlPreset;
        if (preset === "speed") {
          this.dnlMultiplierA = 35;
          this.dnlMultiplierB = 1;
          this.dnlLabelA = "Miles";
          this.dnlLabelB = "Hours";
        } else if (preset === "cost") {
          this.dnlMultiplierA = 4.5;
          this.dnlMultiplierB = 1;
          this.dnlLabelA = "Dollars ($)";
          this.dnlLabelB = "Items";
        } else if (preset === "percent") {
          this.dnlMultiplierA = 25;
          this.dnlMultiplierB = 25;
          this.dnlLabelA = "Part";
          this.dnlLabelB = "Percent (%)";
        }
        this.dnlStep = 2;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Pizza Fraction Slicer
      const sliceEl = event.target.closest("[data-slice]");
      if (sliceEl) {
        const idx = Number(sliceEl.dataset.slice);
        if (this.pizzaEaten.includes(idx)) {
          this.pizzaEaten = this.pizzaEaten.filter((i) => i !== idx);
        } else {
          this.pizzaEaten.push(idx);
        }
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const pizzaSet = event.target.closest("[data-pizza-set]");
      if (pizzaSet) {
        this.pizzaSlices = Number(pizzaSet.dataset.pizzaSet);
        this.pizzaEaten = [0];
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-pizza-eat-one]")) {
        for (let i = 0; i < this.pizzaSlices; i++) {
          if (!this.pizzaEaten.includes(i)) {
            this.pizzaEaten.push(i);
            break;
          }
        }
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      if (event.target.closest("[data-pizza-reset]")) {
        this.pizzaEaten = [];
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Number Splitter
      const splitPreset = event.target.closest("[data-split-preset]");
      if (splitPreset) {
        this.splitTarget = Number(splitPreset.dataset.splitPreset);
        this.splitLeft = Math.floor(this.splitTarget / 2);
        this.splitRight = this.splitTarget - this.splitLeft;
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const splitMode = event.target.closest("[data-split-mode]");
      if (splitMode) {
        const mode = splitMode.dataset.splitMode;
        if (mode === "tens") {
          const ones = this.splitTarget % 10;
          this.splitLeft = this.splitTarget - ones;
          this.splitRight = ones;
        } else if (mode === "halves") {
          this.splitLeft = Math.floor(this.splitTarget / 2);
          this.splitRight = this.splitTarget - this.splitLeft;
        }
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }

      // Tape Diagram
      const tapePreset = event.target.closest("[data-tape-preset]");
      if (tapePreset) {
        const parts = tapePreset.dataset.tapePreset.split(":").map(Number);
        this.tapeA = parts[0];
        this.tapeB = parts[1];
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
      const tapeUnit = event.target.closest("[data-tape-unit]");
      if (tapeUnit) {
        this.tapeUnit = Number(tapeUnit.dataset.tapeUnit);
        this.render(document.querySelector("#drill-tool-viewport"));
        return;
      }
    });

    container.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-split-slider]");
      if (slider) {
        this.splitLeft = Number(slider.value);
        this.splitRight = this.splitTarget - this.splitLeft;
        this.render(document.querySelector("#drill-tool-viewport"));
      }
    });
  }
};

const drillToolbox = document.querySelector("#drill-toolbox");
if (drillToolbox) {
  InteractiveDrillToolbox.wire(drillToolbox);
  InteractiveDrillToolbox.render(document.querySelector("#drill-tool-viewport"));
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

els.toggleSolver?.addEventListener("click", () => {
  if (!els.solverWorkspace || !state.item) return;
  const isHidden = els.solverWorkspace.hidden;
  if (isHidden) {
    InteractiveSolver.render(state.item, els.solverWorkspace);
    els.solverWorkspace.hidden = false;
    els.toggleSolver.setAttribute("aria-expanded", "true");
  } else {
    els.solverWorkspace.hidden = true;
    els.toggleSolver.setAttribute("aria-expanded", "false");
  }
});

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

document.querySelector("#open-print-center")?.addEventListener("click", () => {
  TeacherPrintCenter.open();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-open-print-center]")) {
    TeacherPrintCenter.open();
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

populateQuickSkillDropdown();
applySettings();
renderLibrary();
initVoiceControl();
initVocabSystem();
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

