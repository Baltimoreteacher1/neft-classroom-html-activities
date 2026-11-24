// BCPSS Writing Lab (TWR) — g7-ss-u3 · Global Resources, Trade & Economic Systems. Contract: ../writing-schema.mjs

export default {
  title: "Answer the Trade Critics",
  genre: "argue",
  tip: "Have students say the critic's best point in their own words, then name the one fact that answers it before they write the paragraph.",
  lessons: [
    { id: "A", title: "Why natural resources are not spread evenly" },
    { id: "B", title: "Imports, exports, and interdependence" },
    { id: "C", title: "Tariffs and trade debates" },
    { id: "D", title: "Sustainability and economic systems" },
  ],
  source: {
    title: "Should We Only Buy Local?",
    lesson: "B",
    text: "Some people say that a country should never import what it can make at home. Although this idea protects some workers, natural resources are not spread evenly, so no country has everything. Japan has very little oil, so it buys oil from countries such as Saudi Arabia. Every day, the Port of Baltimore receives cars from Japan and Germany, and it sends out Maryland coal and farm equipment. Thousands of workers in Baltimore have jobs moving these goods. However, a tariff on imports raises prices for families. Trade also has costs, such as pollution, so countries must plan for sustainability.",
  },
  notes: [
    { sentence: "Japan has very little oil, so it buys oil from countries such as Saudi Arabia.", note: "Japan: little oil → imports from Saudi Arabia" },
    { sentence: "Every day, the Port of Baltimore receives cars from Japan and Germany, and it sends out Maryland coal and farm equipment.", note: "Baltimore port: imports cars; exports coal + equipment" },
    { sentence: "Thousands of workers in Baltimore have jobs moving these goods.", note: "thousands of Baltimore jobs = moving goods" },
    { sentence: "However, a tariff on imports raises prices for families.", note: "tariff → higher prices for families" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "No country has every natural resource",
      because: "resources like oil and lithium are not spread evenly.",
      but: "every country has something it can trade.",
      so: "countries buy and sell goods with each other.",
    },
    {
      lesson: "B",
      kernel: "The Port of Baltimore brings in cars from Japan",
      because: "Maryland buyers want those cars.",
      but: "some critics say imports hurt workers at home.",
      so: "thousands of port workers unload and move the cars.",
    },
    {
      lesson: "C",
      kernel: "A tariff makes imported goods cost more",
      because: "the government adds a tax when goods cross the border.",
      but: "the tax can protect factories at home.",
      so: "families may pay higher prices at the store.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Ships carried goods.",
      parts: { when: "every day", where: "through the Port of Baltimore", why: "so countries could trade" },
      model: "Every day, ships carried goods through the Port of Baltimore so countries could trade.",
    },
    {
      lesson: "D",
      kernel: "Countries protect resources.",
      parts: { when: "today", how: "with careful rules", why: "so there is enough for the future" },
      model: "Today, countries protect resources with careful rules so there is enough for the future.",
    },
  ],
  fragments: [
    { text: "A tariff is a tax on goods that come in from another country.", is_sentence: true },
    { text: "Although some people argue that imports hurt workers.", is_sentence: false, fix: "Although some people argue that imports hurt workers, the port supports thousands of jobs." },
    { text: "Because Japan has very little oil.", is_sentence: false, fix: "Japan imports oil because it has very little." },
    { text: "Countries rely on each other through trade.", is_sentence: true },
    { text: "Exports coal and farm equipment.", is_sentence: false, fix: "The Port of Baltimore exports coal and farm equipment." },
    { text: "However, tariffs can raise prices for families.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Lithium, ___, is found in large deposits in Chile.",
      noun: "Lithium",
      options: ["a metal used to make batteries", "a tax on goods from another country", "a way a country decides what to make"],
      answer: 0,
      model: "Lithium, a metal used to make batteries, is found in large deposits in Chile.",
    },
    {
      lesson: "B",
      sentence: "Interdependence, ___, links Japan, Saudi Arabia, and Maryland.",
      noun: "Interdependence",
      options: ["a tax on imported goods", "a situation where countries rely on each other", "using resources without running out"],
      answer: 1,
      model: "Interdependence, a situation where countries rely on each other, links Japan, Saudi Arabia, and Maryland.",
    },
    {
      lesson: "C",
      sentence: "A tariff, ___, can raise the price of imported cars.",
      noun: "tariff",
      options: ["a good sent out to another country", "a number that measures a country's economy", "a tax on goods from another country"],
      answer: 2,
      model: "A tariff, a tax on goods from another country, can raise the price of imported cars.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "although", stem: "it raises prices for families", model: "Although a tariff can protect some jobs, it raises prices for families." },
    { lesson: "A", conjunction: "because", stem: "countries trade", model: "Because no country has every resource, countries trade." },
    { lesson: "B", conjunction: "even though", stem: "the Port of Baltimore supports thousands of jobs", model: "Even though critics say imports hurt workers, the Port of Baltimore supports thousands of jobs." },
  ],
  spo: {
    topic: {
      l1_2: "Some say [imports hurt workers], but [trade] also [creates jobs].",
      l3_4: "Although some people argue that [countries should never import], I believe [trade helps] because [no country has every resource].",
      l5_6: "Although critics argue that [imports take jobs from workers at home], [the Port of Baltimore] shows that [trade also supports thousands of jobs] and gives countries [resources they lack].",
    },
    starters: [
      { type: "question", text: "If a country can make something, should it ever buy it from another country?" },
      { type: "statement", text: "No country has every resource, so trade connects the whole world." },
      { type: "subordinate", text: "Although imports can hurt some workers, they also create jobs at ports." },
    ],
    details: [
      { note: "other side: imports take workers' jobs", lesson: "C" },
      { note: "Japan: little oil, imports from Saudi Arabia", lesson: "A" },
      { note: "Baltimore port: cars in, coal out", lesson: "B" },
      { note: "thousands of Baltimore jobs move goods", lesson: "B" },
      { note: "tariff → higher prices for families", lesson: "C" },
      { note: "sustainability: plan for future resources", lesson: "D" },
    ],
    distractors: ["ships are loaded by large cranes", "cars have four wheels"],
    conclusion: {
      l1_2: "So [trade] can [help] workers and families.",
      l3_4: "Therefore, trade is helpful because it gives countries [resources they lack] and creates [jobs].",
      l5_6: "Therefore, although trade has costs, [fair trade and careful planning] let countries share resources while protecting [workers and the environment].",
    },
  },
  prompt: {
    l1_2: "Draw the Port of Baltimore with a ship. Write 3 sentences. Tell if trade is good or bad. Use the word because.",
    l3_4: "A classmate says, \"A country should never import what it can make at home.\" Write a paragraph that answers this idea. Admit one point, then use evidence about resources or the Port of Baltimore.",
    l5_6: "Write a paragraph that answers the claim that a country should never import what it can make at home. Concede one point, pivot with however, and rebut with evidence about resources, the Port of Baltimore, and tariffs. Include an appositive and a sentence that starts with although or even though.",
  },
  transitions: ["Although", "Some argue that", "However,", "Yet", "For example,", "Even though", "This shows that", "Therefore,"],
  model: {
    l1_2: "Some say imports hurt workers. But trade also creates jobs at the Port of Baltimore. So trade can help workers.",
    l3_4: "Although some people argue that countries should never import what they can make, I believe trade helps because no country has every resource. For example, Japan has very little oil, so it buys oil from Saudi Arabia. The Port of Baltimore brings in cars and sends out coal and farm equipment. However, thousands of workers have jobs moving these goods. Therefore, trade can protect workers instead of hurting them.",
    l5_6: "Although critics argue that imports take jobs from workers at home, the Port of Baltimore shows that trade also supports thousands of jobs. Because natural resources are not spread evenly, no country has everything it needs. For example, Japan, a country with very little oil, buys oil from Saudi Arabia. Every day, the port receives cars from Japan and Germany and sends out Maryland coal and farm equipment. As shown by this exchange, interdependence gives countries resources they lack. A tariff, a tax on imports, may protect some factories. However, it also raises prices for families. Therefore, countries should trade fairly and plan for sustainability.",
  },
  mpo: {
    thesis: "Although critics say a country should never import what it can make, trade helps because resources are not shared evenly and ports like Baltimore's create jobs.",
    paragraphs: [
      { topic: "The critics make a fair point that imports can hurt some workers and that tariffs aim to protect them.", notes: ["imports can hurt some workers", "tariff = tax on imports", "protects some factories"] },
      { topic: "Resources are not spread evenly, so countries must trade to get what they lack.", notes: ["Japan: little oil", "Saudi Arabia: oil", "Chile: lithium", "interdependence"] },
      { topic: "The Port of Baltimore shows that trade also creates jobs and income.", notes: ["cars in, coal out", "thousands of jobs", "tariffs raise family prices"] },
    ],
    conclusion: "Trade has costs, but fair trade with careful planning for sustainability helps more people than it hurts.",
  },
  revise: [
    "Did I admit one fair point from the other side before I answered it?",
    "Did I pivot with however, yet, or although, and then give a rebuttal?",
    "Did I use evidence, such as Japan's oil, Chile's lithium, or the Port of Baltimore, instead of only opinion?",
    "Did I use a trade word, such as import, export, tariff, or interdependence, correctly?",
  ],
};
