/* Number Realm — Unit 5: Area (6.G.A.1) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[5] = {
    id: 5,
    title: "Unit 5",
    realm: "The Tiled Territories",
    standard: "6.G.A.1",
    accent: "#15803d",
    hero: "🛡️",
    tagline: "Endless fields that must be measured before they can be claimed.",
    intro:
      "The Tiled Territories stretch out in triangles, parallelograms, and trapezoids. Wild shapes have overgrown the borders. Reclaim the land by calculating area — the true measure of every field.",
    chapters: [
      {
        id: "u5c1",
        title: "The Slanted Fields",
        enemy: { name: "Parallelo-Beast", emoji: "🟩" },
        standard: "6.G.A.1",
        topicLabel: "Area of parallelograms · 6.G.A.1",
        topics: ["area-parallelogram"],
        scene:
          "A beast shaped like a leaning field charges. Base times height will fence it in.",
        victory: "The beast flattens into a neatly measured plot.",
      },
      {
        id: "u5c2",
        title: "The Three-Cornered Grove",
        enemy: { name: "Triangle Treant", emoji: "🌲" },
        standard: "6.G.A.1",
        topicLabel: "Area of triangles · 6.G.A.1",
        topics: ["area-triangle"],
        scene:
          "A treant with three-sided leaves blocks the grove. Remember: half of base times height.",
        victory: "The treant settles into the soil, its area finally known.",
      },
      {
        id: "u5c3",
        title: "The Trapezoid Marsh",
        enemy: { name: "Marsh Wyrm", emoji: "🐊" },
        standard: "6.G.A.1",
        topicLabel: "Trapezoids & composite figures · 6.G.A.1",
        topics: ["area-trapezoid", "area-composite"],
        scene:
          "A wyrm lurks in a marsh of odd shapes. Split them apart or average the bases to drain it.",
        victory: "The marsh drains, revealing solid, measurable ground.",
      },
    ],
    boss: {
      name: "The Land-Shaper",
      emoji: "🗺️",
      subtitle: "Sculptor of every figure",
      scene:
        "The Land-Shaper reshapes the ground into every figure at once — parallelograms, triangles, trapezoids, and composites. Measure them all to hold the territory.",
      topics: ["area-parallelogram", "area-triangle", "area-trapezoid", "area-composite"],
      victory: "The land settles into a perfect patchwork of measured fields.",
    },
    outro:
      "Every field in the Tiled Territories is measured and claimed. You see area in everything now.",
  };
})();
