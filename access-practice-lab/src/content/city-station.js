// Language City missions: Central Station (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const STATION_MISSIONS = [
  mission({
    id: "find-the-bus",
    place: "station",
    title: ["Find the bus", "Encuentra el autobús"],
    goal: [
      "Read a schedule, hear a platform change, ask if a bus goes to the library, and check a number you may have misheard.",
      "Lee un horario, escucha un cambio de andén, pregunta si un autobús va a la biblioteca y verifica un número que quizá oíste mal.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "schedule",
        role: "read",
        stim: doc("schedule", "Bus schedule", "Horario de autobuses", [
          [
            "Bus 12 to the Library · 8:10, 8:40, 9:10 · Platform B",
            "Autobús 12 a la Biblioteca · 8:10, 8:40, 9:10 · Andén B",
          ],
          [
            "Bus 5 to the Market · 8:20, 8:50 · Platform A",
            "Autobús 5 al Mercado · 8:20, 8:50 · Andén A",
          ],
          [
            "Bus 9 to the School · every 15 minutes · Platform C",
            "Autobús 9 a la Escuela · cada 15 minutos · Andén C",
          ],
        ]),
        ask: [
          "You need to get to the library and it is 8:15. When is the first bus you can catch?",
          "Necesitas ir a la biblioteca y son las 8:15. ¿Cuándo sale el primer autobús que puedes tomar?",
        ],
        options: [
          [
            "a",
            "8:10",
            "8:10",
            "That bus already left five minutes ago.",
            "Ese autobús ya salió hace cinco minutos.",
          ],
          [
            "b",
            "8:20",
            "8:20",
            "Bus 5 leaves at 8:20, but it goes to the market, not the library.",
            "El autobús 5 sale a las 8:20, pero va al mercado, no a la biblioteca.",
          ],
          [
            "c",
            "8:40",
            "8:40",
            "Yes: Bus 12 goes to the library, and 8:40 is the next time after 8:15.",
            "Sí: el autobús 12 va a la biblioteca y las 8:40 es la siguiente hora después de las 8:15.",
          ],
        ],
        answer: "c",
        words: [
          ["bus", "autobús"],
          ["platform", "andén"],
          ["leaves", "sale"],
          ["after", "después de"],
        ],
        frame: [
          "Bus ___ goes to ___ . The next one leaves at ___ .",
          "Bus ___ goes to ___ . The next one leaves at ___ . (número, lugar y hora)",
        ],
        hint: [
          "First find the bus that goes to the library. Then find the first time that is after 8:15.",
          "Primero busca el autobús que va a la biblioteca. Luego busca la primera hora después de las 8:15.",
        ],
      }),
      choose({
        id: "announcement",
        role: "listen",
        mood: "concerned",
        stim: speech(
          "Attention, riders. Bus twelve to the library will leave from Platform D today because of repairs.",
          "Atención, pasajeros. El autobús doce a la biblioteca saldrá hoy del andén D por reparaciones.",
        ),
        ask: ["Where does Bus 12 leave from today?", "¿De dónde sale hoy el autobús 12?"],
        options: [
          [
            "a",
            "Platform B",
            "Andén B",
            "Platform B is on the schedule, but the announcement changed it.",
            "El andén B está en el horario, pero el anuncio lo cambió.",
          ],
          [
            "b",
            "Platform D",
            "Andén D",
            "Yes: today only, from Platform D because of repairs.",
            "Sí: solo hoy, desde el andén D por reparaciones.",
          ],
          [
            "c",
            "Platform A",
            "Andén A",
            "Platform A is for Bus 5.",
            "El andén A es para el autobús 5.",
          ],
        ],
        answer: "b",
        words: [
          ["platform", "andén"],
          ["today", "hoy"],
          ["repairs", "reparaciones"],
          ["leave from", "salir de"],
        ],
        frame: [
          "Bus 12 leaves from ___ today because of ___ .",
          "Bus 12 leaves from ___ today because of ___ . (andén y razón)",
        ],
        hint: [
          "Listen for the word today and the letter that comes after Platform.",
          "Escucha la palabra today y la letra que viene después de Platform.",
        ],
      }),
      build({
        id: "does-it-go",
        role: "ask",
        target: "question",
        intent: [
          "Ask Ms. Tran if this bus goes to the library.",
          "Pregunta a la señora Tran si este autobús va a la biblioteca.",
        ],
        tiles: ["library", "bus", "Does", "go", "to", "this", "the", "goes", "?"],
        ok: [["Does", "this", "bus", "go", "to", "the", "library", "?"]],
        slips: [
          [
            ["Does", "this", "bus", "goes", "to", "the", "library", "?"],
            "After the helper word, the main verb stays in its plain form.",
            "Después de la palabra auxiliar, el verbo principal queda en su forma simple.",
          ],
          [
            ["this", "bus", "goes", "to", "the", "library", "?"],
            "This tells instead of asks. A question starts with a helper word.",
            "Esto dice en vez de preguntar. Una pregunta empieza con una palabra auxiliar.",
          ],
        ],
        words: [
          ["bus", "autobús"],
          ["go to", "ir a"],
          ["library", "biblioteca"],
          ["this", "este"],
        ],
        frame: [
          "___ this ___ ___ to the ___ ?",
          "___ this ___ ___ to the ___ ? (pregunta adónde va)",
        ],
        hint: [
          "Start with the helper word, then the thing you ask about, then the plain verb.",
          "Empieza con la palabra auxiliar, luego lo que preguntas y luego el verbo simple.",
        ],
      }),
      choose({
        id: "thanks-ms-tran",
        role: "respond",
        target: "thank",
        mood: "happy",
        stim: speech(
          "Yes, that one goes to the library. Go to Platform D. It leaves in ten minutes.",
          "Sí, ese va a la biblioteca. Ve al andén D. Sale en diez minutos.",
        ),
        ask: ["She helped you. What do you say?", "Ella te ayudó. ¿Qué dices?"],
        options: [
          [
            "a",
            "Thank you. I will go to Platform D now.",
            "Gracias. Voy al andén D ahora.",
            "It thanks her and shows you understood what to do.",
            "Le da las gracias y muestra que entendiste qué hacer.",
          ],
          [
            "b",
            "Why Platform D?",
            "¿Por qué el andén D?",
            "She already explained. This sounds like a challenge.",
            "Ya lo explicó. Esto suena como un reto.",
          ],
          [
            "c",
            "Okay.",
            "Está bien.",
            "It is fine but does not thank her or show you understood.",
            "Está bien, pero no le da las gracias ni muestra que entendiste.",
          ],
        ],
        answer: "a",
        words: [
          ["thank you", "gracias"],
          ["I will go", "voy a ir"],
          ["now", "ahora"],
          ["platform", "andén"],
        ],
        frame: ["Thank you. I will ___ now.", "Thank you. I will ___ now. (lo que vas a hacer)"],
        hint: [
          "Thank her first, then say the next step you will take.",
          "Primero dale las gracias y luego di el siguiente paso que harás.",
        ],
      }),
      choose({
        id: "eight-or-eighteen",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Your bus is at gate eight. It is a busy day.",
          "Tu autobús está en la puerta ocho. Es un día ocupado.",
        ),
        ask: [
          "In the noise, eight sounded a lot like eighteen. What do you say?",
          "Con el ruido, eight sonó casi como eighteen. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "What?",
            "¿Qué?",
            "One word does not say which part you missed.",
            "Una palabra no dice qué parte no oíste.",
          ],
          [
            "b",
            "Eighteen.",
            "Dieciocho.",
            "You would be guessing and could go to the wrong gate.",
            "Estarías adivinando y podrías ir a la puerta equivocada.",
          ],
          [
            "c",
            "Sorry, did you say eight or eighteen?",
            "Perdón, ¿dijo eight o eighteen?",
            "It names the two numbers you are unsure about, so she can answer quickly.",
            "Nombra los dos números de los que dudas, así ella puede responder rápido.",
          ],
        ],
        answer: "c",
        words: [
          ["did you say", "¿dijo?"],
          ["or", "o"],
          ["sorry", "perdón"],
          ["again", "otra vez"],
        ],
        frame: [
          "Sorry, did you say ___ or ___ ?",
          "Sorry, did you say ___ or ___ ? (los dos números)",
        ],
        hint: [
          "Say the two things you might have heard and ask which one she said.",
          "Di las dos cosas que quizá oíste y pregunta cuál dijo.",
        ],
      }),
      say({
        id: "ask-help",
        target: "request",
        prompt: [
          "You cannot find Platform D. Ask someone nearby for help, politely.",
          "No encuentras el andén D. Pide ayuda con cortesía a alguien cercano.",
        ],
        words: [
          ["excuse me", "disculpe"],
          ["could you", "¿podría?"],
          ["show me", "mostrarme"],
          ["please", "por favor"],
        ],
        frame: [
          "Excuse me, could you ___ , please?",
          "Excuse me, could you ___ , please? (tu petición)",
        ],
      }),
    ],
  }),
  mission({
    id: "buy-a-pass",
    place: "station",
    title: ["Buy a bus pass", "Compra un pase de autobús"],
    goal: [
      "Compare fares, hear when a pass starts, ask about the last bus, accept a change, and fix an order.",
      "Compara tarifas, escucha cuándo empieza un pase, pregunta por el último autobús, acepta un cambio y arregla un pedido.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "fares",
        role: "read",
        stim: doc("sign", "Fares", "Tarifas", [
          ["Single ride · $2", "Un viaje · $2"],
          ["Day pass (unlimited rides) · $6", "Pase del día (viajes ilimitados) · $6"],
          ["Children under 5 ride free", "Los niños menores de 5 viajan gratis"],
        ]),
        ask: [
          "You will ride four times today. Which costs less?",
          "Vas a viajar cuatro veces hoy. ¿Qué cuesta menos?",
        ],
        options: [
          [
            "a",
            "Four single rides cost $6.",
            "Cuatro viajes cuestan $6.",
            "Four rides at $2 each is more than $6.",
            "Cuatro viajes a $2 cada uno son más de $6.",
          ],
          [
            "b",
            "They cost the same.",
            "Cuestan lo mismo.",
            "Compare the totals. They are not equal.",
            "Compara los totales. No son iguales.",
          ],
          [
            "c",
            "The day pass costs less: $6 instead of $8.",
            "El pase del día cuesta menos: $6 en lugar de $8.",
            "Four single rides cost 4 times $2, which is $8.",
            "Cuatro viajes cuestan 4 por $2, que son $8.",
          ],
        ],
        answer: "c",
        words: [
          ["single ride", "un viaje"],
          ["day pass", "pase del día"],
          ["costs less", "cuesta menos"],
          ["instead of", "en lugar de"],
        ],
        frame: [
          "The ___ costs less: ___ instead of ___ .",
          "The ___ costs less: ___ instead of ___ . (qué cuesta menos y las dos cantidades)",
        ],
        hint: [
          "Multiply the price of one ride by four, then compare that total with the day pass.",
          "Multiplica el precio de un viaje por cuatro y compara ese total con el pase del día.",
        ],
      }),
      choose({
        id: "starts",
        role: "listen",
        stim: speech(
          "For a student pass, fill in this form and show your school card. The pass starts next Monday.",
          "Para un pase de estudiante, llena este formulario y muestra tu tarjeta de la escuela. El pase empieza el próximo lunes.",
        ),
        ask: ["When does the student pass start?", "¿Cuándo empieza el pase de estudiante?"],
        options: [
          [
            "a",
            "Today",
            "Hoy",
            "She said a day of the week, not today.",
            "Dijo un día de la semana, no hoy.",
          ],
          [
            "b",
            "On the first of the month",
            "El primero del mes",
            "That is not in what she said.",
            "Eso no está en lo que dijo.",
          ],
          [
            "c",
            "Next Monday",
            "El próximo lunes",
            "Yes: the pass starts next Monday.",
            "Sí: el pase empieza el próximo lunes.",
          ],
        ],
        answer: "c",
        words: [
          ["student pass", "pase de estudiante"],
          ["starts", "empieza"],
          ["next", "próximo"],
          ["form", "formulario"],
        ],
        frame: ["The pass starts ___ .", "The pass starts ___ . (cuándo)"],
        hint: [
          "Listen for the last sentence. It tells you when, with a day name.",
          "Escucha la última oración. Dice cuándo, con el nombre de un día.",
        ],
      }),
      build({
        id: "last-bus",
        role: "ask",
        target: "question",
        intent: [
          "Ask what time the last bus leaves.",
          "Pregunta a qué hora sale el último autobús.",
        ],
        tiles: ["leave", "time", "What", "bus", "does", "last", "the", "?", "leaves"],
        ok: [["What", "time", "does", "the", "last", "bus", "leave", "?"]],
        slips: [
          [
            ["What", "time", "the", "last", "bus", "leaves", "?"],
            "This question needs a helper word right after What time.",
            "Esta pregunta necesita una palabra auxiliar justo después de What time.",
          ],
          [
            ["What", "time", "does", "the", "last", "bus", "leaves", "?"],
            "After the helper word, the main verb stays in its plain form.",
            "Después de la palabra auxiliar, el verbo principal queda en su forma simple.",
          ],
        ],
        words: [
          ["what time", "a qué hora"],
          ["last bus", "último autobús"],
          ["leave", "salir"],
          ["does", "auxiliar de pregunta"],
        ],
        frame: [
          "What time ___ the ___ bus ___ ?",
          "What time ___ the ___ bus ___ ? (pregunta una hora)",
        ],
        hint: [
          "Begin with What time, then the helper word, then the thing, then the plain verb.",
          "Empieza con What time, luego la palabra auxiliar, luego la cosa y luego el verbo simple.",
        ],
      }),
      choose({
        id: "short",
        role: "respond",
        target: "accept",
        mood: "concerned",
        stim: speech(
          "You are short by fifty cents for the day pass. Do you want a single ride instead?",
          "Te faltan cincuenta centavos para el pase del día. ¿Quieres un viaje sencillo en su lugar?",
        ),
        ask: [
          "You decide to take a single ride. How do you answer?",
          "Decides tomar un viaje sencillo. ¿Cómo respondes?",
        ],
        options: [
          [
            "a",
            "Give me the day pass.",
            "Dame el pase del día.",
            "That ignores what she just said about money.",
            "Eso ignora lo que ella acaba de decir sobre el dinero.",
          ],
          [
            "b",
            "That is too much.",
            "Eso es demasiado.",
            "It complains but does not answer her question.",
            "Se queja, pero no responde a su pregunta.",
          ],
          [
            "c",
            "Yes, one single ride, please. Thank you.",
            "Sí, un viaje sencillo, por favor. Gracias.",
            "It accepts the offer, says what you want, and is polite.",
            "Acepta la oferta, dice qué quieres y es cortés.",
          ],
        ],
        answer: "c",
        words: [
          ["yes", "sí"],
          ["single ride", "viaje sencillo"],
          ["please", "por favor"],
          ["thank you", "gracias"],
        ],
        frame: ["Yes, ___ , please. ___ .", "Yes, ___ , please. ___ . (qué quieres y gracias)"],
        hint: [
          "Answer her question first, then say exactly what you want, politely.",
          "Responde primero su pregunta y luego di exactamente qué quieres, con cortesía.",
        ],
      }),
      choose({
        id: "two-passes",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here are your two day passes. That is twelve dollars.",
          "Aquí están tus dos pases del día. Son doce dólares.",
        ),
        ask: [
          "You asked for one day pass, not two. What do you say?",
          "Pediste un pase del día, no dos. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "I only said one!",
            "¡Solo dije uno!",
            "It is true but sounds annoyed, and it does not ask for a fix.",
            "Es cierto, pero suena molesto y no pide un arreglo.",
          ],
          [
            "b",
            "Excuse me, I asked for one day pass, not two. Could you fix that, please?",
            "Disculpe, pedí un pase del día, no dos. ¿Podría arreglarlo, por favor?",
            "It says what you asked for and asks politely for a fix.",
            "Dice qué pediste y pide con cortesía un arreglo.",
          ],
          [
            "c",
            "Fine.",
            "Bien.",
            "You would pay for a pass you do not want.",
            "Pagarías por un pase que no quieres.",
          ],
        ],
        answer: "b",
        words: [
          ["I asked for", "pedí"],
          ["not", "no"],
          ["fix", "arreglar"],
          ["excuse me", "disculpe"],
        ],
        frame: [
          "Excuse me, I asked for ___ , not ___ . Could you ___ , please?",
          "Excuse me, I asked for ___ , not ___ . Could you ___ , please? (lo que pediste y lo que recibiste)",
        ],
        hint: [
          "Say what you asked for, say what you got, then ask for a fix with a polite starter.",
          "Di qué pediste, qué recibiste y luego pide un arreglo con una frase cortés.",
        ],
      }),
      say({
        id: "offer-help",
        target: "offer",
        prompt: [
          "A rider looks lost. Offer to help in your own words.",
          "Un pasajero parece perdido. Ofrece ayuda con tus propias palabras.",
        ],
        words: [
          ["can I help", "¿puedo ayudar?"],
          ["let me", "déjame"],
          ["show you", "mostrarte"],
          ["where", "dónde"],
        ],
        frame: ["Can I help you ___ ?", "Can I help you ___ ? (tu oferta)"],
      }),
    ],
  }),
];
