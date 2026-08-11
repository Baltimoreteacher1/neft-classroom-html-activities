// What each goal-card picture actually contains, in words.
//
// This is the single source of truth shared by three places:
//   · engine/core/objective-visuals.js — routes a lesson to a picture and
//     writes the caption underneath it,
//   · scripts/gen-objective-art.mjs — DRAWS the SVGs and stamps `alt` into each
//     file's <title>, so a file can never describe itself differently,
//   · tools/objective-visuals.test.mjs — proves every caption is true of the
//     picture it sits under.
//
// `shows` is the honest inventory: every manipulative from MANIPULATIVES that is
// really in the frame. Everything else is BANNED for that image, computed rather
// than hand-listed — a hand-maintained ban list is exactly what rotted last time.

/**
 * The vocabulary of mathematical models a caption could name. If a phrase is on
 * this list, a caption may only use it for an image whose `shows` declares it.
 * Plain nouns (square, arrow, table, graph, bar) are deliberately absent — the
 * defect being pinned is "names a MODEL that is not in the picture".
 */
export const MANIPULATIVES = [
  "net",
  "prism",
  "pyramid",
  "cutting mat",
  "grid mat",
  "ruler",
  "factor tree",
  "long division",
  "place-value chart",
  "hundredths grid",
  "fraction bar",
  "fraction strip",
  "bar model",
  "tape diagram",
  "double number line",
  "number line",
  "ratio table",
  "percent bar",
  "box plot",
  "histogram",
  "dot plot",
  "frequency table",
  "bar graph",
  "circle graph",
  "stem-and-leaf plot",
  "coordinate plane",
  "coordinate grid",
  "quadrant",
  "ordered pair",
  "pan balance",
  "balance scale",
  "algebra tiles",
  "area model",
  "tile array",
  "parallelogram",
  "trapezoid",
  "protractor",
  "spinner",
];

/**
 * Everything on MANIPULATIVES that is NOT in this picture.
 *
 * A phrase is dropped from the ban only when a phrase the image really shows
 * CONTAINS it — "double number line" contains "number line", so an image with a
 * double number line cannot be failed for the word-boundary match inside its own
 * name. The reverse (a shown "number line" excusing "double number line") is not
 * granted: that ban still fires, which is the behaviour we want.
 *
 * @param {string[]} shows
 * @returns {string[]}
 */
export function bannedFor(shows) {
  const owned = shows || [];
  return MANIPULATIVES.filter((m) => !owned.some((s) => s.includes(m)));
}

// `src` paths are served paths. The two `.jpg` entries are the photographs that
// were already in the system and are kept only where they are literally true.
const RAW = {
  // ── Photographs ───────────────────────────────────────────────────────────
  net: {
    src: "/assets/content_with_poster.jpg",
    shows: ["net", "prism", "grid mat", "cutting mat", "ruler"],
    alt:
      "Cartoon of a middle-school student at a classroom desk holding up a partly folded paper net " +
      "of a triangular prism. Its faces are coloured and numbered 1, 2, 3 and 4, and one yellow " +
      "face is labelled Base. A ruler, a pencil and an eraser lie on a green grid cutting mat, an " +
      "open notebook beside her shows more net diagrams, and the whiteboard behind her reads " +
      "Volume = l x w x h and Nets.",
    scene:
      "A student folds a paper net of a triangular prism on her grid mat, with every face numbered " +
      "and the base labelled, so she can see each flat face before she builds the solid.",
  },
  balance: {
    src: "/assets/algebra_content.jpg",
    shows: ["pan balance", "balance scale"],
    alt:
      "Cartoon of a middle-school student at a classroom desk using a two-pan balance scale whose " +
      "base is labelled x plus 3 equals 7. The left pan holds a green block marked x and three " +
      "blue unit cubes; the right pan holds seven blue unit cubes, and she is lifting one cube " +
      "off a pan. Her notebook is open to the same equation.",
    scene:
      "A student moves unit cubes on a pan balance labelled x + 3 = 7, keeping the two pans level " +
      "so the equation stays true while she works out what x is worth.",
  },
  partners: {
    src: "/assets/lang_with_poster.jpg",
    shows: ["net", "prism"],
    alt:
      "Cartoon of two middle-school students seated across a desk from each other, both pointing " +
      "at the same unfolded coloured paper net lying between them. Callout labels on the net read " +
      "Triangular Base, Vertex and Rectangular Face, and a speech bubble above them says they can " +
      "use the 2D net to describe the parts of a 3D prism with precise math language.",
    scene:
      "Two partners point at the same labelled net and name its parts out loud — triangular base, " +
      "vertex, rectangular face — instead of saying “this part here”.",
  },

  // ── Mathematical practice ────────────────────────────────────────────────
  // The book's "Math Is..." units carry MPP standards rather than a Grade 6
  // content cluster, so they have no content diagram to inherit. This pair
  // pictures the practice itself.
  mathPracticeContent: {
    shows: ["pattern"],
    alt:
      "Three boxes in a row hold a growing dot pattern — one dot, then three, then seven — with " +
      "arrows between them. A heading reads Step 1, notice how the pattern grows. Two labels " +
      "underneath read Step 2, test the rule: double it, then add 1, and Step 3, explain why: " +
      "7 x 2 + 1 = 15 comes next.",
    scene:
      "A dot pattern grows 1, 3, 7 across three boxes, and the labels underneath name the rule " +
      "and check it: double the dots and add 1, so 15 comes next.",
  },
  mathPracticeTalk: {
    shows: ["pattern"],
    alt:
      "The same growing dot pattern of 1, 3 and 7 dots, with two partners drawn beneath it. " +
      "Their speech bubbles read that each box doubles the dots before and adds one more, and " +
      "that this is why the next box would hold 15 dots.",
    scene:
      "Two partners read the same growing pattern out loud and say the rule to each other — " +
      "double the dots, add one — then agree that 15 comes next.",
  },

  // ── Number system ─────────────────────────────────────────────────────────
  factorsContent: {
    shows: ["factor tree"],
    alt:
      "Two factor trees side by side. The first splits 24 into 4 and 6 and then into the prime " +
      "factors 2, 2, 2 and 3; the second splits 36 into 4 and 9 and then into 2, 2, 3 and 3. " +
      "Labels underneath read 24 = 2 × 2 × 2 × 3, 36 = 2 × 2 × 3 × 3, GCF = 2 × 2 × 3 = 12 and " +
      "LCM = 2 × 2 × 2 × 3 × 3 = 72.",
    scene:
      "Two factor trees break 24 and 36 all the way down to their prime factors, and the labels " +
      "underneath read GCF = 12 and LCM = 72.",
  },
  factorsTalk: {
    shows: ["factor tree"],
    alt:
      "The same two factor trees for 24 and 36, with two partners drawn beneath them. Their speech " +
      "bubbles read that 24 breaks into the prime factors 2, 2, 2 and 3, and that both trees share " +
      "2, 2 and 3 so the greatest common factor of 24 and 36 is 12.",
    scene:
      "Two partners read the same pair of factor trees and say the parts out loud — prime factor, " +
      "product, greatest common factor, least common multiple.",
  },
  divisionContent: {
    shows: ["long division"],
    alt:
      "A long division frame dividing 4,896 by 12. The quotient 408 sits above the bar, the partial " +
      "products 48, 0 and 96 are subtracted in turn, and the last difference is 0. A colour key " +
      "names the quotient 408, the dividend 4,896, the divisor 12, the partial products and the " +
      "remainder 0, and a label reads 12 × 408 = 4,896.",
    scene:
      "A long division frame divides 4,896 by 12 one place at a time: the quotient 408 sits above " +
      "the bar, each partial product comes off underneath, and the remainder is 0.",
  },
  divisionTalk: {
    shows: ["long division"],
    alt:
      "The same long division of 4,896 by 12, with two partners drawn beneath it. Their speech " +
      "bubbles name the divisor 12 and the dividend 4,896, and say the quotient is 408 with a " +
      "remainder of 0 because 12 × 408 = 4,896.",
    scene:
      "Two partners read the same long division and name its parts out loud — divisor, dividend, " +
      "partial product, quotient, remainder.",
  },
  decimalSumContent: {
    shows: ["place-value chart"],
    alt:
      "A place-value chart with columns headed Tens, Ones, a decimal point, Tenths and Hundredths. " +
      "12.80 sits above 3.45 with a dashed line running down the decimal-point column, the " +
      "placeholder 0 in the hundredths place is highlighted, and the sum row reads 16.25.",
    scene:
      "A place-value chart stacks 12.80 above 3.45 with the decimal points in one column, and the " +
      "row underneath reads 16.25.",
  },
  decimalSumTalk: {
    shows: ["place-value chart"],
    alt:
      "The same place-value chart adding 12.80 and 3.45 to make 16.25, with two partners drawn " +
      "beneath it. Their speech bubbles name the tenths and hundredths places and explain that the " +
      "0 written after 12.8 is a placeholder that keeps every digit in its own column.",
    scene:
      "Two partners read the same place-value chart and name the columns out loud — tens, ones, " +
      "tenths, hundredths, and the placeholder that holds a column open.",
  },
  decimalProductContent: {
    shows: ["hundredths grid"],
    alt:
      "A hundredths grid ten squares by ten. Four columns are shaded for 0.4 and seven rows are " +
      "shaded for 0.7, so the 28 squares where they cross are shaded twice. Beside it the same " +
      "product is written down as 0.4 × 0.7 = 0.28, with a note that one decimal place plus one " +
      "decimal place makes two decimal places.",
    scene:
      "On a hundredths grid, four shaded columns for 0.4 cross seven shaded rows for 0.7, and the " +
      "28 squares in the overlap are the product 0.28.",
  },
  decimalProductTalk: {
    shows: ["hundredths grid"],
    alt:
      "The same hundredths grid showing 0.4 × 0.7 = 0.28, with two partners drawn beneath it. Their " +
      "speech bubbles explain that four tenths of seven tenths is twenty-eight hundredths and that " +
      "the two decimal places in the answer come from one place in each factor.",
    scene:
      "Two partners read the same hundredths grid and say the product out loud — factor, tenths, " +
      "hundredths, decimal place.",
  },
  decimalQuotientContent: {
    shows: ["long division"],
    alt:
      "Two long division frames side by side. The first is 7.2 divided by 0.9; arrows marked times " +
      "10 under each number lead to the second frame, 72 divided by 9, whose quotient is 8. A label " +
      "reads 7.2 ÷ 0.9 = 72 ÷ 9 = 8.",
    scene:
      "Two long division frames sit side by side: multiplying 7.2 and 0.9 by ten turns the problem " +
      "into 72 ÷ 9, and the quotient 8 is the same either way.",
  },
  decimalQuotientTalk: {
    shows: ["long division"],
    alt:
      "The same pair of long division frames turning 7.2 ÷ 0.9 into 72 ÷ 9 = 8, with two partners " +
      "drawn beneath. Their speech bubbles say that multiplying the divisor and the dividend by ten " +
      "makes the divisor a whole number without changing the quotient.",
    scene:
      "Two partners read the same pair of long division frames and name the move out loud — divisor, " +
      "dividend, quotient, and multiplying both by ten.",
  },
  fractionDivisionContent: {
    shows: ["bar model"],
    alt:
      "A bar model. A bar marked 3 wholes and cut into three equal parts sits above a second bar of " +
      "exactly the same length cut into six equal halves, each labelled one half and numbered 1 to " +
      "6. Labels read 6 halves fit inside 3 wholes and 3 ÷ ½ = 3 × 2 = 6.",
    scene:
      "A bar model puts three wholes above the same length cut into six equal halves, so you can " +
      "count that six halves fit inside three wholes.",
  },
  fractionDivisionTalk: {
    shows: ["bar model"],
    alt:
      "The same bar model of three wholes cut into six halves, with two partners drawn beneath it. " +
      "Their speech bubbles ask how many halves fit inside 3 and answer that dividing by one half " +
      "gives the same result as multiplying by its reciprocal, 2.",
    scene:
      "Two partners read the same bar model and say the question out loud — how many halves fit " +
      "inside three wholes, and what the reciprocal has to do with it.",
  },

  // ── Ratios, rates and percents ────────────────────────────────────────────
  ratiosContent: {
    shows: [],
    alt:
      "Three teal squares, a colon, then two coral squares, labelled 3 : 2. Underneath, six teal " +
      "squares and four coral squares are labelled 6 : 4, with a curved arrow marked times 2 " +
      "joining the two rows and a note that the same ratio reads as 3 to 2, 3 : 2 or 3/2.",
    scene:
      "Three squares beside two squares show the ratio 3 : 2, and doubling both groups gives the " +
      "equal ratio 6 : 4.",
  },
  ratiosTalk: {
    shows: [],
    alt:
      "The same two rows of squares showing 3 : 2 and 6 : 4, with two partners drawn beneath them. " +
      "Their speech bubbles read the ratio three ways and explain that multiplying both parts by " +
      "the same number keeps the comparison equal.",
    scene:
      "Two partners read the same groups of squares and say the comparison out loud — 3 to 2, and " +
      "why 6 : 4 is the equal ratio.",
  },
  ratioTablesContent: {
    shows: ["ratio table"],
    alt:
      "A ratio table of juice to water reading 1 and 3, 2 and 6, 3 and 9, 4 and 12, marked times 3. " +
      "Beside it a graph plots those same pairs — (1, 3), (2, 6), (3, 9) and (4, 12) — and they all " +
      "sit on one straight line through the origin.",
    scene:
      "A ratio table runs 1 to 3, 2 to 6, 3 to 9 and 4 to 12, and the graph beside it puts those " +
      "same pairs on one straight line through the origin.",
  },
  ratioTablesTalk: {
    shows: ["ratio table"],
    alt:
      "The same ratio table of juice to water and its graph, with two partners drawn beneath. Their " +
      "speech bubbles say every row multiplies the first quantity by 3, and that the plotted pairs " +
      "make a straight line because every row is the same comparison.",
    scene:
      "Two partners read the same ratio table and its graph and say the pattern out loud — every " +
      "row is one to three, and the plotted pairs land on one straight line.",
  },
  ratesContent: {
    shows: ["double number line"],
    alt:
      "A double number line. The top line shows cost at $0, $3, $6, $9 and $12; the bottom line " +
      "shows weight at 0, 1, 2, 3 and 4 pounds, with dashed lines joining each pair. The first step " +
      "is highlighted and labelled $3 per 1 pound, and a label reads 12 ÷ 4 = 3, so the unit rate " +
      "is $3 per pound.",
    scene:
      "A double number line lines $0, $3, $6, $9 and $12 up with 0, 1, 2, 3 and 4 pounds, and the " +
      "first step across is the unit rate, $3 per pound.",
  },
  ratesTalk: {
    shows: ["double number line"],
    alt:
      "The same double number line matching dollars to pounds, with two partners drawn beneath it. " +
      "Their speech bubbles say $12 for 4 pounds is a rate, and that dividing by 4 gives the unit " +
      "rate of $3 for 1 pound.",
    scene:
      "Two partners read the same double number line and say the comparison out loud — the rate, " +
      "the unit rate, and what per one pound means.",
  },
  measurementContent: {
    shows: ["ratio table"],
    alt:
      "A ratio table converting feet to inches — 1 and 12, 2 and 24, 3 and 36, 4 and 48 — marked " +
      "times 12. Beside it the conversion factor 12 inches over 1 foot multiplies 5 feet to give " +
      "60 inches, and a label reads 12 inches = 1 foot.",
    scene:
      "A ratio table converts feet to inches — 1 to 12, 2 to 24, 3 to 36, 4 to 48 — and beside it " +
      "the conversion factor 12 inches per 1 foot turns 5 feet into 60 inches.",
  },
  measurementTalk: {
    shows: ["ratio table"],
    alt:
      "The same feet-to-inches ratio table and conversion factor, with two partners drawn beneath. " +
      "Their speech bubbles say 12 inches and 1 foot are the same length, so multiplying by 12 " +
      "inches over 1 foot changes the unit without changing the amount.",
    scene:
      "Two partners read the same conversion table and say the move out loud — the unit, the " +
      "conversion factor, and why the amount does not change.",
  },
  percentsContent: {
    shows: ["hundredths grid", "percent bar"],
    alt:
      "A hundredths grid with 25 of its 100 squares shaded, labelled 25% = 0.25 = 1/4. Beside it a " +
      "percent bar runs 0%, 25%, 50%, 75% and 100% along the top and 0, 10, 20, 30 and 40 pages " +
      "along the bottom, with the first quarter shaded and a label reading 25% of 40 pages = 10 " +
      "pages.",
    scene:
      "A hundredths grid with 25 squares shaded sits beside a percent bar that lines 25% up with 10 " +
      "of 40 pages.",
  },
  percentsTalk: {
    shows: ["hundredths grid", "percent bar"],
    alt:
      "The same hundredths grid and percent bar showing 25% of 40 pages is 10 pages, with two " +
      "partners drawn beneath. Their speech bubbles say percent means out of one hundred, and that " +
      "25%, 0.25 and one quarter are three names for the same amount.",
    scene:
      "Two partners read the same hundredths grid and percent bar and say the amount three ways — " +
      "25%, 0.25 and one quarter.",
  },

  // ── Algebraic thinking ────────────────────────────────────────────────────
  exponentsContent: {
    shows: [],
    alt:
      "The power 2 to the fourth drawn large, with an arrow labelling the 2 as the base and an " +
      "arrow labelling the raised 4 as the exponent. It equals 2 × 2 × 2 × 2, underlined as 4 " +
      "factors, which equals 16. Underneath, 10 to the third equals 10 × 10 × 10 equals 1,000.",
    scene:
      "The power 2 to the fourth is written out as 2 × 2 × 2 × 2 — four factors, underlined — and " +
      "the value 16 sits at the end of the line.",
  },
  exponentsTalk: {
    shows: [],
    alt:
      "The same power 2 to the fourth with its base and exponent labelled, and two partners drawn " +
      "beneath. Their speech bubbles say the base is the factor being repeated and the exponent " +
      "counts how many times it is used, so 2 to the fourth is 16, not 8.",
    scene:
      "Two partners read the same power and name its parts out loud — base, exponent, factor, and " +
      "the value it works out to.",
  },
  expressionsContent: {
    shows: ["area model"],
    alt:
      "An area model: a rectangle three units tall is split into a part of width x and a part of " +
      "width 5, and the two areas are labelled 3x and 15 beside the equation 3(x + 5) = 3x + 15. A " +
      "key names 3 as the coefficient, x as the variable and 15 as the constant, calls 3x and 15 " +
      "the terms, and checks that when x = 4 both forms give 27.",
    scene:
      "An area model splits a rectangle three units tall into a part of width x and a part of width " +
      "5, so 3(x + 5) and 3x + 15 cover exactly the same rectangle.",
  },
  expressionsTalk: {
    shows: ["area model"],
    alt:
      "The same area model for 3(x + 5) = 3x + 15, with two partners drawn beneath it. Their speech " +
      "bubbles name 3 as the coefficient, x as the variable and 15 as the constant, and say the two " +
      "expressions are equivalent because they cover the same rectangle.",
    scene:
      "Two partners read the same area model and name the parts out loud — coefficient, variable, " +
      "constant, term, and what equivalent means.",
  },
  equationsTalk: {
    shows: ["pan balance"],
    alt:
      "A drawn pan balance labelled x + 3 = 7. The left pan holds one teal tile marked x and three " +
      "unit cubes; the right pan holds seven unit cubes. Labels read the pans stay level, take 3 " +
      "off both pans, and x = 4. Two partners drawn beneath say in speech bubbles that whatever is " +
      "taken from one pan must come off the other.",
    scene:
      "Two partners read the same pan balance labelled x + 3 = 7 and say the move out loud — the " +
      "unknown, the equal sign, and doing the same thing to both sides.",
  },
  inequalitiesContent: {
    shows: ["number line"],
    alt:
      "Two number lines from −2 to 8. The first graphs x > 3 with an open circle at 3 and a shaded " +
      "ray running right; the second graphs x ≤ 5 with a closed circle at 5 and a shaded ray " +
      "running left. Notes read open circle — 3 is not a solution, and closed circle — 5 is a " +
      "solution.",
    scene:
      "Two number lines graph x > 3 with an open circle at 3 and x ≤ 5 with a closed circle at 5, " +
      "and each shaded ray holds every solution.",
  },
  inequalitiesTalk: {
    shows: ["number line"],
    alt:
      "The same two number lines graphing x > 3 and x ≤ 5, with two partners drawn beneath them. " +
      "Their speech bubbles explain that an open circle leaves the endpoint out while a closed " +
      "circle takes it in, and that the shaded ray shows every number that makes the statement true.",
    scene:
      "Two partners read the same two number lines and say the difference out loud — open circle, " +
      "closed circle, solution, and which way the ray points.",
  },
  planeAreaContent: {
    shows: ["parallelogram", "trapezoid"],
    alt:
      "Three figures standing on the same grid: a parallelogram with base 8 and height 5, a " +
      "triangle with base 8 and height 5, and a trapezoid with bases 6 and 10 and height 5. Each " +
      "has its height drawn as a dashed segment, and the areas work out to 40, 20 and 40 square " +
      "units.",
    scene:
      "A parallelogram, a triangle and a trapezoid stand on the same grid with their heights drawn " +
      "in, and their areas work out to 40, 20 and 40 square units.",
  },
  planeAreaTalk: {
    shows: ["parallelogram", "trapezoid"],
    alt:
      "The same parallelogram, triangle and trapezoid on one grid with their areas worked out, and " +
      "two partners drawn beneath. Their speech bubbles say the height is always perpendicular to " +
      "the base, and that the triangle is half the parallelogram on the same base and height.",
    scene:
      "Two partners read the same three figures and name the parts out loud — base, height, and " +
      "why the height has to meet the base at a right angle.",
  },
  solidsContent: {
    shows: ["net", "prism"],
    alt:
      "A 3D isometric rectangular prism alongside its unfolded 2D paper net with 6 numbered faces. " +
      "Dimensions length 8 inches, width 4 inches, height 5 inches are labeled, and formulas read " +
      "Volume = 8 × 4 × 5 = 160 cubic inches and Surface Area = 2(32 + 40 + 20) = 184 square inches.",
    scene:
      "A 3D solid rectangular prism stands beside its unfolded 6-face 2D net, showing how the 2D net area equals the 3D surface area (184 sq in) and volume equals 160 cu in.",
  },
  solidsTalk: {
    shows: ["net", "prism"],
    alt:
      "The same 3D rectangular prism and unfolded 2D net with two partners drawn beneath it. Their speech " +
      "bubbles explain that the 6 flat faces of the 2D net fold into the 6 faces of the 3D prism, and surface area adds all 6 faces while volume multiplies length × width × height.",
    scene:
      "Two partners discuss the 3D rectangular prism and unfolded 2D net out loud — length, width, height, surface area, volume, and how net faces fold into solid faces.",
  },

  // ── Statistics ────────────────────────────────────────────────────────────
  statQuestionsContent: {
    shows: ["dot plot"],
    alt:
      "Two question cards. The first, How tall am I?, is marked one answer — not statistical. The " +
      "second, How tall are students in our class?, is marked many different answers — statistical. " +
      "Below them a dot plot of 14 heights from 54 to 60 inches shows the spread those answers make.",
    scene:
      "Two question cards sit above a dot plot of 14 class heights: one question has a single " +
      "answer, the other spreads answers from 54 to 60 inches.",
  },
  statQuestionsTalk: {
    shows: ["dot plot"],
    alt:
      "The same two question cards and the dot plot of 14 class heights, with two partners drawn " +
      "beneath. Their speech bubbles say a statistical question is one you expect different answers " +
      "to, and that the spread of the data is what makes it worth collecting.",
    scene:
      "Two partners read the same two questions and the dot plot beneath them and say out loud " +
      "which one is statistical, and why variability is the test.",
  },
  centreContent: {
    shows: ["dot plot", "number line"],
    alt:
      "A dot plot of the data 3, 5, 5, 6 and 11 on a number line from 0 to 12. A dashed marker " +
      "stands at the median 5, another at the mean 6, and a ring circles the repeated value 5. " +
      "Labels read mean = 30 ÷ 5 = 6, median = 5, mode = 5, and note that the outlier 11 pulls the " +
      "mean above the median.",
    scene:
      "A dot plot of 3, 5, 5, 6 and 11 carries a marker at the median 5 and another at the mean 6, " +
      "with the labels mean = 6, median = 5 and mode = 5.",
  },
  centreTalk: {
    shows: ["dot plot", "number line"],
    alt:
      "The same dot plot of 3, 5, 5, 6 and 11 with its mean, median and mode marked, and two " +
      "partners drawn beneath. Their speech bubbles say the mean shares the total equally while the " +
      "median is the middle value, and that the outlier 11 is why the two disagree.",
    scene:
      "Two partners read the same dot plot and name the measures out loud — mean, median, mode, " +
      "outlier — and argue about which one describes this data best.",
  },
  madContent: {
    shows: ["number line"],
    alt:
      "The data 3, 5, 5, 6 and 11 plotted on a number line from 0 to 12 with a dashed line at the " +
      "mean of 6. Arrows measure each value's distance from the mean — 3, 1, 1, 0 and 5 — and a " +
      "label reads MAD = (3 + 1 + 1 + 0 + 5) ÷ 5 = 2.",
    scene:
      "Arrows measure how far 3, 5, 5, 6 and 11 each sit from the mean of 6 — distances of 3, 1, 1, " +
      "0 and 5 — and the average of those distances is the MAD, 2.",
  },
  madTalk: {
    shows: ["number line"],
    alt:
      "The same plot of 3, 5, 5, 6 and 11 with arrows measuring each distance from the mean of 6, " +
      "and two partners drawn beneath. Their speech bubbles say every distance is counted as a " +
      "positive number, and that the mean absolute deviation is the average of those distances.",
    scene:
      "Two partners read the same distances from the mean and say the measure out loud — deviation, " +
      "absolute value, average distance, spread.",
  },
  boxPlotContent: {
    shows: ["box plot"],
    alt:
      "A box plot drawn over a scale from 0 to 40. The whiskers run from 10 to 30, the box spans 14 " +
      "to 26 and the median line stands at 20, labelled min 10, Q1 14, median 20, Q3 26 and max 30. " +
      "The eleven data values are marked on the scale below, and a label reads IQR = 26 − 14 = 12.",
    scene:
      "A box plot drawn over a 0-to-40 scale shows the five-number summary of eleven values: min " +
      "10, Q1 14, median 20, Q3 26 and max 30.",
  },
  boxPlotTalk: {
    shows: ["box plot"],
    alt:
      "The same box plot of eleven values with its five-number summary labelled, and two partners " +
      "drawn beneath. Their speech bubbles say the box holds the middle half of the data and the " +
      "whiskers reach the smallest and largest values.",
    scene:
      "Two partners read the same box plot and name the parts out loud — minimum, first quartile, " +
      "median, third quartile, maximum, and the middle half between them.",
  },
  histogramContent: {
    shows: ["histogram"],
    alt:
      "A histogram of reading time with five equal intervals — 0 to 9, 10 to 19, 20 to 29, 30 to 39 " +
      "and 40 to 49 minutes — and bars 3, 7, 9, 5 and 2 students tall standing side by side with no " +
      "gaps between them. A label reads 26 students, 5 equal intervals, no gaps.",
    scene:
      "A histogram sorts 26 students into five equal reading-time intervals, its bars 3, 7, 9, 5 " +
      "and 2 tall and touching with no gaps between them.",
  },
  histogramTalk: {
    shows: ["histogram"],
    alt:
      "The same histogram of reading time in five equal intervals, with two partners drawn beneath. " +
      "Their speech bubbles say each bar counts how many students fall inside one interval, and " +
      "that the bars touch because the intervals run straight on from one another.",
    scene:
      "Two partners read the same histogram and name the parts out loud — interval, frequency, and " +
      "why the bars touch instead of standing apart.",
  },
  distributionsContent: {
    shows: ["dot plot"],
    alt:
      "Three dot plots side by side, labelled Symmetric, Skewed right and Skewed left. The first " +
      "peaks in the middle, the second piles up on the left with a tail stretching right, and the " +
      "third piles up on the right with a tail stretching left.",
    scene:
      "Three dot plots sit side by side — one symmetric with a middle peak, one skewed right, one " +
      "skewed left — so the shape of each set is easy to compare.",
  },
  distributionsTalk: {
    shows: ["dot plot"],
    alt:
      "The same three dot plots labelled symmetric, skewed right and skewed left, with two partners " +
      "drawn beneath. Their speech bubbles describe where the data clusters, where the peak sits " +
      "and which way the tail stretches.",
    scene:
      "Two partners read the same three dot plots and describe each shape out loud — cluster, peak, " +
      "tail, symmetric, skewed.",
  },

  // ── The number line and the coordinate plane ──────────────────────────────
  rationalNumberLineContent: {
    shows: ["number line"],
    alt:
      "A number line from −3 to 3 marked every quarter, with −2½, −0.75, ½ and 2¼ each plotted and " +
      "labelled. Underneath, the order is written out as −2½ < −0.75 < ½ < 2¼.",
    scene:
      "A number line marked every quarter from −3 to 3 carries −2½, −0.75, ½ and 2¼, so fractions " +
      "and decimals take their places in order on the same line.",
  },
  rationalNumberLineTalk: {
    shows: ["number line"],
    alt:
      "The same number line from −3 to 3 with −2½, −0.75, ½ and 2¼ plotted, and two partners drawn " +
      "beneath. Their speech bubbles say each small mark is one quarter, and that a number further " +
      "left is always the smaller one.",
    scene:
      "Two partners read the same number line and say the order out loud — which number is further " +
      "left, and what each mark between the whole numbers is worth.",
  },
  integersContent: {
    shows: ["number line"],
    alt:
      "A number line from −6 to 6 with −4 and 4 marked. Arrows measure 4 units from 0 out to each " +
      "of them, a curved arrow joins the two as opposites, and labels read |−4| = 4 and |4| = 4, " +
      "with a note that −4 is to the left of 4 so −4 < 4.",
    scene:
      "On a number line from −6 to 6, −4 and 4 sit the same 4 units away from zero, which is why " +
      "|−4| and |4| are both 4.",
  },
  integersTalk: {
    shows: ["number line"],
    alt:
      "The same number line with −4 and 4 marked as opposites and their absolute values labelled, " +
      "and two partners drawn beneath. Their speech bubbles say absolute value is a distance so it " +
      "is never negative, and that the number further left is always the smaller one.",
    scene:
      "Two partners read the same number line and say the words out loud — integer, opposite, " +
      "absolute value, and what further left means for comparing.",
  },
  coordinatePlaneContent: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "A coordinate plane running from −5 to 5 on both axes with the four quadrants numbered I to " +
      "IV. The ordered pair (3, 2) is plotted, with dashed lines running back to each axis, and " +
      "notes read 3 right along x then 2 up along y, x first then y, and the origin is (0, 0).",
    scene:
      "A coordinate plane from −5 to 5 has the ordered pair (3, 2) plotted with dashed lines back " +
      "to each axis, showing the move 3 across and then 2 up.",
  },
  coordinatePlaneTalk: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "The same coordinate plane with (3, 2) plotted and dashed lines back to each axis, and two " +
      "partners drawn beneath. Their speech bubbles say the first number is the move along the " +
      "x-axis and the second is the move along the y-axis, both counted from the origin.",
    scene:
      "Two partners read the same coordinate plane and name the parts out loud — origin, x-axis, " +
      "y-axis, ordered pair, and which coordinate comes first.",
  },
  quadrantsContent: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "A coordinate plane with the quadrants numbered I to IV and three points plotted: A at (3, 2), " +
      "B at (−3, 2) and D at (3, −2). Dashed arrows show B as A reflected across the y-axis and D " +
      "as A reflected across the x-axis, and a note says a reflection flips one sign.",
    scene:
      "On a four-quadrant coordinate plane, A (3, 2) reflects across the y-axis to B (−3, 2) and " +
      "across the x-axis to D (3, −2), each reflection flipping exactly one sign.",
  },
  quadrantsTalk: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "The same coordinate plane with A (3, 2) reflected to B (−3, 2) and D (3, −2), and two " +
      "partners drawn beneath. Their speech bubbles name the quadrant each point lands in and say " +
      "which sign changed in the reflection.",
    scene:
      "Two partners read the same reflections and say them out loud — the quadrant each point lands " +
      "in, the axis it flipped across, and which sign changed.",
  },
  distanceContent: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "A coordinate plane with P at (−3, 2), Q at (4, 2) and R at (4, −3). The horizontal segment " +
      "from P to Q is labelled 7 units and the vertical segment from Q to R is labelled 5 units, " +
      "with the working |−3| + |4| = 3 + 4 = 7 and |2| + |−3| = 2 + 3 = 5.",
    scene:
      "Two segments on a coordinate plane are measured by counting units: P (−3, 2) to Q (4, 2) is " +
      "7 units across, and Q to R (4, −3) is 5 units down.",
  },
  distanceTalk: {
    shows: ["coordinate plane", "quadrant", "ordered pair"],
    alt:
      "The same coordinate plane measuring P to Q as 7 units and Q to R as 5 units, with two " +
      "partners drawn beneath. Their speech bubbles say that when two points sit on opposite sides " +
      "of an axis you add the absolute values, and when they sit on the same side you subtract.",
    scene:
      "Two partners read the same two segments and say the reasoning out loud — absolute value, " +
      "units apart, and when to add instead of subtract.",
  },
};

// Fill in the generated `src` paths and the computed ban lists so no entry can
// disagree with the file the generator writes.
/** @type {Record<string, {src:string, alt:string, scene:string, shows:string[], banned:string[]}>} */
export const OBJECTIVE_IMAGES = {};
for (const [key, entry] of Object.entries(RAW)) {
  const file = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  OBJECTIVE_IMAGES[key] = {
    ...entry,
    src: entry.src || `/assets/objective-art/${file}.svg`,
    banned: bannedFor(entry.shows),
  };
}
