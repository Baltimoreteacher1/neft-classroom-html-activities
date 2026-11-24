// BCPSS Family Guide (EN/ES) — g5-sci-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 5 Science unit on food webs and energy. Vocabulary order matches ../units/g5-sci-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how energy from the sun moves through a food web, and where matter goes next. In the Chesapeake Bay, tiny algae use sunlight, a menhaden eats the algae, and a striped bass eats the menhaden. Decomposers return nutrients. Your child will tell each step in order with first, next, then, and so.",
    es: "Su hijo o hija está aprendiendo cómo la energía del sol se mueve por una red alimentaria y a dónde va la materia después. En la bahía de Chesapeake, unas algas diminutas usan la luz del sol, un pez llamado menhaden se come las algas y una lubina rayada se come al menhaden. Los descomponedores devuelven nutrientes. Su hijo o hija contará cada paso en orden con primero, luego, después y entonces.",
  },
  goals: {
    en: [
      "I can tell what producers, consumers, and decomposers do.",
      "I can follow energy from the sun through a food web.",
      "I can describe each step in order with first, next, then, and so.",
    ],
    es: [
      "Puedo decir qué hacen los productores, los consumidores y los descomponedores.",
      "Puedo seguir la energía desde el sol por una red alimentaria.",
      "Puedo describir cada paso en orden con primero, luego, después y entonces.",
    ],
  },
  vocab: [
    { term: "producer", def_es: "un ser vivo que hace su propio alimento; en español se dice 'productor'", example_es: "Las algas son productores." },
    { term: "consumer", def_es: "un ser vivo que obtiene energía al comer otros seres vivos; en español se dice 'consumidor'", example_es: "La lubina rayada es un consumidor." },
    { term: "decomposer", def_es: "un ser vivo que descompone plantas y animales muertos; en español se dice 'descomponedor'", example_es: "Los hongos son descomponedores." },
    { term: "photosynthesis", def_es: "la manera en que las plantas usan luz del sol, agua y dióxido de carbono para hacer su alimento; en español se dice 'fotosíntesis'", example_es: "Con la fotosíntesis, la hoja hace alimento usando luz solar." },
    { term: "food web", def_es: "muchas cadenas alimentarias unidas que muestran quién se come a quién; en español se dice 'red alimentaria'", example_es: "La red alimentaria muestra que el águila pescadora come peces." },
    { term: "organism", def_es: "cualquier ser vivo: una planta, un animal o un hongo; en español se dice 'organismo'", example_es: "Un hongo es un organismo." },
    { term: "nutrient", def_es: "un material que los seres vivos necesitan para crecer y estar sanos; en español se dice 'nutriente'", example_es: "Los descomponedores devuelven nutrientes al suelo." },
    { term: "predator", def_es: "un animal que caza y se come a otros animales; en español se dice 'depredador'", example_es: "El águila pescadora es un depredador." },
    { term: "prey", def_es: "un animal al que otro caza y se come; en español se dice 'presa'", example_es: "El menhaden es la presa de la lubina." },
    { term: "energy", def_es: "el poder de hacer que las cosas se muevan, crezcan o cambien; en español se dice 'energía'", example_es: "La energía del sol llega hasta los peces." },
  ],
  talk: [
    { en: "Where did the energy start? Where did it go next?", es: "¿Dónde empezó la energía? ¿A dónde fue después?" },
    { en: "Who is the producer, who is the consumer, who is the decomposer?", es: "¿Quién es el productor, quién es el consumidor y quién es el descomponedor?" },
    { en: "What would happen if one animal in the web disappeared?", es: "¿Qué pasaría si desapareciera un animal de la red?" },
    { en: "What is the predator and what is the prey?", es: "¿Quién es el depredador y quién es la presa?" },
    { en: "What did you eat today, and where did its energy come from?", es: "¿Qué comiste hoy y de dónde vino su energía?" },
  ],
  try_at_home: [
    {
      title: { en: "Trace Your Lunch to the Sun", es: "Seguir el almuerzo hasta el sol" },
      minutes: 10,
      materials: { en: "Paper and a pencil, a meal or a snack", es: "Papel y lápiz, una comida o una merienda" },
      steps: {
        en: [
          "Pick one food, like a sandwich or a bowl of cereal. List what it is made of.",
          "For each item, ask: where did it come from? Was it a plant or an animal?",
          "Draw arrows to follow the energy back. Where does it start? With the sun.",
          "Say: first, a plant uses sunlight. Next, [something] eats it, so the energy moves on.",
        ],
        es: [
          "Elijan una comida, como un sándwich o un tazón de cereal. Hagan una lista de con qué está hecha.",
          "Para cada cosa, pregunten: ¿de dónde vino? ¿Era una planta o un animal?",
          "Dibujen flechas para seguir la energía hacia atrás. ¿Dónde empieza? En el sol.",
          "Digan: primero, una planta usa la luz del sol. Luego, [algo] se la come, entonces la energía sigue su camino.",
        ],
      },
    },
    {
      title: { en: "Yarn Food Web", es: "Red alimentaria con estambre" },
      minutes: 20,
      materials: { en: "Yarn or string, 6 to 8 paper cards, a marker", es: "Estambre o hilo, 6 a 8 tarjetas de papel y un marcador" },
      steps: {
        en: [
          "Write one organism on each card: sun, algae, menhaden, striped bass, osprey, blue crab, a fungus.",
          "Lay the cards in a circle. Use yarn to connect who eats whom, from the eaten to the eater.",
          "Ask: who is a producer? A consumer? A decomposer?",
          "Remove one card. Ask: what happens to the web?",
        ],
        es: [
          "Escriban un organismo en cada tarjeta: sol, algas, menhaden, lubina rayada, águila pescadora, cangrejo azul, un hongo.",
          "Pongan las tarjetas en círculo. Con el estambre conecten quién se come a quién, del que es comido al que come.",
          "Pregunten: ¿quién es un productor? ¿Un consumidor? ¿Un descomponedor?",
          "Quiten una tarjeta. Pregunten: ¿qué le pasa a la red?",
        ],
      },
    },
    {
      title: { en: "Leaf Litter Look", es: "Mirar las hojas caídas" },
      minutes: 15,
      materials: { en: "A park, yard, or tree-lined street, a magnifying glass if you have one", es: "Un parque, un patio o una calle con árboles, y una lupa si tienen una" },
      steps: {
        en: [
          "Find a pile of fallen leaves or a rotting log. Look closely and do not touch mushrooms.",
          "Look for decomposers: mushrooms, worms, tiny bugs, or mold.",
          "Ask: what happens to dead leaves over time? Where do the nutrients go?",
          "Say: finally, the decomposer breaks down dead plants and returns nutrients to the soil.",
        ],
        es: [
          "Busquen un montón de hojas caídas o un tronco podrido. Miren con atención y no toquen los hongos.",
          "Busquen descomponedores: hongos, lombrices, bichitos o moho.",
          "Pregunten: ¿qué le pasa a las hojas muertas con el tiempo? ¿A dónde van los nutrientes?",
          "Digan: finalmente, el descomponedor descompone las plantas muertas y devuelve los nutrientes al suelo.",
        ],
      },
    },
    {
      title: { en: "Sun on Grass", es: "El sol sobre el pasto" },
      minutes: 5,
      materials: { en: "A piece of cardboard, a lawn or patch of grass, a week of waiting", es: "Un pedazo de cartón, un jardín o un poco de pasto y una semana de espera" },
      steps: {
        en: [
          "Lay the cardboard on a patch of grass. Make a prediction: what will happen to the grass under it?",
          "Wait a week. Lift the cardboard and look.",
          "Ask: what did the grass need that the cardboard blocked? Sunlight for photosynthesis.",
          "Put the cardboard away and watch the grass recover.",
        ],
        es: [
          "Pongan el cartón sobre un poco de pasto. Hagan una predicción: ¿qué le pasará al pasto de abajo?",
          "Esperen una semana. Levanten el cartón y miren.",
          "Pregunten: ¿qué necesitaba el pasto que el cartón le tapó? Luz del sol para la fotosíntesis.",
          "Quiten el cartón y observen cómo se recupera el pasto.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, the [producer] uses sunlight to make [food].", es: "Primero, el [productor] usa la luz del sol para hacer [alimento]." },
    { en: "Next, the [consumer] eats the [producer], so the energy moves to the [consumer].", es: "Luego, el [consumidor] se come al [productor], entonces la energía pasa al [consumidor]." },
    { en: "Finally, the [decomposer] breaks down dead [plants] and returns [nutrients].", es: "Finalmente, el [descomponedor] descompone las [plantas] muertas y devuelve [nutrientes]." },
    { en: "The [osprey] is a [predator] and the [fish] is its [prey].", es: "El [águila pescadora] es un [depredador] y el [pez] es su [presa]." },
  ],
  help: {
    en: [
      "Ask \"what eats what?\" and \"where did the energy come from?\" in any language.",
      "Let your child draw arrows and teach you the chain.",
      "Look at real plants and animals when you can. A yard is a food web.",
      "Do not touch or taste wild mushrooms or plants.",
    ],
    es: [
      "Pregunten \"¿quién se come a quién?\" y \"¿de dónde vino la energía?\" en cualquier idioma.",
      "Dejen que su hijo o hija dibuje flechas y les enseñe la cadena.",
      "Miren plantas y animales de verdad cuando puedan. Un patio es una red alimentaria.",
      "No toquen ni prueben hongos ni plantas silvestres.",
    ],
  },
  home_language: {
    en: "Many words are cousins: producer (productor), consumer (consumidor), decomposer (descomponedor), photosynthesis (fotosíntesis), nutrient (nutriente), predator (depredador), energy (energía). Tell the food web story in Spanish first.",
    es: "Muchas palabras son primas: producer (productor), consumer (consumidor), decomposer (descomponedor), photosynthesis (fotosíntesis), nutrient (nutriente), predator (depredador), energy (energía). Cuenten primero la historia de la red alimentaria en español.",
  },
  celebrate: {
    en: "You will know it is working when your child follows the energy from the sun to a fish or a hawk and names each step in order.",
    es: "Sabrán que está funcionando cuando su hijo o hija siga la energía desde el sol hasta un pez o un halcón y nombre cada paso en orden.",
  },
};
