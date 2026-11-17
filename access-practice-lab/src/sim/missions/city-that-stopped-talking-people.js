// THE CITY THAT STOPPED TALKING: the six people of Calder Bay (original content). Each has a role, a way of
// speaking, something they want, and topics that are ALL they know. Later topics open after an earlier answer or a
// piece of evidence (memory and follow-ups); each person has at least one clarification exchange, and two of those
// clarifications change what the first account meant.
const act = (id) => ({ act: id });

export const characters = [
  {
    id: "coordinator",
    name: "Imani Okafor",
    role: ["City coordinator", "Coordinadora de la ciudad"],
    scene: "square",
    look: { skin: "#8d5524", hair: "#1b1b1b", style: "braids", shirt: "#123a5c", acc: "none" },
    style: [
      "Calm and organized. She speaks in short, clear steps.",
      "Tranquila y organizada. Habla en pasos cortos y claros.",
    ],
    wants: [
      "One clear statement of the problem, and a recommendation she can take to the Emergency Operations Room.",
      "Una explicación clara del problema y una recomendación que pueda llevar a la Sala de Operaciones de Emergencia.",
    ],
    greeting: [
      "Thank you for coming. The city cannot talk to itself this morning, and I need someone who will look before they guess.",
      "Gracias por venir. Esta mañana la ciudad no puede hablar consigo misma, y necesito a alguien que mire antes de adivinar.",
    ],
    fallback: [
      "I cannot help with that one. Ask me what happened this morning, what I need from you, or where to look.",
      "Con eso no puedo ayudarte. Pregúntame qué pasó esta mañana, qué necesito de ti o dónde buscar.",
    ],
    topics: [
      {
        id: "what-happened",
        ask: ["What happened this morning?", "¿Qué pasó esta mañana?"],
        keywords: [
          "happened",
          "happen",
          "morning",
          "problem",
          "wrong",
          "paso",
          "manana",
          "problema",
        ],
        answer: [
          "At ten past six, calls, texts and the city radio stopped. Not in one place: the reports come from four neighborhoods. People can still talk face to face, so they are leaving notes on the board.",
          "A las seis y diez se detuvieron las llamadas, los mensajes y la radio de la ciudad. No fue en un solo lugar: los avisos vienen de cuatro barrios. La gente todavía puede hablar en persona, así que deja notas en el tablero.",
        ],
        clarify: {
          ask: [
            'When you say "stopped", do you mean no signal at all, or messages that do not arrive?',
            'Cuando dices "se detuvieron", ¿quieres decir que no hay señal o que los mensajes no llegan?',
          ],
          answer: [
            "Good question. Phones still show a signal. Messages leave, but they never arrive. That is why I call it a delivery problem.",
            "Buena pregunta. Los teléfonos todavía muestran señal. Los mensajes salen, pero nunca llegan. Por eso digo que es un problema de entrega.",
          ],
        },
      },
      {
        id: "your-job",
        ask: ["What do you need from me?", "¿Qué necesitas de mí?"],
        keywords: ["need", "help", "job", "task", "necesitas", "ayuda", "trabajo", "tarea"],
        answer: [
          "Find out why messages stopped arriving. Collect evidence, not guesses. Then tell Chief Brooks in the Emergency Operations Room what the city should do.",
          "Averigua por qué los mensajes dejaron de llegar. Reúne evidencia, no suposiciones. Después dile a la jefa Brooks, en la Sala de Operaciones de Emergencia, qué debe hacer la ciudad.",
        ],
      },
      {
        id: "where-to-look",
        ask: ["Where should I look?", "¿Dónde debo buscar?"],
        keywords: ["where", "look", "places", "start", "donde", "buscar", "lugares", "empezar"],
        answer: [
          "Four places know part of the story: the Science Laboratory, the Newsroom, the Communication Center, and the people here in the square. Nobody knows all of it.",
          "Cuatro lugares conocen una parte de la historia: el Laboratorio de Ciencias, la Redacción, el Centro de Comunicación y la gente de esta plaza. Nadie la conoce completa.",
        ],
      },
      {
        id: "ops-ready",
        requires: act("decide"),
        ask: [
          "Is the Emergency Operations Room ready for me?",
          "¿La Sala de Operaciones de Emergencia está lista para mí?",
        ],
        keywords: [
          "operations",
          "emergency",
          "ready",
          "chief",
          "brooks",
          "sala",
          "emergencia",
          "lista",
          "jefa",
        ],
        answer: [
          "Yes. Chief Brooks is waiting. Bring your evidence notebook. She will ask which explanation you choose, and why.",
          "Sí. La jefa Brooks te espera. Lleva tu cuaderno de evidencia. Te preguntará qué explicación eliges y por qué.",
        ],
      },
    ],
  },
  {
    id: "resident",
    name: "Abel Haddad",
    role: ["Resident, retired ferry pilot", "Vecino, piloto de ferry jubilado"],
    scene: "square",
    look: { skin: "#e0ac84", hair: "#b9b4ac", style: "cap", shirt: "#5a9481", acc: "glasses" },
    style: [
      "Friendly. He tells stories and is very sure of what he remembers.",
      "Amable. Cuenta historias y está muy seguro de lo que recuerda.",
    ],
    wants: [
      "To reach his daughter, who drives the early ferry.",
      "Comunicarse con su hija, que conduce el primer ferry.",
    ],
    greeting: [
      "Ah, an investigator! Good. I was there for the whole storm. Ask me anything.",
      "¡Ah, alguien que investiga! Qué bien. Estuve despierto toda la tormenta. Pregúntame lo que quieras.",
    ],
    fallback: [
      "I do not know about that. I can tell you what I noticed last night, about the sign on the corner, or who I am trying to call.",
      "De eso no sé. Puedo contarte lo que noté anoche, hablarte del letrero de la esquina o decirte a quién quiero llamar.",
    ],
    topics: [
      {
        id: "last-night",
        ask: ["What did you notice last night?", "¿Qué notaste anoche?"],
        keywords: [
          "notice",
          "noticed",
          "night",
          "storm",
          "lightning",
          "saw",
          "notaste",
          "noche",
          "tormenta",
          "rayo",
        ],
        answer: [
          "It was the storm, I am sure. Lightning hit near Harbor Hill around midnight, and my phone went dark right then. The tower is on that hill.",
          "Fue la tormenta, estoy seguro. Un rayo cayó cerca de Harbor Hill hacia la medianoche, y mi teléfono se apagó en ese momento. La torre está en esa colina.",
        ],
        again: [
          "As I said, it was the storm. Midnight, lightning, and my phone went dark.",
          "Como dije, fue la tormenta. Medianoche, un rayo, y mi teléfono se apagó.",
        ],
        gives: ["storm-memory"],
        clarify: {
          ask: [
            "Was your phone dark because of the network, or because the power went out?",
            "¿Tu teléfono se apagó por la red o porque se fue la luz?",
          ],
          answer: [
            "Hm. Now that you ask... the lights flickered, and my phone was charging. It came back on. And my kitchen radio played music until the six o'clock chime. Then it went quiet.",
            "Mmm. Ahora que lo preguntas... las luces parpadearon y mi teléfono se estaba cargando. Volvió a encenderse. Y la radio de mi cocina tocó música hasta la campanada de las seis. Después se calló.",
          ],
          gives: ["chime-memory"],
        },
      },
      {
        id: "daughter",
        ask: ["Who are you trying to reach?", "¿Con quién quieres comunicarte?"],
        keywords: [
          "reach",
          "call",
          "daughter",
          "family",
          "comunicarte",
          "llamar",
          "hija",
          "familia",
        ],
        answer: [
          'My daughter Samira. She drives the early ferry. I send her a message every morning at six. Today it says "sent", but she never answered.',
          'Con mi hija Samira. Conduce el primer ferry. Le mando un mensaje todas las mañanas a las seis. Hoy dice "enviado", pero ella no respondió.',
        ],
      },
      {
        id: "sign",
        requires: { has: "bent-sign" },
        ask: [
          "Did the storm bend the sign on the corner?",
          "¿La tormenta dobló el letrero de la esquina?",
        ],
        keywords: [
          "sign",
          "branch",
          "bent",
          "bend",
          "wind",
          "corner",
          "letrero",
          "rama",
          "doblo",
          "viento",
          "esquina",
        ],
        answer: [
          "Oh yes. The wind did that around one o'clock. I heard it fall. A strong wind, but it was over before I went back to sleep.",
          "Ah, sí. Fue el viento, como a la una. Lo oí caer. Un viento fuerte, pero terminó antes de que yo volviera a dormir.",
        ],
      },
    ],
  },
  {
    id: "scientist",
    name: "Dr. Wen Li",
    role: ["Scientist", "Científica"],
    scene: "lab",
    look: { skin: "#f1c9a5", hair: "#1b1b1b", style: "ponytail", shirt: "#0f766e", acc: "glasses" },
    style: [
      "Precise and careful. She always says how sure she is.",
      "Precisa y cuidadosa. Siempre dice qué tan segura está.",
    ],
    wants: [
      "To test an explanation before anyone believes it.",
      "Poner a prueba una explicación antes de que alguien la crea.",
    ],
    greeting: [
      "Welcome to the laboratory. I have data, and I have questions. Which do you want first?",
      "Te doy la bienvenida al laboratorio. Tengo datos y tengo preguntas. ¿Qué quieres primero?",
    ],
    fallback: [
      "I have no data on that, so I will not guess. I can talk about the storm, about how to test an explanation, or about the relay channel if you bring me the log.",
      "No tengo datos sobre eso, así que no voy a adivinar. Puedo hablar de la tormenta, de cómo poner a prueba una explicación o del canal del relé si me traes el registro.",
    ],
    topics: [
      {
        id: "storm",
        ask: ["Could the storm have caused this?", "¿Pudo causarlo la tormenta?"],
        keywords: [
          "storm",
          "weather",
          "lightning",
          "rain",
          "wind",
          "tormenta",
          "clima",
          "rayo",
          "lluvia",
          "viento",
        ],
        answer: [
          "It is possible, but the timing does not fit well. My station shows the storm ended at 2:05. The messages stopped four hours later. Damage usually shows at once. I would call the storm unlikely, not impossible.",
          "Es posible, pero las horas no encajan bien. Mi estación muestra que la tormenta terminó a las 2:05. Los mensajes se detuvieron cuatro horas después. El daño casi siempre se nota de inmediato. Yo diría que la tormenta es poco probable, no imposible.",
        ],
        clarify: {
          ask: [
            "What would make you sure about the storm?",
            "¿Qué te haría estar segura sobre la tormenta?",
          ],
          answer: [
            "A look at the antenna itself. If the antenna is whole and its signal light is green, the storm is ruled out. The technician inspects it every morning.",
            "Mirar la antena misma. Si la antena está entera y su luz de señal está verde, la tormenta queda descartada. La técnica la revisa todas las mañanas.",
          ],
        },
      },
      {
        id: "how-to-test",
        ask: ["How can we test an explanation?", "¿Cómo podemos poner a prueba una explicación?"],
        keywords: [
          "test",
          "prove",
          "experiment",
          "sure",
          "probar",
          "prueba",
          "experimento",
          "comprobar",
        ],
        answer: [
          "Change one thing and watch what happens. If I knew which channel the relay uses, I could send a test message on it. Bring me the system log from the Communication Center.",
          "Cambia una sola cosa y observa qué pasa. Si yo supiera qué canal usa el relé, podría enviar un mensaje de prueba por ese canal. Tráeme el registro del sistema del Centro de Comunicación.",
        ],
      },
      {
        id: "run-test",
        requires: { has: "system-log" },
        ask: [
          "The log says the channel changed from 7 to 17. Can you test that?",
          "El registro dice que el canal cambió de 7 a 17. ¿Puedes probarlo?",
        ],
        keywords: [
          "channel",
          "log",
          "seven",
          "seventeen",
          "7",
          "17",
          "relay",
          "canal",
          "registro",
          "siete",
          "diecisiete",
          "rele",
        ],
        answer: [
          "Let us try. I sent a message on channel 7: it did not arrive. I sent the same message on channel 17: it arrived in two seconds. That is strong evidence. The relay is listening on a channel our phones do not use.",
          "Vamos a intentarlo. Envié un mensaje por el canal 7: no llegó. Envié el mismo mensaje por el canal 17: llegó en dos segundos. Esa es evidencia fuerte. El relé está escuchando en un canal que nuestros teléfonos no usan.",
        ],
        gives: ["channel-test"],
        clarify: {
          ask: ["Did you send the test more than once?", "¿Enviaste la prueba más de una vez?"],
          answer: [
            "Yes, three times on each channel, with the same result each time. One test can be luck. Three is a pattern.",
            "Sí, tres veces por cada canal, con el mismo resultado cada vez. Una prueba puede ser suerte. Tres ya son un patrón.",
          ],
        },
      },
    ],
  },
  {
    id: "journalist",
    name: "Mateo Rivas",
    role: ["Journalist", "Periodista"],
    scene: "newsroom",
    look: { skin: "#c68642", hair: "#2b1b12", style: "curly", shirt: "#a24f72", acc: "none" },
    style: [
      "Fast and curious. He answers, then asks a question back.",
      "Rápido y curioso. Responde y luego hace otra pregunta.",
    ],
    wants: ["To publish something true before noon.", "Publicar algo cierto antes del mediodía."],
    greeting: [
      "You are the investigator? Good. I have a story half written and I do not trust it yet. Do you?",
      "¿Tú investigas el caso? Bien. Tengo una noticia a medio escribir y todavía no confío en ella. ¿Y tú?",
    ],
    fallback: [
      "That is not my story today. Ask me what I plan to report, who told me about the festival calls, or how I check two stories that do not agree.",
      "Esa no es mi noticia de hoy. Pregúntame qué pienso informar, quién me habló de las llamadas del festival o cómo verifico dos versiones que no coinciden.",
    ],
    topics: [
      {
        id: "story",
        ask: ["What are you going to report?", "¿Qué vas a informar?"],
        keywords: [
          "report",
          "story",
          "bulletin",
          "publish",
          "news",
          "informar",
          "noticia",
          "boletin",
          "publicar",
        ],
        answer: [
          "My first draft says festival calls overloaded the network. It is on the desk. But a draft is not a fact. I need a second source before I print it. What have you found?",
          "Mi primer borrador dice que las llamadas del festival sobrecargaron la red. Está en el escritorio. Pero un borrador no es un hecho. Necesito una segunda fuente antes de publicarlo. ¿Qué has encontrado tú?",
        ],
      },
      {
        id: "crowd",
        ask: [
          "Who told you about the festival calls?",
          "¿Quién te habló de las llamadas del festival?",
        ],
        keywords: [
          "festival",
          "crowd",
          "calls",
          "overload",
          "source",
          "caller",
          "told",
          "multitud",
          "llamadas",
          "sobrecarga",
          "fuente",
        ],
        answer: [
          "One caller. She said everyone was phoning at once after the Lantern Festival. It sounded right to me. Does it sound right to you?",
          "Una sola persona. Dijo que todos llamaban al mismo tiempo después del Festival de los Faroles. A mí me sonó bien. ¿A ti te suena bien?",
        ],
        gives: ["crowd-tip"],
        clarify: {
          ask: [
            "When did that caller reach you, and did anyone else say the same?",
            "¿Cuándo se comunicó esa persona contigo, y alguien más dijo lo mismo?",
          ],
          answer: [
            "She reached me on the short-range radio at about 6:25, after the trouble began. Nobody else said it. So I have one source, and she was describing what happened after the failure.",
            "Me habló por la radio de corto alcance hacia las 6:25, después de que empezó el problema. Nadie más lo dijo. Así que tengo una sola fuente, y ella describía lo que pasó después de la falla.",
          ],
          gives: ["tip-timing"],
        },
      },
      {
        id: "bakery-call",
        requires: { has: "voicemail" },
        ask: [
          "What does the bakery voicemail tell you?",
          "¿Qué te dice el mensaje de voz de la panadería?",
        ],
        keywords: [
          "voicemail",
          "bakery",
          "baker",
          "bread",
          "mensaje de voz",
          "panaderia",
          "panadero",
          "pan",
        ],
        answer: [
          "It was recorded at 5:58 and it is perfectly clear. So two minutes before six, a call still went through. Anything that broke the network at midnight has a problem with that.",
          "Se grabó a las 5:58 y se oye perfectamente. Así que dos minutos antes de las seis, una llamada todavía pasó. Cualquier cosa que haya roto la red a medianoche tiene un problema con eso.",
        ],
      },
      {
        id: "fact-check",
        ask: [
          "How do you check two stories that do not agree?",
          "¿Cómo verificas dos versiones que no coinciden?",
        ],
        keywords: [
          "check",
          "agree",
          "conflict",
          "compare",
          "true",
          "fact",
          "verificas",
          "coinciden",
          "comparar",
          "verdad",
        ],
        answer: [
          "Put them side by side at the fact-check desk. Ask: can both be true? Which one was recorded when it happened, and which one is a memory? Then say which is stronger, and why.",
          "Ponlas una al lado de la otra en la mesa de verificación. Pregunta: ¿pueden ser ciertas las dos? ¿Cuál se registró cuando pasó y cuál es un recuerdo? Después di cuál es más fuerte y por qué.",
        ],
      },
    ],
  },
  {
    id: "technician",
    name: "Priya Nair",
    role: ["Network technician", "Técnica de la red"],
    scene: "comms",
    look: { skin: "#c68642", hair: "#1b1b1b", style: "long", shirt: "#d28b58", acc: "headphones" },
    style: [
      "Practical and exact with numbers. A little defensive at first.",
      "Práctica y exacta con los números. Un poco a la defensiva al principio.",
    ],
    wants: [
      "To fix the problem safely, and not to be blamed without proof.",
      "Arreglar el problema con seguridad y que no la culpen sin pruebas.",
    ],
    greeting: [
      "If you are here to say my tower is broken, look at my inspection sheet first.",
      "Si vienes a decir que mi torre está rota, mira primero mi hoja de inspección.",
    ],
    fallback: [
      "That is outside my station. Ask me whether anything changed here, about the tower, or about how busy the network was.",
      "Eso está fuera de mi estación. Pregúntame si algo cambió aquí, por la torre o por lo ocupada que estaba la red.",
    ],
    topics: [
      {
        id: "changed",
        ask: ["Did anything change here this morning?", "¿Algo cambió aquí esta mañana?"],
        keywords: ["change", "changed", "different", "new", "cambio", "nuevo", "diferente"],
        answer: [
          "Nothing changed. Same tower, same cables, same relay box as yesterday. I checked them myself.",
          "No cambió nada. La misma torre, los mismos cables, la misma caja del relé que ayer. Yo misma los revisé.",
        ],
        gives: ["no-change"],
        clarify: {
          ask: [
            "When you say nothing changed, do you mean the equipment, or the software too?",
            "Cuando dices que no cambió nada, ¿hablas del equipo o también del software?",
          ],
          answer: [
            "The equipment. Nobody touched it. The software... well, updates install themselves at six. I did not count that as a change. Maybe I should have.",
            "Del equipo. Nadie lo tocó. El software... bueno, las actualizaciones se instalan solas a las seis. No lo conté como un cambio. Tal vez debí hacerlo.",
          ],
          gives: ["auto-update"],
        },
      },
      {
        id: "tower",
        ask: ["Is the tower damaged?", "¿La torre está dañada?"],
        keywords: [
          "tower",
          "antenna",
          "damage",
          "damaged",
          "broken",
          "torre",
          "antena",
          "dano",
          "danada",
          "rota",
        ],
        answer: [
          "No. I climbed up at seven. The antenna is whole, the cable is dry and the signal light is green. My inspection sheet is on the clipboard.",
          "No. Subí a las siete. La antena está entera, el cable está seco y la luz de señal está verde. Mi hoja de inspección está en la tabla.",
        ],
      },
      {
        id: "busy",
        ask: ["Was the network too busy?", "¿La red estaba demasiado ocupada?"],
        keywords: [
          "busy",
          "overload",
          "full",
          "traffic",
          "capacity",
          "ocupada",
          "sobrecarga",
          "llena",
          "trafico",
          "capacidad",
        ],
        answer: [
          "Look at the usage chart. At six the network was using 30 out of 100. It only climbed later, when people kept trying again.",
          "Mira la gráfica de uso. A las seis la red usaba 30 de 100. Solo subió después, cuando la gente siguió intentando.",
        ],
      },
      {
        id: "reset",
        requires: { has: "channel-test" },
        ask: ["Can the relay be set back to channel 7?", "¿Se puede regresar el relé al canal 7?"],
        keywords: [
          "reset",
          "set back",
          "roll back",
          "fix",
          "restore",
          "channel",
          "regresar",
          "arreglar",
          "restablecer",
          "canal",
        ],
        answer: [
          "Yes. It takes about twenty minutes, and I need Chief Brooks to sign, because the relay restarts while I do it. Bring her the test result.",
          "Sí. Toma unos veinte minutos, y necesito la firma de la jefa Brooks, porque el relé se reinicia mientras lo hago. Llévale el resultado de la prueba.",
        ],
        clarify: {
          ask: [
            "What happens to messages during those twenty minutes?",
            "¿Qué pasa con los mensajes durante esos veinte minutos?",
          ],
          answer: [
            "They wait in a line and are delivered when the relay comes back. Nothing is lost.",
            "Esperan en una fila y se entregan cuando el relé vuelve. No se pierde nada.",
          ],
        },
      },
    ],
  },
  {
    id: "planner",
    name: "Chief Dana Brooks",
    role: ["Emergency planner", "Planificadora de emergencias"],
    scene: "ops",
    look: { skin: "#5c3a21", hair: "#1b1b1b", style: "short", shirt: "#4a1f35", acc: "none" },
    style: [
      "Direct and fair. She asks for evidence before she agrees.",
      "Directa y justa. Pide evidencia antes de estar de acuerdo.",
    ],
    wants: [
      "A decision she can explain to the whole city.",
      "Una decisión que pueda explicarle a toda la ciudad.",
    ],
    greeting: [
      "I have three plans and one morning. Tell me what you found, and I will listen.",
      "Tengo tres planes y una sola mañana. Dime qué encontraste y te escucho.",
    ],
    fallback: [
      "Not now. Ask me what the city can do, or what I need to hear from you.",
      "Ahora no. Pregúntame qué puede hacer la ciudad o qué necesito escuchar de ti.",
    ],
    topics: [
      {
        id: "plans",
        ask: ["What can the city do?", "¿Qué puede hacer la ciudad?"],
        keywords: [
          "plan",
          "plans",
          "options",
          "city",
          "response",
          "opciones",
          "planes",
          "ciudad",
          "respuesta",
        ],
        answer: [
          "Three plans are on the table. Send the repair crew up the tower. Set the relay back to its old channel. Or ask everyone to stay off the network. Each one costs something. Read the plans sheet.",
          "Hay tres planes sobre la mesa. Enviar al equipo de reparación a la torre. Regresar el relé a su canal anterior. O pedir a todos que no usen la red. Cada uno cuesta algo. Lee la hoja de planes.",
        ],
      },
      {
        id: "need",
        ask: ["What do you need to hear from me?", "¿Qué necesitas escuchar de mí?"],
        keywords: [
          "need",
          "hear",
          "want",
          "brief",
          "expect",
          "necesitas",
          "escuchar",
          "informe",
          "espera",
        ],
        answer: [
          "Three things. What happened. Why you think so, with evidence. And what you recommend. If someone disagrees with you, tell me why your evidence is stronger.",
          "Tres cosas. Qué pasó. Por qué lo piensas, con evidencia. Y qué recomiendas. Si alguien no está de acuerdo contigo, dime por qué tu evidencia es más fuerte.",
        ],
        clarify: {
          ask: ["How much evidence is enough?", "¿Cuánta evidencia es suficiente?"],
          answer: [
            "More than one piece, and at least one that was measured or recorded, not only remembered. And tell me about anything that does not fit.",
            "Más de una, y por lo menos una que se haya medido o registrado, no solo recordado. Y cuéntame cualquier cosa que no encaje.",
          ],
        },
      },
      {
        id: "what-now",
        requires: { done: "recommend" },
        ask: ["What happens now?", "¿Qué pasa ahora?"],
        keywords: ["now", "next", "happens", "after", "ahora", "sigue", "despues"],
        answer: [
          "The city acts on your recommendation. Then I will ask you to improve the written version, because other cities will read it.",
          "La ciudad actúa según tu recomendación. Después te pediré que mejores la versión escrita, porque otras ciudades la van a leer.",
        ],
      },
    ],
  },
];
