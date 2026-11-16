/**
 * Shared Instructional Interaction System & Flagship Explanation Theaters
 * Implements: Predict -> Manipulate -> Observe -> Explain -> Apply
 * Plus Living Guided Notes, Reasoning & Math Defense, Misconception Loop, and Partner Info-Gap.
 */
import { FLAGSHIP_DATA } from "./flagship-data.mjs";
import { diagnoseResponse } from "./misconception-engine.mjs";

const STORAGE_PREFIX = "ewl_studio_state_v1_";

function loadState(lessonId) {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`) || "{}");
  } catch {
    return {};
  }
}

function saveState(lessonId, patch) {
  try {
    const next = { ...loadState(lessonId), ...patch };
    localStorage.setItem(`${STORAGE_PREFIX}${lessonId}`, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") node.className = v;
    else if (k === "hidden") node.hidden = Boolean(v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

function buildPredictBlock(lessonId, theater, state) {
  const feedback = el("p", { className: "studio-feedback", "aria-live": "polite" });
  const options = el("div", { className: "studio-choice-list" });
  for (const opt of theater.predictOptions) {
    const btn = el(
      "button",
      {
        type: "button",
        className: `studio-choice-btn${state.predicted === opt.id ? " is-selected" : ""}`,
        "aria-pressed": state.predicted === opt.id ? "true" : "false",
        onClick: () => {
          saveState(lessonId, { predicted: opt.id });
          for (const b of options.querySelectorAll("button")) {
            b.classList.remove("is-selected");
            b.setAttribute("aria-pressed", "false");
          }
          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
          feedback.textContent = opt.correct
            ? "Prediction logged! Now manipulate the model below to verify why."
            : "Prediction logged! Test it in the interactive model below to see what actually happens.";
          feedback.dataset.tone = opt.correct ? "ok" : "warn";
        },
      },
      opt.label,
    );
    options.append(btn);
  }
  return el(
    "div",
    { className: "studio-step-box" },
    el("h4", {}, "1. Predict"),
    el("p", { className: "studio-prompt" }, theater.predictPrompt),
    options,
    feedback,
  );
}

function buildAlgebraTheater(theater, lang) {
  let xVal = theater.defaultX || 3;
  const wrap = el("div", { className: "studio-manipulate-grid" });

  const slider = el("input", {
    type: "range",
    min: theater.minX,
    max: theater.maxX,
    value: xVal,
    id: "theater-x-slider",
    "aria-label": "Number of tickets x",
  });
  const xReadout = el("strong", { className: "studio-kpi-num" }, String(xVal));
  const totalReadout = el("strong", { className: "studio-kpi-num" }, `$${8 * xVal}`);
  const repeatedReadout = el("code", { className: "studio-math-code" });
  const tilesBox = el("div", { className: "studio-tiles-svg", role: "img", "aria-label": "Algebra tiles model" });
  const tableBody = el("tbody");

  const render = () => {
    const total = 8 * xVal;
    xReadout.textContent = String(xVal);
    totalReadout.textContent = `$${total}`;
    repeatedReadout.textContent = `${Array(xVal).fill("8").join(" + ")} = 8(${xVal}) = ${total}`;

    // Crisp SVG algebra tiles (x-groups of 8)
    const width = 460;
    const rowH = 26;
    const height = Math.max(70, xVal * rowH + 16);
    let rects = "";
    for (let r = 0; r < xVal; r++) {
      const y = 8 + r * rowH;
      rects += `<rect x="8" y="${y}" width="64" height="20" rx="4" fill="#12355b"/><text x="40" y="${y + 14}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">1 ticket</text>`;
      for (let c = 0; c < 8; c++) {
        const cx = 84 + c * 22;
        rects += `<rect x="${cx}" y="${y}" width="18" height="20" rx="3" fill="#0f766e"/><text x="${cx + 9}" y="${y + 14}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">$1</text>`;
      }
      rects += `<text x="272" y="${y + 14}" fill="#172a3a" font-size="12" font-weight="700">= $8</text>`;
    }
    tilesBox.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:460px;background:#fbfaf7;border:1px solid #d4e0e3;border-radius:8px">${rects}</svg>`;

    tableBody.replaceChildren();
    for (let i = 1; i <= 5; i++) {
      const tr = el(
        "tr",
        { className: i === xVal ? "is-active-row" : "" },
        el("td", {}, String(i)),
        el("td", {}, `8(${i})`),
        el("td", {}, `$${8 * i}`),
      );
      tableBody.append(tr);
    }
  };

  slider.addEventListener("input", () => {
    xVal = Number(slider.value);
    render();
  });
  render();

  const controls = el(
    "div",
    { className: "studio-controls-panel" },
    el("p", { className: "studio-scenario" }, lang === "es" ? theater.scenarioEs : theater.scenario),
    el("label", { htmlFor: "theater-x-slider", className: "studio-slider-label" }, "Adjust x (tickets): ", xReadout),
    slider,
    el("div", { className: "studio-kpi-row" }, el("span", {}, "Expression: ", el("code", {}, "8x")), el("span", {}, "Total cost: ", totalReadout)),
    el("p", { className: "studio-observe-line" }, "Repeated addition vs. multiplication: ", repeatedReadout),
  );

  const table = el(
    "table",
    { className: "studio-mini-table" },
    el("thead", {}, el("tr", {}, el("th", {}, "x"), el("th", {}, "8x"), el("th", {}, "Cost"))),
    tableBody,
  );

  wrap.append(controls, el("div", { className: "studio-visual-panel" }, tilesBox, table));
  return wrap;
}

function buildGeometryTheater(theater, lang) {
  let b = theater.defaultBase || 14;
  let h = theater.defaultHeight || 9;
  let slidePct = 0;

  const baseSlider = el("input", { type: "range", min: 6, max: 18, value: b, id: "geo-base-slider", "aria-label": "Base b" });
  const heightSlider = el("input", { type: "range", min: 4, max: 12, value: h, id: "geo-height-slider", "aria-label": "Perpendicular height h" });
  const slideSlider = el("input", { type: "range", min: 0, max: 100, value: 0, id: "geo-slide-slider", "aria-label": "Slice and slide triangle transformation" });

  const bOut = el("strong", {}, `${b} ft`);
  const hOut = el("strong", {}, `${h} ft`);
  const areaOut = el("strong", { className: "studio-kpi-num" }, `${b * h} ft²`);
  const svgHost = el("div", { className: "studio-tiles-svg" });

  const render = () => {
    bOut.textContent = `${b} ft`;
    hOut.textContent = `${h} ft`;
    areaOut.textContent = `${b * h} ft²`;
    const scale = 16;
    const skew = 48;
    const x0 = 40;
    const yTop = 28;
    const yBot = yTop + h * scale;
    const bPx = b * scale;
    const dx = (slidePct / 100) * bPx;

    // Left triangle: (x0, yBot) -> (x0+skew, yTop) -> (x0+skew, yBot)
    // Main trapezoid/body: (x0+skew, yTop) -> (x0+bPx+skew, yTop) -> (x0+bPx, yBot) -> (x0+skew, yBot)
    svgHost.innerHTML = `<svg viewBox="0 0 440 245" width="100%" style="max-width:440px;background:#fbfaf7;border:1px solid #d4e0e3;border-radius:8px">
      <polygon points="${x0 + skew},${yTop} ${x0 + bPx + skew},${yTop} ${x0 + bPx},${yBot} ${x0 + skew},${yBot}" fill="#dff2ef" stroke="#0f766e" stroke-width="2"/>
      <polygon points="${x0 + dx},${yBot} ${x0 + skew + dx},${yTop} ${x0 + skew + dx},${yBot}" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
      <line x1="${x0 + skew}" y1="${yTop}" x2="${x0 + skew}" y2="${yBot}" stroke="#12355b" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="${x0 + skew}" y="${yBot - 10}" width="10" height="10" fill="none" stroke="#12355b" stroke-width="1.5"/>
      <text x="${x0 + skew + 6}" y="${(yTop + yBot) / 2}" fill="#12355b" font-size="12" font-weight="800">h = ${h}</text>
      <text x="${x0 + bPx / 2}" y="${yBot + 18}" fill="#12355b" font-size="12" font-weight="800" text-anchor="middle">base b = ${b} ft</text>
      <text x="220" y="18" fill="#0f766e" font-size="12" font-weight="800" text-anchor="middle">${slidePct === 100 ? "Formed Rectangle: Area = b × h" : `Slice & Slide: ${slidePct}%`}</text>
    </svg>`;
  };

  baseSlider.addEventListener("input", () => { b = Number(baseSlider.value); render(); });
  heightSlider.addEventListener("input", () => { h = Number(heightSlider.value); render(); });
  slideSlider.addEventListener("input", () => { slidePct = Number(slideSlider.value); render(); });
  render();

  return el(
    "div",
    { className: "studio-manipulate-grid" },
    el(
      "div",
      { className: "studio-controls-panel" },
      el("p", { className: "studio-scenario" }, lang === "es" ? theater.scenarioEs : theater.scenario),
      el("label", { htmlFor: "geo-slide-slider", className: "studio-slider-label" }, "Slice & Slide Triangle → Rectangle"),
      slideSlider,
      el("label", { htmlFor: "geo-base-slider", className: "studio-slider-label" }, "Base (b): ", bOut),
      baseSlider,
      el("label", { htmlFor: "geo-height-slider", className: "studio-slider-label" }, "Perpendicular Height (h): ", hOut),
      heightSlider,
      el("div", { className: "studio-kpi-row" }, el("span", {}, "Formula: ", el("code", {}, "A = b × h")), el("span", {}, "Area: ", areaOut)),
    ),
    el("div", { className: "studio-visual-panel" }, svgHost),
  );
}

function buildDataTheater(theater, lang) {
  let outlier = 9;
  let includeExtra = false;
  const outlierSlider = el("input", { type: "range", min: 9, max: 45, value: 9, id: "data-outlier-slider", "aria-label": "Adjust largest data value" });
  const toggleBtn = el("button", { type: "button", className: "studio-btn-secondary" }, "Toggle Even Count (+12)");
  const sortedOut = el("code", { className: "studio-math-code" });
  const medianOut = el("strong", { className: "studio-kpi-num" });
  const meanOut = el("strong", { className: "studio-kpi-num" });
  const svgHost = el("div", { className: "studio-tiles-svg" });

  const render = () => {
    const raw = includeExtra ? [2, 4, 4, 6, outlier, 12] : [2, 4, 4, 6, outlier];
    const sorted = [...raw].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const mean = sorted.reduce((s, n) => s + n, 0) / sorted.length;

    sortedOut.textContent = sorted.join(", ");
    medianOut.textContent = String(median);
    meanOut.textContent = mean.toFixed(1);

    const dots = sorted
      .map((v, idx) => {
        const cx = 24 + (v / 46) * 390;
        const cy = 54 - (idx > 0 && sorted[idx - 1] === v ? 18 : 0);
        const isMid = sorted.length % 2 === 1 ? idx === mid : idx === mid - 1 || idx === mid;
        return `<circle cx="${cx}" cy="${cy}" r="8" fill="${isMid ? "#b45309" : "#0f766e"}" stroke="#12355b" stroke-width="1.5"/>
          <text x="${cx}" y="${cy + 3.5}" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">${v}</text>`;
      })
      .join("");
    const medX = 24 + (median / 46) * 390;
    const meanX = 24 + (mean / 46) * 390;
    svgHost.innerHTML = `<svg viewBox="0 0 440 105" width="100%" style="max-width:440px;background:#fbfaf7;border:1px solid #d4e0e3;border-radius:8px">
      <line x1="20" y1="74" x2="420" y2="74" stroke="#536471" stroke-width="2"/>
      <line x1="${medX}" y1="12" x2="${medX}" y2="78" stroke="#b45309" stroke-width="2.5"/>
      <text x="${medX}" y="94" text-anchor="middle" fill="#b45309" font-size="10" font-weight="800">Median ${median}</text>
      <line x1="${meanX}" y1="18" x2="${meanX}" y2="78" stroke="#12355b" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${meanX}" y="14" text-anchor="middle" fill="#12355b" font-size="10" font-weight="800">Mean ${mean.toFixed(1)}</text>
      ${dots}
    </svg>`;
  };

  outlierSlider.addEventListener("input", () => { outlier = Number(outlierSlider.value); render(); });
  toggleBtn.addEventListener("click", () => {
    includeExtra = !includeExtra;
    toggleBtn.textContent = includeExtra ? "Switch to Odd Count (5 values)" : "Toggle Even Count (+12)";
    render();
  });
  render();

  return el(
    "div",
    { className: "studio-manipulate-grid" },
    el(
      "div",
      { className: "studio-controls-panel" },
      el("p", { className: "studio-scenario" }, lang === "es" ? theater.scenarioEs : theater.scenario),
      el("label", { htmlFor: "data-outlier-slider", className: "studio-slider-label" }, "Drag largest value (test outlier effect):"),
      outlierSlider,
      toggleBtn,
      el("p", {}, "Ordered data: ", sortedOut),
      el("div", { className: "studio-kpi-row" }, el("span", {}, "Median: ", medianOut), el("span", {}, "Mean: ", meanOut)),
    ),
    el("div", { className: "studio-visual-panel" }, svgHost),
  );
}

export function renderFlagshipTheater(lessonId, lang = "en") {
  const data = FLAGSHIP_DATA[lessonId];
  if (!data) return null;
  const state = loadState(lessonId);
  const theater = data.theater;

  const container = el("section", { className: "studio-theater-card", "aria-label": theater.title });
  container.append(
    el("div", { className: "studio-theater-head" },
      el("span", { className: "studio-badge" }, "Interactive Explanation Theater"),
      el("h3", {}, theater.title),
      el("p", { className: "studio-subtitle" }, theater.subtitle),
    ),
    buildPredictBlock(lessonId, theater, state),
  );

  // Manipulate & Observe
  const manipBox = el("div", { className: "studio-step-box" }, el("h4", {}, "2–3. Manipulate & Observe"));
  if (lessonId === "6-5") manipBox.append(buildAlgebraTheater(theater, lang));
  else if (lessonId === "5-1") manipBox.append(buildGeometryTheater(theater, lang));
  else if (lessonId === "2-3") manipBox.append(buildDataTheater(theater, lang));
  container.append(manipBox);

  // Explain
  const explainInput = el("textarea", {
    rows: 2,
    className: "studio-textarea",
    placeholder: "Explain what you observed using mathematical vocabulary...",
    "aria-label": theater.explainPrompt,
  });
  explainInput.value = state.explanation || "";
  const explainMsg = el("p", { className: "studio-feedback", "aria-live": "polite" });
  const saveExplainBtn = el(
    "button",
    {
      type: "button",
      className: "studio-btn-secondary",
      onClick: () => {
        saveState(lessonId, { explanation: explainInput.value });
        explainMsg.textContent = explainInput.value.trim()
          ? "Reasoning saved to your lesson workspace."
          : "Write a short mathematical explanation before saving.";
      },
    },
    "Save Explanation",
  );
  container.append(
    el("div", { className: "studio-step-box" },
      el("h4", {}, "4. Explain"),
      el("p", { className: "studio-prompt" }, theater.explainPrompt),
      explainInput,
      el("div", { className: "studio-action-row" }, saveExplainBtn),
      explainMsg,
    ),
  );

  // Apply + Misconception-to-Resource Loop
  const applyInput = el("input", {
    type: "text",
    className: "studio-text-input",
    placeholder: "Enter your answer...",
    "aria-label": theater.applyPrompt,
  });
  applyInput.value = state.applyAnswer || "";
  const diagBox = el("div", { className: "studio-diag-box", hidden: true });
  const checkBtn = el(
    "button",
    {
      type: "button",
      className: "studio-btn-primary",
      onClick: () => {
        saveState(lessonId, { applyAnswer: applyInput.value });
        const diag = diagnoseResponse({
          lessonId,
          response: applyInput.value,
          expected: theater.applyExpected,
          altExpected: theater.applyAltExpected,
          context: lessonId === "2-3" ? { unsortedMid: 8 } : {},
        });
        diagBox.hidden = false;
        diagBox.replaceChildren();
        diagBox.dataset.status = diag.status;
        diagBox.append(
          el("p", { className: "studio-diag-title" }, diag.correct ? "Verified!" : `Diagnostic: ${diag.patternLabel}`),
          el("p", {}, diag.studentFeedback),
        );
        if (!diag.correct && diag.reattempt) {
          const reInput = el("input", { type: "text", className: "studio-text-input", placeholder: "Try the aligned reattempt..." });
          const reFeedback = el("p", { className: "studio-feedback" });
          const reBtn = el(
            "button",
            {
              type: "button",
              className: "studio-btn-secondary",
              onClick: () => {
                const reDiag = diagnoseResponse({
                  lessonId,
                  response: reInput.value,
                  expected: diag.reattempt.expected,
                  altExpected: diag.reattempt.altExpected || [],
                });
                reFeedback.textContent = reDiag.correct
                  ? "Reattempt verified! You corrected the misconception."
                  : `Hint: ${diag.reattempt.hint}`;
              },
            },
            "Check Reattempt",
          );
          diagBox.append(
            el("div", { className: "studio-reattempt-box" },
              el("strong", {}, "Aligned Reattempt: "),
              el("p", {}, diag.reattempt.prompt),
              reInput,
              reBtn,
              reFeedback,
            ),
          );
        }
      },
    },
    "Check & Diagnose",
  );

  container.append(
    el("div", { className: "studio-step-box" },
      el("h4", {}, "5. Apply & Misconception Check"),
      el("p", { className: "studio-prompt" }, theater.applyPrompt),
      el("div", { className: "studio-inline-form" }, applyInput, checkBtn),
      diagBox,
    ),
  );

  return container;
}

export function renderLivingGuidedNotes(lessonId, isTeacherMode = false) {
  const data = FLAGSHIP_DATA[lessonId];
  if (!data) return null;
  const state = loadState(lessonId);
  const notes = data.guidedNotes;
  const box = el("section", { className: "studio-notes-card" });

  const header = el(
    "div",
    { className: "studio-theater-head" },
    el("span", { className: "studio-badge" }, isTeacherMode ? "Living Guided Notes · Teacher Mode" : "Living Guided Notes · Student Workspace"),
    el("h3", {}, notes.title),
    el("button", { type: "button", className: "studio-btn-secondary", onClick: () => window.print() }, "Print Clean Notes"),
  );
  box.append(header);

  for (const step of notes.steps) {
    const textarea = el("textarea", {
      rows: 2,
      className: "studio-textarea",
      placeholder: "Record your mathematical reasoning here...",
      "aria-label": step.prompt,
    });
    textarea.value = state[`note_${step.id}`] || "";
    textarea.addEventListener("input", () => saveState(lessonId, { [`note_${step.id}`]: textarea.value }));

    const stepCard = el("div", { className: "studio-note-step" },
      el("h4", {}, step.prompt),
      el("p", { className: "studio-hint-line" }, `Think prompt: ${step.studentHint}`),
      textarea,
    );
    if (isTeacherMode) {
      const revealDetails = el("details", { className: "studio-teacher-reveal" },
        el("summary", {}, "Teacher Reveal & Common Mistake"),
        el("p", {}, el("strong", {}, "Worked step: "), step.teacherReveal),
        el("p", { className: "studio-mistake-callout" }, el("strong", {}, "Watch for: "), step.commonMistake),
      );
      stepCard.append(revealDetails);
    }
    box.append(stepCard);
  }
  return box;
}

export function renderReasoningAndCollaboration(lessonId) {
  const data = FLAGSHIP_DATA[lessonId];
  if (!data) return null;
  const { reasoning, collaboration } = data;

  const spotOut = el("p", { className: "studio-feedback", "aria-live": "polite" });
  const spotBtns = el("div", { className: "studio-choice-list" });
  for (const c of reasoning.spotFlaw.choices) {
    spotBtns.append(
      el("button", {
        type: "button",
        className: "studio-choice-btn",
        onClick: () => {
          spotOut.textContent = c.correct
            ? "Accurate diagnosis! You pinpointed the exact mathematical flaw."
            : "Look closer at the mathematical structure of the student's work and try again.";
        },
      }, c.label),
    );
  }

  const botInput = el("textarea", { rows: 2, className: "studio-textarea", placeholder: "Explain the rule clearly to the bot..." });
  const botOut = el("p", { className: "studio-feedback", "aria-live": "polite" });
  const botBtn = el("button", {
    type: "button",
    className: "studio-btn-secondary",
    onClick: () => {
      const txt = botInput.value.trim();
      if (!txt) {
        botOut.textContent = "Write an explanation so the simulated learner can revise its thinking.";
        return;
      }
      botOut.textContent = `Bot-feedback: Thanks for explaining! Key mathematical check: ${reasoning.teachMachine.expectedKeyIdea}`;
    },
  }, "Send Explanation to Learner");

  const partnerOut = el("p", { className: "studio-feedback", "aria-live": "polite" });
  const partnerBtns = el("div", { className: "studio-choice-list" });
  for (const opt of collaboration.partnerBOptions) {
    partnerBtns.append(
      el("button", {
        type: "button",
        className: "studio-choice-btn",
        onClick: () => {
          partnerOut.textContent = opt === collaboration.correctMatch
            ? `Matched! Observable check: ${collaboration.successCriterion}`
            : "Compare the quantities with Partner A again and test a sample value.";
        },
      }, opt),
    );
  }

  return el("section", { className: "studio-reasoning-grid" },
    el("article", { className: "studio-step-box" },
      el("span", { className: "studio-badge" }, "Reasoning & Math Defense"),
      el("h4", {}, reasoning.spotFlaw.title),
      el("p", { className: "studio-quote" }, reasoning.spotFlaw.studentWork),
      el("p", {}, reasoning.spotFlaw.question),
      spotBtns,
      spotOut,
    ),
    el("article", { className: "studio-step-box" },
      el("span", { className: "studio-badge" }, "Teach the Machine"),
      el("h4", {}, `${reasoning.teachMachine.botName} says:`),
      el("p", { className: "studio-quote" }, reasoning.teachMachine.botClaim),
      el("p", {}, reasoning.teachMachine.prompt),
      botInput,
      botBtn,
      botOut,
    ),
    el("article", { className: "studio-step-box" },
      el("span", { className: "studio-badge" }, "Partner Info-Gap (Optional)"),
      el("h4", {}, collaboration.title),
      el("p", { className: "studio-hint-line" }, `Teacher launch: ${collaboration.teacherLaunch}`),
      el("p", {}, el("strong", {}, "Partner A clue: "), collaboration.partnerA),
      partnerBtns,
      partnerOut,
    ),
  );
}

export function renderUniversalLessonExperience(lesson, isTeacherMode = false, lang = "en") {
  const inst = lesson.instructional || {};
  const state = loadState(lesson.id);
  const labRes = (lesson.resources || []).find((r) => r.key === "learningLab");
  const lessonRes = (lesson.resources || []).find((r) => r.key === "lesson");

  const stack = el("div", { className: "studio-flagship-stack" });

  // 1. Universal Interactive Explanation Card (Predict -> Explore -> Observe -> Explain -> Apply)
  const theaterCard = el("section", { className: "studio-theater-card", "aria-label": `Interactive Explanation for ${lesson.id}` },
    el("div", { className: "studio-theater-head" },
      el("span", { className: "studio-badge" }, "Interactive Explanation · Predict → Explore → Explain"),
      el("h3", {}, `Lesson ${lesson.id}: ${lesson.title}`),
      el("p", { className: "studio-subtitle" }, lesson.objective),
    ),
  );

  if (inst.wordProblem) {
    const predictInput = el("textarea", {
      rows: 2,
      className: "studio-textarea",
      placeholder: "Predict your strategy before checking the worked model...",
      "aria-label": "Prediction",
    });
    predictInput.value = state.uPredict || "";
    predictInput.addEventListener("input", () => saveState(lesson.id, { uPredict: predictInput.value }));
    theaterCard.append(
      el("div", { className: "studio-step-box" },
        el("h4", {}, "1. Predict & Launch Problem"),
        el("p", { className: "studio-prompt" }, inst.wordProblem),
        predictInput,
      ),
    );
  }

  if (inst.workedExampleLines?.length) {
    theaterCard.append(
      el("div", { className: "studio-step-box" },
        el("h4", {}, "2–3. Worked Model & Interactive Exploration"),
        el("ol", { className: "studio-assembly-list" }, ...inst.workedExampleLines.map((line) => el("li", {}, line))),
        el("div", { className: "studio-res-actions" },
          labRes ? el("a", { href: labRes.href, className: "studio-btn-primary" }, "Open Interactive Learning Lab →") : null,
          lessonRes ? el("a", { href: lessonRes.href, className: "studio-btn-secondary" }, "Launch Full Interactive Lesson →") : null,
        ),
      ),
    );
  }

  const explainInput = el("textarea", {
    rows: 2,
    className: "studio-textarea",
    placeholder: "Explain the key mathematical relationship in your own words...",
    "aria-label": "Mathematical explanation",
  });
  explainInput.value = state.explanation || "";
  const explainMsg = el("p", { className: "studio-feedback", "aria-live": "polite" });
  theaterCard.append(
    el("div", { className: "studio-step-box" },
      el("h4", {}, "4. Explain & Apply"),
      el("p", { className: "studio-prompt" }, inst.weDoPrompt || lesson.languageObjective || "Use lesson vocabulary to explain why this strategy works."),
      explainInput,
      el("div", { className: "studio-action-row" },
        el("button", {
          type: "button",
          className: "studio-btn-secondary",
          onClick: () => {
            saveState(lesson.id, { explanation: explainInput.value });
            explainMsg.textContent = explainInput.value.trim() ? "Reasoning saved to your lesson workspace." : "Write a brief explanation first.";
          },
        }, "Save Explanation"),
      ),
      explainMsg,
    ),
  );
  stack.append(theaterCard);

  // 2. Universal Living Guided Notes
  const notesCard = el("section", { className: "studio-notes-card" },
    el("div", { className: "studio-theater-head" },
      el("span", { className: "studio-badge" }, isTeacherMode ? "Living Guided Notes · Teacher Mode" : "Living Guided Notes · Student Workspace"),
      el("h3", {}, `Living Guided Notes · Lesson ${lesson.id}`),
      el("button", { type: "button", className: "studio-btn-secondary", onClick: () => window.print() }, "Print Clean Notes"),
    ),
  );
  const notePrompts = [
    { id: "u1", prompt: `1. Core Concept (${lesson.standard || "Grade 6"})`, hint: lesson.objective, reveal: inst.workedExampleLines?.[0] || lesson.objective },
    { id: "u2", prompt: "2. Vocabulary & Strategy Connection", hint: `Key terms: ${(lesson.vocabulary || []).slice(0, 4).map((v) => v.term).join(", ") || "lesson vocabulary"}`, reveal: inst.workedExampleLines?.slice(1).join(" ") || inst.weDoPrompt || "" },
  ];
  for (const np of notePrompts) {
    const ta = el("textarea", { rows: 2, className: "studio-textarea", placeholder: "Record your mathematical notes here..." });
    ta.value = state[`note_${np.id}`] || "";
    ta.addEventListener("input", () => saveState(lesson.id, { [`note_${np.id}`]: ta.value }));
    const stepEl = el("div", { className: "studio-note-step" },
      el("h4", {}, np.prompt),
      el("p", { className: "studio-hint-line" }, np.hint),
      ta,
    );
    if (isTeacherMode && (np.reveal || inst.commonMistake)) {
      stepEl.append(
        el("details", { className: "studio-teacher-reveal" },
          el("summary", {}, "Teacher Reveal & Common Mistake"),
          np.reveal ? el("p", {}, el("strong", {}, "Worked step: "), np.reveal) : null,
          inst.commonMistake ? el("p", { className: "studio-mistake-callout" }, el("strong", {}, "Watch for: "), inst.commonMistake) : null,
        ),
      );
    }
    notesCard.append(stepEl);
  }
  stack.append(notesCard);

  // 3. Universal Reasoning & Partner Collaboration
  const collabGrid = el("section", { className: "studio-reasoning-grid" },
    el("article", { className: "studio-step-box" },
      el("span", { className: "studio-badge" }, "Reasoning & Math Defense"),
      el("h4", {}, "Analyze a Common Misconception"),
      el("p", { className: "studio-quote" }, inst.commonMistake || "Identify where a student might misapply the steps in this lesson."),
      el("textarea", { rows: 2, className: "studio-textarea", placeholder: "Write how you would explain and correct this error..." }),
    ),
    el("article", { className: "studio-step-box" },
      el("span", { className: "studio-badge" }, "Partner Collaboration (Optional)"),
      el("h4", {}, "Turn & Talk Mathematical Discussion"),
      el("p", { className: "studio-prompt" }, inst.turnAndTalk || `Compare your solution method for Lesson ${lesson.id} with a partner and justify each step.`),
    ),
  );
  stack.append(collabGrid);

  return stack;
}
