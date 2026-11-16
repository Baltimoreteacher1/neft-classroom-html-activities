// Culture & Communication Explorer, grades 3-5, scenarios 1-4. Shape documented in src/content/communication.js.
// Message versions and frames are English practice; directions, reasons and prompts are bilingual. Every version
// that does not fit names a situation where it WOULD fit: the question is always "what fits here?", never which
// way of talking is better.

export const SCENARIOS_35A = [
  {
    id: "teacher-or-friend-35",
    band: "3-5",
    theme: "school",
    emoji: "🏫",
    title: ["Ask the teacher or tell a friend?", "¿Pedirle a la maestra o contarle a un amigo?"],
    situation: [
      "Your library book is due today, but you left it at home. Before the bell, you need to tell your teacher, Ms. Rivera, and ask if you can bring it tomorrow.",
      "Tu libro de la biblioteca se tiene que devolver hoy, pero lo dejaste en casa. Antes de que suene el timbre, necesitas decírselo a tu maestra, Ms. Rivera, y preguntarle si puedes traerlo mañana.",
    ],
    card: {
      audience: ["Your teacher, Ms. Rivera", "Tu maestra, Ms. Rivera"],
      purpose: [
        "Explain a problem and ask for more time",
        "Explicar un problema y pedir más tiempo",
      ],
      setting: ["The classroom, before the bell", "El salón, antes del timbre"],
      relationship: ["Teacher and student", "Maestra y estudiante"],
      register: "formal",
      medium: ["Talking face to face", "Hablar en persona"],
    },
    versions: [
      {
        id: "a",
        text: "Hey, my book's at home. I'll bring it tomorrow.",
        why: [
          "It is clear and friendly, but it tells Ms. Rivera the plan instead of asking her. She is the one who decides about due dates.",
          "Es claro y amistoso, pero le dice el plan a Ms. Rivera en vez de preguntarle. Ella es quien decide sobre las fechas de entrega.",
        ],
        when: [
          "This fits telling a friend, because your friend does not decide anything. You are just sharing news.",
          "Esto encaja para contárselo a un amigo, porque tu amigo no decide nada. Solo compartes una noticia.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Good morning, Ms. Rivera. I left my library book at home by mistake. Could I bring it tomorrow, please?",
        why: [
          "It greets her by name, says what happened, and asks a clear question. Ms. Rivera gets to make the choice.",
          "La saluda por su nombre, dice lo que pasó y hace una pregunta clara. Ms. Rivera puede tomar la decisión.",
        ],
      },
      {
        id: "c",
        text: "Dear Ms. Rivera, I am writing to inform you that my library book is not with me today. Sincerely, Ana",
        why: [
          "“Dear” and “Sincerely” are letter words, and you are standing right in front of her. It also never asks anything.",
          "«Dear» y «Sincerely» son palabras de carta, y estás justo frente a ella. Además, nunca pregunta nada.",
        ],
        when: [
          "This style fits a note you leave on her desk or an email, if you also add a question.",
          "Este estilo encaja en una nota que dejas en su escritorio o en un correo, si también agregas una pregunta.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were telling your friend Sam at lunch instead?",
        "¿Y si se lo contaras a tu amigo Sam en el almuerzo?",
      ],
      items: [
        {
          part: ["The greeting", "El saludo"],
          changes: true,
          why: [
            "With Sam you might say “Hey, Sam” or just start talking. “Good morning, Ms. …” fits an adult in charge.",
            "Con Sam podrías decir «Hey, Sam» o empezar a hablar sin más. «Good morning, Ms. …» encaja con un adulto a cargo.",
          ],
        },
        {
          part: ["What happened: the book is at home", "Lo que pasó: el libro está en casa"],
          changes: false,
          why: [
            "The facts stay the same for any listener.",
            "Los hechos son los mismos para cualquier persona.",
          ],
        },
        {
          part: ["Asking permission", "Pedir permiso"],
          changes: true,
          why: [
            "Sam is not in charge of due dates, so you would tell him, not ask him.",
            "Sam no está a cargo de las fechas de entrega, así que se lo contarías, no le pedirías permiso.",
          ],
        },
        {
          part: ["Telling the truth", "Decir la verdad"],
          changes: false,
          why: ["Being honest fits every audience.", "Ser honesto encaja con cualquier audiencia."],
        },
      ],
    },
    reflect: [
      "How would you tell a teacher or another adult about a problem in a language you use at home? Do you use a title such as Ms., Maestra, Teacher, or a first name? What changes when you talk to someone in charge?",
      "¿Cómo le contarías un problema a una maestra u otro adulto en un idioma que usas en casa? ¿Usas un título como Ms., Maestra, Teacher o un nombre de pila? ¿Qué cambia cuando hablas con alguien a cargo?",
    ],
    task: {
      prompt: [
        "You forgot your homework folder at home. Write what you would say to Ms. Rivera. Greet her, say what happened, and ask a clear question.",
        "Olvidaste tu carpeta de tarea en casa. Escribe lo que le dirías a Ms. Rivera. Salúdala, di lo que pasó y haz una pregunta clara.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["greeting", "address", "purpose", "request"],
      purposeWords: ["homework", "folder", "forgot", "left", "home"],
      audienceWords: ["Ms. Rivera", "Rivera", "Ms.", "teacher"],
      minWords: 12,
      frames: [
        "Good morning, Ms. ___.",
        "I forgot my ___ at ___.",
        "Could I ___, please?",
        "Thank you for ___.",
      ],
      words: [
        { w: "forgot", es: "olvidé" },
        { w: "folder", es: "carpeta" },
        { w: "by mistake", es: "sin querer" },
        { w: "Could I …?", es: "¿Podría …?" },
        { w: "tomorrow", es: "mañana" },
        { w: "please", es: "por favor" },
      ],
      model:
        "Good morning, Ms. Rivera. I forgot my homework folder at home this morning. Could I bring it tomorrow, please? Thank you.",
    },
  },
  {
    id: "library-desk-35",
    band: "3-5",
    theme: "community",
    emoji: "📚",
    title: ["At the public library desk", "En el mostrador de la biblioteca pública"],
    situation: [
      "You are at the public library with your family. You want to get your own library card and find a book about sharks. The librarian at the desk does not know you yet.",
      "Estás en la biblioteca pública con tu familia. Quieres sacar tu propia tarjeta de la biblioteca y encontrar un libro sobre tiburones. El bibliotecario del mostrador todavía no te conoce.",
    ],
    card: {
      audience: ["A librarian you have not met", "Un bibliotecario que no conoces"],
      purpose: [
        "Ask for a card and for help finding a book",
        "Pedir una tarjeta y ayuda para encontrar un libro",
      ],
      setting: ["The library front desk", "El mostrador de la biblioteca"],
      relationship: ["Community worker and visitor", "Trabajador de la comunidad y visitante"],
      register: "formal",
      medium: ["Talking face to face", "Hablar en persona"],
    },
    versions: [
      {
        id: "a",
        text: "Shark book?",
        why: [
          "The librarian has to guess what you want, and you also need a card. Two words do not give enough information here.",
          "El bibliotecario tiene que adivinar lo que quieres, y también necesitas una tarjeta. Dos palabras no dan suficiente información aquí.",
        ],
        when: [
          "One or two words can fit at home, when someone already knows what you want and can see you pointing at the shelf.",
          "Una o dos palabras pueden encajar en casa, cuando alguien ya sabe lo que quieres y te ve señalar el estante.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Hi! Excuse me, I would like to get a library card. Also, where can I find books about sharks?",
        why: [
          "“Excuse me” politely gets attention, and the two requests are clear, one at a time.",
          "«Excuse me» llama la atención con cortesía, y las dos peticiones son claras, una a la vez.",
        ],
      },
      {
        id: "c",
        text: "To whom it may concern: I request one library card and one book regarding sharks.",
        why: [
          "“To whom it may concern” is for a written letter to someone whose name you do not know. Said out loud at a desk, it sounds like a robot.",
          "«To whom it may concern» es para una carta escrita a alguien cuyo nombre no sabes. Dicho en voz alta en un mostrador, suena como un robot.",
        ],
        when: [
          "This start fits a formal letter or a form you mail to an office.",
          "Este comienzo encaja en una carta formal o un formulario que envías a una oficina.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you called the library on the phone instead?",
        "¿Y si llamaras a la biblioteca por teléfono?",
      ],
      items: [
        {
          part: ["Saying who you are", "Decir quién eres"],
          changes: true,
          why: [
            "On the phone they cannot see you, so you say your name first.",
            "Por teléfono no te pueden ver, así que dices tu nombre primero.",
          ],
        },
        {
          part: ["Pointing or showing", "Señalar o mostrar"],
          changes: true,
          why: [
            "You cannot point on the phone. Every idea has to go into words.",
            "No puedes señalar por teléfono. Cada idea tiene que ir en palabras.",
          ],
        },
        {
          part: [
            "What you want: a card and a shark book",
            "Lo que quieres: una tarjeta y un libro de tiburones",
          ],
          changes: false,
          why: [
            "Your purpose is the same either way.",
            "Tu propósito es el mismo de las dos maneras.",
          ],
        },
        {
          part: ["Being polite", "Ser cortés"],
          changes: false,
          why: [
            "Polite words fit a stranger on the phone and at the desk.",
            "Las palabras corteses encajan con un desconocido por teléfono y en el mostrador.",
          ],
        },
      ],
    },
    reflect: [
      "Think about a store, clinic or library in your neighborhood. How do people greet a worker there in the languages you know? Is it the same as greeting a friend or a family member?",
      "Piensa en una tienda, clínica o biblioteca de tu barrio. ¿Cómo saluda la gente a un trabajador allí en los idiomas que conoces? ¿Es igual que saludar a un amigo o a un familiar?",
    ],
    task: {
      prompt: [
        "You are at the clinic front desk with your mom. Write what you would say to the worker: you have a 3:00 appointment for a checkup, and you want to know where to wait.",
        "Estás en el mostrador de la clínica con tu mamá. Escribe lo que le dirías al trabajador: tienen una cita a las 3:00 para un chequeo y quieres saber dónde esperar.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["greeting", "purpose", "request"],
      purposeWords: ["appointment", "3:00", "three", "checkup", "check-up"],
      minWords: 12,
      frames: [
        "Hello. Excuse me.",
        "We have an appointment at ___ for ___.",
        "Where should we ___?",
        "Thank you.",
      ],
      words: [
        { w: "appointment", es: "cita" },
        { w: "checkup", es: "chequeo" },
        { w: "Excuse me", es: "Disculpe" },
        { w: "Where should we wait?", es: "¿Dónde esperamos?" },
        { w: "my mom", es: "mi mamá" },
        { w: "thank you", es: "gracias" },
      ],
      model:
        "Hello, excuse me. My mom and I have an appointment at 3:00 for a checkup. Where should we wait, please? Thank you.",
    },
  },
  {
    id: "custodian-interview-35",
    band: "3-5",
    theme: "interview",
    emoji: "🎙️",
    title: ["Interviewing the school custodian", "Entrevista al conserje de la escuela"],
    situation: [
      "Your class newspaper is writing about people who help the school. You are going to interview Mr. Okafor, the custodian, during his break. You want him to tell real stories.",
      "El periódico de tu clase escribe sobre personas que ayudan a la escuela. Vas a entrevistar a Mr. Okafor, el conserje, durante su descanso. Quieres que cuente historias de verdad.",
    ],
    card: {
      audience: ["Mr. Okafor, the custodian", "Mr. Okafor, el conserje"],
      purpose: [
        "Get answers with stories for the newspaper",
        "Conseguir respuestas con historias para el periódico",
      ],
      setting: ["A quiet table during his break", "Una mesa tranquila durante su descanso"],
      relationship: [
        "Adult at school and student reporter",
        "Adulto de la escuela y estudiante reportero",
      ],
      register: "formal",
      medium: ["Talking face to face, taking notes", "Hablar en persona y tomar notas"],
    },
    versions: [
      {
        id: "a",
        text: "So what do you even do all day?",
        why: [
          "“Even” can sound like you think nothing happens in his job, and there is no greeting or thanks for his break time.",
          "«Even» puede sonar como si pensaras que en su trabajo no pasa nada, y no hay saludo ni agradecimiento por su tiempo de descanso.",
        ],
        when: [
          "A quick, joking question like this can fit a cousin or close friend who knows you mean it kindly.",
          "Una pregunta rápida y en broma como esta puede encajar con un primo o un amigo cercano que sabe que lo dices con cariño.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "Hello, Mr. Okafor. Thank you for meeting with me during your break. What is your favorite part of getting our school ready each day?",
        why: [
          "It greets him, thanks him for his time, and asks an open question that invites a story.",
          "Lo saluda, le agradece su tiempo y hace una pregunta abierta que invita a contar una historia.",
        ],
      },
      {
        id: "c",
        text: "Question one. Answer yes or no. Do you like your job?",
        why: [
          "A yes-or-no question gets a one-word answer. An interview for a newspaper needs details and stories.",
          "Una pregunta de sí o no recibe una respuesta de una palabra. Una entrevista para un periódico necesita detalles e historias.",
        ],
        when: [
          "Yes-or-no questions fit a quick survey, when you ask many people and count the answers.",
          "Las preguntas de sí o no encajan en una encuesta rápida, cuando preguntas a muchas personas y cuentas las respuestas.",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were interviewing your grandmother for a family history project?",
        "¿Y si entrevistaras a tu abuela para un proyecto de historia familiar?",
      ],
      items: [
        {
          part: ["Thanking the person for their time", "Agradecer a la persona por su tiempo"],
          changes: false,
          why: [
            "Thanking someone for their time fits any interview.",
            "Agradecer el tiempo de alguien encaja en cualquier entrevista.",
          ],
        },
        {
          part: ["What you call the person", "Cómo llamas a la persona"],
          changes: true,
          why: [
            "You would use the name your family uses, such as Grandma, Abuela, Nana or another word.",
            "Usarías el nombre que usa tu familia, como Grandma, Abuela, Nana u otra palabra.",
          ],
        },
        {
          part: ["The topic of the questions", "El tema de las preguntas"],
          changes: true,
          why: [
            "You would ask about family memories, not a school job.",
            "Preguntarías sobre recuerdos de la familia, no sobre un trabajo de la escuela.",
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
      "When you ask an adult questions at home or in your community, how do you show respect? Are there words, titles, gestures, or ways of waiting your turn that you use in your languages?",
      "Cuando le haces preguntas a un adulto en casa o en tu comunidad, ¿cómo muestras respeto? ¿Hay palabras, títulos, gestos o formas de esperar tu turno que usas en tus idiomas?",
    ],
    task: {
      prompt: [
        "Write the start of an interview with the school nurse, Ms. Patel, for the class newsletter. Greet her, thank her, say why you are interviewing her, and ask two open questions.",
        "Escribe el comienzo de una entrevista con la enfermera de la escuela, Ms. Patel, para el boletín de la clase. Salúdala, agradécele, di por qué la entrevistas y haz dos preguntas abiertas.",
      ],
      register: "formal",
      medium: "spoken",
      needs: ["greeting", "thanks", "purpose", "questions"],
      purposeWords: ["newsletter", "interview", "article", "newspaper", "class"],
      minQuestions: 2,
      minWords: 20,
      frames: [
        "Hello, Ms. ___. Thank you for ___.",
        "I am interviewing you for our ___.",
        "What is your favorite part of ___?",
        "Can you tell me about a time when ___?",
      ],
      words: [
        { w: "interview", es: "entrevista" },
        { w: "newsletter", es: "boletín" },
        { w: "Thank you for your time.", es: "Gracias por su tiempo." },
        { w: "Can you tell me about …?", es: "¿Me puede contar sobre …?" },
        { w: "How did you …?", es: "¿Cómo …?" },
        { w: "Why do you …?", es: "¿Por qué …?" },
      ],
      model:
        "Hello, Ms. Patel. Thank you for meeting with me. I am interviewing you for our class newsletter. What is your favorite part of being a school nurse? Can you tell me about a time you helped a student feel better?",
    },
  },
  {
    id: "poster-jobs-35",
    band: "3-5",
    theme: "collab",
    emoji: "🖍️",
    title: ["Sharing jobs on a group poster", "Repartir tareas en un cartel de grupo"],
    situation: [
      "Your group of four is making a poster about recycling. You and Leo both want to draw, and nobody has picked who writes the facts. You want to suggest a fair plan.",
      "Tu grupo de cuatro hace un cartel sobre el reciclaje. Tú y Leo quieren dibujar, y nadie ha elegido quién escribe los datos. Quieres sugerir un plan justo.",
    ],
    card: {
      audience: ["Your group: Leo, Mia and Jay", "Tu grupo: Leo, Mia y Jay"],
      purpose: [
        "Suggest a fair way to share the work",
        "Sugerir una forma justa de repartir el trabajo",
      ],
      setting: ["Group table in class", "Mesa de grupo en clase"],
      relationship: ["Classmates, equals", "Compañeros, iguales"],
      register: "informal",
      medium: ["Talking in a small group", "Hablar en un grupo pequeño"],
    },
    versions: [
      {
        id: "a",
        text: "I'm drawing. You guys write.",
        why: [
          "It decides for everyone without asking, and Leo wanted to draw too.",
          "Decide por todos sin preguntar, y Leo también quería dibujar.",
        ],
        when: [
          "A quick plan like this can fit when everyone already agreed, or in a game where you are the chosen leader.",
          "Un plan rápido así puede encajar cuando todos ya están de acuerdo, o en un juego donde te eligieron como líder.",
        ],
      },
      {
        id: "b",
        best: true,
        text: "What if we take turns? Leo and I could draw first, and Mia and Jay could write the facts. Then we switch. What do you think?",
        why: [
          "It suggests a plan, gives everyone a job, and asks the group what they think.",
          "Sugiere un plan, le da una tarea a cada uno y le pregunta al grupo qué opina.",
        ],
      },
      {
        id: "c",
        text: "Whatever. Do what you want.",
        why: [
          "The group needs your ideas to make a plan, and “whatever” can sound like you do not care.",
          "El grupo necesita tus ideas para hacer un plan, y «whatever» puede sonar como si no te importara.",
        ],
        when: [
          "Letting others choose can fit when you truly do not mind, said kindly: “Either way is fine with me.”",
          "Dejar que otros elijan puede encajar cuando de verdad no te importa, dicho con amabilidad: «Either way is fine with me.»",
        ],
      },
    ],
    shift: {
      change: [
        "What if you were sharing clean-up jobs with your little cousins at home?",
        "¿Y si repartieras las tareas de limpieza con tus primos pequeños en casa?",
      ],
      items: [
        {
          part: ["Making a suggestion", "Hacer una sugerencia"],
          changes: false,
          why: ["A clear plan helps any group.", "Un plan claro ayuda a cualquier grupo."],
        },
        {
          part: ["The words you use", "Las palabras que usas"],
          changes: true,
          why: [
            "With little cousins you might use simpler words, or the language you speak together at home.",
            "Con primos pequeños podrías usar palabras más sencillas, o el idioma que hablan juntos en casa.",
          ],
        },
        {
          part: ["Who gets to decide", "Quién decide"],
          changes: true,
          why: [
            "As the older one, you might be the leader at home. In class, the group decides together.",
            "Como el mayor, podrías ser el líder en casa. En clase, el grupo decide junto.",
          ],
        },
        {
          part: ["Giving everyone a job", "Darle una tarea a cada uno"],
          changes: false,
          why: [
            "Sharing the work fairly fits both places.",
            "Repartir el trabajo con justicia encaja en los dos lugares.",
          ],
        },
      ],
    },
    reflect: [
      "In your family or community, how do people share work in a group? How do you suggest an idea or disagree politely in the languages you know?",
      "En tu familia o comunidad, ¿cómo comparte la gente el trabajo en grupo? ¿Cómo sugieres una idea o no estás de acuerdo con cortesía en los idiomas que conoces?",
    ],
    task: {
      prompt: [
        "Your group must choose a topic for a science poster: animals or weather. Write what you would say to suggest one, give a reason, and ask what the others think.",
        "Tu grupo tiene que elegir un tema para un cartel de ciencias: los animales o el clima. Escribe lo que dirías para sugerir uno, dar una razón y preguntar qué piensan los demás.",
      ],
      register: "informal",
      medium: "spoken",
      needs: ["purpose", "suggest", "reason", "questions"],
      purposeWords: ["animals", "animal", "weather", "poster"],
      minQuestions: 1,
      minWords: 15,
      frames: [
        "What if we choose ___?",
        "I think ___ because ___.",
        "We could ___.",
        "What do you think?",
      ],
      words: [
        { w: "What if we …?", es: "¿Y si …?" },
        { w: "We could …", es: "Podríamos …" },
        { w: "because", es: "porque" },
        { w: "How about …?", es: "¿Qué tal …?" },
        { w: "What do you think?", es: "¿Qué opinan?" },
        { w: "fair", es: "justo" },
      ],
      model:
        "What if we choose weather for our poster? I think it is a good topic because we can draw clouds, rain and storms. We could each pick one kind of weather. What do you think?",
    },
  },
];
