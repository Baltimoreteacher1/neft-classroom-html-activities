// BCPSS Family Guide (EN/ES) — g6-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on dividing fractions and computing with multi-digit numbers and decimals. Vocabulary order matches ../units/g6-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to divide fractions, and to add, subtract, multiply and divide big numbers and decimals with steps that work every time. The big goal is to explain each step so someone else can follow it and trust the answer. It matters when you split a pizza, share a bill, check a gas receipt, or figure out how many 1/4-cup scoops fit in a bag of rice.",
    es: "Su hijo o hija está aprendiendo a dividir fracciones y a sumar, restar, multiplicar y dividir números grandes y decimales con pasos que siempre funcionan. La meta es explicar cada paso para que otra persona lo entienda y confíe en la respuesta. Sirve cuando se reparte una pizza, se divide una cuenta, se revisa un recibo de gasolina o se calcula cuántas medidas de 1/4 de taza caben en una bolsa de arroz.",
  },
  goals: {
    en: [
      "I can divide a fraction by a fraction and say what the answer means.",
      "I can line up decimal points and place values to add, subtract, multiply and divide.",
      "I can explain my steps with first, next, then, because and so.",
    ],
    es: [
      "Puedo dividir una fracción entre otra fracción y decir qué significa la respuesta.",
      "Puedo alinear los puntos decimales y los valores posicionales para sumar, restar, multiplicar y dividir.",
      "Puedo explicar mis pasos con primero, luego, después, porque y entonces.",
    ],
  },
  vocab: [
    { term: "dividend", def_es: "el número que se reparte en partes; es el primero en una división", example_es: "En 12 ÷ 3, el dividendo es 12." },
    { term: "divisor", def_es: "el número entre el que se divide; dice en cuántas partes o de qué tamaño se reparte", example_es: "En 12 ÷ 3, el divisor es 3." },
    { term: "quotient", def_es: "la respuesta de una división", example_es: "El cociente de 12 ÷ 3 es 4." },
    { term: "reciprocal", def_es: "la fracción que sale al voltear el número de arriba y el de abajo; un número y su recíproco multiplicados dan 1", example_es: "El recíproco de 2/3 es 3/2." },
    { term: "algorithm", def_es: "una serie de pasos que funciona siempre para un mismo tipo de problema, como una receta", example_es: "La división larga es un algoritmo para dividir números grandes." },
    { term: "unit fraction", def_es: "una fracción con un 1 arriba; muestra una sola parte de un entero dividido en partes iguales", example_es: "1/8 es una fracción unitaria, pero 3/8 no lo es." },
    { term: "place value", def_es: "lo que vale un dígito según el lugar donde está en el número", example_es: "En 3.47, el valor posicional del 4 son las décimas." },
    { term: "decimal point", def_es: "el punto que separa los números enteros de las partes de un entero", example_es: "Alineen los puntos decimales antes de sumar 3.5 y 12.75." },
    { term: "estimate", def_es: "hallar una respuesta cercana sin hacer todos los pasos exactos; estimar es parecido a calcular a ojo", example_es: "Estimo 4.8 × 5.1 redondeando a 5 × 5." },
  ],
  talk: [
    { en: "Can you tell me the steps you used, from first to last?", es: "¿Puedes decirme los pasos que usaste, del primero al último?" },
    { en: "About how big should the answer be? How do you know?", es: "¿Más o menos de qué tamaño debe ser la respuesta? ¿Cómo lo sabes?" },
    { en: "Where did the decimal point go, and why did it go there?", es: "¿Adónde fue el punto decimal y por qué?" },
    { en: "Can you check your answer a different way?", es: "¿Puedes revisar tu respuesta de otra manera?" },
    { en: "When do you need a number that is exact, and when is a close number enough?", es: "¿Cuándo necesitas un número exacto y cuándo basta con uno cercano?" },
  ],
  try_at_home: [
    {
      title: { en: "Scoops in the Bag", es: "Medidas en la bolsa" },
      minutes: 15,
      materials: { en: "A bag of rice or beans, a 1/4-cup and a 1/2-cup measuring cup, a bowl", es: "Una bolsa de arroz o frijoles, una taza de medir de 1/4 y otra de 1/2, un tazón" },
      steps: {
        en: [
          "Put 2 cups of rice in the bowl. Ask: how many 1/4-cup scoops do you think we can get from it?",
          "Scoop with the 1/4 cup and count each scoop out loud, in any language.",
          "Write it as division: 2 ÷ 1/4 = 8. Ask: why is the answer bigger than 2?",
          "Try 1 cup ÷ 1/2 cup. Ask: what do you notice about dividing by a fraction?",
        ],
        es: [
          "Pongan 2 tazas de arroz en el tazón. Pregunten: ¿cuántas medidas de 1/4 de taza creen que podemos sacar?",
          "Saquen con la taza de 1/4 y cuenten cada medida en voz alta, en el idioma que quieran.",
          "Escríbanlo como división: 2 ÷ 1/4 = 8. Pregunten: ¿por qué la respuesta es mayor que 2?",
          "Prueben con 1 taza ÷ 1/2 taza. Pregunten: ¿qué notas al dividir entre una fracción?",
        ],
      },
    },
    {
      title: { en: "Receipt Detective", es: "Detectives del recibo" },
      minutes: 15,
      materials: { en: "A grocery or gas receipt, paper and pencil", es: "Un recibo del supermercado o de gasolina, papel y lápiz" },
      steps: {
        en: [
          "Choose three prices from the receipt, like $3.49, $12.75 and $0.99.",
          "Ask your child to estimate the total first by rounding each price to the nearest dollar.",
          "Add the exact prices on paper, with the decimal points lined up in a column.",
          "Compare the estimate and the exact total. Ask: is the exact answer reasonable? How do you know?",
        ],
        es: [
          "Elijan tres precios del recibo, como $3.49, $12.75 y $0.99.",
          "Pídanle a su hijo o hija que estime primero el total, redondeando cada precio al dólar más cercano.",
          "Sumen los precios exactos en papel, con los puntos decimales alineados en una columna.",
          "Comparen la estimación con el total exacto. Pregunten: ¿es razonable la respuesta exacta? ¿Cómo lo sabes?",
        ],
      },
    },
    {
      title: { en: "Share the Bill", es: "Repartir la cuenta" },
      minutes: 10,
      materials: { en: "A pretend bill or real receipt, paper and pencil, a calculator is optional", es: "Una cuenta inventada o un recibo real, papel y lápiz; la calculadora es opcional" },
      steps: {
        en: [
          "Pick a bill, like $45.60, to split among 4 people.",
          "Ask your child to estimate first: about how much does each person pay?",
          "Divide on paper, one place value at a time, and say each step: first, next, then.",
          "Multiply the answer by 4 to check that you get the bill back.",
        ],
        es: [
          "Elijan una cuenta, como $45.60, para repartir entre 4 personas.",
          "Pídanle a su hijo o hija que estime primero: ¿más o menos cuánto paga cada persona?",
          "Dividan en papel, un valor posicional a la vez, y digan cada paso: primero, luego, después.",
          "Multipliquen la respuesta por 4 para comprobar que sale la cuenta completa.",
        ],
      },
    },
    {
      title: { en: "Flip It", es: "Voltéalo" },
      minutes: 10,
      materials: { en: "Paper, a pencil, and a ruler or a strip of paper", es: "Papel, un lápiz y una regla o una tira de papel" },
      steps: {
        en: [
          "Fold a strip of paper in thirds. Each part is the unit fraction 1/3.",
          "Ask: how many 1/3 pieces fit in 1 whole strip? Count them.",
          "Write the fraction 2/3 and flip it to 3/2. Say: this is the reciprocal.",
          "Multiply 2/3 × 3/2 together. Ask: what do you get? Try it with 3/4 and 4/3.",
        ],
        es: [
          "Doblen una tira de papel en tres partes. Cada parte es la fracción unitaria 1/3.",
          "Pregunten: ¿cuántas piezas de 1/3 caben en 1 tira entera? Cuéntenlas.",
          "Escriban la fracción 2/3 y voltéenla a 3/2. Digan: este es el recíproco.",
          "Multipliquen 2/3 × 3/2. Pregunten: ¿qué te da? Prueben con 3/4 y 4/3.",
        ],
      },
    },
  ],
  say_it: [
    { en: "To divide [6] by [1/2], I multiplied by the reciprocal, [2/1].", es: "Para dividir [6] entre [1/2], multipliqué por el recíproco, [2/1]." },
    { en: "I lined up the decimal points so that [tenths] are added to [tenths].", es: "Alineé los puntos decimales para que [las décimas] se sumen con [las décimas]." },
    { en: "My estimate is [20], so my answer [is] reasonable.", es: "Mi estimación es [20], entonces mi respuesta [es] razonable." },
    { en: "First I [lined up the digits], next I [divided], then I [checked].", es: "Primero [alineé los dígitos], luego [dividí] y después [revisé]." },
  ],
  help: {
    en: [
      "You do not need to know how to divide fractions. Ask your child to be the teacher and show each step.",
      "Ask \"about how big should the answer be?\" before any calculating. Estimating helps catch mistakes.",
      "Use real numbers from your day: receipts, recipes, gas prices.",
      "If your child gets stuck, ask \"what is the first step?\" instead of giving the step.",
    ],
    es: [
      "No necesitan saber dividir fracciones. Pídanle a su hijo o hija que sea el maestro y muestre cada paso.",
      "Pregunten \"¿más o menos de qué tamaño debe ser la respuesta?\" antes de calcular. Estimar ayuda a detectar errores.",
      "Usen números reales de su día: recibos, recetas, precios de gasolina.",
      "Si se atora, pregunten \"¿cuál es el primer paso?\" en lugar de decirle el paso.",
    ],
  },
  home_language: {
    en: "Many of these words are almost the same in Spanish: algorithm (algoritmo), quotient (cociente), reciprocal (recíproco), estimate (estimar). Ask your child to say each one in Spanish first, then in English. In many Spanish-speaking countries, decimals are written with a comma, as in 3,5. Talk about it together: the same number, a different mark.",
    es: "Muchas de estas palabras son casi iguales en inglés: algoritmo (algorithm), cociente (quotient), recíproco (reciprocal), estimar (estimate). Pídanle a su hijo o hija que diga cada una primero en español y luego en inglés. En muchos países de habla hispana los decimales se escriben con coma, como en 3,5. Conversen sobre eso: el mismo número, otra marca.",
  },
  celebrate: {
    en: "You will know it is working when your child can walk you through each step of a division or a decimal problem, say about how big the answer should be, and tell you why they trust it.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda explicarles cada paso de una división o de un problema con decimales, decir de qué tamaño debe ser más o menos la respuesta y contarles por qué confía en ella.",
  },
};
