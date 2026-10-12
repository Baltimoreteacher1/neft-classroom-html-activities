// Story versions of whole-number arithmetic. The numbers, answer, model and steps are the plain problem's; only
// the wording changes, plus a first step that asks which operation the story describes. Used in practice
// sessions (not diagnostics, games or the trail, which show bare facts on cards).
const NAMES = ["Mia", "Jamal", "Sofía", "Wei", "Amara", "Diego", "Priya", "Noah"];
const THINGS = ["stickers", "marbles", "pencils", "books", "cards", "shells", "stamps", "beads"];
const EXPRESSION = /^(\d[\d,]*) ([+−×÷]) (\d[\d,]*) = \?$/;
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const num = (text) => Number(String(text).replaceAll(",", ""));
const show = (value) => value.toLocaleString("en-US");

const TEMPLATES = {
  "+": [
    { text: (a, b, who, thing) => `${who} has ${a} ${thing} and gets ${b} more. How many ${thing} does ${who} have now?`, clue: "The story adds more to what there already was, so add." },
    { text: (a, b, _who, thing) => `One box holds ${a} ${thing} and another box holds ${b}. How many ${thing} are in both boxes?`, clue: "The story puts two amounts together, so add." },
  ],
  "−": [
    { text: (a, b, who, thing) => `${who} had ${a} ${thing} and gave away ${b}. How many ${thing} are left?`, clue: "The story takes some away, so subtract." },
    { text: (a, b, _who, thing) => `A shelf holds ${a} ${thing}. ${b} are taken off. How many ${thing} are still on the shelf?`, clue: "The story removes some from the total, so subtract." },
  ],
  "×": [
    { text: (a, b, _who, thing) => `There are ${a} bags with ${b} ${thing} in each bag. How many ${thing} are there in all?`, clue: "The story has equal groups, so multiply the number of groups by the size of each group." },
    { text: (a, b, who, thing) => `${who} buys ${a} packs of ${thing}. Each pack has ${b}. How many ${thing} does ${who} buy?`, clue: "The story has equal packs, so multiply." },
  ],
  "÷": [
    { text: (a, b, _who, thing) => `${show(a)} ${thing} are shared equally among ${b} friends. How many ${thing} does each friend get?`, clue: "The story shares a total into equal groups, so divide." },
    { text: (a, b, _who, thing) => `${show(a)} ${thing} are packed in groups of ${b}. How many groups are there?`, clue: "The story splits a total into equal groups, so divide." },
  ],
};

export function storyFor(item, rng) {
  if (!item || item.kind !== "number" || item.story) return null;
  const match = String(item.question).match(EXPRESSION);
  if (!match) return null;
  const [a, op, b] = [num(match[1]), match[2], num(match[3])];
  const answer = num(item.answers?.[0]);
  if (![a, b, answer].every(Number.isInteger) || answer < 2 || a < 2 || b < 2) return null;
  // Keep the numbers believable for the scene: 560 packs of stamps is not a story, 56 is.
  if (op === "×" ? a > 100 || b > 100 : a > 9999 || b > 9999) return null;
  const template = pick(TEMPLATES[op], rng);
  const who = pick(NAMES, rng);
  const thing = pick(THINGS, rng);
  const text = template.text(op === "+" || op === "−" || op === "÷" ? show(a) : a, op === "+" || op === "−" ? show(b) : b, who, thing);
  return { ...item, question: text, expr: item.question, story: true, steps: [template.clue, ...(item.steps || [])] };
}
