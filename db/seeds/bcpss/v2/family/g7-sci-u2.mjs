// BCPSS Family Guide (EN/ES) — g7-sci-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 Science unit on body systems and energy. Vocabulary order matches ../units/g7-sci-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how one bite of lunch turns into the energy that moves muscles. The digestive system breaks food down, the blood carries glucose and oxygen to the cells, and the cells release energy. It matters for understanding why we eat, why we breathe harder when we run, and how the body stays working all day.",
    es: "Su hijo o hija está aprendiendo cómo un bocado del almuerzo se convierte en la energía que mueve los músculos. El sistema digestivo descompone la comida, la sangre lleva glucosa y oxígeno a las células y las células liberan energía. Importa para entender por qué comemos, por qué respiramos más fuerte al correr y cómo el cuerpo sigue funcionando todo el día.",
  },
  goals: {
    en: [
      "I can follow food from my mouth to the cells that use it.",
      "I can explain how the circulatory and respiratory systems deliver what cells need.",
      "I can describe a process in order with first, next, and then.",
    ],
    es: [
      "Puedo seguir la comida desde la boca hasta las células que la usan.",
      "Puedo explicar cómo los sistemas circulatorio y respiratorio entregan lo que necesitan las células.",
      "Puedo describir un proceso en orden con primero, luego y después.",
    ],
  },
  vocab: [
    { term: "digestion", def_es: "el proceso que descompone la comida en pedacitos que el cuerpo puede usar", example_es: "La digestión empieza en la boca cuando masticamos." },
    { term: "nutrient", def_es: "una parte de la comida que el cuerpo usa para tener energía, crecer o repararse", example_es: "Las frutas y verduras tienen nutrientes importantes." },
    { term: "molecule", def_es: "un grupo de átomos unidos; se parece a la palabra en inglés", example_es: "Una molécula de agua tiene dos átomos de hidrógeno y uno de oxígeno." },
    { term: "glucose", def_es: "un azúcar simple que las células usan como combustible", example_es: "La glucosa pasa de la comida a la sangre." },
    { term: "absorb", def_es: "tomar algo, como una esponja que toma agua", example_es: "El intestino delgado absorbe los nutrientes hacia la sangre." },
    { term: "circulatory system", def_es: "el corazón, los vasos sanguíneos y la sangre que llevan materiales por todo el cuerpo", example_es: "El sistema circulatorio lleva la glucosa a los músculos." },
    { term: "respiratory system", def_es: "los pulmones y las vías respiratorias que traen oxígeno y sacan dióxido de carbono", example_es: "El sistema respiratorio trabaja más rápido cuando corremos." },
    { term: "oxygen", def_es: "un gas del aire que las células necesitan para sacar energía de la comida", example_es: "Respiramos para que entre oxígeno al cuerpo." },
    { term: "carbon dioxide", def_es: "un gas que las células producen al sacar energía y que sacamos al respirar", example_es: "Al exhalar sacamos dióxido de carbono." },
    { term: "cellular respiration", def_es: "el proceso en el que las células usan oxígeno para sacar energía de la glucosa", example_es: "La respiración celular ocurre dentro de cada célula." },
  ],
  talk: [
    { en: "What did you eat today? Can you tell me where it goes after you swallow?", es: "¿Qué comiste hoy? ¿Puedes contarme adónde va después de que lo tragas?" },
    { en: "Why does your heart beat faster and your breathing speed up when you run?", es: "¿Por qué te late más rápido el corazón y respiras más rápido cuando corres?" },
    { en: "What do your cells need, and how do they get it?", es: "¿Qué necesitan tus células y cómo lo reciben?" },
    { en: "Does breathing make energy, or does something else? How do you know?", es: "¿Respirar produce energía, o es otra cosa? ¿Cómo lo sabes?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Cracker Taste Test", es: "Probar una galleta" },
      minutes: 10,
      materials: { en: "A plain cracker or a piece of bread, a clock or timer", es: "Una galleta salada sin sabor o un pedazo de pan y un reloj" },
      steps: {
        en: [
          "Put the cracker in your mouth. Chew slowly and do not swallow right away.",
          "Keep chewing for a minute. What happens to the taste? Does it get a little sweeter?",
          "Ask your child: digestion started in your mouth. What do you think is breaking the cracker down?",
          "Draw the path food takes after you swallow. Label each stop.",
        ],
        es: [
          "Pongan la galleta en la boca. Mastiquen despacio y no la traguen enseguida.",
          "Sigan masticando un minuto. ¿Qué pasa con el sabor? ¿Se vuelve un poquito más dulce?",
          "Pregunten a su hijo o hija: la digestión empezó en la boca. ¿Qué creen que está descomponiendo la galleta?",
          "Dibujen el camino que sigue la comida después de tragar. Pongan nombre a cada parada.",
        ],
      },
    },
    {
      title: { en: "Pulse and Breath Check", es: "Pulso y respiración" },
      minutes: 15,
      materials: { en: "A clock or timer with seconds, a pencil, paper, space to jog in place", es: "Un reloj con segundos, lápiz, papel y espacio para trotar en el lugar" },
      steps: {
        en: [
          "Sit quietly. Find the pulse on your wrist or neck. Count beats for 15 seconds. Count breaths for 30 seconds.",
          "Jog in place for one minute. Count again.",
          "Compare the numbers. Ask: why did both go up?",
          "Explain it in order: muscles need more glucose and oxygen, so the heart pumps faster and the lungs bring in more air.",
        ],
        es: [
          "Siéntense tranquilos. Busquen el pulso en la muñeca o el cuello. Cuenten los latidos durante 15 segundos y las respiraciones durante 30 segundos.",
          "Troten en su lugar durante un minuto. Cuenten otra vez.",
          "Comparen los números. Pregunten: ¿por qué subieron los dos?",
          "Expliquen en orden: los músculos necesitan más glucosa y oxígeno, entonces el corazón bombea más rápido y los pulmones traen más aire.",
        ],
      },
    },
    {
      title: { en: "Breath Balloon", es: "El globo que respira" },
      minutes: 10,
      materials: { en: "A balloon, a tape measure or string", es: "Un globo y una cinta de medir o un hilo" },
      steps: {
        en: [
          "Take a normal breath and blow it into a balloon. Measure around the balloon with the string.",
          "Try again with a deep breath. Is the balloon bigger?",
          "Ask: what is inside the air you breathe out? What gas did your cells make?",
          "Say it together: we breathe in oxygen and breathe out carbon dioxide.",
        ],
        es: [
          "Tomen un aire normal y sóplenlo en un globo. Midan alrededor del globo con el hilo.",
          "Repitan con una respiración profunda. ¿El globo queda más grande?",
          "Pregunten: ¿qué hay en el aire que sacas al exhalar? ¿Qué gas produjeron tus células?",
          "Díganlo juntos: inhalamos oxígeno y exhalamos dióxido de carbono.",
        ],
      },
    },
    {
      title: { en: "Lunch to Muscle Story", es: "De la comida al músculo" },
      minutes: 15,
      materials: { en: "Paper, crayons or markers, a snack such as a banana", es: "Papel, crayones o marcadores y un bocadillo, como un plátano" },
      steps: {
        en: [
          "Eat the snack and think of its path.",
          "Draw a comic strip with four boxes: mouth and stomach, small intestine, blood, muscle cell.",
          "Label glucose, oxygen, and energy in the right boxes.",
          "Have your child tell the story out loud using first, next, then, and finally.",
        ],
        es: [
          "Coman el bocadillo y piensen en su recorrido.",
          "Dibujen una tira cómica con cuatro cuadros: boca y estómago, intestino delgado, sangre, célula del músculo.",
          "Pongan glucosa, oxígeno y energía en los cuadros que correspondan.",
          "Pidan a su hijo o hija que cuente la historia en voz alta con primero, luego, después y al final.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, the small intestine [absorbs] the [glucose].", es: "Primero, el intestino delgado [absorbe] la [glucosa]." },
    { en: "Next, the [circulatory system] carries it to the [cells].", es: "Luego, el [sistema circulatorio] la lleva a las [células]." },
    { en: "The cells use [oxygen] to release [energy] from glucose.", es: "Las células usan [oxígeno] para liberar [energía] de la glucosa." },
    { en: "When I run, my heart beats faster because ___.", es: "Cuando corro, mi corazón late más rápido porque ___." },
  ],
  help: {
    en: [
      "You do not need to know anatomy. Ask, \"What happens next?\" and let your child tell the story.",
      "Use your own body. Pulse, breath, and hunger are real data your child can explain.",
      "Say \"show me\" and \"how do you know?\" in any language.",
      "If your child is worried about a body question, say it is a good question and look it up together.",
    ],
    es: [
      "No necesitan saber anatomía. Pregunten \"¿qué pasa después?\" y dejen que su hijo o hija cuente la historia.",
      "Usen su propio cuerpo. El pulso, la respiración y el hambre son datos reales que su hijo o hija puede explicar.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma.",
      "Si a su hijo o hija le preocupa una pregunta sobre el cuerpo, díganle que es una buena pregunta y búsquenla juntos.",
    ],
  },
  home_language: {
    en: "Tell the story of a meal in Spanish first: \"la comida, el estómago, la sangre, las células.\" Then find the English words. Digestion, nutrient, molecule, glucose, oxygen, and respiration are close to the Spanish words (digestión, nutriente, molécula, glucosa, oxígeno, respiración), so your child already knows many of them.",
    es: "Cuenten primero en español la historia de una comida: \"la comida, el estómago, la sangre, las células\". Después busquen las palabras en inglés. Digestion, nutrient, molecule, glucose, oxygen y respiration se parecen a las palabras en español (digestión, nutriente, molécula, glucosa, oxígeno, respiración), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child can follow a snack from the mouth to the muscle and explain, in any language, what each body system does.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda seguir un bocadillo desde la boca hasta el músculo y explicar, en el idioma que quiera, qué hace cada sistema del cuerpo.",
  },
};
