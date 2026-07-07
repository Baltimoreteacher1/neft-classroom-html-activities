/* Number Realm — Unit 3: Ratios (6.AT) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[3] = {
    id: 3,
    title: "Unit 3",
    realm: "The Ratio Bazaar",
    standard: "6.AT.A",
    accent: "#0f766e",
    hero: "🧕",
    tagline: "A bustling market where everything trades in ratios.",
    intro:
      "Welcome to the Ratio Bazaar, where nothing has a price — only a ratio. Merchants haggle in parts and rates, and a trickster has been swapping the scales. Restore fair trade by mastering ratios, tables, and unit rates.",
    chapters: [
      {
        id: "u3c1",
        title: "The Marble Merchant",
        enemy: { name: "Haggling Imp", emoji: "🧿" },
        standard: "6.AT.A.1",
        topicLabel: "Write & simplify ratios · 6.AT.A.1",
        topics: ["ratio-basic"],
        scene:
          "An imp offers marbles in mismatched piles. Simplify the ratio to catch its trick.",
        victory: "The imp yelps and hands over a bag of perfectly balanced marbles.",
      },
      {
        id: "u3c2",
        title: "The Scaled Scrolls",
        enemy: { name: "Scale Golem", emoji: "⚖️" },
        standard: "6.AT.A.3",
        topicLabel: "Equivalent ratios & tables · 6.AT.A.3",
        topics: ["equivalent-ratio", "ratio-basic"],
        scene:
          "A golem made of scrolls demands equivalent ratios to let you pass. Find the multiplier.",
        victory: "The scrolls unroll into a tidy ratio table. The golem bows.",
      },
      {
        id: "u3c3",
        title: "The Rate Runner",
        enemy: { name: "Rate Runner", emoji: "🏃" },
        standard: "6.AT.A.2",
        topicLabel: "Unit rates · 6.AT.A.2",
        topics: ["unit-rate", "compare-ratios"],
        scene:
          "A blur of a merchant races between stalls quoting rates. Reduce each to a unit rate to keep up.",
        victory: "The runner skids to a stop, impressed. The stalls quiet down.",
      },
      {
        id: "u3c4",
        title: "The Table Keeper",
        enemy: { name: "Ledger Wraith", emoji: "📜" },
        standard: "6.AT.A.3",
        topicLabel: "Ratio tables · 6.AT.A.3",
        topics: ["ratio-table", "equivalent-ratio"],
        scene: "A wraith of endless ledgers demands you complete its ratio tables to pass.",
        victory: "The ledgers balance perfectly. The wraith fades into neat columns.",
      },
    ],
    boss: {
      name: "The Grand Swindler",
      emoji: "🎭",
      subtitle: "Master of every crooked trade",
      scene:
        "The Grand Swindler runs the whole crooked bazaar, hiding behind ratios, tables, and better-buy tricks. Expose every fake price using all your ratio reasoning.",
      topics: ["ratio-basic", "equivalent-ratio", "unit-rate", "compare-ratios", "ratio-table"],
      victory: "The Swindler's mask falls. Honest ratios rule the Bazaar once more.",
    },
    outro:
      "The Ratio Bazaar trades fairly again. You can spot an unfair rate a mile away.",
  };
})();
