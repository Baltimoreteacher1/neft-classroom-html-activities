// Assignment extensions (difficulty tier range, mastery target, deadline, accommodations, audio-first, worked-example
// policy) and the short class code.
// Everything is carried in the link or code itself: there is no central database to look an assignment up in.
// Old links never carry these fields and keep decoding exactly as before.
import { ALL_SKILLS } from "./problem-bank.js";
import { cleanAccess, decodeAccess, encodeAccess } from "./accommodations.js";

export const TIER_MIN = 1;
export const TIER_MAX = 5;
export const TARGET_SCORE_MIN = 50;
export const TARGET_SCORE_MAX = 100;
export const TARGET_DAYS_MAX = 10;
const COUNTS = [5, 10, 15, 20];
const CHALLENGES = ["adaptive", "building", "grade-stretch"];
const LANGS = [undefined, "en", "es"];
// Worked-example policy: undefined keeps the lab's own rules (steps open for a learner who needs support),
// "after" offers the worked example only once a first answer is in, "hide" never offers one.
export const EXAMPLE_POLICIES = Object.freeze(["after", "hide"]);
const EPOCH = Date.UTC(2024, 0, 1);
const DAY_MS = 86400000;

const int = (value) => Math.floor(Number(value));
const inRange = (value, lo, hi) => Number.isInteger(value) && value >= lo && value <= hi;

// A due date is a calendar day, "YYYY-MM-DD", and must be a real one.
export function cleanDue(value) {
  const text = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(text) && time >= EPOCH
    ? text
    : null;
}

// Returns only the extension fields that are present and valid, so a plain assignment gains no new keys.
export function cleanExt(value) {
  const out = {};
  const tiers = Array.isArray(value?.tiers) ? value.tiers.map(int) : null;
  if (
    tiers?.length === 2 &&
    inRange(tiers[0], TIER_MIN, TIER_MAX) &&
    inRange(tiers[1], TIER_MIN, TIER_MAX) &&
    tiers[0] <= tiers[1]
  )
    out.tiers = tiers;
  const score = int(value?.target?.score);
  const days = int(value?.target?.days);
  if (inRange(score, TARGET_SCORE_MIN, TARGET_SCORE_MAX) && inRange(days, 1, TARGET_DAYS_MAX))
    out.target = { score, days };
  const due = cleanDue(value?.due);
  if (due) out.due = due;
  const access = cleanAccess(value?.access);
  if (access) out.access = access;
  if (value?.audioFirst === true) out.audioFirst = true;
  if (EXAMPLE_POLICIES.includes(value?.example)) out.example = value.example;
  return out;
}

// "t2-4.m80x2.d20261120" (parts in any combination). Empty when the assignment has none.
export function encodeExt(assignment) {
  const ext = cleanExt(assignment);
  return [
    ext.tiers ? `t${ext.tiers[0]}-${ext.tiers[1]}` : "",
    ext.target ? `m${ext.target.score}x${ext.target.days}` : "",
    ext.due ? `d${ext.due.replaceAll("-", "")}` : "",
    encodeAccess(ext.access),
    ext.audioFirst ? "u" : "",
    ext.example ? `w${ext.example[0]}` : "",
  ]
    .filter(Boolean)
    .join(".");
}

export function decodeExt(text) {
  const raw = {};
  for (const part of String(text || "").split(".")) {
    let match;
    if ((match = /^t([1-5])-([1-5])$/.exec(part))) raw.tiers = [Number(match[1]), Number(match[2])];
    else if ((match = /^m(\d{2,3})x(\d{1,2})$/.exec(part)))
      raw.target = { score: Number(match[1]), days: Number(match[2]) };
    else if ((match = /^d(\d{4})(\d{2})(\d{2})$/.exec(part)))
      raw.due = `${match[1]}-${match[2]}-${match[3]}`;
    else if (/^a[rsfc23]*$/.test(part)) raw.access = decodeAccess(part);
    else if (part === "u") raw.audioFirst = true;
    else if ((match = /^w([ah])$/.exec(part)))
      raw.example = EXAMPLE_POLICIES.find((policy) => policy[0] === match[1]);
  }
  return cleanExt(raw);
}

// ---- Short class code: FL4-XXXX-XXXX-... (Crockford base32, no label, skills only) ----
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_PREFIX = "FL4-";
export const isShortCode = (token) =>
  typeof token === "string" && /^FL4[-\s]/i.test(token.trim());

// A 16-bit fingerprint of a skill key. A code names skills by fingerprint within its grade, so it cannot
// break when the catalog gains a skill unless two skills of one grade collide (encode then refuses).
export function skillFingerprint(key) {
  let hash = 0x811c9dc5;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  return (hash ^ (hash >>> 16)) & 0xffff;
}
const gradeSkills = (grade) =>
  ALL_SKILLS.filter((skill) => skill.grade === grade).map((skill) => `${skill.grade}:${skill.id}`);

const pushBits = (bits, value, width) => {
  for (let shift = width - 1; shift >= 0; shift -= 1) bits.push((value >>> shift) & 1);
};
const readBits = (bits, state, width) => {
  let value = 0;
  for (let index = 0; index < width; index += 1) value = (value << 1) | (bits[state.at++] ?? 0);
  return value;
};
const checksum = (bits) => {
  let sum = 17;
  for (let index = 0; index < bits.length; index += 1)
    sum = (sum * 31 + bits[index] + index) & 0xff;
  return sum;
};

// Returns null when the assignment cannot be carried in a code (a game, a family session, an unknown skill, an
// accommodation profile, audio-first or a worked-example policy, or two skills of one grade that share a fingerprint). Callers then offer the link only.
export function encodeShortCode(assignment) {
  const ext = cleanExt(assignment);
  const keys = assignment?.keys || [];
  const grade = int(assignment?.grade);
  const countIndex = COUNTS.indexOf(assignment?.count);
  const challenge = CHALLENGES.indexOf(assignment?.challenge || "adaptive");
  const known = gradeSkills(grade);
  if (
    assignment?.game ||
    ext.access ||
    ext.audioFirst ||
    ext.example ||
    !keys.length ||
    keys.length > 10 ||
    countIndex < 0 ||
    challenge < 0 ||
    !inRange(grade, 0, 8)
  )
    return null;
  if (keys.some((key) => !known.includes(key))) return null;
  const prints = keys.map(skillFingerprint);
  const collide =
    known.filter((key) => prints.includes(skillFingerprint(key)) && !keys.includes(key)).length >
      0 || new Set(prints).size !== keys.length;
  if (collide) return null;
  const bits = [];
  pushBits(bits, 1, 3);
  pushBits(bits, grade, 4);
  pushBits(bits, countIndex, 3);
  pushBits(bits, assignment.mode === "guided" ? 1 : 0, 1);
  pushBits(bits, challenge, 2);
  pushBits(bits, Math.max(0, LANGS.indexOf(assignment.lang)), 2);
  pushBits(bits, ext.tiers ? 1 : 0, 1);
  if (ext.tiers) {
    pushBits(bits, ext.tiers[0] - 1, 3);
    pushBits(bits, ext.tiers[1] - 1, 3);
  }
  pushBits(bits, ext.target ? 1 : 0, 1);
  if (ext.target) {
    pushBits(bits, ext.target.score - TARGET_SCORE_MIN, 6);
    pushBits(bits, ext.target.days - 1, 4);
  }
  pushBits(bits, ext.due ? 1 : 0, 1);
  if (ext.due)
    pushBits(bits, Math.round((Date.parse(`${ext.due}T00:00:00Z`) - EPOCH) / DAY_MS), 15);
  pushBits(bits, keys.length, 4);
  for (const print of prints) pushBits(bits, print, 16);
  pushBits(bits, checksum(bits), 8);
  while (bits.length % 5) bits.push(0);
  let text = "";
  for (let index = 0; index < bits.length; index += 5)
    text += ALPHABET[readBits(bits, { at: index }, 5)];
  return CODE_PREFIX + text.match(/.{1,4}/g).join("-");
}

// Returns the raw assignment (no label) or null for a code that is malformed, mistyped or for another version.
export function decodeShortCode(code) {
  if (!isShortCode(code) || code.length > 200) return null;
  const body = code
    .trim()
    .slice(CODE_PREFIX.length)
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replaceAll("O", "0")
    .replace(/[IL]/g, "1");
  const bits = [];
  for (const char of body) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) return null;
    pushBits(bits, value, 5);
  }
  const state = { at: 0 };
  if (readBits(bits, state, 3) !== 1) return null;
  const grade = readBits(bits, state, 4);
  const count = COUNTS[readBits(bits, state, 3)];
  const mode = readBits(bits, state, 1) ? "guided" : "adaptive";
  const challenge = CHALLENGES[readBits(bits, state, 2)];
  const lang = LANGS[readBits(bits, state, 2)];
  const raw = {};
  if (readBits(bits, state, 1))
    raw.tiers = [readBits(bits, state, 3) + 1, readBits(bits, state, 3) + 1];
  if (readBits(bits, state, 1))
    raw.target = {
      score: readBits(bits, state, 6) + TARGET_SCORE_MIN,
      days: readBits(bits, state, 4) + 1,
    };
  if (readBits(bits, state, 1))
    raw.due = new Date(EPOCH + readBits(bits, state, 15) * DAY_MS).toISOString().slice(0, 10);
  const total = readBits(bits, state, 4);
  const prints = Array.from({ length: total }, () => readBits(bits, state, 16));
  const end = state.at;
  if (
    readBits(bits, state, 8) !== checksum(bits.slice(0, end)) ||
    !count ||
    !challenge ||
    !inRange(grade, 0, 8) ||
    !total
  )
    return null;
  const known = gradeSkills(grade);
  const keys = prints.map((print) => known.find((key) => skillFingerprint(key) === print));
  if (keys.some((key) => !key)) return null;
  return {
    version: 1,
    grade,
    keys,
    count,
    mode,
    challenge,
    ...(lang ? { lang } : {}),
    ...raw,
    label: "Class practice",
  };
}
