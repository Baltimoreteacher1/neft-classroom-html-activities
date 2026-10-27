// Everything a learner reads in Math Match, in English and Spanish: the frame, instructions, hints, feedback that
// names the specific mix-up, and the labels on the board. Tiers 0-2 of the hints never use digits, so they cannot
// state a value from the board. @fm2 FM-020 FM-032 FM-033 FM-008

const S = (en, es) => ({ en, es });

export const TITLE = S("Math Match", "Pares matemáticos");
export const TAGLINE = S(
  "Flip cards and match the ones that mean the same thing.",
  "Voltea cartas y empareja las que significan lo mismo.",
);
export const TOGETHER = S(
  "Take turns flipping. Before the next card is turned over, the player who flipped says out loud what the card means. When two cards match, tell each other how you know.",
  "Túrnense para voltear. Antes de voltear la siguiente carta, quien volteó dice en voz alta qué significa. Cuando dos cartas coincidan, explíquense cómo lo saben.",
);
export const HOW_TO = {
  en: [
    "Tap a card to turn it over. Turn over two cards at a time, or three when each set has three cards.",
    "Look for cards that show the same idea in different ways, like a number, a picture and a word.",
    "If the cards do not match, press Got it and they turn back over. Try to remember where each card is.",
    "Find every set to finish. With a keyboard, use the arrow keys to move and Enter or Space to turn a card.",
  ],
  es: [
    "Toca una carta para voltearla. Voltea dos cartas a la vez, o tres cuando cada conjunto tiene tres cartas.",
    "Busca cartas que muestren la misma idea de maneras distintas, como un número, un dibujo y una palabra.",
    "Si las cartas no coinciden, presiona Entendido y se voltean de nuevo. Trata de recordar dónde está cada carta.",
    "Encuentra todos los conjuntos para terminar. Con teclado, usa las flechas para moverte y Enter o Espacio para voltear.",
  ],
};

export const prompt = (sets, size) =>
  S(
    `Flip ${size === 2 ? "two cards" : "three cards"} at a time to find ${sets} ${size === 2 ? "pairs" : "sets of three"} that mean the same thing.`,
    `Voltea ${size === 2 ? "dos cartas" : "tres cartas"} a la vez para encontrar ${sets} ${size === 2 ? "parejas" : "conjuntos de tres"} que signifiquen lo mismo.`,
  );

// The board and card labels the interface speaks. {n} is the card number as a learner counts it (1-based).
export const UI = {
  group: S("Memory cards", "Cartas de memoria"),
  down: S("Card {n}, face down", "Carta {n}, boca abajo"),
  up: S("Card {n}, face up: {face}", "Carta {n}, boca arriba: {face}"),
  matched: S("Card {n}, matched: {face}", "Carta {n}, emparejada: {face}"),
  shown: S("Card {n}, shown: {face}, set {set}", "Carta {n}, mostrada: {face}, conjunto {set}"),
  progress: S(
    "Sets found: {found} of {total}. Turns: {turns}.",
    "Conjuntos encontrados: {found} de {total}. Turnos: {turns}.",
  ),
  gotIt: S("Got it", "Entendido"),
  noMatch: S(
    "Not a match. Press Got it to turn the cards back over.",
    "No coinciden. Presiona Entendido para voltear las cartas de nuevo.",
  ),
  match: S(
    "A match! Sets found: {found} of {total}.",
    "¡Pareja! Conjuntos encontrados: {found} de {total}.",
  ),
  flipped: S("Card {n} turned over: {face}.", "Carta {n} volteada: {face}."),
  turnedBack: S("The cards turned back over.", "Las cartas se voltearon de nuevo."),
  allDone: S("Every set is matched.", "Todos los conjuntos están emparejados."),
  shownAll: S("The matching sets are shown.", "Se muestran los conjuntos que coinciden."),
  hint: S(
    "Cards turned over so far in this try: {k} of {size}.",
    "Cartas volteadas en este intento: {k} de {size}.",
  ),
};

export const HINT_NUDGE = S(
  "Turn a card over and look closely. Then think: which other card shows this same idea in a different way? Try to remember where each card is.",
  "Voltea una carta y mírala con atención. Luego piensa: ¿qué otra carta muestra esta misma idea de otra manera? Trata de recordar dónde está cada carta.",
);
export const HINT_NO_EXAMPLE = S(
  "Pick a card. Work out what it means in your own words or on paper, then look for the card that means the same thing.",
  "Elige una carta. Averigua qué significa con tus palabras o en papel y luego busca la carta que signifique lo mismo.",
);
export const hintExample = (cards) =>
  S(
    `Try this practice set, which is not on your board: ${cards.en}. These cards look different but mean the same thing.`,
    `Prueba este conjunto de práctica, que no está en tu tablero: ${cards.es}. Estas cartas se ven distintas pero significan lo mismo.`,
  );
export const hintAnswer = (sets, values) =>
  S(
    `The matching sets are: ${sets.en}. Values: ${values}.`,
    `Los conjuntos que coinciden son: ${sets.es}. Valores: ${values}.`,
  );

export const STRATEGY = {
  "k-count": S(
    "Think about how many. Count the dots or counters, then look for the numeral and the word for that same amount.",
    "Piensa en cuántos hay. Cuenta los puntos o las fichas y busca el número y la palabra para esa misma cantidad.",
  ),
  "k-teen": S(
    "A teen number is one ten and some extra ones. A full ten-frame shows the ten and the leftover counters are the ones.",
    "Estos números son una decena más algunas unidades. Un cuadro de diez lleno muestra la decena y las fichas que sobran son las unidades.",
  ),
  "g1-add": S(
    "Work out each total in your head, then find the equation, the picture and the number that give that same total.",
    "Calcula cada total mentalmente y busca la suma, el dibujo y el número que dan ese mismo total.",
  ),
  "g1-time": S(
    "Look at where the short hand, which shows the hour, and the long hand, which shows the minutes, point. Then find the digital time and the words for it.",
    "Mira adónde señalan la manecilla corta, que marca la hora, y la larga, que marca los minutos. Luego busca la hora digital y las palabras que la dicen.",
  ),
  "g2-skip": S(
    "Count by the same jump each time. The number of jumps is the number of rows, and the size of one jump is how many are in each row.",
    "Cuenta con el mismo salto cada vez. La cantidad de saltos es la cantidad de filas y el tamaño de un salto es cuántos hay en cada fila.",
  ),
  "g2-place": S(
    "Each rod is worth ten and each cube is worth one. Say the number out loud as tens and ones, then find its other forms.",
    "Cada barra vale diez y cada cubito vale uno. Di el número en voz alta como decenas y unidades y busca sus otras formas.",
  ),
  "g2-coins": S(
    "Add the coins by value, starting with the biggest coin. Then find the cents and the words that match your total.",
    "Suma las monedas por su valor, empezando por la más grande. Luego busca los centavos y las palabras que coinciden con tu total.",
  ),
  "g3-fraction": S(
    "The bottom number tells how many equal parts make a whole and the top number tells how many parts you count. On the number line, count that many parts from zero.",
    "El número de abajo dice cuántas partes iguales forman un entero y el de arriba cuántas partes cuentas. En la recta numérica, cuenta esas partes desde el cero.",
  ),
  "g3-multiply": S(
    "Rows times the number in each row gives the total. Count the array row by row, or skip count.",
    "Las filas por la cantidad de cada fila dan el total. Cuenta el arreglo fila por fila o cuenta saltando.",
  ),
  "g4-equiv": S(
    "Equivalent fractions name the same amount. Multiply or divide the top and bottom by the same number, or compare how much of the bar is shaded.",
    "Las fracciones equivalentes nombran la misma cantidad. Multiplica o divide arriba y abajo por el mismo número, o compara cuánta parte de la barra está sombreada.",
  ),
  "g4-fracdec": S(
    "Tenths use one place after the decimal point and hundredths use two. Picture a grid of one hundred squares to compare them.",
    "Las décimas usan un lugar después del punto decimal y las centésimas usan dos. Imagina una cuadrícula de cien cuadrados para compararlas.",
  ),
  "g4-wordform": S(
    "Say the number in parts, one group of digits at a time, and notice which place each digit is in. A zero means that place is empty.",
    "Di el número por partes, un grupo de cifras a la vez, y fíjate en qué lugar está cada cifra. Un cero significa que ese lugar está vacío.",
  ),
  "g5-fdp": S(
    "A percent means out of one hundred. Rename each amount as hundredths and you have both the decimal and the percent.",
    "Un porcentaje significa por cada cien. Escribe cada cantidad en centésimas y tendrás el decimal y el porcentaje.",
  ),
  "g5-order": S(
    "Follow the order of operations: parentheses first, then multiply and divide, then add and subtract from left to right.",
    "Sigue el orden de las operaciones: primero los paréntesis, luego multiplicar y dividir, y al final sumar y restar de izquierda a derecha.",
  ),
  "g6-ratio": S(
    "A unit rate tells how much for one of something. Divide to find it, or see how the table grows from one row to the next.",
    "Una tasa unitaria dice cuánto hay por cada uno. Divide para hallarla o mira cómo crece la tabla de una fila a la siguiente.",
  ),
  "g6-fdp": S(
    "Rename each amount as an amount out of one hundred, which is the percent. Moving the decimal point two places turns a decimal into a percent.",
    "Escribe cada cantidad como una cantidad por cada cien, que es el porcentaje. Mover el punto decimal dos lugares convierte un decimal en porcentaje.",
  ),
  "g6-verbal": S(
    "Say in words what happens to the number n, then test it in a table with small numbers. More than adds, less than subtracts and times multiplies.",
    "Di con palabras qué le pasa al número n y pruébalo en una tabla con números pequeños. Más que suma, menos que resta y veces multiplica.",
  ),
  "g7-prop": S(
    "In a proportional relationship y is always the same number of times x. Divide y by x in a row to find that constant.",
    "En una relación proporcional, y es siempre el mismo número de veces x. Divide y entre x en una fila para hallar esa constante.",
  ),
  "g7-integers": S(
    "Start at the first number and move along the number line. Adding moves right, subtracting moves left, and subtracting a negative moves right.",
    "Empieza en el primer número y muévete por la recta numérica. Sumar mueve a la derecha, restar mueve a la izquierda y restar un negativo mueve a la derecha.",
  ),
  "g8-linear": S(
    "The number multiplied by x is the slope and the number added is where the line crosses the y-axis. Test one point from the table.",
    "El número que multiplica a x es la pendiente y el número que se suma es donde la recta cruza el eje y. Prueba un punto de la tabla.",
  ),
  "g8-exponents": S(
    "Multiply the front numbers first, then add the exponents of ten. Scientific notation has exactly one nonzero digit before the decimal point.",
    "Multiplica primero los números del frente y luego suma los exponentes de diez. La notación científica tiene exactamente una cifra distinta de cero antes del punto decimal.",
  ),
};

// Feedback names the mix-up between the two cards that were turned over; it never says where their partners are.
export const FEEDBACK = {
  opposite: S(
    "These two are opposites: the same distance from zero, but on different sides.",
    "Estas dos son opuestas: están a la misma distancia del cero, pero en lados distintos.",
  ),
  reciprocal: S(
    "These two use the same numbers with the top and bottom swapped. Flipping a fraction makes a different amount.",
    "Estas dos usan los mismos números con arriba y abajo cambiados. Voltear una fracción da una cantidad distinta.",
  ),
  "same-numerator": S(
    "The top numbers match, but the bottom numbers are different, so the parts are different sizes.",
    "Los números de arriba coinciden, pero los de abajo son distintos, así que las partes tienen tamaños diferentes.",
  ),
  "same-denominator": S(
    "The parts are the same size, but one has more of them than the other.",
    "Las partes tienen el mismo tamaño, pero una tiene más partes que la otra.",
  ),
  tenfold: S(
    "One of these is ten or one hundred times the other. Check where the decimal point or the place value is.",
    "Una de estas es diez o cien veces la otra. Revisa dónde está el punto decimal o el valor posicional.",
  ),
  digits: S(
    "These use the same digits in a different order, so each digit is worth something different.",
    "Estas usan las mismas cifras en otro orden, así que cada cifra vale algo distinto.",
  ),
  scale: S(
    "One of these is double the other. Take another look at how much each one shows.",
    "Una de estas es el doble de la otra. Mira otra vez cuánto muestra cada una.",
  ),
  close: S(
    "These are close, but they are not equal. Compare them carefully before you decide.",
    "Estas se parecen, pero no son iguales. Compáralas con cuidado antes de decidir.",
  ),
  different: S(
    "These two do not mean the same thing. Remember where each one is and keep looking.",
    "Estas dos no significan lo mismo. Recuerda dónde está cada una y sigue buscando.",
  ),
  "sign-first": S(
    "One part of these is the opposite of the other. Check the sign: plus or minus, up or down.",
    "Una parte de estas es la opuesta de la otra. Revisa el signo: más o menos, arriba o abajo.",
  ),
  "same-first": S(
    "The first part matches, but the second part does not. Check both parts.",
    "La primera parte coincide, pero la segunda no. Revisa las dos partes.",
  ),
  "same-second": S(
    "The second part matches, but the first part does not. Check both parts.",
    "La segunda parte coincide, pero la primera no. Revisa las dos partes.",
  ),
  swapped: S(
    "These use the same two numbers, but each number does a different job. Check which number does which job.",
    "Estas usan los mismos dos números, pero cada número hace un trabajo distinto. Fíjate qué número hace cada trabajo.",
  ),
  incomplete: S(
    "That set matches. Keep going until every card has its partners.",
    "Ese conjunto coincide. Sigue hasta que cada carta tenga sus compañeras.",
  ),
  malformed: S(
    "That answer did not list the cards the way the game needs. Reset the puzzle and try again.",
    "Esa respuesta no lista las cartas como el juego necesita. Reinicia el reto e inténtalo de nuevo.",
  ),
};
export const FEEDBACK_CORRECT = S(
  "Every set is matched in {turns} turns.",
  "Todos los conjuntos están emparejados en {turns} turnos.",
);
export const FEEDBACK_CORRECT_PLAIN = S(
  "Every set is matched.",
  "Todos los conjuntos están emparejados.",
);
