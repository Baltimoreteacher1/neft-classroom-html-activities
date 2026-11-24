// BCPSS Family Guide (EN/ES) — g3-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 3 Science unit on forces, friction, and magnets. Vocabulary order matches ../units/g3-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how pushes and pulls change the way things move. Balanced forces keep things still. Unbalanced forces make things speed up, slow down, or turn. Friction and magnets are forces too. It matters every time a ball rolls, a sled slides, or a magnet sticks to the fridge. Your child will explain what happened with because and so.",
    es: "Su hijo o hija está aprendiendo cómo los empujones y los jalones cambian la manera en que se mueven las cosas. Las fuerzas equilibradas mantienen las cosas quietas. Las fuerzas desequilibradas hacen que algo acelere, frene o gire. La fricción y los imanes también son fuerzas. Sirve cada vez que rueda una pelota, se desliza un trineo o un imán se pega al refrigerador. Su hijo o hija explicará lo que pasó con porque y entonces.",
  },
  goals: {
    en: [
      "I can tell if forces on an object are balanced or unbalanced.",
      "I can explain how friction and magnets change motion.",
      "I can explain a cause and its effect with because and so.",
    ],
    es: [
      "Puedo decir si las fuerzas sobre un objeto están equilibradas o desequilibradas.",
      "Puedo explicar cómo la fricción y los imanes cambian el movimiento.",
      "Puedo explicar una causa y su efecto con porque y entonces.",
    ],
  },
  vocab: [
    { term: "force", def_es: "un empujón o un jalón sobre un objeto; en español se dice 'fuerza'", example_es: "Una patada es una fuerza que mueve la pelota." },
    { term: "balanced forces", def_es: "empujones o jalones iguales desde lados opuestos, así que el objeto no cambia cómo se mueve", example_es: "En el juego de la cuerda, si los dos jalan igual, las fuerzas están equilibradas y la cuerda no se mueve." },
    { term: "unbalanced forces", def_es: "empujones o jalones que no son iguales, así que el objeto acelera, frena o gira", example_es: "Si un equipo jala más fuerte, las fuerzas están desequilibradas y la cuerda se mueve." },
    { term: "friction", def_es: "una fuerza que frena las cosas que se rozan; en español se dice 'fricción' o 'roce'", example_es: "La fricción de la alfombra frena el carrito." },
    { term: "motion", def_es: "moverse o cambiar de lugar; en español se dice 'movimiento'", example_es: "El movimiento de la pelota cambió cuando la pateé." },
    { term: "magnet", def_es: "un objeto que atrae el hierro y el acero sin tocarlos; en español se dice 'imán'", example_es: "El imán jala el clip sin tocarlo." },
    { term: "attract", def_es: "jalar algo para acercarlo; en español se dice 'atraer'", example_es: "El imán atrae un clip de acero." },
    { term: "repel", def_es: "empujar para alejar; en español se dice 'repeler'", example_es: "Dos imanes pueden repelerse y empujarse." },
    { term: "predict", def_es: "decir qué va a pasar usando pistas; en español se dice 'predecir'", example_es: "Predigo que el carrito va más lejos en el piso liso." },
  ],
  talk: [
    { en: "What is pushing or pulling? What does it do to the object?", es: "¿Qué está empujando o jalando? ¿Qué le hace al objeto?" },
    { en: "Are the forces balanced or unbalanced? How do you know?", es: "¿Las fuerzas están equilibradas o desequilibradas? ¿Cómo lo sabes?" },
    { en: "What do you predict will happen? Why?", es: "¿Qué predices que va a pasar? ¿Por qué?" },
    { en: "Where did you feel friction today?", es: "¿Dónde sentiste la fricción hoy?" },
    { en: "What did you see that proves it?", es: "¿Qué viste que lo demuestra?" },
  ],
  try_at_home: [
    {
      title: { en: "Towel Tug-of-War", es: "Jalar la toalla" },
      minutes: 10,
      materials: { en: "A towel or a jump rope, a partner", es: "Una toalla o una cuerda para saltar, y un compañero" },
      steps: {
        en: [
          "Both people hold one end of the towel and pull with the same strength. Does it move?",
          "Now one person pulls harder. What happens?",
          "Ask: when were the forces balanced? When were they unbalanced?",
          "Say: the forces are [balanced], so it [stays still].",
        ],
        es: [
          "Cada persona sostiene un extremo de la toalla y jala con la misma fuerza. ¿Se mueve?",
          "Ahora una persona jala más fuerte. ¿Qué pasa?",
          "Pregunten: ¿cuándo estaban equilibradas las fuerzas? ¿Cuándo estaban desequilibradas?",
          "Digan: las fuerzas están [equilibradas], entonces [no se mueve].",
        ],
      },
    },
    {
      title: { en: "Ramp and Friction Test", es: "Rampa y fricción" },
      minutes: 20,
      materials: { en: "A toy car or ball, a board or tray tilted on a book, a towel, a carpet piece, a smooth floor, shoes to measure", es: "Un carrito o una pelota, una tabla o bandeja inclinada con un libro, una toalla, un pedazo de alfombra, un piso liso y zapatos para medir" },
      steps: {
        en: [
          "Predict which surface lets the car roll farthest: floor, towel, or carpet.",
          "Let the car roll down the ramp onto each surface from the same spot.",
          "Measure how far it rolls in shoe-lengths. Write each number.",
          "Say: [friction] causes the car to [slow down], so it went [shorter] on the [carpet].",
        ],
        es: [
          "Predigan en qué superficie rueda más lejos el carrito: piso, toalla o alfombra.",
          "Dejen que el carrito baje por la rampa hacia cada superficie desde el mismo lugar.",
          "Midan cuánto rueda en zapatos. Escriban cada número.",
          "Digan: la [fricción] hace que el carrito [frene], entonces llegó [menos lejos] en la [alfombra].",
        ],
      },
    },
    {
      title: { en: "Magnet Hunt", es: "Búsqueda con imán" },
      minutes: 15,
      materials: { en: "A fridge magnet, paper clips, a steel spoon, aluminum foil, a coin, paper, a plastic cup", es: "Un imán de refrigerador, clips, una cuchara de acero, papel de aluminio, una moneda, papel y un vaso de plástico" },
      steps: {
        en: [
          "Predict which things the magnet will attract. Write your guesses.",
          "Test each thing. Put it in two piles: attracts and does not attract.",
          "Ask: what do the attracted things have in common? Many are iron or steel.",
          "Keep magnets away from phones, cards, and small children who might swallow them.",
        ],
        es: [
          "Predigan qué cosas atraerá el imán. Escriban sus ideas.",
          "Prueben cada cosa. Pónganlas en dos grupos: lo atrae y no lo atrae.",
          "Pregunten: ¿qué tienen en común las cosas que atrajo? Muchas son de hierro o acero.",
          "Mantengan los imanes lejos de teléfonos, tarjetas y niños pequeños que podrían tragarlos.",
        ],
      },
    },
    {
      title: { en: "Push, Pull, Slide", es: "Empujar, jalar y deslizar" },
      minutes: 10,
      materials: { en: "A ball, a playground or yard, a small box, a sock or shoe", es: "Una pelota, un parque o patio, una cajita y un calcetín o zapato" },
      steps: {
        en: [
          "Kick a ball gently, then harder. Ask: what changed?",
          "Slide a small box on the grass, then the sidewalk. Which slides farther?",
          "Ask: what force slowed it? What is rubbing together?",
          "Say: the kick was stronger than friction, so the forces were unbalanced.",
        ],
        es: [
          "Pateen una pelota con suavidad y luego con más fuerza. Pregunten: ¿qué cambió?",
          "Deslicen una cajita sobre el pasto y luego sobre la acera. ¿Cuál se desliza más lejos?",
          "Pregunten: ¿qué fuerza la frenó? ¿Qué cosas se están rozando?",
          "Digan: la patada fue más fuerte que la fricción, entonces las fuerzas estaban desequilibradas.",
        ],
      },
    },
  ],
  say_it: [
    { en: "The forces on the [object] are [balanced], so it [stays still].", es: "Las fuerzas sobre el [objeto] están [equilibradas], entonces [no se mueve]." },
    { en: "[Friction] causes the [car] to [slow down].", es: "La [fricción] hace que el [carrito] [frene]." },
    { en: "The [magnet] attracts the [paper clip] because it is [steel].", es: "El [imán] atrae el [clip] porque es de [acero]." },
    { en: "I know this because I saw [what happened].", es: "Lo sé porque vi [lo que pasó]." },
  ],
  help: {
    en: [
      "Ask \"what do you predict?\" and \"what did you see?\" in any language.",
      "Let your child run the test while you watch and ask.",
      "A wrong prediction is useful. Ask what the test shows.",
      "Use safe things from home. Keep magnets away from small children and phones.",
    ],
    es: [
      "Pregunten \"¿qué predices?\" y \"¿qué viste?\" en cualquier idioma.",
      "Dejen que su hijo o hija haga la prueba mientras ustedes miran y preguntan.",
      "Una predicción equivocada sirve. Pregunten qué muestra la prueba.",
      "Usen cosas seguras de la casa. Mantengan los imanes lejos de niños pequeños y de teléfonos.",
    ],
  },
  home_language: {
    en: "Say the force words in Spanish and English: fuerza and force, fricción and friction, imán and magnet, atraer and attract, repeler and repel, predecir and predict. Almost all of them are cousins, so your child can use Spanish to learn the English.",
    es: "Digan las palabras de fuerzas en español e inglés: fuerza y force, fricción y friction, imán y magnet, atraer y attract, repeler y repel, predecir y predict. Casi todas son primas, así que su hijo o hija puede usar el español para aprender el inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child watches something move or stop and tells you the forces behind it, with because and so.",
    es: "Sabrán que está funcionando cuando su hijo o hija vea cómo algo se mueve o se detiene y les diga las fuerzas que lo causaron, con porque y entonces.",
  },
};
