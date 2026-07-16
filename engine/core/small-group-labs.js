// small-group-labs.js — the interactive math core of the small-group studio.
// Three render-time sections derived entirely from existing lesson config
// (zero new authoring): the hands-on Explore Lab (real manipulatives), the
// Model Lab (connect-phase diagram + interpretation), and the Apply Lab
// (Polya-style word-problem workbench). Manipulative components are lazily
// imported so lessons only pay for the one they use.

import { interactiveVisualHost, mountInteractiveVisuals } from "./interactive-visual.js";
import { celebrate, el, esc, sectionHeading, speak } from "./small-group-ui.js";
import {
  barChartSVG,
  boxPlotSVG,
  coordPlaneSVG,
  dotPlotSVG,
  factorTreeSVG,
  histogramSVG,
  numberLineSVG,
  tapeDiagramSVG,
} from "./visual-figures.js";

const FIGURES = {
  histogram: histogramSVG,
  "dot-plot": dotPlotSVG,
  "box-plot": boxPlotSVG,
  "bar-chart": barChartSVG,
  "number-line": numberLineSVG,
  "tape-diagram": tapeDiagramSVG,
  "coordinate-plane": coordPlaneSVG,
  "factor-tree": factorTreeSVG,
};

// Small "data chips" figure used by launch.visual (values + a caption line).
function dataChipsBlock(v) {
  const values = Array.isArray(v.values) ? v.values : [];
  if (!values.length) return "";
  const chips = values.map((value) => `<span class="sg-datachip">${esc(value)}</span>`).join("");
  return `<div class="sg-datachips" role="img" aria-label="${esc(v.title || "Data values")}: ${esc(values.join(", "))}">${v.title ? `<div class="sg-datachips-title">${esc(v.title)}</div>` : ""}<div class="sg-datachips-row">${chips}</div>${v.unit ? `<div class="sg-datachips-unit">${esc(v.unit)}</div>` : ""}</div>`;
}

// Bridge any config `diagram`/`visual` block to a DOM node: interactive kinds
// (factor-tree-lab, manip, …) mount live via the shared interactive-visual
// registry; static kinds render as accessible SVG figures. Returns null when
// the kind is unknown so callers can skip the block instead of rendering blank.
export function figureBlock(diagram, { ariaLabel, fallback } = {}) {
  if (!diagram || !diagram.kind) return null;
  let html = "";
  let interactive = false;
  if (diagram.kind === "data-chips") html = dataChipsBlock(diagram);
  else {
    html = interactiveVisualHost(diagram, {
      ariaLabel: ariaLabel || diagram.title || "Interactive math model",
      fallback: fallback || "Turn on JavaScript to explore this model.",
    });
    interactive = Boolean(html);
    if (!html) html = FIGURES[diagram.kind]?.(diagram) || "";
  }
  if (!html) return null;
  const host = el("div", "sg-figure", html);
  if (interactive) mountInteractiveVisuals(host);
  return host;
}

const EXPLORE_LOADERS = {
  "drag-sort": () => import("../components/drag-sort.js").then((m) => m.renderDragSort),
  "fill-table": () => import("../components/fill-table.js").then((m) => m.renderFillTable),
  "number-line": () => import("../components/number-line.js").then((m) => m.renderNumberLine),
  "coordinate-grid": () =>
    import("../components/coordinate-grid.js").then((m) => m.renderCoordinateGrid),
  "balance-scale": () => import("../components/balance-scale.js").then((m) => m.renderBalanceScale),
  "bar-model": () => import("../components/bar-model.js").then((m) => m.renderBarModel),
};

// Some number-line explores are authored in alternate shapes the component's
// `targets` contract doesn't cover (plot-the-items, inequality boundaries,
// equal-jump counting). Normalize them so no lesson falls into the component's
// "task unavailable" guard.
function normalizeExplore(explore) {
  if (explore.type !== "number-line" || Array.isArray(explore.targets)) return explore;
  const jumpValues = (min, max, step, count) => {
    const values = [];
    for (let value = min + step; value <= max + 1e-9 && values.length < count; value += step)
      values.push(Math.round(value * 1000) / 1000);
    return values;
  };
  if (Array.isArray(explore.items) && explore.items.length && explore.items[0]?.value != null) {
    const range = explore.range || {};
    return {
      ...explore,
      min: range.min ?? explore.min ?? 0,
      max: range.max ?? explore.max ?? 10,
      step: range.step ?? explore.step ?? 1,
      snapToTick: true,
      targets: explore.items.map((item) => ({ value: item.value, label: item.label })),
    };
  }
  if (Array.isArray(explore.problems) && explore.problems.length) {
    const boundaries = explore.problems.filter((problem) => problem.boundary != null);
    if (boundaries.length) {
      const values = boundaries.map((problem) => problem.boundary);
      return {
        ...explore,
        min: explore.min ?? Math.min(0, ...values),
        max: explore.max ?? Math.max(...values) + 5,
        step: explore.step ?? 1,
        snapToTick: true,
        label:
          explore.label ||
          "Place each inequality's boundary point, then say which direction it shades.",
        targets: boundaries.map((problem) => ({
          value: problem.boundary,
          label: problem.label || problem.inequality,
        })),
      };
    }
  }
  if (explore.totalJumps && explore.min != null && explore.max != null && explore.step) {
    const values = jumpValues(explore.min, explore.max, explore.step, explore.totalJumps);
    return {
      ...explore,
      snapToTick: true,
      label: explore.label || explore.questionText,
      targets: values.map((value, index) => ({ value, label: `Jump ${index + 1}` })),
    };
  }
  return explore;
}

function doneChip(text) {
  return el("div", "sg-donechip", `✓ ${esc(text)}`);
}

function discourseCard(discourse) {
  if (!discourse?.prompt) return null;
  const card = el("div", "sg-discourse");
  card.hidden = true;
  card.appendChild(el("div", "sg-eyebrow", "Say it like a mathematician"));
  card.appendChild(el("p", "sg-talk-q", esc(discourse.prompt)));
  if (discourse.sentenceFrame)
    card.appendChild(el("span", "sg-frame", esc(discourse.sentenceFrame)));
  return card;
}

// ── 1 · Explore Lab — the real manipulative for this lesson's explore phase ──
export function createExploreLab(config, variant, { number, store, events, onDone }) {
  const explore = config.explore;
  const loader = explore && EXPLORE_LOADERS[explore.type];
  if (!loader) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-explore";
  section.appendChild(
    sectionHeading(
      number,
      "Hands-on lab",
      variant === "group2" ? "Put the idea under pressure" : "Make the math move",
    ),
  );
  if (store.get("exploreDone"))
    section.appendChild(
      doneChip("You finished this lab last time — beat your reasoning, not the clock."),
    );
  if (explore.instructions) section.appendChild(el("p", "sg-lab-note", esc(explore.instructions)));

  const figure = figureBlock(explore.diagram);
  if (figure) section.appendChild(figure);

  const mount = el("div", "sg-lab-mount");
  mount.appendChild(el("p", "sg-lab-loading", "Loading the interactive lab…"));
  section.appendChild(mount);

  const talk = discourseCard(explore.discourse);
  if (talk) section.appendChild(talk);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    store.set("exploreDone", true);
    events.onSolved?.();
    if (talk) talk.hidden = false;
    celebrate("🧪");
    onDone();
  };

  loader()
    .then((render) => {
      mount.innerHTML = "";
      render(mount, {
        ...normalizeExplore(explore),
        label: explore.label || explore.questionText,
        onComplete: () => finish(),
        onAnswer: (ok) => {
          events.onAttempt?.({ correct: !!ok });
          if (ok) finish();
        },
      });
    })
    .catch((error) => {
      console.warn("small-group explore lab failed to load", error);
      mount.innerHTML = "";
      mount.appendChild(
        el(
          "p",
          "sg-lab-note",
          "This lab could not load right now. Talk through the warm-up with your group, then continue.",
        ),
      );
      finish();
    });

  return section;
}

// ── 2 · Model Lab — read the connect-phase model and explain it in math words ──
export function createModelLab(config, variant, { number, store, events, onDone }) {
  const connect = config.connect || {};
  if (!connect.diagram && !connect.scenario) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-model";
  section.appendChild(
    sectionHeading(
      number,
      "Connect the model",
      variant === "group2" ? "Read the model like a mathematician" : "See the story in the model",
    ),
  );
  if (store.get("modelDone")) section.appendChild(doneChip("Model explained last session."));
  if (connect.scenario) section.appendChild(el("p", "sg-lab-note", esc(connect.scenario)));

  const figure = figureBlock(connect.diagram);
  if (figure) section.appendChild(figure);

  const card = el("div", "card");
  const question = connect.promptQuestion || connect.prompt;
  if (question) card.appendChild(el("p", "sg-talk-q", esc(question)));

  const keywords = (connect.keywords || []).slice(0, 8);
  if (keywords.length) {
    card.appendChild(el("p", "block-lab", "Use at least one of these math words"));
    const bank = el("div", "sg-wordbank");
    keywords.forEach((word) => bank.appendChild(el("span", "sg-word", esc(word))));
    card.appendChild(bank);
  }

  const response = el("textarea", "sg-ta");
  response.setAttribute("aria-label", "Explain what the model shows");
  response.placeholder =
    variant === "group2"
      ? "Explain what the model proves, and how you know…"
      : "Explain what the model shows, using a math word…";
  const status = el("div", "fb");
  status.setAttribute("aria-live", "polite");
  const check = el("button", "btn", "Check my explanation");
  check.type = "button";
  check.onclick = () => {
    const text = response.value.trim();
    const lower = text.toLowerCase();
    const usedKeyword =
      !keywords.length || keywords.some((word) => lower.includes(String(word).toLowerCase()));
    if (text.length < 12 || !usedKeyword) {
      events.onAttempt?.({ correct: false });
      status.className = "fb show no";
      status.innerHTML =
        text.length < 12
          ? "Say a little more — one complete sentence about what the model shows."
          : `Strong start. Now work one of the math words into your explanation: <b>${esc(keywords.slice(0, 3).join(", "))}</b>.`;
      return;
    }
    events.onAttempt?.({ correct: true });
    events.onSolved?.();
    store.set("modelDone", true);
    response.disabled = true;
    check.disabled = true;
    status.className = "fb show ok";
    status.innerHTML =
      "✅ <b>You connected the model to the math.</b> Read your explanation to your group.";
    celebrate("🔗");
    onDone();
  };
  const row = el("div", "row");
  row.appendChild(check);
  card.append(response, row, status);
  section.appendChild(card);
  return section;
}

// ── 3 · Apply Lab — Polya-style word-problem workbench ──
const NUMBER_RE = /(\$\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?%|\d[\d,]*(?:\.\d+)?)/g;

function tappableProblem(text, onTap) {
  const wrap = el("p", "sg-apply-text");
  String(text)
    .split(NUMBER_RE)
    .forEach((part) => {
      if (NUMBER_RE.test(part) && /\d/.test(part)) {
        NUMBER_RE.lastIndex = 0;
        const chip = el("button", "sg-num", esc(part));
        chip.type = "button";
        chip.setAttribute("aria-pressed", "false");
        chip.onclick = () => {
          const on = chip.classList.toggle("on");
          chip.setAttribute("aria-pressed", String(on));
          onTap();
        };
        wrap.appendChild(chip);
      } else if (part) wrap.appendChild(document.createTextNode(part));
      NUMBER_RE.lastIndex = 0;
    });
  return wrap;
}

const PLAN_MOVES = [
  ["➕", "Add or combine"],
  ["➖", "Subtract or compare"],
  ["✖️", "Multiply or scale"],
  ["➗", "Divide or share"],
  ["🧱", "Break into factors or parts"],
  ["📊", "Draw a model first"],
];

export function createApplyLab(config, variant, { number, store, events, onDone }) {
  const problem = config.revealWordProblem;
  if (!problem?.text) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-apply";
  section.appendChild(sectionHeading(number, "Apply it", problem.title || "Solve a real problem"));
  if (store.get("applyDone")) section.appendChild(doneChip("Problem solved last session."));

  const steps = [];
  const unlock = (index) => {
    if (steps[index]) steps[index].classList.remove("locked");
  };

  // Step 1 — Understand: read it, hear it, tap the numbers that matter.
  const understand = el("div", "card sg-apply-step");
  understand.appendChild(el("div", "sg-step-lab", "1 · Understand"));
  const tools = el("div", "sg-toolrow");
  const read = el("button", "btn ghost", "🔊 Read the problem");
  read.type = "button";
  read.setAttribute("aria-pressed", "false");
  read.onclick = () => speak(problem.text, read);
  tools.appendChild(read);
  understand.appendChild(tools);
  understand.appendChild(el("p", "block-lab", "Tap every number you think the problem needs"));
  let tapped = false;
  understand.appendChild(
    tappableProblem(problem.text, () => {
      if (!tapped) {
        tapped = true;
        unlock(1);
      }
    }),
  );

  // Step 2 — Plan: pick the move(s) before touching the numbers.
  const plan = el("div", "card sg-apply-step locked");
  plan.appendChild(el("div", "sg-step-lab", "2 · Plan"));
  plan.appendChild(
    el("p", "block-lab", "Which move(s) will you try first? (Your call — plans can change.)"),
  );
  const moves = el("div", "sg-planrow");
  let planned = false;
  PLAN_MOVES.forEach(([emoji, label]) => {
    const chip = el("button", "sg-plan", `${emoji} ${esc(label)}`);
    chip.type = "button";
    chip.setAttribute("aria-pressed", "false");
    chip.onclick = () => {
      const on = chip.classList.toggle("on");
      chip.setAttribute("aria-pressed", String(on));
      if (!planned) {
        planned = true;
        unlock(2);
      }
    };
    moves.appendChild(chip);
  });
  plan.appendChild(moves);

  // Step 3 — Solve: show the steps and the answer.
  const solve = el("div", "card sg-apply-step locked");
  solve.appendChild(el("div", "sg-step-lab", "3 · Solve"));
  solve.appendChild(el("p", "block-lab", "Show your steps and your answer"));
  const work = el("textarea", "sg-ta");
  work.setAttribute("aria-label", "Show your work");
  work.placeholder = "Write each step, then your answer…";
  const solveRow = el("div", "row");
  const readyCheck = el("button", "btn", "I'm ready to check");
  readyCheck.type = "button";
  const solveStatus = el("div", "fb");
  solveStatus.setAttribute("aria-live", "polite");
  readyCheck.onclick = () => {
    if (work.value.trim().length < 12) {
      events.onAttempt?.({ correct: false });
      solveStatus.className = "fb show no";
      solveStatus.textContent = "Show at least one full step and an answer before you compare.";
      return;
    }
    unlock(3);
    readyCheck.disabled = true;
    solveStatus.className = "fb show info";
    solveStatus.textContent = "Now compare your thinking with the sample below.";
  };
  solveRow.appendChild(readyCheck);
  solve.append(work, solveRow, solveStatus);

  // Step 4 — Check: compare with the sample answer, then self-assess honestly.
  const checkStep = el("div", "card sg-apply-step locked");
  checkStep.appendChild(el("div", "sg-step-lab", "4 · Check"));
  if (problem.sampleAnswer) {
    const sample = el("details", "sg-sample");
    sample.appendChild(el("summary", "block-lab", "Compare with a sample answer"));
    sample.appendChild(el("p", null, esc(problem.sampleAnswer)));
    checkStep.appendChild(sample);
  }
  const verdictRow = el("div", "row");
  const finalStatus = el("div", "fb");
  finalStatus.setAttribute("aria-live", "polite");
  let complete = false;
  const finish = (verdict, message) => {
    if (!complete) {
      complete = true;
      store.set("applyDone", verdict);
      events.onAttempt?.({ correct: verdict !== "help" });
      events.onSolved?.();
      celebrate(verdict === "match" ? "🏆" : "🧠");
      onDone();
    }
    [...verdictRow.children].forEach((child) => (child.disabled = true));
    finalStatus.className = "fb show ok";
    finalStatus.innerHTML = message;
  };
  [
    ["match", "✓ Mine matches", "✅ <b>Solved.</b> Explain your favorite step to your group."],
    [
      "close",
      "≈ Close — I can fix mine",
      "🛠 <b>Revision is real math.</b> Fix one step, then explain what changed.",
    ],
    [
      "help",
      "? I want this explained",
      "🤝 <b>Smart ask.</b> Have your coach walk the sample answer aloud, one step at a time.",
    ],
  ].forEach(([verdict, label, message]) => {
    const button = el("button", "btn ghost", label);
    button.type = "button";
    button.onclick = () => finish(verdict, message);
    verdictRow.appendChild(button);
  });
  checkStep.append(verdictRow, finalStatus);
  if (variant === "group2")
    checkStep.appendChild(
      el(
        "p",
        "sg-lab-note",
        "Challenge: could a different plan reach the same answer? Defend the faster path.",
      ),
    );

  steps.push(understand, plan, solve, checkStep);
  steps.forEach((step) => section.appendChild(step));
  return section;
}
