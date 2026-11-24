// BCPSS Family Guide (EN/ES) — g2-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 unit on time, money and line plots. Vocabulary order matches ../units/g2-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning to tell time to 5 minutes, add coins and dollars, and read a line plot. It matters when we check the clock, pay at the store, or count how many of something we have. Your child will make a claim and prove it with evidence, using because and according to.",
    es: "Su hijo o hija está aprendiendo a decir la hora de 5 en 5 minutos, a sumar monedas y dólares y a leer un diagrama de puntos. Sirve cuando miramos el reloj, pagamos en la tienda o contamos cuántas cosas de algo tenemos. Su hijo o hija hará una afirmación y la comprobará con evidencia, usando porque y según.",
  },
  goals: {
    en: [
      "I can tell time to 5 minutes and add coins and dollars.",
      "I can read a line plot.",
      "I can make a claim and prove it with evidence.",
    ],
    es: [
      "Puedo decir la hora de 5 en 5 minutos y sumar monedas y dólares.",
      "Puedo leer un diagrama de puntos.",
      "Puedo hacer una afirmación y comprobarla con evidencia.",
    ],
  },
  vocab: [
    { term: "minute", def_es: "un minuto: una cantidad pequeña de tiempo; 60 de ellos forman una hora", example_es: "Faltan cinco minutos para las tres." },
    { term: "AM", def_es: "las horas desde la medianoche hasta el mediodía; de la mañana", example_es: "Desayuno a las 7 de la mañana (7 AM)." },
    { term: "PM", def_es: "las horas desde el mediodía hasta la medianoche; de la tarde o de la noche", example_es: "Ceno a las 6 de la tarde (6 PM)." },
    { term: "coin", def_es: "una moneda: una pieza pequeña y redonda de metal que vale dinero", example_es: "Tengo tres monedas en el bolsillo." },
    { term: "value", def_es: "el valor: cuánto vale una moneda o un número", example_es: "El valor de una moneda de 10 centavos es 10." },
    { term: "dollar", def_es: "un dólar: dinero que vale 100 centavos", example_es: "Cien centavos forman un dólar." },
    { term: "line plot", def_es: "un diagrama de puntos: una recta numérica con equis encima que muestra cuántos hay de cada medida", example_es: "El diagrama de puntos muestra cuántos lápices miden 5 pulgadas." },
    { term: "data", def_es: "datos: números o hechos que juntas para contestar una pregunta", example_es: "Los datos dicen cuántos niños llevan almuerzo." },
    { term: "evidence", def_es: "evidencia: hechos que muestran que lo que dices es verdad", example_es: "Mi evidencia son las tres equis del diagrama." },
  ],
  talk: [
    { en: "What time is it? How do you know?", es: "¿Qué hora es? ¿Cómo lo sabes?" },
    { en: "How much money is this? How did you count it?", es: "¿Cuánto dinero es esto? ¿Cómo lo contaste?" },
    { en: "What does the line plot tell us?", es: "¿Qué nos dice el diagrama de puntos?" },
    { en: "What is your claim? What is your evidence?", es: "¿Cuál es tu afirmación? ¿Cuál es tu evidencia?" },
    { en: "When do we count money or check the time at home?", es: "¿Cuándo contamos dinero o miramos la hora en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Clock to the Five", es: "El reloj de 5 en 5" },
      minutes: 10,
      materials: { en: "A clock with hands (or a paper plate clock), a pencil", es: "Un reloj con manecillas (o un reloj de plato de papel) y un lápiz" },
      steps: {
        en: [
          "Look at the clock together. Count by fives around the clock: 5, 10, 15...",
          "Say a time, like 3:25. Your child puts the hands there.",
          "Ask: is that AM or PM? What do we usually do at that time?",
          "Switch. Your child sets a time and you read it.",
        ],
        es: [
          "Miren el reloj juntos. Cuenten de cinco en cinco alrededor del reloj: 5, 10, 15...",
          "Digan una hora, como las 3:25. Su hijo o hija pone las manecillas ahí.",
          "Pregunten: ¿es de la mañana (AM) o de la tarde (PM)? ¿Qué solemos hacer a esa hora?",
          "Cambien de turno. Su hijo o hija pone una hora y ustedes la leen.",
        ],
      },
    },
    {
      title: { en: "Coin Counting", es: "Contar monedas" },
      minutes: 15,
      materials: { en: "Real coins: pennies, nickels, dimes, quarters, and a few paper dollars", es: "Monedas de verdad: de 1, 5, 10 y 25 centavos, y unos dólares de papel" },
      steps: {
        en: [
          "Put out a small handful of coins. Name each coin and its value.",
          "Sort the coins. Count the biggest value first, then the smaller ones.",
          "Say the total: how many cents? Can you make a dollar?",
          "Ask: how do you know it is that much? Show the evidence.",
        ],
        es: [
          "Pongan un puñado pequeño de monedas. Nombren cada moneda y su valor.",
          "Clasifiquen las monedas. Cuenten primero las de mayor valor y luego las más pequeñas.",
          "Digan el total: ¿cuántos centavos son? ¿Pueden formar un dólar?",
          "Pregunten: ¿cómo sabes que es esa cantidad? Muestra la evidencia.",
        ],
      },
    },
    {
      title: { en: "Play Store", es: "Jugar a la tienda" },
      minutes: 15,
      materials: { en: "Coins, small items with price tags up to $1, paper", es: "Monedas, artículos pequeños con precio de hasta un dólar y papel" },
      steps: {
        en: [
          "Set prices on small things, like a spoon for 35 cents.",
          "Your child chooses two items and finds the total cost.",
          "Pay with coins. Ask: what coins could you use? Is there another way?",
          "Say: the total is [number] cents because [reason].",
        ],
        es: [
          "Pongan precios a cosas pequeñas, como una cuchara por 35 centavos.",
          "Su hijo o hija elige dos artículos y halla el costo total.",
          "Paguen con monedas. Pregunten: ¿qué monedas podrías usar? ¿Hay otra manera?",
          "Digan: el total es [número] centavos porque [razón].",
        ],
      },
    },
    {
      title: { en: "Family Line Plot", es: "Diagrama de puntos de la familia" },
      minutes: 15,
      materials: { en: "Paper, a pencil, a ruler, 8 to 10 pencils or spoons to measure", es: "Papel, un lápiz, una regla y de 8 a 10 lápices o cucharas para medir" },
      steps: {
        en: [
          "Measure each pencil to the nearest inch. Write each length.",
          "Draw a number line with inches. Put an X above the length for each pencil.",
          "Ask: which length has the most Xs? How many pencils are 5 inches?",
          "Say: according to the line plot, [number] inches has [number] Xs.",
        ],
        es: [
          "Midan cada lápiz a la pulgada más cercana. Escriban cada longitud.",
          "Dibujen una recta numérica con pulgadas. Pongan una equis sobre la longitud de cada lápiz.",
          "Pregunten: ¿qué longitud tiene más equis? ¿Cuántos lápices miden 5 pulgadas?",
          "Digan: según el diagrama de puntos, [número] pulgadas tiene [número] equis.",
        ],
      },
    },
  ],
  say_it: [
    { en: "According to the line plot, [number] inches has [number] Xs.", es: "Según el diagrama de puntos, [número] pulgadas tiene [número] equis." },
    { en: "I know the value is [number] cents because [reason].", es: "Sé que el valor es [número] centavos porque [razón]." },
    { en: "The clock shows [time] [AM / PM] because [reason].", es: "El reloj muestra las [hora] [AM / PM] porque [razón]." },
    { en: "My claim is [claim]. My evidence is [evidence].", es: "Mi afirmación es [afirmación]. Mi evidencia es [evidencia]." },
  ],
  help: {
    en: [
      "Use real coins and a real clock. Let your child count and tell you the answer.",
      "Ask \"how do you know?\" and listen for evidence, like a number or a picture.",
      "Do not worry about knowing English money words. Coins have pictures and numbers.",
      "Let your child set the clock and tell you the time each day.",
    ],
    es: [
      "Usen monedas de verdad y un reloj de verdad. Dejen que su hijo o hija cuente y les diga la respuesta.",
      "Pregunten \"¿cómo lo sabes?\" y escuchen la evidencia, como un número o un dibujo.",
      "No se preocupen por saber las palabras del dinero en inglés. Las monedas tienen dibujos y números.",
      "Dejen que su hijo o hija ponga la hora en el reloj y se las diga cada día.",
    ],
  },
  home_language: {
    en: "Talk about time and money in Spanish and in English. \"Minuto\" and \"minute,\" \"dólar\" and \"dollar,\" \"valor\" and \"value,\" \"datos\" and \"data,\" and \"evidencia\" and \"evidence\" are twins. Ask your child to say each pair.",
    es: "Hablen del tiempo y del dinero en español y en inglés. \"Minuto\" y \"minute\", \"dólar\" y \"dollar\", \"valor\" y \"value\", \"datos\" y \"data\", y \"evidencia\" y \"evidence\" son gemelas. Pidan a su hijo o hija que diga cada pareja.",
  },
  celebrate: {
    en: "You will know it is working when your child tells the time to 5 minutes, counts a handful of coins, and reads a line plot with a claim and evidence.",
    es: "Sabrán que está funcionando cuando su hijo o hija diga la hora de 5 en 5 minutos, cuente un puñado de monedas y lea un diagrama de puntos con una afirmación y evidencia.",
  },
};
