// Concept Builder (scale-sort): rank support from weakest to strongest, then match opinion starters to the strength of the evidence. Original items.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const it = (id, text, gloss) => ({ id, text, gloss });

const axisSupport = {
  label: "How well the support backs up the opinion",
  low: "weakest",
  high: "strongest",
};


export default {
  id: "g5-ela-opinion-strength-scale",
  engine: "concept-builder",
  kind: "scale-sort",
  title: "Which Support Is Strongest?",
  grade: "5",
  band: "3-5",
  subject: "ela",
  lessonId: "g5-ela-opinion-writing-reasons-evidence",
  standards: ["W.5.1", "W.5.1b"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS W.5.1 and W.5.1b; not mapped to a district unit sequence.",
  },
  minutes: 14,
  intro:
    "A good opinion needs support that a reader can trust. Rank each group of statements from the weakest support to the strongest support. Each statement has a label that says what kind of support it is.",
  model: {
    axis: axisSupport,
    items: [
      it(
        "p-fact-source",
        "In our class poll on Monday, 18 of 24 students voted for a class pet.",
        "A fact with a number and its source",
      ),
      it("p-feeling", "Pets are awesome.", "A feeling"),
      it(
        "p-story",
        "My cousin's class has a pet, and her class loves it.",
        "A story about one other class",
      ),
      it("p-repeat", "A class pet is a good idea.", "Repeats the opinion"),
      it("p-fact", "18 of 24 students voted for a class pet.", "A fact with a number"),
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "The opinion is: our class should get a class pet. Put the five statements in order from the weakest support to the strongest support.",
      goal: "All five in order, weakest at the top",
      target: { order: ["p-repeat", "p-feeling", "p-story", "p-fact", "p-fact-source"] },
      check: {
        type: "order",
        of: "order",
        expected: ["p-repeat", "p-feeling", "p-story", "p-fact", "p-fact-source"],
      },
      hints: [
        "Read each label. Which statement gives the reader nothing new?",
        "A number is stronger than a feeling or a story. Which statements have a number?",
        "Two statements have the same number. Which one tells the reader where the number came from?",
      ],
      misconceptions: [
        {
          match: "story-above-fact",
          when: { type: "relation", left: "pos[p-story]", op: "gt", right: "pos[p-fact]" },
          hint: "A story about one other class is not as strong as a fact with a number from your own class.",
          model:
            "A story is about one case. A number from our own class tells how many students really want a pet.",
        },
        {
          match: "source-ignored",
          when: { type: "relation", left: "pos[p-fact]", op: "gt", right: "pos[p-fact-source]" },
          hint: "Both statements have the same number. One also says when and how the number was found. Which would a reader trust more?",
          model:
            "Telling where a number came from lets the reader check it, so the statement with the source is stronger.",
        },
      ],
      model:
        "From weakest to strongest: repeating the opinion, a feeling, a story about one other class, a fact with a number, and a fact with a number and its source. Each step gives the reader something more they can check.",
      right:
        "That order makes sense. Each statement gives the reader more to check than the one above it.",
      supports: {
        ee: {
          frames: ["The weakest is ___ .", "The strongest is ___ ."],
          wordBank: ["number", "feeling", "story", "poll", "weak", "strong"],
          directions:
            "Read the label under each statement out loud. Use the arrow buttons to move one statement at a time.",
          oral: "Tell a partner which statement you would move first and why.",
        },
        dev: {
          frames: ["I put ___ above ___ because ___ ."],
          wordBank: ["fact", "source", "support"],
        },
        exp: { frames: ["___ is stronger than ___ because it ___ ."] },
        br: {},
      },
      justify: {
        prompt: "Why is the last statement the strongest support?",
        options: [
          {
            id: "j1",
            text: "It gives a number and says where the number came from, so a reader can check it.",
            ok: true,
          },
          {
            id: "j2",
            text: "It is the longest sentence.",
            ok: false,
            hint: "Length does not make support strong. Look at what a reader can check.",
          },
          {
            id: "j3",
            text: "It uses the word poll, which is a big word.",
            ok: false,
            hint: "A word that sounds important is not the same as support that can be checked.",
          },
          {
            id: "j4",
            text: "It agrees with the opinion.",
            ok: false,
            hint: "Every statement here agrees with the opinion. That does not tell you which is strongest.",
          },
        ],
        min: 1,
        model:
          "A number with its source lets a reader check the support. A feeling or a sentence that repeats the opinion cannot be checked.",
      },
      explain: {
        prompt:
          "What did you change in the order, and why did the strongest statement belong at the bottom?",
        frames: fr(
          ["I moved ___ down because ___ .", "The strongest has a ___ ."],
          ["I moved ___ because it only ___ , but ___ gives a ___ ."],
          ["I put ___ last because it gives ___ and shows ___ , so a reader can ___ ."],
          ["The ordering reflects how checkable the support is: ___ ."],
        ),
        mustMention: [
          { id: "number", label: "the number or the fact", any: ["number", "fact", "18", "poll"] },
          {
            id: "check",
            label: "what a reader can check or trust",
            any: ["check", "trust", "source", "believe"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what I changed." },
          { id: "c2", label: "I gave a reason with because." },
          { id: "c3", label: "I used a word such as number, fact or source." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "New opinion: our school should make recess 10 minutes longer. Rank the statements from the weakest support to the strongest support.",
      goal: "All five in order, weakest at the top",
      setup: {
        items: [
          it(
            "r-story",
            "My brother's school has longer recess, and he gets good grades.",
            "A story about one other person",
          ),
          it(
            "r-fact-source",
            "In a survey of our school's 24 fifth graders in October, 20 said they focus better after longer recess.",
            "A fact with a number and its source",
          ),
          it("r-repeat", "Recess should be longer.", "Repeats the opinion"),
          it(
            "r-fact",
            "20 of 24 students said they focus better after longer recess.",
            "A fact with a number",
          ),
          it("r-feeling", "Everybody loves recess.", "A feeling"),
        ],
      },
      target: { order: ["r-repeat", "r-feeling", "r-story", "r-fact", "r-fact-source"] },
      check: {
        type: "order",
        of: "order",
        expected: ["r-repeat", "r-feeling", "r-story", "r-fact", "r-fact-source"],
      },
      hints: [
        "Start with the statement that says nothing new.",
        "Compare the two statements with numbers. What does one tell you that the other leaves out?",
        "A story about one person is easier to doubt than a count of many people.",
      ],
      misconceptions: [
        {
          match: "feeling-above-story",
          when: { type: "relation", left: "pos[r-feeling]", op: "gt", right: "pos[r-story]" },
          hint: "A feeling is not support at all. A story at least tells about something that happened.",
          model:
            "A feeling says how someone feels. A story gives one real example, which is a little stronger.",
        },
        {
          match: "repeat-not-weakest",
          when: { type: "relation", left: "pos[r-repeat]", op: "gt", right: "pos[r-feeling]" },
          hint: "Look at the statement that says the same thing as the opinion. Does it give a reason?",
          model: "Saying the opinion again gives no reason, so it is weaker than even a feeling.",
        },
      ],
      model:
        "Repeating the opinion is the weakest. Then a feeling, then a story about one person, then a fact with a number, and strongest of all a fact with a number and where it came from.",
      right:
        "Right. The statement that says who was asked, when, and how many is the one a reader can check.",
      supports: {
        ee: {
          frames: ["The weakest is ___ .", "The strongest tells ___ ."],
          wordBank: ["survey", "number", "story", "feeling", "repeats"],
          directions: "Find the statement that says the opinion again. Put it at the top first.",
        },
        dev: {
          frames: ["The survey statement is stronger because it says ___ ."],
          wordBank: ["survey", "source", "number"],
        },
        exp: { frames: ["A reader can check ___ because it tells ___ ."] },
        br: {},
      },
      explain: {
        prompt:
          "What changed from the first order you saw, and why does the survey statement go last?",
        frames: fr(
          ["I moved ___ . The last one has ___ ."],
          ["I moved ___ down because ___ . The last one says who, when and how many."],
          [
            "The survey statement is strongest because it tells ___ , ___ and ___ , so a reader can ___ .",
          ],
          ["Support is stronger when the reader can check who, when and how many, so ___ ."],
        ),
        mustMention: [
          {
            id: "who",
            label: "who was asked, when, or how many",
            any: ["who", "when", "how many", "survey", "fifth"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what I moved." },
          { id: "c2", label: "I gave a reason with because." },
          { id: "c3", label: "I used a word such as survey, number or source." },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "A writer's opinion starter shows how sure the writer is. Put the starters in order from the least sure to the most sure.",
      goal: "All five starters in order, least sure at the top",
      setup: {
        axis: { label: "How sure the writer sounds", low: "least sure", high: "most sure" },
        items: [
          it("s-believe", "I believe", "Sounds fairly sure"),
          it("s-certain", "I am certain", "Sounds completely sure"),
          it("s-wonder", "I wonder if", "Sounds unsure, like a question"),
          it("s-strong", "I strongly believe", "Sounds very sure"),
          it("s-think", "I think", "Sounds a little sure"),
        ],
      },
      target: { order: ["s-wonder", "s-think", "s-believe", "s-strong", "s-certain"] },
      check: {
        type: "order",
        of: "order",
        expected: ["s-wonder", "s-think", "s-believe", "s-strong", "s-certain"],
      },
      hints: [
        "One starter is really a question. Where does an unsure writer begin?",
        "The word strongly adds force to believe. Which two starters go together, and which is stronger?",
        "Say each starter in a sentence. Which one would you use only with very strong proof?",
      ],
      misconceptions: [
        {
          match: "strong-before-believe",
          when: { type: "relation", left: "pos[s-strong]", op: "lt", right: "pos[s-believe]" },
          hint: "Adding the word strongly makes the starter more sure than believe alone.",
          model:
            "I believe is sure, and I strongly believe is even more sure because strongly adds force.",
        },
      ],
      model:
        "From least sure to most sure: I wonder if, I think, I believe, I strongly believe, I am certain. Match how sure you sound to how strong your evidence is.",
      right: "Good. A writer should sound as sure as the evidence allows, and no more.",
      supports: {
        ee: {
          frames: ["The least sure is ___ .", "The most sure is ___ ."],
          wordBank: ["wonder", "think", "believe", "strongly", "certain"],
          directions:
            "Say each starter out loud. Move the one that sounds like a question to the top.",
        },
        dev: {
          frames: ["I put ___ before ___ because it sounds ___ ."],
          wordBank: ["sure", "unsure", "strong"],
        },
        exp: { frames: ["___ sounds more sure than ___ because the word ___ ."] },
        br: {},
      },
      explain: {
        prompt:
          "What did you change in the order, and when should a writer use the most sure starter?",
        frames: fr(
          ["I moved ___ . Use the most sure starter when ___ ."],
          ["I moved ___ because ___ . A writer should use ___ when ___ ."],
          [
            "The most sure starter fits only when the evidence is ___ , because otherwise the reader may ___ .",
          ],
          ["A confident starter needs matching evidence; otherwise ___ ."],
        ),
        mustMention: [
          {
            id: "match",
            label: "matching the starter to the strength of the evidence",
            any: ["evidence", "proof", "facts", "reasons"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what I moved." },
          { id: "c2", label: "I named when the strongest starter fits." },
          { id: "c3", label: "I used the word evidence or proof." },
        ],
      },
    },
  ],
  reflection: {
    prompt: "How will you decide which support to use first in your own opinion paragraph?",
    frames: fr(
      ["I will use ___ first.", "It is strong because ___ ."],
      ["I will start with ___ because it ___ ."],
      ["I will lead with ___ because a reader can ___ ."],
      ["I will order my reasons by how well a reader can check them, beginning with ___ ."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
