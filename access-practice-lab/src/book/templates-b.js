// Book Studio templates, set B: report, poetry, bilingual, response, portfolio, family and integration books.
// Pure data (expanded by bookFromTemplate in model.js); the small helpers below only build element shorthand.

const tr = (en, es) => ({ en, es });
const title = (x, y, w, h, style = {}) => ({
  t: "text",
  role: "title",
  x,
  y,
  w,
  h,
  style: { size: 7.5, font: "fraunces", align: "center", ...style },
});
const byline = (x, y, w, h, style = {}) => ({
  t: "text",
  role: "body",
  x,
  y,
  w,
  h,
  ph: tr("by (your name)", "por (tu nombre)"),
  style: { size: 3.2, align: "center", ...style },
});
const head = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "heading",
  x,
  y,
  w,
  h,
  text: tr(en, es),
  style: { size: 4.6, ...style },
});
const body = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "body",
  x,
  y,
  w,
  h,
  ph: tr(en, es),
  style: { size: 3.2, ...style },
});
const cap = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "caption",
  x,
  y,
  w,
  h,
  ph: tr(en, es),
  style: { size: 2.5, ...style },
});
const img = (x, y, w, h, en, es) => ({ t: "image", x, y, w, h, alt: "", ph: tr(en, es) });
const art = (key, x, y, w, h, en, es) => ({ t: "art", art: key, x, y, w, h, alt: tr(en, es) });
const shape = (s, x, y, w, h, fill, stroke = "none") => ({
  t: "shape",
  shape: s,
  x,
  y,
  w,
  h,
  fill,
  stroke,
  strokeW: 0.6,
});
const audio = (x, y, label = "Read this page aloud") => ({ t: "audio", x, y, w: 30, h: 9, label });

const BOTH = ["3-5", "6-8"];

/** Family pages: one box for English, one for the family's own language, side by side. */
const familyPair = (y, h, enHint, esHint) => [
  head(6, y, 42, 6, "In English", "En inglés", { size: 3.4 }),
  head(52, y, 42, 6, "In our family's language", "En el idioma de nuestra familia", { size: 3.4 }),
  shape("rounded", 6, y + 7, 42, h, "#ffffff", "#c9cfe0"),
  shape("rounded", 52, y + 7, 42, h, "#ffffff", "#c9cfe0"),
  body(8, y + 8, 38, h - 2, enHint, esHint),
  body(
    54,
    y + 8,
    38,
    h - 2,
    "Write the same idea in your family's language.",
    "Escriban la misma idea en el idioma de su familia.",
  ),
];

export const TEMPLATES_B = [
  // 1 ─────────────────────────────────────────────────────────────
  {
    id: "informational-report",
    title: tr("Informational Report", "Informe informativo"),
    kind: "report",
    format: "portrait",
    grades: BOTH,
    family: false,
    tag: "informational",
    purpose: tr("Inform", "Informar"),
    summary: tr(
      "Teach readers about a topic with a table of contents, headed sections, a labeled diagram and a glossary.",
      "Enséñales a tus lectores sobre un tema con un índice, secciones con títulos, un diagrama con rótulos y un glosario.",
    ),
    targets: [
      tr(
        "Use present tense to state facts (Bees live in hives.).",
        "Usar el presente para dar datos (Las abejas viven en colmenas.).",
      ),
      tr(
        "Use topic-specific vocabulary and define it in a glossary.",
        "Usar vocabulario del tema y definirlo en un glosario.",
      ),
      tr(
        "Group facts under headings, each starting with a topic sentence.",
        "Agrupar datos bajo títulos, cada uno con una oración principal.",
      ),
      tr(
        "Add details with for example, also and in addition.",
        "Agregar detalles con por ejemplo, también y además.",
      ),
    ],
    finished: tr(
      "A 7-page report with a contents page, two sections, a labeled diagram and a glossary.",
      "Un informe de 7 páginas con índice, dos secciones, un diagrama con rótulos y un glosario.",
    ),
    teacherNotes: tr(
      "Have students list what they already know and sort facts into two or three groups before drafting; each group becomes a section. Listen for present-tense fact statements and new topic words used correctly. Fade the frames once a student writes topic sentences without them.",
      "Pide que hagan una lista de lo que ya saben y agrupen los datos en dos o tres grupos antes de escribir; cada grupo será una sección. Escucha si usan el presente para los datos y las palabras nuevas del tema con precisión. Retira los marcos cuando el estudiante escriba oraciones principales sin ellos.",
    ),
    wordBank: [
      tr("habitat", "hábitat"),
      tr("feature", "característica"),
      tr("for example", "por ejemplo"),
      tr("in addition", "además"),
      tr("label", "rótulo"),
      tr("diagram", "diagrama"),
      tr("important", "importante"),
      tr("because", "porque"),
      tr("most", "la mayoría"),
      tr("such as", "como"),
    ],
    example: tr(
      "Octopuses: Smart Sea Animals. Body Parts: An octopus has eight arms covered with suckers. The suckers help it taste and grip food. It has three hearts and blue blood. Staying Safe: Octopuses hide from predators in many ways. For example, they can change color in less than a second to match rocks. In addition, they squirt dark ink and swim away. Glossary: predator — an animal that hunts other animals.",
      "Los pulpos: animales marinos inteligentes. Partes del cuerpo: El pulpo tiene ocho brazos cubiertos de ventosas. Las ventosas le ayudan a saborear y agarrar la comida. Tiene tres corazones y sangre azul. Mantenerse a salvo: Los pulpos se esconden de los depredadores de muchas formas. Por ejemplo, pueden cambiar de color en menos de un segundo para parecerse a las rocas. Además, lanzan tinta oscura y se alejan nadando. Glosario: depredador — un animal que caza a otros animales.",
    ),
    pages: [
      {
        bg: "#e7f4f2",
        prompt: tr(
          "Choose a topic you know a lot about or want to research. Add a picture that shows it.",
          "Elige un tema que conoces bien o que quieres investigar. Agrega una imagen que lo muestre.",
        ),
        elements: [
          shape("rect", 4, 4, 92, 30, "#075568"),
          title(8, 9, 84, 18, { color: "#ffffff" }),
          img(
            18,
            38,
            64,
            40,
            "Add a photo or drawing of your topic.",
            "Agrega una foto o un dibujo de tu tema.",
          ),
          art("obj-magnifier", 74, 74, 18, 16, "A magnifying glass", "Una lupa"),
          byline(8, 84, 60, 7, { align: "left", color: "#0b3d4a" }),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Plan your report. Write the name of each section and the page it starts on.",
          "Planea tu informe. Escribe el nombre de cada sección y la página donde empieza.",
        ),
        frames: [
          tr("Section 1 tells about ___.", "La sección 1 habla de ___."),
          tr("Readers will learn ___.", "Los lectores aprenderán ___."),
        ],
        frames68: [
          tr(
            "This report is organized into ___ sections.",
            "Este informe está organizado en ___ secciones.",
          ),
          tr("The first section explains ___.", "La primera sección explica ___."),
        ],
        elements: [
          head(8, 6, 84, 9, "Table of Contents", "Índice", {
            size: 6,
            font: "fraunces",
            color: "#0b3d4a",
          }),
          shape("line", 8, 16, 84, 1, "none", "#075568"),
          body(
            8,
            20,
            84,
            52,
            "List each section and its page: 1. Introduction ... page 3",
            "Escribe cada sección y su página: 1. Introducción ... página 3",
            { size: 3.6 },
          ),
          art("obj-book", 70, 76, 18, 16, "An open book", "Un libro abierto"),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Introduce your topic. What is it, and why should readers care?",
          "Presenta tu tema. ¿Qué es y por qué debería importarles a los lectores?",
        ),
        frames: [
          tr("Have you ever wondered ___?", "¿Alguna vez te has preguntado ___?"),
          tr("___ is a kind of ___.", "___ es un tipo de ___."),
        ],
        frames68: [
          tr("Many people do not know that ___.", "Mucha gente no sabe que ___."),
          tr(
            "Learning about ___ matters because ___.",
            "Aprender sobre ___ es importante porque ___.",
          ),
        ],
        elements: [
          head(8, 6, 84, 8, "Introduction", "Introducción", { color: "#0b3d4a" }),
          body(
            8,
            16,
            84,
            38,
            "Hook the reader, then tell what your topic is.",
            "Atrapa al lector y luego di cuál es tu tema.",
          ),
          img(
            8,
            58,
            50,
            32,
            "Add a picture that introduces the topic.",
            "Agrega una imagen que presente el tema.",
          ),
          cap(
            62,
            70,
            30,
            14,
            "Write a caption for your picture.",
            "Escribe un pie de foto para tu imagen.",
          ),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Section 1: Give it a heading. Start with a topic sentence, then add facts and an example.",
          "Sección 1: Ponle un título. Empieza con una oración principal y luego agrega datos y un ejemplo.",
        ),
        frames: [
          tr("One fact about ___ is ___.", "Un dato sobre ___ es ___."),
          tr("For example, ___.", "Por ejemplo, ___."),
          tr("Also, ___.", "También, ___."),
        ],
        frames68: [
          tr("An important feature of ___ is ___.", "Una característica importante de ___ es ___."),
          tr("In addition, ___.", "Además, ___."),
          tr("This shows that ___.", "Esto muestra que ___."),
        ],
        elements: [
          shape("rect", 4, 4, 92, 12, "#e9edf8"),
          body(8, 6, 84, 8, "Write your section heading.", "Escribe el título de tu sección.", {
            size: 4.6,
            color: "#1b2a5c",
          }),
          body(
            8,
            20,
            84,
            44,
            "Topic sentence, facts, and an example.",
            "Oración principal, datos y un ejemplo.",
          ),
          img(
            8,
            68,
            40,
            24,
            "Add a photo or drawing for this section.",
            "Agrega una foto o un dibujo para esta sección.",
          ),
          cap(
            52,
            72,
            40,
            16,
            "Caption: what does the picture show?",
            "Pie de foto: ¿qué muestra la imagen?",
          ),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Section 2: Draw or add a diagram. Write a label for each important part and explain one part.",
          "Sección 2: Dibuja o agrega un diagrama. Escribe un rótulo para cada parte importante y explica una parte.",
        ),
        frames: [
          tr("This part is called the ___.", "Esta parte se llama ___."),
          tr("The ___ helps it ___.", "El/La ___ le ayuda a ___."),
        ],
        frames68: [
          tr("The diagram shows how ___.", "El diagrama muestra cómo ___."),
          tr("The ___ is used to ___.", "El/La ___ se usa para ___."),
        ],
        elements: [
          body(8, 5, 84, 8, "Write your section heading.", "Escribe el título de tu sección.", {
            size: 4.6,
            color: "#1b2a5c",
          }),
          img(18, 16, 64, 42, "Draw or add a diagram.", "Dibuja o agrega un diagrama."),
          shape("arrow", 6, 24, 12, 5, "#e86a50"),
          cap(4, 30, 14, 10, "Label", "Rótulo"),
          shape("arrow", 82, 44, 12, 5, "#e86a50"),
          cap(82, 50, 14, 10, "Label", "Rótulo"),
          body(
            8,
            62,
            84,
            30,
            "Explain what the diagram shows.",
            "Explica lo que muestra el diagrama.",
          ),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Conclude. Sum up the most important ideas and leave the reader with something to think about.",
          "Concluye. Resume las ideas más importantes y deja al lector con algo en qué pensar.",
        ),
        frames: [
          tr("Now you know that ___.", "Ahora sabes que ___."),
          tr("The most important thing is ___.", "Lo más importante es ___."),
        ],
        frames68: [
          tr("In conclusion, ___.", "En conclusión, ___."),
          tr(
            "The next time you see ___, remember ___.",
            "La próxima vez que veas ___, recuerda ___.",
          ),
        ],
        elements: [
          head(8, 6, 84, 8, "Conclusion", "Conclusión", { color: "#0b3d4a" }),
          body(
            8,
            16,
            84,
            46,
            "Sum up your report in your own words.",
            "Resume tu informe con tus propias palabras.",
          ),
          art("obj-lightbulb", 40, 66, 20, 20, "A light bulb", "Un foco"),
          audio(8, 84),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "Glossary: list the topic words from your report in ABC order and explain each one simply.",
          "Glosario: escribe en orden alfabético las palabras del tema de tu informe y explica cada una con sencillez.",
        ),
        frames: [tr("___ means ___.", "___ significa ___.")],
        frames68: [tr("___: a ___ that ___.", "___: un/una ___ que ___.")],
        elements: [
          head(8, 6, 84, 9, "Glossary", "Glosario", {
            size: 6,
            font: "fraunces",
            color: "#1b2a5c",
          }),
          shape("rounded", 6, 18, 88, 70, "#ffffff", "#1b2a5c"),
          body(10, 21, 80, 64, "word — what it means", "palabra — lo que significa", { size: 3.4 }),
        ],
      },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────
  {
    id: "poetry-collection",
    title: tr("Poetry Collection", "Colección de poesía"),
    kind: "picture",
    format: "square",
    grades: BOTH,
    family: false,
    tag: "poetry",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Write four poems in four forms: acrostic, five senses, where I'm from, and free verse.",
      "Escribe cuatro poemas en cuatro formas: acróstico, cinco sentidos, de dónde soy y verso libre.",
    ),
    targets: [
      tr(
        "Choose precise sensory words (crunchy, glowing, salty) instead of general ones.",
        "Elegir palabras sensoriales precisas (crujiente, brillante, salado) en vez de palabras generales.",
      ),
      tr(
        "Use line breaks on purpose to group ideas.",
        "Usar los saltos de línea a propósito para agrupar ideas.",
      ),
      tr(
        "Repeat a phrase (I am from...) to build a pattern.",
        "Repetir una frase (Soy de...) para crear un patrón.",
      ),
    ],
    finished: tr(
      "A 6-page illustrated poetry book with four poems and recordings of the poet reading them.",
      "Un libro ilustrado de poesía de 6 páginas con cuatro poemas y grabaciones del poeta leyéndolos.",
    ),
    teacherNotes: tr(
      "Read one model of each form aloud and notice its rule together before students write. Listen for precise nouns and sensory verbs; push students to replace one general word per poem. Students may borrow words from their home language inside a poem when it carries the meaning best.",
      "Lee en voz alta un modelo de cada forma y descubran juntos su regla antes de escribir. Escucha si usan sustantivos precisos y verbos sensoriales; pide que cambien una palabra general por poema. Los estudiantes pueden usar palabras de su idioma de casa dentro de un poema cuando expresan mejor la idea.",
    ),
    wordBank: [
      tr("shimmer", "brillar"),
      tr("crunchy", "crujiente"),
      tr("whisper", "susurrar"),
      tr("sweet", "dulce"),
      tr("rough", "áspero"),
      tr("echo", "eco"),
      tr("glowing", "resplandeciente"),
      tr("I am from", "soy de"),
      tr("memory", "recuerdo"),
    ],
    example: tr(
      "Rain (five senses). Rain looks like silver threads on the window. / It sounds like fingers drumming on the roof. / It smells like wet dirt and green leaves. / It tastes like cold metal on my tongue. / It feels like tiny pins on my arms. / Rain is the sky telling a long, gray story.",
      "La lluvia (cinco sentidos). La lluvia parece hilos de plata en la ventana. / Suena como dedos tamborileando en el techo. / Huele a tierra mojada y hojas verdes. / Sabe a metal frío en mi lengua. / Se siente como alfileres diminutos en mis brazos. / La lluvia es el cielo contando una historia larga y gris.",
    ),
    pages: [
      {
        bg: "#5a1e3a",
        prompt: tr(
          "Design your cover. Your poems will be about you and your world.",
          "Diseña tu portada. Tus poemas serán sobre ti y tu mundo.",
        ),
        elements: [
          art("nat-flower", 6, 6, 18, 18, "A flower", "Una flor"),
          art("nat-butterfly", 76, 8, 18, 16, "A butterfly", "Una mariposa"),
          title(10, 30, 80, 22, { color: "#fff3c4" }),
          shape("line", 25, 56, 50, 1, "none", "#f2b134"),
          byline(15, 60, 70, 8, { color: "#ffffff" }),
          art("obj-pencil", 42, 74, 16, 16, "A pencil", "Un lápiz"),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "Acrostic poem: write a word you care about down the left side. Each line starts with one of its letters and says something true about the word.",
          "Poema acróstico: escribe una palabra importante para ti hacia abajo, a la izquierda. Cada línea empieza con una de sus letras y dice algo verdadero sobre la palabra.",
        ),
        frames: [
          tr(
            "(letter) ___ (a word or phrase about your topic)",
            "(letra) ___ (una palabra o frase sobre tu tema)",
          ),
        ],
        frames68: [
          tr(
            "Each line can be a phrase that describes or explains the word.",
            "Cada línea puede ser una frase que describa o explique la palabra.",
          ),
        ],
        elements: [
          head(6, 5, 88, 8, "Acrostic", "Acróstico", { font: "fraunces", color: "#5a1e3a" }),
          shape("rect", 6, 16, 12, 70, "#f2b134"),
          body(7, 18, 10, 66, "Letters", "Letras", { size: 5, align: "center", font: "fraunces" }),
          body(
            22,
            18,
            72,
            66,
            "Write one line for each letter.",
            "Escribe una línea para cada letra.",
            { size: 3.6 },
          ),
          audio(64, 87),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Five senses poem: pick one thing (a place, food or weather). Write what it looks, sounds, smells, tastes and feels like. End with a line that tells what it means to you.",
          "Poema de los cinco sentidos: elige una cosa (un lugar, una comida o el clima). Escribe cómo se ve, cómo suena, a qué huele, a qué sabe y cómo se siente. Termina con una línea que diga lo que significa para ti.",
        ),
        frames: [
          tr("It looks like ___.", "Se ve como ___."),
          tr("It sounds like ___.", "Suena como ___."),
          tr("It smells like ___.", "Huele a ___."),
        ],
        frames68: [
          tr("___ glows like ___.", "___ brilla como ___."),
          tr("The air carries the scent of ___.", "El aire lleva el olor de ___."),
        ],
        elements: [
          head(6, 5, 60, 8, "Five Senses", "Cinco sentidos", {
            font: "fraunces",
            color: "#0b3d4a",
          }),
          img(68, 4, 26, 22, "Draw your subject.", "Dibuja tu tema."),
          body(
            6,
            28,
            88,
            56,
            "One line for each sense, then a last line.",
            "Una línea para cada sentido y luego una línea final.",
            { size: 3.6 },
          ),
          audio(6, 87),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          'Where I\'m from poem: start lines with "I am from..." and name real things: foods, sayings, places, people, sounds from home.',
          'Poema de dónde soy: empieza tus líneas con "Soy de..." y nombra cosas reales: comidas, dichos, lugares, personas y sonidos de casa.',
        ),
        frames: [
          tr("I am from ___.", "Soy de ___."),
          tr("I am from the smell of ___.", "Soy del olor a ___."),
        ],
        frames68: [
          tr("I am from ___ and ___, from ___.", "Soy de ___ y ___, de ___."),
          tr("I am from the words ___.", "Soy de las palabras ___."),
        ],
        elements: [
          head(6, 5, 88, 8, "Where I'm From", "De dónde soy", {
            font: "fraunces",
            color: "#9a4a26",
          }),
          body(6, 16, 56, 70, "I am from...", "Soy de...", { size: 3.6 }),
          img(
            66,
            16,
            28,
            34,
            "Add a photo or drawing from home.",
            "Agrega una foto o un dibujo de casa.",
          ),
          art("obj-house", 70, 56, 20, 18, "A house", "Una casa"),
          audio(64, 87),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Free verse: write a poem with no rules for rhyme or line length. Choose where each line breaks so the reader pauses where you want.",
          "Verso libre: escribe un poema sin reglas de rima ni de largo de línea. Decide dónde termina cada línea para que el lector haga una pausa donde tú quieras.",
        ),
        frames: [
          tr(
            "Start with a picture in your mind: I see ___.",
            "Empieza con una imagen en tu mente: Veo ___.",
          ),
        ],
        frames68: [
          tr("Try a comparison: ___ is a ___.", "Prueba una comparación: ___ es un/una ___."),
        ],
        elements: [
          art("nat-sun", 78, 4, 16, 16, "A sun", "Un sol"),
          head(6, 6, 70, 8, "Free Verse", "Verso libre", { font: "fraunces", color: "#fff3c4" }),
          body(
            6,
            18,
            88,
            64,
            "Write your poem. Break lines on purpose.",
            "Escribe tu poema. Corta las líneas a propósito.",
            { size: 3.6, color: "#ffffff" },
          ),
          audio(6, 87),
        ],
      },
      {
        bg: "#f8e8ef",
        prompt: tr(
          "About the poet: which poem is your favorite, and which word did you choose most carefully? Why?",
          "Sobre el poeta: ¿cuál poema es tu favorito y qué palabra elegiste con más cuidado? ¿Por qué?",
        ),
        frames: [
          tr("My favorite poem is ___ because ___.", "Mi poema favorito es ___ porque ___."),
          tr("I chose the word ___ because ___.", "Elegí la palabra ___ porque ___."),
        ],
        frames68: [
          tr("The word ___ creates a feeling of ___.", "La palabra ___ crea una sensación de ___."),
          tr(
            "Writing in different forms taught me ___.",
            "Escribir en formas distintas me enseñó ___.",
          ),
        ],
        elements: [
          head(6, 5, 88, 8, "About the Poet", "Sobre el poeta", {
            font: "fraunces",
            color: "#5a1e3a",
          }),
          img(6, 16, 30, 30, "Add a photo or self-portrait.", "Agrega una foto o un autorretrato."),
          body(
            40,
            16,
            54,
            70,
            "Tell about your poems and your word choices.",
            "Cuenta sobre tus poemas y las palabras que elegiste.",
          ),
          art("obj-heart", 12, 54, 18, 18, "A heart", "Un corazón"),
        ],
      },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────
  {
    id: "bilingual-storybook",
    title: tr("Bilingual Storybook", "Cuento bilingüe"),
    kind: "bilingual",
    format: "landscape",
    grades: BOTH,
    family: false,
    tag: "narrative",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Tell a story in English and in your other language, side by side on every page.",
      "Cuenta un cuento en inglés y en tu otro idioma, lado a lado en cada página.",
    ),
    targets: [
      tr(
        "Use past-tense verbs to tell what happened.",
        "Usar verbos en pasado para contar lo que pasó.",
      ),
      tr(
        "Connect events with first, next, then and finally.",
        "Conectar los sucesos con primero, después, luego y finalmente.",
      ),
      tr(
        "Notice how an idea is said in two languages and explain one difference.",
        "Notar cómo se dice una idea en dos idiomas y explicar una diferencia.",
      ),
    ],
    finished: tr(
      "A 6-page picture storybook with English and home-language text on every page.",
      "Un cuento ilustrado de 6 páginas con texto en inglés y en el idioma de casa en cada página.",
    ),
    teacherNotes: tr(
      "The other-language box accepts any home language the student writes; the site itself (buttons, prompts, frames) is in English and Spanish only. Students can draft in whichever language comes first and then write the other, asking family for help. Listen for past-tense verbs and sequence words in the English box; do not grade the home-language box.",
      "El cuadro del otro idioma acepta cualquier idioma de casa que escriba el estudiante; el sitio (botones, instrucciones, marcos) está solo en inglés y español. Los estudiantes pueden escribir primero en el idioma que les salga más fácil y luego en el otro, con ayuda de su familia. Escucha los verbos en pasado y las palabras de secuencia en el cuadro de inglés; no califiques el cuadro del idioma de casa.",
    ),
    wordBank: [
      tr("once", "una vez"),
      tr("first", "primero"),
      tr("next", "después"),
      tr("then", "luego"),
      tr("suddenly", "de repente"),
      tr("finally", "finalmente"),
      tr("felt", "sintió"),
      tr("decided", "decidió"),
      tr("problem", "problema"),
      tr("ending", "final"),
    ],
    example: tr(
      "Page 2: First, Lina found a tiny bird under the mango tree. Its wing was hurt, and it could not fly. Page 3: Next, she made a soft bed in a shoebox. Then she asked her grandfather what birds eat. Page 4: Suddenly, the bird flapped its wing and hopped onto the window. Finally, it flew back to the tree and sang.",
      "Página 2: Primero, Lina encontró un pajarito debajo del árbol de mango. Tenía un ala lastimada y no podía volar. Página 3: Después, le hizo una cama suave en una caja de zapatos. Luego le preguntó a su abuelo qué comen los pájaros. Página 4: De repente, el pájaro movió el ala y saltó a la ventana. Finalmente, voló de regreso al árbol y cantó.",
    ),
    pages: [
      {
        bg: "#075568",
        prompt: tr(
          "Give your story a title. You can add the title in your other language in the box below.",
          "Ponle título a tu cuento. Puedes escribir el título en tu otro idioma en el cuadro de abajo.",
        ),
        elements: [
          img(
            54,
            8,
            40,
            66,
            "Draw or add a picture of your main character.",
            "Dibuja o agrega una imagen de tu personaje principal.",
          ),
          title(6, 10, 46, 26, { color: "#ffffff", align: "left" }),
          body(6, 40, 46, 12, "Title in your other language", "Título en tu otro idioma", {
            color: "#fff3c4",
            size: 4,
          }),
          byline(6, 58, 46, 8, { color: "#ffffff", align: "left" }),
          art("obj-globe", 8, 74, 14, 20, "A globe", "Un globo terráqueo"),
          art("fx-sparkles", 24, 78, 12, 14, "Sparkles", "Destellos"),
        ],
      },
      ...[
        [
          "Beginning: introduce your character and the place. What is their normal day like?",
          "Comienzo: presenta a tu personaje y el lugar. ¿Cómo es su día normal?",
          [tr("Once, there was ___ who lived ___.", "Una vez, había ___ que vivía ___.")],
          [tr("Every morning, ___ would ___.", "Todas las mañanas, ___ solía ___.")],
          "#fffaf0",
        ],
        [
          "Problem: what goes wrong or what does your character want?",
          "Problema: ¿qué sale mal o qué quiere tu personaje?",
          [tr("First, ___.", "Primero, ___."), tr("___ wanted ___.", "___ quería ___.")],
          [tr("One day, everything changed when ___.", "Un día, todo cambió cuando ___.")],
          "#e9edf8",
        ],
        [
          "Middle: what does your character try? Tell two events in order.",
          "Desarrollo: ¿qué intenta hacer tu personaje? Cuenta dos sucesos en orden.",
          [tr("Next, ___.", "Después, ___."), tr("Then, ___.", "Luego, ___.")],
          [
            tr(
              "After that, ___ tried to ___, but ___.",
              "Después de eso, ___ intentó ___, pero ___.",
            ),
          ],
          "#fbeadf",
        ],
        [
          "Ending: how is the problem solved? How does your character feel?",
          "Final: ¿cómo se resuelve el problema? ¿Cómo se siente tu personaje?",
          [tr("Finally, ___.", "Finalmente, ___."), tr("___ felt ___.", "___ se sintió ___.")],
          [tr("In the end, ___ realized ___.", "Al final, ___ se dio cuenta de que ___.")],
          "#e6f0e3",
        ],
      ].map(([pen, pes, frames, frames68, bg]) => ({
        bg,
        prompt: tr(pen, pes),
        frames,
        frames68,
        elements: [
          img(
            6,
            6,
            88,
            36,
            "Draw or add a picture for this part of the story.",
            "Dibuja o agrega una imagen para esta parte del cuento.",
          ),
          head(6, 45, 42, 6, "English", "Inglés", { size: 3.4, color: "#075568" }),
          head(52, 45, 42, 6, "My other language", "Mi otro idioma", {
            size: 3.4,
            color: "#8a3a5c",
          }),
          shape("rounded", 6, 52, 42, 34, "#ffffff", "#075568"),
          shape("rounded", 52, 52, 42, 34, "#ffffff", "#8a3a5c"),
          body(8, 54, 38, 30, "Write this part in English.", "Escribe esta parte en inglés."),
          body(
            54,
            54,
            38,
            30,
            "Write this part in your other language.",
            "Escribe esta parte en tu otro idioma.",
          ),
          audio(35, 87, "Read both languages aloud"),
        ],
      })),
      {
        bg: "#f8e8ef",
        prompt: tr(
          "About my languages: choose one sentence from your story. How is it said differently in your two languages?",
          "Sobre mis idiomas: elige una oración de tu cuento. ¿Cómo se dice de forma diferente en tus dos idiomas?",
        ),
        frames: [
          tr(
            "In English we say ___. In my language we say ___.",
            "En inglés decimos ___. En mi idioma decimos ___.",
          ),
        ],
        frames68: [
          tr("One difference I noticed is ___.", "Una diferencia que noté es ___."),
          tr("The word order changes because ___.", "El orden de las palabras cambia porque ___."),
        ],
        elements: [
          head(6, 6, 88, 9, "About My Languages", "Sobre mis idiomas", {
            font: "fraunces",
            color: "#5a1e3a",
          }),
          body(
            6,
            18,
            56,
            66,
            "Compare one sentence in your two languages.",
            "Compara una oración en tus dos idiomas.",
          ),
          img(
            66,
            18,
            28,
            36,
            "Add a photo of you or your family.",
            "Agrega una foto tuya o de tu familia.",
          ),
          art("obj-heart", 72, 60, 16, 22, "A heart", "Un corazón"),
        ],
      },
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────
  {
    id: "reading-response",
    title: tr("Reading Response", "Respuesta a la lectura"),
    kind: "report",
    format: "portrait",
    grades: BOTH,
    family: false,
    tag: "response",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Respond to a book you read: summary, a favorite quote, a connection, a question for the author and a recommendation.",
      "Responde a un libro que leíste: resumen, una cita favorita, una conexión, una pregunta para el autor y una recomendación.",
    ),
    targets: [
      tr(
        "Summarize with somebody-wanted-but-so-then, in present tense.",
        "Resumir con alguien-quería-pero-entonces-luego, en presente.",
      ),
      tr(
        "Quote the text with quotation marks and a page number.",
        "Citar el texto con comillas y número de página.",
      ),
      tr(
        "Give an opinion with a reason (I recommend it because...).",
        "Dar una opinión con una razón (Lo recomiendo porque...).",
      ),
    ],
    finished: tr(
      "A 7-page response book about one book, with a quote, a connection and a recommendation.",
      "Un libro de respuesta de 7 páginas sobre un libro, con una cita, una conexión y una recomendación.",
    ),
    teacherNotes: tr(
      "Use after independent or read-aloud reading. Model copying a quote exactly and writing the page number. Listen for summaries that stay short (main events only) and reasons that point back to the book. Fade the summary frame once students can name the problem and solution unprompted.",
      "Úsalo después de la lectura independiente o en voz alta. Modela cómo copiar una cita exacta y escribir el número de página. Escucha si los resúmenes son cortos (solo los sucesos principales) y si las razones regresan al libro. Retira el marco de resumen cuando puedan nombrar el problema y la solución sin ayuda.",
    ),
    wordBank: [
      tr("author", "autor"),
      tr("character", "personaje"),
      tr("setting", "ambiente"),
      tr("summary", "resumen"),
      tr("quote", "cita"),
      tr("connection", "conexión"),
      tr("recommend", "recomendar"),
      tr("reminds me of", "me recuerda a"),
      tr("page", "página"),
    ],
    example: tr(
      'Summary: Marco wants to win the science fair, but his volcano breaks the night before. So he builds a new model with his sister, and then he learns that teamwork matters more than first place. Favorite part: "We fixed it together, one crack at a time" (page 42). I like this line because it shows the siblings becoming friends. I recommend this book to anyone who has a little brother or sister.',
      'Resumen: Marco quiere ganar la feria de ciencias, pero su volcán se rompe la noche anterior. Entonces construye un modelo nuevo con su hermana, y luego aprende que el trabajo en equipo importa más que el primer lugar. Parte favorita: "Lo arreglamos juntos, grieta por grieta" (página 42). Me gusta esta línea porque muestra que los hermanos se vuelven amigos. Recomiendo este libro a cualquiera que tenga un hermanito o una hermanita.',
    ),
    pages: [
      {
        bg: "#fbeadf",
        prompt: tr(
          "Make a cover for your response. Draw the book's cover or your favorite scene.",
          "Haz una portada para tu respuesta. Dibuja la portada del libro o tu escena favorita.",
        ),
        elements: [
          shape("rect", 4, 4, 92, 92, "none", "#9a4a26"),
          art("obj-book", 38, 8, 24, 18, "An open book", "Un libro abierto"),
          title(8, 28, 84, 16, { color: "#5a1e3a" }),
          img(
            22,
            48,
            56,
            32,
            "Draw the book cover or your favorite scene.",
            "Dibuja la portada del libro o tu escena favorita.",
          ),
          byline(15, 84, 70, 7, { color: "#5a1e3a" }),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Book information: write the title, author and genre. Who is the main character, and where does the story happen?",
          "Información del libro: escribe el título, el autor y el género. ¿Quién es el personaje principal y dónde ocurre la historia?",
        ),
        frames: [
          tr("The book is called ___ by ___.", "El libro se llama ___ y lo escribió ___."),
          tr("The main character is ___.", "El personaje principal es ___."),
        ],
        frames68: [
          tr(
            "___, written by ___, is a ___ (genre) set in ___.",
            "___, escrito por ___, es un/una ___ (género) que ocurre en ___.",
          ),
        ],
        elements: [
          head(8, 6, 84, 8, "About the Book", "Sobre el libro", { color: "#9a4a26" }),
          ...[
            ["Title", "Título", 18],
            ["Author", "Autor", 30],
            ["Genre", "Género", 42],
          ].map(([en, es, y]) => head(8, y, 24, 8, en, es, { size: 3.4 })),
          body(34, 18, 58, 8, "Book title", "Título del libro"),
          body(34, 30, 58, 8, "Author's name", "Nombre del autor"),
          body(
            34,
            42,
            58,
            8,
            "Fiction, nonfiction, mystery...",
            "Ficción, no ficción, misterio...",
          ),
          body(8, 56, 84, 34, "Main character and setting.", "Personaje principal y ambiente."),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Summary: tell only the most important events. Who wanted what? What got in the way? How did it end?",
          "Resumen: cuenta solo los sucesos más importantes. ¿Quién quería qué? ¿Qué se lo impidió? ¿Cómo terminó?",
        ),
        frames: [
          tr("___ wants ___, but ___.", "___ quiere ___, pero ___."),
          tr("So ___. Then ___.", "Entonces ___. Luego ___."),
        ],
        frames68: [
          tr("The central conflict is ___.", "El conflicto central es ___."),
          tr("By the end, ___.", "Al final, ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "Summary", "Resumen", { color: "#9a4a26" }),
          body(
            8,
            16,
            84,
            60,
            "Summarize the book in 4-6 sentences.",
            "Resume el libro en 4 a 6 oraciones.",
          ),
          audio(8, 82),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Favorite part: copy a sentence exactly, in quotation marks, with the page number. Then explain why you chose it.",
          "Parte favorita: copia una oración exacta, entre comillas, con el número de página. Luego explica por qué la elegiste.",
        ),
        frames: [
          tr('On page ___, it says "___."', 'En la página ___, dice "___."'),
          tr("I like this part because ___.", "Me gusta esta parte porque ___."),
        ],
        frames68: [
          tr("This quote shows that ___.", "Esta cita muestra que ___."),
          tr(
            "The author's words make me feel ___ because ___.",
            "Las palabras del autor me hacen sentir ___ porque ___.",
          ),
        ],
        elements: [
          head(8, 6, 84, 8, "My Favorite Part", "Mi parte favorita", { color: "#9a4a26" }),
          shape("rounded", 8, 16, 84, 28, "#fbeadf"),
          body(12, 18, 64, 24, '"Copy the quote here."', '"Copia la cita aquí."', {
            font: "fraunces",
            size: 3.6,
          }),
          body(78, 26, 12, 8, "p. __", "p. __"),
          body(8, 48, 84, 28, "Why did you choose this part?", "¿Por qué elegiste esta parte?"),
          img(8, 78, 30, 16, "Sketch the scene.", "Dibuja la escena."),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "Connection: what does this book remind you of — your life, another book, or the world?",
          "Conexión: ¿qué te recuerda este libro: tu vida, otro libro o el mundo?",
        ),
        frames: [
          tr("This book reminds me of ___.", "Este libro me recuerda a ___."),
          tr("I felt like ___ when ___.", "Me sentí como ___ cuando ___."),
        ],
        frames68: [
          tr("This connects to ___ because both ___.", "Esto se conecta con ___ porque ambos ___."),
          tr("Unlike the character, I ___.", "A diferencia del personaje, yo ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "My Connection", "Mi conexión", { color: "#1b2a5c" }),
          body(8, 16, 54, 50, "Explain your connection.", "Explica tu conexión."),
          img(
            66,
            16,
            26,
            30,
            "Add a picture of your connection.",
            "Agrega una imagen de tu conexión.",
          ),
          head(8, 70, 84, 7, "A question for the author", "Una pregunta para el autor", {
            size: 3.6,
            color: "#1b2a5c",
          }),
          art("obj-question", 80, 70, 12, 10, "A question mark", "Un signo de interrogación"),
          body(
            8,
            78,
            70,
            14,
            "Why did you...? What happens after...?",
            "¿Por qué...? ¿Qué pasa después de...?",
          ),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "Recommendation: who should read this book and why? Give at least one reason from the book.",
          "Recomendación: ¿quién debería leer este libro y por qué? Da al menos una razón del libro.",
        ),
        frames: [
          tr("I recommend this book to ___ because ___.", "Recomiendo este libro a ___ porque ___."),
        ],
        frames68: [
          tr(
            "Readers who enjoy ___ will appreciate ___.",
            "A los lectores que disfrutan ___ les gustará ___.",
          ),
          tr("However, ___.", "Sin embargo, ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "My Recommendation", "Mi recomendación", { color: "#9a4a26" }),
          art("obj-star", 8, 18, 14, 14, "A star", "Una estrella"),
          art("obj-star", 24, 18, 14, 14, "A star", "Una estrella"),
          art("obj-star", 40, 18, 14, 14, "A star", "Una estrella"),
          body(8, 36, 84, 44, "Who should read it, and why?", "¿Quién debería leerlo y por qué?"),
          audio(8, 84),
        ],
      },
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────
  {
    id: "language-growth-portfolio",
    title: tr("Language Growth Portfolio", "Portafolio de mi crecimiento en el idioma"),
    kind: "report",
    format: "portrait",
    grades: BOTH,
    family: false,
    tag: "portfolio",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Show how your writing and speaking grew: a first try, feedback, a revision and a goal.",
      "Muestra cómo creció tu escritura y tu forma de hablar: un primer intento, comentarios, una revisión y una meta.",
    ),
    targets: [
      tr(
        "Describe a change with before/now language (Before, I wrote... Now I write...).",
        "Describir un cambio con lenguaje de antes y ahora (Antes escribía... Ahora escribo...).",
      ),
      tr(
        "Explain a choice with because and so that.",
        "Explicar una decisión con porque y para que.",
      ),
      tr(
        "Name a specific language goal and a step to reach it.",
        "Nombrar una meta de idioma específica y un paso para lograrla.",
      ),
    ],
    finished: tr(
      "A 7-page portfolio comparing a first attempt with a revision, plus a goal and a recording of me speaking now.",
      "Un portafolio de 7 páginas que compara un primer intento con una revisión, más una meta y una grabación de mí hablando ahora.",
    ),
    teacherNotes: tr(
      "This book shows growth in the student's own words; it describes change and never rates the student. Help students pick a first attempt that has clear room to grow and the actual feedback they received. Listen for specific descriptions of change (a new connector, a clearer sentence) rather than \"it's better.\"",
      'Este libro muestra el crecimiento con las palabras del propio estudiante; describe el cambio y nunca califica al estudiante. Ayuda a elegir un primer intento con espacio claro para mejorar y los comentarios reales que recibió. Escucha descripciones específicas del cambio (un conector nuevo, una oración más clara) en vez de "está mejor".',
    ),
    wordBank: [
      tr("first attempt", "primer intento"),
      tr("feedback", "comentarios"),
      tr("revise", "revisar"),
      tr("before", "antes"),
      tr("now", "ahora"),
      tr("clearer", "más claro"),
      tr("goal", "meta"),
      tr("practice", "practicar"),
      tr("detail", "detalle"),
      tr("because", "porque"),
    ],
    example: tr(
      'First attempt: "The plant grow. It need water." Feedback: My teacher said to check my verbs and add a reason. My revision: "The plant grows taller each week because it gets water and sunlight." What changed: I added -s to the verbs, and I used because to explain why. My goal: I am working on using two connectors in every paragraph.',
      'Primer intento: "The plant grow. It need water." Comentarios: Mi maestra me dijo que revisara mis verbos y agregara una razón. Mi revisión: "The plant grows taller each week because it gets water and sunlight." Qué cambió: Agregué -s a los verbos y usé because para explicar por qué. Mi meta: Estoy trabajando en usar dos conectores en cada párrafo.',
    ),
    pages: [
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Make a cover that shows you as a learner.",
          "Haz una portada que te muestre como aprendiz.",
        ),
        elements: [
          art("sci-plant", 8, 52, 26, 34, "A growing plant", "Una planta que crece"),
          title(8, 10, 84, 22, { color: "#0b3d4a" }),
          byline(15, 34, 70, 7, { color: "#0b3d4a" }),
          img(
            40,
            46,
            50,
            40,
            "Add a photo or drawing of you.",
            "Agrega una foto o un dibujo de ti.",
          ),
          art("nat-sun", 78, 4, 16, 14, "A sun", "Un sol"),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Paste or copy a first attempt: an early piece of your writing, exactly as you wrote it. Tell when you wrote it.",
          "Pega o copia un primer intento: un texto tuyo de antes, exactamente como lo escribiste. Di cuándo lo escribiste.",
        ),
        frames: [
          tr("I wrote this in ___.", "Escribí esto en ___."),
          tr("It was about ___.", "Trataba de ___."),
        ],
        frames68: [
          tr(
            "I wrote this early in ___, when I was learning ___.",
            "Escribí esto al principio de ___, cuando estaba aprendiendo ___.",
          ),
        ],
        elements: [
          head(8, 6, 84, 8, "My First Attempt", "Mi primer intento", { color: "#0b3d4a" }),
          img(
            8,
            16,
            84,
            40,
            "Add a photo of your first attempt.",
            "Agrega una foto de tu primer intento.",
          ),
          body(
            8,
            60,
            84,
            30,
            "Or type it here exactly as you wrote it.",
            "O escríbelo aquí exactamente como lo escribiste.",
          ),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Feedback I got: what did your teacher, a classmate or a family member tell you? Write it in your own words.",
          "Comentarios que recibí: ¿qué te dijo tu maestro, un compañero o alguien de tu familia? Escríbelo con tus propias palabras.",
        ),
        frames: [
          tr("___ told me to ___.", "___ me dijo que ___."),
          tr("One thing I did well was ___.", "Algo que hice bien fue ___."),
        ],
        frames68: [
          tr("The feedback suggested that I ___.", "Los comentarios sugerían que ___."),
          tr("A strength I can build on is ___.", "Una fortaleza que puedo aprovechar es ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "Feedback I Got", "Comentarios que recibí", { color: "#9a4a26" }),
          {
            t: "bubble",
            variant: "speech",
            tail: "bottom-left",
            x: 8,
            y: 16,
            w: 84,
            h: 36,
            ph: tr(
              "What did someone tell you about your work?",
              "¿Qué te dijeron sobre tu trabajo?",
            ),
          },
          body(
            8,
            58,
            84,
            32,
            "What will you try because of this feedback?",
            "¿Qué vas a intentar gracias a estos comentarios?",
          ),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "My revision: rewrite the same piece using the feedback.",
          "Mi revisión: vuelve a escribir el mismo texto usando los comentarios.",
        ),
        frames: [tr("Now I write: ___.", "Ahora escribo: ___.")],
        frames68: [tr("In my revision, I ___.", "En mi revisión, ___.")],
        elements: [
          head(8, 6, 84, 8, "My Revision", "Mi revisión", { color: "#0b3d4a" }),
          body(8, 16, 84, 60, "Write your revised version.", "Escribe tu versión revisada."),
          img(8, 78, 30, 14, "Optional: add a photo.", "Opcional: agrega una foto."),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "What changed and why: compare your first attempt and your revision. Name two specific changes and why you made them.",
          "Qué cambió y por qué: compara tu primer intento con tu revisión. Nombra dos cambios específicos y por qué los hiciste.",
        ),
        frames: [
          tr("Before, I wrote ___. Now I write ___.", "Antes escribía ___. Ahora escribo ___."),
          tr("I changed it because ___.", "Lo cambié porque ___."),
        ],
        frames68: [
          tr("I revised ___ so that the reader ___.", "Revisé ___ para que el lector ___."),
          tr("This change makes my writing ___.", "Este cambio hace que mi escritura sea ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "What Changed and Why", "Qué cambió y por qué", { color: "#1b2a5c" }),
          head(8, 17, 38, 6, "Before", "Antes", { size: 3.6, align: "center" }),
          head(54, 17, 38, 6, "Now", "Ahora", { size: 3.6, align: "center" }),
          body(8, 24, 38, 28, "A part of your first attempt", "Una parte de tu primer intento"),
          shape("arrow", 46, 34, 8, 6, "#075568"),
          body(54, 24, 38, 28, "The same part, revised", "La misma parte, revisada"),
          body(
            8,
            58,
            84,
            32,
            "Explain why each change helps.",
            "Explica por qué ayuda cada cambio.",
          ),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "A goal I am working on: choose one language goal and one step you will take to practice it.",
          "Una meta en la que estoy trabajando: elige una meta de idioma y un paso que darás para practicarla.",
        ),
        frames: [
          tr("My goal is to ___.", "Mi meta es ___."),
          tr("To practice, I will ___.", "Para practicar, voy a ___."),
        ],
        frames68: [
          tr("I am working toward ___ by ___.", "Estoy trabajando para ___ mediante ___."),
          tr("I will know I am improving when ___.", "Sabré que estoy mejorando cuando ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "A Goal I Am Working On", "Una meta en la que estoy trabajando", {
            color: "#9a4a26",
          }),
          art("obj-key", 8, 18, 16, 16, "A key", "Una llave"),
          body(28, 18, 64, 30, "My goal", "Mi meta"),
          body(
            8,
            52,
            84,
            36,
            "My next step and how I will practice",
            "Mi siguiente paso y cómo voy a practicar",
          ),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "A recording of me speaking now: record yourself telling what you learned about your own language growth. Write a few notes first.",
          "Una grabación de mí hablando ahora: grábate contando lo que aprendiste sobre tu crecimiento en el idioma. Primero escribe algunas notas.",
        ),
        frames: [
          tr("I am proud that ___.", "Estoy orgulloso/a de que ___."),
          tr("Now I can ___.", "Ahora puedo ___."),
        ],
        frames68: [
          tr("Looking back, I notice ___.", "Al mirar atrás, noto que ___."),
          tr("Next, I want to ___.", "Ahora quiero ___."),
        ],
        elements: [
          head(8, 6, 84, 8, "Me Speaking Now", "Yo hablando ahora", { color: "#fff3c4" }),
          art("obj-microphone", 40, 18, 20, 22, "A microphone", "Un micrófono"),
          { t: "audio", x: 30, y: 44, w: 40, h: 10, label: "Record yourself speaking" },
          body(8, 60, 84, 30, "Notes for your recording", "Notas para tu grabación", {
            color: "#ffffff",
          }),
        ],
      },
    ],
  },

  // 6-11 family ───────────────────────────────────────────────────
  family({
    id: "family-stories",
    title: tr("Family Stories", "Historias de familia"),
    summary: tr(
      "Tell a story from your family's past, together.",
      "Cuenten juntos una historia del pasado de su familia.",
    ),
    purpose: tr("Narrate", "Narrar"),
    targets: [
      tr(
        "Use past-tense verbs to tell what happened.",
        "Usar verbos en pasado para contar lo que pasó.",
      ),
      tr(
        "Ask a family member questions with who, where and when.",
        "Hacerle preguntas a un familiar con quién, dónde y cuándo.",
      ),
    ],
    finished: tr(
      "A short family story book in two languages, with pictures.",
      "Un librito de una historia familiar en dos idiomas, con imágenes.",
    ),
    teacherNotes: tr(
      "Send home with a short note. Families may write in any language; the story belongs to them.",
      "Envíalo a casa con una nota breve. Las familias pueden escribir en cualquier idioma; la historia es suya.",
    ),
    wordBank: [
      tr("long ago", "hace mucho tiempo"),
      tr("grandparent", "abuelo/abuela"),
      tr("remember", "recordar"),
      tr("when", "cuando"),
      tr("then", "luego"),
      tr("family", "familia"),
    ],
    example: tr(
      "Long ago, my grandma lived near a river. Every Saturday she walked to the market with her brothers. One day it rained so hard that they had to sleep at a cousin's house. She still laughs when she tells it.",
      "Hace mucho tiempo, mi abuela vivía cerca de un río. Cada sábado caminaba al mercado con sus hermanos. Un día llovió tanto que tuvieron que dormir en casa de un primo. Todavía se ríe cuando lo cuenta.",
    ),
    cover: { bg: "#9a4a26", text: "#fff3c4", art: ["char-abuela", "obj-house"] },
    pages: [
      [
        "Who is in this story? Child: ask your grown-up. Grown-up: tell who, where and when.",
        "¿Quién está en esta historia? Niño o niña: pregúntale a tu adulto. Adulto: cuente quién, dónde y cuándo.",
        "Who? Where? When?",
        "¿Quién? ¿Dónde? ¿Cuándo?",
        tr("This story is about ___.", "Esta historia es sobre ___."),
      ],
      [
        "What happened? Tell it together, one part each.",
        "¿Qué pasó? Cuéntenlo juntos, una parte cada uno.",
        "What happened first and next?",
        "¿Qué pasó primero y después?",
        tr("First, ___. Then, ___.", "Primero, ___. Luego, ___."),
      ],
      [
        "How did it end? Why does our family remember it?",
        "¿Cómo terminó? ¿Por qué lo recuerda nuestra familia?",
        "How did it end?",
        "¿Cómo terminó?",
        tr("In the end, ___.", "Al final, ___."),
      ],
    ],
  }),
  family({
    id: "our-traditions",
    title: tr("Our Traditions", "Nuestras tradiciones"),
    summary: tr(
      "Show a tradition your family celebrates and what it means.",
      "Muestren una tradición que celebra su familia y lo que significa.",
    ),
    purpose: tr("Inform", "Informar"),
    targets: [
      tr(
        "Use present tense for things we do every year (We cook... We sing...).",
        "Usar el presente para lo que hacemos cada año (Cocinamos... Cantamos...).",
      ),
      tr(
        "Name foods, objects and actions with precise words.",
        "Nombrar comidas, objetos y acciones con palabras precisas.",
      ),
    ],
    finished: tr(
      "A short tradition book in two languages, with photos or drawings.",
      "Un librito sobre una tradición en dos idiomas, con fotos o dibujos.",
    ),
    teacherNotes: tr(
      "Any tradition counts: a holiday, a weekly meal, a song. Invite families to share photos.",
      "Cualquier tradición vale: una fiesta, una comida semanal, una canción. Invita a las familias a compartir fotos.",
    ),
    wordBank: [
      tr("celebrate", "celebrar"),
      tr("every year", "cada año"),
      tr("together", "juntos"),
      tr("special", "especial"),
      tr("we wear", "nos ponemos"),
      tr("we eat", "comemos"),
    ],
    example: tr(
      "Every December we make tamales with my aunts. We wrap the dough in corn husks. Everyone has a job, even my little cousin. The kitchen smells like corn and chiles all day.",
      "Cada diciembre hacemos tamales con mis tías. Envolvemos la masa en hojas de maíz. Todos tienen una tarea, hasta mi primito. La cocina huele a maíz y a chile todo el día.",
    ),
    cover: { bg: "#8a3a5c", text: "#ffffff", art: ["obj-gift", "obj-music"] },
    pages: [
      [
        "What is the tradition called? When do we celebrate it?",
        "¿Cómo se llama la tradición? ¿Cuándo la celebramos?",
        "Name it and tell when.",
        "Díganle el nombre y cuándo es.",
        tr("Our tradition is ___.", "Nuestra tradición es ___."),
      ],
      [
        "What do we do, eat or wear? Draw or add a photo.",
        "¿Qué hacemos, comemos o nos ponemos? Dibujen o agreguen una foto.",
        "What do we do?",
        "¿Qué hacemos?",
        tr("We ___.", "Nosotros ___."),
      ],
      [
        "Why is it special to our family? Each person can say one thing.",
        "¿Por qué es especial para nuestra familia? Cada persona puede decir una cosa.",
        "Why is it special?",
        "¿Por qué es especial?",
        tr("It is special because ___.", "Es especial porque ___."),
      ],
    ],
  }),
  family({
    id: "community-places",
    title: tr("Community Places", "Lugares de nuestra comunidad"),
    summary: tr(
      "Take readers on a tour of places that matter in your neighborhood.",
      "Lleven a los lectores a recorrer lugares importantes de su barrio.",
    ),
    purpose: tr("Inform", "Informar"),
    targets: [
      tr(
        "Use place words: next to, across from, near.",
        "Usar palabras de lugar: al lado de, enfrente de, cerca de.",
      ),
      tr(
        "Describe what people do in a place with present-tense verbs.",
        "Describir lo que hace la gente en un lugar con verbos en presente.",
      ),
    ],
    finished: tr(
      "A short neighborhood tour book in two languages, with photos.",
      "Un librito de recorrido por el barrio en dos idiomas, con fotos.",
    ),
    teacherNotes: tr(
      "Families can take photos on a walk. Places can be a store, a park, a place of worship or a relative's home.",
      "Las familias pueden tomar fotos en una caminata. Los lugares pueden ser una tienda, un parque, un lugar de culto o la casa de un familiar.",
    ),
    wordBank: [
      tr("next to", "al lado de"),
      tr("across from", "enfrente de"),
      tr("near", "cerca de"),
      tr("store", "tienda"),
      tr("park", "parque"),
      tr("neighbor", "vecino"),
    ],
    example: tr(
      "This is the bakery next to our building. Every Sunday we buy warm bread there. The owner knows our names. Across from it is the park where I learned to ride my bike.",
      "Esta es la panadería al lado de nuestro edificio. Cada domingo compramos pan caliente ahí. El dueño sabe nuestros nombres. Enfrente está el parque donde aprendí a andar en bicicleta.",
    ),
    cover: { bg: "#075568", text: "#ffffff", art: ["obj-map", "bg-city"] },
    pages: [
      [
        "Place 1: what is it and where is it?",
        "Lugar 1: ¿qué es y dónde está?",
        "Name the place and where it is.",
        "Digan qué lugar es y dónde está.",
        tr("This is ___. It is next to ___.", "Este es ___. Está al lado de ___."),
      ],
      [
        "Place 2: what do we do there?",
        "Lugar 2: ¿qué hacemos ahí?",
        "What do we do there?",
        "¿Qué hacemos ahí?",
        tr("At ___, we ___.", "En ___, nosotros ___."),
      ],
      [
        "Our favorite place: why do we love it?",
        "Nuestro lugar favorito: ¿por qué nos encanta?",
        "Why do we love it?",
        "¿Por qué nos encanta?",
        tr("We love ___ because ___.", "Nos encanta ___ porque ___."),
      ],
    ],
  }),
  family({
    id: "favorite-memory",
    title: tr("My Favorite Memory", "Mi recuerdo favorito"),
    summary: tr(
      "Remember one happy moment together and tell it with feelings and details.",
      "Recuerden juntos un momento feliz y cuéntenlo con sentimientos y detalles.",
    ),
    purpose: tr("Narrate", "Narrar"),
    targets: [
      tr(
        "Use feeling words (excited, proud, surprised).",
        "Usar palabras de sentimientos (emocionado, orgulloso, sorprendido).",
      ),
      tr(
        "Add a sense detail: what we saw, heard or tasted.",
        "Agregar un detalle de los sentidos: lo que vimos, oímos o probamos.",
      ),
    ],
    finished: tr(
      "A short memory book in two languages, with a picture and a recording.",
      "Un librito de un recuerdo en dos idiomas, con una imagen y una grabación.",
    ),
    teacherNotes: tr(
      "The child chooses the memory; the grown-up helps with details. Short is fine.",
      "El niño o la niña elige el recuerdo; el adulto ayuda con los detalles. Puede ser corto.",
    ),
    wordBank: [
      tr("happy", "feliz"),
      tr("excited", "emocionado"),
      tr("proud", "orgulloso"),
      tr("surprised", "sorprendido"),
      tr("I saw", "vi"),
      tr("I heard", "oí"),
    ],
    example: tr(
      "My favorite memory is the day my baby brother came home. The house was quiet. I held his tiny hand and he squeezed my finger. I felt proud to be a big sister.",
      "Mi recuerdo favorito es el día que mi hermanito llegó a casa. La casa estaba en silencio. Le tomé la manita y él me apretó el dedo. Me sentí orgullosa de ser hermana mayor.",
    ),
    cover: { bg: "#f2b134", text: "#1b1f3b", art: ["obj-camera", "obj-star"] },
    pages: [
      [
        "What is the memory? Where were we?",
        "¿Cuál es el recuerdo? ¿Dónde estábamos?",
        "What happened and where?",
        "¿Qué pasó y dónde?",
        tr("My favorite memory is ___.", "Mi recuerdo favorito es ___."),
      ],
      [
        "What did we see, hear or taste?",
        "¿Qué vimos, oímos o probamos?",
        "Add a detail.",
        "Agreguen un detalle.",
        tr("I saw ___. I heard ___.", "Vi ___. Oí ___."),
      ],
      [
        "How did we feel? Grown-up: share how you felt too.",
        "¿Cómo nos sentimos? Adulto: comparta también cómo se sintió.",
        "How did we feel?",
        "¿Cómo nos sentimos?",
        tr("I felt ___ because ___.", "Me sentí ___ porque ___."),
      ],
    ],
  }),
  family({
    id: "how-we-make",
    title: tr("How We Make Something", "Cómo hacemos algo"),
    summary: tr(
      "Teach a family recipe or craft: what you need and the steps.",
      "Enseñen una receta o manualidad de la familia: lo que necesitan y los pasos.",
    ),
    purpose: tr("Explain", "Explicar"),
    targets: [
      tr(
        "Write steps with command verbs (mix, cut, fold).",
        "Escribir pasos con verbos de instrucción (mezcla, corta, dobla).",
      ),
      tr(
        "Use order words: first, next, then, last.",
        "Usar palabras de orden: primero, después, luego, al final.",
      ),
    ],
    finished: tr(
      "A short how-to book in two languages: materials, steps and a photo of the result.",
      "Un librito de instrucciones en dos idiomas: materiales, pasos y una foto del resultado.",
    ),
    teacherNotes: tr(
      "A recipe, a craft or a repair all work. Ask families to photograph each step if they can.",
      "Sirve una receta, una manualidad o una reparación. Pide a las familias que tomen foto de cada paso si pueden.",
    ),
    wordBank: [
      tr("ingredients", "ingredientes"),
      tr("materials", "materiales"),
      tr("mix", "mezclar"),
      tr("cut", "cortar"),
      tr("first", "primero"),
      tr("last", "al final"),
    ],
    example: tr(
      "Mango lassi. You need: 1 mango, 1 cup of yogurt, ice. First, cut the mango. Next, put the mango and yogurt in the blender. Then add ice. Last, blend and pour into cups.",
      "Lassi de mango. Necesitas: 1 mango, 1 taza de yogur, hielo. Primero, corta el mango. Después, pon el mango y el yogur en la licuadora. Luego agrega hielo. Al final, licúa y sirve en vasos.",
    ),
    cover: { bg: "#7fb48a", text: "#1b1f3b", art: ["obj-food-bowl", "bg-kitchen"] },
    pages: [
      [
        "What are we making? What do we need? Make a list.",
        "¿Qué vamos a hacer? ¿Qué necesitamos? Hagan una lista.",
        "Ingredients or materials",
        "Ingredientes o materiales",
        tr("You need ___.", "Necesitas ___."),
      ],
      [
        "Steps 1 and 2: what do we do first and next?",
        "Pasos 1 y 2: ¿qué hacemos primero y después?",
        "First, ... Next, ...",
        "Primero, ... Después, ...",
        tr("First, ___.", "Primero, ___."),
      ],
      [
        "Last steps: how do we finish? Add a photo of the result.",
        "Últimos pasos: ¿cómo terminamos? Agreguen una foto del resultado.",
        "Then, ... Last, ...",
        "Luego, ... Al final, ...",
        tr("Last, ___.", "Al final, ___."),
      ],
    ],
  }),
  family({
    id: "story-together",
    title: tr("A Story We Tell Together", "Un cuento que contamos juntos"),
    summary: tr(
      "Share a story your family tells: a folktale, a legend or a made-up bedtime story.",
      "Compartan un cuento que cuenta su familia: un cuento popular, una leyenda o un cuento inventado para dormir.",
    ),
    purpose: tr("Narrate", "Narrar"),
    targets: [
      tr(
        "Use story openers and endings (Once upon a time... The end.).",
        "Usar inicios y finales de cuento (Había una vez... Fin.).",
      ),
      tr(
        "Tell what a character said using said and asked.",
        "Contar lo que dijo un personaje usando dijo y preguntó.",
      ),
    ],
    finished: tr(
      "A short storybook in two languages, with pictures and a family recording.",
      "Un librito de cuento en dos idiomas, con imágenes y una grabación de la familia.",
    ),
    teacherNotes: tr(
      "Many families have stories told aloud, not written. Recording the grown-up telling it is a great choice.",
      "Muchas familias tienen cuentos que se cuentan en voz alta, no por escrito. Grabar al adulto contándolo es una gran opción.",
    ),
    wordBank: [
      tr("once upon a time", "había una vez"),
      tr("said", "dijo"),
      tr("asked", "preguntó"),
      tr("lesson", "lección"),
      tr("brave", "valiente"),
      tr("the end", "fin"),
    ],
    example: tr(
      'Once upon a time, a little turtle wanted to fly. "Carry me!" he asked two birds. They held a stick, and he held it with his mouth. But he opened his mouth to talk and fell into the lake. The lesson: sometimes it is better to listen.',
      'Había una vez una tortuguita que quería volar. "¡Llévenme!", les pidió a dos pájaros. Ellos sostuvieron un palo y ella lo mordió. Pero abrió la boca para hablar y cayó al lago. La lección: a veces es mejor escuchar.',
    ),
    cover: { bg: "#1b2a5c", text: "#fff3c4", art: ["char-owl", "bg-night"] },
    pages: [
      [
        "Beginning: who is in the story and where?",
        "Comienzo: ¿quién está en el cuento y dónde?",
        "Once upon a time...",
        "Había una vez...",
        tr("Once upon a time, ___.", "Había una vez ___."),
      ],
      [
        "Middle: what happens? What does a character say?",
        "Desarrollo: ¿qué pasa? ¿Qué dice un personaje?",
        "What happens? Who says what?",
        "¿Qué pasa? ¿Quién dice qué?",
        tr('___ said, "___."', '___ dijo: "___".'),
      ],
      [
        "End: how does it end? Is there a lesson?",
        "Final: ¿cómo termina? ¿Tiene una lección?",
        "How does it end?",
        "¿Cómo termina?",
        tr("In the end, ___.", "Al final, ___."),
      ],
    ],
  }),

  // 12 ────────────────────────────────────────────────────────────
  {
    id: "mission-report",
    title: tr("Adventure Mission Report", "Informe de misión de aventura"),
    kind: "report",
    format: "landscape",
    grades: BOTH,
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Report on a mission you completed: the goal, your evidence, your conclusion and the language that helped.",
      "Informa sobre una misión que completaste: la meta, tu evidencia, tu conclusión y el lenguaje que te ayudó.",
    ),
    targets: [
      tr(
        "Use past tense to report what you did (I searched, I found, I noticed).",
        "Usar el pasado para informar lo que hiciste (Busqué, encontré, noté).",
      ),
      tr(
        "Connect evidence to a conclusion with so, because and this shows.",
        "Conectar la evidencia con una conclusión usando entonces, porque y esto muestra.",
      ),
      tr("Give advice with should and try to.", "Dar consejos con deberías e intenta."),
    ],
    finished: tr(
      "A 6-page mission report with evidence, a conclusion, reflection and advice for the next explorer.",
      "Un informe de misión de 6 páginas con evidencia, una conclusión, una reflexión y consejos para el próximo explorador.",
    ),
    teacherNotes: tr(
      "Use after any Adventure mission, or any problem-solving task. Pages are generic on purpose, so students fill them from their own mission. Listen for evidence that is specific and a conclusion that uses it (this shows that...). Fade the frames on the conclusion page first.",
      "Úsalo después de cualquier misión de Aventura o tarea de resolver problemas. Las páginas son generales a propósito, para que los estudiantes las llenen con su propia misión. Escucha si la evidencia es específica y si la conclusión la usa (esto muestra que...). Retira primero los marcos de la página de conclusión.",
    ),
    wordBank: [
      tr("mission", "misión"),
      tr("clue", "pista"),
      tr("evidence", "evidencia"),
      tr("I noticed", "noté"),
      tr("so", "entonces"),
      tr("this shows", "esto muestra"),
      tr("conclude", "concluir"),
      tr("explorer", "explorador"),
      tr("should", "deberías"),
    ],
    example: tr(
      'The mission: Find out who left the museum door open. Clues: muddy footprints near the door, a map with the garden circled, a guard who said he heard a cat. Conclusion: The footprints were small and led to the garden, so a visitor\'s dog probably pushed the door. Language: I asked the guard "What did you hear?" Advice: Write every clue down before you decide.',
      'La misión: Descubrir quién dejó abierta la puerta del museo. Pistas: huellas de lodo cerca de la puerta, un mapa con el jardín marcado, un guardia que dijo que oyó un gato. Conclusión: Las huellas eran pequeñas y llevaban al jardín, entonces probablemente el perro de un visitante empujó la puerta. Lenguaje: Le pregunté al guardia "¿Qué oíste?". Consejo: Anota cada pista antes de decidir.',
    ),
    pages: [
      {
        bg: "#0b3d4a",
        bgArt: "bg-island",
        prompt: tr(
          "Name your mission report. Which mission or adventure are you reporting on?",
          "Ponle nombre a tu informe. ¿Sobre qué misión o aventura informas?",
        ),
        elements: [
          shape("rounded", 6, 10, 52, 54, "#1b2a5c"),
          title(9, 14, 46, 28, { color: "#fff3c4", align: "left" }),
          byline(9, 46, 46, 8, { color: "#ffffff", align: "left" }),
          art("obj-map", 64, 54, 18, 22, "A treasure map", "Un mapa del tesoro"),
          art("obj-magnifier", 80, 66, 14, 18, "A magnifying glass", "Una lupa"),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "The mission: what was the goal or problem? Where did it happen?",
          "La misión: ¿cuál era la meta o el problema? ¿Dónde ocurrió?",
        ),
        frames: [
          tr("My mission was to ___.", "Mi misión era ___."),
          tr("It happened at ___.", "Ocurrió en ___."),
        ],
        frames68: [
          tr("The challenge was to ___ without ___.", "El reto era ___ sin ___."),
          tr("To succeed, I needed to ___.", "Para lograrlo, necesitaba ___."),
        ],
        elements: [
          head(6, 6, 50, 9, "The Mission", "La misión", { font: "fraunces", color: "#0b3d4a" }),
          body(
            6,
            18,
            50,
            66,
            "What was the goal? Where were you?",
            "¿Cuál era la meta? ¿Dónde estabas?",
          ),
          img(
            60,
            10,
            34,
            54,
            "Add a screenshot or drawing of the mission.",
            "Agrega una captura o un dibujo de la misión.",
          ),
          art("obj-flag", 72, 68, 12, 22, "A flag", "Una bandera"),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "The clues and evidence I collected: list each clue and where you found it.",
          "Las pistas y la evidencia que reuní: escribe cada pista y dónde la encontraste.",
        ),
        frames: [
          tr("I found ___ at ___.", "Encontré ___ en ___."),
          tr("I noticed ___.", "Noté ___."),
        ],
        frames68: [
          tr("One important piece of evidence was ___.", "Una evidencia importante fue ___."),
          tr("This clue suggested ___.", "Esta pista sugería ___."),
        ],
        elements: [
          head(6, 6, 88, 9, "Clues and Evidence", "Pistas y evidencia", {
            font: "fraunces",
            color: "#0b3d4a",
          }),
          ...[6, 37, 68].map((x, i) =>
            shape("rounded", x, 18, 26, 50, ["#e7f4f2", "#fff3c4", "#f8e8ef"][i], "#0b3d4a"),
          ),
          ...[6, 37, 68].map((x, i) => body(x + 2, 20, 22, 46, `Clue ${i + 1}`, `Pista ${i + 1}`)),
          img(6, 72, 40, 22, "Add a picture of a clue.", "Agrega una imagen de una pista."),
          art("obj-magnifier", 80, 72, 14, 20, "A magnifying glass", "Una lupa"),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "What I concluded and why: what did you figure out? Which clues prove it?",
          "Lo que concluí y por qué: ¿qué descubriste? ¿Qué pistas lo prueban?",
        ),
        frames: [
          tr("I think ___ because ___.", "Creo que ___ porque ___."),
          tr("So, ___.", "Entonces, ___."),
        ],
        frames68: [
          tr("The evidence shows that ___.", "La evidencia muestra que ___."),
          tr("Since ___, I concluded ___.", "Como ___, concluí que ___."),
        ],
        elements: [
          head(6, 6, 88, 9, "My Conclusion", "Mi conclusión", {
            font: "fraunces",
            color: "#1b2a5c",
          }),
          body(6, 18, 40, 70, "Which clues did you use?", "¿Qué pistas usaste?"),
          shape("arrow", 47, 46, 6, 8, "#e86a50"),
          shape("rounded", 54, 18, 40, 70, "#ffffff", "#1b2a5c"),
          body(56, 20, 36, 66, "What did you conclude?", "¿Qué concluiste?"),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          "How I used language to solve it: what did you read, ask, say or write that helped? Record yourself explaining.",
          "Cómo usé el lenguaje para resolverla: ¿qué leíste, preguntaste, dijiste o escribiste que te ayudó? Grábate explicándolo.",
        ),
        frames: [
          tr('I asked, "___?"', 'Pregunté: "¿___?"'),
          tr("I read ___ and it helped me ___.", "Leí ___ y me ayudó a ___."),
        ],
        frames68: [
          tr(
            "A word or phrase that unlocked the mission was ___.",
            "Una palabra o frase que abrió la misión fue ___.",
          ),
          tr(
            "Explaining my thinking helped because ___.",
            "Explicar mi razonamiento me ayudó porque ___.",
          ),
        ],
        elements: [
          head(6, 6, 88, 9, "Language I Used", "El lenguaje que usé", {
            font: "fraunces",
            color: "#9a4a26",
          }),
          {
            t: "bubble",
            variant: "speech",
            tail: "bottom-left",
            x: 6,
            y: 18,
            w: 54,
            h: 30,
            ph: tr("Something you asked or said", "Algo que preguntaste o dijiste"),
          },
          body(
            6,
            54,
            54,
            32,
            "Words or sentences that helped",
            "Palabras u oraciones que te ayudaron",
          ),
          art("obj-microphone", 70, 18, 16, 26, "A microphone", "Un micrófono"),
          { t: "audio", x: 63, y: 54, w: 30, h: 9, label: "Explain how language helped" },
        ],
      },
      {
        bg: "#075568",
        prompt: tr(
          "What I'd tell the next explorer: give two tips for someone starting this mission.",
          "Lo que le diría al próximo explorador: da dos consejos para alguien que empieza esta misión.",
        ),
        frames: [
          tr("You should ___.", "Deberías ___."),
          tr("Watch out for ___.", "Ten cuidado con ___."),
        ],
        frames68: [
          tr("Before you decide, make sure you ___.", "Antes de decidir, asegúrate de ___."),
          tr(
            "The most useful strategy was ___ because ___.",
            "La estrategia más útil fue ___ porque ___.",
          ),
        ],
        elements: [
          head(6, 6, 88, 9, "Tips for the Next Explorer", "Consejos para el próximo explorador", {
            font: "fraunces",
            color: "#fff3c4",
          }),
          shape("rounded", 6, 18, 42, 60, "#ffffff"),
          shape("rounded", 52, 18, 42, 60, "#ffffff"),
          body(8, 20, 38, 56, "Tip 1", "Consejo 1"),
          body(54, 20, 38, 56, "Tip 2", "Consejo 2"),
          art("obj-trophy", 44, 80, 12, 14, "A trophy", "Un trofeo"),
        ],
      },
    ],
  },

  // 13 ────────────────────────────────────────────────────────────
  {
    id: "conversation-book",
    title: tr("Narrated Conversation", "Conversación narrada"),
    kind: "comic",
    format: "comic",
    grades: BOTH,
    family: false,
    tag: "comic",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Turn a Speaking Studio dialogue into a narrated comic with two characters, speech bubbles and your recorded voice.",
      "Convierte un diálogo del Estudio de Expresión Oral en un cómic narrado con dos personajes, globos de diálogo y tu voz grabada.",
    ),
    targets: [
      tr(
        "Take turns in a conversation: greet, ask, answer, respond.",
        "Tomar turnos en una conversación: saludar, preguntar, responder, reaccionar.",
      ),
      tr(
        "Use question forms (What...? Do you...? Why...?).",
        "Usar formas de pregunta (¿Qué...? ¿Tú...? ¿Por qué...?).",
      ),
      tr(
        "Read aloud with expression that matches each speaker's feelings.",
        "Leer en voz alta con una expresión que vaya con los sentimientos de cada personaje.",
      ),
    ],
    finished: tr(
      "A 5-page narrated comic of a two-person conversation, with a recording on every page.",
      "Un cómic narrado de 5 páginas de una conversación entre dos personas, con una grabación en cada página.",
    ),
    teacherNotes: tr(
      "Start from a dialogue the student practiced in the Speaking Studio, or any conversation from class. Students write each turn in a bubble, then record both voices. Listen for complete question forms and responses that answer the question asked. Partners can record one character each.",
      "Empieza con un diálogo que el estudiante practicó en el Estudio de Expresión Oral o con cualquier conversación de la clase. Los estudiantes escriben cada turno en un globo y luego graban las dos voces. Escucha si usan preguntas completas y respuestas que contestan lo que se preguntó. Las parejas pueden grabar un personaje cada uno.",
    ),
    wordBank: [
      tr("Hi, how are you?", "Hola, ¿cómo estás?"),
      tr("What do you think?", "¿Qué piensas?"),
      tr("I agree", "estoy de acuerdo"),
      tr("Really?", "¿De verdad?"),
      tr("because", "porque"),
      tr("Can you", "¿puedes...?"),
      tr("asked", "preguntó"),
      tr("answered", "respondió"),
    ],
    example: tr(
      'Panel 1 — Maya: "Hi, Leo! Why do you look worried?" Leo: "I lost my library book." Panel 2 — Maya: "Where did you see it last?" Leo: "On the bus, I think." Panel 3 — Maya: "Let\'s ask the driver after school." Narrator: That afternoon, the driver held up a blue book and smiled.',
      'Viñeta 1 — Maya: "¡Hola, Leo! ¿Por qué te ves preocupado?" Leo: "Perdí mi libro de la biblioteca." Viñeta 2 — Maya: "¿Dónde lo viste por última vez?" Leo: "En el autobús, creo." Viñeta 3 — Maya: "Preguntémosle al chofer después de clases." Narrador: Esa tarde, el chofer levantó un libro azul y sonrió.',
    ),
    pages: [
      {
        bg: "#fff3c4",
        prompt: tr(
          "Name your comic. Who are the two speakers? Choose or draw two characters.",
          "Ponle nombre a tu cómic. ¿Quiénes son los dos personajes? Elige o dibuja dos personajes.",
        ),
        elements: [
          shape("star", 4, 4, 30, 26, "#e86a50"),
          title(8, 10, 84, 20, { font: "comic", color: "#1b1f3b" }),
          art("char-maya", 10, 36, 30, 46, "A girl with a backpack", "Una niña con mochila"),
          art("char-leo", 60, 36, 30, 46, "A boy waving", "Un niño saludando"),
          art("fx-zoom", 42, 46, 16, 16, "Motion lines", "Líneas de movimiento"),
          byline(20, 86, 60, 7, { color: "#1b1f3b", font: "comic" }),
        ],
      },
      ...[
        [
          "Opening: the characters greet each other and one asks a question. Write each turn in a bubble, then record both voices.",
          "Inicio: los personajes se saludan y uno hace una pregunta. Escribe cada turno en un globo y luego graba las dos voces.",
          [tr("Hi, ___! How ___?", "¡Hola, ___! ¿Cómo ___?"), tr("What ___?", "¿Qué ___?")],
          [tr("Hey, ___, can I ask you about ___?", "Oye, ___, ¿te puedo preguntar sobre ___?")],
          "#ffffff",
        ],
        [
          "Middle: the second character answers and gives a reason. The first character reacts with a follow-up question.",
          "Desarrollo: el segundo personaje responde y da una razón. El primero reacciona con otra pregunta.",
          [
            tr("I think ___ because ___.", "Creo que ___ porque ___."),
            tr("Really? Why ___?", "¿De verdad? ¿Por qué ___?"),
          ],
          [tr("That makes sense, but what about ___?", "Tiene sentido, pero ¿qué tal ___?")],
          "#e7f4f2",
        ],
        [
          "Ending: the characters agree, decide or solve something. Add a narrator caption that tells what happened next.",
          "Final: los personajes se ponen de acuerdo, deciden o resuelven algo. Agrega un recuadro del narrador que cuente qué pasó después.",
          [tr("Let's ___.", "Vamos a ___."), tr("Later, ___.", "Más tarde, ___.")],
          [
            tr("So we agreed to ___.", "Así que acordamos ___."),
            tr("By the end of the day, ___.", "Al final del día, ___."),
          ],
          "#f8e8ef",
        ],
      ].map(([pen, pes, frames, frames68, bg]) => ({
        bg,
        prompt: tr(pen, pes),
        frames,
        frames68,
        elements: [
          { t: "panel", x: 4, y: 4, w: 44, h: 76 },
          { t: "panel", x: 52, y: 4, w: 44, h: 76 },
          {
            t: "bubble",
            variant: "caption",
            tail: "none",
            x: 6,
            y: 6,
            w: 40,
            h: 9,
            ph: tr("Narrator: where and when?", "Narrador: ¿dónde y cuándo?"),
          },
          {
            t: "bubble",
            variant: "speech",
            tail: "bottom-left",
            x: 8,
            y: 18,
            w: 36,
            h: 22,
            ph: tr("Character 1 says...", "El personaje 1 dice..."),
          },
          img(10, 46, 30, 32, "Draw or add character 1.", "Dibuja o agrega al personaje 1."),
          {
            t: "bubble",
            variant: "speech",
            tail: "bottom-right",
            x: 56,
            y: 10,
            w: 36,
            h: 24,
            ph: tr("Character 2 says...", "El personaje 2 dice..."),
          },
          {
            t: "bubble",
            variant: "thought",
            tail: "bottom-left",
            x: 58,
            y: 36,
            w: 30,
            h: 12,
            ph: tr("What are they thinking?", "¿Qué está pensando?"),
          },
          img(60, 50, 30, 28, "Draw or add character 2.", "Dibuja o agrega al personaje 2."),
          { t: "audio", x: 35, y: 84, w: 30, h: 9, label: "Narrate this page" },
        ],
      })),
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Behind the scenes: which line was hardest to say, and how did you practice it? Record your reflection.",
          "Detrás de escena: ¿qué línea fue la más difícil de decir y cómo la practicaste? Graba tu reflexión.",
        ),
        frames: [
          tr("The hardest line was ___.", "La línea más difícil fue ___."),
          tr("I practiced by ___.", "Practiqué ___."),
        ],
        frames68: [
          tr(
            "To sound like ___, I changed my voice by ___.",
            "Para sonar como ___, cambié mi voz ___.",
          ),
          tr("Next time I would ___.", "La próxima vez yo ___."),
        ],
        elements: [
          head(6, 6, 88, 9, "Behind the Scenes", "Detrás de escena", {
            font: "comic",
            color: "#fff3c4",
          }),
          art("obj-microphone", 8, 20, 18, 24, "A microphone", "Un micrófono"),
          body(
            30,
            20,
            64,
            56,
            "How did you turn the dialogue into a comic?",
            "¿Cómo convertiste el diálogo en un cómic?",
            { color: "#ffffff" },
          ),
          { t: "audio", x: 35, y: 82, w: 30, h: 9, label: "Record your reflection" },
        ],
      },
    ],
  },
];

/** Family template builder: cover + three bilingual pages + a "we made this together" page. */
function family({
  id,
  title: t,
  summary,
  purpose,
  targets,
  finished,
  teacherNotes,
  wordBank,
  example,
  cover,
  pages,
}) {
  const [a1, a2] = cover.art;
  const coverEls = [
    a2.startsWith("bg-")
      ? art(a2, 6, 44, 88, 40, "A background scene", "Una escena de fondo")
      : art(a2, 66, 52, 26, 30, "A picture for the cover", "Una imagen para la portada"),
    art(a1, 8, 50, 30, 36, "A picture for the cover", "Una imagen para la portada"),
    title(8, 8, 84, 22, { color: cover.text, font: "rounded" }),
    byline(10, 32, 80, 8, { color: cover.text }),
  ];
  coverEls[3].ph = tr("by (your name) and family", "por (tu nombre) y familia");
  return {
    id,
    title: t,
    kind: "bilingual",
    format: "landscape",
    grades: BOTH,
    family: true,
    tag: "family",
    purpose,
    summary,
    targets,
    finished,
    teacherNotes,
    wordBank,
    example,
    pages: [
      {
        bg: cover.bg,
        prompt: tr(
          "Make a cover together. Write everyone's names.",
          "Hagan una portada juntos. Escriban los nombres de todos.",
        ),
        elements: coverEls,
      },
      ...pages.map(([pen, pes, hen, hes, frame], i) => ({
        bg: ["#fffaf0", "#e7f4f2", "#f8e8ef"][i % 3],
        prompt: tr(pen, pes),
        frames: [frame],
        frames68: [frame],
        elements: [
          img(6, 5, 40, 34, "Add a photo or drawing.", "Agreguen una foto o un dibujo."),
          art(
            ["obj-heart", "obj-star", "nat-flower"][i % 3],
            80,
            8,
            12,
            18,
            "A small decoration",
            "Una pequeña decoración",
          ),
          cap(50, 10, 28, 26, hen, hes, { size: 3 }),
          ...familyPair(42, 36, hen, hes),
          audio(35, 87, "Read it aloud together"),
        ],
      })),
      {
        bg: "#fff3c4",
        prompt: tr(
          "We made this together! Each person writes or says one thing they liked.",
          "¡Lo hicimos juntos! Cada persona escribe o dice algo que le gustó.",
        ),
        frames: [tr("I liked ___.", "Me gustó ___.")],
        frames68: [tr("I liked ___.", "Me gustó ___.")],
        elements: [
          head(6, 6, 88, 9, "We Made This Together", "Lo hicimos juntos", {
            font: "rounded",
            align: "center",
            color: "#1b1f3b",
          }),
          ...familyPair(18, 50, "What did each of us like?", "¿Qué le gustó a cada uno?"),
          audio(35, 84, "Record a message together"),
        ],
      },
    ],
  };
}
