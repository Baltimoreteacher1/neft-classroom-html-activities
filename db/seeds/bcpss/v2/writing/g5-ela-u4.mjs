// BCPSS Writing Lab (TWR) — g5-ela-u4 · Breaking Barriers. Contract: ../writing-schema.mjs

export default {
  title: "Breaking Baseball's Barrier",
  genre: "explain",
  tip: "Draw a chain of boxes on the board so students see each cause become the next effect before they write.",
  lessons: [
    { id: "A", title: "The Negro Leagues and segregation in baseball" },
    { id: "B", title: "Branch Rickey chooses Jackie Robinson" },
    { id: "C", title: "Opening Day 1947 and facing unfair treatment" },
    { id: "D", title: "Effects on teams and Robinson's legacy" },
  ],
  source: {
    title: "Baseball's Color Barrier",
    lesson: "A",
    text: "For many years, major league teams would not sign Black players. This unfair rule was called the color barrier. Because of it, Black players formed their own teams in the Negro Leagues. One of those teams, the Baltimore Elite Giants, played in Baltimore. In 1947, Jackie Robinson broke the color barrier when he played for the Brooklyn Dodgers. Because he played with courage, he earned respect from many fans. As a result, other teams began signing Black players, including Larry Doby, who joined the Cleveland Indians that same year. Today, Robinson's legacy lives on.",
  },
  notes: [
    { sentence: "Because of it, Black players formed their own teams in the Negro Leagues.", note: "barrier → Black players: Negro Leagues" },
    { sentence: "In 1947, Jackie Robinson broke the color barrier when he played for the Brooklyn Dodgers.", note: "1947 Robinson breaks barrier w/ Dodgers" },
    { sentence: "Because he played with courage, he earned respect from many fans.", note: "courage → respect from fans" },
    { sentence: "As a result, other teams began signing Black players.", note: "result: other teams sign Black players" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Black players formed the Negro Leagues",
      because: "major league teams refused to sign them.",
      but: "the players were just as talented as major leaguers.",
      so: "they built their own teams, like the Baltimore Elite Giants.",
    },
    {
      lesson: "B",
      kernel: "Branch Rickey chose Jackie Robinson",
      because: "he could play great baseball and stay calm during insults.",
      but: "some people wanted baseball to stay segregated.",
      so: "the young player joined Montreal in 1946 before moving up to the Dodgers.",
    },
    {
      lesson: "D",
      kernel: "Jackie Robinson won Rookie of the Year in 1947",
      because: "he played so well in his first season.",
      but: "some fans and players treated him unfairly all season.",
      so: "his courage showed that Black players belonged in the major leagues.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Black players formed teams.",
      parts: { when: "for many years", where: "in the Negro Leagues", why: "because major league teams refused them" },
      model: "For many years, Black players formed teams in the Negro Leagues because major league teams refused them.",
    },
    {
      lesson: "C",
      kernel: "Robinson played.",
      parts: { when: "on April 15, 1947", where: "at Ebbets Field in Brooklyn", how: "with courage and calm", why: "to show that he belonged" },
      model: "On April 15, 1947, Robinson played at Ebbets Field in Brooklyn with courage and calm to show that he belonged.",
    },
  ],
  fragments: [
    { text: "The color barrier was an unfair rule.", is_sentence: true },
    { text: "Because Robinson played with courage.", is_sentence: false, fix: "Fans cheered because Robinson played with courage." },
    { text: "Other teams began signing Black players.", is_sentence: true },
    { text: "Broke the color barrier in 1947.", is_sentence: false, fix: "Jackie Robinson broke the color barrier in 1947." },
    { text: "Which made baseball more fair.", is_sentence: false, fix: "Robinson's courage changed the game, which made baseball more fair." },
    { text: "Rickey wanted a player who could stay calm.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Negro Leagues, ___, gave Black players a place to play.",
      noun: "Negro Leagues",
      options: ["professional baseball leagues run by Black owners", "a prize for the best new player", "a stadium in Brooklyn"],
      answer: 0,
      model: "The Negro Leagues, professional baseball leagues run by Black owners, gave Black players a place to play.",
    },
    {
      lesson: "B",
      sentence: "Branch Rickey, ___, wanted a calm and talented player.",
      noun: "Branch Rickey",
      options: ["a shortstop for the Monarchs", "the president of the Brooklyn Dodgers", "a Cleveland outfielder"],
      answer: 1,
      model: "Branch Rickey, the president of the Brooklyn Dodgers, wanted a calm and talented player.",
    },
    {
      lesson: "C",
      sentence: "Jackie Robinson, ___, won the first Rookie of the Year award.",
      noun: "Jackie Robinson",
      options: ["the owner of a Negro League team", "a pitcher from Montreal", "the first Black player in the modern major leagues"],
      answer: 2,
      model: "Jackie Robinson, the first Black player in the modern major leagues, won the first Rookie of the Year award.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "Black players formed their own leagues", model: "Because major league teams refused to sign them, Black players formed their own leagues." },
    { lesson: "C", conjunction: "although", stem: "Robinson stayed calm and kept playing", model: "Although some fans treated him unfairly, Robinson stayed calm and kept playing." },
    { lesson: "D", conjunction: "after", stem: "other teams began signing Black players", model: "After Robinson succeeded with the Dodgers, other teams began signing Black players." },
  ],
  spo: {
    topic: {
      l1_2: "Jackie Robinson's [courage] changed [baseball].",
      l3_4: "Because Jackie Robinson [played with courage], baseball [changed for other players].",
      l5_6: "Although [Robinson faced unfair treatment], his courage on the field [set off a chain of changes] that [reached players and fans across the country].",
    },
    starters: [
      { type: "question", text: "How can one player's courage change a whole sport?" },
      { type: "appositive", text: "Jackie Robinson, the first Black player in the modern major leagues, set off a chain of change." },
      { type: "subordinate", text: "Because Jackie Robinson stayed calm and played well, other teams began signing Black players." },
    ],
    details: [
      { note: "major leagues refuse Black players", lesson: "A" },
      { note: "Negro Leagues = Black-owned teams", lesson: "A" },
      { note: "Rickey picks Robinson: skill + calm", lesson: "B" },
      { note: "Apr. 15, 1947 Ebbets Field debut", lesson: "C" },
      { note: "unfair treatment → Robinson stays calm", lesson: "C" },
      { note: "result: other teams sign Black players", lesson: "D" },
    ],
    distractors: ["a baseball game has nine innings", "the Orioles play in Baltimore"],
    conclusion: {
      l1_2: "Robinson's [courage] changed [baseball].",
      l3_4: "As a result, [other teams] began to [sign Black players].",
      l5_6: "Because one player [met unfair treatment with courage], baseball [changed for everyone], and his legacy [still inspires players and fans today].",
    },
  },
  prompt: {
    l1_2: "Draw Jackie Robinson at Ebbets Field. Write 2-4 sentences. Tell one cause and one effect.",
    l3_4: "Write a paragraph that explains how Jackie Robinson's courage caused changes in baseball. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains the chain of causes and effects that began when Jackie Robinson broke the color barrier. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Because", "So", "As a result,", "Therefore,", "This led to", "Since", "First,", "Finally,"],
  model: {
    l1_2: "Jackie Robinson played with courage. Other teams began signing Black players. Baseball became more fair.",
    l3_4: "Because Jackie Robinson played with courage, baseball changed for other players. For many years, the color barrier kept Black players out of the major leagues, so they formed the Negro Leagues. In 1947, Robinson debuted at Ebbets Field and stayed calm when some fans treated him unfairly. Because he played so well, he won the first Rookie of the Year award. As a result, other teams began to sign Black players.",
    l5_6: "Although Jackie Robinson faced unfair treatment, his courage set off a chain of changes in baseball. For many years, the color barrier kept Black players out of the major leagues, so they formed their own teams in the Negro Leagues. Branch Rickey, the president of the Brooklyn Dodgers, chose Robinson because he could play great baseball and stay calm during insults. On April 15, 1947, Robinson stepped onto Ebbets Field, and he played so well that he won the first Rookie of the Year award. As a result, other teams began signing Black players, including Larry Doby of the Cleveland Indians. Because one player met unfair treatment with courage, baseball changed for everyone, and his legacy still inspires players and fans today.",
  },
  mpo: {
    thesis: "Jackie Robinson's courage broke baseball's color barrier and set off a chain of changes that reached players and fans everywhere.",
    paragraphs: [
      { topic: "The color barrier caused Black players to build their own leagues.", notes: ["major leagues refuse Black players", "Negro Leagues", "Baltimore Elite Giants"] },
      { topic: "Robinson's courage in 1947 caused respect and success.", notes: ["Rickey picks calm + skilled player", "Apr. 15, 1947 Ebbets Field", "stays calm; Rookie of the Year"] },
      { topic: "His success caused lasting effects for baseball.", notes: ["other teams sign Black players", "Larry Doby joins Cleveland 1947", "legacy = courage + fairness"] },
    ],
    conclusion: "One player's courage set off a chain reaction, so baseball became fairer and Jackie Robinson's legacy still lives on.",
  },
  revise: [
    "Did I name a cause and show the effect it led to?",
    "Did I use because, so, or as a result to link each cause to its effect?",
    "Did I show a chain, with one effect leading to the next?",
    "Did I end with the legacy that lasts today?",
  ],
};
