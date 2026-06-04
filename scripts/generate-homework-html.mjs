import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

// Match core/flagship lessons like "3-2" or "3-2-flagship"
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isPrintable(it) {
  if (!it || typeof it !== "object") return false;
  return [
    "multiple-choice",
    "fill-table",
    "matching-game",
    "drag-sort",
    "error-analysis",
    "open-response",
  ].includes(it.type);
}

function selectProblems(practice = {}) {
  const onLevel = Array.isArray(practice.onLevel) ? practice.onLevel : [];
  const optional = Array.isArray(practice.optional) ? practice.optional : [];
  const approaching = Array.isArray(practice.approaching) ? practice.approaching : [];
  const extending = Array.isArray(practice.extending) ? practice.extending : [];

  const picked = [];
  // A couple of approaching (warm-up) problems first.
  picked.push(...approaching.slice(0, 2));
  // Core on-level work.
  picked.push(...onLevel);
  // Then optional extras.
  picked.push(...optional);
  // Extending problems.
  picked.push(...extending);

  // Keep only printable problem types we know how to render.
  const printable = picked.filter((it) => isPrintable(it));
  // Cap at 10, but ensure we keep what we have if fewer.
  return printable.slice(0, 10);
}

// Map column labels (Shape A) to row-object keys.
function headerKeysFor(columns, sampleRow) {
  const rowKeys = Object.keys(sampleRow);
  const guesses = [];
  for (let i = 0; i < columns.length; i++) {
    if (i === 0 && rowKeys.includes("given")) guesses.push("given");
    else if (i === columns.length - 1 && rowKeys.includes("answer")) guesses.push("answer");
    else {
      const used = new Set(guesses);
      const candidate = rowKeys.find(
        (k) => !used.has(k) && k !== "given" && k !== "answer"
      );
      guesses.push(candidate || rowKeys[i] || "answer");
    }
  }
  return guesses;
}

function lessonConfigs() {
  const out = [];
  for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || !LESSON_DIR_RE.test(dir.name)) continue;
    const cfgPath = join(lessonsDir, dir.name, "config.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const config = JSON.parse(readFileSync(cfgPath, "utf8"));
      out.push({ id: dir.name, config });
    } catch (err) {
      console.error(`Skipping ${dir.name}: ${err.message}`);
    }
  }
  out.sort((a, b) => {
    const ma = a.id.match(LESSON_DIR_RE);
    const mb = b.id.match(LESSON_DIR_RE);
    return (
      Number(ma[1]) - Number(mb[1]) ||
      Number(ma[2]) - Number(mb[2]) ||
      (a.id.endsWith("-flagship") ? 1 : 0) - (b.id.endsWith("-flagship") ? 1 : 0)
    );
  });
  return out;
}

function renderVocabulary(vocabList) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return "";
  
  return `
    <section class="vocab-section card">
      <h2 class="section-title">🔑 Key Vocabulary</h2>
      <div class="vocab-container">
        ${vocabList.map((v, idx) => {
          const term = v.term || "";
          const termEs = v.termEs || "";
          const definition = v.definition || "";
          const definitionEs = v.definitionEs || "";
          const visual = v.visual || "";
          return `
            <div class="vocab-card" onclick="this.classList.toggle('flipped')">
              <div class="vocab-card-inner">
                <div class="vocab-card-front">
                  <h3>${esc(term)}</h3>
                  ${termEs ? `<p class="vocab-es">${esc(termEs)}</p>` : ""}
                  ${visual ? `<div class="vocab-visual-hint">💡 Example: ${esc(visual)}</div>` : ""}
                  <div class="flip-prompt">Tap to show definition ➔</div>
                </div>
                <div class="vocab-card-back">
                  <p class="vocab-def">${esc(definition)}</p>
                  ${definitionEs ? `<p class="vocab-def-es">${esc(definitionEs)}</p>` : ""}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderProblem(it, pIdx) {
  const type = it.type;
  
  let content = "";
  
  if (type === "multiple-choice") {
    const stem = it.stem || "";
    const choices = it.choices || [];
    const correctIdx = it.correctIndex !== undefined ? it.correctIndex : 0;
    const explanation = it.explanation || "";
    
    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(stem)}</p>
        <div class="mc-options" data-correct="${correctIdx}" data-explanation="${esc(explanation)}">
          ${choices.map((choice, cIdx) => `
            <label class="mc-option-label" id="label_q_${pIdx}_${cIdx}">
              <input type="radio" name="q_${pIdx}" value="${cIdx}" onchange="saveState(); updateProgress();">
              <span class="custom-radio"></span>
              <span class="choice-text">${esc(choice)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
  } else if (type === "matching-game") {
    const label = it.label || it.instructions || "Match each item to its correct partner.";
    const pairs = it.pairs || [];
    
    // Get unique sorted matches for dropdown options
    const allMatches = pairs.map(p => p.match);
    const sortedMatches = [...new Set(allMatches)].sort();
    
    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(label)}</p>
        <div class="matching-pairs">
          ${pairs.map((p, pairIdx) => `
            <div class="matching-row" data-term="${esc(p.term)}" data-correct="${esc(p.match)}">
              <div class="matching-term">${esc(p.term)}</div>
              <div class="matching-select-container">
                <select name="q_${pIdx}_pair_${pairIdx}" class="custom-select matching-select" onchange="saveState(); updateProgress();">
                  <option value="">-- Choose Match --</option>
                  ${sortedMatches.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}
                </select>
                <span class="feedback-badge"></span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else if (type === "drag-sort") {
    const label = it.instructions || it.label || "Sort the items into the correct groups.";
    const categories = it.categories || [];
    const items = it.items || [];
    
    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(label)}</p>
        <div class="drag-sort-workspace" id="dragsort_${pIdx}">
          
          <div class="drag-columns">
            ${categories.map(cat => `
              <div class="drag-column" data-category-id="${cat.id}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${pIdx}, '${cat.id}')">
                <div class="drag-column-header">${esc(cat.label)}</div>
                <div class="drag-column-slots" id="slots_${pIdx}_${cat.id}"></div>
              </div>
            `).join("")}
          </div>
          
          <div class="drag-source-section">
            <div class="drag-source-header">Items to Sort (Drag or use dropdown for mobile):</div>
            <div class="drag-source-pile" id="pile_${pIdx}" ondragover="allowDrop(event)" ondrop="handleDrop(event, ${pIdx}, '')">
              ${items.map((item, itemIdx) => `
                <div class="drag-card" 
                     draggable="true" 
                     id="card_${pIdx}_${itemIdx}" 
                     data-item-index="${itemIdx}" 
                     data-correct-category="${esc(item.category)}"
                     ondragstart="handleDragStart(event)">
                  <span class="drag-handle">☰</span>
                  <span class="card-text">${esc(item.text)}</span>
                  <select class="mobile-cat-select" onchange="mobileMoveCard(this, 'card_${pIdx}_${itemIdx}', ${pIdx}); saveState(); updateProgress();">
                    <option value="">-- Move to --</option>
                    ${categories.map(cat => `<option value="${cat.id}">${esc(cat.label)}</option>`).join("")}
                    <option value="">Unsorted Pile</option>
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
          
        </div>
        <div class="drag-controls">
          <button class="btn btn-sm btn-secondary" type="button" onclick="resetDragSort(${pIdx}); saveState(); updateProgress();">Reset Sorting</button>
        </div>
      </div>
    `;
  } else if (type === "fill-table") {
    const label = it.label || it.instructions || "Complete the table.";
    
    let headers = [];
    let rowsData = [];
    
    if (Array.isArray(it.headers) && Array.isArray(it.rows) && Array.isArray(it.rows[0])) {
      // Shape B: 2D array + editableCells
      headers = it.headers;
      const editableMap = new Map();
      if (Array.isArray(it.editableCells)) {
        for (const ec of it.editableCells) {
          editableMap.set(`${ec.row}-${ec.col}`, ec.answer);
        }
      }
      rowsData = it.rows.map((row, rIdx) => {
        return row.map((cell, cIdx) => {
          const key = `${rIdx}-${cIdx}`;
          if (editableMap.has(key)) {
            return { isEditable: true, correctValue: String(editableMap.get(key)), val: "" };
          }
          return { isEditable: false, val: String(cell ?? "") };
        });
      });
    } else if (Array.isArray(it.columns) && Array.isArray(it.rows)) {
      // Shape A: rows of objects
      headers = it.columns;
      const keys = headerKeysFor(it.columns, it.rows[0] || {});
      rowsData = it.rows.map((rowObj) => {
        return keys.map((key) => {
          if (key === "answer") {
            return { isEditable: true, correctValue: String(rowObj["answer"] ?? ""), val: "" };
          }
          return { isEditable: false, val: String(rowObj[key] ?? "") };
        });
      });
    }
    
    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(label)}</p>
        <div class="table-responsive">
          <table class="fill-table">
            <thead>
              <tr>
                ${headers.map(h => `<th>${esc(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsData.map((row, rIdx) => `
                <tr>
                  ${row.map((cell, cIdx) => {
                    if (cell.isEditable) {
                      return `
                        <td>
                          <div class="table-input-wrapper">
                            <input type="text" 
                                   class="custom-input table-input" 
                                   name="q_${pIdx}_table_${rIdx}_${cIdx}"
                                   data-correct="${esc(cell.correctValue)}" 
                                   placeholder="Type answer..." 
                                   oninput="saveState(); updateProgress();">
                            <span class="feedback-badge"></span>
                          </div>
                        </td>
                      `;
                    } else {
                      return `<td>${esc(cell.val)}</td>`;
                    }
                  }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (type === "error-analysis") {
    const title = it.title || "Analyze the worked steps";
    const workedExample = it.workedExample || [];
    const errorStep = it.errorStep !== undefined ? it.errorStep : 0;
    const correctWork = it.correctWork || "";
    
    content = `
      <div class="problem-body">
        <h3 class="error-analysis-title">⚠️ ${esc(title)}</h3>
        <p class="problem-stem">Review the steps below. Identify which step contains the error, and explain why.</p>
        
        <div class="clipboard-box">
          <div class="clipboard-top"></div>
          <div class="clipboard-paper">
            ${workedExample.map((step, sIdx) => `
              <div class="worked-step" id="step_q_${pIdx}_${sIdx + 1}">
                <span class="step-badge">Step ${sIdx + 1}</span>
                <span class="step-label">${esc(step.label)}:</span>
                <span class="step-work">${esc(step.work)}</span>
              </div>
            `).join("")}
          </div>
        </div>
        
        <div class="error-controls">
          <div class="error-select-row">
            <label for="error_step_select_${pIdx}">Which step has the error?</label>
            <select id="error_step_select_${pIdx}" class="custom-select error-step-select" data-correct="${errorStep + 1}" onchange="saveState(); updateProgress();">
              <option value="">-- Choose Step --</option>
              ${workedExample.map((_, sIdx) => `<option value="${sIdx + 1}">Step ${sIdx + 1}</option>`).join("")}
            </select>
            <span class="feedback-badge"></span>
          </div>
          
          <div class="error-explain-row">
            <label for="error_explain_input_${pIdx}">Explain the error and write the correct calculation:</label>
            <textarea id="error_explain_input_${pIdx}" class="custom-textarea error-explain-textarea" placeholder="Describe what went wrong and write the correct steps..." oninput="saveState(); updateProgress();"></textarea>
            <span class="feedback-badge"></span>
          </div>
          
          <div class="reveal-box" id="error_correct_work_${pIdx}" style="display:none;">
            <strong>Correct Work Reference:</strong> ${esc(correctWork)}
          </div>
        </div>
      </div>
    `;
  } else if (type === "open-response") {
    const prompt = it.prompt || "";
    const sentenceFrame = it.sentenceFrame || "";
    const keywords = it.keywords || [];
    const minLength = it.minLength || 15;
    
    content = `
      <div class="problem-body">
        <p class="problem-stem">${esc(prompt)}</p>
        
        ${sentenceFrame ? `
          <div class="sentence-frame-card">
            <span class="sentence-frame-tag">💡 Sentence Starter:</span>
            <span class="sentence-frame-text" onclick="insertSentenceStarter(${pIdx}, '${esc(sentenceFrame).replace(/'/g, "\\'")}')">"${esc(sentenceFrame)}"</span>
            <span class="click-to-insert-hint">(Click to insert starter)</span>
          </div>
        ` : ""}
        
        <div class="open-response-wrapper">
          <textarea id="open_response_${pIdx}" 
                    class="custom-textarea open-response-textarea" 
                    data-min-length="${minLength}" 
                    data-keywords="${esc(JSON.stringify(keywords))}"
                    placeholder="Write your mathematical explanation here..." 
                    oninput="saveState(); updateProgress();"></textarea>
          <span class="feedback-badge"></span>
        </div>
        
        ${keywords.length > 0 ? `
          <div class="word-bank-container">
            <div class="word-bank-label">Key Vocabulary to include (click to insert):</div>
            <div class="word-bank-chips">
              ${keywords.map(kw => `<span class="word-chip" onclick="insertWord(${pIdx}, '${esc(kw).replace(/'/g, "\\'")}')">${esc(kw)}</span>`).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }
  
  return `
    <section class="problem-section card" id="problem_${pIdx}" data-problem-type="${type}">
      <div class="problem-header-row">
        <div class="problem-number-badge">Problem ${pIdx + 1}</div>
        <div class="problem-type-badge">${esc(type.replace("-", " ").toUpperCase())}</div>
      </div>
      ${content}
    </section>
  `;
}

function generateHtml(lessonId, config) {
  const title = config.title || "Lesson Practice";
  const standard = config.standard || "";
  const unit = config.unit || 1;
  const contentObj = config.contentObjective || "";
  const languageObj = config.languageObjective || "";
  const vocab = config.vocabulary || [];
  
  const selected = selectProblems(config.practice || {});
  
  const vocabHtml = renderVocabulary(vocab);
  const problemsHtml = selected.map((p, idx) => renderProblem(p, idx)).join("\n");
  
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Interactive Homework — Lesson ${lessonId}: ${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Hanken+Grotesk:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #12355b;
  --navy-light: #18466f;
  --teal: #1fa6a2;
  --teal-light: #dff2ee;
  --amber: #f2c15b;
  --amber-light: #fef7e0;
  --cream: #f7f4ec;
  --coral: #d9795d;
  --coral-light: #fce6de;
  --white: #ffffff;
  --bg: var(--cream);
  --card: #ffffff;
  --ink: #21313f;
  --muted: #5f6f80;
  --line: #d7e2ed;
  
  --success: #0f7c4a;
  --success-bg: #e6f7ef;
  --error: #b64e2f;
  --error-bg: #fef0ec;
  --hint: #875f00;
  --hint-bg: #fef7e0;
  
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  
  --font-display: "Outfit", system-ui, sans-serif;
  --font-body: "Hanken Grotesk", Calibri, "Segoe UI", system-ui, sans-serif;
  
  --shadow: 0 8px 30px rgba(18, 53, 91, 0.05);
  --shadow-sm: 0 4px 12px rgba(18, 53, 91, 0.02);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.5;
  padding-bottom: 120px; /* Space for the sticky bottom bar */
}

a { color: var(--navy); text-decoration: none; font-weight: 700; }
a:hover { text-decoration: underline; }

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Header Styles */
header.homework-header {
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  padding: 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

header.homework-header::after {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(31, 166, 162, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--amber);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.back-link:hover {
  color: var(--white);
  text-decoration: none;
}

.header-meta {
  font-family: var(--font-display);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--teal-light);
  font-weight: 800;
  margin: 0 0 6px 0;
}

header.homework-header h1 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.objectives-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.objective-row {
  margin-bottom: 8px;
  font-size: 14.5px;
}
.objective-row:last-child { margin-bottom: 0; }
.objective-badge {
  background: var(--amber);
  color: var(--navy);
  font-weight: 800;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  margin-right: 6px;
  display: inline-block;
}

/* Cards & Generic Layout */
.card {
  background: var(--card);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.section-title {
  font-family: var(--font-display);
  color: var(--navy);
  font-size: 20px;
  margin: 0 0 16px 0;
}

/* Vocabulary Flashcards */
.vocab-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--teal) transparent;
}

.vocab-container::-webkit-scrollbar {
  height: 6px;
}
.vocab-container::-webkit-scrollbar-thumb {
  background: var(--teal);
  border-radius: 3px;
}

.vocab-card {
  flex: 0 0 240px;
  height: 160px;
  perspective: 1000px;
  cursor: pointer;
}

.vocab-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.vocab-card.flipped .vocab-card-inner {
  transform: rotateY(180deg);
}

.vocab-card-front, .vocab-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}

.vocab-card-front {
  background: var(--white);
  color: var(--navy);
}

.vocab-card-front h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
}

.vocab-es {
  color: var(--muted);
  font-style: italic;
  font-size: 13px;
  margin: 2px 0 0 0;
}

.vocab-visual-hint {
  font-size: 12px;
  background: var(--teal-light);
  padding: 6px;
  border-radius: var(--radius-sm);
  margin-top: 10px;
  text-align: left;
  border-left: 3px solid var(--teal);
}

.flip-prompt {
  font-size: 11px;
  font-weight: 700;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: auto;
}

.vocab-card-back {
  background: var(--navy);
  color: var(--white);
  transform: rotateY(180deg);
  justify-content: center;
  align-items: center;
}

.vocab-def {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
}

.vocab-def-es {
  font-size: 12px;
  color: var(--amber);
  margin: 6px 0 0 0;
  font-style: italic;
}

/* Practice Problem Cards */
.problem-section {
  position: relative;
}

.problem-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--teal-light);
  padding-bottom: 12px;
  margin-bottom: 18px;
}

.problem-number-badge {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--navy);
  font-size: 18px;
}

.problem-type-badge {
  font-family: var(--font-display);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--teal);
  background: var(--teal-light);
  padding: 4px 10px;
  border-radius: 99px;
}

.problem-stem {
  font-size: 16px;
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 18px 0;
  line-height: 1.45;
}

/* Custom styled inputs, checkboxes, and select dropdowns */
.custom-input {
  width: 100%;
  font-family: inherit;
  font-size: 14.5px;
  padding: 10px 14px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  transition: all 0.2s ease-in-out;
}

.custom-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-light);
}

.custom-textarea {
  width: 100%;
  height: 110px;
  font-family: inherit;
  font-size: 14.5px;
  padding: 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  resize: vertical;
  transition: all 0.2s ease-in-out;
}

.custom-textarea:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-light);
}

.custom-select {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--ink);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 150px;
}

.custom-select:focus {
  border-color: var(--teal);
}

/* Multiple Choice Custom Radios */
.mc-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mc-option-label {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  position: relative;
}

.mc-option-label:hover {
  background: var(--cream);
  border-color: var(--teal);
}

.mc-option-label input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--line);
  border-radius: 50%;
  display: inline-block;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}

.mc-option-label input[type="radio"]:checked ~ .custom-radio {
  border-color: var(--teal);
  background: var(--teal);
}

.mc-option-label input[type="radio"]:checked ~ .custom-radio::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--white);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.choice-text {
  flex: 1;
}

/* Matching Rows */
.matching-pairs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.matching-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  gap: 16px;
}

.matching-term {
  font-weight: 700;
  color: var(--navy);
  flex: 1;
}

.matching-select-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Drag Sort Layout */
.drag-sort-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drag-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.drag-column {
  background: var(--cream);
  border: 2px dashed var(--line);
  border-radius: var(--radius-md);
  padding: 14px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
}

.drag-column-header {
  font-family: var(--font-display);
  font-weight: 800;
  text-align: center;
  color: var(--navy);
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
}

.drag-column-slots {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
}

.drag-source-section {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px;
}

.drag-source-header {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--muted);
  margin-bottom: 12px;
}

.drag-source-pile {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  align-items: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: var(--cream);
}

.drag-card {
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  cursor: grab;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}

.drag-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.drag-handle {
  color: var(--muted);
  font-size: 12px;
}

.mobile-cat-select {
  display: none;
  font-family: inherit;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid var(--line);
  outline: none;
}

@media (max-width: 600px) {
  .mobile-cat-select {
    display: block;
    margin-left: 6px;
  }
}

/* Fill Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
}

.fill-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
}

.fill-table th, .fill-table td {
  padding: 12px 16px;
  border: 1px solid var(--line);
  text-align: left;
  font-size: 14.5px;
}

.fill-table th {
  background: var(--navy);
  color: var(--white);
  font-family: var(--font-display);
  font-weight: 600;
}

.fill-table tr:nth-child(even) td {
  background: var(--cream);
}

.table-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-input {
  max-width: 180px;
  padding: 6px 10px;
}

/* Error Analysis clipboard */
.clipboard-box {
  margin-top: 14px;
  margin-bottom: 18px;
  background: #f1f4f8;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--line);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.clipboard-top {
  height: 24px;
  background: var(--navy-light);
  position: relative;
}

.clipboard-top::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 12px;
  background: #e2e8f0;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border: 1px solid var(--line);
  border-bottom: 0;
}

.clipboard-paper {
  background: #fcfdfd;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-image: linear-gradient(#e5ecf4 1px, transparent 1px);
  background-size: 100% 28px;
  line-height: 28px;
}

.worked-step {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.worked-step.highlighted {
  background-color: var(--amber-light);
}

.step-badge {
  background: var(--navy);
  color: var(--white);
  font-size: 10.5px;
  font-family: var(--font-display);
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  line-height: 1;
}

.step-label {
  font-weight: 700;
  color: var(--navy);
}

.step-work {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.error-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--cream);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-top: 16px;
}

.error-select-row, .error-explain-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-select-row label, .error-explain-row label {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--navy);
}

/* Open Response Starter Sentence Cards */
.sentence-frame-card {
  background: var(--amber-light);
  border: 1px dashed var(--amber);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sentence-frame-tag {
  font-weight: 700;
  color: var(--hint);
}

.sentence-frame-text {
  font-style: italic;
  font-weight: 700;
  color: var(--navy);
  cursor: pointer;
  text-decoration: underline dotted var(--navy);
}

.sentence-frame-text:hover {
  color: var(--teal);
  text-decoration: underline dotted var(--teal);
}

.click-to-insert-hint {
  font-size: 11px;
  color: var(--muted);
}

.open-response-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.word-bank-container {
  margin-top: 12px;
}

.word-bank-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 6px;
}

.word-bank-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.word-chip {
  background: var(--teal-light);
  color: var(--teal);
  border: 1.5px solid var(--teal);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.word-chip:hover {
  background: var(--teal);
  color: var(--white);
}

/* Feedback Marks & Explanations */
.feedback-badge {
  font-size: 16px;
  font-weight: 800;
  margin-left: 6px;
  width: 20px;
  text-align: center;
  display: inline-block;
}

.feedback-badge.success-check::after {
  content: "✓";
  color: var(--success);
}

.feedback-badge.error-cross::after {
  content: "✕";
  color: var(--error);
}

.problem-section.correct {
  border-color: var(--success);
  background-image: linear-gradient(rgba(15, 124, 74, 0.02), rgba(15, 124, 74, 0.02));
}

.problem-section.incorrect {
  border-color: var(--error);
  background-image: linear-gradient(rgba(182, 78, 47, 0.02), rgba(182, 78, 47, 0.02));
}

.explanation-box {
  margin-top: 14px;
  background: var(--success-bg);
  border: 1px solid var(--success);
  color: var(--success);
  border-left: 4px solid var(--success);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
}

/* Inputs colored states */
.custom-input.is-correct, .custom-select.is-correct, .custom-textarea.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.custom-input.is-incorrect, .custom-select.is-incorrect, .custom-textarea.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

.mc-option-label.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.mc-option-label.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

.drag-card.is-correct {
  border-color: var(--success) !important;
  background-color: var(--success-bg) !important;
}

.drag-card.is-incorrect {
  border-color: var(--error) !important;
  background-color: var(--error-bg) !important;
}

/* Reveal box references */
.reveal-box {
  background: var(--success-bg);
  border: 1px dashed var(--success);
  color: var(--success);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  margin-top: 10px;
}

/* Sticky Bottom Bar */
.bottom-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1.5px solid var(--line);
  padding: 16px 24px;
  z-index: 1000;
  box-shadow: 0 -10px 30px rgba(18, 53, 91, 0.08);
}

.status-bar-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.sound-toggle-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sound-toggle-btn:hover {
  background-color: var(--teal-light);
}

.score-progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 150px;
}

.score-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  color: var(--navy);
  display: flex;
  justify-content: space-between;
}

.score-text span {
  font-weight: 600;
  color: var(--muted);
}

.progress-bar-outer {
  height: 10px;
  background: var(--cream);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.progress-bar-inner {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--teal), var(--navy));
  border-radius: 5px;
  transition: width 0.4s ease-in-out;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--teal);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--navy);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--white);
  color: var(--navy);
  border: 2px solid var(--line);
}

.btn-secondary:hover {
  background: var(--cream);
  border-color: var(--navy);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12.5px;
}

@media (max-width: 550px) {
  .bottom-status-bar {
    padding: 12px;
  }
  .status-bar-wrapper {
    gap: 10px;
  }
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  .action-buttons button {
    flex: 1;
    justify-content: center;
  }
}
</style>
</head>
<body>

<div class="container">
  
  <header class="homework-header">
    <a href="/curriculum/" class="back-link">⬅ Curriculum Hub</a>
    <div class="header-meta">Unit ${unit} · Standard ${esc(standard)} · Homework</div>
    <h1>${esc(title)}</h1>
    <div class="objectives-card">
      ${contentObj ? `<div class="objective-row"><span class="objective-badge">Target</span> <strong>${esc(contentObj)}</strong></div>` : ""}
      ${languageObj ? `<div class="objective-row"><span class="objective-badge">Discuss</span> <strong>${esc(languageObj)}</strong></div>` : ""}
    </div>
  </header>

  ${vocabHtml}
  
  <main class="problems-container">
    ${problemsHtml}
  </main>
  
</div>

<!-- Sticky bottom actions bar -->
<div class="bottom-status-bar">
  <div class="status-bar-wrapper">
    <button class="sound-toggle-btn" id="sound_toggle" onclick="toggleSound()" title="Toggle Sound Effects">🔊</button>
    
    <div class="score-progress-container">
      <div class="score-text">
        Homework Progress: <span id="progress_text">0 / ${selected.length} Completed</span>
      </div>
      <div class="progress-bar-outer">
        <div class="progress-bar-inner" id="progress_bar"></div>
      </div>
    </div>
    
    <div class="action-buttons">
      <button class="btn btn-secondary" onclick="resetWorksheet()">Reset</button>
      <button class="btn btn-primary" onclick="checkWorksheet()">Check Answers</button>
    </div>
  </div>
</div>

<script>
// Sound engine
let soundEnabled = true;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound_toggle");
  btn.textContent = soundEnabled ? "🔊" : "🔇";
  btn.title = soundEnabled ? "Mute Sound Effects" : "Unmute Sound Effects";
}

function playSuccessArpeggio() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major chord
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playFailureSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [180, 140]; // Two low warning blips
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + i * 0.12);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Drag & Drop engine
function allowDrop(ev) {
  ev.preventDefault();
}

function handleDragStart(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function handleDrop(ev, probIdx, categoryId) {
  ev.preventDefault();
  const cardId = ev.dataTransfer.getData("text");
  const card = document.getElementById(cardId);
  if (!card) return;
  
  // Check if dropping card belongs to this problem
  const prefix = "card_" + probIdx + "_";
  if (!card.id.startsWith(prefix)) return;
  
  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }
  
  if (targetContainer) {
    targetContainer.appendChild(card);
    const select = card.querySelector(".mobile-cat-select");
    if (select) select.value = categoryId || "";
    saveState();
    updateProgress();
  }
}

function mobileMoveCard(select, cardId, probIdx) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const categoryId = select.value;
  let targetContainer;
  if (categoryId) {
    targetContainer = document.getElementById("slots_" + probIdx + "_" + categoryId);
  } else {
    targetContainer = document.getElementById("pile_" + probIdx);
  }
  if (targetContainer) {
    targetContainer.appendChild(card);
  }
}

function resetDragSort(probIdx) {
  const pile = document.getElementById("pile_" + probIdx);
  const slots = document.querySelectorAll("[id^='slots_" + probIdx + "_']");
  slots.forEach(slot => {
    const cards = Array.from(slot.children);
    cards.forEach(card => {
      pile.appendChild(card);
      const select = card.querySelector(".mobile-cat-select");
      if (select) select.value = "";
    });
  });
  
  // Clean all validation classes on items of this problem
  const allCards = pile.querySelectorAll(".drag-card");
  allCards.forEach(card => {
    card.classList.remove("is-correct", "is-incorrect");
  });
  
  const pCard = document.getElementById("problem_" + probIdx);
  if (pCard) pCard.classList.remove("correct", "incorrect");
}

// Open Response Word chip inserters
function insertWord(probIdx, word) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const before = text.substring(0, start);
  const after = text.substring(end, text.length);
  
  // Insert word with trailing space
  textarea.value = before + (start > 0 && text[start - 1] !== " " ? " " : "") + word + " " + after;
  textarea.focus();
  
  // Move cursor after the inserted word
  const newPos = start + (start > 0 && text[start - 1] !== " " ? 1 : 0) + word.length + 1;
  textarea.setSelectionRange(newPos, newPos);
  
  saveState();
  updateProgress();
}

function insertSentenceStarter(probIdx, starter) {
  const textarea = document.getElementById("open_response_" + probIdx);
  if (!textarea) return;
  if (textarea.value.trim() === "") {
    textarea.value = starter + " ";
  } else {
    // Append at end if not empty
    textarea.value = textarea.value.trim() + " " + starter + " ";
  }
  textarea.focus();
  const len = textarea.value.length;
  textarea.setSelectionRange(len, len);
  saveState();
  updateProgress();
}

// State Persistence (localStorage)
const STORAGE_KEY = "hw_state_lesson_" + ${JSON.stringify(lessonId)};

function saveState() {
  const state = {
    inputs: {},
    dragPositions: {}
  };
  
  // Save text inputs, select dropdowns, textareas, and radios
  const inputs = document.querySelectorAll(".custom-input, .custom-select, .custom-textarea, input[type='radio']:checked");
  inputs.forEach(input => {
    if (input.type === "radio") {
      state.inputs[input.name] = input.value;
    } else {
      state.inputs[input.name || input.id] = input.value;
    }
  });
  
  // Save drag-sort item locations
  const dragCards = document.querySelectorAll(".drag-card");
  dragCards.forEach(card => {
    const parentContainer = card.parentElement;
    if (parentContainer) {
      state.dragPositions[card.id] = parentContainer.id;
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    
    // Restore text inputs, selects, textareas
    if (state.inputs) {
      for (const [id, val] of Object.entries(state.inputs)) {
        const input = document.getElementById(id) || document.querySelector("[name='" + id + "']");
        if (input) {
          if (input.type === "radio") {
            const rad = document.querySelector("input[name='" + id + "'][value='" + val + "']");
            if (rad) rad.checked = true;
          } else {
            input.value = val;
          }
        }
      }
    }
    
    // Restore drag card positions
    if (state.dragPositions) {
      for (const [cardId, parentId] of Object.entries(state.dragPositions)) {
        const card = document.getElementById(cardId);
        const parent = document.getElementById(parentId);
        if (card && parent) {
          parent.appendChild(card);
          // Sync select dropdown for mobile
          const select = card.querySelector(".mobile-cat-select");
          if (select) {
            // parentId is like slots_0_prime
            const parts = parentId.split("_");
            if (parts.length >= 3) {
              select.value = parts.slice(2).join("_");
            } else {
              select.value = "";
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Error restoring state:", e);
  }
}

// Math normalization for scoring text entries
function normalizeMath(val) {
  return String(val || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")          // remove all whitespace
    .replace(/\*/g, "×")          // asterisk to multiplication
    .replace(/x/g, "×")          // letter x to multiplication
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴")
    .replace(/\^5/g, "⁵")
    .replace(/\^6/g, "⁶");
}

function updateProgress() {
  const problems = document.querySelectorAll(".problem-section");
  let completedCount = 0;
  
  problems.forEach((section, idx) => {
    const type = section.dataset.problemType;
    let hasValue = false;
    
    if (type === "multiple-choice") {
      const selected = section.querySelector("input[type='radio']:checked");
      if (selected) hasValue = true;
    } else if (type === "matching-game") {
      const selects = Array.from(section.querySelectorAll(".matching-select"));
      const answered = selects.filter(s => s.value !== "");
      if (answered.length > 0) hasValue = true;
    } else if (type === "drag-sort") {
      const itemsInColumns = Array.from(section.querySelectorAll(".drag-column-slots .drag-card"));
      if (itemsInColumns.length > 0) hasValue = true;
    } else if (type === "fill-table") {
      const inputs = Array.from(section.querySelectorAll(".table-input"));
      const filled = inputs.filter(i => i.value.trim() !== "");
      if (filled.length > 0) hasValue = true;
    } else if (type === "error-analysis") {
      const sel = section.querySelector(".error-step-select");
      const txt = section.querySelector(".error-explain-textarea");
      if ((sel && sel.value !== "") || (txt && txt.value.trim() !== "")) hasValue = true;
    } else if (type === "open-response") {
      const txt = section.querySelector(".open-response-textarea");
      if (txt && txt.value.trim() !== "") hasValue = true;
    }
    
    if (hasValue) completedCount++;
  });
  
  const total = problems.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;
  document.getElementById("progress_bar").style.width = pct + "%";
  document.getElementById("progress_text").textContent = completedCount + " / " + total + " Completed";
}

function checkWorksheet() {
  const problems = document.querySelectorAll(".problem-section");
  let correctCount = 0;
  let hasIncorrect = false;
  
  problems.forEach((section, idx) => {
    const type = section.dataset.problemType;
    let isProblemCorrect = true;
    
    // Clear previous check classes
    section.classList.remove("correct", "incorrect");
    const explanationBoxes = section.querySelectorAll(".explanation-box");
    explanationBoxes.forEach(b => b.remove());
    
    if (type === "multiple-choice") {
      const container = section.querySelector(".mc-options");
      const selected = container.querySelector("input[type='radio']:checked");
      const correctIdx = container.dataset.correct;
      const explanation = container.dataset.explanation;
      
      // Reset radio option styles
      const labels = container.querySelectorAll(".mc-option-label");
      labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
      
      if (!selected) {
        isProblemCorrect = false;
      } else {
        const val = selected.value;
        if (val === correctIdx) {
          // Highlight selected label as correct
          const correctLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (correctLabel) correctLabel.classList.add("is-correct");
        } else {
          isProblemCorrect = false;
          // Highlight selected label as incorrect
          const incorrectLabel = document.getElementById("label_q_" + idx + "_" + val);
          if (incorrectLabel) incorrectLabel.classList.add("is-incorrect");
          // Highlight correct label as correct
          const correctLabel = document.getElementById("label_q_" + idx + "_" + correctIdx);
          if (correctLabel) correctLabel.classList.add("is-correct");
        }
      }
      
      // Append explanation if checked
      if (selected && explanation) {
        const expDiv = document.createElement("div");
        expDiv.className = "explanation-box";
        expDiv.innerHTML = "<strong>Concept Check:</strong> " + explanation;
        container.appendChild(expDiv);
      }
      
    } else if (type === "matching-game") {
      const rows = section.querySelectorAll(".matching-row");
      
      rows.forEach(row => {
        const select = row.querySelector(".matching-select");
        const correct = row.dataset.correct;
        const feedbackBadge = row.querySelector(".feedback-badge");
        
        select.classList.remove("is-correct", "is-incorrect");
        feedbackBadge.className = "feedback-badge";
        
        if (select.value === "") {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (select.value === correct) {
          select.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          select.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });
      
    } else if (type === "drag-sort") {
      const dragCards = section.querySelectorAll(".drag-card");
      
      dragCards.forEach(card => {
        card.classList.remove("is-correct", "is-incorrect");
        const correctCat = card.dataset.correctCategory;
        const parentCol = card.parentElement;
        
        if (parentCol && parentCol.parentElement && parentCol.parentElement.classList.contains("drag-column")) {
          const actualCat = parentCol.parentElement.dataset.categoryId;
          if (actualCat === correctCat) {
            card.classList.add("is-correct");
          } else {
            isProblemCorrect = false;
            card.classList.add("is-incorrect");
          }
        } else {
          // Card still in source pile
          isProblemCorrect = false;
          card.classList.add("is-incorrect");
        }
      });
      
    } else if (type === "fill-table") {
      const inputs = section.querySelectorAll(".table-input");
      
      inputs.forEach(input => {
        input.classList.remove("is-correct", "is-incorrect");
        const wrapper = input.parentElement;
        const feedbackBadge = wrapper.querySelector(".feedback-badge");
        feedbackBadge.className = "feedback-badge";
        
        const correctVal = input.dataset.correct;
        const studentVal = input.value;
        
        if (studentVal.trim() === "") {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        } else if (normalizeMath(studentVal) === normalizeMath(correctVal)) {
          input.classList.add("is-correct");
          feedbackBadge.classList.add("success-check");
        } else {
          isProblemCorrect = false;
          input.classList.add("is-incorrect");
          feedbackBadge.classList.add("error-cross");
        }
      });
      
    } else if (type === "error-analysis") {
      const select = section.querySelector(".error-step-select");
      const textarea = section.querySelector(".error-explain-textarea");
      const revealBox = section.querySelector(".reveal-box");
      
      // Clean select and textarea validation states
      select.classList.remove("is-correct", "is-incorrect");
      textarea.classList.remove("is-correct", "is-incorrect");
      
      const selectBadge = select.parentElement.querySelector(".feedback-badge");
      const textareaBadge = textarea.parentElement.querySelector(".feedback-badge");
      selectBadge.className = "feedback-badge";
      textareaBadge.className = "feedback-badge";
      
      const correctStep = select.dataset.correct;
      
      // Highlight worked steps inside paper clipboard based on selection
      const workedSteps = section.querySelectorAll(".worked-step");
      workedSteps.forEach(s => s.classList.remove("highlighted"));
      
      if (select.value !== "") {
        const stepElement = document.getElementById("step_q_" + idx + "_" + select.value);
        if (stepElement) stepElement.classList.add("highlighted");
      }
      
      // Check step selection
      if (select.value === correctStep) {
        select.classList.add("is-correct");
        selectBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        select.classList.add("is-incorrect");
        selectBadge.classList.add("error-cross");
      }
      
      // Check written explanation
      if (textarea.value.trim().length >= 15) {
        textarea.classList.add("is-correct");
        textareaBadge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        textareaBadge.classList.add("error-cross");
      }
      
      // Show correct work reference for reinforcement
      if (revealBox) {
        revealBox.style.display = "block";
      }
      
    } else if (type === "open-response") {
      const textarea = section.querySelector(".open-response-textarea");
      textarea.classList.remove("is-correct", "is-incorrect");
      const badge = textarea.parentElement.querySelector(".feedback-badge");
      badge.className = "feedback-badge";
      
      const minLen = parseInt(textarea.dataset.minLength) || 15;
      const text = textarea.value.trim();
      
      let keywordsList = [];
      try {
        keywordsList = JSON.parse(textarea.dataset.keywords || "[]");
      } catch (e) {}
      
      // Validate length and keywords
      const hasLength = text.length >= minLen;
      const matchedKeywords = keywordsList.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));
      
      // If keywords list exists, require at least one keyword for green-check self-grading
      const hasKeywords = keywordsList.length === 0 || matchedKeywords.length > 0;
      
      if (hasLength && hasKeywords) {
        textarea.classList.add("is-correct");
        badge.classList.add("success-check");
      } else {
        isProblemCorrect = false;
        textarea.classList.add("is-incorrect");
        badge.classList.add("error-cross");
        
        // Add helpful dynamic guidance if they failed checking
        let msg = "Write a bit more explanation to explain your reasoning.";
        if (keywordsList.length > 0 && matchedKeywords.length === 0) {
          msg = "Try adding key vocabulary terms like: " + keywordsList.slice(0, 3).join(", ") + " to strengthen your response.";
        }
        
        const expDiv = document.createElement("div");
        expDiv.className = "explanation-box";
        expDiv.style.backgroundColor = "var(--error-bg)";
        expDiv.style.borderColor = "var(--error)";
        expDiv.style.color = "var(--error)";
        expDiv.innerHTML = "<strong>Hint:</strong> " + msg;
        textarea.parentElement.parentElement.appendChild(expDiv);
      }
    }
    
    if (isProblemCorrect) {
      correctCount++;
      section.classList.add("correct");
    } else {
      hasIncorrect = true;
      section.classList.add("incorrect");
    }
  });
  
  // Dynamic Score Feedback & Sound Effects
  const total = problems.length;
  document.getElementById("progress_text").textContent = "Score: " + correctCount + " / " + total + " Correct";
  document.getElementById("progress_bar").style.width = (correctCount / total * 100) + "%";
  
  if (correctCount === total) {
    playSuccessArpeggio();
  } else {
    playFailureSound();
  }
}

function resetWorksheet() {
  if (confirm("Are you sure you want to reset all your work?")) {
    localStorage.removeItem(STORAGE_KEY);
    
    // Clear normal text inputs, textareas, dropdowns, and radios
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(t => {
      t.value = "";
      t.classList.remove("is-correct", "is-incorrect");
    });
    
    const inputs = document.querySelectorAll("input[type='text']");
    inputs.forEach(i => {
      i.value = "";
      i.classList.remove("is-correct", "is-incorrect");
    });
    
    const selects = document.querySelectorAll("select:not(.mobile-cat-select)");
    selects.forEach(s => {
      s.value = "";
      s.classList.remove("is-correct", "is-incorrect");
    });
    
    const radios = document.querySelectorAll("input[type='radio']");
    radios.forEach(r => r.checked = false);
    
    const labels = document.querySelectorAll(".mc-option-label");
    labels.forEach(l => l.classList.remove("is-correct", "is-incorrect"));
    
    // Clear feedback badges and sections
    const badges = document.querySelectorAll(".feedback-badge");
    badges.forEach(b => b.className = "feedback-badge");
    
    const sections = document.querySelectorAll(".problem-section");
    sections.forEach(s => {
      s.classList.remove("correct", "incorrect");
      const expBoxes = s.querySelectorAll(".explanation-box");
      expBoxes.forEach(b => b.remove());
      
      const workedSteps = s.querySelectorAll(".worked-step");
      workedSteps.forEach(ws => ws.classList.remove("highlighted"));
      
      const reveal = s.querySelector(".reveal-box");
      if (reveal) reveal.style.display = "none";
      
      const type = s.dataset.problemType;
      if (type === "drag-sort") {
        const parts = s.id.split("_");
        const idx = parts[1];
        resetDragSort(idx);
      }
    });
    
    // Save blank state
    saveState();
    updateProgress();
    
    // Play a reset click sound
    if (soundEnabled) {
      try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }
  }
}

// Initial configuration
window.onload = function() {
  loadState();
  updateProgress();
  
  // Set up dragging listeners for mobile touch screen card clicks
  let selectedDragCard = null;
  const cards = document.querySelectorAll(".drag-card");
  
  cards.forEach(card => {
    card.addEventListener("click", function(e) {
      if (e.target.tagName === "SELECT") return; // Let dropdown clicks handle themselves
      
      // Toggle select state
      if (selectedDragCard === this) {
        this.style.borderColor = "var(--line)";
        selectedDragCard = null;
      } else {
        if (selectedDragCard) {
          selectedDragCard.style.borderColor = "var(--line)";
        }
        selectedDragCard = this;
        this.style.borderColor = "var(--teal)";
      }
    });
  });
  
  const columns = document.querySelectorAll(".drag-column");
  columns.forEach(col => {
    col.addEventListener("click", function() {
      if (selectedDragCard) {
        const probIdx = selectedDragCard.id.split("_")[1];
        const targetColId = this.dataset.categoryId;
        
        // Ensure the card belongs to this problem
        if (selectedDragCard.id.startsWith("card_" + probIdx + "_")) {
          const slots = this.querySelector(".drag-column-slots");
          slots.appendChild(selectedDragCard);
          
          // Update corresponding select
          const select = selectedDragCard.querySelector(".mobile-cat-select");
          if (select) select.value = targetColId;
          
          selectedDragCard.style.borderColor = "var(--line)";
          selectedDragCard = null;
          
          saveState();
          updateProgress();
        }
      }
    });
  });
};
</script>
</body>
</html>`;
}

function main() {
  const lessons = lessonConfigs();
  let count = 0;
  
  for (const { id, config } of lessons) {
    const homeworkHtml = generateHtml(id, config);
    const lessonPath = join(lessonsDir, id, "homework.html");
    writeFileSync(lessonPath, homeworkHtml);
    count++;
  }
  
  console.log(`Successfully generated ${count} interactive homework HTML files.`);
}

main();
