// BCPSS Writing Lab (TWR) — g8-ela-u4 · Teens as Change Agents. Contract: ../writing-schema.mjs

export default {
  title: "Teens Who Changed the Law",
  genre: "argue",
  tip: "Ask students to point to the exact sentence in the source that proves each claim before they write the because clause.",
  lessons: [
    { id: "A", title: "Claudette Colvin's arrest at fifteen" },
    { id: "B", title: "The Montgomery bus boycott" },
    { id: "C", title: "Browder v. Gayle and testimony in court" },
    { id: "D", title: "Student sit-ins and youth organizing" },
  ],
  source: {
    title: "Fifteen and Fearless",
    lesson: "A",
    text: "On March 2, 1955, fifteen-year-old Claudette Colvin refused to give up her bus seat in Montgomery, Alabama. Police arrested her. She later became one of four plaintiffs in a federal court case that challenged bus segregation. In court, she gave testimony about what happened on the bus. In December 1955, Black residents began a boycott of the city buses, and it lasted 381 days. Thousands walked or shared rides because they wanted fair treatment. In 1956, the courts ruled that bus segregation was illegal. Young people kept organizing. In February 1960, college students in Greensboro, North Carolina, began sit-ins at a lunch counter.",
  },
  notes: [
    { sentence: "On March 2, 1955, fifteen-year-old Claudette Colvin refused to give up her bus seat in Montgomery, Alabama.", note: "3/2/55 Colvin, age 15, keeps seat" },
    { sentence: "She later became one of four plaintiffs in a federal court case that challenged bus segregation.", note: "Colvin = 1 of 4 plaintiffs, federal court" },
    { sentence: "In December 1955, Black residents began a boycott of the city buses, and it lasted 381 days.", note: "Dec 1955 boycott = 381 days" },
    { sentence: "In 1956, the courts ruled that bus segregation was illegal.", note: "1956 courts: bus segregation illegal" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Claudette Colvin refused to give up her seat",
      because: "she believed segregation was unfair.",
      but: "she was only fifteen and the police arrested her.",
      so: "her arrest showed Montgomery that a teenager would resist.",
    },
    {
      lesson: "B",
      kernel: "Thousands of people joined the bus boycott",
      because: "they wanted fair treatment on the buses.",
      but: "walking to work was long and tiring.",
      so: "the city buses lost riders for 381 days.",
    },
    {
      lesson: "D",
      kernel: "College students started the Greensboro sit-ins",
      because: "they were tired of being refused service at the lunch counter.",
      but: "they could have stayed quiet and safe at school.",
      so: "the protest spread to other cities.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Claudette Colvin testified.",
      parts: { when: "in federal court", how: "calmly and clearly", why: "so the judges would hear what happened on the bus" },
      model: "In federal court, Claudette Colvin testified calmly and clearly so the judges would hear what happened on the bus.",
    },
    {
      lesson: "D",
      kernel: "Students sat down.",
      parts: { when: "in February 1960", where: "at a lunch counter", why: "to protest segregation" },
      model: "In February 1960, four college students sat down at a lunch counter to protest segregation.",
    },
  ],
  fragments: [
    { text: "Claudette Colvin was fifteen years old.", is_sentence: true },
    { text: "Because Black residents refused to ride the buses.", is_sentence: false, fix: "The bus company lost money because Black residents refused to ride the buses." },
    { text: "The boycott lasted 381 days.", is_sentence: true },
    { text: "Gave testimony in federal court.", is_sentence: false, fix: "Claudette Colvin gave testimony in federal court." },
    { text: "Which means that young people can change laws.", is_sentence: false, fix: "Her case helped end bus segregation, which means that young people can change laws." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Claudette Colvin, ___, refused to give up her seat.",
      noun: "Claudette Colvin",
      options: ["a federal judge in Alabama", "a fifteen-year-old student in Montgomery", "a leader of the Greensboro sit-ins"],
      answer: 1,
      model: "Claudette Colvin, a fifteen-year-old student in Montgomery, refused to give up her seat.",
    },
    {
      lesson: "B",
      sentence: "A boycott, ___, can put pressure on a business.",
      noun: "boycott",
      options: ["a refusal to buy or use something as a protest", "a person who brings a case to court", "a spoken statement given in court"],
      answer: 0,
      model: "A boycott, a refusal to buy or use something as a protest, can put pressure on a business.",
    },
    {
      lesson: "C",
      sentence: "Browder v. Gayle, ___, ended bus segregation in Montgomery.",
      noun: "Browder v. Gayle",
      options: ["a march for voting rights", "a lunch counter protest in Greensboro", "a federal court case with four plaintiffs"],
      answer: 2,
      model: "Browder v. Gayle, a federal court case with four plaintiffs, ended bus segregation in Montgomery.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "after", stem: "Montgomery's buses were desegregated", model: "After the courts ruled against segregation, Montgomery's buses were desegregated." },
    { lesson: "A", conjunction: "because", stem: "Montgomery's Black community saw that a teenager would resist", model: "Because Claudette Colvin refused to move, Montgomery's Black community saw that a teenager would resist." },
    { lesson: "D", conjunction: "when", stem: "protests spread across the South", model: "When college students sat at the Greensboro lunch counter, protests spread across the South." },
  ],
  spo: {
    topic: {
      l1_2: "Teenagers [changed] the law by acting with [courage].",
      l3_4: "Teenagers were decisive in the Civil Rights Movement because [Claudette Colvin's arrest and testimony] and [student sit-ins] changed [laws and minds].",
      l5_6: "According to historians, teenagers were [the spark of the movement], as shown by [Claudette Colvin's testimony and the Greensboro sit-ins].",
    },
    starters: [
      { type: "question", text: "Can a fifteen-year-old change the law of a country?" },
      { type: "appositive", text: "Claudette Colvin, a teenager from Montgomery, helped overturn bus segregation." },
      { type: "subordinate", text: "Although she was only fifteen, Claudette Colvin took a stand that mattered." },
    ],
    details: [
      { note: "3/2/55 Colvin arrested at age 15", lesson: "A" },
      { note: "Colvin = plaintiff + witness in court", lesson: "C" },
      { note: "Dec 1955 boycott lasted 381 days", lesson: "B" },
      { note: "1956 ruling ends bus segregation", lesson: "C" },
      { note: "Feb 1960 students start Greensboro sit-ins", lesson: "D" },
      { note: "sit-ins spread to other cities", lesson: "D" },
    ],
    distractors: ["Montgomery is the capital of Alabama", "Alabama became a state in 1819"],
    conclusion: {
      l1_2: "Young people can [change] laws with [courage].",
      l3_4: "This proves that [teenagers] helped lead the movement because [their actions changed laws].",
      l5_6: "Because teenagers acted with courage and [organized others], they [pushed the movement forward].",
    },
  },
  prompt: {
    l1_2: "Look at the Montgomery bus picture. Write 3-4 sentences. Say if teenagers helped change the law. Use one fact.",
    l3_4: "Write a paragraph that claims teenagers were decisive in the Civil Rights Movement. Support your claim with two facts and explain how they prove it. Use according to and because.",
    l5_6: "Write a paragraph that claims teenagers were decisive in the Civil Rights Movement and supports the claim with cited evidence from at least two lessons. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["According to", "For example,", "As shown by", "Because", "This shows that", "Therefore,", "In addition,", "In conclusion,"],
  model: {
    l1_2: "Teenagers changed the law. Claudette Colvin was fifteen when she kept her seat. She told the court the truth. Her courage helped end bus segregation.",
    l3_4: "Teenagers were decisive in the Civil Rights Movement because their courage changed laws. According to historians, Claudette Colvin was arrested at age 15 for keeping her seat. She later testified in federal court as one of four plaintiffs. As a result, the courts ruled that bus segregation was illegal. Students in Greensboro also showed that young people could organize. This proves that teenagers helped lead the movement.",
    l5_6: "According to historians, teenagers were the spark of the movement, as shown by Claudette Colvin's testimony and the Greensboro sit-ins. Claudette Colvin, a fifteen-year-old from Montgomery, was arrested on March 2, 1955, for keeping her bus seat. Although she was young, she became one of four plaintiffs in a federal case against bus segregation. Her testimony helped lead the courts to rule in 1956 that segregated buses were illegal. In February 1960, college students began sit-ins at a Greensboro lunch counter, and the protests spread to other cities. These events show that young people could organize, speak in court, and change public opinion. Because teenagers acted with courage and organized others, they pushed the movement forward.",
  },
  mpo: {
    thesis: "Teenagers were decisive in the Civil Rights Movement because they used courage, testimony, and organizing to change laws and minds.",
    paragraphs: [
      { topic: "Claudette Colvin's arrest and testimony helped overturn bus segregation.", notes: ["3/2/55 arrest, age 15", "plaintiff in federal court", "1956 ruling: segregation illegal"] },
      { topic: "The Montgomery bus boycott showed how a community can organize.", notes: ["Dec 1955 boycott, 381 days", "walk + carpool", "buses lose riders"] },
      { topic: "College students carried the movement forward with sit-ins.", notes: ["Feb 1960 Greensboro", "lunch counter protest", "spread to other cities"] },
    ],
    conclusion: "The evidence shows that young people were not only helpers but leaders, and their courage reminds us that change can start with one person who refuses to give up a seat.",
  },
  revise: [
    "Did I state a clear claim about teenagers in the first sentence?",
    "Did I cite a source with according to or as shown by?",
    "Did I use a date, a name, or a number as evidence?",
    "Did I explain how each fact proves my claim instead of just listing it?",
  ],
};
