// Project: grade 3 social studies. Map the school neighborhood, study sources about the past, build a museum panel. Original.
const lv = (score, label, descriptor) => ({ score, label, descriptor });
const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const inquiryFlow = {
  kind: "flow",
  w: 480,
  h: 200,
  alt: "Five steps of the project in order: ask a question, map today, study sources about the past, compare then and now, build a museum panel.",
  steps: [
    { label: "Ask a question" },
    { label: "Map today" },
    { label: "Study the past" },
    { label: "Compare" },
    { label: "Museum panel" },
  ],
};

const mapChecklist = {
  kind: "table",
  w: 480,
  h: 260,
  alt: "Checklist of the parts a map needs: title, key, compass rose, labels and a scale or note about distance.",
  longDesc:
    "Title: tells what place the map shows. Key: explains each symbol. Compass rose: shows north, south, east and west. Labels: name streets and places. Distance note: tells how far, for example one block or a short walk.",
  head: ["Map part", "What it does"],
  rows: [
    ["Title", "Tells what place the map shows"],
    ["Key", "Explains each symbol"],
    ["Compass rose", "Shows north, south, east and west"],
    ["Labels", "Name streets and places"],
    ["Distance note", "Tells how far, such as one block"],
  ],
};

const compareTable = {
  kind: "table",
  w: 480,
  h: 250,
  alt: "A then and now comparison table with three columns: what I notice, what stayed the same, what changed. The row shows the format with an example about a corner shop.",
  longDesc:
    "Row format. Place: the corner. Then: a small shop with a sign in the window. Now: a bus stop and a bench. Stayed the same: people still meet at the corner. Changed: the shop is gone and a bus stop was added. This is an example of how to fill the table, not a fact about your neighborhood.",
  head: ["Place", "Then", "Now", "Stayed the same", "Changed"],
  rows: [
    [
      "The corner",
      "Small shop with a sign",
      "Bus stop and bench",
      "People meet there",
      "The shop is gone",
    ],
  ],
};

export default {
  id: "neighborhood-then-and-now-map",
  kind: "project",
  title: "Our Neighborhood Then and Now",
  subtitle: "A map of today, sources about the past and a museum panel for neighbors",
  drivingQuestion:
    "How has our neighborhood in Baltimore stayed the same and changed over time, and how can a map and a museum panel help our neighbors understand it?",
  studentQuestion:
    "What can a map, a photograph and a neighbor's memory teach us about how our neighborhood used to be?",
  grade: "3",
  grades: ["3"],
  band: "3-5",
  bands: ["3-5"],
  subject: "social-studies",
  subjects: ["social-studies", "ela"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to C3 D2.Geo.1.3-5, D2.Geo.2.3-5, D2.His.2.3-5 and D2.His.3.3-5 plus CCSS SL.3.1; not mapped to a district unit sequence. Local history facts come from the sources your class finds, not from this page.",
  },
  standards: ["D2.Geo.1.3-5", "D2.Geo.2.3-5", "D2.His.2.3-5", "D2.His.3.3-5", "SL.3.1"],
  wida: {
    eld: ["ELD-SS", "ELD-SI"],
    klus: ["Inform", "Explain"],
    domains: ["Speaking", "Listening", "Reading", "Writing"],
    cluster: "2-3",
  },
  sessions: 9,
  sessionMinutes: 45,
  duration: 405,
  intro:
    "Your students are historians and mapmakers for one neighborhood. They draw a map of the area around the school as it is today. They then study at least two kinds of sources about the past, such as a photograph from a local-history collection and an interview with an adult who knows the area. They compare then with now, decide what stayed the same and what changed, and explain one change. The class ends with a museum panel and a gallery walk for neighbors and families. The project shows that history is built from evidence and that maps help us see place and change.",
  hook: "Show a photograph of your school block today and a photograph or description of the same block long ago if you have one. Ask: what do you notice, and what makes you wonder?",
  contentTargets: [
    "I can make a map of a familiar place with a title, a key, a compass rose and labels.",
    "I can use a photograph and an interview as sources and say what each one tells me about the past.",
    "I can compare then and now and say what stayed the same and what changed.",
    "I can explain one change using a cause and an example.",
  ],
  languageTargets: [
    {
      function: "Compare past and present",
      structure: "Then, ___. Now, ___. ___ stayed the same, but ___ changed.",
      text: "I can compare then and now with time words and the words same and different.",
    },
    {
      function: "Explain a change with a reason",
      structure: "___ changed because ___. One example is ___.",
      text: "I can explain a change in my neighborhood using because and an example.",
    },
  ],
  materials: [
    "Large paper and colored pencils for the neighborhood map",
    "A printed street map or satellite view of the area around the school (a school map is fine; do not mark any student's home)",
    "Two or more sources about the past: photographs from a public library or local-history collection, school or community archives, or an adult interview",
    "A source organizer for each source (what I see, what it tells me, what I still wonder)",
    "Interview question sheets and a note-taking page",
    "Sentence strips, index cards and poster paper for the museum panel",
    "Sticky notes for visitor feedback",
  ],
  prep: [
    "Find two to four sources about the neighborhood in advance. A school librarian, a public library branch or a community association can help you find photographs that are free to use in a classroom.",
    "Plan the interview before the day: invite one or two adults who have lived or worked near the school for years. Send a note home or to staff, ask permission, and invite them to visit or to answer questions in writing. Children may also ask a family member at home.",
    "Do not ask children to map their own homes. Use the school as the center and map public places such as the school, a park, a store, a library and a bus stop.",
    "This page does not claim facts about the history of your neighborhood. Every statement about the past in student work must come from a source your class found, and children cite the source.",
    "Practice with one photograph as a class before small groups work alone.",
  ],
  facilitation: [
    {
      day: 1,
      title: "Ask a question",
      checkpoint: "cp1",
      minutes: 45,
      teacher: [
        "Show the hook photograph or description. Use the routine: I notice, I think, I wonder.",
        "Class writes three questions about the neighborhood in the past and chooses one to guide the project, such as 'What was on our block long ago?'",
      ],
      students: ["Write two questions in a notebook.", "Share one with a partner."],
      watchFor: "Questions that have yes or no answers. Show how to turn them into open questions.",
    },
    {
      day: 2,
      title: "Map today",
      checkpoint: "cp2",
      minutes: 45,
      teacher: [
        "Introduce map parts with the checklist. Walk the school block together if possible, or use a printed map and photographs.",
        "Teams sketch a first map of the school neighborhood with at least five places.",
      ],
      students: ["Sketch the map.", "Add title, key and compass rose."],
      watchFor: "Mixing up east and west. Use a wall compass so the class has one shared north.",
    },
    {
      day: 3,
      title: "Finish and share the map",
      checkpoint: "cp2",
      minutes: 45,
      teacher: [
        "Teams finish maps and trade with another team. The partner uses the key to find three places and says what they found.",
        "Gather corrections and fix the maps.",
      ],
      students: ["Complete the map.", "Check a partner's map and give one suggestion."],
      watchFor: "Symbols without a key. Ask, 'How will a visitor know what this means?'",
    },
    {
      day: 4,
      title: "Study a photograph",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Model a source organizer with one photograph: what I see, what it tells me about the past, what I still wonder, and where it came from.",
        "Teams analyze a second photograph with a partner.",
      ],
      students: [
        "Fill the organizer.",
        "Write one sentence that starts with 'This photograph shows that long ago ___.'",
      ],
      watchFor:
        "Guessing facts that the photograph does not show. Ask, 'What in the picture tells you that?'",
    },
    {
      day: 5,
      title: "Prepare for an interview",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Teach how to ask a good question and how to listen and take notes. Class writes five questions, for example 'What did this corner look like when you were young?'",
        "Practice with a staff member or in role-play.",
      ],
      students: ["Choose three questions.", "Practice asking and writing notes with a partner."],
      watchFor: "Questions that are too personal. Keep questions about places and daily life.",
    },
    {
      day: 6,
      title: "Interview and record",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Interview an adult in person or by reading written answers. Students take notes and then write what the source tells us.",
        "Debrief: what did the interview tell us that the photograph could not?",
      ],
      students: ["Take notes.", "Write one new fact and say who told us."],
      watchFor: "Notes with no source. Remind students to write the name or role of the person.",
    },
    {
      day: 7,
      title: "Compare then and now",
      checkpoint: "cp4",
      minutes: 45,
      teacher: [
        "Show the comparison table format. Teams fill at least three rows using their map and sources.",
        "Teams choose one change and write a cause with because.",
      ],
      students: ["Fill the table.", "Write one sentence with because."],
      watchFor: "Causes that are guesses. Ask for the source or label it 'we think'.",
    },
    {
      day: 8,
      title: "Build the museum panel",
      checkpoint: "cp5",
      minutes: 45,
      teacher: [
        "Teams design a panel with a title, the map, one photograph or drawing, the comparison and a short explanation. Provide a model layout.",
        "Teams rehearse a 60-second talk.",
      ],
      students: ["Create the panel.", "Practice the talk."],
      watchFor: "Panels that copy long source text. Ask students to put it in their own words.",
    },
    {
      day: 9,
      title: "Gallery walk",
      checkpoint: "cp5",
      minutes: 45,
      teacher: [
        "Invite neighbors, families or another class. Teams present at their panels while visitors move through.",
        "Visitors leave two sticky notes: one thing they learned and one question.",
      ],
      students: ["Present.", "Read the visitor notes and answer one."],
      watchFor: "Visitors saying only 'good job'. Hold them to the two prompts.",
    },
  ],
  studentDirections: [
    "Write a question about our neighborhood in the past.",
    "Make a map of the school neighborhood. Add a title, a key, a compass rose and labels.",
    "Study a photograph. Fill in what you see and what it tells you about the past.",
    "Interview an adult or read an interview. Take notes and write who told you.",
    "Fill in the then and now table with at least three rows.",
    "Choose one change. Write why it changed using because.",
    "Build a museum panel with your map, a picture, your table and your explanation.",
    "Present at the gallery walk and answer a question.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Our question",
      days: "Session 1",
      evidence: "A written open question about the neighborhood in the past.",
      prompt:
        "Write one question about our neighborhood long ago that a source could help us answer.",
      teacherLook: [
        "The question cannot be answered with yes or no.",
        "A photograph or a person could help answer it.",
      ],
      tool: null,
    },
    {
      id: "cp2",
      title: "Map of today",
      days: "Sessions 2 and 3",
      evidence:
        "A neighborhood map with a title, key, compass rose and at least five labeled places.",
      prompt: "Make a map of the school neighborhood. Give it a title, a key and a compass rose.",
      teacherLook: [
        "The key explains every symbol.",
        "The compass rose points the same way as the class compass.",
        "Places are real public places, and no home is marked.",
      ],
      tool: null,
    },
    {
      id: "cp3",
      title: "Sources about the past",
      days: "Sessions 4 to 6",
      evidence:
        "Two source organizers (a photograph and an interview) that name where each came from, what it shows and what it still leaves unknown.",
      prompt: "Fill in a source organizer for a photograph and for an interview.",
      teacherLook: [
        "Each source names its origin (a collection, a person's role).",
        "What the source tells us stays on what the source shows or says.",
        "At least one wonder is noted for each source.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Then and now comparison",
      days: "Session 7",
      evidence:
        "A comparison table with at least three rows and one explained change with because.",
      prompt: "Fill in the then and now table. Pick one change and explain it with because.",
      teacherLook: [
        "Then comes from a source, not a guess.",
        "Each row separates what stayed the same from what changed.",
        "The explanation names a cause and an example.",
      ],
      tool: null,
    },
    {
      id: "cp5",
      title: "Museum panel and talk",
      days: "Sessions 8 and 9",
      evidence:
        "A museum panel and a 60-second talk with at least one answer to a visitor question.",
      prompt:
        "Build a panel with your map, a picture, your comparison and your explanation. Give a short talk.",
      teacherLook: [
        "The panel has a title, a map and a comparison.",
        "The talk says what a source showed.",
        "The presenter answers a question with an example from the panel.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "flow",
      title: "Our project in five steps",
      caption: "We ask, map, study sources, compare and share.",
      visual: inquiryFlow,
    },
    {
      id: "map",
      title: "What every map needs",
      caption: "Check each part before you share your map.",
      visual: mapChecklist,
    },
    {
      id: "compare",
      title: "Then and now table",
      caption:
        "This row shows the table format. Your class fills it with facts from its own sources.",
      visual: compareTable,
      teacherNote:
        "The example row is invented to show the format. Remind students that every row in their table must come from a source they found.",
    },
  ],
  organizers: [
    { template: "source-analysis", use: "Study a photograph or an interview (checkpoint 3)." },
    { template: "compare-contrast", use: "Then and now comparison (checkpoint 4)." },
    { template: "cause-effect", use: "Explain one change in the neighborhood (checkpoint 4)." },
    { template: "gallery-walk", use: "Museum panel gallery walk (checkpoint 5)." },
  ],
  vocab: {
    entries: [
      {
        id: "neighborhood",
        word: "neighborhood",
        def: "An area of a city where people live, work and go to school.",
        example: "Our neighborhood has a library and a park.",
      },
      {
        id: "map",
        word: "map",
        def: "A drawing that shows where places are.",
        example: "The map shows our school and the park.",
      },
      {
        id: "key",
        word: "map key",
        def: "A box that tells what each symbol on a map means.",
        example: "The star in the key means school.",
      },
      {
        id: "compass-rose",
        word: "compass rose",
        def: "A symbol on a map that shows directions.",
        example: "The compass rose shows north at the top.",
      },
      {
        id: "source",
        word: "source",
        def: "Something that gives information, such as a photograph or a person.",
        example: "A photograph is a source about the past.",
      },
      {
        id: "past",
        word: "past",
        def: "A time that already happened.",
        example: "In the past, the corner had a shop.",
      },
      {
        id: "change",
        word: "change",
        def: "To become different over time.",
        example: "The corner changed when the shop closed.",
      },
      {
        id: "interview",
        word: "interview",
        def: "To ask a person questions to learn what they know.",
        example: "We will interview a neighbor.",
      },
      {
        id: "evidence",
        word: "evidence",
        def: "Facts from a source that show something is true.",
        example: "The photograph is evidence that there was a shop.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner and point to the photograph or map as you talk. Use the word bank and the sentence starters.",
      frames: ["I see ___.", "Then, ___. Now, ___.", "This place is ___."],
      wordBank: [
        "map",
        "school",
        "park",
        "street",
        "photograph",
        "then",
        "now",
        "same",
        "different",
      ],
      oral: "Partner A points to a place on the map. Partner B says what it is. Switch.",
    },
    dev: {
      directions: "Use the frames to talk and write. Name your source every time you give a fact.",
      frames: [
        "The photograph shows that long ago ___.",
        "___ stayed the same, but ___ changed.",
        "___ changed because ___.",
      ],
      wordBank: ["neighborhood", "source", "past", "change", "key", "compass rose", "interview"],
      oral: "Tell a partner one way the neighborhood is the same and one way it is different.",
    },
    exp: {
      directions:
        "Write full sentences. Give a cause and an example, and say which source gave the fact.",
      frames: [
        "According to the ___, ___. This shows that ___.",
        "One reason ___ changed is ___. For example, ___.",
      ],
      wordBank: ["evidence", "according to", "continuity", "cause", "impact", "gradually"],
      oral: "Explain to a partner which source helped you most and why.",
    },
    br: {
      directions:
        "Write an explanation that compares two sources and says what each can and cannot tell us.",
      frames: [],
      wordBank: ["perspective", "reliable", "limitation", "primary source", "continuity"],
      oral: "Present how two sources about the same place agree or differ.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "map",
        label: "Map of today",
        levels: [
          lv(
            3,
            "Meeting",
            "Title, key, compass rose and at least five labeled places that match the real neighborhood.",
          ),
          lv(
            2,
            "Approaching",
            "Has most parts, but the key or the compass rose is missing, or places are mislabeled.",
          ),
          lv(1, "Beginning", "A drawing of places without map parts."),
        ],
      },
      {
        id: "sources",
        label: "Using sources",
        levels: [
          lv(
            3,
            "Meeting",
            "Uses two kinds of sources, names where each came from and says what each shows.",
          ),
          lv(
            2,
            "Approaching",
            "Uses two sources but does not name the origin, or mixes what the source says with a guess.",
          ),
          lv(1, "Beginning", "Uses one source or states facts without a source."),
        ],
      },
      {
        id: "compare",
        label: "Then and now comparison",
        levels: [
          lv(
            3,
            "Meeting",
            "At least three rows that tell what stayed the same and what changed, plus a reason with because.",
          ),
          lv(2, "Approaching", "Lists changes without what stayed the same, or gives no reason."),
          lv(1, "Beginning", "States that the neighborhood is different without details."),
        ],
      },
      {
        id: "panel",
        label: "Museum panel and talk",
        levels: [
          lv(
            3,
            "Meeting",
            "The panel is organized and readable, and the talk uses a source and answers a question.",
          ),
          lv(2, "Approaching", "The panel is complete, but the talk does not refer to a source."),
          lv(1, "Beginning", "The panel is missing parts or needs prompts to talk."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can make a map with a key and a compass rose.",
    "I can say what a source tells me about the past.",
    "I can tell what stayed the same and what changed.",
    "I can explain a change using because.",
  ],
  peerFeedback: {
    structure: [
      "Partners read each other's panels.",
      "Each partner says one thing the panel makes clear and asks one question about a source.",
      "The author adds a label or a sentence to answer the question.",
    ],
    frames: tiers(
      ["I like ___.", "My question is ___."],
      ["I learned ___ from your panel.", "Where did you find ___?"],
      ["Your source shows ___. How do you know ___?"],
      ["Your explanation of ___ would be stronger if you added ___ from a second source."],
    ),
  },
  revision: {
    when: "After the map swap (session 3) and after the visitor notes (session 9).",
    steps: [
      "Read your partner's question or note.",
      "Decide what is missing: a label, a source name or a reason.",
      "Fix the map or the panel.",
    ],
    evidence: "A corrected map or panel with a label or source name added.",
  },
  finalProduct: {
    title: "A neighborhood map and a museum panel",
    description:
      "A map of the school neighborhood today, a then and now comparison built from at least two sources, and a museum panel with a short talk for visitors.",
    parts: [
      "The question",
      "The map with a title, key, compass rose and labels",
      "Two source organizers",
      "The then and now table and an explained change",
      "The museum panel",
      "A 60-second talk",
    ],
    successCriteria: [
      "Every fact about the past names a source.",
      "The map has all its parts.",
      "The panel explains one change with a reason.",
    ],
    audience: "Neighbors, families, school staff or another class",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
