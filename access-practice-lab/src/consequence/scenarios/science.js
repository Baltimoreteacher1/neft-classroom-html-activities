// Language for Science: Dr. Ruiz asks for a clear cause, measured evidence and a testable prediction. Original
// content; the lab data (4 and 11 minutes) is invented for this scenario and shown on its data card.
const conn = (id, en, es) => ({ id, text: [en, es] });

export const SCIENCE = {
  id: "melting-ice",
  title: ["Why Did the Ice Melt Faster?", "¿Por qué se derritió más rápido el hielo?"],
  summary: [
    "Explain a lab result to a scientist. A vague explanation gets a question back; a clear cause with evidence gets the next step.",
    "Explícale un resultado de laboratorio a una científica. Una explicación imprecisa recibe una pregunta; una causa clara con evidencia abre el siguiente paso.",
  ],
  feature: [
    "Cause and effect: because, but, so, if… then, with measured evidence",
    "Causa y efecto: because, but, so, if… then, con evidencia medida",
  ],
  area: ["Language for Science", "Lenguaje para las ciencias"],
  keyUse: "Explain",
  standards: {
    "3-5": ["ELD-SC.4-5.Explain.Expressive", "ELD-SI.4-12.Explain"],
    "6-8": ["ELD-SC.6-8.Explain.Expressive", "ELD-SI.4-12.Explain"],
  },
  character: { name: "Dr. Ruiz", role: ["Scientist", "Científica"], look: "expert" },
  card: {
    title: ["Lab data card", "Tarjeta de datos del laboratorio"],
    lines: [
      [
        "Two ice cubes, the same size, in the same room (22 °C).",
        "Dos cubos de hielo del mismo tamaño en el mismo salón (22 °C).",
      ],
      [
        "Ice on a metal tray: melted in 4 minutes.",
        "Hielo en una bandeja de metal: se derritió en 4 minutos.",
      ],
      [
        "Ice on a foam tray: melted in 11 minutes.",
        "Hielo en una bandeja de espuma: se derritió en 11 minutos.",
      ],
      [
        "Metal moves heat quickly. Foam moves heat slowly.",
        "El metal mueve el calor rápido. La espuma mueve el calor despacio.",
      ],
    ],
  },
  rounds: [
    {
      id: "cause",
      kind: "talk",
      situation: [
        "Dr. Ruiz asks: “Which ice melted faster, and why?” Give a claim and a cause.",
        "La Dra. Ruiz pregunta: “¿Qué hielo se derritió más rápido y por qué?” Da una afirmación y una causa.",
      ],
      frame: "The ice on the {tray} tray melted faster {conn} {reason}.",
      slots: [
        {
          id: "tray",
          label: ["Which tray?", "¿Qué bandeja?"],
          options: [
            { id: "metal", text: ["metal", "de metal"] },
            { id: "foam", text: ["foam", "de espuma"] },
          ],
        },
        {
          id: "conn",
          label: ["Connecting word", "Palabra de enlace"],
          options: [
            conn("because", "because", "porque"),
            conn("so", "so", "así que"),
            conn("but", "but", "pero"),
            conn("and", "and", "y"),
          ],
        },
        {
          id: "reason",
          label: ["Cause", "Causa"],
          options: [
            {
              id: "heat",
              text: [
                "metal moves heat into the ice quickly",
                "el metal mueve el calor al hielo rápidamente",
              ],
            },
            { id: "room", text: ["the room was hot", "el salón estaba caliente"] },
            { id: "want", text: ["it wanted to melt", "quería derretirse"] },
            {
              id: "cold",
              text: ["metal is colder than foam", "el metal es más frío que la espuma"],
            },
          ],
        },
      ],
      rules: [
        {
          when: [{ slot: "tray", is: ["foam"] }],
          status: "data",
          say: [
            "Dr. Ruiz checks the data card: “My notes say the foam ice took 11 minutes and the metal ice took 4. Which one finished first?”",
            "La Dra. Ruiz revisa la tarjeta: “Mis notas dicen que el hielo en espuma tardó 11 minutos y el de metal 4. ¿Cuál terminó primero?”",
          ],
          revise: [
            "Read the times again and choose the tray that matches the word faster.",
            "Lee otra vez los tiempos y elige la bandeja que va con la palabra faster (más rápido).",
          ],
        },
        {
          when: [{ slot: "reason", is: ["want"] }],
          status: "clarify",
          say: [
            "Dr. Ruiz tilts her head: “Ice cannot want anything. What did the tray do to the ice?”",
            "La Dra. Ruiz inclina la cabeza: “El hielo no puede querer nada. ¿Qué le hizo la bandeja al hielo?”",
          ],
          revise: [
            "Choose a cause that names something real that happened.",
            "Elige una causa que nombre algo real que pasó.",
          ],
        },
        {
          when: [{ slot: "reason", is: ["room"] }],
          status: "clarify",
          say: [
            "“Both trays were in the same room,” says Dr. Ruiz. “So the room cannot explain the difference. What was different?”",
            "“Las dos bandejas estaban en el mismo salón”, dice la Dra. Ruiz. “Entonces el salón no explica la diferencia. ¿Qué era diferente?”",
          ],
          revise: [
            "A cause must explain the difference between the two cubes. What was different about them?",
            "Una causa debe explicar la diferencia entre los dos cubos. ¿Qué era diferente?",
          ],
        },
        {
          when: [{ slot: "reason", is: ["cold"] }],
          status: "clarify",
          say: [
            "“Metal feels cold when you touch it,” says Dr. Ruiz, “but both trays started at room temperature. What does metal do with heat?”",
            "“El metal se siente frío al tocarlo”, dice la Dra. Ruiz, “pero las dos bandejas empezaron a la temperatura del salón. ¿Qué hace el metal con el calor?”",
          ],
          revise: [
            "Feeling cold is not the same as being colder. Use the data card: how does metal move heat?",
            "Sentirse frío no es lo mismo que estar más frío. Usa la tarjeta: ¿cómo mueve el calor el metal?",
          ],
        },
        {
          when: [{ slot: "conn", is: ["so"] }],
          status: "connect",
          say: [
            "“So tells me the melting made the metal move heat,” says Dr. Ruiz. “Which happened first: heat moving, or ice melting?”",
            "“So (así que) me dice que el derretimiento hizo que el metal moviera calor”, dice la Dra. Ruiz. “¿Qué pasó primero: el calor se movió o el hielo se derritió?”",
          ],
          revise: [
            "Choose a connecting word that introduces a cause, not a result.",
            "Elige una palabra de enlace que presente una causa, no un resultado.",
          ],
        },
        {
          when: [{ slot: "conn", is: ["but"] }],
          status: "connect",
          say: [
            "“But warns me that two ideas disagree,” says Dr. Ruiz. “These two ideas agree. How are they connected?”",
            "“But (pero) me avisa que dos ideas no están de acuerdo”, dice la Dra. Ruiz. “Estas dos ideas sí concuerdan. ¿Cómo se conectan?”",
          ],
          revise: [
            "Your second idea explains the first. Choose the word that introduces a reason.",
            "Tu segunda idea explica la primera. Elige la palabra que presenta una razón.",
          ],
        },
        {
          when: [{ slot: "conn", is: ["and"] }],
          status: "connect",
          say: [
            "“And just puts two facts side by side,” says Dr. Ruiz. “Is one fact the reason for the other?”",
            "“And (y) solo pone dos datos uno junto al otro”, dice la Dra. Ruiz. “¿Un dato es la razón del otro?”",
          ],
          revise: [
            "Show that the second idea causes the first. Which connecting word does that?",
            "Muestra que la segunda idea causa la primera. ¿Qué palabra de enlace hace eso?",
          ],
        },
        {
          when: [
            { slot: "tray", is: ["metal"] },
            { slot: "conn", is: ["because"] },
            { slot: "reason", is: ["heat"] },
          ],
          ok: true,
        },
        {
          status: "clarify",
          say: [
            "Dr. Ruiz asks you to say it another way.",
            "La Dra. Ruiz te pide que lo digas de otra forma.",
          ],
          revise: [
            "Check each tile against the data card.",
            "Revisa cada ficha con la tarjeta de datos.",
          ],
        },
      ],
      bank: [
        ["because: introduces a cause", "because: presenta una causa"],
        ["so: introduces a result", "so: presenta un resultado"],
        ["but: shows a contrast", "but: muestra un contraste"],
        [
          "heat: energy that moves from warm things to cooler things",
          "calor: energía que pasa de lo caliente a lo más frío",
        ],
      ],
      tip: [
        "A cause answers why. A connecting word tells the listener which idea is the cause.",
        "Una causa responde por qué. La palabra de enlace le dice a quien escucha cuál idea es la causa.",
      ],
      success: [
        "Dr. Ruiz nods and writes it down: “That makes sense: metal moves heat into the ice faster. Now, how do you know?”",
        "La Dra. Ruiz asiente y lo anota: “Tiene sentido: el metal pasa el calor al hielo más rápido. Ahora, ¿cómo lo sabes?”",
      ],
    },
    {
      id: "evidence",
      kind: "talk",
      situation: [
        "Dr. Ruiz says: “Prove it with what we measured.” Compare the two times.",
        "La Dra. Ruiz dice: “Demuéstralo con lo que medimos.” Compara los dos tiempos.",
      ],
      frame: "I know because the ice on metal melted in {a}, {conn} the ice on foam took {b}.",
      slots: [
        {
          id: "a",
          label: ["Metal time", "Tiempo en metal"],
          options: [
            { id: "a4", text: ["4 minutes", "4 minutos"] },
            { id: "a11", text: ["11 minutes", "11 minutos"] },
            { id: "ashort", text: ["a short time", "poco tiempo"] },
          ],
        },
        {
          id: "conn",
          label: ["Connecting word", "Palabra de enlace"],
          options: [
            conn("but", "but", "pero"),
            conn("because", "because", "porque"),
            conn("so", "so", "así que"),
          ],
        },
        {
          id: "b",
          label: ["Foam time", "Tiempo en espuma"],
          options: [
            { id: "b4", text: ["4 minutes", "4 minutos"] },
            { id: "b11", text: ["11 minutes", "11 minutos"] },
            { id: "blong", text: ["a long time", "mucho tiempo"] },
          ],
        },
      ],
      rules: [
        {
          when: [{ slot: "a", is: ["ashort"] }],
          status: "evidence",
          say: [
            "“How short?” asks Dr. Ruiz. “Scientists use the numbers they measured.”",
            "“¿Qué tan poco?”, pregunta la Dra. Ruiz. “Los científicos usan los números que midieron.”",
          ],
          revise: [
            "Replace the vague time with the measured time.",
            "Cambia el tiempo impreciso por el tiempo medido.",
          ],
        },
        {
          when: [{ slot: "b", is: ["blong"] }],
          status: "evidence",
          say: [
            "“How long is a long time?” asks Dr. Ruiz. “Give me the number from our data.”",
            "“¿Cuánto es mucho tiempo?”, pregunta la Dra. Ruiz. “Dame el número de nuestros datos.”",
          ],
          revise: [
            "Replace the vague time with the measured time.",
            "Cambia el tiempo impreciso por el tiempo medido.",
          ],
        },
        {
          when: [
            { slot: "a", is: ["a4"] },
            { slot: "b", is: ["b4"] },
          ],
          status: "data",
          say: [
            "“If both took 4 minutes, neither one melted faster,” says Dr. Ruiz.",
            "“Si los dos tardaron 4 minutos, ninguno se derritió más rápido”, dice la Dra. Ruiz.",
          ],
          revise: [
            "Check the foam time on the data card.",
            "Revisa el tiempo en espuma en la tarjeta de datos.",
          ],
        },
        {
          when: [{ slot: "a", is: ["a11"] }],
          status: "data",
          say: [
            "Dr. Ruiz checks the card: “The metal ice did not take 11 minutes. That number belongs to the other tray.”",
            "La Dra. Ruiz revisa la tarjeta: “El hielo en metal no tardó 11 minutos. Ese número es de la otra bandeja.”",
          ],
          revise: [
            "Match each time to the right tray.",
            "Une cada tiempo con la bandeja correcta.",
          ],
        },
        {
          when: [{ slot: "conn", is: ["because", "so"] }],
          status: "connect",
          say: [
            "“Wait. Did one melting time cause the other?” asks Dr. Ruiz. “You are comparing two results.”",
            "“Un momento. ¿Un tiempo causó el otro?”, pregunta la Dra. Ruiz. “Estás comparando dos resultados.”",
          ],
          revise: [
            "These two numbers are different from each other. Which word shows a contrast?",
            "Estos dos números son distintos entre sí. ¿Qué palabra muestra un contraste?",
          ],
        },
        {
          when: [
            { slot: "a", is: ["a4"] },
            { slot: "conn", is: ["but"] },
            { slot: "b", is: ["b11"] },
          ],
          ok: true,
        },
        {
          status: "data",
          say: [
            "Dr. Ruiz compares your numbers with the card.",
            "La Dra. Ruiz compara tus números con la tarjeta.",
          ],
          revise: [
            "Match each time to the right tray.",
            "Une cada tiempo con la bandeja correcta.",
          ],
        },
      ],
      bank: [
        [
          "measured: found with a tool, like a clock or a thermometer",
          "medido: obtenido con un instrumento, como un reloj o un termómetro",
        ],
        ["but: shows two things are different", "but: muestra que dos cosas son diferentes"],
        ["minutes: the unit of time we used", "minutos: la unidad de tiempo que usamos"],
      ],
      tip: [
        "Evidence uses exact measurements. A contrast word helps the listener compare two results.",
        "La evidencia usa medidas exactas. Una palabra de contraste ayuda a comparar dos resultados.",
      ],
      success: [
        "Dr. Ruiz circles both numbers: “4 minutes compared with 11. That is strong evidence. One more question.”",
        "La Dra. Ruiz encierra los dos números: “4 minutos comparados con 11. Es evidencia sólida. Una pregunta más.”",
      ],
    },
    {
      id: "predict",
      kind: "talk",
      situation: [
        "Dr. Ruiz holds up a new tray made of aluminum, a metal. “Predict what will happen, and say why.”",
        "La Dra. Ruiz muestra una bandeja nueva de aluminio, un metal. “Predice qué pasará y di por qué.”",
      ],
      frame:
        "{open} we put ice on an aluminum tray, then it will melt {result} than ice on foam {reason}.",
      slots: [
        {
          id: "open",
          label: ["Start the prediction", "Empieza la predicción"],
          options: [
            conn("if", "If", "Si"),
            conn("although", "Although", "Aunque"),
            conn("because", "Because", "Porque"),
          ],
        },
        {
          id: "result",
          label: ["What will happen?", "¿Qué pasará?"],
          options: [
            { id: "faster", text: ["faster", "más rápido"] },
            { id: "slower", text: ["slower", "más despacio"] },
          ],
        },
        {
          id: "reason",
          label: ["Why?", "¿Por qué?"],
          options: [
            {
              id: "metal",
              text: [
                "because aluminum is a metal that moves heat quickly",
                "porque el aluminio es un metal que mueve el calor rápido",
              ],
            },
            { id: "shiny", text: ["because aluminum is shiny", "porque el aluminio es brillante"] },
            { id: "think", text: ["because I think so", "porque así lo creo"] },
          ],
        },
      ],
      rules: [
        {
          when: [{ slot: "open", is: ["although"] }],
          status: "connect",
          say: [
            "“Although starts an idea that goes against another one,” says Dr. Ruiz. “A prediction needs a condition. Which word sets one up?”",
            "“Although (aunque) presenta una idea que va en contra de otra”, dice la Dra. Ruiz. “Una predicción necesita una condición. ¿Qué palabra la presenta?”",
          ],
          revise: [
            "Choose the word that starts a condition: what we will test.",
            "Elige la palabra que presenta una condición: lo que vamos a probar.",
          ],
        },
        {
          when: [{ slot: "open", is: ["because"] }],
          status: "connect",
          say: [
            "“Because gives a reason for something that already happened,” says Dr. Ruiz. “We have not tested this tray yet.”",
            "“Because (porque) da una razón de algo que ya pasó”, dice la Dra. Ruiz. “Todavía no probamos esta bandeja.”",
          ],
          revise: [
            "Use the word that pairs with then to set up a test.",
            "Usa la palabra que va con then (entonces) para plantear una prueba.",
          ],
        },
        {
          when: [{ slot: "result", is: ["slower"] }],
          status: "clarify",
          say: [
            "“Aluminum is a metal, like the first tray,” says Dr. Ruiz. “What did the metal tray do?”",
            "“El aluminio es un metal, como la primera bandeja”, dice la Dra. Ruiz. “¿Qué hizo la bandeja de metal?”",
          ],
          revise: [
            "Use what you learned about metal to predict the result.",
            "Usa lo que aprendiste del metal para predecir el resultado.",
          ],
        },
        {
          when: [{ slot: "reason", is: ["shiny"] }],
          status: "clarify",
          say: [
            "“Shiny is how it looks,” says Dr. Ruiz. “Does looking shiny move heat? Use our data.”",
            "“Brillante es cómo se ve”, dice la Dra. Ruiz. “¿Verse brillante mueve el calor? Usa nuestros datos.”",
          ],
          revise: [
            "Choose a reason that connects to heat.",
            "Elige una razón que se relacione con el calor.",
          ],
        },
        {
          when: [{ slot: "reason", is: ["think"] }],
          status: "evidence",
          say: [
            "“I believe you,” says Dr. Ruiz, “but a scientist needs a reason from what we learned, not only a feeling.”",
            "“Te creo”, dice la Dra. Ruiz, “pero un científico necesita una razón de lo que aprendimos, no solo un sentimiento.”",
          ],
          revise: [
            "Give a reason based on the data card.",
            "Da una razón basada en la tarjeta de datos.",
          ],
        },
        {
          when: [
            { slot: "open", is: ["if"] },
            { slot: "result", is: ["faster"] },
            { slot: "reason", is: ["metal"] },
          ],
          ok: true,
        },
        {
          status: "clarify",
          say: [
            "Dr. Ruiz asks you to try the prediction again.",
            "La Dra. Ruiz te pide que intentes la predicción otra vez.",
          ],
          revise: [
            "Check each part: condition, result, reason.",
            "Revisa cada parte: condición, resultado, razón.",
          ],
        },
      ],
      bank: [
        ["prediction: what you expect will happen", "predicción: lo que esperas que pase"],
        ["if… then: a condition and what follows", "if… then: una condición y lo que sigue"],
        ["aluminum: a light metal", "aluminio: un metal ligero"],
      ],
      tip: [
        "A prediction often uses if… then: the condition comes after if, the result after then.",
        "Una predicción suele usar if… then: la condición va después de if y el resultado después de then.",
      ],
      success: [
        "Dr. Ruiz sets an ice cube on the aluminum tray. “A testable prediction with a reason. Let’s find out together!”",
        "La Dra. Ruiz pone un cubo de hielo en la bandeja de aluminio. “Una predicción que se puede probar, con una razón. ¡Vamos a averiguarlo juntos!”",
      ],
    },
  ],
};
