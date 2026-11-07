// Kindergarten band: a few short, adult-hosted picture activities that sit beside Story Time
// (access-practice-lab/src/early/story.js). Kindergarten practice is done with a grown-up: the player reads every
// direction aloud, the child points or taps, and writing is drawing plus one copied word on paper.
// Built by tools/build-access-early-content.mjs. Field list: see g23.mjs.

const v = (en, def, es) => [en, def, es];
const GROWN = {
  use: "With a grown-up beside the child. The grown-up may tap the speaker, point, and repeat; the child answers by pointing or saying a word.",
};

const listening = {
  description: "Listen with a grown-up. Point to or tap the picture you hear.",
  goals: {
    A: [
      "I can listen and point to a picture.",
      "One word or one short sentence, read aloud by the device or a grown-up.",
    ],
  },
  activities: [
    {
      id: "gk-l-a-find-seed",
      level: "A",
      title: "Find the Seed",
      skill: "Listening for a garden word",
      teacher: GROWN,
      dir: ["Listen. Point to the seed.", "Escucha. Señala la semilla."],
      script: "Point to the seed.",
      q: ["Which one is the seed?", "¿Cuál es la semilla?"],
      options: [
        ["a", "seed", "🌰"],
        ["b", "flower", "🌼"],
        ["c", "sun", "☀️"],
      ],
      answer: "a",
      vocab: [
        v("seed", "a tiny thing a plant grows from", "semilla: cosita de la que crece una planta"),
        v("point", "to show with your finger", "señalar: mostrar con el dedo"),
      ],
      frame: "This is the ___.",
      correct: "That is the seed.",
      wida: ["Identify a named object from oral input"],
    },
    {
      id: "gk-l-a-rain-or-sun",
      level: "A",
      title: "Rain or Sun?",
      skill: "Listening for a weather word",
      teacher: GROWN,
      dir: ["Listen. Tap the weather you hear.", "Escucha. Toca el tiempo que oyes."],
      script: "Drip, drop. It is raining.",
      q: ["What is the weather?", "¿Cómo está el tiempo?"],
      options: [
        ["a", "sun", "☀️"],
        ["b", "rain", "🌧️"],
      ],
      answer: "b",
      vocab: [
        v("rain", "water falling from the sky", "lluvia: agua que cae del cielo"),
        v("sun", "the bright light in the sky", "sol: la luz brillante del cielo"),
      ],
      frame: "It is ___.",
      correct: "Drip, drop is rain.",
      wida: ["Identify a weather word from oral input"],
    },
    {
      id: "gk-l-a-garden-bird",
      level: "A",
      title: "Who Says Tweet?",
      skill: "Listening for an animal sound",
      teacher: GROWN,
      dir: ["Listen. Tap the animal that says tweet.", "Escucha. Toca el animal que dice tuit."],
      script: "Tweet, tweet! A bird sings in the garden.",
      q: ["Which animal says tweet?", "¿Qué animal dice tuit?"],
      options: [
        ["a", "cow", "🐄"],
        ["b", "bird", "🐦"],
        ["c", "frog", "🐸"],
      ],
      answer: "b",
      vocab: [
        v("bird", "an animal with feathers and wings", "pájaro: animal con plumas y alas"),
        v("sing", "to make music with your voice", "cantar: hacer música con la voz"),
      ],
      frame: "The ___ says tweet.",
      correct: "The bird says tweet.",
      wida: ["Identify an animal from an oral clue"],
    },
  ],
};

const reading = {
  description:
    "Look at letters and pictures with a grown-up. Tap the picture that starts with the sound.",
  goals: {
    A: [
      "I can match a letter sound to a picture.",
      "First sounds, read aloud by the device or a grown-up.",
    ],
  },
  activities: [
    {
      id: "gk-r-a-sound-s",
      level: "A",
      title: "Starts with S",
      skill: "Matching a first sound to a picture",
      teacher: GROWN,
      dir: [
        "Listen to the sound sss. Tap the picture that starts with sss.",
        "Escucha el sonido sss. Toca el dibujo que empieza con sss.",
      ],
      passage: ["S s"],
      q: ["What starts with sss?", "¿Qué empieza con sss?"],
      options: [
        ["a", "sun", "☀️"],
        ["b", "moon", "🌙"],
        ["c", "apple", "🍎"],
      ],
      answer: "a",
      vocab: [
        v("sound", "what you hear", "sonido: lo que oyes"),
        v("letter", "a mark we use to write words", "letra: signo que usamos para escribir"),
      ],
      frame: "___ starts with S.",
      correct: "Sss, sun!",
      wida: ["Connect a letter sound to a word"],
    },
    {
      id: "gk-r-a-sound-m",
      level: "A",
      title: "Starts with M",
      skill: "Matching a first sound to a picture",
      teacher: GROWN,
      dir: [
        "Listen to the sound mmm. Tap the picture that starts with mmm.",
        "Escucha el sonido mmm. Toca el dibujo que empieza con mmm.",
      ],
      passage: ["M m"],
      q: ["What starts with mmm?", "¿Qué empieza con mmm?"],
      options: [
        ["a", "dog", "🐕"],
        ["b", "milk", "🥛"],
        ["c", "tree", "🌳"],
      ],
      answer: "b",
      vocab: [
        v("milk", "a white drink", "leche: bebida blanca"),
        v("start", "the beginning", "empezar: el comienzo"),
      ],
      frame: "___ starts with M.",
      correct: "Mmm, milk!",
      wida: ["Connect a letter sound to a word"],
    },
  ],
};

const speaking = {
  description: "Look at a picture with a grown-up. Hear a friend, then say a word or a sentence.",
  goals: { A: ["I can say a word about a picture.", "Talk task 1: name what you see."] },
  activities: [
    {
      id: "gk-s-a-garden-see",
      level: "A",
      taskLevel: 1,
      title: "What Do You See?",
      skill: "Naming something in a picture",
      scene: "garden",
      teacher: GROWN,
      dir: ["Look at the garden. Say one thing you see.", "Mira el huerto. Di una cosa que ves."],
      q: ["What do you see?", "¿Qué ves?"],
      model: ["Lina, age 5", "A flower!"],
      sayFor: ["I said a word.", "I pointed to it."],
      vocab: [
        v(
          "flower",
          "the pretty colored part of a plant",
          "flor: la parte bonita y de color de una planta",
        ),
        v("see", "to look with your eyes", "ver: mirar con los ojos"),
      ],
      frame: "I see ___.",
      correct: "You named something you see.",
      wida: ["Name an object in an image"],
    },
    {
      id: "gk-s-a-weather-say",
      level: "A",
      taskLevel: 1,
      title: "Say the Weather",
      skill: "Saying a weather word",
      scene: "park-rain",
      teacher: GROWN,
      dir: [
        "Look at the picture. Is it sunny or rainy? Say it.",
        "Mira el dibujo. ¿Hay sol o llueve? Dilo.",
      ],
      q: ["What is the weather?", "¿Cómo está el tiempo?"],
      model: ["Lina, age 5", "It is rainy."],
      sayFor: ["I said the weather."],
      vocab: [
        v("rainy", "with rain falling", "lluvioso: con lluvia"),
        v("sunny", "with the sun out", "soleado: con sol"),
      ],
      frame: "It is ___.",
      correct: "You said the weather.",
      wida: ["Name the weather in an image"],
    },
    {
      id: "gk-s-a-share-what",
      level: "A",
      taskLevel: 1,
      title: "What Would You Share?",
      skill: "Saying a word to answer a question",
      scene: "garden-share",
      teacher: GROWN,
      dir: [
        "Look at the neighbors sharing. What would you share with a friend? Say it.",
        "Mira a los vecinos que comparten. ¿Qué compartirías con un amigo? Dilo.",
      ],
      q: ["What would you share?", "¿Qué compartirías?"],
      model: ["Lina, age 5", "My crayons."],
      sayFor: ["I answered the question."],
      vocab: [
        v("share", "to give some to others", "compartir: dar un poco a otros"),
        v("friend", "a person you like to be with", "amigo: persona con quien te gusta estar"),
      ],
      frame: "I would share ___.",
      correct: "Sharing is kind.",
      wida: ["Answer a question about a personal choice"],
    },
  ],
};

const writing = {
  description: "Print a page. Draw a picture and copy one word with a grown-up.",
  goals: { A: ["I can draw and copy a word.", "Draw first; copy one word from the word bank."] },
  activities: [
    {
      id: "gk-w-a-draw-garden",
      level: "A",
      title: "Draw a Garden",
      skill: "Drawing and copying a label",
      scene: "garden",
      teacher: GROWN,
      dir: [
        "Print your page. Draw a plant. Copy the word plant.",
        "Imprime tu página. Dibuja una planta. Copia la palabra plant.",
      ],
      q: ["Draw a plant and copy the word.", "Dibuja una planta y copia la palabra."],
      bank: ["plant"],
      writeFor: ["I drew a plant.", "I copied the word."],
      lines: 2,
      vocab: [
        v("plant", "a green living thing that grows", "planta: ser vivo verde que crece"),
        v("copy", "to write the same thing you see", "copiar: escribir lo mismo que ves"),
      ],
      frame: "plant",
      correct: "You drew and copied a word.",
      wida: ["Copy a word to label a drawing"],
    },
    {
      id: "gk-w-a-my-name",
      level: "A",
      title: "My Name",
      skill: "Writing your own name",
      teacher: GROWN,
      dir: [
        "Print your page. Write your name. Draw yourself.",
        "Imprime tu página. Escribe tu nombre. Dibújate.",
      ],
      q: ["Write your name.", "Escribe tu nombre."],
      bank: ["name"],
      writeFor: ["I wrote my name.", "I drew me."],
      lines: 2,
      vocab: [
        v("name", "the word people call you", "nombre: la palabra con que te llaman"),
        v("draw", "to make a picture", "dibujar: hacer un dibujo"),
      ],
      frame: "My name is ___.",
      correct: "You wrote your name.",
      wida: ["Write one's own name"],
    },
  ],
};

export default {
  domains: { Listening: listening, Reading: reading, Speaking: speaking, Writing: writing },
};
