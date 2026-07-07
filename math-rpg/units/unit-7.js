/* Number Realm — Unit 7: Equations & Inequalities (6.AT.C) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[7] = {
    id: 7,
    title: "Unit 7",
    realm: "The Balance Citadel",
    standard: "6.AT.C",
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
        standard: "6.AT.C.8",
        topicLabel: "One-step equations · 6.AT.C.8",
        topics: ["one-step-equation"],
        scene:
          "A sentinel guards a tilted scale. Do the same to both sides to level it and solve for x.",
        victory: "The scale clicks level. The sentinel salutes and stands down.",
      },
      {
        id: "u7c2",
        title: "The Story Gate",
        enemy: { name: "Riddle Warden", emoji: "🗝️" },
        standard: "6.AT.C.8",
        topicLabel: "Write equations from stories · 6.AT.C.8",
        topics: ["write-equation", "one-step-equation"],
        scene:
          "A warden speaks in story problems. Turn each tale into an equation to open the gate.",
        victory: "The gate swings wide, each word turned into clean algebra.",
      },
      {
        id: "u7c3",
        title: "The Boundary Wall",
        enemy: { name: "Inequality Ogre", emoji: "🪧" },
        standard: "6.AT.C.9",
        topicLabel: "Inequalities · 6.AT.C.9",
        topics: ["inequality", "one-step-equation"],
        scene:
          "An ogre patrols a wall marked with 'greater than' and 'less than'. Choose the right inequality to pass.",
        victory: "The ogre grunts approval and lowers the boundary.",
      },
      {
        id: "u7c4",
        title: "The Solution Set",
        enemy: { name: "Boundless Shade", emoji: "♾️" },
        standard: "6.AT.C.9",
        topicLabel: "Inequality solutions · 6.AT.C.9",
        topics: ["inequality-solution", "inequality"],
        scene: "A shade tests whether you truly know which numbers satisfy an inequality. Choose a real solution.",
        victory: "The shade's boundary snaps into a clear solution set.",
      },
    ],
    boss: {
      name: "The Grand Saboteur",
      emoji: "🃏",
      subtitle: "The one who tipped the scales",
      scene:
        "The Saboteur throws equations and inequalities from every direction. Keep every scale balanced to save the Citadel.",
      topics: ["one-step-equation", "write-equation", "inequality", "inequality-solution"],
      victory: "Every scale locks level at once. The Citadel stands firm and fair.",
    },
    outro:
      "The Balance Citadel is stable again. You know how to keep both sides equal — and when they aren't.",
  };
})();
