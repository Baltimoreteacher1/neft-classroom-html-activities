// BCPSS Family Guide (EN/ES) — g2-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 unit on add and subtract within 1,000. Vocabulary order matches ../units/g2-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to add and subtract three-digit numbers and to regroup when needed. We line up the digits by place value and work from the ones to the hundreds. It matters when we add up a bill, count steps, or compare big amounts. Your child will tell the steps in order: first, next, then, and last.",
    es: "Su hijo o hija está aprendiendo a sumar y restar números de tres dígitos y a reagrupar cuando hace falta. Alineamos los dígitos según su valor de posición y trabajamos de las unidades a las centenas. Sirve cuando sumamos una cuenta, contamos pasos o comparamos cantidades grandes. Su hijo o hija contará los pasos en orden: primero, después, luego y por último.",
  },
  goals: {
    en: [
      "I can add and subtract three-digit numbers and regroup when I need to.",
      "I can tell the steps in order with first, next, then, and last.",
    ],
    es: [
      "Puedo sumar y restar números de tres dígitos y reagrupar cuando lo necesito.",
      "Puedo decir los pasos en orden con primero, después, luego y por último.",
    ],
  },
  vocab: [
    { term: "hundreds", def_es: "grupos de cien; en el 352, el 3 representa 3 de estos; centenas", example_es: "El 352 tiene 3 centenas." },
    { term: "tens", def_es: "grupos de diez; en el 352, el 5 representa 5 de estos; decenas", example_es: "El 352 tiene 5 decenas." },
    { term: "ones", def_es: "las piezas sueltas que quedan después de hacer grupos de diez; en el 352, el 2; unidades", example_es: "El 352 tiene 2 unidades." },
    { term: "digit", def_es: "uno de los símbolos del 0 al 9 que usamos para escribir números", example_es: "El 352 tiene tres dígitos: 3, 5 y 2." },
    { term: "place value", def_es: "cuánto vale un dígito según el lugar donde está en el número", example_es: "En el 352, el 3 vale 300 por su lugar." },
    { term: "regroup", def_es: "reagrupar: cambiar 10 unidades por 1 decena, o 10 decenas por 1 centena", example_es: "Reagrupo 10 decenas como 1 centena." },
    { term: "align", def_es: "alinear: poner las cosas en fila para que queden en la misma columna", example_es: "Alineo los dígitos para que las unidades queden debajo de las unidades." },
    { term: "estimate", def_es: "estimar: hacer una idea inteligente que se acerca a la respuesta real", example_es: "Estimo que 298 + 401 es casi 700." },
    { term: "total", def_es: "la cantidad completa después de sumar todo", example_es: "El total de la cuenta es 456 dólares." },
  ],
  talk: [
    { en: "What did you do first? Next? Then? Last?", es: "¿Qué hiciste primero? ¿Después? ¿Luego? ¿Por último?" },
    { en: "Why did you line up the digits?", es: "¿Por qué alineaste los dígitos?" },
    { en: "When did you need to regroup? Show me.", es: "¿Cuándo tuviste que reagrupar? Muéstrame." },
    { en: "What is your estimate? Does the total make sense?", es: "¿Cuál es tu estimación? ¿El total tiene sentido?" },
    { en: "Where do we use big numbers in daily life?", es: "¿Dónde usamos números grandes en la vida diaria?" },
  ],
  try_at_home: [
    {
      title: { en: "Line Up the Digits", es: "Alinear los dígitos" },
      minutes: 10,
      materials: { en: "Graph paper or lined paper turned sideways, a pencil", es: "Papel cuadriculado o papel rayado en posición horizontal, y un lápiz" },
      steps: {
        en: [
          "Pick a problem, like 245 plus 132.",
          "Write the numbers so that hundreds, tens, and ones sit in the same column.",
          "Ask: why is it important to line them up?",
          "Add the ones first, then the tens, then the hundreds. Say each step out loud.",
        ],
        es: [
          "Elijan un problema, como 245 más 132.",
          "Escriban los números de modo que las centenas, las decenas y las unidades queden en la misma columna.",
          "Pregunten: ¿por qué es importante alinearlos?",
          "Sumen primero las unidades, luego las decenas y después las centenas. Digan cada paso en voz alta.",
        ],
      },
    },
    {
      title: { en: "Regroup with Beans and Cups", es: "Reagrupar con frijoles y tazas" },
      minutes: 15,
      materials: { en: "Dry beans, 3 cups labeled hundreds, tens, ones", es: "Frijoles secos y 3 tazas rotuladas: centenas, decenas, unidades" },
      steps: {
        en: [
          "Show 148 with beans in the cups.",
          "Add 35. Put 8 more in the ones cup, 3 more in the tens cup.",
          "If a cup has 10 or more, trade 10 for 1 in the next cup. Say: I regroup.",
          "Read the new number. Is it what you expected?",
        ],
        es: [
          "Muestren el 148 con frijoles en las tazas.",
          "Sumen 35. Pongan 3 frijoles más en la taza de las decenas y 5 más en la de las unidades.",
          "Si una taza tiene 10 o más, cambien 10 por 1 en la taza siguiente. Digan: reagrupo.",
          "Lean el nuevo número. ¿Es lo que esperaban?",
        ],
      },
    },
    {
      title: { en: "Estimate the Bill", es: "Estimar la cuenta" },
      minutes: 10,
      materials: { en: "Grocery receipts or flyers, paper, a pencil", es: "Recibos o folletos de la tienda, papel y un lápiz" },
      steps: {
        en: [
          "Find two big prices or amounts, like $230 and $175.",
          "Round to hundreds first: about 200 plus 200. That is the estimate.",
          "Find the exact total with place value.",
          "Compare the total to the estimate. Say: it is reasonable because...",
        ],
        es: [
          "Encuentren dos precios o cantidades grandes, como $230 y $175.",
          "Redondeen primero a centenas: más o menos 200 más 200. Esa es la estimación.",
          "Encuentren el total exacto con el valor de posición.",
          "Comparen el total con la estimación. Digan: es razonable porque...",
        ],
      },
    },
    {
      title: { en: "Take Away Steps", es: "Restar pasos" },
      minutes: 10,
      materials: { en: "Paper, a pencil, and a walk with a step counter or a guess at steps", es: "Papel, un lápiz y un paseo con un contador de pasos o una idea de cuántos pasos" },
      steps: {
        en: [
          "Pick a trip, like walking to the park: 345 steps.",
          "You have walked 120 steps so far. How many steps are left to the park?",
          "Subtract the hundreds, tens, and ones. Check by adding back.",
          "Say the steps with first, next, then, and last.",
        ],
        es: [
          "Elijan un camino, como ir al parque: 345 pasos.",
          "Ya caminaron 120 pasos. ¿Cuántos pasos faltan para llegar al parque?",
          "Resten las centenas, las decenas y las unidades. Comprueben sumando de regreso.",
          "Digan los pasos con primero, después, luego y por último.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First I line up the [digits]. Next I add the [ones].", es: "Primero alineo los [dígitos]. Después sumo las [unidades]." },
    { en: "I regroup [number] ones as [number] ten and [number] ones.", es: "Reagrupo [número] unidades como [número] decena y [número] unidades." },
    { en: "Last I add the [hundreds], so the total is [number].", es: "Por último sumo las [centenas], así que el total es [número]." },
    { en: "My estimate is [number], so my answer is [reasonable].", es: "Mi estimación es [número], así que mi respuesta es [razonable]." },
  ],
  help: {
    en: [
      "Ask \"what did you do first?\" and listen to the steps. You do not need to know how.",
      "Use graph paper or lined paper turned sideways to help line up digits.",
      "Use beans or coins to show regrouping. Let your child trade 10 for 1.",
      "If you learned a different method, share it! Then ask your child to teach you theirs.",
    ],
    es: [
      "Pregunten \"¿qué hiciste primero?\" y escuchen los pasos. No necesitan saber cómo se hace.",
      "Usen papel cuadriculado o papel rayado en posición horizontal para alinear los dígitos.",
      "Usen frijoles o monedas para mostrar la reagrupación. Dejen que su hijo o hija cambie 10 por 1.",
      "Si ustedes aprendieron otro método, ¡compártanlo! Luego pidan a su hijo o hija que les enseñe el suyo.",
    ],
  },
  home_language: {
    en: "Many Spanish-speaking families learned to add and subtract with a different written method. Share yours in Spanish, then compare it with your child's method. Look for twins: \"estimar\" and \"estimate,\" \"total\" and \"total,\" and \"alinear\" and \"align.\"",
    es: "Muchas familias hispanohablantes aprendieron a sumar y restar con otro método escrito. Compartan el suyo en español y luego compárenlo con el método de su hijo o hija. Busquen gemelas: \"estimar\" y \"estimate\", \"total\" y \"total\", \"alinear\" y \"align\".",
  },
  celebrate: {
    en: "You will know it is working when your child adds or subtracts three-digit numbers on paper, regroups when needed, and tells the steps in order.",
    es: "Sabrán que está funcionando cuando su hijo o hija sume o reste números de tres dígitos en papel, reagrupe cuando haga falta y cuente los pasos en orden.",
  },
};
