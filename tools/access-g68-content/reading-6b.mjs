// Grades 6-8 publisher pass, Reading Room lessons, batch 6b: evidence, paired sources, proposals and instruments.
// Original EduWonderLab texts. Every dataset, person, meeting and program below is fictional and labeled as such.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "courtyard-hearing-minutes",
    level: "C",
    title: "The Courtyard Hearing: Minutes and a Decision",
    summary:
      "Read made-up student council minutes with two proposals and decide how strong each speaker's evidence is.",
    genre: "Meeting minutes (made-up hearing)",
    subject: "Social studies and English language arts",
    topics: ["evaluating evidence", "proposals", "civic decisions"],
    keyUse: "Argue",
    eldStandard: "ELD-SS",
    languageFunction:
      "Evaluate evidence from two speakers and support a decision with a reason and a limit.",
    languageFeatures: ["claim and evidence language", "concession with although", "hedging words"],
    minutes: 22,
    content:
      "Read meeting minutes, compare two proposals, and judge how well each claim is supported by evidence.",
    language:
      "Use according to, although and a limit is to evaluate evidence and justify a decision.",
    essential: "How do we decide between two good ideas when the evidence is not perfect?",
    background:
      "Think about a decision your school or community made. What information would you want before choosing?",
    hook: "The council has $900 for the courtyard and two proposals that both cost money. One must wait.",
    purpose:
      "Read to find out what evidence each speaker gives, what each piece of evidence cannot show, and what the council decides.",
    vocab: [
      [
        "proposal",
        "a plan that someone suggests for others to decide on",
        "Priya made a proposal to buy shade sails.",
        "propuesta",
      ],
      [
        "evidence",
        "facts or information that support a claim",
        "A survey result is one kind of evidence.",
        "evidencia",
      ],
      [
        "concede",
        "to admit that a point made by someone else is partly true",
        "Marcus conceded that he had not measured the temperature.",
        "conceder",
      ],
      [
        "motion",
        "a formal suggestion that a group vote on something",
        "The chair asked for a motion to fund one proposal.",
        "moción",
      ],
    ],
    table: {
      headers: ["Proposal", "Speaker", "Evidence given", "Cost"],
      rows: [
        [
          "Shade sails",
          "Priya",
          "A survey of 40 students; 27 said the courtyard is too hot by noon",
          "$600",
        ],
        [
          "Picnic tables",
          "Marcus",
          "A count on two lunch days; about 30 students sat on the ground",
          "$480",
        ],
      ],
      description:
        "A made-up table comparing two proposals for the courtyard: shade sails proposed by Priya with a survey of 40 students and a cost of $600, and four picnic tables proposed by Marcus with a two-day count and a cost of $480.",
    },
    paras: [
      {
        text: "Minutes of the Student Council hearing (a made-up example). The council has $900 to spend on the courtyard. Two proposals cost more than $900 together, so the council can fund only one. The chair, Ms. Okafor, asked each speaker to explain the proposal and the evidence behind it.",
        q: "Why can the council fund only one proposal?",
      },
      {
        text: "Priya proposed shade sails for $600. She surveyed 40 students at lunch, and 27 said the courtyard is too hot to sit in by noon. Priya argued that shade would make the space usable for more students. When Marcus asked whether the survey measured temperature, she conceded that it measured how students feel, not how hot it is.",
        q: "What evidence does Priya give, and what does she concede?",
      },
      {
        text: "Marcus proposed four picnic tables for $480. He counted students on two lunch days, and about 30 sat on the ground. Marcus argued that tables would give those students a place to eat together. When Priya said tables in full sun would still be too hot, Marcus agreed that was possible. He added that his count covered only two days.",
        q: "What evidence does Marcus give, and what does he agree with?",
      },
      {
        text: "The chair restated both proposals. Priya’s evidence is a survey of opinion. Marcus’s evidence is a count of what students were doing. Neither speaker measured temperature, and neither could say how typical the lunch days were. Council member Dev moved to fund the tables now and to ask Priya to collect temperature readings for a later vote on shade. The motion passed, 6 to 3.",
        q: "What does the council decide, and why might they have decided it?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt:
          "How many students did Priya survey, and how many said the courtyard is too hot by noon?",
        opts: [
          "She surveyed 40 students, and 27 said it is too hot.",
          "She surveyed 27 students, and 40 said it is too hot.",
          "She surveyed 30 students, and 27 said it is too hot.",
        ],
        why: [
          "The numbers are reversed: 27 is the number who said it is too hot, not the number surveyed.",
          "Thirty is the number of students Marcus counted sitting on the ground, not the size of Priya’s survey.",
        ],
        rat: "Paragraph 2 says Priya surveyed 40 students and 27 said the courtyard is too hot to sit in by noon.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 2, Priya “conceded” that her survey measured how students feel. What does conceded mean?",
        opts: [
          "admitted that a point was partly true",
          "refused to answer a question",
          "proved that the other speaker was wrong",
        ],
        why: [
          "Priya answers Marcus’s question directly, so she does not refuse to answer.",
          "She accepts a limit of her own evidence, which is the opposite of proving someone wrong.",
        ],
        rat: "Priya agrees that her survey did not measure temperature, which shows that conceded means admitted a point was partly true.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use data from a table",
        type: "choice",
        prompt:
          "Use the table. How much money would be left from $900 if the council funded the picnic tables?",
        opts: ["$420", "$300", "$480"],
        why: [
          "Three hundred dollars would be left if the council bought the shade sails, which cost $600.",
          "Four hundred eighty dollars is the cost of the tables, not what is left after buying them.",
        ],
        rat: "The tables cost $480, and $900 minus $480 is $420.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Evaluate evidence",
        type: "choice",
        prompt: "Which statement best describes a limit of Marcus’s evidence?",
        opts: [
          "Two lunch days may not be typical of every lunch day.",
          "He counted students who were sitting on the ground.",
          "He asked for money to buy picnic tables for the courtyard.",
        ],
        why: [
          "Counting students is how he collected his evidence, so it is not a limit.",
          "What Marcus asked for is his proposal, not a weakness in the evidence he gave.",
        ],
        rat: "Paragraph 3 says his count covered only two days, and paragraph 4 says neither speaker could say how typical the days were.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that shows what the council decided.",
        evidence: ["p4"],
        rat: "Paragraph 4 says the motion to fund the tables and collect temperature readings passed, 6 to 3.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author’s craft",
        type: "choice",
        prompt:
          "Why does the writer include the sentence in which the chair restates both proposals?",
        opts: [
          "It compares both pieces of evidence fairly before the vote.",
          "It shows that the chair prefers the proposal for tables.",
          "It explains that the council will not make any decision.",
        ],
        why: [
          "The chair names a limit of each speaker’s evidence, which treats both fairly and does not take a side.",
          "The next sentence shows that the council did decide, with a motion that passed.",
        ],
        rat: "The chair’s restatement lists what each speaker gave as evidence and what neither measured, which helps the council weigh both.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Evaluate a decision",
        type: "short",
        prompt:
          "Do you think the council made a good decision? Use one piece of evidence from the minutes and one limit of that evidence in your answer.",
        lookFor: [
          "States a position on the decision",
          "Uses one piece of evidence from the minutes, such as the 40-student survey or the two-day count",
          "Names a limit of that evidence and uses a word like although, but or limit",
        ],
        rubric: [
          "Position is clear",
          "Evidence comes from the text",
          "A limit is named in precise language",
        ],
        frame: "I think the decision was ___ because ___. Although ___, a limit is that ___.",
        model:
          "I think the decision was reasonable because Marcus counted about 30 students sitting on the ground, and tables would meet that need right away. Although the count covered only two days, the council also asked Priya to collect temperature readings, so the shade proposal can still be decided with better evidence.",
      },
    ],
    transfer: {
      prompt:
        "Think of a choice your class or family has to make between two good options. Write a short paragraph that names the choice, gives one piece of evidence for each option, and names one limit of the evidence.",
      lookFor: [
        "Names the choice and the two options",
        "Gives one piece of evidence for each option",
        "Names a limit of at least one piece of evidence",
      ],
      frame: "We have to choose between ___ and ___. One piece of evidence is ___. A limit is ___.",
    },
    guide: {
      mini: "Project the table. Ask which proposal has more evidence and which evidence is closer to the problem. Then ask what each speaker conceded and how that makes their position more or less convincing.",
      discussion: [
        "Is it a weakness or a strength when a speaker admits the limits of their evidence?",
        "Would more evidence change your decision? What would you collect first?",
        "Why might a council fund one proposal now and collect more evidence for the other?",
      ],
      misconception:
        "Students may think that the larger sample or the bigger number automatically wins. Both pieces of evidence have limits, and the better question is which evidence is closest to the problem the council needs to solve.",
      answerNotes: [
        "Question 3: $900 minus $480 is $420.",
        "Question 4: both speakers admit limits; the key limit for Marcus is that two days may not be typical.",
      ],
      model:
        "I think the decision was reasonable because Marcus counted about 30 students sitting on the ground, and tables would meet that need right away. Although the count covered only two days, the council also asked Priya to collect temperature readings.",
    },
    family: family(
      "Read the minutes together. Ask your student which proposal they would have supported and why. Then talk about what evidence your family uses when you make a choice, such as comparing prices or asking others. You can talk in any language.",
      "Lean juntos el acta. Pida a su estudiante qué propuesta habría apoyado y por qué. Luego conversen sobre qué evidencia usa su familia cuando toma una decisión, como comparar precios o preguntar a otras personas. Pueden hablar en cualquier idioma.",
      [
        "Which piece of evidence was most useful to you, and what did it not show?",
        "What would you want to collect before you decide?",
      ],
    ),
    connections: {
      write:
        "Write a short argument for one proposal that names one piece of evidence and one limit.",
      speak:
        "Role-play the hearing: each partner presents a proposal, names evidence and concedes one limit.",
      listen:
        "Listen to the task Listen and Respond: The Courtyard Hearing and name each speaker's evidence.",
    },
  },
  {
    id: "rain-garden-paired-sources",
    level: "C",
    title: "Two Sources, One Rain Garden",
    summary:
      "Compare a made-up city flyer with a made-up student blog post, and decide what the two sources show together and what they do not.",
    genre: "Paired informational texts (made-up flyer and blog)",
    subject: "Science and English language arts",
    topics: ["comparing sources", "claims and evidence", "careful language"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction:
      "Compare two sources and explain what they support together, using careful language.",
    languageFeatures: [
      "hedging words such as may and suggests",
      "comparison language",
      "purpose words",
    ],
    minutes: 22,
    content:
      "Compare two sources about a rain garden, sort what each one says, and explain what they support together.",
    language: "Use suggests, may and consistent with to describe evidence without overclaiming.",
    essential: "How do two sources work together, and how much can they prove?",
    background:
      "Think about a time you read two different pieces of information about the same topic. How did you decide how much to trust each?",
    hook: "A city flyer says rain gardens help. A student says her puddle is gone. Does that prove it?",
    purpose:
      "Read to find out what each source says, why each was written, and what the two sources support together.",
    vocab: [
      [
        "runoff",
        "rain that flows over the ground instead of soaking in",
        "Rain from the roof becomes runoff when it hits the pavement.",
        "escorrentía",
      ],
      [
        "observation",
        "something you notice by looking or measuring",
        "Her observation was that the puddle lasted one day.",
        "observación",
      ],
      [
        "suggest",
        "to point toward a conclusion without proving it",
        "The results suggest that the garden helped.",
        "sugerir",
      ],
      [
        "consistent with",
        "agreeing with something without proving it",
        "Her report is consistent with what the flyer says.",
        "coherente con",
      ],
    ],
    paras: [
      {
        text: "Source 1: a city flyer (made up for this lesson). “A rain garden is a shallow garden planted with native plants. It is built in a low spot so that rain from roofs and pavement can collect there and soak into the soil instead of flowing straight into the street. The city invites schools and neighbors to build rain gardens. Ask for a free planning guide.”",
        q: "What does the flyer say a rain garden does?",
      },
      {
        text: "Source 2: a student blog post (made up for this lesson). “Last spring our class built a rain garden in the corner of the parking lot. Before, a puddle sat there for about two days after a storm. Since the garden went in, the puddle has usually been gone in one day. I am excited, but I want to be careful. This summer was drier than last year, so the garden may not be the only reason.”",
        q: "What does the student report, and what does she say about being careful?",
      },
      {
        text: "The two sources have different purposes. The flyer was written to describe rain gardens and to invite readers to build one. The blog post was written to report one class’s experience. The flyer states what a rain garden does in general. The blog post offers one observation from one parking lot.",
        q: "Why was each source written?",
      },
      {
        text: "Together, the sources fit. The flyer explains how a rain garden is built to work, and the blog post reports a change that is consistent with that explanation. But the blog post cannot prove the garden caused the change, because the weather also changed. To test the idea, the class could measure the puddle after every storm and record how much rain fell.",
        q: "What do the two sources support together, and what would make the evidence stronger?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to Source 2, how long did the puddle last before and after the garden?",
        opts: [
          "about two days before, usually one day after",
          "about one day before, usually two days after",
          "about two days before, and still two days after",
        ],
        why: [
          "The order is reversed; the puddle lasted longer before the garden, not after it.",
          "The student says the puddle has usually been gone in one day since the garden went in.",
        ],
        rat: "Paragraph 2 says the puddle sat for about two days after a storm before, and has usually been gone in one day since.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 4, the blog post is “consistent with” the flyer. What does consistent with mean?",
        opts: [
          "agrees with it without proving it",
          "copies the words of the flyer",
          "proves that the flyer is correct",
        ],
        why: [
          "The blog post is written in the student’s own words and reports its own observation.",
          "The paragraph says the blog post cannot prove the garden caused the change.",
        ],
        rat: "Paragraph 4 says the report fits the flyer’s explanation but cannot prove the cause, which is what consistent with means.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort claims by source",
        type: "sort",
        prompt: "Sort each statement: does it come from the flyer, the blog post, or both?",
        cats: ["Flyer only", "Blog post only", "Both sources"],
        sortItems: [
          ["A rain garden is built in a low spot.", 0],
          ["The puddle usually lasts one day now.", 1],
          ["A school can build a rain garden.", 2],
          ["This summer was drier than last year.", 1],
          ["Schools can ask for a free planning guide.", 0],
        ],
        rat: "The flyer describes how a garden is built and invites readers to ask for a guide; the blog post reports the puddle and the dry summer. Both show that a school can build a rain garden.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author’s purpose",
        type: "choice",
        prompt: "How are the purposes of the two sources different?",
        opts: [
          "The flyer describes and invites; the blog post reports one experience.",
          "The flyer argues against rain gardens; the blog post argues for them.",
          "The flyer reports one experience; the blog post describes rain gardens.",
        ],
        why: [
          "The flyer does not argue against rain gardens; it invites readers to build them.",
          "The two purposes are reversed; the flyer describes rain gardens in general.",
        ],
        rat: "Paragraph 3 says the flyer was written to describe and invite, and the blog post to report one class’s experience.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Evaluate a claim",
        type: "multi",
        prompt: "Choose TWO statements that the two sources support.",
        opts: [
          "The student’s report is consistent with what the flyer says a rain garden does.",
          "The student could test the idea by measuring the puddle after each storm.",
          "The rain garden is the only reason the puddle now goes away faster.",
          "Every school that builds a rain garden will have a smaller puddle.",
          "A drier summer proves that the rain garden does not work.",
        ],
        ans: 2,
        why: [
          "The student says the dry summer may also explain the change, so the sources do not support a single cause.",
          "The sources describe one garden, so they cannot support a claim about every school.",
          "The dry summer is a reason for caution, and nothing in the text says it shows the garden fails.",
        ],
        rat: "Paragraph 4 says the report fits the flyer and describes measuring after each storm, but the sources do not support one cause or a claim about every school.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains why the student is careful about her claim.",
        evidence: ["p2"],
        rat: "Paragraph 2 says this summer was drier than last year, so the garden may not be the only reason.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Synthesize two sources",
        type: "short",
        prompt:
          "Write two or three sentences that tell what the two sources show together and one thing they cannot show. Use careful language such as suggests, may or consistent with.",
        lookFor: [
          "Says what the sources show together, such as the report is consistent with the flyer",
          "Names one limit, such as one garden, one summer or a weather change",
          "Uses careful language such as suggests, may or consistent with",
        ],
        rubric: [
          "Uses both sources",
          "Names a specific limit",
          "Avoids saying the garden is proven to be the cause",
        ],
        frame: "Together, the sources suggest ___, but they cannot show ___ because ___.",
        model:
          "Together, the sources suggest that the rain garden may help rain soak in, because the student’s report is consistent with the flyer. But they cannot show that the garden is the only reason, because this summer was also drier than last year.",
      },
    ],
    transfer: {
      prompt:
        "Find or imagine two sources about the same topic, such as a school announcement and a student comment. Write what each one adds, and name one thing the two sources cannot tell you together.",
      lookFor: [
        "Says what each source adds",
        "Names a limit of what the sources can show together",
        "Uses careful language such as may, suggests or consistent with",
      ],
      frame:
        "The first source tells us ___. The second source tells us ___. Together they cannot show ___.",
    },
    guide: {
      mini: "Write the sentence “The garden fixed the puddle” on the board. Ask what evidence supports it and what would make it stronger. Then rewrite it with a careful verb such as suggests or is consistent with.",
      discussion: [
        "How is a source written to invite readers different from one written to report an experience?",
        "Which careful words did you notice in the blog post?",
        "What measurement would turn the student’s observation into stronger evidence?",
      ],
      misconception:
        "Students may treat two sources that agree as proof. The sources fit together, but the weather also changed, so the cause is not proven.",
      answerNotes: [
        "Question 5: the two supported statements are the consistency with the flyer and the plan to measure after each storm.",
        "Question 3: the flyer holds the build and guide statements; the blog holds the puddle and dry summer statements; soaking appears in both.",
      ],
      model:
        "Together, the sources suggest that the rain garden may help rain soak in, because the student’s report is consistent with the flyer. But they cannot show that the garden is the only reason.",
    },
    family: family(
      "Read both sources together. Ask your student to tell you what each source says in one sentence, then to explain why the blog post is careful about its claim. Talk about a time when two things happened together but one may not have caused the other. You can talk in any language.",
      "Lean juntos las dos fuentes. Pida a su estudiante que diga en una oración lo que dice cada fuente y que explique por qué la publicación del blog es cuidadosa con su afirmación. Conversen sobre algún momento en que dos cosas ocurrieron a la vez pero una quizá no causó la otra. Pueden hablar en cualquier idioma.",
      [
        "What does the flyer say, and what does the blog post say?",
        "Why does the student say the garden may not be the only reason?",
      ],
    ),
    connections: {
      write:
        "Write a short paragraph that combines two sources and names one thing they cannot prove.",
      speak: "Explain to a partner what two sources show together and what limit remains.",
      listen:
        "Listen to the task Take Notes: A Flyer and an Interview and compare it with this reading.",
    },
  },
  {
    id: "repair-cafe-proposal-letter",
    level: "C",
    title: "A Proposal to the Committee: The Repair Cafe",
    summary:
      "Read a made-up student proposal with a budget table, and judge how well each part makes the case.",
    genre: "Proposal letter (made-up program and budget)",
    subject: "English language arts and social studies",
    topics: ["proposals", "budgets", "persuasive structure"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction:
      "Evaluate how the parts of a proposal work together and write a request that is specific and realistic.",
    languageFeatures: [
      "proposal structure words",
      "modal verbs such as would and could",
      "precise numbers",
    ],
    minutes: 22,
    content:
      "Read a proposal letter, use a budget table, and evaluate how each part helps the committee decide.",
    language: "Use propose, request and would need to write specific, realistic proposals.",
    essential: "What makes a proposal clear enough that a committee can say yes?",
    background:
      "Think about a time someone asked a group to try a new idea. What did they need to explain?",
    hook: "Families throw away broken lamps and backpacks every year. What if volunteers could fix them for free?",
    purpose:
      "Read to find out the parts of the proposal, how the budget works, and what the writers ask the committee to do.",
    vocab: [
      [
        "proposal",
        "a written or spoken plan that asks others to approve something",
        "The students sent a proposal to the school committee.",
        "propuesta",
      ],
      [
        "budget",
        "a plan for how much money will be spent and on what",
        "The budget shows that the supplies cost $80.",
        "presupuesto",
      ],
      [
        "trial",
        "a short test of a new plan before making it permanent",
        "The committee approved a trial in March.",
        "prueba piloto",
      ],
      [
        "volunteer",
        "a person who helps without being paid",
        "Eight volunteers will fix items.",
        "voluntario",
      ],
    ],
    table: {
      headers: ["Item", "Amount", "Cost"],
      rows: [
        ["Basic tool kits", "2", "$40"],
        ["Sewing and patch supplies", "1 set", "$25"],
        ["Signs and sign-in sheets", "1 set", "$15"],
        ["Total", "", "$80"],
      ],
      description:
        "A made-up budget for a Repair Cafe trial: two basic tool kits for $40, one set of sewing and patch supplies for $25, and one set of signs and sign-in sheets for $15, for a total of $80.",
    },
    paras: [
      {
        text: "To the Family and School Committee (a made-up proposal). Every year, families at our school throw away broken lamps, backpacks and bicycle parts that could be fixed. Fixing an item often takes only a few minutes and a basic tool. We think the school can help families keep useful things instead of throwing them away.",
        q: "What problem does the proposal name?",
      },
      {
        text: "We propose a Repair Cafe, held one Saturday a month in the library. Volunteers would fix small items for free while the owners watch and learn how to do simple repairs. Families could bring lamps, backpacks, torn jackets and bicycle parts. We would not repair electronics with exposed wires or anything that needs a licensed repair person.",
        q: "What exactly is being proposed, and what would the volunteers not repair?",
      },
      {
        text: "To start, we would need three tables, two basic tool kits and eight volunteers. The budget below shows the cost of supplies. The school already has the tables, and the volunteers would come from our club and from families. The total cost of the supplies is $80.",
        q: "What does the program need, and how much would it cost?",
      },
      {
        text: "We ask the committee to approve a trial on the first Saturday in March. After the trial, we will report how many items we fixed and how many people came. If the trial goes well, we will ask the committee to approve one Saturday a month. If it does not, we will describe what we learned. Thank you for considering our proposal.",
        q: "What do the writers ask for, and what will they report afterward?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What do the writers ask the committee to approve first?",
        opts: [
          "a trial on the first Saturday in March",
          "a Repair Cafe every Saturday of the year",
          "a new building for repairs at the school",
        ],
        why: [
          "The writers want to hold the Repair Cafe one Saturday a month, and only after a trial.",
          "The proposal uses the existing library and tables, so it does not ask for a new building.",
        ],
        rat: "Paragraph 4 says the writers ask the committee to approve a trial on the first Saturday in March.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 4, what is a trial?",
        opts: [
          "a short test of a new plan",
          "a meeting held in a courtroom",
          "a final decision that cannot be changed",
        ],
        why: [
          "The word is used about a program, so it has nothing to do with a courtroom.",
          "The writers say that after a trial they will ask for more, so it is not a final decision.",
        ],
        rat: "Paragraph 4 says the trial comes first and that the writers will report results before asking for more.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Check the budget",
        type: "choice",
        prompt: "Use the table. Which statement about the budget is correct?",
        opts: [
          "The three items add up to the $80 total.",
          "The tool kits cost more than all the other items together.",
          "The signs and sign-in sheets cost $25.",
        ],
        why: [
          "The tool kits cost $40, which is the same as the other two items together ($25 plus $15), not more.",
          "The $25 is the cost of the sewing and patch supplies; the signs and sign-in sheets cost $15.",
        ],
        rat: "The table shows $40 plus $25 plus $15, which equals $80, the total in paragraph 3.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "order",
        prompt: "Put the parts of the proposal in the order the writers present them.",
        items: [
          "The writers name a problem.",
          "The writers propose a solution.",
          "The writers list what the program needs.",
          "The writers ask for a trial and promise a report.",
        ],
        rat: "Paragraphs 1 through 4 follow this order: problem, solution, needs and budget, and then the request with a promise to report.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why do the writers say what the volunteers would NOT repair?",
        opts: [
          "to show the committee that they have thought about safety and limits",
          "to explain that the program is too small to be useful",
          "to tell families that the Repair Cafe will close after one month",
        ],
        why: [
          "The writers want the program to succeed, so they are not describing it as useless.",
          "The text says the program would run monthly, so naming limits is not about closing.",
        ],
        rat: "Paragraph 2 sets limits on what would be repaired, which tells the committee the writers have planned for safety and realistic limits.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author’s craft",
        type: "choice",
        prompt: "Why do the writers promise to report after the trial?",
        opts: [
          "It lets the committee decide what to do next using results.",
          "It shows that the trial will definitely be a success.",
          "It makes the proposal shorter and easier to read.",
        ],
        why: [
          "The writers also say what they would do if the trial does not go well, so success is not guaranteed.",
          "The promise adds a sentence and does not make the proposal shorter.",
        ],
        rat: "Paragraph 4 says the writers will report how many items were fixed, which gives the committee evidence for a later decision.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Evaluate a proposal",
        type: "short",
        prompt:
          "What is one strength of this proposal, and what is one question the committee might still ask? Use details from the letter.",
        lookFor: [
          "Names a strength with a detail, such as a small budget, a trial, or limits on what is repaired",
          "Writes a realistic question the committee might ask, such as who will supervise or who owns the tools",
          "Connects the strength or the question to the committee’s decision",
        ],
        rubric: [
          "A strength is named with a detail",
          "The question is realistic and specific",
          "The answer connects to the committee’s decision",
        ],
        frame: "One strength is ___ because ___. The committee might still ask ___ because ___.",
        model:
          "One strength is the small budget of $80 and the trial, because the committee risks very little and gets results. The committee might still ask who will supervise the volunteers on Saturdays, because the letter says eight volunteers but not who is in charge.",
      },
    ],
    transfer: {
      prompt:
        "Think of a small program you would like your school to try. Write the first two parts of a proposal: name the problem in one or two sentences, and then propose a specific solution with at least one number.",
      lookFor: [
        "Names a clear problem",
        "Proposes a specific solution",
        "Includes at least one number such as a cost, a time or a quantity",
      ],
      frame: "The problem is ___. We propose ___. We would need ___.",
    },
    guide: {
      mini: "Project the letter and mark each part with a margin label: problem, solution, needs, request, report. Ask students which label they would move first if the committee only had one minute to listen.",
      discussion: [
        "Why do the writers ask for a trial first instead of a permanent program?",
        "Which detail in the budget would you check before saying yes?",
        "What might the committee still want to know?",
      ],
      misconception:
        "Students may think a long proposal is a strong one. Here the proposal is strong because each part is specific: a clear problem, a limited solution, a small budget, and a trial with a report.",
      answerNotes: [
        "Question 3: $40 plus $25 plus $15 equals $80.",
        "Question 4: the order is problem, solution, needs, request with a promise to report.",
      ],
      model:
        "One strength is the small budget of $80 and the trial, because the committee risks very little and gets results. The committee might still ask who will supervise the volunteers.",
    },
    family: family(
      "Read the proposal together. Ask your student to name the problem, the solution and the request in their own words. Then talk about a small change your family might propose at home, and what you would need to explain. You can talk in any language.",
      "Lean juntos la propuesta. Pida a su estudiante que diga con sus propias palabras el problema, la solución y la petición. Luego conversen sobre un cambio pequeño que su familia podría proponer en casa y qué tendrían que explicar. Pueden hablar en cualquier idioma.",
      [
        "What problem does the proposal name, and what solution does it offer?",
        "Which part of the proposal would you check first, and why?",
      ],
    ),
    connections: {
      write:
        "Write the problem, solution and request parts of a proposal for a small program at your school.",
      speak: "Present a proposal to a partner, who acts as the committee and asks one question.",
      listen:
        "Listen to the task Proposal Structure: The Repair Cafe and compare the order of the parts.",
    },
  },
  {
    id: "sensor-briefing-claims",
    level: "C",
    title: "What the Hallway Sensor Can and Cannot Tell Us",
    summary:
      "Read a made-up sensor report and separate what the instrument measured from what the writers should not claim.",
    genre: "Science briefing with data (made-up readings)",
    subject: "Science and math",
    topics: ["instruments", "data and claims", "limits of evidence"],
    keyUse: "Inform",
    eldStandard: "ELD-SC",
    languageFunction:
      "Distinguish an observation, an inference and an overclaim, and rewrite a claim to match the data.",
    languageFeatures: ["limiting words such as only and one", "claim language", "contrast words"],
    minutes: 22,
    content: "Read a table of sensor readings and decide which claims the data supports.",
    language: "Use only, may and at least one more to state claims that stay inside the data.",
    essential: "How can we tell what a measurement shows and what it does not?",
    background:
      "Think about a thermometer or a fitness tracker. What does it tell you, and what might it miss?",
    hook: "A sound sensor recorded one very loud moment. Does that make the whole place loud?",
    purpose:
      "Read to find out what the sensor measured, what the table shows, and which claims go too far.",
    vocab: [
      [
        "sensor",
        "a device that measures something, such as sound or heat",
        "The sensor measured the loudest sound each day.",
        "sensor",
      ],
      [
        "peak",
        "the highest reading in a period of time",
        "The peak in the gym was higher than the peak in the library.",
        "pico",
      ],
      [
        "overclaim",
        "to say more than the evidence supports",
        "Saying the gym is always loud would be an overclaim.",
        "afirmar de más",
      ],
      [
        "inference",
        "a conclusion based on evidence and reasoning",
        "The students made an inference about why the reading was high.",
        "inferencia",
      ],
    ],
    table: {
      headers: ["Location", "Loudest reading (decibels)"],
      rows: [
        ["Library", "52"],
        ["Hallway", "74"],
        ["Cafeteria", "86"],
        ["Gym", "91"],
      ],
      description:
        "A made-up table of the loudest reading from a sound sensor at four places on one school day: library 52, hallway 74, cafeteria 86, gym 91 decibels.",
    },
    paras: [
      {
        text: "A science class borrowed one sound sensor and placed it in four locations on one school day (a made-up example). At each location, the sensor recorded only the loudest moment, called the peak, measured in decibels. The class put the four peaks in a table.",
        q: "What did the sensor record, and where?",
      },
      {
        text: "The table shows that the gym had the highest peak, 91 decibels, and the library had the lowest, 52. This is an observation: it describes exactly what the sensor recorded. It says nothing about how loud the places were for the rest of the day, because the sensor kept only one number for each place.",
        q: "What does the table show, and what does it not show?",
      },
      {
        text: "One student wrote, “The gym is the loudest place in our school.” That claim goes too far. The sensor was in each place for a short time, on one day, and it saved only the peak. A different day, a different time or a different measure, such as the average, could give a different order. Scientists call this kind of statement an overclaim.",
        q: "Why is the claim about the loudest place an overclaim?",
      },
      {
        text: "A better claim stays inside the data: “On this day, the gym had the highest peak reading of the four places we measured.” The class can also make an inference, such as that a gym with a game may have a loud moment, but an inference needs more evidence. To strengthen the evidence, the class could measure on several days and record the average as well as the peak.",
        q: "How can the class write a stronger claim and gather better evidence?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Read a table",
        type: "choice",
        prompt: "According to the table, which location had the lowest peak reading?",
        opts: ["Library", "Hallway", "Cafeteria"],
        why: [
          "The hallway reading was 74, which is higher than the library’s 52.",
          "The cafeteria reading was 86, which is one of the highest, not the lowest.",
        ],
        rat: "The table shows the library with a peak of 52 decibels, the lowest of the four.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, an “overclaim” is mentioned. What is an overclaim?",
        opts: [
          "a statement that says more than the evidence supports",
          "a measurement that is lower than expected",
          "a claim that the sensor does not need to be checked",
        ],
        why: [
          "An overclaim is about a statement, not about a measurement being high or low.",
          "The text says the opposite: the class should collect more evidence before making a stronger claim.",
        ],
        rat: "Paragraph 3 explains that the sensor, the one day and the single measure do not support the claim about the loudest place.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort statements",
        type: "sort",
        prompt: "Sort each statement: is it an observation, an inference, or an overclaim?",
        cats: ["Observation", "Inference", "Overclaim"],
        sortItems: [
          ["On this day, the gym peak was 91 decibels.", 0],
          ["The gym was probably loud because of a game.", 1],
          ["The gym is always the loudest place in the school.", 2],
          ["The library peak was 52 decibels.", 0],
          ["Cafeterias are louder than libraries in every school.", 2],
        ],
        rat: "The two peak readings describe what the sensor recorded. The game explanation is a reasonable guess that needs more evidence. The always and every school statements go beyond one day and one school.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference about limits",
        type: "choice",
        prompt: "Why might the order of the four places change on a different day?",
        opts: [
          "The sensor saved only a peak from one day, and other days may be different.",
          "The sensor is broken and gives a different number every time.",
          "The library is the only place where the sensor works properly.",
        ],
        why: [
          "Nothing in the text says the sensor is broken; it says the readings are limited.",
          "The sensor recorded readings in all four places, and the text does not say it fails anywhere.",
        ],
        rat: "Paragraph 3 says a different day, time or measure could give a different order.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author’s craft",
        type: "choice",
        prompt:
          "The writer quotes a student’s claim and then explains why it goes too far. What is the purpose of this?",
        opts: [
          "to show a common mistake and teach how to avoid it",
          "to prove the student is a poor scientist",
          "to argue that sensors should never be used in schools",
        ],
        why: [
          "The writer does not criticize the student; the claim is used as an example for the whole class.",
          "The writer recommends better ways to use the sensor, not to stop using it.",
        ],
        rat: "Paragraph 3 uses the claim as an example, and paragraph 4 shows how to rewrite it, which teaches the reader how to avoid the mistake.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that gives a safer claim that matches the data.",
        evidence: ["p4"],
        rat: "Paragraph 4 gives the safer claim that stays inside the data: the gym had the highest peak of the four places on this day.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Rewrite a claim",
        type: "short",
        prompt:
          "Rewrite this claim so it stays inside the data: “Cafeterias are louder than libraries.” Use numbers from the table, and tell one thing the class should measure next.",
        lookFor: [
          "Limits the claim to this day and these places, with numbers such as 86 and 52",
          "Uses a limiting word such as only, on this day or at least",
          "Names one more measurement, such as several days or the average",
        ],
        rubric: [
          "Claim matches the table",
          "Language limits the claim",
          "Names a next measurement",
        ],
        frame:
          "On this day, ___ had a peak of ___, and ___ had a peak of ___. Next, we should measure ___.",
        model:
          "On this day, the cafeteria had a peak of 86 decibels, and the library had a peak of 52 decibels. To make a stronger claim, we should measure on several days and record the average as well as the peak.",
      },
    ],
    transfer: {
      prompt:
        "Think of a tool that measures something, such as a bathroom scale or a phone step counter. Write one thing the tool measures well and one thing it cannot tell you. Then write a claim that stays inside what it measures.",
      lookFor: [
        "Names what the tool measures well",
        "Names something the tool cannot tell",
        "Writes a claim with a limit, such as on this day or only",
      ],
      frame:
        "The tool measures ___, but it cannot tell ___. A claim that stays inside the data is ___.",
    },
    guide: {
      mini: "Write three statements on the board: one observation, one inference and one overclaim about the table. Ask students to sort them and then rewrite the overclaim with a limit such as on this day.",
      discussion: [
        "What is the difference between a peak and an average?",
        "Which limiting words made the claim safer?",
        "What is one additional measurement that would make the evidence stronger?",
      ],
      misconception:
        "Students may think a precise number makes a general claim safe. The table is precise, but it records one day and only the peak.",
      answerNotes: [
        "Question 3: observations describe the readings, inferences explain them with a guess, overclaims use always or every.",
        "Question 7: model answers limit the claim to this day and name one more measurement.",
      ],
      model:
        "On this day, the cafeteria had a peak of 86 decibels, and the library had a peak of 52 decibels. To make a stronger claim, we should measure on several days and record the average as well as the peak.",
    },
    family: family(
      "Look at the table together. Ask your student to say one thing the table shows and one thing it cannot show. Then talk about a measuring tool at home, such as a thermometer or a kitchen scale, and what it can and cannot tell you. You can talk in any language.",
      "Miren juntos la tabla. Pida a su estudiante que diga una cosa que muestra la tabla y una cosa que no puede mostrar. Luego conversen sobre un instrumento de medir que tengan en casa, como un termómetro o una balanza de cocina, y qué puede y qué no puede decirles. Pueden hablar en cualquier idioma.",
      [
        "What does the table show, and what does it not show?",
        "What is one safer way to say the claim about the gym?",
      ],
    ),
    connections: {
      write: "Write a claim that stays inside a small data table and name one limit.",
      speak:
        "Explain to a partner the difference between an observation, an inference and an overclaim.",
      listen:
        "Listen to the task Sensor Briefing: What the Data Shows and compare it with this reading.",
    },
  },
];
