// Language Labs content (/language-labs): Verb Time Machine, Connector Bridge, Paragraph X-Ray,
// plus publisher-edition grade-band programs (3-5 Language Explorers Studio, 6-8 Academic Discourse & Craft Lab),
// WIDA 2020 ELD Standards & Key Language Uses alignment, mentor-sentence craft mini-lessons, and Teacher/Family guides.
// Original items for grades 3-5 and 6-8. English is the language being practised; directions and feedback are
// bilingual. Checkers: src/lang/labs-check.js.

export const KEY_USES = Object.freeze({
  Narrate: { tone: "narrate", en: "Narrate", es: "Narrar" },
  Inform: { tone: "inform", en: "Inform", es: "Informar" },
  Explain: { tone: "explain", en: "Explain", es: "Explicar" },
  Argue: { tone: "argue", en: "Argue", es: "Argumentar" },
});

export const DIMENSIONS = Object.freeze({
  word: { id: "word", en: "Word / Phrase", es: "Palabra / frase" },
  sentence: { id: "sentence", en: "Sentence", es: "Oración" },
  discourse: { id: "discourse", en: "Discourse", es: "Discurso" },
});

// ── Grade-Band Publisher Programs (3-5 and 6-8) ──────────────────────────────
export const LAB_PROGRAMS = Object.freeze({
  "3-5": {
    band: "3-5",
    name: ["Language Explorers Studio", "Estudio de exploradores del lenguaje"],
    grades: ["Grades 3–5", "Grados 3–5"],
    eyebrow: [
      "Notice · play · model · practice · write in your own voice",
      "Observa · juega · modela · practica · escribe con tu propia voz",
    ],
    lead: [
      "Welcome to the Language Explorers Studio for grades 3–5. In each lab, you test how English works with interactive controls, step through a writer's think-aloud, practice with coaching clues that never spoil the answer, and create a piece of writing for your own book.",
      "Bienvenido al Estudio de exploradores del lenguaje para los grados 3–5. En cada laboratorio pruebas cómo funciona el inglés con controles interactivos, sigues el pensamiento paso a paso de un escritor, practicas con pistas que nunca regalan la respuesta y creas un texto para tu propio libro.",
    ],
    widaGoal: [
      "WIDA ELD Standards 1, 2, 4 & 5 (Grades 3–5): Choose verb tenses that match time clues, link ideas with clear connectors, and organize paragraphs with a topic sentence, details, and a conclusion.",
      "Estándares WIDA ELD 1, 2, 4 y 5 (Grados 3–5): Elegir tiempos verbales que coincidan con las pistas de tiempo, unir ideas con conectores claros y organizar párrafos con oración principal, detalles y conclusión.",
    ],
    stages: [
      {
        num: "1",
        icon: "reading",
        title: ["See it", "Míralo"],
        do: [
          "Spot how real authors use the language move in a story or science text.",
          "Observa cómo usan los autores esta jugada del lenguaje en un cuento o texto de ciencias.",
        ],
        frame: ["I notice the author used ___ to show ___.", "Noto que el autor usó ___ para mostrar ___."],
      },
      {
        num: "2",
        icon: "tools",
        title: ["Explore", "Explora"],
        do: [
          "Slide the timeline, swap the bridge word, or turn on the paragraph X-ray.",
          "Desliza la línea del tiempo, cambia el conector del puente o enciende los rayos X del párrafo.",
        ],
        frame: ["When I change ___ to ___, the meaning changes to ___.", "Cuando cambio ___ por ___, el significado cambia a ___."],
      },
      {
        num: "3",
        icon: "bulb",
        title: ["Example", "Ejemplo"],
        do: [
          "Walk through one example step by step to see how a writer decides.",
          "Recorre un ejemplo paso a paso para ver cómo decide un escritor.",
        ],
        frame: ["First I look for the clue ___, then I choose ___.", "Primero busco la pista ___ y luego elijo ___."],
      },
      {
        num: "4",
        icon: "check",
        title: ["Practice", "Practica"],
        do: [
          "Try six sentences. If you miss one, you get a coaching clue first so you can figure it out.",
          "Prueba seis oraciones. Si fallas una, recibes primero una pista para poder resolverla.",
        ],
        frame: ["The clue word ___ tells me I need ___.", "La palabra pista ___ me dice que necesito ___."],
      },
      {
        num: "5",
        icon: "writing",
        title: ["New task", "Tarea nueva"],
        do: [
          "Write in your own words, listen to your draft read aloud, and send it to Book Studio.",
          "Escribe con tus propias palabras, escucha tu borrador en voz alta y envíalo a Book Studio.",
        ],
        frame: ["In my writing, I used ___ so my reader understands ___.", "En mi escritura usé ___ para que mi lector entienda ___."],
      },
    ],
    craft: [
      {
        id: "craft-35-time",
        labId: "verb-time-machine",
        href: "language-labs/verb-time-machine?step=1",
        use: "Narrate",
        dimension: "word",
        title: ["Match the verb to the time clue", "Haz coincidir el verbo con la pista de tiempo"],
        tip: [
          "Time words like Yesterday, Right now, and Tomorrow tell the reader when an action happens. The verb changes shape to match.",
          "Las palabras de tiempo como Yesterday, Right now y Tomorrow dicen cuándo ocurre la acción. El verbo cambia de forma para coincidir.",
        ],
        before: "Yesterday, our class walk to the science museum.",
        mentor: "Yesterday, our class walked to the science museum, and tomorrow we will build our own volcano model.",
      },
      {
        id: "craft-35-bridge",
        labId: "connector-bridge",
        href: "language-labs/connector-bridge?step=1",
        use: "Explain",
        dimension: "sentence",
        title: ["Build a bridge between cause and result", "Construye un puente entre causa y resultado"],
        tip: [
          "Don't leave two related ideas sitting apart. Join them with because, so, or but so your reader sees how they fit together.",
          "No dejes separadas dos ideas que se relacionan. Únelas con because, so o but para que el lector vea cómo encajan.",
        ],
        before: "It started to rain hard. We moved our reading circle inside.",
        mentor: "It started to rain hard, so we moved our reading circle inside.",
      },
      {
        id: "craft-35-xray",
        labId: "paragraph-xray",
        href: "language-labs/paragraph-xray?step=1",
        use: "Inform",
        dimension: "discourse",
        title: ["Give every sentence in a paragraph a clear job", "Dale una función clara a cada oración del párrafo"],
        tip: [
          "A strong paragraph opens with a topic sentence, adds linked details, explains why they matter, and wraps up with a conclusion.",
          "Un buen párrafo empieza con una oración principal, agrega detalles unidos, explica por qué importan y cierra con una conclusión.",
        ],
        before: "Bees have pollen on their legs. Fruit grows on trees. Bees are cool.",
        mentor: "Bees are important helpers for plants. When a bee visits a flower, pollen sticks to its legs. Then the bee carries the pollen to the next flower.",
      },
      {
        id: "craft-35-precision",
        labId: "precision-challenge",
        href: "scaffold/language-upgrade",
        use: "Explain",
        dimension: "word",
        title: ["Trade everyday words for science words", "Cambia palabras cotidianas por palabras precisas"],
        tip: [
          "Instead of saying “stuff” or “things”, name the exact materials, parts, or actions so your reader can picture it.",
          "En lugar de decir «stuff» o «things», nombra los materiales, partes o acciones exactas para que el lector lo imagine.",
        ],
        before: "Plants need stuff to grow.",
        mentor: "Plants need sunlight, water, and nutrient-rich soil because their leaves and roots use them to make food.",
      },
    ],
    teacher: {
      summary: [
        "Instructional Guide · Grades 3–5 (WIDA ELD & CCSS Language/Writing)",
        "Guía docente · Grados 3–5 (WIDA ELD y CCSS Lenguaje/Escritura)",
      ],
      routines: [
        {
          title: ["5-Minute Whole-Group Launch (Steps 1–2)", "Inicio con todo el grupo en 5 minutos (Pasos 1–2)"],
          body: [
            "Project Step 1 (See it) and read the mentor sentence aloud. Move to Step 2 (Explore) and ask a student to predict how the sentence will change before sliding the timeline or tapping a connector.",
            "Proyecta el Paso 1 (Míralo) y lee la oración modelo en voz alta. Pasa al Paso 2 (Explora) y pide a un estudiante que prediga cómo cambiará la oración antes de deslizar la línea del tiempo o tocar un conector.",
          ],
        },
        {
          title: ["Partner Turn-and-Talk (Steps 3–4)", "Conversación en parejas (Pasos 3–4)"],
          body: [
            "Have partners read each practice sentence aloud and point to the clue word first (“Yesterday”, “First”, “These games”) before typing or selecting.",
            "Pide a las parejas que lean cada oración de práctica en voz alta y señalen primero la palabra pista («Yesterday», «First», «These games») antes de escribir o elegir.",
          ],
        },
        {
          title: ["Author's Transfer & Book Studio Handoff (Step 5)", "Transferencia del autor y envío a Book Studio (Paso 5)"],
          body: [
            "In Step 5, students write 3–4 sentences of their own, use the Read Aloud button to hear their draft, and send their finished piece directly into Book Studio to illustrate and narrate.",
            "En el Paso 5, los estudiantes escriben de 3 a 4 oraciones propias, usan el botón de lectura en voz alta para escucharse y envían su texto terminado directamente a Book Studio para ilustrarlo y narrarlo.",
          ],
        },
      ],
      standards: [
        [
          "WIDA 2020 ELD Framework (Grades 3–5): ELD-LA.4-5.Narrate.Expressive (verb tense & time markers), ELD-SC.4-5.Explain.Expressive (cause/effect & sequence connectors), ELD-LA.4-5.Inform.Expressive (topic sentence, cohesive details & conclusion).",
          "Marco WIDA 2020 ELD (Grados 3–5): ELD-LA.4-5.Narrate.Expressive (tiempos verbales y marcadores de tiempo), ELD-SC.4-5.Explain.Expressive (conectores de causa/efecto y secuencia), ELD-LA.4-5.Inform.Expressive (oración principal, detalles cohesivos y conclusión).",
        ],
        [
          "CCSS ELA Grades 3–5: L.3–5.1 (verb tenses & conjunctions), L.3–5.3 (choose words and phrases for effect), W.3–5.1–3 (opinion, informative, and narrative writing with linking words and concluding statements).",
          "CCSS ELA Grados 3–5: L.3–5.1 (tiempos verbales y conjunciones), L.3–5.3 (elegir palabras y frases precisas), W.3–5.1–3 (escritura de opinión, informativa y narrativa con conectores y conclusión).",
        ],
      ],
    },
    family: {
      summary: [
        "Family Guide · Talk & Play Together at Home (Grades 3–5)",
        "Guía familiar · Conversar y jugar en casa (Grados 3–5)",
      ],
      lead: [
        "You don't need to be a grammar expert to help at home! These labs show how English sentences fit together like building blocks. Try any of these 2-minute conversation games at the dinner table or on the way to school:",
        "¡No necesitas ser experto en gramática para ayudar en casa! Estos laboratorios muestran cómo se arman las oraciones en inglés como bloques de construcción. Prueba cualquiera de estos juegos de conversación de 2 minutos en la mesa o camino a la escuela:",
      ],
      prompts: [
        {
          title: ["1. Yesterday · Right Now · Tomorrow", "1. Ayer · Ahora mismo · Mañana"],
          body: [
            "Pick one everyday action (cook, play, read, walk). Take turns saying one sentence about yesterday, one about right now, and one about tomorrow.",
            "Elijan una acción cotidiana (cook, play, read, walk). Túrnense para decir una oración sobre ayer, una sobre ahora mismo y una sobre mañana.",
          ],
        },
        {
          title: ["2. Swap the Bridge Word", "2. Cambia la palabra puente"],
          body: [
            "Say two ideas and connect them with “because”, then try “so”, then “but”. Laugh together at how a wrong bridge changes the meaning!",
            "Digan dos ideas y únanlas con «because», luego con «so» y luego con «but». ¡Diviértanse viendo cómo cambia el significado del puente!",
          ],
        },
        {
          title: ["3. Big Idea First", "3. La idea grande primero"],
          body: [
            "Ask your child to tell you about their favorite animal or game in four sentences: the big idea first, two details, and a “That is why…” ending.",
            "Pide a tu hijo o hija que te cuente sobre su animal o juego favorito en cuatro oraciones: la idea principal primero, dos detalles y un final con «That is why…».",
          ],
        },
      ],
    },
  },
  "6-8": {
    band: "6-8",
    name: ["Academic Discourse & Craft Lab", "Laboratorio de discurso y oficio académico"],
    grades: ["Grades 6–8", "Grados 6–8"],
    eyebrow: [
      "Analyze · test · model · revise · publish academic language",
      "Analiza · prueba · modela · revisa · publica lenguaje académico",
    ],
    lead: [
      "Welcome to the Academic Discourse & Craft Lab for grades 6–8. Investigate how published authors sequence complex timelines, bridge claims and counterclaims, engineer cohesive paragraphs, and upgrade everyday phrasing into disciplinary precision.",
      "Bienvenido al Laboratorio de discurso y oficio académico para los grados 6–8. Investiga cómo los autores publicados ordenan líneas del tiempo complejas, tienden puentes entre afirmaciones y contraargumentos, estructuran párrafos cohesivos y elevan frases cotidianas a una precisión académica.",
    ],
    widaGoal: [
      "WIDA ELD Standards 1–5 (Grades 6–8): Control complex verb aspects (past perfect, past progressive, present perfect), logical transitions (consequence, concession, illustration), and claim-evidence-reasoning cohesion.",
      "Estándares WIDA ELD 1–5 (Grados 6–8): Dominar aspectos verbales complejos (pasado perfecto, pasado progresivo, presente perfecto), transiciones lógicas (consecuencia, concesión, ejemplificación) y cohesión de afirmación, evidencia y razonamiento.",
    ],
    stages: [
      {
        num: "1",
        icon: "reading",
        title: ["See it", "Míralo"],
        do: [
          "Examine how disciplinary writers use verb aspect, logical transitions, and discourse structure.",
          "Examina cómo usan los escritores académicos el aspecto verbal, las transiciones lógicas y la estructura del discurso.",
        ],
        frame: ["The author signals ___ by pairing ___ with ___.", "El autor señala ___ al combinar ___ con ___."],
      },
      {
        num: "2",
        icon: "tools",
        title: ["Explore", "Explora"],
        do: [
          "Test the interactive model—shift across seven timeline stops, audition transitions, or X-ray a mentor argument.",
          "Prueba el modelo interactivo: recorre siete puntos en la línea del tiempo, prueba transiciones o analiza un argumento con rayos X.",
        ],
        frame: ["Shifting from ___ to ___ changes the relationship between the clauses by ___.", "Cambiar de ___ a ___ modifica la relación entre las cláusulas porque ___."],
      },
      {
        num: "3",
        icon: "bulb",
        title: ["Example", "Ejemplo"],
        do: [
          "Step through an annotated think-aloud showing how a writer diagnoses context clues and selects the exact form.",
          "Sigue un análisis paso a paso que muestra cómo un escritor identifica pistas de contexto y elige la forma exacta.",
        ],
        frame: ["Because ___ happened before ___, the verb must take the ___ form.", "Como ___ ocurrió antes de ___, el verbo debe ir en la forma ___."],
      },
      {
        num: "4",
        icon: "check",
        title: ["Practice", "Practica"],
        do: [
          "Solve six disciplinary items with diagnostic coaching: first a context clue, then the grammatical rule, then a model.",
          "Resuelve seis ejercicios académicos con retroalimentación diagnóstica: primero una pista de contexto, luego la regla y después un modelo.",
        ],
        frame: ["The transition ___ signals ___, which matches the evidence that ___.", "La transición ___ señala ___, lo cual coincide con la evidencia de que ___."],
      },
      {
        num: "5",
        icon: "writing",
        title: ["New task", "Tarea nueva"],
        do: [
          "Compose an independent paragraph or multi-time analysis, rehearse it aloud, and publish it into Book Studio.",
          "Redacta un párrafo independiente o análisis temporal, ensáyalo en voz alta y publícalo en Book Studio.",
        ],
        frame: ["For these reasons, ___ demonstrates that ___.", "Por estas razones, ___ demuestra que ___."],
      },
    ],
    craft: [
      {
        id: "craft-68-time",
        labId: "verb-time-machine",
        href: "language-labs/verb-time-machine?step=1",
        use: "Narrate",
        dimension: "word",
        title: ["Sequence two past events with Past Perfect", "Ordena dos sucesos pasados con el pasado perfecto"],
        tip: [
          "When two events happened in the past, use had + past participle for the one that happened first so the reader never loses the timeline.",
          "Cuando dos sucesos ocurrieron en el pasado, usa had + participio para el que pasó primero, de modo que el lector nunca pierda el orden.",
        ],
        before: "Before the treaty was signed, the two nations fought for ten years.",
        mentor: "Before the treaty was signed, the two nations had fought for ten years.",
      },
      {
        id: "craft-68-bridge",
        labId: "connector-bridge",
        href: "language-labs/connector-bridge?step=1",
        use: "Argue",
        dimension: "sentence",
        title: ["Pivot with a concession or consequence transition", "Gira con una transición de concesión o consecuencia"],
        tip: [
          "Academic writers use however and although to acknowledge a trade-off, and as a result or therefore to prove a consequence.",
          "Los escritores académicos usan however y although para reconocer una desventaja, y as a result o therefore para demostrar una consecuencia.",
        ],
        before: "Solar panels cost a lot to install. They save money over time.",
        mentor: "Solar panels cost a lot to install; however, they save money over time.",
      },
      {
        id: "craft-68-xray",
        labId: "paragraph-xray",
        href: "language-labs/paragraph-xray?step=1",
        use: "Argue",
        dimension: "discourse",
        title: ["Chain evidence to your claim with pointing words", "Encadena la evidencia a tu afirmación con palabras que señalan"],
        tip: [
          "Phrases like “These habits”, “This shift”, and “For these reasons” hook each sentence to the one before it so your argument reads like a single chain.",
          "Frases como «These habits», «This shift» y «For these reasons» enganchan cada oración con la anterior para que tu argumento se lea como una cadena sólida.",
        ],
        before: "Cotton shirts use 2,700 liters of water. People throw away cheap clothes. Buy fewer clothes.",
        mentor: "These habits waste resources and fill landfills with fabric that takes years to break down. Therefore, buying fewer, longer-lasting clothes is one way to protect the planet.",
      },
      {
        id: "craft-68-evidence",
        labId: "evidence-builder",
        href: "scaffold/evidence-builder",
        use: "Argue",
        dimension: "discourse",
        title: ["Pair specific evidence with explicit reasoning", "Combina evidencia específica con razonamiento explícito"],
        tip: [
          "A statistic or fact does not speak for itself—follow it with reasoning that explains why that evidence proves your claim.",
          "Un dato o estadística no habla por sí solo: acompáñalo de un razonamiento que explique por qué esa evidencia demuestra tu afirmación.",
        ],
        before: "Teenagers' sleep cycles shift later. School starts at 7:30.",
        mentor: "Research shows that teenagers' sleep cycles shift later during puberty. Because tired students learn less, an early start works against the purpose of school.",
      },
    ],
    teacher: {
      summary: [
        "Instructional Guide · Grades 6–8 (WIDA ELD & Secondary Disciplinary Literacy)",
        "Guía docente · Grados 6–8 (WIDA ELD y alfabetización académica de secundaria)",
      ],
      routines: [
        {
          title: ["Do-Now Mentor Inquiry (Steps 1–2)", "Indagación inicial con oración modelo (Pasos 1–2)"],
          body: [
            "Open Step 1–2 on the board. Have students compare the everyday draft vs. the mentor sentence and test how changing the tense stop or transition alters the disciplinary meaning.",
            "Abre los Pasos 1–2 en la pizarra. Pide a los estudiantes que comparen el borrador cotidiano con la oración modelo y prueben cómo cambia el significado académico al mover el tiempo verbal o la transición.",
          ],
        },
        {
          title: ["Diagnostic Revision Conferring (Step 4)", "Conferencia diagnóstica de revisión (Paso 4)"],
          body: [
            "During Step 4 Practice, encourage students to read the first-miss clue aloud before revising. Every attempt logs whether it was solved independently or after hints.",
            "Durante la práctica del Paso 4, anima a los estudiantes a leer la primera pista en voz alta antes de corregir. Cada intento registra si se resolvió de forma independiente o con apoyo.",
          ],
        },
        {
          title: ["Cross-Curricular Transfer & Publishing (Step 5)", "Transferencia interdisciplinaria y publicación (Paso 5)"],
          body: [
            "Have students draft their Step 5 argument or historical/scientific timeline, use Listen to My Writing for oral self-editing, and export to Book Studio as an informational or argument chapter.",
            "Pide a los estudiantes que redacten su argumento o línea del tiempo en el Paso 5, usen la lectura en voz alta para revisar su fluidez y lo envíen a Book Studio como capítulo informativo o argumentativo.",
          ],
        },
      ],
      standards: [
        [
          "WIDA 2020 ELD Framework (Grades 6–8): ELD-LA.6-8.Narrate.Expressive (past perfect, past progressive & present perfect to sequence complex events), ELD-SC.6-8.Explain.Expressive (causal & conditional connectors), ELD-SS.6-8.Argue.Expressive (claims, evidence, reasoning, and demonstrative reference chains).",
          "Marco WIDA 2020 ELD (Grados 6–8): ELD-LA.6-8.Narrate.Expressive (pasado perfecto, pasado progresivo y presente perfecto para ordenar sucesos complejos), ELD-SC.6-8.Explain.Expressive (conectores causales y condicionales), ELD-SS.6-8.Argue.Expressive (afirmaciones, evidencia, razonamiento y cadenas de referencia).",
        ],
        [
          "CCSS ELA/Literacy Grades 6–8: L.6–8.1 (verb aspect, clause placement), L.6–8.3 (precise & concise language), W.6–8.1–2 & WHST.6–8.1–2 (cohesive transitions, domain-specific vocabulary, and concluding statements that follow from the argument).",
          "CCSS ELA/Alfabetización Grados 6–8: L.6–8.1 (aspecto verbal, cláusulas), L.6–8.3 (lenguaje preciso y conciso), W.6–8.1–2 y WHST.6–8.1–2 (transiciones cohesivas, vocabulario disciplinar y conclusiones que se desprenden del argumento).",
        ],
      ],
    },
    family: {
      summary: [
        "Family Guide · Supporting Middle School Writers at Home (Grades 6–8)",
        "Guía familiar · Apoyar a escritores de secundaria en casa (Grados 6–8)",
      ],
      lead: [
        "In middle school, students shift from everyday conversation to academic writing in science, history, and English. These labs make invisible writing rules visible. Try one of these quick conversations at home:",
        "En la escuela secundaria, los estudiantes pasan de la conversación cotidiana a la escritura académica en ciencias, historia e inglés. Estos laboratorios hacen visibles las reglas de la escritura. Prueba una de estas conversaciones breves en casa:",
      ],
      prompts: [
        {
          title: ["1. How Our Neighborhood Changed (Before · Now · Next)", "1. Cómo cambió nuestro barrio (Antes · Ahora · Después)"],
          body: [
            "Ask your teen to describe something in your community or school: what had happened before, what has changed since then, and what will happen next.",
            "Pide a tu hijo o hija adolescente que describa algo de su comunidad o escuela: qué había pasado antes, qué ha cambiado desde entonces y qué pasará después.",
          ],
        },
        {
          title: ["2. The “However” Challenge", "2. El reto del «However»"],
          body: [
            "Pick a topic like phones at lunch or later school start times. Ask them to state one benefit and one drawback joined with “however” or “although”.",
            "Elijan un tema como el uso del teléfono en el almuerzo o entrar más tarde a clases. Pídele que diga una ventaja y una desventaja unidas con «however» o «although».",
          ],
        },
        {
          title: ["3. Read It Out Loud", "3. Léelo en voz alta"],
          body: [
            "When your student finishes Step 5 (New task), press “Listen to my writing” together. Ask: “Where does your paragraph sound strongest?”",
            "Cuando tu estudiante termine el Paso 5 (Tarea nueva), presionen juntos «Escuchar mi escritura». Pregunta: «¿En qué parte suena más fuerte tu párrafo?»",
          ],
        },
      ],
    },
  },
});

export const programForLab = (band) => LAB_PROGRAMS[band === "3-5" ? "3-5" : "6-8"];

// ── Verb Time Machine ────────────────────────────────────────────────────────
export const VERB_STOPS = {
  "3-5": ["past", "present", "present-progressive", "future"],
  "6-8": [
    "past-perfect",
    "past",
    "past-progressive",
    "present-perfect",
    "present",
    "present-progressive",
    "future",
  ],
};
/** Time words that go with each stop, so the explorer's sentence always carries its own clue. */
export const STOP_CUES = {
  "past-perfect": ["Before the storm started,", "Antes de que empezara la tormenta,"],
  past: ["Yesterday,", "Ayer,"],
  "past-progressive": ["At 8:00 last night,", "Anoche a las 8:00,"],
  "present-perfect": ["Since September,", "Desde septiembre,"],
  present: ["Every Saturday,", "Todos los sábados,"],
  "present-progressive": ["Right now,", "Ahora mismo,"],
  future: ["Tomorrow,", "Mañana,"],
};
/** Short labels for the timeline itself (the full cue goes in the sentence). */
export const STOP_SHORT = {
  "past-perfect": ["Earlier", "Antes"],
  past: ["Yesterday", "Ayer"],
  "past-progressive": ["Last night", "Anoche"],
  "present-perfect": ["Since Sept.", "Desde sept."],
  present: ["Every week", "Cada semana"],
  "present-progressive": ["Right now", "Ahora"],
  future: ["Tomorrow", "Mañana"],
};
/** Morphological formula and writer's note for each stop in the Verb Anatomy Inspector. */
export const STOP_ANATOMY = {
  "past-perfect": {
    formula: ["had + past participle", "had + participio pasado"],
    when: [
      "Shows the earlier of two past events—something that was already finished before another past event began.",
      "Muestra el primero de dos sucesos pasados: algo que ya había terminado antes de que empezara otro suceso pasado.",
    ],
  },
  past: {
    formula: ["verb + -ed (or irregular past)", "verbo + -ed (o pasado irregular)"],
    when: [
      "Shows a completed action at a specific time in the past (yesterday, last spring, two days ago).",
      "Muestra una acción terminada en un momento específico del pasado (yesterday, last spring, two days ago).",
    ],
  },
  "past-progressive": {
    formula: ["was / were + verb-ing", "was / were + verbo-ing"],
    when: [
      "Shows an action that was in the middle of happening at a past moment or when something else interrupted it.",
      "Muestra una acción que estaba en progreso en un momento del pasado o cuando otra cosa la interrumpió.",
    ],
  },
  "present-perfect": {
    formula: ["has / have + past participle", "has / have + participio pasado"],
    when: [
      "Bridges the past and now: an action that started in the past and continues or still matters today (since 2020, so far).",
      "Une el pasado con el presente: una acción que empezó en el pasado y continúa o sigue importando hoy (since 2020, so far).",
    ],
  },
  present: {
    formula: ["base verb (or base + -s/-es for he/she/it)", "verbo base (o base + -s/-es para he/she/it)"],
    when: [
      "Shows a regular habit, schedule, or scientific fact that is generally true (every morning, at sea level).",
      "Muestra un hábito, rutina o hecho científico que siempre es cierto (every morning, at sea level).",
    ],
  },
  "present-progressive": {
    formula: ["am / is / are + verb-ing", "am / is / are + verbo-ing"],
    when: [
      "Shows an action happening right in this moment while the speaker is watching or talking.",
      "Muestra una acción que está pasando justo en este momento mientras hablamos o miramos.",
    ],
  },
  future: {
    formula: ["will + base verb (or am/is/are going to + verb)", "will + verbo base (o am/is/are going to + verbo)"],
    when: [
      "Shows a prediction, plan, or promise about a time after now (tomorrow, next week, next summer).",
      "Muestra una predicción, plan o promesa sobre un momento después de ahora (tomorrow, next week, next summer).",
    ],
  },
};

export const VERB_MENTOR = {
  "3-5": {
    source: ["From a Grade 4 Science Field Journal", "De un diario de ciencias de 4.º grado"],
    passage:
      "Last week, our class planted bean seeds in wet paper towels. Right now, tiny white roots are pushing through the seed coats. Next Monday, we will measure every sprout and move them into soil.",
    takeaway: [
      "Notice how the author moves from Last week (planted) → Right now (are pushing) → Next Monday (will measure) so the reader can follow the experiment across time.",
      "Observa cómo el autor pasa de Last week (planted) → Right now (are pushing) → Next Monday (will measure) para que el lector siga el experimento en el tiempo.",
    ],
  },
  "6-8": {
    source: ["From a Grade 7 Environmental History Report", "De un informe de historia ambiental de 7.º grado"],
    passage:
      "Before the city council passed the Clean Harbor Act, factories had dumped waste into the river for decades. Since 2020, volunteers have planted native marsh grass along the banks, and next spring marine biologists will test whether the oyster reefs have recovered.",
    takeaway: [
      "Notice how the author layers four distinct times: before the law (had dumped), the past law (passed), from 2020 until today (have planted), and next spring (will test).",
      "Observa cómo el autor combina cuatro momentos: antes de la ley (had dumped), la ley pasada (passed), desde 2020 hasta hoy (have planted) y la próxima primavera (will test).",
    ],
  },
};

export const VERB_COMPARE = {
  "3-5": {
    before: "Yesterday Maya walk to the library, and tomorrow she read her new book.",
    after: "Yesterday Maya walked to the library, and tomorrow she will read her new book.",
    why: [
      "When the verb matches the time word, the reader immediately knows what already happened and what is coming next.",
      "Cuando el verbo coincide con la palabra de tiempo, el lector sabe de inmediato qué pasó ya y qué pasará después.",
    ],
  },
  "6-8": {
    before: "While the scientists test the river, it starts to rain.",
    after: "While the scientists were testing the river, it started to rain.",
    why: [
      "“Were testing” shows the ongoing background action in the past, and “started” shows the shorter event that interrupted it.",
      "«Were testing» muestra la acción en progreso en el pasado y «started» muestra el suceso que la interrumpió.",
    ],
  },
};

export const VERB_EXPLORE = [
  { subject: "Maya", base: "build", rest: "a model bridge" },
  { subject: "my brother", base: "write", rest: "a letter to our grandmother" },
  { subject: "the scientists", base: "study", rest: "the river water" },
  { subject: "Leo", base: "run", rest: "around the track" },
  { subject: "we", base: "plant", rest: "beans in the school garden" },
];
export const VERB_GUIDED = {
  "3-5": {
    sentence: "Last Monday, our class ___ (visit) the museum.",
    steps: [
      ["Find the time clue: “Last Monday”.", "Busca la pista de tiempo: «Last Monday»."],
      [
        "Place it on the timeline: Last Monday is before now, so the action is in the past.",
        "Ubícala en la línea del tiempo: el lunes pasado es antes de ahora, así que la acción está en el pasado.",
      ],
      [
        "Visit is a regular verb: past = visit + ed.",
        "Visit es un verbo regular: pasado = visit + ed.",
      ],
      ["Last Monday, our class visited the museum.", "Last Monday, our class visited the museum."],
    ],
    rule: [
      "Writer's Rule: Circle the time clue first, place it on the timeline (before now, now, or later), then build the verb form that matches.",
      "Regla del escritor: Encierra primero la pista de tiempo, ubícala en la línea del tiempo (antes, ahora o después) y forma el verbo que coincida.",
    ],
  },
  "6-8": {
    sentence: "By the time the bus arrived, Ana ___ (finish) her breakfast.",
    steps: [
      [
        "Two past events: the bus arrived, and Ana finished breakfast.",
        "Dos sucesos pasados: llegó el autobús y Ana terminó el desayuno.",
      ],
      [
        "Which happened first? “By the time” tells us breakfast was already done.",
        "¿Cuál pasó primero? «By the time» nos dice que el desayuno ya había terminado.",
      ],
      [
        "The earlier past event uses had + past participle.",
        "El suceso pasado anterior usa had + participio.",
      ],
      [
        "By the time the bus arrived, Ana had finished her breakfast.",
        "By the time the bus arrived, Ana had finished her breakfast.",
      ],
    ],
    rule: [
      "Writer's Rule: When a sentence compares two past actions, check whether one was ongoing (was/were + -ing) or already completed earlier (had + participle).",
      "Regla del escritor: Cuando una oración compara dos acciones pasadas, verifica si una estaba en progreso (was/were + -ing) o ya había terminado antes (had + participio).",
    ],
  },
};
export const VERB_ITEMS = [
  {
    id: "vt-35-1",
    band: "3-5",
    text: "Yesterday, Ana ___ to the library.",
    base: "walk",
    cue: "Yesterday",
    tense: "past",
    accept: ["walked"],
  },
  {
    id: "vt-35-2",
    band: "3-5",
    text: "Last night, we ___ a story about a brave fox.",
    base: "read",
    cue: "Last night",
    tense: "past",
    accept: ["read"],
  },
  {
    id: "vt-35-3",
    band: "3-5",
    text: "Every morning, my dad ___ coffee before work.",
    base: "make",
    cue: "Every morning",
    tense: "present",
    accept: ["makes"],
  },
  {
    id: "vt-35-4",
    band: "3-5",
    text: "Look! The baby birds ___ right now.",
    base: "eat",
    cue: "right now",
    tense: "present-progressive",
    accept: ["are eating"],
  },
  {
    id: "vt-35-5",
    band: "3-5",
    text: "Tomorrow, our team ___ in the big game.",
    base: "play",
    cue: "Tomorrow",
    tense: "future",
    accept: ["will play", "is going to play", "'ll play"],
  },
  {
    id: "vt-35-6",
    band: "3-5",
    text: "Two days ago, Sam ___ his bike to the park.",
    base: "ride",
    cue: "Two days ago",
    tense: "past",
    accept: ["rode"],
  },
  {
    id: "vt-68-1",
    band: "6-8",
    text: "While the scientists ___ the river, it started to rain.",
    base: "test",
    cue: "While … it started",
    tense: "past-progressive",
    accept: ["were testing"],
  },
  {
    id: "vt-68-2",
    band: "6-8",
    text: "Before the treaty was signed, the two nations ___ for ten years.",
    base: "fight",
    cue: "Before … was signed",
    tense: "past-perfect",
    accept: ["had fought", "had been fighting"],
  },
  {
    id: "vt-68-3",
    band: "6-8",
    text: "Since 2020, our town ___ three new parks.",
    base: "build",
    cue: "Since 2020",
    tense: "present-perfect",
    accept: ["has built"],
  },
  {
    id: "vt-68-4",
    band: "6-8",
    text: "Last spring, the class ___ a letter to the city council.",
    base: "write",
    cue: "Last spring",
    tense: "past",
    accept: ["wrote"],
  },
  {
    id: "vt-68-5",
    band: "6-8",
    text: "Next week, the eighth graders ___ their science projects.",
    base: "present",
    cue: "Next week",
    tense: "future",
    accept: ["will present", "are going to present", "'ll present"],
  },
  {
    id: "vt-68-6",
    band: "6-8",
    text: "Water ___ at 100 degrees Celsius at sea level.",
    base: "boil",
    cue: "a fact that is always true",
    tense: "present",
    accept: ["boils"],
  },
];
export const VERB_TRANSFER = {
  "3-5": {
    en: "Write three sentences about your week: one about something you already did, one about now, and one about something you will do. Use a time word in each.",
    es: "Escribe tres oraciones sobre tu semana: una sobre algo que ya hiciste, una sobre ahora y una sobre algo que harás. Usa una palabra de tiempo en cada una.",
    topics: [
      ["My Week at School & Home", "Mi semana en la escuela y en casa"],
      ["A Class Science Experiment", "Un experimento de ciencias en clase"],
      ["Learning a Sport, Instrument, or Game", "Aprender un deporte, instrumento o juego"],
    ],
    wordBank: ["Yesterday,", "Last week,", "Right now,", "Today,", "Tomorrow,", "Next week,"],
  },
  "6-8": {
    en: "Write about a change in your neighborhood or school: what it was like before, what is happening now, and what you think will happen next. Use at least three time words.",
    es: "Escribe sobre un cambio en tu barrio o escuela: cómo era antes, qué está pasando ahora y qué crees que pasará después. Usa al menos tres palabras de tiempo.",
    topics: [
      ["A Change in Our Neighborhood or School", "Un cambio en nuestro barrio o escuela"],
      ["How an Invention or Technology Evolved", "Cómo evolucionó un invento o tecnología"],
      ["An Environmental or Community Investigation", "Una investigación ambiental o comunitaria"],
    ],
    wordBank: ["Last year,", "Before", "Now", "Today,", "Next year,", "Soon,"],
  },
};

// ── Connector Bridge ─────────────────────────────────────────────────────────
export const BRIDGE_PALETTE = [
  "because",
  "so",
  "but",
  "although",
  "then",
  "after that",
  "for example",
  "also",
  "however",
  "as a result",
];
export const BRIDGE_EXPLORE = { a: "The bridge was closed", b: "we took the long road home" };
export const BRIDGE_SCENES = [
  {
    id: "road",
    label: ["Closed bridge (result)", "Puente cerrado (resultado)"],
    a: "The bridge was closed",
    b: "we took the long road home",
    fitJobs: ["cause", "sequence"],
  },
  {
    id: "solar",
    label: ["Solar panels (contrast)", "Paneles solares (contraste)"],
    a: "Solar panels cost a lot at first",
    b: "they lower electricity bills for decades",
    fitJobs: ["contrast"],
  },
  {
    id: "pollinators",
    label: ["Pollinators (example)", "Polinizadores (ejemplo)"],
    a: "Many insects help gardens grow",
    b: "bumblebees carry pollen between tomato blossoms",
    fitJobs: ["example", "addition"],
  },
  {
    id: "experiment",
    label: ["Lab steps (time order)", "Pasos de laboratorio (orden)"],
    a: "First we measured the water temperature",
    b: "we stirred in the salt and recorded the change",
    fitJobs: ["sequence", "addition"],
  },
];
export const BRIDGE_MENTOR = {
  "3-5": {
    source: ["From a Grade 4 Community Garden Article", "De un artículo de 4.º grado sobre el jardín escolar"],
    passage:
      "Our schoolyard had a sunny corner with no grass, so our fourth-grade class decided to build raised garden beds. First, we filled the wooden frames with compost; after that, we planted lettuce and marigold seeds. Although the mornings were chilly, the seedlings sprouted in eight days.",
    takeaway: [
      "Notice how each connector builds a different kind of bridge: so shows a result, after that shows time order, and Although shows a surprising contrast.",
      "Observa cómo cada conector construye un puente distinto: so muestra un resultado, after that muestra orden en el tiempo y Although muestra un contraste sorprendente.",
    ],
  },
  "6-8": {
    source: ["From a Grade 8 Urban Planning Brief", "De un informe de planificación urbana de 8.º grado"],
    passage:
      "Dark asphalt roofs absorb intense summer heat; as a result, top-floor apartments become much warmer than shaded streets. Many cities now paint rooftops white or plant rooftop gardens; for example, Chicago has installed hundreds of green roofs. Although green roofs cost more at first, they cut cooling energy and absorb stormwater.",
    takeaway: [
      "Notice how the writer signals exact logical relationships: as a result (consequence), for example (evidence illustration), and Although (concession/contrast).",
      "Observa cómo el autor señala relaciones lógicas exactas: as a result (consecuencia), for example (ejemplo de evidencia) y Although (concesión/contraste).",
    ],
  },
};
export const BRIDGE_COMPARE = {
  "3-5": {
    before: "Mia practiced her spelling words every night. She felt ready on Friday.",
    after: "Mia practiced her spelling words every night, so she felt ready on Friday.",
    why: [
      "Without a bridge, the reader sees two separate facts. Adding “, so” shows that her practice caused her confidence.",
      "Sin un puente, el lector ve dos datos separados. Agregar «, so» muestra que su práctica fue la causa de su seguridad.",
    ],
  },
  "6-8": {
    before: "The experiment followed every step. The results did not match the prediction.",
    after: "The experiment followed every step; however, the results did not match the prediction.",
    why: [
      "“; however,” alerts the reader that the second clause runs counter to what we would expect from the first.",
      "«; however,» avisa al lector que la segunda idea contradice lo que esperaríamos de la primera.",
    ],
  },
};
export const BRIDGE_GUIDED = {
  a: "Plants need sunlight",
  b: "the plant in the dark closet turned yellow",
  steps: [
    [
      "Read idea A and idea B. What does B do to A?",
      "Lee la idea A y la idea B. ¿Qué hace B con A?",
    ],
    [
      "B shows what happens without sunlight: it is a result.",
      "B muestra qué pasa sin luz: es un resultado.",
    ],
    [
      "Result connectors: so, as a result, therefore.",
      "Conectores de resultado: so, as a result, therefore.",
    ],
    [
      "Plants need sunlight, so the plant in the dark closet turned yellow.",
      "Plants need sunlight, so the plant in the dark closet turned yellow.",
    ],
  ],
  rule: [
    "Writer's Rule: Ask “What does Idea B do to Idea A?” (give a reason/result, show a contrast, give an example, or tell what happened next) before picking the bridge.",
    "Regla del escritor: Pregúntate «¿Qué hace la Idea B con la Idea A?» (dar una razón/resultado, mostrar un contraste, dar un ejemplo o contar qué pasó después) antes de elegir el puente.",
  ],
};
export const BRIDGE_ITEMS = [
  {
    id: "cb-35-1",
    band: "3-5",
    a: "It started to rain",
    b: "we went inside",
    jobs: ["cause", "sequence"],
    why: { en: "The rain made us go in.", es: "La lluvia hizo que entráramos." },
  },
  {
    id: "cb-35-2",
    band: "3-5",
    a: "I like apples",
    b: "my sister likes oranges",
    jobs: ["contrast"],
    why: {
      en: "The two people like different fruit.",
      es: "Las dos personas prefieren frutas distintas.",
    },
  },
  {
    id: "cb-35-3",
    band: "3-5",
    a: "Some animals sleep all winter",
    b: "bears hibernate in caves",
    jobs: ["example"],
    why: {
      en: "Bears are one example of animals that sleep all winter.",
      es: "Los osos son un ejemplo de animales que duermen todo el invierno.",
    },
  },
  {
    id: "cb-35-4",
    band: "3-5",
    a: "First we mixed the flour and eggs",
    b: "we baked the cake",
    jobs: ["sequence"],
    why: { en: "Baking comes after mixing.", es: "Hornear viene después de mezclar." },
  },
  {
    id: "cb-35-5",
    band: "3-5",
    a: "Our class planted a garden",
    b: "we built a bird feeder",
    jobs: ["addition", "sequence"],
    why: { en: "Both are things the class did.", es: "Las dos son cosas que hizo la clase." },
  },
  {
    id: "cb-35-6",
    band: "3-5",
    a: "Mia studied every day",
    b: "she did well on the spelling test",
    jobs: ["cause"],
    why: {
      en: "Studying is the reason she did well.",
      es: "Estudiar es la razón por la que le fue bien.",
    },
  },
  {
    id: "cb-68-1",
    band: "6-8",
    a: "The town built a new factory",
    b: "the river became polluted",
    jobs: ["cause"],
    why: {
      en: "The pollution is a result of the factory.",
      es: "La contaminación es resultado de la fábrica.",
    },
  },
  {
    id: "cb-68-2",
    band: "6-8",
    a: "Solar panels cost a lot to install",
    b: "they save money over time",
    jobs: ["contrast"],
    why: {
      en: "Saving money is the surprising opposite of the high cost.",
      es: "Ahorrar dinero es lo contrario sorprendente al alto costo.",
    },
  },
  {
    id: "cb-68-3",
    band: "6-8",
    a: "Many inventions changed daily life",
    b: "the printing press spread books across Europe",
    jobs: ["example"],
    why: {
      en: "The printing press is one example of such an invention.",
      es: "La imprenta es un ejemplo de ese tipo de invento.",
    },
  },
  {
    id: "cb-68-4",
    band: "6-8",
    a: "The colonists protested the new taxes",
    b: "the king sent more soldiers",
    jobs: ["cause", "sequence"],
    why: {
      en: "The soldiers came after, and because of, the protests.",
      es: "Los soldados llegaron después de las protestas y por causa de ellas.",
    },
  },
  {
    id: "cb-68-5",
    band: "6-8",
    a: "Exercise strengthens the heart",
    b: "it improves sleep",
    jobs: ["addition"],
    why: {
      en: "Better sleep is a second benefit of the same habit.",
      es: "Dormir mejor es un segundo beneficio del mismo hábito.",
    },
  },
  {
    id: "cb-68-6",
    band: "6-8",
    a: "The experiment followed every step",
    b: "the results did not match the prediction",
    jobs: ["contrast"],
    why: {
      en: "The result is surprising after a careful experiment.",
      es: "El resultado sorprende después de un experimento cuidadoso.",
    },
  },
];
export const BRIDGE_TRANSFER = {
  "3-5": {
    job: "cause",
    en: "Write two ideas about your school day and join them so the second is the reason or the result of the first.",
    es: "Escribe dos ideas sobre tu día en la escuela y únelas para que la segunda sea la razón o el resultado de la primera.",
    topics: [
      ["Something that happened at school today", "Algo que pasó hoy en la escuela"],
      ["Why our class enjoys recess or art", "Por qué nuestra clase disfruta el recreo o el arte"],
      ["How weather changed our plans", "Cómo el clima cambió nuestros planes"],
    ],
    wordBank: ["because", "so", "as a result", "since"],
  },
  "6-8": {
    job: "contrast",
    en: "Write two ideas about a technology you use and join them to show a surprising difference (a benefit and a problem).",
    es: "Escribe dos ideas sobre una tecnología que usas y únelas para mostrar una diferencia sorprendente (un beneficio y un problema).",
    topics: [
      ["Smartphones or tablets in school (benefit vs. drawback)", "Teléfonos o tabletas en la escuela (beneficio y problema)"],
      ["Social media or video games (connection vs. distraction)", "Redes sociales o videojuegos (conexión y distracción)"],
      ["Artificial intelligence or search tools (speed vs. accuracy)", "Herramientas de búsqueda o IA (rapidez y precisión)"],
    ],
    wordBank: ["however", "although", "but", "even though"],
  },
};

// ── Paragraph X-Ray ──────────────────────────────────────────────────────────
const S = (text, job, why, clue, orderClue = "") => ({ text, job, why, clue, orderClue });
export const XRAY_COMPARE = {
  "3-5": {
    before:
      "Pollen sticks to a bee's legs. Without bees, many foods would disappear. Bees are important helpers for plants.",
    after:
      "Bees are important helpers for plants. When a bee visits a flower, pollen sticks to its legs. Without bees, many of the foods we eat would disappear.",
    why: [
      "Putting the topic sentence first tells the reader what the whole paragraph is about before the details begin.",
      "Poner la oración principal primero le dice al lector de qué trata todo el párrafo antes de empezar con los detalles.",
    ],
  },
  "6-8": {
    before:
      "Teenagers' sleep cycles shift later. Middle schools should start later. Tired students learn less.",
    after:
      "Middle schools should start later in the morning. Research shows that teenagers' sleep cycles shift later during puberty. Because tired students learn less, an early start works against the purpose of school.",
    why: [
      "Opening with the claim, following with research evidence, and explaining why that evidence matters creates a persuasive chain.",
      "Abrir con la afirmación, seguir con evidencia de investigación y explicar por qué importa esa evidencia crea una cadena convincente.",
    ],
  },
};
export const XRAY_MODEL = {
  "3-5": {
    title: "Why Bees Matter",
    sentences: [
      S(
        "Bees are important helpers for plants.",
        "topic",
        {
          en: "It names the topic (bees) and the main idea (they help plants).",
          es: "Nombra el tema (las abejas) y la idea principal (ayudan a las plantas).",
        },
        {
          en: "Does this sentence tell what the whole paragraph is about?",
          es: "¿Esta oración dice de qué trata todo el párrafo?",
        },
      ),
      S(
        "When a bee visits a flower, pollen sticks to its legs.",
        "detail",
        { en: "A fact about what bees do.", es: "Un dato sobre lo que hacen las abejas." },
        { en: "Is this one fact or event?", es: "¿Es un dato o un suceso?" },
      ),
      S(
        "Then the bee carries the pollen to the next flower.",
        "detail",
        {
          en: "Another fact; “Then” links it to the one before.",
          es: "Otro dato; «Then» lo une al anterior.",
        },
        { en: "Is this one more fact?", es: "¿Es un dato más?" },
        {
          en: "“Then” and “the pollen” point back to something said earlier.",
          es: "«Then» y «the pollen» se refieren a algo dicho antes.",
        },
      ),
      S(
        "This helps the flower make seeds and fruit.",
        "explain",
        {
          en: "It tells why carrying pollen matters.",
          es: "Dice por qué importa llevar el polen.",
        },
        { en: "Does this tell why the facts matter?", es: "¿Dice por qué importan los datos?" },
        {
          en: "“This” must point back to an action already described.",
          es: "«This» debe referirse a una acción ya descrita.",
        },
      ),
      S(
        "Without bees, many of the foods we eat would disappear.",
        "conclude",
        {
          en: "It connects back to the topic and shows the big picture.",
          es: "Vuelve al tema y muestra el panorama general.",
        },
        { en: "Does this sum up the paragraph?", es: "¿Resume el párrafo?" },
        {
          en: "A big-picture sentence comes last.",
          es: "Una oración de panorama general va al final.",
        },
      ),
    ],
    refs: [
      { word: "its", to: "a bee" },
      { word: "This", to: "carrying pollen" },
    ],
  },
  "6-8": {
    title: "The Cost of Fast Fashion",
    sentences: [
      S(
        "Fast fashion harms the environment in ways most shoppers never see.",
        "topic",
        {
          en: "It states the claim the paragraph will support.",
          es: "Plantea la afirmación que el párrafo va a apoyar.",
        },
        {
          en: "Does this sentence state the paragraph's main point?",
          es: "¿Esta oración plantea la idea principal del párrafo?",
        },
      ),
      S(
        "For example, making one cotton shirt can use about 2,700 liters of water.",
        "detail",
        {
          en: "A specific piece of evidence, introduced with “For example”.",
          es: "Una evidencia específica, introducida con «For example».",
        },
        { en: "Is this a specific fact or number?", es: "¿Es un dato o un número específico?" },
        {
          en: "“For example” needs a claim before it.",
          es: "«For example» necesita una afirmación antes.",
        },
      ),
      S(
        "In addition, cheap clothes are often thrown away after only a few uses.",
        "detail",
        {
          en: "A second piece of evidence, added with “In addition”.",
          es: "Una segunda evidencia, agregada con «In addition».",
        },
        { en: "Is this another fact?", es: "¿Es otro dato?" },
        {
          en: "“In addition” adds to evidence already given.",
          es: "«In addition» agrega a evidencia ya dada.",
        },
      ),
      S(
        "These habits waste resources and fill landfills with fabric that takes years to break down.",
        "explain",
        {
          en: "It explains how the evidence connects to the claim.",
          es: "Explica cómo la evidencia se conecta con la afirmación.",
        },
        {
          en: "Does this explain why the facts matter?",
          es: "¿Explica por qué importan los datos?",
        },
        {
          en: "“These habits” refers back to facts already listed.",
          es: "«These habits» se refiere a datos ya mencionados.",
        },
      ),
      S(
        "Therefore, buying fewer, longer-lasting clothes is one way to protect the planet.",
        "conclude",
        {
          en: "“Therefore” signals the conclusion drawn from the evidence.",
          es: "«Therefore» señala la conclusión que sale de la evidencia.",
        },
        { en: "Does this draw a conclusion?", es: "¿Saca una conclusión?" },
        {
          en: "“Therefore” draws a conclusion, so it comes last.",
          es: "«Therefore» saca una conclusión, así que va al final.",
        },
      ),
    ],
    refs: [{ word: "These habits", to: "using water and throwing clothes away" }],
  },
};
export const XRAY_PRACTICE = {
  "3-5": {
    title: "A Rainy Day Plan",
    sentences: [
      S(
        "Rainy days can still be fun at home.",
        "topic",
        {
          en: "It says what the whole paragraph is about.",
          es: "Dice de qué trata todo el párrafo.",
        },
        { en: "Which sentence tells the main idea?", es: "¿Qué oración dice la idea principal?" },
      ),
      S(
        "First, my family builds a blanket fort in the living room.",
        "detail",
        {
          en: "One thing the family does, with “First”.",
          es: "Una cosa que hace la familia, con «First».",
        },
        { en: "Is this one activity?", es: "¿Es una actividad?" },
        {
          en: "“First” starts the list of activities.",
          es: "«First» empieza la lista de actividades.",
        },
      ),
      S(
        "After that, we play board games inside it.",
        "detail",
        {
          en: "The next activity; “After that” and “it” point back.",
          es: "La siguiente actividad; «After that» e «it» se refieren a lo anterior.",
        },
        { en: "Is this another activity?", es: "¿Es otra actividad?" },
        {
          en: "“it” needs the fort to be named first.",
          es: "«it» necesita que el fuerte se nombre antes.",
        },
      ),
      S(
        "These games make us laugh and forget about the gray sky.",
        "explain",
        {
          en: "It tells why the activities make the day fun.",
          es: "Dice por qué las actividades hacen el día divertido.",
        },
        { en: "Does this tell why it matters?", es: "¿Dice por qué importa?" },
        {
          en: "“These games” needs the games to come first.",
          es: "«These games» necesita que los juegos vengan antes.",
        },
      ),
      S(
        "That is why I do not mind rainy days.",
        "conclude",
        { en: "“That is why” sums up the paragraph.", es: "«That is why» resume el párrafo." },
        { en: "Does this sum it up?", es: "¿Lo resume?" },
        { en: "A summing-up sentence goes last.", es: "Una oración que resume va al final." },
      ),
    ],
  },
  "6-8": {
    title: "Should School Start Later?",
    sentences: [
      S(
        "Middle schools should start later in the morning.",
        "topic",
        { en: "It states the claim.", es: "Plantea la afirmación." },
        { en: "Which sentence states the claim?", es: "¿Qué oración plantea la afirmación?" },
      ),
      S(
        "Research shows that teenagers' sleep cycles shift later during puberty.",
        "detail",
        { en: "Evidence from research.", es: "Evidencia de investigaciones." },
        { en: "Is this evidence?", es: "¿Es evidencia?" },
        {
          en: "Evidence follows the claim it supports.",
          es: "La evidencia va después de la afirmación que apoya.",
        },
      ),
      S(
        "As a result, students who start at 7:30 often arrive tired and unfocused.",
        "detail",
        {
          en: "A consequence presented as evidence.",
          es: "Una consecuencia presentada como evidencia.",
        },
        { en: "Is this another fact or result?", es: "¿Es otro dato o resultado?" },
        {
          en: "“As a result” needs a cause before it.",
          es: "«As a result» necesita una causa antes.",
        },
      ),
      S(
        "Because tired students learn less, an early start works against the purpose of school.",
        "explain",
        {
          en: "It explains why the evidence matters for the claim.",
          es: "Explica por qué la evidencia importa para la afirmación.",
        },
        { en: "Does this explain the evidence?", es: "¿Explica la evidencia?" },
        {
          en: "The explanation comes after the evidence it explains.",
          es: "La explicación viene después de la evidencia que explica.",
        },
      ),
      S(
        "For these reasons, a later start time would help students succeed.",
        "conclude",
        {
          en: "“For these reasons” signals the conclusion.",
          es: "«For these reasons» señala la conclusión.",
        },
        { en: "Does this conclude?", es: "¿Concluye?" },
        {
          en: "“For these reasons” needs the reasons first.",
          es: "«For these reasons» necesita las razones antes.",
        },
      ),
    ],
  },
};
export const XRAY_TRANSFER = {
  "3-5": {
    topicWords: ["animal", "pet", "dog", "dogs", "cat", "cats", "bird", "birds", "rabbit", "turtle", "fish", "horse", "frog", "bee", "bees"],
    en: "Write a paragraph about an animal or pet you know well. Start with a topic sentence, give two details, explain one, and end with a sentence that sums it up.",
    es: "Escribe un párrafo sobre un animal o mascota que conoces bien. Empieza con una oración principal, da dos detalles, explica uno y termina con una oración que lo resuma.",
    topics: [
      ["A Great Family Pet (dog, cat, fish, bird)", "Una gran mascota familiar (perro, gato, pez, ave)"],
      ["An Amazing Wild Animal (bees, frogs, owls)", "Un animal salvaje asombroso (abejas, ranas, búhos)"],
      ["How Animals Help People or Nature", "Cómo ayudan los animales a las personas o a la naturaleza"],
    ],
    wordBank: ["First,", "Also,", "For example,", "because", "That is why", "Overall,"],
  },
  "6-8": {
    topicWords: ["phone", "phones", "technology", "screen", "screens", "device", "devices"],
    en: "Write a paragraph arguing whether students should use phones during lunch. State your claim, give two pieces of evidence or reasons, explain them, and conclude.",
    es: "Escribe un párrafo que argumente si los estudiantes deberían usar el teléfono durante el almuerzo. Plantea tu afirmación, da dos evidencias o razones, explícalas y concluye.",
    topics: [
      ["Should students use phones during lunch?", "¿Deberían los estudiantes usar el teléfono en el almuerzo?"],
      ["How screen time affects middle school friendships", "Cómo influye el tiempo de pantalla en las amistades"],
      ["When technology helps—or hurts—learning at school", "Cuándo la tecnología ayuda o perjudica el aprendizaje"],
    ],
    wordBank: ["First,", "For example,", "In addition,", "However,", "Because", "Therefore,", "Overall,"],
  },
};

/** The six labs named in the platform brief: three built here, three that already existed under other names. */
export const LABS = [
  {
    id: "verb-time-machine",
    here: true,
    icon: "clock",
    use: "Narrate",
    dimension: "word",
    title: ["Verb Time Machine", "Máquina del tiempo de verbos"],
    text: [
      "Move an action along a timeline and watch the verb change.",
      "Mueve una acción en la línea del tiempo y mira cómo cambia el verbo.",
    ],
    skill: ["Time and verb tense", "Tiempo y tiempos verbales"],
    bandNote: {
      "3-5": [
        "4 stops: past, present, right now, and future with regular & irregular verbs",
        "4 paradas: pasado, presente, ahora mismo y futuro con verbos regulares e irregulares",
      ],
      "6-8": [
        "7 stops: past perfect, past progressive, present perfect, and complex timelines",
        "7 paradas: pasado perfecto, pasado progresivo, presente perfecto y líneas complejas",
      ],
    },
    mentor: {
      "3-5": "Yesterday, Ana walked to the library, and tomorrow she will read her book.",
      "6-8": "Before the treaty was signed, the two nations had fought for ten years.",
    },
  },
  {
    id: "connector-bridge",
    here: true,
    icon: "words",
    use: "Explain",
    dimension: "sentence",
    title: ["Connector Bridge", "Puente de conectores"],
    text: [
      "Join two ideas and see how the linking word changes the meaning.",
      "Une dos ideas y mira cómo el conector cambia el significado.",
    ],
    skill: ["Linking ideas", "Unir ideas"],
    bandNote: {
      "3-5": [
        "Cause, contrast, time order, and example bridges in everyday & science sentences",
        "Puentes de causa, contraste, orden y ejemplo en oraciones cotidianas y de ciencias",
      ],
      "6-8": [
        "Consequence, concession, and evidence transitions (; however, / ; as a result,)",
        "Transiciones de consecuencia, concesión y evidencia (; however, / ; as a result,)",
      ],
    },
    mentor: {
      "3-5": "Plants need sunlight, so the plant in the dark closet turned yellow.",
      "6-8": "Solar panels cost a lot to install; however, they save money over time.",
    },
  },
  {
    id: "paragraph-xray",
    here: true,
    icon: "search",
    use: "Argue",
    dimension: "discourse",
    title: ["Paragraph X-Ray", "Rayos X del párrafo"],
    text: [
      "See the job of every sentence and the words that hold a paragraph together.",
      "Mira la función de cada oración y las palabras que mantienen unido un párrafo.",
    ],
    skill: ["Organization and cohesion", "Organización y cohesión"],
    bandNote: {
      "3-5": [
        "Topic sentence, linked details, explanation, and big-picture conclusion",
        "Oración principal, detalles unidos, explicación y conclusión general",
      ],
      "6-8": [
        "Claim, research evidence, reasoning, conclusion, and pointing-word chains",
        "Afirmación, evidencia, razonamiento, conclusión y cadenas de palabras que señalan",
      ],
    },
    mentor: {
      "3-5": "Bees are important helpers for plants. Without bees, many foods would disappear.",
      "6-8": "Because tired students learn less, an early start works against the purpose of school.",
    },
  },
  {
    id: "sentence-expansion",
    href: "scaffold/sentence-architecture",
    toolId: "sentence-architecture",
    icon: "construction",
    use: "Inform",
    dimension: "sentence",
    title: ["Sentence Expansion Lab", "Laboratorio de expansión de oraciones"],
    text: [
      "Build a sentence from parts, then add who, when, where and why. (Sentence Architecture)",
      "Construye una oración por partes y agrega quién, cuándo, dónde y por qué. (Arquitectura de oraciones)",
    ],
    skill: ["Sentence building", "Construir oraciones"],
    bandNote: {
      "3-5": [
        "Assemble who, action, what, and a connector clause with tap or drag tiles",
        "Arma quién, acción, qué y una cláusula con conector tocando o arrastrando fichas",
      ],
      "6-8": [
        "Construct multi-clause disciplinary sentences with academic connectors",
        "Construye oraciones académicas de varias cláusulas con conectores precisos",
      ],
    },
    mentor: {
      "3-5": "Pollinators visit bright flowers because they need sweet nectar for energy.",
      "6-8": "Wetlands filter stormwater runoff before it reaches the harbor ecosystem.",
    },
  },
  {
    id: "evidence-builder",
    href: "scaffold/evidence-builder",
    toolId: "evidence-builder",
    icon: "evidence",
    use: "Argue",
    dimension: "discourse",
    title: ["Evidence Builder", "Constructor de evidencia"],
    text: [
      "Choose evidence that supports a claim and connect it with reasoning.",
      "Elige evidencia que apoye una afirmación y conéctala con un razonamiento.",
    ],
    skill: ["Claims and evidence", "Afirmaciones y evidencia"],
    bandNote: {
      "3-5": [
        "Separate supporting facts from off-topic details and link them with For example",
        "Separa los datos que apoyan la idea de los detalles sueltos y únelos con For example",
      ],
      "6-8": [
        "Evaluate competing evidence cards, order them, and bridge to the claim",
        "Evalúa tarjetas de evidencia, ordénalas y conéctalas con la afirmación",
      ],
    },
    mentor: {
      "3-5": "School gardens help students learn. For example, classes measure how fast bean sprouts grow.",
      "6-8": "The evidence shows that shade trees lower sidewalk temperatures by up to 12 degrees.",
    },
  },
  {
    id: "precision-challenge",
    href: "scaffold/language-upgrade",
    toolId: "language-upgrade",
    icon: "sparkle",
    use: "Explain",
    dimension: "word",
    title: ["Precision Challenge", "Reto de precisión"],
    text: [
      "Swap vague words for precise ones that fit the context. (Language Upgrade Lab)",
      "Cambia palabras vagas por palabras precisas que encajen. (Laboratorio de mejora del lenguaje)",
    ],
    skill: ["Precise vocabulary", "Vocabulario preciso"],
    bandNote: {
      "3-5": [
        "Replace general words like stuff, things, and went with exact science & story words",
        "Reemplaza palabras vagas como stuff, things y went por vocabulario exacto",
      ],
      "6-8": [
        "Revise informal drafts into academic register using domain-specific vocabulary",
        "Revisa borradores informales hacia un registro académico con vocabulario disciplinar",
      ],
    },
    mentor: {
      "3-5": "Plants need sunlight, water, and soil because they use them to make food and grow.",
      "6-8": "Fertilizer runoff pollutes rivers because excess nitrogen triggers algae blooms.",
    },
  },
];
