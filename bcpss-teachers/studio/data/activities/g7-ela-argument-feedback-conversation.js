// conversation-studio: give a classmate fair, criteria-based feedback on a short argument (RI.7.8, SL.7.1).
const V = "g7-ela-evaluate-an-argument";
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const bank = (ee, dev = [], exp = [], br = []) => ({ ee, dev, exp, br });
const opt = (id, fit, text, note) => ({ id, fit, text, note });
const you = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });
const partner = (id, say) => ({ id, speaker: "partner", say });

// The strong response is authored first for clarity; move it to a varied position so it is not always first.
const POS = [1, 2, 0, 2, 0];
const spread = (a) => {
  let n = 0;
  for (const p of a.purposes)
    for (const t of p.rehearsal.turns) {
      if (t.speaker !== "you") continue;
      const hit = t.options.find((o) => o.fit === "strong");
      const rest = t.options.filter((o) => o !== hit);
      rest.splice(Math.min(POS[n++ % POS.length], rest.length), 0, hit);
      t.options = rest;
    }
  return a;
};

const DATA = {
  id: "g7-ela-argument-feedback-conversation",
  engine: "conversation-studio",
  title: "Talk it through: fair feedback on a classmate's argument",
  grade: "7",
  band: "6-8",
  subject: "ela",
  lessonId: "g7-ela-evaluate-an-argument",
  standards: ["RI.7.8", "SL.7.1"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.7.8 and SL.7.1; not mapped to a district unit sequence. The argument and survey are imagined for practice.",
  },
  vocabIds: [
    `${V}:claim`,
    `${V}:evidence`,
    `${V}:relevant`,
    `${V}:sufficient`,
    `${V}:anecdote`,
    `${V}:evaluate`,
  ],
  minutes: 20,
  intro:
    "A classmate has written a short argument and asked for feedback. Choose the moves of a fair evaluator, put them in order, and rehearse what you would say so that your feedback is specific, honest and useful.",
  topic: {
    title: "A classmate's argument about school start times",
    context:
      "Your partner wrote: Our school should start thirty minutes later. My friend Dani falls asleep in first period. A survey of 90 students in our grade found that 61 sleep less than eight hours on school nights. Starting later is better for everyone. The survey and the school are imagined for practice.",
    claim: "Our school should start thirty minutes later.",
    visual: {
      kind: "table",
      alt: "A table with two columns, the writer's statement and the kind of support it gives. The claim is our school should start later. A story about Dani is one case. A survey of 90 students is a count. The sentence starting later is better for everyone is a broad statement.",
      head: ["Statement", "Kind of support"],
      rows: [
        ["Dani falls asleep in first period", "One case"],
        ["61 of 90 students sleep under eight hours", "Survey count"],
        ["Starting later is better for everyone", "Broad statement"],
      ],
    },
  },
  roles: [
    {
      id: "evaluator",
      label: "Partner A",
      job: "Gives specific, fair feedback using criteria such as relevance and sufficiency.",
    },
    {
      id: "writer",
      label: "Partner B",
      job: "Explains what they meant and decides which changes to make.",
    },
  ],
  moves: [
    {
      id: "restate-claim",
      label: "Restate the claim",
      function: "Say the writer's claim and support in your own words to be sure you understood.",
      frames: fr(
        ["So your claim is ___."],
        ["So you are arguing that ___, and your support is ___."],
        ["If I understand correctly, you claim that ___ and support it with ___."],
        ["You contend that ___, relying on ___."],
      ),
      wordBank: bank(["claim", "support", "so you are saying"], ["argue", "evidence"]),
      example:
        "So you are arguing that our school should start thirty minutes later, and your evidence is a story about Dani and a survey of 90 students.",
      listenFor: "The claim and the kinds of support, in new words.",
    },
    {
      id: "strength",
      label: "Name a specific strength",
      function: "Say exactly what works and why, so the writer knows to keep it.",
      frames: fr(
        ["I think ___ is strong."],
        ["I think ___ is strong because ___."],
        ["One strength is ___, because it ___, which makes the claim ___."],
        ["The most persuasive element is ___, since it ___."],
      ),
      wordBank: bank(["strong", "because", "works"], ["specific", "checkable"]),
      example:
        "The survey is strong evidence because it counts 61 of 90 students and tells who was asked, so a reader can check it.",
      listenFor: "A named piece of the argument and a reason, not general praise.",
    },
    {
      id: "ask-q",
      label: "Ask a clarifying question",
      function: "Ask the writer what they meant before you criticize.",
      frames: fr(
        ["What do you mean by ___?"],
        ["When you say ___, do you have evidence about ___?"],
        ["When you say ___, do you mean ___, or is there evidence for ___?"],
        ["Could you clarify what the claim of ___ rests on?"],
      ),
      wordBank: bank(["what do you mean", "when you say"], ["clarify"]),
      example:
        "When you say better for everyone, do you have evidence about teachers or bus schedules, or only about student sleep?",
      listenFor: "A question about the writer's meaning, not a hidden criticism.",
    },
    {
      id: "weakness",
      label: "Name a weakness using a criterion",
      function:
        "Point to a specific weak spot and name the test it fails, such as enough, relevant or credible.",
      frames: fr(
        ["___ is weak because it is only ___."],
        ["___ is weak because it is not ___ and shows only ___."],
        ["___ does not meet the standard of being ___, because it ___."],
        ["The weakness is that ___ is insufficient, given that ___."],
      ),
      wordBank: bank(["weak", "only one", "not enough"], ["sufficient", "relevant", "pattern"]),
      example:
        "The story about Dani is only one case, so it is not enough to prove a pattern, and the last sentence claims more than the survey shows.",
      listenFor: "A named criterion, not just 'it is weak'.",
    },
    {
      id: "suggest-fix",
      label: "Suggest a fix",
      function: "Offer one concrete change that would make the argument stronger.",
      frames: fr(
        ["You could add ___."],
        ["You could replace ___ with ___, so that ___."],
        ["One way to strengthen it would be to ___, which would address ___."],
        ["I would suggest revising ___ to ___ so that the claim does not exceed the evidence."],
      ),
      wordBank: bank(["you could", "add", "change"], ["replace", "strengthen"]),
      example:
        "You could replace the Dani story with a second measured result, such as how many students arrive late, and change the last sentence to say better for students who need more sleep.",
      listenFor: "A change the writer can actually make.",
    },
    {
      id: "agree",
      label: "Say whether you agree",
      function: "Tell the writer whether you personally agree with the claim.",
      frames: fr(
        ["I agree."],
        ["I agree with your claim because I ___."],
        ["Personally I agree, although ___."],
        ["My own view is that ___."],
      ),
      example: "I agree with you because I am tired in the morning too.",
      notFit:
        "Whether you agree is not a test of the argument. Evaluating means judging the evidence and reasoning, even for claims you like.",
    },
    {
      id: "praise",
      label: "Give general praise",
      function: "Tell the writer the argument is good without saying why.",
      frames: fr(
        ["It is good."],
        ["I think it is really good."],
        ["Overall it is quite good."],
        ["It is a strong piece."],
      ),
      example: "It is really good, I like it.",
      notFit:
        "General praise does not tell the writer what to keep or what to change. Feedback has to name a specific part of the argument.",
    },
  ],
  purposes: [
    {
      id: "evaluate-peer",
      label: "Evaluate a classmate's argument",
      description:
        "Give feedback that is specific, fair and tied to criteria for strong evidence and reasoning.",
      moveIds: ["restate-claim", "strength", "ask-q", "weakness", "suggest-fix", "agree", "praise"],
      plan: {
        prompt:
          "Choose the moves of a fair evaluator, then put them in the order that helps the writer most.",
        expected: ["restate-claim", "strength", "ask-q", "weakness", "suggest-fix"],
        hints: [
          "Make sure you and the writer agree on what is being argued before you judge it.",
          "Begin with what works so the writer keeps listening, then find out what the writer meant before you criticize.",
          "Offer a way forward only after the problem has been put on the table.",
        ],
        model:
          "Say back what the writer argued, name something specific that works, ask about anything unclear, name a weakness with a criterion, and finish with one change the writer can make.",
        why: [
          "Restating prevents feedback on a claim the writer did not make.",
          "A specific strength tells the writer what to keep and builds trust.",
          "A question may reveal evidence the writer did not include.",
          "Naming the criterion makes the weakness something the writer can check.",
          "A fix turns criticism into a next step.",
        ],
      },
      rehearsal: {
        intro:
          "Your partner is a classmate who has written a short argument and wants honest, useful feedback.",
        turns: [
          partner(
            "p1",
            "Here is my argument. Our school should start thirty minutes later. My friend Dani falls asleep in first period. A survey of 90 students in our grade found that 61 sleep less than eight hours on school nights. Starting later is better for everyone. What do you think?",
          ),
          you("y1", "Say back what your partner is arguing.", "restate-claim", [
            opt(
              "a",
              "strong",
              "So you are arguing that our school should start thirty minutes later, and your evidence is a story about Dani and a survey of 90 students.",
              "States the claim and both kinds of support in new words.",
            ),
            opt(
              "b",
              "partial",
              "You want school to start later.",
              "Accurate, but it leaves out the support, so the writer cannot tell you understood the argument.",
            ),
            opt(
              "c",
              "off",
              "You think school is too early because you are tired.",
              "This attributes a reason the writer did not give.",
            ),
          ]),
          partner("p2", "Right. What did you think of the survey?"),
          you("y2", "Name a specific strength.", "strength", [
            opt(
              "a",
              "strong",
              "The survey is strong evidence because it counts 61 of 90 students and tells who was asked, so a reader can check it.",
              "Names a part of the argument and explains why it works.",
            ),
            opt(
              "b",
              "partial",
              "The survey is good.",
              "This points at the right part but gives no reason, so the writer does not know why it works.",
            ),
            opt(
              "c",
              "off",
              "I like surveys.",
              "A personal preference. It does not say what is strong about this survey.",
            ),
          ]),
          partner("p3", "Thanks. Was there anything that confused you?"),
          you("y3", "Ask the writer about something unclear.", "ask-q", [
            opt(
              "a",
              "strong",
              "When you say better for everyone, do you have evidence about teachers or bus schedules, or only about student sleep?",
              "A genuine question about the writer's meaning and evidence.",
            ),
            opt(
              "b",
              "partial",
              "What do you mean?",
              "A fair start, but it does not say which part confused you.",
            ),
            opt(
              "c",
              "off",
              "You should have asked more people.",
              "This is a criticism phrased as advice, not a question about what the writer meant.",
            ),
          ]),
          partner("p4", "I only have the sleep survey, honestly. Is that a problem?"),
          you("y4", "Name a weakness and the criterion it fails.", "weakness", [
            opt(
              "a",
              "strong",
              "The story about Dani is only one case, so it is not enough to prove a pattern, and the last sentence claims more than the survey shows.",
              "Names two specific weak spots and the criterion, sufficiency, behind them.",
            ),
            opt(
              "b",
              "partial",
              "The Dani part is weak.",
              "Points to the right part but does not say why.",
            ),
            opt(
              "c",
              "off",
              "Your argument is just opinion.",
              "Every argument has a position. This does not name any weakness the writer can fix.",
            ),
          ]),
          partner("p5", "Hmm. How could I fix that?"),
          you("y5", "Suggest one concrete change.", "suggest-fix", [
            opt(
              "a",
              "strong",
              "You could replace the Dani story with a second measured result, such as how many students arrive late, and change the last sentence to say better for students who need more sleep.",
              "A change the writer can make that addresses both weaknesses.",
            ),
            opt(
              "b",
              "partial",
              "Add more stuff.",
              "It points the right way, but the writer cannot tell what to add.",
            ),
            opt(
              "c",
              "off",
              "Just rewrite the whole thing.",
              "That does not tell the writer what to fix, and it discards what already works.",
            ),
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    {
      id: "restate",
      label: "I said the claim and its support in my own words before I judged it.",
    },
    { id: "specific", label: "I named a specific part of the argument, not the whole thing." },
    {
      id: "criterion",
      label: "I used a criterion such as enough, relevant or checkable to explain a weakness.",
    },
    { id: "fix", label: "I ended with one change the writer could make." },
  ],
  rubric: {
    criteria: [
      {
        id: "specific",
        label: "Specific feedback",
        levels: [
          { score: 1, descriptor: "Gives general praise or general criticism." },
          { score: 2, descriptor: "Points to a part of the argument but gives no reason." },
          {
            score: 3,
            descriptor: "Names a part of the argument and explains why it works or does not.",
          },
        ],
      },
      {
        id: "criteria",
        label: "Use of criteria",
        levels: [
          { score: 1, descriptor: "Judges by agreement or personal preference." },
          { score: 2, descriptor: "Mentions that evidence is weak without naming a test." },
          {
            score: 3,
            descriptor:
              "Names a criterion such as relevant, sufficient or credible and applies it.",
          },
        ],
      },
      {
        id: "useful",
        label: "Usefulness to the writer",
        levels: [
          { score: 1, descriptor: "Gives no next step." },
          { score: 2, descriptor: "Suggests a general change." },
          { score: 3, descriptor: "Suggests one concrete change that fixes the weakness named." },
        ],
      },
    ],
  },
  reflection: {
    prompt: "What did you do that made your feedback fair as well as honest?",
    frames: {
      ee: ["I said ___.", "I asked ___."],
      dev: ["My feedback was fair because I ___.", "I named ___ because ___."],
      exp: ["I kept the feedback fair by ___, which let my partner ___."],
      br: [
        "By pairing a criterion with a concrete suggestion, I made the critique ___, which ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
