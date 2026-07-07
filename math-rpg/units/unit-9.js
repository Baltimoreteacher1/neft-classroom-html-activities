/* Number Realm — Unit 9: Rational Numbers & the Coordinate Plane (6.NOS.C) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[9] = {
    id: 9,
    title: "Unit 9",
    realm: "The Coordinate Cosmos",
    standard: "6.NOS.C",
    accent: "#4338ca",
    hero: "🚀",
    tagline: "A starfield mapped by integers and coordinate pairs.",
    intro:
      "Beyond zero lies the Coordinate Cosmos — a galaxy of positive and negative worlds plotted on a grid. A gravity storm has scrambled the star charts. Navigate using integers, absolute value, and coordinate pairs to set them right.",
    chapters: [
      {
        id: "u9c1",
        title: "The Negative Nebula",
        enemy: { name: "Void Drifter", emoji: "🛸" },
        standard: "6.NOS.C.8",
        topicLabel: "Order integers & absolute value · 6.NOS.C.8",
        topics: ["integer-order", "absolute-value"],
        scene:
          "Drifters float on both sides of zero. Order the integers and measure distances from zero to steer through.",
        victory: "The nebula parts, its numbers lined up on a clean number line.",
      },
      {
        id: "u9c2",
        title: "The Four Quadrants",
        enemy: { name: "Quadrant Guardian", emoji: "🧭" },
        standard: "6.NOS.C.6",
        topicLabel: "Plot points & quadrants · 6.NOS.C.6",
        topics: ["quadrant"],
        scene:
          "A guardian patrols the four quadrants. Name where each point lands from the signs of its coordinates.",
        victory: "The guardian salutes and opens the lane between quadrants.",
      },
      {
        id: "u9c3",
        title: "The Distance Rift",
        enemy: { name: "Rift Serpent", emoji: "🐉" },
        standard: "6.NOS.C.9",
        topicLabel: "Distance on the plane · 6.NOS.C.9",
        topics: ["coordinate-distance", "absolute-value"],
        scene:
          "A serpent stretches across a rift between two points. Find the distance to leap across.",
        victory: "The rift closes as you measure the gap exactly.",
      },
      {
        id: "u9c4",
        title: "The Mirror Lake",
        enemy: { name: "Reflection Wisp", emoji: "🪞" },
        standard: "6.NOS.C.6",
        topicLabel: "Opposites & reflections · 6.NOS.C.6",
        topics: ["opposite-integer", "reflect-coordinate"],
        scene: "A still lake reflects every point across its surface. Find each opposite and reflection to cross.",
        victory: "The lake stills, every reflection perfectly placed.",
      },
    ],
    boss: {
      name: "The Gravity Storm",
      emoji: "🌌",
      subtitle: "It bends the whole coordinate plane",
      scene:
        "The Gravity Storm warps integers and coordinates together. Chart every point and distance to calm the Cosmos.",
      topics: ["integer-order", "absolute-value", "quadrant", "coordinate-distance", "opposite-integer", "reflect-coordinate"],
      victory: "The storm settles into a still, perfectly-plotted starfield.",
    },
    outro:
      "The Coordinate Cosmos is charted and calm. You can navigate any grid, positive or negative.",
  };
})();
