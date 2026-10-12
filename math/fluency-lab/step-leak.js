// How many guided steps can be shown before one of them states the answer.
// Steps are authored per skill and several build up to the answer in plain sight ("7 × 8 = 56" for 56 ÷ 7,
// "Multiples of 10: 10, 20, 30" for LCM 30), so "every step but the last" is not safe. A step that holds the
// answer as a whole token, and the answer is not already in the question, ends the safe run.
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const plain = (text) => String(text).replace(/,(?=\d{3}\b)/g, "").replace(/−/g, "-").trim();

function answerForms(item) {
  const forms = new Set();
  for (const value of [...(item.answers || []), item.displayAnswer]) {
    const form = plain(value ?? "");
    if (form) forms.add(form);
  }
  return [...forms];
}

const holds = (text, form) => new RegExp(`(?<![\\w./-])${escape(form)}(?![\\w/]|\\.\\d)`).test(plain(text));

// A number the question already shows (the 6 in "6x", the 2 in "1/2") is not news when a step repeats it.
const NUMERIC = /^-?\d+(\.\d+)?$/;
const shows = (question, form) =>
  NUMERIC.test(form) ? new RegExp(`(?<![\\d.])${escape(form)}(?!\\d|\\.\\d)`).test(plain(question)) : holds(question, form);

// "Factors of 48: 1, 2, 3, 4, …" lists a search space for the learner to work through; it does not state a result.
const isList = (step) => /:\s*[-\d.,\s…\/]+$/.test(plain(step)) && (String(step).match(/,/g) || []).length >= 1;

export function stepLeaks(step, item) {
  if (isList(step)) return false;
  return answerForms(item).some((form) => !shows(item.question || "", form) && holds(step, form));
}

export function peekCap(item) {
  const steps = item.steps || [];
  const limit = Math.max(0, steps.length - 1);
  for (let i = 0; i < limit; i += 1) if (stepLeaks(steps[i], item)) return i;
  return limit;
}
