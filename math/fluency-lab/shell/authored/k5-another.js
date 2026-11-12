// "Another way" for every K–5 skill: a second road into a problem, offered beside help in Practice (content.js
// anotherWay). Each is a DIFFERENT strategy from the skill's main explanation, written for Spanish learners as much as
// English ones, because the bank's own hints and steps are English-only. No line names a number a generated problem
// could ask about, so none can state an answer; k5.test.mjs checks every one against 200 items with revealsAnswer.
import { L } from "./k5-kit.js";

export const ANOTHER = {
  // Kindergarten
  "0:count-forward": L(
    "Say the numbers out loud from a number you know. Tap the table once for each number. Stop when you reach the number in the question, then say one more.",
    "Di los números en voz alta desde uno que conoces. Toca la mesa una vez por cada número. Para cuando llegues al número de la pregunta y di uno más.",
  ),
  "0:count-cardinality": L(
    "Move each thing to a new pile as you count it. Then nothing gets counted twice. The last number you say is how many.",
    "Mueve cada cosa a otro montón cuando la cuentes. Así no cuentas nada dos veces. El último número que dices es cuántos hay.",
  ),
  "0:subitize": L(
    "Look for small groups you already know, like two and two. Put the groups together in your head instead of counting one by one.",
    "Busca grupos pequeños que ya conoces, como dos y dos. Junta los grupos en tu mente en vez de contar uno por uno.",
  ),
  "0:compare-20": L(
    "Line the two groups up in pairs, one from each side. The group with things left over has more.",
    "Pon los dos grupos en parejas, uno de cada lado. El grupo al que le sobran cosas tiene más.",
  ),
  "0:compose-10": L(
    "Show the number on your fingers. Count the fingers that are still down. Those fingers are the other part.",
    "Muestra el número con tus dedos. Cuenta los dedos que están bajados. Esos dedos son la otra parte.",
  ),
  "0:add-sub-5": L(
    "Use one hand. Show the first number with fingers up. Put more up to join, or fold some down to take away. Count what is up.",
    "Usa una mano. Muestra el primer número con dedos arriba. Sube más para juntar o baja algunos para quitar. Cuenta los que están arriba.",
  ),
  "0:story-add-sub-10": L(
    "Act the story out with small toys or drawings. Do what the story says, one step at a time. Then count what you have.",
    "Actúa el cuento con juguetes pequeños o dibujos. Haz lo que dice el cuento, paso a paso. Luego cuenta lo que tienes.",
  ),
  "0:patterns": L(
    "Clap or say the pattern out loud. Find the part that repeats. Say it again to hear what comes next.",
    "Aplaude o di el patrón en voz alta. Busca la parte que se repite. Dila otra vez para oír lo que sigue.",
  ),
  "0:hidden-parts": L(
    "Start at the number you can see. Count up until you reach the number in all. The numbers you counted are the hiding ones.",
    "Empieza en el número que ves. Cuenta hacia adelante hasta llegar al total. Los números que contaste son los que se esconden.",
  ),
  // Grade 1
  "1:count-patterns": L(
    "Find two numbers next to each other in the list. Subtract to see how big each jump is. Then make the same jump again.",
    "Busca dos números seguidos en la lista. Resta para ver qué tan grande es cada salto. Luego haz el mismo salto otra vez.",
  ),
  "1:tens-ones": L(
    "Draw a stick for each ten and a dot for each one. Count the sticks by tens, then count on the dots by ones.",
    "Dibuja un palito por cada decena y un punto por cada unidad. Cuenta los palitos de diez en diez y luego sigue con los puntos de uno en uno.",
  ),
  "1:compare-100": L(
    "Find both numbers on a hundred chart. The one farther along the chart is greater.",
    "Busca los dos números en una tabla del cien. El que está más adelante en la tabla es mayor.",
  ),
  "1:add-10": L(
    "Put the greater number in your head. Count on the other number with your fingers.",
    "Pon el número mayor en tu mente. Sigue contando el otro número con tus dedos.",
  ),
  "1:subtract-10": L(
    "Think of addition. Ask: what number goes with the part I take away to make the whole?",
    "Piensa en la suma. Pregunta: ¿qué número va con la parte que quito para formar el total?",
  ),
  "1:make-10": L(
    "Fill a ten-frame with the number you have. Count the empty boxes. That is how many more make ten.",
    "Llena un marco de diez con el número que tienes. Cuenta las casillas vacías. Eso es cuántos faltan para diez.",
  ),
  "1:add-20": L(
    "Use a double you know. If the two numbers are close, double the smaller one and add the extra.",
    "Usa un doble que conoces. Si los números están cerca, duplica el menor y suma lo que sobra.",
  ),
  "1:missing-addend": L(
    "Start at the part you know. Count up to the total. Count your jumps. That is the missing part.",
    "Empieza en la parte que conoces. Cuenta hasta el total. Cuenta tus saltos. Esa es la parte que falta.",
  ),
  "1:subtract-20": L(
    "Take away in two steps. First take away just enough to land on ten. Then take away the rest.",
    "Quita en dos pasos. Primero quita lo justo para llegar a diez. Luego quita el resto.",
  ),
  "1:time": L(
    "Look at the long hand first. Straight up means o'clock. Straight down means half past. Then read the short hand.",
    "Mira primero la manecilla larga. Arriba quiere decir en punto. Abajo quiere decir y media. Luego lee la manecilla corta.",
  ),
  "1:measure-length": L(
    "Mark where each unit ends with your finger. Move the unit to that mark with no gaps and no overlaps. Count the units.",
    "Marca con el dedo dónde termina cada unidad. Mueve la unidad hasta esa marca sin espacios ni encimar. Cuenta las unidades.",
  ),
  "1:shapes-2d3d": L(
    "Trace the shape with your finger. Count as you go around. For a solid, turn it and count each face only once.",
    "Recorre la figura con el dedo. Cuenta mientras das la vuelta. En un cuerpo, gíralo y cuenta cada cara una sola vez.",
  ),
  "1:equal-shares": L(
    "Imagine cutting the parts out and stacking them. If they match exactly, they are equal shares.",
    "Imagina que recortas las partes y las pones una encima de otra. Si son iguales, son partes iguales.",
  ),
  // Grade 2
  "2:facts-20": L(
    "Break one number apart to make ten with the other. Ten plus the leftover is easy to add.",
    "Separa un número para formar diez con el otro. Diez más lo que sobra es fácil de sumar.",
  ),
  "2:sub-facts-20": L(
    "Count up from the number you take away to the first number. The distance between them is the difference.",
    "Cuenta desde el número que quitas hasta el primer número. La distancia entre ellos es la diferencia.",
  ),
  "2:place-1000": L(
    "Write the number in a place chart: hundreds, tens, ones. Read the column the question names.",
    "Escribe el número en una tabla de valor posicional: centenas, decenas, unidades. Lee la columna que nombra la pregunta.",
  ),
  "2:compare-1000": L(
    "Write one number above the other, lined up by place. Read from the left. The first place that is different decides.",
    "Escribe un número encima del otro, alineados por valor posicional. Lee desde la izquierda. El primer lugar que cambia decide.",
  ),
  "2:skip-count": L(
    "Look only at the ones digit. It repeats in a short cycle. Use the cycle to check your next number.",
    "Mira solo el dígito de las unidades. Se repite en un ciclo corto. Usa el ciclo para revisar tu siguiente número.",
  ),
  "2:add-100": L(
    "Keep the first number whole. Add the tens of the second number, then add its ones.",
    "Deja el primer número entero. Suma las decenas del segundo número y luego sus unidades.",
  ),
  "2:subtract-100": L(
    "Count up instead. Jump from the smaller number to the next ten, then by tens, then the last ones. Add your jumps.",
    "Cuenta hacia adelante. Salta del número menor a la siguiente decena, luego de diez en diez y luego las unidades. Suma tus saltos.",
  ),
  "2:add-1000": L(
    "Add each place on its own: hundreds, tens, ones. Then put the three parts together.",
    "Suma cada lugar por separado: centenas, decenas, unidades. Luego junta las tres partes.",
  ),
  "2:even-odd": L(
    "Make pairs. If every object has a partner, the number is even. If one is left alone, it is odd.",
    "Forma parejas. Si cada objeto tiene pareja, el número es par. Si sobra uno solo, es impar.",
  ),
  "2:coins": L(
    "Sort the coins from greatest value to least. Count on from the biggest coin.",
    "Ordena las monedas de mayor a menor valor. Sigue contando desde la moneda más grande.",
  ),
  "2:interpret-data": L(
    "Put your finger at the top of each bar and slide across to the scale. Write each amount down before you compare.",
    "Pon el dedo arriba de cada barra y deslízalo hasta la escala. Escribe cada cantidad antes de comparar.",
  ),
  "2:doubles-near": L(
    "Use the double of the greater number instead. Then take away the extra.",
    "Usa el doble del número mayor. Luego quita lo que sobra.",
  ),
  "2:arrays": L(
    "Skip-count down the rows. Say the number in one row each time you move to a new row.",
    "Cuenta salteado por las filas. Di el número de una fila cada vez que pasas a otra fila.",
  ),
  "2:time-five": L(
    "Count by fives around the clock, starting at the top. Each number on the clock is five more minutes.",
    "Cuenta de cinco en cinco alrededor del reloj, empezando arriba. Cada número del reloj es cinco minutos más.",
  ),
  "2:mental-tens": L(
    "Only one digit changes. Find the tens place or the hundreds place. Make that digit one more or one less.",
    "Solo cambia un dígito. Busca el lugar de las decenas o de las centenas. Haz ese dígito uno más o uno menos.",
  ),
  // Grade 3
  "3:mul-0-5": L(
    "Use a fact you know. Turn the factors around, or start from the fact for one less group and add one more group.",
    "Usa una multiplicación que conoces. Cambia el orden de los factores, o empieza con un grupo menos y suma un grupo más.",
  ),
  "3:mul-6-9": L(
    "Split the bigger factor into five and the rest. Multiply each part, then add the two products.",
    "Separa el factor mayor en cinco y lo que queda. Multiplica cada parte y luego suma los dos productos.",
  ),
  "3:mul-10-12": L(
    "Multiply the single digits first, as if the ten were a one. The answer counts tens, so write it as tens.",
    "Multiplica primero los dígitos solos, como si el diez fuera uno. La respuesta cuenta decenas, así que escríbela en decenas.",
  ),
  "3:division-facts": L(
    "Turn it into multiplication. Ask: what number times the divisor makes the number I start with?",
    "Conviértelo en multiplicación. Pregunta: ¿qué número por el divisor da el número con el que empiezo?",
  ),
  "3:add-sub-1000": L(
    "Round both numbers first to estimate. Then solve exactly and check that your answer is close to the estimate.",
    "Primero redondea los dos números para estimar. Luego resuelve exacto y revisa que tu respuesta esté cerca de la estimación.",
  ),
  "3:round": L(
    "Find the two tens or hundreds the number is between. Picture a hill. Which side of the halfway point is the number on?",
    "Busca las dos decenas o centenas entre las que está el número. Imagina una loma. ¿De qué lado de la mitad está el número?",
  ),
  "3:fraction-equivalence": L(
    "Draw two bars the same length. Cut one into the first number of parts and one into the other. Shade both and compare.",
    "Dibuja dos barras del mismo largo. Corta una en el primer número de partes y la otra en el segundo. Sombrea las dos y compara.",
  ),
  "3:fraction-compare": L(
    "Compare each fraction with one half. If one is more than half and the other is less, you are done.",
    "Compara cada fracción con un medio. Si una es más de la mitad y la otra es menos, ya terminaste.",
  ),
  "3:area": L(
    "Count the squares in one row. Then skip-count by that number for every row.",
    "Cuenta los cuadrados de una fila. Luego cuenta salteado de ese número por cada fila.",
  ),
  "3:perimeter": L(
    "Add one length and one width. That is half the trip around. Double it for the whole trip.",
    "Suma un largo y un ancho. Eso es la mitad del recorrido. Duplícalo para el recorrido completo.",
  ),
  "3:elapsed-time": L(
    "Jump to the next full hour first. Then jump the rest. Add the jumps.",
    "Salta primero hasta la siguiente hora exacta. Luego salta el resto. Suma los saltos.",
  ),
  "3:fraction-line": L(
    "Fold a strip of paper into the number of equal parts the bottom number says. Count the folds from zero.",
    "Dobla una tira de papel en las partes iguales que dice el número de abajo. Cuenta los dobleces desde cero.",
  ),
  "3:scaled-graphs": L(
    "Find what one square on the scale is worth. Count the squares in the bar, then multiply by that amount.",
    "Busca cuánto vale un cuadro de la escala. Cuenta los cuadros de la barra y multiplica por esa cantidad.",
  ),
  // Grade 4
  "4:place-million": L(
    "Cover the digits to the right of the one you want with your finger. Count how many you covered to name its place.",
    "Tapa con el dedo los dígitos a la derecha del que buscas. Cuenta cuántos tapaste para saber su lugar.",
  ),
  "4:round-large": L(
    "Underline the place you round to. Circle the digit just to its right. That one digit decides up or down.",
    "Subraya el lugar al que redondeas. Encierra el dígito justo a su derecha. Ese dígito decide si subes o bajas.",
  ),
  "4:add-large": L(
    "Add from the left by place value. Write each partial sum: thousands, hundreds, tens, ones. Then add the partial sums.",
    "Suma desde la izquierda por valor posicional. Escribe cada suma parcial: millares, centenas, decenas, unidades. Luego suma las sumas parciales.",
  ),
  "4:subtract-large": L(
    "Check with addition. Your answer plus the number you subtracted must give back the first number.",
    "Comprueba con una suma. Tu respuesta más el número que restaste debe dar el primer número.",
  ),
  "4:multiply-1digit": L(
    "Break the big number into hundreds, tens and ones. Multiply each part, then add the three products.",
    "Separa el número grande en centenas, decenas y unidades. Multiplica cada parte y luego suma los tres productos.",
  ),
  "4:multiply-2digit": L(
    "Draw an area model with four boxes: tens and ones on each side. Multiply inside each box, then add all four.",
    "Dibuja un modelo de área con cuatro casillas: decenas y unidades en cada lado. Multiplica dentro de cada casilla y suma las cuatro.",
  ),
  "4:division": L(
    "Take away easy chunks, like ten groups at a time. Keep track of how many groups you took. Add them up at the end.",
    "Quita partes fáciles, como diez grupos a la vez. Lleva la cuenta de cuántos grupos quitaste. Súmalos al final.",
  ),
  "4:factors": L(
    "List factor pairs from the outside in, starting with one. When the pairs meet in the middle, you have them all.",
    "Haz la lista de pares de factores de afuera hacia adentro, empezando con uno. Cuando los pares se juntan en el medio, ya están todos.",
  ),
  "4:fraction-equiv": L(
    "Think of the fraction as a recipe. Make the same recipe again and again: top and bottom both grow the same number of times.",
    "Piensa en la fracción como una receta. Repite la receta: el número de arriba y el de abajo crecen las mismas veces.",
  ),
  "4:fraction-compare": L(
    "Make the tops the same instead of the bottoms. With equal tops, the fraction with fewer, bigger pieces is greater.",
    "Iguala los números de arriba en vez de los de abajo. Con el mismo número arriba, la fracción con menos partes, y más grandes, es mayor.",
  ),
  "4:unit-conversion": L(
    "Make a two-column table: the big unit and the small unit. Fill in one row, then keep adding the same amount down each column.",
    "Haz una tabla de dos columnas: la unidad grande y la pequeña. Llena una fila y sigue sumando lo mismo en cada columna.",
  ),
  "4:mul-11-12": L(
    "Split the eleven or twelve into ten and the rest. Multiply by ten, multiply the rest, and add.",
    "Separa el once o el doce en diez y lo que queda. Multiplica por diez, multiplica lo que queda y suma.",
  ),
  "4:line-plots": L(
    "Make a list from the plot. Write one number for every X. Then do the math on the list.",
    "Haz una lista a partir del diagrama. Escribe un número por cada X. Luego haz las cuentas con la lista.",
  ),
  "4:mixed-numbers": L(
    "Count by the fraction pieces on a number line. Each time you reach a whole number, say it as you pass.",
    "Cuenta por partes de fracción en una recta numérica. Cada vez que llegues a un número entero, dilo al pasar.",
  ),
  "4:angle-measure": L(
    "Use the right angle as a ruler. Ask if the angle is less than, equal to, or more than a square corner, then check your number.",
    "Usa el ángulo recto como regla. Pregunta si el ángulo es menor, igual o mayor que una esquina cuadrada y luego revisa tu número.",
  ),
  // Grade 5
  "5:multiply-whole": L(
    "Estimate first with rounded numbers. After you multiply, your answer should be close to the estimate.",
    "Primero estima con números redondeados. Después de multiplicar, tu respuesta debe estar cerca de la estimación.",
  ),
  "5:divide-whole": L(
    "Write a few easy multiples of the divisor first: one, two, five and ten times. Use them to take away big chunks.",
    "Primero escribe algunos múltiplos fáciles del divisor: una, dos, cinco y diez veces. Úsalos para quitar partes grandes.",
  ),
  "5:decimal-place": L(
    "Read the decimal out loud the long way, like money or a meter stick. The last word you say names the smallest place.",
    "Lee el decimal en voz alta completo, como con dinero o una regla de un metro. La última palabra que dices nombra el lugar más pequeño.",
  ),
  "5:decimal-add": L(
    "Think of the numbers as money. Add the dollars, add the cents, then trade a hundred cents for a dollar if you need to.",
    "Piensa en los números como dinero. Suma los dólares, suma los centavos y cambia cien centavos por un dólar si hace falta.",
  ),
  "5:decimal-sub": L(
    "Count up from the smaller number: first to the next whole number, then to the larger number. Add the two jumps.",
    "Cuenta desde el número menor: primero hasta el siguiente número entero, luego hasta el número mayor. Suma los dos saltos.",
  ),
  "5:decimal-mul": L(
    "Multiply as if there were no decimal points. Then estimate the size of the answer to decide where the point goes.",
    "Multiplica como si no hubiera puntos decimales. Luego estima el tamaño de la respuesta para decidir dónde va el punto.",
  ),
  "5:fraction-add": L(
    "Draw both fractions as bars cut into the same number of pieces. Then just count pieces.",
    "Dibuja las dos fracciones como barras cortadas en el mismo número de partes. Luego solo cuenta las partes.",
  ),
  "5:fraction-mul": L(
    'Read the times sign as "of". Find that part of the second fraction on a drawing: cut it again and shade the part.',
    'Lee el signo de multiplicar como "de". Busca esa parte de la segunda fracción en un dibujo: córtala otra vez y sombrea la parte.',
  ),
  "5:fraction-of": L(
    "Divide by the bottom number to find one equal part. Then multiply by the top number to take that many parts.",
    "Divide entre el número de abajo para hallar una parte igual. Luego multiplica por el número de arriba para tomar esas partes.",
  ),
  "5:unit-fraction-division": L(
    "Ask a sharing or a fitting question. How many of the small pieces fit in the whole amount? Or how big is each share?",
    "Haz una pregunta de repartir o de caber. ¿Cuántas partes pequeñas caben en la cantidad? ¿O qué tan grande es cada parte?",
  ),
  "5:volume": L(
    "Find how many cubes cover the bottom first. Then count how many layers stack up to the top.",
    "Primero halla cuántos cubos cubren el fondo. Luego cuenta cuántas capas hay hasta arriba.",
  ),
  "5:coordinate-plane": L(
    "Walk before you climb. Go along the bottom axis first, then go up. The first number is always the walk.",
    "Camina antes de subir. Avanza primero por el eje de abajo y luego sube. El primer número siempre es el camino.",
  ),
  "5:order-ops": L(
    "Rewrite the expression one step at a time. Each line does just one operation and copies everything else.",
    "Vuelve a escribir la expresión paso a paso. Cada línea hace una sola operación y copia todo lo demás.",
  ),
};

/** Attach each skill's "Another way" to its authored entry. */
export function withAnother(band) {
  const out = {};
  for (const [key, entry] of Object.entries(band))
    out[key] = ANOTHER[key] ? { ...entry, another: { text: ANOTHER[key] } } : entry;
  return out;
}
