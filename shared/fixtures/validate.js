/**
 * Fixture validator: rejects anything that could be a real person's data.
 *  - student names are exactly "Star N" (1 <= N <= 28); no other name-like key exists
 *  - keys naming personal or background attributes are forbidden (checked by word token)
 *  - strings that look like email, phone, SSN, URL, or free text (> 64 chars) are forbidden
 *  - ids are lowercase slugs; node ids are dotted lowercase slugs
 * Deliberately independent of any other PII scanner in the repo.
 */

export const ALIAS = /^Star \d{1,2}$/;
const CLASS_NAME = /^Fixture class [a-z0-9-]+$/;
const SLUG = /^[a-z0-9][a-z0-9_-]*$/;
const NODE = /^[a-z0-9][a-z0-9._-]*$/;
const MAX_STRING = 64;

const FORBIDDEN_KEY_TOKENS = new Set([
  "birth",
  "birthplace",
  "birthday",
  "dob",
  "country",
  "nation",
  "nationality",
  "citizenship",
  "citizen",
  "immigration",
  "visa",
  "status",
  "caste",
  "income",
  "lunch",
  "disability",
  "iep",
  "sped",
  "program",
  "ssn",
  "passport",
  "address",
  "phone",
  "email",
  "race",
  "ethnicity",
  "religion",
  "guardian",
  "parent",
  "language",
  "home",
  "notes",
  "comment",
  "id_number",
]);

const STRING_PATTERNS = [
  ["email", /\S+@\S+/],
  ["url", /https?:\/\/|www\./i],
  ["ssn", /\b\d{3}-\d{2}-\d{4}\b/],
  ["phone", /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/],
];

const tokens = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

function walk(value, path, errors) {
  if (typeof value === "string") {
    if (value.length > MAX_STRING)
      errors.push(`${path}: string over ${MAX_STRING} chars (free text is not allowed)`);
    for (const [label, re] of STRING_PATTERNS) {
      if (re.test(value)) errors.push(`${path}: looks like ${label}`);
    }
    return;
  }
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`, errors));
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      const bad = tokens(key).find((t) => FORBIDDEN_KEY_TOKENS.has(t));
      if (bad) errors.push(`${path}.${key}: forbidden field ("${bad}")`);
      if (key !== "name" && tokens(key).includes("name"))
        errors.push(`${path}.${key}: only "name" holds an alias`);
      walk(v, `${path}.${key}`, errors);
    }
  }
}

function checkClass(cls, path, errors) {
  if (typeof cls?.name !== "string" || !CLASS_NAME.test(cls.name))
    errors.push(`${path}.name: must be "Fixture class <slug>"`);
  if (!SLUG.test(cls?.id ?? "")) errors.push(`${path}.id: not a slug`);
  const seen = new Set();
  (cls?.students ?? []).forEach((s, i) => {
    const at = `${path}.students[${i}]`;
    const match = typeof s?.name === "string" && ALIAS.test(s.name) ? Number(s.name.slice(5)) : 0;
    if (!(match >= 1 && match <= 28))
      errors.push(`${at}.name: "${s?.name}" is not an alias "Star 1".."Star 28"`);
    if (seen.has(s?.name)) errors.push(`${at}.name: duplicate alias "${s.name}"`);
    seen.add(s?.name);
    if (!SLUG.test(s?.id ?? "")) errors.push(`${at}.id: not a slug`);
  });
}

function checkAttempts(attempts, path, errors) {
  attempts.forEach((a, i) => {
    const at = `${path}[${i}]`;
    if (!SLUG.test(a?.studentId ?? "")) errors.push(`${at}.studentId: not a slug`);
    if (!NODE.test(a?.nodeId ?? "")) errors.push(`${at}.nodeId: not a dotted slug`);
    if (Number.isNaN(Date.parse(a?.ts))) errors.push(`${at}.ts: not an ISO timestamp`);
  });
}

/** @returns {{ok: boolean, errors: string[]}} accepts a class, a history array, or a corpus. */
export function validateFixture(value) {
  const errors = [];
  walk(value, "$", errors);
  if (Array.isArray(value)) checkAttempts(value, "$", errors);
  else if (value?.students) checkClass(value, "$", errors);
  else if (value?.classes) {
    value.classes.forEach((c, i) => checkClass(c, `$.classes[${i}]`, errors));
    for (const [id, list] of Object.entries(value.histories ?? {}))
      checkAttempts(list, `$.histories.${id}`, errors);
  }
  return { ok: errors.length === 0, errors };
}

export function assertFixture(value) {
  const { ok, errors } = validateFixture(value);
  if (!ok) throw new Error(`fixture rejected:\n${errors.slice(0, 10).join("\n")}`);
  return value;
}
