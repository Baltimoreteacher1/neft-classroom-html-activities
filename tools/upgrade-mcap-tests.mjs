#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const MCAP_DIR = path.join(REPO_ROOT, "mcap-review");

// Injected CSS block
const CSS_INJECT = `
      /* Injected CBT Simulator Styles */
      .cbt-timer-overlay {
        position: fixed;
        top: 75px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid var(--primary);
        border-radius: 12px;
        padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: monospace;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary-dark);
        backdrop-filter: blur(4px);
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      .cbt-timer-overlay.hidden {
        transform: translateY(-20px);
        opacity: 0;
        pointer-events: none;
      }
      .cbt-timer-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 2px;
        display: flex;
        align-items: center;
        color: var(--primary-dark);
      }
      .cbt-timer-btn:hover {
        color: var(--primary-light);
      }
      .cbt-flag-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--muted);
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--border);
        transition: all 0.15s;
        margin-left: 8px;
      }
      .cbt-flag-btn:hover {
        background: #f1f5f9;
        color: #d97706;
        border-color: #f59e0b;
      }
      .cbt-flag-btn.flagged {
        background: #fef3c7;
        color: #d97706;
        border-color: #f59e0b;
        font-weight: 700;
      }
      .cbt-review-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.3rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .cbt-review-toggle:hover {
        transform: scale(1.05);
        background: var(--primary-dark);
      }
      .cbt-review-panel {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: white;
        border: 2px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        transform-origin: bottom right;
      }
      .cbt-review-panel.collapsed {
        transform: scale(0.8) translateY(20px);
        opacity: 0;
        pointer-events: none;
      }
      .cbt-review-header {
        background: #f8fafc;
        padding: 10px 14px;
        font-weight: 700;
        font-size: 0.9rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--text);
      }
      .cbt-review-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 6px;
        padding: 12px;
        overflow-y: auto;
        flex: 1;
      }
      .cbt-review-cell {
        aspect-ratio: 1;
        border: 1px solid var(--border);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        background: #f1f5f9;
        color: var(--muted);
        transition: all 0.15s;
      }
      .cbt-review-cell:hover {
        border-color: var(--primary);
        transform: translateY(-1px);
      }
      .cbt-review-cell.answered {
        background: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
      }
      .cbt-review-cell.flagged {
        background: #fef3c7;
        color: #d97706;
        border-color: #fde68a;
      }
      .cbt-review-cell.answered.flagged {
        background: #fef3c7;
        color: #d97706;
        border-color: #f59e0b;
        box-shadow: inset 0 0 0 1px #f59e0b;
      }
      .cbt-review-legend {
        padding: 8px 12px;
        font-size: 0.7rem;
        border-top: 1px solid var(--border);
        background: #f8fafc;
        display: flex;
        justify-content: space-around;
        color: var(--muted);
      }
      .cbt-legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .cbt-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
      }
      .cbt-legend-dot.unanswered { background: #f1f5f9; border: 1px solid var(--border); }
      .cbt-legend-dot.answered { background: #eff6ff; border: 1px solid #bfdbfe; }
      .cbt-legend-dot.flagged { background: #fef3c7; border: 1px solid #fde68a; }
`;

// Injected JS block
const JS_INJECT = `
      // CBT Simulator Extension
      let flaggedQuestions = {};
      let timerSeconds = 3600; // 60 mins
      let timerInterval = null;
      let timerPaused = false;
      
      const SIMULATOR_STORAGE_KEY = STORAGE_KEY + "_sim";

      function toggleFlag(id) {
        flaggedQuestions[id] = !flaggedQuestions[id];
        const btn = document.getElementById("flag-" + id);
        if (btn) {
          btn.classList.toggle("flagged", flaggedQuestions[id]);
          btn.textContent = flaggedQuestions[id] ? "⚑ Flagged" : "⚑";
        }
        saveSimulatorProgress();
        updateReviewPanel();
      }

      function saveSimulatorProgress() {
        try {
          localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify({
            flagged: flaggedQuestions,
            timeRemaining: timerSeconds
          }));
        } catch(e) {}
      }

      function loadSimulatorProgress() {
        try {
          const data = JSON.parse(localStorage.getItem(SIMULATOR_STORAGE_KEY) || "{}");
          flaggedQuestions = data.flagged || {};
          if (typeof data.timeRemaining === "number") {
            timerSeconds = data.timeRemaining;
          }
          // Apply flagged classes to buttons
          for (let id in flaggedQuestions) {
            if (flaggedQuestions[id]) {
              const btn = document.getElementById("flag-" + id);
              if (btn) {
                btn.classList.add("flagged");
                btn.textContent = "⚑ Flagged";
              }
            }
          }
        } catch(e) {}
      }

      function initSimulator() {
        // Create HTML elements for timer and review panel
        const timerHtml = \`
          <div class="cbt-timer-overlay" id="cbt-timer">
            <span id="cbt-timer-clock">60:00</span>
            <button type="button" class="cbt-timer-btn" id="cbt-timer-play" onclick="toggleTimerPause()" title="Pause/Play timer">⏸</button>
            <button type="button" class="cbt-timer-btn" onclick="toggleTimerVisibility()" title="Hide/Show timer">👁</button>
          </div>
        \`;
        
        let reviewCellsHtml = "";
        for (let i = 1; i <= QUESTIONS.length; i++) {
          reviewCellsHtml += \`<div class="cbt-review-cell" id="rev-cell-\${i}" onclick="jumpToQuestion(\${i})">\${i}</div>\`;
        }

        const reviewHtml = \`
          <button type="button" class="cbt-review-toggle no-print" onclick="toggleReviewPanel()" title="Review Panel" aria-label="Toggle review panel">📋</button>
          <div class="cbt-review-panel collapsed no-print" id="cbt-review">
            <div class="cbt-review-header">
              <span>Review Panel</span>
              <button type="button" class="cbt-timer-btn" onclick="toggleReviewPanel()">✕</button>
            </div>
            <div class="cbt-review-grid">
              \${reviewCellsHtml}
            </div>
            <div class="cbt-review-legend">
              <div class="cbt-legend-item"><span class="cbt-legend-dot unanswered"></span><span>Unanswered</span></div>
              <div class="cbt-legend-item"><span class="cbt-legend-dot answered"></span><span>Answered</span></div>
              <div class="cbt-legend-item"><span class="cbt-legend-dot flagged"></span><span>Flagged</span></div>
            </div>
          </div>
        \`;

        document.body.insertAdjacentHTML("beforeend", timerHtml + reviewHtml);

        loadSimulatorProgress();
        updateReviewPanel();
        startTimer();

        // Hook into original onAnswer
        const originalOnAnswer = window.onAnswer;
        window.onAnswer = function(id) {
          originalOnAnswer(id);
          updateReviewPanel();
          saveSimulatorProgress();
        };

        // Hook into original resetTest
        const originalResetTest = window.resetTest;
        window.resetTest = function() {
          originalResetTest();
          flaggedQuestions = {};
          timerSeconds = 3600;
          try { localStorage.removeItem(SIMULATOR_STORAGE_KEY); } catch(e) {}
          // reset UI
          QUESTIONS.forEach(q => {
            const btn = document.getElementById("flag-" + q.id);
            if (btn) {
              btn.classList.remove("flagged");
              btn.textContent = "⚑";
            }
          });
          updateReviewPanel();
          if (timerInterval) clearInterval(timerInterval);
          startTimer();
        };
      }

      function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          if (timerPaused || graded) return;
          if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Your test will be submitted automatically.");
            gradeTest();
            return;
          }
          timerSeconds--;
          updateTimerUI();
          if (timerSeconds % 10 === 0) {
            saveSimulatorProgress();
          }
        }, 1000);
        updateTimerUI();
      }

      function updateTimerUI() {
        const clock = document.getElementById("cbt-timer-clock");
        if (!clock) return;
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        clock.textContent = \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
        
        // Color coding timer for warning
        const timerBox = document.getElementById("cbt-timer");
        if (timerSeconds < 300) { // less than 5 minutes
          timerBox.style.borderColor = "var(--incorrect)";
          timerBox.style.color = "var(--incorrect)";
        } else {
          timerBox.style.borderColor = "var(--primary)";
          timerBox.style.color = "var(--primary-dark)";
        }
      }

      function toggleTimerPause() {
        timerPaused = !timerPaused;
        const btn = document.getElementById("cbt-timer-play");
        if (btn) {
          btn.textContent = timerPaused ? "▶" : "⏸";
          btn.title = timerPaused ? "Resume timer" : "Pause timer";
        }
      }

      function toggleTimerVisibility() {
        const clock = document.getElementById("cbt-timer-clock");
        if (clock) {
          clock.style.display = clock.style.display === "none" ? "inline" : "none";
        }
      }

      function toggleReviewPanel() {
        const panel = document.getElementById("cbt-review");
        if (panel) {
          panel.classList.toggle("collapsed");
        }
      }

      function jumpToQuestion(id) {
        const qcard = document.getElementById("qcard-" + id);
        if (qcard) {
          qcard.scrollIntoView({ behavior: "smooth", block: "center" });
          toggleReviewPanel();
        }
      }

      function updateReviewPanel() {
        for (let i = 1; i <= QUESTIONS.length; i++) {
          const q = QUESTIONS[i - 1];
          const cell = document.getElementById("rev-cell-" + i);
          if (!cell) continue;

          const isAnswered = getResponse(q) !== null;
          const isFlagged = flaggedQuestions[i];

          cell.className = "cbt-review-cell";
          if (isAnswered) cell.classList.add("answered");
          if (isFlagged) cell.classList.add("flagged");
        }
      }

      // Start the simulator on DOMContentLoaded or directly
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSimulator);
      } else {
        initSimulator();
      }
`;

function upgradeTest(testId) {
  const filePath = path.join(MCAP_DIR, `practice-test-${testId}`, "index.html");
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Skip if already upgraded
  if (content.includes("cbt-timer-overlay")) {
    console.log(`[MCAP Test ${testId}] Already upgraded.`);
    return;
  }

  // 1. Inject CSS
  const styleEndIndex = content.indexOf("</style>");
  if (styleEndIndex === -1) {
    console.error(`Could not find </style> in ${filePath}`);
    return;
  }
  content = content.slice(0, styleEndIndex) + CSS_INJECT + content.slice(styleEndIndex);

  // 2. Inject Flag Button inside buildQuiz() html template
  const domainTag = `h += '<span class="q-domain" title="' + esc(DOMAIN_NAMES[q.domain]) + '">' + q.domain + '</span>';`;
  const domainTagIndex = content.indexOf(domainTag);
  if (domainTagIndex === -1) {
    console.error(`Could not find q-domain tag injection line in ${filePath}`);
    return;
  }
  
  const injectButtonCode = `\n          h += '<button type="button" class="cbt-flag-btn no-print" id="flag-' + q.id + '" onclick="toggleFlag(' + q.id + ')" aria-label="Flag question ' + q.id + '">⚑</button>';`;
  const insertPos = domainTagIndex + domainTag.length;
  content = content.slice(0, insertPos) + injectButtonCode + content.slice(insertPos);

  // 3. Inject JS Extension
  const scriptEndIndex = content.lastIndexOf("</script>");
  if (scriptEndIndex === -1) {
    console.error(`Could not find </script> in ${filePath}`);
    return;
  }
  content = content.slice(0, scriptEndIndex) + JS_INJECT + content.slice(scriptEndIndex);

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[MCAP Test ${testId}] Successfully upgraded!`);
}

function main() {
  console.log("Upgrading all 6 MCAP Practice Tests...");
  for (let i = 1; i <= 6; i++) {
    upgradeTest(i);
  }
  console.log("All upgrades complete.");
}

main();
