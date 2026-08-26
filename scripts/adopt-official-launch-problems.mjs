#!/usr/bin/env node
/**
 * adopt-official-launch-problems.mjs — make the lesson's OPENING word problem
 * the one on the official Reveal slide.
 *
 * WHY. Joel, 2026-08-26: "I'm not sure the word problems are lining up
 * correctly to the slides. In 2.7 the first word problem is textbook purchases
 * and the next is building bookshelves." He was right. The official 2.7 deck
 * opens on "Textbook Purchases" — an order form for 75 math workbooks totalling
 * $394.50, which is exactly the 394.50 ÷ 75 the deck then works — while the
 * repo's own launch narrative was a space station dividing a mineral sample
 * into 6.3 kg pods. Same mathematics, a different story from the one on the
 * projector.
 *
 * WHAT IT DOES. For the lessons listed below it replaces `launch.narrative`
 * with the official problem's text and attaches the official figure, copied out
 * of the extracted deck into the lesson's own reveal-assets/.
 *
 * WHY THIS LIST AND NOT MORE. A first pass measured 60 of 86 repo teaching
 * problems as sharing under 35% of their wording with their deck. That number
 * was mostly noise: the detector was matching the deck's Be Curious slides,
 * "This or That" number routines and "Math is…" banner chrome, none of which are
 * the lesson's word problem. Reading every candidate — including looking at
 * every image — leaves FIFTEEN lessons with a genuine official opening word
 * problem. Those are here. Every other lesson's opener is repo-authored on
 * purpose and is left alone.
 *
 * NOT THE FLAGSHIP LESSONS. 3-1, 3-2 and 8-1 open on an authored mission cover
 * — "ARCADE BUILDER MISSION · Best Booth in the Arcade", "COLD CASE MISSION ·
 * The Equation Vault" — which is the first screen a student sees and which
 * frames the whole lesson. Swapping the launch problem underneath one of those
 * leaves the cover announcing an arcade and the first problem showing a map of
 * the Boston-to-Washington rail line. A themed mission is a designed
 * experience, not decoration, so those three keep theirs whole rather than
 * being half-migrated.
 *
 * ALT TEXT IS HAND-WRITTEN, from looking at each figure. These problems keep
 * their numbers IN the picture ("as shown in the order form", "the temperatures
 * … are shown"), so a screen-reader user given only "Figure for this problem"
 * has no problem to solve. That is the same standard the Apply migration set.
 *
 * Spanish: no core lesson has ever authored `launch.narrativeEs` (0 of 84) and
 * no es-* gate reads the launch narrative, so there is no Spanish twin to fall
 * out of sync here.
 *
 * Usage:
 *   node scripts/adopt-official-launch-problems.mjs           # write
 *   node scripts/adopt-official-launch-problems.mjs --check   # fail if stale
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXTRACT = join(homedir(), "reveal-extract");
const CHECK = process.argv.includes("--check");

/**
 * One entry per lesson whose opening problem is the official one.
 *   badge — the problem's name on the deck, which becomes the card's badge.
 *   text  — the slide's own words, with the deck's trailing UI labels
 *           ("Think About It:", "Reveal:", "Mindset") stripped.
 *   img   — the slide image in ~/reveal-extract/<deck>/img/, or null.
 *   alt   — written from looking at the figure. Every number a solver needs.
 */
const ADOPTIONS = [
  {
    lesson: "2-7",
    badge: "Textbook Purchases",
    // The worked example's last line read "Correct — 3 pods can be filled",
    // which named the space-station story this script replaces and nothing else
    // in the lesson mentions any more. Every other migrated lesson's worked
    // example introduces its own context (a pancake recipe, Chef Reyes's cocoa,
    // a detective's clue) and stands on its own; this was the one dangling
    // reference. The mathematics is untouched.
    idoReplace: [
      [
        "I check by multiplying: 6.3 × 3 = 18.9. Correct — 3 pods can be filled.",
        "I check by multiplying: 6.3 × 3 = 18.9. Correct — 18.9 ÷ 6.3 = 3.",
      ],
    ],
    deck: "2_7",
    img: "s06-3cb6388c84c3.png",
    text: "A school bought new math workbooks as shown in the order form. What is the cost of each workbook?",
    alt: "An order form headed Order Form. Order number B16599, client Oak City Middle School. A table lists the item Math Workbook with 75 as the number of items. Payment total: 394.50.",
  },
  {
    lesson: "2-9",
    badge: "High Temperature",
    deck: "2_9",
    img: "s06-0faade06494c.png",
    text: "The forecast shows the expected high temperatures for a week. The mean high temperature for the week is 79°F. How can you describe the variation in high temperatures over the week?",
    alt: "A seven-day forecast strip. Sunday 68, Monday 74, Tuesday 83, Wednesday 75, Thursday 82, Friday 81, Saturday 90, each with a weather icon.",
  },
  {
    lesson: "2-10",
    badge: "Teaching Experience",
    deck: "2_10",
    img: null,
    text: "The students want to describe the data they collected about the number of years of teaching experience of the teachers in their school. Which measure of center and measure of variation should they use to summarize the data set?",
    alt: "",
  },
  {
    lesson: "3-3",
    badge: "Making Homemade Clay",
    deck: "3_3",
    img: "s06-98fedf025adc.png",
    text: "Brian will use the recipe shown to make clay. He needs to make multiple batches of clay. How can Brian determine how much baking soda and cornstarch he needs for multiple batches of clay to get the same consistency?",
    alt: "A clay recipe card: 2 cups baking soda, 1 cup cornstarch, 1 and 1 quarter cups water, and food colouring.",
  },
  {
    lesson: "3-4",
    badge: "Soccer Balls",
    deck: "3_4",
    img: "s06-66335aad6052.png",
    text: "The organizers of a soccer league ordered 6 of the bags shown to hold soccer balls. Each bag holds the same number of soccer balls. How many soccer balls will the bags hold?",
    alt: "An open sports bag holding six soccer balls in different colours.",
  },
  {
    lesson: "3-5",
    badge: "Purple Paint Mixture",
    deck: "3_5",
    img: "s06-cd265d26c0b4.png",
    text: "Two friends used the paint shown to create shades of purple paint. Whose mixture contains the most blue paint?",
    alt: "Two circles of paint cans. Reginald's circle holds 3 red cans and 3 blue cans. Anwar's circle holds 2 red cans and 3 blue cans.",
  },
  {
    lesson: "6-5",
    badge: "Class Field Day",
    deck: "6_5",
    img: "s07-752913a48894.png",
    text: "Evelyn is helping to plan the sixth-grade field day. The committee will order the items shown for each student participating in field day. They do not yet know how many students will be participating. The shipping cost for all items is a one-time cost of $23.50. What expression can Evelyn use to determine how much the committee will need to purchase the items?",
    alt: "Three field-day items with prices: a water bottle at $1.50, a Field Day t-shirt at $12.95, and a lanyard badge at $0.65.",
  },
  {
    lesson: "7-2",
    badge: "Arihi's Plant",
    deck: "7_2",
    img: "s06-6dd0efc0b935.png",
    text: "Arihi planted a flower. The height and depth of the plant are shown. How do the height of the plant and the depth of the roots compare?",
    alt: "A flower drawn across the ground line. The stem is labelled seven eighths of a foot above ground and the roots are labelled seven eighths of a foot below ground.",
  },
  {
    lesson: "7-3",
    badge: "Beaker Temperatures",
    deck: "7_3",
    img: "s06-4913cd8392d8.png",
    text: "Claire is performing a science experiment with two liquids. The temperatures of the two liquids in Celsius are shown. She needs to use the beaker with the temperature that is closer to 0°C. Which beaker should Claire use?",
    alt: "A lab-notes clipboard showing two beakers. Beaker A is at negative 4 degrees Celsius and Beaker B is at 2 degrees Celsius.",
  },
  {
    lesson: "7-4",
    badge: "Trivia Game",
    deck: "7_4",
    img: "s06-0dcdf59e4f9a.png",
    text: "Lucy and Yuzuki are playing a trivia game with these rules: if a player answers a question correctly, they receive 1 point; if they answer incorrectly, they lose 0.25 point. The player with the greatest score wins the game. The final scores for two games are shown in the table. Who is the winner of each game?",
    alt: "A Trivia Night score table. Game 1: Lucy 2, Yuzuki negative 1. Game 2: Lucy negative 0.5, Yuzuki negative 0.75.",
  },
  {
    lesson: "9-2",
    badge: "Football Game Tickets",
    deck: "9_2",
    img: "s06-7011ca82a894.png",
    text: "The ticket shows the cost to attend a college football game. How does the total cost of tickets relate to the number of tickets purchased?",
    alt: "A Village Stadium ticket for Lions versus Eagles. Price $45. Section A, row 5, seat 21.",
  },
  {
    lesson: "9-3",
    badge: "The Cost of Fitness",
    deck: "9_3",
    img: "s06-5e4ecf8264f8.png",
    text: "Miguel is interested in joining a recreation center. Recreation World charges the monthly fee shown on the flyer. How can Miguel determine the cost of being a member of Recreation World for any number of months?",
    alt: "A Recreation World flyer showing people exercising, with a starburst reading $24.95 per month.",
  },
];

const stale = [];
let wrote = 0;

function put(path, contents) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === contents) return false;
  if (CHECK) {
    stale.push(path.slice(ROOT.length + 1));
    return true;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return true;
}

for (const entry of ADOPTIONS) {
  const configPath = join(ROOT, "lessons", entry.lesson, "config.json");
  if (!existsSync(configPath)) {
    console.error(`  SKIP ${entry.lesson} — no config.json`);
    continue;
  }
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  config.launch = config.launch || {};
  config.launch.narrative = entry.text;
  // The badge is the problem's own name on the deck. Leaving the repo's themed
  // one ("SPACE STATION POD SPLITTER") sitting above an order form for math
  // workbooks is the mismatch this script exists to end, one line higher up.
  if (entry.badge) config.launch.badge = entry.badge;

  // The observation widget goes with the story. Every one of these was built
  // for the narrative this script just replaced — 2-7 had a number line
  // "Filling 6.3 kg pods from 18.9 kg" sitting above an order form for math
  // workbooks, 3-2 an arcade-booth bar chart above a map of the Boston to
  // Washington rail line, 7-3 "Captain Vega's Treasure Sites" above two lab
  // beakers (Joel, 2026-08-26: "it shouldn't be part of 2.7"). What students
  // observe now is the Notice & Wonder image and the problem's own figure, both
  // of which are about today's story.
  if (config.launch.visual) delete config.launch.visual;

  // A worked-example line that named the replaced story, repaired verbatim.
  // Exact-match only: a line that has already been edited is left alone rather
  // than half-rewritten.
  const ido = ((config.launch.conceptIntro || {}).iDo || {}).lines;
  if (Array.isArray(ido) && Array.isArray(entry.idoReplace)) {
    for (const [from, to] of entry.idoReplace) {
      const at = ido.indexOf(from);
      if (at >= 0) ido[at] = to;
    }
  }

  if (entry.img) {
    const src = join(EXTRACT, entry.deck, "img", entry.img);
    const destDir = join(ROOT, "lessons", entry.lesson, "reveal-assets");
    const dest = join(destDir, "launch-problem.png");
    if (existsSync(src)) {
      if (!CHECK) {
        mkdirSync(destDir, { recursive: true });
        if (!existsSync(dest) || readFileSync(src).compare(readFileSync(dest)) !== 0) {
          copyFileSync(src, dest);
        }
      } else if (!existsSync(dest)) {
        stale.push(`lessons/${entry.lesson}/reveal-assets/launch-problem.png`);
      }
      config.launch.problemImage = `/lessons/${entry.lesson}/reveal-assets/launch-problem.png`;
      config.launch.problemImageAlt = entry.alt;
    } else if (!existsSync(dest)) {
      // The extract cache is a developer convenience, not a build input. When it
      // is absent the already-copied asset in the repo is what ships, and only a
      // lesson that has neither is a real problem.
      console.error(`  WARN ${entry.lesson} — no cached figure and none in the repo`);
    } else {
      config.launch.problemImage = `/lessons/${entry.lesson}/reveal-assets/launch-problem.png`;
      config.launch.problemImageAlt = entry.alt;
    }
  }

  if (put(configPath, `${JSON.stringify(config, null, 2)}\n`)) wrote += 1;
}

if (CHECK) {
  if (stale.length) {
    console.error(
      `adopt-official-launch-problems --check: ${stale.length} stale file(s) — run \`node scripts/adopt-official-launch-problems.mjs\`:\n  ${stale.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(
    `adopt-official-launch-problems --check: ${ADOPTIONS.length} lesson(s) carry their official opening problem`,
  );
} else {
  console.log(
    `adopt-official-launch-problems: ${ADOPTIONS.length} lesson(s) processed, ${wrote} config(s) updated`,
  );
}
