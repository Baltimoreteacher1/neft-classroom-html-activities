// Adventure World: City of Conversations. Everyday talk across one city: a clinic front desk, a bus-station
// lost-and-found, a neighbor problem and a library mix-up. Language for requesting, clarifying, apologizing,
// persuading politely and repairing a misunderstanding. Pure data; schema: ADVENTURE-SCHEMA (src/adventures/).

const frontDesk = {
  id: "clinic-front-desk",
  title: { en: "The Clinic Front Desk", es: "La recepción de la clínica" },
  goal: {
    en: "Make a polite request and ask a question to check that you understood.",
    es: "Hacer una petición amable y una pregunta para comprobar que entendiste.",
  },
  keyUse: "Explain",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-city", "char-maya", "char-mom"],
        speaker: "Rosa Vega",
        text: {
          en: "Welcome to Linden Street! I'm Rosa, and I help people talk their way through the city. Today your little brother Teo has a cough. Your mom is parking the car, so you go to the clinic desk first.",
          es: "¡Bienvenido a la calle Linden! Soy Rosa y ayudo a la gente a hablar por toda la ciudad. Hoy tu hermanito Teo tiene tos. Tu mamá está estacionando el carro, así que tú vas primero a la recepción de la clínica.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Good morning, this is Maple Clinic. How can I help you? We have an opening at ten fifteen with Doctor Lin, or one at two o'clock this afternoon. Please write your brother's name and birthday on this card. The waiting room is on your left.",
        },
        transcriptLabel: { en: "What the receptionist says", es: "Lo que dice la recepcionista" },
      },
      {
        kind: "choice",
        prompt: {
          en: "You want the ten fifteen time. Which request is the most polite?",
          es: "Quieres la cita de las diez y quince. ¿Cuál petición es la más amable?",
        },
        options: [
          {
            text: { en: "Could we please have the ten fifteen appointment?" },
            correct: true,
            feedback: {
              en: "Yes! “Could we please...” is a polite way to ask for something, and you named the exact time.",
              es: "¡Sí! «¿Podríamos, por favor...?» es una forma amable de pedir algo, y dijiste la hora exacta.",
            },
          },
          {
            text: { en: "Give us ten fifteen." },
            correct: false,
            feedback: {
              en: "This sounds like an order, not a request. Look for words that ask kindly, like “could” or “please.”",
              es: "Esto suena como una orden, no una petición. Busca palabras que piden con amabilidad, como «could» o «please».",
            },
          },
          {
            text: { en: "We want the morning one." },
            correct: false,
            feedback: {
              en: "This is not rude, but it does not say please and does not name the time. Which choice is clear AND kind?",
              es: "No es grosero, pero no dice «please» ni nombra la hora. ¿Cuál opción es clara Y amable?",
            },
          },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "You did not catch where to wait. What can you say to check?",
          es: "No entendiste dónde esperar. ¿Qué puedes decir para comprobar?",
        },
        options: [
          {
            text: { en: "Sorry, could you say that again? Where is the waiting room?" },
            correct: true,
            feedback: {
              en: "Great clarifying question. You said sorry, asked her to repeat, and named the part you missed.",
              es: "Muy buena pregunta para aclarar. Pediste perdón, le pediste que repitiera y nombraste la parte que no entendiste.",
            },
          },
          {
            text: { en: "Okay, thank you." },
            correct: false,
            feedback: {
              en: "This ends the talk, but you still do not know where to go. Pick the choice that asks about the missing part.",
              es: "Esto termina la conversación, pero todavía no sabes adónde ir. Elige la opción que pregunta por la parte que faltó.",
            },
          },
          {
            text: { en: "What?" },
            correct: false,
            feedback: {
              en: "One word can sound rude, and she will not know which part you missed. Which choice is polite and specific?",
              es: "Una sola palabra puede sonar grosera, y ella no sabrá qué parte no entendiste. ¿Cuál opción es amable y específica?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your turn at the desk. Say your request out loud: ask for the time you want, say why Teo needs to see the doctor, and ask one question to check.",
          es: "Te toca en la recepción. Di tu petición en voz alta: pide la hora que quieres, di por qué Teo necesita ver al doctor y haz una pregunta para comprobar.",
        },
        mode: "say",
        frames: [
          { en: "Could we please have..." },
          { en: "My brother needs to see the doctor because..." },
          { en: "Could you tell me...?" },
        ],
        wordBank: ["appointment", "please", "because", "cough", "waiting room", "card"],
        check: {
          minWords: 22,
          needConnectors: ["cause"],
          needAny: [
            ["please", "could"],
            ["appointment", "ten fifteen", "two o'clock", "time"],
          ],
        },
        model: {
          en: "Good morning. Could we please have the ten fifteen appointment with Doctor Lin? My brother needs to see the doctor because he has a bad cough. Could you tell me where the waiting room is?",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You asked politely with “could” and “please,” gave a reason with “because,” and checked what you missed.",
          es: "Pediste con amabilidad usando «could» y «please», diste una razón con «because» y comprobaste lo que no entendiste.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-city", "char-maya", "char-mom"],
        speaker: "Rosa Vega",
        text: {
          en: "Welcome to Linden Street. I'm Rosa, and in this city every problem starts with a conversation. Your younger brother Teo woke up with a cough, and your mom is still parking. You're the one who has to get him checked in at Maple Clinic.",
          es: "Bienvenido a la calle Linden. Soy Rosa, y en esta ciudad todo problema empieza con una conversación. Tu hermano menor Teo se despertó con tos y tu mamá todavía está estacionando. Te toca a ti registrarlo en la Clínica Maple.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Good morning, Maple Clinic. Is this a new patient or a returning patient? If he's been here before, I just need his date of birth. For walk-ins, Doctor Lin has an opening at ten fifteen, but it's a short visit. If you'd prefer a full check-up, the next available slot is two o'clock. Either way, please fill out the symptom form on the clipboard and bring it back to me before you sit down.",
        },
        transcriptLabel: { en: "What the receptionist says", es: "Lo que dice la recepcionista" },
      },
      {
        kind: "order",
        prompt: {
          en: "Put the check-in steps in the order the receptionist described.",
          es: "Ordena los pasos del registro como los describió la recepcionista.",
        },
        items: [
          { en: "Say whether Teo is a new or returning patient." },
          { en: "Give his date of birth." },
          { en: "Choose the ten fifteen visit or the two o'clock check-up." },
          { en: "Fill out the symptom form." },
          { en: "Return the form, then sit down." },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "You're not sure what “a short visit” includes. Which question clarifies best?",
          es: "No estás seguro de qué incluye «una visita corta». ¿Qué pregunta aclara mejor?",
        },
        options: [
          {
            text: {
              en: "Just to check, would a short visit be enough for a cough, or should we wait for the full check-up?",
            },
            correct: true,
            feedback: {
              en: "Strong. “Just to check” signals a clarifying question, and you named both options so she can answer exactly.",
              es: "Muy bien. «Just to check» muestra que es una pregunta para aclarar, y nombraste las dos opciones para que ella responda con exactitud.",
            },
          },
          {
            text: { en: "What do you mean?" },
            correct: false,
            feedback: {
              en: "This asks for help but does not say WHICH part confused you. A strong clarifying question repeats the confusing words.",
              es: "Esto pide ayuda, pero no dice QUÉ parte te confundió. Una buena pregunta para aclarar repite las palabras confusas.",
            },
          },
          {
            text: { en: "We'll take the earliest one, I guess." },
            correct: false,
            feedback: {
              en: "This makes a decision before you understand the choices. What could you ask first so the decision is a good one?",
              es: "Esto toma una decisión antes de entender las opciones. ¿Qué podrías preguntar primero para decidir bien?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Speak to the receptionist. Make a polite request for one of the two times, explain why you chose it, and ask one clarifying question about something she said.",
          es: "Habla con la recepcionista. Pide con amabilidad una de las dos horas, explica por qué la elegiste y haz una pregunta para aclarar algo que ella dijo.",
        },
        mode: "say",
        frames: [
          { en: "Would it be possible to..." },
          { en: "We'd prefer that time because..." },
          { en: "Just to check, ..." },
        ],
        wordBank: [
          "returning patient",
          "date of birth",
          "check-up",
          "symptom form",
          "would it be possible",
          "just to check",
        ],
        check: {
          minWords: 35,
          needConnectors: ["cause"],
          needAny: [
            ["would", "could", "please"],
            ["check", "clarify", "do you mean", "is that"],
            ["ten fifteen", "two o'clock", "check-up", "visit"],
          ],
        },
        model: {
          en: "Good morning. Teo is a returning patient, and his birthday is March third. Would it be possible to take the two o'clock check-up? We'd prefer that time because his cough has lasted three days. Just to check, should I bring the symptom form back to you before we sit down?",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You followed spoken directions in order, chose a reason, and used “Just to check...” to clarify before deciding.",
          es: "Seguiste instrucciones habladas en orden, diste una razón y usaste «Just to check...» para aclarar antes de decidir.",
        },
      },
    ],
  },
};

const lostAndFound = {
  id: "lost-and-found",
  title: { en: "Lost at the Bus Station", es: "Perdido en la estación de autobuses" },
  goal: {
    en: "Describe a lost object with exact details so someone else can find it.",
    es: "Describir un objeto perdido con detalles exactos para que otra persona lo encuentre.",
  },
  keyUse: "Inform",
  domains: ["Reading", "Writing"],
  final: false,
  book: {
    templateId: "conversation-book",
    title: { en: "My Lost-and-Found Conversation", es: "Mi conversación en objetos perdidos" },
  },
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-city", "char-leo"],
        speaker: "Rosa Vega",
        text: {
          en: "Oh no! Your friend Leo left his backpack on the Number 9 bus. The bus station has a lost-and-found window. The worker will only give the bag back if Leo can describe it well.",
          es: "¡Ay, no! Tu amigo Leo dejó su mochila en el autobús número 9. La estación tiene una ventanilla de objetos perdidos. El empleado solo devolverá la mochila si Leo la describe bien.",
        },
      },
      {
        kind: "read",
        title: { en: "Lost-and-Found Rules", es: "Reglas de objetos perdidos" },
        text: {
          en: "Lost something on a city bus? Come to Window 3 at Central Station. Many bags look the same, so we ask you to describe your item before we return it. Tell us the color, the size, and the bus number. Then tell us one thing that is special about your item, like a key chain, a patch, or a name tag. We also ask what is inside. Items stay here for thirty days. Thank you for helping us return things to the right person!",
        },
        glossary: [
          { word: "item", en: "a thing or object", es: "un objeto o una cosa" },
          { word: "describe", en: "to tell what something is like", es: "decir cómo es algo" },
          {
            word: "patch",
            en: "a small piece of cloth sewn onto a bag or shirt",
            es: "un parche de tela cosido a una mochila o camisa",
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "The worker has three blue backpacks. Pick the details that will prove which one is Leo's.",
          es: "El empleado tiene tres mochilas azules. Elige los detalles que prueban cuál es la de Leo.",
        },
        clues: [
          {
            id: "keychain",
            text: { en: "It has a green turtle key chain." },
            relevant: true,
            why: {
              en: "A special object like a key chain makes the bag different from the others.",
              es: "Un objeto especial como un llavero hace que la mochila sea diferente de las otras.",
            },
          },
          {
            id: "inside",
            text: { en: "Inside there is a library book about volcanoes." },
            relevant: true,
            why: {
              en: "The rules ask what is inside, and only the owner would know this.",
              es: "Las reglas piden decir qué hay adentro, y solo el dueño lo sabría.",
            },
          },
          {
            id: "bus",
            text: { en: "He left it on the Number 9 bus this morning." },
            relevant: true,
            why: {
              en: "The rules ask for the bus number, so the worker can check where it was found.",
              es: "Las reglas piden el número del autobús para que el empleado revise dónde la encontraron.",
            },
          },
          {
            id: "blue",
            text: { en: "It is blue." },
            relevant: false,
            why: {
              en: "All three bags are blue, so color alone cannot tell them apart. Look for a detail only Leo's bag has.",
              es: "Las tres mochilas son azules, así que el color solo no las distingue. Busca un detalle que solo tenga la de Leo.",
            },
          },
          {
            id: "favorite",
            text: { en: "It is his favorite backpack." },
            relevant: false,
            why: {
              en: "This tells how Leo feels, but the worker cannot see feelings. Pick a detail the worker can check.",
              es: "Esto dice lo que Leo siente, pero el empleado no puede ver sentimientos. Elige un detalle que el empleado pueda comprobar.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "respond",
        prompt: {
          en: "Help Leo write a note for Window 3. Describe the backpack with at least three exact details.",
          es: "Ayuda a Leo a escribir una nota para la Ventanilla 3. Describe la mochila con al menos tres detalles exactos.",
        },
        mode: "write",
        frames: [{ en: "I lost my..." }, { en: "It has..." }, { en: "Inside, there is..." }],
        wordBank: ["backpack", "key chain", "turtle", "library book", "Number 9 bus", "inside"],
        check: {
          minWords: 20,
          needWords: ["backpack"],
          needAny: [
            ["key chain", "turtle", "patch", "tag"],
            ["inside", "book"],
            ["bus", "number 9"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "Hello. I lost my blue backpack on the Number 9 bus this morning. It has a green turtle key chain on the zipper. Inside, there is a library book about volcanoes.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You chose details that only Leo's bag has. Exact details help people find the right thing.",
          es: "Elegiste detalles que solo tiene la mochila de Leo. Los detalles exactos ayudan a encontrar lo correcto.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-city", "char-leo"],
        speaker: "Rosa Vega",
        text: {
          en: "Leo texted you in a panic: he left his backpack on the Number 9 bus, and his science notebook is inside. Central Station's lost-and-found returns items only to people who can describe them precisely. You're going with him to help.",
          es: "Leo te escribió muy preocupado: dejó su mochila en el autobús número 9, y su cuaderno de ciencias está adentro. La oficina de objetos perdidos de la Estación Central solo devuelve objetos a quien los describe con precisión. Vas con él para ayudarlo.",
        },
      },
      {
        kind: "read",
        title: {
          en: "Central Station Lost-and-Found Policy",
          es: "Reglas de objetos perdidos de la Estación Central",
        },
        text: {
          en: "Items found on city buses are delivered to Window 3 at Central Station by the end of each day. Because many items look alike, staff will not return an item based on color or brand alone. To claim an item, you must provide at least three identifying details: something visible on the outside, such as a patch, a tear, or a key chain; something on the inside that you did not see us open; and the route number and approximate time you rode. If your description matches, you will sign a claim form with your name and phone number. Items that are not claimed within thirty days are donated to a local shelter. Wallets and phones are kept in a locked safe and require a photo ID from an adult. We appreciate your patience while we search.",
        },
        glossary: [
          {
            word: "identifying",
            en: "showing exactly which one it is",
            es: "que muestra exactamente cuál es",
          },
          {
            word: "approximate",
            en: "close to exact, but not exact",
            es: "aproximado; cercano a lo exacto",
          },
          {
            word: "claim",
            en: "to ask for something because it belongs to you",
            es: "reclamar algo porque es tuyo",
          },
          {
            word: "donated",
            en: "given away to help others",
            es: "donado; regalado para ayudar a otros",
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Leo is listing details. Choose the three that meet the policy's three kinds of identifying details.",
          es: "Leo está haciendo una lista de detalles. Elige los tres que cumplen con los tres tipos de detalles de las reglas.",
        },
        clues: [
          {
            id: "tear",
            text: { en: "There is a small tear near the left strap, fixed with silver tape." },
            relevant: true,
            why: {
              en: "This is a visible outside detail that a similar bag would not share.",
              es: "Es un detalle visible por fuera que otra mochila parecida no tendría.",
            },
          },
          {
            id: "notebook",
            text: { en: "Inside is a science notebook with “L. Moreno” on the cover." },
            relevant: true,
            why: {
              en: "This is an inside detail; staff can check it without you seeing them open the bag first.",
              es: "Es un detalle de adentro; el personal puede revisarlo sin que tú los veas abrir la mochila.",
            },
          },
          {
            id: "route",
            text: { en: "He rode Route 9 at about 7:40 a.m." },
            relevant: true,
            why: {
              en: "The policy asks for the route number and an approximate time.",
              es: "Las reglas piden el número de ruta y una hora aproximada.",
            },
          },
          {
            id: "brand",
            text: { en: "It's a well-known brand of backpack." },
            relevant: false,
            why: {
              en: "The policy says brand alone is not enough, because many bags share a brand.",
              es: "Las reglas dicen que la marca sola no basta, porque muchas mochilas tienen la misma marca.",
            },
          },
          {
            id: "expensive",
            text: { en: "It was expensive and he really needs it back." },
            relevant: false,
            why: {
              en: "This explains why it matters to Leo, but it doesn't identify the bag. Choose something staff can verify.",
              es: "Esto explica por qué le importa a Leo, pero no identifica la mochila. Elige algo que el personal pueda verificar.",
            },
          },
          {
            id: "dark",
            text: { en: "It's dark blue." },
            relevant: false,
            why: {
              en: "Color alone is exactly what the policy says is not enough.",
              es: "El color solo es justo lo que las reglas dicen que no basta.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "The worker says, “We have two bags from Route 9. Can you be more specific?” What is the best reply?",
          es: "El empleado dice: «Tenemos dos mochilas de la Ruta 9. ¿Puedes ser más específico?». ¿Cuál es la mejor respuesta?",
        },
        options: [
          {
            text: {
              en: "Sure. The left strap has silver tape over a small tear, and the notebook inside says “L. Moreno.”",
            },
            correct: true,
            feedback: {
              en: "Exactly. You answered the request directly with one outside and one inside detail.",
              es: "Exacto. Respondiste directamente con un detalle de afuera y otro de adentro.",
            },
          },
          {
            text: { en: "It's the blue one. You'll know it when you see it." },
            correct: false,
            feedback: {
              en: "The worker asked for MORE detail, and this gives less. What did the policy say color alone can't do?",
              es: "El empleado pidió MÁS detalles, y esto da menos. ¿Qué decían las reglas sobre el color solo?",
            },
          },
          {
            text: { en: "Can't you just let us look at both?" },
            correct: false,
            feedback: {
              en: "This avoids the question, and the policy does not allow it. Which reply gives the identifying details asked for?",
              es: "Esto evita la pregunta, y las reglas no lo permiten. ¿Qué respuesta da los detalles que pidieron?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write Leo's claim note for Window 3. Include all three kinds of identifying details the policy requires, and explain why the details prove the bag is his.",
          es: "Escribe la nota de reclamo de Leo para la Ventanilla 3. Incluye los tres tipos de detalles que piden las reglas y explica por qué esos detalles prueban que la mochila es suya.",
        },
        mode: "write",
        frames: [
          { en: "I am writing to claim..." },
          { en: "On the outside, ..." },
          { en: "These details show it is mine because..." },
        ],
        wordBank: [
          "identifying",
          "approximate",
          "claim",
          "tear",
          "silver tape",
          "Route 9",
          "notebook",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [
            ["tear", "tape", "strap", "patch", "key chain"],
            ["notebook", "inside"],
            ["route", "bus", "a.m"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "I am writing to claim a dark blue backpack I left on Route 9 at about 7:40 a.m. On the outside, there is a small tear near the left strap fixed with silver tape. Inside, there is a science notebook with “L. Moreno” on the cover. These details show it is mine because no other bag would have both the taped tear and my name.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You matched your details to the rules and answered “be more specific” with precise, checkable facts.",
          es: "Ajustaste tus detalles a las reglas y respondiste a «sé más específico» con datos precisos que se pueden comprobar.",
        },
      },
    ],
  },
};

const neighbor = {
  id: "neighbor-noise",
  title: { en: "The Neighbor Problem", es: "El problema con la vecina" },
  goal: {
    en: "Apologize sincerely and suggest a fair fix in a polite way.",
    es: "Pedir disculpas de verdad y proponer una solución justa de forma amable.",
  },
  keyUse: "Argue",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-home", "char-sam", "char-abuela"],
        speaker: "Rosa Vega",
        text: {
          en: "You and your cousin Sam practice drums after school. Today Mrs. Park from downstairs knocks on your door. She does not look happy.",
          es: "Tú y tu primo Sam practican batería después de la escuela. Hoy la señora Park, la vecina de abajo, toca a tu puerta. No se ve contenta.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Hello. I live right below you. I work at night at the hospital, so I sleep in the afternoon. Your drums are very loud from three to five o'clock. I could not sleep at all this week. Can we find a way to fix this?",
        },
        transcriptLabel: { en: "What Mrs. Park says", es: "Lo que dice la señora Park" },
      },
      {
        kind: "choice",
        prompt: { en: "Why is Mrs. Park upset?", es: "¿Por qué está molesta la señora Park?" },
        options: [
          {
            text: { en: "She sleeps in the afternoon, and the drums wake her up." },
            correct: true,
            feedback: {
              en: "Right. She works at night, so the afternoon is her sleep time.",
              es: "Correcto. Ella trabaja de noche, así que la tarde es su hora de dormir.",
            },
          },
          {
            text: { en: "She does not like music." },
            correct: false,
            feedback: {
              en: "She never says that. Listen again for what she does in the afternoon.",
              es: "Ella nunca dice eso. Escucha otra vez qué hace ella en la tarde.",
            },
          },
          {
            text: { en: "The drums are loud at night." },
            correct: false,
            feedback: {
              en: "Check the time she said. Is it at night, or another part of the day?",
              es: "Revisa la hora que dijo. ¿Es de noche o en otra parte del día?",
            },
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Put the parts of a good apology in order.",
          es: "Ordena las partes de una buena disculpa.",
        },
        items: [
          { en: "Say sorry." },
          { en: "Say what you did." },
          { en: "Show you understand how she feels." },
          { en: "Offer a way to fix it." },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Talk to Mrs. Park. Say sorry, show you understand, and suggest a new time to practice. Tell her why your idea is fair.",
          es: "Habla con la señora Park. Pide perdón, muestra que entiendes y propón otra hora para practicar. Dile por qué tu idea es justa.",
        },
        mode: "say",
        frames: [
          { en: "I'm sorry that..." },
          { en: "Could we practice..." },
          { en: "That way..." },
        ],
        wordBank: ["sorry", "sleep", "practice", "after six", "weekend", "fair", "because"],
        check: {
          minWords: 20,
          needAny: [
            ["sorry", "apologize"],
            ["practice", "play", "drums"],
          ],
          needConnectors: ["cause"],
        },
        model: {
          en: "I'm sorry that our drums woke you up. I did not know you sleep in the afternoon. Could we practice after six o'clock instead? That is fair because you will be awake for work then.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "A good apology says sorry, names what happened, understands the other person, and offers a fix.",
          es: "Una buena disculpa pide perdón, dice lo que pasó, entiende a la otra persona y ofrece una solución.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-home", "char-sam", "char-abuela"],
        speaker: "Rosa Vega",
        text: {
          en: "You and your cousin Sam have a band rehearsal schedule taped to the fridge. This afternoon, Mrs. Park from the apartment below knocks, and she's holding a note from the building manager.",
          es: "Tú y tu primo Sam tienen el horario de ensayos de la banda pegado en el refrigerador. Esta tarde, la señora Park, del apartamento de abajo, toca a la puerta con una nota del administrador del edificio.",
        },
        listen: true,
      },
      {
        kind: "listen",
        script: {
          en: "Hi, I'm sorry to bother you. I'm Mrs. Park, from 2B. I'm a night nurse, so I sleep from about one to seven in the afternoon. The drumming has been coming through my ceiling every day this week, mostly between three and five. I know you're allowed to play until eight p.m. under the building rules, and I don't want you to stop playing. I just need us to work something out, because I can't keep going to work without sleep.",
        },
        transcriptLabel: { en: "What Mrs. Park says", es: "Lo que dice la señora Park" },
      },
      {
        kind: "read",
        title: { en: "Building Notice: Quiet Hours", es: "Aviso del edificio: horas de silencio" },
        text: {
          en: "To all residents of Linden Court: Quiet hours are from 8 p.m. to 8 a.m. every day. Outside of quiet hours, residents may play instruments, but we ask everyone to be considerate of neighbors who work night shifts. If a neighbor raises a concern, please try to agree on a solution together before contacting the office. Possible solutions include changing practice times, using practice pads or rubber mats to soften sound, or reserving the basement community room, which is available free of charge from noon to 9 p.m. with a reservation at the front desk. Remember that sound travels easily through floors and ceilings in older buildings. Most disagreements between neighbors are solved with one calm, honest conversation. Thank you for helping Linden Court remain a respectful place to live.",
        },
        glossary: [
          {
            word: "considerate",
            en: "thinking about other people's needs",
            es: "considerado; que piensa en lo que otros necesitan",
          },
          { word: "shifts", en: "the hours a person works", es: "turnos de trabajo" },
          {
            word: "concern",
            en: "a worry or problem someone tells you about",
            es: "una preocupación o problema que alguien comenta",
          },
          { word: "reservation", en: "saving a place or time ahead", es: "una reservación" },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Sam says, “We're allowed to play until eight, so it's her problem.” Which reply is both honest and polite?",
          es: "Sam dice: «Podemos tocar hasta las ocho, así que es su problema». ¿Qué respuesta es honesta y amable a la vez?",
        },
        options: [
          {
            text: {
              en: "You're right about the rules, but the notice asks us to be considerate and work it out together first.",
            },
            correct: true,
            feedback: {
              en: "Well argued. You agreed with the true part, then used the notice itself to make a stronger point.",
              es: "Bien argumentado. Aceptaste la parte verdadera y luego usaste el mismo aviso para dar un argumento más fuerte.",
            },
          },
          {
            text: { en: "Yeah, she should just buy earplugs." },
            correct: false,
            feedback: {
              en: "This puts the whole fix on her. Re-read what the notice asks residents to do when a neighbor raises a concern.",
              es: "Esto pone toda la solución en ella. Vuelve a leer qué pide el aviso cuando un vecino comparte una preocupación.",
            },
          },
          {
            text: { en: "Fine, then we'll quit the band." },
            correct: false,
            feedback: {
              en: "Mrs. Park said she doesn't want you to stop playing. Look for a reply that keeps the music AND respects her sleep.",
              es: "La señora Park dijo que no quiere que dejen de tocar. Busca una respuesta que mantenga la música Y respete su sueño.",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Speak to Mrs. Park. Give a sincere apology, show you understood her situation, propose one solution from the notice, and persuade her politely that it works for both of you.",
          es: "Habla con la señora Park. Pide una disculpa sincera, muestra que entendiste su situación, propón una solución del aviso y convéncela con amabilidad de que funciona para los dos.",
        },
        mode: "say",
        frames: [
          { en: "I'm really sorry that..." },
          { en: "What if we..." },
          { en: "This would work for both of us because..." },
        ],
        wordBank: [
          "considerate",
          "night shift",
          "community room",
          "practice pads",
          "reserve",
          "I understand",
        ],
        check: {
          minWords: 40,
          needConnectors: ["cause"],
          needAny: [
            ["sorry", "apologize"],
            [
              "community room",
              "basement",
              "practice pad",
              "practice pads",
              "mats",
              "time",
              "after seven",
            ],
            ["understand", "sleep", "night"],
          ],
        },
        model: {
          en: "Mrs. Park, I'm really sorry that our drumming kept you awake. I understand that you work night shifts and need to sleep in the afternoon. What if we reserve the basement community room from three to five instead of playing upstairs? This would work for both of us because you could sleep, and we could still rehearse every day.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You apologized sincerely, accepted the true part of an argument, and persuaded with a fix that meets both needs.",
          es: "Te disculpaste con sinceridad, aceptaste la parte verdadera de un argumento y convenciste con una solución para ambos.",
        },
      },
    ],
  },
};

const library = {
  id: "library-mix-up",
  title: {
    en: "Final Demonstration: The Library Mix-Up",
    es: "Demostración final: La confusión en la biblioteca",
  },
  goal: {
    en: "Repair a misunderstanding from start to finish: explain, clarify, apologize, and politely ask for a fix.",
    es: "Arreglar un malentendido de principio a fin: explicar, aclarar, disculparte y pedir una solución con amabilidad.",
  },
  keyUse: "Argue",
  domains: ["Listening", "Reading", "Speaking"],
  final: true,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-city", "char-maya", "char-teacher"],
        speaker: "Rosa Vega",
        text: {
          en: "This is your last stop in the city. You reserved a study room at the Linden Library for your group project. But when you arrive, another group is in the room!",
          es: "Esta es tu última parada en la ciudad. Reservaste una sala de estudio en la Biblioteca Linden para tu proyecto en grupo. ¡Pero cuando llegas, otro grupo está en la sala!",
        },
        listen: true,
      },
      {
        kind: "read",
        title: { en: "Your Reservation Slip", es: "Tu comprobante de reservación" },
        text: {
          en: "Linden Library Study Rooms. Room B is reserved for: Maya Torres, group of four. Day: Saturday. Time: 2:00 to 3:00 p.m. Please check in at the front desk when you arrive. If you are more than fifteen minutes late, the room may be given to someone else. Rooms are for quiet study and group work only. Please leave the room clean for the next group.",
        },
        glossary: [
          {
            word: "reserved",
            en: "saved for you ahead of time",
            es: "reservado; guardado para ti con anticipación",
          },
          {
            word: "check in",
            en: "tell the desk that you are here",
            es: "avisar en el mostrador que ya llegaste",
          },
        ],
      },
      {
        kind: "listen",
        script: {
          en: "Hi! Can I help you? Room B? Hmm. My list says Room B is for the chess club from two to three. Your group is in Room D at two. Oh wait, it is already two twenty. Did you check in at the desk when you arrived?",
        },
        transcriptLabel: { en: "What the librarian says", es: "Lo que dice el bibliotecario" },
      },
      {
        kind: "clues",
        prompt: {
          en: "What caused the mix-up? Pick the facts that explain it.",
          es: "¿Qué causó la confusión? Elige los datos que la explican.",
        },
        clues: [
          {
            id: "slip",
            text: { en: "Your slip says Room B." },
            relevant: true,
            why: {
              en: "This is one half of the mix-up: your paper and the list do not match.",
              es: "Esta es una mitad de la confusión: tu papel y la lista no coinciden.",
            },
          },
          {
            id: "list",
            text: { en: "The librarian's list says Room D for your group." },
            relevant: true,
            why: {
              en: "This is the other half: the library's list shows a different room.",
              es: "Esta es la otra mitad: la lista de la biblioteca muestra otra sala.",
            },
          },
          {
            id: "late",
            text: { en: "You did not check in at the desk, and it is 2:20." },
            relevant: true,
            why: {
              en: "The slip says rooms can be given away after fifteen minutes, so checking in matters.",
              es: "El comprobante dice que pueden dar la sala después de quince minutos, así que avisar en el mostrador importa.",
            },
          },
          {
            id: "clean",
            text: { en: "Rooms must be left clean." },
            relevant: false,
            why: {
              en: "This is a real rule, but it did not cause the room problem.",
              es: "Es una regla real, pero no causó el problema de la sala.",
            },
          },
          {
            id: "chess",
            text: { en: "The chess club is very good at chess." },
            relevant: false,
            why: {
              en: "This tells about the club, not about why the rooms got mixed up.",
              es: "Esto habla del club, no de por qué se confundieron las salas.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: { en: "What should you say first?", es: "¿Qué deberías decir primero?" },
        options: [
          {
            text: {
              en: "I'm sorry we didn't check in. My slip says Room B. Could you check if Room D is still free?",
            },
            correct: true,
            feedback: {
              en: "Yes. You owned your part, showed your proof, and asked politely for a fix.",
              es: "Sí. Aceptaste tu parte, mostraste tu prueba y pediste una solución con amabilidad.",
            },
          },
          {
            text: { en: "That's our room! Tell them to leave." },
            correct: false,
            feedback: {
              en: "The library list shows a different room, so you might be wrong. Find a reply that asks before it demands.",
              es: "La lista de la biblioteca muestra otra sala, así que podrías estar equivocado. Busca una respuesta que pregunte antes de exigir.",
            },
          },
          {
            text: { en: "Never mind, we'll go home." },
            correct: false,
            feedback: {
              en: "Giving up leaves your project undone. Which reply tries to repair the mix-up?",
              es: "Rendirte deja tu proyecto sin hacer. ¿Qué respuesta intenta arreglar la confusión?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration! Talk to the librarian. Explain the problem, say sorry for your part, ask a question to clarify, and politely ask for a solution.",
          es: "¡Tu demostración final! Habla con el bibliotecario. Explica el problema, pide perdón por tu parte, haz una pregunta para aclarar y pide una solución con amabilidad.",
        },
        mode: "say",
        frames: [
          { en: "Excuse me, there is a problem..." },
          { en: "I'm sorry that..." },
          { en: "Could you please..." },
        ],
        wordBank: ["reservation", "Room B", "Room D", "check in", "sorry", "because", "could you"],
        check: {
          minWords: 30,
          needConnectors: ["cause"],
          needAny: [["sorry", "apologize"], ["could", "please", "would"], ["room"]],
          evidenceFrom: "clues",
        },
        model: {
          en: "Excuse me, there is a problem with our study room. My slip says Room B, but your list says Room D. I'm sorry that we did not check in, because we came straight upstairs. Could you please check if Room D is still free for our group?",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-city", "char-maya", "char-teacher"],
        speaker: "Rosa Vega",
        text: {
          en: "Final stop. Your group reserved a study room at Linden Library to finish a history presentation due Monday. You walk in at 2:20, and Room B is full of people setting up chessboards. Time to use everything you've practiced on this street.",
          es: "Última parada. Tu grupo reservó una sala de estudio en la Biblioteca Linden para terminar una presentación de historia que hay que entregar el lunes. Entran a las 2:20 y la Sala B está llena de gente preparando tableros de ajedrez. Es hora de usar todo lo que practicaste en esta calle.",
        },
        listen: true,
      },
      {
        kind: "read",
        title: {
          en: "Reservation Confirmation Email",
          es: "Correo de confirmación de la reservación",
        },
        text: {
          en: "Subject: Your study room request. Hi Maya, thanks for your request for a group study room on Saturday from 2:00 to 3:00 p.m. You asked for Room B. Because Room B was already booked by a community club, we have placed your group in Room D on the second floor, which seats six. Please reply to this email if this does not work for you. A reminder about our policy: groups must check in at the front desk upon arrival. If a group has not checked in within fifteen minutes of the start time, the room may be released to walk-in visitors. Walk-in visitors may use any open table on the first floor, but study rooms are the only spaces where groups may talk at a normal volume. We look forward to seeing you on Saturday. Linden Library Front Desk.",
        },
        glossary: [
          { word: "booked", en: "already reserved by someone", es: "ya reservado por alguien" },
          { word: "upon arrival", en: "when you arrive", es: "al llegar" },
          {
            word: "released",
            en: "made available to others",
            es: "liberado; puesto a disposición de otros",
          },
        ],
      },
      {
        kind: "listen",
        script: {
          en: "Hi there. Room B? No, I'm afraid that's the chess club until three. Let me look you up. Torres, group of four... you were moved to Room D. It should have been in your confirmation email. The thing is, it's two twenty now and nobody checked in, so the system released Room D to a family about five minutes ago. I might have something else, but I need to know what you need it for.",
        },
        transcriptLabel: { en: "What the librarian says", es: "Lo que dice el bibliotecario" },
      },
      {
        kind: "clues",
        prompt: {
          en: "Before you speak, sort the facts. Which ones explain how the misunderstanding happened?",
          es: "Antes de hablar, ordena los datos. ¿Cuáles explican cómo pasó el malentendido?",
        },
        clues: [
          {
            id: "email",
            text: { en: "The email moved the group from Room B to Room D." },
            relevant: true,
            why: {
              en: "This is the key change your group missed.",
              es: "Este es el cambio clave que tu grupo no vio.",
            },
          },
          {
            id: "unread",
            text: { en: "Maya read only the subject line, not the whole email." },
            relevant: true,
            why: {
              en: "This is your group's part of the mistake, worth owning in an apology.",
              es: "Esta es la parte del error de tu grupo; vale la pena reconocerla en una disculpa.",
            },
          },
          {
            id: "checkin",
            text: { en: "No one checked in, so Room D was released after fifteen minutes." },
            relevant: true,
            why: {
              en: "This explains why even the right room is now gone.",
              es: "Esto explica por qué ya no está ni siquiera la sala correcta.",
            },
          },
          {
            id: "seats",
            text: { en: "Room D seats six people." },
            relevant: false,
            why: {
              en: "True, but the room's size did not cause the mix-up.",
              es: "Es cierto, pero el tamaño de la sala no causó la confusión.",
            },
          },
          {
            id: "chessclub",
            text: { en: "The chess club meets every Saturday." },
            relevant: false,
            why: {
              en: "This explains why Room B was taken, not why your group ended up with no room.",
              es: "Esto explica por qué la Sala B estaba ocupada, no por qué tu grupo se quedó sin sala.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "The librarian asked what you need the room for. Which answer gives the best case for help?",
          es: "El bibliotecario preguntó para qué necesitan la sala. ¿Qué respuesta da el mejor motivo para ayudarlos?",
        },
        options: [
          {
            text: {
              en: "We need to rehearse a group presentation out loud, so we need a space where talking won't bother anyone.",
            },
            correct: true,
            feedback: {
              en: "Convincing. You named the exact need, and it shows why an open table won't work.",
              es: "Convincente. Nombraste la necesidad exacta y muestra por qué una mesa abierta no sirve.",
            },
          },
          {
            text: { en: "We just need it, okay? We reserved it." },
            correct: false,
            feedback: {
              en: "The reservation was released, so this reason no longer helps. What does your group actually need to DO?",
              es: "La reservación ya se liberó, así que esta razón no ayuda. ¿Qué necesita HACER realmente tu grupo?",
            },
          },
          {
            text: { en: "For homework." },
            correct: false,
            feedback: {
              en: "This is true but too vague to persuade. What kind of work needs a closed room?",
              es: "Es cierto pero demasiado vago para convencer. ¿Qué tipo de trabajo necesita una sala cerrada?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration. Speak to the librarian and repair the whole misunderstanding: explain what happened, apologize for your group's part, ask a clarifying question about what is still available, and persuade politely for a solution.",
          es: "Tu demostración final. Habla con el bibliotecario y arregla todo el malentendido: explica lo que pasó, discúlpate por la parte de tu grupo, haz una pregunta para aclarar qué hay disponible y convéncelo con amabilidad para encontrar una solución.",
        },
        mode: "say",
        frames: [
          { en: "I think I understand what happened..." },
          { en: "I apologize that we..." },
          { en: "Just to check, ..." },
          { en: "Would it be possible..." },
        ],
        wordBank: [
          "confirmation email",
          "released",
          "check in",
          "rehearse",
          "presentation",
          "would it be possible",
          "just to check",
        ],
        check: {
          minWords: 55,
          needConnectors: ["cause"],
          needAny: [
            ["sorry", "apologize"],
            ["would", "could", "please"],
            ["check", "do you mean", "is there", "available"],
            ["email", "room d", "released"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "I think I understand what happened. Your email moved us to Room D, but I only read the subject line, so we went to Room B. I apologize that we didn't check in, because that's why Room D was released. Just to check, is there any closed room available before four? Would it be possible to use it for thirty minutes? We need to rehearse a presentation out loud, so a quiet room would help us without bothering anyone.",
        },
      },
    ],
  },
};

export default {
  id: "city-of-conversations",
  title: { en: "City of Conversations", es: "Ciudad de las Conversaciones" },
  tagline: {
    en: "Ask, check, apologize and fix it, one street at a time.",
    es: "Pide, comprueba, discúlpate y resuélvelo, una calle a la vez.",
  },
  theme: {
    bg: "bg-city",
    accent: "#1f6f8b",
    soft: "#e3f2f7",
    ink: "#0f3d4f",
    hero: ["char-maya", "char-leo"],
  },
  intro: {
    en: "Linden Street is busy, and every errand is a conversation. You will ask for help, check what people mean, say sorry when it matters, and fix misunderstandings. Rosa Vega, who knows everyone on the street, will guide you.",
    es: "La calle Linden es muy activa, y cada mandado es una conversación. Vas a pedir ayuda, comprobar lo que la gente quiere decir, disculparte cuando importa y arreglar malentendidos. Rosa Vega, que conoce a todos en la calle, será tu guía.",
  },
  guide: { name: "Rosa Vega", art: "char-mom" },
  missions: [frontDesk, lostAndFound, neighbor, library],
};
