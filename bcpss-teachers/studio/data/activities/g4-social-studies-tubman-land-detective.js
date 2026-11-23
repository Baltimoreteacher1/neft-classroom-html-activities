// Language Detective: read an original informational passage about Harriet Tubman and the land of Maryland's Eastern Shore, find proof, and build a claim.
// Facts used: born into slavery in Dorchester County; worked in forests and marshes; escaped in 1849; returned to Maryland many times; historians estimate about thirteen trips and about seventy people.
const s = (id, text, para) => ({ id, text, para });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

export default {
  id: "g4-social-studies-tubman-land-detective",
  engine: "language-detective",
  title: "History Detective: Harriet Tubman and the Eastern Shore",
  grade: "4",
  band: "3-5",
  subject: "social-studies",
  lessonId: "g4-social-studies-maryland-regions-and-people",
  standards: ["RI.4.1", "RI.4.3", "D2.Geo.4.3-5"],
  vocabIds: ["region", "natural-resource", "adapt", "eastern-shore", "coastal-plain"],
  minutes: 18,
  intro:
    "Read a short text about a Marylander who knew her land very well. Find the sentences that prove how the land of the Eastern Shore mattered in her life, and build a claim you can back up.",
  scene: {
    kind: "passage",
    title: "Harriet Tubman and the Land She Knew",
    source: "Original - The Language Page",
    caption: "An informational text for grade 4, written for this activity.",
    sentences: [
      s(
        "s1",
        "Harriet Tubman was born into slavery in Dorchester County, on Maryland's Eastern Shore.",
        0,
      ),
      s(
        "s2",
        "The Eastern Shore is low, flat land crossed by creeks, marshes and the wide Chesapeake Bay.",
        0,
      ),
      s(
        "s3",
        "As a young woman, Harriet worked outdoors, cutting wood in forests and working in marshes.",
        1,
      ),
      s("s4", "Working there, she learned the paths, the creeks and the hiding places.", 1),
      s(
        "s5",
        "In 1849, Harriet escaped and traveled north to Pennsylvania, where she was free.",
        2,
      ),
      s("s6", "She did not stay there.", 2),
      s("s7", "She returned to Maryland many times to lead other people to freedom.", 2),
      s(
        "s8",
        "Historians estimate that she made about thirteen trips and guided about seventy people.",
        3,
      ),
      s(
        "s9",
        "She usually traveled at night, followed the North Star and used the woods and marshes to stay hidden.",
        3,
      ),
      s(
        "s10",
        "Because she knew the land so well, she could choose routes that the people hunting for her would not expect.",
        3,
      ),
      s(
        "s11",
        "Later, during the Civil War, she worked for the Union Army as a nurse, a scout and a spy.",
        4,
      ),
      s(
        "s12",
        "Visitors to Dorchester County today can still see marshes and creeks like the ones she knew.",
        4,
      ),
    ],
  },
  supports: {
    ee: {
      frames: ["The text says ___ .", "Harriet knew ___ ."],
      wordBank: ["marsh", "creek", "forest", "hidden", "route", "proof"],
      directions: "Read one paragraph at a time. Say each sentence out loud before you tap it.",
    },
    dev: {
      frames: ["One clue is ___ .", "This shows that ___ ."],
      wordBank: ["evidence", "land", "route"],
    },
    exp: { frames: ["The sentence ___ shows that ___ because ___ ."] },
    br: {},
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "Where was Harriet Tubman born?",
      options: [
        { id: "a", text: "In Dorchester County, on the Eastern Shore." },
        { id: "b", text: "In the Appalachian Mountains in western Maryland." },
        { id: "c", text: "In Pennsylvania, where she later became free." },
      ],
      answer: "a",
      evidence: [{ id: "s1", why: "This sentence names the county and the part of Maryland." }],
      misconceptions: [
        {
          pick: "b",
          tag: "wrong-region",
          hint: "The mountains are far to the west. Check the first sentence for the county and the part of Maryland.",
        },
        {
          pick: "c",
          tag: "mixed-up-events",
          hint: "She traveled to Pennsylvania later in the story. Look for where she began.",
        },
      ],
      hints: [
        "Look at the first paragraph.",
        "Find the sentence that names a county in Maryland.",
        "The sentence also names the part of the state, and it is not in the west.",
      ],
      model:
        "The first sentence says she was born in Dorchester County, and it adds that the county is on Maryland's Eastern Shore.",
      explain: "Right. The first sentence names the county and the Eastern Shore.",
    },
    {
      id: "q2",
      type: "detail",
      prompt: "What kind of land does the text say the Eastern Shore has?",
      options: [
        { id: "a", text: "Low, flat land with creeks and marshes." },
        { id: "b", text: "High mountains covered with forests." },
        { id: "c", text: "Dry, rocky hills with no water." },
      ],
      answer: "a",
      evidence: [{ id: "s2", why: "This sentence describes the land and the water." }],
      misconceptions: [
        {
          pick: "b",
          tag: "wrong-region-land",
          hint: "Forested mountains are in a different region of Maryland. Reread the description in the first paragraph.",
        },
        {
          pick: "c",
          tag: "contradicted-by-text",
          hint: "The text names creeks, marshes and a bay. Do those sound dry?",
        },
      ],
      hints: [
        "The sentence that describes the land is in the first paragraph.",
        "Look for words about water and about the shape of the land.",
        "It starts with the name of the region and the word is.",
      ],
      model:
        "The second sentence tells about the land: it is low and flat, with creeks, marshes and the bay.",
      explain: "Right. The land is low and flat, and water is all around it.",
    },
    {
      id: "q3",
      type: "inference",
      prompt: "How did Harriet's work in the forests and marshes help her later?",
      options: [
        { id: "a", text: "She learned paths and hiding places that she could use as a guide." },
        { id: "b", text: "She earned enough money to buy her freedom." },
        { id: "c", text: "She learned to build boats to cross the bay." },
      ],
      answer: "a",
      evidence: [
        { id: "s3", why: "She worked outdoors in forests and marshes." },
        { id: "s4", why: "She learned the paths, creeks and hiding places there." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "invented-detail",
          hint: "The text never says she bought her freedom. Look at what she learned from her outdoor work.",
        },
        {
          pick: "c",
          tag: "invented-detail",
          hint: "Boats are not mentioned in the text. Find what she learned while she worked outside.",
        },
      ],
      hints: [
        "Look at the sentences about what she did as a young woman and what she learned.",
        "Find the sentence that says what she learned from working there.",
        "Think about how paths and hiding places could help someone who leads others.",
      ],
      model:
        "Harriet worked in forests and marshes and learned the paths and hiding places. That knowledge helped her guide others later.",
      explain: "Right. What she learned outdoors became useful when she led others.",
      supports: {
        ee: {
          frames: ["Harriet worked in the ___ .", "She learned the ___ ."],
          wordBank: ["forest", "marsh", "paths", "hiding places"],
        },
        dev: { frames: ["She learned ___ , so she could ___ ."] },
        exp: {
          frames: ["Her work outdoors helped because it taught her ___ , which she used to ___ ."],
        },
        br: {},
      },
    },
    {
      id: "q4",
      type: "evidence",
      prompt: "Tap the sentences that show how Harriet used the land to stay hidden.",
      answer: ["s9", "s10"],
      evidence: [
        { id: "s9", why: "She used the woods and marshes and traveled at night." },
        { id: "s10", why: "She chose unexpected routes because she knew the land." },
        { id: "s4", why: "She had learned the hiding places.", optional: true },
      ],
      misconceptions: [
        {
          pick: "s5",
          tag: "true-but-unrelated",
          hint: "That sentence tells that she escaped. It does not say how she used the land to stay hidden.",
        },
        {
          pick: "s12",
          tag: "true-but-unrelated",
          hint: "That sentence is about visitors today, not about how she stayed hidden.",
        },
        {
          pick: "s1",
          tag: "background-not-proof",
          hint: "That sentence tells where she was born. Look for sentences about hiding and routes.",
        },
      ],
      hints: [
        "Look in the paragraph about her trips back to Maryland.",
        "Find sentences that say where she hid and which routes she chose.",
        "One sentence names the woods and marshes, and one says why she chose routes.",
      ],
      model:
        "One sentence says she used the woods and marshes to stay hidden at night. Another says that because she knew the land, she chose routes people did not expect.",
      explain:
        "Right. Both sentences show she used what she knew about the land to avoid being found.",
    },
    {
      id: "q5",
      type: "inference",
      prompt: "Why could Harriet choose routes that the people hunting for her did not expect?",
      options: [
        { id: "a", text: "She knew the land well from years of working outdoors there." },
        { id: "b", text: "She had a map from the Union Army." },
        { id: "c", text: "She traveled in the daytime on the main roads." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "She had learned the paths, creeks and hiding places." },
        {
          id: "s10",
          why: "Because she knew the land so well, she could choose unexpected routes.",
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "time-mismatch",
          hint: "The Union Army comes later in the text, after her trips back to Maryland.",
        },
        {
          pick: "c",
          tag: "contradicted-by-text",
          hint: "Check when the text says she usually traveled. Would main roads in daylight keep her hidden?",
        },
      ],
      hints: [
        "Look for the sentence that says why she could choose unexpected routes.",
        "It starts with because. What does it say she knew?",
        "Then find the sentence about where she learned that.",
      ],
      model:
        "The text says that because she knew the land so well, she chose unexpected routes. She learned the land from working in the forests and marshes.",
      explain:
        "Right. Her knowledge of the land is the reason she could choose routes others did not expect.",
      supports: {
        ee: {
          frames: ["She knew the ___ .", "So she chose ___ routes."],
          wordBank: ["land", "routes", "unexpected", "because"],
        },
        dev: { frames: ["She could choose routes because she ___ ."] },
        exp: { frames: ["Her knowledge of the land explains why ___ ."] },
        br: {},
      },
    },
    {
      id: "q6",
      type: "inference",
      prompt: "What does this text suggest about how land and people's lives are connected?",
      options: [
        {
          id: "a",
          text: "People who know a place well can use its features, such as woods and marshes, in important ways.",
        },
        { id: "b", text: "Only mountains matter when people make choices." },
        { id: "c", text: "The land has no effect on what people do." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "She learned the paths, creeks and hiding places of the land." },
        { id: "s9", why: "She used the woods and marshes to stay hidden." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "overgeneralized",
          hint: "The text is about woods and marshes on a low, flat shore. Does it mention mountains at all?",
        },
        {
          pick: "c",
          tag: "contradicted-by-text",
          hint: "The text says her knowledge of the land made a difference to her routes. Does that fit this choice?",
        },
      ],
      hints: [
        "Think about what the land gave Harriet that helped her.",
        "Look at the sentences that name woods, marshes and hiding places.",
        "Which choice says that features of a place can be useful to someone who knows them?",
      ],
      model:
        "Harriet knew the woods, creeks and marshes and used them to travel and hide. That shows land can matter in people's choices.",
      explain: "Right. The land shaped what Harriet could do because she knew it so well.",
      transfer: {
        prompt:
          "A fisher on the Chesapeake Bay learns where crabs gather in each season. What does this show?",
        options: [
          { id: "a", text: "Knowing a place well helps people use its natural resources." },
          { id: "b", text: "Fishing is the same in every place." },
          { id: "c", text: "Water has no effect on people's jobs." },
        ],
        answer: "a",
        explain:
          "Learning where crabs gather is knowledge of the bay, and it helps the fisher use a natural resource.",
      },
    },
  ],
  claimPrompt:
    "What can you say about the land of the Eastern Shore and Harriet Tubman? Choose the claim your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Harriet Tubman's knowledge of the Eastern Shore's creeks, woods and marshes helped her guide others to freedom.",
        strong: true,
      },
      {
        id: "c2",
        text: "The land of the Eastern Shore was the only reason Harriet Tubman was able to help others.",
        strong: false,
        tag: "overstated-claim",
        hint: "Your notes show the land helped her. Do they show it was the only reason?",
      },
      {
        id: "c3",
        text: "Harriet Tubman never returned to Maryland after she escaped.",
        strong: false,
        tag: "contradicted-by-text",
        hint: "Check what the text says after she reached Pennsylvania.",
      },
    ],
    evidenceIds: ["s4", "s9", "s10"],
    evidenceMin: 2,
    why: "Your notes show she learned the paths and hiding places, used the woods and marshes to stay hidden, and chose routes because she knew the land.",
    hints: [
      "A strong claim connects the land to what Harriet did.",
      "Check each claim against your case notes. Which one can you prove?",
      "Be careful with claims that say only, never or always.",
    ],
    explainPrompt: "Explain how your evidence proves your claim. Use the words because or so.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because or so to connect my evidence to my claim.",
        test: { type: "contains-any", words: ["because", "so", "this shows", "which shows"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 14 words.",
        test: { type: "min-words", n: 14 },
      },
      { id: "reread", label: "I read my explanation aloud once.", self: true },
    ],
  },
  explainFrames: fr(
    ["Harriet knew the ___ . She used the ___ .", "This shows ___ because ___ ."],
    ["Harriet learned ___ , so she could ___ . This shows ___ ."],
    ["Because Harriet knew the ___ , she was able to ___ , which shows that ___ ."],
    ["The evidence demonstrates that her knowledge of the ___ allowed her to ___ ."],
  ),
  reflection: {
    prompt:
      "Which sentence in the text taught you the most about how people and land are connected?",
    frames: fr(
      ["The sentence was ___ .", "It showed ___ ."],
      ["The sentence ___ taught me that ___ ."],
      ["I learned the most from ___ because it showed how ___ ."],
      ["The detail that best revealed the connection was ___ , since ___ ."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
