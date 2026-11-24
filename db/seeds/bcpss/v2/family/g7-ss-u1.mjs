// BCPSS Family Guide (EN/ES) — g7-ss-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 Social Studies unit on geography and settlement. Vocabulary order matches ../units/g7-ss-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how rivers, hills, and weather help decide where people build homes, farms, and cities. Baltimore grew into a busy port because the Patapsco River forms a deep, protected harbor. Children read maps, climate graphs, and mapping layers, and learn that geography shapes people's choices without deciding everything. It matters for understanding the neighborhood where we live.",
    es: "Su hijo o hija está aprendiendo cómo los ríos, las colinas y el clima ayudan a decidir dónde construye la gente sus casas, granjas y ciudades. Baltimore se convirtió en un puerto activo porque el río Patapsco forma un puerto profundo y protegido. Lee mapas, gráficas del clima y capas de mapas, y aprende que la geografía influye en las decisiones de las personas sin decidirlo todo. Importa para entender el vecindario donde vivimos.",
  },
  goals: {
    en: [
      "I can use a map to explain why people settle where they do.",
      "I can explain how people adapt to the land and the climate.",
      "I can tell a cause and an effect about a place with because, so, and as a result.",
    ],
    es: [
      "Puedo usar un mapa para explicar por qué la gente se establece donde lo hace.",
      "Puedo explicar cómo se adaptan las personas a la tierra y al clima.",
      "Puedo decir una causa y un efecto sobre un lugar con porque, entonces y como resultado.",
    ],
  },
  vocab: [
    { term: "cartography", def_es: "la ciencia y el arte de hacer mapas", example_es: "La cartografía nos ayuda a ver dónde están los ríos y las calles." },
    { term: "GIS", def_es: "una herramienta de computadora que pone capas de información, como calles, ríos y barrios, en un solo mapa; en español se dice SIG", example_es: "Con un SIG puedo ver la elevación y las calles de mi barrio en el mismo mapa." },
    { term: "elevation", def_es: "qué tan alto está un lugar sobre el nivel del mar", example_es: "La elevación de la costa es baja, pero la de las montañas es alta." },
    { term: "climate", def_es: "el patrón usual del tiempo en un lugar durante muchos años", example_es: "El clima de Baltimore tiene veranos húmedos e inviernos fríos." },
    { term: "floodplain", def_es: "tierra plana junto a un río que se cubre de agua cuando el río se desborda", example_es: "Construir en una llanura aluvial es riesgoso cuando llueve mucho." },
    { term: "adaptation", def_es: "un cambio que hacen las personas para vivir bien en un lugar", example_es: "Un canal de riego es una adaptación a un lugar seco." },
    { term: "infrastructure", def_es: "las calles, puentes, tuberías de agua, cables de luz y transporte que una comunidad necesita para funcionar", example_es: "Los puentes y las tuberías son parte de la infraestructura de una ciudad." },
    { term: "urbanization", def_es: "el crecimiento de las ciudades cuando más personas se mudan del campo para vivir en ellas", example_es: "La urbanización hizo que Baltimore creciera rápido." },
    { term: "natural resource", def_es: "algo de la naturaleza que la gente usa, como el agua, la tierra, los árboles o los peces", example_es: "El agua es un recurso natural muy importante." },
  ],
  talk: [
    { en: "Why do you think our neighborhood is where it is? What is nearby that helps?", es: "¿Por qué crees que nuestro vecindario está donde está? ¿Qué hay cerca que ayuda?" },
    { en: "Is any place near us hilly, flat, or close to water? How does that change daily life?", es: "¿Hay algún lugar cerca de nosotros que sea de colinas, plano o cerca del agua? ¿Cómo cambia eso la vida diaria?" },
    { en: "If geography shapes choices, does it decide everything? What is your evidence?", es: "Si la geografía influye en las decisiones, ¿lo decide todo? ¿Cuál es tu evidencia?" },
    { en: "What do we need in a city to make it work: roads, water, power?", es: "¿Qué necesitamos en una ciudad para que funcione: calles, agua, electricidad?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Draw Our Block", es: "Dibujar nuestra cuadra" },
      minutes: 15,
      materials: { en: "Paper, a pencil, colored pencils", es: "Papel, lápiz y lápices de colores" },
      steps: {
        en: [
          "Walk around the block or look out the window. Draw a simple map: streets, buildings, a park, any water.",
          "Add a title, a compass arrow, and a key for the colors you used.",
          "Ask: what is the highest spot? Where would water run after a heavy rain?",
          "That is cartography. Hang the map where the family can see it.",
        ],
        es: [
          "Caminen por la cuadra o miren por la ventana. Dibujen un mapa sencillo: calles, edificios, un parque y agua si hay.",
          "Agreguen un título, una flecha de brújula y una leyenda para los colores que usaron.",
          "Pregunten: ¿cuál es el punto más alto? ¿Por dónde correría el agua después de una lluvia fuerte?",
          "Eso es cartografía. Cuelguen el mapa donde la familia lo vea.",
        ],
      },
    },
    {
      title: { en: "Harbor and Hills", es: "Puerto y colinas" },
      minutes: 15,
      materials: { en: "A map of Baltimore or the Chesapeake region, paper, a pencil", es: "Un mapa de Baltimore o de la región de Chesapeake, papel y lápiz" },
      steps: {
        en: [
          "Find the Patapsco River and the harbor on the map.",
          "Ask: why would ships stop here? Why would a city grow here?",
          "Look for hills, flat land, and roads. Which parts are best for homes? For a port? For farms?",
          "Say it together: because the harbor is deep and protected, ships could dock safely, so the city grew.",
        ],
        es: [
          "Busquen el río Patapsco y el puerto en el mapa.",
          "Pregunten: ¿por qué pararían aquí los barcos? ¿Por qué crecería una ciudad aquí?",
          "Busquen colinas, tierra plana y calles. ¿Qué partes son mejores para casas? ¿Para un puerto? ¿Para granjas?",
          "Díganlo juntos: como el puerto es profundo y protegido, los barcos podían atracar con seguridad, entonces la ciudad creció.",
        ],
      },
    },
    {
      title: { en: "Rain Path Walk", es: "Paseo por el camino de la lluvia" },
      minutes: 15,
      materials: { en: "A rainy or just-rained day, paper, a pencil", es: "Un día de lluvia o justo después de llover, papel y lápiz" },
      steps: {
        en: [
          "After rain, look at where puddles collect and where water runs. Draw arrows on a sketch.",
          "Ask: is this spot higher or lower than the street? What does that tell you about the land?",
          "Look for infrastructure that handles water: storm drains, gutters, culverts.",
          "Ask: how do people adapt to land that floods?",
        ],
        es: [
          "Después de la lluvia, miren dónde se juntan los charcos y por dónde corre el agua. Dibujen flechas en un esquema.",
          "Pregunten: ¿este lugar está más alto o más bajo que la calle? ¿Qué nos dice eso del terreno?",
          "Busquen infraestructura que maneja el agua: desagües, canaletas, alcantarillas.",
          "Pregunten: ¿cómo se adaptan las personas a un terreno que se inunda?",
        ],
      },
    },
    {
      title: { en: "Layer Your Map", es: "Capas del mapa" },
      minutes: 15,
      materials: { en: "Clear plastic sheets or tracing paper (or just paper), a marker", es: "Hojas de plástico transparente o papel de calcar (o solo papel) y un marcador" },
      steps: {
        en: [
          "On one sheet, draw rivers and hills. On a second, draw roads. On a third, draw homes or stores.",
          "Stack the sheets to see them together. That is like a GIS.",
          "Ask: where do roads follow rivers or avoid hills? Why?",
          "Ask: what other layer would help, such as bus stops or parks?",
        ],
        es: [
          "En una hoja, dibujen ríos y colinas. En una segunda, dibujen calles. En una tercera, dibujen casas o tiendas.",
          "Apilen las hojas para verlas juntas. Eso es como un SIG.",
          "Pregunten: ¿dónde siguen las calles a los ríos o evitan las colinas? ¿Por qué?",
          "Pregunten: ¿qué otra capa ayudaría, como las paradas de autobús o los parques?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because the [river] forms a [harbor], ships could ___.", es: "Como el [río] forma un [puerto], los barcos podían ___." },
    { en: "People [adapted] to the [climate] by ___.", es: "Las personas se [adaptaron] al [clima] al ___." },
    { en: "Geography shapes choices, but people also ___.", es: "La geografía influye en las decisiones, pero las personas también ___." },
    { en: "The map layer shows that [elevation] is [high] near ___.", es: "La capa del mapa muestra que la [elevación] es [alta] cerca de ___." },
  ],
  help: {
    en: [
      "You do not need to be a mapmaker. Ask, \"What does this map tell you about the place?\"",
      "Use your own neighborhood as a case study.",
      "Say \"how do you know?\" in any language.",
      "Remember that people make choices. Geography does not decide everything.",
    ],
    es: [
      "No necesitan ser cartógrafos. Pregunten \"¿qué te dice este mapa del lugar?\"",
      "Usen su propio vecindario como ejemplo.",
      "Digan \"¿cómo lo sabes?\" en cualquier idioma.",
      "Recuerden que las personas toman decisiones. La geografía no lo decide todo.",
    ],
  },
  home_language: {
    en: "Talk about places in Spanish first: \"el río, la colina, el puerto, el clima.\" Then find the English words. Cartography, elevation, climate, infrastructure, and urbanization are close to Spanish (cartografía, elevación, clima, infraestructura, urbanización), so your child already knows them.",
    es: "Hablen primero de los lugares en español: \"el río, la colina, el puerto, el clima\". Después busquen las palabras en inglés. Cartography, elevation, climate, infrastructure y urbanization se parecen al español (cartografía, elevación, clima, infraestructura, urbanización), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a map and explain, in any language, why a place is where it is and how people adapted.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar un mapa y explicar, en el idioma que quiera, por qué un lugar está donde está y cómo se adaptó la gente.",
  },
};
