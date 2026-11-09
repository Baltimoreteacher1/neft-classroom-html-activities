// Language City missions: Lincoln School Office (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const SCHOOL_OFFICE_MISSIONS = [
  mission({
    id: "late-pass",
    place: "school-office",
    title: ["Get a late pass", "Consigue un pase de tardanza"],
    goal: [
      "Read the late rule, explain why you are late, ask where a room is, and fix a wrong room number.",
      "Lee la regla de las tardanzas, explica por qué llegas tarde, pregunta dónde está un salón y arregla un número de salón equivocado.",
    ],
    use: "Explain",
    steps: [
      choose({
        id: "late-rule",
        role: "read",
        stim: doc("sign", "Late? Start here.", "¿Llegas tarde? Empieza aquí.", [
          [
            "Sign in at the office and write the time.",
            "Regístrate en la oficina y escribe la hora.",
          ],
          ["Get a pass before you go to class.", "Consigue un pase antes de ir a clase."],
          ["Office hours: 7:30 to 4:00", "Horario de la oficina: 7:30 a 4:00"],
        ]),
        ask: [
          "You arrive late at 8:15. What do you do first?",
          "Llegas tarde a las 8:15. ¿Qué haces primero?",
        ],
        options: [
          [
            "a",
            "Go straight to class.",
            "Ir directo a clase.",
            "The sign says to get a pass before class.",
            "El letrero dice que consigas un pase antes de clase.",
          ],
          [
            "b",
            "Sign in at the office and get a pass.",
            "Registrarte en la oficina y conseguir un pase.",
            "Yes: sign in and get a pass first.",
            "Sí: primero regístrate y consigue un pase.",
          ],
          [
            "c",
            "Wait until 4:00.",
            "Esperar hasta las 4:00.",
            "Four o'clock is when the office closes, not when you act.",
            "Las 4:00 es cuando cierra la oficina, no cuando actúas.",
          ],
        ],
        answer: "b",
        words: [
          ["sign in", "registrarse"],
          ["pass", "pase"],
          ["before", "antes de"],
          ["first", "primero"],
        ],
        frame: [
          "First, ___ at the office. Then get ___ before class.",
          "First, ___ at the office. Then get ___ before class. (los dos pasos)",
        ],
        hint: [
          "Read the first two lines. They give the steps in order.",
          "Lee las dos primeras líneas. Dan los pasos en orden.",
        ],
      }),
      choose({
        id: "why-late",
        role: "respond",
        target: "explain",
        mood: "concerned",
        stim: speech("Why are you late today?", "¿Por qué llegas tarde hoy?"),
        ask: [
          "Your bus was late because of heavy rain. How do you explain?",
          "Tu autobús llegó tarde por la lluvia fuerte. ¿Cómo lo explicas?",
        ],
        options: [
          [
            "a",
            "It is not my fault.",
            "No es mi culpa.",
            "It defends you but gives Ms. Brooks no reason she can write down.",
            "Te defiende, pero no da a la señora Brooks una razón que pueda anotar.",
          ],
          [
            "b",
            "Because.",
            "Porque.",
            "Because needs a reason after it.",
            "Because necesita una razón después.",
          ],
          [
            "c",
            "My bus was late because of the heavy rain.",
            "Mi autobús llegó tarde por la lluvia fuerte.",
            "It gives the reason in one clear sentence with because.",
            "Da la razón en una oración clara con because.",
          ],
        ],
        answer: "c",
        words: [
          ["because", "porque"],
          ["my bus", "mi autobús"],
          ["was late", "llegó tarde"],
          ["rain", "lluvia"],
        ],
        frame: ["I am late because ___ .", "I am late because ___ . (tu razón)"],
        hint: [
          "Say what happened, then use a connecting word that introduces the reason.",
          "Di qué pasó y usa una palabra conectora que introduzca la razón.",
        ],
      }),
      choose({
        id: "room",
        role: "listen",
        stim: speech(
          "Many buses were late. Take this pass to your teacher in Room twelve. It is down the hall on the right.",
          "Muchos autobuses llegaron tarde. Lleva este pase a tu maestra en el salón doce. Está en el pasillo, a la derecha.",
        ),
        ask: ["Where do you take the pass?", "¿Dónde llevas el pase?"],
        options: [
          [
            "a",
            "To the bus driver",
            "Al conductor del autobús",
            "The driver was not mentioned.",
            "No se mencionó al conductor.",
          ],
          [
            "b",
            "To the principal",
            "A la directora",
            "She did not say principal. Listen for who and which room.",
            "No dijo directora. Escucha quién y qué salón.",
          ],
          [
            "c",
            "To your teacher in Room twelve",
            "A tu maestra en el salón doce",
            "Yes: your teacher, in Room twelve.",
            "Sí: tu maestra, en el salón doce.",
          ],
        ],
        answer: "c",
        words: [
          ["pass", "pase"],
          ["teacher", "maestra"],
          ["room", "salón"],
          ["hall", "pasillo"],
        ],
        frame: [
          "I take the pass to ___ in Room ___ .",
          "I take the pass to ___ in Room ___ . (a quién y qué salón)",
        ],
        hint: [
          "Listen for two things: a person and a place with a number.",
          "Escucha dos cosas: una persona y un lugar con número.",
        ],
      }),
      build({
        id: "where-room",
        role: "ask",
        target: "question",
        intent: [
          "Ask Ms. Brooks where Room 12 is.",
          "Pregunta a la señora Brooks dónde está el salón 12.",
        ],
        tiles: ["12", "Where", "Room", "is", "?", "are"],
        ok: [["Where", "is", "Room", "12", "?"]],
        slips: [
          [
            ["Where", "Room", "12", "is", "?"],
            "In a where question, the helper word comes right after Where.",
            "En una pregunta con where, la palabra auxiliar va justo después de Where.",
          ],
          [
            ["Where", "are", "Room", "12", "?"],
            "Room 12 is one place. The helper word has to match one thing.",
            "El salón 12 es un solo lugar. La palabra auxiliar debe concordar con una sola cosa.",
          ],
        ],
        words: [
          ["where", "dónde"],
          ["room", "salón"],
          ["is", "está"],
          ["down the hall", "en el pasillo"],
        ],
        frame: ["Where ___ Room ___ ?", "Where ___ Room ___ ? (pregunta dónde está un lugar)"],
        hint: [
          "Start with Where, then the helper word, then the name of the place.",
          "Empieza con Where, luego la palabra auxiliar y luego el nombre del lugar.",
        ],
      }),
      choose({
        id: "wrong-room",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here is your pass. It says Room twenty-one. Off you go!",
          "Aquí está tu pase. Dice salón veintiuno. ¡Vete!",
        ),
        ask: [
          "Your room is twelve, not twenty-one. What do you say?",
          "Tu salón es el doce, no el veintiuno. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "That is wrong.",
            "Eso está mal.",
            "It tells her she is wrong without saying what you need.",
            "Le dice que se equivoca sin decir qué necesitas.",
          ],
          [
            "b",
            "Okay.",
            "Está bien.",
            "You would take your pass to the wrong room.",
            "Llevarías tu pase al salón equivocado.",
          ],
          [
            "c",
            "I think my room is twelve, not twenty-one. Could you check the pass, please?",
            "Creo que mi salón es el doce, no el veintiuno. ¿Podría revisar el pase, por favor?",
            "It says what you think is true and asks politely for a check.",
            "Dice lo que crees que es cierto y pide con cortesía una revisión.",
          ],
        ],
        answer: "c",
        words: [
          ["I think", "creo que"],
          ["not", "no"],
          ["check", "revisar"],
          ["pass", "pase"],
        ],
        frame: [
          "I think my room is ___ , not ___ . Could you ___ ?",
          "I think my room is ___ , not ___ . Could you ___ ? (el número correcto y el que dice el pase)",
        ],
        hint: [
          "Compare the number you know with the number on the pass, then ask for a second look.",
          "Compara el número que sabes con el del pase y pide que lo revisen otra vez.",
        ],
      }),
      say({
        id: "sorry-late",
        target: "apologize",
        prompt: [
          "Tell your teacher you are sorry for being late and give a reason.",
          "Dile a tu maestra que lamentas llegar tarde y da una razón.",
        ],
        words: [
          ["sorry", "lo siento"],
          ["late", "tarde"],
          ["because", "porque"],
          ["excuse me", "disculpe"],
        ],
        frame: [
          "I am sorry I am late because ___ .",
          "I am sorry I am late because ___ . (tu razón)",
        ],
      }),
    ],
  }),
  mission({
    id: "lost-bottle",
    place: "school-office",
    title: ["Find a lost bottle", "Encuentra una botella perdida"],
    goal: [
      "Read the lost-and-found sign, describe your item, ask about the rules, and politely say a bottle is not yours.",
      "Lee el letrero de objetos perdidos, describe tu objeto, pregunta por las reglas y di con cortesía que una botella no es tuya.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "lost-sign",
        role: "read",
        stim: doc("sign", "Lost something?", "¿Perdiste algo?", [
          [
            "Tell the office what it is, what color it is, and where you last saw it.",
            "Dile a la oficina qué es, de qué color es y dónde lo viste por última vez.",
          ],
          ["Items are kept for 30 days.", "Los objetos se guardan por 30 días."],
        ]),
        ask: ["What should you tell the office?", "¿Qué debes decirle a la oficina?"],
        options: [
          [
            "a",
            "Your name and grade",
            "Tu nombre y tu grado",
            "The sign does not ask for those.",
            "El letrero no pide eso.",
          ],
          [
            "b",
            "What it is, its color, and where you last saw it",
            "Qué es, su color y dónde lo viste por última vez",
            "Yes: those are the three things on the first line.",
            "Sí: esas son las tres cosas de la primera línea.",
          ],
          [
            "c",
            "Your teacher and your address",
            "Tu maestra y tu dirección",
            "The sign does not ask for those.",
            "El letrero no pide eso.",
          ],
        ],
        answer: "b",
        words: [
          ["lost", "perdido"],
          ["color", "color"],
          ["last saw", "vio por última vez"],
          ["kept", "guardados"],
        ],
        frame: [
          "Tell the office what it ___ , what ___ it is, and where you ___ .",
          "Tell the office what it ___ , what ___ it is, and where you ___ . (las tres cosas)",
        ],
        hint: [
          "Read the first line. It lists three pieces of information.",
          "Lee la primera línea. Enumera tres datos.",
        ],
      }),
      choose({
        id: "two-bottles",
        role: "listen",
        mood: "happy",
        stim: speech(
          "I have a blue water bottle and a green water bottle. Which one is yours, and does it have a sticker?",
          "Tengo una botella de agua azul y una verde. ¿Cuál es la tuya y tiene una calcomanía?",
        ),
        ask: ["What does Ms. Brooks want to know?", "¿Qué quiere saber la señora Brooks?"],
        options: [
          [
            "a",
            "Which bottle is yours, and if it has a sticker",
            "Cuál botella es la tuya y si tiene una calcomanía",
            "Yes: which one, and the sticker.",
            "Sí: cuál es y la calcomanía.",
          ],
          [
            "b",
            "How much the bottle cost",
            "Cuánto costó la botella",
            "Price is not in her question.",
            "El precio no está en su pregunta.",
          ],
          [
            "c",
            "Where you bought the bottle",
            "Dónde compraste la botella",
            "Where you bought it is not in her question.",
            "Dónde la compraste no está en su pregunta.",
          ],
        ],
        answer: "a",
        words: [
          ["which one", "cuál"],
          ["yours", "tuya"],
          ["sticker", "calcomanía"],
          ["bottle", "botella"],
        ],
        frame: [
          "She asks ___ is yours and if it has ___ .",
          "She asks ___ is yours and if it has ___ . (las dos cosas)",
        ],
        hint: [
          "Listen for two questions: one starts with Which, one starts with does.",
          "Escucha dos preguntas: una empieza con Which y otra con does.",
        ],
      }),
      choose({
        id: "describe-bottle",
        role: "respond",
        target: "describe",
        stim: speech("Please describe your bottle.", "Por favor describe tu botella."),
        ask: [
          "Your bottle is green with a star sticker, and you left it near the gym. How do you describe it?",
          "Tu botella es verde con una calcomanía de estrella y la dejaste cerca del gimnasio. ¿Cómo la describes?",
        ],
        options: [
          [
            "a",
            "It is mine.",
            "Es mía.",
            "Ms. Brooks needs details to find it, not only who owns it.",
            "La señora Brooks necesita detalles para encontrarla, no solo saber de quién es.",
          ],
          [
            "b",
            "A bottle.",
            "Una botella.",
            "Both bottles are bottles. Add color and a detail.",
            "Las dos botellas son botellas. Agrega el color y un detalle.",
          ],
          [
            "c",
            "It is a green bottle with a star sticker. I think I left it near the gym.",
            "Es una botella verde con una calcomanía de estrella. Creo que la dejé cerca del gimnasio.",
            "It gives the color, a detail and the place.",
            "Da el color, un detalle y el lugar.",
          ],
        ],
        answer: "c",
        words: [
          ["green", "verde"],
          ["sticker", "calcomanía"],
          ["near", "cerca de"],
          ["I left it", "la dejé"],
        ],
        frame: [
          "It is a ___ bottle with a ___ . I left it near ___ .",
          "It is a ___ bottle with a ___ . I left it near ___ . (color, detalle y lugar)",
        ],
        hint: [
          "Give the color, one detail that is special, and where you last saw it.",
          "Da el color, un detalle especial y dónde lo viste por última vez.",
        ],
      }),
      build({
        id: "how-long",
        role: "ask",
        target: "question",
        intent: [
          "Ask how long the office keeps lost items.",
          "Pregunta cuánto tiempo guarda la oficina los objetos perdidos.",
        ],
        tiles: ["items", "long", "How", "do", "lost", "you", "keep", "?", "does"],
        ok: [["How", "long", "do", "you", "keep", "lost", "items", "?"]],
        slips: [
          [
            ["How", "long", "you", "keep", "lost", "items", "?"],
            "This question needs a helper word after How long.",
            "Esta pregunta necesita una palabra auxiliar después de How long.",
          ],
          [
            ["How", "long", "does", "you", "keep", "lost", "items", "?"],
            "The helper word has to match the subject. You takes a different helper than does.",
            "La palabra auxiliar debe concordar con el sujeto. You lleva otro auxiliar, no does.",
          ],
        ],
        words: [
          ["how long", "cuánto tiempo"],
          ["keep", "guardar"],
          ["lost items", "objetos perdidos"],
          ["you", "ustedes"],
        ],
        frame: [
          "How long ___ you ___ lost items ?",
          "How long ___ you ___ lost items ? (pregunta cuánto tiempo)",
        ],
        hint: [
          "Start with How long, add the helper word that goes with you, then the verb and the things.",
          "Empieza con How long, agrega la palabra auxiliar que va con you y luego el verbo y las cosas.",
        ],
      }),
      choose({
        id: "not-mine",
        role: "repair",
        target: "refuse",
        mood: "pleased",
        stim: speech(
          "Is this one yours? It is the blue bottle.",
          "¿Esta es la tuya? Es la botella azul.",
        ),
        ask: [
          "Your bottle is green, so this one is not yours. What do you say?",
          "Tu botella es verde, así que esta no es tuya. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "No, but thank you for checking. Mine is green, not blue.",
            "No, pero gracias por revisar. La mía es verde, no azul.",
            "It says no, thanks her, and gives the detail that fixes the mix-up.",
            "Dice que no, le da las gracias y da el detalle que arregla la confusión.",
          ],
          [
            "b",
            "No!",
            "¡No!",
            "It is clear but sounds sharp, and gives no detail to help her.",
            "Es claro, pero suena brusco y no da ningún detalle que la ayude.",
          ],
          [
            "c",
            "Yes.",
            "Sí.",
            "You would take a bottle that is not yours.",
            "Te llevarías una botella que no es tuya.",
          ],
        ],
        answer: "a",
        words: [
          ["no, but", "no, pero"],
          ["thank you for", "gracias por"],
          ["mine", "la mía"],
          ["not", "no"],
        ],
        frame: [
          "No, but thank you for ___ . Mine is ___ , not ___ .",
          "No, but thank you for ___ . Mine is ___ , not ___ . (gracias y el detalle)",
        ],
        hint: [
          "Say no kindly, thank her, and name the detail that is different.",
          "Di que no con amabilidad, dale las gracias y nombra el detalle que es diferente.",
        ],
      }),
      say({
        id: "lost-describe",
        target: "describe",
        prompt: [
          "Describe something you lost: what it is, its color and where you last saw it.",
          "Describe algo que perdiste: qué es, su color y dónde lo viste por última vez.",
        ],
        words: [
          ["it is", "es"],
          ["color", "color"],
          ["near", "cerca de"],
          ["I last saw", "lo vi por última vez"],
        ],
        frame: [
          "It is a ___ and I last saw it ___ .",
          "It is a ___ and I last saw it ___ . (qué es y dónde)",
        ],
      }),
    ],
  }),
];
