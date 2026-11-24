// BCPSS Family Guide (EN/ES) — g6-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 6 Science unit on weathering, erosion, and deposition. Vocabulary order matches ../units/g6-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how water breaks rock into pieces, carries it away, and drops it somewhere new. It matters for the creeks near our homes, for muddy water after a rainstorm, and for the way the Chesapeake Bay is shaped. Your child will also use rates, like grams for every centimeter, to predict how much sand water can move.",
    es: "Su hijo o hija está aprendiendo cómo el agua rompe la roca en pedacitos, se los lleva y los deja en otro lugar. Importa para los arroyos cerca de nuestras casas, para el agua turbia después de una tormenta y para la forma de la bahía de Chesapeake. Su hijo o hija también usará tasas, como gramos por cada centímetro, para predecir cuánta arena puede mover el agua.",
  },
  goals: {
    en: [
      "I can tell weathering, erosion, and deposition apart.",
      "I can explain how slope changes how much sediment moves.",
      "I can use a rate to predict how much sand will move.",
    ],
    es: [
      "Puedo distinguir entre meteorización, erosión y deposición.",
      "Puedo explicar cómo la pendiente cambia cuánto sedimento se mueve.",
      "Puedo usar una tasa para predecir cuánta arena se moverá.",
    ],
  },
  vocab: [
    { term: "weathering", def_es: "cuando la roca se rompe poco a poco en pedazos más pequeños, sin moverse de su lugar", example_es: "La lluvia y el hielo van rompiendo la roca por meteorización." },
    { term: "erosion", def_es: "cuando el agua, el viento o el hielo se llevan pedacitos de roca y tierra; es casi igual en inglés", example_es: "La erosión se llevó la tierra de la orilla del arroyo." },
    { term: "deposition", def_es: "cuando el agua o el viento sueltan los pedacitos en un lugar nuevo porque van más despacio", example_es: "La deposición dejó arena en la orilla cuando el río se hizo lento." },
    { term: "sediment", def_es: "pedacitos de roca, arena y tierra que el agua puede cargar", example_es: "El agua turbia lleva mucho sedimento." },
    { term: "elevation", def_es: "qué tan alto está un lugar sobre el nivel del mar; se parece a la palabra en inglés", example_es: "La elevación de la montaña es mucho mayor que la de la playa." },
    { term: "slope", def_es: "qué tan empinado es el terreno", example_es: "Cuando la pendiente es más empinada, el agua corre más rápido." },
    { term: "runoff", def_es: "agua de lluvia que corre sobre el suelo en vez de meterse en la tierra", example_es: "Después de la tormenta, la escorrentía bajó por la calle hacia el desagüe." },
    { term: "delta", def_es: "una zona nueva de tierra en forma de abanico, hecha de sedimento donde un río llega a un agua más grande", example_es: "El delta se formó donde el río llega al mar." },
    { term: "rate", def_es: "cuánto cambia algo en un tiempo dado o por cada unidad", example_es: "La tasa es de 4 gramos de arena por cada centímetro de pendiente." },
    { term: "proportional", def_es: "que cambian juntos: si una cantidad se duplica, la otra también se duplica", example_es: "La arena que se mueve es proporcional a la pendiente." },
  ],
  talk: [
    { en: "Where have you seen muddy water after rain? Where do you think the dirt came from?", es: "¿Dónde has visto agua turbia después de la lluvia? ¿De dónde crees que vino la tierra?" },
    { en: "Does weathering move rock, or does it break it in place? How about erosion?", es: "¿La meteorización mueve la roca o la rompe en su lugar? ¿Y la erosión?" },
    { en: "What happens to sand and mud when a stream slows down?", es: "¿Qué pasa con la arena y el lodo cuando un arroyo se hace más lento?" },
    { en: "If the hill is twice as steep, what do you predict will happen to the sand?", es: "Si la loma es el doble de empinada, ¿qué predices que pasará con la arena?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Mini Stream Table", es: "Mini mesa de arroyo" },
      minutes: 20,
      materials: { en: "A baking pan, sand or dirt, a cup of water, a stack of books to tilt the pan", es: "Un molde para hornear, arena o tierra, un vaso de agua y una pila de libros para inclinar el molde" },
      steps: {
        en: [
          "Pile damp sand at the high end of the pan and tilt the pan on one book. Do this outside or over the sink.",
          "Slowly pour a cup of water at the top. Watch where the sand goes.",
          "Add a second book to make the slope steeper and try again with a new pile. What changes?",
          "Ask: where did the sand drop? Use the words erosion and deposition.",
        ],
        es: [
          "Pongan arena húmeda en el extremo alto del molde e inclínenlo sobre un libro. Háganlo afuera o sobre el fregadero.",
          "Echen despacio un vaso de agua desde arriba. Miren adónde va la arena.",
          "Agreguen un segundo libro para que la pendiente sea más empinada y repitan con un montón nuevo. ¿Qué cambia?",
          "Pregunten: ¿dónde soltó la arena el agua? Usen las palabras erosión y deposición.",
        ],
      },
    },
    {
      title: { en: "Rain Walk", es: "Paseo después de la lluvia" },
      minutes: 15,
      materials: { en: "A walk around the block after rain, or a look out the window", es: "Un paseo por la cuadra después de la lluvia o una mirada por la ventana" },
      steps: {
        en: [
          "Walk around the block after it rains. Look for places where water ran: gutters, driveways, dirt patches.",
          "Find a spot where you see sand, mud, or small gravel that was moved. Where did it stop?",
          "Ask your child: was the water moving fast or slow where it dropped the sediment?",
          "Look for runoff going to a storm drain. Ask where it might end up, and whether it could reach the Bay.",
        ],
        es: [
          "Caminen por la cuadra después de que llueva. Busquen lugares por donde corrió el agua: canaletas, entradas de autos, parches de tierra.",
          "Encuentren un lugar con arena, lodo o piedritas que se movieron. ¿Dónde se detuvieron?",
          "Pregunten a su hijo o hija: ¿el agua iba rápido o despacio donde dejó el sedimento?",
          "Busquen escorrentía que va a un desagüe. Pregunten adónde podría llegar y si podría llegar a la bahía.",
        ],
      },
    },
    {
      title: { en: "Rock Rub", es: "Frotar piedras" },
      minutes: 10,
      materials: { en: "Two soft rocks or two pieces of chalk, a jar with a lid, water", es: "Dos piedras blandas o dos pedazos de tiza, un frasco con tapa y agua" },
      steps: {
        en: [
          "Put the chalk pieces in a jar with a little water and put on the lid.",
          "Shake the jar hard for two minutes. This is like rocks tumbling in a fast stream.",
          "Open and look. What do you see in the water? What happened to the chalk pieces?",
          "Ask: is this weathering, erosion, or both? How do you know?",
        ],
        es: [
          "Pongan los pedazos de tiza en un frasco con un poco de agua y pónganle la tapa.",
          "Agiten el frasco fuerte durante dos minutos. Es como piedras que ruedan en un arroyo rápido.",
          "Abran y miren. ¿Qué ven en el agua? ¿Qué pasó con los pedazos de tiza?",
          "Pregunten: ¿es meteorización, erosión o las dos? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "Rate Recipe", es: "Receta con tasas" },
      minutes: 10,
      materials: { en: "Paper, a pencil, a spoon, a bowl of sand or flour", es: "Papel, lápiz, una cuchara y un tazón de arena o harina" },
      steps: {
        en: [
          "Say: for every 1 cm the slope rises, 4 more spoons of sand move. Write it as a table.",
          "Ask your child: if the slope rises 2 cm, how many spoons? 3 cm? 5 cm?",
          "Draw the pairs as points on a graph. Do they make a straight line?",
          "Ask: why do we call this proportional? What do you notice when one number doubles?",
        ],
        es: [
          "Digan: por cada 1 cm que sube la pendiente, se mueven 4 cucharadas más de arena. Anótenlo en una tabla.",
          "Pregunten a su hijo o hija: si la pendiente sube 2 cm, ¿cuántas cucharadas? ¿3 cm? ¿5 cm?",
          "Dibujen los pares como puntos en una gráfica. ¿Forman una línea recta?",
          "Pregunten: ¿por qué decimos que es proporcional? ¿Qué notas cuando un número se duplica?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Weathering [breaks] the rock, and erosion [moves] it.", es: "La meteorización [rompe] la roca y la erosión la [mueve]." },
    { en: "The water dropped the [sediment] because it [slowed down].", es: "El agua dejó el [sedimento] porque [se hizo más lenta]." },
    { en: "For every [1 cm] of slope, about [4 grams] of sand move.", es: "Por cada [1 cm] de pendiente, se mueven más o menos [4 gramos] de arena." },
    { en: "If the slope is ___, then more sediment will move.", es: "Si la pendiente es ___, entonces se moverá más sedimento." },
  ],
  help: {
    en: [
      "You do not need to know the science. Ask, \"Does the rock stay or move?\" and listen.",
      "Be ready for a mess. Do the water tests outside or over the sink, and let your child clean up.",
      "Say \"what do you predict?\" before each test and \"what did you notice?\" after.",
      "Let a wrong guess be useful. Ask, \"What would you change next time?\"",
    ],
    es: [
      "No necesitan saber la ciencia. Pregunten \"¿la roca se queda o se mueve?\" y escuchen.",
      "Estén listos para el desorden. Hagan las pruebas con agua afuera o sobre el fregadero y dejen que su hijo o hija limpie.",
      "Digan \"¿qué predices?\" antes de cada prueba y \"¿qué notaste?\" después.",
      "Dejen que una idea equivocada sirva. Pregunten \"¿qué cambiarías la próxima vez?\"",
    ],
  },
  home_language: {
    en: "Describe the stream table in Spanish first: \"el agua, la arena, la pendiente.\" Then match the English words. Erosion, sediment, elevation, delta, and proportional are close to the Spanish words (erosión, sedimento, elevación, delta, proporcional), so your child already knows them.",
    es: "Describan primero la mesa de arroyo en español: \"el agua, la arena, la pendiente\". Después busquen las palabras en inglés. Erosion, sediment, elevation, delta y proportional se parecen a las palabras en español (erosión, sedimento, elevación, delta, proporcional), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child sees a puddle, a creek, or muddy runoff and explains, in any language, how water breaks, carries, and drops soil.",
    es: "Sabrán que está funcionando cuando su hijo o hija vea un charco, un arroyo o agua turbia y explique, en el idioma que quiera, cómo el agua rompe, lleva y suelta la tierra.",
  },
};
