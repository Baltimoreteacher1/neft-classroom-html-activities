import { LESSON_META, STAGES, CONVERSION_MATCHES, TAPE_PUZZLES, DECISION_QUESTIONS, BOSS_GAUNTLET } from './data.js';
import { GameEngine } from './engine.js';

class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  beep(freq, ms, type = 'sine', gain = 0.06) {
    if (!this.enabled) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + ms / 1000);
    osc.stop(this.ctx.currentTime + ms / 1000);
  }

  correct() {
    this.beep(620, 130, 'triangle');
    setTimeout(() => this.beep(860, 120, 'triangle'), 90);
  }

  wrong() {
    this.beep(220, 200, 'sawtooth', 0.04);
  }

  levelUp() {
    this.beep(440, 90, 'square');
    setTimeout(() => this.beep(660, 90, 'square'), 110);
    setTimeout(() => this.beep(990, 180, 'square'), 220);
  }
}

const engine = new GameEngine();
const audio = new AudioManager();

const el = {
  title: document.querySelector('#title'),
  subtitle: document.querySelector('#subtitle'),
  objective: document.querySelector('#objective'),
  vocab: document.querySelector('#vocab'),
  stageGrid: document.querySelector('#stage-grid'),
  panelTitle: document.querySelector('#panel-title'),
  panelBody: document.querySelector('#panel-body'),
  feedback: document.querySelector('#feedback'),
  xpBar: document.querySelector('#xp-fill'),
  xpLabel: document.querySelector('#xp-label'),
  levelLabel: document.querySelector('#level-label'),
  comboLabel: document.querySelector('#combo-label'),
  diffLabel: document.querySelector('#difficulty-label'),
  masteryUnit: document.querySelector('#mastery-unit'),
  masteryModel: document.querySelector('#mastery-model'),
  masteryFrac: document.querySelector('#mastery-frac'),
  badges: document.querySelector('#badges'),
  progressFill: document.querySelector('#progress-fill'),
  progressText: document.querySelector('#progress-text'),
  analytics: document.querySelector('#analytics-json'),
  exportBtn: document.querySelector('#export-analytics'),
  resetBtn: document.querySelector('#reset-progress'),
  replayBtn: document.querySelector('#replay-stage'),
  tutorialBtn: document.querySelector('#open-tutorial'),
  tutorialModal: document.querySelector('#tutorial-modal'),
  closeTutorial: document.querySelector('#close-tutorial'),
  audioBtn: document.querySelector('#audio-toggle')
};

const stageState = {
  active: null,
  replay: null,
  decisionTimer: null,
  decisionRemaining: 0,
  decisionAsked: 0,
  bossRound: 0,
  bossLives: 2,
  bossScore: 0,
  selectedToken: null,
  tapePuzzleIdx: 0,
  tapeGroupsMade: 0
};

function init() {
  el.title.textContent = LESSON_META.title;
  el.subtitle.textContent = LESSON_META.subtitle;
  el.objective.textContent = LESSON_META.objective;
  el.vocab.textContent = LESSON_META.vocabulary.join(' • ');

  bindControls();
  renderStageGrid();
  renderWelcomePanel();
  updateHud();
  openTutorial();
}

function bindControls() {
  el.exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(engine.getAnalyticsSnapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraction-division-analytics.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  el.resetBtn.addEventListener('click', () => {
    clearTimers();
    engine.resetProgress();
    stageState.active = null;
    stageState.replay = null;
    setFeedback('Progress reset. Tutorial reopened for a clean start.', 'neutral');
    renderStageGrid();
    renderWelcomePanel();
    updateHud();
    openTutorial();
  });

  el.replayBtn.addEventListener('click', () => {
    if (stageState.replay) stageState.replay();
  });

  el.tutorialBtn.addEventListener('click', openTutorial);
  el.closeTutorial.addEventListener('click', closeTutorial);

  el.audioBtn.addEventListener('click', () => {
    const enabled = audio.toggle();
    el.audioBtn.textContent = enabled ? 'Audio: On' : 'Audio: Off';
  });
}

function renderWelcomePanel() {
  el.panelTitle.textContent = 'Mission Control';
  el.panelBody.innerHTML = `
    <div class="card">
      <h3>Core Loop</h3>
      <p>Action -> Challenge -> Feedback -> Reward -> Progression -> Mastery.</p>
    </div>
    <div class="card">
      <h3>How to Win</h3>
      <p>Complete all stages, reach Level 4, and clear the Director Challenge boss gauntlet.</p>
    </div>
  `;
}

function renderStageGrid() {
  el.stageGrid.innerHTML = '';
  STAGES.forEach((stage) => {
    const unlocked = engine.state.unlockedStages.has(stage.id);
    const completed = engine.state.completedStages.has(stage.id);

    const card = document.createElement('button');
    card.className = `stage-card ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'complete' : ''}`;
    card.disabled = !unlocked;
    card.innerHTML = `
      <div class="stage-top">
        <span class="stage-name">${stage.name}</span>
        <span class="pill">${stage.mechanic}</span>
      </div>
      <p>${stage.objective}</p>
      <span class="status">${completed ? 'Completed' : unlocked ? 'Ready' : `Unlocks at Lv ${stage.unlockLevel}`}</span>
    `;

    card.addEventListener('click', () => startStage(stage.id));
    el.stageGrid.appendChild(card);
  });

}

function setFeedback(text, tone = 'neutral') {
  el.feedback.className = `feedback ${tone}`;
  el.feedback.textContent = text;
}

function particleBurst() {
  const burst = document.createElement('div');
  burst.className = 'burst';
  for (let i = 0; i < 14; i += 1) {
    const dot = document.createElement('span');
    dot.style.setProperty('--i', i.toString());
    burst.appendChild(dot);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
}

function applyAnswerResult({ correct, concept, baseXp = 35, successText, failText, hint }) {
  const prevLevel = engine.state.level;
  const earned = engine.awardXp(baseXp, concept, correct);

  engine.recordQuestionEvent({ stageId: stageState.active, concept, correct, xpEarned: earned });

  if (correct) {
    setFeedback(`${successText} +${earned} XP`, 'good');
    audio.correct();
    particleBurst();
  } else {
    setFeedback(failText, 'bad');
    audio.wrong();
    if (engine.shouldOfferHint() && hint) {
      const hintBox = document.createElement('div');
      hintBox.className = 'hint-box';
      hintBox.textContent = `Hint unlocked: ${hint}`;
      el.panelBody.appendChild(hintBox);
    }
  }

  if (engine.state.level > prevLevel) {
    audio.levelUp();
    setFeedback(`Level up! You are now Level ${engine.state.level}.`, 'good');
  }

  updateHud();
  renderStageGrid();
}

function completeStage(stageId, bonusXp = 80) {
  engine.recordStageEvent(stageId, 'completed');
  const earned = engine.awardXp(bonusXp, 'model_reasoning', true);
  setFeedback(`Stage clear! Bonus +${earned} XP.`, 'good');
  particleBurst();
  updateHud();
  renderStageGrid();
}

function startStage(id) {
  clearTimers();
  stageState.active = id;
  engine.recordStageEvent(id, 'started');

  if (id === 'conversion-lab') {
    stageState.replay = () => startConversionLab();
    startConversionLab();
  } else if (id === 'tape-diagram') {
    stageState.replay = () => startTapeDiagram();
    startTapeDiagram();
  } else if (id === 'decision-dash') {
    stageState.replay = () => startDecisionDash();
    startDecisionDash();
  } else if (id === 'boss') {
    stageState.replay = () => startBoss();
    startBoss();
  }
}

function startConversionLab() {
  const shuffledFractions = [...CONVERSION_MATCHES].sort(() => Math.random() - 0.5);
  const shuffledMinutes = [...CONVERSION_MATCHES].sort(() => Math.random() - 0.5);

  const solved = new Set();
  stageState.selectedToken = null;

  el.panelTitle.textContent = 'Conversion Lab';
  el.progressText.textContent = 'Match all minute cards to hour fractions.';
  el.progressFill.style.width = '0%';

  el.panelBody.innerHTML = `
    <div class="card">
      <h3>Mechanic: Drag-and-Drop Matching</h3>
      <p>Drag a minute token onto its equivalent hour-fraction slot. Keyboard: select a token, then click a slot.</p>
    </div>
    <div class="match-wrap">
      <div class="tokens" id="tokens"></div>
      <div class="slots" id="slots"></div>
    </div>
  `;

  const tokenWrap = document.querySelector('#tokens');
  const slotWrap = document.querySelector('#slots');

  shuffledMinutes.forEach((item) => {
    const token = document.createElement('button');
    token.className = 'token';
    token.textContent = item.minutes;
    token.dataset.value = item.minutes;
    token.draggable = true;

    token.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', item.minutes);
      stageState.selectedToken = item.minutes;
    });

    token.addEventListener('click', () => {
      stageState.selectedToken = item.minutes;
      document.querySelectorAll('.token').forEach((t) => t.classList.remove('selected'));
      token.classList.add('selected');
    });

    tokenWrap.appendChild(token);
  });

  shuffledFractions.forEach((item) => {
    const slot = document.createElement('button');
    slot.className = 'slot';
    slot.dataset.accept = item.minutes;
    slot.innerHTML = `<span>${item.fraction}</span><small>Drop minute value</small>`;

    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const value = e.dataTransfer?.getData('text/plain') || stageState.selectedToken;
      handleMatch(slot, value, item);
    });

    slot.addEventListener('click', () => {
      handleMatch(slot, stageState.selectedToken, item);
    });

    slotWrap.appendChild(slot);
  });

  function handleMatch(slot, value, item) {
    if (!value || solved.has(item.fraction)) return;
    const correct = value === slot.dataset.accept;
    applyAnswerResult({
      correct,
      concept: 'unit_conversion',
      baseXp: 30,
      successText: `${value} matches ${item.fraction}.`,
      failText: `${value} does not match ${item.fraction}.`,
      hint: 'Think of 60 minutes as one whole hour and simplify.'
    });

    if (correct) {
      solved.add(item.fraction);
      slot.classList.add('correct');
      slot.querySelector('small').textContent = value;
      const matchedToken = [...document.querySelectorAll('.token')].find((t) => t.dataset.value === value);
      if (matchedToken) {
        matchedToken.disabled = true;
        matchedToken.classList.add('used');
      }

      const progress = Math.round((solved.size / CONVERSION_MATCHES.length) * 100);
      el.progressFill.style.width = `${progress}%`;
      el.progressText.textContent = `Conversion completion: ${progress}%`;

      if (solved.size === CONVERSION_MATCHES.length) {
        completeStage('conversion-lab', 100);
      }
    }
  }
}

function startTapeDiagram() {
  const adaptive = engine.state.adaptiveDifficulty;
  stageState.tapePuzzleIdx = adaptive <= 2 ? 0 : adaptive <= 4 ? 1 : 2;
  const puzzle = TAPE_PUZZLES[stageState.tapePuzzleIdx];
  stageState.tapeGroupsMade = 0;

  el.panelTitle.textContent = 'Tape Diagram Forge';
  el.progressText.textContent = 'Build valid groups to model the quotient.';

  el.panelBody.innerHTML = `
    <div class="card">
      <h3>Spatial Logic Challenge</h3>
      <p>${puzzle.prompt}</p>
      <p>Create groups of <strong>${puzzle.groupSize}</strong> equal part(s). Then submit each group.</p>
    </div>
    <div class="tape" id="tape"></div>
    <div class="row-controls">
      <button class="btn" id="submit-group">Submit Group</button>
      <button class="btn secondary" id="clear-select">Clear Selection</button>
      <span id="group-count">Groups made: 0 / ${puzzle.answer}</span>
    </div>
  `;

  const tape = document.querySelector('#tape');
  const selected = new Set();
  const grouped = new Set();

  for (let i = 0; i < puzzle.totalParts; i += 1) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.textContent = `${i + 1}`;
    cell.dataset.idx = i.toString();
    cell.addEventListener('click', () => {
      if (grouped.has(i)) return;
      if (selected.has(i)) {
        selected.delete(i);
        cell.classList.remove('selected');
      } else {
        selected.add(i);
        cell.classList.add('selected');
      }
    });
    tape.appendChild(cell);
  }

  document.querySelector('#clear-select').addEventListener('click', () => {
    selected.clear();
    document.querySelectorAll('.cell').forEach((c) => c.classList.remove('selected'));
  });

  document.querySelector('#submit-group').addEventListener('click', () => {
    const indexes = [...selected].sort((a, b) => a - b);
    const contiguous = indexes.every((idx, i) => i === 0 || idx === indexes[i - 1] + 1);

    const correct = indexes.length === puzzle.groupSize && contiguous;
    applyAnswerResult({
      correct,
      concept: puzzle.concept,
      baseXp: 35,
      successText: 'Valid group added.',
      failText: 'Invalid group. Use the required group size and adjacent parts.',
      hint: puzzle.hint
    });

    if (!correct) return;

    indexes.forEach((idx) => {
      grouped.add(idx);
      const cell = document.querySelector(`.cell[data-idx="${idx}"]`);
      if (cell) {
        cell.classList.remove('selected');
        cell.classList.add('grouped');
      }
    });
    selected.clear();
    stageState.tapeGroupsMade += 1;

    const count = document.querySelector('#group-count');
    count.textContent = `Groups made: ${stageState.tapeGroupsMade} / ${puzzle.answer}`;

    const progress = Math.round((stageState.tapeGroupsMade / puzzle.answer) * 100);
    el.progressFill.style.width = `${progress}%`;
    el.progressText.textContent = `Model completion: ${progress}%`;

    if (stageState.tapeGroupsMade >= puzzle.answer) {
      completeStage('tape-diagram', 120);
    }
  });
}

function pickDecisionQuestion() {
  const d = engine.state.adaptiveDifficulty;
  const pool = DECISION_QUESTIONS.filter((q) => Math.abs(q.difficulty - d) <= 1);
  return pool[Math.floor(Math.random() * pool.length)] || DECISION_QUESTIONS[0];
}

function startDecisionDash() {
  stageState.decisionAsked = 0;
  stageState.decisionRemaining = 55;

  el.panelTitle.textContent = 'Decision Dash';
  el.panelBody.innerHTML = `
    <div class="card">
      <h3>Timed Strategy</h3>
      <p>Answer quickly and accurately. Combo streaks amplify XP rewards.</p>
      <div class="timer" id="timer">55s</div>
    </div>
    <div id="decision-area"></div>
  `;

  const timerEl = document.querySelector('#timer');
  stageState.decisionTimer = setInterval(() => {
    stageState.decisionRemaining -= 1;
    timerEl.textContent = `${stageState.decisionRemaining}s`;
    const progress = Math.max(0, Math.round(((55 - stageState.decisionRemaining) / 55) * 100));
    el.progressFill.style.width = `${progress}%`;
    el.progressText.textContent = `Dash timer: ${stageState.decisionRemaining}s`;

    if (stageState.decisionRemaining <= 0) {
      clearInterval(stageState.decisionTimer);
      finishDecisionDash();
    }
  }, 1000);

  nextDecisionQuestion();
}

function nextDecisionQuestion() {
  const q = pickDecisionQuestion();
  if (!q) return;

  stageState.decisionAsked += 1;
  const area = document.querySelector('#decision-area');
  area.innerHTML = `
    <div class="question-card">
      <h4>Question ${stageState.decisionAsked}</h4>
      <p>${q.prompt}</p>
      <div class="choice-grid" id="choice-grid"></div>
      <button class="btn secondary" id="hint-btn">Show Hint</button>
      <p class="hint" id="hint-text" hidden></p>
    </div>
  `;

  const choiceGrid = document.querySelector('#choice-grid');
  q.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = choice;
    btn.addEventListener('click', () => {
      const correct = index === q.answerIndex;
      applyAnswerResult({
        correct,
        concept: q.concept,
        baseXp: 32,
        successText: 'Correct tactical choice.',
        failText: 'Incorrect choice.',
        hint: q.hint
      });

      if (stageState.decisionAsked >= 8) {
        finishDecisionDash();
      } else {
        nextDecisionQuestion();
      }
    });
    choiceGrid.appendChild(btn);
  });

  const hintBtn = document.querySelector('#hint-btn');
  const hintText = document.querySelector('#hint-text');
  hintBtn.addEventListener('click', () => {
    hintText.hidden = false;
    hintText.textContent = q.hint;
  });
}

function finishDecisionDash() {
  clearTimers();
  completeStage('decision-dash', 140);
  el.progressFill.style.width = '100%';
  el.progressText.textContent = 'Decision Dash complete.';
}

function startBoss() {
  stageState.bossRound = 0;
  stageState.bossLives = 2;
  stageState.bossScore = 0;

  el.panelTitle.textContent = 'Director Challenge: Boss Gauntlet';
  el.panelBody.innerHTML = `
    <div class="card">
      <h3>Final Mastery Mission</h3>
      <p>Clear 3 rounds. You have 2 mistakes available.</p>
      <p id="boss-status">Lives: ${stageState.bossLives} | Score: ${stageState.bossScore}</p>
    </div>
    <div id="boss-area"></div>
  `;
  el.progressFill.style.width = '0%';
  el.progressText.textContent = 'Boss round 1/3';

  loadBossRound();
}

function loadBossRound() {
  const round = BOSS_GAUNTLET[stageState.bossRound];
  if (!round) {
    finalizeBoss();
    return;
  }

  const status = document.querySelector('#boss-status');
  const area = document.querySelector('#boss-area');

  status.textContent = `Lives: ${stageState.bossLives} | Score: ${stageState.bossScore}`;
  el.progressText.textContent = `Boss round ${stageState.bossRound + 1}/3`;
  el.progressFill.style.width = `${Math.round((stageState.bossRound / BOSS_GAUNTLET.length) * 100)}%`;

  if (round.type === 'mcq') {
    area.innerHTML = `
      <div class="question-card">
        <h4>${round.prompt}</h4>
        <div class="choice-grid" id="boss-choice-grid"></div>
        <button class="btn secondary" id="boss-hint">Hint</button>
        <p class="hint" id="boss-hint-text" hidden></p>
      </div>
    `;

    const grid = document.querySelector('#boss-choice-grid');
    round.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.textContent = choice;
      btn.addEventListener('click', () => {
        evaluateBossAnswer(idx === round.answerIndex, round);
      });
      grid.appendChild(btn);
    });
  } else {
    area.innerHTML = `
      <div class="question-card">
        <h4>${round.prompt}</h4>
        <input id="boss-input" class="input" aria-label="Boss answer input" />
        <button class="btn" id="boss-submit">Submit</button>
        <button class="btn secondary" id="boss-hint">Hint</button>
        <p class="hint" id="boss-hint-text" hidden></p>
      </div>
    `;

    document.querySelector('#boss-submit').addEventListener('click', () => {
      const value = document.querySelector('#boss-input').value.trim();
      evaluateBossAnswer(value === round.answerValue, round);
    });
  }

  document.querySelector('#boss-hint').addEventListener('click', () => {
    const hintText = document.querySelector('#boss-hint-text');
    hintText.hidden = false;
    hintText.textContent = round.hint;
  });
}

function evaluateBossAnswer(correct, round) {
  applyAnswerResult({
    correct,
    concept: round.concept,
    baseXp: 50,
    successText: 'Boss round cleared.',
    failText: 'Boss round missed.',
    hint: round.hint
  });

  if (correct) {
    stageState.bossScore += 1;
  } else {
    stageState.bossLives -= 1;
  }

  if (stageState.bossLives < 0) {
    setFeedback('Boss failed. Replay to try again.', 'bad');
    return;
  }

  stageState.bossRound += 1;
  if (stageState.bossRound >= BOSS_GAUNTLET.length) {
    finalizeBoss();
  } else {
    loadBossRound();
  }
}

function finalizeBoss() {
  const success = stageState.bossScore >= 2;
  if (success) {
    completeStage('boss', 220);
    setFeedback('Director Challenge conquered. Mastery achieved.', 'good');
    el.progressFill.style.width = '100%';
    el.progressText.textContent = 'All stages complete.';
  } else {
    setFeedback('Boss gauntlet incomplete. You need at least 2 cleared rounds.', 'bad');
  }
  updateHud();
}

function updateHud() {
  const level = engine.state.level;
  const progress = engine.getLevelProgress();

  el.levelLabel.textContent = `Level ${level}`;
  el.xpLabel.textContent = `${engine.state.xp} XP`;
  el.xpBar.style.width = `${progress}%`;
  el.comboLabel.textContent = `Combo x${Math.max(1, engine.state.combo)}`;
  el.diffLabel.textContent = `Adaptive Difficulty: ${engine.state.adaptiveDifficulty}/5`;

  el.masteryUnit.style.width = `${engine.getMasteryPercent('unit_conversion')}%`;
  el.masteryModel.style.width = `${engine.getMasteryPercent('model_reasoning')}%`;
  el.masteryFrac.style.width = `${engine.getMasteryPercent('fraction_division')}%`;

  const badgeDetails = engine.getBadgeDetails();
  el.badges.innerHTML = badgeDetails.length
    ? badgeDetails.map((b) => `<span class="badge">${b.name}</span>`).join('')
    : '<span class="badge ghost">No badges yet</span>';

  el.analytics.textContent = JSON.stringify(engine.getAnalyticsSnapshot(), null, 2);
}

function clearTimers() {
  if (stageState.decisionTimer) {
    clearInterval(stageState.decisionTimer);
    stageState.decisionTimer = null;
  }
}

function openTutorial() {
  el.tutorialModal.showModal();
}

function closeTutorial() {
  el.tutorialModal.close();
}

init();
