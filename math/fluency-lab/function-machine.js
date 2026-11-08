// Interactive Function Machine & Graphing In-Out Rule Table (Grades 6–8 Algebra & Functions)
// Visual algebraic gearbox mapping input values x through linear rule y = mx + b to output y.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function evaluateFunction(m, b, x) {
  return m * x + b;
}

export function renderFunctionMachine(state = {}) {
  const {
    m = 3, // slope / rate of change
    b = -2, // y-intercept / initial value
    inputs = [1, 2, 3, 4, 5],
    currentInput = 3,
  } = state;

  const currentOutput = evaluateFunction(m, b, currentInput);
  const ruleStr = `y = ${m}x ${b >= 0 ? "+ " + b : "− " + Math.abs(b)}`;

  // Table rows mapping x -> y
  const tableRows = inputs.map((xVal) => {
    const yVal = evaluateFunction(m, b, xVal);
    const isCurrent = xVal === currentInput;
    return `
      <tr class="${isCurrent ? "ratio-row-current" : ""}">
        <td><strong>${xVal}</strong></td>
        <td>${m}(${xVal}) ${b >= 0 ? "+" + b : "−" + Math.abs(b)}</td>
        <td><strong>${yVal}</strong></td>
        <td><small style="color:#64748b">(${xVal}, ${yVal})</small></td>
      </tr>
    `;
  }).join("");

  return `
    <div class="function-machine-wrap" data-func-root="true" data-m="${m}" data-b="${b}" data-curr="${currentInput}">
      <div class="coord-header">
        <span class="coord-title">⚙️ Interactive Function Machine: <code>${esc(ruleStr)}</code></span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Rate of Change (Slope m): ${m}</span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e">Initial Value (b): ${b}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
            f(${currentInput}) = <strong>${currentOutput}</strong>
          </span>
        </div>
      </div>

      <div class="ratio-display-grid">
        <!-- Machine Visual -->
        <div class="func-machine-box">
          <svg width="240" height="180" viewBox="0 0 240 180" role="img" aria-label="Function machine processing input ${currentInput}">
            <!-- Input Funnel -->
            <polygon points="90,10 150,10 135,45 105,45" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
            <text x="120" y="32" text-anchor="middle" font-size="12" font-weight="900" fill="#2563eb">x = ${currentInput}</text>

            <!-- Machine Main Body -->
            <rect x="50" y="45" width="140" height="90" rx="10" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
            <!-- Interior Screen -->
            <rect x="65" y="60" width="110" height="60" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
            <text x="120" y="84" text-anchor="middle" font-size="12" font-weight="800" fill="#38bdf8">RULE:</text>
            <text x="120" y="104" text-anchor="middle" font-size="14" font-weight="900" fill="#4ade80">${esc(ruleStr)}</text>

            <!-- Output Chute -->
            <polygon points="105,135 135,135 145,170 95,170" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
            <text x="120" y="160" text-anchor="middle" font-size="13" font-weight="900" fill="#16a34a">y = ${currentOutput}</text>
          </svg>
        </div>

        <!-- In-Out Table -->
        <div class="ratio-table-column">
          <table class="ratio-table">
            <thead>
              <tr>
                <th>Input (x)</th>
                <th>Operation</th>
                <th>Output (y)</th>
                <th>(x, y) Point</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569; align-self:center">Test Input (x):</span>
        ${inputs.map((val) => `
          <button type="button" class="coord-btn ${val === currentInput ? "is-highlighted" : ""}" data-func-input="${val}">
            Drop x = ${val}
          </button>
        `).join("")}
        <button type="button" class="coord-btn" data-func-rule="2:3">Rule: 2x + 3</button>
        <button type="button" class="coord-btn" data-func-rule="4:-1">Rule: 4x − 1</button>
        <button type="button" class="coord-btn" data-func-rule="-2:5">Rule: −2x + 5</button>
      </div>
    </div>
  `;
}

export function mountFunctionMachine(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-func-root]") ? container : container.querySelector("[data-func-root]");
  if (!root) return;

  let m = Number(root.dataset.m) || 3;
  let b = Number(root.dataset.b) || -2;
  let currentInput = Number(root.dataset.curr) || 3;
  const inputs = [1, 2, 3, 4, 5];

  const update = () => {
    root.outerHTML = renderFunctionMachine({ m, b, inputs, currentInput });
    const updated = container.querySelector("[data-func-root]") || container;
    mountFunctionMachine(updated, onChange);
    if (onChange) onChange({ m, b, currentInput, output: evaluateFunction(m, b, currentInput) });
  };

  root.querySelectorAll("[data-func-input]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentInput = Number(btn.dataset.funcInput);
      update();
    });
  });

  root.querySelectorAll("[data-func-rule]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [newM, newB] = btn.dataset.funcRule.split(":").map(Number);
      m = newM;
      b = newB;
      update();
    });
  });
}
