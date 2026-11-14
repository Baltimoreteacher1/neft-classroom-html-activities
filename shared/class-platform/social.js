/* =============================================================================
 * Class social features (Language Page): peer listening pairs and student-made
 * scenes. ONE set of rules used by the server (functions/_lib/class-platform/
 * pairs.js, scenes.js) and the browser (access-practice-lab/src/class/social-*.js),
 * so the client can warn early and the server refuses the same things.
 *
 * Safety: every free-text field goes through `checkText` (length, no email, no
 * phone number, no link, a basic word list in English and Spanish). Peer
 * reactions are a fixed list; there are no free-text comments between students.
 * ========================================================================== */

import { cleanText } from "./contract.js";

/** A peer take is kept this long, then it is gone from every read and swept on cleanup. */
export const PEER_TAKE_DAYS = 14;
export const MAX_TAKE_SECONDS = 60;
export const MAX_LIVE_TAKES = 10; // per student, unexpired
export const MAX_SCENES_OPEN = 5; // per student, not yet approved
export const MAX_SCENES_CLASS = 200;

const Q = (en, es) => Object.freeze([en, es]);

/** The one question a partner answers after listening. */
export const LISTENER_QUESTIONS = Object.freeze({
  "first-step": Q("What was the first step?", "¿Cuál fue el primer paso?"),
  "one-detail": Q("What was one detail?", "¿Cuál fue un detalle?"),
  "main-idea": Q("What was the main idea?", "¿Cuál fue la idea principal?"),
  "one-difference": Q("What was one difference?", "¿Cuál fue una diferencia?"),
  reason: Q("What was one reason?", "¿Cuál fue una razón?"),
  opinion: Q("What did the speaker think?", "¿Qué opina quien habló?"),
});

/** Speaking Studio task type -> the listener question that fits it. */
export const QUESTION_FOR_TYPE = Object.freeze({
  retell: "first-step",
  describe: "one-detail",
  compare: "one-difference",
  explain: "reason",
  argue: "opinion",
  discuss: "main-idea",
});

/** Kind reactions a partner can tap. Fixed list: no free-text comments. */
export const REACTIONS = Object.freeze({
  clear: Q("I understood you", "Te entendí"),
  brave: Q("Brave try", "Buen intento, con valor"),
  words: Q("Great words", "Muy buenas palabras"),
  order: Q("Easy to follow", "Fácil de seguir"),
  learned: Q("I learned something", "Aprendí algo"),
});

/** Settings a student scene can use (the Real-Life Scenarios places, scenario-art.js). */
export const SCENE_PLACES = Object.freeze([
  "office",
  "clinic",
  "bus",
  "lunch",
  "library",
  "classroom",
  "playground",
  "hallway",
  "phone",
  "store",
  "street",
  "pharmacy",
  "home",
]);

/** Who the learner talks to: the existing Real-Life Scenarios characters, by slug of their name. */
export const SCENE_CHARACTERS = Object.freeze([
  "ms-rivera",
  "nurse-okafor",
  "mr-abdi",
  "mei",
  "noor",
  "mr-tanaka",
  "ms-patel",
  "jonah",
  "aaliyah",
  "tyrone",
  "kwame",
  "ms-dubois",
  "mr-okafor",
  "ms-nakamura",
  "yusuf",
  "mr-alvarez",
  "mr-haddad",
  "dr-okafor",
  "mrs-nguyen",
  "mr-mensah",
  "dr-patel",
  "ms-brooks",
  "mr-torres",
  "mr-asante",
  "ms-moreno",
]);
export const characterSlug = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const SCENE_LIMITS = Object.freeze({
  title: 40,
  situation: 200,
  line: 120,
  reply: 120,
  why: 160,
  note: 200,
  answer: 100,
  maxLines: 3,
  minGood: 2,
  maxGood: 3,
});

// A short guard list (whole words, after undoing common letter swaps). It is a floor, not a filter of record:
// the teacher still reads every scene before classmates can see it.
const BLOCKED_WORDS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "dick",
  "pussy",
  "cunt",
  "slut",
  "whore",
  "fag",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "retarded",
  "puta",
  "puto",
  "mierda",
  "pendejo",
  "pendeja",
  "cabron",
  "cabrón",
  "chinga",
  "chingada",
  "verga",
  "culero",
  "joder",
  "coño",
  "maricon",
  "maricón",
];
const BLOCKED = new Set(BLOCKED_WORDS);
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s" };

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const AT_RE = /@\w/;
const URL_RE =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|edu|gov|io|co|me|ly|app|xyz|info|tv|gg)\b)/i;
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/;

/** Classify free text. Returns { ok: true, text } (trimmed) or { ok: false, error }. */
export function checkText(raw, max, { required = true } = {}) {
  if (raw != null && typeof raw !== "string") return { ok: false, error: "text-invalid" };
  const text = cleanText(raw ?? "", max + 1);
  if (!text) return required ? { ok: false, error: "text-empty" } : { ok: true, text: "" };
  if (text.length > max) return { ok: false, error: "text-too-long" };
  if (EMAIL_RE.test(text) || AT_RE.test(text)) return { ok: false, error: "text-contact" };
  if (URL_RE.test(text)) return { ok: false, error: "text-link" };
  if (PHONE_RE.test(text) && text.replace(/\D/g, "").length >= 7)
    return { ok: false, error: "text-contact" };
  const words = text
    .toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET[c] || c)
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
  if (words.some((w) => BLOCKED.has(w) || BLOCKED.has(w.replace(/(.)\1+/g, "$1"))))
    return { ok: false, error: "text-language" };
  return { ok: true, text };
}

/** A listener's answer to the take's question. */
export function validateReply(raw) {
  const answer = checkText(raw?.answer, SCENE_LIMITS.answer);
  if (!answer.ok) return answer;
  if (!Object.hasOwn(REACTIONS, raw?.reaction)) return { ok: false, error: "invalid-reaction" };
  return { ok: true, answer: answer.text, reaction: raw.reaction };
}

/** What a take is about: a Speaking Studio task (id + title) and one listener question. */
export function validateTakeMeta(raw) {
  const taskId = typeof raw?.taskId === "string" ? raw.taskId : "";
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(taskId)) return { ok: false, error: "invalid-task" };
  const title = checkText(raw?.taskTitle, 80);
  if (!title.ok) return { ok: false, error: "invalid-task" };
  if (!Object.hasOwn(LISTENER_QUESTIONS, raw?.questionId))
    return { ok: false, error: "invalid-question" };
  const seconds = Number(raw?.seconds);
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > MAX_TAKE_SECONDS + 2)
    return { ok: false, error: "take-too-long" };
  return {
    ok: true,
    taskId,
    taskTitle: title.text,
    questionId: raw.questionId,
    seconds: Math.round(seconds),
  };
}

const field = (raw, max, name) => {
  const r = checkText(raw, max);
  return r.ok ? r : { ok: false, error: r.error, field: name };
};

/**
 * A student scene: { title, place, character, situation, lines[1..3], good[2..3], rude: { say, why } }.
 * Every string is checked; anything not declared is dropped.
 */
export function validateScene(raw) {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid-scene" };
  if (!SCENE_PLACES.includes(raw.place)) return { ok: false, error: "invalid-place" };
  if (!SCENE_CHARACTERS.includes(raw.character)) return { ok: false, error: "invalid-character" };
  const L = SCENE_LIMITS;
  const title = field(raw.title, L.title, "title");
  if (!title.ok) return title;
  const situation = field(raw.situation, L.situation, "situation");
  if (!situation.ok) return situation;
  const list = (value, min, max, limit, name) => {
    if (!Array.isArray(value)) return { ok: false, error: `invalid-${name}` };
    const out = [];
    for (const item of value) {
      if (item == null || (typeof item === "string" && !item.trim())) continue;
      const r = field(item, limit, name);
      if (!r.ok) return r;
      out.push(r.text);
    }
    if (out.length < min || out.length > max) return { ok: false, error: `count-${name}` };
    return { ok: true, items: out };
  };
  const lines = list(raw.lines, 1, L.maxLines, L.line, "lines");
  if (!lines.ok) return lines;
  const good = list(raw.good, L.minGood, L.maxGood, L.reply, "good");
  if (!good.ok) return good;
  const rudeSay = field(raw.rude?.say, L.reply, "rude");
  if (!rudeSay.ok) return rudeSay;
  const rudeWhy = field(raw.rude?.why, L.why, "why");
  if (!rudeWhy.ok) return rudeWhy;
  return {
    ok: true,
    scene: {
      title: title.text,
      place: raw.place,
      character: raw.character,
      situation: situation.text,
      lines: lines.items,
      good: good.items,
      rude: { say: rudeSay.text, why: rudeWhy.text },
    },
  };
}

/** Shuffle a roster into pairs; an odd learner out joins the last pair as a trio. `rand` is injectable for tests. */
export function autoPair(ids, rand = Math.random) {
  const list = [...ids];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  const groups = [];
  for (let i = 0; i + 1 < list.length; i += 2) groups.push([list[i], list[i + 1]]);
  if (list.length % 2 && groups.length) groups.at(-1).push(list.at(-1));
  return groups;
}

/** Teacher-picked groups: 2 or 3 learners each, every id on the roster, nobody twice. */
export function validateGroups(groups, rosterIds) {
  if (!Array.isArray(groups) || groups.length > 40) return { ok: false, error: "invalid-groups" };
  const roster = new Set(rosterIds);
  const seen = new Set();
  for (const g of groups) {
    if (!Array.isArray(g) || g.length < 2 || g.length > 3)
      return { ok: false, error: "invalid-groups" };
    for (const id of g) {
      if (!roster.has(id) || seen.has(id)) return { ok: false, error: "invalid-groups" };
      seen.add(id);
    }
  }
  return { ok: true, groups: groups.map((g) => [...g]) };
}

/** The other members of a learner's group (their partners), or [] when not paired. */
export const partnersOf = (groups, studentId) =>
  (groups.find((g) => g.includes(studentId)) || []).filter((id) => id !== studentId);
