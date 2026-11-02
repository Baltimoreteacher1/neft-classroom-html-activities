// The writing portfolio: finished paragraphs kept on this device, one slot list per learner profile. Nothing here
// grades a piece; it stores the learner's own words, the organizer used, and which of the four language moves the
// writing already shows (read with the same checks as the math journal).
import { analyze } from "./language-journal.js";
import { readJson, writeJson } from "./language-settings.js";
import { MAX_PIECES, ORGANIZERS } from "./writing-organizers.js";

const KEY = "ewl-writing-pieces-v1";
const BOX_TEXT = 900;
const ids = new Set(ORGANIZERS.map((organizer) => organizer.id));

const cleanBoxes = (boxes) => {
  const out = {};
  for (const [id, text] of Object.entries(boxes && typeof boxes === "object" ? boxes : {})) {
    const clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, BOX_TEXT);
    if (/^[a-z]{2,10}$/.test(id) && clean && !clean.includes("___")) out[id] = clean;
  }
  return out;
};

const finish = (text) => (/[.!?¡¿]$/.test(text) ? text : `${text}.`);

// "all" holds a response written as one block (test view); otherwise the boxes join in organizer order.
export const joinParagraph = (organizer, boxes) =>
  boxes.all
    ? finish(String(boxes.all).trim())
    : organizer.boxes
        .map((box) => String(boxes[box.id] || "").trim())
        .filter(Boolean)
        .map((text) => (/[.!?¡¿]$/.test(text) ? text : `${text}.`))
        .join(" ");

const cleanPiece = (piece, index = 0) => {
  if (!piece || typeof piece !== "object" || !ids.has(piece.organizer)) return null;
  const boxes = cleanBoxes(piece.boxes);
  if (!Object.keys(boxes).length) return null;
  const at = Number.isFinite(piece.at) ? Math.floor(piece.at) : 0;
  const organizer = ORGANIZERS.find((entry) => entry.id === piece.organizer);
  const text = joinParagraph(organizer, boxes);
  const read = analyze(text);
  return {
    id:
      typeof piece.id === "string" && /^[\w-]{1,40}$/.test(piece.id) ? piece.id : `w${at}-${index}`,
    at,
    day: /^\d{4}-\d{2}-\d{2}$/.test(String(piece.day)) ? piece.day : "",
    grade: Number.isInteger(piece.grade) && piece.grade >= 1 && piece.grade <= 8 ? piece.grade : 0,
    skill: /^[\w:-]{1,40}$/.test(String(piece.skill)) ? piece.skill : "",
    organizer: piece.organizer,
    lang: piece.lang === "es" ? "es" : "en",
    level: [1, 2, 3, 4].includes(piece.level) ? piece.level : 2,
    problem: String(piece.problem || "").slice(0, 240),
    boxes,
    moves: read.moves,
  };
};

export const cleanPieces = (value) =>
  Array.isArray(value) ? value.map(cleanPiece).filter(Boolean).slice(0, MAX_PIECES) : [];
export const loadPieces = () => cleanPieces(readJson(KEY, []));
export const savePieces = (pieces) => writeJson(KEY, cleanPieces(pieces));

// Returns the saved piece, or null when there is nothing to keep or the browser could not save.
export function addPiece(fields) {
  const piece = cleanPiece({ ...fields, id: `w${Date.now().toString(36)}`, at: Date.now() });
  if (!piece) return null;
  return savePieces([piece, ...loadPieces()]) ? piece : null;
}

export const removePiece = (id) => savePieces(loadPieces().filter((piece) => piece.id !== id));
