// Grades 6-8 publisher pass, Listening batch 3a: data briefings, clarification, hearings and paired sources.
// Original EduWonderLab scripts. Every dataset, interview and speaker below is fictional and labeled as such.
export default [
  {
    id: "l-b-sensor-briefing",
    level: "B",
    gw: "g67-load",
    strand: "Science and data talks",
    title: "Sensor Briefing: What the Data Shows",
    skill: "Deciding which claim a short data briefing really supports",
    dir: "Listen to a student briefing about a classroom sound sensor. The readings are a made-up sample for practice. Then choose the best answer.",
    q: "Which claim do the readings in the briefing support?",
    script:
      "Dana: Our class put a sound sensor in the hallway for five school days. Each day, it saved the loudest moment, measured in decibels. On Monday the peak was 72. On Tuesday it was 75. On Wednesday it was 88. On Thursday it was 74, and on Friday it was 73. Wednesday stands out, because that was the day of the fire drill. Before we say that hallways are loud on Wednesdays, we need more weeks of readings. One week from one hallway cannot show a pattern. Also, the sensor kept only the single loudest moment, not the average. So our claim has limits. On the day of the drill, the loudest moment was much higher than on the other four days.",
    opts: [
      "On the drill day, the loudest moment was higher than on the other four days.",
      "Hallways at this school are always louder on Wednesdays than on other days.",
      "The hallway was quiet for most of Wednesday and then very loud for a minute.",
      "Fire drills make every hallway in a school louder than any ordinary school day.",
    ],
    why: [
      "Dana says one week from one hallway cannot show a pattern, so the briefing does not support a claim about every Wednesday.",
      "The sensor kept only the single loudest moment, so the briefing says nothing about how loud the rest of the day was.",
      "Only one hallway and one drill were measured, so the briefing cannot say what happens in every hallway.",
    ],
    vocab: [
      [
        "sensor",
        "a device that measures something, such as sound or heat",
        "sensor: un dispositivo que mide algo, como el sonido o el calor",
      ],
      [
        "peak",
        "the highest reading in a period of time",
        "pico: la lectura más alta en un período de tiempo",
      ],
      [
        "pattern",
        "something that happens again in a regular way",
        "patrón: algo que se repite de manera regular",
      ],
    ],
    frames: [
      "The data shows that ___, but it does not show that ___.",
      "We need more ___ before we can say ___.",
    ],
    focus: [
      "the five daily peak readings",
      "the day that stands out and the reason given",
      "the limits Dana names",
    ],
    correct:
      "Yes. Dana's claim stays inside her data: on the drill day the peak was higher than on the other four days. She names the limits herself.",
    hint: "Listen for what Dana says she cannot show with one week and one hallway. A supported claim stays inside those limits.",
    wida: ["Inform: interpret a data briefing", "Notice limiting language such as only and cannot"],
    es: [
      "Decidir qué afirmación respaldan de verdad los datos de un informe breve",
      "Escucha un informe de una estudiante sobre un sensor de sonido en el salón. Las lecturas son una muestra inventada para practicar. Luego elige la mejor respuesta.",
    ],
    teacher: {
      use: "Science or data-literacy lesson; pair with the Reading Room lesson on what a sensor can and cannot tell us.",
      prompt: "Which words in the briefing marked the limits of the claim?",
      challenge:
        "Ask students to write one additional measurement that would let Dana make a stronger claim.",
    },
  },
  {
    id: "l-a-translation-desk-clarify",
    level: "A",
    strand: "Everyday school conversations",
    title: "At the Translation Desk",
    skill: "Following a clarifying conversation and finding what changed",
    dir: "Listen to a volunteer at a family night translation desk. The people in this talk are made up. Then choose the best answer.",
    q: "What changed about the parent meeting?",
    script:
      "Volunteer: Welcome to the translation desk. How can I help you? Mr. Reyes: I have a paper that says the parent meeting moved. Volunteer: Let me check that I understand. You want to know the new day and the new place? Mr. Reyes: Yes, please. Volunteer: The paper says the meeting moved from Tuesday to Thursday. It still starts at six o'clock, but it will be in the library instead of the gym. Mr. Reyes: So the meeting is Thursday, at six, in the library? Volunteer: Yes, that is right. I will write it down for you in both languages, so you can show your family.",
    opts: [
      "The day and the room changed, but the start time stayed the same.",
      "The start time and the room changed, but the day stayed the same.",
      "Only the day changed, and the meeting is still in the gym.",
    ],
    why: [
      "The volunteer says the meeting still starts at six o'clock, so the start time did not change.",
      "The paper says the meeting will be in the library instead of the gym, so the room did change.",
    ],
    vocab: [
      [
        "volunteer",
        "a person who helps without being paid",
        "voluntario: una persona que ayuda sin recibir pago",
      ],
      [
        "clarify",
        "to make something clear by checking it",
        "aclarar: hacer algo claro al revisarlo",
      ],
    ],
    frames: ["Let me check that I understand: ___.", "The meeting moved from ___ to ___."],
    focus: [
      "the words moved from and instead of",
      "what stayed the same",
      "how the volunteer checks the message",
    ],
    correct:
      "Yes. The meeting moved from Tuesday to Thursday and from the gym to the library, and it still starts at six o'clock.",
    hint: "Listen for what changed and for the words still starts. One thing stayed the same.",
    wida: ["Narrate: follow a short conversation", "Notice phrases that check understanding"],
    es: [
      "Seguir una conversación en la que se aclara un mensaje y encontrar qué cambió",
      "Escucha a una voluntaria en una mesa de traducción de la noche familiar. Las personas de esta conversación son inventadas. Luego elige la mejor respuesta.",
    ],
    teacher: {
      use: "Welcome-week or family-night preparation; pair with the Reading Room story At the Translation Desk.",
      prompt: "How did the volunteer make sure Mr. Reyes understood the message?",
    },
  },
  {
    id: "l-c-courtyard-hearing",
    level: "C",
    gw: "g78-load",
    strand: "Hearings and debates",
    type: "constructed",
    title: "Listen and Respond: The Courtyard Hearing",
    skill: "Choosing a position and naming one piece of evidence with its limit",
    dir: "Listen to a made-up student council hearing. Then write or say three or four sentences that tell which proposal you would fund, one piece of evidence, and one limit of that evidence.",
    q: "Which proposal should the council fund: shade sails or picnic tables? Use one piece of evidence a speaker gave, and tell one limit of that evidence.",
    script:
      "Chair: The student council has nine hundred dollars for the courtyard. We will hear two proposals. Priya: I propose shade sails over the south side. I asked forty students at lunch, and twenty-seven said the courtyard is too hot to sit in by noon. Marcus: I propose four picnic tables. Right now about thirty students sit on the ground. I counted them on two lunch days. Priya: Tables in full sun will still be too hot. Marcus: That may be true. I did not measure the temperature, and my count covers only two days. Priya: My survey asks how students feel, not how hot it is. Chair: Let me restate. Priya's evidence is a survey of forty students. Marcus's evidence is a two day count. Neither speaker measured temperature.",
    responseLabel: "Your response",
    frames: [
      "I would fund ___ because ___.",
      "The evidence is ___, but a limit is ___.",
      "Another speaker could respond that ___.",
    ],
    focus: [
      "each speaker's proposal",
      "each speaker's evidence",
      "what each speaker admits the evidence cannot show",
    ],
    models: {
      A: "I would fund the shade sails. Priya asked forty students, and twenty-seven said it is too hot. She asked how students feel, not the real heat.",
      B: "I would fund the shade sails because, according to Priya, twenty-seven of forty students said the courtyard is too hot by noon. A limit is that her survey shows how students feel, not the temperature.",
      C: "I would fund the picnic tables, even though Marcus counted students on only two days. About thirty students sit on the ground, and that count describes a need that tables would meet directly. A limit is that two days may not be typical, so I would want one more week of counts. Priya could respond that heat matters too, and that is fair.",
    },
    criteria: [
      "I say which proposal I would fund.",
      "I use one piece of evidence that a speaker really gave, such as a survey result or a count.",
      "I tell one limit of that evidence, using a word such as but, only, or limit.",
    ],
    modelNotes: {
      A: "Three short sentences still do all three jobs: a choice, one piece of evidence, and one limit. Notice the contrast between how students feel and the real heat.",
      B: '"According to Priya" shows the evidence came from the talk, and "A limit is" names the weakness plainly.',
      C: "This response picks the less popular side and still names a limit, then adds what would make the evidence stronger. Length is not the goal; notice how it answers the other speaker.",
    },
    vocab: [
      ["proposal", "a plan that someone suggests", "propuesta: un plan que alguien sugiere"],
      [
        "evidence",
        "facts or information that support a claim",
        "evidencia: datos o información que apoyan una afirmación",
      ],
      [
        "limit",
        "something that the evidence cannot show",
        "límite: algo que la evidencia no puede mostrar",
      ],
    ],
    correct:
      "Response saved. A strong response names a choice, uses evidence a speaker actually gave, and tells one honest limit of that evidence. Either proposal can be supported.",
    hint: "You can fund either proposal. Choose one piece of evidence from the talk, then ask what that evidence does not tell you.",
    support:
      "Start with your choice. Then write According to ___, and add the number the speaker gave. Finish with A limit is ___.",
    extension: "Say what one more piece of evidence the council should collect before voting.",
    wida: [
      "Argue: support a position with evidence and a limit",
      "Evaluate evidence from two speakers",
    ],
    es: [
      "Elegir una postura y nombrar una evidencia con su límite",
      "Escucha una audiencia inventada del consejo estudiantil. Luego escribe o di tres o cuatro oraciones que digan qué propuesta financiarías, una evidencia y un límite de esa evidencia.",
    ],
    teacher: {
      use: "Civics, advisory, or science lesson on evidence; pair with the Reading Room lesson The Courtyard Hearing Minutes.",
      lower:
        "Give a two-column chart (Priya / Marcus) with the proposal and the evidence already filled in, and let students add the limit.",
      challenge:
        "Ask students to propose the cheapest extra measurement that would settle the disagreement.",
      prompt: "Which limit would change your vote if it turned out to be serious?",
    },
  },
  {
    id: "l-c-bridge-load-compare",
    level: "C",
    gw: "g78-load",
    strand: "Science and data talks",
    type: "multiSelect",
    title: "Bridge Test: Is It a Fair Comparison?",
    skill: "Choosing the statements a class discussion supports about a fair test",
    dir: "Listen to a made-up class discussion about two model bridges. Then choose the TWO statements that the discussion supports.",
    q: "Which TWO statements does the discussion support?",
    script:
      "Mr. Chen: Team Rivera, tell us your result. Rivera: Our bridge was made of index cards, and the span was thirty centimeters. It held fourteen textbooks before it bent. Osei: Ours held ten textbooks. Mr. Chen: So is the Rivera design stronger? Osei: Not necessarily. Our span was forty centimeters, ten centimeters longer, and we also added straws to the cards. Mr. Chen: Good thinking. A fair test changes one thing at a time. Right now the two bridges differ in span and in material, so we cannot tell which change made the difference. Next time, keep the span the same, change only the material, and test each design three times. Then compare the typical result.",
    opts: [
      "The two bridges differed in span and in material, so the comparison was not fair.",
      "A better plan changes only one thing and repeats the test for each design.",
      "The Rivera bridge is stronger, because it held more textbooks than the Osei bridge.",
      "A longer span always makes a bridge hold more weight than a shorter span.",
      "Straws are a weaker material than index cards, so they should not be used.",
    ],
    ans: 2,
    why: [
      "The teacher says the two bridges differ in more than one way, so the result does not show that one design is stronger.",
      "The talk never says a longer span helps; the longer span is listed as one of the differences that confuses the test.",
      "Nobody tested straws alone, so the discussion cannot say whether straws are weaker or stronger than cards.",
    ],
    vocab: [
      [
        "span",
        "the distance a bridge crosses from one support to the other",
        "luz: la distancia que cruza un puente entre un apoyo y el otro",
      ],
      [
        "fair test",
        "a test that changes only one thing at a time",
        "prueba justa: una prueba que cambia una sola cosa a la vez",
      ],
      [
        "typical",
        "the usual result across several tries",
        "típico: el resultado habitual en varios intentos",
      ],
    ],
    frames: [
      "The two bridges differ in ___ and ___.",
      "To make it fair, keep ___ the same and change only ___.",
    ],
    focus: [
      "each team's result",
      "the two things that were different",
      "what Mr. Chen recommends for next time",
    ],
    correct:
      "Yes. Mr. Chen says span and material both changed, so the test cannot say which change mattered, and a fairer test changes one thing and repeats it.",
    hint: "Listen for what the teacher says about changing one thing at a time, and for the two ways the bridges differed.",
    wida: [
      "Explain: evaluate a fair test from a discussion",
      "Notice reasons and conditions in spoken science talk",
    ],
    es: [
      "Elegir las afirmaciones que respalda una conversación de clase sobre una prueba justa",
      "Escucha una conversación de clase inventada sobre dos puentes a escala. Luego elige las DOS afirmaciones que respalda la conversación.",
    ],
    teacher: {
      use: "Science investigation lesson; pair with the Reading Room lesson Which Bridge Is Stronger.",
      prompt: "Which two differences between the bridges made the comparison unfair?",
    },
  },
  {
    id: "l-c-rain-garden-two-sources",
    level: "C",
    gw: "g78-task",
    strand: "Hearings and debates",
    type: "constructed",
    title: "Take Notes: A Flyer and an Interview",
    skill: "Taking notes on two spoken sources and tying them together with a limit",
    dir: "Listen to a made-up city flyer and a made-up student interview about a school rain garden. Write notes under three headings: Flyer, Interview, and How they fit together. Include one limit.",
    q: "Take notes under the headings Flyer, Interview, and How they fit together. Then tell one limit that stops you from saying the garden is the only reason for the change.",
    script:
      "Announcer reading a city flyer: A rain garden is a shallow garden planted with native plants. It is built in a low spot so that rain from roofs and pavement can collect there and soak into the soil, instead of rushing straight into the street. The city invites schools to build rain gardens. Now the interview. Reporter: What changed after your class built the rain garden? Ana: Before, a puddle sat in the corner of the parking lot for about two days after a storm. Since the garden went in last spring, the puddle has usually been gone in one day. Reporter: Is the garden the reason? Ana: It may be part of the reason. But this summer was drier than last year, so we cannot be sure. Reporter: What would you measure next? Ana: We would measure the puddle after every storm, and write down how much rain fell.",
    responseLabel: "Your notes",
    frames: [
      "The flyer says ___, and Ana reports ___.",
      "Together, the sources suggest ___, but ___.",
      "A limit is that ___.",
    ],
    focus: [
      "what the flyer says a rain garden does",
      "what Ana saw before and after",
      "the reason Ana gives for being careful",
    ],
    models: {
      A: "Flyer: low spot, rain soaks in. Interview: puddle two days, now one day. Fit: both say rain soaks in. Limit: drier summer.",
      B: "Flyer: a rain garden is built in a low spot so rain soaks into the soil. Interview: Ana says the puddle lasted two days before and about one day after. How they fit: Ana's puddle matches what the flyer says gardens do. Limit: this summer was drier, so we cannot be sure.",
      C: "Flyer: a rain garden collects rain from roofs and pavement so that it soaks in instead of rushing into the street. Interview: Ana reports the parking lot puddle lasted about two days before the garden and usually one day after. How they fit: her report is consistent with the flyer's description, but one student's observation is not proof. Limit: the summer was drier, so weather could explain some of the change; measuring each storm and the rainfall would test it.",
    },
    criteria: [
      "I wrote key words under all three headings, not full sentences.",
      "I kept what the flyer says separate from what Ana reports.",
      "I named one limit, such as the drier summer, and used a word like may, not sure, or consistent with.",
    ],
    modelNotes: {
      A: "These are notes, not sentences, and they still separate the two sources and end with the limit.",
      B: '"How they fit" connects the two sources without claiming proof. The last sentence uses Ana\'s own words about being unsure.',
      C: 'The phrase "consistent with" is careful language: it says the sources agree without saying one proves the other.',
    },
    vocab: [
      [
        "source",
        "a place where information comes from",
        "fuente: un lugar de donde viene la información",
      ],
      [
        "observation",
        "something you notice by looking or measuring",
        "observación: algo que notas al mirar o medir",
      ],
      [
        "consistent with",
        "agreeing with, without proving",
        "coherente con: que concuerda, sin demostrar",
      ],
    ],
    correct:
      "Response saved. Strong notes keep the two sources separate, show how they fit, and name a real limit instead of claiming the garden alone caused the change.",
    hint: "Listen for what each speaker says. Then listen for Ana's reason for being careful. That reason is your limit.",
    support:
      "Make three boxes on paper: Flyer, Interview, How they fit together. Fill in key words as you hear them, then add one limit at the bottom.",
    extension: "Write one question the class could answer by measuring after the next storm.",
    wida: [
      "Inform: take notes on two sources and connect them",
      "Use careful language to describe what evidence suggests",
    ],
    es: [
      "Tomar apuntes de dos fuentes orales y relacionarlas con un límite",
      "Escucha un volante municipal inventado y una entrevista inventada con una estudiante sobre un jardín de lluvia en la escuela. Escribe apuntes bajo tres títulos: Volante, Entrevista y Cómo se relacionan. Incluye un límite.",
    ],
    teacher: {
      use: "Science and ELA lesson on paired sources; pair with the Reading Room lesson Two Sources, One Rain Garden. This task makes no water-quality or safety claims.",
      lower: "Provide the three-box chart with the headings already written.",
      challenge:
        "Ask students to rewrite the limit as a testable plan that says what they would measure and when.",
      prompt: "Which words in the interview showed that Ana was being careful?",
    },
  },
];
