// Feedback text for Number Line Quest. A wrong answer is named: which way and about how far (never the target position),
// or the specific slip a catalogued wrong spot suggests. @fm2 FM-063 FM-012
const S = (en, es) => ({ en, es });

export const FB = {
  exact: S("The marker is exactly on the spot.", "El marcador está justo en el lugar."),
  near: S(
    "The marker is inside the allowed range.",
    "El marcador está dentro del rango permitido.",
  ),
  incomplete: S(
    "Move the marker onto the line first, then check.",
    "Primero pon el marcador en la recta y luego comprueba.",
  ),
  offLine: S(
    "That spot is off the line. Keep the marker between the two ends.",
    "Ese lugar está fuera de la recta. Deja el marcador entre los dos extremos.",
  ),
  hopsOk: S("You landed on the goal in {n} hops.", "Caíste en la meta con {n} saltos."),
  roundOk: S(
    "{v} is closer to {pick} than to the other benchmark.",
    "{v} está más cerca de {pick} que del otro punto de referencia.",
  ),
  orderOk: S(
    "The numbers go in order from least to greatest.",
    "Los números van en orden de menor a mayor.",
  ),
  zoomOk: S(
    "You zoomed into the right stretch and landed exactly.",
    "Te acercaste al tramo correcto y caíste justo en el lugar.",
  ),
  noHops: S(
    "Tap a hop button first to build a path.",
    "Primero toca un botón de salto para armar un camino.",
  ),
  badHop: S(
    "One of those hops is not one of the hop buttons.",
    "Uno de esos saltos no es de los botones de salto.",
  ),
  noProgress: S(
    "You are back where you started. The hops cancel each other out, so choose hops that carry you toward the goal.",
    "Volviste al inicio. Los saltos se cancelan; elige saltos que te lleven hacia la meta.",
  ),
  overshot: S(
    "You landed on {pos}, which is past the goal. Undo a hop or two, then finish with smaller hops.",
    "Caíste en {pos}, que se pasa de la meta. Deshaz uno o dos saltos y termina con saltos más pequeños.",
  ),
  short: S(
    "You landed on {pos}, which is short of the goal. Add more hops in the same direction.",
    "Caíste en {pos}, que no llega a la meta. Agrega más saltos en la misma dirección.",
  ),
  wrongWay: S(
    "You landed on {pos}, on the wrong side of where you started. The goal is to the {side} of the start.",
    "Caíste en {pos}, del lado equivocado del inicio. La meta está a la {side} del inicio.",
  ),
  tooMany: S(
    "You landed on the goal, but with {n} hops and the limit is {cap}. Use bigger hops first so you need fewer.",
    "Caíste en la meta, pero con {n} saltos y el límite es {cap}. Usa primero los saltos más grandes para necesitar menos.",
  ),
  roundedUpEarly: S(
    "The marker is before the halfway mark, so {v} is closer to the lower benchmark. Rounding up starts at halfway.",
    "El marcador está antes de la mitad, así que {v} está más cerca del punto de referencia menor. Se redondea hacia arriba desde la mitad.",
  ),
  roundedDownLate: S(
    "The marker is past the halfway mark, so {v} is closer to the upper benchmark. Halfway and beyond rounds up.",
    "El marcador pasó la mitad, así que {v} está más cerca del punto de referencia mayor. De la mitad en adelante se redondea hacia arriba.",
  ),
  tied: S(
    "Markers {a} and {b} are on the same spot, so nobody can tell which number is bigger. Spread them out.",
    "Los marcadores {a} y {b} están en el mismo lugar y no se sabe cuál número es mayor. Sepáralos.",
  ),
  absOrder: S(
    "It looks like you ordered by size without the sign. A negative number is smaller than zero, and the bigger its digits, the farther left it goes.",
    "Parece que ordenaste por tamaño sin el signo. Un número negativo es menor que cero y, mientras más grandes sus dígitos, más a la izquierda va.",
  ),
  digitsAsWhole: S(
    "It looks like you compared the digits as if there were no decimal point. Compare place by place: tenths first, then hundredths.",
    "Parece que comparaste los dígitos como si no hubiera punto decimal. Compara lugar por lugar: primero las décimas y luego las centésimas.",
  ),
  reversed: S(
    "The whole order is backwards. The least number goes on the left and the greatest on the right.",
    "Todo el orden está al revés. El menor va a la izquierda y el mayor a la derecha.",
  ),
  outOfOrder: S(
    "Look at markers {a} and {b}: one of them is on the wrong side of the other.",
    "Mira los marcadores {a} y {b}: uno está del lado equivocado del otro.",
  ),
  zoomIncomplete: S(
    "Zoom in all the way, then place the marker and check.",
    "Acércate del todo, coloca el marcador y comprueba.",
  ),
  sliceRight: S(
    "The stretch from {lo} to {hi} is too far right of the number. Zoom back out and pick a stretch farther left.",
    "El tramo de {lo} a {hi} queda demasiado a la derecha del número. Aléjate y elige un tramo más a la izquierda.",
  ),
  sliceLeft: S(
    "The stretch from {lo} to {hi} is too far left of the number. Zoom back out and pick a stretch farther right.",
    "El tramo de {lo} a {hi} queda demasiado a la izquierda del número. Aléjate y elige un tramo más a la derecha.",
  ),
};

// Catalogued wrong spots for PLACE rounds. {s}, {d}, {step} and other detail values are filled from the round.
export const TRAP = {
  stayed: S(
    "That is the number the marker started on. Move it to the number the question asks about.",
    "Ese es el número donde empezó el marcador. Muévelo al número que pide la pregunta.",
  ),
  "wrong-way": S(
    "That goes the other way. Counting on or after moves right (bigger); counting back or before moves left (smaller).",
    "Eso va hacia el otro lado. Contar hacia adelante o ir después es a la derecha (mayor); contar hacia atrás o ir antes es a la izquierda (menor).",
  ),
  overshot: S(
    "That is one hop too far. Take only the hops the question asks for.",
    "Eso es un salto de más. Da solo los saltos que pide la pregunta.",
  ),
  "stopped-early": S(
    "That is only one hop. The question asks for two, so hop once more.",
    "Eso es un solo salto. La pregunta pide dos; da otro salto.",
  ),
  "counted-zero": S(
    "That is one mark short. The starting point is not a count, so the first hop away from it is one.",
    "Falta una marca. El punto de partida no se cuenta; el primer salto desde ahí vale uno.",
  ),
  "one-too-many": S(
    "That is one mark too far. Count the hops from the start, not the marks you can see.",
    "Te pasaste una marca. Cuenta los saltos desde el inicio, no las marcas que ves.",
  ),
  "digit-swap": S(
    "The digits look switched. Check which digit is in the bigger place and which is in the smaller place.",
    "Parece que cambiaste los dígitos. Revisa cuál dígito está en el lugar mayor y cuál en el menor.",
  ),
  "leading-digit-only": S(
    "That marks only the first digit's place. The other digits tell how far past that mark the number goes.",
    "Eso marca solo el lugar del primer dígito. Los otros dígitos dicen cuánto se pasa de esa marca.",
  ),
  "wrong-parity": S(
    "That number is the wrong kind. Even numbers are 2, 4, 6 and on; odd numbers sit between them.",
    "Ese número no es del tipo que pide la pregunta. Los pares son 2, 4, 6 y así; los impares están entre ellos.",
  ),
  flipped: S(
    "It looks like the fraction was flipped. The bottom number is how many parts make one whole; the top number is how many parts to count.",
    "Parece que se volteó la fracción. El número de abajo dice cuántas partes forman un entero; el de arriba, cuántas partes contar.",
  ),
  "forgot-whole": S(
    "That is only the fraction part. Start from the whole number first, then add the fraction.",
    "Eso es solo la parte fraccionaria. Empieza en el número entero y luego suma la fracción.",
  ),
  "tenths-only": S(
    "That counts the tenths and stops. The second digit tells how many hundredths to add past that tenth.",
    "Eso cuenta las décimas y se detiene. El segundo dígito dice cuántas centésimas sumar después de esa décima.",
  ),
  "numerator-ticks": S(
    "It looks like you counted as many marks as the top number. The parts on this line are a different size from the fraction's parts.",
    "Parece que contaste tantas marcas como el número de arriba. Las partes de esta recta tienen otro tamaño que las de la fracción.",
  ),
  "denominator-ticks": S(
    "It looks like you counted as many marks as the bottom number. The bottom number tells the size of the fraction's parts, not how many marks to count.",
    "Parece que contaste tantas marcas como el número de abajo. Ese número dice el tamaño de las partes de la fracción, no cuántas marcas contar.",
  ),
  "sign-flip": S(
    "That is the same distance from zero but on the wrong side. Negative numbers sit to the left of zero.",
    "Está a la misma distancia del cero, pero del lado equivocado. Los números negativos están a la izquierda del cero.",
  ),
  "same-number": S(
    "That is the number itself. An opposite is the same distance from zero, but on the other side.",
    "Ese es el mismo número. Un opuesto está a la misma distancia del cero, pero del otro lado.",
  ),
  "wrong-direction": S(
    "The hop went the wrong way. Check the words: adding a positive or hopping right goes up; subtracting a positive or hopping left goes down.",
    "El salto fue hacia el lado equivocado. Revisa las palabras: sumar un positivo o saltar a la derecha sube; restar un positivo o saltar a la izquierda baja.",
  ),
  "distance-as-position": S(
    "That is the size of the hop, not where you land. Start from the first point and move that far.",
    "Ese es el tamaño del salto, no el lugar donde caes. Parte del primer punto y avanza esa distancia.",
  ),
  "radicand-as-position": S(
    "That is the number under the root. The root itself is much smaller; look for whole numbers whose powers are close to it.",
    "Ese es el número dentro de la raíz. La raíz es mucho menor; busca números enteros cuyas potencias se acerquen a él.",
  ),
  "radicand-halved": S(
    "Half of the number under the root is not its root. Check by multiplying your number by itself (three times for a cube root).",
    "La mitad del número dentro de la raíz no es su raíz. Comprueba multiplicando tu número por sí mismo (tres veces si es raíz cúbica).",
  ),
  "lower-square": S(
    "That is the whole-number benchmark below the root. The root sits a bit past it, not on it.",
    "Ese es el entero de referencia debajo de la raíz. La raíz está un poco después, no encima.",
  ),
  "upper-square": S(
    "That is the whole-number benchmark above the root. The root sits a bit before it, not on it.",
    "Ese es el entero de referencia arriba de la raíz. La raíz está un poco antes, no encima.",
  ),
  "exponent-low": S(
    "That is one power of ten too small. Count again how many places the power of ten moves the number.",
    "Eso es una potencia de diez de menos. Cuenta otra vez cuántos lugares mueve la potencia de diez al número.",
  ),
};

const BAND = {
  right: {
    near: S("A little too far right", "Un poco a la derecha"),
    mid: S("Too far right", "Demasiado a la derecha"),
    far: S("Much too far right", "Muy a la derecha"),
  },
  left: {
    near: S("A little too far left", "Un poco a la izquierda"),
    mid: S("Too far left", "Demasiado a la izquierda"),
    far: S("Much too far left", "Muy a la izquierda"),
  },
};

// side: "left" | "right" (where the marker is compared with the number); band: near | mid | far; d: rounded distance text or null.
export function directionFeedback(side, band, d) {
  const head = BAND[side][band];
  const big = side === "right";
  return {
    en: d
      ? `${head.en}: your marker is about ${d} too ${big ? "big" : "small"}.`
      : `${head.en}: very close, only a step or so off.`,
    es: d
      ? `${head.es}: ${big ? "te pasaste" : "te faltan"} unos ${d}.`
      : `${head.es}: muy cerca, solo un paso de diferencia.`,
  };
}
