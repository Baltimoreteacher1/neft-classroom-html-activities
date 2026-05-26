export function renderNumberLine(
  container,
  { min, max, step, targets, snapToTick, label, onComplete },
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

    function moveTo(clientX) {
      const rect = svg.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * 600;
      const clamped = Math.max(PAD_LEFT, Math.min(600 - PAD_RIGHT, svgX));
      state.x = snapToTick ? toX(toVal(clamped)) : clamped;
      currentVal = toVal(state.x);
      g.setAttribute("transform", `translate(${state.x}, ${TICK_Y})`);
      valLabel.textContent = formatNum(currentVal);
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
        g.setAttribute("transform", `translate(${state.x}, ${TICK_Y})`);
        valLabel.textContent = formatNum(currentVal);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        currentVal = Math.max(min, round(currentVal - delta));
        state.x = toX(currentVal);
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
        dot.setAttribute("fill", "#0f7c4a");
        dot.setAttribute("stroke", "#0f7c4a");
        correct++;
      } else {
        dot.setAttribute("fill", "#b64e2f");
        dot.setAttribute("stroke", "#b64e2f");
        targetMarkers[i].marker.style.display = "";
      }
    });

    if (correct === targets.length) {
      completed = true;
      checkBtn.style.display = "none";
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
