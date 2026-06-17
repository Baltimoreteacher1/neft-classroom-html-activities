/* nonfiction.js — Module 2 content: Nonfiction & Rhetoric.
   Public-domain speeches/essays. Sets window.ENG.nonfiction and window.ENG.rhetoric. */
window.ENG = window.ENG || {};

window.ENG.nonfiction = {
  title: "Nonfiction & Rhetoric",
  icon: "🏛️",
  intro:
    "Analyze how writers and speakers persuade. You will identify claims, evidence, and the rhetorical appeals — ethos, pathos, and logos — that move an audience.",
  passages: [
    {
      id: "nf-1",
      title: "Excerpt: Speech to the Virginia Convention",
      source: "Patrick Henry (1775)",
      genre: "Speech / Argument",
      focus: "Rhetorical appeals & persuasive purpose",
      minutes: 16,
      text:
        "<p>Mr. President, it is natural to man to indulge in the illusions of hope. We are apt to shut our eyes against a painful truth, and listen to the song of that <mark title='enchantress; tempting voice'>siren</mark> till she transforms us into beasts. Is this the part of wise men, engaged in a great and arduous struggle for liberty? Are we disposed to be of the number of those who, having eyes, see not, and having ears, hear not, the things which so nearly concern their temporal salvation?</p>" +
        "<p>I have but one lamp by which my feet are guided, and that is the lamp of experience. I know of no way of judging of the future but by the past. And judging by the past, I wish to know what there has been in the conduct of the British ministry for the last ten years to justify those hopes with which gentlemen have been pleased to solace themselves and the House?</p>" +
        "<p>They tell us, sir, that we are weak; unable to cope with so formidable an adversary. But when shall we be stronger? Will it be the next week, or the next year? Sir, we are not weak, if we make a proper use of those means which the God of nature hath placed in our power. Three millions of people, armed in the holy cause of liberty, are <mark title='unbeatable'>invincible</mark> by any force which our enemy can send against us.</p>" +
        "<p>It is in vain, sir, to extenuate the matter. Gentlemen may cry, Peace, Peace — but there is no peace. Why stand we here idle? Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery? Forbid it, Almighty God! I know not what course others may take; but as for me, give me liberty, or give me death!</p>",
      questions: [
        {
          stem: "Henry's repeated rhetorical questions ('When shall we be stronger? Will it be the next week, or the next year?') are designed mainly to:",
          options: [
            { key: "A", text: "request factual information from the audience" },
            {
              key: "B",
              text: "push the audience toward his conclusion that they must act now",
            },
            { key: "C", text: "show that he is uncertain about what to do" },
            { key: "D", text: "change the subject away from war" },
          ],
          answer: "B",
          rationale:
            "Rhetorical questions do not seek answers; they steer listeners to the speaker's intended conclusion — here, that delay only weakens them and they must act immediately.",
        },
        {
          stem: "The phrase 'armed in the holy cause of liberty, are invincible' relies most heavily on which appeal?",
          options: [
            { key: "A", text: "Logos (logic and statistics)" },
            { key: "B", text: "Pathos (emotion and shared ideals)" },
            { key: "C", text: "Ethos (the speaker's credentials)" },
            { key: "D", text: "Understatement" },
          ],
          answer: "B",
          rationale:
            "Calling the cause 'holy' and the people 'invincible' stirs pride, faith, and passion — an emotional (pathos) appeal rather than data or credentials.",
        },
        {
          stem: "When Henry says, 'I have but one lamp by which my feet are guided, and that is the lamp of experience,' he is using:",
          options: [
            {
              key: "A",
              text: "a metaphor that frames past experience as a guiding light",
            },
            {
              key: "B",
              text: "a literal description of how he reads at night",
            },
            { key: "C", text: "hyperbole about his eyesight" },
            { key: "D", text: "an allusion to a specific battle" },
          ],
          answer: "A",
          rationale:
            "The 'lamp of experience' is a metaphor: experience is compared to a lamp that lights his path, supporting his logos-based argument to judge the future by the past.",
        },
        {
          stem: "The central claim of the speech is that the colonists should:",
          options: [
            { key: "A", text: "continue hoping for peace with Britain" },
            {
              key: "B",
              text: "prepare to fight for liberty now rather than wait",
            },
            { key: "C", text: "surrender because they are too weak" },
            { key: "D", text: "ignore the lessons of the past" },
          ],
          answer: "B",
          rationale:
            "Henry argues that hope and delay are illusions and that the colonists, strong in a just cause, must act — culminating in 'give me liberty, or give me death!'",
        },
        {
          stem: "The famous closing, 'give me liberty, or give me death!', is effective largely because it:",
          options: [
            { key: "A", text: "offers a calm, balanced compromise" },
            {
              key: "B",
              text: "presents a stark either/or choice that intensifies emotion",
            },
            { key: "C", text: "provides detailed military statistics" },
            { key: "D", text: "quotes a British official" },
          ],
          answer: "B",
          rationale:
            "The antithesis reduces the situation to two extremes (liberty or death), heightening emotional force and making compromise seem impossible.",
        },
      ],
    },
    {
      id: "nf-2",
      title: "Excerpt: What to the Slave Is the Fourth of July?",
      source: "Frederick Douglass (1852)",
      genre: "Speech / Argument",
      focus: "Purpose, audience & rhetorical contrast",
      minutes: 18,
      text:
        "<p>Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here to-day? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us?</p>" +
        "<p>I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity, and independence, bequeathed by your fathers, is shared by you, not by me.</p>" +
        "<p>What, to the American slave, is your Fourth of July? I answer: a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a <mark title='false show; pretense'>sham</mark>; your boasted liberty, an unholy license; your national greatness, swelling vanity.</p>" +
        "<p>Standing with God and the crushed and bleeding slave on this occasion, I will, in the name of humanity which is outraged, in the name of liberty which is fettered, dare to call in question and to denounce, with all the emphasis I can command, everything that serves to perpetuate slavery.</p>",
      questions: [
        {
          stem: "Douglass's repeated shift between 'you' and 'me/us' is a deliberate strategy that mainly:",
          options: [
            { key: "A", text: "confuses the audience about who is speaking" },
            {
              key: "B",
              text: "dramatizes the gap between free citizens and the enslaved",
            },
            { key: "C", text: "shows that he agrees with the celebration" },
            {
              key: "D",
              text: "proves that the holiday belongs to everyone equally",
            },
          ],
          answer: "B",
          rationale:
            "The 'your/your' versus 'me/us' contrast exposes the 'immeasurable distance' between those who enjoy liberty and those denied it — the heart of his argument.",
        },
        {
          stem: "By opening with questions ('why am I called upon to speak here to-day?'), Douglass primarily:",
          options: [
            {
              key: "A",
              text: "signals that he does not understand the holiday",
            },
            {
              key: "B",
              text: "challenges the audience and exposes a contradiction in the celebration",
            },
            { key: "C", text: "asks for directions to the event" },
            { key: "D", text: "praises the Declaration without reservation" },
          ],
          answer: "B",
          rationale:
            "The questions are rhetorical: they force the audience to confront the contradiction of celebrating freedom while millions remain enslaved.",
        },
        {
          stem: "Calling the celebration a 'sham' and the boasted liberty 'an unholy license' is an example of:",
          options: [
            { key: "A", text: "understatement that softens his criticism" },
            {
              key: "B",
              text: "charged diction that conveys outrage and condemnation",
            },
            { key: "C", text: "neutral, objective reporting" },
            { key: "D", text: "praise for the nation's founders" },
          ],
          answer: "B",
          rationale:
            "Loaded words like 'sham,' 'unholy,' and 'swelling vanity' carry strong negative connotations, expressing moral outrage (pathos).",
        },
        {
          stem: "Douglass's overall purpose in the passage is to:",
          options: [
            {
              key: "A",
              text: "celebrate the Fourth of July with his audience",
            },
            {
              key: "B",
              text: "expose the hypocrisy of celebrating freedom while slavery exists",
            },
            { key: "C", text: "give a neutral history of the Declaration" },
            {
              key: "D",
              text: "argue that the holiday should be moved to a new date",
            },
          ],
          answer: "B",
          rationale:
            "He condemns 'everything that serves to perpetuate slavery,' using the holiday to reveal the nation's hypocrisy — his central persuasive purpose.",
        },
        {
          stem: "The phrase 'liberty which is fettered' is striking because it:",
          options: [
            {
              key: "A",
              text: "uses a paradox — liberty bound in chains — to underscore injustice",
            },
            { key: "B", text: "literally describes a prison" },
            { key: "C", text: "compliments the audience's freedom" },
            { key: "D", text: "is an example of alliteration only" },
          ],
          answer: "A",
          rationale:
            "Pairing 'liberty' with 'fettered' (chained) is a paradox: freedom itself is shown in bondage, sharpening the contradiction Douglass attacks.",
        },
      ],
    },
    {
      id: "nf-3",
      title: "Excerpt: The Gettysburg Address",
      source: "Abraham Lincoln (1863)",
      genre: "Speech / Argument",
      focus: "Structure, allusion & rhetorical economy",
      minutes: 14,
      text:
        "<p>Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.</p>" +
        "<p>Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.</p>" +
        "<p>But, in a larger sense, we can not dedicate — we can not <mark title='make holy'>consecrate</mark> — we can not hallow — this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract.</p>" +
        "<p>It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. That this nation, under God, shall have a new birth of freedom — and that government of the people, by the people, for the people, shall not perish from the earth.</p>",
      questions: [
        {
          stem: "The repetition in 'we can not dedicate — we can not consecrate — we can not hallow' is an example of:",
          options: [
            { key: "A", text: "anaphora, which builds rhythm and emphasis" },
            { key: "B", text: "a simile comparing three actions" },
            { key: "C", text: "an unrelated list of synonyms" },
            { key: "D", text: "hyperbole about the size of the field" },
          ],
          answer: "A",
          rationale:
            "Repeating 'we can not' at the start of successive clauses is anaphora, which creates rhythm and drives home Lincoln's humility before the soldiers' sacrifice.",
        },
        {
          stem: "The phrase 'Four score and seven years ago' instead of 'eighty-seven years ago' mainly serves to:",
          options: [
            { key: "A", text: "confuse the audience about the date" },
            {
              key: "B",
              text: "give the opening an elevated, almost biblical solemnity",
            },
            { key: "C", text: "provide an exact scientific measurement" },
            { key: "D", text: "lighten the mood with humor" },
          ],
          answer: "B",
          rationale:
            "The archaic, formal phrasing echoes biblical language, lending the address a solemn, dignified tone appropriate to the occasion.",
        },
        {
          stem: "Lincoln structures the speech around a movement from:",
          options: [
            { key: "A", text: "the present battle to ancient history only" },
            {
              key: "B",
              text: "the past founding, to the present war, to a future duty",
            },
            { key: "C", text: "a personal story to a list of statistics" },
            { key: "D", text: "a joke to a warning" },
          ],
          answer: "B",
          rationale:
            "The address moves from the nation's founding ('Four score...'), to the present 'civil war,' to the living's future task — a clear past-present-future structure.",
        },
        {
          stem: "The closing phrase 'government of the people, by the people, for the people' is memorable largely because it uses:",
          options: [
            {
              key: "A",
              text: "parallel structure with repeated grammatical form",
            },
            { key: "B", text: "an extended metaphor about farming" },
            { key: "C", text: "a rhetorical question" },
            { key: "D", text: "understatement" },
          ],
          answer: "A",
          rationale:
            "The three parallel prepositional phrases ('of...by...for...the people') create balanced, memorable parallelism that defines democratic government.",
        },
        {
          stem: "Lincoln's central claim is that the living must:",
          options: [
            { key: "A", text: "abandon the war effort" },
            {
              key: "B",
              text: "dedicate themselves to finishing the soldiers' 'unfinished work'",
            },
            { key: "C", text: "build a monument as quickly as possible" },
            { key: "D", text: "forget the soldiers who died" },
          ],
          answer: "B",
          rationale:
            "Lincoln redirects the dedication from the ground to the living, urging them to advance the 'unfinished work' so the nation has 'a new birth of freedom.'",
        },
      ],
    },
  ],
};

window.ENG.rhetoric = [
  {
    quote:
      "As a doctor with thirty years of experience, I can tell you this treatment is safe.",
    appeal: "ethos",
    why: "Relies on the speaker's credentials and authority.",
  },
  {
    quote: "Imagine your own child going to bed hungry tonight.",
    appeal: "pathos",
    why: "Targets the audience's emotions — fear and compassion.",
  },
  {
    quote:
      "Studies show that students who sleep eight hours score 15% higher on tests.",
    appeal: "logos",
    why: "Uses data and statistics to make a logical case.",
  },
  {
    quote: "Trust me — I've coached championship teams for two decades.",
    appeal: "ethos",
    why: "Builds credibility from the speaker's track record.",
  },
  {
    quote:
      "If we cut down this forest, the animals will have nowhere left to call home.",
    appeal: "pathos",
    why: "Stirs sympathy and emotional concern.",
  },
  {
    quote:
      "Since all mammals are warm-blooded, and a whale is a mammal, a whale is warm-blooded.",
    appeal: "logos",
    why: "A logical deduction (syllogism).",
  },
  {
    quote: "Our company has earned the community's trust for over fifty years.",
    appeal: "ethos",
    why: "Appeals to reputation and character.",
  },
  {
    quote: "Don't let your family suffer the heartbreak we did.",
    appeal: "pathos",
    why: "Uses grief and fear to persuade.",
  },
  {
    quote: "The data is clear: crime fell by 22% after the program began.",
    appeal: "logos",
    why: "Cites measurable evidence.",
  },
  {
    quote: "As a lifelong member of this community, I share your values.",
    appeal: "ethos",
    why: "Establishes shared identity and credibility.",
  },
  {
    quote: "Picture the joy on a veteran's face when they finally come home.",
    appeal: "pathos",
    why: "Evokes warm, hopeful emotion.",
  },
  {
    quote:
      "Three independent reports reached the same conclusion, so the plan is sound.",
    appeal: "logos",
    why: "Reasons from converging evidence.",
  },
];
