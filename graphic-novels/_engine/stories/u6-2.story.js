/* STORY · Unit 6 · Graphic Novel #2 (Enrichment) · Festival Producer: Power Up the Show
   Full novel on the comic engine. Enrichment tier: harder numbers, optional
   "Producer's Challenge" bonus rounds (non-gating, still scored), English-only
   (source has no Spanish), 10-term codex. All math/answers/distractors/glossary
   carried verbatim from graphic-novels/unit6/graphic-novel-2.html (6.EE.2c).
   New: panels, speech, ECHO-voices-the-misconception, vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 6,
    version: 2,
    level: "Enrichment",
    title: "Festival Producer: Power Up the Show 🎤",
    standard: "6.EE.2c",
    assessment: "Graphic Novel U6 #2: Festival Producer: Power Up the Show",
    artBase: "../_art/unit6/",
    home: "../index.html",
  },

  cast: {
    producer: {
      name: "The Producer",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🎤",
      avatar: null,
      blurb: "You",
    },
    echo: {
      name: "ECHO",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🎚️",
      avatar: null,
      blurb: "Soundboard AI · reads left-to-right, skips the power",
    },
    log: { name: "Festival Log", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Mika, a young festival producer, stands center stage at a glowing music festival with speakers and lights behind her",
    blurbEn:
      "Headliner night at the Neon Pulse Festival, and you are <b>Mika</b> — the youngest lead producer ever to run the main grid. Every stage, speaker stack, and lighting truss is locked behind a control cipher. Only sharp command of <b>powers and exponents</b>, the <b>order of operations</b>, and <b>writing algebraic expressions</b> will bring the show online before doors open. ECHO will help… but it keeps reading the math left-to-right.",
    blurbEs: "",
    startLabel: "Begin Production 🎉",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Speaker Power",
      kicker: "Act 1 · Powers & Exponents",
      title: "Speaker Power",
      advanceLabel: "Power the speaker grid 🔊",
      steps: [
        {
          type: "beats",
          art: "speaker-power.png",
          alt: "Mika studies a towering speaker stack pulsing with energy beside a holographic power gauge",
          lastLabel: "Check ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Doors open in an hour, Mika, and the speaker grid is dead. Every amplifier is locked behind a power cipher.",
            },
            {
              who: "producer",
              en: "Then I evaluate the powers exactly — exponents are repeated multiplication, not multiply-the-base-by-the-exponent. Patch me into the array.",
              vocab: [
                {
                  term: "exponents",
                  en: "The count of how many times the base is used as a factor. In 2⁴, the exponent 4 means 2×2×2×2.",
                },
              ],
            },
            {
              who: "echo",
              misconception: true,
              en: "I've got the amplifier: 4³ is just 4 × 3 = 12. Sending 12 to the array!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "producer",
            en: "Hold ECHO back — that skips the power. The amplifier array is rated at <b>4<sup>3</sup></b> watts per cluster. Which value equals the power 4<sup>3</sup>?",
          },
          choices: [
            {
              en: "12",
              tree: "(that is 4 × 3, not 4³)",
              correct: false,
            },
            {
              en: "64",
              tree: "(4 × 4 × 4 = 64)",
              correct: true,
            },
            {
              en: "16",
              tree: "(that is 4², the exponent is too small)",
              correct: false,
            },
          ],
          goodEn: "✅ Correct. 4³ = 4×4×4 = 64. Amplifier array decrypted.",
          badEn:
            "❌ An exponent is repeated multiplication. 4³ = 4×4×4 = 64, not 4×3 and not 4².",
          solveBeat: {
            who: "producer",
            en: "Amplifiers live. The lighting truss cipher hides a power inside an expression — exponent first, then multiply. On it.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "producer",
            en: "The lighting truss draws <b>2<sup>4</sup> × 3</b> amps. Evaluate it: handle the <b>exponent first</b>, then multiply.",
          },
          choices: [
            {
              en: "24",
              tree: "(used 2 × 4 = 8, then ×3)",
              correct: false,
            },
            {
              en: "48",
              tree: "(2⁴ = 16, then 16 × 3 = 48)",
              correct: true,
            },
            {
              en: "96",
              tree: "((2 × 3)⁴ — wrong, only 2 is raised)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Sharp. 2⁴ = 16 first, then 16×3 = 48. Only the 2 is raised, not the whole product. SPEAKER GRID ONLINE!",
          badEn:
            "❌ Evaluate the exponent before multiplying: 2⁴ = 16, then ×3. Only the base 2 is raised to the 4th.",
          solveArt: "stage-lit.png",
          solveAlt:
            "The stage blazes to life with lights and lasers as Mika powers the grid",
          solveBeat: {
            who: "producer",
            en: "Speaker grid online. There's an encore battery I could charge with a sum of two powers — optional, but I'm curious.",
          },
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Producer's Challenge",
          ask: {
            who: "log",
            en: "Optional: there's an encore battery you could charge with a sum of two powers. Totally up to you — the show is already powered. The backup generator number is <b>2<sup>3</sup> + 3<sup>2</sup></b>. Evaluate this sum of two powers to charge the encore battery.",
          },
          choices: [
            {
              en: "25",
              tree: "((2 + 3)² — you cannot combine the bases)",
              correct: false,
            },
            {
              en: "17",
              tree: "(8 + 9 = 17)",
              correct: true,
            },
            {
              en: "13",
              tree: "(used 2×3 + 3×2 — not powers)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Nice. 2³ + 3² = 8 + 9 = 17. Encore battery charged — bonus cleared.",
          badEn:
            "❌ Evaluate each power separately, then add: 2³ = 8 and 3² = 9, so 8 + 9 = 17.",
          solveBeat: {
            who: "producer",
            en: "Encore battery charged. On to the stage budget.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Stage & Lights",
      kicker: "Act 2 · Evaluate & Write Expressions",
      title: "Stage & Lights",
      advanceLabel: "Light the stages ✨",
      steps: [
        {
          type: "beats",
          art: "expression-build.png",
          alt: "Mika arranges glowing holographic blocks into an expression at a mixing console",
          lastLabel: "Check ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Grid is hot. Now the money: the stage build is a multi-step expression and one wrong step blows the budget.",
            },
            {
              who: "producer",
              en: "Grouping first, then the exponent, then multiply, then add. I keep the order or the numbers lie to me.",
              vocab: [
                {
                  term: "order",
                  en: "Order of operations: evaluate grouping symbols, then exponents, then multiply/divide left to right, then add/subtract left to right.",
                },
              ],
            },
            {
              who: "echo",
              misconception: true,
              en: "I'll just go left to right: 4 + 3 = 7, then 7 × (6−2)² … that's 112. Logging 112!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "producer",
            en: "Slow down, ECHO — that adds before squaring. The main-stage build cost is <b>4 + 3 × (6 − 2)<sup>2</sup></b>. Evaluate it with the order of operations: <b>grouping</b>, then <b>exponent</b>, then <b>multiply</b>, then <b>add</b>.",
          },
          choices: [
            {
              en: "112",
              tree: "(added 4 + 3 before squaring — wrong order)",
              correct: false,
            },
            {
              en: "52",
              tree: "((6−2)=4, 4²=16, 3×16=48, 4+48=52)",
              correct: true,
            },
            {
              en: "100",
              tree: "(squared 6−2 wrong, or multiplied too early)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly. (6−2)=4, 4²=16, 3×16=48, then 4+48 = 52. Budget locked.",
          badEn:
            "❌ Follow the order: do the parentheses, then square, then multiply, then add. (6−2)² = 16, 3×16 = 48, 4+48 = 52.",
          solveBeat: {
            who: "producer",
            en: "Build cost locked in. Now I translate the lighting order into an algebraic expression — per-light cost, a flat fee, doubled for two stages.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "producer",
            en: "You rent <b>5 spotlights</b> at <b>d</b> dollars each, then add a flat <b>$50</b> rigging fee. Because there are <b>two identical stages</b>, the whole package is <b>doubled</b>. Which <b>algebraic expression</b> gives the total cost?",
            vocab: [
              {
                term: "algebraic expression",
                en: "A combination of numbers, variables, and operations with no equals sign, such as 2(5d + 50).",
              },
            ],
          },
          choices: [
            {
              en: "2 × 5d + 50",
              tree: "(only the lights got doubled, not the fee)",
              correct: false,
            },
            {
              en: "2(5d + 50)",
              tree: "(double the full per-stage cost)",
              correct: true,
            },
            {
              en: "10d + 50",
              tree: "(doubled the lights but forgot to double the fee)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right. One stage costs 5d + 50, and two identical stages double the whole package: 2(5d + 50). LIGHTING ORDER PLACED!",
          badEn:
            "❌ Both the lights and the fee belong to one stage, and BOTH double. Group the per-stage cost first: 2(5d + 50).",
          solveBeat: {
            who: "producer",
            en: "Lighting order placed. There's an optional crew manifest puzzle if I want it.",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Producer's Challenge",
          ask: {
            who: "log",
            en: "Optional manifest puzzle if you want it: model the whole crew count with one expression. Skip it freely — the stages are paid. <b>n</b> headline acts each bring <b>3</b> crew members, and there are always <b>2</b> solo performers with no crew. Write the expression for the total number of people on the manifest.",
          },
          choices: [
            {
              en: "3 + 2n",
              tree: "(the 3 crew go with each act, so it is 3n)",
              correct: false,
            },
            {
              en: "3n + 2",
              tree: "(3 crew per act, plus the 2 solos)",
              correct: true,
            },
            {
              en: "5n",
              tree: "(you cannot combine 3n and a constant 2)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Yes. 3 crew for each of n acts is 3n, plus the 2 solo performers: 3n + 2. Manifest complete — bonus cleared.",
          badEn:
            "❌ The 3 crew attach to EACH act, so that part is 3n. The 2 solos are a separate constant: 3n + 2.",
          solveBeat: {
            who: "producer",
            en: "Manifest complete. The Headliner is next.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Show",
      kicker: "Final Show · Boss",
      title: "The Headliner",
      advanceLabel: "Launch the headliner 🌟",
      steps: [
        {
          type: "beats",
          art: "final-show.png",
          alt: "Mika at the master control booth ready to start the headliner show",
          lastLabel: "Check ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Headliner in sixty seconds. The master override fuses a power with the full order of operations — one clean evaluation.",
            },
            {
              who: "producer",
              en: "Power, grouping, multiply, add — in order, no slips. Standing by to launch the show.",
            },
            {
              who: "echo",
              misconception: true,
              en: "I'll start the override: 3³ is just 3 × 3 = 9, so 9 + 2 × (8−3) … I make it 47. Entering 47!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "producer",
            en: "Careful, ECHO — 3³ is not 3×3. The master grid demands the value of <b>3<sup>3</sup> + 2 × (8 − 3)</b>. Evaluate fully: grouping, then the power, then multiply, then add.",
          },
          choices: [
            {
              en: "47",
              tree: "(used 3×3=9 instead of 3³, or wrong order)",
              correct: false,
            },
            {
              en: "37",
              tree: "(3³=27, (8−3)=5, 2×5=10, 27+10=37)",
              correct: true,
            },
            {
              en: "145",
              tree: "(added before multiplying — not allowed)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Override accepted. 3³=27, (8−3)=5, 2×5=10, then 27+10 = 37. Master grid is yours.",
          badEn:
            "❌ One step slipped. 3³ = 27 (not 9), then (8−3)=5, 2×5=10, and finally 27+10 = 37.",
          solveBeat: {
            who: "producer",
            en: "Override accepted. There's one last optional cipher — the VIP revenue model.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Producer's Final Challenge",
          ask: {
            who: "log",
            en: "Optional: the headliner is already cleared to go; skip anytime. VIP revenue is modeled as <b>4<sup>3</sup> × 5 − 100</b>: each VIP package earns 4<sup>3</sup> dollars, there are 5 VIPs, and a flat $100 platform fee is subtracted. Write the value of the expression.",
          },
          choices: [
            {
              en: "220",
              tree: "(4³=64, 64×5=320, 320−100=220)",
              correct: true,
            },
            {
              en: "280",
              tree: "(subtracted 100 before multiplying by 5)",
              correct: false,
            },
            {
              en: "60",
              tree: "(used 4×3=12, 12×5=60, forgot the fee)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Clean cipher. 4³=64, 64×5=320, 320−100 = 220. VIP revenue verified — bonus cleared!",
          badEn:
            "❌ Multiply before subtracting: 4³=64, 64×5=320, then subtract the fee: 320−100 = 220.",
          solveBeat: {
            who: "producer",
            en: "VIP revenue verified. Launch the headliner!",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "❮❯",
      en: "Power",
      def: "An expression of the form base^exponent representing repeated multiplication. 4³ = 4×4×4 = 64.",
    },
    {
      ico: "🔢",
      en: "Base",
      def: "The factor being repeatedly multiplied in a power. In 2⁴, the base is 2.",
    },
    {
      ico: "⬆️",
      en: "Exponent",
      def: "The count of how many times the base is used as a factor. In 2⁴, the exponent 4 means 2×2×2×2.",
    },
    {
      ico: "🧮",
      en: "Order of operations",
      def: "Evaluate in order: grouping symbols, then exponents, then multiply/divide left to right, then add/subtract left to right.",
    },
    {
      ico: "📝",
      en: "Algebraic expression",
      def: "A combination of numbers, variables, and operations with no equals sign, such as 2(5d + 50).",
    },
    {
      ico: "🏷️",
      en: "Variable",
      def: "A symbol that represents an unknown or changing quantity, such as n or d.",
    },
    {
      ico: "✕",
      en: "Coefficient",
      def: "The numerical factor multiplied by a variable. In 3n, the coefficient is 3.",
    },
    {
      ico: "➕",
      en: "Term",
      def: "A single number, variable, or product separated by + or −. In 3n + 2 the terms are 3n and 2.",
    },
    {
      ico: "()",
      en: "Grouping symbols",
      def: "Parentheses or brackets that tell you to evaluate what is inside first, e.g. (6 − 2)².",
    },
    {
      ico: "▢",
      en: "Distributive property",
      def: "a(b + c) = ab + ac. So 2(5d + 50) = 10d + 100, doubling every part inside.",
    },
  ],

  complete: {
    art: "celebration.png",
    alt: "Mika celebrates with arms raised as the festival crowd cheers under fireworks and lights",
    badge: "🎉🎤⭐",
    titleEn: "Headliner Live — Show Complete!",
    en: "The Neon Pulse Festival is fully online. You evaluated <b>powers and exponents</b> to charge the grid, applied the <b>order of operations</b> to multi-step budgets, and <b>wrote algebraic expressions</b> to model crews, costs, and revenue. The crowd is roaring. Command logged a commendation, Producer Mika.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Festival amplifier: Evaluate the multi-variable algebraic expression <strong>2x² - 3y</strong> when <strong>x = 3 and y = 2</strong>.",
      promptEs: "",
      choices: [
        {
          en: "A) 6 &nbsp;(calculated 2 × 3 × 2 − 6)",
          correct: false,
        },
        {
          en: "B) 12 &nbsp;(2(3²) − 3(2) = 18 − 6 = 12) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 30 &nbsp;(calculated (2 × 3)² − 6)",
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
