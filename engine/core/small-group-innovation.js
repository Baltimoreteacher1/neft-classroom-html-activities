import { el, esc } from "./small-group-ui.js";

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

export function createProofPathLab(variant, state, store = null) {
  const fieldset = el("fieldset", "sg-proof sg-innovation");
  fieldset.setAttribute("aria-label", "Choose your proof path");
  fieldset.appendChild(el("legend", "sg-innovation-title", "Choose your proof path"));
  fieldset.appendChild(
    el(
      "p",
      "sg-innovation-lede",
      variant === "group2"
        ? "Choose how you will make your claim convincing. You can switch paths as your thinking grows."
        : "Choose how you want to make the idea visible. There is more than one smart way in.",
    ),
  );
  const grid = el("div", "sg-proof-grid");
  const prompt = el("div", "sg-proof-prompt", "Choose a path to reveal your studio prompt.");
  prompt.setAttribute("aria-live", "polite");
  const response = el("textarea", "sg-ta");
  response.setAttribute("aria-label", "Proof path notes");
  response.placeholder = "Sketch, plan, or rehearse your evidence here…";
  response.value = state.proofResponse || "";
  response.oninput = () => {
    state.proofResponse = response.value.trim();
    store?.set("proofResponse", state.proofResponse);
  };
  const buttons = [];
  for (const path of proofEntries(variant)) {
    const button = el(
      "button",
      "sg-proof-button",
      `<span aria-hidden="true">${path.id === "model" ? "▧" : path.id === "explain" ? "✦" : path.id === "test" ? "◉" : "↗"}</span><b>${esc(path.label)}</b>`,
    );
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    const select = (persist) => {
      state.proofPath = path.id;
      if (persist) store?.set("proofPath", path.id);
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      prompt.innerHTML = `<b>${esc(path.label)} mission:</b> ${esc(path.prompt)}`;
      response.placeholder = path.prompt;
    };
    button.onclick = () => select(true);
    buttons.push(button);
    grid.appendChild(button);
    // Restore last session's choice so the Evidence Card stays truthful.
    if (state.proofPath === path.id) select(false);
  }
  fieldset.append(grid, prompt, response);
  return fieldset;
}

export function createConsensusLab(config, variant, state, store = null) {
  const fieldset = el("fieldset", "sg-consensus sg-innovation");
  fieldset.setAttribute("aria-label", "Team consensus protocol");
  fieldset.appendChild(el("legend", "sg-innovation-title", "Team consensus protocol"));
  fieldset.appendChild(
    el(
      "p",
      "sg-innovation-lede",
      "With a group: pass the device so each voice chooses privately — the distribution stays hidden until all three respond. On your own: cast all three votes as different points of view.",
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
  fieldset.append(voteBoard, reveal, revision);
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
    section.innerHTML = `<div class="sg-evidence-top"><div><div class="sg-innovation-kicker">Printable learning artifact</div><h2>Studio Evidence Card</h2></div><span>Evidence over points</span></div><p class="sg-evidence-title"><b>${esc(config.title || "Small-Group Math Studio")}</b>${config.standard ? ` · ${esc(config.standard)}` : ""}</p><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div><div><span>Proof path</span><b>${esc(labelFor(state.proofPath))}</b></div><div><span>Math language</span><b>${esc(vocabulary)}</b></div><div><span>Discussion move</span><b>${state.revision === "revised" ? "Revised after discussion" : state.revision === "kept" ? "Kept after testing the evidence" : "Talked through out loud"}</b></div><div><span>Adaptive move</span><b>${esc(PATHS[state.adaptivePath]?.label || "Student choice")}</b></div></div>`;
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
