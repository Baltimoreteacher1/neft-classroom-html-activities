/* Number Realm — Unit 2: Fraction Division (6.NS.A) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[2] = {
    id: 2,
    title: "Unit 2",
    realm: "The Fractured Isles",
    standard: "6.NS.A.1",
    accent: "#0891b2",
    hero: "⛵",
    tagline: "A shattered archipelago where whole islands split into fractions.",
    intro:
      "A storm has fractured the mainland into hundreds of tiny islands. To rebuild the bridges you must divide fractions — figuring out how many pieces fit inside a whole. Set sail, navigator.",
    chapters: [
      {
        id: "u2c1",
        title: "How Many Fit?",
        enemy: { name: "Reef Serpent", emoji: "🐍" },
        standard: "6.NS.A.1",
        topicLabel: "Whole ÷ fraction · 6.NS.A.1",
        topics: ["whole-by-fraction"],
        scene:
          "A serpent coils around the first reef. Ask how many fraction-pieces fit inside a whole to slip past it.",
        victory: "The serpent uncoils, revealing a bridge of equal pieces.",
      },
      {
        id: "u2c2",
        title: "Keep, Change, Flip",
        enemy: { name: "Tide Kraken", emoji: "🦑" },
        standard: "6.NS.A.1",
        topicLabel: "Divide fractions · 6.NS.A.1",
        topics: ["fraction-division", "whole-by-fraction"],
        scene:
          "The kraken guards the deep channel. Remember the spell: keep the first, change the sign, flip the second.",
        victory: "The kraken sinks below, and the channel calms into equivalent fractions.",
      },
      {
        id: "u2c3",
        title: "The Mixed Maelstrom",
        enemy: { name: "Storm Djinn", emoji: "🌀" },
        standard: "6.NS.A.1",
        topicLabel: "Divide mixed numbers · 6.NS.A.1",
        topics: ["mixed-number-division", "fraction-division"],
        scene:
          "A whirling djinn hurls mixed numbers. Turn each into an improper fraction before you strike.",
        victory: "The maelstrom stills. The final bridge snaps into place.",
      },
    ],
    boss: {
      name: "The Whole-Eater",
      emoji: "🌊",
      subtitle: "A leviathan that devours wholes into fractions",
      scene:
        "The Whole-Eater rises — a leviathan that swallows islands and spits them out in pieces. Divide it down to size using every fraction move you know.",
      topics: ["whole-by-fraction", "fraction-division", "mixed-number-division"],
      victory: "The leviathan dissolves into calm seas. The Isles are whole again.",
    },
    outro:
      "The Fractured Isles are reconnected, one fair share at a time. You are a true fraction navigator.",
  };
})();
