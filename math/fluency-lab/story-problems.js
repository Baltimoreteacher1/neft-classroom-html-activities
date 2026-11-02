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
const keepStory = (item, question, questionEs, clue) => ({
  ...item,
  question,
  questionEs,
  expr: item.question,
  story: true,
  steps: [clue, ...(item.steps || [])],
});

function appliedStory(item, skill) {
  if (!skill || item.kind !== "number") return null;
  const id = skill.id;
  let match;
  if (id === "ratios" && (match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?) = (□|\d+(?:\.\d+)?):(□|\d+(?:\.\d+)?)$/.exec(item.question))) {
    const [, a, b, c, d] = match;
    const firstUnknown = c === "□";
    const known = firstUnknown ? d : c;
    const unknownName = firstUnknown ? "powder" : "water";
    const knownName = firstUnknown ? "water" : "powder";
    return keepStory(item,
      `A drink mix uses ${a} scoops of powder for every ${b} cups of water. If a batch uses ${known} ${knownName === "water" ? "cups of water" : "scoops of powder"}, how many ${unknownName === "powder" ? "scoops of powder" : "cups of water"} keep the taste the same?`,
      `Una mezcla para bebida usa ${a} cucharadas de polvo por cada ${b} tazas de agua. Si una tanda usa ${known} ${knownName === "water" ? "tazas de agua" : "cucharadas de polvo"}, ¿cuántas ${unknownName === "powder" ? "cucharadas de polvo" : "tazas de agua"} mantienen el mismo sabor?`,
      "Equivalent ratios keep the same amount for each matching pair of quantities.");
  }
  if (id === "percent" && (match = /^What is (\d+(?:\.\d+)?)% of ([\d,]+)\?$/.exec(item.question))) {
    const [, percent, whole] = match;
    return keepStory(item,
      `A reading club finishes ${percent}% of a ${whole}-page book during one meeting. How many pages do the students finish?`,
      `Un club de lectura termina el ${percent}% de un libro de ${whole} páginas durante una reunión. ¿Cuántas páginas terminan los estudiantes?`,
      "Percent means the number of equal parts out of 100; multiply that fraction by the whole amount.");
  }
  if (id === "percent-change" && (match = /^([\d,]+) with a (\d+(?:\.\d+)?)% (increase|decrease) equals what\?$/.exec(item.question))) {
    const [, original, percent, direction] = match;
    const decrease = direction === "decrease";
    return keepStory(item,
      `A backpack costs $${original}. Its price has a ${percent}% ${decrease ? "discount" : "increase"}. What is the new price before tax?`,
      `Una mochila cuesta $${original}. Su precio tiene un ${percent}% de ${decrease ? "descuento" : "aumento"}. ¿Cuál es el nuevo precio antes de impuestos?`,
      `Find ${percent}% of the original price, then ${decrease ? "subtract the discount" : "add the increase"}.`);
  }
  if ((id === "fraction-equivalence" || id === "fraction-equiv") && (match = /^(\d+)\/(\d+) = (□|\d+)\/(□|\d+)$/.exec(item.question))) {
    const [, numerator, denominator, targetNumerator, targetDenominator] = match;
    const story = targetNumerator === "□"
      ? {
          question: `A digital mural is ${numerator}/${denominator} complete. On a new grid, the same mural has ${targetDenominator} equal cells. How many cells should be colored to show the same amount?`,
          questionEs: `Un mural digital está completo en ${numerator}/${denominator}. En una nueva cuadrícula, el mismo mural tiene ${targetDenominator} celdas iguales. ¿Cuántas celdas deben colorearse para mostrar la misma cantidad?`,
        }
      : {
          question: `A digital mural is ${numerator}/${denominator} complete. On a new grid, ${targetNumerator} cells are colored to show the same amount. How many equal cells are in the whole grid?`,
          questionEs: `Un mural digital está completo en ${numerator}/${denominator}. En una nueva cuadrícula, se colorean ${targetNumerator} celdas para mostrar la misma cantidad. ¿Cuántas celdas iguales hay en toda la cuadrícula?`,
        };
    return keepStory(item, story.question, story.questionEs,
      "Equivalent fractions name the same amount, so split each original part into the same number of smaller parts.");
  }
  if (id === "volume" && (match = /^Volume of a rectangular prism: ([\d,]+) × ([\d,]+) × ([\d,]+)\?$/.exec(item.question))) {
    const [, length, width, height] = match;
    return keepStory(item,
      `A storage box is ${length} units long, ${width} units wide, and ${height} units high. How many unit cubes can fit inside it?`,
      `Una caja de almacenamiento mide ${length} unidades de largo, ${width} de ancho y ${height} de alto. ¿Cuántos cubos unitarios caben dentro?`,
      "Volume counts the unit cubes in every layer: length × width × height.");
  }
  if (id === "slope" && (match = /^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/.exec(item.question))) {
    const [, x1, y1, x2, y2] = match;
    return keepStory(item,
      `A drone's altitude is recorded at hour ${x1} as ${y1} meters and at hour ${x2} as ${y2} meters relative to a landmark. What is its average altitude change per hour?`,
      `La altitud de un dron se registra en la hora ${x1} como ${y1} metros y en la hora ${x2} como ${y2} metros respecto a un punto de referencia. ¿Cuál es el cambio promedio de altitud por hora?`,
      "Rate of change is the change in altitude divided by the change in time.");
  }
  if (id === "systems" && (match = /^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/.exec(item.question))) {
    const [, sum, difference] = match;
    return keepStory(item,
      `Two temperature sensors read x°C and y°C. Their readings add to ${sum}°C, and sensor x is ${Math.abs(Number(difference))}°C ${Number(difference) < 0 ? "colder" : "warmer"} than sensor y. What is sensor x's reading?`,
      `Dos sensores de temperatura marcan x°C e y°C. Sus lecturas suman ${sum}°C, y el sensor x está ${Math.abs(Number(difference))}°C ${Number(difference) < 0 ? "más frío" : "más caliente"} que el sensor y. ¿Cuál es la lectura del sensor x?`,
      "Write one equation for the total and one for the difference. Add them so y cancels.");
  }
  if (id === "linear-equations" && (match = /^(?:(\d+)x|x) ([+−]) (\d+) = (-?\d+)\. Find x\.$/.exec(item.question))) {
    const [, coefficientText, sign, constant, total] = match;
    const coefficient = coefficientText || "1";
    const signedWord = sign === "+" ? "adds" : "subtracts";
    return keepStory(item,
      `A game scoring system multiplies a player's points per round by ${coefficient}, then ${signedWord} ${constant} points. The final score is ${total}. How many points per round did the player earn?`,
      `Un sistema de puntuación multiplica por ${coefficient} los puntos de un jugador por ronda y luego ${sign === "+" ? "suma" : "resta"} ${constant} puntos. El puntaje final es ${total}. ¿Cuántos puntos por ronda obtuvo el jugador?`,
      "Represent the unknown points per round with x, undo the constant adjustment, then divide by the number of rounds.");
  }
  if (id === "pythagorean") {
    match = /^A right triangle has legs (\d+) and (\d+)\. Find the hypotenuse\.$/.exec(item.question);
    if (match) {
      const [, a, b] = match;
      return keepStory(item,
        `A rectangular park is ${a} meters wide and ${b} meters long. A straight path crosses the park diagonally. How long is the path?`,
        `Un parque rectangular mide ${a} metros de ancho y ${b} metros de largo. Un sendero recto cruza el parque en diagonal. ¿Cuánto mide el sendero?`,
        "The diagonal is the hypotenuse of a right triangle. Use a² + b² = c².");
    }
  }
  return null;
}

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

export function storyFor(item, rng, skill = null) {
  if (!item || item.kind !== "number" || item.story) return null;
  const applied = appliedStory(item, skill);
  if (applied) return applied;
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
