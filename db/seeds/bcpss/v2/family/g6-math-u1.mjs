// BCPSS Family Guide (EN/ES) — g6-math-u1. Gold-standard exemplar. Schema: ../schema.mjs (validateFamily)
// Home version of the unit "Area, Surface Area & Volume". Vocabulary order matches ../units/g6-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to measure shapes in three ways: the flat space inside a shape (area), the outside skin of a box (surface area), and how much a box can hold (volume). It matters every time someone wraps a gift, paints a wall, or fills a fish tank. Your child will explain each answer with the word because, in any language.",
    es: "Su hijo o hija está aprendiendo a medir figuras de tres maneras: el espacio plano dentro de una figura (área), la \"piel\" por fuera de una caja (área de superficie) y cuánto cabe dentro de una caja (volumen). Sirve cada vez que alguien envuelve un regalo, pinta una pared o llena una pecera. Su hijo o hija explicará cada respuesta con la palabra porque, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can break a flat shape into rectangles and triangles to find its area.",
      "I can unfold a box and add up its faces to find the surface area.",
      "I can explain my answer with because, so, and if … then.",
    ],
    es: [
      "Puedo dividir una figura plana en rectángulos y triángulos para hallar su área.",
      "Puedo desarmar una caja y sumar sus caras para hallar el área de superficie.",
      "Puedo explicar mi respuesta con porque, entonces y si … entonces.",
    ],
  },
  vocab: [
    { term: "decompose", def_es: "dividir una figura en figuras más pequeñas y fáciles, como cortar una galleta en dos partes", example_es: "Puedo descomponer esta figura en forma de L en dos rectángulos." },
    { term: "net", def_es: "un molde plano que se dobla para formar una figura de 3D, como una caja de cereal abierta y estirada", example_es: "La red de un cubo tiene seis cuadrados." },
    { term: "face", def_es: "uno de los lados planos de una figura de 3D; un dado tiene seis", example_es: "Un cubo tiene seis caras, y todas son cuadrados." },
    { term: "surface area", def_es: "todo el papel que necesitas para cubrir por fuera una caja, sin dejar huecos", example_es: "El área de superficie dice cuánto papel de regalo hay que comprar." },
    { term: "polygon", def_es: "una figura plana y cerrada que tiene solo lados rectos, como un triángulo o un hexágono", example_es: "Un pentágono es un polígono con cinco lados." },
    { term: "volume", def_es: "cuánto espacio hay dentro de una figura de 3D; lo que cabe adentro", example_es: "El volumen de esta caja es de 24 pulgadas cúbicas." },
    { term: "cubic unit", def_es: "un cubito que sirve para medir cuánto cabe en una caja, como un cubo de azúcar", example_es: "Contamos unidades cúbicas para hallar el volumen." },
    { term: "edge", def_es: "la línea donde se juntan dos caras de una figura de 3D, como la esquina de una caja", example_es: "Un cubo tiene doce aristas, y todas miden lo mismo." },
  ],
  talk: [
    { en: "What shape did you work with today? Show me with your hands.", es: "¿Con qué figura trabajaste hoy? Muéstramela con las manos." },
    { en: "How do you know your answer is right?", es: "¿Cómo sabes que tu respuesta es correcta?" },
    { en: "Is there a different way to break this shape into pieces?", es: "¿Hay otra manera de dividir esta figura en partes?" },
    { en: "When would a builder, a baker, or a painter need this?", es: "¿Cuándo necesitaría esto un albañil, un panadero o un pintor?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Cereal Box Net", es: "La red de la caja de cereal" },
      minutes: 10,
      materials: { en: "An empty cereal or cracker box, scissors, a marker", es: "Una caja vacía de cereal o galletas, tijeras y un marcador" },
      steps: {
        en: [
          "Ask your child: how many faces does this box have? Count together, in any language.",
          "Cut along the edges so the box opens up flat. This flat pattern is called a net.",
          "Let your child point to each face on the net and write \"1\" to \"6\" on them.",
          "Ask: which faces are the same size? How do you know?",
        ],
        es: [
          "Pregúntenle: ¿cuántas caras tiene esta caja? Cuéntenlas juntos, en el idioma que quieran.",
          "Corten por las aristas para que la caja se abra y quede plana. Este molde plano se llama red.",
          "Dejen que su hijo o hija señale cada cara de la red y escriba del \"1\" al \"6\" en ellas.",
          "Pregunten: ¿qué caras miden lo mismo? ¿Cómo lo sabes?",
        ],
      },
    },
    {
      title: { en: "Wrap the Gift", es: "Envolver el regalo" },
      minutes: 15,
      materials: { en: "A small box, wrapping paper or newspaper, tape, a ruler or a string", es: "Una caja pequeña, papel de regalo o periódico, cinta y una regla o un hilo" },
      steps: {
        en: [
          "Say: let's wrap this box with no gaps and no extra paper. How much paper do we need?",
          "Your child decides how to find out, then cuts the paper into pieces that match each face.",
          "Count the pieces together. Does every face have a partner of the same size?",
          "Lay the pieces flat. That total covering is the surface area. Ask: why did that work?",
        ],
        es: [
          "Digan: vamos a envolver esta caja sin dejar huecos y sin papel de sobra. ¿Cuánto papel necesitamos?",
          "Su hijo o hija decide cómo averiguarlo y corta el papel en piezas que coincidan con cada cara.",
          "Cuenten las piezas juntos. ¿Cada cara tiene una pareja del mismo tamaño?",
          "Pongan las piezas planas. Todo ese papel junto es el área de superficie. Pregunten: ¿por qué funcionó?",
        ],
      },
    },
    {
      title: { en: "Fill the Box", es: "Llenar la caja" },
      minutes: 15,
      materials: { en: "A small box, sugar cubes, dice, or dry beans, and a spoon", es: "Una caja pequeña, cubos de azúcar, dados o frijoles secos, y una cuchara" },
      steps: {
        en: [
          "Ask: how many cubes do you think fit in this box? Write the guess down.",
          "Fill the bottom layer with cubes, side by side, and count how many.",
          "Count how many layers fit from bottom to top. Multiply: cubes in one layer times the number of layers.",
          "Compare with the guess. Ask: what did you notice? This amount is the volume.",
        ],
        es: [
          "Pregunten: ¿cuántos cubos creen que caben en esta caja? Anoten la idea.",
          "Llenen la capa de abajo con cubos, uno al lado del otro, y cuenten cuántos son.",
          "Cuenten cuántas capas caben de abajo hacia arriba. Multipliquen: los cubos de una capa por el número de capas.",
          "Comparen con la idea inicial. Pregunten: ¿qué notaste? Esta cantidad es el volumen.",
        ],
      },
    },
    {
      title: { en: "Block Walk Shapes", es: "Figuras en la cuadra" },
      minutes: 10,
      materials: { en: "A short walk, or a look out the window; paper and pencil", es: "Un paseo corto o mirar por la ventana; papel y lápiz" },
      steps: {
        en: [
          "Look for flat shapes outside: a window, a stop sign, a park bench, a rowhouse step.",
          "Pick one. Ask your child to draw it and sketch lines that cut it into rectangles or triangles.",
          "Ask: is it a polygon? Are all the sides straight?",
          "Pick a box-shaped thing (a mailbox, a bus). Ask: what would you measure to paint it? What to fill it?",
        ],
        es: [
          "Busquen figuras planas afuera: una ventana, una señal de alto, una banca del parque, un escalón de una casa.",
          "Elijan una. Pidan a su hijo o hija que la dibuje y trace líneas que la corten en rectángulos o triángulos.",
          "Pregunten: ¿es un polígono? ¿Todos sus lados son rectos?",
          "Elijan algo con forma de caja (un buzón, un autobús). Pregunten: ¿qué medirías para pintarlo? ¿Y para llenarlo?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I broke the shape into [rectangles] because [reason].", es: "Dividí la figura en [rectángulos] porque [razón]." },
    { en: "The surface area is [number] square [units] because I added every [face].", es: "El área de superficie es [número] [unidades] cuadradas porque sumé cada [cara]." },
    { en: "The volume is [number] cubic [units], so the box can hold [that many cubes].", es: "El volumen es [número] [unidades] cúbicas, entonces la caja cabe [esa cantidad de cubos]." },
    { en: "If I [cut it into pieces], then I can [find each area].", es: "Si [lo corto en partes], entonces puedo [hallar cada área]." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child is the expert and can teach you.",
      "Say \"show me\" and \"how do you know?\" in any language. Explaining out loud makes the idea stick.",
      "Let a mistake be part of the plan. Ask, \"What would you try next?\" before you say if it is right.",
      "Use real boxes, cups, and paper. Touching and folding things beats memorizing rules.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija es el experto y puede enseñarles.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma. Explicar en voz alta ayuda a que la idea se quede.",
      "Dejen que un error sea parte del plan. Pregunten \"¿qué probarías ahora?\" antes de decir si está bien.",
      "Usen cajas, vasos y papel de verdad. Tocar y doblar objetos funciona mejor que memorizar reglas.",
    ],
  },
  home_language: {
    en: "Tell the story of the box in Spanish first: \"la caja, las caras, las aristas.\" Then find the English word together. Five of the words here (polygon, volume, decompose, surface area, cubic unit) sound almost the same in both languages, so your child already knows them.",
    es: "Cuenten primero la historia de la caja en español: \"la caja, las caras, las aristas\". Después busquen juntos la palabra en inglés. Cinco de las palabras (polígono, volumen, descomponer, área de superficie, unidad cúbica) suenan casi igual en los dos idiomas, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child can pick up a box and tell you, in any language, how they would find its surface area or volume and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda tomar una caja y contarles, en el idioma que quiera, cómo hallaría su área de superficie o su volumen y por qué.",
  },
};
