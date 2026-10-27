// Feedback that names the mix-up, in English and Spanish: illegal plays, wrong values, bad challenges and wrong
// comparisons. None of it prints the right value: a miss is told what went wrong, never handed the answer.
// @fm2 FM-016 FM-020 FM-063
import { fmtValue, seatValue, winnerOf } from "./engine.js";

const S = (en, es) => ({ en, es });

export const FEEDBACK = {
  reuse: S(
    "That card is already taken. Each card can be used only once, so pick one that is still on the table.",
    "Esa carta ya se tomó. Cada carta se usa una sola vez; elige una que siga en la mesa.",
  ),
  kind: S(
    "That slot takes a different kind of card. Number slots take number cards, exponent slots take exponent cards and operator slots take operator cards.",
    "Ese espacio lleva otro tipo de carta. Los espacios de número llevan cartas de número, los de exponente cartas de exponente y los de operador cartas de operador.",
  ),
  "slot-taken": S(
    "That slot already holds a card. Choose an empty slot, or take your card back first.",
    "Ese espacio ya tiene una carta. Elige un espacio vacío o quita primero tu carta.",
  ),
  foreign: S(
    "That card is not in your hand. In a private game you build only from your own cards.",
    "Esa carta no está en tu mano. En un juego privado solo usas tus propias cartas.",
  ),
  turn: S(
    "It is not that player's turn yet. Wait for the turn chip to show your name.",
    "Todavía no es el turno de ese jugador. Espera a que la etiqueta de turno muestre tu nombre.",
  ),
  "bad-move": S(
    "That move is not part of this hand. Pick a card from the table and a slot of your expression.",
    "Esa jugada no es de esta mano. Elige una carta de la mesa y un espacio de tu expresión.",
  ),
  legal: S("That move is allowed.", "Esa jugada está permitida."),
  incomplete: S(
    "Finish the whole duel first: fill every slot, type your value, answer the challenge question if there is one, and say who wins.",
    "Termina primero todo el duelo: llena todos los espacios, escribe tu valor, responde la pregunta del desafío si la hay y di quién gana.",
  ),
  unreadable: S(
    "Type the value as a number: a whole number, a fraction with a slash, or a decimal with a point.",
    "Escribe el valor como número: un número entero, una fracción con barra o un decimal con punto.",
  ),
  "value-generic": S(
    "That is not the exact value of your expression. Put the cards from your slots back into the expression and work it out again, step by step.",
    "Ese no es el valor exacto de tu expresión. Vuelve a poner en la expresión las cartas de tus espacios y resuélvela otra vez, paso a paso.",
  ),
  "value-ltr": S(
    "That looks like working strictly from left to right. Multiplication comes before addition and subtraction, so do the times first.",
    "Parece que operaste estrictamente de izquierda a derecha. La multiplicación va antes que la suma y la resta, así que haz primero las multiplicaciones.",
  ),
  "value-parens": S(
    "Parentheses come first. Work out the sum inside the parentheses, then multiply.",
    "Primero van los paréntesis. Calcula la suma dentro de los paréntesis y después multiplica.",
  ),
  "value-negated": S(
    "Check the sign. The size of your answer is right, but the sign is not.",
    "Revisa el signo. El tamaño de tu respuesta es correcto, pero el signo no.",
  ),
  "value-digits": S(
    "That adds the digits. In a number every place has its own worth: a digit in the tens place is worth ten times a digit in the ones place.",
    "Eso suma los dígitos. En un número cada lugar tiene su propio valor: un dígito en el lugar de las decenas vale diez veces más que uno en las unidades.",
  ),
  "value-swapop": S(
    "That uses the wrong operation. Look at the sign between your cards: the expression adds where you multiplied, or the other way around.",
    "Usaste la operación equivocada. Mira el signo entre tus cartas: la expresión suma donde tú multiplicaste, o al revés.",
  ),
  "value-across": S(
    "Fractions with different denominators cannot be added by adding the tops and the bottoms. Find a common denominator first.",
    "Las fracciones con distinto denominador no se suman sumando los numeradores y los denominadores. Busca primero un denominador común.",
  ),
  "value-flip": S(
    "The fraction is upside down. The card on top is the numerator and the card on the bottom is the denominator, and dividing by a fraction means multiplying by its flip.",
    "La fracción está al revés. La carta de arriba es el numerador y la de abajo el denominador, y dividir entre una fracción es multiplicar por su inversa.",
  ),
  "value-percent": S(
    "Percent means out of one hundred. Divide the percent by one hundred first, or find a tenth and build up, then take that part of the number.",
    "Porcentaje significa de cada cien. Divide primero el porcentaje entre cien, o halla la décima parte y construye, y luego toma esa parte del número.",
  ),
  "value-expmul": S(
    "That multiplies the two cards. An exponent says how many times to use the base as a factor, so it means repeated multiplication, and a power of ten moves the decimal point.",
    "Eso multiplica las dos cartas. Un exponente dice cuántas veces usar la base como factor, así que significa multiplicación repetida, y una potencia de diez mueve el punto decimal.",
  ),
  "value-noroot": S(
    "That adds the numbers under the roots. Take each square root first, then add.",
    "Eso suma los números dentro de las raíces. Saca primero cada raíz cuadrada y luego suma.",
  ),
  "value-point": S(
    "Check the decimal point or the zeros: your answer is ten or a hundred times too big or too small.",
    "Revisa el punto decimal o los ceros: tu respuesta es diez o cien veces demasiado grande o demasiado pequeña.",
  ),
  "bad-challenge": S(
    "Their value is actually right, so that challenge does not hold. Recompute with the cards they placed before you challenge; a wrong challenge gives the points away.",
    "Su valor sí es correcto, así que ese desafío no se sostiene. Recalcula con las cartas que puso antes de desafiar; un desafío equivocado regala los puntos.",
  ),
  "missed-error": S(
    "Their value is not right. Recompute it from the cards in their slots before you agree, and challenge if it is off.",
    "Su valor no es correcto. Recalcúlalo con las cartas de sus espacios antes de aceptar y desafía si está mal.",
  ),
  "wrong-counter": S(
    "Their value is off, but your correction is not right either. Recompute from their cards and send the challenge again.",
    "Su valor está mal, pero tu corrección tampoco es correcta. Recalcula con sus cartas y envía el desafío otra vez.",
  ),
  "compare-tie-missed": S(
    "The two exact values are equal, so nobody wins this hand. It is a tie.",
    "Los dos valores exactos son iguales, así que nadie gana esta mano. Es un empate.",
  ),
  "compare-false-tie": S(
    "The two values are not equal. Compare them again, then decide whose is better for this goal.",
    "Los dos valores no son iguales. Compáralos de nuevo y decide cuál es mejor para esta meta.",
  ),
  "compare-closest-raw": S(
    "This goal is about distance. The winner is the value closer to the target, not the bigger value.",
    "Esta meta es de distancia. Gana el valor más cercano a la meta, no el valor más grande.",
  ),
  "compare-min-raw": S(
    "This goal rewards the smaller value, so the smaller value wins, not the bigger one.",
    "Esta meta premia el valor más pequeño, así que gana el menor, no el mayor.",
  ),
  "compare-max-raw": S(
    "This goal rewards the bigger value, so the bigger value wins, not the smaller one.",
    "Esta meta premia el valor más grande, así que gana el mayor, no el menor.",
  ),
  "compare-magnitude": S(
    "Compare the values with their signs. A negative number is less than a positive one, and among negatives the one closer to zero is greater.",
    "Compara los valores con sus signos. Un número negativo es menor que uno positivo y, entre negativos, el más cercano a cero es el mayor.",
  ),
  "compare-generic": S(
    "Compare again. Read the goal, then decide whose exact value is better for it.",
    "Compara de nuevo. Lee la meta y decide cuál valor exacto es mejor para ella.",
  ),
  generic: S(
    "That does not work. Check the rules and try again.",
    "Eso no funciona. Revisa las reglas e inténtalo otra vez.",
  ),
};

const OUTCOME = {
  0: S("You win the hand.", "Tú ganas la mano."),
  1: S("The other player wins the hand.", "El otro jugador gana la mano."),
  2: S("The hand is a tie.", "La mano es un empate."),
};

// Shown after the round is solved: what each side made and who won (it follows a solved round, never a miss).
export function goodFeedback(round, info) {
  const [v0, v1] = [seatValue(round, info.state.seats[0]), seatValue(round, info.state.seats[1])];
  const a = fmtValue(v0, round.style);
  const b = fmtValue(v1, round.style);
  const out = OUTCOME[winnerOf(round.goal, v0, v1)];
  return S(
    `Hand complete. You made ${a}, the other player made ${b}. ${out.en}`,
    `Mano completa. Tú formaste ${a}, el otro jugador formó ${b}. ${out.es}`,
  );
}
