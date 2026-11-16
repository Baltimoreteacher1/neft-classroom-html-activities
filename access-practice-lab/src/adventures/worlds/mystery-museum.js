// Mystery Museum (Adventure Worlds, ADVENTURE-SCHEMA.md): the Harbor Star Compass is missing from Gallery 3 of the
// Harbor Hill Museum. Learners read exhibit labels and lab records, interview staff, collect and weigh clues, explain
// their reasoning and present a solution. Same story in both bands; 3-5 has shorter texts and lighter language demand.
// Original story, place and characters.
const P = (en, es) => ({ en, es });
const E = (en) => ({ en });

// ── shared pieces ────────────────────────────────────────────────────────────
const GALLERY_CLUES_68 = [
  {
    id: "lock",
    text: E("The case lock is closed, and the metal around it has no scratches."),
    relevant: true,
    keys: ["lock", "scratches"],
    why: P(
      "A forced lock would leave marks. No scratches tells us how the case was opened.",
      "Una cerradura forzada dejaría marcas. Sin rayones sabemos cómo se abrió la vitrina.",
    ),
  },
  {
    id: "glass",
    text: E("The glass of the case is whole: no cracks and no fingerprints."),
    relevant: true,
    keys: ["glass", "cracks"],
    why: P(
      "Whole glass means nobody broke in through the top of the case.",
      "El vidrio entero significa que nadie entró rompiendo la parte de arriba.",
    ),
  },
  {
    id: "dust",
    text: E("A clean, smooth outline in the dust shows where the compass sat on its stand."),
    relevant: true,
    keys: ["outline", "dust", "smooth"],
    why: P(
      "A smooth outline means the compass was lifted straight up, carefully, not grabbed.",
      "Un contorno liso significa que alguien levantó la brújula con cuidado, sin jalarla.",
    ),
  },
  {
    id: "sensor",
    text: E("The small humidity sensor inside the case shows: ALERT 8:40 p.m."),
    relevant: true,
    keys: ["humidity", "sensor", "alert"],
    why: P(
      "The label says this case must stay dry. An alert means something changed inside the case that night.",
      "La etiqueta dice que esta vitrina debe estar seca. Una alerta significa que algo cambió dentro esa noche.",
    ),
  },
  {
    id: "mud",
    text: E("There are dried, muddy shoe prints under the gallery window."),
    relevant: false,
    why: P(
      "The window is locked from the inside, and the cleaning log says the window washer worked here on Tuesday. These prints are older than the missing compass.",
      "La ventana está cerrada por dentro y el registro de limpieza dice que el limpiador de ventanas trabajó aquí el martes. Estas huellas son más viejas que la desaparición.",
    ),
  },
  {
    id: "wrapper",
    text: E("A candy wrapper is lying under the visitor bench."),
    relevant: false,
    why: P(
      "Hundreds of visitors sit on this bench every week. A wrapper there does not tell us anything about the locked case.",
      "Cientos de visitantes se sientan en esta banca cada semana. Una envoltura ahí no nos dice nada sobre la vitrina cerrada.",
    ),
  },
];
const GALLERY_CLUES_35 = [
  {
    id: "lock",
    text: E("The lock is closed. It has no scratches."),
    relevant: true,
    keys: ["lock", "scratches"],
    why: P(
      "A broken lock would have marks. This lock has none.",
      "Una cerradura rota tendría marcas. Esta no tiene.",
    ),
  },
  {
    id: "glass",
    text: E("The glass is not broken."),
    relevant: true,
    keys: ["glass", "broken"],
    why: P("Nobody broke the glass to get in.", "Nadie rompió el vidrio para entrar."),
  },
  {
    id: "dust",
    text: E("The dust shows a neat circle where the compass sat."),
    relevant: true,
    keys: ["dust", "circle"],
    why: P(
      "A neat circle means someone lifted the compass carefully.",
      "Un círculo limpio significa que alguien levantó la brújula con cuidado.",
    ),
  },
  {
    id: "sensor",
    text: E("A little screen in the case says: ALERT 8:40 p.m."),
    relevant: true,
    keys: ["screen", "alert"],
    why: P(
      "The case must stay dry. The alert means something changed that night.",
      "La vitrina debe estar seca. La alerta significa que algo cambió esa noche.",
    ),
  },
  {
    id: "mud",
    text: E("There are old muddy footprints by the window."),
    relevant: false,
    why: P(
      "The window is locked. The window washer made these prints on Tuesday, before the compass went missing.",
      "La ventana está cerrada. El limpiador de ventanas dejó estas huellas el martes, antes de que faltara la brújula.",
    ),
  },
  {
    id: "wrapper",
    text: E("A candy wrapper is under the bench."),
    relevant: false,
    why: P(
      "Lots of visitors sit on this bench. A wrapper does not tell us about the case.",
      "Muchos visitantes se sientan en esta banca. Una envoltura no nos dice nada de la vitrina.",
    ),
  },
];

// ── mission 1: the empty case ────────────────────────────────────────────────
const emptyCase = {
  id: "the-empty-case",
  title: P("The Empty Case", "La vitrina vacía"),
  goal: P(
    "Read an exhibit label, collect clues and explain what they show.",
    "Leer una etiqueta de museo, reunir pistas y explicar lo que muestran.",
  ),
  keyUse: "Explain",
  domains: ["Reading", "Writing"],
  final: false,
  book: {
    templateId: "mission-report",
    title: P("Case File: The Empty Case", "Expediente: La vitrina vacía"),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-museum", "char-teacher"],
        speaker: "Ms. Ortega",
        listen: true,
        text: P(
          "Good morning, detective. I am Ms. Ortega, the head curator of the Harbor Hill Museum. Last night our most famous object, the Harbor Star Compass, disappeared from Gallery 3. The case is still locked, and nothing looks broken. Before we accuse anyone, I need someone who reads closely and follows the evidence. Will you take the case?",
          "Buenos días, detective. Soy la Sra. Ortega, curadora principal del Museo Harbor Hill. Anoche nuestro objeto más famoso, la Brújula Estrella del Puerto, desapareció de la Galería 3. La vitrina sigue cerrada con llave y nada parece roto. Antes de acusar a alguien, necesito a alguien que lea con atención y siga la evidencia. ¿Aceptas el caso?",
        ),
      },
      {
        kind: "read",
        title: P(
          "Exhibit label: The Harbor Star Compass",
          "Etiqueta del museo: La Brújula Estrella del Puerto",
        ),
        art: ["adv-compass"],
        text: E(
          "The Harbor Star Compass guided fishing boats in and out of this harbor for more than sixty years. Captain Rosa Medina carried it on her boat, the Morning Star, beginning in 1884. Sailors used the compass to navigate in fog, when they could not see the lighthouse or the stars. Its case is made of brass, a metal that shines like gold, and its needle is made of iron. The Medina family donated the compass to the museum in 1952. Today it is one of the oldest objects in our collection. Please note: this case is kept dry on purpose. When the air is damp, iron can rust and brass can corrode, slowly turning green or brown. A small sensor inside the case measures the humidity, the amount of water in the air, and sends an alert to our staff if the air becomes too wet.",
        ),
        glossary: [
          {
            word: "navigate",
            en: "to find the way from one place to another",
            es: "encontrar el camino de un lugar a otro",
          },
          { word: "donated", en: "gave as a gift", es: "donó, regaló" },
          {
            word: "corrode",
            en: "to be slowly damaged by water or air",
            es: "corroerse, dañarse poco a poco por el agua o el aire",
          },
          {
            word: "humidity",
            en: "the amount of water in the air",
            es: "humedad, la cantidad de agua en el aire",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Search Gallery 3. Collect 3 clues that help explain HOW the compass left a locked case.",
          "Revisa la Galería 3. Reúne 3 pistas que ayuden a explicar CÓMO salió la brújula de una vitrina cerrada.",
        ),
        need: 3,
        clues: GALLERY_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "The lock is closed and has no scratches, and the glass is whole. What does that suggest?",
          "La cerradura está cerrada y sin rayones, y el vidrio está entero. ¿Qué sugiere eso?",
        ),
        options: [
          {
            text: E("Someone broke the lock and then fixed it."),
            correct: false,
            feedback: P(
              "Look at your clue again: there are no scratches at all. Breaking a lock leaves marks, even if someone tries to fix it.",
              "Mira tu pista otra vez: no hay ningún rayón. Romper una cerradura deja marcas, aunque alguien intente arreglarla.",
            ),
          },
          {
            text: E("Someone opened the case with a key."),
            correct: true,
            feedback: P(
              "Yes. No damage means the case was most likely opened with a key. So the next question is: who has a key?",
              "Sí. Sin daños, lo más probable es que abrieran la vitrina con una llave. Entonces la siguiente pregunta es: ¿quién tiene llave?",
            ),
          },
          {
            text: E("The compass was never in the case."),
            correct: false,
            feedback: P(
              "The exhibit label and the outline in the dust both show the compass was there. Where would that outline come from?",
              "La etiqueta y el contorno en el polvo muestran que la brújula estaba ahí. ¿De dónde saldría ese contorno?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Mr. Bell, the night guard, dropped his notes. Put last night in order. Remember: Leo saw the compass when he set up chairs.",
          "Al Sr. Bell, el guardia de noche, se le cayeron sus notas. Ordena lo que pasó anoche. Recuerda: Leo vio la brújula cuando acomodó las sillas.",
        ),
        items: [
          E("The museum closes, and the last visitors leave."),
          E("Leo sets up chairs for family night and sees the compass in its case."),
          E("The humidity sensor in the case sends an alert."),
          E("Mr. Bell walks through Gallery 3 and finds the case empty but locked."),
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Case notes saved. You know the compass was lifted carefully from a locked case that was not damaged, and that the case sent a humidity alert that night.",
          "Notas guardadas. Sabes que alguien levantó la brújula con cuidado de una vitrina cerrada y sin daños, y que la vitrina mandó una alerta de humedad esa noche.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a case note for Ms. Ortega. Explain how the compass most likely left the case, and name the clues that show it.",
          "Escribe una nota del caso para la Sra. Ortega. Explica cómo salió la brújula de la vitrina y nombra las pistas que lo muestran.",
        ),
        frames: [
          E("The compass was probably ___, not ___."),
          E("The evidence is that ___."),
          E("This suggests ___ because ___."),
        ],
        wordBank: [
          "evidence",
          "key",
          "lock",
          "scratches",
          "outline",
          "carefully",
          "humidity",
          "suggests",
          "because",
          "so",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needWords: ["evidence"],
          needAny: [["key", "keys"]],
          evidenceFrom: "clues",
        },
        model: E(
          "The compass was probably taken out with a key, not stolen by someone who broke in. The evidence is that the lock is closed and has no scratches, and the glass has no cracks. The dust outline is smooth, so someone lifted the compass carefully. The humidity sensor sent an alert at 8:40 p.m., so something changed inside the case that night.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-museum", "char-teacher"],
        speaker: "Ms. Ortega",
        listen: true,
        text: P(
          "Hello, detective! I am Ms. Ortega. I take care of the Harbor Hill Museum. Last night our famous old compass went missing. The case is still locked. Nothing is broken. Can you help me find out what happened?",
          "¡Hola, detective! Soy la Sra. Ortega. Cuido el Museo Harbor Hill. Anoche desapareció nuestra famosa brújula antigua. La vitrina sigue cerrada con llave. Nada está roto. ¿Me ayudas a descubrir qué pasó?",
        ),
      },
      {
        kind: "read",
        title: P(
          "Exhibit label: The Harbor Star Compass",
          "Etiqueta del museo: La Brújula Estrella del Puerto",
        ),
        art: ["adv-compass"],
        text: E(
          "This compass helped fishing boats find their way home. Captain Rosa Medina used it on her boat in 1884. When fog came, sailors could not see the stars. The compass showed them which way was north. The compass is made of brass and iron. Brass is a shiny metal like gold. Please note: this case must stay dry. Wet air can damage old metal. A little sensor in the case checks the air. It sends an alert if the air gets too wet.",
        ),
        glossary: [
          {
            word: "compass",
            en: "a tool that shows which way is north",
            es: "brújula, una herramienta que muestra dónde está el norte",
          },
          { word: "fog", en: "a thick cloud close to the ground", es: "niebla" },
          {
            word: "sensor",
            en: "a small tool that measures something",
            es: "sensor, un aparato que mide algo",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Look around the room. Collect 3 clues that show HOW the compass left the case.",
          "Mira el cuarto. Reúne 3 pistas que muestren CÓMO salió la brújula de la vitrina.",
        ),
        need: 3,
        clues: GALLERY_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P(
          "The lock has no scratches. The glass is not broken. What do you think?",
          "La cerradura no tiene rayones. El vidrio no está roto. ¿Qué piensas?",
        ),
        options: [
          {
            text: E("Someone broke the glass."),
            correct: false,
            feedback: P(
              "Look at your clues. Is the glass broken?",
              "Mira tus pistas. ¿Está roto el vidrio?",
            ),
          },
          {
            text: E("Someone used a key to open the case."),
            correct: true,
            feedback: P(
              "Yes! Nothing is broken, so someone probably used a key. Who has a key?",
              "¡Sí! Nada está roto, así que alguien probablemente usó una llave. ¿Quién tiene llave?",
            ),
          },
          {
            text: E("The compass was never there."),
            correct: false,
            feedback: P(
              "The dust shows a circle where the compass sat. So it was there.",
              "El polvo muestra un círculo donde estaba la brújula. Entonces sí estaba ahí.",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Put last night in order. Leo saw the compass when he set up chairs.",
          "Ordena lo que pasó anoche. Leo vio la brújula cuando acomodó las sillas.",
        ),
        items: [
          E("The museum closes."),
          E("Leo sets up chairs and sees the compass."),
          E("The sensor sends an alert."),
          E("Mr. Bell finds the case empty."),
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Write a note to Ms. Ortega. How did the compass leave the case? Use your clues.",
          "Escribe una nota a la Sra. Ortega. ¿Cómo salió la brújula de la vitrina? Usa tus pistas.",
        ),
        frames: [E("I think someone ___."), E("I know because ___."), E("Another clue is ___.")],
        wordBank: [
          "key",
          "lock",
          "scratches",
          "glass",
          "broken",
          "dust",
          "circle",
          "because",
          "so",
        ],
        check: { minWords: 20, needConnectors: ["cause"], evidenceFrom: "clues" },
        model: E(
          "I think someone used a key to open the case. I know because the lock has no scratches and the glass is not broken. The dust circle is neat, so someone was careful.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Case notes saved! Nothing was broken, so someone probably used a key. The case also sent an alert that night.",
          "¡Notas guardadas! Nada estaba roto, así que alguien probablemente usó una llave. La vitrina también mandó una alerta esa noche.",
        ),
      },
    ],
  },
};

// ── mission 2: staff interviews ──────────────────────────────────────────────
const INTERVIEW_CLUES_68 = [
  {
    id: "light",
    text: E("Mr. Bell: “At about nine o'clock I saw a light under the conservation lab door.”"),
    relevant: true,
    keys: ["light", "conservation", "nine"],
    why: P(
      "Someone was working in the lab late at night, right after the alert. That is worth following.",
      "Alguien trabajaba en el laboratorio tarde en la noche, justo después de la alerta. Vale la pena seguir esa pista.",
    ),
  },
  {
    id: "staff-door",
    text: E("Mr. Bell: “The staff door beeped at 8:50. It only opens with a staff card.”"),
    relevant: true,
    keys: ["staff", "door", "card"],
    why: P(
      "Only staff can open that door, so a staff member came in after the museum closed.",
      "Solo el personal puede abrir esa puerta, así que alguien del personal entró después del cierre.",
    ),
  },
  {
    id: "vent",
    text: E(
      "Leo: “The air vent in Gallery 3 was turned off for repairs, and the room felt sticky and damp.”",
    ),
    relevant: true,
    keys: ["vent", "damp", "sticky"],
    why: P(
      "Damp air could explain the humidity alert in the case.",
      "El aire húmedo podría explicar la alerta de humedad de la vitrina.",
    ),
  },
  {
    id: "seen",
    text: E(
      "Leo: “The compass was in its case when I left at seven. I signed out at the front desk.”",
    ),
    relevant: true,
    keys: ["seven", "signed", "left"],
    why: P(
      "This tells us when the compass was last seen, and that Leo had left before the alert.",
      "Esto nos dice cuándo se vio la brújula por última vez y que Leo ya se había ido antes de la alerta.",
    ),
  },
  {
    id: "ships",
    text: E("Leo: “My favorite things in the museum are the ship models.”"),
    relevant: false,
    why: P(
      "That tells us about Leo, not about what happened to the compass.",
      "Eso nos dice algo de Leo, no de lo que le pasó a la brújula.",
    ),
  },
  {
    id: "cafe",
    text: E("Mr. Bell: “The café closed early because the coffee machine was broken.”"),
    relevant: false,
    why: P(
      "The café is on another floor and closed before the alert. It is not connected to the case.",
      "La cafetería está en otro piso y cerró antes de la alerta. No está conectada con la vitrina.",
    ),
  },
];
const INTERVIEW_CLUES_35 = [
  {
    id: "light",
    text: E("Mr. Bell: “I saw a light in the lab at nine.”"),
    relevant: true,
    keys: ["light", "lab"],
    why: P(
      "Someone was in the lab late at night.",
      "Alguien estaba en el laboratorio tarde en la noche.",
    ),
  },
  {
    id: "staff-door",
    text: E("Mr. Bell: “The staff door beeped. Only staff cards open it.”"),
    relevant: true,
    keys: ["staff", "door"],
    why: P(
      "A staff member came in after closing.",
      "Alguien del personal entró después del cierre.",
    ),
  },
  {
    id: "vent",
    text: E("Leo: “The air fan was off. The room felt wet and sticky.”"),
    relevant: true,
    keys: ["fan", "wet", "sticky"],
    why: P("Wet air can explain the alert.", "El aire húmedo puede explicar la alerta."),
  },
  {
    id: "seen",
    text: E("Leo: “The compass was there when I left at seven.”"),
    relevant: true,
    keys: ["seven", "left"],
    why: P("Now we know when it was last seen.", "Ahora sabemos cuándo se vio por última vez."),
  },
  {
    id: "ships",
    text: E("Leo: “I love the ship models.”"),
    relevant: false,
    why: P("That is about Leo, not about the compass.", "Eso es sobre Leo, no sobre la brújula."),
  },
  {
    id: "cafe",
    text: E("Mr. Bell: “The café closed early.”"),
    relevant: false,
    why: P(
      "The café is far from the case. It does not help.",
      "La cafetería está lejos de la vitrina. No ayuda.",
    ),
  },
];
const interviews = {
  id: "staff-interviews",
  title: P("Interview the Staff", "Entrevista al personal"),
  goal: P(
    "Listen to interviews, decide which statements matter, and retell the night in order.",
    "Escuchar entrevistas, decidir qué datos importan y contar la noche en orden.",
  ),
  keyUse: "Narrate",
  domains: ["Listening", "Speaking"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-museum", "char-amara"],
        speaker: "Amara",
        listen: true,
        text: P(
          "I'm Amara, the museum's student intern. I checked the key list: only two people have keys to Gallery 3 cases, Mr. Bell and Dr. Adeyemi, our conservator. Dr. Adeyemi is away at a conference this morning. Let's start with the people who were here last night.",
          "Soy Amara, la estudiante en prácticas del museo. Revisé la lista de llaves: solo dos personas tienen llaves de las vitrinas de la Galería 3, el Sr. Bell y la Dra. Adeyemi, nuestra conservadora. La Dra. Adeyemi está en una conferencia esta mañana. Empecemos con las personas que estuvieron aquí anoche.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P(
          "Interview with Mr. Bell, night guard",
          "Entrevista con el Sr. Bell, guardia de noche",
        ),
        script: E(
          "I start my rounds at eight o'clock. Everything was quiet. At eight fifty, I heard the staff door beep. That door only opens with a staff card, so I didn't worry. At about nine, I walked past the conservation lab and saw a light under the door. I thought someone forgot to turn it off. At nine thirty I reached Gallery 3, and the compass case was empty. The case was still locked. I have a key, but I never open the cases. That is not my job. Oh, and the café closed early because the coffee machine was broken.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Interview with Leo, volunteer", "Entrevista con Leo, voluntario"),
        script: E(
          "I set up the chairs for family night in Gallery 3 at about six thirty. The compass was in its case. I remember because I always stop to look at it. The room felt sticky and damp, because the air vent was turned off for repairs. I finished and signed out at the front desk at seven o'clock. My favorite things in the museum are the ship models, by the way.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Which statements help explain the empty case? Collect 3.",
          "¿Qué datos ayudan a explicar la vitrina vacía? Reúne 3.",
        ),
        need: 3,
        clues: INTERVIEW_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Who should the investigation talk to next?",
          "¿Con quién debe hablar la investigación ahora?",
        ),
        options: [
          {
            text: E("Dr. Adeyemi, the conservator, who has a key and a staff card."),
            correct: true,
            feedback: P(
              "Yes. She can open the cases and the staff door, and the lab light was on. Her records may explain the rest.",
              "Sí. Ella puede abrir las vitrinas y la puerta del personal, y la luz del laboratorio estaba encendida. Sus registros pueden explicar lo demás.",
            ),
          },
          {
            text: E("The café manager."),
            correct: false,
            feedback: P(
              "The café closed early and is on another floor. Which person could open both a locked case and the staff door?",
              "La cafetería cerró temprano y está en otro piso. ¿Qué persona podría abrir una vitrina cerrada y la puerta del personal?",
            ),
          },
          {
            text: E("A visitor from yesterday afternoon."),
            correct: false,
            feedback: P(
              "Visitors left when the museum closed, and Leo saw the compass after that. Who was in the building later?",
              "Los visitantes se fueron al cerrar el museo y Leo vio la brújula después. ¿Quién estuvo en el edificio más tarde?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Put the evening in order, using what you heard.",
          "Ordena la noche con lo que escuchaste.",
        ),
        items: [
          E("Leo sees the compass while he sets up chairs."),
          E("Leo signs out at the front desk."),
          E("The staff door beeps."),
          E("A light shines under the conservation lab door."),
          E("Mr. Bell finds the case empty and locked."),
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Report to Ms. Ortega: tell the story of last night in order. Use time words and the statements you collected.",
          "Informa a la Sra. Ortega: cuenta lo que pasó anoche en orden. Usa palabras de tiempo y los datos que reuniste.",
        ),
        frames: [
          E("First, ___."),
          E("After that, ___."),
          E("Then, at about ___, ___."),
          E("Finally, ___."),
        ],
        wordBank: [
          "first",
          "after that",
          "then",
          "finally",
          "staff door",
          "conservation lab",
          "light",
          "signed out",
          "damp",
        ],
        check: {
          minWords: 35,
          needConnectors: ["sequence"],
          needAny: [["door", "lab"]],
          evidenceFrom: "clues",
        },
        model: E(
          "First, Leo saw the compass in its case when he set up chairs, and he signed out at seven. The air vent was off, so the room felt damp. Then the staff door beeped at 8:50. After that, Mr. Bell saw a light under the conservation lab door at about nine. Finally, at 9:30 he found the case empty.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Interviews saved. A staff member came in at 8:50, the lab light was on at nine, and the damp gallery explains the alert. Next: the conservation lab.",
          "Entrevistas guardadas. Alguien del personal entró a las 8:50, la luz del laboratorio estaba encendida a las nueve y la galería húmeda explica la alerta. Siguiente: el laboratorio de conservación.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-museum", "char-amara"],
        speaker: "Amara",
        listen: true,
        text: P(
          "Hi! I'm Amara. I help at the museum. Only two people have keys to the cases: Mr. Bell, the night guard, and Dr. Adeyemi, who fixes old objects. Let's listen to the people who were here last night.",
          "¡Hola! Soy Amara. Ayudo en el museo. Solo dos personas tienen llaves de las vitrinas: el Sr. Bell, el guardia de noche, y la Dra. Adeyemi, que repara objetos antiguos. Escuchemos a las personas que estuvieron aquí anoche.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Mr. Bell, night guard", "El Sr. Bell, guardia de noche"),
        script: E(
          "I walk around the museum every night. At eight fifty, the staff door beeped. Only staff cards open that door. At nine, I saw a light in the lab. At nine thirty, I saw that the compass case was empty. The café closed early, too.",
        ),
      },
      {
        kind: "listen",
        transcriptLabel: P("Leo, volunteer", "Leo, voluntario"),
        script: E(
          "I set up chairs in the gallery. The compass was in its case. The air fan was off, so the room felt wet and sticky. I left at seven. I love the ship models!",
        ),
      },
      {
        kind: "clues",
        prompt: P("Which things help us? Collect 3.", "¿Qué cosas nos ayudan? Reúne 3."),
        need: 3,
        clues: INTERVIEW_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("Who should we ask next?", "¿A quién debemos preguntar ahora?"),
        options: [
          {
            text: E("Dr. Adeyemi, who has a key and a staff card."),
            correct: true,
            feedback: P(
              "Yes! She has a key and a staff card, and the lab light was on.",
              "¡Sí! Ella tiene llave y tarjeta del personal, y la luz del laboratorio estaba encendida.",
            ),
          },
          {
            text: E("The café cook."),
            correct: false,
            feedback: P(
              "The café closed early. Who can open the staff door?",
              "La cafetería cerró temprano. ¿Quién puede abrir la puerta del personal?",
            ),
          },
          {
            text: E("A visitor."),
            correct: false,
            feedback: P(
              "Visitors went home before Leo saw the compass. Who came later?",
              "Los visitantes se fueron antes de que Leo viera la brújula. ¿Quién llegó después?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P("Put the night in order.", "Ordena la noche."),
        items: [
          E("Leo sees the compass."),
          E("Leo goes home."),
          E("The staff door beeps."),
          E("Mr. Bell sees a light in the lab."),
          E("The case is empty."),
        ],
      },
      {
        kind: "respond",
        mode: "say",
        prompt: P(
          "Tell Ms. Ortega what happened last night, in order.",
          "Cuéntale a la Sra. Ortega lo que pasó anoche, en orden.",
        ),
        frames: [E("First, ___."), E("Next, ___."), E("Then, ___."), E("Last, ___.")],
        wordBank: ["first", "next", "then", "last", "staff door", "lab", "light", "beeped"],
        check: { minWords: 20, needConnectors: ["sequence"], evidenceFrom: "clues" },
        model: E(
          "First, Leo saw the compass and left at seven. Next, the staff door beeped. Then Mr. Bell saw a light in the lab. Last, the case was empty.",
        ),
      },
    ],
  },
};

// ── mission 3: the lab log ───────────────────────────────────────────────────
const LAB_CLUES_68 = [
  {
    id: "signout",
    text: E(
      "Lab sign-out sheet: “Harbor Star Compass, Gallery 3 → drying cabinet, 8:58 p.m., N.A.”",
    ),
    relevant: true,
    keys: ["sign", "drying", "cabinet"],
    why: P(
      "N.A. are Dr. Nia Adeyemi's initials, and 8:58 p.m. is just after the alert and the staff door beep.",
      "N.A. son las iniciales de la Dra. Nia Adeyemi, y las 8:58 p. m. es justo después de la alerta y del pitido de la puerta.",
    ),
  },
  {
    id: "log",
    text: E("Humidity log, Gallery 3 case: 41% at 6 p.m., 58% at 8 p.m., 72% at 8:40 p.m."),
    relevant: true,
    keys: ["41", "58", "72", "percent"],
    why: P(
      "The air in the case got wetter all evening, far above the safe level the guide gives for metal.",
      "El aire de la vitrina se volvió más húmedo toda la noche, muy por encima del nivel seguro para el metal.",
    ),
  },
  {
    id: "cabinet",
    text: E(
      "Through the drying cabinet's glass door you can see a brass object resting on a soft tray.",
    ),
    relevant: true,
    keys: ["brass", "tray", "cabinet"],
    why: P(
      "That looks like the compass, stored the way the guide says to protect metal.",
      "Parece la brújula, guardada como dice la guía para proteger el metal.",
    ),
  },
  {
    id: "workorder",
    text: E(
      "Work order: “Gallery 3 air vent OFF for repair, Thursday 4 p.m. until Friday 10 a.m.”",
    ),
    relevant: true,
    keys: ["vent", "repair", "work"],
    why: P(
      "With the vent off, nothing was drying the air. That is the cause of the rising humidity.",
      "Con la ventilación apagada, nada secaba el aire. Esa es la causa de la humedad en aumento.",
    ),
  },
  {
    id: "gloves",
    text: E("A box of new cotton gloves was delivered to the lab on Monday."),
    relevant: false,
    why: P(
      "The gloves arrived days before the compass went missing. They do not tell us what happened last night.",
      "Los guantes llegaron días antes de la desaparición. No nos dicen lo que pasó anoche.",
    ),
  },
  {
    id: "poster",
    text: E("A poster on the wall announces a dinosaur exhibit next spring."),
    relevant: false,
    why: P(
      "The poster is about a future exhibit. It has nothing to do with the compass.",
      "El cartel es sobre una exhibición futura. No tiene nada que ver con la brújula.",
    ),
  },
];
const LAB_CLUES_35 = [
  {
    id: "signout",
    text: E("The lab sheet says: “Compass to drying cabinet, 8:58 p.m., N.A.”"),
    relevant: true,
    keys: ["sheet", "drying", "cabinet"],
    why: P(
      "N.A. stands for Nia Adeyemi. She wrote this right after the alert!",
      "N.A. significa Nia Adeyemi. ¡Lo escribió justo después de la alerta!",
    ),
  },
  {
    id: "log",
    text: E("The case got wetter: 41% at 6 p.m., then 72% at 8:40 p.m."),
    relevant: true,
    keys: ["wetter", "41", "72"],
    why: P(
      "The air got too wet for old metal.",
      "El aire se volvió demasiado húmedo para el metal antiguo.",
    ),
  },
  {
    id: "cabinet",
    text: E("In the drying cabinet, there is a shiny brass object on a soft tray."),
    relevant: true,
    keys: ["brass", "tray"],
    why: P("That looks like the compass!", "¡Eso parece la brújula!"),
  },
  {
    id: "workorder",
    text: E("A note says the gallery air fan was off for repair."),
    relevant: true,
    keys: ["fan", "repair"],
    why: P(
      "No fan means wet air stayed in the room.",
      "Sin ventilador, el aire húmedo se quedó en el cuarto.",
    ),
  },
  {
    id: "gloves",
    text: E("New gloves came on Monday."),
    relevant: false,
    why: P("Monday was days ago. It does not help.", "El lunes fue hace días. No ayuda."),
  },
  {
    id: "poster",
    text: E("A poster shows a dinosaur."),
    relevant: false,
    why: P("The poster is not about the compass.", "El cartel no es sobre la brújula."),
  },
];
const labLog = {
  id: "the-lab-log",
  title: P("The Conservation Lab", "El laboratorio de conservación"),
  goal: P(
    "Read a lab guide and records, then explain a cause and its effect.",
    "Leer una guía y registros del laboratorio y explicar una causa y su efecto.",
  ),
  keyUse: "Explain",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-lab", "char-amara"],
        speaker: "Amara",
        listen: true,
        text: P(
          "Dr. Adeyemi's phone is off while she speaks at her conference. But a conservation lab keeps careful records, and the lab guide on the wall explains how they protect objects. Let's read it first, so we know what the records mean.",
          "El teléfono de la Dra. Adeyemi está apagado mientras habla en su conferencia. Pero un laboratorio de conservación guarda registros cuidadosos, y la guía en la pared explica cómo protegen los objetos. Leámosla primero para entender los registros.",
        ),
      },
      {
        kind: "read",
        title: P(
          "Lab guide: Caring for metal objects",
          "Guía del laboratorio: Cómo cuidar objetos de metal",
        ),
        art: ["bg-lab"],
        text: E(
          "Metal objects are damaged by water in the air. Scientists measure this as relative humidity, a percentage that shows how much water vapor the air is holding compared with the most it could hold. Iron starts to rust and brass starts to corrode faster when relative humidity climbs above about 55 percent. For that reason, our metal cases are kept below 45 percent. Each case has a sensor that records the humidity and sends an alert when it rises too high. If an alert happens, a conservator must act quickly. First, check the case. Next, if the air cannot be dried right away, move the object to the drying cabinet in this lab, where the air is kept very dry. Always handle metal with clean gloves, carry it on a padded tray, and write every move on the sign-out sheet: the object, where it went, the time and your initials. A record protects the object and keeps the team informed.",
        ),
        glossary: [
          {
            word: "relative humidity",
            en: "how much water the air holds compared with the most it could hold",
            es: "humedad relativa",
          },
          { word: "percentage", en: "a part of 100", es: "porcentaje, una parte de 100" },
          {
            word: "conservator",
            en: "an expert who protects and repairs old objects",
            es: "conservador, experto que protege y repara objetos antiguos",
          },
          { word: "initials", en: "the first letters of a person's names", es: "iniciales" },
        ],
      },
      {
        kind: "choice",
        prompt: P(
          "The lab is locked, and the sign-out sheet is inside. How will you get in?",
          "El laboratorio está cerrado con llave y la hoja de registro está adentro. ¿Cómo vas a entrar?",
        ),
        options: [
          {
            text: E("Ask Mr. Bell to unlock the lab and come with you."),
            correct: true,
            next: 3,
            feedback: P(
              "Good thinking: a staff member opens the door, and a witness sees everything you find.",
              "Buena idea: alguien del personal abre la puerta y un testigo ve todo lo que encuentras.",
            ),
          },
          {
            text: E("Ask Ms. Ortega for the spare lab key from the office."),
            correct: true,
            next: 4,
            feedback: P(
              "That works too. The curator keeps a spare key, and she will write down that you used it.",
              "Eso también funciona. La curadora guarda una llave de repuesto y anotará que la usaste.",
            ),
          },
          {
            text: E("Wait until Dr. Adeyemi comes back next week."),
            correct: false,
            feedback: P(
              "The museum is worried right now, and the records are just behind that door. Is there someone here today who can open it?",
              "El museo está preocupado ahora mismo y los registros están detrás de esa puerta. ¿Hay alguien aquí hoy que pueda abrirla?",
            ),
          },
        ],
      },
      {
        kind: "story",
        art: ["bg-lab", "char-dad"],
        speaker: "Mr. Bell",
        listen: true,
        text: P(
          "Here we go. Staff only, so stay with me. Look, the sign-out sheet is on the clipboard by the door, and the drying cabinet is in the corner. I'll write in my notebook that we came in together.",
          "Aquí vamos. Solo personal, así que quédate conmigo. Mira, la hoja de registro está en la tablilla junto a la puerta, y el gabinete de secado está en la esquina. Anotaré en mi cuaderno que entramos juntos.",
        ),
      },
      {
        kind: "clues",
        prompt: P(
          "Search the lab. Collect 3 records that explain what happened to the compass.",
          "Revisa el laboratorio. Reúne 3 registros que expliquen qué le pasó a la brújula.",
        ),
        need: 3,
        clues: LAB_CLUES_68,
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Explain the chain of cause and effect: why did the compass leave its case last night?",
          "Explica la cadena de causa y efecto: ¿por qué salió la brújula de su vitrina anoche?",
        ),
        frames: [
          E("Because the air vent was ___, the humidity ___."),
          E("As a result, ___."),
          E("The records show that ___."),
        ],
        wordBank: [
          "humidity",
          "vent",
          "rose",
          "percent",
          "alert",
          "drying cabinet",
          "as a result",
          "because",
          "sign-out sheet",
        ],
        check: {
          minWords: 45,
          needConnectors: ["cause"],
          needWords: ["humidity"],
          evidenceFrom: "clues",
        },
        model: E(
          "Because the Gallery 3 air vent was off for repair, nothing was drying the air, and the humidity in the case rose from 41 percent to 72 percent. As a result, the sensor sent an alert. The sign-out sheet shows that N.A. moved the compass to the drying cabinet at 8:58 p.m. to protect the brass from damp air.",
        ),
      },
      {
        kind: "checkpoint",
        text: P(
          "Lab records saved. The vent was off, the humidity rose, the alert went off, and the compass was moved to the drying cabinet at 8:58 p.m.",
          "Registros guardados. La ventilación estaba apagada, la humedad subió, sonó la alerta y la brújula se movió al gabinete de secado a las 8:58 p. m.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-lab", "char-amara"],
        speaker: "Amara",
        listen: true,
        text: P(
          "Dr. Adeyemi is away today. But her lab keeps notes about everything. Let's read the lab rules first.",
          "La Dra. Adeyemi no está hoy. Pero su laboratorio anota todo. Leamos primero las reglas del laboratorio.",
        ),
      },
      {
        kind: "read",
        title: P("Lab rules: Keep metal dry", "Reglas del laboratorio: Mantén seco el metal"),
        art: ["bg-lab"],
        text: E(
          "Old metal does not like wet air. Wet air can make iron rust. It can turn brass green. So we keep metal cases dry. A sensor checks the air in each case. If the air gets too wet, the sensor sends an alert. Then a helper must move the object to the drying cabinet. The air in the cabinet is very dry. Always wear gloves. Always write on the sign-out sheet: what you moved, where, and when.",
        ),
        glossary: [
          { word: "rust", en: "red-brown damage on iron", es: "óxido" },
          {
            word: "cabinet",
            en: "a closet with doors and shelves",
            es: "gabinete, mueble con puertas",
          },
          {
            word: "sign-out sheet",
            en: "a paper where people write what they took",
            es: "hoja de registro",
          },
        ],
      },
      {
        kind: "choice",
        prompt: P(
          "The lab door is locked. What should we do?",
          "La puerta del laboratorio está cerrada. ¿Qué hacemos?",
        ),
        options: [
          {
            text: E("Ask Mr. Bell to open it and come with us."),
            correct: true,
            next: 3,
            feedback: P("Yes! He has a key and can watch.", "¡Sí! Él tiene llave y puede mirar."),
          },
          {
            text: E("Ask Ms. Ortega for the extra key."),
            correct: true,
            next: 4,
            feedback: P(
              "Good idea! She keeps an extra key.",
              "¡Buena idea! Ella guarda una llave extra.",
            ),
          },
          {
            text: E("Go home and wait."),
            correct: false,
            feedback: P(
              "The notes are right behind the door. Who can open it today?",
              "Las notas están detrás de la puerta. ¿Quién puede abrirla hoy?",
            ),
          },
        ],
      },
      {
        kind: "story",
        art: ["bg-lab", "char-dad"],
        speaker: "Mr. Bell",
        listen: true,
        text: P(
          "Here is the lab. Stay with me. The sign-out sheet is by the door.",
          "Aquí está el laboratorio. Quédate conmigo. La hoja de registro está junto a la puerta.",
        ),
      },
      {
        kind: "clues",
        prompt: P("Look around the lab. Collect 3 clues.", "Mira el laboratorio. Reúne 3 pistas."),
        need: 3,
        clues: LAB_CLUES_35,
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Why did the compass leave its case? Explain the cause.",
          "¿Por qué salió la brújula de su vitrina? Explica la causa.",
        ),
        frames: [E("The air got ___ because ___."), E("So ___."), E("The sheet shows ___.")],
        wordBank: ["wet", "fan", "off", "alert", "drying cabinet", "because", "so", "sheet"],
        check: { minWords: 20, needConnectors: ["cause"], evidenceFrom: "clues" },
        model: E(
          "The air got too wet because the fan was off for repair. So the sensor sent an alert. The sheet shows that N.A. moved the compass to the drying cabinet.",
        ),
      },
    ],
  },
};

// ── mission 4 (final): case closed ───────────────────────────────────────────
const FINAL_CLUES_68 = [
  {
    id: "signout",
    text: E("The lab sign-out sheet: compass moved to the drying cabinet at 8:58 p.m. by N.A."),
    relevant: true,
    keys: ["sign", "drying", "cabinet"],
    why: P(
      "A written record of who moved the compass, where and when.",
      "Un registro escrito de quién movió la brújula, adónde y cuándo.",
    ),
  },
  {
    id: "humidity",
    text: E("The case humidity rose from 41% to 72% while the vent was off."),
    relevant: true,
    keys: ["humidity", "41", "72", "vent"],
    why: P(
      "This is the reason someone had to move the compass.",
      "Esta es la razón por la que alguien tuvo que mover la brújula.",
    ),
  },
  {
    id: "lock",
    text: E("The case was opened with a key: no scratches and no broken glass."),
    relevant: true,
    keys: ["lock", "scratches", "key"],
    why: P("It rules out a break-in.", "Descarta que alguien entrara a la fuerza."),
  },
  {
    id: "note",
    text: E("The note found behind the case: “Compass moved to lab, air too damp. N.A.”"),
    relevant: true,
    keys: ["note", "behind", "damp"],
    why: P(
      "It confirms the plan in Dr. Adeyemi's own words.",
      "Confirma el plan con las propias palabras de la Dra. Adeyemi.",
    ),
  },
  {
    id: "mud",
    text: E("The muddy prints under the window."),
    relevant: false,
    why: P(
      "These are from Tuesday's window washer. They do not support a claim about last night.",
      "Son del limpiador de ventanas del martes. No apoyan una afirmación sobre anoche.",
    ),
  },
  {
    id: "ships",
    text: E("Leo's favorite exhibit is the ship models."),
    relevant: false,
    why: P(
      "True, but it says nothing about where the compass is.",
      "Es cierto, pero no dice nada de dónde está la brújula.",
    ),
  },
];
const FINAL_CLUES_35 = [
  {
    id: "signout",
    text: E("The lab sheet: N.A. moved the compass to the drying cabinet."),
    relevant: true,
    keys: ["sheet", "drying", "cabinet"],
    why: P("It tells who moved it and where.", "Dice quién la movió y adónde."),
  },
  {
    id: "humidity",
    text: E("The air in the case got too wet when the fan was off."),
    relevant: true,
    keys: ["wet", "fan"],
    why: P("That is why it had to move.", "Por eso tuvo que moverse."),
  },
  {
    id: "lock",
    text: E("Nothing was broken. Someone used a key."),
    relevant: true,
    keys: ["broken", "key"],
    why: P("So nobody broke in.", "Entonces nadie entró a la fuerza."),
  },
  {
    id: "note",
    text: E("A note behind the case: “Moved to lab, air too wet. N.A.”"),
    relevant: true,
    keys: ["note", "behind"],
    why: P("Dr. Adeyemi wrote it herself!", "¡La Dra. Adeyemi la escribió ella misma!"),
  },
  {
    id: "mud",
    text: E("Old mud by the window."),
    relevant: false,
    why: P("The mud is from Tuesday.", "El lodo es del martes."),
  },
  {
    id: "ships",
    text: E("Leo likes the ship models."),
    relevant: false,
    why: P("That does not tell us where the compass is.", "Eso no nos dice dónde está la brújula."),
  },
];
const caseClosed = {
  id: "case-closed",
  title: P("Case Closed: Present Your Solution", "Caso cerrado: presenta tu solución"),
  goal: P(
    "Choose your strongest evidence and argue for a solution, with a recommendation.",
    "Elegir tu evidencia más fuerte y defender una solución, con una recomendación.",
  ),
  keyUse: "Argue",
  domains: ["Reading", "Writing", "Speaking"],
  final: true,
  book: {
    templateId: "mission-report",
    title: P(
      "Case Closed: The Harbor Star Compass",
      "Caso cerrado: La Brújula Estrella del Puerto",
    ),
  },
  bands: {
    "6-8": [
      {
        kind: "story",
        art: ["bg-museum", "char-teacher", "char-scientist"],
        speaker: "Ms. Ortega",
        listen: true,
        text: P(
          "The whole team is gathering in Gallery 3: Mr. Bell, Leo, Amara, and Dr. Adeyemi, who just got back. Before you present, read the report the maintenance crew left on my desk this morning.",
          "Todo el equipo se reúne en la Galería 3: el Sr. Bell, Leo, Amara y la Dra. Adeyemi, que acaba de volver. Antes de presentar, lee el informe que el equipo de mantenimiento dejó en mi escritorio esta mañana.",
        ),
      },
      {
        kind: "read",
        title: P("Maintenance report: Gallery 3", "Informe de mantenimiento: Galería 3"),
        art: ["adv-empty-case"],
        text: E(
          "At 10:05 a.m. on Friday, the maintenance crew finished fixing the Gallery 3 air vent and turned it back on. The fan blows air toward the compass case, which sits right in front of the vent. When the crew moved the case a few centimeters to test the airflow, they found a folded index card on the floor behind it. The card was handwritten: “Compass moved to the lab, air too damp. Back when the vent is fixed. N.A.” The crew thinks the card was taped to the front of the case last night, and the strong air from the vent, which was turned on early this morning for a test, blew it off and behind the case. The crew recommends taping notes inside a clear sleeve or writing them in the gallery logbook, so that they cannot be lost.",
        ),
        glossary: [
          {
            word: "maintenance",
            en: "work that keeps a building working well",
            es: "mantenimiento",
          },
          { word: "airflow", en: "the way air moves through a space", es: "flujo de aire" },
          { word: "handwritten", en: "written by hand, not printed", es: "escrito a mano" },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Build your evidence board for the presentation. Choose your 3 strongest pieces of evidence.",
          "Arma tu tablero de evidencia para la presentación. Elige tus 3 evidencias más fuertes.",
        ),
        need: 3,
        clues: FINAL_CLUES_68,
      },
      {
        kind: "choice",
        prompt: P(
          "Which claim does the evidence support best?",
          "¿Qué afirmación apoya mejor la evidencia?",
        ),
        options: [
          {
            text: E("Dr. Adeyemi moved the compass to the lab to protect it from damp air."),
            correct: true,
            feedback: P(
              "Yes. The records, the humidity data and her own note all point to the same claim.",
              "Sí. Los registros, los datos de humedad y su propia nota apuntan a la misma afirmación.",
            ),
          },
          {
            text: E("A thief climbed in through the window and took the compass."),
            correct: false,
            feedback: P(
              "Check your evidence board: the window was locked, and the prints are from Tuesday. Which records show where the compass went?",
              "Revisa tu tablero: la ventana estaba cerrada y las huellas son del martes. ¿Qué registros muestran adónde fue la brújula?",
            ),
          },
          {
            text: E("Leo hid the compass as a joke."),
            correct: false,
            feedback: P(
              "Leo signed out at seven, and the compass was still in its case when he left. Who was in the building at 8:58?",
              "Leo firmó su salida a las siete y la brújula seguía en su vitrina cuando se fue. ¿Quién estaba en el edificio a las 8:58?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Plan your presentation. Put the parts in an order the team can follow.",
          "Planea tu presentación. Ordena las partes para que el equipo pueda seguirte.",
        ),
        items: [
          E("State your claim about what happened to the compass."),
          E("Give your first piece of evidence."),
          E("Give your second piece of evidence."),
          E("Explain how the evidence proves the claim."),
          E("Recommend one change so this does not happen again."),
        ],
      },
      {
        kind: "checkpoint",
        text: P(
          "Plan saved. Claim, evidence, reasoning, recommendation. Now present your solution in your own words.",
          "Plan guardado. Afirmación, evidencia, razonamiento, recomendación. Ahora presenta tu solución con tus palabras.",
        ),
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Present your solution to the museum team. Make a claim, give at least two pieces of evidence, explain your reasoning, and recommend one change.",
          "Presenta tu solución al equipo del museo. Haz una afirmación, da al menos dos evidencias, explica tu razonamiento y recomienda un cambio.",
        ),
        frames: [
          E("I can prove that ___."),
          E("The first piece of evidence is ___."),
          E("Another piece of evidence is ___."),
          E("This shows ___ because ___."),
          E("I recommend that ___."),
        ],
        wordBank: [
          "claim",
          "evidence",
          "proves",
          "humidity",
          "sign-out sheet",
          "note",
          "because",
          "therefore",
          "recommend",
          "logbook",
        ],
        check: {
          minWords: 70,
          needConnectors: ["cause"],
          needWords: ["evidence"],
          needAny: [["recommend", "should", "suggest"]],
          evidenceFrom: "clues",
        },
        model: E(
          "The compass was not stolen. Dr. Adeyemi moved it to the conservation lab to protect it from damp air. The first piece of evidence is the sign-out sheet, which says N.A. moved the compass to the drying cabinet at 8:58 p.m. Another piece of evidence is the humidity log: the case rose from 41 percent to 72 percent while the vent was off. This shows she acted because the air was too wet for the brass, and her note behind the case says the same thing. I recommend that the team writes every move in the gallery logbook, so a note cannot get lost again.",
        ),
      },
    ],
    "3-5": [
      {
        kind: "story",
        art: ["bg-museum", "char-teacher", "char-scientist"],
        speaker: "Ms. Ortega",
        listen: true,
        text: P(
          "Everyone is here, and Dr. Adeyemi is back! Before you share your answer, read this report from the repair team.",
          "¡Todos están aquí y la Dra. Adeyemi volvió! Antes de compartir tu respuesta, lee este informe del equipo de reparación.",
        ),
      },
      {
        kind: "read",
        title: P("Repair team report", "Informe del equipo de reparación"),
        art: ["adv-empty-case"],
        text: E(
          "This morning our repair team fixed the air fan in Gallery 3. We moved the compass case a little to check the fan. Behind the case we found a small card on the floor. It said: “Compass moved to the lab. The air is too wet. N.A.” We think the card was taped to the case. The fan blew it off! Next time, please put notes in the gallery logbook so they do not get lost.",
        ),
        glossary: [
          { word: "repair", en: "to fix something", es: "reparar, arreglar" },
          {
            word: "logbook",
            en: "a notebook where people write what happened",
            es: "bitácora, cuaderno de registro",
          },
        ],
      },
      {
        kind: "clues",
        prompt: P(
          "Pick your 3 best clues for your answer.",
          "Elige tus 3 mejores pistas para tu respuesta.",
        ),
        need: 3,
        clues: FINAL_CLUES_35,
      },
      {
        kind: "choice",
        prompt: P("What happened to the compass?", "¿Qué le pasó a la brújula?"),
        options: [
          {
            text: E("Dr. Adeyemi moved it to keep it dry and safe."),
            correct: true,
            feedback: P(
              "Yes! The sheet, the wet air and the note all show it.",
              "¡Sí! La hoja, el aire húmedo y la nota lo muestran.",
            ),
          },
          {
            text: E("A thief took it through the window."),
            correct: false,
            feedback: P(
              "The window was locked, and the mud is old. Which clue tells where the compass went?",
              "La ventana estaba cerrada y el lodo es viejo. ¿Qué pista dice adónde fue la brújula?",
            ),
          },
          {
            text: E("Leo took it home."),
            correct: false,
            feedback: P(
              "The compass was still there when Leo left. Who wrote on the lab sheet?",
              "La brújula seguía ahí cuando Leo se fue. ¿Quién escribió en la hoja del laboratorio?",
            ),
          },
        ],
      },
      {
        kind: "order",
        prompt: P(
          "Plan what you will say. Put the parts in order.",
          "Planea lo que vas a decir. Ordena las partes.",
        ),
        items: [
          E("Say what happened."),
          E("Give one clue."),
          E("Give another clue."),
          E("Say how we can stop this next time."),
        ],
      },
      {
        kind: "respond",
        mode: "write",
        prompt: P(
          "Tell the museum team what happened. Use two clues. Then say how to stop it from happening again.",
          "Dile al equipo del museo qué pasó. Usa dos pistas. Luego di cómo evitar que vuelva a pasar.",
        ),
        frames: [
          E("The compass was not stolen. ___."),
          E("One clue is ___."),
          E("Another clue is ___."),
          E("Next time, we should ___."),
        ],
        wordBank: [
          "clue",
          "sheet",
          "note",
          "wet",
          "fan",
          "drying cabinet",
          "because",
          "should",
          "logbook",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [["should", "recommend"]],
          evidenceFrom: "clues",
        },
        model: E(
          "The compass was not stolen. Dr. Adeyemi moved it to the lab to keep it dry. One clue is the lab sheet that says she moved it to the drying cabinet. Another clue is the note behind the case. She moved it because the air got too wet when the fan was off. Next time, we should write notes in the logbook.",
        ),
      },
    ],
  },
};

export default {
  id: "mystery-museum",
  title: P("Mystery Museum", "El museo misterioso"),
  tagline: P(
    "A famous compass is missing. Read, question and follow the evidence.",
    "Falta una brújula famosa. Lee, pregunta y sigue la evidencia.",
  ),
  theme: {
    bg: "bg-museum",
    accent: "#8a3a5c",
    soft: "#f8e8ef",
    ink: "#5a1e3a",
    hero: ["char-detective", "char-amara"],
  },
  intro: P(
    "The Harbor Star Compass has vanished from a locked case at the Harbor Hill Museum. You are the detective. Read the exhibit labels, interview the staff, sort strong clues from weak ones, and present a solution the whole team can trust.",
    "La Brújula Estrella del Puerto desapareció de una vitrina cerrada del Museo Harbor Hill. Tú eres quien investiga. Lee las etiquetas, entrevista al personal, separa las pistas fuertes de las débiles y presenta una solución en la que todo el equipo pueda confiar.",
  ),
  guide: { name: "Ms. Ortega", art: "char-teacher" },
  missions: [emptyCase, interviews, labLog, caseClosed],
};
