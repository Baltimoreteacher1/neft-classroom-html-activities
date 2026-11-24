// BCPSS Family Guide (EN/ES) — g4-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 4 Science unit on energy transfer. Vocabulary order matches ../units/g4-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning that energy moves from one object to another and changes form. A fast ball hits the pins and passes on its energy. A speaker turns electricity into sound. Rubbing your hands makes heat. It matters at a ballgame, on a skate ramp, and every time you flip a switch. Your child will explain the cause and the effect with because and so.",
    es: "Su hijo o hija está aprendiendo que la energía pasa de un objeto a otro y cambia de forma. Una pelota rápida golpea los pinos y les pasa su energía. Una bocina convierte la electricidad en sonido. Frotarse las manos produce calor. Sirve en un juego de béisbol, en una rampa de patinaje y cada vez que se enciende un interruptor. Su hijo o hija explicará la causa y el efecto con porque y entonces.",
  },
  goals: {
    en: [
      "I can explain how speed and collisions change energy.",
      "I can tell how sound, heat, and circuits move or change energy.",
      "I can explain a cause and its effect with because, so, and as a result.",
    ],
    es: [
      "Puedo explicar cómo la rapidez y las colisiones cambian la energía.",
      "Puedo decir cómo el sonido, el calor y los circuitos mueven o cambian la energía.",
      "Puedo explicar una causa y su efecto con porque, entonces y como resultado.",
    ],
  },
  vocab: [
    { term: "energy", def_es: "la capacidad de hacer que las cosas se muevan o cambien; en español se dice 'energía'", example_es: "La pelota rápida tiene mucha energía." },
    { term: "speed", def_es: "qué tan rápido se mueve algo; en español se dice 'rapidez'", example_es: "Si aumenta la rapidez, la pelota tiene más energía." },
    { term: "collision", def_es: "cuando dos objetos chocan; en español se dice 'colisión'", example_es: "En la colisión, la pelota empujó los pinos." },
    { term: "transfer", def_es: "pasar de un objeto o lugar a otro; en español se dice 'transferir'", example_es: "La pelota transfiere energía a los pinos." },
    { term: "convert", def_es: "cambiar de una forma a otra; en español se dice 'convertir'", example_es: "La bocina convierte electricidad en sonido." },
    { term: "circuit", def_es: "un camino completo por donde puede fluir la electricidad; en español se dice 'circuito'", example_es: "Si el circuito tiene un hueco, la luz no prende." },
    { term: "vibrate", def_es: "sacudirse de un lado a otro muy rápido; en español se dice 'vibrar'", example_es: "La cuerda vibra y produce sonido." },
    { term: "heat", def_es: "energía que pasa de un objeto más caliente a uno más frío; en español se dice 'calor'", example_es: "El calor pasa de la sopa caliente a la cuchara." },
    { term: "cause", def_es: "la razón por la que pasa algo; en español se dice 'causa'", example_es: "La causa del ruido fue el choque." },
    { term: "effect", def_es: "lo que pasa por culpa de otra cosa; en español se dice 'efecto'", example_es: "El efecto fue que los pinos se cayeron." },
  ],
  talk: [
    { en: "Where did the energy come from? Where did it go?", es: "¿De dónde vino la energía? ¿A dónde se fue?" },
    { en: "What was the cause? What was the effect?", es: "¿Cuál fue la causa? ¿Cuál fue el efecto?" },
    { en: "What kind of energy did it change into: sound, heat, light, or motion?", es: "¿En qué tipo de energía se convirtió: sonido, calor, luz o movimiento?" },
    { en: "How do you know energy moved?", es: "¿Cómo sabes que la energía se movió?" },
    { en: "Where did you see a collision or a circuit today?", es: "¿Dónde viste hoy una colisión o un circuito?" },
  ],
  try_at_home: [
    {
      title: { en: "Ramp Crash Test", es: "Choque en la rampa" },
      minutes: 20,
      materials: { en: "A marble or small ball, a board or cardboard ramp, books, a paper cup, a ruler or shoes to measure", es: "Una canica o pelotita, una tabla o cartón como rampa, libros, un vaso de papel y una regla o zapatos para medir" },
      steps: {
        en: [
          "Build a low ramp. Roll the marble into the cup lying on its side. Measure how far the cup moves.",
          "Raise the ramp with more books. Roll again. The marble is faster.",
          "Ask: what did the faster marble do to the cup? Why?",
          "Say: because the marble moved faster, it had more energy, so the cup moved farther.",
        ],
        es: [
          "Construyan una rampa baja. Rueden la canica hacia el vaso acostado de lado. Midan cuánto se mueve el vaso.",
          "Suban la rampa con más libros. Rueden otra vez. La canica va más rápido.",
          "Pregunten: ¿qué le hizo al vaso la canica más rápida? ¿Por qué?",
          "Digan: porque la canica se movió más rápido, tenía más energía, entonces el vaso se movió más lejos.",
        ],
      },
    },
    {
      title: { en: "Feel the Vibration and the Heat", es: "Sentir la vibración y el calor" },
      minutes: 10,
      materials: { en: "A ruler, a table, your hands, a rubber band and a box", es: "Una regla, una mesa, las manos, una liga y una caja" },
      steps: {
        en: [
          "Press a ruler on the table edge and flick the free end. Listen. What is it doing?",
          "Pluck a rubber band stretched over a box. Touch it lightly. Feel the vibration.",
          "Rub your hands together fast for 10 seconds. What do you feel? This is heat.",
          "Ask: where did the energy of your moving hands go?",
        ],
        es: [
          "Presionen una regla en el borde de la mesa y den un golpecito al extremo libre. Escuchen. ¿Qué está haciendo?",
          "Pulsen una liga estirada sobre una caja. Tóquenla con suavidad. Sientan la vibración.",
          "Froten las manos rápido durante 10 segundos. ¿Qué sienten? Eso es calor.",
          "Pregunten: ¿a dónde se fue la energía de las manos en movimiento?",
        ],
      },
    },
    {
      title: { en: "Energy Converters at Home", es: "Convertidores de energía en casa" },
      minutes: 15,
      materials: { en: "Paper and a pencil, a lamp, a radio or speaker, a fan, a toaster (use only with an adult)", es: "Papel y lápiz, una lámpara, una radio o bocina, un ventilador y una tostadora (solo con un adulto)" },
      steps: {
        en: [
          "Walk around your home. Find 5 things that use electricity.",
          "For each, ask: what does it convert electricity into: light, sound, heat, or motion?",
          "Make a chart with two columns: the thing and what it converts energy into.",
          "Safety rule: never touch outlets or plug-in cords with wet hands, and never put anything into an outlet.",
        ],
        es: [
          "Recorran la casa. Busquen 5 cosas que usan electricidad.",
          "Para cada una, pregunten: ¿en qué convierte la electricidad: luz, sonido, calor o movimiento?",
          "Hagan una tabla con dos columnas: la cosa y en qué convierte la energía.",
          "Regla de seguridad: nunca toquen enchufes ni cables con las manos mojadas, y nunca metan nada en un enchufe.",
        ],
      },
    },
    {
      title: { en: "Flashlight Circuit Detective", es: "Detective de circuitos con la linterna" },
      minutes: 10,
      materials: { en: "A battery flashlight, an adult to open it, paper and pencil", es: "Una linterna de baterías, un adulto que la abra, papel y lápiz" },
      steps: {
        en: [
          "Click the flashlight on and off. Ask: when does the light turn on?",
          "With an adult, open it and look at the battery, the switch, and the bulb.",
          "Draw the path the electricity takes. A circuit is a complete path.",
          "Ask: what would happen if there were a gap in the path? Why?",
        ],
        es: [
          "Enciendan y apaguen la linterna. Pregunten: ¿cuándo se prende la luz?",
          "Con un adulto, ábranla y miren la batería, el interruptor y el foco.",
          "Dibujen el camino que sigue la electricidad. Un circuito es un camino completo.",
          "Pregunten: ¿qué pasaría si hubiera un hueco en el camino? ¿Por qué?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because the [ball] moved [faster], it had [more] energy.", es: "Como la [pelota] se movió [más rápido], tuvo [más] energía." },
    { en: "The collision transferred energy from the [ball] to the [pins], so [effect].", es: "La colisión transfirió energía de la [pelota] a los [pinos], entonces [efecto]." },
    { en: "The [speaker] converts [electricity] into [sound].", es: "La [bocina] convierte [electricidad] en [sonido]." },
    { en: "A circuit needs a complete [path], so the [light] turns on.", es: "Un circuito necesita un [camino] completo, entonces la [luz] se enciende." },
  ],
  help: {
    en: [
      "Ask \"what caused that?\" and \"what happened because of it?\" in any language.",
      "Let your child explain and draw. You do not need to know all the words.",
      "Use safe things at home. Never touch outlets, and use batteries for any circuit test.",
      "Connect it to real life: games, music, cooking, and the lights at home.",
    ],
    es: [
      "Pregunten \"¿qué causó eso?\" y \"¿qué pasó por eso?\" en cualquier idioma.",
      "Dejen que su hijo o hija explique y dibuje. No necesitan saber todas las palabras.",
      "Usen cosas seguras de la casa. Nunca toquen enchufes y usen baterías en cualquier prueba de circuitos.",
      "Conéctenlo con la vida real: juegos, música, cocina y las luces de la casa.",
    ],
  },
  home_language: {
    en: "Almost every science word here is a cousin: energy (energía), collision (colisión), transfer (transferir), convert (convertir), circuit (circuito), vibrate (vibrar), cause (causa), effect (efecto). Have your child teach you the English word for each Spanish one.",
    es: "Casi todas las palabras de ciencias de esta guía son primas: energy (energía), collision (colisión), transfer (transferir), convert (convertir), circuit (circuito), vibrate (vibrar), cause (causa), effect (efecto). Pidan a su hijo o hija que les enseñe la palabra en inglés de cada una en español.",
  },
  celebrate: {
    en: "You will know it is working when your child watches a collision or switches on a light and tells you where the energy moved and what changed, with because and so.",
    es: "Sabrán que está funcionando cuando su hijo o hija vea una colisión o encienda una luz y les diga a dónde se movió la energía y qué cambió, con porque y entonces.",
  },
};
