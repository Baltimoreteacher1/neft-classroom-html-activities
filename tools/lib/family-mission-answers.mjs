// ANSWER KEYS: recompute a practice item's answer from its own stem, independently of the stored
// key, using exact rational arithmetic (scripts/lib/rational.mjs). Only stems whose shape is
// recognised are recomputed; the rest are counted as un-checkable and reported honestly.
import {
  evaluateExpression,
  matchesAnswer,
  parseAnswerValue,
  Rat,
  stripUnits,
} from "../../scripts/lib/rational.mjs";

const NUM = String.raw`-?\$?\d[\d,]*(?:\.\d+)?`;
const clean = (s) => String(s).replace(/[$,]/g, "");
const ev = (s) => evaluateExpression(String(s).replace(/\$/g, ""));

const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const ints = (s) => (s.match(/-?\d+/g) || []).map((n) => BigInt(n));
const rat = (n) => new Rat(BigInt(n));

/** Each rule: [regex on the stem, (match) => Rat | null]. First matching rule decides. */
const RULES = [
  [
    new RegExp(`^What is (${NUM})% of (${NUM})\\?$`, "i"),
    (m) => ev(`${clean(m[1])}% × ${clean(m[2])}`),
  ],
  [
    new RegExp(`^(${NUM}) is (${NUM})% of what( number| amount)?\\?$`, "i"),
    (m) => ev(`${clean(m[1])} ÷ (${clean(m[2])}%)`),
  ],
  [
    new RegExp(`^What percent of (${NUM}) is (${NUM})\\?$`, "i"),
    (m) => ev(`${clean(m[2])} ÷ ${clean(m[1])}`),
  ],
  [
    new RegExp(`^(${NUM}) is what percent of (${NUM})\\?$`, "i"),
    (m) => ev(`${clean(m[1])} ÷ ${clean(m[2])}`),
  ],
  [
    new RegExp(`^Write (${NUM}) out of (${NUM}) as a percent\\.?$`, "i"),
    (m) => ev(`${clean(m[1])} ÷ ${clean(m[2])}`),
  ],
  [/^Write ([\d.]+(?:\s\d+)?(?:\/\d+)?) as a percent\.?$/i, (m) => ev(m[1])],
  [/^Write ([\d.]+(?:\s\d+)?(?:\/\d+)?%?) as a decimal\.?$/i, (m) => ev(m[1])],
  [/^Write ([\d\s]+\/\d+) as an improper fraction\.?$/i, (m) => ev(m[1])],
  [/^What is the reciprocal of (\d+)\/(\d+)\?$/i, (m) => ev(`${m[2]}/${m[1]}`)],
  [
    /^What is the opposite of ([−-]?[\d./]+)\?$/i,
    (m) => {
      const abs = ev(m[1].replace(/^[−-]/, ""));
      return /^[−-]/.test(m[1]) ? abs : abs?.neg();
    },
  ],
  [/^What is \|([−-]?[\d./]+)\|\?$/i, (m) => ev(m[1].replace(/^[−-]/, ""))],
  [
    /^What is the (?:LCM|least common multiple) of (\d+) and (\d+)\?$/i,
    (m) => {
      const [a, b] = ints(`${m[1]} ${m[2]}`);
      return rat((a * b) / gcd(a, b));
    },
  ],
  [
    /^What is the (?:GCF|greatest common factor) of (\d+) and (\d+)\?$/i,
    (m) => rat(gcd(...ints(`${m[1]} ${m[2]}`))),
  ],
  [/^What is the median of ([\d,\s.]+)\?$/i, (m) => median(m[1])],
  [/^What is the value of ([^A-Za-z?]+?)\s*\?$/i, (m) => ev(m[1])],
  [
    new RegExp(`^(${NUM}) is (${NUM})% of a number\\.? What is the number\\?$`, "i"),
    (m) => ev(`${clean(m[1])} ÷ (${clean(m[2])}%)`),
  ],
  [/^Convert (\d+(?:\.\d+)?(?:\s\d+)?(?:\/\d+)?) to a percent\.?$/i, (m) => ev(m[1])],
  [
    /^Find the (?:LCM|least common multiple) of (\d+) and (\d+)\.?$/i,
    (m) => {
      const [a, b] = ints(`${m[1]} ${m[2]}`);
      return rat((a * b) / gcd(a, b));
    },
  ],
  [
    /^What is \|([−-]?\d+)\| \+ \|([−-]?\d+)\|\?$/i,
    (m) => ev(`${m[1].replace(/^[−-]/, "")} + ${m[2].replace(/^[−-]/, "")}`),
  ],
  [
    /^A trapezoid has (?:parallel )?bases of (\d+(?:\.\d+)?)(?: \w+)? and (\d+(?:\.\d+)?)(?: \w+)?,? and a height of (\d+(?:\.\d+)?)(?: \w+)?\.? What is its area\?$/i,
    (m) => ev(`(${m[1]} + ${m[2]}) × ${m[3]} ÷ 2`),
  ],
  [
    /^A box is (\d+(?:\.\d+)?)\s?\w* long,? (\d+(?:\.\d+)?)\s?\w* wide,? and (\d+(?:\.\d+)?)\s?\w* tall\.? What is its volume\?$/i,
    (m) => ev(`${m[1]} × ${m[2]} × ${m[3]}`),
  ],
  [
    /^A cube has edges of (\d+(?:\.\d+)?) ?\w+\.? What is its surface area\?$/i,
    (m) => ev(`6 × ${m[1]} × ${m[1]}`),
  ],
  [
    /^A triangle has an area of (\d+(?:\.\d+)?) ?\w+² and a base of (\d+(?:\.\d+)?) ?\w+\.? What is its height\?$/i,
    (m) => ev(`2 × ${m[1]} ÷ ${m[2]}`),
  ],
  [
    /^Change (\d+(?:\.\d+)?) ounces to pounds\.? \(1 pound = (\d+) ounces\)$/i,
    (m) => ev(`${m[1]} ÷ ${m[2]}`),
  ],
  [
    new RegExp(
      `^\\w+ earns (${NUM}) for every (\\d+(?:\\.\\d+)?) hours? of work\\.? How much does \\w+ earn in (\\d+(?:\\.\\d+)?) hours\\?$`,
      "i",
    ),
    (m) => ev(`${clean(m[1])} ÷ ${m[2]} × ${m[3]}`),
  ],
  [
    /^What is the value of (.+) when ([a-z]) = (-?\d+(?:\.\d+)?)\?$/i,
    (m) => substitute(m[1], m[2], m[3]),
  ],
  [
    /^What is the area of a (parallelogram|rectangle) with base (\d+(?:\.\d+)?) \w+ and height (\d+(?:\.\d+)?) \w+\?$/i,
    (m) => ev(`${m[2]} × ${m[3]}`),
  ],
  [
    /^What is the area of a triangle with base (\d+(?:\.\d+)?) \w+ and height (\d+(?:\.\d+)?) \w+\?$/i,
    (m) => ev(`${m[1]} × ${m[2]} ÷ 2`),
  ],
  [
    /^What is the volume of a rectangular prism with l = (\d+(?:\.\d+)?) \w+, w = (\d+(?:\.\d+)?) \w+,? h = (\d+(?:\.\d+)?) \w+\?$/i,
    (m) => ev(`${m[1]} × ${m[2]} × ${m[3]}`),
  ],
  [
    new RegExp(
      `^(?:A|An) .*?(${NUM}) (?:\\w+ )?(?:for|in|using) (\\d[\\d.]*) \\w+.*unit (?:rate|price)`,
      "i",
    ),
    (m) => ev(`${clean(m[1])} ÷ ${m[2]}`),
  ],
  [
    /^Solve:?\s*([a-z])\s*\+\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\.?$/i,
    (m) => ev(`${m[3]} - ${m[2]}`),
  ],
  [
    /^Solve:?\s*([a-z])\s*[−-]\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\.?$/i,
    (m) => ev(`${m[3]} + ${m[2]}`),
  ],
  [
    /^Solve:?\s*(\d+(?:\.\d+)?)\s*([a-z])\s*=\s*(\d+(?:\.\d+)?)\.?$/i,
    (m) => ev(`${m[3]} ÷ ${m[1]}`),
  ],
  [
    /^Solve:?\s*(\d+(?:\.\d+)?)\s*[×*]\s*([a-z])\s*=\s*(\d+(?:\.\d+)?)\.?$/i,
    (m) => ev(`${m[3]} ÷ ${m[1]}`),
  ],
  [
    /^Solve:?\s*(\d+(?:\.\d+)?)\s*[×*]\s*([a-z])\s*=\s*(\d+(?:\.\d+)?)\.?$/i,
    (m) => ev(`${m[3]} ÷ ${m[1]}`),
  ],
  // "What is 3.6 ÷ 0.4?", "Find 2 1/2 ÷ 1/4.", "Evaluate 3 + 4 × 2" — any pure arithmetic after the verb.
  [
    /^(?:What is|Find|Evaluate|Compute|Calculate|Simplify)\s*:?\s+([^A-Za-z?]+?)\s*[?.]?$/i,
    (m) => ev(m[1]),
  ],
  [/^What is (\d+)\/(\d+) of (\d+)\?$/i, (m) => ev(`${m[1]}/${m[2]} × ${m[3]}`)],
];

function median(list) {
  const v = list
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((n) => Rat.fromDecimal(n))
    .filter(Boolean)
    .sort((a, b) => (a.sub(b).n < 0n ? -1 : a.sub(b).n > 0n ? 1 : 0));
  if (!v.length) return null;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : v[mid - 1].add(v[mid]).div(rat(2));
}

function substitute(expression, variable, value) {
  const withValue = expression
    .replace(new RegExp(`(\\d)\\s*${variable}`, "gi"), `$1*(${value})`)
    .replace(new RegExp(variable, "gi"), `(${value})`);
  return ev(withValue);
}

/** Leading number of an answer such as "30 miles per gallon" or "$0.50 per game"; null when none. */
function leadingNumber(text) {
  const t = String(text).trim();
  const mixed = /^(-?\d+)\s+(\d+)\/(\d+)/.exec(t);
  if (mixed) return ev(`${mixed[1]} ${mixed[2]}/${mixed[3]}`);
  const m = /^-?\$?\s*(-?[\d,]*\.?\d+(?:\/\d+)?)(\s?%)?/.exec(t.replace(/^[−–]/, "-"));
  if (!m) return null;
  return ev(
    `${clean(t.startsWith("-") || t.startsWith("−") ? "-" : "")}${clean(m[1])}${m[2] ? "%" : ""}`,
  );
}

export const statedValue = (text) => parseAnswerValue(text) ?? leadingNumber(text);

/**
 * Recompute one multiple-choice item.
 * @returns {{status: "ok"|"mismatch"|"uncheckable", expected?: string, stored?: string}}
 */
export function checkItem(item) {
  if (item.type !== "multiple-choice") return { status: "uncheckable" };
  const stem = item.stemEn.replace(/\s+/g, " ").trim();
  const correct = item.choices.find((c) => c.value === item.correctValue);
  if (!correct)
    return {
      status: "mismatch",
      stored: "(no choice carries the stored key)",
      expected: "one correct choice",
    };
  for (const [re, fn] of RULES) {
    const m = re.exec(stem);
    if (!m) continue;
    let expected = null;
    try {
      expected = fn(m);
    } catch {
      expected = null;
    }
    const stored = statedValue(correct.en);
    if (!expected || !stored) return { status: "uncheckable", recognised: true };
    const ok = matchesAnswer(expected, correct.en) ?? expected.eq(stored);
    return ok
      ? { status: "ok" }
      : { status: "mismatch", expected: expected.toString(), stored: correct.en };
  }
  return { status: "uncheckable" };
}

/** Whole-choice value and unit ("24 cubic inches" -> 24 + "cubic inches"); null unless the text is only a quantity. */
const PLAIN_QUANTITY =
  /^[−-]?\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?%?(?:\s+[a-z²³]+(?:\s+[a-z²³]+)*)?\.?$/i;

function quantity(text) {
  if (!PLAIN_QUANTITY.test(String(text).trim())) return null; // forms, ranges and expressions can differ on purpose
  const { text: bare, unit } = stripUnits(String(text).trim());
  const value = ev(bare);
  return value ? { value, unit: unit.toLowerCase() } : null;
}

/** A wrong choice that states the same quantity as the keyed one makes the item unanswerable. */
function duplicateOfKey(item) {
  if (item.type !== "multiple-choice") return null;
  const correct = item.choices.find((c) => c.value === item.correctValue);
  const key = correct && quantity(correct.en);
  if (!key) return null;
  const twin = item.choices.find((c) => {
    const q = c !== correct && quantity(c.en);
    return q && q.value.eq(key.value) && q.unit === key.unit;
  });
  return twin ? { key: correct.en, twin: twin.en } : null;
}

export function answerChecks(page) {
  const out = [];
  const tally = { ok: 0, mismatch: 0, uncheckable: 0, duplicate: 0 };
  for (const item of page.problems) {
    const dup = duplicateOfKey(item);
    if (dup) {
      tally.duplicate++;
      out.push({
        rule: "ANSWER_DUPLICATE",
        lesson: page.id,
        field: `problem ${item.index + 1} (${item.tier})`,
        quote: item.stemEn.slice(0, 140),
        detail: `choice "${dup.twin}" has the same value as the keyed "${dup.key}"`,
      });
    }
    const r = checkItem(item);
    tally[r.status]++;
    if (r.status === "mismatch")
      out.push({
        rule: "ANSWER_KEY",
        lesson: page.id,
        field: `problem ${item.index + 1} (${item.tier})`,
        quote: item.stemEn.slice(0, 140),
        detail: `stored answer "${r.stored}" but the stem recomputes to ${r.expected}`,
      });
  }
  return { findings: out, tally };
}
