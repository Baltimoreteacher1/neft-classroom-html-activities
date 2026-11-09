// Language City missions: Harbor Café (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const CAFE_MISSIONS = [
  mission({
    id: "order-lunch",
    place: "cafe",
    title: ["Order lunch", "Pide el almuerzo"],
    goal: [
      "Read the menu, order politely, ask about nuts, and fix a wrong order.",
      "Lee el menú, pide con cortesía, pregunta por las nueces y arregla un pedido equivocado.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "menu",
        role: "read",
        mood: "happy",
        stim: doc("menu", "Today's menu", "Menú de hoy", [
          ["Tomato soup · $4", "Sopa de tomate · $4"],
          [
            "Cheese sandwich · $5 · comes with an apple",
            "Sándwich de queso · $5 · viene con una manzana",
          ],
          ["Veggie wrap · $6", "Wrap de verduras · $6"],
          ["Juice or milk · $1", "Jugo o leche · $1"],
        ]),
        ask: [
          "You have exactly $6 and you want a drink. Which order costs exactly $6?",
          "Tienes exactamente $6 y quieres una bebida. ¿Qué pedido cuesta exactamente $6?",
        ],
        options: [
          [
            "a",
            "Tomato soup and juice",
            "Sopa de tomate y jugo",
            "Soup $4 plus juice $1 is $5. That leaves $1 unspent.",
            "La sopa $4 más el jugo $1 son $5. Te sobra $1.",
          ],
          [
            "b",
            "Veggie wrap and juice",
            "Wrap de verduras y jugo",
            "Wrap $6 plus juice $1 is $7. That is more than you have.",
            "El wrap $6 más el jugo $1 son $7. Es más de lo que tienes.",
          ],
          [
            "c",
            "Cheese sandwich and juice",
            "Sándwich de queso y jugo",
            "Sandwich $5 plus juice $1 is $6, exactly your money.",
            "El sándwich $5 más el jugo $1 son $6, exactamente tu dinero.",
          ],
        ],
        answer: "c",
        words: [
          ["price", "precio"],
          ["costs", "cuesta"],
          ["add", "sumar"],
          ["in all", "en total"],
        ],
        frame: ["The ___ and the ___ cost ___ in all.", "El ___ y el ___ cuestan ___ en total."],
        hint: [
          "Add the food price and the drink price for each choice, then compare with your money.",
          "Suma el precio de la comida y el de la bebida en cada opción y compáralo con tu dinero.",
        ],
      }),
      choose({
        id: "order",
        role: "respond",
        target: "request",
        mood: "happy",
        stim: speech("Hi! What would you like today?", "¡Hola! ¿Qué te gustaría hoy?"),
        ask: ["Rosa is waiting. How do you order?", "Rosa espera. ¿Cómo pides?"],
        options: [
          [
            "a",
            "Could I have the cheese sandwich and a juice, please?",
            "¿Podría darme el sándwich de queso y un jugo, por favor?",
            "A polite request: Could I have... and please make the order clear and friendly.",
            "Una petición cortés: Could I have... y please hacen el pedido claro y amable.",
          ],
          [
            "b",
            "Give me the sandwich.",
            "Dame el sándwich.",
            "Rosa understands, but a command with no please can sound rude.",
            "Rosa entiende, pero una orden sin please puede sonar grosera.",
          ],
          [
            "c",
            "Sandwich, juice.",
            "Sándwich, jugo.",
            "Two words are understood, but a full request is clearer and kinder.",
            "Dos palabras se entienden, pero una petición completa es más clara y amable.",
          ],
        ],
        answer: "a",
        words: [
          ["could I have", "¿podría darme?"],
          ["please", "por favor"],
          ["and", "y"],
          ["a", "un / una"],
        ],
        frame: [
          "Could I have ___ and ___, please?",
          "Could I have ___ and ___, please? (¿Podría darme ___ y ___, por favor?)",
        ],
        hint: [
          "Start with a polite starter, name both things you want, and end with please.",
          "Empieza con una frase cortés, nombra las dos cosas que quieres y termina con please.",
        ],
      }),
      build({
        id: "nuts",
        role: "ask",
        target: "question",
        intent: [
          "Ask Rosa if the soup has any nuts in it.",
          "Pregunta a Rosa si la sopa tiene nueces.",
        ],
        tiles: ["nuts", "Does", "any", "?", "soup", "have", "the", "Do", "has"],
        ok: [["Does", "the", "soup", "have", "any", "nuts", "?"]],
        slips: [
          [
            ["Do", "the", "soup", "have", "any", "nuts", "?"],
            "The helper word has to match the subject. One soup takes a different helper than Do.",
            "La palabra auxiliar debe concordar con el sujeto. Una sopa lleva otro auxiliar, no Do.",
          ],
          [
            ["Does", "the", "soup", "has", "any", "nuts", "?"],
            "After the helper word, the main verb stays in its plain form.",
            "Después de la palabra auxiliar, el verbo principal queda en su forma simple.",
          ],
          [
            ["the", "soup", "has", "any", "nuts", "?"],
            "This starts with the subject, so it tells instead of asks. A question starts with a helper word.",
            "Esto empieza con el sujeto, así que dice en vez de preguntar. Una pregunta empieza con una palabra auxiliar.",
          ],
        ],
        words: [
          ["soup", "sopa"],
          ["nuts", "nueces"],
          ["any", "algún / alguna"],
          ["have", "tener"],
        ],
        frame: [
          "___ the ___ have ___ ___ ?",
          "___ the ___ have ___ ___ ? (la pregunta empieza con una palabra auxiliar)",
        ],
        hint: [
          "A yes-or-no question starts with a helper word and ends with a question mark.",
          "Una pregunta de sí o no empieza con una palabra auxiliar y termina con signo de interrogación.",
        ],
      }),
      choose({
        id: "hear",
        role: "listen",
        mood: "concerned",
        stim: speech(
          "Good question. The soup has no nuts, but the wrap has almonds. Would you like the sandwich?",
          "Buena pregunta. La sopa no tiene nueces, pero el wrap tiene almendras. ¿Te gustaría el sándwich?",
        ),
        ask: ["What did Rosa say about nuts?", "¿Qué dijo Rosa sobre las nueces?"],
        options: [
          [
            "a",
            "The soup and the wrap both have nuts.",
            "La sopa y el wrap tienen nueces.",
            "Listen again for the word no. One of the foods has none.",
            "Escucha otra vez la palabra no. Una de las comidas no tiene.",
          ],
          [
            "b",
            "The soup has no nuts. The wrap has almonds.",
            "La sopa no tiene nueces. El wrap tiene almendras.",
            "Yes: no nuts in the soup, almonds in the wrap.",
            "Sí: sin nueces en la sopa, almendras en el wrap.",
          ],
          [
            "c",
            "Nothing on the menu has nuts.",
            "Nada del menú tiene nueces.",
            "Rosa named a food with almonds, so that cannot be true.",
            "Rosa nombró una comida con almendras, así que eso no puede ser cierto.",
          ],
        ],
        answer: "b",
        words: [
          ["no", "ningún / sin"],
          ["but", "pero"],
          ["almonds", "almendras"],
          ["has", "tiene"],
        ],
        frame: [
          "The ___ has ___ , but the ___ has ___ .",
          "The ___ has ___ , but the ___ has ___ . (lo que tiene cada comida)",
        ],
        hint: [
          "Listen for which food has nuts and which food has none. The word but connects the two.",
          "Escucha qué comida tiene nueces y cuál no. La palabra but conecta las dos.",
        ],
      }),
      choose({
        id: "wrap",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here is your veggie wrap! Enjoy.",
          "¡Aquí está tu wrap de verduras! Que lo disfrutes.",
        ),
        ask: [
          "You ordered the cheese sandwich, not the wrap. What do you say?",
          "Pediste el sándwich de queso, no el wrap. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "That is wrong. Take it back.",
            "Eso está mal. Llévatelo.",
            "This blames Rosa and gives an order. A mix-up is easier to fix with a calm check.",
            "Esto culpa a Rosa y da una orden. Una confusión se arregla mejor con una revisión tranquila.",
          ],
          [
            "b",
            "Thank you.",
            "Gracias.",
            "Polite, but you will get the wrong food. Say what is different.",
            "Es cortés, pero recibirás la comida equivocada. Di qué es diferente.",
          ],
          [
            "c",
            "Excuse me, I think I ordered the cheese sandwich. Could you check, please?",
            "Disculpe, creo que pedí el sándwich de queso. ¿Podría revisarlo, por favor?",
            "Polite, specific and kind: it names what you ordered and asks for a check.",
            "Cortés, específico y amable: dice qué pediste y pide una revisión.",
          ],
        ],
        answer: "c",
        words: [
          ["excuse me", "disculpe"],
          ["I think", "creo que"],
          ["I ordered", "pedí"],
          ["check", "revisar"],
        ],
        frame: [
          "Excuse me, I think I ordered ___ . Could you ___ , please?",
          "Excuse me, I think I ordered ___ . Could you ___ , please? (qué pediste y qué pides)",
        ],
        hint: [
          "Say sorry to interrupt, say what you ordered, then ask for help in a polite way.",
          "Pide perdón por interrumpir, di qué pediste y luego pide ayuda con cortesía.",
        ],
      }),
      say({
        id: "thanks",
        target: "thank",
        prompt: [
          "Rosa brings the right food. Thank her in your own words.",
          "Rosa trae la comida correcta. Dale las gracias con tus propias palabras.",
        ],
        words: [
          ["thank you", "gracias"],
          ["for", "por"],
          ["fixing", "arreglar"],
          ["delicious", "delicioso"],
        ],
        frame: ["Thank you for ___ .", "Thank you for ___ . (gracias por ...)"],
      }),
    ],
  }),
  mission({
    id: "check-the-bill",
    place: "cafe",
    title: ["Check the bill", "Revisa la cuenta"],
    goal: [
      "Find a mistake on a bill, ask what a word means, and ask for a fix without blaming.",
      "Encuentra un error en una cuenta, pregunta qué significa una palabra y pide un arreglo sin culpar.",
    ],
    use: "Explain",
    steps: [
      choose({
        id: "bill",
        role: "read",
        stim: doc("bill", "Your bill, table 4", "Tu cuenta, mesa 4", [
          ["Cheese sandwich · $5.00", "Sándwich de queso · $5.00"],
          ["Juice · $1.00", "Jugo · $1.00"],
          ["Juice · $1.00", "Jugo · $1.00"],
          ["Service fee · $1.00", "Cargo de servicio · $1.00"],
          ["Total · $8.00", "Total · $8.00"],
        ]),
        ask: [
          "You had one sandwich and one juice. What looks wrong on the bill?",
          "Tomaste un sándwich y un jugo. ¿Qué parece estar mal en la cuenta?",
        ],
        options: [
          [
            "a",
            "The sandwich costs too much.",
            "El sándwich cuesta demasiado.",
            "The sandwich is listed once at $5, the same price as the menu.",
            "El sándwich aparece una vez a $5, el mismo precio del menú.",
          ],
          [
            "b",
            "The total is missing.",
            "Falta el total.",
            "Look at the last line. A total is printed there.",
            "Mira la última línea. Ahí hay un total.",
          ],
          [
            "c",
            "The juice is listed two times.",
            "El jugo aparece dos veces.",
            "Yes: you had one juice, but two juice lines are charged.",
            "Sí: tomaste un jugo, pero se cobran dos líneas de jugo.",
          ],
        ],
        answer: "c",
        words: [
          ["listed", "anotado"],
          ["two times", "dos veces"],
          ["once", "una vez"],
          ["charged", "cobrado"],
        ],
        frame: [
          "The bill lists ___ ___ times, but I had ___ .",
          "The bill lists ___ ___ times, but I had ___ . (qué aparece repetido)",
        ],
        hint: [
          "Match each line on the bill with what you really ate and drank.",
          "Relaciona cada línea de la cuenta con lo que realmente comiste y bebiste.",
        ],
      }),
      choose({
        id: "tip",
        role: "listen",
        stim: speech(
          "You can pay by card or cash. A small tip is welcome, but you do not have to leave one.",
          "Puedes pagar con tarjeta o en efectivo. Una pequeña propina es bienvenida, pero no tienes que dejarla.",
        ),
        ask: ["Does Rosa say you must leave a tip?", "¿Rosa dice que debes dejar propina?"],
        options: [
          [
            "a",
            "Yes, a tip is required.",
            "Sí, la propina es obligatoria.",
            "Listen for do not have to. That means it is your choice.",
            "Escucha do not have to. Significa que es tu decisión.",
          ],
          [
            "b",
            "No, a tip is welcome but not required.",
            "No, la propina es bienvenida pero no obligatoria.",
            "Right: welcome means she would be glad; do not have to means you can choose.",
            "Correcto: welcome significa que se alegraría; do not have to significa que puedes elegir.",
          ],
          [
            "c",
            "She only takes cash.",
            "Solo acepta efectivo.",
            "She named two ways to pay, card or cash.",
            "Nombró dos formas de pagar, tarjeta o efectivo.",
          ],
        ],
        answer: "b",
        words: [
          ["tip", "propina"],
          ["welcome", "bienvenida"],
          ["do not have to", "no tienes que"],
          ["required", "obligatoria"],
        ],
        frame: [
          "A tip is ___ , but you ___ leave one.",
          "A tip is ___ , but you ___ leave one. (¿obligatoria o no?)",
        ],
        hint: [
          "Listen for the words that tell you if something is a rule or a choice.",
          "Escucha las palabras que dicen si algo es una regla o una opción.",
        ],
      }),
      build({
        id: "fee",
        role: "ask",
        target: "clarify",
        intent: [
          "Ask Rosa what 'service fee' means.",
          "Pregunta a Rosa qué significa 'service fee'.",
        ],
        tiles: ["service", "What", "means", "fee", "does", "mean", "?"],
        ok: [["What", "does", "service", "fee", "mean", "?"]],
        slips: [
          [
            ["What", "means", "service", "fee", "?"],
            "A question with a question word needs a helper word before the subject, and then the plain verb.",
            "Una pregunta con palabra interrogativa necesita una palabra auxiliar antes del sujeto y luego el verbo simple.",
          ],
          [
            ["What", "service", "fee", "does", "mean", "?"],
            "The helper word comes right after the question word, before the thing you are asking about.",
            "La palabra auxiliar va justo después de la palabra interrogativa, antes de lo que preguntas.",
          ],
        ],
        words: [
          ["service fee", "cargo de servicio"],
          ["mean", "significar"],
          ["what", "qué"],
          ["does", "auxiliar de pregunta"],
        ],
        frame: ["What ___ ___ ___ ?", "What ___ ___ ___ ? (pregunta qué significa algo)"],
        hint: [
          "Begin with the question word, then the helper word, then the thing you are asking about.",
          "Empieza con la palabra interrogativa, luego la auxiliar y luego lo que preguntas.",
        ],
      }),
      choose({
        id: "fee-reply",
        role: "respond",
        target: "clarify",
        mood: "pleased",
        stim: speech(
          "The service fee is one dollar for tables of six or more people.",
          "El cargo de servicio es un dólar para mesas de seis o más personas.",
        ),
        ask: [
          "Your table has two people. How do you check that the fee should not be on your bill?",
          "Tu mesa tiene dos personas. ¿Cómo verificas que el cargo no debería estar en tu cuenta?",
        ],
        options: [
          [
            "a",
            "I don't want to pay that.",
            "No quiero pagar eso.",
            "This says no but does not use what Rosa explained.",
            "Esto dice que no, pero no usa lo que Rosa explicó.",
          ],
          [
            "b",
            "OK.",
            "Está bien.",
            "That agrees to the fee. You just learned it may not apply to you.",
            "Eso acepta el cargo. Acabas de aprender que quizá no se aplique a ti.",
          ],
          [
            "c",
            "We are only two people, so the fee should not be on our bill, right?",
            "Somos solo dos personas, así que el cargo no debería estar en nuestra cuenta, ¿verdad?",
            "It uses Rosa's rule and checks politely with right at the end.",
            "Usa la regla de Rosa y verifica con cortesía con right al final.",
          ],
        ],
        answer: "c",
        words: [
          ["only", "solo"],
          ["so", "así que"],
          ["should not", "no debería"],
          ["right?", "¿verdad?"],
        ],
        frame: [
          "We are only ___ people, so ___ , right?",
          "We are only ___ people, so ___ , right? (usa la regla que explicó Rosa)",
        ],
        hint: [
          "Use the number from Rosa's rule, say what follows from it, and check with a short question at the end.",
          "Usa el número de la regla de Rosa, di qué se deduce y verifica con una pregunta corta al final.",
        ],
      }),
      choose({
        id: "fix",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "So the total is eight dollars. Do you want to pay by card?",
          "Entonces el total son ocho dólares. ¿Quieres pagar con tarjeta?",
        ),
        ask: [
          "You only had one juice. What do you say about the bill?",
          "Solo tomaste un jugo. ¿Qué dices sobre la cuenta?",
        ],
        options: [
          [
            "a",
            "You made a mistake.",
            "Cometiste un error.",
            "That blames Rosa. Say what you saw on the bill and ask for a check.",
            "Eso culpa a Rosa. Di lo que viste en la cuenta y pide una revisión.",
          ],
          [
            "b",
            "I will just pay eight dollars.",
            "Solo pagaré ocho dólares.",
            "That pays for something you did not order and fixes nothing.",
            "Eso paga algo que no pediste y no arregla nada.",
          ],
          [
            "c",
            "I only had one juice. Could you check the bill again, please?",
            "Solo tomé un jugo. ¿Podría revisar la cuenta otra vez, por favor?",
            "It gives a fact, then a polite request to look again.",
            "Da un dato y luego pide con cortesía que se revise otra vez.",
          ],
        ],
        answer: "c",
        words: [
          ["I only had", "solo tomé / comí"],
          ["check", "revisar"],
          ["again", "otra vez"],
          ["bill", "cuenta"],
        ],
        frame: [
          "I only had ___ . Could you ___ the bill again, please?",
          "I only had ___ . Could you ___ the bill again, please? (un dato y una petición)",
        ],
        hint: [
          "First say one true fact about what you had. Then ask politely for a second look.",
          "Primero di un dato verdadero sobre lo que tomaste. Luego pide con cortesía que lo revisen.",
        ],
      }),
      say({
        id: "why-high",
        target: "explain",
        prompt: [
          "Tell Rosa why you think the total is too high. Give a reason.",
          "Dile a Rosa por qué crees que el total es demasiado alto. Da una razón.",
        ],
        words: [
          ["because", "porque"],
          ["two", "dos"],
          ["only", "solo"],
          ["juice", "jugo"],
        ],
        frame: [
          "The total looks too high because ___ .",
          "The total looks too high because ___ . (tu razón)",
        ],
      }),
    ],
  }),
];
