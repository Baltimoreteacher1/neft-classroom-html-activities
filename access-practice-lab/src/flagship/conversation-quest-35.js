// Conversation Quest, grades 3-5: "A Week on Maple Street". Content only (schema: engine.js).
// Each encounter: an opening line (register), your own line (say), a mix-up, a repair strategy, the repair (say), and a
// final choice that sets a story flag. Flags: toy (ch1) → ch2 intro, ch4 steps; soccer (ch2) → ch3 and ch4 intros;
// poster (ch3) → ch4 outro.
const C = (en, es) => [en, es];

export const BAND_35 = {
  premise:
    "It is a busy week on Maple Street. You have four real conversations to get through: at the market, at soccer, with your project partner, and at the library. How you speak changes how people answer, and every choice you make follows you to the next stop.",
  premiseEs:
    "Es una semana muy ocupada en la calle Maple. Tienes cuatro conversaciones reales: en el mercado, en fútbol, con tu compañero de proyecto y en la biblioteca. Cómo hablas cambia cómo te responden, y cada decisión que tomas te sigue a la próxima parada.",
  chapters: [
    {
      id: "cq35-toy",
      title: "The Broken Robot",
      art: ["bg-market", "char-dad"],
      intro:
        "Your new wind-up robot broke one day after you bought it. Mom found the receipt. Now you are at the market, standing at Mr. Rami's toy stall with the robot in your hands.",
      introEs:
        "Tu robot de cuerda nuevo se rompió un día después de comprarlo. Mamá encontró el recibo. Ahora estás en el mercado, frente al puesto de juguetes del Sr. Rami, con el robot en las manos.",
      outro:
        "Mr. Rami waves goodbye. You put the receipt in your green backpack. Next stop: soccer practice, where Coach Dana is waiting with a new schedule.",
      docs: [
        {
          id: "receipt",
          kind: "record",
          title: "Receipt from Rami's Toy Stall",
          rows: [
            ["Item", "Wind-up robot"],
            ["Price", "$8"],
            ["Date", "Saturday, May 3"],
            ["Returns", "Bring it back in 14 days with this receipt."],
          ],
        },
        {
          id: "mom",
          kind: "note",
          title: "Note from Mom",
          from: "Mom",
          lines: [
            "The robot's arm fell off on Sunday.",
            "Ask Mr. Rami nicely. You can trade it or ask what else he can do.",
            "Show him the receipt!",
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: { who: "Mr. Rami", art: "char-dad", line: "Good morning! Welcome to my toy stall." },
          prompt: "How do you start talking to Mr. Rami?",
          help: "El Sr. Rami es un adulto que no conoces bien. Piensa cómo se sentiría con cada frase. Elige la que suena amable y respetuosa.",
          options: [
            {
              id: "a",
              text: "Hey! This robot is broken. Fix it now.",
              why: "“Fix it now” sounds like an order. Mr. Rami may feel bossed around before he even hears the problem.",
            },
            {
              id: "b",
              text: "Excuse me, Mr. Rami. Can you help me with this robot, please?",
              ok: true,
              why: "Mr. Rami smiles. A polite start makes him want to help you.",
            },
            {
              id: "c",
              text: "Yo, your robots are junk.",
              why: "Mr. Rami sells these toys. Calling them junk could hurt his feelings, and he may not want to help.",
            },
          ],
          rule: C(
            "With an adult you do not know well, start with a greeting or excuse me, and ask with please.",
            "Con un adulto que no conoces bien, empieza con un saludo o excuse me, y pide con please.",
          ),
          explain:
            "Excuse me and please show respect to an adult you do not know well, and the question tells him you need help.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["receipt", "mom"],
          npc: { who: "Mr. Rami", art: "char-dad", line: "Of course. What happened?" },
          prompt: "Tell Mr. Rami what happened and when you bought the robot. Use the receipt.",
          help: "Di qué pasó con el robot y cuándo lo compraste. Busca la fecha en el recibo. No olvides una palabra cortés como please o excuse me.",
          check: {
            min: 8,
            ideas: [
              {
                any: ["robot", "toy", "arm"],
                clue: C("Say which toy you mean.", "Di de qué juguete hablas."),
              },
              {
                any: ["may 3", "may 3rd", "may third", "saturday", "last saturday"],
                clue: C(
                  "Say when you bought it. Look at the date on the receipt.",
                  "Di cuándo lo compraste. Mira la fecha en el recibo.",
                ),
              },
              {
                any: [
                  "broke*",
                  "fell off",
                  "came off",
                  "not working",
                  "doesn't work",
                  "does not work",
                  "fell",
                ],
                clue: C("Say what went wrong with it.", "Di qué le pasó."),
              },
            ],
            register: "polite",
          },
          rule: C(
            "Say what you need, give one detail from the receipt, and ask politely.",
            "Di qué necesitas, da un detalle del recibo y pide con cortesía.",
          ),
          frame: "Excuse me, I bought this ___ on ___. Its ___, so could you please help me?",
          model:
            "Excuse me, I bought this robot on May 3. Its arm broke on Sunday. Could you please help me?",
          keep: "What I told Mr. Rami",
        },
        {
          id: "mixup",
          type: "choose",
          npc: {
            who: "Mr. Rami",
            art: "char-dad",
            line: "Oh, you want to buy another robot? That will be eight dollars.",
          },
          prompt: "Mr. Rami did not understand you. What is the best way to fix it?",
          help: "El Sr. Rami entendió mal: cree que quieres comprar otro robot. Piensa qué respuesta arregla la confusión sin enojar a nadie.",
          options: [
            {
              id: "a",
              text: "Pay eight dollars for a new robot.",
              why: "Then you pay two times for one robot. Mr. Rami never hears what you really meant.",
            },
            {
              id: "b",
              text: "Say, “Sorry, I wasn't clear,” and explain again with the receipt.",
              ok: true,
              why: "Mr. Rami leans in to listen. Now he knows you will explain it a new way.",
            },
            {
              id: "c",
              text: "Shout, “No! You are not listening!”",
              why: "Shouting makes Mr. Rami feel attacked. He still will not know what you need.",
            },
            {
              id: "d",
              text: "Walk away with the broken robot.",
              why: "Walking away leaves the problem. Mr. Rami might think you changed your mind.",
            },
          ],
          rule: C(
            "To fix a mix-up, stay calm, say you were not clear, and explain again with a fact.",
            "Para arreglar una confusión, mantén la calma, di que no fuiste claro y explica otra vez con un dato.",
          ),
          explain:
            "When someone misunderstands, say it kindly, then explain again with the detail that proves it: the receipt.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["receipt"],
          npc: { who: "Mr. Rami", art: "char-dad", line: "Hmm? Did I get that wrong?" },
          prompt:
            "Fix the mix-up. Tell Mr. Rami you already bought the robot, and use the receipt.",
          help: "Arregla la confusión. Usa una frase como Sorry, I wasn't clear o I mean. Di que ya compraste el robot y di la fecha del recibo.",
          check: {
            min: 10,
            ideas: [
              {
                any: ["already", "bought", "paid", "receipt"],
                clue: C(
                  "Say that the robot is already yours: you paid for it.",
                  "Di que el robot ya es tuyo: ya lo pagaste.",
                ),
              },
              {
                any: ["may 3", "may 3rd", "may third", "saturday"],
                clue: C(
                  "Give the date from the receipt as proof.",
                  "Da la fecha del recibo como prueba.",
                ),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A repair says the mix-up out loud, then gives the right information again.",
            "Para arreglar una confusión, dila en voz alta y luego da otra vez la información correcta.",
          ),
          frame: "Sorry, I wasn't clear. I ___ this robot on ___. The receipt says ___.",
          model:
            "Sorry, I wasn't clear. I already bought this robot on May 3. The receipt says I can bring it back.",
          keep: "How I fixed the mix-up",
        },
        {
          id: "deal",
          type: "choose",
          npc: {
            who: "Mr. Rami",
            art: "char-dad",
            line: "Ah, now I see! Your receipt is good. I have no robots left today. I can give you a new robot next Saturday, or a coupon worth eight dollars to use at my stall any time.",
          },
          prompt: "What do you choose?",
          help: "Hay dos respuestas justas y una que no es justa. Elige una justa. Cada una cambia lo que pasa después.",
          options: [
            {
              id: "a",
              text: "I'll wait for a new robot next Saturday, please.",
              ok: true,
              sets: { toy: "swap" },
              why: "Mr. Rami writes your name on a pickup slip. Next Saturday you get a new robot.",
            },
            {
              id: "b",
              text: "May I have the eight-dollar coupon, please?",
              ok: true,
              sets: { toy: "coupon" },
              why: "Mr. Rami hands you an $8 coupon. You can save it and pick any toy later.",
            },
            {
              id: "c",
              text: "I want the coupon and a new robot, too.",
              why: "That is two things for one broken toy. Mr. Rami would feel it is not fair to him.",
            },
          ],
          rule: C(
            "A fair deal trades one thing for one thing, and you ask for it politely.",
            "Un trato justo cambia una cosa por una cosa, y lo pides con cortesía.",
          ),
          explain:
            "Both polite answers are fair: one broken robot can become one new robot or one $8 coupon.",
        },
      ],
    },
    {
      id: "cq35-coach",
      title: "Two Things on Thursday",
      art: ["bg-park", "char-teacher"],
      intro:
        "The after-school soccer team has a new schedule. You read it and see a problem: on Thursday you also have Reading Buddies at the library.",
      introBy: [
        {
          when: { toy: "swap" },
          text: "The pickup slip for your new robot is in your backpack. At the park, the after-school soccer team has a new schedule. You read it and see a problem: on Thursday you also have Reading Buddies at the library.",
        },
        {
          when: { toy: "coupon" },
          text: "The $8 coupon is safe in your backpack. At the park, the after-school soccer team has a new schedule. You read it and see a problem: on Thursday you also have Reading Buddies at the library.",
        },
      ],
      introEs:
        "El equipo de fútbol después de clases tiene un horario nuevo. Lo lees y ves un problema: el jueves también tienes Compañeros de Lectura en la biblioteca.",
      outro:
        "Coach Dana gives you a high five. Back in class, your teacher says it is time for partner projects, and your partner is Leo.",
      docs: [
        {
          id: "soccer",
          kind: "schedule",
          title: "After-school soccer: new schedule",
          cols: ["Day", "Time", "Where"],
          rows: [
            ["Tuesday", "3:30 to 4:30", "Park field"],
            ["Wednesday", "3:30 to 4:30", "Park field"],
            ["Thursday", "3:30 to 4:30", "Park field"],
          ],
        },
        {
          id: "library",
          kind: "note",
          title: "Note from the library",
          from: "Ms. Lee, librarian",
          lines: [
            "Reading Buddies meets every Thursday from 3:30 to 4:00.",
            "Please come on time. Your little buddy will wait for you!",
          ],
        },
        {
          id: "rules",
          kind: "note",
          title: "Team rules",
          from: "Coach Dana",
          lines: [
            "Come to two practices each week.",
            "If you cannot come, talk to Coach Dana before practice.",
          ],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: {
            who: "Coach Dana",
            art: "char-teacher",
            line: "Okay team, grab some water! Do you need something?",
          },
          prompt: "Coach Dana is busy with the whole team. How do you start?",
          help: "La entrenadora Dana es una adulta y está ocupada con todo el equipo. Elige la frase que pide permiso para hablar con respeto.",
          options: [
            {
              id: "a",
              text: "Coach Dana, could I talk to you about Thursday, please?",
              ok: true,
              why: "Coach Dana stops and listens. Asking first shows you respect her time.",
            },
            {
              id: "b",
              text: "Thursday practice won't work. Change it.",
              why: "It sounds like an order. Coach Dana plans for the whole team, so she may feel bossed around.",
            },
            {
              id: "c",
              text: "Uh, Thursday, nah.",
              why: "That is too short and too casual. Coach Dana will not know what you mean, and it may sound like you don't care.",
            },
          ],
          rule: C(
            "When an adult is busy, ask if you can talk first, and use please.",
            "Cuando un adulto está ocupado, pregunta primero si puedes hablar, y usa please.",
          ),
          explain:
            "Asking “could I talk to you” with please gives Coach Dana a polite way in, and it names the day you need to talk about.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["soccer", "library"],
          npc: { who: "Coach Dana", art: "char-teacher", line: "Sure. What about Thursday?" },
          prompt: "Tell Coach Dana the problem: what you have on Thursday, and at what time.",
          help: "Mira el horario de fútbol y la nota de la biblioteca. Di qué tienes el jueves y a qué hora empieza. Habla con cortesía.",
          check: {
            min: 9,
            ideas: [
              { any: ["thursday*"], clue: C("Name the day.", "Nombra el día.") },
              {
                any: ["reading buddies", "reading buddy", "reading", "library", "buddy"],
                clue: C(
                  "Say what else you have to do that day.",
                  "Di qué más tienes que hacer ese día.",
                ),
              },
              {
                any: ["3:30", "three thirty", "4:00", "four"],
                clue: C(
                  "Say the time. Look at the note from the library.",
                  "Di la hora. Mira la nota de la biblioteca.",
                ),
              },
            ],
            register: "polite",
          },
          rule: C(
            "To explain a problem, say what, when, and ask for help politely.",
            "Para explicar un problema, di qué, cuándo, y pide ayuda con cortesía.",
          ),
          frame: "Excuse me, Coach. On ___ I have ___ at ___. Could you please help me?",
          model:
            "Excuse me, Coach Dana. On Thursday I have Reading Buddies at the library at 3:30. Could you please help me?",
          keep: "What I told Coach Dana",
        },
        {
          id: "mixup",
          type: "choose",
          npc: {
            who: "Coach Dana",
            art: "char-teacher",
            line: "Oh no. So you want to quit the team?",
          },
          prompt: "Coach Dana misunderstood. What do you do?",
          help: "La entrenadora cree que quieres dejar el equipo. ¿Eso es lo que quieres? Elige la respuesta que arregla la confusión.",
          options: [
            {
              id: "a",
              text: "Say, “No, I didn't mean that,” and tell her you want to stay on the team.",
              ok: true,
              why: "Coach Dana looks relieved. Now she knows what you did not mean.",
            },
            {
              id: "b",
              text: "Say, “Fine, I quit.”",
              why: "You love soccer! Agreeing with a mix-up makes it real, and Coach Dana loses a player who wanted to stay.",
            },
            {
              id: "c",
              text: "Roll your eyes and say nothing.",
              why: "Rolling your eyes feels rude to Coach Dana, and she still thinks you want to quit.",
            },
            {
              id: "d",
              text: "Tell her she never listens.",
              why: "That blames her. She will feel hurt, and the mix-up is still not fixed.",
            },
          ],
          rule: C(
            "Say clearly what you did not mean, then say what you do want.",
            "Di claramente lo que no quisiste decir y luego di lo que sí quieres.",
          ),
          explain:
            "A quick “No, I didn't mean that” stops the mix-up, and saying you want to stay tells Coach Dana the real message.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["soccer", "library"],
          npc: { who: "Coach Dana", art: "char-teacher", line: "Wait, then what do you mean?" },
          prompt:
            "Fix the mix-up. Tell Coach Dana you want to stay and that the problem is only Thursday.",
          help: "Usa I mean o Sorry, I wasn't clear. Di que quieres seguir en el equipo y que el problema es solo el jueves.",
          check: {
            min: 10,
            ideas: [
              {
                any: [
                  "stay",
                  "keep playing",
                  "not quit",
                  "don't want to quit",
                  "do not want to quit",
                  "love soccer",
                  "like soccer",
                  "on the team",
                ],
                clue: C(
                  "Say that you want to stay on the team.",
                  "Di que quieres seguir en el equipo.",
                ),
              },
              {
                any: ["thursday*", "one day", "only"],
                clue: C("Say which day is the problem.", "Di qué día es el problema."),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A repair names the mix-up, then says the true message in new words.",
            "Para arreglar una confusión, nómbrala y luego di el mensaje verdadero con otras palabras.",
          ),
          frame: "Sorry, I wasn't clear. I want to ___. The problem is only ___.",
          model:
            "Sorry, I wasn't clear. I want to stay on the team. The problem is only Thursday at 3:30.",
          keep: "How I fixed the mix-up with Coach Dana",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["soccer", "rules"],
          npc: {
            who: "Coach Dana",
            art: "char-teacher",
            line: "Phew! I'm glad you're staying. You need two practices a week. You can come Tuesday and Wednesday, or come Thursday at 4:00, after Reading Buddies, and miss the warm-up.",
          },
          prompt: "What do you choose?",
          help: "Lee las reglas del equipo: hay que ir a dos prácticas cada semana. Dos respuestas cumplen la regla. Elige una.",
          options: [
            {
              id: "a",
              text: "I'll come on Tuesday and Wednesday, please.",
              ok: true,
              sets: { soccer: "wednesday" },
              why: "Coach Dana writes you down for Wednesday. Thursday is now free for your reading buddy.",
            },
            {
              id: "b",
              text: "Can I come on Thursday at 4:00, after Reading Buddies?",
              ok: true,
              sets: { soccer: "late" },
              why: "Coach Dana says yes. On Thursdays you will walk fast from the library to the field and miss the warm-up.",
            },
            {
              id: "c",
              text: "Can I skip Wednesday and Thursday and just come on Tuesday?",
              why: "The team rule says two practices a week. Coach Dana would feel it is not fair to the rest of the team.",
            },
          ],
          rule: C(
            "A fair plan follows the team rules and works for both of you.",
            "Un plan justo sigue las reglas del equipo y funciona para las dos personas.",
          ),
          explain:
            "Both plans keep two practices a week, so they follow the team rule and still leave time for Reading Buddies.",
        },
      ],
    },
    {
      id: "cq35-poster",
      title: "The Frog Poster",
      art: ["bg-classroom", "char-leo"],
      intro:
        "Ms. Park gives partner projects. You and Leo must make a poster about frogs. There is one problem: you both want to draw the frog, and nobody wants to write.",
      introBy: [
        {
          when: { soccer: "wednesday" },
          text: "Ms. Park gives partner projects. You and Leo must make a poster about frogs. You cannot work on Wednesday after school anymore, because that is your soccer day now, so you plan to work at lunch. There is one problem: you both want to draw the frog, and nobody wants to write.",
        },
        {
          when: { soccer: "late" },
          text: "Ms. Park gives partner projects. You and Leo must make a poster about frogs. On Thursday you have Reading Buddies and then soccer, so you plan to work at lunch. There is one problem: you both want to draw the frog, and nobody wants to write.",
        },
      ],
      introEs:
        "La Sra. Park da proyectos en parejas. Tú y Leo tienen que hacer un cartel sobre las ranas. Hay un problema: los dos quieren dibujar la rana y nadie quiere escribir.",
      outro:
        "The poster is coming along. But after school, you reach for your green backpack, and it is not there! You think you left it at the library.",
      docs: [
        {
          id: "checklist",
          kind: "note",
          title: "Poster checklist",
          from: "Ms. Park, teacher",
          lines: [
            "Your poster needs a title, one big picture, and three frog facts.",
            "Both partners must do part of the work.",
            "Due: Friday.",
          ],
        },
        {
          id: "leo",
          kind: "note",
          title: "Message from Leo",
          from: "Leo",
          lines: ["I'm drawing the frog. I'm the best at drawing!", "You can do the other parts."],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          docs: ["leo"],
          npc: {
            who: "Leo",
            art: "char-leo",
            line: "I already started the frog drawing. It's going to look so cool.",
          },
          prompt: "Leo is your friend. You feel upset. How do you start?",
          help: "Leo es tu amigo, así que puedes hablar de forma más relajada, pero con amabilidad. Piensa cómo se sentiría Leo con cada frase.",
          options: [
            {
              id: "a",
              text: "Leo, can we talk about who does each part?",
              ok: true,
              why: "Leo puts down his pencil. A kind question invites him to talk, not to fight.",
            },
            {
              id: "b",
              text: "You always take the fun part. That's so unfair.",
              why: "“You always” sounds like blame. Leo may feel attacked and stop listening.",
            },
            {
              id: "c",
              text: "Whatever. Do it all yourself.",
              why: "“Whatever” sounds like you don't care. Leo may get upset, and the checklist says both partners must work.",
            },
          ],
          rule: C(
            "With a friend you can be casual, but be kind: ask a question instead of blaming.",
            "Con un amigo puedes hablar relajado, pero sé amable: haz una pregunta en vez de culpar.",
          ),
          explain:
            "A question about who does each part is friendly and fair, and it opens the talk without blaming Leo.",
        },
        {
          id: "say-need",
          type: "write",
          say: true,
          use: "Argue",
          docs: ["checklist", "leo"],
          npc: { who: "Leo", art: "char-leo", line: "Okay. What's up?" },
          prompt: "Tell Leo what you would like to do and why it is fair. Use the checklist.",
          help: "Di qué te gustaría hacer en el cartel y por qué es justo. La lista de la maestra dice algo sobre los dos compañeros. Habla con amabilidad.",
          check: {
            min: 10,
            ideas: [
              {
                any: ["draw*", "picture", "frog"],
                clue: C("Say what you would like to do.", "Di qué te gustaría hacer."),
              },
              {
                any: ["fair", "both", "share", "together", "each", "turn", "too"],
                clue: C(
                  "Say why it is fair. Look at the checklist.",
                  "Di por qué es justo. Mira la lista.",
                ),
              },
            ],
            register: "kind",
          },
          rule: C(
            "Say what you want and give a reason, kindly, so your friend wants to agree.",
            "Di lo que quieres y da una razón, con amabilidad, para que tu amigo quiera estar de acuerdo.",
          ),
          frame: "Leo, I would like to ___ too. The checklist says ___, so let's ___.",
          model:
            "Leo, I would like to draw too. The checklist says both partners must do part of the work, so let's share.",
          keep: "What I told Leo",
        },
        {
          id: "mixup",
          type: "choose",
          npc: { who: "Leo", art: "char-leo", line: "Wait, you think my drawing is bad?" },
          prompt: "Leo misunderstood you. What do you do?",
          help: "Leo cree que dijiste que su dibujo es malo. ¿Eso dijiste? Elige la respuesta que arregla la confusión y cuida a tu amigo.",
          options: [
            {
              id: "a",
              text: "Say, “No, I mean your drawing is good. I just want a turn too.”",
              ok: true,
              why: "Leo smiles again. He hears that you like his drawing.",
            },
            {
              id: "b",
              text: "Say, “Yes, it's kind of bad.”",
              why: "That hurts Leo's feelings, and it is not even what you meant.",
            },
            {
              id: "c",
              text: "Take his pencil.",
              why: "Taking his pencil feels mean. Leo will not want to work with you.",
            },
            {
              id: "d",
              text: "Tell Ms. Park that Leo is being mean.",
              why: "Leo was confused, not mean. Telling on him first skips the talk and makes him feel blamed.",
            },
          ],
          rule: C(
            "When a friend feels hurt by a mix-up, say what you did not mean and say something kind.",
            "Cuando un amigo se siente herido por una confusión, di lo que no quisiste decir y di algo amable.",
          ),
          explain:
            "“No, I mean” fixes the mix-up, the kind words about his drawing help Leo feel okay, and you still ask for a turn.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Argue",
          docs: ["checklist"],
          npc: { who: "Leo", art: "char-leo", line: "Then what did you mean?" },
          prompt: "Fix the mix-up. Tell Leo what you really meant.",
          help: "Usa I mean o What I meant is. Di algo amable sobre su dibujo y di que tú también quieres una parte del trabajo.",
          check: {
            min: 12,
            ideas: [
              {
                any: ["good", "nice", "great", "like your", "cool", "love your"],
                clue: C(
                  "Say something kind about Leo's drawing.",
                  "Di algo amable sobre el dibujo de Leo.",
                ),
              },
              {
                any: ["turn", "too", "share", "both", "help", "part"],
                clue: C(
                  "Say what you really want: a part of the work.",
                  "Di lo que de verdad quieres: una parte del trabajo.",
                ),
              },
            ],
            register: "kind",
            clarify: true,
          },
          rule: C(
            "A repair with a friend says the mix-up, says something kind, and says the real message.",
            "Para arreglar una confusión con un amigo, nómbrala, di algo amable y di el mensaje verdadero.",
          ),
          frame: "No, I mean your drawing is ___. I just want ___, so we both ___.",
          model:
            "No, I mean your drawing is really good. I just want a turn to draw too, so we both get a part.",
          keep: "How I fixed the mix-up with Leo",
        },
        {
          id: "deal",
          type: "choose",
          docs: ["checklist"],
          npc: { who: "Leo", art: "char-leo", line: "Oh! Okay. So how do we make it fair?" },
          prompt: "Which plan do you suggest?",
          help: "Mira la lista: título, un dibujo grande y tres datos. Dos planes son justos para los dos. Uno no es justo. Elige un plan justo.",
          options: [
            {
              id: "a",
              text: "You draw the frog, and I write the three facts and the title.",
              ok: true,
              sets: { poster: "split" },
              why: "Leo grins. Each of you does a different job, and every part of the checklist is covered.",
            },
            {
              id: "b",
              text: "Let's each draw half: you draw the frog, and I draw the pond. Then we write the facts together.",
              ok: true,
              sets: { poster: "share" },
              why: "Leo likes it. You both draw and you both write, but it will take a little longer.",
            },
            {
              id: "c",
              text: "I draw the frog and make the title, and you do everything else.",
              why: "That gives you the fun parts and leaves Leo the rest. Leo would feel it is not fair.",
            },
          ],
          rule: C(
            "A fair plan gives each partner a real part of the work.",
            "Un plan justo le da a cada compañero una parte real del trabajo.",
          ),
          explain:
            "Both fair plans split the checklist so each partner does real work: one splits the jobs, the other shares them.",
        },
      ],
    },
    {
      id: "cq35-backpack",
      title: "The Missing Backpack",
      art: ["bg-city", "char-mom"],
      intro:
        "Your green backpack is missing! You were at the library for Reading Buddies on Thursday, and you sat on the reading rug. You go to the front desk to talk to Ms. Lee, the librarian.",
      introBy: [
        {
          when: { soccer: "wednesday" },
          text: "Your green backpack is missing! On Thursday you had Reading Buddies on the reading rug, and then you walked home with no soccer that day. Your backpack must still be at the library. You go to the front desk to talk to Ms. Lee, the librarian.",
        },
        {
          when: { soccer: "late" },
          text: "Your green backpack is missing! On Thursday you had Reading Buddies on the reading rug, and then you left fast to get to soccer at 4:00. Your backpack must still be at the library. You go to the front desk to talk to Ms. Lee, the librarian.",
        },
      ],
      introEs:
        "¡Tu mochila verde no aparece! El jueves estuviste en la biblioteca con Compañeros de Lectura y te sentaste en la alfombra de lectura. Vas al mostrador a hablar con la Sra. Lee, la bibliotecaria.",
      outro:
        "You hug your green backpack. What a week! You fixed every mix-up with calm, clear words.",
      outroBy: [
        {
          when: { poster: "split" },
          text: "You hug your green backpack. That night you write the three frog facts for the poster, and Leo sends a picture of his frog. What a week! You fixed every mix-up with calm, clear words.",
        },
        {
          when: { poster: "share" },
          text: "You hug your green backpack. That night you draw the pond for the poster, and Leo draws the frog. What a week! You fixed every mix-up with calm, clear words.",
        },
      ],
      docs: [
        {
          id: "form",
          kind: "record",
          title: "Library lost-and-found form",
          rows: [
            ["Name", "Write your name."],
            ["What is lost?", "Color, and one thing inside."],
            ["Where did you leave it?", "Look at the library map."],
            ["When?", "Day and time."],
          ],
        },
        {
          id: "map",
          kind: "map",
          title: "Library, first floor",
          places: [
            { name: "Front desk", x: 4, y: 1 },
            { name: "Lost-and-found box", x: 7, y: 1 },
            { name: "Picture books", x: 1, y: 3 },
            { name: "Reading rug", x: 2, y: 5 },
            { name: "Computers", x: 6, y: 4 },
          ],
          paths: [
            [0, 1],
            [0, 2],
            [2, 3],
            [0, 4],
          ],
          notes: [
            "Reading Buddies meets on the reading rug, next to the picture books.",
            "The lost-and-found box is behind the front desk.",
          ],
        },
        {
          id: "bag-robot",
          kind: "note",
          title: "What is in my backpack",
          from: "Me",
          lines: ["My library book", "A lunch box", "Mr. Rami's pickup slip for my new robot"],
        },
        {
          id: "bag-coupon",
          kind: "note",
          title: "What is in my backpack",
          from: "Me",
          lines: ["My library book", "A lunch box", "The $8 coupon from Mr. Rami"],
        },
      ],
      steps: [
        {
          id: "open",
          type: "choose",
          npc: {
            who: "Ms. Lee",
            art: "char-mom",
            line: "Hello there! How can I help you today?",
          },
          prompt: "How do you start talking to Ms. Lee?",
          help: "La Sra. Lee es una adulta que trabaja en la biblioteca. Elige la frase que es amable, clara y no culpa a nadie.",
          options: [
            {
              id: "a",
              text: "Hi, Ms. Lee. Excuse me, I think I left my backpack here. Can you help me, please?",
              ok: true,
              why: "Ms. Lee smiles and gets the lost-and-found form. She knows what you need.",
            },
            {
              id: "b",
              text: "Where's my bag? Somebody took it.",
              why: "That blames people with no proof. Ms. Lee may feel her library is being blamed.",
            },
            {
              id: "c",
              text: "Bag. Gone. Help.",
              why: "Ms. Lee can tell you need help, but these words sound bossy, and they do not tell her enough.",
            },
          ],
          rule: C(
            "Greet the adult, say what happened without blaming anyone, and ask politely.",
            "Saluda al adulto, di qué pasó sin culpar a nadie y pide con cortesía.",
          ),
          explain:
            "This line greets Ms. Lee, says what happened without blaming anyone, and asks for help with please.",
        },
        {
          id: "say-robot",
          type: "write",
          say: true,
          use: "Explain",
          when: { toy: "swap" },
          docs: ["form", "map", "bag-robot"],
          npc: {
            who: "Ms. Lee",
            art: "char-mom",
            line: "Let's fill out the form. What does it look like?",
          },
          prompt:
            "Describe your backpack for Ms. Lee: the color, where you left it, and one thing inside.",
          help: "Mira el formulario, el mapa y tu lista. Di el color de la mochila, dónde te sentaste y una cosa que tiene adentro. Usa please o excuse me.",
          check: {
            min: 12,
            ideas: [
              { any: ["green"], clue: C("Say the color.", "Di el color.") },
              {
                any: ["reading rug", "rug", "picture books"],
                clue: C(
                  "Say where you sat. Look at the map.",
                  "Di dónde te sentaste. Mira el mapa.",
                ),
              },
              {
                any: ["robot", "slip", "pickup", "library book", "lunch box", "lunchbox", "book"],
                clue: C(
                  "Name one thing inside. Look at your list.",
                  "Nombra una cosa que hay adentro. Mira tu lista.",
                ),
              },
            ],
            register: "polite",
          },
          rule: C(
            "A good description gives details only your thing has: color, place, and what is inside.",
            "Una buena descripción da detalles que solo tiene tu cosa: color, lugar y qué hay adentro.",
          ),
          frame: "Excuse me, my backpack is ___. I left it by the ___. Inside there is ___.",
          model:
            "Excuse me, my backpack is green. I left it by the reading rug. Inside there is a slip for my new robot.",
          keep: "How I described my backpack",
        },
        {
          id: "say-coupon",
          type: "write",
          say: true,
          use: "Explain",
          when: { toy: "coupon" },
          docs: ["form", "map", "bag-coupon"],
          npc: {
            who: "Ms. Lee",
            art: "char-mom",
            line: "Let's fill out the form. What does it look like?",
          },
          prompt:
            "Describe your backpack for Ms. Lee: the color, where you left it, and one thing inside.",
          help: "Mira el formulario, el mapa y tu lista. Di el color de la mochila, dónde te sentaste y una cosa que tiene adentro. Usa please o excuse me.",
          check: {
            min: 12,
            ideas: [
              { any: ["green"], clue: C("Say the color.", "Di el color.") },
              {
                any: ["reading rug", "rug", "picture books"],
                clue: C(
                  "Say where you sat. Look at the map.",
                  "Di dónde te sentaste. Mira el mapa.",
                ),
              },
              {
                any: [
                  "coupon",
                  "$8",
                  "8 dollars",
                  "eight dollars",
                  "library book",
                  "lunch box",
                  "lunchbox",
                  "book",
                ],
                clue: C(
                  "Name one thing inside. Look at your list.",
                  "Nombra una cosa que hay adentro. Mira tu lista.",
                ),
              },
            ],
            register: "polite",
          },
          rule: C(
            "A good description gives details only your thing has: color, place, and what is inside.",
            "Una buena descripción da detalles que solo tiene tu cosa: color, lugar y qué hay adentro.",
          ),
          frame: "Excuse me, my backpack is ___. I left it by the ___. Inside there is ___.",
          model:
            "Excuse me, my backpack is green. I left it by the reading rug. Inside there is an $8 coupon from Mr. Rami.",
          keep: "How I described my backpack",
        },
        {
          id: "mixup",
          type: "choose",
          docs: ["map"],
          npc: {
            who: "Ms. Lee",
            art: "char-mom",
            line: "A green backpack by the computers? Let me look. Hmm, there is nothing by the computers.",
          },
          prompt: "Ms. Lee looked in the wrong place. What do you do?",
          help: "La Sra. Lee buscó en las computadoras, pero tú te sentaste en otro lugar. Elige la respuesta que arregla la confusión con calma.",
          options: [
            {
              id: "a",
              text: "Say, “Just to check: I said the reading rug, not the computers.”",
              ok: true,
              why: "Ms. Lee says, “Oh! The rug!” and turns around to look there.",
            },
            {
              id: "b",
              text: "Say, “You never listen!”",
              why: "That makes Ms. Lee feel blamed, and she is trying to help you.",
            },
            {
              id: "c",
              text: "Say, “Okay, it's gone,” and go home.",
              why: "Giving up means nobody looks in the right place, and your backpack stays lost.",
            },
            {
              id: "d",
              text: "Point at the computers and nod.",
              why: "Nodding tells Ms. Lee she is right, so she will keep looking in the wrong place.",
            },
          ],
          rule: C(
            "To fix a mix-up, check what the person heard, then say the right detail again.",
            "Para arreglar una confusión, revisa qué escuchó la persona y di otra vez el detalle correcto.",
          ),
          explain:
            "“Just to check” is a kind way to fix it, and it says the right place again so Ms. Lee can look there.",
        },
        {
          id: "repair",
          type: "write",
          say: true,
          use: "Explain",
          docs: ["map"],
          npc: { who: "Ms. Lee", art: "char-mom", line: "Oh dear. Where did you sit, then?" },
          prompt:
            "Fix the mix-up. Tell Ms. Lee where you really sat, and use the map to help her find it.",
          help: "Usa I mean o Just to check. Di dónde te sentaste de verdad y usa el mapa: ¿qué hay al lado de ese lugar?",
          check: {
            min: 14,
            ideas: [
              {
                any: ["reading rug", "rug"],
                clue: C("Say where you really sat.", "Di dónde te sentaste de verdad."),
              },
              {
                any: [
                  "picture books",
                  "not the computers",
                  "not by the computers",
                  "not at the computers",
                  "not near the computers",
                ],
                clue: C(
                  "Help her find it: what is next to that place on the map?",
                  "Ayúdala a encontrarla: ¿qué hay al lado de ese lugar en el mapa?",
                ),
              },
            ],
            register: "polite",
            clarify: true,
          },
          rule: C(
            "A repair says the mix-up, gives the right detail, and adds one more clue from the map.",
            "Para arreglar una confusión, nómbrala, da el detalle correcto y agrega otra pista del mapa.",
          ),
          frame: "Sorry, I wasn't clear. I mean the ___, not the ___. The map shows ___.",
          model:
            "Sorry, I wasn't clear. I mean the reading rug, not the computers. The map shows the rug is next to the picture books.",
          keep: "How I helped Ms. Lee find it",
        },
        {
          id: "thanks",
          type: "choose",
          npc: {
            who: "Ms. Lee",
            art: "char-mom",
            line: "Here it is! A little girl named Ana found it on the rug and gave it to me. She is in Reading Buddies too.",
          },
          prompt: "Ana helped you. What do you do?",
          help: "Ana encontró tu mochila. Dos respuestas son amables con Ana. Una no lo es. Elige una amable.",
          options: [
            {
              id: "a",
              text: "Write Ana a thank-you note and ask Ms. Lee to give it to her.",
              ok: true,
              sets: { thanks: "note" },
              why: "Ms. Lee puts your note in Ana's book. Ana will smile when she reads it tomorrow.",
            },
            {
              id: "b",
              text: "Thank Ms. Lee, and say thank you to Ana at Reading Buddies next week.",
              ok: true,
              sets: { thanks: "say" },
              why: "Ms. Lee says Ana will be happy. Next Thursday you will thank Ana face to face.",
            },
            {
              id: "c",
              text: "Take the backpack and leave. It was your bag anyway.",
              why: "Ana and Ms. Lee both helped you. Leaving without a word would make them feel their help did not matter.",
            },
          ],
          rule: C(
            "When someone helps you, thank them in a way they will hear.",
            "Cuando alguien te ayuda, dale las gracias de una forma que le llegue.",
          ),
          explain:
            "A note or a face-to-face thank you both show Ana and Ms. Lee that their help mattered.",
        },
      ],
    },
  ],
};
