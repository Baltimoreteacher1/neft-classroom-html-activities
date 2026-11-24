// BCPSS Family Guide (EN/ES) — g5-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on the coordinate grid, number patterns and classifying shapes. Vocabulary order matches ../units/g5-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to find points on a grid with two numbers, to follow and graph number patterns, and to sort shapes into groups and smaller groups. It matters when someone reads a map, plans a route, or looks for a pattern in savings. Your child will define each word with is a type of, that has, and give a non-example, in any language.",
    es: "Su hijo o hija está aprendiendo a ubicar puntos en una cuadrícula con dos números, a seguir y graficar patrones numéricos, y a clasificar figuras en grupos y en grupos más pequeños. Sirve cuando alguien lee un mapa, planea una ruta o busca un patrón en los ahorros. Su hijo o hija definirá cada palabra con es un tipo de, que tiene, y dará un ejemplo de lo que no es, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can graph and read ordered pairs in the first quadrant.",
      "I can follow a pattern rule and say the next numbers.",
      "I can sort shapes and define them with is a type of and that has.",
    ],
    es: [
      "Puedo graficar y leer pares ordenados en el primer cuadrante.",
      "Puedo seguir la regla de un patrón y decir los números que siguen.",
      "Puedo clasificar figuras y definirlas con es un tipo de y que tiene.",
    ],
  },
  vocab: [
    { term: "ordered pair", def_es: "dos números en orden, como (3, 2), que dicen dónde está un punto", example_es: "El par ordenado (3, 2) significa 3 hacia la derecha y 2 hacia arriba." },
    { term: "origin", def_es: "el punto (0, 0) donde se cruzan las dos rectas numéricas de una gráfica", example_es: "Siempre empiezo a contar desde el origen." },
    { term: "axis", def_es: "una recta numérica en la que se construye una gráfica; una va de lado a lado y la otra de arriba abajo", example_es: "El eje horizontal va de izquierda a derecha." },
    { term: "coordinate", def_es: "uno de los números de un par ordenado, que dice cuánto hay que moverse", example_es: "En (3, 2), la primera coordenada es 3." },
    { term: "rule", def_es: "una frase que dice cómo obtener cada número de un patrón, como \"suma 3\"", example_es: "La regla del patrón es sumar 5." },
    { term: "attribute", def_es: "una característica de una figura, como el número de lados o los tipos de ángulos", example_es: "Un atributo del rombo es que tiene cuatro lados iguales." },
    { term: "quadrilateral", def_es: "una figura plana con exactamente cuatro lados rectos", example_es: "Un rectángulo es un cuadrilátero." },
    { term: "parallelogram", def_es: "una figura de cuatro lados con dos pares de lados paralelos", example_es: "Un rectángulo es un tipo de paralelogramo." },
    { term: "rhombus", def_es: "una figura de cuatro lados con los cuatro lados del mismo largo", example_es: "Un cuadrado es un tipo de rombo." },
    { term: "hierarchy", def_es: "una manera de clasificar cosas, de los grupos grandes a los grupos más pequeños y específicos", example_es: "En la jerarquía, el cuadrado está dentro del grupo de los rectángulos." },
  ],
  talk: [
    { en: "Where is the point (3, 2)? Which number tells how far right?", es: "¿Dónde está el punto (3, 2)? ¿Qué número dice cuánto hay que ir a la derecha?" },
    { en: "What is the rule of this pattern? What comes next?", es: "¿Cuál es la regla de este patrón? ¿Qué sigue?" },
    { en: "Is a square a rectangle? Is a rectangle always a square? How do you know?", es: "¿Un cuadrado es un rectángulo? ¿Un rectángulo siempre es un cuadrado? ¿Cómo lo sabes?" },
    { en: "Describe a shape without naming it. Can I guess it?", es: "Describe una figura sin decir su nombre. ¿Puedo adivinarla?" },
    { en: "Where do we use a map or a grid in real life?", es: "¿Dónde usamos un mapa o una cuadrícula en la vida real?" },
  ],
  try_at_home: [
    {
      title: { en: "Treasure on the Tile Floor", es: "Tesoro en el piso de losetas" },
      minutes: 15,
      materials: { en: "Paper, a pencil, a small object to hide; or a tile floor or chalk on the sidewalk", es: "Papel, lápiz y un objeto pequeño para esconder; o un piso de losetas o tiza en la acera" },
      steps: {
        en: [
          "Draw a grid on paper with the origin (0, 0) at the bottom left. Label the axes 0 to 5.",
          "Hide a treasure at (3, 2). Tell your child the rule: first go right 3, then go up 2.",
          "Your child follows the rule and marks the spot. Then switch roles: make up your own ordered pair.",
          "Ask: what is the difference between (3, 2) and (2, 3)? Try both.",
        ],
        es: [
          "Dibujen una cuadrícula en papel con el origen (0, 0) abajo a la izquierda. Numeren los ejes del 0 al 5.",
          "Escondan un tesoro en (3, 2). Díganle a su hijo o hija la regla: primero ir 3 a la derecha y luego subir 2.",
          "Su hijo o hija sigue la regla y marca el lugar. Luego cambien de papel: inventen su propio par ordenado.",
          "Pregunten: ¿qué diferencia hay entre (3, 2) y (2, 3)? Prueben los dos.",
        ],
      },
    },
    {
      title: { en: "Nickel Pattern Graph", es: "Gráfica del patrón de monedas de cinco" },
      minutes: 15,
      materials: { en: "5 nickels (or paper circles), paper, a pencil", es: "5 monedas de cinco centavos (o círculos de papel), papel y lápiz" },
      steps: {
        en: [
          "Line up the nickels one at a time. Each nickel adds 5 cents. Write the rule: add 5.",
          "Make a table: 1 nickel is 5 cents, 2 nickels is 10, 3 is 15, 4 is 20.",
          "Write the ordered pairs: (1, 5), (2, 10), (3, 15), (4, 20). Plot them on a grid.",
          "Ask: what do you notice about the points? What comes next? (5 nickels, 25 cents.)",
        ],
        es: [
          "Pongan las monedas en fila de una en una. Cada moneda suma 5 centavos. Escriban la regla: suma 5.",
          "Hagan una tabla: 1 moneda son 5 centavos, 2 monedas son 10, 3 son 15, 4 son 20.",
          "Escriban los pares ordenados: (1, 5), (2, 10), (3, 15), (4, 20). Ubíquenlos en una cuadrícula.",
          "Pregunten: ¿qué notan sobre los puntos? ¿Qué sigue? (5 monedas, 25 centavos.)",
        ],
      },
    },
    {
      title: { en: "Shape Family Sort", es: "Clasificación de la familia de figuras" },
      minutes: 15,
      materials: { en: "Paper, scissors, a ruler, a pencil", es: "Papel, tijeras, regla y lápiz" },
      steps: {
        en: [
          "Cut out a square, a rectangle that is not a square, and a four-sided shape with two pairs of parallel sides that is not a rectangle.",
          "Check each one: does it have 4 sides? Two pairs of parallel sides? All 4 sides equal? Four square corners?",
          "Draw 3 circles inside each other. Label the outer one quadrilateral, the middle one parallelogram, and the inner one rhombus.",
          "Ask: is a square a type of rhombus? Is every rhombus a square? Say why.",
        ],
        es: [
          "Recorten un cuadrado, un rectángulo que no sea cuadrado y una figura de cuatro lados con dos pares de lados paralelos que no sea un rectángulo.",
          "Revisen cada una: ¿tiene 4 lados? ¿Dos pares de lados paralelos? ¿Sus 4 lados son iguales? ¿Cuatro esquinas cuadradas?",
          "Dibujen 3 círculos uno dentro de otro. Escriban cuadrilátero en el exterior, paralelogramo en el del medio y rombo en el interior.",
          "Pregunten: ¿un cuadrado es un tipo de rombo? ¿Todo rombo es un cuadrado? Digan por qué.",
        ],
      },
    },
    {
      title: { en: "Find the Hidden Coin", es: "Encontrar la moneda escondida" },
      minutes: 15,
      materials: { en: "Paper, a pencil, a coin, a second player", es: "Papel, lápiz, una moneda y otro jugador" },
      steps: {
        en: [
          "Each player draws a 5 by 5 grid, with the origin at the bottom left, and secretly marks where a coin is hidden.",
          "Take turns guessing an ordered pair, like (4, 1). The other player says \"hot\" if you are close or \"cold\" if you are far.",
          "Keep going until someone finds the coin. Say each guess out loud: first the right number, then the up number.",
          "Ask: what helped you guess better? Why is the order of the numbers important?",
        ],
        es: [
          "Cada jugador dibuja una cuadrícula de 5 por 5, con el origen abajo a la izquierda, y marca en secreto dónde esconde una moneda.",
          "Por turnos, adivinen un par ordenado, como (4, 1). El otro jugador dice \"caliente\" si estás cerca o \"frío\" si estás lejos.",
          "Sigan hasta que alguien encuentre la moneda. Digan cada intento en voz alta: primero el número a la derecha y luego el de arriba.",
          "Pregunten: ¿qué te ayudó a adivinar mejor? ¿Por qué importa el orden de los números?",
        ],
      },
    },
  ],
  say_it: [
    { en: "The ordered pair ([number], [number]) means move [number] units right and [number] units up.", es: "El par ordenado ([número], [número]) significa moverse [número] unidades a la derecha y [número] unidades hacia arriba." },
    { en: "A [shape] is a type of [category] that has [attribute].", es: "Un [figura] es un tipo de [categoría] que tiene [atributo]." },
    { en: "The rule is [add / multiply] [number], so the next number is [number].", es: "La regla es [sumar / multiplicar] [número], entonces el siguiente número es [número]." },
    { en: "A [shape] is not a [shape] because ___.", es: "Un [figura] no es un [figura] porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Say \"over, then up\" to remember the order of an ordered pair.",
      "Use real maps, tile floors, and coins. Patterns and grids are everywhere.",
      "Ask \"What is it? What is it not?\" Saying what a shape is not makes definitions clearer.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Digan \"primero a un lado, luego arriba\" para recordar el orden de un par ordenado.",
      "Usen mapas, pisos de losetas y monedas reales. Los patrones y las cuadrículas están en todas partes.",
      "Pregunten \"¿qué es? ¿Qué no es?\". Decir lo que una figura no es aclara las definiciones.",
    ],
  },
  home_language: {
    en: "Give directions in Spanish first, like on a treasure hunt: \"tres a la derecha, dos hacia arriba.\" Then say it in English. Coordenada, origen, atributo, cuadrilátero, paralelogramo, rombo, and jerarquía sound a lot like coordinate, origin, attribute, quadrilateral, parallelogram, rhombus, and hierarchy, so your child already knows them.",
    es: "Den indicaciones primero en español, como en una búsqueda del tesoro: \"tres a la derecha, dos hacia arriba\". Luego díganlas en inglés. Coordenada, origen, atributo, cuadrilátero, paralelogramo, rombo y jerarquía suenan muy parecido a coordinate, origin, attribute, quadrilateral, parallelogram, rhombus y hierarchy, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child finds a point from an ordered pair and defines a shape, in any language, with is a type of and that has.",
    es: "Sabrán que está funcionando cuando su hijo o hija encuentre un punto a partir de un par ordenado y defina una figura, en el idioma que quiera, con es un tipo de y que tiene.",
  },
};
