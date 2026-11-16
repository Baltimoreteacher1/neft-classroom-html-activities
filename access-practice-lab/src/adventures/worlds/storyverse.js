// Adventure World: Storyverse. Travel through original story worlds to study character, setting, conflict, sequence,
// point of view and theme; retell a story aloud, rewrite an ending, and finish by writing an original short story.
// Pure data; schema: ADVENTURE-SCHEMA (src/adventures/).

const lantern = {
  id: "lantern-forest",
  title: { en: "The Lantern Forest", es: "El bosque de los faroles" },
  goal: {
    en: "Describe a character and a setting using details from the story as evidence.",
    es: "Describir a un personaje y un lugar usando detalles del cuento como evidencia.",
  },
  keyUse: "Explain",
  domains: ["Listening", "Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-forest", "char-owl"],
        speaker: "Professor Hoot",
        text: {
          en: "Hoo! Welcome to the Storyverse, where every book is a door. I'm Professor Hoot. Our first world is the Lantern Forest. Watch the main character closely. What she DOES tells us who she is.",
          es: "¡Uuh! Bienvenido al Storyverso, donde cada libro es una puerta. Soy el Profesor Hoot. Nuestro primer mundo es el Bosque de los Faroles. Observa con atención a la protagonista. Lo que ella HACE nos dice cómo es.",
        },
        listen: true,
      },
      {
        kind: "read",
        title: { en: "Nia and the Lantern Forest", es: "Nia y el bosque de los faroles" },
        text: {
          en: "Nia did not like the dark. But her little cousin Pablo was crying. His cat, Pepper, had run into the Lantern Forest. The forest was quiet and cold. Tiny mushrooms glowed blue on the tall, twisty trees. Nia took a deep breath. She held her lantern high and stepped onto the mossy path. “Pepper!” she called. Her hands shook, but she kept walking. Soon she heard a small meow under a log. Nia knelt down and gently lifted the cat. When she came back, she gave Pepper to Pablo and smiled.",
        },
        glossary: [
          { word: "glowed", en: "gave off a soft light", es: "brillaba con una luz suave" },
          { word: "mossy", en: "covered with soft green plants", es: "cubierto de musgo" },
          { word: "knelt", en: "went down on her knees", es: "se arrodilló" },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "What is Nia like? Pick the details that show she is BRAVE or KIND.",
          es: "¿Cómo es Nia? Elige los detalles que muestran que es VALIENTE o AMABLE.",
        },
        clues: [
          {
            id: "shook",
            text: { en: "Her hands shook, but she kept walking." },
            relevant: true,
            why: {
              en: "She was scared and kept going anyway. That is brave.",
              es: "Tenía miedo y aun así siguió. Eso es ser valiente.",
            },
          },
          {
            id: "dark",
            text: { en: "Nia did not like the dark, but she went into the forest." },
            relevant: true,
            why: {
              en: "She faced something she feared to help Pablo.",
              es: "Enfrentó algo que le daba miedo para ayudar a Pablo.",
            },
          },
          {
            id: "gently",
            text: { en: "She gently lifted the cat and gave it to Pablo." },
            relevant: true,
            why: {
              en: "Being gentle and helping her cousin shows kindness.",
              es: "Ser cuidadosa y ayudar a su primo muestra amabilidad.",
            },
          },
          {
            id: "mushrooms",
            text: { en: "Tiny mushrooms glowed blue." },
            relevant: false,
            why: {
              en: "This describes the SETTING, the place, not Nia herself.",
              es: "Esto describe el LUGAR, no a Nia.",
            },
          },
          {
            id: "log",
            text: { en: "Pepper was under a log." },
            relevant: false,
            why: {
              en: "This tells where the cat was, not what Nia is like.",
              es: "Esto dice dónde estaba el gato, no cómo es Nia.",
            },
          },
        ],
        need: 2,
      },
      {
        kind: "choice",
        prompt: {
          en: "Which words describe the SETTING of the story?",
          es: "¿Qué palabras describen el LUGAR del cuento?",
        },
        options: [
          {
            text: { en: "A quiet, cold forest with glowing mushrooms" },
            correct: true,
            feedback: {
              en: "Yes! The setting is where and when a story happens.",
              es: "¡Sí! El lugar (el ambiente) es dónde y cuándo pasa un cuento.",
            },
          },
          {
            text: { en: "Nia is brave." },
            correct: false,
            feedback: {
              en: "This describes a character. Look for words about the PLACE.",
              es: "Esto describe a un personaje. Busca palabras sobre el LUGAR.",
            },
          },
          {
            text: { en: "Pepper ran away." },
            correct: false,
            feedback: {
              en: "This is an event, something that happens. Which choice tells where the story happens?",
              es: "Esto es un suceso, algo que pasa. ¿Qué opción dice dónde pasa el cuento?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write about Nia. Name one trait (what she is like) and give a detail from the story that shows it.",
          es: "Escribe sobre Nia. Nombra un rasgo (cómo es ella) y da un detalle del cuento que lo muestre.",
        },
        mode: "write",
        frames: [
          { en: "Nia is..." },
          { en: "I know this because..." },
          { en: "In the story, ..." },
        ],
        wordBank: ["brave", "kind", "scared", "lantern", "forest", "because", "gently"],
        check: {
          minWords: 18,
          needConnectors: ["cause"],
          needWords: ["nia"],
          needAny: [["brave", "kind", "caring", "helpful", "courageous"]],
          evidenceFrom: "clues",
        },
        model: {
          en: "Nia is brave. I know this because she did not like the dark, but she went into the forest to find Pepper. Her hands shook, but she kept walking.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "A character's actions show their traits. The setting is where and when the story happens.",
          es: "Las acciones de un personaje muestran sus rasgos. El ambiente es dónde y cuándo pasa el cuento.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-forest", "char-owl"],
        speaker: "Professor Hoot",
        text: {
          en: "Hoo, welcome, traveler. I'm Professor Hoot, keeper of the Storyverse library. Authors rarely tell you directly what a character is like; they show you, and leave you to infer. In the Lantern Forest, notice how the setting and the character work on each other.",
          es: "Uuh, bienvenido, viajero. Soy el Profesor Hoot, guardián de la biblioteca del Storyverso. Los autores rara vez te dicen directamente cómo es un personaje; te lo muestran y te dejan inferirlo. En el Bosque de los Faroles, fíjate en cómo el lugar y el personaje se afectan mutuamente.",
        },
        listen: true,
      },
      {
        kind: "read",
        title: { en: "Nia and the Lantern Forest", es: "Nia y el bosque de los faroles" },
        text: {
          en: "Everyone in the family knew that Nia slept with the hallway light on, and everyone was polite enough not to mention it. So when Pablo burst through the door sobbing that Pepper had bolted into the Lantern Forest, nobody expected Nia to be the one who reached for the lantern. The forest at dusk was the color of deep water. Fungus on the twisted trunks gave off a cold blue glow, bright enough to make shadows but never bright enough to see what made them. Each step on the moss swallowed its own sound. Nia counted her breaths the way her grandmother had taught her: in for four, out for four. Her hands shook so hard the lantern light trembled on the trees, but she did not turn around. When she finally heard a thin meow beneath a fallen log, she lay flat in the cold mud and coaxed the frightened cat out with soft clicks of her tongue, as patient as if she had all night.",
        },
        glossary: [
          { word: "bolted", en: "ran away suddenly", es: "salió corriendo de repente" },
          { word: "dusk", en: "the time just before night", es: "el anochecer" },
          { word: "fungus", en: "a living thing like a mushroom", es: "hongo" },
          { word: "coaxed", en: "gently convinced to come", es: "convenció con suavidad" },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Which details let you INFER that Nia is courageous and patient, without the author saying so?",
          es: "¿Qué detalles te permiten INFERIR que Nia es valiente y paciente, sin que la autora lo diga?",
        },
        clues: [
          {
            id: "light",
            text: { en: "She sleeps with the hallway light on, yet she reaches for the lantern." },
            relevant: true,
            why: {
              en: "The contrast between her known fear and her action shows courage.",
              es: "El contraste entre su miedo conocido y su acción muestra valentía.",
            },
          },
          {
            id: "breaths",
            text: { en: "She counted her breaths, in for four, out for four." },
            relevant: true,
            why: {
              en: "She manages her fear on purpose, which shows self-control.",
              es: "Controla su miedo a propósito, lo que muestra autocontrol.",
            },
          },
          {
            id: "trembled",
            text: { en: "Her hands shook, but she did not turn around." },
            relevant: true,
            why: {
              en: "Courage is acting while afraid, not being unafraid.",
              es: "La valentía es actuar con miedo, no no tener miedo.",
            },
          },
          {
            id: "mud",
            text: {
              en: "She lay in the cold mud and coaxed the cat out, as patient as if she had all night.",
            },
            relevant: true,
            why: {
              en: "This shows patience and care for a scared animal.",
              es: "Esto muestra paciencia y cuidado con un animal asustado.",
            },
          },
          {
            id: "glow",
            text: { en: "Fungus gave off a cold blue glow." },
            relevant: false,
            why: {
              en: "This builds the setting's eerie mood; it describes the forest, not Nia's traits.",
              es: "Esto crea el ambiente inquietante; describe el bosque, no los rasgos de Nia.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "How does the setting affect the character in this passage?",
          es: "¿Cómo afecta el ambiente al personaje en este fragmento?",
        },
        options: [
          {
            text: {
              en: "The dim, silent forest makes the danger feel real, so Nia's choice to keep going shows how brave she is.",
            },
            correct: true,
            feedback: {
              en: "Well inferred. A frightening setting raises the stakes, and that makes her actions mean more.",
              es: "Buena inferencia. Un lugar que da miedo hace más grande el reto, y eso hace que sus acciones signifiquen más.",
            },
          },
          {
            text: {
              en: "The setting doesn't matter; the story would be the same in a sunny park.",
            },
            correct: false,
            feedback: {
              en: "Imagine Nia looking for Pepper in a sunny park. Would it take the same courage? Reread the shadows and the silence.",
              es: "Imagina a Nia buscando a Pepper en un parque soleado. ¿Necesitaría la misma valentía? Vuelve a leer lo de las sombras y el silencio.",
            },
          },
          {
            text: { en: "The forest is magical, so Nia is never in danger." },
            correct: false,
            feedback: {
              en: "The glow is strange, but the author says it makes shadows you can't see into. Does that sound safe?",
              es: "El brillo es extraño, pero la autora dice que hace sombras que no se pueden ver. ¿Eso suena seguro?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write a paragraph that makes a claim about Nia's character. Support it with two details from the text, and explain how the setting makes those details more powerful.",
          es: "Escribe un párrafo con una afirmación sobre el carácter de Nia. Apóyala con dos detalles del texto y explica cómo el ambiente hace más fuertes esos detalles.",
        },
        mode: "write",
        frames: [{ en: "Nia is..." }, { en: "For example, ..." }, { en: "The setting..." }],
        wordBank: ["courageous", "patient", "infer", "setting", "for example", "contrast", "eerie"],
        check: {
          minWords: 50,
          needConnectors: ["example"],
          needWords: ["nia", "setting"],
          needAny: [
            ["brave", "courageous", "patient", "determined"],
            ["light", "breaths", "shook", "mud", "lantern"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "Nia is courageous even though she is afraid of the dark. For example, she sleeps with the hallway light on, yet she is the one who reaches for the lantern. Her hands shake, but she does not turn around. The setting makes these details more powerful, because the silent forest and its strange blue shadows make the danger feel real.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You inferred traits from actions, and you showed how a setting can raise the stakes for a character.",
          es: "Inferiste rasgos a partir de acciones y mostraste cómo un ambiente puede aumentar el reto para un personaje.",
        },
      },
    ],
  },
};

const sky = {
  id: "sky-harbor",
  title: { en: "Storm over Sky Harbor", es: "Tormenta sobre el Puerto del Cielo" },
  goal: {
    en: "Identify a story's conflict and retell its events in order out loud.",
    es: "Identificar el conflicto de un cuento y volver a contar sus sucesos en orden en voz alta.",
  },
  keyUse: "Narrate",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-space", "char-owl", "char-robot"],
        speaker: "Professor Hoot",
        text: {
          en: "Next door: Sky Harbor, a city that floats in the clouds! Listen to this story. Every story has a conflict, a problem the character must face. Listen for it.",
          es: "Siguiente puerta: ¡el Puerto del Cielo, una ciudad que flota en las nubes! Escucha este cuento. Todo cuento tiene un conflicto, un problema que el personaje debe enfrentar. Escúchalo con atención.",
        },
      },
      {
        kind: "listen",
        script: {
          en: "Rafi lived in Sky Harbor with his robot, Bolt. One morning, a message came: the village on Gray Mountain needed medicine. Rafi and Bolt loaded the medicine onto their little airship. Then dark clouds rolled in. A storm was coming! Halfway there, the engine sputtered and stopped. Rafi had an idea. He and Bolt tied a blanket to the mast to make a sail. The wind pushed them through the clouds. At last, they landed on Gray Mountain, and the villagers cheered.",
        },
        transcriptLabel: { en: "The story of Rafi and Bolt", es: "El cuento de Rafi y Bolt" },
      },
      {
        kind: "choice",
        prompt: {
          en: "What is the main conflict in the story?",
          es: "¿Cuál es el conflicto principal del cuento?",
        },
        options: [
          {
            text: { en: "Rafi must bring medicine through a storm, and the engine breaks." },
            correct: true,
            feedback: {
              en: "Yes! The storm and the broken engine are the problems Rafi must solve.",
              es: "¡Sí! La tormenta y el motor roto son los problemas que Rafi debe resolver.",
            },
          },
          {
            text: { en: "Rafi lives with a robot." },
            correct: false,
            feedback: {
              en: "This tells about Rafi's life, but it is not a problem. What goes wrong in the story?",
              es: "Esto habla de la vida de Rafi, pero no es un problema. ¿Qué sale mal en el cuento?",
            },
          },
          {
            text: { en: "The villagers cheered." },
            correct: false,
            feedback: {
              en: "This happens at the end, after the problem is solved. What was the problem?",
              es: "Esto pasa al final, después de resolver el problema. ¿Cuál era el problema?",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: { en: "Put the events in order.", es: "Ordena los sucesos." },
        items: [
          { en: "A message says the village needs medicine." },
          { en: "Rafi and Bolt load the airship." },
          { en: "A storm comes, and the engine stops." },
          { en: "They make a sail from a blanket." },
          { en: "They land, and the villagers cheer." },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Retell the story out loud in your own words. Use order words to tell the beginning, middle and end.",
          es: "Vuelve a contar el cuento en voz alta con tus propias palabras. Usa palabras de orden para contar el principio, el medio y el final.",
        },
        mode: "say",
        frames: [{ en: "First, ..." }, { en: "Then, ..." }, { en: "Finally, ..." }],
        wordBank: ["first", "next", "then", "finally", "medicine", "storm", "engine", "sail"],
        check: {
          minWords: 30,
          needConnectors: ["sequence"],
          needAny: [
            ["rafi", "bolt"],
            ["storm", "engine"],
            ["sail", "blanket"],
          ],
        },
        model: {
          en: "First, Rafi and his robot Bolt got a message that a village needed medicine. Then a storm came, and the engine stopped. Next, they tied a blanket to the mast to make a sail. Finally, the wind pushed them to the village, and everyone cheered.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "A conflict is the story's problem. Order words like first, then and finally help listeners follow a story.",
          es: "El conflicto es el problema del cuento. Palabras de orden como first, then y finally ayudan a seguir un cuento.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-space", "char-owl", "char-robot"],
        speaker: "Professor Hoot",
        text: {
          en: "Through this door is Sky Harbor, a city anchored to the clouds. As you listen, ask two questions: what does the character want, and what stands in the way? That gap between wanting and getting is the conflict, and it drives every event.",
          es: "Detrás de esta puerta está el Puerto del Cielo, una ciudad anclada a las nubes. Mientras escuchas, hazte dos preguntas: ¿qué quiere el personaje y qué se lo impide? Esa distancia entre querer y lograr es el conflicto, y mueve cada suceso.",
        },
      },
      {
        kind: "listen",
        script: {
          en: "Rafi had flown the old airship only twice, both times with his grandmother at the controls. So when the radio crackled with a call from the Gray Mountain clinic, a fever spreading and medicine running out, he hesitated. Grandmother was away until morning. Bolt, his patched-together robot, calculated the weather: a storm front, three hours out. They loaded the crates and cast off. For an hour the sky held. Then the clouds turned the color of bruises, rain hammered the hull, and the engine coughed twice and died. Rafi's first instinct was to radio home and give up. Instead, he remembered his grandmother's oldest rule: when the engine fails, the wind is still working. He and Bolt lashed a canvas tarp to the mast. It caught, the ship lurched forward, and they rode the storm's edge down onto the mountain landing pad, where the doctor was already running toward them.",
        },
        transcriptLabel: { en: "Storm over Sky Harbor", es: "Tormenta sobre el Puerto del Cielo" },
      },
      {
        kind: "choice",
        prompt: {
          en: "The story has more than one conflict. Which pair describes them best?",
          es: "El cuento tiene más de un conflicto. ¿Qué par los describe mejor?",
        },
        options: [
          {
            text: {
              en: "Rafi against the storm and broken engine (outside), and Rafi against his own doubt (inside).",
            },
            correct: true,
            feedback: {
              en: "Exactly. The storm is an external conflict; his hesitation and urge to give up are internal.",
              es: "Exacto. La tormenta es un conflicto externo; su duda y sus ganas de rendirse son internos.",
            },
          },
          {
            text: { en: "Rafi against his grandmother." },
            correct: false,
            feedback: {
              en: "His grandmother is absent, and her advice helps him. Who or what actually works against Rafi?",
              es: "Su abuela no está, y su consejo lo ayuda. ¿Quién o qué trabaja realmente en contra de Rafi?",
            },
          },
          {
            text: { en: "Bolt against the doctor." },
            correct: false,
            feedback: {
              en: "They never clash. Think about what blocks Rafi's goal from outside AND from inside.",
              es: "Ellos nunca chocan. Piensa en qué bloquea la meta de Rafi desde afuera Y desde adentro.",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Order the plot: exposition, rising action, climax, falling action, resolution.",
          es: "Ordena la trama: exposición, acción creciente, clímax, acción descendente, desenlace.",
        },
        items: [
          { en: "The clinic calls for medicine while Grandmother is away." },
          { en: "Rafi and Bolt take off ahead of the storm." },
          { en: "The engine dies in the storm, and Rafi almost gives up." },
          { en: "They rig a tarp as a sail and ride the wind down." },
          { en: "They land, and the doctor runs to meet them." },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Retell the story aloud as a storyteller would. Include the conflict, the turning point and the resolution, use sequence words, and explain what changed in Rafi.",
          es: "Vuelve a contar el cuento en voz alta como lo haría un narrador. Incluye el conflicto, el momento decisivo y el desenlace, usa palabras de secuencia y explica qué cambió en Rafi.",
        },
        mode: "say",
        frames: [
          { en: "At the beginning, ..." },
          { en: "After that, ..." },
          { en: "In the end, Rafi..." },
        ],
        wordBank: [
          "conflict",
          "hesitated",
          "turning point",
          "after that",
          "meanwhile",
          "instinct",
          "resolution",
        ],
        check: {
          minWords: 55,
          needConnectors: ["sequence"],
          needAny: [
            ["rafi"],
            ["storm", "engine"],
            ["sail", "tarp", "wind"],
            ["doubt", "doubts", "hesitated", "hesitates", "give up", "gives up", "almost gave up", "confident", "changed", "changes", "learned", "learns", "trust", "trusts", "brave", "braver"],
          ],
        },
        model: {
          en: "At the beginning, Rafi gets a call that the mountain clinic needs medicine, but his grandmother is away, so he hesitates. After that, he and Bolt fly out ahead of a storm. Then the engine dies, and Rafi almost gives up. The turning point is when he remembers that the wind is still working, so they tie a tarp to the mast as a sail. In the end, Rafi lands safely and learns he can trust himself.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You named external and internal conflict, mapped the plot, and retold it aloud with clear sequence.",
          es: "Nombraste el conflicto externo e interno, ordenaste la trama y la contaste en voz alta con una secuencia clara.",
        },
      },
    ],
  },
};

const kite = {
  id: "the-kite",
  title: { en: "The Kite Who Wanted to Be Free", es: "La cometa que quería ser libre" },
  goal: {
    en: "Find who is telling the story and its theme, then rewrite the ending.",
    es: "Descubrir quién cuenta el cuento y cuál es su mensaje, y luego reescribir el final.",
  },
  keyUse: "Narrate",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-beach", "char-owl", "char-maya"],
        speaker: "Professor Hoot",
        text: {
          en: "This world is a windy beach. The story is told by... a kite! When a story uses “I,” the narrator is a character in it. Read, and think: what lesson does the kite learn?",
          es: "Este mundo es una playa con mucho viento. El cuento lo narra... ¡una cometa! Cuando un cuento usa «yo», el narrador es un personaje. Lee y piensa: ¿qué aprende la cometa?",
        },
      },
      {
        kind: "read",
        title: { en: "The Kite Who Wanted to Be Free", es: "La cometa que quería ser libre" },
        text: {
          en: "I am a red kite. Every Saturday, a girl named Mira takes me to the beach. I fly high, but the string always pulls me back. “Let me go!” I shout to the wind. One day, the string snaps. I am free! But then I start to fall. I spin and drop into a tall pine tree. My tail is tangled in the branches. From the tree, I see Mira running and calling for me. Now I understand. The string did not hold me down. It held me UP.",
        },
        glossary: [
          { word: "snaps", en: "breaks suddenly", es: "se rompe de golpe" },
          { word: "tangled", en: "twisted and stuck", es: "enredado" },
        ],
      },
      {
        kind: "choice",
        prompt: { en: "Who is telling this story?", es: "¿Quién cuenta este cuento?" },
        options: [
          {
            text: { en: "The kite, using “I”" },
            correct: true,
            feedback: {
              en: "Yes! The kite tells the story with “I,” so we only know what the kite thinks.",
              es: "¡Sí! La cometa cuenta el cuento con «yo», así que solo sabemos lo que piensa la cometa.",
            },
          },
          {
            text: { en: "Mira" },
            correct: false,
            feedback: {
              en: "Mira is in the story, but look at the first words: “I am a red kite.” Who is “I”?",
              es: "Mira está en el cuento, pero mira las primeras palabras: «Soy una cometa roja». ¿Quién es «yo»?",
            },
          },
          {
            text: { en: "The wind" },
            correct: false,
            feedback: {
              en: "The kite talks TO the wind. Who says “I” in the story?",
              es: "La cometa le habla AL viento. ¿Quién dice «yo» en el cuento?",
            },
          },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "What is the theme, the lesson of the story?",
          es: "¿Cuál es el tema, la lección del cuento?",
        },
        options: [
          {
            text: { en: "The things that hold us can also help us rise." },
            correct: true,
            feedback: {
              en: "Yes. The kite learns the string helped it fly. A theme is a lesson that fits many stories, not just this one.",
              es: "Sí. La cometa aprende que el hilo la ayudaba a volar. Un tema es una lección que sirve para muchos cuentos, no solo para este.",
            },
          },
          {
            text: { en: "Kites are red." },
            correct: false,
            feedback: {
              en: "This is a detail, not a lesson. What does the kite UNDERSTAND at the end?",
              es: "Esto es un detalle, no una lección. ¿Qué ENTIENDE la cometa al final?",
            },
          },
          {
            text: { en: "Never go to the beach." },
            correct: false,
            feedback: {
              en: "The beach is only the setting. Reread the last two sentences for the lesson.",
              es: "La playa es solo el lugar. Vuelve a leer las dos últimas oraciones para encontrar la lección.",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Rewrite the ending! Start when the kite is stuck in the tree. Tell what happens next, using “I” as the kite.",
          es: "¡Reescribe el final! Empieza cuando la cometa está atorada en el árbol. Cuenta qué pasa después, usando «yo» como la cometa.",
        },
        mode: "write",
        frames: [
          { en: "I am stuck in the tree when..." },
          { en: "Then..." },
          { en: "At the end, I..." },
        ],
        wordBank: ["Mira", "string", "branches", "climb", "wind", "then", "finally", "fly"],
        check: {
          minWords: 35,
          needConnectors: ["sequence"],
          needWords: ["i"],
          needAny: [["mira"], ["string", "fly", "flew", "wind"]],
        },
        model: {
          en: "I am stuck in the tree when Mira's dad brings a ladder. Then Mira climbs up and gently untangles my tail. She ties a new, stronger string to me. Finally, I fly over the beach again. When the string pulls, I do not shout anymore. I say thank you.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "A narrator who says “I” is a character. A theme is the lesson the story teaches.",
          es: "Un narrador que dice «yo» es un personaje. El tema es la lección que enseña el cuento.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-beach", "char-owl", "char-maya"],
        speaker: "Professor Hoot",
        text: {
          en: "This world belongs to a first-person narrator, a kite. First-person narrators only know what they know, and sometimes what they believe is wrong. Read carefully: the kite's understanding changes, and that change carries the theme.",
          es: "Este mundo pertenece a una narradora en primera persona: una cometa. Los narradores en primera persona solo saben lo que saben, y a veces lo que creen está equivocado. Lee con cuidado: lo que entiende la cometa cambia, y ese cambio lleva el tema.",
        },
      },
      {
        kind: "read",
        title: { en: "The Kite Who Wanted to Be Free", es: "La cometa que quería ser libre" },
        text: {
          en: "Every Saturday the girl carries me to the shore, and every Saturday the same insult: the string. I climb until the gulls are below me, until the town is a scatter of rooftops, and just when the whole sky opens, the string yanks me back like a hand on a collar. The girl, Mira, laughs and calls it flying. I call it a leash. “Let me go,” I tell the wind, and the wind, which has never been tied to anything, agrees with me. This Saturday the string frays against a rock, and in one bright second I am loose. For a breath I hang there, weightless, triumphant. Then the wind, my friend, simply moves on without me. Nothing pushes back against it anymore. I tilt, I spin, I fall, and the pine tree at the edge of the dunes catches me by the tail. From up here I can see Mira running along the sand, shouting a name I did not know she had given me. I understand now what I could not see from the end of a string: the pull was never against me. It was the thing that held me up.",
        },
        glossary: [
          { word: "frays", en: "wears thin until it starts to come apart", es: "se deshilacha" },
          { word: "triumphant", en: "feeling like you have won", es: "triunfante" },
          { word: "leash", en: "a rope used to hold an animal", es: "una correa" },
          { word: "dunes", en: "hills of sand", es: "dunas; colinas de arena" },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Which details show the narrator's view is limited or mistaken?",
          es: "¿Qué detalles muestran que la visión de la narradora es limitada o equivocada?",
        },
        clues: [
          {
            id: "leash",
            text: { en: "“The girl calls it flying. I call it a leash.”" },
            relevant: true,
            why: {
              en: "Two views of the same string; the story later proves Mira right.",
              es: "Dos visiones del mismo hilo; el cuento luego le da la razón a Mira.",
            },
          },
          {
            id: "wind-friend",
            text: { en: "The wind “agrees with me” and is called “my friend.”" },
            relevant: true,
            why: {
              en: "The kite trusts the wind, but the wind abandons it; the kite misjudged it.",
              es: "La cometa confía en el viento, pero el viento la abandona; la cometa lo juzgó mal.",
            },
          },
          {
            id: "name",
            text: { en: "Mira shouts “a name I did not know she had given me.”" },
            relevant: true,
            why: {
              en: "The narrator didn't know Mira cared; first person hides what others feel.",
              es: "La narradora no sabía que Mira la quería; la primera persona esconde lo que otros sienten.",
            },
          },
          {
            id: "gulls",
            text: { en: "The gulls are below the kite." },
            relevant: false,
            why: {
              en: "This shows how high it flies, an accurate detail, not a mistaken belief.",
              es: "Esto muestra lo alto que vuela, un detalle exacto, no una creencia equivocada.",
            },
          },
          {
            id: "rock",
            text: { en: "The string frays against a rock." },
            relevant: false,
            why: {
              en: "This is a plot event; it doesn't reveal what the narrator misunderstands.",
              es: "Es un suceso de la trama; no muestra lo que la narradora entiende mal.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "Which statement best expresses the theme?",
          es: "¿Qué enunciado expresa mejor el tema?",
        },
        options: [
          {
            text: { en: "Connections that feel like limits can be what make us able to rise." },
            correct: true,
            feedback: {
              en: "Yes. It's stated as a general idea about life, and it's supported by the kite's change in understanding.",
              es: "Sí. Está dicho como una idea general sobre la vida, y lo apoya el cambio en lo que entiende la cometa.",
            },
          },
          {
            text: { en: "A kite's string broke on a rock." },
            correct: false,
            feedback: {
              en: "That's a plot summary. A theme is a message about life that readers could apply beyond this story.",
              es: "Eso es un resumen de la trama. Un tema es un mensaje sobre la vida que se puede aplicar más allá de este cuento.",
            },
          },
          {
            text: { en: "Freedom is always bad." },
            correct: false,
            feedback: {
              en: "This goes too far. The kite still loves flying high. What did it actually learn about the string?",
              es: "Esto exagera. A la cometa todavía le encanta volar alto. ¿Qué aprendió realmente sobre el hilo?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Rewrite the ending from Mira's point of view, in third person (she, her). Show what Mira sees and feels that the kite could not know, and keep the theme.",
          es: "Reescribe el final desde el punto de vista de Mira, en tercera persona (ella). Muestra lo que Mira ve y siente que la cometa no podía saber, y mantén el tema.",
        },
        mode: "write",
        frames: [
          { en: "When the string snapped, Mira..." },
          { en: "She..." },
          { en: "Later, ..." },
        ],
        wordBank: ["she", "her", "frayed", "dunes", "pine", "untangled", "meanwhile", "finally"],
        check: {
          minWords: 60,
          needConnectors: ["sequence"],
          needWords: ["mira", "she"],
          needAny: [
            ["kite"],
            ["string", "line"],
            ["felt", "worried", "afraid", "relieved", "heart"],
          ],
        },
        model: {
          en: "When the string snapped, Mira felt her heart drop. She had named the kite Ember on the first day, but she had never said it out loud. She ran along the dunes, shouting “Ember!” until her throat hurt. Then she saw a flash of red in the pine tree. Her uncle lifted her onto his shoulders, and she untangled the tail one knot at a time. Finally, she tied on a new string, doubled for strength. When Ember rose again, the line went tight, and Mira smiled, because that pull meant the kite was flying.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You found a narrator's limits, stated a theme as a general idea, and shifted the point of view to reveal new information.",
          es: "Encontraste los límites de una narradora, expresaste un tema como idea general y cambiaste el punto de vista para revelar información nueva.",
        },
      },
    ],
  },
};

const gate = {
  id: "story-gate",
  title: {
    en: "Final Demonstration: The Story Gate",
    es: "Demostración final: La puerta de los cuentos",
  },
  goal: {
    en: "Plan and write an original short story with a character, a setting, a conflict, events in order and a resolution.",
    es: "Planear y escribir un cuento original con un personaje, un lugar, un conflicto, sucesos en orden y un desenlace.",
  },
  keyUse: "Narrate",
  domains: ["Listening", "Reading", "Writing"],
  final: true,
  book: {
    templateId: "mystery-story",
    title: { en: "My Storyverse Story", es: "Mi cuento del Storyverso" },
  },
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-night", "char-owl"],
        speaker: "Professor Hoot",
        text: {
          en: "You have visited three story worlds. Now there is one more door, the Story Gate, and it only opens for a NEW story. Yours!",
          es: "Visitaste tres mundos de cuentos. Ahora hay una puerta más, la Puerta de los Cuentos, y solo se abre con un cuento NUEVO. ¡El tuyo!",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "To open the Story Gate, your story needs five keys. Key one: a character who wants something. Key two: a setting, a place and time. Key three: a problem, something that gets in the way. Key four: events in order. Key five: an ending that solves the problem. A small mystery is a great problem: something lost, something strange, a door that won't open.",
        },
        transcriptLabel: {
          en: "Professor Hoot's five keys",
          es: "Las cinco llaves del Profesor Hoot",
        },
      },
      {
        kind: "order",
        prompt: {
          en: "Put the parts of a story plan in the order they usually happen.",
          es: "Ordena las partes de un plan de cuento como suelen pasar.",
        },
        items: [
          { en: "Meet the character and the setting." },
          { en: "A problem or mystery starts." },
          { en: "The character tries to solve it." },
          { en: "The problem is solved at the end." },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Which story beginning has a character, a setting AND a problem?",
          es: "¿Qué comienzo de cuento tiene un personaje, un lugar Y un problema?",
        },
        options: [
          {
            text: {
              en: "On the first snowy morning of winter, Omar opened his lunchbox and found it empty, except for a single silver feather.",
            },
            correct: true,
            feedback: {
              en: "All three! Omar is the character, a snowy morning is the setting, and the empty lunchbox is a mystery.",
              es: "¡Los tres! Omar es el personaje, la mañana con nieve es el lugar y la lonchera vacía es un misterio.",
            },
          },
          {
            text: { en: "Omar was a boy. He liked lunch." },
            correct: false,
            feedback: {
              en: "We meet a character, but where is he, and what goes wrong? Look for a beginning with a place and a problem.",
              es: "Conocemos a un personaje, pero ¿dónde está y qué sale mal? Busca un comienzo con un lugar y un problema.",
            },
          },
          {
            text: { en: "It was snowy." },
            correct: false,
            feedback: {
              en: "This has a setting only. Who is the story about, and what is the problem?",
              es: "Esto solo tiene un lugar. ¿De quién es el cuento y cuál es el problema?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration! Write your own short story. Give it a character, a setting and a problem or mystery. Tell the events in order with order words, and write an ending that solves the problem.",
          es: "¡Tu demostración final! Escribe tu propio cuento corto. Ponle un personaje, un lugar y un problema o misterio. Cuenta los sucesos en orden con palabras de orden y escribe un final que resuelva el problema.",
        },
        mode: "write",
        frames: [{ en: "One day, ..." }, { en: "Then, ..." }, { en: "Finally, ..." }],
        wordBank: ["one day", "first", "then", "next", "suddenly", "finally", "said", "mystery"],
        check: {
          minWords: 70,
          needConnectors: ["sequence"],
          needAny: [["said", "asked", "shouted", "whispered", "wondered"]],
        },
        model: {
          en: "On the first snowy morning of winter, Omar opened his lunchbox and found it empty, except for a single silver feather. “Who took my sandwich?” he asked. First, he looked under his desk, but there was nothing there. Then he saw tiny tracks in the snow outside the window. Next, he followed the tracks to the old oak tree. Finally, he looked up and saw a gray jay sitting in a nest made of bread crusts. Omar laughed and said, “You can keep it. I will bring two sandwiches tomorrow.”",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-night", "char-owl"],
        speaker: "Professor Hoot",
        text: {
          en: "Every world you've visited was written by someone. The Story Gate opens only for a story that has never existed before. Bring everything: a character we can infer, a setting that matters, a conflict that pushes, a clear sequence and an ending that means something.",
          es: "Cada mundo que visitaste lo escribió alguien. La Puerta de los Cuentos solo se abre con un cuento que nunca ha existido. Trae todo: un personaje que podamos inferir, un ambiente que importe, un conflicto que empuje, una secuencia clara y un final que signifique algo.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Here is what the Gate looks for. A character who wants something, shown through actions, not labels. A setting that affects what happens. A conflict, and if you can, both an outside obstacle and an inside doubt. A sequence the reader can follow, with a turning point. And a resolution that shows how the character changed. Mysteries make excellent engines for a short story: a clue, a wrong guess, a discovery. Keep it short. A great short story does one thing well.",
        },
        transcriptLabel: {
          en: "What the Story Gate looks for",
          es: "Lo que busca la Puerta de los Cuentos",
        },
      },
      {
        kind: "order",
        prompt: {
          en: "Order the plot of a short mystery.",
          es: "Ordena la trama de un misterio corto.",
        },
        items: [
          { en: "Exposition: the character and setting, and something is missing." },
          { en: "Rising action: the character finds a clue and makes a wrong guess." },
          { en: "Climax: a discovery changes everything." },
          { en: "Falling action: the character acts on the discovery." },
          { en: "Resolution: the mystery is solved, and the character has changed." },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Which opening sentence SHOWS character instead of telling it?",
          es: "¿Qué oración inicial MUESTRA al personaje en lugar de decir cómo es?",
        },
        options: [
          {
            text: {
              en: "Lena checked the lock on the bakery door three times before she let herself believe the bread had really vanished.",
            },
            correct: true,
            feedback: {
              en: "This shows a careful, maybe anxious character through action, and it opens the mystery at once.",
              es: "Esto muestra a un personaje cuidadoso, quizá ansioso, por medio de una acción, y abre el misterio de inmediato.",
            },
          },
          {
            text: { en: "Lena was a very careful and nervous girl." },
            correct: false,
            feedback: {
              en: "This TELLS us her traits. Which choice lets the reader infer them from what she does?",
              es: "Esto DICE sus rasgos. ¿Qué opción deja que el lector los infiera por lo que ella hace?",
            },
          },
          {
            text: { en: "This is a story about a bakery." },
            correct: false,
            feedback: {
              en: "This announces the topic, but there's no character or tension yet. Which opening pulls the reader in?",
              es: "Esto anuncia el tema, pero todavía no hay personaje ni tensión. ¿Qué inicio atrapa al lector?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration. Write an original short story of 150 to 300 words. Show your character through actions, make the setting matter, build a conflict with a turning point, use dialogue at least once, and end with a resolution that shows how your character changed.",
          es: "Tu demostración final. Escribe un cuento original de 150 a 300 palabras. Muestra a tu personaje con acciones, haz que el ambiente importe, construye un conflicto con un momento decisivo, usa diálogo al menos una vez y termina con un desenlace que muestre cómo cambió tu personaje.",
        },
        mode: "write",
        frames: [
          { en: "[Character] [action that shows a trait] when..." },
          { en: "At first, ..." },
          { en: "But then, ..." },
        ],
        wordBank: [
          "suddenly",
          "meanwhile",
          "at first",
          "however",
          "whispered",
          "realized",
          "clue",
          "finally",
        ],
        check: {
          minWords: 150,
          needConnectors: ["sequence", "contrast"],
          needAny: [["said", "asked", "shouted", "whispered", "replied", "called"]],
        },
        model: {
          en: "Lena checked the lock on the bakery door three times before she let herself believe the bread had really vanished. Twelve loaves had cooled on the rack at closing time. Now, in the gray light before dawn, only crumbs remained, and the door had been locked all night. At first, Lena suspected her older brother, who was always hungry and always joking. “I didn't touch it,” Mateo said, holding up his flour-free hands. She did not believe him. Then she noticed something strange: a trail of crumbs led not to the door, but up the wall to the old ventilation grate near the ceiling. Lena dragged a chair over and climbed up, her heart pounding. Behind the grate, warm against the chimney, a mother raccoon lay curled around four tiny kits, a whole loaf tucked beside them. Lena climbed down slowly. However, instead of calling the animal control office right away, she sat on the floor for a long time. Finally, she went to find Mateo. “I'm sorry I blamed you,” she whispered. Together they called the wildlife rescue center, and that afternoon the rescuers moved the raccoon family safely to the woods. The next night, Lena left one small roll by the back door, just in case. She still checked the lock three times, but now she smiled while she did it.",
        },
      },
    ],
  },
};

export default {
  id: "storyverse",
  title: { en: "Storyverse", es: "Storyverso" },
  tagline: {
    en: "Step through story worlds, then write your own.",
    es: "Atraviesa mundos de cuentos y luego escribe el tuyo.",
  },
  theme: {
    bg: "bg-forest",
    accent: "#9a6a00",
    soft: "#fdf4dc",
    ink: "#5a3d00",
    hero: ["char-owl", "char-maya"],
  },
  intro: {
    en: "The Storyverse is a library where every book is a door into another world. You will meet brave characters, ride out a storm, and hear a story told by a kite. To pass the final gate, you will write a story no one has ever read before.",
    es: "El Storyverso es una biblioteca donde cada libro es una puerta a otro mundo. Vas a conocer personajes valientes, atravesar una tormenta y escuchar un cuento narrado por una cometa. Para cruzar la última puerta, escribirás un cuento que nadie ha leído jamás.",
  },
  guide: { name: "Professor Hoot", art: "char-owl" },
  missions: [lantern, sky, kite, gate],
};
