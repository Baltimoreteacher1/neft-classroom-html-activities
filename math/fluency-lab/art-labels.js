// Accessible names for every illustration. Each label is a function so it follows the current language when it is
// called; the literal strings below are what tools/fluency-i18n.test.mjs reads, and the Spanish lives in
// i18n-es-lab4-art.js. Names describe the picture (what is drawn), not the lesson answer.
import { t } from "./i18n.js";

export const MOTIF_LABELS = {
  counting: () => t("Ten-frame with counters"),
  patterns: () => t("A repeating pattern of circles and squares"),
  operations: () => t("Four operation tiles: add, subtract, multiply, divide"),
  fluency: () => t("A fan of flash cards with a repeat arrow"),
  addition: () => t("Two groups joined into one"),
  subtraction: () => t("Counters taken away, with a hop back on a number line"),
  "place-value": () => t("Base-ten blocks and place-value columns"),
  multiplication: () => t("An array of equal rows"),
  division: () => t("A set shared equally into three groups"),
  "number-theory": () => t("A factor tree"),
  fractions: () => t("A fraction circle and a fraction bar"),
  decimals: () => t("A hundredths grid and tenths strips"),
  money: () => t("Coins and a bill"),
  measurement: () => t("A ruler measuring a bar"),
  geometry: () => t("A triangle, a hexagon and a circle"),
  data: () => t("A bar chart with a middle line"),
  "number-system": () => t("A number line with opposites"),
  ratios: () => t("Ratio blocks and a percent bar"),
  expressions: () => t("A balanced scale"),
  exponents: () => t("Cubes growing in size"),
  linear: () => t("Two lines crossing on a graph"),
};

export const HEADER_LABELS = {
  dashboard: () => t("Hills with a winding path to a flag"),
  practice: () => t("Practice cards and a worksheet with a pencil"),
  review: () => t("Review points spaced farther apart on a timeline"),
  challenge: () => t("A mountain with a flag at the top"),
  games: () => t("A board path with a die and game tiles"),
  writing: () => t("A notebook page with colour-coded parts and a pencil"),
  progress: () => t("Rising bars with a star at the top"),
  teacher: () => t("A board with a chart and a class checklist"),
  family: () => t("A house with a family outside"),
};

export const REPORT_LABELS = {
  student: () => t("Student report header"),
  teacher: () => t("Teacher report header"),
  family: () => t("Family report header"),
};

export const EMPTY_LABELS = {
  start: () => t("A path to a flag, ready to begin"),
  "no-results": () => t("A magnifying glass over empty tiles"),
  "all-done": () => t("A finished stack of cards with a star"),
  offline: () => t("A device that keeps your work, with the cloud crossed out"),
};

export const ONBOARD_LABELS = {
  1: () => t("An open book with the sun rising"),
  2: () => t("A checklist and a magnifying glass"),
  3: () => t("Steps going up, with a ten-frame"),
  4: () => t("A seedling growing next to a badge"),
};

export const FAMILY_LABELS = {
  home: () => t("A house"),
  together: () => t("An adult and a child working on a card together"),
  routine: () => t("A sun, a moon and a week with three days checked"),
  celebrate: () => t("Two people cheering under a star"),
};

export const BADGE_NAMES = {
  "strand-number-sense": () => t("Number sense finisher"),
  "strand-add-sub": () => t("Addition and subtraction finisher"),
  "strand-place-value": () => t("Place value finisher"),
  "strand-mult-div": () => t("Multiplication and division finisher"),
  "strand-fractions": () => t("Fractions finisher"),
  "strand-decimals": () => t("Decimals finisher"),
  "strand-ratios": () => t("Ratios and percents finisher"),
  "strand-expressions": () => t("Expressions and equations finisher"),
  "strand-geometry": () => t("Geometry and measurement finisher"),
  "strand-data": () => t("Data and probability finisher"),
  "strand-number-system": () => t("Number system finisher"),
  "strand-functions": () => t("Functions and graphs finisher"),
  "streak-3": () => t("3-day practice streak"),
  "streak-7": () => t("7-day practice streak"),
  "streak-14": () => t("14-day practice streak"),
  "streak-30": () => t("30-day practice streak"),
  "remembered-week": () => t("Remembered after a week"),
  "remembered-month": () => t("Remembered after a month"),
  "remembered-term": () => t("Remembered after a term"),
  "misconception-fixed": () => t("Mistake corrected"),
  "review-keeper": () => t("Review keeper"),
  "first-independent": () => t("First skill on my own"),
  "growth-spurt": () => t("Growth"),
  "explain-it": () => t("Explain it"),
  "challenge-taker": () => t("Challenge taker"),
  "challenge-conquered": () => t("Challenge conquered"),
  perseverance: () => t("Kept going"),
  "mistake-detective": () => t("Mistake detective"),
  "teach-back": () => t("Teach it back"),
  "writing-first": () => t("First math writing"),
  "game-explorer": () => t("Game explorer"),
  "family-partner": () => t("Family partner"),
  "two-languages": () => t("Two languages"),
  "checkup-complete": () => t("Checkup complete"),
  "steady-week": () => t("Steady week"),
  "hint-wise": () => t("Hint wise"),
  comeback: () => t("Welcome back"),
};

export const label = {
  badge: (name, earned) => (earned ? t("{name}, earned", { name }) : t("{name}, not yet earned", { name })),
  grade: (n) => (n === 0 ? t("Kindergarten") : t("Grade {n}", { n })),
  milestone: (n) => t("Milestone medal, level {n} of 5", { n }),
  certificate: () => t("Certificate frame"),
  pathway: (counts) =>
    t("Learning pathway with {n} steps: {new} new, {developing} developing, {proficient} proficient, {mastered} mastered", counts),
};
