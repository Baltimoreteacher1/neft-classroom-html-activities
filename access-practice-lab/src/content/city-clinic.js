// Language City missions: Sunrise Clinic (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const CLINIC_MISSIONS = [
  mission({
    id: "check-in",
    place: "clinic",
    title: ["Check in", "Regístrate"],
    goal: [
      "Read the clinic sign, describe how you feel, ask a question, and check you understood.",
      "Lee el letrero de la clínica, describe cómo te sientes, haz una pregunta y verifica que entendiste.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "sign",
        role: "read",
        stim: doc("sign", "Welcome to Sunrise Clinic", "Bienvenido a la Clínica Amanecer", [
          ["Check in at the front desk.", "Regístrate en el mostrador."],
          ["Please wash your hands.", "Por favor lávate las manos."],
          [
            "If you have a cough or a fever, put on a mask.",
            "Si tienes tos o fiebre, ponte una mascarilla.",
          ],
        ]),
        ask: [
          "You have a cough. What does the sign tell you to do?",
          "Tienes tos. ¿Qué te dice el letrero que hagas?",
        ],
        options: [
          [
            "a",
            "Wait outside all day.",
            "Esperar afuera todo el día.",
            "The sign never says to wait outside.",
            "El letrero nunca dice que esperes afuera.",
          ],
          [
            "b",
            "Skip the front desk.",
            "Saltarte el mostrador.",
            "The first line says everyone checks in at the desk.",
            "La primera línea dice que todos se registran en el mostrador.",
          ],
          [
            "c",
            "Put on a mask.",
            "Ponerte una mascarilla.",
            "Yes: a cough or fever means a mask.",
            "Sí: tos o fiebre significa mascarilla.",
          ],
        ],
        answer: "c",
        words: [
          ["cough", "tos"],
          ["fever", "fiebre"],
          ["mask", "mascarilla"],
          ["if", "si"],
        ],
        frame: ["If you have ___ , ___ .", "If you have ___ , ___ . (condición y qué hacer)"],
        hint: [
          "Find the sentence that begins with If and matches your problem.",
          "Busca la oración que empieza con If y coincide con tu problema.",
        ],
      }),
      choose({
        id: "two-things",
        role: "listen",
        mood: "concerned",
        stim: speech(
          "Where does it hurt, and when did it start?",
          "¿Dónde te duele y cuándo empezó?",
        ),
        ask: [
          "What two things does the nurse want to know?",
          "¿Qué dos cosas quiere saber la enfermera?",
        ],
        options: [
          [
            "a",
            "Your age and your grade",
            "Tu edad y tu grado",
            "Those are not in her question.",
            "Eso no está en su pregunta.",
          ],
          [
            "b",
            "Your address and your phone",
            "Tu dirección y tu teléfono",
            "She asked about your body and about time.",
            "Preguntó por tu cuerpo y por el tiempo.",
          ],
          [
            "c",
            "Where it hurts and when it started",
            "Dónde te duele y cuándo empezó",
            "Yes: a place on your body and a time.",
            "Sí: un lugar del cuerpo y un momento.",
          ],
        ],
        answer: "c",
        words: [
          ["hurts", "duele"],
          ["started", "empezó"],
          ["where", "dónde"],
          ["when", "cuándo"],
        ],
        frame: [
          "She wants to know ___ and ___ .",
          "She wants to know ___ and ___ . (las dos preguntas)",
        ],
        hint: [
          "Listen for two question words. Each one asks about a different thing.",
          "Escucha dos palabras interrogativas. Cada una pregunta algo diferente.",
        ],
      }),
      choose({
        id: "describe",
        role: "respond",
        target: "describe",
        mood: "concerned",
        stim: speech(
          "Okay. Tell me what is wrong.",
          "Bien. Dime qué te pasa.",
        ),
        ask: ["Your throat hurts and it started yesterday. How do you tell Nurse Amara?", "Te duele la garganta y empezó ayer. ¿Cómo le dices a la enfermera Amara?"],
        options: [
          [
            "a",
            "I am sick.",
            "Estoy enfermo.",
            "True, but she asked where it hurts and when it started.",
            "Es cierto, pero preguntó dónde duele y cuándo empezó.",
          ],
          [
            "b",
            "Yesterday.",
            "Ayer.",
            "That answers only when. She also needs where.",
            "Eso responde solo cuándo. También necesita dónde.",
          ],
          [
            "c",
            "My throat hurts, and it started yesterday.",
            "Me duele la garganta y empezó ayer.",
            "It answers both parts: where it hurts and when it began.",
            "Responde las dos partes: dónde duele y cuándo empezó.",
          ],
        ],
        answer: "c",
        words: [
          ["my throat", "mi garganta"],
          ["my head", "mi cabeza"],
          ["hurts", "duele"],
          ["yesterday", "ayer"],
        ],
        frame: [
          "My ___ hurts, and it started ___ .",
          "My ___ hurts, and it started ___ . (parte del cuerpo y cuándo)",
        ],
        hint: [
          "Answer both questions in one sentence: the place on your body, then the time.",
          "Responde las dos preguntas en una oración: el lugar del cuerpo y luego el tiempo.",
        ],
      }),
      build({
        id: "home",
        role: "ask",
        target: "question",
        intent: [
          "Ask the nurse if you need to stay home from school.",
          "Pregunta a la enfermera si necesitas quedarte en casa sin ir a la escuela.",
        ],
        tiles: ["stay", "I", "Do", "home", "need", "?", "to", "Does"],
        ok: [["Do", "I", "need", "to", "stay", "home", "?"]],
        slips: [
          [
            ["Does", "I", "need", "to", "stay", "home", "?"],
            "The helper word has to match the subject. I takes a different helper than Does.",
            "La palabra auxiliar debe concordar con el sujeto. I lleva otro auxiliar, no Does.",
          ],
          [
            ["I", "need", "to", "stay", "home", "?"],
            "This tells instead of asks. A question starts with a helper word.",
            "Esto dice en vez de preguntar. Una pregunta empieza con una palabra auxiliar.",
          ],
        ],
        words: [
          ["need", "necesitar"],
          ["stay home", "quedarme en casa"],
          ["do", "auxiliar de pregunta"],
          ["I", "yo"],
        ],
        frame: [
          "___ I need ___ ___ home ?",
          "___ I need ___ ___ home ? (empieza con la palabra auxiliar)",
        ],
        hint: [
          "Start with the helper word that goes with I, then say what you need.",
          "Empieza con la palabra auxiliar que va con I y luego di qué necesitas.",
        ],
      }),
      choose({
        id: "twice",
        role: "repair",
        target: "clarify",
        mood: "pleased",
        stim: speech(
          "Rest, drink water, and take this medicine twice a day.",
          "Descansa, toma agua y toma esta medicina dos veces al día.",
        ),
        ask: [
          "You are not sure what twice means. What do you say?",
          "No estás seguro de qué significa twice. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "Okay.",
            "Está bien.",
            "You would leave unsure how much medicine to take.",
            "Saldrías sin saber cuánta medicina tomar.",
          ],
          [
            "b",
            "I don't understand you.",
            "No te entiendo.",
            "This sounds like the nurse did something wrong. Name the word you need.",
            "Suena como si la enfermera hiciera algo mal. Nombra la palabra que necesitas.",
          ],
          [
            "c",
            "Just to check, does twice mean two times a day?",
            "Solo para verificar, ¿twice significa dos veces al día?",
            "It names the word and checks your idea, so she can say yes or fix it.",
            "Nombra la palabra y verifica tu idea, así ella puede decir sí o corregir.",
          ],
        ],
        answer: "c",
        words: [
          ["just to check", "solo para verificar"],
          ["does ... mean", "¿significa...?"],
          ["two times", "dos veces"],
          ["a day", "al día"],
        ],
        frame: [
          "Just to check, does ___ mean ___ ?",
          "Just to check, does ___ mean ___ ? (la palabra y tu idea)",
        ],
        hint: [
          "Name the word you do not know and say your own idea of it as a question.",
          "Nombra la palabra que no conoces y di tu idea de ella como pregunta.",
        ],
      }),
      say({
        id: "feel",
        target: "describe",
        prompt: [
          "Tell the nurse how you feel and what hurts, in your own words.",
          "Dile a la enfermera cómo te sientes y qué te duele, con tus propias palabras.",
        ],
        words: [
          ["I feel", "me siento"],
          ["it hurts", "me duele"],
          ["started", "empezó"],
          ["tired", "cansado"],
        ],
        frame: [
          "My ___ hurts and it started ___ .",
          "My ___ hurts and it started ___ . (qué duele y cuándo)",
        ],
      }),
    ],
  }),
  mission({
    id: "pick-up-medicine",
    place: "clinic",
    title: ["Pick up medicine", "Recoge una medicina"],
    goal: [
      "Read a medicine label, hear a warning, answer about allergies, and fix a mix-up.",
      "Lee la etiqueta de una medicina, escucha una advertencia, responde sobre alergias y arregla una confusión.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "label",
        role: "read",
        stim: doc("label", "Medicine label", "Etiqueta de la medicina", [
          [
            "Take 1 spoon (5 ml) two times a day with food.",
            "Toma 1 cucharada (5 ml) dos veces al día con comida.",
          ],
          ["Do not take more than 2 spoons in one day.", "No tomes más de 2 cucharadas en un día."],
          ["Keep in a cool, dry place.", "Guárdala en un lugar fresco y seco."],
        ]),
        ask: [
          "What is the most medicine you can take in one day?",
          "¿Cuál es la mayor cantidad de medicina que puedes tomar en un día?",
        ],
        options: [
          [
            "a",
            "1 spoon",
            "1 cucharada",
            "One spoon is the amount for one time, not the daily limit.",
            "Una cucharada es la cantidad de una vez, no el límite diario.",
          ],
          [
            "b",
            "5 spoons",
            "5 cucharadas",
            "The label gives a smaller limit. Read the second line.",
            "La etiqueta da un límite menor. Lee la segunda línea.",
          ],
          [
            "c",
            "2 spoons",
            "2 cucharadas",
            "Yes: do not take more than 2 spoons in one day.",
            "Sí: no tomes más de 2 cucharadas en un día.",
          ],
        ],
        answer: "c",
        words: [
          ["spoon", "cucharada"],
          ["do not take", "no tomes"],
          ["more than", "más de"],
          ["in one day", "en un día"],
        ],
        frame: [
          "Do not take more than ___ in ___ .",
          "Do not take more than ___ in ___ . (límite y tiempo)",
        ],
        hint: [
          "Find the line that begins with Do not. A limit tells you the most, not the usual amount.",
          "Busca la línea que empieza con Do not. Un límite dice el máximo, no la cantidad usual.",
        ],
      }),
      choose({
        id: "sleepy",
        role: "listen",
        mood: "concerned",
        stim: speech(
          "This medicine can make you sleepy, so do not ride a bike after you take it.",
          "Esta medicina puede darte sueño, así que no andes en bicicleta después de tomarla.",
        ),
        ask: ["What is the warning?", "¿Cuál es la advertencia?"],
        options: [
          [
            "a",
            "Do not eat food with it.",
            "No la tomes con comida.",
            "The label says to take it with food.",
            "La etiqueta dice que se toma con comida.",
          ],
          [
            "b",
            "You may feel sleepy, so do not ride a bike.",
            "Puedes sentir sueño, así que no andes en bicicleta.",
            "Yes: sleepy is the risk and no bike is the safety rule.",
            "Sí: el sueño es el riesgo y no andar en bicicleta es la regla de seguridad.",
          ],
          [
            "c",
            "Keep it in a cool place.",
            "Guárdala en un lugar fresco.",
            "That is on the label, not in what she just said.",
            "Eso está en la etiqueta, no en lo que ella acaba de decir.",
          ],
        ],
        answer: "b",
        words: [
          ["sleepy", "con sueño"],
          ["can make you", "puede hacerte"],
          ["so", "así que"],
          ["ride", "andar"],
        ],
        frame: [
          "It can make you ___ , so ___ .",
          "It can make you ___ , so ___ . (el riesgo y la regla)",
        ],
        hint: [
          "Listen for the problem the medicine can cause and the word so, which leads to the rule.",
          "Escucha el problema que puede causar la medicina y la palabra so, que lleva a la regla.",
        ],
      }),
      build({
        id: "milk",
        role: "ask",
        target: "question",
        intent: [
          "Ask if you can take the medicine with milk.",
          "Pregunta si puedes tomar la medicina con leche.",
        ],
        tiles: ["milk", "take", "Can", "it", "to", "?", "I", "with"],
        ok: [["Can", "I", "take", "it", "with", "milk", "?"]],
        slips: [
          [
            ["Can", "I", "to", "take", "it", "with", "milk", "?"],
            "After Can, use the plain verb with no to.",
            "Después de Can, usa el verbo simple sin to.",
          ],
          [
            ["I", "Can", "take", "it", "with", "milk", "?"],
            "A question begins with Can. The person comes right after it, not before it.",
            "Una pregunta empieza con Can. La persona va justo después, no antes.",
          ],
        ],
        words: [
          ["milk", "leche"],
          ["take", "tomar"],
          ["with", "con"],
          ["can", "poder"],
        ],
        frame: [
          "Can I ___ it ___ ___ ?",
          "Can I ___ it ___ ___ ? (pregunta si puedes tomar la medicina así)",
        ],
        hint: [
          "Start with Can, say who, then the plain verb, then what goes with it.",
          "Empieza con Can, di quién, luego el verbo simple y luego qué lo acompaña.",
        ],
      }),
      choose({
        id: "allergy",
        role: "respond",
        target: "describe",
        mood: "concerned",
        stim: speech(
          "Do you have any allergies?",
          "¿Tienes alguna alergia?",
        ),
        ask: ["You are allergic to penicillin. How do you answer so you are safe?", "Eres alérgico a la penicilina. ¿Cómo respondes para estar seguro?"],
        options: [
          [
            "a",
            "No, I am fine.",
            "No, estoy bien.",
            "That tells her you have no allergies, which is not true for you.",
            "Eso le dice que no tienes alergias, y no es cierto para ti.",
          ],
          [
            "b",
            "Maybe.",
            "Quizá.",
            "Maybe is not clear enough for safety. Say what you know.",
            "Maybe no es suficientemente claro para tu seguridad. Di lo que sabes.",
          ],
          [
            "c",
            "Yes. I am allergic to penicillin.",
            "Sí. Soy alérgico a la penicilina.",
            "It answers yes or no and then names the allergy.",
            "Responde sí o no y luego nombra la alergia.",
          ],
        ],
        answer: "c",
        words: [
          ["allergic to", "alérgico a"],
          ["yes", "sí"],
          ["no", "no"],
          ["I am", "yo soy"],
        ],
        frame: ["___ . I am allergic to ___ .", "___ . I am allergic to ___ . (sí o no, y qué)"],
        hint: [
          "Answer yes or no first, then give the name of the medicine you cannot take.",
          "Responde sí o no primero y luego da el nombre de la medicina que no puedes tomar.",
        ],
      }),
      choose({
        id: "mixup",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here is your throat spray. Have a nice day!",
          "Aquí está tu spray para la garganta. ¡Que tengas un buen día!",
        ),
        ask: [
          "You need cough syrup, not throat spray. What do you say?",
          "Necesitas jarabe para la tos, no spray para la garganta. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "Excuse me, I think there is a mix-up. I need cough syrup, not throat spray.",
            "Disculpe, creo que hay una confusión. Necesito jarabe para la tos, no spray para la garganta.",
            "It names the mix-up politely and says exactly what you need.",
            "Nombra la confusión con cortesía y dice exactamente qué necesitas.",
          ],
          [
            "b",
            "This is not what I want.",
            "Esto no es lo que quiero.",
            "It says no but not what you need, so she cannot fix it.",
            "Dice que no, pero no qué necesitas, así que ella no puede arreglarlo.",
          ],
          [
            "c",
            "Thanks.",
            "Gracias.",
            "You would leave with the wrong medicine.",
            "Te irías con la medicina equivocada.",
          ],
        ],
        answer: "a",
        words: [
          ["mix-up", "confusión"],
          ["I need", "necesito"],
          ["not", "no"],
          ["cough syrup", "jarabe para la tos"],
        ],
        frame: [
          "Excuse me, there is a mix-up. I need ___ , not ___ .",
          "Excuse me, there is a mix-up. I need ___ , not ___ . (lo que necesitas y lo que recibiste)",
        ],
        hint: [
          "Say there may be a mistake, then contrast what you need with what you got.",
          "Di que puede haber un error y contrasta lo que necesitas con lo que recibiste.",
        ],
      }),
      say({
        id: "medicine-question",
        target: "question",
        prompt: [
          "Write one question you would ask about your medicine.",
          "Escribe una pregunta que harías sobre tu medicina.",
        ],
        words: [
          ["how many", "cuántos"],
          ["when", "cuándo"],
          ["can I", "¿puedo?"],
          ["medicine", "medicina"],
        ],
        frame: [
          "How many ___ should I ___ ?",
          "How many ___ should I ___ ? (una pregunta con how many)",
        ],
      }),
    ],
  }),
];
