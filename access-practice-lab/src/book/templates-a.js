// Book Studio templates, set A: 13 genre templates (narrative, informational, report, argument, comic).
// Pure data in the shorthand that model.js `bookFromTemplate` expands; students write every idea themselves.

const tr = (en, es) => ({ en, es });
const F = (...pairs) => pairs.map(([en, es]) => tr(en, es));
const TITLE = (x, y, w, h, style) => ({ t: "text", role: "title", x, y, w, h, style });
const BYLINE = (x, y, w, h, style) => ({
  t: "text",
  role: "body",
  x,
  y,
  w,
  h,
  ph: tr("by (your name)", "por (tu nombre)"),
  style,
});
/** Prefilled structural label (never the student's idea). */
const H = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "heading",
  x,
  y,
  w,
  h,
  text: tr(en, es),
  style: { size: 4.6, font: "fraunces", ...style },
});
/** Heading the student writes (placeholder only). */
const HP = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "heading",
  x,
  y,
  w,
  h,
  ph: tr(en, es),
  style: { size: 4.6, font: "fraunces", ...style },
});
const B = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "body",
  x,
  y,
  w,
  h,
  ph: tr(en, es),
  style: { size: 3.2, ...style },
});
const CAP = (x, y, w, h, en, es, style = {}) => ({
  t: "text",
  role: "caption",
  x,
  y,
  w,
  h,
  ph: tr(en, es),
  style: { size: 2.5, ...style },
});
const IMG = (x, y, w, h, en, es) => ({ t: "image", x, y, w, h, alt: "", ph: tr(en, es) });
const ART = (art, x, y, w, h, en, es) => ({ t: "art", art, x, y, w, h, alt: tr(en, es) });
const SH = (shape, x, y, w, h, fill, stroke = "none", strokeW = 0.6) => ({
  t: "shape",
  shape,
  x,
  y,
  w,
  h,
  fill,
  stroke,
  strokeW,
});
const AUD = (x, y, label = "Read this page aloud") => ({ t: "audio", x, y, w: 30, h: 9, label });
const BUB = (variant, tail, x, y, w, h, en, es) => ({
  t: "bubble",
  variant,
  tail,
  x,
  y,
  w,
  h,
  ph: tr(en, es),
});
const PANEL = (x, y, w, h) => ({ t: "panel", x, y, w, h });

export const TEMPLATES_A = [
  // 1 ─────────────────────────────────────────────────────────────
  {
    id: "personal-narrative",
    title: tr("My Personal Narrative", "Mi narración personal"),
    kind: "narrative",
    format: "portrait",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "narrative",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Tell the story of one real moment from your life, from beginning to end.",
      "Cuenta la historia de un momento real de tu vida, del principio al final.",
    ),
    targets: F(
      [
        "Use time-order words (first, then, after that, finally) to connect events.",
        "Usar palabras de orden (primero, luego, después, al final) para conectar los sucesos.",
      ],
      [
        "Tell past events with past-tense verbs (walked, saw, felt).",
        "Contar sucesos pasados con verbos en pasado (caminé, vi, sentí).",
      ],
      [
        "Describe feelings with precise words instead of 'good' or 'bad'.",
        "Describir sentimientos con palabras precisas en lugar de 'bien' o 'mal'.",
      ],
    ),
    finished: tr(
      "A 6-page illustrated story about one real moment, with your voice reading each page.",
      "Una historia ilustrada de 6 páginas sobre un momento real, con tu voz leyendo cada página.",
    ),
    teacherNotes: tr(
      "Launch by telling a 30-second story of your own and asking students to name the beginning, the big moment and the ending. Listen for past-tense verbs and time-order words in their rehearsal before they write. Students who need it can tell the story aloud into the audio slot first, then write; fade the sentence starters once the sequence words appear on their own.",
      "Empiece contando una historia propia de 30 segundos y pida a los estudiantes que nombren el principio, el gran momento y el final. Escuche verbos en pasado y palabras de orden cuando ensayen antes de escribir. Quien lo necesite puede contar la historia en voz alta en el espacio de audio y luego escribirla; retire los inicios de oración cuando las palabras de orden aparezcan solas.",
    ),
    wordBank: F(
      ["first", "primero"],
      ["then", "luego"],
      ["suddenly", "de repente"],
      ["after that", "después de eso"],
      ["finally", "al final"],
      ["nervous", "nervioso / nerviosa"],
      ["proud", "orgulloso / orgullosa"],
      ["remember", "recordar"],
      ["moment", "momento"],
    ),
    example: tr(
      "The first time I rode the city bus alone, my hands were shaking. First, I counted my coins three times at the bus stop. Then the bus came, louder than I remembered. I climbed the steps and dropped the coins into the box. Suddenly, I could not remember my stop! I looked out the window and saw the bakery with the red door. That was my sign. I pressed the button and stepped off. Finally, I walked into my grandmother's kitchen, and she smiled. I felt proud, like I had grown taller in one afternoon.",
      "La primera vez que viajé solo en el autobús de la ciudad, me temblaban las manos. Primero, conté mis monedas tres veces en la parada. Luego llegó el autobús, más ruidoso de lo que recordaba. Subí los escalones y eché las monedas en la caja. ¡De repente, no recordaba mi parada! Miré por la ventana y vi la panadería de la puerta roja. Esa era mi señal. Apreté el botón y bajé. Al final, entré a la cocina de mi abuela y ella sonrió. Me sentí orgulloso, como si hubiera crecido en una sola tarde.",
    ),
    pages: [
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Make your cover. Draw or add a picture of your moment, and write your name.",
          "Haz tu portada. Dibuja o agrega una imagen de tu momento y escribe tu nombre.",
        ),
        elements: [
          SH("ellipse", 52, 4, 44, 30, "#f2b134"),
          ART("nat-sun", 62, 8, 24, 22, tr("A bright sun", "Un sol brillante")),
          SH("star", 8, 8, 8, 6, "#fff3c4"),
          SH("star", 20, 16, 5, 4, "#fff3c4"),
          IMG(
            10,
            36,
            80,
            30,
            "Add a photo or drawing of your moment.",
            "Agrega una foto o un dibujo de tu momento.",
          ),
          TITLE(6, 69, 88, 14, { color: "#ffffff", font: "fraunces", size: 7.5, align: "center" }),
          BYLINE(6, 85, 88, 7, { color: "#fff3c4", align: "center", size: 3.4 }),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Set the scene. Where were you, who was with you, and what were you doing when it started?",
          "Presenta la escena. ¿Dónde estabas, quién estaba contigo y qué hacías cuando empezó?",
        ),
        frames: F(
          ["It all started when ___.", "Todo empezó cuando ___."],
          ["I was at ___ with ___.", "Yo estaba en ___ con ___."],
        ),
        frames68: F(
          [
            "The moment I remember most began on a ___ day at ___.",
            "El momento que más recuerdo empezó un día ___ en ___.",
          ],
          [
            "Before anything happened, I was ___, and I never expected ___.",
            "Antes de que pasara algo, yo estaba ___ y nunca esperé ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "The Beginning", "El principio"),
          IMG(
            6,
            15,
            88,
            34,
            "Draw the place where your story starts.",
            "Dibuja el lugar donde empieza tu historia.",
          ),
          B(
            6,
            52,
            88,
            31,
            "Who was there? Where were you? What were you doing?",
            "¿Quién estaba? ¿Dónde estabas? ¿Qué hacías?",
          ),
          AUD(6, 85),
        ],
      },
      {
        bg: "#e7f4f2",
        prompt: tr(
          "What happened next? Tell two or three events in order, using time-order words.",
          "¿Qué pasó después? Cuenta dos o tres sucesos en orden con palabras de orden.",
        ),
        frames: F(["Then ___.", "Luego ___."], ["After that, ___.", "Después de eso, ___."]),
        frames68: F(
          ["As the minutes passed, ___.", "A medida que pasaban los minutos, ___."],
          ["Meanwhile, ___, which made me ___.", "Mientras tanto, ___, lo que me hizo ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "Then...", "Luego..."),
          B(
            6,
            15,
            52,
            44,
            "Tell what happened, step by step. Use words like first, then, after that.",
            "Cuenta lo que pasó, paso a paso. Usa palabras como primero, luego, después de eso.",
          ),
          IMG(61, 15, 33, 44, "Draw one event.", "Dibuja un suceso."),
          SH("arrow", 30, 63, 40, 8, "#075568"),
          B(
            6,
            74,
            88,
            10,
            "What made the story start to change?",
            "¿Qué hizo que la historia empezara a cambiar?",
            { size: 2.9 },
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "Write the big moment. Slow it down: what did you see, hear and feel? What did someone say?",
          "Escribe el gran momento. Hazlo despacio: ¿qué viste, oíste y sentiste? ¿Qué dijo alguien?",
        ),
        frames: F(
          ["Suddenly, ___.", "De repente, ___."],
          ["I felt ___ because ___.", "Me sentí ___ porque ___."],
          ['"___," said ___.', '"___", dijo ___.'],
        ),
        frames68: F(
          [
            "In that instant, my heart ___ and I realized ___.",
            "En ese instante, mi corazón ___ y me di cuenta de que ___.",
          ],
          [
            "I could hear ___, and all I could think was ___.",
            "Podía oír ___ y lo único que pensaba era ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "The Big Moment", "El gran momento", { color: "#5a1e3a" }),
          SH("rounded", 4, 15, 92, 40, "#ffffff", "#8a3a5c"),
          IMG(
            7,
            18,
            86,
            34,
            "Draw the most important moment.",
            "Dibuja el momento más importante.",
          ),
          B(
            6,
            58,
            88,
            26,
            "What did you see, hear and feel? Add what someone said.",
            "¿Qué viste, oíste y sentiste? Agrega lo que dijo alguien.",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "How did it end? Tell the last event and how things were different afterward.",
          "¿Cómo terminó? Cuenta el último suceso y qué cambió después.",
        ),
        frames: F(
          ["Finally, ___.", "Al final, ___."],
          ["In the end, ___.", "Al final de todo, ___."],
        ),
        frames68: F(
          ["By the time it was over, ___.", "Para cuando terminó, ___."],
          ["When I finally ___, everything felt ___.", "Cuando por fin ___, todo se sintió ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "The Ending", "El final"),
          IMG(6, 15, 42, 40, "Draw how it ended.", "Dibuja cómo terminó."),
          B(
            51,
            15,
            43,
            40,
            "What was the last thing that happened?",
            "¿Qué fue lo último que pasó?",
          ),
          B(6, 58, 88, 25, "How were things different afterward?", "¿Qué fue diferente después?"),
          AUD(6, 86),
        ],
      },
      {
        bg: "#f8e8ef",
        prompt: tr(
          "Reflect. Why does this moment matter to you? What did you learn about yourself?",
          "Reflexiona. ¿Por qué es importante este momento para ti? ¿Qué aprendiste de ti?",
        ),
        frames: F(
          ["I will always remember this because ___.", "Siempre recordaré esto porque ___."],
          ["Now I know ___.", "Ahora sé que ___."],
        ),
        frames68: F(
          [
            "Looking back, this moment taught me ___.",
            "Al mirar atrás, este momento me enseñó ___.",
          ],
          ["Since then, I have ___ whenever ___.", "Desde entonces, ___ cada vez que ___."],
        ),
        elements: [
          ART("obj-heart", 76, 5, 18, 14, tr("A heart", "Un corazón")),
          H(6, 7, 68, 9, "Why It Matters", "Por qué es importante", { color: "#5a1e3a" }),
          B(
            6,
            22,
            88,
            42,
            "Why do you still remember this moment? What did you learn?",
            "¿Por qué todavía recuerdas este momento? ¿Qué aprendiste?",
          ),
          IMG(
            28,
            66,
            44,
            18,
            "Add a small picture or symbol.",
            "Agrega una imagen pequeña o un símbolo.",
          ),
          AUD(6, 86),
        ],
      },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────
  {
    id: "my-community",
    title: tr("My Community", "Mi comunidad"),
    kind: "informational",
    format: "landscape",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Inform", "Informar"),
    summary: tr(
      "Teach readers about the places, people and traditions of the community you know.",
      "Enséñales a los lectores sobre los lugares, las personas y las tradiciones de tu comunidad.",
    ),
    targets: F(
      [
        "Use there is / there are and location words (next to, across from, near) to describe places.",
        "Usar hay y palabras de lugar (al lado de, enfrente de, cerca de) para describir lugares.",
      ],
      [
        "Use present-tense verbs to explain what people do every day (works, helps, sells).",
        "Usar verbos en presente para explicar lo que hace la gente cada día (trabaja, ayuda, vende).",
      ],
      [
        "Add a detail or example after each main idea with for example or such as.",
        "Agregar un detalle o ejemplo después de cada idea principal con por ejemplo o como.",
      ],
    ),
    finished: tr(
      "A 6-page guide to your community with a map, photos or drawings, and your narration.",
      "Una guía de 6 páginas sobre tu comunidad con un mapa, fotos o dibujos y tu narración.",
    ),
    teacherNotes: tr(
      "Start with a quick neighborhood walk on paper: students sketch three places between home and school. Listen for location words and present-tense verbs as they describe the sketch to a partner. Family photos or interviews make strong evidence; the location-word bank can be removed once students use it without looking.",
      "Empiece con un paseo rápido por el barrio en papel: los estudiantes dibujan tres lugares entre la casa y la escuela. Escuche palabras de lugar y verbos en presente cuando describan el dibujo a un compañero. Las fotos o entrevistas familiares son buena evidencia; puede quitar el banco de palabras de lugar cuando lo usen sin mirarlo.",
    ),
    wordBank: F(
      ["neighborhood", "barrio / vecindario"],
      ["next to", "al lado de"],
      ["across from", "enfrente de"],
      ["near", "cerca de"],
      ["library", "biblioteca"],
      ["market", "mercado"],
      ["neighbor", "vecino / vecina"],
      ["tradition", "tradición"],
      ["celebrate", "celebrar"],
      ["improve", "mejorar"],
    ),
    example: tr(
      "My community is a busy neighborhood near the harbor. There are tall row houses, a small park and a market that opens every Saturday. The library is across from my school. Ms. Ortiz works there, and she helps kids find books in English and Spanish. Every summer, my neighbors celebrate with a street festival. For example, families cook food from many countries and share it on long tables. One thing I would improve is the playground, because the swings are broken. My community is loud, but it feels like home.",
      "Mi comunidad es un barrio muy activo cerca del puerto. Hay casas altas en fila, un parque pequeño y un mercado que abre todos los sábados. La biblioteca está enfrente de mi escuela. La señora Ortiz trabaja allí y ayuda a los niños a encontrar libros en inglés y en español. Cada verano, mis vecinos celebran con una fiesta en la calle. Por ejemplo, las familias cocinan comida de muchos países y la comparten en mesas largas. Algo que mejoraría es el parque de juegos, porque los columpios están rotos. Mi comunidad es ruidosa, pero se siente como mi hogar.",
    ),
    pages: [
      {
        bg: "#075568",
        bgArt: "bg-city",
        prompt: tr(
          "Make your cover. Add a photo or drawing of a place in your community.",
          "Haz tu portada. Agrega una foto o un dibujo de un lugar de tu comunidad.",
        ),
        elements: [
          SH("rounded", 6, 50, 58, 42, "#075568"),
          TITLE(9, 54, 52, 20, { color: "#ffffff", font: "fraunces", size: 7 }),
          BYLINE(9, 78, 52, 9, { color: "#fff3c4", size: 3.2 }),
          ART("obj-house", 70, 8, 22, 26, tr("A house", "Una casa")),
          IMG(
            68,
            40,
            26,
            50,
            "Add a picture of your community.",
            "Agrega una imagen de tu comunidad.",
          ),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Introduce your community. Where is it, and what is it like? Draw a simple map.",
          "Presenta tu comunidad. ¿Dónde está y cómo es? Dibuja un mapa sencillo.",
        ),
        frames: F(
          ["My community is in ___.", "Mi comunidad está en ___."],
          ["There are ___ and ___.", "Hay ___ y ___."],
        ),
        frames68: F(
          [
            "My community is a ___ neighborhood known for ___.",
            "Mi comunidad es un barrio ___ conocido por ___.",
          ],
          [
            "If you walked down my street, you would notice ___.",
            "Si caminaras por mi calle, notarías ___.",
          ],
        ),
        elements: [
          H(5, 6, 90, 10, "Where I Live", "Donde vivo"),
          ART("obj-map", 5, 19, 10, 12, tr("A map", "Un mapa")),
          IMG(
            5,
            33,
            42,
            50,
            "Draw a map: your home, your school and two more places.",
            "Dibuja un mapa: tu casa, tu escuela y dos lugares más.",
          ),
          B(
            51,
            19,
            44,
            62,
            "Where is your community? What is it like? Use there is and there are.",
            "¿Dónde está tu comunidad? ¿Cómo es? Usa hay.",
          ),
          AUD(65, 85),
        ],
      },
      {
        bg: "#e7f4f2",
        prompt: tr(
          "Describe two important places. Tell where each one is and what people do there.",
          "Describe dos lugares importantes. Di dónde está cada uno y qué hace la gente allí.",
        ),
        frames: F(
          ["The ___ is next to ___.", "El / La ___ está al lado de ___."],
          ["People go there to ___.", "La gente va allí para ___."],
        ),
        frames68: F(
          [
            "Located across from ___, the ___ is where ___.",
            "Ubicado enfrente de ___, el / la ___ es donde ___.",
          ],
          ["This place matters because ___.", "Este lugar es importante porque ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "Important Places", "Lugares importantes"),
          SH("rounded", 5, 19, 43, 70, "#ffffff", "#075568"),
          SH("rounded", 52, 19, 43, 70, "#ffffff", "#075568"),
          IMG(8, 22, 37, 28, "Place 1", "Lugar 1"),
          B(
            8,
            52,
            37,
            34,
            "Name the place. Where is it? What do people do there?",
            "Nombra el lugar. ¿Dónde está? ¿Qué hace la gente allí?",
          ),
          IMG(55, 22, 37, 28, "Place 2", "Lugar 2"),
          B(
            55,
            52,
            37,
            34,
            "Name the place. Where is it? What do people do there?",
            "Nombra el lugar. ¿Dónde está? ¿Qué hace la gente allí?",
          ),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          "Who helps your community? Describe one person and the work they do every day.",
          "¿Quién ayuda a tu comunidad? Describe a una persona y el trabajo que hace cada día.",
        ),
        frames: F(
          ["___ works at ___.", "___ trabaja en ___."],
          ["Every day, she / he ___.", "Todos los días, ella / él ___."],
        ),
        frames68: F(
          ["Without ___, our community would ___.", "Sin ___, nuestra comunidad ___."],
          ["One way ___ helps is by ___.", "Una forma en que ___ ayuda es ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "People Who Help", "Personas que ayudan", { color: "#9a4a26" }),
          IMG(5, 19, 34, 50, "Add a picture of the helper.", "Agrega una imagen de la persona."),
          CAP(5, 71, 34, 8, "Write the person's job.", "Escribe el trabajo de la persona."),
          B(
            43,
            19,
            52,
            62,
            "Who is this person? What do they do every day? How do they help?",
            "¿Quién es esta persona? ¿Qué hace cada día? ¿Cómo ayuda?",
          ),
          AUD(5, 83),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "Share a tradition or celebration. What happens, and why is it special?",
          "Comparte una tradición o celebración. ¿Qué pasa y por qué es especial?",
        ),
        frames: F(
          ["Every ___, we celebrate ___.", "Cada ___, celebramos ___."],
          ["For example, ___.", "Por ejemplo, ___."],
        ),
        frames68: F(
          [
            "One tradition that brings people together is ___.",
            "Una tradición que une a la gente es ___.",
          ],
          [
            "During this celebration, people ___, such as ___.",
            "Durante esta celebración, la gente ___, como ___.",
          ],
        ),
        elements: [
          ART("fx-sparkles", 82, 4, 13, 12, tr("Sparkles", "Destellos")),
          H(5, 6, 76, 10, "A Tradition We Share", "Una tradición que compartimos"),
          B(
            5,
            19,
            50,
            62,
            "What tradition or celebration happens here? What do people do? Give an example.",
            "¿Qué tradición o celebración hay aquí? ¿Qué hace la gente? Da un ejemplo.",
          ),
          IMG(
            59,
            19,
            36,
            62,
            "Add a photo or drawing of the celebration.",
            "Agrega una foto o un dibujo de la celebración.",
          ),
          AUD(5, 85),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Close your guide. What is one thing you love and one thing you would improve? Why?",
          "Cierra tu guía. ¿Qué es algo que te encanta y algo que mejorarías? ¿Por qué?",
        ),
        frames: F(
          ["I love ___ because ___.", "Me encanta ___ porque ___."],
          ["I would improve ___ by ___.", "Yo mejoraría ___ con ___."],
        ),
        frames68: F(
          [
            "What makes my community special is ___.",
            "Lo que hace especial a mi comunidad es ___.",
          ],
          [
            "One change that would help is ___, because ___.",
            "Un cambio que ayudaría es ___, porque ___.",
          ],
        ),
        elements: [
          H(5, 6, 90, 10, "My Community, My Ideas", "Mi comunidad, mis ideas"),
          H(5, 19, 43, 8, "What I love", "Lo que me encanta", { size: 3.6, font: "rounded" }),
          B(
            5,
            28,
            43,
            50,
            "What do you love about your community? Why?",
            "¿Qué te encanta de tu comunidad? ¿Por qué?",
          ),
          H(52, 19, 43, 8, "What I would improve", "Lo que mejoraría", {
            size: 3.6,
            font: "rounded",
          }),
          B(
            52,
            28,
            43,
            50,
            "What would you change? How would it help people?",
            "¿Qué cambiarías? ¿Cómo ayudaría a la gente?",
          ),
          AUD(35, 83),
        ],
      },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────
  {
    id: "science-investigation",
    title: tr("Science Investigation", "Investigación científica"),
    kind: "report",
    format: "portrait",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Report an investigation from your question to your claim, evidence and reasoning.",
      "Informa sobre una investigación, desde tu pregunta hasta tu afirmación, evidencia y razonamiento.",
    ),
    targets: F(
      [
        "Write a hypothesis with If ___, then ___ because ___.",
        "Escribir una hipótesis con Si ___, entonces ___ porque ___.",
      ],
      [
        "Use command verbs and sequence words to write a procedure (First, pour...; Next, measure...).",
        "Usar verbos de instrucción y palabras de secuencia para escribir un procedimiento (Primero, vierte...; Luego, mide...).",
      ],
      [
        "Connect evidence to a claim with The data show... and This means...",
        "Conectar la evidencia con una afirmación usando Los datos muestran... y Esto significa...",
      ],
      [
        "Use comparison words (more than, less than, the most) to describe data.",
        "Usar palabras de comparación (más que, menos que, el / la más) para describir datos.",
      ],
    ),
    finished: tr(
      "A 6-page lab report with your hypothesis, procedure, a chart or drawing of your data, and a claim backed by evidence.",
      "Un informe de laboratorio de 6 páginas con tu hipótesis, el procedimiento, una gráfica o dibujo de tus datos y una afirmación con evidencia.",
    ),
    teacherNotes: tr(
      "Use this after a hands-on investigation so students write from real data. Listen for If/then language in the hypothesis and for students pointing at numbers when they state a claim. The CER frames are the heaviest scaffold; have 6-8 students try reasoning without them once they have written one CER together.",
      "Úselo después de una investigación práctica para que escriban con datos reales. Escuche el lenguaje Si/entonces en la hipótesis y que señalen números al hacer una afirmación. Los inicios de AER (afirmación, evidencia, razonamiento) son el apoyo más fuerte; pida a los estudiantes de 6-8 que intenten el razonamiento sin ellos después de escribir uno juntos.",
    ),
    wordBank: F(
      ["question", "pregunta"],
      ["hypothesis", "hipótesis"],
      ["materials", "materiales"],
      ["procedure", "procedimiento"],
      ["measure", "medir"],
      ["data", "datos"],
      ["claim", "afirmación"],
      ["evidence", "evidencia"],
      ["reasoning", "razonamiento"],
      ["variable", "variable"],
      ["result", "resultado"],
    ),
    example: tr(
      "Question: Does the color of a cup change how fast ice melts in the sun? Hypothesis: If an ice cube is in a black cup, then it will melt faster than in a white cup, because dark colors absorb more light. First, we put one ice cube in each cup. Next, we set both cups in the same sunny spot. Then we checked them every five minutes. The data show that the ice in the black cup melted in 20 minutes, and the ice in the white cup melted in 35 minutes. This means dark colors absorb more energy from light.",
      "Pregunta: ¿El color de un vaso cambia qué tan rápido se derrite el hielo al sol? Hipótesis: Si un cubo de hielo está en un vaso negro, entonces se derretirá más rápido que en un vaso blanco, porque los colores oscuros absorben más luz. Primero, pusimos un cubo de hielo en cada vaso. Luego, colocamos los dos vasos en el mismo lugar soleado. Después, los revisamos cada cinco minutos. Los datos muestran que el hielo del vaso negro se derritió en 20 minutos y el del vaso blanco en 35 minutos. Esto significa que los colores oscuros absorben más energía de la luz.",
    ),
    pages: [
      {
        bg: "#e9edf8",
        bgArt: "bg-lab",
        prompt: tr(
          "Make your cover. Your title can be your investigation question.",
          "Haz tu portada. Tu título puede ser la pregunta de tu investigación.",
        ),
        elements: [
          SH("rect", 4, 6, 92, 34, "#1b2a5c"),
          TITLE(8, 9, 84, 20, { color: "#ffffff", font: "atkinson", size: 7, align: "left" }),
          BYLINE(8, 30, 60, 7, { color: "#fff3c4", size: 3.2 }),
          ART("sci-flask", 8, 50, 26, 34, tr("A science flask", "Un matraz de ciencias")),
          ART("char-scientist", 56, 44, 36, 48, tr("A young scientist", "Una joven científica")),
          ART("sci-microscope", 34, 64, 20, 26, tr("A microscope", "Un microscopio")),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "What question are you testing? Then predict the answer with a hypothesis.",
          "¿Qué pregunta estás investigando? Luego predice la respuesta con una hipótesis.",
        ),
        frames: F(
          ["My question is: Does ___ change ___?", "Mi pregunta es: ¿___ cambia ___?"],
          ["If ___, then ___ because ___.", "Si ___, entonces ___ porque ___."],
        ),
        frames68: F(
          ["I am investigating how ___ affects ___.", "Estoy investigando cómo ___ afecta ___."],
          [
            "I predict that if ___ increases, then ___ will ___, because ___.",
            "Predigo que si ___ aumenta, entonces ___ va a ___, porque ___.",
          ],
        ),
        elements: [
          ART("obj-question", 80, 4, 14, 12, tr("A question mark", "Un signo de interrogación")),
          H(6, 5, 72, 9, "My Question", "Mi pregunta", { color: "#075568" }),
          B(
            6,
            16,
            88,
            22,
            "What do you want to find out? Write it as a question.",
            "¿Qué quieres averiguar? Escríbelo como pregunta.",
          ),
          SH("rounded", 4, 42, 92, 42, "#e7f4f2", "#075568"),
          H(8, 45, 84, 8, "My Hypothesis", "Mi hipótesis", { color: "#075568" }),
          B(
            8,
            55,
            84,
            26,
            "If ___, then ___ because ___. What do you predict, and why?",
            "Si ___, entonces ___ porque ___. ¿Qué predices y por qué?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "List your materials. Then write the steps so another scientist could repeat your test.",
          "Haz la lista de materiales. Luego escribe los pasos para que otra persona pueda repetir tu prueba.",
        ),
        frames: F(
          ["First, ___.", "Primero, ___."],
          ["Next, ___.", "Luego, ___."],
          ["Last, ___.", "Por último, ___."],
        ),
        frames68: F(
          [
            "To keep the test fair, I kept ___ the same.",
            "Para que la prueba fuera justa, mantuve ___ igual.",
          ],
          [
            "After ___ minutes, measure ___ and record it.",
            "Después de ___ minutos, mide ___ y anótalo.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "Materials", "Materiales"),
          SH("rounded", 4, 14, 38, 50, "#ffffff", "#1b2a5c"),
          B(
            7,
            16,
            32,
            46,
            "List everything you used, with amounts.",
            "Escribe todo lo que usaste, con cantidades.",
          ),
          H(46, 5, 48, 8, "Procedure", "Procedimiento"),
          B(
            46,
            14,
            50,
            50,
            "Write numbered steps. Start each one with an action word: pour, measure, wait.",
            "Escribe pasos numerados. Empieza cada uno con una acción: vierte, mide, espera.",
          ),
          IMG(6, 67, 50, 17, "Draw your setup.", "Dibuja cómo armaste la prueba."),
          AUD(62, 74),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Show your data. Add a chart, table or drawing, then describe what you see.",
          "Muestra tus datos. Agrega una gráfica, tabla o dibujo y luego describe lo que ves.",
        ),
        frames: F(
          ["The ___ had the most ___.", "El / La ___ tuvo más ___."],
          ["___ was more than ___.", "___ fue más que ___."],
        ),
        frames68: F(
          [
            "The data show a pattern: as ___ increased, ___.",
            "Los datos muestran un patrón: a medida que ___ aumentó, ___.",
          ],
          [
            "The biggest difference was between ___ and ___.",
            "La mayor diferencia fue entre ___ y ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "My Data", "Mis datos", { color: "#075568" }),
          SH("rect", 4, 14, 92, 46, "#e9edf8", "#1b2a5c"),
          IMG(
            7,
            17,
            86,
            40,
            "Add your chart, table or a labeled drawing of your results.",
            "Agrega tu gráfica, tabla o un dibujo con rótulos de tus resultados.",
          ),
          B(
            6,
            63,
            88,
            21,
            "What do the numbers or pictures show? Compare with more than, less than, the most.",
            "¿Qué muestran los números o las imágenes? Compara con más que, menos que, el / la más.",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Answer your question. Make a claim, point to your evidence, and explain why the evidence supports it.",
          "Responde tu pregunta. Haz una afirmación, señala tu evidencia y explica por qué la evidencia la apoya.",
        ),
        frames: F(
          ["My claim is ___.", "Mi afirmación es ___."],
          ["The data show ___.", "Los datos muestran ___."],
          ["This means ___.", "Esto significa ___."],
        ),
        frames68: F(
          ["Based on my results, I claim that ___.", "Según mis resultados, afirmo que ___."],
          ["For example, ___ compared to ___.", "Por ejemplo, ___ comparado con ___."],
          [
            "This evidence supports my claim because ___.",
            "Esta evidencia apoya mi afirmación porque ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "Claim, Evidence, Reasoning", "Afirmación, evidencia, razonamiento"),
          H(6, 15, 22, 6, "Claim", "Afirmación", { size: 3.4, font: "rounded" }),
          B(
            30,
            15,
            64,
            16,
            "Answer your question in one sentence.",
            "Responde tu pregunta en una oración.",
          ),
          H(6, 34, 22, 6, "Evidence", "Evidencia", { size: 3.4, font: "rounded" }),
          B(
            30,
            34,
            64,
            22,
            "Which numbers or observations prove it?",
            "¿Qué números u observaciones lo prueban?",
          ),
          H(6, 59, 22, 6, "Reasoning", "Razonamiento", { size: 3.4, font: "rounded" }),
          B(
            30,
            59,
            64,
            24,
            "Why does this evidence support your claim? Use a science idea.",
            "¿Por qué esta evidencia apoya tu afirmación? Usa una idea científica.",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "What would you test next? Name one new question or one thing you would change.",
          "¿Qué probarías después? Nombra una pregunta nueva o algo que cambiarías.",
        ),
        frames: F(
          ["Next time, I would test ___.", "La próxima vez, probaría ___."],
          ["I wonder if ___.", "Me pregunto si ___."],
        ),
        frames68: F(
          ["A new question this raises is ___.", "Una pregunta nueva que surge es ___."],
          [
            "To make my results more reliable, I would ___.",
            "Para que mis resultados fueran más confiables, yo ___.",
          ],
        ),
        elements: [
          ART("obj-lightbulb", 74, 5, 20, 22, tr("A lightbulb", "Un foco")),
          H(6, 8, 66, 10, "What I'd Test Next", "Qué probaría después", { color: "#fff3c4" }),
          SH("rounded", 4, 30, 92, 52, "#ffffff"),
          B(
            8,
            33,
            84,
            46,
            "What new question do you have? What would you change to learn more?",
            "¿Qué pregunta nueva tienes? ¿Qué cambiarías para aprender más?",
          ),
          AUD(6, 85),
        ],
      },
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────
  {
    id: "character-setting",
    title: tr("Character and Setting", "Personaje y ambiente"),
    kind: "narrative",
    format: "landscape",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "narrative",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Invent a character, build the world they live in, and show how a problem changes them.",
      "Inventa un personaje, crea el mundo donde vive y muestra cómo un problema lo cambia.",
    ),
    targets: F(
      [
        "Use adjectives in order and sensory words to describe a character and a place.",
        "Usar adjetivos y palabras de los sentidos para describir un personaje y un lugar.",
      ],
      [
        "Show a trait through an action with because or so (She shared her lunch, so she is generous).",
        "Mostrar un rasgo con una acción usando porque o así que (Compartió su almuerzo, así que es generosa).",
      ],
      [
        "Use wants / needs / but to state a character's goal and problem.",
        "Usar quiere / necesita / pero para decir la meta y el problema de un personaje.",
      ],
    ),
    finished: tr(
      "A 6-page picture book that introduces a character, describes the setting, and shows how the character changes.",
      "Un libro ilustrado de 6 páginas que presenta un personaje, describe el ambiente y muestra cómo cambia el personaje.",
    ),
    teacherNotes: tr(
      "Launch with a quick 'show, don't tell' game: you say a trait, students act it out, and the class names the action. Listen for students giving an action as proof of a trait. The sensory-word chart helps with the setting page; fade it when students add sound and smell details on their own.",
      "Empiece con un juego rápido de 'muestra, no digas': usted dice un rasgo, los estudiantes lo actúan y la clase nombra la acción. Escuche que den una acción como prueba de un rasgo. La tabla de palabras de los sentidos ayuda en la página del ambiente; retírela cuando agreguen sonidos y olores solos.",
    ),
    wordBank: F(
      ["character", "personaje"],
      ["setting", "ambiente / escenario"],
      ["brave", "valiente"],
      ["curious", "curioso / curiosa"],
      ["shy", "tímido / tímida"],
      ["wants", "quiere"],
      ["problem", "problema"],
      ["smell", "olor / oler"],
      ["quiet", "silencioso / silenciosa"],
      ["changes", "cambia"],
    ),
    example: tr(
      "Nia is a curious, small girl with a yellow backpack full of rocks. She picks up every stone she sees, so you know she loves to explore. Nia lives on a windy island where gulls scream and the air smells like salt. She wants to find the crystal cave from her grandfather's stories, but the path is covered by high tide. Nia is shy, and she has to ask the old fisherman for help. At the end, she finds the cave, and she learns that asking questions is another way to explore.",
      "Nia es una niña pequeña y curiosa con una mochila amarilla llena de piedras. Recoge cada piedra que ve, así que sabes que le encanta explorar. Nia vive en una isla con mucho viento donde las gaviotas chillan y el aire huele a sal. Quiere encontrar la cueva de cristal de las historias de su abuelo, pero la marea alta cubre el camino. Nia es tímida y tiene que pedirle ayuda al viejo pescador. Al final, encuentra la cueva y aprende que hacer preguntas es otra forma de explorar.",
    ),
    pages: [
      {
        bg: "#e6f0e3",
        bgArt: "bg-forest",
        prompt: tr(
          "Make your cover. Show your character in their world.",
          "Haz tu portada. Muestra a tu personaje en su mundo.",
        ),
        elements: [
          SH("rounded", 30, 6, 64, 30, "#fffaf0", "#0b3d4a"),
          TITLE(33, 9, 58, 18, { color: "#0b3d4a", font: "fraunces", size: 7, align: "center" }),
          BYLINE(33, 27, 58, 7, { color: "#0b3d4a", align: "center" }),
          IMG(6, 30, 26, 60, "Draw your character.", "Dibuja a tu personaje."),
          ART("nat-butterfly", 72, 62, 14, 16, tr("A butterfly", "Una mariposa")),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Meet your character. What do they look like? Show one trait with an action.",
          "Conoce a tu personaje. ¿Cómo es? Muestra un rasgo con una acción.",
        ),
        frames: F(
          ["___ is a ___ kid with ___.", "___ es un / una ___ con ___."],
          [
            "___ always ___, so you know ___ is ___.",
            "___ siempre ___, así que sabes que ___ es ___.",
          ],
        ),
        frames68: F(
          [
            "At first glance, ___ seems ___, but ___.",
            "A primera vista, ___ parece ___, pero ___.",
          ],
          [
            "Whenever ___, ___ reacts by ___, which shows ___.",
            "Cada vez que ___, ___ reacciona ___, lo que muestra ___.",
          ],
        ),
        elements: [
          HP(5, 6, 90, 10, "Your character's name", "El nombre de tu personaje"),
          IMG(
            5,
            19,
            34,
            64,
            "Draw your character from head to toe.",
            "Dibuja a tu personaje de pies a cabeza.",
          ),
          H(43, 19, 52, 7, "Looks", "Cómo se ve", { size: 3.4, font: "rounded" }),
          B(
            43,
            27,
            52,
            22,
            "Describe how your character looks.",
            "Describe cómo se ve tu personaje.",
          ),
          H(43, 51, 52, 7, "Trait + action", "Rasgo + acción", { size: 3.4, font: "rounded" }),
          B(
            43,
            59,
            52,
            23,
            "Name one trait. What does your character do that shows it?",
            "Nombra un rasgo. ¿Qué hace tu personaje que lo muestra?",
          ),
          AUD(5, 85),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "Describe the setting. Where and when does the story happen? Use your senses.",
          "Describe el ambiente. ¿Dónde y cuándo pasa la historia? Usa tus sentidos.",
        ),
        frames: F(
          ["The story happens in ___.", "La historia pasa en ___."],
          ["You can hear ___ and smell ___.", "Puedes oír ___ y oler ___."],
        ),
        frames68: F(
          [
            "The air in ___ feels ___, and in the distance ___.",
            "El aire en ___ se siente ___ y a lo lejos ___.",
          ],
          [
            "This place matters to ___ because ___.",
            "Este lugar es importante para ___ porque ___.",
          ],
        ),
        elements: [
          H(5, 6, 90, 10, "The Setting", "El ambiente"),
          IMG(
            5,
            19,
            56,
            64,
            "Draw the place. Add details that show the time of day or the season.",
            "Dibuja el lugar. Agrega detalles que muestren la hora del día o la estación.",
          ),
          B(
            64,
            19,
            31,
            64,
            "What can you see, hear, smell and feel there?",
            "¿Qué puedes ver, oír, oler y sentir allí?",
          ),
          AUD(65, 85),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          "What does your character want? What problem gets in the way?",
          "¿Qué quiere tu personaje? ¿Qué problema se lo impide?",
        ),
        frames: F(["___ wants ___.", "___ quiere ___."], ["But ___.", "Pero ___."]),
        frames68: F(
          ["More than anything, ___ needs ___.", "Más que nada, ___ necesita ___."],
          ["The problem is that ___, so ___.", "El problema es que ___, así que ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "Wants and Problem", "Lo que quiere y el problema", { color: "#9a4a26" }),
          SH("rounded", 5, 19, 40, 64, "#ffffff", "#9a4a26"),
          H(8, 21, 34, 7, "Wants", "Quiere", { size: 3.4, font: "rounded" }),
          B(
            8,
            30,
            34,
            50,
            "What does your character want or need?",
            "¿Qué quiere o necesita tu personaje?",
          ),
          SH("arrow", 46, 44, 8, 10, "#9a4a26"),
          SH("rounded", 55, 19, 40, 64, "#ffffff", "#9a4a26"),
          H(58, 21, 34, 7, "But...", "Pero...", { size: 3.4, font: "rounded" }),
          B(58, 30, 34, 50, "What problem stops them?", "¿Qué problema se lo impide?"),
          AUD(35, 85),
        ],
      },
      {
        bg: "#fff3c4",
        prompt: tr(
          "Put your character in the setting to face the problem. What do they do?",
          "Pon a tu personaje en el ambiente frente al problema. ¿Qué hace?",
        ),
        frames: F(
          ["First, ___ tried ___.", "Primero, ___ intentó ___."],
          ["Then ___.", "Luego ___."],
        ),
        frames68: F(
          ["Determined to ___, ___ decided to ___.", "Decidido / Decidida a ___, ___ decidió ___."],
          ["Just when ___, ___.", "Justo cuando ___, ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "Facing the Problem", "Frente al problema"),
          B(
            5,
            19,
            46,
            64,
            "What does your character try? What happens?",
            "¿Qué intenta tu personaje? ¿Qué pasa?",
          ),
          IMG(
            55,
            19,
            40,
            64,
            "Draw your character in the setting.",
            "Dibuja a tu personaje en el ambiente.",
          ),
          AUD(5, 85),
        ],
      },
      {
        bg: "#0b3d4a",
        prompt: tr(
          "How does your character change by the end? What did they learn?",
          "¿Cómo cambia tu personaje al final? ¿Qué aprendió?",
        ),
        frames: F(
          ["At the start, ___ was ___.", "Al principio, ___ era ___."],
          ["At the end, ___ is ___.", "Al final, ___ es ___."],
        ),
        frames68: F(
          ["By facing ___, ___ discovered ___.", "Al enfrentar ___, ___ descubrió ___."],
          ["___ is no longer ___; now ___.", "___ ya no es ___; ahora ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "How My Character Changed", "Cómo cambió mi personaje", {
            color: "#fff3c4",
          }),
          SH("rounded", 5, 19, 42, 64, "#ffffff"),
          H(8, 21, 36, 7, "Before", "Antes", { size: 3.4, font: "rounded" }),
          B(
            8,
            30,
            36,
            50,
            "How was your character at the start?",
            "¿Cómo era tu personaje al principio?",
          ),
          SH("rounded", 53, 19, 42, 64, "#ffffff"),
          H(56, 21, 36, 7, "After", "Después", { size: 3.4, font: "rounded" }),
          B(
            56,
            30,
            36,
            50,
            "How is your character now? What did they learn?",
            "¿Cómo es tu personaje ahora? ¿Qué aprendió?",
          ),
          AUD(35, 85),
        ],
      },
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────
  {
    id: "vocabulary-picture-book",
    title: tr("Vocabulary Picture Book", "Libro ilustrado de vocabulario"),
    kind: "informational",
    format: "square",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Teach four important words with your own definitions, examples, pictures and voice.",
      "Enseña cuatro palabras importantes con tus propias definiciones, ejemplos, imágenes y voz.",
    ),
    targets: F(
      [
        "Define a word in your own words with ___ means ___ / ___ is a kind of ___.",
        "Definir una palabra con tus propias palabras: ___ significa ___ / ___ es un tipo de ___.",
      ],
      [
        "Use the new word correctly in an original sentence.",
        "Usar la palabra nueva correctamente en una oración original.",
      ],
      [
        "Explain why something is NOT an example with because or is not ___ because ___.",
        "Explicar por qué algo NO es un ejemplo usando porque o no es ___ porque ___.",
      ],
      [
        "Say each word clearly and record its pronunciation.",
        "Decir cada palabra con claridad y grabar su pronunciación.",
      ],
    ),
    finished: tr(
      "A 6-page picture dictionary of four words from a unit, each with a definition, sentence, picture, recording and non-example.",
      "Un diccionario ilustrado de 6 páginas con cuatro palabras de una unidad, cada una con definición, oración, imagen, grabación y un no-ejemplo.",
    ),
    teacherNotes: tr(
      "Choose four words from your current unit (math, science or reading) or let students choose from the unit list. Look for definitions in the student's own words rather than copied from a glossary, and for non-examples that are close but wrong. A Spanish cognate is a fine bridge in the definition; fade the definition frame once students can explain without it.",
      "Elija cuatro palabras de la unidad actual (matemáticas, ciencias o lectura) o deje que los estudiantes elijan de la lista. Busque definiciones con sus propias palabras y no copiadas de un glosario, y no-ejemplos que sean parecidos pero incorrectos. Un cognado en español es un buen puente en la definición; retire el inicio de definición cuando puedan explicar sin él.",
    ),
    wordBank: F(
      ["word", "palabra"],
      ["means", "significa"],
      ["definition", "definición"],
      ["example", "ejemplo"],
      ["non-example", "no-ejemplo"],
      ["a kind of", "un tipo de"],
      ["similar to", "parecido a"],
      ["pronounce", "pronunciar"],
    ),
    example: tr(
      "Word: perimeter. Perimeter means the distance all the way around the outside of a shape. You find it by adding the lengths of all the sides. My sentence: We measured the perimeter of the garden so we knew how much fence to buy. Picture: a rectangle with all four sides traced in red. Non-example: the number of square tiles inside the rectangle is not the perimeter, because that measures the inside space, which is area.",
      "Palabra: perímetro. Perímetro significa la distancia alrededor de todo el borde de una figura. Se encuentra sumando las longitudes de todos los lados. Mi oración: Medimos el perímetro del jardín para saber cuánta cerca comprar. Imagen: un rectángulo con los cuatro lados marcados en rojo. No-ejemplo: el número de baldosas cuadradas dentro del rectángulo no es el perímetro, porque eso mide el espacio de adentro, que es el área.",
    ),
    pages: [
      {
        bg: "#f2b134",
        prompt: tr(
          "Make your cover. Name the topic your words come from.",
          "Haz tu portada. Nombra el tema de donde vienen tus palabras.",
        ),
        elements: [
          SH("rounded", 8, 8, 84, 52, "#fffaf0", "#1b1f3b", 0.8),
          ART("obj-book", 34, 12, 32, 22, tr("An open book", "Un libro abierto")),
          TITLE(12, 36, 76, 16, { color: "#1b1f3b", font: "rounded", size: 7, align: "center" }),
          BYLINE(12, 52, 76, 6, { color: "#1b1f3b", align: "center" }),
          SH("rounded", 8, 66, 24, 24, "#ffffff"),
          SH("rounded", 38, 66, 24, 24, "#ffffff"),
          SH("rounded", 68, 66, 24, 24, "#ffffff"),
          B(10, 68, 20, 20, "Word 1", "Palabra 1", { align: "center", size: 2.9 }),
          B(40, 68, 20, 20, "Word 2", "Palabra 2", { align: "center", size: 2.9 }),
          B(70, 68, 20, 20, "Word 3", "Palabra 3", { align: "center", size: 2.9 }),
        ],
      },
      ...[
        ["#e7f4f2", "#075568", "Word 1", "Palabra 1"],
        ["#f8e8ef", "#8a3a5c", "Word 2", "Palabra 2"],
        ["#e9edf8", "#1b2a5c", "Word 3", "Palabra 3"],
        ["#e6f0e3", "#0b3d4a", "Word 4", "Palabra 4"],
      ].map(([bg, ink, en, es]) => ({
        bg,
        prompt: tr(
          `${en}: write the word, explain it in your own words, use it in a sentence, add a picture, record how to say it, and show a non-example.`,
          `${es}: escribe la palabra, explícala con tus propias palabras, úsala en una oración, agrega una imagen, graba cómo se dice y muestra un no-ejemplo.`,
        ),
        frames: F(
          ["___ means ___.", "___ significa ___."],
          ["I can use it like this: ___.", "La puedo usar así: ___."],
          ["___ is not an example because ___.", "___ no es un ejemplo porque ___."],
        ),
        frames68: F(
          ["___ is a kind of ___ that ___.", "___ es un tipo de ___ que ___."],
          ["Unlike ___, a ___ always ___.", "A diferencia de ___, un / una ___ siempre ___."],
          [
            "Although ___ seems similar, it is not ___ because ___.",
            "Aunque ___ parece similar, no es ___ porque ___.",
          ],
        ),
        elements: [
          SH("rounded", 4, 4, 56, 12, "#ffffff", ink, 0.8),
          HP(
            6,
            5,
            52,
            10,
            `Write ${en.toLowerCase()} here`,
            `Escribe la ${es.toLowerCase()} aquí`,
            { color: ink, size: 6, font: "rounded" },
          ),
          AUD(64, 6, "Say the word"),
          IMG(
            4,
            19,
            40,
            37,
            "Draw or add a picture that shows the word.",
            "Dibuja o agrega una imagen que muestre la palabra.",
          ),
          H(48, 19, 48, 6, "What it means", "Qué significa", {
            size: 3,
            font: "rounded",
            color: ink,
          }),
          B(
            48,
            25,
            48,
            13,
            "Explain the word in your own words.",
            "Explica la palabra con tus propias palabras.",
            { size: 2.9 },
          ),
          H(48, 39, 48, 6, "My sentence", "Mi oración", { size: 3, font: "rounded", color: ink }),
          B(
            48,
            45,
            48,
            12,
            "Use the word in your own sentence.",
            "Usa la palabra en tu propia oración.",
            { size: 2.9 },
          ),
          SH("rounded", 4, 60, 92, 32, "#ffffff", ink),
          SH("line", 8, 66, 10, 0.1, "none", "#e86a50", 1),
          H(8, 62, 50, 6, "Not an example", "No es un ejemplo", {
            size: 3,
            font: "rounded",
            color: "#9a4a26",
          }),
          B(
            8,
            69,
            54,
            21,
            "Name something close but wrong, and tell why it is not an example.",
            "Nombra algo parecido pero incorrecto y di por qué no es un ejemplo.",
            { size: 2.9 },
          ),
          IMG(66, 63, 27, 27, "Draw the non-example.", "Dibuja el no-ejemplo."),
        ],
      })),
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Wrap up. Which word was hardest? Write one sentence that uses two of your words.",
          "Cierra el libro. ¿Qué palabra fue la más difícil? Escribe una oración que use dos de tus palabras.",
        ),
        frames: F(
          ["The hardest word was ___ because ___.", "La palabra más difícil fue ___ porque ___."],
          ["___ and ___ go together because ___.", "___ y ___ van juntas porque ___."],
        ),
        frames68: F(
          ["___ connects to ___ because both ___.", "___ se relaciona con ___ porque las dos ___."],
          ["I will remember ___ by thinking of ___.", "Recordaré ___ pensando en ___."],
        ),
        elements: [
          ART("fx-idea", 74, 5, 20, 20, tr("An idea burst", "Una explosión de ideas")),
          H(6, 8, 66, 10, "Putting Words Together", "Juntando palabras", { color: "#fff3c4" }),
          SH("rounded", 4, 28, 92, 56, "#ffffff"),
          B(
            8,
            31,
            84,
            24,
            "Which word was hardest to explain? Why?",
            "¿Qué palabra fue la más difícil de explicar? ¿Por qué?",
          ),
          B(
            8,
            57,
            84,
            24,
            "Write one sentence that uses two of your words.",
            "Escribe una oración que use dos de tus palabras.",
          ),
          AUD(6, 86),
        ],
      },
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────
  {
    id: "cause-effect",
    title: tr("Cause and Effect", "Causa y efecto"),
    kind: "informational",
    format: "landscape",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Explain what makes something happen and what happens because of it, one arrow at a time.",
      "Explica qué hace que algo pase y qué pasa por eso, una flecha a la vez.",
    ),
    targets: F(
      [
        "Connect a cause and an effect with because, so, and as a result.",
        "Conectar una causa y un efecto con porque, así que y como resultado.",
      ],
      [
        "Use past or present tense consistently across a cause and its effect.",
        "Usar el pasado o el presente de forma constante en una causa y su efecto.",
      ],
      [
        "Explain a chain of events with this led to ___, which caused ___.",
        "Explicar una cadena de sucesos con esto llevó a ___, lo que causó ___.",
      ],
    ),
    finished: tr(
      "A 5-page explanation with cause-and-effect arrows, pictures and narration about one topic.",
      "Una explicación de 5 páginas con flechas de causa y efecto, imágenes y narración sobre un tema.",
    ),
    teacherNotes: tr(
      "Pick a topic students know from science or social studies (rain and floods, a new law, a habit). Model one arrow aloud, then listen for students reversing cause and effect, which is the most common mix-up. Keep the connector chart visible on day one; on day two, ask students to vary connectors without it.",
      "Elija un tema que conozcan de ciencias o estudios sociales (la lluvia y las inundaciones, una ley nueva, un hábito). Modele una flecha en voz alta y escuche si invierten la causa y el efecto, que es la confusión más común. Deje visible la tabla de conectores el primer día; el segundo día, pida que varíen los conectores sin ella.",
    ),
    wordBank: F(
      ["cause", "causa"],
      ["effect", "efecto"],
      ["because", "porque"],
      ["so", "así que"],
      ["as a result", "como resultado"],
      ["led to", "llevó a"],
      ["therefore", "por lo tanto"],
      ["happen", "pasar / suceder"],
    ),
    example: tr(
      "Many trees on a hillside were cut down to build houses. Because the trees were gone, there were no roots to hold the soil in place. When heavy rain came, the soil washed down the hill. As a result, mud filled the stream at the bottom. This led to cloudy water, which caused many fish to leave. One cause, cutting trees, started a chain of effects. That is why some towns now plant new trees on hills.",
      "Cortaron muchos árboles en una colina para construir casas. Como ya no había árboles, no había raíces que sostuvieran la tierra. Cuando llegó una lluvia fuerte, la tierra bajó por la colina. Como resultado, el lodo llenó el arroyo de abajo. Esto llevó a que el agua se volviera turbia, lo que causó que muchos peces se fueran. Una causa, cortar árboles, empezó una cadena de efectos. Por eso algunos pueblos ahora siembran árboles nuevos en las colinas.",
    ),
    pages: [
      {
        bg: "#fffaf0",
        prompt: tr(
          "Make your cover. Your title can name the cause and the effect.",
          "Haz tu portada. Tu título puede nombrar la causa y el efecto.",
        ),
        elements: [
          SH("rounded", 5, 8, 26, 40, "#e86a50"),
          SH("arrow", 33, 22, 30, 12, "#1b1f3b"),
          SH("rounded", 65, 8, 30, 40, "#7fb48a"),
          ART("nat-rain", 9, 14, 18, 26, tr("Rain", "Lluvia")),
          ART("nat-flower", 71, 14, 18, 26, tr("A flower", "Una flor")),
          TITLE(5, 54, 90, 22, { color: "#1b1f3b", font: "fraunces", size: 7.5, align: "center" }),
          BYLINE(5, 80, 90, 8, { color: "#5a1e3a", align: "center" }),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Introduce your topic. What will you explain, and why should readers care?",
          "Presenta tu tema. ¿Qué vas a explicar y por qué debe importarles a los lectores?",
        ),
        frames: F(
          ["This book explains why ___.", "Este libro explica por qué ___."],
          ["It matters because ___.", "Es importante porque ___."],
        ),
        frames68: F(
          ["Have you ever wondered why ___?", "¿Alguna vez te has preguntado por qué ___?"],
          ["Understanding ___ helps us ___.", "Entender ___ nos ayuda a ___."],
        ),
        elements: [
          ART("obj-magnifier", 82, 5, 13, 13, tr("A magnifying glass", "Una lupa")),
          H(5, 6, 76, 10, "What I Will Explain", "Lo que voy a explicar"),
          B(
            5,
            19,
            50,
            64,
            "What is your topic? What happens, and why should readers care?",
            "¿Cuál es tu tema? ¿Qué pasa y por qué debe importarles a los lectores?",
          ),
          IMG(59, 19, 36, 64, "Add a picture of your topic.", "Agrega una imagen de tu tema."),
          AUD(5, 85),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          "Show the first cause and its effect. Explain how one makes the other happen.",
          "Muestra la primera causa y su efecto. Explica cómo una hace que pase el otro.",
        ),
        frames: F(["Because ___, ___.", "Porque ___, ___."], ["___, so ___.", "___, así que ___."]),
        frames68: F(
          ["When ___, the result is ___.", "Cuando ___, el resultado es ___."],
          ["___ occurs because ___.", "___ ocurre porque ___."],
        ),
        elements: [
          H(5, 5, 90, 9, "Cause → Effect", "Causa → Efecto", { color: "#9a4a26" }),
          SH("rounded", 5, 16, 38, 68, "#ffffff", "#e86a50", 0.8),
          H(8, 18, 32, 7, "Cause", "Causa", { size: 3.6, font: "rounded", color: "#9a4a26" }),
          IMG(8, 26, 32, 24, "Draw the cause.", "Dibuja la causa."),
          B(8, 52, 32, 30, "What happens first?", "¿Qué pasa primero?"),
          SH("arrow", 44, 42, 12, 12, "#1b1f3b"),
          SH("rounded", 57, 16, 38, 68, "#ffffff", "#7fb48a", 0.8),
          H(60, 18, 32, 7, "Effect", "Efecto", { size: 3.6, font: "rounded", color: "#0b3d4a" }),
          IMG(60, 26, 32, 24, "Draw the effect.", "Dibuja el efecto."),
          B(60, 52, 32, 30, "What happens because of it?", "¿Qué pasa por eso?"),
          AUD(35, 86),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "Build the chain. Show how one effect becomes the cause of the next thing.",
          "Arma la cadena. Muestra cómo un efecto se vuelve la causa de lo siguiente.",
        ),
        frames: F(
          ["This led to ___.", "Esto llevó a ___."],
          ["As a result, ___.", "Como resultado, ___."],
        ),
        frames68: F(
          [
            "___ triggered ___, which in turn caused ___.",
            "___ provocó ___, lo que a su vez causó ___.",
          ],
          ["Consequently, ___.", "En consecuencia, ___."],
        ),
        elements: [
          H(5, 5, 90, 9, "A Chain of Effects", "Una cadena de efectos"),
          SH("rounded", 5, 17, 26, 62, "#ffffff", "#1b2a5c"),
          SH("arrow", 32, 42, 6, 10, "#1b2a5c"),
          SH("rounded", 39, 17, 26, 62, "#ffffff", "#1b2a5c"),
          SH("arrow", 66, 42, 6, 10, "#1b2a5c"),
          SH("rounded", 73, 17, 22, 62, "#ffffff", "#1b2a5c"),
          B(7, 20, 22, 56, "Step 1: What starts it?", "Paso 1: ¿Qué lo empieza?", { size: 2.9 }),
          B(41, 20, 22, 56, "Step 2: What does that cause?", "Paso 2: ¿Qué causa eso?", {
            size: 2.9,
          }),
          B(75, 20, 18, 56, "Step 3: What happens last?", "Paso 3: ¿Qué pasa al final?", {
            size: 2.9,
          }),
          AUD(35, 83),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Conclude. Why does this cause and effect matter? What could people do about it?",
          "Concluye. ¿Por qué importa esta causa y efecto? ¿Qué podría hacer la gente al respecto?",
        ),
        frames: F(
          ["That is why ___.", "Por eso ___."],
          ["People can ___ so that ___.", "La gente puede ___ para que ___."],
        ),
        frames68: F(
          ["Therefore, ___.", "Por lo tanto, ___."],
          [
            "If people ___, the effect could change because ___.",
            "Si la gente ___, el efecto podría cambiar porque ___.",
          ],
        ),
        elements: [
          H(5, 6, 90, 10, "Why It Matters", "Por qué es importante"),
          B(
            5,
            19,
            56,
            64,
            "Sum up the chain. What could people do to change the effect?",
            "Resume la cadena. ¿Qué podría hacer la gente para cambiar el efecto?",
          ),
          IMG(65, 19, 30, 40, "Draw a solution.", "Dibuja una solución."),
          AUD(65, 64),
        ],
      },
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────
  {
    id: "compare-contrast",
    title: tr("Compare and Contrast", "Comparar y contrastar"),
    kind: "informational",
    format: "landscape",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Show how two things are alike and different, with a both box in the middle.",
      "Muestra en qué se parecen y en qué se diferencian dos cosas, con una caja de ambos en el medio.",
    ),
    targets: F(
      [
        "Use comparison words: both, also, similar to, the same as.",
        "Usar palabras para comparar: ambos, también, parecido a, igual que.",
      ],
      [
        "Use contrast words: but, however, while, unlike.",
        "Usar palabras para contrastar: pero, sin embargo, mientras que, a diferencia de.",
      ],
      [
        "Form comparative adjectives (bigger, more colorful, less heavy).",
        "Formar adjetivos comparativos (más grande, más colorido, menos pesado).",
      ],
    ),
    finished: tr(
      "A 5-page book comparing two things, with pictures, a two-column chart, a both box and a conclusion.",
      "Un libro de 5 páginas que compara dos cosas, con imágenes, una tabla de dos columnas, una caja de ambos y una conclusión.",
    ),
    teacherNotes: tr(
      "Choose two things students can see or research: two animals, two places, two characters, two ways to solve a problem. Have pairs sort features on sticky notes into the three boxes before writing. Listen for both/but in their talk; fade the connector frames once students switch between alike and different without prompting.",
      "Elija dos cosas que puedan ver o investigar: dos animales, dos lugares, dos personajes, dos formas de resolver un problema. Pida a las parejas que clasifiquen características en notas adhesivas en las tres cajas antes de escribir. Escuche ambos/pero cuando hablen; retire los inicios de oración cuando cambien solos entre parecido y diferente.",
    ),
    wordBank: F(
      ["both", "ambos / ambas"],
      ["also", "también"],
      ["similar", "parecido / similar"],
      ["different", "diferente"],
      ["however", "sin embargo"],
      ["while", "mientras que"],
      ["unlike", "a diferencia de"],
      ["more than", "más que"],
      ["less than", "menos que"],
    ),
    example: tr(
      "Frogs and toads look alike, but they are different in important ways. Both are amphibians, and both lay eggs in water. They also eat insects. However, frogs have smooth, wet skin, while toads have bumpy, dry skin. Frogs have long legs for jumping far. Unlike frogs, toads have short legs, so they take small hops. Frogs usually live near water, but toads can live in gardens. Even though they are similar, you can tell them apart by looking at their skin and legs.",
      "Las ranas y los sapos se parecen, pero son diferentes en cosas importantes. Ambos son anfibios y ambos ponen huevos en el agua. También comen insectos. Sin embargo, las ranas tienen la piel lisa y húmeda, mientras que los sapos tienen la piel con bultos y seca. Las ranas tienen patas largas para saltar lejos. A diferencia de las ranas, los sapos tienen patas cortas, así que dan saltos pequeños. Las ranas casi siempre viven cerca del agua, pero los sapos pueden vivir en jardines. Aunque se parecen, puedes distinguirlos por la piel y las patas.",
    ),
    pages: [
      {
        bg: "#f8e8ef",
        prompt: tr(
          "Make your cover. Show the two things you will compare side by side.",
          "Haz tu portada. Muestra lado a lado las dos cosas que vas a comparar.",
        ),
        elements: [
          SH("ellipse", 6, 10, 40, 60, "#e9edf8", "#1b2a5c", 0.8),
          SH("ellipse", 54, 10, 40, 60, "#fff3c4", "#8a3a5c", 0.8),
          IMG(12, 20, 26, 40, "Thing 1", "Cosa 1"),
          IMG(62, 20, 26, 40, "Thing 2", "Cosa 2"),
          SH("rounded", 30, 30, 40, 20, "#ffffff", "#5a1e3a"),
          TITLE(32, 32, 36, 16, { color: "#5a1e3a", font: "fraunces", size: 5.5, align: "center" }),
          BYLINE(20, 78, 60, 8, { color: "#5a1e3a", align: "center" }),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Introduce the two things. What are they, and why compare them?",
          "Presenta las dos cosas. ¿Qué son y por qué compararlas?",
        ),
        frames: F(
          ["This book compares ___ and ___.", "Este libro compara ___ y ___."],
          ["They look alike, but ___.", "Se parecen, pero ___."],
        ),
        frames68: F(
          ["Although ___ and ___ seem similar, ___.", "Aunque ___ y ___ parecen similares, ___."],
          ["Comparing them helps us understand ___.", "Compararlos nos ayuda a entender ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "Meet the Two", "Conoce a los dos"),
          IMG(5, 19, 28, 40, "Picture of thing 1", "Imagen de la cosa 1"),
          IMG(36, 19, 28, 40, "Picture of thing 2", "Imagen de la cosa 2"),
          B(
            67,
            19,
            28,
            64,
            "What are the two things? Why are you comparing them?",
            "¿Cuáles son las dos cosas? ¿Por qué las comparas?",
            { size: 2.9 },
          ),
          CAP(5, 61, 28, 8, "Label thing 1.", "Rotula la cosa 1."),
          CAP(36, 61, 28, 8, "Label thing 2.", "Rotula la cosa 2."),
          AUD(5, 74),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Sort the details. Put what is only true of each thing in its column and what is true of both in the middle.",
          "Clasifica los detalles. Pon en cada columna lo que solo es cierto de cada cosa y en el medio lo que es cierto de ambas.",
        ),
        frames: F(
          ["Only ___ has ___.", "Solo ___ tiene ___."],
          ["Both ___.", "Ambos / Ambas ___."],
        ),
        frames68: F(
          ["___ is the only one that ___.", "___ es el único / la única que ___."],
          ["___ and ___ share ___.", "___ y ___ comparten ___."],
        ),
        elements: [
          H(5, 5, 90, 9, "Different, Both, Different", "Diferente, ambos, diferente"),
          SH("rounded", 5, 16, 30, 70, "#e9edf8", "#1b2a5c"),
          SH("rounded", 37, 16, 26, 70, "#fff3c4", "#9a4a26", 0.8),
          SH("rounded", 65, 16, 30, 70, "#f8e8ef", "#8a3a5c"),
          HP(7, 18, 26, 7, "Thing 1", "Cosa 1", { size: 3.4, font: "rounded" }),
          H(39, 18, 22, 7, "Both", "Ambos", { size: 3.4, font: "rounded", align: "center" }),
          HP(67, 18, 26, 7, "Thing 2", "Cosa 2", { size: 3.4, font: "rounded" }),
          B(7, 26, 26, 58, "Only true of thing 1", "Solo cierto de la cosa 1", { size: 2.9 }),
          B(39, 26, 22, 58, "True of both", "Cierto de ambas", { size: 2.9 }),
          B(67, 26, 26, 58, "Only true of thing 2", "Solo cierto de la cosa 2", { size: 2.9 }),
        ],
      },
      {
        bg: "#e7f4f2",
        prompt: tr(
          "Write a paragraph about the most important similarity and the most important difference.",
          "Escribe un párrafo sobre el parecido más importante y la diferencia más importante.",
        ),
        frames: F(
          ["___ and ___ are alike because both ___.", "___ y ___ se parecen porque ambos ___."],
          ["However, ___ is ___er than ___.", "Sin embargo, ___ es más ___ que ___."],
        ),
        frames68: F(
          ["The most striking similarity is ___.", "El parecido más notable es ___."],
          ["Unlike ___, ___ ___, while ___.", "A diferencia de ___, ___ ___, mientras que ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "Alike and Different", "Parecidos y diferentes"),
          H(5, 19, 43, 7, "Alike", "Se parecen", { size: 3.6, font: "rounded", color: "#075568" }),
          B(
            5,
            27,
            43,
            54,
            "What is the most important way they are alike? Use both or also.",
            "¿En qué se parecen más? Usa ambos o también.",
          ),
          H(52, 19, 43, 7, "Different", "Son diferentes", {
            size: 3.6,
            font: "rounded",
            color: "#075568",
          }),
          B(
            52,
            27,
            43,
            54,
            "What is the most important difference? Use however, while or unlike.",
            "¿Cuál es la diferencia más importante? Usa sin embargo, mientras que o a diferencia de.",
          ),
          AUD(35, 84),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Conclude. Which would you choose, or what did comparing teach you?",
          "Concluye. ¿Cuál elegirías o qué aprendiste al comparar?",
        ),
        frames: F(
          ["I would choose ___ because ___.", "Yo elegiría ___ porque ___."],
          ["Now I know ___.", "Ahora sé que ___."],
        ),
        frames68: F(
          [
            "Overall, ___ and ___ are more ___ than they first appear.",
            "En general, ___ y ___ son más ___ de lo que parecen.",
          ],
          ["Comparing them showed me ___.", "Compararlos me mostró ___."],
        ),
        elements: [
          ART("obj-trophy", 80, 6, 15, 18, tr("A trophy", "Un trofeo")),
          H(5, 8, 72, 10, "My Conclusion", "Mi conclusión", { color: "#fff3c4" }),
          SH("rounded", 5, 26, 90, 56, "#ffffff"),
          B(
            8,
            29,
            84,
            50,
            "What did comparing teach you? Which would you choose, and why?",
            "¿Qué aprendiste al comparar? ¿Cuál elegirías y por qué?",
          ),
          AUD(5, 85),
        ],
      },
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────
  {
    id: "persuasive-book",
    title: tr("Persuasive Book", "Libro persuasivo"),
    kind: "picture",
    format: "portrait",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "argument",
    purpose: tr("Argue", "Argumentar"),
    summary: tr(
      "Convince your reader with a clear opinion, strong reasons and examples, and a call to action.",
      "Convence a tu lector con una opinión clara, buenas razones y ejemplos, y un llamado a la acción.",
    ),
    targets: F(
      [
        "State an opinion with I think / I believe / In my opinion.",
        "Dar una opinión con Pienso que / Creo que / En mi opinión.",
      ],
      [
        "Give reasons with because and add examples with for example.",
        "Dar razones con porque y agregar ejemplos con por ejemplo.",
      ],
      [
        "Use should and could to make a polite call to action.",
        "Usar deberíamos y podríamos para hacer un llamado a la acción con cortesía.",
      ],
    ),
    finished: tr(
      "A 6-page persuasive picture book with an opinion, two reasons with examples, a response to the other side, and a call to action.",
      "Un libro ilustrado persuasivo de 6 páginas con una opinión, dos razones con ejemplos, una respuesta al otro lado y un llamado a la acción.",
    ),
    teacherNotes: tr(
      "Written for grades 3-5 but works for older newcomers. Launch with a 'four corners' vote on a school question and ask students why they chose their corner. Listen for because followed by a real reason, not a repeat of the opinion. Fade the opinion frames first; keep the example frames longer.",
      "Escrito para los grados 3-5, pero sirve para recién llegados mayores. Empiece con una votación de 'cuatro esquinas' sobre una pregunta de la escuela y pregunte por qué eligieron su esquina. Escuche porque seguido de una razón real, no la misma opinión repetida. Retire primero los inicios de opinión; deje más tiempo los de ejemplos.",
    ),
    wordBank: F(
      ["opinion", "opinión"],
      ["I believe", "creo que"],
      ["reason", "razón"],
      ["because", "porque"],
      ["for example", "por ejemplo"],
      ["should", "debería / deberíamos"],
      ["important", "importante"],
      ["some people think", "algunas personas piensan"],
      ["agree", "estar de acuerdo"],
    ),
    example: tr(
      "I believe our school should have a garden. First, a garden helps us learn. For example, we could measure how fast bean plants grow in math and science. Second, a garden gives us healthy food. Kids could taste fresh tomatoes and peppers that they grew themselves. Some people think a garden is too much work. But each class could take care of it for one week, so no one would do it alone. Please help us! Sign our letter to the principal so we can start planting this spring.",
      "Creo que nuestra escuela debería tener un huerto. Primero, un huerto nos ayuda a aprender. Por ejemplo, podríamos medir qué tan rápido crecen los frijoles en matemáticas y ciencias. Segundo, un huerto nos da comida sana. Los niños podrían probar tomates y pimientos frescos que sembraron ellos mismos. Algunas personas piensan que un huerto es mucho trabajo. Pero cada clase podría cuidarlo una semana, así nadie lo haría solo. ¡Ayúdanos! Firma nuestra carta a la directora para empezar a sembrar esta primavera.",
    ),
    pages: [
      {
        bg: "#e86a50",
        prompt: tr(
          "Make your cover. Your title can be your opinion, like 'We Need a School Garden!'",
          "Haz tu portada. Tu título puede ser tu opinión, como '¡Necesitamos un huerto escolar!'",
        ),
        elements: [
          SH("star", 60, 4, 34, 26, "#f2b134"),
          ART("obj-microphone", 68, 8, 18, 18, tr("A microphone", "Un micrófono")),
          SH("rounded", 6, 32, 88, 30, "#fffaf0"),
          TITLE(9, 35, 82, 20, { color: "#5a1e3a", font: "rounded", size: 7.5, align: "left" }),
          BYLINE(9, 55, 82, 6, { color: "#5a1e3a" }),
          IMG(
            6,
            66,
            88,
            26,
            "Add a picture that shows what you want.",
            "Agrega una imagen que muestre lo que quieres.",
          ),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "State your opinion clearly. What do you believe, and about what?",
          "Di tu opinión con claridad. ¿Qué crees y sobre qué?",
        ),
        frames: F(
          ["I think ___ should ___.", "Pienso que ___ debería ___."],
          ["In my opinion, ___.", "En mi opinión, ___."],
        ),
        frames68: F(
          ["I strongly believe that ___.", "Creo firmemente que ___."],
          ["It is time for ___ to ___.", "Es hora de que ___ ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "My Opinion", "Mi opinión", { color: "#9a4a26" }),
          SH("rounded", 4, 15, 92, 30, "#fff3c4", "#e86a50", 0.8),
          B(
            8,
            18,
            84,
            24,
            "What do you believe? Say it in one or two clear sentences.",
            "¿Qué crees? Dilo en una o dos oraciones claras.",
            { size: 3.8 },
          ),
          IMG(
            6,
            48,
            88,
            35,
            "Draw a picture that shows your opinion.",
            "Dibuja una imagen que muestre tu opinión.",
          ),
          AUD(6, 86),
        ],
      },
      ...[
        [
          "#e7f4f2",
          "#075568",
          "Reason 1",
          "Razón 1",
          "First, ___.",
          "Primero, ___.",
          "The most important reason is ___.",
          "La razón más importante es ___.",
        ],
        [
          "#e9edf8",
          "#1b2a5c",
          "Reason 2",
          "Razón 2",
          "Second, ___.",
          "Segundo, ___.",
          "Another reason is that ___.",
          "Otra razón es que ___.",
        ],
      ].map(([bg, ink, en, es, f1en, f1es, g1en, g1es]) => ({
        bg,
        prompt: tr(
          `${en}: give one reason for your opinion and an example that proves it.`,
          `${es}: da una razón para tu opinión y un ejemplo que la pruebe.`,
        ),
        frames: F([f1en, f1es], ["For example, ___.", "Por ejemplo, ___."]),
        frames68: F(
          [g1en, g1es],
          ["For instance, ___, which shows ___.", "Por ejemplo, ___, lo que muestra ___."],
        ),
        elements: [
          H(6, 5, 88, 8, en, es, { color: ink }),
          B(6, 15, 88, 22, "What is your reason? Use because.", "¿Cuál es tu razón? Usa porque."),
          SH("rounded", 4, 40, 92, 44, "#ffffff", ink),
          H(8, 42, 40, 6, "Example", "Ejemplo", { size: 3.4, font: "rounded", color: ink }),
          B(
            8,
            49,
            48,
            33,
            "Give an example, a fact or a story that proves your reason.",
            "Da un ejemplo, un dato o una historia que pruebe tu razón.",
          ),
          IMG(60, 44, 33, 38, "Draw your example.", "Dibuja tu ejemplo."),
          AUD(6, 86),
        ],
      })),
      {
        bg: "#f8e8ef",
        prompt: tr(
          "What might someone who disagrees say? Answer them politely.",
          "¿Qué diría alguien que no está de acuerdo? Respóndele con respeto.",
        ),
        frames: F(
          ["Some people think ___.", "Algunas personas piensan que ___."],
          ["But ___.", "Pero ___."],
        ),
        frames68: F(
          ["Others may argue that ___.", "Otros podrían decir que ___."],
          [
            "However, this is not a strong reason because ___.",
            "Sin embargo, esta no es una razón fuerte porque ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "The Other Side", "El otro lado", { color: "#5a1e3a" }),
          ART("char-leo", 6, 15, 24, 34, tr("A boy thinking", "Un niño pensando")),
          BUB(
            "thought",
            "left",
            32,
            15,
            62,
            34,
            "What would someone who disagrees say?",
            "¿Qué diría alguien que no está de acuerdo?",
          ),
          H(6, 52, 88, 7, "My answer", "Mi respuesta", {
            size: 3.6,
            font: "rounded",
            color: "#5a1e3a",
          }),
          B(
            6,
            60,
            88,
            24,
            "Answer politely. Why is your opinion still stronger?",
            "Responde con respeto. ¿Por qué tu opinión sigue siendo más fuerte?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#f2b134",
        prompt: tr(
          "End with a call to action. Restate your opinion and tell readers what they should do.",
          "Termina con un llamado a la acción. Repite tu opinión y di a los lectores qué deberían hacer.",
        ),
        frames: F(
          ["Please ___!", "¡Por favor, ___!"],
          ["We should ___ so that ___.", "Deberíamos ___ para que ___."],
        ),
        frames68: F(
          ["For all these reasons, ___.", "Por todas estas razones, ___."],
          ["I urge you to ___ because ___.", "Te pido que ___ porque ___."],
        ),
        elements: [
          ART("fx-pow", 70, 4, 24, 18, tr("A comic burst", "Una explosión de cómic")),
          H(6, 7, 62, 9, "Take Action!", "¡Actúa!", { color: "#5a1e3a", font: "rounded", size: 6 }),
          SH("rounded", 4, 24, 92, 58, "#fffaf0"),
          B(
            8,
            27,
            84,
            26,
            "Say your opinion again in new words.",
            "Di tu opinión otra vez con otras palabras.",
          ),
          B(
            8,
            55,
            84,
            24,
            "What should readers do now? Be specific.",
            "¿Qué deberían hacer los lectores ahora? Sé específico.",
          ),
          AUD(6, 85),
        ],
      },
    ],
  },

  // 9 ─────────────────────────────────────────────────────────────
  {
    id: "evidence-argument",
    title: tr("Evidence-Based Argument", "Argumento con evidencia"),
    kind: "report",
    format: "portrait",
    grades: ["6-8"],
    family: false,
    tag: "argument",
    purpose: tr("Argue", "Argumentar"),
    summary: tr(
      "Make a claim, support it with cited evidence, answer a counterclaim and close with a strong conclusion.",
      "Haz una afirmación, apóyala con evidencia citada, responde a una contraargumentación y cierra con una conclusión fuerte.",
    ),
    targets: F(
      [
        "Introduce evidence and cite its source with According to ___ / The article states ___.",
        "Presentar evidencia y citar su fuente con Según ___ / El artículo dice ___.",
      ],
      [
        "Explain how evidence supports a claim with This shows / This suggests.",
        "Explicar cómo la evidencia apoya una afirmación con Esto muestra / Esto sugiere.",
      ],
      [
        "Acknowledge and rebut a counterclaim with Some argue ___; however, ___.",
        "Reconocer y refutar una contraargumentación con Algunos dicen que ___; sin embargo, ___.",
      ],
      [
        "Use precise academic verbs (demonstrates, reveals, supports) instead of 'says'.",
        "Usar verbos académicos precisos (demuestra, revela, apoya) en lugar de 'dice'.",
      ],
    ),
    finished: tr(
      "A 7-page argument with a claim, two reasons backed by cited evidence, a counterclaim and rebuttal, a conclusion and a source list.",
      "Un argumento de 7 páginas con una afirmación, dos razones con evidencia citada, una contraargumentación y su refutación, una conclusión y una lista de fuentes.",
    ),
    teacherNotes: tr(
      "Written for grades 6-8. Give students two or three short texts on one debatable question so every claim rests on shared evidence. Listen for students separating the quote from their own explanation; the 'This shows...' line is where the thinking happens. Fade the citation frame once students cite on their own, but keep the source page.",
      "Escrito para los grados 6-8. Dé dos o tres textos cortos sobre una pregunta debatible para que cada afirmación se base en evidencia común. Escuche que separen la cita de su propia explicación; la línea 'Esto muestra...' es donde está el pensamiento. Retire el inicio de cita cuando citen solos, pero mantenga la página de fuentes.",
    ),
    wordBank: F(
      ["claim", "afirmación"],
      ["evidence", "evidencia"],
      ["according to", "según"],
      ["source", "fuente"],
      ["this shows", "esto muestra"],
      ["counterclaim", "contraargumentación"],
      ["rebuttal", "refutación"],
      ["however", "sin embargo"],
      ["demonstrates", "demuestra"],
      ["therefore", "por lo tanto"],
      ["cite", "citar"],
    ),
    example: tr(
      "Schools should start later in the morning. According to a health article from the class packet, most teenagers need eight to ten hours of sleep. This shows that a 7:30 start makes it hard for students to rest enough. The second article states that one district saw attendance rise after moving its start time later. This suggests that rested students come to school more often. Some argue that a later start makes after-school activities end too late. However, activities could shift by thirty minutes, which is a small cost for healthier students. Therefore, a later start is worth it.",
      "Las escuelas deberían empezar más tarde por la mañana. Según un artículo de salud del paquete de la clase, la mayoría de los adolescentes necesitan dormir de ocho a diez horas. Esto muestra que empezar a las 7:30 hace difícil que los estudiantes descansen lo suficiente. El segundo artículo dice que en un distrito la asistencia subió después de empezar más tarde. Esto sugiere que los estudiantes descansados van más a la escuela. Algunos dicen que empezar más tarde hace que las actividades después de clase terminen muy tarde. Sin embargo, las actividades podrían moverse treinta minutos, un costo pequeño por tener estudiantes más sanos. Por lo tanto, empezar más tarde vale la pena.",
    ),
    pages: [
      {
        bg: "#0b3d4a",
        prompt: tr(
          "Make your cover. Your title can be your claim.",
          "Haz tu portada. Tu título puede ser tu afirmación.",
        ),
        elements: [
          SH("rect", 4, 4, 6, 92, "#f2b134"),
          TITLE(14, 12, 80, 30, { color: "#ffffff", font: "fraunces", size: 7, align: "left" }),
          BYLINE(14, 44, 80, 7, { color: "#fff3c4" }),
          SH("line", 14, 54, 60, 0.1, "none", "#f2b134", 1),
          ART("obj-newspaper", 14, 60, 30, 30, tr("A newspaper", "Un periódico")),
          ART("obj-magnifier", 50, 64, 22, 24, tr("A magnifying glass", "Una lupa")),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Introduce the issue and state your claim. Give readers the background they need.",
          "Presenta el tema y di tu afirmación. Da a los lectores la información que necesitan.",
        ),
        frames: F(
          ["Many people wonder if ___.", "Mucha gente se pregunta si ___."],
          ["I claim that ___.", "Afirmo que ___."],
        ),
        frames68: F(
          ["The question of whether ___ affects ___.", "La pregunta de si ___ afecta a ___."],
          [
            "Based on the evidence, ___ should ___ because ___ and ___.",
            "Según la evidencia, ___ debería ___ porque ___ y ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "The Issue and My Claim", "El tema y mi afirmación", { color: "#0b3d4a" }),
          B(
            6,
            15,
            88,
            30,
            "What is the issue? Why does it matter? Give background.",
            "¿Cuál es el tema? ¿Por qué importa? Da información de fondo.",
          ),
          SH("rounded", 4, 49, 92, 33, "#e7f4f2", "#075568", 0.8),
          H(8, 51, 84, 6, "Claim", "Afirmación", { size: 3.4, font: "rounded", color: "#075568" }),
          B(
            8,
            58,
            84,
            22,
            "State your position in one clear sentence.",
            "Di tu posición en una oración clara.",
            { size: 3.6 },
          ),
          AUD(6, 85),
        ],
      },
      ...[
        [
          "#fffaf0",
          "#075568",
          "Reason 1",
          "Razón 1",
          "First, ___.",
          "Primero, ___.",
          "One reason ___ is that ___.",
          "Una razón por la que ___ es que ___.",
        ],
        [
          "#e9edf8",
          "#1b2a5c",
          "Reason 2",
          "Razón 2",
          "Also, ___.",
          "Además, ___.",
          "A second reason is that ___.",
          "Una segunda razón es que ___.",
        ],
      ].map(([bg, ink, en, es, f1en, f1es, g1en, g1es]) => ({
        bg,
        prompt: tr(
          `${en}: state a reason, quote or paraphrase evidence from a source, and explain how it supports your claim.`,
          `${es}: di una razón, cita o parafrasea evidencia de una fuente y explica cómo apoya tu afirmación.`,
        ),
        frames: F(
          [f1en, f1es],
          ['According to ___, "___."', 'Según ___, "___".'],
          ["This shows ___.", "Esto muestra ___."],
        ),
        frames68: F(
          [g1en, g1es],
          ["The author of ___ reports that ___.", "El autor / La autora de ___ informa que ___."],
          [
            "This evidence demonstrates ___ because ___.",
            "Esta evidencia demuestra ___ porque ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, en, es, { color: ink }),
          B(6, 14, 88, 13, "State your reason in one sentence.", "Di tu razón en una oración."),
          SH("rounded", 4, 29, 92, 28, "#ffffff", ink),
          H(8, 30, 40, 6, "Evidence", "Evidencia", { size: 3.2, font: "rounded", color: ink }),
          B(
            8,
            36,
            84,
            20,
            "Quote or paraphrase evidence from a source.",
            "Cita o parafrasea evidencia de una fuente.",
          ),
          CAP(
            8,
            59,
            84,
            6,
            "Source: title, author or website, page",
            "Fuente: título, autor o sitio web, página",
          ),
          H(6, 66, 88, 6, "This shows...", "Esto muestra...", {
            size: 3.2,
            font: "rounded",
            color: ink,
          }),
          B(
            6,
            72,
            60,
            20,
            "Explain how the evidence supports your claim.",
            "Explica cómo la evidencia apoya tu afirmación.",
          ),
          AUD(66, 80),
        ],
      })),
      {
        bg: "#f8e8ef",
        prompt: tr(
          "Present the strongest counterclaim fairly, then rebut it with reasoning or evidence.",
          "Presenta con justicia la contraargumentación más fuerte y luego refútala con razonamiento o evidencia.",
        ),
        frames: F(
          ["Some people say ___.", "Algunas personas dicen que ___."],
          ["But ___ because ___.", "Pero ___ porque ___."],
        ),
        frames68: F(
          ["Critics might argue that ___.", "Algunos críticos podrían decir que ___."],
          ["While this point has some merit, ___.", "Aunque este punto tiene algo de valor, ___."],
          ["However, the evidence reveals ___.", "Sin embargo, la evidencia revela ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "Counterclaim and Rebuttal", "Contraargumentación y refutación", {
            color: "#5a1e3a",
          }),
          SH("rounded", 4, 15, 92, 32, "#ffffff", "#8a3a5c"),
          H(8, 17, 84, 6, "Counterclaim", "Contraargumentación", {
            size: 3.2,
            font: "rounded",
            color: "#5a1e3a",
          }),
          B(
            8,
            23,
            84,
            22,
            "What would someone who disagrees argue? State it fairly.",
            "¿Qué diría alguien que no está de acuerdo? Dilo con justicia.",
          ),
          SH("arrow", 44, 48, 12, 6, "#8a3a5c"),
          SH("rounded", 4, 55, 92, 29, "#ffffff", "#8a3a5c"),
          H(8, 57, 84, 6, "Rebuttal", "Refutación", {
            size: 3.2,
            font: "rounded",
            color: "#5a1e3a",
          }),
          B(
            8,
            63,
            84,
            20,
            "Why is your claim still stronger? Use reasoning or evidence.",
            "¿Por qué tu afirmación sigue siendo más fuerte? Usa razonamiento o evidencia.",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Conclude. Restate your claim in new words, sum up your reasons, and leave a final thought.",
          "Concluye. Repite tu afirmación con otras palabras, resume tus razones y deja una idea final.",
        ),
        frames: F(
          ["In conclusion, ___.", "En conclusión, ___."],
          ["For these reasons, ___.", "Por estas razones, ___."],
        ),
        frames68: F(
          ["Taken together, the evidence shows ___.", "En conjunto, la evidencia muestra ___."],
          ["If ___, then ___; therefore, ___.", "Si ___, entonces ___; por lo tanto, ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "Conclusion", "Conclusión", { color: "#0b3d4a" }),
          B(
            6,
            15,
            88,
            46,
            "Restate your claim, sum up both reasons, and end with why it matters.",
            "Repite tu afirmación, resume las dos razones y termina diciendo por qué importa.",
          ),
          IMG(
            6,
            64,
            50,
            20,
            "Add an image that supports your conclusion.",
            "Agrega una imagen que apoye tu conclusión.",
          ),
          AUD(62, 70),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "List every source you used so readers can check your evidence.",
          "Haz la lista de todas las fuentes que usaste para que los lectores puedan revisar tu evidencia.",
        ),
        frames: F(
          ["Title: ___. Author: ___.", "Título: ___. Autor: ___."],
          ["Website or book: ___.", "Sitio web o libro: ___."],
        ),
        frames68: F(
          [
            'Author. "Title." Publisher or website, date.',
            'Autor. "Título". Editorial o sitio web, fecha.',
          ],
          ["I chose this source because ___.", "Elegí esta fuente porque ___."],
        ),
        elements: [
          ART("obj-book", 78, 4, 16, 12, tr("A book", "Un libro")),
          H(6, 5, 70, 8, "Sources", "Fuentes", { color: "#0b3d4a" }),
          B(
            6,
            18,
            88,
            22,
            "Source 1: author, title, where you found it, date.",
            "Fuente 1: autor, título, dónde la encontraste, fecha.",
          ),
          SH("line", 6, 42, 88, 0.1, "none", "#0b3d4a", 0.4),
          B(
            6,
            45,
            88,
            22,
            "Source 2: author, title, where you found it, date.",
            "Fuente 2: autor, título, dónde la encontraste, fecha.",
          ),
          SH("line", 6, 69, 88, 0.1, "none", "#0b3d4a", 0.4),
          B(6, 72, 88, 20, "Source 3 (optional)", "Fuente 3 (opcional)"),
        ],
      },
    ],
  },

  // 10 ────────────────────────────────────────────────────────────
  {
    id: "biography",
    title: tr("Biography", "Biografía"),
    kind: "informational",
    format: "portrait",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Inform", "Informar"),
    summary: tr(
      "Tell the true story of a person's life, with a timeline of key events and why they matter.",
      "Cuenta la historia real de la vida de una persona, con una línea de tiempo de sucesos clave y por qué importan.",
    ),
    targets: F(
      [
        "Use past-tense verbs, including irregular ones (was born, grew up, became).",
        "Usar verbos en pasado, incluso irregulares (nació, creció, se convirtió).",
      ],
      [
        "Use time expressions: in 1990, when she was ten, later, years after.",
        "Usar expresiones de tiempo: en 1990, cuando tenía diez años, más tarde, años después.",
      ],
      [
        "Explain importance with because of ___ / ___ changed ___ by ___.",
        "Explicar la importancia con gracias a ___ / ___ cambió ___ al ___.",
      ],
    ),
    finished: tr(
      "A 7-page biography with the person's early life, a timeline, a challenge they faced, their legacy and sources.",
      "Una biografía de 7 páginas con la infancia de la persona, una línea de tiempo, un reto que enfrentó, su legado y fuentes.",
    ),
    teacherNotes: tr(
      "Students can write about a historical figure, a scientist, an artist or a family member they interview. Check that dates on the timeline match the text, and listen for irregular past-tense verbs during partner retells. Keep a shared chart of irregular past forms; fade the time-expression frames once students vary them.",
      "Los estudiantes pueden escribir sobre una figura histórica, una científica, un artista o un familiar al que entrevisten. Revise que las fechas de la línea de tiempo coincidan con el texto y escuche los verbos irregulares en pasado cuando vuelvan a contar en pareja. Tenga una tabla común de formas irregulares; retire los inicios de tiempo cuando los varíen solos.",
    ),
    wordBank: F(
      ["was born", "nació"],
      ["grew up", "creció"],
      ["became", "se convirtió en"],
      ["later", "más tarde"],
      ["challenge", "reto"],
      ["achievement", "logro"],
      ["legacy", "legado"],
      ["timeline", "línea de tiempo"],
      ["inspire", "inspirar"],
      ["important", "importante"],
    ),
    example: tr(
      "My grandmother, Rosa Medina, was born in 1958 in a small town in the mountains. She grew up helping her parents sell bread at the market. When she was twelve, she taught herself to sew from an old book. Later, she moved to the city and opened a tailor shop with one machine. Her biggest challenge was learning English when she came to this country at forty. She took night classes for three years. Today, her shop dresses half the weddings on our street. Because of her, I know it is never too late to learn.",
      "Mi abuela, Rosa Medina, nació en 1958 en un pueblo pequeño de las montañas. Creció ayudando a sus padres a vender pan en el mercado. Cuando tenía doce años, aprendió sola a coser con un libro viejo. Más tarde, se mudó a la ciudad y abrió una sastrería con una sola máquina. Su mayor reto fue aprender inglés cuando llegó a este país a los cuarenta años. Tomó clases nocturnas durante tres años. Hoy, su taller viste a la mitad de las bodas de nuestra calle. Gracias a ella, sé que nunca es tarde para aprender.",
    ),
    pages: [
      {
        bg: "#9a4a26",
        prompt: tr(
          "Make your cover. Add a portrait of your person. Your title can be their name.",
          "Haz tu portada. Agrega un retrato de tu persona. Tu título puede ser su nombre.",
        ),
        elements: [
          SH("rounded", 4, 4, 92, 92, "none", "#fff3c4", 0.8),
          SH("ellipse", 22, 10, 56, 44, "#fff3c4"),
          IMG(30, 14, 40, 36, "Add a portrait of your person.", "Agrega un retrato de tu persona."),
          TITLE(8, 58, 84, 18, { color: "#ffffff", font: "fraunces", size: 7.5, align: "center" }),
          BYLINE(8, 78, 84, 7, { color: "#fff3c4", align: "center" }),
          ART("obj-star", 44, 86, 12, 8, tr("A star", "Una estrella")),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Introduce your person. Who are they, and why should readers know about them?",
          "Presenta a tu persona. ¿Quién es y por qué deberían conocerla los lectores?",
        ),
        frames: F(
          ["___ is famous for ___.", "___ es famoso / famosa por ___."],
          ["You should know about ___ because ___.", "Deberías conocer a ___ porque ___."],
        ),
        frames68: F(
          [
            "___ is best known for ___, but ___.",
            "___ es más conocido / conocida por ___, pero ___.",
          ],
          ["Few people realize that ___.", "Poca gente sabe que ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "Who Is This Person?", "¿Quién es esta persona?", { color: "#9a4a26" }),
          IMG(
            6,
            15,
            40,
            40,
            "Add a picture of the person doing something important.",
            "Agrega una imagen de la persona haciendo algo importante.",
          ),
          B(
            49,
            15,
            45,
            40,
            "Who is this person? What are they known for?",
            "¿Quién es esta persona? ¿Por qué es conocida?",
          ),
          B(
            6,
            58,
            88,
            25,
            "Why should readers learn about them?",
            "¿Por qué deberían conocerla los lectores?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#fbeadf",
        prompt: tr(
          "Early life. Where and when were they born? What was their childhood like?",
          "La infancia. ¿Dónde y cuándo nació? ¿Cómo fue su niñez?",
        ),
        frames: F(
          ["___ was born in ___ in ___.", "___ nació en ___ en ___."],
          ["When ___ was young, ___.", "Cuando ___ era joven, ___."],
        ),
        frames68: F(
          ["Growing up in ___, ___ learned ___.", "Al crecer en ___, ___ aprendió ___."],
          [
            "Even as a child, ___ showed signs of ___.",
            "Desde niño / niña, ___ mostró señales de ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "Early Life", "La infancia", { color: "#9a4a26" }),
          B(
            6,
            15,
            52,
            52,
            "When and where was the person born? What was growing up like?",
            "¿Cuándo y dónde nació la persona? ¿Cómo fue su niñez?",
          ),
          IMG(61, 15, 33, 52, "Draw a place from their childhood.", "Dibuja un lugar de su niñez."),
          CAP(61, 69, 33, 8, "Write a caption for your picture.", "Escribe un pie de foto."),
          AUD(6, 72),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Build a timeline. Put four important events in order with a date or age for each.",
          "Haz una línea de tiempo. Pon en orden cuatro sucesos importantes con una fecha o edad para cada uno.",
        ),
        frames: F(["In ___, ___.", "En ___, ___."], ["Later, ___.", "Más tarde, ___."]),
        frames68: F(
          ["By the age of ___, ___ had ___.", "A los ___ años, ___ ya había ___."],
          ["___ years after ___, ___.", "___ años después de ___, ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "Timeline", "Línea de tiempo", { color: "#9a4a26" }),
          SH("rect", 22, 16, 1.6, 76, "#9a4a26"),
          SH("ellipse", 19.5, 18, 6.6, 4.4, "#f2b134", "#9a4a26"),
          SH("ellipse", 19.5, 37, 6.6, 4.4, "#f2b134", "#9a4a26"),
          SH("ellipse", 19.5, 56, 6.6, 4.4, "#f2b134", "#9a4a26"),
          SH("ellipse", 19.5, 75, 6.6, 4.4, "#f2b134", "#9a4a26"),
          B(5, 17, 14, 7, "Date", "Fecha", { size: 2.8, align: "right" }),
          B(5, 36, 14, 7, "Date", "Fecha", { size: 2.8, align: "right" }),
          B(5, 55, 14, 7, "Date", "Fecha", { size: 2.8, align: "right" }),
          B(5, 74, 14, 7, "Date", "Fecha", { size: 2.8, align: "right" }),
          B(29, 16, 65, 16, "Event 1: what happened?", "Suceso 1: ¿qué pasó?", { size: 2.9 }),
          B(29, 35, 65, 16, "Event 2: what happened?", "Suceso 2: ¿qué pasó?", { size: 2.9 }),
          B(29, 54, 65, 16, "Event 3: what happened?", "Suceso 3: ¿qué pasó?", { size: 2.9 }),
          B(29, 73, 65, 16, "Event 4: what happened?", "Suceso 4: ¿qué pasó?", { size: 2.9 }),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "A challenge. What problem did this person face, and how did they respond?",
          "Un reto. ¿Qué problema enfrentó esta persona y cómo respondió?",
        ),
        frames: F(
          ["One problem ___ faced was ___.", "Un problema que enfrentó ___ fue ___."],
          ["To solve it, ___.", "Para resolverlo, ___."],
        ),
        frames68: F(
          ["Despite ___, ___ continued to ___.", "A pesar de ___, ___ siguió ___."],
          ["This obstacle forced ___ to ___.", "Este obstáculo obligó a ___ a ___."],
        ),
        elements: [
          H(6, 5, 88, 8, "A Challenge", "Un reto"),
          IMG(6, 15, 88, 30, "Draw the challenge.", "Dibuja el reto."),
          B(
            6,
            48,
            88,
            35,
            "What was the challenge? What did the person do? What happened?",
            "¿Cuál fue el reto? ¿Qué hizo la persona? ¿Qué pasó?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "Legacy. How did this person change things? What can we learn from them?",
          "El legado. ¿Cómo cambió las cosas esta persona? ¿Qué podemos aprender de ella?",
        ),
        frames: F(
          ["Because of ___, ___.", "Gracias a ___, ___."],
          ["___ teaches us ___.", "___ nos enseña ___."],
        ),
        frames68: F(
          ["___'s greatest legacy is ___.", "El mayor legado de ___ es ___."],
          [
            "Today, ___ still inspires people to ___.",
            "Hoy, ___ todavía inspira a la gente a ___.",
          ],
        ),
        elements: [
          ART("obj-trophy", 76, 5, 18, 18, tr("A trophy", "Un trofeo")),
          H(6, 8, 68, 9, "Legacy", "Legado", { color: "#fff3c4" }),
          SH("rounded", 4, 26, 92, 56, "#ffffff"),
          B(
            8,
            29,
            84,
            50,
            "How did this person change their community or the world? What can we learn?",
            "¿Cómo cambió esta persona su comunidad o el mundo? ¿Qué podemos aprender?",
          ),
          AUD(6, 85),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "List your sources: books, websites, videos or the person you interviewed.",
          "Haz la lista de tus fuentes: libros, sitios web, videos o la persona que entrevistaste.",
        ),
        frames: F(
          ["I learned facts from ___.", "Aprendí datos de ___."],
          ["I interviewed ___ on ___.", "Entrevisté a ___ el ___."],
        ),
        frames68: F(
          [
            'Author. "Title." Publisher or website, date.',
            'Autor. "Título". Editorial o sitio web, fecha.',
          ],
          ["Interview with ___, ___ (date).", "Entrevista con ___, ___ (fecha)."],
        ),
        elements: [
          H(6, 5, 88, 8, "Sources", "Fuentes", { color: "#9a4a26" }),
          B(
            6,
            16,
            88,
            50,
            "List each source on its own line: who made it, the title, where you found it.",
            "Escribe cada fuente en su propia línea: quién la hizo, el título, dónde la encontraste.",
          ),
          IMG(
            6,
            70,
            30,
            22,
            "Optional: a photo from your research.",
            "Opcional: una foto de tu investigación.",
          ),
        ],
      },
    ],
  },

  // 11 ────────────────────────────────────────────────────────────
  {
    id: "comic-conversation",
    title: tr("Comic Conversation", "Conversación en cómic"),
    kind: "comic",
    format: "comic",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "comic",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Write a comic where one character asks for help, clears up a misunderstanding and agrees on a plan.",
      "Escribe un cómic en el que un personaje pide ayuda, aclara un malentendido y se pone de acuerdo en un plan.",
    ),
    targets: F(
      [
        "Ask for help politely with Can you help me ___? / Could you show me ___?",
        "Pedir ayuda con cortesía: ¿Me puedes ayudar a ___? / ¿Me podrías mostrar ___?",
      ],
      [
        "Clarify a misunderstanding with Do you mean ___? / What I meant was ___.",
        "Aclarar un malentendido con ¿Quieres decir ___? / Lo que quise decir fue ___.",
      ],
      [
        "Agree on a plan with Let's ___ / First you ___, then I ___.",
        "Ponerse de acuerdo en un plan con Vamos a ___ / Primero tú ___, luego yo ___.",
      ],
      [
        "Show thoughts and feelings in thought bubbles and through characters' faces.",
        "Mostrar pensamientos y sentimientos en burbujas de pensamiento y con las caras de los personajes.",
      ],
    ),
    finished: tr(
      "A 5-page comic with panels, speech and thought bubbles, showing a real conversation from asking for help to a shared plan.",
      "Un cómic de 5 páginas con viñetas y burbujas de diálogo y pensamiento que muestra una conversación real, desde pedir ayuda hasta un plan común.",
    ),
    teacherNotes: tr(
      "Have partners role-play the conversation before drawing: one asks for help, the other misunderstands, and they fix it. Listen for clarifying questions; they are the language this template is built to practice. Students can record the dialogue in voices on each page. Fade the bubble frames once partners improvise the misunderstanding without them.",
      "Pida a las parejas que actúen la conversación antes de dibujar: uno pide ayuda, el otro entiende mal y lo arreglan. Escuche las preguntas para aclarar; ese es el lenguaje que esta plantilla practica. Pueden grabar el diálogo con voces en cada página. Retire los inicios de burbuja cuando improvisen el malentendido sin ellos.",
    ),
    wordBank: F(
      ["Can you help me?", "¿Me puedes ayudar?"],
      ["Do you mean...?", "¿Quieres decir...?"],
      ["I meant...", "Quise decir..."],
      ["Oh, I see!", "¡Ah, ya entiendo!"],
      ["Let's...", "Vamos a..."],
      ["first", "primero"],
      ["then", "luego"],
      ["deal", "trato"],
      ["confused", "confundido / confundida"],
    ),
    example: tr(
      'Panel 1: Sam stares at a math worksheet. Thought bubble: "I don\'t get number five." Panel 2: Sam: "Amara, can you help me with the table?" Panel 3: Amara picks up the cafeteria table. Amara: "Sure! Where do you want it?" Panel 4: Sam laughs. "No! I meant the ratio table on my paper." Amara: "Oh, I see! Do you mean the one with cups and spoons?" Panel 5: Sam: "Yes!" Amara: "Let\'s do it like this. First, you read the row. Then I\'ll show you how I doubled it." Sam: "Deal!"',
      'Viñeta 1: Sam mira una hoja de matemáticas. Burbuja de pensamiento: "No entiendo el número cinco". Viñeta 2: Sam: "Amara, ¿me ayudas con la tabla?". Viñeta 3: Amara levanta la mesa de la cafetería. Amara: "¡Claro! ¿Dónde la quieres?". Viñeta 4: Sam se ríe. "¡No! Quise decir la tabla de razones de mi hoja". Amara: "¡Ah, ya entiendo! ¿Quieres decir la de tazas y cucharas?". Viñeta 5: Sam: "¡Sí!". Amara: "Hagámoslo así. Primero, tú lees la fila. Luego, yo te muestro cómo la dupliqué". Sam: "¡Trato hecho!".',
    ),
    pages: [
      {
        bg: "#fff3c4",
        prompt: tr(
          "Make your cover. Show your two characters and give your comic a title.",
          "Haz tu portada. Muestra a tus dos personajes y ponle título a tu cómic.",
        ),
        elements: [
          SH("rect", 4, 4, 92, 24, "#e86a50", "#1b1f3b", 0.8),
          TITLE(7, 6, 86, 18, { color: "#1b1f3b", font: "comic", size: 8, align: "center" }),
          ART(
            "char-sam",
            8,
            36,
            36,
            50,
            tr("Sam, one of the characters", "Sam, uno de los personajes"),
          ),
          ART(
            "char-amara",
            56,
            36,
            36,
            50,
            tr("Amara, one of the characters", "Amara, una de los personajes"),
          ),
          ART(
            "fx-question-burst",
            40,
            32,
            20,
            16,
            tr("A question burst", "Una explosión de pregunta"),
          ),
          BYLINE(6, 88, 88, 6, { color: "#1b1f3b", align: "center", font: "comic" }),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Show the problem. Panel 1: a character is stuck. Panel 2: they ask someone for help.",
          "Muestra el problema. Viñeta 1: un personaje está atorado. Viñeta 2: le pide ayuda a alguien.",
        ),
        frames: F(
          ["I don't understand ___.", "No entiendo ___."],
          ["Can you help me with ___?", "¿Me puedes ayudar con ___?"],
        ),
        frames68: F(
          ["I've been trying to ___, but ___.", "He estado intentando ___, pero ___."],
          ["Would you mind showing me how to ___?", "¿Te molestaría mostrarme cómo ___?"],
        ),
        elements: [
          PANEL(5, 5, 90, 42),
          ART(
            "char-sam",
            10,
            18,
            26,
            28,
            tr("A character who looks stuck", "Un personaje que parece atorado"),
          ),
          BUB(
            "thought",
            "bottom-left",
            38,
            8,
            52,
            22,
            "What is the character thinking? What are they stuck on?",
            "¿Qué piensa el personaje? ¿En qué está atorado?",
          ),
          BUB("caption", "none", 38, 33, 52, 10, "Where are they?", "¿Dónde están?"),
          PANEL(5, 50, 90, 44),
          ART("char-sam", 8, 64, 24, 28, tr("The first character", "El primer personaje")),
          ART("char-amara", 68, 64, 24, 28, tr("A friend", "Una amiga")),
          BUB(
            "speech",
            "bottom-left",
            22,
            53,
            44,
            18,
            "Ask for help politely.",
            "Pide ayuda con cortesía.",
          ),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "The misunderstanding. Panel 3: the helper misunderstands. Panel 4: the first character notices.",
          "El malentendido. Viñeta 3: quien ayuda entiende mal. Viñeta 4: el primer personaje se da cuenta.",
        ),
        frames: F(
          ["Sure! I'll ___.", "¡Claro! Voy a ___."],
          ["Wait, that's not what I ___.", "Espera, eso no es lo que ___."],
        ),
        frames68: F(
          ["Oh, you want me to ___?", "Ah, ¿quieres que ___?"],
          ["Hold on, I think you misunderstood. ___.", "Espera, creo que entendiste mal. ___."],
        ),
        elements: [
          PANEL(5, 5, 90, 42),
          ART(
            "char-amara",
            58,
            16,
            30,
            30,
            tr("The helper doing the wrong thing", "La amiga haciendo algo equivocado"),
          ),
          BUB(
            "speech",
            "bottom-right",
            10,
            9,
            46,
            20,
            "The helper answers, but understands the wrong thing.",
            "La amiga responde, pero entiende otra cosa.",
          ),
          IMG(
            10,
            31,
            44,
            14,
            "Draw what the helper misunderstood.",
            "Dibuja lo que la amiga entendió mal.",
          ),
          PANEL(5, 50, 90, 44),
          ART(
            "char-sam",
            8,
            64,
            26,
            28,
            tr("The first character, surprised", "El primer personaje, sorprendido"),
          ),
          ART("fx-question-burst", 36, 60, 14, 12, tr("Confusion", "Confusión")),
          BUB(
            "shout",
            "left",
            46,
            54,
            46,
            18,
            "How does the character react?",
            "¿Cómo reacciona el personaje?",
          ),
          BUB(
            "thought",
            "left",
            46,
            75,
            46,
            16,
            "What is the character thinking?",
            "¿Qué piensa el personaje?",
          ),
        ],
      },
      {
        bg: "#ffffff",
        prompt: tr(
          "Clear it up. Panel 5: explain what you really meant. Panel 6: the helper checks they understand.",
          "Acláralo. Viñeta 5: explica lo que de verdad querías decir. Viñeta 6: la amiga comprueba que entendió.",
        ),
        frames: F(
          ["No, I meant ___.", "No, quise decir ___."],
          ["Oh! Do you mean ___?", "¡Ah! ¿Quieres decir ___?"],
        ),
        frames68: F(
          [
            "Sorry, I wasn't clear. What I meant was ___.",
            "Perdón, no fui claro / clara. Lo que quise decir fue ___.",
          ],
          ["So you're asking about ___, right?", "Entonces me preguntas sobre ___, ¿verdad?"],
        ),
        elements: [
          PANEL(5, 5, 44, 89),
          ART(
            "char-sam",
            10,
            58,
            34,
            34,
            tr("The first character explaining", "El primer personaje explicando"),
          ),
          BUB(
            "speech",
            "bottom-left",
            8,
            9,
            38,
            30,
            "Explain what you really meant.",
            "Explica lo que de verdad querías decir.",
          ),
          BUB(
            "caption",
            "none",
            8,
            42,
            38,
            12,
            "Add a detail that helps.",
            "Agrega un detalle que ayude.",
          ),
          PANEL(51, 5, 44, 89),
          ART("char-amara", 56, 58, 34, 34, tr("The helper understanding", "La amiga entendiendo")),
          BUB(
            "speech",
            "bottom-right",
            54,
            9,
            38,
            30,
            "Ask a question to check: Do you mean...?",
            "Haz una pregunta para comprobar: ¿Quieres decir...?",
          ),
          ART("fx-idea", 64, 42, 16, 14, tr("An idea", "Una idea")),
        ],
      },
      {
        bg: "#e7f4f2",
        prompt: tr(
          "Agree on a plan. Panel 7: they decide who does what. Panel 8: show how it ends.",
          "Pónganse de acuerdo en un plan. Viñeta 7: deciden quién hace qué. Viñeta 8: muestra cómo termina.",
        ),
        frames: F(
          ["Let's ___.", "Vamos a ___."],
          ["First you ___, then I ___.", "Primero tú ___, luego yo ___."],
        ),
        frames68: F(
          ["Here's what we could try: ___.", "Esto es lo que podríamos intentar: ___."],
          ["That works for me, as long as ___.", "Me parece bien, siempre que ___."],
        ),
        elements: [
          PANEL(5, 5, 90, 50),
          ART("char-sam", 8, 24, 24, 30, tr("The first character", "El primer personaje")),
          ART("char-amara", 68, 24, 24, 30, tr("The helper", "La amiga")),
          BUB(
            "speech",
            "bottom-left",
            30,
            8,
            36,
            20,
            "Suggest a plan with first and then.",
            "Propón un plan con primero y luego.",
          ),
          BUB(
            "speech",
            "bottom-right",
            34,
            31,
            34,
            20,
            "Agree, or change the plan a little.",
            "Acepta o cambia un poco el plan.",
          ),
          PANEL(5, 58, 90, 36),
          IMG(8, 61, 50, 30, "Draw them following the plan.", "Dibújalos siguiendo el plan."),
          BUB(
            "caption",
            "none",
            61,
            62,
            31,
            28,
            "How does it end? How do they feel?",
            "¿Cómo termina? ¿Cómo se sienten?",
          ),
        ],
      },
    ],
  },

  // 12 ────────────────────────────────────────────────────────────
  {
    id: "mystery-story",
    title: tr("Mystery Story", "Cuento de misterio"),
    kind: "narrative",
    format: "portrait",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "narrative",
    purpose: tr("Narrate", "Narrar"),
    summary: tr(
      "Write a mystery with a puzzling problem, real clues, a red herring and a surprising reveal.",
      "Escribe un misterio con un problema intrigante, pistas reales, una pista falsa y una revelación sorprendente.",
    ),
    targets: F(
      [
        "Use modal verbs to make guesses: might, could, must have.",
        "Usar verbos para hacer suposiciones: podría, quizás, debe haber.",
      ],
      [
        "Build suspense with time words and short sentences (Suddenly. Then silence.).",
        "Crear suspenso con palabras de tiempo y oraciones cortas (De repente. Luego, silencio.).",
      ],
      [
        "Explain a conclusion with clues: That means ___ / This proves ___ because ___.",
        "Explicar una conclusión con pistas: Eso significa ___ / Esto prueba ___ porque ___.",
      ],
    ),
    finished: tr(
      "A 6-page illustrated mystery with a detective, two clues, a red herring and a reveal that explains every clue.",
      "Un misterio ilustrado de 6 páginas con un detective, dos pistas, una pista falsa y una revelación que explica cada pista.",
    ),
    teacherNotes: tr(
      "Plan the solution first: students decide what really happened before writing page 1, then plant clues backward. Listen for might/could/must have when partners guess at each clue. The red herring page is the most fun and the hardest; let students who need it plan it as a drawing first, and fade the modal-verb frames once guesses sound natural.",
      "Planee primero la solución: los estudiantes deciden qué pasó de verdad antes de escribir la página 1 y luego colocan las pistas hacia atrás. Escuche podría/quizás/debe haber cuando las parejas adivinen con cada pista. La página de la pista falsa es la más divertida y la más difícil; deje que quien lo necesite la planee primero como dibujo, y retire los inicios de suposición cuando suenen naturales.",
    ),
    wordBank: F(
      ["mystery", "misterio"],
      ["clue", "pista"],
      ["detective", "detective"],
      ["suspect", "sospechoso / sospechosa"],
      ["might", "podría"],
      ["must have", "debe haber"],
      ["suddenly", "de repente"],
      ["red herring", "pista falsa"],
      ["solve", "resolver"],
      ["reveal", "revelar"],
    ),
    example: tr(
      'On Monday morning, the class goldfish bowl was empty. Detective Kai looked closer. The first clue was a trail of tiny wet spots leading to the window. The second clue was a gray hair on the sill. "The cat next door must have taken Bubbles!" said Leo. But Kai noticed the cat\'s door was locked all weekend. Then Kai found the third clue: a note from Ms. Park in the trash. It said, "Taking Bubbles home to clean the bowl." The gray hair was from Ms. Park\'s sweater. Bubbles was safe all along.',
      'El lunes por la mañana, la pecera de la clase estaba vacía. El detective Kai miró de cerca. La primera pista era un camino de gotitas mojadas hasta la ventana. La segunda pista era un pelo gris en el marco. "¡El gato del vecino debe haberse llevado a Burbujas!", dijo Leo. Pero Kai notó que la puerta del gato estuvo cerrada todo el fin de semana. Luego Kai encontró la tercera pista: una nota de la maestra Park en la basura. Decía: "Me llevo a Burbujas a casa para limpiar la pecera". El pelo gris era del suéter de la maestra Park. Burbujas estuvo a salvo todo el tiempo.',
    ),
    pages: [
      {
        bg: "#1b2a5c",
        bgArt: "bg-night",
        prompt: tr(
          "Make your cover. Add a mysterious picture that does not give away the answer.",
          "Haz tu portada. Agrega una imagen misteriosa que no revele la respuesta.",
        ),
        elements: [
          ART("char-detective", 54, 40, 40, 52, tr("A detective", "Un detective")),
          ART("obj-magnifier", 8, 52, 30, 30, tr("A magnifying glass", "Una lupa")),
          SH("rounded", 6, 8, 88, 28, "#1b2a5c", "#fff3c4", 0.6),
          TITLE(9, 10, 82, 18, { color: "#fff3c4", font: "fraunces", size: 7.5, align: "center" }),
          BYLINE(9, 28, 82, 6, { color: "#ffffff", align: "center" }),
        ],
      },
      {
        bg: "#e9edf8",
        prompt: tr(
          "The mystery. Introduce your detective and the strange problem. Build suspense.",
          "El misterio. Presenta a tu detective y el problema extraño. Crea suspenso.",
        ),
        frames: F(
          ["One ___ morning, ___ was missing.", "Una mañana ___, faltaba ___."],
          ["Suddenly, ___.", "De repente, ___."],
        ),
        frames68: F(
          ["Nobody could explain why ___.", "Nadie podía explicar por qué ___."],
          [
            "___ had solved puzzles before, but never one like ___.",
            "___ había resuelto acertijos antes, pero nunca uno como ___.",
          ],
        ),
        elements: [
          H(6, 5, 88, 8, "The Mystery", "El misterio", { color: "#1b2a5c" }),
          IMG(6, 15, 40, 40, "Draw your detective.", "Dibuja a tu detective."),
          B(
            49,
            15,
            45,
            40,
            "Who is the detective? What strange thing happened?",
            "¿Quién es el detective? ¿Qué cosa extraña pasó?",
          ),
          B(
            6,
            58,
            88,
            25,
            "Build suspense: what do people notice? Who is worried?",
            "Crea suspenso: ¿qué nota la gente? ¿Quién está preocupado?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Clue 1. What does the detective find? What might it mean?",
          "Pista 1. ¿Qué encuentra el detective? ¿Qué podría significar?",
        ),
        frames: F(
          ["The first clue was ___.", "La primera pista fue ___."],
          ["It might mean ___.", "Podría significar ___."],
        ),
        frames68: F(
          ["Examining ___ closely, ___ noticed ___.", "Al examinar ___ de cerca, ___ notó ___."],
          ["This could suggest ___, unless ___.", "Esto podría sugerir ___, a menos que ___."],
        ),
        elements: [
          ART("obj-magnifier", 80, 4, 14, 12, tr("A magnifying glass", "Una lupa")),
          H(6, 5, 72, 8, "Clue 1", "Pista 1", { color: "#5a1e3a" }),
          SH("rounded", 4, 15, 92, 38, "#fff3c4", "#5a1e3a"),
          IMG(8, 18, 84, 32, "Draw the clue up close.", "Dibuja la pista de cerca."),
          B(
            6,
            56,
            88,
            27,
            "Describe the clue. What might it mean?",
            "Describe la pista. ¿Qué podría significar?",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#f8e8ef",
        prompt: tr(
          "Clue 2 and a red herring. Add a real clue and a false clue that points to the wrong suspect.",
          "Pista 2 y una pista falsa. Agrega una pista real y una pista falsa que señale al sospechoso equivocado.",
        ),
        frames: F(
          ["Then ___ found ___.", "Luego ___ encontró ___."],
          [
            "Everyone thought ___ did it because ___.",
            "Todos pensaban que ___ lo hizo porque ___.",
          ],
        ),
        frames68: F(
          [
            "At first, all the evidence seemed to point to ___.",
            "Al principio, toda la evidencia parecía señalar a ___.",
          ],
          ["___ must have ___, or so it seemed.", "___ debe haber ___, o eso parecía."],
        ),
        elements: [
          H(6, 5, 88, 8, "Clue 2 and a Trick", "Pista 2 y un engaño", { color: "#5a1e3a" }),
          SH("rounded", 4, 15, 44, 69, "#ffffff", "#5a1e3a"),
          H(7, 17, 38, 6, "Real clue", "Pista real", {
            size: 3.2,
            font: "rounded",
            color: "#5a1e3a",
          }),
          IMG(7, 24, 38, 22, "Draw the real clue.", "Dibuja la pista real."),
          B(
            7,
            48,
            38,
            34,
            "What is it? What does the detective think?",
            "¿Qué es? ¿Qué piensa el detective?",
            { size: 2.9 },
          ),
          SH("rounded", 52, 15, 44, 69, "#ffffff", "#e86a50", 0.8),
          H(55, 17, 38, 6, "Red herring", "Pista falsa", {
            size: 3.2,
            font: "rounded",
            color: "#9a4a26",
          }),
          IMG(55, 24, 38, 22, "Draw the false clue.", "Dibuja la pista falsa."),
          B(
            55,
            48,
            38,
            34,
            "Who does it seem to blame? Why does it fool people?",
            "¿A quién parece culpar? ¿Por qué engaña a la gente?",
            { size: 2.9 },
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#1b2a5c",
        prompt: tr(
          "The reveal. The detective explains what really happened, using the clues as proof.",
          "La revelación. El detective explica lo que pasó de verdad, usando las pistas como prueba.",
        ),
        frames: F(
          ["The answer was ___.", "La respuesta era ___."],
          ["That means ___.", "Eso significa ___."],
        ),
        frames68: F(
          [
            "The key clue was ___, because it proved ___.",
            "La pista clave fue ___, porque probó ___.",
          ],
          [
            "The red herring fooled everyone because ___.",
            "La pista falsa engañó a todos porque ___.",
          ],
        ),
        elements: [
          ART("fx-idea", 76, 4, 18, 16, tr("An idea", "Una idea")),
          H(6, 7, 68, 9, "The Reveal", "La revelación", { color: "#fff3c4" }),
          ART(
            "char-detective",
            6,
            22,
            26,
            34,
            tr("The detective explaining", "El detective explicando"),
          ),
          BUB(
            "speech",
            "left",
            34,
            22,
            60,
            34,
            "What really happened? Which clues prove it?",
            "¿Qué pasó de verdad? ¿Qué pistas lo prueban?",
          ),
          SH("rounded", 4, 60, 92, 24, "#ffffff"),
          B(
            7,
            62,
            86,
            20,
            "Explain why the red herring was wrong.",
            "Explica por qué la pista falsa estaba equivocada.",
          ),
          AUD(6, 86),
        ],
      },
      {
        bg: "#e6f0e3",
        prompt: tr(
          "Case closed. How does everything end? How do the characters feel now?",
          "Caso cerrado. ¿Cómo termina todo? ¿Cómo se sienten ahora los personajes?",
        ),
        frames: F(
          ["In the end, ___.", "Al final, ___."],
          ["Everyone felt ___.", "Todos se sintieron ___."],
        ),
        frames68: F(
          ["With the mystery solved, ___.", "Con el misterio resuelto, ___."],
          ["___ would never forget ___.", "___ nunca olvidaría ___."],
        ),
        elements: [
          ART("obj-key", 78, 4, 16, 12, tr("A key", "Una llave")),
          H(6, 5, 70, 8, "Case Closed", "Caso cerrado", { color: "#0b3d4a" }),
          IMG(6, 16, 88, 34, "Draw the happy ending.", "Dibuja el final feliz."),
          B(
            6,
            53,
            88,
            30,
            "How does it end? How do the characters feel?",
            "¿Cómo termina? ¿Cómo se sienten los personajes?",
          ),
          AUD(6, 86),
        ],
      },
    ],
  },

  // 13 ────────────────────────────────────────────────────────────
  {
    id: "how-to",
    title: tr("How-To Explanation", "Explicación de cómo hacer algo"),
    kind: "informational",
    format: "landscape",
    grades: ["3-5", "6-8"],
    family: false,
    tag: "informational",
    purpose: tr("Explain", "Explicar"),
    summary: tr(
      "Teach readers how to make or do something, with materials and clear numbered steps.",
      "Enséñales a los lectores cómo hacer algo, con materiales y pasos numerados claros.",
    ),
    targets: F(
      [
        "Use sequence words (first, next, then, after that, finally) to order steps.",
        "Usar palabras de secuencia (primero, luego, después, después de eso, al final) para ordenar los pasos.",
      ],
      [
        "Start each step with a command verb (cut, mix, fold, press).",
        "Empezar cada paso con un verbo de instrucción (corta, mezcla, dobla, aprieta).",
      ],
      [
        "Add precise details: amounts, sizes and how (carefully, slowly, 2 cups).",
        "Agregar detalles precisos: cantidades, tamaños y cómo (con cuidado, despacio, 2 tazas).",
      ],
    ),
    finished: tr(
      "A 6-page how-to guide with a materials list, six numbered steps with a picture for each, and a final tip.",
      "Una guía de 6 páginas con la lista de materiales, seis pasos numerados con una imagen cada uno y un consejo final.",
    ),
    teacherNotes: tr(
      "Students choose something they can really do: a recipe, a game, a craft, a math strategy. Have a partner follow the steps exactly as written; missing steps show up fast. Listen for command verbs at the start of each step and sequence words that match the order. Fade the sequence frames once students vary them on their own.",
      "Los estudiantes eligen algo que de verdad sepan hacer: una receta, un juego, una manualidad, una estrategia de matemáticas. Pida a un compañero que siga los pasos tal como están escritos; los pasos que faltan aparecen rápido. Escuche verbos de instrucción al inicio de cada paso y palabras de secuencia que coincidan con el orden. Retire los inicios de secuencia cuando los varíen solos.",
    ),
    wordBank: F(
      ["first", "primero"],
      ["next", "luego"],
      ["then", "después"],
      ["after that", "después de eso"],
      ["finally", "al final"],
      ["materials", "materiales"],
      ["carefully", "con cuidado"],
      ["mix", "mezclar"],
      ["fold", "doblar"],
      ["measure", "medir"],
      ["tip", "consejo"],
    ),
    example: tr(
      "How to Make a Paper Fortune Teller. Materials: one square sheet of paper and markers. First, fold the paper in half corner to corner both ways, then open it. Next, fold each corner into the center so you have a smaller square. Then flip it over and fold the new corners into the center again. After that, write a number on each flap and a message under each flap. Finally, fold it in half and slide your fingers under the four outside pockets. Tip: crease every fold firmly so it opens and closes easily.",
      "Cómo hacer un adivinador de papel. Materiales: una hoja de papel cuadrada y marcadores. Primero, dobla el papel por la mitad de esquina a esquina en ambas direcciones y luego ábrelo. Luego, dobla cada esquina hacia el centro para tener un cuadrado más pequeño. Después, voltéalo y dobla otra vez las nuevas esquinas hacia el centro. Después de eso, escribe un número en cada solapa y un mensaje debajo de cada una. Al final, dóblalo por la mitad y mete los dedos en los cuatro bolsillos de afuera. Consejo: marca bien cada doblez para que abra y cierre con facilidad.",
    ),
    pages: [
      {
        bg: "#7fb48a",
        prompt: tr(
          "Make your cover. Your title starts with How to... Show the finished product.",
          "Haz tu portada. Tu título empieza con Cómo... Muestra el producto terminado.",
        ),
        elements: [
          SH("rounded", 5, 8, 54, 84, "#fffaf0"),
          TITLE(9, 14, 46, 36, { color: "#0b3d4a", font: "rounded", size: 7.5, align: "left" }),
          BYLINE(9, 54, 46, 8, { color: "#0b3d4a" }),
          SH("rounded", 9, 68, 10, 14, "#0b3d4a"),
          SH("rounded", 22, 68, 10, 14, "#0b3d4a"),
          SH("rounded", 35, 68, 10, 14, "#0b3d4a"),
          IMG(
            63,
            10,
            32,
            56,
            "Add a picture of the finished product.",
            "Agrega una imagen del producto terminado.",
          ),
          ART("obj-pencil", 70, 70, 18, 20, tr("A pencil", "Un lápiz")),
        ],
      },
      {
        bg: "#fffaf0",
        prompt: tr(
          "Tell readers what they will make or do, and list every material with amounts.",
          "Di a los lectores qué van a hacer y escribe la lista de todos los materiales con cantidades.",
        ),
        frames: F(
          ["In this book, you will learn how to ___.", "En este libro, aprenderás a ___."],
          ["You will need ___.", "Vas a necesitar ___."],
        ),
        frames68: F(
          [
            "By the end of this guide, you will be able to ___.",
            "Al final de esta guía, podrás ___.",
          ],
          ["Before you begin, gather ___.", "Antes de empezar, reúne ___."],
        ),
        elements: [
          H(5, 6, 90, 10, "What You Will Need", "Lo que vas a necesitar"),
          B(
            5,
            19,
            42,
            26,
            "What will readers make or do? Why is it useful or fun?",
            "¿Qué van a hacer los lectores? ¿Por qué es útil o divertido?",
          ),
          SH("rounded", 51, 19, 44, 64, "#ffffff", "#0b3d4a"),
          H(54, 21, 38, 7, "Materials", "Materiales", {
            size: 3.6,
            font: "rounded",
            color: "#0b3d4a",
          }),
          B(
            54,
            29,
            38,
            52,
            "List each material with an amount (2 cups, 1 sheet).",
            "Escribe cada material con una cantidad (2 tazas, 1 hoja).",
          ),
          IMG(
            5,
            48,
            42,
            35,
            "Draw or photograph your materials.",
            "Dibuja o fotografía tus materiales.",
          ),
          AUD(5, 86),
        ],
      },
      ...[
        [
          "#e7f4f2",
          "#075568",
          1,
          2,
          "First, ___.",
          "Primero, ___.",
          "Next, ___.",
          "Luego, ___.",
          "To begin, ___.",
          "Para empezar, ___.",
          "Once ___, ___.",
          "Una vez que ___, ___.",
        ],
        [
          "#e9edf8",
          "#1b2a5c",
          3,
          4,
          "Then ___.",
          "Después, ___.",
          "After that, ___.",
          "Después de eso, ___.",
          "While ___, carefully ___.",
          "Mientras ___, con cuidado ___.",
          "As soon as ___, ___.",
          "En cuanto ___, ___.",
        ],
        [
          "#fbeadf",
          "#9a4a26",
          5,
          6,
          "Next, ___.",
          "Luego, ___.",
          "Finally, ___.",
          "Al final, ___.",
          "Make sure ___ before you ___.",
          "Asegúrate de ___ antes de ___.",
          "To finish, ___.",
          "Para terminar, ___.",
        ],
      ].map(([bg, ink, a, b, f1en, f1es, f2en, f2es, g1en, g1es, g2en, g2es]) => ({
        bg,
        prompt: tr(
          `Write steps ${a} and ${b}. Start each with a sequence word and an action verb, and add a picture for each step.`,
          `Escribe los pasos ${a} y ${b}. Empieza cada uno con una palabra de secuencia y un verbo de acción, y agrega una imagen para cada paso.`,
        ),
        frames: F([f1en, f1es], [f2en, f2es]),
        frames68: F([g1en, g1es], [g2en, g2es]),
        elements: [
          H(5, 5, 90, 9, `Steps ${a} and ${b}`, `Pasos ${a} y ${b}`, { color: ink }),
          SH("rounded", 5, 16, 43, 76, "#ffffff", ink),
          SH("ellipse", 8, 18, 8, 11, ink),
          H(8, 19, 8, 9, String(a), String(a), {
            color: "#ffffff",
            align: "center",
            font: "rounded",
            size: 5,
          }),
          IMG(18, 18, 27, 32, `Picture for step ${a}`, `Imagen del paso ${a}`),
          B(
            8,
            52,
            37,
            38,
            `Step ${a}: sequence word + action verb + details.`,
            `Paso ${a}: palabra de secuencia + verbo de acción + detalles.`,
          ),
          SH("rounded", 52, 16, 43, 76, "#ffffff", ink),
          SH("ellipse", 55, 18, 8, 11, ink),
          H(55, 19, 8, 9, String(b), String(b), {
            color: "#ffffff",
            align: "center",
            font: "rounded",
            size: 5,
          }),
          IMG(65, 18, 27, 32, `Picture for step ${b}`, `Imagen del paso ${b}`),
          B(
            55,
            52,
            37,
            38,
            `Step ${b}: sequence word + action verb + details.`,
            `Paso ${b}: palabra de secuencia + verbo de acción + detalles.`,
          ),
        ],
      })),
      {
        bg: "#0b3d4a",
        prompt: tr(
          "Finish with a tip and a check. What mistake should readers avoid? How do they know it worked?",
          "Termina con un consejo y una comprobación. ¿Qué error deben evitar? ¿Cómo saben que funcionó?",
        ),
        frames: F(
          ["Tip: ___.", "Consejo: ___."],
          ["You will know it worked when ___.", "Sabrás que funcionó cuando ___."],
        ),
        frames68: F(
          [
            "A common mistake is ___, so be sure to ___.",
            "Un error común es ___, así que asegúrate de ___.",
          ],
          ["If ___ happens, try ___.", "Si pasa ___, intenta ___."],
        ),
        elements: [
          ART("obj-lightbulb", 80, 4, 15, 16, tr("A lightbulb", "Un foco")),
          H(5, 6, 72, 10, "Tips and Check", "Consejos y comprobación", { color: "#fff3c4" }),
          SH("rounded", 5, 22, 43, 62, "#ffffff"),
          H(8, 24, 37, 7, "Tip", "Consejo", { size: 3.6, font: "rounded", color: "#0b3d4a" }),
          B(
            8,
            32,
            37,
            50,
            "What mistake should readers avoid? What helps?",
            "¿Qué error deben evitar los lectores? ¿Qué ayuda?",
          ),
          SH("rounded", 52, 22, 43, 62, "#ffffff"),
          H(55, 24, 37, 7, "Did it work?", "¿Funcionó?", {
            size: 3.6,
            font: "rounded",
            color: "#0b3d4a",
          }),
          B(
            55,
            32,
            37,
            50,
            "How will readers know they did it right?",
            "¿Cómo sabrán los lectores que lo hicieron bien?",
          ),
          AUD(35, 86),
        ],
      },
    ],
  },
];
