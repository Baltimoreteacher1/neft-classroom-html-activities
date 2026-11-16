// Culture & Communication Explorer, grades 6-8, scenarios 5-8. See communication-68a.js and src/content/communication.js.

export const SCENARIOS_68B = [
  {
    id: "refill-station-68",
    band: "6-8",
    theme: "digital",
    emoji: "💬",
    title: ["Group chat or email to the principal?", "¿Chat de grupo o correo a la directora?"],
    situation: [
      "The Student Council wants a water bottle refill station near the gym, because the old fountains often break. You are writing to the principal, Dr. Hassan. You will also post about it in your class group chat.",
      "El Consejo Estudiantil quiere una estación para rellenar botellas de agua cerca del gimnasio, porque las fuentes viejas se rompen a menudo. Le escribes a la directora, Dr. Hassan. También lo publicarás en el chat de grupo de tu clase.",
    ],
    card: {
      audience: ["Dr. Hassan, the principal", "Dr. Hassan, la directora"],
      purpose: ["Propose an idea and ask for a meeting", "Proponer una idea y pedir una reunión"],
      setting: ["School email", "Correo de la escuela"],
      relationship: [
        "Principal and student representative",
        "Directora y representante estudiantil",
      ],
      register: "formal",
      medium: ["Email", "Correo electrónico"],
    },
    versions: [
      {
        id: "a",
        text: "hey Dr. Hassan can we get water bottle stations?? the fountains r gross 😬",
        why: [
          "Dr. Hassan does not learn who is writing or what you want her to do next. “r”, “??” and the emoji fit a chat more than a proposal.",
          "Dr. Hassan no sabe quién escribe ni qué quieres que haga después. «r», «??» y el emoji encajan más en un chat que en una propuesta.",
        ],
        when: [
          "This fits the class group chat, where short spellings and emoji are a normal, friendly way to talk.",
          "Esto encaja en el chat de grupo de la clase, donde las abreviaturas y los emoji son una forma normal y amistosa de hablar.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Dear Dr. Hassan,\nI am a seventh grader on the Student Council. Many students have told us that the water fountains near the gym are often broken. We would like to propose adding a bottle refill station. Would you be willing to meet with us next week to discuss it?\nThank you for your time.\nRespectfully,\nMarcus Lee",
        why: [
          "It introduces the writer, states the problem and the proposal, and ends with a specific request and a formal closing.",
          "Presenta a quien escribe, explica el problema y la propuesta, y termina con una petición concreta y una despedida formal.",
        ],
      },
      {
        id: "c",
        text: "Dear Dr. Hassan,\nWater is very important for the human body. Scientists say people should drink about eight cups a day. Water helps the brain and the muscles. It also keeps people cool when it is hot.",
        why: [
          "It is formal and true, but Dr. Hassan reads a whole paragraph and still does not know what you are asking for.",
          "Es formal y cierto, pero Dr. Hassan lee un párrafo entero y todavía no sabe qué estás pidiendo.",
        ],
        when: [
          "Background facts like these fit the opening of a science report about the human body.",
          "Datos de fondo como estos encajan al comienzo de un informe de ciencias sobre el cuerpo humano.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you shared the idea in your class group chat to get support?",
        "¿Y si compartieras la idea en el chat de grupo de tu clase para conseguir apoyo?",
      ],
      items: [
        {
          part: ["The greeting and closing", "El saludo y la despedida"],
          changes: true,
          why: [
            "A group chat rarely uses “Dear” or “Respectfully”.",
            "En un chat de grupo casi nunca se usa «Dear» ni «Respectfully».",
          ],
        },
        {
          part: ["The main idea: a refill station", "La idea principal: una estación de relleno"],
          changes: false,
          why: [
            "Your idea is the same for both audiences.",
            "Tu idea es la misma para las dos audiencias.",
          ],
        },
        {
          part: ["Emoji and short spellings", "Los emoji y las abreviaturas"],
          changes: true,
          why: [
            "They can fit the chat and help show your mood.",
            "Pueden encajar en el chat y ayudan a mostrar tu estado de ánimo.",
          ],
        },
        {
          part: ["Asking people to do something", "Pedirle a la gente que haga algo"],
          changes: false,
          why: [
            "Both messages need a clear ask, such as “Reply by Friday if you'll sign the petition.”",
            "Los dos mensajes necesitan una petición clara, como «Reply by Friday if you'll sign the petition.»",
          ],
        },
      ],
    },
    reflect: [
      "Do you write differently in different apps or languages: texts, voice notes, video calls with family far away? What rules do you follow in each one, even if no one ever taught them to you?",
      "¿Escribes de forma diferente en distintas aplicaciones o idiomas: mensajes, notas de voz, videollamadas con familia lejana? ¿Qué reglas sigues en cada uno, aunque nadie te las haya enseñado?",
    ],
    task: {
      prompt: [
        "Write an email to Dr. Hassan asking to start a lunchtime language exchange club, where students teach each other words from the languages they speak. Explain the purpose, make a clear request, and close formally.",
        "Escribe un correo a Dr. Hassan para pedir empezar un club de intercambio de idiomas a la hora del almuerzo, donde los estudiantes se enseñen palabras de los idiomas que hablan. Explica el propósito, haz una petición clara y despídete de manera formal.",
      ],
      register: "formal",
      medium: "email",
      needs: ["greeting", "purpose", "reason", "request", "closing", "casual"],
      purposeWords: ["club", "language", "languages", "lunch", "exchange"],
      minWords: 40,
      frames: [
        "Dear Dr. ___,",
        "I am a ___ grader, and I would like to propose ___.",
        "This club would help students ___ because ___.",
        "Would you be willing to ___?",
        "Respectfully, ___",
      ],
      words: [
        { w: "propose", es: "proponer" },
        { w: "language exchange", es: "intercambio de idiomas" },
        { w: "This would help …", es: "Esto ayudaría a …" },
        { w: "Would you be willing to …?", es: "¿Estaría dispuesta a …?" },
        { w: "supervise", es: "supervisar" },
        { w: "Respectfully,", es: "Respetuosamente," },
      ],
      model:
        "Dear Dr. Hassan,\nI am an eighth grader, and I would like to propose a lunchtime language exchange club. Students in our school speak many languages, and this club would help us learn from each other because we could teach words and phrases we use at home. Would you be willing to let us meet in Room 112 on Wednesdays?\nThank you for considering this idea.\nRespectfully,\nAmina Diallo",
    },
  },
  {
    id: "judge-or-sister-68",
    band: "6-8",
    theme: "audiences",
    emoji: "🌱",
    title: ["One idea, two listeners: photosynthesis", "Una idea, dos oyentes: la fotosíntesis"],
    situation: [
      "Your science fair project tested how the amount of light affects photosynthesis. A judge asks you to explain your results. That night, your 6-year-old sister asks what your project was about.",
      "Tu proyecto de la feria de ciencias puso a prueba cómo la cantidad de luz afecta la fotosíntesis. Un juez te pide que expliques tus resultados. Esa noche, tu hermana de 6 años te pregunta de qué trataba tu proyecto.",
    ],
    card: {
      audience: ["A science fair judge", "Un juez de la feria de ciencias"],
      purpose: [
        "Explain your method and results precisely",
        "Explicar tu método y tus resultados con precisión",
      ],
      setting: ["The science fair", "La feria de ciencias"],
      relationship: ["Judge and student scientist", "Juez y estudiante científico"],
      register: "formal",
      medium: ["Talking face to face, with a poster", "Hablar en persona, con un cartel"],
    },
    versions: [
      {
        id: "a",
        text: "Plants basically eat sunlight. It's like they have tiny solar panels in their leaves!",
        why: [
          "The comparison is memorable, but a judge wants to hear what you tested, the science words, and your results.",
          "La comparación es fácil de recordar, pero un juez quiere oír qué pusiste a prueba, las palabras científicas y tus resultados.",
        ],
        when: [
          "This fits your little sister: one picture-like comparison she can understand right away.",
          "Esto encaja con tu hermanita: una comparación como un dibujo que entiende enseguida.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Our project tested how light affects photosynthesis. Plants use light energy to convert carbon dioxide and water into glucose and oxygen. In our trials, the plants with more light produced more oxygen bubbles.",
        why: [
          "It names the question, explains the process with precise words, and gives evidence from the trials.",
          "Nombra la pregunta, explica el proceso con palabras precisas y da evidencia de las pruebas.",
        ],
      },
      {
        id: "c",
        text: "So yeah, plants, like, need light and stuff, and we did a thing with bubbles.",
        why: [
          "A judge cannot tell what you tested or found. “And stuff” and “a thing” leave out the science.",
          "Un juez no puede saber qué pusiste a prueba ni qué encontraste. «And stuff» y «a thing» dejan fuera la ciencia.",
        ],
        when: [
          "Relaxed talk like this fits a friend who already watched you do the experiment.",
          "Una charla relajada así encaja con un amigo que ya te vio hacer el experimento.",
        ],
      },
    ],
    shift: {
      change: [
        "What if your listener were your 6-year-old sister?",
        "¿Y si quien te escucha fuera tu hermana de 6 años?",
      ],
      items: [
        {
          part: [
            "Words like “glucose” and “carbon dioxide”",
            "Palabras como «glucose» y «carbon dioxide»",
          ],
          changes: true,
          why: [
            "Use everyday words such as “sugar” and “air”, or explain each science word.",
            "Usa palabras cotidianas como «sugar» y «air», o explica cada palabra científica.",
          ],
        },
        {
          part: ["Being accurate", "Ser exacto"],
          changes: false,
          why: [
            "Simpler words still need to be true.",
            "Las palabras más sencillas tienen que seguir siendo ciertas.",
          ],
        },
        {
          part: [
            "A comparison like “tiny solar panels”",
            "Una comparación como «tiny solar panels»",
          ],
          changes: true,
          why: [
            "A picture-like comparison helps a young listener.",
            "Una comparación como un dibujo ayuda a alguien pequeño.",
          ],
        },
        {
          part: ["Numbers from every trial", "Los números de cada prueba"],
          changes: true,
          why: [
            "Your sister needs the big idea, not every data point.",
            "Tu hermana necesita la idea principal, no cada dato.",
          ],
        },
      ],
    },
    reflect: [
      "How do you explain school ideas at home? Do you ever switch languages or mix them to explain something? What helps your listener the most?",
      "¿Cómo explicas en casa las ideas de la escuela? ¿Alguna vez cambias de idioma o los mezclas para explicar algo? ¿Qué ayuda más a quien te escucha?",
    ],
    task: {
      prompt: [
        "You tested which paper towel brand absorbs the most water. Explain your project to a science fair judge: what you tested, what you found, and one piece of evidence.",
        "Pusiste a prueba qué marca de toallas de papel absorbe más agua. Explícale tu proyecto a un juez de la feria de ciencias: qué pusiste a prueba, qué encontraste y una evidencia.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["purpose", "academic", "reason", "casual"],
      purposeWords: ["paper towel", "towel", "absorb", "absorbs", "water"],
      academicWords: [
        "tested",
        "variable",
        "results",
        "evidence",
        "data",
        "measured",
        "trial",
        "trials",
        "conclusion",
        "milliliters",
      ],
      minAcademic: 2,
      minWords: 35,
      frames: [
        "Our project tested ___.",
        "We measured ___ in ___ trials.",
        "Our results show that ___ because ___.",
        "For example, ___.",
      ],
      words: [
        { w: "tested", es: "puso a prueba" },
        { w: "measured", es: "midió" },
        { w: "trial", es: "prueba" },
        { w: "results", es: "resultados" },
        { w: "evidence", es: "evidencia" },
        { w: "absorbs", es: "absorbe" },
      ],
      model:
        "Our project tested which paper towel brand absorbs the most water. We measured how many milliliters each towel held in three trials. Our results show that Brand B absorbs the most, because it held 42 milliliters on average. Brand A held only 30 milliliters.",
    },
  },
  {
    id: "phone-policy-68",
    band: "6-8",
    theme: "perspectives",
    emoji: "📱",
    title: ["One issue, many perspectives", "Un tema, muchos puntos de vista"],
    situation: [
      "Your school is thinking about banning phones for the whole school day. In a class discussion, you are asked to summarize the views of teachers, families and students fairly before anyone argues a side.",
      "Tu escuela está pensando en prohibir los teléfonos durante todo el día escolar. En una discusión de clase, te piden que resumas con justicia los puntos de vista de maestros, familias y estudiantes antes de que alguien defienda una postura.",
    ],
    card: {
      audience: ["Your class and teacher", "Tu clase y tu maestro"],
      purpose: [
        "Summarize several perspectives fairly",
        "Resumir varios puntos de vista con justicia",
      ],
      setting: ["A class discussion", "Una discusión en clase"],
      relationship: ["Classmates and teacher", "Compañeros y maestro"],
      register: "neutral",
      medium: ["Speaking to the whole class", "Hablar a toda la clase"],
    },
    versions: [
      {
        id: "a",
        text: "Everyone knows phones are bad for kids. The ban is obviously right.",
        why: [
          "You were asked to summarize fairly. “Everyone knows” and “obviously” skip over the people who see it differently.",
          "Te pidieron resumir con justicia. «Everyone knows» y «obviously» pasan por alto a las personas que lo ven de otra manera.",
        ],
        when: [
          "Arguing one side fits a persuasive essay or debate, as long as you support your claim with evidence.",
          "Defender una postura encaja en un ensayo persuasivo o un debate, siempre que apoyes tu afirmación con evidencia.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Teachers want fewer distractions so students can focus. Some families want to reach their kids after school for safety. Students use phones for calendars and rides. A fair policy might allow phones only before and after school.",
        why: [
          "It gives each group's view with its reason, without judging, and then offers an idea that responds to all three.",
          "Da el punto de vista de cada grupo con su razón, sin juzgar, y después ofrece una idea que responde a los tres.",
        ],
      },
      {
        id: "c",
        text: "Some people like phones and some don't.",
        why: [
          "It is fair, but it hides who thinks what and why, so the class cannot discuss the reasons.",
          "Es justo, pero esconde quién piensa qué y por qué, así que la clase no puede hablar de las razones.",
        ],
        when: [
          "A one-line overview fits as a quick opener right before a detailed discussion.",
          "Un resumen de una línea encaja como inicio rápido justo antes de una discusión detallada.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were presenting this summary to families at a school meeting, with interpreters for several languages?",
        "¿Y si presentaras este resumen a las familias en una reunión escolar, con intérpretes para varios idiomas?",
      ],
      items: [
        {
          part: ["Short, clear sentences", "Oraciones cortas y claras"],
          changes: true,
          why: [
            "Short sentences give interpreters time and make each idea easier to follow.",
            "Las oraciones cortas les dan tiempo a los intérpretes y hacen que cada idea sea más fácil de seguir.",
          ],
        },
        {
          part: ["The perspectives you include", "Los puntos de vista que incluyes"],
          changes: false,
          why: [
            "A fair summary includes the same views for any audience.",
            "Un resumen justo incluye los mismos puntos de vista para cualquier audiencia.",
          ],
        },
        {
          part: ["School words and nicknames", "Palabras y apodos de la escuela"],
          changes: true,
          why: [
            "Explain or skip school-only words, like the name of a class period or a points system.",
            "Explica u omite palabras que solo se usan en la escuela, como el nombre de un período o de un sistema de puntos.",
          ],
        },
        {
          part: ["Being fair to each group", "Ser justo con cada grupo"],
          changes: false,
          why: ["Fairness fits every audience.", "Ser justo encaja con cualquier audiencia."],
        },
      ],
    },
    reflect: [
      "Think of an issue that your family and your school, or two communities you belong to, see differently. What values might be behind each view? How would you explain one side in a language you use at home?",
      "Piensa en un tema que tu familia y tu escuela, o dos comunidades a las que perteneces, ven de forma diferente. ¿Qué valores podrían estar detrás de cada punto de vista? ¿Cómo explicarías una postura en un idioma que usas en casa?",
    ],
    task: {
      prompt: [
        "Your city wants to turn a park's basketball court into a parking lot. Write a short paragraph that explains at least two perspectives fairly and suggests a compromise.",
        "Tu ciudad quiere convertir la cancha de básquetbol de un parque en un estacionamiento. Escribe un párrafo corto que explique con justicia al menos dos puntos de vista y sugiera un acuerdo intermedio.",
      ],
      register: "neutral",
      medium: "paragraph",
      needs: ["purpose", "perspective", "reason", "suggest"],
      purposeWords: ["park", "court", "basketball", "parking"],
      minWords: 40,
      frames: [
        "Some people want ___ because ___.",
        "Others worry that ___.",
        "On the other hand, ___.",
        "A compromise could be ___.",
      ],
      words: [
        { w: "perspective", es: "punto de vista" },
        { w: "Others worry that …", es: "A otros les preocupa que …" },
        { w: "On the other hand, …", es: "Por otro lado, …" },
        { w: "compromise", es: "acuerdo intermedio" },
        { w: "residents", es: "residentes" },
        { w: "both", es: "ambos" },
      ],
      model:
        "Some shop owners want a parking lot because customers have nowhere to park. On the other hand, many teenagers worry that they will lose the only free basketball court nearby. Families also want a safe place for kids to play. A compromise could be to build a small parking lot on the empty grass and keep the court.",
    },
  },
  {
    id: "fine-text-68",
    band: "6-8",
    theme: "misunderstanding",
    emoji: "💡",
    title: ["A message read the wrong way", "Un mensaje que se entendió mal"],
    situation: [
      "Your friend Theo texted: “Can we go Saturday instead of Friday?” You were busy and replied “fine.” Now Theo thinks you are angry. You are not; you are happy to go Saturday.",
      "Tu amigo Theo te escribió: «Can we go Saturday instead of Friday?». Estabas ocupado y respondiste «fine.». Ahora Theo cree que estás enojado. No lo estás; te alegra ir el sábado.",
    ],
    card: {
      audience: ["Your friend Theo", "Tu amigo Theo"],
      purpose: ["Clear up how your message came across", "Aclarar cómo se entendió tu mensaje"],
      setting: ["Texting", "Mensajes de texto"],
      relationship: ["Close friends", "Amigos cercanos"],
      register: "informal",
      medium: ["Text message", "Mensaje de texto"],
    },
    versions: [
      {
        id: "a",
        text: "Why are you being so sensitive?",
        why: [
          "It puts the problem on Theo instead of fixing the message, and he still does not know you are okay with Saturday.",
          "Le echa el problema a Theo en vez de arreglar el mensaje, y él todavía no sabe que te parece bien el sábado.",
        ],
        when: [
          "A direct question can fit friends who have agreed to be blunt with each other, but even then, tone is hard to read in a text.",
          "Una pregunta directa puede encajar entre amigos que acordaron ser francos, pero aun así el tono es difícil de leer en un mensaje.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Hey, I think my “fine.” came across wrong! I'm really okay with Saturday. I was just busy when I replied. Still excited to go 🙂",
        why: [
          "It names what went wrong, says what you meant, explains why it happened, and the emoji adds the friendly tone the first text was missing.",
          "Nombra lo que salió mal, dice lo que querías decir, explica por qué pasó, y el emoji agrega el tono amistoso que le faltaba al primer mensaje.",
        ],
      },
      {
        id: "c",
        text: "OK.",
        why: [
          "A one-word reply with a period is what caused the misunderstanding. It does not tell Theo how you feel.",
          "Una respuesta de una palabra con punto fue lo que causó el malentendido. No le dice a Theo cómo te sientes.",
        ],
        when: [
          "“OK.” fits when someone only needs a quick yes, like confirming a time, and there are no feelings to sort out.",
          "«OK.» encaja cuando alguien solo necesita un sí rápido, como confirmar una hora, y no hay sentimientos que aclarar.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were clearing this up face to face instead of by text?",
        "¿Y si aclararas esto en persona en vez de por mensaje?",
      ],
      items: [
        {
          part: ["The emoji", "El emoji"],
          changes: true,
          why: [
            "In person, your face and voice show the friendly tone.",
            "En persona, tu cara y tu voz muestran el tono amistoso.",
          ],
        },
        {
          part: ["Saying what you really meant", "Decir lo que de verdad querías decir"],
          changes: false,
          why: [
            "Clear words fix misunderstandings in any medium.",
            "Las palabras claras arreglan malentendidos en cualquier medio.",
          ],
        },
        {
          part: ["Planning every word first", "Planear cada palabra primero"],
          changes: true,
          why: [
            "In person, Theo can ask questions right away, so it can be more of a back-and-forth.",
            "En persona, Theo puede hacer preguntas enseguida, así que puede ser más un ir y venir.",
          ],
        },
        {
          part: [
            "Admitting your message came across wrong",
            "Reconocer que tu mensaje se entendió mal",
          ],
          changes: false,
          why: [
            "Owning your part helps face to face and in a text.",
            "Reconocer tu parte ayuda en persona y por mensaje.",
          ],
        },
      ],
    },
    reflect: [
      "Have you ever been misunderstood because of a word, a joke, a tone, or a translation between languages? How did you fix it? What do people in your family or community do to repair a misunderstanding?",
      "¿Alguna vez te entendieron mal por una palabra, un chiste, un tono o una traducción entre idiomas? ¿Cómo lo arreglaste? ¿Qué hace la gente de tu familia o comunidad para arreglar un malentendido?",
    ],
    task: {
      prompt: [
        "In a group project, you commented “Your section needs work” on a teammate's slides, and she felt hurt. You meant you wanted to help her add sources. Write a message to clear up the misunderstanding.",
        "En un proyecto de grupo, comentaste «Your section needs work» en las diapositivas de una compañera, y ella se sintió herida. Querías decir que querías ayudarla a agregar fuentes. Escribe un mensaje para aclarar el malentendido.",
      ],
      register: "informal",
      medium: "text",
      needs: ["acknowledge", "purpose", "nextStep"],
      purposeWords: ["section", "sources", "source", "help", "slides", "comment"],
      minWords: 25,
      frames: [
        "I'm sorry my comment ___.",
        "What I meant was ___.",
        "Your section ___.",
        "Can we ___?",
      ],
      words: [
        { w: "came across", es: "se entendió" },
        { w: "What I meant was …", es: "Lo que quise decir fue …" },
        { w: "sources", es: "fuentes" },
        { w: "I'm sorry …", es: "Perdón …" },
        { w: "Can we …?", es: "¿Podemos …?" },
        { w: "together", es: "juntos" },
      ],
      model:
        "Hi Nadia, I'm sorry my comment came across so harsh. What I meant was that your section is strong, and I wanted to help you add two more sources. Can we look for them together at lunch tomorrow?",
    },
  },
];
