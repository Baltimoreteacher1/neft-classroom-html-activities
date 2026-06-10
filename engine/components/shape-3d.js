// shape-3d.js — Interactive 3D solid explorer built with pure CSS 3D transforms.
// No three.js, no dependencies. Spin by drag (pointer) or arrow keys, with a
// slow auto-rotate that pauses on interaction and honors prefers-reduced-motion.
// Tap a face / edge / vertex to highlight it and show its name + live counts.
// "Unfold net" animates the solid flattening into its 2D net and back.
//
// Public API:
//   renderShape3D(container, { shape, label }) -> { destroy }
//     shape: "cube" | "rectangular-prism" | "triangular-prism" | "square-pyramid"
//
// Geometry teaching: each solid exposes its element counts (faces/edges/vertices)
// so the panel can teach the vocabulary directly.

const PALETTE = {
  navy: "#12355b",
  teal: "#1fa6a2",
  tealLight: "#dff2ee",
  amber: "#f2c15b",
  coral: "#d9795d",
  cream: "#f7f4ec",
};

// Per-shape definition. Faces are described as positioned/rotated planes built
// from CSS transforms. We also store net-layout transforms so the same face
// elements can animate flat. s = base size in px.
function shapeDef(shape) {
  const s = 120;
  const h = s; // height
  switch (shape) {
    case "rectangular-prism":
      return rectPrism(150, 90, 100);
    case "triangular-prism":
      return triPrism(140, 120, 120);
    case "square-pyramid":
      return squarePyramid(140, 130);
    case "cube":
    default:
      return rectPrism(s, s, s, "Cube");
  }
}

function reduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Inject the polish stylesheet exactly once per document. All animated rules
// live behind @media (prefers-reduced-motion: no-preference) so reduced-motion
// users get the static, fully-functional experience untouched.
const POLISH_STYLE_ID = "shape3d-polish-styles";
function injectPolishStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(POLISH_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = POLISH_STYLE_ID;
  style.textContent = `
@media (prefers-reduced-motion: no-preference) {
  .shape3d-face.is-selected {
    animation: shape3d-face-pulse 1.6s ease-in-out infinite;
  }
  @keyframes shape3d-face-pulse {
    0%, 100% { box-shadow: inset 0 0 0 3px var(--navy), 0 0 0 3px rgba(31,166,162,0.5); }
    50% { box-shadow: inset 0 0 0 3px var(--navy), 0 0 0 7px rgba(31,166,162,0.18); }
  }
  .shape3d-burst {
    position:absolute; left:50%; top:50%; width:9px; height:9px;
    margin:-4.5px 0 0 -4.5px; border-radius:50%; pointer-events:none;
    opacity:0; will-change:transform, opacity;
    animation: shape3d-burst-fly 0.72s cubic-bezier(0.2,0.7,0.3,1) forwards;
  }
  @keyframes shape3d-burst-fly {
    0% { opacity:1; transform:translate(0,0) scale(0.4); }
    70% { opacity:1; }
    100% {
      opacity:0;
      transform:translate(var(--bx,0), var(--by,0)) scale(1);
    }
  }
}`;
  (document.head || document.documentElement).append(style);
}

// ── Rectangular prism / cube ─────────────────────────────────────────────
// w (x), h (y), d (z). Six rectangular faces.
function rectPrism(w, h, d, name) {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const colors = [
    PALETTE.teal,
    PALETTE.navy,
    PALETTE.amber,
    PALETTE.amber,
    PALETTE.coral,
    PALETTE.coral,
  ];
  // Solid transform (assembled box) and net transform (flat cross).
  const faces = [
    {
      // front
      w,
      h,
      solid: `translateZ(${hd}px)`,
      net: `translate(0px, 0px)`,
    },
    {
      // back
      w,
      h,
      solid: `rotateY(180deg) translateZ(${hd}px)`,
      net: `translate(0px, ${h * 2}px)`,
    },
    {
      // top
      w,
      h: d,
      solid: `rotateX(90deg) translateZ(${hh}px)`,
      net: `translate(0px, ${-(h / 2 + d / 2)}px)`,
    },
    {
      // bottom
      w,
      h: d,
      solid: `rotateX(-90deg) translateZ(${hh}px)`,
      net: `translate(0px, ${h / 2 + d / 2}px)`,
    },
    {
      // left
      w: d,
      h,
      solid: `rotateY(-90deg) translateZ(${hw}px)`,
      net: `translate(${-(w / 2 + d / 2)}px, 0px)`,
    },
    {
      // right
      w: d,
      h,
      solid: `rotateY(90deg) translateZ(${hw}px)`,
      net: `translate(${w / 2 + d / 2}px, 0px)`,
    },
  ].map((f, i) => ({ ...f, color: colors[i], kind: "face" }));

  return {
    name: name || "Rectangular prism",
    counts: { faces: 6, edges: 12, vertices: 8 },
    faces,
    fitW: w + 2 * d,
    fitH: 2 * h + 2 * d,
  };
}

// ── Triangular prism ─────────────────────────────────────────────────────
// 2 triangular faces + 3 rectangular faces. Built as a length-l prism whose
// cross-section is an isosceles triangle (base b, height th).
function triPrism(b, th, l) {
  const hb = b / 2;
  const hl = l / 2;
  // Triangle clip path (pointing up): top-center, bottom-left, bottom-right.
  const triClip = "polygon(50% 0, 100% 100%, 0 100%)";
  const slant = Math.sqrt(hb * hb + th * th);
  // angle each slant rectangle tilts from vertical
  const ang = (Math.atan2(hb, th) * 180) / Math.PI;

  const faces = [
    {
      // front triangle
      w: b,
      h: th,
      color: PALETTE.teal,
      kind: "face",
      clip: triClip,
      solid: `translateZ(${hl}px)`,
      net: `translate(0px, ${-(th + l) / 1}px)`,
    },
    {
      // back triangle
      w: b,
      h: th,
      color: PALETTE.navy,
      kind: "face",
      clip: triClip,
      solid: `translateZ(${-hl}px) rotateY(180deg)`,
      net: `translate(0px, ${th + l}px)`,
    },
    {
      // bottom rectangle
      w: b,
      h: l,
      color: PALETTE.amber,
      kind: "face",
      solid: `rotateX(90deg) translateY(0px) translateZ(${-th / 2}px)`,
      net: `translate(0px, 0px)`,
    },
    {
      // left slant rectangle
      w: slant,
      h: l,
      color: PALETTE.coral,
      kind: "face",
      solid: `translateX(${-b / 4}px) rotateX(90deg) rotateY(${-(90 - ang)}deg) translateZ(0px)`,
      net: `translate(${-(b / 2)}px, 0px) rotate(0deg)`,
    },
    {
      // right slant rectangle
      w: slant,
      h: l,
      color: PALETTE.coral,
      kind: "face",
      solid: `translateX(${b / 4}px) rotateX(90deg) rotateY(${90 - ang}deg) translateZ(0px)`,
      net: `translate(${b / 2}px, 0px) rotate(0deg)`,
    },
  ];

  return {
    name: "Triangular prism",
    counts: { faces: 5, edges: 9, vertices: 6 },
    faces,
    fitW: b + 2 * slant,
    fitH: 2 * (th + l),
  };
}

// ── Square pyramid ───────────────────────────────────────────────────────
// 1 square base + 4 triangular lateral faces meeting at an apex.
function squarePyramid(b, ph) {
  const hb = b / 2;
  const triClip = "polygon(50% 0, 100% 100%, 0 100%)";
  const slantH = Math.sqrt(ph * ph + hb * hb); // apothem slant height
  const tilt = (Math.atan2(hb, ph) * 180) / Math.PI; // lean of each face

  const lateral = (rotY, color) => ({
    w: b,
    h: slantH,
    color,
    kind: "face",
    clip: triClip,
    solid: `rotateY(${rotY}deg) translateZ(${hb}px) rotateX(${-(90 - tilt)}deg) translateY(${-slantH / 2}px)`,
  });

  const faces = [
    {
      // base
      w: b,
      h: b,
      color: PALETTE.navy,
      kind: "face",
      solid: `rotateX(90deg) translateZ(${-hb}px)`,
      net: `translate(0px, 0px)`,
    },
    {
      ...lateral(0, PALETTE.teal),
      net: `translate(0px, ${-(b / 2 + slantH / 2)}px)`,
    },
    {
      ...lateral(90, PALETTE.amber),
      net: `translate(${b / 2 + slantH / 2}px, 0px) rotate(90deg)`,
    },
    {
      ...lateral(180, PALETTE.coral),
      net: `translate(0px, ${b / 2 + slantH / 2}px) rotate(180deg)`,
    },
    {
      ...lateral(270, PALETTE.teal),
      net: `translate(${-(b / 2 + slantH / 2)}px, 0px) rotate(270deg)`,
    },
  ];

  return {
    name: "Square pyramid",
    counts: { faces: 5, edges: 8, vertices: 5 },
    faces,
    fitW: b + 2 * slantH,
    fitH: b + 2 * slantH,
  };
}

export function renderShape3D(
  container,
  { shape = "cube", label, taskDriven = false } = {},
) {
  const def = shapeDef(shape);
  const prefersReduced = reduceMotion();
  if (!prefersReduced) injectPolishStyles();

  const root = document.createElement("div");
  root.className = "shape3d";

  // ── Live region for screen readers ──
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.className = "sr-only-shape3d";
  live.style.cssText =
    "position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap;";
  root.append(live);

  // ── Stage ──
  const stage = document.createElement("div");
  stage.tabIndex = 0;
  stage.setAttribute("role", "application");
  stage.setAttribute(
    "aria-label",
    `${def.name} 3D model. Drag or use arrow keys to rotate. Press Tab then Enter on a face to select it. ${def.counts.faces} faces, ${def.counts.edges} edges, ${def.counts.vertices} vertices.`,
  );
  stage.style.cssText = `
    position:relative; height:300px; perspective:1100px;
    display:flex; align-items:center; justify-content:center;
    background:radial-gradient(ellipse at 50% 30%, #ffffff 0%, var(--cream) 100%);
    border:1px solid var(--line); border-radius:var(--radius-md);
    overflow:hidden; cursor:grab; touch-action:none; outline-offset:3px;`;

  const scene = document.createElement("div");
  scene.style.cssText =
    "position:relative; transform-style:preserve-3d; will-change:transform; width:0; height:0;";
  stage.append(scene);

  // Soft ground shadow for tactility.
  const shadow = document.createElement("div");
  shadow.setAttribute("aria-hidden", "true");
  shadow.style.cssText = `
    position:absolute; bottom:34px; left:50%; width:170px; height:34px;
    transform:translateX(-50%); border-radius:50%;
    background:radial-gradient(ellipse, rgba(18,53,91,0.22), transparent 70%);
    filter:blur(2px); pointer-events:none;`;
  stage.append(shadow);

  // ── Celebration particle burst ──
  // Fired on a correct task answer. Pure decoration: short-lived, aria-hidden,
  // self-cleaning, and a no-op when reduced motion is requested.
  const BURST_COLORS = [
    PALETTE.teal,
    PALETTE.amber,
    PALETTE.coral,
    PALETTE.navy,
  ];
  function celebrateBurst() {
    if (prefersReduced) return;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "shape3d-burst";
      p.setAttribute("aria-hidden", "true");
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 50;
      p.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--by", `${Math.sin(angle) * dist - 18}px`);
      p.style.background = BURST_COLORS[i % BURST_COLORS.length];
      p.style.animationDelay = `${Math.random() * 60}ms`;
      p.addEventListener("animationend", () => p.remove(), { once: true });
      stage.append(p);
    }
  }

  // ── Build faces ──
  let netT = 0; // 0 = solid, 1 = net (flat)
  const faceEls = def.faces.map((f, i) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "shape3d-face";
    el.dataset.index = String(i);
    el.setAttribute(
      "aria-label",
      `Face ${i + 1} of ${def.name}. Select to label it.`,
    );
    el.style.cssText = `
      position:absolute; left:50%; top:50%;
      width:${f.w}px; height:${f.h}px;
      margin-left:${-f.w / 2}px; margin-top:${-f.h / 2}px;
      background:${hexToRgba(f.color, 0.82)};
      border:2px solid rgba(255,255,255,0.65); box-sizing:border-box;
      padding:0; cursor:pointer; backface-visibility:visible;
      box-shadow:inset 0 0 0 1px rgba(18,53,91,0.18);
      transition:${prefersReduced ? "none" : "transform 0.6s var(--ease-out), background 0.18s ease, box-shadow 0.18s ease"};
      transform:${f.solid};`;
    if (f.clip) el.style.clipPath = f.clip;
    scene.append(el);
    return el;
  });

  // Stagger the net unfold/fold so faces peel open in sequence (additive
  // polish; reduced-motion users get an instant, simultaneous switch).
  const STAGGER_MS = 70;
  function applyFaceTransforms() {
    const unfolding = netT >= 0.5;
    def.faces.forEach((f, i) => {
      const el = faceEls[i];
      if (!prefersReduced) {
        // Reverse the order when folding back up for a natural close.
        const order = unfolding ? i : def.faces.length - 1 - i;
        el.style.transitionDelay = `${order * STAGGER_MS}ms`;
      }
      const t = unfolding && f.net ? f.net : f.solid;
      el.style.transform = t;
    });
  }
  applyFaceTransforms();

  // ── Rotation state ──
  let rotX = -22;
  let rotY = 28;
  // Parallax shadow: shift/soften the ground shadow with the model's tilt so it
  // reads as a real cast shadow. Purely decorative; skipped for reduced motion.
  function applyShadowParallax() {
    if (prefersReduced) return;
    const dx = Math.sin((rotY * Math.PI) / 180) * 26;
    const lean = Math.cos((rotX * Math.PI) / 180); // 1 when upright
    const scaleX = 0.78 + lean * 0.34;
    const blur = 2 + (1 - lean) * 5;
    const op = 0.14 + lean * 0.14;
    shadow.style.transform = `translateX(calc(-50% + ${dx}px)) scaleX(${scaleX})`;
    shadow.style.filter = `blur(${blur}px)`;
    shadow.style.opacity = String(op);
  }
  function applyScene() {
    scene.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    applyShadowParallax();
  }
  applyScene();

  // ── Auto-rotate ──
  let rafId = null;
  let autoOn = !prefersReduced;
  let lastTs = 0;
  function tick(ts) {
    if (!autoOn) {
      rafId = null;
      return;
    }
    if (lastTs) {
      const dt = ts - lastTs;
      rotY += dt * 0.012; // slow drift
      if (netT < 0.5) applyScene();
    }
    lastTs = ts;
    rafId = requestAnimationFrame(tick);
  }
  function startAuto() {
    if (prefersReduced || rafId) return;
    stopInertia();
    autoOn = true;
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }
  function stopAuto() {
    autoOn = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  startAuto();

  // ── Pointer drag ──
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  // Momentum: track the most recent pointer velocity so a flick keeps spinning
  // and eases to rest after release. Disabled under reduced motion.
  let velX = 0;
  let velY = 0;
  let inertiaId = null;
  function stopInertia() {
    if (inertiaId) cancelAnimationFrame(inertiaId);
    inertiaId = null;
  }
  function runInertia() {
    if (prefersReduced) return;
    stopInertia();
    const step = () => {
      // If anything else takes over (drag, net, auto-spin), bail out cleanly.
      if (dragging || netT >= 0.5) {
        inertiaId = null;
        return;
      }
      rotY += velY;
      rotX -= velX;
      rotX = Math.max(-89, Math.min(89, rotX));
      applyScene();
      velX *= 0.92;
      velY *= 0.92;
      if (Math.abs(velX) < 0.05 && Math.abs(velY) < 0.05) {
        inertiaId = null;
        return;
      }
      inertiaId = requestAnimationFrame(step);
    };
    inertiaId = requestAnimationFrame(step);
  }
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("shape3d-face")) return; // let clicks select
    dragging = true;
    stopAuto();
    stopInertia();
    velX = 0;
    velY = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    stage.setPointerCapture(e.pointerId);
    stage.style.cursor = "grabbing";
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dX = (e.clientX - lastX) * 0.5;
    const dY = (e.clientY - lastY) * 0.5;
    rotY += dX;
    rotX -= dY;
    rotX = Math.max(-89, Math.min(89, rotX));
    // Smoothed velocity for a natural flick release.
    velY = velY * 0.6 + dX * 0.4;
    velX = velX * 0.6 + dY * 0.4;
    lastX = e.clientX;
    lastY = e.clientY;
    if (netT < 0.5) applyScene();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    stage.style.cursor = "grab";
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (
      !prefersReduced &&
      netT < 0.5 &&
      (Math.abs(velX) > 0.3 || Math.abs(velY) > 0.3)
    ) {
      runInertia();
    }
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // ── Keyboard rotate ──
  stage.addEventListener("keydown", (e) => {
    const step = 9;
    let handled = true;
    switch (e.key) {
      case "ArrowLeft":
        rotY -= step;
        break;
      case "ArrowRight":
        rotY += step;
        break;
      case "ArrowUp":
        rotX = Math.max(-89, rotX - step);
        break;
      case "ArrowDown":
        rotX = Math.min(89, rotX + step);
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      stopAuto();
      stopInertia();
      if (netT < 0.5) applyScene();
    }
  });

  root.append(stage);

  // ── Geometry counts readout ──
  const counts = document.createElement("div");
  counts.style.cssText = `
    display:flex; flex-wrap:wrap; gap:var(--sp-2); justify-content:center;
    margin-top:var(--sp-3);`;
  const chip = (kind, n) => {
    const c = document.createElement("span");
    c.dataset.kind = kind;
    c.style.cssText = `
      display:inline-flex; align-items:center; gap:6px; padding:6px 12px;
      border-radius:var(--radius-full); font-weight:700; font-size:0.85rem;
      background:var(--teal-light); color:var(--navy); border:2px solid transparent;
      transition:border-color 0.15s ease, background 0.15s ease;`;
    c.innerHTML = `<strong>${n}</strong> ${kind}${n === 1 ? "" : kind === "vertex" ? "es" : "s"}`;
    return c;
  };
  const chipFace = chip("face", def.counts.faces);
  const chipEdge = chip("edge", def.counts.edges);
  const chipVertex = chip("vertex", def.counts.vertices);
  counts.append(chipFace, chipEdge, chipVertex);
  root.append(counts);

  // ── Selection / labeling ──
  const labelBar = document.createElement("div");
  labelBar.setAttribute("role", "status");
  labelBar.style.cssText = `
    margin-top:var(--sp-3); text-align:center; min-height:1.5em;
    font-weight:600; color:var(--muted); font-size:0.95rem;`;
  labelBar.textContent =
    "Tap a face to label it. The whole solid is made of faces, edges, and vertices.";
  root.append(labelBar);

  let selectedEl = null;
  function clearSelection() {
    if (selectedEl) {
      const idx = Number(selectedEl.dataset.index);
      selectedEl.style.background = hexToRgba(def.faces[idx].color, 0.82);
      selectedEl.style.boxShadow = "inset 0 0 0 1px rgba(18,53,91,0.18)";
      selectedEl.classList.remove("is-selected");
    }
    selectedEl = null;
    [chipFace, chipEdge, chipVertex].forEach((c) => {
      c.style.borderColor = "transparent";
    });
  }
  function selectFace(el) {
    if (selectedEl === el) {
      clearSelection();
      labelBar.textContent = "Selection cleared.";
      return;
    }
    clearSelection();
    selectedEl = el;
    el.style.background = hexToRgba(PALETTE.amber, 0.95);
    el.style.boxShadow =
      "inset 0 0 0 3px var(--navy), 0 0 0 3px rgba(31,166,162,0.5)";
    el.classList.add("is-selected"); // CSS pulse (reduced-motion: no-op)
    chipFace.style.borderColor = "var(--navy)";
    const msg = `Selected a face. A face is a flat surface of the solid. This ${def.name.toLowerCase()} has ${def.counts.faces} faces, ${def.counts.edges} edges, and ${def.counts.vertices} vertices.`;
    labelBar.textContent =
      "🟨 face — a flat surface where you could place a sticker.";
    live.textContent = msg;
  }
  // Distinct faces the student has tapped (for the "count the faces" task).
  const tappedFaces = new Set();
  let onFaceTap = null; // task hook
  faceEls.forEach((el) => {
    const handle = () => {
      stopAuto();
      selectFace(el);
      tappedFaces.add(el.dataset.index);
      if (onFaceTap) onFaceTap(tappedFaces.size);
    };
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      handle();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle();
      }
    });
  });
  stage.addEventListener("click", (e) => {
    if (e.target === stage || e.target === scene) clearSelection();
  });

  // ── Controls ──
  const controls = document.createElement("div");
  controls.style.cssText = `
    display:flex; flex-wrap:wrap; gap:var(--sp-2); justify-content:center;
    margin-top:var(--sp-4);`;

  // Unfold net toggle (only for shapes that define a net for every face).
  const hasNet = def.faces.every((f) => f.net);
  if (hasNet) {
    const netBtn = document.createElement("button");
    netBtn.type = "button";
    netBtn.className = "btn btn-secondary";
    netBtn.setAttribute("aria-pressed", "false");
    netBtn.textContent = "Unfold net ▸";
    netBtn.addEventListener("click", () => {
      const unfolding = netT < 0.5;
      netT = unfolding ? 1 : 0;
      netBtn.setAttribute("aria-pressed", String(unfolding));
      netBtn.textContent = unfolding ? "◂ Fold up" : "Unfold net ▸";
      if (unfolding) {
        stopAuto();
        clearSelection();
        // Face the net toward the viewer.
        rotX = 0;
        rotY = 0;
        applyScene();
        labelBar.textContent =
          "This flat pattern is the net. Its total area is the solid's surface area.";
        live.textContent = `${def.name} unfolded into its net. The net shows every face flattened out; adding their areas gives the surface area.`;
      } else {
        labelBar.textContent = "Folded back into a solid.";
        live.textContent = `${def.name} folded back into a solid.`;
      }
      applyFaceTransforms();
    });
    controls.append(netBtn);
  }

  // Reset view + resume spin.
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "btn btn-secondary";
  resetBtn.textContent = "↺ Reset view";
  resetBtn.addEventListener("click", () => {
    rotX = -22;
    rotY = 28;
    netT = 0;
    applyFaceTransforms();
    applyScene();
    clearSelection();
    labelBar.textContent = "View reset.";
    startAuto();
  });
  controls.append(resetBtn);

  if (!prefersReduced) {
    const spinBtn = document.createElement("button");
    spinBtn.type = "button";
    spinBtn.className = "btn btn-secondary";
    spinBtn.setAttribute("aria-pressed", "true");
    spinBtn.textContent = "⏸ Pause spin";
    spinBtn.addEventListener("click", () => {
      if (autoOn) {
        stopAuto();
        spinBtn.textContent = "▶ Auto-spin";
        spinBtn.setAttribute("aria-pressed", "false");
      } else {
        startAuto();
        spinBtn.textContent = "⏸ Pause spin";
        spinBtn.setAttribute("aria-pressed", "true");
      }
    });
    controls.append(spinBtn);
  }

  root.append(controls);

  // ── Task-driven challenge layer ──
  // When taskDriven is true, the explorer becomes a guided sequence of small
  // tasks with checking + feedback, instead of a free spin. Free rotate,
  // keyboard, and reduced-motion handling above all still apply.
  if (taskDriven) {
    root.append(
      buildTaskPanel({
        def,
        shape,
        getTappedCount: () => tappedFaces.size,
        setOnFaceTap: (fn) => {
          onFaceTap = fn;
        },
        focusStage: () => stage.focus({ preventScroll: true }),
        unfoldNet: () => {
          if (hasNet && netT < 0.5) {
            netT = 1;
            stopAuto();
            stopInertia();
            clearSelection();
            rotX = 0;
            rotY = 0;
            applyScene();
            applyFaceTransforms();
          }
        },
        celebrate: () => celebrateBurst(),
        hasNet,
      }),
    );
  }

  container.append(root);

  return {
    destroy() {
      stopAuto();
      stopInertia();
    },
  };
}

// ── Task panel ──────────────────────────────────────────────────────────────
// A sequence of bite-size, checkable prompts that turn the 3D model into an
// active investigation. Each task gives instant feedback. Keyboard-operable;
// uses aria-live for status. No raw HTML interpolation of dynamic data.
function buildTaskPanel({
  def,
  shape,
  getTappedCount,
  setOnFaceTap,
  unfoldNet,
  celebrate = () => {},
  hasNet,
}) {
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    margin-top:var(--sp-4); display:flex; flex-direction:column; gap:var(--sp-3);`;

  const intro = document.createElement("div");
  intro.style.cssText = `
    font-family:var(--font-display); font-weight:800; font-size:1rem; color:var(--navy);`;
  intro.textContent = "Your turn — explore the shape:";
  wrap.append(intro);

  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.style.cssText =
    "position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);";
  wrap.append(live);

  // Task 1: tap every face and count them.
  const t1 = taskBox(
    "1",
    "Tap each face of the shape. How many faces are there?",
  );
  const t1status = statusLine();
  const t1progress = document.createElement("p");
  t1progress.style.cssText = "margin:0; font-size:0.85rem; color:var(--muted);";
  t1progress.textContent = `Faces tapped: 0 / ${def.counts.faces}`;
  const t1answer = numberAnswer(def.counts.faces, (ok) => {
    if (ok) {
      setStatus(
        t1status,
        true,
        `Yes! A ${def.name.toLowerCase()} has ${def.counts.faces} faces.`,
      );
      live.textContent = `Correct: ${def.counts.faces} faces.`;
      celebrate();
    } else {
      setStatus(
        t1status,
        false,
        "Not yet — tap the faces and count carefully. Spin to find any you missed.",
      );
    }
  });
  setOnFaceTap((n) => {
    t1progress.textContent = `Faces tapped: ${n} / ${def.counts.faces}`;
  });
  t1.append(t1progress, t1answer.el, t1status);
  wrap.append(t1);

  // Task 2: how many edges?
  const t2 = taskBox(
    "2",
    "An edge is where two faces meet. How many edges does it have?",
  );
  const t2status = statusLine();
  const t2answer = numberAnswer(def.counts.edges, (ok) => {
    if (ok) {
      setStatus(t2status, true, `Right! ${def.counts.edges} edges.`);
      live.textContent = `Correct: ${def.counts.edges} edges.`;
      celebrate();
    } else {
      setStatus(
        t2status,
        false,
        "Close — count the lines where two faces meet, all the way around.",
      );
    }
  });
  t2.append(t2answer.el, t2status);
  wrap.append(t2);

  // Task 3: how many vertices?
  const t3 = taskBox("3", "A vertex is a corner point. How many vertices?");
  const t3status = statusLine();
  const t3answer = numberAnswer(def.counts.vertices, (ok) => {
    if (ok) {
      setStatus(t3status, true, `Exactly! ${def.counts.vertices} vertices.`);
      live.textContent = `Correct: ${def.counts.vertices} vertices.`;
      celebrate();
    } else {
      setStatus(t3status, false, "Not quite — count the corner points.");
    }
  });
  t3.append(t3answer.el, t3status);
  wrap.append(t3);

  // Task 4: unfold the net — which net matches?
  if (hasNet) {
    const t4 = taskBox(
      "4",
      "Unfold the net, then pick the solid this net folds into.",
    );
    const t4status = statusLine();
    const unfoldTaskBtn = document.createElement("button");
    unfoldTaskBtn.type = "button";
    unfoldTaskBtn.className = "btn btn-secondary";
    unfoldTaskBtn.style.cssText = "min-height:44px; align-self:flex-start;";
    unfoldTaskBtn.textContent = "Unfold the net ▸";
    unfoldTaskBtn.addEventListener("click", () => {
      unfoldNet();
      unfoldTaskBtn.disabled = true;
      choiceGroup.hidden = false;
    });
    const choiceGroup = document.createElement("div");
    choiceGroup.hidden = true;
    choiceGroup.setAttribute("role", "group");
    choiceGroup.setAttribute(
      "aria-label",
      "Which solid does this net fold into?",
    );
    choiceGroup.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-2); margin-top:var(--sp-2);";
    let answered = false;
    netChoices(def.name).forEach((name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-secondary";
      b.style.cssText = "text-align:left; min-height:44px; white-space:normal;";
      b.textContent = name;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        choiceGroup
          .querySelectorAll("button")
          .forEach((x) => (x.disabled = true));
        const ok = name === def.name;
        b.style.borderColor = ok ? "var(--teal)" : "var(--coral, #d9795d)";
        if (ok) {
          setStatus(
            t4status,
            true,
            `Yes — this net folds into a ${def.name.toLowerCase()}.`,
          );
          celebrate();
        } else {
          setStatus(
            t4status,
            false,
            `Not this one. Count the net's faces — a ${def.name.toLowerCase()} has ${def.counts.faces}.`,
          );
        }
      });
      choiceGroup.append(b);
    });
    t4.append(unfoldTaskBtn, choiceGroup, t4status);
    wrap.append(t4);
  }

  return wrap;
}

function taskBox(badge, prompt) {
  const box = document.createElement("section");
  box.style.cssText = `
    padding:var(--sp-3); border:1px solid var(--line); border-radius:var(--radius-md);
    background:#fff; display:flex; flex-direction:column; gap:var(--sp-2);`;
  const p = document.createElement("p");
  p.style.cssText =
    "margin:0; font-size:0.92rem; font-weight:600; color:var(--ink);";
  p.textContent = `${badge}. ${prompt}`;
  box.append(p);
  return box;
}

function statusLine() {
  const p = document.createElement("p");
  p.setAttribute("role", "status");
  p.style.cssText =
    "margin:0; min-height:1.3em; font-size:0.88rem; font-weight:600; line-height:1.4;";
  return p;
}

function setStatus(el, ok, msg) {
  el.style.color = ok ? "var(--teal)" : "var(--coral, #d9795d)";
  el.textContent = (ok ? "✅ " : "🤔 ") + msg;
}

// Small numeric stepper + check button. Returns { el }.
function numberAnswer(correct, onCheck) {
  const el = document.createElement("div");
  el.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-2); flex-wrap:wrap;";
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", "Type your count");
  input.style.cssText = `
    width:72px; min-height:44px; padding:6px 10px; font-size:1rem;
    border:2px solid var(--line); border-radius:var(--radius-sm); text-align:center;`;
  const check = document.createElement("button");
  check.type = "button";
  check.className = "btn btn-teal";
  check.style.cssText = "min-height:44px;";
  check.textContent = "Check";
  const run = () => {
    const val = Number(input.value);
    onCheck(Number.isFinite(val) && val === correct);
  };
  check.addEventListener("click", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });
  el.append(input, check);
  return { el };
}

// Distractor solid names for the net-match question (correct included).
function netChoices(correctName) {
  const all = [
    "Cube",
    "Rectangular prism",
    "Triangular prism",
    "Square pyramid",
  ];
  const others = all.filter((n) => n !== correctName).slice(0, 2);
  const list = [correctName, ...others];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function hexToRgba(hex, a) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default renderShape3D;
