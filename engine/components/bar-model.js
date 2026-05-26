export function renderBarModel(
  container,
  { bars, totalLabel, questionText, answer, tolerance, label, onComplete },
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

  const totalValue = bars.reduce((s, b) => s + b.value, 0);
  const BAR_H = 48;
  const GAP = 3;

  const vizWrap = document.createElement("div");
  vizWrap.style.cssText = "position:relative; margin-bottom:var(--sp-5);";

  // Total bar (top)
  if (totalLabel) {
    const totalBar = document.createElement("div");
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
    const bgColor = colors[i % colors.length];
    seg.style.cssText = `
      flex:${pct}; background:${bgColor}; border-radius:var(--radius-sm);
      display:grid; place-items:center; color:white; font-weight:800; font-size:0.88rem;
      position:relative; min-width:40px; transition:flex 0.3s var(--ease-out);
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
    input.className = "text-input";
    input.style.cssText = "max-width:150px;";
    input.placeholder = "Your answer";
    input.setAttribute("aria-label", questionText);

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

        // Reveal editable segments
        segBar.querySelectorAll("div").forEach((seg, i) => {
          if (bars[i]?.editable) {
            seg.style.background = colors[i % colors.length];
            seg.style.border = "none";
            seg.style.color = "white";
            seg.innerHTML = `<div style="text-align:center; line-height:1.2;"><div style="font-size:0.72rem; opacity:0.85;">${bars[i].label || ""}</div><div>${bars[i].value}</div></div>`;
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
