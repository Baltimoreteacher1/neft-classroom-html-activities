// One Socratic question per diagnosable step error, EN + ES.
//
// Product rule (Joel): interactive tutors never give the answer. So a nudge is a
// question about the student's OWN line that sends them back to the line above —
// it names no number, states no correct line, and never says what to type. It
// carries no digits at all (step-diagnosis.test.mjs enforces that), because a
// number in a nudge for one problem is the answer to the next preset.
//
// The chip beside it ("Looks like: Distributed to the first term only") is the
// misconception's own label from misconceptions.js, so the wording students meet
// here is the wording the heatmap and the small-group console show their teacher.

// Four swapped-operation tags share one question: the move is the same (compare
// the sign you wrote with the sign in the line above), whichever sign it was.
const SAME_SIGN = {
  en: "Look at the sign between those two numbers in the line above. Did your line keep it?",
  es: "Mira el signo entre esos dos números en la línea de arriba. ¿Tu línea lo conservó?",
};

export const STEP_NUDGES = Object.freeze({
  "algebra-distributive-partial": {
    en: "What does the number outside the parentheses multiply? Point to every term inside.",
    es: "¿Qué multiplica el número de afuera del paréntesis? Señala cada término de adentro.",
  },
  "order-of-operations-left-to-right": {
    en: "Which operation has to happen first in the line above? Circle it before you compute.",
    es: "¿Qué operación debe hacerse primero en la línea de arriba? Enciérrala en un círculo antes de calcular.",
  },
  "exponent-as-multiplication": {
    en: "What does the small raised number tell you to do with the base? Write out every factor.",
    es: "¿Qué te dice el número pequeño de arriba que hagas con la base? Escribe todos los factores.",
  },
  "fraction-added-denominators": {
    en: "Before you add fractions, what has to be true about the size of their pieces? Does adding the bottom numbers keep it true?",
    es: "Antes de sumar fracciones, ¿qué debe ser cierto sobre el tamaño de sus partes? ¿Sumar los números de abajo lo mantiene cierto?",
  },
  "fraction-no-reciprocal": {
    en: "When you divide by a fraction, how many of those pieces fit into the first amount? What could you do to the second fraction to count that?",
    es: "Cuando divides entre una fracción, ¿cuántas de esas partes caben en la primera cantidad? ¿Qué podrías hacerle a la segunda fracción para contarlo?",
  },
  "equation-not-inverse-operation": {
    en: "Which operation is joined to the variable? What would undo it, and does your line do that?",
    es: "¿Qué operación está unida a la variable? ¿Qué la desharía, y tu línea hace eso?",
  },
  "equation-answered-with-given-number": {
    en: "Put your number in for the variable in the line above. Do both sides come out equal?",
    es: "Pon tu número en lugar de la variable en la línea de arriba. ¿Los dos lados quedan iguales?",
  },
  "op-added-instead-of-multiplied": SAME_SIGN,
  "op-divided-instead-of-multiplied": SAME_SIGN,
  "op-multiplied-instead-of-added": SAME_SIGN,
  "op-multiplied-instead-of-divided": SAME_SIGN,
  "op-reversed-subtraction": {
    en: "Which amount do you start with, and which do you take away? Does your line keep that order?",
    es: "¿Con qué cantidad empiezas y cuál le quitas? ¿Tu línea conserva ese orden?",
  },
  "op-reversed-division": {
    en: "Which amount is being split, and into how many parts? Does your line keep that order?",
    es: "¿Qué cantidad se está repartiendo y en cuántas partes? ¿Tu línea conserva ese orden?",
  },
  "decimal-place-value": {
    en: "Estimate first: about how big should this piece be? Does your line match that size?",
    es: "Estima primero: ¿qué tan grande debería ser esta parte, más o menos? ¿Tu línea coincide con ese tamaño?",
  },
  "sign-dropped": {
    en: "Is the piece you just worked out above zero or below zero? Does your line sit on the same side?",
    es: "¿La parte que acabas de calcular está arriba o abajo de cero? ¿Tu línea queda del mismo lado?",
  },
});

/** The Socratic question for a diagnosed step error, or null for an unknown tag. */
export function stepNudge(tag) {
  return STEP_NUDGES[tag] || null;
}
