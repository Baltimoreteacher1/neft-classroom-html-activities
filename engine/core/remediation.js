import { interventionFor } from "./misconception-interventions.js";
import { misconceptionLabel, studentExplanation } from "./misconceptions.js";

// The ladder a student walks after a miss. Two orders, not one, because the
// right first move depends on whether we know WHY they missed.
//
//   GENERIC — we only know the answer was wrong. Start with a nudge back to the
//   problem, then escalate: worked example, guided steps, an easier retry.
//
//   DIAGNOSED — the misconception engine named the specific error (it names one
//   only when exactly one predicted wrong result matches, so a tag here means
//   one thing). The generic "reread the problem" rung is then actively worse
//   than nothing: it spends a retry telling a student who inverted a ratio to
//   read more carefully, which is not their problem. So the diagnosed ladder
//   OPENS on the named error in student voice and is one rung shorter — the
//   student who shows a known, addressed error gets back to the mathematics
//   sooner, and clearing it is real evidence rather than a second guess.
//   The diagnosed ladder has TWO levels of misconception support, not one.
//   `diagnosis` names the error in student voice — enough for a student who
//   mis-stepped. `intervention` is what happens when that was not enough: a
//   micro-task on tiny numbers where the error cannot hide (see
//   misconception-interventions.js). Another sentence would be the wrong
//   instrument at that point; the student has already shown that reading about
//   the error did not shift it.
//
//   `level1Shown` exists because the item's OWN feedback often already showed
//   the diagnosis — multiple-choice.js prints the named error as a chip plus the
//   student-voice sentence and offers its own retry. When that has happened, the
//   panel must not repeat it: two cards saying the same thing, each with its own
//   retry button, is worse than one. The ladder then opens at `intervention`,
//   which makes the panel purely additive.
const STEP_ORDER = ["hint", "worked-example", "guided", "retry-easier", "done"];
const DIAGNOSED_STEP_ORDER = ["diagnosis", "intervention", "guided", "retry-easier", "done"];

function clampInt(n, lo, hi) {
  n = Math.round(Number(n));
  if (Number.isNaN(n)) n = lo;
  return Math.max(lo, Math.min(hi, n));
}

function firstSentence(text) {
  if (!text) return "";
  const m = String(text).match(/[^.!?]+[.!?]?/);
  return (m ? m[0] : String(text)).trim();
}

export function deriveHint(question) {
  if (Array.isArray(question.hints) && question.hints.length) {
    return { text: question.hints[0], hints: question.hints.slice() };
  }
  if (question.hint) {
    return { text: question.hint, hints: [question.hint] };
  }
  if (question.explanation) {
    const lead = firstSentence(question.explanation);
    return {
      text: `Think about this: ${lead}`,
      hints: [`Think about this: ${lead}`],
    };
  }
  const stem = question.stem || question.title || question.prompt || "";
  return {
    text: stem
      ? `Reread the problem carefully and underline what is being asked: "${stem}"`
      : "Reread the problem carefully and identify exactly what is being asked.",
    hints: [],
  };
}

/**
 * The opening rung when the misconception engine named the error.
 *
 * Everything it says is authored content that already exists in the taxonomy —
 * `student` (what the learner reads instead of "Not quite", written to name the
 * thinking without blaming the thinker and to stop short of stating the answer)
 * and `label` (the short name of the error). Nothing here invents mathematics
 * or paraphrases the item, because a diagnosis the student can argue with is
 * worse than no diagnosis.
 *
 * Returns null when the tag is unknown, so a typo or a retired tag degrades to
 * the generic ladder rather than rendering an empty card.
 */
export function deriveDiagnosis(question, misconception, lang = "en") {
  if (!misconception) return null;
  const text = studentExplanation(misconception, lang);
  if (!text) return null;
  return {
    tag: misconception,
    label: misconceptionLabel(misconception, lang) || "",
    text,
    // The authored hints still exist and are still useful — they just stop
    // being the FIRST thing said. Offered here as the follow-on nudge.
    hints: Array.isArray(question?.hints)
      ? question.hints.slice()
      : question?.hint
        ? [question.hint]
        : [],
  };
}

function numbersIn(text) {
  return (String(text).match(/-?\d+(\.\d+)?/g) || []).map(Number);
}

export function buildWorkedExample(question) {
  if (
    Array.isArray(question.workedExample) &&
    question.workedExample.length &&
    typeof question.errorStep === "number"
  ) {
    return {
      title: question.title || "Step-by-step example",
      steps: question.workedExample.map((s) => ({
        label: s.label,
        work: s.work,
      })),
      conclusion: question.correctWork || question.explanation || "",
    };
  }

  const stem = question.stem || question.prompt || question.title || "";
  const steps = [];
  if (stem) steps.push({ label: "Understand the problem", work: stem });

  const exp = question.explanation || "";
  if (exp) {
    String(exp)
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length)
      .slice(0, 4)
      .forEach((sentence, i) => steps.push({ label: `Step ${i + 1}`, work: sentence.trim() }));
  }

  if (
    question.type === "multiple-choice" &&
    Array.isArray(question.choices) &&
    typeof question.correctIndex === "number"
  ) {
    const letter = ["A", "B", "C", "D", "E"][question.correctIndex] || "?";
    steps.push({
      label: "The correct answer",
      work: `${letter}: ${question.choices[question.correctIndex]}`,
    });
  }

  if (!steps.length) {
    steps.push({
      label: "Work it out",
      work: "Break the problem into smaller steps and solve one piece at a time.",
    });
  }

  return {
    title: "Step-by-step example",
    steps,
    conclusion: question.explanation || "",
  };
}

export function buildGuidedSteps(question) {
  const base = buildWorkedExample(question);
  const prompts = base.steps.map((s, i) => ({
    label: s.label,
    answer: s.work,
    prompt:
      i === 0
        ? "What is the problem asking you to find?"
        : `What happens in this step? (${s.label})`,
  }));
  return { title: "Let's walk through it together", prompts };
}

export function buildEasierQuestion(question) {
  if (
    question.type === "multiple-choice" &&
    Array.isArray(question.choices) &&
    typeof question.correctIndex === "number"
  ) {
    const nums = numbersIn(question.stem || "");
    if (nums.length >= 2) {
      const a = clampInt(Math.abs(nums[0]) > 12 ? nums[0] / 4 : nums[0], 1, 12);
      const b = clampInt(Math.abs(nums[1]) > 12 ? nums[1] / 4 : nums[1], 1, 12);
      const verbMatch = (question.stem || "").match(
        /sum|add|plus|difference|subtract|minus|product|multiply|times|quotient|divide|gcf|lcm|greatest common factor|least common multiple/i,
      );
      const op = (verbMatch ? verbMatch[0] : "sum").toLowerCase();
      let answer, label;
      if (/difference|subtract|minus/.test(op)) {
        const hi = Math.max(a, b),
          lo = Math.min(a, b);
        answer = hi - lo;
        label = `What is ${hi} − ${lo}?`;
      } else if (/product|multiply|times/.test(op)) {
        answer = a * b;
        label = `What is ${a} × ${b}?`;
      } else if (/quotient|divide/.test(op)) {
        const prod = a * b;
        answer = a;
        label = `What is ${prod} ÷ ${b}?`;
      } else if (/gcf|greatest common factor/.test(op)) {
        answer = gcf(a, b);
        label = `What is the GCF of ${a} and ${b}?`;
      } else if (/lcm|least common multiple/.test(op)) {
        answer = (a * b) / gcf(a, b);
        label = `What is the LCM of ${a} and ${b}?`;
      } else {
        answer = a + b;
        label = `What is ${a} + ${b}?`;
      }
      const choices = buildChoices(answer);
      return {
        type: "multiple-choice",
        stem: label,
        choices: choices.values,
        correctIndex: choices.correctIndex,
        explanation: "Nice — you rebuilt your confidence with a simpler one!",
      };
    }
  }

  return {
    type: "confirm",
    prompt:
      "Take a breath. You have seen the worked example and the guided steps. When you are ready, mark that you understand the approach and continue.",
  };
}

function gcf(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function buildChoices(answer) {
  const set = new Set([answer]);
  const candidates = [answer + 1, answer - 1, answer + 2, answer * 2, 1];
  for (const c of candidates) {
    if (set.size >= 4) break;
    if (c >= 0 && !set.has(c)) set.add(c);
  }
  let i = 1;
  while (set.size < 4) {
    if (!set.has(answer + i)) set.add(answer + i);
    i++;
  }
  const values = [...set];
  for (let k = values.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [values[k], values[j]] = [values[j], values[k]];
  }
  return {
    values: values.map(String),
    correctIndex: values.indexOf(answer),
  };
}

async function nudgeTier(state, direction) {
  if (!state || typeof state.get !== "function") return;
  try {
    // Optional: use the adaptive module's tier adjuster if the host app ships
    // one. The specifier is computed so bundlers treat it as runtime-only and
    // the build does not fail when adaptive.js is absent.
    const spec = [".", "/adaptive.js"].join("");
    const mod = await import(/* @vite-ignore */ spec).catch(() => null);
    if (mod && typeof mod.adjustTier === "function") {
      mod.adjustTier(state, direction);
      return;
    }
  } catch (_) {
    /* adaptive module optional */
  }
  try {
    const s = state.get();
    const cur = clampInt(s.remediationBias ?? 0, -3, 3);
    const next = clampInt(cur + (direction === "down" ? -1 : 1), -3, 3);
    if (typeof state.set === "function") state.set({ remediationBias: next });
  } catch (_) {
    /* state shape may differ */
  }
}

/**
 * @param {{ question?: any, state?: any, level?: string, misconception?: string,
 *   lang?: string }} [opts]
 *
 * `misconception` is the tag the diagnosis engine named for THIS student's wrong
 * answer (or, when the lesson pre-arms from cross-lesson history, the recurring
 * error this item is known to trap). Supplying it swaps in the shorter, targeted
 * ladder; omitting it keeps the generic one byte-for-byte as it was.
 */
export function createRemediation({
  question,
  state,
  level,
  misconception,
  lang = "en",
  level1Shown = false,
} = {}) {
  if (!question) throw new Error("createRemediation requires a question");

  let stage = -1;
  let misses = 0;
  let active = false;
  const supportLevel = level === "level1" || level === "support";

  // Resolve the diagnosis ONCE, up front. A tag that resolves to nothing (typo,
  // retired id) must fall back to the generic ladder here rather than at render
  // time, or the student meets an empty first rung and loses a retry to it.
  const diagnosis = deriveDiagnosis(question, misconception, lang);
  // The second-level move. A tag with no authored micro-task simply has one
  // fewer rung — the ladder still runs, it just steps past `intervention`.
  const intervention = diagnosis ? interventionFor(misconception) : null;
  const order = diagnosis ? DIAGNOSED_STEP_ORDER : STEP_ORDER;

  // Where the ladder starts. Normally rung 0; when the item's own feedback has
  // already named the error, rung 1, so the panel adds a move instead of
  // repeating the one the student just read.
  const firstStage = diagnosis && level1Shown ? 1 : 0;

  function step(kind, payload) {
    return { kind, payload: payload || {} };
  }

  // Skip rungs that have no content to show (an `intervention` rung for a tag
  // with no authored micro-task). Returns the index of the next renderable rung.
  function advanceTo(from) {
    let i = from;
    while (i < order.length - 1 && order[i] === "intervention" && !intervention) i++;
    return i;
  }

  function render(kind) {
    switch (kind) {
      case "diagnosis":
        return step("diagnosis", { ...diagnosis, attempt: misses });
      case "intervention":
        return step("intervention", { ...intervention, attempt: misses });
      case "hint":
        return step("hint", { ...deriveHint(question), attempt: misses });
      case "worked-example":
        return step("worked-example", { ...buildWorkedExample(question), attempt: misses });
      case "guided":
        return step("guided", { ...buildGuidedSteps(question), attempt: misses });
      case "retry-easier":
        return step("retry-easier", { question: buildEasierQuestion(question), attempt: misses });
      default:
        active = false;
        return step("done", { reason: "exhausted", recovered: false });
    }
  }

  return {
    isActive: () => active,
    misses: () => misses,
    /** Which ladder is in play — read by the panel for its heading, and by tests. */
    diagnosed: () => Boolean(diagnosis),
    /** Whether a second-level micro-task exists for this error. */
    hasIntervention: () => Boolean(intervention),

    nextStep(result) {
      const ok = result && result.correct === true;

      if (!active) {
        if (ok) return step("done", { reason: "first-try-correct" });
        active = true;
        misses = 1;
        stage = advanceTo(firstStage);
        nudgeTier(state, "down");
        return render(order[stage]);
      }

      if (ok) {
        active = false;
        nudgeTier(state, "up");
        return step("done", {
          reason: order[Math.max(0, stage)] + "-recovered",
          recovered: true,
          // WHICH rung recovered them is the interesting part for the teacher
          // view: recovering after the named diagnosis is a different event from
          // recovering only after an easier problem.
          recoveredAt: order[Math.max(0, stage)],
        });
      }

      misses++;
      if (misses >= 2 && stage === 0) nudgeTier(state, "down");
      stage = advanceTo(Math.min(stage + 1, order.length - 1));
      const kind = order[stage];

      return render(kind);
    },

    // Convenience for the renderer / tests: peek at all scaffolds up front.
    scaffolds() {
      return {
        diagnosis,
        intervention,
        hint: deriveHint(question),
        workedExample: buildWorkedExample(question),
        guided: buildGuidedSteps(question),
        easier: buildEasierQuestion(question),
        supportLevel,
      };
    },
  };
}
