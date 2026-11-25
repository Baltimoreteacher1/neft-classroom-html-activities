// Verifier registry: name -> loader of a verifier module. One entry per line, alphabetical (several workers append here).
//
// A verifier module exports:
//   name                     string, equal to its registry key
//   verify(target) -> findings[]   pure; may be async. target = { id, grade, subject, studio, lessons[] }
//                            finding = { code, severity: "error"|"warn"|"info", path, message, evidence }
//                            info findings may carry evidence.n (a count) so the baseline can floor detector coverage
//   coverageCodes            info codes whose counts are floored at 90% of the baseline (e.g. claims actually checked); a verifier that
//                            silently looks at nothing then fails instead of passing
//   fixtures = { bad: [{ name, target, expect: [code...] }], good: [{ name, target }] }
//                            the negative control: every bad fixture MUST raise its codes, every good fixture MUST raise no
//                            error/warn finding; tools/content/verify.mjs runs them before the sweep and exits 3 if they fail
export const REGISTRY = {
  "alt-text": () => import("./verifiers/alt-text.mjs"),
  arithmetic: () => import("./verifiers/arithmetic.mjs"),
  duplicates: () => import("./verifiers/duplicates.mjs"),
  "no-manipulatives": () => import("./verifiers/no-manipulatives.mjs"),
  readability: () => import("./verifiers/readability.mjs"),
  sensitivity: () => import("./verifiers/sensitivity.mjs"),
  "vocab-tier": () => import("./verifiers/vocab-tier.mjs"),
};

// Verifiers 4-7 (worker VB) use a different contract (verify(subject, ctx), no coverageCodes) and their own runner,
// tools/content/verifiers-b.mjs, so they are NOT in REGISTRY above (verify.mjs would exit 3 loading them).
// One name per line, alphabetical; each name is tools/content/verifiers/<name>.mjs.
// biome-ignore format: one entry per line keeps merges conflict-free
export const VERIFIERS_B = [
  "cognate",
  "frames",
  "spanish",
  "standards",
];
