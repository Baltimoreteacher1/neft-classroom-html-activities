export function renderNumberLine(container, config) {
  const { min, max, step, targets, snapToTick, label, onComplete } = config;
  injectNumberLineStyles();

  // Sequential mode: ONE draggable dot the student moves to each value in turn
  // (e.g. "plot each decimal"), instead of a confusing cluster of dots that all
  // start bunched together. Opt-in via `sequential:true` + `targets`.
  if (config.sequential && Array.isArray(targets) && targets.length) {
    return renderSequentialNumberLine(container, config);
  }

  // Adapter: some lessons author number-line tasks in shapes the draggable-dot
  // renderer below cannot use (which would fall through to the "unavailable"
  // stub). Route them to purpose-built renderers:
  //   • `problems:[{inequality,boundary,circleType,direction}]` → graph-and-read
  //     inequalities
  //   • `totalJumps`/`jumpSize` (+ questionText/answer) → a skip-counting jumps line
  if (!Array.isArray(targets) || targets.length === 0) {
    if (Array.isArray(config.problems) && config.problems.length) {
      return renderInequalityGraphs(container, config);
    }
    if (config.totalJumps != null || config.jumpSize != null) {
      return renderJumpNumberLine(container, config);
    }
    // Guard malformed config: with no targets, the original "correct === targets.length"
    // check is 0 === 0 on the first click and fires a false success.
    const warn = document.createElement("p");
    warn.className = "problem-stem";
    warn.textContent = label || config.instructions || "This number-line task is unavailable.";
    container.append(warn);
    if (onComplete) onComplete(0, 0);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const PAD_LEFT = 40;
  const PAD_RIGHT = 20;
  const HEIGHT = 120;
  const TICK_Y = 60;
  const DOT_R = 10;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 600 ${HEIGHT}`);
  svg.style.cssText = "width:100%; height:auto; user-select:none; touch-action:none;";
  svg.setAttribute("role", "application");
  svg.setAttribute("aria-label", `Number line from ${min} to ${max}`);

  const usable = 600 - PAD_LEFT - PAD_RIGHT;
  const toX = (val) => PAD_LEFT + ((val - min) / (max - min)) * usable;
  const toVal = (x) => {
    const raw = min + ((x - PAD_LEFT) / usable) * (max - min);
    if (snapToTick) return Math.round(raw / step) * step;
    return Math.round(raw * 100) / 100;
  };

  // Main axis line
  const axis = line(svg, PAD_LEFT, TICK_Y, 600 - PAD_RIGHT, TICK_Y, "#1fa6a2", 3);

  // Arrow heads
  const arrowL = poly(
    svg,
    `${PAD_LEFT - 6},${TICK_Y} ${PAD_LEFT + 4},${TICK_Y - 5} ${PAD_LEFT + 4},${TICK_Y + 5}`,
    "#1fa6a2",
  );
  const arrowR = poly(
    svg,
    `${600 - PAD_RIGHT + 6},${TICK_Y} ${600 - PAD_RIGHT - 4},${TICK_Y - 5} ${600 - PAD_RIGHT - 4},${TICK_Y + 5}`,
    "#1fa6a2",
  );

  // Ticks and labels
  for (let v = min; v <= max; v = round(v + step)) {
    const x = toX(v);
    line(svg, x, TICK_Y - 8, x, TICK_Y + 8, "#12355b", 1.5);
    const txt = text(svg, x, TICK_Y + 24, formatNum(v), "11px", "#21313f");
    txt.setAttribute("text-anchor", "middle");
  }

  // Target zones (invisible, shown on check)
  const targetMarkers = [];
  targets.forEach((t) => {
    const cx = toX(t.value);
    const marker = circle(svg, cx, TICK_Y, 6, "none", "#0f7c4a", 2);
    marker.setAttribute("class", "nl-target-marker");
    // SVG geometric centering for the grow animation's transform-origin.
    marker.style.transformOrigin = `${cx}px ${TICK_Y}px`;
    marker.style.transformBox = "fill-box";
    marker.style.display = "none";
    targetMarkers.push({ marker, value: t.value, label: t.label });
  });

  // Draggable dots
  const dots = [];
  const dotSpacing = usable / (targets.length + 1);

  targets.forEach((t, i) => {
    const startX = PAD_LEFT + dotSpacing * (i + 1);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "grab";

    const shadow = circle(g, 0, 0, DOT_R + 2, "rgba(18,53,91,0.12)", "none", 0);
    const dot = circle(g, 0, 0, DOT_R, "#f2c15b", "#12355b", 2.5);
    // Class enables the smooth fill/stroke color transition (check feedback).
    dot.setAttribute("class", "nl-dot");
    const dotLabel = text(g, 0, -18, t.label || "?", "11px", "#12355b");
    dotLabel.setAttribute("text-anchor", "middle");
    dotLabel.setAttribute("font-weight", "700");

    const valLabel = text(g, 0, 32, "", "10px", "#5f6f80");
    valLabel.setAttribute("text-anchor", "middle");

    g.append(shadow, dot, dotLabel, valLabel);
    g.setAttribute("transform", `translate(${startX}, ${TICK_Y})`);
    g.setAttribute("role", "slider");
    g.setAttribute("aria-label", t.label || `Point ${i + 1}`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("aria-valuemin", String(min));
    g.setAttribute("aria-valuemax", String(max));

    let currentVal = toVal(startX);
    // Keep the slider's spoken value in sync so screen-reader users hear the
    // position as they drag or arrow the point.
    const setAria = (v) => {
      g.setAttribute("aria-valuenow", String(v));
      g.setAttribute("aria-valuetext", formatNum(v));
    };
    valLabel.textContent = formatNum(currentVal);
    setAria(currentVal);

    const state = { x: startX, dragging: false };
    // renderX is the position currently painted; state.x is the logical/target
    // position. They differ only mid-tween. The data contract (getVal /
    // currentVal) always uses the snapped logical value, never renderX.
    let renderX = startX;
    let rafId = 0;

    function paint(x) {
      g.setAttribute("transform", `translate(${x}, ${TICK_Y})`);
    }

    // Eased follow toward state.x for buttery drag motion. Decorative only:
    // it animates the transform between frames but always converges exactly to
    // state.x, so no behavior, value, or callback depends on the tween.
    function tickTween() {
      rafId = 0;
      const diff = state.x - renderX;
      if (Math.abs(diff) < 0.25) {
        renderX = state.x;
        paint(renderX);
        return;
      }
      renderX += diff * 0.35; // critically-damped-feeling follow factor
      paint(renderX);
      rafId = requestAnimationFrame(tickTween);
    }

    function moveTo(clientX) {
      const rect = svg.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * 600;
      const clamped = Math.max(PAD_LEFT, Math.min(600 - PAD_RIGHT, svgX));
      state.x = snapToTick ? toX(toVal(clamped)) : clamped;
      currentVal = toVal(state.x);
      valLabel.textContent = formatNum(currentVal);

      setAria(currentVal);
      if (prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
        // No tween: paint immediately (original behavior, exactly preserved).
        renderX = state.x;
        paint(renderX);
        return;
      }
      if (!rafId) rafId = requestAnimationFrame(tickTween);
    }

    g.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      state.dragging = true;
      g.style.cursor = "grabbing";
      dot.setAttribute("fill", "#e5b54e");
      shadow.setAttribute("fill", "rgba(31,166,162,0.15)");
      svg.setPointerCapture(e.pointerId);

      const onMove = (ev) => {
        if (state.dragging) moveTo(ev.clientX);
      };
      const onUp = () => {
        state.dragging = false;
        g.style.cursor = "grab";
        dot.setAttribute("fill", "#f2c15b");
        shadow.setAttribute("fill", "rgba(18,53,91,0.12)");
        svg.removeEventListener("pointermove", onMove);
        svg.removeEventListener("pointerup", onUp);
      };

      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
    });

    // Keyboard support
    g.addEventListener("keydown", (e) => {
      const delta = e.shiftKey ? step * 5 : step;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        currentVal = Math.min(max, round(currentVal + delta));
        state.x = toX(currentVal);
        renderX = state.x;
        g.setAttribute("transform", `translate(${state.x}, ${TICK_Y})`);
        valLabel.textContent = formatNum(currentVal);
        setAria(currentVal);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        currentVal = Math.max(min, round(currentVal - delta));
        state.x = toX(currentVal);
        renderX = state.x;
        g.setAttribute("transform", `translate(${state.x}, ${TICK_Y})`);
        valLabel.textContent = formatNum(currentVal);
        setAria(currentVal);
      }
    });

    svg.append(g);
    dots.push({ g, getVal: () => currentVal, target: t });
  });

  wrapper.append(svg);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Placement";

  let completed = false;

  checkBtn.addEventListener("click", () => {
    if (completed) return;
    let correct = 0;

    dots.forEach(({ g, getVal, target }, i) => {
      const val = getVal();
      const tolerance = step * 0.4;
      const isCorrect = Math.abs(val - target.value) <= tolerance;

      const dot = g.querySelector("circle:nth-child(2)");
      if (isCorrect) {
        // Color change goes through the .nl-dot CSS transition (smooth fade).
        dot.setAttribute("fill", "#0f7c4a");
        dot.setAttribute("stroke", "#0f7c4a");
        dot.classList.add("nl-dot-correct");
        correct++;
      } else {
        dot.setAttribute("fill", "#b64e2f");
        dot.setAttribute("stroke", "#b64e2f");
        const marker = targetMarkers[i].marker;
        marker.style.display = "";
        // Trigger the grow + fade-in on the now-revealed target marker.
        triggerTargetMarker(marker);
      }
    });

    // Haptic confirmation: a short pulse for partial correctness, a celebratory
    // double-pulse when everything lands. Guarded + reduced-motion aware below.
    if (correct > 0) {
      vibrate(correct === targets.length ? [18, 60, 30] : 14);
    }

    if (correct === targets.length) {
      completed = true;
      checkBtn.style.display = "none";
      burstConfetti(svg);
      showFb(feedbackSlot, "success", `All ${targets.length} points placed correctly!`);
      if (onComplete) onComplete(correct, targets.length);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `${correct} of ${targets.length} correct. Green circles show where the remaining points belong.`,
      );
    }
  });

  wrapper.append(checkBtn);
  container.append(wrapper);
}

// One dot, moved to each value in turn. Snaps to tenths when the values are
// decimals (so 3.4 is actually reachable — integer snapping was the "weird" part),
// shows the current target and progress, and advances on a correct placement.
function renderSequentialNumberLine(container, config) {
  const { min, max, targets, label, instructions, onComplete } = config;
  injectNumberLineStyles();
  const lo = Number(min ?? 0);
  const hi = Number(max ?? 10);
  // Snap to the finest place the target values actually use, so hundredths like
  // 4.65 are reachable (not rounded to 4.7). tenths → 0.1, hundredths → 0.01.
  const places = (x) => {
    const s = String(x);
    const i = s.indexOf(".");
    return i < 0 ? 0 : s.length - i - 1;
  };
  const maxPlaces = Math.max(0, ...targets.map((t) => places(Number(t.value))));
  const hasDecimals = maxPlaces > 0;
  const snapStep = maxPlaces >= 2 ? 0.01 : maxPlaces === 1 ? 0.1 : Number(config.step) || 1;
  const wide = hi - lo > 20;
  // Label whole numbers (spaced out on wide ranges); don't label the fine
  // decimal ticks or the line gets crowded with 0.5, 1.5, …
  const labelStep = hasDecimals ? (wide ? 5 : 1) : Number(config.step) || (wide ? 5 : 1);
  const tol = snapStep * 0.6;

  const wrapper = document.createElement("div");
  wrapper.className = "card";
  const lead = label || instructions;
  if (lead) {
    const p = document.createElement("p");
    p.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-3); line-height:1.5;";
    p.textContent = lead;
    wrapper.append(p);
  }

  const prompt = document.createElement("p");
  prompt.style.cssText =
    "margin:0 0 var(--sp-2); font-weight:700; color:var(--navy,#12355b); text-align:center;";
  wrapper.append(prompt);

  const PAD_LEFT = 40;
  const PAD_RIGHT = 20;
  const HEIGHT = 120;
  const TICK_Y = 60;
  const DOT_R = 11;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 600 ${HEIGHT}`);
  svg.style.cssText = "width:100%; height:auto; user-select:none; touch-action:none;";
  svg.setAttribute("role", "application");
  svg.setAttribute("aria-label", `Number line from ${lo} to ${hi}`);
  const usable = 600 - PAD_LEFT - PAD_RIGHT;
  const toX = (v) => PAD_LEFT + ((v - lo) / (hi - lo)) * usable;
  const toVal = (x) => {
    const raw = lo + ((x - PAD_LEFT) / usable) * (hi - lo);
    return round(Math.round(raw / snapStep) * snapStep);
  };

  line(svg, PAD_LEFT, TICK_Y, 600 - PAD_RIGHT, TICK_Y, "#1fa6a2", 3);
  poly(
    svg,
    `${PAD_LEFT - 6},${TICK_Y} ${PAD_LEFT + 4},${TICK_Y - 5} ${PAD_LEFT + 4},${TICK_Y + 5}`,
    "#1fa6a2",
  );
  poly(
    svg,
    `${600 - PAD_RIGHT + 6},${TICK_Y} ${600 - PAD_RIGHT - 4},${TICK_Y - 5} ${600 - PAD_RIGHT - 4},${TICK_Y + 5}`,
    "#1fa6a2",
  );
  // Minor ticks (whole-and-half) plus labeled major ticks.
  const minor = hasDecimals ? (wide ? 1 : 0.5) : labelStep;
  for (let v = lo; v <= hi + 1e-9; v = round(v + minor)) {
    const x = toX(v);
    const isMajor = Math.abs(v / labelStep - Math.round(v / labelStep)) < 1e-9;
    line(
      svg,
      x,
      TICK_Y - (isMajor ? 8 : 5),
      x,
      TICK_Y + (isMajor ? 8 : 5),
      "#12355b",
      isMajor ? 1.5 : 1,
    );
    if (isMajor) {
      const t = text(svg, x, TICK_Y + 24, formatNum(v), "11px", "#21313f");
      t.setAttribute("text-anchor", "middle");
    }
  }

  const targetMarker = circle(svg, toX(lo), TICK_Y, 7, "none", "#0f7c4a", 2);
  targetMarker.style.display = "none";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.style.cursor = "grab";
  const shadow = circle(g, 0, 0, DOT_R + 2, "rgba(18,53,91,0.12)", "none", 0);
  const dot = circle(g, 0, 0, DOT_R, "#f2c15b", "#12355b", 2.5);
  dot.setAttribute("class", "nl-dot");
  const valLabel = text(g, 0, -18, "", "12px", "#12355b");
  valLabel.setAttribute("text-anchor", "middle");
  valLabel.setAttribute("font-weight", "800");
  g.append(shadow, dot, valLabel);
  g.setAttribute("role", "slider");
  g.setAttribute("tabindex", "0");
  g.setAttribute("aria-valuemin", String(lo));
  g.setAttribute("aria-valuemax", String(hi));

  let curVal = toVal(toX(lo));
  const setDot = (v) => {
    curVal = round(Math.max(lo, Math.min(hi, Math.round(v / snapStep) * snapStep)));
    g.setAttribute("transform", `translate(${toX(curVal)}, ${TICK_Y})`);
    valLabel.textContent = formatNum(curVal);
    g.setAttribute("aria-valuenow", String(curVal));
    g.setAttribute("aria-valuetext", formatNum(curVal));
  };
  setDot(lo);

  g.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    g.style.cursor = "grabbing";
    svg.setPointerCapture(e.pointerId);
    const onMove = (ev) => {
      const rect = svg.getBoundingClientRect();
      const svgX = ((ev.clientX - rect.left) / rect.width) * 600;
      setDot(toVal(Math.max(PAD_LEFT, Math.min(600 - PAD_RIGHT, svgX))));
    };
    const onUp = () => {
      g.style.cursor = "grab";
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
    };
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
  });
  g.addEventListener("keydown", (e) => {
    // Fine step = one snap unit (reach any hundredth); Shift jumps by a bigger
    // step so keyboard users aren't pressing 400 times to cross the line.
    const d = e.shiftKey ? Math.max(snapStep * 10, 0.1) : snapStep;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setDot(curVal + d);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setDot(curVal - d);
    }
  });
  svg.append(g);
  wrapper.append(svg);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check placement";

  let idx = 0;
  const showTarget = () => {
    const t = targets[idx];
    prompt.innerHTML = `Move the dot to: <span style="color:var(--teal,#0d7a76)">${escHtml(t.label || formatNum(t.value))}</span> &nbsp;<span style="color:var(--muted,#5f6f80); font-weight:600;">(${idx + 1} of ${targets.length})</span>`;
    targetMarker.style.display = "none";
  };
  showTarget();

  checkBtn.addEventListener("click", () => {
    const t = targets[idx];
    if (Math.abs(curVal - Number(t.value)) <= tol + 1e-9) {
      idx += 1;
      if (idx >= targets.length) {
        checkBtn.style.display = "none";
        burstConfetti(svg);
        showFb(feedbackSlot, "success", `All ${targets.length} decimals placed! 🎉`);
        prompt.textContent = "Nice — every decimal is in the right spot.";
        if (onComplete) onComplete(targets.length, targets.length);
      } else {
        showFb(feedbackSlot, "success", "Correct! Now the next one.");
        // Leave the dot where the student placed it — don't snap it back to 0,
        // which felt like losing their work. They slide on to the next value.
        showTarget();
      }
    } else {
      targetMarker.setAttribute("cx", toX(Number(t.value)));
      targetMarker.style.transformOrigin = `${toX(Number(t.value))}px ${TICK_Y}px`;
      targetMarker.style.display = "";
      triggerTargetMarker(targetMarker);
      showFb(
        feedbackSlot,
        "hint",
        `Not yet — the green circle shows where ${formatNum(t.value)} goes. Slide the dot there.`,
      );
    }
  });

  wrapper.append(checkBtn, feedbackSlot);
  container.append(wrapper);
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Normalize an inequality string for comparison: lowercase, strip spaces,
// fold ≥/≤ to >=/<=. So "x ≥ 5", "x>=5", "X >= 5" all match.
function normalizeIneq(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/⩾/g, ">=")
    .replace(/⩽/g, "<=");
}

// Draw a single inequality graph (open/closed boundary circle + shaded ray) on
// a fresh number line centered on the boundary. Used by renderInequalityGraphs.
function drawInequalityLine(boundary, circleType, direction) {
  const PAD = 40;
  const TICK_Y = 55;
  const W = 600;
  const usable = W - PAD * 2;
  const bmin = boundary - 5;
  const bmax = boundary + 5;
  const toX = (v) => PAD + ((v - bmin) / (bmax - bmin)) * usable;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} 100`);
  svg.style.cssText = "width:100%; height:auto;";
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    `Number line: ${circleType} circle at ${boundary}, shaded ${direction}`,
  );

  line(svg, PAD, TICK_Y, W - PAD, TICK_Y, "#1fa6a2", 3);
  poly(svg, `${PAD - 6},${TICK_Y} ${PAD + 4},${TICK_Y - 5} ${PAD + 4},${TICK_Y + 5}`, "#1fa6a2");
  poly(
    svg,
    `${W - PAD + 6},${TICK_Y} ${W - PAD - 4},${TICK_Y - 5} ${W - PAD - 4},${TICK_Y + 5}`,
    "#1fa6a2",
  );

  for (let v = bmin; v <= bmax; v += 1) {
    const x = toX(v);
    line(svg, x, TICK_Y - 7, x, TICK_Y + 7, "#12355b", 1.5);
    const t = text(svg, x, TICK_Y + 22, formatNum(v), "11px", "#21313f");
    t.setAttribute("text-anchor", "middle");
  }

  // Shaded ray from the boundary toward `direction`.
  const bx = toX(boundary);
  const endX = direction === "left" ? PAD + 6 : W - PAD - 6;
  const ray = line(svg, bx, TICK_Y, endX, TICK_Y, "#d9795d", 6);
  ray.setAttribute("stroke-linecap", "round");
  ray.setAttribute("opacity", "0.85");

  // Boundary circle: closed = filled, open = hollow.
  const filled = circleType === "closed";
  circle(svg, bx, TICK_Y, 9, filled ? "#12355b" : "#ffffff", "#12355b", 3);
  return svg;
}

// "Graph and read" inequalities: for each authored problem, show the graph and
// ask the learner to write the matching inequality. Reveals the answer after a
// second miss so the queue never stalls.
function renderInequalityGraphs(container, config) {
  const { problems, instructions, label, hints, onComplete } = config;
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (instructions || label) {
    const p = document.createElement("p");
    p.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = instructions || label;
    wrapper.append(p);
  }

  const total = problems.length;
  let resolved = 0;
  let correctCount = 0;

  problems.forEach((prob, idx) => {
    const row = document.createElement("div");
    row.style.cssText =
      "border:1px solid var(--line, #d9e2ec); border-radius:var(--radius-md); padding:var(--sp-3); margin-bottom:var(--sp-4);";

    if (prob.label) {
      const cap = document.createElement("p");
      cap.style.cssText = "font-weight:600; margin:0 0 var(--sp-2); font-size:0.95rem;";
      cap.textContent = prob.label;
      row.append(cap);
    }

    row.append(drawInequalityLine(prob.boundary, prob.circleType, prob.direction));

    const controls = document.createElement("div");
    controls.style.cssText =
      "display:flex; gap:var(--sp-2); align-items:center; margin-top:var(--sp-2);";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "text-input";
    input.style.cssText = "max-width:160px;";
    input.placeholder = "e.g. x ≥ 5";
    input.setAttribute("aria-label", "Write the inequality");
    const checkBtn = document.createElement("button");
    checkBtn.className = "btn btn-primary";
    checkBtn.textContent = "Check";
    controls.append(input, checkBtn);

    const fb = document.createElement("div");
    fb.className = "mt-3";

    let locked = false;
    let attempts = 0;
    const resolve = (wasCorrect) => {
      locked = true;
      input.readOnly = true;
      checkBtn.style.display = "none";
      if (wasCorrect) correctCount += 1;
      resolved += 1;
      if (resolved === total && onComplete) onComplete(correctCount, total);
    };

    checkBtn.addEventListener("click", () => {
      if (locked) return;
      const val = input.value.trim();
      if (!val) {
        showFb(fb, "hint", "Type the inequality first.");
        return;
      }
      if (normalizeIneq(val) === normalizeIneq(prob.inequality)) {
        input.style.borderColor = "var(--success)";
        input.style.background = "var(--success-bg)";
        showFb(fb, "success", `Correct! ${prob.inequality}`);
        resolve(true);
      } else {
        attempts += 1;
        if (attempts >= 2) {
          showFb(
            fb,
            "hint",
            `The answer is ${prob.inequality}. ${(hints && hints[idx]) || ""}`.trim(),
          );
          resolve(false);
        } else {
          showFb(
            fb,
            "hint",
            (hints && hints[idx]) || "Check the circle type and shading direction.",
          );
        }
      }
    });

    row.append(controls, fb);
    wrapper.append(row);
  });

  container.append(wrapper);
}

// Skip-counting jumps line for `totalJumps`/`jumpSize` configs: draws evenly
// spaced jump arcs from min to max and asks the authored numeric question.
function renderJumpNumberLine(container, config) {
  const {
    instructions,
    label,
    questionText,
    answer,
    totalJumps,
    min,
    max,
    step,
    hints,
    onComplete,
  } = config;
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (instructions || label) {
    const p = document.createElement("p");
    p.style.cssText = "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = instructions || label;
    wrapper.append(p);
  }

  const lo = Number(min ?? 0);
  const hi = Number(max ?? 1);
  const jumps = Math.max(1, Number(totalJumps) || Math.round((hi - lo) / (Number(step) || 1)));
  const PAD = 40;
  const TICK_Y = 70;
  const W = 600;
  const usable = W - PAD * 2;
  const toX = (v) => PAD + ((v - lo) / (hi - lo || 1)) * usable;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} 110`);
  svg.style.cssText = "width:100%; height:auto;";
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Number line from ${lo} to ${hi} with ${jumps} equal jumps`);

  line(svg, PAD, TICK_Y, W - PAD, TICK_Y, "#1fa6a2", 3);
  const st = Number(step) || (hi - lo) / jumps;
  for (let v = lo; v <= hi + 1e-9; v = round(v + st)) {
    const x = toX(v);
    line(svg, x, TICK_Y - 7, x, TICK_Y + 7, "#12355b", 1.5);
    const t = text(svg, x, TICK_Y + 22, formatNum(v), "11px", "#21313f");
    t.setAttribute("text-anchor", "middle");
  }

  // Jump arcs above the line.
  for (let i = 0; i < jumps; i++) {
    const x0 = toX(lo + ((hi - lo) * i) / jumps);
    const x1 = toX(lo + ((hi - lo) * (i + 1)) / jumps);
    const midX = (x0 + x1) / 2;
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arc.setAttribute("d", `M ${x0} ${TICK_Y} Q ${midX} ${TICK_Y - 34} ${x1} ${TICK_Y}`);
    arc.setAttribute("fill", "none");
    arc.setAttribute("stroke", "#d9795d");
    arc.setAttribute("stroke-width", "2.5");
    svg.append(arc);
    poly(svg, `${x1},${TICK_Y} ${x1 - 5},${TICK_Y - 7} ${x1 + 1},${TICK_Y - 6}`, "#d9795d");
  }
  wrapper.append(svg);

  const q = document.createElement("div");
  q.className = "card-compact card-teal";
  q.style.cssText =
    "background:var(--teal-light); border:1px solid rgba(31,166,162,0.15); border-radius:var(--radius-md); padding:var(--sp-4); margin-top:var(--sp-3);";
  if (questionText) {
    const qt = document.createElement("p");
    qt.style.cssText = "font-weight:700; margin:0 0 var(--sp-3);";
    qt.textContent = questionText;
    q.append(qt);
  }
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; gap:var(--sp-2); align-items:center;";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "text-input";
  input.style.cssText = "max-width:130px;";
  input.placeholder = "Your answer";
  input.setAttribute("aria-label", questionText || "Your answer");
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary";
  checkBtn.textContent = "Check";
  controls.append(input, checkBtn);
  const fb = document.createElement("div");
  fb.className = "mt-3";
  q.append(controls, fb);
  wrapper.append(q);

  let done = false;
  checkBtn.addEventListener("click", () => {
    if (done) return;
    const val = input.value.trim();
    if (!val) {
      showFb(fb, "hint", "Enter your answer first.");
      return;
    }
    const nv = parseFloat(val.replace(/[,\s]/g, ""));
    const na = parseFloat(String(answer).replace(/[,\s]/g, ""));
    const ok =
      !isNaN(nv) && !isNaN(na)
        ? Math.abs(nv - na) < 1e-6
        : val.toLowerCase() === String(answer).toLowerCase();
    if (ok) {
      done = true;
      input.readOnly = true;
      input.style.borderColor = "var(--success)";
      input.style.background = "var(--success-bg)";
      checkBtn.style.display = "none";
      showFb(fb, "success", `Correct! The answer is ${answer}.`);
      if (onComplete) onComplete(1, 1);
    } else {
      showFb(fb, "hint", (hints && hints[0]) || "Count the jumps one at a time from the start.");
    }
  });

  container.append(wrapper);
}

function line(parent, x1, y1, x2, y2, stroke, width) {
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

function circle(parent, cx, cy, r, fill, stroke, strokeWidth) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", cx);
  el.setAttribute("cy", cy);
  el.setAttribute("r", r);
  el.setAttribute("fill", fill || "none");
  if (stroke) el.setAttribute("stroke", stroke);
  if (strokeWidth) el.setAttribute("stroke-width", strokeWidth);
  parent.append(el);
  return el;
}

function text(parent, x, y, content, size, fill) {
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

function poly(parent, points, fill) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  el.setAttribute("points", points);
  el.setAttribute("fill", fill);
  parent.append(el);
  return el;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `
    <span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span>
    <span>${msg}</span>
  `;
  slot.innerHTML = "";
  slot.append(fb);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Restart the grow + fade-in animation on a freshly revealed target marker.
// The CSS class drives the keyframes; reduced-motion users get an instant
// (un-animated) reveal via the media query. Reflow toggle lets a re-check
// replay the animation. Purely visual — display/value state is unaffected.
function triggerTargetMarker(marker) {
  if (!marker) return;
  if (prefersReducedMotion()) return;
  marker.classList.remove("nl-marker-reveal");
  // Force reflow so the animation re-triggers if the class was already present.
  void marker.getBoundingClientRect();
  marker.classList.add("nl-marker-reveal");
}

// Best-effort haptic feedback. Silently no-ops where unsupported (desktop,
// iOS Safari) and is suppressed under reduced-motion to respect that
// preference. Never throws; never affects checking/return values.
function vibrate(pattern) {
  if (prefersReducedMotion()) return;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch (_) {
    /* vibration is non-essential; ignore any platform error */
  }
}

// Success micro-burst: a short-lived radial spray of CSS-animated dots
// centered on the number line. Fully skipped under reduced-motion. Purely
// decorative (aria-hidden) and self-cleaning, so it never touches the DOM
// contract or checking logic.
function burstConfetti(anchor) {
  if (prefersReducedMotion() || !anchor || !anchor.getBoundingClientRect) {
    return;
  }
  const rect = anchor.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const layer = document.createElement("div");
  layer.className = "nl-confetti-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.style.left = `${rect.left + rect.width / 2}px`;
  layer.style.top = `${rect.top + rect.height / 2}px`;

  const colors = ["#0f7c4a", "#1fa6a2", "#f2c15b", "#12355b"];
  const COUNT = 16;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement("span");
    dot.className = "nl-confetti-dot";
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 50 + Math.random() * 44;
    dot.style.setProperty("--nl-dx", `${Math.cos(angle) * dist}px`);
    dot.style.setProperty("--nl-dy", `${Math.sin(angle) * dist}px`);
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = `${Math.random() * 60}ms`;
    layer.append(dot);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 950);
}

let nlStylesInjected = false;
function injectNumberLineStyles() {
  if (nlStylesInjected) return;
  if (typeof document === "undefined") return;
  if (document.getElementById("nl-engine-styles")) {
    nlStylesInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.id = "nl-engine-styles";
  style.textContent = `
    /* Smooth fill/stroke fade when a dot is marked correct/incorrect. */
    .nl-dot {
      transition: fill 0.3s ease, stroke 0.3s ease;
    }
    /* Gentle confirmation pop on a correctly placed dot. */
    .nl-dot-correct {
      animation: nl-dot-pop 0.42s cubic-bezier(0.16, 0.8, 0.3, 1) both;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes nl-dot-pop {
      0%   { transform: scale(1); }
      45%  { transform: scale(1.32); }
      100% { transform: scale(1); }
    }
    /* Target marker grows in + fades in when revealed on an incorrect answer. */
    .nl-marker-reveal {
      animation: nl-marker-grow 0.4s cubic-bezier(0.16, 0.8, 0.3, 1) both;
    }
    @keyframes nl-marker-grow {
      0%   { transform: scale(0.2); opacity: 0; }
      60%  { transform: scale(1.18); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    /* All-correct celebration confetti. */
    .nl-confetti-layer {
      position: fixed;
      z-index: 1200;
      pointer-events: none;
      width: 0;
      height: 0;
    }
    .nl-confetti-dot {
      position: absolute;
      width: 9px;
      height: 9px;
      margin: -4.5px 0 0 -4.5px;
      border-radius: 2px;
      opacity: 0;
      animation: nl-confetti-fly 0.85s cubic-bezier(0.16, 0.8, 0.3, 1) forwards;
    }
    @keyframes nl-confetti-fly {
      0%   { transform: translate(0, 0) scale(0.6); opacity: 1; }
      70%  { opacity: 1; }
      100% {
        transform: translate(var(--nl-dx, 0), var(--nl-dy, 0)) scale(1);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .nl-dot,
      .nl-dot-correct,
      .nl-marker-reveal,
      .nl-confetti-dot {
        transition: none !important;
        animation: none !important;
      }
      .nl-dot-correct { transform: none; }
      /* Drop the celebration layer entirely. */
      .nl-confetti-layer { display: none !important; }
    }
  `;
  (document.head || document.documentElement).append(style);
  nlStylesInjected = true;
}
