// Fraction bars — partition a bar into equal parts and shade to match a target
// fraction, optionally comparing two bars. Unit 2 (Fractions).
//
// Config:
//   instructions  string
//   target        { numerator, denominator }  fraction to model on bar A
//   compare       optional { numerator, denominator, op:"<"|">"|"=" }
//                 second bar + relationship student must satisfy/confirm
//   maxParts      optional max denominator (default 12)
//   onComplete(correct, total)
//
// Interaction: +/- buttons set the number of equal parts; click/tap a segment
// to shade it. Keyboard: Tab to a segment, Enter/Space toggles shade.

export function renderFractionBars(
  container,
  { instructions, target, compare, maxParts = 12, onComplete },
) {
  injectFractionBarsStyles();

  // `target` is required; without it `target.numerator` throws and blanks the
  // activity. Fail gracefully on malformed authoring.
  if (!target || target.denominator == null || target.numerator == null) {
    const warn = document.createElement("p");
    warn.style.cssText = "font-weight:600;";
    warn.textContent = instructions || "This fraction task is unavailable.";
    container.append(warn);
    return;
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

  function buildBar(spec, name, fixedDenominator) {
    const block = document.createElement("div");
    block.style.cssText = "margin-bottom:var(--sp-4);";

    const head = document.createElement("div");
    head.style.cssText =
      "display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-2);";

    const title = document.createElement("span");
    title.style.cssText = "font-weight:800; color:var(--navy);";
    title.textContent = name;
    head.append(title);

    const readout = document.createElement("span");
    readout.className = "fb-readout";
    readout.style.cssText = "font-weight:700; color:var(--teal);";
    const readoutNum = document.createElement("span");
    readoutNum.className = "fb-readout-num";
    const readoutSep = document.createElement("span");
    readout.append(readoutNum, readoutSep);
    head.append(readout);

    let parts = fixedDenominator || 2;
    let shaded = new Set();

    if (!fixedDenominator) {
      const controls = document.createElement("span");
      controls.style.cssText =
        "margin-left:auto; display:flex; gap:var(--sp-2);";
      const minus = ctrlBtn("−", "Fewer parts");
      const plus = ctrlBtn("+", "More parts");
      minus.addEventListener("click", () => {
        if (parts > 1) {
          parts--;
          shaded.clear();
          render();
        }
      });
      plus.addEventListener("click", () => {
        if (parts < maxParts) {
          parts++;
          shaded.clear();
          render();
        }
      });
      controls.append(minus, plus);
      head.append(controls);
    }

    block.append(head);

    const bar = document.createElement("div");
    bar.className = "fb-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", `${name} fraction bar`);
    bar.style.cssText =
      "display:flex; width:100%; height:56px; border:2px solid var(--navy); border-radius:var(--radius-sm); overflow:hidden;";
    block.append(bar);

    function render() {
      bar.innerHTML = "";
      const anyShaded = shaded.size > 0;
      bar.classList.toggle("fb-active", anyShaded);
      for (let i = 0; i < parts; i++) {
        const isShaded = shaded.has(i);
        const seg = document.createElement("button");
        seg.type = "button";
        seg.className = `fb-seg${isShaded ? " fb-shaded" : ""}`;
        seg.dataset.i = String(i);
        seg.setAttribute("aria-pressed", isShaded ? "true" : "false");
        seg.setAttribute("aria-label", `Part ${i + 1} of ${parts}`);
        seg.style.cssText = `
          flex:1; border:none; border-right:${i < parts - 1 ? "1px solid var(--navy)" : "none"};
          background-color:${isShaded ? "var(--teal)" : "white"}; cursor:pointer;`;
        seg.addEventListener("click", () => {
          if (shaded.has(i)) shaded.delete(i);
          else shaded.add(i);
          render();
          updateReadout();
        });
        seg.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            seg.click();
          }
        });
        bar.append(seg);
      }
      updateReadout();
    }

    let lastReadout = null;
    function updateReadout() {
      const key = `${shaded.size}/${parts}`;
      readoutNum.textContent = String(shaded.size);
      readoutSep.textContent = `/${parts}`;
      // Re-trigger the numerator slide-in only when the value actually changes,
      // so the readout animates on interaction but not on no-op renders.
      if (key !== lastReadout) {
        readoutNum.classList.remove("fb-num-in");
        // Force reflow so removing + re-adding the class restarts the animation.
        void readoutNum.offsetWidth;
        readoutNum.classList.add("fb-num-in");
        lastReadout = key;
      }
      live.textContent = `${name}: ${shaded.size} of ${parts} parts shaded.`;
    }

    render();

    return {
      block,
      get numerator() {
        return shaded.size;
      },
      get denominator() {
        return parts;
      },
      get value() {
        return shaded.size / parts;
      },
    };
  }

  const barA = buildBar(target, "Bar A");
  wrapper.append(barA.block);

  let barB = null;
  if (compare) {
    barB = buildBar(compare, "Bar B");
    wrapper.append(barB.block);

    const rel = document.createElement("div");
    rel.className = "badge badge-amber mb-4";
    rel.textContent = `Make Bar A ${compare.op} Bar B`;
    wrapper.append(rel);
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
    let ok = true;

    // Bar A must match target fraction value (allow equivalent fractions).
    const targetVal = target.numerator / target.denominator;
    ok = Math.abs(barA.value - targetVal) < 1e-9;

    if (ok && compare) {
      const cmp =
        barA.value < barB.value ? "<" : barA.value > barB.value ? ">" : "=";
      const wantB = compare.numerator / compare.denominator;
      ok = Math.abs(barB.value - wantB) < 1e-9 && cmp === compare.op;
    }

    if (ok) {
      done = true;
      checkBtn.style.display = "none";
      const msg = compare
        ? `Correct! ${barA.numerator}/${barA.denominator} ${compare.op} ${barB.numerator}/${barB.denominator}.`
        : `Correct! Bar A shows ${barA.numerator}/${barA.denominator}.`;
      showFb(feedbackSlot, "success", msg);
      onComplete?.(1, 1);
    } else {
      showFb(
        feedbackSlot,
        "hint",
        `Not quite. Target for Bar A is ${target.numerator}/${target.denominator}${compare ? `, and Bar A must be ${compare.op} Bar B (${compare.numerator}/${compare.denominator})` : ""}. Adjust the parts and shading.`,
      );
      onComplete?.(0, 1);
    }
  });
  wrapper.append(checkBtn);

  container.append(wrapper);
}

function ctrlBtn(label, aria) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.setAttribute("aria-label", aria);
  b.style.cssText =
    "width:32px; height:32px; border-radius:var(--radius-sm); border:2px solid var(--navy); background:var(--card); font-weight:900; cursor:pointer; color:var(--navy);";
  return b;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}

// Inject-once decorative polish. Purely additive: animates shading, segment
// hover, parallax depth on unshaded parts, and the live readout. All motion is
// disabled under prefers-reduced-motion; none of it changes the DOM contract,
// interaction handlers, checking, or callbacks.
let stylesInjected = false;
function injectFractionBarsStyles() {
  if (stylesInjected) return;
  if (typeof document === "undefined") return;
  if (document.getElementById("fb-engine-styles")) {
    stylesInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.id = "fb-engine-styles";
  style.textContent = `
    .fb-seg {
      position: relative;
      transition: transform 0.14s ease, opacity 0.18s ease, box-shadow 0.14s ease,
        filter 0.18s ease;
    }
    /* Gradient sweep that fills a segment left-to-right when it becomes shaded. */
    .fb-seg.fb-shaded {
      background-image: linear-gradient(
        90deg,
        color-mix(in srgb, var(--teal) 70%, white) 0%,
        var(--teal) 55%,
        color-mix(in srgb, var(--teal) 88%, var(--navy)) 100%
      );
      background-size: 200% 100%;
      background-position: 0% 0;
      animation: fb-sweep 0.42s cubic-bezier(0.16, 0.8, 0.3, 1) both;
    }
    @keyframes fb-sweep {
      from { background-position: 100% 0; }
      to   { background-position: 0% 0; }
    }
    /* Hover/focus: scale up slightly + highlight border. */
    .fb-seg:hover {
      transform: scale(1.08);
      z-index: 2;
      box-shadow: 0 0 0 2px var(--teal), 0 4px 10px rgba(15, 23, 42, 0.18);
    }
    .fb-seg:focus-visible {
      outline: 3px solid var(--teal);
      outline-offset: 2px;
      transform: scale(1.08);
      z-index: 2;
    }
    /* Parallax depth: when a bar has shaded parts, unshaded segments recede. */
    .fb-bar.fb-active .fb-seg:not(.fb-shaded) {
      opacity: 0.3;
    }
    .fb-bar.fb-active .fb-seg:not(.fb-shaded):hover {
      opacity: 1;
    }
    /* Live readout: numerator slides in from the left on change. */
    .fb-readout-num {
      display: inline-block;
    }
    .fb-readout-num.fb-num-in {
      animation: fb-num-slide 0.3s cubic-bezier(0.16, 0.8, 0.3, 1) both;
    }
    @keyframes fb-num-slide {
      from { transform: translateX(-8px); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    /* Touch devices: taller, easier-to-tap bars and a larger readout. */
    @media (hover: none) and (pointer: coarse) {
      .fb-bar {
        height: 70px !important;
      }
      .fb-readout {
        font-size: 1.15rem;
      }
      /* Hover scale is undesirable on touch (sticky :hover); keep depth only. */
      .fb-seg:hover {
        transform: none;
        box-shadow: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .fb-seg,
      .fb-seg.fb-shaded,
      .fb-readout-num.fb-num-in {
        transition: none !important;
        animation: none !important;
      }
      .fb-seg:hover,
      .fb-seg:focus-visible {
        transform: none;
      }
      /* Keep the depth cue (static), drop the gradient sweep + slide motion. */
      .fb-seg.fb-shaded {
        background-image: none;
      }
    }
  `;
  (document.head || document.documentElement).append(style);
  stylesInjected = true;
}
