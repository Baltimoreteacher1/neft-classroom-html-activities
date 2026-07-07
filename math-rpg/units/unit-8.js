/* Number Realm — Unit 8: Statistics & Data (6.DS) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[8] = {
    id: 8,
    title: "Unit 8",
    realm: "The Data Delta",
    standard: "6.DS.B",
    accent: "#0369a1",
    hero: "🔬",
    tagline: "A river delta where every channel carries a stream of data.",
    intro:
      "The Data Delta splits into countless channels of numbers. A fog of confusion has settled, hiding the center and spread of every dataset. Bring back clarity with mean, median, range, and MAD.",
    chapters: [
      {
        id: "u8c1",
        title: "The Center Channel",
        enemy: { name: "Mean Mudskipper", emoji: "🐟" },
        standard: "6.DS.B.6",
        topicLabel: "Mean (average) · 6.DS.B.6",
        topics: ["mean"],
        scene:
          "A slippery fish darts through the data. Find the mean to pin down the center of the stream.",
        victory: "The current steadies around its true average.",
      },
      {
        id: "u8c2",
        title: "The Middle Marsh",
        enemy: { name: "Median Heron", emoji: "🦩" },
        standard: "6.DS.B.6",
        topicLabel: "Median & range · 6.DS.B.6",
        topics: ["median", "range"],
        scene:
          "A heron stands dead-center in the marsh. Order the data and find the middle to reach it.",
        victory: "The heron takes flight, the data now sorted and clear.",
      },
      {
        id: "u8c3",
        title: "The Spread Shallows",
        enemy: { name: "Deviation Eel", emoji: "🪱" },
        standard: "6.DS.B.6",
        topicLabel: "Mean absolute deviation · 6.DS.B.6",
        topics: ["mad", "mean"],
        scene:
          "An eel measures how far every value strays from the mean. Match its spread with the MAD.",
        victory: "The shallows calm. You can measure both center and spread now.",
      },
      {
        id: "u8c4",
        title: "The Dot Plot Depths",
        enemy: { name: "Plotting Polyp", emoji: "🫧" },
        standard: "6.DS.A.1 / 6.DS.B.5",
        topicLabel: "Statistical questions & dot plots · 6.DS",
        topics: ["statistical-question", "dotplot-read"],
        scene: "A creature of scattered dots tests whether you can read a dot plot and spot a statistical question.",
        victory: "The dots settle into a readable plot. The polyp drifts away.",
      },
    ],
    boss: {
      name: "The Fog of Uncertainty",
      emoji: "🌫️",
      subtitle: "It hides every summary of the data",
      scene:
        "The Fog throws datasets at you, demanding center and spread on the spot. Summarize them all to clear the Delta.",
      topics: ["mean", "median", "range", "mad", "dotplot-read", "statistical-question"],
      victory: "The fog lifts. Every channel of the Data Delta reads crystal clear.",
    },
    outro:
      "The Data Delta flows in perfect clarity. You can summarize any dataset with confidence.",
  };
})();
