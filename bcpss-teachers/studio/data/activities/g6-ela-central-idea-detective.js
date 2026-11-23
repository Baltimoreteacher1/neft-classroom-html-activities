// language-detective: find the central idea of an informational passage by collecting proof (RI.6.2, RI.6.1).
const V = "g6-ela-central-idea-and-supporting-details";
const S = (ee, dev, exp) => ({ ee, dev, exp, br: {} });
const sent = (id, text, para) => ({ id, text, para });

// The engine shows options in authored order, so move the right option to a varied position (ids stay the same).
const POS = [1, 2, 0, 2, 0, 1];
const place = (options, answer, pos) => {
  const hit = options.find((o) => o.id === answer);
  const rest = options.filter((o) => o.id !== answer);
  rest.splice(Math.min(pos, rest.length), 0, hit);
  return rest;
};
const spread = (a) => {
  a.questions.forEach((q, i) => {
    if (q.options) q.options = place(q.options, q.answer, POS[i % POS.length]);
    if (q.transfer) q.transfer.options = place(q.transfer.options, q.transfer.answer, POS[(i + 3) % POS.length]);
  });
  return a;
};

const DATA = {
  id: "g6-ela-central-idea-detective",
  engine: "language-detective",
  title: "Case file: the central idea under the trees",
  grade: "6",
  band: "6-8",
  subject: "ela",
  lessonId: "g6-ela-central-idea-and-supporting-details",
  standards: ["RI.6.1", "RI.6.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.6.1 and RI.6.2; not mapped to a district unit sequence. The passage is original.",
  },
  vocabIds: [`${V}:central-idea`, `${V}:supporting-detail`, `${V}:evidence`, `${V}:infer`],
  minutes: 20,
  intro:
    "Read an informational passage the way a detective reads a case file. Collect proof sentence by sentence, then decide which central idea your case notes support.",
  scene: {
    kind: "passage",
    title: "The Shade Under the Trees",
    source: "Original - The Language Page",
    caption: "An original informational passage written for this activity.",
    sentences: [
      sent(
        "s1",
        "On a hot afternoon, a sidewalk with no shade can feel much warmer than the grass beside it.",
        0,
      ),
      sent(
        "s2",
        "Dark pavement and roofs soak up sunlight and hold the heat for hours after the sun goes down.",
        0,
      ),
      sent(
        "s3",
        "Because cities are covered with pavement and roofs, they often stay warmer than the countryside around them.",
        0,
      ),
      sent("s4", "Trees help in two main ways.", 1),
      sent(
        "s5",
        "First, their leaves block sunlight, so the ground beneath a tree receives less direct heat.",
        1,
      ),
      sent(
        "s6",
        "Second, trees release water vapor through their leaves, and this process cools the air around them.",
        1,
      ),
      sent(
        "s7",
        "A bus stop beneath a tall tree is usually more comfortable to wait at than one on open pavement.",
        1,
      ),
      sent("s8", "Shade matters for more than comfort.", 2),
      sent(
        "s9",
        "People are more willing to walk to a bus stop along a shaded street, so shade can mean fewer short car trips.",
        2,
      ),
      sent(
        "s10",
        "The roots and leaves of street trees also soak up rainwater, which reduces how much runs into storm drains at once.",
        2,
      ),
      sent("s11", "Planting trees is not free, however.", 3),
      sent(
        "s12",
        "Young trees need regular watering for their first few years, and workers must prune branches that threaten power lines.",
        3,
      ),
      sent(
        "s13",
        "Even so, many cities now plant trees on the hottest, most crowded blocks first, because those blocks have the most to gain.",
        3,
      ),
      sent(
        "s14",
        "A tree-lined street is not just pretty; it works as part of a city's cooling system.",
        3,
      ),
    ],
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt:
        "According to the passage, why do cities often stay warmer than the countryside around them?",
      options: [
        { id: "a", text: "Pavement and roofs absorb sunlight and keep the heat." },
        { id: "b", text: "Cities have more trees that trap heat near the ground." },
        { id: "c", text: "The sun shines for more hours over a city." },
      ],
      answer: "a",
      evidence: [
        {
          id: "s3",
          why: "It states the cause after the word because: pavement and roofs cover cities.",
          optional: false,
        },
        { id: "s2", why: "It explains what pavement and roofs do with sunlight.", optional: true },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "reverses-cause",
          hint: "The passage treats trees as a way to cool a block. Check which things the author says hold the heat.",
        },
        {
          pick: "c",
          tag: "outside-knowledge",
          hint: "That may sound reasonable, but the passage never says it. A detail answer must come from the text.",
        },
        {
          pick: "s1",
          tag: "example-not-reason",
          hint: "That sentence describes one sidewalk. It does not explain why a whole city stays warmer.",
        },
      ],
      hints: [
        "Reread the first paragraph, the one that comes before the author mentions trees.",
        "Look for the signal word that introduces a cause in that paragraph.",
        "Ask what the paragraph says the city surfaces do with sunlight.",
      ],
      model:
        "Think-aloud: the last sentence of the first paragraph uses the word because. What comes after because is the cause, and it names pavement and roofs, so those are why cities stay warmer.",
      explain:
        "Right: the text says cities are covered with pavement and roofs, and these surfaces hold heat, so cities stay warmer.",
      transfer: {
        prompt:
          "A different passage says: A black car gets hot in summer because dark paint absorbs more sunlight than light paint does. Why does the black car get hot?",
        options: [
          { id: "a", text: "Dark paint absorbs more sunlight." },
          { id: "b", text: "Black cars have bigger engines." },
          { id: "c", text: "Light paint is thicker than dark paint." },
        ],
        answer: "a",
        explain:
          "The word because points to the cause the text names: dark paint absorbs more sunlight.",
      },
      supports: S(
        {
          frames: ["The text says cities are warmer because ___."],
          wordBank: ["pavement", "roofs", "absorb", "heat"],
          oral: "Point to the word because. Read the words after it aloud.",
        },
        { frames: ["The author says ___ cause the city to ___."], wordBank: ["absorb", "hold"] },
        { frames: ["According to the first paragraph, ___ explains why ___."] },
      ),
    },
    {
      id: "q2",
      type: "evidence",
      prompt: "Tap the two sentences that explain how trees cool the air and the ground.",
      answer: ["s5", "s6"],
      evidence: [
        { id: "s5", why: "It names the first way: leaves block sunlight.", optional: false },
        {
          id: "s6",
          why: "It names the second way: leaves release water vapor that cools the air.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "s4",
          tag: "topic-sentence-not-detail",
          hint: "That sentence tells you there are two ways, but it does not say what they are.",
        },
        {
          pick: "s7",
          tag: "result-not-reason",
          hint: "That sentence describes a result you can feel. It does not explain how trees cool things.",
        },
        {
          pick: "s3",
          tag: "wrong-paragraph",
          hint: "That sentence explains why cities are warm, not how trees cool them.",
        },
      ],
      hints: [
        "Look in the paragraph that begins by counting the ways trees help.",
        "The author uses ordering words to introduce each way.",
        "Find the two sentences that follow those ordering words.",
      ],
      model:
        "Think-aloud: the second paragraph says there are two ways. The sentences that begin with the words First and Second each give one way, so those two sentences are the proof.",
      explain:
        "Right: the First and Second sentences each explain one way trees cool a place, shade and water vapor.",
      transfer: {
        prompt:
          "A passage says: Recycling helps in two ways. First, it saves raw materials. Second, it keeps trash out of landfills. Which words introduce the two ways?",
        options: [
          { id: "a", text: "First and Second" },
          { id: "b", text: "Recycling helps" },
          { id: "c", text: "raw materials and trash" },
        ],
        answer: "a",
        explain:
          "Ordering words such as First and Second signal where each supporting detail begins.",
      },
      supports: S(
        {
          frames: ["I tapped the sentences that begin with ___ and ___."],
          wordBank: ["first", "second", "how"],
          oral: "Say the two ordering words you see in the paragraph.",
        },
        { frames: ["These sentences explain how trees ___."] },
        { frames: ["The author develops the point by giving ___ and ___."] },
      ),
    },
    {
      id: "q3",
      type: "inference",
      prompt: "Why does the author include the paragraph about watering and pruning?",
      options: [
        {
          id: "a",
          text: "To admit that trees have costs before explaining why cities plant them anyway.",
        },
        { id: "b", text: "To show that the author believes planting trees is a bad idea." },
        { id: "c", text: "To teach readers how workers prune branches near power lines." },
        { id: "d", text: "To compare the cost of watering trees with the cost of watering lawns." },
      ],
      answer: "a",
      evidence: [
        { id: "s11", why: "It signals that a cost is coming.", optional: false },
        {
          id: "s13",
          why: "The words Even so show the author still supports planting trees.",
          optional: false,
        },
        { id: "s12", why: "It lists the costs.", optional: true },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "misreads-tone",
          hint: "Check how the paragraph ends. Does the author keep or give up the position from earlier paragraphs?",
        },
        {
          pick: "c",
          tag: "detail-as-purpose",
          hint: "Pruning is one detail in the paragraph. Ask why the author mentions costs at all.",
        },
        {
          pick: "d",
          tag: "invented-comparison",
          hint: "Lawns do not appear anywhere in the passage. A purpose answer has to rest on what the text actually contains.",
        },
      ],
      hints: [
        "Find the sentence that begins the paragraph and notice the word however.",
        "Look at the transition at the start of the next-to-last sentence. What does it tell you about the author's position?",
        "Compare the paragraph's first sentence with its last two. What does the author do with the costs?",
      ],
      model:
        "Think-aloud: the paragraph begins by saying trees are not free, which is a cost. Then Even so signals that the author keeps the position anyway. A writer who admits a cost and then rejects it is making the argument more honest.",
      explain:
        "Right: the author admits the costs and then explains why cities plant trees anyway, which makes the case more believable.",
      transfer: {
        prompt:
          "An article about school lunch says: Healthy lunches cost more to make. Even so, the school chose them because students concentrate better after eating well. Why does the author mention the cost?",
        options: [
          { id: "a", text: "To admit a drawback before showing why the choice was still made." },
          { id: "b", text: "To argue that healthy lunches are too expensive." },
          { id: "c", text: "To list the ingredients in each lunch." },
        ],
        answer: "a",
        explain:
          "The words Even so show the author acknowledges the cost and then explains why the choice still makes sense.",
      },
      supports: S(
        {
          frames: ["The author says trees cost ___. Even so, cities ___."],
          wordBank: ["cost", "even so", "however"],
        },
        { frames: ["The author mentions the costs to show ___."], wordBank: ["admit", "drawback"] },
        { frames: ["By conceding ___, the author makes the claim that ___ more credible."] },
      ),
    },
    {
      id: "q4",
      type: "evidence",
      prompt: "Tap the two sentences that give details showing trees matter for more than comfort.",
      answer: ["s9", "s10"],
      evidence: [
        { id: "s9", why: "It shows shade changes how people travel.", optional: false },
        { id: "s10", why: "It shows trees also help manage rainwater.", optional: false },
      ],
      misconceptions: [
        {
          pick: "s8",
          tag: "claim-not-detail",
          hint: "That sentence makes the point, but it does not give a detail that proves it.",
        },
        {
          pick: "s7",
          tag: "comfort-only",
          hint: "That detail is about comfort, and the author says comfort is only part of the story.",
        },
        {
          pick: "s14",
          tag: "conclusion-not-detail",
          hint: "That sentence sums up the passage. The task asks for details that support one part of it.",
        },
      ],
      hints: [
        "Look in the paragraph that begins by saying something matters beyond comfort.",
        "Skip the sentence that makes the point and find the ones that prove it.",
        "Each proving sentence names a different benefit besides feeling cooler.",
      ],
      model:
        "Think-aloud: the first sentence of the third paragraph makes a claim. The two sentences after it each give a detail, one about walking and one about rainwater, so they prove the claim.",
      explain:
        "Right: walking more and soaking up rainwater are benefits beyond comfort, so those sentences are the supporting details.",
      transfer: {
        prompt:
          "A passage says: Libraries offer more than books. They lend tools, and they host free classes. Which sentence is a supporting detail?",
        options: [
          { id: "a", text: "They lend tools, and they host free classes." },
          { id: "b", text: "Libraries offer more than books." },
          { id: "c", text: "Libraries are important." },
        ],
        answer: "a",
        explain:
          "The first sentence makes the point. Tools and free classes are the specific details that prove it.",
      },
      supports: S(
        {
          frames: ["The detail shows trees help by ___."],
          wordBank: ["walk", "rainwater", "benefit"],
        },
        { frames: ["This sentence gives a detail about ___, which proves ___."] },
        { frames: ["Both details extend the claim by showing ___."] },
      ),
    },
    {
      id: "q5",
      type: "inference",
      prompt:
        "What does the author suggest by calling a tree-lined street part of a city's cooling system?",
      options: [
        {
          id: "a",
          text: "Trees do real work in cooling the city, so they are more than decoration.",
        },
        { id: "b", text: "Trees should replace air conditioning in every building." },
        { id: "c", text: "A street is only attractive if it has a cooling system." },
      ],
      answer: "a",
      evidence: [
        {
          id: "s14",
          why: "The word system presents trees as a working part of the city, not decoration.",
          optional: false,
        },
        { id: "s6", why: "It shows one way trees actually cool the air.", optional: true },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "overgeneralization",
          hint: "The passage never compares trees with air conditioning. Check how far the evidence goes before you stretch the idea.",
        },
        {
          pick: "c",
          tag: "distorted-wording",
          hint: "That choice twists the author's words. Reread what the sentence says trees are not just.",
        },
      ],
      hints: [
        "Reread the last sentence slowly, including the part before the semicolon.",
        "Ask what the word system suggests about how trees function in a city.",
        "Which choice stays close to the evidence without adding anything the passage does not say?",
      ],
      model:
        "Think-aloud: calling trees part of a system means they perform a function. The first half says trees are not just pretty, so the author is rejecting the idea that trees are only decoration.",
      explain:
        "Right: a system does work, so the author is saying trees actively help cool the city.",
      transfer: {
        prompt:
          "A passage ends: A hedge is not only a fence; it is part of a garden's home for birds. What does the author suggest about hedges?",
        options: [
          { id: "a", text: "Hedges serve a living purpose beyond marking a boundary." },
          { id: "b", text: "Hedges should replace all fences." },
          { id: "c", text: "Gardens without hedges have no birds." },
        ],
        answer: "a",
        explain: "The phrase not only signals that the author adds a second, larger purpose.",
      },
      supports: S(
        {
          frames: ["A system does ___. Trees help to ___."],
          wordBank: ["system", "work", "not just"],
        },
        { frames: ["By saying trees are part of a system, the author suggests ___."] },
        { frames: ["The metaphor of a cooling system implies that trees ___."] },
      ),
    },
  ],
  claimPrompt:
    "What is the central idea of the whole passage? Choose the claim your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Street trees cool city blocks in several practical ways, so they are worth planting even though they cost money to care for.",
        strong: true,
      },
      {
        id: "c2",
        text: "The passage is about trees in cities.",
        strong: false,
        tag: "topic-only",
        hint: "That names the topic, but the central idea must say what the author tells us about it.",
      },
      {
        id: "c3",
        text: "Young trees need regular watering for their first few years.",
        strong: false,
        tag: "single-detail",
        hint: "That is true, but it comes from one paragraph. The central idea must cover the whole passage.",
      },
      {
        id: "c4",
        text: "Every building in the country should have a tree planted in front of it.",
        strong: false,
        tag: "unsupported-claim",
        hint: "Your case notes do not say that. It goes beyond what the text supports.",
      },
    ],
    evidenceIds: ["s5", "s6", "s10", "s11", "s13"],
    evidenceMin: 3,
    why: "Your notes show how trees cool a place, a benefit beyond comfort, a cost the author admits, and cities choosing to plant anyway. Together these support one idea that covers every paragraph.",
    hints: [
      "A central idea has to cover every paragraph, not just one.",
      "Compare each choice with your case notes. Which choice could your notes back up from the beginning to the end?",
      "Eliminate the choice that only names a subject and the choice that only repeats a single detail.",
    ],
    explainPrompt: "Explain how at least two pieces of your evidence prove the central idea.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because, so or this shows to connect my evidence to the central idea.",
        test: { type: "contains-any", words: ["because", "so ", "this shows", "which shows"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 18 words.",
        test: { type: "min-words", n: 18 },
      },
      { id: "reread", label: "I read my explanation aloud and it makes sense.", self: true },
    ],
  },
  explainFrames: {
    ee: ["The central idea is that ___.", "One detail that supports it is ___."],
    dev: [
      "The central idea is ___, supported by ___ and ___.",
      "This detail shows ___ because ___.",
    ],
    exp: ["The author conveys the idea that ___ through details such as ___ and ___."],
    br: [
      "Taken together, the details about ___ and ___ establish that ___, which justifies the author's position that ___.",
    ],
  },
  reflection: {
    prompt: "What did you do differently to tell a detail from the central idea?",
    frames: {
      ee: ["I looked for ___.", "A detail is ___."],
      dev: ["I separated the idea from the details by ___.", "A clue was ___."],
      exp: ["To distinguish them, I checked whether ___ covered ___."],
      br: [
        "I tested each candidate against every paragraph, and the one that survived was ___ because ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
