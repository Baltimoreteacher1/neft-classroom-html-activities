import { attachVoiceInput } from "../components/voice-explain.js";
import { interactiveVisualHost, mountInteractiveVisuals } from "./interactive-visual.js";
import { markScene } from "./small-group-storyboard.js";
import {
  bi,
  celebrate,
  createVoiceMemo,
  el,
  esc,
  openInfoDialog,
  sectionHeading,
  speak,
} from "./small-group-ui.js";
import { toolMeta } from "./tool-catalog.js";
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

// Adapt the studio store to the {saveResponse, getResponse} shape
// manipulative-state.js expects, so what a small-group student BUILDS in a
// manipulative survives a tab switch or a reload — the same memory the full
// lesson already gives its labs. `slot` namespaces one call site's hosts so two
// figures of the same kind in different labs never overwrite each other.
function studioManipStore(store, slot) {
  if (!store?.get || !store?.set) return null;
  return {
    saveResponse(_phaseId, key, value) {
      store.set(`iv:${slot}:${key}`, value);
    },
    getResponse(_phaseId, key) {
      return store.get(`iv:${slot}:${key}`);
    },
  };
}

// The tool's canonical name + purpose, in the studio's bilingual lane style.
// Empty string for an uncatalogued kind.
function toolCaptionHtml(diagram) {
  const meta = toolMeta(diagram);
  if (!meta.catalogued) return "";
  return (
    `<div class="sg-tool-caption">` +
    `<span class="sg-tool-name"><span aria-hidden="true">🧰</span> ${bi(meta.name, meta.nameEs)}</span>` +
    (meta.purpose
      ? `<span class="sg-tool-purpose">${bi(meta.purpose, meta.purposeEs)}</span>`
      : "") +
    (meta.instance ? `<span class="sg-tool-instance">${esc(meta.instance)}</span>` : "") +
    `</div>`
  );
}

// Bridge any config `diagram`/`visual` block to a DOM node: interactive kinds
// (factor-tree-lab, manip, …) mount live via the shared interactive-visual
// registry; static kinds render as accessible SVG figures. Returns null when
// the kind is unknown so callers can skip the block instead of rendering blank.
// Pass `{ store, slot }` to keep the student's work across sessions.
export function figureBlock(
  diagram,
  /** @type {{ ariaLabel?: string, fallback?: string, staticOnly?: boolean, store?: any, slot?: string }} */
  { ariaLabel, fallback, staticOnly = false, store, slot } = {},
) {
  if (!diagram || !diagram.kind) return null;
  let html = "";
  let interactive = false;
  if (diagram.kind === "data-chips") html = dataChipsBlock(diagram);
  else {
    // staticOnly renders reference figures as plain SVG so they never compete
    // with the section's real manipulative (the 5.1 explore-lab directive).
    html = staticOnly
      ? ""
      : interactiveVisualHost(diagram, {
          ariaLabel: ariaLabel || diagram.title || "Interactive math model",
          fallback: fallback || "Turn on JavaScript to explore this model.",
        });
    interactive = Boolean(html);
    if (!html) html = FIGURES[diagram.kind]?.(diagram) || "";
  }
  if (!html) return null;
  // Name the tool before it appears — an unlabelled manipulative reads as
  // decoration. The catalog carries the student-facing name and purpose for
  // every registered kind (gated by tools/interactive-tools.test.mjs), so an
  // uncatalogued kind simply gets no caption rather than a title-cased slug.
  const host = el("div", "sg-figure", interactive ? toolCaptionHtml(diagram) + html : html);
  if (interactive) {
    const persist = slot ? studioManipStore(store, slot) : null;
    mountInteractiveVisuals(host, persist ? { state: persist, phaseId: slot } : undefined);
  }
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

// Honest lab subtitles: promise what THIS lab actually asks students to do.
// A drag-sort of long-division steps isn't "Make the math move" — say what it
// is. Unknown types keep the generic line.
const EXPLORE_SUBTITLES = {
  "drag-sort": "Put each piece where it belongs",
  "fill-table": "Build the table one cell at a time",
  "number-line": "Move along the line",
  "coordinate-grid": "Plot the points",
  "balance-scale": "Keep both sides balanced",
  "bar-model": "Build the model",
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
      // One dot moved to each value in turn (not a cluster of dots snapped to
      // whole numbers) — the sequential renderer snaps to tenths for decimals.
      sequential: true,
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
// Cover the Step 2 manipulative until the Step 1 tool announces a solved
// problem (`nt:decimal-columns-solved`, dispatched by the columns lab and
// bubbling up to `scope`). The gated node is built and mounted underneath, so
// unlocking costs nothing and no state is rebuilt. The cover carries its own
// skip control — a student who solved on paper, or whose tool failed to load,
// is never stranded. The point is the order of the work, not a checkpoint.
function gateUntilSolved(scope, gated) {
  const cover = el("div", "sg-solve-gate");
  cover.setAttribute("role", "status");
  cover.appendChild(el("p", "sg-solve-gate-line", "🔒 Solve the problem above first."));
  const skip = el("button", "sg-solve-gate-skip");
  skip.type = "button";
  skip.textContent = "I already solved it — open this";
  cover.appendChild(skip);

  gated.classList.add("sg-solve-gated");
  gated.setAttribute("aria-hidden", "true");
  gated.before(cover);

  let open = false;
  const unlock = () => {
    if (open) return;
    open = true;
    cover.remove();
    gated.classList.remove("sg-solve-gated");
    gated.removeAttribute("aria-hidden");
    scope.removeEventListener("nt:decimal-columns-solved", unlock);
  };
  skip.addEventListener("click", unlock);
  scope.addEventListener("nt:decimal-columns-solved", unlock);
}

export function createExploreLab(config, variant, { number, store, events, onDone }) {
  const explore = config.explore;
  const loader = explore && EXPLORE_LOADERS[explore.type];
  if (!loader) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-explore";
  markScene(section, "explore");
  section.appendChild(
    sectionHeading(
      number,
      "Hands-on lab",
      variant === "group2"
        ? "Put the idea under pressure"
        : EXPLORE_SUBTITLES[explore.type] || "Make the math move",
    ),
  );
  if (store.get("exploreDone"))
    section.appendChild(
      doneChip("You finished this lab last time — try to explain it even better today."),
    );
  if (explore.instructions) section.appendChild(el("p", "sg-lab-note", esc(explore.instructions)));

  // `solveFirst` is the one authored exception to the 5.1 directive below: the
  // diagram is not a competing reference, it is Step 1 of the SAME task. On the
  // decimal lessons the lab is a number line whose jumps a student cannot know
  // without first computing the sum — so the columns lab mounts LIVE, above the
  // number line, and the number line stays covered until it reports a solve.
  const solveFirst = explore.solveFirst === true && Boolean(explore.diagram);
  if (solveFirst) {
    const step1 = figureBlock(explore.diagram, { staticOnly: false, store, slot: "explore-solve" });
    if (step1) {
      section.appendChild(
        el(
          "p",
          "sg-lab-step",
          esc(explore.solveFirstToolCaption || "Step 1 — solve the problem here first."),
        ),
      );
      section.appendChild(step1);
      section.appendChild(
        el(
          "p",
          "sg-lab-step",
          esc(explore.solveFirstTaskCaption || "Step 2 — then show that same jump below."),
        ),
      );
    }
  }

  // The lab itself is the manipulative; the parent lesson's explore.diagram
  // (e.g. an unrelated line grapher) is never MOUNTED here (5.1 directive).
  const mount = el("div", "sg-lab-mount");
  mount.appendChild(el("p", "sg-lab-loading", "Loading the interactive lab…"));
  section.appendChild(mount);
  if (solveFirst) gateUntilSolved(section, mount);

  // The authored diagram still has value as a quiet, collapsed reference.
  // 3D kinds (solid-3d / cross-section / net-folder — the AR/3D model lane)
  // mount LIVE: on a solids lesson the 3D explorer is the point, not a
  // competing visual. Every other kind renders static-only so it never fights
  // the manipulative.
  const is3d = ["solid-3d", "cross-section", "net-folder"].includes(explore.diagram?.kind);
  // Already mounted live as Step 1 — a collapsed copy of the same tool below it
  // reads as a second, different model.
  const reference = solveFirst ? null : figureBlock(explore.diagram, { staticOnly: !is3d });
  if (reference) {
    const shelf = el("details", "sg-sample");
    shelf.appendChild(
      el(
        "summary",
        "block-lab",
        is3d ? "🧊 3D model lab — explore the solid" : "📎 See the lesson's reference model",
      ),
    );
    shelf.appendChild(reference);
    if (is3d) shelf.open = true;
    section.appendChild(shelf);
  }

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
    section.classList.add("sg-lab-success");
    onDone();
  };

  loader()
    .then((render) => {
      mount.innerHTML = "";
      mount.classList.add("sg-lab-ready");
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
      // An unloaded lab is not a finished lab: keep completion honest and give
      // the student a way back in (chunk 404s right after a deploy are
      // transient), instead of silently marking the phase done.
      console.warn("small-group explore lab failed to load", error);
      mount.innerHTML = "";
      mount.appendChild(
        el(
          "p",
          "sg-lab-note",
          "This lab could not load right now. The rest of the studio still works — try reloading, or continue and come back.",
        ),
      );
      const retry = el("button", "btn ghost", "↻ Try loading the lab again");
      retry.type = "button";
      retry.onclick = () => window.location.reload();
      mount.appendChild(retry);
    });

  return section;
}

// ── 2 · Model Lab — read the connect-phase model and explain it in math words ──
export function createModelLab(config, variant, { number, store, events, onDone }) {
  const connect = config.connect || {};
  if (!connect.diagram && !connect.scenario) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-model";
  markScene(section, "model");
  section.appendChild(
    sectionHeading(
      number,
      "Connect the model",
      variant === "group2" ? "Read the model like a mathematician" : "See the story in the model",
    ),
  );
  if (store.get("modelDone")) section.appendChild(doneChip("Model explained last session."));
  if (connect.scenario) section.appendChild(el("p", "sg-lab-note", esc(connect.scenario)));

  const figure = figureBlock(connect.diagram, { store, slot: "model-lab" });
  if (figure) section.appendChild(figure);

  const card = el("div", "card");
  const question = connect.promptQuestion || connect.prompt;
  if (question) card.appendChild(el("p", "sg-talk-q", esc(question)));
  const spoken = [connect.scenario, question].filter(Boolean).join(" ");
  if (spoken) {
    const tools = el("div", "sg-toolrow");
    const read = el("button", "btn ghost", "🔊 Read the model story");
    read.type = "button";
    read.setAttribute("aria-pressed", "false");
    read.onclick = () => speak(spoken, read);
    tools.appendChild(read);
    card.appendChild(tools);
  }

  const keywords = (connect.keywords || []).slice(0, 12);
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
  response.value = store.get("modelResponse") || "";
  response.addEventListener("input", () => store.set("modelResponse", response.value));
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
      "✅ <b>You connected the model to the math.</b> Read your explanation out loud.";
    celebrate("🔗");
    section.classList.add("sg-lab-success");
    onDone();
  };
  const row = el("div", "row");
  row.appendChild(check);
  card.append(response, row, status);
  // "Explain Out Loud": speak the explanation and have it transcribed into the
  // box (target math words highlight as they are said). No-op where speech
  // recognition is unsupported — the textarea still works by typing.
  attachVoiceInput(response, { keywords });
  // Device-local "record our best explanation" — a second discourse-capture
  // option that also reaches Catch-Up (which renders no Talk section). Playback
  // only; nothing is uploaded.
  card.appendChild(createVoiceMemo("Optional: record your spoken explanation, then play it back."));
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

// The six planning moves, each with a plain-language "what this move means" and
// a short worked example. Students tap ⓘ next to a move to read them, so picking
// a plan never depends on already knowing the math vocabulary.
const PLAN_MOVES = [
  [
    "➕",
    "Add or combine",
    "You put amounts together to find one total. Use it when the problem gives you parts and asks how much there is altogether.",
    "You bought 3 bags and 5 bags → 3 + 5 = 8 bags in all.",
  ],
  [
    "➖",
    "Subtract or compare",
    "You take one amount away from another, or find how much bigger one is. Use it for how many are left or how much more.",
    "You had $20 and spent $12 → 20 − 12 = $8 left.",
  ],
  [
    "✖️",
    "Multiply or scale",
    "You add the same amount over and over, or make something a number of times bigger. Use it for equal groups.",
    "6 boxes with 4 markers each → 6 × 4 = 24 markers.",
  ],
  [
    "➗",
    "Divide or share",
    "You split an amount into equal groups, or find how many fit in each group. Use it for sharing fairly or finding one unit.",
    "24 markers shared by 6 friends → 24 ÷ 6 = 4 markers each.",
  ],
  [
    "🧱",
    "Break into factors or parts",
    "You split a number or a shape into smaller pieces that are easier to work with, then handle one piece at a time.",
    "To find 15% of 60, break it up: 10% is 6 and 5% is 3, so 6 + 3 = 9.",
  ],
  [
    "📊",
    "Draw a model first",
    "You sketch the problem — a tape diagram, number line, table, or picture — before you calculate, so you can see what it is asking.",
    "Draw a tape split into 4 equal parts to show 3/4 of 20.",
  ],
];

export function createApplyLab(config, variant, { number, store, events, onDone }) {
  const problem = config.revealWordProblem;
  if (!problem?.text) return null;

  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-apply";
  markScene(section, "apply");
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
    el(
      "p",
      "block-lab",
      "Which move(s) will you try first? (Your call — plans can change. Tap ⓘ to see what a move means.)",
    ),
  );
  const moves = el("div", "sg-planrow");
  let planned = false;
  PLAN_MOVES.forEach(([emoji, label, what, example]) => {
    // Two controls per move: the chip picks it, the ⓘ explains it. They are
    // siblings (never nested) so tapping "what does this mean?" can't be
    // mistaken for choosing the move.
    const option = el("div", "sg-planopt");
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
    const why = el("button", "sg-plan-why", "ⓘ");
    why.type = "button";
    why.setAttribute("aria-label", `What does "${label}" mean?`);
    why.setAttribute("aria-haspopup", "dialog");
    why.onclick = () => openInfoDialog({ title: `${emoji} ${label}`, what, example }, why);
    option.append(chip, why);
    moves.appendChild(option);
  });
  plan.appendChild(moves);

  // Step 3 — Solve: show the steps and the answer.
  const solve = el("div", "card sg-apply-step locked");
  solve.appendChild(el("div", "sg-step-lab", "3 · Solve"));
  solve.appendChild(el("p", "block-lab", "Show your steps and your answer"));
  const work = el("textarea", "sg-ta");
  work.setAttribute("aria-label", "Show your work");
  work.placeholder = "Write each step, then your answer…";
  work.value = store.get("applyWork") || "";
  work.addEventListener("input", () => store.set("applyWork", work.value));
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
    ["match", "✓ Mine matches", "✅ <b>Solved.</b> Explain your favorite step out loud."],
    [
      "close",
      "≈ Close — I can fix mine",
      "🛠 <b>Revision is real math.</b> Fix one step, then explain what changed.",
    ],
    [
      "help",
      "? I want this explained",
      "🤝 <b>Smart ask.</b> Open the sample answer above and walk it one line at a time.",
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
