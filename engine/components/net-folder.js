// Net folder — fold a 2D net into a 3D solid preview using CSS 3D transforms.
// Unit 5 (Geometry / surface area). No external 3D dependency.
//
// Config:
//   instructions  string
//   solid         "cube" (default) | "rectangular-prism"
//   size          { w, h, d } edge lengths in arbitrary units (default 100 cube)
//   question      optional { stem, choices, correctIndex } — confirms which solid
//                 the net folds into; correctness reported from this.
//   onComplete(correct, total)
//
// Interaction: a "Fold" slider (0 unfolded -> 1 folded) animates the six faces
// from a flat cross net into a closed box. Keyboard accessible via range input.
// If a question is provided, answering it reports correctness; otherwise simply
// completing the fold reports success.

// Inject-once scoped style block for the additive fold polish. Every animation
// and transition below is gated by prefers-reduced-motion so the experience is
// fully static (no easing, glow, shadow drift, or particles) when a student has
// reduced motion enabled. Uses existing shared CSS vars (--teal, --navy, etc.).
function ensureNetFolderStyles() {
  if (document.getElementById("nf-polish-styles")) return;
  const style = document.createElement("style");
  style.id = "nf-polish-styles";
  style.textContent = `
    .nf-stage { position:relative; }
    .nf-shadow {
      position:absolute; left:50%; bottom:14px;
      width:62%; height:26px; transform:translateX(-50%);
      border-radius:50%;
      background:radial-gradient(ellipse at center,
        rgba(18,53,91,0.34) 0%, rgba(18,53,91,0.16) 55%, transparent 72%);
      filter:blur(2px); pointer-events:none; z-index:0;
      transition:transform 0.18s cubic-bezier(0.22,1,0.36,1),
                 opacity 0.18s cubic-bezier(0.22,1,0.36,1),
                 filter 0.18s ease;
    }
    .nf-scene-wrap { position:relative; z-index:1; }
    .nf-glow {
      position:absolute; inset:-18% ;
      border-radius:var(--radius-md);
      pointer-events:none; z-index:0; opacity:0;
      background:radial-gradient(circle at center,
        rgba(31,166,162,0.30) 0%, rgba(31,166,162,0.10) 45%, transparent 70%);
      transition:opacity 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    .nf-face { transition:transform 0.28s cubic-bezier(0.34,1.3,0.64,1); }
    .nf-slider-active { box-shadow:0 0 0 3px var(--teal-light, rgba(31,166,162,0.25)); }
    .nf-burst {
      position:absolute; top:50%; left:50%; width:8px; height:8px;
      margin:-4px 0 0 -4px; border-radius:50%; pointer-events:none; z-index:3;
      opacity:0; will-change:transform,opacity;
    }
    @keyframes nf-burst-fly {
      0%   { opacity:0; transform:translate(0,0) scale(0.4); }
      12%  { opacity:1; }
      100% { opacity:0;
             transform:translate(var(--nf-bx), var(--nf-by)) scale(1); }
    }
    @media (prefers-reduced-motion: no-preference) {
      .nf-burst { animation:nf-burst-fly 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
    }
    @media (prefers-reduced-motion: reduce) {
      .nf-shadow, .nf-glow, .nf-face,
      .nf-slider-active { transition:none !important; }
      .nf-burst { display:none !important; }
    }
  `;
  document.head.append(style);
}

export function renderNetFolder(
  container,
  { instructions, solid = "cube", size, question, onComplete },
) {
  ensureNetFolderStyles();
  const dims = {
    w: size?.w ?? 100,
    h: size?.h ?? 100,
    d: size?.d ?? 100,
  };
  if (solid === "cube") {
    dims.h = dims.w;
    dims.d = dims.w;
  }

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
  live.style.cssText =
    "position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);";
  wrapper.append(live);

  const stage = document.createElement("div");
  stage.className = "nf-stage";
  stage.style.cssText = `
    perspective:900px; height:340px; display:flex; align-items:center;
    justify-content:center; background:var(--cream); border-radius:var(--radius-md);
    margin-bottom:var(--sp-4); overflow:hidden;`;
  stage.setAttribute("role", "img");
  stage.setAttribute(
    "aria-label",
    `Net of a ${solid.replace("-", " ")} that folds into a 3D solid`,
  );

  // Parallax shadow on the floor of the stage (grows + rotates with the fold).
  const shadow = document.createElement("div");
  shadow.className = "nf-shadow";
  stage.append(shadow);

  // Wrapper that holds the glow highlight behind the 3D scene.
  const sceneWrap = document.createElement("div");
  sceneWrap.className = "nf-scene-wrap";
  sceneWrap.style.cssText = `
    position:relative; transform-style:preserve-3d;
    width:${dims.w}px; height:${dims.h}px;
    display:flex; align-items:center; justify-content:center;`;
  const glow = document.createElement("div");
  glow.className = "nf-glow";
  sceneWrap.append(glow);

  const scene = document.createElement("div");
  scene.style.cssText = `
    position:relative; transform-style:preserve-3d;
    transform:rotateX(-22deg) rotateY(28deg);
    width:${dims.w}px; height:${dims.h}px;`;
  sceneWrap.append(scene);
  stage.append(sceneWrap);

  const { w, h, d } = dims;
  const faceBg = (c) =>
    `background:${c}; border:2px solid var(--navy); box-sizing:border-box;`;

  // Six faces. Each has: flat (unfolded) transform and folded transform.
  // Unfolded layout is a cross net; folded is a closed box centered on origin.
  const faces = [
    {
      name: "front",
      wpx: w,
      hpx: h,
      color: "rgba(31,166,162,0.85)",
      flat: `translate(0px, 0px)`,
      fold: `translateZ(${d / 2}px)`,
    },
    {
      name: "back",
      wpx: w,
      hpx: h,
      color: "rgba(18,53,91,0.85)",
      flat: `translate(0px, ${2 * h}px)`,
      fold: `rotateY(180deg) translateZ(${d / 2}px)`,
    },
    {
      name: "top",
      wpx: w,
      hpx: d,
      color: "rgba(242,193,91,0.9)",
      flat: `translate(0px, ${-h}px)`,
      fold: `rotateX(90deg) translateZ(${h / 2}px)`,
    },
    {
      name: "bottom",
      wpx: w,
      hpx: d,
      color: "rgba(242,193,91,0.7)",
      flat: `translate(0px, ${h}px)`,
      fold: `rotateX(-90deg) translateZ(${h / 2}px)`,
    },
    {
      name: "left",
      wpx: d,
      hpx: h,
      color: "rgba(217,121,93,0.85)",
      flat: `translate(${-w}px, 0px)`,
      fold: `rotateY(-90deg) translateZ(${w / 2}px)`,
    },
    {
      name: "right",
      wpx: d,
      hpx: h,
      color: "rgba(217,121,93,0.65)",
      flat: `translate(${w}px, 0px)`,
      fold: `rotateY(90deg) translateZ(${w / 2}px)`,
    },
  ];

  const faceEls = faces.map((f) => {
    const el = document.createElement("div");
    el.className = "nf-face";
    el.style.cssText = `
      position:absolute; left:50%; top:50%; margin-left:${-f.wpx / 2}px; margin-top:${-f.hpx / 2}px;
      width:${f.wpx}px; height:${f.hpx}px; ${faceBg(f.color)}
      transition:transform 0.05s linear; backface-visibility:visible;`;
    scene.append(el);
    return el;
  });

  // Cubic-bezier ease (matches the CSS easing curve used on the polish layers)
  // so the scene spin, shadow, and glow advance with a smooth, weighted feel.
  const easeOutBack = (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  function applyFold(t) {
    // Interpolate by easing rotation/translation between flat and fold.
    // Simplest robust approach: blend via opacity of two transform states is
    // hard in CSS, so we lerp by toggling at t and animate the scene rotation.
    faces.forEach((f, i) => {
      faceEls[i].style.transform = t >= 0.5 ? f.fold : f.flat;
    });
    // Spin the whole scene a bit as it folds for a satisfying reveal, eased.
    const e = easeOutBack(Math.max(0, Math.min(1, t)));
    const spin = 28 + e * 32;
    scene.style.transform = `rotateX(-22deg) rotateY(${spin}deg)`;

    // Shadow parallax: grows and rotates as the net closes into a solid.
    const sScale = 0.78 + e * 0.5;
    const sRot = e * 18;
    shadow.style.transform = `translateX(-50%) scale(${sScale.toFixed(3)}, ${(0.85 + e * 0.4).toFixed(3)}) rotate(${sRot.toFixed(1)}deg)`;
    shadow.style.opacity = (0.55 + e * 0.4).toFixed(3);

    // Glow highlight ramps up, peaking as the fold completes.
    glow.style.opacity = (Math.pow(t, 2) * 0.95).toFixed(3);
  }
  applyFold(0);

  // Particle burst fired once when the fold first completes (t >= 0.99).
  // Tasteful classroom confetti in the shared palette; auto-cleans up and is
  // fully suppressed under prefers-reduced-motion (see scoped stylesheet).
  let burstFired = false;
  function fireBurst() {
    if (burstFired) return;
    burstFired = true;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const colors = [
      "var(--teal)",
      "var(--success, #2e7d4f)",
      "rgba(242,193,91,1)",
      "rgba(217,121,93,1)",
    ];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "nf-burst";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 46 + Math.random() * 40;
      p.style.background = colors[i % colors.length];
      p.style.setProperty(
        "--nf-bx",
        `${(Math.cos(angle) * dist).toFixed(1)}px`,
      );
      p.style.setProperty(
        "--nf-by",
        `${(Math.sin(angle) * dist).toFixed(1)}px`,
      );
      p.style.animationDelay = `${(Math.random() * 0.05).toFixed(3)}s`;
      sceneWrap.append(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  wrapper.append(stage);

  // Fold control
  const foldRow = document.createElement("div");
  foldRow.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-4);";
  const foldLbl = document.createElement("label");
  foldLbl.textContent = "Fold the net:";
  foldLbl.style.cssText = "font-weight:700; color:var(--navy);";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.value = "0";
  slider.setAttribute("aria-label", "Fold the net into a solid");
  slider.style.cssText = "flex:1; accent-color:var(--teal);";
  const id = `fold-${Math.random().toString(36).slice(2, 7)}`;
  foldLbl.htmlFor = id;
  slider.id = id;
  let folded = false;
  slider.addEventListener("input", () => {
    const t = Number(slider.value) / 100;
    applyFold(t);
    if (t >= 0.99 && !folded) {
      folded = true;
      live.textContent = `The net has folded into a ${solid.replace("-", " ")}.`;
      fireBurst();
      if (!question) finishOk();
    } else if (t < 0.99) {
      folded = false;
    }
  });
  // Mobile touch feedback: highlight the slider thumb while actively dragging
  // so students get a clear "I'm holding it" cue on touchscreens. Purely visual
  // and suppressed (no transition) under prefers-reduced-motion.
  const setActive = (on) => slider.classList.toggle("nf-slider-active", on);
  slider.addEventListener("pointerdown", () => setActive(true));
  slider.addEventListener("pointerup", () => setActive(false));
  slider.addEventListener("pointercancel", () => setActive(false));
  slider.addEventListener("blur", () => setActive(false));
  foldRow.append(foldLbl, slider);
  wrapper.append(foldRow);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  let done = false;
  function finishOk() {
    if (done) return;
    done = true;
    showFb(
      feedbackSlot,
      "success",
      `Nice fold! The net closes into a ${solid.replace("-", " ")}.`,
    );
    onComplete?.(1, 1);
  }

  if (question) {
    const q = document.createElement("p");
    q.style.cssText = "font-weight:600; margin:var(--sp-4) 0 var(--sp-2);";
    q.textContent = question.stem;
    wrapper.append(q);

    const opts = document.createElement("div");
    opts.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-2);";
    let selected = null;
    question.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mc-option";
      b.textContent = c;
      b.style.cssText =
        "text-align:left; padding:10px 14px; border:2px solid var(--line); border-radius:var(--radius-md); background:white; cursor:pointer; min-height:44px;";
      b.addEventListener("click", () => {
        if (done) return;
        selected = i;
        opts.querySelectorAll("button").forEach((o, oi) => {
          o.style.borderColor = oi === i ? "var(--teal)" : "var(--line)";
          o.style.background = oi === i ? "var(--teal-light)" : "white";
        });
      });
      opts.append(b);
    });
    wrapper.append(opts);

    const checkBtn = document.createElement("button");
    checkBtn.className = "btn btn-primary mt-4";
    checkBtn.textContent = "Check";
    checkBtn.addEventListener("click", () => {
      if (done || selected === null) return;
      const ok = selected === question.correctIndex;
      if (ok) {
        done = true;
        checkBtn.style.display = "none";
        showFb(feedbackSlot, "success", "Correct!");
        onComplete?.(1, 1);
      } else {
        showFb(
          feedbackSlot,
          "hint",
          "Not quite — fold the net all the way and look at the faces again.",
        );
        onComplete?.(0, 1);
      }
    });
    wrapper.append(checkBtn);
  }

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
