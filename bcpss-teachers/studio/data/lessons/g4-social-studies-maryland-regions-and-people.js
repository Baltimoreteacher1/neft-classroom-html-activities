// Lesson pack: Maryland's Regions and the People Who Lived with the Land (grade 4 social studies). Original text, items and examples.
// All maps are schematic (west on the left, east on the right) and are not drawn to scale.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const launchMap = {
  kind: "map",
  alt: "A simple map in vertical strips, west on the left. Labels from west to east: West, Middle, East, Water and Ocean. Colors differ in each strip. The map is not to scale.",
  longDesc:
    "A schematic strip map with five strips and a compass arrow. From west to east the strips are labeled West, Middle, East, Water and Ocean. The map does not show a real place yet.",
  w: 560,
  h: 240,
  regions: [
    { id: "a", label: "West", rect: [0, 0, 120, 240], fill: "sage-soft" },
    { id: "b", label: "Middle", rect: [120, 0, 120, 240], fill: "copper-soft" },
    { id: "c", label: "East", rect: [240, 0, 120, 240], fill: "teal-soft" },
    { id: "d", label: "Water", rect: [360, 0, 90, 240], fill: "sky" },
    { id: "e", label: "Ocean", rect: [450, 0, 110, 240], fill: "sky" },
  ],
  compass: true,
};

const regionMap = {
  kind: "map",
  alt: "A simple strip map of Maryland, west on the left. From west to east: Appalachian Mountains, Piedmont, a thin line for the Fall Line, Western Shore, Chesapeake Bay, Eastern Shore and Atlantic Ocean. The map is not to scale.",
  longDesc:
    "A schematic map in vertical strips, not to scale, with west on the left. The strips are the Appalachian Mountains, the Piedmont, the Western Shore, the Chesapeake Bay, the Eastern Shore and the Atlantic Ocean. A thin line between the Piedmont and the Western Shore is the Fall Line. The Western Shore and the Eastern Shore together make up the Coastal Plain.",
  w: 700,
  h: 300,
  regions: [
    {
      id: "appalachian",
      label: "Appalachian Mountains",
      rect: [0, 0, 125, 300],
      fill: "sage-soft",
    },
    { id: "piedmont", label: "Piedmont", rect: [125, 0, 120, 300], fill: "copper-soft" },
    { id: "west-shore", label: "Western Shore", rect: [245, 0, 125, 300], fill: "teal-soft" },
    { id: "bay", label: "Chesapeake Bay", rect: [370, 0, 105, 300], fill: "sky" },
    { id: "east-shore", label: "Eastern Shore", rect: [475, 0, 120, 300], fill: "teal-soft" },
    { id: "atlantic", label: "Atlantic Ocean", rect: [595, 0, 105, 300], fill: "sky" },
    { id: "fall", label: "Fall Line", rect: [241, 0, 8, 300], fill: "coral", ly: 285 },
  ],
  compass: true,
};

const landByRegion = {
  kind: "table",
  alt: "A table comparing three regions of Maryland. Appalachian Mountains: highest land, forests, cold snowy winters. Piedmont: rolling hills, farms. Coastal Plain: low and flat, near the bay and the ocean.",
  longDesc:
    "Three rows. Appalachian Mountains: the highest land in Maryland, with forests and cold snowy winters. Piedmont: rolling hills and good farmland. Coastal Plain: low and flat land that reaches the Chesapeake Bay and the Atlantic Ocean.",
  w: 600,
  h: 250,
  head: ["Region", "The land", "How people use it"],
  rows: [
    ["Appalachian Mountains", "Highest land, forests", "Timber, hiking, skiing"],
    ["Piedmont", "Rolling hills", "Farms, mills, towns"],
    ["Coastal Plain", "Low and flat", "Seafood, farms, ports"],
  ],
};

const fallLine = {
  kind: "flow",
  alt: "A river flows from hills of hard rock, drops over rapids and small falls, and then moves slowly across flat land toward the sea.",
  steps: [
    { label: "Hills of hard rock", icon: "pine-tree" },
    { label: "Rapids and small waterfalls", icon: "drop" },
    { label: "Slow river on flat land", icon: "sailboat" },
  ],
};

const peoplePlaces = {
  kind: "table",
  alt: "A table matching people with places in Maryland. Piscataway: rivers of the Western Shore. Nanticoke: rivers of the Eastern Shore. Susquehannock: the Susquehanna River in the north. Harriet Tubman: Dorchester County. Frederick Douglass: Talbot County.",
  longDesc:
    "Five rows. Piscataway: lived along rivers on the Western Shore. Nanticoke: lived along rivers on the Eastern Shore. Susquehannock: lived along the Susquehanna River in the north. Harriet Tubman: born in Dorchester County on the Eastern Shore. Frederick Douglass: born in Talbot County on the Eastern Shore.",
  w: 600,
  h: 300,
  head: ["People", "Place"],
  rows: [
    ["Piscataway", "Rivers of the Western Shore"],
    ["Nanticoke", "Rivers of the Eastern Shore"],
    ["Susquehannock", "Susquehanna River in the north"],
    ["Harriet Tubman", "Dorchester County, Eastern Shore"],
    ["Frederick Douglass", "Talbot County, Eastern Shore"],
  ],
};

export default {
  id: "g4-social-studies-maryland-regions-and-people",
  kind: "lesson",
  title: "Maryland's Regions and the People Who Lived with the Land",
  subtitle:
    "Read a map of Maryland's regions, explain how the land and water shape life, and connect people to places",
  grade: "4",
  band: "3-5",
  subject: "social-studies",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to C3 D2.Geo.2.3-5 and D2.Geo.4.3-5; not mapped to a district unit sequence. The text, map, items and examples are original, and the map is schematic and not to scale.",
  },
  standards: ["D2.Geo.2.3-5", "D2.Geo.4.3-5", "RI.4.3", "SL.4.1"],
  wida: {
    eld: ["ELD-SS"],
    klus: ["Inform", "Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "4-5",
  },
  contentObjective:
    "I can name the three regions of Maryland, tell how the land and water in each region differ, and explain how the land shaped the lives of the people who lived there.",
  languageObjective:
    "I can compare two regions with 'both' and 'but', and explain how land shaped people's lives with 'because' and 'so'.",
  languageDemands: {
    functions: [
      "describe a place using land and water words",
      "compare two regions",
      "explain how a place affects people's lives",
    ],
    structures: [
      "The ___ is ___ and ___ .",
      "Both ___ and ___ have ___ , but ___ .",
      "People ___ because the land ___ .",
      "The land is ___ , so people ___ .",
    ],
    discourse:
      "A two-turn partner description of a region, then a written paragraph that connects one feature of the land to one thing people did.",
    barriers: [
      "'Fall Line' uses the word 'fall' for a drop in the land, not the season",
      "'region' and 'state' are easy to mix up; a state can contain several regions",
      "'shore', 'coast', 'bay' and 'ocean' name different bodies of water and edges of land",
      "geography names such as 'Piedmont' and 'Appalachian' are unfamiliar and have long, tricky spelling",
      "'adapt', 'natural resource' and 'elevation' are academic words that students rarely hear at home",
      "directions on a map (west on the left) need to be read before students can use the labels",
    ],
    oralRehearse: [
      "The Appalachian Mountains are in the west, and the land there is high and forested.",
      "Both the Piedmont and the Coastal Plain have farms, but the Piedmont has hills and the Coastal Plain is flat.",
      "Harriet Tubman knew the marshes and creeks of the Eastern Shore, so she could choose routes that people hunting for her did not expect.",
    ],
    writeScaffold:
      "The ___ is a region of Maryland. The land is ___ . People use ___ , and they ___ because ___ .",
  },
  vocab: {
    collection: "g4-social-studies-maryland-regions-and-people",
    ids: [
      "region",
      "landform",
      "elevation",
      "appalachian-mountains",
      "piedmont",
      "coastal-plain",
      "fall-line",
      "estuary",
      "chesapeake-bay",
      "natural-resource",
      "adapt",
      "eastern-shore",
    ],
  },
  launch: {
    title: "Notice and Wonder: a map with no place names",
    visual: launchMap,
    prompts: [
      "What do you notice about the strips of the map? What is the same and what is different?",
      "What do you wonder about each strip? What would you want to know about the land?",
      "If this map showed a place where you live, which strip would you want to visit first? Why?",
    ],
    teacherNote:
      "Show the map before you name Maryland. Take two noticings (for example 'there are five strips' and 'the water is in the middle') and one wondering. Record student words that describe land and water on a chart titled Words for Land and Water. Then say that the map shows Maryland from west to east and keep the chart for the lesson. Point out the north arrow and ask which edge of the map is west. Students must be able to say that west is on the left before they use the full map.",
  },
  teach: {
    text: {
      title: "Maryland's Land and Its People",
      note: "Original informational text for grade 4. Read aloud once, then have partners reread one paragraph each and underline the name of a region and one fact about its land.",
      paragraphs: [
        "Maryland is a small state with many kinds of land. Geographers divide it into three main regions: the Appalachian Mountains in the west, the Piedmont in the middle and the Coastal Plain in the east. The Chesapeake Bay cuts through the Coastal Plain and splits it into the Western Shore and the Eastern Shore.",
        "In the far west, the land rises into forested ridges. Backbone Mountain, the highest point in Maryland, is about 3,360 feet above sea level. Winters are cold and snowy. People have cut timber and mined coal in this region, and visitors come to hike, fish and ski.",
        "The Piedmont has rolling hills and good farmland. At its eastern edge is the Fall Line, where rivers drop over rapids. Mills used the moving water to run machines, and boats could not go farther upriver, so cities such as Baltimore grew near the Fall Line.",
        "The Coastal Plain is low and flat. It stretches from the Fall Line to the Chesapeake Bay and the Atlantic Ocean. The Bay is an estuary, where fresh water from rivers mixes with salty water from the sea. Crabs, oysters and fish live there. The Eastern Shore has flat farm fields of corn and soybeans, and the Atlantic coast has beaches such as Ocean City.",
        "People have lived with these lands for thousands of years. The Piscataway lived along rivers on the Western Shore. The Nanticoke lived along rivers on the Eastern Shore. The Susquehannock lived along the Susquehanna River in the north. Later, Harriet Tubman and Frederick Douglass were both born on the Eastern Shore, in Dorchester and Talbot counties. Each person's life was shaped by the land they knew.",
      ],
    },
    model: [
      "A region is a large area of land that shares features, such as the shape of the land, the climate and the plants. Maryland has three main regions. Each has its own landforms: mountains and ridges in the west, rolling hills in the middle and low flat land in the east. Elevation, how high the land is above sea level, is highest in the west and lowest near the bay and ocean.",
      "The Fall Line separates the hills of the Piedmont from the flat Coastal Plain. At the Fall Line, hard rock meets soft land, so rivers drop in rapids and small waterfalls. That matters for people. Moving water could power mills, and boats could not go farther upriver, so towns grew up around the Fall Line.",
      "The Chesapeake Bay is an estuary. Fresh river water mixes with salty sea water, which makes a home for crabs, oysters and fish. These are natural resources. A natural resource is something from nature that people use, such as water, trees, soil or seafood.",
      "People adapt to the land they live in. Adapting means changing how you live or work so that it fits the place. People in the cold western mountains heat their homes and cut wood. People on the Chesapeake Bay use boats and fish. Farmers on the flat Eastern Shore grow crops that do well in the flat, low land.",
      "The land is part of people's stories. Harriet Tubman worked in the forests and marshes of the Eastern Shore, so she knew paths and hiding places that she could use to guide others to freedom. The Nanticoke lived along the rivers of the same shore. Both knew that land very well, and that knowledge shaped what they could do.",
    ],
    moves: [
      "Project the strip map and have students trace the route from west to east with a finger, saying each region out loud. Do this twice before any reading. West is on the left, so write the word west above the left edge.",
      "Read the informational text aloud. After each paragraph ask 'What did this tell us about the land?' and add a word or phrase to the Words for Land and Water chart, grouped by region.",
      "Build a three-column table on the board with Region, The land and How people use it. Fill in one row together using the frames: 'The Piedmont has rolling hills, so farms spread across it.'",
      "Use the Fall Line flow picture to act out a river: students stand and move slowly, then speed up at the rapids, then slow down again. Ask 'What would you build near fast water? Why?'",
      "Connect people to land one pair at a time: show the people and places table and ask 'What kind of land is that? What can people do there?'. Take care to describe the Piscataway, Nanticoke and Susquehannock as living peoples with homelands, not only as figures from the past.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Which region is farthest west in Maryland?",
      choices: ["The Appalachian Mountains", "The Piedmont", "The Coastal Plain"],
      answer: 0,
      hint: "West is on the left of the map. The ocean is on the east side, so look for the region farthest from it.",
      supports: {
        ee: {
          frames: ["The ___ is in the west.", "West is on the ___ ."],
          wordBank: ["west", "left", "mountains", "map"],
          visual: regionMap,
          oral: "Point to the left side of the map. Say the name of the region there.",
        },
        dev: {
          frames: ["The region in the far west is the ___ ."],
          wordBank: ["west", "east", "region"],
        },
        exp: { frames: ["The ___ is farthest west, while the ___ is closest to the ocean."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which sentence about the Coastal Plain is true?",
      choices: [
        "It is low and flat, and it reaches the bay and the ocean.",
        "It has the highest mountains in Maryland.",
        "It is the same region as the Piedmont.",
      ],
      answer: 0,
      hint: "Think about the word plain. What does the land look like, and what is nearby?",
      supports: {
        ee: {
          frames: ["The Coastal Plain is ___ and ___ ."],
          wordBank: ["low", "flat", "bay", "ocean"],
          visual: landByRegion,
        },
        dev: {
          frames: ["The Coastal Plain is ___ , so ___ ."],
          wordBank: ["low", "flat", "near water"],
        },
        exp: { frames: ["The Coastal Plain is not like the mountains because ___ ."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "Rivers drop over rapids at the Fall Line. Use the word because or so to explain why towns and mills grew near it.",
      answer:
        "Rivers drop over rapids at the Fall Line, so moving water could power mills, and boats could not go farther upriver.",
      hint: "Think about what moving water can do for a machine, and what rapids do to a boat.",
      supports: {
        ee: {
          frames: ["The river moves ___ at the Fall Line.", "Mills use the ___ ."],
          wordBank: ["fast", "water", "power", "mills", "boats"],
          visual: fallLine,
        },
        dev: {
          frames: ["Towns grew near the Fall Line because ___ ."],
          wordBank: ["rapids", "power", "boats"],
        },
        exp: { frames: ["Since the river ___ at the Fall Line, people could ___ , so ___ ."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt: "Name one natural resource of the Chesapeake Bay and tell one way people use it.",
      answer: "Crabs, oysters or fish live in the Bay, and people catch them to eat and to sell.",
      hint: "Think about what lives in the water and what people do with it.",
      supports: {
        ee: {
          frames: ["The Bay has ___ .", "People ___ them."],
          wordBank: ["crabs", "oysters", "fish", "catch", "eat", "sell"],
        },
        dev: {
          frames: ["A natural resource of the Bay is ___ . People use it to ___ ."],
          wordBank: ["resource", "use", "sell"],
        },
        exp: { frames: ["The Bay provides ___ , which people ___ because ___ ."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "short",
      prompt:
        "Harriet Tubman was born on the Eastern Shore. Tell how knowing the land of the Eastern Shore mattered in her life. Use because.",
      answer:
        "She knew the marshes, creeks and woods of the Eastern Shore, so she could choose routes and hiding places that helped her guide others to freedom.",
      hint: "Think about the kind of land she worked in and what she could do with what she learned there.",
      supports: {
        ee: {
          frames: ["Harriet knew the ___ .", "She could ___ ."],
          wordBank: ["marshes", "creeks", "woods", "hide", "guide"],
          visual: peoplePlaces,
        },
        dev: {
          frames: ["Harriet knew ___ , so she ___ ."],
          wordBank: ["land", "route", "because"],
        },
        exp: { frames: ["Because Harriet knew ___ , she was able to ___ ."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Region postcard",
    task: "Groups of three choose one of the three regions. Each group makes a postcard with a simple drawing of the land on the front. On the back, they write three facts about the land (landforms, elevation, water), two natural resources people use there, and one way people adapt to living there. Groups then swap postcards and say one way the new region is the same as theirs and one way it is different, using both and but.",
    roles: ["Map reader", "Fact finder", "Card writer"],
    discussionCards: [
      {
        prompt: "What does the land look like in your region? Is it high or low, hilly or flat?",
        frame: "The land in the ___ is ___ and ___ .",
      },
      {
        prompt: "What natural resources do people use there? How do they use them?",
        frame: "People use ___ to ___ .",
      },
      {
        prompt: "How do people adapt to living there?",
        frame: "People adapt to the ___ by ___ because ___ .",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: land in the three regions",
      visualOrModel: landByRegion,
      teacherNote:
        "Place the table next to the strip map. Ask students to point to the strip on the map for each row and say the land word in the table. Then ask which row would change the most if you moved the same family from one region to another.",
    },
    discuss: {
      title: "Say it: compare two regions",
      structure:
        "Turn and talk. Partner 1 names two regions and tells one way they are the same. Partner 2 tells one way they are different, using but. Switch and choose a different pair.",
      frames: [
        "Both the ___ and the ___ have ___ .",
        "But the ___ is ___ , and the ___ is ___ .",
        "That matters because ___ .",
      ],
    },
    apply: {
      title: "Use it: land and people",
      task: "Write a paragraph of five or six sentences about one region of Maryland. Name the region, describe the land and the water, tell one natural resource people use, and explain how people adapt or how the land shaped the life of one person or group (for example Harriet Tubman, the Nanticoke or the Susquehannock). Use because or so at least twice.",
      successCriteria: [
        "I named a region and described its land and water.",
        "I used at least one vocabulary word such as elevation, estuary or natural resource correctly.",
        "I named a natural resource and told how people use it.",
        "I used because or so to explain how the land shaped people's lives.",
      ],
    },
  },
  activities: [
    { engine: "concept-builder", id: "g4-social-studies-maryland-regions-map" },
    { engine: "language-detective", id: "g4-social-studies-tubman-land-detective" },
    { engine: "vocab-quest", id: "g4-social-studies-maryland-regions-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which region of Maryland has the highest elevation?",
        choices: ["The Appalachian Mountains", "The Piedmont", "The Coastal Plain"],
        answer: 0,
        explain:
          "The land rises to its highest point in the west, in the Appalachian Mountains. The Coastal Plain is low and flat.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Which body of water separates the Western Shore from the Eastern Shore?",
        choices: ["The Atlantic Ocean", "The Chesapeake Bay", "The Fall Line"],
        answer: 1,
        explain:
          "The Chesapeake Bay lies between the two shores. The Atlantic Ocean is east of the Eastern Shore, and the Fall Line is a place on land where rivers drop.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "What is the Fall Line?",
        choices: [
          "The place where hills meet the coastal land and rivers drop over rapids.",
          "The day in autumn when leaves fall.",
          "A fence along the edge of Maryland.",
        ],
        answer: 0,
        explain:
          "The Fall Line is a place on the map where hard rock meets softer land, so rivers speed up in rapids and small waterfalls.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "A farmer on the Eastern Shore is most likely to grow which crops on the flat land?",
        choices: ["Corn and soybeans", "Coal and timber", "Skiing slopes and snow"],
        answer: 0,
        explain:
          "Flat land is good for fields of corn and soybeans. Coal and timber come from the mountains, and skiing needs high snowy land.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which pair matches a person with the part of Maryland where the person was born?",
        choices: [
          "Frederick Douglass, born in Talbot County on the Eastern Shore",
          "Frederick Douglass, born in Garrett County in the mountains",
          "Harriet Tubman, born in Frederick County in the Piedmont",
        ],
        answer: 0,
        explain:
          "Frederick Douglass was born in Talbot County, which is on the Eastern Shore. Harriet Tubman was born in Dorchester County, which is also on the Eastern Shore.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Explain how people adapt to living near the Chesapeake Bay. Name a natural resource in your answer and use because.",
        answer:
          "Any accurate answer, such as: People near the Bay use boats and fish for crabs and oysters because the Bay is an estuary full of seafood.",
        explain:
          "Look for a natural resource of the Bay, how people use it, and a reason joined with because.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Tell one way the Piedmont and the Coastal Plain are alike and one way they are different. Use both and but.",
        answer:
          "Both the Piedmont and the Coastal Plain have farms, but the Piedmont has rolling hills and the Coastal Plain is low and flat.",
        explain:
          "Both regions have farmland. The land is different: the Piedmont has rolling hills and the Coastal Plain is flat.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which word means how high a place is above sea level?",
        choices: ["Elevation", "Estuary", "Region"],
        answer: 0,
        explain:
          "Elevation tells how high a place is. An estuary is where fresh and salty water mix, and a region is a large area that shares features.",
      },
      {
        id: "f2",
        type: "short",
        prompt: "Name one natural resource in Maryland and tell one way people use it.",
        answer:
          "Any accurate pair, such as trees that are used for lumber and paper, or crabs that are caught and eaten.",
        explain: "A natural resource comes from nature, and the answer must say how people use it.",
      },
      {
        id: "f3",
        type: "choice",
        prompt: "Which sentence explains how land shaped a person's life?",
        choices: [
          "Harriet Tubman knew the marshes and creeks of the Eastern Shore, so she could choose hidden routes.",
          "Harriet Tubman was a brave person.",
          "The Eastern Shore is east of the Chesapeake Bay.",
        ],
        answer: 0,
        explain:
          "The first sentence connects knowing the land to what the person did. The others tell a trait or a location.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about Maryland's land and people.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "Which region is low and flat and reaches the Chesapeake Bay and the Atlantic Ocean?",
        choices: ["The Coastal Plain", "The Piedmont", "The Appalachian Mountains"],
        answer: 0,
        explain:
          "The Coastal Plain is the low flat region in the east. The Piedmont has rolling hills and the Appalachian Mountains are in the west.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write one sentence about a region of Maryland. Include one thing about the land and use the word because or so.",
        answer:
          "Any accurate sentence that names a region, describes its land and uses because or so, for example: The Coastal Plain is flat, so many farms grow corn there.",
        explain:
          "The sentence needs a region name, a fact about the land and a connection with because or so.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Tell one way the land of the Eastern Shore mattered in the life of Harriet Tubman or the Nanticoke.",
        answer:
          "Any accurate connection, such as: Harriet Tubman knew the marshes and creeks, so she could hide and choose routes.",
        explain:
          "The answer needs a feature of the Eastern Shore land and how it mattered to a person or a people.",
      },
    ],
    successCriteria: [
      "I named a region and a fact about its land.",
      "I used because or so to connect land and people.",
      "I used at least one vocabulary word correctly.",
    ],
  },
  answerKey: {
    notes:
      "For short items accept any accurate response that names a feature of the land or water and connects it to what people do with because or so. Keep descriptions of the Piscataway, Nanticoke and Susquehannock in present or respectful past language; do not accept answers that present these nations as only existing in the past. Common errors: treating the Bay as the ocean, placing the Piedmont on the coast, and saying that land decides everything people do. The last is a fair thing to correct: land shapes choices, but people also make decisions.",
    items: {
      g1: "The Appalachian Mountains. They are on the left side of the map, farthest from the ocean.",
      g2: "It is low and flat, and it reaches the bay and the ocean.",
      g3: "Rivers drop over rapids at the Fall Line, so moving water could power mills, and boats could not go farther upriver.",
      g4: "Crabs, oysters or fish live in the Bay, and people catch them to eat and sell.",
      g5: "She knew the marshes, creeks and woods of the Eastern Shore, so she could choose routes and hiding places to guide others to freedom.",
      i1: "The Appalachian Mountains.",
      i2: "The Chesapeake Bay.",
      i3: "The place where hills meet the coastal land and rivers drop over rapids.",
      i4: "Corn and soybeans.",
      i5: "Frederick Douglass, born in Talbot County on the Eastern Shore.",
      i6: "Any accurate answer, for example: People near the Bay use boats and fish for crabs and oysters because the Bay is an estuary full of seafood.",
      i7: "Both the Piedmont and the Coastal Plain have farms, but the Piedmont has rolling hills and the Coastal Plain is low and flat.",
      f1: "Elevation.",
      f2: "Any accurate pair, for example trees for lumber and paper, or crabs for food.",
      f3: "Harriet Tubman knew the marshes and creeks of the Eastern Shore, so she could choose hidden routes.",
      e1: "The Coastal Plain.",
      e2: "Any accurate sentence that names a region, describes its land and uses because or so.",
      e3: "Any accurate connection to the land of the Eastern Shore, such as Harriet Tubman using the marshes and creeks to hide and choose routes.",
    },
  },
  extension: {
    title: "A travel brochure for a region",
    task: "Create a one-page brochure for a region of Maryland for visitors who have never been there. Include a map clip with the region labeled, three facts about the land and water, two natural resources, and one way people have adapted to living there. Add one sentence about a person or people connected to the region, such as the Nanticoke or Harriet Tubman. Present the brochure to a partner who has chosen a different region and ask them to name one way the two regions are different.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo nombrar las regiones de Maryland, describir la tierra de cada una y explicar cómo la tierra influyó en la vida de las personas.",
      vocab: [
        { en: "region", es: "región", verified: false },
        { en: "natural resource", es: "recurso natural", verified: false },
        { en: "estuary", es: "estuario", verified: false },
        { en: "adapt", es: "adaptarse", verified: false },
        { en: "elevation", es: "elevación", verified: false },
      ],
      familyPrompt:
        "Hablen en familia de un lugar que conocen. ¿Cómo es la tierra, alta o baja, con montañas o con agua? ¿Qué hace la gente para vivir bien allí? Usen las palabras porque y entonces.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Text and teaching 12. Guided practice 8. Postcard work 10. Activity time 10 (the map activity is the shortest; the Tubman detective is the longest). Exit ticket 5. If time is short, run the map activity on its own and move the Tubman detective to a second day as a close reading of land and people.",
    misconceptions: [
      "Region equals state: students think a region is a state. Ask 'How many different kinds of land can one state have?' and return to the strip map.",
      "The Bay is the ocean: students say the Atlantic Ocean is between the shores. Show on the map that the Eastern Shore lies between the bay and the ocean.",
      "The Fall Line is a wall or a fence: students picture a barrier. Use the flow picture and the acting-out move to show it is a place where rivers speed up.",
      "Land decides everything: students say people in a region 'had to' do one thing. Teach 'shaped' and 'made some choices easier' instead of 'decided'.",
      "Native nations as a thing of the past: students use only past tense or say the nations disappeared. Use respectful language, note that Maryland's Native peoples are part of the state today, and take care with any claim you are not certain of.",
    ],
    differentiation:
      "Entering and Emerging learners trace the map with a finger, use the frames and word banks, and match each region to a picture before they write. Developing and Expanding learners write full sentences with because or so and compare two regions. Bridging learners connect one feature of the land to the choices of one person or group, with a vocabulary word used accurately. Every tier answers the same questions about the same regions; only the language supports change.",
    languageNotes:
      "Teach the polysemy of 'fall' with two pictures (a falling leaf and a river dropping). Keep a chart of land and water words grouped by region. Say each region name aloud with students, using the pronunciations in the vocabulary bank, before they read it. Ask students to say the map directions ('west is on the left') every time they use the map until they stop needing to.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
