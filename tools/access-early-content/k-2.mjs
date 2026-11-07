// Kindergarten, publisher content pass: Level B for every domain plus more Level A. Adult-hosted picture and story
// activities: phonemic awareness (rhyme, syllable claps, first and last sounds), letters and sounds, oral vocabulary
// with pictures, and original chants. Built with k.mjs by tools/build-access-early-content.mjs; fields: see g23.mjs.
// Practice task labels only; taskLevel 1 = name or say a word or short sentence, never a proficiency level.

const v = (en, def, es) => [en, def, es];
const GROWN = {
  use: "With a grown-up beside the child. The grown-up may tap the speaker, point, and repeat; the child answers by pointing or saying a word.",
};
const SAY1 = ["I said a word or a short sentence.", "I looked at the picture."];

const listening = {
  goals: {
    B: [
      "I can listen for sounds, rhymes and two things.",
      "Rhymes, syllable claps, chants and short stories with two details.",
    ],
  },
  activities: [
    {
      id: "gk-l-a-feel-happy",
      level: "A",
      title: "Who Is Happy?",
      skill: "Listening for a feeling word",
      scene: "feel-happy",
      teacher: GROWN,
      dir: [
        "Listen. Tap the face that shows the feeling.",
        "Escucha. Toca la cara que muestra el sentimiento.",
      ],
      script: "Mia has three balloons. She smiles big. Mia is happy!",
      q: ["How does Mia feel?", "¿Cómo se siente Mia?"],
      options: [
        ["a", "sad", "😢"],
        ["b", "happy", "😊"],
        ["c", "sleepy", "😴"],
      ],
      answer: "b",
      vocab: [
        v("happy", "feeling good and glad", "feliz: sentirse bien y contento"),
        v("balloon", "a round toy filled with air", "globo: juguete redondo lleno de aire"),
      ],
      frame: "Mia is ___.",
      correct: "Mia smiles. She is happy.",
      wida: ["Identify a feeling word from oral input"],
    },
    {
      id: "gk-l-a-wash-hands",
      level: "A",
      title: "Wash Your Hands",
      skill: "Listening for a health helper",
      scene: "handwash",
      teacher: GROWN,
      dir: [
        "Listen. Tap what helps you clean your hands.",
        "Escucha. Toca lo que te ayuda a limpiarte las manos.",
      ],
      script:
        "Wash, wash, wash your hands. Use water and soap. Rub, rub, rub. Now your hands are clean!",
      q: ["What do we use to wash our hands?", "¿Qué usamos para lavarnos las manos?"],
      options: [
        ["a", "a ball", "⚽"],
        ["b", "soap", "🧼"],
        ["c", "a shoe", "👟"],
      ],
      answer: "b",
      vocab: [
        v(
          "soap",
          "what you rub on your hands to clean them",
          "jabón: lo que frotas en las manos para limpiarlas",
        ),
        v("clean", "not dirty", "limpio: que no está sucio"),
      ],
      frame: "We wash with water and ___.",
      correct: "Soap and water make hands clean.",
      wida: ["Identify an object from a short oral routine"],
    },
    {
      id: "gk-l-b-rhyme-cat",
      level: "B",
      title: "What Rhymes with Cat?",
      skill: "Listening for a rhyming word",
      teacher: GROWN,
      dir: ["Listen. Tap the picture that rhymes.", "Escucha. Toca el dibujo que rima."],
      script:
        "Words that rhyme sound the same at the end. Cat, hat. Now listen. Which one rhymes with cat: hat, dog, or sun?",
      q: ["Which picture rhymes with cat?", "¿Qué dibujo rima con cat?"],
      options: [
        ["a", "dog", "🐕"],
        ["b", "sun", "☀️"],
        ["c", "hat", "🎩"],
      ],
      answer: "c",
      vocab: [
        v(
          "rhyme",
          "words that sound the same at the end",
          "rima: palabras que suenan igual al final",
        ),
        v("hat", "something you wear on your head", "sombrero: algo que te pones en la cabeza"),
      ],
      frame: "Cat and ___ rhyme.",
      correct: "Cat and hat rhyme. They end with the same sound.",
      wida: ["Identify rhyming words from oral input"],
    },
    {
      id: "gk-l-b-clap-banana",
      level: "B",
      title: "Clap the Parts",
      skill: "Counting the parts of a word",
      teacher: GROWN,
      dir: [
        "Listen. Clap for each part of the word. Tap how many claps.",
        "Escucha. Aplaude cada parte de la palabra. Toca cuántos aplausos.",
      ],
      script:
        "Clap with me. Ba, na, na. Banana has parts. Clap, clap, clap. How many claps did we make?",
      q: ["How many claps for banana?", "¿Cuántos aplausos para banana?"],
      options: [
        ["a", "one clap", "👏"],
        ["b", "two claps", "👏"],
        ["c", "three claps", "👏"],
      ],
      answer: "c",
      vocab: [
        v("clap", "to hit your hands together", "aplaudir: golpear las manos una con otra"),
        v("part", "a small piece of something", "parte: un pedacito de algo"),
      ],
      frame: "Banana has ___ claps.",
      correct: "Ba-na-na has three parts, so three claps.",
      wida: ["Segment a spoken word into syllables"],
    },
    {
      id: "gk-l-b-bird-chant",
      level: "B",
      title: "The Bird Chant",
      skill: "Listening to a chant for a count",
      teacher: GROWN,
      scene: "pond-life",
      dir: [
        "Listen to the chant. Tap what the chant is about.",
        "Escucha la rima. Toca de qué trata.",
      ],
      script:
        "Quack, quack, down the lane. Splash, splash, in the rain. One yellow duck swims, swims, swims. Quack, quack, here it comes!",
      q: ["Which animal is in the chant?", "¿Qué animal está en la rima?"],
      options: [
        ["a", "duck", "🦆"],
        ["b", "cow", "🐄"],
        ["c", "pig", "🐖"],
      ],
      answer: "a",
      vocab: [
        v("duck", "a bird that swims and says quack", "pato: ave que nada y dice cuac"),
        v("swim", "to move in water", "nadar: moverse en el agua"),
      ],
      frame: "The chant is about a ___.",
      correct: "Quack, quack. The chant is about a duck.",
      wida: ["Identify the subject of a short chant"],
    },
    {
      id: "gk-l-b-night-sky",
      level: "B",
      title: "What Max Sees at Night",
      skill: "Listening for two details",
      type: "multiSelect",
      scene: "night-moon",
      teacher: GROWN,
      dir: [
        "Listen. Tap two things Max sees. There are two answers.",
        "Escucha. Toca dos cosas que ve Max. Hay dos respuestas.",
      ],
      script:
        "It is night. Max looks out the window. He sees the round moon. He sees many stars. He does not see the sun.",
      q: ["What does Max see? Tap two.", "¿Qué ve Max? Toca dos."],
      options: [
        ["a", "the moon", "🌙"],
        ["b", "the sun", "☀️"],
        ["c", "the stars", "⭐"],
      ],
      answer: ["a", "c"],
      vocab: [
        v("night", "the dark time when we sleep", "noche: el tiempo oscuro en que dormimos"),
        v("star", "a tiny light far away in the sky", "estrella: una lucecita lejana en el cielo"),
      ],
      frame: "Max sees the ___ and the ___.",
      correct: "At night Max sees the moon and the stars.",
      wida: ["Identify two details from a short oral story"],
    },
  ],
};

const reading = {
  goals: {
    B: [
      "I can use sounds to find a word's picture.",
      "Rhymes, last sounds and short picture sentences read aloud by the device or a grown-up.",
    ],
  },
  activities: [
    {
      id: "gk-r-a-sound-f",
      level: "A",
      title: "Starts with F",
      skill: "Matching a first sound to a picture",
      teacher: GROWN,
      dir: [
        "Listen to the sound fff. Tap the picture that starts with fff.",
        "Escucha el sonido fff. Toca el dibujo que empieza con fff.",
      ],
      passage: ["F f"],
      q: ["What starts with fff?", "¿Qué empieza con fff?"],
      options: [
        ["a", "sun", "☀️"],
        ["b", "fish", "🐟"],
        ["c", "cat", "🐈"],
      ],
      answer: "b",
      vocab: [
        v(
          "fish",
          "an animal that lives and swims in water",
          "pez: animal que vive y nada en el agua",
        ),
        v(
          "letter",
          "a mark we use to write words",
          "letra: marca que usamos para escribir palabras",
        ),
      ],
      frame: "Fff, fish.",
      correct: "Fff, fish starts with F.",
      wida: ["Match a letter sound to a picture"],
    },
    {
      id: "gk-r-a-sound-b",
      level: "A",
      title: "Starts with B",
      skill: "Matching a first sound to a picture",
      teacher: GROWN,
      dir: [
        "Listen to the sound buh. Tap the picture that starts with buh.",
        "Escucha el sonido buh. Toca el dibujo que empieza con buh.",
      ],
      passage: ["B b"],
      q: ["What starts with buh?", "¿Qué empieza con buh?"],
      options: [
        ["a", "ball", "⚽"],
        ["b", "cat", "🐈"],
        ["c", "sock", "🧦"],
      ],
      answer: "a",
      vocab: [
        v("ball", "a round toy you throw or kick", "pelota: juguete redondo que lanzas o pateas"),
        v("sound", "what you hear", "sonido: lo que oyes"),
      ],
      frame: "Buh, ball.",
      correct: "Buh, ball starts with B.",
      wida: ["Match a letter sound to a picture"],
    },
    {
      id: "gk-r-b-ends-t",
      level: "B",
      title: "Ends with T",
      skill: "Matching a last sound to a picture",
      teacher: GROWN,
      dir: [
        "Listen to the end of each word. Tap the picture that ends with t.",
        "Escucha el final de cada palabra. Toca el dibujo que termina con t.",
      ],
      passage: ["t"],
      q: ["Which word ends with t?", "¿Qué palabra termina con t?"],
      options: [
        ["a", "bed", "🛏️"],
        ["b", "cat", "🐈"],
        ["c", "sun", "☀️"],
      ],
      answer: "b",
      vocab: [
        v("end", "the last part", "final: la última parte"),
        v("cat", "a pet that says meow", "gato: mascota que dice miau"),
      ],
      frame: "Cat ends with ___.",
      correct: "Ca-t. Cat ends with the t sound.",
      wida: ["Match an ending sound to a picture"],
    },
    {
      id: "gk-r-b-i-see-fish",
      level: "B",
      title: "I See a Fish",
      skill: "Reading a picture sentence",
      scene: "pond-life",
      teacher: GROWN,
      dir: [
        "Read the sentence with a grown-up. Tap the picture.",
        "Lee la oración con un adulto. Toca el dibujo.",
      ],
      passage: ["I see a fish."],
      q: ["What do I see?", "¿Qué veo?"],
      options: [
        ["a", "a bird", "🐦"],
        ["b", "a frog", "🐸"],
        ["c", "a fish", "🐟"],
      ],
      answer: "c",
      vocab: [
        v(
          "fish",
          "an animal that lives and swims in water",
          "pez: animal que vive y nada en el agua",
        ),
        v("see", "to look with your eyes", "ver: mirar con los ojos"),
      ],
      frame: "I see a ___.",
      correct: "I see a fish.",
      wida: ["Match a simple sentence to an image"],
    },
    {
      id: "gk-r-b-shape-circle",
      level: "B",
      title: "Read: circle",
      skill: "Reading a shape word",
      scene: "shapes-table",
      teacher: GROWN,
      dir: [
        "Read the word with a grown-up. Tap the shape.",
        "Lee la palabra con un adulto. Toca la figura.",
      ],
      passage: ["circle"],
      q: ["Which shape is a circle?", "¿Cuál figura es un círculo?"],
      options: [
        ["a", "triangle", "🔺"],
        ["b", "square", "🟦"],
        ["c", "circle", "🔴"],
      ],
      answer: "c",
      vocab: [
        v("circle", "a round shape with no corners", "círculo: figura redonda sin esquinas"),
        v("shape", "the form of something", "figura: la forma de algo"),
      ],
      frame: "A circle is ___.",
      correct: "A circle is round with no corners.",
      wida: ["Match a shape word to an image"],
    },
  ],
};

const speaking = {
  goals: {
    B: [
      "I can say a short sentence about a picture.",
      "Talk task 1: tell what you see or how someone feels, with a sentence starter.",
    ],
  },
  activities: [
    {
      id: "gk-s-a-feel-say",
      level: "A",
      taskLevel: 1,
      title: "How Does She Feel?",
      skill: "Saying a feeling word",
      scene: "feel-happy",
      teacher: GROWN,
      dir: [
        "Look at the picture. Say how the girl feels.",
        "Mira el dibujo. Di cómo se siente la niña.",
      ],
      q: ["How does she feel?", "¿Cómo se siente?"],
      model: ["Lina, age 5", "Happy!"],
      sayFor: ["I said a feeling word.", "I looked at her face."],
      vocab: [
        v(
          "feel",
          "what is inside you, like happy or sad",
          "sentir: lo que hay dentro de ti, como feliz o triste",
        ),
        v(
          "smile",
          "to turn your mouth up when you are glad",
          "sonreír: subir la boca cuando estás contento",
        ),
      ],
      frame: "She is ___.",
      correct: "You said how she feels.",
      wida: ["Name a feeling shown in an image"],
    },
    {
      id: "gk-s-a-pond-animal",
      level: "A",
      taskLevel: 1,
      title: "Pond Animals",
      skill: "Naming an animal in a picture",
      scene: "pond-life",
      teacher: GROWN,
      dir: ["Look at the pond. Say one animal you see.", "Mira el estanque. Di un animal que ves."],
      q: ["What animal do you see?", "¿Qué animal ves?"],
      model: ["Lina, age 5", "A duck!"],
      sayFor: SAY1,
      vocab: [
        v("pond", "a small lake", "estanque: un lago pequeño"),
        v("frog", "a green animal that hops", "rana: animal verde que salta"),
      ],
      frame: "I see a ___.",
      correct: "You named an animal in the pond.",
      wida: ["Name an animal in an image"],
    },
    {
      id: "gk-s-b-snow-day",
      level: "B",
      taskLevel: 1,
      title: "A Snowy Day",
      skill: "Telling about the weather and clothes",
      scene: "snow-day",
      teacher: GROWN,
      dir: [
        "Look at the snow. Tell what the weather is. Tell what the child has.",
        "Mira la nieve. Di cómo está el tiempo. Di qué tiene el niño.",
      ],
      q: [
        "What is the weather? What does the child have?",
        "¿Cómo está el tiempo? ¿Qué tiene el niño?",
      ],
      model: ["Amira, age 5", "It is snowing. He has a hat."],
      models: { A: "Snow. A hat.", B: "It is snowing. He has a hat." },
      sayFor: SAY1,
      vocab: [
        v(
          "snow",
          "soft white flakes of frozen water",
          "nieve: copos blancos y suaves de agua congelada",
        ),
        v("cold", "not warm", "frío: que no está caliente"),
      ],
      frame: "It is ___. He has a ___.",
      correct: "You told about the snow and the child.",
      wida: ["Describe weather and clothing in an image"],
    },
    {
      id: "gk-s-b-family-dinner",
      level: "B",
      taskLevel: 1,
      title: "Dinner with My Family",
      skill: "Telling who is in a picture",
      scene: "family-dinner",
      teacher: GROWN,
      dir: [
        "Look at the family. Tell who is at the table.",
        "Mira a la familia. Di quién está en la mesa.",
      ],
      q: ["Who is at the table?", "¿Quién está en la mesa?"],
      model: ["Mateo, age 5", "My mom and my brother eat dinner."],
      models: { A: "Mom. Brother.", B: "My mom and my brother eat dinner." },
      sayFor: SAY1,
      vocab: [
        v(
          "family",
          "the people who live and care for you",
          "familia: las personas que viven contigo y te cuidan",
        ),
        v("dinner", "the meal at night", "cena: la comida de la noche"),
      ],
      frame: "My ___ and my ___ eat dinner.",
      correct: "You told who is at the table.",
      wida: ["Name family members in an image"],
    },
    {
      id: "gk-s-b-count-apples",
      level: "B",
      taskLevel: 1,
      title: "Count the Apples",
      skill: "Saying a number to tell how many",
      scene: "apples-count",
      teacher: GROWN,
      dir: [
        "Look at the apples. Count the apples in the left basket. Say the number.",
        "Mira las manzanas. Cuenta las manzanas de la canasta izquierda. Di el número.",
      ],
      q: [
        "How many apples are in the left basket?",
        "¿Cuántas manzanas hay en la canasta izquierda?",
      ],
      model: ["Lina, age 5", "I see five apples."],
      models: { A: "Five.", B: "I see five apples." },
      sayFor: ["I counted out loud.", "I said the number."],
      vocab: [
        v("count", "to say numbers in order", "contar: decir los números en orden"),
        v("basket", "a container for carrying things", "canasta: recipiente para llevar cosas"),
      ],
      frame: "I see ___ apples.",
      correct: "You counted and said how many.",
      wida: ["State a quantity from an image"],
    },
  ],
};

const writing = {
  goals: {
    B: [
      "I can draw and write a word or two.",
      "Draw first; copy a sentence starter and a word from the word bank.",
    ],
  },
  activities: [
    {
      id: "gk-w-a-draw-sun",
      level: "A",
      title: "Draw the Sun",
      skill: "Drawing and copying a label",
      scene: "wind-kite",
      teacher: GROWN,
      dir: [
        "Print your page. Draw the sun. Copy the word sun.",
        "Imprime tu página. Dibuja el sol. Copia la palabra sun.",
      ],
      q: ["Draw the sun and copy the word.", "Dibuja el sol y copia la palabra."],
      bank: ["sun"],
      writeFor: ["I drew the sun.", "I copied the word."],
      lines: 2,
      vocab: [
        v(
          "sun",
          "the bright light in the sky in the day",
          "sol: la luz brillante del cielo de día",
        ),
        v("draw", "to make a picture", "dibujar: hacer un dibujo"),
      ],
      frame: "sun",
      correct: "You drew and copied a word.",
      wida: ["Copy a word to label a drawing"],
    },
    {
      id: "gk-w-a-my-family",
      level: "A",
      title: "My Family",
      skill: "Drawing and labeling a person",
      teacher: GROWN,
      dir: [
        "Print your page. Draw someone in your family. Copy the word.",
        "Imprime tu página. Dibuja a alguien de tu familia. Copia la palabra.",
      ],
      q: ["Draw a person in your family.", "Dibuja a una persona de tu familia."],
      bank: ["mom", "dad", "me"],
      writeFor: ["I drew a person.", "I copied one word."],
      lines: 2,
      vocab: [
        v("family", "the people who care for you", "familia: las personas que te cuidan"),
        v("copy", "to write the same thing you see", "copiar: escribir lo mismo que ves"),
      ],
      frame: "mom",
      correct: "You drew and labeled someone in your family.",
      wida: ["Label a drawing of a family member"],
    },
    {
      id: "gk-w-b-i-see-pond",
      level: "B",
      title: "I See a Duck",
      skill: "Copying a sentence about a picture",
      scene: "pond-life",
      teacher: GROWN,
      dir: [
        "Print your page. Look at the pond. Copy: I see a. Then copy an animal word.",
        "Imprime tu página. Mira el estanque. Copia: I see a. Luego copia el nombre de un animal.",
      ],
      q: ["What animal do you see?", "¿Qué animal ves?"],
      bank: ["duck", "frog", "fish"],
      writeFor: ["I copied I see a.", "I copied an animal word."],
      lines: 3,
      vocab: [
        v("duck", "a bird that swims", "pato: ave que nada"),
        v("frog", "a green animal that hops", "rana: animal verde que salta"),
      ],
      frame: "I see a ___.",
      correct: "You wrote about the pond.",
      wida: ["Copy and complete a sentence about an image"],
    },
    {
      id: "gk-w-b-i-feel",
      level: "B",
      title: "I Feel Happy",
      skill: "Copying a feeling sentence",
      scene: "feel-sad",
      teacher: GROWN,
      dir: [
        "Print your page. Draw your face. Copy: I feel. Then copy a feeling word.",
        "Imprime tu página. Dibuja tu cara. Copia: I feel. Luego copia una palabra de sentimiento.",
      ],
      q: ["How do you feel?", "¿Cómo te sientes?"],
      bank: ["happy", "sad", "sleepy"],
      writeFor: ["I drew my face.", "I copied I feel and a word."],
      lines: 3,
      vocab: [
        v(
          "feel",
          "what is inside you, like happy or sad",
          "sentir: lo que hay dentro de ti, como feliz o triste",
        ),
        v("sleepy", "ready to sleep", "con sueño: listo para dormir"),
      ],
      frame: "I feel ___.",
      correct: "You wrote how you feel.",
      wida: ["Copy and complete a sentence about a feeling"],
    },
  ],
};

export default {
  domains: { Listening: listening, Reading: reading, Speaking: speaking, Writing: writing },
};
