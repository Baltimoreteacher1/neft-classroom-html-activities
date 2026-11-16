// Culture & Communication Explorer, grades 3-5, scenarios 5-8. See communication-35a.js and src/content/communication.js.

export const SCENARIOS_35B = [
  {
    id: "garden-club-message-35",
    band: "3-5",
    theme: "digital",
    emoji: "📧",
    title: [
      "A text to a friend or an email to the principal?",
      "¿Un mensaje a un amigo o un correo al director?",
    ],
    situation: [
      "You want to start a garden club at lunch on Fridays. First you need to ask the principal, Principal Johnson, by email. Later you will text your friend Maya about it.",
      "Quieres empezar un club de jardinería a la hora del almuerzo los viernes. Primero tienes que preguntarle al director, Principal Johnson, por correo electrónico. Después le mandarás un mensaje a tu amiga Maya.",
    ],
    card: {
      audience: ["Principal Johnson", "El director Johnson"],
      purpose: ["Ask permission to start a club", "Pedir permiso para empezar un club"],
      setting: ["School email", "Correo de la escuela"],
      relationship: ["Principal and student", "Director y estudiante"],
      register: "formal",
      medium: ["Email", "Correo electrónico"],
    },
    versions: [
      {
        id: "a",
        text: "hey can we start garden club?? 🌱🌱",
        why: [
          "Principal Johnson may not know who wrote it, when the club would meet, or why. The emoji and “??” fit a chat more than an email to a principal.",
          "Es posible que el director Johnson no sepa quién lo escribió, cuándo se reuniría el club ni por qué. El emoji y «??» encajan más en un chat que en un correo a un director.",
        ],
        when: [
          "This fits a text to Maya. She knows you, and emoji are a friendly way to show feelings in a chat.",
          "Esto encaja en un mensaje a Maya. Ella te conoce, y los emoji son una forma amistosa de mostrar sentimientos en un chat.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Dear Principal Johnson,\nMy name is Sofia, and I am in Ms. Lee's 4th grade class. I would like to start a garden club at lunch on Fridays because many students want to grow vegetables. Could we meet to talk about it?\nThank you,\nSofia",
        why: [
          "It has a greeting, says who is writing, explains the idea and the reason, asks a clear question, and closes politely.",
          "Tiene saludo, dice quién escribe, explica la idea y la razón, hace una pregunta clara y se despide con cortesía.",
        ],
      },
      {
        id: "c",
        text: "Dear Principal Johnson,\nGarden club.\nSofia",
        why: [
          "The greeting and closing fit, but the middle is missing. He does not know what you are asking.",
          "El saludo y la despedida encajan, pero falta el centro. Él no sabe qué estás pidiendo.",
        ],
        when: [
          "A short label like “Garden club” can fit a sticky note for someone who already knows the whole plan.",
          "Una etiqueta corta como «Garden club» puede encajar en una nota adhesiva para alguien que ya conoce todo el plan.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you sent the same idea as a text to your friend Maya?",
        "¿Y si mandaras la misma idea en un mensaje de texto a tu amiga Maya?",
      ],
      items: [
        {
          part: ["Starting with “Dear”", "Empezar con «Dear»"],
          changes: true,
          why: [
            "Friends usually start a text with “Hi”, “Hey”, or no greeting at all.",
            "Los amigos suelen empezar un mensaje con «Hi», «Hey» o sin saludo.",
          ],
        },
        {
          part: ["Saying your name and class", "Decir tu nombre y tu clase"],
          changes: true,
          why: ["Maya already knows who you are.", "Maya ya sabe quién eres."],
        },
        {
          part: ["The garden club idea", "La idea del club de jardinería"],
          changes: false,
          why: [
            "The idea is the same for both readers.",
            "La idea es la misma para los dos lectores.",
          ],
        },
        {
          part: ["Using emoji", "Usar emoji"],
          changes: true,
          why: [
            "Emoji can fit a friendly chat. In an email to a principal, words carry the feeling.",
            "Los emoji pueden encajar en un chat amistoso. En un correo a un director, las palabras llevan el sentimiento.",
          ],
        },
      ],
    },
    reflect: [
      "How do people in your family send messages: texts, voice notes, video calls, letters? Which languages do you use for which messages? What changes when you write to an adult in charge?",
      "¿Cómo mandan mensajes las personas de tu familia: textos, notas de voz, videollamadas, cartas? ¿Qué idiomas usas para cada tipo de mensaje? ¿Qué cambia cuando le escribes a un adulto a cargo?",
    ],
    task: {
      prompt: [
        "Write an email to Principal Johnson asking if your class can have a reading picnic outside on the last Friday of the month. Use a greeting, say who you are, say what you want and why, and close politely.",
        "Escribe un correo al director Johnson para preguntar si tu clase puede hacer un picnic de lectura afuera el último viernes del mes. Usa un saludo, di quién eres, di lo que quieres y por qué, y despídete con cortesía.",
      ],
      register: "formal",
      medium: "email",
      needs: ["greeting", "purpose", "request", "reason", "closing", "casual"],
      purposeWords: ["picnic", "outside", "reading", "Friday"],
      minWords: 25,
      frames: [
        "Dear Principal ___,",
        "My name is ___, and I am in ___ class.",
        "I would like to ___ because ___.",
        "Could we ___?",
        "Thank you, ___",
      ],
      words: [
        { w: "Dear", es: "Estimado/a" },
        { w: "I would like to …", es: "Me gustaría …" },
        { w: "because", es: "porque" },
        { w: "Could we …?", es: "¿Podríamos …?" },
        { w: "the last Friday", es: "el último viernes" },
        { w: "Thank you,", es: "Gracias," },
      ],
      model:
        "Dear Principal Johnson,\nMy name is Omar, and I am in Mr. Diaz's 5th grade class. I would like to have a reading picnic outside on the last Friday of the month because our class has read every day this month. Could we use the field after lunch?\nThank you,\nOmar",
    },
  },
  {
    id: "water-cycle-audiences-35",
    band: "3-5",
    theme: "audiences",
    emoji: "💧",
    title: ["One idea, two listeners: the water cycle", "Una idea, dos oyentes: el ciclo del agua"],
    situation: [
      "At the science fair, a judge stops at your water cycle project and asks you to explain it. Later, your little brother, who is 5, asks the same thing.",
      "En la feria de ciencias, un juez se detiene en tu proyecto del ciclo del agua y te pide que lo expliques. Después, tu hermanito de 5 años te pregunta lo mismo.",
    ],
    card: {
      audience: ["A science fair judge", "Un juez de la feria de ciencias"],
      purpose: [
        "Explain your project clearly and correctly",
        "Explicar tu proyecto de forma clara y correcta",
      ],
      setting: ["The science fair", "La feria de ciencias"],
      relationship: ["Judge and student scientist", "Juez y estudiante científico"],
      register: "formal",
      medium: ["Talking face to face", "Hablar en persona"],
    },
    versions: [
      {
        id: "a",
        text: "Water goes up, makes clouds, and comes down as rain. Like a big circle! Cool, right?",
        why: [
          "It is true and lively, but a judge is listening for the science words that show what you learned.",
          "Es cierto y animado, pero un juez quiere escuchar las palabras científicas que muestran lo que aprendiste.",
        ],
        when: [
          "This fits your little brother: short, fun, with a picture he can imagine.",
          "Esto encaja con tu hermanito: corto, divertido y con una imagen que puede imaginar.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Our project shows the water cycle. The sun heats water, so it evaporates and becomes water vapor. The vapor cools and condenses into clouds. Then it falls as precipitation, like rain or snow.",
        why: [
          "It explains each step in order with precise words: evaporates, condenses, precipitation. That is what a judge needs.",
          "Explica cada paso en orden con palabras precisas: evaporates, condenses, precipitation. Eso es lo que necesita un juez.",
        ],
      },
      {
        id: "c",
        text: "Evaporation. Condensation. Precipitation. Collection.",
        why: [
          "The words are right, but there are no sentences, so the judge cannot tell if you understand how the steps connect.",
          "Las palabras son correctas, pero no hay oraciones, así que el juez no puede saber si entiendes cómo se conectan los pasos.",
        ],
        when: [
          "A list like this fits your own notes or flash cards for studying.",
          "Una lista así encaja en tus propios apuntes o tarjetas para estudiar.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were explaining to your little brother, who is 5?",
        "¿Y si se lo explicaras a tu hermanito de 5 años?",
      ],
      items: [
        {
          part: ["Science words like “condensation”", "Palabras científicas como «condensation»"],
          changes: true,
          why: [
            "Use everyday words, or say the science word and explain it.",
            "Usa palabras de todos los días, o di la palabra científica y explícala.",
          ],
        },
        {
          part: ["How long the sentences are", "Lo largas que son las oraciones"],
          changes: true,
          why: [
            "Short sentences are easier for a young listener.",
            "Las oraciones cortas son más fáciles para alguien pequeño.",
          ],
        },
        {
          part: ["The facts", "Los hechos"],
          changes: false,
          why: [
            "The science is still true. You change how you say it, not what is true.",
            "La ciencia sigue siendo cierta. Cambias cómo lo dices, no lo que es verdad.",
          ],
        },
        {
          part: ["Using an example he knows", "Usar un ejemplo que él conoce"],
          changes: true,
          why: [
            "A foggy bathroom mirror after a shower is condensation he has already seen.",
            "Un espejo empañado después de la ducha es condensación que él ya ha visto.",
          ],
        },
      ],
    },
    reflect: [
      "How would you explain something to a younger child at home, in any language you use? Do you use gestures, stories, songs, or examples from home?",
      "¿Cómo le explicarías algo a un niño más pequeño en casa, en cualquier idioma que uses? ¿Usas gestos, cuentos, canciones o ejemplos de casa?",
    ],
    task: {
      prompt: [
        "Explain how a plant grows from a seed to your little cousin, who is 5. Use short sentences, everyday words and one example or comparison.",
        "Explícale a tu primo de 5 años cómo crece una planta a partir de una semilla. Usa oraciones cortas, palabras de todos los días y un ejemplo o una comparación.",
      ],
      register: "informal",
      medium: "spoken",
      needs: ["purpose", "simple", "example"],
      purposeWords: ["seed", "plant", "grow", "water", "sun", "roots"],
      maxAvg: 10,
      minWords: 18,
      frames: ["First, ___.", "Then, ___.", "It's like ___.", "Soon, ___."],
      words: [
        { w: "seed", es: "semilla" },
        { w: "roots", es: "raíces" },
        { w: "sprout", es: "brote" },
        { w: "It's like …", es: "Es como …" },
        { w: "drink", es: "beber" },
        { w: "sunlight", es: "luz del sol" },
      ],
      model:
        "A plant starts as a tiny seed. We put it in the dirt. It drinks water. Roots grow down like little legs. A green sprout grows up to the sun. Soon it is a big plant!",
    },
  },
  {
    id: "recess-rule-35",
    band: "3-5",
    theme: "perspectives",
    emoji: "🏀",
    title: [
      "Two views of a new recess rule",
      "Dos puntos de vista sobre una regla nueva del recreo",
    ],
    situation: [
      "The school made a new rule: no balls on the blacktop at recess. Your friend Jayden loves basketball and is upset. Ms. Chen, the recess aide, says two kids got hurt there last week.",
      "La escuela hizo una regla nueva: no se permiten pelotas en el asfalto durante el recreo. Tu amigo Jayden ama el básquetbol y está molesto. Ms. Chen, la ayudante del recreo, dice que dos niños se lastimaron allí la semana pasada.",
    ],
    card: {
      audience: ["Your friend Jayden", "Tu amigo Jayden"],
      purpose: ["Show you understand both views", "Mostrar que entiendes los dos puntos de vista"],
      setting: ["The lunch line", "La fila del almuerzo"],
      relationship: ["Close friends", "Amigos cercanos"],
      register: "informal",
      medium: ["Talking face to face", "Hablar en persona"],
    },
    versions: [
      {
        id: "a",
        text: "That rule is dumb. The grown-ups don't care about us.",
        why: [
          "It only shows one side, and it says Ms. Chen does not care, even though she gave a safety reason.",
          "Solo muestra un lado, y dice que a Ms. Chen no le importa, aunque ella dio una razón de seguridad.",
        ],
        when: [
          "Strong feelings like this can fit a private journal, where you write how you feel before you talk to anyone.",
          "Sentimientos fuertes como estos pueden encajar en un diario privado, donde escribes cómo te sientes antes de hablar con alguien.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "I get why you're upset. You love basketball. Ms. Chen said two kids got hurt, so maybe we can ask for a special basketball area.",
        why: [
          "It names Jayden's feelings, explains Ms. Chen's reason, and suggests an idea that could work for both.",
          "Nombra los sentimientos de Jayden, explica la razón de Ms. Chen y sugiere una idea que podría funcionar para los dos.",
        ],
      },
      {
        id: "c",
        text: "Rules are rules. Stop complaining.",
        why: [
          "It ends the conversation and does not show you understand Jayden.",
          "Termina la conversación y no muestra que entiendes a Jayden.",
        ],
        when: [
          "Short and firm can fit a real emergency, when there is no time to talk, such as “Stop! A car is coming!”",
          "Corto y firme puede encajar en una emergencia de verdad, cuando no hay tiempo para hablar, como «Stop! A car is coming!»",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were writing a note to Ms. Chen instead of talking to Jayden?",
        "¿Y si le escribieras una nota a Ms. Chen en vez de hablar con Jayden?",
      ],
      items: [
        {
          part: ["Showing you understand her reason", "Mostrar que entiendes su razón"],
          changes: false,
          why: [
            "Understanding the other side fits any reader.",
            "Entender al otro lado encaja con cualquier lector.",
          ],
        },
        {
          part: ["The greeting", "El saludo"],
          changes: true,
          why: [
            "A note to an adult starts with her name, such as “Dear Ms. Chen”.",
            "Una nota a un adulto empieza con su nombre, como «Dear Ms. Chen».",
          ],
        },
        {
          part: ["Words like “I get why”", "Palabras como «I get why»"],
          changes: true,
          why: [
            "With an adult at school you might write “I understand why” instead.",
            "Con un adulto de la escuela podrías escribir «I understand why».",
          ],
        },
        {
          part: ["Suggesting a solution", "Sugerir una solución"],
          changes: false,
          why: [
            "A helpful idea fits both audiences.",
            "Una idea útil encaja con las dos audiencias.",
          ],
        },
      ],
    },
    reflect: [
      "Think of a time two people saw the same thing differently. In your family or community, how do people show respect for someone they disagree with?",
      "Piensa en una vez en que dos personas vieron lo mismo de forma diferente. En tu familia o comunidad, ¿cómo muestra la gente respeto por alguien con quien no está de acuerdo?",
    ],
    task: {
      prompt: [
        "Some students want a longer lunch. The cafeteria workers need time to clean before the next group. Write a short message to your class that explains both points of view and suggests an idea.",
        "Algunos estudiantes quieren un almuerzo más largo. Los trabajadores de la cafetería necesitan tiempo para limpiar antes del siguiente grupo. Escribe un mensaje corto a tu clase que explique los dos puntos de vista y sugiera una idea.",
      ],
      register: "neutral",
      medium: "note",
      needs: ["purpose", "perspective", "reason", "suggest"],
      purposeWords: ["lunch", "cafeteria", "clean", "time"],
      minWords: 25,
      frames: [
        "Some students want ___ because ___.",
        "The cafeteria workers need ___.",
        "Maybe we could ___.",
      ],
      words: [
        { w: "Some students want …", es: "Algunos estudiantes quieren …" },
        { w: "need", es: "necesitar" },
        { w: "because", es: "porque" },
        { w: "both", es: "los dos" },
        { w: "Maybe we could …", es: "Tal vez podríamos …" },
        { w: "fair", es: "justo" },
      ],
      model:
        "Some students want a longer lunch because they need more time to eat. The cafeteria workers need time to clean the tables for the next group. Maybe we could help by cleaning our own table, so the workers have more time.",
    },
  },
  {
    id: "left-out-35",
    band: "3-5",
    theme: "misunderstanding",
    emoji: "🤝",
    title: ["Clearing up a misunderstanding", "Aclarar un malentendido"],
    situation: [
      "Your friend Lina thinks you did not want to play with her at recess. Really, you looked for her at the swings and could not find her. Now she is sad and will not talk to you.",
      "Tu amiga Lina cree que no quisiste jugar con ella en el recreo. En realidad, la buscaste en los columpios y no la encontraste. Ahora está triste y no te habla.",
    ],
    card: {
      audience: ["Your friend Lina", "Tu amiga Lina"],
      purpose: [
        "Fix a misunderstanding and stay friends",
        "Arreglar un malentendido y seguir siendo amigos",
      ],
      setting: ["The classroom, after recess", "El salón, después del recreo"],
      relationship: ["Friends", "Amigos"],
      register: "informal",
      medium: ["Talking face to face", "Hablar en persona"],
    },
    versions: [
      {
        id: "a",
        text: "It's not my fault. You weren't there.",
        why: [
          "It may be true, but it sounds like blame, and it does not show you care that Lina felt sad.",
          "Puede ser cierto, pero suena a culpa, y no muestra que te importa que Lina se sintiera triste.",
        ],
        when: [
          "Just the facts can fit when a teacher asks where everyone was and needs a quick answer.",
          "Solo los hechos pueden encajar cuando una maestra pregunta dónde estaba cada uno y necesita una respuesta rápida.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "I'm sorry you felt left out. I looked for you at the swings, but I couldn't find you. Do you want to play with us tomorrow?",
        why: [
          "It notices her feelings, explains what really happened, and offers a next step.",
          "Nota sus sentimientos, explica lo que de verdad pasó y ofrece un siguiente paso.",
        ],
      },
      {
        id: "c",
        text: "Sorry sorry sorry!!! 😭",
        why: [
          "It says sorry, but Lina still does not know what happened or that you looked for her.",
          "Pide perdón, pero Lina todavía no sabe lo que pasó ni que la buscaste.",
        ],
        when: [
          "A quick, silly “sorry” can fit a text to a close friend after a tiny mistake, like being two minutes late.",
          "Un «sorry» rápido y gracioso puede encajar en un mensaje a un amigo cercano después de un error pequeñito, como llegar dos minutos tarde.",
        ],
      },
    ],
    shift: {
      change: [
        "What if the misunderstanding was with your teacher, about homework you turned in?",
        "¿Y si el malentendido fuera con tu maestra, sobre una tarea que entregaste?",
      ],
      items: [
        {
          part: ["Explaining what really happened", "Explicar lo que de verdad pasó"],
          changes: false,
          why: [
            "Clear facts help clear up any misunderstanding.",
            "Los hechos claros ayudan a aclarar cualquier malentendido.",
          ],
        },
        {
          part: ["Using the person's title", "Usar el título de la persona"],
          changes: true,
          why: [
            "You would start with “Ms. ___” or “Mr. ___”.",
            "Empezarías con «Ms. ___» o «Mr. ___».",
          ],
        },
        {
          part: ["The next step you offer", "El siguiente paso que ofreces"],
          changes: true,
          why: [
            "Instead of playing tomorrow, you might ask how to fix the homework.",
            "En vez de jugar mañana, podrías preguntar cómo arreglar la tarea.",
          ],
        },
        {
          part: [
            "Showing you care about the other person",
            "Mostrar que te importa la otra persona",
          ],
          changes: false,
          why: [
            "Care and respect fit both friends and teachers.",
            "El cariño y el respeto encajan con amigos y con maestros.",
          ],
        },
      ],
    },
    reflect: [
      "When there is a misunderstanding at home, how do people fix it? What words or actions in your languages show “I didn't mean it”?",
      "Cuando hay un malentendido en casa, ¿cómo lo arregla la gente? ¿Qué palabras o acciones en tus idiomas muestran «no fue mi intención»?",
    ],
    task: {
      prompt: [
        "Your classmate Marco thinks you laughed at his drawing. You were really laughing at a joke someone else told. Write what you would say to clear it up.",
        "Tu compañero Marco cree que te reíste de su dibujo. En realidad te reías de un chiste que contó otra persona. Escribe lo que le dirías para aclararlo.",
      ],
      register: "informal",
      medium: "spoken",
      needs: ["acknowledge", "purpose", "nextStep"],
      purposeWords: ["laugh", "laughing", "drawing", "joke"],
      minWords: 18,
      frames: [
        "I'm sorry you ___.",
        "I was laughing at ___, not ___.",
        "Can I ___?",
        "Do you want to ___?",
      ],
      words: [
        { w: "I'm sorry …", es: "Lo siento …" },
        { w: "I didn't mean …", es: "No fue mi intención …" },
        { w: "joke", es: "chiste" },
        { w: "drawing", es: "dibujo" },
        { w: "Can I see …?", es: "¿Puedo ver …?" },
        { w: "really", es: "de verdad" },
      ],
      model:
        "Marco, I'm sorry you felt bad. I was laughing at a joke Ben told, not at your drawing. I think your drawing is cool. Can I see it again?",
    },
  },
];
