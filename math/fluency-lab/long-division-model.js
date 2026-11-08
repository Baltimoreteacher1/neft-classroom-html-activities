// Standard-algorithm long division board (DMSB: Divide, Multiply, Subtract, Bring Down).
// Renders the bracket and checks each box as the learner types, with step dropdowns
// and vertical step-by-step descent.
// `hideAnswer` keeps every tooltip, remainder label and hint from stating a number
// the learner has not typed.
import { t } from "./i18n.js";
import { chime } from "./sounds.js";

const escapeHtml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const StandardLongDivisionModel = {
  computeSteps(dividend, divisor) {
    dividend = Math.max(1, Math.floor(Number(dividend) || 432));
    divisor = Math.max(1, Math.floor(Number(divisor) || 12));
    const digits = String(dividend).split("").map(Number);
    const quotient = Math.floor(dividend / divisor);
    const steps = [];
    let cur = 0;
    let started = false;
    for (let i = 0; i < digits.length; i++) {
      cur = cur * 10 + digits[i];
      const qDigit = Math.floor(cur / divisor);
      if (qDigit > 0 || started || i === digits.length - 1) {
        started = true;
        const prod = qDigit * divisor;
        const rem = cur - prod;
        steps.push({
          pos: i,
          digit: digits[i],
          cur,
          qDigit,
          prod,
          rem,
          nextDigit: i < digits.length - 1 ? digits[i + 1] : null,
          nextCur: i < digits.length - 1 ? rem * 10 + digits[i + 1] : null
        });
        cur = rem;
      }
    }
    return { dividend, divisor, quotient, remainder: cur, digits, steps };
  },

  renderHtml(dividend, divisor, opts = {}) {
    const { isSolver = false, hideAnswer = false } = opts;
    const { quotient, remainder, digits, steps } = this.computeSteps(dividend, divisor);
    const colPitch = 42;

    const stepOptionsHtml = steps.flatMap((st, sIdx) => {
      const opts = [];
      const divLabel = hideAnswer
        ? `Step ${sIdx + 1} (D): Divide into ${st.cur}`
        : `Step ${sIdx + 1} (D): Divide ${st.cur} ÷ ${divisor} = ${st.qDigit}`;
      const mulLabel = hideAnswer
        ? `Step ${sIdx + 1} (M): Multiply quotient digit by ${divisor}`
        : `Step ${sIdx + 1} (M): Multiply ${st.qDigit} × ${divisor} = ${st.prod}`;
      const subLabel = hideAnswer
        ? `Step ${sIdx + 1} (S): Subtract product from ${st.cur}`
        : `Step ${sIdx + 1} (S): Subtract ${st.cur} − ${st.prod} = ${st.rem}`;

      opts.push(`<option value="s${sIdx}-divide">${escapeHtml(divLabel)}</option>`);
      opts.push(`<option value="s${sIdx}-multiply">${escapeHtml(mulLabel)}</option>`);
      opts.push(`<option value="s${sIdx}-subtract">${escapeHtml(subLabel)}</option>`);
      if (st.nextDigit !== null) {
        const bdLabel = hideAnswer
          ? `Step ${sIdx + 1} (B): Bring down next digit`
          : `Step ${sIdx + 1} (B): Bring down ${st.nextDigit} to make ${st.rem * 10 + st.nextDigit}`;
        opts.push(`<option value="s${sIdx}-bringdown">${escapeHtml(bdLabel)}</option>`);
      }
      return opts;
    }).concat([
      `<option value="complete">${escapeHtml(hideAnswer ? "Complete: Check Remainder" : `Complete: Quotient ${quotient}${remainder > 0 ? ` (Remainder: ${remainder})` : ""}`)}</option>`
    ]).join("");

    return `
      <div class="ld-model-container">
        <!-- Standard Algorithm Cycle Breadcrumbs (DMSB) -->
        <div class="ld-cycle-tracker" aria-label="Standard Algorithm Cycle (DMSB)">
          <div class="ld-cycle-step is-active" data-ld-phase="divide">
            <span class="ld-cycle-icon">➗</span>
            <span class="ld-cycle-text">1. Divide (D)</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="multiply">
            <span class="ld-cycle-icon">✖️</span>
            <span class="ld-cycle-text">2. Multiply (M)</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="subtract">
            <span class="ld-cycle-icon">➖</span>
            <span class="ld-cycle-text">3. Subtract (S)</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="bringdown">
            <span class="ld-cycle-icon">⬇️</span>
            <span class="ld-cycle-text">4. Bring Down (B)</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="repeat">
            <span class="ld-cycle-icon">🔁</span>
            <span class="ld-cycle-text">5. Repeat</span>
          </div>
        </div>

        <!-- Master Step Selector Dropdown (DMSB Progression) -->
        <div class="ld-step-control-bar">
          <label for="ld-step-select" class="ld-step-select-label"><strong>Step (DMSB):</strong></label>
          <select id="ld-step-select" class="ld-step-select" aria-label="Current Long Division Step">
            ${stepOptionsHtml}
          </select>
        </div>

        <!-- The Classic Standard Algorithm Bracket Board -->
        <div class="ld-bracket-board">
          <!-- Quotient Row (above the bar) -->
          <div class="ld-row ld-row-quotient">
            <div class="ld-spacer-divisor"></div>
            <div class="ld-digits-strip">
              ${digits.map((_, idx) => {
                const s = steps.find((st) => st.pos === idx);
                if (!s) return `<div class="ld-col-box ld-col-empty"></div>`;
                const sIdx = steps.indexOf(s);
                return `
                  <div class="ld-col-box">
                    <input type="text" class="ld-cell ld-q-cell" inputmode="numeric" maxlength="1" data-ld-target="${s.qDigit}" data-ld-phase="divide" data-ld-step="${s.pos}" data-ld-step-idx="${sIdx}" placeholder="?" title="${hideAnswer ? t("Divide the divisor into this number") : `Divide: ${s.cur} ÷ ${divisor} = ${s.qDigit}`}" />
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Dividend Bracket Row -->
          <div class="ld-row ld-row-dividend">
            <div class="ld-divisor-box">${divisor}</div>
            <div class="ld-bracket-arc">)</div>
            <div class="ld-dividend-strip">
              ${digits.map((d) => `<div class="ld-col-box ld-digit-cell">${d}</div>`).join("")}
            </div>
          </div>

          <!-- Tower Work Steps (Descending Vertically) -->
          <div class="ld-tower-body">
            ${steps.map((st, sIdx) => {
              const prodStr = String(st.prod);
              const remStr = String(st.rem);
              const prodStartCol = Math.max(0, st.pos - prodStr.length + 1);
              const prodOffsetPx = prodStartCol * colPitch;
              const prodWidthPx = Math.max(42, prodStr.length * 20 + 20);
              const ruleWidthPx = Math.max(prodStr.length, (st.nextDigit !== null ? remStr.length + 1 : remStr.length)) * colPitch;
              const diffStartCol = Math.max(0, st.pos - remStr.length + 1);
              const diffOffsetPx = diffStartCol * colPitch;
              const diffWidthPx = Math.max(42, remStr.length * 20 + 20);

              return `
                <div class="ld-step-section ${sIdx === 0 ? "is-current" : "is-pending"}" data-ld-step-idx="${sIdx}">
                  <!-- Dropdown for each step in the vertical descent -->
                  <div class="ld-step-header">
                    <span class="ld-step-badge">Step ${sIdx + 1}</span>
                    <select class="ld-row-step-select" data-ld-step-idx="${sIdx}" aria-label="Step ${sIdx + 1} DMSB phase">
                      <option value="divide">➗ 1. Divide (D)</option>
                      <option value="multiply">✖️ 2. Multiply (M)</option>
                      <option value="subtract">➖ 3. Subtract (S)</option>
                      ${st.nextDigit !== null ? `<option value="bringdown">⬇️ 4. Bring Down (B)</option>` : `<option value="remainder">🏁 4. Remainder</option>`}
                    </select>
                  </div>

                  <!-- Multiply Row: − [ prod ] -->
                  <div class="ld-work-row ld-row-multiply" style="margin-left:${prodOffsetPx}px">
                    <span class="ld-sub-sign">−</span>
                    <input type="text" class="ld-cell ld-prod-cell" inputmode="numeric" style="width:${prodWidthPx}px" data-ld-target="${st.prod}" data-ld-phase="multiply" data-ld-step-idx="${sIdx}" placeholder="?" title="${hideAnswer ? t("Multiply the quotient digit by the divisor") : `Multiply: ${st.qDigit} × ${divisor} = ${st.prod}`}" />
                  </div>
                  <!-- Subtraction Rule Line -->
                  <div class="ld-rule-bar" style="margin-left:${prodOffsetPx + 16}px; width:${ruleWidthPx}px"></div>
                  <!-- Subtract & Bring Down Row -->
                  <div class="ld-work-row ld-row-diff" style="margin-left:${diffOffsetPx}px">
                    <span class="ld-spacer-sign"> </span>
                    <input type="text" class="ld-cell ld-diff-cell" inputmode="numeric" style="width:${diffWidthPx}px" data-ld-target="${st.rem}" data-ld-phase="subtract" data-ld-step-idx="${sIdx}" placeholder="?" title="${hideAnswer ? t("Subtract the product from the number above it") : `Subtract: ${st.cur} − ${st.prod} = ${st.rem}`}" />
                    ${st.nextDigit !== null ? `
                      <div class="ld-bring-indicator" title="${hideAnswer ? t("Bring down the next digit") : `Bring down next digit ${st.nextDigit}`}">
                        <span class="ld-bring-arrow">↓</span>
                        <span class="ld-bring-val">${st.nextDigit}</span>
                      </div>
                    ` : `
                      <span class="ld-rem-pill">${hideAnswer ? t("Remainder") : st.rem === 0 ? "✓ Remainder: 0" : `Remainder: ${st.rem}`}</span>
                    `}
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Bottom Action Controls & Status Banner -->
          <div style="display:flex; gap:0.5rem; justify-content:center; align-items:center; margin-top:0.75rem; flex-wrap:wrap">
            <button type="button" class="mini-tool-btn ld-btn-reveal" style="background:#fef3c7; color:#92400e; border-color:#fde68a; font-weight:700">${hideAnswer ? t("💡 Hint for the next box") : "💡 Reveal Next Step"}</button>
            <button type="button" class="mini-tool-btn ld-btn-reset">🔄 Reset</button>
          </div>

          <div class="ld-status-banner">
            <span class="ld-status-text">Follow the standard algorithm: <strong>Divide</strong> → <strong>Multiply</strong> → <strong>Subtract</strong> → <strong>Bring Down</strong> → <strong>Repeat</strong>.</span>
          </div>
        </div>

        ${isSolver ? `
          <div class="solver-calc-row" style="margin-top:0.75rem">
            <span>Full Quotient: <strong>${dividend} ÷ ${divisor} =</strong></span>
            <input type="text" class="lcm-prime-input" inputmode="numeric" data-target="${quotient}" data-group="div-final" style="width:78px" placeholder="Quotient" />
            ${remainder > 0 && !hideAnswer ? `<span style="font-size:0.9rem; font-weight:700; color:#dc2626">R ${remainder}</span>` : ""}
            <button type="button" class="outline-action" id="div-copy-ans" style="display:none">Copy to Answer</button>
          </div>
        ` : ""}
      </div>
    `;
  },

  wireEvents(container, dividend, divisor, onSolved, { hideAnswer = false } = {}) {
    if (!container) return;
    const { quotient, remainder, steps } = this.computeSteps(dividend, divisor);
    const allCells = [...container.querySelectorAll(".ld-cell")];
    const stepSections = [...container.querySelectorAll(".ld-step-section")];
    const mainStepSelect = container.querySelector(".ld-step-select");
    const rowStepSelects = [...container.querySelectorAll(".ld-row-step-select")];
    const trackerSteps = [...container.querySelectorAll(".ld-cycle-step")];
    const statusBanner = container.querySelector(".ld-status-banner");
    const revealBtn = container.querySelector(".ld-btn-reveal");
    const resetBtn = container.querySelector(".ld-btn-reset");

    const updatePhase = (phase, sIdx = 0) => {
      trackerSteps.forEach((s) => s.classList.toggle("is-active", s.dataset.ldPhase === phase));
      stepSections.forEach((sec, idx) => {
        sec.classList.toggle("is-done", idx < sIdx);
        sec.classList.toggle("is-current", idx === sIdx);
        sec.classList.toggle("is-pending", idx > sIdx);
      });
      if (mainStepSelect) {
        const targetVal = phase === "repeat" ? "complete" : `s${sIdx}-${phase}`;
        if (mainStepSelect.querySelector(`option[value="${targetVal}"]`)) {
          mainStepSelect.value = targetVal;
        }
      }
      const rowSelect = rowStepSelects[sIdx];
      if (rowSelect && ["divide", "multiply", "subtract", "bringdown"].includes(phase)) {
        rowSelect.value = phase;
      }
    };

    const checkComplete = () => {
      const allDone = allCells.every((c) => c.classList.contains("is-ok"));
      if (allDone) {
        updatePhase("repeat", steps.length - 1);
        stepSections.forEach((sec) => {
          sec.classList.remove("is-pending", "is-current");
          sec.classList.add("is-done");
        });
        if (statusBanner) {
          statusBanner.innerHTML = `<span style="color:#15803d; font-size:1.05rem; font-weight:800">🎉 Solved! ${dividend} ÷ ${divisor} = ${quotient}${remainder > 0 ? ` R ${remainder}` : ""}</span>`;
        }
        if (typeof chime === "function") chime("good");
        if (typeof onSolved === "function") onSolved({ quotient, remainder });
        return true;
      }
      return false;
    };

    // Focuses cell matching current phase and step
    const focusCurrentCell = (sIdx, phase) => {
      let cell = null;
      if (phase === "divide") {
        cell = container.querySelector(`.ld-q-cell[data-ld-step-idx="${sIdx}"]`);
      } else if (phase === "multiply") {
        cell = container.querySelector(`.ld-prod-cell[data-ld-step-idx="${sIdx}"]`);
      } else if (phase === "subtract") {
        cell = container.querySelector(`.ld-diff-cell[data-ld-step-idx="${sIdx}"]`);
      }
      if (cell) cell.focus();
    };

    // Master Dropdown change event
    mainStepSelect?.addEventListener("change", () => {
      const val = mainStepSelect.value;
      if (val === "complete") {
        checkComplete();
        return;
      }
      const match = val.match(/^s(\d+)-([a-z]+)$/);
      if (match) {
        const sIdx = Number(match[1]);
        const phase = match[2];
        updatePhase(phase, sIdx);
        focusCurrentCell(sIdx, phase);
      }
    });

    // Row Dropdown change events
    rowStepSelects.forEach((sel) => {
      sel.addEventListener("change", () => {
        const sIdx = Number(sel.dataset.ldStepIdx);
        const phase = sel.value;
        updatePhase(phase, sIdx);
        focusCurrentCell(sIdx, phase);
      });
    });

    // Input typing validation and vertical progression
    allCells.forEach((cell) => {
      cell.addEventListener("input", () => {
        const val = cell.value.trim();
        const target = cell.dataset.ldTarget;
        if (val === target) {
          cell.classList.add("is-ok");
          cell.classList.remove("is-wrong");
          if (typeof chime === "function") chime("step");

          if (!checkComplete()) {
            const nextIncomplete = allCells.find((c) => !c.classList.contains("is-ok"));
            if (nextIncomplete) {
              const nextPhase = nextIncomplete.dataset.ldPhase;
              const nextSIdx = Number(nextIncomplete.dataset.ldStepIdx ?? 0);
              updatePhase(nextPhase, nextSIdx);
              nextIncomplete.focus();
            }
          }
        } else if (val.length >= target.length) {
          cell.classList.remove("is-ok");
          cell.classList.add("is-wrong");
        } else {
          cell.classList.remove("is-ok");
          cell.classList.remove("is-wrong");
        }
      });
    });

    // Hint / Ask Next
    const askNext = (cell) => {
      const sIdx = Number(cell.dataset.ldStepIdx ?? 0);
      const step = steps[sIdx];
      const phase = cell.dataset.ldPhase;
      const text =
        phase === "divide"
          ? t("How many times does {divisor} fit into {cur}? Type that digit above the bar.", { divisor, cur: step?.cur })
          : phase === "multiply"
            ? t("Multiply the digit you just wrote above the bar by {divisor}.", { divisor })
            : t("Subtract the product from {cur}. Type what is left.", { cur: step?.cur });
      updatePhase(phase, sIdx);
      if (statusBanner) statusBanner.innerHTML = `<span class="ld-status-text">${escapeHtml(text)}</span>`;
      cell.focus();
    };

    revealBtn?.addEventListener("click", () => {
      const incomplete = allCells.find((c) => !c.classList.contains("is-ok"));
      if (incomplete && hideAnswer) askNext(incomplete);
      else if (incomplete) {
        incomplete.value = incomplete.dataset.ldTarget;
        incomplete.classList.add("is-ok");
        incomplete.classList.remove("is-wrong");
        if (typeof chime === "function") chime("step");
        if (!checkComplete()) {
          const next = allCells.find((c) => !c.classList.contains("is-ok"));
          if (next) {
            const nextPhase = next.dataset.ldPhase;
            const nextSIdx = Number(next.dataset.ldStepIdx ?? 0);
            updatePhase(nextPhase, nextSIdx);
            next.focus();
          }
        }
      }
    });

    resetBtn?.addEventListener("click", () => {
      allCells.forEach((c) => {
        c.value = "";
        c.classList.remove("is-ok", "is-wrong");
      });
      updatePhase("divide", 0);
      if (statusBanner) {
        statusBanner.innerHTML = `<span class="ld-status-text">Follow the standard algorithm: <strong>Divide</strong> → <strong>Multiply</strong> → <strong>Subtract</strong> → <strong>Bring Down</strong> → <strong>Repeat</strong>.</span>`;
      }
      if (allCells.length > 0) allCells[0].focus();
    });
  }
};
