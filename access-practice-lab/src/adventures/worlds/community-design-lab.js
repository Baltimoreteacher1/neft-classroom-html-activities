// Adventure World: Community Design Lab. Young designers study a neglected park, a dangerous crosswalk and a crowded
// school lunch area: survey data, community voices, constraints (budget, space), comparing options, then proposing a
// design and answering a counterargument. Pure data; schema: ADVENTURE-SCHEMA (src/adventures/).

const park = {
  id: "forgotten-park",
  title: { en: "The Forgotten Park", es: "El parque olvidado" },
  goal: {
    en: "Use survey data to explain what the community needs most.",
    es: "Usar datos de una encuesta para explicar lo que la comunidad más necesita.",
  },
  keyUse: "Explain",
  domains: ["Reading", "Writing"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-park", "char-dad", "char-amara"],
        speaker: "Tomás Reyes",
        text: {
          en: "Hi, designers! I'm Tomás, a city planner. Hollis Park has a broken swing, no shade and lots of trash. The city wants to fix it, but first we need to know what neighbors want. We asked them in a survey.",
          es: "¡Hola, diseñadores! Soy Tomás, planificador de la ciudad. El parque Hollis tiene un columpio roto, nada de sombra y mucha basura. La ciudad quiere arreglarlo, pero primero necesitamos saber qué quieren los vecinos. Les preguntamos con una encuesta.",
        },
      },
      {
        kind: "read",
        title: { en: "Hollis Park Survey", es: "Encuesta del parque Hollis" },
        text: {
          en: "In a survey, we asked 100 neighbors, “What would make you visit Hollis Park more?” Each person picked one answer. 40 people picked shade trees and benches. 25 people picked new swings and a slide. 20 people picked more trash cans. 10 people picked a basketball court. 5 people picked a dog area. Many people also wrote notes. One grandmother wrote, “It is too hot to sit there in summer.” A boy wrote, “The swing is broken.”",
        },
        glossary: [
          {
            word: "survey",
            en: "a set of questions asked to many people",
            es: "una encuesta; preguntas que se hacen a muchas personas",
          },
          {
            word: "shade",
            en: "a cool place out of the sun",
            es: "sombra; un lugar fresco sin sol",
          },
          {
            word: "neighbors",
            en: "people who live near you",
            es: "vecinos; personas que viven cerca",
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Which facts show what neighbors want MOST? Pick the evidence.",
          es: "¿Qué datos muestran lo que los vecinos quieren MÁS? Elige la evidencia.",
        },
        clues: [
          {
            id: "forty",
            text: { en: "40 out of 100 people picked shade trees and benches." },
            relevant: true,
            why: {
              en: "40 is the biggest number in the survey.",
              es: "40 es el número más grande de la encuesta.",
            },
          },
          {
            id: "hot",
            text: { en: "A grandmother wrote, “It is too hot to sit there in summer.”" },
            relevant: true,
            why: {
              en: "Her note explains WHY shade matters.",
              es: "Su nota explica POR QUÉ importa la sombra.",
            },
          },
          {
            id: "swings",
            text: { en: "25 people picked new swings and a slide." },
            relevant: true,
            why: {
              en: "This is the second biggest choice, so it is important too.",
              es: "Es la segunda opción más grande, así que también es importante.",
            },
          },
          {
            id: "dogs",
            text: { en: "5 people picked a dog area." },
            relevant: false,
            why: {
              en: "This is the smallest number, so it does not show what most people want.",
              es: "Es el número más pequeño, así que no muestra lo que quiere la mayoría.",
            },
          },
          {
            id: "color",
            text: { en: "The planner likes the color green." },
            relevant: false,
            why: {
              en: "This is about one person's taste, not the neighbors' survey.",
              es: "Esto es el gusto de una persona, no la encuesta de los vecinos.",
            },
          },
        ],
        need: 2,
      },
      {
        kind: "respond",
        prompt: {
          en: "Write to Tomás. Tell him what the park needs most, and use a number from the survey as evidence.",
          es: "Escríbele a Tomás. Dile lo que el parque más necesita y usa un número de la encuesta como evidencia.",
        },
        mode: "write",
        frames: [
          { en: "The park needs..." },
          { en: "The survey shows that..." },
          { en: "This is important because..." },
        ],
        wordBank: ["survey", "shade", "trees", "benches", "neighbors", "40", "because"],
        check: {
          minWords: 20,
          needConnectors: ["cause"],
          needAny: [
            ["shade", "trees", "benches"],
            ["40", "survey", "most"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "The park needs shade trees and benches first. The survey shows that 40 out of 100 neighbors picked them. This is important because people said it is too hot to sit there in summer.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "Designers listen to the community first and use numbers as evidence.",
          es: "Los diseñadores escuchan primero a la comunidad y usan números como evidencia.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-park", "char-dad", "char-amara"],
        speaker: "Tomás Reyes",
        text: {
          en: "Welcome to the Design Lab. I'm Tomás Reyes, a planner with the city. Hollis Park has been neglected for years: a broken swing set, cracked paths, almost no shade. The city has money for improvements, and your team is going to help decide how to use it. Good design starts with evidence, not guesses.",
          es: "Bienvenido al Laboratorio de Diseño. Soy Tomás Reyes, planificador de la ciudad. El parque Hollis lleva años abandonado: columpios rotos, caminos agrietados y casi nada de sombra. La ciudad tiene dinero para mejoras, y tu equipo va a ayudar a decidir cómo usarlo. El buen diseño empieza con evidencia, no con suposiciones.",
        },
      },
      {
        kind: "read",
        title: {
          en: "Hollis Park Community Survey Results",
          es: "Resultados de la encuesta del parque Hollis",
        },
        text: {
          en: "The city surveyed 200 residents who live within a ten-minute walk of Hollis Park. Question 1: How often do you visit? Only 18 percent said at least once a week. Question 2: Choose the ONE change that would make you visit more. Shade trees and seating, 38 percent. New play equipment, 27 percent. Repaired, accessible paths, 17 percent. Lighting for evening use, 12 percent. A dog run, 6 percent. Question 3: What keeps you away now? The most common written answers were heat in summer, the broken equipment, and paths that are hard to use with a stroller or wheelchair. Several older residents noted that there is nowhere to rest. Note: residents who use wheelchairs or walkers were a small share of those surveyed, but the city is required to make public park paths accessible.",
        },
        glossary: [
          {
            word: "residents",
            en: "people who live in a place",
            es: "residentes; personas que viven en un lugar",
          },
          {
            word: "accessible",
            en: "easy for everyone to use, including people with disabilities",
            es: "accesible; fácil de usar para todos, incluidas las personas con discapacidad",
          },
          { word: "share", en: "a part of a whole group", es: "una parte de un grupo completo" },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Collect the strongest evidence for what Hollis Park needs first.",
          es: "Reúne la evidencia más fuerte sobre lo que el parque Hollis necesita primero.",
        },
        clues: [
          {
            id: "shade38",
            text: { en: "38% chose shade trees and seating, the top answer." },
            relevant: true,
            why: {
              en: "The largest share of residents chose it.",
              es: "La mayor parte de los residentes lo eligió.",
            },
          },
          {
            id: "heat",
            text: { en: "Heat in summer was a common reason people stay away." },
            relevant: true,
            why: {
              en: "Written answers explain the number: no shade keeps people out.",
              es: "Las respuestas escritas explican el número: la falta de sombra aleja a la gente.",
            },
          },
          {
            id: "access",
            text: {
              en: "Paths are hard to use with strollers or wheelchairs, and the city must make paths accessible.",
            },
            relevant: true,
            why: {
              en: "Only 17% chose paths, but this is a legal requirement and a barrier, so it can't be ignored.",
              es: "Solo el 17% eligió los caminos, pero es un requisito legal y una barrera, así que no se puede ignorar.",
            },
          },
          {
            id: "weekly",
            text: { en: "Only 18% visit at least once a week." },
            relevant: true,
            why: {
              en: "This shows the park is underused, which is the problem a design must solve.",
              es: "Esto muestra que el parque se usa poco, que es el problema que el diseño debe resolver.",
            },
          },
          {
            id: "dog",
            text: { en: "6% chose a dog run." },
            relevant: false,
            why: {
              en: "This is the smallest share, so it's weak evidence for a top priority.",
              es: "Es la parte más pequeña, así que es evidencia débil para una prioridad principal.",
            },
          },
          {
            id: "fun",
            text: { en: "Parks are fun." },
            relevant: false,
            why: {
              en: "This is a general opinion; it doesn't come from the survey or point to a specific need.",
              es: "Es una opinión general; no viene de la encuesta ni señala una necesidad específica.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "respond",
        prompt: {
          en: "Write a short memo to Tomás explaining the park's top two needs. Support each one with evidence from the survey, and explain why a smaller number can still matter.",
          es: "Escribe un memo corto a Tomás explicando las dos necesidades principales del parque. Apoya cada una con evidencia de la encuesta y explica por qué un número más pequeño también puede importar.",
        },
        mode: "write",
        frames: [
          { en: "According to the survey, ..." },
          { en: "In addition, ..." },
          { en: "Although only..., ..." },
        ],
        wordBank: [
          "according to",
          "residents",
          "accessible",
          "percent",
          "priority",
          "although",
          "in addition",
        ],
        check: {
          minWords: 45,
          needConnectors: ["evidence", "addition"],
          needAny: [
            ["shade", "seating", "trees"],
            ["path", "paths", "accessible"],
            ["38", "17", "percent"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "According to the survey, the top need is shade trees and seating, which 38 percent of residents chose. Many people said heat keeps them away in summer. In addition, the paths must be repaired. Although only 17 percent chose paths, people using wheelchairs or strollers cannot use the park now, and the city is required to make paths accessible.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You used percentages and written answers together, and explained why a need can matter even when fewer people choose it.",
          es: "Usaste porcentajes y respuestas escritas juntos, y explicaste por qué una necesidad importa aunque menos personas la elijan.",
        },
      },
    ],
  },
};

const crosswalk = {
  id: "birch-road-crosswalk",
  title: { en: "The Crosswalk on Birch Road", es: "El cruce peatonal de la calle Birch" },
  goal: {
    en: "Listen to different community voices, compare options and recommend one with a reason.",
    es: "Escuchar distintas voces de la comunidad, comparar opciones y recomendar una con una razón.",
  },
  keyUse: "Argue",
  domains: ["Listening", "Reading", "Speaking"],
  final: false,
  book: null,
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-city", "char-dad", "char-sam"],
        speaker: "Tomás Reyes",
        text: {
          en: "Kids cross Birch Road to get to school. Cars drive fast there, and last month a car almost hit a student. The city can pay for ONE fix this year. Let's listen to people who use the crosswalk.",
          es: "Los niños cruzan la calle Birch para llegar a la escuela. Los carros van rápido allí, y el mes pasado un carro casi atropella a un estudiante. La ciudad puede pagar UN solo arreglo este año. Escuchemos a las personas que usan el cruce.",
        },
      },
      {
        kind: "listen",
        script: {
          en: "Crossing guard: Cars come around the curve too fast, and drivers don't see the kids until the last second. Parent: The white lines are so faded you can hardly see them. Store owner: Please don't take away parking in front of my store. My customers need it.",
        },
        transcriptLabel: { en: "Community voices", es: "Voces de la comunidad" },
      },
      {
        kind: "choice",
        prompt: {
          en: "The city's options are: A) bright new crosswalk paint and signs, B) a flashing light that walkers turn on with a button, C) remove four parking spaces to add a wider sidewalk. Which option helps drivers SEE kids and keeps the store's parking?",
          es: "Las opciones de la ciudad son: A) pintura y señales nuevas y brillantes, B) una luz intermitente que los peatones encienden con un botón, C) quitar cuatro espacios de estacionamiento para hacer la acera más ancha. ¿Qué opción ayuda a los conductores a VER a los niños y mantiene el estacionamiento de la tienda?",
        },
        options: [
          {
            text: { en: "B) The flashing light with a button" },
            correct: true,
            feedback: {
              en: "Yes. A flashing light warns drivers coming around the curve, and it doesn't remove parking.",
              es: "Sí. Una luz intermitente avisa a los conductores que vienen por la curva, y no quita estacionamiento.",
            },
          },
          {
            text: { en: "A) New paint and signs" },
            correct: false,
            feedback: {
              en: "Paint helps with the faded lines, but the guard said drivers can't see kids until the last second. Which option catches drivers' eyes more?",
              es: "La pintura ayuda con las líneas borrosas, pero el guardia dijo que los conductores no ven a los niños hasta el último segundo. ¿Qué opción llama más la atención?",
            },
          },
          {
            text: { en: "C) Remove parking for a wider sidewalk" },
            correct: false,
            feedback: {
              en: "Remember what the store owner asked. Does this option keep the parking?",
              es: "Recuerda lo que pidió el dueño de la tienda. ¿Esta opción mantiene el estacionamiento?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Say your recommendation out loud. Tell which option you choose and give two reasons from the community voices.",
          es: "Di tu recomendación en voz alta. Di qué opción eliges y da dos razones de las voces de la comunidad.",
        },
        mode: "say",
        frames: [{ en: "I recommend..." }, { en: "First, ..." }, { en: "Also, ..." }],
        wordBank: ["recommend", "flashing light", "drivers", "curve", "parking", "safe", "because"],
        check: {
          minWords: 22,
          needConnectors: ["cause"],
          needAny: [
            ["recommend", "choose", "should"],
            ["light", "paint", "sidewalk", "option"],
            ["driver", "drivers", "parking", "curve", "kids"],
          ],
        },
        model: {
          en: "I recommend the flashing light. First, it is safer because drivers coming around the curve will see it and slow down. Also, the store owner keeps all the parking spaces for customers.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "Good designers listen to everyone and choose a fix that solves the biggest problem fairly.",
          es: "Los buenos diseñadores escuchan a todos y eligen un arreglo que resuelve el problema más grande de forma justa.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-city", "char-dad", "char-sam"],
        speaker: "Tomás Reyes",
        text: {
          en: "Birch Road is the main walking route to Hollis Middle School, and last month a driver came within a few feet of a sixth grader in the crosswalk. The city's safety budget for this location is $30,000 this year. Your team will hear from the community, weigh three options and make a recommendation to the traffic office.",
          es: "La calle Birch es la ruta principal a pie hacia la escuela Hollis, y el mes pasado un conductor pasó a pocos pies de un estudiante de sexto grado en el cruce. El presupuesto de seguridad de la ciudad para este lugar es de $30,000 este año. Tu equipo escuchará a la comunidad, comparará tres opciones y hará una recomendación a la oficina de tránsito.",
        },
      },
      {
        kind: "listen",
        script: {
          en: "Crossing guard, Ms. Duarte: The problem is the curve. Drivers come around it at thirty-five and they're on top of the crosswalk before they see anyone. Parent, Mr. Osei: The paint is so worn that new drivers don't even know there's a crosswalk. Shop owner, Mrs. Lindqvist: I understand safety comes first, but if you remove the four spaces in front of my bakery, older customers won't be able to park close enough to come in. Student, Jalen: Even when the guard is there, cars don't always stop for her.",
        },
        transcriptLabel: { en: "Community meeting", es: "Reunión de la comunidad" },
      },
      {
        kind: "read",
        title: {
          en: "Traffic Office: Options and Costs",
          es: "Oficina de tránsito: opciones y costos",
        },
        text: {
          en: "Option A, high-visibility crosswalk: thick, reflective white stripes and new warning signs. Estimated cost: $6,000. Makes the crossing easier to see, but does not slow cars by itself. Option B, pedestrian-activated flashing beacons: walkers press a button and bright yellow lights flash on both sides of the road. Estimated cost: $24,000, which includes new paint. In studies across many cities, beacons like these have greatly increased the share of drivers who stop for people in crosswalks. Option C, curb extensions: the sidewalk is built out into the road, which shortens the crossing distance and makes the road look narrower, which tends to slow drivers. Estimated cost: $45,000, and it would remove four parking spaces. Slower speeds matter: a person hit by a car at 20 miles per hour is far more likely to survive than one hit at 40.",
        },
        glossary: [
          {
            word: "high-visibility",
            en: "very easy to see",
            es: "de alta visibilidad; muy fácil de ver",
          },
          {
            word: "pedestrian-activated",
            en: "turned on by a person walking",
            es: "que activa un peatón",
          },
          {
            word: "beacons",
            en: "lights that flash to warn people",
            es: "balizas; luces que parpadean para avisar",
          },
          {
            word: "curb extensions",
            en: "sidewalk corners built out into the street",
            es: "extensiones de la banqueta hacia la calle",
          },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Which option fits the $30,000 budget AND responds to Ms. Duarte's and Jalen's concerns?",
          es: "¿Qué opción cabe en el presupuesto de $30,000 Y responde a las preocupaciones de la señora Duarte y de Jalen?",
        },
        options: [
          {
            text: { en: "Option B, the flashing beacons" },
            correct: true,
            feedback: {
              en: "Yes. At $24,000 it fits the budget, includes new paint, and is designed to get drivers to stop, which is exactly what the guard and Jalen described.",
              es: "Sí. Con $24,000 cabe en el presupuesto, incluye pintura nueva y está diseñada para que los conductores se detengan, justo lo que describieron la guardia y Jalen.",
            },
          },
          {
            text: { en: "Option C, curb extensions" },
            correct: false,
            feedback: {
              en: "Curb extensions do slow drivers, but compare the cost to the budget. Could the city pay for this one this year?",
              es: "Las extensiones sí hacen que los conductores vayan más despacio, pero compara el costo con el presupuesto. ¿Podría la ciudad pagarlo este año?",
            },
          },
          {
            text: { en: "Option A, the high-visibility crosswalk" },
            correct: false,
            feedback: {
              en: "This fixes Mr. Osei's faded paint, but read what it does NOT do. Would it help with drivers who don't stop?",
              es: "Esto arregla la pintura borrosa del señor Osei, pero lee lo que NO hace. ¿Ayudaría con los conductores que no se detienen?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Present your recommendation to the traffic office out loud. Name your option, give evidence from the costs and the community voices, and explain why you did not choose one of the other options.",
          es: "Presenta tu recomendación a la oficina de tránsito en voz alta. Nombra tu opción, da evidencia de los costos y de las voces de la comunidad, y explica por qué no elegiste una de las otras opciones.",
        },
        mode: "say",
        frames: [
          { en: "We recommend..." },
          { en: "This option..." },
          { en: "We did not choose..., because..." },
        ],
        wordBank: [
          "recommend",
          "budget",
          "beacons",
          "curb extensions",
          "pedestrian",
          "concern",
          "however",
        ],
        check: {
          minWords: 45,
          needConnectors: ["cause"],
          needAny: [
            ["recommend", "propose", "should"],
            ["budget", "$", "cost", "24,000", "30,000", "thousand"],
            ["guard", "duarte", "jalen", "osei", "lindqvist", "bakery", "parking"],
          ],
        },
        model: {
          en: "We recommend Option B, the flashing beacons. It costs twenty-four thousand dollars, so it fits the budget and still includes new paint. Ms. Duarte and Jalen said drivers don't stop, and beacons are designed to get drivers to stop. We did not choose curb extensions, because they cost forty-five thousand dollars and would remove the bakery's parking.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You weighed options against a budget and real people's concerns, and explained what you rejected and why.",
          es: "Comparaste opciones con un presupuesto y con las preocupaciones de personas reales, y explicaste lo que descartaste y por qué.",
        },
      },
    ],
  },
};

const lunch = {
  id: "lunch-area",
  title: { en: "The Lunch Area Makeover", es: "La renovación del área de almuerzo" },
  goal: {
    en: "Compare two design options using constraints like budget and space.",
    es: "Comparar dos opciones de diseño usando límites como el presupuesto y el espacio.",
  },
  keyUse: "Argue",
  domains: ["Reading", "Writing"],
  final: false,
  book: {
    templateId: "persuasive-book",
    title: { en: "Our Lunch Area Plan", es: "Nuestro plan para el área de almuerzo" },
  },
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-classroom", "char-dad", "char-amara"],
        speaker: "Tomás Reyes",
        text: {
          en: "At lunch, the outdoor eating area is crowded, and some kids eat standing up. The school has $5,000 to make it better. Two teams made plans. Your job: compare them.",
          es: "En el almuerzo, el área para comer afuera está llena, y algunos niños comen de pie. La escuela tiene $5,000 para mejorarla. Dos equipos hicieron planes. Tu trabajo: compararlos.",
        },
      },
      {
        kind: "read",
        title: { en: "Two Plans", es: "Dos planes" },
        text: {
          en: "The lunch area is small. Right now it has 8 tables, and each table seats 8 students. That is 64 seats, but 90 students eat outside at the same time. Plan 1: Buy 4 more tables for $4,000. That adds 32 seats, so everyone can sit. Plan 2: Buy one big sun cover for $5,000. Then students stay cool, but there are still only 64 seats. The space has room for exactly 4 more tables.",
        },
        glossary: [
          { word: "seats", en: "places to sit", es: "asientos; lugares para sentarse" },
          {
            word: "plan",
            en: "an idea for how to do something",
            es: "un plan; una idea de cómo hacer algo",
          },
        ],
      },
      {
        kind: "order",
        prompt: {
          en: "Put the steps of comparing plans in order.",
          es: "Ordena los pasos para comparar planes.",
        },
        items: [
          { en: "Find the problem." },
          { en: "Read each plan." },
          { en: "Check the cost and the space." },
          { en: "Decide which plan solves the problem best." },
        ],
      },
      {
        kind: "choice",
        prompt: {
          en: "Which plan solves the problem of kids standing up?",
          es: "¿Qué plan resuelve el problema de los niños que comen de pie?",
        },
        options: [
          {
            text: { en: "Plan 1, because 64 + 32 = 96 seats, and 96 is more than 90." },
            correct: true,
            feedback: {
              en: "Correct! You checked the math: 96 seats is enough for 90 students, and $4,000 fits the budget.",
              es: "¡Correcto! Revisaste la cuenta: 96 asientos alcanzan para 90 estudiantes, y $4,000 cabe en el presupuesto.",
            },
          },
          {
            text: { en: "Plan 2, because the sun cover costs more." },
            correct: false,
            feedback: {
              en: "Costing more doesn't make a plan better. Count the seats in Plan 2. Do 90 students fit?",
              es: "Costar más no hace que un plan sea mejor. Cuenta los asientos del Plan 2. ¿Caben 90 estudiantes?",
            },
          },
          {
            text: { en: "Neither plan helps." },
            correct: false,
            feedback: {
              en: "Add the new seats in Plan 1 to the 64 seats now. Is that enough for 90?",
              es: "Suma los asientos nuevos del Plan 1 a los 64 de ahora. ¿Alcanza para 90?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Write which plan is better. Compare the two plans with “but” or “however,” and use numbers.",
          es: "Escribe qué plan es mejor. Compara los dos planes con «but» o «however» y usa números.",
        },
        mode: "write",
        frames: [
          { en: "Plan 1 gives..." },
          { en: "Plan 2 keeps students cool, but..." },
          { en: "I think..." },
        ],
        wordBank: ["seats", "students", "tables", "budget", "but", "however", "enough"],
        check: {
          minWords: 22,
          needConnectors: ["contrast"],
          needAny: [
            ["seats", "tables"],
            ["96", "90", "64", "32", "4,000", "5,000"],
          ],
        },
        model: {
          en: "Plan 1 gives 96 seats, which is enough for all 90 students. Plan 2 keeps students cool, but there are still only 64 seats. I think Plan 1 is better because nobody has to stand.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You compared plans using the problem, the cost and the space, and showed your math.",
          es: "Comparaste planes usando el problema, el costo y el espacio, y mostraste tu cuenta.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-classroom", "char-dad", "char-amara"],
        speaker: "Tomás Reyes",
        text: {
          en: "The school asked the Design Lab for help: the outdoor lunch area is overcrowded, it bakes in the sun from April to June, and the student council has $8,000 to spend. Two student teams submitted proposals. Your job is to compare them against the constraints and decide which is stronger, or whether a combination works.",
          es: "La escuela pidió ayuda al Laboratorio de Diseño: el área de almuerzo al aire libre está llena, se calienta mucho con el sol de abril a junio, y el consejo estudiantil tiene $8,000 para gastar. Dos equipos de estudiantes presentaron propuestas. Tu trabajo es compararlas con los límites y decidir cuál es más fuerte, o si una combinación funciona.",
        },
      },
      {
        kind: "read",
        title: { en: "Proposals and Constraints", es: "Propuestas y límites" },
        text: {
          en: "Constraints: budget $8,000; the paved area fits a maximum of 14 tables; 110 students eat outside during the largest lunch period. Current setup: 10 tables seating 8 each, for 80 seats. Proposal 1, More Seating: add 4 tables at $1,000 each, raising capacity to 112 seats. Total cost $4,000. Remaining budget could go to recycling and trash stations, $1,200. Proposal 2, Shade First: install two shade sails over half the area at $3,500 each, total $7,000, and keep 10 tables. Team 2 cites the student survey, where 61% of students said heat is their biggest complaint, compared with 34% who named crowding. Nurse's note: on hot days last spring, several students came to the nurse with headaches after eating outdoors.",
        },
        glossary: [
          {
            word: "constraints",
            en: "limits a design must stay within",
            es: "límites o restricciones que un diseño debe respetar",
          },
          { word: "capacity", en: "how many something can hold", es: "capacidad; cuántos caben" },
          {
            word: "shade sails",
            en: "large pieces of cloth stretched overhead to block sun",
            es: "velas de sombra; telas grandes que tapan el sol",
          },
        ],
      },
      {
        kind: "clues",
        prompt: {
          en: "Which facts matter most when comparing the proposals?",
          es: "¿Qué datos importan más al comparar las propuestas?",
        },
        clues: [
          {
            id: "capacity",
            text: { en: "Proposal 1 raises seating to 112, enough for 110 students." },
            relevant: true,
            why: {
              en: "It shows Proposal 1 fully solves crowding.",
              es: "Muestra que la Propuesta 1 resuelve por completo el problema de espacio.",
            },
          },
          {
            id: "heat61",
            text: { en: "61% of students named heat as the biggest complaint." },
            relevant: true,
            why: {
              en: "It's the strongest evidence for Proposal 2.",
              es: "Es la evidencia más fuerte a favor de la Propuesta 2.",
            },
          },
          {
            id: "nurse",
            text: { en: "Students went to the nurse with headaches on hot days." },
            relevant: true,
            why: {
              en: "It shows heat is a health issue, not just comfort.",
              es: "Muestra que el calor es un tema de salud, no solo de comodidad.",
            },
          },
          {
            id: "combo",
            text: { en: "4 tables ($4,000) plus one shade sail ($3,500) = $7,500, under budget." },
            relevant: true,
            why: {
              en: "It shows a combined design fits the constraints.",
              es: "Muestra que un diseño combinado cabe dentro de los límites.",
            },
          },
          {
            id: "color",
            text: { en: "Team 2's poster was more colorful." },
            relevant: false,
            why: {
              en: "The poster's look doesn't change what either design does.",
              es: "El aspecto del cartel no cambia lo que hace cada diseño.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "respond",
        prompt: {
          en: "Write a comparison for the student council. Explain one strength and one weakness of each proposal using the constraints, then recommend Proposal 1, Proposal 2 or a combination, and justify it.",
          es: "Escribe una comparación para el consejo estudiantil. Explica una fortaleza y una debilidad de cada propuesta usando los límites, luego recomienda la Propuesta 1, la 2 o una combinación, y justifícalo.",
        },
        mode: "write",
        frames: [
          { en: "Proposal 1 solves..., but..." },
          { en: "On the other hand, Proposal 2..." },
          { en: "We recommend..." },
        ],
        wordBank: [
          "constraints",
          "capacity",
          "budget",
          "on the other hand",
          "whereas",
          "combination",
          "recommend",
        ],
        check: {
          minWords: 55,
          needConnectors: ["contrast", "stance"],
          needAny: [
            ["proposal 1", "seating", "tables"],
            ["proposal 2", "shade", "heat"],
            ["$", "budget", "112", "61", "7,500", "8,000"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "Proposal 1 solves crowding, because 112 seats is enough for 110 students, but it does nothing about the heat. On the other hand, Proposal 2 answers the top complaint, since 61% of students named heat, but kids would still stand. We recommend a combination: four tables and one shade sail cost $7,500, which is under the $8,000 budget. The council should fund it because it addresses both problems.",
        },
      },
      {
        kind: "checkpoint",
        text: {
          en: "You compared designs against real constraints and found a solution that uses the strengths of both.",
          es: "Comparaste diseños con límites reales y encontraste una solución que usa las fortalezas de ambos.",
        },
      },
    ],
  },
};

const council = {
  id: "council-pitch",
  title: {
    en: "Final Demonstration: Pitch to the Council",
    es: "Demostración final: Presentación al concejo",
  },
  goal: {
    en: "Propose a park design, support it with evidence, and respond to a counterargument respectfully.",
    es: "Proponer un diseño para el parque, apoyarlo con evidencia y responder a un contraargumento con respeto.",
  },
  keyUse: "Argue",
  domains: ["Listening", "Reading", "Writing"],
  final: true,
  book: {
    templateId: "evidence-argument",
    title: { en: "A Better Hollis Park", es: "Un mejor parque Hollis" },
  },
  bands: {
    "3-5": [
      {
        kind: "story",
        art: ["bg-park", "char-dad", "char-amara", "char-sam"],
        speaker: "Tomás Reyes",
        text: {
          en: "Big day! The city council will choose a plan for Hollis Park. You will write your proposal. But one council member has a different idea. A strong designer answers other ideas with respect.",
          es: "¡Gran día! El concejo de la ciudad va a elegir un plan para el parque Hollis. Vas a escribir tu propuesta. Pero una concejala tiene otra idea. Un buen diseñador responde a otras ideas con respeto.",
        },
        listen: true,
      },
      {
        kind: "read",
        title: { en: "Hollis Park Budget", es: "Presupuesto del parque Hollis" },
        text: {
          en: "The city has $50,000 for Hollis Park. That is the whole budget, so the city cannot buy everything. Here are the costs. Ten shade trees and six benches: $20,000. A new swing set and slide: $25,000. Fixing the broken path: $15,000. A basketball court: $40,000. Trees take a few years to grow big, so the city could also add one shade cover over the benches for $10,000. The council will vote on one plan next week.",
        },
        glossary: [
          {
            word: "budget",
            en: "the amount of money you can spend",
            es: "presupuesto; el dinero que puedes gastar",
          },
          {
            word: "costs",
            en: "how much things are, in money",
            es: "costos; cuánto cuestan las cosas",
          },
        ],
      },
      {
        kind: "listen",
        script: {
          en: "Council member Ortiz: I think we should build a basketball court. Teenagers have nowhere to play in this neighborhood. A court would bring them to the park.",
        },
        transcriptLabel: {
          en: "What Council Member Ortiz says",
          es: "Lo que dice la concejala Ortiz",
        },
      },
      {
        kind: "clues",
        prompt: {
          en: "Pick the evidence you can use to answer Council Member Ortiz.",
          es: "Elige la evidencia que puedes usar para responder a la concejala Ortiz.",
        },
        clues: [
          {
            id: "court-cost",
            text: { en: "The basketball court costs $40,000." },
            relevant: true,
            why: {
              en: "It would use $40,000 of the $50,000, leaving only $10,000: not enough for trees and benches ($20,000) or swings ($25,000).",
              es: "Usaría $40,000 de los $50,000 y quedarían solo $10,000: no alcanza para árboles y bancas ($20,000) ni para columpios ($25,000).",
            },
          },
          {
            id: "survey40",
            text: { en: "40 out of 100 neighbors picked shade trees and benches." },
            relevant: true,
            why: {
              en: "This shows what most neighbors asked for.",
              es: "Esto muestra lo que la mayoría de los vecinos pidió.",
            },
          },
          {
            id: "court10",
            text: { en: "Only 10 out of 100 neighbors picked a basketball court." },
            relevant: true,
            why: {
              en: "Fewer people asked for a court in the survey.",
              es: "Menos personas pidieron una cancha en la encuesta.",
            },
          },
          {
            id: "orange",
            text: { en: "Basketballs are orange." },
            relevant: false,
            why: {
              en: "True, but it does not help decide what the park needs.",
              es: "Es cierto, pero no ayuda a decidir lo que necesita el parque.",
            },
          },
        ],
        need: 2,
      },
      {
        kind: "choice",
        prompt: {
          en: "Which is the most respectful way to answer Council Member Ortiz?",
          es: "¿Cuál es la forma más respetuosa de responder a la concejala Ortiz?",
        },
        options: [
          {
            text: {
              en: "It is true that teens need a place to play. However, the survey shows most neighbors want shade first.",
            },
            correct: true,
            feedback: {
              en: "Yes. You agreed with the true part, then gave evidence for your plan.",
              es: "Sí. Aceptaste la parte verdadera y luego diste evidencia para tu plan.",
            },
          },
          {
            text: { en: "That is a bad idea." },
            correct: false,
            feedback: {
              en: "This is not respectful, and it has no evidence. Find the answer that agrees with something first.",
              es: "Esto no es respetuoso y no tiene evidencia. Busca la respuesta que primero está de acuerdo con algo.",
            },
          },
          {
            text: { en: "Okay, let's build the court." },
            correct: false,
            feedback: {
              en: "This gives up your plan without using your evidence. What did the survey say most people want?",
              es: "Esto abandona tu plan sin usar tu evidencia. ¿Qué dijo la encuesta que quiere la mayoría?",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration! Write your proposal for Hollis Park. Say what to build, give evidence from the survey and the budget, and answer Council Member Ortiz with respect.",
          es: "¡Tu demostración final! Escribe tu propuesta para el parque Hollis. Di qué construir, da evidencia de la encuesta y del presupuesto, y responde a la concejala Ortiz con respeto.",
        },
        mode: "write",
        frames: [
          { en: "I propose..." },
          { en: "The survey shows..." },
          { en: "It is true that..., however..." },
        ],
        wordBank: [
          "propose",
          "shade trees",
          "benches",
          "swings",
          "budget",
          "survey",
          "however",
          "it is true that",
        ],
        check: {
          minWords: 45,
          needConnectors: ["stance", "contrast"],
          needAny: [
            ["shade", "trees", "benches", "swings"],
            ["$", "budget", "40", "50,000", "20,000", "survey"],
            ["court", "ortiz", "teens", "teenagers"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "I propose shade trees, benches and a new swing set for Hollis Park. The survey shows that 40 out of 100 neighbors want shade and benches. These cost $20,000 and the swings cost $25,000, so they fit the $50,000 budget. It is true that teens need a place to play. However, a court costs $40,000, and only 10 neighbors asked for one.",
        },
      },
    ],
    "6-8": [
      {
        kind: "story",
        art: ["bg-park", "char-dad", "char-amara", "char-sam"],
        speaker: "Tomás Reyes",
        text: {
          en: "This is it: the city council meets tonight to vote on the Hollis Park plan, and your team gets three minutes of public comment, followed by a written proposal for the record. One council member has already come out for a different plan. A persuasive designer doesn't ignore the other side; they answer it.",
          es: "Llegó el momento: el concejo de la ciudad se reúne esta noche para votar el plan del parque Hollis, y tu equipo tiene tres minutos de comentario público, seguidos de una propuesta escrita para el registro. Una concejala ya apoyó otro plan. Un diseñador convincente no ignora la otra postura; la responde.",
        },
        listen: true,
      },
      {
        kind: "read",
        title: {
          en: "Hollis Park: Budget and Options",
          es: "Parque Hollis: presupuesto y opciones",
        },
        text: {
          en: "Available funds: $120,000. Cost estimates from the parks department: shade trees and seating, $35,000; new accessible play equipment, $55,000; repaired, accessible paths, $25,000; evening lighting, $30,000; a full-size basketball court, $90,000. Notes: newly planted shade trees take several years to provide much shade, so the department recommends adding a shade structure over seating for $15,000 in the meantime. Accessible paths are required by law if the city makes major improvements to the park. Maintenance: a basketball court needs resurfacing about every ten years; trees need watering for their first two to three summers. Any money left over stays in the parks fund for future projects. The council may also apply for a state recreation grant next year, which could pay for one additional large project, but that money is not guaranteed.",
        },
        glossary: [
          {
            word: "estimates",
            en: "careful guesses about cost",
            es: "estimaciones; cálculos aproximados del costo",
          },
          {
            word: "in the meantime",
            en: "during the time before something happens",
            es: "mientras tanto",
          },
          {
            word: "maintenance",
            en: "work to keep something in good condition",
            es: "mantenimiento",
          },
          {
            word: "resurfacing",
            en: "putting a new top layer on a surface",
            es: "repavimentar; poner una capa nueva",
          },
        ],
      },
      {
        kind: "listen",
        script: {
          en: "Council Member Ortiz: I respect the survey, but surveys capture the people who answer surveys. Teenagers in this neighborhood have nowhere to go after school, and when young people have nowhere to go, everyone loses. A basketball court would bring them into the park and make it busier and safer in the evening. I'd rather build one great thing than five small ones.",
        },
        transcriptLabel: {
          en: "Council Member Ortiz's argument",
          es: "El argumento de la concejala Ortiz",
        },
      },
      {
        kind: "clues",
        prompt: {
          en: "Choose the evidence that best answers Council Member Ortiz's argument.",
          es: "Elige la evidencia que mejor responde al argumento de la concejala Ortiz.",
        },
        clues: [
          {
            id: "court-budget",
            text: { en: "The court costs $90,000 of the $120,000, leaving $30,000." },
            relevant: true,
            why: {
              en: "After a court, the city couldn't afford both required paths ($25,000) and shade with seating ($35,000).",
              es: "Después de la cancha, la ciudad no podría pagar los caminos obligatorios ($25,000) y la sombra con asientos ($35,000).",
            },
          },
          {
            id: "paths-law",
            text: { en: "Accessible paths are required by law with major improvements." },
            relevant: true,
            why: {
              en: "Any plan must include paths, which limits what else fits.",
              es: "Todo plan debe incluir caminos, lo que limita lo demás que cabe.",
            },
          },
          {
            id: "shade38",
            text: { en: "38% of residents chose shade and seating; heat keeps people away." },
            relevant: true,
            why: {
              en: "It's the community's top request and the main reason the park is empty.",
              es: "Es la petición principal de la comunidad y la razón principal de que el parque esté vacío.",
            },
          },
          {
            id: "lighting",
            text: { en: "Evening lighting costs $30,000." },
            relevant: true,
            why: {
              en: "Lighting answers Ortiz's concern about evening safety at a lower cost than a court.",
              es: "La iluminación responde a la preocupación de Ortiz por la seguridad en la noche a menor costo que una cancha.",
            },
          },
          {
            id: "nba",
            text: { en: "Professional basketball is popular on TV." },
            relevant: false,
            why: {
              en: "Popularity on TV says nothing about this neighborhood's needs or this budget.",
              es: "La popularidad en la tele no dice nada de las necesidades de este barrio ni de este presupuesto.",
            },
          },
        ],
        need: 3,
      },
      {
        kind: "choice",
        prompt: {
          en: "Which response to the counterargument is strongest?",
          es: "¿Qué respuesta al contraargumento es la más fuerte?",
        },
        options: [
          {
            text: {
              en: "Council Member Ortiz is right that teens need a place, and surveys miss some voices. Even so, a court would use $90,000, leaving too little for the paths the law requires.",
            },
            correct: true,
            feedback: {
              en: "Strongest: you conceded her valid point, including her critique of surveys, then answered with evidence she can't dismiss.",
              es: "La más fuerte: reconociste su punto válido, incluida su crítica a las encuestas, y luego respondiste con evidencia que ella no puede descartar.",
            },
          },
          {
            text: { en: "The survey proves she's wrong, so we don't need to discuss teenagers." },
            correct: false,
            feedback: {
              en: "She just argued that surveys miss people, so leaning only on the survey doesn't answer her. Which reply uses evidence beyond the survey?",
              es: "Ella acaba de decir que las encuestas dejan fuera a algunas personas, así que apoyarte solo en la encuesta no le responde. ¿Qué respuesta usa evidencia más allá de la encuesta?",
            },
          },
          {
            text: { en: "Basketball courts attract trouble." },
            correct: false,
            feedback: {
              en: "This is an unsupported claim about teens, and it isn't respectful. Look for a reply that concedes something and uses the budget.",
              es: "Es una afirmación sin apoyo sobre los adolescentes, y no es respetuosa. Busca una respuesta que reconozca algo y use el presupuesto.",
            },
          },
        ],
      },
      {
        kind: "respond",
        prompt: {
          en: "Your final demonstration. Write your proposal for the council record: state your design and its total cost, support it with at least two pieces of evidence, respond to Council Member Ortiz's counterargument by conceding what is valid and answering with evidence, and end with a clear call to action.",
          es: "Tu demostración final. Escribe tu propuesta para el registro del concejo: di tu diseño y su costo total, apóyalo con al menos dos evidencias, responde al contraargumento de la concejala Ortiz reconociendo lo válido y respondiendo con evidencia, y termina con un llamado claro a la acción.",
        },
        mode: "write",
        frames: [
          { en: "We propose..., for a total of..." },
          { en: "According to..." },
          { en: "Council Member Ortiz argues that... It is true that... However, ..." },
          { en: "We urge the council to..." },
        ],
        wordBank: [
          "propose",
          "total cost",
          "accessible",
          "required by law",
          "it is true that",
          "however",
          "in the meantime",
          "we urge",
        ],
        check: {
          minWords: 90,
          needConnectors: ["stance", "evidence", "concession", "contrast"],
          needAny: [
            ["shade", "seating", "paths", "lighting", "play equipment"],
            ["$", "120,000", "90,000", "total"],
            ["ortiz", "court", "teens", "teenagers"],
            ["urge", "vote", "approve", "ask the council"],
          ],
          evidenceFrom: "clues",
        },
        model: {
          en: "We propose shade trees and seating, a shade structure, accessible paths and evening lighting, for a total of $105,000. According to the city survey, 38 percent of residents chose shade and seating, and heat is the main reason people stay away. Accessible paths are also required by law. Council Member Ortiz argues that teenagers need a place to go. It is true that teens deserve space, and surveys can miss their voices. However, a court would cost $90,000, leaving only $30,000, which is not enough for the required paths and shade. Our lighting would make the park safer in the evening for everyone, including teens. We urge the council to approve this plan. The city should also apply for the state grant to fund a court later.",
        },
      },
    ],
  },
};

export default {
  id: "community-design-lab",
  title: { en: "Community Design Lab", es: "Laboratorio de Diseño Comunitario" },
  tagline: {
    en: "Listen to the neighborhood, weigh the options, make the case.",
    es: "Escucha al barrio, compara las opciones, defiende tu propuesta.",
  },
  theme: {
    bg: "bg-park",
    accent: "#2f7a3b",
    soft: "#e6f4e8",
    ink: "#1d4a24",
    hero: ["char-amara", "char-sam"],
  },
  intro: {
    en: "Your neighborhood has places that need help: a forgotten park, a dangerous crosswalk and a crowded lunch area. As a young designer, you will study real data, listen to the people who use these places, and argue for the best plan. City planner Tomás Reyes will guide your team.",
    es: "Tu barrio tiene lugares que necesitan ayuda: un parque olvidado, un cruce peatonal peligroso y un área de almuerzo llena. Como joven diseñador, vas a estudiar datos reales, escuchar a las personas que usan estos lugares y defender el mejor plan. El planificador Tomás Reyes guiará a tu equipo.",
  },
  guide: { name: "Tomás Reyes", art: "char-dad" },
  missions: [park, crosswalk, lunch, council],
};
