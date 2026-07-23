import { selectedTalk } from "./small-group-engagement.js";
import { mathCheckFor } from "./small-group-math-check.js";
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

export function chooseAdaptivePath(state = {}, _variant = "group1") {
  const needsSupport =
    Number(state.before || 0) <= 2 ||
    Number(state.incorrectAttempts || 0) >= 2 ||
    Number(state.hints || 0) >= 2;
  // Any variant can earn the stretch recommendation — a clean, confident
  // catch-up or Foundations session deserves the same invitation Group 2 gets.
  const readyToStretch =
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
    icon: "📊",
    prompt:
      "Draw, diagram, table, number line, or build a concrete model. Label what each part shows.",
  },
  explain: {
    label: "Explain it",
    icon: "💬",
    prompt: "Use precise words: “I know ___ because ___, so ___.”",
  },
  test: {
    label: "Test it",
    icon: "🧪",
    prompt: "Try an example, check every step, and say what the result proves.",
  },
  teach: {
    label: "Teach it",
    icon: "🎓",
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

// Two-column "Do this / Sentence frames" scaffold for one proof method, shared
// by the consensus popovers and the group2 Prove-It flow so both give students
// the same concrete how-to. Group 2 gets the boundary-case steps for "Test it".
function guidanceCols(id, variant) {
  const guide = PROOF_GUIDANCE[id] || {};
  const steps = (variant === "group2" && guide.group2Steps) || guide.steps || [];
  const frames = guide.frames || [];
  if (!steps.length && !frames.length) return "";
  const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join("");
  return (
    `<div class="sg-guide-cols">` +
    `<div><b>Do this</b><ul>${list(steps)}</ul></div>` +
    `<div><b>Sentence frames</b><ul>${list(frames)}</ul></div>` +
    `</div>`
  );
}

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
    panel.innerHTML =
      `<div class="sg-guide-title"><span aria-hidden="true">${path.icon || ""}</span> ${esc(path.label)}</div>` +
      (sample
        ? `<p class="sg-guide-anchor">For the problem above: <i>${esc(sample)}</i></p>`
        : "") +
      guidanceCols(path.id, variant);
  };
  proofEntries(variant).forEach((path) => {
    const chip = el(
      "button",
      "sg-guide-chip",
      `<span aria-hidden="true">${path.icon || ""}</span> ${esc(path.label)} <span aria-hidden="true">?</span>`,
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
      const button = el(
        "button",
        "sg-vote-button",
        `<span aria-hidden="true">${path.icon || ""}</span> ${esc(path.label)}`,
      );
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
    stabilize: ["🧰 Supports open — scaffold problems first", () => goToTab("sg-tab-more")],
    connect: ["🔗 Open the Model Lab", () => goToTab("sg-tab-learn", "sg-model")],
    stretch: ["🚀 Jump to More Practice (stretch set)", () => goToTab("sg-tab-more")],
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

export function createEvidenceCard(config, state, getBand = null) {
  const section = el("section", "sg-evidence-card sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Studio Evidence Card");
  section.hidden = true;
  const refresh = () => {
    const before = Number(state.before || 0);
    const after = Number(state.after || 0);
    const change = after - before;
    const vocabulary = config.vocabulary?.[0]?.term || config.vocabulary?.[0] || "lesson language";
    const strategyCell = state.mathCheckDone
      ? `<div><span>Math check</span><b>${esc(mathCheckFor(config).title)}</b></div>`
      : "";
    const discussionMove = state.mathCheckDone
      ? "Connected the result to the topic"
      : state.revision === "revised"
        ? "Revised after discussion"
        : state.revision === "kept"
          ? "Kept after testing the evidence"
          : "Talked through out loud";
    const band = getBand?.();
    const bandCell = band
      ? `<div><span>Today's band</span><b>${band.emoji || ""} ${esc(band.label)}</b></div>`
      : "";
    section.innerHTML = `<div class="sg-evidence-top"><div><div class="sg-innovation-kicker">Printable learning artifact</div><h2>Studio Evidence Card</h2></div><span>Evidence over points</span></div><p class="sg-evidence-title"><b>${esc(config.title || "Small-Group Math Studio")}</b>${config.standard ? ` · ${esc(config.standard)}` : ""}</p><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div>${bandCell}${strategyCell}<div><span>Math language</span><b>${esc(vocabulary)}</b></div><div><span>Discussion move</span><b>${discussionMove}</b></div><div><span>Adaptive move</span><b>${esc(PATHS[state.adaptivePath]?.label || "Student choice")}</b></div><div><span>Best streak</span><b>${Number(state.bestStreak) >= 2 ? `🔥 ${Number(state.bestStreak)} in a row` : "Steady effort"}</b></div></div>`;
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
// written work (math check, model explanation, apply solution, reflection),
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
      ["My challenge solution", get("mathSolveWork")],
      ["How I checked the math", get("mathCheckWork")],
      ["What my result means", get("mathCheckMeaning")],
      ["What the model shows", get("modelResponse")],
      ["My solution (apply)", get("applyWork")],
      ["My exit-ticket reasoning", get("checkExplainResponse")],
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
    const strategy = get("mathCheckWork")
      ? `<div><span>Math check</span><b>${esc(mathCheckFor(config).title)}</b></div>`
      : state.adaptivePath && PATHS[state.adaptivePath]
        ? `<div><span>Adaptive move</span><b>${esc(PATHS[state.adaptivePath].label)}</b></div>`
        : "";
    section.innerHTML = `<div class="sg-packet-head"><div class="sg-innovation-kicker">Study packet</div><h2>${esc(config.title || "Small-Group Math Studio")}</h2>${config.standard ? `<p class="sg-packet-standard">${esc(config.standard)}</p>` : ""}</div><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div>${strategy}</div><div class="sg-packet-work">${work}</div>`;
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

// Live per-device evidence strip: the studio `state` the console previously
// discarded, surfaced as a small stat row that refreshes while students work.
// Presentation-only — reads state, never writes it.
function deviceEvidenceStrip(state, getBand) {
  const strip = el("div", "sg-console-device");
  strip.setAttribute("aria-live", "off");
  const render = () => {
    const attempts = Number(state.attempts) || 0;
    const incorrect = Number(state.incorrectAttempts) || 0;
    const band = getBand?.();
    strip.innerHTML =
      `<span class="sg-console-device-label">This device, live:</span>` +
      `<b>${Number(state.solved) || 0}</b> solved · ` +
      `<b>${attempts}</b> attempts (${incorrect} missed) · ` +
      `<b>${Number(state.hints) || 0}</b> hints · ` +
      `confidence <b>${state.before || "—"}→${state.after || "—"}</b>` +
      (band ? ` · <b>${band.emoji || ""} ${esc(band.label)}</b>` : "");
  };
  render();
  const timer = window.setInterval(() => {
    if (strip.isConnected) render();
    else window.clearInterval(timer);
  }, 5000);
  return strip;
}

// Cross-device class view: aggregate, name-free completion evidence for this
// base lesson from /api/progress/small-group-summary (counts and averages
// only — individual events never leave the endpoint). Loads on demand.
function classEvidenceBlock(config) {
  const base = String(config.lessonId || "").replace(/-(?:group[12]|catchup)$/, "");
  if (!base) return null;
  const block = el("div", "sg-console-class");
  const status = el("p", "sg-console-class-status", "");
  status.setAttribute("aria-live", "polite");
  const rows = el("div", "sg-console-class-rows");
  const load = async () => {
    status.textContent = "Loading class evidence…";
    rows.innerHTML = "";
    try {
      const response = await fetch(
        `/api/progress/small-group-summary?lesson=${encodeURIComponent(base)}`,
        { credentials: "omit" },
      );
      const data = response.ok ? await response.json() : null;
      const groups = data?.ok ? data.groups || [] : null;
      if (!groups) {
        status.textContent = "Class evidence is unavailable right now.";
        return;
      }
      if (!groups.length) {
        status.textContent = "No studio completions recorded for this lesson yet.";
        return;
      }
      status.textContent = `Completions for lesson ${base}, by section (last 14 days):`;
      for (const group of groups) {
        rows.appendChild(
          el(
            "div",
            "sg-console-class-row",
            `<b>${esc(group.section || "—")}</b> · ${esc(group.variant || "")} · ` +
              `${Number(group.completions) || 0} done · ${Number(group.inProgress) || 0} in progress · ` +
              `avg ${Number(group.avgSolved) || 0}/${Number(group.avgTotal) || 0} solved · ` +
              `${Number(group.hintHeavy) || 0} hint-heavy`,
          ),
        );
      }
    } catch {
      status.textContent = "Class evidence is unavailable right now.";
    }
  };
  const row = el("div", "row");
  const refresh = el("button", "btn ghost", "🔄 Load class evidence");
  refresh.type = "button";
  refresh.onclick = () => {
    refresh.textContent = "🔄 Refresh class evidence";
    load();
  };
  const dashboard = el("a", "btn ghost", "Open mastery dashboard →");
  dashboard.href = "/teacher-tools/mastery/";
  row.append(refresh, dashboard);
  block.append(row, status, rows);
  return block;
}

// Publisher teacher-edition staple: an "anticipated responses" table so the
// teacher walks in knowing the wrong turns for THIS lesson and how to respond.
// Derivation-only (no config authoring): the richest signals already in every
// config are (a) the common-mistake prose, (b) error-analysis items — each a
// labeled mistaken step plus its authored repair (correctWork), and (c) MC
// distractors that carry real per-choice feedback. Teacher-only.
const FILLER_FEEDBACK = /^re-?read the problem carefully/i;

function collectAnticipated(config) {
  const practice = config.practice || {};
  const rows = [];
  const tiers = ["approaching", "onLevel", "extending", "optional"];
  // Error-analysis items are the strongest signal: a named wrong step + repair.
  for (const tier of tiers) {
    for (const item of practice[tier] || []) {
      if (item.type !== "error-analysis" || !Array.isArray(item.workedExample)) continue;
      const step = item.workedExample[item.errorStep];
      if (!step) continue;
      const wrong = [step.label, step.work].filter(Boolean).join(" — ");
      const fix = item.correctWork || item.explanation || "";
      if (wrong && fix) rows.push({ kind: "Common error", wrong, fix });
    }
  }
  // MC distractors with genuine (non-filler) feedback → likely-choice rationale.
  for (const tier of tiers) {
    for (const item of practice[tier] || []) {
      if (item.type !== "multiple-choice" || !Array.isArray(item.choices)) continue;
      const feedback = item.choiceFeedback || [];
      item.choices.forEach((choice, index) => {
        if (index === item.correctIndex) return;
        const note = (feedback[index] || "").trim();
        if (!note || FILLER_FEEDBACK.test(note)) return;
        rows.push({ kind: "Likely wrong choice", wrong: `“${choice}”`, fix: note });
      });
    }
  }
  return rows;
}

export function createMisconceptionCard(config = {}) {
  const mistake = config.practice?.commonMistake;
  const mistakeText =
    typeof mistake === "string" ? mistake : mistake?.text || mistake?.mistake || "";
  const rows = collectAnticipated(config).slice(0, 8);
  if (!mistakeText && !rows.length) return null;
  const section = el("aside", "sg-misconceptions sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Misconceptions and anticipated responses");
  let html =
    '<div class="sg-innovation-kicker">Teacher-only · anticipated responses</div>' +
    "<h2>Misconceptions &amp; anticipated responses</h2>";
  if (mistakeText) {
    html += `<p class="sg-misconception-lead"><b>Watch for:</b> ${esc(mistakeText)}</p>`;
  }
  if (rows.length) {
    const body = rows
      .map(
        (row) =>
          `<tr><td class="sg-mis-kind">${esc(row.kind)}</td>` +
          `<td class="sg-mis-wrong">${esc(row.wrong)}</td>` +
          `<td class="sg-mis-fix">${esc(row.fix)}</td></tr>`,
      )
      .join("");
    html +=
      '<div class="sg-mis-scroll"><table class="sg-mis-table">' +
      '<caption class="sr-only">Anticipated wrong answers and how to respond</caption>' +
      '<thead><tr><th scope="col">Type</th><th scope="col">Anticipated response</th>' +
      '<th scope="col">Name it &amp; respond</th></tr></thead>' +
      `<tbody>${body}</tbody></table></div>`;
  }
  html +=
    '<p class="sg-privacy">Pull one of these into the discussion: show the wrong turn, ask the group to spot and repair it — the studio\'s error-analysis items do exactly this.</p>';
  section.innerHTML = html;
  return section;
}

export function createTeacherEvidenceConsole(config = {}, state = {}, getBand = null) {
  const section = el("aside", "sg-facilitation sg-innovation");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Facilitation Console");
  section.innerHTML =
    '<div class="sg-innovation-kicker">Teacher-only · anonymous observation evidence</div><h2>Facilitation Console</h2><p>Notice learning moves, then respond with one purposeful prompt.</p>';
  section.appendChild(deviceEvidenceStrip(state, getBand));
  const classBlock = classEvidenceBlock(config);
  if (classBlock) section.appendChild(classBlock);
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
      "🔒 No names or individual responses are transmitted. Observation checks stay on this device; class evidence is anonymous section-level counts only.",
    ),
    print,
  );
  return section;
}
