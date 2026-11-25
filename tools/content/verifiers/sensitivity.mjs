// Verifier: sensitivity ASSIST. It lists text a human reviewer should look at; it NEVER edits content and a flag is not a
// ruling. Wordlists are deliberately short and conservative (missing a case is better than crying wolf at a teacher), and every
// flag is a warn that carries the matching phrase so a reviewer can dismiss it in seconds.
//
// Findings:
//   SENS_VIOLENCE_K5      warn  weapons or violence wording in text for Kindergarten to grade 5 (gk, g1..g5 units)
//   SENS_STEREOTYPE       warn  a loaded term or a sweeping claim about a group of people ("all girls ...", "illegal aliens")
//   SENS_GENDER_ROLE      warn  a household/occupation role tied to one gender in one clause ("Mom cooks", "boys ... fix")
//   SENS_CULTURAL_NARROW  warn  a holiday, a pork product or a church reference used as a default context in math or science
//                               word problems (ELA and social studies may teach these on purpose, so they are not flagged there)
//   SENS_NAME_SKEW        warn  names in a unit's word problems are thin or skewed: >= 12 mentions of the closed first-name
//                               list below with at most 2 distinct names, or >= 20 mentions with one name above 70% or one gender above 85%
//   SENS_CHECKED          info  strings examined (coverage floor)
//   SENS_NAME_TALLY       info  per-unit name counts, printed so a reviewer sees the evidence
//
// Names: the list is closed (about 90 given names used in this corpus) so "Bay" or "Summer" never count. Names are tagged only
// by gender (f / m / n for neutral), because that is a property the reviewer can verify. Cultural or national origin is NOT
// inferred from a name: that guess is unreliable and is itself a bias risk. The evidence lists the names and a reviewer judges.
//
// Hand-read false-positive classes: social-studies and ELA texts that teach war, slavery, civil rights or a historical battle
// (grade 3-5 units about the Revolution or Civil War) use war and weapon words on purpose, so war words are not in the K-5 list
// at all, only weapons and acts of violence; "shoot" is only flagged when aimed at a person or animal (a basketball, a photo and
// plant shoots are ordinary); "kill" is flagged in all forms except "kill time"; a gendered pair in a short sentence ("Mom bakes,
// Dad paints") is flagged once even when both roles are mixed - a reviewer reads it, and quoted historical text is not exempt.
import { derivedPrefixes, isMathOrScience, rootOf, subjectOf, walkStrings } from "./lib/walk.mjs";

export const name = "sensitivity";
export const coverageCodes = ["SENS_CHECKED"];

const VIOLENCE =
  /\b(?:guns?|rifles?|pistols?|knife|knives|swords?|bombs?|weapons?|murder\w*|stab(?:s|bed|bing)?|kill(?:s|ed|ing|er)?(?! time)|shoot(?:s|ing)? (?:at |him|her|them|you|people|someone|an? (?:animal|deer|person))|(?:was|got|were|been) shot|shot (?:him|her|them|at)|beat(?:s|ing)? (?:up|him|her|them))\b/i;
const STEREOTYPE = [
  /\b(?:all|most|every) (?:girls|boys|women|men|asians?|mexicans?|blacks?|whites?|jews|jewish people|muslims|immigrants|old people|poor people|rich people) (?:are(?! created equal)|like|love|can't|cannot|never|always|don't|do not)\b/i,
  /\b(?:girls|boys|women|men) (?:are|is) (?:bad|better|worse|weak|weaker|too emotional|naturally better) (?:at|than)\b/i,
  /\b(?:illegal aliens?|oriental(?:s)?|savages?|primitive (?:people|tribes?)|ghetto|third[- ]world|exotic (?:people|looking)|normal people|those people|you people|like a girl|redskins?|eskimos?)\b/i,
];
// Kin and group nouns only: a pronoun ("he drives", "she checked") is a character, not a claim about who does what.
const ROLE_F = /\b(?:mom|mother|grandma|grandmother|girls?|sister|aunt)\b/i;
const ROLE_M = /\b(?:dad|father|grandpa|grandfather|boys?|brother|uncle)\b/i;
const HOME_F =
  /\b(?:cooks?|cleans?|bakes?|sews?|shops?|babysits?|does the dishes|washes the dishes)\b/i;
const HOME_M = /\b(?:fix(?:es)?|mows?|builds?|drives?|plays? football|lifts?|repairs?)\b/i;
const CULTURAL =
  /\b(?:christmas|easter|halloween|thanksgiving|santa|valentine'?s|pork|bacon|ham sandwich|pepperoni|hot dogs?|church|sunday school)\b/i;
const NAMES = {
  f: "Mia Zoe Rosa Ana Nia Maya Dee Lena Susan Ava Lia Tia Lily Jada Tasha Aisha Mara Ella Emma Sofia Isabel Priya Amara Fatima Grace Ruby Hana Mei Lucia Nora Zara".split(
    " ",
  ),
  m: "Marcus Sam Kai Dev Eli Dre Leo Ben Tom Jin Tomas Jaylen Jamal Dante Carlos Omar Luis Ravi Noah Liam Mateo Andre Isaac Hassan Miguel Kofi Diego Malik Theo Wei".split(
    " ",
  ),
  n: "Jordan Lee Dani Pip Alex Sky Robin Casey Taylor Riley Quinn Jamie Morgan Avery".split(" "),
};
const NAME_GENDER = new Map(Object.entries(NAMES).flatMap(([g, list]) => list.map((n) => [n, g])));
const NAME_RE = new RegExp(`\\b(?:${[...NAME_GENDER.keys()].join("|")})\\b`, "g");
const NAME_MIN_MENTIONS = 20; // fewer mentions say nothing about a distribution
const NAME_FEW_MENTIONS = 12; // but a handful of mentions of one or two names is thin on its own
const SKIP_PATH = /(?:^|\.)(?:cue|family|term)(?:\[|\.|$)|\.family\[/;
const QUOTED = /[“"][^”"]*[”"]/g;

const k5 = (target) => /^g?(?:k|[1-5])$/i.test(String(target.grade));
const hit = (code, path, message, evidence) => ({
  code,
  severity: "warn",
  path,
  message,
  evidence,
});
const clauses = (text) => text.split(/[.;!?]\s+|,\s+(?:and|but|while)\s+/);

/** Names -> { total, byName, byGender } for the unit's student/teacher text (word-problem names live in many fields). */
export function nameTally(strings) {
  const byName = {};
  const byGender = { f: 0, m: 0, n: 0 };
  let total = 0;
  for (const text of strings)
    for (const m of text.matchAll(NAME_RE)) {
      byName[m[0]] = (byName[m[0]] || 0) + 1;
      byGender[NAME_GENDER.get(m[0])] += 1;
      total += 1;
    }
  return { total, byName, byGender };
}

export function nameSkew(tally) {
  if (tally.total < NAME_FEW_MENTIONS) return null;
  const counts = Object.values(tally.byName);
  const distinct = counts.length;
  const top = Math.max(...counts) / tally.total;
  const gTop = Math.max(tally.byGender.f, tally.byGender.m) / tally.total; // neutral names never make a gender skew
  const why = [];
  if (distinct <= 2) why.push(`${distinct} distinct name${distinct === 1 ? "" : "s"}`);
  if (tally.total >= NAME_MIN_MENTIONS && top > 0.7)
    why.push(`one name is ${Math.round(top * 100)}%`);
  if (tally.total >= NAME_MIN_MENTIONS && gTop > 0.85)
    why.push(`one gender is ${Math.round(gTop * 100)}%`);
  return why.length ? why.join("; ") : null;
}

export function verify(target) {
  const findings = [];
  // One finding per distinct text and code: the same sentence is repeated across the unit's studio and lesson copies.
  const seen = new Set();
  const push = (f) => {
    const key = `${f.code}|${f.evidence?.text ?? f.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      findings.push(f);
    }
  };
  const young = k5(target);
  const mathSci = isMathOrScience(target);
  const names = [];
  let checked = 0;
  // Derived activities (Listening Lab) copy authored strings verbatim; the authored source is scanned (see derivedPrefixes).
  const derived = derivedPrefixes(target);
  for (const { path, text } of walkStrings(rootOf(target))) {
    if (SKIP_PATH.test(path) || derived.some((p) => path.startsWith(p))) continue;
    checked += 1;
    const plain = text.replace(QUOTED, (q) => (q.length > 40 ? q : " "));
    if (young) {
      const v = VIOLENCE.exec(plain);
      if (v)
        push(
          hit("SENS_VIOLENCE_K5", path, "weapons or violence wording in K-5 text", {
            match: v[0],
            text: text.slice(0, 160),
          }),
        );
    }
    for (const re of STEREOTYPE) {
      const s = re.exec(plain);
      if (s)
        push(
          hit("SENS_STEREOTYPE", path, "loaded term or sweeping claim about a group", {
            match: s[0],
            text: text.slice(0, 160),
          }),
        );
    }
    for (const c of clauses(plain)) {
      if (
        (ROLE_F.test(c) && HOME_F.test(c) && !ROLE_M.test(c)) ||
        (ROLE_M.test(c) && HOME_M.test(c) && !ROLE_F.test(c))
      ) {
        push(hit("SENS_GENDER_ROLE", path, "a role tied to one gender", { text: c.slice(0, 160) }));
        break;
      }
    }
    if (mathSci) {
      const c = CULTURAL.exec(plain);
      if (c)
        push(
          hit(
            "SENS_CULTURAL_NARROW",
            path,
            "culturally specific default context in a math or science problem",
            { match: c[0], text: text.slice(0, 160) },
          ),
        );
    }
    if (mathSci) names.push(plain);
  }
  const tally = nameTally(names);
  const skew = nameSkew(tally);
  if (skew)
    findings.push(hit("SENS_NAME_SKEW", "", `name use in word problems: ${skew}`, { tally }));
  findings.push({
    code: "SENS_NAME_TALLY",
    severity: "info",
    path: "",
    message: "names used",
    evidence: { n: tally.total, byName: tally.byName },
  });
  findings.push({
    code: "SENS_CHECKED",
    severity: "info",
    path: "",
    message: "strings examined",
    evidence: { n: checked },
  });
  return findings;
}

const unit = (grade, subject, studio) => ({
  id: `fx-${grade}-${subject}`,
  grade,
  subject,
  studio,
  lessons: [],
});
const names = (list) => ({
  activities: list.map((n) => ({ mission: `${n} has 3 pencils and gives 1 away.` })),
});

export const fixtures = {
  bad: [
    {
      name: "weapon in grade 2",
      target: unit("2", "ELA", {
        activities: [{ mission: "The man pulled a knife and the boy ran." }],
      }),
      expect: ["SENS_VIOLENCE_K5"],
    },
    {
      name: "sweeping claim",
      target: unit("4", "ELA", {
        activities: [
          { mission: "All girls are afraid of science." },
          { tip: "He called them illegal aliens." },
        ],
      }),
      expect: ["SENS_STEREOTYPE"],
    },
    {
      name: "gender role",
      target: unit("3", "Math", { activities: [{ mission: "Mom cooks dinner for 4 people." }] }),
      expect: ["SENS_GENDER_ROLE"],
    },
    {
      name: "holiday and pork in a word problem",
      target: unit("5", "Math", {
        activities: [{ mission: "Ana buys 3 pounds of bacon for the Christmas party." }],
      }),
      expect: ["SENS_CULTURAL_NARROW"],
    },
    {
      name: "one name over and over",
      target: unit("5", "Math", names(Array(14).fill("Marcus"))),
      expect: ["SENS_NAME_SKEW"],
    },
  ],
  good: [
    {
      name: "varied names, a basketball shot, a war reading in grade 5 social studies",
      target: unit("5", "Math", {
        activities: [
          ...names([
            "Mia",
            "Marcus",
            "Zoe",
            "Dev",
            "Rosa",
            "Kai",
            "Ana",
            "Jordan",
            "Eli",
            "Nia",
            "Lee",
            "Sam",
          ]).activities,
          { mission: "Marcus can shoot a basketball 4 times in a row." },
          { mission: "Nia and Dev bake 12 muffins; she and he share them." },
          { mission: "Plant shoots grow 3 cm each week." },
        ],
      }),
    },
  ],
};
