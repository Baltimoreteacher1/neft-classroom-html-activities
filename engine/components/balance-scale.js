let BS_STYLE_INJECTED = false;

function injectStyle() {
  if (BS_STYLE_INJECTED) return;
  BS_STYLE_INJECTED = true;
  const css = `
  .bs-input:focus-visible { outline:3px solid rgba(31,166,162,0.4); outline-offset:2px; border-color:var(--teal, #1fa6a2); }
  .bs-op-btn { transition:transform .12s ease, box-shadow .15s ease, background .15s ease; }
  .bs-op-btn.bs-pressed { transform:scale(0.94); box-shadow:0 0 0 3px rgba(31,166,162,0.28), 0 2px 8px rgba(31,166,162,0.22); }
  .bs-hint-wrap { display:grid; grid-template-rows:0fr; transition:grid-template-rows .28s ease; }
  .bs-hint-wrap.bs-open { grid-template-rows:1fr; }
  .bs-hint-inner { overflow:hidden; min-height:0; }
  @media (prefers-reduced-motion:reduce){
    .bs-op-btn { transition:none }
    .bs-op-btn.bs-pressed { transform:none }
    .bs-hint-wrap { transition:none }
  }
  `;
  const style = document.createElement("style");
  style.dataset.bs = "balance-scale";
  style.textContent = css;
  document.head.append(style);
}

export function renderBalanceScale(container, config) {
  const { equation, variable, answer, tolerance, hints, label, onComplete } = config;
  injectStyle();

  // Adapter: some lessons author balance-scale problems in shapes the solve-for-
  // variable renderer below does not understand. Left unhandled, `equation.split`
  // throws and the problem renders blank. Route them to purpose-built renderers:
  //   • `left`/`right` strings  → a "which side is greater?" comparison
  //   • `items:[{left,right,balanced}]` → a verify-each-equation checklist
  if (equation == null) {
    if (Array.isArray(config.items) && config.items.length) {
      return renderBalanceVerify(container, config);
    }
    if (config.left != null && config.right != null) {
      return renderBalanceCompare(container, config);
    }
    // Nothing usable — show the prompt and complete so the queue never stalls.
    const wrap = document.createElement("div");
    wrap.className = "card";
    const p = document.createElement("p");
    p.className = "problem-stem";
    p.textContent = config.instructions || label || "This balance task is unavailable.";
    wrap.append(p);
    container.append(wrap);
    if (onComplete) onComplete(0, 0);
    return;
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const W = 480,
    H = 280;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.cssText = "width:100%; max-width:480px; height:auto; display:block; margin:0 auto;";
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Balance scale showing: ${equation}`);

  const MID = W / 2;
  const FULCRUM_Y = 220;
  const BEAM_Y = 140;
  const PAN_W = 140;

  let tilt = 0;

  // Fulcrum triangle
  const fulcrum = svgPoly(
    svg,
    `${MID},${FULCRUM_Y} ${MID - 22},${FULCRUM_Y + 35} ${MID + 22},${FULCRUM_Y + 35}`,
    "#12355b",
  );

  // Base
  svgRect(svg, MID - 55, FULCRUM_Y + 35, 110, 12, 8, "#12355b");

  // Beam
  const beam = svgLine(svg, MID - 180, BEAM_Y, MID + 180, BEAM_Y, "#1fa6a2", 4);
  beam.setAttribute("stroke-linecap", "round");

  // Fulcrum pin
  svgCircle(svg, MID, BEAM_Y, 8, "#f2c15b", "#12355b", 2.5);

  // Left pan
  const leftPanG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgLine(leftPanG, MID - 150, BEAM_Y, MID - 150, BEAM_Y + 30, "#5f6f80", 1.5);
  svgLine(
    leftPanG,
    MID - 150 - PAN_W / 2 + 10,
    BEAM_Y + 30,
    MID - 150 + PAN_W / 2 - 10,
    BEAM_Y + 30,
    "#5f6f80",
    1.5,
  );
  const leftPan = svgRect(leftPanG, MID - 150 - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, "#dff2ee");
  svgRect(leftPanG, MID - 150 - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, "none", "#1fa6a2", 1.5);
  svg.append(leftPanG);

  // Right pan
  const rightPanG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgLine(rightPanG, MID + 150, BEAM_Y, MID + 150, BEAM_Y + 30, "#5f6f80", 1.5);
  svgLine(
    rightPanG,
    MID + 150 - PAN_W / 2 + 10,
    BEAM_Y + 30,
    MID + 150 + PAN_W / 2 - 10,
    BEAM_Y + 30,
    "#5f6f80",
    1.5,
  );
  const rightPan = svgRect(rightPanG, MID + 150 - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, "#fef7e0");
  svgRect(rightPanG, MID + 150 - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, "none", "#f2c15b", 1.5);
  svg.append(rightPanG);

  // Labels on pans
  const leftLabel = svgText(
    svg,
    MID - 150,
    BEAM_Y + 55,
    equation.split("=")[0]?.trim() || "",
    "14px",
    "#12355b",
  );
  leftLabel.setAttribute("text-anchor", "middle");
  leftLabel.setAttribute("font-weight", "800");

  const rightLabel = svgText(
    svg,
    MID + 150,
    BEAM_Y + 55,
    equation.split("=")[1]?.trim() || "",
    "14px",
    "#12355b",
  );
  rightLabel.setAttribute("text-anchor", "middle");
  rightLabel.setAttribute("font-weight", "800");

  // Equation display above
  const eqBg = svgRect(svg, MID - 100, 15, 200, 36, 12, "#12355b");
  const eqText = svgText(svg, MID, 39, equation, "16px", "white");
  eqText.setAttribute("text-anchor", "middle");
  eqText.setAttribute("font-weight", "800");
  eqText.setAttribute("font-family", "var(--font-mono), monospace");

  // "Solve for x" badge
  const solveText = svgText(svg, MID, 70, `Solve for ${variable || "x"}`, "12px", "#5f6f80");
  solveText.setAttribute("text-anchor", "middle");
  solveText.setAttribute("font-weight", "700");

  wrapper.append(svg);

  // Operation buttons
  const opsCard = document.createElement("div");
  opsCard.style.cssText =
    "display:flex; flex-wrap:wrap; gap:var(--sp-2); justify-content:center; margin:var(--sp-4) 0;";

  const operations = [
    { text: `+ both sides`, op: "add" },
    { text: `− both sides`, op: "subtract" },
    { text: `× both sides`, op: "multiply" },
    { text: `÷ both sides`, op: "divide" },
  ];

  // Inline value input — replaces a blocking window.prompt(), which is
  // suppressed in many embedded webviews/iframes and is poor for accessibility.
  const opInput = document.createElement("input");
  opInput.type = "number";
  opInput.inputMode = "decimal";
  opInput.className = "text-input bs-op-input";
  opInput.setAttribute("aria-label", "Value to apply to both sides");
  opInput.placeholder = "value";
  opInput.style.cssText = "width:84px; padding:8px 10px; font-size:0.9rem;";
  opsCard.append(opInput);

  const history = document.createElement("div");
  history.style.cssText =
    "font-size:0.82rem; color:var(--muted); margin:var(--sp-2) 0; text-align:center; min-height:24px;";
  wrapper.append(history);

  const steps = [];

  operations.forEach(({ text, op }) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary bs-op-btn";
    btn.style.cssText = "padding:8px 14px; font-size:0.85rem;";
    btn.textContent = text;

    btn.addEventListener("click", () => {
      pressFeedback(btn);
      const raw = opInput.value.trim();
      if (raw === "" || isNaN(Number(raw))) {
        history.textContent = "Type a number in the box, then choose an operation.";
        opInput.focus();
        return;
      }
      steps.push(`${op} ${raw}`);
      history.textContent = `Steps: ${steps.join(" → ")}`;
      opInput.value = "";
      animateTilt();
    });

    opsCard.append(btn);
  });

  wrapper.append(opsCard);

  const tiltParts = [beam, leftPanG, rightPanG, leftLabel, rightLabel];
  let tiltRaf = null;

  function applyTilt(angle) {
    tilt = angle;
    const t = Math.abs(angle) < 0.001 ? "" : `rotate(${angle}, ${MID}, ${BEAM_Y})`;
    tiltParts.forEach((el) => el.setAttribute("transform", t));
  }

  // Ease the beam from its current tilt to `target`, then (optionally) settle
  // back to level. requestAnimationFrame-driven so it stays smooth and is fully
  // disabled under prefers-reduced-motion.
  function easeTiltTo(target, { settle = true } = {}) {
    if (tiltRaf) cancelAnimationFrame(tiltRaf);

    if (prefersReducedMotion) {
      applyTilt(settle ? 0 : target);
      return;
    }

    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const start = tilt;
    const toTarget = 380; // ms to reach the tilt
    const hold = 160; // ms paused at the tilt
    const toLevel = 520; // ms easing back to balanced
    const total = settle ? toTarget + hold + toLevel : toTarget;
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

    function frame(now) {
      const elapsed = now - t0;
      if (elapsed >= total) {
        applyTilt(settle ? 0 : target);
        tiltRaf = null;
        return;
      }
      if (elapsed < toTarget) {
        applyTilt(start + (target - start) * easeOut(elapsed / toTarget));
      } else if (elapsed < toTarget + hold) {
        applyTilt(target);
      } else {
        const p = (elapsed - toTarget - hold) / toLevel;
        applyTilt(target * (1 - easeOut(p)));
      }
      tiltRaf = requestAnimationFrame(frame);
    }
    tiltRaf = requestAnimationFrame(frame);
  }

  function animateTilt() {
    const target = (Math.random() - 0.5) * 6;
    easeTiltTo(target, { settle: true });
  }

  // Brief press/glow feedback on an operation button.
  function pressFeedback(btn) {
    if (prefersReducedMotion) return;
    btn.classList.add("bs-pressed");
    setTimeout(() => btn.classList.remove("bs-pressed"), 170);
  }

  // On a correct solve, ease the beam smoothly to perfect level (equilibrium).
  function settleToBalance() {
    if (tiltRaf) cancelAnimationFrame(tiltRaf);
    if (prefersReducedMotion) {
      applyTilt(0);
      return;
    }
    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const start = tilt;
    const dur = 600;
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      applyTilt(start * (1 - easeOut(p)));
      if (p < 1) {
        tiltRaf = requestAnimationFrame(frame);
      } else {
        applyTilt(0);
        tiltRaf = null;
      }
    }
    tiltRaf = requestAnimationFrame(frame);
  }

  // Answer input
  const answerRow = document.createElement("div");
  answerRow.style.cssText =
    "display:flex; gap:var(--sp-3); align-items:center; justify-content:center; margin-top:var(--sp-3);";

  const ansLabel = document.createElement("span");
  ansLabel.style.cssText = "font-weight:800; font-size:1rem; color:var(--navy);";
  ansLabel.textContent = `${variable || "x"} = `;

  const ansInput = document.createElement("input");
  ansInput.type = "text";
  ansInput.className = "text-input bs-input";
  ansInput.style.cssText = "max-width:100px; text-align:center; font-weight:800; font-size:1.1rem;";
  ansInput.placeholder = "?";
  ansInput.setAttribute("aria-label", `Value of ${variable || "x"}`);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary";
  checkBtn.textContent = "Check";

  answerRow.append(ansLabel, ansInput, checkBtn);
  wrapper.append(answerRow);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  let done = false;
  let hintIdx = 0;

  checkBtn.addEventListener("click", () => {
    if (done) return;
    const val = ansInput.value.trim();
    if (!val) {
      showFb(feedbackSlot, "hint", `Enter a value for ${variable || "x"}.`);
      return;
    }

    const numVal = parseFloat(val.replace(/[,$]/g, ""));
    const numAns = parseFloat(String(answer).replace(/[,$]/g, ""));
    const tol = tolerance || 0.01;
    const isCorrect = !isNaN(numVal) && !isNaN(numAns) && Math.abs(numVal - numAns) <= tol;

    if (isCorrect) {
      done = true;
      ansInput.readOnly = true;
      ansInput.style.borderColor = "var(--success)";
      ansInput.style.background = "var(--success-bg)";
      checkBtn.style.display = "none";

      // Equilibrium: ease the beam smoothly to perfectly level.
      settleToBalance();

      showFb(
        feedbackSlot,
        "success",
        `Correct! ${variable || "x"} = ${answer}. The scale is balanced!`,
      );
      if (onComplete) onComplete(1, 1);
    } else {
      const hint =
        hints && hints[hintIdx]
          ? hints[hintIdx]
          : "Try using inverse operations to isolate the variable.";
      hintIdx = Math.min(hintIdx + 1, (hints?.length || 1) - 1);
      showFb(feedbackSlot, "hint", hint);
      animateTilt();
    }
  });

  container.append(wrapper);
}

// Pull the comparable numeric value out of an authored expression string such
// as "3⁴ = 81" (→ 81) or "12 × 0.8 = 9.6" (→ 9.6). Prefers the value after the
// last "="; falls back to the last number in the string. Returns NaN if none.
function valueOf(expr) {
  const s = String(expr == null ? "" : expr);
  const afterEq = s.includes("=") ? s.slice(s.lastIndexOf("=") + 1) : s;
  const nums = afterEq.match(/-?\d+(?:\.\d+)?/g);
  if (nums && nums.length) return parseFloat(nums[nums.length - 1]);
  return NaN;
}

// Draw a static balance scale with two labeled pans. Returns a setTilt(angle)
// so the caller can lean the beam toward the heavier side on reveal.
function drawScale(container, leftText, rightText, ariaLabel) {
  const W = 480,
    H = 260;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.cssText = "width:100%; max-width:480px; height:auto; display:block; margin:0 auto;";
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    ariaLabel || `Balance scale comparing ${leftText} and ${rightText}`,
  );

  const MID = W / 2;
  const FULCRUM_Y = 210;
  const BEAM_Y = 130;
  const PAN_W = 150;

  svgPoly(
    svg,
    `${MID},${FULCRUM_Y} ${MID - 22},${FULCRUM_Y + 35} ${MID + 22},${FULCRUM_Y + 35}`,
    "#12355b",
  );
  svgRect(svg, MID - 55, FULCRUM_Y + 35, 110, 12, 8, "#12355b");
  const beam = svgLine(svg, MID - 180, BEAM_Y, MID + 180, BEAM_Y, "#1fa6a2", 4);
  beam.setAttribute("stroke-linecap", "round");
  svgCircle(svg, MID, BEAM_Y, 8, "#f2c15b", "#12355b", 2.5);

  const makePan = (cx, fill, stroke, txt) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgLine(g, cx, BEAM_Y, cx, BEAM_Y + 30, "#5f6f80", 1.5);
    svgLine(g, cx - PAN_W / 2 + 10, BEAM_Y + 30, cx + PAN_W / 2 - 10, BEAM_Y + 30, "#5f6f80", 1.5);
    svgRect(g, cx - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, fill);
    svgRect(g, cx - PAN_W / 2, BEAM_Y + 30, PAN_W, 40, 10, "none", stroke, 1.5);
    const label = svgText(g, cx, BEAM_Y + 55, txt, "15px", "#12355b");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-weight", "800");
    svg.append(g);
    return g;
  };
  const leftPanG = makePan(MID - 150, "#dff2ee", "#1fa6a2", leftText);
  const rightPanG = makePan(MID + 150, "#fef7e0", "#f2c15b", rightText);

  const tiltParts = [beam, leftPanG, rightPanG];
  const setTilt = (angle) => {
    const t = Math.abs(angle) < 0.001 ? "" : `rotate(${angle}, ${MID}, ${BEAM_Y})`;
    tiltParts.forEach((el) => el.setAttribute("transform", t));
  };
  return { svg, setTilt };
}

// "Which side is greater?" comparison. Draws both expressions on the pans and
// lets the learner choose Left / Balanced / Right, then leans the beam toward
// the heavier side and reveals the values.
function renderBalanceCompare(container, config) {
  const { left, right, instructions, label, hints, onComplete } = config;
  injectStyle();
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (instructions || label) {
    const p = document.createElement("p");
    p.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = instructions || label;
    wrapper.append(p);
  }

  // Show the raw expression (strip any "= value" so the answer isn't given away).
  const face = (expr) => String(expr).split("=")[0].trim() || String(expr);
  const lv = valueOf(left);
  const rv = valueOf(right);
  const correct =
    !isNaN(lv) && !isNaN(rv) ? (lv > rv ? "left" : lv < rv ? "right" : "equal") : "equal";

  const { svg, setTilt } = drawScale(container, face(left), face(right), instructions);
  wrapper.append(svg);

  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display:flex; flex-wrap:wrap; gap:var(--sp-2); justify-content:center; margin:var(--sp-4) 0 0;";
  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";

  const choices = [
    { key: "left", text: "◀ Left is greater" },
    { key: "equal", text: "⚖ They are equal" },
    { key: "right", text: "Right is greater ▶" },
  ];
  let done = false;
  choices.forEach(({ key, text }) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary bs-op-btn";
    btn.style.cssText = "padding:8px 14px; font-size:0.9rem;";
    btn.textContent = text;
    btn.addEventListener("click", () => {
      if (done) return;
      const isCorrect = key === correct;
      if (isCorrect) {
        done = true;
        btnRow.querySelectorAll("button").forEach((b) => (b.disabled = true));
        btn.classList.add("btn-primary");
        setTilt(correct === "left" ? 8 : correct === "right" ? -8 : 0);
        const detail =
          correct === "equal"
            ? `Both sides equal ${isNaN(lv) ? "" : lv}. The scale balances.`
            : `${left} vs ${right} — the ${correct} side is greater.`;
        showFb(feedbackSlot, "success", `Correct! ${detail}`);
        if (onComplete) onComplete(1, 1);
      } else {
        const hint =
          (hints && hints[0]) || "Evaluate each side fully, then compare the actual values.";
        showFb(feedbackSlot, "hint", hint);
      }
    });
    btnRow.append(btn);
  });

  wrapper.append(btnRow, feedbackSlot);
  container.append(wrapper);
}

// "Is each scale balanced?" verify checklist for `items:[{left,right,balanced,
// correction}]`. Each row is answered Balanced / Not balanced; a mismatch (or a
// correct "unbalanced") reveals the correction.
function renderBalanceVerify(container, config) {
  const { items, instructions, label, onComplete } = config;
  injectStyle();
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (instructions || label) {
    const p = document.createElement("p");
    p.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = instructions || label;
    wrapper.append(p);
  }

  let answered = 0;
  let correctCount = 0;
  const total = items.length;

  items.forEach((item) => {
    const row = document.createElement("div");
    row.style.cssText =
      "border:1px solid var(--line, #d9e2ec); border-radius:var(--radius-md); padding:var(--sp-3); margin-bottom:var(--sp-3);";

    const expr = document.createElement("p");
    expr.style.cssText =
      "font-weight:700; margin:0 0 var(--sp-3); text-align:center; font-size:1.02rem;";
    expr.innerHTML = `<span>${item.left}</span> <span style="color:var(--muted);">⚖</span> <span>${item.right}</span>`;
    row.append(expr);

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex; gap:var(--sp-2); justify-content:center;";
    const fb = document.createElement("div");
    fb.className = "mt-3";

    let locked = false;
    const answer = (saidBalanced, btnEls) => {
      if (locked) return;
      locked = true;
      controls.querySelectorAll("button").forEach((b) => (b.disabled = true));
      const isCorrect = saidBalanced === !!item.balanced;
      if (isCorrect) correctCount += 1;
      const msg = item.balanced
        ? "Balanced — both sides are equal."
        : item.correction || "Not balanced — the two sides are not equal.";
      showFb(
        fb,
        isCorrect ? "success" : "hint",
        `${isCorrect ? "Correct! " : "Not quite. "}${msg}`,
      );
      answered += 1;
      if (answered === total && onComplete) onComplete(correctCount, total);
    };

    ["Balanced", "Not balanced"].forEach((txt, idx) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary";
      btn.style.cssText = "padding:8px 14px; font-size:0.88rem;";
      btn.textContent = txt;
      btn.addEventListener("click", () => answer(idx === 0));
      controls.append(btn);
    });

    row.append(controls, fb);
    wrapper.append(row);
  });

  container.append(wrapper);
}

function svgLine(parent, x1, y1, x2, y2, stroke, width) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
  el.setAttribute("x1", x1);
  el.setAttribute("y1", y1);
  el.setAttribute("x2", x2);
  el.setAttribute("y2", y2);
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", width);
  parent.append(el);
  return el;
}

function svgRect(parent, x, y, w, h, r, fill, stroke, sw) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("width", w);
  el.setAttribute("height", h);
  el.setAttribute("rx", r);
  el.setAttribute("fill", fill || "none");
  if (stroke) el.setAttribute("stroke", stroke);
  if (sw) el.setAttribute("stroke-width", sw);
  parent.append(el);
  return el;
}

function svgCircle(parent, cx, cy, r, fill, stroke, sw) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", cx);
  el.setAttribute("cy", cy);
  el.setAttribute("r", r);
  el.setAttribute("fill", fill || "none");
  if (stroke) el.setAttribute("stroke", stroke);
  if (sw) el.setAttribute("stroke-width", sw);
  parent.append(el);
  return el;
}

function svgPoly(parent, points, fill) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  el.setAttribute("points", points);
  el.setAttribute("fill", fill);
  parent.append(el);
  return el;
}

function svgText(parent, x, y, content, size, fill) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("font-size", size);
  el.setAttribute("fill", fill);
  el.setAttribute("font-family", "Calibri, 'Segoe UI', sans-serif");
  el.textContent = content;
  parent.append(el);
  return el;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;

  // Slide-down reveal: nest the feedback in a collapsed grid wrapper, then open
  // it on the next frame so the height transition runs. Gated by CSS
  // prefers-reduced-motion (the .bs-hint-wrap transition is disabled there).
  const wrap = document.createElement("div");
  wrap.className = "bs-hint-wrap";
  const inner = document.createElement("div");
  inner.className = "bs-hint-inner";
  inner.append(fb);
  wrap.append(inner);

  slot.innerHTML = "";
  slot.append(wrap);
  requestAnimationFrame(() => wrap.classList.add("bs-open"));
}
