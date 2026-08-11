//
// Pure DOM + CSS, no dependencies. Matches the static tapeDiagramSVG palette.

const PALETTE = [
  "var(--teal,#2a9d8f)",
  "var(--coral,#d9795d)",
  "var(--amber,#e9c46a)",
  "var(--navy,#264653)",
];

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function ensureStyles() {
  if (document.getElementById("tdl-styles")) return;
  const s = document.createElement("style");
  s.id = "tdl-styles";
  s.textContent = `
  .tdl-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .tdl-title{font-weight:800;color:var(--navy,#264653);margin-bottom:4px;font-size:.98rem;text-align:center;}
  .tdl-hint{font-size:.82rem;color:var(--muted,#54677c);margin-bottom:10px;text-align:center;max-width:440px;line-height:1.4;}
  .tdl-stage{width:100%;max-width:540px;background:#fff;border:1px solid var(--line,#cbd5e1);border-radius:12px;padding:12px;}
  .tdl-row{display:flex;align-items:stretch;gap:8px;margin:6px 0;}
  .tdl-rowlab{flex:0 0 84px;display:flex;align-items:center;font-size:.78rem;font-weight:700;color:var(--navy,#264653);}
  .tdl-track{flex:1;display:flex;gap:3px;min-width:0;}
  .tdl-part{position:relative;min-width:0;height:40px;border:2px solid transparent;border-radius:5px;color:#fff;
    font-weight:700;font-size:.78rem;display:flex;align-items:center;justify-content:center;
    padding:0 2px;box-sizing:border-box;overflow:hidden;
    /* The parts are read, not clicked — the question is what the model leaves
       out, so nothing here should invite tapping. */
    cursor:default;}
  .tdl-part-unknown{opacity:.92;}
  .tdl-ask{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:12px;}
  .tdl-asklab{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;
    color:var(--muted,#54677c);}
  .tdl-input{width:110px;padding:8px 10px;font:inherit;font-size:1.1rem;font-weight:800;
    color:var(--navy,#264653);border:2px solid var(--line,#cbd5e1);border-radius:10px;background:#fbfcfe;}
  .tdl-input:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:1px;}
  .tdl-input:disabled{background:#eef7f4;border-color:var(--teal,#2a9d8f);}
  .tdl-status{min-height:1.2em;margin-top:8px;font-size:1rem;font-weight:700;text-align:center;color:var(--teal,#0d7a76);}
  .tdl-status.wrong{color:var(--coral,#c2410c);}
  .tdl-reveal{margin-top:10px;width:100%;max-width:540px;box-sizing:border-box;padding:10px 14px;
    border:1px solid var(--line,#cbd5e1);border-left:4px solid var(--teal,#2a9d8f);border-radius:12px;
    background:#f4faf8;font-size:.9rem;color:var(--navy,#264653);line-height:1.4;}
  .tdl-controls{display:flex;gap:8px;justify-content:center;margin-top:10px;}
  .tdl-btn{font:inherit;font-weight:700;font-size:.82rem;border-radius:999px;padding:6px 14px;cursor:pointer;
    border:2px solid var(--line,#cbd5e1);background:#fff;color:var(--navy,#264653);}
  .tdl-btn:hover{border-color:var(--accent,#1d4ed8);}
  `;
  document.head.appendChild(s);
}

// Read the tape model and work out WHICH quantity the diagram leaves unknown.
// A tape diagram authored here is always "a whole, split into equal parts", and
// exactly one of the three numbers is the thing the lesson is asking for:
//   • parts drawn as "?"           → the value of ONE part      (whole ÷ n)
//   • parts drawn with their value → HOW MANY parts there are   (whole ÷ unit)
// Returns null when the config is not that shape, in which case the lab falls
// back to simply presenting the diagram.
function readModel(rows) {
  const wholeRow = rows.find((r) => r.parts.length === 1);
  const partsRow = rows.find((r) => r.parts.length > 1);
  if (!wholeRow || !partsRow) return null;

  const whole = Number(wholeRow.parts[0].value);
  const n = partsRow.parts.length;
  const unit = Number(partsRow.parts[0].value);
  if (!Number.isFinite(whole) || !Number.isFinite(unit) || whole <= 0 || unit <= 0) return null;
  // Every part must be the same size for "equal parts" to mean anything.
  if (partsRow.parts.some((p) => Number(p.value) !== unit)) return null;

  const unknownIsPartValue = partsRow.parts.every((p) => String(p.label ?? "").trim() === "?");
  const money = /\$/.test(String(wholeRow.parts[0].label ?? ""));
  const fmt = (v) => (money ? `$${v}` : String(v));

  return unknownIsPartValue
    ? {
        mode: "value",
        whole,
        n,
        unit,
        answer: unit,
        fmt,
        wholeRow,
        partsRow,
        question: `The whole is ${fmt(whole)}, split into ${n} equal parts. What is ONE part worth?`,
        hint: `Equal parts means you share the whole evenly: ${whole} ÷ ${n}.`,
        equation: `${whole} ÷ ${n} = ${unit}`,
      }
    : {
        mode: "count",
        whole,
        n,
        unit,
        answer: n,
        fmt,
        wholeRow,
        partsRow,
        question: `The whole is ${fmt(whole)}. How many equal groups of ${fmt(unit)} fit inside it?`,
        hint: `Ask how many ${fmt(unit)}s it takes to make ${fmt(whole)}: ${whole} ÷ ${unit}.`,
        equation: `${whole} ÷ ${unit} = ${n}`,
      };
}

// Unique ids for the answer field's label/description, since a page can mount
// more than one tape diagram.
let tdlSeq = 0;

export function renderTapeDiagram(host, cfg) {
  ensureStyles();
  const rows = Array.isArray(cfg.rows) ? cfg.rows.filter((r) => Array.isArray(r.parts)) : [];
  if (!rows.length) return null;

  // Scale part widths to the longest row, so a part's size reflects its value.
  const rowTotals = rows.map((r) => r.parts.reduce((s, p) => s + (Number(p.value) || 1), 0));
  const maxTotal = Math.max(...rowTotals, 1);

  // The activity used to be "tap each part to count them". Counting boxes that
  // are already drawn on the screen is not the thinking the diagram is there to
  // support — the student can see the count without doing any maths. The lab
  // now asks for the quantity the model deliberately leaves out, and only draws
  // the answer once the student has committed to a number.
  const model = readModel(rows);
  tdlSeq += 1;
  const inputId = `tdl-ans-${tdlSeq}`;

  const wrap = document.createElement("div");
  wrap.className = "tdl-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="tdl-title">${esc(cfg.title)}</div>` : ""}
    <div class="tdl-hint">${
      model
        ? esc(model.question)
        : "Read the bars: the top one is the whole, the bottom one shows the equal parts."
    }</div>
    <div class="tdl-stage"></div>
    ${
      model
        ? `<div class="tdl-ask">
             <label class="tdl-asklab" for="${inputId}">Your answer</label>
             <input id="${inputId}" class="tdl-input" type="number" inputmode="numeric" step="any"
                    aria-describedby="${inputId}-q" />
             <button type="button" class="tdl-btn tdl-check">Check it</button>
             <button type="button" class="tdl-btn tdl-hintbtn">Hint</button>
           </div>
           <p id="${inputId}-q" class="sr-only">${esc(model.question)}</p>`
        : ""
    }
    <div class="tdl-status" role="status" aria-live="polite"></div>
    <div class="tdl-reveal" hidden></div>
    <div class="tdl-controls"><button type="button" class="tdl-btn tdl-reset">Start over</button></div>
  `;
  const stage = wrap.querySelector(".tdl-stage");
  const status = wrap.querySelector(".tdl-status");
  const reveal = wrap.querySelector(".tdl-reveal");
  const input = /** @type {HTMLInputElement|null} */ (wrap.querySelector(".tdl-input"));

  let colorIx = 0;
  let solved = false;
  let tries = 0;

  // Before the answer is committed, the unknown row is drawn blank: a "count
  // the groups" question whose groups are already on screen answers itself.
  function partLabel(rowIsUnknown, p) {
    if (!model || !rowIsUnknown) return p.label != null ? p.label : p.value;
    // Solved: the "?" boxes fill in with the value the student just worked out,
    // so the finished picture shows the answer rather than the question.
    if (solved) return model.mode === "value" ? model.fmt(model.unit) : (p.label ?? p.value);
    return "?";
  }

  function showAnswer() {
    solved = true;
    status.textContent = `🎉 ${model.equation}`;
    status.classList.remove("wrong");
    if (input) input.disabled = true;
    if (cfg.caption) {
      /** @type {HTMLElement} */ (reveal).hidden = false;
      reveal.innerHTML = esc(cfg.caption);
    }
    build();
  }

  function check() {
    if (!model || solved || !input) return;
    const given = Number(String(input.value).replace(/[$,\s]/g, ""));
    if (!Number.isFinite(given) || input.value === "") {
      status.textContent = "Type a number first.";
      status.classList.add("wrong");
      return;
    }
    if (Math.abs(given - model.answer) < 1e-9) {
      showAnswer();
      return;
    }
    tries += 1;
    status.classList.add("wrong");
    status.textContent =
      given > model.answer
        ? `Not quite — ${given} is too big. ${tries >= 2 ? model.hint : "Look at the whole bar again."}`
        : `Not quite — ${given} is too small. ${tries >= 2 ? model.hint : "Look at the whole bar again."}`;
  }

  function build() {
    stage.innerHTML = "";
    colorIx = 0;
    rows.forEach((r) => {
      const rowEl = document.createElement("div");
      rowEl.className = "tdl-row";
      const lab = document.createElement("div");
      lab.className = "tdl-rowlab";
      lab.textContent = r.label || "";
      const track = document.createElement("div");
      track.className = "tdl-track";
      // The row that carries the unknown is the multi-part row; it is the one
      // that stays blank until the student answers.
      const rowIsUnknown = !!model && r === model.partsRow;
      r.parts.forEach((p, i) => {
        const cell = document.createElement("div");
        cell.className = `tdl-part${rowIsUnknown && !solved ? " tdl-part-unknown" : ""}`;
        const grow = (Number(p.value) || 1) / maxTotal;
        cell.style.flex = `${grow} 1 0`;
        cell.style.background = p.fill || PALETTE[colorIx % PALETTE.length];
        colorIx += 1;
        const text = partLabel(rowIsUnknown, p);
        cell.textContent = String(text);
        cell.setAttribute("aria-label", `${r.label || "Part"} ${i + 1}: ${text}`);
        track.appendChild(cell);
      });
      rowEl.append(lab, track);
      stage.appendChild(rowEl);
    });
  }

  build();

  const resetBtn = wrap.querySelector(".tdl-reset");
  const checkBtn = wrap.querySelector(".tdl-check");
  const hintBtn = wrap.querySelector(".tdl-hintbtn");

  function reset() {
    solved = false;
    tries = 0;
    status.textContent = "";
    status.classList.remove("wrong");
    /** @type {HTMLElement} */ (reveal).hidden = true;
    if (input) {
      input.disabled = false;
      input.value = "";
    }
    build();
  }
  function showHint() {
    if (!model || solved) return;
    status.classList.remove("wrong");
    status.textContent = model.hint;
  }

  resetBtn.addEventListener("click", reset);
  checkBtn?.addEventListener("click", check);
  hintBtn?.addEventListener("click", showHint);
  input?.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      check();
    }
  });

  host.appendChild(wrap);
  return {
    destroy() {
      resetBtn.removeEventListener("click", reset);
      checkBtn?.removeEventListener("click", check);
      hintBtn?.removeEventListener("click", showHint);
      wrap.remove();
    },
  };
}

export default renderTapeDiagram;
