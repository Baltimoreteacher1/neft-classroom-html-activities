// Newsroom Challenge, assignment 4 in both bands: transit reporting (content only; schema: engine.js).
// 3-5: a school bus changes its pick-up time. 6-8: a city bus route changes how often it runs, and two people
// describe the same ridership numbers very differently. Every person, route and number is invented for practice, and
// each case file says so.
const C = (en, es) => [en, es];

const FACT = { id: "fact", label: C("Fact: can be checked", "Hecho: se puede comprobar") };
const OPINION = {
  id: "opinion",
  label: C("Opinion: a feeling or judgment", "Opinión: un sentimiento o juicio"),
};

export const TRANSIT_35 = {
  id: "nc35-transit",
  title: "The Bus 12 Change",
  art: ["bg-city", "char-reporter"],
  intro:
    'Ms. Rivera taps a paper with a bus on it. "Bus 12 has a new pick-up time, and the hallways are full of rumors. Find out what is true." She adds: "Everything in this file is made up for practice."',
  introEs:
    "La Sra. Rivera señala un papel con un autobús dibujado. «El autobús 12 tiene un nuevo horario de recogida y los pasillos están llenos de rumores. Averigua qué es verdad». Y agrega: «Todo lo que hay en este expediente está inventado para practicar».",
  outro:
    'Your Bus 12 story is posted by the front door. Ms. Rivera reads it twice. "Every fact checks out," she says. "Students can plan their mornings because you got the time right."',
  docs: [
    {
      id: "talk",
      kind: "interview",
      title: "Interview with the bus dispatcher",
      who: "Ms. Gray, school bus dispatcher",
      qa: [
        {
          q: "What changed for Bus 12?",
          a: "Starting Monday, March 3, Bus 12 picks up at the Oak Street stop at 7:10 a.m. It used to pick up at 7:25.",
        },
        {
          q: "Why did it change?",
          a: "Road work on Pine Street means the bus has to take a longer way around.",
        },
        {
          q: "How long will it last?",
          a: "Until April 4, when the road work ends.",
        },
      ],
    },
    {
      id: "chart",
      kind: "chart",
      title: "Students who got on Bus 12 on Monday, by stop",
      unit: "students",
      bars: [
        { label: "Oak Street", value: 9 },
        { label: "Pine Street", value: 6 },
        { label: "Mill Road", value: 5 },
      ],
      source: "Driver's count sheet (numbers invented for practice)",
    },
    {
      id: "ben",
      kind: "witness",
      title: "Statement from a student",
      who: "Ben",
      role: "4th grader at the Oak Street stop",
      said: "The bus came at 7:40 on Monday! The new time is so early and so annoying. About forty kids ride it.",
    },
    {
      id: "mia",
      kind: "witness",
      title: "Statement from another student",
      who: "Mia",
      role: "5th grader at the Oak Street stop, waited there at 7:00",
      said: "I got to the stop at 7:00. The bus came at 7:10, just like the dispatcher said. The new route is way better.",
    },
  ],
  steps: [
    {
      id: "source",
      type: "choose",
      docs: ["talk", "ben", "mia"],
      prompt: "Which source is the most reliable for the new pick-up time?",
      help: "Busca la persona que decide el horario de los autobuses y que lo sabe antes de que pase. Piensa si alguien puede recordar mal porque está molesto.",
      options: [
{
          id: "a",
          text: "Ben, who was upset about the early time",
          why: "Ben felt upset about the time. Could that change how he remembers it?",
        },
{
          id: "b",
          text: "Someone who did not ride Bus 12 on Monday",
          why: "Was this person at the stop to see when the bus came?",
        },
{
          id: "c",
          text: "Ms. Gray, the dispatcher who sets the bus times",
          ok: true,
          why: "Yes. Ms. Gray sets the routes and gave the time, the reason and the dates.",
        },
],
      rule: C(
        "A reliable source knows the facts first-hand and has no reason to change them.",
        "Una fuente confiable conoce los hechos de primera mano y no tiene razón para cambiarlos.",
      ),
      explain:
        "Ms. Gray decides the bus times, so her answer about the new pick-up time is the most reliable.",
    },
    {
      id: "conflict",
      type: "choose",
      docs: ["talk", "ben", "mia"],
      prompt: "Ben and Mia give different times. Which detail is wrong?",
      help: "Mira la entrevista con la Sra. Gray: ¿a qué hora recoge ahora el autobús 12 en la calle Oak? Compara esa hora con lo que dice cada estudiante.",
      options: [
{
          id: "a",
          text: "Mia says the bus came at 7:10.",
          why: "Check the interview. Does Ms. Gray give the same time?",
        },
{
          id: "b",
          text: "Ben says the bus came at 7:40.",
          ok: true,
        },
{
          id: "c",
          text: "Mia says she waited at the stop at 7:00.",
          why: "Nothing in the file says she was not there. Which time does the interview not match?",
        },
],
      rule: C(
        "When two people disagree, check each detail against the most reliable source.",
        "Cuando dos personas no están de acuerdo, revisa cada dato con la fuente más confiable.",
      ),
      explain:
        "The dispatcher says Bus 12 picks up at 7:10, so Ben's 7:40 is wrong and Mia's 7:10 matches.",
    },
    {
      id: "sort",
      type: "sort",
      docs: ["talk", "chart", "ben", "mia"],
      prompt: "Sort each statement. Is it a fact or an opinion?",
      help: "Un hecho se puede comprobar con un registro o una entrevista. Una opinión dice lo que alguien siente o piensa, como que algo es molesto o mejor.",
      cats: [FACT, OPINION],
      items: [
        {
          id: "i1",
          text: "Bus 12 now picks up at Oak Street at 7:10 a.m.",
          cat: "fact",
          clue: C(
            "Could you check this with the dispatcher?",
            "¿Podrías comprobarlo con la despachadora?",
          ),
        },
        {
          id: "i2",
          text: "The new time is so early and so annoying.",
          cat: "opinion",
          clue: C(
            'Would everyone agree that it is "annoying"?',
            "¿Todos estarían de acuerdo en que es «annoying»?",
          ),
        },
        {
          id: "i3",
          text: "Road work on Pine Street made the route longer.",
          cat: "fact",
          clue: C("Did the dispatcher say this?", "¿Lo dijo la despachadora?"),
        },
        {
          id: "i4",
          text: "The new route is way better.",
          cat: "opinion",
          clue: C('Who decides what is "better"?', "¿Quién decide qué es «better»?"),
        },
        {
          id: "i5",
          text: "Nine students got on Bus 12 at the Oak Street stop on Monday.",
          cat: "fact",
          clue: C("Is this on the count sheet?", "¿Está en la hoja de conteo?"),
        },
        {
          id: "i6",
          text: "Bus 12 has the nicest driver.",
          cat: "opinion",
          clue: C('Can you measure "nicest"?', "¿Se puede medir «nicest»?"),
        },
      ],
      rule: C(
        "A fact can be checked in a record or by asking the person who knows. An opinion is what someone feels or thinks.",
        "Un hecho se puede comprobar en un registro o preguntando a quien sabe. Una opinión es lo que alguien siente o piensa.",
      ),
      explain:
        "The pick-up time, the road work and the count of students can be checked. Annoying, better and nicest are feelings.",
    },
    {
      id: "headline",
      type: "write",
      docs: ["talk", "chart"],
      prompt: "Write a headline for the Bus 12 story. Use facts only.",
      help: "Escribe 12 palabras o menos. Nombra el tema (el autobús 12) y lo que cambió. No uses palabras de opinión como best o annoying.",
      check: {
        min: 3,
        max: 12,
        ideas: [
          {
            any: ["bus 12", "bus"],
            clue: C("Name the topic of the story.", "Nombra el tema de la noticia."),
          },
        ],
        noOpinion: true,
      },
      rule: C(
        "A headline names the main news in a few words, with no opinion.",
        "Un titular nombra la noticia principal en pocas palabras, sin opinión.",
      ),
      frame: "Bus 12 ___ at ___ Because of ___",
      model: "Bus 12 Picks Up Earlier at Oak Street Because of Road Work",
      keep: "Headline",
    },
    {
      id: "lead",
      type: "write",
      docs: ["talk", "chart"],
      prompt: "Write the first sentence of your story. Tell who, what, when and where.",
      help: "La primera oración responde: ¿quién? (el autobús 12 o los estudiantes), ¿qué? (la nueva hora), ¿cuándo? (el día) y ¿dónde? (la calle). Usa la entrevista.",
      check: {
        min: 15,
        ideas: [
          {
            any: ["bus 12", "students", "ms. gray", "dispatcher", "riders"],
            clue: C(
              "Say who or what the story is about.",
              "Di sobre quién o qué trata la noticia.",
            ),
          },
          {
            any: ["pick*", "7:10", "new time", "earlier"],
            clue: C("Say what changed.", "Di qué cambió."),
          },
          {
            any: ["monday", "march 3", "starting"],
            clue: C("Say when it started.", "Di cuándo empezó."),
          },
          {
            any: ["oak street", "pine street"],
            clue: C("Say where.", "Di dónde."),
          },
        ],
        noOpinion: true,
      },
      rule: C(
        "A news lead answers who, what, when and where in one sentence, with facts only.",
        "El comienzo de una noticia responde quién, qué, cuándo y dónde en una oración, solo con hechos.",
      ),
      frame: "Starting ___, Bus 12 ___ at ___ because ___.",
      model:
        "Starting Monday, March 3, Bus 12 picks up students at the Oak Street stop at 7:10 a.m. because of road work on Pine Street.",
      keep: "Lead",
    },
    {
      id: "revise",
      type: "write",
      docs: ["chart", "ben"],
      npc: {
        who: "Ms. Rivera, editor",
        art: "char-teacher",
        line: 'Your draft says: "About 40 students ride Bus 12 on Monday." Where did that number come from? Check it before we print.',
      },
      prompt: "Rewrite the sentence with the right number. Name the source you checked.",
      help: "Suma las barras de la gráfica para tener el total del lunes. Escribe la oración otra vez con ese número y di dónde lo viste: The count sheet shows …",
      check: {
        min: 8,
        ideas: [
          {
            any: ["20", "twenty"],
            clue: C(
              "Add up the bars on the count sheet and use that total.",
              "Suma las barras de la hoja de conteo y usa ese total.",
            ),
          },
        ],
        avoid: [
          {
            any: ["40", "forty"],
            clue: C(
              "That number came from a student who did not count. Use the total from the count sheet.",
              "Ese número vino de un estudiante que no contó. Usa el total de la hoja de conteo.",
            ),
          },
        ],
        evidence: true,
      },
      rule: C(
        "Fix a wrong fact with the number from the record, and say where you found it.",
        "Corrige un dato equivocado con el número del registro y di dónde lo encontraste.",
      ),
      frame: "The count sheet shows that ___ students got on Bus 12 on Monday.",
      model: "The driver's count sheet shows that 20 students got on Bus 12 on Monday.",
      keep: "Corrected sentence",
    },
  ],
};

export const TRANSIT_68 = {
  id: "nc68-transit",
  title: "The Route 9 Schedule Change",
  art: ["bg-city", "char-reporter"],
  intro:
    'Mr. Haddad slides a transit notice across the desk. "Metro Transit is changing how often Route 9 runs. Two people are already telling opposite stories about ridership. Find out what the numbers actually say." The route, the people and the numbers in this file are invented for practice.',
  introEs:
    "El Sr. Haddad desliza un aviso de transporte sobre el escritorio. «Metro Transit va a cambiar la frecuencia de la ruta 9. Dos personas ya cuentan historias opuestas sobre los pasajeros. Averigua qué dicen realmente los números». La ruta, las personas y los números de este expediente están inventados para practicar.",
  outro:
    'Your Route 9 story runs on the Ledger website, and the agency and the rider group both ask for the same chart. Mr. Haddad nods. "You said what the data show, and you did not say what they cannot show. That is the whole job."',
  docs: [
    {
      id: "talk",
      kind: "interview",
      title: "Interview with the Metro Transit planner",
      who: "Dana Whitfield, Metro Transit planner",
      qa: [
        {
          q: "What changes on Monday, November 3?",
          a: "On weekdays, Route 9 buses will come every 20 minutes instead of every 15 minutes. Weekend service stays the same.",
        },
        {
          q: "Why is the agency making the change?",
          a: "We are moving two buses to a new Saturday route that we plan to start in December.",
        },
        {
          q: "Where do the ridership numbers come from?",
          a: "From fare-card taps at the door. The chart shows average weekday boardings for each month before the change.",
        },
      ],
    },
    {
      id: "chart",
      kind: "chart",
      title: "Average weekday boardings on Route 9, before the change",
      unit: "boardings",
      bars: [
        { label: "August", value: 4100 },
        { label: "September", value: 4000 },
        { label: "October", value: 3800 },
      ],
      source: "Metro Transit fare-card counts (numbers invented for practice)",
    },
    {
      id: "notice",
      kind: "record",
      title: "Metro Transit notice: Route 9 change",
      rows: [
        ["Starts", "Monday, November 3"],
        ["Weekday buses", "Every 20 minutes (now every 15)"],
        ["Weekend buses", "No change"],
        ["Public comment", "Open until October 31"],
      ],
    },
    {
      id: "osei",
      kind: "witness",
      title: "Statement from a rider group",
      who: "Mr. Osei",
      role: "organizer of the Route 9 Riders Group",
      said: "Ridership on Route 9 has dropped by half. The agency is cutting service because nobody rides it, and that is a disgrace.",
    },
    {
      id: "park",
      kind: "witness",
      title: "Statement from the agency",
      who: "Ms. Park",
      role: "Metro Transit spokesperson",
      said: "Ridership has not changed at all, and riders will love the new 20-minute schedule.",
    },
  ],
  steps: [
    {
      id: "source",
      type: "choose",
      docs: ["talk", "chart", "osei", "park"],
      prompt: "Which source is the most reliable for how many people ride Route 9?",
      help: "Busca la fuente que cuenta a los pasajeros con un método fijo. Piensa si alguna persona tiene una razón para hacer los números más grandes o más chicos, y si la fuente explica de dónde salen los números.",
      options: [
{
          id: "a",
          text: "Mr. Osei, who organizes the riders' campaign against the change",
          why: "Mr. Osei is arguing against the change. Does he have a reason to make the drop sound bigger?",
        },
{
          id: "b",
          text: "The fare-card counts that Metro Transit records at the door",
          ok: true,
          why: "Yes. Every boarding is counted the same way each month, and the planner explained the method.",
        },
{
          id: "c",
          text: "Ms. Park, who speaks for the agency making the change",
          why: "Ms. Park speaks for the agency. Does she have a reason to make the change sound harmless?",
        },
{
          id: "d",
          text: "A comment posted online by someone who rides Route 9 sometimes",
          why: "One rider sees only some trips. Did this person count every boarding?",
        },
],
      rule: C(
        "A reliable source uses a consistent method, explains it, and does not gain from the answer.",
        "Una fuente confiable usa un método constante, lo explica y no gana nada con la respuesta.",
      ),
      explain:
        "The fare-card counts use one method every month, and the planner explained it, so they are more reliable than people who want a particular answer.",
    },
    {
      id: "conflict",
      type: "choose",
      docs: ["chart", "notice", "osei", "park"],
      prompt:
        "Mr. Osei and Ms. Park describe ridership very differently. Which statement does the chart actually support?",
      help: "Mira las barras: ¿cuánto bajó de septiembre a octubre? Compara ese cambio con «a la mitad» y con «no cambió». Fíjate también en cuándo empieza el nuevo horario: ¿la gráfica puede mostrar lo que causó?",
      options: [
{
          id: "a",
          text: "Average weekday boardings fell by half.",
          why: "Half of 4,000 would be 2,000. What does the October bar show?",
        },
{
          id: "b",
          text: "Average weekday boardings did not change at all.",
          why: "Compare the September bar with the October bar. Are they the same?",
        },
{
          id: "c",
          text: "Average weekday boardings fell a little, from 4,000 in September to 3,800 in October.",
          ok: true,
        },
{
          id: "d",
          text: "Boardings fell because the new schedule started.",
          why: "The notice says the new schedule starts November 3. Can numbers from before that date show what it caused?",
        },
],
      rule: C(
        "Report what the data show, no more and no less, and do not name a cause the data cannot show.",
        "Informa lo que muestran los datos, ni más ni menos, y no nombres una causa que los datos no pueden mostrar.",
      ),
      explain:
        "The chart shows 4,000 in September and 3,800 in October, a drop of 200 (5 percent). It covers months before the change, so it cannot show what the new schedule caused.",
    },
    {
      id: "sort",
      type: "sort",
      docs: ["talk", "chart", "notice", "osei", "park"],
      prompt: "Sort each statement from the sources. Is it a fact or an opinion?",
      help: "Un hecho se puede comprobar con un aviso, una entrevista o una gráfica. Una opinión es un juicio: dice si algo es injusto, largo, bueno o lo que la gente sentirá.",
      cats: [FACT, OPINION],
      items: [
        {
          id: "i1",
          text: "Weekday buses on Route 9 will come every 20 minutes instead of every 15.",
          cat: "fact",
          clue: C("Is this printed in the notice?", "¿Está impreso en el aviso?"),
        },
        {
          id: "i2",
          text: "Cutting service is a disgrace.",
          cat: "opinion",
          clue: C(
            'Is "disgrace" a measurement or a judgment?',
            "¿«Disgrace» es una medida o un juicio?",
          ),
        },
        {
          id: "i3",
          text: "The change starts on Monday, November 3.",
          cat: "fact",
          clue: C(
            "Could you check the date in the notice?",
            "¿Podrías comprobar la fecha en el aviso?",
          ),
        },
        {
          id: "i4",
          text: "Riders will love the new schedule.",
          cat: "opinion",
          clue: C(
            "Can anyone know today how every rider will feel?",
            "¿Alguien puede saber hoy lo que sentirá cada pasajero?",
          ),
        },
        {
          id: "i5",
          text: "Average weekday boardings were 3,800 in October.",
          cat: "fact",
          clue: C("Which source gives this number?", "¿Qué fuente da este número?"),
        },
        {
          id: "i6",
          text: "A 20-minute wait is too long.",
          cat: "opinion",
          clue: C('Who decides what is "too long"?', "¿Quién decide qué es «too long»?"),
        },
      ],
      rule: C(
        "A fact can be checked in a record or an official source. An opinion is a judgment or a prediction about feelings.",
        "Un hecho se puede comprobar en un registro o una fuente oficial. Una opinión es un juicio o una predicción sobre sentimientos.",
      ),
      explain:
        "The new interval, the start date and the October count are checkable. Disgrace, love and too long are judgments or predictions, so they are opinions.",
    },
    {
      id: "headline",
      type: "write",
      docs: ["talk", "notice"],
      prompt: "Write a headline for the Route 9 story. Use facts only.",
      help: "Escribe 12 palabras o menos. Nombra el tema (la ruta 9) y el cambio (cada 20 minutos). No uses palabras de opinión.",
      check: {
        min: 3,
        max: 12,
        ideas: [
          {
            any: ["route 9"],
            clue: C("Name the route.", "Nombra la ruta."),
          },
          {
            any: ["20 minutes", "every 20", "nov. 3", "nov 3", "november 3", "monday"],
            clue: C("Name the change or the date.", "Nombra el cambio o la fecha."),
          },
        ],
        noOpinion: true,
      },
      rule: C(
        "A headline names the main news in a few words, with a strong verb and no opinion.",
        "Un titular nombra la noticia principal en pocas palabras, con un verbo fuerte y sin opinión.",
      ),
      frame: "Route 9 Buses Will ___ Every ___ Starting ___",
      model: "Route 9 Buses Will Come Every 20 Minutes Starting Nov. 3",
      keep: "Headline",
    },
    {
      id: "lead",
      type: "write",
      docs: ["talk", "notice"],
      prompt: "Write the lead for your story. Answer who, what, when, where and why.",
      help: "El primer párrafo responde: ¿quién? (Metro Transit), ¿qué? (los autobuses vendrán cada 20 minutos), ¿cuándo? (el día), ¿dónde? (la ruta 9) y ¿por qué? (mueve dos autobuses a una ruta nueva). Usa la entrevista y el aviso.",
      check: {
        min: 18,
        ideas: [
          {
            any: ["metro transit", "agency", "transit"],
            clue: C("Say who is making the change.", "Di quién hace el cambio."),
          },
          {
            any: ["every 20 minutes", "20 minutes", "longer wait*", "less often"],
            clue: C("Say what is changing.", "Di qué está cambiando."),
          },
          {
            any: ["monday", "november 3", "nov. 3", "nov 3"],
            clue: C("Say when it starts.", "Di cuándo empieza."),
          },
          {
            any: ["route 9", "weekday*"],
            clue: C("Say where or on which days.", "Di dónde o en qué días."),
          },
          {
            any: ["saturday", "two buses", "new route", "moved", "moving"],
            clue: C("Say why the agency is doing it.", "Di por qué lo hace la agencia."),
          },
        ],
        noOpinion: true,
      },
      rule: C(
        "A news lead packs who, what, when, where and why into the first sentence or two, with facts only.",
        "El comienzo de una noticia pone quién, qué, cuándo, dónde y por qué en la primera o segunda oración, solo con hechos.",
      ),
      frame: "Starting ___, ___ will run ___ every ___ instead of every ___, because ___.",
      model:
        "Starting Monday, November 3, Metro Transit will run Route 9 weekday buses every 20 minutes instead of every 15, because it moved two buses to a new Saturday route planned for December.",
      keep: "Lead",
    },
    {
      id: "revise",
      type: "write",
      docs: ["chart", "notice", "osei"],
      npc: {
        who: "Mr. Haddad, editor",
        art: "char-teacher",
        line: 'Paragraph four of your draft says: "Ridership on Route 9 fell by half after the schedule change." Does the record show that?',
      },
      prompt: "Rewrite the sentence so the data support it. Name the source of your numbers.",
      help: "Usa los números de la gráfica (4,000 en septiembre y 3,800 en octubre). Recuerda que el horario nuevo todavía no empezó, así que no digas que causó la baja. Nombra la fuente: The fare-card counts show …",
      check: {
        min: 14,
        ideas: [
          {
            any: ["3,800", "4,000", "200", "5%", "5 percent", "five percent"],
            clue: C("Use the numbers from the chart.", "Usa los números de la gráfica."),
          },
        ],
        avoid: [
          {
            any: [
              "by half",
              "50%",
              "50 percent",
              "fifty percent",
              "after the schedule",
              "because of the schedule",
              "caused",
            ],
            clue: C(
              "The data do not show a drop by half, and the new schedule has not started. Report the recorded numbers only.",
              "Los datos no muestran una baja a la mitad y el horario nuevo todavía no empieza. Informa solo los números registrados.",
            ),
          },
        ],
        evidence: true,
      },
      rule: C(
        "Correct a claim with the recorded numbers, name the source, and do not claim a cause the data cannot show.",
        "Corrige una afirmación con los números registrados, nombra la fuente y no afirmes una causa que los datos no pueden mostrar.",
      ),
      frame:
        "The fare-card counts show that average weekday boardings ___ from ___ in ___ to ___ in ___.",
      model:
        "The fare-card counts show that average weekday boardings fell from 4,000 in September to 3,800 in October, before the new schedule began.",
      keep: "Corrected sentence",
    },
  ],
};
