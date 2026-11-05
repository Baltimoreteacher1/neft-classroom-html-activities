// How the Fluency Lab explains dividing by a fraction. Every surface that teaches it (the skill card, worked steps,
// hints, the interactive solver, the printable card and the tutor) reads from here, so the explanation cannot drift.
// The reason comes first: a ÷ b asks how many groups of b fit in a, and one whole holds (reciprocal of b) such groups.
// "Keep-Change-Flip" stays as the memory aid for the moves, never as the reason.

export const RULE =
  "Dividing by a fraction asks how many groups of that fraction fit in the first amount. One whole holds as many groups as the fraction's reciprocal, so dividing by a fraction is the same as multiplying by its reciprocal.";

export const KCF_NOTE =
  "Keep-Change-Flip is a memory aid for these moves: keep the first fraction, change ÷ to ×, and flip the divisor into its reciprocal.";

export const LEARN_STEPS = [
  "Read the ÷ as a question: how many groups of the second fraction fit in the first?",
  "Find the reciprocal of the divisor by swapping its top and bottom. A fraction times its reciprocal is 1, so the reciprocal counts the groups in one whole.",
  "Keep the first fraction, change ÷ to ×, and use the reciprocal. Multiply the tops, multiply the bottoms, and simplify.",
];

export const MISTAKE =
  "Flip only the divisor, the fraction you divide by. Do not flip the first fraction, and do not flip both.";

export const HINT =
  "Keep the first fraction. Swap the top and bottom of the second fraction to get its reciprocal. Change ÷ to × and multiply.";

export const SIGNED_STEP = (text1, textR) =>
  `Change ÷ to × and use the reciprocal of the second fraction: ${text1} × ${textR}. The reciprocal swaps the top and bottom and keeps the sign.`;

export const TUTOR_NOTE =
  "Dividing by a fraction multiplies by its reciprocal. Keep the first fraction, change ÷ to ×, and swap the top and bottom of the divisor.";

/** Worked steps for a/b ÷ c/d, before the worked line. Opens on verbs the step lens already highlights. */
export const divideSteps = (a, b, c, d) => [
  `Keep ${a}/${b}. Dividing by ${c}/${d} asks how many groups of ${c}/${d} fit in ${a}/${b}.`,
  `Find the reciprocal of ${c}/${d} by swapping its top and bottom: ${d}/${c}. One whole holds ${d}/${c} groups of ${c}/${d}, so dividing by ${c}/${d} is the same as multiplying by ${d}/${c}.`,
  `Change ÷ to ×: ${a}/${b} × ${d}/${c}. Multiply the tops, ${a} × ${d}, and the bottoms, ${b} × ${c}. Then simplify.`,
];

/** The captions the explainer cards show, keyed by card. */
export const cardCaptions = (a, b, c, d) => ({
  summary: `<strong>Why it works:</strong> ${a}/${b} ÷ ${c}/${d} asks how many groups of ${c}/${d} fit in ${a}/${b}. One whole holds ${d}/${c} groups of ${c}/${d}, so we multiply by ${d}/${c}. Then multiply across: (${a} × ${d}) / (${b} × ${c}) = ${a * d}/${b * c}. <em>${KCF_NOTE}</em>`,
  keep: "<strong>1. KEEP:</strong> Leave the first fraction exactly as it is. It is the amount you are splitting into groups.",
  change:
    "<strong>2. CHANGE:</strong> Change ÷ to ×. Counting groups of the divisor is the same as multiplying by the reciprocal.",
  flip: `<strong>3. FLIP:</strong> Flip only the divisor ${c}/${d} to its reciprocal ${d}/${c}. ${c}/${d} × ${d}/${c} = 1, so the reciprocal counts the groups in one whole.`,
  why: `<strong>Why it works:</strong> One whole holds ${d}/${c} groups of ${c}/${d}. So ${a}/${b} holds ${a}/${b} × ${d}/${c} groups. That is what ${a}/${b} ÷ ${c}/${d} asks for.`,
  solve:
    "<strong>4. MULTIPLY:</strong> Multiply the tops across and the bottoms across, then simplify.",
});
