// Student-written problems for a class game. A student writes a problem and its answer and gets a share code
// (SP1.<base64url>) to hand to the teacher; nothing is sent anywhere. The teacher pastes codes into the Team Relay
// setup, reads each problem, and approves it before it can appear in the deck. Pure codec, a safe arithmetic check
// that flags an answer that does not match a bare expression, and the saved deck for the device.
import { evaluateExpression } from "./accommodations.js";
import { readLocal, writeLocal } from "./school-tools.js";

export const DECK_KEY = "ewl-fluency-relay-deck-v1";
export const MAX_DECK = 40;
export const QUESTION_MIN = 8;
export const QUESTION_MAX = 160;
export const ANSWER_MAX = 24;

const toB64 = (text) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const fromB64 = (text) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0)),
  );
const tidy = (value, max) => String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

// Returns { question, answer } or an error key ("question" | "answer") for the form to name.
export function cleanStudentProblem(value) {
  const question = tidy(value?.question, QUESTION_MAX);
  const answer = tidy(value?.answer, ANSWER_MAX);
  if (question.length < QUESTION_MIN) return { error: "question" };
  if (!answer) return { error: "answer" };
  return { question, answer };
}

export function encodeStudentProblem(value) {
  const clean = cleanStudentProblem(value);
  return clean.error ? null : `SP1.${toB64(JSON.stringify([clean.question, clean.answer]))}`;
}

export function decodeStudentProblem(code) {
  const match = /^SP1\.([\w-]{1,700})$/.exec(String(code || "").trim());
  if (!match) return null;
  try {
    const [question, answer] = JSON.parse(fromB64(match[1]));
    const clean = cleanStudentProblem({ question, answer });
    return clean.error ? null : clean;
  } catch {
    return null;
  }
}

const NUMBER = /^-?\d[\d,]*(\.\d+)?$/;
// A Team Relay card (the shape the game's validateAnswer and renderer read) for an approved problem.
export function cardFromStudentProblem({ question, answer }) {
  const numeric = NUMBER.test(answer);
  return {
    question,
    answers: [numeric ? answer.replaceAll(",", "") : answer],
    kind: numeric ? "number" : "text",
    steps: [],
    hint: "",
    studentWritten: true,
  };
}

// "ok" when a bare expression ("12 × 3 + 4") evaluates to the answer, "mismatch" when it does not, "unchecked"
// for a word problem (the teacher checks it by reading it).
export function arithmeticCheck({ question, answer }) {
  const bare = question.replace(/\s*=\s*\??\s*$/, "");
  if (!/^[\d\s.()+\-−×÷*/]+$/.test(bare) || !/\d\s*[+\-−×÷*/]\s*[\d(]/.test(bare)) return "unchecked";
  const value = evaluateExpression(bare);
  const given = NUMBER.test(answer) ? Number(answer.replaceAll(",", "")) : NaN;
  if (value === null || Number.isNaN(given)) return "unchecked";
  return Math.abs(value - given) < 1e-9 ? "ok" : "mismatch";
}

// ---- the deck kept on the teacher's device: [{ code, approved }] ----
export function cleanDeck(value) {
  const seen = new Set();
  const out = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const code = String(entry?.code ?? "").trim();
    if (out.length >= MAX_DECK || seen.has(code) || !decodeStudentProblem(code)) continue;
    seen.add(code);
    out.push({ code, approved: entry.approved === true });
  }
  return out;
}

export const loadDeck = () => cleanDeck(readLocal(DECK_KEY, []));
export const saveDeck = (deck) => writeLocal(DECK_KEY, cleanDeck(deck));

// Pasted text with one code per line (or space/comma separated): adds new valid codes unapproved.
// Returns { deck, added, skipped } where skipped counts lines that are not a valid code or are already there.
export function addCodes(deck, text) {
  const tokens = String(text || "").split(/[\s,;]+/).filter(Boolean);
  const next = [...deck];
  let added = 0;
  let skipped = 0;
  for (const token of tokens) {
    if (next.length >= MAX_DECK || next.some((entry) => entry.code === token) || !decodeStudentProblem(token)) {
      skipped += 1;
      continue;
    }
    next.push({ code: token, approved: false });
    added += 1;
  }
  return { deck: next, added, skipped };
}

export const approvedCards = (deck) =>
  deck.filter((entry) => entry.approved).map((entry) => cardFromStudentProblem(decodeStudentProblem(entry.code)));
