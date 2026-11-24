// BCPSS Family Guide (EN/ES) — g8-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on transformations, congruence and similarity. Vocabulary order matches ../units/g8-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to move shapes on a grid in four ways: slide, flip, turn and resize. They use those moves to prove that two shapes are exactly the same (congruent) or the same shape in different sizes (similar). It matters when you enlarge a photo, read a map, make a pattern, or look in a mirror.",
    es: "Su hijo o hija está aprendiendo a mover figuras en una cuadrícula de cuatro maneras: deslizar, voltear, girar y cambiar de tamaño. Usa esos movimientos para demostrar que dos figuras son exactamente iguales (congruentes) o tienen la misma forma en distinto tamaño (semejantes). Sirve para agrandar una foto, leer un mapa, hacer un patrón o mirarse en un espejo.",
  },
  goals: {
    en: [
      "I can translate, reflect, rotate and dilate a figure on the coordinate plane.",
      "I can describe a sequence of moves with first, next, then and as a result.",
      "I can use the moves to show that two figures are congruent or similar.",
    ],
    es: [
      "Puedo trasladar, reflejar, rotar y dilatar una figura en el plano de coordenadas.",
      "Puedo describir una serie de movimientos con primero, luego, después y como resultado.",
      "Puedo usar los movimientos para mostrar que dos figuras son congruentes o semejantes.",
    ],
  },
  vocab: [
    { term: "transformation", def_es: "un movimiento o cambio de tamaño que cambia dónde está una figura, hacia dónde mira o qué tan grande es", example_es: "Una transformación puede deslizar, voltear, girar o cambiar de tamaño una figura." },
    { term: "translation", def_es: "un deslizamiento que mueve todos los puntos de una figura la misma distancia en la misma dirección", example_es: "Una traslación de 3 a la derecha y 2 hacia arriba mueve el punto (1, 1) a (4, 3)." },
    { term: "reflection", def_es: "un volteo de una figura sobre una línea, como un espejo", example_es: "Una reflexión sobre el eje y cambia el punto (2, 5) a (−2, 5)." },
    { term: "rotation", def_es: "un giro de una figura alrededor de un punto fijo", example_es: "Una rotación de 90 grados en sentido contrario a las agujas del reloj alrededor del origen mueve (3, 1) a (−1, 3)." },
    { term: "dilation", def_es: "una transformación que agranda o achica una figura multiplicando todas las longitudes por el mismo número", example_es: "Una dilatación con factor de escala 2 convierte un lado de 3 unidades en uno de 6 unidades." },
    { term: "scale factor", def_es: "el número por el que se multiplican todas las longitudes en una dilatación", example_es: "Con un factor de escala de 3, un lado de 4 unidades pasa a medir 12 unidades." },
    { term: "congruent", def_es: "que tiene exactamente la misma forma y el mismo tamaño", example_es: "Dos triángulos congruentes tienen lados iguales y ángulos iguales." },
    { term: "similar", def_es: "que tiene la misma forma, pero no siempre el mismo tamaño", example_es: "Los triángulos con lados 3, 4, 5 y 6, 8, 10 son semejantes." },
    { term: "image", def_es: "la figura nueva que se obtiene después de una transformación", example_es: "El triángulo A′B′C′ es la imagen del triángulo ABC." },
    { term: "corresponding", def_es: "que ocupa la misma posición en dos figuras", example_es: "El lado AB y el lado A′B′ son lados correspondientes." },
  ],
  talk: [
    { en: "Did the shape slide, flip, turn, or get bigger or smaller? How can you tell?", es: "¿La figura se deslizó, se volteó, giró, o se hizo más grande o más pequeña? ¿Cómo lo sabes?" },
    { en: "Which parts match up in the two shapes? What is the same?", es: "¿Qué partes coinciden en las dos figuras? ¿Qué es igual?" },
    { en: "What happened to the size? Did it change?", es: "¿Qué pasó con el tamaño? ¿Cambió?" },
    { en: "Could you get from this shape to that one with a few moves? Which ones?", es: "¿Podrías llegar de esta figura a esa con unos pocos movimientos? ¿Cuáles?" },
    { en: "Where have you seen a shape that looks the same but bigger, like a photo or a map?", es: "¿Dónde has visto una figura que se ve igual pero más grande, como una foto o un mapa?" },
  ],
  try_at_home: [
    {
      title: { en: "Mirror Shapes", es: "Figuras en el espejo" },
      minutes: 10,
      materials: { en: "A small mirror, paper, pencil", es: "Un espejo pequeño, papel, lápiz" },
      steps: {
        en: [
          "Draw a simple shape with a corner, like the letter L, on one side of a line.",
          "Hold the mirror on the line. Look at the reflection.",
          "Draw the flipped shape on the other side of the line, the same distance from the line.",
          "Ask: which points match up? Are the two shapes congruent? How do you know?",
        ],
        es: [
          "Dibujen una figura sencilla con una esquina, como la letra L, en un lado de una línea.",
          "Sostengan el espejo sobre la línea. Miren el reflejo.",
          "Dibujen la figura volteada al otro lado de la línea, a la misma distancia de la línea.",
          "Pregunten: ¿qué puntos coinciden? ¿Las dos figuras son congruentes? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "Slide, Flip, Turn on a Grid", es: "Deslizar, voltear y girar en una cuadrícula" },
      minutes: 15,
      materials: { en: "Graph paper or a grid drawn on paper, a cut-out paper triangle, pencil", es: "Papel cuadriculado o una cuadrícula dibujada en papel, un triángulo de papel recortado, lápiz" },
      steps: {
        en: [
          "Draw a coordinate grid. Trace the paper triangle with points at (1, 1), (3, 1) and (1, 4).",
          "Slide the triangle 4 units to the right. Trace it and write the new points: (5, 1), (7, 1), (5, 4).",
          "Flip it over the y-axis, or turn it 90 degrees about the origin. Trace each time.",
          "Say what you did: \"First I slid it, next I flipped it.\" Are all the shapes congruent?",
        ],
        es: [
          "Dibujen una cuadrícula de coordenadas. Tracen el triángulo de papel con puntos en (1, 1), (3, 1) y (1, 4).",
          "Deslicen el triángulo 4 unidades a la derecha. Tracen y escriban los puntos nuevos: (5, 1), (7, 1), (5, 4).",
          "Voltéenlo sobre el eje y, o gírenlo 90 grados alrededor del origen. Tracen cada vez.",
          "Digan lo que hicieron: \"Primero lo deslicé, luego lo volteé\". ¿Todas las figuras son congruentes?",
        ],
      },
    },
    {
      title: { en: "Zoom In, Zoom Out", es: "Acercar y alejar" },
      minutes: 15,
      materials: { en: "A photo on a phone or a printed picture, a ruler, paper and pencil", es: "Una foto en el teléfono o una imagen impresa, una regla, papel y lápiz" },
      steps: {
        en: [
          "Pick a picture and measure its width and height on the screen or on paper.",
          "Zoom in or enlarge it until the width is twice as long. Measure the new height.",
          "Divide the new height by the old height. Is it also 2? This is the scale factor.",
          "Ask: are the two pictures similar? Congruent? What is different?",
        ],
        es: [
          "Elijan una imagen y midan su ancho y su alto en la pantalla o en papel.",
          "Acérquenla o agrándenla hasta que el ancho sea el doble. Midan el alto nuevo.",
          "Dividan el alto nuevo entre el alto anterior. ¿También es 2? Ese es el factor de escala.",
          "Pregunten: ¿las dos imágenes son semejantes? ¿Congruentes? ¿Qué es diferente?",
        ],
      },
    },
    {
      title: { en: "Pattern Walk", es: "Paseo de patrones" },
      minutes: 10,
      materials: { en: "A short walk or a look around the home, paper and pencil", es: "Un paseo corto o mirar alrededor de la casa, papel y lápiz" },
      steps: {
        en: [
          "Look for patterns made by moving a shape, like floor tiles, a fence, a rug or a brick wall.",
          "Pick one and ask: is it made by sliding, flipping or turning the same shape?",
          "Sketch the pattern and show the move with an arrow.",
          "Ask: are all the shapes in the pattern congruent? How do you know?",
        ],
        es: [
          "Busquen patrones hechos al mover una figura, como baldosas, una cerca, una alfombra o una pared de ladrillos.",
          "Elijan uno y pregunten: ¿se hizo deslizando, volteando o girando la misma figura?",
          "Dibujen el patrón y muestren el movimiento con una flecha.",
          "Pregunten: ¿todas las figuras del patrón son congruentes? ¿Cómo lo saben?",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, I [translated] the figure [4 units to the right].", es: "Primero, [trasladé] la figura [4 unidades a la derecha]." },
    { en: "Next, I dilate it by a scale factor of [2], so [every side is twice as long].", es: "Luego, la dilato con un factor de escala de [2], entonces [cada lado mide el doble]." },
    { en: "The figures are [similar] because [they have the same shape but different sizes].", es: "Las figuras son [semejantes] porque [tienen la misma forma pero distinto tamaño]." },
    { en: "As a result, the [image] is [congruent] to the original.", es: "Como resultado, la [imagen] es [congruente] con la original." },
  ],
  help: {
    en: [
      "You do not need to know the names of the moves. Ask your child to show you with a paper shape.",
      "Use mirrors, photos, and patterns around the house.",
      "Ask \"what stayed the same, and what changed?\" Size, shape and position are different things.",
      "Let your child trace and move a cut-out shape. Doing it by hand helps the idea stick.",
    ],
    es: [
      "No necesitan saber los nombres de los movimientos. Pídanle a su hijo o hija que les muestre con una figura de papel.",
      "Usen espejos, fotos y patrones de la casa.",
      "Pregunten \"¿qué se quedó igual y qué cambió?\". El tamaño, la forma y la posición son cosas distintas.",
      "Dejen que trace y mueva una figura recortada. Hacerlo con las manos ayuda a que la idea se quede.",
    ],
  },
  home_language: {
    en: "Many words are almost the same in Spanish: transformation (transformación), translation (traslación), reflection (reflexión), rotation (rotación), dilation (dilatación), congruent (congruente). Ask your child to give the move in Spanish first: \"deslizar, voltear, girar\". Then use the English word.",
    es: "Muchas palabras son casi iguales en inglés: transformación (transformation), traslación (translation), reflexión (reflection), rotación (rotation), dilatación (dilation), congruente (congruent). Pídanle a su hijo o hija que diga primero el movimiento en español: \"deslizar, voltear, girar\". Después usen la palabra en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child can move a shape on paper and tell you, in any language, what move they used and whether the new shape is the same or only similar.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mover una figura en papel y decirles, en el idioma que quiera, qué movimiento usó y si la figura nueva es igual o solo semejante.",
  },
};
