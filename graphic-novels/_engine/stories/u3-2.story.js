/* STORY · Unit 3 · Graphic Novel #2 (Enrichment) · Global Travel Planner
   Comic-engine port. Full novel — Act 1 (Paris Ratios), Act 2 (Tokyo Tables),
   Final (Master Gateway), Glossary, Expedition Complete + Master-Rank challenge.
   Enrichment tier: harder numbers, optional "Globetrotter Challenge" bonus rounds
   (non-gating, still scored), English-only (source has no Spanish), 10-term codex.
   All math/answers/distractors/glossary carried verbatim from
   graphic-novels/unit3/graphic-novel-2.html (6.RP.3a). Protagonist = The Traveler
   (you, "Maya"); companion = COMPASS, a travel drone that compares raw totals
   instead of the ratio/rate. */
window.GN_STORY = {
  meta: {
    unit: 3,
    version: 2,
    level: "Enrichment",
    title: "Global Travel Planner",
    standard: "6.RP.3a",
    assessment: "Graphic Novel U3 #2: Global Travel Planner",
    artBase: "../_art/unit3/",
    home: "../index.html",
  },

  cast: {
    traveler: {
      name: "Maya",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧭",
      avatar: null,
      blurb: "You",
    },
    compass: {
      name: "COMPASS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🛸",
      avatar: null,
      blurb: "Travel drone · grabs the bigger total, not the unit rate",
    },
    log: { name: "Expedition AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya, a young travel planner, stands on a giant glowing globe holding a travel map with airplane trails arcing between landmarks",
    blurbEn:
      "Maya has won a contest: plan one perfect <b>around-the-world</b> expedition. But every destination is sealed behind a ratio cipher. Reason with <b>ratios</b>, <b>unit rates</b>, and <b>ratio tables</b> &mdash; and graph them &mdash; to chart the route and unlock the world. COMPASS will help… but it keeps grabbing the bigger total instead of the rate. Each act also hides an optional <b>⭐ Globetrotter Challenge</b> for extra glory.",
    blurbEs: "",
    startLabel: "Begin the Expedition ✈️",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Paris Ratios",
      kicker: "Act 1 · Understand Ratios",
      title: "Paris: Reason with Ratios",
      advanceLabel: "Fly to Tokyo ✈️",
      steps: [
        {
          type: "beats",
          art: "ratios-compare.png",
          alt: "Maya stands before the Eiffel Tower holding passports with a glowing ratio comparison floating beside her",
          lastLabel: "Decode ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Maya, you have arrived in Paris. The first cipher demands an equivalent ratio &mdash; same comparison, leaner form.",
            },
            {
              who: "traveler",
              en: "Equivalent ratios scale together. I'll divide both parts by their common factor and prove it's the same comparison.",
              vocab: [
                {
                  term: "equivalent ratio",
                  en: "Ratios that name the same comparison; multiply or divide both terms by the same nonzero number. 4:6 = 2:3 = 12:18.",
                },
              ],
            },
            {
              who: "compass",
              misconception: true,
              en: "4 crew and 6 travelers — bigger numbers feel safer, so I'll scale UP to 4 : 12. The travelers doubled!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "log",
            en: "The expedition manifest lists <b>4 crew for every 6 travelers</b>. Which ratio is <b>equivalent</b> (the same comparison written a different way)?",
          },
          choices: [
            {
              en: "6 : 9",
              tree: "(that is 2:3 of travelers:?, wrong order)",
              correct: false,
            },
            {
              en: "2 : 3",
              tree: "(divide both 4 and 6 by 2)",
              correct: true,
            },
            {
              en: "4 : 12",
              tree: "(only the travelers doubled)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct. 4:6 divides by 2 to give 2:3 &mdash; the same comparison. Cipher one cracked.",
          badEn:
            "❌ That changes the comparison. Divide BOTH 4 and 6 by their common factor 2 → 2:3.",
          solveBeat: {
            who: "traveler",
            en: "Cipher cracked. Now I need a unit rate to compare offers fairly &mdash; everything per single unit.",
          },
        },
        {
          type: "beats",
          art: "ratios-compare.png",
          alt: "Maya studies a glowing shuttle gauge showing kilometers and liters of fuel in Paris",
          lastLabel: "Find the rate ▶",
          beats: [
            {
              who: "compass",
              misconception: true,
              en: "18 km and 3 liters? I'll just take the difference: 18 − 3 = 15 km per liter!",
              vocab: [
                {
                  term: "unit rate",
                  en: "A rate per single unit of the second quantity, e.g. 80 km per 1 hour from 240 km in 3 hours.",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "traveler",
            en: "The shuttle covers <b>18 km using 3 liters</b> of fuel. To compare offers, Maya needs the <b>unit rate</b>: kilometers per <b>1 liter</b>. What is it?",
          },
          choices: [
            {
              en: "3 km per liter",
              tree: "(that divides the wrong way)",
              correct: false,
            },
            {
              en: "6 km per liter",
              tree: "(18 ÷ 3 = 6)",
              correct: true,
            },
            {
              en: "15 km per liter",
              tree: "(that is 18 − 3)",
              correct: false,
            },
          ],
          goodEn: "✅ Unit rate = 18 ÷ 3 = 6 km per liter. PARIS UNLOCKED!",
          badEn:
            "❌ A unit rate is per ONE liter: divide km by liters, 18 ÷ 3 = 6.",
          solveArt: "unlock.png",
          solveAlt: "A glowing gateway opens to reveal pyramids as Maya cheers",
          solveBeat: {
            who: "traveler",
            en: "Paris is open and the route to the pyramids is lit. But the cache outside the Louvre tempts me first…",
          },
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Globetrotter Challenge",
          ask: {
            who: "log",
            en: "Optional: two taxis are bidding for your fare. App A: <b>$24 for 8 km</b>. App B: <b>$15 for 5 km</b>. Using unit rates (price per km), which is the better deal &mdash; or are they the same? Skip it any time and still fly on.",
          },
          choices: [
            {
              en: "App A is cheaper",
              tree: "($24÷8 = $3/km vs $15÷5 = $3/km)",
              correct: false,
            },
            {
              en: "They cost the same",
              tree: "both are $3 per km",
              correct: true,
            },
            {
              en: "App B is cheaper",
              tree: "(check both unit rates again)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Sharp. App A = $24÷8 = $3/km, App B = $15÷5 = $3/km &mdash; identical. Bonus earned!",
          badEn:
            "❌ Compute each price per km: $24÷8 and $15÷5. Compare those unit rates.",
          solveBeat: {
            who: "traveler",
            en: "Both fares are equal — picked the closer one. On to Tokyo.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Tokyo Tables",
      kicker: "Act 2 · Ratio Tables & Graphs",
      title: "Tokyo: Tables & the Graph",
      advanceLabel: "Fly to Egypt ✈️",
      steps: [
        {
          type: "beats",
          art: "ratio-table.png",
          alt: "Maya draws a glowing ratio table and a rising line graph in the air on a Tokyo street",
          lastLabel: "Scale the table ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Tokyo, online. Tickets require a ratio table scaled to your exact itinerary &mdash; and then a graph to prove it.",
            },
            {
              who: "traveler",
              en: "Find the unit rate, scale the table by it, then plot the pairs. Constant ratio means a straight line through the origin.",
              vocab: [
                {
                  term: "ratio table",
                  en: "A table of equivalent ratios; scale rows by multiplying both quantities by the same factor.",
                },
              ],
            },
            {
              who: "compass",
              misconception: true,
              en: "400 km was the last total, and 7 is two more hours — so I'll just add 140 to get 540 km!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "traveler",
            en: "The bullet train logs <b>240 km in 3 hours</b> at a steady speed. Complete the ratio table for <b>7 hours</b>. <br><br>Hours: 1, 3, 5, 7 → Km: 80, 240, 400, ?",
          },
          choices: [
            {
              en: "540 km",
              tree: "(added 140, not the unit rate)",
              correct: false,
            },
            {
              en: "560 km",
              tree: "(unit rate 240÷3 = 80, so 7×80)",
              correct: true,
            },
            {
              en: "480 km",
              tree: "(that is 6 hours)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Unit rate = 240÷3 = 80 km/hr, so 7×80 = 560 km. Table scaled.",
          badEn:
            "❌ Find the unit rate first: 240÷3 = 80 km/hr, then multiply by 7.",
          solveBeat: {
            who: "traveler",
            en: "Table scaled. Now I confirm a point lands exactly on that line. If the ratio holds, the graph won't lie.",
          },
        },
        {
          type: "beats",
          art: "ratio-table.png",
          alt: "Maya plots glowing ordered pairs on a rising line through the origin over Tokyo",
          lastLabel: "Plot the point ▶",
          beats: [
            {
              who: "compass",
              misconception: true,
              en: "Any point with bigger numbers must be on the line, right? (4, 360) looks high enough to me!",
              vocab: [
                {
                  term: "graph of a ratio table",
                  en: "Plotting the (x, y) pairs yields collinear points on a straight line through the origin (0, 0).",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "traveler",
            en: "Maya graphs the table, plotting (hours, km). Because the ratio is constant, the points form a straight line through the origin. Which ordered pair is <b>on that line</b>?",
          },
          choices: [
            {
              en: "(4, 360)",
              tree: "(4×80 = 320, not 360)",
              correct: false,
            },
            {
              en: "(6, 480)",
              tree: "(6×80 = 480 — on the line)",
              correct: true,
            },
            {
              en: "(2, 80)",
              tree: "(2×80 = 160, not 80)",
              correct: false,
            },
          ],
          goodEn:
            "✅ (6, 480) works: 6×80 = 480, so it lands on the line through the origin. TOKYO UNLOCKED!",
          badEn:
            "❌ A point is on the line only if km = 80×hours. Test each pair against that.",
          solveBeat: {
            who: "traveler",
            en: "The graph confirms it. There's an optional exchange counter nearby before I fly on…",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Globetrotter Challenge",
          ask: {
            who: "log",
            en: "Optional exchange puzzle: at the counter, <b>5 euros = 6 dollars</b>. Maya wants to convert <b>30 dollars</b> back into euros using a ratio table. How many euros? Skip it any time. <br><br>Euros: 5, 10, ? → Dollars: 6, 12, 30",
          },
          choices: [
            {
              en: "36 euros",
              tree: "(scaled the dollars, not the euros)",
              correct: false,
            },
            {
              en: "25 euros",
              tree: "(30÷6 = 5, so 5×5 = 25)",
              correct: true,
            },
            {
              en: "29 euros",
              tree: "(that is 30 − 1)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ 30 dollars ÷ 6 = 5 groups, and 5 euros × 5 = 25 euros. Bonus earned!",
          badEn:
            "❌ Scale by matching dollars: 30÷6 = 5, then 5×5 euros = 25 euros.",
          solveBeat: {
            who: "traveler",
            en: "Exchanged and pocketed. The Master Gateway is the last stop.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Trip",
      kicker: "Final Trip · Combined",
      title: "The Master Gateway",
      advanceLabel: "Complete the Expedition 🎉",
      steps: [
        {
          type: "beats",
          art: "final-challenge.png",
          alt: "Maya stands before a huge glowing globe gateway with ratio tables and route lines orbiting her",
          lastLabel: "Enter the cipher ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The Master Gateway ahead fuses ratios, unit rates, tables, and graphs into one cipher. No partial credit.",
            },
            {
              who: "traveler",
              en: "Every skill, one line, zero errors. Compute the rate, scale the leg, verify the point. Entering the cipher now.",
            },
            {
              who: "compass",
              misconception: true,
              en: "9 liters every 2 hours? I'll ignore the 2 and just call it 9 L per hour — so 8 hours needs 72 L!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "traveler",
            en: "The final gateway fuses every skill. A flight burns <b>9 liters every 2 hours</b> (a steady rate). Pick the single line that is fully correct: the unit rate, the fuel for an 8-hour leg, and a point on the graph.",
          },
          choices: [
            {
              en: "4.5 L/hr; 8 hours needs 32 L; (6, 27) is on the line",
              tree: "(8×4.5 = 36, not 32)",
              correct: false,
            },
            {
              en: "4.5 L/hr; 8 hours needs 36 L; (6, 27) is on the line",
              tree: "(9÷2 = 4.5; 8×4.5 = 36; 6×4.5 = 27)",
              correct: true,
            },
            {
              en: "9 L/hr; 8 hours needs 72 L; (6, 54) is on the line",
              tree: "(used 9 per hour instead of per 2 hours)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Unit rate 9÷2 = 4.5 L/hr; 8×4.5 = 36 L; 6×4.5 = 27 so (6, 27) is on the line. Cipher verified!",
          badEn:
            "❌ One value is off. The rate is 9 L per 2 hrs = 4.5 L/hr; recheck the 8-hour fuel and the point.",
          solveBeat: {
            who: "traveler",
            en: "Master cipher verified! One optional layover puzzle remains before the expedition is logged.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Globetrotter Final Challenge",
          ask: {
            who: "log",
            en: "Optional: two routes home. Route X: <b>1500 km in 3 hours</b>. Route Y: <b>2400 km in 4 hours</b>. Using unit rates (km per hour), which route is faster, and by how much per hour? Skip it any time; your trip is already complete.",
          },
          choices: [
            {
              en: "Route Y is faster by 100 km/hr",
              tree: "(500 km/hr vs 600 km/hr)",
              correct: true,
            },
            {
              en: "Route X is faster by 100 km/hr",
              tree: "(compare 1500÷3 and 2400÷4 again)",
              correct: false,
            },
            {
              en: "They are the same speed",
              tree: "(the unit rates differ)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Route X = 1500÷3 = 500 km/hr, Route Y = 2400÷4 = 600 km/hr. Y is faster by 100 km/hr. Bonus earned!",
          badEn:
            "❌ Compare the unit rates: 1500÷3 vs 2400÷4. The larger km/hr is faster.",
          solveBeat: {
            who: "traveler",
            en: "Fastest route chosen. The expedition is complete!",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "⚖️",
      en: "Ratio",
      es: "",
      def: "A multiplicative comparison of two quantities, written a : b, a to b, or a/b. Order matters.",
    },
    {
      ico: "🧪",
      en: "Equivalent ratios",
      es: "",
      def: "Ratios that name the same comparison; multiply or divide both terms by the same nonzero number. 4:6 = 2:3 = 12:18.",
    },
    {
      ico: "⚡",
      en: "Unit rate",
      es: "",
      def: "A rate per single unit of the second quantity, e.g. 80 km per 1 hour from 240 km in 3 hours.",
    },
    {
      ico: "📊",
      en: "Ratio table",
      es: "",
      def: "A table of equivalent ratios; scale rows by multiplying both quantities by the same factor.",
    },
    {
      ico: "📈",
      en: "Graph of a ratio table",
      es: "",
      def: "Plotting the (x, y) pairs yields collinear points on a straight line through the origin (0, 0).",
    },
    {
      ico: "💰",
      en: "Quantity",
      es: "",
      def: "A measurable amount being compared, such as kilometers, liters, dollars, or travelers.",
    },
    {
      ico: "💲",
      en: "Currency exchange rate",
      es: "",
      def: "A fixed ratio between two currencies, e.g. 5 euros = 6 dollars, used to convert amounts proportionally.",
    },
    {
      ico: "📐",
      en: "Constant of proportionality",
      es: "",
      def: "The fixed multiplier between paired quantities; it equals the unit rate (the y-value when x = 1).",
    },
    {
      ico: "🌐",
      en: "Proportional relationship",
      es: "",
      def: "Two quantities vary so their ratio stays constant; its graph is a line through the origin.",
    },
    {
      ico: "📏",
      en: "Origin",
      es: "",
      def: "The point (0, 0) on a coordinate grid; graphs of proportional ratios always pass through it.",
    },
  ],

  complete: {
    art: "celebrate.png",
    alt: "Maya celebrates with arms wide, surrounded by world landmarks, fireworks, and a passport full of stamps",
    badge: "🎉✈️⭐",
    titleEn: "Expedition Complete!",
    en: "Every gateway is open and the route around the world is charted. You reasoned with <b>equivalent ratios</b> and <b>unit rates</b>, scaled <b>ratio tables</b>, and read <b>graphs</b> of constant ratios to conquer currency, distance, and fuel. The world is yours, Maya.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Calculate constant speed: A jet travels <strong>180 miles in 6 minutes</strong>. Maintaining this constant rate, how many miles will it travel in <strong>10 minutes</strong>?",
      promptEs: "",
      choices: [
        {
          en: "A) 240 miles &nbsp;(added instead of scaling unit rate)",
          correct: false,
        },
        {
          en: "B) 300 miles &nbsp;(unit rate 30 miles/min; 30 × 10 = 300) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 360 miles &nbsp;(incorrect rate multiplier)",
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
