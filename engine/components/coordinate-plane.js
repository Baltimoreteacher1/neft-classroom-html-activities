// Coordinate plane — interactive 4-quadrant plotting. Unit 9 (rational numbers
// on the coordinate plane). Distinct from coordinate-grid.js: always renders
// all four quadrants with labeled axes and a keyboard-movable crosshair cursor.
//
// Config:
//   instructions  string
//   range         { min, max } applied to both axes (default -10..10)
//   step          grid/snap step (default 1)
//   targets       array of { x, y, label }
//   onComplete(correct, total)
//
// Interaction: click/tap to place a point at the nearest lattice point.
// Keyboard: arrow keys move a crosshair; Enter/Space plots at the crosshair;
// Backspace/Delete removes the most recent point. aria-live announces the cursor.

export function renderCoordinatePlane(
  container,
  { instructions, range, step = 1, targets, label, onComplete },
) {
  const min = range?.min ?? -10;
  const max = range?.max ?? 10;

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const text = label || instructions;
  if (text) {
    const p = document.createElement("p");
    p.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = text;
    wrapper.append(p);
  }

  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.style.cssText =
    "position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);";
  wrapper.append(live);

  const W = 520,
    H = 520,
    PAD = 30;
  const plot = W - PAD * 2;
  const toX = (v) => PAD + ((v - min) / (max - min)) * plot;
  const toY = (v) => PAD + ((max - v) / (max - min)) * plot;
  const fromX = (sx) =>
    Math.round((((sx - PAD) / plot) * (max - min) + min) / step) * step;
  const fromY = (sy) =>
    Math.round((((PAD + plot - sy) / plot) * (max - min) + min) / step) * step;

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "application");
  svg.setAttribute(
    "aria-label",
    "Four-quadrant coordinate plane. Use arrow keys to move the cursor and Enter to plot.",
  );
  svg.setAttribute("tabindex", "0");
  svg.style.cssText =
    "width:100%; max-width:520px; height:auto; display:block; margin:0 auto; background:white; border:1px solid var(--line); border-radius:var(--radius-md); user-select:none; touch-action:none;";

  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // Gridlines
  for (let v = min; v <= max; v += step) {
    svg.append(
      svgEl("line", {
        x1: toX(v),
        y1: PAD,
        x2: toX(v),
        y2: PAD + plot,
        stroke: "#e8edf2",
        "stroke-width": v === 0 ? 0 : 0.5,
      }),
    );
    svg.append(
      svgEl("line", {
        x1: PAD,
        y1: toY(v),
        x2: PAD + plot,
        y2: toY(v),
        stroke: "#e8edf2",
        "stroke-width": v === 0 ? 0 : 0.5,
      }),
    );
  }
  // Axes
  svg.append(
    svgEl("line", {
      x1: toX(0),
      y1: PAD,
      x2: toX(0),
      y2: PAD + plot,
      stroke: "#12355b",
      "stroke-width": 2,
    }),
  );
  svg.append(
    svgEl("line", {
      x1: PAD,
      y1: toY(0),
      x2: PAD + plot,
      y2: toY(0),
      stroke: "#12355b",
      "stroke-width": 2,
    }),
  );
  // Axis number labels at every other tick to avoid clutter
  const labelStep = (max - min) / step > 12 ? step * 2 : step;
  for (let v = min; v <= max; v += labelStep) {
    if (v === 0) continue;
    const tx = svgEl("text", {
      x: toX(v),
      y: toY(0) + 14,
      "font-size": "10px",
      fill: "#5f6f80",
      "text-anchor": "middle",
      "font-family": "Calibri, sans-serif",
    });
    tx.textContent = String(v);
    svg.append(tx);
    const ty = svgEl("text", {
      x: toX(0) - 8,
      y: toY(v) + 4,
      "font-size": "10px",
      fill: "#5f6f80",
      "text-anchor": "end",
      "font-family": "Calibri, sans-serif",
    });
    ty.textContent = String(v);
    svg.append(ty);
  }

  // Quadrant labels
  const quad = [
    { x: max - step, y: max - step, t: "I" },
    { x: min + step, y: max - step, t: "II" },
    { x: min + step, y: min + step, t: "III" },
    { x: max - step, y: min + step, t: "IV" },
  ];
  quad.forEach((q) => {
    const e = svgEl("text", {
      x: toX(q.x),
      y: toY(q.y),
      "font-size": "13px",
      fill: "rgba(18,53,91,0.25)",
      "text-anchor": "middle",
      "font-weight": "800",
      "font-family": "Outfit, sans-serif",
    });
    e.textContent = q.t;
    svg.append(e);
  });

  // Target rings (hidden until check)
  const targetRings = targets.map((t) => {
    const r = svgEl("circle", {
      cx: toX(t.x),
      cy: toY(t.y),
      r: 11,
      fill: "none",
      stroke: "rgba(15,124,74,0.45)",
      "stroke-width": 2,
      "stroke-dasharray": "4,3",
    });
    r.style.display = "none";
    svg.append(r);
    return r;
  });

  // Keyboard crosshair
  let cur = { x: 0, y: 0 };
  const cross = svgEl("g", {});
  const ch1 = svgEl("line", { stroke: "var(--coral)", "stroke-width": 1.5 });
  const ch2 = svgEl("line", { stroke: "var(--coral)", "stroke-width": 1.5 });
  cross.append(ch1, ch2);
  cross.style.display = "none";
  svg.append(cross);
  function drawCross() {
    const cx = toX(cur.x),
      cy = toY(cur.y);
    ch1.setAttribute("x1", cx - 8);
    ch1.setAttribute("y1", cy);
    ch1.setAttribute("x2", cx + 8);
    ch1.setAttribute("y2", cy);
    ch2.setAttribute("x1", cx);
    ch2.setAttribute("y1", cy - 8);
    ch2.setAttribute("x2", cx);
    ch2.setAttribute("y2", cy + 8);
  }

  const placed = [];
  function placePoint(x, y) {
    if (placed.length >= targets.length) return;
    const g = svgEl("g", {});
    const dot = svgEl("circle", {
      cx: toX(x),
      cy: toY(y),
      r: 7,
      fill: "var(--amber)",
      stroke: "var(--navy)",
      "stroke-width": 2,
    });
    const lbl = svgEl("text", {
      x: toX(x) + 11,
      y: toY(y) - 9,
      "font-size": "11px",
      fill: "var(--navy)",
      "font-weight": "700",
      "font-family": "Calibri, sans-serif",
    });
    lbl.textContent = `(${x}, ${y})`;
    g.append(dot, lbl);
    svg.append(g);
    placed.push({ x, y, g, dot });
    live.textContent = `Plotted point at ${x}, ${y}. ${targets.length - placed.length} remaining.`;
    instr.textContent = remainingText();
  }

  svg.addEventListener("click", (e) => {
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    if (sx < PAD || sx > PAD + plot || sy < PAD || sy > PAD + plot) return;
    const x = Math.max(min, Math.min(max, fromX(sx)));
    const y = Math.max(min, Math.min(max, fromY(sy)));
    placePoint(x, y);
  });

  svg.addEventListener("focus", () => {
    cross.style.display = "";
    drawCross();
    live.textContent = `Cursor at ${cur.x}, ${cur.y}.`;
  });
  svg.addEventListener("blur", () => (cross.style.display = "none"));
  svg.addEventListener("keydown", (e) => {
    let handled = true;
    if (e.key === "ArrowRight") cur.x = Math.min(max, cur.x + step);
    else if (e.key === "ArrowLeft") cur.x = Math.max(min, cur.x - step);
    else if (e.key === "ArrowUp") cur.y = Math.min(max, cur.y + step);
    else if (e.key === "ArrowDown") cur.y = Math.max(min, cur.y - step);
    else if (e.key === "Enter" || e.key === " ") placePoint(cur.x, cur.y);
    else if (e.key === "Backspace" || e.key === "Delete") {
      const last = placed.pop();
      if (last) {
        last.g.remove();
        instr.textContent = remainingText();
      }
    } else handled = false;
    if (handled) {
      e.preventDefault();
      drawCross();
      if (e.key.startsWith("Arrow"))
        live.textContent = `Cursor at ${cur.x}, ${cur.y}.`;
    }
  });

  // Plane on the left, coordinates-to-plot list on the right (next to the
  // plane) so the ordered pairs are always visible. Stacks on narrow screens.
  const layout = document.createElement("div");
  layout.style.cssText =
    "display:flex; flex-wrap:wrap; gap:var(--sp-4); align-items:flex-start;";
  const planeWrap = document.createElement("div");
  planeWrap.style.cssText = "flex:1 1 340px; min-width:280px;";
  planeWrap.append(svg);

  const side = document.createElement("aside");
  side.style.cssText =
    "flex:1 1 190px; min-width:170px; padding:14px 16px; background:var(--surface-soft); border:1px solid var(--line); border-radius:var(--radius-md);";
  const sideHead = document.createElement("p");
  sideHead.style.cssText =
    "margin:0 0 10px; font-size:0.78rem; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:var(--teal-dark, #115e59);";
  sideHead.textContent = "Coordinates to plot";
  side.append(sideHead);
  const list = document.createElement("ol");
  list.style.cssText =
    "margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px;";
  const listItems = targets.map((t) => {
    const li = document.createElement("li");
    li.style.cssText =
      "display:flex; align-items:center; gap:8px; font-size:0.98rem; font-weight:700; color:var(--ink);";
    const dot = document.createElement("span");
    dot.style.cssText =
      "flex:0 0 auto; width:14px; height:14px; border-radius:50%; border:2px solid var(--line); background:#fff; transition:all .2s ease;";
    const txt = document.createElement("span");
    const name = t.label ? `${t.label}: ` : "";
    txt.innerHTML = `${name}<strong style="color:var(--navy,#12355b)">(${t.x}, ${t.y})</strong>`;
    li.append(dot, txt);
    list.append(li);
    return { li, dot, t };
  });
  side.append(list);
  layout.append(planeWrap, side);
  wrapper.append(layout);

  function remainingText() {
    return `${targets.length - placed.length} of ${targets.length} point(s) remaining. Click or use arrows + Enter.`;
  }
  const instr = document.createElement("div");
  instr.style.cssText =
    "font-size:0.82rem; color:var(--muted); margin-top:var(--sp-2);";
  instr.textContent = remainingText();
  wrapper.append(instr);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Points";
  let done = false;
  checkBtn.addEventListener("click", () => {
    if (done) return;
    if (placed.length < targets.length) {
      showFb(
        feedbackSlot,
        "hint",
        `Plot all ${targets.length} points before checking.`,
      );
      return;
    }
    let correct = 0;
    const used = new Set();
    placed.forEach((p) => {
      const m = targets.findIndex(
        (t, ti) => !used.has(ti) && t.x === p.x && t.y === p.y,
      );
      if (m >= 0) {
        used.add(m);
        p.dot.setAttribute("fill", "#0f7c4a");
        p.dot.setAttribute("stroke", "#0f7c4a");
        correct++;
      } else {
        p.dot.setAttribute("fill", "#b64e2f");
        p.dot.setAttribute("stroke", "#b64e2f");
      }
    });
    targets.forEach((t, i) => {
      if (!used.has(i)) {
        targetRings[i].style.display = "";
      } else if (listItems[i]) {
        listItems[i].dot.style.background = "var(--success, #16a34a)";
        listItems[i].dot.style.borderColor = "var(--success, #16a34a)";
      }
    });
    if (correct === targets.length) {
      done = true;
      checkBtn.style.display = "none";
      showFb(
        feedbackSlot,
        "success",
        `All ${targets.length} points plotted correctly!`,
      );
      onComplete?.(correct, targets.length);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `${correct} of ${targets.length} correct. Dashed rings show where the remaining points belong.`,
      );
    }
  });
  wrapper.append(checkBtn);

  container.append(wrapper);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}
