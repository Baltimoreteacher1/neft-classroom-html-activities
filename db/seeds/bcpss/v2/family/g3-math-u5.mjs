// BCPSS Family Guide (EN/ES) — g3-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on rounding, estimating, and adding and subtracting within 1,000. Vocabulary order matches ../units/g3-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning to round numbers to the nearest 10 or 100, to estimate, and to add and subtract numbers up to 1,000. It matters when someone checks a grocery bill, guesses the cost of a trip, or decides if an answer makes sense. Your child will explain why a number rounds up or down, in any language.",
    es: "Su hijo o hija está aprendiendo a redondear números a la decena o a la centena más cercana, a estimar y a sumar y restar números hasta el 1,000. Sirve cuando alguien revisa la cuenta del supermercado, calcula el costo de un viaje o decide si una respuesta tiene sentido. Su hijo o hija explicará por qué un número se redondea hacia arriba o hacia abajo, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can round to the nearest 10 or 100 and tell why.",
      "I can estimate a sum or a difference before I solve.",
      "I can add and subtract within 1,000 and check that my answer is reasonable.",
    ],
    es: [
      "Puedo redondear a la decena o a la centena más cercana y decir por qué.",
      "Puedo estimar una suma o una resta antes de solucionar.",
      "Puedo sumar y restar hasta 1,000 y comprobar que mi respuesta es razonable.",
    ],
  },
  vocab: [
    { term: "round", def_es: "cambiar un número por otro cercano, de una decena o centena, que es más fácil de usar", example_es: "Redondeo 46 a 50." },
    { term: "estimate", def_es: "hallar una respuesta que está cerca, pero no es exacta", example_es: "Voy a estimar antes de sumar para ver si mi respuesta tiene sentido." },
    { term: "nearest ten", def_es: "el número más cercano que termina en 0", example_es: "La decena más cercana a 73 es 70." },
    { term: "nearest hundred", def_es: "el número más cercano que termina en 00", example_es: "La centena más cercana a 462 es 500." },
    { term: "digit", def_es: "uno de los símbolos del 0 al 9 con los que se escriben los números", example_es: "El número 462 tiene tres dígitos." },
    { term: "place value", def_es: "cuánto vale un dígito según el lugar donde está en el número", example_es: "Por el valor posicional, el 6 de 462 vale 60." },
    { term: "regroup", def_es: "cambiar 10 de un lugar por 1 del siguiente lugar, o al revés", example_es: "Reagrupo 10 unidades como 1 decena." },
    { term: "sum", def_es: "la respuesta cuando sumas", example_es: "La suma de 300 y 200 es 500." },
    { term: "difference", def_es: "la respuesta cuando restas", example_es: "La diferencia entre 500 y 200 es 300." },
    { term: "reasonable", def_es: "que tiene sentido porque está cerca de lo que esperabas", example_es: "Mi respuesta es razonable porque está cerca de mi estimación." },
  ],
  talk: [
    { en: "What number did you round today? Which way did it go, up or down?", es: "¿Qué número redondeaste hoy? ¿Hacia dónde fue, hacia arriba o hacia abajo?" },
    { en: "Which digit next door told you what to do?", es: "¿Qué dígito de al lado te dijo qué hacer?" },
    { en: "What was your estimate before you solved?", es: "¿Cuál fue tu estimación antes de solucionar?" },
    { en: "How do you know your answer is reasonable?", es: "¿Cómo sabes que tu respuesta es razonable?" },
    { en: "When do we round or estimate in real life?", es: "¿Cuándo redondeamos o estimamos en la vida real?" },
  ],
  try_at_home: [
    {
      title: { en: "Round the Price Tag", es: "Redondear el precio" },
      minutes: 10,
      materials: { en: "A store flyer, a receipt, or labels from food packages; paper and a pencil", es: "Un folleto de la tienda, un recibo o etiquetas de empaques de comida; papel y lápiz" },
      steps: {
        en: [
          "Pick 3 items with whole-dollar prices, like $46, $73, and $128.",
          "Round each price to the nearest ten: $46 is about $50, $73 is about $70, $128 is about $130.",
          "Ask: how do you know $46 goes to $50? Look at the digit in the ones place.",
          "Add the rounded prices: 50 + 70 + 130 = 250. That is your estimate for the bill.",
        ],
        es: [
          "Elijan 3 productos con precios en dólares enteros, como $46, $73 y $128.",
          "Redondeen cada precio a la decena más cercana: $46 es casi $50, $73 es casi $70, $128 es casi $130.",
          "Pregunten: ¿cómo sabes que $46 va a $50? Miren el dígito del lugar de las unidades.",
          "Sumen los precios redondeados: 50 + 70 + 130 = 250. Esa es su estimación de la cuenta.",
        ],
      },
    },
    {
      title: { en: "Number Line Hill", es: "La loma de los números" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Draw a hill with 400 at the bottom left, 500 at the bottom right, and 450 at the top.",
          "Put a ball (a dot) on 462. Ask: which way does it roll, to 400 or to 500?",
          "Try 438, then 450. Numbers below the top roll down, and 450 rolls up to 500.",
          "Ask: what rule did you find? Say it with because.",
        ],
        es: [
          "Dibujen una loma con el 400 abajo a la izquierda, el 500 abajo a la derecha y el 450 arriba.",
          "Pongan una pelota (un punto) en el 462. Pregunten: ¿hacia dónde rueda, hacia el 400 o hacia el 500?",
          "Prueben con el 438 y luego con el 450. Los números antes de la cima ruedan hacia abajo, y el 450 rueda hacia el 500.",
          "Pregunten: ¿qué regla encontraste? Díganla con porque.",
        ],
      },
    },
    {
      title: { en: "Bus Ride Estimate", es: "Estimar el viaje en autobús" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Say: 287 people ride the bus in the morning and 198 ride in the afternoon. About how many in all?",
          "Round each to the nearest hundred: 287 is about 300 and 198 is about 200.",
          "Estimate: 300 + 200 = 500. Then solve exactly: 287 + 198 = 485.",
          "Ask: is 485 reasonable? How close is it to the estimate?",
        ],
        es: [
          "Digan: 287 personas viajan en el autobús por la mañana y 198 por la tarde. ¿Cuántas son más o menos en total?",
          "Redondeen cada número a la centena más cercana: 287 es casi 300 y 198 es casi 200.",
          "Estimen: 300 + 200 = 500. Luego resuelvan con exactitud: 287 + 198 = 485.",
          "Pregunten: ¿es razonable 485? ¿Qué tan cerca está de la estimación?",
        ],
      },
    },
    {
      title: { en: "Trade Ten for One", es: "Cambiar diez por uno" },
      minutes: 15,
      materials: { en: "20 to 30 small items (beans, pennies, buttons), a cup, paper", es: "De 20 a 30 objetos pequeños (frijoles, centavos, botones), un vaso y papel" },
      steps: {
        en: [
          "Say: let's solve 38 + 27. Make 3 cups of 10 and 8 loose beans, then 2 cups of 10 and 7 loose beans.",
          "Put all the loose beans together: 8 + 7 = 15. That is more than 10!",
          "Trade 10 loose beans for 1 new cup. Now you have 1 cup and 5 loose beans left.",
          "Count the cups: 3 + 2 + 1 = 6 tens. So the sum is 65. This trade is called regrouping.",
        ],
        es: [
          "Digan: vamos a calcular 38 + 27. Hagan 3 vasos de 10 y 8 frijoles sueltos, y luego 2 vasos de 10 y 7 frijoles sueltos.",
          "Junten todos los frijoles sueltos: 8 + 7 = 15. ¡Es más que 10!",
          "Cambien 10 frijoles sueltos por 1 vaso nuevo. Ahora tienen 1 vaso y quedan 5 frijoles sueltos.",
          "Cuenten los vasos: 3 + 2 + 1 = 6 decenas. Entonces la suma es 65. Este cambio se llama reagrupar.",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because the [tens] digit is [number], [number] rounds to [number].", es: "Porque el dígito de las [decenas] es [número], el [número] se redondea a [número]." },
    { en: "I estimated [number] + [number] = [number].", es: "Estimé [número] + [número] = [número]." },
    { en: "My answer is reasonable because ___.", es: "Mi respuesta es razonable porque ___." },
    { en: "I regrouped [number] ones as [number] ten, so ___.", es: "Reagrupé [número] unidades como [número] decena, entonces ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Ask for an estimate first, then the exact answer. Comparing the two builds number sense.",
      "Use real numbers from your day: prices, bus counts, steps, minutes.",
      "If an answer is far from the estimate, ask \"What could we check?\" instead of saying it is wrong.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Pidan primero una estimación y después la respuesta exacta. Compararlas desarrolla el sentido numérico.",
      "Usen números reales de su día: precios, pasajeros del autobús, pasos, minutos.",
      "Si una respuesta está lejos de la estimación, pregunten \"¿qué podemos revisar?\" en vez de decir que está mal.",
    ],
  },
  home_language: {
    en: "Estimate prices out loud in Spanish while you shop: \"más o menos cincuenta dólares.\" Then say the same estimate in English. Words like estimar, dígito, diferencia, and razonable sound a lot like estimate, digit, difference, and reasonable, so your child already knows them.",
    es: "Estimen precios en voz alta en español mientras compran: \"más o menos cincuenta dólares\". Luego digan la misma estimación en inglés. Palabras como estimar, dígito, diferencia y razonable suenan muy parecido a estimate, digit, difference y reasonable, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child makes a quick estimate before solving and tells you, in any language, why the answer makes sense.",
    es: "Sabrán que está funcionando cuando su hijo o hija haga una estimación rápida antes de solucionar y les cuente, en el idioma que quiera, por qué la respuesta tiene sentido.",
  },
};
