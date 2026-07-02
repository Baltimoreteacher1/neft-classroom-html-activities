/* Number Realm — Unit 10: Volume & Surface Area (6.G.A) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[10] = {
    id: 10,
    title: "Unit 10",
    realm: "The Solid Sanctum",
    standard: "6.G.A",
    accent: "#9333ea",
    hero: "🏛️",
    tagline: "An ancient temple built from prisms, nets, and cubes.",
    intro:
      "The Solid Sanctum is a temple of three-dimensional puzzles. Its chambers can only be opened by measuring volume and surface area. Golems of stone and folded nets guard each room. Enter, architect.",
    chapters: [
      {
        id: "u10c1",
        title: "The Prism Vault",
        enemy: { name: "Prism Golem", emoji: "🧊" },
        standard: "6.G.A.2",
        topicLabel: "Volume of prisms · 6.G.A.2",
        topics: ["volume-prism"],
        scene:
          "A blocky golem fills the vault. Length times width times height will cut it down.",
        victory: "The golem hollows out, revealing the vault's true volume.",
      },
      {
        id: "u10c2",
        title: "The Fractional Chamber",
        enemy: { name: "Sliver Sprite", emoji: "🔷" },
        standard: "6.G.A.2",
        topicLabel: "Volume with fractional edges · 6.G.A.2",
        topics: ["volume-fractional", "volume-prism"],
        scene:
          "A sprite shrinks the room's edges to fractions. Multiply carefully to keep the volume exact.",
        victory: "The chamber snaps to its precise size. The sprite fades.",
      },
      {
        id: "u10c3",
        title: "The Unfolded Hall",
        enemy: { name: "Net Weaver", emoji: "🕸️" },
        standard: "6.G.A.4",
        topicLabel: "Surface area & nets · 6.G.A.4",
        topics: ["surface-area-net", "surface-area"],
        scene:
          "A weaver unfolds the walls into flat nets. Add up all the faces to seal the hall.",
        victory: "The nets fold back into solid walls. The hall is whole.",
      },
    ],
    boss: {
      name: "The Sanctum Guardian",
      emoji: "🗿",
      subtitle: "Keeper of volume and surface area",
      scene:
        "The Guardian shifts between solids and their nets, demanding both volume and surface area. Measure it all to claim the Sanctum.",
      topics: ["volume-prism", "volume-fractional", "surface-area-net", "surface-area"],
      victory: "The Guardian bows and turns to stone. The Solid Sanctum is yours.",
    },
    outro:
      "You measured the Solid Sanctum inside and out. Volume and surface area hold no mysteries now — the Number Realm is at peace.",
  };
})();
