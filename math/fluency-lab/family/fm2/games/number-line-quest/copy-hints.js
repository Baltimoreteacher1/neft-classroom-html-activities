// Hint ladders for Number Line Quest. Per family: tier 0 nudge, tier 1 strategy, tier 2 a parallel or partial step, tier 3 the
// full solution (the only tier that may state the answer). {name} values are filled from the round by hints.js.
const H = (en, es) => ({ en, es });

export const HINTS = {
  next: [
    H(
      "Find the marker on the line. Counting on moves right; counting back moves left.",
      "Busca el marcador en la recta. Contar hacia adelante es ir a la derecha; contar hacia atrás es ir a la izquierda.",
    ),
    H(
      "Decide which way the question goes, then hop that way once for every number you count.",
      "Decide hacia qué lado va la pregunta y salta hacia allá una vez por cada número que cuentas.",
    ),
    H(
      "Try the idea on the start first: one hop to the right is the number that comes after it. Then use the hops your question asks for.",
      "Prueba la idea con el inicio: un salto a la derecha es el número que viene después. Luego usa los saltos que pide tu pregunta.",
    ),
    H(
      "Move the marker to {ans}: that is {hops} {dir} from {s}.",
      "Mueve el marcador a {ans}: está {hops} {dir} de {s}.",
    ),
  ],
  whole: [
    H(
      "Look at the labelled marks. Is your number nearer the left end, the middle, or the right end?",
      "Mira las marcas con número. ¿Tu número está más cerca del extremo izquierdo, del medio o del extremo derecho?",
    ),
    H(
      "Use the labelled marks as benchmarks. Find the two labelled marks your number is between, then see how far past the smaller one it goes.",
      "Usa las marcas con número como referencias. Busca las dos marcas entre las que está tu número y mira cuánto pasa de la menor.",
    ),
    H(
      "The small ticks between the labels are equal steps. Count them from the smaller benchmark, one step at a time.",
      "Las marcas pequeñas entre los números son pasos iguales. Cuéntalas desde la referencia menor, un paso a la vez.",
    ),
    H("Move the marker to {ans}. {note}", "Mueve el marcador a {ans}. {note}"),
  ],
  parity: [
    H(
      "Even numbers are the ones you land on when you hop by twos from zero. Odd numbers are the ones in between.",
      "Los números pares son los que pisas al saltar de dos en dos desde el cero. Los impares son los que están en medio.",
    ),
    H(
      "Look at the number the marker is on. Is it even or odd? Then look in the direction the question asks for.",
      "Mira el número donde está el marcador. ¿Es par o impar? Luego mira hacia el lado que pide la pregunta.",
    ),
    H(
      "Even and odd take turns along the line: even, odd, even, odd. Check each number you pass to see which kind it is.",
      "Los pares y los impares se turnan en la recta: par, impar, par, impar. Revisa de qué tipo es cada número por el que pasas.",
    ),
    H(
      "Move the marker to {ans}: it is the {kind} number {where} {s}.",
      "Mueve el marcador a {ans}: es el número {kind} {where} {s}.",
    ),
  ],
  fraction: [
    H(
      "The line is cut into equal parts. Count how many equal parts make one whole.",
      "La recta está dividida en partes iguales. Cuenta cuántas partes iguales forman un entero.",
    ),
    H(
      "The bottom number says how many equal parts make one whole. The top number says how many of those parts to count from zero.",
      "El número de abajo dice cuántas partes iguales forman un entero. El de arriba dice cuántas de esas partes contar desde el cero.",
    ),
    H(
      "Start with one part: that is a single jump from zero. Then keep jumping, one part at a time, until you have counted the top number.",
      "Empieza con una parte: es un solo salto desde el cero. Luego sigue saltando, una parte a la vez, hasta contar el número de arriba.",
    ),
    H(
      "{v} is {a} jumps of one part from zero, so the marker goes at {ans}.",
      "{v} son {a} saltos de una parte desde el cero, así que el marcador va en {ans}.",
    ),
  ],
  equiv: [
    H(
      "This line is cut into a different number of parts than your fraction. Count the small parts in one whole of the line.",
      "Esta recta está dividida en un número de partes distinto al de tu fracción. Cuenta las partes pequeñas que hay en un entero de la recta.",
    ),
    H(
      "Find how many small parts of this line make one equal part of your fraction. Then count that many small parts for each part you need.",
      "Busca cuántas partes pequeñas de esta recta forman una parte igual de tu fracción. Luego cuenta esa cantidad de partes pequeñas por cada parte que necesitas.",
    ),
    H(
      "For example, if one fraction part is the same as four small parts, then three fraction parts are three groups of four small parts. Use your own sizes.",
      "Por ejemplo, si una parte de la fracción equivale a cuatro partes pequeñas, tres partes de la fracción son tres grupos de cuatro. Usa tus propios tamaños.",
    ),
    H(
      "Each part of {v} is {per} small parts, so {v} is {parts} small parts from zero. The marker goes at {ans}.",
      "Cada parte de {v} son {per} partes pequeñas, así que {v} son {parts} partes pequeñas desde el cero. El marcador va en {ans}.",
    ),
  ],
  mixed: [
    H(
      "A mixed number has a whole part and a fraction part. Find the whole number on the line first.",
      "Un número mixto tiene una parte entera y una parte fraccionaria. Busca primero el número entero en la recta.",
    ),
    H(
      "Go to the whole number first. Then take jumps of one part for the fraction: the bottom number gives the size of a part.",
      "Ve primero al número entero. Luego da saltos de una parte para la fracción: el número de abajo da el tamaño de una parte.",
    ),
    H(
      "After the whole number, take one small jump, then another, and stop when you have counted the top number of the fraction.",
      "Después del entero, da un salto pequeño, luego otro, y detente cuando hayas contado el número de arriba de la fracción.",
    ),
    H(
      "Go to {w}, then take {a} jumps of one part. The marker goes at {ans}.",
      "Ve a {w} y luego da {a} saltos de una parte. El marcador va en {ans}.",
    ),
  ],
  decimal: [
    H(
      "Find the whole numbers on the line first. Is your number just past a whole number, or close to the next one?",
      "Busca primero los números enteros en la recta. ¿Tu número está justo después de un entero o cerca del siguiente?",
    ),
    H(
      "Each big tick is a tenth. The first digit after the point tells how many tenths. A second digit tells how many hundredths more.",
      "Cada marca grande es una décima. El primer dígito después del punto dice cuántas décimas. Un segundo dígito dice cuántas centésimas más.",
    ),
    H(
      "Halfway between two whole numbers is five tenths. Decide whether your number is before or after halfway, then count tenths and then hundredths.",
      "La mitad entre dos enteros es cinco décimas. Decide si tu número está antes o después de la mitad y luego cuenta décimas y después centésimas.",
    ),
    H("Move the marker to {ans}. {note}", "Mueve el marcador a {ans}. {note}"),
  ],
  signed: [
    H(
      "Zero is the dividing point. Numbers to the right of zero are positive and numbers to the left are negative.",
      "El cero es el punto que divide. Los números a la derecha del cero son positivos y los de la izquierda son negativos.",
    ),
    H(
      "Decide the side first, then count how far from zero. A negative number is as far from zero as its positive twin, but on the left.",
      "Decide primero el lado y luego cuenta qué tan lejos está del cero. Un número negativo está tan lejos del cero como su gemelo positivo, pero a la izquierda.",
    ),
    H(
      "Find the positive twin first (the same number without a negative sign), then picture it flipped to the other side of zero.",
      "Busca primero el gemelo positivo (el mismo número sin signo negativo) y luego imagínalo del otro lado del cero.",
    ),
    H(
      "Move the marker to {ans}: it is {dist} from zero, on the {side} side.",
      "Mueve el marcador a {ans}: está a {dist} del cero, en el lado {side}.",
    ),
  ],
  opposite: [
    H(
      "Opposites are the same distance from zero, on opposite sides of it.",
      "Los opuestos están a la misma distancia del cero, en lados contrarios.",
    ),
    H(
      "Find how far the number is from zero, then go the same distance the other way.",
      "Busca qué tan lejos está el número del cero y avanza la misma distancia hacia el otro lado.",
    ),
    H(
      "If a number is to the right of zero, its opposite is the same distance to the left, and the other way around.",
      "Si un número está a la derecha del cero, su opuesto está a la misma distancia a la izquierda, y al revés.",
    ),
    H(
      "The opposite of {v} is {ans}: both are {dist} from zero, on different sides.",
      "El opuesto de {v} es {ans}: los dos están a {dist} del cero, en lados distintos.",
    ),
  ],
  absolute: [
    H(
      "Distance from zero is never negative. It tells how far, not which side.",
      "La distancia al cero nunca es negativa. Dice qué tan lejos, no de qué lado.",
    ),
    H(
      "Read the side from the words, left or right of zero, then measure the distance from zero on that side.",
      "Lee el lado en las palabras, izquierda o derecha del cero, y mide la distancia desde el cero hacia ese lado.",
    ),
    H(
      "Left of zero means a negative number and right of zero means a positive number. Count the distance in hops from zero.",
      "A la izquierda del cero es un número negativo y a la derecha es positivo. Cuenta la distancia en saltos desde el cero.",
    ),
    H(
      "{d} units from zero on the {side} side is {ans}.",
      "A {d} unidades del cero, en el lado {side}, está {ans}.",
    ),
  ],
  hopplace: [
    H(
      "Read the words: does the hop go left (smaller) or right (bigger)?",
      "Lee las palabras: ¿el salto va a la izquierda (menor) o a la derecha (mayor)?",
    ),
    H(
      "Find the starting number first. Make the hop on the line, left or right, and only then move the marker.",
      "Busca primero el número de inicio. Haz el salto en la recta, a la izquierda o a la derecha, y solo después mueve el marcador.",
    ),
    H(
      "Subtracting a positive number moves left. Subtracting a negative number does the opposite: it moves right, as if you added.",
      "Restar un número positivo mueve a la izquierda. Restar un negativo hace lo contrario: mueve a la derecha, como si sumaras.",
    ),
    H(
      "Start at {s} and move {size} to the {dir}. You land at {ans}.",
      "Empieza en {s} y muévete {size} hacia la {dir}. Caes en {ans}.",
    ),
  ],
  distance: [
    H(
      "Point B stays where it is. Your marker has to be a set distance from B.",
      "El punto B se queda donde está. Tu marcador debe estar a cierta distancia de B.",
    ),
    H(
      "Left of B means smaller numbers and right of B means bigger numbers. Measure from B, not from zero.",
      "A la izquierda de B hay números menores y a la derecha de B hay mayores. Mide desde B, no desde el cero.",
    ),
    H(
      "Picture a hop of that size that starts at B instead of at zero. Which way does the question send it?",
      "Imagina un salto de ese tamaño que empieza en B y no en el cero. ¿Hacia dónde lo manda la pregunta?",
    ),
    H(
      "From B at {b}, go {d} to the {side}. The marker goes at {ans}.",
      "Desde B, que está en {b}, avanza {d} hacia el lado {side}. El marcador va en {ans}.",
    ),
  ],
  root: [
    H(
      "Find two perfect powers that the number under the root sits between.",
      "Busca dos potencias perfectas entre las que esté el número dentro de la raíz.",
    ),
    H(
      "The roots of those perfect powers are whole numbers on the line, so your root sits between them. Is it nearer the lower one or the upper one?",
      "Las raíces de esas potencias perfectas son enteros de la recta, así que tu raíz está entre ellos. ¿Está más cerca del menor o del mayor?",
    ),
    H(
      "For example, 10 is between 9 and 16, so its square root is between 3 and 4, a little past 3 because 10 is close to 9. Think the same way about yours.",
      "Por ejemplo, 10 está entre 9 y 16, así que su raíz cuadrada está entre 3 y 4, un poco después de 3 porque 10 está cerca de 9. Piensa igual con la tuya.",
    ),
    H("{v} {between}. The root is about {ans}.", "{v} {between}. La raíz es de unos {ans}."),
  ],
  sci: [
    H(
      "A power of ten tells how many places the front number grows. Count the zeros.",
      "Una potencia de diez dice cuántos lugares crece el número de enfrente. Cuenta los ceros.",
    ),
    H(
      "Find the power of ten on this line: it is one of the big tick marks. Then multiply it by the front number.",
      "Busca la potencia de diez en esta recta: es una de las marcas grandes. Luego multiplícala por el número de enfrente.",
    ),
    H(
      "For example, 2 × 10³ is 2 thousands, which is 2 000. Write your number out the same way: front number times the power of ten.",
      "Por ejemplo, 2 × 10³ es 2 millares, o sea 2 000. Escribe tu número igual: el número de enfrente por la potencia de diez.",
    ),
    H(
      "{v} written out is {ans}, so the marker goes there.",
      "{v} escrito completo es {ans}, así que el marcador va ahí.",
    ),
  ],
  "hop-count": [
    H(
      "How far is it from the start to the goal? Count the steps you need.",
      "¿Qué tan lejos está la meta del inicio? Cuenta los pasos que necesitas.",
    ),
    H(
      "Each hop is one step. Tap the hop button once for each step and watch where you land.",
      "Cada salto es un paso. Toca el botón de salto una vez por cada paso y mira dónde caes.",
    ),
    H(
      "If you pass the goal, undo and use fewer hops. Counting back means hopping left.",
      "Si te pasas de la meta, deshaz y usa menos saltos. Contar hacia atrás es saltar a la izquierda.",
    ),
    H(
      "One path that works: {plan}. It lands on the goal.",
      "Un camino que sirve: {plan}. Cae en la meta.",
    ),
  ],
  "hop-tens": [
    H(
      "Big hops first. Which hop gets you closest to the goal without going past it?",
      "Primero los saltos grandes. ¿Cuál salto te acerca más a la meta sin pasarte?",
    ),
    H(
      "Use the biggest hops that fit, then use smaller hops to finish the last part.",
      "Usa los saltos más grandes que quepan y luego saltos pequeños para terminar.",
    ),
    H(
      "For example, to go from 5 up to 27, hop twice by tens to reach 25, then twice by ones. Use the same idea with your numbers.",
      "Por ejemplo, para ir de 5 a 27, salta dos veces de diez en diez hasta 25 y luego dos veces de uno en uno. Usa la misma idea con tus números.",
    ),
    H("One path that works: {plan}.", "Un camino que sirve: {plan}."),
  ],
  "hop-skip": [
    H(
      "Skip counting uses the same hop again and again. Which hop size does the question name?",
      "Contar de salto en salto usa el mismo salto una y otra vez. ¿Qué tamaño de salto nombra la pregunta?",
    ),
    H(
      "Count how many hops of that size fit between the start and the goal.",
      "Cuenta cuántos saltos de ese tamaño caben entre el inicio y la meta.",
    ),
    H(
      "Every hop adds the same amount, so after two hops you have moved twice that size. Keep counting hops until you reach the goal.",
      "Cada salto suma lo mismo, así que después de dos saltos te moviste el doble de ese tamaño. Sigue contando saltos hasta llegar a la meta.",
    ),
    H("Hop {m} times by {k}: {plan}.", "Salta {m} veces de {k} en {k}: {plan}."),
  ],
  "hop-rational": [
    H(
      "Is the goal to the left or to the right of the start? Pick hops that go that way.",
      "¿La meta está a la izquierda o a la derecha del inicio? Elige saltos que vayan hacia allá.",
    ),
    H(
      "Use the larger hops first, then the smaller hops to land exactly. A negative hop moves left.",
      "Usa primero los saltos más grandes y luego los pequeños para caer justo. Un salto negativo mueve a la izquierda.",
    ),
    H(
      "If your path crosses zero, remember that numbers keep getting smaller as you go left, even past zero.",
      "Si tu camino cruza el cero, recuerda que los números siguen siendo menores mientras vas a la izquierda, incluso después del cero.",
    ),
    H("One path that works: {plan}.", "Un camino que sirve: {plan}."),
  ],
  round: [
    H(
      "Look at the halfway mark between the two benchmarks. Is your number before it or after it?",
      "Mira la marca de la mitad entre los dos puntos de referencia. ¿Tu número está antes o después de ella?",
    ),
    H(
      "Before halfway, a number is closer to the lower benchmark. At halfway or past it, a number is closer to the upper benchmark.",
      "Antes de la mitad, un número está más cerca del punto de referencia menor. En la mitad o después, está más cerca del mayor.",
    ),
    H(
      "Drop the marker where your number sits, then compare how far it is from each end. The shorter distance shows the nearest benchmark.",
      "Pon el marcador donde está tu número y compara qué tan lejos queda de cada extremo. La distancia más corta muestra el punto de referencia más cercano.",
    ),
    H(
      "{v} is {half} halfway, so it is nearest to {ans}.",
      "{v} está {half} de la mitad, así que está más cerca de {ans}.",
    ),
  ],
  "order-dec": [
    H(
      "Compare decimals place by place, starting with the biggest place: ones, then tenths, then hundredths.",
      "Compara los decimales lugar por lugar, empezando por el lugar mayor: unidades, luego décimas y luego centésimas.",
    ),
    H(
      "A longer decimal is not always bigger. Write each number with the same number of decimal places by adding zeros, then compare.",
      "Un decimal más largo no siempre es mayor. Escribe cada número con la misma cantidad de lugares decimales agregando ceros y luego compara.",
    ),
    H(
      "Place the number you are surest about first, then fit the others to its left or right.",
      "Coloca primero el número del que estés más seguro y acomoda los demás a su izquierda o derecha.",
    ),
    H("From least to greatest the numbers go {ans}.", "De menor a mayor, los números van {ans}."),
  ],
  "order-signed": [
    H(
      "Negative numbers sit left of zero. The farther left a number is, the smaller it is.",
      "Los números negativos están a la izquierda del cero. Mientras más a la izquierda, menor es el número.",
    ),
    H(
      "Sort the negatives first: among negatives, the one with the bigger digits is the smaller number. Then put zero and the positives to the right.",
      "Ordena primero los negativos: entre negativos, el de dígitos más grandes es el menor. Luego pon el cero y los positivos a la derecha.",
    ),
    H(
      "Place one number you are sure of, such as the biggest positive, then fit the others to its left.",
      "Coloca un número del que estés seguro, como el mayor positivo, y acomoda los demás a su izquierda.",
    ),
    H("From least to greatest the numbers go {ans}.", "De menor a mayor, los números van {ans}."),
  ],
  zoom: [
    H(
      "Look at the first digit after the decimal point. It tells which tenth the number is in.",
      "Mira el primer dígito después del punto decimal. Dice en qué décima está el número.",
    ),
    H(
      "Zoom into that tenth, then use the next digit to choose the stretch inside it. Keep zooming until the ticks are the size of the last digit.",
      "Acércate a esa décima y usa el siguiente dígito para elegir el tramo dentro de ella. Sigue acercándote hasta que las marcas tengan el tamaño del último dígito.",
    ),
    H(
      "For example, for 0.62 you would zoom to the stretch from 0.6 to 0.7, and then to the stretch from 0.62 to 0.63.",
      "Por ejemplo, para 0.62 te acercarías al tramo de 0.6 a 0.7 y luego al tramo de 0.62 a 0.63.",
    ),
    H(
      "Zoom to {chain}. Then the marker goes at {ans}.",
      "Acércate a {chain}. Luego el marcador va en {ans}.",
    ),
  ],
};
HINTS.count = HINTS.whole;

// Answer-free fallbacks, used when a hint would otherwise print the answer before tier 3. They contain no numerals.
export const SAFE = [
  H(
    "Look at the whole line first: where does this number belong compared with the two ends?",
    "Mira primero toda la recta: ¿dónde va este número comparado con los dos extremos?",
  ),
  H(
    "Use the labelled marks as benchmarks and decide which two this number is between.",
    "Usa las marcas con número como referencias y decide entre cuáles dos está este número.",
  ),
  H(
    "Try the same idea with an easier number first, then do it again with yours.",
    "Prueba la misma idea con un número más fácil y luego hazla con el tuyo.",
  ),
];
