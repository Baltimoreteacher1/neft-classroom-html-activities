// BCPSS Family Guide (EN/ES) — g5-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 5 Science unit on Earth's systems and protecting water. Vocabulary order matches ../units/g5-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning that rain, rock, living things, and air affect each other, and that what happens on our streets reaches the Chesapeake Bay. Rain can wash soil, trash, and fertilizer into storm drains and streams. People can protect water. Your child will explain a cause and its effect with causes, leads to, and as a result.",
    es: "Su hijo o hija está aprendiendo que la lluvia, las rocas, los seres vivos y el aire se afectan unos a otros, y que lo que pasa en nuestras calles llega a la bahía de Chesapeake. La lluvia puede arrastrar tierra, basura y fertilizante a los desagües y arroyos. Las personas pueden proteger el agua. Su hijo o hija explicará una causa y su efecto con causa, lleva a y como resultado.",
  },
  goals: {
    en: [
      "I can explain how Earth's four systems affect each other.",
      "I can tell how runoff carries things to the Bay.",
      "I can explain how people can protect water, with cause and effect.",
    ],
    es: [
      "Puedo explicar cómo los cuatro sistemas de la Tierra se afectan entre sí.",
      "Puedo decir cómo la escorrentía lleva cosas hasta la bahía.",
      "Puedo explicar cómo las personas pueden proteger el agua, con causa y efecto.",
    ],
  },
  vocab: [
    { term: "geosphere", def_es: "todas las partes sólidas de la Tierra, como rocas, suelo y montañas; en español se dice 'geosfera'", example_es: "El suelo del patio es parte de la geosfera." },
    { term: "hydrosphere", def_es: "toda el agua de la Tierra: océanos, ríos, hielo y agua subterránea; en español se dice 'hidrosfera'", example_es: "El río Patapsco es parte de la hidrosfera." },
    { term: "atmosphere", def_es: "la capa de aire que rodea la Tierra; en español se dice 'atmósfera'", example_es: "La lluvia viene de la atmósfera." },
    { term: "biosphere", def_es: "todos los seres vivos de la Tierra y los lugares donde viven; en español se dice 'biosfera'", example_es: "Los árboles y los peces son parte de la biosfera." },
    { term: "interaction", def_es: "la manera en que dos cosas se afectan entre sí; en español se dice 'interacción'", example_es: "La lluvia y el suelo tienen una interacción." },
    { term: "erosion", def_es: "el desgaste lento y el movimiento de roca y tierra por el agua, el viento o el hielo; en español se dice 'erosión'", example_es: "La erosión se llevó la tierra sin plantas." },
    { term: "runoff", def_es: "agua de lluvia que corre sobre el suelo en vez de entrar en él; en español se dice 'escorrentía'", example_es: "La escorrentía lleva basura al desagüe." },
    { term: "pollution", def_es: "materiales dañinos que ensucian el aire, el agua o la tierra; en español se dice 'contaminación'", example_es: "La basura en el arroyo es contaminación." },
    { term: "watershed", def_es: "toda la tierra donde la lluvia y los arroyos desembocan en el mismo río o bahía; en español se dice 'cuenca hidrográfica'", example_es: "Baltimore está en la cuenca hidrográfica de la bahía de Chesapeake." },
    { term: "resource", def_es: "algo de la naturaleza que las personas necesitan o usan, como el agua; en español se dice 'recurso'", example_es: "El agua limpia es un recurso importante." },
  ],
  talk: [
    { en: "Which system is this: the rock, the water, the air, or the living things?", es: "¿Qué sistema es este: las rocas, el agua, el aire o los seres vivos?" },
    { en: "How did one system change another one?", es: "¿Cómo un sistema cambió a otro?" },
    { en: "Where does the water from our street end up?", es: "¿A dónde llega el agua de nuestra calle?" },
    { en: "What can our family do to protect water?", es: "¿Qué puede hacer nuestra familia para proteger el agua?" },
    { en: "What is the cause here, and what is the effect?", es: "¿Cuál es la causa aquí y cuál es el efecto?" },
  ],
  try_at_home: [
    {
      title: { en: "Runoff Race", es: "La carrera de la escorrentía" },
      minutes: 15,
      materials: { en: "2 trays or baking pans, soil, grass clippings or leaves, a cup of water, a book to tilt the trays", es: "2 bandejas o moldes, tierra, pasto cortado u hojas, una taza con agua y un libro para inclinar las bandejas" },
      steps: {
        en: [
          "Fill both pans with the same amount of soil. Cover one with grass clippings or leaves.",
          "Tilt both pans the same amount. Pour the same amount of water on each, slowly, like rain.",
          "Compare the water that runs off. Which is muddier?",
          "Say: heavy rain causes runoff and erosion on bare ground, so the water is muddy.",
        ],
        es: [
          "Llenen las dos bandejas con la misma cantidad de tierra. Cubran una con pasto cortado u hojas.",
          "Inclinen las dos bandejas igual. Echen la misma cantidad de agua en cada una, despacio, como lluvia.",
          "Comparen el agua que corre. ¿Cuál está más turbia?",
          "Digan: la lluvia fuerte causa escorrentía y erosión en el suelo sin plantas, entonces el agua sale turbia.",
        ],
      },
    },
    {
      title: { en: "Storm Drain Walk", es: "Paseo por los desagües" },
      minutes: 15,
      materials: { en: "A walk around the block, paper and pencil", es: "Un paseo por la cuadra, papel y lápiz" },
      steps: {
        en: [
          "Find a storm drain. Look for trash, leaves, or oil stains nearby.",
          "Ask: where does the water go when it rains? In Baltimore, storm drains send rainwater to streams and the harbor, not to a treatment plant.",
          "Pick up a few pieces of litter with a bag and gloves. Wash hands after.",
          "Say: if people [do not litter], then [less trash reaches the Bay].",
        ],
        es: [
          "Busquen un desagüe de lluvia. Miren si hay basura, hojas o manchas de aceite cerca.",
          "Pregunten: ¿a dónde va el agua cuando llueve? En Baltimore, los desagües envían el agua de lluvia a los arroyos y al puerto, no a una planta de tratamiento.",
          "Recojan unos pedazos de basura con una bolsa y guantes. Lávense las manos después.",
          "Digan: si las personas [no tiran basura], entonces [llega menos basura a la bahía].",
        ],
      },
    },
    {
      title: { en: "Four Spheres Hunt", es: "Búsqueda de las cuatro esferas" },
      minutes: 10,
      materials: { en: "A walk around the block or a look out a window, paper and pencil", es: "Un paseo por la cuadra o mirar por una ventana, papel y lápiz" },
      steps: {
        en: [
          "Make a chart with four boxes: geosphere, hydrosphere, atmosphere, biosphere.",
          "Find at least two things for each: a rock or soil, a puddle, wind or clouds, a tree or bird.",
          "Draw arrows to show interactions, like rain on soil or roots in the ground.",
          "Ask: how does one sphere affect another?",
        ],
        es: [
          "Hagan una tabla con cuatro cuadros: geosfera, hidrosfera, atmósfera, biosfera.",
          "Encuentren al menos dos cosas para cada una: una roca o tierra, un charco, viento o nubes, un árbol o un ave.",
          "Dibujen flechas para mostrar interacciones, como la lluvia sobre la tierra o las raíces en el suelo.",
          "Pregunten: ¿cómo una esfera afecta a otra?",
        ],
      },
    },
    {
      title: { en: "Water Saver Challenge", es: "Reto para ahorrar agua" },
      minutes: 10,
      materials: { en: "A bucket or a large bowl, a sink, a clock or timer", es: "Un balde o un recipiente grande, un fregadero y un reloj o temporizador" },
      steps: {
        en: [
          "Brush teeth with the faucet on. Catch the water in the bucket for 30 seconds and see how much runs.",
          "Now try turning the faucet off while brushing. Ask: how much did we save?",
          "Ask: why is clean water a resource we should protect?",
          "Say: people can protect water by [turning off the faucet], so [more clean water is left].",
        ],
        es: [
          "Cepíllense los dientes con la llave abierta. Recojan el agua en el balde durante 30 segundos y vean cuánta corre.",
          "Ahora cierren la llave mientras se cepillan. Pregunten: ¿cuánto ahorramos?",
          "Pregunten: ¿por qué el agua limpia es un recurso que debemos proteger?",
          "Digan: las personas pueden proteger el agua [cerrando la llave], entonces [queda más agua limpia].",
        ],
      },
    },
  ],
  say_it: [
    { en: "[Heavy rain] causes [erosion / runoff] because [reason].", es: "La [lluvia fuerte] causa [erosión / escorrentía] porque [razón]." },
    { en: "The [hydrosphere] affects the [geosphere] when [event].", es: "La [hidrosfera] afecta a la [geosfera] cuando [suceso]." },
    { en: "People can protect the Bay by [action], so [result].", es: "Las personas pueden proteger la bahía [acción], entonces [resultado]." },
    { en: "[Runoff] leads to [pollution] in the [stream], and as a result [effect].", es: "La [escorrentía] lleva a la [contaminación] en el [arroyo], y como resultado [efecto]." },
  ],
  help: {
    en: [
      "Ask \"what caused that?\" and \"what happened as a result?\" in any language.",
      "Let your child draw the water's path from the street to the Bay.",
      "Take a short walk and spot the four spheres. The neighborhood is the lab.",
      "Wear gloves for litter and wash hands after. Stay away from deep or fast water.",
    ],
    es: [
      "Pregunten \"¿qué causó eso?\" y \"¿qué pasó como resultado?\" en cualquier idioma.",
      "Dejen que su hijo o hija dibuje el camino del agua desde la calle hasta la bahía.",
      "Den un paseo corto y busquen las cuatro esferas. El vecindario es el laboratorio.",
      "Usen guantes para recoger basura y lávense las manos después. Aléjense del agua profunda o rápida.",
    ],
  },
  home_language: {
    en: "Many words are cousins: atmosphere (atmósfera), biosphere (biosfera), geosphere (geosfera), hydrosphere (hidrosfera), interaction (interacción), erosion (erosión), pollution (contaminación), resource (recurso). Talk about a river or a place you know in Spanish, then in English.",
    es: "Muchas palabras son primas: atmosphere (atmósfera), biosphere (biosfera), geosphere (geosfera), hydrosphere (hidrosfera), interaction (interacción), erosion (erosión), pollution (contaminación), resource (recurso). Hablen de un río o un lugar que conocen en español y luego en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child follows a raindrop from the street to the Bay and says one thing people can do to protect it.",
    es: "Sabrán que está funcionando cuando su hijo o hija siga una gota de lluvia desde la calle hasta la bahía y diga una cosa que las personas pueden hacer para protegerla.",
  },
};
