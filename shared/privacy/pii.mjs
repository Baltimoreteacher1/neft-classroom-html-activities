/**
 * Free-text PII and never-collect screen, shared by every server field that can
 * reach storage. Dependency-free so it runs in Workers, Node tests and the browser.
 *
 *   detectPII(text)               -> { found: boolean, kinds: string[] }
 *   rejectIfPII(value, field)     -> null when clean, else a 422 Response
 *
 * The text is NEVER echoed, stored or logged: results carry rule kinds only.
 *
 * Two families of rules:
 *   1. Direct identifiers: names, email, phone, street address, SSN-like, ID numbers.
 *   2. Never-collect topics (see docs/security/pii-policy.md): birthplace / nationality,
 *      immigration terms, disability / IEP / 504 / SPED and other program labels,
 *      family income. These are screened because a free-text box is the one place a
 *      student or teacher can volunteer them.
 *
 * Classroom aliases "Star 1" .. "Star 28" are removed before any rule runs and always pass.
 *
 * TRADEOFF (documented, deliberate): the screen is STRICT on explicit phrasing and
 * deliberately blind to bare topic words. "I was born in", "my country", "visa" are
 * flagged; "Turkey", "China", "immigration", "citizen" on their own are not, because
 * social studies and ELA units use them as ordinary vocabulary. It is a heuristic net,
 * not a guarantee: a determined writer can phrase around it. Name detection is
 * conservative (lead-in phrases, honorifics, a curated first-name list plus a
 * capitalised surname) so ordinary capitalised words ("Baltimore City", "Reveal Math")
 * pass. False negatives are accepted over blocking normal student sentences.
 */

export const ALIAS_RE = /\bStar (?:[1-9]|1\d|2[0-8])\b/g;

// Curated, not exhaustive. A first name is only flagged when a capitalised surname
// follows ("Maria Lopez"), never on its own. Names that are also common words
// (Will, Mark, May, June, Rose, Grace, Hope, Joy, Bill, Pat, Art) are left out on purpose.
const FIRST_NAMES =
  "Aaliyah Aaron Abigail Adam Adrian Alejandro Alex Alexa Alexander Alexis Alicia Alyssa Amanda Amber Amy Andrea Andrew Angel Angela Anna Anthony Ashley Austin Ava Benjamin Brandon Brian Brianna Brittany Caleb Camila Carlos Carmen Catherine Charles Chloe Christian Christopher Cynthia Daniel Darius David Deja Derrick Destiny Diana Diego Dominic Elena Elijah Elizabeth Emily Emma Eric Esmeralda Ethan Eva Evelyn Fatima Gabriel Gabriela Hannah Hector Imani Isaac Isabella Ismael Jacob Jada Jamal James Jasmine Javier Jayden Jeremiah Jessica Jesus Joel John Jonathan Jordan Jose Joseph Joshua Juan Julia Julian Justin Kayla Kevin Khalil Kimberly Kyle Laila Laura Lauren Leah Liam Lillian Linda Logan Lucas Luis Luna Madison Marcus Maria Mariah Marisol Mateo Matthew Maya Mia Michael Michelle Miguel Mohammed Monique Nathan Nevaeh Nicholas Nicole Noah Olivia Omar Oscar Pedro Rafael Rebecca Ricardo Robert Roberto Samantha Samuel Sandra Sara Sarah Sofia Sophia Steven Tamika Tanya Taylor Thomas Tiffany Tyler Valeria Vanessa Victor Victoria Xavier Yasmin Zachary Zoe".split(
    " ",
  );
const FIRST_NAME_SET = new Set(FIRST_NAMES);

const NATIONALITIES =
  "Afghan|Salvadoran|Salvadorean|Guatemalan|Honduran|Nicaraguan|Mexican|Cuban|Dominican|Haitian|Jamaican|Colombian|Venezuelan|Peruvian|Ecuadorian|Brazilian|Chinese|Korean|Vietnamese|Filipino|Indian|Pakistani|Bangladeshi|Nepali|Burmese|Iraqi|Syrian|Yemeni|Ethiopian|Eritrean|Somali|Sudanese|Congolese|Nigerian|Ghanaian|Ukrainian|Russian|Turkish|Haitian|Honduran|Arab|Cameroonian";

const HONORIFIC = String.raw`(?:Mr|Mrs|Ms|Miss|Mx|Dr|Coach|Professor|Prof)\.?`;
const CAP_NAME = String.raw`[A-Z][a-z]{1,}`;

/** Each rule: kind + a test over alias-stripped text. */
export const RULES = [
  { kind: "email", test: (t) => /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/i.test(t) },
  {
    kind: "phone",
    test: (t) =>
      /(?<![\d.])(?:\+?\d{1,2}[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?!\d)/.test(t) ||
      /(?<![\d.])\d{3}-\d{4}(?!\d)/.test(t),
  },
  { kind: "ssn", test: (t) => /(?<!\d)\d{3}[-\s]\d{2}[-\s]\d{4}(?!\d)/.test(t) },
  {
    kind: "id",
    test: (t) =>
      /\b(?:student|passport|license|licence|government|gov|state|social security)\s*(?:id|number|no\.?|#)\s*(?:is|:)?\s*[A-Z0-9-]{5,}/i.test(
        t,
      ) ||
      /\b(?:ssn|social security number)\b/i.test(t) ||
      /(?<![\d,.])\d{9,}(?![\d,])/.test(t),
  },
  {
    kind: "address",
    test: (t) =>
      // 123 Main Street / 45 Oak Ave. (capitalised name words and suffix)
      /\b\d{1,6}\s+(?:[A-Z][A-Za-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Terrace|Circle|Cir|Highway|Hwy)\b/.test(
        t,
      ) ||
      // 123 main street (one or two words, unambiguous suffix only)
      /\b\d{1,6}\s+(?:[A-Za-z]+\s+){1,2}(?:street|avenue|boulevard|blvd|highway|parkway)\b/i.test(
        t,
      ) ||
      /\bp\.?\s?o\.?\s+box\s+\d+/i.test(t) ||
      /\b(?:my|our) (?:home )?address\b/i.test(t) ||
      /\bi live (?:at|on) \d/i.test(t) ||
      /\b\d{1,6}\s+[A-Za-z .]{2,30},\s*[A-Z][a-z]+,?\s+[A-Z]{2}\s+\d{5}\b/.test(t),
  },
  {
    kind: "name",
    test: (t) =>
      /\b(?:my (?:first |last |full )?name(?: is|'s)|name is)\s+[A-Za-z]/i.test(
        t,
      ) ||
      /\b(?:[Cc]all me|[Tt]hey call me|[Ii] go by|[Mm]y nickname is)\s+[A-Z]/.test(t) ||
      new RegExp(String.raw`\b${HONORIFIC}\s+${CAP_NAME}`).test(t) ||
      relationNamed(t) ||
      firstNameBigram(t),
  },
  {
    kind: "dob",
    test: (t) => /\b(?:date of birth|dob|born on|birth date|birthdate)\b/i.test(t),
  },
  {
    kind: "birthplace",
    test: (t) =>
      /\b(?:i|we|he|she|they) (?:was|were|am|are|is) born (?:in|at)\b/i.test(t) ||
      /\bi'?m born in\b/i.test(t) ||
      /\bwhere (?:i|we) (?:was|were) born\b/i.test(t) ||
      /\b(?:my|our) (?:birthplace|place of birth|country of birth|country|home country|homeland|native country)\b/i.test(
        t,
      ) ||
      /\b(?:country|place|city) of birth\b/i.test(t) ||
      /\b(?:i|we) (?:came|moved|immigrated|migrated|arrived) (?:here )?from\b/i.test(t) ||
      /\b(?:[Ii] am|[Ii]'m|[Ww]e are|[Ww]e're|[Mm]y (?:family|mom|dad|mother|father|parents) (?:is|are)) from (?:the )?[A-Z]/.test(
        t,
      ) ||
      /\b(?:[Ii] am|[Ii]'m|[Ww]e are|[Ww]e're|[Hh]e is|[Hh]e's|[Ss]he is|[Ss]he's|[Tt]hey are|[Tt]hey're) from\s+(?:the\s+)?[A-Z]/.test(t),
  },
  {
    kind: "nationality",
    test: (t) =>
      new RegExp(
        String.raw`\b(?:i am|i'm|we are|we're|he is|he's|she is|she's|they are|they're|my (?:family|mom|dad|mother|father|parents|grandparents) (?:is|are)) (?:an? )?(?:${NATIONALITIES})\b`,
        "i",
      ).test(t) || /\b(?:my|our) (?:nationality|ethnicity|ethnic background|race|caste)\b/i.test(t),
  },
  {
    kind: "immigration",
    test: (t) =>
      /\b(?:visa|green card|undocumented|illegal alien|asylum|deport(?:ed|ation|ing)?|work permit|daca|immigration status|citizenship status|refugee status|permanent resident)\b/i.test(
        t,
      ) || /\b(?:my|our|his|her|their) (?:citizenship|immigration|legal status)\b/i.test(t),
  },
  {
    kind: "disability",
    test: (t) =>
      /\b(?:iep|i\.e\.p\.?|504 plan|section 504|sped|special ed(?:ucation)?|special needs|learning disabilit(?:y|ies)|disabilit(?:y|ies)|dyslexi[ac]|adhd|autis(?:m|tic)|resource room)\b/i.test(
        t,
      ),
  },
  {
    kind: "program",
    test: (t) =>
      /\b(?:ESOL|ESL|ELL|ELLs|MLL|SPED|IEP|FARMS)\b/.test(t) ||
      /\b(?:english (?:language )?learners?|esol student|newcomer program|gifted and talented|free and reduced)\b/i.test(
        t,
      ),
  },
  {
    kind: "income",
    test: (t) =>
      /\b(?:free lunch|reduced lunch|reduced[- ]price lunch|food stamps|snap benefits|welfare|section 8|public housing|low[- ]income|family income|household income|my parents? (?:make|earn)|(?:my|our) (?:family|mom|dad|parents) (?:is|are) (?:poor|broke|homeless))\b/i.test(
        t,
      ) || /\b(?:i am|i'm|we are|we're|he is|he's|she is|she's|they are|they're) (?:poor|broke|homeless)\b/i.test(t),
  },
];

/** "my friend Maria", "my teacher is Mr. Neft", "my mom named Ana" (a capitalised name must follow). */
function relationNamed(t) {
  const lead =
    /\bmy (?:best |little |big |new )?(?:friend|friends|classmate|cousin|sister|brother|mom|dad|mother|father|teacher|neighbor|neighbour|aunt|uncle|grandma|grandpa|stepdad|stepmom|babysitter|coach)\s*,?\s*(?:is |named |called |was )?/gi;
  let m = lead.exec(t);
  while (m) {
    const rest = t.slice(m.index + m[0].length);
    if (new RegExp(String.raw`^(?:${HONORIFIC}\s+)?${CAP_NAME}\b`).test(rest)) return true;
    m = lead.exec(t);
  }
  return false;
}

/** "Maria Lopez": a curated first name followed by a capitalised surname. */
function firstNameBigram(t) {
  const re = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
  let m = re.exec(t);
  while (m) {
    if (FIRST_NAME_SET.has(m[1])) return true;
    re.lastIndex = m.index + m[1].length; // overlapping bigrams: "x Maria Lopez"
    m = re.exec(t);
  }
  return false;
}

/** Run a rule set over text. Exposed so tests can prove every rule is exercised by the corpus. */
export function scan(text, rules = RULES) {
  if (typeof text !== "string" || !text) return { found: false, kinds: [] };
  const clean = text.normalize("NFKC").replace(ALIAS_RE, " ").replace(/\s+/g, " ");
  const kinds = rules.filter((r) => r.test(clean)).map((r) => r.kind);
  return { found: kinds.length > 0, kinds: [...new Set(kinds)] };
}

export const detectPII = (text) => scan(text, RULES);

export const PII_REJECTION_STATUS = 422;

/**
 * Server guard for one free-text field. Returns null when the value is clean (or not a
 * string), otherwise a 422 JSON Response naming the FIELD and rule KINDS, never the text.
 * Call before any storage or logging of the value.
 */
export function rejectIfPII(value, field) {
  const { found, kinds } = detectPII(value);
  if (!found) return null;
  return new Response(
    JSON.stringify({
      ok: false,
      error: `${field} appears to contain personal information. Remove names, contact details and personal circumstances, and use a Star alias if you need a name.`,
      field,
      kinds,
    }),
    {
      status: PII_REJECTION_STATUS,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  );
}
