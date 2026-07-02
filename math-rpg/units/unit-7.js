/* Number Realm — Unit 7: Equations & Inequalities (6.EE.B) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[7] = {
    id: 7,
    title: "Unit 7",
    realm: "The Balance Citadel",
    standard: "6.EE.B",
    accent: "#be123c",
    hero: "⚔️",
    tagline: "A fortress that stands only while both sides stay equal.",
    intro:
      "The Balance Citadel is held up by giant scales — every equation must stay level. A saboteur has tipped them. Restore balance by solving equations and writing inequalities, keeping both sides fair.",
    chapters: [
      {
        id: "u7c1",
        title: "The Tipping Scales",
        enemy: { name: "Scale Sentinel", emoji: "⚖️" },
        standard: "6.EE.B.7",
        topicLabel: "One-step equations · 6.EE.B.7",
        topics: ["one-step-equation"],
        scene:
          "A sentinel guards a tilted scale. Do the same to both sides to level it and solve for x.",
        victory: "The scale clicks level. The sentinel salutes and stands down.",
      },
      {
        id: "u7c2",
        title: "The Story Gate",
        enemy: { name: "Riddle Warden", emoji: "🗝️" },
        standard: "6.EE.B.7",
        topicLabel: "Write equations from stories · 6.EE.B.7",
        topics: ["write-equation", "one-step-equation"],
        scene:
          "A warden speaks in story problems. Turn each tale into an equation to open the gate.",
        victory: "The gate swings wide, each word turned into clean algebra.",
      },
      {
        id: "u7c3",
        title: "The Boundary Wall",
        enemy: { name: "Inequality Ogre", emoji: "🪧" },
        standard: "6.EE.B.8",
        topicLabel: "Inequalities · 6.EE.B.8",
        topics: ["inequality", "one-step-equation"],
        scene:
          "An ogre patrols a wall marked with 'greater than' and 'less than'. Choose the right inequality to pass.",
        victory: "The ogre grunts approval and lowers the boundary.",
      },
    ],
    boss: {
      name: "The Grand Saboteur",
      emoji: "🃏",
      subtitle: "The one who tipped the scales",
      scene:
        "The Saboteur throws equations and inequalities from every direction. Keep every scale balanced to save the Citadel.",
      topics: ["one-step-equation", "write-equation", "inequality"],
      victory: "Every scale locks level at once. The Citadel stands firm and fair.",
    },
    outro:
      "The Balance Citadel is stable again. You know how to keep both sides equal — and when they aren't.",
  };
})();
