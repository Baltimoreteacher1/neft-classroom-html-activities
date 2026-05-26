export function renderBalanceScale(
  container,
  { equation, variable, answer, tolerance, hints, label, onComplete },
) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const W = 480,
    H = 280;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.cssText =
    "width:100%; max-width:480px; height:auto; display:block; margin:0 auto;";
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
  const leftPan = svgRect(
    leftPanG,
    MID - 150 - PAN_W / 2,
    BEAM_Y + 30,
    PAN_W,
    40,
    10,
    "#dff2ee",
  );
  svgRect(
    leftPanG,
    MID - 150 - PAN_W / 2,
    BEAM_Y + 30,
    PAN_W,
    40,
    10,
    "none",
    "#1fa6a2",
    1.5,
  );
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
  const rightPan = svgRect(
    rightPanG,
    MID + 150 - PAN_W / 2,
    BEAM_Y + 30,
    PAN_W,
    40,
    10,
    "#fef7e0",
  );
  svgRect(
    rightPanG,
    MID + 150 - PAN_W / 2,
    BEAM_Y + 30,
    PAN_W,
    40,
    10,
    "none",
    "#f2c15b",
    1.5,
  );
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
  const solveText = svgText(
    svg,
    MID,
    70,
    `Solve for ${variable || "x"}`,
    "12px",
    "#5f6f80",
  );
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

  const history = document.createElement("div");
  history.style.cssText =
    "font-size:0.82rem; color:var(--muted); margin:var(--sp-2) 0; text-align:center; min-height:24px;";
  wrapper.append(history);

  const steps = [];

  operations.forEach(({ text, op }) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.style.cssText = "padding:8px 14px; font-size:0.85rem;";
    btn.textContent = text;

    btn.addEventListener("click", () => {
      const val = prompt(`${text} — enter the value:`);
      if (!val || isNaN(Number(val))) return;
      steps.push(`${op} ${val}`);
      history.textContent = `Steps: ${steps.join(" → ")}`;
      animateTilt();
    });

    opsCard.append(btn);
  });

  wrapper.append(opsCard);

  function animateTilt() {
    tilt = (Math.random() - 0.5) * 6;
    beam.setAttribute("transform", `rotate(${tilt}, ${MID}, ${BEAM_Y})`);
    leftPanG.setAttribute("transform", `rotate(${tilt}, ${MID}, ${BEAM_Y})`);
    rightPanG.setAttribute("transform", `rotate(${tilt}, ${MID}, ${BEAM_Y})`);
    leftLabel.setAttribute("transform", `rotate(${tilt}, ${MID}, ${BEAM_Y})`);
    rightLabel.setAttribute("transform", `rotate(${tilt}, ${MID}, ${BEAM_Y})`);
    setTimeout(() => {
      beam.setAttribute("transform", "");
      leftPanG.setAttribute("transform", "");
      rightPanG.setAttribute("transform", "");
      leftLabel.setAttribute("transform", "");
      rightLabel.setAttribute("transform", "");
    }, 600);
  }

  // Answer input
  const answerRow = document.createElement("div");
  answerRow.style.cssText =
    "display:flex; gap:var(--sp-3); align-items:center; justify-content:center; margin-top:var(--sp-3);";

  const ansLabel = document.createElement("span");
  ansLabel.style.cssText =
    "font-weight:800; font-size:1rem; color:var(--navy);";
  ansLabel.textContent = `${variable || "x"} = `;

  const ansInput = document.createElement("input");
  ansInput.type = "text";
  ansInput.className = "text-input";
  ansInput.style.cssText =
    "max-width:100px; text-align:center; font-weight:800; font-size:1.1rem;";
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
    const isCorrect =
      !isNaN(numVal) && !isNaN(numAns) && Math.abs(numVal - numAns) <= tol;

    if (isCorrect) {
      done = true;
      ansInput.readOnly = true;
      ansInput.style.borderColor = "var(--success)";
      ansInput.style.background = "var(--success-bg)";
      checkBtn.style.display = "none";

      beam.setAttribute("transform", "");
      leftPanG.setAttribute("transform", "");
      rightPanG.setAttribute("transform", "");

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
  slot.innerHTML = "";
  slot.append(fb);
}
