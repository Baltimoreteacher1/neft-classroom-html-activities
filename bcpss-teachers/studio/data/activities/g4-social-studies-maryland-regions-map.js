// Concept Builder (map-hotspots): read a schematic strip map of Maryland and choose regions that fit clues about land, water and travel.
// The map is a simplified west-to-east picture and is not to scale; it makes no claim about exact borders.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const eq = (ids) => ({ type: "set", of: "selected", expected: ids, mode: "equal" });
const has = (ids) => ({ type: "set", of: "selected", expected: ids, mode: "superset" });

const strips = [
  { id: "appalachian", label: "Appalachian Mountains", rect: [0, 0, 125, 260], fill: "sage-soft" },
  { id: "piedmont", label: "Piedmont", rect: [125, 0, 120, 260], fill: "copper-soft" },
  { id: "west-shore", label: "Western Shore", rect: [245, 0, 125, 260], fill: "teal-soft" },
  { id: "bay", label: "Chesapeake Bay", rect: [370, 0, 105, 260], fill: "sky" },
  { id: "east-shore", label: "Eastern Shore", rect: [475, 0, 120, 260], fill: "teal-soft" },
  { id: "atlantic", label: "Atlantic Ocean", rect: [595, 0, 105, 260], fill: "sky" },
];

const mapVisual = {
  kind: "map",
  alt: "A simple strip map of Maryland, west on the left. From west to east: Appalachian Mountains, Piedmont, a thin red-orange line for the Fall Line, Western Shore, Chesapeake Bay, Eastern Shore and Atlantic Ocean. The map is not to scale.",
  longDesc:
    "A schematic map in vertical strips, not to scale. West is on the left and east on the right. The strips are the Appalachian Mountains, the Piedmont, the Western Shore, the Chesapeake Bay, the Eastern Shore and the Atlantic Ocean. A thin line between the Piedmont and the Western Shore is the Fall Line. The Western Shore and the Eastern Shore together make up the Coastal Plain.",
  w: 700,
  h: 260,
  regions: [
    // The engine prints each hotspot label on top of the map, so the picture itself carries no region labels except the Fall Line.
    ...strips.map(({ label, ...r }) => r),
    { id: "fall", label: "Fall Line", rect: [241, 0, 8, 260], fill: "coral", ly: 245 },
  ],
  compass: true,
};

const hotspots = strips.map(({ id, label, rect }) => ({ id, label, rect }));

export default {
  id: "g4-social-studies-maryland-regions-map",
  engine: "concept-builder",
  kind: "map-hotspots",
  title: "Read the Map of Maryland's Regions",
  grade: "4",
  band: "3-5",
  subject: "social-studies",
  lessonId: "g4-social-studies-maryland-regions-and-people",
  standards: ["D2.Geo.2.3-5", "D2.Geo.4.3-5"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to C3 D2.Geo.2.3-5 and D2.Geo.4.3-5; not mapped to a district unit sequence.",
  },
  minutes: 16,
  intro:
    "This is a simple map of Maryland with west on the left and east on the right. It is not to scale. Use the labels and the clues to choose the regions that fit each question.",
  model: {
    visual: mapVisual,
    regions: hotspots,
    multi: true,
  },
  tasks: [
    {
      id: "t1",
      prompt: "Select the region of Maryland with the highest elevation.",
      goal: "One region chosen",
      target: { selected: ["appalachian"] },
      check: eq(["appalachian"]),
      hints: [
        "Elevation means how high the land is above sea level.",
        "The ocean is on the east side of the map. Think about which end is farthest from it.",
        "Look for the region that has mountains and forested ridges.",
      ],
      misconceptions: [
        {
          match: "chose-hills",
          when: eq(["piedmont"]),
          hint: "The Piedmont has rolling hills, but they are lower than mountains. Which region has the highest land?",
          model:
            "The Piedmont's hills are gentle, so its elevation is lower than the mountains in the far west.",
        },
        {
          match: "chose-coast",
          when: { type: "any", checks: [eq(["west-shore"]), eq(["east-shore"])] },
          hint: "The shores are low and flat, close to sea level. Look for land that rises higher.",
          model:
            "The Coastal Plain is close to sea level. The mountains in the west rise much higher.",
        },
      ],
      model:
        "The Appalachian Mountains in the far west have the highest elevation in Maryland. The land gets lower as you move east toward the bay and the ocean.",
      right: "Yes. Land rises to its highest point in the west, in the Appalachian Mountains.",
      supports: {
        ee: {
          frames: ["The highest land is in the ___ .", "It has ___ ."],
          wordBank: ["mountains", "high", "west", "forest"],
          directions:
            "Read the labels on the map from left to right. Choose one region by tapping it.",
          oral: "Point to the west end of the map. Say what kind of land is there.",
        },
        dev: {
          frames: ["I chose ___ because it has ___ ."],
          wordBank: ["elevation", "mountains", "ridges"],
        },
        exp: { frames: ["I chose ___ because its elevation is ___ than ___ ."] },
        br: {},
      },
      explain: {
        prompt: "Which region did you choose, and what clue about the land helped you decide?",
        frames: fr(
          ["I chose ___ . It has ___ ."],
          ["I chose ___ because it has ___ , so its land is ___ ."],
          ["I chose ___ because its elevation is higher than ___ , since ___ ."],
          ["The region with the highest elevation is ___ , as shown by ___ ."],
        ),
        mustMention: [
          {
            id: "clue",
            label: "a clue about the land",
            any: ["high", "mountain", "elevation", "ridge", "forest", "west"],
          },
        ],
        criteria: [
          { id: "c1", label: "I named the region." },
          { id: "c2", label: "I gave a clue with because or so." },
          { id: "c3", label: "I used a word such as elevation or mountains." },
        ],
      },
    },
    {
      id: "t2",
      prompt: "Select the body of water that lies between the Western Shore and the Eastern Shore.",
      goal: "One body of water chosen",
      target: { selected: ["bay"] },
      check: eq(["bay"]),
      hints: [
        "Find the two shores on the map. What is between them?",
        "It is a large estuary, where fresh river water mixes with salty water.",
        "The other body of water on the map is on the far east side.",
      ],
      misconceptions: [
        {
          match: "chose-ocean",
          when: eq(["atlantic"]),
          hint: "The Atlantic Ocean is east of the Eastern Shore. It is not between the two shores.",
          model:
            "The Eastern Shore lies between the bay and the ocean, so the bay is the water between the two shores.",
        },
      ],
      model:
        "The Chesapeake Bay is the large estuary between the Western Shore and the Eastern Shore. The Atlantic Ocean is farther east.",
      right: "Right. The Bay separates the Western Shore from the Eastern Shore.",
      supports: {
        ee: {
          frames: ["The water between the shores is the ___ ."],
          wordBank: ["bay", "ocean", "shore", "between"],
          directions: "Find the two shores. Look at the strip between them.",
        },
        dev: {
          frames: ["The ___ is between the ___ and the ___ ."],
          wordBank: ["estuary", "between", "shore"],
        },
        exp: {
          frames: ["The ___ separates the two parts of the Coastal Plain because it lies ___ ."],
        },
        br: {},
      },
      explain: {
        prompt: "How did you know that body of water was the one between the shores?",
        frames: fr(
          ["It is between ___ and ___ ."],
          ["I know because the ___ is on one side and the ___ is on the other side."],
          ["I knew it was the bay because it lies between ___ and ___ , while the ocean is ___ ."],
          ["The map shows the bay between the two shores, whereas the ocean is farther ___ ."],
        ),
        mustMention: [
          {
            id: "between",
            label: "which shores it lies between",
            any: ["between", "western", "eastern", "shore"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what is on each side." },
          { id: "c2", label: "I used the word between." },
          { id: "c3", label: "I named at least one shore." },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "Rivers drop over rapids where the hard rock of the hills meets the soft land of the coast. Select the region just west of the Fall Line.",
      goal: "One region chosen",
      target: { selected: ["piedmont"] },
      check: eq(["piedmont"]),
      hints: [
        "On this map west is on the left. Find the thin line labeled Fall Line.",
        "Look at the strip that touches the line on its left side.",
        "That region has rolling hills and good farmland and is between the mountains and the coast.",
      ],
      misconceptions: [
        {
          match: "chose-east-of-line",
          when: eq(["west-shore"]),
          hint: "That region is east of the Fall Line, on the right side of the map.",
          model:
            "The Western Shore is on the east side of the Fall Line. The Piedmont is on the west side.",
        },
        {
          match: "chose-mountains",
          when: eq(["appalachian"]),
          hint: "The mountains are farther west. Which region touches the Fall Line itself?",
          model:
            "The Appalachian Mountains are farther west than the Fall Line. The Piedmont is the region right next to it.",
        },
      ],
      model:
        "The Piedmont is just west of the Fall Line. It lies between the Appalachian Mountains and the Coastal Plain.",
      right: "Yes. The Piedmont is the region on the west side of the Fall Line.",
      supports: {
        ee: {
          frames: ["The region west of the line is the ___ ."],
          wordBank: ["west", "left", "Fall Line", "hills"],
          directions: "West is on the left. Find the thin line, then look to its left.",
        },
        dev: {
          frames: ["I looked ___ of the Fall Line and found the ___ ."],
          wordBank: ["west", "east", "hills"],
        },
        exp: { frames: ["The ___ is just west of the Fall Line, between ___ and ___ ."] },
        br: {},
      },
      justify: {
        prompt: "Why did towns and mills grow near the Fall Line? Choose the reasons that fit.",
        options: [
          {
            id: "j1",
            text: "Moving water in the rapids could power machines such as mill wheels.",
            ok: true,
          },
          {
            id: "j2",
            text: "Boats could not travel farther upriver past the rapids, so goods were moved there.",
            ok: true,
          },
          {
            id: "j3",
            text: "The land there is flat for hundreds of miles, so it is the best place to farm.",
            ok: false,
            hint: "The land near the Fall Line is not a wide flat farm field. Think about what the river does there.",
          },
          {
            id: "j4",
            text: "Mountains there blocked the wind.",
            ok: false,
            hint: "The mountains are far to the west. Think about what happens to the water at the Fall Line.",
          },
        ],
        min: 2,
        model:
          "At the Fall Line the river drops in rapids. The moving water could turn mill wheels, and boats had to stop there, so people built towns.",
      },
      explain: {
        prompt:
          "What did you notice about where the Fall Line sits, and which region did you choose because of it?",
        frames: fr(
          ["The Fall Line is between ___ and ___ ."],
          ["I looked west of the Fall Line and found the ___ because ___ ."],
          [
            "Since the Fall Line separates the ___ from the ___ , the region just west of it is the ___ .",
          ],
          ["The Fall Line marks the edge of the ___ , so the region west of it, the ___ , ___ ."],
        ),
        mustMention: [
          { id: "line", label: "the Fall Line or west", any: ["fall line", "west", "left"] },
        ],
        criteria: [
          { id: "c1", label: "I said which side of the line." },
          { id: "c2", label: "I gave a reason with because or since." },
          { id: "c3", label: "I named the region." },
        ],
      },
    },
    {
      id: "t4",
      prompt:
        "The Coastal Plain is the low, flat land that reaches from the Fall Line to the bay and the ocean. Select every part of Maryland that is in the Coastal Plain.",
      goal: "Every Coastal Plain part chosen",
      target: { selected: ["west-shore", "east-shore"] },
      check: eq(["west-shore", "east-shore"]),
      hints: [
        "The Coastal Plain is east of the Fall Line.",
        "Water is not land. Look for the land on each side of the bay.",
        "There are two parts, and each one is named for the side of the bay it is on.",
      ],
      misconceptions: [
        {
          match: "added-piedmont",
          when: has(["piedmont"]),
          hint: "The Piedmont is west of the Fall Line and has rolling hills. The Coastal Plain is east of the line and flat.",
          model:
            "The Piedmont's rolling hills are higher than the flat Coastal Plain, so it is a different region.",
        },
        {
          match: "only-one-shore",
          when: { type: "relation", left: "count", op: "eq", right: { value: "1" } },
          hint: "The Coastal Plain is split by the bay. Is the flat land on only one side?",
          model:
            "The Coastal Plain includes land on both sides of the bay, the Western Shore and the Eastern Shore.",
        },
      ],
      model:
        "The Coastal Plain includes the Western Shore and the Eastern Shore. The Chesapeake Bay runs between them, but the low flat land continues on both sides.",
      right:
        "Right. Both shores are the same region, the low flat Coastal Plain, even though the bay divides it.",
      supports: {
        ee: {
          frames: ["The Coastal Plain has two parts: the ___ and the ___ ."],
          wordBank: ["flat", "low", "Western Shore", "Eastern Shore"],
          directions: "You can choose more than one region. Tap each part, then press Check.",
        },
        dev: {
          frames: ["The Coastal Plain is ___ and ___ , so it includes ___ and ___ ."],
          wordBank: ["flat", "low", "both shores"],
        },
        exp: {
          frames: [
            "Although the bay divides it, the Coastal Plain includes both ___ because ___ .",
          ],
        },
        br: {},
      },
      explain: {
        prompt:
          "Which regions did you choose, and why do they belong to one Coastal Plain even with a bay between them?",
        frames: fr(
          ["I chose ___ and ___ . Both are ___ ."],
          ["I chose ___ and ___ because both are ___ and east of the ___ ."],
          [
            "Both shores belong to the Coastal Plain because they are ___ and ___ , even though the bay ___ .",
          ],
          ["The bay divides the Coastal Plain into two shores, but both share ___ ."],
        ),
        mustMention: [
          { id: "flat", label: "that the land is low or flat", any: ["flat", "low", "east of"] },
          { id: "both", label: "that both shores are included", any: ["both", "two", "shores"] },
        ],
        criteria: [
          { id: "c1", label: "I named both regions." },
          { id: "c2", label: "I said what they share." },
          { id: "c3", label: "I used the word both or two." },
        ],
      },
    },
    {
      id: "t5",
      prompt:
        "You are driving from the mountains toward the Chesapeake Bay without crossing it. Select every land region you pass through before you reach the Bay.",
      goal: "Every region on the trip chosen",
      target: { selected: ["appalachian", "piedmont", "west-shore"] },
      check: eq(["appalachian", "piedmont", "west-shore"]),
      hints: [
        "Start at the west end of the map and move right.",
        "Stop when you reach the bay. Do not cross it.",
        "You pass through three land regions, and the last one is on the Bay's west side.",
      ],
      misconceptions: [
        {
          match: "crossed-bay",
          when: has(["east-shore"]),
          hint: "To reach the Eastern Shore you would have to cross the bay. Your trip stops at the bay.",
          model:
            "The Eastern Shore is on the other side of the Chesapeake Bay, so a drive that stops at the Bay does not include it.",
        },
        {
          match: "chose-water",
          when: has(["bay", "atlantic"]),
          hint: "You are choosing land regions you drive through. The Bay and the ocean are water.",
          model:
            "You cannot drive through water, so the trip includes only the three land regions west of the Bay.",
        },
      ],
      model:
        "Starting in the west you pass through the Appalachian Mountains, then the Piedmont, crossing the Fall Line, and then the Western Shore. After that you reach the Chesapeake Bay.",
      right:
        "Yes. The land goes from high mountains to rolling hills to low flat shore before the Bay.",
      supports: {
        ee: {
          frames: ["First, the ___ . Next, the ___ . Then, the ___ ."],
          wordBank: ["first", "next", "then", "mountains", "hills", "flat"],
          directions:
            "Move your finger from left to right on the map. Say each region as you pass it.",
        },
        dev: {
          frames: ["I start in the ___ , then I go through the ___ and the ___ ."],
          wordBank: ["start", "pass", "reach"],
        },
        exp: { frames: ["As I drive east, the land changes from ___ to ___ to ___ ."] },
        br: {},
      },
      explain: {
        prompt: "Describe how the land changes as you drive from the mountains toward the Bay.",
        frames: fr(
          ["First the land is ___ . Then it is ___ . Last it is ___ ."],
          ["The land starts ___ , becomes ___ and ends ___ because ___ ."],
          [
            "As I drive east, the elevation ___ , so the land changes from ___ to ___ and finally ___ .",
          ],
          [
            "Traveling east, the landforms shift gradually from ___ through ___ to ___ , reflecting ___ .",
          ],
        ),
        mustMention: [
          {
            id: "change",
            label: "how the land or elevation changes",
            any: ["lower", "flat", "higher", "hills", "mountain", "elevation", "change"],
          },
        ],
        criteria: [
          { id: "c1", label: "I put the regions in order." },
          { id: "c2", label: "I described the land in each one." },
          { id: "c3", label: "I used an order word such as first, next or then." },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "What does the map help you understand about how the land of Maryland changes from west to east?",
    frames: fr(
      ["The land goes from ___ to ___ ."],
      ["The map shows that the land changes from ___ in the west to ___ in the east."],
      ["By reading the map I learned that ___ , which means ___ ."],
      [
        "The map suggests a gradual change in elevation from the west to the east, which affects ___ .",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
