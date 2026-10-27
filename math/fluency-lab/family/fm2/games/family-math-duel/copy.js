// Everything a player reads in Family Math Duel that is not feedback or a hint: the frame, instructions, goals, and the
// labels the interface speaks, in English and Spanish. @fm2 FM-016 FM-020 FM-027 FM-079
import { fmt, L } from "../../lang.js";

const S = (en, es) => ({ en, es });

export const TITLE = S("Family Math Duel", "Duelo de matemáticas en familia");
export const TAGLINE = S(
  "Two players, one hand of cards, and an exact winner.",
  "Dos jugadores, una mano de cartas y un ganador exacto.",
);
export const TOGETHER = S(
  "Sit side by side with one device. Take turns when the screen shows whose turn it is, and say your thinking out loud before you type a value. If you think the other person's value is off, challenge it and explain why. Caregiver: turn on Fair play to lock your weakest card into your own expression, so the learner can win honestly.",
  "Siéntense lado a lado con un solo dispositivo. Túrnense cuando la pantalla indique de quién es el turno y expliquen en voz alta lo que piensan antes de escribir un valor. Si creen que el valor del otro no es correcto, desafíenlo y expliquen por qué. Familiar: activa el Juego justo para fijar tu carta más débil en tu propia expresión y que el estudiante pueda ganar con justicia.",
);
export const HOW_TO = {
  en: [
    "Read the goal and look at the cards. Both players build an expression from cards of the same kinds, and the goal says what a winning value looks like.",
    "Take turns: pick a card, then tap the slot where it goes. Each card can be used only once. In a private-hand game, hand the device over when the screen asks you to.",
    "Type the exact value of your expression. If the other player's value looks wrong, you may challenge it and type what you think it really is.",
    "Say who wins. The exact values decide, not the cards or who went first. The winner of a hand gets 2 points and a correct challenge earns 1. With a keyboard, use the arrow keys to move and Enter to choose.",
  ],
  es: [
    "Lee la meta y mira las cartas. Los dos jugadores forman una expresión con cartas de los mismos tipos, y la meta dice cómo es un valor ganador.",
    "Túrnense: elige una carta y toca el espacio donde va. Cada carta se usa una sola vez. En un juego con manos privadas, pasen el dispositivo cuando la pantalla lo pida.",
    "Escribe el valor exacto de tu expresión. Si el valor del otro jugador parece incorrecto, puedes desafiarlo y escribir cuál crees que es en realidad.",
    "Di quién gana. Deciden los valores exactos, no las cartas ni quién empezó. El ganador de la mano recibe 2 puntos y un desafío correcto vale 1. Con teclado, usa las flechas para moverte y Enter para elegir.",
  ],
};

// ---- goals -----------------------------------------------------------------------------------------------------------
// Sentence per noun and direction. {t} is the target.
const GOALS = {
  card: {
    max: S("Play the card with the greatest value.", "Juega la carta con el mayor valor."),
    min: S("Play the card with the least value.", "Juega la carta con el menor valor."),
  },
  sum: {
    max: S("Make the biggest sum.", "Forma la suma más grande."),
    min: S("Make the smallest sum.", "Forma la suma más pequeña."),
  },
  total: {
    max: S("Make the highest total.", "Forma el total más alto."),
    min: S("Make the lowest total.", "Forma el total más bajo."),
  },
  number: {
    max: S("Build the biggest number.", "Forma el número más grande."),
    min: S("Build the smallest number.", "Forma el número más pequeño."),
  },
  product: {
    max: S("Make the biggest product.", "Forma el producto más grande."),
    min: S("Make the smallest product.", "Forma el producto más pequeño."),
  },
  fraction: {
    max: S("Make the biggest fraction.", "Forma la fracción más grande."),
    min: S("Make the smallest positive fraction.", "Forma la fracción positiva más pequeña."),
  },
  quotient: {
    max: S("Make the biggest quotient.", "Forma el cociente más grande."),
    min: S("Make the smallest positive quotient.", "Forma el cociente positivo más pequeño."),
  },
  value: {
    max: S("Make the biggest value.", "Forma el valor más grande."),
    min: S("Make the smallest value.", "Forma el valor más pequeño."),
  },
  amount: {
    max: S("Make the biggest amount.", "Forma la cantidad más grande."),
    min: S("Make the smallest amount.", "Forma la cantidad más pequeña."),
  },
  power: {
    max: S("Make the biggest power.", "Forma la potencia más grande."),
    min: S("Make the smallest power.", "Forma la potencia más pequeña."),
  },
  sci: {
    max: S(
      "Make the biggest number in scientific notation.",
      "Forma el número más grande en notación científica.",
    ),
    min: S(
      "Make the smallest positive number in scientific notation.",
      "Forma el número positivo más pequeño en notación científica.",
    ),
  },
  rootsum: {
    max: S(
      "Make the biggest sum of square roots.",
      "Forma la suma de raíces cuadradas más grande.",
    ),
    min: S(
      "Make the smallest sum of square roots.",
      "Forma la suma de raíces cuadradas más pequeña.",
    ),
  },
  diff: {
    max: S("Make the biggest difference.", "Forma la diferencia más grande."),
    min: S("Make the smallest difference.", "Forma la diferencia más pequeña."),
  },
};
const CLOSEST = S("Get as close to {t} as you can.", "Acércate lo más posible a {t}.");

export function goalSentence(round, lang, targetText = null) {
  const { goal, tpl } = round;
  if (goal.type === "closest") return fmt(L(CLOSEST, lang), { t: targetText ?? round.targetText });
  const noun = tpl === "single" ? "card" : round.noun;
  return L(GOALS[noun][goal.type], lang);
}

const TABLE = {
  open: S("Take turns picking cards from the table.", "Túrnense para elegir cartas de la mesa."),
  private: S(
    "Each player builds from their own hidden hand.",
    "Cada jugador forma su expresión con su propia mano oculta.",
  ),
};

export const promptText = (round) =>
  S(
    `Duel hand! ${goalSentence(round, "en")} ${L(TABLE[round.variant], "en")}`,
    `¡Mano de duelo! ${goalSentence(round, "es")} ${L(TABLE[round.variant], "es")}`,
  );

// ---- interface -------------------------------------------------------------------------------------------------------
export const UI = {
  you: S("You", "Tú"),
  orbit: S("Orbit", "Orbit"),
  learner: S("Learner", "Estudiante"),
  caregiver: S("Caregiver", "Familiar"),
  scores: S("Scores", "Puntos"),
  points: S("{n} points", "{n} puntos"),
  turnOf: S("{name}'s turn", "Turno de {name}"),
  turnOfYou: S("Your turn", "Tu turno"),
  waiting: S("{name} is waiting", "{name} espera"),
  goal: S("Goal", "Meta"),
  openRule: S(
    "Open table: both players see the same cards and take turns picking.",
    "Mesa abierta: los dos ven las mismas cartas y se turnan para elegir.",
  ),
  privateRule: S(
    "Private hands: each player builds from their own hidden hand.",
    "Manos privadas: cada jugador forma su expresión con su mano oculta.",
  ),
  table: S("Cards on the table", "Cartas en la mesa"),
  hand: S("{name}'s hand", "Mano de {name}"),
  handHidden: S(
    "{name}'s hand is face down until both expressions are locked in.",
    "La mano de {name} está boca abajo hasta que las dos expresiones estén fijadas.",
  ),
  board: S("{name}'s expression", "Expresión de {name}"),
  fairLabel: S(
    "Fair play: lock the weakest card into the caregiver's expression",
    "Juego justo: fijar la carta más débil en la expresión del familiar",
  ),
  fairOn: S(
    "Fair play is on: the card {card} is locked into the caregiver's expression.",
    "Juego justo activado: la carta {card} está fijada en la expresión del familiar.",
  ),
  fairNote: S(
    "Fair play can be changed until the first card is picked.",
    "El Juego justo se puede cambiar hasta que se elija la primera carta.",
  ),
  locked: S("locked in", "fijada"),
  slotEmpty: S(
    "{name}, empty slot {n} of {total}, takes a {kind} card",
    "{name}, espacio vacío {n} de {total}, lleva una carta de {kind}",
  ),
  slotFull: S(
    "{name}, slot {n} of {total} holds {card}",
    "{name}, espacio {n} de {total} con {card}",
  ),
  slotLocked: S(
    "{name}, slot {n} of {total} holds {card}, locked in by Fair play",
    "{name}, espacio {n} de {total} con {card}, fijada por el Juego justo",
  ),
  kindNum: S("number", "número"),
  kindExp: S("exponent", "exponente"),
  kindOp: S("operator", "operador"),
  cardNum: S("Card {text}", "Carta {text}"),
  cardExp: S("Exponent card {text}", "Carta de exponente {text}"),
  cardOp: S("Operator card {text}", "Carta de operador {text}"),
  cardTaken: S("{card}, already taken by {name}", "{card}, ya la tomó {name}"),
  cardHeld: S("{card}, selected", "{card}, seleccionada"),
  opNames: { "+": S("plus", "más"), "−": S("minus", "menos"), "×": S("times", "por") },
  pickAsk: S("{name}: pick a card from the table.", "{name}: elige una carta de la mesa."),
  placeAsk: S("{name}: now tap the slot for {card}.", "{name}: ahora toca el espacio para {card}."),
  placed: S("{name} placed {card}.", "{name} puso {card}."),
  orbitTook: S("Orbit took {card} and placed it.", "Orbit tomó {card} y la puso."),
  buildAsk: S(
    "{name}: pick a card, then tap a slot to place it. Tap a placed card to take it back.",
    "{name}: elige una carta y toca un espacio para ponerla. Toca una carta puesta para quitarla.",
  ),
  undo: S("Undo last pick", "Deshacer la última carta"),
  lockIn: S("Lock in my expression", "Fijar mi expresión"),
  lockNeed: S("Fill every slot before you lock in.", "Llena todos los espacios antes de fijar."),
  handTo: S("Hand the device to {name}.", "Pasa el dispositivo a {name}."),
  handToSub: S(
    "Only {name} should look at the screen now. The cards stay hidden until {name} presses the button.",
    "Ahora solo {name} debe mirar la pantalla. Las cartas siguen ocultas hasta que {name} presione el botón.",
  ),
  handBtn: S("I am {name}: show my cards", "Soy {name}: mostrar mis cartas"),
  revealed: S(
    "Both expressions are locked in and shown.",
    "Las dos expresiones están fijadas y a la vista.",
  ),
  claimAsk: S(
    "{name}: type the exact value of your expression.",
    "{name}: escribe el valor exacto de tu expresión.",
  ),
  claimLabel: S("Exact value of {name}'s expression", "Valor exacto de la expresión de {name}"),
  claimHelp: S(
    "Whole numbers, fractions with a slash and decimals with a point all work.",
    "Sirven números enteros, fracciones con barra y decimales con punto.",
  ),
  claimBtn: S("Claim this value", "Declarar este valor"),
  claims: S("{name} claims the value is {value}.", "{name} declara que el valor es {value}."),
  claimsYou: S("You claim the value is {value}.", "Tú declaras que el valor es {value}."),
  autoValue: S("{name}'s value is {value}.", "El valor de {name} es {value}."),
  orbitSays: S("Orbit says its value is {value}.", "Orbit dice que su valor es {value}."),
  theirsAsk: S(
    "{name}: do you challenge the learner's value?",
    "{name}: ¿desafías el valor del estudiante?",
  ),
  theirsYes: S("Challenge the learner's value", "Desafiar el valor del estudiante"),
  theirsNo: S("No challenge", "Sin desafío"),
  theirsHeld: S(
    "The game checked the challenge: the learner's value of {value} is correct, so the learner earns 1 point.",
    "El juego revisó el desafío: el valor del estudiante, {value}, es correcto, así que gana 1 punto.",
  ),
  callAsk: S(
    "Do you agree that {name}'s value is {value}? Check their cards before you decide.",
    "¿Estás de acuerdo en que el valor de {name} es {value}? Revisa sus cartas antes de decidir.",
  ),
  agree: S("I agree", "Estoy de acuerdo"),
  challenge: S("I challenge it", "Lo desafío"),
  counterLabel: S("My correction: the value is really", "Mi corrección: el valor es en realidad"),
  counterBtn: S("Send my challenge", "Enviar mi desafío"),
  verdictAsk: S(
    "Who wins this hand? Use the exact values.",
    "¿Quién gana esta mano? Usa los valores exactos.",
  ),
  wins: S("{name} wins", "Gana {name}"),
  winsYou: S("You win", "Ganas tú"),
  tie: S("It is a tie", "Es un empate"),
  overTitle: S("Hand result", "Resultado de la mano"),
  made: S("{name} made {expr} = {value}.", "{name} formó {expr} = {value}."),
  handWin: S("{name} wins the hand: +2.", "{name} gana la mano: +2."),
  handWinYou: S("You win the hand: +2.", "Tú ganas la mano: +2."),
  handTie: S("A tie: +1 for each player.", "Empate: +1 para cada jugador."),
  challengeWon: S(
    "Challenge upheld: {name} claimed {claim}, but the exact value is {value}. +1 for the challenger.",
    "Desafío aceptado: {name} declaró {claim}, pero el valor exacto es {value}. +1 para quien desafió.",
  ),
  theirsWon: S(
    "Challenge checked: the learner's value was right. +1 for the learner.",
    "Desafío revisado: el valor del estudiante era correcto. +1 para el estudiante.",
  ),
  roundOver: S("This hand is over.", "Esta mano terminó."),
  nobody: S("nobody", "nadie"),
  stageLabel: S("Duel table", "Mesa del duelo"),
  mode: S("Mode", "Modo"),
  ended: S("This round has ended.", "Esta ronda terminó."),
  badNumber: S("Type the value as a number: whole, a fraction or a decimal.", "Escribe el valor como número: entero, fracción o decimal."),
};

export const ui = (key, lang, vars) => fmt(L(UI[key], lang), vars);

// The same sentence for a seat: in solo play the learner is "You", which takes its own verb forms.
export const say = (key, lang, seat, mode, vars) => ui(seat === 0 && mode === "solo" ? `${key}You` : key, lang, vars);
