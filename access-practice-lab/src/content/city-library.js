// Language City missions: Maple Street Library (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const LIBRARY_MISSIONS = [
  mission({
    id: "get-a-card",
    place: "library",
    title: ["Get a library card", "Saca una tarjeta de la biblioteca"],
    goal: [
      "Read the card rules, understand the due date, ask about renewing, and repair a mix-up.",
      "Lee las reglas de la tarjeta, entiende la fecha de entrega, pregunta cómo renovar y arregla una confusión.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "rules",
        role: "read",
        stim: doc("sign", "Library cards", "Tarjetas de la biblioteca", [
          ["Cards are free.", "Las tarjetas son gratis."],
          [
            "Bring a school letter or a photo ID.",
            "Trae una carta de la escuela o una identificación con foto.",
          ],
          [
            "Readers under 12 need a parent or guardian to sign.",
            "Los lectores menores de 12 años necesitan la firma de un padre o tutor.",
          ],
        ]),
        ask: [
          "A ten-year-old wants a card. What must happen?",
          "Un niño de diez años quiere una tarjeta. ¿Qué debe pasar?",
        ],
        options: [
          [
            "a",
            "The child pays five dollars.",
            "El niño paga cinco dólares.",
            "The sign says cards are free.",
            "El letrero dice que las tarjetas son gratis.",
          ],
          [
            "b",
            "A parent or guardian signs.",
            "Un padre o tutor firma.",
            "Yes: readers under 12 need that signature.",
            "Sí: los lectores menores de 12 necesitan esa firma.",
          ],
          [
            "c",
            "Nothing: the child just walks in.",
            "Nada: el niño solo entra.",
            "The sign lists things a reader must bring or do.",
            "El letrero enumera lo que un lector debe traer o hacer.",
          ],
        ],
        answer: "b",
        words: [
          ["free", "gratis"],
          ["under", "menos de"],
          ["sign", "firmar"],
          ["guardian", "tutor"],
        ],
        frame: [
          "Readers under ___ need ___ .",
          "Readers under ___ need ___ . (qué pide el letrero)",
        ],
        hint: [
          "Find the line about age. It tells you who needs extra help to get a card.",
          "Busca la línea sobre la edad. Dice quién necesita ayuda extra para una tarjeta.",
        ],
      }),
      choose({
        id: "due",
        role: "listen",
        mood: "happy",
        stim: speech(
          "Your books are due in three weeks. You can renew them one time, online or at the desk.",
          "Tus libros vencen en tres semanas. Puedes renovarlos una vez, en línea o en el mostrador.",
        ),
        ask: [
          "How long can you keep the books before you return or renew them?",
          "¿Cuánto tiempo puedes tener los libros antes de devolverlos o renovarlos?",
        ],
        options: [
          [
            "a",
            "Three weeks",
            "Tres semanas",
            "Yes: due in three weeks.",
            "Sí: vencen en tres semanas.",
          ],
          [
            "b",
            "Two weeks",
            "Dos semanas",
            "Listen again for the number before weeks.",
            "Escucha otra vez el número antes de weeks.",
          ],
          [
            "c",
            "One month",
            "Un mes",
            "He did not say month. Listen for the time word and the number.",
            "No dijo month. Escucha la palabra de tiempo y el número.",
          ],
        ],
        answer: "a",
        words: [
          ["due", "fecha de entrega"],
          ["weeks", "semanas"],
          ["renew", "renovar"],
          ["return", "devolver"],
        ],
        frame: [
          "The books are due in ___ ___ .",
          "The books are due in ___ ___ . (número y unidad de tiempo)",
        ],
        hint: [
          "Listen for a number and a word for time, like days, weeks or months.",
          "Escucha un número y una palabra de tiempo, como days, weeks o months.",
        ],
      }),
      build({
        id: "renew",
        role: "ask",
        target: "question",
        mood: "happy",
        intent: [
          "Ask if you can renew a book online.",
          "Pregunta si puedes renovar un libro en línea.",
        ],
        tiles: ["online", "book", "Can", "renew", "?", "I", "a", "to"],
        ok: [["Can", "I", "renew", "a", "book", "online", "?"]],
        slips: [
          [
            ["Can", "I", "to", "renew", "a", "book", "online", "?"],
            "After Can, use the plain verb with no to.",
            "Después de Can, usa el verbo simple sin to.",
          ],
          [
            ["I", "Can", "renew", "a", "book", "online", "?"],
            "A question begins with Can. The person comes right after it, not before it.",
            "Una pregunta empieza con Can. La persona va justo después, no antes.",
          ],
        ],
        words: [
          ["renew", "renovar"],
          ["online", "en línea"],
          ["book", "libro"],
          ["can", "poder"],
        ],
        frame: ["Can I ___ a ___ ___ ?", "Can I ___ a ___ ___ ? (pregunta si puedes hacer algo)"],
        hint: [
          "A question with can starts with Can, then who, then the plain verb.",
          "Una pregunta con can empieza con Can, luego quién y luego el verbo simple.",
        ],
      }),
      choose({
        id: "letter",
        role: "respond",
        target: "apologize",
        mood: "pleased",
        stim: speech(
          "I can sign you up now. Do you have your school letter?",
          "Puedo inscribirte ahora. ¿Tienes tu carta de la escuela?",
        ),
        ask: [
          "You left the letter at home. What do you say?",
          "Dejaste la carta en casa. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "No.",
            "No.",
            "True, but one word leaves Mr. Okoye with no next step.",
            "Es verdad, pero una palabra deja al señor Okoye sin un siguiente paso.",
          ],
          [
            "b",
            "Why do you need it?",
            "¿Para qué la necesita?",
            "The sign already says why, and this sounds like a challenge.",
            "El letrero ya lo dice y esto suena como un reto.",
          ],
          [
            "c",
            "I forgot it at home, sorry. Could I bring it tomorrow?",
            "Se me olvidó en casa, lo siento. ¿Podría traerla mañana?",
            "It says what happened, apologizes and asks for a next step.",
            "Dice qué pasó, se disculpa y pide un siguiente paso.",
          ],
        ],
        answer: "c",
        words: [
          ["forgot", "olvidé"],
          ["sorry", "lo siento"],
          ["tomorrow", "mañana"],
          ["bring", "traer"],
        ],
        frame: [
          "I forgot ___ at home, sorry. Could I ___ it tomorrow?",
          "I forgot ___ at home, sorry. Could I ___ it tomorrow? (qué pasó y qué propones)",
        ],
        hint: [
          "Say what happened, say sorry, then ask if there is another way.",
          "Di qué pasó, pide perdón y pregunta si hay otra manera.",
        ],
      }),
      choose({
        id: "ships",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here are some books about sheep, the animals with wool.",
          "Aquí hay libros sobre ovejas (sheep), los animales con lana.",
        ),
        ask: [
          "You asked for books about ships, the boats. What do you say?",
          "Pediste libros sobre barcos (ships). ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "No! Not sheep!",
            "¡No! ¡Ovejas no!",
            "This is correct about sheep but does not help him find the right books.",
            "Es cierto sobre las ovejas, pero no lo ayuda a encontrar los libros correctos.",
          ],
          [
            "b",
            "Okay, thank you.",
            "Está bien, gracias.",
            "You would leave with books you did not want.",
            "Te irías con libros que no querías.",
          ],
          [
            "c",
            "Sorry, I meant ships, the big boats that sail on the sea.",
            "Perdón, quise decir ships, los barcos grandes que navegan en el mar.",
            "It repairs the mix-up and explains the word with a short description.",
            "Repara la confusión y explica la palabra con una descripción corta.",
          ],
        ],
        answer: "c",
        words: [
          ["I meant", "quise decir"],
          ["boats", "barcos"],
          ["sail", "navegar"],
          ["sea", "mar"],
        ],
        frame: [
          "Sorry, I meant ___ , the ___ that ___ .",
          "Sorry, I meant ___ , the ___ that ___ . (la palabra correcta y una descripción)",
        ],
        hint: [
          "Say the word you meant, then describe it so the other person can picture it.",
          "Di la palabra que querías y descríbela para que la otra persona la imagine.",
        ],
      }),
      say({
        id: "ask-card",
        target: "request",
        prompt: [
          "Ask Mr. Okoye for a library card in your own words.",
          "Pide al señor Okoye una tarjeta de la biblioteca con tus propias palabras.",
        ],
        words: [
          ["could I", "¿podría?"],
          ["please", "por favor"],
          ["library card", "tarjeta de la biblioteca"],
          ["get", "obtener"],
        ],
        frame: ["Could I please ___ ?", "Could I please ___ ? (tu petición)"],
      }),
    ],
  }),
  mission({
    id: "find-a-book",
    place: "library",
    title: ["Find a book", "Encuentra un libro"],
    goal: [
      "Use shelf signs, ask where something is, accept an offer, and ask someone to say it again.",
      "Usa los letreros de los estantes, pregunta dónde está algo, acepta una oferta y pide que repitan.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "shelves",
        role: "read",
        stim: doc("sign", "Where to look", "Dónde buscar", [
          ["Fiction (stories): rows 1 and 2", "Ficción (cuentos): filas 1 y 2"],
          ["Nonfiction (true books): rows 3 and 4", "No ficción (libros verdaderos): filas 3 y 4"],
          ["Computers: back wall", "Computadoras: pared del fondo"],
        ]),
        ask: [
          "You want a true book about frogs. Where do you go?",
          "Quieres un libro verdadero sobre ranas. ¿A dónde vas?",
        ],
        options: [
          [
            "a",
            "Rows 1 and 2",
            "Filas 1 y 2",
            "Those rows hold stories that are made up.",
            "Esas filas tienen cuentos inventados.",
          ],
          [
            "b",
            "The back wall",
            "La pared del fondo",
            "The back wall is for computers, not books.",
            "La pared del fondo es para computadoras, no libros.",
          ],
          [
            "c",
            "Rows 3 and 4",
            "Filas 3 y 4",
            "True books are nonfiction, in rows 3 and 4.",
            "Los libros verdaderos son de no ficción, en las filas 3 y 4.",
          ],
        ],
        answer: "c",
        words: [
          ["fiction", "ficción"],
          ["nonfiction", "no ficción"],
          ["true", "verdadero"],
          ["rows", "filas"],
        ],
        frame: [
          "A ___ book is in ___ , rows ___ .",
          "A ___ book is in ___ , rows ___ . (tipo de libro y dónde está)",
        ],
        hint: [
          "Decide if a book about real frogs is made up or true, then find that label on the sign.",
          "Decide si un libro sobre ranas reales es inventado o verdadero y busca esa etiqueta en el letrero.",
        ],
      }),
      choose({
        id: "back",
        role: "listen",
        stim: speech(
          "The graphic novel you want is checked out. It comes back on Friday.",
          "La novela gráfica que quieres está prestada. Regresa el viernes.",
        ),
        ask: ["When will the book be back?", "¿Cuándo regresará el libro?"],
        options: [
          [
            "a",
            "Today",
            "Hoy",
            "Checked out means someone else has it right now.",
            "Checked out significa que alguien más lo tiene ahora.",
          ],
          [
            "b",
            "On Friday",
            "El viernes",
            "Yes: it comes back on Friday.",
            "Sí: regresa el viernes.",
          ],
          [
            "c",
            "Next month",
            "El próximo mes",
            "Listen for the day of the week.",
            "Escucha el día de la semana.",
          ],
        ],
        answer: "b",
        words: [
          ["checked out", "prestado"],
          ["back", "de regreso"],
          ["Friday", "viernes"],
          ["comes", "viene"],
        ],
        frame: ["It ___ back on ___ .", "It ___ back on ___ . (cuándo regresa)"],
        hint: [
          "Listen for a day of the week. Checked out means another reader has the book.",
          "Escucha un día de la semana. Checked out significa que otro lector tiene el libro.",
        ],
      }),
      build({
        id: "where",
        role: "ask",
        target: "question",
        intent: [
          "Ask Mr. Okoye where the dictionaries are.",
          "Pregunta al señor Okoye dónde están los diccionarios.",
        ],
        tiles: ["are", "dictionaries", "Where", "is", "?", "the"],
        ok: [["Where", "are", "the", "dictionaries", "?"]],
        slips: [
          [
            ["Where", "is", "the", "dictionaries", "?"],
            "Dictionaries is more than one. The helper word has to match.",
            "Dictionaries es plural. La palabra auxiliar debe concordar.",
          ],
          [
            ["Where", "the", "dictionaries", "are", "?"],
            "In a where question, the helper word comes right after Where.",
            "En una pregunta con where, la palabra auxiliar va justo después de Where.",
          ],
        ],
        words: [
          ["where", "dónde"],
          ["dictionaries", "diccionarios"],
          ["are", "están"],
          ["the", "los / las"],
        ],
        frame: ["Where ___ the ___ ?", "Where ___ the ___ ? (pregunta dónde están las cosas)"],
        hint: [
          "Start with Where, then the helper word that matches the thing you ask about.",
          "Empieza con Where y luego la palabra auxiliar que concuerda con lo que preguntas.",
        ],
      }),
      choose({
        id: "waitlist",
        role: "respond",
        target: "accept",
        mood: "happy",
        stim: speech(
          "Would you like me to put your name on the waiting list?",
          "¿Quieres que ponga tu nombre en la lista de espera?",
        ),
        ask: ["You would like that. How do you answer?", "Te gustaría eso. ¿Cómo respondes?"],
        options: [
          [
            "a",
            "Yes.",
            "Sí.",
            "One word is understood, but a full answer is warmer and clearer.",
            "Una palabra se entiende, pero una respuesta completa es más cálida y clara.",
          ],
          [
            "b",
            "I want it now.",
            "Lo quiero ahora.",
            "He just said it is checked out. This ignores his offer.",
            "Él acaba de decir que está prestado. Esto ignora su oferta.",
          ],
          [
            "c",
            "Yes, please. That sounds good.",
            "Sí, por favor. Me parece bien.",
            "It accepts the offer and is polite.",
            "Acepta la oferta y es cortés.",
          ],
        ],
        answer: "c",
        words: [
          ["yes, please", "sí, por favor"],
          ["sounds good", "me parece bien"],
          ["of course", "claro"],
          ["thank you", "gracias"],
        ],
        frame: ["Yes, ___ . That ___ .", "Yes, ___ . That ___ . (aceptar una oferta)"],
        hint: [
          "To accept, say yes and add a friendly phrase about the offer.",
          "Para aceptar, di yes y agrega una frase amable sobre la oferta.",
        ],
      }),
      choose({
        id: "again",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "The dictionaries are on the left, near the second window, past the globe.",
          "Los diccionarios están a la izquierda, cerca de la segunda ventana, después del globo.",
        ),
        ask: [
          "That was fast and you missed some words. What do you say?",
          "Fue rápido y perdiste algunas palabras. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "What?",
            "¿Qué?",
            "One word does not tell him which part you missed.",
            "Una palabra no le dice qué parte no entendiste.",
          ],
          [
            "b",
            "Sorry, could you say that again more slowly, please?",
            "Perdón, ¿podría repetirlo más despacio, por favor?",
            "It asks for a repeat, asks for a slower speed and is polite.",
            "Pide que repita, más despacio y con cortesía.",
          ],
          [
            "c",
            "I don't care where they are.",
            "No me importa dónde están.",
            "That ends the conversation and sounds rude.",
            "Eso termina la conversación y suena grosero.",
          ],
        ],
        answer: "b",
        words: [
          ["say that again", "repetirlo"],
          ["slowly", "despacio"],
          ["I didn't catch", "no entendí"],
          ["sorry", "perdón"],
        ],
        frame: [
          "Sorry, could you ___ that ___ , please?",
          "Sorry, could you ___ that ___ , please? (pide que repitan)",
        ],
        hint: [
          "Ask for the message again and tell the speaker how you want it said.",
          "Pide el mensaje otra vez y di cómo quieres que lo digan.",
        ],
      }),
      say({
        id: "thank-okoye",
        target: "thank",
        prompt: [
          "Mr. Okoye helped you find the dictionaries. Thank him.",
          "El señor Okoye te ayudó a encontrar los diccionarios. Dale las gracias.",
        ],
        words: [
          ["thanks", "gracias"],
          ["helping", "ayudar"],
          ["appreciate", "agradecer"],
          ["very much", "mucho"],
        ],
        frame: ["Thank you for ___ .", "Thank you for ___ . (gracias por ...)"],
      }),
    ],
  }),
];
