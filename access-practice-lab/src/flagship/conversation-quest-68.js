// Conversation Quest, grades 6-8: "Say It Right This Week". Content only (schema: engine.js).
// Each encounter: an opening line (register), your own line (say), a misunderstanding, a repair strategy, the repair
// (say), and a final choice that sets a story flag. Flags: refund (ch1) → ch2 and ch4 intros, ch4 repair step;
// practice (ch2) → ch3 intro, ch4 bus step; project (ch3) → ch4 outro.
const C = (en, es) => [en, es];

export const BAND_68 = {
  premise:
    "Your week is full of conversations that matter: a store return, a schedule clash with your coach, a group project that is falling apart, and a phone call about a lost bag. The words you choose decide how people respond, and every decision you make follows you into the next conversation.",
  premiseEs:
    "Tu semana está llena de conversaciones importantes: una devolución en una tienda, un choque de horarios con tu entrenadora, un proyecto en grupo que se está desarmando y una llamada por una mochila perdida. Las palabras que eliges deciden cómo responde la gente, y cada decisión que tomas te sigue a la próxima conversación.",
  chapters: [
    {
      id: "cq68-return",
      title: "The Return Counter",
      art: ["bg-market", "char-mom"],
      intro:
        "You bought headphones with your birthday money, and three days later the left side went silent. Today you are at the return counter at Brightline Electronics with the box, the receipt, and the notes you kept.",
      introEs:
        "Compraste unos audífonos con el dinero de tu cumpleaños, y tres días después el lado izquierdo dejó de sonar. Hoy estás en el mostrador de devoluciones de Brightline Electronics con la caja, el recibo y las notas que guardaste.",
      outro:
        "You leave the store with the problem solved. On your phone is a message from Coach Reyes: the new practice schedule is out, and it clashes with your Thursday tutoring.",
      docs: [
        {
          id: "receipt",
          kind: "record",
          title: "Receipt, Brightline Electronics",
          rows: [
            ["Item", "Over-ear headphones, black"],
            ["Price", "$34.99"],
            ["Paid with", "Cash"],
            ["Purchase date", "October 28"],
          ],
        },
        {
          id: "policy",
          kind: "record",
          title: "Return policy (sign at the counter)",
          rows: [
            ["Time limit", "30 days from the purchase date, with a receipt"],
            ["Your choice", "A refund paid the same way you paid, OR store credit"],
            ["Store credit", "Good at Brightline for one year"],
            ["Not accepted", "Items damaged by the customer, such as dropped or wet items"],
          ],
        },
        {
          id: "notes",
          kind: "note",
          title: "My notes",
          from: "Me",
          lines: [
            "October 28: bought the headphones.",
            "October 31: the left side stopped making sound.",
            "I never dropped them. They were always in their case.",
            "Today is November 16.",
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: {
            who: "Ms. Ortiz, clerk",
            art: "char-mom",
            line: "Hi there, next in line! What can I do for you?",
          },
          prompt: "Choose your opening line. The clerk is an adult you have never met.",
          help: "La Sra. Ortiz es una adulta que no conoces. Piensa cómo se sentiría con cada frase y cuál le dice claramente qué necesitas.",
          options: [
            {
              id: "a",
              text: "Hi. I'd like to return these headphones, please. They stopped working.",
              ok: true,
              why: "Ms. Ortiz nods and reaches for your receipt. A clear, polite request tells her exactly how to help.",
            },
            {
              id: "b",
              text: "These headphones are trash. I want my money.",
              why: "Calling the product trash puts Ms. Ortiz on the defensive. She works here and may feel attacked before she even hears the problem.",
            },
            {
              id: "c",
              text: "Hey, so, like, these things are messed up or whatever.",
              why: "This sounds too casual for a store counter, and “whatever” signals that you do not care. Ms. Ortiz still has to guess what you want.",
            },
          ],
          rule: C(
            "With an adult in a formal place, greet them, state your request clearly, and soften it with please.",
            "Con un adulto en un lugar formal, saluda, di tu pedido con claridad y suavízalo con please.",
          ),
          explain:
            "The best opening greets the clerk, names the request (a return) and the reason in one polite sentence.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["receipt", "notes"],
          npc: {
            who: "Ms. Ortiz, clerk",
            art: "char-mom",
            line: "Sure. Can you tell me what happened?",
          },
          prompt:
            "Explain the problem to Ms. Ortiz. Include what is wrong, when you bought them, and what you would like.",
          help: "Explica el problema. Usa el recibo para la fecha de compra y tus notas para lo que falló. Di qué te gustaría (devolverlos, un reembolso) y usa please o I would like.",
          check: {
            min: 14,
            ideas: [
              {
                any: ["headphone*"],
                clue: C("Name the item.", "Nombra el producto."),
              },
              {
                any: ["october 28", "oct 28", "october 28th", "october twenty eighth"],
                clue: C(
                  "Give the purchase date from the receipt.",
                  "Da la fecha de compra del recibo.",
                ),
              },
              {
                any: [
                  "stopped",
                  "left side",
                  "no sound",
                  "not working",
                  "doesn't work",
                  "does not work",
                  "broke*",
                  "silent",
                ],
                clue: C("Say what is wrong with them.", "Di qué tienen de malo."),
              },
              {
                any: ["return*", "refund", "exchange", "money back", "store credit", "replace*"],
                clue: C(
                  "Say what you would like the store to do.",
                  "Di qué quieres que haga la tienda.",
                ),
              },
            ],
            register: "polite",
          },
          rule: C(
            "A clear request names the item, the problem, the key detail from your proof, and what you want, politely.",
            "Un pedido claro nombra el producto, el problema, el dato clave de tu prueba y lo que quieres, con cortesía.",
          ),
          frame: "Excuse me, I bought these ___ on ___, but ___. I would like to ___, please.",
          model:
            "Excuse me, I bought these headphones on October 28, but the left side stopped working after three days. I would like to return them, please.",
          keep: "What I said to the clerk",
        },
        {
          id: "mixup",
          type: "choose",
          docs: ["policy"],
          npc: {
            who: "Ms. Ortiz, clerk",
            art: "char-mom",
            line: "Oh, so you dropped them? I'm sorry, but the policy says dropped items can't be returned.",
          },
          prompt: "Ms. Ortiz misheard one word. Which repair strategy fits best?",
          help: "La Sra. Ortiz escuchó mal una palabra que suena parecida a la que dijiste. Piensa qué estrategia arregla el malentendido sin crear un conflicto.",
          options: [
            {
              id: "a",
              text: "Politely point out the word she misheard, then restate the problem with your evidence.",
              ok: true,
              why: "Ms. Ortiz pauses and looks at your notes. Naming the confusion kindly gives her a reason to listen again.",
            },
            {
              id: "b",
              text: "Agree and leave, since the policy is the policy.",
              why: "If you agree, the store believes something that never happened, and you lose a return the policy actually allows.",
            },
            {
              id: "c",
              text: "Tell her she should listen better.",
              why: "That turns a small mishearing into a conflict. Ms. Ortiz may feel insulted and become less willing to help.",
            },
            {
              id: "d",
              text: "Repeat the same sentence, only louder.",
              why: "Louder is not clearer. If one word sounded like another the first time, it can sound that way again.",
            },
          ],
          rule: C(
            "To repair a mishearing, name the confusion kindly and restate the key fact in different words, with proof.",
            "Para reparar algo mal escuchado, nombra la confusión con amabilidad y repite el dato clave con otras palabras y con pruebas.",
          ),
          explain:
            "“Stopped” and “dropped” sound alike. Pointing out that one word and backing it up with your notes fixes the real problem.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["notes", "policy"],
          npc: { who: "Ms. Ortiz, clerk", art: "char-mom", line: "Hmm. Did I hear that wrong?" },
          prompt:
            "Repair the misunderstanding. Correct the misheard word and support it with your notes or the receipt.",
          help: "Usa una frase para aclarar (Sorry, I wasn't clear / What I meant was / Just to check). Corrige la palabra: ¿dijiste dropped o stopped? Luego da una prueba de tus notas.",
          check: {
            min: 18,
            ideas: [
              {
                any: ["stopped", "stopped working"],
                clue: C(
                  "Say the word you really used about the headphones.",
                  "Di la palabra que de verdad usaste sobre los audífonos.",
                ),
              },
              {
                any: [
                  "never dropped",
                  "did not drop",
                  "didn't drop",
                  "not dropped",
                  "not that i dropped",
                  "in the case",
                  "in their case",
                  "never fell",
                ],
                clue: C(
                  "Make clear that they were never dropped.",
                  "Deja claro que nunca se cayeron.",
                ),
              },
            ],
            register: "polite",
            clarify: true,
            evidence: true,
          },
          rule: C(
            "A strong repair names the mix-up, corrects the key word, and points to proof.",
            "Una buena reparación nombra la confusión, corrige la palabra clave y señala una prueba.",
          ),
          frame: "Sorry, I wasn't clear. I said they ___, not that I ___. My notes show ___.",
          model:
            "Sorry, I wasn't clear. I said they stopped working, not that I dropped them. My notes show the left side lost sound on October 31, and they were always in the case.",
          keep: "How I repaired the misunderstanding",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["policy"],
          npc: {
            who: "Ms. Ortiz, clerk",
            art: "char-mom",
            line: "Ah, stopped, not dropped! That's covered. You're within 30 days, so you can have a cash refund of $34.99 or $34.99 in store credit that's good for one year.",
          },
          prompt: "Which option do you choose?",
          help: "Lee la política de devoluciones. Dos opciones son justas, cada una con ventajas y desventajas. Una no es justa para la tienda.",
          options: [
            {
              id: "a",
              text: "I'll take the cash refund, please.",
              ok: true,
              sets: { refund: "cash" },
              why: "Ms. Ortiz counts out $34.99. You can spend the money anywhere, but nothing is saved at Brightline.",
            },
            {
              id: "b",
              text: "Store credit would be great, thank you.",
              ok: true,
              sets: { refund: "credit" },
              why: "Ms. Ortiz loads $34.99 onto a Brightline store credit card. You can only spend it here, but it lasts a full year.",
            },
            {
              id: "c",
              text: "I want the refund, and I'm keeping the headphones too.",
              why: "Keeping the item and the money means being paid for nothing. Ms. Ortiz would see it as unfair to the store.",
            },
          ],
          rule: C(
            "A fair return trades the item back for its value, once.",
            "Una devolución justa cambia el producto por su valor, una sola vez.",
          ),
          explain:
            "The refund and the store credit are both fair trades for the returned headphones; each has a different trade-off.",
        },
      ],
    },
    {
      id: "cq68-coach",
      title: "The Schedule Clash",
      art: ["bg-park", "char-teacher"],
      intro:
        "The new cross-country schedule puts practice on Thursday at 3:45, right when you have math tutoring. The team policy says you must talk to Coach Reyes in person, so you find her at the track before warm-ups.",
      introBy: [
        {
          when: { refund: "cash" },
          text: "Your refund money is in your wallet, but now you have a bigger problem. The new cross-country schedule puts practice on Thursday at 3:45, right when you have math tutoring. The team policy says you must talk to Coach Reyes in person, so you find her at the track before warm-ups.",
        },
        {
          when: { refund: "credit" },
          text: "The Brightline store credit card is tucked in your phone case, but now you have a bigger problem. The new cross-country schedule puts practice on Thursday at 3:45, right when you have math tutoring. The team policy says you must talk to Coach Reyes in person, so you find her at the track before warm-ups.",
        },
      ],
      introEs:
        "El nuevo horario de atletismo pone la práctica el jueves a las 3:45, justo cuando tienes tutoría de matemáticas. La política del equipo dice que debes hablar con la entrenadora Reyes en persona, así que la buscas en la pista antes del calentamiento.",
      outro:
        "Coach Reyes writes your plan on her clipboard. Tomorrow your science group meets about the water-quality project, and the group chat is already tense.",
      docs: [
        {
          id: "practice",
          kind: "schedule",
          title: "Cross-country practice (updated)",
          cols: ["Day", "Time", "Group and place"],
          rows: [
            ["Tuesday", "3:45 to 5:15", "Whole team, school track"],
            ["Wednesday", "3:45 to 5:15", "Trail group, Ridge Trail Park"],
            ["Thursday", "3:45 to 5:15", "Whole team, school track"],
          ],
        },
        {
          id: "tutoring",
          kind: "schedule",
          title: "Math tutoring, Room 204",
          cols: ["Day", "Time", "Tutor"],
          rows: [["Thursday", "3:30 to 4:30", "Mr. Haddad"]],
        },
        {
          id: "policy",
          kind: "note",
          title: "Team policy",
          from: "Coach Reyes",
          lines: [
            "Runners attend at least two practices per week.",
            "Schedule conflicts must be discussed with the coach in person, before the practice.",
            "Missing practice without notice may mean sitting out the next meet.",
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: {
            who: "Coach Reyes",
            art: "char-teacher",
            line: "Hey, I've got a couple of minutes before warm-ups. What's up?",
          },
          prompt: "Choose your opening line. Coach Reyes is in charge of thirty runners.",
          help: "La entrenadora Reyes es una adulta con mucha responsabilidad. Elige la frase que pide su tiempo con respeto y presenta el problema sin exigir.",
          options: [
            {
              id: "a",
              text: "Coach Reyes, do you have a minute? I have a conflict with Thursday practice.",
              ok: true,
              why: "Coach Reyes turns to face you. Asking for her time first, then naming the issue, shows respect.",
            },
            {
              id: "b",
              text: "Your new schedule doesn't work for me, so you need to fix it.",
              why: "“You need to fix it” makes your problem the coach's job. She plans for thirty runners and may feel ordered around.",
            },
            {
              id: "c",
              text: "Yo Coach, Thursday's a no from me.",
              why: "This is too casual for a coach, and it sounds like you already decided without asking. She may read it as not caring about the team.",
            },
          ],
          rule: C(
            "With an adult in charge, ask for their time, then name the problem without making demands.",
            "Con un adulto a cargo, pide su tiempo y luego nombra el problema sin exigir.",
          ),
          explain:
            "The best opening asks permission to talk and names the specific problem, so the coach knows what is coming.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["practice", "tutoring"],
          npc: {
            who: "Coach Reyes",
            art: "char-teacher",
            line: "Okay, tell me about the conflict.",
          },
          prompt: "Explain the conflict. Name both commitments and the times that overlap.",
          help: "Compara los dos horarios. Di qué tienes el jueves, a qué hora empieza cada cosa y por qué no puedes estar en las dos. Usa but o so para unir las ideas.",
          check: {
            min: 16,
            ideas: [
              { any: ["thursday*"], clue: C("Name the day.", "Nombra el día.") },
              {
                any: ["tutoring", "tutor", "math", "mr haddad", "room 204"],
                clue: C("Name your other commitment.", "Nombra tu otro compromiso."),
              },
              {
                any: [
                  "3:30",
                  "3:45",
                  "4:30",
                  "three thirty",
                  "three forty five",
                  "four thirty",
                  "overlap*",
                  "same time",
                ],
                clue: C(
                  "Use the times from the schedules to show the overlap.",
                  "Usa las horas de los horarios para mostrar que se cruzan.",
                ),
              },
            ],
            connector: ["contrast", "cause"],
            register: "polite",
          },
          rule: C(
            "To explain a conflict, name both commitments with their times and connect them with but or so.",
            "Para explicar un conflicto, nombra los dos compromisos con sus horas y únelos con but o so.",
          ),
          frame:
            "Excuse me, Coach. On ___ I have ___ from ___ to ___, but practice starts at ___, so ___.",
          model:
            "Excuse me, Coach. On Thursday I have math tutoring from 3:30 to 4:30, but practice starts at 3:45, so the two times overlap.",
          keep: "What I said to the coach",
        },
        {
          id: "mixup",
          type: "choose",
          npc: {
            who: "Coach Reyes",
            art: "char-teacher",
            line: "Hmm. So you're asking me to move Thursday practice for the whole team?",
          },
          prompt: "Coach Reyes misunderstood your request. Which repair strategy fits best?",
          help: "La entrenadora cree que pides cambiar la práctica para todo el equipo. ¿Eso pediste? Piensa qué estrategia aclara lo que de verdad quieres.",
          options: [
            {
              id: "a",
              text: "Use a check-in question to confirm what she heard, then restate your actual request.",
              ok: true,
              why: "Coach Reyes relaxes. Checking first shows you heard her, and restating shows what you really need.",
            },
            {
              id: "b",
              text: "Say yes, since moving practice would solve it.",
              why: "Thirty runners would have to change plans for one person. Coach Reyes would likely refuse, and your real request is never heard.",
            },
            {
              id: "c",
              text: "Say, “Forget it, I'll just skip Thursdays.”",
              why: "Skipping without a plan breaks the team policy, and Coach Reyes is left thinking you asked for something unreasonable.",
            },
            {
              id: "d",
              text: "Sigh and repeat “tutoring, Thursday” slowly.",
              why: "A sigh signals frustration at the coach, and repeating the same words still does not say what you are asking for.",
            },
          ],
          rule: C(
            "When someone misreads your request, check what they heard, then say what you are and are not asking.",
            "Cuando alguien entiende mal tu pedido, revisa qué escuchó y luego di lo que sí pides y lo que no.",
          ),
          explain:
            "A check-in question repairs the mix-up without blame, and restating the request makes the real ask clear.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["policy"],
          npc: { who: "Coach Reyes", art: "char-teacher", line: "Then what are you asking for?" },
          prompt:
            "Repair the misunderstanding. Make clear what you are and are not asking, and refer to the team policy.",
          help: "Usa Just to check o What I meant was. Di lo que NO pides (cambiar la práctica de todos) y lo que SÍ pides (un plan solo para ti). Menciona la regla de dos prácticas de la política.",
          check: {
            min: 20,
            ideas: [
              {
                any: [
                  "not asking",
                  "not ask*",
                  "only me",
                  "just me",
                  "only for me",
                  "just for me",
                  "not the whole team",
                  "not the team",
                  "my schedule",
                ],
                clue: C("Say what you are NOT asking for.", "Di lo que NO estás pidiendo."),
              },
              {
                any: ["two practices", "2 practices", "twice", "policy", "two a week"],
                clue: C(
                  "Refer to the team policy about practices.",
                  "Menciona la política del equipo sobre las prácticas.",
                ),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A strong repair separates what you are asking from what you are not, and uses the rules to show it is fair.",
            "Una buena reparación separa lo que pides de lo que no pides, y usa las reglas para mostrar que es justo.",
          ),
          frame:
            "Sorry, just to check: I am not asking ___. I mean ___, because the policy says ___.",
          model:
            "Sorry, just to check: I am not asking you to move practice for the whole team. I mean a change only for me, because the policy says I need two practices a week.",
          keep: "How I cleared up my request",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["practice", "tutoring", "policy"],
          npc: {
            who: "Coach Reyes",
            art: "char-teacher",
            line: "Ah, okay, that I can work with. You could run with the Wednesday trail group instead of Thursday. Or you could come Thursday after tutoring, around 4:35, and do a short catch-up workout on your own.",
          },
          prompt: "Which plan do you choose?",
          help: "Compara los horarios y la política. Dos planes cumplen la regla de dos prácticas, cada uno con un costo distinto. Uno pide algo injusto.",
          options: [
            {
              id: "a",
              text: "I'll switch to the Wednesday trail group, thank you.",
              ok: true,
              sets: { practice: "wednesday" },
              why: "Coach Reyes moves you to Wednesday. Thursdays are free after tutoring, but trail runs are harder and farther from home.",
            },
            {
              id: "b",
              text: "I'll come Thursday after tutoring and do the catch-up workout, please.",
              ok: true,
              sets: { practice: "late" },
              why: "You stay with your usual group, but on Thursdays you arrive at 4:35 and miss the team warm-up.",
            },
            {
              id: "c",
              text: "Could you excuse me from the two-practice rule? I'm fast anyway.",
              why: "Asking for a rule only you can skip would feel unfair to teammates who follow it, and Coach Reyes would have to say no.",
            },
          ],
          rule: C(
            "A fair solution meets the rules everyone follows and solves your conflict.",
            "Una solución justa cumple las reglas que todos siguen y resuelve tu conflicto.",
          ),
          explain:
            "Both fair plans keep two practices a week and protect tutoring; they differ in what you give up.",
        },
      ],
    },
    {
      id: "cq68-project",
      title: "The Group Project",
      art: ["bg-classroom", "char-amara"],
      intro:
        "Your science group (you, Amara and Kai) is presenting a water-quality study of Willow Creek on Friday. Last night Amara changed your data and decided to present everything herself. You meet her at lunch to talk it through.",
      introBy: [
        {
          when: { practice: "wednesday" },
          text: "Your science group (you, Amara and Kai) is presenting a water-quality study of Willow Creek on Friday. Amara wanted to meet Wednesday after school, but that is your trail-run day now, so you suggested lunch instead. Last night Amara changed your data and decided to present everything herself.",
        },
        {
          when: { practice: "late" },
          text: "Your science group (you, Amara and Kai) is presenting a water-quality study of Willow Creek on Friday. Amara wanted to meet Thursday after school, but you have tutoring and then practice, so you suggested lunch instead. Last night Amara changed your data and decided to present everything herself.",
        },
      ],
      introEs:
        "Tu grupo de ciencias (tú, Amara y Kai) presenta el viernes un estudio sobre la calidad del agua del arroyo Willow. Anoche Amara cambió tus datos y decidió presentar todo ella sola. La ves en el almuerzo para hablarlo.",
      outro:
        "The group chat is calm again. Then, on the bus ride home, you realize your backpack is not on your shoulder. You left it on the bus.",
      docs: [
        {
          id: "task",
          kind: "note",
          title: "Project task list",
          from: "Ms. Brooks, science teacher",
          lines: [
            "Topic: water quality at Willow Creek.",
            "Parts: a data table, slides, and a short talk.",
            "Every member must speak during the talk.",
            "Use your real measurements. Do not change data.",
          ],
        },
        {
          id: "chat",
          kind: "note",
          title: "Group chat",
          from: "Amara and Kai",
          lines: [
            "Amara: I redid the slides last night. I'll just present all of it Friday.",
            "Amara: The data table looked messy, so I rounded the numbers.",
            "Kai: ok",
          ],
        },
        {
          id: "data",
          kind: "chart",
          title: "Our measurements: pH at three sites",
          unit: "pH",
          bars: [
            { label: "Site A", value: 7.2 },
            { label: "Site B", value: 6.8 },
            { label: "Site C", value: 6.1 },
          ],
          source: "Your field notebook",
        },
        {
          id: "slide",
          kind: "record",
          title: "Amara's slide 3",
          rows: [
            ["Site A", "pH 7"],
            ["Site B", "pH 7"],
            ["Site C", "pH 6"],
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          docs: ["chat"],
          npc: {
            who: "Amara",
            art: "char-amara",
            line: "Did you see the new slides? I fixed everything.",
          },
          prompt: "Amara is a classmate, and you are upset about the changes. Choose your opening.",
          help: "Amara es tu compañera, así que puedes hablar de forma relajada, pero con amabilidad. Elige la frase que abre la conversación sin pelear.",
          options: [
            {
              id: "a",
              text: "Hey Amara, thanks for working on the slides. Can we talk about a couple of changes?",
              ok: true,
              why: "Amara relaxes. Thanking her first shows you see her effort, so she is ready to listen.",
            },
            {
              id: "b",
              text: "You ruined my data table.",
              why: "Starting with blame makes Amara defensive, and the talk turns into a fight about who is right.",
            },
            {
              id: "c",
              text: "Whatever, it's fine.",
              why: "Amara will think you agree, and the problem with the numbers stays on the slides.",
            },
          ],
          rule: C(
            "With a peer you can be casual, but open a disagreement by recognizing their effort before naming the issue.",
            "Con un compañero puedes hablar relajado, pero empieza un desacuerdo reconociendo su esfuerzo antes de nombrar el problema.",
          ),
          explain:
            "Thanking Amara, then asking to talk about the changes, keeps her listening and puts the issue on the table.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Argue",
          docs: ["data", "slide", "task"],
          npc: { who: "Amara", art: "char-amara", line: "Sure. What changes?" },
          prompt:
            "Tell Amara your concern about the numbers. Use the data to explain why the change matters.",
          help: "Compara la gráfica con la diapositiva de Amara. ¿Qué sitio cambió más al redondear? Explica por qué importa (because, so) y nombra tu evidencia (the data shows). Habla con amabilidad.",
          check: {
            min: 22,
            ideas: [
              {
                any: ["site b", "6.8", "site c", "6.1", "7.2"],
                clue: C(
                  "Name a site or a number that the rounding changed.",
                  "Nombra un sitio o un número que cambió al redondear.",
                ),
              },
              {
                any: [
                  "round*",
                  "same as",
                  "looks the same",
                  "difference",
                  "different",
                  "real numbers",
                  "changed",
                ],
                clue: C(
                  "Say what the rounding does to the data.",
                  "Di qué le hace el redondeo a los datos.",
                ),
              },
            ],
            connector: ["cause", "contrast"],
            evidence: true,
            register: "kind",
          },
          rule: C(
            "A strong concern points to the evidence and explains the effect, kindly, with because or so.",
            "Una buena preocupación señala la evidencia y explica el efecto, con amabilidad, usando because o so.",
          ),
          frame: "I appreciate your work, but our data shows ___. If we round it, ___, so ___.",
          model:
            "I appreciate your work, but our data shows Site B was 6.8, not 7. If we round it, Site B looks the same as Site A, so people will miss the difference.",
          keep: "What I told Amara about the data",
        },
        {
          id: "mixup",
          type: "choose",
          npc: {
            who: "Amara",
            art: "char-amara",
            line: "So you're saying I'm bad at math, and you want to do the whole thing yourself?",
          },
          prompt: "Amara took your point personally. Which repair strategy fits best?",
          help: "Amara cree que la estás atacando a ella. Piensa qué estrategia separa el problema de la persona y deja claro lo que pides.",
          options: [
            {
              id: "a",
              text: "Separate the issue from the person: say what you did not mean, then restate the one change you want.",
              ok: true,
              why: "Amara's shoulders drop. Hearing what you did not mean lets her stop defending herself.",
            },
            {
              id: "b",
              text: "Say, “Well, the slides were wrong.”",
              why: "That confirms her worst reading of you. Amara hears an attack on her, not a point about the data.",
            },
            {
              id: "c",
              text: "Message Ms. Brooks right away to complain.",
              why: "Going over Amara's head before you clear up the mix-up makes her feel betrayed, and the group still has no plan.",
            },
            {
              id: "d",
              text: "Stay quiet and let her keep the rounded numbers.",
              why: "Silence leaves Amara believing you think she is bad at math, and the slides still hide the difference between sites.",
            },
          ],
          rule: C(
            "When a point feels personal, separate the problem from the person, then restate the request.",
            "Cuando un comentario se siente personal, separa el problema de la persona y luego repite tu pedido.",
          ),
          explain:
            "Saying what you did not mean takes the sting out, and restating the one change keeps the talk on the data.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Argue",
          docs: ["task", "data"],
          npc: { who: "Amara", art: "char-amara", line: "Then what do you want?" },
          prompt:
            "Repair the misunderstanding. Make clear what you did not mean and what you are actually asking for.",
          help: "Usa That's not what I meant o What I meant was. Di lo que NO piensas de Amara y lo que SÍ pides (los números reales), con una razón (because). La lista de la maestra también ayuda.",
          check: {
            min: 24,
            ideas: [
              {
                any: [
                  "not saying",
                  "didn't mean",
                  "did not mean",
                  "not what i meant",
                  "not bad",
                  "not about you",
                  "you're not bad",
                  "you are not bad",
                ],
                clue: C(
                  "Say what you did NOT mean about Amara.",
                  "Di lo que NO quisiste decir sobre Amara.",
                ),
              },
              {
                any: [
                  "original",
                  "real numbers",
                  "real measurements",
                  "exact",
                  "decimal*",
                  "6.8",
                  "keep the",
                  "not change data",
                ],
                clue: C(
                  "Say the one change you are asking for.",
                  "Di el único cambio que estás pidiendo.",
                ),
              },
            ],
            connector: ["cause", "contrast"],
            register: "kind",
            clarify: true,
          },
          rule: C(
            "A repair with a peer says what you did not mean, states the real request, and gives a reason.",
            "Para reparar con un compañero, di lo que no quisiste decir, di tu pedido real y da una razón.",
          ),
          frame: "That's not what I meant. I'm not saying ___. What I meant is ___, because ___.",
          model:
            "That's not what I meant. I'm not saying you're bad at math, and I don't want to do it alone. What I meant is that we should keep the original numbers, because the decimals show the real difference between the sites.",
          keep: "How I settled the disagreement",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["task"],
          npc: {
            who: "Amara",
            art: "char-amara",
            line: "Okay, fair. I'll put the real numbers back. The task list says everyone speaks, too. How should we divide the talk?",
          },
          prompt: "Which plan do you suggest?",
          help: "La lista dice que todos deben hablar. Dos planes son justos para el grupo, cada uno con un costo distinto. Uno deja fuera a los demás.",
          options: [
            {
              id: "a",
              text: "Let's split it: I present the data, you present the slides you designed, and Kai does the conclusion.",
              ok: true,
              sets: { project: "split" },
              why: "Each person presents what they know best. Kai gets the conclusion, which he will need to prepare on his own.",
            },
            {
              id: "b",
              text: "Let's trade: you present the data so you really know it, and I present the design part. Kai does the conclusion.",
              ok: true,
              sets: { project: "trade" },
              why: "Trading means each of you learns something new, but you will both need extra practice before Friday.",
            },
            {
              id: "c",
              text: "I'll present everything, since my data is the important part.",
              why: "That repeats the problem you just solved, now with you in charge. Amara and Kai would feel shut out, and the task list says every member speaks.",
            },
          ],
          rule: C(
            "A fair group plan gives every member a real part and follows the teacher's requirements.",
            "Un plan de grupo justo le da a cada miembro una parte real y sigue lo que pide la maestra.",
          ),
          explain:
            "Both fair plans give all three members a speaking part; one plays to strengths, the other builds new skills.",
        },
      ],
    },
    {
      id: "cq68-lostbag",
      title: "The Lost-and-Found Call",
      art: ["bg-city", "char-dad"],
      intro:
        "Your black backpack is somewhere on a city bus. You sat in the back row with the bag at your feet and forgot it when you got off. You call the Central Station lost and found.",
      introBy: [
        {
          when: { refund: "cash" },
          text: "Your black backpack is somewhere on a city bus, with your science binder and the wireless earbuds you bought with your refund money. You sat in the back row with the bag at your feet and forgot it when you got off. You call the Central Station lost and found.",
        },
        {
          when: { refund: "credit" },
          text: "Your black backpack is somewhere on a city bus, with your science binder and your Brightline store credit card, still worth $34.99. You sat in the back row with the bag at your feet and forgot it when you got off. You call the Central Station lost and found.",
        },
      ],
      introEs:
        "Tu mochila negra está en algún autobús de la ciudad. Te sentaste en la última fila con la mochila a tus pies y la olvidaste al bajar. Llamas a la oficina de objetos perdidos de la Estación Central.",
      outro:
        "Your backpack is safe. In one week you fixed a return, a schedule clash, a group fight and a lost bag, each with calm, clear, polite words.",
      outroBy: [
        {
          when: { project: "split" },
          text: "Your backpack is safe. With your binder back, you rehearse the data slides for Friday while Kai texts his first draft of the conclusion. In one week you fixed a return, a schedule clash, a group fight and a lost bag, each with calm, clear words.",
        },
        {
          when: { project: "trade" },
          text: "Your backpack is safe. With your binder back, you start learning Amara's design slides, and she messages you questions about the data. In one week you fixed a return, a schedule clash, a group fight and a lost bag, each with calm, clear words.",
        },
      ],
      docs: [
        {
          id: "buses",
          kind: "schedule",
          title: "Buses that ended at Central Station this week",
          cols: ["Route", "From", "Day", "Left", "Arrived"],
          rows: [
            ["7", "Ridge Trail Park", "Wednesday", "5:30 PM", "5:55 PM"],
            ["12", "School track", "Thursday", "5:30 PM", "5:50 PM"],
            ["15", "Downtown Library", "Thursday", "5:30 PM", "6:05 PM"],
          ],
        },
        {
          id: "form",
          kind: "record",
          title: "Lost-item report form",
          rows: [
            ["Item", "Color, size, and what is inside"],
            ["Route and day", "Which bus, which day, what time"],
            ["Seat", "Front, middle, or back"],
            ["Contact", "A phone number for a call back"],
          ],
        },
        {
          id: "station",
          kind: "map",
          title: "Central Station",
          places: [
            { name: "Main entrance", x: 1, y: 4 },
            { name: "Ticket windows", x: 3, y: 4 },
            { name: "Lost and found", x: 5, y: 4 },
            { name: "Waiting area", x: 3, y: 2 },
            { name: "Bus bays 1-8", x: 5, y: 1 },
            { name: "Bus bays 9-16", x: 8, y: 1 },
          ],
          paths: [
            [0, 1],
            [1, 2],
            [1, 3],
            [3, 4],
            [4, 5],
          ],
          notes: [
            "Lost and found is next to the ticket windows.",
            "Items left on buses are brought to lost and found at the end of each route.",
          ],
        },
        {
          id: "bag-cash",
          kind: "note",
          title: "What is in my backpack",
          from: "Me",
          lines: [
            "Black backpack with gray straps",
            "Science binder with my name on the cover",
            "Wireless earbuds in a white case",
          ],
        },
        {
          id: "bag-credit",
          kind: "note",
          title: "What is in my backpack",
          from: "Me",
          lines: [
            "Black backpack with gray straps",
            "Science binder with my name on the cover",
            "Brightline store credit card in the front pocket",
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Central Station Lost and Found, this is Mr. Tran.",
          },
          prompt: "This is a phone call to a stranger at work. Choose your opening line.",
          help: "Por teléfono, el Sr. Tran no te ve. Elige la frase que saluda, explica por qué llamas y no culpa a nadie.",
          options: [
            {
              id: "a",
              text: "Hi, Mr. Tran. I'm calling because I think I left my backpack on one of your buses.",
              ok: true,
              why: "Mr. Tran pulls up the lost-item log. A greeting plus your reason for calling tells him exactly where to start.",
            },
            {
              id: "b",
              text: "Hi. Did you guys find my stuff or not?",
              why: "Mr. Tran answers many calls. “Or not” sounds impatient, and “my stuff” gives him nothing to search for.",
            },
            {
              id: "c",
              text: "Your bus driver lost my backpack.",
              why: "Blaming the driver puts Mr. Tran on the defensive, and it is not even true: you left the bag behind.",
            },
          ],
          rule: C(
            "On a phone call, greet the person, say why you are calling, and take responsibility for your part.",
            "En una llamada, saluda, di por qué llamas y acepta tu parte de responsabilidad.",
          ),
          explain:
            "The best opening greets Mr. Tran, gives the reason for the call, and admits the bag was left behind, so he wants to help.",
        },
        {
          id: "say-wed",
          type: "write",
          say: true,
          use: "Explain",
          when: { practice: "wednesday" },
          docs: ["buses", "form"],
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Okay. Which bus were you on, and when?",
          },
          prompt:
            "You rode home from your Wednesday trail run. Tell Mr. Tran which bus you rode, the day and time, and where you sat. Use the bus schedule.",
          help: "Busca en el horario el autobús que sale de Ridge Trail Park. Di la ruta, el día, la hora y dónde te sentaste. Pide con cortesía (could you please).",
          check: {
            min: 20,
            ideas: [
              {
                any: ["route 7", "bus 7", "number 7", "route seven", "bus seven", "the 7"],
                clue: C(
                  "Name the route. Look for Ridge Trail Park on the schedule.",
                  "Nombra la ruta. Busca Ridge Trail Park en el horario.",
                ),
              },
              { any: ["wednesday"], clue: C("Say the day.", "Di el día.") },
              {
                any: ["5:30", "five thirty", "5:55", "five fifty five"],
                clue: C("Say the time from the schedule.", "Di la hora del horario."),
              },
              {
                any: ["back row", "back", "last row", "rear"],
                clue: C("Say where you sat.", "Di dónde te sentaste."),
              },
            ],
            register: "polite",
          },
          rule: C(
            "A useful report gives exact details the listener can check: route, day, time and place.",
            "Un buen reporte da datos exactos que la otra persona puede revisar: ruta, día, hora y lugar.",
          ),
          frame:
            "Could you please check Route ___? I rode it on ___ at ___ from ___, and I sat ___.",
          model:
            "Could you please check Route 7? I rode it on Wednesday at 5:30 from Ridge Trail Park, and I sat in the back row.",
          keep: "What I told Mr. Tran about the bus",
        },
        {
          id: "say-thu",
          type: "write",
          say: true,
          use: "Explain",
          when: { practice: "late" },
          docs: ["buses", "form"],
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Okay. Which bus were you on, and when?",
          },
          prompt:
            "You rode home from Thursday practice at the school track. Tell Mr. Tran which bus you rode, the day and time, and where you sat. Use the bus schedule.",
          help: "Busca en el horario el autobús que sale de la pista de la escuela. Di la ruta, el día, la hora y dónde te sentaste. Pide con cortesía (could you please).",
          check: {
            min: 20,
            ideas: [
              {
                any: ["route 12", "bus 12", "number 12", "route twelve", "bus twelve", "the 12"],
                clue: C(
                  "Name the route. Look for the school track on the schedule.",
                  "Nombra la ruta. Busca la pista de la escuela en el horario.",
                ),
              },
              { any: ["thursday"], clue: C("Say the day.", "Di el día.") },
              {
                any: ["5:30", "five thirty", "5:50", "five fifty"],
                clue: C("Say the time from the schedule.", "Di la hora del horario."),
              },
              {
                any: ["back row", "back", "last row", "rear"],
                clue: C("Say where you sat.", "Di dónde te sentaste."),
              },
            ],
            register: "polite",
          },
          rule: C(
            "A useful report gives exact details the listener can check: route, day, time and place.",
            "Un buen reporte da datos exactos que la otra persona puede revisar: ruta, día, hora y lugar.",
          ),
          frame:
            "Could you please check Route ___? I rode it on ___ at ___ from ___, and I sat ___.",
          model:
            "Could you please check Route 12? I rode it on Thursday at 5:30 from the school track, and I sat in the back row.",
          keep: "What I told Mr. Tran about the bus",
        },
        {
          id: "mixup",
          type: "choose",
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Got it. I have a black backpack from that bus, back row. There's a laptop inside. That's yours, right?",
          },
          prompt: "Mr. Tran found a bag, but yours had no laptop. Which repair strategy fits best?",
          help: "Tu mochila no tenía computadora. Piensa qué estrategia aclara la confusión con calma y ayuda al Sr. Tran a encontrar la mochila correcta.",
          options: [
            {
              id: "a",
              text: "Say the detail that does not match, then describe something only your bag has.",
              ok: true,
              why: "Mr. Tran puts the first bag aside and checks the shelf again. A detail only your bag has lets him tell the bags apart.",
            },
            {
              id: "b",
              text: "Say yes, so you get a backpack back.",
              why: "That bag belongs to someone else, who may be calling too. Mr. Tran would be upset to learn he gave it to the wrong person.",
            },
            {
              id: "c",
              text: "Hang up and try again later.",
              why: "Hanging up loses Mr. Tran's attention and the progress you made; next time you start from zero.",
            },
            {
              id: "d",
              text: "Say, “Ugh, that's obviously not mine.”",
              why: "“Obviously” sounds like Mr. Tran should have known. He cannot see your bag, so he may feel talked down to.",
            },
          ],
          rule: C(
            "To fix a mix-up about an object, name what does not match, then give a detail only yours has.",
            "Para arreglar una confusión sobre un objeto, nombra lo que no coincide y da un detalle que solo tiene el tuyo.",
          ),
          explain:
            "Naming the laptop as the wrong detail, then giving a detail only your bag has, lets Mr. Tran find the right one.",
        },
        {
          id: "repair-cash",
          type: "write",
          say: true,
          use: "Explain",
          when: { refund: "cash" },
          docs: ["bag-cash", "form"],
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Not yours? Then help me out. What's in your bag?",
          },
          prompt:
            "Repair the mix-up. Say what does not match, and describe two things only your bag has.",
          help: "Usa Just to check o Sorry, I wasn't clear. Di qué no coincide (la computadora) y describe dos cosas de tu lista que solo tiene tu mochila.",
          check: {
            min: 24,
            ideas: [
              {
                any: [
                  "no laptop",
                  "not a laptop",
                  "don't have a laptop",
                  "didn't have a laptop",
                  "did not have a laptop",
                  "doesn't have a laptop",
                  "not mine",
                  "no computer",
                ],
                clue: C(
                  "Say which detail does not match your bag.",
                  "Di qué detalle no coincide con tu mochila.",
                ),
              },
              {
                any: ["binder", "my name", "gray straps", "grey straps"],
                clue: C(
                  "Describe something with your name or your bag's look.",
                  "Describe algo con tu nombre o cómo se ve tu mochila.",
                ),
              },
              {
                any: ["earbuds", "white case", "ear buds"],
                clue: C(
                  "Name the item you bought with your refund money.",
                  "Nombra lo que compraste con el dinero del reembolso.",
                ),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A strong repair names the mismatch, then gives details only the right item could have.",
            "Una buena reparación nombra lo que no coincide y da detalles que solo tiene el objeto correcto.",
          ),
          frame: "Sorry, just to check: ___. Mine has ___ and ___.",
          model:
            "Sorry, just to check: does that bag have a laptop? Mine has no laptop. It has a science binder with my name on it and wireless earbuds in a white case.",
          keep: "How I described my bag",
        },
        {
          id: "repair-credit",
          type: "write",
          say: true,
          use: "Explain",
          when: { refund: "credit" },
          docs: ["bag-credit", "form"],
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Not yours? Then help me out. What's in your bag?",
          },
          prompt:
            "Repair the mix-up. Say what does not match, and describe two things only your bag has.",
          help: "Usa Just to check o Sorry, I wasn't clear. Di qué no coincide (la computadora) y describe dos cosas de tu lista que solo tiene tu mochila.",
          check: {
            min: 24,
            ideas: [
              {
                any: [
                  "no laptop",
                  "not a laptop",
                  "don't have a laptop",
                  "didn't have a laptop",
                  "did not have a laptop",
                  "doesn't have a laptop",
                  "not mine",
                  "no computer",
                ],
                clue: C(
                  "Say which detail does not match your bag.",
                  "Di qué detalle no coincide con tu mochila.",
                ),
              },
              {
                any: ["binder", "my name", "gray straps", "grey straps"],
                clue: C(
                  "Describe something with your name or your bag's look.",
                  "Describe algo con tu nombre o cómo se ve tu mochila.",
                ),
              },
              {
                any: ["store credit", "credit card", "brightline", "front pocket"],
                clue: C(
                  "Name the card from the store return.",
                  "Nombra la tarjeta de la devolución en la tienda.",
                ),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A strong repair names the mismatch, then gives details only the right item could have.",
            "Una buena reparación nombra lo que no coincide y da detalles que solo tiene el objeto correcto.",
          ),
          frame: "Sorry, just to check: ___. Mine has ___ and ___.",
          model:
            "Sorry, just to check: does that bag have a laptop? Mine has no laptop. It has a science binder with my name on it and a Brightline store credit card in the front pocket.",
          keep: "How I described my bag",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["station"],
          npc: {
            who: "Mr. Tran, lost and found",
            art: "char-dad",
            line: "Here it is! Black, gray straps, binder with your name. You can pick it up here at the station today, or I can send it to your school's front office tomorrow morning.",
          },
          prompt: "Which option do you choose?",
          help: "Mira el mapa de la estación. Dos opciones son justas, cada una con un costo. Una le pide al Sr. Tran algo que la estación no ofrece.",
          options: [
            {
              id: "a",
              text: "I'll come to the station today, thank you. Is lost and found next to the ticket windows?",
              ok: true,
              sets: { pickup: "station" },
              why: "Mr. Tran says yes: go in the main entrance and walk past the ticket windows. You will have your bag tonight.",
            },
            {
              id: "b",
              text: "Could you please send it to my school's front office? Thank you so much.",
              ok: true,
              sets: { pickup: "school" },
              why: "No trip tonight, but you will do homework without your binder and pick it up tomorrow morning.",
            },
            {
              id: "c",
              text: "Just bring it to my house tonight.",
              why: "That asks Mr. Tran for a special delivery the station does not offer. He would feel it is an unfair demand on his time.",
            },
          ],
          rule: C(
            "Choose from the options the other person offers, and thank them for their help.",
            "Elige entre las opciones que la otra persona ofrece y agradece su ayuda.",
          ),
          explain:
            "Both fair choices use what the station offers and thank Mr. Tran; they differ in when you get your bag back.",
        },
      ],
    },
  ],
};
