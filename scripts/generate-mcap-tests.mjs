// ── MCAP interactive practice-test generator ─────────────────────────────────
// Builds all 6 interactive, auto-graded MCAP Grade 6 math practice tests from
// the single source of truth in mcap-review/data/mcap-test-items.mjs.
//
// For each test it (re)writes:
//   • mcap-review/practice-test-<n>/index.html
//
// Each page bundles the auto-grading quiz engine, the CBT exam chrome (countdown
// timer, per-question flagging, jump-to review panel) and misconception-aware
// distractor feedback — all from one template, so the pages are regenerable and
// idempotent. This replaces the one-shot string mutator tools/upgrade-mcap-tests.mjs.
//
// Run:  node scripts/generate-mcap-tests.mjs   (npm run generate-mcap-tests)
//
// The generator preserves the save/resume injection markers (<!-- nsr-injected -->)
// only if they already exist in the prior file, re-emitting them in their correct
// place so tools/inject-save-resume.js stays a no-op on regeneration.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PRACTICE_TESTS, DOMAIN_NAMES } from "../mcap-review/data/mcap-test-items.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mcapDir = join(root, "mcap-review");

// ── page chrome ───────────────────────────────────────────────────────────────
const PAGE_STYLE = `      * { margin: 0; padding: 0; box-sizing: border-box; }
      :root {
        --primary: #0d9488;
        --primary-light: #14b8a6;
        --primary-dark: #0f766e;
        --bg: #fffbeb;
        --text: #1e293b;
        --card: #ffffff;
        --correct: #16a34a;
        --incorrect: #dc2626;
        --border: #e2e8f0;
        --muted: #64748b;
        --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      body {
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: var(--text);
        min-height: 100vh;
        line-height: 1.6;
      }
      .container { max-width: 760px; margin: 0 auto; padding: 20px; }
      .breadcrumb { font-size: 0.85rem; color: var(--muted); margin-bottom: 14px; }
      .breadcrumb a { color: var(--primary-dark); text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .breadcrumb span { margin: 0 6px; }
      .mcap-note {
        display: inline-block; text-align: center; font-size: 0.78rem; font-weight: 700;
        letter-spacing: 0.04em; color: var(--primary-dark); background: #f0fdfa;
        border: 1px solid #99f6e4; border-radius: 20px; padding: 5px 14px; margin-bottom: 14px;
      }
      h1 { color: var(--primary-dark); font-size: 1.9rem; text-align: center; margin-bottom: 4px; }
      .subtitle { text-align: center; color: var(--muted); font-size: 0.95rem; margin-bottom: 18px; }
      .intro-card, .question-card, .summary-card {
        background: var(--card); border: 1px solid var(--border); border-radius: 12px;
        padding: 20px; margin-bottom: 16px; box-shadow: var(--shadow);
      }
      .intro-card p { margin-bottom: 8px; font-size: 0.95rem; }
      .intro-card ul { margin: 8px 0 8px 22px; font-size: 0.9rem; color: var(--muted); }
      .progress-bar { background: #e2e8f0; border-radius: 20px; height: 12px; overflow: hidden; margin-bottom: 6px; }
      .progress-fill { background: var(--primary); height: 100%; width: 0%; transition: width 0.3s; }
      .progress-text { text-align: center; font-size: 0.82rem; color: var(--muted); margin-bottom: 16px; }
      .q-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
      .q-number {
        flex-shrink: 0; background: var(--primary); color: #fff; min-width: 30px; height: 30px;
        border-radius: 50%; text-align: center; line-height: 30px; font-size: 0.85rem; font-weight: 700; padding: 0 4px;
      }
      .q-domain {
        margin-left: auto; flex-shrink: 0; font-size: 0.72rem; font-weight: 700; color: var(--primary-dark);
        background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 2px 9px;
      }
      .q-text { font-weight: 600; font-size: 1.02rem; }
      .q-note { font-size: 0.85rem; color: var(--muted); font-style: italic; margin: 6px 0 4px; }
      .options { list-style: none; margin-top: 10px; }
      .option {
        display: block; border: 2px solid var(--border); border-radius: 10px; padding: 11px 14px;
        margin-bottom: 9px; cursor: pointer; transition: border-color 0.15s, background 0.15s; font-size: 0.95rem;
      }
      .option:hover { border-color: var(--primary-light); }
      .option input { margin-right: 10px; accent-color: var(--primary); }
      .option.sel { border-color: var(--primary); background: #f0fdfa; }
      .option.correct { border-color: var(--correct); background: #f0fdf4; }
      .option.incorrect { border-color: var(--incorrect); background: #fef2f2; }
      .fr-input {
        width: 100%; max-width: 280px; padding: 10px 12px; border: 2px solid var(--border);
        border-radius: 10px; font-size: 1rem; margin-top: 8px;
      }
      .fr-input:focus { outline: none; border-color: var(--primary); }
      .hint-toggle {
        background: none; border: none; color: var(--primary-dark); font-size: 0.85rem; font-weight: 600;
        cursor: pointer; padding: 4px 0; margin-top: 6px; text-decoration: underline;
      }
      .hint-box {
        background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;
        padding: 8px 12px; margin-top: 8px; font-size: 0.88rem;
      }
      .explain-box {
        border-radius: 8px; padding: 10px 14px; margin-top: 10px; font-size: 0.9rem;
        background: #f8fafc; border: 1px solid var(--border);
      }
      .explain-box .verdict { font-weight: 700; margin-bottom: 4px; }
      .explain-box .why-pick {
        margin-top: 6px; padding: 7px 10px; border-left: 4px solid var(--incorrect);
        background: #fef2f2; border-radius: 6px; font-size: 0.88rem;
      }
      .verdict.right { color: var(--correct); }
      .verdict.wrong { color: var(--incorrect); }
      .answered-correct { border-color: var(--correct); }
      .answered-incorrect { border-color: var(--incorrect); }
      .btn {
        display: inline-block; border: none; border-radius: 10px; padding: 12px 28px;
        font-size: 1rem; font-weight: 600; cursor: pointer; margin: 6px;
      }
      .btn-primary { background: var(--primary); color: #fff; }
      .btn-primary:hover { background: var(--primary-dark); }
      .btn-reset { background: #64748b; color: #fff; }
      .btn-reset:hover { background: #475569; }
      .btn-row { text-align: center; margin: 22px 0; }
      .summary-card { text-align: center; }
      .score-big { font-size: 3rem; font-weight: 800; color: var(--primary-dark); }
      .score-pct { font-size: 1.1rem; color: var(--muted); margin-bottom: 14px; }
      .domain-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.92rem; }
      .domain-table th, .domain-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; }
      .domain-table th { color: var(--primary-dark); }
      .domain-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
      .dbar { background: #e2e8f0; border-radius: 10px; height: 9px; overflow: hidden; margin-top: 4px; }
      .dbar > div { background: var(--primary); height: 100%; }
      .footer {
        text-align: center; padding: 20px; color: #94a3b8; font-size: 0.8rem; margin-top: 10px;
      }
      .stretch-note {
        font-size: 0.85rem; color: var(--muted); background: #f0fdfa; border: 1px dashed #99f6e4;
        border-radius: 8px; padding: 8px 12px; margin-top: 10px;
      }
      .tier-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
      .tier-bar .tier-label { font-size: 0.82rem; font-weight: 700; color: var(--muted); }
      .tier-btn {
        font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 5px 12px; border-radius: 20px;
        border: 1.5px solid var(--border); background: #fff; color: var(--text);
      }
      .tier-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }
      .hidden { display: none !important; }
      .focus-target:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
      @media (max-width: 600px) {
        .container { padding: 12px; }
        h1 { font-size: 1.45rem; }
        .intro-card, .question-card, .summary-card { padding: 15px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { transition-duration: 0.001ms !important; }
      }
      @media print {
        body { background: #fff; }
        .no-print { display: none !important; }
        .question-card, .intro-card, .summary-card { box-shadow: none; page-break-inside: avoid; }
        .hint-box, .explain-box { display: block !important; }
        .option { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }`;

// CBT exam chrome (timer / flag / review panel) styles.
const CBT_STYLE = `      /* CBT exam-simulator chrome */
      .cbt-timer-overlay {
        position: fixed; top: 75px; right: 20px; background: rgba(255, 255, 255, 0.95);
        border: 2px solid var(--primary); border-radius: 12px; padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; display: flex;
        align-items: center; gap: 8px; font-family: monospace; font-size: 1.1rem;
        font-weight: 700; color: var(--primary-dark); backdrop-filter: blur(4px);
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      .cbt-timer-overlay.hidden { transform: translateY(-20px); opacity: 0; pointer-events: none; }
      .cbt-timer-btn {
        background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 2px;
        display: flex; align-items: center; color: var(--primary-dark);
      }
      .cbt-timer-btn:hover { color: var(--primary-light); }
      .cbt-flag-btn {
        background: none; border: none; cursor: pointer; color: var(--muted); font-size: 0.9rem;
        display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;
        border: 1px solid var(--border); transition: all 0.15s; margin-left: 8px;
      }
      .cbt-flag-btn:hover { background: #f1f5f9; color: #d97706; border-color: #f59e0b; }
      .cbt-flag-btn.flagged { background: #fef3c7; color: #d97706; border-color: #f59e0b; font-weight: 700; }
      .cbt-review-toggle {
        position: fixed; bottom: 20px; right: 20px; z-index: 1000; background: var(--primary);
        color: white; border: none; border-radius: 50%; width: 50px; height: 50px; font-size: 1.3rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center;
        justify-content: center; transition: transform 0.2s;
      }
      .cbt-review-toggle:hover { transform: scale(1.05); background: var(--primary-dark); }
      .cbt-review-panel {
        position: fixed; bottom: 80px; right: 20px; width: 320px; max-height: 400px; background: white;
        border: 2px solid var(--border); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        z-index: 1000; display: flex; flex-direction: column; overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; transform-origin: bottom right;
      }
      .cbt-review-panel.collapsed { transform: scale(0.8) translateY(20px); opacity: 0; pointer-events: none; }
      .cbt-review-header {
        background: #f8fafc; padding: 10px 14px; font-weight: 700; font-size: 0.9rem;
        border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;
        align-items: center; color: var(--text);
      }
      .cbt-review-grid {
        display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; padding: 12px; overflow-y: auto; flex: 1;
      }
      .cbt-review-cell {
        aspect-ratio: 1; border: 1px solid var(--border); border-radius: 6px; display: flex;
        align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700;
        cursor: pointer; background: #f1f5f9; color: var(--muted); transition: all 0.15s;
      }
      .cbt-review-cell:hover { border-color: var(--primary); transform: translateY(-1px); }
      .cbt-review-cell.answered { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
      .cbt-review-cell.flagged { background: #fef3c7; color: #d97706; border-color: #fde68a; }
      .cbt-review-cell.answered.flagged {
        background: #fef3c7; color: #d97706; border-color: #f59e0b; box-shadow: inset 0 0 0 1px #f59e0b;
      }
      .cbt-review-legend {
        padding: 8px 12px; font-size: 0.7rem; border-top: 1px solid var(--border); background: #f8fafc;
        display: flex; justify-content: space-around; color: var(--muted);
      }
      .cbt-legend-item { display: flex; align-items: center; gap: 4px; }
      .cbt-legend-dot { width: 8px; height: 8px; border-radius: 2px; }
      .cbt-legend-dot.unanswered { background: #f1f5f9; border: 1px solid var(--border); }
      .cbt-legend-dot.answered { background: #eff6ff; border: 1px solid #bfdbfe; }
      .cbt-legend-dot.flagged { background: #fef3c7; border: 1px solid #fde68a; }`;

// ── quiz engine + CBT chrome JS (one cohesive block) ──────────────────────────
function quizScript(testNum, storageKey) {
  return `      const TEST_NUM = ${testNum};
      const STORAGE_KEY = ${JSON.stringify(storageKey)};
      const DOMAIN_NAMES = ${JSON.stringify(DOMAIN_NAMES)};
      const QUESTIONS = ${JSON.stringify(PRACTICE_TESTS[testNum - 1].questions)};
      let graded = false;
      // Active differentiation tier the teacher/student selected (0 = core, 1 = support, 2 = enrichment).
      let activeTier = (function () {
        try { return parseInt(localStorage.getItem(STORAGE_KEY + "_tier") || "0", 10) || 0; } catch (e) { return 0; }
      })();

      document.getElementById("yr").textContent = new Date().getFullYear();

      function esc(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }

      function buildQuiz() {
        const form = document.getElementById("quizForm");
        form.innerHTML = "";
        QUESTIONS.forEach(function (q) {
          const card = document.createElement("div");
          card.className = "question-card";
          card.id = "qcard-" + q.id;

          let h = '<div class="q-head">';
          h += '<span class="q-number">' + q.id + '</span>';
          h += '<span class="q-text">' + esc(q.text) + '</span>';
          h += '<span class="q-domain" title="' + esc(DOMAIN_NAMES[q.domain]) + '">' + q.domain + '</span>';
          h += '<button type="button" class="cbt-flag-btn no-print" id="flag-' + q.id + '" onclick="toggleFlag(' + q.id + ')" aria-label="Flag question ' + q.id + '">⚑</button>';
          h += '</div>';
          if (q.note) h += '<p class="q-note">' + esc(q.note) + '</p>';

          if (q.type === "mc") {
            h += '<ul class="options">';
            q.options.forEach(function (opt, i) {
              const oid = "q" + q.id + "_o" + i;
              h += '<li><label class="option" for="' + oid + '">';
              h += '<input type="radio" name="q' + q.id + '" id="' + oid + '" value="' + i + '" onchange="onAnswer(' + q.id + ')"> ';
              h += esc(opt) + '</label></li>';
            });
            h += '</ul>';
          } else {
            h += '<input type="text" class="fr-input" name="q' + q.id + '" id="q' + q.id + '_fr" ';
            h += 'placeholder="Type your answer" autocomplete="off" oninput="onAnswer(' + q.id + ')" aria-label="Answer for question ' + q.id + '">';
          }

          // Level 1 support: scaffold / sentence frame (falls back to the hint).
          const support = q.supportL1 || q.hint;
          if (support) {
            h += '<button type="button" class="hint-toggle no-print" onclick="toggleHint(' + q.id + ')" id="hintbtn-' + q.id + '">Show Level 1 hint</button>';
            h += '<div class="hint-box hidden" id="hint-' + q.id + '"><strong>Level 1:</strong> ' + esc(support) + '</div>';
          }
          // Level 2 enrichment: stretch extension.
          if (q.stretchL2 || q.stretch) {
            h += '<div class="stretch-note"><strong>Level 2 stretch:</strong> ' + esc(q.stretchL2 || q.stretch) + '</div>';
          }
          h += '<div class="explain-box hidden" id="explain-' + q.id + '"></div>';
          card.innerHTML = h;
          form.appendChild(card);
        });
        applyTier();
      }

      // Differentiation tiers. Tier 0 = core. Tier 1 (support) auto-reveals the
      // Level 1 hint. Tier 2 (enrichment) surfaces the Level 2 stretch note.
      function setTier(t) {
        activeTier = t;
        try { localStorage.setItem(STORAGE_KEY + "_tier", String(t)); } catch (e) {}
        document.querySelectorAll(".tier-btn").forEach(function (b) {
          b.classList.toggle("active", parseInt(b.dataset.tier, 10) === t);
        });
        applyTier();
      }

      function applyTier() {
        document.querySelectorAll(".tier-btn").forEach(function (b) {
          b.classList.toggle("active", parseInt(b.dataset.tier, 10) === activeTier);
        });
        QUESTIONS.forEach(function (q) {
          const hintBox = document.getElementById("hint-" + q.id);
          const hintBtn = document.getElementById("hintbtn-" + q.id);
          if (hintBox && hintBtn && !graded) {
            const reveal = activeTier === 1;
            hintBox.classList.toggle("hidden", !reveal);
            hintBtn.textContent = reveal ? "Hide Level 1 hint" : "Show Level 1 hint";
          }
          const stretch = document.querySelector("#qcard-" + q.id + " .stretch-note");
          if (stretch) stretch.style.display = activeTier === 2 ? "block" : "none";
        });
      }

      function toggleHint(id) {
        const box = document.getElementById("hint-" + id);
        const btn = document.getElementById("hintbtn-" + id);
        const hidden = box.classList.toggle("hidden");
        btn.textContent = hidden ? "Show Level 1 hint" : "Hide Level 1 hint";
      }

      function getResponse(q) {
        if (q.type === "mc") {
          const sel = document.querySelector('input[name="q' + q.id + '"]:checked');
          return sel ? parseInt(sel.value, 10) : null;
        } else {
          const el = document.getElementById("q" + q.id + "_fr");
          return el && el.value.trim() !== "" ? el.value.trim() : null;
        }
      }

      function onAnswer(id) {
        if (id) {
          const q = QUESTIONS.find(function(x){return x.id===id;});
          if (q && q.type === "mc") {
            const labels = document.querySelectorAll('#qcard-' + id + ' .option');
            labels.forEach(function(l){ l.classList.remove("sel"); });
            const sel = document.querySelector('input[name="q' + id + '"]:checked');
            if (sel) sel.closest(".option").classList.add("sel");
          }
        }
        saveProgress();
        updateProgress();
      }

      function updateProgress() {
        let answered = 0;
        QUESTIONS.forEach(function (q) { if (getResponse(q) !== null) answered++; });
        document.getElementById("progressFill").style.width = (answered / QUESTIONS.length * 100) + "%";
        document.getElementById("progressText").textContent = answered + " of " + QUESTIONS.length + " answered";
      }

      function saveProgress() {
        const data = {};
        QUESTIONS.forEach(function (q) {
          const r = getResponse(q);
          if (r !== null) data[q.id] = r;
        });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
      }

      function loadProgress() {
        let data;
        try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (e) { data = {}; }
        QUESTIONS.forEach(function (q) {
          if (!(q.id in data)) return;
          if (q.type === "mc") {
            const inp = document.querySelector('input[name="q' + q.id + '"][value="' + data[q.id] + '"]');
            if (inp) { inp.checked = true; inp.closest(".option").classList.add("sel"); }
          } else {
            const el = document.getElementById("q" + q.id + "_fr");
            if (el) el.value = data[q.id];
          }
        });
      }

      function normalizeFR(s) {
        return String(s).toLowerCase().replace(/\\s+/g, " ").replace(/[$,°]/g, "")
          .replace(/\\s*\\/\\s*/g, "/").trim();
      }

      function checkFR(q, resp) {
        const given = normalizeFR(resp);
        const list = (q.accept || [String(q.answer)]);
        for (let i = 0; i < list.length; i++) {
          if (normalizeFR(list[i]) === given) return true;
        }
        return false;
      }

      function gradeTest() {
        graded = true;
        let correct = 0;
        const byDomain = {};
        Object.keys(DOMAIN_NAMES).forEach(function (d) { byDomain[d] = { c: 0, t: 0 }; });

        QUESTIONS.forEach(function (q) {
          const card = document.getElementById("qcard-" + q.id);
          const resp = getResponse(q);
          let isCorrect = false;
          byDomain[q.domain].t++;

          if (q.type === "mc") {
            const labels = card.querySelectorAll(".option");
            labels.forEach(function (l, i) {
              l.classList.remove("sel");
              if (i === q.answer) l.classList.add("correct");
              if (resp !== null && i === resp && resp !== q.answer) l.classList.add("incorrect");
              l.querySelector("input").disabled = true;
            });
            isCorrect = resp !== null && resp === q.answer;
          } else {
            const el = document.getElementById("q" + q.id + "_fr");
            isCorrect = resp !== null && checkFR(q, resp);
            if (el) el.disabled = true;
          }

          if (isCorrect) { correct++; byDomain[q.domain].c++; }
          card.classList.add(isCorrect ? "answered-correct" : "answered-incorrect");

          const ex = document.getElementById("explain-" + q.id);
          let verdict;
          if (resp === null) verdict = '<span class="verdict wrong">Not answered</span>';
          else if (isCorrect) verdict = '<span class="verdict right">Correct</span>';
          else verdict = '<span class="verdict wrong">Incorrect</span>';
          let ans = q.type === "mc" ? esc(q.options[q.answer]) : esc(String(q.answer));
          // Misconception-targeted coaching: if the student picked a specific
          // wrong choice and the item supplies a rationale for it, show it.
          let pickNote = "";
          if (!isCorrect && q.type === "mc" && resp !== null &&
              Array.isArray(q.rationales) && q.rationales[resp]) {
            pickNote = '<div class="why-pick"><strong>Why you may have picked that:</strong> ' +
              esc(q.rationales[resp]) + '</div>';
          }
          ex.innerHTML = '<div class="verdict-line">' + verdict + '</div>' +
            '<div><strong>Answer:</strong> ' + ans + '</div>' +
            pickNote +
            '<div>' + esc(q.explain) + '</div>';
          ex.classList.remove("hidden");
        });

        showSummary(correct, byDomain);
        document.getElementById("submitBtn").disabled = true;
        document.getElementById("submitBtn").style.opacity = 0.5;
        document.getElementById("postRow").style.display = "block";
        const sum = document.getElementById("summary");
        sum.scrollIntoView({ behavior: "smooth", block: "start" });
        sum.focus();
      }

      function showSummary(correct, byDomain) {
        const total = QUESTIONS.length;
        const pct = Math.round((correct / total) * 100);
        let msg;
        if (pct >= 90) msg = "Outstanding work!";
        else if (pct >= 75) msg = "Great job &mdash; you're MCAP-ready!";
        else if (pct >= 60) msg = "Solid effort. Review the misses below.";
        else msg = "Keep practicing &mdash; the explanations will help.";

        let h = '<div class="score-big">' + correct + " / " + total + "</div>";
        h += '<div class="score-pct">' + pct + "% &bull; " + msg + "</div>";
        h += '<table class="domain-table"><thead><tr><th>Domain</th><th class="num">Score</th></tr></thead><tbody>';
        Object.keys(DOMAIN_NAMES).forEach(function (d) {
          const b = byDomain[d];
          if (b.t === 0) return;
          const dp = Math.round((b.c / b.t) * 100);
          h += '<tr><td>' + d + " &middot; " + esc(DOMAIN_NAMES[d]) +
            '<div class="dbar"><div style="width:' + dp + '%"></div></div></td>' +
            '<td class="num">' + b.c + "/" + b.t + " (" + dp + "%)</td></tr>";
        });
        h += "</tbody></table>";
        h += '<p style="margin-top:14px;font-size:0.88rem;color:var(--muted)">Scroll up to see the correct answer and a worked explanation under every question.</p>';
        const sum = document.getElementById("summary");
        sum.innerHTML = h;
        sum.classList.remove("hidden");
      }

      function resetTest() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        graded = false;
        buildQuiz();
        document.getElementById("summary").classList.add("hidden");
        document.getElementById("postRow").style.display = "none";
        const sb = document.getElementById("submitBtn");
        sb.disabled = false; sb.style.opacity = 1;
        updateProgress();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      buildQuiz();
      loadProgress();
      updateProgress();

      // ── CBT exam-simulator chrome: countdown timer, flagging, review panel ──
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

        const originalOnAnswer = window.onAnswer;
        window.onAnswer = function(id) {
          originalOnAnswer(id);
          updateReviewPanel();
          saveSimulatorProgress();
        };

        const originalResetTest = window.resetTest;
        window.resetTest = function() {
          originalResetTest();
          flaggedQuestions = {};
          timerSeconds = 3600;
          try { localStorage.removeItem(SIMULATOR_STORAGE_KEY); } catch(e) {}
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

        const timerBox = document.getElementById("cbt-timer");
        if (timerSeconds < 300) {
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

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSimulator);
      } else {
        initSimulator();
      }`;
}

// ── full page ─────────────────────────────────────────────────────────────────
function pageHtml(testNum, storageKey, { saveResume }) {
  const srHead = saveResume
    ? `    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
  <!-- nsr-injected:end -->
`
    : "";
  const srBody = saveResume
    ? `    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js" defer></script>
  <!-- nsr-injected:end -->
`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Interactive, auto-graded Maryland MCAP Grade 6 math practice test ${testNum} from Neft Teacher. 40 questions with instant scoring, domain breakdown, and explanations." />
    <title>MCAP Practice Test ${testNum} &middot; Grade 6 Math &middot; Neft Teacher</title>
    <style>
${PAGE_STYLE}

${CBT_STYLE}
</style>
${srHead}  </head>
  <body>
    <div class="container">
      <nav class="breadcrumb no-print" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/mcap-review/">MCAP &amp; General Review</a><span>/</span>Practice Test ${testNum}
      </nav>
      <div style="text-align: center">
        <span class="mcap-note">Maryland MCAP &middot; Grade 6 &middot; Full-length</span>
      </div>
      <h1>Practice Test ${testNum}</h1>
      <p class="subtitle">Grade 6 Mathematics &bull; 40 questions &bull; Calculator not permitted</p>

      <div class="intro-card no-print">
        <p><strong>How this works:</strong> Answer all 40 questions, then press <em>Submit &amp; Grade</em>. You'll get your score, a domain breakdown, and a worked explanation for every question.</p>
        <ul>
          <li>Your answers save automatically on this device. Use <em>Reset</em> to start fresh.</li>
          <li>Need a nudge? Each question has an optional <strong>Level 1 hint</strong>. Explanations stay hidden until you submit &mdash; no peeking!</li>
          <li>Domains are tagged (6.RP, 6.NS, 6.EE, 6.G, 6.SP) so you can see your strengths.</li>
        </ul>
        <div class="tier-bar" role="group" aria-label="Differentiation level">
          <span class="tier-label">Level:</span>
          <button type="button" class="tier-btn" data-tier="0" onclick="setTier(0)">Core</button>
          <button type="button" class="tier-btn" data-tier="1" onclick="setTier(1)">Level 1 (support — hints shown)</button>
          <button type="button" class="tier-btn" data-tier="2" onclick="setTier(2)">Level 2 (enrichment — stretch shown)</button>
        </div>
      </div>

      <div class="progress-bar no-print" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="40">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <p class="progress-text no-print" id="progressText">0 of 40 answered</p>

      <form id="quizForm" onsubmit="return false;"></form>

      <div class="btn-row no-print">
        <button type="button" class="btn btn-primary focus-target" id="submitBtn" onclick="gradeTest()">Submit &amp; Grade</button>
        <button type="button" class="btn btn-reset focus-target" onclick="resetTest()">Reset</button>
      </div>

      <div id="summary" class="summary-card hidden" tabindex="-1"></div>

      <div class="btn-row no-print" id="postRow" style="display:none">
        <button type="button" class="btn btn-reset focus-target" onclick="resetTest()">Reset &amp; Try Again</button>
        <button type="button" class="btn btn-primary focus-target" onclick="window.print()">Print</button>
        <a class="btn btn-reset focus-target" href="/mcap-review/">Back to MCAP Review</a>
      </div>

      <div class="footer">
        Neft Teacher &bull; Maryland MCAP &middot; Grade 6 Mathematics &bull; Practice Test ${testNum} &bull;
        <a href="/mcap-review/" style="color:#0f766e">All MCAP practice</a>
        &bull; &copy; <span id="yr"></span>
      </div>
    </div>

    <script>
${quizScript(testNum, storageKey)}
    </script>
${srBody}  </body>
</html>
`;
}

// ── run ───────────────────────────────────────────────────────────────────────
function main() {
  let written = 0;
  for (const test of PRACTICE_TESTS) {
    const dir = join(mcapDir, `practice-test-${test.num}`);
    const file = join(dir, "index.html");
    // Preserve save/resume wiring only if the prior page already had it.
    const prior = existsSync(file) ? readFileSync(file, "utf8") : "";
    const saveResume = prior.includes("nsr-injected:begin");
    writeFileSync(file, pageHtml(test.num, test.storageKey, { saveResume }));
    written++;
  }
  console.log(`✓ MCAP interactive practice tests generated: ${written} pages (240 items from the shared bank)`);
}

main();
