// BCPSS Family Guide (EN/ES) — g8-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 8 Science unit on plate tectonics. Vocabulary order matches ../units/g8-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning that Earth's outer shell is broken into huge plates that move very slowly, and that this movement builds mountains, opens oceans, and shakes the ground. Most earthquakes and volcanoes happen along the edges of plates. Your child will use maps and evidence from the seafloor to explain how Earth's crust changes.",
    es: "Su hijo o hija está aprendiendo que la capa exterior de la Tierra está dividida en enormes placas que se mueven muy despacio, y que ese movimiento levanta montañas, abre océanos y hace temblar el suelo. La mayoría de los terremotos y volcanes ocurren en los bordes de las placas. Su hijo o hija usará mapas y evidencia del fondo del mar para explicar cómo cambia la corteza de la Tierra.",
  },
  goals: {
    en: [
      "I can name the three kinds of plate boundaries and what each one does.",
      "I can explain how mantle convection moves plates.",
      "I can use evidence from maps to explain where earthquakes and volcanoes happen.",
    ],
    es: [
      "Puedo nombrar los tres tipos de límites de placas y lo que hace cada uno.",
      "Puedo explicar cómo la convección del manto mueve las placas.",
      "Puedo usar evidencia de mapas para explicar dónde ocurren terremotos y volcanes.",
    ],
  },
  vocab: [
    { term: "tectonic plate", def_es: "una enorme losa de roca sólida que forma parte de la capa exterior de la Tierra", example_es: "Las placas tectónicas se mueven unos centímetros al año." },
    { term: "mantle", def_es: "la capa gruesa de roca caliente que fluye muy despacio entre la corteza y el núcleo de la Tierra", example_es: "El manto es roca sólida que fluye muy lentamente." },
    { term: "convection", def_es: "el círculo en el que el material caliente sube, se enfría y vuelve a bajar; se parece a la palabra en inglés", example_es: "La convección del manto ayuda a mover las placas." },
    { term: "divergent boundary", def_es: "un lugar donde dos placas se separan", example_es: "En un límite divergente en el océano se forma corteza nueva." },
    { term: "convergent boundary", def_es: "un lugar donde dos placas se acercan una a la otra", example_es: "En un límite convergente se pueden formar montañas o volcanes." },
    { term: "transform boundary", def_es: "un lugar donde dos placas se deslizan una al lado de la otra", example_es: "La falla de San Andrés está en un límite transformante." },
    { term: "subduction", def_es: "cuando una placa se hunde debajo de otra hacia el manto; se parece a la palabra en inglés", example_es: "En la subducción, la placa oceánica se hunde bajo el continente." },
    { term: "seafloor spreading", def_es: "el proceso en el que se forma corteza oceánica nueva en una dorsal y se aleja de ella", example_es: "La expansión del fondo oceánico ensancha el océano Atlántico poco a poco." },
    { term: "fault", def_es: "una grieta en la corteza de la Tierra donde los bloques de roca pueden moverse", example_es: "El terremoto ocurrió cuando la roca se movió a lo largo de una falla." },
    { term: "process", def_es: "una serie de pasos o cambios que llevan a un resultado", example_es: "La subducción es un proceso que puede formar volcanes." },
  ],
  talk: [
    { en: "Have you ever felt a tremor or seen mountains? How do you think they formed?", es: "¿Alguna vez sentiste un temblor o viste montañas? ¿Cómo crees que se formaron?" },
    { en: "Why do you think earthquakes and volcanoes happen in some places and not others?", es: "¿Por qué crees que los terremotos y volcanes ocurren en algunos lugares y en otros no?" },
    { en: "The mantle is solid but flows very slowly. What everyday things do that?", es: "El manto es sólido pero fluye muy despacio. ¿Qué cosas de todos los días hacen eso?" },
    { en: "How would you show a divergent, a convergent, and a transform boundary with your hands?", es: "¿Cómo mostrarías con las manos un límite divergente, uno convergente y uno transformante?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Cracker Plates", es: "Placas de galleta" },
      minutes: 10,
      materials: { en: "Graham crackers or flat cookies, a plate, a spoon of frosting or peanut-free spread", es: "Galletas planas, un plato y una cucharada de crema para untar o glaseado" },
      steps: {
        en: [
          "Spread a thin layer of frosting on a plate. This is the slow-moving mantle.",
          "Put two crackers side by side on the frosting. Slowly push them apart. What fills the gap? (Divergent.)",
          "Push them toward each other until one edge rises or slides under. (Convergent.)",
          "Slide them past each other. Ask your child to name each movement.",
        ],
        es: [
          "Unten una capa delgada de crema en un plato. Esto es el manto que se mueve despacio.",
          "Pongan dos galletas lado a lado sobre la crema. Sepárenlas despacio. ¿Qué llena el espacio? (Divergente.)",
          "Empújenlas una hacia la otra hasta que un borde suba o se meta por debajo. (Convergente.)",
          "Deslícenlas una al lado de la otra. Pidan a su hijo o hija que nombre cada movimiento.",
        ],
      },
    },
    {
      title: { en: "Convection in a Pot", es: "Convección en una olla" },
      minutes: 15,
      materials: { en: "A clear pan or bowl, warm water, a drop of food coloring or a few grains of rice; an adult handles hot water", es: "Una olla o tazón transparente, agua tibia, una gota de colorante o unos granos de arroz; un adulto maneja el agua caliente" },
      steps: {
        en: [
          "With an adult, fill the pan with warm water and let it settle for a minute.",
          "Drop a bit of food coloring or a few grains of rice in the water.",
          "Watch the water and the coloring. Do you see it rise in the middle and sink at the sides?",
          "Ask: how is this like the mantle moving the plates above it?",
        ],
        es: [
          "Con un adulto, llenen la olla con agua tibia y déjenla quieta un minuto.",
          "Echen un poco de colorante o unos granos de arroz en el agua.",
          "Miren el agua y el colorante. ¿Ven que sube por el medio y baja por los lados?",
          "Pregunten: ¿en qué se parece esto al manto que mueve las placas de arriba?",
        ],
      },
    },
    {
      title: { en: "Map the Rumbles", es: "Mapa de los temblores" },
      minutes: 15,
      materials: { en: "A world map, an atlas, or a printout; a marker; paper", es: "Un mapa del mundo, un atlas o una copia impresa; un marcador y papel" },
      steps: {
        en: [
          "Find the Pacific Ocean on the map. Mark volcanoes you know, such as Mount St. Helens in Washington or Mount Fuji in Japan.",
          "Mark earthquakes you have heard of. The 2011 earthquake in Virginia was felt in Baltimore.",
          "Look at the pattern. Do the marks fall in a ring or in lines? Ask your child why.",
          "Say it together: most activity follows plate edges, called the Ring of Fire around the Pacific.",
        ],
        es: [
          "Busquen el océano Pacífico en el mapa. Marquen volcanes que conozcan, como el monte St. Helens en Washington o el monte Fuji en Japón.",
          "Marquen terremotos de los que hayan oído. El terremoto de 2011 en Virginia se sintió en Baltimore.",
          "Miren el patrón. ¿Las marcas forman un anillo o líneas? Pregunten a su hijo o hija por qué.",
          "Díganlo juntos: la mayor parte de la actividad sigue los bordes de las placas, llamado Cinturón de Fuego alrededor del Pacífico.",
        ],
      },
    },
    {
      title: { en: "Fold a Mountain", es: "Doblar una montaña" },
      minutes: 10,
      materials: { en: "A towel or a few sheets of paper, a flat table", es: "Una toalla o unas hojas de papel y una mesa plana" },
      steps: {
        en: [
          "Lay the towel flat on a table. Put your hands on opposite edges.",
          "Slowly push your hands toward each other. What happens in the middle?",
          "Ask: this is like two plates pushing together. What forms?",
          "Ask: how long do you think real mountains take to rise? Why can't we see it happen?",
        ],
        es: [
          "Pongan la toalla plana sobre una mesa. Pongan las manos en bordes opuestos.",
          "Empujen despacio las manos una hacia la otra. ¿Qué pasa en el medio?",
          "Pregunten: esto es como dos placas que se empujan. ¿Qué se forma?",
          "Pregunten: ¿cuánto creen que tardan en subir las montañas de verdad? ¿Por qué no podemos verlo?",
        ],
      },
    },
  ],
  say_it: [
    { en: "At a [convergent] boundary, the [ocean plate] sinks beneath the [continent].", es: "En un límite [convergente], la [placa oceánica] se hunde bajo el [continente]." },
    { en: "At a divergent boundary, two plates move [apart], so new crust ___.", es: "En un límite divergente, dos placas se [separan], entonces la corteza nueva ___." },
    { en: "Earthquakes happen along [faults] because rock ___.", es: "Los terremotos ocurren a lo largo de las [fallas] porque la roca ___." },
    { en: "The [mantle] flows slowly, so the plates ___.", es: "El [manto] fluye despacio, entonces las placas ___." },
  ],
  help: {
    en: [
      "You do not need to know geology. Ask, \"Which way do you think the plates are moving?\" and listen.",
      "Use maps and a globe. Looking at the pattern of volcanoes and earthquakes is real science.",
      "Take it calmly. Talking about earthquakes can be scary, so say that scientists study them to help keep people safe.",
      "Say \"how do you know?\" in any language.",
    ],
    es: [
      "No necesitan saber geología. Pregunten \"¿hacia dónde crees que se mueven las placas?\" y escuchen.",
      "Usen mapas y un globo terráqueo. Mirar el patrón de volcanes y terremotos es ciencia de verdad.",
      "Háblenlo con calma. Hablar de terremotos puede dar miedo, así que digan que los científicos los estudian para proteger a las personas.",
      "Digan \"¿cómo lo sabes?\" en cualquier idioma.",
    ],
  },
  home_language: {
    en: "Talk about mountains, volcanoes, and earthquakes in Spanish first: \"el volcán, el terremoto, la montaña.\" Then find the English words. Convection, subduction, divergent, convergent, and process sound close to Spanish (convección, subducción, divergente, convergente, proceso), so your child already knows many of them.",
    es: "Hablen primero de las montañas, los volcanes y los terremotos en español: \"el volcán, el terremoto, la montaña\". Después busquen las palabras en inglés. Convection, subduction, divergent, convergent y process se parecen al español (convección, subducción, divergente, convergente, proceso), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at a map and explains, in any language, why volcanoes and earthquakes appear along plate edges.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire un mapa y explique, en el idioma que quiera, por qué los volcanes y terremotos aparecen a lo largo de los bordes de las placas.",
  },
};
