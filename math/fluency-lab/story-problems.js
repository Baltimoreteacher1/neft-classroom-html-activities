// Story versions of whole-number arithmetic. The numbers, answer, model and steps are the plain problem's; only
// the wording changes, plus a first step that asks which operation the story describes. Used in practice
// sessions (not diagnostics, games or the trail, which show bare facts on cards).
const NAMES = ["Mia", "Jamal", "Sofía", "Wei", "Amara", "Diego", "Priya", "Noah"];
const THINGS = ["stickers", "marbles", "pencils", "books", "cards", "shells", "stamps", "beads"];
// Spanish for each THINGS entry, same order: [plural noun, "m" or "f"], so "cuántos / cuántas" agrees.
const THINGS_ES = [["calcomanías", "f"], ["canicas", "f"], ["lápices", "m"], ["libros", "m"], ["tarjetas", "f"], ["conchas", "f"], ["estampillas", "f"], ["perlitas", "f"]];
const EXPRESSION = /^(\d[\d,]*) ([+−×÷]) (\d[\d,]*) = \?$/;
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const num = (text) => Number(String(text).replaceAll(",", ""));
const show = (value) => value.toLocaleString("en-US");

// Each template: English text, the Spanish text for the same story, and the operation clue in both languages.
// Spanish takes (a, b, who, noun, q) where q is "Cuántos" or "Cuántas" to agree with the noun.
const TEMPLATES = {
  "+": [
    { text: (a, b, who, thing) => `${who} has ${a} ${thing} and gets ${b} more. How many ${thing} does ${who} have now?`, es: (a, b, who, noun, q) => `${who} tiene ${a} ${noun} y recibe ${b} más. ¿${q} ${noun} tiene ${who} ahora?`, clue: "The story adds more to what there already was, so add." },
    { text: (a, b, _who, thing) => `One box holds ${a} ${thing} and another box holds ${b}. How many ${thing} are in both boxes?`, es: (a, b, _who, noun, q) => `Una caja tiene ${a} ${noun} y otra caja tiene ${b}. ¿${q} ${noun} hay en las dos cajas?`, clue: "The story puts two amounts together, so add." },
  ],
  "−": [
    { text: (a, b, who, thing) => `${who} had ${a} ${thing} and gave away ${b}. How many ${thing} are left?`, es: (a, b, who, noun, q) => `${who} tenía ${a} ${noun} y regaló ${b}. ¿${q} ${noun} le quedan?`, clue: "The story takes some away, so subtract." },
    { text: (a, b, _who, thing) => `A shelf holds ${a} ${thing}. ${b} are taken off. How many ${thing} are still on the shelf?`, es: (a, b, _who, noun, q) => `Un estante tiene ${a} ${noun}. Se quitan ${b}. ¿${q} ${noun} quedan todavía en el estante?`, clue: "The story removes some from the total, so subtract." },
  ],
  "×": [
    { text: (a, b, _who, thing) => `There are ${a} bags with ${b} ${thing} in each bag. How many ${thing} are there in all?`, es: (a, b, _who, noun, q) => `Hay ${a} bolsas con ${b} ${noun} en cada bolsa. ¿${q} ${noun} hay en total?`, clue: "The story has equal groups, so multiply the number of groups by the size of each group." },
    { text: (a, b, who, thing) => `${who} buys ${a} packs of ${thing}. Each pack has ${b}. How many ${thing} does ${who} buy?`, es: (a, b, who, noun, q) => `${who} compra ${a} paquetes de ${noun}. Cada paquete tiene ${b}. ¿${q} ${noun} compra ${who}?`, clue: "The story has equal packs, so multiply." },
  ],
  "÷": [
    { text: (a, b, _who, thing) => `${show(a)} ${thing} are shared equally among ${b} friends. How many ${thing} does each friend get?`, es: (a, b, _who, noun, q) => `${show(a)} ${noun} se reparten en partes iguales entre ${b} amigos. ¿${q} ${noun} recibe cada amigo?`, clue: "The story shares a total into equal groups, so divide." },
    { text: (a, b, _who, thing) => `${show(a)} ${thing} are packed in groups of ${b}. How many groups are there?`, es: (a, b, _who, noun) => `${show(a)} ${noun} se empacan en grupos de ${b}. ¿Cuántos grupos hay?`, clue: "The story splits a total into equal groups, so divide." },
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
  const index = Math.floor(rng() * THINGS.length);
  const thing = THINGS[index];
  const [noun, gender] = THINGS_ES[index];
  const shownA = op === "+" || op === "−" || op === "÷" ? show(a) : a;
  const shownB = op === "+" || op === "−" ? show(b) : b;
  const text = template.text(shownA, shownB, who, thing);
  const questionEs = template.es(shownA, shownB, who, noun, gender === "f" ? "Cuántas" : "Cuántos");
  return { ...item, question: text, questionEs, expr: item.question, story: true, steps: [template.clue, ...(item.steps || [])] };
}
