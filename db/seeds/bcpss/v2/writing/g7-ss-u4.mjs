// BCPSS Writing Lab (TWR) — g7-ss-u4 · Global Civic Challenges & Environmental Stewardship. Contract: ../writing-schema.mjs

export default {
  title: "Protect the Water We Share",
  genre: "argue",
  tip: "Have students name their claim and then underline the one number or fact in their notes that proves it before they draft.",
  lessons: [
    { id: "A", title: "Freshwater scarcity around the world" },
    { id: "B", title: "Watersheds and the Chesapeake Bay" },
    { id: "C", title: "Climate change and community resilience" },
    { id: "D", title: "Cooperation and civic solutions" },
  ],
  source: {
    title: "Stewards of the Bay",
    lesson: "B",
    text: "Only about three percent of Earth's water is fresh, so communities must protect it. The Chesapeake Bay watershed covers parts of six states and Washington, D.C., so rain that falls in Pennsylvania can reach the Bay. Runoff carries fertilizer into streams, and the extra nutrients harm the water. According to the Chesapeake Bay Program, planting trees beside streams helps because tree roots hold soil and filter runoff. Oyster reefs help too, since one adult oyster can filter dozens of gallons of water a day. Because the Bay crosses state lines, cooperation among states is also needed. In 2018, Cape Town cut its water use by more than half and avoided Day Zero.",
  },
  notes: [
    { sentence: "Only about three percent of Earth's water is fresh, so communities must protect it.", note: "only ~3% fresh water → protect it" },
    { sentence: "The Chesapeake Bay watershed covers parts of six states and Washington, D.C., so rain that falls in Pennsylvania can reach the Bay.", note: "watershed = 6 states + DC; PA rain → Bay" },
    { sentence: "According to the Chesapeake Bay Program, planting trees beside streams helps because tree roots hold soil and filter runoff.", note: "trees by streams: roots hold soil, filter runoff" },
    { sentence: "Oyster reefs help too, since one adult oyster can filter dozens of gallons of water a day.", note: "oysters filter dozens of gallons/day" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Communities must use fresh water carefully",
      because: "only about three percent of Earth's water is fresh.",
      but: "most of that fresh water is frozen in glaciers.",
      so: "only a small share is left in rivers, lakes, and underground.",
    },
    {
      lesson: "B",
      kernel: "Planting trees beside streams protects the Bay",
      because: "tree roots hold soil and filter runoff.",
      but: "trees cannot solve the problem alone.",
      so: "states also need other stewardship actions.",
    },
    {
      lesson: "D",
      kernel: "Six states and Washington, D.C. must cooperate",
      because: "the Bay's watershed crosses state lines.",
      but: "each state has its own budget and rules.",
      so: "they sign agreements to share the work.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Cape Town saved water.",
      parts: { when: "during the drought of 2018", how: "by limiting each person to about 50 liters a day", why: "to avoid Day Zero" },
      model: "During the drought of 2018, Cape Town saved water by limiting each person to about 50 liters a day to avoid Day Zero.",
    },
    {
      lesson: "B",
      kernel: "Volunteers planted trees.",
      parts: { when: "last spring", where: "beside a Baltimore stream", why: "to filter runoff" },
      model: "Last spring, volunteers planted trees beside a Baltimore stream to filter runoff.",
    },
  ],
  fragments: [
    { text: "A watershed is an area where all the water drains to the same place.", is_sentence: true },
    { text: "Because tree roots hold soil in place.", is_sentence: false, fix: "Trees protect streams because tree roots hold soil in place." },
    { text: "Filters dozens of gallons of water each day.", is_sentence: false, fix: "One adult oyster filters dozens of gallons of water each day." },
    { text: "Cooperation helps states protect shared water.", is_sentence: true },
    { text: "According to the city reports.", is_sentence: false, fix: "According to the city reports, residents cut their water use by more than half." },
    { text: "Climate change can cause droughts and heavy storms.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Scarcity, ___, is a growing problem for communities that depend on one river.",
      noun: "Scarcity",
      options: ["a shortage of something people need", "the ability to recover quickly from hard times", "a formal written agreement between countries"],
      answer: 0,
      model: "Scarcity, a shortage of something people need, is a growing problem for communities that depend on one river.",
    },
    {
      lesson: "B",
      sentence: "Stewardship, ___, protects rivers and bays that many people share.",
      noun: "Stewardship",
      options: ["actions that make a problem less harmful", "taking responsible care of something shared", "an agreement between countries"],
      answer: 1,
      model: "Stewardship, taking responsible care of something shared, protects rivers and bays that many people share.",
    },
    {
      lesson: "C",
      sentence: "Resilience, ___, helps a city recover after a flood or a drought.",
      noun: "Resilience",
      options: ["actions that make a problem less harmful", "an area where rain drains to one river", "the ability to prepare for hard times and recover"],
      answer: 2,
      model: "Resilience, the ability to prepare for hard times and recover, helps a city recover after a flood or a drought.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "the states must cooperate", model: "Because the watershed crosses state lines, the states must cooperate." },
    { lesson: "A", conjunction: "since", stem: "communities must use fresh water carefully", model: "Since only three percent of Earth's water is fresh, communities must use it carefully." },
    { lesson: "C", conjunction: "after", stem: "Cape Town avoided Day Zero", model: "After residents cut their water use by more than half, Cape Town avoided Day Zero." },
  ],
  spo: {
    topic: {
      l1_2: "My claim is that [planting trees] protects the [Bay] because [roots filter runoff].",
      l3_4: "My claim is that [planting trees beside streams] is a strong stewardship plan because [tree roots hold soil and filter runoff] before it reaches the Bay.",
      l5_6: "According to [the Chesapeake Bay Program], [planting trees beside streams] is a strong stewardship plan because [roots hold soil and filter runoff], and [cooperation among six states and D.C.] makes the effort work.",
    },
    starters: [
      { type: "question", text: "What is the smartest way to protect water that millions of people share?" },
      { type: "statement", text: "Small actions along a stream can protect a whole bay." },
      { type: "appositive", text: "The Chesapeake Bay, the largest estuary in the United States, depends on the streams that feed it." },
    ],
    details: [
      { note: "only 3% of Earth's water is fresh", lesson: "A" },
      { note: "watershed = 6 states + capital city", lesson: "B" },
      { note: "runoff carries fertilizer into streams", lesson: "B" },
      { note: "tree roots hold soil, filter runoff", lesson: "B" },
      { note: "oysters filter dozens of gallons/day", lesson: "B" },
      { note: "Cape Town cut use by over half", lesson: "C" },
    ],
    distractors: ["the Bay has many sailboats", "blue crabs are caught in summer"],
    conclusion: {
      l1_2: "So [trees] can [protect] our [water].",
      l3_4: "This shows that a [small action] like planting trees can [protect] a shared [watershed].",
      l5_6: "This shows that [small actions], done together by [many communities], can protect [shared water] even when [fresh water] is scarce.",
    },
  },
  prompt: {
    l1_2: "Draw a stream with trees and a bay. Write 3 sentences. Tell one way to protect water. Use the word because.",
    l3_4: "Write a paragraph that states a claim about one way to protect the Chesapeake Bay. Support it with evidence. Use because, according to, and for example.",
    l5_6: "Write a paragraph that claims which stewardship plan best protects the Chesapeake Bay and supports the claim with cited evidence. Include an appositive and a sentence that starts with because, since, or after.",
  },
  transitions: ["My claim is that", "According to", "As shown by", "For example,", "Because", "This shows that", "Therefore,", "In addition,"],
  model: {
    l1_2: "Planting trees by streams protects the Bay. Tree roots hold soil and filter runoff. So the water stays cleaner.",
    l3_4: "My claim is that planting trees beside streams is a strong stewardship plan because tree roots hold soil and filter runoff. According to the Chesapeake Bay Program, runoff carries fertilizer into streams. The trees catch some of it before it reaches the Bay. For example, a row of trees can keep soil from washing away. This shows that one small action can protect a shared watershed.",
    l5_6: "According to the Chesapeake Bay Program, planting trees beside streams is a strong stewardship plan because tree roots hold soil and filter runoff. The Chesapeake Bay, the largest estuary in the United States, receives water from six states and Washington, D.C. Since runoff carries fertilizer into streams, the extra nutrients harm the water. Trees catch some of this runoff before it reaches the Bay. Oyster reefs also help, because one adult oyster can filter dozens of gallons of water a day. Because the watershed crosses state lines, the states must cooperate. This shows that small actions, done together, can protect shared water.",
  },
  mpo: {
    thesis: "Planting trees beside streams is the strongest stewardship plan for the Chesapeake Bay because it filters runoff, and it works best when states cooperate.",
    paragraphs: [
      { topic: "Fresh water is scarce and the Bay's watershed is shared by many people.", notes: ["only 3% of water is fresh", "watershed = 6 states + DC", "runoff carries fertilizer"] },
      { topic: "Trees beside streams protect the water because their roots hold soil and filter runoff.", notes: ["roots hold soil", "filter runoff", "according to the Bay Program"] },
      { topic: "Other actions, such as oyster reefs and cooperation, make the plan stronger.", notes: ["oysters filter dozens of gallons/day", "states must cooperate", "Cape Town cut use by over half"] },
    ],
    conclusion: "Careful stewardship, backed by evidence and shared by many communities, can protect water that everyone needs.",
  },
  revise: [
    "Did I state a clear claim about one way to protect shared water?",
    "Did I support it with a fact or number, such as three percent or dozens of gallons a day?",
    "Did I use according to, because, or this shows that to connect my evidence to my claim?",
    "Did I explain why the solution fits a watershed that crosses state lines?",
  ],
};
