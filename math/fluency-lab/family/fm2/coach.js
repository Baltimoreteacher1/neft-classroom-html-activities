// Together-mode coaching for caregivers: who solves, what to ask, what to listen for, what to do when stuck.
// Every text is fixed copy chosen by strand and rotation. Nothing here ever sees or states an answer, and no
// text contains a digit, so a caregiver can never be handed a number by the coach. @fm2 FM-027 FM-028
import { seedFrom } from "./rng.js";

const t = (en, es) => ({ en, es });

export const STRAND_KEYS = ["counting-place-value", "addition-subtraction", "multiplication-division", "fractions", "decimals", "ratios-percents", "patterns-algebra", "geometry-measure", "money", "number-line", "equations", "data"];

// Order matters: the first matching rule wins, so the narrower strands come before the broad ones.
const RULES = [
  // This is a specific algebra area model. Keep it ahead of generic algebra and area matches.
  ["binomial-area", /g8-expand|binomial/],
  ["money", /\bmoney\b|\bcoins?\b|\bdollars?\b|\bcents?\b|\bprices?\b|\bcosts?\b|\bchange\b|\bshop|\bmarket\b|\bbills?\b|\bcash\b/],
  ["ratios-percents", /\bratios?\b|\bpercents?\b|\brates?\b|\bproportions?\b|unit price|\bscale\b/],
  ["equations", /equation|inequalit|variable|solve for|balance|expression/],
  ["fractions", /fraction|mixed number|halves|fourths|equivalent|numerator|denominator/],
  ["decimals", /decimal|tenths|hundredths|thousandths/],
  ["data", /\bdata\b|graph|chart|statistic|probab|survey|mean|median|plot/],
  ["multiplication-division", /multipl|divis|divid|array|factor|times|product|quotient/],
  ["geometry-measure", /geometry|shape|area|perimeter|volume|angle|measure|length|weight|capacity|\btime\b|clock|coordinate/],
  ["patterns-algebra", /pattern|algebra|sequence|function|rule/],
  ["number-line", /number line|integer|negative|opposite|absolute|compar|order/],
  ["addition-subtraction", /addition|subtract|add\b|sum|differ|plus|minus/],
  ["counting-place-value", /count|place value|digit|ones|tens|hundreds|compos|number sense|number/],
];

export function strandKey(strand, skillId = "", gameId = "") {
  const sources = [typeof strand === "string" ? strand : strand?.en || "", String(skillId).replaceAll("-", " "), String(gameId).replaceAll("-", " ")];
  if (/g8-expand|binomial/i.test(`${skillId} ${sources[0]}`)) return "binomial-area";
  for (const source of sources) {
    const text = source.toLowerCase();
    for (const [key, pattern] of RULES) if (pattern.test(text)) return key;
  }
  return "addition-subtraction";
}

export const STRAND_BANK = {
  "binomial-area": {
    ask: [t("What side lengths label the rectangle? How does each partial area connect to those sides?", "¿Qué medidas tienen los lados del rectángulo? ¿Cómo se relaciona cada área parcial con esos lados?"), t("How do the four smaller areas combine? Which terms can you combine, and why?", "¿Cómo se combinan las cuatro áreas pequeñas? ¿Qué términos puedes combinar y por qué?")],
    lookFor: t("Listen for each side being split into its two terms, each partial rectangle area matching one pair of side lengths, and like terms combined only after all areas are added.", "Escucha si cada lado se separa en sus dos términos, si cada área parcial corresponde a un par de medidas, y si combina términos semejantes después de sumar todas las áreas."),
    ifStuck: t("Sketch a rectangle. Label one side with the two terms from one binomial and the other side with the two terms from the second. Find the area of each small rectangle, then add the four parts.", "Dibujen un rectángulo. Etiqueten un lado con los dos términos de un binomio y el otro lado con los dos términos del segundo. Encuentren el área de cada rectángulo pequeño y luego sumen las cuatro partes."),
    extend: t("How could you check that the expanded expression has the same area as the original side lengths?", "¿Cómo podrías comprobar que la expresión desarrollada conserva el área de las medidas originales?"),
  },
  "counting-place-value": {
    ask: [t("How do you know how many there are? Show me how you counted.", "¿Cómo sabes cuántos hay? Muéstrame cómo contaste."), t("What does each digit in your number tell us?", "¿Qué nos dice cada dígito de tu número?"), t("Why did you group them that way?", "¿Por qué los agrupaste de esa manera?")],
    lookFor: t("Listen for grouping in tens and ones, touching or pointing while counting, and saying what each digit is worth.", "Escucha si agrupa en decenas y unidades, si señala o toca mientras cuenta, y si dice cuánto vale cada dígito."),
    ifStuck: t("Take your time and build it with objects, fingers or a quick drawing. Count together, then try again.", "Tómense su tiempo y constrúyanlo con objetos, dedos o un dibujo sencillo. Cuenten juntos y vuelvan a intentarlo."),
    extend: t("What if there were ten more? What would change and what would stay the same?", "¿Y si hubiera diez más? ¿Qué cambiaría y qué se quedaría igual?"),
  },
  "addition-subtraction": {
    ask: [t("How did you put those numbers together? Walk me through it.", "¿Cómo juntaste esos números? Cuéntame paso a paso."), t("What is another way to get to the same total?", "¿De qué otra manera puedes llegar al mismo total?"), t("How could you check your answer with the opposite operation?", "¿Cómo podrías comprobar tu respuesta con la operación contraria?")],
    lookFor: t("Listen for breaking numbers into friendlier parts, counting up or back, or using a number they know well, like ten.", "Escucha si separa los números en partes más manejables, si cuenta hacia adelante o hacia atrás, o si usa un número que conoce bien, como el diez."),
    ifStuck: t("Ask them to tell the story in their own words, then draw it or hop along a number line. Start from the bigger number.", "Pídele que cuente la historia con sus propias palabras y luego que la dibuje o salte en una recta numérica. Empiecen desde el número más grande."),
    extend: t("Make up a story that matches this problem. What numbers are in it?", "Inventa una historia que corresponda a este problema. ¿Qué números tiene?"),
  },
  "multiplication-division": {
    ask: [t("How many equal groups are there, and how many are in each one? How do you see them?", "¿Cuántos grupos iguales hay y cuántos hay en cada uno? ¿Cómo los ves?"), t("What fact do you already know that could help here?", "¿Qué operación que ya conoces te podría ayudar aquí?"), t("How are multiplying and dividing connected in this problem?", "¿Cómo se conectan multiplicar y dividir en este problema?")],
    lookFor: t("Listen for equal groups, skip counting, rows and columns, and a related fact they already know.", "Escucha si habla de grupos iguales, conteo salteado, filas y columnas, o una operación relacionada que ya conoce."),
    ifStuck: t("Draw the groups or set out objects in rows. Count by the same amount each time, then link it to a fact you know.", "Dibujen los grupos o pongan objetos en filas. Cuenten de la misma cantidad cada vez y conéctenlo con una operación que conozcan."),
    extend: t("How would the answer change if there were one more group?", "¿Cómo cambiaría la respuesta si hubiera un grupo más?"),
  },
  fractions: {
    ask: [t("What does the bottom number tell us, and what does the top number tell us?", "¿Qué nos dice el número de abajo y qué nos dice el de arriba?"), t("How do you know the pieces are the same size?", "¿Cómo sabes que las partes son del mismo tamaño?"), t("How could you show this fraction a different way, with a picture or a number line?", "¿Cómo podrías mostrar esta fracción de otra manera, con un dibujo o una recta numérica?")],
    lookFor: t("Listen for equal parts, comparing to one half or one whole, and words like numerator and denominator used with meaning, not only memorized.", "Escucha si habla de partes iguales, si compara con un medio o con un entero, y si usa palabras como numerador y denominador con sentido, no solo de memoria."),
    ifStuck: t("Fold paper, shade a drawing or use a measuring cup. Ask how many equal parts make the whole.", "Doblen papel, sombreen un dibujo o usen una taza medidora. Pregunta cuántas partes iguales forman el entero."),
    extend: t("Can you find a different fraction that is the same amount? How do you know?", "¿Puedes encontrar otra fracción que sea la misma cantidad? ¿Cómo lo sabes?"),
  },
  decimals: {
    ask: [t("Which place is each digit in, and what is it worth?", "¿En qué lugar está cada dígito y cuánto vale?"), t("How do you know which decimal is larger? Convince me.", "¿Cómo sabes cuál decimal es mayor? Convénceme."), t("Which two whole numbers is this number between?", "¿Entre cuáles dos números enteros está este número?")],
    lookFor: t("Listen for tenths and hundredths named correctly, places lined up, and decimals described as parts of a whole, not as a second whole number.", "Escucha si nombra bien las décimas y las centésimas, si alinea los lugares, y si describe los decimales como partes de un entero, no como un segundo número entero."),
    ifStuck: t("Picture a hundred grid or money. Say the number out loud with its place names.", "Imaginen una cuadrícula de cien o dinero. Digan el número en voz alta con el nombre de cada lugar."),
    extend: t("What number is one tenth more? What number is one hundredth less?", "¿Qué número es una décima más? ¿Qué número es una centésima menos?"),
  },
  "ratios-percents": {
    ask: [t("How do the two amounts compare? Say it in a sentence.", "¿Cómo se comparan las dos cantidades? Dilo en una oración."), t("What would stay the same if we doubled everything?", "¿Qué se quedaría igual si duplicáramos todo?"), t("How could a table or a double number line show your thinking?", "¿Cómo podría mostrar tu razonamiento una tabla o una recta numérica doble?")],
    lookFor: t("Listen for comparisons like for every one there are some, a unit rate or a friendly benchmark like ten percent, and both amounts growing together.", "Escucha si compara con frases como por cada uno hay tantos, si usa una tasa unitaria o una referencia amigable como el diez por ciento, y si las dos cantidades crecen juntas."),
    ifStuck: t("Make a small table. Find what one unit is worth, then build up from there. Ten percent is a friendly first step for percents.", "Hagan una tabla pequeña. Busquen cuánto vale una unidad y construyan desde ahí. El diez por ciento es un buen primer paso para los porcentajes."),
    extend: t("What if the amounts were three times as big? What stays the same?", "¿Y si las cantidades fueran tres veces más grandes? ¿Qué se queda igual?"),
  },
  "patterns-algebra": {
    ask: [t("What changes from one step to the next, and what stays the same?", "¿Qué cambia de un paso al siguiente y qué se queda igual?"), t("How could you predict a step far away without listing every step?", "¿Cómo podrías predecir un paso lejano sin escribir todos los pasos?"), t("How would you describe the rule to a friend?", "¿Cómo le describirías la regla a un amigo?")],
    lookFor: t("Listen for naming the change, linking the position to the value, and a rule that would work for any step.", "Escucha si nombra el cambio, si relaciona la posición con el valor, y si da una regla que serviría para cualquier paso."),
    ifStuck: t("Write the first few steps in a table and look at the jump between each pair. Test your rule on a step you already know.", "Escriban los primeros pasos en una tabla y miren el salto entre cada par. Prueben la regla con un paso que ya conozcan."),
    extend: t("Can you build a new pattern with the same rule that starts somewhere else?", "¿Puedes crear otro patrón con la misma regla que empiece en otro lugar?"),
  },
  "geometry-measure": {
    ask: [t("What do you know about the sides or angles that helps?", "¿Qué sabes de los lados o los ángulos que te ayude?"), t("How did you decide which unit to use?", "¿Cómo decidiste qué unidad usar?"), t("How could you check your measurement another way?", "¿Cómo podrías comprobar tu medida de otra manera?")],
    lookFor: t("Listen for correct names of shapes and units, thinking about what is being measured (length, area or volume), and estimating before measuring.", "Escucha si usa bien los nombres de figuras y unidades, si piensa en qué se mide (longitud, área o volumen), y si estima antes de medir."),
    ifStuck: t("Sketch the shape and label what you know. Use something real, like a ruler, tiles or a cup, to make it concrete.", "Hagan un bosquejo de la figura y rotulen lo que saben. Usen algo real, como una regla, losetas o una taza, para hacerlo concreto."),
    extend: t("What happens to the measure if every side gets twice as long?", "¿Qué pasa con la medida si cada lado se hace el doble de largo?"),
  },
  money: {
    ask: [t("How did you figure out the total? What did you add first?", "¿Cómo averiguaste el total? ¿Qué sumaste primero?"), t("How could you make that amount with different coins or bills?", "¿Cómo podrías formar esa cantidad con otras monedas o billetes?"), t("How do you know you would get the right change?", "¿Cómo sabes que recibirías el cambio correcto?")],
    lookFor: t("Listen for counting on from the biggest coin, making friendly amounts like a dollar, and checking change by adding up.", "Escucha si cuenta desde la moneda más grande, si forma cantidades amigables como un dólar, y si comprueba el cambio sumando."),
    ifStuck: t("Use real coins or play money. Start with the biggest value and count up, saying each amount aloud.", "Usen monedas reales o de juguete. Empiecen con el valor más grande y cuenten hacia arriba diciendo cada cantidad en voz alta."),
    extend: t("If you had a set amount to spend, which items would you choose and why?", "Si tuvieras una cantidad fija para gastar, ¿qué artículos elegirías y por qué?"),
  },
  "number-line": {
    ask: [t("How did you decide where this number goes? Which landmarks helped?", "¿Cómo decidiste dónde va este número? ¿Qué puntos de referencia te ayudaron?"), t("How far is it from zero, and in which direction?", "¿A qué distancia está del cero y en qué dirección?"), t("Which two numbers is it between, and how do you know?", "¿Entre cuáles dos números está y cómo lo sabes?")],
    lookFor: t("Listen for landmarks like zero, one half or ten, equal spacing between marks, and direction when numbers are negative.", "Escucha si usa referencias como el cero, el medio o el diez, si habla de espacios iguales entre las marcas, y de la dirección cuando los números son negativos."),
    ifStuck: t("Mark the numbers you are sure about first. Count the jumps between marks and label each one.", "Marquen primero los números de los que están seguros. Cuenten los saltos entre marcas y rotulen cada una."),
    extend: t("What number is halfway between these two? How can you tell?", "¿Qué número queda a la mitad entre estos dos? ¿Cómo puedes saberlo?"),
  },
  equations: {
    ask: [t("What is the unknown, and what are you trying to find?", "¿Cuál es la incógnita y qué estás tratando de encontrar?"), t("What did you do to both sides, and why does that keep it balanced?", "¿Qué le hiciste a los dos lados y por qué eso lo mantiene en equilibrio?"), t("How could you check your answer by putting it back in?", "¿Cómo podrías comprobar tu respuesta volviéndola a poner en la ecuación?")],
    lookFor: t("Listen for balance language, undoing operations in a sensible order, and trying the answer in the original equation.", "Escucha si habla de equilibrio, si deshace las operaciones en un orden con sentido, y si prueba la respuesta en la ecuación original."),
    ifStuck: t("Draw a balance or a bar model. Read the equation as a sentence, then undo one step at a time.", "Dibujen una balanza o un modelo de barras. Lean la ecuación como una oración y deshagan un paso a la vez."),
    extend: t("Can you write a new equation that has the same answer?", "¿Puedes escribir otra ecuación que tenga la misma respuesta?"),
  },
  data: {
    ask: [t("What does this graph or table tell us? What do you notice first?", "¿Qué nos dice esta gráfica o tabla? ¿Qué notas primero?"), t("How did you decide what is typical, or in the middle?", "¿Cómo decidiste qué es lo típico o lo que está en el medio?"), t("What question could we ask next that this data could answer?", "¿Qué pregunta podríamos hacer después que estos datos puedan responder?")],
    lookFor: t("Listen for reading the title and labels first, comparing categories with numbers, and describing the shape or the center.", "Escucha si lee primero el título y las etiquetas, si compara categorías con números, y si describe la forma o el centro."),
    ifStuck: t("Start with the title and the labels. Point to one bar or one row and say what it means in a full sentence.", "Empiecen con el título y las etiquetas. Señalen una barra o una fila y digan qué significa en una oración completa."),
    extend: t("What could we change in the survey to learn something different?", "¿Qué podríamos cambiar en la encuesta para aprender algo diferente?"),
  },
};

const YOUNG_NOTE = t("Use objects, fingers or a drawing, and keep the talk short and playful.", "Usen objetos, dedos o un dibujo, y mantengan la conversación corta y divertida.");

export const GENERIC_ASKS = [
  t("How did you know?", "¿Cómo lo supiste?"),
  t("What was your first step, and why?", "¿Cuál fue tu primer paso y por qué?"),
  t("Show me with a drawing or with objects.", "Muéstrame con un dibujo o con objetos."),
  t("What would you tell a friend who is stuck on this?", "¿Qué le dirías a un amigo que se queda atascado aquí?"),
  t("What did you notice about the numbers?", "¿Qué notaste en los números?"),
  t("How could you check that your thinking makes sense?", "¿Cómo puedes comprobar que tu razonamiento tiene sentido?"),
  t("What helped you the most?", "¿Qué fue lo que más te ayudó?"),
  t("How is this like a problem you have solved before?", "¿En qué se parece esto a un problema que ya resolviste?"),
];

export const GAME_TIPS = {
  "number-builder": t("Build the number with the pieces first, then say it out loud. The pieces show what each digit is worth.", "Construyan primero el número con las piezas y luego díganlo en voz alta. Las piezas muestran cuánto vale cada dígito."),
  "math-match": t("Say why two cards belong together before you place them. Matching is about equal value, not looking alike.", "Digan por qué dos tarjetas van juntas antes de colocarlas. Emparejar es igualar valores, no parecerse."),
  "fraction-kitchen": t("Look at the whole first: how many equal parts does the cup, the pan or the bar have? Then count the parts you need.", "Miren primero el entero: ¿cuántas partes iguales tiene la taza, el molde o la barra? Luego cuenten las partes que necesitan."),
  "math-market": t("Say the price out loud as you go. Starting with the biggest coin or bill makes counting change easier.", "Digan el precio en voz alta mientras avanzan. Empezar con la moneda o el billete más grande ayuda a contar el cambio."),
  "array-architect": t("Count rows and columns separately before you talk about the total. Turn the array to see the same facts in a new way.", "Cuenten por separado las filas y las columnas antes de hablar del total. Giren el arreglo para ver las mismas operaciones de otra manera."),
  "number-line-quest": t("Find zero and a landmark before you place a point. Check that the spaces between marks are equal.", "Encuentren el cero y una referencia antes de colocar un punto. Comprueben que los espacios entre las marcas sean iguales."),
  "pattern-detective": t("Name what changes before you name the rule. Then test the rule on a step you can already see.", "Nombren lo que cambia antes de nombrar la regla. Luego prueben la regla con un paso que ya puedan ver."),
  "ratio-recipe-lab": t("Keep both amounts in the same ratio at every step. Find what one serving needs, then build up.", "Mantengan las dos cantidades en la misma razón en cada paso. Averigüen qué necesita una porción y luego construyan desde ahí."),
  "math-puzzle-studio": t("Read the whole puzzle once before you move anything. Change one piece at a time and see what it does.", "Lean todo el acertijo una vez antes de mover algo. Cambien una pieza a la vez y vean qué pasa."),
  "family-math-duel": t("Both of you play every round. Share your thinking after each round, because the best moves come from comparing ideas.", "Los dos juegan todas las rondas. Comparen su razonamiento después de cada ronda, porque las mejores jugadas salen de comparar ideas."),
};
const DEFAULT_TIP = t("Talk through each step out loud. A good question is worth more than a quick answer.", "Hablen en voz alta de cada paso. Una buena pregunta vale más que una respuesta rápida.");
export const gameTip = (gameId) => (Object.hasOwn(GAME_TIPS, gameId) ? GAME_TIPS[gameId] : DEFAULT_TIP);

const TURN_TEXT = {
  learner: (ask) => t(`Learner: solve this round and think out loud. Caregiver: stay quiet while they work, then ask, "${ask.en}"`, `Estudiante: resuelve esta ronda y piensa en voz alta. Familiar: espera en silencio mientras trabaja y luego pregunta: «${ask.es}»`),
  caregiver: (ask) => t(`Caregiver: solve this round and think out loud. Learner: you are the coach. Listen, then ask, "${ask.en}"`, `Familiar: resuelve esta ronda y piensa en voz alta. Estudiante: tú eres el entrenador. Escucha y luego pregunta: «${ask.es}»`),
  duel: (ask, first) => t(`Both of you play this round. ${first === "learner" ? "Learner" : "Caregiver"}, explain your thinking first. Then ask each other, "${ask.en}"`, `Los dos juegan esta ronda. ${first === "learner" ? "Estudiante" : "Familiar"}, explica primero tu razonamiento. Luego pregúntense: «${ask.es}»`),
};

const asksFor = (key) => STRAND_BANK[key].ask;
const keyOf = (skill, game) => strandKey(skill?.strand, skill?.id, game?.id);

// Learner solves and caregiver asks why, then they swap. The duel has both people playing every round.
export const turnRole = (index) => (Math.max(0, Math.floor(Number(index) || 0)) % 2 === 0 ? "learner" : "caregiver");

export function turn({ index = 0, game, skill, grade = 1 } = {}) {
  const i = Math.max(0, Math.floor(Number(index) || 0));
  const role = turnRole(i);
  const asks = asksFor(keyOf(skill, game));
  const ask = asks[(Math.floor(i / 2) + seedFrom(skill?.id ?? "", grade)) % asks.length];
  return { role, prompt: game?.id === "family-math-duel" ? TURN_TEXT.duel(ask, role) : TURN_TEXT[role](ask) };
}

// A talk prompt after a round; it depends only on the skill and which round this was, never on the numbers.
export function explain({ game, skill, grade = 1, round } = {}) {
  const pool = [...asksFor(keyOf(skill, game)), ...GENERIC_ASKS];
  let marker = "";
  try { marker = JSON.stringify(round?.prompt ?? round ?? ""); } catch { marker = ""; }
  return pool[seedFrom(skill?.id ?? "", grade, marker) % pool.length];
}

export function coachingCard({ gameId = "", skillId = "", strand, grade = 1 } = {}) {
  const key = strandKey(strand, skillId, gameId);
  const bank = STRAND_BANK[key];
  const ask = bank.ask[seedFrom(skillId, grade) % bank.ask.length];
  const young = Number(grade) <= 2;
  const ifStuck = young ? t(`${bank.ifStuck.en} ${YOUNG_NOTE.en}`, `${bank.ifStuck.es} ${YOUNG_NOTE.es}`) : bank.ifStuck;
  return { ask, lookFor: bank.lookFor, ifStuck, extend: bank.extend };
}
