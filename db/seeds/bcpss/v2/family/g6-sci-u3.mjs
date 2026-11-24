// BCPSS Family Guide (EN/ES) — g6-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 6 Science unit on ecosystems and invasive species. Vocabulary order matches ../units/g6-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning how living things in one place depend on each other, and how a new species can change a whole ecosystem. Think of the Chesapeake Bay, where blue crabs, oysters, and grasses all affect one another. Your child will use food webs and numbers to prove what caused a change, instead of just guessing.",
    es: "Su hijo o hija está aprendiendo cómo los seres vivos de un lugar dependen unos de otros y cómo una especie nueva puede cambiar todo un ecosistema. Piensen en la bahía de Chesapeake, donde los cangrejos azules, las ostras y los pastos se afectan entre sí. Su hijo o hija usará redes alimentarias y números para probar qué causó un cambio, en lugar de solo adivinar.",
  },
  goals: {
    en: [
      "I can use a food web to show who eats what.",
      "I can use population numbers to show that something declined.",
      "I can explain what caused a change and give evidence.",
    ],
    es: [
      "Puedo usar una red alimentaria para mostrar quién come a quién.",
      "Puedo usar números de población para mostrar que algo disminuyó.",
      "Puedo explicar qué causó un cambio y dar evidencia.",
    ],
  },
  vocab: [
    { term: "ecosystem", def_es: "todos los seres vivos de un lugar y el aire, el agua y la tierra que comparten", example_es: "La bahía de Chesapeake es un ecosistema con peces, plantas, aves y agua." },
    { term: "population", def_es: "todos los animales o plantas de una misma clase que viven en un lugar", example_es: "La población de cangrejos azules cambia cada año." },
    { term: "native species", def_es: "una clase de ser vivo que pertenece de forma natural a un lugar", example_es: "El cangrejo azul es una especie nativa de la bahía de Chesapeake." },
    { term: "invasive species", def_es: "una clase de ser vivo que llegó de otro lugar y le hace daño al lugar donde vive ahora", example_es: "Una especie invasora puede acabar con el alimento de las especies nativas." },
    { term: "predator", def_es: "un animal que caza y se come a otros animales", example_es: "El halcón es un depredador que caza ratones." },
    { term: "prey", def_es: "un animal que otro animal caza y se come", example_es: "El ratón es la presa del halcón." },
    { term: "food web", def_es: "un dibujo de muchas cadenas alimentarias que muestra quién se come a quién", example_es: "En la red alimentaria, las flechas van de la presa al depredador." },
    { term: "competition", def_es: "cuando los seres vivos luchan por el mismo alimento, espacio u otro recurso limitado", example_es: "Dos aves están en competencia cuando buscan las mismas semillas." },
    { term: "evidence", def_es: "datos, números u observaciones que ayudan a mostrar que algo es cierto; se parece mucho a la palabra en inglés", example_es: "La gráfica es evidencia de que la población bajó." },
    { term: "decline", def_es: "volverse más pequeño en cantidad con el tiempo", example_es: "La población de peces comenzó a disminuir después de que llegó el depredador." },
  ],
  talk: [
    { en: "What plants and animals live near our home? Who eats whom?", es: "¿Qué plantas y animales viven cerca de nuestra casa? ¿Quién se come a quién?" },
    { en: "What would happen if one animal in a food web disappeared?", es: "¿Qué pasaría si un animal de una red alimentaria desapareciera?" },
    { en: "Is every new species a problem? How can you tell?", es: "¿Toda especie nueva es un problema? ¿Cómo puedes saberlo?" },
    { en: "Two things happened at the same time. How do you know one caused the other?", es: "Dos cosas pasaron al mismo tiempo. ¿Cómo sabes que una causó la otra?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Backyard Food Web", es: "Red alimentaria del patio" },
      minutes: 15,
      materials: { en: "A yard, park, or window view; paper and a pencil", es: "Un patio, un parque o una vista por la ventana; papel y lápiz" },
      steps: {
        en: [
          "Look outside for five minutes. List every living thing you see: birds, squirrels, insects, trees, grass.",
          "Write each name on the paper, spread out like a map.",
          "Ask your child to draw an arrow from the food to the animal that eats it.",
          "Ask: what would change if one of them left? Who would be affected first?",
        ],
        es: [
          "Miren hacia afuera durante cinco minutos. Hagan una lista de todo ser vivo que vean: aves, ardillas, insectos, árboles, pasto.",
          "Escriban cada nombre en el papel, repartidos como en un mapa.",
          "Pidan a su hijo o hija que dibuje una flecha desde el alimento hasta el animal que se lo come.",
          "Pregunten: ¿qué cambiaría si uno de ellos se fuera? ¿A quién afectaría primero?",
        ],
      },
    },
    {
      title: { en: "Seed Competition", es: "Competencia por las semillas" },
      minutes: 10,
      materials: { en: "A bowl of dry beans or rice, three small cups, a spoon", es: "Un tazón de frijoles secos o arroz, tres vasos pequeños y una cuchara" },
      steps: {
        en: [
          "Pour a small pile of beans in the middle of the table. This is the food in an ecosystem.",
          "Each person is an animal. Take turns taking one bean at a time with the spoon.",
          "Now add a third player. What happens to the beans, and to each player's share?",
          "Say it together: more animals and the same food means more competition.",
        ],
        es: [
          "Echen un montoncito de frijoles en el centro de la mesa. Esto es el alimento de un ecosistema.",
          "Cada persona es un animal. Túrnense para tomar un frijol a la vez con la cuchara.",
          "Ahora agreguen un tercer jugador. ¿Qué pasa con los frijoles y con la parte de cada uno?",
          "Díganlo juntos: más animales con el mismo alimento significan más competencia.",
        ],
      },
    },
    {
      title: { en: "Count and Graph", es: "Contar y graficar" },
      minutes: 15,
      materials: { en: "Paper, a pencil, a spot outside such as a tree, a puddle, or a patch of grass", es: "Papel, lápiz y un lugar afuera como un árbol, un charco o un pedazo de pasto" },
      steps: {
        en: [
          "Pick one kind of living thing, like pigeons or dandelions. Count how many you see.",
          "Do the same count on three different days and write the numbers in a row.",
          "Ask your child to draw a simple line graph. Did the number go up, down, or stay the same?",
          "Ask: what could explain the change? What evidence would you need to be sure?",
        ],
        es: [
          "Elijan una clase de ser vivo, como palomas o dientes de león. Cuenten cuántos ven.",
          "Hagan el mismo conteo en tres días distintos y escriban los números en fila.",
          "Pidan a su hijo o hija que dibuje una gráfica de líneas sencilla. ¿El número subió, bajó o quedó igual?",
          "Pregunten: ¿qué podría explicar el cambio? ¿Qué evidencia necesitarían para estar seguros?",
        ],
      },
    },
    {
      title: { en: "Chesapeake Detective", es: "Detective de la bahía" },
      minutes: 10,
      materials: { en: "A picture or story of a local plant or animal, like a blue crab, oyster, or osprey", es: "Una imagen o historia de una planta o animal de la región, como el cangrejo azul, la ostra o el águila pescadora" },
      steps: {
        en: [
          "Pick one Chesapeake plant or animal together. Look up a picture or tell what you know.",
          "Ask: who eats it? What does it eat? Draw two arrows.",
          "Ask your child to imagine a new animal arriving that eats the same food. What could happen?",
          "Ask: what numbers would prove it? Write down one question a scientist could ask.",
        ],
        es: [
          "Elijan juntos una planta o animal de la bahía de Chesapeake. Busquen una imagen o cuenten lo que saben.",
          "Pregunten: ¿quién se lo come? ¿Qué come? Dibujen dos flechas.",
          "Pidan a su hijo o hija que imagine que llega un animal nuevo que come lo mismo. ¿Qué podría pasar?",
          "Pregunten: ¿qué números lo probarían? Anoten una pregunta que un científico podría hacer.",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [predator] hunts and eats its [prey].", es: "Un [depredador] caza y se come a su [presa]." },
    { en: "According to the graph, the [population] fell from [number] to [number].", es: "Según la gráfica, la [población] bajó de [número] a [número]." },
    { en: "The [species] is invasive because it harms the [ecosystem].", es: "La [especie] es invasora porque le hace daño al [ecosistema]." },
    { en: "The evidence shows that ___ caused the decline.", es: "La evidencia muestra que ___ causó la disminución." },
  ],
  help: {
    en: [
      "You do not need to know the animals. Ask, \"Who eats whom?\" and let your child teach you.",
      "Say \"how do you know?\" and \"what is your evidence?\" in any language.",
      "Two things happening together does not prove one caused the other. Ask, \"What else could it be?\"",
      "Go outside together. Real plants and animals teach more than any worksheet.",
    ],
    es: [
      "No necesitan conocer los animales. Pregunten \"¿quién se come a quién?\" y dejen que su hijo o hija les enseñe.",
      "Digan \"¿cómo lo sabes?\" y \"¿cuál es tu evidencia?\" en cualquier idioma.",
      "Que dos cosas pasen juntas no prueba que una causó la otra. Pregunten \"¿qué más podría ser?\"",
      "Salgan juntos. Las plantas y los animales de verdad enseñan más que cualquier hoja de trabajo.",
    ],
  },
  home_language: {
    en: "Talk about the animals and plants near home in Spanish first, and share any names you know from other places. Ecosystem, population, predator, evidence, and competition sound close to the Spanish words (ecosistema, población, depredador, evidencia, competencia), so your child already knows many of them.",
    es: "Hablen primero en español de los animales y plantas cerca de casa y compartan los nombres que conozcan de otros lugares. Ecosystem, population, predator, evidence y competition suenan parecido a las palabras en español (ecosistema, población, depredador, evidencia, competencia), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a yard or a park and tell you, in any language, who eats whom and what evidence would show a change.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar un patio o un parque y contarles, en el idioma que quiera, quién se come a quién y qué evidencia mostraría un cambio.",
  },
};
