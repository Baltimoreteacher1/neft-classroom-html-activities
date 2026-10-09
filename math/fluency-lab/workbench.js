import { createWorkbenchState, isWholeText } from "./workbench-state.js";
import { parseProblem } from "./workbench-parse.js";
import { renderInlineProblemModel } from "./visual-lab.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const TOOLS = [
  ["model", "💡 Problem Model"],
  ["counters", "🔵 Ten-Frames"],
  ["numberline", "📏 Number Line"],
  ["fractions", "🍰 Fraction Strips"],
  ["array", "🔲 Area Model"],
  ["integers", "➕➖ Zero Pairs"],
  ["balance", "⚖️ Balance Scale"],
];

const ENTRY_EXAMPLES = "e.g. 15 + 8, 34 - 18, 6 x 8, 3/4, -4 + 7, 2x + 4 = 12";
const ENTRY_HELP = "Try 15 + 8, 34 - 18, 6 x 8, 3/4, -4 + 7 or 2x + 4 = 12.";

export function mountWorkbench(container, { skill, item, onSelectTool } = {}) {
  container.classList.add("interactive-math-workbench");

  const wb = createWorkbenchState();
  let entryText = "";
  let entryMsg = "";
  let hint = "";

  wb.resetToItem(item);

  function setAnswerInput(val) {
    const input = document.querySelector("#answer-input");
    if (input) {
      input.value = String(val);
      input.focus();
    }
  }

  // Every value the student can type is a data-field input: wb.fields holds its range,
  // so a number is applied live while it is in range and clamped when they leave the box.
  function numField(name, label, { bare = false } = {}) {
    const spec = wb.fields[name];
    const [lo, hi] = spec.range();
    const text = bare ? "" : `<span>${label}</span>`;
    return `<label class="num-field">${text}<input type="text" class="mini-num-input" data-field="${name}" data-focus-key="${name}" inputmode="${spec.signed ? "text" : "numeric"}" autocomplete="off" value="${spec.get()}" aria-label="${esc(label)}, ${lo} to ${hi}" title="${esc(label)} (${lo} to ${hi})"/></label>`;
  }

  function render() {
    const active = container.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = active?.dataset?.focusKey;
    const tool = wb.state.tool;
    container.innerHTML = `
      <div class="workbench-bar">
        <div class="workbench-header-row">
          <div class="workbench-titles">
            <span class="workbench-title">✨ Interactive Visual Manipulatives</span>
            <span class="workbench-subtitle">Experiment, build models, and test your thinking:</span>
          </div>
        </div>
        <div class="workbench-entry">
          <label class="workbench-entry-label" for="wb-problem-input">Type any problem or numbers:</label>
          <div class="workbench-entry-row">
            <input id="wb-problem-input" type="text" class="workbench-entry-input" data-focus-key="wb-entry" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="${ENTRY_EXAMPLES}" value="${esc(entryText)}" title="${ENTRY_HELP}"/>
            <button type="button" class="mini-tool-btn entry-btn" data-entry="model" data-focus-key="wb-model">🔍 Model this</button>
            <button type="button" class="mini-tool-btn entry-btn" data-entry="reset" data-focus-key="wb-reset">↺ Reset to problem</button>
          </div>
          <p class="workbench-entry-msg" role="status" aria-live="polite">${esc(entryMsg)}</p>
        </div>
        <div class="workbench-tabs" role="tablist" aria-label="Interactive math tools">
          ${TOOLS.map(([id, label]) => `<button type="button" class="tool-tab ${tool === id ? "active" : ""}" data-tool="${id}" data-focus-key="tab-${id}" role="tab" aria-selected="${tool === id}">${label}</button>`).join("")}
        </div>
      </div>
      <div class="workbench-body">
        ${renderActiveTool()}
        <p class="workbench-hint" role="status" aria-live="polite">${esc(hint)}</p>
      </div>
    `;
    attachEvents();
    if (focusKey) {
      const el = container.querySelector(`[data-focus-key="${focusKey}"]`);
      el?.focus();
      if (el?.type === "text") el.setSelectionRange(el.value.length, el.value.length);
    }
  }

  function renderActiveTool() {
    const s = wb.state;
    const renderers = {
      model: renderModel,
      counters: renderCounters,
      numberline: renderNumberline,
      fractions: renderFractions,
      array: renderArray,
      integers: renderIntegers,
      balance: renderBalance,
    };
    return renderers[s.tool]?.(s) ?? "";
  }

  function renderModel() {
    const modelHtml = renderInlineProblemModel(skill, item);
    return `
      <div class="tool-canvas tool-model-canvas">
        <p class="tool-instruction">Target visual model for <strong>${esc(item?.question || "")}</strong>:</p>
        <div class="tool-render-area">${modelHtml || "<p>No picture is drawn for this problem. Try the number line, counters, or array tools to build your own.</p>"}</div>
      </div>
    `;
  }

  function renderCounters(s) {
    const { total, cells } = s.counters;
    const count = wb.filled();
    const { a, b } = wb.counts();
    const taken = cells.size - count;
    const cellKinds = {
      a: ["filled", "●", "filled"],
      b: ["filled part-b", "●", "filled (part B)"],
      x: ["removed", "✕", "taken away"],
    };
    return `
      <div class="tool-canvas tool-counters-canvas">
        <div class="tool-controls-row">
          <span><strong>Ten-Frame Manipulative:</strong> Tap any space to add or remove a counter.</span>
          <div class="tool-button-group">
            <button type="button" class="mini-tool-btn" data-counter-action="add5">+5 counters</button>
            <button type="button" class="mini-tool-btn" data-counter-action="fill10">Fill 10</button>
            <button type="button" class="mini-tool-btn" data-counter-action="fill20">Fill 20</button>
            <button type="button" class="mini-tool-btn danger" data-counter-action="clear">Clear</button>
            <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${count}">📥 Use ${count} as Answer</button>
          </div>
        </div>
        <div class="tool-inputs-row">
          ${numField("counters-total", "Set counters:")}
          <span class="inputs-or" aria-hidden="true">or</span>
          ${numField("counters-a", "Part A:")}
          <span class="inputs-op" aria-hidden="true">+</span>
          ${numField("counters-b", "Part B:")}
        </div>
        <div class="interactive-counter-board" role="group" aria-label="Ten-frame counters">
          ${Array.from({ length: total }, (_, i) => {
            const [cls, glyph, word] = cellKinds[cells.get(i)] ?? ["", "○", "empty"];
            return `<button type="button" class="interactive-counter-cell ${cls}" data-cell="${i}" aria-label="Space ${i + 1}, ${word}"><span aria-hidden="true">${glyph}</span></button>`;
          }).join("")}
        </div>
        <p class="counter-tally-readout"><strong>Count:</strong> <span class="tally-num">${count}</span> counters placed${b > 0 ? ` (${a} + ${b})` : ""}${taken > 0 ? ` · ${taken} taken away` : ""} · <strong>${total - cells.size}</strong> spaces open</p>
      </div>
    `;
  }

  function renderNumberline(s) {
    const { start, jumps, draft } = s.numberline;
    const current = wb.nlCurrent();
    const points = [start];
    let running = start;
    for (const j of jumps) {
      running += j;
      points.push(running);
    }
    const minVal = Math.min(...points, start - 5);
    const maxVal = Math.max(...points, start + 25);
    const span = Math.max(10, maxVal - minVal);
    const scaleX = (val) => 40 + ((val - minVal) / span) * 460;

    const marksSvg = [...new Set(points)]
      .map((val) => {
        const x = scaleX(val);
        return `<path d="M${x},135 v12" stroke="#17345f" stroke-width="2"/><text x="${x}" y="165" font-size="12" text-anchor="middle" fill="#14253d" font-weight="600">${val}</text>`;
      })
      .join("");

    const jumpsSvg = jumps
      .map((jump, i) => {
        const x1 = scaleX(points[i]);
        const x2 = scaleX(points[i + 1]);
        const midX = (x1 + x2) / 2;
        const peakY = 50 - (i % 3) * 10;
        return `
          <path d="M${x1},135 Q${midX},${peakY} ${x2},135" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
          <text x="${midX}" y="${peakY - 5}" font-size="12" text-anchor="middle" fill="#1e40af" font-weight="bold">${jump >= 0 ? "+" : ""}${jump}</text>
        `;
      })
      .join("");

    const quick = [1, 5, 10, 25, -1, -5, -10];
    return `
      <div class="tool-canvas tool-numberline-canvas">
        <div class="tool-controls-row">
          <span><strong>Interactive Number Line:</strong> Click jumps to count on or jump back.</span>
          <div class="tool-button-group">
            ${quick.map((j) => `<button type="button" class="mini-tool-btn" data-jump="${j}">${j > 0 ? "+" : "−"}${Math.abs(j)}</button>`).join("")}
            <button type="button" class="mini-tool-btn danger" data-jump-action="reset">Reset</button>
            <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${current}">📥 Use ${current} as Answer</button>
          </div>
        </div>
        <div class="tool-inputs-row">
          ${numField("nl-start", "Start at:")}
          <label class="num-field"><span>Jump by:</span><input type="text" class="mini-num-input" id="wb-jump-input" data-focus-key="nl-jump" inputmode="text" autocomplete="off" placeholder="e.g. 7 or -3" value="${esc(draft)}" aria-label="Jump by (positive counts on, negative jumps back)"/></label>
          <button type="button" class="mini-tool-btn" data-jump-action="add" data-focus-key="nl-add">+ Add Jump</button>
        </div>
        <div class="numberline-svg-wrap">
          <svg class="numberline-svg" viewBox="0 0 540 180" role="img" aria-label="Interactive Number Line from ${minVal} to ${maxVal}">
            <line x1="20" y1="140" x2="520" y2="140" stroke="#8295ad" stroke-width="3" stroke-linecap="round"/>
            <polygon points="522,140 514,135 514,145" fill="#8295ad"/>
            <polygon points="18,140 26,135 26,145" fill="#8295ad"/>
            ${marksSvg}
            ${jumpsSvg}
          </svg>
        </div>
        <p class="numberline-readout"><strong>Start:</strong> ${start} ➔ <strong>Jumps:</strong> [${jumps.map((j) => (j >= 0 ? `+${j}` : j)).join(", ") || "none"}] ➔ <strong>Current Position:</strong> <span class="tally-num">${current}</span></p>
      </div>
    `;
  }

  function renderFractions(s) {
    const f = s.fractions;
    return `
      <div class="tool-canvas tool-fractions-canvas">
        <div class="tool-controls-row">
          <span><strong>Interactive Fraction Strips:</strong> Tap pieces to shade/unshade and compare parts of the same whole.</span>
          <button type="button" class="mini-tool-btn danger" data-fraction-action="clear">Clear shaded</button>
        </div>
        <div class="tool-inputs-row">
          ${numField("fr-num", "Numerator:")}
          <span class="inputs-op" aria-hidden="true">/</span>
          ${numField("fr-den", "Denominator:")}
          <button type="button" class="mini-tool-btn" data-fraction-action="add" data-focus-key="fr-add">+ Add Fraction Strip</button>
        </div>
        <div class="fraction-strips-list">
          <div class="fraction-strip-row">
            <span class="strip-label">1 Whole</span>
            <div class="interactive-fraction-strip">
              <button type="button" class="fraction-strip-piece filled" disabled>1</button>
            </div>
          </div>
          ${f.strips
            .map((d) => {
              const shadedSet = f.shaded[d] || new Set();
              return `
                <div class="fraction-strip-row">
                  <span class="strip-label">1/${d} (${shadedSet.size}/${d})</span>
                  <div class="interactive-fraction-strip">
                    ${Array.from({ length: d }, (_, i) => `<button type="button" class="fraction-strip-piece ${shadedSet.has(i) ? "shaded" : ""}" data-denom="${d}" data-piece="${i}">1/${d}</button>`).join("")}
                  </div>
                  ${shadedSet.size > 0 ? `<button type="button" class="mini-tool-btn copy-btn" data-copy-val="${shadedSet.size}/${d}">📥 Use ${shadedSet.size}/${d}</button>` : ""}
                  ${f.custom.has(d) ? `<button type="button" class="mini-tool-btn danger" data-remove-strip="${d}" aria-label="Remove the ${d}ths strip">✕</button>` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderArray({ array }) {
    const { rows, cols, split } = array;
    const part1 = rows * split;
    const part2 = rows * (cols - split);
    const total = rows * cols;
    return `
      <div class="tool-canvas tool-array-canvas">
        <div class="tool-controls-row">
          <span><strong>Interactive Area &amp; Array Model:</strong> Split multiplication into two friendly rectangles.</span>
          <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${total}">📥 Use ${total} as Answer</button>
        </div>
        <div class="tool-inputs-row">
          ${numField("rows", "Rows:")}
          ${numField("cols", "Columns:")}
          ${numField("split", "Split at:")}
        </div>
        <div class="array-visual-split-card">
          <div class="array-split-header">
            <p>Problem: <strong>${rows} × ${cols}</strong> = <strong>${total}</strong></p>
            <p class="array-equation-breakdown">(${rows} × ${split}) + (${rows} × ${cols - split}) = ${part1} + ${part2} = <strong>${total}</strong></p>
          </div>
          <div class="array-split-boxes">
            <div class="array-part part-a" style="flex: ${split};">
              <span>Part 1: ${rows} × ${split}</span>
              <strong>= ${part1}</strong>
            </div>
            <div class="array-part part-b" style="flex: ${cols - split};">
              <span>Part 2: ${rows} × ${cols - split}</span>
              <strong>= ${part2}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderIntegers({ integers }) {
    const { pos, neg } = integers;
    const zeroPairs = Math.min(pos, neg);
    const net = pos - neg;
    const chips = (n, cls, label) =>
      Array.from(
        { length: n },
        (_, i) => `<span class="math-chip ${cls} ${i < zeroPairs ? "paired" : ""}">${label}</span>`,
      ).join("") || '<span class="empty-hint">None</span>';
    return `
      <div class="tool-canvas tool-integers-canvas">
        <div class="tool-controls-row">
          <span><strong>Two-Color Counters &amp; Zero Pairs:</strong> Yellow is +1, Red is −1. Opposites cancel out!</span>
          <div class="tool-button-group">
            <button type="button" class="mini-tool-btn" data-int-action="addPos">+1 Yellow (+1)</button>
            <button type="button" class="mini-tool-btn" data-int-action="add5Pos">+5 Yellow</button>
            <button type="button" class="mini-tool-btn" data-int-action="addNeg">+1 Red (−1)</button>
            <button type="button" class="mini-tool-btn" data-int-action="add5Neg">+5 Red</button>
            <button type="button" class="mini-tool-btn" data-int-action="cancelPairs">Cancel Zero Pairs (${zeroPairs})</button>
            <button type="button" class="mini-tool-btn danger" data-int-action="clear">Clear</button>
            <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${net}">📥 Use ${net} as Answer</button>
          </div>
        </div>
        <div class="tool-inputs-row">
          ${numField("pos", "Positive (+):")}
          ${numField("neg", "Negative (−):")}
        </div>
        <div class="integer-chips-stage">
          <div class="chip-container pos-chips">
            <p class="chip-label">Positive (+${pos}):</p>
            <div class="chip-flex">${chips(pos, "pos-chip", "+1")}</div>
          </div>
          <div class="chip-container neg-chips">
            <p class="chip-label">Negative (−${neg}):</p>
            <div class="chip-flex">${chips(neg, "neg-chip", "−1")}</div>
          </div>
        </div>
        <p class="integers-readout"><strong>Zero pairs:</strong> ${zeroPairs} cancel to 0 ➔ <strong>Net Value:</strong> <span class="tally-num ${net > 0 ? "pos-num" : net < 0 ? "neg-num" : ""}">${net > 0 ? `+${net}` : net}</span></p>
      </div>
    `;
  }

  function renderBalance({ balance }) {
    const { coeff, constant, rhs } = balance;
    const targetX = (rhs - constant) / coeff;
    const xText = Number.isInteger(targetX) ? targetX : targetX.toFixed(1);
    const sign = (n) => (n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`);
    return `
      <div class="tool-canvas tool-balance-canvas">
        <div class="tool-controls-row">
          <span><strong>Algebra Balance Scale:</strong> Keep both pans balanced as you isolate x.</span>
          <div class="tool-button-group">
            <button type="button" class="mini-tool-btn" data-balance-action="sub1">−1 both sides</button>
            <button type="button" class="mini-tool-btn" data-balance-action="add1">+1 both sides</button>
            ${coeff > 1 ? `<button type="button" class="mini-tool-btn" data-balance-action="divCoeff">÷ ${coeff} both sides</button>` : ""}
            <button type="button" class="mini-tool-btn danger" data-balance-action="reset">Reset</button>
            <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${xText}">📥 Use x = ${xText}</button>
          </div>
        </div>
        <div class="tool-inputs-row equation-inputs">
          ${numField("bal-coeff", "Number in front of x", { bare: true })}<span class="inputs-op">x +</span>
          ${numField("bal-const", "Number added to x", { bare: true })}<span class="inputs-op">=</span>
          ${numField("bal-rhs", "Number on the right side", { bare: true })}
        </div>
        <div class="balance-scale-stage">
          <div class="balance-pan left-pan">
            <div class="pan-title">Left Pan</div>
            <div class="pan-contents">
              <span class="var-badge">${coeff}x</span>
              ${constant !== 0 ? `<span class="const-badge">${sign(constant)}</span>` : ""}
            </div>
          </div>
          <div class="balance-fulcrum">
            <div class="beam"></div>
            <div class="pivot">▲ EQUALS ▲</div>
          </div>
          <div class="balance-pan right-pan">
            <div class="pan-title">Right Pan</div>
            <div class="pan-contents">
              <span class="value-badge">${rhs}</span>
            </div>
          </div>
        </div>
        <p class="balance-readout"><strong>Equation:</strong> ${coeff}x ${sign(constant)} = ${rhs} ➔ <strong>Solution:</strong> x = <span class="tally-num">${Number.isInteger(targetX) ? targetX : targetX.toFixed(2)}</span></p>
      </div>
    `;
  }

  // Run a state change, clear the last hint, and redraw.
  const act = (change) => {
    hint = "";
    change();
    render();
  };

  function submitEntry() {
    const parsed = parseProblem(entryText, { strict: true });
    if (!parsed) {
      entryMsg = entryText.trim()
        ? `I couldn't read that. ${ENTRY_HELP}`
        : `Type a problem first. ${ENTRY_HELP}`;
    } else if (parsed.error) {
      entryMsg = parsed.error;
    } else {
      wb.applyTyped(parsed);
      onSelectTool?.(wb.state.tool);
      entryMsg = `Modeling ${entryText.trim()}. Change any number in the tool to keep experimenting.`;
    }
    act(() => {});
  }

  function bindField(input) {
    const spec = wb.fields[input.dataset.field];
    const read = () => (isWholeText(input.value) ? Number(input.value.trim()) : null);
    const inRange = (n) => {
      const [lo, hi] = spec.range();
      return n !== null && n >= lo && n <= hi && !(spec.nonzero && n === 0);
    };
    input.oninput = () => {
      const n = read();
      if (inRange(n)) act(() => spec.set(n));
    };
    input.onchange = () => {
      const n = read();
      if (inRange(n)) return;
      const [lo, hi] = spec.range();
      if (n !== null && !(spec.nonzero && n === 0)) spec.set(Math.min(hi, Math.max(lo, n)));
      hint = `Use a whole number from ${lo} to ${hi}${spec.nonzero ? ", other than 0" : ""}.`;
      render();
    };
  }

  function attachEvents() {
    const on = (selector, handler) => container.querySelectorAll(selector).forEach(handler);
    const { actions } = wb;

    on("[data-tool]", (btn) => {
      btn.onclick = () => {
        wb.selectTool(btn.dataset.tool);
        onSelectTool?.(btn.dataset.tool);
        act(() => {});
      };
    });

    on("[data-copy-val]", (btn) => {
      btn.onclick = () => setAnswerInput(btn.dataset.copyVal);
    });

    // Universal problem bar
    const entry = container.querySelector("#wb-problem-input");
    entry.oninput = () => {
      entryText = entry.value;
    };
    entry.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitEntry();
      }
    };
    container.querySelector("[data-entry='model']").onclick = submitEntry;
    container.querySelector("[data-entry='reset']").onclick = () => {
      wb.resetToItem(item);
      onSelectTool?.(wb.state.tool);
      entryText = "";
      entryMsg = "Back to the practice problem.";
      act(() => {});
    };

    on("[data-field]", bindField);

    // Counters
    on("[data-cell]", (cell) => {
      cell.onclick = () => act(() => actions.toggleCell(Number(cell.dataset.cell)));
    });
    on("[data-counter-action]", (btn) => {
      btn.onclick = () => act(() => actions.counter(btn.dataset.counterAction));
    });

    // Number line
    on("[data-jump]", (btn) => {
      btn.onclick = () => act(() => actions.addJump(btn.dataset.jump));
    });
    const jumpInput = container.querySelector("#wb-jump-input");
    const addTypedJump = () => act(() => (hint = actions.addJump(jumpInput.value)));
    if (jumpInput) {
      jumpInput.oninput = () => {
        wb.state.numberline.draft = jumpInput.value;
      };
      jumpInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addTypedJump();
        }
      };
    }
    container.querySelector("[data-jump-action='add']")?.addEventListener("click", addTypedJump);
    container
      .querySelector("[data-jump-action='reset']")
      ?.addEventListener("click", () => act(actions.resetJumps));

    // Fractions
    on("[data-piece]", (btn) => {
      btn.onclick = () =>
        act(() => actions.togglePiece(Number(btn.dataset.denom), Number(btn.dataset.piece)));
    });
    container
      .querySelector("[data-fraction-action='clear']")
      ?.addEventListener("click", () => act(actions.clearShaded));
    container
      .querySelector("[data-fraction-action='add']")
      ?.addEventListener("click", () => act(actions.addFraction));
    on("[data-remove-strip]", (btn) => {
      btn.onclick = () => act(() => actions.removeStrip(Number(btn.dataset.removeStrip)));
    });

    // Integers and balance
    on("[data-int-action]", (btn) => {
      btn.onclick = () => act(() => actions.integers(btn.dataset.intAction));
    });
    on("[data-balance-action]", (btn) => {
      btn.onclick = () => act(() => actions.balance(btn.dataset.balanceAction));
    });
  }

  render();
  return {
    setProblem: (newSkill, newItem) => {
      skill = newSkill;
      item = newItem;
      render();
    },
    destroy: () => {
      container.innerHTML = "";
    },
  };
}
