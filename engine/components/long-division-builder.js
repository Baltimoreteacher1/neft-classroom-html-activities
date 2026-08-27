// long-division-builder.js — the Long Division Lab.
//
// Teaches the STANDARD algorithm as an explicit repeating cycle:
//   Divide → Multiply → Subtract → Bring Down → repeat
// It draws real long-division notation (bracket, quotient digits above their
// own place, products underneath, subtraction rules, brought-down digits) so
// the place-value alignment is visible rather than implied.
//
// Two modes over ONE algorithm:
//   solve  the student produces every number; the lab only checks and places.
//   watch  the lab works the same problem itself, one step at a time, saying
//          what it is doing and why — then hands the problem back to solve.
// Both walk the identical `plan.steps` list, so they can never disagree.
//
// This file is the DOM. The arithmetic lives in ./long-division-steps.js, the
// watch-mode script in ./long-division-narration.js, and the markup and
// stylesheet in ./long-division-chrome.js.
//
// Public API:
//   renderLongDivisionBuilder(container, cfg) -> { destroy }
//     cfg.dividend, cfg.divisor : starting values (default 754, 6)
//     cfg.presets               : quick-pick "dividend/divisor" strings
//     cfg.decimal               : opt in to decimal division (moves the point
//                                 first, then runs the identical cycle)
//     cfg.maxPlaces             : decimal places to divide to (default 3)
//     cfg.mode                  : "solve" (default) or "watch"

import { esc, injectStyles, template } from "./long-division-chrome.js";
import { buildNarration, createNarrationCursor } from "./long-division-narration.js";
import {
  buildLongDivision,
  CYCLE_BADGES,
  CYCLE_LABELS,
  checkInputs,
  stepPosition,
} from "./long-division-steps.js";

const STEP_NOTE = {
  divide: "Write the digit above the place you are working in.",
  multiply: "Write the product under the working number.",
  subtract: "Draw the line and subtract.",
  bringdown: "Pull the next digit straight down.",
};

/** Auto-advance pace: long enough to read two sentences, short enough to feel live. */
const PLAY_MS = 3800;

let seq = 0;

/**
 * @param {ParentNode} scope
 * @param {string} sel
 * @returns {HTMLElement}
 */
function el(scope, sel) {
  return /** @type {HTMLElement} */ (scope.querySelector(sel));
}

/**
 * @param {ParentNode} scope
 * @param {string} sel
 * @returns {HTMLInputElement}
 */
function inputEl(scope, sel) {
  return /** @type {HTMLInputElement} */ (scope.querySelector(sel));
}

/**
 * @param {HTMLElement} host
 * @param {{dividend?:unknown, divisor?:unknown, decimal?:boolean, maxPlaces?:number, presets?:unknown, mode?:string}} cfg
 */
export function renderLongDivisionBuilder(host, cfg = {}) {
  const decimal = cfg.decimal === true;
  const uid = `ldl${++seq}`;
  injectStyles();

  const presets = normalisePresets(cfg.presets, decimal);
  /** @type {ReturnType<typeof buildLongDivision>} */
  let plan;
  /** @type {"solve"|"watch"} */
  let mode = cfg.mode === "watch" ? "watch" : "solve";
  let ready = false;
  let stepIndex = 0;
  let attempts = 0;
  let shiftDone = true;
  /* The decimal set-up is TWO moves, not one.
   *
   * It used to be a single "Move the point 1 place →" button that both told the
   * student the answer and slid BOTH points at once — the one place in the lab
   * where the student watched instead of worked, and the step most likely to be
   * the reason the division goes wrong. Now: stage 0 asks how many places the
   * DIVISOR needs (they type it), stage 1 moves the DIVIDEND by that same
   * amount, stage 2 is the cycle. `shiftDone` stays the single flag the rest of
   * this file and the watch-mode replay already read. */
  let shiftStage = 2;
  let shiftEntryError = "";
  let justBrought = -1;
  /** @type {ReturnType<typeof createNarrationCursor>|null} */
  let cursor = null;
  /** @type {import("./long-division-narration.js").LDFrame|null} */
  let frame = null;
  let timer = 0;

  const root = document.createElement("div");
  root.className = "ldl";
  root.innerHTML = template(uid, decimal, presets);
  host.appendChild(root);

  const inDividend = inputEl(root, `#${uid}-dividend`);
  const inDivisor = inputEl(root, `#${uid}-divisor`);
  const shiftBar = el(root, ".ldl-shift");
  const strip = el(root, ".ldl-strip");
  const board = el(root, ".ldl-board");
  const stepBox = el(root, ".ldl-step");
  const entry = el(root, ".ldl-entry");
  const answer = inputEl(root, `#${uid}-answer`);
  const answerLabel = el(root, `label[for="${uid}-answer"]`);
  const checkBtn = el(root, ".ldl-check");
  const bringBtn = el(root, ".ldl-bring");
  const feedback = el(root, ".ldl-feedback");
  const result = el(root, ".ldl-result");
  const playBar = el(root, ".ldl-play");
  const backBtn = /** @type {HTMLButtonElement} */ (el(root, ".ldl-back"));
  const nextBtn = /** @type {HTMLButtonElement} */ (el(root, ".ldl-next"));
  const playBtn = /** @type {HTMLButtonElement} */ (el(root, ".ldl-playpause"));
  const replayBtn = /** @type {HTMLButtonElement} */ (el(root, ".ldl-replay"));
  const mineBtn = /** @type {HTMLButtonElement} */ (el(root, ".ldl-mine"));
  const countBox = el(root, ".ldl-count");

  // ── problem setup ────────────────────────────────────────────────────────
  /** Validate what was typed, build the plan, then start the current mode. */
  function load(dividend, divisor, announce) {
    stopPlay();
    const verdict = checkInputs({ dividend, divisor, decimal });
    if (!verdict.ok) {
      clear(verdict.message);
      const box = verdict.field === "divisor" ? inDivisor : inDividend;
      if (announce) box.focus();
      return;
    }
    try {
      plan = buildLongDivision({ dividend, divisor, decimal, maxPlaces: cfg.maxPlaces });
    } catch (err) {
      clear(
        err instanceof RangeError
          ? `That problem cannot be divided: ${err.message}.`
          : "That problem cannot be divided. Try different numbers.",
      );
      return;
    }
    ready = true;
    restart(announce);
    if (verdict.message) say(verdict.message, "info");
  }

  /**
   * Wipe every trace of the previous problem and explain why nothing is drawn.
   * Without this a rejected problem left the old board's strip, prompt and
   * result on screen, which reads as if the new numbers had been accepted.
   */
  function clear(message) {
    ready = false;
    cursor = null;
    frame = null;
    board.innerHTML = "";
    board.setAttribute("aria-label", "No problem set up yet.");
    strip.innerHTML = "";
    shiftBar.hidden = true;
    stepBox.textContent = "";
    entry.hidden = true;
    playBar.hidden = true;
    result.hidden = true;
    result.innerHTML = "";
    say(message, "bad");
  }

  /** Restart the CURRENT problem in the CURRENT mode, from the top. */
  function restart(announce) {
    if (!ready) return;
    stopPlay();
    attempts = 0;
    justBrought = -1;
    stepIndex = 0;
    shiftDone = plan.shift === 0;
    shiftStage = plan.shift === 0 ? 2 : 0;
    shiftEntryError = "";
    result.hidden = true;
    result.innerHTML = "";
    feedback.className = "ldl-feedback";
    feedback.textContent = "";
    playBar.hidden = mode !== "watch";
    if (mode === "watch") {
      cursor = createNarrationCursor(buildNarration(plan));
      entry.hidden = true;
      showFrame();
      if (announce) nextBtn.focus();
      return;
    }
    cursor = null;
    frame = null;
    entry.hidden = false;
    renderShift();
    draw();
    if (!announce) return;
    const first = shiftDone ? answer : el(root, ".ldl-shiftgo");
    if (first) first.focus();
  }

  function renderShift() {
    if (!plan.shift) {
      shiftBar.hidden = true;
      return;
    }
    shiftBar.hidden = false;
    const places = plan.shift === 1 ? "1 place" : plan.shift + " places";

    // Watch mode demonstrates; it never asks. Keep its single summary line.
    if (mode === "watch") {
      shiftBar.innerHTML = shiftDone
        ? '<span class="ldl-shift-done">\u2713 Point moved ' +
          esc(places) +
          ":</span> " +
          "<b>" +
          esc(plan.dividendText) +
          " \u00f7 " +
          esc(plan.divisorText) +
          "</b> \u2192 " +
          '<b class="ldl-shift-new">' +
          esc(plan.workingDividendText) +
          " \u00f7 " +
          esc(plan.workingDivisorText) +
          "</b>" +
          " \u2014 now it is a whole-number divisor, so the cycle works exactly the same."
        : "<b>Step 0 \u2014 MOVE THE POINT.</b> The divisor <b>" +
          esc(plan.divisorText) +
          "</b> is not a whole number. " +
          "Slide the point " +
          esc(places) +
          " to the right in <em>both</em> numbers, then divide as usual.";
      return;
    }

    if (shiftStage === 0) {
      // STEP 1 — the divisor, and the student decides how far.
      shiftBar.innerHTML =
        "<b>Step 1 \u2014 MOVE THE DIVISOR.</b> The divisor <b>" +
        esc(plan.divisorText) +
        "</b> is not a whole number. " +
        "How many places to the right must its decimal point move to make it whole?" +
        '<span class="ldl-shift-ask">' +
        '<label class="ldl-shift-label" for="ldl-shift-places">places</label>' +
        '<input id="ldl-shift-places" class="ldl-shift-input" type="number" inputmode="numeric" min="1" max="6" step="1" />' +
        '<button type="button" class="ldl-shiftcheck">Move the divisor \u2192</button>' +
        "</span>" +
        (shiftEntryError
          ? '<span class="ldl-shift-err" role="status">' + esc(shiftEntryError) + "</span>"
          : "");

      const input = /** @type {HTMLInputElement|null} */ (
        shiftBar.querySelector(".ldl-shift-input")
      );
      const check = shiftBar.querySelector(".ldl-shiftcheck");
      const submit = () => {
        const raw = String(input && input.value ? input.value : "").trim();
        if (!raw) {
          shiftEntryError = "Type how many places, then press Move the divisor.";
          renderShift();
          return;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n === 0) {
          shiftEntryError = "Use a whole number of places, like 1 or 2.";
        } else if (n !== plan.shift) {
          // Name what their number WOULD do, rather than just marking it wrong.
          shiftEntryError =
            "Moving " +
            n +
            (n === 1 ? " place" : " places") +
            " does not make " +
            plan.divisorText +
            " a whole number. Count the digits after its decimal point.";
        } else {
          shiftEntryError = "";
          shiftStage = 1;
          renderShift();
          draw();
          const next = shiftBar.querySelector(".ldl-shiftgo");
          if (next) /** @type {HTMLElement} */ (next).focus();
          return;
        }
        renderShift();
        const again = /** @type {HTMLElement|null} */ (shiftBar.querySelector(".ldl-shift-input"));
        if (again) again.focus();
      };
      if (check) check.addEventListener("click", submit);
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (/** @type {KeyboardEvent} */ (e).key === "Enter") {
            e.preventDefault();
            submit();
          }
        });
      }
      return;
    }

    if (shiftStage === 1) {
      // STEP 2 — the dividend moves the SAME amount. Stated as a consequence of
      // what they just did, which is the whole point of splitting the two.
      shiftBar.innerHTML =
        '<span class="ldl-shift-done">\u2713 Divisor moved ' +
        esc(places) +
        ":</span> " +
        "<b>" +
        esc(plan.divisorText) +
        '</b> \u2192 <b class="ldl-shift-new">' +
        esc(plan.workingDivisorText) +
        "</b><br />" +
        "<b>Step 2 \u2014 MOVE THE DIVIDEND.</b> Move <b>" +
        esc(plan.dividendText) +
        "</b> the same " +
        esc(places) +
        " to the right, " +
        "so the answer does not change." +
        ' <button type="button" class="ldl-shiftgo">Move the dividend ' +
        esc(places) +
        " \u2192</button>";
      const go = shiftBar.querySelector(".ldl-shiftgo");
      if (go) {
        go.addEventListener("click", () => {
          shiftStage = 2;
          shiftDone = true;
          renderShift();
          draw();
          answer.focus();
        });
      }
      return;
    }

    shiftBar.innerHTML =
      '<span class="ldl-shift-done">\u2713 Both points moved ' +
      esc(places) +
      ":</span> " +
      "<b>" +
      esc(plan.dividendText) +
      " \u00f7 " +
      esc(plan.divisorText) +
      "</b> \u2192 " +
      '<b class="ldl-shift-new">' +
      esc(plan.workingDividendText) +
      " \u00f7 " +
      esc(plan.workingDivisorText) +
      "</b>" +
      " \u2014 now it is a whole-number divisor, so the cycle works exactly the same.";
  }

  // ── the notation grid ────────────────────────────────────────────────────
  function draw() {
    const { digits, cycles } = plan;
    const solving = mode === "solve";
    const n = digits.length;
    // BEFORE THE POINT IS MOVED, SHOW THE PROBLEM AS IT WAS WRITTEN. `plan`
    // carries the WORKING numbers — the ones after the shift — so the tableau
    // was drawing "6)37.8" for 3.78 ÷ 0.6 before the student had done anything,
    // with the move already made and greyed (Joel, 2026-08-26: "the changes are
    // already made (faded but made) … I want it to start with the original
    // decimal division and change as we make the changes").
    //
    // The digits themselves never move — only the point does — so the original
    // position is the working one minus the shift, and the divisor shows its
    // authored text until the move is made.
    // The two points move on their OWN steps now, so the tableau has to be able
    // to show one moved and the other not — that half-way picture is the whole
    // reason the step was split. Watch mode has no stages and moves both at once.
    const staged = solving && plan.shift > 0;
    const divisorMoved = staged ? shiftStage >= 1 : shiftDone;
    const dividendMoved = staged ? shiftStage >= 2 : shiftDone;
    const pointAt = dividendMoved ? plan.pointAt : plan.pointAt - plan.shift;
    const divisorText = divisorMoved ? plan.workingDivisorText : plan.divisorText;
    const hasPoint = pointAt < n;
    const colOf = (i) => 3 + i + (hasPoint && i >= pointAt ? 1 : 0);
    const done = progress();
    // Only solve mode shows "?" slots — watch mode never asks for anything.
    const step = solving ? plan.steps[stepIndex] || null : null;
    // Highlight the value watch mode has just written.
    const fresh = (type, ci) =>
      !solving && frame && frame.step && frame.step.type === type && frame.step.cycle === ci
        ? " ldl-fresh"
        : "";

    const tpl = ["auto", "0.55em"];
    for (let i = 0; i < n; i += 1) {
      if (hasPoint && i === pointAt) tpl.push("0.45em");
      tpl.push("1.55em");
    }
    const parts = [];
    const cell = (row, col, text, cls) =>
      parts.push(
        `<span class="${cls}" style="grid-row:${row};grid-column:${col}">${esc(text)}</span>`,
      );

    // Bracket, vinculum, divisor, dividend.
    cell(2, 1, divisorText, "ldl-divisor");
    cell(2, 2, ")", "ldl-bracket");
    parts.push(
      `<span class="ldl-vinculum" style="grid-row:1;grid-column:2 / ${colOf(n - 1) + 1}"></span>`,
    );
    for (let i = 0; i < n; i += 1) {
      const used = done.brought.has(i) || i <= (cycles[0] ? cycles[0].index : 0);
      cell(2, colOf(i), digits[i], `ldl-digit${used ? " ldl-used" : ""}`);
    }
    if (hasPoint) {
      cell(2, 3 + pointAt, ".", "ldl-point");
      cell(1, 3 + pointAt, ".", "ldl-point ldl-qpoint");
    }

    // Quotient digits that have been earned, and the slot for the next one.
    cycles.forEach((c, ci) => {
      if (done.divide.has(ci))
        cell(1, colOf(c.index), c.quotientDigit, `ldl-q${fresh("divide", ci)}`);
    });
    if (step && step.type === "divide" && shiftDone) {
      cell(1, colOf(step.index), "?", "ldl-slot");
    }

    // One product row + one difference row per cycle.
    cycles.forEach((c, ci) => {
      const prow = 3 + ci * 2;
      const drow = prow + 1;
      const prodStart = c.index - String(c.product).length + 1;
      const diffStart = c.index - String(c.difference).length + 1;
      if (done.multiply.has(ci)) {
        String(c.product)
          .split("")
          .forEach((ch, j) =>
            cell(
              prow,
              colOf(prodStart + j),
              ch,
              `ldl-prod${j === 0 ? " ldl-minus" : ""}${fresh("multiply", ci)}`,
            ),
          );
      } else if (step && step.type === "multiply" && step.cycle === ci) {
        cell(prow, colOf(c.index), "?", "ldl-slot ldl-minus");
      }
      if (done.subtract.has(ci)) {
        const from = colOf(Math.min(prodStart, diffStart));
        parts.push(
          `<span class="ldl-rule" style="grid-row:${prow};grid-column:${from} / ${colOf(c.index) + 1}"></span>`,
        );
        String(c.difference)
          .split("")
          .forEach((ch, j) =>
            cell(drow, colOf(diffStart + j), ch, `ldl-diff${fresh("subtract", ci)}`),
          );
      } else if (step && step.type === "subtract" && step.cycle === ci) {
        parts.push(
          `<span class="ldl-rule" style="grid-row:${prow};grid-column:${colOf(prodStart)} / ${colOf(c.index) + 1}"></span>`,
        );
        cell(drow, colOf(c.index), "?", "ldl-slot");
      }
      if (c.bringDown && done.bring.has(ci)) {
        cell(
          drow,
          colOf(c.bringDown.index),
          c.bringDown.digit,
          `ldl-brought${justBrought === ci ? " ldl-drop" : ""}`,
        );
      } else if (c.bringDown && step && step.type === "bringdown" && step.cycle === ci) {
        cell(drow, colOf(c.bringDown.index), "↓", "ldl-ghost");
      }
    });

    board.classList.toggle("is-waiting", !shiftDone);
    board.style.gridTemplateColumns = tpl.join(" ");
    board.innerHTML = parts.join("");
    board.setAttribute("aria-label", describe(done));
    // Watch mode lights the step it is narrating; before the point moves there
    // is no step yet, so the strip shows cycle 1 with nothing lit.
    drawStrip(solving ? step : frame && frame.step ? frame.step : shiftDone ? null : plan.steps[0]);
    if (solving) drawPrompt(step);
  }

  /** Which pieces of the board have been earned so far. */
  function progress() {
    const out = {
      divide: new Set(),
      multiply: new Set(),
      subtract: new Set(),
      bring: new Set(),
      brought: new Set(),
    };
    for (let i = 0; i < stepIndex; i += 1) {
      const s = plan.steps[i];
      if (s.type === "divide") out.divide.add(s.cycle);
      else if (s.type === "multiply") out.multiply.add(s.cycle);
      else if (s.type === "subtract") out.subtract.add(s.cycle);
      else {
        out.bring.add(s.cycle);
        out.brought.add(s.index + 1);
      }
    }
    return out;
  }

  /** A plain-text reading of the board, for screen readers. */
  function describe(done) {
    const written = plan.cycles
      .filter((_, ci) => done.divide.has(ci))
      .map((c) => c.quotientDigit)
      .join("");
    return (
      `Long division: ${plan.workingDividendText} divided by ${plan.workingDivisorText}. ` +
      (written
        ? `Quotient digits written so far: ${written.split("").join(" ")}.`
        : "No quotient digits written yet.")
    );
  }

  function drawStrip(step) {
    const total = plan.cycles.length;
    const cycleNo = step ? step.cycle + 1 : shiftDone ? total : 1;
    strip.innerHTML =
      `<span class="ldl-cycle">Cycle ${cycleNo} of ${total}</span>` +
      CYCLE_LABELS.map((name, i) => {
        const active = step && shiftDone && stepPosition(step.type) === i;
        const passed = step ? stepPosition(step.type) > i : shiftDone;
        // Letter badge + operator, matching the DMSB banner above the board:
        // the strip and the banner have to teach the same mnemonic, or the
        // student is tracking two different labels for one step.
        const badge = CYCLE_BADGES[i] || { letter: String(i + 1), op: "" };
        return (
          `<span class="ldl-pill${active ? " is-on" : ""}${passed ? " is-done" : ""}">` +
          `<b class="ldl-badge">${esc(badge.letter)}</b>` +
          `<span class="ldl-op-symbol" aria-hidden="true">${esc(badge.op)}</span>` +
          `<span class="ldl-pill-label">${esc(name)}</span></span>`
        );
      }).join("") +
      `<span class="ldl-loop" aria-hidden="true">↻ repeat</span>`;
  }

  function drawPrompt(step) {
    if (!shiftDone) {
      stepBox.textContent =
        shiftStage === 1
          ? "Now move the dividend the same number of places, then the cycle begins."
          : "First make the divisor a whole number, then the cycle begins.";
      entry.hidden = true;
      return;
    }
    if (!step) {
      entry.hidden = true;
      stepBox.innerHTML =
        `<b class="ldl-stepname">Cycle complete.</b> Every digit has been divided, so there is ` +
        `nothing left to bring down — the last difference is the remainder.`;
      finish();
      return;
    }
    entry.hidden = false;
    stepBox.innerHTML =
      `<b class="ldl-stepname">Step ${stepPosition(step.type) + 1} — ${esc(step.label.toUpperCase())}:</b> ` +
      `${esc(step.prompt)} <span class="ldl-note">${esc(STEP_NOTE[step.type])}</span>`;
    const bring = step.type === "bringdown";
    answer.hidden = bring;
    answerLabel.hidden = bring;
    checkBtn.hidden = bring;
    bringBtn.hidden = !bring;
    if (bring) {
      bringBtn.textContent = `Bring down the ${step.expected} ↓`;
    } else {
      answer.value = "";
      answerLabel.textContent = `${step.label} — your answer`;
      answer.setAttribute("aria-label", `${step.label}. ${step.prompt}`);
    }
  }

  // ── watch mode ───────────────────────────────────────────────────────────
  /** Paint the frame the cursor is sitting on. Never scrolls, never steals focus. */
  function showFrame() {
    if (!ready || !cursor) return;
    frame = cursor.frame();
    shiftDone = frame.shiftDone;
    shiftStage = shiftDone ? 2 : 0;
    stepIndex = frame.shown;
    justBrought = frame.step && frame.step.type === "bringdown" ? frame.step.cycle : -1;
    entry.hidden = true;
    renderShift();
    draw();
    stepBox.innerHTML =
      `<b class="ldl-stepname">${esc(frame.headline)}:</b> ${esc(frame.text)}` +
      (frame.cycleRestart ? ` <span class="ldl-repeat">↻ Cycle restarts.</span>` : "");
    countBox.textContent = `${cursor.index + 1} of ${cursor.length}`;
    if (frame.kind === "finish") {
      stopPlay();
      finish();
    } else {
      result.hidden = true;
      result.innerHTML = "";
    }
    // Move focus off a control that is about to go disabled, or it lands on
    // <body> mid-playback and the keyboard user loses their place. preventScroll
    // because watch mode must never yank the page under a reader.
    const active = document.activeElement;
    const losing =
      (active === backBtn && cursor.atStart()) || (active === nextBtn && cursor.atEnd());
    backBtn.disabled = cursor.atStart();
    nextBtn.disabled = cursor.atEnd();
    if (losing) replayBtn.focus({ preventScroll: true });
  }

  function stopPlay() {
    if (timer) clearInterval(timer);
    timer = 0;
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-pressed", "false");
  }

  function togglePlay() {
    if (timer) {
      stopPlay();
      return;
    }
    if (!cursor) return;
    if (cursor.atEnd()) cursor.reset();
    playBtn.textContent = "⏸ Pause";
    playBtn.setAttribute("aria-pressed", "true");
    showFrame();
    timer = setInterval(() => {
      if (!cursor || cursor.atEnd()) {
        stopPlay();
        return;
      }
      cursor.next();
      showFrame();
    }, PLAY_MS);
  }

  /** Flip between the two modes over the SAME problem. */
  function setMode(next, announce) {
    mode = next === "watch" ? "watch" : "solve";
    restart(announce);
    if (announce && ready) {
      say(
        mode === "watch"
          ? "Watch mode: press Next step, or Play to let it run."
          : "Your turn — same problem, and you write every number this time.",
        mode === "watch" ? "info" : "repeat",
      );
    }
  }

  // ── checking ─────────────────────────────────────────────────────────────
  function submit() {
    if (!ready || mode !== "solve") return;
    const step = plan.steps[stepIndex];
    if (!step || !shiftDone) return;
    if (step.type === "bringdown") {
      advance(step);
      return;
    }
    const raw = answer.value.replace(/,/g, "").trim();
    if (raw === "") {
      say("Type your answer for this step first.", "warn");
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      say("Enter a number.", "warn");
      return;
    }
    if (value === step.expected) {
      advance(step);
      return;
    }
    attempts += 1;
    say(diagnose(step, value), attempts >= 3 ? "warn" : "bad");
    if (attempts >= 3) {
      answer.value = String(step.expected);
      answer.select();
    }
  }

  /** Name the error, not just the answer. */
  function diagnose(step, value) {
    const c = plan.cycles[step.cycle];
    const v = plan.divisor;
    let why = "";
    if (step.type === "divide") {
      if (value * v > c.current) {
        why = `${value} × ${v} = ${value * v}, and that is bigger than ${c.current}. Choose a smaller digit. `;
      } else if (c.current - value * v >= v) {
        why = `${value} × ${v} = ${value * v}, which leaves ${c.current - value * v} — another ${v} still fits. Choose a bigger digit. `;
      } else if (value > 9 || value < 0) {
        why = "This step is one digit, 0 to 9. ";
      }
    } else if (step.type === "multiply") {
      if (value === c.quotientDigit + v)
        why = "That is what you get by ADDING. This step multiplies. ";
    } else if (step.type === "subtract") {
      if (value === c.current + c.product)
        why = "That is what you get by ADDING. This step subtracts. ";
      else if (value >= v)
        why = `A difference of ${value} is not smaller than the divisor ${v}, so something is off. `;
    }
    const tail =
      attempts >= 3
        ? `The answer is ${step.expected} — it is filled in for you. Read why, then press Check to place it.`
        : step.hint;
    return `Not yet. ${why}${tail}`;
  }

  function advance(step) {
    attempts = 0;
    justBrought = step.type === "bringdown" ? step.cycle : -1;
    stepIndex += 1;
    const next = plan.steps[stepIndex];
    draw();
    if (step.type === "bringdown") {
      say(
        `Cycle ${step.cycle + 1} complete — there are still digits to divide, so REPEAT the cycle: divide again.`,
        "repeat",
      );
    } else if (next) {
      say(`✓ ${step.label} done. Next: ${next.label}.`, "good");
    } else {
      say("✓ Every digit is divided — the division is finished.", "good");
    }
    if (next && next.type === "bringdown") bringBtn.focus();
    else if (next) answer.focus();
  }

  function say(text, tone) {
    feedback.className = `ldl-feedback ldl-${tone || "info"}`;
    feedback.textContent = text;
  }

  function finish() {
    const { quotientText, remainder, remainderText, checkText, workingDivisorText } = plan;
    const shown = plan.decimal
      ? `${esc(plan.dividendText)} ÷ ${esc(plan.divisorText)}`
      : `${esc(plan.workingDividendText)} ÷ ${esc(workingDivisorText)}`;
    const words = remainder
      ? `${shown} is <b>${esc(quotientText)}</b> with <b>${esc(remainderText)}</b> left over.`
      : `${shown} is exactly <b>${esc(quotientText)}</b> — nothing left over.`;
    const againLabel = mode === "watch" ? "Watch it again" : "Work it again";
    result.hidden = false;
    result.innerHTML =
      `<div class="ldl-final">${esc(plan.dividendText)} ÷ ${esc(plan.divisorText)} = ${esc(quotientText)}` +
      `${remainder && !plan.decimal ? ` R ${esc(remainderText)}` : ""}</div>` +
      `<p class="ldl-words">${words}</p>` +
      `<p class="ldl-verify"><b>Check by multiplying back:</b> ${esc(checkText)} ✓</p>` +
      (plan.decimal && remainder
        ? `<p class="ldl-words">It does not come out even, so this quotient is rounded down at that last place.</p>`
        : "") +
      `<button type="button" class="ldl-again">${esc(againLabel)}</button>`;
    const again = result.querySelector(".ldl-again");
    if (again) again.addEventListener("click", () => restart(true));
  }

  // ── wiring ───────────────────────────────────────────────────────────────
  checkBtn.addEventListener("click", submit);
  bringBtn.addEventListener("click", submit);
  answer.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });
  backBtn.addEventListener("click", () => {
    stopPlay();
    cursor?.back();
    showFrame();
  });
  nextBtn.addEventListener("click", () => {
    stopPlay();
    cursor?.next();
    showFrame();
  });
  playBtn.addEventListener("click", togglePlay);
  replayBtn.addEventListener("click", () => {
    stopPlay();
    cursor?.reset();
    showFrame();
  });
  mineBtn.addEventListener("click", () => setMode("solve", true));
  el(root, ".ldl-go").addEventListener("click", () =>
    load(inDividend.value, inDivisor.value, true),
  );
  for (const inp of [inDividend, inDivisor]) {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        load(inDividend.value, inDivisor.value, true);
      }
    });
  }
  const factToggle = el(root, ".ldl-fact-toggle");
  const factHelper = el(root, ".ldl-fact-helper");

  function renderFactHelper() {
    if (!plan || !plan.divisor) return;
    const d = plan.divisor;
    let html = `<strong style="font-weight:800;">Multiplication Facts for ${d}:</strong><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">`;
    for (let i = 1; i <= 9; i++) {
      const prod = d * i;
      html += `<button type="button" class="ldl-fact-chip" data-val="${prod}" style="padding:4px 8px; font-size:0.82rem; font-weight:700; color:#15803d; background:#ffffff; border:1px solid #86efac; border-radius:6px; cursor:pointer;">${d} × ${i} = ${prod}</button>`;
    }
    html += `</div>`;
    factHelper.innerHTML = html;
    factHelper.querySelectorAll(".ldl-fact-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const val = chip.getAttribute("data-val");
        if (val) {
          answer.value = val;
          answer.focus();
        }
      });
    });
  }

  if (factToggle) {
    factToggle.addEventListener("click", () => {
      const isHidden = factHelper.hidden;
      factHelper.hidden = !isHidden;
      if (isHidden) renderFactHelper();
    });
  }

  root.querySelectorAll(".ldl-key").forEach((keyBtn) => {
    keyBtn.addEventListener("click", () => {
      const k = keyBtn.getAttribute("data-key");
      if (k === "⌫") {
        answer.value = answer.value.slice(0, -1);
      } else if (k === "Clear") {
        answer.value = "";
      } else if (k) {
        answer.value += k;
      }
      answer.focus();
    });
  });

  for (const chip of root.querySelectorAll(".ldl-chip")) {
    chip.addEventListener("click", () => {
      const [a, b] = String(/** @type {HTMLElement} */ (chip).dataset.p).split("/");
      inDividend.value = a;
      inDivisor.value = b;
      load(a, b, true);
    });
  }

  load(cfg.dividend ?? (decimal ? 12.6 : 754), cfg.divisor ?? (decimal ? 4 : 6), false);
  inDividend.value = ready ? plan.dividendText : "";
  inDivisor.value = ready ? plan.divisorText : "";

  return {
    destroy: () => {
      stopPlay();
      root.remove();
    },
  };
}

/** @param {unknown} raw @param {boolean} decimal */
function normalisePresets(raw, decimal) {
  const list = Array.isArray(raw) ? raw.map(String).filter((p) => p.includes("/")) : [];
  if (list.length) return list;
  return decimal
    ? ["12.6/4", "45.6/8", "7.5/0.25", "9.66/2.1"]
    : ["754/6", "1344/12", "2408/8", "1680/24"];
}

export default renderLongDivisionBuilder;
