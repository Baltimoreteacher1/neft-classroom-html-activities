// step-workspace.js — the manipulable half of "Watch Me Solve It".
//
// A worked-example step tells a student what the teacher DID. This turns that
// sentence into something they can do themselves: drag the decimal point,
// change a number, work the answer out and check it. The same workspace is the
// teacher's board tool — every number is editable, so a demonstration can walk
// off the lesson's own numbers and back again without leaving the page.
//
// PROVENANCE. The workspace never invents mathematics. It is built from a move
// descriptor produced by `extractStepMove` (engine/core/learn-step-model.js),
// which only emits a move when the numbers come from that lesson's own line AND
// the arithmetic is true. A step whose sentence yields no move gets no
// workspace, and reads exactly as it does today.
//
// CHECKING IS LIVE, NOT PINNED. "Correct" is recomputed from whatever numbers
// are currently in the boxes, not compared against the lesson's stored answer.
// That is what lets a teacher change 3 × 63 into 4 × 63 mid-demonstration and
// still have Check mean something. "Back to the lesson's numbers" restores the
// authored move.

const isTouch = () => typeof window !== "undefined" && "PointerEvent" in window;

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/** Parse a displayed number the way the student typed it. */
function readNumber(text) {
  const cleaned = String(text ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Format a computed value without floating-point noise. */
function show(value) {
  if (value === null || !Number.isFinite(value)) return "";
  const rounded = Math.round(value * 1e9) / 1e9;
  return String(rounded);
}

function evaluate(values, ops) {
  const v = values.slice();
  const o = ops.slice();
  for (let i = 0; i < o.length; ) {
    if (o[i] === "×" || o[i] === "÷") {
      if (o[i] === "÷" && v[i + 1] === 0) return null;
      v.splice(i, 2, o[i] === "×" ? v[i] * v[i + 1] : v[i] / v[i + 1]);
      o.splice(i, 1);
    } else i++;
  }
  let acc = v[0];
  for (let i = 0; i < o.length; i++) acc = o[i] === "+" ? acc + v[i + 1] : acc - v[i + 1];
  return Number.isFinite(acc) ? acc : null;
}

/* ── Decimal-point workspace ─────────────────────────────────────────────────
   The digits stay put and the POINT moves, which is the move the algorithm
   actually makes — a student who retypes the number has not learned where the
   point goes. Draggable for the board, and arrow-key/button operable because a
   drag alone is unusable with a keyboard or a switch. */

function buildDecimalShift(host, move, t) {
  const digits = String(move.from).replace(/[^\d]/g, "");
  const startPlaces = (String(move.from).match(/\.(\d+)$/) || ["", ""])[1].length;
  const target = readNumber(move.to);

  const valueAt = (places) => {
    if (places <= 0) return Number(digits);
    if (places >= digits.length) return Number(`0.${digits.padStart(places, "0")}`);
    return Number(
      `${digits.slice(0, digits.length - places)}.${digits.slice(digits.length - places)}`,
    );
  };

  let places = startPlaces;

  const strip = el("div", "sw-strip");
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", t.stripLabel);

  const readout = el("output", "sw-readout");
  readout.setAttribute("aria-live", "polite");

  const status = el("p", "sw-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const render = () => {
    strip.innerHTML = "";
    for (let i = 0; i < digits.length; i++) {
      // The point sits BEFORE digit i when there are (digits.length - i) digits
      // to its right.
      if (digits.length - i === places && places > 0) strip.append(makePoint());
      const tile = el("span", "sw-digit", digits[i]);
      strip.append(tile);
    }
    if (places === 0) strip.append(makePoint(true));
    readout.value = show(valueAt(places));
    readout.textContent = show(valueAt(places));
  };

  function makePoint(trailing) {
    const point = el("button", `sw-point${trailing ? " sw-point-end" : ""}`, "•");
    point.type = "button";
    point.setAttribute(
      "aria-label",
      `${t.pointLabel} ${places} ${places === 1 ? t.placeOne : t.placeMany}`,
    );
    point.title = t.pointHint;
    point.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move1(+1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move1(-1);
      }
    });
    if (isTouch()) {
      point.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        point.setPointerCapture?.(e.pointerId);
        const startX = e.clientX;
        const startPlacesDrag = places;
        const tileWidth = strip.querySelector(".sw-digit")?.getBoundingClientRect().width || 28;
        const onMove = (ev) => {
          const delta = Math.round((startX - ev.clientX) / tileWidth);
          const next = Math.max(0, Math.min(digits.length, startPlacesDrag + delta));
          if (next !== places) {
            places = next;
            render();
            strip.querySelector(".sw-point")?.focus();
          }
        };
        const onUp = () => {
          point.removeEventListener("pointermove", onMove);
          point.removeEventListener("pointerup", onUp);
          announce();
        };
        point.addEventListener("pointermove", onMove);
        point.addEventListener("pointerup", onUp);
      });
    }
    return point;
  }

  const move1 = (delta) => {
    places = Math.max(0, Math.min(digits.length, places + delta));
    render();
    strip.querySelector(".sw-point")?.focus();
    announce();
  };

  const announce = () => {
    status.textContent = "";
    status.classList.remove("sw-ok", "sw-try");
  };

  const controls = el("div", "sw-controls");
  const left = el("button", "sw-btn", `◀ ${t.moveLeft}`);
  left.type = "button";
  left.addEventListener("click", () => move1(+1));
  const right = el("button", "sw-btn", `${t.moveRight} ▶`);
  right.type = "button";
  right.addEventListener("click", () => move1(-1));
  const check = el("button", "sw-btn sw-btn-primary", t.check);
  check.type = "button";
  check.addEventListener("click", () => {
    const value = valueAt(places);
    const correct = target !== null && Math.abs(value - target) < 1e-9;
    status.textContent = correct ? `${t.correct} ${show(value)}` : `${t.notYet} ${show(value)}`;
    status.classList.toggle("sw-ok", correct);
    status.classList.toggle("sw-try", !correct);
  });
  const reset = el("button", "sw-btn sw-btn-quiet", t.reset);
  reset.type = "button";
  reset.addEventListener("click", () => {
    places = startPlaces;
    render();
    announce();
  });
  controls.append(left, right, check, reset);

  const lead = el("p", "sw-lead", `${t.dragThePoint} <strong>${move.to}</strong>`);
  const board = el("div", "sw-board");
  board.append(strip, el("span", "sw-eq-sign", "="), readout);
  host.append(lead, board, controls, status);
  render();
}

/* ── Arithmetic workspace ────────────────────────────────────────────────────
   Every operand is an editable box and the answer is blank. Changing an operand
   changes what "correct" means, so this is a board tool as much as an exercise. */

function buildArithmetic(host, move, t) {
  const board = el("div", "sw-board sw-board-eq");
  const inputs = [];

  const makeNumberBox = (value, label, extraClass) => {
    const input = el("input", `sw-num ${extraClass || ""}`);
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = value;
    input.size = Math.max(2, String(value).length + 1);
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => {
      input.size = Math.max(2, input.value.length + 1);
      clearStatus();
    });
    return input;
  };

  move.operands.forEach((operand, i) => {
    if (i > 0) board.append(el("span", "sw-op", move.ops[i - 1]));
    const box = makeNumberBox(operand, `${t.number} ${i + 1}`);
    inputs.push(box);
    board.append(box);
  });
  board.append(el("span", "sw-eq-sign", "="));
  const answer = makeNumberBox("", t.answerLabel, "sw-answer");
  answer.placeholder = "?";
  board.append(answer);

  const status = el("p", "sw-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const clearStatus = () => {
    status.textContent = "";
    status.classList.remove("sw-ok", "sw-try");
  };

  const expected = () => {
    const values = inputs.map((i) => readNumber(i.value));
    if (values.some((v) => v === null)) return null;
    return evaluate(values, move.ops);
  };

  const controls = el("div", "sw-controls");
  const check = el("button", "sw-btn sw-btn-primary", t.check);
  check.type = "button";
  check.addEventListener("click", () => {
    const want = expected();
    const got = readNumber(answer.value);
    if (want === null) {
      status.textContent = t.needNumbers;
      status.classList.add("sw-try");
      return;
    }
    if (got === null) {
      status.textContent = t.typeAnswer;
      status.classList.add("sw-try");
      return;
    }
    const correct = Math.abs(got - want) < 1e-9;
    status.textContent = correct ? t.correctPlain : t.notYetPlain;
    status.classList.toggle("sw-ok", correct);
    status.classList.toggle("sw-try", !correct);
  });
  const showBtn = el("button", "sw-btn sw-btn-quiet", t.showAnswer);
  showBtn.type = "button";
  showBtn.addEventListener("click", () => {
    const want = expected();
    if (want === null) return;
    answer.value = show(want);
    answer.size = Math.max(2, answer.value.length + 1);
    status.textContent = t.thatIsIt;
    status.classList.add("sw-ok");
  });
  const reset = el("button", "sw-btn sw-btn-quiet", t.backToLesson);
  reset.type = "button";
  reset.addEventListener("click", () => {
    inputs.forEach((input, i) => {
      input.value = move.operands[i];
      input.size = Math.max(2, input.value.length + 1);
    });
    answer.value = "";
    answer.size = 3;
    clearStatus();
  });
  controls.append(check, showBtn, reset);

  host.append(el("p", "sw-lead", t.workItOut), board, controls, status);
}

const STRINGS = {
  en: {
    title: "Try this move",
    stripLabel: "The number, digit by digit",
    pointLabel: "Decimal point, currently",
    placeOne: "place from the right",
    placeMany: "places from the right",
    pointHint: "Drag me, or use the arrow keys",
    dragThePoint: "Move the decimal point until the number reads",
    moveLeft: "Left",
    moveRight: "Right",
    check: "Check",
    reset: "Start over",
    correct: "Yes — that reads",
    notYet: "Not yet — that reads",
    correctPlain: "Yes, that is it.",
    notYetPlain: "Not yet — try again.",
    number: "Number",
    answerLabel: "Your answer",
    workItOut: "Work it out. Change any number to try your own.",
    needNumbers: "Put a number in every box first.",
    typeAnswer: "Type your answer in the last box.",
    showAnswer: "Show me",
    thatIsIt: "That is it.",
    backToLesson: "Back to the lesson's numbers",
  },
  es: {
    title: "Prueba este paso",
    stripLabel: "El número, dígito por dígito",
    pointLabel: "Punto decimal, actualmente",
    placeOne: "lugar desde la derecha",
    placeMany: "lugares desde la derecha",
    pointHint: "Arrástrame o usa las flechas",
    dragThePoint: "Mueve el punto decimal hasta que el número sea",
    moveLeft: "Izquierda",
    moveRight: "Derecha",
    check: "Revisar",
    reset: "Empezar de nuevo",
    correct: "Sí — eso dice",
    notYet: "Todavía no — eso dice",
    correctPlain: "Sí, así es.",
    notYetPlain: "Todavía no — inténtalo otra vez.",
    number: "Número",
    answerLabel: "Tu respuesta",
    workItOut: "Resuélvelo. Cambia cualquier número para probar el tuyo.",
    needNumbers: "Pon un número en cada casilla primero.",
    typeAnswer: "Escribe tu respuesta en la última casilla.",
    showAnswer: "Muéstrame",
    thatIsIt: "Así es.",
    backToLesson: "Volver a los números de la lección",
  },
};

/**
 * Mount the workspace for one move inside `host`.
 *
 * @param {HTMLElement} host
 * @param {{kind:string}&Record<string,any>} move  from extractStepMove()
 * @param {{lang?:string}} [opts]
 * @returns {boolean} whether anything was mounted
 */
export function mountStepWorkspace(host, move, opts = {}) {
  if (!host || !move) return false;
  const t = STRINGS[opts.lang === "es" ? "es" : "en"];
  const shell = el("div", "sw-shell");
  shell.dataset.moveKind = move.kind;
  shell.append(el("div", "sw-head", `🖐️ ${t.title}`));
  const body = el("div", "sw-body");
  shell.append(body);
  try {
    if (move.kind === "decimal-shift") buildDecimalShift(body, move, t);
    else if (move.kind === "arithmetic") buildArithmetic(body, move, t);
    else return false;
  } catch (_error) {
    // A workspace that throws must never take the worked example down with it —
    // the step's own words are the lesson, and this is an addition to them.
    return false;
  }
  host.append(shell);
  return true;
}
