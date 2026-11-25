// Verifier: no physical manipulatives (house rule: paper and pencil only). It REPORTS authored text that tells a student or a
// teacher to handle physical objects (cubes, counters, tiles, base-ten blocks, ...). It never edits content.
//
// Findings (all per string, path = the string's path):
//   MANIP_DIRECTIVE   error  a clause with a manipulation verb and a manipulative noun and no drawing word:
//                            "Put 4 red cubes on your desk.", "Show it with your red and blue cubes."
//   MANIP_MATERIAL    error  an entry of a `materials` list names a manipulative ("Counters", "Letter tiles")
//   MANIP_ACTION_MENTION warn the same pattern in a clause that is not an instruction ("I put 7 counters on the ten frame.")
//   MANIP_MENTION     info   a strong manipulative noun with no verb ("a ten frame and some red counters") - not gated
//   MANIP_CHECKED     info   strings examined (coverage floor: a parser that sees nothing fails)
//
// Allowed (paper-and-pencil): a clause that also holds a drawing word (draw, drew, sketch, shade, color in, circle, picture,
// diagram, "on paper", write) is classed MANIP_DRAWN (info): "Draw 7 counters on the ten frame."
// Strong nouns always count; weak nouns (rods, beans, coins, dice, blocks, chips, tiles, ...) count only inside a manipulation
// clause AND only in math and science (elsewhere "blocks sunlight", "fish and chips", "roof tiles" are ordinary words).
//
// Scope: studio and lessons text via walkStrings (Spanish glosses, ids and enums skipped there). Art descriptions (`cue`), word
// families (`family`) and vocabulary terms are descriptions of a picture or a word list, not instructions, and are skipped.
//
// Hand-read false-positive classes (documented, handled by rule, not by baseline): "bean plants" (a crop, not a counter),
// "ice cube", "audio button", "counter and rebut", "counterexample", `Letter tiles` in a Fundations card list is a REAL hit
// (physical tiles) and stays flagged, `Fundations keyword cards` are paper and pass, "blocks sunlight/the view", "building
// blocks of" (idiom) and "block of houses". Remaining uncertainty: a clause such as "Count the cubes in the picture" is
// reported as MANIP_DIRECTIVE because the verb "count" alone is not trusted to mean "look at a drawing"; a reviewer decides.
import { isMathOrScience, rootOf, walkStrings } from "./lib/walk.mjs";

export const name = "no-manipulatives";
export const coverageCodes = ["MANIP_CHECKED"];

const STRONG =
  /\b(?:unifix(?: cubes?)?|(?:linking|snap|counting|connecting|color|colour|wooden|plastic|number|algebra|letter|fraction|shape|base[- ]ten|pattern|square|ten[- ]frame|two[- ]color|2[- ]color)\s+(?:cubes?|tiles?|blocks?|counters?|bears?|chips?|rods?)|cubes|counters|manipulatives?|base[- ]ten (?:blocks?|rods?|flats?))\b/i;
const WEAK =
  /\b(?:tiles|rods|beans|coins|pennies|dimes|nickels|dice|die|spinners?|dominoes|blocks|chips|straws|paper clips|beads|toothpicks)\b/i;
const NOT_OBJECT =
  /\b(?:ice cubes?|bean plants?|bean seeds?|string beans?|building blocks? of|blocks? (?:of houses|sunlight|the (?:view|sun|light|road))|counter(?:-| ?)example|counterexamples?|counterargument|cube (?:root|number)|cubed|cubic)\b/gi;
// Verbs that mean handling an object. Not here on purpose: make, get, compare, take (away), show, group - they are ordinary
// mathematics words ("make a ten", "take away 3", "compare") and flooded the first sweep with false positives.
const VERB =
  /\b(?:use|using|put|putting|place|placing|line up|lay|stack|stacking|grab|pick up|count out|build|building|model|move|moving|arrange|snap|connect|link|sort|give|hold|fill|cover|push|slide|trace|bring|set out|hand out|pass out|drop|trade|exchange|swap|touch|show(?=[^.]{0,30}\bwith\b)|act (?:it |them |this )?out(?= with))\b/i;
const RANDOMIZER =
  /\b(?:roll|rolls|rolling|spin|spins|spinning|toss|tosses|tossing|flip|flips|flipping)\b[^.]{0,30}\b(?:dice|die|number cubes?|spinners?|coins?)\b/i;
const DRAW =
  /\b(?:draw|draws|drawing|drew|drawn|sketch\w*|shade|shaded|colou?r(?:ed)? in|circle|circled|picture|pictures|diagram|illustrat\w+|on paper|write|written)\b/i;
const LEAD = new Set(["first", "then", "next", "now", "also", "please", "and", "so", "finally"]);
const IMPERATIVE = new Set(
  "use put place line lay stack grab pick count build model move arrange snap connect link sort give hold fill cover push slide trace bring set hand pass drop trade swap touch roll spin toss flip show act".split(
    " ",
  ),
);
const TEACHER_LEAD =
  /^(?:children|students|learners|kids|partners|pairs|groups|each (?:student|child|pair)|everyone|have|let|ask|invite|encourage|remind|allow|help|tell|can you|could you|please)\b/i;
// A subject or a declarative verb ahead of the handling verb means the clause describes, it does not instruct.
const DECLARATIVE =
  /\b(?:i|we|he|she|they|it|means?|is|are|was|were|has|have|had|can|will|may|would|when|because|like|for|which|that|so|how|what)\b/i;
const SKIP_PATH = /(?:^|\.)(?:cue|family|term)(?:\[|\.|$)|\.family\[/;
// Generated wrappers that only quote a clue from the vocabulary list; the quoted text is judged at its source. Quoted text
// (a term, a card prompt, a mentor sentence) is removed before the clause scan for the same reason: it is judged where it is
// authored, so the same sentence is not counted again in every mission that points at it.
const WRAPPER = /^(?:point to the picture clue|say which word fits each clue, starting with)\b/i;
const QUOTED = /[\u201c"][^\u201d"]*[\u201d"]/g;
const CLAUSE = /[.;:!?]\s+|,\s+(?:then|and then|and|so|but)\s+|\s+(?:then|and then)\s+/i;

const hit = (code, severity, path, message, text) => ({
  code,
  severity,
  path,
  message,
  evidence: { text: text.slice(0, 200) },
});

/** Classify one clause: "directive" | "mention" | "drawn" | "mention-only" | null. */
export function classifyClause(clause, { weakOk }) {
  const cleaned = clause.replace(NOT_OBJECT, " ");
  const noun = (weakOk ? [STRONG, WEAK] : [STRONG]).map((re) => re.exec(cleaned)).find(Boolean);
  const strong = Boolean(STRONG.exec(cleaned));
  if (!noun) return null;
  const verb = VERB.exec(cleaned);
  const rolled = RANDOMIZER.test(cleaned);
  if (!rolled && !(verb && verb.index < noun.index + noun[0].length))
    return strong ? "mention-only" : null;
  const draw = DRAW.exec(cleaned);
  if (!rolled && draw && draw.index < noun.index) return "drawn";
  const words = cleaned.trim().toLowerCase().split(/\s+/);
  while (LEAD.has(words[0])) words.shift();
  if (IMPERATIVE.has(words[0]) || TEACHER_LEAD.test(words.join(" "))) return "directive";
  // "Listen to each command and show it with ..." is still an instruction: no subject and no declarative verb before the verb.
  const before = cleaned.slice(0, verb ? verb.index : 0);
  return verb && !DECLARATIVE.test(before) ? "directive" : "mention";
}

export function verify(target) {
  const findings = [];
  const weakOk = isMathOrScience(target);
  let checked = 0;
  for (const { path, text } of walkStrings(rootOf(target))) {
    if (SKIP_PATH.test(path)) continue;
    if (WRAPPER.test(text)) continue;
    checked += 1;
    if (/(?:^|\.)materials\[\d+\]$/.test(path)) {
      if (STRONG.test(text.replace(NOT_OBJECT, " ")) || (weakOk && WEAK.test(text)))
        findings.push(
          hit(
            "MANIP_MATERIAL",
            "error",
            path,
            "materials list names a physical manipulative",
            text,
          ),
        );
      continue;
    }
    const kinds = new Set();
    for (const clause of text.replace(QUOTED, " ").split(CLAUSE)) {
      const k = classifyClause(clause, { weakOk });
      if (k) kinds.add(k);
    }
    if (kinds.has("directive"))
      findings.push(
        hit(
          "MANIP_DIRECTIVE",
          "error",
          path,
          "tells someone to handle a physical manipulative",
          text,
        ),
      );
    else if (kinds.has("mention"))
      findings.push(
        hit(
          "MANIP_ACTION_MENTION",
          "warn",
          path,
          "describes handling a physical manipulative",
          text,
        ),
      );
    else if (kinds.has("mention-only"))
      findings.push(
        hit("MANIP_MENTION", "info", path, "names a manipulative without an instruction", text),
      );
    else if (kinds.has("drawn"))
      findings.push(
        hit("MANIP_DRAWN", "info", path, "manipulative drawn on paper (allowed)", text),
      );
  }
  findings.push({
    code: "MANIP_CHECKED",
    severity: "info",
    path: "",
    message: "strings examined",
    evidence: { n: checked },
  });
  return findings;
}

const unit = (subject, over) => ({
  id: `fx-${subject}`,
  grade: "K",
  subject,
  studio: { activities: [] },
  lessons: [],
  ...over,
});

export const fixtures = {
  bad: [
    {
      name: "put cubes on your desk",
      target: unit("Math", {
        studio: { activities: [{ mission: "Put 4 red cubes on your desk." }] },
      }),
      expect: ["MANIP_DIRECTIVE"],
    },
    {
      name: "materials list and show-with-cubes",
      target: unit("Math", {
        studio: {
          activities: [
            { materials: ["Counters", "Ten frame"], tip: "Model it with the cubes first." },
          ],
        },
      }),
      expect: ["MANIP_MATERIAL", "MANIP_DIRECTIVE"],
    },
    {
      name: "first-person action mention",
      target: unit("Math", {
        studio: { vocab: [{ example: "I put 7 counters on the ten frame." }] },
      }),
      expect: ["MANIP_ACTION_MENTION"],
    },
    {
      name: "weak noun in a math clause",
      target: unit("Math", {
        studio: { activities: [{ mission: "Sort the dice into two piles." }] },
      }),
      expect: ["MANIP_DIRECTIVE"],
    },
  ],
  good: [
    {
      name: "drawn on paper, bean plants, ice cube, audio button, blocks sunlight",
      target: unit("Math", {
        studio: {
          activities: [
            { mission: "Draw 7 counters on the ten frame." },
            { mission: "Bed 2 has 5 bean plants and 8 squash plants." },
            { tip: "Tap the audio button, then say the word." },
          ],
          vocab: [
            { cue: "A hand holding an ice cube.", def: "dirt blocks sunlight from the bay grass" },
          ],
        },
      }),
    },
    {
      name: "ELA text where weak nouns are ordinary words",
      target: unit("ELA", {
        studio: { activities: [{ mission: "Put the chips and fish on the menu card." }] },
      }),
    },
  ],
};
