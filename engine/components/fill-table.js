export function renderFillTable(
  container,
  { headers, rows, editableCells, onComplete },
) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

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
