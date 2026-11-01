// Strategy Theater: Watch -> Build -> Try interactive mathematics learning engine.
// Orchestrates multi-representation models, step-by-step demonstrations, construction tasks,
// and strategy-choice reflections.
import { h, mountModel } from "./models.js";
import { say, tr, normalizeFact, answerOf, factText, factKey } from "./strategies-kit.js";
import { getStrategy } from "./strategies-data.js";

export function mountStrategyTheater(host, opts = {}) {
  const {
    strategyId,
    fact: initialFactRaw = null,
    grade = 3,
    onDone = () => {},
    onResult = () => {},
    reducedMotion = false,
  } = opts;

  const strategy = getStrategy(strategyId);
  if (!strategy) {
    const err = h("p", { class: "mby-feedback mby-feedback-err", text: `Unknown strategy: ${strategyId}` });
    host.append(err);
    return { destroy: () => err.remove() };
  }

  const fact = normalizeFact(initialFactRaw) || strategy.demonstration.fact;
  let phase = "watch"; // "watch" | "build" | "try" | "choose"
  let stepIndex = 0;
  let playing = false;
  let timer = null;
  let activeModel = null;
  let faded = false;
  let tryAttemptCount = 0;
  let tryFirstTry = true;
  let trySupported = false;
  let selectedChoice = null;

  // Root container
  const root = h("div", { class: "mby-theater", "data-strategy": strategyId, "data-phase": phase });
  host.append(root);

  // Live announcer
  const announcer = h("div", { class: "mby-sr-only", role: "status", "aria-live": "polite" });
  root.append(announcer);
  const announce = (text) => { announcer.textContent = text; };

  // Phase Bar
  const phasePills = {
    watch: h("span", { class: "mby-phase-pill", "data-active": "true", text: `1. ${tr("Watch")}` }),
    build: h("span", { class: "mby-phase-pill", text: `2. ${tr("Build")}` }),
    try: h("span", { class: "mby-phase-pill", text: `3. ${tr("Try")}` }),
  };
  const phaseBar = h("div", { class: "mby-theater-phases" }, phasePills.watch, phasePills.build, phasePills.try);
  root.append(phaseBar);

  const updatePhaseBar = () => {
    phasePills.watch.setAttribute("data-active", phase === "watch");
    phasePills.watch.setAttribute("data-done", phase !== "watch");
    phasePills.build.setAttribute("data-active", phase === "build");
    phasePills.build.setAttribute("data-done", phase === "try" || phase === "choose");
    phasePills.try.setAttribute("data-active", phase === "try" || phase === "choose");
    phasePills.try.setAttribute("data-done", phase === "done");
  };

  const button = (props, ...kids) => {
    const { click, ...rest } = props;
    const el = h("button", rest, ...kids);
    if (click) el.addEventListener("click", click);
    return el;
  };

  // Header & Title
  const header = h("div", { class: "mby-theater-header" });
  const titleEl = h("h3", { class: "mby-theater-title", text: say(strategy.title) });
  const fadeBtn = button({
    class: "mby-btn",
    type: "button",
    text: tr("Fade picture"),
    click: () => {
      faded = !faded;
      fadeBtn.textContent = faded ? tr("Show picture") : tr("Fade picture");
      stageEl.setAttribute("data-fade", faded ? "true" : "false");
    },
  });
  header.append(titleEl, fadeBtn);
  root.append(header);

  // Dynamic Content Card
  const captionEl = h("p", { class: "mby-theater-caption" });
  const equationEl = h("div", { class: "mby-theater-equation" });
  const stageEl = h("div", { class: "mby-theater-stage" });
  const feedbackEl = h("div", { class: "mby-feedback", style: "display:none;" });
  const controlsEl = h("div", { class: "mby-theater-controls" });

  root.append(captionEl, equationEl, stageEl, feedbackEl, controlsEl);

  const clearControls = () => { controlsEl.replaceChildren(); };

  // ===================== PHASE 1: WATCH =====================
  const renderWatchStep = () => {
    const steps = strategy.demonstration.steps;
    const current = steps[stepIndex];
    captionEl.textContent = say(current.caption);
    equationEl.textContent = current.equation;
    announce(say(current.caption));

    if (activeModel) {
      activeModel.setState(current.state);
      activeModel.setHighlight(current.highlight);
    }

    clearControls();

    const leftGroup = h("div", { class: "mby-btn-group" });
    const backBtn = button({
      class: "mby-btn",
      type: "button",
      text: tr("Back"),
      disabled: stepIndex === 0,
      click: () => { pause(); stepIndex = Math.max(0, stepIndex - 1); renderWatchStep(); },
    });
    const playBtn = button({
      class: "mby-btn",
      type: "button",
      text: playing ? tr("Pause") : tr("Play"),
      click: () => {
        if (playing) pause();
        else play();
      },
    });
    const nextBtn = button({
      class: "mby-btn",
      type: "button",
      text: tr("Next"),
      disabled: stepIndex >= steps.length - 1,
      click: () => { pause(); stepIndex = Math.min(steps.length - 1, stepIndex + 1); renderWatchStep(); },
    });
    leftGroup.append(backBtn, playBtn, nextBtn);

    const readyBtn = button({
      class: "mby-btn mby-btn-primary",
      type: "button",
      text: `${tr("Build")} →`,
      click: () => { pause(); startBuildPhase(); },
    });

    controlsEl.append(leftGroup, readyBtn);
  };

  const play = () => {
    playing = true;
    renderWatchStep();
    timer = setInterval(() => {
      const steps = strategy.demonstration.steps;
      if (stepIndex < steps.length - 1) {
        stepIndex += 1;
        renderWatchStep();
      } else {
        pause();
      }
    }, reducedMotion ? 4000 : 2500);
  };

  const pause = () => {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
  };

  const startWatchPhase = () => {
    phase = "watch";
    stepIndex = 0;
    updatePhaseBar();
    feedbackEl.style.display = "none";
    stageEl.replaceChildren();

    const spec = {
      locked: true,
      limits: { max: 50 },
      state: strategy.demonstration.steps[0].state,
    };
    activeModel = mountModel(strategy.modelKind, stageEl, spec, { grade, reducedMotion });
    renderWatchStep();
  };

  // ===================== PHASE 2: BUILD =====================
  const startBuildPhase = () => {
    phase = "build";
    updatePhaseBar();
    pause();
    stageEl.replaceChildren();
    clearControls();
    feedbackEl.style.display = "none";

    captionEl.textContent = say(strategy.tryIt.instruction);
    equationEl.textContent = `${factText(strategy.tryIt.fact)} = ?`;
    announce(say(strategy.tryIt.instruction));

    const spec = {
      locked: false,
      state: { start: 0, hops: [], n1: 0, n2: 0, rows: 1, cols: 1, tens: 0, ones: 0, groups: 1, size: 0, whole: null, part1: null, part2: null },
    };
    activeModel = mountModel(strategy.modelKind, stageEl, spec, { grade, reducedMotion });

    const checkBtn = button({
      class: "mby-btn mby-btn-success",
      type: "button",
      text: tr("Check"),
      click: () => {
        const state = activeModel.getState();
        const target = strategy.tryIt.target;
        let isCorrect = true;

        for (const [k, v] of Object.entries(target)) {
          if (Array.isArray(v)) {
            if (JSON.stringify(state[k] || []) !== JSON.stringify(v)) isCorrect = false;
          } else if (state[k] !== v) {
            isCorrect = false;
          }
        }

        feedbackEl.style.display = "flex";
        if (isCorrect) {
          activeModel.flash("ok");
          feedbackEl.className = "mby-feedback mby-feedback-ok";
          feedbackEl.textContent = `✓ ${tr("Correct!")} ${say(strategy.why)}`;
          announce(`${tr("Correct!")} ${say(strategy.why)}`);
          checkBtn.style.display = "none";

          const toTryBtn = button({
            class: "mby-btn mby-btn-primary",
            type: "button",
            text: `${tr("Try")} →`,
            click: () => { startTryPhase(); },
          });
          controlsEl.append(toTryBtn);
        } else {
          activeModel.flash("no");
          trySupported = true;
          feedbackEl.className = "mby-feedback mby-feedback-err";
          feedbackEl.textContent = `${tr("Not quite yet.")} ${say(strategy.misconception)}`;
          announce(`${tr("Not quite yet.")} ${say(strategy.misconception)}`);
        }
      },
    });

    controlsEl.append(checkBtn);
  };

  // ===================== PHASE 3: TRY =====================
  const startTryPhase = () => {
    phase = "try";
    updatePhaseBar();
    stageEl.replaceChildren();
    clearControls();
    feedbackEl.style.display = "none";

    // Pick a fresh fact from examples or strategy facts
    const tryFact = strategy.examples.find((f) => !f || f.a !== strategy.tryIt.fact.a || f.b !== strategy.tryIt.fact.b) || strategy.examples[0];
    const correctAns = String(answerOf(tryFact));

    captionEl.textContent = `${tr("Try")}: ${say(strategy.title)}`;
    equationEl.textContent = "";

    const card = h("div", { class: "mby-try-card" });
    const row = h("div", { class: "mby-try-input-row" });
    const promptText = h("span", { text: `${factText(tryFact)} = ` });
    const input = h("input", {
      class: "mby-try-input",
      type: "text",
      inputmode: "numeric",
      autocomplete: "off",
      "aria-label": `${factText(tryFact)} equals`,
    });
    row.append(promptText, input);
    card.append(row);
    stageEl.append(card);
    input.focus();

    const submitAnswer = () => {
      const val = input.value.trim();
      if (!val) return;
      tryAttemptCount += 1;

      feedbackEl.style.display = "flex";
      if (val === correctAns) {
        feedbackEl.className = "mby-feedback mby-feedback-ok";
        feedbackEl.textContent = `✓ ${tr("Correct!")} ${factText(tryFact)} = ${correctAns}.`;
        announce(`${tr("Correct!")} ${factText(tryFact)} = ${correctAns}`);
        input.disabled = true;
        checkBtn.style.display = "none";

        // Emit onResult for the try phase
        onResult({
          strategyId,
          key: factKey(tryFact),
          built: true,
          correct: true,
          firstTry: tryFirstTry,
          supported: trySupported,
          revised: tryAttemptCount > 1,
        });

        const nextChooseBtn = button({
          class: "mby-btn mby-btn-primary",
          type: "button",
          text: `${tr("Continue")} →`,
          click: () => { startChoosePhase(); },
        });
        controlsEl.append(nextChooseBtn);
      } else {
        tryFirstTry = false;
        trySupported = true;
        feedbackEl.className = "mby-feedback mby-feedback-err";
        feedbackEl.textContent = `${tr("Not quite yet.")} ${say(strategy.misconception)}`;
        announce(`${tr("Not quite yet.")} ${say(strategy.misconception)}`);
        input.select();
      }
    };

    const checkBtn = button({
      class: "mby-btn mby-btn-success",
      type: "button",
      text: tr("Check"),
      click: submitAnswer,
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitAnswer();
    });

    controlsEl.append(checkBtn);
  };

  // ===================== PHASE 4: CHOOSE =====================
  const startChoosePhase = () => {
    phase = "choose";
    stageEl.replaceChildren();
    clearControls();
    feedbackEl.style.display = "none";

    captionEl.textContent = tr("Which strategy fit this problem?");
    equationEl.textContent = say(strategy.choose.question);
    announce(say(strategy.choose.question));

    const grid = h("div", { class: "mby-choose-grid", role: "radiogroup", "aria-label": tr("Strategy options") });
    stageEl.append(grid);

    strategy.choose.options.forEach((opt, idx) => {
      const optBtn = button({
        class: "mby-choose-btn",
        type: "button",
        role: "radio",
        "aria-checked": "false",
        text: opt.text,
        click: () => {
          selectedChoice = opt;
          grid.querySelectorAll(".mby-choose-btn").forEach((b) => {
            b.setAttribute("data-selected", "false");
            b.setAttribute("aria-checked", "false");
          });
          optBtn.setAttribute("data-selected", "true");
          optBtn.setAttribute("aria-checked", "true");

          feedbackEl.style.display = "flex";
          if (opt.correct) {
            feedbackEl.className = "mby-feedback mby-feedback-ok";
            feedbackEl.textContent = `✓ ${say(opt.reason)}`;
            finishBtn.disabled = false;
          } else {
            feedbackEl.className = "mby-feedback mby-feedback-err";
            feedbackEl.textContent = say(opt.reason);
            finishBtn.disabled = true;
          }
          announce(say(opt.reason));
        },
      });
      grid.append(optBtn);
    });

    const finishBtn = button({
      class: "mby-btn mby-btn-primary",
      type: "button",
      text: `${tr("Continue")} ✓`,
      disabled: true,
      click: () => {
        phase = "done";
        updatePhaseBar();
        onDone({ strategyId });
      },
    });

    controlsEl.append(finishBtn);
  };

  // Kick off Watch phase
  startWatchPhase();

  return {
    root,
    destroy: () => {
      pause();
      if (activeModel) activeModel.destroy();
      root.remove();
    },
    getState: () => ({ phase, stepIndex, strategyId, tryAttemptCount, tryFirstTry, trySupported }),
  };
}
