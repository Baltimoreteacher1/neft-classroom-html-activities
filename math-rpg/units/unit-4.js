/* Number Realm — Unit 4: Rates, Percents, and Unit Rates (6.RP) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[4] = {
    id: 4,
    title: "Unit 4",
    realm: "Percent Peaks",
    standard: "6.RP.A.3",
    accent: "#b45309",
    hero: "🧗",
    tagline: "A mountain range measured entirely in percents and rates.",
    intro:
      "Percent Peaks rise in bands of 10%, 25%, 50%, and beyond. An avalanche has buried the trail markers. Climb by converting between fractions, decimals, and percents, and by solving with rates. Rope up — it's a long ascent.",
    chapters: [
      {
        id: "u4c1",
        title: "The Conversion Crevasse",
        enemy: { name: "Frost Sprite", emoji: "❄️" },
        standard: "6.RP.A.3",
        topicLabel: "Fractions, decimals, percents · 6.RP.A.3",
        topics: ["fdp-conversion"],
        scene:
          "A sprite freezes the bridge unless you name each amount three ways. Convert to cross.",
        victory: "The ice melts into a shimmering ramp of equivalent forms.",
      },
      {
        id: "u4c2",
        title: "The Percent Ledge",
        enemy: { name: "Cliff Gargoyle", emoji: "🗿" },
        standard: "6.RP.A.3",
        topicLabel: "Percent of a number · 6.RP.A.3",
        topics: ["percent-of-number", "fdp-conversion"],
        scene:
          "A gargoyle demands a toll: find the percent of each number carved in the ledge.",
        victory: "The gargoyle steps aside, revealing the summit path.",
      },
      {
        id: "u4c3",
        title: "The Measure Pass",
        enemy: { name: "Unit Yeti", emoji: "🦣" },
        standard: "6.RP.A.3",
        topicLabel: "Rates & unit conversion · 6.RP.A.3",
        topics: ["unit-rate", "measurement-convert"],
        scene:
          "A yeti guards the pass, roaring in mismatched units. Convert measurements and rates to calm it.",
        victory: "The yeti nods and lumbers off. The summit is close.",
      },
      {
        id: "u4c4",
        title: "The Discount Market",
        enemy: { name: "Bargain Gremlin", emoji: "🏷️" },
        standard: "6.RP.A.3",
        topicLabel: "Percent word problems · 6.RP.A.3",
        topics: ["percent-word", "percent-of-number"],
        scene: "A gremlin runs a market of tricky discounts and sales. Solve each percent situation to shop safely.",
        victory: "The gremlin grumbles and hands over an honest receipt.",
      },
    ],
    boss: {
      name: "The Summit Sphinx",
      emoji: "🐈‍⬛",
      subtitle: "Riddler of percents and rates",
      scene:
        "At the peak waits the Sphinx, who riddles in every form of percent and rate at once. Answer all to claim the summit.",
      topics: ["fdp-conversion", "percent-of-number", "unit-rate", "measurement-convert", "percent-word"],
      victory: "The Sphinx purrs and vanishes. You stand atop Percent Peaks.",
    },
    outro:
      "From the summit, every fraction, decimal, and percent looks like the same view. Masterful climbing!",
  };
})();
