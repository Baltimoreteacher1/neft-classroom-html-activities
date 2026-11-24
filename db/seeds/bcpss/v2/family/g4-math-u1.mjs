// BCPSS Family Guide (EN/ES) — g4-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on place value, rounding, and adding and subtracting big numbers. Vocabulary order matches ../units/g4-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how the place of a digit changes its value, and how to read, write, round, add, and subtract big numbers. It matters when someone reads a ballgame crowd, checks a bill, or compares prices. Your child will explain why a digit is worth what it is, in any language.",
    es: "Su hijo o hija está aprendiendo cómo el lugar de un dígito cambia su valor, y cómo leer, escribir, redondear, sumar y restar números grandes. Sirve cuando alguien lee cuánta gente fue a un partido, revisa una cuenta o compara precios. Su hijo o hija explicará por qué un dígito vale lo que vale, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can read and write big numbers and tell what each digit is worth.",
      "I can round big numbers and estimate sums and differences.",
      "I can add and subtract big numbers with regrouping and explain with because.",
    ],
    es: [
      "Puedo leer y escribir números grandes y decir cuánto vale cada dígito.",
      "Puedo redondear números grandes y estimar sumas y restas.",
      "Puedo sumar y restar números grandes reagrupando y explicar con porque.",
    ],
  },
  vocab: [
    { term: "digit", def_es: "uno de los diez símbolos con los que se escriben los números: del 0 al 9", example_es: "El número 5,284 tiene cuatro dígitos." },
    { term: "place value", def_es: "lo que vale un dígito según el lugar donde está en el número", example_es: "Por el valor posicional, el 5 de 5,284 vale 5,000." },
    { term: "expanded form", def_es: "una manera de escribir un número como la suma del valor de cada dígito", example_es: "La forma desarrollada de 5,284 es 5,000 + 200 + 80 + 4." },
    { term: "standard form", def_es: "la manera usual de escribir un número con dígitos", example_es: "La forma estándar de cinco mil doscientos ochenta y cuatro es 5,284." },
    { term: "ten times as much", def_es: "un valor que es 10 grupos del valor más pequeño", example_es: "500 es diez veces más que 50." },
    { term: "regroup", def_es: "cambiar 10 de un lugar por 1 del lugar siguiente a la izquierda", example_es: "Reagrupo 10 centenas como 1 millar." },
    { term: "round", def_es: "cambiar un número por otro cercano que es más fácil de usar", example_es: "Redondeo 4,862 a 5,000." },
    { term: "estimate", def_es: "hallar una respuesta que está cerca, pero no es exacta", example_es: "Estimo la suma antes de solucionar." },
    { term: "sum", def_es: "la respuesta de una suma", example_es: "La suma de 3,500 y 2,600 es 6,100." },
    { term: "difference", def_es: "la respuesta de una resta", example_es: "La diferencia entre 500 y 268 es 232." },
  ],
  talk: [
    { en: "Pick a big number. What is each digit worth?", es: "Elige un número grande. ¿Cuánto vale cada dígito?" },
    { en: "Why is the 5 in 500 worth more than the 5 in 50?", es: "¿Por qué el 5 de 500 vale más que el 5 de 50?" },
    { en: "How did you decide which way to round?", es: "¿Cómo decidiste hacia dónde redondear?" },
    { en: "What was your estimate? How close was your exact answer?", es: "¿Cuál fue tu estimación? ¿Qué tan cerca estuvo tu respuesta exacta?" },
    { en: "Where do we see big numbers in real life?", es: "¿Dónde vemos números grandes en la vida real?" },
  ],
  try_at_home: [
    {
      title: { en: "Paper Place Value", es: "Valor posicional con papel" },
      minutes: 15,
      materials: { en: "Small slips of paper, a marker, a cup", es: "Papelitos, un marcador y un vaso" },
      steps: {
        en: [
          "Make slips labeled 1,000, 100, 10, and 1. Make 2, 3, 4, and 5 of them in that order.",
          "Lay them out to build 2,345. Ask: how much is each group worth?",
          "Write the expanded form together: 2,000 + 300 + 40 + 5.",
          "Change one slip and read the new number out loud. Ask: what changed?",
        ],
        es: [
          "Hagan papelitos con los números 1,000, 100, 10 y 1. Hagan 2, 3, 4 y 5 de cada uno, en ese orden.",
          "Colóquenlos para formar 2,345. Pregunten: ¿cuánto vale cada grupo?",
          "Escriban juntos la forma desarrollada: 2,000 + 300 + 40 + 5.",
          "Cambien un papelito y lean el número nuevo en voz alta. Pregunten: ¿qué cambió?",
        ],
      },
    },
    {
      title: { en: "Ten Times Bigger", es: "Diez veces más grande" },
      minutes: 10,
      materials: { en: "Pennies, dimes, and dollar bills (or paper copies), paper and a pencil", es: "Centavos, monedas de diez centavos y billetes de dólar (o copias de papel), papel y lápiz" },
      steps: {
        en: [
          "Put out 5 dollar bills. Ask: how much? ($5.) Now put out 5 ten-dollar bills instead. How much is that? ($50.)",
          "Say: $50 is ten times as much as $5. Write 5 and 50 side by side.",
          "Do it again: 5 hundred-dollar bills is $500, ten times as much as $50.",
          "Ask: what happens to the 5 each time? Which way does it move?",
        ],
        es: [
          "Pongan 5 billetes de un dólar. Pregunten: ¿cuánto es? ($5.) Ahora pongan 5 billetes de diez dólares. ¿Cuánto es? ($50.)",
          "Digan: $50 es diez veces más que $5. Escriban el 5 y el 50 uno junto al otro.",
          "Háganlo otra vez: 5 billetes de cien dólares son $500, diez veces más que $50.",
          "Pregunten: ¿qué le pasa al 5 cada vez? ¿Hacia dónde se mueve?",
        ],
      },
    },
    {
      title: { en: "Ballgame Crowd", es: "La multitud del partido" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Say: Saturday 3,482 fans came to the game and Sunday 2,619 came. About how many in all?",
          "Round each number to the nearest hundred: 3,482 is about 3,500 and 2,619 is about 2,600.",
          "Estimate: 3,500 + 2,600 = 6,100. Then find the exact sum: 3,482 + 2,619 = 6,101.",
          "Ask: how close is the estimate? How do you know the sum is reasonable?",
        ],
        es: [
          "Digan: el sábado fueron 3,482 aficionados al juego y el domingo fueron 2,619. ¿Cuántos fueron más o menos en total?",
          "Redondeen cada número a la centena más cercana: 3,482 es casi 3,500 y 2,619 es casi 2,600.",
          "Estimen: 3,500 + 2,600 = 6,100. Luego hallen la suma exacta: 3,482 + 2,619 = 6,101.",
          "Pregunten: ¿qué tan cerca está la estimación? ¿Cómo sabes que la suma es razonable?",
        ],
      },
    },
    {
      title: { en: "Trade at the Bank", es: "Cambio en el banco" },
      minutes: 15,
      materials: { en: "Paper slips marked 100 and 10 (or play money), a marker", es: "Papelitos marcados 100 y 10 (o dinero de juguete) y un marcador" },
      steps: {
        en: [
          "Say: you have $500, shown as five slips of 100. You spend $268. How much is left?",
          "You cannot take 8 ones from 0 ones. Trade one 100 for ten 10s, then trade one 10 for ten 1s.",
          "Take away 2 hundreds, 6 tens, and 8 ones. Count what is left.",
          "Say the answer: 500 − 268 = 232. Check it by adding: 232 + 268 = 500.",
        ],
        es: [
          "Digan: tienen $500, que son cinco papelitos de 100. Gastan $268. ¿Cuánto les queda?",
          "No se pueden quitar 8 unidades de 0 unidades. Cambien un 100 por diez 10, y luego cambien un 10 por diez 1.",
          "Quiten 2 centenas, 6 decenas y 8 unidades. Cuenten lo que queda.",
          "Digan la respuesta: 500 − 268 = 232. Compruébenlo sumando: 232 + 268 = 500.",
        ],
      },
    },
  ],
  say_it: [
    { en: "The [digit] in [number] is worth [value] because it is in the [place] place.", es: "El [dígito] de [número] vale [valor] porque está en el lugar de las [posición]." },
    { en: "[Number] is ten times as much as [number] because ___.", es: "[Número] es diez veces más que [número] porque ___." },
    { en: "I regrouped [number] [place] as [number] [next place].", es: "Reagrupé [número] [lugar] como [número] [lugar siguiente]." },
    { en: "I estimated [number], and my exact answer is [number], so it is reasonable.", es: "Estimé [número], y mi respuesta exacta es [número], entonces es razonable." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Say big numbers out loud in any language. Reading them is half the skill.",
      "Use real money or paper slips to trade. Seeing ten ones become one ten makes regrouping click.",
      "Ask for an estimate first, then check the exact answer against it.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Digan los números grandes en voz alta en cualquier idioma. Leerlos es la mitad de la destreza.",
      "Usen dinero de verdad o papelitos para hacer cambios. Ver que diez unidades se vuelven una decena ayuda a entender reagrupar.",
      "Pidan primero una estimación y luego comparen con la respuesta exacta.",
    ],
  },
  home_language: {
    en: "Read big numbers aloud in Spanish first, like \"cinco mil doscientos ochenta y cuatro,\" then in English. Dígito, estimar, and diferencia have close English partners (digit, estimate, difference), so your child already knows several of these words.",
    es: "Lean primero los números grandes en voz alta en español, como \"cinco mil doscientos ochenta y cuatro\", y después en inglés. Dígito, estimar y diferencia tienen compañeras muy parecidas en inglés (digit, estimate, difference), así que su hijo o hija ya conoce varias de estas palabras.",
  },
  celebrate: {
    en: "You will know it is working when your child reads a big number from a sign or a receipt and tells you, in any language, what each digit is worth.",
    es: "Sabrán que está funcionando cuando su hijo o hija lea un número grande de un letrero o de un recibo y les cuente, en el idioma que quiera, cuánto vale cada dígito.",
  },
};
