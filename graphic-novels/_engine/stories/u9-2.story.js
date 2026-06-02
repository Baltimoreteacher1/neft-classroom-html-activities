/* STORY · Unit 9 · Graphic Novel #2 (Enrichment) · Treasure Map Navigator
   Full novel on the comic engine. Enrichment tier: harder numbers, reflections
   across the axes, optional "Captain's Challenge" bonus rounds (non-gating,
   still scored), English-only (source has no Spanish), 10-term codex.
   All math (coordinates, integers, reflections, absolute values), answers,
   distractors, and glossary carried verbatim from
   graphic-novels/unit9/graphic-novel-2.html (6.NS.7).
   New: panels, speech, MARLOW-voices-the-misconception, vocab pop-ups. The
   reader is "The Navigator"; MARLOW is a talkative first mate who orders
   negatives by the size of their digits (says −7 > −3). */
window.GN_STORY = {
  meta: {
    unit: 9,
    version: 2,
    level: "Enrichment",
    title: "Treasure Map Navigator",
    standard: "6.NS.7",
    assessment: "Graphic Novel U9 #2: Treasure Map Navigator",
    artBase: "../_art/unit9/",
    home: "../index.html",
  },

  cast: {
    navigator: {
      name: "The Navigator",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧭",
      avatar: null,
      blurb: "You",
    },
    marlow: {
      name: "MARLOW",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🦜",
      avatar: null,
      blurb: "First mate · ranks negatives by their digits",
    },
    log: { name: "Captain's Log", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya the young explorer holds up a glowing treasure map on a tropical cliff above the sea",
    blurbEn:
      "A storm-worn chart names a lost cache somewhere across the archipelago. As <b>the Navigator</b>, you must chart ordered pairs across all four quadrants, <b>reflect points across the axes</b>, and reason with <b>integers and absolute value</b> — reading elevation above the waves and depth below them — to triangulate the treasure before the tide turns. MARLOW, your first mate, will help… but keeps ranking negatives by the size of their digits.",
    blurbEs: "",
    startLabel: "Begin the Expedition 🗺️",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Charting the Grid",
      kicker: "Act 1 · Graph on the Coordinate Plane",
      title: "Charting the Grid",
      advanceLabel: "Sail to the cliffs 🧭",
      steps: [
        {
          type: "beats",
          art: "map-grid.png",
          alt: "Maya studies a treasure map overlaid with a glowing coordinate grid",
          lastLabel: "Chart the beacon ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The chart is gridded like a coordinate plane — origin at the old harbor, four quadrants spanning the archipelago. Read every mark precisely.",
            },
            {
              who: "navigator",
              en: "Ordered pairs I can do in my sleep. The tricky part is the reflections — the chart mirrors beacons across the axes. Let me chart the first.",
              vocab: [
                {
                  term: "reflections",
                  en: "Reflection across the x-axis maps (x, y) to (x, −y); across the y-axis maps (x, y) to (−x, y).",
                  es: "",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "navigator",
            en: "A landmark sits at the lighthouse, <b>(−6, 4)</b>. The chart says its mirror beacon lies <b>reflected across the x-axis</b>. Where is the beacon?",
          },
          choices: [
            {
              en: "(6, 4)",
              tree: "(reflected across the y-axis)",
              correct: false,
            },
            {
              en: "(−6, −4)",
              tree: "(x stays, y changes sign)",
              correct: true,
            },
            {
              en: "(6, −4)",
              tree: "(reflected across both axes)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct. Reflecting (−6, 4) across the x-axis keeps x and negates y → (−6, −4).",
          badEn:
            "❌ Across the x-axis, x stays and y flips sign. (−6, 4) → (−6, −4).",
          solveBeat: {
            who: "navigator",
            en: "Beacon located. Next the survey wants a leg length between two buoys — absolute value gives me the distance.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "navigator",
            en: "Two buoys lie at <b>(−3, 2)</b> and <b>(5, 2)</b>. They share the same y-value, so the leg between them is horizontal. Using absolute value, how long is that leg?",
          },
          choices: [
            {
              en: "2 units",
              tree: "(that is the shared y-value)",
              correct: false,
            },
            {
              en: "8 units",
              tree: "(|−3 − 5| = |−8| = 8)",
              correct: true,
            },
            {
              en: "−8 units",
              tree: "(distance is never negative)",
              correct: false,
            },
          ],
          goodEn: "✅ Right. Same y, so the leg is |−3 − 5| = |−8| = 8 units.",
          badEn:
            "❌ The points share y = 2, so subtract the x-values and take the absolute value: |−3 − 5| = 8.",
          solveBeat: {
            who: "navigator",
            en: "Leg measured. There's an optional puzzle etched in the chart margin if you want extra glory.",
          },
        },
        {
          type: "beats",
          art: "map-grid.png",
          alt: "A double-reflection puzzle is etched in the margin of the chart",
          lastLabel: "Try the bonus ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Optional waypoint: a double reflection puzzle is etched in the margin. Attempt it for extra glory, or sail on — your route is already open.",
            },
          ],
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "The Double Reflection. A point starts at <b>(4, −7)</b>. Reflect it across the <b>y-axis</b>, then reflect that result across the <b>x-axis</b>. Where does it land?",
          },
          choices: [
            {
              en: "(4, 7)",
              tree: "(only reflected across x-axis)",
              correct: false,
            },
            {
              en: "(−4, 7)",
              tree: "(both signs flip: (4,−7) → (−4,−7) → (−4,7))",
              correct: true,
            },
            {
              en: "(−4, −7)",
              tree: "(only reflected across y-axis)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Elegant. Across y-axis: (4,−7)→(−4,−7); then across x-axis: →(−4, 7).",
          badEn:
            "❌ Apply them in order: y-axis flips x, then x-axis flips y. Result is (−4, 7).",
          solveBeat: {
            who: "navigator",
            en: "Bonus cleared. To the cliffs.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Elevations & Depths",
      kicker: "Act 2 · Integers & Absolute Value",
      title: "Elevations & Depths",
      advanceLabel: "Triangulate the cache ⚡",
      steps: [
        {
          type: "beats",
          art: "elevation.png",
          alt: "Maya at a cliff edge reading a vertical scale of heights above and depths below the sea",
          lastLabel: "Stop MARLOW ▶",
          beats: [
            {
              who: "navigator",
              en: "The cliffs! Sea level is my zero. Above the waves is positive elevation; below is negative depth. The chart lists stations all up and down the water column.",
            },
            {
              who: "log",
              caption: true,
              en: "Order them, then judge true distance from the surface with absolute value. A deep number can be far from zero even while being 'less'.",
            },
            {
              who: "marlow",
              misconception: true,
              en: "I'll rank them by their digits: −9 is less than −23 since 9 is smaller than 23, so I get −9, −23, 0, 5, 14!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "marlow",
            en: "Five dive stations read: reef shelf <b>−9 m</b>, gull rock <b>+14 m</b>, surface buoy <b>0 m</b>, wreck <b>−23 m</b>, and the cliff ledge <b>+5 m</b>. List them from <b>deepest to highest</b> — correct me if my digits fooled me!",
          },
          choices: [
            {
              en: "−9, −23, 0, 5, 14",
              tree: "(−9 and −23 are out of order)",
              correct: false,
            },
            {
              en: "−23, −9, 0, 5, 14",
              tree: "(deepest = most negative = least)",
              correct: true,
            },
            {
              en: "14, 5, 0, −9, −23",
              tree: "(that is highest to deepest)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Deepest to highest: −23, −9, 0, 5, 14. The most negative depth is the least value.",
          badEn:
            "❌ More negative means deeper and smaller. Deepest-first is −23, −9, 0, 5, 14.",
          solveBeat: {
            who: "navigator",
            en: "Stations ordered. Now the pressure lock wants who's farther from the surface — that's a contest of absolute values, not raw integers.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "navigator",
            en: "A drone hovers at <b>+18 m</b> above the waves; a diver works at <b>−25 m</b>. Sea level is 0. <b>Who is farther from the surface</b>, and by how much, using absolute value?",
            vocab: [
              {
                term: "absolute value",
                en: "The distance of x from 0 on the number line; always non-negative. |−25| = 25, |18| = 18.",
                es: "",
              },
            ],
          },
          choices: [
            {
              en: "The drone — +18 > −25",
              tree: "(compares value, not distance)",
              correct: false,
            },
            {
              en: "The diver — |−25| = 25 > |18| = 18",
              tree: "(distance ignores sign)",
              correct: true,
            },
            {
              en: "They are equal — both 0 from the surface",
              tree: "(only the surface is 0 away)",
              correct: false,
            },
          ],
          goodEn:
            "✅ The diver: |−25| = 25 exceeds |18| = 18. Distance from the surface ignores the sign.",
          badEn:
            "❌ Compare DISTANCES, not signed values: |−25| = 25 > |18| = 18, so the diver is farther.",
          solveBeat: {
            who: "navigator",
            en: "Pressure lock cleared. There's an optional frozen-chamber riddle if you want it.",
          },
        },
        {
          type: "beats",
          art: "elevation.png",
          alt: "Frost rimes a pair of cave inscriptions warning of cold chambers",
          lastLabel: "Try the bonus ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Optional: a frozen chamber riddle on comparing negative temperatures. Skip freely — it won't hold the cache from you.",
            },
            {
              who: "marlow",
              misconception: true,
              en: "Cold one's easy: −11 is bigger than −4 because 11 beats 4, so chamber B is warmer!",
            },
          ],
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "The Temperature Trap. Two cave inscriptions warn of cold: chamber A at <b>−4°C</b> and chamber B at <b>−11°C</b>. Which statement is true?",
          },
          choices: [
            {
              en: "−11 > −4, so B is warmer",
              tree: "(−11 is actually less than −4)",
              correct: false,
            },
            {
              en: "−4 > −11, so A is warmer, but B is farther from 0",
              tree: "(|−11| = 11 > |−4| = 4)",
              correct: true,
            },
            {
              en: "They are equal because both are negative",
              tree: "(sign alone doesn't set order)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Exactly. −4 > −11 so A is warmer, yet |−11| > |−4|, so B is farther from 0.",
          badEn:
            "❌ On the number line −4 is to the right of −11, so −4 > −11.",
          solveBeat: {
            who: "navigator",
            en: "Riddle solved. On to the final fix.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: The Cache",
      kicker: "Final · Navigate to the Treasure",
      title: "The Cache",
      advanceLabel: "Unearth the cache 🌟",
      steps: [
        {
          type: "beats",
          art: "final-nav.png",
          alt: "Maya stands at a glowing X on the map grid near a steep cliff edge",
          lastLabel: "Enter the fix ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The cache marker is fixed. The final bearing fuses everything: quadrant, a reflection, and burial depth as a true distance.",
            },
            {
              who: "navigator",
              en: "One line, no errors. Plot, reflect, measure. Standing by to dig.",
            },
            {
              who: "marlow",
              misconception: true,
              en: "Buried at −12 m? Then the depth distance is −12, surely — the deeper it is, the more negative the distance!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "navigator",
            en: "The cache marker is plotted at <b>(−7, −3)</b> and lies buried at <b>−12 m</b> relative to the surface. Choose the single line that is <b>entirely correct</b>: the quadrant, the reflection of the marker across the y-axis, and the burial depth as a distance.",
          },
          choices: [
            {
              en: "Quadrant III; reflection across y-axis = (−7, 3); depth |−12| = 12 m",
              tree: "(reflection across y-axis flips x, not y)",
              correct: false,
            },
            {
              en: "Quadrant III; reflection across y-axis = (7, −3); depth |−12| = 12 m",
              tree: "(x → −x, y unchanged)",
              correct: true,
            },
            {
              en: "Quadrant II; reflection across y-axis = (7, −3); depth |−12| = −12 m",
              tree: "(left+down is QIII, and distance ≥ 0)",
              correct: false,
            },
          ],
          goodEn:
            "✅ All correct: (−7,−3) is Quadrant III; reflected across the y-axis it is (7,−3); and |−12| = 12 m deep.",
          badEn:
            "❌ Left+down is Quadrant III; y-axis reflection flips only x → (7,−3); and depth = |−12| = 12 m (never negative).",
          solveBeat: {
            who: "navigator",
            en: "Fix confirmed! One optional span calculation remains for bonus glory — or I dig right now.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Final Challenge",
          ask: {
            who: "log",
            en: "The Vertical Span. From a watch-point at <b>+9 m</b> elevation, the cache sits at <b>−12 m</b>. What is the total <b>vertical distance</b> the rope must span between them?",
          },
          choices: [
            {
              en: "3 m",
              tree: "(that is 9 + (−12), not a distance)",
              correct: false,
            },
            {
              en: "21 m",
              tree: "(|9| + |−12| = 9 + 12, opposite sides of 0)",
              correct: true,
            },
            {
              en: "12 m",
              tree: "(that is only the depth below 0)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ The points straddle 0, so the span is |9| + |−12| = 9 + 12 = 21 m of rope.",
          badEn:
            "❌ They are on opposite sides of 0, so add the distances: |9| + |−12| = 21 m.",
          solveBeat: {
            who: "navigator",
            en: "Span measured. Time to claim the treasure.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "🌐",
      en: "Coordinate plane",
      es: "",
      def: "A grid formed by a horizontal x-axis and vertical y-axis meeting at the origin, dividing space into four quadrants.",
    },
    {
      ico: "📍",
      en: "Ordered pair (x, y)",
      es: "",
      def: "A pair naming a unique point: x is horizontal displacement, y is vertical. Order matters — (3, −2) ≠ (−2, 3).",
    },
    {
      ico: "🧭",
      en: "Quadrant",
      es: "",
      def: "I (+,+), II (−,+), III (−,−), IV (+,−), numbered counterclockwise from the top-right.",
    },
    {
      ico: "🔄",
      en: "Reflection across the x-axis",
      es: "",
      def: "Maps (x, y) to (x, −y): the x-coordinate stays, the y-coordinate changes sign.",
    },
    {
      ico: "🔃",
      en: "Reflection across the y-axis",
      es: "",
      def: "Maps (x, y) to (−x, y): the y-coordinate stays, the x-coordinate changes sign.",
    },
    {
      ico: "🌏",
      en: "Integer",
      es: "",
      def: "A number from the set { … −2, −1, 0, 1, 2 … }: positive, negative, or zero, with no fractional part.",
    },
    {
      ico: "📏",
      en: "Absolute value |x|",
      es: "",
      def: "The distance of x from 0 on the number line; always non-negative. |−25| = 25, |18| = 18.",
    },
    {
      ico: "⚖️",
      en: "Compare & order integers",
      es: "",
      def: "On a number line, a value to the right is greater. So −4 > −11 even though 11 > 4 in size.",
    },
    {
      ico: "📐",
      en: "Distance between points",
      es: "",
      def: "For points sharing a coordinate, the distance is the absolute value of the difference of the others: |−3 − 5| = 8.",
    },
    {
      ico: "🌡️",
      en: "Opposite / signed quantity",
      es: "",
      def: "Opposites are equal distance from 0 with different signs (+18 and −18). Signs encode direction: up vs. down, hot vs. cold.",
    },
  ],

  complete: {
    art: "treasure-found.png",
    alt: "Maya opens a glowing treasure chest full of gold on the beach at sunset",
    badge: "🎉💰⭐",
    titleEn: "Cache Recovered — Expedition Complete!",
    en: "The treasure is unearthed, Navigator. You charted ordered pairs across every quadrant, <b>reflected points across the axes</b>, ordered integers from the deepest wreck to the highest gull rock, and used <b>absolute value</b> to measure true distances from the surface. A flawless fix. The map — and the gold — are yours.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Coordinate Reflection: Reflect the beacon plotted at coordinates <strong>(−3, −4)</strong> across the <strong>x-axis</strong>. What are the coordinates of the reflected point?",
      promptEs: "",
      choices: [
        {
          en: "A) (3, −4) &nbsp;(reflected across the y-axis)",
          correct: false,
        },
        {
          en: "B) (−3, 4) &nbsp;(reflected across the x-axis, sign of y flips) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) (3, 4) &nbsp;(reflected across the origin)",
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
