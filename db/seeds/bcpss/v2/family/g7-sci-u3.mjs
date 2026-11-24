// BCPSS Family Guide (EN/ES) — g7-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 Science unit on weather. Vocabulary order matches ../units/g7-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning why weather changes: warm air rises, water vapor cools into clouds, and air masses meet at fronts. It explains how a sunny morning on the Chesapeake Bay can turn into a stormy afternoon. Your child will practice explaining weather with cause and effect, using words like because and as a result.",
    es: "Su hijo o hija está aprendiendo por qué cambia el clima: el aire caliente sube, el vapor de agua se enfría y forma nubes, y las masas de aire se encuentran en los frentes. Esto explica cómo una mañana soleada en la bahía de Chesapeake puede volverse una tarde de tormenta. Su hijo o hija practicará cómo explicar el clima con causa y efecto, usando palabras como porque y como resultado.",
  },
  goals: {
    en: [
      "I can explain how warm air rising can lead to clouds and rain.",
      "I can tell the difference between air pressure and wind.",
      "I can explain weather with a cause and an effect.",
    ],
    es: [
      "Puedo explicar cómo el aire caliente que sube puede llevar a nubes y lluvia.",
      "Puedo decir la diferencia entre la presión del aire y el viento.",
      "Puedo explicar el clima con una causa y un efecto.",
    ],
  },
  vocab: [
    { term: "air pressure", def_es: "la fuerza con que el aire empuja una superficie, porque el aire pesa", example_es: "La presión atmosférica baja antes de una tormenta." },
    { term: "convection", def_es: "el movimiento del calor cuando un fluido caliente sube y uno más frío baja; se parece a la palabra en inglés", example_es: "La convección hace que el aire caliente suba y el frío baje." },
    { term: "humidity", def_es: "cuánto vapor de agua hay en el aire", example_es: "En verano en Baltimore hay mucha humedad y el aire se siente pesado." },
    { term: "water vapor", def_es: "agua en forma de gas que no se puede ver", example_es: "El vapor de agua sube con el aire caliente." },
    { term: "condensation", def_es: "el cambio de gas a líquido cuando el gas se enfría; es casi igual en inglés", example_es: "La condensación forma las gotitas de las nubes." },
    { term: "air mass", def_es: "un enorme cuerpo de aire con casi la misma temperatura y humedad en todas partes", example_es: "Una masa de aire frío llegó del norte." },
    { term: "front", def_es: "el límite donde se encuentran dos masas de aire distintas", example_es: "Cuando un frente frío pasa, baja la temperatura." },
    { term: "precipitation", def_es: "agua que cae de las nubes como lluvia, nieve, aguanieve o granizo", example_es: "La precipitación de hoy fue lluvia ligera." },
    { term: "cause", def_es: "la razón por la que algo pasa", example_es: "La causa de la lluvia fue el aire caliente que subió y se enfrió." },
    { term: "effect", def_es: "lo que pasa por culpa de una causa; se parece a la palabra en inglés", example_es: "El efecto del frente frío fue una tarde fresca." },
  ],
  talk: [
    { en: "What was the weather this morning, and how is it different now?", es: "¿Cómo estaba el clima esta mañana y en qué es diferente ahora?" },
    { en: "Why do you think warm air rises?", es: "¿Por qué crees que el aire caliente sube?" },
    { en: "What can you see in the sky that tells you rain might come?", es: "¿Qué puedes ver en el cielo que te dice que podría llover?" },
    { en: "Are clouds made of water vapor? How do you know?", es: "¿Las nubes están hechas de vapor de agua? ¿Cómo lo sabes?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Cloud in a Jar", es: "Una nube en un frasco" },
      minutes: 15,
      materials: { en: "A clear jar, warm tap water, a plate, ice cubes, a flashlight", es: "Un frasco transparente, agua tibia de la llave, un plato, hielo y una linterna" },
      steps: {
        en: [
          "Pour about an inch of warm tap water into the jar. Swirl it so the glass warms up.",
          "Put the plate on top and put ice cubes on the plate.",
          "Shine a flashlight at the side of the jar. Watch the air near the plate for a few minutes.",
          "Ask: warm, wet air rose and cooled. What do you see forming? That is condensation.",
        ],
        es: [
          "Echen más o menos una pulgada de agua tibia de la llave en el frasco. Muévanlo para que el vidrio se caliente.",
          "Pongan el plato encima y pongan el hielo sobre el plato.",
          "Alumbren con la linterna un costado del frasco. Miren el aire cerca del plato por unos minutos.",
          "Pregunten: el aire caliente y húmedo subió y se enfrió. ¿Qué ven que se forma? Eso es condensación.",
        ],
      },
    },
    {
      title: { en: "Warm Air Rises", es: "El aire caliente sube" },
      minutes: 10,
      materials: { en: "A tissue or thin paper strip, tape, a spot above a warm radiator or a cup of hot water", es: "Un pañuelo de papel o una tira delgada de papel, cinta y un lugar sobre un radiador tibio o una taza de agua caliente" },
      steps: {
        en: [
          "Hold a thin strip of paper above a cup of hot water, with an adult handling the cup. Watch it.",
          "Hold it beside the cup at the same height. What is different?",
          "Ask your child: what is pushing the paper up? Where does the air go next?",
          "Use the word convection to describe the loop of rising warm air and sinking cool air.",
        ],
        es: [
          "Sostengan una tira de papel delgada sobre una taza de agua caliente, con un adulto manejando la taza. Miren qué pasa.",
          "Sosténganla al lado de la taza, a la misma altura. ¿Qué es diferente?",
          "Pregunten a su hijo o hija: ¿qué empuja el papel hacia arriba? ¿Adónde va el aire después?",
          "Usen la palabra convección para describir el círculo de aire caliente que sube y aire frío que baja.",
        ],
      },
    },
    {
      title: { en: "Weather Log", es: "Diario del clima" },
      minutes: 10,
      materials: { en: "Paper, a pencil, a window or a porch", es: "Papel, lápiz y una ventana o un porche" },
      steps: {
        en: [
          "Every morning and afternoon for a week, look outside and write: sky, wind, temperature feeling, rain or not.",
          "Draw a small picture of the clouds each time.",
          "At the end of the week, ask: what changed from day to day? What caused it?",
          "Compare with the forecast. Did a front come through?",
        ],
        es: [
          "Cada mañana y cada tarde durante una semana, miren afuera y anoten: cielo, viento, cómo se siente la temperatura y si llovió o no.",
          "Dibujen cada vez un dibujito de las nubes.",
          "Al final de la semana, pregunten: ¿qué cambió de un día a otro? ¿Qué lo causó?",
          "Comparen con el pronóstico. ¿Pasó un frente?",
        ],
      },
    },
    {
      title: { en: "Cause and Effect Cards", es: "Tarjetas de causa y efecto" },
      minutes: 15,
      materials: { en: "Six small pieces of paper, a pencil", es: "Seis papelitos y un lápiz" },
      steps: {
        en: [
          "Write three causes on three papers: warm air rises, a cold front arrives, water vapor cools.",
          "Write three effects on the other three: clouds form, temperature drops, rain falls.",
          "Mix them up and ask your child to match each cause to an effect and read it with because.",
          "Add a new card of your own that uses the weather you saw today.",
        ],
        es: [
          "Escriban tres causas en tres papelitos: el aire caliente sube, llega un frente frío, el vapor de agua se enfría.",
          "Escriban tres efectos en los otros tres: se forman nubes, baja la temperatura, cae lluvia.",
          "Revuélvanlos y pidan a su hijo o hija que una cada causa con un efecto y la lea con porque.",
          "Agreguen una tarjeta propia con el clima que vieron hoy.",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because warm, humid air [rises] and cools, the water vapor ___.", es: "Como el aire caliente y húmedo [sube] y se enfría, el vapor de agua ___." },
    { en: "A [cold front] arrived, so the temperature [dropped].", es: "Llegó un [frente frío], entonces la temperatura [bajó]." },
    { en: "Wind is air moving from [high] pressure toward [low] pressure.", es: "El viento es aire que se mueve de la presión [alta] hacia la presión [baja]." },
    { en: "The cause was [cause], and as a result [effect].", es: "La causa fue [causa] y como resultado [efecto]." },
  ],
  help: {
    en: [
      "You do not need to be a weather expert. Ask, \"What do you see in the sky? What do you think will happen next?\"",
      "Keep the experiments safe. An adult handles any hot water.",
      "Say \"what is the cause?\" and \"what is the effect?\" in any language.",
      "Look at the forecast together and check it against what happens.",
    ],
    es: [
      "No necesitan ser expertos en el clima. Pregunten \"¿qué ves en el cielo? ¿Qué crees que pasará después?\"",
      "Mantengan los experimentos seguros. Un adulto maneja el agua caliente.",
      "Digan \"¿cuál es la causa?\" y \"¿cuál es el efecto?\" en cualquier idioma.",
      "Miren juntos el pronóstico y compárenlo con lo que pasa.",
    ],
  },
  home_language: {
    en: "Describe today's weather in Spanish first: \"el cielo, el viento, la lluvia, las nubes.\" Then find the English words. Humidity, condensation, convection, precipitation, and front sound close to the Spanish words (humedad, condensación, convección, precipitación, frente), so your child already knows many of them.",
    es: "Describan primero el clima de hoy en español: \"el cielo, el viento, la lluvia, las nubes\". Después busquen las palabras en inglés. Humidity, condensation, convection, precipitation y front se parecen a las palabras en español (humedad, condensación, convección, precipitación, frente), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at the sky and explains, in any language, what is causing the weather and what may happen next.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire el cielo y explique, en el idioma que quiera, qué está causando el clima y qué podría pasar después.",
  },
};
