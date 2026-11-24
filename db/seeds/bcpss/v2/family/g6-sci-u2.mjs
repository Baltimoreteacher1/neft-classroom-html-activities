// BCPSS Family Guide (EN/ES) — g6-sci-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 6 Science unit on particles and heat. Vocabulary order matches ../units/g6-sci-u2.mjs.

export default {
  summary: {
    en: "Your child is learning that everything is made of tiny particles that are always moving, and that heat makes them move faster. This explains why you can smell soup from another room, why ice melts, and why a cold glass gets wet on the outside. Your child will explain each change with a cause and an effect.",
    es: "Su hijo o hija está aprendiendo que todo está hecho de partículas diminutas que siempre se mueven, y que el calor hace que se muevan más rápido. Esto explica por qué se huele la sopa desde otro cuarto, por qué se derrite el hielo y por qué un vaso frío se moja por fuera. Su hijo o hija explicará cada cambio con una causa y un efecto.",
  },
  goals: {
    en: [
      "I can use particles to explain smells, melting, and evaporating.",
      "I can say how heat changes the speed of particles.",
      "I can explain a change with because, which causes, and so.",
    ],
    es: [
      "Puedo usar las partículas para explicar los olores, el derretirse y el evaporarse.",
      "Puedo decir cómo el calor cambia la rapidez de las partículas.",
      "Puedo explicar un cambio con porque, lo que causa y entonces.",
    ],
  },
  vocab: [
    { term: "particle", def_es: "un pedacito de materia tan pequeño que no se puede ver", example_es: "El olor de las galletas viaja por el aire porque sus partículas se mueven." },
    { term: "diffusion", def_es: "cuando las partículas se esparcen desde donde hay muchas hasta donde hay pocas; es casi igual en inglés", example_es: "La difusión hace que el olor de la sopa llegue a toda la casa." },
    { term: "thermal energy", def_es: "la energía que tienen las partículas porque se mueven; con más calor, se mueven más", example_es: "Al calentar el agua, las partículas ganan energía térmica." },
    { term: "solid", def_es: "materia que conserva su forma porque sus partículas están muy juntas, como el hielo", example_es: "El hielo es un sólido porque sus partículas están bien apretadas." },
    { term: "liquid", def_es: "materia que fluye y toma la forma del recipiente, como el agua", example_es: "El agua es un líquido y toma la forma del vaso." },
    { term: "gas", def_es: "materia que se esparce para llenar todo el espacio, con partículas muy separadas; se escribe igual en español", example_es: "El vapor es agua en forma de gas." },
    { term: "phase change", def_es: "cuando la materia pasa de sólido, líquido o gas a otro estado", example_es: "Cuando el hielo se vuelve agua, ocurre un cambio de fase." },
    { term: "melt", def_es: "pasar de sólido a líquido cuando se calienta", example_es: "El hielo se derrite cuando le da el sol." },
    { term: "evaporate", def_es: "pasar de líquido a gas", example_es: "El agua del charco se evapora y desaparece al mediodía." },
    { term: "condense", def_es: "pasar de gas a líquido cuando se enfría", example_es: "El vapor se condensa en gotas sobre un espejo frío." },
  ],
  talk: [
    { en: "How can you smell dinner from another room? What do you think travels?", es: "¿Cómo puedes oler la cena desde otro cuarto? ¿Qué crees que viaja?" },
    { en: "What happens to ice when it gets warm? How do you know?", es: "¿Qué le pasa al hielo cuando se calienta? ¿Cómo lo sabes?" },
    { en: "Where have you seen water turn into a gas, or a gas turn back into water?", es: "¿Dónde has visto que el agua se vuelva gas, o que el gas se vuelva agua otra vez?" },
    { en: "Do particles get bigger when they are heated, or do they move faster?", es: "Cuando se calientan, ¿las partículas se hacen más grandes o se mueven más rápido?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Smell Race", es: "La carrera del olor" },
      minutes: 15,
      materials: { en: "Two cups, one of warm tap water and one of cold, a drop of vanilla or a slice of orange peel for each, a timer or clock", es: "Dos vasos, uno con agua tibia de la llave y otro con agua fría, una gota de vainilla o un pedazo de cáscara de naranja en cada uno, y un reloj" },
      steps: {
        en: [
          "Ask your child to guess: which cup will smell stronger first? Write the guess down.",
          "Add the vanilla or orange peel to both cups at the same time.",
          "Sit a few steps away and sniff every minute. Which cup do you smell first?",
          "Ask: what do the particles do when they have more thermal energy?",
        ],
        es: [
          "Pidan a su hijo o hija que adivine: ¿qué vaso olerá más fuerte primero? Anoten la idea.",
          "Pongan la vainilla o la cáscara de naranja en los dos vasos al mismo tiempo.",
          "Siéntense a unos pasos y huelan cada minuto. ¿Qué vaso se huele primero?",
          "Pregunten: ¿qué hacen las partículas cuando tienen más energía térmica?",
        ],
      },
    },
    {
      title: { en: "Ice Melt Watch", es: "Mirar el hielo derretirse" },
      minutes: 15,
      materials: { en: "Two ice cubes, two plates, one warm spot and one cool spot in the house", es: "Dos cubos de hielo, dos platos, un lugar cálido y un lugar fresco en la casa" },
      steps: {
        en: [
          "Put one ice cube on each plate. Place one plate in a warm spot and one in a cool spot.",
          "Check every three minutes. Which cube melts faster?",
          "Ask your child to draw the particles in the ice and in the water.",
          "Say it together: the ice melts because the particles get more thermal energy.",
        ],
        es: [
          "Pongan un cubo de hielo en cada plato. Pongan un plato en un lugar cálido y otro en un lugar fresco.",
          "Revisen cada tres minutos. ¿Qué cubo se derrite más rápido?",
          "Pidan a su hijo o hija que dibuje las partículas en el hielo y en el agua.",
          "Díganlo juntos: el hielo se derrite porque las partículas reciben más energía térmica.",
        ],
      },
    },
    {
      title: { en: "Sweaty Glass", es: "El vaso que suda" },
      minutes: 10,
      materials: { en: "A glass of ice water, a dry towel", es: "Un vaso de agua con hielo y una toalla seca" },
      steps: {
        en: [
          "Dry the outside of a glass. Fill it with ice water and wait a few minutes.",
          "Touch the outside. What do you find? Where did the water come from?",
          "Ask: the water was a gas in the air. What happened when it touched the cold glass?",
          "Use the word condense in a sentence together.",
        ],
        es: [
          "Sequen por fuera un vaso. Llénenlo con agua y hielo y esperen unos minutos.",
          "Toquen el exterior. ¿Qué encuentran? ¿De dónde salió el agua?",
          "Pregunten: el agua estaba en el aire como gas. ¿Qué pasó cuando tocó el vaso frío?",
          "Usen juntos la palabra condensarse en una oración.",
        ],
      },
    },
    {
      title: { en: "Puddle Check", es: "Revisar el charco" },
      minutes: 10,
      materials: { en: "A sidewalk or porch, a cup of water, chalk or a pencil and paper", es: "Una acera o un porche, un vaso de agua, tiza o lápiz y papel" },
      steps: {
        en: [
          "Pour a small puddle of water on a sunny sidewalk. Trace around it with chalk.",
          "Come back after twenty minutes and again after an hour. Trace the new edge.",
          "Ask your child: where did the water go? Was it lost, or did it change?",
          "Talk about it with the word evaporate and the word gas.",
        ],
        es: [
          "Viertan un charquito de agua en una acera con sol. Dibujen el borde con tiza.",
          "Regresen a los veinte minutos y otra vez a la hora. Dibujen el borde nuevo.",
          "Pregunten: ¿adónde se fue el agua? ¿Se perdió o cambió?",
          "Conversen con la palabra evaporarse y la palabra gas.",
        ],
      },
    },
  ],
  say_it: [
    { en: "When the particles get more [thermal energy], they move [faster].", es: "Cuando las partículas reciben más [energía térmica], se mueven más [rápido]." },
    { en: "The [ice] melts because the particles ___.", es: "El [hielo] se derrite porque las partículas ___." },
    { en: "I can smell the [soup] because particles of it travel through the [air].", es: "Puedo oler la [sopa] porque sus partículas viajan por el [aire]." },
    { en: "The [water vapor] condenses when it touches something [cold].", es: "El [vapor de agua] se condensa cuando toca algo [frío]." },
  ],
  help: {
    en: [
      "You do not need to know the science. Ask, \"What do you think the particles are doing?\" and listen.",
      "Guess first, then test. Say, \"What do you predict?\" before you start.",
      "Say \"show me\" and \"how do you know?\" in any language.",
      "Use the stove or hot water only with an adult. The cold and room-temperature tests are enough to learn.",
    ],
    es: [
      "No necesitan saber la ciencia. Pregunten \"¿qué crees que están haciendo las partículas?\" y escuchen.",
      "Primero adivinar y luego probar. Digan \"¿qué predices?\" antes de empezar.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma.",
      "Usen la estufa o el agua caliente solo con un adulto. Con las pruebas frías y a temperatura ambiente es suficiente para aprender.",
    ],
  },
  home_language: {
    en: "Name the changes in Spanish first: \"derretirse, evaporarse, condensarse.\" Then match them to the English words melt, evaporate, and condense. Particle, diffusion, gas, and solid sound almost the same in both languages (partícula, difusión, gas, sólido), so your child already knows them.",
    es: "Nombren primero los cambios en español: \"derretirse, evaporarse, condensarse\". Después únanlos con las palabras en inglés melt, evaporate y condense. Particle, diffusion, gas y solid suenan casi igual en los dos idiomas (partícula, difusión, gas, sólido), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child can watch ice melt or a puddle dry and explain, in any language, what the particles are doing and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda ver cómo se derrite el hielo o se seca un charco y explicar, en el idioma que quiera, qué hacen las partículas y por qué.",
  },
};
