// The step lens: makes every worked explanation something to point at.
// Numbers and moves inside a step become highlighted, tappable chips. A number says where it came from (the problem,
// or an earlier step), tapping one lights the same number in the problem, the picture and every other step, a move
// (+ − × ÷ =) says what it means, a path of dots jumps between steps, and "Moves" / "Numbers" dim the other kind so a
// learner can read just what is being DONE or just what it is being done WITH. Nothing here computes or reveals a
// result: it only decorates text a step surface has already shown, so the answer-free rules (peekCap, "Your turn"
// boxes) are untouched. It never rewrites text, so every surface that reads step textContent keeps working.
import { t } from "./i18n.js";
import { readLocal, writeLocal } from "./school-tools.js";
import { VERBS as VERB_LIST, moveChoices } from "./step-moves.js";

const MODE_KEY = "ewl-fluency-lens-v1";
const PREDICT_KEY = "ewl-fluency-lens-predict-v1";
const MODES = ["all", "numbers", "moves"];
const VERBS = VERB_LIST.join("|");
// Each meaning is a literal t() call so the Spanish coverage test can see it.
const SUBTRACT = () => t("subtract: take an amount away, or find how far apart two numbers are.");
const OP_NAMES = {
  "+": () => t("add: put amounts together."),
  "−": SUBTRACT,
  "-": SUBTRACT,
  "×": () => t("multiply: combine equal groups."),
  "÷": () => t("divide: share equally, or make equal groups."),
  "=": () => t("equals: both sides have the same value."),
  "<": () => t("is less than."),
  ">": () => t("is greater than."),
  "≤": () => t("is less than or equal to."),
  "≥": () => t("is greater than or equal to."),
};
// A number is a quantity: digits right after "^" are an exponent, and a run like "1, 2, 3, 4" is a list of facts.
const LIST_RUN = /(\d+(?:\.\d+)?(?:,\s+\d+(?:\.\d+)?){2,})/;
const TOKEN = new RegExp(
  `(?<num>(?<!\\^-?)\\d+(?:,\\d{3})*(?:\\.\\d+)?)|(?<op>[+−×÷=<>≤≥]|(?<=\\s)-(?=\\s))|(?<act>(?<=^|[.:;!?]\\s+|\\b(?:then|now|next|first|so)\\s+)(?:${VERBS})\\b)`,
  "gi",
);
// Written out so each move name is a literal t() call the Spanish coverage test can see.
const MOVE_LABELS = {
  "Split": () => t("Split"),
  "Add": () => t("Add"),
  "Subtract": () => t("Subtract"),
  "Multiply": () => t("Multiply"),
  "Divide": () => t("Divide"),
  "Regroup": () => t("Regroup"),
  "Trade": () => t("Trade"),
  "Round": () => t("Round"),
  "Compare": () => t("Compare"),
  "Count": () => t("Count"),
  "Carry": () => t("Carry"),
  "Borrow": () => t("Borrow"),
  "Break": () => t("Break"),
  "Rename": () => t("Rename"),
  "Simplify": () => t("Simplify"),
  "Convert": () => t("Convert"),
  "Combine": () => t("Combine"),
  "Line up": () => t("Line up"),
  "Find": () => t("Find"),
  "Make": () => t("Make"),
  "Take away": () => t("Take away"),
  "Share": () => t("Share"),
  "Skip count": () => t("Skip count"),
  "Double": () => t("Double"),
  "Halve": () => t("Halve"),
  "Cross out": () => t("Cross out"),
  "Flip": () => t("Flip"),
  "Cancel": () => t("Cancel"),
  "Check": () => t("Check"),
};
const moveLabel = (move) => MOVE_LABELS[move]?.() ?? move;
const PICTURE_LEAF = "b, em, small, span, i, td, th, text, tspan";

const SURFACES = [
  {
    list: "[data-learn-steps] .tr-steps",
    line: ".tr-step-text",
    root: (list) => list.closest(".learn-simple"),
    problem: (root) => root.querySelector(".tr-example-fact"),
    live: (root) => root.querySelector(".tp-live"),
  },
  {
    list: "#guided-steps",
    line: ".guided-step-text, .tr-step-text",
    root: () => document,
    problem: (root) => root.querySelector("#question"),
    live: (root) => root.querySelector("#problem-visual-scaffold .tp-live"),
  },
  {
    list: ".step-player .tr-steps",
    line: ".tr-step-text",
    root: (list) => list.closest(".step-player"),
    problem: (root) => root.querySelector(".sp-q"),
    live: () => null,
  },
];

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const keyOf = (text) => String(text).replaceAll(",", "").replace(/\s+/g, " ").trim();
const hostOf = (list) => list.closest("[data-learn-steps], [data-sp-steps]") || list;
const reducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

/** Splits plain text into number, move (operator), action-word and plain pieces. A list of facts stays plain. */
export function tokenize(text) {
  const pieces = [];
  String(text)
    .split(LIST_RUN)
    .forEach((chunk, c) => {
      if (c % 2) return void pieces.push({ type: "text", text: chunk });
      let at = 0;
      for (const match of chunk.matchAll(TOKEN)) {
        if (match.index > at) pieces.push({ type: "text", text: chunk.slice(at, match.index) });
        const type = match.groups.num ? "num" : match.groups.op ? "op" : "act";
        pieces.push({ type, text: match[0] });
        at = match.index + match[0].length;
      }
      if (at < chunk.length) pieces.push({ type: "text", text: chunk.slice(at) });
    });
  return pieces.filter((piece) => piece.text !== "");
}

/** Where a number in step `index` came from: the problem, an earlier step (its 1-based number), or this step. */
export function provenance(value, index, problemKeys, lines) {
  if (problemKeys.has(value)) return { kind: "problem" };
  for (let i = 0; i < index; i += 1)
    if (tokenize(lines[i]).some((piece) => piece.type === "num" && keyOf(piece.text) === value))
      return { kind: "step", step: i + 1 };
  return { kind: "new" };
}

const sourceLabel = (source) =>
  source.kind === "problem"
    ? t("from the problem")
    : source.kind === "step"
      ? t("made in step {n}", { n: source.step })
      : t("a new number");

function chipFor(doc, piece, { source, forId }) {
  const chip = doc.createElement("span");
  chip.textContent = piece.text;
  chip.tabIndex = -1;
  chip.setAttribute("role", "button");
  chip.dataset.lensFor = forId;
  if (piece.type === "num") {
    const value = keyOf(piece.text);
    chip.className = `lens-n ${source.kind === "problem" ? "lens-given" : "lens-made"}`;
    chip.dataset.v = value;
    chip.dataset.src = source.kind;
    if (source.step) chip.dataset.from = String(source.step);
    chip.setAttribute("aria-label", `${piece.text}, ${sourceLabel(source)}`);
  } else {
    chip.className = "lens-op";
    chip.dataset.op = piece.text;
    chip.setAttribute("aria-label", `${piece.text}, ${t("a move")}`);
  }
  return chip;
}

// Wraps every undecorated number, move and action word under `element`. Already-wrapped text is skipped, so a
// second pass over the same element changes nothing (the observer in `initStepLens` relies on that).
function decorate(element, { forId, sourceFor, moves = true }) {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, 4);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (
      !parent ||
      parent.closest(
        "input, button, sup, .lens-n, .lens-op, .lens-act, .tr-step-badge, .guided-step-badge, .tr-fill-note, .step-audio-btn",
      )
    )
      continue;
    const pieces = tokenize(node.nodeValue);
    if (
      pieces.every(
        (piece) =>
          piece.type === "text" ||
          (piece.type === "op" && !moves) ||
          (piece.type === "act" && !moves),
      )
    )
      continue;
    const fragment = doc.createDocumentFragment();
    for (const piece of pieces) {
      if (piece.type === "text" || (!moves && piece.type !== "num")) fragment.append(piece.text);
      else if (piece.type === "act") {
        const act = doc.createElement("span");
        act.className = "lens-act";
        act.textContent = piece.text;
        fragment.append(act);
      } else
        fragment.append(
          chipFor(doc, piece, {
            source: piece.type === "num" ? sourceFor(keyOf(piece.text)) : null,
            forId,
          }),
        );
    }
    node.replaceWith(fragment);
  }
}

const stepLine = (li, selector) => {
  const line = li.querySelector(selector);
  if (!line) return "";
  const copy = line.cloneNode(true);
  copy
    .querySelectorAll(".tr-step-badge, .guided-step-badge, button, input, .tr-fill-note")
    .forEach((node) => node.remove());
  return keyOf(copy.textContent).replace(/^Your turn:\s*/, "");
};

const contexts = new Map();
let counter = 0;
const timers = new Map();

function problemKeys(problem) {
  const keys = new Set();
  if (!problem) return keys;
  for (const span of problem.querySelectorAll(".sp-num"))
    keys.add(keyOf(span.dataset.n || span.textContent));
  for (const piece of tokenize(problem.textContent))
    if (piece.type === "num") keys.add(keyOf(piece.text));
  return keys;
}

// The problem line's own numbers become the "from the problem" chips the steps point back to.
function decorateProblem(problem, forId) {
  if (!problem) return;
  for (const span of problem.querySelectorAll(".sp-num:not(.lens-n)")) {
    span.classList.add("lens-n", "lens-given");
    Object.assign(span.dataset, {
      v: keyOf(span.dataset.n || span.textContent),
      src: "problem",
      lensFor: forId,
    });
    span.tabIndex = -1;
    span.setAttribute("role", "button");
    span.setAttribute("aria-label", `${span.textContent}, ${t("from the problem")}`);
  }
  if (!problem.querySelector(".sp-num"))
    decorate(problem, { forId, sourceFor: () => ({ kind: "problem" }), moves: false });
}

function kitHtml(id) {
  const modeButtons = MODES.map(
    (mode) =>
      `<button type="button" class="lens-mode" data-lens-mode="${mode}" aria-pressed="false">${esc(
        mode === "all" ? t("All") : mode === "numbers" ? t("Numbers") : t("Moves"),
      )}</button>`,
  ).join("");
  return `<div class="lens-kit" data-lens-kit="${id}">
    <div class="lens-row">
      <span class="lens-label">${esc(t("Show me"))}</span>
      <span class="lens-modes" role="group" aria-label="${esc(t("What to highlight"))}">${modeButtons}</span>
      <button type="button" class="lens-predict-toggle" data-lens-predict aria-pressed="false">${esc(t("Predict the next move"))}</button>
      <button type="button" class="lens-play" data-lens-play hidden>${esc(t("Play the steps"))}</button>
    </div>
    <div class="lens-predict" data-lens-card hidden></div>
    <ol class="lens-path" data-lens-path aria-label="${esc(t("Steps so far"))}" hidden></ol>
    <p class="lens-legend" aria-hidden="true"><span class="lens-key lens-given">${esc(t("From the problem"))}</span><span class="lens-key lens-made">${esc(t("Made along the way"))}</span><span class="lens-key lens-op">${esc(t("A move"))}</span></p>
    <p class="lens-note" data-lens-note role="status" aria-live="polite">${esc(t("Tap a highlighted number or move to see where it comes from."))}</p>
  </div>`;
}

function ensureKit(host, id) {
  if (host.previousElementSibling?.matches(".lens-kit")) return host.previousElementSibling;
  host.insertAdjacentHTML("beforebegin", kitHtml(id));
  return host.previousElementSibling;
}

const chipsIn = (ctx) => [
  ...ctx.scope.querySelectorAll(
    `.lens-n[data-lens-for="${ctx.id}"], .lens-op[data-lens-for="${ctx.id}"]`,
  ),
];

function setMode(ctx, mode) {
  const next = MODES.includes(mode) ? mode : "all";
  ctx.host.dataset.lensView = next;
  for (const button of ctx.kit.querySelectorAll("[data-lens-mode]"))
    button.setAttribute("aria-pressed", String(button.dataset.lensMode === next));
}

// The picture is a target only: matching numbers light up where it prints them, and nothing in it is rewritten.
function pictureNodes(ctx, value) {
  const live = ctx.surface.live(ctx.surface.root(ctx.list));
  if (!live) return [];
  return [...live.querySelectorAll(PICTURE_LEAF)].filter(
    (node) =>
      !node.children.length &&
      !node.closest(".tp-prompt, input, button") &&
      keyOf(node.textContent) === value,
  );
}

function clearMarks(ctx, className) {
  for (const node of chipsIn(ctx)) node.classList.remove(className);
  const live = ctx.surface.live(ctx.surface.root(ctx.list));
  live?.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
}

function mark(ctx, chip, className) {
  clearMarks(ctx, className);
  if (!chip) return;
  if (chip.dataset.v) {
    for (const other of chipsIn(ctx))
      if (other.dataset.v === chip.dataset.v) other.classList.add(className);
    for (const node of pictureNodes(ctx, chip.dataset.v)) node.classList.add(className);
  } else
    for (const other of chipsIn(ctx))
      if (other.dataset.op === chip.dataset.op) other.classList.add(className);
}

function say(ctx, html) {
  const note = ctx.kit.querySelector("[data-lens-note]");
  if (note) note.innerHTML = html;
}

function explain(ctx, chip) {
  const steps = [...ctx.list.querySelectorAll(":scope > li")];
  if (chip.dataset.op) {
    const meaning = OP_NAMES[chip.dataset.op];
    return say(
      ctx,
      `<b class="lens-op">${esc(chip.textContent)}</b> ${esc(t("means {meaning}", { meaning: meaning() }))}`,
    );
  }
  const value = chip.dataset.v;
  const origin = Number(chip.dataset.from) || 0;
  // The other steps that print this same number, not counting the step the chip sits in or the one that made it.
  const here = steps.indexOf(chip.closest("li")) + 1;
  const usedIn = [
    ...new Set(
      chipsIn(ctx)
        .filter((other) => other.dataset.v === value && other.closest("li"))
        .map((other) => steps.indexOf(other.closest("li")) + 1),
    ),
  ].filter((n) => n > 0 && n !== origin && n !== here);
  const where =
    chip.dataset.src === "problem"
      ? t("is in the problem.")
      : chip.dataset.src === "step"
        ? t("was made in step {k}.", { k: origin })
        : t("is new. This step made it.");
  const used = usedIn.length
    ? ` ${t("It is used in steps: {list}.", { list: usedIn.join(", ") })}`
    : "";
  const go =
    chip.dataset.src === "step"
      ? ` <button type="button" class="lens-go" data-lens-go="${origin - 1}">${esc(t("Go to step {n}", { n: origin }))}</button>`
      : "";
  say(
    ctx,
    `<b class="lens-n ${chip.dataset.src === "problem" ? "lens-given" : "lens-made"}">${esc(chip.textContent)}</b> ${esc(where + used)}${go}`,
  );
}

function setActive(ctx, index) {
  const steps = [...ctx.list.querySelectorAll(":scope > li")];
  const target = steps[Math.max(0, Math.min(index, steps.length - 1))];
  if (!target) return;
  ctx.kit.dataset.active = String(steps.indexOf(target));
  target.click(); // the same tap a learner makes: the step player and the picture follow it
  renderPath(ctx);
}

function renderPath(ctx) {
  const steps = [...ctx.list.querySelectorAll(":scope > li")];
  const path = ctx.kit.querySelector("[data-lens-path]");
  const play = ctx.kit.querySelector("[data-lens-play]");
  if (Number(ctx.kit.dataset.count) !== steps.length) {
    ctx.kit.dataset.count = String(steps.length);
    ctx.kit.dataset.active = String(steps.length - 1);
  }
  const active = Math.min(Number(ctx.kit.dataset.active ?? steps.length - 1), steps.length - 1);
  const signature = `${steps.length}|${active}`;
  const show = steps.length > 1;
  path.hidden = !show;
  play.hidden = !show || reducedMotion();
  if (path.dataset.sig === signature) return;
  path.dataset.sig = signature;
  path.innerHTML = steps
    .map(
      (_, i) =>
        `<li><button type="button" class="lens-dot${i === active ? " is-active" : ""}${i < active ? " is-done" : ""}" data-lens-go="${i}" aria-label="${esc(t("Step {n}", { n: i + 1 }))}"${i === active ? ' aria-current="step"' : ""}>${i + 1}</button></li>`,
    )
    .join("");
}

function refresh(surface, list) {
  const root = surface.root(list);
  if (!root) return;
  const host = hostOf(list);
  host.dataset.lensId ||= `lens-${++counter}`;
  const id = host.dataset.lensId;
  const kit = ensureKit(host, id);
  const steps = [...list.querySelectorAll(":scope > li")];
  if (!steps.length) return;
  const problem = surface.problem(root);
  const keys = problemKeys(problem);
  const lines = steps.map((li) => stepLine(li, surface.line));
  // One object per list for its whole life: a pending prediction and the pinned number live on it.
  const ctx = Object.assign(contexts.get(id) || {}, { id, surface, list, host, kit, scope: root });
  contexts.set(id, ctx);
  decorateProblem(problem, id);
  steps.forEach((li, i) => {
    for (const line of li.querySelectorAll(surface.line))
      decorate(line, { forId: id, sourceFor: (value) => provenance(value, i, keys, lines) });
  });
  if (!host.dataset.lensView) {
    setMode(ctx, readLocal(MODE_KEY, "all"));
    setPredict(ctx, readLocal(PREDICT_KEY, false) === true);
  }
  renderPath(ctx);
  // One chip per list is a tab stop; arrow keys walk the rest.
  const chips = chipsIn(ctx);
  const stop =
    steps[Math.min(Number(kit.dataset.active ?? steps.length - 1), steps.length - 1)].querySelector(
      ".lens-n, .lens-op",
    ) || chips[0];
  for (const chip of chips) chip.tabIndex = chip === stop ? 0 : -1;
}

function stop(ctx) {
  clearTimeout(timers.get(ctx.id));
  timers.delete(ctx.id);
  const play = ctx.kit.querySelector("[data-lens-play]");
  if (play) play.textContent = t("Play the steps");
}

function play(ctx) {
  if (timers.has(ctx.id)) return stop(ctx);
  const button = ctx.kit.querySelector("[data-lens-play]");
  button.textContent = t("Stop");
  let at = 0;
  const tick = () => {
    const steps = ctx.list.querySelectorAll(":scope > li");
    if (!ctx.kit.isConnected || at >= steps.length) return stop(ctx);
    setActive(ctx, at);
    at += 1;
    timers.set(ctx.id, setTimeout(tick, 1700));
  };
  tick();
}

const contextFor = (element) =>
  contexts.get(
    element.closest("[data-lens-kit]")?.dataset.lensKit ||
      element.closest("[data-lens-for]")?.dataset.lensFor,
  );

// Predict the next move: with the toggle on, "Next step" first asks which move comes next. Only the move's NAME is
// stamped on the button (data-next-move), so the card never shows the next step's numbers or result. A wrong guess
// costs nothing and is not recorded: the step opens either way and the card says what the move was.
const predicting = (ctx) => ctx.kit.querySelector("[data-lens-predict]")?.getAttribute("aria-pressed") === "true";

function setPredict(ctx, on) {
  ctx.kit.querySelector("[data-lens-predict]")?.setAttribute("aria-pressed", String(on));
  if (!on) ctx.kit.querySelector("[data-lens-card]").hidden = true;
}

const ctxOfNext = (next) =>
  contexts.get((next.closest("[data-learn-steps], [data-sp-steps]") || document.querySelector("#guided-steps"))?.dataset.lensId);

function onNext(event) {
  const next = event.target.closest?.("button.tr-step-next, #guided-next-step");
  if (!next) return;
  if (next.dataset.lensPassed) return void delete next.dataset.lensPassed;
  const ctx = ctxOfNext(next);
  const move = next.dataset.nextMove;
  if (!ctx || !move || next.disabled || !predicting(ctx)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const seed = ctx.list.querySelectorAll(":scope > li").length;
  const card = ctx.kit.querySelector("[data-lens-card]");
  ctx.pending = { next, move };
  card.hidden = false;
  card.innerHTML = `<p class="lens-ask" id="${ctx.id}-ask">${esc(t("What will the next step do?"))}</p>
    <div class="lens-picks" role="group" aria-labelledby="${ctx.id}-ask">${moveChoices(move, seed)
      .map((choice) => `<button type="button" class="lens-pick" data-lens-pick="${esc(choice)}">${esc(moveLabel(choice))}</button>`)
      .join("")}</div>`;
  card.querySelector("button")?.focus();
}

function onPick(pick) {
  const ctx = contextFor(pick);
  if (!ctx?.pending) return;
  const { next, move } = ctx.pending;
  ctx.pending = null;
  const right = pick.dataset.lensPick === move;
  ctx.kit.querySelector("[data-lens-card]").innerHTML = `<p class="lens-result ${right ? "is-right" : "is-near"}" role="status">${esc(
    right ? t("Yes. The next step is to {move}.", { move: moveLabel(move) }) : t("Not this time. The next step is to {move}.", { move: moveLabel(move) }),
  )}</p>`;
  next.dataset.lensPassed = "1";
  next.click();
}

function onClick(event) {
  const target = event.target;
  const mode = target.closest?.("[data-lens-mode]");
  if (mode) {
    const ctx = contextFor(mode);
    if (!ctx) return;
    setMode(ctx, mode.dataset.lensMode);
    writeLocal(MODE_KEY, mode.dataset.lensMode);
    return;
  }
  const pick = target.closest?.("[data-lens-pick]");
  if (pick) return onPick(pick);
  const toggle = target.closest?.("[data-lens-predict]");
  if (toggle) {
    const ctx = contextFor(toggle);
    if (ctx) {
      const on = toggle.getAttribute("aria-pressed") !== "true";
      setPredict(ctx, on);
      writeLocal(PREDICT_KEY, on);
    }
    return;
  }
  const go = target.closest?.("[data-lens-go]");
  if (go) {
    const ctx = contextFor(go);
    if (ctx) {
      stop(ctx);
      setActive(ctx, Number(go.dataset.lensGo));
    }
    return;
  }
  const playButton = target.closest?.("[data-lens-play]");
  if (playButton) {
    const ctx = contextFor(playButton);
    if (ctx) play(ctx);
    return;
  }
  const chip = target.closest?.(".lens-n[data-lens-for], .lens-op[data-lens-for]");
  const ctx = chip && contextFor(chip);
  if (ctx) {
    const same =
      chip.classList.contains("lens-point") &&
      ctx.pointed === chip.dataset.v + (chip.dataset.op || "");
    mark(ctx, same ? null : chip, "lens-point");
    ctx.pointed = same ? "" : chip.dataset.v + (chip.dataset.op || "");
    if (same) say(ctx, esc(t("Tap a highlighted number or move to see where it comes from.")));
    else explain(ctx, chip);
    return;
  }
  // Tapping a step by hand moves the path with it.
  const li = target.closest?.(".tr-steps > li, #guided-steps > li");
  if (li && !target.closest("input, button, a")) {
    const list = li.parentElement;
    const ctx = [...contexts.values()].find((entry) => entry.list === list);
    if (ctx) {
      stop(ctx);
      ctx.kit.dataset.active = String([...list.children].indexOf(li));
      renderPath(ctx);
    }
  }
}

function onKey(event) {
  const chip = event.target.closest?.(".lens-n[data-lens-for], .lens-op[data-lens-for]");
  if (!chip) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    chip.click();
    return;
  }
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const ctx = contextFor(chip);
  if (!ctx) return;
  const chips = chipsIn(ctx);
  const next = chips[chips.indexOf(chip) + (event.key === "ArrowRight" ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  for (const other of chips) other.tabIndex = other === next ? 0 : -1;
  next.focus();
}

function onHover(event, on) {
  const chip = event.target.closest?.(".lens-n[data-lens-for], .lens-op[data-lens-for]");
  const ctx = chip && contextFor(chip);
  if (ctx) mark(ctx, on ? chip : null, "lens-hover");
}

/** Runs the lens over every step surface now. Safe to call repeatedly: a second pass changes nothing. */
export function sync() {
  for (const surface of SURFACES)
    for (const list of document.querySelectorAll(surface.list)) refresh(surface, list);
}

let observer = null;
let frame = 0;

export function initStepLens() {
  if (observer || typeof MutationObserver === "undefined") return;
  const run = () => {
    frame = 0;
    observer.disconnect();
    try {
      sync();
    } finally {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
  observer = new MutationObserver(() => {
    if (!frame) frame = setTimeout(run, 16);
  });
  document.addEventListener("click", onNext, true);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("pointerover", (event) => onHover(event, true));
  document.addEventListener("pointerout", (event) => onHover(event, false));
  document.addEventListener("focusin", (event) => onHover(event, true));
  document.addEventListener("focusout", (event) => onHover(event, false));
  observer.observe(document.body, { childList: true, subtree: true });
  frame = setTimeout(run, 16);
}
