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
    readout.style.cssText = "font-weight:700; color:var(--teal);";
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
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", `${name} fraction bar`);
    bar.style.cssText =
      "display:flex; width:100%; height:56px; border:2px solid var(--navy); border-radius:var(--radius-sm); overflow:hidden;";
    block.append(bar);

    function render() {
      bar.innerHTML = "";
      for (let i = 0; i < parts; i++) {
        const seg = document.createElement("button");
        seg.type = "button";
        seg.dataset.i = String(i);
        seg.setAttribute("aria-pressed", shaded.has(i) ? "true" : "false");
        seg.setAttribute("aria-label", `Part ${i + 1} of ${parts}`);
        seg.style.cssText = `
          flex:1; border:none; border-right:${i < parts - 1 ? "1px solid var(--navy)" : "none"};
          background:${shaded.has(i) ? "var(--teal)" : "white"}; cursor:pointer;`;
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

    function updateReadout() {
      readout.textContent = `${shaded.size}/${parts}`;
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
