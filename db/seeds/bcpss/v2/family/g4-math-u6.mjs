// BCPSS Family Guide (EN/ES) — g4-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on angles, lines, symmetry and sorting shapes. Vocabulary order matches ../units/g4-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to measure angles and to sort triangles and four-sided shapes by their lines and corners. It matters when someone builds a shelf, reads a street map, or folds a paper to make it match. Your child will describe a shape so clearly that someone else could sort it, in any language.",
    es: "Su hijo o hija está aprendiendo a medir ángulos y a clasificar triángulos y figuras de cuatro lados por sus líneas y esquinas. Sirve cuando alguien arma un estante, lee un mapa de calles o dobla un papel para que las partes coincidan. Su hijo o hija describirá una figura con tanta claridad que otra persona podría clasificarla, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can name angles as right, acute, or obtuse and measure them in degrees.",
      "I can find parallel lines, perpendicular lines, and lines of symmetry.",
      "I can describe and sort shapes with that, which, and because.",
    ],
    es: [
      "Puedo nombrar ángulos como rectos, agudos u obtusos y medirlos en grados.",
      "Puedo encontrar líneas paralelas, líneas perpendiculares y ejes de simetría.",
      "Puedo describir y clasificar figuras con que, el cual y porque.",
    ],
  },
  vocab: [
    { term: "angle", def_es: "el espacio entre dos líneas que se juntan en un punto, como las dos patas de un compás abierto", example_es: "Las manecillas del reloj forman un ángulo." },
    { term: "degree", def_es: "una unidad para medir qué tan abierto está un ángulo", example_es: "Un ángulo recto mide 90 grados." },
    { term: "protractor", def_es: "una herramienta que sirve para medir ángulos", example_es: "Uso el transportador para medir este ángulo." },
    { term: "right angle", def_es: "una esquina cuadrada que mide exactamente 90 grados", example_es: "La esquina de una hoja de papel es un ángulo recto." },
    { term: "acute angle", def_es: "un ángulo más pequeño que una esquina cuadrada", example_es: "Un ángulo de 30 grados es un ángulo agudo." },
    { term: "obtuse angle", def_es: "un ángulo más abierto que una esquina cuadrada, pero que no llega a ser una línea recta", example_es: "Un ángulo de 120 grados es un ángulo obtuso." },
    { term: "parallel", def_es: "que siempre está a la misma distancia y nunca se junta, como las rayas de un paso peatonal", example_es: "Las rayas del paso peatonal son líneas paralelas." },
    { term: "perpendicular", def_es: "que se juntan formando una esquina cuadrada", example_es: "Dos calles que se cruzan en una esquina cuadrada son perpendiculares." },
    { term: "line of symmetry", def_es: "una línea de doblez que forma dos mitades que coinciden exactamente", example_es: "Un cuadrado tiene cuatro ejes de simetría." },
    { term: "quadrilateral", def_es: "una figura plana con cuatro lados rectos", example_es: "Un trapecio es un cuadrilátero." },
  ],
  talk: [
    { en: "Show me an angle you found today. Is it right, acute, or obtuse?", es: "Muéstrame un ángulo que encontraste hoy. ¿Es recto, agudo u obtuso?" },
    { en: "How can you tell two lines are parallel? Perpendicular?", es: "¿Cómo sabes que dos líneas son paralelas? ¿Y perpendiculares?" },
    { en: "Where could you fold this shape so both halves match?", es: "¿Por dónde puedes doblar esta figura para que las dos mitades coincidan?" },
    { en: "Can you describe a shape without naming it, so I can guess it?", es: "¿Puedes describir una figura sin decir su nombre, para que yo la adivine?" },
    { en: "What shape is this, and what is it not? How do you know?", es: "¿Qué figura es esta y qué no es? ¿Cómo lo sabes?" },
  ],
  try_at_home: [
    {
      title: { en: "Paper Corner Angle Hunt", es: "Búsqueda de ángulos con la esquina de papel" },
      minutes: 15,
      materials: { en: "A sheet of paper with a square corner, a pencil", es: "Una hoja de papel con esquina cuadrada y un lápiz" },
      steps: {
        en: [
          "Use the corner of the paper as a right-angle checker.",
          "Walk around the house and test corners: a door, a window, a book, a table.",
          "Sort what you find: matches the paper corner (right), smaller (acute), or wider (obtuse).",
          "Ask: which kind did you find the most? Where could you find an obtuse angle? (An open laptop is one.)",
        ],
        es: [
          "Usen la esquina del papel para comprobar los ángulos rectos.",
          "Recorran la casa y prueben esquinas: una puerta, una ventana, un libro, una mesa.",
          "Clasifiquen lo que encuentren: coincide con la esquina del papel (recto), es más pequeño (agudo) o es más abierto (obtuso).",
          "Pregunten: ¿qué tipo encontraste más veces? ¿Dónde puedes encontrar un ángulo obtuso? (Una laptop abierta es uno.)",
        ],
      },
    },
    {
      title: { en: "Clock Hand Angles", es: "Ángulos de las manecillas" },
      minutes: 10,
      materials: { en: "A round wall clock, or a drawing of one; paper and a pencil", es: "Un reloj redondo de pared o un dibujo de uno; papel y lápiz" },
      steps: {
        en: [
          "Look at the clock at 3:00. The hands make a square corner. That is 90 degrees, a right angle.",
          "Each hour mark is 30 degrees from the next one. At 1:00, the angle is 30 degrees, so it is acute.",
          "At 4:00, there are 4 hour marks, so the angle is 4 × 30 = 120 degrees. Is that acute or obtuse?",
          "Pick a time. Ask your child to find the angle and say whether it is right, acute, or obtuse.",
        ],
        es: [
          "Miren el reloj a las 3:00. Las manecillas forman una esquina cuadrada. Son 90 grados, un ángulo recto.",
          "Cada marca de hora está a 30 grados de la siguiente. A la 1:00, el ángulo es de 30 grados, así que es agudo.",
          "A las 4:00 hay 4 marcas de hora, así que el ángulo es de 4 × 30 = 120 grados. ¿Es agudo u obtuso?",
          "Elijan una hora. Pidan a su hijo o hija que halle el ángulo y diga si es recto, agudo u obtuso.",
        ],
      },
    },
    {
      title: { en: "Fold to Match", es: "Doblar para que coincida" },
      minutes: 10,
      materials: { en: "Paper, scissors, a pencil", es: "Papel, tijeras y lápiz" },
      steps: {
        en: [
          "Cut out a square, a rectangle, and a heart (fold the paper first to cut a heart).",
          "Fold each shape so the two halves match exactly. The fold line is a line of symmetry.",
          "Count how many different ways you can fold each shape. (A square: 4. A rectangle that is not a square: 2.)",
          "Ask: why does the rectangle have fewer lines of symmetry than the square?",
        ],
        es: [
          "Recorten un cuadrado, un rectángulo y un corazón (doblen primero el papel para cortar el corazón).",
          "Doblen cada figura para que las dos mitades coincidan exactamente. La línea de doblez es un eje de simetría.",
          "Cuenten de cuántas maneras distintas pueden doblar cada figura. (Un cuadrado: 4. Un rectángulo que no es cuadrado: 2.)",
          "Pregunten: ¿por qué el rectángulo tiene menos ejes de simetría que el cuadrado?",
        ],
      },
    },
    {
      title: { en: "Crosswalk and Corner", es: "Paso peatonal y esquina" },
      minutes: 15,
      materials: { en: "A walk outside or a look at a street map; paper and a pencil", es: "Un paseo afuera o un mapa de calles; papel y lápiz" },
      steps: {
        en: [
          "Look for parallel lines: crosswalk stripes, lines of a fence, or two sides of a street.",
          "Look for perpendicular lines: where two streets cross at a square corner.",
          "Draw what you see. Mark parallel lines with arrows and perpendicular lines with a small square.",
          "Pick a four-sided shape you see, like a window or a sign. Ask: does it have parallel sides? Right angles?",
        ],
        es: [
          "Busquen líneas paralelas: las rayas del paso peatonal, las líneas de una cerca o los dos lados de una calle.",
          "Busquen líneas perpendiculares: donde dos calles se cruzan en una esquina cuadrada.",
          "Dibujen lo que ven. Marquen las líneas paralelas con flechas y las perpendiculares con un cuadradito.",
          "Elijan una figura de cuatro lados que vean, como una ventana o un letrero. Pregunten: ¿tiene lados paralelos? ¿Ángulos rectos?",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [shape] is a [group] that has [feature].", es: "Un [figura] es un [grupo] que tiene [característica]." },
    { en: "This angle measures [number] degrees, so it is [acute / right / obtuse].", es: "Este ángulo mide [número] grados, entonces es [agudo / recto / obtuso]." },
    { en: "A [shape] is not a [group] because [reason].", es: "Un [figura] no es un [grupo] porque [razón]." },
    { en: "The two lines are [parallel] because ___.", es: "Las dos líneas son [paralelas] porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use a square paper corner as a tester. It works for any angle you find.",
      "Say \"describe it so I can guess it.\" Describing shapes clearly is the goal.",
      "Look at the shapes of real things together: signs, buildings, windows, tiles.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen la esquina cuadrada de una hoja como comprobador. Sirve para cualquier ángulo que encuentren.",
      "Digan \"descríbela para que yo la adivine\". Describir las figuras con claridad es la meta.",
      "Miren juntos las figuras de cosas reales: letreros, edificios, ventanas, losetas.",
    ],
  },
  home_language: {
    en: "Describe shapes in Spanish first, like a game: \"tiene cuatro lados y todos son iguales.\" Then say it in English. Ángulo, grado, paralelo, perpendicular, and cuadrilátero sound a lot like angle, degree, parallel, perpendicular, and quadrilateral, so your child already knows them.",
    es: "Describan primero las figuras en español, como un juego: \"tiene cuatro lados y todos son iguales\". Luego díganlo en inglés. Ángulo, grado, paralelo, perpendicular y cuadrilátero suenan muy parecido a angle, degree, parallel, perpendicular y quadrilateral, así que su hijo o hija ya los conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child describes a shape in clear steps and you can guess it, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija describa una figura en pasos claros y ustedes puedan adivinarla, en el idioma que quiera.",
  },
};
