// BCPSS Family Guide (EN/ES) — g3-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on fractions, number lines, equivalence and comparing. Vocabulary order matches ../units/g3-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning that a fraction names equal parts of a whole, and that a number line can show which fractions are greater, less, or equal. It matters when someone shares a pizza, measures with a cup, or cuts a piece of fabric. Your child will prove each claim with the word because, in any language.",
    es: "Su hijo o hija está aprendiendo que una fracción nombra partes iguales de un entero, y que una recta numérica puede mostrar qué fracciones son mayores, menores o iguales. Sirve cuando alguien reparte una pizza, mide con una taza o corta un pedazo de tela. Su hijo o hija comprobará cada afirmación con la palabra porque, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can name fractions and place them on a number line.",
      "I can find fractions that are equivalent, like 1/2 and 2/4.",
      "I can say which fraction is greater and prove it with because.",
    ],
    es: [
      "Puedo nombrar fracciones y ubicarlas en una recta numérica.",
      "Puedo hallar fracciones equivalentes, como 1/2 y 2/4.",
      "Puedo decir qué fracción es mayor y comprobarlo con porque.",
    ],
  },
  vocab: [
    { term: "fraction", def_es: "un número que nombra partes iguales de un entero, como media pizza o un cuarto de taza", example_es: "3/4 es una fracción: son 3 de las 4 partes iguales." },
    { term: "numerator", def_es: "el número de arriba en una fracción; dice cuántas partes iguales estás contando", example_es: "En 3/4, el numerador es 3." },
    { term: "denominator", def_es: "el número de abajo en una fracción; dice en cuántas partes iguales se divide el entero", example_es: "En 3/4, el denominador es 4, así que el entero tiene 4 partes iguales." },
    { term: "unit fraction", def_es: "una fracción con un 1 arriba; cuenta solo una parte igual", example_es: "1/8 es una fracción unitaria." },
    { term: "equal parts", def_es: "pedazos que miden exactamente lo mismo, como las rebanadas de una pizza bien cortada", example_es: "Doblé el papel en 4 partes iguales." },
    { term: "equivalent fractions", def_es: "fracciones con números distintos que nombran la misma cantidad", example_es: "1/2 y 2/4 son fracciones equivalentes." },
    { term: "number line", def_es: "una línea con espacios iguales que muestra los números en orden", example_es: "En la recta numérica, 1/2 queda entre 0 y 1." },
    { term: "compare", def_es: "mirar dos números y decir cuál es mayor, cuál es menor o si son iguales", example_es: "Voy a comparar 3/4 y 3/8." },
    { term: "whole", def_es: "la cantidad completa, sin que falte nada", example_es: "Un entero es toda la pizza, con todas las rebanadas." },
    { term: "greater than", def_es: "más grande en cantidad; más lejos hacia la derecha en la recta numérica", example_es: "3/4 es mayor que 3/8." },
  ],
  talk: [
    { en: "What fraction did you work with today? Show me with paper or food.", es: "¿Con qué fracción trabajaste hoy? Muéstramela con papel o con comida." },
    { en: "How do you know the parts are equal?", es: "¿Cómo sabes que las partes son iguales?" },
    { en: "Which is bigger, a fourth or an eighth? How do you know?", es: "¿Qué es más grande, un cuarto o un octavo? ¿Cómo lo sabes?" },
    { en: "Where does this fraction go on the number line?", es: "¿Dónde va esta fracción en la recta numérica?" },
    { en: "Can you find two different fractions that mean the same amount?", es: "¿Puedes encontrar dos fracciones distintas que signifiquen la misma cantidad?" },
  ],
  try_at_home: [
    {
      title: { en: "Fold a Paper Strip", es: "Doblar una tira de papel" },
      minutes: 15,
      materials: { en: "3 strips of paper of the same length, a marker", es: "3 tiras de papel del mismo largo y un marcador" },
      steps: {
        en: [
          "Leave the first strip as it is. Write \"1 whole\" on it.",
          "Fold the second strip in half, then in half again. Open it: 4 equal parts. Write 1/4 on each part.",
          "Fold the third strip in half three times. Open it: 8 equal parts. Write 1/8 on each part.",
          "Line the strips up. Ask: which is longer, 1/4 or 1/8? What do you notice about 2/4 and 1/2?",
        ],
        es: [
          "Dejen la primera tira como está. Escriban \"1 entero\" en ella.",
          "Doblen la segunda tira por la mitad y otra vez por la mitad. Ábranla: 4 partes iguales. Escriban 1/4 en cada parte.",
          "Doblen la tercera tira por la mitad tres veces. Ábranla: 8 partes iguales. Escriban 1/8 en cada parte.",
          "Pongan las tiras una junto a otra. Pregunten: ¿qué es más largo, 1/4 o 1/8? ¿Qué notan sobre 2/4 y 1/2?",
        ],
      },
    },
    {
      title: { en: "Two Sandwiches", es: "Dos sándwiches" },
      minutes: 10,
      materials: { en: "2 slices of bread or 2 paper circles of the same size, a butter knife or scissors", es: "2 rebanadas de pan o 2 círculos de papel del mismo tamaño, y un cuchillo sin filo o tijeras" },
      steps: {
        en: [
          "Cut one slice into 4 equal parts and the other into 8 equal parts.",
          "Take 3 pieces from each. Ask: which pile is bigger, 3/4 or 3/8?",
          "Put the pieces side by side to check. Ask: why are fourths bigger than eighths?",
          "Say it in a sentence: \"3/4 is greater than 3/8 because ___.\"",
        ],
        es: [
          "Corten una rebanada en 4 partes iguales y la otra en 8 partes iguales.",
          "Tomen 3 pedazos de cada una. Pregunten: ¿qué montón es más grande, 3/4 o 3/8?",
          "Pongan los pedazos uno junto al otro para comprobar. Pregunten: ¿por qué los cuartos son más grandes que los octavos?",
          "Díganlo en una oración: \"3/4 es mayor que 3/8 porque ___\".",
        ],
      },
    },
    {
      title: { en: "Measuring Cup Match", es: "Parejas de tazas" },
      minutes: 10,
      materials: { en: "A 1/2 measuring cup and a 1/4 measuring cup, rice or water, a bowl", es: "Una taza medidora de 1/2 y otra de 1/4, arroz o agua y un tazón" },
      steps: {
        en: [
          "Fill the 1/4 cup and pour it into the bowl. Do it again.",
          "Pour the bowl into the 1/2 cup. Ask: does it fill it exactly?",
          "Say: 2/4 cup is the same amount as 1/2 cup. They are equivalent fractions.",
          "Try 1/4 cup four times. How many 1/4 cups make 1 whole cup?",
        ],
        es: [
          "Llenen la taza de 1/4 y vacíenla en el tazón. Háganlo otra vez.",
          "Vacíen el tazón en la taza de 1/2. Pregunten: ¿se llena justo?",
          "Digan: 2/4 de taza es la misma cantidad que 1/2 taza. Son fracciones equivalentes.",
          "Prueben con 1/4 de taza cuatro veces. ¿Cuántas tazas de 1/4 forman 1 taza entera?",
        ],
      },
    },
    {
      title: { en: "Number Line on the Floor", es: "Recta numérica en el piso" },
      minutes: 15,
      materials: { en: "Masking tape or a long string, small papers or sticky notes, a marker", es: "Cinta adhesiva o un hilo largo, papelitos o notas adhesivas y un marcador" },
      steps: {
        en: [
          "Lay the tape on the floor. Mark 0 at one end and 1 at the other.",
          "Find the middle and mark 1/2. Then split each half in two and mark 1/4, 2/4, and 3/4.",
          "Ask: where does 1/2 sit compared to 2/4? What does that tell you?",
          "Walk along the line. Ask: which is farther to the right, 3/4 or 1/4? So which is greater?",
        ],
        es: [
          "Pongan la cinta en el piso. Marquen el 0 en un extremo y el 1 en el otro.",
          "Encuentren la mitad y marquen 1/2. Luego dividan cada mitad en dos y marquen 1/4, 2/4 y 3/4.",
          "Pregunten: ¿dónde queda 1/2 comparado con 2/4? ¿Qué les dice eso?",
          "Caminen por la línea. Pregunten: ¿qué queda más a la derecha, 3/4 o 1/4? Entonces, ¿cuál es mayor?",
        ],
      },
    },
  ],
  say_it: [
    { en: "[Fraction] is greater than [fraction] because [reason].", es: "[Fracción] es mayor que [fracción] porque [razón]." },
    { en: "The denominator is [number], so the whole has [number] equal parts.", es: "El denominador es [número], entonces el entero tiene [número] partes iguales." },
    { en: "[Fraction] and [fraction] are equivalent because they are at the same point on the number line.", es: "[Fracción] y [fracción] son equivalentes porque están en el mismo punto de la recta numérica." },
    { en: "The numerator tells me ___.", es: "El numerador me dice ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use food and paper you can fold or cut. Seeing and touching the parts makes fractions real.",
      "Remind your child: the parts must be equal. Ask \"Are these the same size?\"",
      "If your child is stuck, ask them to draw the whole first, then split it.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen comida y papel que se pueda doblar o cortar. Ver y tocar las partes hace que las fracciones sean reales.",
      "Recuerden a su hijo o hija: las partes deben ser iguales. Pregunten \"¿miden lo mismo?\".",
      "Si se atasca, pídanle que dibuje primero el entero y luego lo divida.",
    ],
  },
  home_language: {
    en: "Talk about sharing food in Spanish first: \"la mitad, un cuarto, un octavo.\" Then learn the English words together. Fracción, numerador, denominador, and equivalente sound a lot like fraction, numerator, denominator, and equivalent, so your child already knows them.",
    es: "Hablen primero en español de cómo repartir la comida: \"la mitad, un cuarto, un octavo\". Después aprendan juntos las palabras en inglés. Fracción, numerador, denominador y equivalente suenan muy parecido a fraction, numerator, denominator y equivalent, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child cuts or folds something into equal parts and tells you, in any language, which piece is bigger and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija corte o doble algo en partes iguales y les cuente, en el idioma que quiera, qué pedazo es más grande y por qué.",
  },
};
