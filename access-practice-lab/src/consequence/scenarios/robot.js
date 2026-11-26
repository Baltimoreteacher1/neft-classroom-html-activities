// Language for Mathematics: Pico, a delivery robot that follows directions literally. Original content.
// Directions on a coordinate grid (counts + direction words), ordered pairs (x before y), ordinal position words.
const nums = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const n = from + i;
    return { id: `n${n}`, text: [String(n), String(n)], value: n };
  });
const fewTile = {
  id: "few",
  text: ["a few", "unos cuantos"],
  vague: [
    "Pico beeps and stays still: “A few is not a number. How many units should I move?”",
    "Pico pita y no se mueve: “Unos cuantos no es un número. ¿Cuántas unidades me muevo?”",
  ],
};
const dirTiles = (suffix) => [
  { id: `right${suffix}`, text: ["to the right", "a la derecha"], value: "E" },
  { id: `left${suffix}`, text: ["to the left", "a la izquierda"], value: "W" },
  { id: `up${suffix}`, text: ["up", "hacia arriba"], value: "N" },
  { id: `down${suffix}`, text: ["down", "hacia abajo"], value: "S" },
  {
    id: `there${suffix}`,
    text: ["over there", "por allá"],
    vague: [
      "Pico turns in a circle: “I cannot see where you are pointing. Which direction?”",
      "Pico da una vuelta: “No veo adónde señalas. ¿En qué dirección?”",
    ],
  },
];
const vagueMiss = {
  say: ["Pico did not move.", "Pico no se movió."],
  revise: [
    "Pico only understands exact words. Replace the vague tile with a number or a direction.",
    "Pico solo entiende palabras exactas. Cambia la ficha imprecisa por un número o una dirección.",
  ],
};
const GRID = { w: 6, h: 6 };

export const ROBOT = {
  id: "literal-robot",
  title: ["Pico, the Literal Robot", "Pico, el robot literal"],
  summary: [
    "Give a delivery robot directions on a grid. It does exactly what your words say, nothing more.",
    "Dale instrucciones a un robot repartidor en una cuadrícula. Hace exactamente lo que dicen tus palabras, nada más.",
  ],
  feature: [
    "Precise directions: numbers, direction words, ordered pairs and ordinal words",
    "Instrucciones precisas: números, palabras de dirección, pares ordenados y números ordinales",
  ],
  area: ["Language for Mathematics", "Lenguaje para las matemáticas"],
  keyUse: "Explain",
  standards: {
    "3-5": ["ELD-MA.4-5.Explain.Expressive", "ELD-SI.4-12.Inform"],
    "6-8": ["ELD-MA.6-8.Explain.Expressive", "ELD-SI.4-12.Inform"],
  },
  character: { name: "Pico", role: ["Delivery robot", "Robot repartidor"] },
  rounds: [
    {
      id: "pad",
      kind: "path",
      situation: [
        "Pico starts at (0, 0) with a low battery. The charging pad is at (4, 2). Tell Pico how to get there.",
        "Pico empieza en (0, 0) con poca batería. La base de carga está en (4, 2). Dile a Pico cómo llegar.",
      ],
      frame: "Move {n1} units {d1}, then move {n2} units {d2}.",
      slots: [
        { id: "n1", label: ["How many?", "¿Cuántas?"], options: [...nums(1, 5), fewTile] },
        { id: "d1", label: ["Which way?", "¿Hacia dónde?"], options: dirTiles("") },
        {
          id: "n2",
          label: ["How many next?", "¿Cuántas después?"],
          options: [...nums(1, 5), { ...fewTile, id: "few2" }],
        },
        { id: "d2", label: ["Which way next?", "¿Hacia dónde después?"], options: dirTiles("2") },
      ],
      moves: [
        ["n1", "d1"],
        ["n2", "d2"],
      ],
      grid: GRID,
      start: [0, 0],
      target: [4, 2],
      items: [{ at: [4, 2], label: ["charging pad", "base de carga"], note: ["", ""] }],
      bank: [
        ["unit: one square on the grid", "unidad: un cuadro de la cuadrícula"],
        ["to the right / to the left: across", "a la derecha / a la izquierda: de lado"],
        ["up / down: along the side", "hacia arriba / hacia abajo: a lo largo del lado"],
        ["then: next, after that", "luego: después de eso"],
      ],
      tip: [
        "A robot needs an exact count and an exact direction for every move.",
        "Un robot necesita un número exacto y una dirección exacta para cada movimiento.",
      ],
      success: [
        "Pico rolls onto the charging pad. Its battery light turns on: charging!",
        "Pico llega a la base de carga. Se enciende la luz de la batería: ¡cargando!",
      ],
      misses: {
        vague: vagueMiss,
        x: {
          say: [
            "Pico stopped at ({x}, {y}), not on the pad.",
            "Pico se detuvo en ({x}, {y}), no en la base.",
          ],
          revise: [
            "Your up-and-down part works. Check the count or the direction of the move that goes across.",
            "La parte de arriba y abajo funciona. Revisa el número o la dirección del movimiento de lado.",
          ],
        },
        y: {
          say: [
            "Pico stopped at ({x}, {y}), not on the pad.",
            "Pico se detuvo en ({x}, {y}), no en la base.",
          ],
          revise: [
            "Your across part works. Check the count or the direction of the move that goes up or down.",
            "La parte de lado funciona. Revisa el número o la dirección del movimiento hacia arriba o abajo.",
          ],
        },
        both: {
          say: [
            "Pico stopped at ({x}, {y}), far from the pad.",
            "Pico se detuvo en ({x}, {y}), lejos de la base.",
          ],
          revise: [
            "Compare where Pico stopped with (4, 2). One move should go across and one should go up or down.",
            "Compara dónde se detuvo Pico con (4, 2). Un movimiento va de lado y otro hacia arriba o abajo.",
          ],
        },
        edge: {
          say: [
            "Pico reached the edge of the grid at ({x}, {y}) and stopped: there is no road that way.",
            "Pico llegó al borde de la cuadrícula en ({x}, {y}) y se detuvo: no hay camino por ahí.",
          ],
          revise: [
            "One direction word sends Pico off the grid. Which way is the pad from (0, 0)?",
            "Una palabra de dirección saca a Pico de la cuadrícula. ¿Hacia dónde está la base desde (0, 0)?",
          ],
        },
      },
    },
    {
      id: "tree",
      kind: "point",
      situation: [
        "A neighbor ordered seeds. Deliver them to the tree at (2, 5). Name the point for Pico. There is a rock at (5, 2).",
        "Un vecino pidió semillas. Llévalas al árbol en (2, 5). Dile el punto a Pico. Hay una roca en (5, 2).",
      ],
      frame: "Go to the point ({x}, {y}).",
      slots: [
        { id: "x", label: ["First number", "Primer número"], options: nums(1, 5) },
        {
          id: "y",
          label: ["Second number", "Segundo número"],
          options: nums(1, 5).map((o) => ({ ...o, id: `y${o.value}` })),
        },
      ],
      point: { x: "x", y: "y" },
      grid: GRID,
      start: [0, 0],
      target: [2, 5],
      items: [
        { at: [2, 5], label: ["tree", "árbol"], note: ["", ""] },
        {
          at: [5, 2],
          label: ["rock", "roca"],
          note: [
            "Pico found a rock here, not a tree.",
            "Pico encontró una roca aquí, no un árbol.",
          ],
        },
      ],
      bank: [
        [
          "ordered pair: two numbers in parentheses, (x, y)",
          "par ordenado: dos números entre paréntesis, (x, y)",
        ],
        ["x-coordinate: how far across", "coordenada x: qué tan lejos de lado"],
        ["y-coordinate: how far up", "coordenada y: qué tan lejos hacia arriba"],
      ],
      tip: [
        "Pico reads an ordered pair in order: it goes across first, then up.",
        "Pico lee un par ordenado en orden: primero va de lado y luego hacia arriba.",
      ],
      success: [
        "Pico parks under the tree at (2, 5). The neighbor waves: the seeds arrived.",
        "Pico se estaciona bajo el árbol en (2, 5). El vecino saluda: llegaron las semillas.",
      ],
      misses: {
        swapped: {
          say: [
            "Pico went {x} units across and {y} units up, to ({x}, {y}).",
            "Pico avanzó {x} unidades de lado y {y} hacia arriba, hasta ({x}, {y}).",
          ],
          revise: [
            "Pico used your numbers in the order you said them. In an ordered pair, which number tells how far across?",
            "Pico usó tus números en el orden en que los dijiste. En un par ordenado, ¿qué número indica qué tan lejos de lado?",
          ],
        },
        x: {
          say: [
            "Pico went to ({x}, {y}). The tree is not there.",
            "Pico fue a ({x}, {y}). El árbol no está ahí.",
          ],
          revise: [
            "Your second number works. Count how far across the tree is: that is the first number.",
            "Tu segundo número funciona. Cuenta qué tan lejos de lado está el árbol: ese es el primer número.",
          ],
        },
        y: {
          say: [
            "Pico went to ({x}, {y}). The tree is not there.",
            "Pico fue a ({x}, {y}). El árbol no está ahí.",
          ],
          revise: [
            "Your first number works. Count how far up the tree is: that is the second number.",
            "Tu primer número funciona. Cuenta qué tan lejos hacia arriba está el árbol: ese es el segundo número.",
          ],
        },
        both: {
          say: [
            "Pico went to ({x}, {y}). The tree is not there.",
            "Pico fue a ({x}, {y}). El árbol no está ahí.",
          ],
          revise: [
            "Find the tree on the grid. Count across from 0, then count up from 0.",
            "Busca el árbol en la cuadrícula. Cuenta de lado desde 0 y luego hacia arriba desde 0.",
          ],
        },
        edge: {
          say: ["Pico reached the edge at ({x}, {y}).", "Pico llegó al borde en ({x}, {y})."],
          revise: ["Use numbers that are on the grid.", "Usa números que estén en la cuadrícula."],
        },
      },
    },
    {
      id: "shelf",
      kind: "pick",
      situation: [
        "Back at the warehouse, Pico must pick up the solar cell from the shelves. The boxes all look the same to Pico. Tell it exactly which box.",
        "En el almacén, Pico debe recoger la celda solar de los estantes. Para Pico todas las cajas se ven iguales. Dile exactamente qué caja.",
      ],
      frame: "Pick up the {ord} box from the {side} on the {row} shelf from the top.",
      slots: [
        {
          id: "ord",
          label: ["Which box?", "¿Qué caja?"],
          options: [
            { id: "first", text: ["first", "primera"], value: 1 },
            { id: "second", text: ["second", "segunda"], value: 2 },
            { id: "third", text: ["third", "tercera"], value: 3 },
            { id: "fourth", text: ["fourth", "cuarta"], value: 4 },
            {
              id: "next",
              text: ["next", "siguiente"],
              vague: [
                "Pico’s arm stops in the air: “Next to what? Tell me a position, like first or second.”",
                "El brazo de Pico se detiene: “¿Siguiente a qué? Dime una posición, como primera o segunda.”",
              ],
            },
          ],
        },
        {
          id: "side",
          label: ["Counting from", "Contando desde"],
          options: [
            { id: "left", text: ["left", "la izquierda"], value: "left" },
            { id: "right", text: ["right", "la derecha"], value: "right" },
          ],
        },
        {
          id: "row",
          label: ["Which shelf?", "¿Qué estante?"],
          options: [
            { id: "row1", text: ["first", "primer"], value: 1 },
            { id: "row2", text: ["second", "segundo"], value: 2 },
            { id: "row3", text: ["third", "tercer"], value: 3 },
          ],
        },
      ],
      pick: { ord: "ord", side: "side", row: "row" },
      grid: { w: 4, h: 3 },
      target: [3, 2],
      items: [
        [1, 1, "bolts", "tornillos"],
        [2, 1, "wires", "cables"],
        [3, 1, "wheels", "ruedas"],
        [4, 1, "tape", "cinta"],
        [1, 2, "gears", "engranajes"],
        [2, 2, "springs", "resortes"],
        [3, 2, "solar cell", "celda solar"],
        [4, 2, "batteries", "pilas"],
        [1, 3, "paint", "pintura"],
        [2, 3, "nails", "clavos"],
        [3, 3, "magnets", "imanes"],
        [4, 3, "rope", "cuerda"],
      ].map(([c, r, en, es]) => ({ at: [c, r], label: [en, es] })),
      bank: [
        [
          "first, second, third, fourth: positions in order",
          "primero, segundo, tercero, cuarto: posiciones en orden",
        ],
        [
          "from the left / from the right: where you start counting",
          "desde la izquierda / desde la derecha: dónde empiezas a contar",
        ],
        ["shelf: one row of boxes", "estante: una fila de cajas"],
      ],
      tip: [
        "A position word needs a starting point: say where to start counting.",
        "Una palabra de posición necesita un punto de partida: di desde dónde contar.",
      ],
      success: [
        "Pico lifts the solar cell and places it in the delivery basket. Delivery complete!",
        "Pico levanta la celda solar y la pone en la canasta de entregas. ¡Entrega completa!",
      ],
      misses: {
        vague: {
          say: ["Pico picked up nothing.", "Pico no recogió nada."],
          revise: [
            "Use an ordinal word (first, second, third, fourth) so Pico knows the exact box.",
            "Usa un número ordinal (primera, segunda, tercera, cuarta) para que Pico sepa la caja exacta.",
          ],
        },
        x: {
          say: ["Pico picked up the box of {item}.", "Pico recogió la caja de {item}."],
          revise: [
            "The shelf is right. Count the boxes again on that shelf: which position is the solar cell, and from which side?",
            "El estante es correcto. Cuenta otra vez las cajas de ese estante: ¿en qué posición está la celda solar y desde qué lado?",
          ],
        },
        y: {
          say: ["Pico picked up the box of {item}.", "Pico recogió la caja de {item}."],
          revise: [
            "The position along the shelf is right, but the shelf is not. Count the shelves from the top.",
            "La posición en el estante es correcta, pero el estante no. Cuenta los estantes desde arriba.",
          ],
        },
        both: {
          say: ["Pico picked up the box of {item}.", "Pico recogió la caja de {item}."],
          revise: [
            "Find the solar cell first. Count shelves from the top, then count boxes from one side.",
            "Busca primero la celda solar. Cuenta los estantes desde arriba y luego las cajas desde un lado.",
          ],
        },
      },
    },
  ],
};
