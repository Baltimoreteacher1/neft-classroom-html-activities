// BCPSS Family Guide (EN/ES) — g5-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 5 Science unit on gravity, Earth's motion, and stars. Vocabulary order matches ../units/g5-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how gravity pulls things toward Earth, how Earth's spin makes day and night and moves shadows, and why the Sun looks so much brighter than other stars. The Sun is a star that is much closer to us. Your child will compare two things with both, whereas, in contrast, and however.",
    es: "Su hijo o hija está aprendiendo cómo la gravedad jala las cosas hacia la Tierra, cómo el giro de la Tierra produce el día y la noche y mueve las sombras, y por qué el Sol se ve mucho más brillante que otras estrellas. El Sol es una estrella que está mucho más cerca de nosotros. Su hijo o hija comparará dos cosas con ambos, mientras que, en cambio y sin embargo.",
  },
  goals: {
    en: [
      "I can explain gravity, day and night, and shadows.",
      "I can explain why the Sun looks brighter than other stars.",
      "I can compare two things with both, whereas, in contrast, and however.",
    ],
    es: [
      "Puedo explicar la gravedad, el día y la noche, y las sombras.",
      "Puedo explicar por qué el Sol se ve más brillante que otras estrellas.",
      "Puedo comparar dos cosas con ambos, mientras que, en cambio y sin embargo.",
    ],
  },
  vocab: [
    { term: "gravity", def_es: "una fuerza que jala los objetos hacia el centro de la Tierra; en español se dice 'gravedad'", example_es: "La gravedad hace que la pelota caiga al suelo." },
    { term: "rotation", def_es: "una vuelta completa de la Tierra sobre su eje; en español se dice 'rotación'", example_es: "Una rotación de la Tierra produce un día y una noche." },
    { term: "axis", def_es: "una línea imaginaria alrededor de la que gira la Tierra, del Polo Norte al Polo Sur; en español se dice 'eje'", example_es: "La Tierra gira sobre su eje." },
    { term: "orbit", def_es: "el camino que sigue un objeto al viajar alrededor de otro; en español se dice 'órbita'", example_es: "La Tierra sigue una órbita alrededor del Sol." },
    { term: "star", def_es: "una enorme bola de gas caliente que brilla y hace su propia luz; en español se dice 'estrella'", example_es: "El Sol es una estrella." },
    { term: "apparent brightness", def_es: "qué tan brillante se ve una estrella desde la Tierra; en español se dice 'brillo aparente'", example_es: "El Sol tiene mayor brillo aparente que Sirio porque está más cerca." },
    { term: "distance", def_es: "qué tan lejos está un lugar o un objeto de otro; en español se dice 'distancia'", example_es: "La distancia entre la Tierra y el Sol es enorme." },
    { term: "shadow", def_es: "un área oscura que se forma cuando un objeto tapa la luz; en español se dice 'sombra'", example_es: "A mediodía mi sombra es corta." },
    { term: "constellation", def_es: "un grupo de estrellas que forma un dibujo en el cielo de la noche; en español se dice 'constelación'", example_es: "La Osa Mayor es una constelación." },
  ],
  talk: [
    { en: "How are the Sun and a night star the same? How are they different?", es: "¿En qué se parecen el Sol y una estrella de la noche? ¿En qué se diferencian?" },
    { en: "Why is your shadow long in the morning and short at noon?", es: "¿Por qué tu sombra es larga en la mañana y corta al mediodía?" },
    { en: "What pulls things down to the ground?", es: "¿Qué jala las cosas hacia el suelo?" },
    { en: "Why is it dark here when it is bright on the other side of Earth?", es: "¿Por qué aquí es de noche cuando al otro lado de la Tierra es de día?" },
    { en: "What patterns of stars have you seen?", es: "¿Qué dibujos de estrellas has visto?" },
  ],
  try_at_home: [
    {
      title: { en: "Shadow Stick", es: "El palito de sombra" },
      minutes: 15,
      materials: { en: "A stick or pencil, a flat sunny spot, sidewalk chalk, a ruler or string", es: "Un palito o lápiz, un lugar plano con sol, tiza para acera y una regla o un hilo" },
      steps: {
        en: [
          "Stand the stick upright in a pot of dirt or lump of clay. Mark and measure the shadow in the morning.",
          "Measure again around the middle of the day, and again in the afternoon.",
          "Ask: when was the shadow the shortest? When was it the longest? Which way did it move?",
          "Say: in the morning the shadow is long, and at noon it is short, because [the Sun is lower or higher]. Never look straight at the Sun.",
        ],
        es: [
          "Paren el palito en una maceta con tierra o en un pedazo de arcilla. Marquen y midan la sombra por la mañana.",
          "Midan otra vez a mitad del día y de nuevo por la tarde.",
          "Pregunten: ¿cuándo fue la sombra más corta? ¿Cuándo fue más larga? ¿Hacia dónde se movió?",
          "Digan: por la mañana la sombra es larga y al mediodía es corta, porque [el Sol está más bajo o más alto]. Nunca miren directamente al Sol.",
        ],
      },
    },
    {
      title: { en: "Day and Night Model", es: "Modelo del día y la noche" },
      minutes: 10,
      materials: { en: "A ball or an orange, a flashlight or lamp, a sticker or a dot of marker", es: "Una pelota o una naranja, una linterna o lámpara, una calcomanía o un punto de marcador" },
      steps: {
        en: [
          "Put a sticker on the ball for Baltimore. The flashlight is the Sun.",
          "In a dim room, shine the flashlight at the ball. The lit side is day.",
          "Slowly spin the ball. Watch the sticker move from light to dark and back.",
          "Ask: how long does one full spin take? About one day. The spin is called rotation.",
        ],
        es: [
          "Pongan una calcomanía en la pelota para Baltimore. La linterna es el Sol.",
          "En un cuarto con poca luz, alumbren la pelota con la linterna. El lado iluminado es el día.",
          "Giren la pelota despacio. Miren cómo la calcomanía pasa de la luz a la oscuridad y otra vez a la luz.",
          "Pregunten: ¿cuánto tarda un giro completo? Más o menos un día. El giro se llama rotación.",
        ],
      },
    },
    {
      title: { en: "Near Light, Far Light", es: "Luz cercana, luz lejana" },
      minutes: 10,
      materials: { en: "A flashlight, a dark room or hallway, a partner", es: "Una linterna, un cuarto oscuro o un pasillo y un compañero" },
      steps: {
        en: [
          "Stand at one end of a dark hallway. Your partner holds the flashlight very close to you.",
          "Your partner walks to the other end with the light still on and pointing at you.",
          "Ask: how does the light look when it is close? How does it look when it is far?",
          "Say: both lights are the same flashlight, but the close one looks brighter. This is why the Sun looks brighter than other stars: it is much closer.",
        ],
        es: [
          "Párense en un extremo de un pasillo oscuro. Su compañero sostiene la linterna muy cerca de ustedes.",
          "Su compañero camina hasta el otro extremo con la luz encendida y apuntando hacia ustedes.",
          "Pregunten: ¿cómo se ve la luz cuando está cerca? ¿Y cuando está lejos?",
          "Digan: las dos luces son la misma linterna, pero la cercana se ve más brillante. Por eso el Sol se ve más brillante que otras estrellas: está mucho más cerca.",
        ],
      },
    },
    {
      title: { en: "Drop Test and Night Sky", es: "Prueba de caída y cielo nocturno" },
      minutes: 15,
      materials: { en: "A ball, a flat sheet of paper, a crumpled sheet of paper, a clear night sky", es: "Una pelota, una hoja de papel plana, una hoja de papel arrugada y un cielo despejado de noche" },
      steps: {
        en: [
          "Drop the ball and the crumpled paper together from the same height. Which lands first?",
          "Drop the flat sheet. Ask: why does it fall slower? Air pushes up on it, but gravity still pulls it down.",
          "On a clear night, look for a constellation, like the Big Dipper or Orion in winter.",
          "Draw the pattern of stars and say its name in any language.",
        ],
        es: [
          "Suelten la pelota y el papel arrugado a la vez desde la misma altura. ¿Cuál llega primero?",
          "Suelten la hoja plana. Pregunten: ¿por qué cae más lento? El aire la empuja hacia arriba, pero la gravedad la sigue jalando hacia abajo.",
          "En una noche despejada, busquen una constelación, como la Osa Mayor u Orión en invierno.",
          "Dibujen el patrón de las estrellas y díganle un nombre en el idioma que quieran.",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both the [Sun] and [Sirius] give off light, but the [Sun] looks brighter because [reason].", es: "Tanto el [Sol] como [Sirio] dan luz, pero el [Sol] se ve más brillante porque [razón]." },
    { en: "In the morning the shadow is [long], whereas at noon it is [short].", es: "Por la mañana la sombra es [larga], mientras que al mediodía es [corta]." },
    { en: "Gravity pulls [objects] toward [the center of Earth].", es: "La gravedad jala los [objetos] hacia [el centro de la Tierra]." },
    { en: "Earth's [rotation] causes [day and night], however [reason].", es: "La [rotación] de la Tierra causa el [día y la noche], sin embargo [razón]." },
  ],
  help: {
    en: [
      "Ask \"how are they the same? how are they different?\" in any language.",
      "Let your child explain with a drawing or a model. You do not need to know astronomy.",
      "Look at the sky together at different times of day.",
      "Never look straight at the Sun. Use shadows instead.",
    ],
    es: [
      "Pregunten \"¿en qué se parecen? ¿en qué se diferencian?\" en cualquier idioma.",
      "Dejen que su hijo o hija explique con un dibujo o un modelo. No necesitan saber de astronomía.",
      "Miren el cielo juntos a distintas horas del día.",
      "Nunca miren directamente al Sol. Usen sombras.",
    ],
  },
  home_language: {
    en: "Almost every word is a cousin: gravity (gravedad), rotation (rotación), orbit (órbita), constellation (constelación), distance (distancia), star (estrella), axis (eje). Share the names or stories your family has for stars or the moon, in Spanish.",
    es: "Casi todas las palabras son primas: gravity (gravedad), rotation (rotación), orbit (órbita), constellation (constelación), distance (distancia), star (estrella), axis (eje). Compartan en español los nombres o las historias que su familia tiene sobre las estrellas o la luna.",
  },
  celebrate: {
    en: "You will know it is working when your child compares the Sun and another star, and uses distance to explain why they look different.",
    es: "Sabrán que está funcionando cuando su hijo o hija compare el Sol con otra estrella y use la distancia para explicar por qué se ven diferentes.",
  },
};
