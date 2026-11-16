import { model } from "./math.mjs";

/** Prepare a play-test from the current expression design without exposing its reserved checks. */
export function expressionChallenge(project, design, rawInput) {
  if (project.family !== "expressions") return { error: "This preview needs an expression project." };
  const original = model(project, design);
  if (original.errors.length) return { error: "Finish the design with valid quantities before previewing." };
  const text = String(rawInput ?? "").trim();
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 30)
    return { error: "Choose a whole-number input from 1 to 30." };
  const input = Number(text);
  if (input === original.values.c || input === original.values.c + 1)
    return { error: "That input is reserved for your project checks. Choose another." };
  const preview = model(project, { ...design, c: input });
  return {
    prompt: preview.checks.find((check) => check.id === "value").prompt,
    answer: preview.checks.find((check) => check.id === "value").answer,
  };
}

export function checkExpressionChallenge(challenge, rawAnswer) {
  const value = String(rawAnswer ?? "").trim();
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return "invalid";
  return Number(value) === challenge.answer ? "correct" : "revise";
}

/** Build an equivalent-ratio challenge from a new scale factor, keeping project checks separate. */
export function ratioChallenge(project, design, rawFactor) {
  if (project.family !== "ratio") return { error: "This preview needs a ratio project." };
  const original = model(project, design);
  if (original.errors.length) return { error: "Finish the design with valid quantities before previewing." };
  const text = String(rawFactor ?? "").trim();
  if (!/^\d+$/.test(text) || Number(text) < 2 || Number(text) > 20)
    return { error: "Choose a whole-number scale factor from 2 to 20." };
  const factor = Number(text);
  if (factor === original.values.c)
    return { error: "That factor is reserved for your project checks. Choose another." };
  const preview = model(project, { ...design, c: factor });
  const { a, b } = preview.values;
  const sports = project.id === "unit-3-b";
  return {
    prompt: sports
      ? `A model has ${a} points in ${b} games. At the same rate, how many points in ${b * factor} games?`
      : `A blend has ${a} parts of ingredient A for ${b} parts of ingredient B. How many parts of A keep the same ratio when there are ${b * factor} parts of B?`,
    answer: preview.checks.find((check) => check.id === "scale-a").answer,
  };
}
