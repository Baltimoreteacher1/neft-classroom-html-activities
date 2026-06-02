/* STORY · Unit 8 · Graphic Novel #2 (Enrichment) · Court Vision: The Data Analyst
   Full novel on the comic engine. Two acts (The Big Question, Center & Spread)
   + Final Call, Glossary, Mission Complete + Master-Rank challenge. Enrichment
   tier: skew/outliers, MAD, optional "Analyst's Bonus" rounds (non-gating, still
   scored), English-only (source has no Spanish), 11-term analyst codex. All
   math/data/answers/distractors/glossary carried verbatim from
   graphic-novels/unit8/graphic-novel-2.html (6.SP.1). New: panels, speech,
   STATS-voices-the-misconception (mean over median / ignores spread), vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 8,
    version: 2,
    level: "Enrichment",
    title: "Court Vision: The Data Analyst",
    standard: "6.SP.1",
    assessment: "Graphic Novel U8 #2: Court Vision: The Data Analyst",
    artBase: "../_art/unit8/",
    home: "../index.html",
  },

  cast: {
    analyst: {
      name: "The Analyst",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "📊",
      avatar: null,
      blurb: "You",
    },
    stats: {
      name: "STATS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Courtside stats bot · trusts the mean, ignores the spread",
    },
    gm: { name: "GM", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young sports data analyst stands in an arena data room surrounded by glowing holographic basketball stats",
    blurbEn:
      "The playoffs are on the line and the front office is counting on you. As lead <b>analyst</b>, you must distinguish <b>statistical questions</b>, decide when the <b>mean</b> lies and the <b>median</b> tells the truth, and quantify a player's consistency with the <b>mean absolute deviation (MAD)</b>. Every call you make is driven by the data. STATS, the courtside bot, keeps reaching for the mean and ignoring the spread.",
    blurbEs: "",
    startLabel: "Begin Analysis 🏀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Big Question",
      kicker: "Act 1 · Statistical Questions & Data",
      title: "The Big Question",
      advanceLabel: "Submit the report 🏀",
      steps: [
        {
          type: "beats",
          art: "data-room.png",
          alt: "Maya at a glowing analyst desk studying holographic player statistics",
          lastLabel: "Frame the question ▶",
          beats: [
            {
              who: "gm",
              caption: true,
              en: "Analyst, the playoff window is open and the data is a mess. Tell me what's worth measuring.",
            },
            {
              who: "analyst",
              en: "First principle: a statistical question expects variability. If every answer is identical, it isn't statistical — it's a fact.",
              vocab: [
                {
                  term: "statistical question",
                  en: "A question that anticipates variability in its answers and is answered by collecting data (e.g., minutes played per game).",
                },
              ],
            },
            {
              who: "stats",
              misconception: true,
              en: "Just ask the final score of last night's game. One fixed value — that's all the data you need.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "gm",
            en: "Then frame the question that will actually generate a data set. A <b>statistical question</b> anticipates <b>variability</b> in the data — it expects answers that differ. Which question is statistical?",
          },
          choices: [
            {
              en: 'Did our point guard play in last night\'s game? <span class="calc">(yes/no — a single answer)</span>',
              correct: false,
            },
            {
              en: 'How many minutes does each player log per game this season? <span class="calc">(answers vary across players/games)</span>',
              correct: true,
            },
            {
              en: 'What is the final score of last night\'s game? <span class="calc">(one fixed value)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly. Minutes per player per game vary — that variability is the hallmark of a statistical question.",
          badEn:
            "❌ That question resolves to a single fixed answer, so it isn't statistical. Look for the one whose answers vary.",
          solveBeat: {
            who: "analyst",
            en: "Question locked. Now I read the set itself — range, gaps, and any value that looks out of place.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          art: "data-room.png",
          alt: "A holographic table of Rivera's rebounds across six games glows on the analyst desk",
          ask: {
            who: "analyst",
            en: "Below are rebounds across 6 games — <b>9, 4, 11, 7, 5, 12</b>. Reading the set, what is the <b>range</b> (greatest minus least)?",
            vocab: [
              {
                term: "range",
                en: "A simple measure of spread: greatest value minus least value.",
              },
            ],
          },
          choices: [
            {
              en: '12 <span class="calc">(that is the maximum, not the range)</span>',
              correct: false,
            },
            {
              en: '8 <span class="calc">(12 − 4 = 8)</span>',
              correct: true,
            },
            {
              en: '7 <span class="calc">(that is one data value)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Range = 12 − 4 = 8. You read the full set and spotted the extremes.",
          badEn:
            "❌ Range is greatest minus least: 12 − 4. Re-scan the row for the max and min.",
          solveBeat: {
            who: "analyst",
            en: "Set interrogated. The extremes are clear — time to submit the report.",
          },
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Analyst's Bonus — Optional",
          ask: {
            who: "gm",
            en: "Optional, if you want the edge: you want to show how Rivera's rebounds are <b>distributed</b> across their values. Which display best shows the <b>shape and spread</b> of a single numeric data set? Skip it if you'd rather move on.",
          },
          choices: [
            {
              en: 'A pie chart of the six game numbers <span class="calc">(pie charts show parts of a whole)</span>',
              correct: false,
            },
            {
              en: 'A dot plot (line plot) of the rebound values <span class="calc">(shows each value, clusters & gaps)</span>',
              correct: true,
            },
            {
              en: 'A single bar showing the total rebounds <span class="calc">(hides the spread entirely)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ A dot plot shows every value, revealing clusters, gaps, and spread — the distribution's shape.",
          badEn:
            "❌ That display hides the spread. You want one that shows each value's position. (Optional — you can still advance.)",
          solveBeat: {
            who: "analyst",
            en: "Distribution display chosen. Report locked.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Center & Spread",
      kicker: "Act 2 · Mean, Median, Mode & MAD",
      title: "Center & Spread",
      advanceLabel: "Deliver the spread report ⚡",
      steps: [
        {
          type: "beats",
          art: "spread-mad.png",
          alt: "Maya studies a holographic scatter of glowing dots spread around a center line",
          lastLabel: "Find the true center ▶",
          beats: [
            {
              who: "gm",
              caption: true,
              en: "Numbers are in. But one offer sheet looks distorted. Find the center that tells the truth, then quantify the spread.",
            },
            {
              who: "analyst",
              en: "Center isn't one number — mean, median, and mode each tell a story. And the MAD tells me how tightly the data hugs the center.",
              vocab: [
                {
                  term: "MAD",
                  en: "Mean absolute deviation: the average distance of values from the mean — average of |value − mean|. A smaller MAD means data clusters tightly (more consistent).",
                },
              ],
            },
            {
              who: "stats",
              misconception: true,
              en: "The salary offers are 10, 11, 12, 13, 54. The mean is 20 — that's the typical offer. Use the mean, always.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "analyst",
            en: "Hold on, STATS. A scout's salary offers (in $1000s) are <b>10, 11, 12, 13, 54</b>. The mean is <b>20</b> (sum 100 ÷ 5), but the median is <b>12</b>. Which measure better describes a <b>typical</b> offer, and why?",
            vocab: [
              {
                term: "outlier",
                en: "A value far from the rest of the data; it can pull the mean toward it while barely affecting the median.",
              },
            ],
          },
          choices: [
            {
              en: 'The mean (20), because it uses every value <span class="calc">(but the 54 outlier inflates it)</span>',
              correct: false,
            },
            {
              en: 'The median (12), because one large outlier (54) pulls the mean up <span class="calc">(median resists skew)</span>',
              correct: true,
            },
            {
              en: 'Neither — only the mode can describe typical values <span class="calc">(this set has no repeated mode)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Right. The 54 is an outlier that drags the mean to 20; the median (12) reflects a typical offer. Use the median for skewed data.",
          badEn:
            "❌ Reconsider the outlier. The lone 54 inflates the mean — the median is the resistant, honest center here.",
          solveBeat: {
            who: "analyst",
            en: "Median chosen. Now the spread: I'll average every value's distance from the mean — the mean absolute deviation.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "analyst",
            en: "Player A scored <b>4, 6, 8, 10, 2</b>. The <b>mean</b> is 6. Compute the <b>mean absolute deviation</b>: average the distance of each value from the mean. What is the MAD?",
          },
          choices: [
            {
              en: '3.0 <span class="calc">(check each |value − 6| again)</span>',
              correct: false,
            },
            {
              en: '2.4 <span class="calc">|−2|+0+|2|+|4|+|−4| = 12, 12÷5 = 2.4</span>',
              correct: true,
            },
            {
              en: '12 <span class="calc">(that is the sum of distances, not the average)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ MAD = 2.4. Distances from 6 are 2, 0, 2, 4, 4 → sum 12, and 12 ÷ 5 = 2.4.",
          badEn:
            "❌ Take |value − 6| for each: 2, 0, 2, 4, 4. Sum is 12, then divide by 5 — don't stop at the sum.",
          solveBeat: {
            who: "analyst",
            en: "MAD computed. Equal means can hide wildly different consistency — the spread decides who I trust.",
          },
        },
        {
          type: "challenge",
          id: "2c",
          ask: {
            who: "analyst",
            en: "Two guards both <b>average 10 points</b>. Guard X has a <b>MAD of 1.2</b>; Guard Y has a <b>MAD of 4.8</b>. For a must-have-points possession, who is more <b>consistent</b>?",
            vocab: [
              {
                term: "spread",
                en: "How much the values differ from one another. Measured by range or MAD; key to judging consistency.",
              },
            ],
          },
          choices: [
            {
              en: 'Guard Y — a larger MAD means more scoring <span class="calc">(MAD measures spread, not total)</span>',
              correct: false,
            },
            {
              en: 'Guard X — a smaller MAD means scores cluster tightly near 10 <span class="calc">(less variability = more reliable)</span>',
              correct: true,
            },
            {
              en: 'They are equally consistent — same mean <span class="calc">(equal means can hide very different spread)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Guard X. A smaller MAD (1.2) means their scores stay tightly near 10 — far more reliable than Guard Y's MAD of 4.8.",
          badEn:
            "❌ MAD measures spread, not total points. The smaller MAD signals the more consistent scorer.",
          solveBeat: {
            who: "analyst",
            en: "Consistency read. Now the optional duel before I lock the report.",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Analyst's Bonus — Optional",
          ask: {
            who: "gm",
            en: "Optional duel: two players, same average. Player P: <b>8, 9, 10, 11, 12</b>. Player Q: <b>2, 6, 10, 14, 18</b>. Compute both MADs and pick the correct comparison. Skip if you'd rather lock the report.",
          },
          choices: [
            {
              en: "P's MAD = 1.2, Q's MAD = 4.8 — P is far more consistent <span class=\"calc\">P: (2+1+0+1+2)/5; Q: (8+4+0+4+8)/5</span>",
              correct: true,
            },
            {
              en: "P's MAD = 4.8, Q's MAD = 1.2 — Q is more consistent <span class=\"calc\">(the values are swapped)</span>",
              correct: false,
            },
            {
              en: 'Both MADs = 0 because the means are equal <span class="calc">(equal mean ≠ zero spread)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ Correct. P: distances 2,1,0,1,2 → 6 ÷ 5 = 1.2. Q: 8,4,0,4,8 → 24 ÷ 5 = 4.8. P is far steadier.",
          badEn:
            "❌ Compute each MAD: average the absolute distances from 10. P clusters tightly; Q is widely spread. (Optional — you can still advance.)",
          solveBeat: {
            who: "analyst",
            en: "Duel settled. Spread report delivered.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Call",
      kicker: "Final Call · Boss",
      title: "The Playoff Decision",
      advanceLabel: "Make the playoff call 🌟",
      steps: [
        {
          type: "beats",
          art: "final-analysis.png",
          alt: "Maya before a giant wall of holographic data making a big decision",
          lastLabel: "Build the profile ▶",
          beats: [
            {
              who: "gm",
              caption: true,
              en: "Game 7, final possession. I need a complete profile on our closer — center and spread — before I make the call.",
            },
            {
              who: "analyst",
              en: "Mean, median, and MAD in one report. No guesswork. Pulling the full cipher now.",
            },
            {
              who: "stats",
              misconception: true,
              en: "Closer's clutch scores are 6, 8, 10, 12, 14. Mean and median both 10 — same number, so the spread doesn't matter. Lock it in.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "analyst",
            en: "The spread always matters, STATS. Closer candidate's last 5 clutch scores: <b>6, 8, 10, 12, 14</b>. Build the complete profile: <b>mean</b>, <b>median</b>, and <b>MAD</b>. Pick the line that is fully correct.",
          },
          choices: [
            {
              en: 'Mean = 10, Median = 10, MAD = 4 <span class="calc">(distances are 4,2,0,2,4 → sum 12)</span>',
              correct: false,
            },
            {
              en: 'Mean = 10, Median = 10, MAD = 2.4 <span class="calc">sum 50÷5 = 10; (4+2+0+2+4)/5 = 2.4</span>',
              correct: true,
            },
            {
              en: 'Mean = 10, Median = 12, MAD = 2.4 <span class="calc">(median of 6,8,10,12,14 is 10, not 12)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Complete profile: mean = 50 ÷ 5 = 10, median = 10, MAD = (4+2+0+2+4) ÷ 5 = 2.4. Verified.",
          badEn:
            "❌ One statistic is off. Mean and median are both 10; the MAD averages distances 4,2,0,2,4 → 12 ÷ 5 = 2.4.",
          solveBeat: {
            who: "analyst",
            en: "Center and spread, fully verified. One optional tie-breaker remains.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Analyst's Final Bonus — Optional",
          ask: {
            who: "gm",
            en: "Optional tie-breaker: a rival closer has the <b>same mean (10)</b> and <b>same median (10)</b>, but clutch scores <b>1, 5, 10, 15, 19</b>. Compute their MAD and decide who to trust for one final shot. Skip anytime and still finish the mission.",
          },
          choices: [
            {
              en: 'Rival\'s MAD = 5.6, so trust our closer (MAD 2.4) — more reliable <span class="calc">(9+5+0+5+9)/5 = 28/5 = 5.6</span>',
              correct: true,
            },
            {
              en: 'Both equal — same mean and median means same reliability <span class="calc">(spread can still differ)</span>',
              correct: false,
            },
            {
              en: 'Trust the rival — a larger MAD is better <span class="calc">(larger MAD = less consistent)</span>',
              correct: false,
            },
          ],
          goodEn:
            "⭐ Rival's distances from 10 are 9, 5, 0, 5, 9 → sum 28, and 28 ÷ 5 = 5.6. Our closer's MAD (2.4) is smaller, so they're more reliable — trust our closer.",
          badEn:
            "❌ Average the rival's absolute distances from 10 (9,5,0,5,9). A larger MAD means LESS consistency. (Optional — you can still finish.)",
          solveBeat: {
            who: "analyst",
            en: "Tie-breaker settled by the spread. That's the playoff call.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "❓",
      en: "Statistical question",
      def: "A question that anticipates variability in its answers and is answered by collecting data (e.g., minutes played per game).",
    },
    {
      ico: "📊",
      en: "Data set",
      def: "A collection of related numeric or categorical values gathered to answer a question.",
    },
    {
      ico: "⚖️",
      en: "Mean",
      def: "The arithmetic average: sum of all values divided by the count. Sensitive to outliers.",
    },
    {
      ico: "✋",
      en: "Median",
      def: "The middle value of an ordered data set; with an even count, the average of the two middle values. Resistant to outliers.",
    },
    {
      ico: "🔥",
      en: "Mode",
      def: "The value (or values) that occur most frequently. A set may have no mode or several.",
    },
    {
      ico: "📏",
      en: "Range",
      def: "A simple measure of spread: greatest value minus least value.",
    },
    {
      ico: "🏷️",
      en: "Outlier",
      def: "A value far from the rest of the data; it can pull the mean toward it while barely affecting the median.",
    },
    {
      ico: "◖",
      en: "Skewed data",
      def: "A distribution stretched toward high or low values, so the mean and median differ; the median is often the better center.",
    },
    {
      ico: "📐",
      en: "Mean absolute deviation (MAD)",
      def: "The average distance of values from the mean: average of |value − mean|. A smaller MAD means data clusters tightly (more consistent).",
    },
    {
      ico: "📉",
      en: "Variability / spread",
      def: "How much the values differ from one another. Measured by range or MAD; key to judging consistency.",
    },
    {
      ico: "🔢",
      en: "Distribution",
      def: "The overall pattern of a data set — its center, spread, and shape — often shown with a dot plot or histogram.",
    },
  ],

  complete: {
    art: "celebrate.png",
    alt: "Maya celebrates on the court with the winning team holding her tablet high",
    badge: "🎉🏀⭐",
    titleEn: "Series Clinched — Mission Complete!",
    en: "Brilliant work, Analyst. You separated statistical questions from single-answer facts, recognized when an <b>outlier</b> makes the <b>median</b> the honest measure, and used the <b>MAD</b> to prove which player was truly reliable under pressure. Your data-driven call won the series.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Mean Absolute Deviation (MAD): Jordan's score deviations from the mean (6) are <strong>2, 0, 2</strong> (scores: 4, 6, 8). What is the <strong>MAD</strong> of these scores?",
      promptEs: "",
      choices: [
        {
          en: "A) 2 &nbsp;(took the max individual deviation)",
          correct: false,
        },
        {
          en: "B) 1.33 &nbsp;(average deviation: 4 ÷ 3 = 1.33) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 0 &nbsp;(assumed deviations cancelled out)",
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
