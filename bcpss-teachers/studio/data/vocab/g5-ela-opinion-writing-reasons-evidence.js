// Vocabulary for opinion writing with reasons and evidence (grade 5 ELA). Original content.
// Visual text and alt never contain the entry word, so the pictures can be used as picture-word and type-word prompts.
const practice = (visualPrompt, speakWrite, retrieval) => ({ visualPrompt, speakWrite, retrieval });

export default {
  id: "g5-ela-opinion-writing-reasons-evidence",
  title: "Words for writing an opinion with reasons and evidence",
  grade: "5",
  band: "3-5",
  subject: "ela",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS W.5.1, W.5.1b and W.5.1c; not mapped to a district unit sequence.",
  },
  standards: ["W.5.1", "W.5.1b", "W.5.1c", "L.5.6"],
  entries: [
    {
      id: "opinion",
      word: "opinion",
      pos: "noun",
      pron: "uh-PIN-yun",
      def: "What a person thinks or feels about something. It cannot be proved true or false.",
      visual: {
        kind: "scene",
        alt: "A child with a thought bubble that says pizza is the best lunch.",
        longDesc:
          "A plain background with a child and a thought bubble containing the words Pizza is the best lunch.",
        bg: "plain",
        items: [
          { icon: "student", x: 60, y: 90, s: 150 },
          { icon: "thought-bubble", x: 250, y: 40, s: 130, label: "Pizza is the best lunch" },
        ],
      },
      context: "My opinion is that our school should have a garden.",
      nonExample: "The garden has six beds is not an opinion. You can count the beds to check it.",
      academicSentence:
        "An opinion tells what the writer thinks, and the writer must back it up with reasons.",
      everyday: "Saying one movie is the funniest is a view that another person may not share.",
      es: {
        word: "opinión",
        def: "Lo que una persona piensa o siente sobre algo. No se puede probar si es verdad o mentira.",
        verified: true,
      },
      misconception:
        "An opinion is wrong or weak. An opinion can be strong when it is backed with good reasons.",
      related: ["fact", "reason", "persuade"],
      practice: practice(
        "Read the thought bubble. Is it something you could check, or something a person feels?",
        "Say an opinion about our school lunch and one reason, then write it.",
        "What do we call what a person thinks about something that cannot be proved true or false?",
      ),
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Argue",
    },
    {
      id: "reason",
      word: "reason",
      pos: "noun",
      pron: "REE-zun",
      def: "A statement that explains why someone thinks or does something.",
      visual: {
        kind: "flow",
        alt: "The statement we should recycle paper, followed by why: it keeps trash out of landfills.",
        longDesc:
          "Two boxes joined by an arrow. First: We should recycle paper. Second: It keeps trash out of landfills.",
        steps: [
          { label: "We should recycle paper", icon: "earth" },
          { label: "It keeps trash out of landfills", icon: "check" },
        ],
      },
      context: "One reason is that plants help students learn about science.",
      nonExample: "I also want a pool is a new opinion. It does not explain why you want a garden.",
      academicSentence:
        "A strong reason answers the question why and connects directly to the opinion.",
      everyday:
        "You wear a coat in winter because it keeps you warm. That last part is the reason.",
      es: {
        word: "razón",
        def: "Una explicación de por qué alguien piensa o hace algo.",
        verified: true,
      },
      misconception:
        "A reason can be any sentence that agrees with the opinion. It has to explain why.",
      related: ["opinion", "evidence", "linking-word"],
      practice: practice(
        "Point to the box that tells why. Say the box with because between the two.",
        "Say an opinion, then because and a reason, and write the sentence.",
        "What do we call the part of an argument that explains why you think something?",
      ),
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Argue",
    },
    {
      id: "fact",
      word: "fact",
      pos: "noun",
      pron: "FAKT",
      def: "Something that is true and can be checked.",
      visual: {
        kind: "table",
        alt: "A table with two statements. A week has 7 days can be checked by counting. Mondays are boring cannot be checked because it is a feeling.",
        longDesc:
          "Two rows. A week has 7 days: yes, count them. Mondays are boring: no, it is a feeling.",
        head: ["Statement", "Can we check it?"],
        rows: [
          ["A week has 7 days", "Yes: count them"],
          ["Mondays are boring", "No: it is a feeling"],
        ],
      },
      context: "It is a fact that the school garden has six beds.",
      nonExample: "The garden is beautiful is not a statement you can check. It is a view.",
      academicSentence: "A writer can use a fact to show readers that a reason is true.",
      everyday: "The fire drill takes ten minutes is something you can time and check.",
      es: { word: "hecho", def: "Algo que es verdad y se puede comprobar.", verified: true },
      misconception:
        "Anything in a book is a fact. Books also include opinions; check whether it can be proved.",
      related: ["opinion", "detail", "evidence"],
      practice: practice(
        "Read each statement. Which one can you check?",
        "Say one thing that can be checked about our classroom, then write it.",
        "What do we call something true that can be checked?",
      ),
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Inform",
    },
    {
      id: "detail",
      word: "detail",
      pos: "noun",
      pron: "DEE-tayl",
      def: "A small piece of information, such as a name, a number or a description.",
      visual: {
        kind: "table",
        alt: "A table about a dog showing small pieces of information: name Max, color brown with a white spot, age 3 years old.",
        longDesc:
          "Two columns. The topic is my dog. Name: Max. Color: brown with a white spot. Age: 3 years old.",
        head: ["Topic: my dog", "Small pieces of information"],
        rows: [
          ["Name", "Max"],
          ["Color", "brown with a white spot"],
          ["Age", "3 years old"],
        ],
      },
      context: "Add a detail, such as the number of garden beds, to make your reason clearer.",
      nonExample:
        "The garden is good is too general. It gives the reader no small piece of information to picture.",
      academicSentence: "Details such as numbers and names make a reason easier to believe.",
      everyday: "Telling a friend the color, size and name of your lost jacket helps them find it.",
      es: {
        word: "detalle",
        def: "Un dato pequeño, como un nombre, un número o una descripción.",
        verified: true,
      },
      misconception:
        "More details always make writing better. Choose details that help prove the reason.",
      related: ["fact", "evidence", "support"],
      practice: practice(
        "Point to one small piece of information in the table and say it in a sentence.",
        "Give two details about your favorite food, then write one sentence with both.",
        "What do we call a small piece of information such as a name or a number?",
      ),
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Inform",
    },
    {
      id: "evidence",
      word: "evidence",
      pos: "noun",
      pron: "EV-ih-dents",
      def: "Facts, numbers or examples that prove a point.",
      visual: {
        kind: "bars",
        alt: "A bar chart of a class vote: 18 students want a longer recess and 6 do not.",
        longDesc: "Two bars. Want a longer recess: 18 students. Do not: 6 students.",
        xLabel: "Vote",
        yLabel: "Students",
        unit: "students",
        data: [
          { label: "Want longer recess", value: 18 },
          { label: "Do not", value: 6 },
        ],
      },
      context: "A class survey is evidence that most students want a garden.",
      nonExample: "Everyone knows it is true is not proof. It gives the reader nothing to check.",
      academicSentence: "Evidence from a reliable source makes a writer's reason stronger.",
      everyday: "A receipt is proof that you paid for something.",
      es: {
        word: "evidencia",
        def: "Hechos, números o ejemplos que prueban una idea.",
        verified: true,
      },
      misconception:
        "Evidence is the same as a reason. A reason says why; evidence proves the reason.",
      related: ["fact", "support", "reason"],
      practice: practice(
        "Read the chart. Say one sentence that uses a number from it.",
        "Say a reason and the number or fact that proves it, then write both.",
        "What do we call facts, numbers or examples that prove a point?",
      ),
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Argue",
    },
    {
      id: "support",
      word: "support",
      pos: "verb",
      pron: "suh-PORT",
      def: "To give reasons and facts that back up an idea.",
      visual: {
        kind: "shapes",
        alt: "A roof labeled we need new library books held up by two pillars: 20 of 25 students agree, and the books are 12 years old.",
        longDesc:
          "A flat roof with the words We need new library books rests on two pillars. The left pillar says 20 of 25 students agree. The right pillar says the books are 12 years old.",
        items: [
          { t: "rect", x: 50, y: 40, w: 380, h: 70, rx: 6, fill: "sky", stroke: "ink", sw: 3 },
          { t: "text", x: 240, y: 82, text: "We need new library books", size: 20, weight: 700 },
          { t: "rect", x: 90, y: 110, w: 130, h: 150, fill: "paper", stroke: "ink", sw: 3 },
          { t: "text", x: 155, y: 170, text: "20 of 25\nstudents\nagree", size: 17 },
          { t: "rect", x: 260, y: 110, w: 130, h: 150, fill: "paper", stroke: "ink", sw: 3 },
          { t: "text", x: 325, y: 170, text: "The books\nare 12\nyears old", size: 17 },
          { t: "rect", x: 50, y: 260, w: 380, h: 16, fill: "ink" },
        ],
      },
      context: "Two facts support my opinion that the library needs new books.",
      nonExample: "Repeating the same idea louder does not back it up.",
      academicSentence:
        "A writer must support an opinion with reasons that are backed by facts and details.",
      everyday: "A strong table needs four sturdy legs to hold it up.",
      es: { word: "apoyar", def: "Dar razones y hechos que respaldan una idea.", verified: true },
      misconception: "To support an opinion, you can say you agree. You need facts and reasons.",
      related: ["evidence", "reason", "opinion"],
      practice: practice(
        "Point to the two pillars. Say what each one adds to the roof idea.",
        "Say an opinion and two facts that back it up, then write one sentence.",
        "Which word means to give reasons and facts that hold up an idea?",
      ),
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Argue",
    },
    {
      id: "linking-word",
      word: "linking word",
      pos: "noun",
      pron: "LINK-ing WURD",
      def: "A word or phrase that connects ideas, such as because, for example or however.",
      visual: {
        kind: "flow",
        alt: "Two ideas joined by a connecting word: I like gym class, because, we play team games.",
        longDesc: "Three boxes joined by arrows. I like gym class. Because. We play team games.",
        steps: [
          { label: "I like gym class", icon: "school" },
          { label: "because", icon: "arrow-both" },
          { label: "we play team games", icon: "soccer-ball" },
        ],
      },
      context: "Because is a linking word that joins a reason to an opinion.",
      nonExample: "Gym and games are nouns that name things. They do not join two ideas.",
      academicSentence:
        "A linking word such as for example tells the reader that evidence is coming.",
      everyday: "Saying I was late because the bus was slow uses a word that joins two ideas.",
      es: {
        word: "palabra de enlace",
        def: "Una palabra o frase que une ideas, como porque, por ejemplo o sin embargo.",
        verified: true,
      },
      misconception:
        "A linking word is only because. There are many, such as for example, in addition and however.",
      related: ["reason", "organize", "support"],
      practice: practice(
        "Find the middle box. Say the whole sentence with it.",
        "Join two ideas with for example or because, say it, and write it.",
        "What do we call a word such as because or however that connects ideas?",
      ),
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Argue",
    },
    {
      id: "introduce",
      word: "introduce",
      pos: "verb",
      pron: "in-truh-DOOS",
      def: "To start a piece of writing by telling the reader the topic and what you think.",
      visual: {
        kind: "table",
        alt: "A table of the parts of an opinion paragraph. The first part tells the topic and what you think. The middle gives reasons and facts. The last sums up.",
        longDesc:
          "Three rows. Beginning: tells the topic and says what you think. Middle: gives reasons and facts. Ending: sums up the idea.",
        head: ["Part of the paragraph", "What it does"],
        rows: [
          ["Beginning", "Tells the topic and says what you think"],
          ["Middle", "Gives reasons and facts"],
          ["Ending", "Sums up the idea"],
        ],
        highlight: [
          [0, 0],
          [0, 1],
        ],
      },
      context: "Introduce your topic and state your opinion in the first sentence.",
      nonExample:
        "Starting with a long story about your weekend does not tell the reader your topic.",
      academicSentence:
        "To introduce an opinion piece, tell the reader the topic and state your opinion clearly.",
      everyday: "When you meet a new student, you introduce yourself by saying your name first.",
      es: {
        word: "introducir",
        def: "Empezar un texto diciendo al lector el tema y lo que piensas.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "intro", meaning: "inside, in" },
          { part: "duce", meaning: "to lead" },
        ],
      },
      misconception:
        "Introduce means to give all your reasons right away. The first part tells the topic and your opinion.",
      related: ["conclusion", "organize", "audience"],
      practice: practice(
        "Point to the highlighted row. Say what the beginning of a paragraph does.",
        "Say the first sentence of an opinion paragraph about recess, then write it.",
        "What do we call starting a piece by telling the reader the topic and what you think?",
      ),
      tier: 3,
      domains: ["Writing"],
      klu: "Argue",
    },
    {
      id: "organize",
      word: "organize",
      pos: "verb",
      pron: "OR-guh-nyz",
      def: "To put ideas in an order that makes sense.",
      visual: {
        kind: "flow",
        alt: "Three boxes in order: first the strongest reason, next the second reason, last the final reason.",
        longDesc:
          "Three numbered boxes joined by arrows from left to right. First: strongest reason. Next: second reason. Last: final reason.",
        steps: [
          { label: "First: strongest reason", icon: "trophy" },
          { label: "Next: second reason", icon: "arrow-right" },
          { label: "Last: final reason", icon: "flag" },
        ],
      },
      context: "I will organize my reasons so the strongest one comes first.",
      nonExample: "Writing your ideas in a pile with no order makes the reader work too hard.",
      academicSentence:
        "Writers organize reasons in a logical order so readers can follow the argument.",
      everyday: "You organize a backpack by putting books together and lunch on top.",
      es: {
        word: "organizar",
        def: "Poner las ideas en un orden que tenga sentido.",
        verified: true,
      },
      misconception: "Organize means to write more. It means to put the ideas in a clear order.",
      related: ["linking-word", "introduce", "conclusion"],
      practice: practice(
        "Say the three boxes in order with First, Next and Last.",
        "Put three reasons in order, say them, and write them with order words.",
        "What do we call putting ideas in an order that makes sense?",
      ),
      tier: 2,
      domains: ["Writing"],
      klu: "Argue",
    },
    {
      id: "conclusion",
      word: "conclusion",
      pos: "noun",
      pron: "kun-KLOO-zhun",
      def: "The ending that sums up the main idea and leaves the reader with a final thought.",
      visual: {
        kind: "cycle",
        alt: "A circle of three steps: my idea, reasons and facts, and my idea again at the end.",
        longDesc:
          "Three stages around a circle with arrows. My idea. Reasons and facts. My idea, restated.",
        stages: [
          { label: "My idea", icon: "lightbulb" },
          { label: "Reasons and facts", icon: "book" },
          { label: "My idea, restated", icon: "check" },
        ],
      },
      context: "My conclusion says again that the school should have a garden.",
      nonExample:
        "Adding a brand new reason at the very end does not sum up what you already said.",
      academicSentence:
        "A good conclusion restates the opinion in new words and tells the reader why it matters.",
      everyday: "At the end of a movie, the last scene ties up the story.",
      es: {
        word: "conclusión",
        def: "El final que resume la idea principal y deja una última idea al lector.",
        verified: true,
      },
      misconception: "A conclusion starts a new argument. It sums up the one you made.",
      related: ["introduce", "opinion", "organize"],
      practice: practice(
        "Point to the last stop on the circle. Say what the writer does there.",
        "Say a last sentence for an opinion paragraph about a school garden, then write it.",
        "What do we call the ending that sums up the main idea?",
      ),
      tier: 2,
      domains: ["Writing"],
      klu: "Argue",
    },
    {
      id: "persuade",
      word: "persuade",
      pos: "verb",
      pron: "per-SWAYD",
      def: "To get someone to agree with you by giving good reasons.",
      visual: {
        kind: "flow",
        alt: "A speaker gives reasons and facts, a listener changes their mind, and the listener agrees.",
        longDesc:
          "Three boxes. A speech bubble: gives reasons and facts. A thought bubble: changes their mind. A check mark: agrees.",
        steps: [
          { label: "Gives reasons and facts", icon: "speech-bubble" },
          { label: "Listener changes their mind", icon: "thought-bubble" },
          { label: "Listener agrees", icon: "check" },
        ],
      },
      context: "I want to persuade the principal to build a garden.",
      nonExample: "Shouting or begging does not give the listener a reason to agree.",
      academicSentence:
        "Writers persuade readers by using strong reasons backed by evidence, not by pressure.",
      everyday: "You persuade a friend to try a new game by explaining what makes it fun.",
      es: {
        word: "persuadir",
        def: "Lograr que alguien esté de acuerdo contigo dando buenas razones.",
        verified: true,
      },
      misconception:
        "To persuade means to win an argument. It means to help the reader see your reasons.",
      related: ["opinion", "audience", "evidence"],
      practice: practice(
        "Follow the arrows. Say what the speaker does to change the listener's mind.",
        "Say how you would convince a friend to read a book, using two reasons, then write it.",
        "Which word means to get someone to agree by giving good reasons?",
      ),
      tier: 3,
      domains: ["Speaking", "Writing"],
      klu: "Argue",
    },
    {
      id: "audience",
      word: "audience",
      pos: "noun",
      pron: "AW-dee-ens",
      def: "The people who read or listen to what you write or say.",
      visual: {
        kind: "scene",
        alt: "A speaker at the front of a room facing a group of listeners.",
        longDesc:
          "A room with one person on the left labeled Speaker and a row of four children on the right labeled Listeners.",
        bg: "room",
        items: [
          { icon: "teacher", x: 30, y: 70, s: 140, label: "Speaker" },
          { icon: "student", x: 210, y: 90, s: 90 },
          { icon: "student", x: 290, y: 90, s: 90 },
          { icon: "student", x: 370, y: 90, s: 90 },
          { icon: "family", x: 290, y: 195, s: 80, label: "Listeners" },
        ],
      },
      context: "My audience is the principal and the families who will read the letter.",
      nonExample: "The pencil you write with is a tool. It is not the people who read your work.",
      academicSentence: "Writers think about their audience when they choose reasons and words.",
      everyday: "A band plays differently for little kids than for a stadium crowd.",
      es: {
        word: "audiencia",
        def: "Las personas que leen o escuchan lo que escribes o dices.",
        verified: true,
      },
      misconception:
        "The audience is only the teacher. Writers may have many readers, such as families and leaders.",
      related: ["persuade", "introduce", "opinion"],
      practice: practice(
        "Point to the listeners. Say what they need to hear to agree.",
        "Say who your audience is for a letter about recess, then write one sentence for them.",
        "What do we call the people who read or listen to your work?",
      ),
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Inform",
    },
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
