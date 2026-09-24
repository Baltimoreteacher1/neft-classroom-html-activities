import {
  ALL_SKILLS,
  GRADES,
  generateProblem,
  getGrade,
  getSkill,
  seededRandom,
  validateAnswer,
} from "./problem-bank.js";

const STORAGE_KEY = "ewl-fluency-progress-v1";
const SETTINGS_KEY = "ewl-fluency-settings-v1";

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
};

const state = {
  grade: Number(new URLSearchParams(location.search).get("grade")) || Number(localStorage.getItem(`${SETTINGS_KEY}:grade`)) || 1,
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
  progress: loadJson(STORAGE_KEY, {}),
  settings: loadJson(SETTINGS_KEY, { largeText: false }),
};

if (!GRADES.some((grade) => grade.grade === state.grade)) state.grade = 1;

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  localStorage.setItem(`${SETTINGS_KEY}:grade`, String(state.grade));
}

function skillKey(skill = state.skill) {
  return skill ? `${state.grade}:${skill.id}` : null;
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
    ...(state.progress[`${state.grade}:${skill.id}`] || {}),
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
  if (state.skill) params.set("skill", state.skill.id);
  history.replaceState(null, "", `${location.pathname}?${params}`);
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
  stopTimer();
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
  const fluent = gradeRecords.filter((record) => mastery(record).level === 3).length;
  const attempts = gradeRecords.reduce((sum, record) => sum + record.attempts, 0);
  const correct = gradeRecords.reduce((sum, record) => sum + record.correct, 0);
  els.gradeSummary.innerHTML = `
    <div><strong>${grade.skills.length}</strong><span>skills</span></div>
    <div><strong>${fluent}</strong><span>fluent</span></div>
    <div><strong>${attempts ? Math.round((correct / attempts) * 100) : 0}%</strong><span>accuracy</span></div>`;
  renderOverallStats();
  setUrl();
  document.title = `${grade.label} Math Fluency Lab | EduWonderLab`;
}

function renderSkillCard(skill) {
  const record = recordFor(skill);
  const level = mastery(record);
  return `
    <article class="skill-card" data-level="${level.level}">
      <div class="skill-card-top">
        <span class="strand-label">${escapeHtml(skill.strand)}</span>
        <span class="mastery-pill level-${level.level}">${level.label}</span>
      </div>
      <h3>${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.learn.rule)}</p>
      <div class="skill-stats" aria-label="Skill progress">
        <span><strong>${record.attempts ? accuracy(record) : "—"}${record.attempts ? "%" : ""}</strong> accuracy</span>
        <span><strong>${record.bestStreak}</strong> best streak</span>
        ${record.guidedProblems ? `<span><strong>${record.guidedProblems}</strong> guided</span>` : ""}
      </div>
      <button class="open-skill" data-skill="${skill.id}">Open skill</button>
    </article>`;
}

function renderOverallStats() {
  const records = ALL_SKILLS.map((skill) => state.progress[`${skill.grade}:${skill.id}`]).filter(Boolean);
  const attempts = records.reduce((sum, record) => sum + record.attempts, 0);
  const guidedProblems = records.reduce((sum, record) => sum + (record.guidedProblems || 0), 0);
  const correct = records.reduce((sum, record) => sum + record.correct, 0);
  const fluent = records.filter((record) => mastery(record).level === 3).length;
  els.overallStats.innerHTML = `
    <span><strong>${attempts + guidedProblems}</strong> problems practiced</span>
    <span><strong>${attempts ? Math.round((correct / attempts) * 100) : 0}%</strong> overall accuracy</span>
    <span><strong>${fluent}</strong> skills fluent</span>`;
}

function openSkill(skillId, mode = "learn") {
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
  const record = recordFor(state.skill);
  const level = mastery(record);
  els.masteryMeter.value = record.attempts ? accuracy(record) : Math.min(40, record.guidedProblems * 8);
  els.masteryLabel.textContent = record.attempts
    ? `${level.label} · ${accuracy(record)}%`
    : record.guidedProblems
      ? `${level.label} · ${record.guidedProblems} coached examples`
      : level.label;
}

function renderModeTabs(mixed = false) {
  els.modeTabs.innerHTML = mixed
    ? `<button role="tab" aria-selected="true" data-mode="${state.mode}">${state.mode === "daily" ? "Today's 10" : "Mixed review"}</button>`
    : [
        ["learn", "Learn it"],
        ["guided", "Guided practice"],
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
        <li><span>2</span>Try 5 with help</li>
        <li><span>3</span>Practice 10</li>
        <li><span>4</span>Sprint when ready</li>
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
      <button class="primary-action" data-start-guided>Try 5 with coaching</button>
      <button class="outline-action" data-start-independent>Skip to Practice 10</button>
    </div>`;
}

function setMode(mode) {
  state.mode = mode;
  stopTimer();
  els.modeTabs.querySelectorAll("[role=tab]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
  });
  const isLearn = mode === "learn";
  els.learnPanel.hidden = !isLearn;
  els.drillPanel.hidden = isLearn;
  if (isLearn) {
    state.session = null;
    state.item = null;
  } else {
    beginSession(mode, mode === "sprint" ? Infinity : mode === "guided" ? 5 : 10);
  }
}

function createSession(mode, target) {
  const dateSeed = Number(new Date().toISOString().slice(0, 10).replaceAll("-", "")) + state.grade * 997;
  return {
    mode,
    target,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    missed: [],
    problemSkills: [],
    rng: mode === "daily" ? seededRandom(dateSeed) : Math.random,
    startedAt: Date.now(),
  };
}

function beginSession(mode, target) {
  stopTimer();
  state.session = createSession(mode, target);
  state.item = null;
  state.itemAttempts = 0;
  state.timeLeft = 60;
  els.learnPanel.hidden = true;
  els.drillPanel.hidden = false;
  els.summary.hidden = true;
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
  nextProblem();
  if (mode === "sprint") startTimer();
}

function problemSkill() {
  if (state.skill) return state.skill;
  return state.mixedPool[Math.floor(state.session.rng() * state.mixedPool.length)];
}

function nextProblem() {
  if (!state.session) return;
  if (state.session.answered >= state.session.target) {
    finishSession();
    return;
  }
  const skill = problemSkill();
  state.session.problemSkills.push(skill);
  state.item = generateProblem(skill, state.session.rng);
  state.item.skill = skill;
  state.itemAttempts = 0;
  state.guidedStepsShown = state.session.mode === "guided" ? 1 : 0;
  els.feedback.hidden = true;
  els.nextButton.hidden = true;
  els.nextButton.textContent = "Next problem";
  els.hintButton.hidden = state.session.mode === "guided";
  els.checkButton.hidden = false;
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.problemNumber.textContent = state.session.mode === "sprint" ? `Problem ${state.session.answered + 1}` : `Problem ${state.session.answered + 1} of ${state.session.target}`;
  els.question.textContent = state.item.question;
  els.guidedCoach.hidden = state.session.mode !== "guided";
  renderGuidedCoach();
  renderAnswerControl();
  updateSessionHeader();
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
  if (state.session?.mode !== "guided" || !state.item) return;
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
  if (!state.item || !state.session || els.nextButton.hidden === false) return;
  state.itemAttempts += 1;
  const correct = validateAnswer(value, state.item);
  if (correct) {
    if (state.session.mode === "sprint") {
      finalizeProblem(true, true);
      window.setTimeout(() => {
        if (state.session?.mode === "sprint" && state.timeLeft > 0) nextProblem();
      }, 260);
    } else {
      finalizeProblem(true);
    }
    return;
  }
  if (state.session.mode === "sprint") {
    finalizeProblem(false, true);
    window.setTimeout(() => {
      if (state.session?.mode === "sprint" && state.timeLeft > 0) nextProblem();
    }, 350);
    return;
  }
  if (state.session.mode === "guided" && state.itemAttempts < 3) {
    const nextStep = revealGuidedStep() || guidedStepContent().at(-1);
    showFeedback("Let's use the next step", nextStep.copy, "try");
    if (!state.item.choices) els.answerInput.select();
    return;
  }
  if (state.itemAttempts === 1) {
    showFeedback("Try once more", state.item.hint, "try");
    els.answerInput.select();
    return;
  }
  finalizeProblem(false);
}

function finalizeProblem(correct, sprintAdvance = false) {
  const session = state.session;
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
  updateSkillRecord(state.item.skill, correct, session.mode);
  els.answerInput.disabled = true;
  els.choiceAnswers.querySelectorAll("button").forEach((button) => (button.disabled = true));
  els.checkButton.hidden = true;
  els.hintButton.hidden = true;
  els.nextButton.hidden = sprintAdvance;
  els.nextButton.textContent = session.answered >= session.target ? "Finish set" : "Next problem";
  updateSessionHeader();
}

function updateSkillRecord(skill, correct, mode) {
  const key = `${state.grade}:${skill.id}`;
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
  els.sessionAccuracy.textContent = `${session.answered ? Math.round((session.correct / session.answered) * 100) : 0}% ${session.mode === "guided" ? "solved" : "accurate"}`;
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
  if (!state.session) return;
  stopTimer();
  const session = state.session;
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
  announce(`${session.mode === "guided" ? "Guided learning" : "Practice"} saved on this device.`);
}

function retryMissed() {
  const missedSkills = [...new Set(state.session.missed.map((entry) => entry.skill))];
  if (!missedSkills.length) return;
  state.mixedPool = missedSkills;
  state.skill = missedSkills.length === 1 ? missedSkills[0] : null;
  state.mode = "mixed";
  beginSession("mixed", Math.max(5, missedSkills.length * 2));
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
  }));
  engine.registerStateRestorer((saved) => {
    if (!saved || saved.schema !== 1) return;
    if (saved.progress && typeof saved.progress === "object") state.progress = saved.progress;
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
});

els.modeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button || !state.skill) return;
  setMode(button.dataset.mode);
});

els.learnPanel.addEventListener("click", (event) => {
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
  showFeedback("Strategy hint", state.item.hint, "hint");
  els.hintButton.hidden = true;
});

els.nextButton.addEventListener("click", nextProblem);
els.guidedNextStep.addEventListener("click", () => {
  const step = revealGuidedStep();
  if (step) announce(`${step.label} step opened.`);
});
els.hearButton.addEventListener("click", speakProblem);
els.printButton.addEventListener("click", printPracticeSet);
els.printButtonSecondary.addEventListener("click", printPracticeSet);
els.backLibrary.addEventListener("click", renderLibrary);
els.dailyButton.addEventListener("click", () => openMixed({ daily: true }));
els.mixedButton.addEventListener("click", () => openMixed());
els.resetButton.addEventListener("click", () => {
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

window.addEventListener("popstate", renderLibrary);

applySettings();
renderLibrary();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", registerSharedSaveResume, { once: true });
} else {
  registerSharedSaveResume();
}
const initialParams = new URLSearchParams(location.search);
const initialSkill = initialParams.get("skill");
if (initialSkill) openSkill(initialSkill);
