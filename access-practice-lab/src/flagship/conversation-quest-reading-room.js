// Conversation Quest, encounter 5 in both bands: a reading-room negotiation (content only; schema: engine.js).
// 3-5: two classmates both want the library's reading corner. 6-8: a student club bargains with a branch manager.
// The choice of compromise sets a story flag, and the last step is the one that matches the plan the learner chose.
// The library, its calendars and its people are invented for practice.
const C = (en, es) => [en, es];

export const READING_ROOM_35 = {
  id: "cq35-readingroom",
  title: "The Reading Corner Plan",
  art: ["bg-classroom", "char-leo"],
  intro:
    "Ms. Ruiz keeps a sign-up sheet for the Reading Corner at the Maple Street Library. The corner holds one group at a time. On Friday your class acts in a play, and you want to practice your lines there on Thursday at 3:30. Then you see Leo at the sheet with a pencil in his hand. (The library and the sheet are made up for practice.)",
  introEs:
    "La Sra. Ruiz tiene una hoja de inscripción para el Rincón de Lectura de la biblioteca de la calle Maple. El rincón recibe un solo grupo a la vez. El viernes tu clase presenta una obra, y quieres practicar tus líneas allí el jueves a las 3:30. Entonces ves a Leo junto a la hoja con un lápiz en la mano. (La biblioteca y la hoja están inventadas para practicar.)",
  outro:
    "Ms. Ruiz writes both names on the sheet and smiles. “Thank you for working it out yourselves,” she says. Leo gives you a thumbs up. You both have a plan, and nobody had to give up everything.",
  docs: [
    {
      id: "sheet",
      kind: "schedule",
      title: "Reading Corner sign-up sheet",
      cols: ["Day", "3:30 to 4:00", "4:00 to 4:30"],
      rows: [
        ["Monday", "Open", "Open"],
        ["Tuesday", "Chess Club", "Chess Club"],
        ["Wednesday", "Open", "Story time"],
        ["Thursday", "Open", "Open"],
        ["Friday", "Open", "Open"],
      ],
    },
    {
      id: "rules",
      kind: "note",
      title: "Reading Corner rules",
      from: "Ms. Ruiz, librarian",
      lines: [
        "One group at a time in the corner.",
        "Quiet readers and read-aloud groups cannot share the corner at the same time.",
        "Each group may sign up for one half-hour slot.",
      ],
    },
    {
      id: "mine",
      kind: "note",
      title: "My reminder",
      from: "Me",
      lines: [
        "Friday: class play. I need to practice my lines out loud.",
        "My ride comes to the front door at 4:15.",
      ],
    },
  ],
  steps: [
    {
      id: "open",
      type: "choose",
      docs: ["sheet"],
      npc: {
        who: "Leo",
        art: "char-leo",
        line: "Oh, hi! I was just going to sign up for Thursday at 3:30.",
      },
      prompt: "Choose your first line to Leo. You both want the same time.",
      help: "Leo es un compañero, no un adulto, pero los dos quieren la misma hora. Piensa qué frase le dice con claridad lo que quieres sin que se enoje.",
      options: [
{
          id: "a",
          text: "No way. I'm signing up for Thursday at 3:30, so you can't have it.",
          why: "This sounds like a fight before you even start. Leo may stop listening or want to win.",
        },
{
          id: "b",
          text: "Hi, Leo! I want Thursday at 3:30 too. Can we talk about how to share it?",
          ok: true,
          why: "Leo puts down his pencil. You told him what you want and asked to solve it together.",
        },
{
          id: "c",
          text: "Whatever. You can have it, I guess.",
          why: "You give up without saying what you need. Leo will never know about your play.",
        },
],
      rule: C(
        "With a classmate, be friendly, say what you want, and ask to solve it together.",
        "Con un compañero, sé amable, di lo que quieres y pide resolverlo juntos.",
      ),
      explain:
        "A friendly line that says what you want and asks to share keeps the talk open for both of you.",
    },
    {
      id: "say-need",
      type: "write",
      say: true,
      use: "Explain",
      docs: ["sheet", "mine"],
      npc: {
        who: "Leo",
        art: "char-leo",
        line: "Sure, we can talk. Why do you need Thursday at 3:30?",
      },
      prompt:
        "Tell Leo what you need the Reading Corner for and why that time works for you. Include that you need 30 minutes to read quietly. Use your reminder.",
      help: "Cuéntale a Leo qué vas a hacer en el rincón y por qué necesitas ese día. Usa tu recordatorio: el viernes es la obra. Usa because.",
      check: {
        min: 10,
        ideas: [
          {
            any: ["play", "lines", "practice*", "rehears*"],
            clue: C("Say what you will do in the corner.", "Di qué vas a hacer en el rincón."),
          },
          {
            any: ["thursday", "3:30", "friday"],
            clue: C("Say the day or the time you need.", "Di el día o la hora que necesitas."),
          },
        ],
        connector: ["cause"],
        register: "kind",
      },
      rule: C(
        "Say what you need, then give your reason.",
        "Di lo que necesitas y luego da tu razón.",
      ),
      frame: "I need the Reading Corner on ___ because ___.",
      model:
        "I need the Reading Corner on Thursday at 3:30 because I want to practice my lines for the play on Friday. I also need 30 minutes of quiet reading.",
      keep: "What I told Leo",
    },
    {
      id: "mixup",
      type: "choose",
      docs: ["rules", "mine"],
      npc: {
        who: "Leo",
        art: "char-leo",
        line: "Oh, you need to practice your play lines out loud? I usually read quietly there. Can we figure out a plan?",
      },
      prompt:
        "Leo misunderstood: you will say your lines out loud, not read quietly. What is the best way to fix it?",
      help: "Leo cree que vas a leer en silencio. Lee las reglas del rincón: ¿pueden compartir los lectores callados y los que leen en voz alta? Piensa cómo corregir sin enojar a Leo.",
      options: [
{
          id: "a",
          text: "Say yes, then practice out loud anyway.",
          why: "Leo would be surprised and upset. The rules also say quiet readers and read-aloud groups cannot share the corner.",
        },
{
          id: "b",
          text: "Say nothing and sign the sheet.",
          why: "The mix-up is still there. Leo may think you agreed to share, and then be upset on Thursday.",
        },
{
          id: "c",
          text: "Kindly say you meant reading out loud, and tell him what that means for his quiet reading.",
          ok: true,
          why: "Leo nods. Now he understands the real problem, and you did it without blaming him.",
        },
],
      rule: C(
        "To fix a mix-up, kindly say what you really meant and what it changes.",
        "Para arreglar un malentendido, di con amabilidad lo que de verdad querías decir y qué cambia.",
      ),
      explain:
        "Saying what you really meant and why it matters fixes the mix-up and lets you both decide with the true facts.",
    },
    {
      id: "repair",
      type: "write",
      say: true,
      use: "Explain",
      docs: ["rules", "mine"],
      npc: { who: "Leo", art: "char-leo", line: "Wait, did I hear that wrong?" },
      prompt: "Fix the mix-up. Say what you really meant and what it means for Leo.",
      help: "Usa una frase para aclarar (Sorry, I wasn't clear / What I meant was). Di qué vas a hacer de verdad y por qué eso importa para la lectura silenciosa de Leo.",
      check: {
        min: 10,
        ideas: [
          {
            any: ["out loud", "aloud", "lines", "practice*", "play"],
            clue: C(
              "Say what you really will do in the corner.",
              "Di qué vas a hacer de verdad en el rincón.",
            ),
          },
          {
            any: ["quiet*", "loud*", "noise", "noisy", "talk*"],
            clue: C(
              "Say why that matters for Leo's quiet reading.",
              "Di por qué eso importa para la lectura silenciosa de Leo.",
            ),
          },
        ],
        clarify: true,
        register: "kind",
      },
      rule: C(
        "A good repair names the mix-up, says the true thing, and tells what it changes.",
        "Una buena reparación nombra el malentendido, dice lo verdadero y cuenta qué cambia.",
      ),
      frame: "Sorry, I wasn't clear. I meant ___, so it might be ___ for you.",
      model:
        "Sorry, I wasn't clear. I meant I will practice my lines out loud, so it might be too loud for your quiet reading.",
      keep: "How I fixed the mix-up",
    },
    {
      id: "deal",
      type: "choose",
      docs: ["sheet", "rules"],
      npc: {
        who: "Leo",
        art: "char-leo",
        line: "Ohh, I get it now. We can't both use the corner on Thursday at 3:30. What should we do?",
      },
      prompt: "Which plan do you suggest to Leo?",
      help: "Mira la hoja y las reglas. Dos planes son justos para los dos, cada uno de manera distinta. Un plan deja a Leo sin nada.",
      options: [
{
          id: "a",
          text: "I asked about it first, so Thursday at 3:30 is mine every week.",
          why: "Taking it every week leaves Leo with nothing. Would he agree to that?",
        },
{
          id: "b",
          text: "Let's take turns. I take Thursday at 3:30 this week, and Leo takes it next week.",
          ok: true,
          sets: { readingPlan: "turns" },
          why: "Leo smiles. Each of you gets the time you want, one week at a time.",
        },
{
          id: "c",
          text: "Let's split the days. I take Thursday at 3:30, and Leo takes Friday at 3:30.",
          ok: true,
          sets: { readingPlan: "days" },
          why: "Leo checks the sheet. Friday at 3:30 is open, so each of you gets your own day.",
        },
],
      rule: C(
        "A fair plan gives each person something they need.",
        "Un plan justo le da a cada persona algo que necesita.",
      ),
      explain:
        "Taking turns and splitting the days are both fair, because each of you gets time in the corner.",
    },
    {
      id: "propose-turns",
      type: "write",
      when: { readingPlan: "turns" },
      say: true,
      use: "Explain",
      docs: ["sheet", "rules"],
      npc: {
        who: "Ms. Ruiz, librarian",
        art: "char-teacher",
        line: "Hello, you two! I hear you have a plan for the Reading Corner. Tell me about it.",
      },
      prompt:
        "Tell Ms. Ruiz your plan with Leo: who gets Thursday at 3:30, and when the other person gets it. Ask politely.",
      help: "Cuéntale a la Sra. Ruiz el plan: quién usa el jueves a las 3:30 esta semana y quién lo usa la próxima. Pide con cortesía con please o could we.",
      check: {
        min: 14,
        ideas: [
          {
            any: ["turn*", "this week", "next week"],
            clue: C("Say that you will take turns.", "Di que se turnarán."),
          },
          {
            any: ["thursday", "3:30"],
            clue: C("Name the day and time.", "Nombra el día y la hora."),
          },
        ],
        register: "polite",
      },
      rule: C(
        "A clear plan says who, which time, and when. Ask politely.",
        "Un plan claro dice quién, qué hora y cuándo. Pide con cortesía.",
      ),
      frame:
        "Excuse me, Ms. Ruiz. We will take turns: ___ this week and ___ next week. Could we please write that down?",
      model:
        "Excuse me, Ms. Ruiz. We will take turns: I have Thursday at 3:30 this week, and Leo has it next week. Could we please write that on the sheet?",
      keep: "Our plan for the Reading Corner",
    },
    {
      id: "propose-days",
      type: "write",
      when: { readingPlan: "days" },
      say: true,
      use: "Explain",
      docs: ["sheet", "rules"],
      npc: {
        who: "Ms. Ruiz, librarian",
        art: "char-teacher",
        line: "Hello, you two! I hear you have a plan for the Reading Corner. Tell me about it.",
      },
      prompt:
        "Tell Ms. Ruiz your plan with Leo: which day and time each of you takes. Ask politely.",
      help: "Cuéntale a la Sra. Ruiz el plan: qué día y hora toma cada uno. Mira la hoja para estar seguro de que están abiertos. Pide con cortesía con please o could we.",
      check: {
        min: 14,
        ideas: [
          {
            any: ["thursday"],
            clue: C("Name the first day.", "Nombra el primer día."),
          },
          {
            any: ["friday"],
            clue: C("Name the second day.", "Nombra el segundo día."),
          },
        ],
        register: "polite",
      },
      rule: C(
        "A clear plan says who gets which day and time. Ask politely.",
        "Un plan claro dice quién usa qué día y hora. Pide con cortesía.",
      ),
      frame:
        "Excuse me, Ms. Ruiz. Leo will take ___ and I will take ___. Could we please write that down?",
      model:
        "Excuse me, Ms. Ruiz. Leo will take Thursday at 3:30 and I will take Friday at 3:30. Could we please write that on the sheet?",
      keep: "Our plan for the Reading Corner",
    },
  ],
};

export const READING_ROOM_68 = {
  id: "cq68-readingroom",
  title: "The Study Room Hours",
  art: ["bg-classroom", "char-dad"],
  intro:
    "Your book club has ten members and a problem: no steady place to meet. The Eastbrook Library has a Quiet Study Room, but the Thursday calendar is crowded. You booked a meeting with the branch manager, Mr. Alvarez, with your club note in hand. (The library, its calendar and its rules are invented for practice.)",
  introEs:
    "Tu club de lectura tiene diez miembros y un problema: no tiene un lugar fijo para reunirse. La Biblioteca de Eastbrook tiene una Sala de Estudio Silenciosa, pero el calendario del jueves está lleno. Pediste una cita con el gerente de la sucursal, el Sr. Alvarez, con la nota de tu club en la mano. (La biblioteca, su calendario y sus reglas están inventados para practicar.)",
  outro:
    "Mr. Alvarez writes the booking on the calendar and slides you a card with the branch email. “If your plans change,” he says, “tell me at least two days ahead.” Your club has a room, and you earned it with clear, polite words.",
  docs: [
    {
      id: "calendar",
      kind: "schedule",
      title: "Thursday room calendar",
      cols: ["Room", "4:00 to 5:00", "5:00 to 6:00"],
      rows: [
        ["Quiet Study Room (holds 12)", "Tutoring group", "Open"],
        ["Meeting Room B (holds 20)", "Open", "Open until 5:30"],
      ],
    },
    {
      id: "policy",
      kind: "record",
      title: "Room booking policy",
      rows: [
        ["Quiet Study Room", "Quiet voices only. Student clubs may book up to 60 minutes."],
        [
          "Meeting Room B",
          "Talking allowed. Next to the Children's Room, where story hour runs 4:30 to 5:15.",
        ],
        [
          "Longer bookings",
          "The branch manager can approve a student club for more than 60 minutes.",
        ],
        ["Changes", "Tell the branch manager at least two days ahead."],
      ],
    },
    {
      id: "club",
      kind: "note",
      title: "Book club needs",
      from: "Club president",
      lines: [
        "Ten members.",
        "Our meeting plan is 30 minutes of quiet reading, then 45 minutes of discussion, then 15 minutes to plan next week.",
        "We need quiet for the reading part only.",
      ],
    },
  ],
  steps: [
    {
      id: "open",
      type: "choose",
      docs: ["calendar"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Good afternoon. I have a few minutes. How can I help you?",
      },
      prompt: "Choose your opening. Mr. Alvarez is an adult you have only met once.",
      help: "El Sr. Alvarez es un adulto al que conoces poco y tiene poco tiempo. Piensa qué frase lo saluda, dice claramente qué quieres y suena respetuosa.",
      options: [
{
          id: "a",
          text: "Hey, so, like, we kind of need a room or something.",
          why: "This is too casual for a meeting with the manager, and it does not say which room, which day or why.",
        },
{
          id: "b",
          text: "Good afternoon, Mr. Alvarez. I'd like to ask about booking a room for our student book club on Thursdays, please.",
          ok: true,
          why: "Mr. Alvarez opens his notebook. A greeting, a clear request and please make it easy for him to help.",
        },
{
          id: "c",
          text: "You gave the Quiet Study Room to the tutors, and that's totally unfair.",
          why: "Starting with blame puts Mr. Alvarez on the defensive. He has not even heard what your club needs.",
        },
],
      rule: C(
        "In a formal meeting, greet the person, name your request and the day, and soften it with please.",
        "En una reunión formal, saluda, nombra tu pedido y el día, y suavízalo con please.",
      ),
      explain:
        "The best opening greets him, names the request (a Thursday room for a book club) and asks politely.",
    },
    {
      id: "say-need",
      type: "write",
      say: true,
      use: "Explain",
      docs: ["club", "calendar"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Of course. Tell me about the club and what you need.",
      },
      prompt:
        "Explain what the club needs: how many members, how long, and why quiet matters. Use the club note.",
      help: "Explica qué necesita el club: cuántos miembros son, cuánto tiempo y por qué importa el silencio. Usa la nota del club. Usa because y pide con please o could we.",
      check: {
        min: 18,
        ideas: [
          {
            any: ["10", "ten", "members"],
            clue: C("Say how many members the club has.", "Di cuántos miembros tiene el club."),
          },
          {
            any: ["90", "minutes", "hour and a half", "hour and a half"],
            clue: C("Say how much time the club needs.", "Di cuánto tiempo necesita el club."),
          },
          {
            any: ["quiet*", "read*"],
            clue: C("Say why quiet matters.", "Di por qué importa el silencio."),
          },
        ],
        connector: ["cause"],
        register: "polite",
      },
      rule: C(
        "A clear request gives the number of people, the time needed, and the reason, politely.",
        "Un pedido claro da el número de personas, el tiempo necesario y la razón, con cortesía.",
      ),
      frame:
        "Good afternoon. Our club has ___ members, and we need ___ on Thursdays because ___. Could we ___, please?",
      model:
        "Good afternoon. Our club has ten members, and we need about 90 minutes on Thursdays because we read quietly and then discuss the book. Could we book a room for that, please?",
      keep: "What I told Mr. Alvarez",
    },
    {
      id: "limits",
      type: "choose",
      docs: ["calendar", "policy"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "I see. The trouble is that the Quiet Study Room is taken until 5:00, and student clubs can book only 60 minutes there. Thirty minutes of quiet reading is not much, is it?",
      },
      prompt:
        "Mr. Alvarez has named two limits, and he also misheard one number. What is the best way to respond first?",
      help: "El Sr. Alvarez nombró dos límites (la sala ocupada y los 60 minutos) y entendió mal un número: thirty suena parecido a thirteen. Primero piensa cómo arreglar el número sin discutir.",
      options: [
{
          id: "a",
          text: "Say the policy is unfair and your club deserves more time.",
          why: "Arguing about fairness does not fix the number, and Mr. Alvarez may stop trying to help.",
        },
{
          id: "b",
          text: "Agree that it is not much, thank him, and leave.",
          why: "Agreeing keeps his mistake in place and ends the talk before any option is on the table.",
        },
{
          id: "c",
          text: "Correct the number politely and show him your club note, then ask what options are open.",
          ok: true,
          why: "Mr. Alvarez checks your note. Fixing the number kindly, with proof, keeps him on your side.",
        },
{
          id: "d",
          text: "Repeat the same sentence again, only louder.",
          why: "Louder is not clearer. A number that sounded like another number once can sound that way again.",
        },
],
      rule: C(
        "To repair a misheard number, correct it kindly, prove it, and keep the talk going toward a solution.",
        "Para reparar un número mal escuchado, corrígelo con amabilidad, demuéstralo y sigue hacia una solución.",
      ),
      explain:
        "Thirty and thirteen sound alike. Correcting the number with your note fixes the misunderstanding and keeps the talk about solutions.",
    },
    {
      id: "repair",
      type: "write",
      say: true,
      use: "Explain",
      docs: ["club"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Hmm. Did I hear that wrong?",
      },
      prompt:
        "Repair the misunderstanding. Correct the number he heard and support it with your club note.",
      help: "Usa una frase para aclarar (Sorry, I wasn't clear / What I meant was / Just to check). Corrige el número: dijiste thirty, no thirteen. Luego apoya con la nota del club.",
      check: {
        min: 16,
        ideas: [
          {
            any: ["thirty", "30"],
            clue: C(
              "Say the number you really meant.",
              "Di el número que de verdad querías decir.",
            ),
          },
          {
            any: ["thirteen", "13", "club note", "our note", "the note", "my note"],
            clue: C(
              "Name the number he heard, or point to your note.",
              "Nombra el número que él escuchó o señala tu nota.",
            ),
          },
        ],
        register: "polite",
        clarify: true,
        evidence: true,
      },
      rule: C(
        "A strong repair names the mix-up, corrects the key number, and points to proof.",
        "Una buena reparación nombra la confusión, corrige el número clave y señala una prueba.",
      ),
      frame: "Sorry, I wasn't clear. I said ___ minutes, not ___. Our note says ___.",
      model:
        "Sorry, I wasn't clear. I said thirty minutes, not thirteen. Our club note says we need 30 minutes of quiet reading, then discuss for forty-five.",
      keep: "How I repaired the number",
    },
    {
      id: "deal",
      type: "choose",
      docs: ["calendar", "policy", "club"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Thank you, thirty is a real reading session. I can offer two things. The Quiet Study Room from 5:00 to 6:00, which is 60 minutes. Or Meeting Room B from 4:00 to 5:30, and I can approve the 90 minutes, but story hour next door is loud from 4:30 to 5:15.",
      },
      prompt: "Which offer do you take, and which part of your meeting has to change?",
      help: "Compara las dos ofertas con el plan de tu club: 30 minutos de lectura callada, 45 de discusión y 15 de planear. Una oferta reduce el tiempo. La otra es más larga pero tiene ruido en parte del tiempo. Una opción no sirve para el club.",
      options: [
{
          id: "a",
          text: "I'll take Meeting Room B from 4:00 to 5:30, and we'll read quietly the whole time.",
          why: "The policy says story hour runs from 4:30 to 5:15 next door. Will the reading stay quiet during all of that?",
        },
{
          id: "b",
          text: "I'll take both rooms so we have two hours.",
          why: "Your club needs one meeting of 90 minutes, and the policy limits student clubs to 60 minutes in the Quiet Study Room. Would two rooms solve that?",
        },
{
          id: "c",
          text: "I'll take the Quiet Study Room from 5:00 to 6:00 and shorten our discussion.",
          ok: true,
          sets: { studyPlan: "quiet" },
          why: "Mr. Alvarez writes it down. The room stays quiet, and your club trims its discussion to fit 60 minutes.",
        },
{
          id: "d",
          text: "I'll take Meeting Room B from 4:00 to 5:30. We'll read first, before story hour gets loud, and discuss during it.",
          ok: true,
          sets: { studyPlan: "meeting" },
          why: "Mr. Alvarez nods. Reading from 4:00 to 4:30 happens before the noise, and talking is allowed in that room.",
        },
],
      rule: C(
        "Match each offer to your real needs: what is kept, what changes, and what the offer does not allow.",
        "Relaciona cada oferta con tus necesidades reales: qué se mantiene, qué cambia y qué no permite la oferta.",
      ),
      explain:
        "Both offers can work for the club: the Quiet Study Room costs time, and Meeting Room B costs quiet during discussion, which is allowed there.",
    },
    {
      id: "confirm-quiet",
      type: "write",
      when: { studyPlan: "quiet" },
      say: true,
      use: "Explain",
      docs: ["calendar", "policy", "club"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Good. Please confirm the booking so I can write it down: the room, the day, the time, and what changes for your club.",
      },
      prompt:
        "Confirm the booking for Mr. Alvarez: the room, the day and time, and what your club will change and why.",
      help: "Confirma la reserva con todos los datos: la sala, el día, la hora (5:00 a 6:00) y qué cambia para el club (la discusión) y por qué (solo hay 60 minutos). Usa because o so.",
      check: {
        min: 20,
        ideas: [
          {
            any: ["quiet study"],
            clue: C("Name the room.", "Nombra la sala."),
          },
          {
            any: ["5:00", "6:00", "thursday"],
            clue: C("Give the day or the time.", "Da el día o la hora."),
          },
          {
            any: ["shorten*", "shorter", "discussion", "60 minutes", "one hour"],
            clue: C("Say what changes for the club.", "Di qué cambia para el club."),
          },
        ],
        connector: ["cause"],
        register: "polite",
      },
      rule: C(
        "A confirmation repeats the key facts: room, day, time, and any change, with its reason.",
        "Una confirmación repite los datos clave: sala, día, hora y cualquier cambio, con su razón.",
      ),
      frame: "Thank you. We will use the ___ on ___ from ___ to ___. We will ___ because ___.",
      model:
        "Thank you, Mr. Alvarez. We will use the Quiet Study Room on Thursday from 5:00 to 6:00. We will shorten our discussion because the room is booked for 60 minutes, and please let us know if anything changes.",
      keep: "My booking confirmation",
    },
    {
      id: "confirm-meeting",
      type: "write",
      when: { studyPlan: "meeting" },
      say: true,
      use: "Explain",
      docs: ["calendar", "policy", "club"],
      npc: {
        who: "Mr. Alvarez, branch manager",
        art: "char-dad",
        line: "Good. Please confirm the booking so I can write it down: the room, the day, the time, and how your club will handle the noise.",
      },
      prompt:
        "Confirm the booking for Mr. Alvarez: the room, the day and time, and how your club will handle the noise from story hour.",
      help: "Confirma la reserva con todos los datos: la sala, el día, la hora (4:00 a 5:30) y cómo manejará el club el ruido de la hora del cuento. Usa first y then para el orden.",
      check: {
        min: 20,
        ideas: [
          {
            any: ["meeting room b"],
            clue: C("Name the room.", "Nombra la sala."),
          },
          {
            any: ["4:00", "5:30", "thursday"],
            clue: C("Give the day or the time.", "Da el día o la hora."),
          },
          {
            any: ["read*", "story hour", "noise", "noisy", "loud*"],
            clue: C("Say how the club handles the noise.", "Di cómo maneja el club el ruido."),
          },
        ],
        connector: ["sequence"],
        register: "polite",
      },
      rule: C(
        "A confirmation repeats the key facts: room, day, time, and the plan for the one problem, in order.",
        "Una confirmación repite los datos clave: sala, día, hora y el plan para el único problema, en orden.",
      ),
      frame:
        "Thank you. We will use ___ on ___ from ___ to ___. First we will ___, and then we will ___.",
      model:
        "Thank you, Mr. Alvarez. We will use Meeting Room B on Thursday from 4:00 to 5:30. First we will read quietly before story hour starts, and then we will hold our discussion while it is loud, since talking is allowed there.",
      keep: "My booking confirmation",
    },
  ],
};
