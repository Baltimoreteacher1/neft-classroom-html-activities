// Picture content for the K–3 pages (src/early/*): Sound Builder word sets, Picture Word Card decks,
// Rhyme & Rhythm Pond, Sight Word Treasures, Sentence Maker, and Cross-Curricular Wonder Worlds.
// Pictures are emoji content, kept here with the other authored content so the interface source stays
// emoji-free (tools/access-design-system.test.mjs).

/** The Sound Builder garden: a plot before and after a word is built. */
export const GARDEN = { grown: "🌻", empty: "🟫" };

/** Rhyme Pond icons. */
export const PONDS = { frog: "🐸", pad: "🪷", splash: "💧" };

/** Word sets by band: [word, sound tiles, picture]. Grades 2–3 add digraphs and blends. */
export const SETS = {
  K: [
    ["cat", ["c", "a", "t"], "🐈"],
    ["sun", ["s", "u", "n"], "☀️"],
    ["map", ["m", "a", "p"], "🗺️"],
    ["pig", ["p", "i", "g"], "🐖"],
    ["hen", ["h", "e", "n"], "🐔"],
    ["bus", ["b", "u", "s"], "🚌"],
  ],
  1: [
    ["dog", ["d", "o", "g"], "🐕"],
    ["fan", ["f", "a", "n"], "🪭"],
    ["net", ["n", "e", "t"], "🥅"],
    ["cup", ["c", "u", "p"], "🥤"],
    ["bed", ["b", "e", "d"], "🛏️"],
    ["fox", ["f", "o", "x"], "🦊"],
    ["web", ["w", "e", "b"], "🕸️"],
    ["pen", ["p", "e", "n"], "🖊️"],
  ],
  "2-3": [
    ["ship", ["sh", "i", "p"], "🚢"],
    ["chick", ["ch", "i", "ck"], "🐤"],
    ["fish", ["f", "i", "sh"], "🐟"],
    ["duck", ["d", "u", "ck"], "🦆"],
    ["frog", ["f", "r", "o", "g"], "🐸"],
    ["stop", ["s", "t", "o", "p"], "🛑"],
    ["tent", ["t", "e", "n", "t"], "⛺"],
    ["crab", ["c", "r", "a", "b"], "🦀"],
  ],
};

/** Multi-round themed gardens for Sound Builder, keeping SETS as Round 1 for each band. */
export const PHONICS_ROUNDS = {
  K: [
    { id: "k-1", title: ["Garden 1: Starter Words", "Huerto 1: Palabras iniciales"], words: SETS.K },
    {
      id: "k-2",
      title: ["Garden 2: Nature & Animals", "Huerto 2: Naturaleza y animales"],
      words: [
        ["bug", ["b", "u", "g"], "🐞"],
        ["log", ["l", "o", "g"], "🪵"],
        ["mud", ["m", "u", "d"], "🟤"],
        ["rat", ["r", "a", "t"], "🐀"],
        ["fin", ["f", "i", "n"], "🦈"],
        ["nut", ["n", "u", "t"], "🌰"],
      ],
    },
    {
      id: "k-3",
      title: ["Garden 3: Around Us", "Huerto 3: A nuestro alrededor"],
      words: [
        ["hat", ["h", "a", "t"], "👒"],
        ["bag", ["b", "a", "g"], "🎒"],
        ["box", ["b", "o", "x"], "📦"],
        ["pot", ["p", "o", "t"], "🪴"],
        ["rug", ["r", "u", "g"], "🧶"],
        ["ten", ["t", "e", "n"], "🔟"],
      ],
    },
  ],
  1: [
    { id: "1-1", title: ["Garden 1: Short Vowels", "Huerto 1: Vocales cortas"], words: SETS[1] },
    {
      id: "1-2",
      title: ["Garden 2: Science & Weather", "Huerto 2: Ciencias y el tiempo"],
      words: [
        ["fog", ["f", "o", "g"], "🌫️"],
        ["bud", ["b", "u", "d"], "🌱"],
        ["pod", ["p", "o", "d"], "🫛"],
        ["bat", ["b", "a", "t"], "🦇"],
        ["ant", ["a", "n", "t"], "🐜"],
        ["cub", ["c", "u", "b"], "🐻"],
      ],
    },
    {
      id: "1-3",
      title: ["Garden 3: Digraphs", "Huerto 3: Dígrafos"],
      words: [
        ["shop", ["sh", "o", "p"], "🛍️"],
        ["chin", ["ch", "i", "n"], "😊"],
        ["moth", ["m", "o", "th"], "🦋"],
        ["sock", ["s", "o", "ck"], "🧦"],
        ["dish", ["d", "i", "sh"], "🍽️"],
        ["path", ["p", "a", "th"], "🥾"],
      ],
    },
  ],
  "2-3": [
    { id: "23-1", title: ["Garden 1: Blends & Digraphs", "Huerto 1: Grupos y dígrafos"], words: SETS["2-3"] },
    {
      id: "23-2",
      title: ["Garden 2: Earth & Space", "Huerto 2: Tierra y espacio"],
      words: [
        ["star", ["s", "t", "a", "r"], "⭐"],
        ["plum", ["p", "l", "u", "m"], "🫐"],
        ["twig", ["t", "w", "i", "g"], "🌿"],
        ["drop", ["d", "r", "o", "p"], "💧"],
        ["cluck", ["c", "l", "u", "ck"], "🐔"],
        ["wind", ["w", "i", "n", "d"], "💨"],
      ],
    },
    {
      id: "23-3",
      title: ["Garden 3: Community & Math", "Huerto 3: Comunidad y matemáticas"],
      words: [
        ["flag", ["f", "l", "a", "g"], "🚩"],
        ["step", ["s", "t", "e", "p"], "🪜"],
        ["plus", ["p", "l", "u", "s"], "➕"],
        ["desk", ["d", "e", "s", "k"], "🪑"],
        ["plan", ["p", "l", "a", "n"], "📝"],
        ["clock", ["c", "l", "o", "ck"], "🕒"],
      ],
    },
  ],
};

/** Decks: { id, subject, title: [en, es], cards: [[english, spanish, picture]] }. */
export const DECKS = [
  {
    id: "garden",
    subject: "science",
    title: ["In the garden", "En el huerto"],
    cards: [
      ["seed", "semilla", "🌰"],
      ["flower", "flor", "🌼"],
      ["tomato", "tomate", "🍅"],
      ["carrot", "zanahoria", "🥕"],
      ["worm", "gusano", "🪱"],
      ["sun", "sol", "☀️"],
      ["water", "agua", "💧"],
      ["leaf", "hoja", "🍃"],
    ],
  },
  {
    id: "food",
    subject: "health",
    title: ["Food", "Comida"],
    cards: [
      ["apple", "manzana", "🍎"],
      ["banana", "plátano", "🍌"],
      ["bread", "pan", "🍞"],
      ["milk", "leche", "🥛"],
      ["egg", "huevo", "🥚"],
      ["rice", "arroz", "🍚"],
      ["cheese", "queso", "🧀"],
      ["grapes", "uvas", "🍇"],
    ],
  },
  {
    id: "school",
    subject: "community",
    title: ["At school", "En la escuela"],
    cards: [
      ["book", "libro", "📘"],
      ["pencil", "lápiz", "✏️"],
      ["crayon", "crayón", "🖍️"],
      ["scissors", "tijeras", "✂️"],
      ["backpack", "mochila", "🎒"],
      ["teacher", "maestra", "👩‍🏫"],
      ["bus", "autobús", "🚌"],
      ["clock", "reloj", "🕒"],
    ],
  },
  {
    id: "weather",
    subject: "science",
    title: ["Weather", "El tiempo"],
    cards: [
      ["sunny", "soleado", "☀️"],
      ["rainy", "lluvioso", "🌧️"],
      ["cloudy", "nublado", "☁️"],
      ["windy", "ventoso", "💨"],
      ["snowy", "nevado", "❄️"],
      ["umbrella", "paraguas", "☂️"],
      ["coat", "abrigo", "🧥"],
      ["boots", "botas", "🥾"],
    ],
  },
  {
    id: "animals",
    subject: "science",
    title: ["Animals", "Animales"],
    cards: [
      ["cat", "gato", "🐈"],
      ["dog", "perro", "🐕"],
      ["bird", "pájaro", "🐦"],
      ["fish", "pez", "🐟"],
      ["frog", "rana", "🐸"],
      ["duck", "pato", "🦆"],
      ["bee", "abeja", "🐝"],
      ["rabbit", "conejo", "🐇"],
    ],
  },
  {
    id: "feelings",
    subject: "sel",
    title: ["Feelings", "Sentimientos"],
    cards: [
      ["happy", "feliz", "😄"],
      ["sad", "triste", "😢"],
      ["angry", "enojado", "😠"],
      ["scared", "asustado", "😨"],
      ["tired", "cansado", "😴"],
      ["surprised", "sorprendido", "😮"],
      ["silly", "chistoso", "🤪"],
      ["calm", "tranquilo", "😌"],
    ],
  },
  {
    id: "numbers-shapes",
    subject: "math",
    title: ["Math: Numbers & Shapes", "Matemáticas: Números y figuras"],
    cards: [
      ["circle", "círculo", "⭕"],
      ["triangle", "triángulo", "🔺"],
      ["square", "cuadrado", "🟦"],
      ["star", "estrella", "⭐"],
      ["five", "cinco", "5️⃣"],
      ["ten", "diez", "🔟"],
      ["plus", "más", "➕"],
      ["equal", "igual", "🟰"],
    ],
  },
  {
    id: "community",
    subject: "community",
    title: ["Our Community", "Nuestra comunidad"],
    cards: [
      ["library", "biblioteca", "📚"],
      ["park", "parque", "🏞️"],
      ["firefighter", "bombero", "🧑‍🚒"],
      ["doctor", "doctora", "🧑‍⚕️"],
      ["mail", "correo", "✉️"],
      ["home", "casa", "🏠"],
      ["map", "mapa", "🗺️"],
      ["bike", "bicicleta", "🚲"],
    ],
  },
  {
    id: "arts-music",
    subject: "arts",
    title: ["Arts & Music", "Arte y música"],
    cards: [
      ["paint", "pintura", "🎨"],
      ["drum", "tambor", "🥁"],
      ["music", "música", "🎵"],
      ["guitar", "guitarra", "🎸"],
      ["dance", "bailar", "💃"],
      ["camera", "cámara", "📷"],
      ["rainbow", "arcoíris", "🌈"],
      ["theater", "teatro", "🎭"],
    ],
  },
  {
    id: "body-health",
    subject: "health",
    title: ["My Body & Health", "Mi cuerpo y salud"],
    cards: [
      ["hand", "mano", "✋"],
      ["eye", "ojo", "👁️"],
      ["ear", "oído", "👂"],
      ["nose", "nariz", "👃"],
      ["mouth", "boca", "👄"],
      ["heart", "corazón", "❤️"],
      ["soap", "jabón", "🧼"],
      ["sleep", "dormir", "🛏️"],
    ],
  },
];

/** Rhyme & Rhythm Pond: each round has 6 rhyme puzzles: { target: [word, pic], match: [word, pic], others: [[word, pic], [word, pic]] }. */
export const RHYME_SETS = [
  {
    id: "pond-1",
    title: ["Pond 1: Classic Rhymes", "Estanque 1: Rimas clásicas"],
    items: [
      { target: ["cat", "🐈"], match: ["hat", "👒"], others: [["bus", "🚌"], ["sun", "☀️"]] },
      { target: ["dog", "🐕"], match: ["frog", "🐸"], others: [["bed", "🛏️"], ["cup", "🥤"]] },
      { target: ["bug", "🐞"], match: ["rug", "🧶"], others: [["pig", "🐖"], ["map", "🗺️"]] },
      { target: ["star", "⭐"], match: ["car", "🚗"], others: [["tree", "🌳"], ["fish", "🐟"]] },
      { target: ["bee", "🐝"], match: ["tree", "🌳"], others: [["duck", "🦆"], ["pen", "🖊️"]] },
      { target: ["fox", "🦊"], match: ["box", "📦"], others: [["milk", "🥛"], ["shoe", "👟"]] },
    ],
  },
  {
    id: "pond-2",
    title: ["Pond 2: Nature & School", "Estanque 2: Naturaleza y escuela"],
    items: [
      { target: ["cake", "🎂"], match: ["snake", "🐍"], others: [["book", "📘"], ["bird", "🐦"]] },
      { target: ["rain", "🌧️"], match: ["train", "🚂"], others: [["apple", "🍎"], ["coat", "🧥"]] },
      { target: ["boat", "⛵"], match: ["goat", "🐐"], others: [["clock", "🕒"], ["leaf", "🍃"]] },
      { target: ["house", "🏠"], match: ["mouse", "🐭"], others: [["drum", "🥁"], ["seed", "🌰"]] },
      { target: ["moon", "🌙"], match: ["spoon", "🥄"], others: [["crab", "🦀"], ["tent", "⛺"]] },
      { target: ["bear", "🐻"], match: ["chair", "🪑"], others: [["kite", "🪁"], ["soap", "🧼"]] },
    ],
  },
];

/** Clap the Beats: [word, syllableCount (1|2|3), pic, syllableBreakdown]. */
export const SYLLABLE_WORDS = [
  ["sun", 1, "☀️", "sun"],
  ["apple", 2, "🍎", "ap · ple"],
  ["butterfly", 3, "🦋", "but · ter · fly"],
  ["fish", 1, "🐟", "fish"],
  ["rabbit", 2, "🐇", "rab · bit"],
  ["banana", 3, "🍌", "ba · na · na"],
  ["tree", 1, "🌳", "tree"],
  ["pencil", 2, "✏️", "pen · cil"],
  ["umbrella", 3, "☂️", "um · brel · la"],
  ["cat", 1, "🐈", "cat"],
  ["flower", 2, "🌼", "flow · er"],
  ["elephant", 3, "🐘", "el · e · phant"],
];

/** High-frequency sight words by band: [word, sentenceEn, sentenceEs]. */
export const SIGHT_WORDS = {
  K: [
    ["the", "The sun is bright.", "El sol brilla."],
    ["I", "I see a red bird.", "Veo un pájaro rojo."],
    ["see", "I see three seeds.", "Veo tres semillas."],
    ["a", "She has a blue backpack.", "Ella tiene una mochila azul."],
    ["and", "Mia and Grandpa walk.", "Mia y su abuelo caminan."],
    ["we", "We share our books.", "Compartimos nuestros libros."],
    ["is", "The flower is yellow.", "La flor es amarilla."],
    ["it", "It is raining outside.", "Está lloviendo afuera."],
    ["in", "The frog is in the pond.", "La rana está en el estanque."],
    ["to", "We walk to school.", "Caminamos a la escuela."],
    ["go", "Let us go to the park.", "Vamos al parque."],
    ["my", "This is my favorite crayon.", "Este es mi crayón favorito."],
    ["you", "Can you count the apples?", "¿Puedes contar las manzanas?"],
    ["can", "I can draw a triangle.", "Puedo dibujar un triángulo."],
    ["like", "I like sweet grapes.", "Me gustan las uvas dulces."],
    ["look", "Look at the tiny sprout!", "¡Mira el brote pequeñito!"],
  ],
  1: [
    ["have", "We have five red tomatoes.", "Tenemos cinco tomates rojos."],
    ["they", "They play on the swings.", "Ellos juegan en los columpios."],
    ["she", "She reads a picture book.", "Ella lee un libro ilustrado."],
    ["he", "He wears a warm coat.", "Él usa un abrigo calientito."],
    ["with", "I paint with my friend.", "Pinto con mi amigo."],
    ["this", "This leaf is green.", "Esta hoja es verde."],
    ["what", "What do you observe?", "¿Qué observas?"],
    ["where", "Where is the lost mitten?", "¿Dónde está el guante perdido?"],
    ["here", "Here is the library card.", "Aquí está la tarjeta de la biblioteca."],
    ["said", "Grandpa said, look at the rain!", "El abuelo dijo: ¡mira la lluvia!"],
    ["was", "The puppy was very happy.", "El perrito estaba muy feliz."],
    ["are", "There are four seasons.", "Hay cuatro estaciones."],
    ["from", "Seeds grow from water and sun.", "Las semillas crecen con agua y sol."],
    ["one", "One little seed sprouted first.", "Una semillita brotó primero."],
    ["two", "I see two yellow ducks.", "Veo dos patos amarillos."],
    ["some", "Would you like some water?", "¿Quieres un poco de agua?"],
  ],
  "2-3": [
    ["because", "Plants grow because they get sunlight.", "Las plantas crecen porque reciben luz del sol."],
    ["first", "First, we plant the seed in soil.", "Primero, plantamos la semilla en la tierra."],
    ["next", "Next, we water the garden.", "Después, regamos el huerto."],
    ["about", "Tell me about your favorite animal.", "Cuéntame sobre tu animal favorito."],
    ["could", "We could sort the shapes by sides.", "Podríamos ordenar las figuras por lados."],
    ["would", "I would share my snack with a friend.", "Yo compartiría mi merienda con un amigo."],
    ["their", "The birds build their nest.", "Los pájaros construyen su nido."],
    ["these", "These triangles have three corners.", "Estos triángulos tienen tres esquinas."],
    ["around", "We see math shapes all around us.", "Vemos figuras matemáticas a nuestro alrededor."],
    ["every", "Every helper makes our town better.", "Cada ayudante hace mejor nuestro vecindario."],
    ["always", "We always wash our hands before eating.", "Siempre nos lavamos las manos antes de comer."],
    ["different", "Each season has different weather.", "Cada estación tiene un tiempo diferente."],
    ["together", "We solve the puzzle together.", "Resolvemos el rompecabezas juntos."],
    ["important", "Water is important for all living things.", "El agua es importante para todos los seres vivos."],
    ["question", "Ask a question about the story.", "Haz una pregunta sobre el cuento."],
    ["measure", "We can measure the pencil with cubes.", "Podemos medir el lápiz con cubos."],
  ],
};

/** Sentence & Story Maker: scenes + who / action / where tiles. */
export const SENTENCE_SCENES = [
  {
    id: "garden",
    title: ["Science Garden", "Huerto de ciencias"],
    subject: ["Science", "Ciencias"],
    who: [
      ["Mia", "Mia", "👧"],
      ["Grandpa", "El abuelo", "👴"],
      ["A green frog", "Una rana verde", "🐸"],
      ["The busy bee", "La abeja trabajadora", "🐝"],
    ],
    action: [
      ["waters", "riega", "💧"],
      ["observes", "observa", "🔍"],
      ["counts", "cuenta", "🔢"],
      ["plants", "planta", "🌱"],
    ],
    where: [
      ["three red tomatoes.", "tres tomates rojos.", "🍅"],
      ["a yellow flower.", "una flor amarilla.", "🌼"],
      ["tiny green sprouts.", "brotes verdes pequeñitos.", "🌿"],
      ["in the warm sun.", "bajo el sol calientito.", "☀️"],
    ],
  },
  {
    id: "classroom",
    title: ["Classroom & Math", "Salón y matemáticas"],
    subject: ["Math", "Matemáticas"],
    who: [
      ["My friend", "Mi amigo", "🧒"],
      ["The teacher", "La maestra", "👩‍🏫"],
      ["Our class", "Nuestra clase", "🏫"],
      ["Leo", "Leo", "👦"],
    ],
    action: [
      ["counts", "cuenta", "🔢"],
      ["measures", "mide", "📏"],
      ["draws", "dibuja", "✏️"],
      ["shares", "comparte", "🤝"],
    ],
    where: [
      ["five blue squares.", "cinco cuadrados azules.", "🟦"],
      ["a long yellow pencil.", "un lápiz amarillo largo.", "✏️"],
      ["a picture book.", "un libro ilustrado.", "📘"],
      ["at the math table.", "en la mesa de matemáticas.", "🪑"],
    ],
  },
  {
    id: "playground",
    title: ["Park & Friends", "Parque y amigos"],
    subject: ["Community", "Comunidad"],
    who: [
      ["Two friends", "Dos amigos", "👫"],
      ["A little dog", "Un perrito", "🐕"],
      ["The red bird", "El pájaro rojo", "🐦"],
      ["We", "Nosotros", "😊"],
    ],
    action: [
      ["play", "juegan", "⚽"],
      ["jump", "saltan", "🦘"],
      ["run", "corren", "🏃"],
      ["sing", "cantan", "🎵"],
    ],
    where: [
      ["near the big tree.", "cerca del árbol grande.", "🌳"],
      ["under the rainbow.", "debajo del arcoíris.", "🌈"],
      ["on the green grass.", "sobre el pasto verde.", "🌿"],
      ["after the rain.", "después de la lluvia.", "🌧️"],
    ],
  },
  {
    id: "snow-day",
    title: ["Winter Weather", "Tiempo de invierno"],
    subject: ["Science", "Ciencias"],
    who: [
      ["The rabbit", "El conejo", "🐇"],
      ["My sister", "Mi hermana", "👧"],
      ["A snowy owl", "Un búho nevado", "🦉"],
      ["We", "Nosotros", "🧤"],
    ],
    action: [
      ["finds", "encuentra", "🔍"],
      ["wears", "usa", "🧥"],
      ["watches", "mira", "👀"],
      ["follows", "sigue", "🐾"],
    ],
    where: [
      ["a warm red mitten.", "un guante rojo calientito.", "🧤"],
      ["soft white snow.", "nieve blanca y suave.", "❄️"],
      ["tiny tracks in the park.", "huellas pequeñitas en el parque.", "🐾"],
      ["with cozy boots.", "con botas abrigadoras.", "🥾"],
    ],
  },
];

/**
 * Wonder Worlds: Cross-curricular K–2 studio connecting Listening, Reading, Speaking, and Writing
 * across Science, Math, Community (Social Studies), and Arts & Music.
 */
export const DISCOVER_WORLDS = [
  {
    id: "science",
    icon: "worlds",
    color: "science",
    title: ["Science & Nature Lab", "Laboratorio de ciencias y naturaleza"],
    tagline: [
      "Observe plants, weather, and animals — and talk like a scientist.",
      "Observa plantas, el tiempo y animales, y habla como un científico.",
    ],
    miniIcon: "🌱",
    missions: [
      {
        id: "sci-plants",
        scene: "plant-parts",
        title: ["What a Plant Needs", "Lo que necesita una planta"],
        listenEn: "Every green plant has roots in the soil, a tall stem, and leaves. Roots drink water, and leaves catch sunlight to grow.",
        listenEs: "Cada planta verde tiene raíces en la tierra, un tallo alto y hojas. Las raíces toman agua y las hojas atrapan la luz del sol para crecer.",
        question: ["Which part of the plant drinks water from the soil?", "¿Qué parte de la planta toma agua de la tierra?"],
        choices: [
          { id: "roots", label: ["Roots", "Raíces"], pic: "🌱", right: true },
          { id: "hat", label: ["A sun hat", "Un sombrero"], pic: "👒", right: false },
          { id: "bus", label: ["A school bus", "Un autobús"], pic: "🚌", right: false },
        ],
        speakPrompt: ["Say what a plant needs: A plant needs ___ and ___ to grow.", "Di qué necesita una planta: Una planta necesita ___ y ___ para crecer."],
        writeTask: ["Draw a flower. Label the roots, stem, leaf, and flower.", "Dibuja una flor. Escribe las palabras raíz, tallo, hoja y flor."],
      },
      {
        id: "sci-weather",
        scene: "park-rain",
        title: ["Weather Watchers", "Observadores del tiempo"],
        listenEn: "When dark clouds fill the sky, rain falls down. Puddles form on the sidewalk, and worms come out on the wet grass.",
        listenEs: "Cuando nubes oscuras llenan el cielo, cae la lluvia. Se forman charcos en la banqueta y salen gusanos en el pasto mojado.",
        question: ["What should you wear on a rainy walk?", "¿Qué debes usar en un paseo bajo la lluvia?"],
        choices: [
          { id: "boots", label: ["Rain boots and coat", "Botas y abrigo de lluvia"], pic: "🥾", right: true },
          { id: "swim", label: ["Sunglasses only", "Solo lentes de sol"], pic: "🕶️", right: false },
          { id: "cake", label: ["A birthday cake", "Un pastel"], pic: "🎂", right: false },
        ],
        speakPrompt: ["Look outside today. Say: Today the weather is ___.", "Mira afuera hoy. Di: Hoy el tiempo está ___."],
        writeTask: ["Draw today's sky and write one weather word underneath.", "Dibuja el cielo de hoy y escribe una palabra del tiempo debajo."],
      },
    ],
  },
  {
    id: "math",
    icon: "grid",
    color: "math",
    title: ["Math Talk Studio", "Estudio de conversación matemática"],
    tagline: [
      "Count, compare shapes, and explain your math thinking out loud.",
      "Cuenta, compara figuras y explica tus ideas de matemáticas en voz alta.",
    ],
    miniIcon: "🔺",
    missions: [
      {
        id: "math-apples",
        scene: "apples-count",
        title: ["Count & Compare", "Contar y comparar"],
        listenEn: "Mia picked four red apples and two green apples for her basket. Four is greater than two. Altogether she has six apples!",
        listenEs: "Mia recogió cuatro manzanas rojas y dos manzanas verdes para su canasta. Cuatro es mayor que dos. ¡En total tiene seis manzanas!",
        question: ["How many apples does Mia have altogether?", "¿Cuántas manzanas tiene Mia en total?"],
        choices: [
          { id: "six", label: ["6 apples", "6 manzanas"], pic: "🍎", right: true },
          { id: "two", label: ["2 apples", "2 manzanas"], pic: "🍏", right: false },
          { id: "ten", label: ["10 bananas", "10 plátanos"], pic: "🍌", right: false },
        ],
        speakPrompt: ["Tell how you know: Four plus two equals ___.", "Cuenta cómo lo sabes: Cuatro más dos es igual a ___."],
        writeTask: ["Draw 4 red circles and 2 green circles. Write the number 6.", "Dibuja 4 círculos rojos y 2 círculos verdes. Escribe el número 6."],
      },
      {
        id: "math-shapes",
        scene: "shapes-table",
        title: ["Shapes Around Us", "Figuras a nuestro alrededor"],
        listenEn: "Look at the table! A triangle has three straight sides and three corners. A circle is round with zero corners.",
        listenEs: "¡Mira la mesa! Un triángulo tiene tres lados rectos y tres esquinas. Un círculo es redondo y tiene cero esquinas.",
        question: ["Which shape has three sides and three corners?", "¿Qué figura tiene tres lados y tres esquinas?"],
        choices: [
          { id: "tri", label: ["Triangle", "Triángulo"], pic: "🔺", right: true },
          { id: "circle", label: ["Circle", "Círculo"], pic: "⭕", right: false },
          { id: "star", label: ["Cloud", "Nube"], pic: "☁️", right: false },
        ],
        speakPrompt: ["Find one shape in your room. Say: I see a ___ shaped like a ___.", "Busca una figura en tu cuarto. Di: Veo un ___ con forma de ___."],
        writeTask: ["Draw a house using one square and one triangle on top.", "Dibuja una casa usando un cuadrado y un triángulo arriba."],
      },
    ],
  },
  {
    id: "community",
    icon: "families",
    color: "community",
    title: ["Our Community & World", "Nuestra comunidad y mundo"],
    tagline: [
      "Meet neighborhood helpers, read simple maps, and share family stories.",
      "Conoce a los ayudantes del vecindario, lee mapas simples y comparte historias.",
    ],
    miniIcon: "🏫",
    missions: [
      {
        id: "comm-helpers",
        scene: "mail-carrier",
        title: ["Neighborhood Helpers", "Ayudantes del vecindario"],
        listenEn: "Every morning, helpers keep our neighborhood running. The mail carrier brings letters, the librarian helps us find books, and the crossing guard keeps us safe.",
        listenEs: "Cada mañana, los ayudantes mantienen funcionando nuestro vecindario. El cartero trae cartas, la bibliotecaria ayuda a buscar libros y el guardia escolar nos cuida al cruzar.",
        question: ["Who helps us borrow books to read at home?", "¿Quién nos ayuda a pedir libros prestados para leer en casa?"],
        choices: [
          { id: "lib", label: ["Librarian", "Bibliotecaria"], pic: "📚", right: true },
          { id: "drum", label: ["Drummer", "Tamborilero"], pic: "🥁", right: false },
          { id: "frog", label: ["A frog", "Una rana"], pic: "🐸", right: false },
        ],
        speakPrompt: ["Say thank you to a helper: A ___ helps our community by ___.", "Agradece a un ayudante: Un ___ ayuda a nuestra comunidad al ___."],
        writeTask: ["Draw a helper in your neighborhood and write their job.", "Dibuja a un ayudante de tu vecindario y escribe su trabajo."],
      },
      {
        id: "comm-crosswalk",
        scene: "crosswalk",
        title: ["Safe Streets & Maps", "Calles seguras y mapas"],
        listenEn: "Before we cross the street at the corner, we stop, look left, look right, and walk across with a grown-up.",
        listenEs: "Antes de cruzar la calle en la esquina, nos detenemos, miramos a la izquierda, miramos a la derecha y caminamos con un adulto.",
        question: ["What do we do first at the crosswalk?", "¿Qué hacemos primero en el cruce peatonal?"],
        choices: [
          { id: "stop", label: ["Stop and look both ways", "Parar y mirar a ambos lados"], pic: "🛑", right: true },
          { id: "run", label: ["Run fast without looking", "Correr rápido sin mirar"], pic: "🏃", right: false },
          { id: "sleep", label: ["Take a nap", "Tomar una siesta"], pic: "😴", right: false },
        ],
        speakPrompt: ["Explain the rule: First we ___, then we ___.", "Explica la regla: Primero ___, después ___."],
        writeTask: ["Draw a map from your door to a favorite place nearby.", "Dibuja un mapa desde tu puerta hasta un lugar favorito cercano."],
      },
    ],
  },
  {
    id: "arts",
    icon: "sparkle",
    color: "arts",
    title: ["Arts, Music & Movement", "Arte, música y movimiento"],
    tagline: [
      "Explore colors, rhythm, and storytelling through music and art.",
      "Explora colores, ritmo e historias a través de la música y el arte.",
    ],
    miniIcon: "🎨",
    missions: [
      {
        id: "arts-colors",
        scene: "classroom",
        title: ["Mixing Colors", "Mezclando colores"],
        listenEn: "In art class, we mix primary colors to make new ones! Red and yellow make orange. Blue and yellow make green.",
        listenEs: "¡En la clase de arte mezclamos colores primarios para hacer otros nuevos! Rojo y amarillo hacen naranja. Azul y amarillo hacen verde.",
        question: ["What color do blue and yellow make together?", "¿Qué color forman el azul y el amarillo juntos?"],
        choices: [
          { id: "green", label: ["Green", "Verde"], pic: "🟢", right: true },
          { id: "black", label: ["Black", "Negro"], pic: "⚫", right: false },
          { id: "white", label: ["White", "Blanco"], pic: "⚪", right: false },
        ],
        speakPrompt: ["Tell about your favorite color: My favorite color is ___ because ___.", "Habla de tu color favorito: Mi color favorito es ___ porque ___."],
        writeTask: ["Paint or color a rainbow and name three colors you used.", "Pinta o colorea un arcoíris y nombra tres colores que usaste."],
      },
      {
        id: "arts-rhythm",
        scene: "jump-rope",
        title: ["Move to the Beat", "Muévete al ritmo"],
        listenEn: "Music has a steady beat like a drum: tap, tap, tap! When we clap syllables or jump rope, our bodies follow the rhythm.",
        listenEs: "La música tiene un ritmo constante como un tambor: ¡tap, tap, tap! Cuando aplaudimos sílabas o saltamos la cuerda, seguimos el ritmo.",
        question: ["Which instrument makes a steady beat you can tap?", "¿Qué instrumento hace un ritmo que puedes golpear suave?"],
        choices: [
          { id: "drum", label: ["A drum", "Un tambor"], pic: "🥁", right: true },
          { id: "carrot", label: ["A carrot", "Una zanahoria"], pic: "🥕", right: false },
          { id: "pillow", label: ["A pillow", "Una almohada"], pic: "🛏️", right: false },
        ],
        speakPrompt: ["Clap your name's beats and say: My name has ___ beats!", "Aplaude los golpes de tu nombre y di: ¡Mi nombre tiene ___ golpes!"],
        writeTask: ["Draw your favorite musical instrument and write its name.", "Dibuja tu instrumento musical favorito y escribe su nombre."],
      },
    ],
  },
];
