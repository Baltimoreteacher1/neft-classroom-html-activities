// BCPSS Family Guide (EN/ES) — g3-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on equal groups, arrays, multiplication and division. Vocabulary order matches ../units/g3-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to multiply and divide by thinking about equal groups and neat rows and columns, like the cups in a muffin tin. It matters every time someone shares snacks fairly, sets out plates, or counts items at the store. Your child will explain each answer and check it, in any language.",
    es: "Su hijo o hija está aprendiendo a multiplicar y dividir pensando en grupos iguales y en filas y columnas ordenadas, como los huecos de un molde de panecillos. Sirve cada vez que alguien reparte meriendas con justicia, pone platos en la mesa o cuenta productos en la tienda. Su hijo o hija explicará cada respuesta y la comprobará, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can make equal groups and an array to show a multiplication fact.",
      "I can share a total into equal groups to divide.",
      "I can explain and check my answer with first, then, so, and because.",
    ],
    es: [
      "Puedo hacer grupos iguales y un arreglo para mostrar una multiplicación.",
      "Puedo repartir un total en grupos iguales para dividir.",
      "Puedo explicar y comprobar mi respuesta con primero, luego, entonces y porque.",
    ],
  },
  vocab: [
    { term: "equal groups", def_es: "conjuntos que tienen la misma cantidad de cosas, como tres platos con cuatro galletas cada uno", example_es: "Puse 4 galletas en cada uno de 3 platos, así que hice 3 grupos iguales." },
    { term: "array", def_es: "objetos puestos en filas y columnas ordenadas, como los huevos en una caja de huevos", example_es: "La caja de huevos es un arreglo de 2 filas y 6 columnas." },
    { term: "row", def_es: "una línea de objetos que va de lado a lado, como una fila de asientos", example_es: "En esta fila hay 5 puntos, y hay 3 filas." },
    { term: "column", def_es: "una línea de objetos que va de arriba hacia abajo, como una columna de un edificio", example_es: "Cada columna de la caja de huevos tiene 2 huevos." },
    { term: "factor", def_es: "un número que se multiplica por otro; es una de las partes de la multiplicación", example_es: "En 3 × 4 = 12, los factores son 3 y 4." },
    { term: "product", def_es: "la respuesta que se obtiene al multiplicar", example_es: "El producto de 6 × 4 es 24." },
    { term: "multiply", def_es: "hallar cuántos hay en total cuando tienes grupos iguales", example_es: "Multiplico 5 × 3 para saber cuántas manzanas hay en 5 bolsas de 3." },
    { term: "divide", def_es: "repartir un total en grupos iguales, o hallar cuántos hay en cada grupo", example_es: "Divido 12 pegatinas entre 3 bolsas y a cada bolsa le tocan 4." },
    { term: "quotient", def_es: "la respuesta que se obtiene al dividir", example_es: "El cociente de 12 ÷ 3 es 4." },
  ],
  talk: [
    { en: "Show me the groups you made today. How many groups? How many in each?", es: "Muéstrame los grupos que hiciste hoy. ¿Cuántos grupos? ¿Cuántos hay en cada uno?" },
    { en: "How do you know the groups are equal?", es: "¿Cómo sabes que los grupos son iguales?" },
    { en: "Can you show me the same number in rows and columns?", es: "¿Puedes mostrarme el mismo número en filas y columnas?" },
    { en: "How can multiplying help you check a division answer?", es: "¿Cómo te ayuda multiplicar a comprobar una división?" },
    { en: "Where do we share things equally at home?", es: "¿En qué momentos repartimos cosas por igual en casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Egg Carton Array", es: "Arreglo en la caja de huevos" },
      minutes: 10,
      materials: { en: "An empty egg carton, 12 beans or coins", es: "Una caja de huevos vacía y 12 frijoles o monedas" },
      steps: {
        en: [
          "Put one bean in each cup of the carton. Count them together in any language.",
          "Ask your child: how many rows? How many columns? How many beans in each row?",
          "Ask: what multiplication fact does this show? (2 rows of 6 is 2 × 6 = 12.)",
          "Turn the carton sideways. Ask: what changed? What stayed the same?",
        ],
        es: [
          "Pongan un frijol en cada hueco de la caja. Cuéntenlos juntos en el idioma que quieran.",
          "Pregunten a su hijo o hija: ¿cuántas filas? ¿Cuántas columnas? ¿Cuántos frijoles hay en cada fila?",
          "Pregunten: ¿qué multiplicación muestra esto? (2 filas de 6 es 2 × 6 = 12.)",
          "Giren la caja de lado. Pregunten: ¿qué cambió? ¿Qué se quedó igual?",
        ],
      },
    },
    {
      title: { en: "Fair Share Snack", es: "Merienda para repartir" },
      minutes: 10,
      materials: { en: "12 crackers or grapes, 3 plates or napkins", es: "12 galletas o uvas y 3 platos o servilletas" },
      steps: {
        en: [
          "Say: we have 12 crackers and 3 plates. Let's share them so every plate has the same.",
          "Your child deals the crackers one at a time, like dealing cards, until none are left.",
          "Count each plate. Ask: how many on each plate? How do you know it is fair?",
          "Check with multiplication: 3 plates times 4 crackers is 12. Then enjoy the snack!",
        ],
        es: [
          "Digan: tenemos 12 galletas y 3 platos. Vamos a repartirlas para que cada plato tenga lo mismo.",
          "Su hijo o hija reparte las galletas de una en una, como si repartiera cartas, hasta que no quede ninguna.",
          "Cuenten cada plato. Pregunten: ¿cuántas hay en cada plato? ¿Cómo sabes que es justo?",
          "Comprueben con multiplicación: 3 platos por 4 galletas son 12. ¡Luego disfruten la merienda!",
        ],
      },
    },
    {
      title: { en: "Sock Pairs", es: "Pares de calcetines" },
      minutes: 10,
      materials: { en: "Clean socks (at least 5 pairs) from the laundry", es: "Calcetines limpios (al menos 5 pares) de la ropa lavada" },
      steps: {
        en: [
          "Match the socks into pairs. Each pair is one group of 2.",
          "Line up 5 pairs. Ask: how many groups? How many socks in each group?",
          "Ask: how many socks in all? Skip count by 2s together: 2, 4, 6, 8, 10.",
          "Write the fact on paper: 5 × 2 = 10. Ask: what if we had 6 pairs?",
        ],
        es: [
          "Junten los calcetines en pares. Cada par es un grupo de 2.",
          "Pongan 5 pares en línea. Pregunten: ¿cuántos grupos? ¿Cuántos calcetines hay en cada grupo?",
          "Pregunten: ¿cuántos calcetines hay en total? Cuenten de 2 en 2 juntos: 2, 4, 6, 8, 10.",
          "Escriban la operación en un papel: 5 × 2 = 10. Pregunten: ¿y si tuviéramos 6 pares?",
        ],
      },
    },
    {
      title: { en: "Muffin Tin Story", es: "El cuento del molde de panecillos" },
      minutes: 15,
      materials: { en: "A muffin tin or a sheet of paper, 24 small items (coins, buttons)", es: "Un molde de panecillos o una hoja de papel y 24 objetos pequeños (monedas, botones)" },
      steps: {
        en: [
          "Say: a baker has 24 muffins and puts 6 in each box. How many boxes?",
          "Your child makes groups of 6 with the items and counts the groups.",
          "Ask: how can we check? (4 boxes × 6 muffins = 24.)",
          "Switch the story: 24 muffins into 4 boxes. How many in each box? Ask: what stayed the same?",
        ],
        es: [
          "Digan: un panadero tiene 24 panecillos y pone 6 en cada caja. ¿Cuántas cajas necesita?",
          "Su hijo o hija hace grupos de 6 con los objetos y cuenta los grupos.",
          "Pregunten: ¿cómo lo comprobamos? (4 cajas × 6 panecillos = 24.)",
          "Cambien el cuento: 24 panecillos en 4 cajas. ¿Cuántos van en cada caja? Pregunten: ¿qué se quedó igual?",
        ],
      },
    },
  ],
  say_it: [
    { en: "There are [number] groups, and each group has [number] [objects].", es: "Hay [número] grupos, y cada grupo tiene [número] [objetos]." },
    { en: "[number] × [number] = [number], so the product is [number].", es: "[número] × [número] = [número], entonces el producto es [número]." },
    { en: "I divided [total] by [number], so each group has [number].", es: "Dividí [total] entre [número], entonces cada grupo tiene [número]." },
    { en: "My answer is right because ___.", es: "Mi respuesta es correcta porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Say \"show me\" and \"how do you know?\" in any language. Explaining out loud helps the idea stick.",
      "Use real things: crackers, socks, coins. Moving objects into groups beats memorizing.",
      "If an answer is wrong, ask, \"What could you try to check it?\" before you say anything else.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma. Explicar en voz alta ayuda a que la idea se quede.",
      "Usen cosas de verdad: galletas, calcetines, monedas. Mover objetos para hacer grupos funciona mejor que memorizar.",
      "Si una respuesta no es correcta, pregunten: \"¿Qué podrías hacer para comprobarla?\" antes de decir otra cosa.",
    ],
  },
  home_language: {
    en: "Tell a sharing story in Spanish first: \"Tengo 12 galletas y 3 platos.\" Then find the English words together. Factor, product, multiply, and divide sound almost the same in both languages (factor, producto, multiplicar, dividir), so your child already knows them.",
    es: "Cuenten primero un cuento de reparto en español: \"Tengo 12 galletas y 3 platos\". Después busquen juntos las palabras en inglés. Factor, producto, multiplicar y dividir suenan casi igual en los dos idiomas (factor, product, multiply, divide), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child can share any small pile into equal groups and tell you, in any language, how to check the answer.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda repartir cualquier montón pequeño en grupos iguales y contarles, en el idioma que quiera, cómo comprobar la respuesta.",
  },
};
