// BCPSS Family Guide (EN/ES) — g2-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 unit on three-digit numbers. Vocabulary order matches ../units/g2-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to read, write, and compare three-digit numbers up to 1,000. Each digit has a place value: hundreds, tens, and ones. It matters when we read prices, house numbers, or bus numbers. Your child will say which number is greater and give a reason with because.",
    es: "Su hijo o hija está aprendiendo a leer, escribir y comparar números de tres dígitos hasta 1,000. Cada dígito tiene un valor según su lugar: centenas, decenas y unidades. Sirve cuando leemos precios, números de casas o números de autobuses. Su hijo o hija dirá cuál número es mayor y dará una razón con la palabra porque.",
  },
  goals: {
    en: [
      "I can read, write, and compare three-digit numbers up to 1,000.",
      "I can tell which number is greater and give a reason with because.",
    ],
    es: [
      "Puedo leer, escribir y comparar números de tres dígitos hasta 1,000.",
      "Puedo decir cuál número es mayor y dar una razón con porque.",
    ],
  },
  vocab: [
    { term: "digit", def_es: "uno de los diez símbolos, del 0 al 9, que usamos para escribir números", example_es: "El número 352 tiene tres dígitos." },
    { term: "place value", def_es: "cuánto vale un dígito según el lugar donde está en el número", example_es: "En el 352, el 5 vale 50 por su lugar." },
    { term: "hundred", def_es: "una centena: un grupo de 10 decenas", example_es: "Diez decenas forman una centena." },
    { term: "ten", def_es: "una decena: un grupo de 10 unidades", example_es: "Diez unidades forman una decena." },
    { term: "expanded form", def_es: "la forma desarrollada: escribir un número como una suma de los valores de sus lugares", example_es: "En forma desarrollada, 214 es 200 + 10 + 4." },
    { term: "word form", def_es: "escribir un número con letras en vez de dígitos", example_es: "El 214 se escribe con letras: doscientos catorce." },
    { term: "compare", def_es: "mirar dos números y decir en qué se parecen y en qué son diferentes", example_es: "Voy a comparar el 546 y el 538." },
    { term: "greater than", def_es: "más grande en cantidad que otro número", example_es: "El 546 es mayor que el 538." },
    { term: "less than", def_es: "más pequeño en cantidad que otro número", example_es: "El 538 es menor que el 546." },
    { term: "equal to", def_es: "que tiene la misma cantidad que otro número", example_es: "El 300 es igual a tres centenas." },
  ],
  talk: [
    { en: "How many hundreds, tens, and ones are in this number?", es: "¿Cuántas centenas, decenas y unidades hay en este número?" },
    { en: "Which number is greater? How do you know?", es: "¿Cuál número es mayor? ¿Cómo lo sabes?" },
    { en: "Can you say this number with words? Can you write it with digits?", es: "¿Puedes decir este número con palabras? ¿Puedes escribirlo con dígitos?" },
    { en: "What happens to the number if the 5 moves to a different place?", es: "¿Qué le pasa al número si el 5 cambia de lugar?" },
    { en: "Where do we see three-digit numbers around us?", es: "¿Dónde vemos números de tres dígitos a nuestro alrededor?" },
  ],
  try_at_home: [
    {
      title: { en: "Build It with Beans", es: "Formar números con frijoles" },
      minutes: 15,
      materials: { en: "Dry beans, 3 cups or bowls, and paper labels: hundreds, tens, ones", es: "Frijoles secos, 3 tazas o tazones, y etiquetas de papel: centenas, decenas, unidades" },
      steps: {
        en: [
          "Say a number, like 246. Your child puts 2 beans in the hundreds cup, 4 in the tens cup, and 6 in the ones cup. Each bean stands for 100, 10, or 1.",
          "Ask: what does each cup mean? How much is the hundreds cup worth?",
          "Change one digit and ask: what number is this now?",
          "Switch. Your child says a number and you place the beans.",
        ],
        es: [
          "Digan un número, como 246. Su hijo o hija pone 2 frijoles en la taza de las centenas, 4 en la de las decenas y 6 en la de las unidades. Cada frijol vale 100, 10 o 1.",
          "Pregunten: ¿qué significa cada taza? ¿Cuánto vale la taza de las centenas?",
          "Cambien un dígito y pregunten: ¿qué número es ahora?",
          "Cambien de turno. Su hijo o hija dice un número y ustedes ponen los frijoles.",
        ],
      },
    },
    {
      title: { en: "House Number Hunt", es: "Cacería de números de casas" },
      minutes: 10,
      materials: { en: "A walk around the block, paper, a pencil", es: "Un paseo por la cuadra, papel y un lápiz" },
      steps: {
        en: [
          "Look for numbers on houses, doors, and signs with 3 digits.",
          "Write two numbers you find. Say each one out loud.",
          "Ask: which is greater? How do you know? Look at the hundreds first.",
          "Write one in expanded form, like 214 = 200 + 10 + 4.",
        ],
        es: [
          "Busquen números de 3 dígitos en casas, puertas y letreros.",
          "Escriban dos números que encuentren. Digan cada uno en voz alta.",
          "Pregunten: ¿cuál es mayor? ¿Cómo lo saben? Miren primero las centenas.",
          "Escriban uno en forma desarrollada, como 214 = 200 + 10 + 4.",
        ],
      },
    },
    {
      title: { en: "Greater Than Cards", es: "Cartas del número mayor" },
      minutes: 10,
      materials: { en: "A deck of cards (take out the face cards) or 30 paper cards numbered 0 to 9", es: "Una baraja (sin las figuras) o 30 cartas de papel numeradas del 0 al 9" },
      steps: {
        en: [
          "Each player turns over 3 cards and makes a 3-digit number.",
          "Compare the numbers. Start with the hundreds digit.",
          "Say: [number] is greater than [number] because it has more hundreds.",
          "The player with the greater number takes both cards.",
        ],
        es: [
          "Cada jugador voltea 3 cartas y forma un número de 3 dígitos.",
          "Comparen los números. Empiecen con el dígito de las centenas.",
          "Digan: el [número] es mayor que el [número] porque tiene más centenas.",
          "El jugador con el número mayor se lleva las dos cartas.",
        ],
      },
    },
    {
      title: { en: "Write It in Words", es: "Escribirlo con letras" },
      minutes: 10,
      materials: { en: "Paper, a pencil, grocery store flyers or receipts", es: "Papel, un lápiz y folletos o recibos de la tienda" },
      steps: {
        en: [
          "Find a number with 3 digits on a flyer or sign.",
          "Say it out loud with words, like \"two hundred fourteen.\"",
          "Write it with words and with digits, side by side.",
          "Ask: what does the 2 mean? What does the 1 mean?",
        ],
        es: [
          "Busquen un número de 3 dígitos en un folleto o letrero.",
          "Díganlo en voz alta con palabras, como \"doscientos catorce\".",
          "Escríbanlo con letras y con dígitos, uno al lado del otro.",
          "Pregunten: ¿qué significa el 2? ¿Qué significa el 1?",
        ],
      },
    },
  ],
  say_it: [
    { en: "[546] is greater than [538] because it has more [tens].", es: "El [546] es mayor que el [538] porque tiene más [decenas]." },
    { en: "Both numbers have [5] hundreds, but [546] has [4] tens.", es: "Los dos números tienen [5] centenas, pero el [546] tiene [4] decenas." },
    { en: "The word form of [214] is [two hundred fourteen].", es: "El [214] se escribe con letras: [doscientos catorce]." },
    { en: "[Number] is [200 + 10 + 4] in expanded form.", es: "El [número] es [200 + 10 + 4] en forma desarrollada." },
  ],
  help: {
    en: [
      "Ask questions and listen. Your child can teach you how place value works.",
      "Say \"show me\" and \"how do you know?\" in any language.",
      "Use beans or coins to make tens and hundreds. Touching things helps.",
      "If your child gets mixed up, build the numbers with objects and look at the hundreds first.",
    ],
    es: [
      "Hagan preguntas y escuchen. Su hijo o hija puede enseñarles cómo funciona el valor de posición.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma.",
      "Usen frijoles o monedas para formar decenas y centenas. Tocar las cosas ayuda.",
      "Si su hijo o hija se confunde, formen los números con objetos y miren primero las centenas.",
    ],
  },
  home_language: {
    en: "Say three-digit numbers in Spanish and in English. \"Doscientos catorce\" and \"two hundred fourteen\" both name the hundreds first. \"Dígito\" and \"digit,\" \"comparar\" and \"compare,\" and \"centena\" and \"hundred\" can help your child find the match.",
    es: "Digan los números de tres dígitos en español y en inglés. \"Doscientos catorce\" y \"two hundred fourteen\" nombran primero las centenas. \"Dígito\" y \"digit\", \"comparar\" y \"compare\" ayudan a su hijo o hija a encontrar la pareja de cada palabra.",
  },
  celebrate: {
    en: "You will know it is working when your child reads a three-digit number, shows it with objects, and tells which of two numbers is greater using the word because.",
    es: "Sabrán que está funcionando cuando su hijo o hija lea un número de tres dígitos, lo muestre con objetos y diga cuál de dos números es mayor usando la palabra porque.",
  },
};
