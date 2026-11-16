// The Lost City (Adventure Worlds, ADVENTURE-SCHEMA.md): the survey team at the ruins of Vellmora, a fictional
// hilltop city on Kestrel Ridge, must reach the Upper Terraces to record the old spring and storehouse. Learners
// describe carved panels and infer what the city valued, interview a trail guide, a retired water-keeper from the
// village of Sorrel Creek (the city's descendants) and a visiting hiker, retell the village's own history of the city,
// and justify which route is safe today. Language functions by mission: 1 describe + infer; 2 clarify + compare;
// 3 sequence + explain cause; 4 justify + compare (the final demonstration). Same story, same decisions and same
// reasoning in both bands; 3-5 has shorter texts, simpler frames and a lighter word demand. Original place, story and
// characters; the city and its people are fictional.
const P = (en, es) => ({ en, es });
const E = (en) => ({ en });

// ── mission 1: the carved gate ───────────────────────────────────────────────
const GATE_CLUES_68 = [
  {
    id: "spring",
    text: E("Panel 1: a circle with wavy lines of water flowing down a set of steps."),
    relevant: true,
    keys: ["spring", "water", "steps"],
    why: P(
      "Dr. Okafor's notes say the circle is the spring and the steps are the terraced gardens. The builders carved how their water reached their food.",
      "Las notas de la Dra. Okafor dicen que el círculo es el manantial y los escalones son los jardines en terrazas. Tallaron cómo el agua llegaba a su comida.",
    ),
  },
  {
    id: "baskets",
    text: E("Panel 2: seven baskets in a row above a doorway."),
    relevant: true,
    keys: ["baskets", "storehouse", "seven"],
    why: P(
      "The seven baskets match the seven storehouse rooms on the Upper Terraces. Storing food was important enough to carve on the main gate.",
      "Las siete canastas coinciden con los siete cuartos del almacén en las Terrazas Altas. Guardar comida era tan importante que lo tallaron en la puerta principal.",
    ),
  },
  {
    id: "sun",
    text: E(
      "Panel 3: a sun under a narrow notch that lets light through on the spring equinox morning.",
    ),
    relevant: true,
    keys: ["sun", "notch", "equinox"],
    why: P(
      "A notch that catches the light on one morning a year works like a calendar. It shows the builders tracked the seasons, probably for planting.",
      "Una muesca que deja pasar la luz una mañana al año funciona como un calendario. Muestra que seguían las estaciones, probablemente para sembrar.",
    ),
  },
  {
    id: "cup",
    text: E("Panel 4: one person holding out a cup to another person."),
    relevant: true,
    keys: ["cup", "sharing", "offering"],
    why: P(
      "Offering a cup is a picture of sharing. The people chose to show welcome and sharing on the way into their city.",
      "Ofrecer una taza es una imagen de compartir. Eligieron mostrar bienvenida y generosidad en la entrada de su ciudad.",
    ),
  },
  {
    id: "arrow",
    text: E("A blue painted arrow on the right pillar."),
    relevant: false,
    why: P(
      "The notes say hikers painted this arrow in the 1990s. It tells us about modern visitors, not about the people who built the gate.",
      "Las notas dicen que unos excursionistas pintaron esta flecha en los años noventa. Habla de visitantes modernos, no de quienes construyeron la puerta.",
    ),
  },
  {
    id: "crack",
    text: E("A long crack across the top stone."),
    relevant: false,
    why: P(
      "Centuries of weather can crack stone. A crack tells us how old the gate is, not what the builders cared about.",
      "Siglos de lluvia y sol pueden agrietar la piedra. Una grieta nos dice cuánto tiempo tiene la puerta, no lo que les importaba a quienes la construyeron.",
    ),
  },
];
const GATE_CLUES_35 = [
  {
    id: "spring",
    text: E("Panel 1: water flows from a spring down some steps."),
    relevant: true,
    keys: ["spring", "water", "steps"],
    why: P(
      "The steps are the gardens. The people carved how water got to their food.",
      "Los escalones son los jardines. Tallaron cómo el agua llegaba a su comida.",
    ),
  },
  {
    id: "baskets",
    text: E("Panel 2: seven baskets over a door."),
    relevant: true,
    keys: ["baskets", "seven", "storehouse"],
    why: P(
      "The baskets match the seven storehouse rooms. Saving food was important.",
      "Las canastas coinciden con los siete cuartos del almacén. Guardar comida era importante.",
    ),
  },
  {
    id: "sun",
    text: E("Panel 3: a sun with a small notch. Light shines through it on one spring morning."),
    relevant: true,
    keys: ["sun", "notch", "light"],
    why: P(
      "The notch works like a calendar. The people knew when to plant.",
      "La muesca funciona como un calendario. Sabían cuándo sembrar.",
    ),
  },
  {
    id: "cup",
    text: E("Panel 4: a person gives a cup to a friend."),
    relevant: true,
    keys: ["cup", "gives", "sharing"],
    why: P("Giving a cup shows sharing.", "Dar una taza muestra que compartían."),
  },
  {
    id: "arrow",
    text: E("A blue painted arrow."),
    relevant: false,
    why: P(
      "Hikers painted it about thirty years ago. It is not from the old city.",
      "Unos excursionistas la pintaron hace unos treinta años. No es de la ciudad antigua.",
    ),
  },
  {
    id: "crack",
    text: E("A crack in the top stone."),
    relevant: false,
    why: P(
      "Old stone cracks over time. A crack does not tell us what the people cared about.",
      "La piedra vieja se agrieta con el tiempo. Una grieta no nos dice qué les importaba.",
    ),
  },
];

const carvedGate = {
  id: "the-carved-gate",
  title: P("The Carved Gate", "La puerta tallada"),
  goal: P(
    "Describe the carvings on the gate, then infer what the people of Vellmora valued.",
    "Describir las tallas de la puerta y luego inferir qué valoraba la gente de Vellmora.",
  ),
  keyUse: "Inform",
  domains: ["Listening", "Reading", "Writing"],
  final: false,
  book: {
    templateId: "informational-report",
    title: P("Field Report: The Carved Gate", "Informe de campo: La puerta tallada"),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "adv-carved-gate"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "Welcome to the survey team. I'm Dr. Lena Okafor, the archaeologist in charge. We are standing at the Lower Gate of Vellmora, a city built on Kestrel Ridge about seven hundred years ago. People in the village of Sorrel Creek, down by the river, are the city's descendants, and we work with their permission. Our rule is simple: describe first, then infer. Let's start with my field notes on the gate.",
          "Bienvenido al equipo de exploración. Soy la Dra. Lena Okafor, la arqueóloga a cargo. Estamos en la Puerta Baja de Vellmora, una ciudad construida en la cresta Kestrel hace unos setecientos años. La gente del pueblo de Sorrel Creek, junto al río, desciende de esta ciudad, y trabajamos con su permiso. Nuestra regla es sencilla: primero describir, después inferir. Empecemos con mis notas de campo sobre la puerta.",
        ),
      },
      {
        kind: "read",
        title: P("Field notes: The Lower Gate", "Notas de campo: La Puerta Baja"),
        art: ["adv-carved-gate"],
        text: E(
          "The Lower Gate is made of two stone pillars, each about four meters tall, joined at the top by a long flat stone called a lintel. Four carved panels survive. Panel 1, on the left pillar, shows a circle with wavy lines flowing down a set of steps. We believe the circle is the spring at the top of the ridge and the steps are the terraced gardens, flat strips of farmland cut into the hillside. Panel 2, on the right pillar, shows seven baskets in a row above a doorway. They match the seven storehouse rooms we mapped on the Upper Terraces. Panel 3, on the lintel, is a sun under a narrow notch. On the morning of the spring equinox, when day and night are the same length, sunlight shines through the notch onto the path. Panel 4 shows one person holding out a cup to another. Beside the path, a stone channel still runs down from the spring. Please note: the blue arrow on the right pillar was painted by hikers in the 1990s.",
        ),
        glossary: [
          {
            word: "lintel",
            en: "a flat stone or beam across the top of a door or gate",
            es: "dintel, la piedra o viga sobre una puerta",
          },
          {
            word: "terraced",
            en: "cut into flat steps on a hillside",
            es: "en terrazas, cortado en escalones planos en una ladera",
          },
          {
            word: "equinox",
            en: "a day in spring or fall when day and night are the same length",
            es: "equinoccio, día en que el día y la noche duran lo mismo",
          },
          {
            word: "channel",
            en: "a narrow path that water flows along",
            es: "canal, un camino angosto por donde corre el agua",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Study the gate. Collect 3 clues that show what the people of Vellmora valued.",
          "Estudia la puerta. Reúne 3 pistas que muestren qué valoraba la gente de Vellmora.",
        ),
        need: 3,
        clues: GATE_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Look at the clues you kept. What can you infer about the people who built the gate?",
          "Mira las pistas que guardaste. ¿Qué puedes inferir sobre la gente que construyó la puerta?",
        ),
        options: [
          {
            text: E("They planned carefully to bring water, grow and store food, and share it."),
            correct: true,
            feedback: P(
              "Yes. Water, gardens, baskets, a planting calendar and a shared cup all point the same way: a city that planned and shared.",
              "Sí. Agua, jardines, canastas, un calendario de siembra y una taza compartida apuntan en la misma dirección: una ciudad que planeaba y compartía.",
            ),
          },
          {
            text: E("They built the city mainly to fight wars."),
            correct: false,
            feedback: P(
              "Look at your four panels again. Do any of them show weapons or walls? What do they show instead?",
              "Mira otra vez tus cuatro paneles. ¿Alguno muestra armas o murallas? ¿Qué muestran en cambio?",
            ),
          },
          {
            text: E("They did not pay attention to time or seasons."),
            correct: false,
            feedback: P(
              "Think about Panel 3. Why would builders cut a notch that lets the sun through on only one morning a year?",
              "Piensa en el Panel 3. ¿Por qué tallarían una muesca que deja pasar el sol solo una mañana al año?",
            ),
          },
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Field notes saved. You described four panels, set aside the hikers' arrow and the crack, and inferred that Vellmora valued water, food and sharing.",
          "Notas guardadas. Describiste cuatro paneles, dejaste de lado la flecha de los excursionistas y la grieta, e inferiste que Vellmora valoraba el agua, la comida y compartir.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a field report entry. Describe two carvings in detail, then infer what the people of Vellmora valued and explain how you know.",
          "Escribe una entrada del informe de campo. Describe dos tallas con detalle, luego infiere qué valoraba la gente de Vellmora y explica cómo lo sabes.",
        ),
        frames: [
          E("Panel ___ shows ___."),
          E("Another panel shows ___."),
          E("This suggests that the people valued ___ because ___."),
        ],
        wordBank: [
          "spring",
          "terraced gardens",
          "storehouse",
          "baskets",
          "notch",
          "equinox",
          "sharing",
          "valued",
          "suggests",
          "because",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [["valued", "value", "cared"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Panel 1 shows a spring with wavy lines of water flowing down steps to the terraced gardens. Another panel shows seven baskets in a row, like the seven storehouse rooms on the Upper Terraces. This suggests that the people valued water and food because they carved them on the main gate of their city. The cup panel shows they valued sharing too.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "adv-carved-gate"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "Hello! I'm Dr. Okafor. I study old places. This is the gate of Vellmora, a city on a hill. It is about seven hundred years old. The people of Sorrel Creek, a village by the river, are the city's family today. First we look closely. Then we think about what it means.",
          "¡Hola! Soy la Dra. Okafor. Estudio lugares antiguos. Esta es la puerta de Vellmora, una ciudad en una colina. Tiene unos setecientos años. La gente de Sorrel Creek, un pueblo junto al río, es la familia de la ciudad hoy. Primero miramos con atención. Después pensamos en lo que significa.",
        ),
      },
      {
        kind: "read",
        title: P("Field notes: The gate", "Notas de campo: La puerta"),
        art: ["adv-carved-gate"],
        text: E(
          "The gate has two tall stone pillars. A flat stone sits on top. There are four carvings. Carving 1 shows water flowing from a spring down some steps. The steps are the terraced gardens where people grew food. Carving 2 shows seven baskets over a door. There are seven storehouse rooms at the top of the hill. Carving 3 shows a sun with a small notch above it. On one spring morning each year, light shines through the notch. Carving 4 shows a person giving a cup to a friend. A stone channel for water runs next to the path. Hikers painted the blue arrow a long time later.",
        ),
        glossary: [
          { word: "spring", en: "a place where water comes out of the ground", es: "manantial" },
          {
            word: "terraced",
            en: "made like big flat steps on a hill",
            es: "en terrazas, como escalones grandes en una colina",
          },
          {
            word: "storehouse",
            en: "a building where food is kept",
            es: "almacén, un edificio donde se guarda la comida",
          },
          {
            word: "notch",
            en: "a small cut in the edge of something",
            es: "muesca, un pequeño corte en el borde",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Look at the gate. Collect 3 clues that show what the people cared about.",
          "Mira la puerta. Reúne 3 pistas que muestren qué le importaba a la gente.",
        ),
        need: 3,
        clues: GATE_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P(
          "What do the carvings tell us about the people?",
          "¿Qué nos dicen las tallas sobre la gente?",
        ),
        options: [
          {
            text: E("They planned how to get water, keep food and share it."),
            correct: true,
            feedback: P(
              "Yes! Water, baskets, a sun calendar and a cup all show planning and sharing.",
              "¡Sí! El agua, las canastas, el calendario del sol y la taza muestran que planeaban y compartían.",
            ),
          },
          {
            text: E("They only wanted to fight."),
            correct: false,
            feedback: P(
              "Look at the carvings again. Do you see any weapons?",
              "Mira otra vez las tallas. ¿Ves alguna arma?",
            ),
          },
          {
            text: E("They did not care about the seasons."),
            correct: false,
            feedback: P(
              "Look at Carving 3. Why would they make the sun shine through on one morning?",
              "Mira la Talla 3. ¿Por qué harían que el sol brillara por ahí una sola mañana?",
            ),
          },
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Notes saved! The carvings show water, food, the seasons and sharing.",
          "¡Notas guardadas! Las tallas muestran agua, comida, las estaciones y compartir.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a field note. Describe two carvings. What did the people care about?",
          "Escribe una nota de campo. Describe dos tallas. ¿Qué le importaba a la gente?",
        ),
        frames: [
          E("One carving shows ___."),
          E("Another carving shows ___."),
          E("I think they cared about ___ because ___."),
        ],
        wordBank: [
          "spring",
          "water",
          "steps",
          "baskets",
          "food",
          "cup",
          "sharing",
          "because",
          "cared",
        ],
        check: {
          minWords: 22,
          needConnectors: ["cause"],
          needAny: [["cared", "care", "valued"]],
          evidenceFrom: "clues",
        },
        model: E(
          "One carving shows water from a spring flowing down steps. Another carving shows seven baskets. I think they cared about water and food because they put them on their gate.",
        ),
      },
    ],
  },
};

// ── mission 2: voices of the valley ──────────────────────────────────────────
const VOICE_CLUES_68 = [
  {
    id: "cliff",
    text: E(
      "Sami: The Cliff Path is closed. Part of the ledge fell last month, and a red sign marks it.",
    ),
    relevant: true,
    keys: ["cliff", "closed", "ledge"],
    why: P(
      "A closed path with a broken ledge is a clear safety fact from the person who guides here.",
      "Un sendero cerrado con una cornisa rota es un dato claro de seguridad de la persona que guía aquí.",
    ),
  },
  {
    id: "river",
    text: E(
      "Mrs. Calder: After rain in the mountains, the river rises here hours later and covers the bottom River Steps by early afternoon.",
    ),
    relevant: true,
    keys: ["river", "mountains", "afternoon"],
    why: P(
      "It rained in the mountains last night. Mrs. Calder explains what that means for the River Steps today.",
      "Anoche llovió en las montañas. La Sra. Calder explica lo que eso significa hoy para los Escalones del Río.",
    ),
  },
  {
    id: "channel",
    text: E("Sami: The Channel Path takes about two hours, but on Monday it was dry and solid."),
    relevant: true,
    keys: ["channel", "dry", "solid"],
    why: P(
      "Sami walked it this week. A long route can still be the safe one.",
      "Sami lo caminó esta semana. Una ruta larga todavía puede ser la segura.",
    ),
  },
  {
    id: "handrail",
    text: E(
      "Sami: One wooden handrail is loose near the third bend of the Channel Path. Hold the stone wall there.",
    ),
    relevant: true,
    keys: ["handrail", "loose", "bend"],
    why: P(
      "This tells the team exactly where to be careful, and how.",
      "Esto le dice al equipo exactamente dónde tener cuidado y cómo.",
    ),
  },
  {
    id: "gentle",
    text: E("Mrs. Calder: The builders made the Channel Path gentle and high, far from the river."),
    relevant: true,
    keys: ["gentle", "high", "builders"],
    why: P(
      "Water needs a slow, steady slope, so the old builders made this path gentle and kept it away from floods.",
      "El agua necesita una pendiente suave y constante, así que los constructores hicieron este sendero suave y lejos de las inundaciones.",
    ),
  },
  {
    id: "photos",
    text: E("Sami: The River Steps have the best view of the waterfall for photos."),
    relevant: false,
    why: P(
      "A great view tells us about photos, not about whether the steps are safe today.",
      "Una gran vista nos habla de fotos, no de si los escalones son seguros hoy.",
    ),
  },
  {
    id: "sky",
    text: E("Jonah: There is not one cloud in the sky, so the river can't be dangerous."),
    relevant: false,
    why: P(
      "Jonah only looked at the sky above us. The rain fell in the mountains, and he walked the steps yesterday, before the storm.",
      "Jonah solo miró el cielo sobre nosotros. La lluvia cayó en las montañas, y él caminó los escalones ayer, antes de la tormenta.",
    ),
  },
  {
    id: "mango",
    text: E("Sami: I always bring mango slices on the trail."),
    relevant: false,
    why: P(
      "Snacks are nice, but they do not help us choose a safe route.",
      "Los bocadillos son buenos, pero no nos ayudan a elegir una ruta segura.",
    ),
  },
];
const VOICE_CLUES_35 = [
  {
    id: "cliff",
    text: E("Sami: The Cliff Path is closed. Part of it fell down."),
    relevant: true,
    keys: ["cliff", "closed", "fell"],
    why: P("A closed path is not safe.", "Un sendero cerrado no es seguro."),
  },
  {
    id: "river",
    text: E(
      "Mrs. Calder: After rain in the mountains, the river covers the low River Steps in the afternoon.",
    ),
    relevant: true,
    keys: ["river", "mountains", "afternoon"],
    why: P(
      "It rained in the mountains last night, so the river will rise today.",
      "Anoche llovió en las montañas, así que el río va a subir hoy.",
    ),
  },
  {
    id: "channel",
    text: E("Sami: The Channel Path is long, but it was dry on Monday."),
    relevant: true,
    keys: ["channel", "dry", "long"],
    why: P("Long can still be safe.", "Largo todavía puede ser seguro."),
  },
  {
    id: "handrail",
    text: E("Sami: One handrail is loose at the third bend. Hold the stone wall."),
    relevant: true,
    keys: ["handrail", "loose", "wall"],
    why: P("This tells us where to be careful.", "Esto nos dice dónde tener cuidado."),
  },
  {
    id: "photos",
    text: E("Sami: The River Steps are great for photos."),
    relevant: false,
    why: P("Photos do not tell us if it is safe.", "Las fotos no nos dicen si es seguro."),
  },
  {
    id: "sky",
    text: E("Jonah: The sky is blue, so the river is fine."),
    relevant: false,
    why: P(
      "The rain fell in the mountains, not here. Jonah came yesterday, before the rain.",
      "La lluvia cayó en las montañas, no aquí. Jonah vino ayer, antes de la lluvia.",
    ),
  },
];

const voices = {
  id: "voices-of-the-valley",
  title: P("Voices of the Valley", "Voces del valle"),
  goal: P(
    "Listen to three people, ask a question to clarify, and compare what they say about the routes.",
    "Escuchar a tres personas, hacer una pregunta para aclarar y comparar lo que dicen sobre las rutas.",
  ),
  keyUse: "Explain",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "adv-route-map"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "Three routes lead from this gate up to the Upper Terraces: the River Steps, the Cliff Path and the Channel Path. Last night it rained hard in the mountains, even though our sky is clear this morning. Before we choose, let's listen to people who know these routes. When two people disagree, we ask a question that clears it up.",
          "Tres rutas suben desde esta puerta hasta las Terrazas Altas: los Escalones del Río, el Sendero del Acantilado y el Sendero del Canal. Anoche llovió mucho en las montañas, aunque nuestro cielo está despejado esta mañana. Antes de elegir, escuchemos a quienes conocen estas rutas. Cuando dos personas no están de acuerdo, hacemos una pregunta que lo aclare.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Sami Torres, trail guide", "Sami Torres, guía del sendero"),
        script: E(
          "I've guided hikers on Kestrel Ridge for twelve years. The River Steps are the fastest way up, about forty minutes, and the view of the waterfall is amazing for photos. The Cliff Path is closed. Last month part of the ledge fell, and the park put up a red sign, so please don't go past it. The Channel Path is the longest, about two hours, because it follows the old water channel along the ridge. I walked it on Monday. It was dry and solid, but one wooden handrail is loose near the third bend, so hold on to the stone wall there. Oh, and bring snacks. I always bring mango slices.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P(
          "Mrs. Ines Calder, retired water-keeper from Sorrel Creek",
          "Sra. Ines Calder, guardiana del agua jubilada de Sorrel Creek",
        ),
        script: E(
          "My family kept the water channels clear for four generations, and I learned this river from my grandmother. Here is what visitors forget. When it rains in the mountains, the river rises here many hours later, even under a blue sky. By early afternoon after a mountain storm, the bottom River Steps are underwater, and the wet stone is as slippery as glass. The old builders understood water. They made the Channel Path gentle and high, because water needs a slow, steady slope, and they kept it far from the river.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Jonah, a visiting hiker", "Jonah, un excursionista de visita"),
        script: E(
          "Hey, are you going up? I'm taking the River Steps. Look at the sky, there's not one cloud! If it isn't raining, the river can't be dangerous, right? I walked the steps yesterday afternoon and they were totally dry. Also, I found a great spot for lunch near the waterfall.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Which statements help you decide which route is safe today? Collect 3.",
          "¿Qué datos te ayudan a decidir qué ruta es segura hoy? Reúne 3.",
        ),
        need: 3,
        clues: VOICE_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Jonah and Mrs. Calder disagree about the river. Which question would best clarify who is right?",
          "Jonah y la Sra. Calder no están de acuerdo sobre el río. ¿Qué pregunta aclararía mejor quién tiene razón?",
        ),
        options: [
          {
            text: E(
              "Mrs. Calder, if it rained in the mountains last night, when will the river rise here today?",
            ),
            correct: true,
            feedback: P(
              'Yes. That question asks about the exact thing they disagree on: mountain rain and when the river rises. She answers: "By early afternoon. Yesterday the steps were dry because the storm had not come yet."',
              "Sí. Esa pregunta trata justo de lo que no coinciden: la lluvia en las montañas y cuándo sube el río. Ella responde: «Para el comienzo de la tarde. Ayer los escalones estaban secos porque la tormenta todavía no había llegado».",
            ),
          },
          {
            text: E("Jonah, where is your lunch spot?"),
            correct: false,
            feedback: P(
              "A lunch spot does not tell us whether the steps will be safe. Which question asks about the river itself?",
              "Un lugar para almorzar no nos dice si los escalones serán seguros. ¿Qué pregunta trata del río?",
            ),
          },
          {
            text: E("Sami, how many years have you been a guide?"),
            correct: false,
            feedback: P(
              "Sami already told us, and his answer does not settle the disagreement. Who knows how mountain rain changes this river?",
              "Sami ya nos lo dijo, y su respuesta no resuelve el desacuerdo. ¿Quién sabe cómo la lluvia en las montañas cambia este río?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Tell Dr. Okafor how Jonah's and Mrs. Calder's information about the River Steps is different, and say whose information is stronger and why.",
          "Dile a la Dra. Okafor en qué se diferencia la información de Jonah y de la Sra. Calder sobre los Escalones del Río, y di cuál es más sólida y por qué.",
        ),
        frames: [
          E("Jonah said ___, but Mrs. Calder explained ___."),
          E("Jonah walked the steps ___, while ___."),
          E("Mrs. Calder's information is stronger because ___."),
        ],
        wordBank: [
          "but",
          "while",
          "however",
          "mountains",
          "river",
          "rises",
          "early afternoon",
          "underwater",
          "before the storm",
          "stronger",
        ],
        check: {
          minWords: 35,
          needConnectors: ["contrast"],
          needAny: [["river", "steps"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Jonah said the River Steps are safe because there are no clouds, but Mrs. Calder explained that rain in the mountains makes the river rise here hours later. Jonah walked the steps yesterday, before the storm. Mrs. Calder's information is stronger because she learned this river from her grandmother, and she knows the bottom steps are underwater by early afternoon.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Interviews saved. The Cliff Path is closed, the river will cover the low River Steps this afternoon, and the Channel Path is long but solid, with one loose handrail.",
          "Entrevistas guardadas. El Sendero del Acantilado está cerrado, el río cubrirá los escalones bajos esta tarde, y el Sendero del Canal es largo pero firme, con un pasamanos flojo.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "adv-route-map"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "There are three ways up the hill: the River Steps, the Cliff Path and the Channel Path. Last night it rained in the mountains. Our sky is blue today. Let's listen to people who know the paths. If they do not agree, we ask a good question.",
          "Hay tres caminos para subir la colina: los Escalones del Río, el Sendero del Acantilado y el Sendero del Canal. Anoche llovió en las montañas. Hoy nuestro cielo está azul. Escuchemos a quienes conocen los caminos. Si no están de acuerdo, hacemos una buena pregunta.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Sami, trail guide", "Sami, guía del sendero"),
        script: E(
          "The River Steps are the fastest way up, and they are great for photos. The Cliff Path is closed, because part of it fell down. The Channel Path is long, about two hours. It was dry on Monday. One handrail is loose at the third bend, so hold the stone wall.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Mrs. Calder, water-keeper", "Sra. Calder, guardiana del agua"),
        script: E(
          "My grandmother taught me about this river. When it rains in the mountains, the river gets higher here later, even when our sky is blue. In the afternoon, the low River Steps are under water. The Channel Path is high and far from the river.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Jonah, a hiker", "Jonah, un excursionista"),
        script: E(
          "I'm taking the River Steps. The sky is blue, so the river is fine! I walked the steps yesterday and they were dry. I know a great place to eat lunch, too.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Which facts help us pick a safe path? Collect 3.",
          "¿Qué datos nos ayudan a elegir un camino seguro? Reúne 3.",
        ),
        need: 3,
        clues: VOICE_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P(
          "Jonah and Mrs. Calder do not agree about the river. What should we ask?",
          "Jonah y la Sra. Calder no están de acuerdo sobre el río. ¿Qué debemos preguntar?",
        ),
        options: [
          {
            text: E("Mrs. Calder, when will the river get high today?"),
            correct: true,
            feedback: P(
              'Yes! She says: "In the afternoon. Yesterday was dry because the rain had not come yet."',
              "¡Sí! Ella dice: «En la tarde. Ayer estaba seco porque la lluvia todavía no había llegado».",
            ),
          },
          {
            text: E("Jonah, where do you eat lunch?"),
            correct: false,
            feedback: P(
              "Lunch does not tell us about the river. Ask about the river.",
              "El almuerzo no nos dice nada del río. Pregunta sobre el río.",
            ),
          },
          {
            text: E("Sami, do you like your job?"),
            correct: false,
            feedback: P(
              "That is a kind question, but it does not help us with the river. Who knows about the river?",
              "Es una pregunta amable, pero no nos ayuda con el río. ¿Quién sabe del río?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Tell Dr. Okafor how Jonah and Mrs. Calder are different. Who is right about the river?",
          "Dile a la Dra. Okafor en qué son diferentes Jonah y la Sra. Calder. ¿Quién tiene razón sobre el río?",
        ),
        frames: [
          E("Jonah said ___, but Mrs. Calder said ___."),
          E("I think ___ is right because ___."),
        ],
        wordBank: [
          "but",
          "river",
          "mountains",
          "afternoon",
          "rain",
          "yesterday",
          "because",
          "right",
        ],
        check: {
          minWords: 20,
          needConnectors: ["contrast"],
          needAny: [["river", "steps"]],
          evidenceFrom: "clues",
        },
        model: E(
          "Jonah said the river is fine, but Mrs. Calder said rain in the mountains makes the river high in the afternoon. I think Mrs. Calder is right because Jonah came before the rain.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Interviews saved! The Cliff Path is closed. The river will cover the low steps this afternoon. The Channel Path is long but dry.",
          "¡Entrevistas guardadas! El Sendero del Acantilado está cerrado. El río cubrirá los escalones bajos esta tarde. El Sendero del Canal es largo pero seco.",
        ),
      },
    ],
  },
};

// ── mission 3: the water-keeper's notebook ───────────────────────────────────
const notebook = {
  id: "the-water-keepers-notebook",
  title: P("The Water-Keeper's Notebook", "El cuaderno de la guardiana del agua"),
  goal: P(
    "Read the village's own history of the city, put the events in sequence, and explain why the people moved.",
    "Leer la historia de la ciudad que cuenta el pueblo, ordenar los sucesos y explicar por qué se mudó la gente.",
  ),
  keyUse: "Narrate",
  domains: ["Listening", "Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-forest", "char-abuela", "adv-water-journal"],
        speaker: "Mrs. Calder",
        listen: true,
        text: P(
          "Before you climb, I want you to know whose city this was. My grandmother, Maren Calder, wrote down the story our village tells about it. Visitors call Vellmora the Lost City. It was never lost to us. We moved, and we kept coming back.",
          "Antes de que suban, quiero que sepan de quién era esta ciudad. Mi abuela, Maren Calder, escribió la historia que cuenta nuestro pueblo. Los visitantes llaman a Vellmora la Ciudad Perdida. Para nosotros nunca estuvo perdida. Nos mudamos, y seguimos volviendo.",
        ),
      },
      {
        kind: "read",
        title: P("From Maren Calder's notebook, 1948", "Del cuaderno de Maren Calder, 1948"),
        art: ["adv-water-journal"],
        text: E(
          "Our elders tell the story of the high city in the same order every time. Long ago, the people of Vellmora lived on Kestrel Ridge. A spring at the top of the ridge gave them water, and they carved stone channels to carry it to their terraced gardens. They stored grain in the seven rooms of the storehouse. Then came many dry years. The spring grew weaker each summer, and the gardens on the highest terraces dried out. During those same years, the Sorrel River changed its course and left wide, rich soil along its banks in the valley below. The families held a council and decided to move slowly, a few households each year, so that no one would go hungry on the way. They planted new gardens beside the river and named their village Sorrel Creek. They did not forget the ridge. Every spring, water-keepers walked up the Channel Path to clear fallen stones from the old channel, and children learned the carvings by heart. Visitors call it the Lost City. We call it the Old Home.",
        ),
        glossary: [
          {
            word: "council",
            en: "a meeting where a group makes decisions together",
            es: "consejo, una reunión donde un grupo decide junto",
          },
          {
            word: "households",
            en: "the families who live together in one home",
            es: "hogares, las familias que viven juntas en una casa",
          },
          {
            word: "course",
            en: "the path a river follows",
            es: "cauce, el camino que sigue un río",
          },
          {
            word: "banks",
            en: "the land along the sides of a river",
            es: "orillas, la tierra a los lados de un río",
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Put the story of Vellmora in order, the way Maren's notebook tells it.",
          "Ordena la historia de Vellmora como la cuenta el cuaderno de Maren.",
        ),
        items: [
          E("The people carve channels to carry water from the spring to their gardens."),
          E("Many dry years come, and the spring grows weaker."),
          E("The families hold a council and decide to move a few households each year."),
          E("They plant gardens beside the river and name their village Sorrel Creek."),
          E("Every spring, water-keepers climb the Channel Path to clear the old channel."),
        ],
      },
      {
        kind: "choice",
        prompt: P(
          "Mrs. Calder offers to tell you more before you climb. What will you ask her?",
          "La Sra. Calder ofrece contarte más antes de subir. ¿Qué le vas a preguntar?",
        ),
        options: [
          {
            text: E("Ask what the notebook says about walking the Channel Path."),
            correct: true,
            next: 4,
            feedback: P(
              "Smart: water-keepers have walked that path for generations. She turns to a page near the back.",
              "Muy bien pensado: las guardianas del agua han caminado ese sendero por generaciones. Ella busca una página al final.",
            ),
          },
          {
            text: E("Ask what children in Sorrel Creek learn about the gate carvings."),
            correct: true,
            next: 5,
            feedback: P(
              "Good question. She smiles: \"They learn that the cup means 'share the water.' My grandmother said a city that shares water never really ends.\"",
              "Buena pregunta. Ella sonríe: «Aprenden que la taza significa 'comparte el agua'. Mi abuela decía que una ciudad que comparte el agua nunca termina de verdad».",
            ),
          },
          {
            text: E("Say thank you and start climbing right away."),
            correct: false,
            feedback: P(
              "Mrs. Calder knows the ridge better than anyone on the team. Could something in the notebook help the climb?",
              "La Sra. Calder conoce la cresta mejor que nadie del equipo. ¿Podría algo del cuaderno ayudar en la subida?",
            ),
          },
        ],
      },
      {
        kind: "story",
        art: ["bg-forest", "char-abuela", "adv-water-journal"],
        speaker: "Mrs. Calder",
        listen: true,
        text: P(
          'Here, in my grandmother\'s hand: "Keep to the stone side at the third bend. Wood comes and goes, but the old stone wall has stood for seven hundred years." Sami told you the same thing about the loose handrail. Some advice does not change.',
          "Aquí, con la letra de mi abuela: «En la tercera curva, mantente del lado de la piedra. La madera viene y va, pero el viejo muro de piedra lleva setecientos años en pie». Sami les dijo lo mismo sobre el pasamanos flojo. Algunos consejos no cambian.",
        ),
      },
      {
        kind: "choice",
        prompt: P(
          "Use the notebook. Why did the people of Vellmora leave the ridge?",
          "Usa el cuaderno. ¿Por qué la gente de Vellmora dejó la cresta?",
        ),
        options: [
          {
            text: E(
              "Dry years weakened the spring, and the river valley had rich soil for new gardens.",
            ),
            correct: true,
            feedback: P(
              "Yes. Two causes worked together: a problem on the ridge and a better place in the valley. That is why they moved slowly and planned it.",
              "Sí. Dos causas actuaron juntas: un problema en la cresta y un lugar mejor en el valle. Por eso se mudaron poco a poco y con un plan.",
            ),
          },
          {
            text: E("An enemy army forced them out."),
            correct: false,
            feedback: P(
              "Read the notebook again. Does Maren write about any fighting? What happened to the spring?",
              "Lee otra vez el cuaderno. ¿Maren escribe sobre alguna pelea? ¿Qué le pasó al manantial?",
            ),
          },
          {
            text: E("They forgot about the city and never went back."),
            correct: false,
            feedback: P(
              "Think about the water-keepers. Would people who forgot a place climb up every spring to clear its channel?",
              "Piensa en las guardianas del agua. ¿La gente que olvida un lugar subiría cada primavera a limpiar su canal?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Retell how the people of Vellmora came to live in Sorrel Creek. Tell the events in order and explain why they moved.",
          "Vuelve a contar cómo la gente de Vellmora llegó a vivir en Sorrel Creek. Cuenta los sucesos en orden y explica por qué se mudaron.",
        ),
        frames: [
          E("Long ago, ___."),
          E("Then ___, because ___."),
          E("After that, ___."),
          E("Today, ___."),
        ],
        wordBank: [
          "long ago",
          "then",
          "after that",
          "today",
          "because",
          "spring",
          "dry years",
          "council",
          "households",
          "river",
        ],
        check: {
          minWords: 50,
          needConnectors: ["sequence", "cause"],
          needAny: [["spring", "dry"]],
        },
        model: E(
          "Long ago, the people of Vellmora carved channels to carry water from the spring to their gardens on Kestrel Ridge. Then they had to change their plans, because many dry years made the spring weaker and the high gardens dried out. After that, the families held a council and moved a few households each year to the rich soil by the river. They named their village Sorrel Creek. Today, water-keepers still climb the Channel Path every spring.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Notebook saved. Vellmora was not lost: dry years and a better valley led the families to move, and they still care for the Old Home.",
          "Cuaderno guardado. Vellmora no se perdió: los años secos y un valle mejor llevaron a las familias a mudarse, y todavía cuidan el Hogar Antiguo.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-forest", "char-abuela", "adv-water-journal"],
        speaker: "Mrs. Calder",
        listen: true,
        text: P(
          "My grandmother Maren wrote our village's story in this notebook. People call Vellmora the Lost City. But it was never lost to us. We moved, and we still come back.",
          "Mi abuela Maren escribió la historia de nuestro pueblo en este cuaderno. La gente llama a Vellmora la Ciudad Perdida. Pero para nosotros nunca estuvo perdida. Nos mudamos, y todavía volvemos.",
        ),
      },
      {
        kind: "read",
        title: P("From Maren's notebook", "Del cuaderno de Maren"),
        art: ["adv-water-journal"],
        text: E(
          "Long ago, people lived in the city on the hill. A spring gave them water. They made stone channels to bring the water to their gardens. Then many dry years came. The spring got weaker, and the gardens dried up. Down in the valley, the river left rich soil. The families met in a council to make a plan. Every year, a few families moved down to the river. They planted new gardens and named their village Sorrel Creek. But they did not forget the hill. Every spring, water-keepers walk up the Channel Path to clean the old channel. We call the city our Old Home.",
        ),
        glossary: [
          {
            word: "council",
            en: "a meeting to decide something together",
            es: "consejo, una reunión para decidir algo juntos",
          },
          { word: "soil", en: "the dirt where plants grow", es: "tierra donde crecen las plantas" },
          {
            word: "valley",
            en: "low land between hills",
            es: "valle, tierra baja entre colinas",
          },
        ],
      },
      {
        kind: "order",
        prompt: P("Put the story in order.", "Ordena la historia."),
        items: [
          E("People make channels to bring water to their gardens."),
          E("Dry years come, and the spring gets weaker."),
          E("The families make a plan in a council."),
          E("They move to the river and start Sorrel Creek."),
          E("Water-keepers still clean the old channel every spring."),
        ],
      },
      {
        kind: "choice",
        prompt: P(
          "Mrs. Calder can tell you more. What will you ask?",
          "La Sra. Calder te puede contar más. ¿Qué vas a preguntar?",
        ),
        options: [
          {
            text: E("Ask what the notebook says about the Channel Path."),
            correct: true,
            next: 4,
            feedback: P("Good idea! She finds the page.", "¡Buena idea! Ella busca la página."),
          },
          {
            text: E("Ask what children learn about the gate."),
            correct: true,
            next: 5,
            feedback: P(
              "Good question! She says: \"The cup means 'share the water.'\"",
              "¡Buena pregunta! Ella dice: «La taza significa 'comparte el agua'».",
            ),
          },
          {
            text: E("Leave right away."),
            correct: false,
            feedback: P(
              "Mrs. Calder knows the hill well. Could her notebook help you?",
              "La Sra. Calder conoce bien la colina. ¿Te podría ayudar su cuaderno?",
            ),
          },
        ],
      },
      {
        kind: "story",
        art: ["bg-forest", "char-abuela", "adv-water-journal"],
        speaker: "Mrs. Calder",
        listen: true,
        text: P(
          'My grandmother wrote: "At the third bend, hold the stone wall. The stone is old and strong." Sami said the same thing!',
          "Mi abuela escribió: «En la tercera curva, agárrate del muro de piedra. La piedra es vieja y fuerte». ¡Sami dijo lo mismo!",
        ),
      },
      {
        kind: "choice",
        prompt: P("Why did the people leave the hill?", "¿Por qué la gente dejó la colina?"),
        options: [
          {
            text: E("The spring got weak, and the valley had good soil."),
            correct: true,
            feedback: P(
              "Yes! There was a problem on the hill and a better place below.",
              "¡Sí! Había un problema en la colina y un lugar mejor abajo.",
            ),
          },
          {
            text: E("An army chased them away."),
            correct: false,
            feedback: P(
              "Read again. Does the notebook talk about an army? What happened to the spring?",
              "Lee otra vez. ¿El cuaderno habla de un ejército? ¿Qué le pasó al manantial?",
            ),
          },
          {
            text: E("They forgot the city."),
            correct: false,
            feedback: P(
              "Do people who forget a place go back every spring?",
              "¿La gente que olvida un lugar vuelve cada primavera?",
            ),
          },
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Tell the story of Vellmora in order. Why did the people move?",
          "Cuenta la historia de Vellmora en orden. ¿Por qué se mudó la gente?",
        ),
        frames: [E("First, ___."), E("Then ___ because ___."), E("Last, ___.")],
        wordBank: [
          "first",
          "then",
          "last",
          "because",
          "spring",
          "dry",
          "river",
          "council",
          "Sorrel Creek",
        ],
        check: {
          minWords: 25,
          needConnectors: ["sequence", "cause"],
          needAny: [["spring", "dry"]],
        },
        model: E(
          "First, people lived on the hill and used water from the spring. Then they moved because the spring got weak in the dry years. Last, they made the village of Sorrel Creek by the river.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Notebook saved! The people moved because of dry years. They still care for their Old Home.",
          "¡Cuaderno guardado! La gente se mudó por los años secos. Todavía cuidan su Hogar Antiguo.",
        ),
      },
    ],
  },
};

// ── mission 4 (final): choose the safe route ─────────────────────────────────
const ROUTE_CLUES_68 = [
  {
    id: "gauge",
    text: E(
      "Ranger notice: the river is at 1.2 meters and rising; the lowest River Steps flood at 2 meters.",
    ),
    relevant: true,
    keys: ["river", "rising", "flood"],
    why: P(
      "The notice expects the river to rise about one more meter by 1:00 p.m. That is above 2 meters, so the low steps will flood.",
      "El aviso espera que el río suba casi un metro más para la 1:00 p. m. Eso pasa de 2 metros, así que los escalones bajos se inundarán.",
    ),
  },
  {
    id: "afternoon",
    text: E(
      "Mrs. Calder: after mountain rain, the bottom River Steps are underwater by early afternoon.",
    ),
    relevant: true,
    keys: ["underwater", "afternoon", "steps"],
    why: P(
      "Her knowledge and the ranger's numbers agree. Two sources saying the same thing make the evidence stronger.",
      "Lo que ella sabe y los números del guardabosques coinciden. Dos fuentes que dicen lo mismo hacen la evidencia más sólida.",
    ),
  },
  {
    id: "survey",
    text: E("Dr. Okafor: recording the spring and the storehouse will take about three hours."),
    relevant: true,
    keys: ["three", "hours", "back"],
    why: P(
      "Three hours of work means the team comes back down in the afternoon, after the river rises. Think about the whole trip.",
      "Tres horas de trabajo significan que el equipo baja en la tarde, después de que suba el río. Piensa en todo el viaje.",
    ),
  },
  {
    id: "rockfall",
    text: E("Ranger notice: the Cliff Path is closed after a rockfall damaged the ledge."),
    relevant: true,
    keys: ["rockfall", "cliff", "closed"],
    why: P(
      "The ranger and Sami both say the Cliff Path is closed. A shortcut that is closed is not a choice.",
      "El guardabosques y Sami dicen que el Sendero del Acantilado está cerrado. Un atajo cerrado no es una opción.",
    ),
  },
  {
    id: "channelopen",
    text: E("Ranger notice: the Channel Path is open, about two hours uphill on a gentle slope."),
    relevant: true,
    keys: ["channel", "open", "gentle"],
    why: P(
      "This matches what Sami and Mrs. Calder said: long, but gentle, high and open.",
      "Esto coincide con lo que dijeron Sami y la Sra. Calder: largo, pero suave, alto y abierto.",
    ),
  },
  {
    id: "dry",
    text: E("Jonah: the River Steps were totally dry yesterday."),
    relevant: false,
    why: P(
      "Yesterday was before the mountain storm. Old information does not describe today.",
      "Ayer fue antes de la tormenta en las montañas. La información vieja no describe el día de hoy.",
    ),
  },
  {
    id: "view",
    text: E("Sami: the waterfall view from the River Steps is the best on the ridge."),
    relevant: false,
    why: P(
      "A beautiful view is not a safety fact.",
      "Una vista hermosa no es un dato de seguridad.",
    ),
  },
];
const ROUTE_CLUES_35 = [
  {
    id: "gauge",
    text: E("Ranger sign: the river is rising. The low River Steps flood when it gets high."),
    relevant: true,
    keys: ["river", "rising", "flood"],
    why: P(
      "The river will be high this afternoon, so the low steps will flood.",
      "El río estará alto esta tarde, así que los escalones bajos se inundarán.",
    ),
  },
  {
    id: "survey",
    text: E("Dr. Okafor: our work at the top will take three hours."),
    relevant: true,
    keys: ["three", "hours", "back"],
    why: P(
      "After three hours, we come back down in the afternoon, when the river is high.",
      "Después de tres horas, bajamos en la tarde, cuando el río está alto.",
    ),
  },
  {
    id: "rockfall",
    text: E("Ranger sign: the Cliff Path is closed. Rocks fell."),
    relevant: true,
    keys: ["cliff", "closed", "rocks"],
    why: P("A closed path is not safe.", "Un sendero cerrado no es seguro."),
  },
  {
    id: "channelopen",
    text: E("Ranger sign: the Channel Path is open. It is long but gentle."),
    relevant: true,
    keys: ["channel", "open", "gentle"],
    why: P(
      "This matches what Sami and Mrs. Calder said.",
      "Esto coincide con lo que dijeron Sami y la Sra. Calder.",
    ),
  },
  {
    id: "dry",
    text: E("Jonah: the steps were dry yesterday."),
    relevant: false,
    why: P("Yesterday was before the rain.", "Ayer fue antes de la lluvia."),
  },
  {
    id: "view",
    text: E("Sami: the River Steps have a pretty view."),
    relevant: false,
    why: P("A pretty view does not keep us safe.", "Una vista bonita no nos mantiene seguros."),
  },
];

const safeRoute = {
  id: "choose-the-safe-route",
  title: P(
    "Final Demonstration: Choose the Safe Route",
    "Demostración final: Elige la ruta segura",
  ),
  goal: P(
    "Compare the three routes and justify the safest one with evidence from the people you heard and the ranger's notice.",
    "Comparar las tres rutas y justificar la más segura con evidencia de las personas que escuchaste y del aviso del guardabosques.",
  ),
  keyUse: "Argue",
  domains: ["Listening", "Reading", "Speaking", "Writing"],
  final: true,
  book: {
    templateId: "evidence-argument",
    title: P("The Safe Route to the Upper Terraces", "La ruta segura a las Terrazas Altas"),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "char-dad"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "It's 9:30 in the morning, and the team is packed. Sami just brought the trail notice from the ranger station. Read it closely, put it next to what everyone told us, and then make your case. The team will follow the route you can justify.",
          "Son las 9:30 de la mañana y el equipo está listo. Sami acaba de traer el aviso del puesto de guardabosques. Léelo con atención, compáralo con lo que todos nos dijeron y luego presenta tu caso. El equipo seguirá la ruta que puedas justificar.",
        ),
      },
      {
        kind: "read",
        title: P(
          "Kestrel Ridge Ranger Station: Trail conditions, 7:00 a.m.",
          "Puesto de guardabosques de la cresta Kestrel: Estado de los senderos, 7:00 a. m.",
        ),
        art: ["adv-route-map"],
        text: E(
          "Overnight, heavy rain fell in the Pellan Mountains, twenty kilometers upstream. Skies over Kestrel Ridge are clear. The river gauge at Sorrel Bridge reads 1.2 meters and rising. Based on past storms, we expect the Sorrel River to rise about one more meter by 1:00 p.m. River Steps: open this morning, with a warning. The lowest thirty steps flood when the river reaches 2 meters, and wet stone is very slippery. Turn back if water covers any step. Cliff Path: closed. A rockfall last month damaged the ledge. Do not pass the red sign. Channel Path: open. About two hours uphill on a gentle slope. A loose handrail at the third bend will be repaired next week; until then, use the stone wall side. Carry water, because there is no stream on the ridge. Reminder: stay on marked trails, and do not climb on walls or carvings. The ruins are protected, and the Sorrel Creek community asks all visitors to treat the Old Home with respect.",
        ),
        glossary: [
          {
            word: "upstream",
            en: "toward the place where a river begins",
            es: "río arriba, hacia donde nace el río",
          },
          {
            word: "gauge",
            en: "a tool that measures how high the water is",
            es: "medidor, un instrumento que mide qué tan alta está el agua",
          },
          {
            word: "rockfall",
            en: "rocks falling down from a cliff",
            es: "desprendimiento de rocas",
          },
          {
            word: "slope",
            en: "how steeply ground goes up or down",
            es: "pendiente, qué tan inclinado está el terreno",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Build your case. Collect 3 pieces of evidence that help you choose the safe route.",
          "Arma tu caso. Reúne 3 pruebas que te ayuden a elegir la ruta segura.",
        ),
        need: 3,
        clues: ROUTE_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P("Which route should the team take today?", "¿Qué ruta debe tomar el equipo hoy?"),
        options: [
          {
            text: E("The River Steps, because they are the fastest."),
            correct: false,
            feedback: P(
              "Think about the whole trip, not only the climb up. The work takes about three hours. What will the bottom steps be like when the team comes back down?",
              "Piensa en todo el viaje, no solo en la subida. El trabajo dura unas tres horas. ¿Cómo estarán los escalones bajos cuando el equipo baje?",
            ),
          },
          {
            text: E("The Channel Path, holding the stone wall at the third bend."),
            correct: true,
            feedback: P(
              "Yes. It is the longest route, but it is open, gentle and high above the river both ways, and the team knows where to be careful.",
              "Sí. Es la ruta más larga, pero está abierta, es suave y queda lejos del río de ida y de vuelta, y el equipo sabe dónde tener cuidado.",
            ),
          },
          {
            text: E("The Cliff Path, because it is a shortcut."),
            correct: false,
            feedback: P(
              "What did Sami and the ranger notice say about the ledge? A shortcut only helps if it is open and safe.",
              "¿Qué dijeron Sami y el aviso sobre la cornisa? Un atajo solo ayuda si está abierto y es seguro.",
            ),
          },
          {
            text: E("Nobody should climb today."),
            correct: false,
            feedback: P(
              "Is every route unsafe? Look again at what the notice, Sami and Mrs. Calder said about one of them.",
              "¿Todas las rutas son peligrosas? Mira otra vez lo que dijeron el aviso, Sami y la Sra. Calder sobre una de ellas.",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Put the team's safety plan in order.",
          "Ordena el plan de seguridad del equipo.",
        ),
        items: [
          E("Fill water bottles at the ranger station, because there is no stream on the ridge."),
          E("Start up the Channel Path by 10:00 a.m."),
          E("Hold the stone wall side at the loose handrail on the third bend."),
          E("Record the spring and the storehouse on the Upper Terraces for about three hours."),
          E("Walk back down the Channel Path and stay away from the River Steps."),
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Plan saved. Before you present, you have your evidence, your route and your safety steps in order.",
          "Plan guardado. Antes de presentar, tienes tu evidencia, tu ruta y tus pasos de seguridad en orden.",
        ),
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Rehearse out loud for the team. Name the route you recommend and give two reasons from what people told you.",
          "Ensaya en voz alta para el equipo. Nombra la ruta que recomiendas y da dos razones de lo que te dijo la gente.",
        ),
        frames: [
          E("I recommend the ___."),
          E("First, ___ told us that ___."),
          E("Also, ___ said ___."),
        ],
        wordBank: [
          "I recommend",
          "Channel Path",
          "first",
          "also",
          "Mrs. Calder",
          "Sami",
          "underwater",
          "closed",
          "gentle",
        ],
        check: {
          minWords: 30,
          needConnectors: ["stance"],
          needAny: [["channel path", "channel"]],
          evidenceFrom: "clues",
        },
        model: E(
          "I recommend the Channel Path. First, Mrs. Calder told us that the bottom River Steps are underwater by early afternoon after mountain rain. Also, Sami and the ranger said the Cliff Path is closed after a rockfall, but the Channel Path is open and gentle.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write your final recommendation for Dr. Okafor. Justify the route with evidence, and explain why the other two routes are not safe today.",
          "Escribe tu recomendación final para la Dra. Okafor. Justifica la ruta con evidencia y explica por qué las otras dos rutas no son seguras hoy.",
        ),
        frames: [
          E("I recommend the ___ because ___."),
          E("The evidence shows that ___."),
          E("Although the River Steps are ___, ___."),
          E("The Cliff Path is not safe because ___."),
        ],
        wordBank: [
          "recommend",
          "evidence",
          "although",
          "because",
          "rising",
          "flood",
          "three hours",
          "rockfall",
          "gentle",
          "stone wall",
        ],
        check: {
          minWords: 70,
          needConnectors: ["cause", "contrast"],
          needWords: ["evidence"],
          needAny: [["channel path"]],
          evidenceFrom: "clues",
        },
        model: E(
          "I recommend the Channel Path because it is open, gentle and far from the river. The evidence shows that the river is at 1.2 meters and rising, and the lowest River Steps flood at 2 meters. Although the River Steps are the fastest way up, our work takes about three hours, so we would come back down in the afternoon, when Mrs. Calder says the bottom steps are underwater. The Cliff Path is not safe because a rockfall damaged the ledge. On the Channel Path, we will hold the stone wall at the third bend.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-forest", "char-scientist", "char-dad"],
        speaker: "Dr. Okafor",
        listen: true,
        text: P(
          "It is 9:30 in the morning. Sami brought a sign from the ranger station. Read it. Think about what everyone told us. Then tell the team which path is safe.",
          "Son las 9:30 de la mañana. Sami trajo un aviso del puesto de guardabosques. Léelo. Piensa en lo que todos nos dijeron. Después dile al equipo qué camino es seguro.",
        ),
      },
      {
        kind: "read",
        title: P("Ranger station: Trail news", "Puesto de guardabosques: Noticias de los senderos"),
        art: ["adv-route-map"],
        text: E(
          "Last night it rained a lot in the mountains. The sky here is clear, but the river is rising. By the afternoon, the river will be high. River Steps: be careful. The low steps flood when the river is high, and wet stone is slippery. Cliff Path: closed. Rocks fell and broke the path. Do not go past the red sign. Channel Path: open. It takes about two hours, and it is gentle. One handrail is loose at the third bend, so hold the stone wall. Bring water. Please stay on the paths and do not climb on the old walls. This is the Old Home of the Sorrel Creek families.",
        ),
        glossary: [
          {
            word: "flood",
            en: "to be covered with water",
            es: "inundarse, quedar cubierto de agua",
          },
          { word: "slippery", en: "easy to slide and fall on", es: "resbaloso" },
          { word: "gentle", en: "not steep; easy to walk up", es: "suave, fácil de subir" },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Collect 3 facts that help you pick the safe path.",
          "Reúne 3 datos que te ayuden a elegir el camino seguro.",
        ),
        need: 3,
        clues: ROUTE_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("Which path should the team take?", "¿Qué camino debe tomar el equipo?"),
        options: [
          {
            text: E("The River Steps, because they are fast."),
            correct: false,
            feedback: P(
              "Think about coming back down. The work takes three hours. What will the river be like then?",
              "Piensa en la bajada. El trabajo dura tres horas. ¿Cómo estará el río entonces?",
            ),
          },
          {
            text: E("The Channel Path, holding the stone wall at the third bend."),
            correct: true,
            feedback: P(
              "Yes! It is long, but it is open, gentle and far from the river.",
              "¡Sí! Es largo, pero está abierto, es suave y queda lejos del río.",
            ),
          },
          {
            text: E("The Cliff Path, because it is short."),
            correct: false,
            feedback: P(
              "What does the sign say about the Cliff Path?",
              "¿Qué dice el aviso sobre el Sendero del Acantilado?",
            ),
          },
          {
            text: E("Nobody should go today."),
            correct: false,
            feedback: P(
              "Is every path unsafe? Read the sign again.",
              "¿Todos los caminos son peligrosos? Lee el aviso otra vez.",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P("Put the safety plan in order.", "Ordena el plan de seguridad."),
        items: [
          E("Fill our water bottles."),
          E("Start up the Channel Path."),
          E("Hold the stone wall at the third bend."),
          E("Study the spring and the storehouse for three hours."),
          E("Walk back down the Channel Path."),
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Plan saved! You have your facts, your path and your safety steps.",
          "¡Plan guardado! Tienes tus datos, tu camino y tus pasos de seguridad.",
        ),
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Practice out loud. Which path do you choose? Give one reason from a person you heard.",
          "Practica en voz alta. ¿Qué camino eliges? Da una razón de una persona que escuchaste.",
        ),
        frames: [E("I think we should take the ___."), E("___ said that ___.")],
        wordBank: [
          "I think",
          "we should",
          "Channel Path",
          "Mrs. Calder",
          "Sami",
          "river",
          "closed",
        ],
        check: {
          minWords: 15,
          needConnectors: ["stance"],
          needAny: [["channel path", "channel"]],
          evidenceFrom: "clues",
        },
        model: E(
          "I think we should take the Channel Path. Sami said the Cliff Path is closed because rocks fell, and the Channel Path is open.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write your choice for Dr. Okafor. Why is your path safe? Why are the other paths not safe today?",
          "Escribe tu elección para la Dra. Okafor. ¿Por qué tu camino es seguro? ¿Por qué los otros caminos no son seguros hoy?",
        ),
        frames: [
          E("I choose the ___ because ___."),
          E("The River Steps are fast, but ___."),
          E("The Cliff Path is ___."),
        ],
        wordBank: [
          "because",
          "but",
          "river",
          "rising",
          "flood",
          "three hours",
          "closed",
          "gentle",
          "stone wall",
        ],
        check: {
          minWords: 35,
          needConnectors: ["cause", "contrast"],
          needAny: [["channel path"]],
          evidenceFrom: "clues",
        },
        model: E(
          "I choose the Channel Path because it is open and gentle. The River Steps are fast, but the river is rising, and after three hours of work we will come back when the low steps flood. The Cliff Path is closed because rocks fell.",
        ),
      },
    ],
  },
};

export default {
  id: "lost-city",
  title: P("The Lost City", "La ciudad perdida"),
  tagline: P(
    "Explore ancient ruins, listen to the people who know them, and choose the safe route.",
    "Explora ruinas antiguas, escucha a quienes las conocen y elige la ruta segura.",
  ),
  theme: {
    bg: "bg-forest",
    accent: "#9a5b1e",
    soft: "#f6ecd9",
    ink: "#4a2c0e",
    hero: ["char-scientist", "char-abuela"],
  },
  intro: P(
    "You have joined Dr. Okafor's survey team at the ruins of Vellmora, a city on Kestrel Ridge that the village of Sorrel Creek calls the Old Home. Read the carvings, listen to a guide, a water-keeper and a hiker, and learn the city's real story. Then choose the safe route to the Upper Terraces and justify it with evidence.",
    "Te uniste al equipo de exploración de la Dra. Okafor en las ruinas de Vellmora, una ciudad en la cresta Kestrel que el pueblo de Sorrel Creek llama el Hogar Antiguo. Lee las tallas, escucha a un guía, a una guardiana del agua y a un excursionista, y aprende la historia real de la ciudad. Después elige la ruta segura a las Terrazas Altas y justifícala con evidencia.",
  ),
  guide: { name: "Dr. Okafor", art: "char-scientist" },
  missions: [carvedGate, voices, notebook, safeRoute],
};
