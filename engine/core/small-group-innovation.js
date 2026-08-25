import { topMisconceptions } from "./misconceptions.js";
import { selectedTalk } from "./small-group-engagement.js";
import { mathCheckFor } from "./small-group-math-check.js";
import { el, esc } from "./small-group-ui.js";
import { firstVocabularyWord } from "./vocab-match.js";

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

/** Distinct problems a student must miss before supports open by themselves. */
export const AUTO_SUPPORT_DISTINCT_MISSES = 2;

/**
 * Decides when a practice set should open its own supports.
 *
 * Two separate rules were already in place and neither covered this case. A
 * single card opens its bank and step guide on the second try of THAT card
 * (small-group-practice.js), which handles one tricky problem. The coach's
 * "stabilize" move opens supports across the whole set — but only when a
 * student taps "Find our next move", which most never do. So a student missing
 * problem after problem worked an unscaffolded set the entire time.
 *
 * The signal that the SET is too hard, rather than one item, is breadth: misses
 * spread across different problems. Repeat misses on a single card are already
 * handled and deliberately do not count here, or hammering one hard problem
 * would scaffold eleven others that were going fine.
 *
 * Fires exactly once. Escalation is one-way and support-only — this never
 * withdraws support and never promotes a student to the stretch path, because
 * it acts without being asked and only adding help is safe to do unasked.
 */
export function createAutoSupportTracker(threshold = AUTO_SUPPORT_DISTINCT_MISSES) {
  const missed = new Set();
  let fired = false;
  return {
    /** @returns {boolean} true on the single attempt that crosses the threshold. */
    recordAttempt({ correct = false, key = null } = {}) {
      if (fired || correct) return false;
      const id = key == null ? "" : String(key);
      if (!id) return false;
      missed.add(id);
      if (missed.size < threshold) return false;
      fired = true;
      return true;
    },
    get missedCount() {
      return missed.size;
    },
    get fired() {
      return fired;
    },
  };
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

// Which family of problem the team is settling. Guidance that says "draw it"
// for every stem is guidance a student cannot act on, so the panel below picks
// steps that name the actual moves for THIS problem type. Order matters: the
// first pattern that matches wins, so the narrow shapes are listed first and a
// stem that matches nothing falls back to the generic steps rather than being
// forced into a wrong one.
const PROBLEM_KINDS = [
  {
    id: "geometry",
    test: /\b(area|perimeter|volume|surface area|triangle|rectangle|parallelogram|trapezoid|prism|polygon|base|height)\b/i,
  },
  { id: "ratio", test: /\b(ratio|rate|unit rate|proportion|percent|per\s|tax|tip|discount)\b|%/i },
  {
    id: "fraction",
    test: /\b(fraction|numerator|denominator|mixed number|reciprocal)\b|\d\s*\/\s*\d/i,
  },
  { id: "decimal", test: /\b(decimal|tenths?|hundredths?|thousandths?)\b|\d+\.\d/i },
  {
    id: "integer",
    test: /\b(integer|negative|opposite|absolute value|number line|below zero)\b|−|-\d/i,
  },
  { id: "equation", test: /\b(solve|equation|expression|variable|evaluate|substitute)\b/i },
];

function classifyProblem(stem) {
  const text = String(stem || "");
  return PROBLEM_KINDS.find((kind) => kind.test.test(text))?.id || "generic";
}

// Short, ESOL-friendly "how to do it" guidance for each proof method. `steps`
// is the fallback; `byKind` sharpens it for the problem the team is actually
// settling. Every step is one action in plain language — enough to start, not
// enough to hand over the answer, which is the whole point: a step that reads
// "the answer is 24 because…" would end the discussion this protocol exists to
// start.
const PROOF_GUIDANCE = {
  model: {
    steps: [
      "Draw the problem — a picture, table, number line, or diagram.",
      "Label each part with what it stands for.",
      "Point to the spot in your drawing where the answer appears.",
    ],
    byKind: {
      fraction: [
        "Draw one bar (or circle) for each fraction, split into equal parts.",
        "Shade the parts the problem names. Write the fraction under each bar.",
        "Line the bars up and point to what the drawing shows.",
      ],
      decimal: [
        "Draw a place-value chart: ones, tenths, hundredths.",
        "Write each number in the chart so the decimal points line up.",
        "Point to the column that decides your answer.",
      ],
      ratio: [
        "Draw a two-row tape diagram or a ratio table with both labels.",
        "Fill in the pair the problem gives you, then scale up or down step by step.",
        "Circle the column that answers the question.",
      ],
      geometry: [
        "Sketch the shape and label every measurement the problem gives.",
        "Mark the base and the height (or each face) so nothing is mixed up.",
        "Write the formula next to the sketch and show where each number goes.",
      ],
      integer: [
        "Draw a number line with 0 in the middle.",
        "Mark each number, then draw the arrow for the move.",
        "Point to where the arrow lands — that is your answer.",
      ],
      equation: [
        "Draw a balance (or bar model) with both sides of the equation.",
        "Show what you take away or add to BOTH sides.",
        "Point to the step where the variable is alone.",
      ],
    },
    frames: ["This part of my drawing shows ___.", "The answer is here because ___."],
  },
  explain: {
    steps: [
      "Say your steps out loud, in order: first, next, last.",
      "Name the rule or math idea you used.",
      "Say why that rule fits THIS problem.",
    ],
    byKind: {
      fraction: [
        "Say what the numerator and the denominator each mean here.",
        "Explain the step where the denominators become the same — and why.",
        "Say what your answer means back in the story.",
      ],
      decimal: [
        "Say which place value each digit is in.",
        "Explain how you knew where the decimal point goes in the answer.",
        "Estimate out loud to show your answer is reasonable.",
      ],
      ratio: [
        "Say the ratio in words: “___ for every ___.”",
        "Explain the number you multiplied or divided by, and why.",
        "Say what one unit is worth.",
      ],
      geometry: [
        "Name the shape and the formula you chose.",
        "Explain which measurement is the base and which is the height.",
        "Say the units of your answer and why (units, square units, cubic units).",
      ],
      integer: [
        "Say which direction each number moves you on the number line.",
        "Explain the sign of your answer.",
        "Say what the negative number means in the situation.",
      ],
      equation: [
        "Say what the variable stands for.",
        "Explain the inverse operation you used to undo each step.",
        "Say why doing it to both sides keeps the equation true.",
      ],
    },
    frames: ["I know ___ because ___, so ___.", "First ___, then ___, which means ___."],
  },
  test: {
    steps: [
      "Put your answer back into the problem and re-check every step.",
      "Estimate: is your answer about the size you expected?",
      "Try one more example to be sure the method holds.",
    ],
    group2Steps: [
      "Pick a boundary case — a 0, a 1, a negative, or a very large number.",
      "Run your method on it and watch what happens.",
      "Show it still works, or find exactly where it breaks.",
    ],
    byKind: {
      fraction: [
        "Check that every fraction is in its simplest form.",
        "Estimate with benchmarks (0, 1/2, 1): is your answer near where it should be?",
        "Redo one step a different way and see if you land in the same place.",
      ],
      decimal: [
        "Round both numbers and estimate — compare that to your answer.",
        "Count the decimal places and check where the point landed.",
        "Work the problem backward to see if you get the starting number.",
      ],
      ratio: [
        "Cross-check the two ratios: do they simplify to the same thing?",
        "Test your unit rate on a second row of the table.",
        "Ask: should the answer be bigger or smaller than the start? Does it match?",
      ],
      geometry: [
        "Recount every measurement against the picture.",
        "Check the units — did area come out in square units?",
        "Try the formula on a simple shape you already know, to be sure you used it right.",
      ],
      integer: [
        "Check your answer on the number line — is it on the correct side of 0?",
        "Try the opposite move and see if you return to the start.",
        "Ask: should this answer be positive or negative? Does it match?",
      ],
      equation: [
        "Substitute your answer back into the original equation.",
        "Work out both sides separately — do they match?",
        "Try one nearby number and show it does NOT work.",
      ],
    },
    frames: ["When I check it, I get ___.", "This proves ___ because ___."],
  },
  teach: {
    steps: [
      "Plan a 30-second explanation for a partner.",
      "Decide the ONE step people get wrong, and slow that step down.",
      "End with a question that checks they understood.",
    ],
    byKind: {
      fraction: [
        "Plan how you will show what the denominator means.",
        "Warn your partner about the step people rush — and show it slowly.",
        "Ask: “Why did the denominators have to match?”",
      ],
      decimal: [
        "Plan how you will show lining up the place values.",
        "Point out where the decimal point goes, and why.",
        "Ask: “Where does the decimal point go, and how do you know?”",
      ],
      ratio: [
        "Plan how you will say the ratio in words first.",
        "Show the scaling step slowly, with the number you multiplied by.",
        "Ask: “What is the value of one ___?”",
      ],
      geometry: [
        "Plan how you will point to the base and the height on the picture.",
        "Show why the formula fits this shape.",
        "Ask: “Why is the answer in square units?”",
      ],
      integer: [
        "Plan how you will use the number line to show the move.",
        "Slow down on how you decided the sign.",
        "Ask: “Which way do we move, and why?”",
      ],
      equation: [
        "Plan how you will show what stays balanced.",
        "Slow down on the inverse operation.",
        "Ask: “Why do we do it to both sides?”",
      ],
    },
    frames: ["The key step is ___.", "Check — can you tell me why ___?"],
  },
};

// Simple, high-contrast line art per method. Decorative and aria-hidden — the
// steps carry the meaning — but for an ESOL reader the picture is what makes
// "Model it" vs "Teach it" readable before the words are.
const PROOF_ART = {
  model:
    '<rect x="6" y="10" width="30" height="34" rx="4"/><path d="M12 38v-9M20 38V22M28 38v-14"/><path d="M44 14h26M44 24h26M44 34h18"/>',
  explain:
    '<path d="M6 12h40a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-10 9V38H6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" transform="translate(6 2)"/><path d="M18 22h22M18 30h14"/>',
  test: '<path d="M22 6h12M26 6v14L14 42a4 4 0 0 0 3 6h22a4 4 0 0 0 3-6L30 20V6"/><path d="M18 34h20"/><circle cx="24" cy="40" r="2"/><circle cx="33" cy="39" r="3"/>',
  teach:
    '<path d="M28 8 6 18l22 10 22-10z"/><path d="M14 23v11c0 4 6 7 14 7s14-3 14-7V23"/><path d="M50 18v14"/>',
};

function proofArt(id) {
  const art = PROOF_ART[id];
  if (!art) return "";
  return (
    `<svg class="sg-guide-art" viewBox="0 0 76 52" role="presentation" aria-hidden="true" ` +
    `fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${art}</svg>`
  );
}

/** Steps for one method, sharpened to the problem type when we recognise it. */
function stepsFor(id, variant, kind) {
  const guide = PROOF_GUIDANCE[id] || {};
  if (variant === "group2" && guide.group2Steps) return guide.group2Steps;
  return guide.byKind?.[kind] || guide.steps || [];
}

// Two-column "Do this / Sentence frames" scaffold for one proof method, shared
// by the consensus panel and the group2 Prove-It flow so both give students the
// same concrete how-to. Group 2 gets the boundary-case steps for "Test it".
function guidanceCols(id, variant, kind = "generic") {
  const steps = stepsFor(id, variant, kind);
  const frames = PROOF_GUIDANCE[id]?.frames || [];
  if (!steps.length && !frames.length) return "";
  return (
    `<div class="sg-guide-cols">` +
    `<div><b>Do this</b><ol>${steps.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></div>` +
    `<div><b>Sentence frames</b><ul>${frames.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>` +
    `</div>`
  );
}

/**
 * The guidance panel that opens under the choice row. It is deliberately NOT a
 * worked solution: it names the moves for this method on this kind of problem
 * and hands over sentence frames, then stops. The student still has to do the
 * mathematics — which is what they will have to defend to the table.
 */
function createGuidancePanel(variant, problem) {
  const panel = el("div", "sg-guide-panel");
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  const kind = classifyProblem(problem);
  return {
    node: panel,
    show(path) {
      panel.innerHTML =
        `<div class="sg-guide-head">${proofArt(path.id)}` +
        `<div><div class="sg-guide-title">${esc(path.label)} — how to do it</div>` +
        (problem ? `<p class="sg-guide-anchor">For this problem: <i>${esc(problem)}</i></p>` : "") +
        `</div></div>` +
        guidanceCols(path.id, variant, kind) +
        `<p class="sg-guide-foot">These are starting moves, not the answer. Do the math yourself, then be ready to defend it.</p>`;
      panel.hidden = false;
    },
    hide() {
      panel.hidden = true;
    },
  };
}

/**
 * ONE row with every proof method on it. Tapping a method both records the
 * choice and opens its how-to panel — the previous design split those apart
 * (a chip row that only explained, and a separate three-voice board that only
 * voted), which meant the student who most needed the steps had already voted
 * blind by the time they found them.
 */
function createProofChoiceRow({ variant, problem, initial, onPick, lockOnPick = false }) {
  const wrap = el("div", "sg-proof-choice");
  const row = el("div", "sg-proof-row");
  const guide = createGuidancePanel(variant, problem);
  const buttons = new Map();
  const select = (path, persist) => {
    buttons.forEach((button, id) => {
      button.setAttribute("aria-pressed", String(id === path.id));
      // A live table commits once, so the row freezes — but the steps stay open,
      // because the student needs them AFTER committing, not before.
      if (lockOnPick) button.disabled = true;
    });
    guide.show(path);
    onPick?.(path, persist);
  };
  proofEntries(variant).forEach((path) => {
    const button = el(
      "button",
      "sg-proof-button sg-vote-button",
      `<span class="sg-proof-icon" aria-hidden="true">${path.icon || ""}</span>` +
        `<span class="sg-proof-label">${esc(path.label)}</span>` +
        `<span class="sg-proof-hint">Tap for steps</span>`,
    );
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => select(path, true);
    buttons.set(path.id, button);
    row.appendChild(button);
  });
  wrap.append(row, guide.node);
  // Restore a choice made last session — including its guidance panel, so a
  // returning student picks up mid-thought instead of at a blank board.
  const saved = proofEntries(variant).find((path) => path.id === initial);
  if (saved) select(saved, false);
  return { node: wrap };
}

/**
 * Live board for a real table: this seat casts ONE vote, then the studio waits
 * for the other seats and reveals the true distribution. No early reveal — the
 * whole pedagogical point is that you commit before you know what anyone else
 * said, so the disagreement that follows is real.
 */
function liveConsensusBoard(config, variant, state, store, room, problem) {
  const wrap = el("div", "sg-vote-board sg-vote-live");
  const status = el("div", "sg-consensus-reveal", `🔒 Waiting for your table…`);
  status.setAttribute("aria-live", "polite");
  const itemKey = `consensus:${config.lessonId || "lesson"}`;
  wrap.appendChild(el("div", "sg-seat-label", `Your seat (${room.seat()})`));

  let stop = null;
  const paint = (data) => {
    if (!data) return;
    if (!data.revealed) {
      status.classList.remove("is-revealed");
      status.textContent = `🔒 ${data.committed} of ${data.seats} seats ready — choices stay private`;
      return;
    }
    // Real distribution from real people. Persisted onto state so the
    // "convince a skeptic" step can name an actual peer position instead of a
    // canned objection.
    const counts = {};
    data.answers.forEach(({ answer }) => {
      counts[answer] = (counts[answer] || 0) + 1;
    });
    state.roomConsensus = { mine: state.consensusVotes?.[0] || null, answers: data.answers };
    store?.set("roomConsensus", state.roomConsensus);
    status.classList.add("is-revealed");
    const spread = Object.keys(counts).length;
    status.innerHTML =
      `<b>${spread > 1 ? "Your table disagrees — that is the discussion" : "Your table agrees"}</b>` +
      Object.entries(counts)
        .map(
          ([id, count]) =>
            `<span>${esc(labelFor(id))} · ${count} ${count === 1 ? "seat" : "seats"}</span>`,
        )
        .join("");
  };

  const choice = createProofChoiceRow({
    variant,
    problem,
    initial: state.consensusVotes?.[0] || null,
    lockOnPick: true,
    onPick: async (path, persist) => {
      state.consensusVotes = [path.id];
      if (persist) {
        store?.set("consensusVotes", [path.id]);
        await room.commit(itemKey, path.id);
      }
      status.textContent = "🔒 Locked in. Waiting for the rest of your table…";
      stop?.();
      stop = room.watch(itemKey, paint);
    },
  });
  wrap.append(choice.node, status);
  // A returning student who already committed should see the live state at once.
  if (state.consensusVotes?.[0]) {
    stop?.();
    stop = room.watch(itemKey, paint);
  }
  return wrap;
}

export function createConsensusLab(config, variant, state, store = null, room = null) {
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
  // A real table gets a real board: one seat, one vote, revealed only when every
  // seat has committed. Solo gets the same single row — the old simulated
  // "Voice 1 / Voice 2 / Voice 3" board asked one student to cast three votes
  // against themselves, which is a ritual of collaboration rather than
  // collaboration, and it buried the how-to steps behind a separate chip row.
  const live = room?.active?.()
    ? liveConsensusBoard(config, variant, state, store, room, problem)
    : null;
  fieldset.appendChild(
    el(
      "p",
      "sg-innovation-lede",
      live
        ? `Everyone at table ${esc(room.code())} picks the single best way to prove the answer${problem ? " to the problem above" : ""}. Your choice stays private until every seat has committed — then all of them appear at once.`
        : `Pick the single best way to prove the answer${problem ? " to the problem above" : ""}. Tap a choice to see how to do it, step by step. You still do the math — then be ready to defend your choice to the group.`,
    ),
  );
  if (live) {
    fieldset.appendChild(live);
  }
  const soloBoard = el("div", "sg-vote-board");
  const reveal = el("div", "sg-consensus-reveal", "Choose a method above to get your steps.");
  reveal.setAttribute("aria-live", "polite");
  if (!live) {
    soloBoard.appendChild(
      createProofChoiceRow({
        variant,
        problem,
        initial: state.consensusVotes?.[0] || null,
        onPick: (path, persist) => {
          state.consensusVotes = [path.id];
          if (persist) store?.set("consensusVotes", [path.id]);
          reveal.classList.add("is-revealed");
          reveal.innerHTML = `<b>Your method: ${esc(path.label)}</b><span>Work the steps, then say why this method proves it best.</span>`;
        },
      }).node,
    );
  }
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
  // With a real table the live board above IS the choice row, steps included.
  if (live) fieldset.appendChild(revision);
  else fieldset.append(soloBoard, reveal, revision);
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
    // "Math language" on the evidence card names a word the student used, so
    // it must skip the lesson-concept statement that sits at vocabulary[0] on
    // most lessons — printing "Solve and Graph Inequalities" there described
    // the lesson, not the language.
    const chosen = firstVocabularyWord(config.vocabulary);
    const vocabulary =
      (chosen && typeof chosen === "object" ? chosen.term : chosen) || "lesson language";
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
    // The most useful line on this card is not what went right — it is the one
    // named thing to practise. Shown only when the detector identified a
    // specific mechanism, so the card never invents a weakness.
    const focus = topMisconceptions(state.misconceptions, 1)[0];
    const focusCell = focus
      ? `<div><span>Practise next</span><b>${esc(focus.label)}</b></div>`
      : "";
    const band = getBand?.();
    const bandCell = band
      ? `<div><span>Today's band</span><b>${band.emoji || ""} ${esc(band.label)}</b></div>`
      : "";
    section.innerHTML = `<div class="sg-evidence-top"><div><div class="sg-innovation-kicker">Printable learning artifact</div><h2>Studio Evidence Card</h2></div><span>Evidence over points</span></div><p class="sg-evidence-title"><b>${esc(config.title || "Small-Group Math Studio")}</b>${config.standard ? ` · ${esc(config.standard)}` : ""}</p><div class="sg-evidence-grid"><div><span>Confidence journey</span><b>${before || "—"} → ${after || "—"}${change > 0 ? ` (+${change})` : ""}</b></div>${bandCell}${strategyCell}<div><span>Math language</span><b>${esc(vocabulary)}</b></div><div><span>Discussion move</span><b>${discussionMove}</b></div><div><span>Adaptive move</span><b>${esc(PATHS[state.adaptivePath]?.label || "Student choice")}</b></div><div><span>Best streak</span><b>${Number(state.bestStreak) >= 2 ? `🔥 ${Number(state.bestStreak)} in a row` : "Steady effort"}</b></div>${focusCell}</div>`;
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
    // Named misconceptions, with the move to make about them. This is the line
    // a teacher can actually act on mid-rotation: "3 missed item 4" tells you
    // nothing, "added the denominators (2×) — go back to the bar model" does.
    const named = topMisconceptions(state.misconceptions, 2);
    if (named.length) {
      strip.innerHTML += `<div class="sg-console-watch"><span class="sg-console-device-label">Watch for:</span>${named
        .map(
          (entry) =>
            `<span class="sg-console-watch-item"><b>${esc(entry.label)}</b>${
              entry.count > 1 ? ` ×${entry.count}` : ""
            } — ${esc(entry.watchFor)}</span>`,
        )
        .join("")}</div>`;
    }
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
