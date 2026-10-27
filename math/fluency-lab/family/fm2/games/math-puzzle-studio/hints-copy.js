// Hint wording that does not depend on the round's numbers: tier 0 (a nudge) and tier 1 (a strategy) for every skill.
// None of it states a number from the puzzle. Tier 2 (a worked parallel example) is built in hints.js; tier 3 states
// the solution. English and Spanish side by side. @fm2 FM-062
const T = (en, es) => ({ en, es });

export const TIER0 = {
  "bond-parts": T(
    "Look at the whole and the part you can see. What is the bond asking you to find?",
    "Mira el total y la parte que ves. ¿Qué te pide encontrar el enlace?",
  ),
  "balance-same": T(
    "Look at the tilt. The beam goes down on the heavier side, and level means the same weight.",
    "Mira la inclinación. La barra baja del lado más pesado, y nivelada significa el mismo peso.",
  ),
  "equal-sign": T(
    "The equal sign means both sides are the same amount, like a balanced scale.",
    "El signo igual significa que ambos lados son la misma cantidad, como en una balanza equilibrada.",
  ),
  "missing-addend": T(
    "Read the equation aloud and ask which number in the blank makes it true.",
    "Lee la ecuación en voz alta y pregunta qué número en el espacio la hace verdadera.",
  ),
  "grid-sums": T(
    "Look for a row or column with only a single empty square. Its total is shown at the end.",
    "Busca una fila o columna con un solo cuadro vacío. Su total está al final.",
  ),
  "magic-triangle": T(
    "Pick a side that already shows some numbers. The target total for every side is in the puzzle.",
    "Elige un lado que ya muestre algunos números. La meta de cada lado está en el reto.",
  ),
  "magic-square": T(
    "Find a row, column or diagonal with just a single empty square.",
    "Busca una fila, columna o diagonal con un solo cuadro vacío.",
  ),
  "factor-grid": T(
    "Start with a square where both of its factors are showing, or a factor whose line already shows a product.",
    "Empieza por un cuadro donde se vean sus factores, o por un factor cuya línea ya muestre un producto.",
  ),
  kenken: T(
    "Start with the smallest cages. A cage with few squares has only a few ways to work.",
    "Empieza por las jaulas más pequeñas. Una jaula con pocos cuadros tiene pocas maneras de resolverse.",
  ),
  "factor-pairs": T(
    "Write down the factor pairs of the product, then test each pair against the other clue.",
    "Escribe los pares de factores del producto y prueba cada par con la otra pista.",
  ),
  "target-ops": T(
    "Try the operations in different spots and see what each expression makes.",
    "Prueba las operaciones en distintos lugares y mira qué da cada expresión.",
  ),
  "equal-forms": T(
    "Equal values can look very different. Work out what the weight on the other pan is worth.",
    "Los valores iguales pueden verse muy distintos. Calcula cuánto vale la pesa del otro platillo.",
  ),
  "scale-onestep": T(
    "To get an x-box alone, ask what is sitting with it, or how many x-boxes there are.",
    "Para dejar una caja x sola, pregunta qué la acompaña o cuántas cajas x hay.",
  ),
  "inequality-scale": T(
    "Watch which way the beam leans as you try a tile, then compare it with what the puzzle asks.",
    "Observa hacia dónde se inclina la barra al probar una ficha y compárala con lo que pide el reto.",
  ),
  "scale-twostep": T(
    "Loose weights and a group count are both stuck to the x-boxes. Which should go first?",
    "Las pesas sueltas y el número de grupos están pegados a las cajas x. ¿Cuál debe quitarse primero?",
  ),
  "equiv-expr": T(
    "Try a tile, then change x with the x buttons. A good match stays balanced for every x.",
    "Prueba una ficha y luego cambia x con los botones de x. Una buena pareja se mantiene equilibrada con cualquier x.",
  ),
  "scale-system": T(
    "Pick a scale and a shape. What would you need to know to find that shape's weight?",
    "Elige una balanza y una figura. ¿Qué necesitarías saber para hallar el peso de esa figura?",
  ),
  "scale-both-sides": T(
    "There are x-boxes on both pans. Take the same number off both pans first.",
    "Hay cajas x en ambos platillos. Primero quita la misma cantidad de cada platillo.",
  ),
  "pythag-squares": T(
    "The scale compares areas. How do you find the area of a square from its side?",
    "La balanza compara áreas. ¿Cómo se halla el área de un cuadrado a partir de su lado?",
  ),
};

export const TIER1 = {
  "bond-parts": {
    part: T(
      "Count up from the part you know to the whole, or take the known part away from the whole. Either way finds the missing part.",
      "Cuenta desde la parte que conoces hasta el total, o quita la parte conocida del total. De cualquier modo encuentras la parte que falta.",
    ),
    whole: T(
      "The whole is both parts put together. Add the parts you can see.",
      "El total son ambas partes juntas. Suma las partes que ves.",
    ),
    two: T(
      "Pick any part you like, then work out the other part that completes the whole. Many pairs work.",
      "Elige la parte que quieras y calcula la otra parte que completa el total. Sirven muchas parejas.",
    ),
  },
  "balance-same": {
    1: T(
      "To make the pans equal, the number you place must match the weight on the other pan.",
      "Para igualar los platillos, el número que coloques debe coincidir con el peso del otro platillo.",
    ),
    2: T(
      "The pan with the empty spot already holds some weight. Find how much more it needs to equal the other pan.",
      "El platillo con el lugar vacío ya tiene algo de peso. Averigua cuánto más necesita para igualar al otro.",
    ),
    3: T(
      "Choose any pair of numbers that together weigh the same as the other pan: place a number, then find its partner.",
      "Elige cualquier pareja de números que juntos pesen lo mismo que el otro platillo: coloca un número y busca su compañero.",
    ),
  },
  "equal-sign": T(
    "Work out the amount on the side with no empty spot. The other side must reach that same amount.",
    "Calcula la cantidad del lado que no tiene lugar vacío. El otro lado debe llegar a esa misma cantidad.",
  ),
  "missing-addend": T(
    "Turn it into a simpler question: a total minus the part you know gives the other part.",
    "Conviértelo en una pregunta más sencilla: un total menos la parte que conoces da la otra parte.",
  ),
  "grid-sums": T(
    "Add the numbers you can see in a line, then see how far that is from the total at the end. That gap is the missing number.",
    "Suma los números que ves en una línea y mira cuánto falta para el total del extremo. Esa diferencia es el número que falta.",
  ),
  "magic-triangle": T(
    "Add the numbers you can see on a side, then find the tile that reaches the target. Each tile is used once.",
    "Suma los números que ves en un lado y busca la ficha que llega a la meta. Cada ficha se usa una sola vez.",
  ),
  "magic-square": T(
    "Add the numbers you can see in a line and subtract from the magic sum to find the missing number. Then check the other lines.",
    "Suma los números que ves en una línea y réstalos de la suma mágica para hallar el que falta. Luego revisa las otras líneas.",
  ),
  "factor-grid": T(
    "To find a missing product, multiply its factors. To find a missing factor, divide the product by the factor you can see.",
    "Para hallar un producto que falta, multiplica sus factores. Para hallar un factor que falta, divide el producto entre el factor que ves.",
  ),
  kenken: T(
    "List the numbers that fit a cage, then use the row and column rule: a number placed in a line rules it out for the rest of that line.",
    "Haz una lista de los números que caben en una jaula y usa la regla de filas y columnas: un número colocado en una línea queda descartado para el resto de esa línea.",
  ),
  "factor-pairs": T(
    "Go through the pairs in order. For each pair, add or subtract and compare with the clue.",
    "Recorre los pares en orden. Con cada par, suma o resta y compara con la pista.",
  ),
  "target-ops": T(
    "Parentheses first, then multiplication and division, then addition and subtraction. Multiplying makes big results quickly.",
    "Primero los paréntesis, luego la multiplicación y la división, y al final la suma y la resta. Multiplicar da resultados grandes enseguida.",
  ),
  "equal-forms": T(
    "Rename every weight in the same form: divide the top of a fraction by its bottom, or move the decimal point for a percent.",
    "Escribe cada pesa en la misma forma: divide el numerador entre el denominador, o mueve el punto decimal para pasar a porcentaje.",
  ),
  "scale-onestep": T(
    "If loose weights sit with the x-box, take that many off both pans. If several x-boxes are on a pan, split both pans into that many equal groups.",
    "Si hay pesas sueltas junto a la caja x, quita esa cantidad de ambos platillos. Si hay varias cajas x en un platillo, divide ambos platillos en ese número de grupos iguales.",
  ),
  "inequality-scale": T(
    "First find the number that makes the pans exactly equal. Then choose a tile above or below it, depending on which pan must be heavier.",
    "Primero busca el número que hace que los platillos queden exactamente iguales. Luego elige una ficha mayor o menor, según qué platillo deba pesar más.",
  ),
  "scale-twostep": T(
    "Undo in order: take the loose weights off both pans first, then split both pans into equal groups.",
    "Deshaz en orden: primero quita las pesas sueltas de ambos platillos y luego divide ambos platillos en grupos iguales.",
  ),
  "equiv-expr": T(
    "Expand or combine the expression on the left: the outside number multiplies every term inside, and the x terms add together.",
    "Desarrolla o combina la expresión de la izquierda: el número de afuera multiplica cada término de adentro y los términos con x se suman.",
  ),
  "scale-system": T(
    "Compare the scales. If a scale has an extra shape, the extra weight on its heavier side is that shape's weight. Use it in the other scale.",
    "Compara las balanzas. Si una tiene una figura de más, el peso extra de su lado más pesado es el de esa figura. Úsalo en la otra balanza.",
  ),
  "scale-both-sides": T(
    "Take off the x-boxes both pans share, then the loose weights from the pan that still has x-boxes, then split.",
    "Quita las cajas x que comparten ambos platillos, luego las pesas sueltas del platillo que aún tiene cajas x y por último divide.",
  ),
  "pythag-squares": T(
    "Find the area of each square you can see. Add or subtract areas to get the area you need, then find the side that gives it.",
    "Calcula el área de cada cuadrado que ves. Suma o resta áreas para obtener el área que necesitas y busca el lado que la da.",
  ),
};

// What follows "Solution: ..." in tier 3, by layout (or "scale" for equation scales).
export const NOTE = {
  bond: T("The two parts make the whole.", "Las dos partes forman el total."),
  balance: T("Both pans then weigh the same.", "Entonces los dos platillos pesan lo mismo."),
  eq: T(
    "Put it in the blank and the equation is true.",
    "Ponlo en el espacio y la ecuación es verdadera.",
  ),
  grid: T(
    "Those are the empty squares in reading order, left to right and top to bottom.",
    "Son los cuadros vacíos en orden de lectura, de izquierda a derecha y de arriba abajo.",
  ),
  triangle: T(
    "Those are the empty spots in the order top, bottom left, bottom right, then left, bottom and right sides.",
    "Son los lugares vacíos en el orden: arriba, abajo a la izquierda, abajo a la derecha y luego los lados izquierdo, de abajo y derecho.",
  ),
  magic: T(
    "Those are the empty squares in reading order, and every line then adds to the magic sum.",
    "Son los cuadros vacíos en orden de lectura, y entonces cada línea suma la suma mágica.",
  ),
  factor: T(
    "Those are the empty squares in the order column factors, row factors, then the products row by row.",
    "Son los cuadros vacíos en el orden: factores de las columnas, factores de las filas y luego los productos fila por fila.",
  ),
  cage: T(
    "Those are the empty squares in reading order, left to right and top to bottom.",
    "Son los cuadros vacíos en orden de lectura, de izquierda a derecha y de arriba abajo.",
  ),
  pairs: T("Either order works.", "Sirve en cualquier orden."),
  expr: T(
    "Work parentheses first, then multiplication and division, then addition and subtraction.",
    "Resuelve primero los paréntesis, luego la multiplicación y la división, y después la suma y la resta.",
  ),
};
