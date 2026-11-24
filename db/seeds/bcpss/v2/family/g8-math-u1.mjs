// BCPSS Family Guide (EN/ES) — g8-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on exponents, scientific notation, and rational and irrational numbers. Vocabulary order matches ../units/g8-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning a short way to write very big and very small numbers, such as the distance to the sun or the width of a hair, using powers of 10. They also learn that some numbers, like the square root of 2 or pi, have decimals that never end and never repeat. It matters when you read about space, science, money in the billions, or the size of tiny things.",
    es: "Su hijo o hija está aprendiendo una forma corta de escribir números muy grandes y muy pequeños, como la distancia al sol o el grosor de un cabello, usando potencias de 10. También aprende que algunos números, como la raíz cuadrada de 2 o pi, tienen decimales que nunca terminan y nunca se repiten. Sirve para leer sobre el espacio, la ciencia, el dinero en miles de millones o el tamaño de cosas diminutas.",
  },
  goals: {
    en: [
      "I can use exponent rules and write numbers in scientific notation.",
      "I can tell rational numbers from irrational numbers.",
      "I can place a square root on a number line by estimating it.",
    ],
    es: [
      "Puedo usar las reglas de los exponentes y escribir números en notación científica.",
      "Puedo distinguir los números racionales de los irracionales.",
      "Puedo ubicar una raíz cuadrada en una recta numérica estimándola.",
    ],
  },
  vocab: [
    { term: "exponent", def_es: "el numerito elevado que dice cuántas veces se multiplica la base", example_es: "En 2⁵, el exponente 5 quiere decir que multiplicamos 2 por sí mismo cinco veces." },
    { term: "base", def_es: "el número que se multiplica por sí mismo en una potencia", example_es: "En 10⁴, la base es 10 y la multiplicamos cuatro veces." },
    { term: "scientific notation", def_es: "una forma corta de escribir números muy grandes o muy pequeños, como un número de 1 a 10 por una potencia de 10", example_es: "La notación científica escribe 93,000,000 como 9.3 × 10⁷." },
    { term: "rational number", def_es: "un número que se puede escribir como una fracción de dos números enteros", example_es: "El número 0.75 es racional porque es igual a 3/4." },
    { term: "irrational number", def_es: "un número cuyo decimal nunca termina ni se repite, por eso no se puede escribir como fracción de enteros", example_es: "Pi es un número irracional, así que su decimal sigue para siempre sin patrón." },
    { term: "square root", def_es: "el número que multiplicado por sí mismo da otro número", example_es: "La raíz cuadrada de 49 es 7 porque 7 × 7 = 49." },
    { term: "perfect square", def_es: "el número que resulta de multiplicar un número entero por sí mismo", example_es: "El número 36 es un cuadrado perfecto porque 6 × 6 = 36." },
    { term: "estimate", def_es: "hallar un número cercano a la respuesta exacta", example_es: "Puedo estimar la raíz cuadrada de 10 como más o menos 3.2." },
    { term: "terminating decimal", def_es: "un decimal que se acaba después de ciertos dígitos", example_es: "El número 0.125 es un decimal finito porque termina después de tres dígitos." },
  ],
  talk: [
    { en: "What is a very big or very small number you have seen in the news or in science?", es: "¿Cuál es un número muy grande o muy pequeño que has visto en las noticias o en ciencias?" },
    { en: "How many times is the base multiplied by itself? How do you know?", es: "¿Cuántas veces se multiplica la base por sí misma? ¿Cómo lo sabes?" },
    { en: "Why does moving the decimal point change the power of 10?", es: "¿Por qué mover el punto decimal cambia la potencia de 10?" },
    { en: "Which two whole numbers is this square root between? How do you know?", es: "¿Entre cuáles dos números enteros está esta raíz cuadrada? ¿Cómo lo sabes?" },
    { en: "Can this number be written as a fraction? Why or why not?", es: "¿Se puede escribir este número como fracción? ¿Por qué sí o por qué no?" },
  ],
  try_at_home: [
    {
      title: { en: "Doubling Challenge", es: "El reto de duplicar" },
      minutes: 10,
      materials: { en: "Paper and pencil, a calculator is optional", es: "Papel y lápiz; la calculadora es opcional" },
      steps: {
        en: [
          "Ask: if you had 1 penny and it doubled every day for 10 days, how many pennies would you have?",
          "Write it as a power: 2 × 2 × 2 … ten times is 2¹⁰. Find the value: 1,024.",
          "Ask: what is the base, and what is the exponent?",
          "Try 2²⁰ with a calculator. Ask: how fast does it grow?",
        ],
        es: [
          "Pregunten: si tuvieran 1 centavo y se duplicara cada día durante 10 días, ¿cuántos centavos tendrían?",
          "Escríbanlo como potencia: 2 × 2 × 2 … diez veces es 2¹⁰. Hallen el valor: 1,024.",
          "Pregunten: ¿cuál es la base y cuál es el exponente?",
          "Prueben 2²⁰ con una calculadora. Pregunten: ¿qué tan rápido crece?",
        ],
      },
    },
    {
      title: { en: "Big and Tiny Numbers", es: "Números enormes y diminutos" },
      minutes: 15,
      materials: { en: "A phone or book with facts, paper and pencil", es: "Un teléfono o un libro con datos, papel y lápiz" },
      steps: {
        en: [
          "Look up a very big number, like the distance from Earth to the sun: about 93,000,000 miles.",
          "Count how many places the decimal point must move to get a number between 1 and 10: 9.3. It moved 7 places.",
          "Write it in scientific notation: 9.3 × 10⁷.",
          "Find a tiny number, like the width of a human hair, about 0.0001 meter, and write it as 1 × 10⁻⁴.",
        ],
        es: [
          "Busquen un número muy grande, como la distancia de la Tierra al sol: unos 93,000,000 de millas.",
          "Cuenten cuántos lugares hay que mover el punto decimal para obtener un número entre 1 y 10: 9.3. Se movió 7 lugares.",
          "Escríbanlo en notación científica: 9.3 × 10⁷.",
          "Busquen un número diminuto, como el grosor de un cabello humano, unos 0.0001 metros, y escríbanlo como 1 × 10⁻⁴.",
        ],
      },
    },
    {
      title: { en: "Square Tile Roots", es: "Raíces con baldosas" },
      minutes: 15,
      materials: { en: "Small squares like paper squares or coins, or graph paper; pencil", es: "Cuadritos de papel o monedas, o papel cuadriculado; lápiz" },
      steps: {
        en: [
          "Build a square from 16 small squares. Ask: how long is one side? That is the square root of 16.",
          "Try 25, 36, and 49. These are perfect squares.",
          "Try 10. It is not a perfect square. Ask: between which two whole numbers is its square root?",
          "Guess 3.2 and check with 3.2 × 3.2 = 10.24. Is it close?",
        ],
        es: [
          "Armen un cuadrado con 16 cuadritos. Pregunten: ¿cuánto mide un lado? Esa es la raíz cuadrada de 16.",
          "Prueben con 25, 36 y 49. Estos son cuadrados perfectos.",
          "Prueben con 10. No es un cuadrado perfecto. Pregunten: ¿entre cuáles dos números enteros está su raíz cuadrada?",
          "Prueben con 3.2 y comprueben con 3.2 × 3.2 = 10.24. ¿Se acerca?",
        ],
      },
    },
    {
      title: { en: "Fraction or Forever?", es: "¿Fracción o infinito?" },
      minutes: 10,
      materials: { en: "A calculator or a phone, paper and pencil", es: "Una calculadora o un teléfono, papel y lápiz" },
      steps: {
        en: [
          "Divide 3 by 4 on a calculator: 0.75. It stops. It is a terminating decimal and a rational number.",
          "Divide 1 by 3: 0.3333… It repeats. It is also rational, because it equals 1/3.",
          "Find pi on the calculator: 3.14159… Ask: does it stop or repeat? It does neither, so it is irrational.",
          "Sort numbers into two piles: can be a fraction, and cannot be a fraction.",
        ],
        es: [
          "Dividan 3 entre 4 en una calculadora: 0.75. Se acaba. Es un decimal finito y un número racional.",
          "Dividan 1 entre 3: 0.3333… Se repite. También es racional, porque es igual a 1/3.",
          "Busquen pi en la calculadora: 3.14159… Pregunten: ¿se acaba o se repite? No hace ninguna de las dos cosas, así que es irracional.",
          "Clasifiquen números en dos montones: se puede escribir como fracción y no se puede escribir como fracción.",
        ],
      },
    },
  ],
  say_it: [
    { en: "[0.75] is a type of [rational] number that [stops after two digits].", es: "[0.75] es un tipo de número [racional] que [se acaba después de dos dígitos]." },
    { en: "The exponent [7] tells me to move the decimal point [7] places to the [right].", es: "El exponente [7] me dice que mueva el punto decimal [7] lugares hacia la [derecha]." },
    { en: "[Pi] is not [rational] because [its decimal never ends or repeats].", es: "[Pi] no es [racional] porque [su decimal nunca termina ni se repite]." },
    { en: "The square root of [49] is [7] because [7] × [7] = [49].", es: "La raíz cuadrada de [49] es [7] porque [7] × [7] = [49]." },
  ],
  help: {
    en: [
      "You do not need to know scientific notation. Ask your child to show you how a number gets shorter.",
      "Use real big numbers: city populations, prices of houses, distances to far places.",
      "Ask \"how do you know?\" and let your child check with a calculator.",
      "Say the numbers aloud in any language. Naming them is part of understanding them.",
    ],
    es: [
      "No necesitan saber notación científica. Pídanle a su hijo o hija que les muestre cómo un número se hace más corto.",
      "Usen números grandes reales: habitantes de ciudades, precios de casas, distancias a lugares lejanos.",
      "Pregunten \"¿cómo lo sabes?\" y dejen que lo revise con una calculadora.",
      "Digan los números en voz alta en cualquier idioma. Nombrarlos es parte de entenderlos.",
    ],
  },
  home_language: {
    en: "Many words are almost the same in Spanish: exponent (exponente), base (base), rational (racional), irrational (irracional), estimate (estimar). Say \"diez a la séptima\" for 10⁷ and \"raíz cuadrada de 49\" as you work. In some Spanish-speaking places, big numbers use a period instead of a comma, so 1.000.000 is the same as 1,000,000.",
    es: "Muchas palabras son casi iguales en inglés: exponente (exponent), base (base), racional (rational), irracional (irrational), estimar (estimate). Digan \"diez a la séptima\" para 10⁷ y \"raíz cuadrada de 49\" mientras trabajan. En algunos lugares de habla hispana los números grandes llevan punto en vez de coma, así que 1.000.000 es igual a 1,000,000 en Estados Unidos.",
  },
  celebrate: {
    en: "You will know it is working when your child can take a very big or very small number and tell you, in any language, how to write it in a short way and what the exponent means.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda tomar un número muy grande o muy pequeño y decirles, en el idioma que quiera, cómo escribirlo de forma corta y qué significa el exponente.",
  },
};
