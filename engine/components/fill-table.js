import { isRight, norm } from "../core/answer-match.js";
import { stackContent } from "../core/i18n.js";

// ── How generously a table cell is judged ────────────────────────────────────
//
// A table cell holds a student's WORKING, not just a final number: the rewrite
// step of a decimal division, an inverse operation, a keep-change-flip, a
// check. There is no single right way to write any of those.
//
// MOST of that generosity is not table-specific and now lives in the shared
// matcher (engine/core/answer-match.js — notation, phrasing, either half of a
// stated equation), so every typed answer in the product gets it. What is left
// here is the one layer that is only true of a WORK column: a cell that asks to
// SEE the division is answered by the division or by the value it comes to, so
// "56 ÷ 8" and "7" are the same cell. That is right for a column of working and
// wrong for a question asking what the quotient is, which is why it stays here
// rather than being promoted.
//
// The rule for both halves: forgive NOTATION and PHRASING, never the
// mathematics. Pinned by fill-table-match.test.mjs, whose rejections matter as
// much as its acceptances — a matcher that accepts everything tells a student
// their wrong answer was right.

/** Strip the decoration a student would never think to type. */
function tidy(value) {
  return String(value ?? "")
    .replace(/[✓✔✅]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]+$/, "");
}

/**
 * Arithmetic by VALUE. Hand-rolled (no eval, no Function): the only thing this
 * parser can read is digits and + − × ÷ ( ). Returns null for anything that is
 * not a complete numeric expression — a stem with a variable in it, a word, a
 * half-typed cell — so a non-expression never compares equal to anything.
 */
function evaluateArithmetic(text) {
  const src = norm(tidy(text))
    .replace(/x(?=\d)|(?<=\d)x/g, "*")
    .replace(/\s/g, "");
  if (!src || !/^[-+*/().\d]+$/.test(src) || !/\d/.test(src)) return null;
  let i = 0;
  const peek = () => src[i];
  const parseExpression = () => {
    let value = parseTerm();
    if (value === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const right = parseTerm();
      if (right === null) return null;
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };
  const parseTerm = () => {
    let value = parseFactor();
    if (value === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      value = op === "*" ? value * right : value / right;
    }
    return value;
  };
  const parseFactor = () => {
    if (peek() === "-") {
      i++;
      const inner = parseFactor();
      return inner === null ? null : -inner;
    }
    if (peek() === "(") {
      i++;
      const inner = parseExpression();
      if (inner === null || src[i] !== ")") return null;
      i++;
      return inner;
    }
    const match = /^\d*\.?\d+/.exec(src.slice(i));
    if (!match) return null;
    i += match[0].length;
    return Number(match[0]);
  };
  const value = parseExpression();
  return value === null || i !== src.length || !Number.isFinite(value) ? null : value;
}

/** The halves of a stated equation, each judged as a cell in its own right. */
function equationParts(value) {
  const text = tidy(value);
  if (!text.includes("=")) return [];
  return text
    .split("=")
    .map((part) => part.trim())
    .filter((part) => part && /\d/.test(part));
}

/** Judge one table cell. `expected` may be a string or a list of accepted forms. */
export function cellMatches(input, expected) {
  if (!String(input ?? "").trim()) return false;
  const accepted = Array.isArray(expected) ? expected : [expected];
  return accepted.some((one) => matchesOneCell(input, one));
}

function matchesOneCell(input, expected) {
  if (expected == null) return false;

  // Everything the rest of the product already forgives.
  if (isRight(tidy(input), tidy(expected))) return true;

  // …and, for a work column only, the value the working comes to.
  const typedValue = evaluateArithmetic(input);
  if (typedValue === null) return false;
  const expectedValue = evaluateArithmetic(expected);
  if (expectedValue !== null && Math.abs(typedValue - expectedValue) < 1e-9) return true;
  for (const part of equationParts(expected)) {
    const partValue = evaluateArithmetic(part);
    if (partValue !== null && Math.abs(typedValue - partValue) < 1e-9) return true;
  }
  return false;
}

const FT_STYLE_ID = "ft-engine-styles";

// Inject the component's scoped polish styles exactly once per document.
// All motion is additive and gated behind prefers-reduced-motion: reduce.
// Uses existing design-system CSS vars so it inherits theme/dark-mode.
function injectFillTableStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(FT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = FT_STYLE_ID;
  style.textContent = `
    /* ---- Fill-table polish (scoped to .ft-root) ---- */
    .ft-root .ft-table { border-collapse: collapse; }

    /* Striped rows for readability */
    .ft-root .ft-table tbody tr:nth-child(even) td {
      background: color-mix(in srgb, var(--line) 28%, transparent);
    }

    /* Editable input: base look + focus glow + animated underline */
    .ft-root .ft-input {
      position: relative;
      outline: none;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background-image: linear-gradient(var(--teal), var(--teal));
      background-repeat: no-repeat;
      background-position: 0 100%;
      background-size: 0% 2px;
    }
    .ft-root .ft-input:hover:not([readonly]) {
      border-color: color-mix(in srgb, var(--teal) 55%, var(--line));
    }
    .ft-root .ft-input:focus {
      border-color: var(--teal-ink);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--teal) 22%, transparent);
      background-size: 100% 2px;
    }

    /* Dropdown cells (authored via editableCells[].options) */
    .ft-root .ft-select { cursor: pointer; background-color: var(--surface, #fff); }
    .ft-root .ft-select:disabled { cursor: default; opacity: 1; }

    /* Parallax row lift on hover: row shifts up, shadow grows */
    .ft-root .ft-table tbody tr {
      position: relative;
    }
    .ft-root .ft-table tbody tr:hover td {
      background: color-mix(in srgb, var(--teal) 8%, transparent);
    }

    /* Correct cell scale-up confirmation: 1 -> 1.05 -> 1 */
    .ft-root .ft-cell-correct {
      animation: ft-confirm-pop 0.42s ease;
    }
    @keyframes ft-confirm-pop {
      0% { transform: scale(1); }
      55% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    /* Mobile: responsive font size + larger touch padding */
    @media (max-width: 560px) {
      .ft-root .ft-table { font-size: 0.95rem; }
      .ft-root .ft-input { padding: 10px 12px; font-size: 1rem; }
    }
    @media (hover: none) and (pointer: coarse) {
      .ft-root .ft-input { padding: 11px 13px; }
    }

    /* Motion + transitions ONLY when the user has not asked to reduce them */
    @media (prefers-reduced-motion: no-preference) {
      .ft-root .ft-input {
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background-size 0.25s ease;
      }
      .ft-root .ft-table tbody tr {
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .ft-root .ft-table tbody tr:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
        z-index: 1;
      }
      .ft-root .ft-table tbody tr td {
        transition: background 0.2s ease;
      }
    }

    /* Under reduced motion: disable the pop animation entirely */
    @media (prefers-reduced-motion: reduce) {
      .ft-root .ft-cell-correct { animation: none; }
    }
  `;
  document.head.append(style);
}

export function renderFillTable(container, config) {
  injectFillTableStyles();
  // Normalize non-standard authoring shapes into the standard
  // { headers, rows (array of arrays), editableCells:[{row,col,answer}] }
  // shape this component renders. Some lesson configs author fill-tables as
  // { columns:[...], items|rows:[{key:value,...}] } where each row is an
  // object whose values map positionally to `columns`. Without this adapter
  // those tables render blank (missing headers/rows/editableCells).
  const { headers, headersEs, rows, rowsEs, editableCells, rowFigures, onComplete } =
    normalizeFillTable(config);

  const wrapper = document.createElement("div");
  wrapper.className = "card ft-root";

  // Safety fallback: if we could not build a usable table, never render blank.
  // Show the instructions and any raw items/rows in a readable list so the
  // learner still sees the content, then auto-complete the phase.
  if (!Array.isArray(rows) || rows.length === 0 || headers.length === 0) {
    renderFillTableFallback(wrapper, config);
    container.append(wrapper);
    if (onComplete) onComplete(0, 0);
    return;
  }

  const table = document.createElement("table");
  table.className = "vocab-table ft-table";
  table.style.cssText = "width:100%;";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headers.forEach((h, i) => {
    const th = document.createElement("th");
    // A column header names what the student must produce in that column, so
    // an English header above Spanish rows tells them nothing about the cell
    // they are typing into.
    th.innerHTML = stackContent(h, headersEs[i]);
    headerRow.append(th);
  });
  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  const inputs = [];
  // Inputs grouped by row, in column order — the table is worked LEFT TO RIGHT,
  // one step at a time, so each row's next cell needs to know the one before it.
  /** @type {Record<number, HTMLElement[]>} */
  const rowInputs = {};
  // Correct answers are kept in a closure keyed by cell, never written to the
  // DOM — otherwise a student can read every answer via "Inspect Element".
  const answerByKey = new Map();

  rows.forEach((row, ri) => {
    const tr = document.createElement("tr");
    row.forEach((cell, ci) => {
      const td = document.createElement("td");
      const cellKey = `${ri}-${ci}`;
      const editable = editableCells.find((e) => e.row === ri && e.col === ci);

      if (editable) {
        // A cell that authors a fixed `options` list becomes a dropdown, not a
        // free-text box. Some columns ("Better Buy?") are a CHOICE, and a blank
        // text box there tells a student nothing about what to type.
        const choices = Array.isArray(editable.options)
          ? editable.options.filter((o) => o != null).map(String)
          : null;
        let input;
        if (choices && choices.length) {
          input = document.createElement("select");
          input.className = "text-input ft-input ft-select";
          input.style.cssText = "padding:6px 8px; font-size:0.9rem; width:100%; min-width:60px;";
          const placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = editable.placeholder || "Choose…";
          input.append(placeholder);
          choices.forEach((choice) => {
            const opt = document.createElement("option");
            opt.value = choice;
            opt.textContent = choice;
            input.append(opt);
          });
        } else {
          input = document.createElement("input");
          input.type = "text";
          input.className = "text-input ft-input";
          input.style.cssText = "padding:6px 8px; font-size:0.9rem; width:100%; min-width:60px;";
          input.placeholder = "?";
        }
        input.setAttribute("aria-label", `${headers[ci]} for row ${ri + 1}`);
        input.dataset.key = cellKey;
        input.dataset.row = String(ri);
        input.dataset.col = String(ci);
        answerByKey.set(cellKey, String(editable.answer));
        td.append(input);
        inputs.push(input);
        (rowInputs[ri] ||= []).push(input);
      } else {
        // An authored per-row figure rides in the FIRST cell, above its label,
        // so a student can see the shape the row is describing instead of
        // holding "octagon = 8 triangles" in their head.
        if (ci === 0 && rowFigures[ri]) {
          const fig = buildRowFigure(rowFigures[ri]);
          if (fig) td.append(fig);
        }
        const text = document.createElement("span");
        text.innerHTML = stackContent(cell, rowsEs?.[ri]?.[ci]);
        td.append(text);
        td.style.fontWeight = "600";
      }

      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(tbody);
  wrapper.append(table);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  // Registered as a live region while still empty, so the feedback written
  // into it later is announced — an alert born in the same task is not.
  feedbackSlot.setAttribute("role", "status");
  feedbackSlot.setAttribute("aria-live", "polite");
  wrapper.append(feedbackSlot);

  // ── One cell at a time ────────────────────────────────────────────────────
  // The subtitle over this lab has always promised "build the table one cell at
  // a time", but every intermediate cell was pre-filled and the only real cell
  // was the last one — so a student went straight from the problem to the
  // answer with nothing in between. Now each row is worked LEFT TO RIGHT: the
  // next step opens once the step before it is right, and each cell answers on
  // its own instead of waiting for one verdict at the end.
  //
  // Nothing here can strand a student: "Show me this step" is on screen from
  // the first render, and using it opens the next cell exactly as a correct
  // answer would.
  const stepNote = document.createElement("p");
  stepNote.className = "ft-stepnote";
  stepNote.style.cssText =
    "margin:10px 0 0;font-size:0.92rem;font-weight:600;color:var(--muted, #5f6f80);";
  stepNote.textContent =
    rowInputs[0] && rowInputs[0].length > 1
      ? "Work each row across: finish one step, and the next one opens."
      : "";
  if (stepNote.textContent) wrapper.append(stepNote);

  const lockCell = (input) => {
    input.dataset.locked = "1";
    if (input.tagName === "SELECT") input.disabled = true;
    else input.readOnly = true;
    input.style.opacity = "0.55";
    input.setAttribute("aria-disabled", "true");
    if (input.tagName !== "SELECT") input.placeholder = "🔒";
  };
  const openCell = (input) => {
    if (!input || !input.dataset.locked) return;
    delete input.dataset.locked;
    if (input.tagName === "SELECT") input.disabled = false;
    else input.readOnly = false;
    input.style.opacity = "";
    input.removeAttribute("aria-disabled");
    if (input.tagName !== "SELECT") input.placeholder = "?";
  };
  const settled = new Set();
  const confirmCell = (input) => {
    settled.add(input.dataset.key);
    input.style.borderColor = "var(--success)";
    input.style.background = "var(--success-bg)";
    if (input.tagName === "SELECT") input.disabled = true;
    else input.readOnly = true;
    input.classList.remove("ft-cell-correct");
    void input.offsetWidth;
    input.classList.add("ft-cell-correct");
    const list = rowInputs[Number(input.dataset.row)] || [];
    openCell(list[list.indexOf(input) + 1]);
  };

  // Lock every cell after the first in each row, and give each row its model.
  Object.keys(rowInputs).forEach((key) => {
    const ri = Number(key);
    const list = rowInputs[ri];
    if (list.length < 2) return;
    list.slice(1).forEach(lockCell);
  });

  // Per-cell answering. A cell is judged when the student leaves it (or presses
  // Enter) with something typed — never while they are mid-keystroke.
  const judge = (input) => {
    if (input.dataset.locked || settled.has(input.dataset.key)) return;
    const value = String(input.value || "").trim();
    if (!value) return;
    const expected = answerByKey.get(input.dataset.key);
    const ci = Number(input.dataset.col);
    if (cellMatches(value, expected)) {
      confirmCell(input);
      // Asked AFTER confirming, because confirming is what opens the next cell.
      const rowLeft = (rowInputs[Number(input.dataset.row)] || []).some(
        (i) => !settled.has(i.dataset.key),
      );
      showFb(
        feedbackSlot,
        "success",
        `${escapeText(headers[ci] || "That step")} — got it. ${
          rowLeft ? "The next step is open." : "That row is done."
        }`,
      );
      return;
    }
    input.style.borderColor = "var(--error)";
    input.style.background = "var(--error-bg)";
    showFb(
      feedbackSlot,
      "hint",
      `Not yet for <strong>${escapeText(headers[ci] || "this step")}</strong>. Try that one cell again, or use “Show me this step”.`,
    );
  };
  inputs.forEach((input) => {
    input.addEventListener("blur", () => judge(input));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        judge(input);
      }
    });
    if (input.tagName === "SELECT") input.addEventListener("change", () => judge(input));
  });

  // The worked model. It fills the FIRST unfinished cell — the one the student
  // is actually stuck on — names the column it belongs to, and opens the next
  // step, so a stuck student sees ONE step modelled rather than the answer key.
  const modelBtn = document.createElement("button");
  modelBtn.type = "button";
  modelBtn.className = "btn ft-model-btn";
  modelBtn.style.cssText = "margin-top:12px;margin-right:10px;";
  modelBtn.textContent = "Show me this step";
  modelBtn.addEventListener("click", () => {
    const next = inputs.find((i) => !settled.has(i.dataset.key));
    if (!next) return;
    openCell(next);
    const expected = answerByKey.get(next.dataset.key) ?? "";
    next.value = expected;
    const ci = Number(next.dataset.col);
    const ri = Number(next.dataset.row);
    confirmCell(next);
    showFb(
      feedbackSlot,
      "hint",
      `Row ${ri + 1}, <strong>${escapeText(headers[ci] || "this step")}</strong> is <strong>${escapeText(expected)}</strong>. Read why that is the move, then do the next one yourself.`,
    );
  });

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Table";

  let completed = false;

  checkBtn.addEventListener("click", () => {
    if (completed) return;
    let correct = 0;
    const total = inputs.length;

    inputs.forEach((input) => {
      if (settled.has(input.dataset.key)) {
        correct++;
        return;
      }
      // A step the student has not reached yet is not "wrong" — it is not their
      // turn. Marking it red would punish them for working in order.
      if (input.dataset.locked) return;
      const userVal = input.value.trim();
      const expected = answerByKey.get(input.dataset.key);
      const isMatch = cellMatches(userVal, expected);

      input.style.borderColor = isMatch ? "var(--success)" : "var(--error)";
      input.style.background = isMatch ? "var(--success-bg)" : "var(--error-bg)";

      if (isMatch) {
        correct++;
        // `readOnly` is a no-op on <select>; lock those with `disabled` so a
        // confirmed-correct dropdown cannot be changed back to a wrong choice.
        // Confirmation pop (1 -> 1.05 -> 1); CSS gates it under reduced motion.
        confirmCell(input);
      }
    });

    if (correct === total) {
      completed = true;
      checkBtn.style.display = "none";
      modelBtn.style.display = "none";
      showFb(feedbackSlot, "success", `All ${total} values correct! Table complete.`);
      if (onComplete) onComplete(correct, total);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `${correct} of ${total} cells done. Work each row left to right — finish the open cell and the next step opens.`,
      );
    }
  });

  wrapper.append(modelBtn, checkBtn);
  container.append(wrapper);
}

// Readable, non-blank fallback for fill-table configs we cannot interpret as
// an interactive grid. Renders instructions plus any row/item content as text.
function renderFillTableFallback(wrapper, config = {}) {
  if (config.instructions || config.label) {
    const p = document.createElement("p");
    p.style.cssText = "font-weight:500; margin-bottom:var(--sp-3);";
    // Mirror the English fallback chain exactly, so a config that authored
    // `label`/`labelEs` cannot end up showing the English label above the
    // Spanish translation of a different field.
    p.innerHTML = config.instructions
      ? stackContent(config.instructions, config.instructionsEs)
      : stackContent(config.label, config.labelEs);
    wrapper.append(p);
  }

  const source = Array.isArray(config.items)
    ? config.items
    : Array.isArray(config.rows)
      ? config.rows
      : [];
  const cols = Array.isArray(config.columns)
    ? config.columns
    : Array.isArray(config.headers)
      ? config.headers
      : [];

  if (!source.length) return;

  const list = document.createElement("ul");
  list.style.cssText = "margin:0; padding-left:1.2rem; line-height:1.6;";
  source.forEach((row) => {
    const li = document.createElement("li");
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const keys = Object.keys(row);
      li.textContent = keys.map((k, i) => `${cols[i] || k}: ${row[k]}`).join("  ·  ");
    } else if (Array.isArray(row)) {
      li.textContent = row.map((v, i) => `${cols[i] ? cols[i] + ": " : ""}${v}`).join("  ·  ");
    } else {
      li.textContent = String(row);
    }
    list.append(li);
  });
  wrapper.append(list);
}

// Keys that strongly indicate the "answer" column to make editable. Checked in
// priority order; if none match, the last column becomes editable.
const ANSWER_KEY_PRIORITY = ["answer", "quotient", "solution", "result"];

// Exported so the Learn It generator (scripts/generate-notes.mjs) renders the
// SAME table shapes this component accepts — a second adapter would drift.
// DOM-free by construction: it only reshapes the authored config.
export function normalizeFillTable(config = {}) {
  const onComplete = config.onComplete;

  // Already in the standard shape: pass through untouched.
  if (
    Array.isArray(config.headers) &&
    Array.isArray(config.rows) &&
    config.rows.every((r) => Array.isArray(r))
  ) {
    return {
      headers: config.headers,
      // Parallel and all-or-nothing — see the variant shape below.
      headersEs:
        Array.isArray(config.headersEs) && config.headersEs.length === config.headers.length
          ? config.headersEs
          : [],
      rows: config.rows,
      editableCells: Array.isArray(config.editableCells) ? config.editableCells : [],
      rowFigures: Array.isArray(config.rowFigures) ? config.rowFigures : [],
      rowsEs: [],
      onComplete,
    };
  }

  // Variant shape: { columns:[...], items|rows:[{...}] } with object rows.
  const headers = Array.isArray(config.columns)
    ? config.columns.slice()
    : Array.isArray(config.headers)
      ? config.headers.slice()
      : [];
  // Parallel and ALL-OR-NOTHING: the header row is indexed positionally, so a
  // short array would label one column with another column's Spanish.
  const headersEsRaw = Array.isArray(config.columns) ? config.columnsEs : config.headersEs;
  const headersEs =
    Array.isArray(headersEsRaw) && headersEsRaw.length === headers.length
      ? headersEsRaw.slice()
      : [];

  const source = Array.isArray(config.items)
    ? config.items
    : Array.isArray(config.rows)
      ? config.rows
      : [];

  const objectRows = source.filter((r) => r && typeof r === "object" && !Array.isArray(r));

  if (!headers.length || !objectRows.length) {
    // Could not interpret — return what we have so the caller can fall back.
    return {
      headers,
      headersEs,
      rows: [],
      rowsEs: [],
      editableCells: [],
      rowFigures: [],
      onComplete,
    };
  }

  const colCount = headers.length;
  const rows = [];
  const editableCells = [];
  const rowFigures = [];

  const grid = objectRows.map((obj) => {
    // `figure` is metadata, not a column: it draws a small shape in the first
    // cell. Strip it before the positional value mapping below, or every
    // column after it would shift by one.
    //
    // A `*Es` sibling is metadata for exactly the same reason, and it is the
    // more dangerous of the two because it arrives LATER: a row authored as
    // {problem, solution} maps cleanly, and adding `problemEs` inserts a third
    // key between them, pushing `solution` into the wrong column. The table
    // would still render — with every cell after the translated one shifted by
    // one — which is worse than not translating at all.
    //
    // The Spanish for a cell is resolved GENERICALLY as `<column key> + "Es"`,
    // so any column a lesson translates is rendered without this file naming
    // it. Today that covers `problemEs`, `wordProblemEs`, `textEs` and
    // `labelEs`; those names are written out here on purpose, because a reader
    // — human or grep — cannot otherwise tell that this file consumes them,
    // and `tools/esol-lane-coverage.test.mjs` exists precisely to catch a
    // translated field with no visible consumer.
    rowFigures.push(obj.figure || null);
    const keys = Object.keys(obj).filter((k) => k !== "figure" && !/Es$/.test(k));
    const values = keys.map((k) => obj[k]);
    const cells = [];
    const cellsEs = [];
    for (let ci = 0; ci < colCount; ci++) {
      cells.push(values[ci] != null ? String(values[ci]) : "");
      const es = keys[ci] ? obj[`${keys[ci]}Es`] : undefined;
      cellsEs.push(es != null ? String(es) : "");
    }
    return { keys, values, cells, cellsEs };
  });

  const workCols = workColumns(headers, grid, config);

  const rowsEs = [];
  grid.forEach(({ keys, values, cells, cellsEs }, ri) => {
    // Every WORK column is the student's to fill. Which one is "the answer"
    // still matters for ordering and for callers that only care about the
    // final cell, so it is resolved the same way it always was.
    let answerKeyIndex = -1;
    for (const pref of ANSWER_KEY_PRIORITY) {
      const idx = keys.indexOf(pref);
      if (idx !== -1 && idx < colCount) {
        answerKeyIndex = idx;
        break;
      }
    }
    if (answerKeyIndex === -1) answerKeyIndex = colCount - 1;

    const cols = workCols.includes(answerKeyIndex) ? workCols : workCols.concat(answerKeyIndex);
    cols
      .slice()
      .sort((a, b) => a - b)
      .forEach((ci) => {
        const answer = values[ci];
        editableCells.push({
          row: ri,
          col: ci,
          answer: answer != null ? String(answer) : "",
          isFinal: ci === answerKeyIndex,
        });
        // Blank the editable cell so it renders as an input, not pre-filled text.
        cells[ci] = "";
      });
    rows.push(cells);
    rowsEs.push(cellsEs);
  });

  return {
    headers,
    headersEs,
    rows,
    rowsEs,
    editableCells,
    rowFigures,
    onComplete,
    workColumns: workCols,
  };
}

// Headers that name GIVEN information rather than a step the student performs.
// "Think about the folds" is a prompt; "Student's Model" is the work being
// critiqued; "Rule: 18 + 2 × shots" restates a rule the lesson supplied. Note
// the word boundary: this matches "Think about…" but NOT "Thinking", which is
// a column that asks the student to show their thinking.
const GIVEN_HEADER = /^(?:think\b|student|given\b|situation\b|word problem\b|figure\b)/i;

/**
 * Which column indexes hold STUDENT WORK.
 *
 * Until 2026-08-23 exactly ONE cell per row was editable — the final answer —
 * so every intermediate step was PRINTED for the student. On lesson 2.7 that
 * meant the table handed over "84 ÷ 21" (the whole point of the lesson: slide
 * both decimal points) and asked only for the quotient; the same shape repeats
 * across the fleet ("Convert to Improper", "Inverse Operation", "Substitute",
 * "Multiply & Subtract"). Joel reported it on 2026-08-23: the lab was giving
 * them the answers to the work they were supposed to be doing.
 *
 * Column 0 is the problem as posed, so it is always given. Everything after it
 * is student work unless it is demonstrably not:
 *   - `config.givenColumns` names it explicitly (authored escape hatch);
 *   - its header names given information (GIVEN_HEADER);
 *   - every row repeats the SAME value, which makes it a restated rule or
 *     prompt rather than a per-row computation.
 */
export function workColumns(headers, grid, config = {}) {
  const colCount = headers.length;
  const authored = Array.isArray(config.givenColumns)
    ? config.givenColumns.map(Number).filter(Number.isInteger)
    : [];
  const out = [];
  for (let ci = 1; ci < colCount; ci++) {
    if (authored.includes(ci)) continue;
    if (GIVEN_HEADER.test(String(headers[ci] || "").trim())) continue;
    const values = grid.map((row) => String(row.cells[ci] ?? "").trim()).filter(Boolean);
    if (values.length > 1 && values.every((v) => v === values[0])) continue;
    if (!values.length) continue;
    out.push(ci);
  }
  // A table whose every column past the first looked "given" still needs one
  // cell to answer, so the caller re-adds the answer column.
  return out;
}

// Draws the small per-row shape authored as `figure` on a row object.
// Only one shape so far: { shape:"regular-polygon", sides:6 } — the polygon fanned
// into its congruent triangles, which is exactly the "one triangle per side"
// idea students are being asked to use. Returns null for anything unknown, so
// an unrecognised figure degrades to no picture rather than a broken cell.
// DOM-light by design: pure SVG, no listeners, no layout measurement.
export function buildRowFigure(spec) {
  if (!spec || typeof spec !== "object") return null;
  if (spec.shape !== "regular-polygon") return null;
  const sides = Number(spec.sides);
  if (!Number.isInteger(sides) || sides < 3 || sides > 12) return null;

  const size = 56;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const vertex = (i) => {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  const fmt = (n) => Math.round(n * 100) / 100;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    `A regular polygon with ${sides} sides, split into ${sides} congruent triangles that meet at the center.`,
  );
  svg.style.cssText = "display:block; margin-bottom:6px;";

  for (let i = 0; i < sides; i++) {
    const [x1, y1] = vertex(i);
    const [x2, y2] = vertex(i + 1);
    const wedge = document.createElementNS(ns, "polygon");
    wedge.setAttribute(
      "points",
      `${fmt(cx)},${fmt(cy)} ${fmt(x1)},${fmt(y1)} ${fmt(x2)},${fmt(y2)}`,
    );
    // Alternating fills so the triangle count is countable at a glance.
    wedge.setAttribute("fill", i % 2 ? "var(--teal-soft, #d7f0ee)" : "var(--coral-soft, #fde3dd)");
    wedge.setAttribute("stroke", "var(--teal-ink, #0f6f6a)");
    wedge.setAttribute("stroke-width", "1");
    wedge.setAttribute("stroke-linejoin", "round");
    svg.append(wedge);
  }

  return svg;
}

// Cell values and headers are authored content, but they are interpolated into
// innerHTML below, so they are escaped rather than trusted.
function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.innerHTML = `
    <span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span>
    <span>${msg}</span>
  `;
  slot.innerHTML = "";
  slot.append(fb);
}
