// Auto-derive thin lesson content from config.json where authored fields are missing.

/** Derive a common-mistake callout from keyIdea, conceptIntro, or vocabulary. */
export function deriveCommonMistake(config) {
  const explicit =
    config.practice?.commonMistake ||
    config.commonMistake ||
    null;
  if (explicit) {
    return typeof explicit === "string"
      ? explicit
      : explicit.text || explicit.message || "";
  }

  const keyIdea =
    config.launch?.conceptIntro?.keyIdea ||
    config.conceptIntro?.keyIdea ||
    "";
  if (keyIdea) {
    return `A common mistake is to skip the key idea: "${keyIdea}" — always check your work against this rule.`;
  }

  const firstTerm = config.vocabulary?.[0];
  if (firstTerm?.term && firstTerm?.definition) {
    return `Students often confuse "${firstTerm.term}" with everyday words. Remember: ${firstTerm.definition}`;
  }

  return "";
}

/** Split launch narrative into tap-to-reveal story beats. */
export function deriveLaunchBeats(config) {
  const narrative = config.launch?.narrative || "";
  if (!narrative) return [];

  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sentences.length <= 2) {
    return [{ text: narrative, label: "The Story" }];
  }

  const labels = ["Set the Scene", "The Challenge", "What Happens Next", "Your Role"];
  return sentences.map((text, i) => ({
    text,
    label: labels[i] || `Part ${i + 1}`,
  }));
}

/** Phase time breakdown for cover screen pacing guide. */
export const PHASE_TIME_ESTIMATES = [
  { name: "Launch", icon: "🚀", minutes: 6 },
  { name: "Vocab", icon: "📖", minutes: 8 },
  { name: "Explore", icon: "🔍", minutes: 8 },
  { name: "Practice", icon: "✏️", minutes: 15 },
  { name: "Connect", icon: "🌎", minutes: 5 },
  { name: "Reflect", icon: "💡", minutes: 3 },
];

/** Count practice problems across tiers. */
export function countPracticeProblems(config) {
  const p = config.practice || {};
  const buckets = ["approaching", "onLevel", "extending", "optional"];
  let total = 0;
  for (const b of buckets) {
    if (Array.isArray(p[b])) total += p[b].length;
  }
  return total;
}

/** Derive 3-tier hint ladder from a problem definition. */
export function deriveHintLadder(prob) {
  if (!prob) return [];
  const authored = Array.isArray(prob.hints) ? prob.hints.filter(Boolean) : [];
  if (authored.length >= 3) {
    return authored.slice(0, 3).map((h, i) => ({
      level: i + 1,
      label: ["💡 Tip", "🧭 Strategy", "👀 Show me how"][i],
      text: String(h),
    }));
  }

  const scaffold = prob.scaffold || prob.hint || "";
  const typeHints = {
    "multiple-choice": [
      "Read the question twice. What is it really asking?",
      "Cross out choices that clearly don't fit. Compare what's left.",
      scaffold || "Pick the choice that matches the math rule you learned today.",
    ],
    "drag-sort": [
      "Read every category label before you drag.",
      "Sort the easiest cards first — use them as clues for the rest.",
      scaffold || "One card belongs in each category. Match the math vocabulary.",
    ],
    "fill-table": [
      "Fill cells you already know. Look for a pattern between rows.",
      "Check if each row grows by the same amount or follows a ratio.",
      scaffold || "Use the pattern to find missing values one cell at a time.",
    ],
    "error-analysis": [
      "Read each step in order. Which step breaks the rule?",
      "Check the operation in each step — add, subtract, multiply, or divide?",
      scaffold || "Find the first step where the math stops being true.",
    ],
    default: [
      "Re-read the question. Underline what it's asking.",
      "What math tool or vocabulary word fits this problem?",
      scaffold || "Plan your first step before you answer.",
    ],
  };

  const hints = typeHints[prob.type] || typeHints.default;
  return hints.map((text, i) => ({
    level: i + 1,
    label: ["💡 Tip", "🧭 Strategy", "👀 Show me how"][i],
    text: String(text),
  }));
}
