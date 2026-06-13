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
      border-color: var(--teal);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--teal) 22%, transparent);
      background-size: 100% 2px;
    }

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
  const { headers, rows, editableCells, onComplete } =
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
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.append(th);
  });
  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  const inputs = [];
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
        const input = document.createElement("input");
        input.type = "text";
        input.className = "text-input ft-input";
        input.style.cssText =
          "padding:6px 8px; font-size:0.9rem; width:100%; min-width:60px;";
        input.placeholder = "?";
        input.setAttribute("aria-label", `${headers[ci]} for row ${ri + 1}`);
        input.dataset.key = cellKey;
        answerByKey.set(cellKey, String(editable.answer));
        td.append(input);
        inputs.push(input);
      } else {
        td.textContent = cell;
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
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Table";

  let completed = false;

  checkBtn.addEventListener("click", () => {
    if (completed) return;
    let correct = 0;
    const total = inputs.length;

    inputs.forEach((input) => {
      const userVal = input.value.trim();
      const expected = answerByKey.get(input.dataset.key);
      const isMatch = answersMatch(userVal, expected);

      input.style.borderColor = isMatch ? "var(--success)" : "var(--error)";
      input.style.background = isMatch
        ? "var(--success-bg)"
        : "var(--error-bg)";

      if (isMatch) {
        correct++;
        input.readOnly = true;
        // Confirmation pop (1 -> 1.05 -> 1); CSS gates it under reduced motion.
        // Retrigger reliably by clearing then re-adding the animation class.
        input.classList.remove("ft-cell-correct");
        // Force reflow so the animation restarts even on repeated checks.
        void input.offsetWidth;
        input.classList.add("ft-cell-correct");
      }
    });

    if (correct === total) {
      completed = true;
      checkBtn.style.display = "none";
      showFb(
        feedbackSlot,
        "success",
        `All ${total} values correct! Table complete.`,
      );
      if (onComplete) onComplete(correct, total);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `${correct} of ${total} correct. Check the highlighted cells — look at the pattern in the completed values.`,
      );
    }
  });

  wrapper.append(checkBtn);
  container.append(wrapper);
}

// Readable, non-blank fallback for fill-table configs we cannot interpret as
// an interactive grid. Renders instructions plus any row/item content as text.
function renderFillTableFallback(wrapper, config = {}) {
  if (config.instructions || config.label) {
    const p = document.createElement("p");
    p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
    p.textContent = config.instructions || config.label;
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
      li.textContent = keys
        .map((k, i) => `${cols[i] || k}: ${row[k]}`)
        .join("  ·  ");
    } else if (Array.isArray(row)) {
      li.textContent = row
        .map((v, i) => `${cols[i] ? cols[i] + ": " : ""}${v}`)
        .join("  ·  ");
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

function normalizeFillTable(config = {}) {
  const onComplete = config.onComplete;

  // Already in the standard shape: pass through untouched.
  if (
    Array.isArray(config.headers) &&
    Array.isArray(config.rows) &&
    config.rows.every((r) => Array.isArray(r))
  ) {
    return {
      headers: config.headers,
      rows: config.rows,
      editableCells: Array.isArray(config.editableCells)
        ? config.editableCells
        : [],
      onComplete,
    };
  }

  // Variant shape: { columns:[...], items|rows:[{...}] } with object rows.
  const headers = Array.isArray(config.columns)
    ? config.columns.slice()
    : Array.isArray(config.headers)
      ? config.headers.slice()
      : [];

  const source = Array.isArray(config.items)
    ? config.items
    : Array.isArray(config.rows)
      ? config.rows
      : [];

  const objectRows = source.filter(
    (r) => r && typeof r === "object" && !Array.isArray(r),
  );

  if (!headers.length || !objectRows.length) {
    // Could not interpret — return what we have so the caller can fall back.
    return { headers, rows: [], editableCells: [], onComplete };
  }

  // Determine which column index holds the answer to make editable. Prefer a
  // recognizably-named key; otherwise fall back to the final column.
  const colCount = headers.length;
  const rows = [];
  const editableCells = [];

  objectRows.forEach((obj, ri) => {
    const keys = Object.keys(obj);
    // Map object values to columns by position, padding/truncating to headers.
    const values = keys.map((k) => obj[k]);
    const cells = [];
    for (let ci = 0; ci < colCount; ci++) {
      cells.push(values[ci] != null ? String(values[ci]) : "");
    }

    // Choose answer column for this row.
    let answerKeyIndex = -1;
    for (const pref of ANSWER_KEY_PRIORITY) {
      const idx = keys.indexOf(pref);
      if (idx !== -1 && idx < colCount) {
        answerKeyIndex = idx;
        break;
      }
    }
    if (answerKeyIndex === -1) answerKeyIndex = colCount - 1;

    const answer = values[answerKeyIndex];
    editableCells.push({
      row: ri,
      col: answerKeyIndex,
      answer: answer != null ? String(answer) : "",
    });
    // Blank the editable cell so it renders as an input, not pre-filled text.
    cells[answerKeyIndex] = "";
    rows.push(cells);
  });

  return { headers, rows, editableCells, onComplete };
}

function normalizeAnswer(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/−/g, "-") // unicode minus → ascii hyphen
    .replace(/\s+/g, " ");
}

// Parse a numeric answer, tolerating thousands separators and a unicode minus.
// Returns null when the string isn't purely a number.
function asNumber(s) {
  const cleaned = String(s).trim().replace(/−/g, "-").replace(/,/g, "");
  if (cleaned === "" || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// A math answer matches if it's numerically equal (so "0.5"=".5", "1,000"="1000")
// or, for non-numeric answers, equal after text normalization.
function answersMatch(userVal, expected) {
  const un = asNumber(userVal);
  const en = asNumber(expected);
  if (un !== null && en !== null) return un === en;
  return normalizeAnswer(userVal) === normalizeAnswer(expected);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `
    <span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span>
    <span>${msg}</span>
  `;
  slot.innerHTML = "";
  slot.append(fb);
}
