// Culture & Communication Explorer, grades 6-8, scenarios 1-4. Shape documented in src/content/communication.js.
// Message versions and frames are English practice; directions, reasons and prompts are bilingual. Every version
// that does not fit names a situation where it WOULD fit.

export const SCENARIOS_68A = [
  {
    id: "extension-email-68",
    band: "6-8",
    theme: "school",
    emoji: "🧪",
    title: ["Asking a teacher for an extension", "Pedirle una extensión a un maestro"],
    situation: [
      "You were sick on Monday and Tuesday, so you could not finish your science lab report, due Thursday. You decide to email your teacher, Mr. Alvarez, to ask for more time.",
      "Estuviste enfermo el lunes y el martes, así que no pudiste terminar tu informe de laboratorio de ciencias, que se entrega el jueves. Decides escribirle un correo a tu maestro, Mr. Alvarez, para pedir más tiempo.",
    ],
    card: {
      audience: ["Mr. Alvarez, your science teacher", "Mr. Alvarez, tu maestro de ciencias"],
      purpose: [
        "Explain the situation and request a new due date",
        "Explicar la situación y pedir una nueva fecha de entrega",
      ],
      setting: ["School email", "Correo de la escuela"],
      relationship: [
        "Teacher who grades your work and student",
        "Maestro que califica tu trabajo y estudiante",
      ],
      register: "formal",
      medium: ["Email", "Correo electrónico"],
    },
    versions: [
      {
        id: "a",
        text: "yo mr a can i turn in the lab late lol",
        why: [
          "Mr. Alvarez does not learn why, until when, or which class you are in. “yo” and “lol” fit a group chat more than a request to the person grading your work.",
          "Mr. Alvarez no sabe por qué, hasta cuándo ni en qué clase estás. «yo» y «lol» encajan más en un chat de grupo que en una petición a la persona que califica tu trabajo.",
        ],
        when: [
          "This style fits a group chat with friends, where joking and short spellings are part of how you talk.",
          "Este estilo encaja en un chat de grupo con amigos, donde las bromas y las abreviaturas son parte de cómo hablan.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Dear Mr. Alvarez,\nI was absent on Monday and Tuesday because I was sick, so I could not finish the lab report due Thursday. Would it be possible to turn it in on Monday? I have already finished the data table.\nThank you for considering this.\nSincerely,\nDaniel Kim, Period 3",
        why: [
          "It gives the reason, names the assignment, proposes a specific date, shows progress, and leaves the decision to him.",
          "Da la razón, nombra la tarea, propone una fecha concreta, muestra su avance y le deja la decisión a él.",
        ],
      },
      {
        id: "c",
        text: "Dear Mr. Alvarez,\nI need an extension.\nThanks.",
        why: [
          "The greeting and closing fit, but he does not know which assignment, why, or how much time you need.",
          "El saludo y la despedida encajan, pero él no sabe qué tarea, por qué ni cuánto tiempo necesitas.",
        ],
        when: [
          "A short note can fit a follow-up after you already talked in person and he asked you to send a reminder.",
          "Una nota corta puede encajar como seguimiento después de que ya hablaron en persona y él te pidió un recordatorio.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were explaining this to a friend in a text?",
        "¿Y si le explicaras esto a un amigo en un mensaje de texto?",
      ],
      items: [
        {
          part: ["“Would it be possible to …?”", "«Would it be possible to …?»"],
          changes: true,
          why: [
            "With a friend you are not asking permission, so you would just say what is happening.",
            "Con un amigo no pides permiso, así que solo dirías lo que pasa.",
          ],
        },
        {
          part: ["Your full name and class period", "Tu nombre completo y tu período de clase"],
          changes: true,
          why: ["Your friend already knows who you are.", "Tu amigo ya sabe quién eres."],
        },
        {
          part: ["The facts: you were sick for two days", "Los hechos: estuviste enfermo dos días"],
          changes: false,
          why: [
            "The facts stay the same for both readers.",
            "Los hechos son iguales para los dos lectores.",
          ],
        },
        {
          part: ["The closing “Sincerely”", "La despedida «Sincerely»"],
          changes: true,
          why: [
            "Texts to friends rarely have a closing.",
            "Los mensajes a amigos casi nunca tienen despedida.",
          ],
        },
      ],
    },
    reflect: [
      "How do students address teachers in places or languages you know: first name, last name, “Teacher”, “Profe”, or another title? What does each choice signal about the relationship?",
      "¿Cómo se dirigen los estudiantes a los maestros en lugares o idiomas que conoces: nombre, apellido, «Teacher», «Profe» u otro título? ¿Qué indica cada opción sobre la relación?",
    ],
    task: {
      prompt: [
        "Write an email to your coach, Ms. Brooks, asking to miss Wednesday's practice for a family event and asking how you can make it up.",
        "Escribe un correo a tu entrenadora, Ms. Brooks, para pedir faltar a la práctica del miércoles por un evento familiar y preguntar cómo puedes recuperarla.",
      ],
      register: "formal",
      medium: "email",
      needs: ["greeting", "purpose", "reason", "request", "closing", "casual"],
      purposeWords: ["practice", "Wednesday", "family", "event", "miss"],
      minWords: 35,
      frames: [
        "Dear Coach ___,",
        "I am writing because ___.",
        "Would it be possible to ___?",
        "How can I ___?",
        "Thank you for understanding. Sincerely, ___",
      ],
      words: [
        { w: "I am writing because …", es: "Le escribo porque …" },
        { w: "family event", es: "evento familiar" },
        { w: "Would it be possible to …?", es: "¿Sería posible …?" },
        { w: "make it up", es: "recuperarlo" },
        { w: "I understand", es: "Entiendo" },
        { w: "Sincerely,", es: "Atentamente," },
      ],
      model:
        "Dear Ms. Brooks,\nI am writing because I will miss practice on Wednesday. My family has an important event that evening, my cousin's graduation. Would it be possible to make up the practice on Friday? I can also run the drills at home.\nThank you for understanding.\nSincerely,\nLuis Ortega",
    },
  },
  {
    id: "clinic-call-68",
    band: "6-8",
    theme: "community",
    emoji: "📞",
    title: ["Calling a clinic for a family member", "Llamar a una clínica por un familiar"],
    situation: [
      "Your aunt asks you to call the dental clinic in English to move her appointment. She has an appointment on Tuesday at 10:00, but her work schedule changed. She can come on Thursday afternoon.",
      "Tu tía te pide que llames a la clínica dental en inglés para cambiar su cita. Tiene una cita el martes a las 10:00, pero su horario de trabajo cambió. Puede ir el jueves por la tarde.",
    ],
    card: {
      audience: ["The clinic receptionist", "La recepcionista de la clínica"],
      purpose: ["Reschedule an appointment for someone else", "Cambiar una cita para otra persona"],
      setting: ["A phone call to a busy office", "Una llamada a una oficina ocupada"],
      relationship: ["Office worker and caller", "Trabajadora de oficina y persona que llama"],
      register: "formal",
      medium: ["Phone call", "Llamada telefónica"],
    },
    versions: [
      {
        id: "a",
        text: "Yeah, my aunt can't come Tuesday. Change it.",
        why: [
          "The receptionist does not know who your aunt is, which appointment, or what new time works. “Change it” sounds like an order.",
          "La recepcionista no sabe quién es tu tía, qué cita es ni qué nuevo horario le sirve. «Change it» suena como una orden.",
        ],
        when: [
          "This fits talking with your aunt or a sibling at home, when everyone already knows the plan.",
          "Esto encaja al hablar con tu tía o un hermano en casa, cuando todos ya conocen el plan.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Hello, my name is Ana Torres. I'm calling for my aunt, Rosa Méndez. She has a dental appointment on Tuesday at 10:00, and she needs to reschedule. Do you have anything available on Thursday afternoon?",
        why: [
          "It says who is calling and for whom, names the appointment, explains the need, and asks a clear question with a time.",
          "Dice quién llama y por quién, nombra la cita, explica la necesidad y hace una pregunta clara con un horario.",
        ],
      },
      {
        id: "c",
        text: "Hi, so, um, my aunt, she was going to come, but then her boss changed the schedule, and my cousin has the car on Tuesdays, so maybe Thursday?",
        why: [
          "All of it is true, but the receptionist has to dig for the key facts: whose appointment, which day, and what time.",
          "Todo es cierto, pero la recepcionista tiene que buscar los datos clave: de quién es la cita, qué día y a qué hora.",
        ],
        when: [
          "The whole story fits a family member who wants to hear everything that happened.",
          "La historia completa encaja con un familiar que quiere oír todo lo que pasó.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you sent this through the clinic's online message form instead of calling?",
        "¿Y si mandaras esto por el formulario de mensajes en línea de la clínica en vez de llamar?",
      ],
      items: [
        {
          part: [
            "Saying who you are and who the patient is",
            "Decir quién eres y quién es la paciente",
          ],
          changes: false,
          why: ["The clinic needs this either way.", "La clínica lo necesita de las dos maneras."],
        },
        {
          part: [
            "Adding a phone number and every time that works",
            "Agregar un teléfono y todos los horarios posibles",
          ],
          changes: true,
          why: [
            "In writing, nobody can ask you a follow-up question right away, so you include everything at once.",
            "Por escrito, nadie puede hacerte una pregunta enseguida, así que incluyes todo de una vez.",
          ],
        },
        {
          part: ["“Um” and pauses", "«Um» y las pausas"],
          changes: true,
          why: [
            "Those are normal in speech. In writing, you can plan your sentences first.",
            "Son normales al hablar. Por escrito, puedes planear tus oraciones primero.",
          ],
        },
        {
          part: ["The request to move the appointment", "La petición de cambiar la cita"],
          changes: false,
          why: ["Your purpose is the same.", "Tu propósito es el mismo."],
        },
      ],
    },
    reflect: [
      "Many students help family members communicate, in English or in another language. If you have done this, what did you notice about switching between languages? What do you do when a word does not translate?",
      "Muchos estudiantes ayudan a sus familiares a comunicarse, en inglés o en otro idioma. Si lo has hecho, ¿qué notaste al cambiar de un idioma a otro? ¿Qué haces cuando una palabra no se traduce?",
    ],
    task: {
      prompt: [
        "Write what you would say when you call the public library to ask whether you can reserve a study room on Saturday for your group project.",
        "Escribe lo que dirías al llamar a la biblioteca pública para preguntar si puedes reservar una sala de estudio el sábado para tu proyecto de grupo.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["greeting", "purpose", "request", "thanks"],
      purposeWords: ["study room", "room", "reserve", "Saturday", "group", "project"],
      minWords: 25,
      frames: [
        "Hello, my name is ___.",
        "I'm calling to ask about ___.",
        "Is it possible to ___ on ___?",
        "Thank you for your help.",
      ],
      words: [
        { w: "I'm calling to ask about …", es: "Llamo para preguntar sobre …" },
        { w: "reserve", es: "reservar" },
        { w: "study room", es: "sala de estudio" },
        { w: "available", es: "disponible" },
        { w: "for four people", es: "para cuatro personas" },
        { w: "Thank you for your help.", es: "Gracias por su ayuda." },
      ],
      model:
        "Hello, my name is Grace Liu. I'm calling to ask about the study rooms. Is it possible to reserve a room on Saturday from 1:00 to 3:00 for my group project? There are four of us. Thank you for your help.",
    },
  },
  {
    id: "bakery-oral-history-68",
    band: "6-8",
    theme: "interview",
    emoji: "🥐",
    title: ["An oral history interview", "Una entrevista de historia oral"],
    situation: [
      "For a neighborhood history project, you are interviewing Mrs. Nguyen, who has run the bakery on your street for twenty years. You want to record the interview and hear how the bakery began.",
      "Para un proyecto de historia del barrio, entrevistas a Mrs. Nguyen, quien ha tenido la panadería de tu calle durante veinte años. Quieres grabar la entrevista y saber cómo empezó la panadería.",
    ],
    card: {
      audience: [
        "Mrs. Nguyen, a neighborhood business owner",
        "Mrs. Nguyen, dueña de un negocio del barrio",
      ],
      purpose: [
        "Hear her story for a history project",
        "Escuchar su historia para un proyecto de historia",
      ],
      setting: ["Her bakery, after closing time", "Su panadería, después de cerrar"],
      relationship: ["Community elder and student", "Persona mayor de la comunidad y estudiante"],
      register: "formal",
      medium: ["Recorded conversation", "Conversación grabada"],
    },
    versions: [
      {
        id: "a",
        text: "So why did you open a bakery? Was it hard? Do you make a lot of money?",
        why: [
          "Three questions at once give her no room to tell a story, and money can feel like a private topic.",
          "Tres preguntas a la vez no le dan espacio para contar una historia, y el dinero puede sentirse como un tema privado.",
        ],
        when: [
          "Rapid questions can fit a fast game with friends, like twenty questions, where quick answers are the fun part.",
          "Las preguntas rápidas pueden encajar en un juego rápido con amigos, como las veinte preguntas, donde lo divertido son las respuestas rápidas.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Good afternoon, Mrs. Nguyen. Thank you for talking with me for our neighborhood history project. Is it okay if I record our conversation? To start, could you tell me how the bakery began?",
        why: [
          "It thanks her, explains the project, asks permission to record, and opens with one question that invites her story.",
          "Le agradece, explica el proyecto, pide permiso para grabar y empieza con una pregunta que invita a contar su historia.",
        ],
      },
      {
        id: "c",
        text: "I'm recording now. State your name, age and income.",
        why: [
          "It starts recording without asking, and age and income can feel private in a conversation built on trust.",
          "Empieza a grabar sin preguntar, y la edad y los ingresos pueden sentirse privados en una conversación basada en la confianza.",
        ],
        when: [
          "Direct “state your …” wording fits an official form, and even then people can choose what to share.",
          "Las palabras directas como «state your …» encajan en un formulario oficial, y aun así la gente puede elegir qué compartir.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were interviewing a classmate for the same project?",
        "¿Y si entrevistaras a un compañero de clase para el mismo proyecto?",
      ],
      items: [
        {
          part: ["“Good afternoon, Mrs. …”", "«Good afternoon, Mrs. …»"],
          changes: true,
          why: ["With a classmate, “Hi, Sara” fits.", "Con un compañero, «Hi, Sara» encaja."],
        },
        {
          part: ["Explaining the project", "Explicar el proyecto"],
          changes: false,
          why: [
            "Anyone you interview should know what it is for.",
            "Cualquier persona que entrevistes debe saber para qué es.",
          ],
        },
        {
          part: ["Asking permission to record", "Pedir permiso para grabar"],
          changes: false,
          why: [
            "Always ask before recording anyone, any age.",
            "Siempre pregunta antes de grabar a alguien, de cualquier edad.",
          ],
        },
        {
          part: ["Asking open questions", "Hacer preguntas abiertas"],
          changes: false,
          why: [
            "Open questions get stories from anyone.",
            "Las preguntas abiertas consiguen historias de cualquier persona.",
          ],
        },
      ],
    },
    reflect: [
      "In your communities, how do younger people show respect when they ask older people about their lives? Are there topics people treat as private? How would you ask these questions in another language you know?",
      "En tus comunidades, ¿cómo muestran respeto los jóvenes cuando les preguntan a las personas mayores sobre su vida? ¿Hay temas que la gente considera privados? ¿Cómo harías estas preguntas en otro idioma que conoces?",
    ],
    task: {
      prompt: [
        "Write the opening of an interview with a family member or neighbor about how your neighborhood has changed. Greet them, explain the project, ask permission to record, and ask three open questions.",
        "Escribe el comienzo de una entrevista con un familiar o vecino sobre cómo ha cambiado tu barrio. Salúdalo, explica el proyecto, pide permiso para grabar y haz tres preguntas abiertas.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["greeting", "purpose", "permission", "questions"],
      purposeWords: ["project", "history", "neighborhood", "interview"],
      minQuestions: 3,
      minWords: 35,
      frames: [
        "Thank you for talking with me about ___.",
        "Is it okay if I record ___?",
        "Could you tell me about ___?",
        "How has ___ changed since ___?",
        "What do you remember about ___?",
      ],
      words: [
        { w: "Is it okay if I record …?", es: "¿Está bien si grabo …?" },
        { w: "neighborhood", es: "barrio" },
        { w: "Could you tell me about …?", es: "¿Me podría contar sobre …?" },
        { w: "How has … changed?", es: "¿Cómo ha cambiado …?" },
        { w: "What do you remember about …?", es: "¿Qué recuerda de …?" },
        { w: "memory", es: "recuerdo" },
      ],
      model:
        "Hello, Mr. Haddad. Thank you for talking with me for my neighborhood history project. Is it okay if I record our conversation? Could you tell me what our street looked like when you moved here? How has the neighborhood changed since then? What do you remember most about the old corner store?",
    },
  },
  {
    id: "video-or-slides-68",
    band: "6-8",
    theme: "collab",
    emoji: "🗂️",
    title: ["Disagreeing in a group project", "No estar de acuerdo en un proyecto de grupo"],
    situation: [
      "Your history group has four days to finish a presentation. Your teammate Priya wants to make a video. You think editing a video will take too long, but you like her idea.",
      "Tu grupo de historia tiene cuatro días para terminar una presentación. Tu compañera Priya quiere hacer un video. Tú crees que editar un video tomará demasiado tiempo, pero te gusta su idea.",
    ],
    card: {
      audience: ["Your teammate Priya and the group", "Tu compañera Priya y el grupo"],
      purpose: [
        "Disagree respectfully and find a plan",
        "No estar de acuerdo con respeto y encontrar un plan",
      ],
      setting: ["Group meeting in class", "Reunión de grupo en clase"],
      relationship: ["Teammates, equals", "Compañeros de equipo, iguales"],
      register: "informal",
      medium: ["Talking in a small group", "Hablar en un grupo pequeño"],
    },
    versions: [
      {
        id: "a",
        text: "That idea won't work. We're doing slides.",
        why: [
          "It shuts down Priya's idea without a reason and decides for the whole group.",
          "Rechaza la idea de Priya sin una razón y decide por todo el grupo.",
        ],
        when: [
          "A fast decision can fit a team captain with seconds left in a game, when there is no time to discuss.",
          "Una decisión rápida puede encajar con un capitán de equipo cuando quedan segundos en un partido y no hay tiempo para hablar.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "I like that a video would be creative. My worry is that we only have four days, and editing takes a long time. What if we make slides now and add a short video clip if we have time?",
        why: [
          "It responds to Priya's idea first, gives a specific reason, and suggests a plan that keeps part of her idea.",
          "Responde primero a la idea de Priya, da una razón concreta y sugiere un plan que conserva parte de su idea.",
        ],
      },
      {
        id: "c",
        text: "Sure, whatever everyone wants is fine.",
        why: [
          "You have a real concern about time. Keeping it to yourself could hurt the project.",
          "Tienes una preocupación real sobre el tiempo. Callarla podría perjudicar el proyecto.",
        ],
        when: [
          "Going along fits when you truly do not mind which option the group picks.",
          "Aceptar lo que digan encaja cuando de verdad no te importa qué opción elija el grupo.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you gave this feedback in a comment on the group's shared document instead of out loud?",
        "¿Y si dieras esta opinión en un comentario del documento compartido del grupo en vez de en voz alta?",
      ],
      items: [
        {
          part: ["Tone of voice and facial expression", "El tono de voz y la expresión de la cara"],
          changes: true,
          why: [
            "In a comment, nobody can hear your friendly tone, so your words have to carry the kindness.",
            "En un comentario, nadie oye tu tono amistoso, así que tus palabras tienen que llevar la amabilidad.",
          ],
        },
        {
          part: ["Giving a specific reason", "Dar una razón concreta"],
          changes: false,
          why: [
            "A clear reason helps in speech and in writing.",
            "Una razón clara ayuda al hablar y al escribir.",
          ],
        },
        {
          part: ["Naming the person you are answering", "Nombrar a la persona a quien respondes"],
          changes: true,
          why: [
            "In a shared document, writing “Priya,” or tagging her shows whose idea you mean.",
            "En un documento compartido, escribir «Priya,» o etiquetarla muestra de quién es la idea.",
          ],
        },
        {
          part: ["Suggesting another plan", "Sugerir otro plan"],
          changes: false,
          why: ["A way forward helps any group.", "Un camino a seguir ayuda a cualquier grupo."],
        },
      ],
    },
    reflect: [
      "How do people disagree respectfully in the languages and communities you know? Do they say it directly, or do they hint? Both can work. What does each one need from the listener?",
      "¿Cómo no está de acuerdo la gente con respeto en los idiomas y comunidades que conoces? ¿Lo dicen directamente o lo insinúan? Las dos formas pueden funcionar. ¿Qué necesita cada una de quien escucha?",
    ],
    task: {
      prompt: [
        "Your group is choosing a debate topic: school uniforms or a four-day school week. A teammate wants the other topic. Write what you would say to respond to their idea, give your reason, and suggest a way forward.",
        "Tu grupo elige un tema de debate: los uniformes escolares o la semana escolar de cuatro días. Un compañero quiere el otro tema. Escribe lo que dirías para responder a su idea, dar tu razón y sugerir cómo seguir.",
      ],
      register: "informal",
      medium: "spoken",
      needs: ["respond", "reason", "suggest", "purpose"],
      purposeWords: ["uniforms", "uniform", "four-day", "school week", "debate", "topic"],
      minWords: 30,
      frames: [
        "I see why you want ___.",
        "My concern is that ___ because ___.",
        "What if we ___?",
        "We could also ___.",
      ],
      words: [
        { w: "I see why …", es: "Entiendo por qué …" },
        { w: "That's a good point, but …", es: "Buen punto, pero …" },
        { w: "My concern is …", es: "Lo que me preocupa es …" },
        { w: "evidence", es: "evidencia" },
        { w: "What if we …?", es: "¿Y si …?" },
        { w: "compromise", es: "acuerdo intermedio" },
      ],
      model:
        "I see why you want the four-day school week. It is a fun topic. My concern is that we found more evidence about school uniforms, because our library has three articles on it. What if we list the sources for both topics today and vote tomorrow?",
    },
  },
];
