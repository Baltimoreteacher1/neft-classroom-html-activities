// BCPSS Writing Lab (TWR) — g8-ela-u2 · The Great War. Contract: ../writing-schema.mjs

export default {
  title: "From Glory to the Trenches",
  genre: "explain",
  tip: "Have students draw the cause-and-effect chain with arrows first, then turn each arrow into a because, so, or as a result sentence.",
  lessons: [
    { id: "A", title: "Why armies marched to war in 1914" },
    { id: "B", title: "Machine guns and artillery change the fighting" },
    { id: "C", title: "Life and fear in the trenches" },
    { id: "D", title: "Camaraderie and disillusionment in All Quiet on the Western Front" },
  ],
  source: {
    title: "Why the Trenches Appeared",
    lesson: "B",
    text: "In August 1914, crowds cheered as young men marched off to war. Many expected a short and glorious fight. Instead, machine guns could fire hundreds of bullets a minute, and heavy artillery shells shook the ground for miles. A charge across open ground became deadly, so armies dug trenches to hide from the fire. The two sides faced each other for months along the Western Front, and neither could win. Soldiers lived in mud, cold, and fear. Rats and lice spread through the trenches. Yet the hardship also made friends of strangers. In All Quiet on the Western Front, the young soldiers share food and help each other, because they have only each other to trust.",
  },
  notes: [
    { sentence: "Instead, machine guns could fire hundreds of bullets a minute, and heavy artillery shells shook the ground for miles.", note: "machine guns + artillery = deadly" },
    { sentence: "A charge across open ground became deadly, so armies dug trenches to hide from the fire.", note: "open charge deadly → trenches" },
    { sentence: "The two sides faced each other for months along the Western Front, and neither could win.", note: "2 sides, months, no winner = stalemate" },
    { sentence: "Yet the hardship also made friends of strangers.", note: "hardship → friends (camaraderie)" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Armies dug trenches along the Western Front",
      because: "machine guns made charging across open ground deadly.",
      but: "the trenches could not protect soldiers from every shell.",
      so: "the war settled into a long stalemate.",
    },
    {
      lesson: "A",
      kernel: "Many young men enlisted in 1914",
      because: "propaganda promised glory and adventure.",
      but: "the real war was muddy, cold, and deadly.",
      so: "disillusionment spread through the ranks.",
    },
    {
      lesson: "D",
      kernel: "Soldiers in the trenches became close friends",
      because: "they shared food, danger, and fear every day.",
      but: "the war around them was destroying their hopes.",
      so: "camaraderie became the one thing that kept them going.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Shells shook the trenches.",
      parts: { when: "day and night", where: "along the Western Front", why: "so soldiers could not sleep" },
      model: "Day and night, shells shook the trenches along the Western Front so soldiers could not sleep.",
    },
    {
      lesson: "D",
      kernel: "Soldiers shared food.",
      parts: { when: "after a long night of shelling", where: "in the muddy trench", why: "because they trusted each other" },
      model: "After a long night of shelling, soldiers shared food in the muddy trench because they trusted each other.",
    },
  ],
  fragments: [
    { text: "Machine guns made old-style charges deadly.", is_sentence: true },
    { text: "Because the trenches were cold and muddy.", is_sentence: false, fix: "Soldiers felt miserable because the trenches were cold and muddy." },
    { text: "Soldiers in the trenches became close friends.", is_sentence: true },
    { text: "Along the Western Front for months.", is_sentence: false, fix: "The armies faced each other along the Western Front for months." },
    { text: "Led to deep disillusionment among the soldiers.", is_sentence: false, fix: "Months in the mud led to deep disillusionment among the soldiers." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Artillery, ___, shook the ground for miles.",
      noun: "Artillery",
      options: ["large guns that fire heavy shells", "a long ditch where soldiers hide", "deep friendship among soldiers"],
      answer: 0,
      model: "Artillery, large guns that fire heavy shells, shook the ground for miles.",
    },
    {
      lesson: "C",
      sentence: "A trench, ___, protected soldiers from machine guns.",
      noun: "trench",
      options: ["a situation in which neither side can win", "a long, narrow ditch where soldiers hide from enemy fire", "a person killed, wounded, or missing in war"],
      answer: 1,
      model: "A trench, a long, narrow ditch where soldiers hide from enemy fire, protected soldiers from machine guns.",
    },
    {
      lesson: "D",
      sentence: "Camaraderie, ___, helped soldiers face their fear.",
      noun: "Camaraderie",
      options: ["the sad feeling of losing a belief", "messages that spread one side's view", "deep friendship and trust among people who face hard times together"],
      answer: 2,
      model: "Camaraderie, deep friendship and trust among people who face hard times together, helped soldiers face their fear.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "since", stem: "armies dug trenches", model: "Since machine guns made charging deadly, armies dug trenches." },
    { lesson: "A", conjunction: "although", stem: "the fighting lasted more than four years", model: "Although the soldiers expected a short war, the fighting lasted more than four years." },
    { lesson: "C", conjunction: "when", stem: "soldiers could not rest", model: "When shells fell day and night, soldiers could not rest." },
  ],
  spo: {
    topic: {
      l1_2: "New machines caused [soldiers] to lose their [hope].",
      l3_4: "Machine guns, artillery, and trench life caused [disillusionment], but [camaraderie] also grew.",
      l5_6: "As a result of [mechanized weapons and months in the trenches], soldiers lost their faith in glory, yet [camaraderie] became their new reason to endure.",
    },
    starters: [
      { type: "question", text: "How did machines turn a war that began with cheering into one of mud and fear?" },
      { type: "subordinate", text: "Because machine guns made charges deadly, armies had to dig into the ground." },
      { type: "statement", text: "In 1914, thousands of young men expected glory and a quick victory." },
    ],
    details: [
      { note: "machine guns → charges deadly", lesson: "B" },
      { note: "artillery shells day + night", lesson: "B" },
      { note: "trenches = mud, cold, rats", lesson: "C" },
      { note: "stalemate = months, no progress", lesson: "A" },
      { note: "propaganda promised glory", lesson: "A" },
      { note: "friends share food = camaraderie", lesson: "D" },
    ],
    distractors: ["World War II began in 1939", "trains carried supplies to the coast"],
    conclusion: {
      l1_2: "The war made soldiers [sad], but [friends] helped.",
      l3_4: "Because of [the machines and the mud], soldiers lost hope, but [camaraderie] kept them going.",
      l5_6: "Mechanized war destroyed [the dream of glory], yet it also created [a loyalty that no shell could break].",
    },
  },
  prompt: {
    l1_2: "Look at the trench picture. Write 3-4 sentences. Tell one cause and one effect. Use so or because.",
    l3_4: "Write a paragraph that explains how machine guns, artillery, and trench life caused soldiers to lose hope. Use your outline, because, and as a result.",
    l5_6: "Write a paragraph that explains how mechanized weapons led to disillusionment and why camaraderie still grew. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "As a result,", "For this reason,", "Therefore,", "In the end,"],
  model: {
    l1_2: "Machine guns made charging deadly. So soldiers dug trenches. The trenches were cold and muddy. Soldiers felt sad and tired.",
    l3_4: "Machine guns, artillery, and trench life caused soldiers to lose hope, but friendship also grew. First, machine guns made charging across open ground deadly, so armies dug trenches. Next, artillery shells fell day and night, and soldiers could not sleep. Because the trenches were cold and muddy, many soldiers felt tired and afraid. As a result, the excitement of 1914 turned into disillusionment. Still, camaraderie kept them going, since friends shared food and courage.",
    l5_6: "As a result of mechanized weapons and months in the trenches, soldiers lost their faith in glory, yet camaraderie became their new reason to endure. In 1914, crowds cheered, and propaganda promised a short and heroic war. Machine guns, rapid-fire weapons that could shoot hundreds of bullets a minute, made charges across open ground deadly. Since armies could not advance, they dug trenches, and the war settled into a stalemate. Day and night, artillery shells shook the ground, so soldiers lived in mud, cold, and fear. Although the war crushed their dreams of glory, the soldiers formed bonds that no shell could break. Their disillusionment was real, but their loyalty to one another was just as real.",
  },
  mpo: {
    thesis: "New machines and trench life caused soldiers to lose their belief in glory, but they also built deep camaraderie.",
    paragraphs: [
      { topic: "Machine guns and artillery caused armies to dig trenches and fall into a stalemate.", notes: ["machine guns → charges deadly", "artillery → shells day + night", "trenches → stalemate"] },
      { topic: "Mud, fear, and propaganda that left out the truth caused disillusionment.", notes: ["1914: crowds cheer, glory promised", "reality = mud, cold, rats", "hope → disillusionment"] },
      { topic: "Shared danger caused camaraderie among the soldiers.", notes: ["friends share food", "trust b/c shared fear", "camaraderie = reason to go on"] },
    ],
    conclusion: "Machine guns, artillery, and months in the trenches destroyed the dream of glory, yet the friendships formed there show how people hold on to one another in hard times.",
  },
  revise: [
    "Did I name a cause and its effect, not just list facts about the war?",
    "Did I use because, so, or as a result in at least three sentences?",
    "Did I use mechanized, trench, or stalemate correctly at least once?",
    "Did I explain why camaraderie grew, not just say that it did?",
  ],
};
