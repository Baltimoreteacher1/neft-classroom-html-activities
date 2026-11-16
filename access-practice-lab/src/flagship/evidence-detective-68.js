// Evidence Detective, grades 6-8: "The Ridgeview Evidence Unit". Content only (schema: engine.js).
// Every case: sort the clues (relevant / irrelevant, with a reason), choose the best-supported conclusion,
// defend it (claim + evidence + reasoning), then answer a counterclaim.
const C = (en, es) => [en, es];

const CATS = [
  { id: "relevant", label: C("Helps solve the case", "Ayuda a resolver el caso") },
  { id: "irrelevant", label: C("Does not help", "No ayuda") },
];

export const BAND_68 = {
  premise:
    "Ridgeview Middle School has a new student team: the Evidence Unit. When something strange happens on campus, the principal sends the Unit a case file of records, data and witness statements. Your job is not to guess. You separate strong evidence from noise, reach the conclusion the evidence supports, and defend it against people who disagree.",
  premiseEs:
    "La Escuela Intermedia Ridgeview tiene un nuevo equipo de estudiantes: la Unidad de Evidencia. Cuando pasa algo extraño en la escuela, la directora le manda a la Unidad un expediente con registros, datos y declaraciones de testigos. Tu trabajo no es adivinar. Separas la evidencia fuerte del ruido, llegas a la conclusión que la evidencia apoya y la defiendes ante quienes no están de acuerdo.",
  chapters: [
    {
      id: "ed68-garden",
      title: "Case 1: The Dying Garden",
      art: ["bg-park", "char-detective"],
      intro:
        'The school garden was green and healthy in September. Four weeks later, the bean and pepper plants are yellow and drooping. Principal Vega drops the first case file on your desk. "The garden club says it was the heat. Find out what the evidence says."',
      introEs:
        "El huerto de la escuela estaba verde y sano en septiembre. Cuatro semanas después, las plantas de frijol y de pimiento están amarillas y caídas. La directora Vega deja el primer expediente en tu escritorio. «El club del huerto dice que fue el calor. Averigua qué dice la evidencia».",
      outro:
        'The club turns the sprinkler down to once a day and stops hand-watering. Two weeks later, new green leaves appear. Principal Vega reads your report and nods. Then her phone buzzes. "Someone moved the bike rack over the weekend," she says. "And nobody will admit to it."',
      docs: [
        {
          id: "moisture",
          kind: "chart",
          title: "Soil moisture in the garden beds",
          unit: "% water in the soil",
          bars: [
            { label: "Week 1", value: 40 },
            { label: "Week 2", value: 55 },
            { label: "Week 3", value: 78 },
            { label: "Week 4", value: 92 },
          ],
          source: "Science class sensor. Healthy range for beans and peppers: 30% to 50%.",
        },
        {
          id: "watering",
          kind: "record",
          title: "Garden watering log",
          rows: [
            ["Start of Week 2", "New automatic sprinkler installed. Runs at 6 a.m. and 6 p.m."],
            ["Weeks 2 to 4", "Volunteers also water every bed by hand after school."],
            ["Weeks 3 and 4", "Rain on 5 days."],
          ],
        },
        {
          id: "photo",
          kind: "photo",
          title: "Photo of a pepper plant",
          art: "sci-plant",
          caption:
            "Yellow, soft leaves with no bite holes. The soil is dark and soggy, and small mushrooms are growing next to the stem.",
        },
        {
          id: "reyes",
          kind: "interview",
          title: "Interview with the garden club adviser",
          who: "Mr. Reyes",
          qa: [
            {
              q: "When did the plants start to look sick?",
              a: "They looked healthy before Week 2. The leaves started turning yellow in Week 3.",
            },
            {
              q: "What do you think of the garden?",
              a: "It is the nicest place at school. The club also sells bookmarks to buy new seeds.",
            },
          ],
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["moisture", "watering", "photo", "reyes"],
          prompt:
            "Sort the clues. Which ones help explain why the plants are dying? Choose a reason for each.",
          help: "Para cada pista pregúntate: ¿me dice cuánta agua recibieron las plantas o cuándo empezó el cambio? Si es una opinión o habla de otro tema, no ayuda a resolver el caso.",
          cats: CATS,
          reasons: [
            { id: "water", text: "It shows how much water the plants got" },
            { id: "when", text: "It tells when the change began" },
            { id: "opinion", text: "It is an opinion, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "rise",
              text: "Soil moisture rose from 40% to 92% in four weeks.",
              cat: "relevant",
              reason: "water",
              clue: C(
                "This is data about the soil. What does it measure?",
                "Esto son datos sobre la tierra. ¿Qué miden?",
              ),
            },
            {
              id: "hand",
              text: "Volunteers watered every bed by hand after school.",
              cat: "relevant",
              reason: "water",
              clue: C(
                "This adds to something the sprinkler already does.",
                "Esto se suma a algo que el aspersor ya hace.",
              ),
            },
            {
              id: "installed",
              text: "The sprinkler was installed at the start of Week 2.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "Compare this date with when the leaves turned yellow.",
                "Compara esta fecha con cuándo se pusieron amarillas las hojas.",
              ),
            },
            {
              id: "healthy",
              text: "The plants looked healthy before Week 2.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "This sets a starting point. What changed after it?",
                "Esto marca un punto de partida. ¿Qué cambió después?",
              ),
            },
            {
              id: "nicest",
              text: "Mr. Reyes says the garden is the nicest place at school.",
              cat: "irrelevant",
              reason: "opinion",
              clue: C(
                'Can "nicest" be measured, or is it a judgment?',
                "¿«Nicest» se puede medir o es un juicio personal?",
              ),
            },
            {
              id: "bookmarks",
              text: "The club sells bookmarks to buy new seeds.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "Does fundraising affect the plants in the ground now?",
                "¿Recaudar dinero afecta a las plantas que ya están en la tierra?",
              ),
            },
          ],
          rule: C(
            "Relevant evidence is a fact or measurement connected to the question. Opinions and side topics are noise.",
            "La evidencia relevante es un dato o una medida conectada con la pregunta. Las opiniones y los temas aparte son ruido.",
          ),
          explain:
            "The moisture data and the watering log show how much water the plants got, and the sprinkler date lines up with when the plants got sick. The adviser's opinion and the bookmark sale do not explain anything.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["moisture", "watering", "photo", "reyes"],
          prompt: "Which conclusion does the evidence support best?",
          help: "Compara cada conclusión con la gráfica de humedad, el registro de riego y la foto. Una conclusión fuerte no puede chocar con ningún dato. Fíjate en el rango sano que aparece debajo de la gráfica.",
          options: [
            {
              id: "a",
              text: "A hot, dry month dried out the soil.",
              why: "Heat can hurt plants. But read the moisture chart: did the soil get drier or wetter each week?",
            },
            {
              id: "b",
              text: "Too much water from the sprinkler, volunteers and rain drowned the roots.",
              ok: true,
              why: "Yes. The data, the log and the photo all point the same way.",
            },
            {
              id: "c",
              text: "Insects ate the leaves.",
              why: "Insects are a common problem. Look closely at the photo: what would chewed leaves have?",
            },
            {
              id: "d",
              text: "The beds do not get enough sunlight.",
              why: "Sunlight matters, but the plants were healthy in the same spot before Week 2. What changed at that time?",
            },
          ],
          rule: C(
            "The best-supported conclusion explains all the relevant evidence and is contradicted by none of it.",
            "La conclusión mejor apoyada explica toda la evidencia relevante y ninguna evidencia la contradice.",
          ),
          explain:
            "Soil moisture climbed to 92%, far above the healthy range of 30% to 50%, right after the sprinkler was added on top of hand-watering and rain. Soggy soil and mushrooms in the photo also point to too much water.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["moisture", "watering", "photo"],
          prompt:
            "Write your claim for Principal Vega. Support it with data from the case file and explain what the data means.",
          help: "Escribe una o dos oraciones. Di qué mató las plantas. Usa un dato de la gráfica (un porcentaje) o del registro de riego, y explica por qué ese dato es un problema. Usa because o since.",
          check: {
            min: 14,
            ideas: [
              {
                any: [
                  "too much water",
                  "overwater*",
                  "over water*",
                  "too wet",
                  "drown*",
                  "excess water",
                  "extra water",
                  "too much rain",
                ],
                clue: C(
                  "State your claim: what went wrong with the water?",
                  "Di tu afirmación: ¿qué salió mal con el agua?",
                ),
              },
              {
                any: [
                  "92%",
                  "92 percent",
                  "ninety two",
                  "92",
                  "moisture",
                  "sprinkler*",
                  "twice a day",
                  "two times a day",
                  "volunteer*",
                  "healthy range",
                  "soggy",
                ],
                clue: C(
                  "Add a number or fact from the chart or the watering log.",
                  "Agrega un número o un dato de la gráfica o del registro de riego.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "Claim, evidence, reasoning: say what happened, give a specific fact, and explain why that fact proves it.",
            "Afirmación, evidencia, razonamiento: di qué pasó, da un dato específico y explica por qué ese dato lo prueba.",
          ),
          frame:
            "The plants died from ___ because the chart shows ___, which is ___ the healthy range.",
          model:
            "The plants died from too much water because the chart shows soil moisture rose to 92%, which is far above the healthy range of 30% to 50%.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["moisture", "watering"],
          npc: {
            who: "Amara, garden club president",
            art: "char-amara",
            line: "I still think it was the heat. It was a really hot month, and plants dry out in the heat.",
          },
          prompt:
            "Answer Amara's counterclaim. Admit what is true, then use the data to show why it does not explain the dying plants.",
          help: "Primero reconoce lo que Amara tiene bien (It is true that... / Although...). Luego usa but o however y un dato de la gráfica o del registro que vaya en contra de la idea del calor.",
          check: {
            min: 16,
            ideas: [
              {
                any: [
                  "moisture",
                  "wetter",
                  "wet",
                  "92%",
                  "92 percent",
                  "92",
                  "rain*",
                  "sprinkler*",
                  "soggy",
                  "not dry",
                  "never dry",
                  "rose",
                  "went up",
                  "increas*",
                ],
                clue: C(
                  "Use data that shows the soil was not dry.",
                  "Usa un dato que muestre que la tierra no estaba seca.",
                ),
              },
            ],
            connector: ["contrast", "concession"],
          },
          rule: C(
            "A strong rebuttal concedes the true part of the other claim, then uses evidence to show why it still does not hold.",
            "Una buena refutación acepta la parte verdadera del otro argumento y luego usa evidencia para mostrar por qué no se sostiene.",
          ),
          frame: "It is true that ___, but the ___ shows ___, so the soil was not ___.",
          model:
            "It is true that the month was hot, but the moisture chart shows the soil got wetter every week, so the plants did not dry out.",
          keep: "My answer to the other side",
        },
      ],
    },
    {
      id: "ed68-bikerack",
      title: "Case 2: The Moved Bike Rack",
      art: ["bg-city", "char-detective"],
      intro:
        "On Monday morning, the bike rack is gone from the front entrance. It is now on the side of the building, next to the gym. Students are blaming each other, and a rumor says the eighth graders did it as a prank. The Evidence Unit gets the case file before first period.",
      introEs:
        "El lunes por la mañana, el portabicicletas ya no está en la entrada principal. Ahora está al lado del edificio, junto al gimnasio. Los estudiantes se culpan unos a otros, y un rumor dice que los de octavo grado lo hicieron como broma. La Unidad de Evidencia recibe el expediente antes de la primera clase.",
      outro:
        'Your report goes up on the morning announcements, and the prank rumor stops. The maintenance crew adds a sign: "Bike rack moved for the new ramp." But on Friday morning, the science lab smells like rain, and a seed experiment is ruined. Principal Vega calls the Unit in one more time.',
      docs: [
        {
          id: "order",
          kind: "record",
          title: "Maintenance work order #418",
          rows: [
            ["Job", "Move bike rack from the front entrance to the gym side"],
            ["Reason", "Clear space for the new wheelchair ramp"],
            ["Date", "Saturday morning"],
            ["Tools", "Drill, wrench, dolly"],
          ],
        },
        {
          id: "security",
          kind: "schedule",
          title: "Weekend security log",
          cols: ["Day", "Time", "Event"],
          rows: [
            ["Saturday", "9:00", "Maintenance van enters the front lot"],
            ["Saturday", "11:30", "Maintenance van leaves"],
            ["Sunday", "all day", "No visitors. Gates locked."],
          ],
        },
        {
          id: "photo",
          kind: "photo",
          title: "Front entrance, Monday 7:15 a.m.",
          art: "obj-camera",
          caption:
            "Four clean bolt holes in the concrete where the rack stood. Orange cones mark the spot for the ramp. No scrapes or drag marks.",
        },
        {
          id: "tia",
          kind: "witness",
          title: "Statement from a student",
          who: "Maya",
          role: "7th grader who bikes to school",
          said: "The rack weighs about 300 pounds and it was bolted down. Honestly, the new spot is so annoying because it is far from my locker.",
        },
        {
          id: "news",
          kind: "record",
          title: "Monday morning announcements",
          rows: [
            ["Lunch", "Tacos today"],
            ["Sports", "The soccer team practices behind the gym at 3:30"],
            ["Reminder", "Picture day is Thursday"],
          ],
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["order", "security", "photo", "tia", "news"],
          prompt: "Sort the clues. Which ones help explain who moved the rack, how and when?",
          help: "Para cada pista pregúntate: ¿muestra quién movió el portabicicletas o cómo, o dice cuándo pasó? Las opiniones y los anuncios sobre otros temas no ayudan.",
          cats: CATS,
          reasons: [
            { id: "how", text: "It shows who moved it or how" },
            { id: "when", text: "It tells when it happened" },
            { id: "opinion", text: "It is an opinion, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "tools",
              text: "The work order lists a drill, a wrench and a dolly.",
              cat: "relevant",
              reason: "how",
              clue: C(
                "What would you need to unbolt and move a heavy rack?",
                "¿Qué necesitarías para quitar los tornillos y mover algo pesado?",
              ),
            },
            {
              id: "holes",
              text: "The bolt holes are clean, with no drag marks.",
              cat: "relevant",
              reason: "how",
              clue: C(
                "Clean holes and no scrapes say something about the way it was moved.",
                "Agujeros limpios y sin rayones dicen algo sobre la manera en que se movió.",
              ),
            },
            {
              id: "van",
              text: "The van came at 9:00 and left at 11:30 on Saturday.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "This gives a time window. Does it match the work order?",
                "Esto da un período de tiempo. ¿Coincide con la orden de trabajo?",
              ),
            },
            {
              id: "sunday",
              text: "On Sunday the gates were locked and no one visited.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "This rules out one whole day. Which one?",
                "Esto descarta un día completo. ¿Cuál?",
              ),
            },
            {
              id: "annoying",
              text: "Maya says the new spot is annoying.",
              cat: "irrelevant",
              reason: "opinion",
              clue: C(
                'Is "annoying" a fact about who moved it, or how Maya feels?',
                "¿«Annoying» es un dato sobre quién lo movió o lo que siente Maya?",
              ),
            },
            {
              id: "tacos",
              text: "The cafeteria is serving tacos on Monday.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "Does lunch have anything to do with the rack?",
                "¿El almuerzo tiene algo que ver con el portabicicletas?",
              ),
            },
            {
              id: "soccer",
              text: "The soccer team practices behind the gym.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "It mentions the gym, but is it about the rack at all?",
                "Menciona el gimnasio, pero ¿tiene algo que ver con el portabicicletas?",
              ),
            },
          ],
          rule: C(
            "A clue is relevant when it answers part of the question: who, how or when. Mentioning the same place is not enough.",
            "Una pista es relevante cuando responde parte de la pregunta: quién, cómo o cuándo. Mencionar el mismo lugar no es suficiente.",
          ),
          explain:
            "The tools and the clean bolt holes show how it was moved, and the security log shows when. Maya's feelings, lunch and soccer practice do not answer the question, even when they mention the gym.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["order", "security", "photo", "tia"],
          prompt: "Which conclusion is best supported by the evidence?",
          help: "Lee cada conclusión y busca una pista que la apoye y otra que la contradiga. Fíjate en el peso del portabicicletas, el registro de seguridad y la razón que da la orden de trabajo.",
          options: [
            {
              id: "a",
              text: "Eighth graders moved it as a prank on Sunday.",
              why: "Check the security log for Sunday, and remember what Maya said about the rack's weight and bolts.",
            },
            {
              id: "b",
              text: "The maintenance crew moved it on Saturday to make room for the new ramp.",
              ok: true,
              why: "Yes. The work order, the log and the photo all agree.",
            },
            {
              id: "c",
              text: "It was moved so more bikes could fit by the gym.",
              why: "The new spot might hold more bikes, but what reason does the work order actually give?",
            },
            {
              id: "d",
              text: "A delivery truck hit it and pushed it out of the way.",
              why: "A crash leaves damage. What does the photo show about the ground where it stood?",
            },
          ],
          rule: C(
            "Prefer the conclusion with direct evidence for who, how, when and why, over one that only seems possible.",
            "Elige la conclusión con evidencia directa de quién, cómo, cuándo y por qué, no una que solo parece posible.",
          ),
          explain:
            "The work order names the job, the tools and the reason (the ramp). The security log shows only the maintenance van came in, on Saturday, and the clean bolt holes show it was unbolted with tools, not dragged or hit.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["order", "security", "photo"],
          prompt:
            "Write the Unit's finding for the morning announcements. Who moved the rack and why? Support it with two pieces of evidence and explain them.",
          help: "Escribe dos oraciones. Di quién movió el portabicicletas y por qué. Nombra dos pruebas (la orden de trabajo, el registro de seguridad o la foto) y explica qué muestran. Usa because, since o according to.",
          check: {
            min: 20,
            ideas: [
              {
                any: ["maintenance", "crew", "custodian*", "workers", "school staff"],
                clue: C("Say who moved the rack.", "Di quién movió el portabicicletas."),
              },
              {
                any: ["ramp", "wheelchair"],
                clue: C(
                  "Say why it was moved, using the work order.",
                  "Di por qué se movió, según la orden de trabajo.",
                ),
              },
              {
                any: [
                  "van",
                  "security",
                  "saturday",
                  "bolt*",
                  "drill",
                  "wrench",
                  "tool*",
                  "work order",
                  "clean hole*",
                ],
                clue: C(
                  "Add a fact from the security log or the photo.",
                  "Agrega un dato del registro de seguridad o de la foto.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A finding states the claim, gives evidence for each part of it, and explains how the evidence fits together.",
            "Un resultado dice la afirmación, da evidencia para cada parte y explica cómo encaja la evidencia.",
          ),
          frame:
            "The ___ moved the rack to make room for ___. We know this because the ___ shows ___, and the photo shows ___.",
          model:
            "The maintenance crew moved the rack on Saturday to make room for the new ramp. We know this because the work order lists a drill and a wrench, and the security log shows their van was the only visitor.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["security", "tia", "photo"],
          npc: {
            who: "Maya",
            art: "char-maya",
            line: "Come on. My friends joke about moving that rack all the time. I bet they finally did it.",
          },
          prompt:
            "Respond to Maya's counterclaim. Concede what is true, then use evidence to explain why the prank idea does not hold up.",
          help: "Acepta primero la parte verdadera (It is true that... / Although...). Luego usa but o however con una prueba: el registro de seguridad, el peso del portabicicletas o los tornillos.",
          check: {
            min: 20,
            ideas: [
              {
                any: [
                  "security",
                  "van",
                  "locked",
                  "no visitors",
                  "nobody else",
                  "no one else",
                  "only",
                  "300",
                  "heavy",
                  "weigh*",
                  "bolt*",
                  "tool*",
                ],
                clue: C(
                  "Use a fact that makes the prank unlikely: the log, the weight or the bolts.",
                  "Usa un dato que haga poco probable la broma: el registro, el peso o los tornillos.",
                ),
              },
            ],
            connector: ["contrast", "concession"],
          },
          rule: C(
            "Concede first, then rebut: name the true part, then show the evidence the other claim cannot explain.",
            "Primero acepta y luego refuta: nombra la parte verdadera y muestra la evidencia que el otro argumento no puede explicar.",
          ),
          frame: "It is true that ___, but the security log shows ___. Also, the rack ___.",
          model:
            "It is true that your friends joke about it, but the security log shows only the maintenance van came in on Saturday. Also, the rack weighs 300 pounds and was bolted down.",
          keep: "My answer to the other side",
        },
      ],
    },
    {
      id: "ed68-window",
      title: "Case 3: The Open Lab Window",
      art: ["bg-lab", "char-scientist"],
      intro:
        "On Friday at 7:00 a.m., Window 3 in the science lab is wide open. Overnight rain soaked the counter and ruined a seed experiment that took the whole class three weeks. Three groups used the lab on Thursday, and each one says it was not them. This is the Unit's hardest case: more records, more witnesses, and more noise.",
      introEs:
        "El viernes a las 7:00 a.m., la ventana 3 del laboratorio de ciencias está abierta. La lluvia de la noche mojó el mostrador y arruinó un experimento de semillas que le tomó tres semanas a toda la clase. Tres grupos usaron el laboratorio el jueves y cada uno dice que no fue. Este es el caso más difícil de la Unidad: más registros, más testigos y más ruido.",
      outro:
        'Ms. Grant reads your report and sighs. "We opened it for the vinegar smell and forgot it at the bell." Her class adds a new last step to every lab: check the windows. Principal Vega frames the Unit\'s three reports in the front office. "No rumors," she says. "Just evidence."',
      docs: [
        {
          id: "sensor",
          kind: "record",
          title: "Window 3 sensor log (Thursday to Friday)",
          rows: [
            ["Thursday 8:00 a.m.", "Window 3 CLOSED"],
            ["Thursday 2:50 p.m.", "Window 3 OPENED"],
            ["Thursday 2:50 p.m. to Friday 7:05 a.m.", "No change"],
            ["Friday 7:05 a.m.", "Window 3 CLOSED"],
          ],
        },
        {
          id: "schedule",
          kind: "schedule",
          title: "Science lab schedule, Thursday",
          cols: ["Time", "Group", "Activity"],
          rows: [
            ["2:05 to 2:55", "Ms. Grant, 6th period", "Vinegar and baking soda lab (strong smell)"],
            ["3:15 to 4:45", "Robotics Club, Ms. Lin", "Building robot arms"],
            ["6:00", "Custodian", "Locks the lab door"],
          ],
        },
        {
          id: "rain",
          kind: "chart",
          title: "Rainfall on Thursday and Friday",
          unit: "inches of rain",
          bars: [
            { label: "Thu 12-6 p.m.", value: 0 },
            { label: "Thu 6 p.m.-midnight", value: 0.4 },
            { label: "Fri midnight-6 a.m.", value: 0.8 },
          ],
          source: "School weather station",
        },
        {
          id: "lin",
          kind: "interview",
          title: "Interview with the Robotics Club adviser",
          who: "Ms. Lin",
          qa: [
            {
              q: "Did you notice anything in the lab?",
              a: "It felt chilly when we came in at 3:15. I thought the heater was broken, so we wore our jackets.",
            },
            { q: "Anything else?", a: "Robotics is the best club at this school, by far." },
          ],
        },
        {
          id: "marco",
          kind: "witness",
          title: "Statement from a student",
          who: "Marco",
          role: "8th grader",
          said: "Ms. Grant's class is always way too loud. Also, the lab got a new microscope last month.",
        },
      ],
      steps: [
        {
          id: "sort",
          type: "sort",
          docs: ["sensor", "schedule", "rain", "lin", "marco"],
          prompt: "Sort the clues. Which ones help find out who left Window 3 open?",
          help: "Hay mucho ruido en este caso. Para cada pista pregúntate: ¿dice cuándo se abrió o se cerró la ventana, o quién estaba en el laboratorio a esa hora? Si es una opinión o habla de otro tema, no ayuda.",
          cats: CATS,
          reasons: [
            { id: "when", text: "It tells when the window opened or closed" },
            { id: "who", text: "It shows who was in the lab" },
            { id: "opinion", text: "It is an opinion, not a fact" },
            { id: "other", text: "It is about something else" },
          ],
          items: [
            {
              id: "opened",
              text: "The sensor shows Window 3 opened at 2:50 p.m.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "This is a machine record with an exact time. Of what?",
                "Esto es un registro de una máquina con una hora exacta. ¿De qué?",
              ),
            },
            {
              id: "nochange",
              text: "The sensor shows no change until 7:05 a.m. Friday.",
              cat: "relevant",
              reason: "when",
              clue: C(
                "If nothing changed all night, what does that tell you about the window?",
                "Si nada cambió en toda la noche, ¿qué te dice eso sobre la ventana?",
              ),
            },
            {
              id: "grant",
              text: "Ms. Grant's class did a vinegar lab from 2:05 to 2:55.",
              cat: "relevant",
              reason: "who",
              clue: C(
                "Who was in the room at the time on the sensor?",
                "¿Quién estaba en el salón a la hora que marca el sensor?",
              ),
            },
            {
              id: "robotics",
              text: "The Robotics Club used the lab from 3:15 to 4:45.",
              cat: "relevant",
              reason: "who",
              clue: C(
                "This group was in the lab too. Compare its time with the sensor.",
                "Este grupo también estuvo en el laboratorio. Compara su hora con el sensor.",
              ),
            },
            {
              id: "loud",
              text: "Marco says Ms. Grant's class is always too loud.",
              cat: "irrelevant",
              reason: "opinion",
              clue: C(
                "Does being loud say anything about a window? Is it a fact or a judgment?",
                "¿Ser ruidoso dice algo sobre una ventana? ¿Es un dato o un juicio?",
              ),
            },
            {
              id: "best",
              text: "Ms. Lin says robotics is the best club.",
              cat: "irrelevant",
              reason: "opinion",
              clue: C(
                'Can "the best club" be checked with a record?',
                "¿«The best club» se puede comprobar con un registro?",
              ),
            },
            {
              id: "microscope",
              text: "The lab got a new microscope last month.",
              cat: "irrelevant",
              reason: "other",
              clue: C(
                "It happened in the lab, but does it connect to Thursday's window?",
                "Pasó en el laboratorio, pero ¿se relaciona con la ventana del jueves?",
              ),
            },
          ],
          rule: C(
            "Relevant evidence connects to the question in time and place. Opinions and old, unrelated events are noise.",
            "La evidencia relevante se conecta con la pregunta en tiempo y lugar. Las opiniones y los hechos viejos que no tienen relación son ruido.",
          ),
          explain:
            "The sensor log tells when the window opened and that it stayed open, and the schedule shows who was in the lab at those times. The opinions and the microscope do not answer the question.",
        },
        {
          id: "choose",
          type: "choose",
          docs: ["sensor", "schedule", "rain", "lin"],
          prompt: "Which conclusion is best supported by all the evidence?",
          help: "Pon la hora del sensor junto al horario del laboratorio. ¿Qué grupo estaba ahí cuando se abrió la ventana? Revisa también si el sensor muestra algún cambio más tarde y cuándo empezó la lluvia.",
          options: [
            {
              id: "a",
              text: "The Robotics Club opened it and left it open.",
              why: "The club was in the lab and it felt chilly. But compare the time the window opened with the time the club arrived.",
            },
            {
              id: "b",
              text: "The custodian opened it at 6:00 p.m.",
              why: "The custodian was there at 6:00. Does the sensor log show any change at that time?",
            },
            {
              id: "c",
              text: "Ms. Grant's 6th period opened it during the vinegar lab, and no one closed it.",
              ok: true,
              why: "Yes. The sensor time, the schedule and the chilly room all line up.",
            },
            {
              id: "d",
              text: "The storm blew it open during the night.",
              why: "The storm did bring the rain. But check the rain chart and the sensor: which came first?",
            },
          ],
          rule: C(
            "Line up the times from every source. The best conclusion matches the timeline from start to finish.",
            "Ordena las horas de todas las fuentes. La mejor conclusión coincide con la línea de tiempo de principio a fin.",
          ),
          explain:
            "The sensor shows the window opened at 2:50 p.m., during Ms. Grant's vinegar lab (2:05 to 2:55), and never changed until Friday morning. The room was already chilly when the Robotics Club arrived, and no rain fell until after 6 p.m.",
        },
        {
          id: "strongest",
          type: "choose",
          docs: ["sensor", "schedule", "rain", "lin"],
          prompt: "Which single piece of evidence is the strongest for this conclusion?",
          help: "La prueba más fuerte es la que es exacta y no depende de la opinión de nadie. Piensa: ¿cuál da una hora exacta que puedes comparar con el horario?",
          options: [
            {
              id: "a",
              text: "The sensor log",
              ok: true,
              why: "Yes. A machine record with exact times is hard to argue with.",
            },
            {
              id: "b",
              text: "Ms. Lin's memory that the room felt chilly",
              why: "It supports the timeline, but a feeling of cold is not exact. What gives a precise time?",
            },
            {
              id: "c",
              text: "The rainfall chart",
              why: "It explains how the experiment got ruined, but does it tell you who opened the window?",
            },
          ],
          rule: C(
            "Exact, recorded data is usually stronger than memories or feelings.",
            "Los datos exactos y registrados suelen ser más fuertes que los recuerdos o las sensaciones.",
          ),
          explain:
            "The sensor log gives the exact minute the window opened, 2:50 p.m., which falls inside 6th period, and it shows the window stayed open all night.",
        },
        {
          id: "defend",
          type: "write",
          docs: ["sensor", "schedule", "rain"],
          prompt:
            "Write the Unit's final report. State who left the window open, support your claim with the sensor log and the schedule, and explain how the timeline proves it.",
          help: "Escribe dos o tres oraciones. Di quién dejó la ventana abierta. Usa la hora del sensor y el horario, y explica por qué esa hora apunta a ese grupo. Agrega que la ventana nunca se cerró hasta el viernes.",
          check: {
            min: 28,
            ideas: [
              {
                any: ["grant*", "6th period", "sixth period", "vinegar"],
                clue: C(
                  "Say which group left the window open.",
                  "Di qué grupo dejó la ventana abierta.",
                ),
              },
              {
                any: ["2:50", "sensor"],
                clue: C(
                  "Use the exact time from the sensor log.",
                  "Usa la hora exacta del registro del sensor.",
                ),
              },
              {
                any: [
                  "stayed open",
                  "never closed",
                  "no one closed",
                  "nobody closed",
                  "not closed",
                  "no change",
                  "all night",
                  "overnight",
                  "7:05",
                  "until friday",
                ],
                clue: C(
                  "Explain what happened to the window after that.",
                  "Explica qué pasó con la ventana después.",
                ),
              },
            ],
            connector: ["cause"],
            evidence: true,
          },
          rule: C(
            "A full argument gives the claim, the strongest evidence, and reasoning that connects the evidence to the claim step by step.",
            "Un argumento completo da la afirmación, la evidencia más fuerte y un razonamiento que une la evidencia con la afirmación paso a paso.",
          ),
          frame:
            "___ left Window 3 open. The sensor log shows ___, and the schedule shows ___. Because ___, the window ___.",
          model:
            "Ms. Grant's 6th period class left Window 3 open. The sensor log shows it opened at 2:50 p.m., and the schedule shows her vinegar lab ran until 2:55. Because the sensor shows no change until Friday, the window stayed open all night.",
          keep: "My claim and evidence",
        },
        {
          id: "answer",
          type: "write",
          docs: ["sensor", "schedule", "lin"],
          npc: {
            who: "Ms. Grant",
            art: "char-teacher",
            line: "My students always close the windows. The Robotics Club was in there later than us, so they must have left it open.",
          },
          prompt:
            "Respond to Ms. Grant respectfully. Concede what is true about the Robotics Club, then use the timeline to show why the window was already open before they came.",
          help: "Empieza aceptando lo que es verdad (It is true that... / Although...). Luego usa but o however y compara dos horas: cuándo se abrió la ventana según el sensor y cuándo llegó el club. Termina explicando qué significa eso.",
          check: {
            min: 28,
            ideas: [
              {
                any: ["2:50", "sensor"],
                clue: C("Use the time the sensor recorded.", "Usa la hora que registró el sensor."),
              },
              {
                any: [
                  "3:15",
                  "before the club",
                  "before they",
                  "before robotics",
                  "already open",
                  "chilly",
                  "cold",
                ],
                clue: C(
                  "Compare it with when the Robotics Club arrived.",
                  "Compárala con la hora en que llegó el Club de Robótica.",
                ),
              },
            ],
            connector: ["contrast", "concession"],
          },
          rule: C(
            "A respectful rebuttal grants the fair point, then uses precise evidence to show why the conclusion still stands.",
            "Una refutación respetuosa acepta el punto justo y luego usa evidencia precisa para mostrar por qué la conclusión sigue en pie.",
          ),
          frame: "It is true that ___, but the sensor log shows ___, before ___. That means ___.",
          model:
            "It is true that the Robotics Club stayed later, but the sensor log shows the window opened at 2:50 p.m., before the club arrived at 3:15. That means it was already open, and Ms. Lin even said the room felt chilly.",
          keep: "My answer to the other side",
        },
      ],
    },
  ],
};
