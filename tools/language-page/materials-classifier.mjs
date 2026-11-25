// Materials classifier (audit F-16, decision D3): "no manipulatives in lesson materials, paper-based substitutes only".
// Classifies every `materials` entry as one of
//   paper_pencil     paper, writing tools, notebooks, sticky notes, chart paper, blank pages
//   printed_card     a printed card, strip, mat, template, map, chart, graph, text or picture
//   device           classroom hardware that is not handed out: a device with sound, a whiteboard (counted, not a violation)
//   physical_object  a manipulative or real object (cubes, counters, blocks, a ball, a flashlight, scissors ...)
// Method (documented so the result is reproducible and arguable):
//  1. Take the part of the entry before ":" ("Picture cards: boat horn, ship" is a card; the list names its pictures).
//  2. Drop "(optional)" and similar parentheses, then split into alternatives on "," / " or " / " and " / ";".
//  3. Each alternative is tested in order against PHYSICAL, then PRINTED, then PAPER keyword rules. First match wins.
//  4. The entry takes the WORST class of its alternatives (physical > printed > paper). "Globe or map" is
//     therefore physical: the paper alternative exists, but the entry does not insist on it. The proposals file
//     records these as "has_paper_alternative".
//  5. Classroom scope: an alternative that matches no rule is "unclassified" and fails G-44, so a new material can
//     never slip through. Family scope (free-text household prose): anything not paper/printed/people/place is
//     household_object by default (rule "default-household"), and entries naming nothing are no_materials.
// Limits: keyword rules, not understanding. "Paper clock" and "paper circles" count as paper because the
// paper-based substitute is exactly what the "no manipulatives" rule asks for; a teacher might still call a cut-out
// clock a manipulative. Hand-check results are in the phase 4 report, never assumed.

export const CLASSES = ["paper_pencil", "printed_card", "device", "physical_object"];
export const FAMILY_CLASSES = ["paper_pencil", "printed_card", "household_object", "no_materials"];

const PHYSICAL = [
  "physical:manipulative",
  /\b(cubes?|counters?|(?<!around the )blocks?|rods?|tiles?|sticks?|ten-sticks)\b/,
  "physical:real-object",
  /\b(objects?|ball|flashlight|spoon|drum|bucket|jar|coins?|orange|seeds?|soil|tray|plastic|wax paper|cardboard|paper clips?|rocks?|bins?|boxes|(?<!-)box|whistle|puppet|calculators?|scissors|ruler|string|water|bag|globe|test materials|solid shapes|real shapes|toys?|towels?|rope|yarn|backpack|scale|balloons?|rice|magnets?|rubber band|models?)\b/,
];
const DEVICE = [
  "device:hardware",
  /\b(devices?|whiteboards?|tablets?|chromebooks?|computers?|speakers?|headphones?)\b/,
];
const PRINTED = [
  "printed:card-or-sheet",
  /\b(cards?|mats?|strips?|templates?|maps?|atlas|graphs?|charts?(?! paper)|frames?|picture|pictures|text|story from class|postcards?|timeline|reporter notes|set|photos?|report|books?|printed|flyers?|receipts?|printouts?|labels?|dictionary|bills?|tags?|lyrics|poem|stats|lists?|articles?)\b/,
];
const PAPER = [
  "paper:paper-or-tool",
  /\b(papers?|slips?|sheets?|pencils?|pens?|crayons?|markers?|highlighters?|notebook|sticky notes?|notes|journal|page)\b/,
];
const RULES = [
  ["physical_object", PHYSICAL],
  ["device", DEVICE],
  ["printed_card", PRINTED],
  ["paper_pencil", PAPER],
];
const WORST = { physical_object: 4, device: 3, printed_card: 2, paper_pencil: 1 };

const PRINTED_NOUN_LAST = /\b(cards?|mats?|strips?|templates?|charts?|graphs?)(?: ab)?$/;
const head = (text) =>
  String(text)
    .replace(/^optional:\s*/i, "")
    .split(":")[0]
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\ba and b\b/g, "ab");
const parts = (text) =>
  head(text)
    .split(/,|;|\s(?:or|and)\s/)
    .map((p) => p.trim())
    .filter(Boolean);

function classifyPart(part) {
  for (const [klass, rule] of RULES)
    for (let i = 0; i < rule.length; i += 2)
      if (rule[i + 1].test(part)) return { klass, rule: rule[i] };
  return null;
}

/** {class, rule, hasPaperAlternative} for one classroom entry; class "unclassified" when a part matches no rule. */
export function classifyClassroom(text) {
  // "Jar cards A and B" is a card: when the entry's last word is a printed noun, modifiers like jar/box/bag do not matter.
  if (PRINTED_NOUN_LAST.test(head(text).trim()) && !PHYSICAL[1].test(head(text)))
    return { class: "printed_card", rule: "printed:card-head", hasPaperAlternative: false };
  const whole = classifyPart(head(text));
  let worst = null;
  let rule = null;
  let paperAlt = false;
  for (const p of parts(text)) {
    // A part with no keyword of its own ("animal" in "Animal and plant picture cards") borrows the whole entry's class.
    const c = classifyPart(p) || whole;
    if (!c)
      return { class: "unclassified", rule: `no rule for "${p}"`, hasPaperAlternative: false };
    if (c.klass !== "physical_object") paperAlt = true;
    if (!worst || WORST[c.klass] > WORST[worst]) {
      worst = c.klass;
      rule = c.rule;
    }
  }
  if (!worst) return { class: "unclassified", rule: "empty entry", hasPaperAlternative: false };
  return { class: worst, rule, hasPaperAlternative: worst === "physical_object" && paperAlt };
}

// Family prose also names things that are not objects at all (an activity, a place, a person, a story).
const NOT_AN_OBJECT =
  /\b(walk|ride|look|story|stories|news|memories|window|porch|place|school|workplace|grown-up|relatives?|neighbors?|movie|show|photo|yard|park|night sky|sunny day|stove|event|conversation|today|kitchen|stop|talking|home)\b/;
const PEOPLE =
  /\b(family|members?|people|partner|friends?|child|children|parents?|siblings?|someone|adults?|everyone)\b/;
const NO_MATERIALS =
  /^(nothing|no materials|your (ears|hands|voice)|two people|a (comfortable|quiet) place|a walk|a short walk|a look|a visit|a yard|an? (old )?(family )?(photo|story)|a storybook|a family (recipe|rule))/i;

/** Family entries are prose. The question is only: does this name anything beyond paper, printed matter and places? */
export function classifyFamily(text) {
  const t = String(text).trim();
  const ps = parts(t);
  if (NO_MATERIALS.test(t) && !/\b(paper|pencil|crayon|marker)\b/i.test(t) && ps.length <= 2)
    return { class: "no_materials", rule: "names no object" };
  let worst = null;
  let rule = null;
  for (const p of ps) {
    const c = classifyPart(p);
    if (!c && (PEOPLE.test(p) || NOT_AN_OBJECT.test(p))) continue; // "two family members" is not a material
    const klass = c
      ? c.klass === "physical_object"
        ? "household_object"
        : c.klass
      : "household_object";
    const w = klass === "household_object" ? 4 : WORST[klass];
    if (!worst || w > worst.w) {
      worst = { klass, w };
      rule = c ? c.rule : "default-household";
    }
  }
  if (!worst) return { class: "no_materials", rule: "empty entry" };
  return { class: worst.klass, rule };
}

/** Known answers the gate re-checks (a classifier edit that flips one is caught). */
export const KNOWN_ANSWERS = [
  ["Cubes", "physical_object"],
  ["Counters", "physical_object"],
  ["Ten frames", "printed_card"],
  ["Partner role cards", "printed_card"],
  ["Picture cards: cold wind, black bear, den", "printed_card"],
  ["Big chart paper", "paper_pencil"],
  ["Crayons", "paper_pencil"],
  ["Paper clock", "paper_pencil"],
  ["Paper clips", "physical_object"],
  ["Globe or map", "physical_object"],
  ["Base-ten blocks (optional)", "physical_object"],
  ["Flashlight", "physical_object"],
];
