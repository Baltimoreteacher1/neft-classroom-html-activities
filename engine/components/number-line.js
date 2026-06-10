export function renderNumberLine(
  container,
  { min, max, step, targets, snapToTick, label, onComplete },
) {
  injectNumberLineStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
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
  svg.style.cssText =
    "width:100%; height:auto; user-select:none; touch-action:none;";
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
  const axis = line(
    svg,
    PAD_LEFT,
    TICK_Y,
    600 - PAD_RIGHT,
    TICK_Y,
    "#1fa6a2",
    3,
  );

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

    let currentVal = toVal(startX);
    valLabel.textContent = formatNum(currentVal);

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

      if (
        prefersReducedMotion() ||
        typeof requestAnimationFrame !== "function"
      ) {
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
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        currentVal = Math.max(min, round(currentVal - delta));
        state.x = toX(currentVal);
        renderX = state.x;
        g.setAttribute("transform", `translate(${state.x}, ${TICK_Y})`);
        valLabel.textContent = formatNum(currentVal);
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
      showFb(
        feedbackSlot,
        "success",
        `All ${targets.length} points placed correctly!`,
      );
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
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
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
