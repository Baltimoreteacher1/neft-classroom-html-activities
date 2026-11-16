// Adventure World: Newsroom Studio. Young reporters at the student paper cover one community story (an old oak
// falls on the school bus loop in a windstorm, and the neighborhood replants). 5W1H, fact vs opinion, reading a data
// table, quoting sources, writing a lead and a short article. Pure data; schema: ADVENTURE-SCHEMA (src/adventures/).

const breaking = {
  id: "breaking-story",
  title: { en: "The Breaking Story", es: "La noticia de último momento" },
  goal: {
    en: "Find who, what, when, where, why and how, and ask questions that get the missing facts.",
    es: "Encontrar quién, qué, cuándo, dónde, por qué y cómo, y hacer preguntas para conseguir los datos que faltan.",
  },
  keyUse: "Inform",
  domains: ["Listening", "Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter", "char-kai"],
        speaker: "Dev Anand",
        text: {
          en: "Welcome to The Cedar Gazette, our student newspaper! I'm Dev, the editor. Big news: a huge oak tree fell on the school bus loop last night. Every good news story answers six questions. Let's go find the facts.",
          es: "¡Bienvenido a The Cedar Gazette, nuestro periódico escolar! Soy Dev, el editor. Gran noticia: un roble enorme se cayó anoche en la zona de autobuses de la escuela. Toda buena noticia responde seis preguntas. Vamos a buscar los datos.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Good morning, Cedar Grove students. Last night, during a strong windstorm, the old oak tree next to the bus loop fell down. Nobody was hurt, because it happened after ten o'clock at night. Today, buses will drop you off on Maple Avenue instead. A tree crew is cutting the trunk into pieces so they can move it.",
        },
        transcriptLabel: { en: "The principal's announcement", es: "El anuncio de la directora" },
      },
      {
        kind: "clues",
        prompt: {
          en: "Collect facts for the story. Pick the details that answer What, When, Why or How.",
          es: "Reúne datos para la noticia. Elige los detalles que responden Qué, Cuándo, Por qué o Cómo.",
        },
        clues: [
          {
            id: "what",
            text: { en: "The old oak tree by the bus loop fell down." },
            relevant: true,
            why: { en: "This answers WHAT happened.", es: "Esto responde QUÉ pasó." },
          },
          {
            id: "when",
            text: { en: "It fell last night, after ten o'clock." },
            relevant: true,
            why: { en: "This answers WHEN it happened.", es: "Esto responde CUÁNDO pasó." },
          },
          {
            id: "why",
            text: { en: "A strong windstorm knocked it over." },
            relevant: true,
            why: {
              en: "This answers WHY the tree fell.",
              es: "Esto responde POR QUÉ se cayó el árbol.",
            },
          },
          {
            id: "how",
            text: { en: "A crew is cutting the trunk into pieces to move it." },
            relevant: true,
            why: {
              en: "This answers HOW the problem is being fixed.",
              es: "Esto responde CÓMO se está resolviendo el problema.",
            },
          },
          {
            id: "pretty",
            text: { en: "Oak trees are the prettiest trees." },
            relevant: false,
            why: {
              en: "This is someone's opinion, not a fact from the announcement. News stories are built on facts.",
              es: "Esto es una opinión, no un dato del anuncio. Las noticias se construyen con datos.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "The announcement did not say how old the tree was. Which question should you ask?",
          es: "El anuncio no dijo cuántos años tenía el árbol. ¿Qué pregunta deberías hacer?",
        },
        options: [
          {
            text: { en: "How long has the oak tree been at our school?" },
            correct: true,
            feedback: {
              en: "Good reporting! This question asks for the exact fact that is missing.",
              es: "¡Buen trabajo de reportero! Esta pregunta pide justo el dato que falta.",
            },
          },
          {
            text: { en: "Did the tree fall?" },
            correct: false,
            feedback: {
              en: "You already know the answer is yes. Ask about something the announcement did NOT tell you.",
              es: "Ya sabes que la respuesta es sí. Pregunta algo que el anuncio NO dijo.",
            },
          },
          {
            text: { en: "Was it scary?" },
            correct: false,
            feedback: {
              en: "This asks for feelings, which can be fine later. Right now we need the missing fact about the tree's age.",
              es: "Esto pregunta por sentimientos, lo cual puede servir después. Ahora necesitamos el dato que falta sobre la edad del árbol.",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write three questions you will ask the school custodian. Start each one with a different question word.",
          es: "Escribe tres preguntas para el conserje de la escuela. Empieza cada una con una palabra de pregunta diferente.",
        },
        mode: "write",
        frames: [{ en: "Who...?" }, { en: "When...?" }, { en: "How...?" }],
        wordBank: ["who", "what", "when", "where", "why", "how", "tree", "bus loop", "crew"],
        check: {
          minWords: 15,
          needAny: [
            ["who", "what", "where"],
            ["when", "why"],
            ["how"],
            ["tree", "oak", "trunk", "crew"],
          ],
        },
        model: {
          en: "Who called the tree crew last night? When will the buses come back to the bus loop? How long has the oak tree been at our school?",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "Reporters answer Who, What, When, Where, Why and How, and they ask questions to find missing facts.",
          es: "Los reporteros responden Quién, Qué, Cuándo, Dónde, Por qué y Cómo, y hacen preguntas para encontrar los datos que faltan.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter", "char-kai"],
        speaker: "Dev Anand",
        text: {
          en: "Welcome to The Cedar Gazette newsroom. I'm Dev, the student editor. Overnight, the century-old oak beside the bus loop came down in a windstorm, and the whole school is talking. Rumors move fast; our job is to move carefully. Start with the 5W1H.",
          es: "Bienvenido a la sala de redacción de The Cedar Gazette. Soy Dev, el editor estudiantil. Durante la noche, el roble centenario junto a la zona de autobuses se cayó en una tormenta de viento, y toda la escuela habla de eso. Los rumores corren rápido; nuestro trabajo es avanzar con cuidado. Empieza con las 5W1H.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Good morning, Cedar Grove. As many of you have heard, the large oak tree beside the bus loop fell at approximately ten forty last night during a windstorm. No one was injured, and the building was not damaged, although the bus shelter roof was crushed. The city's forestry crew arrived at six this morning. Until the loop is cleared, which we expect by Thursday, buses will unload on Maple Avenue, and staff will be posted at the crosswalk. I'll share more once the crew tells us why this particular tree failed.",
        },
        transcriptLabel: { en: "The principal's announcement", es: "El anuncio de la directora" },
      },
      {
        kind: "clues",
        prompt: {
          en: "Build your 5W1H notes. Choose the facts the announcement actually confirms.",
          es: "Arma tus notas 5W1H. Elige los datos que el anuncio realmente confirma.",
        },
        clues: [
          {
            id: "when",
            text: { en: "The tree fell at about 10:40 p.m. during a windstorm." },
            relevant: true,
            why: {
              en: "Confirmed WHEN, and a partial WHY (the storm).",
              es: "Confirma CUÁNDO, y en parte POR QUÉ (la tormenta).",
            },
          },
          {
            id: "damage",
            text: { en: "No one was injured; the bus shelter roof was crushed." },
            relevant: true,
            why: {
              en: "Confirmed WHAT happened, including the damage.",
              es: "Confirma QUÉ pasó, incluido el daño.",
            },
          },
          {
            id: "who",
            text: { en: "The city forestry crew arrived at 6 a.m." },
            relevant: true,
            why: {
              en: "Confirmed WHO is responding and WHEN.",
              es: "Confirma QUIÉN responde y CUÁNDO.",
            },
          },
          {
            id: "how",
            text: { en: "Buses unload on Maple Avenue until about Thursday." },
            relevant: true,
            why: {
              en: "Confirmed HOW the school is handling it.",
              es: "Confirma CÓMO lo está manejando la escuela.",
            },
          },
          {
            id: "rot",
            text: { en: "The tree was rotten inside for years." },
            relevant: false,
            why: {
              en: "The principal said the cause is not known yet. Printing this would turn a rumor into “news.”",
              es: "La directora dijo que la causa aún no se sabe. Publicar esto convertiría un rumor en «noticia».",
            },
          },
          {
            id: "shouldhave",
            text: { en: "The school should have cut it down long ago." },
            relevant: false,
            why: {
              en: "This is an opinion. A news story can quote an opinion, but it can't treat one as a fact.",
              es: "Esto es una opinión. Una noticia puede citar una opinión, pero no tratarla como un dato.",
            },
          },
        ],
        need: 4,
      },
      {
        kind: "choice",
        prompt: {
          en: "Which of the six questions is still unanswered?",
          es: "¿Cuál de las seis preguntas sigue sin respuesta?",
        },
        options: [
          {
            text: { en: "Why this particular tree failed." },
            correct: true,
            feedback: {
              en: "Exactly. The storm explains the timing, but the principal said the cause is still being investigated.",
              es: "Exacto. La tormenta explica el momento, pero la directora dijo que la causa todavía se investiga.",
            },
          },
          {
            text: { en: "Where the buses will unload." },
            correct: false,
            feedback: {
              en: "Listen again: the principal named a street for the buses. Which question did she say she can't answer yet?",
              es: "Escucha otra vez: la directora nombró una calle para los autobuses. ¿Qué pregunta dijo que todavía no puede responder?",
            },
          },
          {
            text: { en: "Whether anyone was hurt." },
            correct: false,
            feedback: {
              en: "This one was answered clearly. Look for the question the principal promised to answer later.",
              es: "Esta se respondió con claridad. Busca la pregunta que la directora prometió responder después.",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write four interview questions for the forestry crew leader. Use at least three different question words, and include one follow-up that targets the unanswered question.",
          es: "Escribe cuatro preguntas de entrevista para la jefa del equipo forestal. Usa al menos tres palabras de pregunta diferentes e incluye una pregunta de seguimiento sobre la pregunta sin respuesta.",
        },
        mode: "write",
        frames: [
          { en: "What did your crew find...?" },
          { en: "Why do you think...?" },
          { en: "How will...?" },
        ],
        wordBank: [
          "forestry",
          "trunk",
          "roots",
          "windstorm",
          "inspect",
          "bus shelter",
          "follow-up",
        ],
        check: {
          minWords: 35,
          needWords: ["why"],
          needAny: [
            ["what", "who", "where"],
            ["how", "when"],
            ["tree", "oak", "trunk", "roots"],
          ],
        },
        model: {
          en: "What did your crew find when you arrived at six this morning? Why do you think this oak fell when other trees nearby did not? Were the roots or the trunk damaged before the storm? How will the city decide whether the other trees near the bus loop are safe?",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You separated confirmed facts from rumors and opinions, and aimed your questions at what is still unknown.",
          es: "Separaste los datos confirmados de los rumores y las opiniones, y dirigiste tus preguntas a lo que aún no se sabe.",
        },
      },
    ],
  },
};

const witnesses = {
  id: "eyewitness-accounts",
  title: { en: "Two Eyewitnesses", es: "Dos testigos" },
  goal: {
    en: "Tell facts from opinions, notice where witnesses disagree, and report only what you can confirm.",
    es: "Distinguir datos de opiniones, notar en qué no están de acuerdo los testigos y reportar solo lo que puedes confirmar.",
  },
  keyUse: "Explain",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter"],
        speaker: "Dev Anand",
        text: {
          en: "Two neighbors saw the tree fall. But their stories do not match! A good reporter reads both carefully and only reports what is true.",
          es: "Dos vecinos vieron caer el árbol. ¡Pero sus historias no coinciden! Un buen reportero lee las dos con cuidado y solo reporta lo que es verdad.",
        },
      },
      {
        kind: "read",
        title: { en: "What the Neighbors Said", es: "Lo que dijeron los vecinos" },
        text: {
          en: "Mr. Ruiz lives across the street. He said, “I heard a loud crack at about ten thirty. I looked out my window and saw the tree fall onto the bus shelter. It was the scariest thing I have ever seen.” Ms. Bell walks her dog every night. She said, “It was close to eleven o'clock. The tree fell toward the school building. That tree was always ugly anyway.” The school's camera shows the tree falling at 10:40 p.m. onto the bus shelter.",
        },
        glossary: [
          {
            word: "crack",
            en: "a sudden, sharp breaking sound",
            es: "un crujido; un sonido fuerte de algo que se rompe",
          },
          {
            word: "shelter",
            en: "a small roof where people wait",
            es: "un refugio; un techo pequeño donde la gente espera",
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Pick the FACTS you can report, the ones the camera agrees with.",
          es: "Elige los DATOS que puedes reportar, los que coinciden con la cámara.",
        },
        clues: [
          {
            id: "shelter",
            text: { en: "The tree fell onto the bus shelter." },
            relevant: true,
            why: {
              en: "Mr. Ruiz said this, and the camera shows it too.",
              es: "El señor Ruiz lo dijo, y la cámara también lo muestra.",
            },
          },
          {
            id: "time",
            text: { en: "The tree fell at 10:40 p.m." },
            relevant: true,
            why: {
              en: "The camera records the exact time.",
              es: "La cámara registra la hora exacta.",
            },
          },
          {
            id: "crack",
            text: { en: "Mr. Ruiz heard a loud crack." },
            relevant: true,
            why: {
              en: "This is a fact about what he heard, and you can report it as his words.",
              es: "Es un dato sobre lo que él escuchó, y puedes reportarlo como sus palabras.",
            },
          },
          {
            id: "ugly",
            text: { en: "The tree was ugly." },
            relevant: false,
            why: {
              en: "“Ugly” is an opinion. People can disagree about it.",
              es: "«Feo» es una opinión. La gente puede no estar de acuerdo.",
            },
          },
          {
            id: "school",
            text: { en: "The tree fell toward the school building." },
            relevant: false,
            why: {
              en: "The camera shows it fell onto the bus shelter, so this memory is not correct.",
              es: "La cámara muestra que cayó sobre el refugio de autobuses, así que este recuerdo no es correcto.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "respond",
        prompt: {
          en: "Write two or three sentences for the story. Tell what happened using only facts, and say who or what told you each fact.",
          es: "Escribe dos o tres oraciones para la noticia. Cuenta lo que pasó usando solo datos, y di quién o qué te dio cada dato.",
        },
        mode: "write",
        frames: [{ en: "According to the school camera, ..." }, { en: "Mr. Ruiz said that..." }],
        wordBank: ["according to", "camera", "fell", "bus shelter", "10:40", "crack", "said"],
        check: {
          minWords: 20,
          needConnectors: ["evidence"],
          needAny: [["shelter", "10:40", "crack"]],
          evidenceFrom: "clues",
        },
        model: {
          en: "According to the school camera, the oak tree fell onto the bus shelter at 10:40 p.m. Mr. Ruiz, who lives across the street, said that he heard a loud crack.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "Facts can be checked. Opinions tell how someone feels. Reporters say where each fact came from.",
          es: "Los datos se pueden comprobar. Las opiniones dicen lo que alguien siente. Los reporteros dicen de dónde viene cada dato.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter"],
        speaker: "Dev Anand",
        text: {
          en: "Kai found two eyewitnesses, and their accounts conflict on two important details. We also have footage from the school's security camera. Our rule at the Gazette: when sources disagree, we report what can be confirmed and we say clearly what can't.",
          es: "Kai encontró dos testigos, y sus relatos no coinciden en dos detalles importantes. También tenemos el video de la cámara de seguridad de la escuela. Nuestra regla en el Gazette: cuando las fuentes no coinciden, reportamos lo que se puede confirmar y decimos con claridad lo que no.",
        },
      },
      {
        kind: "read",
        title: { en: "Eyewitness Notes", es: "Notas de los testigos" },
        text: {
          en: "Eyewitness 1, Mr. Ruiz, retired bus driver, lives across the street: “I heard a crack like a gunshot around ten thirty and ran to the window. The whole tree leaned and then dropped straight onto the bus shelter. Honestly, the district should have removed that tree years ago; it was a disaster waiting to happen.” Eyewitness 2, Ms. Bell, walking her dog on Maple Avenue: “It must have been close to eleven, because my show had just ended. The wind was howling. I'm fairly sure it fell toward the school, but it was dark and I was half a block away. Losing that oak is a real tragedy; it was the most beautiful tree in the neighborhood.” Security camera, east lot, time-stamped: at 10:40 p.m., the oak tips south and lands across the bus shelter. The building is not touched.",
        },
        glossary: [
          {
            word: "eyewitness",
            en: "a person who saw something happen",
            es: "un testigo; persona que vio algo pasar",
          },
          {
            word: "time-stamped",
            en: "marked with the exact time it was recorded",
            es: "con la hora exacta en que se grabó",
          },
          { word: "tragedy", en: "a very sad event", es: "una tragedia; un hecho muy triste" },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Mark the statements a reporter could print as confirmed fact.",
          es: "Marca las afirmaciones que un reportero podría publicar como datos confirmados.",
        },
        clues: [
          {
            id: "camera-time",
            text: { en: "The oak fell at 10:40 p.m." },
            relevant: true,
            why: {
              en: "The time-stamped camera confirms it, and it falls between the two witnesses' guesses.",
              es: "La cámara con hora lo confirma, y queda entre las dos estimaciones de los testigos.",
            },
          },
          {
            id: "camera-shelter",
            text: { en: "The oak landed across the bus shelter, not the building." },
            relevant: true,
            why: {
              en: "Mr. Ruiz and the camera agree; that's two sources.",
              es: "El señor Ruiz y la cámara coinciden; son dos fuentes.",
            },
          },
          {
            id: "wind",
            text: { en: "It was windy when the tree fell." },
            relevant: true,
            why: {
              en: "Ms. Bell describes howling wind, and the principal announced a windstorm: two sources agree.",
              es: "La señora Bell describe un viento muy fuerte, y la directora anunció una tormenta de viento: dos fuentes coinciden.",
            },
          },
          {
            id: "disaster",
            text: { en: "The tree was a disaster waiting to happen." },
            relevant: false,
            why: {
              en: "This is Mr. Ruiz's opinion. You could quote it as his view, but not state it as fact.",
              es: "Es la opinión del señor Ruiz. Podrías citarla como su punto de vista, pero no presentarla como dato.",
            },
          },
          {
            id: "beautiful",
            text: { en: "It was the most beautiful tree in the neighborhood." },
            relevant: false,
            why: {
              en: "“Most beautiful” is a judgment, not something anyone can check.",
              es: "«El más bonito» es un juicio, no algo que se pueda comprobar.",
            },
          },
          {
            id: "toward-school",
            text: { en: "The tree fell toward the school." },
            relevant: false,
            why: {
              en: "Ms. Bell said she was unsure, and the camera shows otherwise.",
              es: "La señora Bell dijo que no estaba segura, y la cámara muestra otra cosa.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "Why might Ms. Bell's account differ from the camera?",
          es: "¿Por qué el relato de la señora Bell podría ser diferente del video?",
        },
        options: [
          {
            text: {
              en: "She was half a block away in the dark, and she guessed the time from her TV show.",
            },
            correct: true,
            feedback: {
              en: "Good source thinking. Her own words explain why her details are less certain; that doesn't mean she lied.",
              es: "Buen análisis de fuentes. Sus propias palabras explican por qué sus detalles son menos seguros; eso no significa que mintiera.",
            },
          },
          {
            text: { en: "She was trying to trick the reporter." },
            correct: false,
            feedback: {
              en: "Nothing in the notes suggests that. Look at what she said about where she was and how she knew the time.",
              es: "Nada en las notas sugiere eso. Mira lo que dijo sobre dónde estaba y cómo supo la hora.",
            },
          },
          {
            text: { en: "Cameras are always wrong." },
            correct: false,
            feedback: {
              en: "The camera is time-stamped and agrees with Mr. Ruiz. What details in Ms. Bell's own words make her less certain?",
              es: "La cámara tiene hora y coincide con el señor Ruiz. ¿Qué detalles en las palabras de la señora Bell la hacen menos segura?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write a short paragraph for the story. Report the confirmed facts with their sources, quote one witness's opinion fairly as an opinion, and explain the conflicting detail without taking sides unfairly.",
          es: "Escribe un párrafo corto para la noticia. Reporta los datos confirmados con sus fuentes, cita la opinión de un testigo de forma justa como opinión y explica el detalle en conflicto sin tomar partido injustamente.",
        },
        mode: "write",
        frames: [
          { en: "According to..." },
          { en: "One witness believes..." },
          { en: "However, ..." },
        ],
        wordBank: [
          "according to",
          "time-stamped",
          "confirmed",
          "eyewitness",
          "however",
          "believes",
          "recalled",
        ],
        check: {
          minWords: 50,
          needConnectors: ["evidence", "contrast"],
          needAny: [
            ["10:40", "shelter"],
            ["opinion", "believes", "said", "called", "feels"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "According to a time-stamped security camera, the oak fell at 10:40 p.m. and landed across the bus shelter, not the school building. Mr. Ruiz, a retired bus driver who lives across the street, said the district should have removed the tree years ago. Another eyewitness recalled the tree falling toward the school. However, she said she was half a block away in the dark, and the camera footage shows it fell onto the shelter.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You confirmed facts with more than one source, quoted opinions as opinions, and explained a conflict fairly.",
          es: "Confirmaste datos con más de una fuente, citaste opiniones como opiniones y explicaste un conflicto de forma justa.",
        },
      },
    ],
  },
};

const numbers = {
  id: "by-the-numbers",
  title: { en: "Replant Day by the Numbers", es: "El Día de Replantar en números" },
  goal: {
    en: "Read a data table and write accurate sentences about what it shows.",
    es: "Leer una tabla de datos y escribir oraciones exactas sobre lo que muestra.",
  },
  keyUse: "Inform",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-park", "char-reporter", "char-kai"],
        speaker: "Dev Anand",
        text: {
          en: "Good news follows the storm! On Saturday, the school held Replant Day. Families planted young trees around the campus. The organizers gave us a table of numbers. Let's turn numbers into news.",
          es: "¡Después de la tormenta llegan buenas noticias! El sábado, la escuela celebró el Día de Replantar. Las familias plantaron árboles jóvenes alrededor de la escuela. Los organizadores nos dieron una tabla de números. Vamos a convertir los números en noticias.",
        },
      },
      {
        kind: "read",
        title: { en: "Replant Day Results", es: "Resultados del Día de Replantar" },
        text: {
          en: "Replant Day, Saturday. Trees planted by each group: Grade 3 families planted 6 trees. Grade 4 families planted 9 trees. Grade 5 families planted 12 trees. Teachers and staff planted 3 trees. In all, 30 trees were planted. 75 volunteers came to help. The trees were small red maples and white oaks. The garden club says each young tree needs about two buckets of water every week for its first summer.",
        },
        glossary: [
          {
            word: "volunteers",
            en: "people who help without being paid",
            es: "voluntarios; personas que ayudan sin recibir pago",
          },
          {
            word: "maples",
            en: "a kind of tree with pointed leaves",
            es: "arces; un tipo de árbol con hojas en punta",
          },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Which sentence matches the table?",
          es: "¿Qué oración coincide con la tabla?",
        },
        options: [
          {
            text: { en: "Grade 5 families planted the most trees, 12." },
            correct: true,
            feedback: {
              en: "Correct! 12 is more than 9, 6 or 3.",
              es: "¡Correcto! 12 es más que 9, 6 o 3.",
            },
          },
          {
            text: { en: "Teachers planted the most trees." },
            correct: false,
            feedback: {
              en: "Find the teachers' number in the table and compare it to each grade's number.",
              es: "Busca el número de los maestros en la tabla y compáralo con el número de cada grado.",
            },
          },
          {
            text: { en: "75 trees were planted." },
            correct: false,
            feedback: {
              en: "75 is in the table, but it counts something else. Read the words next to 75.",
              es: "75 está en la tabla, pero cuenta otra cosa. Lee las palabras junto a 75.",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Put the groups in order from FEWEST trees to MOST trees.",
          es: "Ordena los grupos desde MENOS árboles hasta MÁS árboles.",
        },
        items: [
          { en: "Teachers and staff" },
          { en: "Grade 3 families" },
          { en: "Grade 4 families" },
          { en: "Grade 5 families" },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write two sentences for the Gazette that use numbers from the table. Tell what the table shows.",
          es: "Escribe dos oraciones para el Gazette con números de la tabla. Di lo que muestra la tabla.",
        },
        mode: "write",
        frames: [{ en: "The table shows that..." }, { en: "In all, ..." }],
        wordBank: ["the table shows", "trees", "volunteers", "most", "fewest", "in all", "planted"],
        check: {
          minWords: 18,
          needConnectors: ["evidence"],
          needWords: ["trees"],
          needAny: [["30", "12", "9", "6", "75"]],
        },
        model: {
          en: "The table shows that 75 volunteers planted 30 trees on Replant Day. Grade 5 families planted the most trees, with 12.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "Good news writers check every number and say what it counts.",
          es: "Los buenos periodistas revisan cada número y dicen qué cuenta.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-park", "char-reporter", "char-kai"],
        speaker: "Dev Anand",
        text: {
          en: "Two weeks after the oak fell, the community held Replant Day. The organizers sent us their data. Numbers make a story stronger, but only if we read them accurately and don't claim more than the data shows.",
          es: "Dos semanas después de que cayó el roble, la comunidad organizó el Día de Replantar. Los organizadores nos enviaron sus datos. Los números hacen más fuerte una noticia, pero solo si los leemos con exactitud y no afirmamos más de lo que muestran.",
        },
      },
      {
        kind: "read",
        title: { en: "Replant Day Data", es: "Datos del Día de Replantar" },
        text: {
          en: "Replant Day, Cedar Grove campus. Group, volunteers, trees planted: Grade 6 families, 22 volunteers, 10 trees. Grade 7 families, 18 volunteers, 12 trees. Grade 8 families, 25 volunteers, 14 trees. Neighbors from Maple Avenue, 15 volunteers, 4 trees. Staff, 10 volunteers, 0 trees; staff ran the water and tool stations. Totals: 90 volunteers, 40 trees. Species planted: 24 red maples, 16 white oaks. Note from the garden club: a young tree needs roughly 10 gallons of water per week during its first summer, so volunteers are still needed for a watering schedule. White oaks grow slowly; one may take several decades to reach the size of the tree that fell. Organizers chose a mix of species so that one disease or pest cannot harm every tree on campus at once.",
        },
        glossary: [
          { word: "species", en: "a kind of living thing", es: "especie; un tipo de ser vivo" },
          { word: "roughly", en: "about; not exactly", es: "aproximadamente" },
          { word: "decades", en: "periods of ten years", es: "décadas; periodos de diez años" },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "A classmate wrote: “Grade 8 was the hardest-working group.” What's the problem?",
          es: "Un compañero escribió: «El grado 8 fue el grupo que más trabajó». ¿Cuál es el problema?",
        },
        options: [
          {
            text: {
              en: "“Hardest-working” is a judgment the data can't prove; the data only shows Grade 8 planted the most trees (14).",
            },
            correct: true,
            feedback: {
              en: "Right. Staff planted zero trees but ran the water stations. Trees planted doesn't measure effort.",
              es: "Correcto. El personal plantó cero árboles pero atendió las estaciones de agua. Los árboles plantados no miden el esfuerzo.",
            },
          },
          {
            text: { en: "Grade 8 didn't plant the most trees." },
            correct: false,
            feedback: {
              en: "Check the numbers again: compare 10, 12, 14 and 4. Then ask whether the sentence is really about trees.",
              es: "Revisa los números otra vez: compara 10, 12, 14 y 4. Luego pregúntate si la oración realmente habla de árboles.",
            },
          },
          {
            text: { en: "There's no problem; it's a fact." },
            correct: false,
            feedback: {
              en: "Could anyone measure “hardest-working” from this table? Think about the staff row.",
              es: "¿Alguien podría medir «el que más trabajó» con esta tabla? Piensa en la fila del personal.",
            },
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Pick the accurate conclusions you could print.",
          es: "Elige las conclusiones exactas que podrías publicar.",
        },
        clues: [
          {
            id: "total",
            text: { en: "90 volunteers planted 40 trees." },
            relevant: true,
            why: { en: "These are the table's totals.", es: "Son los totales de la tabla." },
          },
          {
            id: "maples",
            text: { en: "More red maples than white oaks were planted (24 vs. 16)." },
            relevant: true,
            why: {
              en: "Directly comparable numbers from the species row.",
              es: "Números que se comparan directamente en la fila de especies.",
            },
          },
          {
            id: "water",
            text: {
              en: "Each young tree needs about 10 gallons of water a week in its first summer.",
            },
            relevant: true,
            why: {
              en: "A fact from the garden club, which you would credit to them.",
              es: "Un dato del club de jardinería, que mencionarías como fuente.",
            },
          },
          {
            id: "neighbors",
            text: { en: "Neighbors didn't care about Replant Day." },
            relevant: false,
            why: {
              en: "15 neighbors came. The data can't tell us how anyone felt.",
              es: "Vinieron 15 vecinos. Los datos no dicen lo que sintió nadie.",
            },
          },
          {
            id: "replace",
            text: { en: "The new oaks will replace the old tree in a few years." },
            relevant: false,
            why: {
              en: "The note says white oaks take several decades, not a few years.",
              es: "La nota dice que los robles blancos tardan varias décadas, no pocos años.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "respond",
        prompt: {
          en: "Write a data paragraph for the Gazette. Use at least three numbers from the table, credit your source, and include one sentence that explains what the numbers mean for the school.",
          es: "Escribe un párrafo con datos para el Gazette. Usa al menos tres números de la tabla, menciona la fuente e incluye una oración que explique lo que significan los números para la escuela.",
        },
        mode: "write",
        frames: [
          { en: "According to the organizers, ..." },
          { en: "The data show that..." },
          { en: "This means..." },
        ],
        wordBank: [
          "according to",
          "the data show",
          "volunteers",
          "species",
          "roughly",
          "watering schedule",
          "this means",
        ],
        check: {
          minWords: 45,
          needConnectors: ["evidence"],
          needWords: ["trees"],
          needAny: [
            ["90", "40", "24", "16", "14"],
            ["water", "watering", "decades", "volunteers"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "According to the organizers, 90 volunteers planted 40 trees on Replant Day, including 24 red maples and 16 white oaks. Grade 8 families planted the most, with 14. The data show that the work is not finished, because the garden club says each young tree needs roughly 10 gallons of water a week. This means the school still needs volunteers for a summer watering schedule.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You read a table accurately, rejected claims the data can't support, and explained what the numbers mean.",
          es: "Leíste una tabla con exactitud, rechazaste afirmaciones que los datos no apoyan y explicaste lo que significan los números.",
        },
      },
    ],
  },
};

const article = {
  id: "front-page",
  title: { en: "Final Demonstration: The Front Page", es: "Demostración final: La primera plana" },
  goal: {
    en: "Write a short news article with a strong lead, facts, a quote from a source and a closing.",
    es: "Escribir un artículo corto con una buena entrada, datos, una cita de una fuente y un cierre.",
  },
  keyUse: "Inform",
  domains: ["Listening", "Reading", "Writing"],
  final: true,
  book: {
    templateId: "informational-report",
    title: { en: "The Cedar Gazette: Special Edition", es: "The Cedar Gazette: Edición especial" },
  },
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter", "obj-newspaper"],
        speaker: "Dev Anand",
        text: {
          en: "It's time to write the front page! You have facts, numbers and witnesses. One more thing: a quote. You will interview Ms. Ahmed, the school custodian.",
          es: "¡Es hora de escribir la primera plana! Tienes datos, números y testigos. Falta una cosa: una cita. Vas a entrevistar a la señora Ahmed, la conserje de la escuela.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "I have worked here for twenty years, and that oak was here before me. Kids used to eat lunch in its shade. When I saw it on the bus shelter, I felt sad. But on Replant Day, I saw so many families with shovels. I said to myself, these new trees will shade kids who aren't even born yet.",
        },
        transcriptLabel: { en: "Interview with Ms. Ahmed", es: "Entrevista con la señora Ahmed" },
      },
      {
        kind: "choice",
        prompt: {
          en: "Which is the best lead, the first sentence of the article?",
          es: "¿Cuál es la mejor entrada, la primera oración del artículo?",
        },
        options: [
          {
            text: {
              en: "A windstorm knocked down the old oak at Cedar Grove, but 30 new trees are growing in its place.",
            },
            correct: true,
            feedback: {
              en: "Great lead! It tells the big news fast and makes readers want to know more.",
              es: "¡Muy buena entrada! Cuenta la gran noticia rápido y hace que los lectores quieran saber más.",
            },
          },
          {
            text: { en: "This is my article about a tree." },
            correct: false,
            feedback: {
              en: "This tells what the article is, not what happened. A lead gives the most important news first.",
              es: "Esto dice qué es el artículo, no qué pasó. Una entrada da primero la noticia más importante.",
            },
          },
          {
            text: { en: "Trees are plants that grow in many places." },
            correct: false,
            feedback: {
              en: "This is true, but it is not news. Which choice tells what happened at Cedar Grove?",
              es: "Es cierto, pero no es noticia. ¿Qué opción dice lo que pasó en Cedar Grove?",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Put the parts of a news article in order.",
          es: "Ordena las partes de un artículo de noticias.",
        },
        items: [
          { en: "Lead: the most important news" },
          { en: "Facts: who, what, when, where" },
          { en: "Quote: what a source said" },
          { en: "Closing: what happens next" },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration! Write a short news article. Start with a lead, give facts and one number, include a quote from Ms. Ahmed in quotation marks, and end with what happens next.",
          es: "¡Tu demostración final! Escribe un artículo corto. Empieza con una entrada, da datos y un número, incluye una cita de la señora Ahmed entre comillas y termina con lo que pasará después.",
        },
        mode: "write",
        frames: [
          { en: "Lead: ..." },
          { en: "Ms. Ahmed, the school custodian, said, “...”" },
          { en: "Next, ..." },
        ],
        wordBank: [
          "windstorm",
          "oak",
          "bus shelter",
          "Replant Day",
          "volunteers",
          "said",
          "shade",
          "next",
        ],
        check: {
          minWords: 45,
          needWords: ["said"],
          needAny: [
            ["oak", "tree"],
            ["30", "75", "10:40"],
            ["next", "will", "summer"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "A windstorm knocked down the old oak at Cedar Grove, but 30 new trees are growing in its place. The oak fell onto the bus shelter at 10:40 p.m., and nobody was hurt. On Saturday, 75 volunteers came to Replant Day. Ms. Ahmed, the school custodian, said, “These new trees will shade kids who aren't even born yet.” Next, the garden club will need helpers to water the trees this summer.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-newsroom", "char-reporter", "obj-newspaper"],
        speaker: "Dev Anand",
        text: {
          en: "Front page, special edition. You have confirmed facts, a data table and two eyewitnesses. What's missing is a voice. Kai recorded an interview with Ms. Ahmed, the custodian who has worked at Cedar Grove for twenty years. Choose your quote carefully: it should add something facts can't.",
          es: "Primera plana, edición especial. Tienes datos confirmados, una tabla de datos y dos testigos. Lo que falta es una voz. Kai grabó una entrevista con la señora Ahmed, la conserje que lleva veinte años en Cedar Grove. Elige tu cita con cuidado: debe aportar algo que los datos no pueden.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "When I started here twenty years ago, that oak was already the biggest thing on campus. Generations of kids ate lunch under it. The morning after the storm, I stood by the crushed shelter and honestly, I didn't know what to say. Then Replant Day came, and I counted the shovels. Ninety people showed up. I told the principal, we didn't lose a tree, we gained a forest. Of course, a forest only grows if somebody waters it, so I hope students sign up this summer.",
        },
        transcriptLabel: { en: "Interview with Ms. Ahmed", es: "Entrevista con la señora Ahmed" },
      },
      {
        kind: "choice",
        prompt: {
          en: "Which lead is strongest for the front page?",
          es: "¿Cuál entrada es la más fuerte para la primera plana?",
        },
        options: [
          {
            text: {
              en: "Two weeks after a windstorm toppled Cedar Grove's century-old oak, 90 volunteers planted 40 young trees to take its place.",
            },
            correct: true,
            feedback: {
              en: "Strong lead: it covers what, when and who in one sentence and connects the loss to the response.",
              es: "Entrada fuerte: cubre qué, cuándo y quién en una oración y une la pérdida con la respuesta.",
            },
          },
          {
            text: { en: "On a dark and stormy night, something terrible happened." },
            correct: false,
            feedback: {
              en: "This sounds like a story opening, not news. It hides the facts. Which lead answers the most 5W1H questions?",
              es: "Esto suena al comienzo de un cuento, no a una noticia. Esconde los datos. ¿Qué entrada responde más preguntas 5W1H?",
            },
          },
          {
            text: { en: "Many people have opinions about the oak tree that fell." },
            correct: false,
            feedback: {
              en: "This is vague and focuses on opinions. A news lead starts with the most important confirmed facts.",
              es: "Esto es vago y se enfoca en opiniones. Una entrada de noticia empieza con los datos confirmados más importantes.",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Arrange the article in “inverted pyramid” order, from most to least important.",
          es: "Ordena el artículo en forma de «pirámide invertida», de lo más importante a lo menos importante.",
        },
        items: [
          { en: "Lead: the tree fell; the community replanted" },
          { en: "Confirmed details: time, damage, no injuries" },
          { en: "Data: volunteers, trees, species" },
          { en: "Quote from Ms. Ahmed" },
          { en: "Closing: the watering schedule still needs volunteers" },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration. Write a news article of 90 to 150 words: a lead that answers several 5W1H questions, confirmed facts with sources, at least two numbers, a direct quote from Ms. Ahmed, and a closing about what happens next. Keep your own opinion out of it.",
          es: "Tu demostración final. Escribe un artículo de 90 a 150 palabras: una entrada que responda varias preguntas 5W1H, datos confirmados con sus fuentes, al menos dos números, una cita directa de la señora Ahmed y un cierre sobre lo que viene. No incluyas tu propia opinión.",
        },
        mode: "write",
        frames: [
          { en: "Two weeks after..." },
          { en: "According to..." },
          { en: "“...,” said Ms. Ahmed, ..." },
        ],
        wordBank: [
          "toppled",
          "century-old",
          "time-stamped",
          "according to",
          "volunteers",
          "species",
          "watering schedule",
        ],
        check: {
          minWords: 90,
          needConnectors: ["evidence"],
          needWords: ["said"],
          needAny: [
            ["oak", "tree"],
            ["90", "40", "10:40", "24", "16"],
            ["water", "watering", "summer", "next"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "Two weeks after a windstorm toppled Cedar Grove's century-old oak, 90 volunteers planted 40 young trees to take its place. According to a time-stamped security camera, the oak fell at 10:40 p.m. and landed across the bus shelter. No one was injured, and the school building was not damaged. On Replant Day, families, neighbors and staff planted 24 red maples and 16 white oaks. “We didn't lose a tree, we gained a forest,” said Ms. Ahmed, who has worked as the school custodian for twenty years. The work is not over. According to the garden club, each young tree needs roughly 10 gallons of water a week this summer, and organizers are looking for student volunteers to sign up.",
        },
      },
    ],
  },
};

export default {
  id: "newsroom-studio",
  title: { en: "Newsroom Studio", es: "Estudio de Noticias" },
  tagline: {
    en: "Get the facts, check the sources, write the story.",
    es: "Consigue los datos, revisa las fuentes, escribe la noticia.",
  },
  theme: {
    bg: "bg-newsroom",
    accent: "#b4432a",
    soft: "#fbeae4",
    ink: "#6a2414",
    hero: ["char-reporter", "char-kai"],
  },
  intro: {
    en: "You are the newest reporter at The Cedar Gazette, your school's student newspaper. A storm just knocked down the oldest tree on campus, and the community wants the real story. Editor Dev Anand will help you find facts, check sources and write the front page.",
    es: "Eres el reportero más nuevo de The Cedar Gazette, el periódico estudiantil de tu escuela. Una tormenta acaba de tumbar el árbol más viejo de la escuela, y la comunidad quiere la historia verdadera. El editor Dev Anand te ayudará a encontrar datos, revisar fuentes y escribir la primera plana.",
  },
  guide: { name: "Dev Anand", art: "char-reporter" },
  missions: [breaking, witnesses, numbers, article],
};
