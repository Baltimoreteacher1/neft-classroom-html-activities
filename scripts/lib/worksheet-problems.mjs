/**
 * worksheet-problems.mjs — one printed problem, from an authored practice item.
 *
 * Every item type the lesson configs author (multiple-choice, matching,
 * error-analysis, fill-table, drag-sort, open-response, guided-fill, number
 * lines, coordinate grids, balance scales, bar models) prints with the same
 * card: a number, a one-line direction in plain language, the problem, the
 * model or answer choices, a hint on the supported edition, a place to work,
 * and a line for the final answer. The answer key prints the same card with
 * the answer marked, the reasoning, and the misconception to watch for.
 *
 * Nothing here writes mathematics. Every printed word is the item's own text.
 */
import { normalizeFillTable } from "@eduwonderlab/engine/components/fill-table.js";
import {
  divisionCycleRail,
  divisionInStem,
  esc,
  longDivisionFrame,
  renderFirstQuadrantGridSvg,
  renderNumberLineSvg,
  renderProblemDiagram,
} from "./worksheet-figures.mjs";
import { scaffoldFor } from "./worksheet-scaffolds.mjs";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* One direction per item type, in the words a student reads. */
const DIRECTIONS = {
  "multiple-choice": "Circle the letter of the best answer. Show how you know.",
  matching: "Write the letter of the matching item on each line.",
  "matching-game": "Write the letter of the matching item on each line.",
  "error-analysis": "Find the mistake. Explain it, then show the correct work.",
  "fill-table": "Complete the table. Show how you found each value.",
  "drag-sort": "Write the name of the correct group on each line.",
  "open-response": "Answer in complete sentences.",
  "short-answer": "Answer in complete sentences.",
  "guided-fill": "Complete each step, then write the final answer.",
  "number-line": "Mark and label each value on the number line.",
  "coordinate-grid": "Plot and label each point on the grid.",
  "balance-scale": "Decide whether each pair balances. Check Yes or No, then explain.",
  "bar-model": "Use the model to solve. Show your work.",
  "fraction-bars": "Use the model to solve. Show your work.",
  "net-folder": "Use the net to solve. Show your work.",
};

export function getStem(it) {
  return (
    it.stem ||
    it.prompt ||
    it.question ||
    it.task ||
    it.questionText ||
    it.title ||
    it.label ||
    it.instructions ||
    "Solve. Show your work."
  );
}

const lines = (n) => `<div class="ws-lines">${'<span class="ws-line"></span>'.repeat(n)}</div>`;

export function workBox(label = "Show your work", rules = 3) {
  return `<div class="ws-work"><span class="ws-work-label">${esc(label)}</span>${lines(rules)}</div>`;
}

function answerLine(label = "Answer") {
  return `<div class="ws-answer-line"><span class="ws-answer-label">${esc(label)}:</span><span class="ws-fill-line"></span></div>`;
}

function workArea(it, { supported = false } = {}) {
  const div = divisionInStem(it?.stem);
  if (div) {
    return `<div class="wsd-wrap${supported ? " wsd-supported" : ""}">
      <div class="wsd-frame">${longDivisionFrame(div, { extraRows: supported ? 1 : 0 })}</div>
      ${supported ? divisionCycleRail() : ""}
    </div>`;
  }
  const scaffold = scaffoldFor(it, { supported });
  if (scaffold) return scaffold.html;
  return workBox("Show your work", supported ? 3 : 2);
}

/* The supported edition prints the item's FIRST hint — the one that names the
   move without doing the arithmetic. Later hints walk closer to the answer and
   belong to the interactive lesson's earned-hint flow, not to paper. */
function hintHtml(it, supported) {
  if (!supported) return "";
  const hints = (Array.isArray(it.hints) ? it.hints : [it.hint]).filter(Boolean);
  if (!hints.length) return "";
  // Level 0 (most support) prints EVERY authored hint as numbered steps to
  // try — the paper form of the app's always-on hints. Version A prints only
  // the first, the one that names the move without doing the arithmetic.
  if (supported === "all" && hints.length > 1) {
    return `<div class="ws-hint ws-hint-steps"><span class="ws-hint-tag">Steps to try</span><ol>${hints.map((h) => `<li>${esc(h)}</li>`).join("")}</ol></div>`;
  }
  return `<p class="ws-hint"><span class="ws-hint-tag">Hint</span> ${esc(hints[0])}</p>`;
}

function keyNote(label, text, cls = "ws-keynote") {
  if (!text) return "";
  return `<p class="${cls}"><b>${esc(label)}:</b> ${esc(text)}</p>`;
}

function keyNotes(it, commonMistake) {
  const watch = it.watchFor || it.distractorRationale || commonMistake;
  return keyNote("Why", it.explanation) + keyNote("Watch for", watch, "ws-watch");
}

/* ── renderers ─────────────────────────────────────────────────────────── */

function renderMC(it, key, commonMistake, supported) {
  const choices = Array.isArray(it.choices)
    ? it.choices
    : Array.isArray(it.options)
      ? it.options
      : [];
  const opts = choices
    .map((c, i) => {
      const correct = key && i === it.correctIndex;
      return `<li class="ws-opt${correct ? " ws-correct" : ""}"><span class="ws-bub">${LETTERS[i]}</span><span class="ws-opt-text">${esc(c)}</span></li>`;
    })
    .join("");
  const answer =
    key && Number.isInteger(it.correctIndex) && choices[it.correctIndex] != null
      ? keyNote("Answer", `${LETTERS[it.correctIndex]} — ${choices[it.correctIndex]}`)
      : "";
  return `<p class="ws-stem">${esc(getStem(it))}</p><ol class="ws-opts">${opts}</ol>${hintHtml(it, supported)}${key ? answer + keyNotes(it, commonMistake) : workArea(it, { supported })}`;
}

function renderMatching(it, key, supported) {
  const pairs = Array.isArray(it.pairs) ? it.pairs : [];
  const terms = pairs
    .map((p, i) => {
      const term = p.term || p.left || `Item ${i + 1}`;
      return `<li class="ws-match-term"><span class="ws-blank ws-blank-sm${key ? " ws-correct" : ""}">${key ? LETTERS[i] : ""}</span><span class="ws-term-lbl">${esc(term)}</span></li>`;
    })
    .join("");
  const bank = pairs
    .map(
      (p, i) =>
        `<li><span class="ws-bub ws-bub-sm">${LETTERS[i]}</span><span class="ws-match-desc">${esc(p.match || p.right || p.definition || "")}</span></li>`,
    )
    .join("");
  return `<p class="ws-stem">${esc(getStem(it))}</p>
  <div class="ws-match"><ol class="ws-match-terms">${terms}</ol><ul class="ws-match-bank">${bank}</ul></div>
  ${hintHtml(it, supported)}${key ? keyNote("Why", it.explanation) : ""}`;
}

function renderErrorAnalysis(it, key, supported) {
  const steps = (it.workedExample || [])
    .map(
      (s, i) =>
        `<li${key && it.errorStep === i ? ' class="ws-step-wrong"' : ""}><span class="ws-step-n">${i + 1}</span><span class="ws-step-l">${esc(s.label || `Step ${i + 1}`)}</span><span class="ws-step-w">${esc(s.work || s.text || "")}</span></li>`,
    )
    .join("");
  let keyHtml = "";
  if (key) {
    const where = typeof it.errorStep === "number" ? `Step ${it.errorStep + 1}` : "";
    keyHtml =
      keyNote("Mistake", where ? `${where}. ${it.explanation || ""}`.trim() : it.explanation) +
      keyNote("Correct work", it.correctWork);
  }
  return `<p class="ws-stem"><b>${esc(getStem(it))}</b></p>
  <div class="ws-steps-box"><ol class="ws-steps">${steps}</ol></div>
  <p class="ws-prompt">Which step has the mistake? Explain what went wrong, then show the correct work.</p>
  ${hintHtml(it, supported)}${key ? keyHtml : workBox("Correct work", 4) + answerLine("Correct answer")}`;
}

function renderFillTable(it, key, supported) {
  const t = normalizeFillTable(it);
  const stem = it.stem || it.prompt || it.instructions || it.label || "Complete the table.";
  if (!t.headers.length || !t.rows.length) {
    return `<p class="ws-stem">${esc(stem)}</p>${key ? keyNote("Why", it.explanation) : workBox("Show your work", 4) + answerLine()}`;
  }
  const editable = new Set((t.editableCells || []).map((c) => `${c.row}:${c.col}`));
  const head = t.headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = t.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          if (!editable.has(`${r}:${c}`)) return `<td>${esc(cell)}</td>`;
          return key
            ? `<td class="ws-correct">${esc(cell)}</td>`
            : `<td class="ws-cell-blank"></td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<p class="ws-stem">${esc(stem)}</p>
  <table class="ws-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  ${hintHtml(it, supported)}${key ? keyNote("Why", it.explanation) : workBox("Show your work", 2)}`;
}

/* Categories are authored as objects ({id, label}) with the items listed
   separately and tagged by category id — the previous renderer looked for the
   items INSIDE each category and printed an empty sort on every sheet. */
function renderDragSort(it, key, supported) {
  const rawCats = Array.isArray(it.categories) ? it.categories : [];
  const cats = rawCats.map((c, i) =>
    typeof c === "object" && c
      ? { id: c.id ?? c.label ?? String(i), label: c.label || c.title || `Group ${i + 1}` }
      : { id: String(c), label: String(c) },
  );
  const labelFor = (ref) => {
    if (ref == null) return "";
    if (typeof ref === "number") return cats[ref]?.label || "";
    const hit = cats.find((c) => c.id === ref || c.label === ref);
    return hit ? hit.label : String(ref);
  };
  const items = [];
  for (const cat of rawCats) {
    if (cat && typeof cat === "object" && Array.isArray(cat.items)) {
      for (const text of cat.items) items.push({ text, category: cat.label || cat.title || "" });
    }
  }
  for (const i of it.items || it.cards || []) {
    if (typeof i === "string") items.push({ text: i, category: "" });
    else if (i)
      items.push({ text: i.text || i.label || "", category: labelFor(i.category ?? i.correct) });
  }
  const catsHtml = cats.map((c) => `<span class="ws-cat-pill">${esc(c.label)}</span>`).join(" ");
  const itemsHtml = items
    .map(
      (i) =>
        `<li class="ws-sort-item"><span class="ws-blank ws-blank-md${key ? " ws-correct" : ""}">${key ? esc(i.category) : ""}</span><span class="ws-sort-text">${esc(i.text)}</span></li>`,
    )
    .join("");
  return `<p class="ws-stem">${esc(getStem(it))}</p>
  <div class="ws-cats-bar"><b>Groups:</b> ${catsHtml}</div>
  <ul class="ws-sort-list">${itemsHtml}</ul>
  ${hintHtml(it, supported)}${key ? keyNote("Why", it.explanation) : ""}`;
}

function renderOpen(it, key, supported) {
  const frames = it.sentenceFrame || (Array.isArray(it.sentenceStems) ? it.sentenceStems : []);
  const frameList = (Array.isArray(frames) ? frames : [frames]).filter(Boolean);
  const frameHtml =
    supported && frameList.length
      ? `<div class="ws-frame"><span class="ws-frame-tag">Sentence starter</span> ${frameList.map(esc).join("<br>")}</div>`
      : "";
  let keyHtml = "";
  if (key) {
    keyHtml =
      keyNote("Sample answer", it.sampleAnswer || it.modelAnswer) +
      keyNote(
        "Look for",
        Array.isArray(it.keywords) && it.keywords.length ? it.keywords.join(", ") : "",
      ) +
      keyNote("Why", it.explanation);
  }
  return `<p class="ws-stem">${esc(getStem(it))}</p>${frameHtml}${hintHtml(it, supported)}${key ? keyHtml : workBox("Write your answer", 4)}`;
}

function renderGuidedFill(it, key, supported) {
  const steps = Array.isArray(it.steps) ? it.steps : [];
  const rows = steps
    .map(
      (st, i) =>
        `<li class="ws-gf-step"><span class="ws-step-n">${i + 1}</span><span class="ws-gf-prompt">${esc(st.prompt || st.label || `Step ${i + 1}`)}</span><span class="ws-blank${key ? " ws-correct" : ""}">${key ? esc(st.answer ?? "") : ""}</span></li>`,
    )
    .join("");
  const stepsHtml = rows ? `<ol class="ws-gf-steps">${rows}</ol>` : "";
  const finalHtml = `<div class="ws-answer-line"><span class="ws-answer-label">Final answer:</span><span class="ws-fill-line${key ? " ws-correct" : ""}">${key ? esc(it.answer ?? "") : ""}</span></div>`;
  const body = stepsHtml || (key ? "" : workBox("Show your work", 4));
  return `<p class="ws-stem">${esc(getStem(it))}</p>${body}${hintHtml(it, supported)}${finalHtml}${key ? keyNote("Why", it.explanation) : ""}`;
}

function renderNumberLine(it, key, supported) {
  const targets = (it.targets || it.points || []).filter(
    (p) => p && Number.isFinite(Number(p.value)),
  );
  const figure = renderNumberLineSvg({
    min: it.min,
    max: it.max,
    step: it.step,
    points: key ? targets : [],
  });
  const answer = key
    ? keyNote(
        "Answer",
        targets.map((p) => `${p.label ? `${p.label} at ` : ""}${p.value}`).join("; "),
      )
    : "";
  return `<p class="ws-stem">${esc(getStem(it))}</p>${figure}${hintHtml(it, supported)}${key ? answer + keyNote("Why", it.explanation) : workBox("Show your thinking", 2)}`;
}

function renderCoordinateGrid(it, key, supported) {
  const targets = (it.targets || it.points || []).filter(
    (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)),
  );
  const figure = renderFirstQuadrantGridSvg(it, key ? targets : []);
  const answer = key
    ? keyNote("Answer", targets.map((p) => p.label || `(${p.x}, ${p.y})`).join(", "))
    : "";
  return `<p class="ws-stem">${esc(getStem(it))}</p>${figure}${hintHtml(it, supported)}${key ? answer + keyNote("Why", it.explanation) : workBox("Show your thinking", 2)}`;
}

function renderBalanceScale(it, key, supported) {
  const rows = (it.items || [])
    .map((row, i) => {
      const verdict = key
        ? `<span class="ws-correct">${row.balanced ? "Yes" : "No"}</span>${row.correction ? ` <span class="ws-keynote-inline">${esc(row.correction)}</span>` : ""}`
        : `<span class="ws-check">&#9744; Yes</span> <span class="ws-check">&#9744; No</span>`;
      return `<tr><td class="ws-scale-n">${i + 1}</td><td>${esc(row.left ?? "")}</td><td class="ws-scale-eq">=?</td><td>${esc(row.right ?? "")}</td><td>${verdict}</td></tr>`;
    })
    .join("");
  return `<p class="ws-stem">${esc(getStem(it))}</p>
  <table class="ws-table ws-scale-table"><thead><tr><th></th><th>Left side</th><th></th><th>Right side</th><th>Balanced?</th></tr></thead><tbody>${rows}</tbody></table>
  ${hintHtml(it, supported)}${key ? keyNote("Why", it.explanation) : workBox("Explain your choice", 2)}`;
}

function renderGeneric(it, key, supported) {
  const answer = it.answer != null ? String(it.answer) : it.sampleAnswer || it.modelAnswer || "";
  return `<p class="ws-stem">${esc(getStem(it))}</p>${hintHtml(it, supported)}${
    key
      ? keyNote("Answer", answer) + keyNote("Why", it.explanation)
      : workArea(it, { supported }) + answerLine()
  }`;
}

/** The printed card for one practice item. `n` is its number on the sheet. */
export function renderProblem(it, n, { key = false, supported = false, commonMistake = "" } = {}) {
  if (!it || (!it.type && !it.stem && !it.prompt && !it.question)) return "";
  const t = it.type || "";
  let body;
  if (t === "multiple-choice") body = renderMC(it, key, commonMistake, supported);
  else if (t === "matching" || t === "matching-game") body = renderMatching(it, key, supported);
  else if (t === "error-analysis") body = renderErrorAnalysis(it, key, supported);
  else if (t === "fill-table") body = renderFillTable(it, key, supported);
  else if (t === "drag-sort") body = renderDragSort(it, key, supported);
  else if (t === "open-response" || t === "short-answer") body = renderOpen(it, key, supported);
  else if (t === "guided-fill") body = renderGuidedFill(it, key, supported);
  else if (t === "number-line") body = renderNumberLine(it, key, supported);
  else if (t === "coordinate-grid") body = renderCoordinateGrid(it, key, supported);
  else if (t === "balance-scale") body = renderBalanceScale(it, key, supported);
  else body = renderGeneric(it, key, supported);

  const diagram =
    t === "number-line" || t === "coordinate-grid" || t === "balance-scale"
      ? ""
      : renderProblemDiagram(it);
  const direction = DIRECTIONS[t] || "Solve. Show your work.";
  return `
    <li class="ws-problem-card">
      <div class="ws-problem-head"><span class="ws-pnum">${n}</span><span class="ws-directions">${esc(direction)}</span></div>
      <div class="ws-pbody">${diagram}${body}</div>
    </li>`;
}

/* ── sections ──────────────────────────────────────────────────────────── */

const WS_SECTIONS = [
  { key: "visual", name: "Understand the idea", tag: "models and meaning" },
  { key: "fluency", name: "Practice the skill", tag: "show every step" },
  { key: "context", name: "Apply it", tag: "real-world problems" },
  { key: "writing", name: "Explain and correct", tag: "reasoning" },
];

const VISUAL_TYPES = new Set([
  "bar-model",
  "number-line",
  "area-model",
  "tape-diagram",
  "fraction-model",
  "fraction-bars",
  "drag-sort",
  "matching-game",
  "matching",
  "fill-table",
  "percent-grid",
  "balance-scale",
  "coordinate-plane",
  "coordinate-grid",
  "dot-plot",
  "box-plot",
  "histogram",
  "bar-chart",
  "factor-tree",
  "net-folder",
]);
const WRITING_TYPES = new Set(["error-analysis", "open-response", "constructed-response"]);

export function sectionOf(item) {
  const type = String(item?.type || "");
  if (WRITING_TYPES.has(type)) return "writing";
  if (VISUAL_TYPES.has(type)) return "visual";
  const stem = String(item?.stem || item?.prompt || "").trim();
  if (
    /\b(what does|which expression|what is the meaning|which model|which real-world|which statement|matches)\b/i.test(
      stem,
    )
  )
    return "visual";
  // Fluency is the narrow case, recognised positively: a bare computation is
  // an instruction word (or nothing) wrapped around an expression. Anything
  // with prose in it is a context; that is what prose is.
  const bare = stem
    .replace(/^(what is|calculate|simplify|evaluate|solve|find|compute)\b[:\s]*/i, "")
    .replace(/[?.]$/, "")
    .trim();
  if (bare && /^[\d\s/×÷+\-*=().,^%$]+$/.test(bare)) return "fluency";
  if (!stem) return "fluency";
  return "context";
}

/** The problems grouped under plain-language part headers, numbered continuously. */
export function sectionedProblems(pool, renderOne) {
  const buckets = new Map(WS_SECTIONS.map((sc) => [sc.key, []]));
  pool.forEach((item) => buckets.get(sectionOf(item)).push(item));
  const used = WS_SECTIONS.filter((sc) => buckets.get(sc.key).length);
  let n = 0;
  if (used.length < 2) {
    return `<ol class="ws-problems">${pool.map((it) => renderOne(it, ++n)).join("")}</ol>`;
  }
  return used
    .map((sc, i) => {
      const items = buckets
        .get(sc.key)
        .map((it) => renderOne(it, ++n))
        .join("");
      return `<div class="ws-section-head"><span class="ws-section-n">Part ${i + 1}</span><span class="ws-section-name">${esc(sc.name)}</span><span class="ws-section-tag">${esc(sc.tag)}</span></div>
        <ol class="ws-problems">${items}</ol>`;
    })
    .join("");
}
