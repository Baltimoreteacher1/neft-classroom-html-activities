/* Curriculum Hub — extracted from curriculum/index.html.
 * Loaded with defer at the same document position: defer scripts execute
 * after parsing in document order, so this keeps its relative order with
 * the other hub scripts and still runs before /assets/curriculum-*.js.
 * Keep the ?v= stamp in the hub in sync with this file's content hash;
 * tools/curriculum-hub-assets.test.mjs enforces that.
 */
(function () {
  var box = document.getElementById("curr-search");
  var noResults = document.getElementById("no-results");
  // LESSON_BONUS_ACTIVITIES is generated — see curriculum/lesson-bonus-activities.js
  // (loaded via <script src="/curriculum/lesson-bonus-activities.js">; regenerate with `npm run generate-lesson-bonus-map`)
  var LESSON_BONUS_ACTIVITIES = window.LESSON_BONUS_ACTIVITIES || {};
  // LESSON_FAMILY_HOMEWORK is generated — see curriculum/lesson-family-homework.js
  // (loaded via <script src="/curriculum/lesson-family-homework.js">; regenerate with `npm run generate-lesson-family-homework-map`)
  var LESSON_FAMILY_HOMEWORK = window.LESSON_FAMILY_HOMEWORK || {};

  // Culminating projects directory per unit
  var UNIT_CULMINATING_PROJECT = {
    1: "/math/unit-1/projects/",
    2: "/math/unit-2/projects/",
    3: "/math/unit-3/projects/",
    4: "/math/unit-4/projects/",
    5: "/math/unit-5/projects/",
    6: "/math/unit-6/projects/",
    7: "/math/unit-8/projects/",
    8: "/math/statistics/projects/",
    9: "/math/unit-7/projects/",
    10: "/math/unit-10/projects/",
  };

  // Specific lesson-to-projects mapping
  // Print-ready resources (paper game, color-by-number, word search,
  // MCAP packet) attached to each lesson card. Surfaced in the activity
  // dropdown. Generated from each lesson's config.json printables[].
  var LESSON_PRINTABLES = {
    "1-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Factor Tree Relay",
        href: "/lessons/1-1/downloads/printables/1-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Prime Factorization — Color by Number",
        href: "/lessons/1-1/downloads/printables/1-1-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "1-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Prime Factorization Escape Folder",
        href: "/lessons/1-1-flagship/downloads/printables/1-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Prime Factorization — Color by Number",
        href: "/lessons/1-1-flagship/downloads/printables/1-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "1-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 GCF Factor Grid Challenge",
        href: "/lessons/1-2/downloads/printables/1-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Greatest Common Factor — Color by Number",
        href: "/lessons/1-2/downloads/printables/1-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Greatest Common Factor — Vocabulary Word Search",
        href: "/lessons/1-2/downloads/printables/1-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Greatest Common Factor — MCAP-Style Practice",
        href: "/lessons/1-2/downloads/printables/1-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "1-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Multiple Race Track",
        href: "/lessons/1-3/downloads/printables/1-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Least Common Multiple — Color by Number",
        href: "/lessons/1-3/downloads/printables/1-3-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "1-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Division Detective Case Files",
        href: "/lessons/1-4/downloads/printables/1-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Divide Multi-Digit Numbers — Color by Number",
        href: "/lessons/1-4/downloads/printables/1-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Divide Multi-Digit Numbers — Vocabulary Word Search",
        href: "/lessons/1-4/downloads/printables/1-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Divide Multi-Digit Numbers — MCAP-Style Practice",
        href: "/lessons/1-4/downloads/printables/1-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "1-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Decimal Bank Ledger",
        href: "/lessons/1-5/downloads/printables/1-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Add and Subtract Decimals — Color by Number",
        href: "/lessons/1-5/downloads/printables/1-5-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "1-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Decimal Product Shop",
        href: "/lessons/1-6/downloads/printables/1-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Multiply Decimals — Color by Number",
        href: "/lessons/1-6/downloads/printables/1-6-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "1-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/1-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Decimal Division Road Trip",
        href: "/lessons/1-7/downloads/printables/1-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Divide Decimals — Color by Number",
        href: "/lessons/1-7/downloads/printables/1-7-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Divide Decimals — Vocabulary Word Search",
        href: "/lessons/1-7/downloads/printables/1-7-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Divide Decimals — MCAP-Style Practice",
        href: "/lessons/1-7/downloads/printables/1-7-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "10-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Volume Cube Stack Task Cards",
        href: "/lessons/10-1/downloads/printables/10-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Volume with Whole Number Edges — Color by Number",
        href: "/lessons/10-1/downloads/printables/10-1-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "10-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Time Capsule Design Challenge",
        href: "/lessons/10-1-flagship/downloads/printables/10-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Volume with Whole Number Edges — Color by Number",
        href: "/lessons/10-1-flagship/downloads/printables/10-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "10-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Fractional Edge Volume Boxes",
        href: "/lessons/10-2/downloads/printables/10-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Volume of Rectangular Prisms — Color by Number",
        href: "/lessons/10-2/downloads/printables/10-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Volume of Rectangular Prisms — Vocabulary Word Search",
        href: "/lessons/10-2/downloads/printables/10-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Volume of Rectangular Prisms — MCAP-Style Practice",
        href: "/lessons/10-2/downloads/printables/10-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "10-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Net Detective",
        href: "/lessons/10-3/downloads/printables/10-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Surface Area Using Nets — Color by Number",
        href: "/lessons/10-3/downloads/printables/10-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Surface Area Using Nets — Vocabulary Word Search",
        href: "/lessons/10-3/downloads/printables/10-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Surface Area Using Nets — MCAP-Style Practice",
        href: "/lessons/10-3/downloads/printables/10-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "10-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Prism Surface Area Wrap",
        href: "/lessons/10-4/downloads/printables/10-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Surface Area of Prisms — Color by Number",
        href: "/lessons/10-4/downloads/printables/10-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Surface Area of Prisms — Vocabulary Word Search",
        href: "/lessons/10-4/downloads/printables/10-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Surface Area of Prisms — MCAP-Style Practice",
        href: "/lessons/10-4/downloads/printables/10-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "10-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/10-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Pyramid Surface Area Build",
        href: "/lessons/10-5/downloads/printables/10-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Surface Area of Pyramids — Color by Number",
        href: "/lessons/10-5/downloads/printables/10-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Surface Area of Pyramids — Vocabulary Word Search",
        href: "/lessons/10-5/downloads/printables/10-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Surface Area of Pyramids — MCAP-Style Practice",
        href: "/lessons/10-5/downloads/printables/10-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "2-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Fraction Division Model Match",
        href: "/lessons/2-1/downloads/printables/2-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Interpret Division of Fractions — Color by Number",
        href: "/lessons/2-1/downloads/printables/2-1-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "2-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Fraction Detective File-Folder Mystery",
        href: "/lessons/2-1-flagship/downloads/printables/2-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Interpret Division of Fractions — Color by Number",
        href: "/lessons/2-1-flagship/downloads/printables/2-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "2-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Serving Size Scoops",
        href: "/lessons/2-2/downloads/printables/2-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Divide Whole Numbers by Fractions — Color by Number",
        href: "/lessons/2-2/downloads/printables/2-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Divide Whole Numbers by Fractions — Vocabulary Word Search",
        href: "/lessons/2-2/downloads/printables/2-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Divide Whole Numbers by Fractions — MCAP-Style Practice",
        href: "/lessons/2-2/downloads/printables/2-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "2-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Reciprocal Card Duel",
        href: "/lessons/2-3/downloads/printables/2-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Divide Fractions — Color by Number",
        href: "/lessons/2-3/downloads/printables/2-3-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "2-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Mixed Number Conversion Trail",
        href: "/lessons/2-4/downloads/printables/2-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Divide Mixed Numbers — Color by Number",
        href: "/lessons/2-4/downloads/printables/2-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Divide Mixed Numbers — Vocabulary Word Search",
        href: "/lessons/2-4/downloads/printables/2-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Divide Mixed Numbers — MCAP-Style Practice",
        href: "/lessons/2-4/downloads/printables/2-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "2-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/2-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Fraction Division Story Court",
        href: "/lessons/2-5/downloads/printables/2-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Fraction Division Problem Solving — Color by Number",
        href: "/lessons/2-5/downloads/printables/2-5-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "3-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Ratio Recipe Sort",
        href: "/lessons/3-1/downloads/printables/3-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Understand Ratios — Color by Number",
        href: "/lessons/3-1/downloads/printables/3-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Understand Ratios — Vocabulary Word Search",
        href: "/lessons/3-1/downloads/printables/3-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Understand Ratios — MCAP-Style Practice",
        href: "/lessons/3-1/downloads/printables/3-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "3-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Create-a-Recipe Ratio Challenge",
        href: "/lessons/3-1-flagship/downloads/printables/3-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Understand Ratios — Color by Number",
        href: "/lessons/3-1-flagship/downloads/printables/3-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Understand Ratios — Vocabulary Word Search",
        href: "/lessons/3-1-flagship/downloads/printables/3-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Understand Ratios — MCAP-Style Practice",
        href: "/lessons/3-1-flagship/downloads/printables/3-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "3-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Ratio Table Bingo",
        href: "/lessons/3-2/downloads/printables/3-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Ratio Tables — Color by Number",
        href: "/lessons/3-2/downloads/printables/3-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Ratio Tables — Vocabulary Word Search",
        href: "/lessons/3-2/downloads/printables/3-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Ratio Tables — MCAP-Style Practice",
        href: "/lessons/3-2/downloads/printables/3-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "3-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Coordinate Recipe Plot",
        href: "/lessons/3-3/downloads/printables/3-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Graph Ratio Tables — Color by Number",
        href: "/lessons/3-3/downloads/printables/3-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Graph Ratio Tables — Vocabulary Word Search",
        href: "/lessons/3-3/downloads/printables/3-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Graph Ratio Tables — MCAP-Style Practice",
        href: "/lessons/3-3/downloads/printables/3-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "3-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Equivalent Ratio Card Capture",
        href: "/lessons/3-4/downloads/printables/3-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Equivalent Ratios — Color by Number",
        href: "/lessons/3-4/downloads/printables/3-4-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "3-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Better Mix Debate Cards",
        href: "/lessons/3-5/downloads/printables/3-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Compare Ratios — Color by Number",
        href: "/lessons/3-5/downloads/printables/3-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Compare Ratios — Vocabulary Word Search",
        href: "/lessons/3-5/downloads/printables/3-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Compare Ratios — MCAP-Style Practice",
        href: "/lessons/3-5/downloads/printables/3-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "3-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Scale-It-Up Blueprint",
        href: "/lessons/3-6/downloads/printables/3-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Use Ratio Reasoning — Color by Number",
        href: "/lessons/3-6/downloads/printables/3-6-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "3-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/3-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Unit Rate Market Dash",
        href: "/lessons/3-7/downloads/printables/3-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Ratio and Rate Problem Solving — Color by Number",
        href: "/lessons/3-7/downloads/printables/3-7-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "4-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Unit Rate Shopping War",
        href: "/lessons/4-1/downloads/printables/4-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Rates and Unit Rates — Color by Number",
        href: "/lessons/4-1/downloads/printables/4-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Rates and Unit Rates — Vocabulary Word Search",
        href: "/lessons/4-1/downloads/printables/4-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Rates and Unit Rates — MCAP-Style Practice",
        href: "/lessons/4-1/downloads/printables/4-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Arcade Better-Buy Tournament",
        href: "/lessons/4-1-flagship/downloads/printables/4-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Rates and Unit Rates — Color by Number",
        href: "/lessons/4-1-flagship/downloads/printables/4-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Rates and Unit Rates — Vocabulary Word Search",
        href: "/lessons/4-1-flagship/downloads/printables/4-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Rates and Unit Rates — MCAP-Style Practice",
        href: "/lessons/4-1-flagship/downloads/printables/4-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Fraction–Decimal–Percent Dominoes",
        href: "/lessons/4-2/downloads/printables/4-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Relate Fractions, Decimals, and Percents — Color by Number",
        href: "/lessons/4-2/downloads/printables/4-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Relate Fractions, Decimals, and Percents — Vocabulary Word Search",
        href: "/lessons/4-2/downloads/printables/4-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Relate Fractions, Decimals, and Percents — MCAP-Style Practice",
        href: "/lessons/4-2/downloads/printables/4-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Extreme Percent Headline Sort",
        href: "/lessons/4-3/downloads/printables/4-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Percents Greater Than 100% and Less Than 1% — Color by Number",
        href: "/lessons/4-3/downloads/printables/4-3-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "4-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Percent Target Grid",
        href: "/lessons/4-4/downloads/printables/4-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Find the Percent of a Number — Color by Number",
        href: "/lessons/4-4/downloads/printables/4-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Find the Percent of a Number — Vocabulary Word Search",
        href: "/lessons/4-4/downloads/printables/4-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Find the Percent of a Number — MCAP-Style Practice",
        href: "/lessons/4-4/downloads/printables/4-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Sale Rack Task Cards",
        href: "/lessons/4-5/downloads/printables/4-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Use Percent to Solve Problems — Color by Number",
        href: "/lessons/4-5/downloads/printables/4-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Use Percent to Solve Problems — Vocabulary Word Search",
        href: "/lessons/4-5/downloads/printables/4-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Use Percent to Solve Problems — MCAP-Style Practice",
        href: "/lessons/4-5/downloads/printables/4-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Measurement Conversion Ladder",
        href: "/lessons/4-6/downloads/printables/4-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Convert Measurement Units — Color by Number",
        href: "/lessons/4-6/downloads/printables/4-6-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Convert Measurement Units — Vocabulary Word Search",
        href: "/lessons/4-6/downloads/printables/4-6-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Convert Measurement Units — MCAP-Style Practice",
        href: "/lessons/4-6/downloads/printables/4-6-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "4-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/4-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Unit Rate Decision Tournament",
        href: "/lessons/4-7/downloads/printables/4-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Solve Problems with Unit Rates — Color by Number",
        href: "/lessons/4-7/downloads/printables/4-7-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "5-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Parallelogram Cut-and-Slide Lab",
        href: "/lessons/5-1/downloads/printables/5-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Parallelograms — Color by Number",
        href: "/lessons/5-1/downloads/printables/5-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Area of Parallelograms — Vocabulary Word Search",
        href: "/lessons/5-1/downloads/printables/5-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Area of Parallelograms — MCAP-Style Practice",
        href: "/lessons/5-1/downloads/printables/5-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "5-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Trapezoid Formula Builder Puzzle",
        href: "/lessons/5-2/downloads/printables/5-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Trapezoids — Color by Number",
        href: "/lessons/5-2/downloads/printables/5-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Area of Trapezoids — Vocabulary Word Search",
        href: "/lessons/5-2/downloads/printables/5-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Area of Trapezoids — MCAP-Style Practice",
        href: "/lessons/5-2/downloads/printables/5-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "5-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Triangle Half-Rectangle Match",
        href: "/lessons/5-3/downloads/printables/5-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Triangles — Color by Number",
        href: "/lessons/5-3/downloads/printables/5-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Area of Triangles — Vocabulary Word Search",
        href: "/lessons/5-3/downloads/printables/5-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Area of Triangles — MCAP-Style Practice",
        href: "/lessons/5-3/downloads/printables/5-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "5-3-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-3-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Triangle Design Studio",
        href: "/lessons/5-3-flagship/downloads/printables/5-3-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Triangles — Color by Number",
        href: "/lessons/5-3-flagship/downloads/printables/5-3-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Area of Triangles — Vocabulary Word Search",
        href: "/lessons/5-3-flagship/downloads/printables/5-3-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Area of Triangles — MCAP-Style Practice",
        href: "/lessons/5-3-flagship/downloads/printables/5-3-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "5-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Polygon Decompose Gallery",
        href: "/lessons/5-4/downloads/printables/5-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Regular Polygons — Color by Number",
        href: "/lessons/5-4/downloads/printables/5-4-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "5-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/5-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Composite Figure Area Rescue",
        href: "/lessons/5-5/downloads/printables/5-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Area of Composite Figures — Color by Number",
        href: "/lessons/5-5/downloads/printables/5-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Area of Composite Figures — Vocabulary Word Search",
        href: "/lessons/5-5/downloads/printables/5-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Area of Composite Figures — MCAP-Style Practice",
        href: "/lessons/5-5/downloads/printables/5-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Exponent Card Stack",
        href: "/lessons/6-1/downloads/printables/6-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Powers and Exponents — Color by Number",
        href: "/lessons/6-1/downloads/printables/6-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Powers and Exponents — Vocabulary Word Search",
        href: "/lessons/6-1/downloads/printables/6-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Powers and Exponents — MCAP-Style Practice",
        href: "/lessons/6-1/downloads/printables/6-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Powers Puzzle Race",
        href: "/lessons/6-1-flagship/downloads/printables/6-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Powers and Exponents — Color by Number",
        href: "/lessons/6-1-flagship/downloads/printables/6-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Powers and Exponents — Vocabulary Word Search",
        href: "/lessons/6-1-flagship/downloads/printables/6-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Powers and Exponents — MCAP-Style Practice",
        href: "/lessons/6-1-flagship/downloads/printables/6-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Expression Substitution Menu",
        href: "/lessons/6-2/downloads/printables/6-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Evaluate Expressions — Color by Number",
        href: "/lessons/6-2/downloads/printables/6-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Evaluate Expressions — Vocabulary Word Search",
        href: "/lessons/6-2/downloads/printables/6-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Evaluate Expressions — MCAP-Style Practice",
        href: "/lessons/6-2/downloads/printables/6-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Words-to-Expression Match",
        href: "/lessons/6-3/downloads/printables/6-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Write Algebraic Expressions — Color by Number",
        href: "/lessons/6-3/downloads/printables/6-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Write Algebraic Expressions — Vocabulary Word Search",
        href: "/lessons/6-3/downloads/printables/6-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Write Algebraic Expressions — MCAP-Style Practice",
        href: "/lessons/6-3/downloads/printables/6-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Property Sorting Court",
        href: "/lessons/6-4/downloads/printables/6-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Properties of Operations — Color by Number",
        href: "/lessons/6-4/downloads/printables/6-4-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "6-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Distributive Area Model Tiles",
        href: "/lessons/6-5/downloads/printables/6-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 The Distributive Property — Color by Number",
        href: "/lessons/6-5/downloads/printables/6-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 The Distributive Property — Vocabulary Word Search",
        href: "/lessons/6-5/downloads/printables/6-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 The Distributive Property — MCAP-Style Practice",
        href: "/lessons/6-5/downloads/printables/6-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Equivalent Expression Maze",
        href: "/lessons/6-6/downloads/printables/6-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Equivalent Expressions — Color by Number",
        href: "/lessons/6-6/downloads/printables/6-6-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Equivalent Expressions — Vocabulary Word Search",
        href: "/lessons/6-6/downloads/printables/6-6-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Equivalent Expressions — MCAP-Style Practice",
        href: "/lessons/6-6/downloads/printables/6-6-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "6-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/6-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Like Terms Color Sort",
        href: "/lessons/6-7/downloads/printables/6-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Simplify Algebraic Expressions — Color by Number",
        href: "/lessons/6-7/downloads/printables/6-7-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "7-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Equation Story Match",
        href: "/lessons/7-1/downloads/printables/7-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Write Equations — Color by Number",
        href: "/lessons/7-1/downloads/printables/7-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Write Equations — Vocabulary Word Search",
        href: "/lessons/7-1/downloads/printables/7-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Write Equations — MCAP-Style Practice",
        href: "/lessons/7-1/downloads/printables/7-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Equation Detective Case Files",
        href: "/lessons/7-1-flagship/downloads/printables/7-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Write Equations — Color by Number",
        href: "/lessons/7-1-flagship/downloads/printables/7-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Write Equations — Vocabulary Word Search",
        href: "/lessons/7-1-flagship/downloads/printables/7-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Write Equations — MCAP-Style Practice",
        href: "/lessons/7-1-flagship/downloads/printables/7-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Balance Scale Inverse Cards",
        href: "/lessons/7-2/downloads/printables/7-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Solve One-Step Addition and Subtraction Equations — Color by Number",
        href: "/lessons/7-2/downloads/printables/7-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Solve One-Step Addition and Subtraction Equations — Vocabulary Word Search",
        href: "/lessons/7-2/downloads/printables/7-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Solve One-Step Addition and Subtraction Equations — MCAP-Style Practice",
        href: "/lessons/7-2/downloads/printables/7-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Equation Match Sprint",
        href: "/lessons/7-3/downloads/printables/7-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Solve Multiplication and Division Equations — Color by Number",
        href: "/lessons/7-3/downloads/printables/7-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Solve Multiplication and Division Equations — Vocabulary Word Search",
        href: "/lessons/7-3/downloads/printables/7-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Solve Multiplication and Division Equations — MCAP-Style Practice",
        href: "/lessons/7-3/downloads/printables/7-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Inequality Statement Sort",
        href: "/lessons/7-4/downloads/printables/7-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Write Inequalities — Color by Number",
        href: "/lessons/7-4/downloads/printables/7-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Write Inequalities — Vocabulary Word Search",
        href: "/lessons/7-4/downloads/printables/7-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Write Inequalities — MCAP-Style Practice",
        href: "/lessons/7-4/downloads/printables/7-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Number Line Gallery Walk",
        href: "/lessons/7-5/downloads/printables/7-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Graph Inequalities — Color by Number",
        href: "/lessons/7-5/downloads/printables/7-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Graph Inequalities — Vocabulary Word Search",
        href: "/lessons/7-5/downloads/printables/7-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Graph Inequalities — MCAP-Style Practice",
        href: "/lessons/7-5/downloads/printables/7-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "7-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Solve-and-Graph Relay",
        href: "/lessons/7-6/downloads/printables/7-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Solve and Graph Inequalities — Color by Number",
        href: "/lessons/7-6/downloads/printables/7-6-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "7-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/7-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Model-It Choice Board",
        href: "/lessons/7-7/downloads/printables/7-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Equations and Inequalities Problem Solving — Color by Number",
        href: "/lessons/7-7/downloads/printables/7-7-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "8-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Statistical Question Sort",
        href: "/lessons/8-1/downloads/printables/8-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Statistical Questions and Data — Color by Number",
        href: "/lessons/8-1/downloads/printables/8-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Statistical Questions and Data — Vocabulary Word Search",
        href: "/lessons/8-1/downloads/printables/8-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Statistical Questions and Data — MCAP-Style Practice",
        href: "/lessons/8-1/downloads/printables/8-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Data Investigation Proposal",
        href: "/lessons/8-1-flagship/downloads/printables/8-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Statistical Questions and Data — Color by Number",
        href: "/lessons/8-1-flagship/downloads/printables/8-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Statistical Questions and Data — Vocabulary Word Search",
        href: "/lessons/8-1-flagship/downloads/printables/8-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Statistical Questions and Data — MCAP-Style Practice",
        href: "/lessons/8-1-flagship/downloads/printables/8-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Center Measure Card Game",
        href: "/lessons/8-2/downloads/printables/8-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Mean, Median, and Mode — Color by Number",
        href: "/lessons/8-2/downloads/printables/8-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Mean, Median, and Mode — Vocabulary Word Search",
        href: "/lessons/8-2/downloads/printables/8-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Mean, Median, and Mode — MCAP-Style Practice",
        href: "/lessons/8-2/downloads/printables/8-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 MAD Step-Strip Lab",
        href: "/lessons/8-3/downloads/printables/8-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Mean Absolute Deviation — Color by Number",
        href: "/lessons/8-3/downloads/printables/8-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Mean Absolute Deviation — Vocabulary Word Search",
        href: "/lessons/8-3/downloads/printables/8-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Mean Absolute Deviation — MCAP-Style Practice",
        href: "/lessons/8-3/downloads/printables/8-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Best Measure of Center Court",
        href: "/lessons/8-4/downloads/printables/8-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Appropriate Measures — Color by Number",
        href: "/lessons/8-4/downloads/printables/8-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Appropriate Measures — Vocabulary Word Search",
        href: "/lessons/8-4/downloads/printables/8-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Appropriate Measures — MCAP-Style Practice",
        href: "/lessons/8-4/downloads/printables/8-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Five-Number Summary Box Plot",
        href: "/lessons/8-5/downloads/printables/8-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Display Data: Box Plots — Color by Number",
        href: "/lessons/8-5/downloads/printables/8-5-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Display Data: Box Plots — Vocabulary Word Search",
        href: "/lessons/8-5/downloads/printables/8-5-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Display Data: Box Plots — MCAP-Style Practice",
        href: "/lessons/8-5/downloads/printables/8-5-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Histogram Interval Builder",
        href: "/lessons/8-6/downloads/printables/8-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Display Data: Histograms — Color by Number",
        href: "/lessons/8-6/downloads/printables/8-6-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Display Data: Histograms — Vocabulary Word Search",
        href: "/lessons/8-6/downloads/printables/8-6-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Display Data: Histograms — MCAP-Style Practice",
        href: "/lessons/8-6/downloads/printables/8-6-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "8-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/8-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Distribution Shape Gallery",
        href: "/lessons/8-7/downloads/printables/8-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Shape of Data Distributions — Color by Number",
        href: "/lessons/8-7/downloads/printables/8-7-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Shape of Data Distributions — Vocabulary Word Search",
        href: "/lessons/8-7/downloads/printables/8-7-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Shape of Data Distributions — MCAP-Style Practice",
        href: "/lessons/8-7/downloads/printables/8-7-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-1": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-1/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Coordinate Treasure Hunt",
        href: "/lessons/9-1/downloads/printables/9-1-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Graph on the Coordinate Plane — Color by Number",
        href: "/lessons/9-1/downloads/printables/9-1-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Graph on the Coordinate Plane — Vocabulary Word Search",
        href: "/lessons/9-1/downloads/printables/9-1-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Graph on the Coordinate Plane — MCAP-Style Practice",
        href: "/lessons/9-1/downloads/printables/9-1-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-1-flagship": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-1-flagship/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Coordinate Map Mission",
        href: "/lessons/9-1-flagship/downloads/printables/9-1-flagship-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Graph on the Coordinate Plane — Color by Number",
        href: "/lessons/9-1-flagship/downloads/printables/9-1-flagship-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Graph on the Coordinate Plane — Vocabulary Word Search",
        href: "/lessons/9-1-flagship/downloads/printables/9-1-flagship-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Graph on the Coordinate Plane — MCAP-Style Practice",
        href: "/lessons/9-1-flagship/downloads/printables/9-1-flagship-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-2": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-2/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Integer & Absolute Value Battle",
        href: "/lessons/9-2/downloads/printables/9-2-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Integers and Absolute Value — Color by Number",
        href: "/lessons/9-2/downloads/printables/9-2-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Integers and Absolute Value — Vocabulary Word Search",
        href: "/lessons/9-2/downloads/printables/9-2-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Integers and Absolute Value — MCAP-Style Practice",
        href: "/lessons/9-2/downloads/printables/9-2-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-3": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-3/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Integer Order Relay",
        href: "/lessons/9-3/downloads/printables/9-3-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Compare and Order Integers — Color by Number",
        href: "/lessons/9-3/downloads/printables/9-3-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Compare and Order Integers — Vocabulary Word Search",
        href: "/lessons/9-3/downloads/printables/9-3-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Compare and Order Integers — MCAP-Style Practice",
        href: "/lessons/9-3/downloads/printables/9-3-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-4": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-4/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Rational Number Clothesline",
        href: "/lessons/9-4/downloads/printables/9-4-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Rational Numbers on the Number Line — Color by Number",
        href: "/lessons/9-4/downloads/printables/9-4-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Rational Numbers on the Number Line — Vocabulary Word Search",
        href: "/lessons/9-4/downloads/printables/9-4-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Rational Numbers on the Number Line — MCAP-Style Practice",
        href: "/lessons/9-4/downloads/printables/9-4-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-5": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-5/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Four-Quadrant Battleship",
        href: "/lessons/9-5/downloads/printables/9-5-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Ordered Pairs in All Four Quadrants — Color by Number",
        href: "/lessons/9-5/downloads/printables/9-5-color-by-number.pdf",
        isPrintable: true,
      },
    ],
    "9-6": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-6/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Coordinate Taxi Routes",
        href: "/lessons/9-6/downloads/printables/9-6-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Distance on the Coordinate Plane — Color by Number",
        href: "/lessons/9-6/downloads/printables/9-6-color-by-number.pdf",
        isPrintable: true,
      },
      {
        text: "🔎 Distance on the Coordinate Plane — Vocabulary Word Search",
        href: "/lessons/9-6/downloads/printables/9-6-word-search.pdf",
        isPrintable: true,
      },
      {
        text: "📝 Distance on the Coordinate Plane — MCAP-Style Practice",
        href: "/lessons/9-6/downloads/printables/9-6-mcap-practice.docx",
        isPrintable: true,
      },
    ],
    "9-7": [
      {
        text: "📝 Practice Worksheet (A & B)",
        href: "/lessons/9-7/worksheet.html",
        isPrintable: true,
      },
      {
        text: "🎲 Reflection Mirror Map",
        href: "/lessons/9-7/downloads/printables/9-7-activity.pdf",
        isPrintable: true,
      },
      {
        text: "🎨 Reflect Points Across Axes — Color by Number",
        href: "/lessons/9-7/downloads/printables/9-7-color-by-number.pdf",
        isPrintable: true,
      },
    ],
  };

  var LESSON_PROJECTS = {
    // Unit 1 - The Number System
    "1-1": [
      {
        text: "Lesson 1-1: Prime Factorization Game",
        href: "/math/unit-1/factor-tree-salvage/",
      },
    ],

    // Unit 2 - Fractions
    "2-1": [
      {
        text: "Lesson 2-1: Fraction Division Soccer Game",
        href: "/math/unit-2/fraction-division-soccer/",
      },
    ],
    "2-2": [
      {
        text: "Lesson 2-2: Fraction Division Soccer Game",
        href: "/math/unit-2/fraction-division-soccer/",
      },
    ],

    // Unit 3 - Ratios
    "3-1": [
      {
        text: "Kitchen Chef Game",
        href: "/math/unit-3/6-rp-1game/",
      },
    ],
    "3-2": [
      {
        text: "Recipe Factory",
        href: "/math/unit-3/recipe-factory-line/",
      },
      { text: "RatioLab", href: "/ratiolab/" },
    ],
    "3-3": [{ text: "RatioLab", href: "/ratiolab/" }],
    "3-4": [
      {
        text: "Recipe Factory",
        href: "/math/unit-3/recipe-factory-line/",
      },
    ],

    // Unit 4 - Rates & Percents
    "4-2": [
      {
        text: "Lesson 4-2: Relate Fractions, Decimals, and Percents Game",
        href: "/math/unit-2/pixel-area-model/",
      },
    ],
    "4-3": [
      {
        text: "Lesson 4-3: Percents Greater Than 100% and Less Than 1% Game",
        href: "/math/unit-2/pixel-area-model/",
      },
    ],
    "4-4": [
      {
        text: "Lesson 4-4: Find the Percent of a Number Game",
        href: "/math/unit-2/pixel-area-model/",
      },
    ],
    "4-5": [
      {
        text: "Lesson 4-5: Use Percent to Solve Problems Game",
        href: "/math/unit-2/pixel-area-model/",
      },
    ],

    // Unit 5 - Area
    "5-1": [
      {
        text: "Lesson 5-1: Area of Parallelograms Game",
        href: "/math/unit-10/area-architect/",
      },
    ],
    "5-2": [
      { text: "Lesson 5-2: Area of Triangles Game", href: "/math/unit-10/area-architect/" },
    ],
    "5-3": [
      { text: "Lesson 5-3: Area of Trapezoids Game", href: "/math/unit-10/area-architect/" },
    ],
    "5-4": [
      { text: "Lesson 5-4: Apply Area Concepts Game", href: "/math/unit-10/area-architect/" },
    ],

    // Unit 6 - Expressions
    "6-1": [
      {
        text: "Lesson 6-1: Powers and Exponents Game",
        href: "/math/unit-6/exponent-space-launch/",
      },
    ],
    "6-2": [
      {
        text: "Lesson 6-2: Numerical Expressions Game",
        href: "/math/unit-6/pemdas-alchemy/",
      },
    ],
    "6-3": [
      {
        text: "Distributive Alchemy",
        href: "/math/unit-6/distributive-alchemy/",
      },
    ],
    "6-4": [
      {
        text: "Equivalent Expressions Forge",
        href: "/math/unit-6/equivalent-expressions-forge/",
      },
    ],
    "6-5": [{ text: "Word-to-Equations", href: "/word-to-equations/" }],

    // Unit 7 - Equations / Two-Variable Relationships
    "7-2": [
      {
        text: "One-Step Solver Arena",
        href: "/math/unit-8/one-step-solver-arena/",
      },
    ],
    "7-3": [
      {
        text: "Lesson 7-3: Solve Multiplication and Division Equations Game",
        href: "/math/unit-8/inverse-balance-scale/",
      },
    ],
    "7-4": [
      {
        text: "Neon Inequality",
        href: "/math/unit-8/neon-inequality/",
      },
    ],
    "7-6": [
      {
        text: "Mars Exploration Game",
        href: "/math/unit-9/6-ee-c-9martiangame/",
      },
      {
        text: "Variable Velocity Racing",
        href: "/math/unit-9/6-ee-c-9variablevelocitygame/",
      },
      {
        text: "Lesson 7-6: Relationships Between Two Variables Game",
        href: "/math/unit-9/variable-voyage/",
      },
    ],
    "7-7": [
      {
        text: "Variable Velocity Racing",
        href: "/math/unit-9/6-ee-c-9variablevelocitygame/",
      },
      {
        text: "Lesson 7-7: Graphs of Relationships Game",
        href: "/math/unit-9/variable-voyage/",
      },
    ],

    // Unit 8 - Statistics
    "8-1": [
      {
        text: "Statistical Question Detective",
        href: "/math/statistics/6-sp-a-1reviewactivities/",
      },
      {
        text: "6.DS.A.1 Data Lab",
        href: "/math/statistics/6-sp-a-1data-lab-6-sp-a-1-flagship/",
      },
    ],
    "8-2": [
      {
        text: "Stats of My Life Project",
        href: "/math/statistics/statistics-of-my-life/",
      },
      {
        text: "Stats Choice Quest",
        href: "/math/statistics/meanmedianmodesoccerandbracelets/",
      },
      {
        text: "Lesson 8-2: Mean, Median, and Mode Game",
        href: "/gemini-data-quest/gemini_median_mode_ai_adventure.html",
      },
    ],
    "8-3": [
      {
        text: "Lesson 8-3: Mean Absolute Deviation Game",
        href: "/math/unit-8/mad-balance-sandbox/",
      },
    ],
    "8-5": [
      {
        text: "Box Plot Builder",
        href: "/math/statistics/box-plot-builder/",
      },
      {
        text: "Box Plot Detective Game",
        href: "/math/statistics/box-plot-detective/",
      },
    ],
    "8-6": [
      {
        text: "Histogram Master Lab",
        href: "/math/statistics/histogram-master-lab/",
      },
      {
        text: "Histogram Hero Game",
        href: "/math/statistics/histogram-hero/",
      },
      {
        text: "Disease Detectives (Level 2)",
        href: "/math/statistics/histogram-master-lab/games/disease-detectives-level-2.html",
      },
      {
        text: "Game Day Data Lab (Level 2)",
        href: "/math/statistics/histogram-master-lab/games/game-day-data-lab-level-2.html",
      },
      {
        text: "Histogram Graphic Novel",
        href: "/math/statistics/histogram-graphic-novel/",
      },
    ],

    // Unit 9 - Coordinate Plane & Integers
    "9-1": [
      {
        text: "Coordinate Graphing Game",
        href: "/math/unit-7/6-ns-c-6game/",
      },
      { text: "Cartesian Odyssey", href: "/cartesian-odyssey/" },
      { text: "Lesson 9-1: Represent Integers Game", href: "/math/unit-7/subzero-ledger/" },
    ],
    "9-2": [
      {
        text: "Coordinate Graphing Game",
        href: "/math/unit-7/6-ns-c-6game/",
      },
      { text: "Cartesian Odyssey", href: "/cartesian-odyssey/" },
      {
        text: "Lesson 9-2: Opposites and Absolute Value Game",
        href: "/math/unit-7/subzero-ledger/",
      },
    ],
    "9-3": [
      {
        text: "Lesson 9-3: Compare and Order Integers Game",
        href: "/math/unit-7/subzero-ledger/",
      },
    ],
    "9-4": [
      { text: "Lesson 9-4: Rational Numbers Game", href: "/math/unit-7/subzero-ledger/" },
    ],
    "9-6": [
      {
        text: "Lesson 9-6: Graph Reflections of Points Game",
        href: "/math/unit-7/coordinate-reflections/",
      },
    ],
    "9-7": [
      {
        text: "Lesson 9-7: Absolute Value and Distance Game",
        href: "/math/unit-7/subzero-ledger/",
      },
    ],

    // Unit 10 - Geometry / Volume & Surface Area
    "10-1": [
      {
        text: "Lesson 10-1: Volume of Rectangular Prisms Game",
        href: "/math/unit-10/voxel-volume-pack/",
      },
    ],
    "10-3": [
      { text: "NetFold Pro Simulator", href: "/netfold-pro/" },
      {
        text: "Nets of 3D Figures",
        href: "/math/unit-5/supplemental/5-6session1/",
      },
    ],
    "10-5": [
      { text: "NetFold Pro Simulator", href: "/netfold-pro/" },
      {
        text: "Nets of 3D Figures",
        href: "/math/unit-5/supplemental/5-6session1/",
      },
    ],
  };

  // 1. Scrape Curriculum Data from existing DOM
  var unitsData = [];

  // Render an activity outline as 4 labeled, ordered sections.
  // Organization only — same items, same hrefs/icons/order within a
  // group; no items added or removed. Categorize by visible label text
  // (case-insensitive substring): check Lesson&Slides / Notes&Handouts /
  // Homework&Family first, else fall back to Practice & Games.
  var OUTLINE_GROUPS = [
    {
      title: "✅ Must Do · Learn",
      keywords: [
        "open the lesson",
        "interactive lesson",
        "reveal math",
        "editable slides",
        "google slides",
        "google drive copy",
        "present",
        "slides",
      ],
    },
    {
      title: "🧩 If Needed · Supports",
      keywords: ["notes", "handout"],
    },
    {
      title: "🏠 At Home · Continue",
      keywords: ["homework", "family", "forms"],
    },
    // Practice & Games is the catch-all; rendered last regardless of
    // position here (see buildGroupedOutline ordering).
  ];

  function outlineItemIcon(act, isProject) {
    var name = (act.text || "").toLowerCase();
    if (act.isBonus) return "🎯";
    if (isProject) return "🛠️";
    if (name.indexOf("lesson") > -1 || name.indexOf("html") > -1) return "💻";
    if (name.indexOf("notes") > -1 || name.indexOf("packet") > -1) return "📝";
    if (name.indexOf("homework") > -1) return "🏠";
    return "🔗";
  }

  function outlineCategoryIndex(act) {
    var name = (act.text || "").toLowerCase();
    for (var g = 0; g < OUTLINE_GROUPS.length; g++) {
      var kw = OUTLINE_GROUPS[g].keywords;
      for (var k = 0; k < kw.length; k++) {
        if (name.indexOf(kw[k]) > -1) return g;
      }
    }
    // No match → Practice & Games (catch-all bucket index).
    return OUTLINE_GROUPS.length;
  }

  // Canvas (SCORM) one-click downloads. /api/scorm wraps the LIVE page
  // in a ready-to-upload SCORM 1.2 zip (functions/api/scorm.js), so a
  // download link only needs the target path + a Canvas-facing title.
  // Only same-site targets can be packaged (also enforced server-side).
  // File downloads (printables: PDF/DOCX/etc.) are excluded — a SCORM
  // package that iframes a file can never report a grade to Canvas.
  function canPackageForScorm(href) {
    href = String(href || "");
    if (/\.(pdf|docx?|pptx?|xlsx?|zip|png|jpe?g|gif|svg|mp[34])([?#]|$)/i.test(href)) {
      return false;
    }
    if (href.charAt(0) === "/") return true;
    return /^https?:\/\/(www\.)?eduwonderlab\.com\//i.test(href);
  }
  function scormDownloadHref(target, title) {
    return (
      "/api/scorm?activity=" +
      encodeURIComponent(target) +
      (title ? "&title=" + encodeURIComponent(title) : "")
    );
  }
  function makeScormLink(target, title, label, className) {
    var a = document.createElement("a");
    a.className = className;
    a.href = scormDownloadHref(target, title);
    a.title = "Download “" + title + "” as a Canvas-ready SCORM package";
    a.setAttribute("aria-label", a.title);
    a.textContent = label;
    return a;
  }
  // Shared with the deferred enhancement layers so search results carry
  // the same one-click downloads (assets/curriculum-enhancements.js).
  window.NeftScorm = {
    canPackage: canPackageForScorm,
    downloadHref: scormDownloadHref,
    makeLink: makeScormLink,
  };

  // Static differentiated cards (small-group / catch-up) are hand-spliced
  // HTML that never flows through makeOutlineItem — give their launch
  // links the same one-click Canvas chip the core outline rows get.
  document
    .querySelectorAll(".lesson-smallgroup .res-row .res, .lesson-catchup .res-row .res")
    .forEach(function (link) {
      var href = link.getAttribute("href");
      if (!canPackageForScorm(href)) return;
      if (link.parentElement.querySelector(".scorm-dl")) return;
      var head = link.closest("details");
      var title =
        (head && head.querySelector(".lesson-head")
          ? head.querySelector(".lesson-head").textContent.replace(/\s+/g, " ").trim()
          : link.textContent) || "Small Group";
      var moreBody = ensureOutlineMore(link.parentElement);
      moreBody.appendChild(makeScormLink(href, title, "⬇", "scorm-dl"));
    });

  function ensureOutlineMore(li) {
    if (!li) return null;
    var more = li.querySelector(".outline-more");
    if (!more) {
      more = document.createElement("details");
      more.className = "outline-more";
      var sum = document.createElement("summary");
      sum.textContent = "More";
      sum.setAttribute("aria-label", "More actions");
      var body = document.createElement("div");
      body.className = "outline-more-body";
      more.appendChild(sum);
      more.appendChild(body);
      li.appendChild(more);
    }
    var bodyEl = more.querySelector(".outline-more-body");
    Array.prototype.slice.call(li.children).forEach(function (node) {
      if (
        node.classList &&
        (node.classList.contains("scorm-dl") ||
          node.classList.contains("lesson-print-activity"))
      ) {
        bodyEl.appendChild(node);
      }
    });
    return bodyEl;
  }

  function makeOutlineItem(act, isProject, scormTitlePrefix) {
    var li = document.createElement("li");
    li.className = "lesson-outline-item";
    var a = document.createElement("a");
    a.href = act.href;
    a.target = "_blank";
    if (isProject) {
      a.className = "res-project";
    } else if (act.isBonus) {
      a.className = "res-bonus";
    }
    a.innerHTML = outlineItemIcon(act, isProject) + " " + act.text;
    li.appendChild(a);
    if (canPackageForScorm(act.href)) {
      ensureOutlineMore(li).appendChild(
        makeScormLink(
          act.href,
          (scormTitlePrefix ? scormTitlePrefix + " — " : "") + act.text,
          "⬇",
          "scorm-dl",
        ),
      );
    }
    return li;
  }

  // Populate `listEl` (a .lesson-outline-list <ul>) with grouped
  // sections. Each non-empty group gets a sub-header; items keep their
  // original relative order. `projects` is the lesson's projects array
  // (used to flag project items), may be undefined.
  function buildGroupedOutline(listEl, allActs, projects, scormTitlePrefix) {
    // Buckets: one per defined group, plus a final Practice & Games
    // catch-all.
    var buckets = [];
    for (var i = 0; i <= OUTLINE_GROUPS.length; i++) buckets.push([]);
    allActs.forEach(function (act) {
      buckets[outlineCategoryIndex(act)].push(act);
    });

    var sections = OUTLINE_GROUPS.map(function (grp, idx) {
      return { title: grp.title, items: buckets[idx] };
    });
    // Insert Practice & Games (catch-all) in 3rd position so display
    // order is: Lesson & Slides, Notes & Handouts, Practice & Games,
    // Homework & Family.
    sections.splice(2, 0, {
      title: "🎯 Practice · Apply",
      items: buckets[OUTLINE_GROUPS.length],
    });

    sections.forEach(function (section) {
      if (!section.items.length) return;
      var groupEl = document.createElement("li");
      groupEl.className = "lesson-outline-group";

      var titleEl = document.createElement("span");
      titleEl.className = "lesson-outline-group-title";
      titleEl.textContent = section.title;
      groupEl.appendChild(titleEl);

      var subList = document.createElement("ul");
      subList.className = "lesson-outline-list";
      section.items.forEach(function (act) {
        var isProject = projects && projects.indexOf(act) > -1;
        subList.appendChild(makeOutlineItem(act, isProject, scormTitlePrefix));
      });
      groupEl.appendChild(subList);
      listEl.appendChild(groupEl);
    });
  }
  // Sort an activity into one of three lesson phases for the
  // Pre-Lesson / Lesson / Post-Lesson dropdowns:
  //   0 = Pre-Lesson  — readiness warm-up / vocabulary (before the lesson)
  //   1 = Lesson      — the lesson work: interactive HTML, slides, notes
  //   2 = Post-Lesson — homework, family homework, forms, games,
  //                     bonus activities, printables, projects
  function lessonPhaseIndex(act, isProject) {
    // Explicit override wins (e.g. the Interactive Tools activity pins to
    // the Lesson phase regardless of its label).
    if (typeof act.phaseIndex === "number") return act.phaseIndex;
    var name = (act.text || "").toLowerCase();
    var href = (act.href || "").toLowerCase();

    // Separate games bucket (index 3)
    if (
      /game|games|play|arcade|escape|relay|hunt|puzzle|maze|alchemy|forge|odyssey|coordinate defender|scoring engine|pricing engine|aquarium build|room designer|package design/.test(
        name,
      ) ||
      /\/games\/|\/game\//.test(href)
    ) {
      return 3;
    }

    if (
      /get ready|readiness|pre-?lesson|pre-?test|vocab|warm[- ]?up/.test(name) ||
      /\/readiness\//.test(href)
    ) {
      return 0;
    }
    if (
      isProject ||
      act.isBonus ||
      act.isFamilyHomework ||
      act.isPrintable ||
      /homework|family|forms|quiz|assessment|project|practice|printable|word search|color by|paper|challenge/.test(
        name,
      )
    ) {
      return 2;
    }
    if (
      /interactive lesson|open the lesson|reveal math|editable slides|google slides|google drive|present|slides|notes|handout|packet|guided/.test(
        name,
      )
    ) {
      return 1;
    }
    // Unrecognized extras default to Post-Lesson activities.
    return 2;
  }

  // Sort key for a lessonId like "1-5", "1-5-group1", or
  // "1-1-flagship": unit, lesson, guided groups, then flagship variant.
  function lessonRank(lessonId) {
    var m = String(lessonId || "").match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return 9999999;
    var variant = 0;
    if (/group1/i.test(lessonId)) variant = 1;
    if (/group2/i.test(lessonId)) variant = 2;
    if (/flagship/i.test(lessonId)) variant = 3;
    return parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + variant;
  }

  var units = Array.prototype.slice.call(document.querySelectorAll("details.unit"));

  units.forEach(function (u, uIdx) {
    var unitNumEl = u.querySelector(".unit-num");
    var unitNameEl = u.querySelector(".unit-name");
    var unitBlurbEl = u.querySelector(".unit-blurb");
    var unitClusterEl = u.querySelector(".badge-cluster");

    var unitNum = unitNumEl ? unitNumEl.textContent.trim() : "Unit " + (uIdx + 1);
    var unitName = unitNameEl ? unitNameEl.textContent.trim() : "";
    var unitBlurb = unitBlurbEl ? unitBlurbEl.textContent.trim() : "";
    var unitCluster = unitClusterEl ? unitClusterEl.textContent.trim() : "";

    var unitInteger = parseInt(unitNum.replace(/\D/g, ""), 10);

    // Scrape unit resources. Each `.unit-res` block is labeled either
    // "Unit resources" (unit-wide tools, shown as buttons on the card)
    // or "End of Unit" (culminating novels/project/tests). The latter
    // are collected separately so they can be surfaced as a dedicated
    // "End-of-Unit" entry at the bottom of the lesson dropdown.
    var unitRes = [];
    var endOfUnitRes = [];
    var resBlocks = Array.prototype.slice.call(u.querySelectorAll(".unit-res"));
    resBlocks.forEach(function (block) {
      var labelEl = block.querySelector(".unit-res-label");
      var isEndOfUnit = labelEl && /end of unit/i.test(labelEl.textContent || "");
      var target = isEndOfUnit ? endOfUnitRes : unitRes;
      Array.prototype.slice.call(block.querySelectorAll(".res")).forEach(function (r) {
        target.push({
          text: r.textContent.trim(),
          href: r.getAttribute("href"),
        });
      });
    });

    // Lesson-band games ("Play: Factor Frenzy") are spliced into the
    // static unit-body directly above the first lesson of their band.
    // The hub render drops non-lesson nodes, so scrape them here and
    // attach each to its band's first lesson as a game activity —
    // keeping the unit games visible AND one-click Canvas-packagable
    // (makeOutlineItem adds the SCORM chip automatically).
    var bandGamesByLesson = {};
    Array.prototype.slice.call(u.querySelectorAll(".band-game")).forEach(function (bg) {
      var link = bg.querySelector(".band-game-link");
      if (!link) return;
      var next = bg.nextElementSibling;
      while (next && !(next.matches && next.matches("details.lesson"))) {
        next = next.nextElementSibling;
      }
      var bandHead = next && next.querySelector(".lesson-head");
      var m = bandHead && (bandHead.textContent || "").match(/Lesson\s+([0-9\-a-zA-Z]+)/);
      var key = m ? m[1].replace("-flagship", "") : "__unit__";
      var titleEl = bg.querySelector(".band-game-title");
      var subEl = bg.querySelector(".band-game-sub");
      var gameTitle = ((titleEl && titleEl.textContent) || "Unit Game").replace(
        /^Play:\s*/,
        "",
      );
      var gameSub = (subEl && subEl.textContent) || "";
      (bandGamesByLesson[key] = bandGamesByLesson[key] || []).push({
        text: "🎮 " + gameTitle + (gameSub ? " — " + gameSub : ""),
        href: link.getAttribute("href"),
      });
    });
    // A band game whose band start can't be resolved still surfaces as
    // a unit-wide resource button rather than disappearing.
    (bandGamesByLesson.__unit__ || []).forEach(function (g) {
      unitRes.push(g);
    });

    // Scrape lessons
    var lessonsData = [];
    var lessons = Array.prototype.slice.call(u.querySelectorAll("details.lesson"));
    lessons.forEach(function (l, lIdx) {
      var headEl = l.querySelector(".lesson-head");
      var head = headEl ? headEl.textContent.trim() : "Lesson " + (lIdx + 1);
      head = head.replace(/\s+/g, " "); // Clean whitespaces

      var headHTML = headEl ? headEl.innerHTML.trim() : "Lesson " + (lIdx + 1);

      var objEl = l.querySelector(".lesson-obj");
      var obj = objEl ? objEl.textContent.trim() : "";

      var activities = [];
      var actLinks = Array.prototype.slice.call(l.querySelectorAll(".lesson-body .res"));
      actLinks.forEach(function (a) {
        activities.push({
          text: a.textContent.trim(),
          href: a.getAttribute("href"),
        });
      });

      var dataSearch = l.getAttribute("data-search") || "";
      var lessonPath = activities
        .map(function (activity) {
          return activity.href || "";
        })
        .find(function (href) {
          return /^\/lessons\/\d+-\d+(?:-(?:group[12]|flagship))?\/$/i.test(href);
        });
      var lessonIdMatch = lessonPath
        ? lessonPath.match(/^\/lessons\/([^/]+)\/$/)
        : head.match(/Lesson\s+([0-9\-a-zA-Z]+)/);
      var lessonId = lessonIdMatch ? lessonIdMatch[1] : "";
      var baseLessonId = lessonId.replace("-flagship", "");

      // TPT bonus activity — appears in the curriculum activity dropdown.
      var bonus = LESSON_BONUS_ACTIVITIES[lessonId] || LESSON_BONUS_ACTIVITIES[baseLessonId];
      if (bonus) {
        activities.push(bonus);
      }

      // Family homework — interactive take-home practice per lesson.
      var familyHw = LESSON_FAMILY_HOMEWORK[lessonId] || LESSON_FAMILY_HOMEWORK[baseLessonId];
      if (familyHw) {
        activities.push(familyHw);
      }

      // Printables — paper game, color-by-number, word search, MCAP packet.
      var printables = LESSON_PRINTABLES[lessonId] || LESSON_PRINTABLES[baseLessonId];
      if (printables) {
        printables.forEach(function (p) {
          activities.push(p);
        });
      }

      // Lesson-band game — the bespoke unit game whose band starts at
      // this lesson (see bandGamesByLesson scrape above). Flagship
      // twins inherit it like bonus/homework activities do.
      var bandGames = bandGamesByLesson[lessonId] || bandGamesByLesson[baseLessonId];
      if (bandGames) {
        bandGames.forEach(function (g) {
          activities.push(g);
        });
      }

      // Resolve projects
      var projects = LESSON_PROJECTS[lessonId] || LESSON_PROJECTS[baseLessonId];
      if (!projects || projects.length === 0) {
        var culminatingHref = UNIT_CULMINATING_PROJECT[unitInteger];
        if (culminatingHref) {
          projects = [
            {
              text: "Unit Project",
              href: culminatingHref,
              isPlaceholder: true,
            },
          ];
        } else {
          projects = [];
        }
      }

      var dataSearchLower = dataSearch.toLowerCase();
      if (bonus) {
        dataSearchLower += " " + bonus.text.toLowerCase();
      }
      if (familyHw) {
        dataSearchLower += " " + familyHw.text.toLowerCase();
      }
      projects.forEach(function (proj) {
        dataSearchLower += " " + proj.text.toLowerCase();
      });
      if (printables) {
        printables.forEach(function (p) {
          dataSearchLower += " " + p.text.toLowerCase();
        });
      }

      lessonsData.push({
        id: uIdx + "-" + lIdx,
        lessonId: lessonId,
        title: head,
        titleHTML: headHTML,
        objective: obj,
        activities: activities,
        projects: projects,
        dataSearch: dataSearchLower,
      });
    });

    // Order lessons by lesson number, with Group 1 and Group 2 directly
    // below their base lesson. Flagship variants follow the guided groups.
    lessonsData.sort(function (a, b) {
      return lessonRank(a.lessonId) - lessonRank(b.lessonId);
    });

    // Append an "End-of-Unit" entry at the bottom of the lesson
    // dropdown. Selecting it surfaces the unit's culminating resources
    // (graphic novels, project, pre/post-tests) through the same phase
    // dropdowns + Launch flow used by lessons.
    if (endOfUnitRes.length) {
      lessonsData.push({
        id: uIdx + "-eou",
        lessonId: "",
        title: "End-of-Unit",
        titleHTML: "End-of-Unit",
        objective:
          "Culminating resources for " +
          unitNum +
          ": graphic novels, the unit project, and pre/post assessments.",
        activities: endOfUnitRes,
        projects: [],
        dataSearch:
          "end of unit " +
          unitNum.toLowerCase() +
          " " +
          endOfUnitRes
            .map(function (r) {
              return r.text.toLowerCase();
            })
            .join(" "),
        isEndOfUnit: true,
        unitInteger: unitInteger,
      });
    }

    unitsData.push({
      num: unitNum,
      name: unitName,
      blurb: unitBlurb,
      cluster: unitCluster,
      unitIndex: unitInteger,
      resources: unitRes,
      lessons: lessonsData,
    });
  });

  // Expose the canonical scrape so additive cards (Pacing & Scope Map,
  // Close the Loop) can read units/lessons/standards without re-scraping
  // the static details.unit DOM, which this render consumes.
  window.NTHubUnits = unitsData;

  function syncHubUrl(unit, lessonId, actHref) {
    var params = new URLSearchParams(location.search);
    if (unit && unit.unitIndex) {
      params.set("u", String(unit.unitIndex));
    } else {
      params.delete("u");
    }
    if (lessonId) {
      params.set("l", lessonId);
    } else {
      params.delete("l");
    }
    if (actHref) {
      params.set("a", actHref);
    } else {
      params.delete("a");
    }
    var qs = params.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function applyDeepLink() {
    var params = new URLSearchParams(location.search);
    var uNum = parseInt(params.get("u") || "", 10);
    var lessonId = params.get("l");
    var actHref = params.get("a");
    if (!uNum && !lessonId) return;

    var uIdx = -1;
    unitsData.forEach(function (u, i) {
      if (u.unitIndex === uNum) uIdx = i;
    });
    if (uIdx < 0) return;

    var cards = hub.querySelectorAll(".unit-card");
    var card = cards[uIdx];
    if (!card) return;

    var lessonSelect = card.querySelector(".lesson-select");
    if (lessonSelect && lessonId) {
      var targetIdx = 0;
      unitsData[uIdx].lessons.forEach(function (l, i) {
        if (l.lessonId === lessonId) targetIdx = i;
      });
      lessonSelect.value = String(targetIdx);
      lessonSelect.dispatchEvent(new Event("change"));
    }

    if (actHref) {
      requestAnimationFrame(function () {
        var actSelects = card.querySelectorAll(".activity-select");
        var matched = false;
        Array.prototype.forEach.call(actSelects, function (actSelect) {
          if (matched) return;
          for (var i = 0; i < actSelect.options.length; i++) {
            if (actSelect.options[i].value === actHref) {
              actSelect.selectedIndex = i;
              actSelect.dispatchEvent(new Event("change"));
              matched = true;
              break;
            }
          }
        });
      });
    }

    // Land at the top of the page (the hero) rather than jumping the
    // deep-linked card into view. Briefly highlight the linked unit so
    // it's still easy to find as you scroll down.
    card.classList.add("is-linked");
    window.scrollTo({ top: 0 });
  }

  // 2. Create Mount Point
  var hub = document.getElementById("interactive-hub");
  if (!hub) {
    hub = document.createElement("div");
    hub.id = "interactive-hub";
    var firstUnit = document.querySelector("details.unit");
    if (firstUnit) {
      firstUnit.parentNode.insertBefore(hub, firstUnit);
    }
  }

  // 3. Render Normal Dashboard View (Dropdown Selector Form)
  function renderHub() {
    hub.innerHTML = "";
    noResults.classList.remove("show");

    var grid = document.createElement("div");
    grid.className = "units-grid";

    unitsData.forEach(function (u, uIdx) {
      var card = document.createElement("div");
      card.className = "unit-card";

      // Header
      var header = document.createElement("div");
      header.className = "unit-card-header";
      header.innerHTML =
        '<div class="unit-card-title">' +
        '<span class="unit-card-num">' +
        u.num +
        "</span>" +
        '<span class="unit-card-name">' +
        u.name +
        "</span>" +
        "</div>" +
        '<div class="unit-card-meta">' +
        '<span class="unit-card-blurb">' +
        u.blurb +
        "</span>" +
        (u.cluster
          ? '<span class="badge badge-cluster" style="margin-top:4px;">' +
            u.cluster +
            "</span>"
          : "") +
        "</div>";
      card.appendChild(header);

      // Unit-wide Resources + the unit-level Canvas (SCORM) package.
      // The unit package wraps the unit-cumulative review game — the
      // one graded page that spans the whole unit.
      var resRow = document.createElement("div");
      resRow.className = "unit-resources-row";
      u.resources.forEach(function (r) {
        var a = document.createElement("a");
        a.className = "unit-resource-btn";
        a.href = r.href;
        a.textContent = r.text;
        resRow.appendChild(a);
      });
      if (u.unitIndex) {
        resRow.appendChild(
          makeScormLink(
            "/math/games/practice-arcade/?unit=" + u.unitIndex,
            u.num + " Review Game",
            "🎓 Canvas (SCORM)",
            "unit-resource-btn scorm-dl",
          ),
        );
        // Unit project packet. This used to point at a static
        // /scorm-packages/neft-lesson-math-unit-N-projects.zip that was
        // never generated — all 10 buttons 404'd. Build it on demand from
        // the live unit projects page, the same path the review-game chip
        // above uses, so there is nothing to keep in sync.
        var zipBtn = makeScormLink(
          "/math/unit-" + u.unitIndex + "/projects/",
          u.num + " Project",
          "📦 Unit Packet (ZIP)",
          "unit-resource-btn scorm-dl",
        );
        zipBtn.style.background = "#256b5b";
        zipBtn.style.color = "#ffffff";
        zipBtn.style.fontWeight = "700";
        resRow.appendChild(zipBtn);
      }
      if (resRow.children.length > 0) {
        card.appendChild(resRow);
      }

      // Lesson Selector — picks which lesson in the unit.
      var selectorGroup = document.createElement("div");
      selectorGroup.className = "selector-group selector-group--lesson";

      var lessonField = document.createElement("div");
      lessonField.className = "selector-field";
      lessonField.innerHTML = '<span class="selector-label">Lesson</span>';

      var lessonWrapper = document.createElement("div");
      lessonWrapper.className = "select-wrapper";

      var lessonSelect = document.createElement("select");
      lessonSelect.className = "select-control lesson-select";
      lessonSelect.setAttribute("aria-label", "Choose a lesson");

      u.lessons.forEach(function (l, lIdx) {
        var opt = document.createElement("option");
        opt.value = lIdx;
        opt.textContent = l.title;
        lessonSelect.appendChild(opt);
      });
      lessonWrapper.appendChild(lessonSelect);
      lessonField.appendChild(lessonWrapper);
      selectorGroup.appendChild(lessonField);
      card.appendChild(selectorGroup);

      // Phase Selectors — three horizontally-aligned dropdowns
      // (Pre-Lesson / Lesson / Post-Lesson). Each holds the resources
      // for that phase of the selected lesson.
      var PHASE_LABELS = ["Pre-Lesson", "Lesson", "Post-Lesson", "Games"];
      var phaseGroup = document.createElement("div");
      phaseGroup.className = "phase-selectors";
      var phaseSelects = [];
      PHASE_LABELS.forEach(function (label, pIdx) {
        var field = document.createElement("div");
        field.className = "selector-field";
        var lab = document.createElement("span");
        lab.className = "selector-label";
        lab.textContent = label;
        field.appendChild(lab);

        var wrap = document.createElement("div");
        wrap.className = "select-wrapper";
        var sel = document.createElement("select");
        sel.className = "select-control activity-select phase-select";
        sel.setAttribute("data-phase", String(pIdx));
        sel.setAttribute("aria-label", label + " activities");
        wrap.appendChild(sel);
        field.appendChild(wrap);
        phaseGroup.appendChild(field);
        phaseSelects.push(sel);
      });
      card.appendChild(phaseGroup);

      // Dynamic details block
      var infoBlock = document.createElement("div");
      infoBlock.className = "lesson-info";

      var objText = document.createElement("p");
      objText.className = "lesson-info-obj";
      infoBlock.appendChild(objText);

      var outline = document.createElement("div");
      outline.className = "lesson-outline";
      outline.innerHTML =
        '<span class="lesson-outline-title">Activities List (Outline Form)</span>';
      var outlineList = document.createElement("ul");
      outlineList.className = "lesson-outline-list";
      outline.appendChild(outlineList);
      infoBlock.appendChild(outline);

      var launchBtn = document.createElement("a");
      launchBtn.className = "btn-launch";
      launchBtn.setAttribute("href", "/curriculum/");
      launchBtn.textContent = "Launch Activity";
      launchBtn.target = "_blank";
      infoBlock.appendChild(launchBtn);

      // One-click Canvas package for the selected lesson (End-of-Unit
      // rows package the unit-cumulative review game instead).
      var scormLessonBtn = document.createElement("a");
      scormLessonBtn.className = "scorm-lesson-btn";
      infoBlock.appendChild(scormLessonBtn);

      card.appendChild(infoBlock);

      // Update details depending on the selected lesson
      function updateCardState(fromUser) {
        var selectedLessonIdx = parseInt(lessonSelect.value) || 0;
        var lesson = u.lessons[selectedLessonIdx];
        if (!lesson) {
          infoBlock.style.display = "none";
          return;
        }
        infoBlock.style.display = "flex";

        // Update Objective
        objText.textContent = lesson.objective || "No objective specified.";
        objText.style.display = lesson.objective ? "" : "none";

        // Combine activities and projects
        var allActs = lesson.activities.concat(lesson.projects || []);

        // Universal review-game link. Added once, centrally, so it shows
        // in BOTH the visible outline list and the phase dropdowns.
        // End-of-Unit → unit-cumulative review (?unit=N, "Unit Review
        // Game"); a regular lesson → that lesson's arcade (?lesson=ID).
        // "Arcade" is the per-lesson name, so end-of-unit avoids it.
        var hasArcade = allActs.some(function (it) {
          return (it.href || "").indexOf("practice-arcade") > -1;
        });
        if (!hasArcade) {
          if (lesson.isEndOfUnit && lesson.unitInteger) {
            allActs.push({
              text: "🎮 Unit Review Game",
              href: "/math/games/practice-arcade/?unit=" + lesson.unitInteger,
            });
          } else if (lesson.lessonId) {
            allActs.push({
              text: "⚙️ Practice Arcade Game",
              href: "/math/games/practice-arcade/?lesson=" + lesson.lessonId,
            });
          }
        }

        // Interactive Tools: every real lesson gets a standalone,
        // ungraded manipulatives page (?mode=tools). Added centrally so it
        // shows in the Lesson-phase dropdown AND the outline for all
        // lessons the hub renders (base, flagship, small-group, catch-up).
        // Catch-up reviews carry no lessonId, so fall back to their own
        // /lessons/<id>/ launch link (avoids widening lessonId, which would
        // also add arcade/SCORM entries those pages don't have).
        var toolsId = lesson.lessonId;
        if (!toolsId) {
          var launchHref = (lesson.activities || [])
            .map(function (a) {
              return a.href || "";
            })
            .find(function (h) {
              return /^\/lessons\/[\w-]+\/$/.test(h);
            });
          var toolsMatch = launchHref && launchHref.match(/^\/lessons\/([^/]+)\/$/);
          if (toolsMatch) toolsId = toolsMatch[1];
        }
        if (toolsId) {
          allActs.push({
            text: "🧰 Interactive Tools",
            href: "/lessons/" + toolsId + "/?mode=tools",
            phaseIndex: 1,
          });
        }

        // Sort each activity into a phase bucket:
        // 0 = Pre-Lesson, 1 = Lesson, 2 = Post-Lesson.
        var phaseBuckets = [[], [], [], []];
        allActs.forEach(function (act) {
          var isProject = (lesson.projects || []).indexOf(act) > -1;
          phaseBuckets[lessonPhaseIndex(act, isProject)].push(act);
        });

        // Populate the three phase dropdowns. Each starts on a blank
        // placeholder so choosing ANY activity fires a change event and
        // opens it. Empty phases are disabled with a "— None —" label.
        phaseSelects.forEach(function (sel, pIdx) {
          var items = phaseBuckets[pIdx];

          sel.innerHTML = "";
          var placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = items.length ? "— Choose —" : "— None —";
          placeholder.selected = true;
          sel.appendChild(placeholder);
          sel.disabled = items.length === 0;
          items.forEach(function (act) {
            var opt = document.createElement("option");
            opt.value = act.href;
            opt.textContent = act.text;
            sel.appendChild(opt);
          });
        });

        // Update Outline list — grouped into labeled sections
        // (appearance/organization only; same items, no data changed).
        outlineList.innerHTML = "";
        buildGroupedOutline(outlineList, allActs, lesson.projects, lesson.title);

        // Lesson-level Canvas (SCORM) package: the lesson page itself,
        // or the unit review game for the End-of-Unit pseudo-lesson.
        var scormTarget = "";
        var scormTitle = "";
        if (lesson.lessonId) {
          scormTarget = lesson.lessonId;
          scormTitle = lesson.title;
        } else if (lesson.isEndOfUnit && lesson.unitInteger) {
          scormTarget = "/math/games/practice-arcade/?unit=" + lesson.unitInteger;
          scormTitle = u.num + " Review Game";
        }
        if (scormTarget) {
          scormLessonBtn.href = scormDownloadHref(scormTarget, scormTitle);
          scormLessonBtn.textContent = "🎓 Download for Canvas (SCORM)";
          scormLessonBtn.title =
            "Download “" + scormTitle + "” as a Canvas-ready SCORM package";
          scormLessonBtn.setAttribute("aria-label", scormLessonBtn.title);
          scormLessonBtn.style.display = "";
        } else {
          scormLessonBtn.style.display = "none";
        }

        // Launch from whichever phase dropdown changed. Selecting an
        // activity in one phase resets the other two to their
        // placeholders so the active choice is unambiguous.
        function launchFromSelect(sel) {
          var href = sel.value;
          if (!href) {
            launchBtn.style.display = "none";
            syncHubUrl(u, lesson.lessonId, "");
            return;
          }
          var selectedActText = sel.options[sel.selectedIndex].textContent;
          launchBtn.href = href;
          launchBtn.style.display = "";

          var cleanText = selectedActText;
          if (cleanText.indexOf("Lesson ") === 0 && cleanText.indexOf(":") > -1) {
            cleanText = cleanText.substring(cleanText.indexOf(":") + 1).trim();
          }
          if (cleanText.length > 28) {
            cleanText = cleanText.substring(0, 25) + "...";
          }

          launchBtn.textContent = "Launch: " + cleanText + " →";
          syncHubUrl(u, lesson.lessonId, href);
          var isMobile = window.matchMedia("(max-width: 640px)").matches;
          if (!isMobile) {
            showLaunchModal(selectedActText, href);
          }
        }

        phaseSelects.forEach(function (sel) {
          sel.onchange = function () {
            phaseSelects.forEach(function (other) {
              if (other !== sel) other.selectedIndex = 0;
            });
            launchFromSelect(sel);
          };
        });

        launchBtn.style.display = "none";
        if (fromUser) syncHubUrl(u, lesson.lessonId, "");
      }

      lessonSelect.onchange = function () {
        updateCardState(true);
      };
      updateCardState(false);

      grid.appendChild(card);
    });

    hub.appendChild(grid);
  }

  // 4. Render Search Results View (Lists items directly)
  function renderSearchResults(q) {
    hub.innerHTML = "";

    var panel = document.createElement("div");
    panel.className = "search-results-panel";

    var title = document.createElement("h2");
    title.style.fontSize = "18px";
    title.style.color = "var(--navy)";
    title.style.fontFamily = "Outfit, sans-serif";
    title.style.marginBottom = "12px";
    title.textContent = 'Search Results for "' + q + '"';
    panel.appendChild(title);

    var anyVisible = false;

    unitsData.forEach(function (u) {
      u.lessons.forEach(function (l) {
        if (l.dataSearch.indexOf(q) > -1) {
          anyVisible = true;
          var item = document.createElement("div");
          item.className = "search-result-item";

          var unitLabel = document.createElement("span");
          unitLabel.className = "search-result-unit";
          unitLabel.textContent = u.num + " · " + u.name;
          item.appendChild(unitLabel);

          var header = document.createElement("div");
          header.className = "search-result-header";
          header.textContent = l.title;
          item.appendChild(header);

          if (l.objective) {
            var obj = document.createElement("p");
            obj.className = "lesson-info-obj";
            obj.style.marginBottom = "12px";
            obj.textContent = l.objective;
            item.appendChild(obj);
          }

          var outlineList = document.createElement("ul");
          outlineList.className = "lesson-outline-list";

          var allActs = l.activities.concat(l.projects || []);
          buildGroupedOutline(outlineList, allActs, l.projects);
          item.appendChild(outlineList);

          panel.appendChild(item);
        }
      });
    });

    noResults.classList.toggle("show", !anyVisible);
    if (!anyVisible) {
      var noRes = document.createElement("p");
      noRes.style.color = "var(--muted)";
      noRes.style.fontSize = "15px";
      noRes.style.textAlign = "center";
      noRes.style.padding = "24px";
      noRes.textContent = "No matching lessons found.";
      panel.appendChild(noRes);
    } else {
      hub.appendChild(panel);
    }
  }

  // 5. Wire Search input
  function handleSearch() {
    var q = (box.value || "").trim().toLowerCase();
    if (q) {
      renderSearchResults(q);
    } else {
      renderHub();
    }
  }

  // Search input wired by /assets/curriculum-enhancements.js

  window.CurriculumHub = {
    unitsData: unitsData,
    renderHub: renderHub,
    renderSearchResults: renderSearchResults,
    searchBox: box,
    hubEl: hub,
    noResultsEl: noResults,
  };

  // 6. Launch Modal Logic
  var modal = document.getElementById("launch-modal");
  var modalTitle = document.getElementById("modal-title-text");
  var modalLaunchLink = document.getElementById("modal-launch-link");
  var modalCloseBtn = document.getElementById("modal-close-btn");

  var modalKeyHandler = null;

  function showLaunchModal(title, href) {
    if (!modal || !modalTitle || !modalLaunchLink) return;
    modalTitle.textContent = title;
    modalLaunchLink.href = href;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    modal.offsetHeight;
    modal.classList.add("show");
    modalLaunchLink.focus();
    if (modalKeyHandler) {
      document.removeEventListener("keydown", modalKeyHandler);
    }
    modalKeyHandler = function (e) {
      if (e.key === "Escape") hideLaunchModal();
    };
    document.addEventListener("keydown", modalKeyHandler);
  }

  function hideLaunchModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    if (modalKeyHandler) {
      document.removeEventListener("keydown", modalKeyHandler);
      modalKeyHandler = null;
    }
    setTimeout(function () {
      if (!modal.classList.contains("show")) {
        modal.style.display = "none";
      }
    }, 300);
  }

  if (modalCloseBtn) {
    modalCloseBtn.onclick = hideLaunchModal;
  }
  if (modal) {
    modal.onclick = function (e) {
      if (e.target === modal) {
        hideLaunchModal();
      }
    };
  }
  if (modalLaunchLink) {
    modalLaunchLink.onclick = function () {
      setTimeout(hideLaunchModal, 200);
    };
  }

  // Always open at the top of the page, even when a deep link (?u=&l=)
  // is present and even if the browser would restore a prior scroll.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // Initial Hub Render
  renderHub();
  applyDeepLink();
  window.scrollTo(0, 0);
})();
