export function renderFillTable(container, config) {
  // Normalize non-standard authoring shapes into the standard
  // { headers, rows (array of arrays), editableCells:[{row,col,answer}] }
  // shape this component renders. Some lesson configs author fill-tables as
  // { columns:[...], items|rows:[{key:value,...}] } where each row is an
  // object whose values map positionally to `columns`. Without this adapter
  // those tables render blank (missing headers/rows/editableCells).
  const { headers, rows, editableCells, onComplete } =
    normalizeFillTable(config);

  const wrapper = document.createElement("div");
  wrapper.className = "card";

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
  table.className = "vocab-table";
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

  rows.forEach((row, ri) => {
    const tr = document.createElement("tr");
    row.forEach((cell, ci) => {
      const td = document.createElement("td");
      const cellKey = `${ri}-${ci}`;
      const editable = editableCells.find((e) => e.row === ri && e.col === ci);

      if (editable) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "text-input";
        input.style.cssText =
          "padding:6px 8px; font-size:0.9rem; width:100%; min-width:60px;";
        input.placeholder = "?";
        input.setAttribute("aria-label", `${headers[ci]} for row ${ri + 1}`);
        input.dataset.answer = String(editable.answer);
        input.dataset.key = cellKey;
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
      const expected = input.dataset.answer;
      const isMatch = normalizeAnswer(userVal) === normalizeAnswer(expected);

      input.style.borderColor = isMatch ? "var(--success)" : "var(--error)";
      input.style.background = isMatch
        ? "var(--success-bg)"
        : "var(--error-bg)";

      if (isMatch) {
        correct++;
        input.readOnly = true;
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
  return String(s).trim().toLowerCase().replace(/\s+/g, " ");
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
