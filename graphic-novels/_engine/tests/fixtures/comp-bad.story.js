window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "x",
    standard: "6.NS.4",
    readingStandard: "RL.6.1",
    assessment: "x",
    artBase: "../_art/unit1/",
    home: "../index.html",
  },
  cast: {
    cadet: { name: "Cadet", role: "protagonist" },
    log: { name: "L", role: "narrator" },
  },
  cover: { art: "cover.png", blurbEn: "x" },
  acts: [
    {
      id: "act1",
      tab: "A",
      title: "A",
      steps: [
        {
          type: "comprehension",
          id: "c1",
          skill: "main_idea",
          standard: "RI.6.2",
          ask: { who: "log", en: "Q?" },
          choices: [
            { en: "a", correct: true },
            { en: "b", correct: true },
          ],
        },
      ],
    },
  ],
  glossary: [{ ico: "x", en: "x", es: "x", def: "x" }],
  complete: {
    art: "c.png",
    en: "x",
    master: { promptEn: "x", choices: [{ en: "a", correct: true }] },
  },
};
