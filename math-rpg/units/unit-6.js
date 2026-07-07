/* Number Realm — Unit 6: Expressions (6.AT) */
(function () {
  window.MRPG_UNITS = window.MRPG_UNITS || {};
  window.MRPG_UNITS[6] = {
    id: 6,
    title: "Unit 6",
    realm: "Variable Vale",
    standard: "6.AT.B",
    accent: "#6d28d9",
    hero: "🧙",
    tagline: "A misty valley where letters stand in for numbers.",
    intro:
      "In Variable Vale, spells are written as expressions and the letter x hides a secret value. Chaos spirits scramble the symbols. Restore order by writing, evaluating, and simplifying expressions like a true math-mage.",
    chapters: [
      {
        id: "u6c1",
        title: "The Power Grove",
        enemy: { name: "Exponent Imp", emoji: "🔺" },
        standard: "6.AT.B.5",
        topicLabel: "Exponents & evaluating · 6.AT.B.5–2",
        topics: ["exponents", "evaluate-expression"],
        scene:
          "An imp multiplies itself over and over. Evaluate the powers to shrink it back down.",
        victory: "The imp collapses to a single base. The grove clears.",
      },
      {
        id: "u6c2",
        title: "The Translator's Bridge",
        enemy: { name: "Word Wisp", emoji: "💬" },
        standard: "6.AT.B.6",
        topicLabel: "Write algebraic expressions · 6.AT.B.6",
        topics: ["write-expression", "evaluate-expression"],
        scene:
          "A wisp speaks only in words. Translate each phrase into symbols to answer back.",
        victory: "The wisp glows, finally understood, and lights the bridge.",
      },
      {
        id: "u6c3",
        title: "The Distributive Den",
        enemy: { name: "Bracket Beast", emoji: "🧷" },
        standard: "6.AT.B.7",
        topicLabel: "Distribute & combine like terms · 6.AT.B.7–4",
        topics: ["distributive", "combine-like-terms"],
        scene:
          "A beast hides behind parentheses. Distribute to expose it, then combine like terms to bind it.",
        victory: "The brackets snap open and the beast simplifies away.",
      },
      {
        id: "u6c4",
        title: "The Order Obelisk",
        enemy: { name: "Sequence Specter", emoji: "🗿" },
        standard: "6.AT.B.6 / 6.AT.D.11",
        topicLabel: "Order of operations & variables · 6.AT",
        topics: ["order-of-operations", "dependent-variable"],
        scene: "An ancient obelisk carved with expressions demands you evaluate them in the correct order.",
        victory: "The carvings glow in sequence. The specter dissolves.",
      },
    ],
    boss: {
      name: "The Equivalence Sphinx",
      emoji: "🦉",
      subtitle: "Keeper of equivalent expressions",
      scene:
        "The Sphinx tests whether you truly understand expressions — writing, evaluating, distributing, and simplifying, all at once. Prove your mastery.",
      topics: ["exponents", "evaluate-expression", "write-expression", "distributive", "combine-like-terms", "order-of-operations", "dependent-variable"],
      victory: "The Sphinx nods: your expressions are elegant and equivalent. The Vale clears.",
    },
    outro:
      "The mists of Variable Vale part. You can bend expressions to your will.",
  };
})();
