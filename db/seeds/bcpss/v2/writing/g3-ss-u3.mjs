// BCPSS Writing Lab (TWR) — g3-ss-u3 · Cultural Heritage & Migration Stories. Contract: ../writing-schema.mjs

export default {
  title: "Nico Arrives at the Harbor",
  genre: "narrate",
  tip: "Have students name the character's feeling and its reason aloud, then add one line of dialogue before they draft.",
  lessons: [
    { id: "A", title: "Why families migrate to a new place" },
    { id: "B", title: "Arriving at Locust Point" },
    { id: "C", title: "Traditions that families bring along" },
    { id: "D", title: "Feelings and challenges of starting over" },
  ],
  source: {
    title: "A Boy on the Ship's Deck",
    lesson: "B",
    text: "Nico stood on the ship's deck and held his mother's hand. In front of him, the harbor of Baltimore glowed in the morning light. His family had crossed the ocean from Italy to find work. Nico felt nervous because he did not know any English. But his father smiled and said, 'We will make a new home here.' Later, Nico's family cooked a big Sunday dinner, just like back home. Nico felt a little less nervous.",
  },
  notes: [
    { sentence: "His family had crossed the ocean from Italy to find work.", note: "family crossed ocean → work" },
    { sentence: "Nico felt nervous because he did not know any English.", note: "Nico nervous: no English" },
    { sentence: "But his father smiled and said, 'We will make a new home here.'", note: "Dad: new home here (hopeful)" },
    { sentence: "Later, Nico's family cooked a big Sunday dinner, just like back home.", note: "Sunday dinner = tradition from home" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Nico felt nervous on the ship",
      because: "he did not know any English.",
      but: "his father felt hopeful.",
      so: "Nico held his mother's hand tightly.",
    },
    {
      lesson: "A",
      kernel: "Nico's family crossed the ocean",
      because: "they hoped to find jobs and a safe home.",
      but: "they had to leave their relatives behind.",
      so: "they felt both excited and sad.",
    },
    {
      lesson: "C",
      kernel: "Nico's family cooked a Sunday dinner",
      because: "it was a tradition from their old home.",
      but: "the kitchen in Baltimore looked different.",
      so: "Nico felt a little less nervous.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Nico held his mother's hand.",
      parts: { where: "on the ship's deck", how: "very tightly", why: "because the harbor looked so big" },
      model: "On the ship's deck, Nico held his mother's hand very tightly because the harbor looked so big.",
    },
    {
      lesson: "C",
      kernel: "The family cooked dinner.",
      parts: { when: "on Sunday", where: "in their new kitchen", how: "with old family recipes", why: "to feel at home" },
      model: "On Sunday, the family cooked dinner in their new kitchen with old family recipes to feel at home.",
    },
  ],
  fragments: [
    { text: "Nico felt nervous about the new country.", is_sentence: true },
    { text: "Because he did not know English.", is_sentence: false, fix: "Nico felt nervous because he did not know English." },
    { text: "His father smiled at him.", is_sentence: true },
    { text: "Crossed the ocean on a ship.", is_sentence: false, fix: "The family crossed the ocean on a ship." },
    { text: "When the ship reached Locust Point.", is_sentence: false, fix: "Nico gasped when the ship reached Locust Point." },
    { text: "Families bring traditions with them.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Nico, ___, held his mother's hand.",
      noun: "Nico",
      options: ["a harbor neighborhood in Baltimore", "a boy who was nervous about the new country", "a Sunday dinner his family cooks"],
      answer: 1,
      model: "Nico, a boy who was nervous about the new country, held his mother's hand.",
    },
    {
      lesson: "A",
      sentence: "Locust Point, ___, welcomed many families long ago.",
      noun: "Locust Point",
      options: ["a neighborhood by the Baltimore harbor", "a custom a family keeps for many years", "a person who moves to a new country"],
      answer: 0,
      model: "Locust Point, a neighborhood by the Baltimore harbor, welcomed many families long ago.",
    },
    {
      lesson: "C",
      sentence: "A tradition, ___, can travel across the ocean with a family.",
      noun: "tradition",
      options: ["the way one person sees something", "something hard that takes effort to get through", "something a family does the same way for many years"],
      answer: 2,
      model: "A tradition, something a family does the same way for many years, can travel across the ocean with a family.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "Nico felt nervous", model: "Because he did not know any English, Nico felt nervous." },
    { lesson: "C", conjunction: "when", stem: "Nico felt a little less nervous", model: "When his family cooked the Sunday dinner, Nico felt a little less nervous." },
    { lesson: "A", conjunction: "before", stem: "the family said goodbye to their friends", model: "Before they crossed the ocean, the family said goodbye to their friends." },
  ],
  spo: {
    topic: {
      l1_2: "Nico felt [nervous] but [hopeful].",
      l3_4: "From Nico's perspective, arriving in Baltimore felt [nervous] because [he did not know English].",
      l5_6: "Although [Nico, a boy who had crossed the ocean,] felt nervous, [a Sunday dinner from home] made [the new country feel like a place he could belong].",
    },
    starters: [
      { type: "question", text: "How does a boy feel when he arrives where he does not know the language?" },
      { type: "appositive", text: "Nico, a boy from Italy, stood on the deck and held his mother's hand." },
      { type: "subordinate", text: "Although Nico felt nervous, his father said they would make a new home." },
    ],
    details: [
      { note: "Nico on ship deck, holds Mom's hand", lesson: "B" },
      { note: "harbor of Baltimore glows", lesson: "B" },
      { note: "family crossed ocean from Italy → work", lesson: "A" },
      { note: "nervous: no English", lesson: "D" },
      { note: "Dad: new home here", lesson: "D" },
      { note: "Sunday dinner = tradition from home", lesson: "C" },
    ],
    distractors: ["ships bring sugar and coal", "Baltimore has many rowhouses"],
    conclusion: {
      l1_2: "Nico felt [hopeful].",
      l3_4: "In the end, Nico felt [hopeful] because [his family brought a tradition with them].",
      l5_6: "By evening, Nico was still nervous, but [the smell of Sunday dinner] made [Baltimore feel a little like home].",
    },
  },
  prompt: {
    l1_2: "Draw Nico on the ship. Write 2-3 sentences. Tell how he feels and why.",
    l3_4: "Write a paragraph from Nico's perspective about arriving in Baltimore. Tell how he feels and why. Add one line of dialogue.",
    l5_6: "Write a paragraph from Nico's perspective that shows what he feels, fears, and hopes. Include dialogue, an appositive, and a sentence that starts with although or when.",
  },
  transitions: ["At first,", "Then", "Suddenly,", "However,", "Later,", "Because", "Finally,", "In the end,"],
  model: {
    l1_2: "From Nico's perspective, the harbor felt big. He felt nervous. Then his family cooked dinner, and he felt better.",
    l3_4: "From Nico's perspective, arriving in Baltimore felt nervous because he did not know any English. He held his mother's hand on the ship's deck. However, his father smiled and said, 'We will make a new home here.' Later, the family cooked a big Sunday dinner, just like back home. In the end, Nico felt hopeful because his family had brought a tradition with them.",
    l5_6: "From Nico's perspective, the harbor of Baltimore looked huge and strange. Nico, a boy who had crossed the ocean from Italy, held his mother's hand and whispered, 'I do not know any English.' Although he felt nervous, his father smiled and said, 'We will make a new home here.' Later, the smell of Sunday dinner filled the kitchen. Nico remembered his grandmother's table. It was a tradition from home. By evening, Nico was still nervous, but Baltimore felt a little like home.",
  },
  revise: [
    "Did I tell how the person feels from his own point of view?",
    "Did I explain why he feels that way?",
    "Did I show what the family brought, such as a tradition?",
    "Did I add dialogue and use but or however to show a second feeling?",
  ],
};
