let BM_STYLE_INJECTED = false;

function injectBarModelStyle() {
  if (BM_STYLE_INJECTED) return;
  BM_STYLE_INJECTED = true;
  const css = `
  .bm-total { animation: bm-total-in .45s var(--ease-out, ease-out) both; }
  .bm-seg { transition: flex 0.3s var(--ease-out, ease-out), transform .16s var(--ease-out, ease-out), box-shadow .16s var(--ease-out, ease-out), filter .16s var(--ease-out, ease-out); }
  .bm-seg:hover { transform: scale(1.03); box-shadow: 0 4px 14px rgba(15,23,42,0.18); filter: brightness(1.05); z-index: 1; }
  .bm-annotation { transition: transform .2s var(--ease-out, ease-out), border-color .2s var(--ease-out, ease-out), color .2s var(--ease-out, ease-out); }
  .bm-annotation.bm-emphasis { transform: translateY(-1px); }
  .bm-input { transition: box-shadow .18s var(--ease-out, ease-out), border-color .18s var(--ease-out, ease-out), background .18s var(--ease-out, ease-out); cursor: text; }
  .bm-input:focus, .bm-input:focus-visible { box-shadow: 0 0 0 3px rgba(31,166,162,0.28); border-color: var(--teal, #1fa6a2); }
  .bm-revealed { animation: bm-reveal-in .42s var(--ease-out, ease-out) both; }
  @keyframes bm-total-in {
    from { opacity: 0; transform: translateY(-6px) scaleX(0.96); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes bm-reveal-in {
    0%   { opacity: 0.4; transform: scale(0.9); }
    60%  { transform: scale(1.04); }
    100% { opacity: 1; transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bm-total { animation: none; }
    .bm-seg { transition: flex 0.3s var(--ease-out, ease-out); }
    .bm-seg:hover { transform: none; box-shadow: none; filter: none; }
    .bm-annotation { transition: none; }
    .bm-annotation.bm-emphasis { transform: none; }
    .bm-input { transition: none; }
    .bm-revealed { animation: none; }
  }
  `;
  const style = document.createElement("style");
  style.dataset.bm = "bar-model";
  style.textContent = css;
  (document.head || document.documentElement).append(style);
}

export function renderBarModel(
  container,
  { bars, totalLabel, questionText, answer, tolerance, label, onComplete },
) {
  injectBarModelStyle();

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-4); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const totalValue = bars.reduce((s, b) => s + b.value, 0);
  const BAR_H = 48;
  const GAP = 3;

  const vizWrap = document.createElement("div");
  vizWrap.style.cssText = "position:relative; margin-bottom:var(--sp-5);";

  // Total bar (top)
  if (totalLabel) {
    const totalBar = document.createElement("div");
    totalBar.className = "bm-total";
    totalBar.style.cssText = `
      height:${BAR_H}px; background:var(--navy); border-radius:var(--radius-sm);
      display:grid; place-items:center; color:white; font-weight:800; font-size:0.95rem;
      margin-bottom:${GAP}px;
    `;
    totalBar.textContent = `${totalLabel}: ${totalValue}`;
    vizWrap.append(totalBar);
  }

  // Segmented bar
  const segBar = document.createElement("div");
  segBar.style.cssText = `display:flex; gap:${GAP}px; height:${BAR_H}px;`;

  const colors = [
    "#1fa6a2",
    "#f2c15b",
    "#d9795d",
    "#2f80d1",
    "#0fa958",
    "#875f00",
  ];

  bars.forEach((bar, i) => {
    const pct = (bar.value / totalValue) * 100;
    const seg = document.createElement("div");
    seg.className = "bm-seg";
    const bgColor = colors[i % colors.length];
    seg.style.cssText = `
      flex:${pct}; background:${bgColor}; border-radius:var(--radius-sm);
      display:grid; place-items:center; color:white; font-weight:800; font-size:0.88rem;
      position:relative; min-width:40px;
    `;

    if (bar.editable) {
      seg.style.background = "var(--cream)";
      seg.style.border = "2px dashed var(--line)";
      seg.style.color = "var(--ink)";
      seg.innerHTML = `<span style="font-size:0.75rem; color:var(--muted);">${bar.label || "?"}</span>`;
    } else {
      seg.innerHTML = `
        <div style="text-align:center; line-height:1.2;">
          <div style="font-size:0.72rem; opacity:0.85;">${bar.label || ""}</div>
          <div>${bar.value}</div>
        </div>
      `;
    }

    segBar.append(seg);
  });

  vizWrap.append(segBar);

  // Bracket annotations
  const bracketRow = document.createElement("div");
  bracketRow.style.cssText = `
    display:flex; gap:${GAP}px; margin-top:4px; height:20px;
  `;

  bars.forEach((bar, i) => {
    const pct = (bar.value / totalValue) * 100;
    const annotation = document.createElement("div");
    annotation.className = "bm-annotation";
    annotation.style.cssText = `
      flex:${pct}; text-align:center; font-size:0.72rem; font-weight:700;
      color:${colors[i % colors.length]}; border-top:2px solid ${colors[i % colors.length]};
      padding-top:2px; min-width:40px;
    `;
    annotation.textContent = bar.annotation || "";
    bracketRow.append(annotation);
  });

  vizWrap.append(bracketRow);
  wrapper.append(vizWrap);

  // Question + answer input
  if (questionText) {
    const qCard = document.createElement("div");
    qCard.className = "card-compact card-teal";
    qCard.style.cssText =
      "background:var(--teal-light); border:1px solid rgba(31,166,162,0.15); border-radius:var(--radius-md); padding:var(--sp-4); margin-bottom:var(--sp-3);";

    const qText = document.createElement("p");
    qText.style.cssText = "font-weight:700; margin:0 0 var(--sp-3);";
    qText.textContent = questionText;
    qCard.append(qText);

    const inputRow = document.createElement("div");
    inputRow.style.cssText =
      "display:flex; gap:var(--sp-3); align-items:center;";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "text-input bm-input";
    input.style.cssText = "max-width:150px;";
    input.placeholder = "Your answer";
    input.setAttribute("aria-label", questionText);

    // Annotation brackets gain visual emphasis while the learner is
    // actively answering, drawing the eye to the part/whole relationship.
    const annotations = vizWrap.querySelectorAll(".bm-annotation");
    input.addEventListener("focus", () => {
      annotations.forEach((a) => a.classList.add("bm-emphasis"));
    });
    input.addEventListener("blur", () => {
      annotations.forEach((a) => a.classList.remove("bm-emphasis"));
    });

    const checkBtn = document.createElement("button");
    checkBtn.className = "btn btn-primary";
    checkBtn.textContent = "Check";

    inputRow.append(input, checkBtn);
    qCard.append(inputRow);

    const fb = document.createElement("div");
    fb.className = "mt-4";
    qCard.append(fb);

    let done = false;

    checkBtn.addEventListener("click", () => {
      if (done) return;
      const val = input.value.trim();
      if (!val) {
        showFb(fb, "hint", "Enter your answer first.");
        return;
      }

      const tol = tolerance || 0;
      const numVal = parseFloat(val.replace(/[,$%]/g, ""));
      const numAns = parseFloat(String(answer).replace(/[,$%]/g, ""));

      const isCorrect =
        !isNaN(numVal) && !isNaN(numAns)
          ? Math.abs(numVal - numAns) <= tol
          : val.toLowerCase().trim() === String(answer).toLowerCase().trim();

      if (isCorrect) {
        done = true;
        input.readOnly = true;
        input.style.borderColor = "var(--success)";
        input.style.background = "var(--success-bg)";
        checkBtn.style.display = "none";
        showFb(fb, "success", `Correct! The answer is ${answer}.`);

        // Reveal editable segments (with a gentle staggered pop-in). Iterate the
        // DIRECT segment children only — querySelectorAll("div") also returns the
        // nested label/value divs, which misaligns the index with `bars[i]`.
        let revealIndex = 0;
        [...segBar.children].forEach((seg, i) => {
          if (bars[i]?.editable) {
            seg.style.background = colors[i % colors.length];
            seg.style.border = "none";
            seg.style.color = "white";
            seg.innerHTML = `<div style="text-align:center; line-height:1.2;"><div style="font-size:0.72rem; opacity:0.85;">${bars[i].label || ""}</div><div>${bars[i].value}</div></div>`;
            seg.style.animationDelay = `${revealIndex * 90}ms`;
            seg.classList.add("bm-revealed");
            revealIndex += 1;
          }
        });

        if (onComplete) onComplete(1, 1);
      } else {
        showFb(
          fb,
          "hint",
          "Not quite. Look at the bar model — how do the parts relate to the whole?",
        );
      }
    });

    wrapper.append(qCard);
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
