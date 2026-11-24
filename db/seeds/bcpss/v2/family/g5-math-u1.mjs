// BCPSS Family Guide (EN/ES) — g5-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on volume of rectangular prisms and composite solids. Vocabulary order matches ../units/g5-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how to find the volume of a box shape by counting layers of cubes, and why multiplying length, width, and height always works. It matters when someone packs a moving box, fills a fish tank, or chooses the right size container. Your child will explain why a strategy works, in any language.",
    es: "Su hijo o hija está aprendiendo a hallar el volumen de una figura en forma de caja contando capas de cubos, y por qué multiplicar el largo, el ancho y la altura siempre funciona. Sirve cuando alguien empaca una caja de mudanza, llena una pecera o elige el envase del tamaño correcto. Su hijo o hija explicará por qué funciona una estrategia, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can find the volume of a rectangular prism by counting layers or multiplying.",
      "I can break a solid made of two prisms into parts and add their volumes.",
      "I can explain why my strategy works with works because, is valid since, and so.",
    ],
    es: [
      "Puedo hallar el volumen de un prisma rectangular contando capas o multiplicando.",
      "Puedo separar un sólido formado por dos prismas en partes y sumar sus volúmenes.",
      "Puedo explicar por qué funciona mi estrategia con funciona porque, es válida ya que y entonces.",
    ],
  },
  vocab: [
    { term: "volume", def_es: "cuánto espacio ocupa un sólido por dentro, medido en unidades cúbicas", example_es: "El volumen de esta caja es de 24 unidades cúbicas." },
    { term: "cubic unit", def_es: "un cubo de 1 unidad de largo, 1 de ancho y 1 de alto, que sirve para medir el espacio de un sólido", example_es: "Cada dado de la caja es una unidad cúbica." },
    { term: "rectangular prism", def_es: "un sólido con seis caras planas que son rectángulos, como una caja de zapatos", example_es: "Una caja de cereal es un prisma rectangular." },
    { term: "layer", def_es: "un nivel plano de cubos en un sólido, como un piso de un edificio", example_es: "Cada capa de la caja tiene 12 cubos." },
    { term: "base", def_es: "la cara sobre la que se apoya un sólido; su área se llama B en una fórmula", example_es: "La base de la caja tiene 4 cubos de largo y 3 de ancho." },
    { term: "height", def_es: "qué tan alto es un sólido, desde la cara de abajo hasta la de arriba", example_es: "La altura de la caja es de 2 capas." },
    { term: "composite solid", def_es: "un sólido formado al juntar dos o más sólidos más sencillos", example_es: "Un sólido en forma de L hecho con dos cajas es un sólido compuesto." },
    { term: "decompose", def_es: "separar un sólido en sólidos más pequeños y sencillos", example_es: "Descompongo el sólido en dos prismas." },
    { term: "formula", def_es: "una regla escrita con letras que funciona en todos los casos", example_es: "La fórmula del volumen es V = B × h." },
  ],
  talk: [
    { en: "What box or container did you work with today? How did you find its volume?", es: "¿Con qué caja o envase trabajaste hoy? ¿Cómo hallaste su volumen?" },
    { en: "How many cubes are in one layer? How many layers are there?", es: "¿Cuántos cubos hay en una capa? ¿Cuántas capas hay?" },
    { en: "Why does multiplying length, width, and height work?", es: "¿Por qué funciona multiplicar el largo, el ancho y la altura?" },
    { en: "How can you split an L-shaped solid into two boxes?", es: "¿Cómo puedes separar un sólido en forma de L en dos cajas?" },
    { en: "Do two different boxes ever hold the same amount?", es: "¿Dos cajas distintas pueden tener la misma capacidad?" },
  ],
  try_at_home: [
    {
      title: { en: "Build It in Layers", es: "Armar por capas" },
      minutes: 15,
      materials: { en: "24 small cubes (sugar cubes, dice, or blocks), a small box if you have one", es: "24 cubos pequeños (cubos de azúcar, dados o bloques) y una cajita si tienen" },
      steps: {
        en: [
          "Make a base 4 cubes long and 3 cubes wide. Count the cubes in this layer. (12.)",
          "Add a second layer on top. Ask: how many cubes now? (24.)",
          "Ask: how many cubes in one layer, and how many layers? Write 12 × 2 = 24.",
          "Say: the volume is 24 cubic units. Ask: what would happen with 3 layers?",
        ],
        es: [
          "Armen una base de 4 cubos de largo y 3 de ancho. Cuenten los cubos de esta capa. (12.)",
          "Pongan una segunda capa encima. Pregunten: ¿cuántos cubos hay ahora? (24.)",
          "Pregunten: ¿cuántos cubos hay en una capa y cuántas capas hay? Escriban 12 × 2 = 24.",
          "Digan: el volumen es de 24 unidades cúbicas. Pregunten: ¿qué pasaría con 3 capas?",
        ],
      },
    },
    {
      title: { en: "Same Volume, Different Box", es: "Mismo volumen, distinta caja" },
      minutes: 15,
      materials: { en: "24 small cubes, paper and a pencil", es: "24 cubos pequeños, papel y lápiz" },
      steps: {
        en: [
          "Build Box A with all 24 cubes: 4 long, 3 wide, 2 tall.",
          "Take it apart and build Box B: 6 long, 2 wide, 2 tall. Count the cubes.",
          "Write the volumes: 4 × 3 × 2 = 24 and 6 × 2 × 2 = 24.",
          "Ask: the boxes look different. Why is the volume the same?",
        ],
        es: [
          "Armen la caja A con los 24 cubos: 4 de largo, 3 de ancho y 2 de alto.",
          "Desármenla y armen la caja B: 6 de largo, 2 de ancho y 2 de alto. Cuenten los cubos.",
          "Escriban los volúmenes: 4 × 3 × 2 = 24 y 6 × 2 × 2 = 24.",
          "Pregunten: las cajas se ven distintas. ¿Por qué el volumen es el mismo?",
        ],
      },
    },
    {
      title: { en: "Measure a Cereal Box", es: "Medir una caja de cereal" },
      minutes: 15,
      materials: { en: "An empty cereal or cracker box, a ruler, paper and a pencil", es: "Una caja vacía de cereal o de galletas, una regla, papel y lápiz" },
      steps: {
        en: [
          "Measure the length, the width, and the height of the box in inches or centimeters. Round to the nearest whole number.",
          "Find the area of the base: length × width. This is B.",
          "Multiply B by the height. Write: V = B × h. Say the volume with the right unit, like cubic inches.",
          "Ask: why do we say cubic units and not square units?",
        ],
        es: [
          "Midan el largo, el ancho y la altura de la caja en pulgadas o en centímetros. Redondeen al número entero más cercano.",
          "Hallen el área de la base: largo × ancho. Esta es B.",
          "Multipliquen B por la altura. Escriban: V = B × h. Digan el volumen con la unidad correcta, como pulgadas cúbicas.",
          "Pregunten: ¿por qué decimos unidades cúbicas y no unidades cuadradas?",
        ],
      },
    },
    {
      title: { en: "Block Tower L-Shape", es: "Torre de bloques en forma de L" },
      minutes: 15,
      materials: { en: "20 small cubes or blocks, paper and a pencil", es: "20 cubos o bloques pequeños, papel y lápiz" },
      steps: {
        en: [
          "Build an L-shaped solid from two boxes: one is 3 long, 2 wide, 2 tall, and the other is 2 long, 2 wide, 2 tall.",
          "Count the cubes in each box. (12 and 8.) This is called decomposing the solid.",
          "Add: 12 + 8 = 20. The volume of the L-shaped solid is 20 cubic units.",
          "Ask: is there a different way to split it? Does the volume change?",
        ],
        es: [
          "Armen un sólido en forma de L con dos cajas: una de 3 de largo, 2 de ancho y 2 de alto, y la otra de 2 de largo, 2 de ancho y 2 de alto.",
          "Cuenten los cubos de cada caja. (12 y 8.) Esto se llama descomponer el sólido.",
          "Sumen: 12 + 8 = 20. El volumen del sólido en forma de L es de 20 unidades cúbicas.",
          "Pregunten: ¿hay otra manera de separarlo? ¿Cambia el volumen?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I multiplied [length] × [width] × [height], so the volume is [number] cubic units.", es: "Multipliqué [largo] × [ancho] × [alto], entonces el volumen es de [número] unidades cúbicas." },
    { en: "My strategy works because each layer has [number] cubes and there are [number] layers.", es: "Mi estrategia funciona porque cada capa tiene [número] cubos y hay [número] capas." },
    { en: "I decomposed the solid into [number] prisms, then I added their volumes.", es: "Descompuse el sólido en [número] prismas y luego sumé sus volúmenes." },
    { en: "This is valid since ___.", es: "Esto es válido ya que ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use real boxes and small cubes. Building a layer, then stacking, shows why volume works.",
      "Ask \"Why does that work?\" more than \"What is the answer?\"",
      "If your child is stuck, ask them to count one layer first.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen cajas reales y cubitos. Armar una capa y luego apilar muestra por qué funciona el volumen.",
      "Pregunten más \"¿por qué funciona eso?\" que \"¿cuál es la respuesta?\".",
      "Si se atasca, pídanle que cuente primero una capa.",
    ],
  },
  home_language: {
    en: "Name the boxes at home in Spanish first: \"la caja, la capa, la altura.\" Then find the English words. Volumen, unidad cúbica, base, fórmula, and descomponer sound a lot like volume, cubic unit, base, formula, and decompose, so your child already knows them.",
    es: "Nombren primero las cajas de la casa en español: \"la caja, la capa, la altura\". Después busquen las palabras en inglés. Volumen, unidad cúbica, base, fórmula y descomponer suenan muy parecido a volume, cubic unit, base, formula y decompose, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child picks up a box and tells you, in any language, how to find its volume and why the method works.",
    es: "Sabrán que está funcionando cuando su hijo o hija tome una caja y les cuente, en el idioma que quiera, cómo hallar su volumen y por qué funciona el método.",
  },
};
