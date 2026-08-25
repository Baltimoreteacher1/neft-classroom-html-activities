//
// Pure DOM + CSS, no dependencies. Matches the static tapeDiagramSVG palette.

const PALETTE = [
  "var(--teal,#2a9d8f)",
  "var(--coral,#d9795d)",
  "var(--amber,#e9c46a)",
  "var(--navy,#264653)",
];

function formatQty(v) {
  return String(Math.round(v * 100) / 100);
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

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
  .tdl-title{font-weight:700;color:var(--navy,#264653);margin-bottom:4px;font-size:.98rem;text-align:center;}
  .tdl-hint{font-size:.82rem;color:var(--muted,#54677c);margin-bottom:10px;text-align:center;max-width:440px;line-height:1.4;}
  .tdl-stage{width:100%;max-width:540px;background:#fff;border:1px solid var(--line,#cbd5e1);border-radius:12px;padding:12px;}
  .tdl-row{display:flex;align-items:stretch;gap:8px;margin:6px 0;}
  .tdl-rowlab{flex:0 0 84px;display:flex;align-items:center;font-size:.78rem;font-weight:600;color:var(--navy,#264653);}
  .tdl-track{flex:1;display:flex;gap:3px;min-width:0;}
  .tdl-part{position:relative;min-width:0;height:40px;border:2px solid transparent;border-radius:5px;color:#fff;
    font-weight:600;font-size:.78rem;display:flex;align-items:center;justify-content:center;
    padding:0 2px;box-sizing:border-box;overflow:hidden;
    /* The parts are read, not clicked — the question is what the model leaves
       out, so nothing here should invite tapping. */
    cursor:default;}
  .tdl-part-unknown{opacity:.92;}
  .tdl-ask{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:12px;}
  .tdl-asklab{font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
    color:var(--muted,#54677c);}
  .tdl-input{width:110px;padding:8px 10px;font:inherit;font-size:1.1rem;font-weight:700;
    color:var(--navy,#264653);border:2px solid var(--line,#cbd5e1);border-radius:10px;background:#fbfcfe;}
  .tdl-input:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:1px;}
  .tdl-input:disabled{background:#eef7f4;border-color:var(--teal,#2a9d8f);}
  .tdl-status{min-height:1.2em;margin-top:8px;font-size:1rem;font-weight:600;text-align:center;color:var(--teal,#0d7a76);}
  .tdl-status.wrong{color:var(--coral,#c2410c);}
  .tdl-reveal{margin-top:10px;width:100%;max-width:540px;box-sizing:border-box;padding:10px 14px;
    border:1px solid var(--line,#cbd5e1);border-left:4px solid var(--teal,#2a9d8f);border-radius:12px;
    background:#f4faf8;font-size:.9rem;color:var(--navy,#264653);line-height:1.4;}
  .tdl-controls{display:flex;gap:8px;justify-content:center;margin-top:10px;}
  .tdl-btn{font:inherit;font-weight:600;font-size:.82rem;border-radius:999px;padding:6px 14px;cursor:pointer;
    border:2px solid var(--line,#cbd5e1);background:#fff;color:var(--navy,#264653);}
  .tdl-btn:hover{border-color:var(--accent,#1d4ed8);}
  /* The What-if strip: available only after the question is answered, so the
     diagram becomes something to think WITH instead of a finished picture. */
  .tdl-explore{margin-top:12px;width:100%;max-width:540px;box-sizing:border-box;padding:10px 14px;
    border:1px solid var(--line,#cbd5e1);border-left:4px solid var(--amber,#e9c46a);border-radius:12px;
    background:#fffdf5;}
  .tdl-explore-q{margin:0 0 8px;font-size:.88rem;color:var(--navy,#264653);line-height:1.45;}
  .tdl-explore-controls{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;}
  .tdl-explore-read{font-size:.9rem;font-weight:700;color:var(--navy,#264653);text-align:center;
    min-width:min(100%,15rem);}
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

/**
 * The OTHER tape shape: two parallel rows of equal groups, which is how a
 * ratio is drawn (5 5 5 5 cars over 20 20 20 20 riders). `readModel` returns
 * null for these because there is no single-part "whole" row, so 73 of the 99
 * tape-diagram lessons rendered a completely static picture — the most-used
 * manipulable in the curriculum, drawn and then left alone.
 *
 * What a ratio tape is FOR is the invariant: every group holds the same a : b,
 * so scaling the number of groups changes both totals and changes neither the
 * ratio nor the per-group relationship. That is only visible if the number of
 * groups can move.
 *
 * Returns null unless both rows are internally uniform and have the same group
 * count — anything else is an authored figure whose meaning this code cannot
 * infer, and guessing at it would be worse than leaving it static.
 *
 * WHY THE REMAINING 71 DIAGRAMS STAY STATIC (investigated 2026-08-15). They are
 * only 22 distinct figures; the rest is parent/variant duplication. Grouping
 * them by structure and then READING them settles it — two of the families are
 * structurally identical and mathematically opposite:
 *
 *   4-1  "Two kittens: 100% and 150%"   [50,50] / [50,50,50]
 *   4-2  "3/5 Off a $40 Game"           [8,8,8] / [8,8]
 *
 * Both are two uniform rows with unequal group counts. In 4-1 the top row is
 * the WHOLE and the bottom is a multiple of it (150%); in 4-2 the rows are two
 * PARTS of one partitioned whole (3/5 off, 2/5 paid). Any rule that made one
 * manipulable would describe the other one wrongly — it would announce "3/5 off
 * a $40 game" as 150%. The others are equally distinct: 6-4 is 150 + 12n linear
 * growth, 6-15 is like terms being summed per row.
 *
 * So this is not a gap waiting for a cleverer heuristic. Making them
 * manipulable requires authored configuration per family, and each family is
 * one parent lesson plus its variants — which is not enough repetition to earn
 * a new config type. Static is the correct rendering.
 *
 * @returns {{a: number, b: number, groups: number, rowA: any, rowB: any}|null}
 */
export function readRatioModel(rows) {
  if (rows.length !== 2) return null;
  const [rowA, rowB] = rows;
  if (rowA.parts.length !== rowB.parts.length || rowA.parts.length < 2) return null;
  const uniform = (r) => r.parts.every((p) => Number(p.value) === Number(r.parts[0].value));
  if (!uniform(rowA) || !uniform(rowB)) return null;
  const a = Number(rowA.parts[0].value);
  const b = Number(rowB.parts[0].value);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return { a, b, groups: rowA.parts.length, rowA, rowB };
}

/** Smallest whole-number form of a : b, so the invariant is stated in lowest terms. */
export function simplestRatio(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  const g = gcd(a, b);
  return g > 1 ? [a / g, b / g] : [a, b];
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
  // Only consulted when there is no whole/parts model — the two shapes are
  // mutually exclusive by construction (one needs a single-part row, the other
  // forbids it).
  const ratio = model ? null : readRatioModel(rows);
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
    showExplore();
  }

  /* ── What if? ──────────────────────────────────────────────────────────────
   * Until now the lab locked the moment the answer was right: the diagram had
   * done its job and became a picture of a finished exercise. But the whole
   * point of a tape diagram is the relationship between the whole, the number
   * of equal parts and the size of one part — and that relationship is only
   * visible when one of the three MOVES.
   *
   * After the student has committed to an answer (never before — this must not
   * become a way to avoid the question), the tape becomes manipulable: change
   * the number of equal parts and the partition, the part value and the
   * equation all update together. The whole is deliberately held fixed, so
   * what the student sees is the inverse relationship: more parts, smaller
   * parts, same total.
   *
   * Buttons rather than a drag handle: it is the accessible path by default,
   * and re-partitioning is discrete anyway. */
  let exploreN = null;
  function showExplore() {
    if (!model || wrap.querySelector(".tdl-explore")) return;
    // Only meaningful when the parts divide the whole evenly enough to talk
    // about. Non-terminating part values would teach the wrong lesson here.
    const box = document.createElement("div");
    box.className = "tdl-explore";
    box.innerHTML = `
      <p class="tdl-explore-q"><strong>What if?</strong> Before you change it — if the same
        ${model.fmt(model.whole)} is shared into MORE equal parts, will one part get bigger or smaller?</p>
      <div class="tdl-explore-controls">
        <button type="button" class="tdl-btn tdl-fewer" aria-label="One fewer equal part">− part</button>
        <output class="tdl-explore-read" aria-live="polite"></output>
        <button type="button" class="tdl-btn tdl-more" aria-label="One more equal part">+ part</button>
      </div>`;
    wrap.querySelector(".tdl-controls")?.before(box);
    exploreN = model.n;
    const read = box.querySelector(".tdl-explore-read");

    const repartition = (n) => {
      exploreN = Math.max(1, Math.min(12, n));
      const unit = model.whole / exploreN;
      // Redraw the parts row at the new partition.
      const track = stage.querySelectorAll(".tdl-track")[rows.indexOf(model.partsRow)];
      if (track) {
        track.innerHTML = "";
        for (let i = 0; i < exploreN; i += 1) {
          const cell = document.createElement("div");
          cell.className = "tdl-part";
          cell.style.flex = `${model.whole / exploreN / maxTotal} 1 0`;
          cell.style.background = PALETTE[i % PALETTE.length];
          const shown = Number.isInteger(unit) ? model.fmt(unit) : model.fmt(round2(unit));
          cell.textContent = shown;
          cell.setAttribute("aria-label", `Part ${i + 1}: ${shown}`);
          track.appendChild(cell);
        }
      }
      const unitTxt = Number.isInteger(unit) ? model.fmt(unit) : model.fmt(round2(unit));
      read.textContent = `${model.fmt(model.whole)} ÷ ${exploreN} = ${unitTxt} — ${exploreN} equal parts, each worth ${unitTxt}.`;
    };
    repartition(model.n);
    box.querySelector(".tdl-more").addEventListener("click", () => repartition(exploreN + 1));
    box.querySelector(".tdl-fewer").addEventListener("click", () => repartition(exploreN - 1));
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

  /* ── Ratio tapes: scale the groups ──────────────────────────────────────────
   * For the two-parallel-rows shape there is no question to answer, so this is
   * available immediately rather than after a solve. Changing the number of
   * groups redraws BOTH rows together and updates one readout carrying three
   * linked facts: the per-group ratio (unchanged), the two totals (changed),
   * and the scale factor relating them. Seeing the totals move while a : b
   * holds still is the multiplicative structure — the thing a static picture
   * of four equal boxes cannot show.
   *
   * The student is asked to predict before touching it, and the original
   * authored group count is always one click away via Start over. */
  function showRatioExplore() {
    if (!ratio || wrap.querySelector(".tdl-explore")) return;
    const simple = simplestRatio(ratio.a, ratio.b);
    const ratioTxt = `${formatQty(ratio.a)} : ${formatQty(ratio.b)}`;
    const box = document.createElement("div");
    box.className = "tdl-explore";
    box.innerHTML = `
      <p class="tdl-explore-q"><strong>What if?</strong> Each group is
        ${esc(ratioTxt)}. Predict first: if you add more groups, does the
        <em>ratio in one group</em> change, or only the totals?</p>
      <div class="tdl-explore-controls">
        <button type="button" class="tdl-btn tdl-fewer" aria-label="One fewer group">− group</button>
        <output class="tdl-explore-read" aria-live="polite"></output>
        <button type="button" class="tdl-btn tdl-more" aria-label="One more group">+ group</button>
      </div>`;
    wrap.querySelector(".tdl-controls")?.before(box);
    const read = box.querySelector(".tdl-explore-read");
    let groups = ratio.groups;

    const redraw = (next) => {
      groups = Math.max(1, Math.min(8, next));
      const tracks = stage.querySelectorAll(".tdl-track");
      [ratio.rowA, ratio.rowB].forEach((row, ri) => {
        const track = tracks[rows.indexOf(row)];
        if (!track) return;
        const per = ri === 0 ? ratio.a : ratio.b;
        track.innerHTML = "";
        for (let i = 0; i < groups; i += 1) {
          const cell = document.createElement("div");
          cell.className = "tdl-part";
          cell.style.flex = `${per / maxTotal} 1 0`;
          cell.style.background = PALETTE[(ri * 2 + (i % 2)) % PALETTE.length];
          cell.textContent = formatQty(per);
          cell.setAttribute(
            "aria-label",
            `${row.label || "Row"} group ${i + 1}: ${formatQty(per)}`,
          );
          track.appendChild(cell);
        }
      });
      const totalA = round2(ratio.a * groups);
      const totalB = round2(ratio.b * groups);
      const same =
        simple && (simple[0] !== ratio.a || simple[1] !== ratio.b)
          ? ` Both totals still simplify to ${formatQty(simple[0])} : ${formatQty(simple[1])}.`
          : "";
      read.textContent =
        `${groups} group${groups === 1 ? "" : "s"} of ${ratioTxt} → ${formatQty(totalA)} : ${formatQty(totalB)}. ` +
        `Each group is still ${ratioTxt}.${same}`;
    };
    redraw(ratio.groups);
    box.querySelector(".tdl-more").addEventListener("click", () => redraw(groups + 1));
    box.querySelector(".tdl-fewer").addEventListener("click", () => redraw(groups - 1));
  }
  showRatioExplore();

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
    // The What-if strip belongs to a solved diagram; starting over puts the
    // question back, so it goes with it.
    wrap.querySelector(".tdl-explore")?.remove();
    exploreN = null;
    build();
    showRatioExplore();
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
