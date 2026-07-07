/* ==========================================================================
   MCAP Homework Practice Studio — interactive engine
   --------------------------------------------------------------------------
   Externalized from the page's inline <script> (2026 enterprise upgrade).
   Keeping this in its own module guarantees the multi-day Save/Resume
   injector (which targets HTML <body>/<script> markers) can never again
   corrupt the JavaScript by inserting tags inside a template string —
   the bug that previously left every interaction on this page dead.

   Public functions used by inline handlers in index.html are attached to
   `window` at the bottom of the file. Everything else is module-private.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     1. CONFIGURATION
     ---------------------------------------------------------------------- */
  const CONFIG = {
    theme: "navy-teal",
    defaultVal1: 12.5,
    defaultVal2: 4.2,
    defaultA: 3,
    defaultB: 5,
    defaultC: 26,
    storageKey: "neft-mcap-homework:v2",
    debug: false,
  };

  /* ----------------------------------------------------------------------
     2. SMALL HELPERS
     ---------------------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const log = (...a) => {
    if (CONFIG.debug) console.log(...a);
  };

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveState(patch) {
    try {
      const next = Object.assign(loadState(), patch);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(next));
    } catch (e) {
      /* storage may be disabled — feature-degrade silently */
    }
  }

  /* ----------------------------------------------------------------------
     3. QUESTION BANK  (Grade 6 Maryland MCAP domains)
     Each item: { title, text, options[], correctIndex, explain, model }
     model: "text" | "ratio-tape" | "coordinate-grid"
     ---------------------------------------------------------------------- */
  const QUESTION_DATABASE = {
    ns: [
      {
        title: "Fractions Division (6.NOS.A.1)",
        text: "A container holds <b>4&frac12; cups</b> of sugar. If each cake recipe requires <b>&frac34; cup</b> of sugar, how many complete recipes can be baked?",
        options: ["A) 4 recipes", "B) 6 recipes", "C) 5 recipes", "D) 8 recipes"],
        correctIndex: 1,
        explain: "Divide: 4&frac12; &divide; &frac34; = 9/2 &times; 4/3 = 36/6 = 6 recipes.",
        model: "text",
      },
      {
        title: "Decimal Division (6.NOS.B.3)",
        text: "Evaluate the quotient: <b>14.25 &divide; 1.5</b>",
        options: ["A) 8.5", "B) 9.5", "C) 10.5", "D) 11.25"],
        correctIndex: 1,
        explain: "14.25 &divide; 1.5 = 9.5 (shift both decimals one place: 142.5 &divide; 15).",
        model: "text",
      },
      {
        title: "GCF & Distributive Property (6.NOS.B.4)",
        text: "Rewrite <b>36 + 24</b> using the greatest common factor and the distributive property.",
        options: ["A) 6(6 + 4)", "B) 12(3 + 2)", "C) 4(9 + 6)", "D) 12(3 + 4)"],
        correctIndex: 1,
        explain: "GCF(36, 24) = 12, so 36 + 24 = 12(3 + 2).",
        model: "text",
      },
      {
        title: "Multi-Digit Operations (6.NOS.B.2)",
        text: "A school orders <b>1,248</b> pencils packed <b>24</b> to a box. How many full boxes are there?",
        options: ["A) 42 boxes", "B) 52 boxes", "C) 48 boxes", "D) 62 boxes"],
        correctIndex: 1,
        explain: "1,248 &divide; 24 = 52 boxes exactly.",
        model: "text",
      },
      {
        title: "Decimal Multiplication (6.NOS.B.3)",
        text: "A ribbon costs <b>$2.35</b> per yard. What is the cost of <b>6.5 yards</b>?",
        options: ["A) $14.28", "B) $15.28", "C) $15.275", "D) $15.30"],
        correctIndex: 1,
        explain: "2.35 &times; 6.5 = 15.275, which rounds to <b>$15.28</b>.",
        model: "text",
      },
    ],
    rp: [
      {
        title: "Equivalent Ratios (6.AT.A.3)",
        text: "A recipe keeps flour to water at a constant ratio of <b>3 : 5</b>. If the baker uses <b>25 cups of water</b>, how many cups of flour are required?",
        options: ["A) 15 cups", "B) 12 cups", "C) 20 cups", "D) 10 cups"],
        correctIndex: 0,
        explain: "Water 5 &rarr; 25 means &times;5, so flour = 3 &times; 5 = 15 cups.",
        model: "ratio-tape",
      },
      {
        title: "Unit Rate Application (6.AT.A.2)",
        text: "A car travels <b>240 miles</b> in <b>4 hours</b>. At this constant speed, how far will it travel in <b>7 hours</b>?",
        options: ["A) 400 miles", "B) 420 miles", "C) 380 miles", "D) 450 miles"],
        correctIndex: 1,
        explain: "Unit rate = 240 &divide; 4 = 60 mph. 60 &times; 7 = 420 miles.",
        model: "text",
      },
      {
        title: "Better Buy (6.AT.A.2)",
        text: "Which is the better buy: <b>12 oz for $3.00</b> or <b>20 oz for $4.40</b>?",
        options: [
          "A) 12 oz ($0.25/oz)",
          "B) 20 oz ($0.22/oz)",
          "C) They cost the same",
          "D) Not enough information",
        ],
        correctIndex: 1,
        explain: "$3.00 &divide; 12 = $0.25/oz; $4.40 &divide; 20 = $0.22/oz. The 20 oz size is cheaper per ounce.",
        model: "text",
      },
      {
        title: "Percent of a Number (6.AT.A.3c)",
        text: "A jacket originally costs <b>$80</b> and is on sale for <b>25% off</b>. What is the sale price?",
        options: ["A) $55", "B) $60", "C) $20", "D) $75"],
        correctIndex: 1,
        explain: "25% of $80 = $20 discount, so $80 − $20 = $60.",
        model: "text",
      },
      {
        title: "Ratio Tables (6.AT.A.3a)",
        text: "If <b>4 tickets cost $18</b>, how much do <b>10 tickets</b> cost at the same rate?",
        options: ["A) $40", "B) $45", "C) $42", "D) $50"],
        correctIndex: 1,
        explain: "Unit cost = 18 &divide; 4 = $4.50. 10 &times; $4.50 = $45.",
        model: "text",
      },
    ],
    ee: [
      {
        title: "Solving Equations (6.AT.C.8)",
        text: "Solve for x: <b>3x − 5 = 16</b>",
        options: ["A) x = 5", "B) x = 6", "C) x = 7", "D) x = 9"],
        correctIndex: 2,
        explain: "3x − 5 = 16 &rarr; 3x = 21 &rarr; x = 7.",
        model: "text",
      },
      {
        title: "Independent & Dependent Variables (6.AT.D.11)",
        text: "A rental company charges a flat fee of <b>$20 plus $5 per hour</b> (h). Which equation gives the total cost (C)?",
        options: ["A) C = 20h + 5", "B) C = 5h + 20", "C) C = 25h", "D) C = 20 − 5h"],
        correctIndex: 1,
        explain: "Flat $20 is constant; $5 is multiplied by h. Total: C = 5h + 20.",
        model: "text",
      },
      {
        title: "Evaluating Expressions (6.AT.B.2c)",
        text: "Evaluate <b>2x&sup2; + 3</b> when <b>x = 4</b>.",
        options: ["A) 35", "B) 19", "C) 67", "D) 32"],
        correctIndex: 0,
        explain: "2(4&sup2;) + 3 = 2(16) + 3 = 32 + 3 = 35.",
        model: "text",
      },
      {
        title: "Combining Like Terms (6.AT.B.7)",
        text: "Simplify the expression: <b>5x + 3 + 2x − 1</b>",
        options: ["A) 7x + 2", "B) 10x", "C) 7x + 4", "D) 8x + 2"],
        correctIndex: 0,
        explain: "Combine: (5x + 2x) + (3 − 1) = 7x + 2.",
        model: "text",
      },
      {
        title: "One-Step Inequalities (6.AT.C.9)",
        text: "Which value of x makes the inequality <b>x + 4 &gt; 9</b> true?",
        options: ["A) x = 3", "B) x = 5", "C) x = 6", "D) x = 4"],
        correctIndex: 2,
        explain: "x + 4 &gt; 9 means x &gt; 5. Only x = 6 satisfies it.",
        model: "text",
      },
    ],
    g: [
      {
        title: "Triangle Area (6.GR.A.1)",
        text: "A triangular sail has a base of <b>18 units</b> and a height of <b>8 units</b>. What is its area?",
        options: ["A) 144 sq units", "B) 72 sq units", "C) 36 sq units", "D) 90 sq units"],
        correctIndex: 1,
        explain: "Area = &frac12; &times; base &times; height = &frac12; &times; 18 &times; 8 = 72 square units.",
        model: "text",
      },
      {
        title: "Polygons on the Coordinate Grid (6.GR.A.3)",
        text: "A rectangular sandbox has vertices at <b>(2, 2)</b>, <b>(8, 2)</b>, <b>(8, 6)</b>, and <b>(2, 6)</b>. What is its area?",
        options: ["A) 24 sq units", "B) 18 sq units", "C) 20 sq units", "D) 12 sq units"],
        correctIndex: 0,
        explain: "Length = 8 − 2 = 6; width = 6 − 2 = 4; area = 6 &times; 4 = 24 square units.",
        model: "coordinate-grid",
      },
      {
        title: "Volume of a Prism (6.GR.A.2)",
        text: "A box measures <b>5 cm &times; 4 cm &times; 3 cm</b>. What is its volume?",
        options: ["A) 12 cm&sup3;", "B) 60 cm&sup3;", "C) 47 cm&sup3;", "D) 120 cm&sup3;"],
        correctIndex: 1,
        explain: "Volume = length &times; width &times; height = 5 &times; 4 &times; 3 = 60 cm&sup3;.",
        model: "text",
      },
      {
        title: "Surface Area (6.GR.A.4)",
        text: "What is the surface area of a cube with edge length <b>3 cm</b>?",
        options: ["A) 27 cm&sup2;", "B) 54 cm&sup2;", "C) 36 cm&sup2;", "D) 18 cm&sup2;"],
        correctIndex: 1,
        explain: "A cube has 6 faces: 6 &times; (3 &times; 3) = 6 &times; 9 = 54 cm&sup2;.",
        model: "text",
      },
      {
        title: "Parallelogram Area (6.GR.A.1)",
        text: "A parallelogram has a base of <b>12 m</b> and a height of <b>7 m</b>. What is its area?",
        options: ["A) 19 m&sup2;", "B) 84 m&sup2;", "C) 42 m&sup2;", "D) 38 m&sup2;"],
        correctIndex: 1,
        explain: "Area = base &times; height = 12 &times; 7 = 84 m&sup2;.",
        model: "text",
      },
    ],
    sp: [
      {
        title: "Median (6.DS.B.5c)",
        text: "A student scored <b>85, 90, 85, 70, and 95</b> on five quizzes. What is the <b>median</b>?",
        options: ["A) 85", "B) 90", "C) 80", "D) 88"],
        correctIndex: 0,
        explain: "Ordered: 70, 85, 85, 90, 95. The middle value is 85.",
        model: "text",
      },
      {
        title: "Range (6.DS.B.5)",
        text: "A data set has values <b>2, 3, 5, 8, 12</b>. What is the range?",
        options: ["A) 8", "B) 9", "C) 10", "D) 7"],
        correctIndex: 2,
        explain: "Range = maximum − minimum = 12 − 2 = 10.",
        model: "text",
      },
      {
        title: "Mean (6.DS.B.5c)",
        text: "Find the <b>mean</b> of <b>4, 8, 6, 10, and 2</b>.",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correctIndex: 1,
        explain: "Sum = 30; 30 &divide; 5 = 6.",
        model: "text",
      },
      {
        title: "Statistical Questions (6.DS.A.1)",
        text: "Which of these is a <b>statistical question</b>?",
        options: [
          "A) How tall is the teacher?",
          "B) How many days are in June?",
          "C) How tall are the students in my class?",
          "D) What is 5 × 6?",
        ],
        correctIndex: 2,
        explain: "A statistical question anticipates variability — heights vary across students.",
        model: "text",
      },
      {
        title: "Mean Absolute Deviation (6.DS.B.5c)",
        text: "The data set <b>3, 5, 7</b> has a mean of 5. What is its <b>mean absolute deviation</b>?",
        options: ["A) 1", "B) 4/3", "C) 2", "D) 5/3"],
        correctIndex: 1,
        explain: "Distances from 5: 2, 0, 2 → sum 4; 4 &divide; 3 = 4/3.",
        model: "text",
      },
    ],
  };

  const DOMAIN_LABELS = {
    ns: "Number System (NS)",
    rp: "Ratios & Rates (RP)",
    ee: "Expressions & Equations (EE)",
    g: "Geometry & Area (G)",
    sp: "Statistics (SP)",
  };

  /* ----------------------------------------------------------------------
     4. CONFIG VALIDATION + SELF-TEST (diagnostics)
     ---------------------------------------------------------------------- */
  function validateConfig() {
    const required = ["theme", "defaultVal1", "defaultVal2", "defaultA", "defaultB", "defaultC"];
    return required.every((k) => k in CONFIG);
  }
  function selfTest() {
    const ids = ["decVal1", "decVal2", "eqA", "eqB", "eqC", "ratioAInput", "ratioBInput", "scaleSlider"];
    return ids.every((id) => $(id));
  }

  /* ----------------------------------------------------------------------
     5. GRADED PRACTICE STATE
     ---------------------------------------------------------------------- */
  let homeworkAnswers = {};
  let studentSelectedOption = {};
  let activeQuestions = [];

  /* ----------------------------------------------------------------------
     6. TAB NAVIGATION  (now also keyboard + ARIA aware)
     ---------------------------------------------------------------------- */
  function switchTab(tabId) {
    document.querySelectorAll("section.tab-panel").forEach((s) => {
      s.classList.remove("active");
      s.hidden = true;
    });
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
      b.tabIndex = -1;
    });
    const panel = $(tabId);
    const btn = $("btn-" + tabId);
    if (panel) {
      panel.classList.add("active");
      panel.hidden = false;
    }
    if (btn) {
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      btn.tabIndex = 0;
    }
    if (tabId === "ratios") updateRatioLab();
  }

  /* ----------------------------------------------------------------------
     7. LANGUAGE HELP TOGGLE
     ---------------------------------------------------------------------- */
  function toggleLanguage() {
    document.body.classList.toggle("show-spanish");
    const active = document.body.classList.contains("show-spanish");
    const t = $("langToggle");
    if (t) {
      t.textContent = active ? "EN English Help" : "Spanish Help";
      t.setAttribute("aria-pressed", String(active));
    }
    showToast(active ? "Spanish terms overlay active." : "English terms active.");
    saveState({ spanish: active });
  }

  let toastTimer = null;
  function showToast(msg) {
    let toast = $("nt-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "nt-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.style.cssText =
        "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);" +
        "background:var(--navy);color:#fff;padding:10px 22px;border-radius:999px;" +
        "font-weight:800;font-size:.85rem;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.25);" +
        "max-width:90vw;text-align:center;transition:opacity .25s ease;";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2200);
  }

  /* ----------------------------------------------------------------------
     8. DECIMAL SOLVER ENGINE
     ---------------------------------------------------------------------- */
  function updateDecSolver() {
    const fb = $("decFeedback");
    // Reset via the class (CSS hides .feedback-box). An inline display:none
    // would beat the .correct/.wrong rules and keep the box hidden forever.
    if (fb) fb.className = "feedback-box";
  }

  function checkDecimalSolver() {
    const v1 = parseFloat($("decVal1").value);
    const v2 = parseFloat($("decVal2").value);
    const op = $("decOp").value;
    const user = parseFloat($("decUserAns").value);
    const fb = $("decFeedback");

    if (isNaN(v1) || isNaN(v2) || isNaN(user)) {
      fb.textContent = "Please fill in all decimal value inputs.";
      fb.className = "feedback-box wrong";
      return;
    }
    if (op === "/" && v2 === 0) {
      fb.textContent = "You cannot divide by zero. Change Value 2 and try again.";
      fb.className = "feedback-box wrong";
      return;
    }

    let correct = 0;
    if (op === "+") correct = v1 + v2;
    else if (op === "-") correct = v1 - v2;
    else if (op === "*") correct = v1 * v2;
    else if (op === "/") correct = v1 / v2;
    correct = parseFloat(correct.toFixed(3));

    const symbol = { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op;
    if (Math.abs(user - correct) < 0.01) {
      fb.textContent = `Correct! ${v1} ${symbol} ${v2} = ${correct}. Great decimal alignment!`;
      fb.className = "feedback-box correct";
      triggerConfetti(30);
    } else {
      fb.textContent = `Keep practicing! Mr. Neft calculated ${correct}. Re-check your alignment, carrying, or borrowing.`;
      fb.className = "feedback-box wrong";
    }
  }

  /* ----------------------------------------------------------------------
     9. EQUATION SOLVER ENGINE  (ax + b = c)
     ---------------------------------------------------------------------- */
  function checkEquationSolver() {
    const a = parseFloat($("eqA").value);
    const b = parseFloat($("eqB").value);
    const c = parseFloat($("eqC").value);
    const user = parseFloat($("eqUserAns").value);
    const fb = $("eqFeedback");

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(user)) {
      fb.textContent = "Please fill in all algebraic values.";
      fb.className = "feedback-box wrong";
      return;
    }
    if (a === 0) {
      fb.textContent = "Coefficient a cannot be 0 — then there is no single x to solve for.";
      fb.className = "feedback-box wrong";
      return;
    }

    const step1 = c - b;
    const correct = parseFloat((step1 / a).toFixed(2));

    if (Math.abs(user - correct) < 0.01) {
      fb.innerHTML =
        `<b>Correct!</b> Solving step-by-step:` +
        `<br>• Step 1 (subtract b): <b>${a}x = ${c} − ${b} → ${a}x = ${step1}</b>.` +
        `<br>• Step 2 (divide by a): <b>x = ${step1} ÷ ${a} → x = ${correct}</b>.`;
      fb.className = "feedback-box correct";
      triggerConfetti(30);
    } else {
      fb.textContent = `Keep practicing! Subtract b (${b}) from c (${c}) to get ${step1}, then divide by a (${a}) to isolate x.`;
      fb.className = "feedback-box wrong";
    }
  }

  /* ----------------------------------------------------------------------
     10. RATIO SCALES ENGINE
     ---------------------------------------------------------------------- */
  function updateRatioLab() {
    const a = parseInt($("ratioAInput").value, 10);
    const b = parseInt($("ratioBInput").value, 10);
    const k = parseInt($("scaleSlider").value, 10);

    // Cap base terms: drawRatioVisual renders (a+b)*k circles, so unbounded
    // input could spawn thousands of SVG nodes and freeze the tab.
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0 || a > 20 || b > 20) return;

    $("scaleVal").textContent = k + "x";
    $("ratioBaseVal").textContent = `${a} : ${b}`;
    $("ratioScaleVal").textContent = `k = ${k}`;
    $("ratioResultVal").textContent = `Equivalent Ratio = ${a * k} : ${b * k}`;

    drawRatioVisual(a, b, k);
  }

  function drawRatioVisual(a, b, k) {
    const svg = $("ratio-visual");
    if (!svg) return;
    svg.innerHTML = "";
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `Visual model of the ratio ${a} to ${b} scaled by ${k}, giving ${a * k} to ${b * k}.`
    );

    const maxTotal = (a + b) * k;
    const size = maxTotal > 15 ? 12 : 20;
    const gap = 6;
    let cx = 10;
    let cy = 35;
    const NS = "http://www.w3.org/2000/svg";

    const place = (count, fill, stroke) => {
      for (let i = 0; i < count; i++) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", cx);
        c.setAttribute("cy", cy);
        c.setAttribute("r", size / 2);
        c.setAttribute("fill", fill);
        c.setAttribute("stroke", stroke);
        c.setAttribute("stroke-width", "1");
        svg.appendChild(c);
        cx += size + gap;
        if (cx > 280) {
          cx = 10;
          cy += size + gap;
        }
      }
    };

    place(a * k, "var(--teal)", "var(--teal-dark)");
    cx += 10;
    place(b * k, "var(--gold)", "#5d3f0f");
  }

  /* ----------------------------------------------------------------------
     11. SVG MODELS for graded questions
     ---------------------------------------------------------------------- */
  function drawRatioTapeSVG(a, b) {
    const blockW = 40,
      blockH = 25,
      startX = 60,
      width = 320,
      height = 100;
    let svg = `<svg width="${width}" height="${height}" role="img" aria-label="Ratio tape diagram of flour to water" style="background:#fff;border:1px solid var(--neft-line);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.05)" viewBox="0 0 ${width} ${height}">`;
    svg += `<text x="10" y="32" font-family="'Lexend',sans-serif" font-size="11" font-weight="bold" fill="var(--navy)">Flour</text>`;
    for (let i = 0; i < a; i++) {
      const x = startX + i * blockW;
      svg += `<rect x="${x}" y="15" width="${blockW}" height="${blockH}" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" rx="3"/>`;
      svg += `<text x="${x + blockW / 2}" y="32" font-family="'Lexend',sans-serif" font-size="10" font-weight="bold" fill="#0369a1" text-anchor="middle">5</text>`;
    }
    svg += `<text x="${startX + a * blockW + 8}" y="32" font-family="'Lexend',sans-serif" font-size="11" font-weight="bold" fill="#0369a1">? (15)</text>`;
    svg += `<text x="10" y="72" font-family="'Lexend',sans-serif" font-size="11" font-weight="bold" fill="var(--navy)">Water</text>`;
    for (let j = 0; j < b; j++) {
      const x = startX + j * blockW;
      svg += `<rect x="${x}" y="55" width="${blockW}" height="${blockH}" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="3"/>`;
      svg += `<text x="${x + blockW / 2}" y="72" font-family="'Lexend',sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">5</text>`;
    }
    svg += `<text x="${startX + b * blockW + 8}" y="72" font-family="'Lexend',sans-serif" font-size="11" font-weight="bold" fill="#b45309">25</text>`;
    return svg + "</svg>";
  }

  function drawCoordinateGridSVG() {
    const width = 240,
      height = 240,
      margin = 25,
      size = 190;
    let svg = `<svg width="${width}" height="${height}" role="img" aria-label="Coordinate grid showing a rectangle with vertices at (2,2), (8,2), (8,6), (2,6)" style="background:#fff;border:1px solid var(--neft-line);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.05)" viewBox="0 0 ${width} ${height}">`;
    for (let i = 0; i <= 10; i++) {
      const sx = margin + i * 19,
        sy = margin + i * 19;
      svg += `<line x1="${sx}" y1="${margin}" x2="${sx}" y2="${margin + size}" stroke="#e2e8f0"/>`;
      svg += `<line x1="${margin}" y1="${sy}" x2="${margin + size}" y2="${sy}" stroke="#e2e8f0"/>`;
    }
    const axisY = margin + 10 * 19,
      axisX = margin;
    svg += `<line x1="${axisX}" y1="${axisY}" x2="${margin + size}" y2="${axisY}" stroke="#1e293b" stroke-width="2"/>`;
    svg += `<line x1="${axisX}" y1="${margin}" x2="${axisX}" y2="${axisY}" stroke="#1e293b" stroke-width="2"/>`;
    for (let i = 0; i <= 10; i += 2) {
      const sx = margin + i * 19,
        sy = margin + (10 - i) * 19;
      svg += `<line x1="${sx}" y1="${axisY}" x2="${sx}" y2="${axisY + 4}" stroke="#1e293b" stroke-width="1.5"/>`;
      svg += `<text x="${sx}" y="${axisY + 16}" font-family="'Lexend',sans-serif" font-size="9" text-anchor="middle" fill="#475569">${i}</text>`;
      if (i > 0) {
        svg += `<line x1="${axisX - 4}" y1="${sy}" x2="${axisX}" y2="${sy}" stroke="#1e293b" stroke-width="1.5"/>`;
        svg += `<text x="${axisX - 8}" y="${sy + 3}" font-family="'Lexend',sans-serif" font-size="9" text-anchor="end" fill="#475569">${i}</text>`;
      }
    }
    const rx = margin + 2 * 19,
      ry = margin + (10 - 6) * 19,
      rw = (8 - 2) * 19,
      rh = (6 - 2) * 19;
    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgba(13,148,136,.25)" stroke="#0d9488" stroke-width="2" stroke-dasharray="3,3"/>`;
    [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 6 },
      { x: 2, y: 6 },
    ].forEach((v) => {
      const vx = margin + v.x * 19,
        vy = margin + (10 - v.y) * 19;
      svg += `<circle cx="${vx}" cy="${vy}" r="4" fill="#0f172a" stroke="#fff"/>`;
      let dy = -8,
        dx = 0;
      if (v.y === 2) dy = 14;
      if (v.x === 8) dx = 4;
      if (v.x === 2) dx = -4;
      svg += `<text x="${vx + dx}" y="${vy + dy}" font-family="'Lexend',sans-serif" font-size="8" font-weight="bold" fill="#0f172a" text-anchor="middle">(${v.x},${v.y})</text>`;
    });
    return svg + "</svg>";
  }

  /* ----------------------------------------------------------------------
     12. GRADED HOMEWORK SHEET
     ---------------------------------------------------------------------- */
  function selectedDomains() {
    const map = { domNS: "ns", domRP: "rp", domEE: "ee", domG: "g", domSP: "sp" };
    const out = [];
    Object.keys(map).forEach((id) => {
      const el = $(id);
      if (el && el.checked) out.push(map[id]);
    });
    return out;
  }

  function desiredCount() {
    const sel = $("questionCount");
    const n = sel ? parseInt(sel.value, 10) : 4;
    return [4, 6, 8].includes(n) ? n : 4;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateCustomHomework() {
    let domains = selectedDomains();
    if (!domains.length) domains = Object.keys(QUESTION_DATABASE);

    let pool = [];
    domains.forEach((d) => {
      if (QUESTION_DATABASE[d]) pool = pool.concat(QUESTION_DATABASE[d]);
    });
    if (pool.length < desiredCount()) {
      pool = [];
      Object.keys(QUESTION_DATABASE).forEach((d) => (pool = pool.concat(QUESTION_DATABASE[d])));
    }

    const count = Math.min(desiredCount(), pool.length);
    activeQuestions = shuffle(pool).slice(0, count);

    homeworkAnswers = {};
    studentSelectedOption = {};
    for (let i = 1; i <= count; i++) {
      homeworkAnswers[i] = null;
      studentSelectedOption[i] = null;
    }

    $("finalScoreCard").style.display = "none";
    $("progressBar").style.width = "0%";
    $("progressCount").textContent = `0 / ${count} Answered`;
    $("progressStatus").textContent = "GRADE: -- / 100";

    const track = document.querySelector(".progress-track");
    if (track) {
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", "0");
    }

    const pts = Math.round(100 / count);
    const wrap = $("dynamicQuestionsWrap");
    wrap.innerHTML = "";

    activeQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      let modelHtml = "";
      if (q.model === "ratio-tape") {
        modelHtml = `<div style="display:flex;justify-content:center;margin:10px 0">${drawRatioTapeSVG(3, 5)}</div>`;
      } else if (q.model === "coordinate-grid") {
        modelHtml = `<div style="display:flex;justify-content:center;margin:10px 0">${drawCoordinateGridSVG()}</div>`;
      }

      const optionsHtml = q.options
        .map(
          (opt, optIdx) =>
            `<button type="button" class="q-option" role="radio" aria-checked="false" data-q="${idx}" data-opt="${optIdx}">${opt}</button>`
        )
        .join("");

      const card = document.createElement("div");
      card.className = "test-card";
      card.id = `q${qNum}-card`;
      card.innerHTML =
        `<div class="q-header">` +
        `<span class="q-badge" style="background:var(--navy);color:#fff;padding:4px 8px;border-radius:8px;font-weight:800;font-size:.75rem">${q.title}</span>` +
        `<span class="q-points" style="font-size:.8rem;color:var(--muted);font-weight:bold">${pts} pts</span>` +
        `</div>` +
        `<p class="q-text" style="font-size:.95rem;margin:10px 0">${q.text}</p>` +
        modelHtml +
        `<div class="q-options" role="radiogroup" aria-label="Answer choices for question ${qNum}" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">${optionsHtml}</div>`;
      wrap.appendChild(card);
    });

    showToast(`Generated a ${count}-question MCAP homework sheet.`);
    saveState({ domains: selectedDomains(), count });
  }

  function selectOption(qIdx, optIdx) {
    const qNum = qIdx + 1;
    // Lock the question once answered to protect grade integrity.
    if (homeworkAnswers[qNum] !== null) return;

    const question = activeQuestions[qIdx];
    const isCorrect = optIdx === question.correctIndex;
    homeworkAnswers[qNum] = isCorrect;
    studentSelectedOption[qNum] = question.options[optIdx];

    const card = $(`q${qNum}-card`);
    const options = card.querySelectorAll(".q-option");
    options.forEach((opt) => {
      opt.disabled = true;
      opt.setAttribute("aria-checked", "false");
    });
    options[optIdx].classList.add(isCorrect ? "correct" : "incorrect");
    options[optIdx].setAttribute("aria-checked", "true");

    if (isCorrect) {
      card.className = "test-card correct-card";
      showToast("Well done!");
    } else {
      card.className = "test-card wrong-card";
      options[question.correctIndex].classList.add("correct");
    }
    updateHomeworkProgress();
  }

  function updateHomeworkProgress() {
    const total = activeQuestions.length || 4;
    let answered = 0,
      correctCount = 0;
    for (const q in homeworkAnswers) {
      if (homeworkAnswers[q] !== null) {
        answered++;
        if (homeworkAnswers[q] === true) correctCount++;
      }
    }

    const pct = Math.round((answered / total) * 100);
    $("progressBar").style.width = pct + "%";
    $("progressCount").textContent = `${answered} / ${total} Answered`;
    const track = document.querySelector(".progress-track");
    if (track) track.setAttribute("aria-valuenow", String(pct));

    if (answered === total) {
      const finalScore = Math.round((correctCount / total) * 100);
      $("progressStatus").textContent = `GRADE: ${finalScore}%`;

      const explains = $("feedbackExplains");
      explains.innerHTML = "";
      activeQuestions.forEach((question, i) => {
        const qNum = i + 1;
        const isCorrect = homeworkAnswers[qNum];
        explains.innerHTML +=
          `<div class="explain-item" style="border-left:3px solid ${isCorrect ? "var(--teal)" : "var(--gold)"};padding-left:10px;margin-bottom:12px">` +
          `<b>Question ${qNum}: ${question.title} (${isCorrect ? "✓ CORRECT" : "✗ REVIEW"})</b>` +
          `<p style="margin:2px 0 0;font-size:.88rem;color:var(--muted)">${question.explain}</p>` +
          `</div>`;
      });

      $("finalGrade").textContent = `${finalScore}%`;
      const summary = $("scoreSummary");
      if (summary) {
        summary.textContent =
          finalScore === 100
            ? "Outstanding! You solved every problem correctly across the selected domains."
            : `You scored ${correctCount} of ${total}. Review the worked solutions below, then retry to raise your score.`;
      }
      const scoreCard = $("finalScoreCard");
      scoreCard.style.display = "block";
      if (typeof scoreCard.scrollIntoView === "function") {
        scoreCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      // Persist best grade + attempt count for save/resume.
      const st = loadState();
      const best = Math.max(st.bestGrade || 0, finalScore);
      saveState({ bestGrade: best, attempts: (st.attempts || 0) + 1, lastGrade: finalScore });

      try {
        if (window.EduPulse) {
          EduPulse.record({
            activityTitle: document.title,
            score: correctCount,
            maxScore: total,
            percent: finalScore,
            problemsCorrect: correctCount,
            problemsAttempted: total,
          });
        }
      } catch (e) {
        /* analytics optional */
      }

      if (finalScore === 100) {
        triggerConfetti(65);
        showToast("🎖️ Perfect score achieved!");
      } else {
        showToast("Practice complete — study the solutions below!");
      }
    }
  }

  function resetHomeworkTest() {
    $("finalScoreCard").style.display = "none";
    generateCustomHomework();
    showToast("Homework sheet reset.");
  }

  /* ----------------------------------------------------------------------
     13. CLEAN .DOC EXPORT  (fixed: real interpolation, real BOM,
         no embedded </script> or template-escape bugs)
     ---------------------------------------------------------------------- */
  function downloadCleanDocx() {
    const total = activeQuestions.length || 4;
    let answered = 0,
      correctCount = 0;
    for (const q in homeworkAnswers) {
      if (homeworkAnswers[q] !== null) {
        answered++;
        if (homeworkAnswers[q] === true) correctCount++;
      }
    }
    const finalScore = answered > 0 ? Math.round((correctCount / total) * 100) : 0;
    const today = new Date().toLocaleDateString();

    const head =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8"><title>MCAP Homework Practice Submission</title><style>` +
      `body{font-family:'Calibri','Arial',sans-serif;line-height:1.5;color:#333;margin:1in}` +
      `h1{color:#0d9488;font-size:20pt;border-bottom:2px solid #0d9488;padding-bottom:6px;font-family:'Georgia',serif}` +
      `.metadata{font-size:11pt;margin-bottom:20pt;background:#f8fafc;padding:10px;border:1px solid #e2e8f0}` +
      `.score-banner{font-size:14pt;font-weight:bold;color:#16a34a;margin-bottom:15pt}` +
      `.q-box{border:1px solid #cbd5e1;padding:12px;margin-bottom:15px;background:#fff}` +
      `.q-text{font-weight:bold;font-size:11pt;color:#0f172a}` +
      `.choices{margin-left:15px;margin-top:5px;font-size:11pt}` +
      `.choice-item{margin-bottom:2px}` +
      `.selected-choice{font-weight:bold;color:#0d9488}` +
      `.incorrect-choice{font-weight:bold;color:#ef4444}` +
      `.explain-box{margin-top:8px;font-style:italic;color:#475569;font-size:10pt;background:#f1f5f9;padding:8px;border-left:3px solid #0d9488}` +
      `.correct-badge{color:#16a34a;font-weight:bold}.incorrect-badge{color:#ef4444;font-weight:bold}` +
      `.footer{text-align:center;font-size:9pt;color:#64748b;margin-top:30pt;border-top:1px solid #e2e8f0;padding-top:10px}` +
      `</style></head><body>`;

    let body =
      `<h1>MCAP Homework Practice Report</h1>` +
      `<div class="metadata">` +
      `<p><strong>Student Name:</strong> ___________________________</p>` +
      `<p><strong>Date of Submission:</strong> ${today}</p>` +
      `<p><strong>Subject:</strong> Grade 6 Mathematics MCAP Review</p>` +
      `<p><strong>Progress:</strong> ${answered} / ${total} Questions Solved</p>` +
      `<p class="score-banner"><strong>Performance Grade:</strong> ${finalScore}%</p>` +
      `</div>`;

    activeQuestions.forEach((q, i) => {
      const qNum = i + 1;
      const isCorrect = homeworkAnswers[qNum];
      const selected = studentSelectedOption[qNum];

      body += `<div class="q-box"><p class="q-text">Question ${qNum}: ${q.title}<br>${q.text}</p><div class="choices">`;
      q.options.forEach((opt, optIdx) => {
        const isSelected = selected === opt;
        const isCorrectOption = optIdx === q.correctIndex;
        let cls = "choice-item";
        let prefix = "   ";
        if (isSelected) {
          if (isCorrect) {
            cls += " selected-choice";
            prefix = "&#10003; [STUDENT CHOICE] ";
          } else {
            cls += " incorrect-choice";
            prefix = "&#10007; [STUDENT CHOICE] ";
          }
        } else if (isCorrectOption && selected !== null) {
          cls += " selected-choice";
          prefix = "&#9733; [CORRECT CHOICE] ";
        }
        body += `<div class="${cls}">${prefix}${opt}</div>`;
      });

      const status =
        selected === null
          ? '<span style="color:#eab308;font-weight:bold">UNANSWERED</span>'
          : isCorrect
            ? '<span class="correct-badge">CORRECT</span>'
            : '<span class="incorrect-badge">INCORRECT</span>';
      body +=
        `</div><p style="margin-top:10px"><strong>Status:</strong> ${status}</p>` +
        `<div class="explain-box"><strong>Step-by-Step Mathematical Solution:</strong><br>${q.explain}</div></div>`;
    });

    body +=
      `<div class="footer"><p>Generated by Mr. Neft's MCAP Homework Practice Studio — classroom-ready static HTML activities</p></div>` +
      `</body></html>`;

    const blob = new Blob(["\ufeff" + head + body], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MCAP_Homework_Submission_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Word document generated successfully!");
  }

  /* ----------------------------------------------------------------------
     14. CONFETTI  (respects reduced-motion)
     ---------------------------------------------------------------------- */
  function triggerConfetti(count) {
    const box = $("confettiBox");
    if (!box) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.innerHTML = "";
    const colors = ["#0d9488", "#ea580c", "#d97706", "#16a34a", "#3b82f6"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.floor(Math.random() * 8) + 6;
      p.style.width = p.style.height = size + "px";
      p.style.left = Math.floor(Math.random() * 100) + "%";
      p.style.top = Math.floor(Math.random() * 20) + 40 + "%";
      p.style.setProperty("--dx", (Math.random() - 0.5) * 400 + "px");
      p.style.setProperty("--dy", Math.random() * 300 + 150 + "px");
      box.appendChild(p);
    }
  }

  /* ----------------------------------------------------------------------
     15. RESET ALL
     ---------------------------------------------------------------------- */
  function resetAllData() {
    $("decVal1").value = CONFIG.defaultVal1;
    $("decVal2").value = CONFIG.defaultVal2;
    $("decOp").value = "+";
    $("decUserAns").value = "";
    // Reset via class (not inline display:none, which would beat the
    // .correct/.wrong rules and keep the box hidden on the next Verify).
    $("decFeedback").className = "feedback-box";

    $("eqA").value = CONFIG.defaultA;
    $("eqB").value = CONFIG.defaultB;
    $("eqC").value = CONFIG.defaultC;
    $("eqUserAns").value = "";
    $("eqFeedback").className = "feedback-box";

    $("ratioAInput").value = 3;
    $("ratioBInput").value = 2;
    $("scaleSlider").value = 2;

    document.body.classList.remove("show-spanish");
    const t = $("langToggle");
    if (t) {
      t.textContent = "Spanish Help";
      t.setAttribute("aria-pressed", "false");
    }

    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {}

    updateRatioLab();
    resetHomeworkTest();
    showToast("Studio reset to defaults.");
  }

  /* ----------------------------------------------------------------------
     16. EVENT WIRING + INIT
     ---------------------------------------------------------------------- */
  function restorePreferences() {
    const st = loadState();
    if (st.spanish) {
      document.body.classList.add("show-spanish");
      const t = $("langToggle");
      if (t) {
        t.textContent = "EN English Help";
        t.setAttribute("aria-pressed", "true");
      }
    }
    if (Array.isArray(st.domains)) {
      const map = { ns: "domNS", rp: "domRP", ee: "domEE", g: "domG", sp: "domSP" };
      Object.keys(map).forEach((d) => {
        const el = $(map[d]);
        if (el) el.checked = st.domains.includes(d);
      });
      // never leave the student with zero domains selected
      if (!selectedDomains().length) {
        ["domNS", "domRP", "domEE", "domG", "domSP"].forEach((id) => {
          if ($(id)) $(id).checked = true;
        });
      }
    }
    const sel = $("questionCount");
    if (sel && [4, 6, 8].includes(st.count)) sel.value = String(st.count);

    const badge = $("bestGradeBadge");
    if (badge && st.bestGrade) {
      badge.hidden = false;
      badge.textContent = `Personal best: ${st.bestGrade}% · ${st.attempts || 0} attempt${
        (st.attempts || 0) === 1 ? "" : "s"
      }`;
    }
  }

  function wireDelegatedHandlers() {
    // Answer-choice selection via delegation (keeps generated markup clean).
    const wrap = $("dynamicQuestionsWrap");
    if (wrap) {
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".q-option");
        if (!btn || btn.disabled) return;
        selectOption(parseInt(btn.dataset.q, 10), parseInt(btn.dataset.opt, 10));
      });
    }
    const sel = $("questionCount");
    if (sel) sel.addEventListener("change", generateCustomHomework);
  }

  function init() {
    if (!validateConfig() || !selfTest()) {
      log("MCAP Homework init aborted: required nodes missing.");
      return;
    }
    const yr = $("currentYear");
    if (yr) yr.textContent = new Date().getFullYear();

    restorePreferences();
    wireDelegatedHandlers();
    updateRatioLab();
    generateCustomHomework();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ----------------------------------------------------------------------
     17. PUBLIC API  (referenced by inline handlers in index.html)
     ---------------------------------------------------------------------- */
  Object.assign(window, {
    switchTab,
    toggleLanguage,
    updateDecSolver,
    checkDecimalSolver,
    checkEquationSolver,
    updateRatioLab,
    generateCustomHomework,
    selectOption,
    resetHomeworkTest,
    downloadCleanDocx,
    resetAllData,
    triggerConfetti,
  });
})();
