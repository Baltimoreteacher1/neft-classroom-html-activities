/* STORY · Unit 2 · Graphic Novel #2 (Enrichment) · Master Chef Kitchen: The Recipe Rescue
   Comic-engine port. Enrichment tier: harder numbers, optional "Captain's Challenge"
   bonus rounds (non-gating, still scored), English-only (source has no Spanish),
   one PIP-voices-the-misconception beat per act. All math, answers, distractors,
   and glossary carried verbatim from graphic-novels/unit2/graphic-novel-2.html (6.NS.1).
   Protagonist = Chef (Kai / you); Companion = PIP, an over-eager kitchen bot that
   flips which number divides which ("÷ by 1/n = ÷ by n"). */
window.GN_STORY = {
  meta: {
    unit: 2,
    version: 2,
    level: "Enrichment",
    title: "Master Chef Kitchen: The Recipe Rescue",
    standard: "6.NS.1",
    assessment: "Graphic Novel U2 #2: Master Chef Kitchen: The Recipe Rescue",
    artBase: "../_art/unit2/",
    home: "../index.html",
  },

  cast: {
    chef: {
      name: "Chef",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧑‍🍳",
      avatar: null,
      blurb: "You",
    },
    pip: {
      name: "PIP",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Kitchen bot · flips which number divides which",
    },
    chef_log: { name: "Head Chef", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Kai, a young chef, strikes a hero pose in a glowing futuristic kitchen with floating order tickets",
    blurbEn:
      "The flagship restaurant Aurora is slammed on its biggest night, and every locked station now answers only to precise fraction math. As the rising chef <b>Kai</b>, you must interpret division of fractions, portion ingredients, and scale recipes under pressure — before the dinner service collapses. PIP, the kitchen bot, races to help… but it keeps flipping which number divides which. Watch for the optional <b>⭐ Chef's Challenge</b> in each act for extra credit.",
    blurbEs: "",
    startLabel: "Begin Service 🛒",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Locked Pantry",
      kicker: "Act 1 · Lesson 2-1",
      title: "The Locked Pantry",
      advanceLabel: "Open the pantry 🛒",
      steps: [
        {
          type: "beats",
          art: "kitchen-orders.png",
          alt: "Kai stands at a prep station looking at floating order tickets and a locked pantry door",
          lastLabel: "Check PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "Kai, we are buried in tickets and the pantry just locked itself. It only releases for exact fraction work — no rounding, no guesses.",
            },
            {
              who: "chef",
              en: "Then I model every ticket precisely. Dividing by a fraction means counting how many portions fit. Patch me into the lock.",
              vocab: [
                {
                  term: "Dividing by a fraction",
                  en: "Asking how many copies of the divisor fit in the dividend, or splitting into equal parts. a ÷ b/c = a × c/b.",
                  es: "Preguntar cuántas copias del divisor caben en el dividendo. a ÷ b/c = a × c/b.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "Decoded it: 5 ÷ 1/3 is just 5 ÷ 3, so it splits 5 cups into 3 equal portions. Sending the key!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "chef",
            en: "Hold PIP back — dividing by 1/3 is not dividing by 3. The reduction simmering on the pass measures <b>5 cups</b>, and each tasting spoon takes <b>1/3 cup</b>. Which statement correctly interprets <b>5 ÷ 1/3</b>?",
          },
          choices: [
            {
              en: 'It splits 5 cups into 3 equal portions of 5/3 cup each. <span class="note">(that models 5 ÷ 3, not 5 ÷ 1/3)</span>',
              correct: false,
            },
            {
              en: 'It counts how many 1/3-cup spoons fill 5 cups → 5 × 3 = 15. <span class="note">(measurement/quotative meaning of ÷ by a fraction)</span>',
              correct: true,
            },
            {
              en: 'It finds 1/3 of 5 cups, giving 5/3 cup. <span class="note">(that is 5 × 1/3, multiplication)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly. Dividing by 1/3 counts how many thirds fit: 5 ÷ 1/3 = 5 × 3 = 15 spoons.",
          badEn:
            "❌ That models a different operation. Dividing 5 by 1/3 asks how many 1/3-cup portions fit in 5 cups.",
          solveBeat: {
            who: "chef",
            en: "Interpretation locked in. Now the cipher wants the exact quotient as a mixed number. Keep, flip, multiply.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "chef",
            en: "To release the pantry, portion <b>7/8 cup</b> of glaze into <b>1/4-cup</b> brushes. Evaluate <b>7/8 ÷ 1/4</b> and report it as a mixed number.",
          },
          choices: [
            {
              en: '7/32 <span class="note">(that is 7/8 × 1/4 — multiplied instead of divided)</span>',
              correct: false,
            },
            {
              en: '3 1/2 brushes <span class="note">(7/8 × 4/1 = 28/8 = 7/2 = 3 1/2)</span>',
              correct: true,
            },
            {
              en: '4 brushes <span class="note">(that ignores the numerator 7; 7/8 ≠ 1)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ 7/8 ÷ 1/4 = 7/8 × 4/1 = 28/8 = 7/2 = 3 1/2 brushes. Pantry releasing…",
          badEn:
            "❌ Keep, flip, multiply: 7/8 × 4/1 = 28/8 = 3 1/2. Recompute and try again.",
          solveArt: "pantry-open.png",
          solveAlt:
            "The pantry door bursts open with golden light as Kai raises a fist",
          solveBeat: {
            who: "chef",
            en: "Pantry open. PIP, the captain's tasting menu hides a bonus — want to try it?",
          },
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "chef_log",
            en: "Optional: the captain's tasting menu hides a reverse-recipe puzzle. The pantry's already open, so only if you want the bonus. A chef divided a batch of dressing into <b>1/6-cup</b> ramekins and filled exactly <b>9</b> of them. How much dressing was there to start? (Think: what total ÷ 1/6 = 9?)",
          },
          choices: [
            {
              en: '54 cups <span class="note">(that is 9 × 6, ignoring the 1/6 is a SIXTH)</span>',
              correct: false,
            },
            {
              en: '1 1/2 cups <span class="note">(9 × 1/6 = 9/6 = 3/2 = 1 1/2)</span>',
              correct: true,
            },
            {
              en: '3/2 of a ramekin... wait, 1/54 cup <span class="note">(that is 9 ÷ 6 mis-set-up)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ Sharp. total ÷ 1/6 = 9 means total = 9 × 1/6 = 9/6 = 1 1/2 cups. Bonus earned!",
          badEn:
            "❌ If total ÷ 1/6 = 9, then total = 9 × 1/6 = 1 1/2 cups, not a whole-number scale-up.",
          solveBeat: {
            who: "chef",
            en: "Bonus secured. On to the big order.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Big Order",
      kicker: "Act 2 · Lesson 2-2",
      title: "The Big Order",
      advanceLabel: "Send the order ⚡",
      steps: [
        {
          type: "beats",
          art: "scaling-recipe.png",
          alt: "Kai pours flour into measuring cups while scaling up a recipe",
          lastLabel: "Check PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "Pantry's clear. Now a banquet party of dozens just walked in. We portion the pot and scale the sauces — flawlessly.",
            },
            {
              who: "chef",
              en: "Whole cups over a fraction, then a fraction over a fraction. Multiply by the reciprocal and I count exact servings.",
              vocab: [
                {
                  term: "reciprocal",
                  en: "The multiplicative inverse of a number; flip the fraction. The reciprocal of 3/4 is 4/3, and of 6 is 1/6.",
                  es: "El inverso multiplicativo; invierte la fracción. El recíproco de 3/4 es 4/3.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "9 ÷ 3/4 is just 9 ÷ 3 = 3 plates! Firing it!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "chef",
            en: "Stop, PIP — you dropped the /4. The banquet pot holds <b>9 cups</b> of risotto and each entrée plates <b>3/4 cup</b>. How many full entrées can Kai send? Evaluate <b>9 ÷ 3/4</b>.",
          },
          choices: [
            {
              en: '6 3/4 plates <span class="note">(that is 9 × 3/4 — multiplication)</span>',
              correct: false,
            },
            {
              en: '12 plates <span class="note">(9 × 4/3 = 36/3 = 12)</span>',
              correct: true,
            },
            {
              en: '3 plates <span class="note">(that is 9 ÷ 3, dropping the /4)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ 9 ÷ 3/4 = 9 × 4/3 = 36/3 = 12 entrées. Pot portioned cleanly.",
          badEn:
            "❌ Multiply by the reciprocal of 3/4: 9 × 4/3 = 12. Check your setup.",
          solveBeat: {
            who: "chef",
            en: "Risotto plated. Now I scale the cream sauce into tasting portions for the judges. Same move: keep, flip, multiply.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "chef",
            en: "A sauce recipe needs <b>2/3 cup</b> of cream, but Kai only wants to make <b>1/6-cup</b> tasting portions for the judges. How many tasting portions does one recipe yield? Evaluate <b>2/3 ÷ 1/6</b>.",
          },
          choices: [
            {
              en: '4 portions <span class="note">(2/3 × 6/1 = 12/3 = 4)</span>',
              correct: true,
            },
            {
              en: '1/9 of a portion <span class="note">(that is 2/3 × 1/6 — multiplied)</span>',
              correct: false,
            },
            {
              en: '9 portions <span class="note">(reciprocal of the wrong fraction)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ 2/3 ÷ 1/6 = 2/3 × 6/1 = 12/3 = 4 tasting portions. Sauce scaled.",
          badEn: "❌ Flip the divisor: 2/3 × 6/1 = 12/3 = 4. Recompute.",
          solveBeat: {
            who: "chef",
            en: "Sauce scaled. The judges want a mixed-number scale-down — a bonus, if you're game.",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "chef_log",
            en: "Optional: the judges want a mixed-number scale-down. The order's already out, so this one is just for the extra star. Kai has <b>2 1/2 cups</b> of broth and needs <b>5/8-cup</b> bowls. How many bowls can be filled exactly? Evaluate <b>2 1/2 ÷ 5/8</b>.",
          },
          choices: [
            {
              en: '1 9/16 bowls <span class="note">(that is 5/2 × 5/8 — multiplied)</span>',
              correct: false,
            },
            {
              en: '4 bowls <span class="note">(5/2 × 8/5 = 40/10 = 4)</span>',
              correct: true,
            },
            {
              en: '3 1/8 bowls <span class="note">(forgot to convert 2 1/2 to 5/2 first)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ Convert first: 2 1/2 = 5/2, then 5/2 × 8/5 = 40/10 = 4 bowls. Bonus earned!",
          badEn:
            "❌ Convert 2 1/2 to 5/2, then multiply by 8/5: 40/10 = 4 bowls.",
          solveBeat: {
            who: "chef",
            en: "Bonus star earned. Straight to the Final Dish.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Dish",
      kicker: "Final Dish · Boss",
      title: "The Banquet",
      advanceLabel: "Serve the banquet 🌟",
      steps: [
        {
          type: "beats",
          art: "final-banquet.png",
          alt: "Kai rolls up sleeves to face a huge glowing banquet order ticket",
          lastLabel: "Check PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "Master ticket, Kai — the banquet's signature course. One line, two portion problems, zero mistakes. Show me.",
            },
            {
              who: "chef",
              en: "Convert the mixed number, multiply by reciprocals, verify both quotients. Firing the banquet now.",
              vocab: [
                {
                  term: "mixed number",
                  en: "A whole number plus a proper fraction, like 2 1/2. Convert to an improper fraction (5/2) before dividing.",
                  es: "Un entero más una fracción propia, como 2 1/2. Conviértelo a fracción impropia (5/2) antes de dividir.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "I checked the second half: 6 ÷ 2/3 = 4 ladles. Locking the master line!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "chef",
            en: "Careful, PIP — 6 ÷ 2/3 isn't 4. The head chef hands Kai the master ticket. It needs ONE fully correct line: first portion <b>3 3/4 cups</b> of bisque into <b>1/2-cup</b> cups, then confirm how many <b>2/3-cup</b> ladles fill <b>6 cups</b>. Pick the line where BOTH results are right.",
          },
          choices: [
            {
              en: '3 3/4 ÷ 1/2 = 7 1/2 cups, &nbsp; 6 ÷ 2/3 = 4 ladles <span class="note">(first is right; 6 ÷ 2/3 = 9, not 4)</span>',
              correct: false,
            },
            {
              en: '3 3/4 ÷ 1/2 = 7 1/2 cups, &nbsp; 6 ÷ 2/3 = 9 ladles <span class="note">(15/4 × 2 = 30/4 = 7 1/2; 6 × 3/2 = 9)</span>',
              correct: true,
            },
            {
              en: '3 3/4 ÷ 1/2 = 1 7/8 cups, &nbsp; 6 ÷ 2/3 = 9 ladles <span class="note">(first multiplied instead of dividing)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Both verified: 3 3/4 ÷ 1/2 = 15/4 × 2 = 30/4 = 7 1/2 cups, and 6 ÷ 2/3 = 6 × 3/2 = 9 ladles. Banquet fired!",
          badEn:
            "❌ One quotient is off. Recheck: 15/4 × 2 = 7 1/2, and 6 × 3/2 = 9.",
          solveBeat: {
            who: "chef",
            en: "Banquet fired and both quotients verified. One optional leftover puzzle remains — take the bow, or crack it first.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "chef_log",
            en: "Optional: the banquet is already plated. Take the bow now, or crack this last puzzle first. After service, <b>3 1/3 cups</b> of soup remain. Kai pours them into <b>5/6-cup</b> staff bowls. How many full bowls, and how much soup is left over?",
          },
          choices: [
            {
              en: '4 full bowls, 0 left over <span class="note">(10/3 × 6/5 = 60/15 = 4 exactly)</span>',
              correct: true,
            },
            {
              en: '3 full bowls, 5/6 cup left <span class="note">(undercounts; 10/3 ÷ 5/6 = 4)</span>',
              correct: false,
            },
            {
              en: '2 7/9 bowls <span class="note">(that is 10/3 × 5/6 — multiplied)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ 3 1/3 = 10/3, and 10/3 ÷ 5/6 = 10/3 × 6/5 = 60/15 = 4 exactly — no leftovers. Perfect close!",
          badEn:
            "❌ Convert 3 1/3 to 10/3, then 10/3 × 6/5 = 60/15 = 4 full bowls with nothing left.",
          solveBeat: {
            who: "chef",
            en: "Leftovers reallocated, nothing wasted. Service is saved.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "➗",
      en: "Division of fractions",
      es: "división de fracciones",
      def: "Asking how many copies of the divisor fit in the dividend, or splitting into equal parts. a ÷ b/c = a × c/b.",
    },
    {
      ico: "🔄",
      en: "Reciprocal",
      es: "recíproco",
      def: "The multiplicative inverse of a number; flip the fraction. The reciprocal of 3/4 is 4/3, and of 6 is 1/6.",
    },
    {
      ico: "➡️",
      en: "Keep-Change-Flip",
      es: "Mantener-Cambiar-Invertir",
      def: "Dividing by a fraction equals multiplying by its reciprocal: 7/8 ÷ 1/4 = 7/8 × 4/1 = 7/2.",
    },
    {
      ico: "🧮",
      en: "Quotient",
      es: "cociente",
      def: "The result of division. In a measurement model it tells how many equal portions fit in the whole.",
    },
    {
      ico: "🥄",
      en: "Unit fraction",
      es: "fracción unitaria",
      def: "A fraction with numerator 1, such as 1/4 or 1/6. Dividing by 1/n is the same as multiplying by n.",
    },
    {
      ico: "🍰",
      en: "Mixed number",
      es: "número mixto",
      def: "A whole number plus a proper fraction, like 2 1/2. Convert to an improper fraction (5/2) before dividing.",
    },
    {
      ico: "📐",
      en: "Measurement (quotative) model",
      es: "modelo de medición",
      def: "Interpreting a ÷ b as 'how many groups of size b are in a' — the core meaning behind portioning servings.",
    },
    {
      ico: "⚖️",
      en: "Scaling a recipe",
      es: "escalar una receta",
      def: "Resizing every ingredient by the same factor. Dividing amounts by a portion size gives the number of servings.",
    },
    {
      ico: "✖️",
      en: "Dividend & divisor",
      es: "dividendo y divisor",
      def: "In a ÷ b, a is the dividend (the amount you have) and b is the divisor (the portion size you divide into).",
    },
    {
      ico: "✅",
      en: "Improper fraction",
      es: "fracción impropia",
      def: "A fraction whose numerator is at least its denominator (7/2, 5/2). Often the cleanest form for computing quotients.",
    },
  ],

  complete: {
    art: "celebration.png",
    alt: "Kai proudly presents a banquet of finished dishes while chef friends cheer",
    badge: "🎉🛒⭐",
    titleEn: "Service Saved — Five Stars!",
    en: "Aurora pulled off its biggest night. You interpreted division of fractions, portioned with reciprocals, and scaled every recipe with precision. The critics are raving, and the head chef just put your name on the specials board, Chef Kai.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Scale the catering order: portion <strong>4 1/2 cups</strong> of flour into small measurement containers of <strong>3/4 cup</strong> each. Solve 4 1/2 ÷ 3/4.",
      promptEs: "",
      choices: [
        {
          en: "A) 3 3/8 containers &nbsp;(multiplied instead of dividing)",
          correct: false,
        },
        {
          en: "B) 6 containers &nbsp;(9/2 × 4/3 = 6) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 8 containers &nbsp;(incorrect mixed fraction conversion)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
