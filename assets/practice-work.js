/* ==========================================================================
 * practice-work.js — Interactive client layer for small-group practice sets
 *
 * Turns generated static practice pages into interactive, autosaving,
 * multimodal digital practice sets without altering printed geometry.
 *
 * Excludes Unit 1 and Unit 10 per instructional design directives.
 * ========================================================================== */

(() => {
  "use strict";

  // Only run on student practice sets with .sp-page
  if (
    document.documentElement.dataset.supportAudience === "teacher" ||
    !document.querySelector(".sp-page") ||
    document.querySelector("[data-practice-work-mounted]")
  ) {
    return;
  }

  // Strict exclusion of Unit 1 and Unit 10 per user requirement
  const lessonId = document.documentElement.getAttribute("data-ewl-supports-lesson") || "";
  const unitMatch = lessonId.match(/^(\d+)-/);
  if (unitMatch) {
    const unitNum = parseInt(unitMatch[1], 10);
    if (unitNum === 1 || unitNum === 10) {
      return; // Leave Unit 1 and Unit 10 completely untouched
    }
  }

  document.documentElement.setAttribute("data-practice-work-mounted", "true");

  const STORAGE_KEY = `ewl_practice_${lessonId || "anon"}`;
  let store = { answers: {}, choices: {}, ratings: {}, cloze: {}, canvas: null };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) store = { ...store, ...JSON.parse(raw) };
  } catch (_e) {
    // localStorage not accessible
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      updateStatus("✓ Saved");
    } catch (_e) {}
  }

  function updateStatus(text) {
    const el = document.getElementById("sp-save-indicator");
    if (el) el.textContent = text;
  }

  function handleReset() {
    if (window.confirm("Are you sure you want to clear your saved answers on this sheet?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_e) {}
      window.location.reload();
    }
  }

  /* ---- 1. Top Classroom Toolbar ---- */
  function mountToolbar() {
    const existing = document.querySelector(".sp-work-toolbar");
    if (existing) {
      const scratchBtn = existing.querySelector("#sp-scratchpad-btn");
      if (scratchBtn) scratchBtn.onclick = toggleScratchpad;
      const toolsBtn = existing.querySelector("#sp-tools-btn");
      if (toolsBtn) toolsBtn.onclick = toggleMathTools;
      const resetBtn = existing.querySelector("#sp-reset-btn");
      if (resetBtn) resetBtn.onclick = handleReset;
      return;
    }

    const firstPage = document.querySelector(".sp-page");
    if (!firstPage) return;

    const toolbar = document.createElement("aside");
    toolbar.className = "sp-work-toolbar";
    toolbar.setAttribute("aria-label", "Practice sheet tools");

    const left = document.createElement("div");
    left.className = "sp-toolbar-title";
    left.innerHTML = `<span>✏️ Interactive Practice Lab</span> · <span id="sp-save-indicator" class="sp-save-status">● Saved locally</span>`;

    const actions = document.createElement("div");
    actions.className = "sp-toolbar-actions";

    // Print Completed Work button
    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "sp-tool-btn sp-tool-btn--accent";
    printBtn.innerHTML = "🖨️ Print My Work";
    printBtn.title = "Print sheet with your typed answers included";
    printBtn.addEventListener("click", () => window.print());

    // Scratchpad button
    const scratchBtn = document.createElement("button");
    scratchBtn.type = "button";
    scratchBtn.className = "sp-tool-btn";
    scratchBtn.id = "sp-scratchpad-btn";
    scratchBtn.innerHTML = "✏️ Scratchpad";
    scratchBtn.title = "Open drawing canvas for math scratch work";
    scratchBtn.addEventListener("click", toggleScratchpad);

    // Math Reference Tools button
    const toolsBtn = document.createElement("button");
    toolsBtn.type = "button";
    toolsBtn.className = "sp-tool-btn";
    toolsBtn.id = "sp-tools-btn";
    toolsBtn.innerHTML = "📐 Math Tools";
    toolsBtn.title = "Multiplication table and fraction references";
    toolsBtn.addEventListener("click", toggleMathTools);

    // Reset button
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "sp-tool-btn";
    resetBtn.id = "sp-reset-btn";
    resetBtn.innerHTML = "🔄 Reset";
    resetBtn.title = "Clear saved work and start fresh";
    resetBtn.addEventListener("click", handleReset);

    actions.append(printBtn, scratchBtn, toolsBtn, resetBtn);
    toolbar.append(left, actions);
    firstPage.parentNode.insertBefore(toolbar, firstPage);
  }

  /* ---- 2. Audio Read-Aloud (Text-to-Speech) ---- */
  function speakText(text, btn) {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll(".sp-tts-btn").forEach((b) => b.classList.remove("is-speaking"));
      if (btn.classList.contains("is-speaking")) return;
    }
    const clean = text.replace(/___+/g, "blank").trim();
    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.92;
    utter.pitch = 1.0;
    utter.onstart = () => btn.classList.add("is-speaking");
    utter.onend = () => btn.classList.remove("is-speaking");
    utter.onerror = () => btn.classList.remove("is-speaking");

    window.speechSynthesis.speak(utter);
  }

  function createTtsButton(textToRead) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sp-tts-btn";
    btn.setAttribute("aria-label", "Read aloud");
    btn.innerHTML = "🔊 Listen";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      speakText(textToRead, btn);
    });
    return btn;
  }

  /* ---- 3. Interactive Multiple Choice Options ---- */
  function setupMultipleChoice() {
    const optLists = document.querySelectorAll(".sp-opts");
    optLists.forEach((list, listIndex) => {
      const opts = list.querySelectorAll(".sp-opt");
      const savedChoice = store.choices[listIndex];

      opts.forEach((opt, optIndex) => {
        opt.setAttribute("tabindex", "0");
        if (savedChoice === optIndex) opt.classList.add("is-selected");

        const selectOpt = () => {
          opts.forEach((o) => {
            o.classList.remove("is-selected");
          });
          opt.classList.add("is-selected");
          store.choices[listIndex] = optIndex;
          saveStore();
        };

        opt.addEventListener("click", selectOpt);
        opt.addEventListener("keydown", (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            selectOpt();
          }
        });
      });
    });
  }

  /* ---- 4. Interactive Written Reasoning Fields ---- */
  function setupWrittenInputs() {
    const lineBlocks = document.querySelectorAll(".sp-lines");
    lineBlocks.forEach((lines, index) => {
      let wrap = lines.previousElementSibling;
      let textarea =
        wrap && wrap.classList && wrap.classList.contains("sp-digital-input-wrap")
          ? wrap.querySelector(".sp-digital-input")
          : null;

      if (!textarea) {
        wrap = document.createElement("div");
        wrap.className = "sp-digital-input-wrap";
        textarea = document.createElement("textarea");
        textarea.className = "sp-digital-input";
        textarea.rows = 2;
        textarea.placeholder = "Type your explanation or thinking here...";
        wrap.appendChild(textarea);
        lines.parentNode.insertBefore(wrap, lines);
      }

      textarea.value = store.answers[index] || "";
      textarea.addEventListener("input", () => {
        store.answers[index] = textarea.value;
        saveStore();
      });
    });

    // Also support "Show your work" boxes
    const workBoxes = document.querySelectorAll(".sp-work");
    workBoxes.forEach((box, index) => {
      const boxKey = `work_${index}`;
      let textarea = box.querySelector(".sp-digital-input");

      if (!textarea) {
        const wrap = document.createElement("div");
        wrap.className = "sp-digital-input-wrap";
        textarea = document.createElement("textarea");
        textarea.className = "sp-digital-input";
        textarea.rows = 3;
        textarea.placeholder =
          "Write your calculation steps or reasoning here (or use Scratchpad)...";
        wrap.appendChild(textarea);
        box.appendChild(wrap);
      }

      textarea.value = store.answers[boxKey] || "";
      textarea.addEventListener("input", () => {
        store.answers[boxKey] = textarea.value;
        saveStore();
      });
    });
  }

  /* ---- 5. Interactive Cloze Blanks & Word Bank ---- */
  function setupClozeAndWordBank() {
    const blanks = document.querySelectorAll(".sp-cloze-blank");
    blanks.forEach((blank, index) => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "sp-cloze-input";
      input.placeholder = "blank";
      input.value = store.cloze[index] || "";
      input.addEventListener("input", () => {
        store.cloze[index] = input.value;
        saveStore();
      });
      blank.replaceWith(input);
    });

    // Clicking a word bank chip fills the first empty cloze input
    const chips = document.querySelectorAll(".sp-bank-chips li");
    chips.forEach((chip) => {
      chip.title = "Click to place into next empty blank";
      chip.addEventListener("click", () => {
        const text = chip.textContent.trim();
        const inputs = Array.from(document.querySelectorAll(".sp-cloze-input"));
        const empty = inputs.find((i) => !i.value.trim()) || inputs[0];
        if (empty) {
          empty.value = text;
          empty.dispatchEvent(new Event("input"));
          empty.focus();
        }
      });
    });
  }

  /* ---- 6. Interactive Part 4 Self-Assessment Table ---- */
  function setupSelfCheckTable() {
    const table = document.querySelector(".sp-check table");
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll("td")).slice(1); // Not yet, Getting there, Got it
      const savedRating = store.ratings[rowIndex];

      cells.forEach((cell, cellIndex) => {
        const ratingVal = cellIndex + 1; // 1, 2, or 3
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sp-rating-check-btn";
        btn.setAttribute("aria-label", `Rate ${ratingVal} of 3`);
        btn.textContent = "✓";
        if (savedRating === ratingVal) btn.classList.add("is-checked");

        const selectRating = () => {
          row
            .querySelectorAll(".sp-rating-check-btn")
            .forEach((b) => b.classList.remove("is-checked"));
          btn.classList.add("is-checked");
          store.ratings[rowIndex] = ratingVal;
          saveStore();
          updateSelfCheckSummary();
        };

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          selectRating();
        });
        cell.replaceChildren(btn);
        cell.addEventListener("click", selectRating);
      });
    });

    // Create live summary indicator
    const summary = document.createElement("div");
    summary.id = "sp-self-check-summary";
    summary.className = "sp-check-summary";
    table.parentNode.appendChild(summary);
    updateSelfCheckSummary();
  }

  function updateSelfCheckSummary() {
    const summary = document.getElementById("sp-self-check-summary");
    if (!summary) return;
    const ratings = Object.values(store.ratings);
    if (!ratings.length) {
      summary.textContent = "Rate your confidence above to see your next steps.";
      return;
    }
    const gotIt = ratings.filter((r) => r === 3).length;
    const total = document.querySelectorAll(".sp-check table tbody tr").length || 3;
    if (gotIt === total) {
      summary.textContent = `🌟 Full confidence (${gotIt}/${total} Got it) — You are ready for the challenge extension!`;
    } else {
      summary.textContent = `📋 Progress noted: ${gotIt}/${total} fully mastered. Discuss the remaining items in your next small group.`;
    }
  }

  /* ---- 7. Audio Buttons on Stems & Model ---- */
  function setupTtsButtons() {
    // Stems
    document.querySelectorAll(".sp-stem").forEach((stem) => {
      let btn = stem.querySelector(".sp-tts-btn");
      if (!btn) {
        btn = createTtsButton(stem.textContent);
        stem.appendChild(btn);
      } else {
        btn.onclick = (e) => {
          e.stopPropagation();
          speakText(stem.textContent, btn);
        };
      }
    });

    // Model Header
    const modelH = document.querySelector(".sp-model-h");
    if (modelH) {
      let btn = modelH.querySelector(".sp-tts-btn");
      const stepsText = Array.from(document.querySelectorAll(".sp-model-steps li"))
        .map((li, i) => `Step ${i + 1}: ${li.textContent}`)
        .join(". ");
      const textToRead = `${modelH.textContent}. ${stepsText}`;
      if (!btn) {
        btn = createTtsButton(textToRead);
        modelH.appendChild(btn);
      } else {
        btn.onclick = (e) => {
          e.stopPropagation();
          speakText(textToRead, btn);
        };
      }
    }
  }

  /* ---- 8. Scaffolded Hint Ladder (`💡 Hint`) ---- */
  function setupHintLadders() {
    const tasks = document.querySelectorAll(".sp-task");
    tasks.forEach((task) => {
      const stem = task.querySelector(".sp-stem");
      if (!stem) return;

      let hintBtn = stem.querySelector(".sp-hint-btn");
      let ladder = task.querySelector(".sp-hint-ladder");

      if (!ladder) {
        const frameText = task.querySelector(".sp-frame")?.textContent || "";
        ladder = document.createElement("div");
        ladder.className = "sp-hint-ladder";
        ladder.innerHTML = `
        <div class="sp-hint-step"><span class="sp-hint-badge">Step 1 · Anchor</span><span>Look back at the Worked Model in Part 1. Does the problem match Example 1?</span></div>
        ${frameText ? `<div class="sp-hint-step"><span class="sp-hint-badge">Step 2 · Sentence</span><span>Use this frame: <em>${frameText}</em></span></div>` : ""}
        <div class="sp-hint-step"><span class="sp-hint-badge">Step 3 · Self-Check</span><span>Ask yourself: What rule decides which answer is right?</span></div>
      `;
        stem.parentNode.insertBefore(ladder, stem.nextSibling);
      }

      if (!hintBtn) {
        hintBtn = document.createElement("button");
        hintBtn.type = "button";
        hintBtn.className = "sp-hint-btn";
        hintBtn.innerHTML = "💡 Hint";
        hintBtn.title = "View step-by-step thinking guidance";
        stem.appendChild(hintBtn);
      }

      hintBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = ladder.classList.toggle("is-open");
        hintBtn.innerHTML = isOpen ? "💡 Close Hint" : "💡 Hint";
      };
    });
  }

  /* ---- 9. Digital Math Scratchpad Modal ---- */
  let scratchpadMounted = false;
  let canvas,
    ctx,
    isDrawing = false;

  function setupScratchpad() {
    if (scratchpadMounted) return;
    scratchpadMounted = true;

    const modal = document.createElement("aside");
    modal.id = "sp-scratchpad-modal";
    modal.className = "sp-scratchpad-modal";
    modal.innerHTML = `
      <div class="sp-scratchpad-header">
        <div class="sp-scratchpad-title">✏️ Math Scratchpad &amp; Whiteboard</div>
        <div class="sp-scratchpad-tools">
          <button type="button" class="sp-tool-btn" id="sp-scratch-clear">Clear</button>
          <button type="button" class="sp-tool-btn" id="sp-scratch-close">✕</button>
        </div>
      </div>
      <div class="sp-scratchpad-body">
        <canvas class="sp-scratchpad-canvas" id="sp-scratchpad-canvas"></canvas>
      </div>
    `;
    document.body.appendChild(modal);

    canvas = document.getElementById("sp-scratchpad-canvas");
    ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (store.canvas) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = store.canvas;
        }
      }
    };

    window.addEventListener("resize", resizeCanvas);

    // Pointer events for drawing
    canvas.addEventListener("pointerdown", (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    });
    const stopDrawing = () => {
      if (isDrawing) {
        isDrawing = false;
        try {
          store.canvas = canvas.toDataURL();
          saveStore();
        } catch (_e) {}
      }
    };
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointerleave", stopDrawing);

    document.getElementById("sp-scratch-clear").addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      store.canvas = null;
      saveStore();
    });
    document.getElementById("sp-scratch-close").addEventListener("click", toggleScratchpad);
  }

  function toggleScratchpad() {
    setupScratchpad();
    const modal = document.getElementById("sp-scratchpad-modal");
    if (!modal) return;
    const isOpen = modal.classList.toggle("is-open");
    if (isOpen && canvas) {
      setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (store.canvas) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = store.canvas;
        }
      }, 50);
    }
  }

  /* ---- 10. Math Reference Tools Modal ---- */
  function setupMathTools() {
    const backdrop = document.createElement("div");
    backdrop.id = "sp-modal-backdrop";
    backdrop.className = "sp-modal-backdrop";
    backdrop.addEventListener("click", toggleMathTools);

    const modal = document.createElement("dialog");
    modal.id = "sp-reference-modal";
    modal.className = "sp-reference-modal";
    modal.innerHTML = `
      <div class="sp-scratchpad-header">
        <div class="sp-scratchpad-title">📐 Quick Math References</div>
        <button type="button" class="sp-tool-btn" id="sp-tools-close">✕</button>
      </div>
      <div class="sp-reference-body">
        <h3 style="margin:0 0 8px;color:#0f172a;">Multiplication Fact Grid (1–12)</h3>
        <div style="overflow-x:auto;">
          <table style="border-collapse:collapse;width:100%;font-size:11.5px;text-align:center;">
            <thead>
              <tr style="background:#e2e8f0;font-weight:700;">
                <th style="border:1px solid #cbd5e1;padding:4px;">×</th>
                ${Array.from({ length: 12 }, (_, i) => `<th style="border:1px solid #cbd5e1;padding:4px;">${i + 1}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${Array.from(
                { length: 12 },
                (_, r) => `
                <tr>
                  <th style="background:#e2e8f0;border:1px solid #cbd5e1;padding:4px;font-weight:700;">${r + 1}</th>
                  ${Array.from({ length: 12 }, (_, c) => `<td style="border:1px solid #cbd5e1;padding:4px;background:${r === c ? "#fef3c7" : "transparent"}">${(r + 1) * (c + 1)}</td>`).join("")}
                </tr>
              `,
              ).join("")}
            </tbody>
          </table>
        </div>
        <h3 style="margin:16px 0 8px;color:#0f172a;">Key Vocabulary Reminders</h3>
        <p style="margin:4px 0;font-size:12.5px;">• <b>Statistical Question:</b> A question with answers that vary.</p>
        <p style="margin:4px 0;font-size:12.5px;">• <b>Non-Statistical Question:</b> A question with only one fixed answer.</p>
        <p style="margin:4px 0;font-size:12.5px;">• <b>Volume:</b> Length × Width × Height (or Base Area × Height).</p>
      </div>
    `;

    document.body.append(backdrop, modal);
    document.getElementById("sp-tools-close").addEventListener("click", toggleMathTools);
  }

  function toggleMathTools() {
    let modal = document.getElementById("sp-reference-modal");
    let backdrop = document.getElementById("sp-modal-backdrop");
    if (!modal) {
      setupMathTools();
      modal = document.getElementById("sp-reference-modal");
      backdrop = document.getElementById("sp-modal-backdrop");
    }
    const isOpen = modal.classList.toggle("is-open");
    backdrop.classList.toggle("is-open", isOpen);
  }

  /* ---- Initialize all enhancements ---- */
  function init() {
    mountToolbar();
    setupMultipleChoice();
    setupWrittenInputs();
    setupClozeAndWordBank();
    setupSelfCheckTable();
    setupTtsButtons();
    setupHintLadders();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
