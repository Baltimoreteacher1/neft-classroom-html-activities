// Lesson pack: Causes of the American Revolution, with sourcing (grade 8 social studies).
// Original items and imagined source excerpts (each labelled as imagined). Dates are well-established years.
const rect = (x, y, w, h, fill = "paper", stroke = "navy") => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke,
  sw: 2.5,
});
const txt = (x, y, text, size = 13) => ({
  t: "text",
  x,
  y,
  text,
  size,
  fill: "ink",
  weight: 700,
  anchor: "middle",
});
const wrap = (s, w, size) => {
  if (s.includes("\n")) return s;
  const max = Math.max(6, Math.floor((w - 14) / (size * 0.6)));
  const out = [];
  let cur = "";
  for (const word of s.split(" ")) {
    if (cur && `${cur} ${word}`.length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  out.push(cur);
  return out.join("\n");
};
const box = (x, y, w, h, text, fill = "paper", size = 13) => [
  rect(x, y, w, h, fill),
  txt(x + w / 2, y + h / 2, wrap(text, w, size), size),
];
const line = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", strokeWidth: 2.5 });
const right = (x, y) => ({
  t: "poly",
  fill: "ink",
  points: [
    [x, y],
    [x - 12, y - 7],
    [x - 12, y + 7],
  ],
});
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const launchVisual = {
  kind: "timeline",
  alt: "A timeline from 1763 to 1776 with eight events: the Treaty of Paris in 1763, the Stamp Act in 1765, the Townshend Acts in 1767, the Boston Massacre in 1770, the Boston Tea Party in 1773, the Coercive Acts in 1774, the battles of Lexington and Concord in 1775 and the Declaration of Independence in 1776.",
  longDesc:
    "Events in order: 1763 Treaty of Paris, 1765 Stamp Act, 1767 Townshend Acts, 1770 Boston Massacre, 1773 Boston Tea Party, 1774 Coercive Acts, 1775 Lexington and Concord, 1776 Declaration of Independence.",
  w: 480,
  h: 240,
  span: [1763, 1776],
  events: [
    { at: 1763, label: "Treaty of Paris" },
    { at: 1765, label: "Stamp Act" },
    { at: 1767, label: "Townshend Acts" },
    { at: 1770, label: "Boston Massacre" },
    { at: 1773, label: "Tea Party" },
    { at: 1774, label: "Coercive Acts" },
    { at: 1775, label: "Lexington and Concord" },
    { at: 1776, label: "Declaration" },
  ],
};

const chainVisual = {
  kind: "shapes",
  alt: "A three-step diagram. Underlying causes, disagreement over who could tax the colonies and distance from Britain, build tension over years. A trigger, the battles at Lexington and Concord in 1775, sets off the war. The result is open war between the colonies and Britain.",
  w: 480,
  h: 220,
  items: [
    ...box(
      8,
      50,
      150,
      110,
      "Underlying causes: who may tax the colonies, distance, self-government",
      "copper-soft",
      12,
    ),
    line(158, 105, 176, 105),
    right(180, 105),
    ...box(184, 50, 120, 110, "Trigger: fighting at Lexington and Concord, 1775", "copper-soft", 12),
    line(304, 105, 322, 105),
    right(326, 105),
    ...box(330, 50, 142, 110, "Open war between the colonies and Britain", "teal-soft", 12),
  ],
};

const CARD_A =
  "Card A (imagined merchant's letter, 1765): 'The stamp tax makes every contract cost more, and no one in this colony voted for the Parliament that passed it.'";
const CARD_B =
  "Card B (imagined pamphlet by a supporter of Parliament, 1765): 'The colonies were defended at great cost, and Parliament speaks for every British subject, wherever he lives.'";
const CARD_C =
  "Card C (imagined passage from a modern textbook): 'Parliament passed the Stamp Act in 1765 to raise money after the war, and many colonists protested that they had not been represented.'";

// Move each right choice to a varied position so the answer is not always first (answer index is updated).
const POS = [1, 2, 0, 3, 2, 1, 0];
const spreadItems = (items, offset = 0) =>
  items.forEach((it, i) => {
    if (!it.choices) return;
    const right = it.choices[it.answer];
    const rest = it.choices.filter((_, j) => j !== it.answer);
    const pos = POS[(i + offset) % POS.length] % (rest.length + 1);
    rest.splice(pos, 0, right);
    it.choices = rest;
    it.answer = pos;
  });
const spread = (d) => {
  spreadItems(d.guided, 0);
  spreadItems(d.independent.items, 1);
  spreadItems(d.formative.items, 2);
  spreadItems(d.exitTicket.items, 4);
  return d;
};

const DATA = {
  id: "g8-social-studies-causes-of-the-american-revolution-sourcing",
  kind: "lesson",
  title: "Causes of the American Revolution: Sourcing the Evidence",
  subtitle:
    "Weigh multiple causes of the Revolution and judge what each source can and cannot show",
  grade: "8",
  band: "6-8",
  subject: "social-studies",
  duration: 55,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to D2.His.1.6-8, D2.His.6.6-8, D2.His.10.6-8, D2.His.13.6-8, D2.His.14.6-8, RH.6-8.1 and RH.6-8.9; not mapped to a district unit sequence. Items are original and every source excerpt is imagined for practice and labelled as such.",
  },
  standards: [
    "D2.His.1.6-8",
    "D2.His.6.6-8",
    "D2.His.10.6-8",
    "D2.His.13.6-8",
    "D2.His.14.6-8",
    "RH.6-8.1",
    "RH.6-8.9",
  ],
  wida: {
    eld: ["ELD-SS"],
    klus: ["Explain", "Argue"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "6-8",
  },
  contentObjective:
    "I can explain several causes of the American Revolution and judge what a source can and cannot show by asking who made it, when, for whom and why.",
  languageObjective:
    "I can explain a cause and its effect using 'Because ___, ___' and judge a source using 'This source shows ___, but it cannot show ___ because its maker ___'.",
  languageDemands: {
    functions: [
      "explain causes and effects",
      "source a document",
      "compare perspectives",
      "justify a judgment about reliability",
    ],
    structures: [
      "Because ___, Parliament ___, which led colonists to ___.",
      "The writer's purpose was to ___, so the source may leave out ___.",
      "This source shows ___, but it cannot show ___ because its maker ___.",
    ],
    discourse:
      "Source discussion with a sourcing chart, a timeline explanation, and a written paragraph that combines a causal claim with sourced evidence.",
    barriers: [
      "'cause' and 'effect' are also used for everyday talk, but the lesson needs 'underlying cause' and 'trigger' as distinct terms",
      "'representation' names both a picture and having a vote, and the history sense is the second",
      "'colony', 'colonist' and 'colonial' look alike but name a place, a person and an adjective",
      "words like Parliament, duty and repeal appear in sources and have few everyday uses",
      "eighteenth-century sentence patterns with long clauses and inverted word order make primary sources hard to parse",
    ],
    oralRehearse: [
      "Because Britain had a large debt, Parliament passed new taxes, which led colonists to protest.",
      "The merchant wrote to his partner, so the letter shows his business concerns but cannot show Parliament's reasons.",
    ],
    writeScaffold:
      "One cause was ___. This led to ___. A source that shows this is ___, written by ___ for ___. It shows ___, but it cannot show ___.",
  },
  vocab: {
    collection: "g8-social-studies-causes-of-the-american-revolution-sourcing",
    ids: [
      "source",
      "primary-source",
      "secondary-source",
      "sourcing",
      "perspective",
      "purpose",
      "audience",
      "context",
      "corroborate",
      "reliable",
      "cause",
      "effect",
      "underlying-cause",
      "trigger",
      "colony",
      "parliament",
      "tax",
      "representation",
      "boycott",
      "repeal",
      "propaganda",
      "grievance",
      "petition",
      "loyalist",
    ],
  },
  launch: {
    title: "Notice and Wonder: thirteen years in one line",
    visual: launchVisual,
    prompts: [
      "What do you notice about the spacing and the order of the events?",
      "What do you wonder about how one event led to another?",
      "Which events do you think were causes of the war, and which were results of earlier events?",
    ],
    teacherNote:
      "Show the timeline and take two noticings (clusters of events, the long gap before the Boston Massacre) and one wondering. Ask students to predict which events might be causes and which might be responses, and record the predictions. Do not confirm yet. Point out that every event on this line was recorded by someone with a point of view, so the lesson asks two questions at once: what caused the Revolution, and how do we know?",
  },
  teach: {
    model: [
      "Historical events have more than one cause. Historians separate underlying causes, which are deep conditions that build over years, from triggers, which are specific events that set off something already likely. The disagreement over who had the right to tax the colonies was an underlying cause. The fighting at Lexington and Concord in 1775 was a trigger for open war.",
      "After the Seven Years' War ended in 1763, Britain had a large debt and kept troops in North America. Parliament passed new measures to raise money, including the Sugar Act in 1764, the Stamp Act in 1765 and the Townshend Acts in 1767. Colonial assemblies had long managed local taxes, but the colonies elected no members of Parliament. Colonists protested, boycotted British goods and won the repeal of the Stamp Act in 1766. In 1774 Parliament passed the Coercive Acts after the Boston Tea Party.",
      "Each source about these events was made by someone. Sourcing means asking who made it, when, for whom and why. A primary source was created at the time by someone who lived through it. A secondary source was created later by someone who studied the evidence. Both need sourcing, because every maker has a perspective shaped by their situation and interests.",
      "The perspective of the maker affects what a source includes and leaves out. A merchant writing to a partner stresses business losses. A supporter of Parliament stresses the cost of defending the colonies. Neither lies, and neither tells the whole story. When two sources with different perspectives agree on a fact, historians say the fact is corroborated.",
      "Most of the voices in these sources are free men who could vote or argue in public. Enslaved people, women and Native nations were affected by the same events and had little or no voice in the arguments. A careful historian notes whose voices are missing as well as whose are present.",
    ],
    moves: [
      "Keep the timeline visible. Every time a student names an event, ask 'Was that a cause, an effect, or both?'",
      "Teach the sourcing questions as a stamp: who, when, for whom, why. Have students stamp every excerpt before they quote it.",
      "Use the iceberg comparison: protests are what is visible, underlying causes are below. Ask which part a newspaper would notice first.",
      "Pair opposing sources and ask what each leaves out. Never ask which source is true; ask what each is reliable for.",
      "Require the sentence frame 'This source shows ___, but it cannot show ___ because its maker ___' for every source judgment.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "A colonial merchant wrote a letter in 1765 about how the stamp tax hurt his business. For a historian studying that year, the letter is a ___ source.",
      choices: ["primary", "secondary", "modern", "fictional"],
      answer: 0,
      hint: "Ask whether the letter was created at the time by someone who lived through the event.",
      supports: {
        ee: {
          frames: ["The letter was made in ___ by a ___."],
          wordBank: ["primary", "at the time", "lived"],
        },
        dev: {
          frames: ["It is a primary source because it was created ___ by someone who ___."],
          wordBank: ["primary", "firsthand"],
        },
        exp: { frames: ["As a primary source, it shows ___ but only from ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "A pamphlet printed in 1765 was written to persuade readers to support Parliament. What does knowing its purpose tell a historian?",
      choices: [
        "It probably stresses reasons for Parliament and may leave out colonial complaints.",
        "It must be completely false.",
        "It can be ignored because it was written to persuade.",
        "It shows exactly what every British person thought.",
      ],
      answer: 0,
      hint: "A maker who wants to persuade will choose facts that help the argument. Ask what could be left out.",
      supports: {
        ee: {
          frames: ["The writer wanted readers to ___. He may leave out ___."],
          wordBank: ["purpose", "persuade", "leave out"],
        },
        dev: {
          frames: ["The purpose was to ___, so the source may ___."],
          wordBank: ["purpose", "perspective"],
        },
        exp: {
          frames: [
            "Because the maker intended to ___, a historian reads it for ___ rather than for ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which is the best example of an underlying cause of the Revolution?",
      choices: [
        "A long disagreement over who had the right to tax the colonies",
        "The fighting at Lexington and Concord",
        "The Boston Tea Party",
        "The repeal of the Stamp Act",
      ],
      answer: 0,
      hint: "An underlying cause is a condition that builds over years, not a single event on a single day.",
      supports: {
        ee: {
          frames: ["An underlying cause lasts ___. A trigger happens on ___."],
          wordBank: ["underlying", "trigger", "years", "one day"],
        },
        dev: {
          frames: ["This is an underlying cause because it ___, while the others are ___."],
          wordBank: ["builds", "event"],
        },
        exp: {
          frames: [
            "The disagreement qualifies as underlying because it ___ before any ___ and made ___ likely.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "Explain why a historian would want a source from a Loyalist as well as one from a Patriot.",
      answer:
        "Each has a perspective shaped by their situation, so using both shows what each saw and left out and lets the historian corroborate facts that both agree on.",
      hint: "Think about perspective and what happens when sources with different perspectives agree.",
      supports: {
        ee: {
          frames: ["Each person saw ___. Using two helps because ___."],
          wordBank: ["perspective", "both", "different"],
        },
        dev: {
          frames: ["A Loyalist and a Patriot have different ___, so ___."],
          wordBank: ["perspective", "corroborate"],
        },
        exp: {
          frames: ["Because each maker's ___ shapes ___, comparing them lets a historian ___."],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Source stations: who, when, for whom, why",
    task: `Partners receive three imagined excerpts about the Stamp Act.\n\n${CARD_A}\n\n${CARD_B}\n\n${CARD_C}\n\nPartner A completes a sourcing chart for each card with these rows: who made it, when, for whom, why, primary or secondary, perspective, and what it can and cannot show. Partner B checks each row by finding a clue in the card. Together they write one sentence that names a fact two cards agree on, and one sentence that names a question no card can answer.`,
    roles: ["Chart writer", "Clue checker"],
    discussionCards: [
      {
        prompt: "Which card is a secondary source, and how can you tell?",
        frame: "Card ___ is a secondary source because it was written ___ by someone who ___.",
      },
      {
        prompt: "How do the perspectives of Cards A and B differ on who has the right to decide?",
        frame: "Card A treats ___ as ___, while Card B treats ___ as ___.",
      },
      {
        prompt: "What fact do at least two cards agree on, and why does that matter?",
        frame: "Cards ___ and ___ agree that ___, which makes the fact more ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: underlying causes, trigger, result",
      visualOrModel: chainVisual,
      teacherNote:
        "Ask students to point to each box and say whether it is a cause, a trigger or an effect. Then ask what would change if the trigger had come in 1765 instead of 1775: would the same war have started? Use their answers to show that triggers depend on underlying causes.",
    },
    discuss: {
      title: "Say it: a cause, a source, a limit",
      structure:
        "Turn and talk. Partner 1 explains one cause of the Revolution using 'because'. Partner 2 names a source that could show it and asks 'Who made it, and for whom?' Partner 1 answers and names a limit. Swap.",
      frames: [
        "One cause was ___ because ___.",
        "A source that shows this is ___. Who made it, and for whom?",
        "It was made by ___ for ___, so it shows ___.",
        "It cannot show ___ because its maker ___.",
      ],
    },
    apply: {
      title: "Use it: a sourced causal paragraph",
      task: "Write a paragraph that answers this question: Why did the colonies and Britain move toward war between 1763 and 1775? Name one underlying cause and one trigger, explain how each helped bring about war, and include one sentence that sources an excerpt (the merchant's letter or the pamphlet) by saying who made it, for whom and why, and what it cannot show.",
      successCriteria: [
        "I named an underlying cause and a trigger and kept them distinct.",
        "I explained each with because or which led to.",
        "I sourced one excerpt by naming its maker, audience and purpose.",
        "I named something the excerpt cannot show.",
      ],
    },
  },
  activities: [
    { engine: "argument-builder", id: "g8-ss-revolution-causes-argument" },
    { engine: "concept-builder", id: "g8-ss-revolution-timeline-sort" },
    { engine: "language-detective", id: "g8-ss-merchant-letter-sourcing" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which of these is a secondary source about the Stamp Act?",
        choices: [
          "A letter written in 1765 by a merchant who paid the tax",
          "A modern chapter that summarizes what historians know about the Stamp Act",
          "A tax stamp used in 1765",
          "A newspaper printed in 1765 that complains about the tax",
        ],
        answer: 1,
        explain:
          "A secondary source is made later by someone who studied the evidence. The other choices were created at the time.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Which question is part of sourcing a document?",
        choices: [
          "Who made it, when, for whom and why?",
          "Is it written in cursive?",
          "Is it the longest source I have?",
          "Does it agree with what I already believe?",
        ],
        answer: 0,
        explain:
          "Sourcing asks about the maker, the time, the audience and the purpose. Length and agreement do not tell you how to use a source.",
      },
      {
        id: "i3",
        type: "choice",
        prompt:
          "A pamphlet printed to support the colonial protesters calls the Boston Massacre a crime against innocent people. What should a historian do first?",
        choices: [
          "Ask who made it, for whom and why, and what it might leave out.",
          "Reject it because it has strong language.",
          "Accept it as a complete record of what happened.",
          "Ignore it because it was printed rather than handwritten.",
        ],
        answer: 0,
        explain:
          "Strong language shows purpose and perspective, which a historian examines. It does not make the source useless or complete.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which statement correctly links a cause and an effect?",
        choices: [
          "Colonial boycotts of British goods contributed to Parliament's repeal of the Stamp Act in 1766.",
          "The repeal of the Stamp Act caused the Seven Years' War.",
          "The Declaration of Independence caused the Sugar Act.",
          "The Boston Massacre caused the Treaty of Paris.",
        ],
        answer: 0,
        explain:
          "The other choices put the effect before its cause. A cause must come before its effect.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which list puts the measures in the order Parliament passed them?",
        choices: [
          "Sugar Act, Stamp Act, Townshend Acts",
          "Townshend Acts, Stamp Act, Sugar Act",
          "Stamp Act, Sugar Act, Townshend Acts",
          "Sugar Act, Townshend Acts, Stamp Act",
        ],
        answer: 0,
        explain:
          "The Sugar Act was passed in 1764, the Stamp Act in 1765 and the Townshend Acts in 1767.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Explain the difference between an underlying cause and a trigger. Use the American Revolution as an example for each.",
        answer:
          "An underlying cause is a condition that builds over years, such as the disagreement over who could tax the colonies. A trigger is a specific event that sets off what was already likely, such as the fighting at Lexington and Concord.",
        explain:
          "Accept any accurate example. The key idea is that an underlying cause builds over time and a trigger is a specific event.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Why might two honest people describe the Stamp Act differently? Use the word perspective in your answer.",
        answer:
          "Each person's perspective is shaped by their situation. A merchant who paid the tax and a supporter of Parliament who wanted to raise money would stress different facts even if neither lied.",
        explain:
          "Look for the idea that perspective comes from situation and interests, not from dishonesty.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "A merchant's private letter to his partner is most reliable for which question?",
        choices: [
          "How a policy affected his business",
          "Why every member of Parliament voted as they did",
          "What every colonist believed",
          "What happened in other colonies",
        ],
        answer: 0,
        explain:
          "A source is reliable for questions its maker could answer firsthand. A merchant knows his own business.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "Two sources with different perspectives both say that colonists boycotted British goods. What does that suggest?",
        choices: [
          "The claim is corroborated and more likely to be accurate.",
          "Both sources are false.",
          "Boycotts happened only in one colony.",
          "Neither source is useful.",
        ],
        answer: 0,
        explain:
          "When independent sources with different perspectives agree on a fact, the fact is corroborated.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Use 'Because' to explain one effect of the Stamp Act on the colonies.",
        answer:
          "Because the Stamp Act taxed printed materials and was passed without colonial representation, colonists protested and boycotted British goods.",
        explain: "Look for a cause that comes before an effect and a connecting word.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show that you can name a cause and judge a source.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which event was a trigger for open war in 1775?",
        choices: [
          "The battles at Lexington and Concord",
          "The Treaty of Paris",
          "The Sugar Act",
          "The Stamp Act repeal",
        ],
        answer: 0,
        explain: "The fighting at Lexington and Concord set off open war after years of disputes.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write one sentence that sources a document: say who made it, for whom or why, and one thing it cannot show.",
        answer:
          "The merchant wrote the letter to his business partner to describe his losses, so it cannot show why Parliament made its decision.",
        explain: "A complete answer names the maker, the audience or purpose, and a limit.",
      },
      {
        id: "e3",
        type: "choice",
        prompt: "Why is a primary source not automatically the whole truth?",
        choices: [
          "Its maker had a perspective and a limited view of events.",
          "Primary sources are always forged.",
          "Only secondary sources can be accurate.",
          "Old documents do not contain facts.",
        ],
        answer: 0,
        explain:
          "A primary source is valuable because it was made at the time, but its maker saw only part of events and from one position.",
      },
    ],
    successCriteria: [
      "I distinguished an underlying cause from a trigger.",
      "I named the maker, audience or purpose of a source.",
      "I named a limit of the source.",
    ],
  },
  answerKey: {
    notes:
      "For short responses look for causes that come before effects, accurate details about the measures (Sugar Act 1764, Stamp Act 1765, Townshend Acts 1767) and a sourcing statement that names a maker, an audience or purpose, and a limit. Accept any accurate wording. Mark the quality of the sourcing, not whether the student sides with the colonists or with Parliament.",
    items: {
      g1: "Primary. It was created at the time by someone who lived through the event.",
      g2: "It probably stresses reasons for Parliament and may leave out colonial complaints.",
      g3: "A long disagreement over who had the right to tax the colonies.",
      g4: "Sample: Each has a perspective shaped by their situation, so using both shows what each saw and left out and lets the historian corroborate facts both agree on.",
      i1: "A modern chapter that summarizes what historians know about the Stamp Act.",
      i2: "Who made it, when, for whom and why?",
      i3: "Ask who made it, for whom and why, and what it might leave out.",
      i4: "Colonial boycotts of British goods contributed to Parliament's repeal of the Stamp Act in 1766.",
      i5: "Sugar Act, Stamp Act, Townshend Acts.",
      i6: "Sample: An underlying cause builds over years, such as the disagreement over who could tax the colonies. A trigger is a specific event, such as the fighting at Lexington and Concord.",
      i7: "Sample: Each person's perspective is shaped by their situation, so a merchant and a supporter of Parliament would stress different facts even if neither lied.",
      f1: "How a policy affected his business.",
      f2: "The claim is corroborated and more likely to be accurate.",
      f3: "Sample: Because the Stamp Act taxed printed materials and was passed without colonial representation, colonists protested and boycotted British goods.",
      e1: "The battles at Lexington and Concord.",
      e2: "Sample: The merchant wrote the letter to his business partner to describe his losses, so it cannot show why Parliament made its decision.",
      e3: "Its maker had a perspective and a limited view of events.",
    },
  },
  extension: {
    title: "Whose voice is missing?",
    task: "Choose one source from this lesson and list whose perspectives it includes and whose it leaves out. Write two sentences explaining how adding a source from a missing perspective, such as an enslaved person, a woman or a member of a Native nation, could change what a historian concludes about the causes of the Revolution. State what kind of source you would look for and what you would ask of it.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo explicar varias causas de la Revolución de los Estados Unidos y juzgar lo que una fuente puede y no puede mostrar.",
      vocab: [
        { en: "source", es: "fuente", verified: false },
        { en: "perspective", es: "perspectiva", verified: false },
        { en: "cause", es: "causa", verified: false },
        { en: "effect", es: "efecto", verified: false },
        { en: "tax", es: "impuesto", verified: false },
      ],
      familyPrompt:
        "Elijan una noticia o una carta antigua en casa. Pregúntense quién la escribió, para quién y por qué, y qué cosas podría no decir.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 6 minutes. Teach and guided practice 17. Partner task or activities 22 (the timeline activity first, then the sourcing detective; the argument builder works well on a second day). Exit ticket 7. Closing share 3. If time is short, run the sourcing detective and move the other two activities to a second session.",
    misconceptions: [
      "Old equals primary: students call any old text a primary source. Ask whether the maker lived through the event.",
      "Primary equals true: students treat a primary source as the whole truth. Ask what the maker could not know and what they chose to leave out.",
      "One cause: students look for a single cause. Have them sort causes into underlying causes and triggers and say which mattered more and why.",
      "Order equals cause: students assume that an earlier event caused a later one. Ask for the link, not just the sequence.",
      "Tax objection only: students say colonists objected to taxes in general. Use the sources to show that who made the decision mattered as much as how much was owed.",
    ],
    differentiation:
      "Entering and Emerging learners use the sourcing chart, frames, word banks and oral rehearsal and work with the same excerpts and the same tasks as every other tier. Expanding and Bridging learners compare excerpts with opposing perspectives and write the 'shows but cannot show' judgment. Do not shorten the sources or change the tasks; reduce only the language load.",
    languageNotes:
      "Teach the pairs colony, colonist and colonial together with a three-word web. Point out that 'representation' here means having a voice in government, not a picture. Read primary-source sentences aloud in chunks and have students paraphrase each chunk before they judge it.",
    sensitivity:
      "The sources in this lesson are imagined and speak mainly for free men who could argue in public. Name that limit with students and point to the extension task. The Revolution had very different meanings for enslaved people, women and Native nations, and a fair treatment of causes includes noting whose voices are missing.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
