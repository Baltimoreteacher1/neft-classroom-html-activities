// Tier 0 and tier 1 hint text (nudge and strategy) for every kind of round, English and Spanish. @fm2 FM-032 FM-020
export const H = (en, es) => ({ en, es });

export const GENERIC = [
  H(
    "Read the clue again and decide exactly what you need to build.",
    "Lee la pista otra vez y decide exactamente qué necesitas construir.",
  ),
  H(
    "Make a first try, read the readout, and change one thing at a time.",
    "Haz un primer intento, lee el resumen y cambia una sola cosa a la vez.",
  ),
  H(
    "Check one clue at a time against the readout, then adjust your build.",
    "Compara una pista a la vez con el resumen y luego ajusta tu construcción.",
  ),
];

export const TIER01 = {
  dims: [
    H(
      "Read the clue slowly. One number says how many rows. The other says how many are in each row.",
      "Lee la pista despacio. Un número dice cuántas filas. El otro dice cuántos hay en cada fila.",
    ),
    H(
      "Rows run across and stack downward; columns count the squares in a row. Set the rows, then the columns, and watch the readout.",
      "Las filas van a lo ancho y se apilan hacia abajo; las columnas cuentan los cuadros de una fila. Fija las filas, luego las columnas, y mira el resumen.",
    ),
  ],
  repeat: [
    H(
      "In an addition like this, every number is one row of the array.",
      "En una suma así, cada número es una fila de la matriz.",
    ),
    H(
      "Count how many numbers are added to get the rows, and look at what each number is to get the columns.",
      "Cuenta cuántos números se suman para saber las filas y mira cuánto vale cada uno para saber las columnas.",
    ),
  ],
  skip: [
    H(
      "When you count by the same number, each count is one more row.",
      "Cuando cuentas de un número en otro, cada conteo es una fila más.",
    ),
    H(
      "The step you count by is how many are in each row. The number of counts is the number of rows.",
      "El salto con que cuentas es cuántos hay en cada fila. La cantidad de conteos es la cantidad de filas.",
    ),
  ],
  areaOnly: [
    H(
      "Many answers work. Think: which two numbers multiply to make the total?",
      "Sirven muchas respuestas. Piensa: ¿qué dos números se multiplican para dar el total?",
    ),
    H(
      "Pick a number of rows that shares the total out evenly. The columns are what each row gets. Check the readout.",
      "Elige una cantidad de filas que reparta el total en partes iguales. Las columnas son lo que recibe cada fila. Mira el resumen.",
    ),
  ],
  areaRows: [
    H(
      "You know the total and one side. How could you share the total out equally?",
      "Conoces el total y un lado. ¿Cómo podrías repartir el total en partes iguales?",
    ),
    H(
      "Divide the total by the side you know. The answer is the other side. Then build it and check the readout.",
      "Divide el total entre el lado que conoces. El resultado es el otro lado. Luego constrúyelo y mira el resumen.",
    ),
  ],
  perim: [
    H(
      "Perimeter is the distance around the outside edge. Count the edges along the border.",
      "El perímetro es la distancia alrededor del borde. Cuenta los bordes del contorno.",
    ),
    H(
      "A rectangle has two long sides and two short sides. Half of the perimeter is one long side plus one short side, which is rows plus columns.",
      "Un rectángulo tiene dos lados largos y dos cortos. La mitad del perímetro es un lado largo más uno corto, es decir, filas más columnas.",
    ),
  ],
  perimSide: [
    H(
      "Perimeter is the distance around. Think about what you add to go all the way around.",
      "El perímetro es la distancia alrededor. Piensa qué sumas para dar toda la vuelta.",
    ),
    H(
      "Half of the perimeter is one side plus the other side. Take away the side you know to find the other.",
      "La mitad del perímetro es un lado más el otro. Quita el lado que conoces para hallar el otro.",
    ),
  ],
  areaSide: [
    H(
      "Area counts the squares inside. How do the two sides make that count?",
      "El área cuenta los cuadros de adentro. ¿Cómo producen esa cuenta los dos lados?",
    ),
    H(
      "Area is one side times the other. Divide the area by the side you know to find the other side.",
      "El área es un lado por el otro. Divide el área entre el lado que conoces para hallar el otro lado.",
    ),
  ],
  areaPerim: [
    H(
      "You have two clues. Area counts the squares inside; perimeter counts the edges around. Both must be true at once.",
      "Tienes dos pistas. El área cuenta los cuadros de adentro; el perímetro cuenta los bordes de afuera. Las dos deben cumplirse a la vez.",
    ),
    H(
      "Find two numbers that multiply to the area and also add up to half of the perimeter.",
      "Busca dos números que se multipliquen para dar el área y que sumen la mitad del perímetro.",
    ),
  ],
  maxArea: [
    H(
      "Many rectangles share this perimeter, but their areas are different. Compare a few.",
      "Muchos rectángulos comparten este perímetro, pero sus áreas son distintas. Compara varios.",
    ),
    H(
      "Try a long thin rectangle, then a fatter one, and watch the area readout. Which shape covers the most?",
      "Prueba un rectángulo largo y delgado, luego uno más ancho, y mira el área en el resumen. ¿Qué forma cubre más?",
    ),
  ],
  count: [
    H(
      "Tap one square for each counter and keep count as you go.",
      "Toca un cuadro por cada ficha y lleva la cuenta.",
    ),
    H(
      "The readout tells you how many are placed so far. Stop when it matches the clue.",
      "El resumen te dice cuántas llevas. Detente cuando coincida con la pista.",
    ),
  ],
  pairs: [
    H(
      "A pair is two counters that sit side by side across the two lines of the grid. Make pairs.",
      "Una pareja son dos fichas juntas, una en cada una de las dos líneas de la cuadrícula. Haz parejas.",
    ),
    H(
      "Fill both lines of the grid one pair at a time. A counter with nobody to match is left over.",
      "Llena las dos líneas de la cuadrícula una pareja a la vez. Una ficha sin pareja es un sobrante.",
    ),
  ],
  target: [
    H(
      "Tap every square inside the shape to put down a tile. Then count the tiles.",
      "Toca cada cuadro de la figura para poner una baldosa. Luego cuenta las baldosas.",
    ),
    H(
      "Work one row at a time so you do not skip a square. The readout counts for you.",
      "Trabaja una fila a la vez para no saltarte ningún cuadro. El resumen cuenta por ti.",
    ),
  ],
  decompose: [
    H(
      "Look for straight lines that could cut the shape into rectangles.",
      "Busca líneas rectas que puedan cortar la figura en rectángulos.",
    ),
    H(
      "Pick a color and color one whole rectangle at a time. Each color must make a full rectangle with no corner missing.",
      "Elige un color y colorea un rectángulo completo a la vez. Cada color debe formar un rectángulo entero sin esquinas vacías.",
    ),
  ],
  factors: [
    H(
      "A factor pair is two numbers that multiply to make the total. Each pair is one rectangle.",
      "Un par de factores son dos números que se multiplican para dar el total. Cada par es un rectángulo.",
    ),
    H(
      "Start with 1 row, then 2 rows, then 3 rows, and so on. Keep only the row counts that share the total evenly.",
      "Empieza con 1 fila, luego 2, luego 3, y así. Quédate solo con las cantidades de filas que reparten el total en partes iguales.",
    ),
  ],
  commute: [
    H(
      "Turning an array on its side swaps its rows and columns.",
      "Girar una matriz de lado cambia sus filas por sus columnas.",
    ),
    H(
      "Add your first array, then swap the Rows and Columns numbers and add that one too.",
      "Agrega tu primera matriz, luego intercambia los números de Filas y Columnas y agrégala también.",
    ),
  ],
  turns: [
    H(
      "Find every pair of numbers that multiply to make the total, using at least 2 each. Then turn each one.",
      "Encuentra todos los pares de números que se multiplican para dar el total, usando al menos 2 en cada uno. Luego gira cada uno.",
    ),
    H(
      "Try 2 rows, 3 rows, 4 rows and so on. Keep the ones that share the total evenly, then add each one turned both ways.",
      "Prueba 2 filas, 3 filas, 4 filas y así. Quédate con las que reparten el total en partes iguales y agrega cada una de las dos maneras.",
    ),
  ],
  given: [
    H(
      "Each region's area is its two side lengths multiplied. Look at the letters on the model.",
      "El área de cada región es el producto de sus dos lados. Mira las letras del modelo.",
    ),
    H(
      "Multiply the side that is not split by each part of the split side, one region at a time. Then add the regions.",
      "Multiplica el lado que no está dividido por cada parte del lado dividido, una región a la vez. Luego suma las regiones.",
    ),
  ],
  place: [
    H(
      "Split the long side by place value: one part for the tens and one part for the ones.",
      "Divide el lado largo por valor posicional: una parte para las decenas y otra para las unidades.",
    ),
    H(
      "Use the plus and minus buttons until the split shows the tens and the ones. Then multiply each region and add.",
      "Usa los botones de más y menos hasta que la división muestre las decenas y las unidades. Luego multiplica cada región y suma.",
    ),
  ],
  free: [
    H(
      "You may split the number any way you like. Choose parts that are easy to multiply.",
      "Puedes dividir el número como quieras. Elige partes fáciles de multiplicar.",
    ),
    H(
      "A multiple of ten is an easy part. Split, multiply each region, then add the regions.",
      "Un múltiplo de diez es una parte fácil. Divide, multiplica cada región y luego suma las regiones.",
    ),
  ],
  decimal: [
    H(
      "Split the decimal into its ones and its tenths. Each part gets its own region.",
      "Divide el decimal en sus unidades y sus décimos. Cada parte tiene su región.",
    ),
    H(
      "Multiply the whole number by the ones part, then by the tenths part. Add the regions for the total.",
      "Multiplica el número entero por las unidades y luego por los décimos. Suma las regiones para el total.",
    ),
  ],
  twoDigit: [
    H(
      "Split both numbers by place value. That makes four regions, A through D.",
      "Divide los dos números por valor posicional. Así salen cuatro regiones, de la A a la D.",
    ),
    H(
      "Multiply the two sides of each region, then add all four partial products.",
      "Multiplica los dos lados de cada región y luego suma los cuatro productos parciales.",
    ),
  ],
  polyOne: [
    H(
      "Each region multiplies the outside number by one term of the sum.",
      "Cada región multiplica el número de afuera por un término de la suma.",
    ),
    H(
      "Do one region at a time. A number times x is that many x. A number times a number is just a number. Then put the terms together.",
      "Haz una región a la vez. Un número por x es esa cantidad de x. Un número por un número es solo un número. Luego junta los términos.",
    ),
  ],
  polyTwo: [
    H(
      "Each region multiplies one term from the top by one term from the side. Watch the signs.",
      "Cada región multiplica un término de arriba por uno del lado. Cuida los signos.",
    ),
    H(
      "x times x makes x squared; x times a number makes that many x. When you add the regions, combine the x terms that are alike.",
      "x por x da x al cuadrado; x por un número da esa cantidad de x. Al sumar las regiones, junta los términos de x que son iguales.",
    ),
  ],
  prismBuild: [
    H(
      "A prism is layers stacked up. Every layer has the same rows and columns.",
      "Un prisma son capas apiladas. Cada capa tiene las mismas filas y columnas.",
    ),
    H(
      "Build one layer, count its cubes, then think about how many layers there are.",
      "Construye una capa, cuenta sus cubos y piensa en cuántas capas hay.",
    ),
  ],
  prismLayers: [
    H(
      "Every layer holds the same number of cubes. The layers add up to the volume.",
      "Cada capa tiene la misma cantidad de cubos. Las capas suman el volumen.",
    ),
    H(
      "Share the volume equally among the layers to find the cubes in one layer, then build a base that size.",
      "Reparte el volumen en partes iguales entre las capas para hallar los cubos de una capa y construye una base de ese tamaño.",
    ),
  ],
  prismAny: [
    H(
      "Volume is the cubes in one layer times the number of layers. Many prisms work.",
      "El volumen son los cubos de una capa por la cantidad de capas. Sirven muchos prismas.",
    ),
    H(
      "Pick a number of layers that shares the volume evenly. The rest is the size of one layer. Then build a base that big.",
      "Elige una cantidad de capas que reparta el volumen en partes iguales. Lo que queda es el tamaño de una capa. Luego construye una base de ese tamaño.",
    ),
  ],
  scale: [
    H(
      "A scale factor multiplies every side length, not just one.",
      "Un factor de escala multiplica todos los lados, no solo uno.",
    ),
    H(
      "Multiply the rows and the columns by the factor, build it, then compare the old area with the new area.",
      "Multiplica las filas y las columnas por el factor, construye el rectángulo y compara el área vieja con la nueva.",
    ),
  ],
  gcf: [
    H(
      "The tile must fit across the floor and down the floor with nothing left over.",
      "La baldosa debe caber a lo ancho y a lo alto del piso sin que sobre nada.",
    ),
    H(
      "Try a tile size. If a side of the floor is not a whole number of tiles, there is a gap. Look for the biggest size with no gap.",
      "Prueba un tamaño de baldosa. Si un lado del piso no es un número entero de baldosas, queda un hueco. Busca el tamaño más grande sin huecos.",
    ),
  ],
  lcm: [
    H(
      "The square's side must hold a whole number of tiles across and a whole number down.",
      "El lado del cuadrado debe tener un número entero de baldosas a lo ancho y a lo alto.",
    ),
    H(
      "List the multiples of each tile side. The first number that is in both lists is your square's side.",
      "Anota los múltiplos de cada lado de la baldosa. El primer número que está en las dos listas es el lado de tu cuadrado.",
    ),
  ],
  tiles: [
    H(
      "The rectangle's area is its width times its height, and every tile must be used once.",
      "El área del rectángulo es su ancho por su alto y cada ficha debe usarse una vez.",
    ),
    H(
      "The x² tile is the corner. The 1-tiles fill a block whose sides are the two numbers beside x. Find numbers that fit the tile counts.",
      "La ficha de x² es la esquina. Las fichas de 1 llenan un bloque cuyos lados son los dos números junto a x. Busca números que concuerden con las fichas.",
    ),
  ],
};

