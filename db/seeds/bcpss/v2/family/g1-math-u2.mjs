// BCPSS Family Guide (EN/ES) — g1-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on place value to 100. Vocabulary order matches ../units/g1-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning that a two-digit number is made of tens and ones, and that the place of a digit tells how much it is worth. It matters when we count money, pages in a book, or houses on the block. Your child will compare two numbers and say how they are alike and different.",
    es: "Su hijo o hija está aprendiendo que un número de dos dígitos se forma con decenas y unidades, y que el lugar de un dígito dice cuánto vale. Sirve cuando contamos dinero, páginas de un libro o casas de la cuadra. Su hijo o hija comparará dos números y dirá en qué se parecen y en qué son diferentes.",
  },
  goals: {
    en: [
      "I can show a two-digit number as tens and ones.",
      "I can compare two numbers and tell how they are alike and different.",
    ],
    es: [
      "Puedo mostrar un número de dos dígitos como decenas y unidades.",
      "Puedo comparar dos números y decir en qué se parecen y en qué son diferentes.",
    ],
  },
  vocab: [
    { term: "digit", def_es: "uno de los símbolos del 0 al 9 que se usan para escribir números", example_es: "El número 47 tiene dos dígitos: el 4 y el 7." },
    { term: "tens", def_es: "grupos de 10 que forman un número; decenas", example_es: "En el 47 hay 4 decenas." },
    { term: "ones", def_es: "cosas sueltas que sobran después de hacer grupos de 10; unidades", example_es: "En el 47 hay 7 unidades." },
    { term: "place value", def_es: "cuánto vale un dígito según el lugar donde está", example_es: "En el 52, el 5 vale 50 por el lugar donde está." },
    { term: "hundred", def_es: "diez grupos de diez, que se escribe 100", example_es: "Diez decenas forman cien." },
    { term: "compare", def_es: "mirar dos números para ver en qué se parecen y en qué son diferentes", example_es: "Voy a comparar el 34 y el 43." },
    { term: "greater than", def_es: "más grande en cantidad", example_es: "El 45 es mayor que el 39." },
    { term: "less than", def_es: "más pequeño en cantidad", example_es: "El 28 es menor que el 82." },
    { term: "equal to", def_es: "exactamente la misma cantidad", example_es: "Diez unidades son iguales a una decena." },
  ],
  talk: [
    { en: "How many tens and how many ones are in this number?", es: "¿Cuántas decenas y cuántas unidades hay en este número?" },
    { en: "Which number is greater? How do you know?", es: "¿Cuál número es mayor? ¿Cómo lo sabes?" },
    { en: "How are these two numbers alike? How are they different?", es: "¿En qué se parecen estos dos números? ¿En qué son diferentes?" },
    { en: "Can you show me this number with objects?", es: "¿Puedes mostrarme este número con objetos?" },
    { en: "Where do we see two-digit numbers at home or on the street?", es: "¿Dónde vemos números de dos dígitos en la casa o en la calle?" },
  ],
  try_at_home: [
    {
      title: { en: "Bundles of Ten", es: "Paquetes de diez" },
      minutes: 15,
      materials: { en: "30 to 50 beans, pasta, or craft sticks, and cups or rubber bands", es: "De 30 a 50 frijoles, pasta o palitos, y tazas o ligas" },
      steps: {
        en: [
          "Say a two-digit number, like 34. Your child makes groups of 10 with cups or bands.",
          "Count the groups: those are the tens. Count the loose ones.",
          "Say: 34 is 3 tens and 4 ones.",
          "Switch. Your child names a number for you to build.",
        ],
        es: [
          "Digan un número de dos dígitos, como 34. Su hijo o hija forma grupos de 10 con tazas o ligas.",
          "Cuenten los grupos: esas son las decenas. Cuenten las unidades sueltas.",
          "Digan: 34 es 3 decenas y 4 unidades.",
          "Cambien de turno. Su hijo o hija dice un número para que ustedes lo formen.",
        ],
      },
    },
    {
      title: { en: "Coin Tens and Ones", es: "Monedas de diez y de uno" },
      minutes: 10,
      materials: { en: "Dimes and pennies (or paper circles marked 10 and 1)", es: "Monedas de 10 y de 1 centavo (o círculos de papel marcados con 10 y 1)" },
      steps: {
        en: [
          "Lay out 4 dimes and 7 pennies. Ask: how much money is this?",
          "Count by tens for the dimes, then count on by ones.",
          "Say: 4 tens and 7 ones is 47.",
          "Make a different amount. Ask: which amount is greater?",
        ],
        es: [
          "Pongan 4 monedas de 10 y 7 de 1 centavo. Pregunten: ¿cuánto dinero es?",
          "Cuenten de diez en diez las monedas de 10 y luego sigan de uno en uno.",
          "Digan: 4 decenas y 7 unidades es 47.",
          "Formen otra cantidad. Pregunten: ¿cuál cantidad es mayor?",
        ],
      },
    },
    {
      title: { en: "Bigger Number Cards", es: "Cartas del número más grande" },
      minutes: 10,
      materials: { en: "Paper cards numbered 0 to 9, two for each digit (or a deck of cards)", es: "Cartas de papel numeradas del 0 al 9, dos de cada dígito (o una baraja)" },
      steps: {
        en: [
          "Each player turns over two cards and makes a two-digit number.",
          "Say how many tens and ones each number has.",
          "Ask: whose number is greater? How do you know?",
          "The player with the greater number keeps the cards.",
        ],
        es: [
          "Cada jugador voltea dos cartas y forma un número de dos dígitos.",
          "Digan cuántas decenas y unidades tiene cada número.",
          "Pregunten: ¿de quién es el número mayor? ¿Cómo lo saben?",
          "El jugador con el número mayor se queda con las cartas.",
        ],
      },
    },
    {
      title: { en: "Count to One Hundred", es: "Contar hasta cien" },
      minutes: 10,
      materials: { en: "A walk or a hallway, or 100 small things in groups of ten", es: "Un paseo o un pasillo, o 100 cositas en grupos de diez" },
      steps: {
        en: [
          "Count by tens to 100 together: 10, 20, 30...",
          "Stop at any ten and say: how many tens is that?",
          "Count on by ones from a ten, like 30, 31, 32.",
          "Say: ten tens make one hundred!",
        ],
        es: [
          "Cuenten juntos de diez en diez hasta 100: 10, 20, 30...",
          "Paren en cualquier decena y pregunten: ¿cuántas decenas son?",
          "Sigan de uno en uno desde una decena, como 30, 31, 32.",
          "Digan: ¡diez decenas forman cien!",
        ],
      },
    },
  ],
  say_it: [
    { en: "[Number] has [4] tens and [7] ones.", es: "El [número] tiene [4] decenas y [7] unidades." },
    { en: "[Number] is greater than [number] because [reason].", es: "El [número] es mayor que el [número] porque [razón]." },
    { en: "Both [numbers] have [shared feature].", es: "Los dos [números] tienen [algo en común]." },
    { en: "[Number] is less than [number] because it has fewer [tens].", es: "El [número] es menor que el [número] porque tiene menos [decenas]." },
  ],
  help: {
    en: [
      "Use real things to make tens: beans in cups, coins, craft sticks.",
      "Ask \"how do you know?\" and let your child show you.",
      "Say numbers aloud together, in Spanish and in English.",
      "If your child mixes up 34 and 43, build both with objects and look at the tens.",
    ],
    es: [
      "Usen cosas de verdad para formar decenas: frijoles en tazas, monedas, palitos.",
      "Pregunten \"¿cómo lo sabes?\" y dejen que su hijo o hija les muestre.",
      "Digan los números en voz alta juntos, en español y en inglés.",
      "Si su hijo o hija confunde el 34 con el 43, formen los dos con objetos y miren las decenas.",
    ],
  },
  home_language: {
    en: "Count to 100 in Spanish and in English. Ask your child which words sound alike, like \"dígito\" and \"digit,\" \"comparar\" and \"compare.\" The pattern of tens works the same in both languages: \"treinta, cuarenta, cincuenta.\"",
    es: "Cuenten hasta 100 en español y en inglés. Pregunten a su hijo o hija qué palabras suenan parecido, como \"dígito\" y \"digit\", \"comparar\" y \"compare\". El patrón de las decenas funciona igual en los dos idiomas: \"treinta, cuarenta, cincuenta\".",
  },
  celebrate: {
    en: "You will know it is working when your child shows a two-digit number with objects, says how many tens and ones it has, and tells which of two numbers is greater.",
    es: "Sabrán que está funcionando cuando su hijo o hija muestre un número de dos dígitos con objetos, diga cuántas decenas y unidades tiene y diga cuál de dos números es mayor.",
  },
};
