// BCPSS Family Guide (EN/ES) — g2-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 unit on arrays, equal groups and shapes. Vocabulary order matches ../units/g2-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to write equations for arrays and equal groups, and to tell how many sides and angles a shape has. It matters when we set out muffins in rows, line up chairs, or look at shapes on signs and buildings. Your child will say what a shape is, what it has, and what it is not.",
    es: "Su hijo o hija está aprendiendo a escribir ecuaciones para arreglos y grupos iguales, y a decir cuántos lados y ángulos tiene una figura. Sirve cuando ponemos panecillos en filas, alineamos sillas o miramos las figuras de letreros y edificios. Su hijo o hija dirá qué es una figura, qué tiene y qué no es.",
  },
  goals: {
    en: [
      "I can write an equation for an array or equal groups.",
      "I can tell how many sides and angles a shape has.",
      "I can say what a shape is, what it has, and what it is not.",
    ],
    es: [
      "Puedo escribir una ecuación para un arreglo o grupos iguales.",
      "Puedo decir cuántos lados y ángulos tiene una figura.",
      "Puedo decir qué es una figura, qué tiene y qué no es.",
    ],
  },
  vocab: [
    { term: "array", def_es: "un arreglo: objetos puestos en filas y columnas iguales", example_es: "Las galletas en la bandeja forman un arreglo de 3 filas y 4 columnas." },
    { term: "row", def_es: "una fila: una línea de objetos de lado a lado", example_es: "Hay 4 galletas en cada fila." },
    { term: "column", def_es: "una columna: una línea de objetos de arriba hacia abajo", example_es: "Hay 3 galletas en cada columna." },
    { term: "equal groups", def_es: "grupos iguales: grupos que tienen la misma cantidad de objetos cada uno", example_es: "Hay 3 platos con 5 uvas en cada uno: son grupos iguales." },
    { term: "side", def_es: "un lado: un borde recto de una figura plana", example_es: "Un triángulo tiene 3 lados." },
    { term: "angle", def_es: "un ángulo: la esquina donde se juntan dos lados", example_es: "Un cuadrado tiene cuatro ángulos." },
    { term: "polygon", def_es: "un polígono: una figura plana y cerrada hecha de lados rectos", example_es: "Un pentágono es un polígono." },
    { term: "quadrilateral", def_es: "un cuadrilátero: una figura plana con cuatro lados rectos y cuatro ángulos", example_es: "Un rectángulo es un cuadrilátero." },
    { term: "hexagon", def_es: "un hexágono: una figura plana con seis lados rectos y seis ángulos", example_es: "Una celda de panal de abejas es un hexágono." },
    { term: "partition", def_es: "dividir una figura en partes iguales", example_es: "Voy a dividir el rectángulo en cuatro partes iguales." },
  ],
  talk: [
    { en: "How many rows? How many in each row? How many in all?", es: "¿Cuántas filas? ¿Cuántos hay en cada fila? ¿Cuántos hay en total?" },
    { en: "Can you write a number sentence for this array?", es: "¿Puedes escribir una oración numérica para este arreglo?" },
    { en: "What shape is this? How many sides and angles does it have?", es: "¿Qué figura es esta? ¿Cuántos lados y ángulos tiene?" },
    { en: "What is it not? How do you know?", es: "¿Qué no es? ¿Cómo lo sabes?" },
    { en: "Where do you see rows, columns, or shapes at home?", es: "¿Dónde ves filas, columnas o figuras en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Muffin Tin Array", es: "Arreglo en el molde de panecillos" },
      minutes: 10,
      materials: { en: "A muffin tin or an egg carton, and beans, coins, or small snacks", es: "Un molde de panecillos o un cartón de huevos, y frijoles, monedas o meriendas pequeñas" },
      steps: {
        en: [
          "Fill the tin so each row has the same number of items.",
          "Count the rows. Count how many are in each row.",
          "Add: 4 plus 4 plus 4 equals 12. Say how many in all.",
          "Fill a different way. Ask: how are the rows and columns different now?",
        ],
        es: [
          "Llenen el molde de modo que cada fila tenga la misma cantidad.",
          "Cuenten las filas. Cuenten cuántos hay en cada fila.",
          "Sumen: 4 más 4 más 4 es igual a 12. Digan cuántos hay en total.",
          "Llénenlo de otra manera. Pregunten: ¿en qué cambiaron ahora las filas y las columnas?",
        ],
      },
    },
    {
      title: { en: "Equal Groups at Dinner", es: "Grupos iguales en la cena" },
      minutes: 10,
      materials: { en: "Paper plates or bowls, and snacks like grapes or crackers", es: "Platos de papel o tazones, y meriendas como uvas o galletas" },
      steps: {
        en: [
          "Put 3 plates on the table. Put 5 snacks on each plate.",
          "Ask: how many plates? How many on each plate? How many in all?",
          "Write: 5 + 5 + 5 = 15.",
          "Make a new group: 4 plates with 3 on each. Write the equation.",
        ],
        es: [
          "Pongan 3 platos en la mesa. Pongan 5 meriendas en cada plato.",
          "Pregunten: ¿cuántos platos? ¿Cuántas hay en cada plato? ¿Cuántas hay en total?",
          "Escriban: 5 + 5 + 5 = 15.",
          "Hagan un grupo nuevo: 4 platos con 3 en cada uno. Escriban la ecuación.",
        ],
      },
    },
    {
      title: { en: "Shape Walk", es: "Paseo de figuras" },
      minutes: 15,
      materials: { en: "A walk around the block, paper, a pencil", es: "Un paseo por la cuadra, papel y un lápiz" },
      steps: {
        en: [
          "Look for shapes on signs, doors, windows, and buildings.",
          "Draw one. Count its sides and angles together.",
          "Name it: triangle (3), quadrilateral (4), hexagon (6).",
          "Ask: is a circle a polygon? Why not? It has no straight sides.",
        ],
        es: [
          "Busquen figuras en letreros, puertas, ventanas y edificios.",
          "Dibujen una. Cuenten juntos sus lados y ángulos.",
          "Nómbrenla: triángulo (3), cuadrilátero (4), hexágono (6).",
          "Pregunten: ¿un círculo es un polígono? ¿Por qué no? No tiene lados rectos.",
        ],
      },
    },
    {
      title: { en: "Partition a Snack", es: "Dividir una merienda" },
      minutes: 10,
      materials: { en: "A rectangular cracker, sandwich, or paper, and a safe knife or scissors", es: "Una galleta rectangular, un sándwich o un papel, y un cuchillo seguro o tijeras" },
      steps: {
        en: [
          "Say: let's share this equally. How many people are sharing?",
          "Cut the shape into that many equal parts.",
          "Ask: are the parts the same size? How do you know?",
          "Try another way to cut it into equal parts. Is it still the same amount?",
        ],
        es: [
          "Digan: vamos a compartir esto en partes iguales. ¿Cuántas personas lo comparten?",
          "Corten la figura en esa cantidad de partes iguales.",
          "Pregunten: ¿las partes son del mismo tamaño? ¿Cómo lo saben?",
          "Prueben otra manera de cortarlo en partes iguales. ¿Sigue siendo la misma cantidad?",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [shape] is a polygon that has [number] sides and [number] angles.", es: "Un [figura] es un polígono que tiene [número] lados y [número] ángulos." },
    { en: "There are [number] rows with [number] in each row, so [number] + [number] + [number] = [number].", es: "Hay [número] filas con [número] en cada fila, así que [número] + [número] + [número] = [número]." },
    { en: "A [circle] is not a polygon because [reason].", es: "Un [círculo] no es un polígono porque [razón]." },
    { en: "I partitioned the [shape] into [number] equal parts.", es: "Dividí el [figura] en [número] partes iguales." },
  ],
  help: {
    en: [
      "Look for rows and columns around the house: tiles, egg cartons, window panes.",
      "Ask \"how many rows? How many in each row?\" and let your child lead.",
      "Ask \"what is it? What is it not?\" for shapes. Listen to both answers.",
      "Use Spanish or English. Many shape names are almost the same in both languages.",
    ],
    es: [
      "Busquen filas y columnas por la casa: baldosas, cartones de huevos, vidrios de ventanas.",
      "Pregunten \"¿cuántas filas? ¿Cuántos hay en cada fila?\" y dejen que su hijo o hija lleve la guía.",
      "Pregunten \"¿qué es? ¿Qué no es?\" sobre las figuras. Escuchen las dos respuestas.",
      "Usen español o inglés. Muchos nombres de figuras son casi iguales en los dos idiomas.",
    ],
  },
  home_language: {
    en: "Name shapes in Spanish, then in English. \"Polígono\" and \"polygon,\" \"hexágono\" and \"hexagon,\" \"cuadrilátero\" and \"quadrilateral,\" and \"ángulo\" and \"angle\" are twins. Count the sides in both languages: \"tres lados, three sides.\"",
    es: "Nombren las figuras en español y luego en inglés. \"Polígono\" y \"polygon\", \"hexágono\" y \"hexagon\", \"cuadrilátero\" y \"quadrilateral\", y \"ángulo\" y \"angle\" son gemelas. Cuenten los lados en los dos idiomas: \"tres lados, three sides\".",
  },
  celebrate: {
    en: "You will know it is working when your child arranges objects in rows, writes an equation for them, and names a shape by its sides and angles, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija ponga objetos en filas, escriba una ecuación para ellos y nombre una figura por sus lados y ángulos, en el idioma que quiera.",
  },
};
