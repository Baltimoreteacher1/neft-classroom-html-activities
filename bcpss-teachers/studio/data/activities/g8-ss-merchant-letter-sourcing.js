// language-detective: source an imagined 1774 merchant's letter (audience, purpose, perspective, limits) and judge its usefulness (D2.His.13.6-8, D2.His.6.6-8, RH.6-8.6).
const V = "g8-social-studies-causes-of-the-american-revolution-sourcing";
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
  id: "g8-ss-merchant-letter-sourcing",
  engine: "language-detective",
  title: "Case file: sourcing a merchant's letter from 1774",
  grade: "8",
  band: "6-8",
  subject: "social-studies",
  lessonId: "g8-social-studies-causes-of-the-american-revolution-sourcing",
  standards: ["D2.His.13.6-8", "D2.His.6.6-8", "RH.6-8.6"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to D2.His.13.6-8, D2.His.6.6-8 and RH.6-8.6; not mapped to a district unit sequence. The letter is imagined for practice and is not a real historical document.",
  },
  vocabIds: [
    `${V}:sourcing`,
    `${V}:primary-source`,
    `${V}:audience`,
    `${V}:purpose`,
    `${V}:perspective`,
    `${V}:reliable`,
    `${V}:corroborate`,
  ],
  minutes: 24,
  intro:
    "Historians ask who made a source, for whom and why before they use it. Read an imagined merchant's letter, collect proof about its audience, purpose and perspective, and decide how it can and cannot be used.",
  scene: {
    kind: "passage",
    title: "A merchant's letter, Boston, 1774",
    source: "Original - The Language Page",
    caption:
      "An imagined letter written for this activity to practice sourcing. It is modeled on common concerns of the time and is not a real historical document.",
    sentences: [
      sent("s1", "Boston, 1774. To Mr. Harrow, my partner in London.", 0),
      sent("s2", "I write with a heavy heart about our business.", 0),
      sent(
        "s3",
        "Since the port was closed, not a single ship has been permitted to load or unload at my wharf.",
        1,
      ),
      sent(
        "s4",
        "My warehouse stands full of goods I cannot sell, and my clerks have gone home without pay.",
        1,
      ),
      sent("s5", "I do not defend the destruction of the tea, which I believe was reckless.", 1),
      sent(
        "s6",
        "But I cannot see why every honest merchant in this town must suffer for what a crowd did one night.",
        1,
      ),
      sent("s7", "Parliament says it acts to restore order.", 2),
      sent(
        "s8",
        "Here, our neighbors say it acts to crush the liberty of Massachusetts, and the town meeting is no longer permitted to gather freely.",
        2,
      ),
      sent("s9", "I am one man with a ledger, and I do not know which account is true.", 2),
      sent(
        "s10",
        "I beg you to tell the gentlemen who sit in Parliament that this punishment is falling on the innocent and the guilty alike.",
        3,
      ),
      sent("s11", "If it continues, I fear my firm will not last the winter.", 3),
      sent("s12", "Write to me soon of any news in London.", 3),
    ],
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "Who is the audience for whom the writer wrote this letter?",
      options: [
        { id: "a", text: "His business partner in London." },
        { id: "b", text: "The members of Parliament." },
        { id: "c", text: "The people of Boston at a town meeting." },
      ],
      answer: "a",
      evidence: [
        {
          id: "s1",
          why: "The opening line names the person the letter is written to.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "mentioned-not-addressed",
          hint: "Parliament is mentioned in the letter, but check who the writer actually addresses at the start.",
        },
        {
          pick: "c",
          tag: "wrong-setting",
          hint: "Nothing in the letter suggests it was read aloud to a crowd. Look at how it begins and ends.",
        },
        {
          pick: "s10",
          tag: "request-not-audience",
          hint: "That sentence asks the reader to pass on a message. It does not say who the reader is.",
        },
      ],
      hints: [
        "Look at the very first line of the letter.",
        "Find the word that begins the line and the title that follows it.",
        "Ask who would be addressed as a partner in a business letter.",
      ],
      model:
        "Think-aloud: a letter usually names its reader in the greeting. The first line names a partner in London, so the audience is a business partner, not the public.",
      explain:
        "Right: the greeting names his partner in London, so this is a private letter to one person.",
      transfer: {
        prompt:
          "A note begins: Dear Principal Lee, the club would like to use the gym on Fridays. Who is the audience?",
        options: [
          { id: "a", text: "Principal Lee" },
          { id: "b", text: "The club members only" },
          { id: "c", text: "Every student in the school" },
        ],
        answer: "a",
        explain: "The greeting names the person the note is written to.",
      },
      supports: S(
        { frames: ["The letter is written to ___."], wordBank: ["audience", "partner", "private"] },
        { frames: ["The audience is ___, which I know because the letter begins ___."] },
        { frames: ["Addressing the letter to ___ suggests that the writer intended ___."] },
      ),
    },
    {
      id: "q2",
      type: "inference",
      prompt: "What is the writer's main purpose in this letter?",
      options: [
        {
          id: "a",
          text: "To describe his losses and ask his partner to carry his concern to people with power.",
        },
        { id: "b", text: "To persuade the people of Boston to protest." },
        { id: "c", text: "To record a neutral account of events for future historians." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "It lists his losses in detail.", optional: false },
        {
          id: "s10",
          why: "It asks his partner to speak to Parliament on his behalf.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "purpose-mismatch",
          hint: "Check whether the letter calls on neighbors to act or whether it addresses one person and asks for a favor.",
        },
        {
          pick: "c",
          tag: "assumes-neutrality",
          hint: "The writer says he does not know which account is true and writes about his own business. Does that look like a neutral record?",
        },
      ],
      hints: [
        "Look for sentences where the writer describes his situation and sentences where he asks for something.",
        "One sentence names a result for his business. Another begins with the word beg.",
        "Compare what he describes with what he asks his reader to do.",
      ],
      model:
        "Think-aloud: he describes unsold goods and unpaid clerks, then begs his partner to tell Parliament. He wants his concern carried to people with power, so describing and requesting is his purpose.",
      explain:
        "Right: he describes his losses and asks his partner to pass on his concern, so the letter is about his business and his request.",
      transfer: {
        prompt:
          "A letter says: Our crops failed this year. Please send seed and money before spring. What is the writer's main purpose?",
        options: [
          { id: "a", text: "To describe a problem and request help" },
          { id: "b", text: "To teach farming methods" },
          { id: "c", text: "To record weather for historians" },
        ],
        answer: "a",
        explain:
          "The writer describes a problem and then asks for something, which shows the purpose.",
      },
      supports: S(
        {
          frames: ["The writer tells about ___ and asks for ___."],
          wordBank: ["purpose", "asks", "describes"],
        },
        { frames: ["His purpose is to ___ because he ___ and then ___."] },
        { frames: ["The writer describes ___ in order to ___, which reveals a purpose of ___."] },
      ),
    },
    {
      id: "q3",
      type: "evidence",
      prompt:
        "Tap the two sentences that show the writer disapproved of the destruction of the tea but still opposed the punishment.",
      answer: ["s5", "s6"],
      evidence: [
        { id: "s5", why: "He calls the destruction of the tea reckless.", optional: false },
        {
          id: "s6",
          why: "He objects that honest merchants suffer for what a crowd did.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "s7",
          tag: "reports-others",
          hint: "That sentence tells what Parliament says. It does not show the writer's own view.",
        },
        {
          pick: "s8",
          tag: "reports-neighbors",
          hint: "That sentence tells what his neighbors say. Look for sentences where he speaks for himself.",
        },
        {
          pick: "s3",
          tag: "describes-effect",
          hint: "That sentence describes the effect on his wharf. The question asks for his view of the tea and of the punishment.",
        },
      ],
      hints: [
        "Look for sentences where the writer begins with the word I and gives a judgment.",
        "One sentence is about what the crowd did. The other is about who is hurt by the response.",
        "They sit next to each other and are joined by the word but.",
      ],
      model:
        "Think-aloud: the writer first says what he thinks of the tea, calling it reckless, and then, after the word But, says what he thinks of the punishment. Those two sentences show both opinions.",
      explain:
        "Right: he disapproves of the destruction of the tea in one sentence and objects to the punishment in the next, so his perspective is not simply that of the crowd or Parliament.",
      transfer: {
        prompt:
          "A writer says: I agree the rule is needed. But I cannot accept how it is enforced. Which word shows the writer is turning to a different view?",
        options: [
          { id: "a", text: "But" },
          { id: "b", text: "agree" },
          { id: "c", text: "rule" },
        ],
        answer: "a",
        explain: "The word but marks a turn from agreement to disagreement.",
      },
      supports: S(
        {
          frames: ["He thinks the tea was ___. He thinks the punishment is ___."],
          wordBank: ["reckless", "unfair", "but"],
        },
        { frames: ["He disapproves of ___ but also objects to ___."] },
        { frames: ["The writer's perspective is mixed, since he condemns ___ yet resists ___."] },
      ),
    },
    {
      id: "q4",
      type: "inference",
      prompt: "How does the writer's work as a merchant shape what he chooses to write about?",
      options: [
        {
          id: "a",
          text: "He stresses lost trade and unpaid clerks and says little about political principles.",
        },
        { id: "b", text: "He writes mainly about law because he is a lawyer." },
        { id: "c", text: "His work has no effect on how he sees the events." },
      ],
      answer: "a",
      evidence: [
        { id: "s3", why: "He describes the closed port in terms of his wharf.", optional: false },
        { id: "s4", why: "He focuses on goods and clerks.", optional: false },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "misreads-source",
          hint: "The letter mentions a firm, a wharf and a warehouse. Reread the details about the writer's occupation.",
        },
        {
          pick: "c",
          tag: "ignores-perspective",
          hint: "Compare what he describes at length with what he mentions in only one sentence. What does that suggest about his priorities?",
        },
      ],
      hints: [
        "Look at what the writer describes in the most detail.",
        "Notice the nouns in the sentences about his wharf and his warehouse.",
        "Compare the amount of space he gives to his business with the amount he gives to political questions.",
      ],
      model:
        "Think-aloud: the longest descriptions are about the wharf, the warehouse and the clerks, which are parts of a merchant's business. A source made by a merchant shows what a merchant notices.",
      explain:
        "Right: his detailed descriptions come from his work, so the letter shows the effects on trade more than the political arguments.",
      supports: S(
        {
          frames: ["He writes about ___ because he is a ___."],
          wordBank: ["merchant", "trade", "wharf", "perspective"],
        },
        { frames: ["His job shapes what he notices, so he writes about ___ more than ___."] },
        { frames: ["Because the writer's livelihood depends on ___, the letter foregrounds ___."] },
      ),
    },
    {
      id: "q5",
      type: "inference",
      prompt:
        "Why can a historian not rely only on this letter to explain why Parliament passed the Coercive Acts?",
      options: [
        {
          id: "a",
          text: "It shows one private merchant's view and reports Parliament's reasons secondhand.",
        },
        { id: "b", text: "Letters from merchants are never useful to historians." },
        { id: "c", text: "It was written in 1774, and old sources are unreliable." },
      ],
      answer: "a",
      evidence: [
        {
          id: "s7",
          why: "He reports what Parliament says, not what Parliament decided in its own words.",
          optional: false,
        },
        { id: "s9", why: "He admits he does not know which account is true.", optional: false },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "absolute-rule",
          hint: "A merchant's letter can be very useful for some questions. The question is about this particular question.",
        },
        {
          pick: "c",
          tag: "age-as-weakness",
          hint: "Being close in time is usually a strength of a primary source. Look for a weakness in what the writer actually knew.",
        },
      ],
      hints: [
        "Think about what the writer could know firsthand and what he could only report.",
        "Find the sentence that begins with the name of a body and a verb of saying, and the sentence in which he admits what he does not know.",
        "Ask whether a merchant in Boston could say why Parliament acted.",
      ],
      model:
        "Think-aloud: the writer reports what Parliament says, and then admits he does not know which account is true. He cannot explain Parliament's reasons firsthand, so a historian needs sources from Parliament too.",
      explain:
        "Right: the letter shows how the Acts affected one merchant, but it cannot explain Parliament's reasoning, so it must be compared with other sources.",
      supports: S(
        {
          frames: ["The writer knows about ___. He does not know ___."],
          wordBank: ["firsthand", "secondhand", "limit"],
        },
        { frames: ["A limitation is that the writer ___, so the letter cannot show ___."] },
        {
          frames: [
            "Because the writer reports ___ secondhand, the letter is insufficient to explain ___.",
          ],
        },
      ),
    },
  ],
  claimPrompt:
    "How useful is this letter for understanding the causes of the American Revolution? Choose the judgment your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "It is useful for showing how the Coercive Acts hurt one merchant and what he believed, but it must be compared with sources from other perspectives before it can explain causes.",
        strong: true,
      },
      {
        id: "c2",
        text: "It is not useful at all, because it is only one private letter.",
        strong: false,
        tag: "dismisses-private-source",
        hint: "A private letter can show how a policy affected one person. Its limits are a reason to compare it with other sources, not to discard it.",
      },
      {
        id: "c3",
        text: "It is completely reliable about why Parliament acted, because the writer lived in Boston.",
        strong: false,
        tag: "overclaims-reach",
        hint: "Your notes show that the writer reports Parliament's reasons secondhand and admits he does not know which account is true.",
      },
      {
        id: "c4",
        text: "It is reliable simply because it was written in 1774.",
        strong: false,
        tag: "age-as-proof",
        hint: "Being close in time helps, but a source is reliable only for questions its maker could answer.",
      },
    ],
    evidenceIds: ["s4", "s5", "s7", "s9", "s10"],
    evidenceMin: 3,
    why: "Your notes show a detailed account of one merchant's losses, a mixed view of the tea and the punishment, and the writer's own admission that he reports Parliament secondhand. That supports a judgment that the letter is useful for some questions and limited for others.",
    hints: [
      "A judgment about a source can say it is useful for one question and limited for another.",
      "Review your notes. Which choice would your evidence about the writer's knowledge and about his losses both support?",
      "Eliminate any choice that rejects the source completely or trusts it completely.",
    ],
    explainPrompt:
      "Explain how the letter is useful and how it is limited. Use at least two pieces of your evidence.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because, so or this shows to connect each piece of evidence to my judgment.",
        test: { type: "contains-any", words: ["because", "so ", "this shows", "which shows"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 22 words.",
        test: { type: "min-words", n: 22 },
      },
      { id: "both", label: "I named both a use and a limit of the letter.", self: true },
    ],
  },
  explainFrames: {
    ee: ["The letter is useful for ___.", "It is limited because ___."],
    dev: ["The letter is useful for ___ because ___.", "It is limited because the writer ___."],
    exp: ["Although the letter reveals ___, it cannot show ___ because the writer ___."],
    br: [
      "As a primary source, the letter is valuable for ___, but its perspective and limited knowledge mean it must be corroborated with ___.",
    ],
  },
  reflection: {
    prompt: "What did sourcing the letter tell you that reading the words alone did not?",
    frames: {
      ee: ["I learned who ___.", "I learned why ___."],
      dev: [
        "Asking who the letter was for showed me ___.",
        "Asking why it was written showed me ___.",
      ],
      exp: ["Sourcing showed me that ___, which changed how I read ___."],
      br: [
        "Attending to audience, purpose and perspective revealed that ___, which affects how far the letter can be used to explain ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
