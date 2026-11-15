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
