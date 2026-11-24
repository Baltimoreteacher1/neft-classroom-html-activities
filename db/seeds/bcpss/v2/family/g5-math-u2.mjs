// BCPSS Family Guide (EN/ES) — g5-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on decimal place value, powers of 10, rounding and comparing decimals. Vocabulary order matches ../units/g5-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning what happens to the digits of a decimal when you multiply or divide by 10, 100, or 1,000, and how to read, compare, and round decimals to thousandths. It matters when someone reads a price per gallon, a sports time, or a measurement on a package. Your child will explain why the digits move, in any language.",
    es: "Su hijo o hija está aprendiendo qué pasa con los dígitos de un decimal cuando se multiplica o se divide por 10, 100 o 1,000, y cómo leer, comparar y redondear decimales hasta los milésimos. Sirve cuando alguien lee el precio del galón, una marca deportiva o una medida en un empaque. Su hijo o hija explicará por qué se mueven los dígitos, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can read, compare, and round decimals to thousandths.",
      "I can multiply and divide decimals by 10, 100, and 1,000 and tell where the digits move.",
      "I can explain a cause and its effect with because, so, and as a result.",
    ],
    es: [
      "Puedo leer, comparar y redondear decimales hasta los milésimos.",
      "Puedo multiplicar y dividir decimales por 10, 100 y 1,000 y decir hacia dónde se mueven los dígitos.",
      "Puedo explicar una causa y su efecto con porque, entonces y como resultado.",
    ],
  },
  vocab: [
    { term: "place value", def_es: "lo que vale un dígito según el lugar donde está en el número", example_es: "Por el valor posicional, el 4 de 0.45 vale 4 décimos." },
    { term: "digit", def_es: "uno de los diez símbolos del 0 al 9 con los que se escriben los números", example_es: "El número 4.5 tiene dos dígitos." },
    { term: "decimal point", def_es: "el punto que separa el número entero de las partes más pequeñas que uno", example_es: "En 4.5, el punto decimal está entre el 4 y el 5." },
    { term: "thousandth", def_es: "una de 1,000 partes iguales de un entero", example_es: "0.001 se lee un milésimo." },
    { term: "power of 10", def_es: "un número que se forma al multiplicar 10 por sí mismo, como 100 o 1,000", example_es: "1,000 es una potencia de 10 porque es 10 × 10 × 10." },
    { term: "exponent", def_es: "un número pequeño y elevado que dice cuántas veces se usa la base como factor", example_es: "En 10³, el exponente es 3, así que es 10 × 10 × 10." },
    { term: "expanded form", def_es: "una manera de escribir un número como la suma del valor de cada dígito", example_es: "La forma desarrollada de 4.52 es 4 + 0.5 + 0.02." },
    { term: "round", def_es: "cambiar un número por otro cercano que es más fácil de usar", example_es: "Redondeo 3.459 al centésimo más cercano: 3.46." },
    { term: "compare", def_es: "mirar dos números y decir cuál es mayor, cuál es menor o si son iguales", example_es: "Comparo 0.5 y 0.45 y veo que 0.5 es mayor." },
  ],
  talk: [
    { en: "What happens to the digits when you multiply 4.5 by 10?", es: "¿Qué pasa con los dígitos cuando multiplicas 4.5 por 10?" },
    { en: "Why do the digits move one place each time?", es: "¿Por qué los dígitos se mueven un lugar cada vez?" },
    { en: "Which is greater, 0.5 or 0.45? How do you know?", es: "¿Qué es mayor, 0.5 o 0.45? ¿Cómo lo sabes?" },
    { en: "How did you decide how to round this decimal?", es: "¿Cómo decidiste cómo redondear este decimal?" },
    { en: "Where do you see decimals in real life?", es: "¿Dónde ves decimales en la vida real?" },
  ],
  try_at_home: [
    {
      title: { en: "Digit Slide", es: "Deslizar los dígitos" },
      minutes: 15,
      materials: { en: "Paper, a marker, scissors", es: "Papel, marcador y tijeras" },
      steps: {
        en: [
          "Draw a place value chart with the headings Tens, Ones, a decimal point, Tenths, Hundredths. Write the digits 4 and 5 on slips of paper.",
          "Put the 4 in Ones and the 5 in Tenths to show 4.5. Ask: how much is each digit worth?",
          "Multiply by 10: slide each digit one place to the left. Now the 4 is in Tens and the 5 in Ones. That is 45.",
          "Now divide 45 by 10 by sliding both digits back one place to the right. Ask: why do the digits move?",
        ],
        es: [
          "Dibujen una tabla de valor posicional con los títulos Decenas, Unidades, un punto decimal, Décimos, Centésimos. Escriban los dígitos 4 y 5 en papelitos.",
          "Pongan el 4 en Unidades y el 5 en Décimos para mostrar 4.5. Pregunten: ¿cuánto vale cada dígito?",
          "Multipliquen por 10: deslicen cada dígito un lugar hacia la izquierda. Ahora el 4 está en Decenas y el 5 en Unidades. Eso es 45.",
          "Ahora dividan 45 entre 10 deslizando los dos dígitos un lugar hacia la derecha. Pregunten: ¿por qué se mueven los dígitos?",
        ],
      },
    },
    {
      title: { en: "Penny Power of Ten", es: "Centavos y potencias de diez" },
      minutes: 10,
      materials: { en: "A penny, a dime, a dollar bill, a ten-dollar bill (or paper copies), paper and a pencil", es: "Un centavo, una moneda de diez centavos, un billete de un dólar y uno de diez dólares (o copias de papel), papel y lápiz" },
      steps: {
        en: [
          "Start with 1 penny, which is 1 cent. A dime is 10 times as much: 10 cents.",
          "A dollar is 10 times the dime: 100 cents. A ten-dollar bill is 10 times the dollar: 1,000 cents.",
          "Write the pattern with exponents: 10¹ = 10, 10² = 100, 10³ = 1,000. Ask: what do you notice about the zeros?",
          "Ask: how many cents are in $10? ($10 = 1,000 cents.) Why is that a power of 10?",
        ],
        es: [
          "Empiecen con 1 centavo, que es 1 ¢. Una moneda de diez es 10 veces más: 10 centavos.",
          "Un dólar es 10 veces la moneda de diez: 100 centavos. Un billete de diez dólares es 10 veces el dólar: 1,000 centavos.",
          "Escriban el patrón con exponentes: 10¹ = 10, 10² = 100, 10³ = 1,000. Pregunten: ¿qué notan sobre los ceros?",
          "Pregunten: ¿cuántos centavos hay en $10? ($10 = 1,000 centavos.) ¿Por qué es una potencia de 10?",
        ],
      },
    },
    {
      title: { en: "Which Is Greater?", es: "¿Cuál es mayor?" },
      minutes: 10,
      materials: { en: "Paper and a pencil, a ruler (optional)", es: "Papel y lápiz, una regla (opcional)" },
      steps: {
        en: [
          "Say: three juice bottles have 0.5 liter, 0.45 liter, and 0.405 liter. Which has the most?",
          "Line up the decimals so the decimal points match: 0.500, 0.450, 0.405.",
          "Compare from the left: the tenths are 5, 4, and 4. So 0.5 is greatest. Then compare 0.450 and 0.405 by the hundredths: 5 and 0.",
          "Write them in order from greatest to least: 0.5 > 0.45 > 0.405. Say why.",
        ],
        es: [
          "Digan: tres botellas de jugo tienen 0.5 litro, 0.45 litro y 0.405 litro. ¿Cuál tiene más?",
          "Alineen los decimales para que los puntos decimales coincidan: 0.500, 0.450, 0.405.",
          "Comparen desde la izquierda: los décimos son 5, 4 y 4. Entonces 0.5 es el mayor. Luego comparen 0.450 y 0.405 por los centésimos: 5 y 0.",
          "Escríbanlos de mayor a menor: 0.5 > 0.45 > 0.405. Expliquen por qué.",
        ],
      },
    },
    {
      title: { en: "Round the Gas Price", es: "Redondear el precio de la gasolina" },
      minutes: 10,
      materials: { en: "A gas-station sign or receipt if you have one, paper and a pencil", es: "Un letrero de gasolinera o un recibo si tienen, papel y lápiz" },
      steps: {
        en: [
          "Look at a gas price like $3.459 per gallon. Say the digits and their places.",
          "Round to the nearest tenth: look at the hundredths digit, 5. It is 5 or more, so 3.459 rounds up to 3.5.",
          "Round to the nearest hundredth: look at the thousandths digit, 9. It rounds up to 3.46.",
          "Ask: why did the rounded numbers change? How close is 3.46 to 3.459?",
        ],
        es: [
          "Miren un precio de gasolina como $3.459 por galón. Digan los dígitos y sus lugares.",
          "Redondeen al décimo más cercano: miren el dígito de los centésimos, 5. Es 5 o más, así que 3.459 se redondea hacia arriba a 3.5.",
          "Redondeen al centésimo más cercano: miren el dígito de los milésimos, 9. Se redondea hacia arriba a 3.46.",
          "Pregunten: ¿por qué cambiaron los números redondeados? ¿Qué tan cerca está 3.46 de 3.459?",
        ],
      },
    },
  ],
  say_it: [
    { en: "When I multiply by [10 / 100 / 1,000], each digit moves [number] places to the [left / right] because ___.", es: "Cuando multiplico por [10 / 100 / 1,000], cada dígito se mueve [número] lugares hacia la [izquierda / derecha] porque ___." },
    { en: "The [digit] in [decimal] is in the [place] place, so its value is [value].", es: "El [dígito] de [decimal] está en el lugar de los [posición], entonces su valor es [valor]." },
    { en: "I rounded [decimal] to [number] because the next digit is [digit].", es: "Redondeé [decimal] a [número] porque el siguiente dígito es [dígito]." },
    { en: "[Decimal] is greater than [decimal] because ___.", es: "[Decimal] es mayor que [decimal] porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use money. Pennies, dimes, and dollars are decimals your child already handles.",
      "Say decimals out loud: \"four and five tenths.\" Reading them correctly helps.",
      "Ask \"Which way do the digits move, and why?\" instead of teaching a trick.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen dinero. Los centavos, las monedas de diez y los dólares son decimales que su hijo o hija ya maneja.",
      "Digan los decimales en voz alta: \"cuatro y cinco décimos\". Leerlos bien ayuda.",
      "Pregunten \"¿hacia dónde se mueven los dígitos y por qué?\" en lugar de enseñar un truco.",
    ],
  },
  home_language: {
    en: "Read decimals in Spanish first, like \"cuatro punto cinco\" or \"cuatro con cinco décimos.\" Then say them in English. Decimal, dígito, exponente, and potencia de 10 sound a lot like decimal, digit, exponent, and power of 10, so your child already knows them.",
    es: "Lean primero los decimales en español, como \"cuatro punto cinco\" o \"cuatro con cinco décimos\". Luego díganlos en inglés. Decimal, dígito, exponente y potencia de 10 suenan muy parecido a decimal, digit, exponent y power of 10, así que su hijo o hija ya los conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child multiplies or divides a decimal by 10, 100, or 1,000 and explains, in any language, why the digits moved.",
    es: "Sabrán que está funcionando cuando su hijo o hija multiplique o divida un decimal por 10, 100 o 1,000 y explique, en el idioma que quiera, por qué se movieron los dígitos.",
  },
};
