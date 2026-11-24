// BCPSS Family Guide (EN/ES) — g7-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on proportional relationships. Vocabulary order matches ../units/g7-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to tell when two amounts always change together at the same rate, like the price of tickets or the pay for hours worked. This is called a proportional relationship. It matters when you scale a recipe, compare unit prices, or figure out pay: if the price for one stays the same, the total grows in a steady way.",
    es: "Su hijo o hija está aprendiendo a reconocer cuándo dos cantidades siempre cambian juntas al mismo ritmo, como el precio de las entradas o el pago por horas trabajadas. Esto se llama relación proporcional. Sirve para ajustar una receta, comparar precios por unidad o calcular un pago: si el precio de uno no cambia, el total crece de manera constante.",
  },
  goals: {
    en: [
      "I can test a table, a graph or an equation to see if it is proportional.",
      "I can find the constant of proportionality and say what it means.",
      "I can prove my claim with numbers using because, so and since.",
    ],
    es: [
      "Puedo revisar una tabla, una gráfica o una ecuación para ver si es proporcional.",
      "Puedo hallar la constante de proporcionalidad y decir qué significa.",
      "Puedo probar mi afirmación con números usando porque, entonces y ya que.",
    ],
  },
  vocab: [
    { term: "ratio", def_es: "una comparación de dos cantidades, como 4 millas en 2 horas", example_es: "La razón de tazas de harina a tazas de azúcar es de 3 a 1." },
    { term: "unit rate", def_es: "una tasa que dice cuánto hay por exactamente una unidad de algo", example_es: "A $3 por 2 libras, la tasa unitaria es de $1.50 por libra." },
    { term: "equivalent ratios", def_es: "razones que describen la misma relación aunque los números se vean diferentes", example_es: "Las razones 1 : 4 y 3 : 12 son razones equivalentes." },
    { term: "proportional", def_es: "se dice de dos cantidades que siempre tienen la misma razón", example_es: "El costo de las entradas es proporcional al número de entradas." },
    { term: "constant of proportionality", def_es: "el número por el que se multiplica x para obtener y en una relación proporcional; se escribe k", example_es: "En y = 5x, la constante de proporcionalidad es 5." },
    { term: "origin", def_es: "el punto (0, 0) donde se cruzan el eje x y el eje y", example_es: "Una gráfica proporcional es una recta que pasa por el origen." },
    { term: "ordered pair", def_es: "dos números en un orden fijo, como (3, 12), que nombran un punto en una gráfica", example_es: "El par ordenado (2, 10) quiere decir que 2 artículos cuestan 10 dólares." },
    { term: "constant", def_es: "un número que se queda igual y nunca cambia", example_es: "La constante en y = 4x es 4 y es la misma en todas las filas." },
    { term: "relationship", def_es: "la manera en que dos cantidades están conectadas y cambian juntas", example_es: "La relación entre las horas trabajadas y el pago se puede mostrar en una tabla." },
  ],
  talk: [
    { en: "If we double one amount, what happens to the other? Does it always work?", es: "Si duplicamos una cantidad, ¿qué pasa con la otra? ¿Siempre funciona?" },
    { en: "What is the price (or the amount) for exactly one? How did you find it?", es: "¿Cuál es el precio (o la cantidad) por exactamente uno? ¿Cómo lo hallaste?" },
    { en: "How can you tell from a table whether it is proportional?", es: "¿Cómo puedes saber con una tabla si es proporcional?" },
    { en: "What would the graph look like? Does it go through (0, 0)? Why does that make sense?", es: "¿Cómo se vería la gráfica? ¿Pasa por (0, 0)? ¿Por qué tiene sentido?" },
    { en: "Can you find a situation that is NOT proportional?", es: "¿Puedes encontrar una situación que NO sea proporcional?" },
  ],
  try_at_home: [
    {
      title: { en: "Price per Pound Table", es: "Tabla del precio por libra" },
      minutes: 15,
      materials: { en: "A grocery receipt or flyer with a price per pound, paper and pencil", es: "Un recibo o volante de ofertas con un precio por libra, papel y lápiz" },
      steps: {
        en: [
          "Pick a fruit or vegetable priced per pound, like apples at $2 per pound.",
          "Make a table: 1 pound costs ___, 2 pounds cost ___, 3 pounds cost ___, 5 pounds cost ___.",
          "Ask: what do you get when you divide the cost by the pounds in each row? Is it always the same?",
          "Say it: \"The constant of proportionality is 2 dollars per pound.\"",
        ],
        es: [
          "Elijan una fruta o verdura con precio por libra, como manzanas a $2 por libra.",
          "Hagan una tabla: 1 libra cuesta ___, 2 libras cuestan ___, 3 libras cuestan ___, 5 libras cuestan ___.",
          "Pregunten: ¿qué resulta al dividir el costo entre las libras en cada fila? ¿Siempre es lo mismo?",
          "Díganlo: \"La constante de proporcionalidad es 2 dólares por libra\".",
        ],
      },
    },
    {
      title: { en: "Proportional or Not?", es: "¿Proporcional o no?" },
      minutes: 15,
      materials: { en: "Paper and pencil, two price lists such as a gym or streaming plan and a snack shop", es: "Papel y lápiz, dos listas de precios, como un plan de gimnasio o de streaming y una tienda de bocadillos" },
      steps: {
        en: [
          "Pick one thing priced per item (snacks at $3 each) and one with a fee (a gym with $10 sign-up plus $5 per visit).",
          "Make a table for 1, 2, 3 and 4 items or visits.",
          "Divide cost by number in each row. Which one stays the same? Which one changes?",
          "Ask: which table is proportional? How do you know?",
        ],
        es: [
          "Elijan algo con precio por artículo (bocadillos a $3 cada uno) y algo con una cuota (un gimnasio con $10 de inscripción más $5 por visita).",
          "Hagan una tabla para 1, 2, 3 y 4 artículos o visitas.",
          "Dividan el costo entre el número en cada fila. ¿Cuál se queda igual? ¿Cuál cambia?",
          "Pregunten: ¿qué tabla es proporcional? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "Walk the Graph", es: "Caminar la gráfica" },
      minutes: 15,
      materials: { en: "Graph paper or paper with a grid drawn, a ruler, a pencil", es: "Papel cuadriculado o papel con una cuadrícula dibujada, una regla, un lápiz" },
      steps: {
        en: [
          "Use the apple table. Write each row as an ordered pair: (1, 2), (2, 4), (3, 6).",
          "Plot the points. Ask: what shape do the points make?",
          "Use a ruler to extend the line backward. Does it pass through the origin (0, 0)?",
          "Ask: why does it make sense that 0 pounds costs 0 dollars?",
        ],
        es: [
          "Usen la tabla de las manzanas. Escriban cada fila como par ordenado: (1, 2), (2, 4), (3, 6).",
          "Ubiquen los puntos. Pregunten: ¿qué forma hacen los puntos?",
          "Con la regla, prolonguen la línea hacia atrás. ¿Pasa por el origen (0, 0)?",
          "Pregunten: ¿por qué tiene sentido que 0 libras cuesten 0 dólares?",
        ],
      },
    },
    {
      title: { en: "Bake It Bigger", es: "Hornear en grande" },
      minutes: 20,
      materials: { en: "A simple recipe, measuring cups and spoons, paper and pencil", es: "Una receta sencilla, tazas y cucharas de medir, papel y lápiz" },
      steps: {
        en: [
          "Choose a recipe that makes 4 servings, and write the amount of one ingredient.",
          "Ask your child to find the amount for 1 serving, then for 6 and for 10 servings.",
          "Write an equation with the constant: amount = k × servings.",
          "Cook a bigger batch together and talk about how you scaled each ingredient.",
        ],
        es: [
          "Elijan una receta que rinde 4 porciones y anoten la cantidad de un ingrediente.",
          "Pídanle a su hijo o hija que halle la cantidad para 1 porción y luego para 6 y para 10 porciones.",
          "Escriban una ecuación con la constante: cantidad = k × porciones.",
          "Cocinen juntos una tanda más grande y conversen sobre cómo ajustaron cada ingrediente.",
        ],
      },
    },
  ],
  say_it: [
    { en: "The ratio of [cost] to [pounds] is always [2], so the relationship is proportional.", es: "La razón de [costo] a [libras] siempre es [2], entonces la relación es proporcional." },
    { en: "The graph is a straight line through the origin, so [it is proportional].", es: "La gráfica es una recta que pasa por el origen, entonces [es proporcional]." },
    { en: "The constant of proportionality is [2] [dollars] per [pound].", es: "La constante de proporcionalidad es [2] [dólares] por [libra]." },
    { en: "I know it is not proportional since [the ratio changes in each row].", es: "Sé que no es proporcional ya que [la razón cambia en cada fila]." },
  ],
  help: {
    en: [
      "You do not need to know the vocabulary. Ask your child to show you a table or a graph and explain it.",
      "Use real prices: groceries, bus fares, phone minutes. Ask \"what does it cost for one?\"",
      "Ask \"how do you know?\" in any language. A number from the table is the best proof.",
      "When an answer is wrong, ask \"which row would you check?\"",
    ],
    es: [
      "No necesitan saber el vocabulario. Pídanle a su hijo o hija que les muestre una tabla o una gráfica y la explique.",
      "Usen precios reales: supermercado, pasajes de autobús, minutos del teléfono. Pregunten \"¿cuánto cuesta uno?\".",
      "Pregunten \"¿cómo lo sabes?\" en cualquier idioma. Un número de la tabla es la mejor prueba.",
      "Si una respuesta no es correcta, pregunten \"¿qué fila revisarías?\".",
    ],
  },
  home_language: {
    en: "Say the story in Spanish first: \"cada libra cuesta 2 dólares\". Many words are close in both languages: proportional (proporcional), constant (constante), relationship (relación), origin (origen). Be careful with \"razón\": it means ratio in math, but also reason in everyday talk.",
    es: "Cuenten primero la historia en español: \"cada libra cuesta 2 dólares\". Muchas palabras se parecen en los dos idiomas: proporcional (proportional), constante (constant), relación (relationship), origen (origin). Cuidado con \"razón\": en matemáticas es la comparación de dos cantidades, pero en la conversación diaria también quiere decir motivo.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a price list or a recipe and tell you, in any language, whether the amounts are proportional and what the number for one is.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar una lista de precios o una receta y decirles, en el idioma que quiera, si las cantidades son proporcionales y cuál es el número para uno.",
  },
};
