// BCPSS Family Guide (EN/ES) — g1-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on length and time. Vocabulary order matches ../units/g1-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to measure length with small units placed end to end, and to tell time to the hour and half hour. It matters when we measure a table, a doorway, or a shoe, and when we say what time we leave for school. Your child will compare two things and say how they are the same and different.",
    es: "Su hijo o hija está aprendiendo a medir el largo con unidades pequeñas puestas de extremo a extremo, y a decir la hora en punto y y media. Sirve cuando medimos una mesa, una puerta o un zapato, y cuando decimos a qué hora salimos para la escuela. Su hijo o hija comparará dos cosas y dirá en qué se parecen y en qué son diferentes.",
  },
  goals: {
    en: [
      "I can measure with units end to end.",
      "I can tell time to the hour and half hour.",
      "I can compare two things and say how they are the same and different.",
    ],
    es: [
      "Puedo medir con unidades de extremo a extremo.",
      "Puedo decir la hora en punto y y media.",
      "Puedo comparar dos cosas y decir en qué se parecen y en qué son diferentes.",
    ],
  },
  vocab: [
    { term: "length", def_es: "qué tan largo es algo de un extremo al otro; la longitud", example_es: "La longitud de la mesa es de diez clips." },
    { term: "unit", def_es: "una cosa pequeña que se usa una y otra vez para medir", example_es: "Usé un clip como unidad para medir el lápiz." },
    { term: "longer", def_es: "el que llega más lejos de un extremo al otro", example_es: "La cuchara es más larga que el tenedor." },
    { term: "shorter", def_es: "el que no llega tan lejos de un extremo al otro", example_es: "El lápiz es más corto que el cuaderno." },
    { term: "end to end", def_es: "tocándose uno después de otro en una línea, sin huecos y sin encimarse", example_es: "Puse los cubos de extremo a extremo sin dejar huecos." },
    { term: "compare", def_es: "mirar dos cosas y decir en qué se parecen y en qué son diferentes", example_es: "Voy a comparar mi zapato con el tuyo." },
    { term: "hour hand", def_es: "la manecilla corta del reloj, que dice la hora", example_es: "La manecilla de las horas apunta al 3." },
    { term: "minute hand", def_es: "la manecilla larga del reloj, que dice los minutos", example_es: "La manecilla de los minutos apunta al 12." },
    { term: "o'clock", def_es: "la hora en punto, cuando la manecilla larga apunta al 12", example_es: "Son las 4 en punto." },
    { term: "half past", def_es: "y media: 30 minutos después de la hora, cuando la manecilla larga apunta al 6", example_es: "Son las 4 y media." },
  ],
  talk: [
    { en: "What did you use to measure? Why did you put the units end to end?", es: "¿Qué usaste para medir? ¿Por qué pusiste las unidades de extremo a extremo?" },
    { en: "Which is longer? Which is shorter? How do you know?", es: "¿Cuál es más largo? ¿Cuál es más corto? ¿Cómo lo sabes?" },
    { en: "How are these two things the same? How are they different?", es: "¿En qué se parecen estas dos cosas? ¿En qué son diferentes?" },
    { en: "What time is it? Where does the short hand point? The long hand?", es: "¿Qué hora es? ¿Adónde apunta la manecilla corta? ¿Y la larga?" },
    { en: "What do we do at 3 o'clock or half past 3?", es: "¿Qué hacemos a las 3 en punto o a las 3 y media?" },
  ],
  try_at_home: [
    {
      title: { en: "Measure with Paper Clips", es: "Medir con clips" },
      minutes: 10,
      materials: { en: "Paper clips, buttons, or small blocks, and things to measure like a spoon, a shoe, a book", es: "Clips, botones o bloques pequeños, y cosas para medir como una cuchara, un zapato, un libro" },
      steps: {
        en: [
          "Pick a thing to measure. Line up clips end to end along it, with no gaps.",
          "Count the clips. Say: the spoon is 6 clips long.",
          "Measure a second thing the same way. Which is longer?",
          "Ask: what would happen if we left gaps? Try it and see.",
        ],
        es: [
          "Elijan algo para medir. Pongan clips de extremo a extremo a lo largo, sin huecos.",
          "Cuenten los clips. Digan: la cuchara mide 6 clips de largo.",
          "Midan una segunda cosa de la misma forma. ¿Cuál es más larga?",
          "Pregunten: ¿qué pasaría si dejamos huecos? Pruébenlo y vean.",
        ],
      },
    },
    {
      title: { en: "Shoe Lengths", es: "El largo de los zapatos" },
      minutes: 10,
      materials: { en: "Family shoes, and one kind of unit like blocks, crayons, or spoons", es: "Zapatos de la familia, y un tipo de unidad como bloques, crayones o cucharas" },
      steps: {
        en: [
          "Choose 3 shoes of different sizes. Guess which is longest.",
          "Measure each shoe with the same unit, end to end.",
          "Order the shoes from shortest to longest.",
          "Say how two shoes are the same (both have laces) and how they are different (one is longer).",
        ],
        es: [
          "Elijan 3 zapatos de distinto tamaño. Adivinen cuál es el más largo.",
          "Midan cada zapato con la misma unidad, de extremo a extremo.",
          "Pongan los zapatos en orden, del más corto al más largo.",
          "Digan en qué se parecen dos zapatos (los dos tienen cordones) y en qué son diferentes (uno es más largo).",
        ],
      },
    },
    {
      title: { en: "Paper Plate Clock", es: "Reloj de plato de papel" },
      minutes: 15,
      materials: { en: "A paper plate, two paper strips (one short, one long), a pencil, a brad or tape", es: "Un plato de papel, dos tiras de papel (una corta y una larga), un lápiz y un sujetador o cinta" },
      steps: {
        en: [
          "Write the numbers 1 to 12 around the plate like a clock.",
          "Make the short strip the hour hand and the long strip the minute hand.",
          "Show 3 o'clock: the long hand on 12, the short hand on 3.",
          "Show half past 3: the long hand on 6, the short hand between 3 and 4.",
        ],
        es: [
          "Escriban los números del 1 al 12 alrededor del plato como en un reloj.",
          "Hagan que la tira corta sea la manecilla de las horas y la larga la de los minutos.",
          "Muestren las 3 en punto: la larga en el 12 y la corta en el 3.",
          "Muestren las 3 y media: la larga en el 6 y la corta entre el 3 y el 4.",
        ],
      },
    },
    {
      title: { en: "Daily Clock Check", es: "Revisar el reloj cada día" },
      minutes: 5,
      materials: { en: "A clock at home, on the stove, or on a phone", es: "Un reloj en la casa, en la estufa o en un teléfono" },
      steps: {
        en: [
          "At a time on the hour or half hour, look at the clock together.",
          "Ask: where is the short hand? Where is the long hand?",
          "Say the time: it is 7 o'clock, or it is half past 7.",
          "Ask: what do we do at this time every day?",
        ],
        es: [
          "A una hora en punto o y media, miren el reloj juntos.",
          "Pregunten: ¿dónde está la manecilla corta? ¿Dónde está la larga?",
          "Digan la hora: son las 7 en punto, o son las 7 y media.",
          "Pregunten: ¿qué hacemos a esta hora todos los días?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both the [object] and the [object] are measured in [unit].", es: "El [objeto] y el [objeto] se miden en [unidad]." },
    { en: "The [object] is longer, but the [object] is shorter.", es: "El [objeto] es más largo, pero el [objeto] es más corto." },
    { en: "The minute hand points to [number], so it is [time].", es: "La manecilla de los minutos apunta al [número], entonces son las [hora]." },
    { en: "I put the [units] end to end with no gaps.", es: "Puse las [unidades] de extremo a extremo, sin huecos." },
  ],
  help: {
    en: [
      "Measure everyday things together with the same small unit. Count out loud.",
      "Ask \"how do you know it is longer?\" and let your child show you.",
      "Look at a clock together at the same times each day, like breakfast and bedtime.",
      "You do not need to know the English words. Say the time in Spanish and your child can say it in English.",
    ],
    es: [
      "Midan juntos cosas de todos los días con la misma unidad pequeña. Cuenten en voz alta.",
      "Pregunten \"¿cómo sabes que es más largo?\" y dejen que su hijo o hija les muestre.",
      "Miren un reloj juntos a las mismas horas cada día, como el desayuno y la hora de dormir.",
      "No necesitan saber las palabras en inglés. Digan la hora en español y su hijo o hija puede decirla en inglés.",
    ],
  },
  home_language: {
    en: "Say the time in Spanish, then in English: \"las tres en punto, three o'clock\"; \"las tres y media, half past three.\" Ask your child which words sound alike: \"minuto\" and \"minute,\" \"unidad\" and \"unit,\" \"comparar\" and \"compare.\"",
    es: "Digan la hora en español y luego en inglés: \"las tres en punto, three o'clock\"; \"las tres y media, half past three\". Pregunten a su hijo o hija qué palabras suenan parecido: \"minuto\" y \"minute\", \"unidad\" y \"unit\", \"comparar\" y \"compare\".",
  },
  celebrate: {
    en: "You will know it is working when your child measures an object with units end to end, tells the time to the hour or half hour, and says how two things are alike and different.",
    es: "Sabrán que está funcionando cuando su hijo o hija mida un objeto con unidades de extremo a extremo, diga la hora en punto o y media y diga en qué se parecen y en qué son diferentes dos cosas.",
  },
};
