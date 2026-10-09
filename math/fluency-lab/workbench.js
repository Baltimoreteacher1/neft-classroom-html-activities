import { renderInlineProblemModel } from "./visual-lab.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function mountWorkbench(container, { skill, item, onSelectTool } = {}) {
  container.classList.add("interactive-math-workbench");

  let activeTool = "model";
  let counterState = { total: 20, set: new Set() };
  let numberlineState = { start: 0, current: 0, jumps: [] };
  let fractionState = { strips: [2, 3, 4, 6, 8], shaded: {} };
  let arrayState = { rows: 6, cols: 8, split: 5 };
  let integerState = { pos: 0, neg: 0 };
  let balanceState = { leftCoeff: 1, leftConst: 0, rightVal: 10 };

  // Initialize defaults based on the active question if possible
  if (item?.question) {
    const q = item.question;
    const addMatch = q.match(/^([\d,]+)\s*\+\s*([\d,]+)/);
    const subMatch = q.match(/^([\d,]+)\s*[−-]\s*([\d,]+)/);
    const mulMatch = q.match(/^([\d,]+)\s*[×*x]\s*([\d,]+)/);
    const intMatch = q.match(/([−-]?\d+)\s*([+−-])\s*([−-]?\d+)/);
    const eqMatch = q.match(/(\d*)x\s*([+−-])\s*(\d+)\s*=\s*(\d+)/i);

    if (q.includes("x") && eqMatch) {
      activeTool = "balance";
      balanceState.leftCoeff = eqMatch[1] ? Number(eqMatch[1]) : 1;
      balanceState.leftConst = eqMatch[2] === "−" || eqMatch[2] === "-" ? -Number(eqMatch[3]) : Number(eqMatch[3]);
      balanceState.rightVal = Number(eqMatch[4]);
    } else if (q.includes("−") || q.includes("-") && (q.includes("negative") || q.match(/-\d/))) {
      const nums = q.match(/-?\d+/g);
      if (nums && nums.length >= 2) {
        activeTool = "integers";
        const n1 = Number(nums[0]);
        if (n1 > 0) integerState.pos = Math.min(15, n1);
        else integerState.neg = Math.min(15, Math.abs(n1));
      }
    } else if (addMatch) {
      const a = Number(addMatch[1].replace(/,/g, ""));
      const b = Number(addMatch[2].replace(/,/g, ""));
      if (a + b <= 20) {
        counterState.total = 20;
        counterState.set = new Set(Array.from({ length: a }, (_, i) => i));
        activeTool = "counters";
      } else {
        numberlineState.start = a;
        numberlineState.current = a;
        activeTool = "numberline";
      }
    } else if (subMatch) {
      const a = Number(subMatch[1].replace(/,/g, ""));
      if (a <= 20) {
        counterState.total = 20;
        counterState.set = new Set(Array.from({ length: a }, (_, i) => i));
        activeTool = "counters";
      } else {
        numberlineState.start = a;
        numberlineState.current = a;
        activeTool = "numberline";
      }
    } else if (mulMatch) {
      const a = Number(mulMatch[1].replace(/,/g, ""));
      const b = Number(mulMatch[2].replace(/,/g, ""));
      if (a <= 12 && b <= 12) {
        arrayState.rows = a;
        arrayState.cols = b;
        arrayState.split = Math.min(5, b > 1 ? b - 1 : 1);
        activeTool = "array";
      }
    } else if (q.includes("/")) {
      activeTool = "fractions";
    }
  }

  function setAnswerInput(val) {
    const input = document.querySelector("#answer-input");
    if (input) {
      input.value = String(val);
      input.focus();
    }
  }

  function render() {
    container.innerHTML = `
      <div class="workbench-bar">
        <div class="workbench-header-row">
          <div class="workbench-titles">
            <span class="workbench-title">✨ Interactive Visual Manipulatives</span>
            <span class="workbench-subtitle">Experiment, build models, and test your thinking:</span>
          </div>
        </div>
        <div class="workbench-tabs" role="tablist" aria-label="Interactive math tools">
          <button type="button" class="tool-tab ${activeTool === "model" ? "active" : ""}" data-tool="model" role="tab" aria-selected="${activeTool === "model"}">💡 Problem Model</button>
          <button type="button" class="tool-tab ${activeTool === "counters" ? "active" : ""}" data-tool="counters" role="tab" aria-selected="${activeTool === "counters"}">🔵 Ten-Frames</button>
          <button type="button" class="tool-tab ${activeTool === "numberline" ? "active" : ""}" data-tool="numberline" role="tab" aria-selected="${activeTool === "numberline"}">📏 Number Line</button>
          <button type="button" class="tool-tab ${activeTool === "fractions" ? "active" : ""}" data-tool="fractions" role="tab" aria-selected="${activeTool === "fractions"}">🍰 Fraction Strips</button>
          <button type="button" class="tool-tab ${activeTool === "array" ? "active" : ""}" data-tool="array" role="tab" aria-selected="${activeTool === "array"}">🔲 Area Model</button>
          <button type="button" class="tool-tab ${activeTool === "integers" ? "active" : ""}" data-tool="integers" role="tab" aria-selected="${activeTool === "integers"}">➕➖ Zero Pairs</button>
          <button type="button" class="tool-tab ${activeTool === "balance" ? "active" : ""}" data-tool="balance" role="tab" aria-selected="${activeTool === "balance"}">⚖️ Balance Scale</button>
        </div>
      </div>
      <div class="workbench-body">
        ${renderActiveTool()}
      </div>
    `;
    attachEvents();
  }

  function renderActiveTool() {
    if (activeTool === "model") {
      const modelHtml = renderInlineProblemModel(skill, item);
      return `
        <div class="tool-canvas tool-model-canvas">
          <p class="tool-instruction">Target visual model for <strong>${esc(item?.question || "")}</strong>:</p>
          <div class="tool-render-area">${modelHtml || "<p>Think of the problem using an open number line or friendly groups.</p>"}</div>
        </div>
      `;
    }

    if (activeTool === "counters") {
      const count = counterState.set.size;
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
          <div class="interactive-counter-board" role="group" aria-label="Ten-frame counters">
            ${Array.from({ length: counterState.total }, (_, i) => {
              const filled = counterState.set.has(i);
              return `<button type="button" class="interactive-counter-cell ${filled ? "filled" : ""}" data-cell="${i}" aria-label="Space ${i + 1}, ${filled ? "filled" : "empty"}"><span aria-hidden="true">${filled ? "●" : "○"}</span></button>`;
            }).join("")}
          </div>
          <p class="counter-tally-readout"><strong>Count:</strong> <span class="tally-num">${count}</span> counters placed · <strong>${counterState.total - count}</strong> spaces open</p>
        </div>
      `;
    }

    if (activeTool === "numberline") {
      const points = [numberlineState.start];
      let running = numberlineState.start;
      for (const j of numberlineState.jumps) {
        running += j;
        points.push(running);
      }
      const minVal = Math.min(...points, numberlineState.start - 5);
      const maxVal = Math.max(...points, numberlineState.start + 25);
      const span = Math.max(10, maxVal - minVal);
      const scaleX = (val) => 40 + ((val - minVal) / span) * 460;

      const marksSvg = [...new Set(points)].map((val) => {
        const x = scaleX(val);
        return `<path d="M${x},135 v12" stroke="#17345f" stroke-width="2"/><text x="${x}" y="165" font-size="12" text-anchor="middle" fill="#14253d" font-weight="600">${val}</text>`;
      }).join("");

      const jumpsSvg = numberlineState.jumps.map((jump, i) => {
        const x1 = scaleX(points[i]);
        const x2 = scaleX(points[i + 1]);
        const midX = (x1 + x2) / 2;
        const peakY = 50 - (i % 3) * 10;
        return `
          <path d="M${x1},135 Q${midX},${peakY} ${x2},135" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
          <text x="${midX}" y="${peakY - 5}" font-size="12" text-anchor="middle" fill="#1e40af" font-weight="bold">${jump >= 0 ? "+" : ""}${jump}</text>
        `;
      }).join("");

      return `
        <div class="tool-canvas tool-numberline-canvas">
          <div class="tool-controls-row">
            <span><strong>Interactive Number Line:</strong> Click jumps to count on or jump back.</span>
            <div class="tool-button-group">
              <button type="button" class="mini-tool-btn" data-jump="1">+1</button>
              <button type="button" class="mini-tool-btn" data-jump="5">+5</button>
              <button type="button" class="mini-tool-btn" data-jump="10">+10</button>
              <button type="button" class="mini-tool-btn" data-jump="25">+25</button>
              <button type="button" class="mini-tool-btn" data-jump="-1">−1</button>
              <button type="button" class="mini-tool-btn" data-jump="-5">−5</button>
              <button type="button" class="mini-tool-btn" data-jump="-10">−10</button>
              <button type="button" class="mini-tool-btn danger" data-jump-action="reset">Reset</button>
              <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${numberlineState.current}">📥 Use ${numberlineState.current} as Answer</button>
            </div>
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
          <p class="numberline-readout"><strong>Start:</strong> ${numberlineState.start} ➔ <strong>Jumps:</strong> [${numberlineState.jumps.map((j) => (j >= 0 ? `+${j}` : j)).join(", ") || "none"}] ➔ <strong>Current Position:</strong> <span class="tally-num">${numberlineState.current}</span></p>
        </div>
      `;
    }

    if (activeTool === "fractions") {
      return `
        <div class="tool-canvas tool-fractions-canvas">
          <div class="tool-controls-row">
            <span><strong>Interactive Fraction Strips:</strong> Tap pieces to shade/unshade and compare parts of the same whole.</span>
            <button type="button" class="mini-tool-btn danger" data-fraction-action="clear">Clear shaded</button>
          </div>
          <div class="fraction-strips-list">
            <div class="fraction-strip-row">
              <span class="strip-label">1 Whole</span>
              <div class="interactive-fraction-strip">
                <button type="button" class="fraction-strip-piece filled" disabled>1</button>
              </div>
            </div>
            ${fractionState.strips.map((d) => {
              const shadedSet = fractionState.shaded[d] || new Set();
              return `
                <div class="fraction-strip-row">
                  <span class="strip-label">1/${d} (${shadedSet.size}/${d})</span>
                  <div class="interactive-fraction-strip">
                    ${Array.from({ length: d }, (_, i) => {
                      const isShaded = shadedSet.has(i);
                      return `<button type="button" class="fraction-strip-piece ${isShaded ? "shaded" : ""}" data-denom="${d}" data-piece="${i}">1/${d}</button>`;
                    }).join("")}
                  </div>
                  ${shadedSet.size > 0 ? `<button type="button" class="mini-tool-btn copy-btn" data-copy-val="${shadedSet.size}/${d}">📥 Use ${shadedSet.size}/${d}</button>` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    if (activeTool === "array") {
      const { rows, cols, split } = arrayState;
      const part1 = rows * split;
      const part2 = rows * (cols - split);
      const total = rows * cols;
      return `
        <div class="tool-canvas tool-array-canvas">
          <div class="tool-controls-row">
            <span><strong>Interactive Area &amp; Array Model:</strong> Split multiplication into two friendly rectangles.</span>
            <div class="array-inputs">
              <label>Rows: <input type="number" min="1" max="15" value="${rows}" data-array-dim="rows" class="mini-num-input"/></label>
              <label>Columns: <input type="number" min="2" max="20" value="${cols}" data-array-dim="cols" class="mini-num-input"/></label>
              <label>Split at: <input type="number" min="1" max="${cols - 1}" value="${split}" data-array-dim="split" class="mini-num-input"/></label>
              <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${total}">📥 Use ${total} as Answer</button>
            </div>
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

    if (activeTool === "integers") {
      const { pos, neg } = integerState;
      const zeroPairs = Math.min(pos, neg);
      const net = pos - neg;
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
          <div class="integer-chips-stage">
            <div class="chip-container pos-chips">
              <p class="chip-label">Positive (+${pos}):</p>
              <div class="chip-flex">
                ${Array.from({ length: pos }, (_, i) => `<span class="math-chip pos-chip ${i < zeroPairs ? 'paired' : ''}">+1</span>`).join("") || '<span class="empty-hint">None</span>'}
              </div>
            </div>
            <div class="chip-container neg-chips">
              <p class="chip-label">Negative (−${neg}):</p>
              <div class="chip-flex">
                ${Array.from({ length: neg }, (_, i) => `<span class="math-chip neg-chip ${i < zeroPairs ? 'paired' : ''}">−1</span>`).join("") || '<span class="empty-hint">None</span>'}
              </div>
            </div>
          </div>
          <p class="integers-readout"><strong>Zero pairs:</strong> ${zeroPairs} cancel to 0 ➔ <strong>Net Value:</strong> <span class="tally-num ${net > 0 ? 'pos-num' : net < 0 ? 'neg-num' : ''}">${net > 0 ? `+${net}` : net}</span></p>
        </div>
      `;
    }

    if (activeTool === "balance") {
      const { leftCoeff, leftConst, rightVal } = balanceState;
      const targetX = leftCoeff !== 0 ? (rightVal - leftConst) / leftCoeff : 0;
      return `
        <div class="tool-canvas tool-balance-canvas">
          <div class="tool-controls-row">
            <span><strong>Algebra Balance Scale:</strong> Keep both pans balanced as you isolate x.</span>
            <div class="tool-button-group">
              <button type="button" class="mini-tool-btn" data-balance-action="sub1">−1 both sides</button>
              <button type="button" class="mini-tool-btn" data-balance-action="add1">+1 both sides</button>
              ${leftCoeff > 1 ? `<button type="button" class="mini-tool-btn" data-balance-action="divCoeff">÷ ${leftCoeff} both sides</button>` : ""}
              <button type="button" class="mini-tool-btn danger" data-balance-action="reset">Reset</button>
              <button type="button" class="mini-tool-btn copy-btn" data-copy-val="${Number.isInteger(targetX) ? targetX : targetX.toFixed(1)}">📥 Use x = ${Number.isInteger(targetX) ? targetX : targetX.toFixed(1)}</button>
            </div>
          </div>
          <div class="balance-scale-stage">
            <div class="balance-pan left-pan">
              <div class="pan-title">Left Pan</div>
              <div class="pan-contents">
                <span class="var-badge">${leftCoeff}x</span>
                ${leftConst !== 0 ? `<span class="const-badge">${leftConst >= 0 ? `+ ${leftConst}` : `− ${Math.abs(leftConst)}`}</span>` : ""}
              </div>
            </div>
            <div class="balance-fulcrum">
              <div class="beam"></div>
              <div class="pivot">▲ EQUALS ▲</div>
            </div>
            <div class="balance-pan right-pan">
              <div class="pan-title">Right Pan</div>
              <div class="pan-contents">
                <span class="value-badge">${rightVal}</span>
              </div>
            </div>
          </div>
          <p class="balance-readout"><strong>Equation:</strong> ${leftCoeff}x ${leftConst >= 0 ? `+ ${leftConst}` : `− ${Math.abs(leftConst)}`} = ${rightVal} ➔ <strong>Solution:</strong> x = <span class="tally-num">${Number.isInteger(targetX) ? targetX : targetX.toFixed(2)}</span></p>
        </div>
      `;
    }

    return "";
  }

  function attachEvents() {
    container.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.onclick = () => {
        activeTool = btn.dataset.tool;
        onSelectTool?.(activeTool);
        render();
      };
    });

    container.querySelectorAll("[data-copy-val]").forEach((btn) => {
      btn.onclick = () => {
        setAnswerInput(btn.dataset.copyVal);
      };
    });

    // Counters events
    container.querySelectorAll("[data-cell]").forEach((cell) => {
      cell.onclick = () => {
        const i = Number(cell.dataset.cell);
        if (counterState.set.has(i)) counterState.set.delete(i);
        else counterState.set.add(i);
        render();
      };
    });

    container.querySelectorAll("[data-counter-action]").forEach((btn) => {
      btn.onclick = () => {
        const action = btn.dataset.counterAction;
        if (action === "clear") counterState.set.clear();
        if (action === "add5") {
          for (let i = 0; i < counterState.total && counterState.set.size < counterState.total; i++) {
            if (!counterState.set.has(i)) {
              counterState.set.add(i);
              if (counterState.set.size % 5 === 0) break;
            }
          }
        }
        if (action === "fill10") {
          counterState.set = new Set(Array.from({ length: 10 }, (_, i) => i));
        }
        if (action === "fill20") {
          counterState.set = new Set(Array.from({ length: 20 }, (_, i) => i));
        }
        render();
      };
    });

    // Number line events
    container.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.onclick = () => {
        const val = Number(btn.dataset.jump);
        numberlineState.jumps.push(val);
        numberlineState.current += val;
        render();
      };
    });

    container.querySelector("[data-jump-action='reset']")?.addEventListener("click", () => {
      numberlineState.jumps = [];
      numberlineState.current = numberlineState.start;
      render();
    });

    // Fractions events
    container.querySelectorAll("[data-piece]").forEach((btn) => {
      btn.onclick = () => {
        const d = Number(btn.dataset.denom);
        const p = Number(btn.dataset.piece);
        if (!fractionState.shaded[d]) fractionState.shaded[d] = new Set();
        if (fractionState.shaded[d].has(p)) fractionState.shaded[d].delete(p);
        else fractionState.shaded[d].add(p);
        render();
      };
    });

    container.querySelector("[data-fraction-action='clear']")?.addEventListener("click", () => {
      fractionState.shaded = {};
      render();
    });

    // Array events
    container.querySelectorAll("[data-array-dim]").forEach((input) => {
      input.onchange = () => {
        const dim = input.dataset.arrayDim;
        const val = Math.max(1, Number(input.value));
        arrayState[dim] = val;
        if (dim === "cols" && arrayState.split >= val) {
          arrayState.split = Math.max(1, val - 1);
        }
        render();
      };
    });

    // Integers events
    container.querySelectorAll("[data-int-action]").forEach((btn) => {
      btn.onclick = () => {
        const action = btn.dataset.intAction;
        if (action === "addPos") integerState.pos += 1;
        if (action === "add5Pos") integerState.pos += 5;
        if (action === "addNeg") integerState.neg += 1;
        if (action === "add5Neg") integerState.neg += 5;
        if (action === "cancelPairs") {
          const pairs = Math.min(integerState.pos, integerState.neg);
          integerState.pos -= pairs;
          integerState.neg -= pairs;
        }
        if (action === "clear") {
          integerState.pos = 0;
          integerState.neg = 0;
        }
        render();
      };
    });

    // Balance scale events
    container.querySelectorAll("[data-balance-action]").forEach((btn) => {
      btn.onclick = () => {
        const action = btn.dataset.balanceAction;
        if (action === "sub1") {
          balanceState.leftConst -= 1;
          balanceState.rightVal -= 1;
        }
        if (action === "add1") {
          balanceState.leftConst += 1;
          balanceState.rightVal += 1;
        }
        if (action === "divCoeff" && balanceState.leftCoeff > 1) {
          const c = balanceState.leftCoeff;
          balanceState.leftCoeff = 1;
          balanceState.leftConst = balanceState.leftConst / c;
          balanceState.rightVal = balanceState.rightVal / c;
        }
        if (action === "reset") {
          balanceState.leftCoeff = 2;
          balanceState.leftConst = 4;
          balanceState.rightVal = 12;
        }
        render();
      };
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
    }
  };
}
