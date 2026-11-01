// The 15 games of the Language Game Studio. Each row is what the hub, the Passport, pathways and the
// teacher view need to know without loading the game: its language objective, skill, WIDA 2020 Key
// Language Use, grade-band objectives and which module and content file drive it.
//
// Honesty rules (PLATFORM.md): A/B/C are classroom SUPPORT modes (Starting, Growing, Expanding), never
// WIDA proficiency levels; "klu" names the Key Language Use the task asks for, not a standards
// alignment claim; nothing here predicts an ACCESS score.
export const SKILLS = ["Listening", "Reading", "Speaking", "Writing", "Integrated"];
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];

/** [en, es] pairs. `obj` holds the explicit language objective for each grade band. */
export const GAMES = [
  {
    id: "grammar-jungle", n: 1, inspired: "funbrain", skill: "Writing", skills: ["Writing", "Reading"], klu: ["Inform", "Explain"],
    title: ["Grammar Jungle", "Selva de la gramática"], tag: ["Swing through the jungle by fixing and sorting real sentences.", "Cruza la selva corrigiendo y clasificando oraciones reales."],
    obj: { "3-5": ["I can name how words work in a sentence and fix a sentence so it makes sense.", "Puedo nombrar cómo funcionan las palabras en una oración y corregirla para que tenga sentido."], "6-8": ["I can use precise parts of speech and edit sentences for agreement, tense and clarity.", "Puedo usar categorías gramaticales precisas y editar oraciones para la concordancia, el tiempo y la claridad."] },
    minutes: 8, difficulty: 2, home: true, art: "jungle", module: "grammar-jungle", mechanic: "tag-and-fix",
  },
  {
    id: "vocab-quest", n: 2, inspired: "funbrain", flagship: true, skill: "Reading", skills: ["Reading", "Writing"], klu: ["Inform", "Explain"],
    title: ["Vocabulary Quest", "Misión del vocabulario"], tag: ["Journey across a map: match pictures, meanings and sentences for academic words.", "Recorre un mapa: une imágenes, significados y oraciones con palabras académicas."],
    obj: { "3-5": ["I can match a school word to its picture, meaning and a sentence that uses it.", "Puedo unir una palabra escolar con su imagen, su significado y una oración que la use."], "6-8": ["I can connect academic words to precise meanings and choose the word that fits a context.", "Puedo conectar palabras académicas con significados precisos y elegir la palabra que encaja en un contexto."] },
    minutes: 8, difficulty: 1, home: true, art: "quest", module: "vocab-quest", mechanic: "map-match",
  },
  {
    id: "story-detective", n: 3, inspired: "funbrain", skill: "Reading", skills: ["Reading", "Speaking"], klu: ["Narrate", "Explain", "Argue"],
    title: ["Story Detective", "Detective de cuentos"], tag: ["Search an illustrated scene for clues, then prove your inference with the text.", "Busca pistas en una escena ilustrada y prueba tu inferencia con el texto."],
    obj: { "3-5": ["I can find clues in a story and say what they tell me, using “because”.", "Puedo encontrar pistas en un cuento y decir qué me indican, usando “porque”."], "6-8": ["I can make an inference and justify it with specific textual evidence.", "Puedo hacer una inferencia y justificarla con evidencia textual específica."] },
    minutes: 10, difficulty: 3, home: true, art: "detective", module: "story-detective", mechanic: "clue-hunt",
  },
  {
    id: "sentence-strategy", n: 4, inspired: "funbrain", skill: "Writing", skills: ["Writing", "Reading"], klu: ["Explain", "Argue"],
    title: ["Sentence Strategy", "Estrategia de oraciones"], tag: ["Claim squares on a strategy board by building and editing strong sentences.", "Reclama casillas en un tablero de estrategia construyendo y editando oraciones sólidas."],
    obj: { "3-5": ["I can join ideas and fix a sentence so my meaning is clear.", "Puedo unir ideas y corregir una oración para que mi significado sea claro."], "6-8": ["I can combine, expand and edit sentences to state a precise claim and reason.", "Puedo combinar, ampliar y editar oraciones para expresar una afirmación y una razón precisas."] },
    minutes: 10, difficulty: 3, home: false, art: "strategy", module: "sentence-strategy", mechanic: "tic-tac-toe",
  },
  {
    id: "sound-word-studio", n: 5, inspired: "starfall", skill: "Reading", skills: ["Reading", "Listening"], klu: ["Inform"],
    title: ["Sound & Word Studio", "Estudio de sonidos y palabras"], tag: ["Mix sounds on the studio board: letters, syllables and vowel patterns.", "Mezcla sonidos en el tablero del estudio: letras, sílabas y patrones de vocales."],
    obj: { "3-5": ["I can hear sounds in a word, build it with letters and read it aloud.", "Puedo oír los sonidos de una palabra, formarla con letras y leerla en voz alta."], "6-8": ["I can decode multisyllable academic words using syllable and vowel patterns.", "Puedo decodificar palabras académicas de varias sílabas usando patrones de sílabas y vocales."] },
    minutes: 8, difficulty: 1, home: true, art: "studio", module: "sound-word-studio", mechanic: "build-word",
  },
  {
    id: "read-along-theater", n: 6, inspired: "starfall", flagship: true, skill: "Reading", skills: ["Reading", "Listening"], klu: ["Narrate"],
    title: ["Read-Along Theater", "Teatro de lectura compartida"], tag: ["Follow illustrated story pages with word-by-word highlighting, then check your understanding.", "Sigue páginas ilustradas con las palabras resaltadas y comprueba tu comprensión."],
    obj: { "3-5": ["I can follow a story as I hear it, tap words I do not know and tell what happened.", "Puedo seguir un cuento mientras lo oigo, tocar palabras que no conozco y contar lo que pasó."], "6-8": ["I can follow a narrative, track how events connect and explain character choices.", "Puedo seguir una narración, ver cómo se conectan los hechos y explicar las decisiones de los personajes."] },
    minutes: 10, difficulty: 1, home: true, art: "theater", module: "read-along-theater", mechanic: "karaoke-pages",
  },
  {
    id: "fluency-echo", n: 7, inspired: "starfall", skill: "Speaking", skills: ["Speaking", "Reading"], klu: ["Narrate", "Inform"],
    title: ["Fluency Echo", "Eco de fluidez"], tag: ["Listen to a model, rehearse by phrase, record yourself and compare.", "Escucha un modelo, ensaya por frases, grábate y compara."],
    obj: { "3-5": ["I can read a short text aloud in phrases and notice how my reading changes.", "Puedo leer en voz alta un texto corto por frases y notar cómo cambia mi lectura."], "6-8": ["I can read aloud with phrasing and expression, then compare my reading to a model.", "Puedo leer en voz alta con fraseo y expresión y luego comparar mi lectura con un modelo."] },
    minutes: 8, difficulty: 2, home: true, art: "echo", module: "fluency-echo", mechanic: "echo-record",
  },
  {
    id: "story-world", n: 8, inspired: "starfall", skill: "Integrated", skills: ["Reading", "Listening", "Speaking"], klu: ["Narrate", "Explain"],
    title: ["Interactive Story World", "Mundo de cuentos interactivo"], tag: ["Tap through a living story scene, order events and link causes to effects.", "Toca una escena de cuento viva, ordena los hechos y une causas con efectos."],
    obj: { "3-5": ["I can order story events and tell what happened first, next and last.", "Puedo ordenar los hechos de un cuento y decir qué pasó primero, después y al final."], "6-8": ["I can sequence events and explain how one event caused another.", "Puedo ordenar los hechos y explicar cómo un hecho causó otro."] },
    minutes: 10, difficulty: 2, home: true, art: "world", module: "story-world", mechanic: "scene-sequence",
  },
  {
    id: "word-bingo", n: 9, inspired: "abcya", skill: "Listening", skills: ["Listening", "Reading"], klu: ["Inform"],
    title: ["Word Bingo", "Bingo de palabras"], tag: ["Listen to the caller, read the clue and mark the word that fits.", "Escucha al locutor, lee la pista y marca la palabra que encaja."],
    obj: { "3-5": ["I can listen to a clue and find the matching word on my card.", "Puedo escuchar una pista y encontrar la palabra que corresponde en mi tarjeta."], "6-8": ["I can match words to definitions, synonyms and context clues.", "Puedo unir palabras con definiciones, sinónimos y pistas de contexto."] },
    minutes: 8, difficulty: 1, home: true, art: "bingo", module: "word-bingo", mechanic: "bingo-caller",
  },
  {
    id: "sentence-factory", n: 10, inspired: "abcya", flagship: true, skill: "Writing", skills: ["Writing"], klu: ["Explain", "Narrate", "Inform"],
    title: ["Sentence Factory", "Fábrica de oraciones"], tag: ["Drag word blocks through factory stations to build sentences and paragraphs.", "Arrastra bloques de palabras por las estaciones de la fábrica para construir oraciones y párrafos."],
    obj: { "3-5": ["I can put words in order, match the verb and add punctuation to make a sentence.", "Puedo ordenar palabras, concordar el verbo y añadir puntuación para formar una oración."], "6-8": ["I can build complex sentences and organize them into a clear paragraph.", "Puedo construir oraciones complejas y organizarlas en un párrafo claro."] },
    minutes: 10, difficulty: 2, home: false, art: "factory", module: "sentence-factory", mechanic: "drag-assembly",
  },
  {
    id: "spelling-expedition", n: 11, inspired: "abcya", skill: "Writing", skills: ["Writing", "Reading"], klu: ["Inform"],
    title: ["Spelling Expedition", "Expedición de ortografía"], tag: ["Climb the mountain by building words from prefixes, roots and suffixes.", "Escala la montaña formando palabras con prefijos, raíces y sufijos."],
    obj: { "3-5": ["I can spell words by listening for sounds and using word families.", "Puedo escribir palabras escuchando los sonidos y usando familias de palabras."], "6-8": ["I can form academic words from roots, prefixes and suffixes and explain their meaning.", "Puedo formar palabras académicas con raíces, prefijos y sufijos y explicar su significado."] },
    minutes: 8, difficulty: 2, home: true, art: "expedition", module: "spelling-expedition", mechanic: "word-parts",
  },
  {
    id: "word-search-adventure", n: 12, inspired: "abcya", skill: "Reading", skills: ["Reading"], klu: ["Inform"],
    title: ["Word Search Adventure", "Aventura de sopa de letras"], tag: ["Find hidden words from picture and sentence clues to uncover a scene.", "Encuentra palabras ocultas con pistas de imágenes y oraciones para descubrir una escena."],
    obj: { "3-5": ["I can read a clue, find the word in the letters and use it in a sentence.", "Puedo leer una pista, encontrar la palabra entre las letras y usarla en una oración."], "6-8": ["I can use context clues to find academic words and uncover a science or social studies scene.", "Puedo usar pistas de contexto para encontrar palabras académicas y descubrir una escena de ciencias o estudios sociales."] },
    minutes: 8, difficulty: 2, home: true, art: "search", module: "word-search-adventure", mechanic: "grid-search",
  },
  {
    id: "story-creator", n: 13, inspired: "abcya", skill: "Writing", skills: ["Writing", "Speaking"], klu: ["Narrate"],
    title: ["Story Creator", "Creador de cuentos"], tag: ["Compose an illustrated story: scenes, characters, dialogue, narration and revision.", "Compón un cuento ilustrado: escenas, personajes, diálogo, narración y revisión."],
    obj: { "3-5": ["I can tell a story with a beginning, middle and end and add what characters say.", "Puedo contar un cuento con inicio, desarrollo y final y añadir lo que dicen los personajes."], "6-8": ["I can write a narrative with a clear problem, events and a resolution, using dialogue.", "Puedo escribir una narración con un problema claro, hechos y una resolución, usando diálogo."] },
    minutes: 10, difficulty: 3, home: true, art: "creator", module: "story-creator", mechanic: "storyboard",
  },
  {
    id: "language-arcade", n: 14, inspired: "abcya", skill: "Integrated", skills: ["Reading", "Listening", "Writing"], klu: ["Inform", "Explain"],
    title: ["Language Arcade", "Arcade del lenguaje"], tag: ["Steer through mazes and platforms where the right word opens the way.", "Avanza por laberintos y plataformas donde la palabra correcta abre el camino."],
    obj: { "3-5": ["I can choose the right word or word form to move through each gate.", "Puedo elegir la palabra o la forma correcta para pasar cada puerta."], "6-8": ["I can choose precise words, forms and connectors so each sentence works in its context.", "Puedo elegir palabras, formas y conectores precisos para que cada oración funcione en su contexto."] },
    minutes: 8, difficulty: 2, home: false, art: "arcade", module: "language-arcade", mechanic: "maze-gates",
  },
  {
    id: "escape-room", n: 15, inspired: "original", flagship: true, skill: "Integrated", skills: ["Listening", "Reading", "Speaking", "Writing"], klu: ["Narrate", "Inform", "Explain", "Argue"],
    title: ["Academic Language Escape Room", "Sala de escape de lenguaje académico"], tag: ["Four rooms, four subjects: listen, read evidence, explain aloud and write to unlock each door.", "Cuatro salas, cuatro materias: escucha, lee evidencia, explica en voz alta y escribe para abrir cada puerta."],
    obj: { "3-5": ["I can listen, read for evidence, talk and write to solve a science or social studies mission.", "Puedo escuchar, leer para buscar evidencia, hablar y escribir para resolver una misión de ciencias o estudios sociales."], "6-8": ["I can combine listening, reading evidence, spoken explanation and written argument to complete a multi-step academic mission.", "Puedo combinar la escucha, la lectura de evidencia, la explicación oral y el argumento escrito para completar una misión académica de varios pasos."] },
    minutes: 10, difficulty: 3, home: false, art: "escape", module: "escape-room", mechanic: "locked-rooms",
  },
];

export const GAME = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const FLAGSHIPS = GAMES.filter((g) => g.flagship).map((g) => g.id);

/** Multi-game learning pathways: a sequence that moves from word to sentence to text to transfer. */
export const PATHWAYS = [
  { id: "academic-words", title: ["Academic words week", "Semana de palabras académicas"], blurb: ["Learn the words, hear them, then spell and find them.", "Aprende las palabras, escúchalas y luego deletréalas y encuéntralas."], ids: ["vocab-quest", "word-bingo", "spelling-expedition", "word-search-adventure"] },
  { id: "sentence-builders", title: ["Sentence builders", "Constructores de oraciones"], blurb: ["Sort the parts, fix the errors, then build whole sentences.", "Clasifica las partes, corrige los errores y construye oraciones completas."], ids: ["grammar-jungle", "sentence-factory", "sentence-strategy"] },
  { id: "story-explorers", title: ["Story explorers", "Exploradores de cuentos"], blurb: ["Hear a story, find the clues, retell it and make your own.", "Escucha un cuento, busca las pistas, vuelve a contarlo y crea el tuyo."], ids: ["read-along-theater", "story-detective", "story-world", "story-creator"] },
  { id: "speak-up", title: ["Speak-up studio", "Estudio para hablar"], blurb: ["Hear the sounds, echo a model and explain out loud.", "Oye los sonidos, haz eco de un modelo y explica en voz alta."], ids: ["sound-word-studio", "fluency-echo", "escape-room"] },
];

/** Achievements that mean something: each names the language behavior it recognizes. */
export const ACHIEVEMENTS = [
  { id: "first-game", icon: "star", name: ["First game finished", "Primer juego completado"], means: ["You finished a whole language game.", "Terminaste un juego de lenguaje completo."] },
  { id: "evidence-finder", icon: "detective", name: ["Evidence finder", "Buscador de evidencia"], means: ["You backed an inference with evidence from the text.", "Respaldaste una inferencia con evidencia del texto."] },
  { id: "careful-reviser", icon: "writing", name: ["Careful reviser", "Revisor cuidadoso"], means: ["You fixed your work after feedback in three different rounds.", "Corregiste tu trabajo después de recibir comentarios en tres rondas distintas."] },
  { id: "independent-builder", icon: "sparkle", name: ["Independent builder", "Constructor independiente"], means: ["You finished a game in Expanding mode with no help opened.", "Terminaste un juego en modo Ampliando sin abrir ayuda."] },
  { id: "transfer-writer", icon: "reading", name: ["Transfer writer", "Escritor que transfiere"], means: ["You used a game's language on your own in a short written transfer task.", "Usaste el lenguaje de un juego por tu cuenta en una tarea escrita de transferencia."] },
  { id: "four-skills", icon: "growth", name: ["Four-skill explorer", "Explorador de cuatro destrezas"], means: ["You played games in Listening, Reading, Speaking and Writing.", "Jugaste en Escuchar, Leer, Hablar y Escribir."] },
  { id: "pathway-complete", icon: "road", name: ["Pathway finisher", "Quien termina recorridos"], means: ["You finished every game in a pathway.", "Terminaste todos los juegos de un recorrido."] },
];
