// BCPSS Family Guide (EN/ES) — g3-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on area and perimeter of rectangles. Vocabulary order matches ../units/g3-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning two ways to measure a rectangle: the space inside it (area) and the distance around it (perimeter). It matters when someone covers a floor with tiles, plants a garden bed, or puts a fence around a yard. Your child will explain how the two ideas are alike and different, in any language.",
    es: "Su hijo o hija está aprendiendo dos maneras de medir un rectángulo: el espacio dentro de él (área) y la distancia alrededor (perímetro). Sirve cuando alguien cubre un piso con losetas, planta un cantero o pone una cerca alrededor de un patio. Su hijo o hija explicará en qué se parecen y en qué se diferencian las dos ideas, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can find the area of a rectangle by counting or multiplying square units.",
      "I can find the perimeter by adding all the sides.",
      "I can tell how area and perimeter are different with both, whereas, and but.",
    ],
    es: [
      "Puedo hallar el área de un rectángulo contando o multiplicando unidades cuadradas.",
      "Puedo hallar el perímetro sumando todos los lados.",
      "Puedo decir en qué se diferencian el área y el perímetro con ambos, mientras que y pero.",
    ],
  },
  vocab: [
    { term: "area", def_es: "cuántos cuadritos cubren el espacio dentro de una figura", example_es: "El área de la mesa es de 12 unidades cuadradas." },
    { term: "perimeter", def_es: "la distancia alrededor del borde de una figura, como una cerca", example_es: "Para el perímetro, sumo los cuatro lados." },
    { term: "square unit", def_es: "un cuadrito de 1 unidad de lado que sirve para medir cuánto espacio cubre una figura", example_es: "Cada loseta del piso es una unidad cuadrada." },
    { term: "tile", def_es: "cubrir una figura con cuadrados, sin dejar huecos y sin encimarlos, como las losetas de un piso", example_es: "Cubrí el rectángulo con cuadrados, sin huecos ni encimar ninguno." },
    { term: "length", def_es: "qué tan largo es algo, de un extremo al otro", example_es: "La longitud del tapete es de 4 pies." },
    { term: "width", def_es: "qué tan ancho es algo, de un lado al otro", example_es: "El ancho del tapete es de 3 pies." },
    { term: "rectangle", def_es: "una figura con cuatro lados rectos y cuatro esquinas cuadradas, como una hoja de papel", example_es: "Una puerta es un rectángulo." },
    { term: "decompose", def_es: "dividir una figura en figuras más sencillas", example_es: "Puedo descomponer esta figura en forma de L en dos rectángulos." },
    { term: "side", def_es: "una de las orillas rectas de una figura", example_es: "Un rectángulo tiene cuatro lados." },
  ],
  talk: [
    { en: "What did you measure today, the space inside or the distance around?", es: "¿Qué mediste hoy, el espacio de adentro o la distancia de alrededor?" },
    { en: "How are area and perimeter alike? How are they different?", es: "¿En qué se parecen el área y el perímetro? ¿En qué se diferencian?" },
    { en: "How do you know there are no gaps in your tiles?", es: "¿Cómo sabes que no hay huecos entre tus cuadros?" },
    { en: "Where would a builder or a gardener need area? Where would they need perimeter?", es: "¿Dónde necesitaría el área un albañil o un jardinero? ¿Y dónde el perímetro?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Tile the Table", es: "Cubrir la mesa con cuadros" },
      minutes: 15,
      materials: { en: "Sticky notes, crackers, or paper squares of the same size; a table or a book", es: "Notas adhesivas, galletas o cuadros de papel del mismo tamaño; una mesa o un libro" },
      steps: {
        en: [
          "Pick a flat rectangle, like a cutting board or a book cover.",
          "Cover it with squares, with no gaps and no overlaps. Count them together.",
          "Ask: how many squares cover the inside? That count is the area.",
          "Count the rows and the squares in each row. Ask: can we multiply to check?",
        ],
        es: [
          "Elijan un rectángulo plano, como una tabla de cortar o la tapa de un libro.",
          "Cúbranlo con cuadros, sin huecos y sin encimarlos. Cuéntenlos juntos.",
          "Pregunten: ¿cuántos cuadros cubren el interior? Esa cantidad es el área.",
          "Cuenten las filas y los cuadros de cada fila. Pregunten: ¿podemos multiplicar para comprobar?",
        ],
      },
    },
    {
      title: { en: "Fence the Garden", es: "Cercar el jardín" },
      minutes: 15,
      materials: { en: "A piece of string, a ruler or a shoe to measure with, paper, a pencil", es: "Un hilo, una regla o un zapato para medir, papel y lápiz" },
      steps: {
        en: [
          "Say: we are building a garden bed in the shape of a rectangle. Choose a length and a width, such as 5 and 3 shoes.",
          "Lay the string around the edge of the rectangle on the floor.",
          "Measure each of the four sides and add: 5 + 3 + 5 + 3 = 16. That is the perimeter.",
          "Ask: is the perimeter the same as the area? Count the squares inside (5 × 3 = 15) and compare.",
        ],
        es: [
          "Digan: vamos a hacer un cantero con forma de rectángulo. Elijan un largo y un ancho, por ejemplo 5 y 3 zapatos.",
          "Pongan el hilo alrededor del borde del rectángulo en el piso.",
          "Midan cada uno de los cuatro lados y sumen: 5 + 3 + 5 + 3 = 16. Ese es el perímetro.",
          "Pregunten: ¿el perímetro es igual al área? Cuenten los cuadros del interior (5 × 3 = 15) y comparen.",
        ],
      },
    },
    {
      title: { en: "Same Fence, Different Garden", es: "La misma cerca, otro jardín" },
      minutes: 15,
      materials: { en: "A piece of string or yarn, paper with squares or a napkin you can fold, a pencil", es: "Un hilo o estambre, papel cuadriculado o una servilleta que se pueda doblar, y lápiz" },
      steps: {
        en: [
          "Say: we have 12 feet of fence. Draw a rectangle that uses all 12, like 4 by 2 (4 + 2 + 4 + 2 = 12).",
          "Find its area: 4 × 2 = 8 square units.",
          "Draw a different rectangle with the same perimeter, like 5 by 1, or 3 by 3. Find its area.",
          "Ask: which garden has more space? What did you notice about perimeter and area?",
        ],
        es: [
          "Digan: tenemos 12 pies de cerca. Dibujen un rectángulo que use los 12, como uno de 4 por 2 (4 + 2 + 4 + 2 = 12).",
          "Hallen su área: 4 × 2 = 8 unidades cuadradas.",
          "Dibujen otro rectángulo con el mismo perímetro, como uno de 5 por 1 o de 3 por 3. Hallen su área.",
          "Pregunten: ¿qué jardín tiene más espacio? ¿Qué notaste sobre el perímetro y el área?",
        ],
      },
    },
    {
      title: { en: "L-Shaped Room", es: "El cuarto en forma de L" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Draw a room shaped like an L. Make one part 4 by 3 and the other part 2 by 2.",
          "Cut the L into two rectangles with a line. This is called decomposing.",
          "Find the area of each part (4 × 3 = 12 and 2 × 2 = 4), then add: 12 + 4 = 16 square units.",
          "Ask: is there another place to draw the line? Does the total change?",
        ],
        es: [
          "Dibujen un cuarto con forma de L. Hagan una parte de 4 por 3 y la otra de 2 por 2.",
          "Corten la L en dos rectángulos con una línea. Esto se llama descomponer.",
          "Hallen el área de cada parte (4 × 3 = 12 y 2 × 2 = 4) y luego sumen: 12 + 4 = 16 unidades cuadradas.",
          "Pregunten: ¿hay otro lugar para trazar la línea? ¿Cambia el total?",
        ],
      },
    },
  ],
  say_it: [
    { en: "The area is [number] square [units] because [length] × [width] = [number].", es: "El área es [número] [unidades] cuadradas porque [longitud] × [ancho] = [número]." },
    { en: "The perimeter is [number] [units] because I added all four [sides].", es: "El perímetro es [número] [unidades] porque sumé los cuatro [lados]." },
    { en: "Both [shapes] are rectangles, but ___.", es: "Ambas [figuras] son rectángulos, pero ___." },
    { en: "Area measures the space [inside], whereas perimeter measures the distance [around].", es: "El área mide el espacio [de adentro], mientras que el perímetro mide la distancia [de alrededor]." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Say \"inside or around?\" to help your child choose between area and perimeter.",
      "Use real things you can walk around or cover: a rug, a table, a yard.",
      "Let your child check by counting squares and by multiplying. Two ways that match is a good sign.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Digan \"¿adentro o alrededor?\" para ayudar a su hijo o hija a elegir entre área y perímetro.",
      "Usen cosas reales que puedan recorrer o cubrir: una alfombra, una mesa, un patio.",
      "Dejen que comprueben contando cuadros y multiplicando. Si las dos maneras coinciden, es buena señal.",
    ],
  },
  home_language: {
    en: "Name the shapes and measures in Spanish first: \"el piso, el borde, el cuadro.\" Then find the English words together. Area, perimeter, rectangle, and decompose have close Spanish twins (área, perímetro, rectángulo, descomponer), so your child already knows them.",
    es: "Nombren primero las figuras y las medidas en español: \"el piso, el borde, el cuadro\". Después busquen juntos las palabras en inglés. Área, perímetro, rectángulo y descomponer tienen gemelas muy parecidas en inglés (area, perimeter, rectangle, decompose), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at a rug or a table and tells you, in any language, how to find the space inside and the distance around.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire una alfombra o una mesa y les cuente, en el idioma que quiera, cómo hallar el espacio de adentro y la distancia de alrededor.",
  },
};
