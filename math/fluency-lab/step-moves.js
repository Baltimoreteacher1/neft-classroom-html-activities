// The "move" a step makes: the action word it opens with (Split, Add, Regroup...) or, for a bare number sentence like
// "30 × 17 = 510", the operation it uses. Only the NAME of the move is ever exposed, never a number, so a prediction
// card can ask "what comes next?" without showing the next step's work or result. step-lens.js highlights these words;
// stepsBlock and the guided coach stamp the next step's move on their "Next step" button.
export const VERBS = [
  "Split",
  "Add",
  "Subtract",
  "Multiply",
  "Divide",
  "Regroup",
  "Trade",
  "Round",
  "Compare",
  "Count",
  "Carry",
  "Borrow",
  "Break",
  "Rename",
  "Simplify",
  "Convert",
  "Combine",
  "Line up",
  "Find",
  "Make",
  "Take away",
  "Share",
  "Skip count",
  "Double",
  "Halve",
  "Cross out",
  "Flip",
  "Cancel",
  "Check",
];

const OP_MOVE = { "+": "Add", "−": "Subtract", "-": "Subtract", "×": "Multiply", "÷": "Divide" };
// Moves a learner could plausibly mix up; a prediction offers the right one beside two of these.
const POOL = ["Add", "Subtract", "Multiply", "Divide", "Split", "Regroup", "Round", "Compare"];
const OPENING = new RegExp(`^(?:then |now |next |first |so )?(${VERBS.join("|")})\\b`, "i");

const titleCase = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const hash = (text) =>
  [...String(text)].reduce((sum, ch) => (sum * 31 + ch.codePointAt(0)) % 100003, 7);

/** The named move of a step, or "" when the step states no move (a list, a fact, a note). */
export function moveOf(line) {
  const text = String(line || "").trim();
  const opening = OPENING.exec(text);
  if (opening) return titleCase(opening[1]);
  const before = text.split("=")[0];
  const op = /[+−×÷]|(?<=\s)-(?=\s)/.exec(before);
  return op ? OP_MOVE[op[0]] : "";
}

/** The move of the step a "Next step" button would open, or "" when none is left (or none is named). */
export const nextMoveOf = (steps, shown, cap = steps.length) => (shown < Math.min(cap, steps.length) ? moveOf(steps[shown]) : "");

/** Three moves to pick from, the right one among them, in an order fixed by `seed` so a reload keeps it. */
export function moveChoices(move, seed) {
  if (!move) return [];
  const others = POOL.filter((name) => name !== move);
  const n = hash(`${move}|${seed}`);
  const picks = [...new Set([others[n % others.length], others[(n * 7 + 3) % others.length]])];
  for (const name of others) if (picks.length < 2 && !picks.includes(name)) picks.push(name);
  picks.splice(n % 3, 0, move);
  return picks;
}
