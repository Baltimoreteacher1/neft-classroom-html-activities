import {
  ALL_SKILLS,
  GRADES,
  generateProblem,
  getGrade,
  getSkill,
  seededRandom,
  validateAnswer,
} from "./problem-bank.js";
import { adaptiveProblem, dailyPlan, diagnosticPlan, difficulty, emptyTutor, evidence, feedbackFor, findSkill, localDay, prerequisites, recommendations, recordAnswer, rememberMistake, sanitizeTutor, skillKey as tutorSkillKey } from "./tutor-engine.js";
import { mountVisualLesson } from "./visual-lab.js";
import { transferPrompt } from "./lesson-content.js";
import { PROFILE_NAMES, assignmentQueue, cleanProgress, decodeAssignment, downloadFile, makeBackup, mountTeacherStudio, parseBackup, profileKey, profiles, progressReport, readLocal, selectProfile, writeLocal } from "./school-tools.js";

const STORAGE_KEY = "ewl-fluency-progress-v1";
const SETTINGS_KEY = "ewl-fluency-settings-v1";
const TUTOR_KEY = "ewl-fluency-tutor-v2";
const SESSION_KEY = "ewl-fluency-session-v2";
const initialParams = new URLSearchParams(location.search);
let activeProfile = profiles().active;
let cleanupVisual = null;
let pendingRestore = null;

const els = {
  gradeTabs: document.querySelector("#grade-tabs"),
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
  timerWrap: document.querySelector("#timer-wrap"),
  timer: document.querySelector("#timer"),
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
  teacher: document.querySelector("#teacher-view"),
  insight: document.querySelector("#session-insight"),
  topic: document.querySelector("#problem-topic"),
  skip: document.querySelector("#skip-checkup"),
  repair: document.querySelector("#repair-actions"),
  summaryNext: document.querySelector("#summary-next"),
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
  timerId: null,
  timeLeft: 60,
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
    sprintBest: 0,
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

function mastery(record) {
  if (record.attempts < 5) {
    return record.guidedProblems >= 5 ? { label: "Guided", level: 1 } : { label: "New", level: 0 };
  }
  const score = accuracy(record);
  if (score >= 90 && record.correct >= 15) return { label: "Fluent", level: 3 };
  if (score >= 75) return { label: "Growing", level: 2 };
  return { label: "Practicing", level: 1 };
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
      <button class="grade-tab" role="tab" aria-selected="${grade.grade === state.grade}" data-grade="${grade.grade}" style="--grade:${grade.color}">
        <span>Grade</span><strong>${grade.grade}</strong>
      </button>`,
  ).join("");
}

function renderLibrary() {
  saveActiveSession();
  stopTimer();
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
  els.gradeHeading.textContent = grade.label;
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
  const record = recordFor(skill);
  const status = evidence(state.tutor, skill);
  const level = { label: status.label, level: status.secure ? 3 : status.independent >= 4 ? 2 : status.recent.length || status.lessonCompleted ? 1 : 0 };
  return `
    <article class="skill-card" data-level="${level.level}">
      <div class="skill-card-top">
        <span class="strand-label">${escapeHtml(skill.strand)}</span>
        <span class="mastery-pill level-${level.level}">${level.label}</span>
      </div>
      <h3>${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.learn.rule)}</p>
      <div class="skill-stats" aria-label="Skill progress">
        <span><strong>${status.independent ? `${status.successes}/${status.independent}` : "—"}</strong> recent independent</span>
        ${record.guidedProblems ? `<span><strong>${record.guidedProblems}</strong> guided</span>` : ""}
      </div>
      <button class="open-skill" data-skill="${skill.id}">Open skill</button>
      <button class="text-action" data-visual-skill="${skill.id}">See it &amp; build it</button>
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

function openSkill(skillId, mode = "learn") {
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
  els.workspaceStandard.textContent = `${state.skill.strand} · ${state.skill.standard}`;
  renderMastery();
  renderModeTabs();
  renderLearn();
  setMode(mode);
  setUrl();
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
  els.masteryLabel.textContent = status.label;
}

function renderModeTabs(mixed = false) {
  els.modeTabs.innerHTML = mixed
    ? `<button role="tab" aria-selected="true" data-mode="${state.mode}">${state.mode === "daily" ? "Today's 10" : "Mixed review"}</button>`
    : [
        ["learn", "Learn it"],
        ["visual", "See it & build it"],
        ["guided", "Guided practice"],
        ["adaptive", "Adaptive practice"],
        ["practice", "Practice 10"],
        ["sprint", "60-second sprint"],
      ]
        .map(
          ([mode, label]) =>
            `<button role="tab" aria-selected="${mode === state.mode}" data-mode="${mode}">${label}</button>`,
        )
        .join("");
}

function renderLearn() {
  const { learn } = state.skill;
  els.learnPanel.innerHTML = `
    <nav class="learning-path" aria-label="Learning path">
      <p class="section-label">Your learning path</p>
      <ol>
        <li class="current"><span>1</span>Learn the idea</li>
        <li><span>2</span>Build it visually</li>
        <li><span>3</span>Practice with help</li>
        <li><span>4</span>Remember it later</li>
      </ol>
    </nav>
    <div class="learn-rule">
      <span class="rule-mark" aria-hidden="true">✦</span>
      <div><p class="section-label">Mini lesson · The useful idea</p><h3>${escapeHtml(learn.rule)}</h3></div>
    </div>
    <ol class="learn-steps">
      ${learn.steps.map((step, index) => `<li><span>${index + 1}</span><p>${escapeHtml(step)}</p></li>`).join("")}
    </ol>
    <div class="worked-example">
      <p class="section-label">Worked example</p>
      <p>${escapeHtml(learn.example)}</p>
    </div>
    <div class="watch-out">
      <strong>Watch for this</strong>
      <p>${escapeHtml(learn.watch)}</p>
    </div>
    <div class="teach-back">
      <strong>Teach it back</strong>
      <p>Without looking at the steps, say the first move out loud. Then explain why that move fits this kind of problem.</p>
    </div>
    <div class="learn-actions">
      <button class="primary-action" data-start-visual>See it &amp; build it</button>
      <button class="primary-action" data-start-guided>Try 5 with coaching</button>
      <button class="outline-action" data-start-independent>Skip to Practice 10</button>
    </div>`;
}

function setMode(mode) {
  saveActiveSession();
  cleanupVisual?.();
  cleanupVisual = null;
  state.mode = mode;
  stopTimer();
  els.modeTabs.querySelectorAll("[role=tab]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
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
    beginSession(mode, mode === "sprint" ? Infinity : mode === "guided" ? 5 : 10);
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
  stopTimer();
  state.session = createSession(mode, target, queue);
  state.recentQuestions = [];
  state.item = null;
  state.itemAttempts = 0;
  state.timeLeft = 60;
  els.learnPanel.hidden = true;
  els.drillPanel.hidden = false;
  els.summary.hidden = true;
  els.visualPanel.hidden = true;
  document.querySelector(".problem-stage").hidden = false;
  els.answerForm.hidden = false;
  els.independentPractice.hidden = true;
  els.resetButton.textContent = mode === "guided" ? "Try another guided set" : "Start another set";
  els.timerWrap.hidden = mode !== "sprint";
  els.timer.textContent = "1:00";
  els.sessionType.textContent =
    mode === "sprint"
      ? "60-second sprint"
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
  if (mode === "sprint") startTimer();
}

function problemSkill() {
  if (state.session.queue) return findSkill(state.session.queue[state.session.answered].key);
  if (state.skill) return state.skill;
  return state.mixedPool[Math.floor(state.session.rng() * state.mixedPool.length)];
}

function nextProblem(restoredItem = null) {
  if (restoredItem && typeof restoredItem.question !== "string") restoredItem = null;
  if (!state.session || state.session.finished) return;
  if (state.session.answered >= state.session.target) {
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
  els.repair.hidden = !adapting;
  els.checkButton.hidden = false;
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.problemNumber.textContent = state.session.mode === "sprint" ? `Problem ${state.session.answered + 1}` : `Problem ${state.session.answered + 1} of ${state.session.target}`;
  els.question.textContent = state.item.question;
  els.topic.textContent = `${skill.title} · Grade ${skill.grade}`;
  els.insight.textContent = state.session.mode === "diagnostic" ? "One sample per skill. Choose “I’m not sure yet” whenever you need to." : state.session.queue?.[state.session.answered]?.purpose || (state.initialSupport ? "A smaller step with coaching. We’ll build back toward independent work." : adapting && level === 2 ? "Your recent answers were strong. Try this one independently, then explain a check." : adapting ? "Work at your pace. Help is here when you need it." : "");
  els.guidedCoach.hidden = !state.initialSupport;
  if (state.initialSupport) state.guidedStepsShown = 1;
  renderGuidedCoach();
  renderAnswerControl();
  updateSessionHeader();
  saveActiveSession();
  if (state.item.choices) els.choiceAnswers.querySelector("button")?.focus();
  else els.answerInput.focus();
}

function guidedStepContent() {
  if (!state.item?.skill) return [];
  return [
    { label: "Notice", copy: state.item.skill.learn.steps[0] },
    { label: "Plan", copy: state.item.hint },
    { label: "Solve and check", copy: state.item.skill.learn.steps[2] },
  ];
}

function renderGuidedCoach() {
  if (!state.initialSupport || !state.item) return;
  const steps = guidedStepContent();
  els.guidedSteps.innerHTML = steps
    .slice(0, state.guidedStepsShown)
    .map(
      (step, index) => `
        <li class="${index === state.guidedStepsShown - 1 ? "current" : "complete"}">
          <span>${index + 1}</span>
          <div><strong>${escapeHtml(step.label)}</strong><p>${escapeHtml(step.copy)}</p></div>
        </li>`,
    )
    .join("");
  els.guidedStepCount.textContent = `${state.guidedStepsShown} of ${steps.length} steps open`;
  els.guidedNextStep.hidden = state.guidedStepsShown >= steps.length;
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
    if (!correct) rememberMistake(state.tutor, state.item.skill, state.item, value);
  }
  if (state.session.mode === "diagnostic") { finalizeProblem(correct); return; }
  const sessionId = state.session.id;
  if (correct) {
    if (state.session.mode === "sprint") {
      finalizeProblem(true, true);
      window.setTimeout(() => {
        if (state.session?.id === sessionId && state.session?.mode === "sprint" && state.timeLeft > 0) nextProblem();
      }, 260);
    } else {
      finalizeProblem(true);
    }
    return;
  }
  if (state.session.mode === "sprint") {
    finalizeProblem(false, true);
    window.setTimeout(() => {
      if (state.session?.id === sessionId && state.session?.mode === "sprint" && state.timeLeft > 0) nextProblem();
    }, 350);
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

function finalizeProblem(correct, sprintAdvance = false) {
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
    session.streak = 0;
    session.missed.push({ skill: state.item.skill, item: state.item });
    showFeedback("Keep this one", `${state.item.hint} ${state.item.explanation}`, "incorrect");
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
  saveProgress();
  if (state.skill) renderMastery();
  renderOverallStats();
  els.answerInput.disabled = true;
  els.choiceAnswers.querySelectorAll("button").forEach((button) => (button.disabled = true));
  els.checkButton.hidden = true;
  els.hintButton.hidden = true;
  els.skip.hidden = true;
  els.nextButton.hidden = sprintAdvance;
  els.nextButton.textContent = session.answered >= session.target ? "Finish set" : "Next problem";
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
  els.feedbackCopy.textContent = copy;
}

function updateSessionHeader() {
  const session = state.session;
  els.sessionCount.textContent = `${session.answered} completed`;
  els.sessionAccuracy.textContent = session.mode === "diagnostic" ? "Finding a starting point" : `${session.correct} solved · ${session.independentCorrect} without help`;
  const progress = Number.isFinite(session.target) ? (session.answered / session.target) * 100 : Math.min(100, session.answered * 5);
  els.progressBar.style.width = `${Math.min(100, progress)}%`;
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    els.timer.textContent = `0:${String(Math.max(0, state.timeLeft)).padStart(2, "0")}`;
    if (state.timeLeft <= 0) finishSession();
  }, 1000);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
}

function finishSession() {
  if (!state.session || state.session.finished) return;
  stopTimer();
  const session = state.session;
  session.finished = true;
  if (session.mode !== "sprint") writeLocal(profileKey(SESSION_KEY, activeProfile), null);
  document.querySelector(".problem-stage").hidden = true;
  els.answerForm.hidden = true;
  els.feedback.hidden = true;
  els.summary.hidden = false;
  const accuracyPercent = session.answered ? Math.round((session.correct / session.answered) * 100) : 0;
  els.summaryTitle.textContent =
    session.mode === "sprint"
      ? "Sprint complete"
      : session.mode === "guided"
        ? "Guided practice complete"
        : "Practice complete";
  els.summaryCopy.textContent =
    session.mode === "guided"
      ? "You worked through five coached examples. Continue to Practice 10 when the steps feel familiar, or repeat this guided set."
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
    if (session.mode === "sprint") record.sprintBest = Math.max(record.sprintBest, session.correct);
    state.progress[key] = record;
    saveProgress();
    renderMastery();
  }
  if (session.mode === "diagnostic") {
    state.tutor.diagnostics[state.grade] = { at: Date.now(), results: session.diagnosticResults };
    els.summaryTitle.textContent = "Your starting-point checkup";
    els.summaryCopy.textContent = "These ten samples suggest what to try next. A single answer cannot prove mastery or determine a grade level.";
  }
  state.tutor.sessions.push({ at: Date.now(), grade: state.grade, mode: session.mode, answered: session.answered, correct: session.independentCorrect });
  state.tutor.sessions = state.tutor.sessions.slice(-60);
  els.summaryStats.innerHTML = `<div><strong>${session.correct}</strong><span>solved</span></div><div><strong>${session.answered}</strong><span>completed</span></div><div><strong>${session.independentCorrect}</strong><span>without help on first try</span></div>`;
  const next = recommendations(state.tutor, state.grade)[0];
  const foundations = prerequisites(next.skill);
  els.summaryNext.innerHTML = `<h4>A useful next step</h4><p>${escapeHtml(next.reason)}: ${escapeHtml(next.skill.title)}.</p><div class="button-row"><button class="primary-action" data-open-key="${tutorSkillKey(next.skill)}" data-open-mode="visual">Explore the visual lesson</button><button class="outline-action" data-view="path">See my learning path</button></div>${session.mode === 'diagnostic' && foundations.length ? `<p>Helpful foundation: <button class="text-action" data-open-key="${tutorSkillKey(foundations[0])}" data-open-mode="visual">${escapeHtml(foundations[0].title)} (Grade ${foundations[0].grade})</button></p>` : ''}${state.skill ? `<p class="teach-back-prompt">${escapeHtml(transferPrompt(state.skill))}</p>` : ''}`;
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
}

function showArea(view) {
  state.view = view;
  for (const [name, element] of [["library", els.library], ["workspace", els.workspace], ["path", els.path], ["notebook", els.notebook], ["teacher", els.teacher]]) element.hidden = name !== view;
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
  saveActiveSession(); stopTimer(); cleanupVisual?.(); cleanupVisual = null;
  showArea(view);
  if (view === "path") renderPath();
  if (view === "notebook") renderNotebook();
  if (view === "teacher") mountTeacherStudio(els.teacher, { grade: state.grade, onLaunch: launchAssignment, onPrint: printHtml, announce });
  document.title = `${view === 'teacher' ? 'Teacher studio' : view === 'path' ? 'My learning path' : 'Mistake notebook'} | Math Fluency Lab`;
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
  saveActiveSession(); stopTimer(); cleanupVisual?.(); cleanupVisual = null;
  state.skill = null; state.mixedPool = queue.map((entry) => findSkill(entry.key)); state.mode = mode;
  showArea("workspace");
  els.workspaceGrade.textContent = `Grade ${state.grade}`;
  els.workspaceTitle.textContent = mode === "daily" ? "Today's 10, chosen for you" : mode === "diagnostic" ? "Find my starting point" : mode === "assignment" ? state.assignment.label : "Turn a mistake into a strategy";
  document.title = `${els.workspaceTitle.textContent} | Math Fluency Lab`;
  els.workspaceStandard.textContent = mode === "diagnostic" ? "Ten samples to help you choose your next step" : "Fresh problems from your selected skills";
  els.masteryMeter.value = 0; els.masteryLabel.textContent = "Learning across skills";
  els.modeTabs.innerHTML = `<button role="tab" aria-selected="true">${mode === 'diagnostic' ? 'Checkup' : mode === 'daily' ? "Today's 10" : mode === 'assignment' ? 'Class practice' : 'Repair practice'}</button>`;
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
  renderAssignmentBanner(); openPlanned("assignment", assignmentQueue(assignment));
}

function renderAssignmentBanner() {
  const banner = document.querySelector("#assignment-banner"); banner.hidden = !state.assignment;
  if (!state.assignment) return;
  const assignment = state.assignment;
  banner.innerHTML = `<div><p class="section-label">Your class practice</p><h2>${escapeHtml(assignment.label)}</h2><p>Grade ${assignment.grade} · ${assignment.count} fresh questions · ${assignment.keys.map((key) => escapeHtml(findSkill(key).title)).join(', ')}</p></div><button class="primary-action" data-start-assignment>Start class practice</button>`;
}

function saveActiveSession() {
  if (!state.session || state.session.finished || !state.item || state.session.mode === "sprint") return;
  const { rng: _rng, problemSkills: _skills, ...session } = state.session;
  const snapshot = { version: 2, grade: state.grade, skillId: state.skill?.id || null, session, item: state.item, itemDone: state.itemDone,
    itemAttempts: state.itemAttempts, firstAnswerCorrect: state.firstAnswerCorrect, hintBeforeFirst: state.hintBeforeFirst, initialSupport: state.initialSupport,
    guidedStepsShown: state.guidedStepsShown, assignment: state.assignment, recentQuestions: state.recentQuestions,
    feedback: els.feedback.hidden ? null : { title: els.feedbackTitle.textContent, copy: els.feedbackCopy.textContent, type: els.feedback.dataset.type } };
  writeLocal(profileKey(SESSION_KEY, activeProfile), snapshot);
  saveProgress();
}

function resumePractice(saved = loadJson(SESSION_KEY, null)) {
  const allowed = ["practice", "guided", "adaptive", "daily", "mixed", "repair", "diagnostic", "assignment"];
  if (!saved || saved.version !== 2 || !allowed.includes(saved.session?.mode) || !findSkill(`${saved.grade}:${saved.item?.skill?.id}`) || (saved.session.queue && saved.session.queue.some((entry) => !findSkill(entry.key)))) { announce("There is no saved practice to resume."); return; }
  stopTimer(); cleanupVisual?.(); cleanupVisual = null;
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
  els.answerForm.hidden = false; document.querySelector(".problem-stage").hidden = false; els.timerWrap.hidden = true;
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
  saveActiveSession(); saveSettings(); stopTimer(); selectProfile(id); activeProfile = id;
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
  renderLibrary();
});

els.strandFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-strand]");
  if (!button) return;
  state.strand = button.dataset.strand;
  renderLibrary();
});

els.skillGrid.addEventListener("click", (event) => {
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
document.querySelector("#focus-mode").addEventListener("click", () => { state.settings.focus = !state.settings.focus; saveSettings(); applySettings(); });
document.querySelector("#download-progress").addEventListener("click", () => {
  saveActiveSession(); downloadFile(`fluency-${PROFILE_NAMES[activeProfile].toLowerCase()}-${localDay()}.json`, JSON.stringify(makeBackup(state), null, 2));
});
document.querySelector("#download-report").addEventListener("click", () => downloadFile(`fluency-grade-${state.grade}-${localDay()}.csv`, progressReport(state.tutor, state.grade), "text/csv"));
document.querySelector("#restore-progress").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  const preview = document.querySelector("#restore-preview"); preview.hidden = false;
  try {
    if (file.size > 2000000) throw new Error("This file is too large for a Fluency Lab backup. Choose the downloaded progress JSON file.");
    pendingRestore = parseBackup(JSON.parse(await file.text()));
    preview.innerHTML = `<p>Restore Grade ${pendingRestore.grade} progress with ${Object.keys(pendingRestore.tutor.records).length} practiced skills into <strong>${PROFILE_NAMES[activeProfile]}</strong>? A backup of this learner’s current progress will download first.</p><button class="primary-action" id="confirm-restore" type="button">Back up current progress and restore</button><button class="outline-action" id="cancel-restore" type="button">Cancel</button>`;
  } catch (error) { pendingRestore = null; preview.textContent = error.message || "The backup could not be read. Your progress has not changed."; }
  event.target.value = "";
});
document.querySelector("#restore-preview").addEventListener("click", (event) => {
  if (event.target.id === "cancel-restore") { pendingRestore = null; event.currentTarget.hidden = true; }
  if (event.target.id === "confirm-restore" && pendingRestore) {
    downloadFile(`fluency-before-restore-${localDay()}.json`, JSON.stringify(makeBackup(state), null, 2));
    stopTimer(); state.session = null; state.item = null;
    state.progress = pendingRestore.progress; state.tutor = pendingRestore.tutor; state.settings = pendingRestore.settings; state.grade = pendingRestore.grade;
    writeLocal(profileKey(SESSION_KEY, activeProfile), null); saveProgress(); saveSettings(); applySettings(); renderLibrary();
    pendingRestore = null; event.currentTarget.hidden = true; announce("Progress restored into the current learner profile.");
  }
});
window.addEventListener("fluency-storage-unavailable", () => { document.querySelector("#storage-warning").hidden = false; });
window.addEventListener("pagehide", saveActiveSession);
for (const tablist of [els.gradeTabs, els.modeTabs]) tablist.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')]; const index = tabs.indexOf(event.target);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].click(); tablist.querySelectorAll('[role="tab"]')[next]?.focus();
});
window.addEventListener("popstate", renderLibrary);

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
if (initialParams.get("view") === "teacher") openHubView("teacher");
