import { selectedTalk } from "./small-group-engagement.js";
import { celebrate, el, esc, sectionHeading } from "./small-group-ui.js";

const PATHS = {
  stabilize: {
    id: "stabilize",
    label: "Stabilize",
    prompt: "Use one clear model. Point to each part and explain what it shows.",
  },
  connect: {
    id: "connect",
    label: "Connect",
    prompt: "Show the idea two ways. Explain where the same thinking appears in both.",
  },
  stretch: {
    id: "stretch",
    label: "Stretch",
    prompt: "Test a boundary case or counterexample. Decide when the idea still works.",
  },
};

const alternatives = () => Object.values(PATHS).map((path) => ({ ...path }));

export function chooseAdaptivePath(state = {}, variant = "group1") {
  const needsSupport =
    Number(state.before || 0) <= 2 ||
    Number(state.incorrectAttempts || 0) >= 2 ||
    Number(state.hints || 0) >= 2;
  const readyToStretch =
    variant === "group2" &&
    Number(state.before || 0) >= 4 &&
    Number(state.solved || 0) >= 2 &&
    Number(state.incorrectAttempts || 0) === 0 &&
    Number(state.hints || 0) === 0;
  const id = needsSupport ? "stabilize" : readyToStretch ? "stretch" : "connect";
  const reasons = {
    stabilize: "A supported model will make the next step easier to see.",
    connect: "You have traction; connecting two representations will deepen the idea.",
    stretch: "Your practice is accurate and ready for a boundary test.",
  };
  return { ...PATHS[id], reason: reasons[id], alternatives: alternatives() };
}

const PROOF_PATHS = {
  model: {
    label: "Model it",
    prompt:
      "Draw, diagram, table, number line, or build a concrete model. Label what each part shows.",
  },
  explain: {
    label: "Explain it",
    prompt: "Use precise words: “I know ___ because ___, so ___.”",
  },
  test: {
    label: "Test it",
    prompt: "Try an example, check every step, and say what the result proves.",
  },
  teach: {
    label: "Teach it",
    prompt:
      "Prepare a 30-second explanation — for a partner or out loud to yourself — with one question to check understanding.",
  },
};

const proofEntries = (variant) =>
  Object.entries(PROOF_PATHS).map(([id, path]) => ({
    id,
    ...path,
    prompt:
      variant === "group2" && id === "test"
        ? "Test a boundary case or counterexample, then defend what it proves."
        : path.prompt,
  }));

function labelFor(pathId) {
  return PROOF_PATHS[pathId]?.label || "Not selected yet";
}

function printOnly(target, node) {
  // The print stylesheet shows only direct children of #app, but the card
  // being printed lives inside a tab panel — lift it out for the print run
  // and put it back exactly where it was afterwards.
  const className = `sg-print-${target}`;
  const app = document.getElementById("app");
  const needsLift = node && app && node.parentElement !== app;
  const marker = needsLift ? document.createComment("sg-print-slot") : null;
  if (marker) {
    node.before(marker);
    app.appendChild(node);
  }
  const cleanup = () => {
    document.body.classList.remove(className);
    if (marker) marker.replaceWith(node);
  };
  document.body.classList.add(className);
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}

// Guided "Prove It & Defend It" flow — the challenge group's capstone tab.
// Three step-cards unlock in order: solve one, show why it works (pick one of
// three concrete moves), then defend it against a skeptic's two questions.
// Replaces the old scattered proof-path picker + standalone talk section.
const PROVE_MOVES = [
  {
    id: "model",
    icon: "▧",
    label: "Show a model",
    prompt:
      "Draw a diagram, table, or number line. Label what each part shows and point to where the answer appears.",
  },
  {
    id: "explain",
    icon: "✦",
    label: "Explain in words",
    prompt: "Use precise words: “I know ___ because ___, so ___.”",
  },
  {
    id: "test",
    icon: "◉",
    label: "Test an example",
    group2Prompt:
      "Try a boundary case or a number that could break your answer. Show it still works — or find exactly where it would not.",
    prompt:
      "Put your answer back into the problem. Check every step and say what the result proves.",
  },
];

const SKEPTIC_QUESTIONS = [
  { q: "🤨 “How do you KNOW your answer is right?”", frame: "I know because…" },
  {
    q: "🤨 “When would this stop working — or how could someone doubt it?”",
    frame: "This holds when… It would break if…",
  },
];

function proveStep(labelText) {
  const card = el("div", "card sg-apply-step");
  card.appendChild(el("div", "sg-step-lab", labelText));
  return card;
}

export function createProveItLab(config, variant, state, onDone, store = null) {
  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-prove";
  section.appendChild(sectionHeading(1, "Prove it & defend it", "Make your thinking rock-solid"));
  section.appendChild(
    el(
      "p",
      null,
      "Solve one, show why it works, then defend it to a skeptic — one step at a time.",
    ),
  );

  const steps = [];
  const unlock = (index) => steps[index]?.classList.remove("locked");

  // Step 1 — Solve one challenge problem.
  const problem = config.practice?.extending?.[0] || config.practice?.onLevel?.[0] || {};
  const solve = proveStep("1 · Solve one");
  solve.appendChild(
    problem.stem
      ? el("p", "sg-talk-q", esc(problem.stem))
      : el(
          "p",
          "block-lab",
          "Solve the hardest problem from today — the one that makes you think.",
        ),
  );
  const work = el("textarea", "sg-ta");
  work.setAttribute("aria-label", "Your answer and how you got it");
  work.placeholder = "Write your answer and the steps you took…";
  work.oninput = () => (state.proveWork = work.value.trim());
  const solveBtn = el("button", "btn", "I've got an answer →");
  solveBtn.type = "button";
  const solveFb = el("div", "fb");
  solveFb.setAttribute("aria-live", "polite");
  solveBtn.onclick = () => {
    if (work.value.trim().length < 8) {
      solveFb.className = "fb show no";
      solveFb.textContent = "Write your answer and at least one step first.";
      return;
    }
    solveBtn.disabled = true;
    unlock(1);
    solveFb.className = "fb show info";
    solveFb.textContent = "Nice — now show WHY it works below.";
  };
  const solveRow = el("div", "row");
  solveRow.appendChild(solveBtn);
  solve.append(work, solveRow, solveFb);
  section.appendChild(solve);
  steps.push(solve);

  // Step 2 — Pick one move and write the proof.
  const prove = proveStep("2 · Show why it works");
  prove.classList.add("locked");
  prove.appendChild(el("p", "block-lab", "Pick one way to prove your answer is right:"));
  const grid = el("div", "sg-proof-grid");
  const promptEl = el(
    "div",
    "sg-proof-prompt",
    "Choose a way above to reveal your prove-it prompt.",
  );
  promptEl.setAttribute("aria-live", "polite");
  const proveTa = el("textarea", "sg-ta");
  proveTa.setAttribute("aria-label", "Your proof");
  proveTa.placeholder = "Write, sketch a plan, or rehearse your proof here…";
  proveTa.value = state.proveReason || "";
  proveTa.oninput = () => {
    state.proveReason = proveTa.value.trim();
    store?.set("proveReason", state.proveReason);
  };
  const proveBtn = el("button", "btn", "This proves it →");
  proveBtn.type = "button";
  proveBtn.disabled = true;
  const proveFb = el("div", "fb");
  proveFb.setAttribute("aria-live", "polite");
  const moveButtons = [];
  for (const move of PROVE_MOVES) {
    const text = variant === "group2" && move.group2Prompt ? move.group2Prompt : move.prompt;
    const button = el(
      "button",
      "sg-proof-button",
      `<span aria-hidden="true">${move.icon}</span><b>${esc(move.label)}</b>`,
    );
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    const select = (persist) => {
      state.proofPath = move.id;
      if (persist) store?.set("proofPath", move.id);
      moveButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      promptEl.innerHTML = `<b>${esc(move.label)}:</b> ${esc(text)}`;
      proveTa.placeholder = text;
      proveBtn.disabled = false;
    };
    button.onclick = () => select(true);
    moveButtons.push(button);
    grid.appendChild(button);
    if (state.proofPath === move.id) select(false);
  }
  proveBtn.onclick = () => {
    if (!state.proofPath) {
      proveFb.className = "fb show no";
      proveFb.textContent = "Pick a way to prove it first.";
      return;
    }
    if (proveTa.value.trim().length < 8) {
      proveFb.className = "fb show no";
      proveFb.textContent = "Write your proof before moving on.";
      return;
    }
    proveBtn.disabled = true;
    unlock(2);
    proveFb.className = "fb show info";
    proveFb.textContent = "Now defend it against a skeptic below.";
  };
  const proveRow = el("div", "row");
  proveRow.appendChild(proveBtn);
  prove.append(grid, promptEl, proveTa, proveRow, proveFb);
  section.appendChild(prove);
  steps.push(prove);

  // Step 3 — Defend it to a skeptic (folds in the old talk section, guided).
  const defend = proveStep("3 · Defend it to a skeptic");
  defend.classList.add("locked");
  defend.appendChild(
    el("p", "block-lab", "A skeptic isn’t convinced yet. Answer their two questions:"),
  );
  const answers = [];
  const doneBtn = el("button", "btn", "I defended it ✓");
  doneBtn.type = "button";
  doneBtn.disabled = true;
  const refreshDefend = () =>
    (doneBtn.disabled = !(answers[0]?.length >= 4 && answers[1]?.length >= 4));
  SKEPTIC_QUESTIONS.forEach((item, index) => {
    const wrap = el("div", "sg-defend-q");
    wrap.appendChild(el("p", "sg-talk-q", esc(item.q)));
    const answer = el("textarea", "sg-ta");
    answer.setAttribute("aria-label", `Answer to skeptic question ${index + 1}`);
    answer.placeholder = item.frame;
    answer.oninput = () => {
      answers[index] = answer.value.trim();
      refreshDefend();
    };
    wrap.appendChild(answer);
    defend.appendChild(wrap);
  });
  const defendFb = el("div", "fb");
  defendFb.setAttribute("aria-live", "polite");
  let complete = false;
  doneBtn.onclick = () => {
    if (complete) return;
    complete = true;
    state.defended = true;
    store?.set("defended", true);
    doneBtn.disabled = true;
    doneBtn.textContent = "Proof defended ✓";
    defendFb.className = "fb show ok";
    defendFb.innerHTML =
      "🏆 <b>Proof complete.</b> You solved it, proved it, and defended it to a skeptic.";
    celebrate("🏆");
    onDone?.();
  };
  const defendRow = el("div", "row");
  defendRow.appendChild(doneBtn);
  defend.append(defendRow, defendFb);
  section.appendChild(defend);
  steps.push(defend);

  return section;
}

// Short, ESOL-friendly "how to do it" guidance for each proof method, surfaced
// as tap-to-open popovers in the consensus lab so a student who is unsure what
// "Model it / Explain it / Test it / Teach it" means can see concrete steps and
// sentence frames — anchored to one of the lesson's own problems.
const PROOF_GUIDANCE = {
  model: {
    steps: [
      "Draw it — a diagram, table, number line, or quick picture.",
      "Label each part, then point to where the answer shows up.",
    ],
    frames: ["This part shows ___.", "The answer is here because ___."],
  },
  explain: {
    steps: ["Say your steps out loud, in order.", "Name the rule or math idea you used."],
    frames: ["I know ___ because ___, so ___.", "First ___, then ___, which means ___."],
  },
  test: {
    steps: [
      "Put your answer back into the problem and check every step.",
      "Try one more example to be sure it holds.",
    ],
    group2Steps: [
      "Try a boundary case or a number that could break your answer.",
      "Show it still works — or find exactly where it would not.",
    ],
    frames: ["When I check it, I get ___.", "This proves ___ because ___."],
  },
  teach: {
    steps: [
      "Plan a 30-second explanation for a partner.",
      "End with one question that checks they understood.",
    ],
    frames: ["The key step is ___.", "Check — can you tell me why ___?"],
  },
};

// Tap-to-open method guide: a row of chips (one per proof method) that reveal a
// shared panel with "Do this" steps + sentence frames for the tapped method.
// One panel open at a time; tapping the open chip again closes it.
function createConsensusGuide(variant, sample) {
  const wrap = el("div", "sg-guide");
  wrap.appendChild(
    el(
      "div",
      "sg-guide-lede",
      "Not sure what a choice means? Tap it for how-to steps and sentence frames.",
    ),
  );
  const chipRow = el("div", "sg-guide-chips");
  const panel = el("div", "sg-guide-panel");
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  const chips = [];
  let openId = null;
  const renderPanel = (path) => {
    const guide = PROOF_GUIDANCE[path.id] || {};
    const steps = (variant === "group2" && guide.group2Steps) || guide.steps || [];
    const frames = guide.frames || [];
    const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join("");
    panel.innerHTML =
      `<div class="sg-guide-title">${esc(path.label)}</div>` +
      (sample
        ? `<p class="sg-guide-anchor">For the problem above: <i>${esc(sample)}</i></p>`
        : "") +
      `<div class="sg-guide-cols">` +
      `<div><b>Do this</b><ul>${list(steps)}</ul></div>` +
      `<div><b>Sentence frames</b><ul>${list(frames)}</ul></div>` +
      `</div>`;
  };
  proofEntries(variant).forEach((path) => {
    const chip = el(
      "button",
      "sg-guide-chip",
      `${esc(path.label)} <span aria-hidden="true">?</span>`,
    );
    chip.type = "button";
    chip.setAttribute("aria-expanded", "false");
    chip.onclick = () => {
      const closing = openId === path.id;
      openId = closing ? null : path.id;
      if (!closing) renderPanel(path);
      panel.hidden = closing;
      chips.forEach((item) =>
        item.setAttribute("aria-expanded", String(!closing && item === chip)),
      );
    };
    chips.push(chip);
    chipRow.appendChild(chip);
  });
  wrap.append(chipRow, panel);
  return wrap;
}

export function createConsensusLab(config, variant, state, store = null) {
  const fieldset = el("fieldset", "sg-consensus sg-innovation");
  fieldset.setAttribute("aria-label", "Team consensus protocol");
  fieldset.appendChild(el("legend", "sg-innovation-title", "Team consensus protocol"));
  // Anchor the vote to a real problem — the same Turn & Talk question this
  // section is built around — so "which proof is best" is a concrete decision,
  // not an abstract one. Falls back to the toughest practice problem, then a
  // generic prompt, so the protocol still works for lessons without a talk.
  const practice = config.practice || {};
  const problem =
    selectedTalk(config, variant)?.question ||
    practice.extending?.[0]?.stem ||
    practice.onLevel?.[0]?.stem ||
    practice.approaching?.[0]?.stem ||
    "";
  if (problem) {
    const problemCard = el("div", "sg-consensus-problem");
    problemCard.appendChild(
      el("span", "sg-consensus-problem-label", "The team is settling this problem"),
    );
    problemCard.appendChild(el("p", "sg-consensus-problem-stem", esc(problem)));
    fieldset.appendChild(problemCard);
  }
  fieldset.appendChild(
    el(
      "p",
      "sg-innovation-lede",
      problem
        ? "Each voice picks the single best way to prove the answer to the problem above. With a group, pass the device so each choice stays private until all three respond; on your own, cast all three votes as different points of view."
        : "With a group: pass the device so each voice chooses privately — the distribution stays hidden until all three respond. On your own: cast all three votes as different points of view.",
    ),
  );
  const voteBoard = el("div", "sg-vote-board");
  const reveal = el("div", "sg-consensus-reveal", "🔒 0 of 3 voices ready");
  reveal.setAttribute("aria-live", "polite");
  const votes = Array.isArray(state.consensusVotes) ? [...state.consensusVotes] : [];
  const updateReveal = () => {
    const ready = votes.filter(Boolean).length;
    if (ready < 3) reveal.textContent = `🔒 ${ready} of 3 voices ready — choices stay private`;
    else {
      const counts = votes.reduce((all, id) => ({ ...all, [id]: (all[id] || 0) + 1 }), {});
      reveal.classList.add("is-revealed");
      reveal.innerHTML = `<b>Anonymous distribution revealed</b>${Object.entries(counts)
        .map(
          ([id, count]) =>
            `<span>${esc(labelFor(id))} · ${count} ${count === 1 ? "voice" : "voices"}</span>`,
        )
        .join("")}`;
    }
  };
  [1, 2, 3].forEach((voice) => {
    const row = el("div", "sg-vote-row");
    row.appendChild(el("b", null, `Voice ${voice}`));
    const casters = new Map();
    proofEntries(variant).forEach((path) => {
      const button = el("button", "sg-vote-button", esc(path.label));
      button.type = "button";
      button.setAttribute("aria-label", `Voice ${voice} · ${path.label}`);
      const cast = (persist) => {
        votes[voice - 1] = path.id;
        [...row.querySelectorAll("button")].forEach((item) => {
          item.disabled = true;
          item.setAttribute("aria-pressed", String(item === button));
        });
        state.consensusVotes = [...votes];
        if (persist) store?.set("consensusVotes", [...votes]);
        updateReveal();
      };
      button.onclick = () => cast(true);
      casters.set(path.id, cast);
      row.appendChild(button);
    });
    // Restore a voice cast last session — the board stays as they left it.
    const saved = votes[voice - 1];
    if (saved && casters.has(saved)) casters.get(saved)(false);
    voteBoard.appendChild(row);
  });
  const revision = el("fieldset", "sg-revision");
  revision.appendChild(el("legend", "block-lab", "After discussion, what happened?"));
  [
    ["kept", "Kept the position"],
    ["revised", "Revised the position"],
  ].forEach(([value, copy]) => {
    const label = el("label", "sg-radio");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${config.lessonId}-revision`;
    input.value = value;
    input.checked = state.revision === value;
    input.onchange = () => {
      state.revision = value;
      store?.set("revision", value);
    };
    label.append(input, document.createTextNode(copy));
    revision.appendChild(label);
  });
  const reasonLabel = el("label", "block-lab", "Why did your thinking change?");
  const reason = el("textarea", "sg-ta");
  reasonLabel.appendChild(reason);
  reason.value = state.revisionReason || "";
  reason.oninput = () => {
    state.revisionReason = reason.value.trim();
    store?.set("revisionReason", state.revisionReason);
  };
  revision.appendChild(reasonLabel);
  fieldset.append(createConsensusGuide(variant, problem), voteBoard, reveal, revision);
  return fieldset;
}

export function createAdaptiveCoach(variant, state, store = null) {
  const section = el("section", "sg-coach sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Adaptive next-move coach");
  section.innerHTML =
    '<div class="sg-innovation-kicker">Transparent coaching</div><h2>What should I try next?</h2><p>The coach uses only this session’s confidence, attempts, hints, and completed checks. It never labels your ability.</p>';
  const result = el("div", "sg-coach-result");
  result.setAttribute("aria-live", "polite");
  // Tab buttons are id'd `sg-tab-<step.id>` where step.id is already
  // `sg-tab-…`, hence the double prefix (same scheme the Check tab uses).
  const goToTab = (tabId, targetId) => {
    document.getElementById(`sg-tab-${tabId}`)?.click();
    if (targetId)
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const PATH_ACTIONS = {
    stabilize: ["🧰 Supports are open — go to my problems", () => goToTab("sg-tab-practice")],
    connect: ["🔗 Open the Model Lab", () => goToTab("sg-tab-learn", "sg-model")],
    stretch: ["🚀 Jump to More Practice", () => goToTab("sg-tab-more")],
  };
  const render = (path) => {
    state.adaptivePath = path.id;
    store?.set("adaptivePath", path.id);
    // The move is real, not just displayed: practice sections listen for this
    // and open banks/step guides on unsolved problems when stabilizing.
    document.dispatchEvent(new CustomEvent("sg:adaptive-path", { detail: path.id }));
    result.innerHTML = `<div class="sg-path-badge">Recommended next move</div><h3>${esc(path.label)}</h3><p><b>Why:</b> ${esc(path.reason || "You chose a different path that fits you.")}</p><p>${esc(path.prompt)}</p>`;
    const [actionLabel, go] = PATH_ACTIONS[path.id] || [];
    if (actionLabel) {
      const act = el("button", "btn", actionLabel);
      act.type = "button";
      act.onclick = go;
      const actRow = el("div", "row");
      actRow.appendChild(act);
      result.appendChild(actRow);
    }
    const choices = el("div", "sg-coach-choices");
    alternatives()
      .filter((item) => item.id !== path.id)
      .forEach((item) => {
        const button = el("button", "btn ghost", `Choose ${esc(item.label)} instead`);
        button.type = "button";
        button.onclick = () =>
          render({ ...item, reason: "You have agency to choose the support you need." });
        choices.appendChild(button);
      });
    result.appendChild(choices);
  };
  const start = el("button", "btn", "Find our next move");
  start.type = "button";
  start.onclick = () => render(chooseAdaptivePath(state, variant));
  section.append(start, result);
  // Restore last session's move so the coach (and Evidence Card) pick up
  // where the student left off instead of resetting to "not chosen".
  if (state.adaptivePath && PATHS[state.adaptivePath])
    render({
      ...PATHS[state.adaptivePath],
      reason: "Restored from your last session — you can choose again any time.",
    });
  return section;
}

export function createEvidenceCard(config, state) {
  const section = el("section", "sg-evidence-card sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Studio Evidence Card");
  section.hidden = true;
  const refresh = () => {
    const before = Number(state.before || 0);
    const after = Number(state.after || 0);
    const change = after - before;
    const vocabulary = config.vocabulary?.[0]?.term || config.vocabulary?.[0] || "lesson language";
    const proofCell = state.proofPath
      ? `<div><span>Proof path</span><b>${esc(labelFor(state.proofPath))}</b></div>`
      : "";
    section.innerHTML = `<div class="sg-evidence-top"><div><div class="sg-innovation-kicker">Printable learning artifact</div><h2>Studio Evidence Card</h2></div><span>Evidence over points</span></div><p class="sg-evidence-title"><b>${esc(config.title || "Small-Group Math Studio")}</b>${config.standard ? ` · ${esc(config.standard)}` : ""}</p><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div>${proofCell}<div><span>Math language</span><b>${esc(vocabulary)}</b></div><div><span>Discussion move</span><b>${state.revision === "revised" ? "Revised after discussion" : state.revision === "kept" ? "Kept after testing the evidence" : "Talked through out loud"}</b></div><div><span>Adaptive move</span><b>${esc(PATHS[state.adaptivePath]?.label || "Student choice")}</b></div></div>`;
    const print = el("button", "btn ghost", "Print Studio Evidence Card");
    print.type = "button";
    print.onclick = () => printOnly("evidence", section);
    section.appendChild(print);
  };
  return {
    section,
    reveal() {
      refresh();
      section.hidden = false;
    },
  };
}

// One-click study packet: the Evidence Card summary PLUS the student's own
// written work (proof plan, model explanation, apply solution, reflection),
// bundled into a single clean printable takeaway. Reads the persisted studio
// store so it captures everything the student did — even across sessions.
export function createStudioPacket(config, state, store) {
  const section = el("section", "sg-studio-packet");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Studio study packet");
  section.hidden = true;
  const get = (key) => (store?.get(key) || "").trim();
  const refresh = () => {
    const before = Number(state.before || 0);
    const after = Number(state.after || 0);
    const change = after - before;
    const written = [
      ["My plan (proof path)", get("proofResponse")],
      ["What the model shows", get("modelResponse")],
      ["My solution (apply)", get("applyWork")],
      ["One move that helped me", get("growthNote")],
    ].filter(([, value]) => value);
    const work = written.length
      ? written
          .map(
            ([label, value]) =>
              `<div class="sg-packet-block"><span class="block-lab">${esc(label)}</span><p>${esc(value)}</p></div>`,
          )
          .join("")
      : `<p class="sg-packet-empty">Written work you type into the studio will appear here.</p>`;
    section.innerHTML = `<div class="sg-packet-head"><div class="sg-innovation-kicker">Study packet</div><h2>${esc(config.title || "Small-Group Math Studio")}</h2>${config.standard ? `<p class="sg-packet-standard">${esc(config.standard)}</p>` : ""}</div><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div><div><span>Proof path</span><b>${esc(labelFor(state.proofPath))}</b></div></div><div class="sg-packet-work">${work}</div>`;
    const print = el("button", "btn ghost", "Print study packet");
    print.type = "button";
    print.onclick = () => printOnly("packet", section);
    section.appendChild(print);
  };
  return {
    section,
    button() {
      const trigger = el("button", "btn ghost", "🖨 Print my studio packet");
      trigger.type = "button";
      trigger.onclick = () => {
        refresh();
        section.hidden = false;
        printOnly("packet", section);
      };
      return trigger;
    },
  };
}

export function createTeacherEvidenceConsole() {
  const section = el("aside", "sg-facilitation sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Facilitation Console");
  section.innerHTML =
    '<div class="sg-innovation-kicker">Teacher-only · anonymous observation evidence</div><h2>Facilitation Console</h2><p>Notice learning moves, then respond with one purposeful prompt.</p>';
  const signals = [
    ["Students connected representations", "representation"],
    ["Students used precise vocabulary", "vocabulary"],
    ["Students asked a mathematical question", "questioning"],
    ["Students revised after evidence", "revision"],
    ["Students justified a claim", "justification"],
    ["Students transferred the idea", "transfer"],
  ];
  const checks = el("div", "sg-observation-grid");
  const count = el("p", "sg-observation-count", `0 of ${signals.length} evidence signals observed`);
  const move = el(
    "p",
    "sg-teacher-move",
    "Suggested teacher move: Ask, “What does your representation make visible?”",
  );
  signals.forEach(([copy, key]) => {
    const label = el("label", "sg-observation");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = key;
    input.onchange = () => {
      const total = checks.querySelectorAll("input:checked").length;
      count.textContent = `${total} of ${signals.length} evidence signals observed`;
      const next = [...checks.querySelectorAll("input:not(:checked)")][0]?.value;
      const prompts = {
        representation: "Ask, “What does your representation make visible?”",
        vocabulary: "Invite the group to restate its claim with one precise math word.",
        questioning: "Pause and ask each student to pose one evidence-seeking question.",
        revision: "Ask, “What changed your mind, and what evidence caused it?”",
        justification: "Ask the skeptic role to request one more why.",
        transfer: "Change one condition and ask what stays true.",
      };
      move.textContent = `Suggested teacher move: ${prompts[next] || "Celebrate the evidence, then invite transfer to a new case."}`;
    };
    label.append(input, document.createTextNode(copy));
    checks.appendChild(label);
  });
  const print = el("button", "btn ghost", "Print observation summary");
  print.type = "button";
  print.onclick = () => printOnly("facilitation", section);
  section.append(
    checks,
    count,
    move,
    el(
      "p",
      "sg-privacy",
      "🔒 No names or individual responses are transmitted. This console stays on this device.",
    ),
    print,
  );
  return section;
}
