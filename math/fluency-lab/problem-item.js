// The shape every generated practice problem shares. problem-bank.js and the strand generators build items with it.
export function problem(question, answer, options = {}) {
  const answers = Array.isArray(answer) ? answer.map(String) : [String(answer)];
  return {
    question,
    answers,
    displayAnswer: options.displayAnswer || answers[0],
    hint: options.hint || "Name the operation, then solve one careful step.",
    explanation: options.explanation || `The answer is ${options.displayAnswer || answers[0]}.`,
    kind: options.kind || "number",
    choices: options.choices || null,
    unit: options.unit || "",
    model: options.model || null,
    steps: options.steps || [options.explanation || `The answer is ${options.displayAnswer || answers[0]}.`],
    // Optional extras: a Spanish stem, and what a typed expression / inequality / order answer is checked against.
    ...Object.fromEntries(["questionEs", "work", "inequality", "order"].filter((key) => options[key]).map((key) => [key, options[key]])),
  };
}
