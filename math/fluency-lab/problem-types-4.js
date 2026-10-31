// Varied, validated problem types (owner: agent "generators"). Stub only: fixes the contract.
// variantsFor(skill) -> string[] of type ids this skill supports:
//   "compute", "missing-number", "number-line", "visual-model", "real-world", "error-analysis", "word-problem",
//   "multi-step", "equation", "explain".
// generateVariant(skill, rng, { level: 1-5, type? }) -> item | null
//   item = same shape as problem-bank items ({ question, answers, hint, explanation, steps, kind, choices?, unit? })
//   plus { level: 1-5, type, model?: { graphic: <GRAPHIC_KIND>, config } }.
//   null means "no variant for this level/type": callers fall back to adaptiveProblem.
export const variantsFor = (_skill) => [];
export const generateVariant = (_skill, _rng, _options) => null;
