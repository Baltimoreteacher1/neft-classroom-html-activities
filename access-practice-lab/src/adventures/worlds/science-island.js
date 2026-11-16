// Science Discovery Island (Adventure Worlds, ADVENTURE-SCHEMA.md): field investigations on Kestrel Island, a
// fictional island with a field station. Tide pools (intertidal zones), a volcano's soil (primary succession) and a
// seabird population (rats removed from nesting grounds). Learners observe, read data and form claims with evidence.
// Same story in both bands; 3-5 has shorter texts and lighter language demand. Original story, place and characters;
// the science follows standard grades 3-8 content (intertidal zonation, soil formation and succession, invasive
// predators and seabird recovery). Data are illustrative values for a fictional island.
const P = (en, es) => ({ en, es });
const E = (en) => ({ en });

// ── mission 1: tide pools ────────────────────────────────────────────────────
const POOL_CLUES_68 = [
  {
    id: "high-count",
    text: E("High pools: 3 anemones in our frames, all closed up tight."),
    relevant: true,
    keys: ["high", "3", "closed"],
    why: P(
      "This is the count for one zone. Closed anemones are holding water in, a sign of drying stress.",
      "Es el conteo de una zona. Las anémonas cerradas guardan agua, una señal de que se están secando.",
    ),
  },
  {
    id: "low-count",
    text: E("Low pools: 27 anemones in our frames, most open with tentacles out."),
    relevant: true,
    keys: ["low", "27", "open"],
    why: P(
      "Comparing 27 with 3 shows a big difference between the zones. That is the pattern to explain.",
      "Comparar 27 con 3 muestra una gran diferencia entre las zonas. Ese es el patrón que hay que explicar.",
    ),
  },
  {
    id: "exposed",
    text: E(
      "At low tide, the high pools are cut off from the ocean for about 6 hours; the low pools for about 1 hour.",
    ),
    relevant: true,
    keys: ["6", "hours", "ocean", "cut"],
    why: P(
      "Longer time without fresh seawater means more drying, heating and change. That can explain the counts.",
      "Más tiempo sin agua de mar significa más secado, calor y cambios. Eso puede explicar los conteos.",
    ),
  },
  {
    id: "temp",
    text: E("Water temperature at noon: high pool 27°C, low pool 18°C."),
    relevant: true,
    keys: ["temperature", "27", "18"],
    why: P(
      "Warm water holds less oxygen and stresses sea animals. The high pools are much warmer.",
      "El agua tibia tiene menos oxígeno y estresa a los animales marinos. Las pozas altas están mucho más tibias.",
    ),
  },
  {
    id: "gull",
    text: E("A gull flew over the rocks twice during our survey."),
    relevant: false,
    why: P(
      "The gull flew over both zones, high and low, so it cannot explain a difference between them.",
      "La gaviota voló sobre las dos zonas, altas y bajas, así que no puede explicar una diferencia entre ellas.",
    ),
  },
  {
    id: "slippery",
    text: E("The rocks near the trail are slippery with seaweed."),
    relevant: false,
    why: P(
      "That is a safety note for the scientists. It does not tell us where anemones can live.",
      "Es un aviso de seguridad para los científicos. No nos dice dónde pueden vivir las anémonas.",
    ),
  },
];
const POOL_CLUES_35 = [
  {
    id: "high-count",
    text: E("High pools: 3 anemones. They are all closed."),
    relevant: true,
    keys: ["high", "3"],
    why: P("This is how many live up high.", "Esto es cuántas viven arriba."),
  },
  {
    id: "low-count",
    text: E("Low pools: 27 anemones. Most are open."),
    relevant: true,
    keys: ["low", "27"],
    why: P("27 is much more than 3!", "¡27 es mucho más que 3!"),
  },
  {
    id: "exposed",
    text: E("High pools are away from the ocean for a long time. Low pools get new seawater fast."),
    relevant: true,
    keys: ["ocean", "seawater", "long"],
    why: P(
      "Pools away from the ocean can dry out and get hot.",
      "Las pozas lejos del océano se pueden secar y calentar.",
    ),
  },
  {
    id: "temp",
    text: E("The high pool water is warm. The low pool water is cool."),
    relevant: true,
    keys: ["warm", "cool"],
    why: P(
      "Warm water is hard on sea animals.",
      "El agua tibia es difícil para los animales del mar.",
    ),
  },
  {
    id: "gull",
    text: E("A gull flew over the rocks."),
    relevant: false,
    why: P(
      "The gull flew over all the pools, so it does not explain the difference.",
      "La gaviota voló sobre todas las pozas, así que no explica la diferencia.",
    ),
  },
  {
    id: "slippery",
    text: E("The rocks are slippery."),
    relevant: false,
    why: P(
      "That is about our safety, not about anemones.",
      "Eso es sobre nuestra seguridad, no sobre las anémonas.",
    ),
  },
];
const tidePools = {
  id: "tide-pools",
  title: P("Life Between the Tides", "La vida entre mareas"),
  goal: P(
    "Read about tide pools, compare survey data and explain a pattern with evidence.",
    "Leer sobre las pozas de marea, comparar datos y explicar un patrón con evidencia.",
  ),
  keyUse: "Explain",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-island", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Welcome to Kestrel Island Field Station! I'm Dr. Reyes. The tide is going out, which means the rocky shore is about to become our laboratory. Yesterday our team noticed something strange: many more sea anemones live in some tide pools than in others. Your first job is to find out why.",
          "¡Bienvenidos a la Estación de Campo de la Isla Kestrel! Soy la Dra. Reyes. La marea está bajando, así que la costa rocosa está por convertirse en nuestro laboratorio. Ayer el equipo notó algo extraño: viven muchas más anémonas de mar en unas pozas que en otras. Tu primera tarea es averiguar por qué.",
        ),
      },
      {
        kind: "read",
        title: P("Field guide: Life between the tides", "Guía de campo: La vida entre mareas"),
        art: ["adv-tide-pool"],
        text: E(
          "Twice a day, the ocean rises and falls along the shore. This is the tide. The rocky area between the highest and lowest tide lines is called the intertidal zone, and it is one of the hardest places on Earth to live. When the tide goes out, water is trapped in hollows in the rock, forming tide pools. Pools high on the shore are cut off from the ocean for many hours. In the sun, their water heats up and evaporates, so it becomes warmer and saltier, and warm water holds less oxygen. Pools low on the shore are covered by the ocean again soon, so their water stays cool and fresh. Living things in the intertidal zone have adaptations for these changes. A sea anemone can pull in its tentacles and close up to keep from drying out, but it cannot move far to escape the heat. Scientists often find that each kind of animal lives in the zone where it can survive the conditions.",
        ),
        glossary: [
          {
            word: "intertidal",
            en: "between the high and low tide lines",
            es: "intermareal, entre la marea alta y la baja",
          },
          { word: "evaporates", en: "turns from liquid water into gas", es: "se evapora" },
          {
            word: "adaptations",
            en: "body parts or behaviors that help a living thing survive",
            es: "adaptaciones",
          },
          { word: "tentacles", en: "long, soft arms", es: "tentáculos" },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Plan the survey. Put the steps of a fair count in order.",
          "Planea el estudio. Ordena los pasos de un conteo justo.",
        ),
        items: [
          E("Choose tide pools in the high zone and in the low zone."),
          E("Place the same size square frame in each pool."),
          E("Count the anemones inside each frame."),
          E("Record every count in the field notebook."),
          E("Compare the high counts with the low counts."),
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Here are the team's field notes. Collect 3 observations that help explain where the anemones live.",
          "Aquí están las notas de campo del equipo. Reúne 3 observaciones que ayuden a explicar dónde viven las anémonas.",
        ),
        need: 3,
        clues: POOL_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Which claim fits the evidence best?",
          "¿Qué afirmación coincide mejor con la evidencia?",
        ),
        options: [
          {
            text: E("Anemones prefer the high pools because they get more sunlight."),
            correct: false,
            feedback: P(
              "Check your counts: which zone had only 3 anemones? More sun also means warmer water. Is that good for an animal that can dry out?",
              "Revisa tus conteos: ¿qué zona tenía solo 3 anémonas? Más sol también significa agua más tibia. ¿Eso es bueno para un animal que se puede secar?",
            ),
          },
          {
            text: E(
              "More anemones survive in the low pools because those pools stay cool and are covered by the ocean sooner.",
            ),
            correct: true,
            feedback: P(
              "Yes. The claim matches the counts and the conditions in each zone.",
              "Sí. La afirmación coincide con los conteos y las condiciones de cada zona.",
            ),
          },
          {
            text: E("The number of anemones is about the same in every pool."),
            correct: false,
            feedback: P(
              "Compare the two numbers on your evidence board. Are they close to each other?",
              "Compara los dos números de tu tablero de evidencia. ¿Están cerca uno del otro?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a field note: explain why more anemones live in the low pools. Use numbers from your evidence.",
          "Escribe una nota de campo: explica por qué viven más anémonas en las pozas bajas. Usa números de tu evidencia.",
        ),
        frames: [
          E("More anemones live in ___ because ___."),
          E("Our data show that ___."),
          E("This matters because anemones ___."),
        ],
        wordBank: [
          "intertidal",
          "exposed",
          "evaporate",
          "temperature",
          "survive",
          "compared with",
          "because",
          "the data show",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [["low", "lower"]],
          evidenceFrom: "clues",
        },
        model: E(
          "More anemones live in the low pools because those pools are covered by the ocean again after about 1 hour, while the high pools are cut off for 6 hours. Our data show 27 anemones in the low pools and only 3 in the high pools. The high pool water reached 27°C, so anemones there close up to survive.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Field note saved. Conditions in each zone (time out of water, temperature) decide which animals can survive there.",
          "Nota de campo guardada. Las condiciones de cada zona (tiempo fuera del agua, temperatura) deciden qué animales pueden sobrevivir ahí.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-island", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Welcome to Kestrel Island! I'm Dr. Reyes, a scientist. The tide is going out. Look at the little pools of water in the rocks. Some pools have lots of sea anemones. Some have only a few. Let's find out why!",
          "¡Bienvenidos a la Isla Kestrel! Soy la Dra. Reyes, científica. La marea está bajando. Mira las pocitas de agua entre las rocas. Algunas pozas tienen muchas anémonas de mar. Otras tienen pocas. ¡Vamos a averiguar por qué!",
        ),
      },
      {
        kind: "read",
        title: P("Tide pools", "Las pozas de marea"),
        art: ["adv-tide-pool"],
        text: E(
          "Two times a day, the ocean comes up the beach and goes back down. This is the tide. When the tide goes out, water stays in holes in the rocks. These are tide pools. Pools high on the rocks wait a long time for the ocean to come back. The sun makes their water warm. Some water dries up. Pools low on the rocks get new ocean water fast, so they stay cool. A sea anemone can close up to keep water inside its body. But it cannot walk away from a hot pool.",
        ),
        glossary: [
          { word: "tide", en: "the ocean moving up and down the beach every day", es: "marea" },
          {
            word: "anemone",
            en: "a soft sea animal with arms that looks like a flower",
            es: "anémona",
          },
          { word: "dries up", en: "loses its water", es: "se seca" },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Read the field notes. Collect 3 clues that help explain where anemones live.",
          "Lee las notas de campo. Reúne 3 pistas que ayuden a explicar dónde viven las anémonas.",
        ),
        need: 3,
        clues: POOL_CLUES_35,
      },
      {
        kind: "order",
        prompt: P("Put the steps of our count in order.", "Ordena los pasos de nuestro conteo."),
        items: [
          E("Find high pools and low pools."),
          E("Put a square frame in each pool."),
          E("Count the anemones in the frame."),
          E("Write the numbers in our notebook."),
        ],
      },
      {
        kind: "choice",
        prompt: P("Where do more anemones live? Why?", "¿Dónde viven más anémonas? ¿Por qué?"),
        options: [
          {
            text: E("In the high pools, because they are sunny."),
            correct: false,
            feedback: P(
              "Look at your clues. How many anemones are in the high pools?",
              "Mira tus pistas. ¿Cuántas anémonas hay en las pozas altas?",
            ),
          },
          {
            text: E("In the low pools, because the water stays cool."),
            correct: true,
            feedback: P(
              "Yes! Cool water with new ocean water is better for them.",
              "¡Sí! El agua fresca y nueva del océano es mejor para ellas.",
            ),
          },
          {
            text: E("The same in all pools."),
            correct: false,
            feedback: P(
              "Look at the two numbers. Are they the same?",
              "Mira los dos números. ¿Son iguales?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a field note. Where do more anemones live, and why? Use a number.",
          "Escribe una nota de campo. ¿Dónde viven más anémonas y por qué? Usa un número.",
        ),
        frames: [
          E("More anemones live in the ___ pools."),
          E("I know because ___."),
          E("The water there is ___."),
        ],
        wordBank: ["low", "high", "cool", "warm", "ocean", "because", "so", "27", "3"],
        check: {
          minWords: 20,
          needConnectors: ["cause"],
          needAny: [["low", "lower"]],
          evidenceFrom: "clues",
        },
        model: E(
          "More anemones live in the low pools. I know because we counted 27 in the low pools and only 3 in the high pools. The water there stays cool.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Field note saved! Animals live where they can survive. Low pools stay cool and wet.",
          "¡Nota guardada! Los animales viven donde pueden sobrevivir. Las pozas bajas se mantienen frescas y mojadas.",
        ),
      },
    ],
  },
};

// ── mission 2: the volcano's soil ────────────────────────────────────────────
const SOIL_CLUES_68 = [
  {
    id: "a-soil",
    text: E("Site A, a lava flow from 1998: soil only 1 cm deep, in cracks in the rock."),
    relevant: true,
    keys: ["1998", "1", "cm", "site"],
    why: P(
      "Young rock has had little time to break down into soil.",
      "La roca joven ha tenido poco tiempo para convertirse en suelo.",
    ),
  },
  {
    id: "a-plants",
    text: E("Site A: 4 kinds of plants, mostly lichens and mosses."),
    relevant: true,
    keys: ["4", "lichens", "mosses"],
    why: P(
      "These are pioneer species, the first living things on new rock.",
      "Son especies pioneras, los primeros seres vivos sobre la roca nueva.",
    ),
  },
  {
    id: "b-soil",
    text: E("Site B, an ash slope about 300 years old: soil 45 cm deep and dark."),
    relevant: true,
    keys: ["300", "45", "ash"],
    why: P(
      "Old ash has had centuries to weather and mix with dead plants.",
      "La ceniza vieja ha tenido siglos para desgastarse y mezclarse con plantas muertas.",
    ),
  },
  {
    id: "b-plants",
    text: E("Site B: 31 kinds of plants, including ferns, shrubs and trees."),
    relevant: true,
    keys: ["31", "trees", "shrubs"],
    why: P(
      "Deep soil can hold the roots of big plants.",
      "El suelo profundo puede sostener las raíces de plantas grandes.",
    ),
  },
  {
    id: "trail",
    text: E("Site A is closer to the hiking trail."),
    relevant: false,
    why: P(
      "Being near a trail does not make soil. It cannot explain a 1 cm and a 45 cm difference.",
      "Estar cerca de un sendero no produce suelo. No puede explicar la diferencia entre 1 cm y 45 cm.",
    ),
  },
  {
    id: "lizard",
    text: E("We saw a gray lizard sunning on a rock at Site A."),
    relevant: false,
    why: P(
      "One animal sighting does not tell us how soil formed.",
      "Ver un animal una vez no nos dice cómo se formó el suelo.",
    ),
  },
];
const SOIL_CLUES_35 = [
  {
    id: "a-soil",
    text: E("Site A is new lava rock. The soil is very thin, only 1 cm."),
    relevant: true,
    keys: ["new", "thin", "1"],
    why: P(
      "New rock has not had time to make soil.",
      "La roca nueva no ha tenido tiempo de hacer suelo.",
    ),
  },
  {
    id: "a-plants",
    text: E("Site A has only 4 kinds of small plants."),
    relevant: true,
    keys: ["4", "small"],
    why: P("Few plants can grow on rock.", "Pocas plantas pueden crecer en la roca."),
  },
  {
    id: "b-soil",
    text: E("Site B is very old. The soil is deep, 45 cm."),
    relevant: true,
    keys: ["old", "deep", "45"],
    why: P(
      "Old ground has had lots of time to make soil.",
      "El suelo viejo ha tenido mucho tiempo para formarse.",
    ),
  },
  {
    id: "b-plants",
    text: E("Site B has 31 kinds of plants, even trees."),
    relevant: true,
    keys: ["31", "trees"],
    why: P(
      "Big plants need deep soil for their roots.",
      "Las plantas grandes necesitan suelo profundo para sus raíces.",
    ),
  },
  {
    id: "trail",
    text: E("Site A is near the trail."),
    relevant: false,
    why: P("A trail does not make soil.", "Un sendero no hace suelo."),
  },
  {
    id: "lizard",
    text: E("We saw a lizard at Site A."),
    relevant: false,
    why: P(
      "A lizard does not tell us about the soil.",
      "Una lagartija no nos dice nada del suelo.",
    ),
  },
];
const volcanoSoil = {
  id: "volcano-soil",
  title: P("The Volcano's Soil", "El suelo del volcán"),
  goal: P(
    "Listen and read about how soil forms, then explain a difference out loud.",
    "Escuchar y leer cómo se forma el suelo, y luego explicar una diferencia en voz alta.",
  ),
  keyUse: "Explain",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["adv-volcano", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Kestrel Island was built by a volcano. Its last eruption, in 1998, sent a river of lava down the east slope. Today we're comparing that young lava flow with an old ash slope right beside it. Our soil scientist, Tomás, recorded a message about the two sites.",
          "La Isla Kestrel la formó un volcán. Su última erupción, en 1998, mandó un río de lava por la ladera este. Hoy compararemos ese flujo de lava joven con una ladera vieja de ceniza que está al lado. Nuestro científico de suelos, Tomás, grabó un mensaje sobre los dos sitios.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P(
          "Voice message from Tomás, soil scientist",
          "Mensaje de voz de Tomás, científico de suelos",
        ),
        script: E(
          "Hi, team. I tested two sites on the east slope. Site A is the lava flow from 1998. It is mostly bare black rock. I found only one centimeter of soil, in the cracks, and four kinds of plants, mostly lichens and mosses. Site B is an ash slope that is about three hundred years old. There, the soil is forty-five centimeters deep and dark brown, and I counted thirty-one kinds of plants, including ferns, shrubs and trees. The two sites are only one kilometer apart on the same side of the volcano, so they get about the same rain and sun.",
        ),
      },
      {
        kind: "read",
        title: P("How soil forms on a volcano", "Cómo se forma el suelo en un volcán"),
        art: ["adv-volcano"],
        text: E(
          "When lava cools, it hardens into solid rock with no soil at all. Soil forms slowly through weathering, the breaking down of rock into smaller pieces. Rain, wind, and the heating and cooling of each day crack the rock. The first living things to grow on it are pioneer species such as lichens and mosses. They can live on bare rock, and some lichens release acids that help break the rock down. When they die, their remains mix with the tiny rock pieces and form a thin layer of soil. Ferns and grasses can then take root, and as they die and decay, the soil grows deeper and richer. Over hundreds of years, shrubs and trees move in. This slow change from bare rock to a forest is called primary succession. Volcanic ash weathers into soil faster than solid lava, and it is full of minerals that plants need, so old ash slopes can become very fertile.",
        ),
        glossary: [
          {
            word: "weathering",
            en: "the breaking down of rock into small pieces",
            es: "meteorización, el desgaste de la roca",
          },
          {
            word: "pioneer species",
            en: "the first living things to grow in a new place",
            es: "especies pioneras",
          },
          { word: "decay", en: "to slowly break down after dying", es: "descomponerse" },
          { word: "fertile", en: "good for growing plants", es: "fértil" },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Put the stages of primary succession in order.",
          "Ordena las etapas de la sucesión primaria.",
        ),
        items: [
          E("Hot lava cools into bare rock."),
          E("Rain, wind and temperature changes begin to crack the rock."),
          E("Lichens and mosses grow on the rock."),
          E("Dead lichens and mosses mix with rock bits to make thin soil."),
          E("Ferns and grasses take root in the thin soil."),
          E("Shrubs and trees grow in the deeper soil."),
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Collect 3 observations that help explain the difference between Site A and Site B.",
          "Reúne 3 observaciones que ayuden a explicar la diferencia entre el Sitio A y el Sitio B.",
        ),
        need: 3,
        clues: SOIL_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "What best explains why Site B has more plants?",
          "¿Qué explica mejor por qué el Sitio B tiene más plantas?",
        ),
        options: [
          {
            text: E("Site B gets much more rain than Site A."),
            correct: false,
            feedback: P(
              "Tomás said the sites are one kilometer apart on the same side, so they get about the same rain. What else is different about them?",
              "Tomás dijo que los sitios están a un kilómetro en el mismo lado, así que reciben casi la misma lluvia. ¿Qué otra cosa es diferente?",
            ),
          },
          {
            text: E(
              "Site B has had about 300 years for rock and ash to weather and for living things to build soil.",
            ),
            correct: true,
            feedback: P(
              "Yes. Time is the key difference: more time means deeper soil, and deeper soil supports more kinds of plants.",
              "Sí. El tiempo es la diferencia clave: más tiempo significa suelo más profundo, y el suelo profundo sostiene más tipos de plantas.",
            ),
          },
          {
            text: E("Plants cannot grow on dark-colored ground."),
            correct: false,
            feedback: P(
              "Site B's soil is dark brown, and it has 31 kinds of plants. Look at the ages of the two sites.",
              "El suelo del Sitio B es café oscuro y tiene 31 tipos de plantas. Mira la edad de los dos sitios.",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Explain out loud to the field team why Site B has more plants than Site A. Use data from both sites.",
          "Explica en voz alta al equipo por qué el Sitio B tiene más plantas que el Sitio A. Usa datos de los dos sitios.",
        ),
        frames: [
          E("Site B has more plants because ___."),
          E("At Site A, ___, but at Site B, ___."),
          E("This shows that soil ___."),
        ],
        wordBank: [
          "weathering",
          "pioneer species",
          "soil",
          "deeper",
          "centimeters",
          "years",
          "because",
          "however",
          "as a result",
        ],
        check: {
          minWords: 35,
          needConnectors: ["cause"],
          needAny: [["soil"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Site B has more plants because it has had about 300 years to build soil. At Site A, the 1998 lava has only 1 cm of soil and 4 kinds of plants, mostly lichens and mosses. At Site B, the ash soil is 45 cm deep, so 31 kinds of plants grow there, even trees.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Soil report saved. Bare rock becomes soil through weathering and pioneer species, and more time means deeper soil and more kinds of plants.",
          "Informe de suelo guardado. La roca desnuda se convierte en suelo por la meteorización y las especies pioneras; más tiempo significa suelo más profundo y más tipos de plantas.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["adv-volcano", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "This island was made by a volcano! In 1998, hot lava ran down this side. Today we will look at two places: new lava rock, and an old slope next to it. Tomás, our soil scientist, sent us a message.",
          "¡Esta isla la hizo un volcán! En 1998, lava caliente bajó por este lado. Hoy veremos dos lugares: roca de lava nueva y una ladera vieja junto a ella. Tomás, nuestro científico de suelos, nos mandó un mensaje.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Message from Tomás", "Mensaje de Tomás"),
        script: E(
          "Hi, team! Site A is new lava rock from 1998. It has almost no soil, just one centimeter. Only four kinds of small plants grow there. Site B is very old, about three hundred years. The soil is deep, forty-five centimeters. Thirty-one kinds of plants grow there, even trees! Both places get the same rain.",
        ),
      },
      {
        kind: "read",
        title: P("How rock becomes soil", "Cómo la roca se vuelve suelo"),
        art: ["adv-volcano"],
        text: E(
          "Lava is melted rock. When it cools, it becomes hard rock. There is no soil yet. Rain, wind, heat and cold crack the rock into tiny pieces. Then tiny living things called lichens and mosses grow on the rock. When they die, they mix with the rock pieces. That makes a thin layer of soil. Now grasses and ferns can grow. Year after year, the soil gets deeper. After a very long time, even trees can grow there.",
        ),
        glossary: [
          {
            word: "lava",
            en: "melted rock from a volcano",
            es: "lava, roca derretida de un volcán",
          },
          { word: "lichens", en: "tiny living things that grow flat on rocks", es: "líquenes" },
          { word: "layer", en: "one flat part on top of another", es: "capa" },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "How does rock become soil? Put the steps in order.",
          "¿Cómo se vuelve suelo la roca? Ordena los pasos.",
        ),
        items: [
          E("Lava cools into hard rock."),
          E("Rain and wind crack the rock."),
          E("Lichens and mosses grow."),
          E("A thin layer of soil forms."),
          E("Trees can grow in deep soil."),
        ],
      },
      {
        kind: "clues",
        prompt: P("Collect 3 clues about the two sites.", "Reúne 3 pistas sobre los dos sitios."),
        need: 3,
        clues: SOIL_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("Why does Site B have more plants?", "¿Por qué el Sitio B tiene más plantas?"),
        options: [
          {
            text: E("It gets more rain."),
            correct: false,
            feedback: P(
              "Tomás said both places get the same rain. What else is different?",
              "Tomás dijo que los dos lugares reciben la misma lluvia. ¿Qué más es diferente?",
            ),
          },
          {
            text: E("It is older, so it has deeper soil."),
            correct: true,
            feedback: P(
              "Yes! More time made deeper soil.",
              "¡Sí! Más tiempo hizo un suelo más profundo.",
            ),
          },
          {
            text: E("Plants do not like the trail."),
            correct: false,
            feedback: P(
              "The trail does not make soil. Look at how old each site is.",
              "El sendero no hace suelo. Mira qué tan viejo es cada sitio.",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Tell the team why Site B has more plants. Use a number.",
          "Dile al equipo por qué el Sitio B tiene más plantas. Usa un número.",
        ),
        frames: [
          E("Site B has more plants because ___."),
          E("Site A has ___."),
          E("Site B has ___."),
        ],
        wordBank: ["old", "new", "soil", "deep", "thin", "because", "so", "45", "1"],
        check: {
          minWords: 20,
          needConnectors: ["cause"],
          needAny: [["soil"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Site B has more plants because it is very old, so the soil is deep. It has 45 cm of soil. Site A is new rock with only 1 cm of soil.",
        ),
      },
    ],
  },
};

// ── mission 3: the seabird count ─────────────────────────────────────────────
const BIRD_CLUES_68 = [
  {
    id: "kestrel",
    text: E("Kestrel Island burrows with eggs: 38 in 2020, then 52, 66, 79, 88 and 94 in 2025."),
    relevant: true,
    keys: ["38", "94", "burrows"],
    why: P(
      "The number of nesting burrows more than doubled after 2020.",
      "El número de madrigueras con nido se duplicó con creces después de 2020.",
    ),
  },
  {
    id: "gannet",
    text: E(
      "Gannet Rock, a nearby island where rats still live: about 35 burrows with eggs every year.",
    ),
    relevant: true,
    keys: ["gannet", "35", "rats"],
    why: P(
      "This is the comparison: same birds and same ocean, but rats were not removed, and the count did not grow.",
      "Esta es la comparación: las mismas aves y el mismo océano, pero sin quitar las ratas, y el conteo no creció.",
    ),
  },
  {
    id: "chicks",
    text: E(
      "Before the rats were removed, about 2 of every 10 eggs became chicks that flew; afterward, about 6 of every 10.",
    ),
    relevant: true,
    keys: ["2", "6", "chicks", "eggs"],
    why: P(
      "Rats eat eggs and chicks. Three times as many chicks surviving is a cause for growth.",
      "Las ratas comen huevos y polluelos. Que sobrevivan tres veces más polluelos explica el crecimiento.",
    ),
  },
  {
    id: "removed",
    text: E("The team removed rats from Kestrel Island in the winter of 2020."),
    relevant: true,
    keys: ["removed", "winter", "2020"],
    why: P(
      "This tells us when the change happened, right before the counts began to climb.",
      "Esto nos dice cuándo ocurrió el cambio, justo antes de que los conteos empezaran a subir.",
    ),
  },
  {
    id: "boat",
    text: E("In 2023 the field station got a new boat."),
    relevant: false,
    why: P(
      "The counts were already rising before 2023, and a boat does not change how many eggs hatch.",
      "Los conteos ya subían antes de 2023, y un barco no cambia cuántos huevos nacen.",
    ),
  },
  {
    id: "distance",
    text: E("Shearwaters can fly thousands of kilometers over the ocean each year."),
    relevant: false,
    why: P(
      "True and amazing, but it is the same for the birds on both islands, so it cannot explain the difference.",
      "Es cierto y sorprendente, pero es igual para las aves de las dos islas, así que no explica la diferencia.",
    ),
  },
];
const BIRD_CLUES_35 = [
  {
    id: "kestrel",
    text: E("Kestrel Island nests: 38 in 2020 and 94 in 2025."),
    relevant: true,
    keys: ["38", "94", "nests"],
    why: P("The number of nests went up a lot!", "¡El número de nidos subió mucho!"),
  },
  {
    id: "gannet",
    text: E("Gannet Rock still has rats. It has about 35 nests every year."),
    relevant: true,
    keys: ["gannet", "35", "rats"],
    why: P("With rats, the nests did not go up.", "Con ratas, los nidos no subieron."),
  },
  {
    id: "chicks",
    text: E("Rats eat eggs. Now more eggs hatch into chicks."),
    relevant: true,
    keys: ["eggs", "chicks", "hatch"],
    why: P("More chicks means more birds later.", "Más polluelos significa más aves después."),
  },
  {
    id: "removed",
    text: E("The rats were taken off Kestrel Island in 2020."),
    relevant: true,
    keys: ["rats", "2020", "taken"],
    why: P("This is when things changed.", "Aquí es cuando cambiaron las cosas."),
  },
  {
    id: "boat",
    text: E("The station got a new boat."),
    relevant: false,
    why: P("A boat does not help eggs hatch.", "Un barco no ayuda a que nazcan los huevos."),
  },
  {
    id: "distance",
    text: E("Shearwaters can fly very far."),
    relevant: false,
    why: P(
      "Birds on both islands fly far, so it does not explain the change.",
      "Las aves de las dos islas vuelan lejos, así que no explica el cambio.",
    ),
  },
];
const seabirds = {
  id: "seabird-count",
  title: P("The Seabird Count", "El conteo de aves marinas"),
  goal: P(
    "Read population data, compare two islands and argue for a claim with evidence.",
    "Leer datos de población, comparar dos islas y defender una afirmación con evidencia.",
  ),
  keyUse: "Argue",
  domains: ["Reading", "Writing"],
  final: false,
  book: {
    templateId: "informational-report",
    title: P(
      "Field Report: The Seabirds of Kestrel Island",
      "Informe de campo: Las aves marinas de la Isla Kestrel",
    ),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["adv-seabird", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Shearwaters are seabirds that spend their days far out at sea and come back to the island after dark to nest in underground burrows. For six years our station has counted their nests. Something big changed in 2020. Read the report, then tell me what the data show.",
          "Las pardelas son aves marinas que pasan el día lejos en el mar y vuelven a la isla de noche para anidar en madrigueras bajo tierra. Durante seis años la estación ha contado sus nidos. Algo grande cambió en 2020. Lee el informe y luego dime qué muestran los datos.",
        ),
      },
      {
        kind: "read",
        title: P(
          "Station report: Counting shearwaters",
          "Informe de la estación: Contando pardelas",
        ),
        art: ["adv-field-notes"],
        text: E(
          "Shearwaters lay a single egg each year in a burrow dug into the soil. Because the parents feed at sea, the egg and the chick are often alone in the burrow. On many islands around the world, rats that arrived on ships long ago eat seabird eggs and chicks, and the bird populations shrink. In the winter of 2020, while the shearwaters were away at sea, our team removed the rats from Kestrel Island. Every year since, volunteers have checked the same 200 marked burrows with a small camera on a flexible pole and recorded how many hold an egg. To know whether any change was caused by removing the rats, we also count burrows on Gannet Rock, a smaller island two kilometers away. It has the same kind of soil and the same shearwaters, but rats still live there. Scientists call an island like this a comparison site. If both islands changed, something else, such as ocean food, might be the cause.",
        ),
        glossary: [
          {
            word: "burrow",
            en: "a hole an animal digs in the ground to live in",
            es: "madriguera",
          },
          {
            word: "populations",
            en: "all the animals of one kind in one place",
            es: "poblaciones",
          },
          {
            word: "comparison site",
            en: "a place like the test place, but without the change",
            es: "sitio de comparación",
          },
          { word: "flexible", en: "able to bend easily", es: "flexible" },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Here is the data table and the station notes. Collect 3 pieces of evidence about why the shearwater count changed.",
          "Aquí están la tabla de datos y las notas. Reúne 3 evidencias sobre por qué cambió el conteo de pardelas.",
        ),
        need: 3,
        clues: BIRD_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P("Which claim do the data support?", "¿Qué afirmación apoyan los datos?"),
        options: [
          {
            text: E("Shearwater numbers rise every year on every island, no matter what."),
            correct: false,
            feedback: P(
              "Check Gannet Rock on your evidence board. Did its count rise?",
              "Revisa Gannet Rock en tu tablero de evidencia. ¿Subió su conteo?",
            ),
          },
          {
            text: E("Removing the rats helped the shearwater population on Kestrel Island grow."),
            correct: true,
            feedback: P(
              "Yes. Kestrel Island grew after the rats were removed, while Gannet Rock, with rats, stayed the same.",
              "Sí. La Isla Kestrel creció después de quitar las ratas, mientras Gannet Rock, con ratas, se quedó igual.",
            ),
          },
          {
            text: E("The station's new boat attracted more birds."),
            correct: false,
            feedback: P(
              "When did the boat arrive, and when did the counts start rising? Look for evidence about eggs and chicks.",
              "¿Cuándo llegó el barco y cuándo empezaron a subir los conteos? Busca evidencia sobre huevos y polluelos.",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Plan your argument. Put the parts in an order a reader can follow.",
          "Planea tu argumento. Ordena las partes para que un lector pueda seguirlas.",
        ),
        items: [
          E("Claim: what caused the change."),
          E("Evidence from Kestrel Island's counts."),
          E("Evidence from Gannet Rock, the comparison site."),
          E("Reasoning: how rats affect eggs and chicks."),
          E("Conclusion: what this means for the island."),
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write an argument for the station report: what caused the shearwater count to change? Use data from both islands.",
          "Escribe un argumento para el informe: ¿qué causó el cambio en el conteo de pardelas? Usa datos de las dos islas.",
        ),
        frames: [
          E("Removing the rats ___."),
          E("The data show that ___."),
          E("In contrast, on Gannet Rock ___."),
          E("This is because rats ___."),
        ],
        wordBank: [
          "population",
          "burrows",
          "comparison",
          "the data show",
          "in contrast",
          "however",
          "because",
          "therefore",
          "increased",
        ],
        check: {
          minWords: 50,
          needConnectors: ["cause", "contrast"],
          needWords: ["data"],
          evidenceFrom: "clues",
        },
        model: E(
          "Removing the rats helped the shearwaters on Kestrel Island. The data show that burrows with eggs increased from 38 in 2020 to 94 in 2025. In contrast, Gannet Rock, where rats still live, stayed at about 35 burrows every year. This is because rats eat eggs and chicks, so after they were removed, about 6 of every 10 eggs became chicks instead of 2.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Argument saved. A comparison site lets scientists show that a change, like removing rats, caused a result.",
          "Argumento guardado. Un sitio de comparación permite mostrar que un cambio, como quitar las ratas, causó un resultado.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["adv-seabird", "char-scientist"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "These are shearwaters, seabirds that live on the ocean. At night they come back to the island to their nests under the ground. We count their nests every year. Something changed in 2020!",
          "Estas son pardelas, aves que viven en el océano. De noche vuelven a la isla a sus nidos bajo tierra. Contamos sus nidos cada año. ¡Algo cambió en 2020!",
        ),
      },
      {
        kind: "read",
        title: P("Counting shearwaters", "Contando pardelas"),
        art: ["adv-field-notes"],
        text: E(
          "A shearwater lays one egg in a hole under the ground. The parents fly out to sea to find fish. The egg stays alone in the nest. Long ago, rats came to the island on ships. Rats eat eggs and baby birds. In 2020, our team took the rats off Kestrel Island. Every year we count the nests with eggs. We also count nests on Gannet Rock, a small island nearby. Gannet Rock still has rats. Comparing the two islands helps us know what made the change.",
        ),
        glossary: [
          { word: "nests", en: "places where birds lay eggs", es: "nidos" },
          {
            word: "compare",
            en: "to look at how two things are alike and different",
            es: "comparar",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Collect 3 clues about why the birds changed.",
          "Reúne 3 pistas sobre por qué cambiaron las aves.",
        ),
        need: 3,
        clues: BIRD_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("What do the numbers show?", "¿Qué muestran los números?"),
        options: [
          {
            text: E("Taking away the rats helped the birds."),
            correct: true,
            feedback: P(
              "Yes! Kestrel Island went up. Gannet Rock, with rats, did not.",
              "¡Sí! La Isla Kestrel subió. Gannet Rock, con ratas, no.",
            ),
          },
          {
            text: E("Birds go up on every island."),
            correct: false,
            feedback: P(
              "Look at Gannet Rock. Did its number go up?",
              "Mira Gannet Rock. ¿Subió su número?",
            ),
          },
          {
            text: E("The new boat brought birds."),
            correct: false,
            feedback: P(
              "Can a boat help eggs hatch? Look for a clue about eggs.",
              "¿Un barco puede ayudar a que nazcan huevos? Busca una pista sobre huevos.",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P("Put the story of the birds in order.", "Ordena la historia de las aves."),
        items: [
          E("Rats come to the island on ships."),
          E("Rats eat many eggs, and there are few birds."),
          E("The team takes the rats off the island."),
          E("More eggs hatch, and the birds increase."),
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write for the station report: why did the birds increase? Use numbers from both islands.",
          "Escribe para el informe: ¿por qué aumentaron las aves? Usa números de las dos islas.",
        ),
        frames: [
          E("The birds increased because ___."),
          E("On Kestrel Island, ___."),
          E("But on Gannet Rock, ___."),
        ],
        wordBank: ["rats", "eggs", "chicks", "nests", "because", "but", "38", "94", "35"],
        check: { minWords: 25, needConnectors: ["cause", "contrast"], evidenceFrom: "clues" },
        model: E(
          "The birds increased because the team took the rats away, and rats eat eggs. On Kestrel Island, the nests went from 38 to 94. But on Gannet Rock, with rats, there are still about 35 nests.",
        ),
      },
    ],
  },
};

// ── mission 4 (final): Island Science Night ──────────────────────────────────
const NIGHT_CLUES_68 = [
  {
    id: "pools",
    text: E("Tide pools: 27 anemones in the cool low pools, 3 in the warm high pools."),
    relevant: true,
    keys: ["27", "anemones", "pools"],
    why: P(
      "Conditions in each zone decide where anemones survive.",
      "Las condiciones de cada zona deciden dónde sobreviven las anémonas.",
    ),
  },
  {
    id: "soil",
    text: E(
      "Volcano: 1 cm of soil and 4 kinds of plants on young lava; 45 cm and 31 kinds on the old ash slope.",
    ),
    relevant: true,
    keys: ["45", "soil", "31"],
    why: P(
      "Plants depend on the soil that time and living things build.",
      "Las plantas dependen del suelo que construyen el tiempo y los seres vivos.",
    ),
  },
  {
    id: "birds",
    text: E(
      "Seabirds: 38 nests in 2020 grew to 94 in 2025 after the rats were removed; Gannet Rock, with rats, stayed near 35.",
    ),
    relevant: true,
    keys: ["38", "94", "rats", "nests"],
    why: P(
      "A change in the environment (no rats) changed the population.",
      "Un cambio en el ambiente (sin ratas) cambió la población.",
    ),
  },
  {
    id: "temp",
    text: E("High tide pools reached 27°C at noon; low pools stayed at 18°C."),
    relevant: true,
    keys: ["27", "18", "temperature"],
    why: P(
      "Temperature is one condition that limits where animals live.",
      "La temperatura es una condición que limita dónde viven los animales.",
    ),
  },
  {
    id: "solar",
    text: E("The field station runs on solar panels."),
    relevant: false,
    why: P(
      "A good fact about the station, but not evidence about how living things depend on the island.",
      "Un buen dato sobre la estación, pero no es evidencia de cómo los seres vivos dependen de la isla.",
    ),
  },
  {
    id: "trail",
    text: E("The trail to the volcano is 3 kilometers long."),
    relevant: false,
    why: P(
      "The length of a trail says nothing about the living things you studied.",
      "El largo del sendero no dice nada de los seres vivos que estudiaste.",
    ),
  },
];
const NIGHT_CLUES_35 = [
  {
    id: "pools",
    text: E("More anemones live in cool low pools (27) than warm high pools (3)."),
    relevant: true,
    keys: ["anemones", "27", "pools"],
    why: P(
      "Where it is cool and wet, anemones survive.",
      "Donde está fresco y mojado, las anémonas sobreviven.",
    ),
  },
  {
    id: "soil",
    text: E("Old Site B has deep soil and 31 kinds of plants."),
    relevant: true,
    keys: ["soil", "31", "deep"],
    why: P("Plants need deep soil.", "Las plantas necesitan suelo profundo."),
  },
  {
    id: "birds",
    text: E("After the rats left, bird nests went from 38 to 94."),
    relevant: true,
    keys: ["rats", "nests", "94"],
    why: P("A safer island helped the birds.", "Una isla más segura ayudó a las aves."),
  },
  {
    id: "temp",
    text: E("High pools are warm. Low pools are cool."),
    relevant: true,
    keys: ["warm", "cool"],
    why: P(
      "Heat changes where animals can live.",
      "El calor cambia dónde pueden vivir los animales.",
    ),
  },
  {
    id: "solar",
    text: E("The station has solar panels."),
    relevant: false,
    why: P(
      "That is about the station, not about animals or plants.",
      "Eso es sobre la estación, no sobre animales o plantas.",
    ),
  },
  {
    id: "trail",
    text: E("The trail is long."),
    relevant: false,
    why: P(
      "A trail does not show how living things need their home.",
      "Un sendero no muestra cómo los seres vivos necesitan su hogar.",
    ),
  },
];
const scienceNight = {
  id: "science-night",
  title: P("Island Science Night", "Noche de ciencia en la isla"),
  goal: P(
    "Bring your investigations together and argue a big idea with evidence from more than one.",
    "Unir tus investigaciones y defender una gran idea con evidencia de más de una.",
  ),
  keyUse: "Argue",
  domains: ["Listening", "Writing", "Speaking"],
  final: true,
  book: {
    templateId: "mission-report",
    title: P("Kestrel Island Field Report", "Informe de campo de la Isla Kestrel"),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-island", "char-scientist", "char-maya"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Tonight is Island Science Night. Families from the harbor town are coming to the field station to hear what our junior scientists discovered. The station director has one big question for you.",
          "Esta noche es la Noche de ciencia de la isla. Familias del pueblo del puerto vienen a la estación para escuchar lo que descubrieron nuestros jóvenes científicos. La directora tiene una gran pregunta para ti.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("The station director's question", "La pregunta de la directora"),
        script: E(
          "Good evening, everyone. Our visitors often ask us the same question: why should a small island matter? Here is what I want you to show them tonight. Living things depend on the conditions of the place where they live, and when those conditions change, the living things change too. Use evidence from at least two of your investigations: the tide pools, the volcano's soil, or the seabirds. Explain how each one shows this idea, and finish with what you would protect on Kestrel Island.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Choose your 3 strongest pieces of evidence for the director's big idea.",
          "Elige tus 3 evidencias más fuertes para la gran idea de la directora.",
        ),
        need: 3,
        clues: NIGHT_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Which sentence best connects your evidence to the big idea?",
          "¿Qué oración conecta mejor tu evidencia con la gran idea?",
        ),
        options: [
          {
            text: E("Every living thing on the island is the same, so conditions do not matter."),
            correct: false,
            feedback: P(
              "Your evidence shows big differences: 3 anemones and 27, 4 kinds of plants and 31. What made those differences?",
              "Tu evidencia muestra grandes diferencias: 3 anémonas y 27, 4 tipos de plantas y 31. ¿Qué causó esas diferencias?",
            ),
          },
          {
            text: E(
              "In each place we studied, the conditions decided which living things could survive and grow.",
            ),
            correct: true,
            feedback: P(
              "Yes. That sentence links every investigation to the director's idea.",
              "Sí. Esa oración une cada investigación con la idea de la directora.",
            ),
          },
          {
            text: E("One observation is enough to prove a big idea."),
            correct: false,
            feedback: P(
              "The director asked for at least two investigations. Why would scientists want evidence from more than one place?",
              "La directora pidió al menos dos investigaciones. ¿Por qué querrían los científicos evidencia de más de un lugar?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Plan your talk. Put the parts in order.",
          "Planea tu charla. Ordena las partes.",
        ),
        items: [
          E("State the big idea as your claim."),
          E("Give evidence from your first investigation."),
          E("Give evidence from a second investigation."),
          E("Explain how both investigations show the same idea."),
          E("Say what you would protect on Kestrel Island, and why."),
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Talk plan saved. Claim, two investigations, reasoning, and what to protect. Now write it in your own words.",
          "Plan guardado. Afirmación, dos investigaciones, razonamiento y qué proteger. Ahora escríbelo con tus palabras.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write your Science Night presentation: show that living things depend on the conditions where they live. Use evidence from at least two investigations and end with what you would protect.",
          "Escribe tu presentación: muestra que los seres vivos dependen de las condiciones donde viven. Usa evidencia de al menos dos investigaciones y termina con lo que protegerías.",
        ),
        frames: [
          E("Living things on Kestrel Island depend on ___."),
          E("In the tide pools, ___."),
          E("On the volcano, ___."),
          E("Both investigations show that ___ because ___."),
          E("I would protect ___ because ___."),
        ],
        wordBank: [
          "conditions",
          "survive",
          "depend on",
          "evidence",
          "the data show",
          "because",
          "as a result",
          "protect",
          "environment",
        ],
        check: {
          minWords: 70,
          needConnectors: ["cause"],
          needWords: ["evidence"],
          needAny: [["protect", "protecting"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Living things on Kestrel Island depend on the conditions where they live. My first evidence comes from the tide pools: we counted 27 anemones in the cool low pools but only 3 in the warm high pools. My second evidence comes from the seabirds: after the rats were removed, nests grew from 38 to 94, while Gannet Rock, with rats, stayed near 35. Both investigations show that when conditions change, living things change too, because they can only survive where their needs are met. I would protect the nesting burrows, so the island stays free of rats.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-island", "char-scientist", "char-maya"],
        speaker: "Dr. Reyes",
        listen: true,
        text: P(
          "Tonight is Island Science Night! Families are coming to hear what you found. The station director has a question for you.",
          "¡Esta noche es la Noche de ciencia! Vienen familias a escuchar lo que descubriste. La directora tiene una pregunta para ti.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("The director's question", "La pregunta de la directora"),
        script: E(
          "Hello, scientists! Here is my question. How do living things on our island need their home? Tell our visitors about two things you studied. You can talk about the tide pools, the volcano soil, or the seabirds. Then tell us one thing we should protect.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Pick your 3 best clues for your talk.",
          "Elige tus 3 mejores pistas para tu charla.",
        ),
        need: 3,
        clues: NIGHT_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("Which sentence is your big idea?", "¿Qué oración es tu gran idea?"),
        options: [
          {
            text: E("Living things need the right home to survive."),
            correct: true,
            feedback: P("Yes! All your clues show this.", "¡Sí! Todas tus pistas lo muestran."),
          },
          {
            text: E("All the pools and places are the same."),
            correct: false,
            feedback: P(
              "Look at your numbers. Are 3 and 27 the same?",
              "Mira tus números. ¿3 y 27 son iguales?",
            ),
          },
          {
            text: E("Plants and animals do not need anything."),
            correct: false,
            feedback: P(
              "What did the plants on Site B have that Site A did not?",
              "¿Qué tenían las plantas del Sitio B que el Sitio A no tenía?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P("Plan your talk.", "Planea tu charla."),
        items: [
          E("Say the big idea."),
          E("Tell about one thing you studied."),
          E("Tell about another thing you studied."),
          E("Say what we should protect."),
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write your Science Night talk. Tell about two things you studied. Then say what we should protect.",
          "Escribe tu charla. Cuenta dos cosas que estudiaste. Luego di qué debemos proteger.",
        ),
        frames: [
          E("Living things need ___."),
          E("In the tide pools, ___."),
          E("The seabirds ___."),
          E("We should protect ___ because ___."),
        ],
        wordBank: ["need", "survive", "cool", "soil", "nests", "rats", "because", "so", "protect"],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [["protect", "protecting"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Living things need the right home to survive. In the tide pools, more anemones live in the cool low pools, 27, than in the warm high pools. The seabirds grew when the rats left, from 38 nests to 94 nests. We should protect the bird nests because rats eat the eggs.",
        ),
      },
    ],
  },
};

export default {
  id: "science-island",
  title: P("Science Discovery Island", "Isla de descubrimientos científicos"),
  tagline: P(
    "Tide pools, a volcano and a seabird colony. Observe, measure and explain.",
    "Pozas de marea, un volcán y una colonia de aves. Observa, mide y explica.",
  ),
  theme: {
    bg: "bg-island",
    accent: "#075568",
    soft: "#e2f1ee",
    ink: "#043b47",
    hero: ["char-scientist", "char-maya"],
  },
  intro: P(
    "Kestrel Island is a living laboratory. Join Dr. Reyes at the field station as a junior scientist: survey tide pools, test a volcano's soil and count seabirds, then use your evidence to explain how living things depend on the place they live.",
    "La Isla Kestrel es un laboratorio vivo. Únete a la Dra. Reyes en la estación de campo como joven científico: estudia pozas de marea, analiza el suelo de un volcán y cuenta aves marinas; luego usa tu evidencia para explicar cómo los seres vivos dependen del lugar donde viven.",
  ),
  guide: { name: "Dr. Reyes", art: "char-scientist" },
  missions: [tidePools, volcanoSoil, seabirds, scienceNight],
};
