export function renderCoordinateGrid(
  container,
  {
    xMin,
    xMax,
    yMin,
    yMax,
    xStep,
    yStep,
    xLabel,
    yLabel,
    targets,
    label,
    showLine,
    onComplete,
  },
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

  const W = 500,
    H = 500;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const toSvgX = (v) => PAD.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (v) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;
  const fromSvg = (sx, sy) => ({
    x: Math.round(((sx - PAD.left) / plotW) * (xMax - xMin) + xMin),
    y: Math.round(((PAD.top + plotH - sy) / plotH) * (yMax - yMin) + yMin),
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.cssText =
    "width:100%; max-width:500px; height:auto; display:block; margin:0 auto; user-select:none; touch-action:none; background:white; border-radius:var(--radius-md); border:1px solid var(--line);";
  svg.setAttribute("role", "application");
  svg.setAttribute("aria-label", "Coordinate grid");

  // Gridlines
  for (let x = xMin; x <= xMax; x += xStep) {
    const sx = toSvgX(x);
    svgLine(svg, sx, PAD.top, sx, PAD.top + plotH, "#e8edf2", 0.5);
  }
  for (let y = yMin; y <= yMax; y += yStep) {
    const sy = toSvgY(y);
    svgLine(svg, PAD.left, sy, PAD.left + plotW, sy, "#e8edf2", 0.5);
  }

  // Axes
  if (xMin <= 0 && xMax >= 0) {
    svgLine(
      svg,
      toSvgX(0),
      PAD.top,
      toSvgX(0),
      PAD.top + plotH,
      "#12355b",
      1.5,
    );
  }
  if (yMin <= 0 && yMax >= 0) {
    svgLine(
      svg,
      PAD.left,
      toSvgY(0),
      PAD.left + plotW,
      toSvgY(0),
      "#12355b",
      1.5,
    );
  }

  // Axis border
  svgLine(svg, PAD.left, PAD.top, PAD.left, PAD.top + plotH, "#1fa6a2", 2);
  svgLine(
    svg,
    PAD.left,
    PAD.top + plotH,
    PAD.left + plotW,
    PAD.top + plotH,
    "#1fa6a2",
    2,
  );

  // Tick labels
  for (let x = xMin; x <= xMax; x += xStep) {
    const t = svgText(
      svg,
      toSvgX(x),
      PAD.top + plotH + 18,
      String(x),
      "10px",
      "#5f6f80",
    );
    t.setAttribute("text-anchor", "middle");
  }
  for (let y = yMin; y <= yMax; y += yStep) {
    const t = svgText(
      svg,
      PAD.left - 10,
      toSvgY(y) + 4,
      String(y),
      "10px",
      "#5f6f80",
    );
    t.setAttribute("text-anchor", "end");
  }

  // Axis labels
  if (xLabel) {
    const xl = svgText(
      svg,
      PAD.left + plotW / 2,
      H - 4,
      xLabel,
      "12px",
      "#12355b",
    );
    xl.setAttribute("text-anchor", "middle");
    xl.setAttribute("font-weight", "700");
  }
  if (yLabel) {
    const yl = svgText(svg, 14, PAD.top + plotH / 2, yLabel, "12px", "#12355b");
    yl.setAttribute("text-anchor", "middle");
    yl.setAttribute("font-weight", "700");
    yl.setAttribute("transform", `rotate(-90, 14, ${PAD.top + plotH / 2})`);
  }

  // Plotted points (student places these by clicking)
  const placedPoints = [];
  const targetMarkers = [];

  // Show target indicators (hidden until check)
  targets.forEach((t) => {
    const cx = toSvgX(t.x);
    const cy = toSvgY(t.y);
    const ring = svgCircle(svg, cx, cy, 12, "none", "rgba(15,124,74,0.3)", 2);
    ring.style.display = "none";
    ring.setAttribute("stroke-dasharray", "4,3");
    targetMarkers.push({ ring, ...t });
  });

  // Instruction text
  const instrGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g",
  );
  const instrBg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect",
  );
  instrBg.setAttribute("x", PAD.left + 10);
  instrBg.setAttribute("y", PAD.top + 6);
  instrBg.setAttribute("width", 200);
  instrBg.setAttribute("height", 22);
  instrBg.setAttribute("rx", 4);
  instrBg.setAttribute("fill", "rgba(247,244,236,0.9)");
  const instrTxt = svgText(
    instrGroup,
    PAD.left + 14,
    PAD.top + 22,
    `Click to plot ${targets.length} point(s)`,
    "11px",
    "#5f6f80",
  );
  instrTxt.setAttribute("font-style", "italic");
  instrGroup.append(instrBg, instrTxt);
  svg.append(instrGroup);

  // Click to place points
  svg.addEventListener("click", (e) => {
    if (placedPoints.length >= targets.length) return;

    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;

    if (
      sx < PAD.left ||
      sx > PAD.left + plotW ||
      sy < PAD.top ||
      sy > PAD.top + plotH
    )
      return;

    const coord = fromSvg(sx, sy);

    // Snap to grid
    coord.x = Math.round(coord.x / xStep) * xStep;
    coord.y = Math.round(coord.y / yStep) * yStep;

    const finalSx = toSvgX(coord.x);
    const finalSy = toSvgY(coord.y);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dot = svgCircle(g, finalSx, finalSy, 7, "#f2c15b", "#12355b", 2);
    const lbl = svgText(
      g,
      finalSx + 12,
      finalSy - 8,
      `(${coord.x}, ${coord.y})`,
      "10px",
      "#12355b",
    );
    lbl.setAttribute("font-weight", "700");

    // Animate in
    dot.style.transformOrigin = `${finalSx}px ${finalSy}px`;
    dot.animate(
      [
        { transform: "scale(0)", opacity: 0 },
        { transform: "scale(1.3)", opacity: 1 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 300, easing: "cubic-bezier(0.34,1.56,0.64,1)" },
    );

    svg.append(g);
    placedPoints.push({ g, coord, dot });

    instrTxt.textContent = `${targets.length - placedPoints.length} point(s) remaining`;
    if (placedPoints.length >= targets.length)
      instrGroup.style.display = "none";

    // Right-click to remove last
    g.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      g.remove();
      const idx = placedPoints.findIndex((p) => p.g === g);
      if (idx >= 0) placedPoints.splice(idx, 1);
      instrGroup.style.display = "";
      instrTxt.textContent = `${targets.length - placedPoints.length} point(s) remaining`;
    });
  });

  wrapper.append(svg);

  // Draw line between points toggle
  if (showLine && targets.length >= 2) {
    const lineToggle = document.createElement("label");
    lineToggle.style.cssText =
      "display:flex; align-items:center; gap:var(--sp-2); font-size:0.88rem; font-weight:600; margin-top:var(--sp-3); cursor:pointer;";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.style.cssText = "width:18px; height:18px; accent-color:var(--teal);";
    lineToggle.append(
      cb,
      document.createTextNode(" Connect points with a line"),
    );
    wrapper.append(lineToggle);

    let drawnLine = null;
    cb.addEventListener("change", () => {
      if (drawnLine) {
        drawnLine.remove();
        drawnLine = null;
      }
      if (cb.checked && placedPoints.length >= 2) {
        drawnLine = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polyline",
        );
        const pts = placedPoints
          .map((p) => `${toSvgX(p.coord.x)},${toSvgY(p.coord.y)}`)
          .join(" ");
        drawnLine.setAttribute("points", pts);
        drawnLine.setAttribute("fill", "none");
        drawnLine.setAttribute("stroke", "#1fa6a2");
        drawnLine.setAttribute("stroke-width", "2.5");
        drawnLine.setAttribute("stroke-dasharray", "6,3");
        svg.append(drawnLine);
      }
    });
  }

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Points";
  let done = false;

  checkBtn.addEventListener("click", () => {
    if (done) return;
    if (placedPoints.length < targets.length) {
      showFb(
        feedbackSlot,
        "hint",
        `Place all ${targets.length} points before checking.`,
      );
      return;
    }

    let correct = 0;
    const used = new Set();

    placedPoints.forEach((pp) => {
      const match = targets.findIndex(
        (t, ti) => !used.has(ti) && t.x === pp.coord.x && t.y === pp.coord.y,
      );
      if (match >= 0) {
        used.add(match);
        pp.dot.setAttribute("fill", "#0f7c4a");
        pp.dot.setAttribute("stroke", "#0f7c4a");
        correct++;
      } else {
        pp.dot.setAttribute("fill", "#b64e2f");
        pp.dot.setAttribute("stroke", "#b64e2f");
      }
    });

    targets.forEach((t, i) => {
      if (!used.has(i)) targetMarkers[i].ring.style.display = "";
    });

    if (correct === targets.length) {
      done = true;
      checkBtn.style.display = "none";
      showFb(
        feedbackSlot,
        "success",
        `All ${targets.length} points plotted correctly!`,
      );
      if (onComplete) onComplete(correct, targets.length);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `${correct} of ${targets.length} correct. Dashed circles show where missing points belong. Right-click a point to remove it.`,
      );
    }
  });

  wrapper.append(checkBtn);
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
