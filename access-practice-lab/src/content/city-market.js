// Language City missions: Corner Market (two missions, each a chain of real language tasks).
import { build, choose, doc, mission, say, speech } from "./city-kit.js";

export const MARKET_MISSIONS = [
  mission({
    id: "buy-fruit",
    place: "market",
    title: ["Buy fruit", "Compra fruta"],
    goal: [
      "Read a sale sign, hear a total, ask about the fruit, politely say no, and fix the wrong change.",
      "Lee un letrero de oferta, escucha un total, pregunta por la fruta, di que no con cortesía y arregla el cambio equivocado.",
    ],
    use: "Inform",
    steps: [
      choose({
        id: "sale",
        role: "read",
        stim: doc("sign", "Fruit prices", "Precios de la fruta", [
          ["Apples · $2 a pound", "Manzanas · $2 la libra"],
          ["Grapes · $4 a pound", "Uvas · $4 la libra"],
          [
            "Sale today: buy 2 pounds of apples, get 1 pound free",
            "Oferta de hoy: compra 2 libras de manzanas y llévate 1 libra gratis",
          ],
        ]),
        ask: [
          "You want 3 pounds of apples. How many pounds do you pay for?",
          "Quieres 3 libras de manzanas. ¿Por cuántas libras pagas?",
        ],
        options: [
          [
            "a",
            "3 pounds",
            "3 libras",
            "That ignores the sale. One pound of the three is free.",
            "Eso ignora la oferta. Una de las tres libras es gratis.",
          ],
          [
            "b",
            "2 pounds",
            "2 libras",
            "Yes: buy 2, get 1 free, so you take 3 and pay for 2.",
            "Sí: compra 2, llévate 1 gratis, así que te llevas 3 y pagas 2.",
          ],
          [
            "c",
            "1 pound",
            "1 libra",
            "The free pound is only one of the three. You still buy the rest.",
            "La libra gratis es solo una de las tres. Aún compras el resto.",
          ],
        ],
        answer: "b",
        words: [
          ["pounds", "libras"],
          ["free", "gratis"],
          ["sale", "oferta"],
          ["pay for", "pagar por"],
        ],
        frame: [
          "I take ___ pounds and pay for ___ .",
          "I take ___ pounds and pay for ___ . (cuántas llevas y cuántas pagas)",
        ],
        hint: [
          "Read the sale line. It says how many you buy and how many are free.",
          "Lee la línea de la oferta. Dice cuántas compras y cuántas son gratis.",
        ],
      }),
      choose({
        id: "total",
        role: "listen",
        mood: "happy",
        stim: speech(
          "Three pounds of apples and one pound of grapes. That is eight dollars in all. Would you like a bag?",
          "Tres libras de manzanas y una libra de uvas. Son ocho dólares en total. ¿Quieres una bolsa?",
        ),
        ask: ["How much is the total?", "¿Cuánto es el total?"],
        options: [
          [
            "a",
            "Four dollars",
            "Cuatro dólares",
            "Four is the price of one pound of grapes, not the total.",
            "Cuatro es el precio de una libra de uvas, no el total.",
          ],
          [
            "b",
            "Eight dollars",
            "Ocho dólares",
            "Yes: apples on sale cost $4, plus $4 for the grapes.",
            "Sí: las manzanas en oferta cuestan $4 y las uvas $4 más.",
          ],
          [
            "c",
            "Two dollars",
            "Dos dólares",
            "Listen for the number just before dollars in all.",
            "Escucha el número justo antes de dollars in all.",
          ],
        ],
        answer: "b",
        words: [
          ["total", "total"],
          ["in all", "en total"],
          ["dollars", "dólares"],
          ["bag", "bolsa"],
        ],
        frame: [
          "The total is ___ dollars in all.",
          "The total is ___ dollars in all. (el número que oíste)",
        ],
        hint: [
          "Listen for the words in all. The number before them is the total.",
          "Escucha las palabras in all. El número antes de ellas es el total.",
        ],
      }),
      build({
        id: "sweet",
        role: "ask",
        target: "question",
        intent: [
          "Ask Mr. Delgado if the grapes are sweet.",
          "Pregunta al señor Delgado si las uvas son dulces.",
        ],
        tiles: ["sweet", "the", "Are", "grapes", "?", "Is"],
        ok: [["Are", "the", "grapes", "sweet", "?"]],
        slips: [
          [
            ["Is", "the", "grapes", "sweet", "?"],
            "Grapes is more than one. The helper word has to match.",
            "Grapes es plural. La palabra auxiliar debe concordar.",
          ],
          [
            ["Are", "grapes", "the", "sweet", "?"],
            "The little word the goes before the thing it points to, so it sits just before grapes.",
            "La palabra the va antes de lo que señala, así que va justo antes de grapes.",
          ],
        ],
        words: [
          ["sweet", "dulce"],
          ["grapes", "uvas"],
          ["are", "son"],
          ["the", "las"],
        ],
        frame: ["___ the ___ ___ ?", "___ the ___ ___ ? (pregunta cómo son las uvas)"],
        hint: [
          "Start with the helper word that matches grapes, then the thing, then the describing word.",
          "Empieza con la palabra auxiliar que concuerda con grapes, luego la cosa y luego la palabra que describe.",
        ],
      }),
      choose({
        id: "bag",
        role: "respond",
        target: "refuse",
        stim: speech("Would you like a bag?", "¿Quieres una bolsa?"),
        ask: [
          "You brought your own bag. How do you say no politely?",
          "Trajiste tu propia bolsa. ¿Cómo dices que no con cortesía?",
        ],
        options: [
          [
            "a",
            "No.",
            "No.",
            "It is clear but sounds short. A polite no adds thanks or a reason.",
            "Es claro, pero suena seco. Un no cortés agrega gracias o una razón.",
          ],
          [
            "b",
            "Give me nothing.",
            "No me des nada.",
            "This sounds like an order and is confusing.",
            "Esto suena como una orden y confunde.",
          ],
          [
            "c",
            "No, thank you. I have my own bag.",
            "No, gracias. Tengo mi propia bolsa.",
            "It says no, adds thanks and gives a short reason.",
            "Dice que no, agrega gracias y da una razón corta.",
          ],
        ],
        answer: "c",
        words: [
          ["no, thank you", "no, gracias"],
          ["I have", "tengo"],
          ["my own", "mi propia"],
          ["bag", "bolsa"],
        ],
        frame: ["No, thank you. I ___ .", "No, thank you. I ___ . (tu razón)"],
        hint: [
          "Say no kindly, then give a short reason so he understands.",
          "Di que no con amabilidad y da una razón corta para que entienda.",
        ],
      }),
      choose({
        id: "change",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here is your change: one dollar. Thanks!",
          "Aquí está tu cambio: un dólar. ¡Gracias!",
        ),
        ask: [
          "You paid with a twenty-dollar bill for an eight-dollar total. The change should be twelve dollars. What do you say?",
          "Pagaste con un billete de veinte dólares por un total de ocho. El cambio debería ser doce dólares. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "You cheated me!",
            "¡Me engañaste!",
            "That accuses him of doing it on purpose. A mistake is easier to fix with facts.",
            "Eso lo acusa de hacerlo a propósito. Un error se arregla mejor con datos.",
          ],
          [
            "b",
            "Excuse me, I gave you twenty dollars, so I think my change should be twelve dollars.",
            "Disculpe, le di veinte dólares, así que creo que mi cambio debería ser doce dólares.",
            "It gives the facts, explains with so, and asks politely with I think.",
            "Da los datos, explica con so y pide con cortesía con I think.",
          ],
          ["c", "Thanks.", "Gracias.", "You would lose eleven dollars.", "Perderías once dólares."],
        ],
        answer: "b",
        words: [
          ["I gave you", "le di"],
          ["change", "cambio"],
          ["should be", "debería ser"],
          ["I think", "creo que"],
        ],
        frame: [
          "Excuse me, I gave you ___ , so I think my change should be ___ .",
          "Excuse me, I gave you ___ , so I think my change should be ___ . (lo que pagaste y lo que esperas)",
        ],
        hint: [
          "State what you paid, then what you expected back, in a calm voice.",
          "Di lo que pagaste y luego lo que esperabas recibir, con voz tranquila.",
        ],
      }),
      say({
        id: "ask-more",
        target: "request",
        prompt: [
          "You want one more pound of grapes. Ask Mr. Delgado politely.",
          "Quieres una libra más de uvas. Pídesela al señor Delgado con cortesía.",
        ],
        words: [
          ["could I", "¿podría?"],
          ["one more", "una más"],
          ["pound", "libra"],
          ["please", "por favor"],
        ],
        frame: ["Could I have ___ , please?", "Could I have ___ , please? (tu petición)"],
      }),
    ],
  }),
  mission({
    id: "fresh-melon",
    place: "market",
    title: ["Ask for a fresh melon", "Pide un melón fresco"],
    goal: [
      "Use a store rule, understand an offer, politely disagree, and clear up a word that was misheard.",
      "Usa una regla de la tienda, entiende una oferta, no estés de acuerdo con cortesía y aclara una palabra mal oída.",
    ],
    use: "Argue",
    steps: [
      choose({
        id: "rule",
        role: "read",
        stim: doc("sign", "Store rules", "Reglas de la tienda", [
          ["We sell fruit fresh every day.", "Vendemos fruta fresca todos los días."],
          ["No returns on cut fruit.", "No hay devoluciones de fruta cortada."],
          ["Questions? Ask at the front.", "¿Preguntas? Pregunta al frente."],
        ]),
        ask: [
          "A cut melon smells bad after you buy it. What does the sign say about returning it?",
          "Un melón cortado huele mal después de comprarlo. ¿Qué dice el letrero sobre devolverlo?",
        ],
        options: [
          [
            "a",
            "You can always return it.",
            "Siempre puedes devolverlo.",
            "The sign makes an exception for cut fruit.",
            "El letrero hace una excepción para la fruta cortada.",
          ],
          [
            "b",
            "You can only return it on Fridays.",
            "Solo puedes devolverlo los viernes.",
            "No day of the week is on the sign.",
            "No hay ningún día de la semana en el letrero.",
          ],
          [
            "c",
            "Cut fruit cannot be returned.",
            "La fruta cortada no se puede devolver.",
            "Yes: the second line says no returns on cut fruit.",
            "Sí: la segunda línea dice que no hay devoluciones de fruta cortada.",
          ],
        ],
        answer: "c",
        words: [
          ["returns", "devoluciones"],
          ["cut fruit", "fruta cortada"],
          ["no", "no hay"],
          ["sign", "letrero"],
        ],
        frame: [
          "The sign says no ___ on ___ .",
          "The sign says no ___ on ___ . (qué no se puede hacer y con qué)",
        ],
        hint: [
          "Find the line that begins with No. It names a thing that is not allowed.",
          "Busca la línea que empieza con No. Nombra algo que no se permite.",
        ],
      }),
      choose({
        id: "offer",
        role: "listen",
        mood: "concerned",
        stim: speech(
          "I am sorry the melon was bad. I cannot give your money back, but I can give you a new whole melon.",
          "Lamento que el melón estuviera malo. No puedo devolver tu dinero, pero puedo darte un melón entero nuevo.",
        ),
        ask: ["What does Mr. Delgado offer?", "¿Qué ofrece el señor Delgado?"],
        options: [
          [
            "a",
            "His money back",
            "Devolver el dinero",
            "Listen for cannot. He says he cannot do that.",
            "Escucha cannot. Dice que no puede hacer eso.",
          ],
          [
            "b",
            "A free bag",
            "Una bolsa gratis",
            "A bag is not in what he said.",
            "Una bolsa no está en lo que dijo.",
          ],
          [
            "c",
            "A new whole melon",
            "Un melón entero nuevo",
            "Yes: no money back, but a new whole melon.",
            "Sí: no devuelve el dinero, pero da un melón entero nuevo.",
          ],
        ],
        answer: "c",
        words: [
          ["cannot", "no puede"],
          ["but", "pero"],
          ["give back", "devolver"],
          ["new", "nuevo"],
        ],
        frame: [
          "He cannot ___ , but he can ___ .",
          "He cannot ___ , but he can ___ . (lo que no puede y lo que sí)",
        ],
        hint: [
          "Listen for what he cannot do and, after the word but, what he can do.",
          "Escucha lo que no puede hacer y, después de but, lo que sí puede hacer.",
        ],
      }),
      build({
        id: "pick",
        role: "ask",
        target: "request",
        intent: [
          "Ask if you can pick the new melon yourself.",
          "Pregunta si puedes escoger tú mismo el melón nuevo.",
        ],
        tiles: ["myself", "pick", "Can", "it", "I", "picking", "?"],
        ok: [["Can", "I", "pick", "it", "myself", "?"]],
        slips: [
          [
            ["Can", "I", "picking", "it", "myself", "?"],
            "After Can, use the plain verb with no ending.",
            "Después de Can, usa el verbo simple sin terminación.",
          ],
          [
            ["I", "Can", "pick", "it", "myself", "?"],
            "A question begins with Can. The person comes right after it, not before it.",
            "Una pregunta empieza con Can. La persona va justo después, no antes.",
          ],
        ],
        words: [
          ["pick", "escoger"],
          ["myself", "yo mismo"],
          ["can", "poder"],
          ["it", "lo"],
        ],
        frame: ["Can I ___ it ___ ?", "Can I ___ it ___ ? (pregunta si puedes hacerlo tú)"],
        hint: [
          "Begin with Can, then say who, then the plain verb, and finish with a question mark.",
          "Empieza con Can, luego di quién, luego el verbo simple y termina con un signo de interrogación.",
        ],
      }),
      choose({
        id: "disagree",
        role: "respond",
        target: "disagree",
        mood: "puzzled",
        stim: speech(
          "A new melon is the only thing I can give you.",
          "Un melón nuevo es lo único que puedo darte.",
        ),
        ask: [
          "You would rather have a smaller melon that costs less. How do you disagree politely?",
          "Preferirías un melón más pequeño que cueste menos. ¿Cómo expresas tu desacuerdo con cortesía?",
        ],
        options: [
          [
            "a",
            "That is not fair.",
            "Eso no es justo.",
            "It shows you are upset but gives no idea he can use.",
            "Muestra que estás molesto, pero no da ninguna idea que él pueda usar.",
          ],
          [
            "b",
            "Okay, whatever.",
            "Bueno, como sea.",
            "It gives up and sounds like you do not care.",
            "Se rinde y suena como si no te importara.",
          ],
          [
            "c",
            "I understand, but maybe I could pick a smaller one instead?",
            "Entiendo, pero quizá podría escoger uno más pequeño.",
            "It shows you listened, says but, and offers another idea.",
            "Muestra que escuchaste, dice but y ofrece otra idea.",
          ],
        ],
        answer: "c",
        words: [
          ["I understand", "entiendo"],
          ["but", "pero"],
          ["maybe", "quizá"],
          ["instead", "en su lugar"],
        ],
        frame: [
          "I understand, but maybe ___ instead?",
          "I understand, but maybe ___ instead? (otra idea)",
        ],
        hint: [
          "First show that you listened, then use but to offer a different idea.",
          "Primero muestra que escuchaste y luego usa but para ofrecer otra idea.",
        ],
      }),
      choose({
        id: "ripe",
        role: "repair",
        target: "clarify",
        mood: "puzzled",
        stim: speech(
          "Here is a white melon. Is this one okay?",
          "Aquí hay un melón blanco. ¿Este está bien?",
        ),
        ask: [
          "You asked for a ripe melon, ready to eat. He heard white. What do you say?",
          "Pediste un melón maduro (ripe), listo para comer. Él oyó white. ¿Qué dices?",
        ],
        options: [
          [
            "a",
            "No, wrong.",
            "No, mal.",
            "It says no but not what you meant.",
            "Dice que no, pero no qué quisiste decir.",
          ],
          [
            "b",
            "Yes, it is fine.",
            "Sí, está bien.",
            "You would get a melon you did not ask for.",
            "Te darían un melón que no pediste.",
          ],
          [
            "c",
            "Sorry, I said ripe, which means ready to eat, soft and sweet.",
            "Perdón, dije ripe, que significa listo para comer, suave y dulce.",
            "It repeats your word and explains it with details.",
            "Repite tu palabra y la explica con detalles.",
          ],
        ],
        answer: "c",
        words: [
          ["I said", "dije"],
          ["means", "significa"],
          ["ready to eat", "listo para comer"],
          ["soft", "suave"],
        ],
        frame: [
          "Sorry, I said ___ , which means ___ .",
          "Sorry, I said ___ , which means ___ . (tu palabra y su significado)",
        ],
        hint: [
          "Say your word again, then explain what it means in simple words.",
          "Di tu palabra otra vez y explica qué significa con palabras sencillas.",
        ],
      }),
      say({
        id: "refund",
        target: "disagree",
        prompt: [
          "Mr. Delgado says no refunds. Politely say you would like something different.",
          "El señor Delgado dice que no hay reembolsos. Di con cortesía que te gustaría algo diferente.",
        ],
        words: [
          ["I understand", "entiendo"],
          ["but", "pero"],
          ["maybe", "quizá"],
          ["instead", "en su lugar"],
        ],
        frame: ["I understand, but ___ .", "I understand, but ___ . (otra idea)"],
      }),
    ],
  }),
];
