// BCPSS Family Guide (EN/ES) — g4-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on equivalent fractions and comparing fractions. Vocabulary order matches ../units/g4-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to make equivalent fractions and to compare fractions using friendly benchmarks like 0, 1/2, and 1. It matters when someone halves a recipe, compares two deals, or shares a pizza fairly. Your child will compare two fractions and prove which is greater, in any language.",
    es: "Su hijo o hija está aprendiendo a hacer fracciones equivalentes y a comparar fracciones con referencias fáciles como 0, 1/2 y 1. Sirve cuando alguien reduce una receta a la mitad, compara dos ofertas o reparte una pizza con justicia. Su hijo o hija comparará dos fracciones y comprobará cuál es mayor, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can make equivalent fractions by multiplying the top and bottom by the same number.",
      "I can compare fractions using 1/2 and other benchmarks.",
      "I can compare with both, whereas, and because.",
    ],
    es: [
      "Puedo hacer fracciones equivalentes multiplicando el número de arriba y el de abajo por el mismo número.",
      "Puedo comparar fracciones usando 1/2 y otras referencias.",
      "Puedo comparar con ambos, mientras que y porque.",
    ],
  },
  vocab: [
    { term: "equivalent fraction", def_es: "otra manera de escribir una fracción para que tenga el mismo valor", example_es: "4/8 es una fracción equivalente a 1/2." },
    { term: "numerator", def_es: "el número de arriba en una fracción; dice cuántas partes tienes", example_es: "En 3/8, el numerador es 3." },
    { term: "denominator", def_es: "el número de abajo en una fracción; dice cuántas partes iguales forman un entero", example_es: "En 3/8, el denominador es 8." },
    { term: "benchmark fraction", def_es: "una fracción fácil como 0, 1/2 o 1 que te ayuda a juzgar otras fracciones", example_es: "3/8 es menos que la fracción de referencia 1/2." },
    { term: "common denominator", def_es: "el mismo número de abajo en dos o más fracciones", example_es: "Con denominador común 8, 1/2 se escribe 4/8." },
    { term: "compare", def_es: "mirar dos cosas y decidir en qué se parecen o se diferencian", example_es: "Comparo 3/8 y 1/2 para ver cuál es mayor." },
    { term: "greater than", def_es: "que vale más que otro número", example_es: "1/2 es mayor que 3/8." },
    { term: "less than", def_es: "que vale menos que otro número", example_es: "3/8 es menor que 1/2." },
    { term: "whole", def_es: "una cosa completa, como una pizza entera, sin que falte ninguna parte", example_es: "Si se come toda la pizza, se come un entero." },
  ],
  talk: [
    { en: "Which two fractions did you compare today? Which one is greater?", es: "¿Qué dos fracciones comparaste hoy? ¿Cuál es mayor?" },
    { en: "How do you know the two fractions are equal?", es: "¿Cómo sabes que las dos fracciones son iguales?" },
    { en: "Is this fraction more or less than one half? How can you tell?", es: "¿Esta fracción es más o menos que un medio? ¿Cómo lo sabes?" },
    { en: "How are these two fractions alike? How are they different?", es: "¿En qué se parecen estas dos fracciones? ¿En qué se diferencian?" },
    { en: "When do we need to compare fractions in real life?", es: "¿Cuándo necesitamos comparar fracciones en la vida real?" },
  ],
  try_at_home: [
    {
      title: { en: "Pizza Slices Swap", es: "Cambio de rebanadas de pizza" },
      minutes: 15,
      materials: { en: "2 paper circles or paper plates the same size, scissors, a marker", es: "2 círculos de papel o platos de papel del mismo tamaño, tijeras y un marcador" },
      steps: {
        en: [
          "Cut one circle in half. Label each piece 1/2.",
          "Cut the other circle into 8 equal slices. Label each slice 1/8.",
          "Cover one half with eighths. Ask: how many eighths fit on 1/2? (4.) So 1/2 = 4/8.",
          "Ask: what number did we multiply the top and the bottom by? (1 × 4 and 2 × 4.)",
        ],
        es: [
          "Corten un círculo por la mitad. Escriban 1/2 en cada pedazo.",
          "Corten el otro círculo en 8 rebanadas iguales. Escriban 1/8 en cada rebanada.",
          "Cubran una mitad con octavos. Pregunten: ¿cuántos octavos caben en 1/2? (4.) Entonces 1/2 = 4/8.",
          "Pregunten: ¿por qué número multiplicamos el de arriba y el de abajo? (1 × 4 y 2 × 4.)",
        ],
      },
    },
    {
      title: { en: "Half or Not?", es: "¿Es la mitad o no?" },
      minutes: 10,
      materials: { en: "2 paper strips of the same length, a marker", es: "2 tiras de papel del mismo largo y un marcador" },
      steps: {
        en: [
          "Fold one strip in half and shade one half. Label it 1/2.",
          "Fold the other strip into 8 equal parts and shade 3 of them. Label it 3/8.",
          "Lay the strips side by side. Ask: is 3/8 more than, less than, or equal to 1/2?",
          "Write 1/2 as 4/8 and say it: \"3/8 is less than 1/2 because 3 eighths is fewer than 4 eighths.\"",
        ],
        es: [
          "Doblen una tira por la mitad y sombreen una mitad. Escriban 1/2.",
          "Doblen la otra tira en 8 partes iguales y sombreen 3. Escriban 3/8.",
          "Pongan las tiras una junto a otra. Pregunten: ¿3/8 es más, menos o igual que 1/2?",
          "Escriban 1/2 como 4/8 y díganlo: \"3/8 es menos que 1/2 porque 3 octavos es menos que 4 octavos\".",
        ],
      },
    },
    {
      title: { en: "Fraction Strips Race", es: "Carrera de tiras de fracciones" },
      minutes: 15,
      materials: { en: "3 paper strips of the same length, a marker, scissors", es: "3 tiras de papel del mismo largo, un marcador y tijeras" },
      steps: {
        en: [
          "Fold one strip into thirds (3 equal parts) and another into sixths (6 equal parts).",
          "Shade 2/3 on the first strip and 4/6 on the second. Put them side by side.",
          "Ask: are the shaded parts the same length? Then 2/3 = 4/6.",
          "Ask: what did we multiply by to go from 2/3 to 4/6? (2.) Does it work for 1/3 and 2/6?",
        ],
        es: [
          "Doblen una tira en tercios (3 partes iguales) y otra en sextos (6 partes iguales).",
          "Sombreen 2/3 en la primera tira y 4/6 en la segunda. Pónganlas una junto a la otra.",
          "Pregunten: ¿las partes sombreadas miden lo mismo? Entonces 2/3 = 4/6.",
          "Pregunten: ¿por cuánto multiplicamos para pasar de 2/3 a 4/6? (Por 2.) ¿Funciona con 1/3 y 2/6?",
        ],
      },
    },
    {
      title: { en: "Which Deal Is Bigger?", es: "¿Qué oferta es mayor?" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Say: Store A gives away 3/4 of a pizza for the group. Store B gives away 5/8. Which is more?",
          "Rename with a common denominator: 3/4 = 6/8, because 3 × 2 = 6 and 4 × 2 = 8.",
          "Compare 6/8 and 5/8. Ask: which has more eighths?",
          "Say: \"3/4 is greater than 5/8 because 6/8 is greater than 5/8.\"",
        ],
        es: [
          "Digan: la tienda A regala 3/4 de una pizza para el grupo. La tienda B regala 5/8. ¿Cuál es más?",
          "Reescriban con un denominador común: 3/4 = 6/8, porque 3 × 2 = 6 y 4 × 2 = 8.",
          "Comparen 6/8 y 5/8. Pregunten: ¿cuál tiene más octavos?",
          "Digan: \"3/4 es mayor que 5/8 porque 6/8 es mayor que 5/8\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "I multiplied [fraction] by [number]/[number] to get [fraction].", es: "Multipliqué [fracción] por [número]/[número] para obtener [fracción]." },
    { en: "[Fraction] is greater than [fraction] because [reason].", es: "[Fracción] es mayor que [fracción] porque [razón]." },
    { en: "Both [fraction] and [fraction] are [alike], whereas [fraction] is ___.", es: "Tanto [fracción] como [fracción] son [parecidas], mientras que [fracción] es ___." },
    { en: "[Fraction] is less than one half because ___.", es: "[Fracción] es menos que un medio porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use food and paper you can fold or cut. Parts you can see and touch make fractions clear.",
      "Remember: the parts must be equal size. Ask \"Are these parts the same size?\"",
      "Ask your child to compare with 1/2 first. It is the easiest benchmark.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen comida y papel que se pueda doblar o cortar. Las partes que se ven y se tocan aclaran las fracciones.",
      "Recuerden: las partes deben medir lo mismo. Pregunten \"¿estas partes miden lo mismo?\".",
      "Pidan que compare primero con 1/2. Es la referencia más fácil.",
    ],
  },
  home_language: {
    en: "Talk about halves, thirds, and quarters in Spanish while you cook: \"la mitad, un tercio, un cuarto.\" Then say them in English. Fracción, equivalente, numerador, denominador, and comparar sound a lot like fraction, equivalent, numerator, denominator, and compare, so your child already knows them.",
    es: "Hablen de mitades, tercios y cuartos en español mientras cocinan: \"la mitad, un tercio, un cuarto\". Luego díganlos en inglés. Fracción, equivalente, numerador, denominador y comparar suenan muy parecido a fraction, equivalent, numerator, denominator y compare, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child compares two fractions with a drawing or a benchmark and explains, in any language, which is greater and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija compare dos fracciones con un dibujo o una referencia y explique, en el idioma que quiera, cuál es mayor y por qué.",
  },
};
