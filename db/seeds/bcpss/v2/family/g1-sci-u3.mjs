// BCPSS Family Guide (EN/ES) — g1-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 Science unit on sky patterns. Vocabulary order matches ../units/g1-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to notice patterns in the sky: the sun comes up and goes down, the moon changes shape, and the days are longer in summer than in winter. Patterns help us know what comes next, like when it will get dark. Your child will tell what happens first, next, and last.",
    es: "Su hijo o hija está aprendiendo a notar patrones en el cielo: el sol sale y se pone, la luna cambia de forma y los días son más largos en verano que en invierno. Los patrones nos ayudan a saber qué sigue, como cuándo va a oscurecer. Su hijo o hija contará qué pasa primero, después y al final.",
  },
  goals: {
    en: [
      "I can tell how the sun and moon seem to move.",
      "I can tell how daylight changes with the seasons.",
      "I can predict what comes next in a sky pattern.",
    ],
    es: [
      "Puedo decir cómo parecen moverse el sol y la luna.",
      "Puedo decir cómo cambia la luz del día con las estaciones.",
      "Puedo predecir qué sigue en un patrón del cielo.",
    ],
  },
  vocab: [
    { term: "sun", def_es: "la estrella que nos da luz y calor durante el día", example_es: "El sol sale por la mañana." },
    { term: "moon", def_es: "la roca grande y redonda que vemos en el cielo de la noche", example_es: "Anoche la luna se veía muy brillante." },
    { term: "star", def_es: "una bola de gas muy caliente y lejana que brilla", example_es: "De noche veo muchas estrellas pequeñas." },
    { term: "sunrise", def_es: "el momento de la mañana en que el sol empieza a salir", example_es: "Vi el amanecer desde la ventana." },
    { term: "sunset", def_es: "el momento de la tarde en que el sol se esconde", example_es: "Después del atardecer se hace de noche." },
    { term: "daylight", def_es: "las horas en que el sol está en el cielo", example_es: "En verano hay más luz del día que en invierno." },
    { term: "pattern", def_es: "algo que pasa una y otra vez de la misma manera", example_es: "Día y noche forman un patrón." },
    { term: "predict", def_es: "decir qué va a pasar usando un patrón; es casi igual en español", example_es: "Puedo predecir que el sol saldrá mañana." },
    { term: "season", def_es: "una de las cuatro partes del año: primavera, verano, otoño e invierno", example_es: "El verano es mi estación favorita." },
    { term: "phase", def_es: "la forma que parece tener la luna; en español se dice 'fase'", example_es: "Hoy la luna está en una fase de media luna." },
  ],
  talk: [
    { en: "What did the sky look like this morning? And tonight?", es: "¿Cómo se veía el cielo esta mañana? ¿Y esta noche?" },
    { en: "What do you think the sun will do tomorrow? How do you know?", es: "¿Qué crees que hará el sol mañana? ¿Cómo lo sabes?" },
    { en: "Is the moon the same shape as last night?", es: "¿La luna tiene la misma forma que anoche?" },
    { en: "When is it light out in summer? And in winter?", es: "¿Hasta cuándo hay luz en verano? ¿Y en invierno?" },
    { en: "What happens first, next, and last in a day?", es: "¿Qué pasa primero, después y al final en un día?" },
  ],
  try_at_home: [
    {
      title: { en: "Moon Diary", es: "El diario de la luna" },
      minutes: 5,
      materials: { en: "Paper folded into 7 boxes, a pencil, a window or porch", es: "Un papel doblado en 7 cuadros, un lápiz y una ventana o un portal" },
      steps: {
        en: [
          "At the same time each evening, look at the moon. If you cannot see it, write 'clouds'.",
          "Your child draws the shape in one box.",
          "After a week, look at all the pictures. Ask: what do you notice?",
          "Ask: what shape do you think comes next? This is a prediction.",
        ],
        es: [
          "A la misma hora cada noche, miren la luna. Si no se ve, escriban 'nubes'.",
          "Su hijo o hija dibuja la forma en un cuadro.",
          "Después de una semana, miren todos los dibujos. Pregunten: ¿qué notas?",
          "Pregunten: ¿qué forma crees que sigue? Eso es una predicción.",
        ],
      },
    },
    {
      title: { en: "Shadow Stick", es: "El palito de sombra" },
      minutes: 10,
      materials: { en: "A stick or a long spoon, sidewalk chalk or small stones, a sunny day", es: "Un palito o una cuchara larga, tiza para acera o piedritas y un día soleado" },
      steps: {
        en: [
          "Stand the stick in the ground or a pot. Mark the end of its shadow in the morning.",
          "Come back at lunch and mark it again. Come back in the afternoon and mark it a third time.",
          "Look at the marks. Ask: how did the shadow move?",
          "Ask: what do you think the shadow will do tomorrow? Do not look at the sun.",
        ],
        es: [
          "Paren el palito en la tierra o en una maceta. Marquen el final de su sombra por la mañana.",
          "Vuelvan a la hora del almuerzo y márquenla otra vez. Vuelvan por la tarde y márquenla por tercera vez.",
          "Miren las marcas. Pregunten: ¿cómo se movió la sombra?",
          "Pregunten: ¿qué crees que hará la sombra mañana? No miren al sol.",
        ],
      },
    },
    {
      title: { en: "Sunrise and Sunset Watch", es: "Observar el amanecer y el atardecer" },
      minutes: 10,
      materials: { en: "A window facing east or west, paper and crayons", es: "Una ventana hacia el este o el oeste, papel y crayones" },
      steps: {
        en: [
          "In the morning, look where the sun comes up. The sun rises in the east.",
          "In the evening, look where it goes down. The sun sets in the west.",
          "Your child draws the sky each time. Never look straight at the sun.",
          "Ask: what comes first, next, and last? Tell the story in order.",
        ],
        es: [
          "Por la mañana, miren dónde sale el sol. El sol sale por el este.",
          "Por la tarde, miren dónde se esconde. El sol se pone por el oeste.",
          "Su hijo o hija dibuja el cielo cada vez. Nunca miren directamente al sol.",
          "Pregunten: ¿qué pasa primero, después y al final? Cuenten la historia en orden.",
        ],
      },
    },
    {
      title: { en: "Seasons Talk at the Window", es: "Hablar de las estaciones en la ventana" },
      minutes: 10,
      materials: { en: "A window, a calendar or old photos of your family outside", es: "Una ventana, un calendario o fotos viejas de la familia afuera" },
      steps: {
        en: [
          "Look at a photo from summer and one from winter. Ask: what is different?",
          "Ask: when is it dark at dinner time, in summer or in winter?",
          "Ask: what season is it now? What season comes next?",
          "Say: more daylight in summer, less daylight in winter. Your child says it back.",
        ],
        es: [
          "Miren una foto del verano y otra del invierno. Pregunten: ¿qué es diferente?",
          "Pregunten: ¿cuándo ya está oscuro a la hora de la cena, en verano o en invierno?",
          "Pregunten: ¿qué estación es ahora? ¿Qué estación sigue?",
          "Digan: más luz del día en verano, menos luz del día en invierno. Su hijo o hija lo repite.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First the [sun] [rises]. Then it [sets].", es: "Primero el [sol] [sale]. Luego se [pone]." },
    { en: "In [summer], the sun is up for [more] time.", es: "En [verano], el sol está en el cielo [más] tiempo." },
    { en: "I predict the [moon] will [change shape] tomorrow.", es: "Predigo que la [luna] va a [cambiar de forma] mañana." },
    { en: "The [moon] looks like a [circle] tonight.", es: "La [luna] parece un [círculo] esta noche." },
  ],
  help: {
    en: [
      "Look at the sky together. Say \"what do you notice?\" and wait.",
      "Say \"what comes next?\" in any language. Guessing from a pattern is science.",
      "Never look straight at the sun. Use shadows instead.",
      "Use words like first, next, then, last when you tell a day's story.",
    ],
    es: [
      "Miren el cielo juntos. Digan \"¿qué notas?\" y esperen.",
      "Digan \"¿qué sigue?\" en cualquier idioma. Adivinar a partir de un patrón es ciencia.",
      "Nunca miren directamente al sol. Usen sombras.",
      "Usen palabras como primero, después, luego y al final cuando cuenten la historia de un día.",
    ],
  },
  home_language: {
    en: "Say the sky words in Spanish first: sol, luna, estrella, amanecer, atardecer. Then in English. Season (estación), pattern (patrón), and predict (predecir) are cousins. Ask: what do you call the moon in our family's stories?",
    es: "Digan primero las palabras del cielo en español: sol, luna, estrella, amanecer, atardecer. Después en inglés. Season (estación), pattern (patrón) y predict (predecir) son primas. Pregunten: ¿cómo se llama la luna en las historias de nuestra familia?",
  },
  celebrate: {
    en: "You will know it is working when your child tells you, in any language, what the sun or moon does first, next, and last, and what they predict for tomorrow.",
    es: "Sabrán que está funcionando cuando su hijo o hija les cuente, en el idioma que quiera, qué hace el sol o la luna primero, después y al final, y qué predice para mañana.",
  },
};
