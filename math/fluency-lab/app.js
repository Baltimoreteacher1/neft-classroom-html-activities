import {
  ALL_SKILLS,
  GRADES,
  generateProblem,
  getGrade,
  getSkill,
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
          <button type="button" class="outline-action quick-drill-btn" data-quick-skill="${skill.id}">⚡ Quick 5 Drill</button>
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
      <h3 class="tr-idea">${escapeHtml(skill.learn.rule)}</h3>
      <div class="tr-lesson">
        <div class="tr-example">
          <p class="tr-example-fact">${mathText(example.question)}</p>
          ${picture}
        </div>
        <div class="tr-guide">
          <p class="tr-guide-title">Watch me solve it</p>
          <div data-learn-steps>${stepsBlock(example.steps, 1, { id: "learn-steps" })}</div>
        </div>
      </div>
      <p class="learn-watch"><strong>Watch out:</strong> ${escapeHtml(skill.learn.watch)}</p>
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
  mountProblemModel(state.session.mode !== "diagnostic", adapting && (state.item.level ?? level) === 2);
  els.repair.hidden = !adapting;
  els.checkButton.hidden = false;
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.problemNumber.textContent = state.session.mode === "streak" ? `Problem ${state.session.answered + 1}` : `Problem ${state.session.answered + 1} of ${state.session.target}`;
  els.question.textContent = state.item.question;
  els.topic.textContent = `${skill.title} · Grade ${skill.grade}`;
  els.insight.textContent = state.session.mode === "diagnostic" ? "One sample per skill. Choose “I’m not sure yet” whenever you need to." : state.session.queue?.[state.session.answered]?.purpose || (state.initialSupport ? "A smaller step with coaching. We’ll build back toward independent work." : adapting && level === 2 ? "Your recent answers were strong. Try this one independently, then explain a check." : adapting ? "Work at your pace. Help is here when you need it." : "");
  els.guidedCoach.hidden = !state.initialSupport;
  if (state.initialSupport) state.guidedStepsShown = 1;
  renderGuidedCoach();
  renderAnswerControl();
  updateSessionHeader();
  const isFlashcard = state.session.mode === "flashcard";
  if (els.flashcardStage) els.flashcardStage.hidden = !isFlashcard;
  document.querySelector(".problem-meta")?.classList.toggle("is-flashcard-hidden", isFlashcard);
  els.question.hidden = isFlashcard;
  els.topic.hidden = isFlashcard;
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

function renderFlashcardProblem() {
  const item = state.item;
  if (!item) return;
  const card = els.tptCard || document.querySelector("#tpt-flashcard");
  card?.classList.remove("is-flipped", "is-correct");

  const skill = item.skill || state.skill;
  const grade = getGrade(skill?.grade || state.grade);
  const strand = skill?.strand || "Math";
  const icon = STRAND_ICONS[strand] || "✏️";

  const strandBadge = document.querySelector("#tpt-strand-badge");
  if (strandBadge) {
    strandBadge.innerHTML = `<span aria-hidden="true">${icon}</span> GRADE ${skill?.grade || state.grade} · ${escapeHtml(strand).toUpperCase()}`;
    strandBadge.style.borderColor = grade.color;
  }

  const cardCounter = document.querySelector("#tpt-card-counter");
  if (cardCounter) {
    cardCounter.textContent = `Card ${state.session.answered + 1} of ${state.session.target}`;
  }

  const frontEq = document.querySelector("#tpt-front-equation");
  if (frontEq) {
    let q = item.question.trim();
    if (q.endsWith("=")) q = `${q} ?`;
    else if (!q.includes("=") && !q.includes("?")) q = `${q} = ?`;
    frontEq.innerHTML = mathText(q);
  }

  const backEq = document.querySelector("#tpt-back-equation");
  if (backEq) {
    let q = item.question.trim();
    const ans = item.answers?.[0] || "";
    if (q.endsWith("=")) q = q.slice(0, -1).trim();
    backEq.innerHTML = `${mathText(q)} <span class="tpt-ans-equals">=</span> <strong class="tpt-ans-bold">${mathText(ans)}</strong>`;
  }

  const backStrategy = document.querySelector("#tpt-back-strategy");
  if (backStrategy) {
    const hint = item.hint || item.explanation || skill?.learn?.rule || "";
    const stepsList = item.steps?.length > 1 ? `<div class="tpt-mini-steps">${item.steps.map((s, idx) => `<div><span class="mini-step-num">${idx + 1}</span> <span>${mathText(s)}</span></div>`).join("")}</div>` : "";
    backStrategy.innerHTML = `<strong>💡 Strategy breakdown:</strong><p>${escapeHtml(hint)}</p>${stepsList}`;
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
    (els.tptKnowCard || document.querySelector("#tpt-know-card"))?.focus();
  } else {
    card.classList.remove("is-flipped");
    (els.tptFlipButton || document.querySelector("#tpt-flip-button"))?.focus();
  }
}

function handleFlashcardAnswer(correct) {
  if (!state.session || state.itemDone) return;
  finalizeProblem(correct);
  if (correct) {
    const card = els.tptCard || document.querySelector("#tpt-flashcard");
    card?.classList.add("is-correct");
    celebrateSparkles();
  }
  setTimeout(() => {
    nextProblem();
  }, 220);
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

  const frontHtml = cards
    .map(
      (c, i) => `
    <div class="pfc-card pfc-front">
      <div class="pfc-hole" aria-hidden="true"></div>
      <div class="pfc-tag">${grade.label.toUpperCase()} · ${escapeHtml(skill.strand).toUpperCase()}</div>
      <div class="pfc-math">${mathText(c.question)}</div>
      <div class="pfc-footer">Card ${i + 1} of 8 · ${escapeHtml(skill.title)}</div>
    </div>
  `,
    )
    .join("");

  const backHtml = cards
    .map(
      (c, i) => `
    <div class="pfc-card pfc-back">
      <div class="pfc-hole" aria-hidden="true"></div>
      <div class="pfc-tag">ANSWER &amp; STRATEGY</div>
      <div class="pfc-math pfc-ans">${mathText(c.question.replace(/\s*=.*$/, ""))} = <strong>${mathText(c.answers[0])}</strong></div>
      <div class="pfc-hint">${escapeHtml(c.hint || skill.learn.rule)}</div>
      <div class="pfc-footer">EduWonderLab Fluency Lab</div>
    </div>
  `,
    )
    .join("");

  printHtml(`
    <article class="pfc-print-sheet">
      <header class="pfc-header">
        <h1>${escapeHtml(skill.title)} · Flashcard Deck</h1>
        <p>${grade.label} Fluency Practice · Print double-sided (flip on short edge) or cut and fold along center line</p>
      </header>
      <div class="pfc-grid">
        ${frontHtml}
      </div>
      <div class="pfc-page-break"></div>
      <div class="pfc-grid">
        ${backHtml}
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

// Every practice problem carries its own model: the interactive picture of these numbers, or,
// when no picture fits, the workbench limited to the one tool that suits the problem.
function workbenchFits(item) {
  const wb = createWorkbenchState();
  wb.resetToItem(item);
  return wb.state.tool !== "model" || Boolean(renderInlineProblemModel(item.skill, item));
}

function mountProblemModel(show, collapsed = false) {
  const host = els.problemVisualScaffold;
  if (!host) return;
  host.hidden = !show;
  els.toggleProblemVisual.hidden = !show;
  if (!show) {
    host.innerHTML = "";
    return;
  }
  const picture = interactivePicture(state.item.model);
  els.drillPanel.style.setProperty("--trail", getGrade(state.item.skill.grade).color);
  if (picture) host.innerHTML = `<div class="tr-model">${picture}</div>`;
  else if (workbenchFits(state.item)) mountWorkbench(host, { skill: state.item.skill, item: state.item });
  else {
    // No model fits this kind of problem (rounding, money, time …): show nothing rather than an empty box.
    host.hidden = true;
    host.innerHTML = "";
    els.toggleProblemVisual.hidden = true;
    return;
  }
  host.hidden = collapsed;
  els.toggleProblemVisual.setAttribute("aria-expanded", String(!collapsed));
  els.toggleProblemVisual.textContent = collapsed ? "Show the model" : "Hide the model";
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
            ${open || `<p class="guided-step-text">${mathText(step.copy)}</p>`}
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
  if (state.item.choices) {
    els.answerInput.hidden = true;
    els.answerInput.removeAttribute("required");
    els.choiceAnswers.hidden = false;
    els.choiceAnswers.innerHTML = state.item.choices
      .map((choice) => `<button type="button" class="choice-answer" data-answer="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`)
      .join("");
    els.checkButton.hidden = true;
  } else {
    els.answerInput.hidden = false;
    els.answerInput.setAttribute("required", "");
    els.choiceAnswers.hidden = true;
    els.choiceAnswers.innerHTML = "";
    els.answerInput.inputMode = state.item.kind === "text" ? "text" : "decimal";
    els.answerInput.placeholder = state.item.kind === "fraction" ? "Example: 3/4" : "Type your answer";
  }
}

function submitAnswer(value) {
  if (!state.item || !state.session || state.itemDone || state.session.finished) return;
  if (!String(value).trim()) { showFeedback("Enter an answer", "Type an answer before checking, or open a strategy hint.", "try"); return; }
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
    showFeedback("Correct", state.item.explanation, "correct");
  } else {
    const lostStreak = session.mode === "streak" && session.streak > 0;
    session.streak = 0;
    session.missed.push({ skill: state.item.skill, item: state.item });
    showFeedback(lostStreak ? "New streak starts now" : "Keep this one", `${state.item.hint} ${state.item.explanation}`, "incorrect");
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
  if (type !== "correct" && state.item?.steps?.length > 1) {
    els.feedbackCopy.innerHTML = `
      <div class="feedback-coach-block">
        <p class="feedback-coach-main">${escapeHtml(copy)}</p>
        <div class="feedback-steps-accordion">
          <p class="feedback-steps-title"><strong>🪜 Think through it step-by-step:</strong></p>
          <ol class="feedback-mini-steps">
            ${state.item.steps.map((st, idx) => `<li><span class="mini-step-num">${idx + 1}</span> <span>${mathText(st)}</span></li>`).join("")}
          </ol>
        </div>
      </div>`;
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
  els.summaryNext.innerHTML = `<h4>A useful next step</h4><p>${escapeHtml(next.reason)}: ${escapeHtml(next.skill.title)}.</p><div class="button-row"><button class="primary-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="visual">Explore the visual lesson</button><button class="outline-action" data-view="path">See my learning path</button></div><div class="drill-again-actions button-row" style="margin-top:0.75rem"><button class="outline-action" type="button" data-start-quick-drill>⚡ Drill 5 more</button><button class="outline-action flashcard-btn" type="button" data-start-flashcard-drill>🃏 Flashcards</button><button class="outline-action" type="button" data-start-streak-drill>🔥 10 in a row challenge</button><button class="outline-action" type="button" data-print-flashcards>🖨️ Print Flashcards</button>${streakComplete(session) || accuracyPercent === 100 ? `<button class="outline-action" type="button" data-print-cert>🏆 Print Certificate</button>` : ''}</div>${session.mode === 'diagnostic' && foundations.length ? `<p>Helpful foundation: <button class="text-action" data-open-key="${tutorSkillKey(foundations[0])}" data-open-mode="visual">${escapeHtml(foundations[0].title)} (Grade ${foundations[0].grade})</button></p>` : ''}${state.skill ? `<p class="teach-back-prompt">${escapeHtml(transferPrompt(state.skill))}</p>` : ''}${profileBrief}`;
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
  els.notebook.innerHTML = `<div class="section-heading"><div><p class="section-label">Grade ${state.grade} · Mistake notebook</p><h2>A mistake is a place to learn.</h2><p>Review the idea, then solve two fresh problems independently in a row to mark that skill’s mistakes as repaired.</p></div>${open.length ? '<button class="primary-action" data-repair-all>Practice my tricky skills</button>' : ''}</div>
    ${entries.length ? `<div class="mistake-list">${entries.map((entry) => {
      const skill = findSkill(entry.key);
      return `<article class="mistake-entry ${entry.resolvedAt ? 'repaired' : ''}"><span class="mastery-pill">${entry.resolvedAt ? 'Repaired in fresh practice' : 'Ready to revisit'}</span><h3>${escapeHtml(skill.title)}</h3><p class="mistake-question">${escapeHtml(entry.question)}</p><p>Your first answer: <strong>${escapeHtml(entry.submitted)}</strong></p><details><summary>Review the strategy and solution</summary><p>${escapeHtml(entry.hint)}</p><p>${escapeHtml(entry.explanation)}</p><p>${escapeHtml(skill.learn.watch)}</p></details><div class="button-row"><button class="outline-action" data-open-key="${entry.key}" data-open-mode="visual">Build the idea</button><button class="primary-action" data-repair-key="${entry.key}">Try fresh problems</button></div></article>`;
    }).join("")}</div>` : `<div class="empty-state"><h3>Your notebook is ready.</h3><p>When an answer needs another look, its strategy and explanation will appear here. Start a practice set to begin.</p><button class="primary-action" data-view="library">Choose a skill</button></div>`}`;
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

const KineticDecomposer = {
  extractFactors(questionText) {
    const q = String(questionText || "");
    const mulMatch = q.match(/(\d+)\s*[×*x]\s*(\d+)/i);
    if (mulMatch) {
      return {
        mode: "area",
        a: Math.min(12, Math.max(3, Number(mulMatch[1]))),
        b: Math.min(12, Math.max(2, Number(mulMatch[2]))),
      };
    }
    const intMatch = q.match(/(-?\d+)\s*[+−-]\s*(-?\d+)/);
    if (intMatch && (q.includes("-") || q.includes("−"))) {
      return {
        mode: "integer",
        a: Math.max(-9, Math.min(9, Number(intMatch[1]))),
        b: Math.max(-9, Math.min(9, Number(intMatch[2]))),
      };
    }
    return { mode: "partition", a: 7, b: 8 };
  },
  renderSvg(spec, splitPoint) {
    const a = spec.a || 7;
    const b = spec.b || 8;
    const k = Math.max(1, Math.min(a - 1, splitPoint || Math.min(5, a - 1)));
    const rem = a - k;
    const totalW = 360;
    const leftW = Math.round((k / a) * totalW);
    const rightW = totalW - leftW;
    if (spec.mode === "integer") {
      const posCount = Math.min(8, Math.max(2, Math.abs(a)));
      const negCount = Math.min(8, Math.max(1, Math.abs(b)));
      const pairs = Math.min(posCount, negCount);
      const chips = [];
      for (let i = 0; i < posCount; i += 1) {
        const paired = i < pairs;
        chips.push(
          `<circle cx="${50 + i * 36}" cy="46" r="13" fill="${paired ? "#e2e8f0" : "#0f766e"}" stroke="#0f172a" stroke-width="1.5"/><text x="${50 + i * 36}" y="50" text-anchor="middle" font-size="11" font-weight="800" fill="${paired ? "#475569" : "#ffffff"}">+1</text>`,
        );
      }
      for (let j = 0; j < negCount; j += 1) {
        const paired = j < pairs;
        chips.push(
          `<circle cx="${50 + j * 36}" cy="92" r="13" fill="${paired ? "#e2e8f0" : "#b45309"}" stroke="#0f172a" stroke-width="1.5"/><text x="${50 + j * 36}" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="${paired ? "#475569" : "#ffffff"}">-1</text>`,
        );
      }
      return `<svg width="460" height="130" viewBox="0 0 460 130" style="background:#FFFFFF" role="img" aria-label="Integer zero-pair counter field"><rect x="4" y="4" width="452" height="122" rx="8" fill="#FFFFFF" stroke="#cbd5e1"/>${chips.join("")}<text x="345" y="72" font-size="12" font-weight="800" fill="#0f172a">${pairs} zero pairs neutral</text></svg>`;
    }
    return `<svg width="460" height="130" viewBox="0 0 460 130" style="background:#FFFFFF" role="img" aria-label="Kinetic decomposition area model splitting ${a} by ${b} into ${k} by ${b} plus ${rem} by ${b}"><rect x="40" y="24" width="${leftW}" height="68" rx="4" fill="#e6f4ea" stroke="#0f766e" stroke-width="2"/><rect x="${40 + leftW + 6}" y="24" width="${rightW}" height="68" rx="4" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/><line x1="${40 + leftW + 3}" y1="16" x2="${40 + leftW + 3}" y2="100" stroke="#b45309" stroke-width="3" stroke-dasharray="5,3"/><text x="${40 + Math.round(leftW / 2)}" y="62" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">(${k} × ${b})</text><text x="${40 + leftW + 6 + Math.round(rightW / 2)}" y="62" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">(${rem} × ${b})</text><text x="220" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">Decompose ${a} into ${k} + ${rem}: (${k} × ${b}) + (${rem} × ${b})</text></svg>`;
  },
  mount(item) {
    if (!els.drillPanel || !item) return;
    let host = document.querySelector("#kinetic-decomposer-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "kinetic-decomposer-host";
      host.className = "kinetic-decomposer-card";
      els.problemVisualScaffold?.insertAdjacentElement("afterend", host);
    }
    const spec = this.extractFactors(item.question);
    const maxSplit = Math.max(2, (spec.a || 7) - 1);
    const currentSplit = Math.min(maxSplit, Math.max(1, fluencyNextGenState.sliceSplit || 5));
    const options = [1, 2, Math.min(5, maxSplit), Math.max(1, Math.floor((spec.a || 7) / 2))].filter(
      (v, idx, arr) => v >= 1 && v <= maxSplit && arr.indexOf(v) === idx,
    );
    host.innerHTML = `
      <div class="kinetic-decomposer-head">
        <strong>Kinetic Decomposer · Strategic Split</strong>
        <div class="kinetic-slice-controls" role="group" aria-label="Decomposition split options">
          ${options
            .map(
              (opt) =>
                `<button type="button" class="kinetic-slice-btn" data-kinetic-split="${opt}" aria-pressed="${opt === currentSplit}">Split at ${opt}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div id="kinetic-svg-stage">${this.renderSvg(spec, currentSplit)}</div>
    `;
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
  KineticDecomposer.mount(state.item);
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
  const splitBtn = event.target.closest("[data-kinetic-split]");
  if (splitBtn && state.item) {
    fluencyNextGenState.sliceSplit = Number(splitBtn.dataset.kineticSplit) || 5;
    fluencyNextGenState.decomposedOnCurrent = true;
    chime("slice");
    KineticDecomposer.mount(state.item);
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

window.KineticDecomposer = KineticDecomposer;
window.FlowPacerEngine = FlowPacerEngine;
window.FluencyTelemetryHUD = FluencyTelemetryHUD;
window.SpacedZPDEngine = SpacedZPDEngine;

const InteractiveDrillToolbox = {
  activeTool: "numberline",
  tenFrameCount: 0,
  numberLinePos: 5,
  multRow: 6,
  multCol: 7,

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
  if (event.target.closest("[data-print-cert]")) {
    printMasteryCertificate();
    return;
  }
});

// Flashcard interactive controls & keybindings
els.tptFlipButton?.addEventListener("click", () => flipFlashcard(true));
els.tptFlipBack?.addEventListener("click", () => flipFlashcard(false));
els.tptKnowCard?.addEventListener("click", () => handleFlashcardAnswer(true));
els.tptRepeatCard?.addEventListener("click", () => handleFlashcardAnswer(false));

els.tptQuickForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = (els.tptQuickInput || document.querySelector("#tpt-quick-input"))?.value.trim();
  if (!val) {
    flipFlashcard(true);
    return;
  }
  const isCorrect = validateAnswer(val, state.item);
  flipFlashcard(true);
  if (isCorrect) {
    handleFlashcardAnswer(true);
  } else {
    (els.tptRepeatCard || document.querySelector("#tpt-repeat-card"))?.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (state.session?.mode === "flashcard" && !els.drillPanel.hidden && !state.itemDone) {
    const card = els.tptCard || document.querySelector("#tpt-flashcard");
    const isFlipped = card?.classList.contains("is-flipped");
    const tag = document.activeElement?.tagName || "";
    if (event.code === "Space" && tag !== "INPUT") {
      event.preventDefault();
      flipFlashcard();
    } else if (isFlipped) {
      if (event.key === "1") {
        event.preventDefault();
        handleFlashcardAnswer(false);
      } else if (event.key === "2" || event.key === "Enter") {
        if (tag !== "INPUT") {
          event.preventDefault();
          handleFlashcardAnswer(true);
        }
      }
    }
  }
});

populateQuickSkillDropdown();
applySettings();
renderLibrary();
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

