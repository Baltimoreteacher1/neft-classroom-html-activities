// Algebra tiles — drag tiles into a workspace to model an expression, then
// evaluate it for a given x. Unit 6 (Expressions & Equations).
//
// Config:
//   instructions   string
//   tileSet        array of { type:"x"|"unit", value:1|-1, count } available in the tray
//   target         { x: <number>, value: <number> }  expected expression value at x
//   targetExpr     optional { xCount, unitCount }  required tile composition
//   onComplete(correct, total)
//
// Each tile: x-tile worth `x` (set per check), unit-tile worth ±1.
// Keyboard: focus a tray tile and press Enter/Space to send it to the workspace;
// focus a workspace tile and press Delete/Backspace to return it.

export function renderAlgebraTiles(
  container,
  { instructions, tileSet, target, targetExpr, onComplete },
) {
  injectAlgebraTilesStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (instructions) {
    const p = document.createElement("p");
    p.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    p.textContent = instructions;
    wrapper.append(p);
  }

  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.className = "sr-live";
  live.style.cssText =
    "position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);";
  wrapper.append(live);

  const xVal = target?.x ?? 2;

  function tileLabel(t) {
    if (t.type === "x") return t.value < 0 ? "-x" : "x";
    return t.value < 0 ? "-1" : "+1";
  }
  function tileColor(t) {
    if (t.type === "x") return t.value < 0 ? "var(--coral)" : "var(--teal)";
    return t.value < 0 ? "var(--coral-light)" : "var(--amber-light)";
  }

  const trayLabel = document.createElement("div");
  trayLabel.className = "badge badge-navy mb-4";
  trayLabel.textContent = "Tile Tray — pick tiles to build the expression";
  wrapper.append(trayLabel);

  const tray = document.createElement("div");
  tray.dataset.zone = "tray";
  tray.style.cssText =
    "display:flex; flex-wrap:wrap; gap:var(--sp-2); min-height:64px; padding:var(--sp-3); background:var(--cream); border-radius:var(--radius-md); margin-bottom:var(--sp-4);";
  wrapper.append(tray);

  const workLabel = document.createElement("div");
  workLabel.className = "badge badge-teal mb-4";
  workLabel.textContent = "Workspace";
  wrapper.append(workLabel);

  const work = document.createElement("div");
  work.dataset.zone = "work";
  work.className = "at-workzone";
  work.style.cssText =
    "display:flex; flex-wrap:wrap; gap:var(--sp-2); min-height:80px; padding:var(--sp-3); border:2px dashed var(--line); border-radius:var(--radius-md);";
  wrapper.append(work);

  let counter = 0;
  function makeTile(t) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "algebra-tile";
    el.dataset.type = t.type;
    el.dataset.value = String(t.value);
    el.dataset.tileId = `tile-${counter++}`;
    el.textContent = tileLabel(t);
    el.setAttribute(
      "aria-label",
      `${t.type === "x" ? "variable" : "unit"} tile ${tileLabel(t)}`,
    );
    el.style.cssText = `
      min-width:${t.type === "x" ? "56px" : "44px"}; height:44px; border-radius:var(--radius-sm);
      border:2px solid var(--navy); background:${tileColor(t)};
      color:${t.type === "x" && t.value > 0 ? "white" : "var(--navy)"};
      font-weight:800; font-size:0.95rem; cursor:grab; touch-action:none;`;
    el.draggable = true;

    el.addEventListener("click", () => {
      const into = el.parentElement === tray ? work : tray;
      into.append(el);
      announce();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        el.parentElement === work
      ) {
        e.preventDefault();
        tray.append(el);
        announce();
      }
    });
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", el.dataset.tileId);
      el.classList.add("at-dragging");
      el.style.opacity = "0.5";
      // Drag ghost preview with drop shadow + opacity (skipped under reduced motion)
      if (e.dataTransfer.setDragImage && !prefersReducedMotion()) {
        const ghost = el.cloneNode(true);
        ghost.classList.add("at-drag-ghost");
        document.body.append(ghost);
        const r = el.getBoundingClientRect();
        e.dataTransfer.setDragImage(
          ghost,
          (e.clientX || r.left) - r.left,
          (e.clientY || r.top) - r.top,
        );
        // Remove on the next frame; the browser snapshots it synchronously.
        requestAnimationFrame(() => ghost.remove());
      }
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("at-dragging");
      el.style.opacity = "1";
    });

    // Touch support
    let clone = null;
    el.addEventListener(
      "touchstart",
      (e) => {
        clone = el.cloneNode(true);
        clone.style.cssText +=
          ";position:fixed;z-index:1000;pointer-events:none;opacity:0.85;";
        document.body.append(clone);
        moveClone(e);
      },
      { passive: true },
    );
    el.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        moveClone(e);
      },
      { passive: false },
    );
    el.addEventListener("touchend", (e) => {
      if (clone) {
        clone.remove();
        clone = null;
      }
      const z = zoneUnderTouch(e);
      if (z && z !== el.parentElement) {
        z.append(el);
        announce();
      }
    });
    function moveClone(e) {
      const t2 = e.touches?.[0] || e.changedTouches?.[0];
      if (!t2 || !clone) return;
      clone.style.left = `${t2.clientX - 24}px`;
      clone.style.top = `${t2.clientY - 22}px`;
    }
    return el;
  }

  function zoneUnderTouch(e) {
    const t = e.touches?.[0] || e.changedTouches?.[0];
    if (!t) return null;
    return (
      document
        .elementsFromPoint(t.clientX, t.clientY)
        .find((n) => n.dataset && n.dataset.zone) || null
    );
  }

  (tileSet || []).forEach((t) => {
    const n = t.count || 1;
    for (let i = 0; i < n; i++) tray.append(makeTile({ ...t }));
  });

  [tray, work].forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.style.borderColor = "var(--teal)";
    });
    zone.addEventListener(
      "dragleave",
      () => (zone.style.borderColor = zone === work ? "var(--line)" : ""),
    );
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.style.borderColor = zone === work ? "var(--line)" : "";
      const id = e.dataTransfer.getData("text/plain");
      const tile = wrapper.querySelector(`[data-tile-id="${CSS.escape(id)}"]`);
      if (tile) {
        zone.append(tile);
        announce();
      }
    });
  });

  function composition() {
    let xCount = 0,
      unitCount = 0;
    work.querySelectorAll(".algebra-tile").forEach((t) => {
      const v = Number(t.dataset.value);
      if (t.dataset.type === "x") xCount += v;
      else unitCount += v;
    });
    return { xCount, unitCount };
  }

  function evaluate() {
    const { xCount, unitCount } = composition();
    return xCount * xVal + unitCount;
  }

  function exprString() {
    const { xCount, unitCount } = composition();
    const parts = [];
    if (xCount)
      parts.push(`${xCount === 1 ? "" : xCount === -1 ? "-" : xCount}x`);
    if (unitCount) parts.push(`${unitCount > 0 ? "+" : ""}${unitCount}`);
    return parts.join(" ") || "0";
  }

  function announce() {
    live.textContent = `Workspace: ${exprString()}, equals ${evaluate()} when x = ${xVal}.`;
  }

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check";
  let done = false;
  checkBtn.addEventListener("click", () => {
    if (done) return;
    const { xCount, unitCount } = composition();
    let ok = true;
    if (targetExpr) {
      ok = xCount === targetExpr.xCount && unitCount === targetExpr.unitCount;
    }
    if (ok && target && typeof target.value === "number") {
      ok = evaluate() === target.value;
    }
    if (ok) {
      done = true;
      checkBtn.style.display = "none";
      showFb(
        feedbackSlot,
        "success",
        `Correct! ${exprString()} = ${evaluate()} when x = ${xVal}.`,
      );
      burstConfetti(work);
      onComplete?.(1, 1);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `Not yet. Your tiles make ${exprString()} = ${evaluate()} when x = ${xVal}. Adjust the tiles and try again.`,
      );
      onComplete?.(0, 1);
    }
  });
  wrapper.append(checkBtn);

  container.append(wrapper);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  // at-fb-enter drives a fade-in (and icon pulse for hints); reduced-motion
  // users get the same final state with no animation.
  fb.className = `feedback feedback-${type} visible at-fb-enter`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
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

// Success micro-burst: a short-lived ring of CSS-animated confetti dots
// centered on the workspace. Fully skipped under reduced-motion. Purely
// decorative (aria-hidden) and self-cleaning, so it never affects the DOM
// contract or feedback/checking logic.
function burstConfetti(anchor) {
  if (prefersReducedMotion() || !anchor || !anchor.getBoundingClientRect) {
    return;
  }
  const rect = anchor.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const layer = document.createElement("div");
  layer.className = "at-confetti-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.style.left = `${rect.left + rect.width / 2}px`;
  layer.style.top = `${rect.top + rect.height / 2}px`;

  const colors = [
    "var(--teal)",
    "var(--amber, var(--amber-light))",
    "var(--coral, var(--coral-light))",
    "var(--success)",
  ];
  const COUNT = 14;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement("span");
    dot.className = "at-confetti-dot";
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 48 + Math.random() * 40;
    dot.style.setProperty("--at-dx", `${Math.cos(angle) * dist}px`);
    dot.style.setProperty("--at-dy", `${Math.sin(angle) * dist}px`);
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = `${Math.random() * 60}ms`;
    layer.append(dot);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 900);
}

let stylesInjected = false;
function injectAlgebraTilesStyles() {
  if (stylesInjected) return;
  if (typeof document === "undefined") return;
  if (document.getElementById("at-engine-styles")) {
    stylesInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.id = "at-engine-styles";
  style.textContent = `
    .algebra-tile {
      transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
    }
    .algebra-tile:hover {
      box-shadow: 0 3px 8px rgba(15, 23, 42, 0.18);
    }
    /* Focus ring for keyboard users only (mouse clicks don't trigger it). */
    .algebra-tile:focus-visible {
      outline: 3px solid var(--teal);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.25);
    }
    .algebra-tile.at-dragging {
      transform: scale(0.96);
    }
    /* Drag ghost preview: drop shadow + opacity. */
    .at-drag-ghost {
      position: fixed;
      top: -9999px;
      left: -9999px;
      pointer-events: none;
      opacity: 0.85;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);
      transform: scale(1.04);
    }
    /* Workspace drop-zone visual depth. */
    .at-workzone {
      box-shadow: inset 0 2px 8px rgba(15, 23, 42, 0.08);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .at-fb-enter {
      animation: at-fb-fade-in 0.28s ease both;
    }
    .at-fb-enter .feedback-icon {
      display: inline-block;
      animation: at-icon-pop 0.4s ease both;
    }
    @keyframes at-fb-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes at-icon-pop {
      0%   { transform: scale(0.4); opacity: 0; }
      60%  { transform: scale(1.18); opacity: 1; }
      100% { transform: scale(1); }
    }
    .at-confetti-layer {
      position: fixed;
      z-index: 1200;
      pointer-events: none;
      width: 0;
      height: 0;
    }
    .at-confetti-dot {
      position: absolute;
      width: 9px;
      height: 9px;
      margin: -4.5px 0 0 -4.5px;
      border-radius: 2px;
      opacity: 0;
      animation: at-confetti-fly 0.8s cubic-bezier(0.16, 0.8, 0.3, 1) forwards;
    }
    @keyframes at-confetti-fly {
      0%   { transform: translate(0, 0) scale(0.6); opacity: 1; }
      70%  { opacity: 1; }
      100% {
        transform: translate(var(--at-dx, 0), var(--at-dy, 0)) scale(1);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .algebra-tile,
      .at-workzone,
      .at-fb-enter,
      .at-fb-enter .feedback-icon,
      .at-confetti-dot {
        transition: none !important;
        animation: none !important;
      }
      .algebra-tile.at-dragging {
        transform: none;
      }
      /* Keep depth/focus cues (non-animated), drop the confetti entirely. */
      .at-confetti-layer { display: none !important; }
    }
  `;
  (document.head || document.documentElement).append(style);
  stylesInjected = true;
}
