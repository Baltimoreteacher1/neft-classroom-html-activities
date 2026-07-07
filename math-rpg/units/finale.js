/* Number Realm — Saga Finale: The Null (gated until all 10 realms cleared) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS.finale = {
    id: "finale",
    finale: true,
    title: "Saga Finale",
    realm: "The Rift at the End of Numbers",
    standard: "All Grade 6 standards",
    accent: "#4c1d95",
    hero: "🌟",
    tagline: "Where every realm's power converges against the void.",
    intro:
      "With all ten realms restored, a tear opens at the edge of the Number Realm. From it seeps The Null — the absence of quantity itself, unmaking numbers wherever it drifts. Everything you've learned across every unit must come together now. This is the final stand.",
    chapters: [
      {
        id: "fin1",
        title: "The Unraveling — Number & Fractions",
        enemy: { name: "Void Herald of Quantity", emoji: "🕳️" },
        standard: "6.NOS",
        topicLabel: "Units 1–2 · Number sense & fractions",
        topics: ["gcf", "lcm", "decimal-ops", "fraction-division", "mixed-number-division"],
        scene: "The Null's first herald erases numbers and fractions. Restore them by proving your command of both.",
        victory: "Numbers snap back into being. The herald dissolves.",
        hitsToWin: 7,
      },
      {
        id: "fin2",
        title: "The Unraveling — Proportion & Algebra",
        enemy: { name: "Void Herald of Relation", emoji: "🌀" },
        standard: "6.AT / 6.AT",
        topicLabel: "Units 3–4, 6–7 · Ratios, percents, expressions, equations",
        topics: ["equivalent-ratio", "unit-rate", "percent-of-number", "distributive", "one-step-equation"],
        scene: "The second herald severs every relationship between quantities. Rebuild the proportions and equations.",
        victory: "Ratios and equations rebalance across the rift.",
        hitsToWin: 7,
      },
      {
        id: "fin3",
        title: "The Unraveling — Geometry & Data",
        enemy: { name: "Void Herald of Space", emoji: "🔻" },
        standard: "6.GR / 6.DS / 6.NOS.C",
        topicLabel: "Units 5, 8–10 · Area, data, coordinates, volume",
        topics: ["area-composite", "volume-prism", "surface-area", "mean", "coordinate-distance"],
        scene: "The final herald flattens space and scatters the data. Measure it all back into order.",
        victory: "Shapes and data reassemble. Only The Null remains.",
        hitsToWin: 7,
      },
    ],
    boss: {
      name: "The Null",
      emoji: "🌌",
      subtitle: "The absence of all quantity",
      scene:
        "The Null itself towers over the rift, hurling problems from every corner of Grade 6. There is no single trick — only everything you have become. Stand firm, hero.",
      topics: [
        "gcf", "fraction-division", "unit-rate", "percent-of-number", "area-triangle",
        "distributive", "one-step-equation", "mean", "coordinate-distance", "volume-prism", "surface-area",
      ],
      victory:
        "With a final, certain answer, the rift seals. The Null unravels into harmless zero — a number once more, not an absence. The Number Realm is whole, and you are its greatest legend.",
      hitsToWin: 12,
    },
    outro:
      "The saga is complete. Every realm, every standard, every battle led here — and you prevailed. The Number Realm will tell stories of you for ages.",
  };
})();
