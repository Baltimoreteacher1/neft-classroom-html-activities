// BCPSS Family Guide (EN/ES) — g6-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on negative numbers, absolute value and the coordinate plane. Vocabulary order matches ../units/g6-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning about numbers below zero, like temperatures in winter or a bank account that owes money. They also learn how to find any point on a map-like grid using two numbers. It matters when you read a thermometer, track money, read a map, or tell someone where something is.",
    es: "Su hijo o hija está aprendiendo sobre los números menores que cero, como las temperaturas en invierno o una cuenta de banco con deuda. También aprende a ubicar cualquier punto en una cuadrícula, como en un mapa, usando dos números. Sirve cuando se lee un termómetro, se lleva el control del dinero, se lee un mapa o se explica dónde está algo.",
  },
  goals: {
    en: [
      "I can place negative numbers and opposites on a number line.",
      "I can find the absolute value of a number and compare numbers.",
      "I can plot a point on the coordinate plane and tell which quadrant it is in.",
    ],
    es: [
      "Puedo ubicar números negativos y opuestos en una recta numérica.",
      "Puedo hallar el valor absoluto de un número y comparar números.",
      "Puedo ubicar un punto en el plano de coordenadas y decir en qué cuadrante está.",
    ],
  },
  vocab: [
    { term: "integer", def_es: "un número entero, su opuesto o el cero; no tiene partes decimales ni fracciones", example_es: "−3, 0 y 14 son números enteros." },
    { term: "rational number", def_es: "cualquier número que se puede escribir como una fracción, como 1/2 o −0.75", example_es: "La fracción −3/4 es un número racional." },
    { term: "negative number", def_es: "un número menor que cero, como la temperatura cuando hace mucho frío", example_es: "Un buzo a 12 pies bajo la superficie está en el número negativo −12." },
    { term: "opposite", def_es: "el número que está a la misma distancia del cero, pero del otro lado", example_es: "El opuesto de 6 es −6." },
    { term: "absolute value", def_es: "qué tan lejos está un número del cero, sin importar hacia dónde", example_es: "El valor absoluto de −9 es 9." },
    { term: "number line", def_es: "una línea recta con marcas a la misma distancia que muestra los números en orden", example_es: "En la recta numérica, −2 queda a la izquierda de 3." },
    { term: "coordinate plane", def_es: "una cuadrícula plana hecha con dos rectas numéricas que se cruzan en ángulo recto, como un mapa", example_es: "Ubicamos cada punto en el plano de coordenadas." },
    { term: "origin", def_es: "el punto donde se cruzan los dos ejes; se escribe (0, 0)", example_es: "El origen es el punto de partida para ubicar puntos." },
    { term: "ordered pair", def_es: "dos números en un orden fijo que nombran un punto, como (3, −2)", example_es: "(3, −2) es un par ordenado." },
    { term: "quadrant", def_es: "una de las cuatro regiones que se forman cuando se cruzan los ejes", example_es: "El punto (−2, 5) está en el Cuadrante II." },
  ],
  talk: [
    { en: "Where have you seen a number below zero in real life?", es: "¿Dónde has visto un número menor que cero en la vida real?" },
    { en: "What is the opposite of this number? How far from zero is each one?", es: "¿Cuál es el opuesto de este número? ¿Qué tan lejos del cero está cada uno?" },
    { en: "Which number is greater, and how do you know?", es: "¿Cuál número es mayor y cómo lo sabes?" },
    { en: "Which number do you go along first in an ordered pair: across or up?", es: "En un par ordenado, ¿qué número se recorre primero: hacia el lado o hacia arriba?" },
    { en: "What is the same and what is different about these two points?", es: "¿Qué es igual y qué es diferente en estos dos puntos?" },
  ],
  try_at_home: [
    {
      title: { en: "Thermometer Walk", es: "Paseo con el termómetro" },
      minutes: 10,
      materials: { en: "A weather app or newspaper with temperatures, paper and pencil", es: "Una aplicación del clima o un periódico con temperaturas, papel y lápiz" },
      steps: {
        en: [
          "Look at the high and low temperatures for a cold city, like Chicago or Minneapolis, in winter.",
          "Ask your child to draw a vertical number line and mark each temperature on it.",
          "Ask: which is colder, −5 or −10? How do you know from the number line?",
          "Ask: how many degrees apart are they?",
        ],
        es: [
          "Miren las temperaturas máxima y mínima de una ciudad fría, como Chicago o Minneapolis, en invierno.",
          "Pídanle a su hijo o hija que dibuje una recta numérica vertical y marque cada temperatura.",
          "Pregunten: ¿cuál es más fría, −5 o −10? ¿Cómo lo sabes con la recta numérica?",
          "Pregunten: ¿cuántos grados hay entre las dos?",
        ],
      },
    },
    {
      title: { en: "Money In, Money Out", es: "Dinero que entra y sale" },
      minutes: 15,
      materials: { en: "Paper and pencil, a few coins or pretend bills", es: "Papel y lápiz, unas monedas o billetes de juguete" },
      steps: {
        en: [
          "Start with $0. Tell a story: you earn $10, spend $15, find $3.",
          "Let your child write each step as a positive or negative number: +10, −15, +3.",
          "Move a marker on a number line for each step.",
          "Ask: where did you end? Do you owe money or have money? What is the absolute value, the distance from zero?",
        ],
        es: [
          "Empiecen con $0. Cuenten una historia: ganas $10, gastas $15, encuentras $3.",
          "Dejen que su hijo o hija escriba cada paso como número positivo o negativo: +10, −15, +3.",
          "Muevan una ficha en la recta numérica con cada paso.",
          "Pregunten: ¿dónde terminaste? ¿Debes dinero o tienes dinero? ¿Cuál es el valor absoluto, la distancia al cero?",
        ],
      },
    },
    {
      title: { en: "Floor Grid Treasure Hunt", es: "Búsqueda del tesoro en el piso" },
      minutes: 20,
      materials: { en: "Floor tiles or tape for a grid, a small object, two sheets of paper labeled x and y", es: "Baldosas del piso o cinta para hacer una cuadrícula, un objeto pequeño, dos hojas con las letras x y y" },
      steps: {
        en: [
          "Pick one tile or tape crossing as the origin, (0, 0).",
          "Hide a small object. Give an ordered pair as a clue, like (3, 2): 3 across, then 2 up.",
          "Let your child walk to find it, then hide something for you with a pair like (−2, 1).",
          "Ask: which quadrant is that? What is the same and different about (3, 2) and (−3, 2)?",
        ],
        es: [
          "Elijan una baldosa o un cruce de cintas como el origen, (0, 0).",
          "Escondan un objeto pequeño. Den un par ordenado como pista, por ejemplo (3, 2): 3 hacia el lado y luego 2 hacia arriba.",
          "Dejen que su hijo o hija camine para encontrarlo y luego escondan algo para ustedes con un par como (−2, 1).",
          "Pregunten: ¿en qué cuadrante está? ¿Qué es igual y qué es diferente entre (3, 2) y (−3, 2)?",
        ],
      },
    },
    {
      title: { en: "Neighborhood Map", es: "Mapa del vecindario" },
      minutes: 15,
      materials: { en: "Graph paper or plain paper with lines drawn, pencil", es: "Papel cuadriculado o papel liso con líneas dibujadas, lápiz" },
      steps: {
        en: [
          "Draw two number lines that cross in the middle. Call the crossing home, (0, 0).",
          "Mark places you know: the store at (4, 0), school at (−3, 2), the park at (2, −3).",
          "Ask: which places are east of home, which are west? Which quadrant is each in?",
          "Ask: which place is farthest from home? How can you tell?",
        ],
        es: [
          "Dibujen dos rectas numéricas que se crucen en el centro. Llamen casa al cruce, (0, 0).",
          "Marquen lugares que conocen: la tienda en (4, 0), la escuela en (−3, 2), el parque en (2, −3).",
          "Pregunten: ¿qué lugares están al este de casa y cuáles al oeste? ¿En qué cuadrante está cada uno?",
          "Pregunten: ¿qué lugar está más lejos de casa? ¿Cómo lo sabes?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both [−3] and [3] are [the same distance from zero], whereas [−3] is [less than 3].", es: "Tanto [−3] como [3] están [a la misma distancia del cero], mientras que [−3] es [menor que 3]." },
    { en: "[−7] is less than [−2] because it lies farther left on the number line.", es: "[−7] es menor que [−2] porque está más a la izquierda en la recta numérica." },
    { en: "The point ([−2], [5]) is in Quadrant [II] because [x is negative and y is positive].", es: "El punto ([−2], [5]) está en el Cuadrante [II] porque [x es negativo y y es positivo]." },
    { en: "The absolute value of [−9] is [9] because it is [9] units from zero.", es: "El valor absoluto de [−9] es [9] porque está a [9] unidades del cero." },
  ],
  help: {
    en: [
      "You do not need to be an expert. Ask your child to draw a number line and show you where each number goes.",
      "Use real examples: temperatures, money owed, floors below ground in a building.",
      "Ask \"what is the same and what is different?\" when comparing two numbers or points.",
      "Let mistakes happen. Ask \"which way is left, and which way is up?\" and let your child fix it.",
    ],
    es: [
      "No necesitan ser expertos. Pídanle a su hijo o hija que dibuje una recta numérica y les muestre dónde va cada número.",
      "Usen ejemplos reales: temperaturas, dinero que se debe, pisos bajo tierra en un edificio.",
      "Pregunten \"¿qué es igual y qué es diferente?\" cuando comparen dos números o dos puntos.",
      "Dejen que se equivoque. Pregunten \"¿hacia dónde está la izquierda y hacia dónde está arriba?\" y que lo corrija.",
    ],
  },
  home_language: {
    en: "Many words here sound alike in Spanish: integer (entero), rational (racional), negative (negativo), origin (origen), quadrant (cuadrante). Ask your child to teach you each pair. In Spanish, say \"menos tres\" for −3 and \"el opuesto de seis\", then switch to English.",
    es: "Muchas palabras suenan parecido en inglés: entero (integer), racional (rational), negativo (negative), origen (origin), cuadrante (quadrant). Pídanle a su hijo o hija que les enseñe cada pareja. Digan en español \"menos tres\" para −3 y \"el opuesto de seis\", y después pasen al inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child can read a temperature below zero, put it on a number line, and tell you in any language how it compares to another number.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda leer una temperatura bajo cero, ubicarla en una recta numérica y contarles, en el idioma que quiera, cómo se compara con otro número.",
  },
};
