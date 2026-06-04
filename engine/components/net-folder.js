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

export function renderNetFolder(
  container,
  { instructions, solid = "cube", size, question, onComplete },
) {
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
  stage.style.cssText = `
    perspective:900px; height:340px; display:flex; align-items:center;
    justify-content:center; background:var(--cream); border-radius:var(--radius-md);
    margin-bottom:var(--sp-4); overflow:hidden;`;
  stage.setAttribute("role", "img");
  stage.setAttribute(
    "aria-label",
    `Net of a ${solid.replace("-", " ")} that folds into a 3D solid`,
  );

  const scene = document.createElement("div");
  scene.style.cssText = `
    position:relative; transform-style:preserve-3d;
    transform:rotateX(-22deg) rotateY(28deg);
    width:${dims.w}px; height:${dims.h}px;`;
  stage.append(scene);

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
    el.style.cssText = `
      position:absolute; left:50%; top:50%; margin-left:${-f.wpx / 2}px; margin-top:${-f.hpx / 2}px;
      width:${f.wpx}px; height:${f.hpx}px; ${faceBg(f.color)}
      transition:transform 0.05s linear; backface-visibility:visible;`;
    scene.append(el);
    return el;
  });

  function applyFold(t) {
    // Interpolate by easing rotation/translation between flat and fold.
    // Simplest robust approach: blend via opacity of two transform states is
    // hard in CSS, so we lerp by toggling at t and animate the scene rotation.
    faces.forEach((f, i) => {
      faceEls[i].style.transform = t >= 0.5 ? f.fold : f.flat;
    });
    // Spin the whole scene a bit as it folds for a satisfying reveal.
    const spin = 28 + t * 32;
    scene.style.transform = `rotateX(-22deg) rotateY(${spin}deg)`;
  }
  applyFold(0);

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
      if (!question) finishOk();
    } else if (t < 0.99) {
      folded = false;
    }
  });
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
