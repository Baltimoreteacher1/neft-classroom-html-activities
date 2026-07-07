/* Number Realm — Unit 0: Standards Catch-Up (readiness bridge) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[0] = {
    id: 0,
    title: "Unit 0",
    realm: "The Gateway Gardens",
    standard: "Grade 6 Readiness",
    accent: "#0d9488",
    hero: "🌱",
    tagline: "Where every new adventurer trains before entering the realms.",
    intro:
      "Before the great realms open to you, the Gateway Gardens test your foundations: whole-number division, decimals, factors, and a first taste of ratios and area. Warm up here, earn your first gold, and grow strong enough for the journey ahead.",
    chapters: [
      {
        id: "u0c1",
        title: "The Training Dummies",
        enemy: { name: "Straw Golem", emoji: "🎯" },
        standard: "6.NOS",
        topicLabel: "Whole numbers & decimals",
        topics: ["divide-multidigit", "decimal-ops"],
        scene: "A friendly straw golem lets you practice your strikes. Warm up with division and decimals.",
        victory: "The straw golem gives an approving nod. You're finding your rhythm.",
        hitsToWin: 4,
      },
      {
        id: "u0c2",
        title: "The Factor Fountain",
        enemy: { name: "Bubbling Sprite", emoji: "💧" },
        standard: "6.NOS.B.4",
        topicLabel: "Factors & multiples",
        topics: ["gcf", "lcm"],
        scene: "A sprite splashes number-bubbles from the fountain. Pop them by finding factors and multiples.",
        victory: "The fountain settles into a calm, clear pool.",
        hitsToWin: 4,
      },
      {
        id: "u0c3",
        title: "The Sampler's Path",
        enemy: { name: "Curious Fox", emoji: "🦊" },
        standard: "6.AT / 6.GR",
        topicLabel: "A taste of ratios & area",
        topics: ["ratio-basic", "area-triangle"],
        scene: "A clever fox offers a taste of what's to come — a ratio here, an area there.",
        victory: "The fox grins and trots off toward the wider realms.",
        hitsToWin: 4,
      },
    ],
    boss: {
      name: "The Gatekeeper",
      emoji: "🗝️",
      subtitle: "Guardian of the realms' entrance",
      scene:
        "The Gatekeeper blocks the road to the ten realms, testing a little of everything you've warmed up on. Prove you're ready.",
      topics: ["divide-multidigit", "decimal-ops", "gcf", "ratio-basic", "area-triangle"],
      victory: "The Gatekeeper swings the great doors wide. The Number Realm awaits!",
      hitsToWin: 6,
    },
    outro:
      "You're warmed up and ready. Every realm ahead builds on these foundations — go claim them.",
  };
})();
