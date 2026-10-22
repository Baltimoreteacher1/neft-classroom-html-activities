// Standard-algorithm long division board: renders the bracket and checks each box as the learner types.
// `hideAnswer` (set while the problem is still being worked) keeps every tooltip, remainder label and hint
// from stating a number the learner has not typed; the hint button then asks the next question instead.
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
          nextDigit: i < digits.length - 1 ? digits[i + 1] : null
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

    return `
      <div class="ld-model-container">
        <!-- Standard Algorithm Cycle Breadcrumbs -->
        <div class="ld-cycle-tracker" aria-label="Standard Algorithm Cycle">
          <div class="ld-cycle-step is-active" data-ld-phase="divide">
            <span class="ld-cycle-icon">➗</span>
            <span class="ld-cycle-text">1. Divide</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="multiply">
            <span class="ld-cycle-icon">✖️</span>
            <span class="ld-cycle-text">2. Multiply</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="subtract">
            <span class="ld-cycle-icon">➖</span>
            <span class="ld-cycle-text">3. Subtract</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="bringdown">
            <span class="ld-cycle-icon">⬇️</span>
            <span class="ld-cycle-text">4. Bring Down</span>
          </div>
          <span class="ld-cycle-arrow">→</span>
          <div class="ld-cycle-step" data-ld-phase="repeat">
            <span class="ld-cycle-icon">🔁</span>
            <span class="ld-cycle-text">5. Repeat / Remainder</span>
          </div>
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
                return `
                  <div class="ld-col-box">
                    <input type="text" class="ld-cell ld-q-cell" inputmode="numeric" maxlength="1" data-ld-target="${s.qDigit}" data-ld-phase="divide" data-ld-step="${s.pos}" placeholder="?" title="Divide: Enter quotient digit for column ${idx + 1}" />
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

          <!-- Tower Work Steps -->
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
                <div class="ld-step-section" data-ld-step-idx="${sIdx}">
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
                      <div class="ld-bring-indicator" title="Bring down next digit ${st.nextDigit}">
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
    const trackerSteps = [...container.querySelectorAll(".ld-cycle-step")];
    const statusBanner = container.querySelector(".ld-status-banner");
    const revealBtn = container.querySelector(".ld-btn-reveal");
    const resetBtn = container.querySelector(".ld-btn-reset");

    const updatePhase = (phase) => {
      trackerSteps.forEach((s) => s.classList.toggle("is-active", s.dataset.ldPhase === phase));
    };

    const checkComplete = () => {
      const allDone = allCells.every((c) => c.classList.contains("is-ok"));
      if (allDone) {
        updatePhase("repeat");
        if (statusBanner) {
          statusBanner.innerHTML = `<span style="color:#15803d; font-size:1.05rem; font-weight:800">🎉 Solved! ${dividend} ÷ ${divisor} = ${quotient}${remainder > 0 ? ` R ${remainder}` : ""}</span>`;
        }
        if (typeof chime === "function") chime("good");
        if (typeof onSolved === "function") onSolved({ quotient, remainder });
        return true;
      }
      return false;
    };

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
              updatePhase(nextIncomplete.dataset.ldPhase);
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

    // While the problem is still being worked, the hint asks the next question and fills nothing in.
    const askNext = (cell) => {
      const step = steps[Number(cell.dataset.ldStepIdx ?? steps.findIndex((st) => st.pos === Number(cell.dataset.ldStep)))];
      const phase = cell.dataset.ldPhase;
      const text =
        phase === "divide"
          ? t("How many times does {divisor} fit into {cur}? Type that digit above the bar.", { divisor, cur: step?.cur })
          : phase === "multiply"
            ? t("Multiply the digit you just wrote above the bar by {divisor}.", { divisor })
            : t("Subtract the product from {cur}. Type what is left.", { cur: step?.cur });
      updatePhase(phase);
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
            updatePhase(next.dataset.ldPhase);
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
      updatePhase("divide");
      if (statusBanner) {
        statusBanner.innerHTML = `<span class="ld-status-text">Follow the standard algorithm: <strong>Divide</strong> → <strong>Multiply</strong> → <strong>Subtract</strong> → <strong>Bring Down</strong> → <strong>Repeat</strong>.</span>`;
      }
      if (allCells.length > 0) allCells[0].focus();
    });
  }
};
