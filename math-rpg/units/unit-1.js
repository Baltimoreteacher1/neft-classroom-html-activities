/* Number Realm — Unit 1: Number Sense (6.NS) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[1] = {
    id: 1,
    title: "Unit 1",
    realm: "The Foundry of Factors",
    standard: "6.NS",
    accent: "#475569",
    hero: "🧭",
    tagline: "Deep beneath the mountains, numbers are forged from their factors.",
    intro:
      "The great Foundry that forges every number has jammed. Composite golems roam the tunnels, decimals leak from cracked pipes. Only a hero who understands factors, multiples, and place value can restart the machines. Grab your lantern — the Foundry awaits.",
    chapters: [
      {
        id: "u1c1",
        title: "The Factor Golems",
        enemy: { name: "Factor Golem", emoji: "🪨" },
        standard: "6.NS.B.4",
        topicLabel: "GCF & LCM · 6.NS.B.4",
        topics: ["gcf", "lcm"],
        scene:
          "Two stone golems block the tunnel, each stamped with a number. Split them apart by finding what they share — and what they multiply into.",
        victory: "The golems crumble into neat piles of factors. The path opens.",
      },
      {
        id: "u1c2",
        title: "The Prime Vein",
        enemy: { name: "Prime Wraith", emoji: "👻" },
        standard: "6.NS.B.4",
        topicLabel: "Prime factorization · 6.NS.B.4",
        topics: ["prime-factorization", "gcf"],
        scene:
          "A shimmering wraith made of composite numbers hovers over a vein of pure primes. Break it down to its prime parts to banish it.",
        victory: "Reduced to primes, the wraith dissolves into glowing 2s, 3s, and 5s.",
      },
      {
        id: "u1c3",
        title: "The Leaking Pipes",
        enemy: { name: "Decimal Slime", emoji: "🫧" },
        standard: "6.NS.B.3",
        topicLabel: "Decimal operations · 6.NS.B.3",
        topics: ["decimal-ops", "divide-multidigit"],
        scene:
          "Slime oozes from cracked pipes, dripping decimals everywhere. Line up the decimal points and seal the leaks.",
        victory: "Every pipe seals with a satisfying click. The Foundry hums back to life.",
      },
    ],
    boss: {
      name: "The Overclocked Engine",
      emoji: "⚙️",
      subtitle: "Master of factors, multiples, and place value",
      scene:
        "The Foundry's core engine has overclocked, firing number-puzzles in every form at once. Use everything you've learned to bring it back into balance.",
      topics: ["gcf", "lcm", "prime-factorization", "decimal-ops", "divide-multidigit"],
      victory: "The engine settles into a steady rhythm. Numbers flow cleanly once more.",
    },
    outro:
      "The Foundry of Factors runs true again, and you understand how every number is built. On to the next realm!",
  };
})();
